import { describe, expect, it } from 'vitest';
import { studioRemoveSheetDuplicates } from './studio-sheet-duplicates';
import { studioCalculate, studioParseAddress } from './studio-sheet-model';
import { studioSheetHyperlinksAt } from './studio-sheet-hyperlinks';
import type { StudioCell, StudioExcelDocument } from './studio-types';

const selection = (start: string, end = start) => ({
  anchor: studioParseAddress(start)!,
  focus: studioParseAddress(end)!,
});
function fixture(): StudioExcelDocument {
  return {
    version: 1,
    kind: 'excel',
    id: 'duplicates',
    name: 'Duplicates.xlsx',
    activeSheetId: 'main',
    sheets: [
      {
        id: 'main',
        name: 'Data',
        rowCount: 20,
        columnCount: 8,
        cells: {
          A1: { input: 'Key', bold: true },
          B1: { input: 'Value', bold: true },
          A2: { input: 'A', color: '#112233' },
          B2: { input: '10', numberFormat: '0.00' },
          A3: { input: 'A', color: '#445566' },
          B3: { input: '20', italic: true },
          A4: { input: 'B', underline: true },
          B4: { input: '30', borders: { bottom: { style: 'double' } } },
          C2: { input: 'outside-2' },
          C3: { input: 'outside-3' },
          C4: { input: 'outside-4' },
          A7: { input: 'below' },
        },
        rowHeights: { 2: 30, 3: 44 },
        rowHeightModes: { 2: 'fixed', 3: 'auto' },
        columnWidths: { A: 120, B: 160 },
        hiddenRows: [3],
        hiddenColumns: ['B'],
        freeze: { rows: 1, columns: 1 },
        filter: { range: 'A1:B4', columns: { A: { operator: 'equals', value: 'A' } } },
      },
      { id: 'other', name: 'Other', rowCount: 20, columnCount: 8, cells: { A4: { input: '100' } } },
    ],
  };
}
function run(document = fixture(), start = 'A1', end = 'B4', columns = [1], header = true) {
  return studioRemoveSheetDuplicates(document, 'main', selection(start, end), { columns, header });
}

