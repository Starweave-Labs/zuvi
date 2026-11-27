import * as React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StudioSheet from './StudioSheet';
import { isOfficeStudioDocument } from './studio-model';
import type { StudioExcelDocument } from './studio-types';

beforeEach(() => vi.stubGlobal('PointerEvent', MouseEvent));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function fixture(): StudioExcelDocument {
  return {
    version: 1,
    id: 'view-ui',
    name: 'View.xlsx',
    kind: 'excel',
    activeSheetId: 's',
    defaultFont: { family: 'Arial', sizePt: 11, bold: false, italic: false },
    sheets: [
      {
        id: 's',
        name: 'View',
        rowCount: 30,
        columnCount: 10,
        columnWidths: { A: 100, B: 100, C: 120, D: 80 },
        cells: {
          A1: { input: '1', borders: { right: { style: 'double', color: '#123456' } } },
          C4: { input: '10' },
          A5: { input: 'Very long text with several words', fontSize: 24, wrap: true },
        },
      },
    ],
  };
}
function setup(
  initial = fixture(),
  initialPermissions: { readOnly?: boolean; disabled?: boolean } = {}
) {
  const changed = vi.fn();
  let current = initial;
  let replace!: React.Dispatch<React.SetStateAction<StudioExcelDocument>>;
  function Harness(permissions: { readOnly?: boolean; disabled?: boolean }) {
    const [document, setDocument] = React.useState(initial);
    replace = setDocument;
    return (
      <StudioSheet
        document={document}
        readOnly={permissions.readOnly ?? false}
        disabled={permissions.disabled ?? false}
        onChange={(next) => {
          current = next;
          changed(next);
          setDocument(next);
        }}
      />
    );
  }
  const result = render(<Harness {...initialPermissions} />);
  return {
    changed,
    current: () => current,
    permissions: (value: { readOnly?: boolean; disabled?: boolean }) =>
      result.rerender(<Harness {...value} />),
    external: (value: StudioExcelDocument) => {
      current = value;
      replace(value);
    },
  };
}
async function viewTab(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('tab', { name: '视图' }));
}
function zoom(value: string) {
  const input = screen.getByRole('textbox', { name: '工作表缩放百分比' });
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value } });
  fireEvent.keyDown(input, { key: 'Enter' });
}
function select(address: string) {
  const input = screen.getByRole('textbox', { name: '单元格地址' });
  fireEvent.change(input, { target: { value: address } });
  fireEvent.keyDown(input, { key: 'Enter' });
}
function gridRoot() {
  return screen.getByRole('grid').closest('.zuvi-studio-sheet')!;
}
function mockViewport(grid: HTMLElement, left = 0, top = 0) {
  Object.defineProperties(grid, {
    clientWidth: { configurable: true, value: 700 },
    clientHeight: { configurable: true, value: 800 },
  });
  vi.spyOn(grid, 'getBoundingClientRect').mockReturnValue({
    left: 13,
    top: 17,
    width: 700,
    height: 800,
    right: 713,
    bottom: 817,
    x: 13,
    y: 17,
    toJSON: () => ({}),
  });
  grid.scrollLeft = left;
  grid.scrollTop = top;
  fireEvent.scroll(grid);
}

