import { Editor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { NodeSelection } from '@tiptap/pm/state';
import { undoDepth } from '@tiptap/pm/history';
import { afterEach, expect, it, vi } from 'vitest';
import { WordMath, wordSetMath } from './studio-word-math-extension';
const editors: Editor[] = [];
afterEach(() => editors.splice(0).forEach((editor) => editor.destroy()));
function fixture() {
  const editor = new Editor({
    extensions: [StarterKit, WordMath],
    content: '<p><strong>before</strong></p>',
  });
  editors.push(editor);
  editor.commands.setTextSelection(3);
  return editor;
}
const equation = {
  kind: 'fraction',
  numerator: { kind: 'text', text: 'x' },
  denominator: { kind: 'text', text: '2' },
};
it('inserts and edits a semantic equation with independent history, marks and selected node', () => {
  const editor = fixture(),
    before = editor.state.doc;
  expect(wordSetMath(editor, equation)).toBe(true);
  expect(editor.state.selection).toBeInstanceOf(NodeSelection);
  expect(editor.state.doc.nodeAt(3)!.marks[0].type.name).toBe('bold');
  expect(editor.getText()).toContain('(x)/(2)');
  const edited = { kind: 'script', base: equation, sup: { kind: 'text', text: '3' } };
  wordSetMath(editor, edited);
  editor.commands.undo();
  expect(editor.state.doc.nodeAt(3)!.attrs.equation).toEqual(equation);
  editor.commands.undo();
  expect(editor.state.doc.eq(before)).toBe(true);
  editor.commands.redo();
  editor.commands.redo();
  expect(editor.state.doc.nodeAt(3)!.attrs.equation).toEqual(edited);
});
it('rejects invalid trees, readonly, composition and nonempty text selection without writes', () => {
  const editor = fixture(),
    before = editor.state.doc,
    depth = undoDepth(editor.state);
  expect(() => wordSetMath(editor, { kind: 'matrix', rows: [] })).toThrow();
  editor.setEditable(false);
  expect(wordSetMath(editor, equation)).toBe(false);
  editor.setEditable(true);
  Object.defineProperty(editor.view, 'composing', { configurable: true, value: true });
  expect(wordSetMath(editor, equation)).toBe(false);
  Object.defineProperty(editor.view, 'composing', { configurable: true, value: false });
  editor.commands.setTextSelection({ from: 1, to: 3 });
  expect(() => wordSetMath(editor, equation)).toThrow('光标');
  expect(editor.state.doc.eq(before)).toBe(true);
  expect(undoDepth(editor.state)).toBe(depth);
});
it('renders actual MathML in the canvas and retains the semantic tree through HTML serialization', () => {
  const editor = fixture(),
    container = document.createElement('div');
  document.body.append(container);
  editor.mount(container);
  editor.commands.setTextSelection(3);
  wordSetMath(editor, equation);
  expect(container.querySelector('math mfrac')).not.toBeNull();
  const html = editor.getHTML();
  expect(html).toContain("<mfrac>");
  editor.commands.setContent(html);
  let restored: unknown;
  editor.state.doc.descendants((node) => {
    if (node.type.name === 'mathEquation') restored = node.attrs.equation;
  });
  expect(restored).toEqual(equation);
  container.remove();
});

it('builds namespaced serialization specs without a browser global document', () => {
  const editor = fixture();
  wordSetMath(editor, equation);
  const node = editor.state.doc.nodeAt(3)!;
  let output: unknown;
  vi.stubGlobal('document', undefined);
  try {
    output = node.type.spec.toDOM!(node);
  } finally {
    vi.unstubAllGlobals();
  }
  expect(JSON.stringify(output)).toContain('http://www.w3.org/1998/Math/MathML mfrac');
  expect(editor.getHTML()).toContain('<mfrac>');
});

it('retains display alignment through canvas, HTML serialization and independent history', () => {
  const editor = fixture(), container = document.createElement('div');
  document.body.append(container); editor.mount(container);
  editor.commands.setTextSelection(3);
  const tree = { kind: 'display', align: 'right', body: equation };
  wordSetMath(editor, tree);
  expect(container.querySelector('math')?.getAttribute('display')).toBe('block');
  const html = editor.getHTML();
  expect(html).toContain('justify-content:flex-end');
  wordSetMath(editor, { ...tree, align: 'left' });
  editor.commands.undo();
  expect(editor.state.doc.nodeAt(3)!.attrs.equation.align).toBe('right');
  editor.commands.redo();
  expect(editor.state.doc.nodeAt(3)!.attrs.equation.align).toBe('left');
  editor.commands.setContent(html);
  let restored: unknown;
  editor.state.doc.descendants(node => { if (node.type.name === 'mathEquation') restored = node.attrs.equation; });
  expect(restored).toEqual(tree);
  container.remove();
});

it('preserves multiple display group members in canvas and HTML and undoes one group edit', () => {
  const editor = fixture();
  const tree = { kind: 'display', align: 'centerGroup', body: equation, following: [{ kind: 'text', text: 'y' }] };
  wordSetMath(editor, tree);
  const html = editor.getHTML();
  expect(html).toContain('mspace');
  wordSetMath(editor, { ...tree, following: [{ kind: 'text', text: 'z' }] });
  editor.commands.undo();
  expect(editor.state.doc.nodeAt(3)!.attrs.equation).toEqual(tree);
  editor.commands.redo();
  expect(editor.state.doc.nodeAt(3)!.attrs.equation.following[0].text).toBe('z');
  editor.commands.setContent(html);
  let restored: unknown;
  editor.state.doc.descendants(node => { if (node.type.name === 'mathEquation') restored = node.attrs.equation; });
  expect(restored).toEqual(tree);
});
