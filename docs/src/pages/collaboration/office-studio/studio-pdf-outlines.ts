import {
  PDFArray,
  PDFDict,
  PDFHexString,
  PDFName,
  PDFNull,
  PDFNumber,
  PDFRef,
  PDFString,
  type PDFDocument,
  type PDFObject,
} from 'pdf-lib';

export type PdfOutlineViewKind =
  'XYZ' | 'Fit' | 'FitH' | 'FitV' | 'FitR' | 'FitB' | 'FitBH' | 'FitBV';
export interface PdfOutlinePageTarget {
  pageId: string;
  view: { kind: PdfOutlineViewKind; parameters: (number | null)[] };
}
/** PDF objects never cross this boundary. Native IDs bind unchanged private data to its source. */
export interface PdfOutlineNode {
  id: string;
  title: string;
  expanded: boolean;
  children: PdfOutlineNode[];
  nativeId?: string;
  target?: PdfOutlinePageTarget | null;
  /** Informational only. Nonlocal actions are preserved, never executed by this module. */
  passiveNavigation?: string;
}
export type PdfOutlineEdit =
  | { type: 'insert'; parentId?: string; index: number; node: PdfOutlineNode }
  | {
      type: 'update';
      id: string;
      title?: string;
      expanded?: boolean;
      target?: PdfOutlinePageTarget | null;
    }
  | { type: 'remove'; id: string }
  | { type: 'move'; id: string; parentId?: string; index: number };

