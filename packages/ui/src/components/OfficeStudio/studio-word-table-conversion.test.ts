import { afterEach, describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/react';
import { CellSelection } from '@tiptap/pm/tables';
import { EditorState, NodeSelection } from '@tiptap/pm/state';
import { undoDepth } from '@tiptap/pm/history';
import { vi } from 'vitest';
import { WordImage } from './studio-word-tools';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import {
  wordApplyTableConversion,
  wordConversionTarget,
  wordTableSeparator,
  wordTableToText,
  wordTextToTable,
} from './studio-word-table-conversion';
const editors: Editor[] = [];
afterEach(() => {
  editors.forEach((editor) => editor.destroy());
  editors.length = 0;
  vi.restoreAllMocks();
});
function fixture() {
  const editor = new Editor({ extensions: [StarterKit, TableKit] });
  editors.push(editor);
  return editor.schema;
}
describe('rich text and table conversion model', () => {
  it('splits marked runs and pads uneven rows without losing inline content', () => {
    const schema = fixture();
    const p = schema.nodes.paragraph;
    const source = [
      p.create(null, [schema.text('A,', [schema.marks.bold.create()]), schema.text('B,,C')]),
      p.create(null, schema.text('D')),
    ];
    const table = wordTextToTable(schema, source, ',');
    expect(table.childCount).toBe(2);
    expect(table.child(0).childCount).toBe(4);
    expect(table.child(0).child(0).firstChild!.firstChild!.marks[0].type.name).toBe('bold');
    expect(table.child(0).child(2).textContent).toBe('');
    expect(table.child(1).child(3).textContent).toBe('');
    const result = wordTableToText(schema, table, ',');
    expect(result.child(0).textContent).toBe('A,B,,C');
    expect(result.child(1).textContent).toBe('D,,,');
    expect(result.child(0).firstChild!.marks[0].type.name).toBe('bold');
  });
  it('keeps hard breaks and emoji offsets and accepts a Unicode separator', () => {
    const schema = fixture();
    const paragraph = schema.nodes.paragraph.create(null, [
      schema.text('😀🟢A'),
      schema.nodes.hardBreak.create(),
      schema.text('B🟢'),
    ]);
    const table = wordTextToTable(schema, [paragraph], '🟢');
    expect(table.child(0).childCount).toBe(3);
    expect(table.child(0).child(0).textContent).toBe('😀');
    expect(table.child(0).child(1).firstChild!.child(1).type.name).toBe('hardBreak');
    expect(wordTableToText(schema, table, '🟢').child(0).eq(paragraph)).toBe(true);
  });
  it('groups paragraph fields with specified columns and preserves empty fields', () => {
    const schema = fixture();
    const paragraphs = ['a', '', 'c'].map((text) =>
      schema.nodes.paragraph.create(null, text ? schema.text(text) : null)
    );
    const table = wordTextToTable(schema, paragraphs, null, 2);
    expect(table.childCount).toBe(2);
    const result = wordTableToText(schema, table, null);
    expect(result.childCount).toBe(4);
    expect(Array.from({ length: 4 }, (_, i) => result.child(i).textContent)).toEqual([
      'a',
      '',
      'c',
      '',
    ]);
  });
  it('retains multiple paragraphs and leaves merged covered positions empty', () => {
    const schema = fixture();
    const p = (text: string) => schema.nodes.paragraph.create(null, schema.text(text));
    const cell = schema.nodes.tableCell;
    const row = schema.nodes.tableRow;
    const table = schema.nodes.table.create(null, [
      row.create(null, [cell.create({ rowspan: 2 }, [p('A'), p('B')]), cell.create(null, p('C'))]),
      row.create(null, cell.create(null, p('D'))),
    ]);
    const separated = wordTableToText(schema, table, ',');
    expect(
      Array.from({ length: separated.childCount }, (_, i) => separated.child(i).textContent)
    ).toEqual(['A', 'B,C', ',D']);
    const paragraphs = wordTableToText(schema, table, null);
    expect(paragraphs.childCount).toBe(5);
  });
  it('validates before returning and never mutates original documents', () => {
    const schema = fixture();
    const paragraph = schema.nodes.paragraph.create(null, schema.text('original'));
    const before = paragraph.toJSON();
    expect(() => wordTextToTable(schema, [paragraph], ',,')).toThrow();
    expect(() => wordTextToTable(schema, [paragraph], null, 0)).toThrow();
    expect(() =>
      wordTextToTable(schema, [schema.nodes.heading.create(null, schema.text('heading'))], ',')
    ).toThrow();
    expect(() => wordTableSeparator('custom', '\n')).toThrow();
    expect(wordTableSeparator('tab')).toBe('\t');
    expect(wordTableSeparator('custom', '🟢')).toBe('🟢');
    expect(paragraph.toJSON()).toEqual(before);
  });
});

it('commits each conversion as one undo transaction and rejects stale or read-only drafts', () => {
  const editor = new Editor({
    extensions: [StarterKit, TableKit],
    content: '<p>A,B</p><p>C,D</p><p></p>',
  });
  editors.push(editor);
  vi.spyOn(editor.view, 'dispatch').mockImplementation((tr) =>
    editor.view.updateState(editor.state.apply(tr))
  );
  editor.commands.setTextSelection({ from: 1, to: 9 });
  const target = wordConversionTarget(editor)!;
  const original = editor.state.doc.toJSON();
  expect(wordApplyTableConversion(editor, target, ',')).toBe(true);
  expect(undoDepth(editor.state)).toBe(1);
  expect(editor.state.doc.firstChild!.type.name).toBe('table');
  editor.commands.undo();
  expect(editor.state.doc.toJSON()).toEqual(original);
  editor.commands.redo();
  const tableTarget = wordConversionTarget(editor)!;
  expect(tableTarget.direction).toBe('tableToText');
  expect(wordApplyTableConversion(editor, tableTarget, ',')).toBe(true);
  expect(undoDepth(editor.state)).toBe(2);
  expect(editor.state.doc.toJSON()).toEqual(original);
  editor.commands.undo();
  expect(editor.state.doc.firstChild!.type.name).toBe('table');
  const stale = wordConversionTarget(editor)!;
  editor.commands.insertContent('changed');
  const changed = editor.state.doc.toJSON();
  expect(() => wordApplyTableConversion(editor, stale, ',')).toThrow('已变化');
  expect(editor.state.doc.toJSON()).toEqual(changed);
  editor.setEditable(false);
  expect(wordApplyTableConversion(editor, wordConversionTarget(editor)!, ',')).toBe(false);
});

it('supports a selected table node and rejects conversion while composing without changing history', () => {
  const editor = new Editor({
    extensions: [StarterKit, TableKit],
    content: '<table><tr><td><p>A</p></td></tr></table><p></p>',
  });
  editors.push(editor);
  editor.view.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, 0)));
  const target = wordConversionTarget(editor)!;
  expect(target.direction).toBe('tableToText');
  const original = editor.state.doc;
  vi.spyOn(editor.view, 'composing', 'get').mockReturnValue(true);
  expect(wordApplyTableConversion(editor, target, ',')).toBe(false);
  expect(editor.state.doc).toBe(original);
  expect(undoDepth(editor.state)).toBe(0);
});

