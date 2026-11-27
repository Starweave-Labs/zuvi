import * as React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeAll, afterEach, it, expect, vi } from 'vitest';
import type { Editor } from '@tiptap/react';
import { StudioWord } from './StudioWord';
import type { StudioWordDocument } from './studio-types';

function documentModel(): StudioWordDocument {
  return { version: 1, id: 'word-neighbor-audit', name: 'Neighbor.docx', kind: 'word', page: { size: 'A4', orientation: 'portrait', margin: 20 }, content: { type: 'doc', content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'SOURCE', marks: [{ type: 'bold' }, { type: 'textStyle', attrs: { fontSize: '18pt', color: '#0055aa' } }] }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'target', marks: [{ type: 'italic' }] }] },
  ] } };
}
function Host({ initial }: { initial: StudioWordDocument }) {
  const [value, setValue] = React.useState(initial);
  return React.createElement(StudioWord, { document: value, onChange: setValue, disabled: false, readOnly: false });
}
async function mount(initial = documentModel()) {
  const view = render(React.createElement(Host, { initial }));
  const body = await screen.findByRole('textbox', { name: 'Word 文档正文' });
  const editor = (body as HTMLElement & { editor: Editor }).editor;
  act(() => editor.chain().focus().setTextSelection({ from: 1, to: 7 }).run());
  return { ...view, body, editor };
}
beforeAll(() => {
  if (!Range.prototype.getClientRects) Object.defineProperty(Range.prototype, 'getClientRects', { configurable: true, value: () => [] });
  if (!Range.prototype.getBoundingClientRect) Object.defineProperty(Range.prototype, 'getBoundingClientRect', { configurable: true, value: () => ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }) });
  if (!HTMLElement.prototype.scrollIntoView) Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: () => undefined });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('W009 clear format should not change the document while the body is composing', async () => {
  const { body, editor } = await mount();
  const before = editor.getJSON();
  fireEvent.compositionStart(body);
  expect(editor.view.composing).toBe(true);
  const button = screen.getByRole('button', { name: '清除格式' });
  fireEvent.mouseDown(button); fireEvent.click(button);
  expect(editor.getJSON()).toEqual(before);
  fireEvent.compositionEnd(body);
  fireEvent.click(button);
  expect(editor.getJSON()).not.toEqual(before);
  act(() => editor.commands.undo());
  expect(editor.getJSON()).toEqual(before);
});

it('W010 apply should keep a valid numeric IME draft outside the document until composition ends', async () => {
  const { editor } = await mount();
  const before = editor.getJSON();
  fireEvent.click(screen.getByRole('button', { name: '字符间距与位置' }));
  fireEvent.click(screen.getByRole('button', { name: /^字符间距 / }));
  fireEvent.click(await screen.findByRole('option', { name: '加宽' }));
  const input = screen.getByLabelText('字符间距量（pt）');
  fireEvent.compositionStart(input); fireEvent.change(input, { target: { value: '2' } });
  fireEvent.click(screen.getByRole('button', { name: '应用字符格式' }));
  expect(editor.getJSON()).toEqual(before);
  fireEvent.compositionEnd(input);
  fireEvent.click(screen.getByRole('button', { name: '应用字符格式' }));
  expect(editor.state.doc.firstChild!.firstChild!.marks.find(mark => mark.type.name === 'textStyle')!.attrs.letterSpacing).toBe('2pt');
  act(() => editor.commands.undo());
  expect(editor.getJSON()).toEqual(before);
});

it.each(['0.3', '1.25'])('W010 rejects position %s before applying and recovers at native half-point precision', async value => {
  const { editor } = await mount();
  const before = editor.getJSON();
  fireEvent.click(screen.getByRole('button', { name: '字符间距与位置' }));
  fireEvent.click(screen.getByRole('button', { name: /^字符位置 / }));
  fireEvent.click(await screen.findByRole('option', { name: '降低' }));
  const input = screen.getByLabelText('字符位置量（pt）');
  fireEvent.change(input, { target: { value } });
  const apply = screen.getByRole('button', { name: '应用字符格式' });
  expect(apply).toBeDisabled();
  expect(screen.getByRole('alert')).toHaveTextContent('步长 0.5pt');
  fireEvent.click(apply); expect(editor.getJSON()).toEqual(before);
  fireEvent.change(input, { target: { value: '1.5' } });
  expect(screen.getByText('预览：间距 0pt，位置 -1.5pt')).toBeVisible();
  fireEvent.click(apply);
  expect(editor.state.doc.firstChild!.firstChild!.marks.find(mark => mark.type.name === 'textStyle')!.attrs.baselineShift).toBe('-1.5pt');
  const applied = editor.getJSON();
  act(() => editor.commands.undo()); expect(editor.getJSON()).toEqual(before);
  act(() => editor.commands.redo()); expect(editor.getJSON()).toEqual(applied);
});

