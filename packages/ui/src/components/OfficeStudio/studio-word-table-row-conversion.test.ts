import { afterEach, expect, it, vi } from 'vitest';
import { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import { CellSelection } from '@tiptap/pm/tables';
import { undoDepth } from '@tiptap/pm/history';
import {
  wordApplyTableRowConversion,
  wordTableRowConversionTarget,
} from './studio-word-table-row-conversion';
const editors: Editor[] = [];
afterEach(() => {
  editors.forEach((editor) => editor.destroy());
  editors.length = 0;
  vi.restoreAllMocks();
});
it('converts only complete selected rows and restores original tables in one undo', () => {
  const editor = new Editor({
    extensions: [StarterKit, TableKit],
    content:
      '<table><tr><td><p>Before</p></td><td><p>One</p></td></tr><tr><td><p><strong>A</strong></p></td><td><p>B</p></td></tr><tr><td><p>After</p></td><td><p>Two</p></td></tr></table><p>Outside</p>',
  });
  editors.push(editor);
  vi.spyOn(editor.view, 'dispatch').mockImplementation((tr) =>
    editor.view.updateState(editor.state.apply(tr))
  );
  const cells: number[] = [];
  editor.state.doc.descendants((node, position) => {
    if (node.type.name === 'tableCell') cells.push(position);
  });
  editor.view.dispatch(
    editor.state.tr.setSelection(CellSelection.create(editor.state.doc, cells[2], cells[3]))
  );
  const original = editor.state.doc;
  const target = wordTableRowConversionTarget(editor)!;
  expect(target.from).toBe(0);
  expect(wordApplyTableRowConversion(editor, target, ',')).toBe(true);
  expect(editor.state.doc.child(0).textContent).toBe('BeforeOne');
  expect(editor.state.doc.child(1).textContent).toBe('A,B');
  expect(editor.state.doc.child(1).firstChild!.marks[0].type.name).toBe('bold');
  expect(editor.state.doc.child(2).textContent).toBe('AfterTwo');
  expect(editor.state.doc.child(3).textContent).toBe('Outside');
  expect(undoDepth(editor.state)).toBe(1);
  editor.commands.undo();
  expect(editor.state.doc.eq(original)).toBe(true);
  editor.commands.redo();
  expect(editor.state.doc.child(1).textContent).toBe('A,B');
  expect(() => wordApplyTableRowConversion(editor, target, ',')).toThrow('已变化');
});

it('guards read-only and composing states without creating history or changing the document', () => {
  const editor = new Editor({
    extensions: [StarterKit, TableKit],
    content: '<table><tr><td><p>A</p></td><td><p>B</p></td></tr></table><p></p>',
  });
  editors.push(editor);
  const cells: number[] = [];
  editor.state.doc.descendants((node, position) => {
    if (node.type.name === 'tableCell') cells.push(position);
  });
  editor.view.dispatch(
    editor.state.tr.setSelection(CellSelection.create(editor.state.doc, cells[0], cells[1]))
  );
  const target = wordTableRowConversionTarget(editor)!;
  const original = editor.state.doc;
  editor.setEditable(false);
  expect(wordApplyTableRowConversion(editor, target, ',')).toBe(false);
  editor.setEditable(true);
  vi.spyOn(editor.view, 'composing', 'get').mockReturnValue(true);
  expect(wordApplyTableRowConversion(editor, target, ',')).toBe(false);
  expect(editor.state.doc).toBe(original);
  expect(undoDepth(editor.state)).toBe(0);
});
it('rejects a partial-width selection as a row target', () => {
  const editor = new Editor({
    extensions: [StarterKit, TableKit],
    content:
      '<table><tr><td><p>A</p></td><td><p>B</p></td></tr><tr><td><p>C</p></td><td><p>D</p></td></tr></table><p></p>',
  });
  editors.push(editor);
  const cells: number[] = [];
  editor.state.doc.descendants((node, position) => {
    if (node.type.name === 'tableCell') cells.push(position);
  });
  editor.view.dispatch(
    editor.state.tr.setSelection(CellSelection.create(editor.state.doc, cells[0], cells[2]))
  );
  expect(wordTableRowConversionTarget(editor)).toBeNull();
  expect(undoDepth(editor.state)).toBe(0);
});

it('expands a merged row target without changing content or history', () => {
  const editor = new Editor({
    extensions: [StarterKit, TableKit],
    content:
      '<table><tr><td rowspan="2"><p>M</p></td><td><p>A</p></td></tr><tr><td><p>B</p></td></tr></table><p></p>',
  });
  editors.push(editor);
  const cells: number[] = [];
  editor.state.doc.descendants((node, position) => {
    if (node.type.name === 'tableCell') cells.push(position);
  });
  editor.view.dispatch(
    editor.state.tr.setSelection(CellSelection.create(editor.state.doc, cells[0], cells[1]))
  );
  const original = editor.state.doc;
  const target = wordTableRowConversionTarget(editor)!;
  // The merged anchor expands the rectangle to both rows, preventing an unsafe cut.
  expect(target.selected.childCount).toBe(2);
  expect(editor.state.doc).toBe(original);
  expect(undoDepth(editor.state)).toBe(0);
});

it('converts selected rows inside a nested table without replacing the outer table', () => {
  const editor = new Editor({
    extensions: [StarterKit, TableKit],
    content:
      '<table><tr><td><p>Outer</p><table><tr><td><p>Before</p></td><td><p>One</p></td></tr><tr><td><p>A</p></td><td><p>B</p></td></tr><tr><td><p>After</p></td><td><p>Two</p></td></tr></table><p>End</p></td></tr></table><p>Outside</p>',
  });
  editors.push(editor);
  vi.spyOn(editor.view, 'dispatch').mockImplementation((tr) =>
    editor.view.updateState(editor.state.apply(tr))
  );
  const cells: number[] = [];
  editor.state.doc.descendants((node, position) => {
    if (node.type.name === 'tableCell' && ['A', 'B'].includes(node.textContent))
      cells.push(position);
  });
  editor.view.dispatch(
    editor.state.tr.setSelection(CellSelection.create(editor.state.doc, cells[0], cells[1]))
  );
  const original = editor.state.doc;
  const target = wordTableRowConversionTarget(editor)!;
  expect(target.from).toBeGreaterThan(0);
  wordApplyTableRowConversion(editor, target, ',');
  const outer = editor.state.doc.firstChild!;
  expect(outer.type.name).toBe('table');
  expect(outer.child(0).child(0).child(0).textContent).toBe('Outer');
  expect(outer.child(0).child(0).child(2).textContent).toBe('A,B');
  expect(editor.state.doc.lastChild!.textContent).toBe('Outside');
  expect(undoDepth(editor.state)).toBe(1);
  editor.commands.undo();
  expect(editor.state.doc.eq(original)).toBe(true);
});

it('keeps invalid separator drafts transactional and rejects externally replaced documents', () => {
  const editor = new Editor({
    extensions: [StarterKit, TableKit],
    content: '<table><tr><td><p>A</p></td><td><p>B</p></td></tr></table><p></p>',
  });
  editors.push(editor);
  const cells: number[] = [];
  editor.state.doc.descendants((node, position) => {
    if (node.type.name === 'tableCell') cells.push(position);
  });
  editor.view.dispatch(
    editor.state.tr.setSelection(CellSelection.create(editor.state.doc, cells[0], cells[1]))
  );
  const target = wordTableRowConversionTarget(editor)!;
  const before = editor.state.doc;
  expect(() => wordApplyTableRowConversion(editor, target, ';;')).toThrow('分隔符');
  expect(editor.state.doc).toBe(before);
  expect(undoDepth(editor.state)).toBe(0);
  editor.commands.setContent('<p>External replacement</p>');
  const replacement = editor.state.doc;
  expect(() => wordApplyTableRowConversion(editor, target, ',')).toThrow('已变化');
  expect(editor.state.doc).toBe(replacement);
});
