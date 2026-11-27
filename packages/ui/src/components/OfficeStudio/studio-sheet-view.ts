import type { StudioRowLayout } from './studio-sheet-layout';
import { studioRowSpanHeight, studioRowTop } from './studio-sheet-layout';
import type { SheetPosition } from './studio-sheet-model';
import { studioCellBordersCss } from './studio-cell-style';
import type { StudioCell, StudioExcelDocument, StudioSheetView } from './studio-types';

export type SheetViewState = StudioSheetView;

export const SHEET_VIEW_DEFAULT: Readonly<SheetViewState> = {
  zoom: 100,
  showGridLines: true,
  showRowColHeaders: true,
};

/** Native small zooms are retained; authoring follows the original 25–400% requirement. */
export function studioSheetViewIssue(value: unknown): string | undefined {
  if (value === undefined) return;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return '工作表视图属性无效。';
  const view = value as Partial<SheetViewState>;
  if (!Number.isInteger(view.zoom) || view.zoom! < 10 || view.zoom! > 400)
    return '原生缩放比例须为 10 至 400 之间的整数。';
  if (typeof view.showGridLines !== 'boolean' || typeof view.showRowColHeaders !== 'boolean')
    return '网格线和行列标题显示须为布尔值。';
}

export function studioSheetView(value?: SheetViewState): SheetViewState {
  const issue = studioSheetViewIssue(value);
  if (issue) throw new Error(issue);
  return { ...(value ?? SHEET_VIEW_DEFAULT) };
}

export function studioPatchSheetView(
  value: SheetViewState | undefined,
  patch: Partial<SheetViewState>
): SheetViewState {
  if (
    Object.keys(patch).some((key) => !['zoom', 'showGridLines', 'showRowColHeaders'].includes(key))
  )
    throw new Error('工作表视图修改包含未知属性。');
  if (
    patch.zoom !== undefined &&
    (!Number.isInteger(patch.zoom) || patch.zoom < 25 || patch.zoom > 400)
  )
    throw new Error('缩放比例须为 25 至 400 之间的整数。');
  const candidate = {
    ...studioSheetView(value),
    ...Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined)),
  };
  const issue = studioSheetViewIssue(candidate);
  if (issue) throw new Error(issue);
  return candidate;
}

export function studioSetSheetView(
  document: StudioExcelDocument,
  sheetId: string,
  patch: Partial<SheetViewState>
): StudioExcelDocument {
  const sheet = document.sheets.find((item) => item.id === sheetId);
  if (!sheet) throw new Error('工作表不存在。');
  const view = studioPatchSheetView(sheet.view, patch);
  const previous = studioSheetView(sheet.view);
  if (
    (Object.keys(view) as Array<keyof SheetViewState>).every((key) => previous[key] === view[key])
  )
    return document;
  return {
    ...document,
    sheets: document.sheets.map((item) => (item.id === sheetId ? { ...item, view } : item)),
  };
}

export function studioParseSheetZoom(text: string): number | undefined {
  const normalized = text
    .trim()
    .replace(/[%％]$/, '')
    .trim();
  if (!/^\+?\d+$/.test(normalized)) return;
  const zoom = Number(normalized);
  return zoom >= 25 && zoom <= 400 ? zoom : undefined;
}

/** Logical document pixels never change with zoom; only screen coordinates are scaled. */
export function studioSheetViewGeometry(view: SheetViewState) {
  return {
    scale: view.zoom / 100,
    headerHeight: view.showRowColHeaders ? 24 : 0,
    rowHeaderWidth: view.showRowColHeaders ? 40 : 0,
  };
}

export function studioViewColumnOffsets(
  logical: readonly number[],
  scale: number,
  rowHeaderWidth: number
): number[] {
  if (
    !Number.isFinite(scale) ||
    scale <= 0 ||
    !Number.isFinite(rowHeaderWidth) ||
    rowHeaderWidth < 0
  )
    throw new Error('工作表视图坐标无效。');
  return logical.map((value) => rowHeaderWidth + value * scale);
}

export function studioViewRowLayout(logical: StudioRowLayout, scale: number): StudioRowLayout {
  if (!Number.isFinite(scale) || scale <= 0) throw new Error('工作表视图坐标无效。');
  return { ...logical, offsets: logical.offsets.map((value) => value * scale) };
}

