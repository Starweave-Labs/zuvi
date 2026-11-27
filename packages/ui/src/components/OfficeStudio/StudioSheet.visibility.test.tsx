import * as React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StudioSheet from './StudioSheet';
import {
  studioCalculate,
  studioHiddenRows,
  studioSetColumnsHidden,
  studioSetRangeHidden,
  studioSetRowsHidden,
} from './studio-sheet-model';
import type { StudioExcelDocument } from './studio-types';

beforeEach(() => vi.stubGlobal('PointerEvent', MouseEvent));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function fixture(): StudioExcelDocument {
  return {
    version: 1,
    id: 'visibility',
    name: 'Visibility.xlsx',
    kind: 'excel',
    activeSheetId: 's',
    sheets: [
      {
        id: 's',
        name: 'Data',
        rowCount: 8,
        columnCount: 6,
        rowHeights: { 2: 32, 3: 40 },
        rowHeightModes: { 2: 'fixed', 3: 'auto' },
        columnWidths: { A: 92, B: 144, C: 80 },
        cells: {
          A1: { input: 'Header' },
          A2: { input: '1' },
          A3: { input: '2' },
          A4: { input: '3' },
          F1: { input: '=SUM(A2:A4)' },
        },
      },
      { id: 'other', name: 'Other', rowCount: 8, columnCount: 6, cells: {} },
    ],
  };
}
function setup(
  initial = fixture(),
  initialPermissions: { readOnly?: boolean; disabled?: boolean } = {}
) {
  let current = initial;
  const changed = vi.fn();
  function Harness(permissions: { readOnly?: boolean; disabled?: boolean }) {
    const [document, setDocument] = React.useState(initial);
    return (
      <StudioSheet
        document={document}
        disabled={permissions.disabled ?? false}
        readOnly={permissions.readOnly ?? false}
        onChange={(next) => {
          current = next;
          changed(next);
          setDocument(next);
        }}
      />
    );
  }
  const view = render(<Harness {...initialPermissions} />);
  return {
    current: () => current,
    changed,
    permissions: (p: { readOnly?: boolean; disabled?: boolean }) =>
      view.rerender(<Harness {...p} />),
  };
}
function select(value: string) {
  const input = screen.getByRole('textbox', { name: '单元格地址' });
  fireEvent.change(input, { target: { value } });
  fireEvent.keyDown(input, { key: 'Enter' });
}
function click(name: string) {
  fireEvent.click(screen.getByRole('button', { name }));
}
const cell = (address: string) => screen.getByRole('gridcell', { name: address });

describe('manual row and column visibility model', () => {
  it('hides and shows a selected range without changing sizing, formulas or other sheets', () => {
    const original = fixture();
    const source = original.sheets[0];
    const range = { firstRow: 2, lastRow: 3, firstCol: 2, lastCol: 3 };
    let next = studioSetRangeHidden(original, 's', range, 'rows', true);
    next = studioSetRangeHidden(next, 's', range, 'columns', true);
    expect(next.sheets[0].hiddenRows).toEqual([2, 3]);
    expect(next.sheets[0].hiddenColumns).toEqual(['B', 'C']);
    next = studioSetRangeHidden(next, 's', range, 'rows', false);
    next = studioSetRangeHidden(next, 's', range, 'columns', false);
    expect(next.sheets[0].hiddenRows).toEqual([]);
    expect(next.sheets[0].hiddenColumns).toEqual([]);
    for (const key of ['cells', 'rowHeights', 'rowHeightModes', 'columnWidths'] as const)
      expect(next.sheets[0][key]).toBe(source[key]);
    expect(next.sheets[1]).toBe(original.sheets[1]);
    expect(studioCalculate(next).values.get('s:F1')).toBe(6);
    expect(original.sheets[0].hiddenRows).toBeUndefined();
  });
  it('clears only manual decisions while keeping overlapping filtered rows hidden', () => {
    const original = fixture();
    original.sheets[0].filter = {
      range: 'A1:A4',
      columns: { A: { operator: 'greater', value: '1' } },
    };
    const hidden = studioSetRowsHidden(original, 's', [2, 3]);
    const shown = studioSetRowsHidden(hidden, 's', []);
    expect(shown.sheets[0].filter).toBe(original.sheets[0].filter);
    expect([...studioHiddenRows(shown.sheets[0], studioCalculate(shown))]).toEqual([2]);
    expect(shown.sheets[0].rowHeightModes).toBe(original.sheets[0].rowHeightModes);
  });
  it('preserves legacy unspecified sizing modes and does not create history for no-ops', () => {
    const original = fixture();
    delete original.sheets[0].rowHeightModes;
    expect(studioSetRowsHidden(original, 's', [])).toBe(original);
    expect(studioSetColumnsHidden(original, 's', [])).toBe(original);
    const hidden = studioSetRowsHidden(original, 's', [3, 2, 2]);
    expect(hidden.sheets[0].hiddenRows).toEqual([2, 3]);
    expect(hidden.sheets[0].rowHeightModes).toBeUndefined();
    expect(studioSetRowsHidden(hidden, 's', [2, 3])).toBe(hidden);
    expect(studioSetRowsHidden(hidden, 's', []).sheets[0].rowHeights).toBe(
      original.sheets[0].rowHeights
    );
  });
  it('rejects malformed and fully hidden selections atomically', () => {
    const original = fixture();
    const before = JSON.stringify(original);
    for (const hidden of [[0], [9], [2.5], [NaN], [1, 2, 3, 4, 5, 6, 7, 8]])
      expect(() => studioSetRowsHidden(original, 's', hidden)).toThrow();
    expect(() =>
      studioSetRangeHidden(
        original,
        's',
        { firstRow: 1, lastRow: 2, firstCol: 1, lastCol: 7 },
        'columns',
        true
      )
    ).toThrow();
    expect(() => studioSetColumnsHidden(original, 's', ['A', 'B', 'C', 'D', 'E', 'F'])).toThrow();
    expect(JSON.stringify(original)).toBe(before);
  });
});