it('preserves nested tables by default and recursively converts them when requested', () => {
  const editor = new Editor({
    extensions: [StarterKit, TableKit],
    content:
      '<table><tr><td><p>A</p><table><tr><td><p>Nested</p></td><td><p>Value</p></td></tr></table><p>End</p></td><td><p>B</p></td></tr></table><p></p>',
  });
  editors.push(editor);
  const table = editor.state.doc.firstChild!;
  const kept = wordTableToText(editor.schema, table, ',');
  expect(kept.child(1).type.name).toBe('table');
  expect(kept.child(1).eq(table.child(0).child(0).child(1))).toBe(true);
  expect(kept.child(2).textContent).toBe('End,B');
  const converted = wordTableToText(editor.schema, table, ',', true);
  expect(
    Array.from({ length: converted.childCount }, (_, i) => converted.child(i).textContent)
  ).toEqual(['A', 'Nested,Value', 'End,B']);
  expect(
    Array.from({ length: converted.childCount }, (_, i) => converted.child(i).type.name)
  ).toEqual(['paragraph', 'paragraph', 'paragraph']);
});
it('converts only a partial text selection, preserving marked prefix/suffix with atomic undo', () => {
  const editor = new Editor({
    extensions: [StarterKit, TableKit],
    content: '<p><strong>prefix A,B suffix</strong></p><p>outside</p>',
  });
  editors.push(editor);
  vi.spyOn(editor.view, 'dispatch').mockImplementation((tr) =>
    editor.view.updateState(editor.state.apply(tr))
  );
  editor.commands.setTextSelection({ from: 8, to: 11 });
  const original = editor.state.doc;
  const target = wordConversionTarget(editor)!;
  expect(target.nodes[0].textContent).toBe('A,B');
  expect(wordApplyTableConversion(editor, target, ',')).toBe(true);
  expect(editor.state.doc.child(0).textContent).toBe('prefix ');
  expect(editor.state.doc.child(1).type.name).toBe('table');
  expect(editor.state.doc.child(1).child(0).childCount).toBe(2);
  expect(editor.state.doc.child(2).textContent).toBe(' suffix');
  expect(editor.state.doc.child(2).firstChild!.marks[0].type.name).toBe('bold');
  expect(editor.state.doc.child(3).textContent).toBe('outside');
  expect(undoDepth(editor.state)).toBe(1);
  editor.commands.undo();
  expect(editor.state.doc.eq(original)).toBe(true);
});
it('retains partial boundary paragraphs when converting text across paragraphs', () => {
  const editor = new Editor({
    extensions: [StarterKit, TableKit],
    content: '<p>before A,B</p><p>C,D after</p>',
  });
  editors.push(editor);
  vi.spyOn(editor.view, 'dispatch').mockImplementation((tr) =>
    editor.view.updateState(editor.state.apply(tr))
  );
  editor.commands.setTextSelection({ from: 8, to: 16 });
  const target = wordConversionTarget(editor)!;
  expect(target.nodes.map((node) => node.textContent)).toEqual(['A,B', 'C,D']);
  wordApplyTableConversion(editor, target, ',');
  expect(editor.state.doc.child(0).textContent).toBe('before ');
  expect(editor.state.doc.child(1).childCount).toBe(2);
  expect(editor.state.doc.child(2).textContent).toBe(' after');
});

