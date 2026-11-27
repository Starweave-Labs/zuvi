import type { Editor } from '@tiptap/react';
import { Fragment } from '@tiptap/pm/model';
import { closeHistory } from '@tiptap/pm/history';
import { CellSelection } from '@tiptap/pm/tables';
import { TextSelection } from '@tiptap/pm/state';
import { wordSelectedTableRowRange, wordSplitTableRows } from './studio-word-table-row-range';
import { wordTableToText } from './studio-word-table-conversion';

export function wordTableRowConversionTarget(editor: Editor) {
  if (editor.isDestroyed || !(editor.state.selection instanceof CellSelection)) return null;
  const selection = editor.state.selection;
  const range = wordSelectedTableRowRange(selection);
  if (!range) return null;
  const table = selection.$anchorCell.node(-1);
  const from = selection.$anchorCell.before(selection.$anchorCell.depth - 1);
  return {
    doc: editor.state.doc,
    selection,
    from,
    to: from + table.nodeSize,
    ...wordSplitTableRows(table, range.first, range.end),
  };
}

export function wordApplyTableRowConversion(
  editor: Editor,
  target: NonNullable<ReturnType<typeof wordTableRowConversionTarget>>,
  separator: string | null,
  convertNested = false
) {
  if (editor.isDestroyed || !editor.isEditable || editor.view.composing) return false;
  if (editor.state.doc !== target.doc || !editor.state.selection.eq(target.selection))
    throw new Error('文档或选区已变化，请重新选择表格行。');
  const text = wordTableToText(editor.schema, target.selected, separator, convertNested);
  const replacement = Fragment.fromArray([
    ...(target.before ? [target.before] : []),
    ...Array.from({ length: text.childCount }, (_, index) => text.child(index)),
    ...(target.after ? [target.after] : []),
  ]);
  const tr = closeHistory(editor.state.tr).replaceWith(target.from, target.to, replacement);
  tr.setSelection(
    TextSelection.near(tr.doc.resolve(target.from + (target.before?.nodeSize ?? 0) + 1))
  );
  editor.view.dispatch(tr.scrollIntoView());
  editor.view.dispatch(closeHistory(editor.state.tr).setMeta('addToHistory', false));
  return true;
}
