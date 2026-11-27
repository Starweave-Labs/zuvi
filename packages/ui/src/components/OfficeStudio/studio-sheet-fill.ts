import {
  STUDIO_SHEET_LIMITS,
  studioCellAddress,
  studioInputValue,
  studioParseRange,
  studioPatchCells,
  studioSelectionAddresses,
  studioSelectionBounds,
  studioTranslateFormula,
  type SheetPosition,
  type SheetSelection,
} from './studio-sheet-model';
import { studioSheetHyperlinksAt } from './studio-sheet-hyperlinks';
import type {
  StudioCell,
  StudioExcelDocument,
  StudioSheet,
  StudioSheetHyperlink,
} from './studio-types';

export type StudioFillDirection = 'down' | 'right';

/**
 * 依据种子单元格推断填充序列类型：纯数字 → number(+1)；
 * ISO 日期 → date(+1 天)；带尾数数字的文本 → text 尾数递增；
 * 其余文本 → text 复制（step 0）。填充柄拖拽使用该推断。
 */
export function studioInferFillType(
  sheet: StudioSheet,
  seed: SheetPosition
): { type: 'number' | 'date' | 'text'; step?: number } {
  const cell = sheet.cells[studioCellAddress(seed.row, seed.col)];
  const input = (cell?.input ?? '').trim();
  if (input === '') return { type: 'text', step: 0 };
  if (/^-?\d+(?:\.\d+)?$/.test(input)) return { type: 'number', step: 1 };
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return { type: 'date', step: 1 };
  if (/^(?:.*?\d+)[^\d]*$/.test(input) && /\d/.test(input)) return { type: 'text' };
  return { type: 'text', step: 0 };
}

export interface StudioFillSeriesOptions {
  direction: StudioFillDirection;
  type: 'number' | 'date' | 'text';
  step?: number;
  seedCount?: 1 | 2;
  /** Inclusive boundary; dates accept ISO dates or Excel serials, text accepts a suffix/label. */
  stopValue?: number | string;
}

const DAY = 86400000;
const FIRST_ISO_DAY = Date.parse('0001-01-01T00:00:00.000Z') / DAY;
const LAST_ISO_DAY = Date.parse('9999-12-31T00:00:00.000Z') / DAY;
const LAST_SERIAL_DAY = 2958466;

function fillContext(
  document: StudioExcelDocument,
  sheetId: string,
  selection: SheetSelection,
  direction: StudioFillDirection
) {
  const sheet = document.sheets.find((item) => item.id === sheetId);
  if (!sheet) throw new Error('工作表不存在。');
  if (direction !== 'down' && direction !== 'right') throw new Error('填充方向无效。');
  for (const position of [selection.anchor, selection.focus]) {
    if (
      !Number.isInteger(position.row) ||
      !Number.isInteger(position.col) ||
      position.row < 1 ||
      position.col < 1 ||
      position.row > STUDIO_SHEET_LIMITS.rows ||
      position.col > STUDIO_SHEET_LIMITS.columns
    )
      throw new Error('填充区域超出 10,000 行、256 列的支持范围。');
  }
  studioSelectionAddresses(selection);
  const bounds = studioSelectionBounds(selection);
  const rows = bounds.lastRow - bounds.firstRow + 1;
  const columns = bounds.lastCol - bounds.firstCol + 1;
  return {
    sheet,
    bounds,
    length: direction === 'down' ? rows : columns,
    tracks: direction === 'down' ? columns : rows,
    position(track: number, index: number): SheetPosition {
      return {
        row: bounds.firstRow + (direction === 'down' ? index : track),
        col: bounds.firstCol + (direction === 'down' ? track : index),
      };
    },
  };
}