const LIMIT = 20_000;
const DEPTH = 128;
const PARAMETERS: Record<PdfOutlineViewKind, number> = {
  XYZ: 3,
  Fit: 0,
  FitH: 1,
  FitV: 1,
  FitR: 4,
  FitB: 0,
  FitBH: 1,
  FitBV: 1,
};
const name = (value: string) => PDFName.of(value);
const nativeIdentity = (ref: PDFRef) => `pdf-outline:${ref.objectNumber}:${ref.generationNumber}`;
function error(path: string, detail: string): never {
  throw new Error(`PDF 目录 ${path}：${detail}`);
}
function keys(value: object, allowed: readonly string[], path: string): void {
  if (Object.keys(value).some((key) => !allowed.includes(key)))
    error(path, '包含未定义的编辑属性。');
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const text = (value: PDFObject | undefined): string | undefined =>
  value instanceof PDFString || value instanceof PDFHexString || value instanceof PDFName
    ? value.decodeText()
    : undefined;

function validatePageIds(pageIds: readonly string[], count?: number): Set<string> {
  if (
    !Array.isArray(pageIds) ||
    !pageIds.length ||
    (count !== undefined && pageIds.length !== count) ||
    pageIds.some((id) => typeof id !== 'string' || !id) ||
    new Set(pageIds).size !== pageIds.length
  )
    error('/pages', '页面身份列表无效或与原生页面数量不符。');
  return new Set(pageIds);
}
function validateTarget(
  value: PdfOutlinePageTarget | null | undefined,
  pages: ReadonlySet<string>,
  path: string
): void {
  if (value === undefined || value === null) return;
  if (
    !value ||
    typeof value !== 'object' ||
    !pages.has(value.pageId) ||
    !value.view ||
    !Object.prototype.hasOwnProperty.call(PARAMETERS, value.view.kind) ||
    !Array.isArray(value.view.parameters) ||
    value.view.parameters.length !== PARAMETERS[value.view.kind]
  )
    error(path, '页面目标或视图参数无效。');
  keys(value, ['pageId', 'view'], path);
  keys(value.view, ['kind', 'parameters'], path);
  if (
    value.view.parameters.some(
      (v) => v !== null && (typeof v !== 'number' || !Number.isFinite(v))
    ) ||
    (value.view.kind === 'FitR' && value.view.parameters.some((v) => v === null))
  )
    error(path, '视图坐标须为有限数字或允许的 null。');
  const coordinates = value.view.parameters;
  if (
    value.view.kind === 'FitR' &&
    (coordinates[0]! >= coordinates[2]! || coordinates[1]! >= coordinates[3]!)
  )
    error(path, 'FitR 须为具有正宽高的矩形。');
  if (value.view.kind === 'XYZ' && coordinates[2] !== null && coordinates[2] < 0)
    error(path, '缩放比例不能为负数。');
}
export function validatePdfOutlines(
  tree: readonly PdfOutlineNode[],
  pageIds: readonly string[]
): void {
  const pages = validatePageIds(pageIds),
    ids = new Set<string>(),
    nativeIds = new Set<string>(),
    seen = new Set<object>();
  let count = 0;
  const walk = (items: readonly PdfOutlineNode[], depth: number) => {
    if (!Array.isArray(items) || depth > DEPTH || seen.has(items))
      error('/tree', '目录层级无效、过深或存在循环。');
    seen.add(items);
    for (const item of items) {
      if (++count > LIMIT) error('/tree', '目录超过 20000 项。');
      if (!item || typeof item !== 'object' || seen.has(item))
        error('/tree', '目录节点无效、循环或被重复引用。');
      seen.add(item);
      keys(
        item,
        ['id', 'title', 'expanded', 'children', 'nativeId', 'target', 'passiveNavigation'],
        '/tree'
      );
      if (
        typeof item.id !== 'string' ||
        !/^[A-Za-z0-9_.:-]{1,160}$/.test(item.id) ||
        ids.has(item.id)
      )
        error('/id', '目录身份无效或重复。');
      ids.add(item.id);
      if (
        typeof item.title !== 'string' ||
        (!item.title.trim() && item.nativeId === undefined) ||
        item.title.length > 4096 ||
        typeof item.expanded !== 'boolean'
      )
        error(item.id, '新标题须非空且不超过 4096 字符，展开状态须为布尔值。');
      if (item.nativeId !== undefined) {
        if (
          typeof item.nativeId !== 'string' ||
          !/^\d+ \d+ R$/.test(item.nativeId) ||
          nativeIds.has(item.nativeId)
        )
          error(item.id, '原生身份无效或重复。');
        nativeIds.add(item.nativeId);
        const [object, generation] = item.nativeId.split(' ');
        if (item.id !== `pdf-outline:${object}:${generation}`)
          error(item.id, '原生节点身份与引用不符。');
      } else if (item.id.startsWith('pdf-outline:')) error(item.id, '原生身份缺少来源引用。');
      if (
        item.passiveNavigation !== undefined &&
        (typeof item.passiveNavigation !== 'string' ||
          item.passiveNavigation.length > 256 ||
          item.nativeId === undefined)
      )
        error(item.id, '被动导航身份无效。');
      validateTarget(item.target, pages, item.id);
      walk(item.children, depth + 1);
      if (!item.children.length && !item.expanded) error(item.id, '空目录节点没有可折叠的子项。');
    }
  };
  walk(tree, 0);
}

interface NativeOutline {
  node: PdfOutlineNode;
  dict: PDFDict;
  ref: PDFRef;
}
interface OutlineInventory {
  tree: PdfOutlineNode[];
  items: Map<string, NativeOutline>;
  root?: PDFDict;
  rootRef?: PDFRef;
}

function inventory(pdf: PDFDocument, pageIds: readonly string[]): OutlineInventory {
  validatePageIds(pageIds, pdf.getPageCount());
  const resolve = (value: PDFObject | undefined) =>
    value === undefined ? undefined : pdf.context.lookup(value);
  const dict = (value: PDFObject | undefined, path: string): PDFDict => {
    const result = resolve(value);
    if (!(result instanceof PDFDict)) error(path, '预期原生字典。');
    return result;
  };
  const names = new Map<string, PDFObject>();
  const addName = (key: string, value: PDFObject) => {
    if (names.has(key)) error('/Dests', '命名目标重复。');
    names.set(key, value);
  };
  const legacy = resolve(pdf.catalog.get(name('Dests')));
  if (legacy !== undefined) {
    if (!(legacy instanceof PDFDict)) error('/Dests', '命名目标字典无效。');
    for (const [key, value] of legacy.entries()) addName(key.decodeText(), value);
  }
  const catalogNames = resolve(pdf.catalog.get(name('Names')));
  if (catalogNames !== undefined && !(catalogNames instanceof PDFDict))
    error('/Names', '命名树根无效。');
  const nameRoot = catalogNames instanceof PDFDict ? catalogNames.get(name('Dests')) : undefined;
  const nameSeen = new Set<PDFDict>();
  let nameCount = 0;
  const readNames = (raw: PDFObject, depth: number) => {
    if (depth > DEPTH || ++nameCount > LIMIT) error('/Names/Dests', '命名树过大或过深。');
    const node = dict(raw, '/Names/Dests');
    if (nameSeen.has(node)) error('/Names/Dests', '命名目标树循环或重复引用。');
    nameSeen.add(node);
    const kids = resolve(node.get(name('Kids'))),
      values = resolve(node.get(name('Names')));
    if (kids !== undefined && values !== undefined)
      error('/Names/Dests', '节点同时包含 Kids 和 Names。');
    if (kids !== undefined) {
      if (!(kids instanceof PDFArray)) error('/Names/Dests/Kids', '子节点列表无效。');
      kids.asArray().forEach((child) => readNames(child, depth + 1));
    }
    if (values !== undefined) {
      if (!(values instanceof PDFArray) || values.size() % 2)
        error('/Names/Dests/Names', '名称和值须配对。');
      for (let i = 0; i < values.size(); i += 2) {
        const key = resolve(values.get(i));
        if (!(key instanceof PDFString || key instanceof PDFHexString))
          error('/Names/Dests/Names', '名称须为字符串。');
        addName(key.decodeText(), values.get(i + 1));
      }
    }
  };
  if (nameRoot) readNames(nameRoot, 0);
  const refs = new Map(pdf.getPages().map((page, index) => [page.ref.toString(), pageIds[index]]));
  const destination = (
    raw: PDFObject | undefined,
    visiting = new Set<PDFObject | string>()
  ): PdfOutlinePageTarget => {
    const value = resolve(raw);
    if (!value || visiting.size > DEPTH || visiting.has(value))
      error('/Dest', '目标缺失、循环或过深。');
    const key = text(value);
    if (key !== undefined) {
      if (visiting.has(key) || !names.has(key)) error('/Dest', '命名目标缺失或循环。');
      const next = new Set(visiting);
      next.add(key);
      return destination(names.get(key), next);
    }
    if (value instanceof PDFDict) {
      const next = new Set(visiting);
      next.add(value);
      return destination(value.get(name('D')), next);
    }
    if (!(value instanceof PDFArray) || value.size() < 2) error('/Dest', '页面目标须为原生数组。');
    const first = value.get(0);
    const pageId =
      first instanceof PDFRef
        ? refs.get(first.toString())
        : first instanceof PDFNumber && Number.isSafeInteger(first.asNumber())
          ? pageIds[first.asNumber()]
          : undefined;
    if (!pageId) error('/Dest', '目标页面不属于当前 PDF。');
    const kind = text(resolve(value.get(1))) as PdfOutlineViewKind;
    const parameters = value
      .asArray()
      .slice(2)
      .map((raw) => {
        const coordinate = resolve(raw);
        if (coordinate === PDFNull) return null;
        if (!(coordinate instanceof PDFNumber)) error('/Dest', '目标坐标无效。');
        return coordinate.asNumber();
      });
    const target = { pageId, view: { kind, parameters } };
    validateTarget(target, new Set(pageIds), '/Dest');
    return target;
  };
  const rawRoot = pdf.catalog.get(name('Outlines'));
  if (rawRoot === undefined) return { tree: [], items: new Map() };
  const root = dict(rawRoot, '/Outlines'),
    rootRef = rawRoot instanceof PDFRef ? rawRoot : undefined;
  const rootType = resolve(root.get(name('Type'))),
    rootCount = resolve(root.get(name('Count')));
  if (rootType !== undefined && rootType !== name('Outlines'))
    error('/Outlines/Type', '目录根类型无效。');
  if (
    rootCount !== undefined &&
    (!(rootCount instanceof PDFNumber) ||
      !Number.isSafeInteger(rootCount.asNumber()) ||
      rootCount.asNumber() < 0)
  )
    error('/Outlines/Count', '目录根计数须为非负整数。');
  const items = new Map<string, NativeOutline>(),
    seen = new Set<PDFDict>([root]);
  const checkAction = (raw: PDFObject, visiting = new Set<PDFObject>(), depth = 0) => {
    const action = resolve(raw);
    if (!action || visiting.has(action) || depth > DEPTH) error('/Outlines/A', '动作循环或过深。');
    const next = new Set(visiting);
    next.add(action);
    if (action instanceof PDFArray) {
      action.asArray().forEach((value) => checkAction(value, next, depth + 1));
      return;
    }
    if (!(action instanceof PDFDict) || !text(resolve(action.get(name('S')))))
      error('/Outlines/A', '动作字典无效。');
    if (action.lookup(name('S')) === name('GoTo')) destination(action.get(name('D')));
    const chained = action.get(name('Next'));
    if (chained !== undefined) checkAction(chained, next, depth + 1);
  };
  const walk = (
    parent: PDFDict,
    parentRef: PDFRef | undefined,
    depth: number
  ): PdfOutlineNode[] => {
    if (depth > DEPTH) error('/Outlines', '目录层级过深。');
    const first = parent.get(name('First')),
      last = parent.get(name('Last'));
    if (!first && !last) return [];
    if (!first || !last) error('/Outlines', 'First 和 Last 须成对存在。');
    let current: PDFObject | undefined = first,
      previous: PDFRef | undefined,
      final: PDFRef | undefined;
    const result: PdfOutlineNode[] = [];
    while (current) {
      if (!(current instanceof PDFRef)) error('/Outlines', '目录节点须为间接引用。');
      const ref = current,
        nodeDict = dict(ref, '/Outlines/item');
      if (seen.has(nodeDict) || items.size >= LIMIT)
        error('/Outlines', '目录循环、节点重复或超过 20000 项。');
      seen.add(nodeDict);
      const parentLink = nodeDict.get(name('Parent'));
      if (
        parentRef
          ? !(parentLink instanceof PDFRef) || parentLink.toString() !== parentRef.toString()
          : resolve(parentLink) !== parent
      )
        error('/Outlines/Parent', '父节点引用不匹配。');
      const prev = nodeDict.get(name('Prev'));
      if (
        previous
          ? !(prev instanceof PDFRef) || prev.toString() !== previous.toString()
          : prev !== undefined
      )
        error('/Outlines/Prev', '前一兄弟引用不匹配。');
      const title = resolve(nodeDict.get(name('Title')));
      if (!(title instanceof PDFString || title instanceof PDFHexString))
        error('/Outlines/Title', '标题须为原生文本字符串。');
      const count = resolve(nodeDict.get(name('Count')));
      if (
        count !== undefined &&
        (!(count instanceof PDFNumber) || !Number.isSafeInteger(count.asNumber()))
      )
        error('/Outlines/Count', '展开计数须为整数。');
      const node: PdfOutlineNode = {
        id: nativeIdentity(ref),
        nativeId: ref.toString(),
        title: title.decodeText(),
        expanded: !(count instanceof PDFNumber) || count.asNumber() >= 0,
        children: [],
      };
      if (nodeDict.has(name('Dest')) && nodeDict.has(name('A')))
        error('/Outlines', '节点不能同时包含 Dest 和 A。');
      if (nodeDict.has(name('Dest'))) node.target = destination(nodeDict.get(name('Dest')));
      if (nodeDict.has(name('A'))) {
        checkAction(nodeDict.get(name('A'))!);
        const action = dict(nodeDict.get(name('A')), '/Outlines/A'),
          kind = text(resolve(action.get(name('S'))));
        if (!kind) error('/Outlines/A/S', '动作类型无效。');
        if (kind === 'GoTo') node.target = destination(action.get(name('D')));
        else node.passiveNavigation = kind;
      }
      items.set(node.nativeId!, { node, dict: nodeDict, ref });
      node.children = walk(nodeDict, ref, depth + 1);
      if (!node.children.length) node.expanded = true;
      result.push(node);
      final = ref;
      previous = ref;
      current = nodeDict.get(name('Next'));
    }
    if (!(last instanceof PDFRef) || final?.toString() !== last.toString())
      error('/Outlines/Last', '最后兄弟引用不匹配。');
    return result;
  };
  const tree = walk(root, rootRef, 0);
  validatePdfOutlines(tree, pageIds);
  return { tree, items, root, rootRef };
}

export function readPdfOutlines(pdf: PDFDocument, pageIds: readonly string[]): PdfOutlineNode[] {
  return inventory(pdf, pageIds).tree;
}

/** Validate the complete request before touching the loaded PDF. Host permissions remain mandatory. */
export function writePdfOutlines(
  pdf: PDFDocument,
  pageIds: readonly string[],
  tree: readonly PdfOutlineNode[]
): boolean {
  const before = inventory(pdf, pageIds);
  validatePdfOutlines(tree, pageIds);
  const validateNative = (items: readonly PdfOutlineNode[]) => {
    for (const item of items) {
      const original = item.nativeId === undefined ? undefined : before.items.get(item.nativeId);
      if (item.nativeId !== undefined && !original) error(item.id, '原生节点不属于当前 PDF。');
      if (original && item.title !== original.node.title && !item.title.trim())
        error(item.id, '修改后的标题不能为空。');
      if (
        item.passiveNavigation !== original?.node.passiveNavigation &&
        !(
          original?.node.passiveNavigation &&
          item.passiveNavigation === undefined &&
          item.target !== undefined
        )
      )
        error(item.id, '被动动作只能由明确的页面目标替换，不接受伪造或修改。');
      validateNative(item.children);
    }
  };
  validateNative(tree);
  if (same(before.tree, tree)) return false;
  if (!tree.length) {
    pdf.catalog.delete(name('Outlines'));
    return true;
  }
  // All metadata/target checks above are complete. Detached dictionaries retain
  // private source entries; only canonical links and explicitly edited data change.
  interface Planned {
    value: PdfOutlineNode;
    dict: PDFDict;
    ref?: PDFRef;
    children: Planned[];
  }
  const pageRefs = new Map(pdf.getPages().map((page, index) => [pageIds[index], page.ref]));
  const plan = (items: readonly PdfOutlineNode[]): Planned[] =>
    items.map((value) => {
      const original = value.nativeId ? before.items.get(value.nativeId) : undefined;
      const output = original ? original.dict.clone(pdf.context) : pdf.context.obj({});
      for (const key of ['Parent', 'Prev', 'Next', 'First', 'Last', 'Count'])
        output.delete(name(key));
      if (!original || original.node.title !== value.title)
        output.set(name('Title'), PDFHexString.fromText(value.title));
      if (!original || !same(original.node.target, value.target)) {
        output.delete(name('Dest'));
        output.delete(name('A'));
        if (value.target) {
          const target = pdf.context.obj([
            pageRefs.get(value.target.pageId)!,
            name(value.target.view.kind),
            ...value.target.view.parameters.map((v) => (v === null ? PDFNull : PDFNumber.of(v))),
          ]);
          const oldAction = original?.dict.lookup(name('A'));
          if (oldAction instanceof PDFDict && oldAction.lookup(name('S')) === name('GoTo')) {
            const action = oldAction.clone(pdf.context);
            action.set(name('D'), target);
            output.set(name('A'), action);
          } else output.set(name('Dest'), target);
        }
      }
      return {
        value,
        dict: output,
        ...(original ? { ref: original.ref } : {}),
        children: plan(value.children),
      };
    });
  const planned = plan(tree),
    root = before.root ? before.root.clone(pdf.context) : pdf.context.obj({ Type: 'Outlines' });
  const rootRef = before.rootRef ?? pdf.context.register(root);
  const visible = (items: readonly Planned[]): number =>
    items.reduce((sum, item) => sum + 1 + (item.value.expanded ? visible(item.children) : 0), 0);
  const allocate = (items: Planned[]) => {
    for (const item of items) {
      item.ref ??= pdf.context.register(item.dict);
      allocate(item.children);
    }
  };
  allocate(planned);
  const wire = (items: Planned[], parent: PDFDict, parentRef: PDFRef) => {
    parent.set(name('First'), items[0].ref!);
    parent.set(name('Last'), items[items.length - 1].ref!);
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      item.dict.set(name('Parent'), parentRef);
      if (index) item.dict.set(name('Prev'), items[index - 1].ref!);
      if (index + 1 < items.length) item.dict.set(name('Next'), items[index + 1].ref!);
      if (item.children.length) {
        wire(item.children, item.dict, item.ref!);
        item.dict.set(
          name('Count'),
          PDFNumber.of((item.value.expanded ? 1 : -1) * visible(item.children))
        );
      }
      pdf.context.assign(item.ref!, item.dict);
    }
  };
  wire(planned, root, rootRef);
  root.set(name('Count'), PDFNumber.of(visible(planned)));
  pdf.context.assign(rootRef, root);
  pdf.catalog.set(name('Outlines'), rootRef);
  return true;
}

