import * as React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import StudioSheet from './StudioSheet';
import type { StudioExcelDocument } from './studio-types';

afterEach(cleanup);
function fixture(): StudioExcelDocument {
  return {
    version: 1,
    id: 'text-ui',
    name: 'Text.xlsx',
    kind: 'excel',
    activeSheetId: 's',
    defaultFont: { family: 'Arial', sizePt: 9.5, bold: true, italic: true },
    sheets: [
      {
        id: 's',
        name: 'Text',
        rowCount: 20,
        columnCount: 8,
        cells: {
          A1: { input: 'ABC' },
          B1: { input: '=A1', indent: 2, align: 'right' },
          A2: { input: 'A very long text with several words', fontSize: 22, wrap: true },
        },
        hyperlinks: [
          { id: 'label', ref: 'D1', display: 'Native label', target: 'https://example.com/' },
        ],
      },
    ],
  };
}
function setup(initial = fixture()) {
  const changed = vi.fn();
  let current = initial;
  function Harness({
    readOnly = false,
    disabled = false,
  }: {
    readOnly?: boolean;
    disabled?: boolean;
  }) {
    const [document, setDocument] = React.useState(current);
    return (
      <StudioSheet
        document={document}
        readOnly={readOnly}
        disabled={disabled}
        onChange={(next) => {
          current = next;
          changed(next);
          setDocument(next);
        }}
      />
    );
  }
  const view = render(<Harness />);
  return {
    changed,
    current: () => current,
    permissions: (value: { readOnly?: boolean; disabled?: boolean }) =>
      view.rerender(<Harness {...value} />),
  };
}
function select(address: string) {
  const input = screen.getByRole('textbox', { name: '单元格地址' });
  fireEvent.change(input, { target: { value: address } });
  fireEvent.keyDown(input, { key: 'Enter' });
}

