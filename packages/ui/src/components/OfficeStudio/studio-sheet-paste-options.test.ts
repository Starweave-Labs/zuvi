import { describe, expect, it } from 'vitest';
import {
  studioCalculate,
  studioClipboardOrigin,
  studioCopySheetClipboard,
  studioCopyTsv,
  studioParseAddress,
  studioPasteCells,
  studioPatchCells,
} from './studio-sheet-model';
import type { StudioCell, StudioExcelDocument } from './studio-types';

function fixture(cells: Record<string, StudioCell>): StudioExcelDocument {
  return {
    version: 1,
    id: 'paste',
    name: 'paste.xlsx',
    kind: 'excel',
    activeSheetId: 's',
    sheets: [{ id: 's', name: 'Data', rowCount: 20, columnCount: 10, cells }],
  };
}
function copy(document: StudioExcelDocument, first = 'A1', last = first) {
  const selection = { anchor: studioParseAddress(first)!, focus: studioParseAddress(last)! };
  const text = studioCopyTsv(document.sheets[0], selection);
  const source = studioClipboardOrigin(studioCopySheetClipboard(document, 's', selection), text)!;
  return { text, source };
}

describe('Skip blanks and arithmetic Paste Special', () => {
  it('skips only actual empty inputs, preserving skipped formatting, formulas, links and protection', () => {
    const doc = fixture({
      A1: { input: '2' },
      B1: { input: '', bold: true },
      A2: { input: '0' },
      B2: { input: 'FALSE' },
      D4: { input: '10' },
      E4: { input: '=3*4', italic: true, background: '#ffff00' },
      D5: { input: '4' },
      E5: { input: '5' },
    });
    doc.sheets[0].hyperlinks = [{ id: 'keep', ref: 'E4', target: 'https://example.com/keep' }];
    doc.sheets[0].protectedRanges = ['E4:E4'];
    const { text, source } = copy(doc, 'A1', 'B2');
    const result = studioPasteCells(doc, 's', { row: 4, col: 4 }, text, source, 'values', {
      skipBlanks: true,
    });
    expect(result.addresses).toEqual(['D4', 'D5', 'E5']);
    expect(result.document.sheets[0].cells.E4).toBe(doc.sheets[0].cells.E4);
    expect(result.document.sheets[0].hyperlinks).toBe(doc.sheets[0].hyperlinks);
    expect(result.document.sheets[0].cells.D5.input).toBe('0');
    expect(result.document.sheets[0].cells.E5.input).toBe('FALSE');
    expect(doc.sheets[0].cells.D4.input).toBe('10');
  });
  it('pastes spaces, explicit empty strings and empty-string formulas rather than mistaking them for blank cells', () => {
    const doc = fixture({
      A1: { input: '' },
      A2: { input: ' ' },
      A3: { input: "'" },
      A4: { input: '=""' },
      A5: { input: '0' },
      A6: { input: 'FALSE' },
      D1: { input: 'keep', bold: true },
      D2: { input: 'keep' },
      D3: { input: 'keep' },
      D4: { input: 'keep' },
    });
    const { text, source } = copy(doc, 'A1', 'A6');
    const result = studioPasteCells(doc, 's', { row: 1, col: 4 }, text, source, 'values', {
      skipBlanks: true,
    });
    expect(result.addresses).toEqual(['D2', 'D3', 'D4', 'D5', 'D6']);
    expect(result.document.sheets[0].cells.D1).toBe(doc.sheets[0].cells.D1);
    expect(
      ['D2', 'D3', 'D4', 'D5', 'D6'].map(
        (address) => result.document.sheets[0].cells[address].input
      )
    ).toEqual([' ', "'", "'", '0', 'FALSE']);
  });
  it('skips empty source merge units, copies nonempty merge units and rejects partial target merge changes atomically', () => {
    const doc = fixture({ A1: { input: '' }, D4: { input: 'keep' } });
    doc.sheets[0].merges = ['A1:B1', 'D4:E4'];
    const blank = copy(doc, 'A1', 'B1');
    expect(
      studioPasteCells(doc, 's', { row: 4, col: 4 }, blank.text, blank.source, 'all', {
        skipBlanks: true,
      }).document
    ).toBe(doc);
    const populated = studioPatchCells(doc, 's', { A1: { input: 'joined' } });
    const data = copy(populated, 'A1', 'B1');
    const result = studioPasteCells(
      populated,
      's',
      { row: 4, col: 4 },
      data.text,
      data.source,
      'all',
      { skipBlanks: true }
    );
    expect(result.document.sheets[0].cells.D4.input).toBe('joined');
    expect(result.document.sheets[0].merges).toContain('D4:E4');
    const partial = fixture({ A1: { input: '2' }, B1: { input: '' }, D4: { input: 'keep' } });
    partial.sheets[0].merges = ['D4:E4'];
    const c = copy(partial, 'A1', 'B1');
    expect(() =>
      studioPasteCells(partial, 's', { row: 4, col: 4 }, c.text, c.source, 'all', {
        skipBlanks: true,
      })
    ).toThrow('完整合并区域');
    expect(partial.sheets[0].cells.D4.input).toBe('keep');
  });
  it('supports transposed skip maps and formatting-only skips without changing target contents', () => {
    const doc = fixture({
      A1: { input: '2', bold: true },
      B1: { input: '' },
      A2: { input: '3' },
      B2: { input: '4' },
      D4: { input: 'keep', italic: true },
      D5: { input: 'skip', italic: true },
    });
    const { text, source } = copy(doc, 'A1', 'B2');
    const transposed = studioPasteCells(doc, 's', { row: 4, col: 4 }, text, source, 'transpose', {
      skipBlanks: true,
    });
    expect(transposed.document.sheets[0].cells.D5).toBe(doc.sheets[0].cells.D5);
    expect(transposed.document.sheets[0].cells.E4.input).toBe('3');
    const format = studioPasteCells(doc, 's', { row: 4, col: 4 }, text, source, 'formats', {
      skipBlanks: true,
    });
    expect(format.document.sheets[0].cells.D4).toMatchObject({
      input: 'keep',
      bold: true,
      italic: false,
    });
    expect(() =>
      studioPasteCells(doc, 's', { row: 4, col: 4 }, text, source, 'formats', { operation: 'add' })
    ).toThrow('不能组合');
  });
  it('performs all four operations while preserving target styles and hyperlinks in value mode', () => {
    const doc = fixture({
      A1: { input: '3' },
      D4: { input: '12', italic: true, numberFormat: '0.00', background: '#ffff00' },
    });
    doc.sheets[0].hyperlinks = [{ id: 'keep', ref: 'D4', target: 'https://example.com/keep' }];
    const { text, source } = copy(doc);
    for (const [operation, input] of [
      ['add', '15'],
      ['subtract', '9'],
      ['multiply', '36'],
      ['divide', '4'],
    ] as const) {
      const result = studioPasteCells(doc, 's', { row: 4, col: 4 }, text, source, 'values', {
        operation,
      });
      expect(result.document.sheets[0].cells.D4).toEqual({ ...doc.sheets[0].cells.D4, input });
      expect(result.document.sheets[0].hyperlinks).toBe(doc.sheets[0].hyperlinks);
    }
  });
  it('uses frozen copied values while keeping the target formula live, and relocates source formulas in formula mode', () => {
    const doc = fixture({
      A1: { input: '=A2*2' },
      A2: { input: '3' },
      B1: { input: '2' },
      D4: { input: '=B1+1' },
      D5: { input: '4' },
    });
    const { text, source } = copy(doc);
    const changed = studioPatchCells(doc, 's', { A2: { input: '100' } });
    const frozen = studioPasteCells(changed, 's', { row: 4, col: 4 }, text, source, 'values', {
      operation: 'add',
    }).document;
    expect(frozen.sheets[0].cells.D4.input).toBe('=(B1+1)+(6)');
    expect(studioCalculate(frozen).values.get('s:D4')).toBe(9);
    const formulas = studioPasteCells(doc, 's', { row: 4, col: 4 }, text, source, 'formulas', {
      operation: 'add',
    }).document;
    expect(formulas.sheets[0].cells.D4.input).toBe('=(B1+1)+(D5*2)');
    expect(studioCalculate(formulas).values.get('s:D4')).toBe(11);
    expect(
      studioCalculate(studioPatchCells(formulas, 's', { D5: { input: '5' } })).values.get('s:D4')
    ).toBe(13);
  });
  it('treats actual blank operands as zero, keeps boolean/zero operands nonblank and preserves numeric results under text formatting', () => {
    const doc = fixture({
      A1: { input: 'TRUE' },
      B1: { input: 'FALSE' },
      A2: { input: '0' },
      B2: { input: '' },
      D4: { input: '', numberFormat: '@' },
      E4: { input: '5' },
      D5: { input: '4' },
      E5: { input: '5' },
    });
    const { text, source } = copy(doc, 'A1', 'B2');
    const result = studioPasteCells(doc, 's', { row: 4, col: 4 }, text, source, 'values', {
      operation: 'add',
      skipBlanks: true,
    });
    expect(result.addresses).toEqual(['D4', 'E4', 'D5']);
    expect(result.document.sheets[0].cells.D4).toEqual({ input: '=1', numberFormat: '@' });
    expect(studioCalculate(result.document).values.get('s:D4')).toBe(1);
    expect(result.document.sheets[0].cells.E5).toBe(doc.sheets[0].cells.E5);
  });
  it('rejects late zero divisors, nonnumeric identifiers and numeric overflow without partial writes', () => {
    const doc = fixture({
      A1: { input: '3' },
      B1: { input: '0' },
      D4: { input: '12' },
      E4: { input: '4' },
    });
    const before = JSON.stringify(doc);
    const { text, source } = copy(doc, 'A1', 'B1');
    expect(() =>
      studioPasteCells(doc, 's', { row: 4, col: 4 }, text, source, 'values', {
        operation: 'divide',
        skipBlanks: true,
      })
    ).toThrow('除以零');
    expect(JSON.stringify(doc)).toBe(before);
    const identifiers = fixture({ A1: { input: "'002" }, D4: { input: '4' } });
    const c = copy(identifiers);
    expect(() =>
      studioPasteCells(identifiers, 's', { row: 4, col: 4 }, c.text, c.source, 'values', {
        operation: 'add',
      })
    ).toThrow('文本');
    expect(() =>
      studioPasteCells(
        fixture({ D4: { input: '1e308' } }),
        's',
        { row: 4, col: 4 },
        '1e308',
        undefined,
        'all',
        { operation: 'multiply' }
      )
    ).toThrow('有效数字范围');
  });
  it('validates translated formulas and data rules against the final batch, cancelling division errors and dependent-rule failures', () => {
    const doc = fixture({ A1: { input: '=A2' }, A2: { input: '2' }, D4: { input: '10' } });
    const c = copy(doc);
    expect(() =>
      studioPasteCells(doc, 's', { row: 4, col: 4 }, c.text, c.source, 'formulas', {
        operation: 'divide',
      })
    ).toThrow('DIV/0');
    expect(doc.sheets[0].cells.D4.input).toBe('10');
    const dependent = fixture({
      A1: { input: '1' },
      B1: { input: '1' },
      D4: { input: '=E4' },
      E4: { input: '1' },
    });
    dependent.sheets[0].dataValidations = [
      { id: 'max', range: 'D4:D4', type: 'whole', operator: 'lessThanOrEqual', formula1: '2' },
    ];
    const data = copy(dependent, 'A1', 'B1');
    expect(() =>
      studioPasteCells(dependent, 's', { row: 4, col: 4 }, data.text, data.source, 'values', {
        operation: 'add',
      })
    ).toThrow('整次粘贴已取消');
    expect(dependent.sheets[0].cells.E4.input).toBe('1');
    dependent.sheets[0].dataValidations![0] = {
      id: 'max',
      range: 'D4:D4',
      type: 'whole',
      operator: 'lessThanOrEqual',
      formula1: '3',
    };
    const result = studioPasteCells(
      dependent,
      's',
      { row: 4, col: 4 },
      data.text,
      data.source,
      'values',
      { operation: 'add' }
    ).document;
    expect(studioCalculate(result).values.get('s:D4')).toBe(3);
  });
  it('keeps skipped array/protected cells untouched and rejects arithmetic edits of any actual array target', () => {
    const doc = fixture({
      A1: { input: '2' },
      B1: { input: '' },
      D4: { input: '10' },
      E4: { input: '=SEQUENCE(2)', array: { type: 'dynamic' } },
    });
    const c = copy(doc, 'A1', 'B1');
    const result = studioPasteCells(doc, 's', { row: 4, col: 4 }, c.text, c.source, 'values', {
      operation: 'add',
      skipBlanks: true,
    });
    expect(result.document.sheets[0].cells.E4).toBe(doc.sheets[0].cells.E4);
    const one = copy(doc);
    expect(() =>
      studioPasteCells(doc, 's', { row: 4, col: 5 }, one.text, one.source, 'values', {
        operation: 'add',
      })
    ).toThrow('数组');
    doc.sheets[0].protectedRanges = ['D4:D4'];
    expect(() =>
      studioPasteCells(doc, 's', { row: 4, col: 4 }, one.text, one.source, 'values', {
        operation: 'add',
      })
    ).toThrow('受保护');
  });
});
