import { afterEach, expect, it } from 'vitest';
import { Editor } from '@tiptap/react';
import { NodeSelection } from '@tiptap/pm/state';
import { undoDepth } from '@tiptap/pm/history';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import {
  WordFormulaField,
  wordFormulaTable,
  wordRefreshTableFormulas,
  wordSetTableFormula,
} from './studio-word-formula-field';
const editors: Editor[] = [];
afterEach(() => {
  editors.forEach((editor) => editor.destroy());
  editors.length = 0;
});
function editor(content: string) {
  const value = new Editor({ extensions: [StarterKit, TableKit, WordFormulaField], content });
  editors.push(value);
  return value;
}
const field = (formula: string, result = '99') =>
  `<span data-word-table-formula="${formula}">${result}</span>`;
it('refreshes dependent fields together and restores all caches with one undo and redo', () => {
  const value = editor(
    `<table><tr><td><p>2</p></td><td><p>${field('=A1*3')}</p></td><td><p>${field('=B1+1')}</p></td></tr></table>`
  );
  // TableKit may normalize table metadata on the first transaction.
  value.commands.setTextSelection(3);
  const before = value.state.doc;
  expect(wordRefreshTableFormulas(value)).toBe(true);
  const results: string[] = [];
  value.state.doc.descendants((node) => {
    if (node.type.name === 'tableFormula') results.push(node.attrs.result);
  });
  expect(results).toEqual(['6', '7']);
  const after = value.state.doc;
  expect(wordRefreshTableFormulas(value)).toBe(false);
  value.commands.undo();
  expect(value.state.doc.eq(before)).toBe(true);
  value.commands.redo();
  expect(value.state.doc.eq(after)).toBe(true);
});
it('rejects a failed dependent field without updating an earlier valid field or creating history', () => {
  const value = editor(
    `<table><tr><td><p>2</p></td><td><p>${field('=A1*3')}</p></td><td><p>${field('=C1')}</p></td></tr></table>`
  );
  value.commands.setTextSelection(3);
  const before = value.state.doc;
  const historyDepth = undoDepth(value.state);
  expect(() => wordRefreshTableFormulas(value)).toThrow('循环引用');
  expect(value.state.doc.eq(before)).toBe(true);
  expect(undoDepth(value.state)).toBe(historyDepth);
});
it('blocks read only and composing refreshes without changing caches', () => {
  const value = editor(
    `<table><tr><td><p>2</p></td><td><p>${field('=A1*3')}</p></td></tr></table>`
  );
  const before = value.state.doc;
  value.setEditable(false);
  expect(wordRefreshTableFormulas(value)).toBe(false);
  value.setEditable(true);
  Object.defineProperty(value.view, 'composing', { configurable: true, value: true });
  expect(wordRefreshTableFormulas(value)).toBe(false);
  expect(value.state.doc.eq(before)).toBe(true);
});
it('counts a merged anchor only once and excludes nested table text from outer cells', () => {
  const value = editor(
    '<table><tr><td colspan="2"><p>4</p></td><td><p>3</p><table><tr><td><p>99</p></td></tr></table></td></tr></table>'
  );
  const grid = wordFormulaTable(value.state.doc.firstChild!);
  expect(grid[0].map((cell) => cell.text)).toEqual(['4', '', '3']);
});
it('refreshes inner fields in their own table without using outer cell coordinates', () => {
  const value = editor(
    `<table><tr><td><p>100</p><table><tr><td><p>4</p></td><td><p>${field('=A1*2')}</p></td></tr></table></td></tr></table>`
  );
  expect(wordRefreshTableFormulas(value)).toBe(true);
  const results: string[] = [];
  value.state.doc.descendants((node) => {
    if (node.type.name === 'tableFormula') results.push(node.attrs.result);
  });
  expect(results).toEqual(['8']);
});

