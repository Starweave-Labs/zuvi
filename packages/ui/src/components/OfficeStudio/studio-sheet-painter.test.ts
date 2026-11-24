import { describe, expect, it } from 'vitest';
import { studioCopySheetFormat, studioPaintSheetFormat } from './studio-sheet-painter';
import { studioCalculate, studioParseAddress } from './studio-sheet-model';
import type { StudioExcelDocument } from './studio-types';

function selection(start: string, end = start) {
  return { anchor: studioParseAddress(start)!, focus: studioParseAddress(end)! };
}
function fixture(): StudioExcelDocument {
  return {
    version: 1,
    id: 'painter',
    name: 'painter.xlsx',
    kind: 'excel',
    activeSheetId: 'data',
    sheets: [
      {
        id: 'data',
        name: 'Data',
        rowCount: 12,
        columnCount: 8,
        cells: {
          A1: {
            input: 'source',
            bold: true,
            background: '#ff0000',
            numberFormat: '0.00',
            borders: { bottom: { style: 'double', color: '#0000ff' } },
          },
          B1: { input: '' },
          A2: { input: '3', italic: true },
          B2: { input: '4', wrap: true },
          D1: { input: '=SEQUENCE(2,2)', array: { type: 'dynamic' }, underline: true },
          E1: { input: '', background: '#00ff00', borders: { top: { style: 'thick' } } },
        },
        hyperlinks: [{ id: 'link', ref: 'D1', target: 'https://example.com' }],
        dataValidations: [
          { id: 'v', type: 'whole', range: 'E1', operator: 'greaterThan', formula1: '100' },
        ],
        conditionalFormats: [
          {
            id: 'cf',
            priority: 1,
            type: 'cellIs',
            range: 'D1:E2',
            operator: 'greaterThan',
            formulae: ['0'],
            style: { bold: true },
          },
        ],
      },
    ],
  };
}

describe('Excel format painter', () => {
  it('freezes a rectangular format snapshot, clears default styles, and keeps formulas, spills, links and rules', () => {
    const doc = fixture();
    const sheet = doc.sheets[0];
    const snapshot = studioCopySheetFormat(sheet, selection('B2', 'A1'));
    sheet.cells.A1.bold = false;
    sheet.cells.A1.borders!.bottom!.color = '#ffffff';
    const result = studioPaintSheetFormat(doc, sheet.id, selection('D1'), snapshot);
    expect(result.selection).toEqual(selection('D1', 'E2'));
    const next = result.document.sheets[0];
    expect(next.cells.D1).toMatchObject({
      input: '=SEQUENCE(2,2)',
      array: { type: 'dynamic' },
      bold: true,
      underline: false,
      borders: { bottom: { style: 'double', color: '#0000ff' } },
    });
    expect(next.cells.E1).toMatchObject({
      input: '',
      background: 'none',
      borders: {},
      numberFormat: 'General',
    });
    expect(next.hyperlinks).toBe(sheet.hyperlinks);
    expect(next.dataValidations).toBe(sheet.dataValidations);
    expect(next.conditionalFormats).toBe(sheet.conditionalFormats);
    expect(studioCalculate(result.document).values.get('data:E2')).toBe(4);
    expect(snapshot.cells[0][0]).not.toHaveProperty('array');
    expect(snapshot.cells[0][0]).not.toHaveProperty('input');
    expect(
      studioPaintSheetFormat(result.document, sheet.id, selection('D1'), snapshot).document
    ).toBe(result.document);
  });
  it('tiles a rectangular target while preserving exact text input and hidden geometry', () => {
    const doc = fixture();
    doc.sheets[0].hiddenRows = [4];
    doc.sheets[0].hiddenColumns = ['F'];
    doc.sheets[0].cells.D3 = { input: "'0012" };
    const result = studioPaintSheetFormat(
      doc,
      'data',
      selection('D3', 'G6'),
      studioCopySheetFormat(doc.sheets[0], selection('A1', 'B2'))
    );
    const sheet = result.document.sheets[0];
    expect(result.count).toBe(16);
    expect(sheet.cells.D3.input).toBe("'0012");
    expect(sheet.cells.F5.bold).toBe(true);
    expect(sheet.cells.G6.wrap).toBe(true);
    expect(sheet.hiddenRows).toEqual([4]);
    expect(sheet.hiddenColumns).toEqual(['F']);
    expect(doc.sheets[0].cells.G6).toBeUndefined();
  });
  it('expands complete merges and only accepts the same merge topology', () => {
    const doc = fixture();
    doc.sheets[0].merges = ['A1:B1', 'D3:E3'];
    const snapshot = studioCopySheetFormat(doc.sheets[0], selection('A1'));
    expect(snapshot.columns).toBe(2);
    const result = studioPaintSheetFormat(doc, 'data', selection('D3'), snapshot);
    expect(result.document.sheets[0].merges).toEqual(doc.sheets[0].merges);
    expect(result.document.sheets[0].cells.D3.bold).toBe(true);
    expect(() => studioPaintSheetFormat(doc, 'data', selection('D5'), snapshot)).toThrow(
      '合并布局'
    );
    expect(doc.sheets[0].cells.D5).toBeUndefined();
  });
  it('rejects incompatible sizes, protected targets and out-of-bounds targets atomically', () => {
    const doc = fixture();
    const original = JSON.stringify(doc);
    const snapshot = studioCopySheetFormat(doc.sheets[0], selection('A1', 'B2'));
    expect(() => studioPaintSheetFormat(doc, 'data', selection('D3', 'F5'), snapshot)).toThrow(
      '整数倍'
    );
    expect(() => studioPaintSheetFormat(doc, 'data', selection('IV10000'), snapshot)).toThrow(
      '超出'
    );
    expect(() => studioCopySheetFormat(doc.sheets[0], selection('A1', 'Z1000'))).toThrow(
      '最多复制'
    );
    expect(() => studioPaintSheetFormat(doc, 'data', selection('A1', 'Z1000'), snapshot)).toThrow(
      '最多应用'
    );
    expect(JSON.stringify(doc)).toBe(original);
    doc.sheets[0].protectedRanges = ['E4'];
    expect(() => studioPaintSheetFormat(doc, 'data', selection('D3'), snapshot)).toThrow('受保护');
    expect(doc.sheets[0].cells.D3).toBeUndefined();
  });
});
