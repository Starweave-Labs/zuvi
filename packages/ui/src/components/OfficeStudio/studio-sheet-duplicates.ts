import type { StudioCell, StudioExcelDocument, StudioSheetHyperlink } from './studio-types';
import {
  studioCalculate,
  studioCellAddress,
  studioInputValue,
  studioParseAddress,
  studioParseRange,
  studioPatchCells,
  studioSelectionAddresses,
  studioSelectionBounds,
  studioTranslateFormula,
  type SheetSelection,
  type StudioRange,
} from './studio-sheet-model';
import { studioSheetHyperlinksAt } from './studio-sheet-hyperlinks';
import { studioDefaultCellFormat } from './studio-sheet-editing';

export interface StudioSheetDuplicateOptions {
  /** Absolute one-based sheet columns, all within the selected rectangle. */
  columns: readonly number[];
  /** The first selected row stays unchanged and does not participate in matching. */
  header: boolean;
}

export interface StudioSheetDuplicateResult {
  document: StudioExcelDocument;
  removedCount: number;
  /** Data records remaining, excluding the optional header. */
  remainingCount: number;
}

function intersects(a: StudioRange, b: StudioRange) {
  return (
    a.firstRow <= b.lastRow &&
    a.lastRow >= b.firstRow &&
    a.firstCol <= b.lastCol &&
    a.lastCol >= b.firstCol
  );
}

/**
 * As with sorting, moved formulas follow their own record. Fixed row references
 * and references to other sheets stay attached to their original addresses.
 * Cross-record local references are refused before any write takes place.
 */
function recordFormula(
  input: string,
  sourceRow: number,
  targetRow: number,
  sheetName: string,
  range: StudioRange
) {
  if (!input.startsWith('=') || sourceRow === targetRow) return input;
  studioTranslateFormula(input, 0, 0);
  const moveEndpoint = (fixedCol: string, column: string, fixedRow: string, row: string) => {
    const unchanged = `${fixedCol}${column}${fixedRow}${row}`;
    if (fixedRow) return unchanged;
    const position = studioParseAddress(`${column}${row}`);
    if (!position) return unchanged;
    if (position.row !== sourceRow || position.col < range.firstCol || position.col > range.lastCol)
      throw new Error(
        '删除重复项中的公式包含跨行或选区外的相对引用，请扩大选区或使用固定行引用后重试。'
      );
    return `${fixedCol}${column}${targetRow}`;
  };
  // Treat A1:B1 as one reference: the end inherits the start's sheet.
  // Parsing endpoints independently would wrongly move the B1 in Other!A1:B1.
  const token =
    /"(?:[^"]|"")*"|((?:'(?:[^']|'')+'|[\p{L}_][\p{L}\p{N}_.]*)!)?(\$?)([A-Z]{1,3})(\$?)([1-9]\d*)(?:(\s*:\s*)(\$?)([A-Z]{1,3})(\$?)([1-9]\d*))?(?![\p{L}\p{N}_.(])/giu;
  return input.replace(
    token,
    (
      match,
      sheet: string | undefined,
      fixedCol: string,
      column: string,
      fixedRow: string,
      row: string,
      separator: string | undefined,
      endFixedCol: string,
      endColumn: string,
      endFixedRow: string,
      endRow: string,
      offset: number
    ) => {
      if (
        match.startsWith('"') ||
        /[\p{L}\p{N}_.]/u.test(input[offset - 1] ?? '') ||
        /^\s*\(/.test(input.slice(offset + match.length))
      )
        return match;
      if (sheet) {
        const raw = sheet.slice(0, -1);
        const target = raw.startsWith("'") ? raw.slice(1, -1).replace(/''/g, "'") : raw;
        if (target.toLocaleLowerCase() !== sheetName.toLocaleLowerCase()) return match;
      }
      const start = moveEndpoint(fixedCol, column, fixedRow, row);
      const end = separator
        ? separator + moveEndpoint(endFixedCol, endColumn, endFixedRow, endRow)
        : '';
      return `${sheet ?? ''}${start}${end}`;
    }
  );
}

/**
 * Keep the first occurrence of each typed value tuple and compact only the
 * selected columns. Text is compared exactly, including case and whitespace.
 * Truly blank cells differ from explicit empty text and formula empty strings.
 * This is a cell-record operation: sheet rows and external addresses stay put.
 */
