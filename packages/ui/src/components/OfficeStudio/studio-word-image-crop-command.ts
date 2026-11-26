import type { Editor } from '@tiptap/react';
import { NodeSelection } from '@tiptap/pm/state';
import { closeHistory } from '@tiptap/pm/history';
import { wordImageCrop } from './studio-word-image-crop';
export function wordSetImageCrop(editor: Editor, value: unknown): boolean {
  if (editor.isDestroyed || !editor.isEditable || editor.view.composing) return false;
  const selection = editor.state.selection;
  if (!(selection instanceof NodeSelection) || selection.node.type.name !== 'image')
    throw new Error('请先选择一张图片。');
  const crop = wordImageCrop(value);
  if (JSON.stringify(wordImageCrop(selection.node.attrs.crop)) === JSON.stringify(crop))
    return false;
  const transaction = closeHistory(editor.state.tr).setNodeMarkup(
    selection.from,
    undefined,
    { ...selection.node.attrs, crop },
    selection.node.marks
  );
  transaction.setSelection(NodeSelection.create(transaction.doc, selection.from));
  editor.view.dispatch(transaction.scrollIntoView());
  return true;
}
