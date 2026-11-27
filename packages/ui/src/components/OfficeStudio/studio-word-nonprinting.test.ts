import { afterEach, describe, expect, it, vi } from 'vitest';
import { Editor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { undoDepth, redoDepth } from '@tiptap/pm/history';
import { WordNonprinting, wordSetNonprinting } from './studio-word-nonprinting';

const editors: Editor[] = [];
afterEach(() => {
  editors.forEach((editor) => editor.destroy());
  editors.length = 0;
});
function fixture() {
  const editor = new Editor({
    element: document.createElement('div'),
    extensions: [StarterKit, WordNonprinting],
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Title line' }] },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: '😀 A \tB\u00a0Z', marks: [{ type: 'bold' }] },
            { type: 'hardBreak' },
            { type: 'text', text: 'Next word' },
          ],
        },
        { type: 'paragraph' },
      ],
    },
  });
  editors.push(editor);
  return editor;
}

describe('Word nonprinting view decorations', () => {
  it('renders markers without changing Unicode text, formatting, document serialization or selection', () => {
    const editor = fixture();
    editor.commands.setTextSelection({ from: 13, to: 17 });
    const before = editor.getJSON();
    const html = editor.getHTML();
    const selection = editor.state.selection.toJSON();
    const text = editor.view.dom.textContent;
    const update = vi.fn();
    editor.on('update', update);
    wordSetNonprinting(editor, true);
    expect(editor.view.dom.querySelectorAll('[data-word-nonprinting="space"]')).toHaveLength(4);
    expect(editor.view.dom.querySelectorAll('[data-word-nonprinting="tab"]')).toHaveLength(1);
    expect(editor.view.dom.querySelectorAll('[data-word-nonprinting="nbsp"]')).toHaveLength(1);
    expect(editor.view.dom.querySelectorAll('[data-word-nonprinting="paragraph"]')).toHaveLength(3);
    expect(editor.view.dom.querySelectorAll('[data-word-nonprinting="line-break"]')).toHaveLength(
      1
    );
    expect(editor.view.dom.textContent).toBe(text);
    expect(editor.getJSON()).toEqual(before);
    expect(editor.getHTML()).toBe(html);
    expect(editor.state.selection.toJSON()).toEqual(selection);
    expect(update).not.toHaveBeenCalled();
    wordSetNonprinting(editor, false);
    expect(editor.view.dom.querySelector('[data-word-nonprinting]')).toBeNull();
    expect(editor.state.selection.toJSON()).toEqual(selection);
  });
  it('updates markers after edits and undo/redo without adding view toggles to the document history', () => {
    const editor = fixture();
    wordSetNonprinting(editor, true);
    editor.commands.setTextSelection(13);
    editor.commands.insertContent('New ');
    const edited = editor.getJSON();
    expect(undoDepth(editor.state)).toBe(1);
    const count = editor.view.dom.querySelectorAll('[data-word-nonprinting="space"]').length;
    wordSetNonprinting(editor, false);
    wordSetNonprinting(editor, true);
    expect(undoDepth(editor.state)).toBe(1);
    editor.commands.undo();
    expect(editor.view.dom.querySelectorAll('[data-word-nonprinting="space"]')).toHaveLength(
      count - 1
    );
    expect(redoDepth(editor.state)).toBe(1);
    wordSetNonprinting(editor, false);
    expect(redoDepth(editor.state)).toBe(1);
    editor.commands.redo();
    expect(editor.getJSON()).toEqual(edited);
    expect(editor.view.dom.querySelector('[data-word-nonprinting]')).toBeNull();
  });
  it('supports read-only views and regenerates markers after externally replacing content', () => {
    const editor = fixture();
    editor.setEditable(false);
    wordSetNonprinting(editor, true);
    expect(editor.view.dom.querySelector('[data-word-nonprinting]')).not.toBeNull();
    editor.commands.setContent('<p>New content</p>', { emitUpdate: false });
    expect(editor.view.dom.textContent).toBe('New content');
    expect(editor.view.dom.querySelectorAll('[data-word-nonprinting="paragraph"]')).toHaveLength(1);
    expect(editor.view.dom.querySelectorAll('[data-word-nonprinting="space"]')).toHaveLength(1);
  });
});
