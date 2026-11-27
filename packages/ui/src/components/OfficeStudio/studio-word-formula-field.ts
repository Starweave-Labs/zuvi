import { Node, type Editor } from '@tiptap/react';
import { TableMap } from '@tiptap/pm/tables';
import { closeHistory } from '@tiptap/pm/history';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import {
  wordCalculateTableFormula,
  wordFormatFormulaResult,
  type WordFormulaTable,
} from './studio-word-table-formula';

export const WordFormulaField = Node.create({
  name: 'tableFormula',
  group: 'inline',
  inline: true,
  atom: true,
  renderText: ({ node }) => String(node.attrs.result),
  addAttributes: () => ({ formula: { default: '=SUM(ABOVE)' }, result: { default: '0' } }),
  parseHTML: () => [
    {
      tag: 'span[data-word-table-formula]',
      getAttrs: (element) => ({
        formula: (element as HTMLElement).dataset.wordTableFormula,
        result: element.textContent || '0',
      }),
    },
  ],
  renderHTML: ({ node }) => [
    'span',
    {
      'data-word-table-formula': node.attrs.formula,
      title: node.attrs.formula,
      contenteditable: 'false',
      'aria-label': `表格公式 ${node.attrs.formula}，结果 ${node.attrs.result}`,
    },
    String(node.attrs.result),
  ],
});

/** A merged cell occupies its anchor only, avoiding double counting its covered slots. */
export function wordFormulaTable(table: ProseMirrorNode): WordFormulaTable {
  const map = TableMap.get(table);
  if (map.problems?.length) throw new Error('表格合并结构无效，请先修复表格。');
  const seen = new Set<number>();
  return Array.from({ length: map.height }, (_, row) =>
    Array.from({ length: map.width }, (_, column) => {
      const position = map.map[row * map.width + column];
      if (seen.has(position)) return { text: '' };
      seen.add(position);
      const cell = table.nodeAt(position)!;
      let formula: string | undefined;
      let fields = 0;
      cell.descendants((node) => {
        if (node.type.name === 'table') return false;
        if (node.type.name === 'tableFormula') {
          formula = node.attrs.formula;
          fields++;
        }
      });
      if (fields > 1) throw new Error('引用单元格包含多个公式域，请使用独立单元格。');
      let text = '';
      cell.descendants((node) => {
        if (node.type.name === 'table') return false;
        if (node.isText) text += node.text;
      });
      return { text, formula };
    })
  );
}

/** Calculate every field first; a failed refresh leaves all caches and undo history untouched. */
export function wordRefreshTableFormulas(editor: Editor): boolean {
  if (editor.isDestroyed || !editor.isEditable || editor.view.composing) return false;
  const updates: { position: number; node: ProseMirrorNode; result: string }[] = [];
  editor.state.doc.descendants((table, tablePosition) => {
    if (table.type.name !== 'table') return;
    const map = TableMap.get(table);
    const grid = wordFormulaTable(table);
    table.descendants((node, position) => {
      if (node.type.name === 'table') return false;
      if (node.type.name !== 'tableFormula') return;
      const resolved = table.resolve(position);
      let depth = resolved.depth;
      while (depth > 0 && !['tableCell', 'tableHeader'].includes(resolved.node(depth).type.name))
        depth--;
      if (!depth) throw new Error('公式域必须位于表格单元格内。');
      const cellPosition = resolved.before(depth);
      const index = map.map.indexOf(cellPosition);
      const result = wordCalculateTableFormula(
        grid,
        Math.floor(index / map.width),
        index % map.width,
        node.attrs.formula
      );
      updates.push({
        position: tablePosition + 1 + position,
        node,
        result: wordFormatFormulaResult(result, node.attrs.formula),
      });
    });
  });
  const changed = updates.filter(({ node, result }) => node.attrs.result !== result);
  if (!changed.length) return false;
  const transaction = closeHistory(editor.state.tr);
  for (const { position, node, result } of changed)
    transaction.setNodeMarkup(position, undefined, { ...node.attrs, result });
  editor.view.dispatch(transaction.scrollIntoView());
  return true;
}

/** Insert at a cursor or edit a selected field; a selection spanning cells is never replaced. */
export function wordSetTableFormula(editor: Editor, formula: string): boolean {
  if (editor.isDestroyed || !editor.isEditable || editor.view.composing) return false;
  const { selection, doc } = editor.state;
  const existing = doc.nodeAt(selection.from);
  const editing =
    existing?.type.name === 'tableFormula' && selection.to === selection.from + existing.nodeSize;
  if (!selection.empty && !editing) throw new Error('请将光标放入单元格，或选择一个公式域。');
  const resolved = selection.$from;
  let depth = resolved.depth;
  while (depth > 0 && !['tableCell', 'tableHeader'].includes(resolved.node(depth).type.name))
    depth--;
  if (!depth) throw new Error('公式必须位于表格单元格内。');
  if (!editing) {
    let hasField = false;
    resolved.node(depth).descendants((node) => {
      if (node.type.name === 'table') return false;
      if (node.type.name === 'tableFormula') hasField = true;
    });
    if (hasField) throw new Error('单元格已有公式域，请选择该域后编辑。');
  }
  const table = resolved.node(depth - 2);
  if (table.type.name !== 'table') throw new Error('表格结构无效。');
  const map = TableMap.get(table);
  const cellPosition = resolved.before(depth) - resolved.start(depth - 2);
  const index = map.map.indexOf(cellPosition);
  if (index < 0) throw new Error('无法定位公式单元格。');
  const normalized = formula.trim().startsWith('=') ? formula.trim() : `=${formula.trim()}`;
  const row = Math.floor(index / map.width),
    column = index % map.width;
  const grid = wordFormulaTable(table).map((cells) => cells.map((cell) => ({ ...cell })));
  grid[row][column] = { text: '', formula: normalized };
  const result = wordFormatFormulaResult(
    wordCalculateTableFormula(grid, row, column, normalized),
    normalized
  );
  const marks = editing ? existing.marks : (editor.state.storedMarks ?? selection.$from.marks());
  const node = editor.schema.nodes.tableFormula.createChecked(
    { formula: normalized, result },
    null,
    marks
  );
  const transaction = closeHistory(editor.state.tr).replaceWith(selection.from, selection.to, node);
  editor.view.dispatch(transaction.scrollIntoView());
  return true;
}
