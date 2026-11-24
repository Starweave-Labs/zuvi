import { describe, expect, it } from 'vitest';
import { studioCalculate } from './studio-sheet-model';
import { studioDataBlockTarget } from './studio-sheet-navigation';
import type { StudioSheet, StudioExcelDocument } from './studio-types';

function target(
  sheet: StudioSheet,
  row: number,
  col: number,
  direction: 'up' | 'down' | 'left' | 'right'
) {
  const book: StudioExcelDocument = {
    version: 1,
    id: 'book',
    name: 'nav.xlsx',
    kind: 'excel',
    activeSheetId: sheet.id,
    sheets: [sheet],
  };
  return studioDataBlockTarget(sheet, { row, col }, direction, studioCalculate(book));
}
const sheet = (): StudioSheet => ({
  id: 'main',
  name: 'Data',
  rowCount: 12,
  columnCount: 8,
  cells: {
    A1: { input: '1' },
    A2: { input: '2' },
    A3: { input: '3' },
    A6: { input: '6' },
    A7: { input: '7' },
    B1: { input: '0' },
    C1: { input: '=1/0' },
    F1: { input: 'FALSE' },
  },
});

describe('sheet data-block navigation', () => {
  it('moves to contiguous block edges, crosses blank gaps and reaches visible bounds', () => {
    const data = sheet();
    expect(target(data, 1, 1, 'down')).toEqual({ row: 3, col: 1 });
    expect(target(data, 3, 1, 'down')).toEqual({ row: 6, col: 1 });
    expect(target(data, 4, 1, 'down')).toEqual({ row: 6, col: 1 });
    expect(target(data, 7, 1, 'up')).toEqual({ row: 6, col: 1 });
    expect(target(data, 6, 1, 'up')).toEqual({ row: 3, col: 1 });
    expect(target(data, 7, 1, 'down')).toEqual({ row: 12, col: 1 });
    expect(target(data, 1, 1, 'right')).toEqual({ row: 1, col: 3 });
    expect(target(data, 1, 3, 'right')).toEqual({ row: 1, col: 6 });
  });

  it('skips manually hidden and filter-hidden rows and hidden columns without landing on them', () => {
    const data = sheet();
    data.hiddenRows = [2, 6, 12];
    data.hiddenColumns = ['B', 'H'];
    expect(target(data, 1, 1, 'down')).toEqual({ row: 3, col: 1 });
    expect(target(data, 3, 1, 'down')).toEqual({ row: 7, col: 1 });
    expect(target(data, 7, 1, 'down')).toEqual({ row: 11, col: 1 });
    expect(target(data, 1, 1, 'right')).toEqual({ row: 1, col: 3 });
    expect(target(data, 1, 6, 'right')).toEqual({ row: 1, col: 7 });
    data.filter = { range: 'A1:A7', columns: { A: { operator: 'greater', value: '2' } } };
    expect(target(data, 3, 1, 'down')).toEqual({ row: 7, col: 1 });
  });

  it('moves through whole merged regions and counts displayed array zeros/errors as data', () => {
    const data = sheet();
    data.merges = ['A2:A3'];
    delete data.cells.A3;
    expect(target(data, 1, 1, 'down')).toEqual({ row: 3, col: 1 });
    expect(target(data, 2, 1, 'down')).toEqual({ row: 6, col: 1 });
    data.cells.D4 = { input: '=SEQUENCE(3,1,0)', array: { type: 'dynamic' } };
    expect(target(data, 4, 4, 'down')).toEqual({ row: 6, col: 4 });
    expect(target(data, 6, 4, 'up')).toEqual({ row: 4, col: 4 });
    expect(target(data, 1, 3, 'right')).toEqual({ row: 1, col: 6 });
  });
});
