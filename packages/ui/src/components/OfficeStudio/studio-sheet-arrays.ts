import type { StudioCell, StudioSheet } from './studio-types';

export interface StudioArrayRange {
  firstRow: number;
  lastRow: number;
  firstCol: number;
  lastCol: number;
}

const address = (input: string) => {
  const match = /^([A-Z]{1,3})([1-9]\d*)$/.exec(input);
  if (!match) return;
  const col = [...match[1]].reduce((value, char) => value * 26 + char.charCodeAt(0) - 64, 0);
  const row = Number(match[2]);
  return row <= 10000 && col <= 256 ? { row, col } : undefined;
};

export function studioArrayRange(input: string): StudioArrayRange | undefined {
  const parts = input.split(':');
  if (parts.length > 2) return;
  const first = address(parts[0]);
  const last = address(parts[1] || parts[0]);
  if (!first || !last || last.row < first.row || last.col < first.col) return;
  if ((last.row - first.row + 1) * (last.col - first.col + 1) > 10000) return;
  return { firstRow: first.row, firstCol: first.col, lastRow: last.row, lastCol: last.col };
}

export const studioArrayContains = (range: StudioArrayRange, row: number, col: number) =>
  row >= range.firstRow && row <= range.lastRow && col >= range.firstCol && col <= range.lastCol;

export const studioArrayIntersects = (left: StudioArrayRange, right: StudioArrayRange) =>
  left.firstRow <= right.lastRow &&
  left.lastRow >= right.firstRow &&
  left.firstCol <= right.lastCol &&
  left.lastCol >= right.firstCol;

export function studioCellArrayIssue(cell: StudioCell, anchor: string) {
  if (!cell || cell.array === undefined) return;
  if (!cell.array || !cell.input.startsWith('=') || !address(anchor))
    return '数组公式需要有效的起始单元格和公式。';
  if (cell.array.type === 'dynamic' && Object.keys(cell.array).every((key) => key === 'type'))
    return;
  if (
    cell.array.type !== 'fixed' ||
    typeof cell.array.range !== 'string' ||
    Object.keys(cell.array).some((key) => !['type', 'range'].includes(key))
  )
    return '数组公式类型或范围无效。';
  const range = studioArrayRange(cell.array.range);
  const position = address(anchor)!;
  if (!range || range.firstRow !== position.row || range.firstCol !== position.col)
    return '固定数组必须从选区左上角开始，结果范围最多 10,000 格。';
}

export function studioSheetArraysIssue(sheet: StudioSheet) {
  const ranges: StudioArrayRange[] = [];
  let covered = 0;
  if (Object.values(sheet.cells).filter((cell) => cell.array).length > 100)
    return '每张工作表最多支持 100 个数组公式。';
  for (const [anchor, cell] of Object.entries(sheet.cells)) {
    const issue = studioCellArrayIssue(cell, anchor);
    if (issue) return issue;
    if (cell.array?.type !== 'fixed') continue;
    const range = studioArrayRange(cell.array.range)!;
    if (
      range.lastRow > sheet.rowCount ||
      range.lastCol > sheet.columnCount ||
      ranges.some((entry) => studioArrayIntersects(entry, range))
    )
      return '固定数组范围越界或重叠。';
    for (const [key, entry] of Object.entries(sheet.cells)) {
      const position = address(key);
      if (
        key !== anchor &&
        position &&
        studioArrayContains(range, position.row, position.col) &&
        entry.input !== ''
      )
        return '固定数组结果区域不能存放独立内容。';
    }
    covered += (range.lastRow - range.firstRow + 1) * (range.lastCol - range.firstCol + 1);
    if (covered > 100000) return '数组结果总量不能超过 100,000 格。';
    ranges.push(range);
  }
  if (
    sheet.protectedRanges &&
    (!Array.isArray(sheet.protectedRanges) ||
      sheet.protectedRanges.length > 100 ||
      sheet.protectedRanges.some(
        (range) =>
          !studioArrayRange(range) ||
          studioArrayRange(range)!.lastRow > sheet.rowCount ||
          studioArrayRange(range)!.lastCol > sheet.columnCount
      ))
  )
    return '受保护区域无效。';
  if (
    (sheet.protectedRanges || []).reduce((count, reference) => {
      const range = studioArrayRange(reference)!;
      return count + (range.lastRow - range.firstRow + 1) * (range.lastCol - range.firstCol + 1);
    }, 0) > 100000
  )
    return '受保护区域总量不能超过 100,000 格。';
}

