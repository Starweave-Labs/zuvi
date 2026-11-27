import type {
  StudioCell,
  StudioExcelDocument,
  StudioExcelDefaultFont,
  StudioSheet,
} from './studio-types';
import {
  STUDIO_SHEET_LIMITS,
  studioCellAddress,
  studioParseRange,
  studioPatchCells,
  studioSelectionBounds,
  type SheetSelection,
} from './studio-sheet-model';
import { studioDefaultCellFormat, studioFormattingSelection } from './studio-sheet-editing';

type CellFormat = Omit<StudioCell, 'input' | 'array'>;
export interface StudioSheetFormatSnapshot {
  rows: number;
  columns: number;
  cells: CellFormat[][];
  merges: string[];
}

function copyFormat(cell?: CellFormat, defaultFont?: StudioExcelDefaultFont): CellFormat {
  const format: CellFormat = studioDefaultCellFormat(defaultFont);
  for (const key of Object.keys(format) as (keyof CellFormat)[]) {
    if (cell?.[key] !== undefined) Object.assign(format, { [key]: cell[key] });
  }
  format.borders = Object.fromEntries(
    Object.entries(format.borders ?? {}).map(([side, border]) => [side, { ...border }])
  );
  return format;
}

function mergePattern(sheet: StudioSheet, selection: SheetSelection) {
  const bounds = studioSelectionBounds(selection);
  return (sheet.merges ?? [])
    .flatMap((input) => {
      const range = studioParseRange(input);
      if (
        !range ||
        range.firstRow > bounds.lastRow ||
        range.lastRow < bounds.firstRow ||
        range.firstCol > bounds.lastCol ||
        range.lastCol < bounds.firstCol
      )
        return [];
      if (
        range.firstRow < bounds.firstRow ||
        range.lastRow > bounds.lastRow ||
        range.firstCol < bounds.firstCol ||
        range.lastCol > bounds.lastCol
      )
        throw new Error('格式刷目标必须包含完整合并单元格。');
      return [
        [
          range.firstRow - bounds.firstRow,
          range.firstCol - bounds.firstCol,
          range.lastRow - bounds.firstRow,
          range.lastCol - bounds.firstCol,
        ].join(','),
      ];
    })
    .sort();
}

export function studioCopySheetFormat(
  sheet: StudioSheet,
  selection: SheetSelection,
  defaultFont?: StudioExcelDefaultFont
): StudioSheetFormatSnapshot {
  const expanded = studioFormattingSelection(sheet, selection);
  const bounds = studioSelectionBounds(expanded);
  const rows = bounds.lastRow - bounds.firstRow + 1;
  const columns = bounds.lastCol - bounds.firstCol + 1;
  if (rows * columns > STUDIO_SHEET_LIMITS.clipboardCells)
    throw new Error('格式刷一次最多复制 10,000 个单元格，请缩小来源选区。');
  return {
    rows,
    columns,
    cells: Array.from({ length: rows }, (_, row) =>
      Array.from({ length: columns }, (_, col) =>
        copyFormat(
          sheet.cells[studioCellAddress(bounds.firstRow + row, bounds.firstCol + col)],
          defaultFont
        )
      )
    ),
    merges: mergePattern(sheet, expanded),
  };
}

export function studioPaintSheetFormat(
  document: StudioExcelDocument,
  sheetId: string,
  selection: SheetSelection,
  snapshot: StudioSheetFormatSnapshot
) {
  const sheet = document.sheets.find((item) => item.id === sheetId);
  if (!sheet) throw new Error('工作表不存在。');
  const bounds = studioSelectionBounds(studioFormattingSelection(sheet, selection));
  const single =
    selection.anchor.row === selection.focus.row && selection.anchor.col === selection.focus.col;
  if (single) {
    bounds.lastRow = Math.max(bounds.lastRow, bounds.firstRow + snapshot.rows - 1);
    bounds.lastCol = Math.max(bounds.lastCol, bounds.firstCol + snapshot.columns - 1);
  }
  const rows = bounds.lastRow - bounds.firstRow + 1;
  const columns = bounds.lastCol - bounds.firstCol + 1;
  if (bounds.lastRow > STUDIO_SHEET_LIMITS.rows || bounds.lastCol > STUDIO_SHEET_LIMITS.columns)
    throw new Error('格式刷目标超出 10,000 行、256 列范围。');
  if (rows * columns > STUDIO_SHEET_LIMITS.clipboardCells)
    throw new Error('格式刷一次最多应用 10,000 个单元格，请缩小目标选区。');
  if (rows % snapshot.rows || columns % snapshot.columns)
    throw new Error('格式刷目标的行列数必须是来源矩形的整数倍。');
  const target = {
    anchor: { row: bounds.firstRow, col: bounds.firstCol },
    focus: { row: bounds.lastRow, col: bounds.lastCol },
  };
  const expected: string[] = [];
  for (let row = 0; row < rows; row += snapshot.rows)
    for (let col = 0; col < columns; col += snapshot.columns)
      for (const merge of snapshot.merges) {
        const [r1, c1, r2, c2] = merge.split(',').map(Number);
        expected.push([r1 + row, c1 + col, r2 + row, c2 + col].join(','));
      }
  if (JSON.stringify(mergePattern(sheet, target)) !== JSON.stringify(expected.sort()))
    throw new Error('格式刷来源与目标的合并布局不一致，请选择相同布局的区域。');
  for (const input of sheet.protectedRanges ?? []) {
    const range = studioParseRange(input);
    if (
      range &&
      range.firstRow <= bounds.lastRow &&
      range.lastRow >= bounds.firstRow &&
      range.firstCol <= bounds.lastCol &&
      range.lastCol >= bounds.firstCol
    )
      throw new Error('格式刷目标包含受保护区域，整次应用已取消。');
  }
  const updates: Record<string, CellFormat> = {};
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < columns; col++) {
      const address = studioCellAddress(bounds.firstRow + row, bounds.firstCol + col);
      const format = copyFormat(
        snapshot.cells[row % snapshot.rows][col % snapshot.columns],
        document.defaultFont
      );
      const previous = sheet.cells[address]?.borders;
      if (previous && JSON.stringify(previous) === JSON.stringify(format.borders))
        format.borders = previous;
      updates[address] = format;
    }
  return {
    document: studioPatchCells(document, sheetId, updates, {
      preserveInput: true,
      deferValidation: true,
    }),
    selection: target,
    count: rows * columns,
  };
}
