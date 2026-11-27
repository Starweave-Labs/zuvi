import type { Editor } from '@tiptap/react';
import { NodeSelection } from '@tiptap/pm/state';
import { closeHistory } from '@tiptap/pm/history';
import { safeWordImageSource } from './studio-word-tools';

export function wordImageReplacementTarget(editor: Editor) {
  if (editor.isDestroyed || !editor.isEditable || editor.view.composing) return null;
  const selection = editor.state.selection;
  if (!(selection instanceof NodeSelection) || selection.node.type.name !== 'image') return null;
  return { editor, doc: editor.state.doc, selection };
}
export type WordImageReplacementTarget = NonNullable<ReturnType<typeof wordImageReplacementTarget>>;

/** File reading happens before this atomic command; stale file requests never overwrite new edits. */
export function wordReplaceImage(target: WordImageReplacementTarget, source: string) {
  const { editor, doc, selection } = target;
  if (editor.isDestroyed || !editor.isEditable || editor.view.composing) return false;
  if (editor.state.doc !== doc) throw new Error('文档已变化，请重新选择要替换的图片。');
  if (!safeWordImageSource(source)) throw new Error('请选择有效的 PNG 或 JPEG 图片。');
  const attrs = { ...selection.node.attrs, src: source, crop: null };
  if (selection.node.attrs.src === source && selection.node.attrs.crop == null) return false;
  const transaction = closeHistory(editor.state.tr).setNodeMarkup(
    selection.from,
    undefined,
    attrs,
    selection.node.marks
  );
  transaction.setSelection(NodeSelection.create(transaction.doc, selection.from));
  editor.view.dispatch(transaction.scrollIntoView());
  return true;
}