/** Translate the spill suffix without touching quoted formula text or sheet names. */
export function studioRewriteSpillReferences(formula: string) {
  let result = '';
  for (let i = 0; i < formula.length;) {
    if (formula[i] === '"') {
      const from = i++;
      while (i < formula.length) {
        if (formula[i++] === '"') {
          if (formula[i] === '"') i++;
          else break;
        }
      }
      result += formula.slice(from, i);
      continue;
    }
    const match = /^(?:(?:'(?:[^']|'')+'|[\p{L}\p{N}_]+)!)?\$?[A-Z]{1,3}\$?[1-9]\d*#/iu.exec(
      formula.slice(i)
    );
    if (match && (i === 0 || !/[\p{L}\p{N}_.]/u.test(formula[i - 1]))) {
      result += `ANCHORARRAY(${match[0].slice(0, -1)})`;
      i += match[0].length;
    } else if (formula[i] === "'") {
      const from = i++;
      while (i < formula.length) {
        if (formula[i++] === "'") {
          if (formula[i] === "'") i++;
          else break;
        }
      }
      result += formula.slice(from, i);
    } else result += formula[i++];
  }
  return result;
}

/** Array operators use the parser's scalar coercion/error rules and broadcast singleton dimensions. */
export function studioEnableArrayOperators(parser: unknown) {
  const instance = parser as {
    arrayMode?: boolean;
    utils: {
      extractRefValue(value: unknown): { val: unknown; isArray: boolean };
      applyInfix(left: unknown, operator: string, right: unknown): unknown;
      applyPrefix(prefix: string[], value: unknown): unknown;
      applyPostfix(value: unknown, operator: string): unknown;
    };
  };
  const { utils } = instance;
  const infix = utils.applyInfix.bind(utils);
  const prefix = utils.applyPrefix.bind(utils);
  const postfix = utils.applyPostfix.bind(utils);
  const matrix = (value: unknown): unknown[][] =>
    Array.isArray(value) ? (value as unknown[][]) : [[value]];
  utils.applyInfix = (left, operator, right) => {
    if (!instance.arrayMode) return infix(left, operator, right);
    const a = utils.extractRefValue(left).val;
    const b = utils.extractRefValue(right).val;
    if (!Array.isArray(a) && !Array.isArray(b)) return infix(left, operator, right);
    const x = matrix(a);
    const y = matrix(b);
    const rows = Math.max(x.length, y.length);
    const cols = Math.max(x[0]?.length || 0, y[0]?.length || 0);
    if (!rows || !cols || rows * cols > 10000) throw new Error('#LIMIT!');
    return Array.from({ length: rows }, (_, row) =>
      Array.from({ length: cols }, (_, col) => {
        const l = x[x.length === 1 ? 0 : row]?.[x[0].length === 1 ? 0 : col];
        const r = y[y.length === 1 ? 0 : row]?.[y[0].length === 1 ? 0 : col];
        return l === undefined || r === undefined ? new Error('#N/A') : infix(l, operator, r);
      })
    );
  };
  utils.applyPrefix = (operators, value) => {
    const data = instance.arrayMode && utils.extractRefValue(value).val;
    return Array.isArray(data)
      ? data.map((row) => row.map((entry: unknown) => prefix(operators, entry)))
      : prefix(operators, value);
  };
  utils.applyPostfix = (value, operator) => {
    const data = instance.arrayMode && utils.extractRefValue(value).val;
    return Array.isArray(data)
      ? data.map((row) => row.map((entry: unknown) => postfix(entry, operator)))
      : postfix(value, operator);
  };
}
