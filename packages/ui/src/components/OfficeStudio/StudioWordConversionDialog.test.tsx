import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import { StudioWordConversionDialog } from './StudioWordConversionDialog';
import { wordConversionTarget } from './studio-word-table-conversion';
const editors: Editor[] = [];
afterEach(() => {
  cleanup();
  editors.forEach((editor) => editor.destroy());
  editors.length = 0;
});
function target() {
  const editor = new Editor({ extensions: [StarterKit, TableKit], content: '<p>A;B</p>' });
  editors.push(editor);
  editor.commands.setTextSelection(1);
  return wordConversionTarget(editor)!;
}
it('previews custom splitting, retains invalid/failed drafts and guards composition', () => {
  const onSave = vi.fn(() => {
    throw new Error('文档已变化');
  });
  render(
    <StudioWordConversionDialog
      target={target()}
      blocked={false}
      onClose={vi.fn()}
      onSave={onSave}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: /^转换分隔符/ }));
  fireEvent.click(screen.getByRole('option', { name: '自定义' }));
  expect(screen.getByText('1 行，2 列')).toBeInTheDocument();
  const input = screen.getByRole('textbox', { name: '自定义转换分隔符' });
  const save = screen.getByRole('button', { name: '转换' });
  fireEvent.change(input, { target: { value: ';;' } });
  expect(save).toBeDisabled();
  expect(onSave).not.toHaveBeenCalled();
  fireEvent.change(input, { target: { value: ';' } });
  fireEvent.compositionStart(input);
  expect(save).toBeDisabled();
  fireEvent.compositionEnd(input);
  fireEvent.click(save);
  expect(onSave).toHaveBeenCalledWith(';', 2, false);
  expect(screen.getByRole('alert')).toHaveTextContent('文档已变化');
  expect(input).toHaveValue(';');
});
it('cancels without writes and disables controls when permission changes', () => {
  const onSave = vi.fn(),
    onClose = vi.fn();
  const props = { target: target(), onSave, onClose };
  const view = render(<StudioWordConversionDialog {...props} blocked={false} />);
  fireEvent.click(screen.getByRole('button', { name: '取消' }));
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(onSave).not.toHaveBeenCalled();
  view.rerender(<StudioWordConversionDialog {...props} blocked />);
  expect(screen.getByRole('button', { name: /^转换分隔符/ })).toBeDisabled();
  expect(screen.getByRole('button', { name: '转换' })).toBeDisabled();
});

it('previews retained nested content and passes the recursive conversion choice through the actual control', () => {
  const editor = new Editor({
    extensions: [StarterKit, TableKit],
    content:
      '<table><tr><td><p>Outer</p><table><tr><td><p>Nested</p></td></tr></table></td></tr></table><p></p>',
  });
  editors.push(editor);
  editor.commands.setTextSelection(4);
  const onSave = vi.fn();
  const props = { target: wordConversionTarget(editor)!, onSave, onClose: vi.fn() };
  const view = render(<StudioWordConversionDialog {...props} blocked={false} />);
  fireEvent.click(screen.getByRole('checkbox', { name: '同时转换嵌套表格' }));
  fireEvent.click(screen.getByRole('button', { name: '转换' }));
  expect(onSave).toHaveBeenCalledWith('\t', 2, true);
  view.rerender(<StudioWordConversionDialog {...props} blocked />);
  expect(screen.getByRole('checkbox', { name: '同时转换嵌套表格' })).toBeDisabled();
});
