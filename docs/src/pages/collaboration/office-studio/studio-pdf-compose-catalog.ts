import {
  PDFArray,
  PDFBool,
  PDFDict,
  PDFHexString,
  PDFName,
  PDFNull,
  PDFNumber,
  PDFRef,
  PDFStream,
  PDFString,
  type PDFObject,
  type PDFDocument,
} from 'pdf-lib';
import { fail, name, read, resolve, text } from './studio-pdf-compose-utils';

import type {
  PdfComposeSourceState,
  PdfComposeScope,
  PdfPageInstance,
  StudioPdfComposeReport,
} from './studio-pdf-compose-types';
interface OutlineItem {
  source: PdfComposeSourceState;
  scope: PdfComposeScope;
  dict: PDFDict;
  path: string;
  children: OutlineItem[];
  destination?: PDFObject;
  action?: PDFObject;
  open: boolean;
  output?: PDFDict;
  ref?: PDFRef;
}
interface AllocatedOutlineItem extends Omit<OutlineItem, 'children' | 'output' | 'ref'> {
  children: AllocatedOutlineItem[];
  output: PDFDict;
  ref: PDFRef;
}
interface LabelRange {
  index: number;
  dict: PDFDict;
  style?: string;
  first: number;
}
interface ActionEntry {
  value: PDFObject;
  sourceId: string;
  path: string;
  destinationOnly?: boolean;
}
const PRIMARY_KEYS = [
  'Metadata',
  'PageLayout',
  'PageMode',
  'ViewerPreferences',
  'Lang',
  'Version',
  'Extensions',
];
const CATALOG_KEYS = new Set([
  'Type',
  'Pages',
  'AcroForm',
  'Names',
  'Dests',
  'Outlines',
  'OpenAction',
  'AA',
  'PageLabels',
  ...PRIMARY_KEYS,
]);
const OUTLINE_ROOT_KEYS = new Set(['Type', 'First', 'Last', 'Count']);
const OUTLINE_KEYS = new Set([
  'Title',
  'Parent',
  'Prev',
  'Next',
  'First',
  'Last',
  'Count',
  'Dest',
  'A',
  'C',
  'F',
]);
const LABEL_STYLES = new Set(['D', 'R', 'r', 'A', 'a']);
const CATALOG_EVENTS = new Set(['WC', 'WS', 'DS', 'WP', 'DP']);
const BOOLEAN_PREFS = new Set([
  'HideToolbar',
  'HideMenubar',
  'HideWindowUI',
  'FitWindow',
  'CenterWindow',
  'DisplayDocTitle',
  'PickTrayByPDFSize',
]);
const NAME_PREFS: Partial<Record<string, ReadonlySet<string>>> = {
  NonFullScreenPageMode: new Set(['UseNone', 'UseOutlines', 'UseThumbs', 'UseOC']),
  Direction: new Set(['L2R', 'R2L']),
  ViewArea: new Set(['MediaBox', 'CropBox', 'BleedBox', 'TrimBox', 'ArtBox']),
  ViewClip: new Set(['MediaBox', 'CropBox', 'BleedBox', 'TrimBox', 'ArtBox']),
  PrintArea: new Set(['MediaBox', 'CropBox', 'BleedBox', 'TrimBox', 'ArtBox']),
  PrintClip: new Set(['MediaBox', 'CropBox', 'BleedBox', 'TrimBox', 'ArtBox']),
  PrintScaling: new Set(['AppDefault', 'None']),
  Duplex: new Set(['Simplex', 'DuplexFlipShortEdge', 'DuplexFlipLongEdge']),
};
const isString = (value: PDFObject | undefined): value is PDFString | PDFHexString =>
  value instanceof PDFString || value instanceof PDFHexString;
const integer = (value: PDFObject | undefined, lower = 0): value is PDFNumber =>
  value instanceof PDFNumber && Number.isSafeInteger(value.asNumber()) && value.asNumber() >= lower;
const scalar = (value: PDFObject | undefined): boolean =>
  isString(value) ||
  value instanceof PDFName ||
  value instanceof PDFNumber ||
  value instanceof PDFBool ||
  value === PDFNull;

function checkKeys(
  source: PdfComposeSourceState,
  dict: PDFDict,
  allowed: ReadonlySet<string>,
  path: string,
  code: string
): void {
  for (const [key] of dict.entries())
    if (!allowed.has(key.decodeText()))
      fail(
        code,
        source.id,
        `${path}/${key.decodeText()}`,
        'This dictionary entry cannot be migrated safely'
      );
}
function requiredDict(
  source: PdfComposeSourceState,
  value: PDFObject | undefined,
  path: string,
  code: string
): PDFDict {
  const object = resolve(source, value);
  if (!(object instanceof PDFDict)) fail(code, source.id, path, 'Expected a dictionary');
  return object;
}
function requireRefDict(
  source: PdfComposeSourceState,
  value: PDFObject | undefined,
  path: string,
  code: string
): PDFDict {
  if (!(value instanceof PDFRef))
    fail(code, source.id, path, 'Expected an indirect dictionary reference');
  return requiredDict(source, value, path, code);
}
function matchesRef(value: PDFObject | undefined, expected: PDFObject | undefined): boolean {
  return (
    value instanceof PDFRef &&
    expected instanceof PDFRef &&
    value.toString() === expected.toString()
  );
}
function decision(
  report: StudioPdfComposeReport,
  source: PdfComposeSourceState,
  path: string,
  policy: string,
  detail: string
): void {
  report.catalogDecisions.push({ sourceId: source.id, path, policy, detail });
}
function warning(
  report: StudioPdfComposeReport,
  source: PdfComposeSourceState,
  path: string,
  code: string,
  detail: string
): void {
  report.warnings.push({ sourceId: source.id, path, code, detail });
}
function prune(
  report: StudioPdfComposeReport,
  source: PdfComposeSourceState,
  path: string,
  reason: string
): void {
  report.prunedNavigation.push({ sourceId: source.id, path, reason });
}
function bytesCompare(left: PDFHexString, right: PDFHexString): number {
  const a = left.asBytes(),
    b = right.asBytes();
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] - b[i];
  return a.length - b.length;
}

