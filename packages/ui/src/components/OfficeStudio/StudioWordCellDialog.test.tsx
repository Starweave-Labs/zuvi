import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import { WordTableCell, WordTableHeader } from './studio-word-table-cell';
import { StudioWordCellDialog } from './StudioWordCellDialog';
let editor: Editor;
afterEach(() => { cleanup(); editor?.destroy(); });
function create() {
  editor = new Editor({ extensions: [StarterKit, TableKit.configure({ tableCell: false, tableHeader: false }), WordTableCell, WordTableHeader], content: '<table><tr><td><p>Cell</p></td></tr></table>' });
  editor.commands.setTextSelection(4); return editor;
}
it('rejects invalid precision, preserves data during IME and cancels without a mutation', () => {
  create(); const before = editor.getJSON(), close = vi.fn();
  render(<StudioWordCellDialog editor={editor} blocked={false} onClose={close} />);
  const input = screen.getByLabelText('单元格left内边距');
  fireEvent.change(input, { target: { value: '1.01' } });
  fireEvent.click(screen.getByRole('button', { name: '应用单元格属性' }));
  expect(screen.getByRole('alert')).toHaveTextContent('精度'); expect(editor.getJSON()).toEqual(before);
  fireEvent.compositionStart(input);
  expect(screen.getByRole('button', { name: '应用单元格属性' })).toBeDisabled();
  fireEvent.compositionEnd(input);
  fireEvent.click(screen.getByRole('button', { name: '取消' }));
  expect(close).toHaveBeenCalledOnce(); expect(editor.getJSON()).toEqual(before);
});
it('disables an old draft immediately after external editor content changes', () => {
  create(); render(<StudioWordCellDialog editor={editor} blocked={false} onClose={() => undefined} />);
  act(() => { editor.view.dispatch(editor.state.tr.insertText('Changed', 4)); });
  expect(screen.getByRole('button', { name: '应用单元格属性' })).toBeDisabled();
  expect(screen.getByRole('button', { name: '下右对齐' })).toBeDisabled();
});
it('disables controls when permissions change', () => {
  create(); const view = render(<StudioWordCellDialog editor={editor} blocked={false} onClose={() => undefined} />);
  view.rerender(<StudioWordCellDialog editor={editor} blocked onClose={() => undefined} />);
  expect(screen.getByLabelText('单元格left内边距')).toBeDisabled();
  expect(screen.getByRole('button', { name: '应用单元格属性' })).toBeDisabled();
  expect(screen.getByLabelText('表格默认left内边距')).toBeDisabled();
  expect(screen.getByLabelText('单元格间距')).toBeDisabled();
  expect(screen.getByRole('button', { name: '恢复表格默认边距' })).toBeDisabled();
});
it('reacts to direct editor permission changes without needing a parent rerender', () => {
  create(); const original = editor.getJSON(), close = vi.fn();
  render(<StudioWordCellDialog editor={editor} blocked={false} onClose={close} />);
  const input = screen.getByLabelText('单元格left内边距');
  fireEvent.change(input, { target: { value: '8' } });
  act(() => editor.setEditable(false));
  expect(input).toHaveValue('8');
  expect(input).toBeDisabled();
  for (const side of ['top', 'right', 'bottom', 'left'])
    expect(screen.getByLabelText(`表格默认${side}内边距`)).toBeDisabled();
  expect(screen.getByLabelText('单元格间距')).toBeDisabled();
  expect(screen.getByRole('button', { name: '恢复表格默认边距' })).toBeDisabled();
  expect(screen.getByRole('button', { name: '下右对齐' })).toBeDisabled();
  expect(screen.getByRole('button', { name: '应用单元格属性' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: '应用单元格属性' }));
  expect(editor.getJSON()).toEqual(original); expect(close).not.toHaveBeenCalled();
  act(() => editor.setEditable(true));
  expect(input).not.toBeDisabled();
  expect(screen.getByRole('button', { name: '应用单元格属性' })).not.toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: '取消' }));
  expect(editor.getJSON()).toEqual(original); expect(close).toHaveBeenCalledOnce();
});
it('keeps controls disabled when the target editor is already composing at dialog opening', () => {
  create(); const original = editor.getJSON(), close = vi.fn();
  const composing = vi.spyOn(editor.view, 'composing', 'get').mockReturnValue(true);
  render(<StudioWordCellDialog editor={editor} blocked={false} onClose={close} />);
  expect(screen.getByLabelText('单元格top内边距')).toBeDisabled();
  expect(screen.getByRole('button', { name: '下右对齐' })).toBeDisabled();
  expect(screen.getByRole('button', { name: '应用单元格属性' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: '应用单元格属性' }));
  expect(editor.getJSON()).toEqual(original); expect(close).not.toHaveBeenCalled();
  composing.mockRestore();
});