describe('Sheet actual advanced text entry', () => {
  it('derives the visible array range after an upstream sheet grows without changing stored main dimensions', async () => {
    const user = userEvent.setup();
    const initial = fixture();
    initial.defaultFont = { family: 'Arial', sizePt: 24, bold: false, italic: false };
    initial.sheets[0].rowCount = 200;
    initial.sheets[0].cells = {
      A1: { input: "=SEQUENCE('Counter'!A1)", array: { type: 'dynamic' } },
    };
    initial.sheets.push({
      id: 'counter',
      name: 'Counter',
      rowCount: 1,
      columnCount: 1,
      cells: { A1: { input: '200' } },
    });
    const f = setup(initial);
    expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', '201');
    await user.click(screen.getByRole('tab', { name: 'Counter' }));
    const formula = screen.getByRole('textbox', { name: '表格公式栏' });
    fireEvent.focus(formula);
    fireEvent.change(formula, { target: { value: '205' } });
    fireEvent.keyDown(formula, { key: 'Enter' });
    await user.click(screen.getByRole('tab', { name: 'Text' }));
    expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', '206');
    select('A205');
    expect(screen.getByRole('gridcell', { name: 'A205' })).toHaveTextContent('205');
    expect(parseFloat(screen.getByRole('gridcell', { name: 'A205' }).style.height)).toBeGreaterThan(
      36.8
    );
    expect(f.current().sheets[0].rowCount).toBe(200);
  });
  it.each([false, true])(
    'keeps a hidden merge origin visible without drawing zero-sized ordinary cells (hidden row: %s)',
    (hiddenRow) => {
      const initial = fixture(),
        sheet = initial.sheets[0];
      sheet.rowCount = 3;
      sheet.columnCount = 4;
      sheet.hiddenColumns = ['A'];
      sheet.hiddenRows = hiddenRow ? [1] : [];
      sheet.merges = [hiddenRow ? 'A1:C2' : 'A1:C1'];
      sheet.cells = {
        A1: { input: 'Merged', fontSize: 24, wrap: true },
        D2: { input: 'Visible tail' },
        D3: { input: 'Control row' },
      };
      expect(() => setup(initial)).not.toThrow();
      const master = screen.getByRole('gridcell', { name: 'A1' });
      expect(master).toHaveTextContent('Merged');
      expect(parseFloat(master.style.width)).toBeGreaterThan(0);
      expect(parseFloat(master.style.height)).toBeGreaterThan(36.8);
      expect(screen.getByRole('gridcell', { name: 'D3' })).toHaveTextContent('Control row');
      expect(screen.queryByRole('gridcell', { name: 'A3' })).toBeNull();
      expect(screen.queryByRole('separator', { name: 'A 列宽' })).toBeNull();
      if (hiddenRow) expect(screen.queryByRole('gridcell', { name: 'D1' })).toBeNull();
      if (hiddenRow) expect(screen.queryByRole('separator', { name: '1 行高' })).toBeNull();
    }
  );
  it('gives a wide center-across heading its full font height without single-column shrink or wrap inflation', async () => {
    const user = userEvent.setup();
    const initial = fixture();
    initial.sheets[0].cells = {
      A1: { input: 'LongHeading', fontSize: 24, align: 'centerContinuous', shrinkToFit: true },
      B1: { input: '', align: 'centerContinuous' },
      C1: { input: '', align: 'centerContinuous' },
    };
    const f = setup(initial);
    const owner = screen.getByRole('gridcell', { name: 'A1' });
    const height = parseFloat(owner.style.height);
    expect(height).toBeGreaterThan(36.8);
    expect(owner.querySelector('.zuvi-studio-sheet-text')).toHaveAttribute(
      'data-effective-font-size',
      '24'
    );
    await user.click(screen.getByRole('button', { name: '自动换行' }));
    expect(parseFloat(owner.style.height)).toBe(height);
    expect(owner.querySelectorAll('.zuvi-studio-sheet-text-transform>span')).toHaveLength(1);
    expect(f.changed).toHaveBeenCalledTimes(1);
    expect(f.current().sheets[0].rowHeights).toBeUndefined();
  });
  it('requires the current cell draft to be valid before opening the format entry', async () => {
    const user = userEvent.setup();
    const f = setup();
    const formula = screen.getByRole('textbox', { name: '表格公式栏' });
    fireEvent.focus(formula);
    fireEvent.change(formula, { target: { value: 'x'.repeat(32768) } });
    await user.click(screen.getByRole('button', { name: '文字排版' }));
    expect(screen.queryByRole('dialog', { name: '单元格文字排版' })).toBeNull();
    expect(f.changed).not.toHaveBeenCalled();
    fireEvent.keyDown(formula, { key: 'Escape' });
    await user.click(screen.getByRole('button', { name: '文字排版' }));
    expect(screen.getByRole('dialog', { name: '单元格文字排版' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(f.changed).not.toHaveBeenCalled();
  });
  it('applies mixed alignment and rotation as one undoable transaction while retaining formulas and links', async () => {
    const user = userEvent.setup();
    const initial = fixture();
    const f = setup(initial);
    select('A1:B1');
    await user.click(screen.getByRole('button', { name: '文字排版' }));
    const dialog = screen.getByRole('dialog', { name: '单元格文字排版' });
    expect(dialog).toHaveTextContent('只应用本次修改');
    const horizontal = within(dialog).getByRole('button', { name: /^文字水平对齐/ });
    await user.click(horizontal);
    const options = globalThis.document.getElementById(horizontal.getAttribute('aria-controls')!)!;
    await user.click(within(options).getByRole('option', { name: '分散对齐' }));
    const rotation = within(dialog).getByRole('textbox', { name: '文字旋转角度' });
    fireEvent.change(rotation, { target: { value: '45' } });
    await user.click(within(dialog).getByRole('button', { name: '应用排版' }));
    expect(f.changed).toHaveBeenCalledTimes(1);
    expect(f.current().sheets[0].cells.A1).toMatchObject({
      input: 'ABC',
      align: 'distributed',
      indent: 0,
      textRotation: 45,
    });
    expect(f.current().sheets[0].cells.B1).toMatchObject({
      input: '=A1',
      align: 'distributed',
      indent: 0,
      textRotation: 45,
    });
    expect(f.current().sheets[0].hyperlinks).toBe(initial.sheets[0].hyperlinks);
    const next = f.current();
    await user.click(screen.getByRole('button', { name: '撤销表格修改' }));
    expect(f.current()).toBe(initial);
    await user.click(screen.getByRole('button', { name: '重做表格修改' }));
    expect(f.current()).toBe(next);
  });

  it('holds malformed numeric drafts, supports cancel, and blocks apply when permissions change', async () => {
    const user = userEvent.setup();
    const f = setup();
    await user.click(screen.getByRole('button', { name: '文字排版' }));
    const dialog = screen.getByRole('dialog', { name: '单元格文字排版' });
    const indent = within(dialog).getByRole('textbox', { name: '文字缩进' });
    fireEvent.change(indent, { target: { value: '251' } });
    fireEvent.blur(indent);
    expect(within(dialog).getByRole('alert')).toHaveTextContent('0 至 250');
    expect(within(dialog).getByRole('button', { name: '应用排版' })).toBeDisabled();
    expect(screen.getByRole('grid').closest('.zuvi-studio-sheet')).toHaveAttribute(
      'data-studio-input-error'
    );
    fireEvent.change(indent, { target: { value: '3' } });
    fireEvent.keyDown(indent, { key: 'Enter', isComposing: true, keyCode: 229 });
    expect(f.changed).not.toHaveBeenCalled();
    f.permissions({ readOnly: true });
    expect(within(dialog).getByRole('button', { name: '应用排版' })).toBeDisabled();
    expect(indent).toBeDisabled();
    await user.click(within(dialog).getByRole('button', { name: '取消' }));
    expect(f.changed).not.toHaveBeenCalled();
    expect(screen.getByRole('grid').closest('.zuvi-studio-sheet')).not.toHaveAttribute(
      'data-studio-input-error'
    );
    expect(screen.getByRole('button', { name: '文字排版' })).toBeDisabled();
  });

  it('rejects the full protected selection inside the dialog without adding history', async () => {
    const user = userEvent.setup();
    const initial = fixture();
    initial.sheets[0].protectedRanges = ['B1'];
    const f = setup(initial);
    select('A1:B1');
    await user.click(screen.getByRole('button', { name: '文字排版' }));
    const dialog = screen.getByRole('dialog', { name: '单元格文字排版' });
    await user.click(within(dialog).getByRole('checkbox', { name: '缩小字体填充' }));
    await user.click(within(dialog).getByRole('button', { name: '应用排版' }));
    expect(within(dialog).getByRole('alert')).toHaveTextContent('受保护区域');
    expect(f.current()).toBe(initial);
    expect(f.changed).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole('button', { name: '取消' }));
    expect(screen.getByRole('button', { name: '撤销表格修改' })).toBeDisabled();
  });

  it('uses the actual workbook default font for toolbar, clearing and format painting', async () => {
    const user = userEvent.setup();
    const initial = fixture();
    initial.sheets[0].cells.C1 = {
      input: 'Target',
      fontFamily: 'Courier New',
      fontSize: 16,
      bold: false,
      italic: false,
      textRotation: 30,
    };
    const f = setup(initial);
    expect(screen.getByRole('combobox', { name: '表格字体' })).toHaveValue('Arial');
    expect(screen.getByRole('combobox', { name: '表格字号' })).toHaveValue('9.5');
    expect(screen.getByRole('button', { name: '表格加粗' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await user.click(screen.getByRole('button', { name: '格式刷' }));
    select('C1');
    fireEvent.keyDown(screen.getByRole('grid'), { key: 'Enter' });
    expect(f.current().sheets[0].cells.C1).toMatchObject({
      input: 'Target',
      fontFamily: 'Arial',
      fontSize: 9.5,
      bold: true,
      italic: true,
      textRotation: 0,
    });
    await user.click(screen.getByRole('button', { name: '表格加粗' }));
    expect(f.current().sheets[0].cells.C1.bold).toBe(false);
    await user.click(screen.getByRole('button', { name: '清除格式' }));
    expect(f.current().sheets[0].cells.C1).toMatchObject({
      fontFamily: 'Arial',
      fontSize: 9.5,
      bold: true,
      italic: true,
    });
  });

  it('draws shrink and center across actual cells and derives auto height without another document edit', async () => {
    const user = userEvent.setup();
    const initial = fixture();
    initial.sheets[0].cells.A1 = {
      input: 'This is a long line to shrink',
      fontSize: 22,
      shrinkToFit: true,
    };
    initial.sheets[0].cells.B1 = { input: 'Title', align: 'centerContinuous' };
    initial.sheets[0].cells.C1 = { input: '', align: 'centerContinuous' };
    const f = setup(initial);
    const a1 = screen.getByRole('gridcell', { name: 'A1' });
    expect(a1.querySelector('[data-shrink-applied]')).not.toBeNull();
    const b1 = screen.getByRole('gridcell', { name: 'B1' });
    expect(b1).toHaveAttribute('data-center-continuous-span', '2:3');
    expect(b1.querySelector('.zuvi-studio-sheet-text')).toHaveStyle({ width: '224px' });
    const before = parseFloat(screen.getByRole('gridcell', { name: 'A2' }).style.height);
    expect(before).toBeGreaterThan(24);
    select('A2');
    await user.click(screen.getByRole('button', { name: '自动换行' }));
    expect(parseFloat(screen.getByRole('gridcell', { name: 'A2' }).style.height)).toBeLessThan(
      before
    );
    expect(f.changed).toHaveBeenCalledTimes(1);
    expect(f.current().sheets[0].rowHeights).toBeUndefined();
  });
});
