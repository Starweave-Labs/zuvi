import { Node, type Editor } from '@tiptap/react';
import { Plugin, TextSelection } from '@tiptap/pm/state';
import { closeHistory } from '@tiptap/pm/history';
import { Fragment, Slice, type Node as ProseMirrorNode } from '@tiptap/pm/model';

export function wordBookmarkName(input: unknown): string {
  if (typeof input !== 'string' || !/^[\p{L}_][\p{L}\p{N}_]{0,39}$/u.test(input))
    throw new Error('书签名称须以字母或下划线开头，最多40个字母、数字或下划线。');
  return input;
}
export const WordBookmark = Node.create({
  name: 'wordBookmark', group: 'inline', inline: true, atom: true, selectable: false,
  addAttributes: () => ({ id: { default: '' }, name: { default: '' }, end: { default: false } }),
  renderText: () => '',
  addProseMirrorPlugins: () => [new Plugin({
    props: {
      transformPasted(slice) {
        // Pasted text keeps its formatting; bookmark identities belong to the source document.
        const clean = (fragment: Fragment): Fragment => {
          const nodes: ProseMirrorNode[] = [];
          fragment.forEach(node => {
            if (node.type.name !== 'wordBookmark') nodes.push(node.isLeaf ? node : node.copy(clean(node.content)));
          });
          return Fragment.fromArray(nodes);
        };
        return new Slice(clean(slice.content), slice.openStart, slice.openEnd);
      },
    },
    appendTransaction(transactions, oldState, state) {
      if (!transactions.some(transaction => transaction.docChanged)) return null;
      let previous: WordBookmarkRange[];
      try { previous = wordBookmarks(oldState.doc); } catch { return null; }
      const positions = new Map<string, number[]>();
      state.doc.descendants((node, pos) => {
        if (node.type.name !== 'wordBookmark') return;
        const id = String(node.attrs.id);
        positions.set(id, [...(positions.get(id) || []), pos]);
      });
      const orphanPositions = previous.flatMap(range => {
        const surviving = positions.get(range.id) || [];
        return surviving.length === 1 ? surviving : [];
      }).sort((a, b) => b - a);
      if (!orphanPositions.length) return transactions.some(transaction => transaction.getMeta('wordBookmarkCommand')) ? closeHistory(state.tr) : null;
      const transaction = state.tr;
      for (const pos of orphanPositions) transaction.delete(pos, pos + 1);
      return transaction;
    },
  })],
  parseHTML: () => [{ tag: 'span[data-word-bookmark]', getAttrs: element => {
    const data = (element as HTMLElement).dataset;
    try {
      if (!/^\d+$/.test(data.wordBookmark || '')) return false;
      return { id: data.wordBookmark, name: wordBookmarkName(data.wordBookmarkName), end: data.wordBookmarkEnd === 'true' };
    } catch { return false; }
  } }],
  renderHTML: ({ node }) => ['span', {
    'data-word-bookmark': node.attrs.id, 'data-word-bookmark-name': node.attrs.name,
    'data-word-bookmark-end': String(node.attrs.end), 'aria-hidden': 'true',
    style: 'display:inline-block;width:0;overflow:hidden;', contenteditable: 'false',
  }],
});
export interface WordBookmarkRange { id: string; name: string; from: number; to: number }
export function wordBookmarks(doc: ProseMirrorNode): WordBookmarkRange[] {
  const starts = new Map<string, { name: string; pos: number }>();
  const ends = new Map<string, { name: string; pos: number }>();
  const names = new Set<string>();
  doc.descendants((node, pos) => {
    if (node.type.name !== 'wordBookmark') return;
    const id = String(node.attrs.id), name = wordBookmarkName(node.attrs.name);
    if (!/^\d+$/.test(id)) throw new Error('书签编号无效。');
    if (node.attrs.end) {
      if (ends.has(id)) throw new Error('书签结束标记重复。');
      ends.set(id, { name, pos });
    } else {
      if (starts.has(id) || names.has(name)) throw new Error('书签名称或编号重复。');
      starts.set(id, { name, pos }); names.add(name);
    }
  });
  const result: WordBookmarkRange[] = [];
  for (const [id, start] of starts) {
    const end = ends.get(id);
    if (end === undefined || end.pos <= start.pos || end.name !== start.name) throw new Error('书签起止范围不完整。');
    result.push({ id, name: start.name, from: start.pos, to: end.pos });
    ends.delete(id);
  }
  if (ends.size) throw new Error('书签缺少开始标记。');
  return result;
}
export function wordAddBookmark(editor: Editor, input: unknown, otherDocuments: ProseMirrorNode[] = []): boolean {
  if (editor.isDestroyed || !editor.isEditable || editor.view.composing) return false;
  const name = wordBookmarkName(input), ranges = [editor.state.doc, ...otherDocuments].flatMap(wordBookmarks);
  if (ranges.some(range => range.name === name)) throw new Error('同名书签已存在。');
  const selection = editor.state.selection;
  if (!(selection instanceof TextSelection) || !selection.$from.parent.inlineContent || !selection.$to.parent.inlineContent)
    throw new Error('请将光标或文字选区放在段落内。');
  const used = new Set(ranges.map(range => range.id));
  let next = 0;
  while (used.has(String(next))) next++;
  const type = editor.schema.nodes.wordBookmark;
  if (!type) throw new Error('编辑器未启用书签。');
  const transaction = closeHistory(editor.state.tr);
  transaction.insert(selection.to, type.create({ id: String(next), name, end: true }));
  transaction.insert(selection.from, type.create({ id: String(next), name, end: false }));
  transaction.setSelection(TextSelection.create(transaction.doc, selection.from + 1, selection.to + 1));
  wordBookmarks(transaction.doc);
  editor.view.dispatch(transaction.setMeta('wordBookmarkCommand', true).scrollIntoView());
  return true;
}
export function wordRemoveBookmark(editor: Editor, name: string): boolean {
  if (editor.isDestroyed || !editor.isEditable || editor.view.composing) return false;
  const range = wordBookmarks(editor.state.doc).find(item => item.name === name);
  if (!range) return false;
  const transaction = closeHistory(editor.state.tr).delete(range.to, range.to + 1).delete(range.from, range.from + 1);
  editor.view.dispatch(transaction.setMeta('wordBookmarkCommand', true).scrollIntoView());
  return true;
}
export function wordGoToBookmark(editor: Editor, name: string, select = false): boolean {
  if (editor.isDestroyed || editor.view.composing) return false;
  const range = wordBookmarks(editor.state.doc).find(item => item.name === name);
  if (!range) return false;
  editor.view.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, range.from + 1, select ? range.to : range.from + 1)).setMeta('addToHistory', false).scrollIntoView());
  editor.view.focus();
  return true;
}