function rejectMergedRange(
  sheet: StudioSheet,
  bounds: ReturnType<typeof studioSelectionBounds>,
  coverage?: { direction: StudioFillDirection; lengths: number[] }
) {
  for (const entry of sheet.merges ?? []) {
    const range = studioParseRange(entry);
    if (!range) throw new Error('合并区域无效，请先修复工作表。');
    if (
      range.firstRow <= bounds.lastRow &&
      range.lastRow >= bounds.firstRow &&
      range.firstCol <= bounds.lastCol &&
      range.lastCol >= bounds.firstCol
    ) {
      if (coverage) {
        const down = coverage.direction === 'down';
        const first = down ? bounds.firstCol : bounds.firstRow;
        const start = Math.max(first, down ? range.firstCol : range.firstRow);
        const end = Math.min(
          down ? bounds.lastCol : bounds.lastRow,
          down ? range.lastCol : range.lastRow
        );
        let intersects = false;
        for (let track = start; track <= end; track++)
          if (
            (down ? range.firstRow : range.firstCol) <=
            (down ? bounds.firstRow : bounds.firstCol) + coverage.lengths[track - first] - 1
          )
            intersects = true;
        if (!intersects) continue;
      }
      throw new Error('填充区域中有合并单元格，请先拆分。');
    }
  }
}

function fillBatch() {
  const updates: Record<string, StudioCell> = {};
  const hyperlinks: Record<string, StudioSheetHyperlink[]> = {};
  let inputLength = 0;
  let hyperlinkCoverage = 0;
  return {
    updates,
    hyperlinks,
    add(position: SheetPosition, cell: StudioCell, links: StudioSheetHyperlink[]) {
      if (cell.input.length > 32767) throw new Error('每个单元格的填充内容最多 32,767 个字符。');
      inputLength += cell.input.length;
      if (inputLength > 5000000) throw new Error('填充内容过大，请缩小选区或分批填充。');
      hyperlinkCoverage += links.length;
      if (hyperlinkCoverage > 500000) throw new Error('填充的超链接范围组合过多，请缩小选区。');
      updates[studioCellAddress(position.row, position.col)] = cell;
      hyperlinks[studioCellAddress(position.row, position.col)] = links;
    },
  };
}

/** Each column/row copies its top/left cell from the original snapshot. */
export function studioFillCells(
  document: StudioExcelDocument,
  sheetId: string,
  selection: SheetSelection,
  direction: StudioFillDirection
): StudioExcelDocument {
  const context = fillContext(document, sheetId, selection, direction);
  if (context.length === 1) return document;
  rejectMergedRange(context.sheet, context.bounds);
  const batch = fillBatch();
  for (let track = 0; track < context.tracks; track++) {
    const origin = context.position(track, 0);
    const source = context.sheet.cells[studioCellAddress(origin.row, origin.col)] ?? {
      input: '',
    };
    const hyperlinks = studioSheetHyperlinksAt(
      context.sheet,
      studioCellAddress(origin.row, origin.col)
    );
    for (let index = 1; index < context.length; index++) {
      const target = context.position(track, index);
      batch.add(
        target,
        {
          ...source,
          input: studioTranslateFormula(
            source.input,
            target.row - origin.row,
            target.col - origin.col
          ),
        },
        hyperlinks
      );
    }
  }
  return studioPatchCells(document, sheetId, batch.updates, {
    replace: true,
    hyperlinks: batch.hyperlinks,
  });
}

function numericSeed(cell: StudioCell): number {
  const value = studioInputValue(cell.input, cell.numberFormat, cell.valueType);
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new Error('数字序列需要有效数字种子，不能使用公式或文本。');
  return value;
}

function decimalPlaces(value: number): number {
  const [mantissa, exponent = '0'] = String(value).toLowerCase().split('e');
  return Math.max(0, (mantissa.split('.')[1]?.length ?? 0) - Number(exponent));
}

interface SeriesPlan {
  last: number;
  increment: number;
  value(offset: number): number;
  format(value: number): string;
  dateFormat?: 'iso' | 'serial';
  prefix?: string;
}

function numberSeries(seeds: StudioCell[], step?: number): SeriesPlan {
  const values = seeds.map(numericSeed);
  const increment = step ?? (values.length === 2 ? values[1] - values[0] : 1);
  if (!Number.isFinite(increment)) throw new Error('序列步长超出有效数字范围。');
  const last = values[values.length - 1];
  // Derive decimal precision from the entered seeds, not a noisy inferred difference.
  const scale = 10 ** Math.max(...values.map(decimalPlaces), decimalPlaces(step ?? 1));
  return {
    last,
    increment,
    value(offset) {
      const value = last + increment * offset;
      return Number.isFinite(value * scale) ? Math.round(value * scale) / scale : value;
    },
    format(value) {
      if (!Number.isFinite(value)) throw new Error('序列结果超出有效数字范围。');
      return String(value);
    },
  };
}