function copyDestinations(
  sources: readonly PdfComposeSourceState[],
  target: PDFDocument,
  scopes: ReadonlyMap<string, PdfComposeScope>,
  report: StudioPdfComposeReport
): void {
  const entries: { key: PDFHexString; value: PDFObject }[] = [],
    used = new Set<string>();
  for (const source of sources) {
    const scope = scopeOf(scopes, source.id);
    if (typeof scope.namePrefix !== 'string')
      fail(
        'DESTINATION_NAMESPACE',
        source.id,
        '/Names/Dests',
        'Source destination namespace is not a string'
      );
    for (const [rawName, rawValue] of source.names) {
      const destination = scope.navigation.destination(rawValue, `/Names/Dests/${rawName}`);
      if (!destination) continue;
      const targetName = `${scope.namePrefix}${rawName}`;
      if (used.has(targetName))
        fail(
          'DESTINATION_NAMESPACE',
          source.id,
          `/Names/Dests/${rawName}`,
          `Destination namespace collision for ${targetName}`
        );
      used.add(targetName);
      entries.push({ key: PDFHexString.fromText(targetName), value: destination });
      report.destinationNames.push({ sourceId: source.id, sourceName: rawName, targetName });
    }
  }
  if (!entries.length) return;
  entries.sort((a, b) => bytesCompare(a.key, b.key));
  const values = target.context.obj([]);
  for (const entry of entries) {
    values.push(entry.key);
    values.push(entry.value);
  }
  const dests = target.context.register(target.context.obj({ Names: values }));
  target.catalog.set(name('Names'), target.context.register(target.context.obj({ Dests: dests })));
}

