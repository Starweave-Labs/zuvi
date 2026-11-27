import { expect, it } from 'vitest';
import type { StudioRichNode } from './studio-types';
import { wordTableHeightBudgets } from './studio-word-table-layout';

const paragraph = { type: 'paragraph', content: [{ type: 'text', text: 'Cell' }] };
const cell = (attrs: Record<string, unknown> = {}): StudioRichNode => ({ type: 'tableCell', attrs, content: [paragraph] });
const row = (height: number, cells: StudioRichNode[], attrs: Record<string, unknown> = {}): StudioRichNode => ({ type: 'tableRow', attrs: { rowHeightRule: 'exact', rowHeight: height, ...attrs }, content: cells });

it('uses the nearest table defaults and independent direct margins in its fixed row budgets', () => {
  const table = { type: 'table', attrs: { defaultCellMargins: { top: 2, bottom: 3 }, cellSpacing: 6 }, content: [row(24, [cell({ cellMargins: { top: 0 } }), cell()]), row(36, [cell({ cellMargins: { top: 5, bottom: 7 } })])] };
  const before = JSON.stringify(table), result = wordTableHeightBudgets(table);
  expect(result.rows[0]!.topMargin).toBe(2); expect(result.rows[0]!.bottomMargin).toBe(3);
  expect(result.rows[0]!.outerHeight).toBeCloseTo(24 + 2 + 3 - 6 + 0.75);
  expect(result.rows[1]!.outerHeight).toBeCloseTo(36 + 5 + 7 - 6 + 0.75);
  expect(JSON.stringify(table)).toBe(before);
});

it('assigns a vertically merged cell bottom margin to its ending row rather than each covered row', () => {
  const table = { type: 'table', content: [row(24, [cell({ rowspan: 2, cellMargins: { top: 10, bottom: 20 } }), cell({ cellMargins: { top: 2, bottom: 3 } })]), row(36, [cell({ cellMargins: { top: 5, bottom: 7 } })])] };
  const result = wordTableHeightBudgets(table);
  expect(result.rows[0]!.topMargin).toBe(10); expect(result.rows[0]!.bottomMargin).toBe(3);
  expect(result.rows[1]!.topMargin).toBe(5); expect(result.rows[1]!.bottomMargin).toBe(20);
  expect(result.cells[0][0]!.outerHeight).toBeCloseTo(98.75);
  expect(result.cells[0][1]!.outerHeight).toBe(result.rows[0]!.outerHeight);
});

it('does not clip a merged cell to a fixed budget when any covered row remains automatic', () => {
  const table = { type: 'table', content: [row(24, [cell({ rowspan: 2 })]), { type: 'tableRow', content: [cell()] }] };
  const result = wordTableHeightBudgets(table);
  expect(result.rows[1]).toBeNull(); expect(result.cells[0][0]).toBeNull();
});

it('does not include nested table margins in the outer row budget or inherit outer cell margins into the inner table', () => {
  const inner = { type: 'table', content: [row(24, [cell()])] };
  const outer = { type: 'table', content: [row(72, [{ ...cell({ cellMargins: { top: 50, bottom: 60 } }), content: [paragraph, inner] }])] };
  expect(wordTableHeightBudgets(outer).rows[0]!.outerHeight).toBeCloseTo(182.75);
  expect(wordTableHeightBudgets(inner).rows[0]!.topMargin).toBe(0);
  expect(wordTableHeightBudgets(inner).rows[0]!.bottomMargin).toBe(0);
  expect(wordTableHeightBudgets(inner).rows[0]!.outerHeight).toBeCloseTo(24.75);
});

it('counts exterior and inter-row spacing once in measured pagination bands', async () => {
  const { wordTableMeasuredRowBands } = await import('./studio-word-table-layout');
  const rows = [{ top: 4, bottom: 24 }, { top: 28, bottom: 58 }];
  const bands = wordTableMeasuredRowBands({ top: 0, bottom: 62 }, rows);
  expect(bands).toEqual([{ top: 0, bottom: 28, height: 28 }, { top: 28, bottom: 62, height: 34 }]);
  expect(bands.reduce((sum, band) => sum + band.height, 0)).toBe(62);
  expect(rows).toEqual([{ top: 4, bottom: 24 }, { top: 28, bottom: 58 }]);
  expect(() => wordTableMeasuredRowBands({ top: 0, bottom: NaN }, rows)).toThrow();
});

it('keeps the first DOM cell below a vertical merge in its actual interior grid column', async () => {
  const { wordTableCellColumns } = await import('./studio-word-table-layout');
  const table = { type: 'table', content: [row(24, [cell({ rowspan: 2 }), cell(), cell()]), row(36, [cell(), cell()])] };
  expect(wordTableCellColumns(table)).toEqual({ width: 3, cells: [[{ left: 0, right: 1, first: true, last: false }, { left: 1, right: 2, first: false, last: false }, { left: 2, right: 3, first: false, last: true }], [{ left: 1, right: 2, first: false, last: false }, { left: 2, right: 3, first: false, last: true }]] });
});