it('inserts and edits a real formula atom with one transaction each and refuses invalid edits', () => {
  const value = editor('<table><tr><td><p>2</p></td><td><p></p></td></tr></table>');
  const positions: number[] = [];
  value.state.doc.descendants((node, position) => {
    if (node.type.name === 'tableCell') positions.push(position);
  });
  value.commands.setTextSelection(positions[1] + 2);
  const before = value.state.doc;
  expect(wordSetTableFormula(value, '=SUM(LEFT)')).toBe(true);
  let fieldPosition = -1;
  value.state.doc.descendants((node, position) => {
    if (node.type.name === 'tableFormula') fieldPosition = position;
  });
  expect(value.state.doc.nodeAt(fieldPosition)!.attrs.result).toBe('2');
  value.view.dispatch(
    value.state.tr.setSelection(NodeSelection.create(value.state.doc, fieldPosition))
  );
  expect(wordSetTableFormula(value, '=A1*4')).toBe(true);
  expect(value.state.doc.nodeAt(fieldPosition)!.attrs.result).toBe('8');
  value.commands.undo();
  expect(value.state.doc.nodeAt(fieldPosition)!.attrs.result).toBe('2');
  value.commands.undo();
  expect(value.state.doc.eq(before)).toBe(true);
  value.commands.redo();
  value.commands.redo();
  value.view.dispatch(
    value.state.tr.setSelection(NodeSelection.create(value.state.doc, fieldPosition))
  );
  const original = value.state.doc,
    history = undoDepth(value.state);
  expect(() => wordSetTableFormula(value, '=B1')).toThrow('循环引用');
  expect(value.state.doc.eq(original)).toBe(true);
  expect(undoDepth(value.state)).toBe(history);
});

it('refuses insertion outside tables, text replacement, duplicate fields and protected editing', () => {
  const value = editor(
    '<p>Outside</p><table><tr><td><p>2</p></td><td><p>' + field('=A1') + '</p></td></tr></table>'
  );
  value.commands.setTextSelection(2);
  expect(() => wordSetTableFormula(value, '=1')).toThrow('单元格');
  value.commands.setTextSelection({ from: 1, to: 4 });
  expect(() => wordSetTableFormula(value, '=1')).toThrow('光标');
  let position = -1;
  value.state.doc.descendants((node, pos) => {
    if (node.type.name === 'tableFormula') position = pos;
  });
  value.commands.setTextSelection(position);
  expect(() => wordSetTableFormula(value, '=1')).toThrow('已有公式域');
  const before = value.state.doc;
  value.setEditable(false);
  expect(wordSetTableFormula(value, '=1')).toBe(false);
  expect(value.state.doc.eq(before)).toBe(true);
});

it('includes field results in copied text instead of losing atomic formula values', () => {
  const value = editor('<table><tr><td><p>' + field('=1+2', '3') + '</p></td></tr></table>');
  expect(value.getText()).toContain('3');
});

it('preserves existing field marks when editing and uses cursor marks when inserting', () => {
  const value = editor(
    '<table><tr><td><p>2</p></td><td><p><strong>' +
      field('=A1*2', '4') +
      '</strong></p></td><td><p></p></td></tr></table>'
  );
  let fieldPosition = -1;
  const cells: number[] = [];
  value.state.doc.descendants((node, position) => {
    if (node.type.name === 'tableFormula') fieldPosition = position;
    if (node.type.name === 'tableCell') cells.push(position);
  });
  value.view.dispatch(
    value.state.tr.setSelection(NodeSelection.create(value.state.doc, fieldPosition))
  );
  expect(wordSetTableFormula(value, '=A1*3')).toBe(true);
  expect(value.state.doc.nodeAt(fieldPosition)!.marks.map((mark) => mark.type.name)).toEqual([
    'bold',
  ]);
  value.commands.setTextSelection(cells[2] + 2);
  value.commands.setItalic();
  expect(wordSetTableFormula(value, '=A1*4')).toBe(true);
  const fields: string[][] = [];
  value.state.doc.descendants((node) => {
    if (node.type.name === 'tableFormula') fields.push(node.marks.map((mark) => mark.type.name));
  });
  expect(fields).toEqual([['bold'], ['italic']]);
});

it('refreshes numeric-picture caches while dependent fields use raw numeric values', () => {
  const value = editor('<table><tr><td><p>1234.5</p></td><td><p><span data-word-table-formula="=A1*2 \\# &quot;#,##0.00&quot;">stale</span></p></td><td><p>' + field('=B1+1') + '</p></td></tr></table>');
  expect(wordRefreshTableFormulas(value)).toBe(true);
  const results: string[] = [];
  value.state.doc.descendants((node) => { if (node.type.name === 'tableFormula') results.push(node.attrs.result); });
  expect(results).toEqual(['2,469.00', '2470']);
});
