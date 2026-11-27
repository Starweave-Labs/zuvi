import { undoDepth } from '@tiptap/pm/history';
import type { Editor } from '@tiptap/react';
import { useLayoutEffect, useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { StudioWord } from './StudioWord';
import type { StudioEditorProps, StudioWordDocument } from './studio-types';

const model = (): StudioWordDocument => ({
  version: 1, id: 'word-basic-format', name: '基础格式.docx', kind: 'word',
  page: { size: 'A4', orientation: 'portrait', margin: 20 },
  content: { type: 'doc', content: [
    { type: 'paragraph', content: [
      { type: 'text', text: 'Plain ', marks: [{ type: 'textStyle', attrs: { fontFamily: 'Arial', fontSize: '12pt' } }] },
      { type: 'text', text: 'Formatted', marks: [
        { type: 'bold' }, { type: 'italic' }, { type: 'underline' }, { type: 'strike' },
        { type: 'textStyle', attrs: { fontFamily: 'Times New Roman', fontSize: '14.5pt', backgroundColor: '#ffff00' } },
      ] },
    ] },
    { type: 'paragraph', content: [{ type: 'text', text: 'Caret base', marks: [{ type: 'textStyle', attrs: { fontFamily: 'Arial', fontSize: '12pt' } }] }] },
  ] },
});

function Host({ document, onChange, ...props }: StudioEditorProps<StudioWordDocument>) {
  const [value, setValue] = useState(document);
  useLayoutEffect(() => setValue(document), [document]);
  return <StudioWord {...props} document={value} onChange={next => { setValue(next); onChange(next); }} />;
}

async function mount(permissions: { readOnly?: boolean; disabled?: boolean } = {}) {
  const document = model(), onChange = vi.fn();
  const view = render(<Host document={document} onChange={onChange} disabled={!!permissions.disabled} readOnly={!!permissions.readOnly} />);
  const textbox = await screen.findByRole('textbox', { name: 'Word 文档正文' });
  const editor = (textbox as HTMLElement & { editor: Editor }).editor;
  return { ...view, document, textbox, editor, onChange };
}

function firstParagraph(editor: Editor) {
  act(() => editor.chain().focus().setTextSelection({ from: 1, to: editor.state.doc.firstChild!.nodeSize - 1 }).run());
}

const restore: (() => void)[] = [];
beforeAll(() => {
  for (const [prototype, key, implementation] of [
    [Range.prototype, 'getClientRects', () => []],
    [Range.prototype, 'getBoundingClientRect', () => ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 })],
    [HTMLElement.prototype, 'scrollIntoView', () => undefined],
  ] as const) {
    if (key in prototype) continue;
    Object.defineProperty(prototype, key, { configurable: true, value: implementation });
    restore.push(() => Reflect.deleteProperty(prototype, key));
  }
});
afterAll(() => restore.forEach(callback => callback()));
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('Word basic character acceptance', () => {
  it.each(['粗体', '斜体', '下划线', '删除线'])('presents a mixed %s selection and changes the whole range in one undo event', async label => {
    const { editor, onChange } = await mount();
    firstParagraph(editor);
    const before = editor.getJSON(), depth = undoDepth(editor.state);
    const button = screen.getByRole('button', { name: label });
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'mixed'));
    fireEvent.click(button);
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'true'));
    const after = editor.getJSON();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(undoDepth(editor.state)).toBe(depth + 1);
    expect(editor.state.selection.from).toBe(1);
    expect(editor.state.selection.to).toBe(editor.state.doc.firstChild!.nodeSize - 1);
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    await waitFor(() => expect(editor.getJSON()).toEqual(before));
    fireEvent.click(screen.getByRole('button', { name: '重做' }));
    await waitFor(() => expect(editor.getJSON()).toEqual(after));
    fireEvent.click(button);
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'false'));
    expect(undoDepth(editor.state)).toBe(depth + 2);
  });

  it.each([
    ['字体', 'Arial', 'fontFamily', 'Arial'],
    ['字号', '12', 'fontSize', '12pt'],
  ])('applies the first run value to a mixed %s range rather than skipping the commit', async (label, input, key, expected) => {
    const { editor, onChange } = await mount();
    firstParagraph(editor);
    const before = editor.getJSON(), depth = undoDepth(editor.state);
    const control = screen.getByRole('combobox', { name: label });
    fireEvent.focus(control);
    fireEvent.change(control, { target: { value: input } });
    fireEvent.keyDown(control, { key: 'Enter' });
    await waitFor(() => {
      editor.state.doc.firstChild!.forEach(node => expect(node.marks.find(mark => mark.type.name === 'textStyle')!.attrs[key]).toBe(expected));
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(undoDepth(editor.state)).toBe(depth + 1);
    const after = editor.getJSON();
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    await waitFor(() => expect(editor.getJSON()).toEqual(before));
    fireEvent.click(screen.getByRole('button', { name: '重做' }));
    await waitFor(() => expect(editor.getJSON()).toEqual(after));
  });

  it('clears a later run highlight when the first run has font attributes but no highlight', async () => {
    const { editor, onChange } = await mount();
    firstParagraph(editor);
    const before = editor.getJSON(), depth = undoDepth(editor.state);
    fireEvent.click(screen.getByRole('button', { name: '文字高亮' }));
    const clear = await screen.findByRole('menuitem', { name: '无颜色' });
    expect(clear).not.toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(clear);
    await waitFor(() => editor.state.doc.firstChild!.forEach(node => expect(node.marks.find(mark => mark.type.name === 'textStyle')?.attrs.backgroundColor).toBeFalsy()));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(undoDepth(editor.state)).toBe(depth + 1);
    const after = editor.getJSON();
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    await waitFor(() => expect(editor.getJSON()).toEqual(before));
    fireEvent.click(screen.getByRole('button', { name: '重做' }));
    await waitFor(() => expect(editor.getJSON()).toEqual(after));
  });

  it('switches superscript and subscript exclusively, cancels to baseline and restores each transaction', async () => {
    const { editor } = await mount();
    firstParagraph(editor);
    const before = editor.getJSON(), depth = undoDepth(editor.state);
    fireEvent.click(screen.getByRole('button', { name: '上标' }));
    const superscript = editor.getJSON();
    expect(undoDepth(editor.state)).toBe(depth + 1);
    fireEvent.click(screen.getByRole('button', { name: '下标' }));
    const subscript = editor.getJSON();
    editor.state.doc.firstChild!.forEach(node => {
      expect(node.marks.some(mark => mark.type.name === 'superscript')).toBe(false);
      expect(node.marks.some(mark => mark.type.name === 'subscript')).toBe(true);
    });
    fireEvent.click(screen.getByRole('button', { name: '下标' }));
    expect(editor.getJSON()).toEqual(before);
    expect(undoDepth(editor.state)).toBe(depth + 3);
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    await waitFor(() => expect(editor.getJSON()).toEqual(subscript));
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    await waitFor(() => expect(editor.getJSON()).toEqual(superscript));
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    await waitFor(() => expect(editor.getJSON()).toEqual(before));
    for (let round = 0; round < 3; round++) fireEvent.click(screen.getByRole('button', { name: '重做' }));
    await waitFor(() => expect(editor.getJSON()).toEqual(before));
  });

  it('applies typed fonts and half-point sizes only to subsequent caret input, then undoes and redoes that inserted run', async () => {
    const { editor, onChange } = await mount();
    const position = editor.state.doc.firstChild!.nodeSize + 7;
    act(() => editor.chain().focus().setTextSelection(position).run());
    const before = editor.getJSON(), depth = undoDepth(editor.state);
    for (const [label, value] of [['字体', 'Times New Roman'], ['字号', '17,3pt']]) {
      const control = screen.getByRole('combobox', { name: label });
      fireEvent.focus(control);
      fireEvent.change(control, { target: { value } });
      fireEvent.keyDown(control, { key: 'Enter' });
    }
    expect(editor.getJSON()).toEqual(before);
    expect(onChange).not.toHaveBeenCalled();
    act(() => editor.commands.insertContent('Typed'));
    const after = editor.getJSON(), attrs = editor.state.doc.nodeAt(position)!.marks.find(mark => mark.type.name === 'textStyle')!.attrs;
    expect(attrs).toMatchObject({ fontFamily: 'Times New Roman', fontSize: '17.5pt' });
    expect(undoDepth(editor.state)).toBe(depth + 1);
    expect(onChange).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    await waitFor(() => expect(editor.getJSON()).toEqual(before));
    fireEvent.click(screen.getByRole('button', { name: '重做' }));
    await waitFor(() => expect(editor.getJSON()).toEqual(after));
  });

  it('highlights subsequent caret input, clears the stored highlight and keeps the following typing in a separate history event', async () => {
    const { editor } = await mount();
    const position = editor.state.doc.firstChild!.nodeSize + 7;
    act(() => editor.chain().focus().setTextSelection(position).run());
    const before = editor.getJSON(), depth = undoDepth(editor.state);
    fireEvent.click(screen.getByRole('button', { name: '文字高亮' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: '黄色' }));
    expect(editor.getJSON()).toEqual(before);
    act(() => editor.commands.insertContent('H'));
    const highlighted = editor.getJSON();
    expect(editor.state.doc.nodeAt(position)!.marks.find(mark => mark.type.name === 'textStyle')!.attrs.backgroundColor).toBe('#ffff00');
    expect(undoDepth(editor.state)).toBe(depth + 1);
    fireEvent.click(screen.getByRole('button', { name: '文字高亮' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: '无颜色' }));
    expect(editor.getJSON()).toEqual(highlighted);
    act(() => editor.commands.insertContent('C'));
    const after = editor.getJSON();
    expect(editor.state.doc.nodeAt(position + 1)!.marks.find(mark => mark.type.name === 'textStyle')?.attrs.backgroundColor).toBeFalsy();
    expect(undoDepth(editor.state)).toBe(depth + 2);
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    await waitFor(() => expect(editor.getJSON()).toEqual(highlighted));
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    await waitFor(() => expect(editor.getJSON()).toEqual(before));
    for (let round = 0; round < 2; round++) fireEvent.click(screen.getByRole('button', { name: '重做' }));
    await waitFor(() => expect(editor.getJSON()).toEqual(after));
  });

  it('preserves a mixed range during font IME and cancellation, and commits the completed decimal size once', async () => {
    const { editor, onChange } = await mount();
    firstParagraph(editor);
    const before = editor.getJSON(), selection = editor.state.selection, depth = undoDepth(editor.state);
    const family = screen.getByRole('combobox', { name: '字体' });
    fireEvent.focus(family);
    fireEvent.compositionStart(family);
    fireEvent.change(family, { target: { value: '宋体' } });
    fireEvent.keyDown(family, { key: 'Enter', isComposing: true });
    expect(editor.getJSON()).toEqual(before);
    fireEvent.compositionEnd(family, { data: '宋体' });
    fireEvent.keyDown(family, { key: 'Escape' });
    expect(editor.getJSON()).toEqual(before);
    expect(editor.state.selection.eq(selection)).toBe(true);
    const size = screen.getByRole('combobox', { name: '字号' });
    fireEvent.focus(size);
    fireEvent.compositionStart(size);
    fireEvent.change(size, { target: { value: '17.3pt' } });
    fireEvent.keyDown(size, { key: 'Enter', isComposing: true });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.compositionEnd(size, { data: '17.3pt' });
    fireEvent.keyDown(size, { key: 'Enter' });
    await waitFor(() => editor.state.doc.firstChild!.forEach(node => expect(node.marks.find(mark => mark.type.name === 'textStyle')!.attrs.fontSize).toBe('17.5pt')));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(editor.state.selection.eq(selection)).toBe(true);
    expect(undoDepth(editor.state)).toBe(depth + 1);
  });

  it.each(['粗体', '上标'])('refuses %s during editor composition without changing content or history', async label => {
    const { editor, textbox, onChange } = await mount();
    firstParagraph(editor);
    const before = editor.getJSON(), depth = undoDepth(editor.state);
    fireEvent.compositionStart(textbox);
    expect(editor.view.composing).toBe(true);
    const button = screen.getByRole('button', { name: label });
    fireEvent.mouseDown(button);
    fireEvent.click(button);
    expect(editor.getJSON()).toEqual(before);
    expect(onChange).not.toHaveBeenCalled();
    expect(undoDepth(editor.state)).toBe(depth);
    fireEvent.compositionEnd(textbox);
  });

  it('refuses a formatting action while the active size draft is invalid and applies it after Escape cancels that draft', async () => {
    const { editor, onChange } = await mount();
    firstParagraph(editor);
    const before = editor.getJSON(), depth = undoDepth(editor.state);
    const size = screen.getByRole('combobox', { name: '字号' });
    fireEvent.focus(size);
    fireEvent.change(size, { target: { value: '410' } });
    fireEvent.keyDown(size, { key: 'Enter' });
    expect(size).toHaveAttribute('aria-invalid', 'true');
    const bold = screen.getByRole('button', { name: '粗体' });
    fireEvent.mouseDown(bold);
    fireEvent.click(bold);
    expect(editor.getJSON()).toEqual(before);
    expect(onChange).not.toHaveBeenCalled();
    expect(undoDepth(editor.state)).toBe(depth);
    fireEvent.keyDown(size, { key: 'Escape' });
    fireEvent.click(bold);
    await waitFor(() => expect(bold).toHaveAttribute('aria-pressed', 'true'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(undoDepth(editor.state)).toBe(depth + 1);
  });

  it.each([{ readOnly: true }, { disabled: true }])('blocks all character controls and mark shortcuts with %j', async permissions => {
    const { editor, textbox, onChange } = await mount(permissions);
    const before = editor.getJSON();
    for (const name of ['粗体', '斜体', '下划线', '删除线', '上标', '下标', '文字高亮'])
      expect(screen.getByRole('button', { name })).toBeDisabled();
    for (const name of ['字体', '字号']) expect(screen.getByRole('combobox', { name })).toBeDisabled();
    for (const key of ['b', 'i', 'u']) fireEvent.keyDown(textbox, { key, ctrlKey: true });
    expect(editor.getJSON()).toEqual(before);
    expect(onChange).not.toHaveBeenCalled();
  });
});
