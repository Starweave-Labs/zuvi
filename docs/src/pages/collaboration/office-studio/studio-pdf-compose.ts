import {
  PDFDocument,
  PDFArray,
  PDFDict,
  PDFRef,
  PDFHexString,
  PDFPage,
  PDFPageLeaf,
  type PDFDocument as PDFDocumentType,
} from 'pdf-lib';
import {
  ClosedPdfCopier,
  PdfComposeError,
  byteArray,
  fail,
  name,
  text,
  read,
  resolve,
  canonical,
  hash,
  isolatePageContainers,
} from './studio-pdf-compose-utils';
import {
  loadSource,
  fieldDefinition,
  fieldValue,
  onValue,
  parseDesign,
} from './studio-pdf-compose-source';
import {
  prepareResources,
  rewrittenDA,
  daSemantics,
  copyResources,
} from './studio-pdf-compose-resources';
import { PdfNavigation } from './studio-pdf-compose-navigation';
import { copyCatalog } from './studio-pdf-compose-catalog';

export { PdfComposeError };
export type {
  StudioPdfComposeInput,
  StudioPdfComposeResult,
  StudioPdfComposeReport,
  StudioPdfComposeOptions,
  StudioPdfComposeSource,
  StudioPdfComposePageSelection,
  StudioPdfComposeConflictPolicy,
} from './studio-pdf-compose-types';
import type {
  PdfComposeSourceState,
  PdfFieldRecord,
  PdfFieldNode,
  PdfWidgetRecord,
  PdfTargetAnnotation,
  PdfPageInstance,
  PdfComposeScope,
  PdfPageResolver,
  StudioPdfComposeInput,
  StudioPdfComposeResult,
  StudioPdfComposeReport,
  StudioPdfComposeOptions,
  StudioPdfComposeBytes,
  StudioPdfComposeValue,
} from './studio-pdf-compose-types';
const INHERITED_FIELD_KEYS = ['FT', 'Ff', 'V', 'DV', 'DA', 'Q', 'MaxLen', 'Opt'] as const;
const WIDGET_KEYS = new Set([
  'Type',
  'Subtype',
  'Rect',
  'P',
  'Contents',
  'NM',
  'M',
  'F',
  'AP',
  'AS',
  'Border',
  'C',
  'OC',
  'StructParent',
  'Popup',
  'H',
  'MK',
  'BS',
]);
const FIELD_KEYS = new Set([
  'FT',
  'T',
  'TU',
  'TM',
  'Ff',
  'V',
  'DV',
  'Kids',
  'DA',
  'Q',
  'DS',
  'RV',
  'Opt',
  'MaxLen',
  'TI',
  'I',
  'Lock',
  'SV',
  'ZuviFieldDesign',
  'ZuviFieldImage',
]);
const FIELD_EVENTS = new Set(['K', 'F', 'V', 'C']);
const WIDGET_EVENTS = new Set(['E', 'X', 'D', 'U', 'Fo', 'Bl', 'PO', 'PC', 'PV', 'PI']);

