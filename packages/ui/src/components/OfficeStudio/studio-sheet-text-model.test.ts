import { describe, expect, it } from 'vitest';
import { createOfficeStudioDocument, isOfficeStudioDocument } from './studio-model';
import {
  studioCalculate,
  studioClipboardOrigin,
  studioCopySheetClipboard,
  studioCopyTsv,
  studioParseAddress,
  studioPasteCells,
  studioPatchCells,
  studioSetRowHeight,
} from './studio-sheet-model';
import { studioDefaultCellFormat, studioSetCellTextFormat } from './studio-sheet-editing';
import { studioCopySheetFormat, studioPaintSheetFormat } from './studio-sheet-painter';
import { studioChangeSheetStructure } from './studio-sheet-structure';
import { sheetRowHeightMode } from './studio-sheet-text-properties';
import type { StudioExcelDocument } from './studio-types';

function fixture(): StudioExcelDocument {
  return {
    version: 1,
    id: 'text-model',
    name: 'text-model.xlsx',
    kind: 'excel',
    activeSheetId: 's',
    sheets: [
      {
        id: 's',
        name: 'Data',
        rowCount: 20,
        columnCount: 8,
        cells: {
          A1: { input: '3', align: 'right', indent: 2, textRotation: 45, shrinkToFit: true },
          B1: { input: '=A1*2', verticalAlign: 'distributed', wrap: true },
          D1: { input: '=SEQUENCE(2,2)', array: { type: 'dynamic' } },
          A4: { input: 'Merged text' },
          B4: { input: '' },
          C4: { input: 'keep' },
          D4: { input: '=A1+10' },
        },
        merges: ['A4:B4'],
        hyperlinks: [{ id: 'link', ref: 'B1', target: 'https://example.com' }],
      },
    ],
  };
}
function selection(start: string, end = start) {
  return { anchor: studioParseAddress(start)!, focus: studioParseAddress(end)! };
}

