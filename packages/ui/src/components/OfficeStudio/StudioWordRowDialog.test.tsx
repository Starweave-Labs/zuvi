import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { StudioWordRowDialog } from './StudioWordRowDialog';
import { wordRowProperties } from './studio-word-table-rows';
afterEach(cleanup);
it('applies only edited fields in a mixed selection and retains invalid drafts', () => {
  const onSave = vi.fn(),
    onClose = vi.fn();
  render(
    <StudioWordRowDialog
      rows={[
        wordRowProperties({ rowHeight: 24, allowSplit: false }),
        wordRowProperties({ rowHeight: 36, allowSplit: true }),
      ]}
      blocked={false}
      onSave={onSave}
      onClose={onClose}
    />
  );
  const height = screen.getByRole('spinbutton', { name: '表格行高' });
  fireEvent.change(height, { target: { value: '2001' } });
  expect(screen.getByRole('button', { name: '应用行属性' })).toBeDisabled();
  expect(onSave).not.toHaveBeenCalled();
  fireEvent.change(height, { target: { value: '48' } });
  fireEvent.compositionStart(height);
  expect(screen.getByRole('button', { name: '应用行属性' })).toBeDisabled();
  fireEvent.compositionEnd(height);
  fireEvent.click(screen.getByRole('button', { name: '应用行属性' }));
  expect(onSave).toHaveBeenCalledWith({ rowHeight: 48 });
  expect(onClose).toHaveBeenCalledTimes(1);
});
it('cancels without applying and disables every editable control in readonly mode', () => {
  const onSave = vi.fn(),
    onClose = vi.fn();
  const props = { rows: [wordRowProperties({})], onSave, onClose };
  const view = render(<StudioWordRowDialog {...props} blocked={false} />);
  fireEvent.change(screen.getByRole('spinbutton', { name: '表格行高' }), {
    target: { value: '30' },
  });
  fireEvent.click(screen.getByRole('button', { name: '取消' }));
  expect(onSave).not.toHaveBeenCalled();
  view.rerender(<StudioWordRowDialog {...props} blocked />);
  expect(screen.getByRole('spinbutton', { name: '表格行高' })).toBeDisabled();
  expect(screen.getByRole('button', { name: /^表格行高规则/ })).toBeDisabled();
  expect(screen.getByRole('button', { name: /^表格行跨页/ })).toBeDisabled();
  expect(screen.getByRole('button', { name: '应用行属性' })).toBeDisabled();
});
