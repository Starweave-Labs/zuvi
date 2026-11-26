import { Editor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { NodeSelection } from '@tiptap/pm/state';
import { undoDepth } from '@tiptap/pm/history';
import { afterEach, expect, it } from 'vitest';
import { WordImage } from './studio-word-tools';
import { wordImageReplacementTarget, wordReplaceImage } from './studio-word-image-replace';
const editors: Editor[] = [];
afterEach(() => {
  editors.splice(0).forEach((editor) => editor.destroy());
});
function fixture() {
  const editor = new Editor({
    extensions: [StarterKit, WordImage],
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'image',
              attrs: {
                src: 'data:image/png;base64,aAAA',
                width: 300,
                height: 150,
                alt: '原说明',
                crop: { left: 25, right: 25, top: 0, bottom: 0 },
              },
              marks: [{ type: 'bold' }],
            },
          ],
        },
      ],
    },
  });
  editors.push(editor);
  editor.view.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, 1)));
  return editor;
}
it('replaces the original raster in one transaction while preserving display dimensions and marks', () => {
  const editor = fixture(),
    before = editor.state.doc;
  const target = wordImageReplacementTarget(editor)!;
  expect(wordReplaceImage(target, 'data:image/jpeg;base64,bAAA')).toBe(true);
  expect(editor.state.doc.nodeAt(1)!.attrs).toMatchObject({
    src: 'data:image/jpeg;base64,bAAA',
    width: 300,
    height: 150,
    alt: '原说明',
    crop: null,
  });
  expect(editor.state.doc.nodeAt(1)!.marks).toEqual(before.nodeAt(1)!.marks);
  expect(editor.state.selection).toBeInstanceOf(NodeSelection);
  editor.commands.undo();
  expect(editor.state.doc.eq(before)).toBe(true);
  editor.commands.redo();
  expect(editor.state.doc.nodeAt(1)!.attrs.src).toBe('data:image/jpeg;base64,bAAA');
});
it('rejects invalid, stale, composing and readonly requests without history or content changes', () => {
  const editor = fixture(),
    target = wordImageReplacementTarget(editor)!,
    before = editor.state.doc,
    depth = undoDepth(editor.state);
  expect(() => wordReplaceImage(target, 'https://example.com/image.png')).toThrow('有效');
  editor.setEditable(false);
  expect(wordReplaceImage(target, 'data:image/png;base64,bAAA')).toBe(false);
  expect(wordImageReplacementTarget(editor)).toBeNull();
  editor.setEditable(true);
  Object.defineProperty(editor.view, 'composing', { configurable: true, value: true });
  expect(wordReplaceImage(target, 'data:image/png;base64,bAAA')).toBe(false);
  expect(editor.state.doc.eq(before)).toBe(true);
  expect(undoDepth(editor.state)).toBe(depth);
  Object.defineProperty(editor.view, 'composing', { configurable: true, value: false });
  editor.commands.insertContent('后续修改');
  const changed = editor.state.doc;
  expect(() => wordReplaceImage(target, 'data:image/png;base64,bAAA')).toThrow('文档已变化');
  expect(editor.state.doc).toBe(changed);
});