function rootRecord(record: PdfFieldRecord): PdfFieldRecord {
  let root = record;
  while (root.parent) root = root.parent;
  return root;
}
function ancestors(record: PdfFieldRecord): PdfFieldRecord[] {
  const result: PdfFieldRecord[] = [];
  for (let current: PdfFieldRecord | undefined = record; current; current = current.parent)
    result.unshift(current);
  return result;
}
function serialized(value: StudioPdfComposeValue): string {
  return JSON.stringify(value) ?? '';
}
function recordName(record: PdfFieldRecord): string {
  if (
    !record.parts.length ||
    record.parts.some((part) => typeof part !== 'string' || !part.length || part.includes('.')) ||
    !record.fullName
  )
    fail(
      'FIELD_NAME',
      record.source.id,
      `${record.path}/T`,
      'Canonical field names must contain nonempty partial names without dots'
    );
  return record.fullName;
}
function radioStates(record: PdfFieldRecord): NonNullable<PdfFieldRecord['radioStates']> {
  if (record.radioStates) return record.radioStates;
  const byRaw = new Map<string, { option: string; ordinal: number; key: string }>(),
    counts = new Map<string, number>();
  for (const widget of record.widgets) {
    const normal = read(record.source, read(record.source, widget.dict, 'AP'), 'N');
    const states =
      normal instanceof PDFDict
        ? normal
            .keys()
            .filter((key) => key !== name('Off'))
            .map((key) => key.decodeText())
        : [];
    if (states.length !== 1)
      fail(
        'RADIO_AP_STATES',
        record.source.id,
        `${widget.path}/AP/N`,
        'Radio widget must have exactly one canonical on-state appearance'
      );
    const raw = states[0];
    if (byRaw.has(raw)) {
      if (byRaw.get(raw)?.option !== widget.option)
        fail(
          'RADIO_STATE_ALIAS',
          record.source.id,
          widget.path,
          'One native radio state aliases different export options'
        );
      continue;
    }
    const option = widget.option;
    if (option === undefined)
      fail('RADIO_OPTION', record.source.id, widget.path, 'Radio widget has no export option');
    const ordinal = counts.get(option) ?? 0;
    counts.set(option, ordinal + 1);
    byRaw.set(raw, { option, ordinal, key: serialized([option, ordinal]) });
  }
  return (record.radioStates = { byRaw, counts });
}
function valueOf(record: PdfFieldRecord, defaultValue = false): StudioPdfComposeValue {
  if (record.kind === 'radio') {
    const raw = text(record.effective[defaultValue ? 'DV' : 'V']);
    if (raw === undefined || raw === 'Off') return undefined;
    const state = radioStates(record).byRaw.get(raw);
    if (!state)
      fail(
        'RADIO_VALUE',
        record.source.id,
        `${record.path}/${defaultValue ? 'DV' : 'V'}`,
        `Radio value /${raw} has no canonical widget appearance`
      );
    return [state.option, state.ordinal];
  }
  if (record.kind === 'opaque' || record.kind === 'signature' || record.kind === 'button')
    return canonical(record.source, record.effective[defaultValue ? 'DV' : 'V']);
  const value = fieldValue(record, defaultValue);
  return ['text', 'date', 'image'].includes(record.kind) ? (value ?? '') : value;
}
function definitionOf(record: PdfFieldRecord): Record<string, StudioPdfComposeValue> {
  const definition = fieldDefinition(record);
  definition.Ff = record.flags;
  definition.da = daSemantics(record.source, record);
  definition.extra = canonical(record.source, record.dict, [
    'Parent',
    'Kids',
    'T',
    'FT',
    'Ff',
    'V',
    'DV',
    'Q',
    'DA',
    'MaxLen',
    'Opt',
    ...WIDGET_KEYS,
    'A',
    'AA',
    'ZuviFieldImage',
    'ZuviFieldDesign',
  ]);
  if (record.kind === 'radio')
    definition.radioTopology = [...radioStates(record).counts].sort(([a], [b]) =>
      a.localeCompare(b)
    );
  if (record.kind === 'checkbox')
    definition.exports = [
      ...new Set(record.widgets.map((widget) => onValue(record.source, widget.dict))),
    ].sort();
  return definition;
}
function linkRecord(
  node: PdfFieldNode,
  record: PdfFieldRecord,
  valuePolicy: 'reject' | 'first' | 'last'
): void {
  if (['opaque', 'signature', 'button'].includes(record.kind))
    fail(
      'LINK_OPAQUE_FIELD',
      record.source.id,
      record.path,
      `Passive ${record.kind} fields can be renamed and retained, but cannot be linked safely`
    );
  const first = node.records[0];
  if (serialized(definitionOf(first)) !== serialized(definitionOf(record)))
    fail(
      'LINK_DEFINITION',
      record.source.id,
      record.path,
      `Field ${record.fullName} has an incompatible type, flags, options, actions, or default resources`
    );
  const currentEqual = serialized(valueOf(first)) === serialized(valueOf(record)),
    defaultEqual = serialized(valueOf(first, true)) === serialized(valueOf(record, true));
  if ((!currentEqual || !defaultEqual) && valuePolicy === 'reject')
    fail(
      'LINK_VALUE',
      record.source.id,
      record.path,
      `Field ${record.fullName} has conflicting V or DV; choose rename or an explicit safe value policy`
    );
  if ((!currentEqual || !defaultEqual) && !['checkbox', 'radio'].includes(record.kind))
    fail(
      'LINK_VALUE_APPEARANCE',
      record.source.id,
      record.path,
      `Changing linked ${record.kind} values would require regenerating source appearances; rename or align the values first`
    );
  node.records.push(record);
  if (valuePolicy === 'last') node.valueRecord = record;
}
function planFields(
  sources: readonly PdfComposeSourceState[],
  strategy: 'rename' | 'link',
  valuePolicy: 'reject' | 'first' | 'last',
  target: PDFDocumentType,
  report: StudioPdfComposeReport
): Map<string, PdfFieldNode> {
  const nodes = new Map<string, PdfFieldNode>(),
    roots = new Set<string>();
  for (let sourceIndex = 0; sourceIndex < sources.length; sourceIndex++) {
    const source = sources[sourceIndex],
      selectedPageIndices = new Set(source.instances.map((instance) => instance.sourcePage));
    source.selectedFields = source.fields.filter(
      (record) =>
        !record.widgets.length ||
        record.widgets.some((widget) => selectedPageIndices.has(widget.pageIndex))
    );
    for (const record of source.selectedFields)
      for (const ancestor of ancestors(record)) recordName(ancestor);
    prepareResources(source, source.selectedFields, `Z${sourceIndex + 1}`);
    source.fieldNodes = new Map();
    source.fieldNames = new Map();
    source.fieldMapping = new Map();
    const rootNames = new Map<PdfFieldRecord, string>();
    for (const record of source.selectedFields) {
      const root = rootRecord(record);
      if (rootNames.has(root)) continue;
      const original = root.parts[0];
      let mapped = original;
      if (strategy === 'rename' && roots.has(mapped)) {
        let suffix = sourceIndex + 1;
        while (roots.has(`${original}__${suffix}`)) suffix++;
        mapped = `${original}__${suffix}`;
      }
      roots.add(mapped);
      rootNames.set(root, mapped);
    }
    for (const record of source.selectedFields) {
      if (record.kind === 'opaque' && rootNames.get(rootRecord(record)) !== record.parts[0])
        fail(
          'OPAQUE_FIELD_RENAME',
          source.id,
          `${record.path}/T`,
          'An unknown field type cannot be renamed without interpreting its private name semantics'
        );
      if (rootNames.get(rootRecord(record)) !== record.parts[0])
        for (const ancestor of ancestors(record))
          for (const [key] of ancestor.dict.entries())
            if (
              !FIELD_KEYS.has(key.decodeText()) &&
              !WIDGET_KEYS.has(key.decodeText()) &&
              !['Parent', 'A', 'AA', 'Type'].includes(key.decodeText())
            )
              fail(
                'OPAQUE_RENAME_METADATA',
                source.id,
                `${ancestor.path}/${key.decodeText()}`,
                'Private field metadata cannot be renamed without a known name-reference schema'
              );
      let parent: PdfFieldNode | undefined;
      const chain = ancestors(record),
        rootPart = rootNames.get(chain[0]);
      if (rootPart === undefined)
        fail('FIELD_NAME', source.id, record.path, 'Field root has no mapped name');
      for (let index = 0; index < chain.length; index++) {
        const original = chain[index],
          parts = [rootPart, ...original.parts.slice(1)],
          fullName = parts.join('.'),
          terminal = original === record;
        let node = nodes.get(fullName);
        if (node) {
          if (node.terminal !== terminal)
            fail(
              'LINK_TREE',
              source.id,
              original.path,
              `Field ${fullName} collides with a field group`
            );
          if (terminal && !node.records.includes(record)) linkRecord(node, record, valuePolicy);
          else if (!terminal && !node.records.includes(original)) {
            const skip = ['Parent', 'Kids', 'T', ...INHERITED_FIELD_KEYS];
            if (
              serialized(canonical(node.records[0].source, node.records[0].dict, skip)) !==
              serialized(canonical(source, original.dict, skip))
            )
              fail(
                'LINK_GROUP',
                source.id,
                original.path,
                `Field group ${fullName} has incompatible retained metadata`
              );
            node.records.push(original);
          }
        } else {
          const dict = target.context.obj({}),
            ref = target.context.register(dict);
          node = {
            fullName,
            part: parts[parts.length - 1],
            parts,
            dict,
            ref,
            parent,
            children: [],
            terminal,
            records: [original],
            valueRecord: original,
            widgets: [],
          };
          nodes.set(fullName, node);
          if (parent) parent.children.push(node);
        }
        if (parent && node.parent !== parent)
          fail(
            'LINK_TREE',
            source.id,
            original.path,
            'Linked field has an inconsistent parent hierarchy'
          );
        source.fieldNodes.set(original, node);
        source.fieldNames.set(recordName(original), fullName);
        source.fieldMapping.set(original.ref.toString(), node.ref);
        parent = node;
      }
    }
  }
  for (const node of nodes.values())
    if (node.terminal && node.records.length > 1)
      for (const record of node.records) {
        const selected = node.valueRecord;
        if (
          serialized(valueOf(record)) !== serialized(valueOf(selected)) ||
          serialized(valueOf(record, true)) !== serialized(valueOf(selected, true))
        )
          report.valueResolutions.push({
            field: node.fullName,
            policy: valuePolicy,
            sourceId: record.source.id,
            chosenSourceId: selected.source.id,
            currentBefore: fieldValue(record),
            currentAfter: fieldValue(selected),
            defaultBefore: fieldValue(record, true),
            defaultAfter: fieldValue(selected, true),
            currentStateBefore: valueOf(record),
            currentStateAfter: valueOf(selected),
            defaultStateBefore: valueOf(record, true),
            defaultStateAfter: valueOf(selected, true),
          });
      }
  report.fields = sources.flatMap((source) =>
    source.selectedFields.map((record) => ({
      sourceId: source.id,
      sourceName: recordName(record),
      targetName: source.fieldNames.get(recordName(record))!,
      kind: record.kind,
      linked: fieldNode(source, record).records.length > 1,
    }))
  );
  return nodes;
}
function pageResolver(source: PdfComposeSourceState, instance?: PdfPageInstance): PdfPageResolver {
  return (ref) => {
    const sourcePage = source.pages.findIndex((page) => page.ref.toString() === ref.toString());
    if (sourcePage < 0)
      fail('PAGE_REFERENCE', source.id, '/', `Unknown source page reference ${ref.toString()}`);
    if (instance?.sourcePage === sourcePage) return instance.page.ref;
    const candidates = source.instances.filter((candidate) => candidate.sourcePage === sourcePage);
    return (
      (instance
        ? candidates.find((candidate) => candidate.groupId === instance.groupId)
        : undefined
      )?.page.ref ??
      candidates.find((candidate) => candidate.groupId === `source:${source.id}`)?.page.ref ??
      candidates[0]?.page.ref
    );
  };
}
function copyStatic(
  _source: PdfComposeSourceState,
  dict: PDFDict,
  output: PDFDict,
  copier: ClosedPdfCopier,
  path: string,
  excluded: ReadonlySet<string>
): void {
  for (const [key, value] of dict.entries())
    if (!excluded.has(key.decodeText()))
      output.set(key, copier.copy(value, `${path}/${key.decodeText()}`));
}
function scopedNavigation(
  source: PdfComposeSourceState,
  target: PDFDocumentType,
  copier: ClosedPdfCopier,
  instance: PdfPageInstance | undefined,
  report: StudioPdfComposeReport
): PdfNavigation {
  return new PdfNavigation({
    source,
    target,
    copier,
    resolvePage: pageResolver(source, instance),
    fieldNames: source.fieldNames,
    fieldRefs: source.fieldMapping,
    annotationRefs: instance?.mapping ?? source.annotationMapping,
    annotationNames: instance?.annotationNames ?? source.annotationNames,
    report,
  });
}
function combinedEvents(source: PdfComposeSourceState, widget: PdfWidgetRecord): void {
  const additional = read(source, widget.dict, 'AA');
  if (!(additional instanceof PDFDict)) return;
  for (const [event] of additional.entries())
    if (!FIELD_EVENTS.has(event.decodeText()) && !WIDGET_EVENTS.has(event.decodeText()))
      fail(
        'COMBINED_AA_EVENT',
        source.id,
        `${widget.path}/AA/${event.decodeText()}`,
        'Combined field/widget additional action cannot be assigned safely'
      );
}
function rekeyButtonAppearance(
  target: PDFDocumentType,
  widget: PDFDict,
  oldState: string,
  newState: string
): void {
  const original = widget.lookup(name('AP'));
  if (!(original instanceof PDFDict))
    fail(
      'BUTTON_AP',
      'output',
      '/AcroForm/Widgets/AP',
      'Button widget has no appearance dictionary'
    );
  const ap = original.clone(target.context);
  for (const key of ['N', 'R', 'D']) {
    const states = target.context.lookup(original.get(name(key)));
    if (!(states instanceof PDFDict)) continue;
    const copy = states.clone(target.context),
      appearance = copy.get(name(oldState));
    if (appearance && oldState !== newState) {
      copy.delete(name(oldState));
      copy.set(name(newState), appearance);
    }
    ap.set(name(key), copy);
  }
  widget.set(name('AP'), ap);
}
function finishButtons(
  node: PdfFieldNode,
  target: PDFDocumentType,
  orphanRadioValue: 'reject' | 'clear',
  report: StudioPdfComposeReport
): void {
  if (!node.terminal || !node.widgets.length) return;
  const record = node.valueRecord,
    linked = node.records.length > 1;
  if (record.kind === 'radio') {
    const states = radioStates(record),
      keptKeys = new Set(
        node.widgets.map((widget) => {
          const original = nativeWidget(widget);
          return radioState(original.field, nativeOnValue(original)).key;
        })
      );
    const values: Partial<Record<'V' | 'DV', { option: string; ordinal: number; key: string }>> =
      {};
    for (const key of ['V', 'DV'] as const) {
      const raw = text(record.effective[key]),
        state = raw && raw !== 'Off' ? states.byRaw.get(raw) : undefined;
      if (state && !keptKeys.has(state.key)) {
        if (orphanRadioValue !== 'clear')
          fail(
            'RADIO_VALUE_OUTSIDE_SELECTION',
            record.source.id,
            `${record.path}/${key}`,
            `Selected pages omit the widget that represents radio value ${state.option}`
          );
        report.valueResolutions.push({
          field: node.fullName,
          policy: 'clear-unselected-radio',
          key,
          value: state.option,
        });
        values[key] = undefined;
      } else values[key] = state;
    }
    if (linked) {
      const targetStates = new Map<string, string>();
      for (const widget of node.widgets) {
        const original = nativeWidget(widget),
          raw = nativeOnValue(original),
          state = radioState(original.field, raw);
        if (!targetStates.has(state.key)) targetStates.set(state.key, `Zr${targetStates.size}`);
        rekeyButtonAppearance(target, widget.dict, raw, mappedState(targetStates, state.key));
      }
      for (const key of ['V', 'DV'] as const) {
        const state = values[key],
          value = state ? mappedState(targetStates, state.key) : 'Off';
        if (key === 'V' || record.effective[key] !== undefined)
          node.dict.set(name(key), name(value));
      }
      for (const widget of node.widgets) {
        const original = nativeWidget(widget),
          state = radioState(original.field, nativeOnValue(original));
        widget.dict.set(
          name('AS'),
          name(values.V?.key === state.key ? mappedState(targetStates, state.key) : 'Off')
        );
      }
    } else {
      if (!values.V) node.dict.set(name('V'), name('Off'));
      if (!values.DV && record.effective.DV !== undefined) node.dict.set(name('DV'), name('Off'));
      if (orphanRadioValue === 'clear' && !values.V)
        for (const widget of node.widgets) widget.dict.set(name('AS'), name('Off'));
    }
    if (
      !values.DV &&
      record.effective.DV !== undefined &&
      text(record.effective.DV) !== 'Off' &&
      orphanRadioValue === 'clear'
    ) {
      const design = parseDesign(record.source, record.dict);
      if (design?.defaultValue !== undefined)
        node.dict.set(
          name('ZuviFieldDesign'),
          PDFHexString.fromText(
            JSON.stringify({
              ...design,
              defaultValue: '',
              ...(design.sourceName !== undefined ? { sourceName: node.fullName } : {}),
            })
          )
        );
    }
    node.dict.set(
      name('Opt'),
      target.context.obj(
        node.widgets.map((widget) => PDFHexString.fromText(nativeOption(nativeWidget(widget))))
      )
    );
  } else if (record.kind === 'checkbox' && linked) {
    const state = onValue(record.source, record.widgets[0]?.dict);
    if (!state)
      fail('CHECKBOX_AP', record.source.id, record.path, 'Checkbox has no canonical on-state');
    if (
      node.records.some(
        (entry) =>
          new Set(entry.widgets.map((widget) => onValue(entry.source, widget.dict))).size !== 1
      )
    )
      fail(
        'LINK_CHECKBOX_EXPORT',
        record.source.id,
        record.path,
        'Linked checkbox must have one common native export state per source'
      );
    for (const widget of node.widgets) {
      const original = nativeWidget(widget);
      rekeyButtonAppearance(target, widget.dict, nativeOnValue(original), state);
      widget.dict.set(name('AS'), name(valueOf(record) ? state : 'Off'));
    }
    node.dict.set(name('V'), name(valueOf(record) ? state : 'Off'));
    if (
      record.effective.DV !== undefined ||
      node.records.some((entry) => entry.effective.DV !== undefined)
    )
      node.dict.set(name('DV'), name(valueOf(record, true) ? state : 'Off'));
  }
}
function nativeWidget(widget: PdfTargetAnnotation): PdfWidgetRecord {
  if (!widget.original)
    fail(
      'FIELD_SELECTION',
      undefined,
      '/AcroForm/Widgets',
      'Target field widget has no source widget'
    );
  return widget.original;
}
function nativeOnValue(widget: PdfWidgetRecord): string {
  const raw = onValue(widget.field.source, widget.dict);
  if (raw === undefined)
    fail('BUTTON_AP', widget.field.source.id, widget.path, 'Widget has no canonical on-state');
  return raw;
}
function nativeOption(widget: PdfWidgetRecord): string {
  if (widget.option === undefined)
    fail('RADIO_OPTION', widget.field.source.id, widget.path, 'Radio widget has no export option');
  return widget.option;
}
function radioState(
  record: PdfFieldRecord,
  raw: string
): { option: string; ordinal: number; key: string } {
  const state = radioStates(record).byRaw.get(raw);
  if (!state)
    fail('RADIO_AP_STATES', record.source.id, record.path, 'Radio widget state is missing');
  return state;
}
function mappedState(states: ReadonlyMap<string, string>, key: string): string {
  const state = states.get(key);
  if (state === undefined)
    fail('RADIO_AP_STATES', undefined, '/AcroForm/Widgets', 'Mapped radio state is missing');
  return state;
}
function fieldNode(source: PdfComposeSourceState, record: PdfFieldRecord): PdfFieldNode {
  const node = source.fieldNodes.get(record);
  if (!node) fail('FIELD_SELECTION', source.id, record.path, 'Field has no mapped canonical node');
  return node;
}
function scopeFor(scopes: ReadonlyMap<string, PdfComposeScope>, sourceId: string): PdfComposeScope {
  const scope = scopes.get(sourceId);
  if (!scope) fail('FIELD_SELECTION', sourceId, '/', 'Source has no native copy scope');
  return scope;
}

