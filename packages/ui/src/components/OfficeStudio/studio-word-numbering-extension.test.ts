import { afterEach, describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { undoDepth } from '@tiptap/pm/history';
import {
  WordNumbering,
  wordRestartNumbering,
  wordContinueNumbering,
  wordChangeNumberingLevel,
  wordApplyNumbering,
  wordSetNumberingCatalog,
  wordEditorNumbering,
} from './studio-word-numbering-extension';
import {
  wordDefaultNumbering,
  wordNumberingLabels,
  type WordNumberingCatalog,
} from './studio-word-numbering';
const editors: Editor[] = [];
afterEach(() => {
  editors.forEach((editor) => editor.destroy());
  editors.length = 0;
});
function fixture() {
  const catalog: WordNumberingCatalog = {
    definitions: [{ id: 'decimal', name: 'Decimal', levels: wordDefaultNumbering() }],
    instances: [
      { id: 'first', definitionId: 'decimal' },
      { id: 'second', definitionId: 'decimal' },
    ],
  };
  const content = {
    type: 'doc',
    attrs: { numberingDefinitions: catalog.definitions, numberingInstances: catalog.instances },
    content: [
      ...['A', 'B'].map((text) => ({
        type: 'paragraph',
        attrs: { numbering: { instanceId: 'first', level: 0 } },
        content: [{ type: 'text', text }],
      })),
      { type: 'paragraph', content: [{ type: 'text', text: 'Gap' }] },
      ...['C', 'D'].map((text) => ({
        type: 'paragraph',
        attrs: { numbering: { instanceId: 'second', level: 0 } },
        content: [{ type: 'text', text }],
      })),
    ],
  };
  const editor = new Editor({
    element: document.createElement('div'),
    extensions: [StarterKit, WordNumbering],
    content,
  });
  editors.push(editor);
  return editor;
}
const labels = (editor: Editor) =>
  wordNumberingLabels(editor.getJSON(), wordEditorNumbering(editor)).map((entry) => entry.text);
describe('Word numbering command transactions', () => {
  it('saves a new definition and applies it in the same undo transaction', () => {
    const editor = fixture(),
      before = editor.getJSON(),
      data = wordEditorNumbering(editor);
    data.definitions.push({
      id: 'custom',
      name: 'Custom',
      levels: wordDefaultNumbering('upperRoman'),
    });
    wordApplyNumbering(editor, 'custom', 0, data);
    expect(labels(editor)[0]).toBe('I.');
    expect(editor.getJSON().attrs?.numberingDefinitions).toHaveLength(2);
    editor.commands.undo();
    expect(editor.getJSON()).toEqual(before);
  });
  it('keeps related outline levels together when restarting from a child paragraph', () => {
    const editor = fixture(),
      catalog = wordEditorNumbering(editor);
    catalog.definitions[0].levels[1].text = '%1.%2.';
    editor.commands.setContent({
      type: 'doc',
      attrs: { numberingDefinitions: catalog.definitions, numberingInstances: catalog.instances },
      content: [0, 1, 0, 1].map((level) => ({
        type: 'paragraph',
        attrs: { numbering: { instanceId: 'first', level } },
        content: [{ type: 'text', text: 'X' }],
      })),
    });
    wordSetNumberingCatalog(editor, catalog);
    editor.commands.setTextSelection(4);
    const original = editor.getJSON(),
      oldId = editor.state.doc.child(0).attrs.numbering.instanceId;
    wordRestartNumbering(editor, 7);
    expect(editor.state.doc.child(0).attrs.numbering.instanceId).toBe(oldId);
    const nextId = editor.state.doc.child(1).attrs.numbering.instanceId;
    expect(nextId).not.toBe(oldId);
    expect(
      [1, 2, 3].map((index) => editor.state.doc.child(index).attrs.numbering.instanceId)
    ).toEqual([nextId, nextId, nextId]);
    editor.commands.undo();
    expect(editor.getJSON()).toEqual(original);
  });
  it('restarts a suffix without renumbering earlier items and undoes the entire instance change once', () => {
    const editor = fixture();
    editor.commands.setTextSelection(4);
    const original = editor.getJSON(),
      depth = undoDepth(editor.state);
    expect(wordRestartNumbering(editor, 7)).toBe(true);
    expect(labels(editor)).toEqual(['1.', '7.', '1.', '2.']);
    expect(undoDepth(editor.state)).toBe(depth + 1);
    editor.commands.undo();
    expect(editor.getJSON()).toEqual(original);
    editor.commands.redo();
    expect(labels(editor)).toEqual(['1.', '7.', '1.', '2.']);
  });
  it('continues a disconnected sequence by shared identity and preserves the paragraph text and selection', () => {
    const editor = fixture();
    editor.commands.setTextSelection(12);
    const original = editor.getJSON();
    expect(wordContinueNumbering(editor)).toBe(true);
    expect(labels(editor)).toEqual(['1.', '2.', '3.', '4.']);
    expect(editor.state.doc.textContent).toBe('ABGapCD');
    editor.commands.undo();
    expect(editor.getJSON()).toEqual(original);
  });
  it('changes native number formatting without changing paragraph content and rejects invalid catalog updates atomically', () => {
    const editor = fixture(),
      catalog = wordEditorNumbering(editor),
      original = editor.getJSON();
    catalog.definitions[0].levels[0].format = 'upperRoman';
    wordSetNumberingCatalog(editor, catalog);
    expect(labels(editor)).toEqual(['I.', 'II.', 'I.', 'II.']);
    const changed = editor.getJSON();
    expect(() => wordSetNumberingCatalog(editor, { definitions: [], instances: [] })).toThrow();
    expect(editor.getJSON()).toEqual(changed);
    editor.commands.undo();
    expect(editor.getJSON()).toEqual(original);
  });
  it('moves a selected paragraph to another level in one transaction and rejects out-of-range batches', () => {
    const editor = fixture();
    editor.commands.setTextSelection(4);
    const original = editor.getJSON();
    wordChangeNumberingLevel(editor, 1);
    expect(labels(editor)).toEqual(['1.', '1.', '1.', '2.']);
    expect(editor.getJSON().content![1].attrs!.numbering.level).toBe(1);
    editor.commands.undo();
    expect(editor.getJSON()).toEqual(original);
    expect(() => wordChangeNumberingLevel(editor, -1)).toThrow();
    expect(editor.getJSON()).toEqual(original);
  });
  it('blocks readonly and composition commands and leaves the catalog and history unchanged', () => {
    const editor = fixture(),
      original = editor.getJSON();
    editor.setEditable(false);
    expect(wordRestartNumbering(editor, 9)).toBe(false);
    expect(wordApplyNumbering(editor, 'decimal')).toBe(false);
    editor.setEditable(true);
    Object.defineProperty(editor.view, 'composing', { configurable: true, value: true });
    expect(wordContinueNumbering(editor)).toBe(false);
    expect(wordRestartNumbering(editor, 9)).toBe(false);
    expect(editor.getJSON()).toEqual(original);
  });
});