/** Cell border widths scale with the box; its text padding stays in document pixels. */
export function studioViewCellBorders(cell: StudioCell, scale: number) {
  return Object.fromEntries(
    Object.entries(studioCellBordersCss(cell)).map(([side, css]) => [
      side,
      typeof css === 'string'
        ? css.replace(/^(\d+(?:\.\d+)?)px/, (_, width) => `${Number(width) * scale}px`)
        : css,
    ])
  );
}

/** Frozen and scrolling parts of a range need separate, clipped overlay rectangles. */
export function studioViewRangeRects(input: {
  range: { firstRow: number; lastRow: number; firstCol: number; lastCol: number };
  columnOffsets: readonly number[];
  rowLayout: StudioRowLayout;
  freezeColumns: number;
  freezeRows: number;
  headerHeight: number;
  viewport: { left: number; top: number; width: number; height: number };
}) {
  const { range, columnOffsets, rowLayout, headerHeight, viewport } = input;
  function lanes(start: number, end: number, boundary: number, scroll: number, size: number) {
    const result: Array<[number, number]> = [];
    if (start < boundary) {
      const last = Math.min(end, boundary, size);
      if (last > start) result.push([start + scroll, last + scroll]);
    }
    const first = Math.max(start, boundary + scroll),
      last = Math.min(end, size + scroll);
    if (last > first) result.push([first, last]);
    return result;
  }
  const x = lanes(
    columnOffsets[range.firstCol - 1],
    columnOffsets[range.lastCol],
    columnOffsets[Math.min(input.freezeColumns, columnOffsets.length - 1)],
    viewport.left,
    viewport.width
  );
  const top = headerHeight + studioRowTop(rowLayout, range.firstRow);
  const y = lanes(
    top,
    top + studioRowSpanHeight(rowLayout, range.firstRow, range.lastRow),
    headerHeight + rowLayout.offsets[Math.min(input.freezeRows, rowLayout.rows.length)],
    viewport.top,
    viewport.height
  );
  return x.flatMap(([left, right]) =>
    y.map(([top, bottom]) => ({ left, top, width: right - left, height: bottom - top }))
  );
}

function upperBound(values: readonly number[], value: number): number {
  let low = 0,
    high = values.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (values[middle] <= value) low = middle + 1;
    else high = middle;
  }
  return low;
}

/** Hit testing uses physical offsets and scroll; frozen lanes remain fixed in the viewport. */
export function studioViewPointerCell(input: {
  clientX: number;
  clientY: number;
  rect: { left: number; top: number; width: number; height: number };
  scrollLeft: number;
  scrollTop: number;
  columnOffsets: readonly number[];
  rowLayout: StudioRowLayout;
  freezeColumns: number;
  freezeRows: number;
  headerHeight: number;
  rowHeaderWidth: number;
}): SheetPosition | null {
  const x = input.clientX - input.rect.left,
    y = input.clientY - input.rect.top;
  if (
    ![x, y, input.scrollLeft, input.scrollTop].every(Number.isFinite) ||
    x < input.rowHeaderWidth ||
    y < input.headerHeight ||
    x >= input.rect.width ||
    y >= input.rect.height
  )
    return null;
  const frozenWidth =
    input.columnOffsets[Math.min(input.freezeColumns, input.columnOffsets.length - 1)] ??
    input.rowHeaderWidth;
  const frozenHeight =
    input.rowLayout.offsets[Math.min(input.freezeRows, input.rowLayout.rows.length)] ?? 0;
  const canvasX = x < frozenWidth ? x : x + input.scrollLeft;
  const canvasY =
    y - input.headerHeight + (y < input.headerHeight + frozenHeight ? 0 : input.scrollTop);
  const col = upperBound(input.columnOffsets, canvasX);
  const rowIndex = upperBound(input.rowLayout.offsets, canvasY) - 1;
  if (
    col < 1 ||
    col >= input.columnOffsets.length ||
    rowIndex < 0 ||
    rowIndex >= input.rowLayout.rows.length ||
    input.columnOffsets[col] <= input.columnOffsets[col - 1]
  )
    return null;
  return { row: input.rowLayout.rows[rowIndex], col };
}

/** Keep the viewport's top-left document pixel stable while zoom or headers change. */
export function studioViewRebasedScroll(
  previous: ReturnType<typeof studioSheetViewGeometry>,
  next: ReturnType<typeof studioSheetViewGeometry>,
  scroll: { left: number; top: number }
) {
  return {
    left: Math.max(0, (scroll.left / previous.scale) * next.scale),
    top: Math.max(0, (scroll.top / previous.scale) * next.scale),
  };
}