describe('Sheet actual view controls and geometry', () => {
  it.each(['__proto__', 'toString'])(
    'handles the valid worksheet identity %s in a local read-only preview',
    async (id) => {
      const user = userEvent.setup(),
        initial = fixture();
      initial.activeSheetId = id;
      initial.sheets[0].id = id;
      expect(isOfficeStudioDocument(initial)).toBe(true);
      const f = setup(initial, { readOnly: true });
      await viewTab(user);
      zoom('25');
      expect(gridRoot()).toHaveAttribute('data-sheet-zoom', '25');
      expect(f.changed).not.toHaveBeenCalled();
      expect(f.current()).toBe(initial);
    }
  );
  it('applies zoom and visibility through ZUVI controls with one view transaction and full undo/redo', async () => {
    const user = userEvent.setup();
    const initial = fixture(),
      f = setup(initial);
    await viewTab(user);
    const cell = screen.getByRole('gridcell', { name: 'A1' });
    const height = parseFloat(cell.style.height);
    select('C4');
    zoom('400%');
    expect(f.changed).toHaveBeenCalledTimes(1);
    expect(f.current().sheets[0].view).toEqual({
      zoom: 400,
      showGridLines: true,
      showRowColHeaders: true,
    });
    expect(parseFloat(cell.style.width)).toBe(400);
    expect(parseFloat(cell.style.height)).toBe(height * 4);
    expect(cell.style.borderRight).toBe('12px double rgb(18, 52, 86)');
    expect(screen.getByRole('textbox', { name: '单元格地址' })).toHaveValue('C4');
    expect(screen.getByRole('grid')).toHaveFocus();
    expect(f.current().sheets[0].cells).toBe(initial.sheets[0].cells);
    fireEvent.keyDown(screen.getByRole('grid'), { key: 'z', ctrlKey: true });
    expect(f.current()).toBe(initial);
    fireEvent.keyDown(screen.getByRole('grid'), { key: 'z', ctrlKey: true, shiftKey: true });
    expect(gridRoot()).toHaveAttribute('data-sheet-zoom', '400');
    await user.click(screen.getByRole('checkbox', { name: '显示网格线' }));
    expect(gridRoot()).toHaveAttribute('data-gridlines', 'false');
    expect(cell.style.borderRight).toBe('12px double rgb(18, 52, 86)');
    expect(f.changed).toHaveBeenCalledTimes(4);
    await user.click(screen.getByRole('checkbox', { name: '显示行列标题' }));
    expect(screen.queryByRole('rowheader')).toBeNull();
    expect(screen.queryByRole('columnheader')).toBeNull();
    expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', '30');
    expect(screen.getByRole('grid')).toHaveAttribute('aria-colcount', '10');
    expect(cell).toHaveAttribute('aria-colindex', '1');
    expect(cell.closest('[role=row]')).toHaveAttribute('aria-rowindex', '1');
    expect(parseFloat(cell.style.left)).toBe(0);
    fireEvent.keyDown(screen.getByRole('grid'), { key: 'ArrowDown', shiftKey: true });
    expect(screen.getByRole('textbox', { name: '单元格地址' })).toHaveValue('C5');
    expect(f.current().sheets[0].rowHeights).toBeUndefined();
  });

  it('does not reflow wrapped or centered text or mutate auto-height caches when zoom changes', async () => {
    const user = userEvent.setup();
    const initial = fixture();
    initial.sheets[0].cells.A2 = {
      input: 'LongHeading',
      fontSize: 24,
      align: 'centerContinuous',
      shrinkToFit: true,
    };
    initial.sheets[0].cells.B2 = { input: '', align: 'centerContinuous' };
    initial.sheets[0].cells.C2 = { input: '', align: 'centerContinuous' };
    const f = setup(initial);
    const wrap = screen.getByRole('gridcell', { name: 'A5' });
    const center = screen.getByRole('gridcell', { name: 'A2' });
    const wrapHeight = parseFloat(wrap.style.height),
      centerHeight = parseFloat(center.style.height);
    const lines = wrap.querySelectorAll('.zuvi-studio-sheet-text-transform>span').length;
    const transform = center.querySelector<HTMLElement>('.zuvi-studio-sheet-text-transform')!.style
      .transform;
    await viewTab(user);
    zoom('25');
    expect(parseFloat(wrap.style.height)).toBe(wrapHeight / 4);
    expect(parseFloat(center.style.height)).toBe(centerHeight / 4);
    expect(wrap.querySelectorAll('.zuvi-studio-sheet-text-transform>span')).toHaveLength(lines);
    expect(center.querySelector('.zuvi-studio-sheet-text')).toHaveAttribute(
      'data-effective-font-size',
      '24'
    );
    expect(center.querySelector('.zuvi-studio-sheet-text')).toHaveAttribute(
      'data-text-view-scale',
      '0.25'
    );
    const original = transform.slice(7, -1).split(',').map(Number);
    const scaled = center
      .querySelector<HTMLElement>('.zuvi-studio-sheet-text-transform')!
      .style.transform.slice(7, -1)
      .split(',')
      .map(Number);
    expect(scaled).toEqual(original.map((value) => value / 4));
    expect(f.current().sheets[0].rowHeights).toBeUndefined();
    zoom('400');
    expect(parseFloat(wrap.style.height)).toBe(wrapHeight * 4);
    expect(wrap.querySelectorAll('.zuvi-studio-sheet-text-transform>span')).toHaveLength(lines);
    expect(f.changed).toHaveBeenCalledTimes(2);
  });

  it('cancels a valid zoom draft before focus blur, blocks malformed input and completes IME before commit', async () => {
    const user = userEvent.setup(),
      f = setup();
    await viewTab(user);
    const input = screen.getByRole('textbox', { name: '工作表缩放百分比' });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '250' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input).toHaveValue('100');
    expect(f.changed).not.toHaveBeenCalled();
    zoom('401');
    expect(screen.getByRole('alert')).toHaveTextContent('25 至 400');
    expect(gridRoot()).toHaveAttribute('data-studio-input-error');
    expect(screen.getByRole('checkbox', { name: '显示网格线' })).toBeDisabled();
    fireEvent.keyDown(input, { key: 'Escape' });
    fireEvent.focus(input);
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: '125' } });
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true, keyCode: 229 });
    fireEvent.blur(input);
    expect(f.changed).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('完成缩放输入');
    fireEvent.compositionEnd(input);
    expect(f.changed).toHaveBeenCalledTimes(1);
    expect(gridRoot()).toHaveAttribute('data-sheet-zoom', '125');
    expect(gridRoot()).not.toHaveAttribute('data-studio-input-error');
  });

  it('keeps read-only adjustments local, restores document view on editing, and rejects every disabled entry', async () => {
    const user = userEvent.setup(),
      initial = fixture(),
      f = setup(initial, { readOnly: true });
    await viewTab(user);
    zoom('25');
    await user.click(screen.getByRole('checkbox', { name: '显示行列标题' }));
    expect(gridRoot()).toHaveAttribute('data-sheet-zoom', '25');
    expect(screen.queryByRole('rowheader')).toBeNull();
    expect(f.changed).not.toHaveBeenCalled();
    expect(f.current()).toBe(initial);
    fireEvent.keyDown(screen.getByRole('grid'), { key: '+', ctrlKey: true });
    expect(gridRoot()).toHaveAttribute('data-sheet-zoom', '35');
    expect(f.changed).not.toHaveBeenCalled();
    f.permissions({});
    expect(gridRoot()).toHaveAttribute('data-sheet-zoom', '100');
    expect(screen.getAllByRole('rowheader').length).toBeGreaterThan(0);
    f.permissions({ disabled: true });
    for (const name of ['缩小工作表', '放大工作表'])
      expect(screen.getByRole('button', { name })).toBeDisabled();
    expect(screen.getByRole('button', { name: /^工作表缩放预设/ })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: '工作表缩放百分比' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: '显示网格线' })).toBeDisabled();
    fireEvent.keyDown(screen.getByRole('grid'), { key: '-', ctrlKey: true });
    expect(gridRoot()).toHaveAttribute('data-sheet-zoom', '100');
    expect(f.changed).not.toHaveBeenCalled();
  });

  it('keeps a native 10% view intact until an authoring action and does not block view changes in protected cells', async () => {
    const user = userEvent.setup(),
      initial = fixture();
    initial.sheets[0].view = { zoom: 10, showGridLines: true, showRowColHeaders: true };
    initial.sheets[0].protectedRanges = ['A1:D10'];
    const f = setup(initial);
    await viewTab(user);
    expect(screen.getByRole('textbox', { name: '工作表缩放百分比' })).toHaveValue('10');
    expect(screen.getByRole('button', { name: '缩小工作表' })).toBeDisabled();
    await user.click(screen.getByRole('checkbox', { name: '显示网格线' }));
    expect(f.current().sheets[0].view?.zoom).toBe(10);
    await user.click(screen.getByRole('button', { name: '放大工作表' }));
    expect(f.current().sheets[0].view?.zoom).toBe(25);
    expect(f.current().sheets[0].protectedRanges).toBe(initial.sheets[0].protectedRanges);
    fireEvent.keyDown(screen.getByRole('grid'), { key: 'z', ctrlKey: true });
    expect(f.current().sheets[0].view?.zoom).toBe(10);
  });

  it('rejects a view change when the current cell draft is invalid, then permits cancellation and correction', async () => {
    const user = userEvent.setup(),
      f = setup();
    await viewTab(user);
    const formula = screen.getByRole('textbox', { name: '表格公式栏' });
    fireEvent.focus(formula);
    fireEvent.change(formula, { target: { value: 'x'.repeat(32768) } });
    await user.click(screen.getByRole('checkbox', { name: '显示网格线' }));
    expect(f.changed).not.toHaveBeenCalled();
    expect(screen.getByRole('checkbox', { name: '显示网格线' })).toBeChecked();
    fireEvent.keyDown(formula, { key: 'Escape' });
    await user.click(screen.getByRole('checkbox', { name: '显示网格线' }));
    expect(f.changed).toHaveBeenCalledTimes(1);
    expect(f.current().sheets[0].cells.A1.input).toBe('1');
  });

  it('converts resize deltas to document dimensions and cancels previews without history', async () => {
    const user = userEvent.setup(),
      f = setup();
    await viewTab(user);
    zoom('400');
    const column = screen.getByRole('separator', { name: 'A 列宽' });
    fireEvent.pointerDown(column, { clientX: 440, button: 0 });
    fireEvent.pointerMove(window, { clientX: 480 });
    expect(parseFloat(screen.getByRole('gridcell', { name: 'A1' }).style.width)).toBe(440);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(f.changed).toHaveBeenCalledTimes(1);
    expect(f.current().sheets[0].columnWidths?.A).toBe(100);
    fireEvent.pointerDown(column, { clientX: 440, button: 0 });
    fireEvent.pointerUp(window, { clientX: 480 });
    expect(f.current().sheets[0].columnWidths?.A).toBe(110);
    const row = screen.getByRole('separator', { name: '1 行高' });
    fireEvent.pointerDown(row, { clientY: 120, button: 0 });
    fireEvent.pointerUp(window, { clientY: 136 });
    expect(f.current().sheets[0].rowHeights?.['1']).toBe(21);
    expect(f.changed).toHaveBeenCalledTimes(3);
    fireEvent.keyDown(screen.getByRole('grid'), { key: 'z', ctrlKey: true });
    expect(f.current().sheets[0].rowHeights).toBeUndefined();
  });

  it.each([25, 400])(
    'fills the hit-tested scrolled target at %i%% with hidden rows and frozen lanes',
    async (percentage) => {
      const user = userEvent.setup(),
        initial = fixture();
      initial.sheets[0].cells = { A1: { input: '1' }, C4: { input: '10' } };
      initial.sheets[0].hiddenRows = [2];
      initial.sheets[0].hiddenColumns = ['B'];
      initial.sheets[0].freeze = { rows: 1, columns: 1 };
      const f = setup(initial);
      await viewTab(user);
      zoom(String(percentage));
      select('C4');
      const grid = screen.getByRole('grid'),
        scale = percentage / 100;
      mockViewport(grid, 30 * scale, 24 * scale);
      const handle = screen.getByRole('button', { name: '填充柄' });
      fireEvent.pointerDown(handle, { button: 0 });
      // C7: visible row index 5, midway in its 24px logical row.
      const target = {
        clientX: 13 + 40 + 150 * scale - grid.scrollLeft,
        clientY: 17 + 24 + 132 * scale - grid.scrollTop,
      };
      fireEvent.pointerMove(window, target);
      expect(globalThis.document.querySelector('.zuvi-studio-sheet-fill-preview')).not.toBeNull();
      fireEvent.pointerUp(window, target);
      expect(f.current().sheets[0].cells.C5.input).toBe('11');
      expect(f.current().sheets[0].cells.C6.input).toBe('12');
      expect(f.current().sheets[0].cells.C7.input).toBe('13');
      expect(f.changed).toHaveBeenCalledTimes(2);
      fireEvent.keyDown(grid, { key: 'z', ctrlKey: true });
      expect(f.current().sheets[0].cells.C7).toBeUndefined();
    }
  );

  it('renders hidden merge origins at their actual visible position without inventing a frozen zero-width lane', async () => {
    const user = userEvent.setup(),
      initial = fixture();
    initial.sheets[0].cells = {
      B2: { input: 'Merged', fontSize: 24, wrap: true },
      E4: { input: 'Tail' },
    };
    initial.sheets[0].hiddenColumns = ['A', 'B'];
    initial.sheets[0].hiddenRows = [1, 2];
    initial.sheets[0].freeze = { rows: 1, columns: 1 };
    initial.sheets[0].merges = ['B2:D3'];
    setup(initial);
    await viewTab(user);
    zoom('400');
    const grid = screen.getByRole('grid');
    mockViewport(grid, 50, 30);
    const master = screen.getByRole('gridcell', { name: 'B2' });
    expect(master).toHaveTextContent('Merged');
    expect(parseFloat(master.style.width)).toBe(800);
    expect(parseFloat(master.style.height)).toBeGreaterThan(147.2);
    expect(parseFloat(master.style.left)).toBe(40);
    expect(master).not.toHaveAttribute('data-frozen');
    expect(parseFloat((master.closest('[role=row]') as HTMLElement).style.top)).toBe(24);
    expect(master.closest('[role=row]')).not.toHaveAttribute('data-frozen');
    expect(screen.queryByRole('gridcell', { name: 'B4' })).toBeNull();
    expect(screen.queryByRole('gridcell', { name: 'E2' })).toBeNull();
  });

  it('keeps the small-zoom cell editor readable and commits only its logical cell', async () => {
    const user = userEvent.setup(),
      f = setup();
    await viewTab(user);
    zoom('25');
    const cell = screen.getByRole('gridcell', { name: 'A1' });
    await user.dblClick(cell);
    const editor = screen.getByRole('textbox', { name: '编辑 A1' });
    expect(
      parseFloat(editor.closest<HTMLElement>('.zuvi-input')!.style.minHeight)
    ).toBeGreaterThanOrEqual(24);
    expect(cell).toHaveAttribute('data-editing');
    expect(cell.style.overflow).toBe('visible');
    fireEvent.change(editor, { target: { value: '9' } });
    fireEvent.keyDown(editor, { key: 'Enter' });
    expect(f.current().sheets[0].cells.A1.input).toBe('9');
    expect(f.current().sheets[0].view?.zoom).toBe(25);
    expect(f.changed).toHaveBeenCalledTimes(2);
  });
});