describe('typed duplicate records', () => {
  it('keeps first records, header and outside cells while compacting values and formatting within selected columns', () => {
    const original = fixture(),
      before = JSON.stringify(original);
    const result = run(original);
    expect(result.removedCount).toBe(1);
    expect(result.remainingCount).toBe(2);
    const next = result.document.sheets[0],
      source = original.sheets[0];
    expect(next.cells.A1).toBe(source.cells.A1);
    expect(next.cells.B1).toBe(source.cells.B1);
    expect(next.cells.A2).toBe(source.cells.A2);
    expect(next.cells.B2).toBe(source.cells.B2);
    expect(next.cells.A3).toMatchObject(source.cells.A4);
    expect(next.cells.B3).toMatchObject(source.cells.B4);
    expect(next.cells.A3).toMatchObject({ color: '#000000', italic: false });
    expect(next.cells.B3).toMatchObject({
      italic: false,
      background: 'none',
      numberFormat: 'General',
    });
    expect(next.cells.A4).toMatchObject({ input: '', underline: false, borders: {} });
    expect(next.cells.B4).toMatchObject({ input: '', borders: {} });
    for (const address of ['C2', 'C3', 'C4', 'A7'])
      expect(next.cells[address]).toBe(source.cells[address]);
    for (const property of [
      'rowHeights',
      'rowHeightModes',
      'columnWidths',
      'hiddenRows',
      'hiddenColumns',
      'freeze',
      'filter',
    ] as const)
      expect(next[property]).toBe(source[property]);
    expect(result.document.sheets[1]).toBe(original.sheets[1]);
    expect(next.rowCount).toBe(source.rowCount);
    expect(next.columnCount).toBe(source.columnCount);
    expect(JSON.stringify(original)).toBe(before);
  });

  it('uses every selected comparison column with unambiguous tuples and stable first occurrence', () => {
    const original = fixture();
    original.sheets[0].cells = {
      A1: { input: 'ab' },
      B1: { input: 'c' },
      A2: { input: 'a' },
      B2: { input: 'bc' },
      A3: { input: 'ab' },
      B3: { input: 'c' },
      A4: { input: 'a' },
      B4: { input: 'bc' },
    };
    const result = run(original, 'B4', 'A1', [1, 2], false);
    expect(result.removedCount).toBe(2);
    expect(result.remainingCount).toBe(2);
    expect(result.document.sheets[0].cells.A1.input).toBe('ab');
    expect(result.document.sheets[0].cells.A2.input).toBe('a');
  });

  it('matches numbers, booleans and formula values by type and separates genuinely blank from explicit empty text', () => {
    const original = fixture();
    const entries: (StudioCell | undefined)[] = [
      { input: '1' },
      { input: '1', valueType: 'text' },
      { input: 'TRUE' },
      { input: 'true', valueType: 'text' },
      undefined,
      { input: '', background: '#ffffff' },
      { input: '', valueType: 'text' },
      { input: "'" },
      { input: '=1' },
      { input: '=TRUE()' },
      { input: '=""' },
      { input: "'1" },
    ];
    original.sheets[0].cells = {};
    entries.forEach((cell, index) => {
      if (cell) original.sheets[0].cells[`A${index + 1}`] = cell;
    });
    const result = run(original, 'A1', 'A12', [1], false);
    expect(result.removedCount).toBe(6);
    expect(result.remainingCount).toBe(6);
    const cells = result.document.sheets[0].cells;
    expect(cells.A1).toEqual(entries[0]);
    expect(cells.A2).toEqual(entries[1]);
    expect(cells.A3).toEqual(entries[2]);
    expect(cells.A4).toEqual(entries[3]);
    expect(cells.A5).toBeUndefined();
    expect(cells.A6).toMatchObject(entries[6]!);
  });

  it('preserves text case, whitespace and exact Unicode while ignoring numeric display format', () => {
    const original = fixture();
    original.sheets[0].cells = {};
    const inputs = ['A', 'a', ' A', 'A ', 'é', 'é', '2', '2'];
    inputs.forEach((input, index) => {
      original.sheets[0].cells[`A${index + 1}`] = {
        input,
        ...(index === 7 ? { numberFormat: '0.000' } : {}),
      };
    });
    const result = run(original, 'A1', 'A8', [1], false);
    expect(result.removedCount).toBe(1);
    expect(result.remainingCount).toBe(7);
    expect(result.document.sheets[0].cells.A7).toBe(original.sheets[0].cells.A7);
  });

  it('treats the optional header as data only when requested and retains document identity when nothing repeats', () => {
    const original = fixture();
    original.sheets[0].cells.A1.input = 'A';
    expect(run(original).removedCount).toBe(1);
    expect(run(original, 'A1', 'B4', [1], false).removedCount).toBe(2);
    const unique = run(original, 'A1', 'B4', [1, 2], true);
    expect(unique.removedCount).toBe(0);
    expect(unique.remainingCount).toBe(3);
    expect(unique.document).toBe(original);
    expect(run(original, 'A2', 'B2', [1], false).document).toBe(original);
  });

  it('uses absolute sheet column indexes for a selection starting after A and leaves its neighbors untouched', () => {
    const original = fixture();
    const result = run(original, 'B2', 'C4', [3], false);
    expect(result.document).toBe(original);
    expect(() => run(original, 'B2', 'C4', [1], false)).toThrow('比较列');
  });

  it('uses the actual workbook default font when replacing unformatted records and clearing old styled tails', () => {
    const original = fixture();
    original.defaultFont = { family: 'Noto Sans SC', sizePt: 16, bold: true, italic: true };
    original.sheets[0].cells.B3 = {
      input: '20',
      fontFamily: 'Courier New',
      fontSize: 24,
      bold: false,
      italic: false,
      underline: true,
      background: '#ffeecc',
      borders: { left: { style: 'double' } },
    };
    const result = run(original),
      cells = result.document.sheets[0].cells;
    for (const address of ['B3', 'A4', 'B4'])
      expect(cells[address]).toMatchObject({
        fontFamily: 'Noto Sans SC',
        fontSize: 16,
        bold: true,
        italic: true,
        underline: false,
        background: 'none',
      });
    expect(cells.B3.borders).toEqual(original.sheets[0].cells.B4.borders);
    expect(cells.B4.borders).toEqual({});
    expect(original.sheets[0].cells.B3.fontFamily).toBe('Courier New');
  });
});