function readOutlines(
  source: PdfComposeSourceState,
  scope: PdfComposeScope,
  report: StudioPdfComposeReport
): OutlineItem[] {
  const rawRoot = source.pdf.catalog.get(name('Outlines'));
  if (!rawRoot) return [];
  const root = requiredDict(source, rawRoot, '/Outlines', 'OUTLINE_ROOT');
  checkKeys(source, root, OUTLINE_ROOT_KEYS, '/Outlines', 'OPAQUE_OUTLINE_ROOT');
  const type = read(source, root, 'Type');
  if (type && (!(type instanceof PDFName) || text(type) !== 'Outlines'))
    fail('OUTLINE_ROOT', source.id, '/Outlines/Type', 'Invalid outline root type');
  const rootRef = rawRoot instanceof PDFRef ? rawRoot : source.pdf.context.getObjectRef(root);
  if (!rootRef)
    fail('OUTLINE_ROOT', source.id, '/Outlines', 'Outline root must be an indirect object');
  const seen = new Set([root]);
  let count = 0;
  const walk = (parent: PDFDict, parentRef: PDFRef, path: string): OutlineItem[] => {
    const first = parent.get(name('First')),
      last = parent.get(name('Last'));
    if (!first && !last) return [];
    if (!first || !last)
      fail(
        'OUTLINE_LINKS',
        source.id,
        path,
        'First and Last must both be present for nonempty children'
      );
    requireRefDict(source, last, `${path}/Last`, 'OUTLINE_LINKS');
    const result: OutlineItem[] = [];
    let current: PDFObject | undefined = first,
      previous: PDFObject | undefined,
      final: PDFObject | undefined;
    while (current) {
      if (++count > 20_000)
        fail('OUTLINE_LIMIT', source.id, path, 'Outline tree exceeds 20,000 items');
      const dict = requireRefDict(source, current, `${path}/First/Next`, 'OUTLINE_LINKS');
      if (seen.has(dict))
        fail('OUTLINE_CYCLE', source.id, path, 'Outline tree is cyclic or aliases an item twice');
      seen.add(dict);
      const itemPath = `${path}/item[${count - 1}]`;
      checkKeys(source, dict, OUTLINE_KEYS, itemPath, 'OPAQUE_OUTLINE');
      if (!matchesRef(dict.get(name('Parent')), parentRef))
        fail(
          'OUTLINE_PARENT',
          source.id,
          `${itemPath}/Parent`,
          'Outline parent does not match the canonical tree'
        );
      const prev = dict.get(name('Prev'));
      if (previous ? !matchesRef(prev, previous) : !!prev)
        fail(
          'OUTLINE_PREV',
          source.id,
          `${itemPath}/Prev`,
          'Outline sibling Prev reference is invalid'
        );
      const title = read(source, dict, 'Title');
      if (!isString(title))
        fail('OUTLINE_TITLE', source.id, `${itemPath}/Title`, 'Outline title is not a text string');
      const nativeCount = read(source, dict, 'Count');
      if (
        nativeCount &&
        (!(nativeCount instanceof PDFNumber) || !Number.isSafeInteger(nativeCount.asNumber()))
      )
        fail('OUTLINE_COUNT', source.id, `${itemPath}/Count`, 'Outline Count is not an integer');
      const color = read(source, dict, 'C');
      if (
        color &&
        (!(color instanceof PDFArray) ||
          color.size() !== 3 ||
          color.asArray().some((value) => {
            const number = resolve(source, value);
            return (
              !(number instanceof PDFNumber) ||
              !Number.isFinite(number.asNumber()) ||
              number.asNumber() < 0 ||
              number.asNumber() > 1
            );
          }))
      )
        fail(
          'OUTLINE_COLOR',
          source.id,
          `${itemPath}/C`,
          'Outline color must contain three numbers from zero to one'
        );
      const flags = read(source, dict, 'F');
      if (flags && (!integer(flags) || flags.asNumber() > 3))
        fail(
          'OUTLINE_FLAGS',
          source.id,
          `${itemPath}/F`,
          'Outline style contains unsupported flag bits'
        );
      if (dict.has(name('A')) && dict.has(name('Dest')))
        fail('OUTLINE_NAVIGATION', source.id, itemPath, 'Outline item contains both A and Dest');
      if (dict.has(name('A')))
        requiredDict(source, dict.get(name('A')), `${itemPath}/A`, 'OUTLINE_ACTION');
      const currentRef = current;
      if (!(currentRef instanceof PDFRef))
        fail('OUTLINE_LINKS', source.id, itemPath, 'Expected an indirect outline');
      const children = walk(dict, currentRef, itemPath),
        destination = dict.has(name('Dest'))
          ? scope.navigation.destination(dict.get(name('Dest')), `${itemPath}/Dest`)
          : undefined;
      const action = dict.has(name('A'))
        ? scope.navigation.action(dict.get(name('A')), `${itemPath}/A`)
        : undefined;
      const originallyNavigable = dict.has(name('Dest')) || dict.has(name('A'));
      if (destination || action || children.length || !originallyNavigable) {
        result.push({
          source,
          scope,
          dict,
          path: itemPath,
          children,
          destination,
          action,
          open: nativeCount instanceof PDFNumber && nativeCount.asNumber() >= 0,
        });
      } else
        prune(report, source, itemPath, 'outline item has no retained destination or children');
      final = current;
      previous = current;
      current = dict.get(name('Next'));
    }
    if (!matchesRef(final, last))
      fail('OUTLINE_LAST', source.id, `${path}/Last`, 'Last does not refer to the final sibling');
    return result;
  };
  const rootCount = read(source, root, 'Count');
  if (rootCount && !integer(rootCount))
    fail(
      'OUTLINE_COUNT',
      source.id,
      '/Outlines/Count',
      'Outline root Count is not a nonnegative integer'
    );
  const result = walk(root, rootRef, '/Outlines');
  decision(
    report,
    source,
    '/Outlines',
    'rebuild',
    'Rebuilt retained hierarchy and visible descendant counts'
  );
  return result;
}
function copyOutlines(
  sources: readonly PdfComposeSourceState[],
  target: PDFDocument,
  scopes: ReadonlyMap<string, PdfComposeScope>,
  report: StudioPdfComposeReport
): void {
  const items = sources.flatMap((source) =>
    readOutlines(source, scopeOf(scopes, source.id), report)
  );
  if (!items.length) return;
  const root = target.context.obj({ Type: 'Outlines' }),
    rootRef = target.context.register(root);
  const allocate = (item: OutlineItem): AllocatedOutlineItem => {
    const output = target.context.obj({}),
      ref = target.context.register(output);
    for (const key of ['Title', 'C', 'F']) {
      const value = item.dict.get(name(key));
      if (value) output.set(name(key), item.scope.copier.copy(value, `${item.path}/${key}`));
    }
    if (item.destination) output.set(name('Dest'), item.destination);
    if (item.action) {
      const action = chainActions(
        [{ value: item.action, sourceId: item.source.id, path: `${item.path}/A` }],
        target
      );
      if (action) output.set(name('A'), action);
    }
    return { ...item, output, ref, children: item.children.map(allocate) };
  };
  const visible = (children: readonly OutlineItem[]): number =>
    children.length +
    children.reduce((sum, child) => sum + (child.open ? visible(child.children) : 0), 0);
  const wire = (
    children: readonly AllocatedOutlineItem[],
    parent: PDFDict,
    parentRef: PDFRef
  ): void => {
    parent.set(name('First'), children[0].ref);
    parent.set(name('Last'), children[children.length - 1].ref);
    for (let index = 0; index < children.length; index++) {
      const item = children[index];
      item.output.set(name('Parent'), parentRef);
      if (index) item.output.set(name('Prev'), children[index - 1].ref);
      if (index + 1 < children.length) item.output.set(name('Next'), children[index + 1].ref);
      if (item.children.length) {
        wire(item.children, item.output, item.ref);
        item.output.set(name('Count'), PDFNumber.of((item.open ? 1 : -1) * visible(item.children)));
      }
    }
  };
  const allocated = items.map(allocate);
  wire(allocated, root, rootRef);
  root.set(name('Count'), PDFNumber.of(visible(allocated)));
  target.catalog.set(name('Outlines'), rootRef);
}

