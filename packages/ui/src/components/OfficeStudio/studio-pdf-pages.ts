import type { StudioPdfDocument, StudioPdfPage } from './studio-types';
import { pdfCopiedAnnotationId } from './studio-pdf-source-id';

const identity = () => globalThis.crypto.randomUUID();
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
export function pdfPageSize(value: unknown): { width: number; height: number } {
  const size = value as { width?: unknown; height?: unknown };
  if (!size || !finite(size.width) || !finite(size.height) || size.width < 1 || size.height < 1 || size.width > 14400 || size.height > 14400)
    throw new Error('PDF 页面宽高须在 1 至 14400 磅之间。');
  return { width: size.width, height: size.height };
}

export function pdfPages(document: StudioPdfDocument): StudioPdfPage[] {
  const pages: StudioPdfPage[] = document.pages ?? Array.from({ length: document.pageCount }, (_, sourcePage) => ({ id: `source-${sourcePage}`, sourcePage }));
  const sourceCount = document.sourcePageCount ?? document.pageCount;
  if (!Array.isArray(pages) || pages.length !== document.pageCount || pages.length < 1 || pages.length > 200 || !Number.isInteger(sourceCount) || sourceCount < 1 || sourceCount > 200)
    throw new Error('PDF 页面列表与来源不匹配。');
  const ids = new Set<string>();
  for (const page of pages) {
    if (!page || typeof page.id !== 'string' || !page.id || ids.has(page.id) || (page.sourcePage !== undefined && (!Number.isInteger(page.sourcePage) || page.sourcePage < 0 || page.sourcePage >= sourceCount)))
      throw new Error('PDF 页面身份或来源页码无效。');
    ids.add(page.id);
    if (page.copyGroup !== undefined && (typeof page.copyGroup !== 'string' || !page.copyGroup)) throw new Error('PDF 页面复制组无效。');
    if (page.size !== undefined || page.sourcePage === undefined) pdfPageSize(page.size);
    if (page.bounds && (!Object.values(page.bounds).every(finite) || page.bounds.right <= page.bounds.left || page.bounds.top <= page.bounds.bottom))
      throw new Error('PDF 页面边界无效。');
  }
  return pages;
}

function selection(document: StudioPdfDocument, indices: number[]) {
  if (!Array.isArray(indices) || !indices.length || new Set(indices).size !== indices.length || indices.some(index => !Number.isInteger(index) || index < 0 || index >= document.pageCount))
    throw new Error('请选择有效且不重复的 PDF 页面。');
  return [...indices].sort((a, b) => a - b);
}

function remap(document: StudioPdfDocument, next: StudioPdfPage[], copies = new Map<string, string>()): StudioPdfDocument {
  if (next.length < 1) throw new Error('PDF 至少须保留一页。');
  if (next.length > 200) throw new Error('当前 PDF 编辑器支持 1 至 200 页。');
  const old = pdfPages(document);
  const targets = new Map<number, number[]>();
  next.forEach((page, index) => {
    const previous = old.findIndex(entry => entry.id === (copies.get(page.id) ?? page.id));
    if (previous >= 0) targets.set(previous, [...(targets.get(previous) ?? []), index]);
  });
  const rotations = Object.fromEntries(Object.entries(document.rotations).flatMap(([page, angle]) => (targets.get(Number(page)) ?? []).map(index => [String(index), angle])));
  const marks = document.marks.flatMap(mark => (targets.get(mark.page) ?? []).map(page => {
    const copied = next[page].id !== old[mark.page].id;
    const nativeId = copied && mark.nativeId ? pdfCopiedAnnotationId(mark.nativeId, next[page].id) : mark.nativeId;
    return { ...mark, page, ...(nativeId ? { nativeId } : {}), ...(copied ? { id: nativeId ?? identity() } : {}) };
  }));
  const fields = document.fields.map(field => {
    if (!field.widgets && !field.hiddenWidgets) return field;
    const mapWidgets = (widgets: StudioPdfDocument['fields'][number]['widgets']) => widgets?.flatMap(widget => (targets.get(widget.page) ?? []).map(page => ({ ...widget, page })));
    const widgets = mapWidgets(field.widgets), hiddenWidgets = mapWidgets(field.hiddenWidgets);
    const canonical = [...(widgets ?? []), ...(hiddenWidgets ?? [])];
    const radio = [...(field.widgets ?? []), ...(field.hiddenWidgets ?? [])].some(widget => widget.option !== undefined);
    const options = radio ? [...new Set(canonical.flatMap(widget => widget.option === undefined ? [] : [widget.option]))] : field.options;
    const value = radio && !options?.includes(String(field.value)) ? '' : field.value;
    return { ...field, ...(widgets ? { widgets } : {}), ...(hiddenWidgets ? { hiddenWidgets } : {}), value, ...(radio ? { options } : {}) };
  });
  const nativeAnnotations = document.nativeAnnotations && {
    ...document.nativeAnnotations,
    commands: [...document.nativeAnnotations.commands, { type: 'layout' as const, targets: next.map(page => {
      const from = copies.get(page.id) ?? (old.some(entry => entry.id === page.id) ? page.id : undefined);
      return { id: page.id, ...(from ? { fromPageId: from } : {}), ...(copies.has(page.id) ? { copyGroup: page.copyGroup } : {}), ...(page.size ? { size: page.size } : {}) };
    }) }],
  };
  const result = { ...document, sourcePageCount: document.sourcePageCount ?? document.pageCount, pageCount: next.length, pages: next, rotations, marks, fields, ...(nativeAnnotations ? { nativeAnnotations } : {}) };
  pdfPages(result);
  return result;
}

