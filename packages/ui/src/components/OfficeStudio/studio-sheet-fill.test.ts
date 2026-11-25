import { describe, expect, it } from 'vitest';
import { studioFillCells, studioFillSeries, studioFillSeriesResult } from './studio-sheet-fill';
import {
  STUDIO_SHEET_LIMITS,
  studioCellAddress,
  studioInputValue,
  studioCalculate,
  studioParseAddress,
  type SheetSelection,
} from './studio-sheet-model';
import type { StudioCell, StudioExcelDocument } from './studio-types';

function fixture(cells: Record<string, StudioCell> = {}): StudioExcelDocument {
  return {
    version: 1,
    id: 'book',
    name: '填充.xlsx',
    kind: 'excel',
    activeSheetId: 'main',
    sheets: [
      { id: 'main', name: 'Sheet1', rowCount: 100, columnCount: 26, cells },
      {
        id: 'other',
        name: "预算 O'Brien",
        rowCount: 100,
        columnCount: 26,
        cells: { A1: { input: '10', bold: true } },
      },
    ],
  };
}

function selection(anchor: string, focus: string): SheetSelection {
  return { anchor: studioParseAddress(anchor)!, focus: studioParseAddress(focus)! };
}

function inputs(document: StudioExcelDocument, addresses: string[]): string[] {
  return addresses.map((address) => document.sheets[0].cells[address].input);
}