function readLabels(source: PdfComposeSourceState): LabelRange[] | undefined {
  const raw = source.pdf.catalog.get(name('PageLabels'));
  if (!raw) return undefined;
  const seen = new Set<PDFDict>(),
    entries: LabelRange[] = [];
  let nodes = 0;
  const walk = (value: PDFObject | undefined, path: string, isRoot = false): void => {
    const dict = requiredDict(source, value, path, 'PAGE_LABEL_TREE');
    if (seen.has(dict))
      fail(
        'PAGE_LABEL_CYCLE',
        source.id,
        path,
        'Page label tree is cyclic or aliases a node twice'
      );
    if (++nodes > 20_000)
      fail('PAGE_LABEL_LIMIT', source.id, path, 'Page label tree exceeds 20,000 nodes');
    seen.add(dict);
    checkKeys(source, dict, new Set(['Kids', 'Nums', 'Limits']), path, 'OPAQUE_PAGE_LABEL_TREE');
    const nums = read(source, dict, 'Nums'),
      kids = read(source, dict, 'Kids'),
      limits = read(source, dict, 'Limits');
    if ((nums && kids) || (!nums && !kids))
      fail('PAGE_LABEL_TREE', source.id, path, 'Number tree must have exactly one of Nums or Kids');
    const start = entries.length;
    if (nums) {
      if (!(nums instanceof PDFArray) || nums.size() % 2)
        fail(
          'PAGE_LABEL_NUMS',
          source.id,
          `${path}/Nums`,
          'Number tree Nums must have an even number of entries'
        );
      let previous = -1;
      for (let index = 0; index < nums.size(); index += 2) {
        const key = resolve(source, nums.get(index));
        if (!integer(key) || key.asNumber() >= source.pages.length || key.asNumber() <= previous)
          fail(
            'PAGE_LABEL_INDEX',
            source.id,
            `${path}/Nums[${index}]`,
            'Label indexes must be unique, sorted source page numbers'
          );
        previous = key.asNumber();
        const label = requiredDict(
          source,
          nums.get(index + 1),
          `${path}/Nums[${index + 1}]`,
          'PAGE_LABEL_DICTIONARY'
        );
        checkKeys(
          source,
          label,
          new Set(['Type', 'S', 'P', 'St']),
          `${path}/Nums[${index + 1}]`,
          'OPAQUE_PAGE_LABEL'
        );
        const type = read(source, label, 'Type'),
          style = read(source, label, 'S'),
          prefix = read(source, label, 'P'),
          first = read(source, label, 'St');
        if (type && (!(type instanceof PDFName) || text(type) !== 'PageLabel'))
          fail('PAGE_LABEL_TYPE', source.id, path, 'Invalid page label dictionary type');
        if (style && (!(style instanceof PDFName) || !LABEL_STYLES.has(text(style) ?? '')))
          fail(
            'PAGE_LABEL_STYLE',
            source.id,
            `${path}/Nums[${index + 1}]/S`,
            'Unsupported page label numbering style'
          );
        if (prefix && !isString(prefix))
          fail('PAGE_LABEL_PREFIX', source.id, path, 'Page label prefix is not a text string');
        if (first && !integer(first, 1))
          fail('PAGE_LABEL_START', source.id, path, 'Page label St must be a positive integer');
        entries.push({
          index: key.asNumber(),
          dict: label,
          style: style ? text(style) : undefined,
          first: first instanceof PDFNumber ? first.asNumber() : 1,
        });
      }
    } else {
      if (!(kids instanceof PDFArray) || !kids.size())
        fail(
          'PAGE_LABEL_KIDS',
          source.id,
          `${path}/Kids`,
          'Number tree Kids must be a nonempty array'
        );
      for (let index = 0; index < kids.size(); index++) {
        requireRefDict(source, kids.get(index), `${path}/Kids[${index}]`, 'PAGE_LABEL_KIDS');
        walk(kids.get(index), `${path}/Kids[${index}]`);
      }
    }
    const local = entries.slice(start);
    if (!isRoot && !local.length)
      fail('PAGE_LABEL_TREE', source.id, path, 'Non-root number tree node has no labels');
    if (limits) {
      const lower = limits instanceof PDFArray ? resolve(source, limits.get(0)) : undefined,
        upper = limits instanceof PDFArray ? resolve(source, limits.get(1)) : undefined;
      if (
        !(limits instanceof PDFArray) ||
        limits.size() !== 2 ||
        !local.length ||
        !integer(lower) ||
        !integer(upper) ||
        lower.asNumber() !== local[0].index ||
        upper.asNumber() !== local[local.length - 1].index
      )
        fail(
          'PAGE_LABEL_LIMITS',
          source.id,
          `${path}/Limits`,
          'Number tree Limits do not match the retained source indexes'
        );
    }
  };
  walk(raw, '/PageLabels', true);
  for (let index = 1; index < entries.length; index++)
    if (entries[index - 1].index >= entries[index].index)
      fail(
        'PAGE_LABEL_INDEX',
        source.id,
        '/PageLabels',
        'Number tree branches contain duplicate or unsorted label indexes'
      );
  if (entries.length && entries[0].index !== 0)
    fail(
      'PAGE_LABEL_FIRST',
      source.id,
      '/PageLabels',
      'Page label tree must start at source page zero'
    );
  return entries;
}
function copyLabels(
  sources: readonly PdfComposeSourceState[],
  target: PDFDocument,
  scopes: ReadonlyMap<string, PdfComposeScope>,
  report: StudioPdfComposeReport,
  instances: readonly PdfPageInstance[]
): void {
  const ranges = new Map(sources.map((source) => [source.id, readLabels(source)]));
  if (![...ranges.values()].some((value) => value?.length)) return;
  const nums = target.context.obj([]);
  for (const instance of instances) {
    const source = instance.source,
      sourceRanges = ranges.get(source.id);
    let range: LabelRange | undefined;
    for (const entry of sourceRanges ?? []) {
      if (entry.index > instance.sourcePage) break;
      range = entry;
    }
    const label = target.context.obj({});
    if (range) {
      for (const key of ['Type', 'S', 'P']) {
        const value = range.dict.get(name(key));
        if (value)
          label.set(
            name(key),
            scopeOf(scopes, source.id).copier.copy(
              value,
              `/PageLabels/page[${instance.sourcePage}]/${key}`
            )
          );
      }
      if (range.style) {
        const first = range.first + instance.sourcePage - range.index;
        if (!Number.isSafeInteger(first))
          fail(
            'PAGE_LABEL_START',
            source.id,
            `/PageLabels/page[${instance.sourcePage}]/St`,
            'Selected page label number exceeds the supported integer range'
          );
        label.set(name('St'), PDFNumber.of(first));
      } else if (range.dict.has(name('St'))) label.set(name('St'), PDFNumber.of(range.first));
    } else {
      label.set(name('S'), name('D'));
      label.set(name('St'), PDFNumber.of(instance.sourcePage + 1));
    }
    nums.push(PDFNumber.of(instance.index));
    nums.push(label);
  }
  target.catalog.set(
    name('PageLabels'),
    target.context.register(target.context.obj({ Nums: nums }))
  );
  for (const source of sources)
    decision(
      report,
      source,
      '/PageLabels',
      'map',
      ranges.get(source.id)?.length
        ? 'Preserved each selected page label from its original source range'
        : 'Preserved original default numeric source page labels alongside labelled sources'
    );
}