describe('visibility through the actual sheet controls', () => {
  it('changes all selected columns, restores only the selection, then shows all with individual history', () => {
    const initial = fixture();
    initial.sheets[0].hiddenColumns = ['E'];
    const view = setup(initial);
    select('B1:C1');
    click('隐藏列');
    expect(view.current().sheets[0].hiddenColumns).toEqual(['E', 'B', 'C']);
    expect(screen.queryByRole('gridcell', { name: 'B1' })).toBeNull();
    expect(cell('D1')).toHaveAttribute('data-active', 'true');
    expect(screen.getByRole('grid')).toHaveFocus();
    select('A1:D1');
    click('显示选区列');
    expect(view.current().sheets[0].hiddenColumns).toEqual(['E']);
    click('撤销表格修改');
    expect(view.current().sheets[0].hiddenColumns).toEqual(['E', 'B', 'C']);
    click('重做表格修改');
    expect(view.current().sheets[0].hiddenColumns).toEqual(['E']);
    click('显示全部列');
    expect(view.current().sheets[0].hiddenColumns).toEqual([]);
    expect(view.current().sheets[0].columnWidths).toBe(initial.sheets[0].columnWidths);
  });
  it('restores hidden row dimensions and modes through selection and all-row commands while preserving filtering', () => {
    const initial = fixture();
    initial.sheets[0].hiddenRows = [6];
    initial.sheets[0].filter = {
      range: 'A1:A4',
      columns: { A: { operator: 'greater', value: '1' } },
    };
    const view = setup(initial);
    select('A2:A3');
    click('隐藏行');
    expect(view.current().sheets[0].hiddenRows).toEqual([2, 3, 6]);
    select('A1:A4');
    click('显示选区行');
    expect(view.current().sheets[0].hiddenRows).toEqual([6]);
    expect(screen.queryByRole('gridcell', { name: 'A2' })).toBeNull();
    expect(cell('A3')).toBeInTheDocument();
    click('撤销表格修改');
    expect(view.current().sheets[0].hiddenRows).toEqual([2, 3, 6]);
    click('重做表格修改');
    click('显示全部行');
    expect(view.current().sheets[0].hiddenRows).toEqual([]);
    expect(view.current().sheets[0].rowHeights).toBe(initial.sheets[0].rowHeights);
    expect(view.current().sheets[0].rowHeightModes).toBe(initial.sheets[0].rowHeightModes);
    expect(view.current().sheets[0].filter).toBe(initial.sheets[0].filter);
    expect(screen.queryByRole('gridcell', { name: 'A2' })).toBeNull();
  });
  it('skips hidden columns after merged cells and retains a visible merge with hidden origins', () => {
    const initial = fixture();
    initial.sheets[0].hiddenColumns = ['C', 'E'];
    initial.sheets[0].merges = ['A1:B1', 'E2:F3'];
    initial.sheets[0].hiddenRows = [2];
    initial.sheets[0].cells.E2 = { input: 'merge' };
    setup(initial);
    const grid = screen.getByRole('grid');
    select('A1');
    fireEvent.keyDown(grid, { key: 'ArrowRight' });
    expect(cell('D1')).toHaveAttribute('data-active', 'true');
    fireEvent.keyDown(grid, { key: 'ArrowLeft' });
    expect(cell('A1')).toHaveAttribute('data-active', 'true');
    select('D3');
    fireEvent.keyDown(grid, { key: 'ArrowRight' });
    expect(cell('E2')).toHaveAttribute('data-active', 'true');
    fireEvent.keyDown(grid, { key: 'ArrowDown' });
    expect(cell('F4')).toHaveAttribute('data-active', 'true');
    fireEvent.keyDown(grid, { key: 'ArrowUp' });
    expect(cell('E2')).toHaveAttribute('data-active', 'true');
    fireEvent.keyDown(grid, { key: 'ArrowLeft' });
    expect(cell('D3')).toHaveAttribute('data-active', 'true');
  });
  it('keeps ordinary and extended navigation on visible columns including the final boundary', () => {
    const initial = fixture();
    initial.sheets[0].hiddenColumns = ['A', 'C', 'F'];
    setup(initial);
    const grid = screen.getByRole('grid');
    expect(cell('B1')).toHaveAttribute('data-active', 'true');
    fireEvent.keyDown(grid, { key: 'ArrowRight', shiftKey: true });
    expect(cell('D1')).toHaveAttribute('data-active', 'true');
    expect(cell('B1')).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(grid, { key: 'End' });
    expect(cell('E1')).toHaveAttribute('data-active', 'true');
    fireEvent.keyDown(grid, { key: 'ArrowRight' });
    expect(cell('E1')).toHaveAttribute('data-active', 'true');
    fireEvent.keyDown(grid, { key: 'Home' });
    expect(cell('B1')).toHaveAttribute('data-active', 'true');
  });
  it('rejects IME and invalid input without a visibility transaction, then recovers after cancellation', () => {
    const initial = fixture();
    const view = setup(initial);
    const formula = screen.getByRole('textbox', { name: '表格公式栏' });
    fireEvent.focus(formula);
    fireEvent.compositionStart(formula);
    fireEvent.change(formula, { target: { value: '正在输入' } });
    click('隐藏列');
    fireEvent.blur(formula);
    expect(view.changed).not.toHaveBeenCalled();
    fireEvent.compositionEnd(formula);
    fireEvent.keyDown(formula, { key: 'Escape' });
    expect(view.current().sheets[0].cells.A1.input).toBe('Header');
    fireEvent.focus(formula);
    fireEvent.change(formula, { target: { value: 'x'.repeat(32768) } });
    click('隐藏行');
    expect(view.changed).not.toHaveBeenCalled();
    fireEvent.keyDown(formula, { key: 'Escape' });
    click('隐藏行');
    expect(view.current().sheets[0].hiddenRows).toEqual([1]);
    click('撤销表格修改');
    expect(view.current()).toBe(initial);
  });
  it('guards all six write commands in read-only and disabled states and refuses all-column hiding', () => {
    const initial = fixture();
    initial.sheets[0].hiddenRows = [3];
    initial.sheets[0].hiddenColumns = ['B'];
    const view = setup(initial);
    select('A1:C4');
    for (const permission of [{ readOnly: true }, { disabled: true }]) {
      view.permissions(permission);
      for (const name of [
        '隐藏行',
        '显示选区行',
        '显示全部行',
        '隐藏列',
        '显示选区列',
        '显示全部列',
      ]) {
        expect(screen.getByRole('button', { name })).toBeDisabled();
        click(name);
      }
    }
    expect(view.changed).not.toHaveBeenCalled();
    view.permissions({});
    select('A1:F1');
    expect(screen.getByRole('button', { name: '隐藏列' })).toBeDisabled();
    expect(view.current()).toBe(initial);
  });
});
