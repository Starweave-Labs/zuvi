import { describe, expect, it } from 'vitest';
import {
  studioFormatNumber,
  studioNumberFormatColor,
  studioNumberFormatWithLocale,
  studioValidateNumberFormat,
} from './studio-number-format';
import { studioSetNumberFormat } from './studio-sheet-editing';
import {
  studioCalculate,
  studioDisplayCell,
  studioFilteredRows,
  studioParseAddress,
  studioPatchCells,
  studioCopySheetClipboard,
  studioClipboardOrigin,
  studioPasteCells,
} from './studio-sheet-model';
import type { StudioExcelDocument } from './studio-types';

const selection = (a: string, b = a) => ({
  anchor: studioParseAddress(a)!,
  focus: studioParseAddress(b)!,
});
describe('custom Excel number formats', () => {
  it('retains numeric, boolean and text constants when changing to or from text formatting, copying, and then editing', () => {
    const doc: StudioExcelDocument = {
      version: 1,
      id: 'typed',
      name: 'typed.xlsx',
      kind: 'excel',
      activeSheetId: 's',
      sheets: [
        {
          id: 's',
          name: 'Data',
          rowCount: 8,
          columnCount: 8,
          cells: {
            A1: { input: '42' },
            A2: { input: 'FALSE' },
            A3: { input: '42', numberFormat: '@' },
            B1: { input: '=ISNUMBER(A1)' },
            B2: { input: '=ISTEXT(A3)' },
          },
        },
      ],
    };
    let next = studioSetNumberFormat(doc, 's', selection('A1', 'A2'), '@');
    next = studioSetNumberFormat(next, 's', selection('A3'), '0.00');
    expect(next.sheets[0].cells.A1).toEqual({
      input: '42',
      numberFormat: '@',
      valueType: 'number',
    });
    expect(next.sheets[0].cells.A2).toEqual({
      input: 'FALSE',
      numberFormat: '@',
      valueType: 'boolean',
    });
    expect(next.sheets[0].cells.A3).toEqual({
      input: '42',
      numberFormat: '0.00',
      valueType: 'text',
    });
    const calculation = studioCalculate(next);
    calculation.read('s', 'A2');
    const values = calculation.values;
    expect(values.get('s:A1')).toBe(42);
    expect(values.get('s:A2')).toBe(false);
    expect(values.get('s:A3')).toBe('42');
    expect(values.get('s:B1')).toBe(true);
    expect(values.get('s:B2')).toBe(true);
    const origin = studioClipboardOrigin(
      studioCopySheetClipboard(next, 's', selection('A1')),
      '42'
    )!;
    next = studioPasteCells(next, 's', { row: 1, col: 3 }, '42', origin, 'all').document;
    expect(studioCalculate(next).read('s', 'C1').value).toBe(42);
    next = studioPatchCells(next, 's', { A1: { input: '17' } });
    expect(next.sheets[0].cells.A1.valueType).toBeUndefined();
    expect(studioCalculate(next).read('s', 'A1').value).toBe('17');
  });
  it('formats decimal, percentage, scientific, fractions, hidden sections, literal Unicode and text without changing raw data', () => {
    const code = '#,##0.00;[Red](#,##0.00);"零";"文本："@';
    expect(studioValidateNumberFormat(code)).toBe(code);
    expect([1234.56, -1234.56, 0, 'abc'].map((v) => studioFormatNumber(code, v))).toEqual([
      '1,234.56',
      '(1,234.56)',
      '零',
      '文本：abc',
    ]);
    expect(studioFormatNumber('¥#,##0.00', 12.5)).toBe('¥12.50');
    expect(studioFormatNumber('0.0%', 0.125)).toBe('12.5%');
    expect(studioFormatNumber('0.00E+00', 12345)).toBe('1.23E+04');
    expect(studioFormatNumber('# ?/?', 1.5)).toBe('1 1/2');
    expect(studioFormatNumber(';;;', 12)).toBe('');
    expect(studioFormatNumber('0.0;[Red]-0.0', -1.25)).toBe('-1.3');
    expect(studioFormatNumber('0"@";[Red](0"@")', -12)).toBe('(12@)');
    expect(studioNumberFormatColor('[Blue]0"@";[Red](0"@")', -12)).toBe('#ff0000');
    expect(studioDisplayCell({ input: '=1/0', numberFormat: code }, 0, '#DIV/0!')).toBe('#DIV/0!');
    expect(studioDisplayCell({ input: 'TRUE', numberFormat: code }, true)).toBe('TRUE');
  });
  it('uses matching color sections and conditional fallbacks, with no color for errors or blank text', () => {
    const code = '[Blue][>=100]0;[Red][<0](0);[Green]0;[Magenta]@';
    expect([100, -5, 0, 5, 'abc'].map((v) => studioNumberFormatColor(code, v))).toEqual([
      '#0000ff',
      '#ff0000',
      '#00ff00',
      '#00ff00',
      '#ff00ff',
    ]);
    expect(studioNumberFormatColor('[Red][>10]0;[Blue]0', 5)).toBe('#0000ff');
    expect(studioNumberFormatColor('[Red]0;[Blue]0;[Green]0', 0)).toBe('#00ff00');
    expect(studioNumberFormatColor('[Red]0', -1)).toBe('#ff0000');
    expect(studioNumberFormatColor('[Red]@', 1)).toBeUndefined();
    for (const value of ['', true, false])
      expect(studioNumberFormatColor('[Red]0', value)).toBeUndefined();
    expect(studioNumberFormatColor('[Red]0', 1, '#VALUE!')).toBeUndefined();
  });
  it('persists region codes, translates Chinese date names and keeps minutes and quoted AM text intact', () => {
    const code = '[$-0804]dddd, mmmm d, yyyy hh:mm:ss AM/PM "AM"';
    expect(studioValidateNumberFormat(code)).toBe(code);
    expect(studioFormatNumber(code, 45351.75)).toBe('星期四, 2月 29, 2024 06:00:00 下午 AM');
    expect(studioFormatNumber(code, 45351.25)).toBe('星期四, 2月 29, 2024 06:00:00 上午 AM');
    expect(studioFormatNumber('[$-0409]dddd, mmmm d, yyyy', 45351.75)).toBe(
      'Thursday, February 29, 2024'
    );
    expect(studioFormatNumber('[h]:mm:ss', 1.5)).toBe('36:00:00');
    expect(studioNumberFormatWithLocale('[$$-409]0.00;"[$-409]"@', 'zh-CN')).toBe(
      '[$$-0804]0.00;[$-0804]"[$-409]"@'
    );
    expect(studioFormatNumber('[$$-0804]0.00', 2)).toBe('$2.00');
    expect(studioNumberFormatWithLocale('0;;', 'en-US')).toBe('[$-0409]0;;');
  });
  it('rejects invalid drafts including inactive sections and conditions outside the numeric sections', () => {
    for (const code of [
      '',
      'garbage',
      '0;0;0;@;@',
      '0;"unclosed',
      '0\\',
      '[Bogus]0',
      '[>0][<5]0',
      '0;0;[>0]0',
      '[$-0411]0',
      '0\n',
      '0'.repeat(256),
      '0;0;0;garbage',
      '0;[>0]@',
      '[>0]@',
      '0\u007f',
    ])
      expect(() => studioValidateNumberFormat(code), code).toThrow();
    for (const code of [
      'General',
      '0.000',
      '0.00;[Red](0.00);"zero";"text:"@',
      'yyyy-mm-dd',
      '[h]:mm:ss',
      '# ?/?',
      ';;;',
      '0"米"',
      '0\\m',
      '0_);(0)',
      '0.00E+00',
    ])
      expect(studioValidateNumberFormat(code)).toBe(code);
  });
  it('changes a merged selection atomically, preserves formulas and arrays, and filters by the visible format color', () => {
    const doc: StudioExcelDocument = {
      version: 1,
      id: 'format',
      name: 'format.xlsx',
      kind: 'excel',
      activeSheetId: 's',
      sheets: [
        {
          id: 's',
          name: 'Data',
          rowCount: 10,
          columnCount: 8,
          cells: {
            A1: { input: 'header' },
            A2: { input: '-2', color: '#0000ff' },
            A3: { input: '3' },
            B1: { input: '=SEQUENCE(2,2)', array: { type: 'dynamic' } },
            E1: { input: "'0042" },
            F1: { input: '=1+2' },
          },
          merges: ['E1:F1'],
        },
      ],
    };
    const merged = studioSetNumberFormat(doc, 's', selection('F1'), '"ID "@');
    expect(merged.sheets[0].cells.E1).toEqual({ input: "'0042", numberFormat: '"ID "@' });
    expect(merged.sheets[0].cells.F1.input).toBe('=1+2');
    const next = studioSetNumberFormat(doc, 's', selection('A2', 'C3'), '0;[Red](0)');
    expect(doc.sheets[0].cells.A2.numberFormat).toBeUndefined();
    expect(next.sheets[0].cells.B1.array).toEqual({ type: 'dynamic' });
    expect(studioCalculate(next).values.get('s:C2')).toBe(4);
    const sheet = {
      ...next.sheets[0],
      filter: {
        range: 'A1:A3',
        columns: { A: { operator: 'fontColor' as const, value: '#ff0000' } },
      },
    };
    expect([...studioFilteredRows(sheet, studioCalculate(next))]).toEqual([3]);
    sheet.conditionalFormats = [
      {
        id: 'cf',
        type: 'cellIs',
        range: 'A2',
        priority: 1,
        operator: 'lessThan',
        formulae: ['0'],
        style: { color: '#00ff00' },
      },
    ];
    expect([...studioFilteredRows(sheet, studioCalculate(next))]).toEqual([2, 3]);
    sheet.conditionalFormats[0].style = { numberFormat: '[Red]0.0' };
    expect([...studioFilteredRows(sheet, studioCalculate(next))]).toEqual([3]);
    const protectedDoc = { ...doc, sheets: [{ ...doc.sheets[0], protectedRanges: ['A3:A3'] }] };
    expect(() => studioSetNumberFormat(protectedDoc, 's', selection('A2', 'A3'), '0.0')).toThrow();
    expect(protectedDoc.sheets[0].cells.A2.numberFormat).toBeUndefined();
  });
});