describe('record metadata and formulas', () => {
  it('moves native and overlapping hyperlinks with the kept record, clears deleted tails and preserves external links', () => {
    const original = fixture();
    original.sheets[0].hyperlinks = [
      { id: 'outside', ref: 'C4', target: 'https://example.com/outside' },
      { id: 'span', ref: 'B2:C4', target: 'https://example.com/span', tooltip: 'span' },
      { id: 'specific', ref: 'B4', location: 'Other!A4', display: 'keep' },
    ];
    const before = JSON.stringify(original);
    const result = run(original);
    const next = result.document.sheets[0];
    expect(
      studioSheetHyperlinksAt(next, 'B3').map((link) => [link.target, link.location, link.display])
    ).toEqual([
      ['https://example.com/span', undefined, undefined],
      [undefined, 'Other!A4', 'keep'],
    ]);
    expect(studioSheetHyperlinksAt(next, 'B4')).toEqual([]);
    expect(studioSheetHyperlinksAt(next, 'C4').map((link) => link.target)).toEqual([
      'https://example.com/outside',
      'https://example.com/span',
    ]);
    expect(JSON.stringify(original)).toBe(before);
  });

  it('relocates local same-record relative references while retaining fixed rows, strings and other-sheet references', () => {
    const original = fixture();
    original.sheets[0].cells.B4 = {
      input: '=IF(A4="A4",0,1)+$A4+A$2+Data!A4+Other!A4',
      bold: true,
    };
    const result = run(original);
    expect(result.document.sheets[0].cells.B3.input).toBe(
      '=IF(A3="A4",0,1)+$A3+A$2+Data!A3+Other!A4'
    );
    expect(result.document.sheets[0].cells.B3.bold).toBe(true);
    expect(original.sheets[0].cells.B4.input).toContain('A4');
  });

  it('recalculates moved numeric record formulas without converting them into constant values', () => {
    const original = fixture();
    original.sheets[0].cells.B4 = { input: '=LEN(A4)*3' };
    const result = run(original);
    expect(result.document.sheets[0].cells.B3.input).toBe('=LEN(A3)*3');
    expect(studioCalculate(result.document).values.get('main:B3')).toBe(3);
  });

  it('keeps complete external ranges including inherited sheet qualifiers, quotes and absolute endpoints', () => {
    for (const formula of [
      '=SUM(Other!A4:B4)',
      '=SUM(Other!$A4:B$4)',
      '=SUM(Other!$A$2:$B4)',
      '=SUM(Other!A4 : $B$8)',
      "=SUM('Other sheet'!A4:B4)",
      "=SUM('报价 表'!$A4:$B$6)",
      "=SUM('Other''s'!A4:B4)",
      '=SUM(Other!A4:B4)+LEN(A4)',
    ]) {
      const original = fixture();
      original.sheets[0].cells.B4 = { input: formula };
      const before = JSON.stringify(original);
      const result = run(original);
      expect(result.document.sheets[0].cells.B3.input).toBe(
        formula.replace('+LEN(A4)', '+LEN(A3)')
      );
      expect(JSON.stringify(original)).toBe(before);
    }
  });

  it('moves both local range endpoints under their shared sheet and preserves fixed row endpoints', () => {
    for (const [formula, expected] of [
      ['=SUM(A4:B4)', '=SUM(A3:B3)'],
      ['=SUM(Data!A4:B4)', '=SUM(Data!A3:B3)'],
      ["=SUM('Data'!$A4:B4)", "=SUM('Data'!$A3:B3)"],
      ['=SUM(Data!A$4:$B4)', '=SUM(Data!A$4:$B3)'],
      ['=SUM(Data!$A$2 : B4)', '=SUM(Data!$A$2 : B3)'],
      ['=IF(A4="Other!A4:B4",0,SUM(Data!A4:B4))', '=IF(A3="Other!A4:B4",0,SUM(Data!A3:B3))'],
    ]) {
      const original = fixture();
      original.sheets[0].cells.B4 = { input: formula };
      expect(run(original).document.sheets[0].cells.B3.input).toBe(expected);
    }
  });

  it('refuses cross-record local range endpoints and explicitly qualified range ends atomically', () => {
    for (const formula of [
      '=SUM(Data!A2:B4)',
      '=SUM(Data!A4:B5)',
      "=SUM('Data'!A4:B3)",
      '=SUM(A4:C4)',
      '=SUM(Data!A4:Other!B4)',
      "=SUM(Data!A4:'Other'!B4)",
    ]) {
      const original = fixture();
      original.sheets[0].cells.B4 = { input: formula };
      const before = JSON.stringify(original);
      expect(() => run(original)).toThrow();
      expect(JSON.stringify(original)).toBe(before);
    }
  });

  it('refuses unsafe moved formula references atomically while leaving unrelated formulas at their addresses', () => {
    for (const formula of ['=A2+A4', '=C4', '=SUM(A:A)', '=INDIRECT("A4")']) {
      const original = fixture();
      original.sheets[0].cells.B4 = { input: formula };
      const before = JSON.stringify(original);
      expect(() => run(original)).toThrow();
      expect(JSON.stringify(original)).toBe(before);
    }
    const original = fixture();
    original.sheets[0].cells.D4 = { input: '=A4' };
    expect(run(original).document.sheets[0].cells.D4).toBe(original.sheets[0].cells.D4);
  });
});

