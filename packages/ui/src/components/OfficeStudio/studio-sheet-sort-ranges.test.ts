import { describe, expect, it } from 'vitest';
import { studioCalculate, studioSortRangeByKeys, type SheetSelection } from './studio-sheet-model';
import type { StudioExcelDocument } from './studio-types';

const selection: SheetSelection = { anchor: { row: 1, col: 1 }, focus: { row: 4, col: 4 } };
function fixture(): StudioExcelDocument {
  const records = {
    A1: { input: 'Key' },
    B1: { input: 'Amount' },
    C1: { input: 'External' },
    D1: { input: 'Quoted' },
  };
  const external = {};
  for (const [row, key, amount] of [
    [2, 'Z', 10],
    [3, 'Y', 20],
    [4, 'A', 30],
  ] as const) {
    Object.assign(records, {
      [`A${row}`]: { input: key },
      [`B${row}`]: { input: String(amount) },
      [`C${row}`]: { input: `=SUM(Other!A${row}:B${row})` },
      [`D${row}`]: { input: `=SUM('Other quoted'!$A${row}:B${row})` },
    });
    Object.assign(external, {
      [`A${row}`]: { input: String(10 ** (row - 2)) },
      [`B${row}`]: { input: String(2 * 10 ** (row - 2)) },
    });
  }
  return {
    version: 1,
    kind: 'excel',
    id: 'sort-ranges',
    name: 'Ranges.xlsx',
    activeSheetId: 'main',
    sheets: [
      { id: 'main', name: 'Sort Data', rowCount: 8, columnCount: 6, cells: records },
      { id: 'other', name: 'Other', rowCount: 8, columnCount: 6, cells: external },
      {
        id: 'quoted',
        name: 'Other quoted',
        rowCount: 8,
        columnCount: 6,
        cells: structuredClone(external),
      },
    ],
  };
}
const sort = (document: StudioExcelDocument) =>
  studioSortRangeByKeys(document, 'main', selection, [{ column: 1, direction: 'asc' }], true);

describe('record sorting with sheet-qualified A1 ranges', () => {
  it('retains complete external references and their real values when first and last records exchange places', () => {
    const original = fixture(),
      before = JSON.stringify(original),
      oldCalculation = studioCalculate(original);
    const result = sort(original),
      next = studioCalculate(result);
    expect([2, 3, 4].map((row) => result.sheets[0].cells[`A${row}`].input)).toEqual([
      'A',
      'Y',
      'Z',
    ]);
    for (const [sourceRow, targetRow, value] of [
      [4, 2, 300],
      [3, 3, 30],
      [2, 4, 3],
    ]) {
      for (const column of ['C', 'D']) {
        expect(result.sheets[0].cells[`${column}${targetRow}`].input).toBe(
          original.sheets[0].cells[`${column}${sourceRow}`].input
        );
        expect(oldCalculation.values.get(`main:${column}${sourceRow}`)).toBe(value);
        expect(next.values.get(`main:${column}${targetRow}`)).toBe(value);
        expect(next.errors.has(`main:${column}${targetRow}`)).toBe(false);
      }
    }
    expect(JSON.stringify(original)).toBe(before);
    expect(result.sheets[1]).toBe(original.sheets[1]);
    expect(result.sheets[2]).toBe(original.sheets[2]);
  });

  it('retains plain, quoted, escaped-quote and Unicode external qualifiers over mixed absolute ranges', () => {
    for (const formula of [
      '=SUM(Other!$A4:B$4)',
      '=SUM(Other!$A$2:$B4)',
      '=SUM(Other!A4 : $B$8)',
      "=SUM('Other quoted'!A4:B4)",
      "=SUM('Other''s'!A4:B4)",
      "=SUM('报价 表'!$A4:$B$6)",
    ]) {
      const original = fixture();
      original.sheets[0].cells.C4 = { input: formula };
      expect(sort(original).sheets[0].cells.C2.input).toBe(formula);
    }
  });

  it('moves both endpoints of same-record local ranges under unqualified and current-sheet names', () => {
    for (const [formula, expected] of [
      ['=SUM(B4:B4)', '=SUM(B2:B2)'],
      ["=SUM('Sort Data'!B4:$B4)", "=SUM('Sort Data'!B2:$B2)"],
      ["=SUM('Sort Data'!$B4:$B4)", "=SUM('Sort Data'!$B2:$B2)"],
    ]) {
      const original = fixture();
      original.sheets[0].cells.C4 = { input: formula };
      const result = sort(original);
      expect(result.sheets[0].cells.C2.input).toBe(expected);
      expect(studioCalculate(result).values.get('main:C2')).toBe(30);
    }
  });

  it('keeps fixed row endpoints and quoted strings while moving only relative local endpoints', () => {
    for (const [formula, expected] of [
      ["=SUM('Sort Data'!B$4:$B4)", "=SUM('Sort Data'!B$4:$B2)"],
      ["=SUM('Sort Data'!$B$2 : B4)", "=SUM('Sort Data'!$B$2 : B2)"],
      ['=IF(B4>0,"Other!A4:B4",SUM(B4:B4))', '=IF(B2>0,"Other!A4:B4",SUM(B2:B2))'],
      ['=SUM(Other!A4:B4)+B4', '=SUM(Other!A4:B4)+B2'],
    ]) {
      const original = fixture();
      original.sheets[0].cells.C4 = { input: formula };
      expect(sort(original).sheets[0].cells.C2.input).toBe(expected);
    }
  });

  it('refuses cross-record, outside-selection and separately qualified endpoint ranges before any document mutation', () => {
    for (const formula of [
      "=SUM('Sort Data'!B2:B4)",
      "=SUM('Sort Data'!B4:B5)",
      '=SUM(B4:E4)',
      '=SUM(Other!A4:Other!B4)',
      "=SUM('Sort Data'!B4:'Other'!B4)",
      '=INDIRECT("B4")',
    ]) {
      const original = fixture();
      original.sheets[0].cells.C4 = { input: formula };
      const before = JSON.stringify(original);
      expect(() => sort(original)).toThrow();
      expect(JSON.stringify(original)).toBe(before);
    }
  });
});