export function pdfInsertBlankPage(document: StudioPdfDocument, position: number, size: { width: number; height: number }): StudioPdfDocument {
  const pages = [...pdfPages(document)];
  if (!Number.isInteger(position) || position < 0 || position > pages.length) throw new Error('PDF 插入位置无效。');
  const checked = pdfPageSize(size);
  pages.splice(position, 0, { id: identity(), size: checked, bounds: { left: 0, bottom: 0, right: checked.width, top: checked.height } });
  return remap(document, pages);
}
export function pdfRemovePages(document: StudioPdfDocument, indices: number[]): StudioPdfDocument {
  const selected = new Set(selection(document, indices));
  return remap(document, pdfPages(document).filter((_page, index) => !selected.has(index)));
}
export function pdfMovePages(document: StudioPdfDocument, indices: number[], position: number): StudioPdfDocument {
  const selected = selection(document, indices), pages = pdfPages(document);
  if (!Number.isInteger(position) || position < 0 || position > pages.length) throw new Error('PDF 移动位置无效。');
  const remaining = pages.filter((_page, index) => !selected.includes(index));
  remaining.splice(position - selected.filter(index => index < position).length, 0, ...selected.map(index => pages[index]));
  if (remaining.every((page, index) => page.id === pages[index].id)) return document;
  return remap(document, remaining);
}
export function pdfCopyPages(document: StudioPdfDocument, indices: number[], position: number): StudioPdfDocument {
  const selected = selection(document, indices), pages = [...pdfPages(document)], copies = new Map<string, string>();
  if (!Number.isInteger(position) || position < 0 || position > pages.length) throw new Error('PDF 复制位置无效。');
  const copyGroup = identity();
  pages.splice(position, 0, ...selected.map(index => { const page = { ...pages[index], id: identity(), copyGroup, originPageId: pages[index].id }; copies.set(page.id, pages[index].id); return page; }));
  return remap(document, pages, copies);
}
export function pdfRotatePages(document: StudioPdfDocument, indices: number[], angle: number): StudioPdfDocument {
  const selected = selection(document, indices);
  if (!finite(angle) || angle % 90 !== 0) throw new Error('PDF 页面旋转须为 90 度的整数倍。');
  if (angle % 360 === 0) return document;
  const rotations = { ...document.rotations };
  for (const index of selected) rotations[String(index)] = (((rotations[String(index)] ?? 0) + angle) % 360 + 360) % 360;
  return { ...document, rotations };
}
export function pdfResizePages(document: StudioPdfDocument, indices: number[], size: { width: number; height: number }): StudioPdfDocument {
  const selected = selection(document, indices), checked = pdfPageSize(size);
  const pages = pdfPages(document);
  if (selected.every(index => { const page = pages[index], current = page.size ?? (page.bounds ? { width: page.bounds.right - page.bounds.left, height: page.bounds.top - page.bounds.bottom } : undefined); return current?.width === checked.width && current?.height === checked.height; })) return document;
  const next = pages.map((page, index) => selected.includes(index) ? { ...page, size: checked } : page);
  return document.nativeAnnotations ? remap(document, next) : { ...document, sourcePageCount: document.sourcePageCount ?? document.pageCount, pages: next };
}