describe('atomic safety boundaries', () => {
  it('rejects invalid selections, comparison columns, missing sheet and header-only selections', () => {
    const original = fixture();
    const before = JSON.stringify(original);
    for (const columns of [[], [1, 1], [0], [3], [1.5]])
      expect(() => run(original, 'A1', 'B4', columns)).toThrow();
    expect(() => run(original, 'A1', 'B1')).toThrow('表头');
    expect(() => run(original, 'A1', 'B21')).toThrow('范围');
    expect(() =>
      studioRemoveSheetDuplicates(original, 'missing', selection('A1', 'B4'), {
        columns: [1],
        header: true,
      })
    ).toThrow('工作表不存在');
    expect(() =>
      studioRemoveSheetDuplicates(
        original,
        'main',
        { anchor: { row: 0, col: 1 }, focus: { row: 2, col: 1 } },
        { columns: [1], header: false }
      )
    ).toThrow();
    expect(JSON.stringify(original)).toBe(before);
  });

  it('rejects merged and protected cells before any write', () => {
    for (const flag of ['merge', 'protected'] as const) {
      const original = fixture();
      if (flag === 'merge') original.sheets[0].merges = ['A3:A4'];
      else original.sheets[0].protectedRanges = ['B4'];
      const before = JSON.stringify(original);
      expect(() => run(original)).toThrow(flag === 'merge' ? '合并' : '保护');
      expect(JSON.stringify(original)).toBe(before);
    }
  });

  it('refuses intersecting validation/conditional rules while retaining rules entirely outside the affected rectangle', () => {
    for (const flag of ['validation', 'conditional'] as const) {
      const original = fixture();
      if (flag === 'validation')
        original.sheets[0].dataValidations = [
          {
            id: 'validation',
            range: 'B3:B5',
            type: 'whole',
            operator: 'greaterThan',
            formula1: '0',
          },
        ];
      else
        original.sheets[0].conditionalFormats = [
          {
            id: 'conditional',
            priority: 1,
            range: 'B3:B5',
            type: 'cellIs',
            operator: 'greaterThan',
            formulae: ['0'],
            style: { bold: true },
          },
        ];
      const before = JSON.stringify(original);
      expect(() => run(original)).toThrow('数据验证或条件格式');
      expect(JSON.stringify(original)).toBe(before);
    }
    const original = fixture();
    original.sheets[0].dataValidations = [
      { id: 'v', range: 'D1:D5', type: 'whole', operator: 'greaterThan', formula1: '0' },
    ];
    original.sheets[0].conditionalFormats = [
      {
        id: 'c',
        priority: 1,
        range: 'D1:D5',
        type: 'cellIs',
        operator: 'greaterThan',
        formulae: ['0'],
        style: { bold: true },
      },
    ];
    const next = run(original).document.sheets[0];
    expect(next.dataValidations).toBe(original.sheets[0].dataValidations);
    expect(next.conditionalFormats).toBe(original.sheets[0].conditionalFormats);
  });

  it('rejects array anchors and a spill whose anchor is outside the selection', () => {
    const original = fixture();
    original.sheets[0].cells.B4 = { input: '=SEQUENCE(2,1)', array: { type: 'dynamic' } };
    const before = JSON.stringify(original);
    expect(() => run(original)).toThrow('数组');
    expect(JSON.stringify(original)).toBe(before);
    original.sheets[0].cells.B4 = { input: '30' };
    original.sheets[0].cells.C1 = { input: '=SEQUENCE(4,1)', array: { type: 'dynamic' } };
    for (const address of ['C2', 'C3', 'C4']) delete original.sheets[0].cells[address];
    expect(() => run(original, 'B2', 'C4', [2], false)).toThrow('数组');
  });

  it('refuses formula errors in comparison columns and an oversized write selection without editing its source', () => {
    const original = fixture();
    original.sheets[0].cells.A3 = { input: '=1/0' };
    const before = JSON.stringify(original);
    expect(() => run(original)).toThrow('公式错误');
    expect(JSON.stringify(original)).toBe(before);
    original.sheets[0].rowCount = 10000;
    original.sheets[0].columnCount = 2;
    expect(() => run(original, 'A1', 'B10000', [1], false)).toThrow('10,000');
  });
});