describe('Series stop boundaries', () => {
  it('includes decimal endpoints, stops before overshoot and preserves every tail cell and link', () => {
    const original = fixture({
      A1: { input: '0.1', bold: true, numberFormat: '0.0' },
      A5: { input: 'tail', italic: true, background: '#ff0000' },
    });
    original.sheets[0].hyperlinks = [
      { id: 'tail-link', ref: 'A5', target: 'https://example.com/tail' },
    ];
    const tail = original.sheets[0].cells.A5;
    const result = studioFillSeriesResult(original, 'main', selection('A1', 'A6'), {
      direction: 'down',
      type: 'number',
      step: 0.1,
      stopValue: '0.3',
    });
    expect(result.addresses).toEqual(['A2', 'A3']);
    expect(inputs(result.document, ['A1', 'A2', 'A3', 'A5'])).toEqual([
      '0.1',
      '0.2',
      '0.3',
      'tail',
    ]);
    expect(result.document.sheets[0].cells.A4).toBeUndefined();
    expect(result.document.sheets[0].cells.A5).toBe(tail);
    expect(result.document.sheets[0].hyperlinks).toEqual(original.sheets[0].hyperlinks);
    expect(result.document.sheets[0].cells.A3.bold).toBe(true);
    const overshoot = studioFillSeries(original, 'main', selection('A1', 'A6'), {
      direction: 'down',
      type: 'number',
      step: 0.1,
      stopValue: 0.25,
    });
    expect(overshoot.sheets[0].cells.A2.input).toBe('0.2');
    expect(overshoot.sheets[0].cells.A3).toBeUndefined();
  });
  it('uses each track step independently and stops descending rightward sequences at an inclusive endpoint', () => {
    const original = fixture({
      A1: { input: '10' },
      B1: { input: '7' },
      E1: { input: 'tail' },
      A2: { input: '4' },
      B2: { input: '2' },
      E2: { input: 'tail2' },
    });
    const result = studioFillSeriesResult(original, 'main', selection('F2', 'A1'), {
      direction: 'right',
      type: 'number',
      seedCount: 2,
      stopValue: -2,
    });
    expect(inputs(result.document, ['A1', 'B1', 'C1', 'D1', 'E1', 'C2', 'D2', 'E2'])).toEqual([
      '10',
      '7',
      '4',
      '1',
      '-2',
      '0',
      '-2',
      'tail2',
    ]);
    expect(result.document.sheets[0].cells.F1).toBeUndefined();
    expect(result.addresses).toEqual(['C1', 'D1', 'E1', 'C2', 'D2']);
  });
  it('stops ISO and native serial dates with ISO or serial boundaries across the leap day', () => {
    const iso = fixture({ A1: { input: '2024-02-28' }, A5: { input: 'tail' } });
    const result = studioFillSeries(iso, 'main', selection('A1', 'A5'), {
      direction: 'down',
      type: 'date',
      stopValue: '2024-03-01',
    });
    expect(inputs(result, ['A2', 'A3', 'A5'])).toEqual(['2024-02-29', '2024-03-01', 'tail']);
    expect(result.sheets[0].cells.A4).toBeUndefined();
    expect(
      studioFillSeries(iso, 'main', selection('A1', 'A5'), {
        direction: 'down',
        type: 'date',
        stopValue: 45352,
      })
    ).toEqual(result);
    const serial = fixture({ A1: { input: '45350.5', numberFormat: 'yyyy-mm-dd hh:mm' } });
    const serialResult = studioFillSeries(serial, 'main', selection('A1', 'A5'), {
      direction: 'down',
      type: 'date',
      stopValue: '2024-03-01',
    });
    expect(serialResult.sheets[0].cells.A2.input).toBe('45351.5');
    expect(serialResult.sheets[0].cells.A3).toBeUndefined();
    expect(serialResult.sheets[0].cells.A2.numberFormat).toBe('yyyy-mm-dd hh:mm');
  });
  it('accepts label and numeric suffix stops while keeping padded identifiers as text', () => {
    const original = fixture({
      A1: { input: '订单008' },
      A2: { input: '订单010', bold: true },
      A5: { input: 'tail' },
    });
    for (const stopValue of ['订单014', '14', 14, '1.4e1']) {
      const result = studioFillSeries(original, 'main', selection('A1', 'A6'), {
        direction: 'down',
        type: 'text',
        seedCount: 2,
        stopValue,
      });
      expect(inputs(result, ['A3', 'A4', 'A5'])).toEqual(['订单012', '订单014', 'tail']);
      expect(result.sheets[0].cells.A6).toBeUndefined();
    }
    const padded = studioFillSeries(
      fixture({ A1: { input: '099' } }),
      'main',
      selection('A1', 'A5'),
      {
        direction: 'down',
        type: 'text',
        stopValue: 101,
      }
    );
    expect(inputs(padded, ['A2', 'A3'])).toEqual(['100', '101']);
    expect(padded.sheets[0].cells.A3.numberFormat).toBe('@');
    expect(padded.sheets[0].cells.A4).toBeUndefined();
    expect(
      studioFillSeries(fixture({ A1: { input: '  项目001' } }), 'main', selection('A1', 'A5'), {
        direction: 'down',
        type: 'text',
        stopValue: '  项目003 ',
      }).sheets[0].cells.A3.input
    ).toBe('  项目003');
  });

  it('allows merged tail cells but rejects a merge intersecting retained seeds or actual destinations', () => {
    const original = fixture({ A1: { input: '1' }, A5: { input: 'merged tail' } });
    original.sheets[0].merges = ['A5:B5'];
    const result = studioFillSeries(original, 'main', selection('A1', 'A6'), {
      direction: 'down',
      type: 'number',
      stopValue: 3,
    });
    expect(result.sheets[0].cells.A3.input).toBe('3');
    expect(result.sheets[0].cells.A5).toBe(original.sheets[0].cells.A5);
    expect(result.sheets[0].merges).toBe(original.sheets[0].merges);
    expect(() =>
      studioFillSeries(original, 'main', selection('A1', 'A6'), {
        direction: 'down',
        type: 'number',
        stopValue: 5,
      })
    ).toThrow('合并单元格');
    original.sheets[0].merges = ['A1:B1'];
    expect(() =>
      studioFillSeries(original, 'main', selection('A1', 'A6'), {
        direction: 'down',
        type: 'number',
        stopValue: 3,
      })
    ).toThrow('合并单元格');
    expect(original.sheets[0].cells.A2).toBeUndefined();
  });
  it('leaves already reached boundaries unchanged and avoids generating values past the date domain', () => {
    const original = fixture({ A1: { input: '9999-12-31' }, A2: { input: 'tail' } });
    expect(
      studioFillSeriesResult(original, 'main', selection('A1', 'A2'), {
        direction: 'down',
        type: 'date',
        stopValue: '9999-12-31',
      })
    ).toEqual({ document: original, addresses: [] });
    const numeric = fixture({ A1: { input: '10' } });
    expect(
      studioFillSeries(numeric, 'main', selection('A1', 'A4'), {
        direction: 'down',
        type: 'number',
        stopValue: 5,
      })
    ).toBe(numeric);
    const nearEnd = fixture({ A1: { input: '9999-12-30' } });
    expect(
      studioFillSeries(nearEnd, 'main', selection('A1', 'A4'), {
        direction: 'down',
        type: 'date',
        step: 2,
        stopValue: '9999-12-31',
      })
    ).toBe(nearEnd);
  });
  it('rejects invalid stops, zero steps and late track errors without changing the original document', () => {
    const original = fixture({ A1: { input: '1' } });
    const before = JSON.stringify(original);
    for (const stopValue of ['', '0x10', 'NaN', Infinity])
      expect(() =>
        studioFillSeries(original, 'main', selection('A1', 'A3'), {
          direction: 'down',
          type: 'number',
          stopValue,
        })
      ).toThrow('停止值');
    expect(() =>
      studioFillSeries(original, 'main', selection('A1', 'A3'), {
        direction: 'down',
        type: 'number',
        step: 0,
        stopValue: 3,
      })
    ).toThrow('不能为 0');
    expect(JSON.stringify(original)).toBe(before);
    const dates = fixture({ A1: { input: '2024-02-28' } });
    expect(() =>
      studioFillSeries(dates, 'main', selection('A1', 'A3'), {
        direction: 'down',
        type: 'date',
        stopValue: '2024-02-30',
      })
    ).toThrow('日期');
    expect(() =>
      studioFillSeries(dates, 'main', selection('A1', 'A3'), {
        direction: 'down',
        type: 'date',
        stopValue: 60,
      })
    ).toThrow('虚构日期');
    const labels = fixture({ A1: { input: '订单001' }, B1: { input: '其他001' } });
    const labelsBefore = JSON.stringify(labels);
    expect(() =>
      studioFillSeries(labels, 'main', selection('A1', 'B4'), {
        direction: 'down',
        type: 'text',
        stopValue: '订单004',
      })
    ).toThrow('前缀');
    expect(JSON.stringify(labels)).toBe(labelsBefore);
  });
  it('leaves protected, validated and array tail cells untouched but rejects real destination conflicts atomically', () => {
    const original = fixture({
      A1: { input: '1' },
      A5: { input: '=SEQUENCE(2)', array: { type: 'dynamic' } },
    });
    original.sheets[0].protectedRanges = ['A4'];
    original.sheets[0].dataValidations = [
      { id: 'v', range: 'A4', type: 'whole', operator: 'lessThan', formula1: '0' },
    ];
    const result = studioFillSeriesResult(original, 'main', selection('A1', 'A8'), {
      direction: 'down',
      type: 'number',
      stopValue: 3,
    });
    expect(result.addresses).toEqual(['A2', 'A3']);
    expect(result.document.sheets[0].cells.A5).toBe(original.sheets[0].cells.A5);
    expect(studioCalculate(result.document).values.get('main:A6')).toBe(2);
    expect(() =>
      studioFillSeries(original, 'main', selection('A1', 'A8'), {
        direction: 'down',
        type: 'number',
        stopValue: 6,
      })
    ).toThrow('受保护');
    expect(original.sheets[0].cells.A2).toBeUndefined();
  });
});

