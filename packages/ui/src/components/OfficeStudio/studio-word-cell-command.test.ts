import { afterEach, expect, it } from 'vitest';
import { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import { CellSelection } from '@tiptap/pm/tables';
import { WordTableCell, WordTableHeader } from './studio-word-table-cell';
import { wordSetCellProperties } from './studio-word-cell-command';
let editor: Editor;
afterEach(() => editor?.destroy());
function create() {
  editor = new Editor({ extensions: [StarterKit, TableKit.configure({ tableCell: false, tableHeader: false }), WordTableCell, WordTableHeader, TextAlign.configure({ types: ['paragraph'] })], content: '<table><tr><td><p><strong>A</strong></p></td><td><p>B</p></td></tr><tr><td><p>C</p></td><td><p>D</p></td></tr></table>' });
  const positions: number[] = [];
  editor.state.doc.descendants((node, pos) => { if (node.type.name === 'tableCell') positions.push(pos); });
  editor.view.dispatch(editor.state.tr.setSelection(CellSelection.create(editor.state.doc, positions[0], positions[1])));
  return positions;
}
it('applies alignment and partial margins to selected cells in one undo without changing text or marks', () => {
  const cells = create(), before = editor.getJSON();
  expect(wordSetCellProperties(editor, { verticalAlign: 'bottom', cellMargins: { top: 0, left: 5.25 } }, 'right')).toBe(true);
  for (const pos of cells.slice(0, 2)) {
    const cell = editor.state.doc.nodeAt(pos)!;
    expect(cell.attrs.verticalAlign).toBe('bottom'); expect(cell.attrs.cellMargins).toEqual({ top: 0, left: 5.25 });
    expect(cell.firstChild!.attrs.textAlign).toBe('right');
  }
  expect(editor.state.doc.nodeAt(cells[2])!.attrs.verticalAlign).toBeNull();
  expect(editor.getHTML()).toContain('<strong>A</strong>');
  editor.commands.undo(); expect(editor.getJSON()).toEqual(before);
  editor.commands.redo(); expect(editor.state.doc.nodeAt(cells[0])!.attrs.verticalAlign).toBe('bottom');
});
it('guards readonly, invalid margins and no-op changes', () => {
  create(); const before = editor.getJSON();
  expect(() => wordSetCellProperties(editor, { cellMargins: { top: -1 } })).toThrow();
  expect(editor.getJSON()).toEqual(before);
  editor.setEditable(false); expect(wordSetCellProperties(editor, { verticalAlign: 'center' })).toBe(false);
  editor.setEditable(true); expect(wordSetCellProperties(editor, {})).toBe(false);
});
it('preserves native cell attributes through HTML reopening', () => {
  create(); wordSetCellProperties(editor, { verticalAlign: 'center', cellMargins: { top: 0, right: 4.5 } });
  const html = editor.getHTML(); editor.commands.setContent(html);
  expect(editor.state.doc.firstChild!.firstChild!.firstChild!.attrs).toMatchObject({ verticalAlign: 'center', cellMargins: { top: 0, right: 4.5 } });
});
