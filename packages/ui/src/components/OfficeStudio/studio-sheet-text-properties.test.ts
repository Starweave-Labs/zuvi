import { describe, expect, it } from 'vitest';
import {
  sheetApplyTextFormatPatch,
  sheetCellError,
  sheetEffectiveTextNumberFormat,
  sheetGeneralAlignment,
  sheetRowHeightMode,
  sheetRowStateFromNative,
  sheetTextFormatFromNative,
  sheetTextFormatIssue,
  sheetTextFormatToNativePatch,
  sheetTextFormatUpdatePlan,
  type SheetTextFormat,
} from './studio-sheet-text-properties';
import {
  studioFormatNumber,
  studioNumberFormatColor,
  studioValidateNumberFormat,
} from './studio-number-format';

describe('Excel text format properties', () => {
  it('distinguishes canonical native literal errors from error-looking strings and formula text', () => {
    expect(sheetCellError({ input: '#DIV/0!' })).toBe('#DIV/0!');
    expect(sheetCellError({ input: "'#DIV/0!" })).toBeUndefined();
    expect(sheetCellError({ input: '#DIV/0!', valueType: 'text' })).toBeUndefined();
    expect(sheetCellError({ input: '="#DIV/0!"' })).toBeUndefined();
    expect(sheetCellError({ input: '=1/0' }, '#DIV/0!')).toBe('#DIV/0!');
    expect(
      sheetGeneralAlignment('#DIV/0!', {
        error: sheetCellError({ input: '#DIV/0!' }),
      })
    ).toBe('center');
    expect(
      sheetGeneralAlignment('#DIV/0!', {
        error: sheetCellError({ input: "'#DIV/0!" }),
      })
    ).toBe('left');
  });

  it('resolves General from result types, explicit text formats and first strong direction', () => {
    expect(sheetGeneralAlignment(42)).toBe('right');
    expect(sheetGeneralAlignment('0042')).toBe('left');
    expect(sheetGeneralAlignment(false)).toBe('center');
    expect(sheetGeneralAlignment(undefined, { error: '#DIV/0!' })).toBe('center');
    expect(sheetGeneralAlignment(undefined)).toBe('left');
    expect(sheetGeneralAlignment('123 שלום')).toBe('right');
    expect(sheetGeneralAlignment('abc שלום')).toBe('left');
    expect(sheetGeneralAlignment(42, { numberFormat: '@' })).toBe('left');
  });

  it('classifies effective @ without confusing literals or a fourth text section', () => {
    const cases: Array<[string, boolean]> = [
      ['@', true],
      ['[Red]@', true],
      ['"label "@', true],
      ['0.00;[Red](0.00);"-";@', false],
      ['"@"0', false],
      ['\\@0', false],
    ];
    for (const [code, text] of cases) {
      studioValidateNumberFormat(code);
      expect(sheetEffectiveTextNumberFormat(code, 42)).toBe(text);
    }
    expect(sheetEffectiveTextNumberFormat('@;0', 3)).toBe(true);
    expect(sheetEffectiveTextNumberFormat('@;0', -3)).toBe(false);
    expect(sheetEffectiveTextNumberFormat('"unclosed', 42)).toBe(false);
    expect(studioFormatNumber('0.00;[Red](0.00);"-";@', 12.5)).toBe('12.50');
  });

  it('uses the real number-format condition and color rules unchanged', () => {
    const code = '[>10][Red]0.00;[<=10][Blue]0.0;0;@';
    studioValidateNumberFormat(code);
    expect(studioFormatNumber(code, 12.5)).toBe('12.50');
    expect(studioFormatNumber(code, 2)).toBe('2.0');
    expect(studioNumberFormatColor(code, 12.5)).toBe('#ff0000');
    expect(studioNumberFormatColor(code, 2)).toBe('#0000ff');
    expect(sheetEffectiveTextNumberFormat(code, 12.5)).toBe(false);
    expect(sheetEffectiveTextNumberFormat(code, 2)).toBe(false);
  });

  it('clears explicitly while preserving stored input, font, arrays and source link identity', () => {
    const cell = Object.freeze({
      input: '=SEQUENCE(2,1)',
      array: { type: 'dynamic' as const },
      valueType: 'number',
      indent: 3,
      textRotation: 45,
      shrinkToFit: true,
      wrap: true,
      align: 'distributed' as const,
      fontSize: 12.5,
      hyperlink: 'unchanged',
    });
    const result = sheetApplyTextFormatPatch(cell, {
      indent: null,
      textRotation: null,
      shrinkToFit: null,
      wrap: undefined,
      align: null,
    });
    expect(result).toMatchObject({
      indent: 0,
      textRotation: 0,
      shrinkToFit: false,
      align: 'general',
      wrap: true,
      fontSize: 12.5,
      input: cell.input,
      valueType: cell.valueType,
      hyperlink: cell.hyperlink,
    });
    expect(result.array).toBe(cell.array);
    expect(cell.indent).toBe(3);
  });

  it('preserves native combinations and applies interactive cleanup in one candidate', () => {
    const previous: SheetTextFormat = { align: 'distributed', indent: 2, textRotation: 45 };
    expect(sheetApplyTextFormatPatch(previous, {})).toEqual(previous);
    expect(sheetApplyTextFormatPatch(previous, { align: 'center' }, 'align').indent).toBe(0);
    expect(sheetApplyTextFormatPatch(previous, { textRotation: -45 }, 'textRotation').indent).toBe(
      0
    );
    expect(sheetApplyTextFormatPatch(previous, { indent: 3 }, 'indent')).toEqual({
      align: 'left',
      indent: 3,
      textRotation: 0,
    });
    expect(
      sheetApplyTextFormatPatch(
        { align: 'center', textRotation: 'vertical' },
        { indent: 3 },
        'indent'
      ).textRotation
    ).toBe('vertical');
  });

  it('rejects invalid or protected batches before returning any update', () => {
    const cells = { A1: { input: '=1+1', indent: 1 }, B1: { input: 'keep', indent: 2 } };
    const snapshot = JSON.stringify(cells);
    expect(() =>
      sheetTextFormatUpdatePlan(
        ['A1', 'B1'],
        cells,
        { indent: 3 },
        {
          canFormat: (address) => address !== 'B1',
        }
      )
    ).toThrow('no updates committed');
    expect(() => sheetTextFormatUpdatePlan(['A1'], cells, { input: 'forbidden' } as never)).toThrow(
      'Non-format'
    );
    expect(JSON.stringify(cells)).toBe(snapshot);
    expect(sheetTextFormatUpdatePlan(['A1', 'A1', 'B1'], cells, { indent: 0 })).toEqual({
      A1: { indent: 0 },
      B1: { indent: 0 },
    });
    expect(() => sheetTextFormatUpdatePlan(['A10001'], cells, {})).toThrow('rejected');
    expect(() => sheetTextFormatUpdatePlan(['IW1'], cells, {})).toThrow('rejected');
  });

  it('validates angle, Boolean, indent and font fields without coercion', () => {
    for (const invalid of [
      { shrinkToFit: 1 },
      { wrap: 'true' },
      { indent: -1 },
      { indent: 1.5 },
      { indent: 251 },
      { textRotation: 91 },
      { textRotation: -91 },
      { textRotation: 0.5 },
      { textRotation: NaN },
      { fontSize: 0 },
      { fontFamily: 'bad\u0000font' },
      { align: 'unknown' },
    ])
      expect(sheetTextFormatIssue(invalid as never)).toBeTruthy();
    for (const valid of [
      { indent: 0 },
      { indent: 250 },
      { textRotation: 90 },
      { textRotation: -90 },
      { textRotation: 'vertical' as const },
      { fontSize: 12.5 },
      { shrinkToFit: false },
    ])
      expect(sheetTextFormatIssue(valid)).toBeUndefined();
  });

  it('converts native alignment and clear values while leaving fonts outside the patch', () => {
    expect(
      sheetTextFormatFromNative({
        horizontal: 'centerContinuous',
        vertical: 'center',
        indent: '0',
        textRotation: '135',
        wrapText: '1',
        shrinkToFit: '1',
      })
    ).toEqual({
      align: 'centerContinuous',
      verticalAlign: 'middle',
      indent: 0,
      textRotation: -45,
      wrap: true,
      shrinkToFit: true,
    });
    expect(sheetTextFormatFromNative({ textRotation: '255' }).textRotation).toBe('vertical');
    expect(
      sheetTextFormatToNativePatch({
        align: 'general',
        textRotation: 0,
        indent: 0,
        wrap: false,
        shrinkToFit: false,
      })
    ).toEqual({
      horizontal: null,
      textRotation: '0',
      indent: '0',
      wrapText: '0',
      shrinkToFit: '0',
    });
    expect(sheetTextFormatToNativePatch({ textRotation: -90 }).textRotation).toBe('180');
    expect(() => sheetTextFormatFromNative({ textRotation: '-45' })).toThrow('rotation');
    expect(() => sheetTextFormatFromNative({ textRotation: '181' })).toThrow('rotation');
  });

  it('keeps native row mode separate from cached height and hidden zero', () => {
    expect(sheetRowStateFromNative({ ht: '44.5', customHeight: '0' })).toEqual({
      mode: 'auto',
      heightPt: 44.5,
      hidden: false,
    });
    expect(sheetRowStateFromNative({ ht: '30.75', customHeight: '1' })).toEqual({
      mode: 'fixed',
      heightPt: 30.75,
      hidden: false,
    });
    expect(sheetRowStateFromNative({ ht: '44.5' }).mode).toBe('auto');
    expect(sheetRowStateFromNative({ ht: '0' })).toEqual({ mode: 'auto', hidden: true });
    expect(() => sheetRowStateFromNative({ ht: 'Infinity' })).toThrow('height');
    expect(() => sheetRowStateFromNative({ customHeight: '2' })).toThrow('Boolean');
  });

  it('interprets defined empty mode maps as auto and missing maps as legacy fixed', () => {
    expect(sheetRowHeightMode({ rowHeights: { 1: 44.5 } }, 1)).toBe('fixed');
    expect(sheetRowHeightMode({ rowHeights: { 1: 44.5 }, rowHeightModes: {} }, 1)).toBe('auto');
    expect(sheetRowHeightMode({ rowHeights: { 1: 44.5 }, rowHeightModes: { 1: 'auto' } }, 1)).toBe(
      'auto'
    );
    expect(sheetRowHeightMode({ rowHeightModes: { 1: 'fixed' } }, 1)).toBe('fixed');
    expect(sheetRowHeightMode({}, 1)).toBe('auto');
  });
});