describe('Office Studio fill cells', () => {
  it('copies the top row of a reversed rectangle and replaces all direct target formatting', () => {
    const first: StudioCell = {
      input: '名称',
      bold: true,
      background: '#ddeeff',
      wrap: true,
      fontFamily: '新宋体',
      fontSize: 11.5,
    };
    const second: StudioCell = { input: '0.25', numberFormat: '0.0%', align: 'right' };
    const original = fixture({
      A2: first,
      B2: second,
      A3: { input: '旧值', italic: true, color: '#ff0000', underline: true },
      B3: { input: '9', background: '#000000', bold: true },
    });
    const before = JSON.stringify(original);
    const result = studioFillCells(original, 'main', selection('B4', 'A2'), 'down');
    expect(result.sheets[0].cells.A3).toEqual(first);
    expect(result.sheets[0].cells.A4).toEqual(first);
    expect(result.sheets[0].cells.B3).toEqual(second);
    expect(result.sheets[0].cells.B4).toEqual(second);
    expect(result.sheets[0].cells.A2).toBe(first);
    expect(result.sheets[0].cells.A3).not.toBe(first);
    expect(result.sheets[1]).toBe(original.sheets[1]);
    expect(JSON.stringify(original)).toBe(before);
  });

  it('moves relative and cross-sheet references right while keeping absolute references and strings', () => {
    const original = fixture({
      B2: {
        input: "=IF(A2>0,\"A2\",$A2+B$1+$B$2+'预算 O''Brien'!A2)",
        color: '#112233',
      },
      B3: { input: '文本', italic: true },
      C2: { input: '旧值', background: '#ff0000' },
    });
    const result = studioFillCells(original, 'main', selection('D3', 'B2'), 'right');
    expect(result.sheets[0].cells.C2).toEqual({
      input: "=IF(B2>0,\"A2\",$A2+C$1+$B$2+'预算 O''Brien'!B2)",
      color: '#112233',
    });
    expect(result.sheets[0].cells.D2.input).toBe(
      "=IF(C2>0,\"A2\",$A2+D$1+$B$2+'预算 O''Brien'!C2)"
    );
    expect(result.sheets[0].cells.C3).toEqual(original.sheets[0].cells.B3);
    expect(result.sheets[0].cells.D3).toEqual(original.sheets[0].cells.B3);
  });

  it('moves row references and both endpoints of ranges from the original formula', () => {
    const original = fixture({
      A1: { input: '=SUM(B1:C1)+Sheet1!$A1+$B$1+D$1' },
    });
    const result = studioFillCells(original, 'main', selection('A1', 'A3'), 'down');
    expect(inputs(result, ['A2', 'A3'])).toEqual([
      '=SUM(B2:C2)+Sheet1!$A2+$B$1+D$1',
      '=SUM(B3:C3)+Sheet1!$A3+$B$1+D$1',
    ]);
  });

  it('copies an absent seed as an explicit blank and clears all previous direct styles', () => {
    const original = fixture({
      A2: { input: '旧值', bold: true, numberFormat: '0.00', fontFamily: 'Calibri', fontSize: 14 },
    });
    const result = studioFillCells(original, 'main', selection('A1', 'A3'), 'down');
    expect(result.sheets[0].cells.A1).toBeUndefined();
    expect(result.sheets[0].cells.A2).toEqual({ input: '' });
    expect(result.sheets[0].cells.A3).toEqual({ input: '' });
    expect(original.sheets[0].cells.A2.input).toBe('旧值');
  });

  it('keeps the target conditional formatting and validation ranges in place', () => {
    const original = fixture({ A1: { input: 'yes', bold: true } });
    original.sheets[0].conditionalFormats = [
      {
        id: 'color',
        range: 'A2:A3',
        priority: 1,
        type: 'containsText',
        text: 'yes',
        style: { background: '#00ff00' },
      },
    ];
    original.sheets[0].dataValidations = [
      { id: 'choices', range: 'A2:A3', type: 'list', values: ['yes', 'no'] },
    ];
    const result = studioFillCells(original, 'main', selection('A1', 'A3'), 'down');
    expect(result.sheets[0].conditionalFormats).toBe(original.sheets[0].conditionalFormats);
    expect(result.sheets[0].dataValidations).toBe(original.sheets[0].dataValidations);
    expect(result.sheets[0].cells.A2).toEqual({ input: 'yes', bold: true });
  });

  it('returns the original document when the rectangle has no target row or column', () => {
    const original = fixture({ A1: { input: '1' }, A2: { input: '2' } });
    expect(studioFillCells(original, 'main', selection('A1', 'B1'), 'down')).toBe(original);
    expect(studioFillCells(original, 'main', selection('A1', 'A2'), 'right')).toBe(original);
  });

  it('cancels all tracks when any copied formula cannot safely move', () => {
    const original = fixture({
      A1: { input: 'safe' },
      B1: { input: '=SUM(A:A)' },
      A2: { input: 'old' },
    });
    const before = JSON.stringify(original);
    expect(() => studioFillCells(original, 'main', selection('A1', 'B2'), 'down')).toThrow(
      '不能安全移动'
    );
    expect(JSON.stringify(original)).toBe(before);
    original.sheets[0].cells.B1.input = '=A1048576';
    expect(() => studioFillCells(original, 'main', selection('A1', 'B2'), 'down')).toThrow(
      '超出工作表'
    );
    expect(original.sheets[0].cells.A2.input).toBe('old');
  });
});

