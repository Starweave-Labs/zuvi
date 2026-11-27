import { afterEach, expect, it } from 'vitest';
import { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import { CellSelection } from '@tiptap/pm/tables';
import { wordSelectedTableRowRange, wordSplitTableRows } from './studio-word-table-row-range';
const editors: Editor[] = [];
afterEach(() => {
  editors.forEach((editor) => editor.destroy());
  editors.length = 0;
});
function table(html: string) {
  const editor = new Editor({ extensions: [StarterKit, TableKit], content: html });
  editors.push(editor);
  return editor.state.doc.firstChild!;
}
it('preserves untouched table rows and their cell marks when splitting a middle range', () => {
  const source = table(
    '<table><tr><td><p>Before</p></td></tr><tr><td><p><strong>Selected</strong></p></td></tr><tr><td><p>After</p></td></tr></table>'
  );
  const result = wordSplitTableRows(source, 1, 2);
  expect(result.before!.textContent).toBe('Before');
  expect(result.selected.textContent).toBe('Selected');
  expect(result.selected.child(0).eq(source.child(1))).toBe(true);
  expect(result.after!.textContent).toBe('After');
  expect(source.childCount).toBe(3);
});
it('rejects cutting through vertical merges but accepts their complete range', () => {
  const source = table(
    '<table><tr><td rowspan="2"><p>Merged</p></td><td><p>A</p></td></tr><tr><td><p>B</p></td></tr><tr><td><p>C</p></td><td><p>D</p></td></tr></table>'
  );
  expect(() => wordSplitTableRows(source, 0, 1)).toThrow('纵向合并');
  expect(() => wordSplitTableRows(source, 1, 2)).toThrow('纵向合并');
  const result = wordSplitTableRows(source, 0, 2);
  expect(result.selected.childCount).toBe(2);
  expect(result.after!.textContent).toBe('CD');
  expect(result.selected.child(0).child(0).attrs.rowspan).toBe(2);
});
it('validates bounds without allocating or changing an original table', () => {
  const source = table('<table><tr><td><p>A</p></td></tr></table>');
  expect(() => wordSplitTableRows(source, -1, 1)).toThrow();
  expect(() => wordSplitTableRows(source, 0, 2)).toThrow();
  expect(wordSplitTableRows(source, 0, 1).selected.eq(source)).toBe(true);
});

it('retains horizontal merges and row properties in the selected fragment', () => {
  const source = table(
    '<table><tr><td colspan="2"><p>Wide</p></td></tr><tr><td><p>A</p></td><td><p>B</p></td></tr></table>'
  );
  const result = wordSplitTableRows(source, 0, 1);
  expect(result.selected.child(0).child(0).attrs.colspan).toBe(2);
  expect(result.selected.child(0).eq(source.child(0))).toBe(true);
  expect(result.after!.child(0).eq(source.child(1))).toBe(true);
});
it('rejects malformed unequal row widths before returning fragments', () => {
  const source = table(
    '<table><tr><td><p>A</p></td><td><p>B</p></td></tr><tr><td><p>C</p></td></tr></table>'
  );
  expect(() => wordSplitTableRows(source, 0, 1)).toThrow('结构无效');
});

it('detects complete row selections and keeps partial-width cells distinct', () => {
  const editor = new Editor({
    extensions: [StarterKit, TableKit],
    content:
      '<table><tr><td><p>A</p></td><td><p>B</p></td></tr><tr><td><p>C</p></td><td><p>D</p></td></tr></table>',
  });
  editors.push(editor);
  const cells: number[] = [];
  editor.state.doc.descendants((node, position) => {
    if (node.type.name === 'tableCell') cells.push(position);
  });
  const selected = CellSelection.create(editor.state.doc, cells[2], cells[3]);
  expect(wordSelectedTableRowRange(selected)).toEqual({ first: 1, end: 2 });
  expect(
    wordSelectedTableRowRange(CellSelection.create(editor.state.doc, cells[0], cells[2]))
  ).toBeNull();
  expect(
    wordSelectedTableRowRange(CellSelection.create(editor.state.doc, cells[3], cells[2]))
  ).toEqual({ first: 1, end: 2 });
});

it('expands selected merged anchors to the complete row footprint', () => {
  const editor = new Editor({
    extensions: [StarterKit, TableKit],
    content:
      '<table><tr><td rowspan="2"><p>Merge</p></td><td><p>A</p></td></tr><tr><td><p>B</p></td></tr><tr><td colspan="2"><p>Wide</p></td></tr></table>',
  });
  editors.push(editor);
  const cells: number[] = [];
  editor.state.doc.descendants((node, position) => {
    if (node.type.name === 'tableCell') cells.push(position);
  });
  expect(
    wordSelectedTableRowRange(CellSelection.create(editor.state.doc, cells[0], cells[2]))
  ).toEqual({ first: 0, end: 2 });
  expect(wordSelectedTableRowRange(CellSelection.create(editor.state.doc, cells[3]))).toEqual({
    first: 2,
    end: 3,
  });
  const range = wordSelectedTableRowRange(
    CellSelection.create(editor.state.doc, cells[0], cells[2])
  )!;
  expect(
    wordSplitTableRows(editor.state.doc.firstChild!, range.first, range.end).selected.childCount
  ).toBe(2);
});