function dateSeed(cell: StudioCell): { value: number; format: 'iso' | 'serial' } {
  const value = studioInputValue(cell.input, cell.numberFormat, cell.valueType);
  if (typeof value === 'number' && value >= 0 && value < LAST_SERIAL_DAY)
    return { value, format: 'serial' };
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const timestamp = Date.parse(`${value}T00:00:00.000Z`);
    if (
      Number.isFinite(timestamp) &&
      timestamp / DAY >= FIRST_ISO_DAY &&
      new Date(timestamp).toISOString().slice(0, 10) === value
    )
      return { value: timestamp / DAY, format: 'iso' };
  }
  throw new Error('日期序列需要有效 YYYY-MM-DD 日期或 Excel 日期序号。');
}

function dateSeries(seeds: StudioCell[], step?: number): SeriesPlan {
  const values = seeds.map(dateSeed);
  if (values.some((value) => value.format !== values[0].format))
    throw new Error('日期种子必须使用相同的日期表示。');
  const increment = step ?? (values.length === 2 ? values[1].value - values[0].value : 1);
  if (!Number.isInteger(increment)) throw new Error('日期序列的步长必须为整数天。');
  const last = values[values.length - 1];
  return {
    last: last.value,
    increment,
    dateFormat: last.format,
    value: (offset) => last.value + increment * offset,
    format(value) {
      if (
        !Number.isFinite(value) ||
        (last.format === 'serial'
          ? value < 0 || value >= LAST_SERIAL_DAY
          : value < FIRST_ISO_DAY || value > LAST_ISO_DAY)
      )
        throw new Error('日期序列超出支持的日期范围。');
      return last.format === 'serial'
        ? String(value)
        : new Date(value * DAY).toISOString().slice(0, 10);
    },
  };
}

function textSeries(seeds: StudioCell[], step?: number): SeriesPlan {
  const values = seeds.map((cell) => {
    const match = cell.input.startsWith('=') ? null : /^(.*?)(\d+)$/s.exec(cell.input);
    if (!match || !Number.isSafeInteger(Number(match[2])))
      throw new Error('文本序列需要带有有效整数尾数的文本种子。');
    return { prefix: match[1], value: Number(match[2]), width: match[2].length };
  });
  if (values.some((value) => value.prefix !== values[0].prefix))
    throw new Error('文本种子的前缀必须相同。');
  const increment = step ?? (values.length === 2 ? values[1].value - values[0].value : 1);
  if (!Number.isSafeInteger(increment)) throw new Error('文本序列的步长必须为有效整数。');
  const last = values[values.length - 1];
  const width = Math.max(...values.map((value) => value.width));
  return {
    last: last.value,
    increment,
    prefix: last.prefix,
    value: (offset) => last.value + increment * offset,
    format(value) {
      if (!Number.isSafeInteger(value) || value < 0)
        throw new Error('文本序列的尾数超出有效非负整数范围。');
      return `${last.prefix}${String(value).padStart(width, '0')}`;
    },
  };
}

const DECIMAL_NUMBER = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
function stopNumber(input: number | string) {
  if (typeof input === 'number' && Number.isFinite(input)) return input;
  if (
    typeof input === 'string' &&
    DECIMAL_NUMBER.test(input.trim()) &&
    Number.isFinite(Number(input))
  )
    return Number(input);
  throw new Error('停止值必须为有效数字。');
}

function seriesStop(
  input: number | string,
  plan: SeriesPlan,
  type: StudioFillSeriesOptions['type']
) {
  if (plan.increment === 0) throw new Error('设置停止值时，序列步长不能为 0。');
  if (type === 'number') return stopNumber(input);
  if (type === 'text') {
    let value: number;
    if (typeof input === 'number' || DECIMAL_NUMBER.test(input.trim())) value = stopNumber(input);
    else {
      const label = /^(.*?)(\d+)$/s.exec(input.trimEnd());
      if (!label || label[1] !== plan.prefix)
        throw new Error('文本停止值必须使用与种子相同的前缀。');
      value = Number(label[2]);
    }
    if (!Number.isSafeInteger(value) || value < 0)
      throw new Error('文本停止值必须为有效的非负整数尾数。');
    return value;
  }
  const epoch = Date.parse('1899-12-31T00:00:00.000Z') / DAY;
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.trim())) {
    const parsed = dateSeed({ input: input.trim() });
    const value =
      plan.dateFormat === 'iso'
        ? parsed.value
        : parsed.value - epoch + (input.trim() >= '1900-03-01' ? 1 : 0);
    if (value < 0 && plan.dateFormat === 'serial')
      throw new Error('日期停止值超出 Excel 日期序号范围。');
    return value;
  }
  const serial = stopNumber(input);
  if (serial < 0 || serial >= LAST_SERIAL_DAY)
    throw new Error('日期停止值超出 Excel 日期序号范围。');
  if (plan.dateFormat === 'serial') return serial;
  if (Math.floor(serial) === 60) throw new Error('Excel 序号 60 的虚构日期不能用于 ISO 日期序列。');
  return epoch + serial - (serial >= 60 ? 1 : 0);
}