describe('Office Studio fill series', () => {
  it('continues two numeric seeds and repeats their direct style pattern without altering them', () => {
    const first: StudioCell = {
      input: '2',
      bold: true,
      background: '#112233',
      fontFamily: 'Calibri',
      fontSize: 11,
    };
    const second: StudioCell = {
      input: '5',
      italic: true,
      numberFormat: '0.00',
      fontFamily: '新宋体',
      fontSize: 12.5,
    };
    const original = fixture({
      A1: first,
      A2: second,
      A3: { input: 'old', underline: true, color: '#ff0000' },
    });
    const result = studioFillSeries(original, 'main', selection('A5', 'A1'), {
      direction: 'down',
      type: 'number',
      seedCount: 2,
    });
    expect(inputs(result, ['A1', 'A2', 'A3', 'A4', 'A5'])).toEqual(['2', '5', '8', '11', '14']);
    expect(result.sheets[0].cells.A1).toBe(first);
    expect(result.sheets[0].cells.A2).toBe(second);
    expect(result.sheets[0].cells.A3).toEqual({ ...first, input: '8' });
    expect(result.sheets[0].cells.A4).toEqual({ ...second, input: '11' });
    expect(original.sheets[0].cells.A3.input).toBe('old');
  });

  it('infers a separate step for each row of a rightward series', () => {
    const original = fixture({
      A1: { input: '10' },
      B1: { input: '15' },
      A2: { input: '-2', wrap: true },
      B2: { input: '-4', wrap: true },
    });
    const result = studioFillSeries(original, 'main', selection('D2', 'A1'), {
      direction: 'right',
      type: 'number',
      seedCount: 2,
    });
    expect(inputs(result, ['C1', 'D1', 'C2', 'D2'])).toEqual(['20', '25', '-6', '-8']);
    expect(result.sheets[0].cells.C2.wrap).toBe(true);
  });

  it('uses the default step or an explicit step from the last retained seed', () => {
    const original = fixture({ A1: { input: '2' }, A2: { input: '7' } });
    const automatic = studioFillSeries(original, 'main', selection('A1', 'A3'), {
      direction: 'down',
      type: 'number',
    });
    expect(inputs(automatic, ['A1', 'A2', 'A3'])).toEqual(['2', '3', '4']);
    const manual = studioFillSeries(original, 'main', selection('A1', 'A4'), {
      direction: 'down',
      type: 'number',
      seedCount: 2,
      step: -2,
    });
    expect(inputs(manual, ['A1', 'A2', 'A3', 'A4'])).toEqual(['2', '7', '5', '3']);
  });

  it('avoids binary rounding tails for entered decimal seeds and decimal steps', () => {
    const original = fixture({ A1: { input: '0.1' }, A2: { input: '0.3' } });
    const inferred = studioFillSeries(original, 'main', selection('A1', 'A4'), {
      direction: 'down',
      type: 'number',
      seedCount: 2,
    });
    expect(inputs(inferred, ['A3', 'A4'])).toEqual(['0.5', '0.7']);
    const explicit = studioFillSeries(original, 'main', selection('A1', 'A4'), {
      direction: 'down',
      type: 'number',
      step: 0.1,
    });
    expect(inputs(explicit, ['A2', 'A3', 'A4'])).toEqual(['0.2', '0.3', '0.4']);
  });

  it('crosses leap days, month ends and year ends with UTC calendar dates', () => {
    const leap = studioFillSeries(
      fixture({ A1: { input: '2024-02-28' } }),
      'main',
      selection('A1', 'A4'),
      {
        direction: 'down',
        type: 'date',
      }
    );
    expect(inputs(leap, ['A2', 'A3', 'A4'])).toEqual(['2024-02-29', '2024-03-01', '2024-03-02']);
    const year = studioFillSeries(
      fixture({ A1: { input: '2023-12-31' } }),
      'main',
      selection('A1', 'A3'),
      {
        direction: 'down',
        type: 'date',
      }
    );
    expect(inputs(year, ['A2', 'A3'])).toEqual(['2024-01-01', '2024-01-02']);
  });

  it('infers multi-day intervals from ISO seeds and retains serial date fractions and formatting', () => {
    const original = fixture({
      A1: { input: '2024-02-27' },
      A2: { input: '2024-02-29' },
      B1: { input: '45350.5', numberFormat: 'yyyy-mm-dd hh:mm' },
      B2: { input: '45352.5', numberFormat: 'yyyy-mm-dd hh:mm' },
    });
    const result = studioFillSeries(original, 'main', selection('A1', 'B4'), {
      direction: 'down',
      type: 'date',
      seedCount: 2,
    });
    expect(inputs(result, ['A3', 'A4', 'B3', 'B4'])).toEqual([
      '2024-03-02',
      '2024-03-04',
      '45354.5',
      '45356.5',
    ]);
    expect(result.sheets[0].cells.B3.numberFormat).toBe('yyyy-mm-dd hh:mm');
  });

  it('keeps leading zeroes and a shared prefix while inferring a text suffix interval', () => {
    const original = fixture({ A1: { input: '订单008' }, A2: { input: '订单010', bold: true } });
    const result = studioFillSeries(original, 'main', selection('A1', 'A4'), {
      direction: 'down',
      type: 'text',
      seedCount: 2,
    });
    expect(inputs(result, ['A1', 'A2', 'A3', 'A4'])).toEqual([
      '订单008',
      '订单010',
      '订单012',
      '订单014',
    ]);
    expect(result.sheets[0].cells.A4.bold).toBe(true);
  });

  it('retains purely numeric identifiers as text even when 099 advances to 100', () => {
    const original = fixture({ A1: { input: '098', color: '#112233' } });
    const result = studioFillSeries(original, 'main', selection('A1', 'A4'), {
      direction: 'down',
      type: 'text',
    });
    expect(inputs(result, ['A1', 'A2', 'A3', 'A4'])).toEqual(['098', '099', '100', '101']);
    for (const address of ['A2', 'A3', 'A4']) {
      const cell = result.sheets[0].cells[address];
      expect(typeof studioInputValue(cell.input, cell.numberFormat)).toBe('string');
      expect(cell.color).toBe('#112233');
    }
    expect(result.sheets[0].cells.A3.numberFormat).toBe('@');
    expect(original.sheets[0].cells.A1.numberFormat).toBeUndefined();
  });

  it('keeps explicit text quotes and allows a descending nonnegative suffix sequence', () => {
    const original = fixture({ A1: { input: "'003", numberFormat: '@' } });
    const result = studioFillSeries(original, 'main', selection('A1', 'D1'), {
      direction: 'right',
      type: 'text',
      step: -1,
    });
    expect(inputs(result, ['A1', 'B1', 'C1', 'D1'])).toEqual(["'003", "'002", "'001", "'000"]);
  });

  it('refuses formula seeds, ambiguous text prefixes, invalid dates and fractional date/text steps', () => {
    expect(() =>
      studioFillSeries(fixture({ A1: { input: '=A2' } }), 'main', selection('A1', 'A2'), {
        direction: 'down',
        type: 'text',
      })
    ).toThrow('文本种子');
    expect(() =>
      studioFillSeries(fixture({ A1: { input: '001' } }), 'main', selection('A1', 'A2'), {
        direction: 'down',
        type: 'number',
      })
    ).toThrow('数字种子');
    expect(() =>
      studioFillSeries(fixture({ A1: { input: '2023-02-29' } }), 'main', selection('A1', 'A2'), {
        direction: 'down',
        type: 'date',
      })
    ).toThrow('有效 YYYY-MM-DD');
    expect(() =>
      studioFillSeries(
        fixture({ A1: { input: 'A01' }, A2: { input: 'B02' } }),
        'main',
        selection('A1', 'A3'),
        {
          direction: 'down',
          type: 'text',
          seedCount: 2,
        }
      )
    ).toThrow('前缀必须相同');
    for (const type of ['date', 'text'] as const) {
      expect(() =>
        studioFillSeries(
          fixture({ A1: { input: type === 'date' ? '2024-01-01' : 'A01' } }),
          'main',
          selection('A1', 'A2'),
          {
            direction: 'down',
            type,
            step: 0.5,
          }
        )
      ).toThrow('整数');
    }
  });

  it('rejects insufficient seed rectangles and treats a seeds-only rectangle as unchanged', () => {
    const original = fixture({ A1: { input: '1' }, A2: { input: '3' } });
    const options = { direction: 'down', type: 'number', seedCount: 2 } as const;
    expect(() => studioFillSeries(original, 'main', selection('A1', 'A1'), options)).toThrow(
      '足够'
    );
    expect(studioFillSeries(original, 'main', selection('A2', 'A1'), options)).toBe(original);
  });
});