function targetObject(target: PDFDocument, value: PDFObject | undefined): PDFObject | undefined {
  return value instanceof PDFRef ? target.context.lookup(value) : value;
}
function actionItems(
  value: PDFObject | undefined,
  target: PDFDocument,
  seen = new Set<PDFObject>()
): PDFObject[] {
  const object = targetObject(target, value);
  if (object instanceof PDFArray) {
    if (seen.has(object))
      fail('CATALOG_ACTION_CYCLE', undefined, '/OpenAction', 'Migrated action array is cyclic');
    seen.add(object);
    const result = object.asArray().flatMap((entry) => actionItems(entry, target, seen));
    seen.delete(object);
    return result;
  }
  if (
    !(object instanceof PDFDict) ||
    !(targetObject(target, object.get(name('S'))) instanceof PDFName)
  )
    fail(
      'CATALOG_ACTION_TYPE',
      undefined,
      '/OpenAction',
      'Migrated action is not a valid action dictionary'
    );
  if (value === undefined)
    fail('CATALOG_ACTION_TYPE', undefined, '/OpenAction', 'Migrated action is missing');
  return [value];
}
function viewSignature(
  value: PDFObject | undefined,
  target: PDFDocument,
  path: string,
  seen = new Set<PDFObject>()
): string[] {
  const object = targetObject(target, value);
  if (!object) fail('CATALOG_ACTION_TYPE', undefined, path, 'Migrated action is missing');
  if (seen.has(object))
    fail('CATALOG_ACTION_CYCLE', undefined, path, 'Migrated action graph is cyclic');
  seen.add(object);
  const result: string[] = [];
  if (object instanceof PDFArray)
    for (const entry of object.asArray()) result.push(...viewSignature(entry, target, path, seen));
  else if (object instanceof PDFDict) {
    const kind = text(targetObject(target, object.get(name('S'))));
    if (kind === 'GoTo') {
      let destination = targetObject(target, object.get(name('D')));
      const visited = new Set<PDFDict>();
      while (destination instanceof PDFDict) {
        if (visited.has(destination))
          fail('CATALOG_DESTINATION_CYCLE', undefined, path, 'Migrated destination is cyclic');
        visited.add(destination);
        destination = targetObject(target, destination.get(name('D')));
      }
      if (!(destination instanceof PDFArray))
        fail(
          'CATALOG_DESTINATION_TYPE',
          undefined,
          path,
          'Migrated GoTo action has no destination array'
        );
      result.push(
        destination
          .asArray()
          .map((entry) => entry.toString())
          .join(' ')
      );
    } else if (kind === 'Named')
      result.push(`Named:${text(targetObject(target, object.get(name('N'))))}`);
    if (object.has(name('Next')))
      result.push(...viewSignature(object.get(name('Next')), target, `${path}/Next`, seen));
  }
  seen.delete(object);
  return result;
}
function validateCombinedViews(
  entries: readonly ActionEntry[],
  target: PDFDocument,
  code: string
): void {
  let first: (ActionEntry & { signature: string }) | undefined;
  for (const entry of entries) {
    const views = viewSignature(entry.value, target, entry.path);
    if (!views.length) continue;
    const signature = JSON.stringify(views);
    if (!first) first = { ...entry, signature };
    else if (
      signature !== first.signature ||
      views.some((view) => view === 'Named:NextPage' || view === 'Named:PrevPage')
    )
      fail(
        code,
        entry.sourceId,
        entry.path,
        `Document actions have incompatible local or relative page views with ${first.sourceId}:${first.path}`
      );
  }
}
function chainActions(entries: readonly ActionEntry[], target: PDFDocument): PDFObject | undefined {
  const actions = entries.flatMap((entry) => actionItems(entry.value, target));
  if (!actions.length) return undefined;
  if (actions.length === 1) return actions[0];
  const first = targetObject(target, actions[0]);
  if (!(first instanceof PDFDict))
    fail(
      'CATALOG_ACTION_TYPE',
      undefined,
      '/OpenAction',
      'Migrated first action is not a dictionary'
    );
  const result = first.clone(target.context);
  const next = first.has(name('Next')) ? actionItems(first.get(name('Next')), target) : [];
  result.set(name('Next'), target.context.obj([...next, ...actions.slice(1)]));
  return target.context.register(result);
}
function copyDocumentActions(
  sources: readonly PdfComposeSourceState[],
  target: PDFDocument,
  scopes: ReadonlyMap<string, PdfComposeScope>,
  report: StudioPdfComposeReport
): void {
  const opens: ActionEntry[] = [],
    additional = new Map<string, ActionEntry[]>();
  for (const source of sources) {
    const navigation = scopeOf(scopes, source.id).navigation,
      rawOpen = source.pdf.catalog.get(name('OpenAction'));
    if (rawOpen) {
      const object = resolve(source, rawOpen);
      let value: PDFObject | undefined,
        destinationOnly = false;
      if (
        object instanceof PDFArray ||
        isString(object) ||
        object instanceof PDFName ||
        (object instanceof PDFDict && !object.has(name('S')) && object.has(name('D')))
      ) {
        const destination = navigation.destination(rawOpen, '/OpenAction');
        if (destination) {
          destinationOnly = true;
          value = target.context.obj({ S: 'GoTo', D: destination });
        }
      } else {
        requiredDict(source, rawOpen, '/OpenAction', 'CATALOG_OPEN_ACTION');
        value = navigation.action(rawOpen, '/OpenAction');
      }
      if (value) opens.push({ value, sourceId: source.id, path: '/OpenAction', destinationOnly });
    }
    const rawAA = source.pdf.catalog.get(name('AA'));
    if (rawAA) {
      const dict = requiredDict(source, rawAA, '/AA', 'CATALOG_ADDITIONAL_ACTIONS');
      checkKeys(source, dict, CATALOG_EVENTS, '/AA', 'OPAQUE_CATALOG_EVENT');
      for (const [event, value] of dict.entries())
        requiredDict(source, value, `/AA/${event.decodeText()}`, 'CATALOG_ADDITIONAL_ACTION');
      const copied = navigation.additional(rawAA, '/AA');
      for (const [event, value] of copied?.entries() ?? []) {
        const key = event.decodeText();
        const entries = additional.get(key) ?? [];
        additional.set(key, entries);
        entries.push({ value, sourceId: source.id, path: `/AA/${key}` });
      }
    }
  }
  if (opens.length) {
    validateCombinedViews(opens, target, 'OPEN_ACTION_CONFLICT');
    if (opens.length === 1 && opens[0].destinationOnly) {
      const open = targetObject(target, opens[0].value);
      if (!(open instanceof PDFDict))
        fail(
          'CATALOG_OPEN_ACTION',
          undefined,
          '/OpenAction',
          'Migrated opening action is not a dictionary'
        );
      const destination = open.get(name('D'));
      if (!destination)
        fail(
          'CATALOG_OPEN_ACTION',
          undefined,
          '/OpenAction',
          'Migrated opening destination is missing'
        );
      target.catalog.set(
        name('OpenAction'),
        targetObject(target, destination) instanceof PDFArray ? destination : opens[0].value
      );
    } else {
      const action = chainActions(opens, target);
      if (action) target.catalog.set(name('OpenAction'), action);
    }
    if (opens.length > 1)
      report.catalogDecisions.push({
        path: '/OpenAction',
        policy: 'chain',
        sourceIds: opens.map((entry) => entry.sourceId),
        detail:
          'Preserved compatible document action sequences in source order without mutating shared action objects',
      });
  }
  if (additional.size) {
    const dict = target.context.obj({});
    for (const [event, entries] of additional) {
      validateCombinedViews(entries, target, 'CATALOG_ACTION_CONFLICT');
      const action = chainActions(entries, target);
      if (action) dict.set(name(event), action);
      if (entries.length > 1)
        report.catalogDecisions.push({
          path: `/AA/${event}`,
          policy: 'chain',
          sourceIds: entries.map((entry) => entry.sourceId),
          detail: 'Preserved compatible additional actions in source order',
        });
    }
    target.catalog.set(name('AA'), target.context.register(dict));
  }
}

