import type { Editor } from '@tiptap/react';
import { CellSelection } from '@tiptap/pm/tables';
import { closeHistory } from '@tiptap/pm/history';
import { wordCellProperties, type WordCellProperties } from './studio-word-cell-properties';
import { wordMergeTableProperties, type WordTablePropertiesPatch } from './studio-word-table-properties';

export function wordCellTable(editor: Editor) {
  if (editor.isDestroyed) return null;
  const { $from, to } = editor.state.selection;
  let depth = $from.depth;
  while (depth > 0 && $from.node(depth).type.name !== 'table') depth--;
  if (!depth || to > $from.end(depth)) return null;
  return { node: $from.node(depth), position: $from.before(depth) };
}

/** Apply the entire dialog, including table defaults, as one undo transaction. */
export function wordSetCellProperties(
  editor: Editor,
  input: WordCellProperties,
  horizontal?: 'left' | 'center' | 'right',
  tablePatch?: WordTablePropertiesPatch
): boolean {
  if (editor.isDestroyed || !editor.isEditable || editor.view.composing) return false;
  const patch = wordCellProperties(input);
  if (horizontal && !['left', 'center', 'right'].includes(horizontal))
    throw new Error('单元格水平对齐无效。');
  const positions = wordSelectedCellPositions(editor), table = wordCellTable(editor);
  if (!positions.length || !table) throw new Error('请将光标或选区放在同一表格单元格内。');
  const tableProperties = tablePatch && Object.keys(tablePatch).length
    ? wordMergeTableProperties(table.node.attrs, tablePatch) : null;
  const transaction = closeHistory(editor.state.tr);
  if (tableProperties) {
    const attrs = { ...table.node.attrs, ...tableProperties };
    if (JSON.stringify(attrs) !== JSON.stringify(table.node.attrs))
      transaction.setNodeMarkup(table.position, undefined, attrs);
    if (tablePatch?.cellSpacing !== undefined) table.node.forEach((row, offset) => {
      if (row.attrs.cellSpacing != null)
        transaction.setNodeMarkup(table.position + 1 + offset, undefined, { ...row.attrs, cellSpacing: null });
    });
  }
  for (const pos of positions) {
    const cell = editor.state.doc.nodeAt(pos)!;
    const attrs = {
      ...cell.attrs,
      ...patch,
      ...(patch.cellMargins ? {
        cellMargins: { ...(cell.attrs.cellMargins || {}), ...patch.cellMargins },
      } : {}),
    };
    if (JSON.stringify(attrs) !== JSON.stringify(cell.attrs))
      transaction.setNodeMarkup(pos, undefined, attrs);
    if (horizontal) cell.descendants((node, relative) => {
      if (['paragraph', 'heading'].includes(node.type.name) && node.attrs.textAlign !== horizontal)
        transaction.setNodeMarkup(pos + 1 + relative, undefined, { ...node.attrs, textAlign: horizontal });
      return node.type.name !== 'table';
    });
  }
  if (!transaction.docChanged) return false;
  editor.view.dispatch(transaction.scrollIntoView());
  editor.view.dispatch(closeHistory(editor.state.tr).setMeta('addToHistory', false));
  return true;
}

export function wordSelectedCellPositions(editor: Editor): number[] {
  const table = wordCellTable(editor);
  if (!table) return [];
  const positions: number[] = [], selection = editor.state.selection;
  if (selection instanceof CellSelection) selection.forEachCell((_node, pos) => positions.push(pos));
  else {
    editor.state.doc.nodesBetween(selection.from, Math.max(selection.to, selection.from + 1), (node, pos) => {
      if (!['tableCell', 'tableHeader'].includes(node.type.name)) return true;
      const resolved = editor.state.doc.resolve(pos);
      let depth = resolved.depth;
      while (depth > 0 && resolved.node(depth).type.name !== 'table') depth--;
      if (depth && resolved.before(depth) === table.position) {
        positions.push(pos);
        return false;
      }
      return true;
    });
  }
  return positions;
}
