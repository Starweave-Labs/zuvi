import * as React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
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
    id: 'number-test',
    name: 'format.xlsx',
    kind: 'excel',
    activeSheetId: 's',
    sheets: [
      {
        id: 's',
        name: 'Data',
        rowCount: 12,
        columnCount: 8,
        cells: {
          A1: { input: '-12.5', numberFormat: '0.0' },
          A2: { input: '0' },
          A3: { input: "'abc" },
          B1: { input: '=A1*2' },
          C1: { input: '45351.75' },
        },
      },
    ],
  };
}
function setup(initial = fixture(), permissions = { readOnly: false, disabled: false }) {
  let current = initial;
  const changed = vi.fn();
  function Harness(props: { readOnly: boolean; disabled: boolean }) {
    const [doc, setDoc] = React.useState(initial);
    return (
      <StudioSheet
        document={doc}
        {...props}
        onChange={(next) => {
          current = next;
          changed(next);
          setDoc(next);
        }}
      />
    );
  }
  const view = render(<Harness {...permissions} />);
  return {
    current: () => current,
    changed,
    permissions: (next: typeof permissions) => view.rerender(<Harness {...next} />),
  };
}
function range(value: string) {
  const input = screen.getByLabelText('单元格地址');
  fireEvent.change(input, { target: { value } });
  fireEvent.keyDown(input, { key: 'Enter' });
}
const cell = (address: string) => screen.getByRole('gridcell', { name: address });
it('previews mixed selections, preserves raw input, applies one transaction and supports undo/redo and cancellation', async () => {
  const user = userEvent.setup();
  const f = setup();
  range('A1:B3');
  await user.click(screen.getByRole('button', { name: '自定义数字格式' }));
  const dialog = screen.getByRole('dialog');
  expect(within(dialog).getByText(/选区包含多种格式/)).toBeVisible();
  const code = within(dialog).getByLabelText('数字格式代码');
  fireEvent.change(code, { target: { value: '0.00;[Red](0.00);"零";"文本："@' } });
  expect(within(dialog).getByText('(1234.56)')).toBeVisible();
  expect(within(dialog).getByText('文本：文本')).toBeVisible();
  await user.click(within(dialog).getByRole('button', { name: '应用格式' }));
  expect(f.changed).toHaveBeenCalledTimes(1);
  expect(f.current().sheets[0].cells.B1.input).toBe('=A1*2');
  expect(cell('A1')).toHaveTextContent('(12.50)');
  expect(cell('A1')).toHaveStyle({ color: '#ff0000' });
  expect(cell('A2')).toHaveTextContent('零');
  expect(cell('A3')).toHaveTextContent('文本：abc');
  await user.click(screen.getByRole('button', { name: '撤销表格修改' }));
  expect(cell('A1')).toHaveTextContent('-12.5');
  expect(f.current().sheets[0].cells.A2.numberFormat).toBeUndefined();
  await user.click(screen.getByRole('button', { name: '重做表格修改' }));
  expect(cell('B1')).toHaveTextContent('(25.00)');
  await user.click(screen.getByRole('button', { name: '自定义数字格式' }));
  fireEvent.change(screen.getByLabelText('数字格式代码'), { target: { value: '0.000' } });
  await user.click(screen.getByRole('button', { name: '取消' }));
  expect(f.changed).toHaveBeenCalledTimes(3);
});
it('retains invalid drafts, guards protected selections atomically and disables an open dialog when permissions change', async () => {
  const user = userEvent.setup();
  const doc = fixture();
  doc.sheets[0].protectedRanges = ['A2:A2'];
  const f = setup(doc);
  range('A1:A2');
  await user.click(screen.getByRole('button', { name: '自定义数字格式' }));
  const code = screen.getByLabelText('数字格式代码');
  fireEvent.change(code, { target: { value: 'garbage' } });
  expect(code).toHaveValue('garbage');
  expect(screen.getByRole('alert')).toBeVisible();
  expect(screen.getByRole('button', { name: '应用格式' })).toBeDisabled();
  fireEvent.change(code, { target: { value: '0.00' } });
  await user.click(screen.getByRole('button', { name: '应用格式' }));
  expect(screen.getByRole('alert')).toHaveTextContent('受保护区域');
  expect(f.changed).not.toHaveBeenCalled();
  f.permissions({ readOnly: true, disabled: false });
  expect(code).toBeDisabled();
  expect(screen.getByRole('button', { name: '应用格式' })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: '取消' }));
  expect(screen.getByRole('button', { name: '自定义数字格式' })).toBeDisabled();
  f.permissions({ readOnly: false, disabled: true });
  expect(screen.getByRole('button', { name: '自定义数字格式' })).toBeDisabled();
});
it('commits a valid input draft before capturing preview and keeps invalid cell input from opening the dialog', async () => {
  const user = userEvent.setup();
  const f = setup();
  const formula = screen.getByLabelText('表格公式栏');
  fireEvent.focus(formula);
  fireEvent.change(formula, { target: { value: '123.5' } });
  await user.click(screen.getByRole('button', { name: '自定义数字格式' }));
  expect(f.current().sheets[0].cells.A1.input).toBe('123.5');
  expect(within(screen.getByRole('dialog')).getByText('123.5')).toBeVisible();
  await user.click(screen.getByRole('button', { name: '取消' }));
  fireEvent.focus(formula);
  fireEvent.change(formula, { target: { value: 'x'.repeat(32768) } });
  await user.click(screen.getByRole('button', { name: '自定义数字格式' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(f.changed).toHaveBeenCalledTimes(1);
});
it('changes the native region tag and previews Chinese dates without converting the serial value', async () => {
  const user = userEvent.setup();
  const f = setup();
  range('C1');
  await user.click(screen.getByRole('button', { name: '自定义数字格式' }));
  fireEvent.change(screen.getByLabelText('数字格式代码'), {
    target: { value: 'dddd, mmmm d, yyyy hh:mm AM/PM' },
  });
  await user.click(screen.getByRole('button', { name: /^格式地区/ }));
  await user.click(screen.getByRole('option', { name: '中文（中国）' }));
  expect(screen.getAllByText('星期四, 2月 29, 2024 06:00 下午')[0]).toBeVisible();
  await user.click(screen.getByRole('button', { name: '应用格式' }));
  expect(f.current().sheets[0].cells.C1).toEqual({
    input: '45351.75',
    numberFormat: '[$-0804]dddd, mmmm d, yyyy hh:mm AM/PM',
  });
});
