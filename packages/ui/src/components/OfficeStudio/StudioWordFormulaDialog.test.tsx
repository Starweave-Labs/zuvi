import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { StudioWordFormulaDialog } from './StudioWordFormulaDialog';
afterEach(cleanup);
it('changes native numeric pictures through ZUVI options without accumulating switches', () => {
  const save = vi.fn();
  render(<StudioWordFormulaDialog initial="=A1*2" blocked={false} onClose={vi.fn()} onSave={save} />);
  const input = screen.getByRole('textbox', { name: '表格公式表达式' });
  fireEvent.click(screen.getByRole('button', { name: /^公式数字格式/ }));
  fireEvent.click(screen.getByRole('option', { name: '千位分隔' }));
  expect(input).toHaveValue('=A1*2 \\# "#,##0.00"');
  fireEvent.click(screen.getByRole('button', { name: /^公式数字格式/ }));
  fireEvent.click(screen.getByRole('option', { name: '百分比' }));
  expect(input).toHaveValue('=A1*2 \\# "0.00%"');
  fireEvent.click(screen.getByRole('button', { name: '保存公式' }));
  expect(save).toHaveBeenCalledWith('=A1*2 \\# "0.00%"');
});