function copyViewerPreferences(
  source: PdfComposeSourceState,
  target: PDFDocument,
  scope: PdfComposeScope,
  report: StudioPdfComposeReport
): PDFDict | undefined {
  const raw = source.pdf.catalog.get(name('ViewerPreferences'));
  if (!raw) return undefined;
  const dict = requiredDict(source, raw, '/ViewerPreferences', 'VIEWER_PREFERENCES'),
    output = target.context.obj({});
  for (const [key, entry] of dict.entries()) {
    const keyText = key.decodeText(),
      value = resolve(source, entry),
      path = `/ViewerPreferences/${keyText}`;
    if (BOOLEAN_PREFS.has(keyText)) {
      if (!(value instanceof PDFBool))
        fail('VIEWER_PREFERENCE_TYPE', source.id, path, 'Expected a boolean');
    } else if (NAME_PREFS[keyText]) {
      if (!(value instanceof PDFName) || !NAME_PREFS[keyText]?.has(text(value) ?? ''))
        fail('VIEWER_PREFERENCE_NAME', source.id, path, 'Unsupported viewer preference');
    } else if (keyText === 'NumCopies') {
      if (!integer(value, 1))
        fail('VIEWER_PREFERENCE_COPIES', source.id, path, 'NumCopies must be a positive integer');
    } else if (keyText === 'Enforce') {
      if (
        !(value instanceof PDFArray) ||
        value.asArray().some((item) => {
          const object = resolve(source, item);
          return !(object instanceof PDFName) || text(object) !== 'PrintScaling';
        })
      )
        fail(
          'VIEWER_PREFERENCE_ENFORCE',
          source.id,
          path,
          'Only the standard PrintScaling enforcement is supported'
        );
    } else if (keyText === 'PrintPageRange') {
      if (!(value instanceof PDFArray) || value.size() % 2)
        fail('VIEWER_PRINT_RANGE', source.id, path, 'PrintPageRange must contain page index pairs');
      const ranges: [number, number][] = [];
      let previous = -1;
      for (let index = 0; index < value.size(); index += 2) {
        const start = resolve(source, value.get(index)),
          end = resolve(source, value.get(index + 1));
        if (
          !integer(start) ||
          !integer(end) ||
          start.asNumber() > end.asNumber() ||
          end.asNumber() >= source.pages.length ||
          start.asNumber() <= previous
        )
          fail(
            'VIEWER_PRINT_RANGE',
            source.id,
            `${path}[${index}]`,
            'Print page ranges must be ascending, nonoverlapping source page intervals'
          );
        previous = end.asNumber();
        ranges.push([start.asNumber(), end.asNumber()]);
      }
      const selected = source.instances
          .filter((instance) =>
            ranges.some(
              ([start, end]) => instance.sourcePage >= start && instance.sourcePage <= end
            )
          )
          .map((instance) => instance.index)
          .sort((a, b) => a - b),
        mapped: [number, number][] = [];
      for (const index of selected) {
        if (mapped.length && mapped[mapped.length - 1][1] + 1 === index)
          mapped[mapped.length - 1][1] = index;
        else mapped.push([index, index]);
      }
      if (mapped.length) output.set(key, target.context.obj(mapped.flat()));
      else prune(report, source, path, 'print preference has no retained source pages');
      decision(
        report,
        source,
        path,
        'map',
        'Mapped original print ranges to retained page instances'
      );
      continue;
    } else
      fail(
        'OPAQUE_VIEWER_PREFERENCE',
        source.id,
        path,
        'Unknown viewer preference cannot be migrated safely'
      );
    output.set(key, scope.copier.copy(entry, path));
  }
  return output;
}
function validateMetadataParams(
  source: PdfComposeSourceState,
  value: PDFObject | undefined,
  path: string,
  seen = new Set<PDFObject>()
): void {
  const object = resolve(source, value);
  if (scalar(object)) return;
  if (!(object instanceof PDFDict) && !(object instanceof PDFArray))
    fail(
      'CATALOG_METADATA_PARAMS',
      source.id,
      path,
      'Metadata decoding parameters contain unsupported objects'
    );
  if (seen.has(object))
    fail('CATALOG_METADATA_PARAMS', source.id, path, 'Metadata decoding parameters are cyclic');
  if (object instanceof PDFDict) {
    const ref = source.pdf.context.getObjectRef(object)?.toString(),
      type = text(read(source, object, 'Type'));
    if (
      (ref && (source.fieldRefs.has(ref) || source.annotations.has(ref))) ||
      type === 'Page' ||
      type === 'Pages' ||
      type === 'Catalog'
    )
      fail(
        'CATALOG_METADATA_PARAMS',
        source.id,
        path,
        'Metadata decoding parameters reference document objects'
      );
  }
  seen.add(object);
  if (object instanceof PDFArray)
    object
      .asArray()
      .forEach((entry, index) => validateMetadataParams(source, entry, `${path}[${index}]`, seen));
  else
    for (const [entryKey, entry] of object.entries())
      validateMetadataParams(source, entry, `${path}/${entryKey.decodeText()}`, seen);
  seen.delete(object);
}
function validatePrimaryValue(source: PdfComposeSourceState, key: string, value: PDFObject): void {
  const object = resolve(source, value),
    path = `/${key}`;
  if (key === 'Metadata') {
    if (!(object instanceof PDFStream))
      fail('CATALOG_METADATA', source.id, path, 'Metadata must be a stream');
    checkKeys(
      source,
      object.dict,
      new Set(['Type', 'Subtype', 'Length', 'Filter', 'DecodeParms', 'DL']),
      path,
      'OPAQUE_METADATA_STREAM'
    );
    const type = read(source, object.dict, 'Type'),
      subtype = read(source, object.dict, 'Subtype');
    if (type && (!(type instanceof PDFName) || text(type) !== 'Metadata'))
      fail('CATALOG_METADATA', source.id, `${path}/Type`, 'Invalid Metadata stream type');
    if (subtype && (!(subtype instanceof PDFName) || text(subtype) !== 'XML'))
      fail(
        'CATALOG_METADATA',
        source.id,
        `${path}/Subtype`,
        'Only XML Metadata streams can be preserved'
      );
    for (const numberKey of ['Length', 'DL']) {
      const number = read(source, object.dict, numberKey);
      if (number && !integer(number))
        fail(
          'CATALOG_METADATA',
          source.id,
          `${path}/${numberKey}`,
          'Metadata length declarations must be nonnegative integers'
        );
    }
    const filter = read(source, object.dict, 'Filter');
    if (
      filter &&
      !(filter instanceof PDFName) &&
      (!(filter instanceof PDFArray) ||
        filter.asArray().some((entry) => !(resolve(source, entry) instanceof PDFName)))
    )
      fail(
        'CATALOG_METADATA',
        source.id,
        `${path}/Filter`,
        'Metadata filters must be names or arrays of names'
      );
    const params = object.dict.get(name('DecodeParms'));
    if (params) {
      const decoded = resolve(source, params);
      if (decoded !== PDFNull && !(decoded instanceof PDFDict) && !(decoded instanceof PDFArray))
        fail(
          'CATALOG_METADATA_PARAMS',
          source.id,
          `${path}/DecodeParms`,
          'Metadata DecodeParms must be a dictionary, an array or null'
        );
      validateMetadataParams(source, params, `${path}/DecodeParms`);
    }
  } else if (key === 'PageLayout') {
    if (
      !(object instanceof PDFName) ||
      ![
        'SinglePage',
        'OneColumn',
        'TwoColumnLeft',
        'TwoColumnRight',
        'TwoPageLeft',
        'TwoPageRight',
      ].includes(text(object) ?? '')
    )
      fail('CATALOG_PAGE_LAYOUT', source.id, path, 'Unsupported page layout');
  } else if (key === 'PageMode') {
    if (
      !(object instanceof PDFName) ||
      !['UseNone', 'UseOutlines', 'UseThumbs', 'FullScreen', 'UseOC', 'UseAttachments'].includes(
        text(object) ?? ''
      )
    )
      fail('CATALOG_PAGE_MODE', source.id, path, 'Unsupported page mode');
  } else if (key === 'Lang') {
    if (!isString(object))
      fail('CATALOG_LANGUAGE', source.id, path, 'Document language must be a text string');
  } else if (key === 'Version') {
    if (!(object instanceof PDFName) || !/^(?:1\.[0-7]|2\.0)$/.test(text(object) ?? ''))
      fail('CATALOG_VERSION', source.id, path, 'Unsupported document version declaration');
  } else if (key === 'Extensions') {
    const dict = requiredDict(source, value, path, 'CATALOG_EXTENSIONS');
    for (const [developer, raw] of dict.entries()) {
      const extensionPath = `${path}/${developer.decodeText()}`,
        extension = requiredDict(source, raw, extensionPath, 'CATALOG_EXTENSION');
      checkKeys(
        source,
        extension,
        new Set(['BaseVersion', 'ExtensionLevel', 'URL']),
        extensionPath,
        'OPAQUE_CATALOG_EXTENSION'
      );
      const base = read(source, extension, 'BaseVersion'),
        level = read(source, extension, 'ExtensionLevel'),
        url = read(source, extension, 'URL');
      if (
        !(base instanceof PDFName) ||
        !/^(?:1\.[0-7]|2\.0)$/.test(text(base) ?? '') ||
        !integer(level, 1) ||
        (url && !isString(url))
      )
        fail('CATALOG_EXTENSION', source.id, extensionPath, 'Invalid static extension declaration');
    }
  }
}
function copyPrimary(
  sources: readonly PdfComposeSourceState[],
  target: PDFDocument,
  scopes: ReadonlyMap<string, PdfComposeScope>,
  report: StudioPdfComposeReport
): void {
  const primary = sources[0],
    scope = scopeOf(scopes, primary.id);
  for (const source of sources) {
    const infoRaw = source.pdf.context.trailerInfo.Info;
    if (infoRaw) {
      const info = requiredDict(source, infoRaw, '/Info', 'INFO_DICTIONARY');
      for (const [key, raw] of info.entries()) {
        const value = resolve(source, raw);
        if (!scalar(value))
          fail(
            'OPAQUE_INFO_VALUE',
            source.id,
            `/Info/${key.decodeText()}`,
            'Info metadata must contain scalar values'
          );
        if (
          [
            'Title',
            'Author',
            'Subject',
            'Keywords',
            'Creator',
            'Producer',
            'CreationDate',
            'ModDate',
          ].includes(key.decodeText()) &&
          !isString(value)
        )
          fail(
            'INFO_VALUE',
            source.id,
            `/Info/${key.decodeText()}`,
            'Standard Info metadata value is not a text string'
          );
        if (
          key === name('Trapped') &&
          (!(value instanceof PDFName) || !['True', 'False', 'Unknown'].includes(text(value) ?? ''))
        )
          fail('INFO_VALUE', source.id, '/Info/Trapped', 'Invalid Trapped metadata value');
      }
      if (source === primary) {
        const copied = scope.copier.copy(infoRaw, '/Info');
        target.context.trailerInfo.Info =
          copied instanceof PDFRef ? copied : target.context.register(copied);
      } else
        warning(
          report,
          source,
          '/Info',
          'CATALOG_PRIMARY',
          `Retained Info metadata from primary source ${primary.id}`
        );
      decision(
        report,
        source,
        '/Info',
        source === primary ? 'retain-primary' : 'use-primary',
        `Primary source is ${primary.id}`
      );
    }
    for (const key of PRIMARY_KEYS) {
      const raw = source.pdf.catalog.get(name(key));
      if (!raw) continue;
      if (key !== 'ViewerPreferences') validatePrimaryValue(source, key, raw);
      const preferences =
        key === 'ViewerPreferences'
          ? copyViewerPreferences(source, target, scopeOf(scopes, source.id), report)
          : undefined;
      if (source === primary) {
        const value = key === 'ViewerPreferences' ? preferences : scope.copier.copy(raw, `/${key}`);
        if (value) target.catalog.set(name(key), value);
      } else
        warning(
          report,
          source,
          `/${key}`,
          'CATALOG_PRIMARY',
          `Retained ${key} from primary source ${primary.id}`
        );
      decision(
        report,
        source,
        `/${key}`,
        source === primary ? 'retain-primary' : 'use-primary',
        `Primary source is ${primary.id}`
      );
    }
  }
  if (!primary.pdf.context.trailerInfo.Info) delete target.context.trailerInfo.Info;
}

