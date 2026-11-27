import type {
  StudioPdfDocument, StudioPdfField, StudioPdfMark, StudioPdfPage,
} from '../../../../../packages/ui/src/components/OfficeStudio/studio-types';
import type { PdfAnnotation, PdfNativeHostServices, PdfRgb } from './studio-pdf-native/public-types';
import type { PdfWorkspaceLayoutTarget, PdfWorkspaceSnapshot } from './studio-pdf-native/workspace-types';
import { NativePdfWorkspace } from './studio-pdf-native/workspace';
import { sourceIdentity } from './studio-pdf-native/runtime';
import { pdfPages } from '../../../../../packages/ui/src/components/OfficeStudio/studio-pdf-pages';
import { pdfDate, unsupportedTextControl } from './studio-pdf-native/objects';
import { throwIfAborted } from './studio-pdf-native/host-fonts';
import { legacyPdfFont, nativePdfHostServices } from './studio-pdf-native-fonts';

const comparablePage = (page: StudioPdfPage) => ({
  id: page.id, sourcePage: page.sourcePage, copyGroup: page.copyGroup, size: page.size,
});
export const nativePage = (page: StudioPdfPage): StudioPdfPage => ({
  ...comparablePage(page), ...(page.bounds === undefined ? {} : { bounds: page.bounds }),
});

export async function nativePdfWorkspace(
  document: StudioPdfDocument, source: Blob, signal?: AbortSignal,
  services: Partial<PdfNativeHostServices> = nativePdfHostServices,
): Promise<NativePdfWorkspace> {
  throwIfAborted(signal);
  const bytes = new Uint8Array(await source.arrayBuffer());
  throwIfAborted(signal);
  const pages = pdfPages(document);
  let workspace: NativePdfWorkspace;
  if (document.nativeAnnotations) workspace = await NativePdfWorkspace.restore(bytes, document.nativeAnnotations, services);
  else {
    const count = document.sourcePageCount ?? document.pageCount;
    const ids = Array.from({ length: count }, (_, index) =>
      pages.find((page) => page.sourcePage === index && !page.copyGroup)?.id
      ?? (document.pages ? sourceIdentity('native-base-page', document.id + ':' + index) : 'source-' + index));
    workspace = await NativePdfWorkspace.read(bytes, ids, services);
  }
  const current = workspace.snapshot().canvasPages;
  if (JSON.stringify(pages.map(comparablePage)) !== JSON.stringify(current.map(comparablePage))) {
    if (workspace.serialize().commands.length) throw new Error('PDF 页面模型与原生批注操作记录不一致。');
    const bindings = workspace.serialize().bindings;
    const groupCounts = new Map<string, number>(), occurrences = new Map<string, number>();
    for (const page of pages) if (page.copyGroup && page.sourcePage !== undefined) {
      const key = page.copyGroup + ':' + page.sourcePage;
      groupCounts.set(key, (groupCounts.get(key) ?? 0) + 1);
    }
    const splitGroups = new Set(pages.flatMap((page) => page.copyGroup && page.sourcePage !== undefined
      && (groupCounts.get(page.copyGroup + ':' + page.sourcePage) ?? 0) > 1 ? [page.copyGroup] : []));
    const targets: PdfWorkspaceLayoutTarget[] = pages.map((page) => {
      if (page.sourcePage === undefined) return { id: page.id, size: page.size };
      const binding = bindings[page.sourcePage];
      if (!binding) throw new Error('PDF 原生批注的来源页码无效。');
      let group = page.copyGroup ?? sourceIdentity('native-legacy-copy', page.id);
      if (page.copyGroup && splitGroups.has(page.copyGroup)) {
        const key = page.copyGroup + ':' + page.sourcePage, occurrence = occurrences.get(key) ?? 0;
        occurrences.set(key, occurrence + 1);
        group = sourceIdentity('native-legacy-group', page.copyGroup + ':' + occurrence);
      }
      return {
        id: page.id, fromPageId: binding.uiPageId,
        ...(page.id === binding.uiPageId ? {} : { copyGroup: group }),
        ...(page.size === undefined ? {} : { size: page.size }),
      };
    });
    workspace = workspace.layout(targets);
  }
  throwIfAborted(signal);
  return workspace;
}

