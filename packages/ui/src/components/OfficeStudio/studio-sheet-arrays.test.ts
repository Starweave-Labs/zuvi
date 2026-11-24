import { describe, expect, it } from 'vitest';
import {
  studioCalculate,
  studioPatchCells,
  studioSetArrayFormula,
  studioDisplayCell,
  studioCopyTsv,
  studioCopySheetClipboard,
} from './studio-sheet-model';
import { studioRewriteSpillReferences } from './studio-sheet-arrays';
import { studioChangeSheetStructure } from './studio-sheet-structure';
import type { StudioExcelDocument } from './studio-types';

const workbook = (): StudioExcelDocument => ({
  version: 1,
  id: 'book',
  name: 'Arrays.xlsx',
  kind: 'excel',
  activeSheetId: 'main',
  sheets: [
    {
      id: 'main',
      name: 'Sheet1',
      rowCount: 20,
      columnCount: 10,
      cells: { A1: { input: '1' }, B1: { input: '2' }, A2: { input: '3' }, B2: { input: '4' } },
    },
  ],
});
const at = (row: number, col: number) => ({ anchor: { row, col }, focus: { row, col } });

describe('sheet array formulas', () => {
  it('keeps fixed error result cells protected and moves fixed ranges atomically before the array', () => {
    let document = studioSetArrayFormula(
      workbook(),
      'main',
      { anchor: { row: 1, col: 5 }, focus: { row: 2, col: 6 } },
      '=1/0',
      'fixed'
    );
    expect(() => studioPatchCells(document, 'main', { F2: { input: 'overwrite' } })).toThrow(
      '数组结果'
    );
    expect(studioCalculate(document).errors.get('main:F2')).toBe('#DIV/0!');
    expect(() =>
      studioChangeSheetStructure(document, 'main', {
        axis: 'row',
        type: 'insert',
        index: 2,
        count: 1,
      })
    ).toThrow('拆分');
    document = studioChangeSheetStructure(document, 'main', {
      axis: 'row',
      type: 'insert',
      index: 1,
      count: 1,
    });
    expect(document.sheets[0].cells.E2.array).toEqual({ type: 'fixed', range: 'E2:F3' });
  });

  it('copies computed array results without mutating its anchor or losing blank/type values', () => {
    const document = studioSetArrayFormula(
      workbook(),
      'main',
      at(1, 5),
      '=SEQUENCE(2,2)',
      'dynamic'
    );
    const selection = { anchor: { row: 1, col: 5 }, focus: { row: 2, col: 6 } };
    const text = studioCopyTsv(document.sheets[0], selection, studioCalculate(document));
    expect(text).toBe('1\t2\n3\t4');
    const payload = JSON.parse(studioCopySheetClipboard(document, 'main', selection));
    expect(payload.text).toBe(text);
    expect(payload.values.map((value: { value: number }) => value.value)).toEqual([1, 2, 3, 4]);
    expect(document.sheets[0].cells.E1.array).toEqual({ type: 'dynamic' });
  });

  it('calculates dynamic matrix arithmetic and dependent references regardless of formula insertion order', () => {
    const document = workbook();
    document.sheets[0].cells.H1 = { input: '=F2+1' };
    document.sheets[0].cells.E1 = { input: '=A1:B2*2', array: { type: 'dynamic' } };
    document.sheets[0].cells.H2 = { input: '=SUM(E1#)' };
    const calc = studioCalculate(document);
    expect(calc.errors.size).toBe(0);
    expect(['E1', 'F1', 'E2', 'F2'].map((key) => calc.values.get(`main:${key}`))).toEqual([
      2, 4, 6, 8,
    ]);
    expect(calc.values.get('main:H1')).toBe(9);
    expect(calc.values.get('main:H2')).toBe(20);
    expect(studioDisplayCell(undefined, calc.values.get('main:F2'))).toBe('8');
  });

  it('supports SEQUENCE, transpose, matrix multiplication, singleton broadcasting and scalar formulas', () => {
    const document = workbook();
    const formulae = [
      '=SEQUENCE(2,2,10,2)',
      '=TRANSPOSE(A1:B2)',
      '=MMULT(A1:B2,A1:B2)',
      '={1;2}+{10,20}',
      '=-{1,2;3,4}/100',
      '=SUM(A1:B2)',
    ];
    const expected = [
      [10, 12, 14, 16],
      [1, 3, 2, 4],
      [7, 10, 15, 22],
      [11, 21, 12, 22],
      [-0.01, -0.02, -0.03, -0.04],
      [10],
    ];
    formulae.forEach((input, index) => {
      document.sheets[0].cells.E1 = { input, array: { type: 'dynamic' } };
      const calc = studioCalculate(document);
      expect(calc.errors.size, input).toBe(0);
      expect(
        [...calc.arrayOwners.keys()].map((key) => calc.values.get(key)),
        input
      ).toEqual(expected[index]);
    });
  });

  it('detects occupied, merged, protected and out-of-bounds spill regions without overwriting them', () => {
    for (const scenario of ['occupied', 'merged', 'protected', 'outside']) {
      const document = workbook();
      const sheet = document.sheets[0];
      sheet.cells.E1 = { input: '=SEQUENCE(2,2)', array: { type: 'dynamic' } };
      if (scenario === 'occupied') sheet.cells.F2 = { input: 'keep' };
      if (scenario === 'merged') sheet.merges = ['E1:F1'];
      if (scenario === 'protected') sheet.protectedRanges = ['F2:F2'];
      if (scenario === 'outside') {
        delete sheet.cells.E1;
        sheet.cells.IV10000 = { input: '=SEQUENCE(2,2)', array: { type: 'dynamic' } };
      }
      const calc = studioCalculate(document);
      expect(calc.errors.get(`main:${scenario === 'outside' ? 'IV10000' : 'E1'}`), scenario).toBe(
        '#SPILL!'
      );
      expect(calc.arrayOwners.size).toBe(0);
      if (scenario === 'occupied') expect(sheet.cells.F2.input).toBe('keep');
    }
  });

  it('protects result cells, permits anchor edits, handles resized dynamic arrays and requires whole fixed-array removal', () => {
    let document = studioSetArrayFormula(workbook(), 'main', at(1, 5), '=SEQUENCE(2,2)', 'dynamic');
    expect(() => studioPatchCells(document, 'main', { F2: { input: '9' } })).toThrow('数组结果');
    document = studioPatchCells(document, 'main', { E1: { input: '=SEQUENCE(1,1)' } });
    expect(studioCalculate(document).arrayOwners.has('main:F2')).toBe(false);
    document = studioSetArrayFormula(
      workbook(),
      'main',
      { anchor: { row: 1, col: 5 }, focus: { row: 2, col: 6 } },
      '={1,2;3,4}',
      'fixed'
    );
    expect(() => studioPatchCells(document, 'main', { E1: { input: '' } })).toThrow('整体删除');
    const deleted = studioPatchCells(document, 'main', {
      E1: { input: '' },
      F1: { input: '' },
      E2: { input: '' },
      F2: { input: '' },
    });
    expect(deleted.sheets[0].cells.E1.array).toBeUndefined();
    expect(studioCalculate(deleted).arrayOwners.size).toBe(0);
  });

  it('resolves a dependent dynamic array reading another array result before that anchor is evaluated', () => {
    const document = workbook();
    document.sheets[0].cells.H1 = { input: '=F2+1', array: { type: 'dynamic' } };
    document.sheets[0].cells.E1 = { input: '=SEQUENCE(2,2)', array: { type: 'dynamic' } };
    const calculation = studioCalculate(document);
    expect(calculation.values.get('main:H1')).toBe(5);
  });

  it('preserves string/boolean array element types in value-only copies and propagates error elements through spill references', () => {
    const document = studioSetArrayFormula(
      workbook(),
      'main',
      at(1, 5),
      '={"12",TRUE;"word",FALSE}',
      'dynamic'
    );
    const selection = { anchor: { row: 1, col: 5 }, focus: { row: 2, col: 6 } };
    const copied = JSON.parse(studioCopySheetClipboard(document, 'main', selection));
    expect(copied.values).toEqual([
      { type: 'string', value: '12' },
      { type: 'boolean', value: true },
      { type: 'string', value: 'word' },
      { type: 'boolean', value: false },
    ]);
    expect(copied.cells[0].input).toBe("'12");
    document.sheets[0].cells.E1.input = '={1,0}/{1,0}';
    document.sheets[0].cells.H1 = { input: '=E1#', array: { type: 'dynamic' } };
    const calc = studioCalculate(document);
    expect(calc.values.get('main:H1')).toBe(1);
    expect(calc.errors.get('main:I1')).toBe('#DIV/0!');
  });

  it('evaluates elementwise IF conditions and keeps scalar IF lazy', () => {
    const document = workbook();
    document.sheets[0].cells.E1 = { input: '=IF(A1:B2>2,A1:B2,0)', array: { type: 'dynamic' } };
    const calculation = studioCalculate(document);
    expect(['E1', 'F1', 'E2', 'F2'].map((key) => calculation.values.get(`main:${key}`))).toEqual([
      0, 0, 3, 4,
    ]);
    document.sheets[0].cells.E1.input = '=IF(TRUE,SEQUENCE(2,2),1/0)';
    expect(studioCalculate(document).values.get('main:F2')).toBe(4);
  });

  it('reports a cycle when an array reads its own result region instead of caching a stale blank', () => {
    const document = workbook();
    document.sheets[0].cells.E1 = { input: '=E1:F2', array: { type: 'dynamic' } };
    expect(studioCalculate(document).errors.get('main:E1')).toBe('#CYCLE!');
    document.sheets[0].cells.E1.input = '=F1:G2';
    expect(studioCalculate(document).errors.get('main:E1')).toBe('#CYCLE!');
  });

  it('keeps errors in individual array elements and rejects array cycles and invalid shapes', () => {
    const document = workbook();
    document.sheets[0].cells.E1 = { input: '={1,0}/0', array: { type: 'dynamic' } };
    const calc = studioCalculate(document);
    expect(calc.errors.get('main:E1')).toBe('#DIV/0!');
    expect(calc.errors.get('main:F1')).toBe('#DIV/0!');
    document.sheets[0].cells.E1.input = '=E1#';
    expect(studioCalculate(document).errors.get('main:E1')).toBe('#CYCLE!');
    expect(studioRewriteSpillReferences('SUM(A1#)+"A1#"')).toBe('SUM(ANCHORARRAY(A1))+"A1#"');
    expect(studioRewriteSpillReferences("SUM('A1# sheet'!B1)")).toBe("SUM('A1# sheet'!B1)");
  });
});