describe('Excel text model integration', () => {
  it('uses actual workbook font defaults for clear, compact clipboard and painter snapshots', () => {
    const source = fixture();
    source.defaultFont = { family: 'Source Book Font', sizePt: 9.5, bold: true, italic: true };
    const expected = { fontFamily: 'Source Book Font', fontSize: 9.5, bold: true, italic: true };
    expect(studioDefaultCellFormat(source.defaultFont)).toMatchObject({
      ...expected,
      indent: 0,
      textRotation: 0,
      shrinkToFit: false,
    });
    const captured = studioCopySheetFormat(source.sheets[0], selection('A1'), source.defaultFont);
    expect(captured.cells[0][0]).toMatchObject(expected);
    const text = studioCopyTsv(source.sheets[0], selection('A1'));
    const payload = studioCopySheetClipboard(source, 's', selection('A1'));
    const raw = JSON.parse(payload);
    expect(raw.defaultFont).toEqual(source.defaultFont);
    expect(raw.cells[0]).not.toHaveProperty('fontFamily');
    const origin = studioClipboardOrigin(payload, text)!;
    expect(origin.defaultFont).toEqual(source.defaultFont);
    const target = fixture();
    target.defaultFont = { family: 'Target Book Font', sizePt: 14, bold: false, italic: false };
    const pasted = studioPasteCells(
      target,
      's',
      { row: 4, col: 3 },
      text,
      origin,
      'formats'
    ).document;
    expect(pasted.sheets[0].cells.C4).toMatchObject({ input: 'keep', ...expected });
    expect(pasted.defaultFont).toBe(target.defaultFont);
    source.defaultFont.family = 'Later Source Font';
    const painted = studioPaintSheetFormat(target, 's', selection('B1'), captured).document;
    expect(painted.sheets[0].cells.B1).toMatchObject({ input: '=A1*2', ...expected });
    expect(painted.defaultFont).toBe(target.defaultFont);
    raw.defaultFont.sizePt = 0;
    expect(studioClipboardOrigin(JSON.stringify(raw), text)).toBeUndefined();
  });

  it('stores real default-font context, validates its fields and defines new-document defaults', () => {
    const document = fixture();
    document.defaultFont = { family: 'Resolved Theme Font', sizePt: 9.5, bold: true, italic: true };
    expect(isOfficeStudioDocument(document)).toBe(true);
    for (const invalid of [
      { family: '' },
      { sizePt: 0 },
      { sizePt: NaN },
      { bold: 'true' },
      { italic: undefined },
    ])
      expect(
        isOfficeStudioDocument({
          ...document,
          defaultFont: { ...document.defaultFont, ...invalid },
        })
      ).toBe(false);
    const created = createOfficeStudioDocument('excel');
    expect(created.kind).toBe('excel');
    if (created.kind !== 'excel') throw new Error('Expected Excel');
    expect(created.defaultFont).toEqual({
      family: 'Calibri',
      sizePt: 11,
      bold: false,
      italic: false,
    });
    expect(created.sheets.every((sheet) => sheet.rowHeightModes !== undefined)).toBe(true);
    expect(isOfficeStudioDocument(fixture())).toBe(true);
  });

  it('accepts complete modeled fields and rejects invalid persisted units or row modes', () => {
    const document = fixture();
    expect(isOfficeStudioDocument(document)).toBe(true);
    for (const invalid of [
      { indent: -1 },
      { indent: 1.5 },
      { indent: 251 },
      { textRotation: 91 },
      { textRotation: 0.5 },
      { shrinkToFit: 'true' },
      { align: 'invalid' },
    ]) {
      const candidate = {
        ...document,
        sheets: [
          {
            ...document.sheets[0],
            cells: {
              ...document.sheets[0].cells,
              A1: { ...document.sheets[0].cells.A1, ...invalid },
            },
          },
        ],
      };
      expect(isOfficeStudioDocument(candidate)).toBe(false);
    }
    expect(
      isOfficeStudioDocument({
        ...document,
        sheets: [{ ...document.sheets[0], rowHeightModes: { 1: 'auto', 2: 'fixed' } }],
      })
    ).toBe(true);
    expect(
      isOfficeStudioDocument({
        ...document,
        sheets: [{ ...document.sheets[0], rowHeightModes: { 1: 'invalid' } }],
      })
    ).toBe(false);
    expect(
      isOfficeStudioDocument({
        ...document,
        sheets: [{ ...document.sheets[0], rowHeightModes: { 21: 'auto' } }],
      })
    ).toBe(false);
  });

  it('applies a single format candidate to arrays without replacing values, formulas or links', () => {
    const document = fixture();
    const changed = studioSetCellTextFormat(document, 's', selection('D1', 'E2'), {
      align: 'centerContinuous',
      indent: 3,
      textRotation: 'vertical',
      shrinkToFit: true,
    });
    const sheet = changed.sheets[0];
    expect(sheet.cells.D1).toMatchObject({
      input: '=SEQUENCE(2,2)',
      array: { type: 'dynamic' },
      indent: 3,
      textRotation: 'vertical',
      shrinkToFit: true,
      align: 'centerContinuous',
    });
    expect(sheet.cells.E2.input).toBe('');
    expect(studioCalculate(changed).values.get('s:E2')).toBe(4);
    expect(sheet.hyperlinks).toBe(document.sheets[0].hyperlinks);
    expect(sheet.merges).toBe(document.sheets[0].merges);
    expect(
      studioSetCellTextFormat(changed, 's', selection('D1', 'E2'), {
        align: 'centerContinuous',
        indent: 3,
        textRotation: 'vertical',
        shrinkToFit: true,
      })
    ).toBe(changed);
  });

  it('expands real merges, normalizes interactive indent, and refuses protected/invalid batches atomically', () => {
    const document = fixture();
    const changed = studioSetCellTextFormat(
      document,
      's',
      selection('B4'),
      {
        align: 'distributed',
        indent: 2,
        textRotation: 45,
      },
      'indent'
    );
    expect(changed.sheets[0].cells.A4).toMatchObject({
      input: 'Merged text',
      align: 'left',
      indent: 2,
      textRotation: 0,
    });
    expect(changed.sheets[0].cells.B4).toMatchObject({ input: '', indent: 2 });
    expect(changed.sheets[0].merges).toEqual(['A4:B4']);
    const protectedDocument = {
      ...document,
      sheets: [{ ...document.sheets[0], protectedRanges: ['B4'] }],
    };
    const snapshot = JSON.stringify(protectedDocument);
    expect(() =>
      studioSetCellTextFormat(protectedDocument, 's', selection('A4'), {
        shrinkToFit: true,
      })
    ).toThrow('受保护');
    expect(JSON.stringify(protectedDocument)).toBe(snapshot);
    expect(() =>
      studioSetCellTextFormat(document, 's', selection('A1', 'B1'), {
        textRotation: 90.5,
      })
    ).toThrow('文字旋转');
    expect(document.sheets[0].cells.A1.textRotation).toBe(45);
  });

  it('carries new fields through authentic rich clipboard and formatting-only paste', () => {
    const document = fixture();
    const selected = selection('A1', 'B1');
    const text = studioCopyTsv(document.sheets[0], selected);
    const payload = studioCopySheetClipboard(document, 's', selected);
    const origin = studioClipboardOrigin(payload, text)!;
    expect(origin.cells![0]).toMatchObject({ indent: 2, textRotation: 45, shrinkToFit: true });
    const pasted = studioPasteCells(
      document,
      's',
      { row: 4, col: 3 },
      text,
      origin,
      'formats'
    ).document;
    expect(pasted.sheets[0].cells.C4).toMatchObject({
      input: 'keep',
      indent: 2,
      textRotation: 45,
      shrinkToFit: true,
    });
    expect(pasted.sheets[0].cells.D4).toMatchObject({
      input: '=A1+10',
      verticalAlign: 'distributed',
      indent: 0,
      textRotation: 0,
      shrinkToFit: false,
    });
    const invalid = JSON.parse(payload);
    invalid.cells[0].indent = -1;
    expect(studioClipboardOrigin(JSON.stringify(invalid), text)).toBeUndefined();
    invalid.cells[0].indent = 2;
    invalid.cells[0].shrinkToFit = 'true';
    expect(studioClipboardOrigin(JSON.stringify(invalid), text)).toBeUndefined();
  });

  it('copies new fields with the real painter and resets them without deleting formulas or links', () => {
    const document = fixture();
    const snapshot = studioCopySheetFormat(document.sheets[0], selection('A1'));
    const painted = studioPaintSheetFormat(document, 's', selection('B1'), snapshot).document;
    expect(painted.sheets[0].cells.B1).toMatchObject({
      input: '=A1*2',
      indent: 2,
      textRotation: 45,
      shrinkToFit: true,
    });
    const cleared = studioPatchCells(
      painted,
      's',
      { B1: studioDefaultCellFormat() },
      {
        preserveInput: true,
      }
    );
    expect(cleared.sheets[0].cells.B1).toMatchObject({
      input: '=A1*2',
      align: 'general',
      indent: 0,
      textRotation: 0,
      shrinkToFit: false,
    });
    expect(cleared.sheets[0].hyperlinks).toBe(document.sheets[0].hyperlinks);
    expect(studioCalculate(cleared).values.get('s:B1')).toBe(6);
  });

  it('keeps manual row modes fixed while reset and hides retain the intended identities', () => {
    const document = fixture();
    document.sheets[0].rowHeights = { 1: 44.5, 3: 30.75 };
    const manual = studioSetRowHeight(document, 's', { firstRow: 2, lastRow: 2 }, 28.1);
    expect(manual.sheets[0].rowHeightModes).toEqual({ 1: 'fixed', 2: 'fixed', 3: 'fixed' });
    const reset = studioSetRowHeight(manual, 's', { firstRow: 1, lastRow: 1 }, undefined);
    expect(reset.sheets[0].rowHeightModes).toEqual({ 1: 'auto', 2: 'fixed', 3: 'fixed' });
    expect(reset.sheets[0].rowHeights).toEqual({ 2: 28.1, 3: 30.75 });
    const hidden = studioSetRowHeight(reset, 's', { firstRow: 3, lastRow: 3 }, 0);
    expect(hidden.sheets[0].hiddenRows).toEqual([3]);
    expect(hidden.sheets[0].rowHeightModes).toBe(reset.sheets[0].rowHeightModes);
    expect(hidden.sheets[0].rowHeights![3]).toBe(30.75);
    expect(sheetRowHeightMode(hidden.sheets[0], 1)).toBe('auto');
  });

  it('can change a cached auto height to fixed without needing a numeric height change', () => {
    const document = fixture();
    document.sheets[0].rowHeights = { 1: 44.5 };
    document.sheets[0].rowHeightModes = {};
    const fixed = studioSetRowHeight(document, 's', { firstRow: 1, lastRow: 1 }, 44.5);
    expect(fixed).not.toBe(document);
    expect(fixed.sheets[0].rowHeightModes).toEqual({ 1: 'fixed' });
    expect(fixed.sheets[0].rowHeights).toEqual({ 1: 44.5 });
  });

  it('moves mode keys together with cached heights when rows are inserted or removed', () => {
    const document = fixture();
    document.sheets[0].rowHeights = { 1: 44.5, 3: 30.75 };
    document.sheets[0].rowHeightModes = { 1: 'auto', 3: 'fixed' };
    const inserted = studioChangeSheetStructure(document, 's', {
      axis: 'row',
      type: 'insert',
      index: 2,
      count: 1,
    });
    expect(inserted.sheets[0].rowHeights).toEqual({ 1: 44.5, 4: 30.75 });
    expect(inserted.sheets[0].rowHeightModes).toEqual({ 1: 'auto', 4: 'fixed' });
    const removed = studioChangeSheetStructure(inserted, 's', {
      axis: 'row',
      type: 'delete',
      index: 1,
      count: 1,
    });
    expect(removed.sheets[0].rowHeightModes).toEqual({ 3: 'fixed' });
    expect(isOfficeStudioDocument(removed)).toBe(true);
  });
});