describe('Office Studio fill atomic validation and limits', () => {
  it('rejects a late stop validation in copy fill without committing earlier valid targets', () => {
    const original = fixture({ A1: { input: '7' }, A2: { input: 'old' }, A3: { input: 'old' } });
    original.sheets[0].dataValidations = [
      {
        id: 'limit',
        range: 'A3:A3',
        type: 'whole',
        operator: 'lessThan',
        formula1: '5',
        errorStyle: 'stop',
      },
    ];
    const before = JSON.stringify(original);
    expect(() => studioFillCells(original, 'main', selection('A1', 'A3'), 'down')).toThrow(
      '数据验证'
    );
    expect(JSON.stringify(original)).toBe(before);
  });

  it('validates the complete generated snapshot so dependent target formulas see the final batch', () => {
    const original = fixture({ A1: { input: '1' }, A2: { input: '100' }, A3: { input: '-100' } });
    original.sheets[0].dataValidations = [
      { id: 'order', range: 'A2:A2', type: 'custom', formula: '=A2<A3', errorStyle: 'stop' },
    ];
    const result = studioFillSeries(original, 'main', selection('A1', 'A3'), {
      direction: 'down',
      type: 'number',
    });
    expect(inputs(result, ['A1', 'A2', 'A3'])).toEqual(['1', '2', '3']);
    expect(result.sheets[0].dataValidations).toBe(original.sheets[0].dataValidations);
  });

  it('rejects a late series validation and allows the same warning rule without replacing it', () => {
    const original = fixture({ A1: { input: '1' }, A2: { input: 'old' }, A3: { input: 'old' } });
    original.sheets[0].dataValidations = [
      {
        id: 'limit',
        range: 'A2:A3',
        type: 'whole',
        operator: 'lessThanOrEqual',
        formula1: '2',
        errorStyle: 'stop',
      },
    ];
    const before = JSON.stringify(original);
    const options = { direction: 'down', type: 'number' } as const;
    expect(() => studioFillSeries(original, 'main', selection('A1', 'A3'), options)).toThrow(
      '数据验证'
    );
    expect(JSON.stringify(original)).toBe(before);
    original.sheets[0].dataValidations[0].errorStyle = 'warning';
    const result = studioFillSeries(original, 'main', selection('A1', 'A3'), options);
    expect(inputs(result, ['A2', 'A3'])).toEqual(['2', '3']);
    expect(result.sheets[0].dataValidations).toBe(original.sheets[0].dataValidations);
  });

  it('rejects any intersecting source or target merge and preserves an outside merge', () => {
    const original = fixture({ A1: { input: '1' } });
    original.sheets[0].merges = ['A1:B1'];
    expect(() => studioFillCells(original, 'main', selection('A1', 'A2'), 'down')).toThrow('合并');
    original.sheets[0].merges = ['A2:B2'];
    expect(() =>
      studioFillSeries(original, 'main', selection('A1', 'A2'), {
        direction: 'down',
        type: 'number',
      })
    ).toThrow('合并');
    original.sheets[0].merges = ['D4:E4'];
    const result = studioFillCells(original, 'main', selection('A1', 'A2'), 'down');
    expect(result.sheets[0].merges).toBe(original.sheets[0].merges);
    expect(original.sheets[0].cells.A2).toBeUndefined();
  });

  it('checks grid bounds, invalid positions and batch size before attempting to fill', () => {
    const original = fixture({ A1: { input: '1' } });
    expect(() => studioFillCells(original, 'missing', selection('A1', 'A2'), 'down')).toThrow(
      '不存在'
    );
    for (const position of [
      { row: 0, col: 1 },
      { row: 1.5, col: 1 },
      { row: 1, col: 257 },
      { row: 10001, col: 1 },
    ]) {
      expect(() =>
        studioFillCells(original, 'main', { anchor: { row: 1, col: 1 }, focus: position }, 'down')
      ).toThrow('支持范围');
    }
    expect(() => studioFillCells(original, 'main', selection('A1', 'B5001'), 'down')).toThrow(
      '10,000'
    );
    expect(() =>
      studioFillSeries(original, 'main', selection('A1', 'B5001'), {
        direction: 'down',
        type: 'number',
      })
    ).toThrow('10,000');
    expect(original.sheets[0].cells.A2).toBeUndefined();
  });

  it('preserves a full workbook when filling would exceed the stored cell limit', () => {
    const original = fixture({ A1: { input: 'seed' } });
    const stored: Record<string, StudioCell> = {};
    for (let index = 0; index < STUDIO_SHEET_LIMITS.storedCells - 1; index++)
      stored[studioCellAddress(Math.floor(index / 10) + 1, (index % 10) + 1)] = { input: '' };
    original.sheets[1] = { ...original.sheets[1], cells: stored, rowCount: 10000, columnCount: 10 };
    expect(() => studioFillCells(original, 'main', selection('A1', 'A2'), 'down')).toThrow(
      '100,000'
    );
    expect(Object.keys(original.sheets[1].cells)).toHaveLength(STUDIO_SHEET_LIMITS.storedCells - 1);
    expect(original.sheets[0].cells.A2).toBeUndefined();
  });

  it('rejects a text suffix expansion that would make a valid seed exceed the cell input limit', () => {
    const original = fixture({ A1: { input: `${'x'.repeat(32766)}9` } });
    expect(() =>
      studioFillSeries(original, 'main', selection('A1', 'A2'), {
        direction: 'down',
        type: 'text',
      })
    ).toThrow('32,767');
    expect(original.sheets[0].cells.A1.input).toHaveLength(32767);
    expect(original.sheets[0].cells.A2).toBeUndefined();
  });

  it('bounds the total copied and generated text before either batch can be committed', () => {
    const copied = fixture({ A1: { input: 'x'.repeat(32767) } });
    expect(() => studioFillCells(copied, 'main', selection('A1', 'A155'), 'down')).toThrow(
      '填充内容过大'
    );
    expect(copied.sheets[0].cells.A2).toBeUndefined();
    const generated = fixture({ A1: { input: `${'x'.repeat(32763)}001` } });
    expect(() =>
      studioFillSeries(generated, 'main', selection('A1', 'A155'), {
        direction: 'down',
        type: 'text',
      })
    ).toThrow('填充内容过大');
    expect(generated.sheets[0].cells.A2).toBeUndefined();
  });

  it('cancels numeric, date and text overflow after a valid generated cell without partial writes', () => {
    const cases = [
      { input: '1e308', type: 'number', step: 4e307 },
      { input: '9999-12-30', type: 'date', step: 1 },
      { input: '编号9007199254740990', type: 'text', step: 1 },
    ] as const;
    for (const item of cases) {
      const original = fixture({
        A1: { input: item.input },
        A2: { input: 'old' },
        A3: { input: 'old' },
      });
      const before = JSON.stringify(original);
      expect(() =>
        studioFillSeries(original, 'main', selection('A1', 'A3'), {
          direction: 'down',
          type: item.type,
          step: item.step,
        })
      ).toThrow('超出');
      expect(JSON.stringify(original)).toBe(before);
    }
    expect(() =>
      studioFillSeries(fixture({ A1: { input: '1' } }), 'main', selection('A1', 'A2'), {
        direction: 'down',
        type: 'number',
        step: Number.POSITIVE_INFINITY,
      })
    ).toThrow('有效数字');
  });
});
