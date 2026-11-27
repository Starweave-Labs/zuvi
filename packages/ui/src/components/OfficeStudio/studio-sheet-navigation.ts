import type { StudioSheet } from './studio-types';
import {
  studioCellAddress,
  studioColumnLabel,
  studioHiddenRows,
  studioMergedRange,
  type SheetCalculation,
  type SheetPosition,
} from './studio-sheet-model';

/** Data-block movement follows visible cells; merged cells and computed array results count as data. */
export function studioDataBlockTarget(
  sheet: StudioSheet,
  start: SheetPosition,
  direction: 'up' | 'down' | 'left' | 'right',
  calculation: SheetCalculation
): SheetPosition {
  const vertical = direction === 'up' || direction === 'down';
  const sign = direction === 'up' || direction === 'left' ? -1 : 1;
  const hiddenRows = studioHiddenRows(sheet, calculation);
  const hiddenColumns = new Set(sheet.hiddenColumns || []);
  const limit = vertical ? sheet.rowCount : sheet.columnCount;
  const hidden = (index: number) =>
    vertical ? hiddenRows.has(index) : hiddenColumns.has(studioColumnLabel(index));
  const point = (index: number): SheetPosition =>
    vertical ? { row: index, col: start.col } : { row: start.row, col: index };
  const mergeAt = (index: number) => studioMergedRange(sheet, point(index));
  const coordinate = vertical ? start.row : start.col;
  const hasData = (index: number) => {
    const location = point(index);
    const merge = mergeAt(index);
    const address = studioCellAddress(
      merge?.firstRow ?? location.row,
      merge?.firstCol ?? location.col
    );
    return !!sheet.cells[address]?.input || calculation.arrayOwners.has(`${sheet.id}:${address}`);
  };
  const advance = (index: number) => {
    let next = index + sign;
    while (next >= 1 && next <= limit && hidden(next)) next += sign;
    return next >= 1 && next <= limit ? next : undefined;
  };
  const edge = (index: number) => {
    const merge = mergeAt(index);
    if (!merge) return index;
    let end = vertical
      ? sign > 0
        ? merge.lastRow
        : merge.firstRow
      : sign > 0
        ? merge.lastCol
        : merge.firstCol;
    while (hidden(end) && end !== index) end -= sign;
    return end;
  };
  let current = edge(coordinate);
  const first = advance(current);
  if (first === undefined) return point(current);
  if (hasData(coordinate) && hasData(first)) {
    current = edge(first);
    for (let step = 0; step < limit; step++) {
      const next = advance(current);
      if (next === undefined || !hasData(next)) break;
      current = edge(next);
    }
    return point(current);
  }
  // A gap after an occupied cell behaves like a blank start: find the next block.
  for (let step = 0; step < limit; step++) {
    const next = advance(current);
    if (next === undefined) break;
    current = next;
    if (hasData(current)) return point(edge(current));
  }
  return point(current);
}
