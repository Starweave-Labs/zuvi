import * as React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StudioSheet from './StudioSheet';
import type { StudioExcelDocument } from './studio-types';

beforeEach(() => vi.stubGlobal('PointerEvent', MouseEvent));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function fixture(): StudioExcelDocument {
  return {
    version: 1,
    id: 'duplicates',
    name: 'Duplicates.xlsx',
    kind: 'excel',
    activeSheetId: 's',
    sheets: [
      {
        id: 's',
        name: 'Data',
        rowCount: 8,
        columnCount: 4,
        cells: {
          A1: { input: 'Key' },
          B1: { input: 'Amount' },
          A2: { input: 'Red' },
          B2: { input: '10', bold: true },
          A3: { input: 'Red' },
          B3: { input: '20' },
          A4: { input: 'Blue' },
          B4: { input: '30', italic: true },
          D4: { input: 'Outside' },
        },
      },
      { id: 'other', name: 'Other', rowCount: 8, columnCount: 4, cells: { A1: { input: 'Keep' } } },
    ],
  };
}
function setup(initial = fixture()) {
  let current = initial;
  const changed = vi.fn();
  function Harness(props: {
    readOnly?: boolean;
    disabled?: boolean;
    replacement?: StudioExcelDocument;
  }) {
    const [document, setDocument] = React.useState(initial);
    return (
      <StudioSheet
        document={props.replacement ?? document}
        disabled={props.disabled ?? false}
        readOnly={props.readOnly ?? false}
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
    current: () => current,
    changed,
    permissions: (props: {
      readOnly?: boolean;
      disabled?: boolean;
      replacement?: StudioExcelDocument;
    }) => view.rerender(<Harness {...props} />),
  };
}
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
function select(range = 'A1:B4') {
  const address = screen.getByRole('textbox', { name: '单元格地址' });
  fireEvent.change(address, { target: { value: range } });
  fireEvent.keyDown(address, { key: 'Enter' });
}
function open() {
  select();
  fireEvent.click(screen.getByRole('tab', { name: '数据' }));
  click('删除重复项');
  return screen.getByRole('dialog', { name: '删除重复项' });
}
describe('duplicate removal through actual spreadsheet controls', () => {
  it('compares selected columns, retains the header, reports counts and restores one history step', () => {
    const initial = fixture(),
      view = setup(initial);
    const dialog = open();
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'B 列 · Amount' }));
    click('删除重复记录');
    expect(view.changed).toHaveBeenCalledOnce();
    expect(view.current().sheets[0].cells.A1).toBe(initial.sheets[0].cells.A1);
    expect(view.current().sheets[0].cells.A3.input).toBe('Blue');
    expect(view.current().sheets[0].cells.B3).toMatchObject({ input: '30', italic: true });
    expect(view.current().sheets[0].cells.A4?.input ?? '').toBe('');
    expect(view.current().sheets[0].cells.D4).toBe(initial.sheets[0].cells.D4);
    expect(view.current().sheets[1]).toBe(initial.sheets[1]);
    expect(screen.getByText(/已删除 1 条重复记录，保留 2 条记录/)).toBeInTheDocument();
    expect(screen.getByRole('grid')).toHaveFocus();
    fireEvent.click(screen.getByRole('tab', { name: '开始' }));
    click('撤销表格修改');
    expect(view.current()).toBe(initial);
    click('重做表格修改');
    expect(view.current().sheets[0].cells.A3.input).toBe('Blue');
    fireEvent.click(screen.getByRole('tab', { name: '数据' }));
    click('删除重复项');
    click('删除重复记录');
    expect(view.changed).toHaveBeenCalledTimes(3);
    expect(screen.getByText(/已删除 0 条重复记录/)).toBeInTheDocument();
  });
  it('keeps comparison choices after an error, permits correction and cancels without writing', () => {
    const initial = fixture();
    initial.sheets[0].protectedRanges = ['B3:B3'];
    const view = setup(initial),
      dialog = open();
    fireEvent.click(within(dialog).getByRole('button', { name: '取消全选列' }));
    expect(within(dialog).getByRole('button', { name: '删除重复记录' })).toBeDisabled();
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'A 列 · Key' }));
    click('删除重复记录');
    expect(within(dialog).getByRole('alert')).toHaveTextContent('受保护');
    expect(view.changed).not.toHaveBeenCalled();
    expect(within(dialog).getByRole('checkbox', { name: 'A 列 · Key' })).toBeChecked();
    click('取消');
    expect(view.current()).toBe(initial);
  });
  it('preserves configuration through permission changes and closes stale external documents', () => {
    const view = setup(),
      dialog = open();
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'B 列 · Amount' }));
    view.permissions({ readOnly: true });
    expect(within(dialog).getByRole('button', { name: '删除重复记录' })).toBeDisabled();
    view.permissions({});
    expect(within(dialog).getByRole('checkbox', { name: 'B 列 · Amount' })).not.toBeChecked();
    view.permissions({ replacement: { ...fixture(), name: 'External.xlsx' } });
    expect(screen.queryByRole('dialog', { name: '删除重复项' })).toBeNull();
    expect(view.changed).not.toHaveBeenCalled();
  });
  it('refuses composition and invalid cell drafts before opening, then recovers with Escape', () => {
    const view = setup();
    select();
    fireEvent.click(screen.getByRole('tab', { name: '数据' }));
    const formula = screen.getByRole('textbox', { name: '表格公式栏' });
    fireEvent.focus(formula);
    fireEvent.compositionStart(formula);
    fireEvent.change(formula, { target: { value: '输入中' } });
    click('删除重复项');
    expect(screen.queryByRole('dialog', { name: '删除重复项' })).toBeNull();
    expect(view.changed).not.toHaveBeenCalled();
    fireEvent.compositionEnd(formula);
    fireEvent.keyDown(formula, { key: 'Escape' });
    fireEvent.focus(formula);
    fireEvent.change(formula, { target: { value: 'x'.repeat(32768) } });
    click('删除重复项');
    expect(screen.queryByRole('dialog', { name: '删除重复项' })).toBeNull();
    expect(view.changed).not.toHaveBeenCalled();
    fireEvent.keyDown(formula, { key: 'Escape' });
    click('删除重复项');
    expect(screen.getByRole('dialog', { name: '删除重复项' })).toBeInTheDocument();
  });
  it('compares the first row when the header option is cleared and guards composition inside the dialog', () => {
    const view = setup();
    const dialog = open();
    const header = within(dialog).getByRole('checkbox', { name: '首行作为标题，不参与比较' });
    fireEvent.click(header);
    expect(within(dialog).getByRole('checkbox', { name: 'A 列' })).toBeChecked();
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'B 列' }));
    fireEvent.compositionStart(header);
    click('删除重复记录');
    expect(view.changed).not.toHaveBeenCalled();
    fireEvent.compositionEnd(header);
    click('删除重复记录');
    expect(screen.getByText(/已删除 1 条重复记录，保留 3 条记录/)).toBeInTheDocument();
  });
});