/** Move indices refer to the destination sibling list after removing the source. */
export function editPdfOutlineTree(
  tree: readonly PdfOutlineNode[],
  pageIds: readonly string[],
  edit: PdfOutlineEdit
): readonly PdfOutlineNode[] {
  validatePdfOutlines(tree, pageIds);
  const clone = (items: readonly PdfOutlineNode[]): PdfOutlineNode[] =>
    items.map((item) => ({
      ...item,
      ...(item.target
        ? {
            target: {
              ...item.target,
              view: { ...item.target.view, parameters: [...item.target.view.parameters] },
            },
          }
        : {}),
      children: clone(item.children),
    }));
  const output = clone(tree);
  const locate = (
    id: string,
    items = output
  ): { items: PdfOutlineNode[]; index: number; node: PdfOutlineNode } | undefined => {
    for (let index = 0; index < items.length; index++) {
      if (items[index].id === id) return { items, index, node: items[index] };
      const result = locate(id, items[index].children);
      if (result) return result;
    }
    return undefined;
  };
  const destination = (parentId: string | undefined) => {
    if (parentId === undefined) return output;
    const parent = locate(parentId);
    if (!parent) error('/edit', '父目录不存在。');
    return parent.node.children;
  };
  const insert = (items: PdfOutlineNode[], index: number, node: PdfOutlineNode) => {
    if (!Number.isInteger(index) || index < 0 || index > items.length)
      error('/edit', '插入位置无效。');
    items.splice(index, 0, node);
  };
  if (!edit || typeof edit !== 'object') error('/edit', '编辑请求无效。');
  keys(
    edit,
    edit.type === 'insert'
      ? ['type', 'parentId', 'index', 'node']
      : edit.type === 'update'
        ? ['type', 'id', 'title', 'expanded', 'target']
        : edit.type === 'move'
          ? ['type', 'id', 'parentId', 'index']
          : ['type', 'id'],
    '/edit'
  );
  if (edit.type === 'insert') {
    validatePdfOutlines([edit.node], pageIds);
    const newNodes = (items: readonly PdfOutlineNode[]) => {
      for (const item of items) {
        if (item.nativeId !== undefined) error('/edit', '新目录不能冒用原生身份。');
        newNodes(item.children);
      }
    };
    newNodes([edit.node]);
    insert(destination(edit.parentId), edit.index, clone([edit.node])[0]);
  } else {
    const selected = locate(edit.id);
    if (!selected) error('/edit', '目录不存在。');
    if (edit.type === 'update') {
      if (edit.title !== undefined && (typeof edit.title !== 'string' || !edit.title.trim()))
        error('/edit', '修改后的标题不能为空。');
      if (edit.title !== undefined) selected.node.title = edit.title;
      if (edit.expanded !== undefined) selected.node.expanded = edit.expanded;
      if (Object.prototype.hasOwnProperty.call(edit, 'target')) {
        selected.node.target = edit.target;
        if (edit.target !== undefined) delete selected.node.passiveNavigation;
      }
    } else if (edit.type === 'remove') selected.items.splice(selected.index, 1);
    else if (edit.type === 'move') {
      const contains = (node: PdfOutlineNode): boolean =>
        node.id === edit.parentId || node.children.some(contains);
      if (contains(selected.node)) error('/edit', '不能把目录移动到自己或其后代下。');
      selected.items.splice(selected.index, 1);
      insert(destination(edit.parentId), edit.index, selected.node);
    } else error('/edit', '未知编辑命令。');
  }
  const normalizeLeaves = (items: PdfOutlineNode[]) => {
    for (const item of items) {
      if (!item.children.length) item.expanded = true;
      normalizeLeaves(item.children);
    }
  };
  normalizeLeaves(output);
  validatePdfOutlines(output, pageIds);
  return same(tree, output) ? tree : output;
}