function hex(value: PdfRgb | null, fallback = '#253044'): string {
  return value === null ? fallback : '#' + value.map((component) => Math.round(component * 255).toString(16).padStart(2, '0')).join('');
}
function rgb(value: string | undefined, fallback: string): [number, number, number] {
  const color = value ?? fallback;
  if (!/^#[0-9a-f]{6}$/i.test(color)) throw new Error('PDF 标注颜色须为六位十六进制色值。');
  return [parseInt(color.slice(1, 3), 16) / 255, parseInt(color.slice(3, 5), 16) / 255, parseInt(color.slice(5, 7), 16) / 255];
}
const legacyKind = (annotation: PdfAnnotation): StudioPdfMark['type'] | undefined =>
  annotation.kind === 'freeText' ? 'text' : annotation.kind === 'highlight' ? 'highlight'
    : annotation.kind === 'square' ? 'rectangle' : annotation.kind === 'ink' ? 'ink' : undefined;

export function nativePdfMarkProjections(snapshot: PdfWorkspaceSnapshot, previous: readonly StudioPdfMark[] = []): StudioPdfMark[] {
  const old = new Map(previous.flatMap((mark) => mark.nativeId ? [[mark.nativeId, mark] as const] : []));
  return snapshot.annotations.flatMap((annotation) => {
    const type = legacyKind(annotation);
    if (!type || annotation.kind === 'opaque' || ((annotation.native?.flags ?? 0) & (1 | 2 | 32))) return [];
    const page = snapshot.canvasPages.findIndex((entry) => entry.id === annotation.pageId);
    if (page < 0) throw new Error('PDF 原生批注的页面身份无效。');
    const replies = snapshot.annotations.filter((reply) => reply.kind === 'note' && reply.replyType === 'R'
      && reply.inReplyTo === annotation.id && !reply.review).map((reply) => ({ id: reply.id, text: reply.contents }));
    const rect = annotation.rect;
    const base: StudioPdfMark = {
      id: old.get(annotation.id)?.id ?? annotation.id, nativeId: annotation.id, page, type,
      x: rect[0], y: rect[1], width: rect[2] - rect[0], height: rect[3] - rect[1],
      text: annotation.contents, size: annotation.kind === 'freeText' ? annotation.font.size : 12,
      color: hex(annotation.color), lineWidth: annotation.stroke.width,
      ...(replies.length ? { replies } : {}),
    };
    if (annotation.kind === 'freeText') {
      base.x += annotation.textPadding?.[0] ?? 0;
      base.y = rect[3] - (annotation.textPadding?.[1] ?? 0) - annotation.font.size;
      base.color = hex(annotation.font.color);
    }
    if (annotation.kind === 'ink') {
      base.points = annotation.inkList.flatMap((stroke) => {
        const points: [number, number][] = [];
        for (let index = 0; index < stroke.length; index += 2) points.push([stroke[index], stroke[index + 1]]);
        return points;
      });
    }
    return [base];
  });
}

export function validateNativePdfProjections(document: StudioPdfDocument, snapshot: PdfWorkspaceSnapshot): void {
  for (const mark of document.marks) if (mark.nativeId !== undefined) {
    const source = snapshot.annotations.find((annotation) => annotation.id === mark.nativeId);
    if (!mark.nativeId || !source || legacyKind(source) !== mark.type) throw new Error('PDF 原生标注投影与来源不匹配。');
  }
}

export function withNativePdfState(document: StudioPdfDocument, workspace: NativePdfWorkspace): StudioPdfDocument {
  const snapshot = workspace.snapshot();
  return {
    ...document, pageCount: snapshot.canvasPages.length, pages: snapshot.canvasPages.map(nativePage),
    nativeAnnotations: workspace.serialize(),
    marks: [...document.marks.filter((mark) => mark.nativeId === undefined), ...nativePdfMarkProjections(snapshot, document.marks)],
  };
}

function checkLegacyMark(mark: StudioPdfMark, count: number): void {
  if (!mark || !mark.id || !Number.isInteger(mark.page) || mark.page < 0 || mark.page >= count
    || !Number.isFinite(mark.x) || !Number.isFinite(mark.y) || typeof mark.text !== 'string'
    || unsupportedTextControl(mark.text) || !Number.isFinite(mark.size) || mark.size < 1 || mark.size > 144) {
    throw new Error('旧 PDF 标注包含无效的文字、坐标或字号。');
  }
}

/** Migration time is captured once by an accepted action, never by repeating export. */
export async function migrateLegacyPdfMarks(
  document: StudioPdfDocument, workspace: NativePdfWorkspace, now: string, signal?: AbortSignal,
  services: Partial<PdfNativeHostServices> = nativePdfHostServices,
): Promise<{ workspace: NativePdfWorkspace; document: StudioPdfDocument }> {
  pdfDate(now);
  let current = workspace;
  const previous = document.marks.filter((mark) => mark.nativeId === undefined), migrated = new Map<string, StudioPdfMark>();
  for (const mark of previous) {
    throwIfAborted(signal); checkLegacyMark(mark, document.pageCount);
    const id = sourceIdentity('native-legacy-mark', workspace.serialize().sourceHash + ':' + document.id + ':' + mark.id);
    const pageId = current.snapshot().canvasPages[mark.page]?.id;
    if (!pageId) throw new Error('旧 PDF 标注的页面不存在。');
    if (mark.type === 'text') {
      const family = [...mark.text].some((character) => !['\r', '\n'].includes(character) && (character.codePointAt(0) ?? 0) > 126) ? 'NotoSansSC' : 'Helvetica';
      const font = await legacyPdfFont(family, services, signal), lines = mark.text.replace(/\r\n?/g, '\n').split('\n');
      const width = Math.max(1, ...lines.map((line) => font.widthOfTextAtSize(line, mark.size)));
      const ascent = font.heightAtSize(mark.size, { descender: false });
      const descent = font.heightAtSize(mark.size) - ascent, lineHeight = mark.size * 1.35;
      current = current.create({
        id, kind: 'freeText', pageId, contents: mark.text,
        rect: [mark.x, mark.y - (lines.length - 1) * lineHeight - descent - 0.05, mark.x + width + 0.05, mark.y + ascent],
        font: { family, size: mark.size, color: rgb(mark.color, '#253044') },
        color: null, stroke: { width: 0 }, textPadding: [0, 0, 0, 0], lineHeight,
      }, now);
    } else if (mark.type === 'highlight') {
      const width = mark.width ?? 120, height = mark.height ?? 18;
      current = current.create({
        id, kind: 'highlight', pageId, contents: mark.text, rect: [mark.x, mark.y, mark.x + width, mark.y + height],
        quadPoints: [mark.x, mark.y + height, mark.x + width, mark.y + height, mark.x, mark.y, mark.x + width, mark.y],
        color: rgb(mark.color, '#f5c542'), opacity: 0.3,
      }, now);
    } else if (mark.type === 'rectangle') {
      current = current.create({
        id, kind: 'square', pageId, contents: mark.text,
        rect: [mark.x, mark.y, mark.x + (mark.width ?? 120), mark.y + (mark.height ?? 18)],
        color: rgb(mark.color, '#253044'), fill: null, stroke: { width: mark.lineWidth ?? 2 },
      }, now);
    } else if (mark.type === 'ink') {
      if (!mark.points || mark.points.length < 2 || mark.points.length > 100_000
        || mark.points.some((point) => point.length !== 2 || point.some((value) => !Number.isFinite(value)))) throw new Error('旧 PDF 笔迹坐标无效。');
      const pad = Math.max(0.5, (mark.lineWidth ?? 2) / 2);
      current = current.create({
        id, kind: 'ink', pageId, contents: mark.text,
        rect: [Math.min(...mark.points.map((point) => point[0])) - pad, Math.min(...mark.points.map((point) => point[1])) - pad,
          Math.max(...mark.points.map((point) => point[0])) + pad, Math.max(...mark.points.map((point) => point[1])) + pad],
        inkList: [mark.points.flat()], color: rgb(mark.color, '#253044'), stroke: { width: mark.lineWidth ?? 2 },
      }, now);
    } else throw new Error('旧 PDF 标注类型无效。');
    for (const reply of mark.replies ?? []) {
      if (!reply.id || typeof reply.text !== 'string') throw new Error('旧 PDF 回复无效。');
      current = current.reply(id, { id: sourceIdentity('native-legacy-reply', id + ':' + reply.id), contents: reply.text, author: '' }, now);
    }
    migrated.set(id, { ...mark, nativeId: id });
  }
  throwIfAborted(signal);
  const next = withNativePdfState({ ...document, marks: document.marks.filter((mark) => mark.nativeId !== undefined) }, current);
  next.marks = next.marks.map((mark) => {
    const old = migrated.get(mark.nativeId ?? '');
    return old ? { ...old, ...(mark.replies ? { replies: mark.replies } : {}) } : mark;
  });
  return { workspace: current, document: next };
}

export function remapNativePdfFields(
  document: StudioPdfDocument, targets: readonly PdfWorkspaceLayoutTarget[],
): Pick<StudioPdfDocument, 'fields' | 'rotations'> {
  const pages = pdfPages(document), destinations = new Map<number, number[]>();
  targets.forEach((target, index) => {
    const previous = pages.findIndex((page) => page.id === target.fromPageId);
    if (previous >= 0) destinations.set(previous, [...(destinations.get(previous) ?? []), index]);
  });
  const map = (widgets: StudioPdfField['widgets']) => widgets?.flatMap((widget) =>
    (destinations.get(widget.page) ?? []).map((page) => ({ ...widget, page })));
  const fields = document.fields.map((field) => {
    const widgets = map(field.widgets), hiddenWidgets = map(field.hiddenWidgets);
    const radio = [...(field.widgets ?? []), ...(field.hiddenWidgets ?? [])].some((widget) => widget.option !== undefined);
    const options = radio ? [...new Set([...(widgets ?? []), ...(hiddenWidgets ?? [])].flatMap((widget) =>
      widget.option === undefined ? [] : [widget.option]))] : field.options;
    return { ...field, ...(widgets === undefined ? {} : { widgets }), ...(hiddenWidgets === undefined ? {} : { hiddenWidgets }),
      ...(radio ? { options, value: options?.includes(String(field.value)) ? field.value : '' } : {}) };
  });
  const rotations = Object.fromEntries(Object.entries(document.rotations).flatMap(([page, angle]) =>
    (destinations.get(Number(page)) ?? []).map((index) => [String(index), angle])));
  return { fields, rotations };
}
