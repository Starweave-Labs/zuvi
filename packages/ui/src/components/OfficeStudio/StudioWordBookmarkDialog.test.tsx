import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { StudioWordBookmarkDialog } from './StudioWordBookmarkDialog';
import { WordBookmark, wordAddBookmark } from './studio-word-bookmarks';
const editors: Editor[] = [];
afterEach(() => { cleanup(); editors.forEach(editor => editor.destroy()); editors.length = 0; });
function create() { const editor = new Editor({ extensions: [StarterKit, WordBookmark], content: '<p>Target</p>' }); editors.push(editor); return editor; }
it('blocks a draft when another region changes and leaves the current document untouched', () => {
  const editor = create(), other = create(), snapshot = editor.getJSON();
  render(<StudioWordBookmarkDialog editor={editor} otherEditors={[other]} onClose={() => undefined} />);
  fireEvent.change(screen.getByLabelText('书签名称'), { target: { value: 'Here' } });
  expect(screen.getByRole('button', { name: '添加书签' })).toBeEnabled();
  act(() => { other.commands.insertContent('Changed'); });
  expect(screen.getByRole('button', { name: '添加书签' })).toBeDisabled();
  expect(screen.getByRole('alert')).toHaveTextContent('文档已变化');
  expect(editor.getJSON()).toEqual(snapshot);
});
it('disables mutations, input and navigation when the component becomes disabled', () => {
  const editor = create(); editor.commands.setTextSelection(2); wordAddBookmark(editor, 'Here');
  const view = render(<StudioWordBookmarkDialog editor={editor} onClose={() => undefined} />);
  view.rerender(<StudioWordBookmarkDialog editor={editor} disabled onClose={() => undefined} />);
  expect(screen.getByLabelText('书签名称')).toBeDisabled();
  expect(screen.getByRole('button', { name: '删除书签 Here' })).toBeDisabled();
  expect(screen.getByRole('button', { name: '跳转书签 Here' })).toBeDisabled();
});