/** Compose selected native pages into one fresh context, with an all-or-nothing result. */
export async function composePdf({
  sources: inputs,
  pages: selections,
  conflicts = {},
  catalogPolicy = 'primary',
  orphanRadioValue = 'reject',
}: StudioPdfComposeInput): Promise<StudioPdfComposeResult> {
  if (!Array.isArray(inputs) || !inputs.length || inputs.length > 20)
    fail('SOURCE_LIMIT', undefined, '/sources', 'Choose 1 to 20 PDF sources');
  if (!Array.isArray(selections) || !selections.length || selections.length > 200)
    fail('SELECTION_LIMIT', undefined, '/pages', 'Choose 1 to 200 output pages');
  if (!conflicts || typeof conflicts !== 'object')
    fail('POLICY', undefined, '/conflicts', 'Field conflict policy must be an object');
  const strategy = conflicts.strategy ?? 'rename',
    valuePolicy = conflicts.valuePolicy ?? 'reject';
  if (
    !['rename', 'link'].includes(strategy) ||
    !['reject', 'first', 'last'].includes(valuePolicy) ||
    !['reject', 'clear'].includes(orphanRadioValue)
  )
    fail('POLICY', undefined, '/conflicts', 'Unsupported field-conflict or radio-selection policy');
  const ids = inputs.map((input) => input.id);
  if (ids.some((id) => typeof id !== 'string' || !id.length) || new Set(ids).size !== ids.length)
    fail('SOURCE_ID', undefined, '/sources', 'Source ids must be nonempty and unique');
  const instanceIds = selections.map(
    (selection, index) => selection.instanceId ?? `page-${index + 1}`
  );
  if (
    instanceIds.some((id) => typeof id !== 'string' || !id.length) ||
    new Set(instanceIds).size !== selections.length
  )
    fail('INSTANCE_ID', undefined, '/pages', 'Page instance ids must be nonempty unique strings');
  if (
    selections.some(
      (selection) =>
        selection.groupId !== undefined &&
        (typeof selection.groupId !== 'string' || !selection.groupId.length)
    )
  )
    fail('GROUP_ID', undefined, '/pages', 'Copy-group ids must be nonempty strings');
  const prepared = await Promise.all(
    inputs.map(async (input) => ({ ...input, bytes: await byteArray(input.bytes) }))
  );
  if (prepared.reduce((size, input) => size + input.bytes.length, 0) > 50 * 1024 * 1024)
    fail(
      'AGGREGATE_LIMIT',
      undefined,
      '/sources',
      'Selected sources together must be at most 50 MiB'
    );
  const sources = await Promise.all(prepared.map(loadSource)),
    target = await PDFDocument.create({ updateMetadata: false });
  const report: StudioPdfComposeReport = {
    pages: [],
    fields: [],
    warnings: [],
    prunedNavigation: [],
    valueResolutions: [],
    catalogDecisions: [],
    destinationNames: [],
    sources: sources.map((source) => ({
      id: source.id,
      hash: hash(source.bytes),
      pageCount: source.pages.length,
    })),
  };
  for (const source of sources) {
    source.instances = [];
    source.annotationNames = new Map();
  }
  const instances: PdfPageInstance[] = selections.map((selection, index) => {
    const source = sources.find((entry) => entry.id === selection.sourceId);
    if (!source)
      fail(
        'SELECTION_SOURCE',
        selection.sourceId,
        `/pages[${index}]`,
        'Page source does not exist'
      );
    if (
      !Number.isInteger(selection.sourcePage) ||
      selection.sourcePage < 0 ||
      selection.sourcePage >= source.pages.length
    )
      fail(
        'SELECTION_PAGE',
        source.id,
        `/pages[${index}]/sourcePage`,
        'Page index is outside the source PDF'
      );
    const instance: PdfPageInstance = {
      ...selection,
      source,
      index,
      instanceId: instanceIds[index],
      groupId: selection.groupId ?? `source:${source.id}`,
      page: PDFPage.create(target),
      annotations: [],
      mapping: new Map<string, PDFRef>(),
      annotationNames: new Map<string, string[]>(),
    };
    source.instances.push(instance);
    return instance;
  });
  const activeSources = sources.filter((source) => source.instances.length),
    nodes = planFields(activeSources, strategy, valuePolicy, target, report),
    scopes = new Map<string, PdfComposeScope>();
  // Preallocate every canonical widget and annotation before copying any closure.
  for (const instance of instances) {
    const source = instance.source;
    instance.mapping = new Map(source.fieldMapping);
    for (const entry of source.pages[instance.sourcePage].node.Annots()?.asArray() ?? []) {
      const originalDict = resolve(source, entry);
      if (!(originalDict instanceof PDFDict))
        fail('ANNOTATION_DICTIONARY', source.id, '/Pages/Annots', 'Annotation is not a dictionary');
      const original = source.widgetOwners.get(originalDict),
        dict = target.context.obj({}),
        ref = target.context.register(dict),
        key =
          entry instanceof PDFRef
            ? entry.toString()
            : source.pdf.context.getObjectRef(originalDict)?.toString();
      const annotation: PdfTargetAnnotation = {
        entry,
        original,
        originalDict,
        dict,
        ref,
        page: instance.page,
        index: instance.index,
        instance,
      };
      instance.annotations.push(annotation);
      if (key) instance.mapping.set(key, ref);
      if (original) {
        const node = source.fieldNodes.get(original.field);
        if (!node)
          fail(
            'FIELD_SELECTION',
            source.id,
            original.path,
            'Selected widget has no target canonical field'
          );
        node.widgets.push(annotation);
        annotation.fieldNode = node;
        combinedEvents(source, original);
      }
      const originalName = text(read(source, originalDict, 'NM'));
      if (originalName !== undefined) {
        instance.annotationNames.set(originalName, [originalName]);
        const list = source.annotationNames.get(originalName) ?? [];
        list.push(originalName);
        source.annotationNames.set(originalName, list);
      }
    }
  }
  for (let index = 0; index < activeSources.length; index++) {
    const source = activeSources[index],
      mapping = new Map(source.fieldMapping);
    source.annotationMapping = new Map();
    const preferred = [
      ...source.instances.filter((instance) => instance.groupId === `source:${source.id}`),
      ...source.instances.filter((instance) => instance.groupId !== `source:${source.id}`),
    ];
    for (const instance of preferred)
      for (const annotation of instance.annotations) {
        const key =
          annotation.entry instanceof PDFRef
            ? annotation.entry.toString()
            : source.pdf.context.getObjectRef(annotation.originalDict)?.toString();
        if (key && !mapping.has(key)) mapping.set(key, annotation.ref);
        if (key && !source.annotationMapping.has(key))
          source.annotationMapping.set(key, annotation.ref);
      }
    const copier = new ClosedPdfCopier(source, target, mapping, pageResolver(source));
    scopes.set(source.id, {
      copier,
      navigation: scopedNavigation(source, target, copier, undefined, report),
      namePrefix: `Z${index + 1}::`,
    });
  }
  for (const node of nodes.values()) {
    const record = node.records[0],
      source = record.source,
      scope = scopeFor(scopes, source.id),
      excluded = new Set([
        'Parent',
        'Kids',
        'T',
        'A',
        'AA',
        'Dest',
        ...(node.terminal && source.widgetOwners.has(record.dict) ? WIDGET_KEYS : []),
        ...INHERITED_FIELD_KEYS,
      ]);
    copyStatic(source, record.dict, node.dict, scope.copier, record.path, excluded);
    node.dict.set(name('T'), PDFHexString.fromText(node.part));
    if (node.parent) node.dict.set(name('Parent'), node.parent.ref);
    for (const key of INHERITED_FIELD_KEYS) {
      const valueRecord = ['V', 'DV'].includes(key) ? node.valueRecord : record,
        value = key === 'DA' ? rewrittenDA(source, record) : valueRecord.effective[key];
      if (value !== undefined)
        node.dict.set(
          name(key),
          key === 'DA'
            ? value
            : scopeFor(scopes, valueRecord.source.id).copier.copy(
                value,
                `${valueRecord.path}/${key}`
              )
        );
    }
    const combined = source.widgetOwners.has(record.dict);
    scope.navigation.copyKeys(record.dict, node.dict, record.path, {
      events: combined ? FIELD_EVENTS : undefined,
      includeAction: !combined,
      includeDest: !combined,
    });
    const designRecord = node.terminal ? node.valueRecord : record,
      design = parseDesign(designRecord.source, designRecord.dict);
    if (design)
      node.dict.set(
        name('ZuviFieldDesign'),
        PDFHexString.fromText(
          JSON.stringify({
            ...design,
            ...(design.sourceName !== undefined ? { sourceName: node.fullName } : {}),
          })
        )
      );
  }
  for (const instance of instances) {
    const source = instance.source,
      nativePage = source.pages[instance.sourcePage],
      annotationMapping = new Map<string, PDFRef>();
    // An annotation can refer to a parent or Popup on another selected page.
    // Resolve within its page-instance group first, then retained source pages.
    // Field/Widget combined dictionaries need annotation identity in this context.
    const preferred = [instance,
      ...source.instances.filter((candidate) => candidate !== instance && candidate.groupId === instance.groupId),
      ...source.instances.filter((candidate) => candidate.groupId === `source:${source.id}` && candidate.groupId !== instance.groupId),
    ];
    for (const candidate of preferred) for (const annotation of candidate.annotations) {
      const key = annotation.entry instanceof PDFRef ? annotation.entry.toString()
        : source.pdf.context.getObjectRef(annotation.originalDict)?.toString();
      if (key && !annotationMapping.has(key)) annotationMapping.set(key, annotation.ref);
    }
    instance.mapping = new Map([
      ...[...source.fieldMapping].filter(([key]) => !source.annotations.has(key)),
      ...annotationMapping,
    ]);
    const copier = new ClosedPdfCopier(
        source,
        target,
        instance.mapping,
        pageResolver(source, instance)
      ),
      navigation = scopedNavigation(source, target, copier, instance, report);
    instance.copier = copier;
    instance.navigation = navigation;
    copyStatic(
      source,
      nativePage.node,
      instance.page.node,
      copier,
      `/Pages[${instance.sourcePage}]`,
      new Set(['Parent', 'Annots', 'A', 'AA', 'Dest'])
    );
    for (const key of PDFPageLeaf.InheritableEntries) {
      const value = nativePage.node.getInheritableAttribute(name(key));
      if (value !== undefined)
        instance.page.node.set(
          name(key),
          copier.copy(value, `/Pages[${instance.sourcePage}]/${key}`)
        );
    }
    navigation.copyKeys(nativePage.node, instance.page.node, `/Pages[${instance.sourcePage}]`);
    for (const annotation of instance.annotations) {
      const combined =
        annotation.original && annotation.original.field.dict === annotation.originalDict;
      copyStatic(
        source,
        annotation.originalDict,
        annotation.dict,
        copier,
        `/Pages[${instance.sourcePage}]/Annots`,
        new Set([
          'P',
          'A',
          'AA',
          'Dest',
          ...(annotation.fieldNode ? ['Parent'] : []),
          ...(combined ? FIELD_KEYS : []),
        ])
      );
      annotation.dict.set(name('P'), instance.page.ref);
      if (annotation.fieldNode) annotation.dict.set(name('Parent'), annotation.fieldNode.ref);
      navigation.copyKeys(
        annotation.originalDict,
        annotation.dict,
        `/Pages[${instance.sourcePage}]/Annots`,
        { events: combined ? WIDGET_EVENTS : undefined }
      );
    }
    instance.page.node.set(
      name('Annots'),
      target.context.obj(instance.annotations.map((annotation) => annotation.ref))
    );
    isolatePageContainers(target, instance.page);
    target.addPage(instance.page);
    report.pages.push({
      instanceId: instance.instanceId,
      sourceId: source.id,
      sourcePage: instance.sourcePage,
      targetPage: instance.index,
    });
  }
  const form = target.context.obj({}),
    dr = target.context.obj({});
  for (const node of nodes.values()) {
    if (node.terminal) {
      node.widgets.sort(
        (a, b) => a.index - b.index || nativeWidget(a).index - nativeWidget(b).index
      );
      node.dict.set(name('Kids'), target.context.obj(node.widgets.map((widget) => widget.ref)));
    } else node.dict.set(name('Kids'), target.context.obj(node.children.map((child) => child.ref)));
    finishButtons(node, target, orphanRadioValue, report);
  }
  if (nodes.size) {
    form.set(
      name('Fields'),
      target.context.obj([...nodes.values()].filter((node) => !node.parent).map((node) => node.ref))
    );
    for (const source of activeSources)
      copyResources(source, target, scopeFor(scopes, source.id).copier, dr);
    form.set(name('DR'), dr);
    const calculationOrder: PDFRef[] = [];
    for (const source of activeSources) {
      const co = read(source, source.form, 'CO');
      if (co && !(co instanceof PDFArray))
        fail('CALCULATION_ORDER', source.id, '/AcroForm/CO', 'Calculation order is not an array');
      for (const ref of co?.asArray() ?? []) {
        if (!(ref instanceof PDFRef) || !source.fieldRefs.has(ref.toString()))
          fail(
            'CALCULATION_ORDER',
            source.id,
            '/AcroForm/CO',
            'Calculation order refers to a noncanonical field'
          );
        const mapped = source.fieldMapping.get(ref.toString());
        if (mapped && !calculationOrder.includes(mapped)) calculationOrder.push(mapped);
      }
      for (const [key] of source.form?.entries() ?? [])
        if (!['Fields', 'DR', 'DA', 'Q', 'NeedAppearances', 'CO'].includes(key.decodeText()))
          fail(
            'OPAQUE_ACROFORM',
            source.id,
            `/AcroForm/${key.decodeText()}`,
            'AcroForm property cannot be combined safely'
          );
    }
    if (calculationOrder.length) form.set(name('CO'), target.context.obj(calculationOrder));
    // Every terminal has a materialized DA/Q; avoid a document-wide default that could change another source.
    target.catalog.set(name('AcroForm'), target.context.register(form));
  }
  copyCatalog({ sources: activeSources, target, scopes, report, catalogPolicy });
  const bytes = await target.save({ updateFieldAppearances: false, useObjectStreams: false });
  if (bytes.length > 50 * 1024 * 1024)
    fail(
      'OUTPUT_LIMIT',
      undefined,
      '/output',
      'Composed PDF exceeds the supported 50 MiB source size'
    );
  const reopened = await loadSource({ id: 'composed-output', bytes });
  const pageObjects = reopened.pdf.context
    .enumerateIndirectObjects()
    .filter(
      ([, object]) => object instanceof PDFDict && text(read(reopened, object, 'Type')) === 'Page'
    );
  if (reopened.pages.length !== instances.length || pageObjects.length !== instances.length)
    fail(
      'OUTPUT_PAGE_CLOSURE',
      undefined,
      '/Pages',
      'Output contains a page outside the selected native-page closure'
    );
  const expectedFields = [...nodes.values()]
    .filter((node) => node.terminal)
    .map((node) => node.fullName)
    .sort();
  if (
    serialized(reopened.fields.map((record) => record.fullName).sort()) !==
    serialized(expectedFields)
  )
    fail(
      'OUTPUT_FIELD_TREE',
      undefined,
      '/AcroForm/Fields',
      'Output canonical fields do not match the planned name mapping'
    );
  for (const source of sources)
    if (hash(source.bytes) !== report.sources.find((entry) => entry.id === source.id)?.hash)
      fail('SOURCE_MUTATION', source.id, '/', 'Composer mutated an input byte buffer');
  return {
    bytes,
    report,
    stats: {
      pages: reopened.pages.length,
      fields: reopened.fields.length,
      widgets: reopened.fields.reduce((count, record) => count + record.widgets.length, 0),
      nativePageObjects: pageObjects.length,
    },
    sourceHash: hash(bytes),
  };
}

export async function extractPdf(
  bytes: StudioPdfComposeBytes,
  sourcePages: readonly number[],
  options: StudioPdfComposeOptions = {}
): Promise<StudioPdfComposeResult> {
  return composePdf({
    ...options,
    sources: [{ id: 'source', bytes }],
    pages: sourcePages.map((sourcePage, index) => ({
      sourceId: 'source',
      sourcePage,
      instanceId: `extract-${index + 1}`,
    })),
  });
}