export function studioRemoveSheetDuplicates(
  document: StudioExcelDocument,
  sheetId: string,
  selection: SheetSelection,
  options: StudioSheetDuplicateOptions
): StudioSheetDuplicateResult {
  const sheet = document.sheets.find((entry) => entry.id === sheetId);
  if (!sheet) throw new Error('工作表不存在。');
  const range = studioSelectionBounds(selection);
  if (
    ![range.firstRow, range.lastRow, range.firstCol, range.lastCol].every(Number.isInteger) ||
    range.firstRow < 1 ||
    range.firstCol < 1 ||
    range.lastRow > sheet.rowCount ||
    range.lastCol > sheet.columnCount
  )
    throw new Error('删除重复项的选区超出工作表范围。');
  if (typeof options.header !== 'boolean') throw new Error('请确认选区是否包含表头。');
  const first = range.firstRow + (options.header ? 1 : 0);
  if (first > range.lastRow) throw new Error('请在表头之外至少选择一行数据。');
  if (!Array.isArray(options.columns) || !options.columns.length)
    throw new Error('请至少选择一个比较列。');
  if (
    new Set(options.columns).size !== options.columns.length ||
    options.columns.some(
      (column) => !Number.isInteger(column) || column < range.firstCol || column > range.lastCol
    )
  )
    throw new Error('比较列应位于选区内且不能重复。');
  const addresses = studioSelectionAddresses(selection);
  const overlaps = (input: string) => {
    const bounds = studioParseRange(input);
    if (!bounds) throw new Error('选区存在无效的区域记录，请重新导入工作簿。');
    return intersects(range, bounds);
  };
  if (sheet.merges?.some(overlaps)) throw new Error('删除重复项的区域包含合并单元格，请先拆分。');
  if (sheet.protectedRanges?.some(overlaps))
    throw new Error('删除重复项的区域包含受保护单元格，请先取消该区域保护。');
  if (
    sheet.dataValidations?.some((rule) => overlaps(rule.range)) ||
    sheet.conditionalFormats?.some((rule) => overlaps(rule.range))
  )
    throw new Error('删除重复项的区域包含数据验证或条件格式规则，请先移除选区内规则后重试。');
  const calculation = studioCalculate(document);
  if (
    addresses.some(
      (address) =>
        sheet.cells[address]?.array || calculation.arrayOwners.has(`${sheetId}:${address}`)
    )
  )
    throw new Error('删除重复项的区域包含数组公式或数组结果，请先移除完整数组。');
  const seen = new Set<string>();
  const kept: number[] = [];
  for (let row = first; row <= range.lastRow; row++) {
    const key = options.columns.map((column) => {
      const address = studioCellAddress(row, column);
      const cell = sheet.cells[address];
      const id = `${sheetId}:${address}`;
      if (calculation.errors.has(id)) throw new Error(`比较列 ${address} 含公式错误，请先修正。`);
      if (!cell || (cell.input === '' && cell.valueType !== 'text')) return ['blank'];
      const value =
        calculation.values.get(id) ??
        studioInputValue(cell.input, cell.numberFormat, cell.valueType);
      return [typeof value, value];
    });
    const serialized = JSON.stringify(key);
    if (!seen.has(serialized)) {
      seen.add(serialized);
      kept.push(row);
    }
  }
  const remainingCount = kept.length;
  const removedCount = range.lastRow - first + 1 - remainingCount;
  if (!removedCount) return { document, removedCount, remainingCount };
  const updates: Record<string, Partial<StudioCell>> = {};
  const hyperlinks: Record<string, StudioSheetHyperlink[] | null> = {};
  // Native export preserves unspecified source formatting. Replaced records
  // therefore need explicit defaults to clear any formatting at their targets.
  const defaultFormat = studioDefaultCellFormat(document.defaultFont);
  let linkCoverage = 0;
  for (let targetRow = first; targetRow <= range.lastRow; targetRow++) {
    const sourceRow = kept[targetRow - first];
    if (sourceRow === targetRow) continue;
    for (let col = range.firstCol; col <= range.lastCol; col++) {
      const address = studioCellAddress(targetRow, col);
      const sourceAddress = sourceRow === undefined ? undefined : studioCellAddress(sourceRow, col);
      const source = sourceAddress === undefined ? undefined : sheet.cells[sourceAddress];
      updates[address] =
        source && sourceRow !== undefined
          ? {
              ...defaultFormat,
              ...source,
              input: recordFormula(source.input, sourceRow, targetRow, sheet.name, range),
            }
          : { ...defaultFormat, input: '' };
      hyperlinks[address] =
        sourceAddress === undefined ? null : studioSheetHyperlinksAt(sheet, sourceAddress);
      linkCoverage += hyperlinks[address]?.length ?? 0;
      if (linkCoverage > 500000) throw new Error('删除重复项的超链接范围组合过多，请缩小选区。');
    }
  }
  const next = studioPatchCells(document, sheetId, updates, { replace: true, hyperlinks });
  return { document: next, removedCount, remainingCount };
}
