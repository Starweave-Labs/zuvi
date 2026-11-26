import type { StudioRichNode } from './studio-types';
import { wordRowProperties } from './studio-word-table-rows';
import {
  wordEffectiveCellMargins,
  wordEffectiveRowSpacing,
  wordTableFixedRowBudget,
  wordTableMergedFixedRowBudget,
} from './studio-word-table-properties';

/** Native defaults apply only at the nearest table, independently of outer cells. */
export const WORD_TABLE_NATIVE_MARGINS = { top: 0, right: 5.4, bottom: 0, left: 5.4 };

/** A single geometry source for editor decorations and the actual print document. */
export function wordTableHeightBudgets(table: StudioRichNode) {
  const rows = table.content ?? [];
  const top = rows.map(() => 0), bottom = rows.map(() => 0);
  rows.forEach((row, index) => (row.content ?? []).forEach(cell => {
    const span = Math.max(1, Number(cell.attrs?.rowspan) || 1);
    const margins = wordEffectiveCellMargins(table.attrs, cell.attrs, WORD_TABLE_NATIVE_MARGINS);
    top[index] = Math.max(top[index], margins.top);
    const last = Math.min(rows.length - 1, index + span - 1);
    bottom[last] = Math.max(bottom[last], margins.bottom);
  }));
  const budgets = rows.map((row, index) => {
    const properties = wordRowProperties(row.attrs);
    return properties.rowHeightRule === 'exact' && properties.rowHeight !== null
      ? wordTableFixedRowBudget(properties.rowHeight, { top: top[index], bottom: bottom[index] }, wordEffectiveRowSpacing(table.attrs, row.attrs))
      : null;
  });
  const cells = rows.map((row, index) => (row.content ?? []).map(cell => {
    const span = Math.max(1, Number(cell.attrs?.rowspan) || 1);
    const own = budgets.slice(index, index + span);
    if (own.length !== span || own.some(value => value === null)) return null;
    return span === 1 ? own[0] : wordTableMergedFixedRowBudget(own as NonNullable<typeof own[number]>[]);
  }));
  return { rows: budgets, cells };
}

/** Include actual exterior and inter-row gaps once, without inventing editable rows. */
export function wordTableMeasuredRowBands(
  table: { top: number; bottom: number },
  rows: readonly { top: number; bottom: number }[]
) {
  if (![table.top, table.bottom, ...rows.flatMap(row => [row.top, row.bottom])].every(Number.isFinite) || table.bottom < table.top)
    throw new Error('表格分页边界无效。');
  return rows.map((row, index) => {
    const top = index === 0 ? table.top : row.top;
    const bottom = index + 1 === rows.length ? table.bottom : rows[index + 1].top;
    if (bottom < top || row.bottom < row.top) throw new Error('表格行分页边界无效。');
    return { top, bottom, height: bottom - top };
  });
}

/** DOM child order differs from grid column order below a vertical merge. */
export function wordTableCellColumns(table: StudioRichNode) {
  const rows = table.content ?? [];
  const width = (rows[0]?.content ?? []).reduce((sum, cell) => sum + Math.max(1, Number(cell.attrs?.colspan) || 1), 0);
  const occupied = Array<number>(width).fill(0);
  const cells = rows.map((row, rowIndex) => {
    let column = 0;
    return (row.content ?? []).map(cell => {
      while (column < width && occupied[column] > rowIndex) column++;
      const span = Math.max(1, Number(cell.attrs?.colspan) || 1);
      const left = column, right = column + span, rowSpan = Math.max(1, Number(cell.attrs?.rowspan) || 1);
      if (rowSpan > 1) for (let offset = left; offset < right; offset++) occupied[offset] = rowIndex + rowSpan;
      column = right;
      return { left, right, first: left === 0, last: right === width };
    });
  });
  return { width, cells };
}