it('converts nested table contents as one transaction and restores original structure on undo', () => {
  const editor = new Editor({
    extensions: [StarterKit, TableKit],
    content:
      '<table><tr><td><p>Outer</p><table><tr><td><p>Nested</p></td></tr></table></td></tr></table><p></p>',
  });
  editors.push(editor);
  vi.spyOn(editor.view, 'dispatch').mockImplementation((tr) =>
    editor.view.updateState(editor.state.apply(tr))
  );
  editor.commands.setTextSelection(4);
  const before = editor.state.doc;
  expect(wordApplyTableConversion(editor, wordConversionTarget(editor)!, ',', 1, true)).toBe(true);
  expect(editor.state.doc.textContent).toBe('OuterNested');
  expect(editor.state.doc.firstChild!.type.name).toBe('paragraph');
  expect(undoDepth(editor.state)).toBe(1);
  editor.commands.undo();
  expect(editor.state.doc.eq(before)).toBe(true);
  editor.commands.redo();
  expect(editor.state.doc.textContent).toBe('OuterNested');
});

it('retains mixed marks and paragraph attributes through conversion in both directions', () => {
  const schema = fixture();
  const paragraph = schema.nodes.paragraph.create(null, [
    schema.text('A', [schema.marks.bold.create()]),
    schema.text(',', [schema.marks.italic.create()]),
    schema.text('B', [schema.marks.italic.create()]),
    schema.nodes.hardBreak.create(),
    schema.text('C', [schema.marks.bold.create(), schema.marks.italic.create()]),
  ]);
  const table = wordTextToTable(schema, [paragraph], ',');
  const result = wordTableToText(schema, table, ',').firstChild!;
  expect(result.textContent).toBe('A,BC');
  expect(result.firstChild!.marks.map((mark) => mark.type.name)).toEqual(['bold']);
  expect(result.child(2).marks.map((mark) => mark.type.name)).toEqual(['italic']);
  expect(result.child(3).type.name).toBe('hardBreak');
  expect(result.lastChild!.marks.map((mark) => mark.type.name)).toEqual(['bold', 'italic']);
});

it('preserves inline image nodes and their attributes across delimiter removal and restoration', () => {
  const editor = new Editor({ extensions: [StarterKit, TableKit, WordImage] });
  editors.push(editor);
  const schema = editor.schema;
  const image = schema.nodes.image.create({
    src: 'data:image/png;base64,iVBORw0KGgo=',
    alt: 'Inline asset',
    width: 80,
    height: 40,
  });
  const paragraph = schema.nodes.paragraph.create(null, [
    schema.text('A,'),
    image,
    schema.text('B'),
  ]);
  const table = wordTextToTable(schema, [paragraph], ',');
  expect(table.child(0).child(1).firstChild!.firstChild!.eq(image)).toBe(true);
  expect(wordTableToText(schema, table, ',').firstChild!.eq(paragraph)).toBe(true);
});

it('disables conversion targets for malformed selected row geometry instead of throwing during rendering', () => {
  const editor = new Editor({ extensions: [StarterKit, TableKit] });
  editors.push(editor);
  const schema = editor.schema;
  const cell = (text: string) =>
    schema.nodes.tableCell.create(null, schema.nodes.paragraph.create(null, schema.text(text)));
  const table = schema.nodes.table.create(null, [
    schema.nodes.tableRow.create(null, [cell('A'), cell('B')]),
    schema.nodes.tableRow.create(null, [cell('C')]),
  ]);
  const doc = schema.nodes.doc.create(null, [table]);
  const positions: number[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name === 'tableCell') positions.push(pos);
  });
  const selection = CellSelection.create(doc, positions[0], positions[1]);
  const state = EditorState.create({ schema, doc, selection });
  editor.view.updateState(state);
  expect(() => wordConversionTarget(editor)).not.toThrow();
  expect(wordConversionTarget(editor)).toBeNull();
});

it('rejects partial-width cell selections without falling back to converting the entire table', () => {
  const editor = new Editor({
    extensions: [StarterKit, TableKit],
    content:
      '<table><tr><td><p>A</p></td><td><p>B</p></td></tr><tr><td><p>C</p></td><td><p>D</p></td></tr></table>',
  });
  editors.push(editor);
  const before = editor.state.doc;
  const cells: number[] = [];
  before.descendants((node, pos) => {
    if (node.type.name === 'tableCell') cells.push(pos);
  });
  editor.view.dispatch(
    editor.state.tr.setSelection(CellSelection.create(before, cells[0], cells[2]))
  );
  const selectedDocument = editor.state.doc;
  expect(wordConversionTarget(editor)).toBeNull();
  expect(editor.state.doc.eq(selectedDocument)).toBe(true);
});