it('W002 empty styled header should step its shared inherited font size', async () => {
  const doc = documentModel();
  doc.content.attrs = { paragraphStyles: [{ id: 'review', name: 'Review', run: { fontSize: 14 } }] };
  doc.header = { type: 'doc', content: [{ type: 'paragraph', attrs: { paragraphStyle: 'review', paragraphStyleMaterialized: true } }] };
  await mount(doc);
  const header = await screen.findByRole('textbox', { name: 'Word 页眉' });
  fireEvent.doubleClick(screen.getByLabelText('页眉区域')); fireEvent.focus(header);
  await waitFor(() => expect(header).toHaveAttribute('contenteditable', 'true'));
  fireEvent.click(screen.getByRole('tab', { name: '开始' }));
  expect(screen.getByRole('combobox', { name: '字号' })).toHaveValue('14');
  const errors: string[] = [];
  const listener = (event: ErrorEvent) => { errors.push(event.message); event.preventDefault(); };
  window.addEventListener('error', listener);
  try { fireEvent.click(screen.getByRole('button', { name: '增大字号' })); } finally { window.removeEventListener('error', listener); }
  expect(errors).toEqual([]);
  expect(screen.getByRole('combobox', { name: '字号' })).toHaveValue('16');
});

it('W008 armed format painting should not write a target selection during composition', async () => {
  const { body, editor } = await mount();
  fireEvent.click(screen.getByRole('button', { name: '格式刷' }));
  const before = editor.getJSON();
  fireEvent.compositionStart(body);
  act(() => editor.commands.setTextSelection({ from: 9, to: 15 }));
  await new Promise(resolve => setTimeout(resolve, 20));
  expect(editor.getJSON()).toEqual(before);
  fireEvent.compositionEnd(body);
  act(() => editor.commands.setTextSelection({ from: 1, to: 7 }));
  act(() => editor.commands.setTextSelection({ from: 9, to: 15 }));
  await waitFor(() => expect(editor.state.doc.child(1).firstChild!.marks.some(mark => mark.type.name === 'bold')).toBe(true));
  act(() => editor.commands.undo());
  expect(editor.getJSON()).toEqual(before);
});

it.each([
  ['全部小写', 'ΟΣ', 'ος'],
  ['句首字母大写', 'ΟΣ', 'Ος'],
  ['每个单词首字母大写', 'ΟΣ', 'Ος'],
  ['切换大小写', 'ΟΣ', 'ος'],
  ['全部大写', 'ος', 'ΟΣ'],
])('W007 %s preserves Unicode context across original formatting boundaries', async (label, input, output) => {
  const doc = documentModel();
  doc.content.content![0].content = [
    { type: 'text', text: input[0], marks: [{ type: 'bold' }] },
    { type: 'text', text: input[1], marks: [{ type: 'italic' }, { type: 'link', attrs: { href: 'https://example.com/kept' } }] },
  ];
  const { editor } = await mount(doc);
  act(() => editor.commands.setTextSelection({ from: 1, to: 3 }));
  const before = editor.getJSON();
  fireEvent.click(screen.getByRole('button', { name: '变更大小写' }));
  fireEvent.click(await screen.findByRole('menuitem', { name: label }));
  expect(editor.state.doc.firstChild!.textContent).toBe(output);
  expect(editor.state.doc.firstChild!.child(0).marks.some(mark => mark.type.name === 'bold')).toBe(true);
  expect(editor.state.doc.firstChild!.child(1).marks.find(mark => mark.type.name === 'link')!.attrs.href).toBe('https://example.com/kept');
  expect(editor.state.doc.child(1).textContent).toBe('target');
  const after = editor.getJSON();
  act(() => editor.commands.undo());
  expect(editor.getJSON()).toEqual(before);
  act(() => editor.commands.redo());
  expect(editor.getJSON()).toEqual(after);
});

it('W007 maps Unicode length changes and surrogate pairs to their original marks and selection', async () => {
  const doc = documentModel();
  const first = 'İΣ', second = 'ΟΣ ß😀', input = first + second;
  doc.content.content![0].content = [
    { type: 'text', text: first, marks: [{ type: 'bold' }] },
    { type: 'text', text: second, marks: [{ type: 'italic' }, { type: 'link', attrs: { href: 'https://example.com/kept' } }] },
  ];
  const { editor } = await mount(doc);
  act(() => editor.commands.setTextSelection({ from: 1, to: input.length + 1 }));
  const before = editor.getJSON();
  fireEvent.click(screen.getByRole('button', { name: '变更大小写' }));
  fireEvent.click(await screen.findByRole('menuitem', { name: '全部小写' }));
  const expected = input.toLocaleLowerCase('zh-Hans-CN');
  expect(editor.state.doc.firstChild!.textContent).toBe(expected);
  expect(editor.state.selection.from).toBe(1);
  expect(editor.state.selection.to).toBe(expected.length + 1);
  expect(editor.state.doc.firstChild!.child(0).textContent).toBe('i\u0307σ');
  expect(editor.state.doc.firstChild!.child(0).marks.some(mark => mark.type.name === 'bold')).toBe(true);
  expect(editor.state.doc.firstChild!.child(1).marks.find(mark => mark.type.name === 'link')!.attrs.href).toBe('https://example.com/kept');
  act(() => editor.commands.undo());
  expect(editor.getJSON()).toEqual(before);
});

it('W007 retains unselected characters while using the surrounding word as lowercase context', async () => {
  const doc = documentModel();
  doc.content.content![0].content = [{ type: 'text', text: 'ΟΣ tail' }];
  const { editor } = await mount(doc);
  act(() => editor.commands.setTextSelection({ from: 2, to: 3 }));
  fireEvent.click(screen.getByRole('button', { name: '变更大小写' }));
  fireEvent.click(await screen.findByRole('menuitem', { name: '全部小写' }));
  expect(editor.state.doc.firstChild!.textContent).toBe('Ος tail');
  expect(editor.state.selection.from).toBe(2); expect(editor.state.selection.to).toBe(3);
});