/** Rebuild document-wide objects against a target containing only selected page instances. */
export function copyCatalog({
  sources,
  target,
  scopes,
  report,
  catalogPolicy = 'primary',
}: {
  sources: readonly PdfComposeSourceState[];
  target: PDFDocument;
  scopes: ReadonlyMap<string, PdfComposeScope>;
  report: StudioPdfComposeReport;
  catalogPolicy?: 'primary';
}): { primarySourceId: string; destinationCount: number } {
  if (catalogPolicy !== 'primary')
    fail(
      'CATALOG_POLICY',
      undefined,
      '/',
      'Only the explicit primary metadata policy is supported'
    );
  report.warnings ??= [];
  report.prunedNavigation ??= [];
  report.catalogDecisions ??= [];
  report.destinationNames ??= [];
  const active = sources.filter((source) => source.instances?.length);
  if (!active.length)
    fail('CATALOG_INSTANCES', undefined, '/Pages', 'There are no selected source page instances');
  if (new Set(active.map((source) => source.id)).size !== active.length)
    fail('CATALOG_SCOPE', undefined, '/', 'Selected sources must have unique identities');
  const instances = active
    .flatMap((source) => source.instances.map((instance) => ({ ...instance, source })))
    .sort((a, b) => a.index - b.index);
  const targetPages = target.getPages();
  if (
    instances.length !== targetPages.length ||
    instances.some(
      (instance, index) =>
        instance.index !== index ||
        !Number.isInteger(instance.sourcePage) ||
        !instance.source.pages[instance.sourcePage] ||
        !instance.page ||
        instance.page.doc !== target ||
        instance.page.ref.toString() !== targetPages[index].ref.toString()
    )
  )
    fail(
      'CATALOG_INSTANCES',
      undefined,
      '/Pages',
      'Selected page instances do not match the complete target page tree'
    );
  for (const source of active) {
    const scope = scopeOf(scopes, source.id);
    if (
      !scope ||
      scope.copier?.source !== source ||
      scope.copier?.target !== target ||
      scope.navigation?.source !== source ||
      scope.navigation?.target !== target
    )
      fail('CATALOG_SCOPE', source.id, '/', 'Source has no matching native copy/navigation scope');
    checkKeys(source, source.pdf.catalog, CATALOG_KEYS, '/', 'OPAQUE_CATALOG');
  }
  for (const key of [
    'Names',
    'Dests',
    'Outlines',
    'PageLabels',
    'OpenAction',
    'AA',
    ...PRIMARY_KEYS,
  ])
    target.catalog.delete(name(key));
  report.catalogPolicy = { strategy: 'primary', primarySourceId: active[0].id };
  copyDestinations(active, target, scopes, report);
  copyOutlines(active, target, scopes, report);
  copyLabels(active, target, scopes, report, instances);
  copyDocumentActions(active, target, scopes, report);
  copyPrimary(active, target, scopes, report);
  return { primarySourceId: active[0].id, destinationCount: report.destinationNames.length };
}

function scopeOf(scopes: ReadonlyMap<string, PdfComposeScope>, sourceId: string): PdfComposeScope {
  const scope = scopes.get(sourceId);
  if (!scope) fail('CATALOG_SCOPE', sourceId, '/', 'Source has no matching native scope');
  return scope;
}
