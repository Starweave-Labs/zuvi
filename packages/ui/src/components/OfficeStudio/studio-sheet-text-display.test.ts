import { describe, expect, it } from 'vitest';
import { studioCalculate } from './studio-sheet-model';
import { sheetLayoutText, type SheetTextMeasure } from './studio-sheet-text-layout';
import {
  studioSheetCellTextInput,
  studioSheetCenteredTextSegments,
  studioSheetDerivedRowHeights,
  studioSheetTextMeasure,
} from './studio-sheet-text-display';
import type { StudioExcelDocument } from './studio-types';

const measure: SheetTextMeasure = (text, font) => ({
  width: text.length * font.sizePt,
  height: font.sizePt * 2,
  advances: [...text].map(() => font.sizePt),
});
function fixture(): StudioExcelDocument {
  return {
    version: 1,
    id: 'display',
    kind: 'excel',
    name: 'Display.xlsx',
    activeSheetId: 's',
    defaultFont: { family: 'Source Sans', sizePt: 10, bold: true, italic: true },
    sheets: [
      {
        id: 's',
        name: 'Sheet',
        rowCount: 20,
        columnCount: 4,
        cells: {
          A1: { input: '=SEQUENCE(2,2)', array: { type: 'dynamic' } },
          B2: { input: '', fontSize: 40 },
          A4: { input: "='Other'!A1", wrap: true },
          A5: { input: 'Fixed', wrap: true, fontSize: 40 },
        },
        rowHeights: { 5: 22 },
        rowHeightModes: { 5: 'fixed' },
        hyperlinks: [
          {
            id: 'blank-link',
            ref: 'C3',
            display: 'Long native label text',
            target: 'https://example.com/',
          },
        ],
      },
      {
        id: 'other',
        name: 'Other',
        rowCount: 1,
        columnCount: 1,
        cells: { A1: { input: 'A very long cross sheet text' } },
      },
    ],
  };
}
describe('shared sheet display adapters', () => {
  it.each([
    { hiddenColumns: ['A'], hiddenRows: [], merge: 'A1:C1', target: 1 },
    { hiddenColumns: [], hiddenRows: [1], merge: 'A1:C2', target: 2 },
    { hiddenColumns: ['A'], hiddenRows: [1], merge: 'A1:C2', target: 2 },
  ])(
    'fits a hidden logical merge master into its one visible row ($merge, target $target)',
    ({ hiddenColumns, hiddenRows, merge, target }) => {
      const document = fixture(),
        sheet = document.sheets[0];
      sheet.cells = { A1: { input: 'Merged', fontSize: 24, wrap: true } };
      sheet.merges = [merge];
      sheet.hiddenRows = hiddenRows;
      sheet.hiddenColumns = hiddenColumns;
      const offsets = hiddenColumns.length ? [0, 0, 100, 200, 300] : [0, 100, 200, 300, 400];
      const heights = studioSheetDerivedRowHeights(
        document,
        sheet,
        studioCalculate(document),
        [target],
        offsets,
        measure
      );
      expect(heights[String(target)]).toBe(36.75);
    }
  );
  it('counts full filter/hidden visibility rather than a requested subset when fitting a merge', () => {
    const document = fixture(),
      sheet = document.sheets[0];
    sheet.cells = { A1: { input: 'Merged', fontSize: 24, wrap: true } };
    sheet.merges = ['A1:C2'];
    expect(
      studioSheetDerivedRowHeights(
        document,
        sheet,
        studioCalculate(document),
        [2],
        [0, 100, 200, 300, 400],
        measure
      )['2']
    ).toBe(18);
    sheet.cells = {
      A1: { input: 'Header' },
      A2: { input: 'Merged', fontSize: 24, wrap: true },
      D2: { input: 'skip' },
      D3: { input: 'keep' },
    };
    sheet.merges = ['A2:C3'];
    sheet.filter = { range: 'A1:D3', columns: { D: { operator: 'contains', value: 'keep' } } };
    const heights = studioSheetDerivedRowHeights(
      document,
      sheet,
      studioCalculate(document),
      [3],
      [0, 100, 200, 300, 400],
      measure
    );
    expect(heights['3']).toBe(36.75);
  });
  it('measures a hidden merge master native label and keeps unrelated hidden auto caches intact', () => {
    const document = fixture(),
      sheet = document.sheets[0];
    document.defaultFont = { family: 'Source Sans', sizePt: 24, bold: false, italic: false };
    sheet.cells = {};
    sheet.merges = ['A1:C2'];
    sheet.hiddenRows = [1];
    sheet.rowHeights = { 1: 60 };
    sheet.rowHeightModes = {};
    sheet.hyperlinks = [
      { id: 'hidden-label', ref: 'A1', display: 'Merged', target: 'https://example.com/' },
    ];
    const heights = studioSheetDerivedRowHeights(
      document,
      sheet,
      studioCalculate(document),
      [1, 2],
      [0, 100, 200, 300, 400],
      measure
    );
    expect(heights['1']).toBe(60);
    expect(heights['2']).toBe(36.75);
  });
  it('keeps native first-link precedence for formatted blank cells after a blank range representative', () => {
    const document = fixture(),
      sheet = document.sheets[0];
    sheet.cells = { B1: { input: '', wrap: true, fontSize: 20 } };
    sheet.hyperlinks = [
      { id: 'first-range', ref: 'A1:C1', display: 'Short', target: 'https://example.com/first' },
      {
        id: 'later-cell',
        ref: 'B1',
        display: 'Long label which should never win',
        target: 'https://example.com/later',
      },
    ];
    expect(
      studioSheetDerivedRowHeights(
        document,
        sheet,
        studioCalculate(document),
        [1],
        [0, 100, 200, 300],
        measure
      )['1']
    ).toBe(60.75);
  });
  it('does not rescan unrelated automatic rows for each native single-cell link', () => {
    const document = fixture(),
      sheet = document.sheets[0];
    sheet.rowCount = 10000;
    sheet.hyperlinks = Array.from({ length: 1000 }, (_, index) => ({
      id: 'row-link-' + index,
      ref: 'C' + (index + 2000),
      display: 'Native label',
      target: 'https://example.com/',
    }));
    let reads = 0;
    const rows = new Proxy(
      Array.from({ length: 10000 }, (_, index) => 10000 - index),
      {
        get(target, key, receiver) {
          if (typeof key === 'string' && /^\d+$/.test(key) && ++reads > 100000)
            throw new Error('Unrelated native row scans exceeded the export work budget.');
          return Reflect.get(target, key, receiver);
        },
      }
    );
    const heights = studioSheetDerivedRowHeights(
      document,
      sheet,
      studioCalculate(document),
      rows,
      [0, 100, 200, 300, 400],
      measure
    );
    expect(heights['2000']).toBe(18);
    expect(heights['2999']).toBe(18);
    expect(heights['5']).toBe(22);
    expect(reads).toBeLessThan(100000);
  });
  it('fits automatic center-across rows to their actual shared span for both shrink and wrap', () => {
    const document = fixture(),
      sheet = document.sheets[0];
    sheet.cells = {
      A1: { input: 'LongHeading', fontSize: 24, align: 'centerContinuous', shrinkToFit: true },
      B1: { input: '', align: 'centerContinuous' },
      C1: { input: '', align: 'centerContinuous' },
    };
    let calculation = studioCalculate(document);
    const offsets = [0, 100, 200, 300];
    expect(
      studioSheetDerivedRowHeights(document, sheet, calculation, [1], offsets, measure)['1']
    ).toBe(36.75);
    sheet.cells.A1.wrap = true;
    calculation = studioCalculate(document);
    expect(
      studioSheetDerivedRowHeights(document, sheet, calculation, [1], offsets, measure)['1']
    ).toBe(36.75);
    const rendered = sheetLayoutText(
      studioSheetCellTextInput(
        document,
        sheet,
        calculation,
        'A1',
        { width: 300, height: 49 },
        measure,
        3
      )
    );
    expect(rendered.effectiveFont.sizePt).toBe(24);
    expect(rendered.lines).toHaveLength(1);
    expect(rendered.overconstrained).toBe(false);
  });
  it('uses center end borders once and obeys hidden, frozen, merge and occupancy boundaries in auto height', () => {
    const document = fixture(),
      sheet = document.sheets[0];
    sheet.cells = {
      A1: { input: 'LongHeading', fontSize: 24, align: 'centerContinuous', shrinkToFit: true },
      B1: { input: '', align: 'centerContinuous' },
      C1: { input: '', align: 'centerContinuous', borders: { right: { style: 'thick' } } },
    };
    const height = (offsets = [0, 100, 200, 300]) =>
      studioSheetDerivedRowHeights(
        document,
        sheet,
        studioCalculate(document),
        [1],
        offsets,
        measure
      )['1'];
    expect(
      studioSheetCellTextInput(
        document,
        sheet,
        studioCalculate(document),
        'A1',
        { width: 300, height: 49 },
        measure,
        3
      ).box.padding?.right
    ).toBe(8);
    sheet.freeze = { columns: 1, rows: 0 };
    expect(height()).toBe(18);
    delete sheet.freeze;
    sheet.hiddenColumns = ['B'];
    expect(height([0, 100, 100, 200])).toBe(18);
    delete sheet.hiddenColumns;
    sheet.merges = ['B1:C1'];
    expect(height()).toBe(18);
    delete sheet.merges;
    sheet.cells.B1.input = '=""';
    expect(height()).toBe(18);
    sheet.cells.B1.input = '';
    sheet.hyperlinks = [{ id: 'center-boundary', ref: 'B1', target: 'https://example.com/' }];
    expect(height()).toBe(18);
  });
  it('includes spill, cross-sheet formula and blank native labels in auto rows, with fixed rows unchanged', () => {
    const document = fixture();
    const calculation = studioCalculate(document);
    const sheet = document.sheets[0];
    const before = JSON.stringify(document);
    const heights = studioSheetDerivedRowHeights(
      document,
      sheet,
      calculation,
      [1, 2, 3, 4, 5],
      [0, 60, 120, 180, 240],
      measure
    );
    expect(heights['2']).toBeGreaterThan(heights['1']);
    expect(heights['3']).toBe(18);
    expect(heights['4']).toBeGreaterThan(18);
    expect(heights['5']).toBe(22);
    expect(JSON.stringify(document)).toBe(before);
    const spill = studioSheetCellTextInput(
      document,
      sheet,
      calculation,
      'B2',
      { width: 60, height: 24 },
      measure
    );
    expect(spill.display).toBe('4');
    expect(spill.defaultFont).toEqual({
      family: 'Source Sans',
      sizePt: 10,
      bold: true,
      italic: true,
    });
    const blank = studioSheetCellTextInput(
      document,
      sheet,
      calculation,
      'C3',
      { width: 60, height: 24 },
      measure
    );
    expect(blank.display).toBe('Long native label text');
  });
  it('counts merged outer borders once and excludes multirow merged text from an individual automatic row', () => {
    const document = fixture(),
      sheet = document.sheets[0];
    sheet.merges = ['A7:B8'];
    sheet.cells.A7 = {
      input: 'Huge merge',
      fontSize: 100,
      borders: { left: { style: 'thick' }, top: { style: 'medium' } },
    };
    sheet.cells.B7 = { input: '', borders: { right: { style: 'double' } } };
    sheet.cells.A8 = { input: '', borders: { bottom: { style: 'medium' } } };
    const calculation = studioCalculate(document);
    const input = studioSheetCellTextInput(
      document,
      sheet,
      calculation,
      'A7',
      { width: 120, height: 48 },
      measure
    );
    expect(input.box.padding).toEqual({ left: 8, right: 8, top: 2, bottom: 2 });
    const layout = sheetLayoutText(input);
    expect(layout.contentBox.width).toBe(104);
    expect(
      studioSheetDerivedRowHeights(
        document,
        sheet,
        calculation,
        [7, 8],
        [0, 60, 120, 180, 240],
        measure
      )
    ).toEqual({ 7: 18, 8: 18 });
  });
  it('stops center across at occupied formulas, native hyperlinks and frozen boundaries', () => {
    const document = fixture(),
      sheet = document.sheets[0];
    sheet.cells = {
      A1: { input: 'Title', align: 'centerContinuous' },
      B1: { input: '', align: 'centerContinuous' },
      C1: { input: '=""', align: 'centerContinuous' },
      D1: { input: '', align: 'centerContinuous' },
    };
    let calculation = studioCalculate(document);
    expect(
      studioSheetCenteredTextSegments(document, sheet, calculation, 1, [0, 60, 120, 180, 240]).map(
        (segment) => segment.memberCols
      )
    ).toEqual([
      [1, 2],
      [3, 4],
    ]);
    expect(
      studioSheetCenteredTextSegments(document, sheet, calculation, 1, [0, 60, 120, 180, 240], 1)[0]
        .memberCols
    ).toEqual([1]);
    sheet.cells.C1.input = '';
    sheet.hyperlinks = [{ id: 'bound', ref: 'C1', target: 'https://example.com/' }];
    calculation = studioCalculate(document);
    expect(
      studioSheetCenteredTextSegments(document, sheet, calculation, 1, [0, 60, 120, 180, 240])[0]
        .memberCols
    ).toEqual([1, 2]);
  });
  it('uses a bounded no-canvas fallback and preserves complete graphemes', () => {
    const measured = studioSheetTextMeasure(undefined)('A🙂', {
      family: 'Test Sans',
      sizePt: 10,
      bold: false,
      italic: false,
    });
    expect(measured.advances).toHaveLength(2);
    expect(measured.width).toBeGreaterThan(0);
  });
});
