import { afterEach, describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { WordBookmark, wordAddBookmark, wordBookmarkName, wordBookmarks, wordGoToBookmark, wordRemoveBookmark } from './studio-word-bookmarks';
let editor: Editor;
afterEach(() => editor?.destroy());
function create() {
  editor = new Editor({ extensions: [StarterKit, WordBookmark], content: '<p>first</p><p>second</p>' });
  return editor;
}
describe('Word bookmark ranges', () => {
  it('keeps a cross-paragraph range and text through independent add/remove history', () => {
    create(); editor.commands.setTextSelection({ from: 2, to: 12 });
    const text = editor.state.doc.textContent;
    expect(wordAddBookmark(editor, '范围_1')).toBe(true);
    expect(editor.state.doc.textContent).toBe(text);
    expect(wordBookmarks(editor.state.doc)).toEqual([{ id: '0', name: '范围_1', from: 2, to: 13 }]);
    editor.commands.undo(); expect(wordBookmarks(editor.state.doc)).toEqual([]);
    editor.commands.redo(); expect(wordBookmarks(editor.state.doc)).toHaveLength(1);
    expect(wordRemoveBookmark(editor, '范围_1')).toBe(true);
    expect(editor.state.doc.textContent).toBe(text);
    expect(wordBookmarks(editor.state.doc)).toEqual([]);
    editor.commands.undo(); expect(wordBookmarks(editor.state.doc)).toHaveLength(1);
    editor.commands.redo(); expect(wordBookmarks(editor.state.doc)).toEqual([]);
  });
  it('maps endpoints during editing and navigates without adding history', () => {
    create(); editor.commands.setTextSelection({ from: 2, to: 5 }); wordAddBookmark(editor, 'Here');
    editor.commands.setTextSelection(1); editor.commands.insertContent('xx');
    expect(wordBookmarks(editor.state.doc)[0]).toMatchObject({ from: 4, to: 8 });
    wordGoToBookmark(editor, 'Here', true);
    expect(editor.state.selection.from).toBe(5); expect(editor.state.selection.to).toBe(8);
    editor.commands.undo(); expect(wordBookmarks(editor.state.doc)[0]).toMatchObject({ from: 2, to: 6 });
  });
  it('rejects duplicate and invalid names without changing data; guards readonly and composing', () => {
    create(); editor.commands.setTextSelection(2); wordAddBookmark(editor, 'Here');
    const snapshot = editor.getJSON();
    expect(() => wordAddBookmark(editor, 'Here')).toThrow('同名');
    expect(() => wordAddBookmark(editor, 'a b')).toThrow('名称');
    expect(editor.getJSON()).toEqual(snapshot);
    editor.setEditable(false);
    expect(wordAddBookmark(editor, 'Other')).toBe(false); expect(wordRemoveBookmark(editor, 'Here')).toBe(false);
    expect(wordGoToBookmark(editor, 'Here')).toBe(true); expect(editor.getJSON()).toEqual(snapshot);
    editor.setEditable(true); editor.view.dom.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    expect(wordAddBookmark(editor, 'Other')).toBe(false); expect(wordRemoveBookmark(editor, 'Here')).toBe(false);
  });
  it('allocates identity across regions and rejects a name already used by another region', () => {
    create(); editor.commands.setTextSelection(2); wordAddBookmark(editor, 'Header');
    const header = editor.state.doc;
    editor.commands.setContent('<p>Body</p>'); editor.commands.setTextSelection(2);
    expect(() => wordAddBookmark(editor, 'Header', [header])).toThrow('同名');
    wordAddBookmark(editor, 'Body', [header]);
    expect(wordBookmarks(editor.state.doc)[0].id).toBe('1');
  });
  it('validates names and incomplete or duplicate native range markers', () => {
    expect(wordBookmarkName('_Ref1')).toBe('_Ref1'); expect(() => wordBookmarkName('1start')).toThrow();
    expect(() => wordBookmarkName('a'.repeat(41))).toThrow();
    create();
    const marker = (end: boolean) => ({ type: 'wordBookmark', attrs: { id: '0', name: 'Here', end } });
    editor.commands.setContent({ type: 'doc', content: [{ type: 'paragraph', content: [marker(false)] }] });
    expect(() => wordBookmarks(editor.state.doc)).toThrow('范围');
    editor.commands.setContent({ type: 'doc', content: [{ type: 'paragraph', content: [marker(true)] }] });
    expect(() => wordBookmarks(editor.state.doc)).toThrow('开始');
  });
});

it('removes an orphaned marker with the original delete and restores both endpoints in one undo', () => {
  create(); editor.commands.setTextSelection({ from: 2, to: 5 }); wordAddBookmark(editor, 'Here');
  editor.commands.deleteRange({ from: 1, to: 4 });
  expect(wordBookmarks(editor.state.doc)).toEqual([]);
  expect(editor.state.doc.textContent).toBe('rstsecond');
  editor.commands.undo();
  expect(wordBookmarks(editor.state.doc)).toHaveLength(1);
  expect(editor.state.doc.textContent).toBe('firstsecond');
  editor.commands.redo(); expect(wordBookmarks(editor.state.doc)).toEqual([]);
});
it('pastes bookmarked content as formatted text without duplicating source identities', () => {
  create(); editor.commands.setTextSelection({ from: 2, to: 5 }); wordAddBookmark(editor, 'Here');
  editor.commands.setTextSelection(editor.state.doc.content.size - 1);
  editor.view.pasteHTML('<p><span data-word-bookmark="0" data-word-bookmark-name="Here" data-word-bookmark-end="false"></span><strong>copied</strong><span data-word-bookmark="0" data-word-bookmark-name="Here" data-word-bookmark-end="true"></span></p>', new Event('paste') as ClipboardEvent);
  expect(wordBookmarks(editor.state.doc)).toHaveLength(1);
  expect(editor.state.doc.textContent).toContain('copied');
  expect(editor.getHTML()).toContain('<strong>copied</strong>');
});
