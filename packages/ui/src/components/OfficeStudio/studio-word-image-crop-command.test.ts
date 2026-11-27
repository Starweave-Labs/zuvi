import { afterEach, expect, it } from 'vitest';
import { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { NodeSelection } from '@tiptap/pm/state';
import { undoDepth } from '@tiptap/pm/history';
import { WordImage } from './studio-word-tools';
import { wordSetImageCrop } from './studio-word-image-crop-command';
const editors: Editor[] = [];
afterEach(() => {
  editors.forEach((editor) => editor.destroy());
  editors.length = 0;
});
function fixture() {
  const editor = new Editor({
    extensions: [StarterKit, WordImage],
    content:
      '<p><strong><img src="data:image/png;base64,iVBORw0KGgo=" width="200" height="100" alt="Original"></strong></p>',
  });
  editors.push(editor);
  editor.view.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, 1)));
  return editor;
}
it('preserves original bytes, dimensions and marks while cropping and resetting in separate history steps', () => {
  const editor = fixture(),
    before = editor.state.doc;
  expect(wordSetImageCrop(editor, { left: 25, right: 10 })).toBe(true);
  const node = editor.state.doc.nodeAt(1)!;
  expect(node.attrs.crop).toEqual({ left: 25, top: 0, right: 10, bottom: 0 });
  expect(node.attrs.src).toBe(before.nodeAt(1)!.attrs.src);
  expect(node.attrs.width).toBe(200);
  expect(node.marks).toEqual(before.nodeAt(1)!.marks);
  expect(wordSetImageCrop(editor, null)).toBe(true);
  expect(editor.state.doc.nodeAt(1)!.attrs.crop).toBeNull();
  editor.commands.undo();
  expect(editor.state.doc.nodeAt(1)!.attrs.crop.left).toBe(25);
  editor.commands.undo();
  expect(editor.state.doc.eq(before)).toBe(true);
  editor.commands.redo();
  expect(editor.state.doc.nodeAt(1)!.attrs.crop.left).toBe(25);
});
it('does not create history for invalid, unchanged, protected or composing operations', () => {
  const editor = fixture(),
    before = editor.state.doc,
    depth = undoDepth(editor.state);
  expect(() => wordSetImageCrop(editor, { left: 50, right: 50 })).toThrow();
  expect(wordSetImageCrop(editor, null)).toBe(false);
  editor.setEditable(false);
  expect(wordSetImageCrop(editor, { left: 5 })).toBe(false);
  editor.setEditable(true);
  Object.defineProperty(editor.view, 'composing', { configurable: true, value: true });
  expect(wordSetImageCrop(editor, { left: 5 })).toBe(false);
  expect(editor.state.doc.eq(before)).toBe(true);
  expect(undoDepth(editor.state)).toBe(depth);
});

it('renders a crop frame without changing the embedded image and removes clipping on reset', () => {
  const editor = fixture();
  const container = document.createElement('div');
  document.body.append(container);
  editor.mount(container);
  editor.view.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, 1)));
  expect(wordSetImageCrop(editor, { left: 25, right: 25 })).toBe(true);
  const frame = container.querySelector<HTMLElement>('[data-word-image-crop-frame]')!;
  const image = frame.querySelector('img')!;
  expect(frame.style.overflow).toBe('hidden');
  expect(image.style.width).toBe('200%');
  expect(image.style.left).toBe('-50%');
  expect(image.getAttribute('src')).toBe('data:image/png;base64,iVBORw0KGgo=');
  expect(wordSetImageCrop(editor, null)).toBe(true);
  expect(frame.style.overflow).toBe('');
  expect(image.style.position).toBe('');
  container.remove();
});

it('serializes visible clipping and parses the same crop and original image back', () => {
  const editor = fixture();
  wordSetImageCrop(editor, { left: 25, right: 25 });
  const html = editor.getHTML();
  expect(html).toContain('overflow: hidden');
  expect(html).toContain('width: 200%');
  const original = editor.state.doc.toJSON();
  editor.commands.setContent(html);
  expect(editor.state.doc.toJSON()).toEqual(original);
});
it('keeps a reset after redo as a separate history event', () => {
  const editor = fixture();
  wordSetImageCrop(editor, { left: 25 });
  editor.commands.undo(); editor.commands.redo();
  wordSetImageCrop(editor, null);
  editor.commands.undo();
  expect(editor.state.doc.nodeAt(1)!.attrs.crop.left).toBe(25);
});