/** Seeds stay unchanged; generated values and direct styles commit as one batch. */
export function studioFillSeries(
  document: StudioExcelDocument,
  sheetId: string,
  selection: SheetSelection,
  options: StudioFillSeriesOptions
): StudioExcelDocument {
  return studioFillSeriesResult(document, sheetId, selection, options).document;
}

/** Actual destinations exclude cells beyond the stop boundary, including unchanged tail cells. */
export function studioFillSeriesResult(
  document: StudioExcelDocument,
  sheetId: string,
  selection: SheetSelection,
  options: StudioFillSeriesOptions
): { document: StudioExcelDocument; addresses: string[] } {
  const seedCount = options.seedCount ?? 1;
  if (seedCount !== 1 && seedCount !== 2) throw new Error('序列填充支持一个或两个种子。');
  if (!['number', 'date', 'text'].includes(options.type)) throw new Error('序列类型无效。');
  if (options.step !== undefined && !Number.isFinite(options.step))
    throw new Error('序列步长必须为有效数字。');
  if (
    options.stopValue !== undefined &&
    typeof options.stopValue !== 'number' &&
    typeof options.stopValue !== 'string'
  )
    throw new Error('停止值必须为数字或文本。');
  const context = fillContext(document, sheetId, selection, options.direction);
  if (context.length < seedCount) throw new Error('选区没有足够的序列种子。');
  if (context.length === seedCount && options.stopValue === undefined)
    return { document, addresses: [] };
  if (options.stopValue === undefined) rejectMergedRange(context.sheet, context.bounds);
  const batch = fillBatch();
  const lengths: number[] = [];
  for (let track = 0; track < context.tracks; track++) {
    const seeds = Array.from({ length: seedCount }, (_, index) => {
      const position = context.position(track, index);
      return context.sheet.cells[studioCellAddress(position.row, position.col)] ?? { input: '' };
    });
    const plan =
      options.type === 'number'
        ? numberSeries(seeds, options.step)
        : options.type === 'date'
          ? dateSeries(seeds, options.step)
          : textSeries(seeds, options.step);
    const stop =
      options.stopValue === undefined
        ? undefined
        : seriesStop(options.stopValue, plan, options.type);
    let filledLength = seedCount;
    for (let index = seedCount; index < context.length; index++) {
      if (stop !== undefined && (plan.increment > 0 ? plan.last >= stop : plan.last <= stop)) break;
      const position = context.position(track, index);
      const source = seeds[index % seedCount];
      const origin = context.position(track, index % seedCount);
      const value = plan.value(index - seedCount + 1);
      if (stop !== undefined && (plan.increment > 0 ? value > stop : value < stop)) break;
      const input = plan.format(value);
      const cell = { ...source, input };
      // Pure digit identifiers remain text when their padding reaches e.g. 099 -> 100.
      if (
        options.type === 'text' &&
        typeof studioInputValue(input, cell.numberFormat, cell.valueType) !== 'string'
      )
        cell.numberFormat = '@';
      batch.add(
        position,
        cell,
        studioSheetHyperlinksAt(context.sheet, studioCellAddress(origin.row, origin.col))
      );
      filledLength = index + 1;
    }
    lengths.push(filledLength);
  }
  if (options.stopValue !== undefined)
    rejectMergedRange(context.sheet, context.bounds, { direction: options.direction, lengths });
  return {
    document: studioPatchCells(document, sheetId, batch.updates, {
      replace: true,
      hyperlinks: batch.hyperlinks,
    }),
    addresses: Object.keys(batch.updates),
  };
}
