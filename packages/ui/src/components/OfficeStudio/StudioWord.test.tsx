import { CellSelection } from '@tiptap/pm/tables';
import type { Editor } from '@tiptap/react';
import { createRef, StrictMode, useLayoutEffect, useState } from 'react';
import { renderToString } from 'react-dom/server';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { StudioWord } from './StudioWord';
import { wordNextFontSize } from './studio-word-tools';
import { OfficeStudio } from './OfficeStudio';
import type {
  OfficeStudioHandle,
  StudioEditorProps,
  StudioRichNode,
  StudioWordDocument,
  StudioWordParagraphStyle,
} from './studio-types';

const namedStyleDocument = (autoUpdate = false): StudioWordDocument => ({
  version: 1,
  id: 'named-style-test',
  name: '样式.docx',
  kind: 'word',
  page: { size: 'A4', orientation: 'portrait', margin: 20 },
  content: {
    type: 'doc',
    attrs: {
      paragraphStyles: [
        {
          id: 'review',
          name: '评审正文',
          run: { fontSize: 14, bold: true },
          paragraph: { lineHeight: 1.5 },
          next: 'paragraph',
          autoUpdate,
        },
      ],
    },
    content: ['第一段', '第二段'].map((text) => ({
      type: 'paragraph',
      attrs: { paragraphStyle: 'review', paragraphStyleMaterialized: true, lineHeight: 1.5 },
      content: [
        {
          type: 'text',
          text,
          marks: [
            { type: 'bold' },
            {
              type: 'textStyle',
              attrs: { fontFamily: 'Noto Sans SC', fontSize: '14pt', color: '#1f2937' },
            },
          ],
        },
      ],
    })),
  },
});

const documentModel = (text = '项目评审内容'): StudioWordDocument => ({
  version: 1,
  id: 'word-ui-test',
  name: '测试.docx',
  kind: 'word',
  page: { size: 'A4', orientation: 'portrait', margin: 20 },
  content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] },
});
const emptyRegion = (): StudioRichNode => ({ type: 'doc', content: [{ type: 'paragraph' }] });
const PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y3nRmwAAAAASUVORK5CYII=';
const JPEG =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAQACADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDn6KKK++PngooooA//2Q==';

function selectNodeContents(textbox: HTMLElement, node: Node) {
  act(() => {
    textbox.focus();
    const range = document.createRange();
    range.selectNodeContents(node);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  });
}

const restore: (() => void)[] = [];

describe('Word paragraph dialog and ruler', () => {
  it('edits inherited tab stops through ZUVI controls with precision checks, cancellation and one history step', async () => {
    const model = namedStyleDocument();
    model.defaultTabStop = 30;
    (model.content.attrs!.paragraphStyles as StudioWordParagraphStyle[])[0].tabStops = [
      { position: 180, alignment: 'right', leader: 'dot' },
    ];
    const { textbox, onChange } = await mount({ document: model });
    selectNodeContents(textbox, textbox.querySelector('p')!);
    fireEvent.click(screen.getByRole('button', { name: '制表位' }));
    expect(screen.getByText(/当前默认每 30pt/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^180pt/ }));
    fireEvent.change(screen.getByLabelText('制表位位置（pt）'), { target: { value: '144.03' } });
    expect(screen.getByRole('button', { name: '应用制表位' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '制表位' }));
    fireEvent.click(screen.getByRole('button', { name: /^180pt/ }));
    fireEvent.change(screen.getByLabelText('制表位位置（pt）'), { target: { value: '144.05' } });
    fireEvent.click(screen.getByRole('button', { name: '应用制表位' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.lastCall?.[0].content.content[0].attrs.tabStops).toEqual(
      [
        { position: 180, alignment: 'clear' },
        { position: 144.05, alignment: 'right', leader: 'dot' },
      ].sort((a, b) => a.position - b.position)
    );
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    expect(onChange.mock.lastCall?.[0].content.content[0].attrs.tabStops).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '重做' }));
    expect(onChange.mock.lastCall?.[0].content.content[0].attrs.tabStops).toHaveLength(2);
  });
  beforeAll(() =>
    vi.stubGlobal(
      'PointerEvent',
      class extends MouseEvent {
        pointerId: number;
        constructor(type: string, init: MouseEventInit & { pointerId?: number } = {}) {
          super(type, init);
          this.pointerId = init.pointerId ?? 7;
        }
      }
    )
  );
  afterAll(() => vi.unstubAllGlobals());
  function paragraphSetup() {
    const initial = documentModel();
    initial.content.content = [
      {
        type: 'paragraph',
        attrs: { indentLeft: 8, indentFirstLine: 4, lineHeight: 1.5, spaceAfter: 6 },
        content: [{ type: 'text', text: 'Alpha' }],
      },
      {
        type: 'paragraph',
        attrs: {
          indentLeft: 16,
          indentFirstLine: -4,
          lineHeight: 18,
          lineHeightRule: 'exact',
          spaceAfter: 9,
        },
        content: [{ type: 'text', text: 'Beta' }],
      },
    ];
    let current = initial;
    const changed = vi.fn();
    function Harness(props: { readOnly: boolean; disabled: boolean }) {
      const [doc, setDoc] = useState(initial);
      return (
        <StudioWord
          {...props}
          document={doc}
          onChange={(next) => {
            current = next;
            changed(next);
            setDoc(next);
          }}
        />
      );
    }
    const view = render(<Harness readOnly={false} disabled={false} />);
    return {
      changed,
      current: () => current,
      permissions: (props: { readOnly: boolean; disabled: boolean }) =>
        view.rerender(<Harness {...props} />),
    };
  }
  const chooseParagraph = (label: string, value: string) => {
    const trigger = within(screen.getByRole('dialog')).getByRole('button', {
      name: new RegExp(`^${label}`),
    });
    fireEvent.click(trigger);
    const list = document.getElementById(trigger.getAttribute('aria-controls')!)!;
    fireEvent.click(within(list).getByRole('option', { name: value }));
  };
  it('applies mixed paragraph values in one history step and keeps untouched values separate', async () => {
    const f = paragraphSetup();
    const body = await screen.findByRole('textbox', { name: 'Word 文档正文' });
    selectNodeContents(body, body);
    fireEvent.click(screen.getByRole('button', { name: '段落设置' }));
    fireEvent.change(screen.getByLabelText('左缩进（pt）'), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText('右缩进（pt）'), { target: { value: '10' } });
    chooseParagraph('特殊缩进', '悬挂');
    fireEvent.change(screen.getByLabelText('特殊缩进量（pt）'), { target: { value: '12' } });
    chooseParagraph('行距类型', '固定值');
    fireEvent.change(screen.getByLabelText('行距量'), { target: { value: '24' } });
    fireEvent.click(screen.getByRole('button', { name: '应用段落设置' }));
    expect(f.changed).toHaveBeenCalledTimes(1);
    for (const p of f.current().content.content!)
      expect(p.attrs).toMatchObject({
        indentLeft: 30,
        indentRight: 10,
        indentFirstLine: -12,
        lineHeight: 24,
        lineHeightRule: 'exact',
      });
    expect(f.current().content.content!.map((p) => p.attrs?.spaceAfter)).toEqual([6, 9]);
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    expect(f.current().content.content![0].attrs?.indentLeft).toBe(8);
    fireEvent.click(screen.getByRole('button', { name: '重做' }));
    expect(f.current().content.content![0].attrs?.indentLeft).toBe(30);
  });
  it('retains invalid dialog drafts and disables an open dialog after permission changes', async () => {
    const f = paragraphSetup();
    const body = await screen.findByRole('textbox', { name: 'Word 文档正文' });
    selectNodeContents(body, body.firstChild!);
    fireEvent.click(screen.getByRole('button', { name: '段落设置' }));
    const input = screen.getByLabelText('左缩进（pt）');
    fireEvent.change(input, { target: { value: '1x' } });
    expect(screen.getByRole('alert')).toBeVisible();
    expect(screen.getByRole('button', { name: '应用段落设置' })).toBeDisabled();
    f.permissions({ readOnly: true, disabled: false });
    expect(input).toHaveValue('1x');
    expect(input).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    expect(f.changed).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '段落设置' })).toBeDisabled();
  });
  it('keeps mixed pagination flags unchanged until edited, commits once, and blocks an open dialog after permission changes', async () => {
    const f = paragraphSetup();
    const body = await screen.findByRole('textbox', { name: 'Word 文档正文' });
    selectNodeContents(body, body);
    fireEvent.click(screen.getByRole('button', { name: '段落设置' }));
    chooseParagraph('段内不分页', '开启');
    chooseParagraph('与下段同页', '开启');
    chooseParagraph('孤行控制', '关闭');
    f.permissions({ readOnly: true, disabled: false });
    expect(screen.getByRole('button', { name: '应用段落设置' })).toBeDisabled();
    expect(f.changed).not.toHaveBeenCalled();
    f.permissions({ readOnly: false, disabled: false });
    fireEvent.click(screen.getByRole('button', { name: '应用段落设置' }));
    expect(f.changed).toHaveBeenCalledOnce();
    for (const paragraph of f.current().content.content!)
      expect(paragraph.attrs).toMatchObject({
        keepLines: true,
        keepNext: true,
        widowControl: false,
      });
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    expect(f.current().content.content![0].attrs?.keepLines).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '重做' }));
    expect(f.current().content.content![0].attrs?.keepLines).toBe(true);
    selectNodeContents(body, body.firstChild!);
    fireEvent.click(screen.getByRole('button', { name: '段落设置' }));
    chooseParagraph('段内不分页', '关闭');
    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    expect(f.current().content.content![0].attrs?.keepLines).toBe(true);
  });
  it('lets readonly readers toggle measured pagination without writing data while disabled readers cannot',async()=>{
    const model=documentModel(),onChange=vi.fn();const view=render(<StudioWord document={model} onChange={onChange} readOnly disabled={false}/>);
    await screen.findByRole('textbox',{name:'Word 文档正文'});fireEvent.click(screen.getByRole('tab',{name:'视图'}));const toggle=screen.getByRole('checkbox',{name:'分页布局'});fireEvent.click(toggle);
    expect(toggle).toBeChecked();expect(onChange).not.toHaveBeenCalled();view.rerender(<StudioWord document={model} onChange={onChange} disabled readOnly={false}/>);expect(toggle).toBeDisabled();expect(onChange).not.toHaveBeenCalled();
  });
  it('edits a named header style using shared definitions and restores its direct indent in one undo', async () => {
    const model = namedStyleDocument();
    model.header = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { paragraphStyle: 'review' },
          content: [{ type: 'text', text: 'Named header' }],
        },
      ],
    };
    const { onChange } = await mount({ document: model });
    const header = await screen.findByRole('textbox', { name: 'Word 页眉' });
    fireEvent.doubleClick(screen.getByLabelText('页眉区域'));
    await waitFor(() => expect(header).toHaveAttribute('contenteditable', 'true'));
    selectNodeContents(header, header.querySelector('p')!);
    fireEvent.click(screen.getByRole('tab', { name: '开始' }));
    fireEvent.click(screen.getByRole('button', { name: '段落设置' }));
    fireEvent.change(screen.getByLabelText('左缩进（pt）'), { target: { value: '24' } });
    fireEvent.click(screen.getByRole('button', { name: '应用段落设置' }));
    expect(header.querySelector('p')).toHaveStyle({ marginLeft: '24pt', lineHeight: '1.5' });
    expect(onChange.mock.lastCall?.[0].header.content[0].attrs.paragraphStyleDirectAttrs).toContain(
      'indentLeft'
    );
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    expect(header.querySelector('p')).toHaveStyle({ marginLeft: '0pt' });
  });
  it('supports keyboard ruler steps without changing first-line offsets', async () => {
    const f = paragraphSetup();
    const body = await screen.findByRole('textbox', { name: 'Word 文档正文' });
    selectNodeContents(body, body.firstChild!);
    const left = await screen.findByRole('slider', { name: '左缩进标尺' });
    fireEvent.keyDown(left, { key: 'ArrowRight', shiftKey: true });
    expect(f.current().content.content![0].attrs).toMatchObject({
      indentLeft: 18,
      indentFirstLine: 4,
    });
    expect(f.changed).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    expect(f.current().content.content![0].attrs?.indentLeft).toBe(8);
    f.permissions({ readOnly: false, disabled: true });
    expect(left).toBeDisabled();
  });
  it('previews ruler drag, restores cancellation and commits pointer release as one operation', async () => {
    const f = paragraphSetup();
    const body = await screen.findByRole('textbox', { name: 'Word 文档正文' });
    selectNodeContents(body, body.firstChild!);
    const left = await screen.findByRole('slider', { name: '左缩进标尺' });
    const ruler = left.closest('[data-part="word-ruler"]')!;
    vi.spyOn(ruler, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 0,
      width: 794,
      height: 26,
      right: 894,
      bottom: 26,
      x: 100,
      y: 0,
      toJSON: () => ({}),
    });
    const origin = parseFloat(left.style.left) - (8 * 4) / 3;
    fireEvent.pointerDown(left, {
      button: 0,
      pointerId: 7,
      clientX: 100 + parseFloat(left.style.left),
    });
    fireEvent.pointerMove(window, { pointerId: 7, clientX: 100 + origin + (30 * 4) / 3 });
    expect((body.firstChild as HTMLElement).style.marginLeft).toBe('30pt');
    expect(f.changed).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect((body.firstChild as HTMLElement).style.marginLeft).toBe('8pt');
    expect(f.changed).not.toHaveBeenCalled();
    fireEvent.pointerDown(left, {
      button: 0,
      pointerId: 7,
      clientX: 100 + parseFloat(left.style.left),
    });
    fireEvent.pointerMove(window, { pointerId: 7, clientX: 100 + origin + (30 * 4) / 3 });
    fireEvent.pointerUp(window, { pointerId: 7 });
    expect(f.current().content.content![0].attrs?.indentLeft).toBe(30);
    expect(f.changed).toHaveBeenCalledTimes(1);
  });
});

describe('Word character metrics dialog', () => {
  function metricsSetup(initial = documentModel()) {
    let current = initial;
    const changed = vi.fn();
    function Harness(props: { readOnly: boolean; disabled: boolean }) {
      const [doc, setDoc] = useState(initial);
      return (
        <StudioWord
          document={doc}
          {...props}
          onChange={(next) => {
            current = next;
            changed(next);
            setDoc(next);
          }}
        />
      );
    }
    const view = render(<Harness readOnly={false} disabled={false} />);
    return {
      current: () => current,
      changed,
      permissions: (props: { readOnly: boolean; disabled: boolean }) =>
        view.rerender(<Harness {...props} />),
    };
  }
  const choose = (label: string, mode: string) => {
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: new RegExp(`^${label}`) }));
    fireEvent.click(screen.getByRole('option', { name: mode }));
  };
  const layoutAttrs = (doc: StudioWordDocument) =>
    doc.content.content![0].content!.map(
      (n) => n.marks?.find((m) => m.type === 'textStyle')?.attrs
    );
  it('preserves mixed fonts and links, previews point measurements and applies one undoable operation', async () => {
    const doc = documentModel();
    doc.content.content![0].content = [
      {
        type: 'text',
        text: 'A',
        marks: [
          { type: 'bold' },
          {
            type: 'textStyle',
            attrs: { fontSize: '14pt', letterSpacing: '1pt', baselineShift: '2pt' },
          },
        ],
      },
      {
        type: 'text',
        text: 'B',
        marks: [
          { type: 'link', attrs: { href: 'https://example.com' } },
          {
            type: 'textStyle',
            attrs: { fontSize: '30pt', letterSpacing: '-0.1pt', baselineShift: '0pt' },
          },
        ],
      },
    ];
    const f = metricsSetup(doc);
    const body = await screen.findByRole('textbox', { name: 'Word 文档正文' });
    selectNodeContents(body, body.querySelector('p')!);
    fireEvent.click(screen.getByRole('button', { name: '字符间距与位置' }));
    expect(within(screen.getByRole('dialog')).getAllByText('混合（保持原值）')).toHaveLength(2);
    choose('字符间距', '加宽');
    fireEvent.change(screen.getByLabelText('字符间距量（pt）'), { target: { value: '1.2' } });
    choose('字符位置', '降低');
    fireEvent.change(screen.getByLabelText('字符位置量（pt）'), { target: { value: '2.5' } });
    expect(screen.getByText('预览：间距 1.2pt，位置 -2.5pt')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '应用字符格式' }));
    expect(f.changed).toHaveBeenCalledTimes(1);
    expect(layoutAttrs(f.current())).toEqual([
      expect.objectContaining({
        fontSize: '14pt',
        letterSpacing: '1.2pt',
        baselineShift: '-2.5pt',
      }),
      expect.objectContaining({
        fontSize: '30pt',
        letterSpacing: '1.2pt',
        baselineShift: '-2.5pt',
      }),
    ]);
    expect(body.querySelector('a')).toHaveAttribute('href', 'https://example.com');
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    expect(layoutAttrs(f.current())[0]?.letterSpacing).toBe('1pt');
    fireEvent.click(screen.getByRole('button', { name: '重做' }));
    expect(layoutAttrs(f.current())[0]?.letterSpacing).toBe('1.2pt');
  });
  it('retains invalid drafts, disables an open dialog on permission changes and cancels without writing', async () => {
    const f = metricsSetup();
    const body = await screen.findByRole('textbox', { name: 'Word 文档正文' });
    selectNodeContents(body, body.firstChild!);
    fireEvent.click(screen.getByRole('button', { name: '字符间距与位置' }));
    choose('字符位置', '提升');
    const input = screen.getByLabelText('字符位置量（pt）');
    fireEvent.change(input, { target: { value: '1.25' } });
    expect(screen.getByRole('alert')).toHaveTextContent('0.5pt');
    expect(screen.getByRole('button', { name: '应用字符格式' })).toBeDisabled();
    f.permissions({ readOnly: true, disabled: false });
    expect(input).toHaveValue('1.25');
    expect(input).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    expect(f.changed).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '字符间距与位置' })).toBeDisabled();
    f.permissions({ readOnly: false, disabled: true });
    expect(screen.getByRole('button', { name: '字符间距与位置' })).toBeDisabled();
  });
  it('blocks an invalid font draft before opening and preserves an unchanged metrics dialog without history', async () => {
    const f = metricsSetup();
    const body = await screen.findByRole('textbox', { name: 'Word 文档正文' });
    selectNodeContents(body, body.firstChild!);
    const size = screen.getByRole('combobox', { name: '字号' });
    act(() => size.focus());
    fireEvent.change(size, { target: { value: '9999' } });
    fireEvent.click(screen.getByRole('button', { name: '字符间距与位置' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.keyDown(size, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: '字符间距与位置' }));
    fireEvent.click(screen.getByRole('button', { name: '应用字符格式' }));
    expect(f.changed).not.toHaveBeenCalled();
  });
  it('applies metrics in the header editor while preserving the body', async () => {
    const doc = documentModel();
    doc.header = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Header' }] }],
    };
    const f = metricsSetup(doc);
    await screen.findByRole('textbox', { name: 'Word 文档正文' });
    fireEvent.doubleClick(screen.getByLabelText('页眉区域'));
    const header = await screen.findByRole('textbox', { name: 'Word 页眉' });
    await waitFor(() => expect(header).toHaveAttribute('contenteditable', 'true'));
    selectNodeContents(header, header.firstChild!);
    fireEvent.click(screen.getByRole('tab', { name: '开始' }));
    fireEvent.click(screen.getByRole('button', { name: '字符间距与位置' }));
    choose('字符间距', '紧缩');
    fireEvent.change(screen.getByLabelText('字符间距量（pt）'), { target: { value: '0.2' } });
    fireEvent.click(screen.getByRole('button', { name: '应用字符格式' }));
    expect(
      f.current().header!.content![0].content![0].marks?.find((m) => m.type === 'textStyle')?.attrs
        ?.letterSpacing
    ).toBe('-0.2pt');
    expect(f.current().content.content![0].content![0].text).toBe('项目评审内容');
  });
});
let restoreClipboard: (() => void) | undefined;

function mockClipboard(api: Partial<Pick<Clipboard, 'readText' | 'writeText'>>) {
  const descriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: api });
  restoreClipboard = () => {
    if (descriptor) Object.defineProperty(navigator, 'clipboard', descriptor);
    else Reflect.deleteProperty(navigator, 'clipboard');
  };
}

beforeAll(() => {
  // jsdom has no layout; these geometry methods let ProseMirror perform selection/focus work.
  for (const [prototype, key, implementation] of [
    [Range.prototype, 'getClientRects', () => []],
    [
      Range.prototype,
      'getBoundingClientRect',
      () => ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }),
    ],
    [HTMLElement.prototype, 'scrollIntoView', () => undefined],
  ] as const) {
    if (key in prototype) continue;
    Object.defineProperty(prototype, key, { configurable: true, value: implementation });
    restore.push(() => Reflect.deleteProperty(prototype, key));
  }
});
afterAll(() => restore.forEach((callback) => callback()));
afterEach(() => {
  cleanup();
  restoreClipboard?.();
  restoreClipboard = undefined;
  vi.restoreAllMocks();
});

describe('StudioWord Office ribbon actions', () => {
  it('shows nonprinting characters in the body, table, header and footer without changing data, selection or document history', async () => {
    const doc = documentModel('A  \tB');
    doc.header = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Header text' }] }],
    };
    doc.footer = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Footer\ttext' }] }],
    };
    doc.content.content!.push({
      type: 'table',
      content: [
        {
          type: 'tableRow',
          content: [
            {
              type: 'tableCell',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Table text' }] }],
            },
          ],
        },
      ],
    });
    const { textbox, onChange } = await mount({ document: doc });
    const paragraph = textbox.querySelector('p')!;
    selectNodeContents(textbox, paragraph);
    const text = textbox.textContent;
    const undoDisabled = screen.getByRole('button', { name: '撤销' }).hasAttribute('disabled');
    const toggle = screen.getByRole('button', { name: '显示非打印字符' });
    fireEvent.mouseDown(toggle);
    fireEvent.click(toggle);
    await waitFor(() =>
      expect(textbox.querySelectorAll('[data-word-nonprinting="paragraph"]')).toHaveLength(2)
    );
    expect(textbox.querySelector('[data-word-nonprinting="tab"]')).not.toBeNull();
    expect(
      screen
        .getByRole('textbox', { name: 'Word 页眉' })
        .querySelector('[data-word-nonprinting="space"]')
    ).not.toBeNull();
    expect(
      screen
        .getByRole('textbox', { name: 'Word 页脚' })
        .querySelector('[data-word-nonprinting="tab"]')
    ).not.toBeNull();
    expect(textbox.textContent).toBe(text);
    expect(window.getSelection()?.toString()).toBe('A  \tB');
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '撤销' }).hasAttribute('disabled')).toBe(
      undoDisabled
    );
    fireEvent.click(screen.getByRole('button', { name: '粗体' }));
    await waitFor(() => expect(textbox.querySelector('strong')).not.toBeNull());
    fireEvent.click(toggle);
    expect(textbox.querySelector('[data-word-nonprinting]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    await waitFor(() => expect(textbox.querySelector('strong')).toBeNull());
    fireEvent.click(screen.getByRole('button', { name: '重做' }));
    await waitFor(() => expect(textbox.querySelector('strong')).not.toBeNull());
    fireEvent.click(screen.getByRole('tab', { name: '视图' }));
    fireEvent.click(screen.getByRole('checkbox', { name: '非打印字符' }));
    await waitFor(() => expect(textbox.querySelector('[data-word-nonprinting]')).not.toBeNull());
  });

  it('allows nonprinting view changes in read-only mode, blocks disabled and IME shortcuts, and ignores editable control drafts', async () => {
    const { textbox, rerender, onChange, document: doc } = await mount({ readOnly: true });
    const toggle = screen.getByRole('button', { name: '显示非打印字符' });
    expect(toggle).not.toBeDisabled();
    fireEvent.keyDown(textbox, { key: '*', ctrlKey: true, shiftKey: true, isComposing: true });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    fireEvent.keyDown(textbox, { key: '8', ctrlKey: true, shiftKey: true });
    await waitFor(() => expect(toggle).toHaveAttribute('aria-pressed', 'true'));
    fireEvent.keyDown(textbox, { key: '8', metaKey: true });
    await waitFor(() => expect(toggle).toHaveAttribute('aria-pressed', 'false'));
    fireEvent.keyDown(screen.getByRole('combobox', { name: '字体' }), {
      key: '8',
      ctrlKey: true,
      shiftKey: true,
    });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    rerender(<WordHost document={doc} onChange={onChange} disabled={true} readOnly={false} />);
    expect(toggle).toBeDisabled();
    fireEvent.keyDown(textbox, { key: '8', ctrlKey: true, shiftKey: true });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('applies font family and size to the selected range and restores them with undo and redo', async () => {
    const { textbox, onChange } = await mount();
    selectNodeContents(textbox, textbox.querySelector('p')!);
    fireEvent.focus(screen.getByRole('combobox', { name: '字体' }));
    fireEvent.keyDown(screen.getByRole('combobox', { name: '字体' }), { key: 'ArrowDown' });
    fireEvent.click(await screen.findByRole('option', { name: '宋体' }));
    await waitFor(() =>
      expect(textbox.querySelector('span')).toHaveStyle({ fontFamily: 'SimSun' })
    );
    fireEvent.focus(screen.getByRole('combobox', { name: '字号' }));
    fireEvent.keyDown(screen.getByRole('combobox', { name: '字号' }), { key: 'ArrowDown' });
    fireEvent.click(await screen.findByRole('option', { name: '18' }));
    await waitFor(() => expect(textbox.querySelector('span')).toHaveStyle({ fontSize: '18pt' }));
    expect(onChange.mock.lastCall?.[0].content.content[0].content[0].marks).toContainEqual(
      expect.objectContaining({
        type: 'textStyle',
        attrs: expect.objectContaining({ fontFamily: 'SimSun', fontSize: '18pt' }),
      })
    );
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    await waitFor(() =>
      expect(textbox.querySelector('span')).not.toHaveStyle({ fontSize: '18pt' })
    );
    expect(textbox.querySelector('span')).toHaveStyle({ fontFamily: 'SimSun' });
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    await waitFor(() => expect(textbox.querySelector('span[style*="SimSun"]')).toBeNull());
    expect(textbox).toHaveTextContent('项目评审内容');
    fireEvent.click(screen.getByRole('button', { name: '重做' }));
    await waitFor(() =>
      expect(textbox.querySelector('span')).toHaveStyle({ fontFamily: 'SimSun' })
    );
    fireEvent.click(screen.getByRole('button', { name: '重做' }));
    await waitFor(() => expect(textbox.querySelector('span')).toHaveStyle({ fontSize: '18pt' }));
    expect(textbox.querySelector('span')).toHaveStyle({ fontFamily: 'SimSun' });
    fireEvent.click(screen.getByRole('button', { name: '文字颜色' }));
    fireEvent.change(await screen.findByRole('textbox', { name: '十六进制颜色值' }), {
      target: { value: '#0055aa' },
    });
    await waitFor(() => expect(textbox.querySelector('span')).toHaveStyle({ color: '#0055aa' }));
    expect(onChange.mock.lastCall?.[0].content.content[0].content[0].marks).toContainEqual(
      expect.objectContaining({
        type: 'textStyle',
        attrs: expect.objectContaining({
          fontFamily: 'SimSun',
          fontSize: '18pt',
          color: '#0055aa',
        }),
      })
    );
  });

  it('applies genuine no-spacing and heading styles through the gallery without replacing text', async () => {
    const { textbox, onChange } = await mount();
    selectNodeContents(textbox, textbox.querySelector('p')!);
    fireEvent.click(screen.getByRole('button', { name: '无间距样式' }));
    await waitFor(() => expect(textbox.querySelector('p')).toHaveStyle({ lineHeight: '1' }));
    expect(onChange.mock.lastCall?.[0].content.content[0].attrs).toMatchObject({
      lineHeight: 1,
      spaceBefore: 0,
      spaceAfter: 0,
    });
    expect(screen.getByRole('button', { name: '无间距样式' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    fireEvent.click(screen.getByRole('button', { name: '正文样式' }));
    await waitFor(() => expect(textbox.querySelector('p')).not.toHaveAttribute('style'));
    fireEvent.click(screen.getByRole('button', { name: '标题 1样式' }));
    await waitFor(() => expect(textbox.querySelector('h1')).toHaveTextContent('项目评审内容'));
    expect(onChange.mock.lastCall?.[0].content.content[0]).toMatchObject({
      type: 'heading',
      attrs: { level: 1 },
    });
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    await waitFor(() => expect(textbox.querySelector('h1')).toBeNull());
    expect(textbox).toHaveTextContent('项目评审内容');
  });

  it('toggles rulers, navigates headings and changes zoom in read-only mode without document edits', async () => {
    const model = documentModel('正文');
    model.content.content!.unshift({
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: '目录入口' }],
    });
    const { container, onChange } = await mount({ document: model, readOnly: true });
    expect(container.querySelectorAll('[data-part="word-ruler"]')).toHaveLength(2);
    fireEvent.click(screen.getByRole('tab', { name: '视图' }));
    fireEvent.click(screen.getByRole('checkbox', { name: '标尺' }));
    expect(container.querySelectorAll('[data-part="word-ruler"]')).toHaveLength(0);
    fireEvent.click(screen.getByRole('checkbox', { name: '标尺' }));
    expect(container.querySelectorAll('[data-part="word-ruler"]')).toHaveLength(2);
    fireEvent.click(screen.getByRole('checkbox', { name: '导航窗格' }));
    fireEvent.click(await screen.findByRole('button', { name: '目录入口' }));
    fireEvent.click(screen.getByRole('tab', { name: '开始' }));
    expect(screen.getByRole('button', { name: '标题 1样式' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    fireEvent.click(screen.getByRole('tab', { name: '视图' }));
    fireEvent.click(screen.getByRole('button', { name: /100% 实际大小/ }));
    expect(screen.getByRole('button', { name: /Word 缩放/ })).toHaveTextContent('100%');
    fireEvent.click(screen.getByRole('button', { name: /^适应宽度$/ }));
    expect(screen.getByRole('button', { name: /Word 缩放/ })).toHaveTextContent('适应宽度');
    fireEvent.click(screen.getByRole('button', { name: '打开文档大纲' }));
    expect(screen.queryByRole('button', { name: '目录入口' })).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('copies plain text, cuts only after a successful write and restores the selected text with undo', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard({ writeText });
    const { textbox, onChange } = await mount({ document: documentModel('预算与预算') });
    selectNodeContents(textbox, textbox.querySelector('p')!);
    await waitFor(() => expect(screen.getByRole('button', { name: '复制' })).not.toBeDisabled());
    fireEvent.click(screen.getByRole('button', { name: '复制' }));
    await screen.findByText('已复制所选文本。');
    expect(writeText).toHaveBeenCalledWith('预算与预算');
    expect(onChange).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole('button', { name: '剪切' })).not.toBeDisabled());
    fireEvent.click(screen.getByRole('button', { name: '剪切' }));
    await waitFor(() => expect(textbox).not.toHaveTextContent('预算与预算'));
    expect(writeText).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    await waitFor(() => expect(textbox).toHaveTextContent('预算与预算'));
  });

  it('pastes multiline clipboard text as paragraphs without interpreting HTML and supports undo', async () => {
    const readText = vi.fn().mockResolvedValue('<img src=x onerror=alert(1)> &\r\n下一段');
    mockClipboard({ readText });
    const { textbox, onChange } = await mount({ document: documentModel('原文') });
    selectNodeContents(textbox, textbox.querySelector('p')!);
    fireEvent.click(screen.getByRole('button', { name: '粘贴' }));
    await waitFor(() => expect(textbox).toHaveTextContent('<img src=x onerror=alert(1)> &下一段'));
    expect([...textbox.querySelectorAll('p')].map((node) => node.textContent)).toEqual([
      '<img src=x onerror=alert(1)> &',
      '下一段',
    ]);
    expect(textbox.querySelector('img, script')).toBeNull();
    expect(onChange).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    await waitFor(() => expect(textbox).toHaveTextContent('原文'));
    expect(textbox).not.toHaveTextContent('下一段');
  });

  it('allows copying a read-only selection while disabling cut and paste', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard({ writeText });
    const { textbox, onChange } = await mount({ readOnly: true });
    selectNodeContents(textbox, textbox.querySelector('p')!);
    await waitFor(() => expect(screen.getByRole('button', { name: '复制' })).not.toBeDisabled());
    expect(screen.getByRole('button', { name: '剪切' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '粘贴' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '复制' }));
    await screen.findByText('已复制所选文本。');
    expect(writeText).toHaveBeenCalledWith('项目评审内容');
    expect(onChange).not.toHaveBeenCalled();
  });

  it.each([
    ['copy', '复制', 'C'],
    ['cut', '剪切', 'X'],
    ['paste', '粘贴', 'V'],
  ] as const)(
    'keeps the document when clipboard %s fails and offers the native shortcut',
    async (_, label, key) => {
      mockClipboard({
        readText: vi.fn().mockRejectedValue(new Error('clipboard denied')),
        writeText: vi.fn().mockRejectedValue(new Error('clipboard denied')),
      });
      const { textbox, onChange } = await mount();
      selectNodeContents(textbox, textbox.querySelector('p')!);
      await waitFor(() => expect(screen.getByRole('button', { name: label })).not.toBeDisabled());
      fireEvent.click(screen.getByRole('button', { name: label }));
      await screen.findByText(`请使用 Ctrl/⌘+${key} ${label}。`);
      expect(textbox).toHaveTextContent('项目评审内容');
      expect(onChange).not.toHaveBeenCalled();
    }
  );

  it.each([
    ['paste', 'same-id'],
    ['paste', 'new-id'],
    ['cut', 'same-id'],
    ['cut', 'new-id'],
  ] as const)(
    'ignores late clipboard %s after a %s document replacement',
    async (action, identity) => {
      let finish!: () => void;
      const readText = vi.fn(
        () =>
          new Promise<string>((resolve) => {
            finish = () => resolve('迟到粘贴');
          })
      );
      const writeText = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            finish = () => resolve();
          })
      );
      mockClipboard({ readText, writeText });
      const { textbox, rerender, onChange } = await mount({ document: documentModel('原文') });
      selectNodeContents(textbox, textbox.querySelector('p')!);
      const label = action === 'paste' ? '粘贴' : '剪切';
      await waitFor(() => expect(screen.getByRole('button', { name: label })).not.toBeDisabled());
      fireEvent.click(screen.getByRole('button', { name: label }));
      expect(action === 'paste' ? readText : writeText).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('button', { name: '粘贴' })).toBeDisabled();
      const next = documentModel(identity === 'same-id' ? '替换正文' : '原文');
      if (identity === 'new-id') next.id = 'next-document';
      rerender(<WordHost document={next} onChange={onChange} disabled={false} readOnly={false} />);
      await waitFor(() =>
        expect(textbox).toHaveTextContent(identity === 'same-id' ? '替换正文' : '原文')
      );
      await act(async () => finish());
      await waitFor(() => expect(screen.getByRole('button', { name: '粘贴' })).not.toBeDisabled());
      expect(textbox).toHaveTextContent(identity === 'same-id' ? '替换正文' : '原文');
      expect(textbox).not.toHaveTextContent('迟到粘贴');
      expect(onChange).not.toHaveBeenCalled();
    }
  );

  it('counts Unicode body characters and paragraphs while the header is active', async () => {
    const model = documentModel('中😀 A');
    model.header = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: '很长的页眉内容' }] }],
    };
    const { container, onChange } = await mount({ document: model });
    const header = await screen.findByRole('textbox', { name: 'Word 页眉' });
    fireEvent.doubleClick(screen.getByLabelText('页眉区域'));
    await waitFor(() => expect(header).toHaveAttribute('contenteditable', 'true'));
    fireEvent.click(screen.getByRole('button', { name: '打开字数统计' }));
    const dialog = await screen.findByRole('dialog', { name: '字数统计' });
    const count = (label: string) =>
      within(dialog).getByText(label).closest('div')?.querySelector('dd')?.textContent;
    expect(count('字符数（含空白）')).toBe('4');
    expect(count('字符数（不含空白）')).toBe('3');
    expect(count('段落数')).toBe('1');
    expect(container.querySelector('[data-part="word-status"]')).toHaveTextContent('3 字');
    expect(container.querySelector('[data-part="word-status"]')).toHaveTextContent('正在编辑页眉');
    expect(onChange).not.toHaveBeenCalled();
  });
});

function WordHost({ document, onChange, ...props }: StudioEditorProps<StudioWordDocument>) {
  const [value, setValue] = useState(document);
  useLayoutEffect(() => setValue(document), [document]);
  return (
    <StudioWord
      {...props}
      document={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

async function mount(
  options: { disabled?: boolean; readOnly?: boolean; document?: StudioWordDocument } = {}
) {
  const onChange = vi.fn();
  const document = options.document || documentModel();
  const view = render(
    <WordHost
      document={document}
      onChange={onChange}
      disabled={options.disabled || false}
      readOnly={options.readOnly || false}
    />
  );
  const textbox = await screen.findByRole('textbox', { name: 'Word 文档正文' });
  return { ...view, textbox, onChange, document };
}

describe('StudioWord named paragraph styles', () => {
  it('creates, applies, modifies and deletes a named style with real undo and redo', async () => {
    const { textbox, onChange } = await mount();
    selectNodeContents(textbox, textbox.querySelector('p')!);
    fireEvent.click(screen.getByRole('button', { name: '新建段落样式' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('样式名称'), { target: { value: '复核格式' } });
    fireEvent.change(within(dialog).getByLabelText('样式字号'), { target: { value: '14' } });
    fireEvent.change(within(dialog).getByLabelText('样式文字颜色'), {
      target: { value: '#185adb' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: '保存样式' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const id = onChange.mock.lastCall?.[0].content.attrs.paragraphStyles[0].id;
    expect(id).toMatch(/^style-/);
    fireEvent.click(screen.getByRole('button', { name: /^段落样式/ }));
    fireEvent.click(await screen.findByRole('option', { name: '复核格式' }));
    await waitFor(() => expect(textbox.querySelector('p')).toHaveAttribute('data-word-style', id));
    expect(textbox.querySelector('span')).toHaveStyle({ fontSize: '14pt', color: '#185adb' });
    expect(textbox).toHaveTextContent('项目评审内容');
    fireEvent.click(screen.getByRole('button', { name: '修改段落样式' }));
    fireEvent.change(await screen.findByLabelText('样式字号'), { target: { value: '20' } });
    fireEvent.click(screen.getByRole('button', { name: '保存样式' }));
    await waitFor(() => expect(textbox.querySelector('span')).toHaveStyle({ fontSize: '20pt' }));
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    await waitFor(() => expect(textbox.querySelector('span')).toHaveStyle({ fontSize: '14pt' }));
    fireEvent.click(screen.getByRole('button', { name: '重做' }));
    await waitFor(() => expect(textbox.querySelector('span')).toHaveStyle({ fontSize: '20pt' }));
    fireEvent.click(screen.getByRole('button', { name: '修改段落样式' }));
    fireEvent.click(await screen.findByRole('button', { name: '删除样式' }));
    await waitFor(() =>
      expect(textbox.querySelector('p')).toHaveAttribute('data-word-style', 'paragraph')
    );
    expect(onChange.mock.lastCall?.[0].content.attrs.paragraphStyles).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    await waitFor(() => expect(textbox.querySelector('p')).toHaveAttribute('data-word-style', id));
    expect(textbox.querySelector('span')).toHaveStyle({ fontSize: '20pt' });
  });

  it('updates body and header bindings while preserving direct formatting in another paragraph', async () => {
    const model = namedStyleDocument();
    model.header = {
      type: 'doc',
      content: [JSON.parse(JSON.stringify(model.content.content![0]))],
    };
    model.content.content![1].content![0].marks = [
      {
        type: 'textStyle',
        attrs: { fontFamily: 'Noto Sans SC', fontSize: '18pt', color: '#1f2937' },
      },
    ];
    const { textbox } = await mount({ document: model });
    const header = await screen.findByRole('textbox', { name: 'Word 页眉' });
    selectNodeContents(textbox, textbox.querySelector('p')!);
    fireEvent.click(screen.getByRole('button', { name: '修改段落样式' }));
    fireEvent.change(await screen.findByLabelText('样式字号'), { target: { value: '20' } });
    fireEvent.click(screen.getByRole('button', { name: '保存样式' }));
    await waitFor(() =>
      expect(textbox.querySelectorAll('p')[0].querySelector('span')).toHaveStyle({
        fontSize: '20pt',
      })
    );
    expect(textbox.querySelectorAll('p')[1].querySelector('span')).toHaveStyle({
      fontSize: '18pt',
    });
    expect(textbox.querySelectorAll('p')[1].querySelector('strong')).toBeNull();
    expect(header.querySelector('span')).toHaveStyle({ fontSize: '20pt' });
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    await waitFor(() => expect(header.querySelector('span')).toHaveStyle({ fontSize: '14pt' }));
    expect(textbox.querySelectorAll('p')[1].querySelector('span')).toHaveStyle({
      fontSize: '18pt',
    });
    fireEvent.click(screen.getByRole('button', { name: '重做' }));
    await waitFor(() => expect(header.querySelector('span')).toHaveStyle({ fontSize: '20pt' }));
  });

  it('uses the configured next paragraph style on Enter without deleting the preceding text', async () => {
    const model = namedStyleDocument();
    model.content.content = model.content.content!.slice(0, 1);
    const { textbox, onChange } = await mount({ document: model });
    selectNodeContents(textbox, textbox.querySelector('p')!);
    act(() => {
      window.getSelection()!.collapseToEnd();
      document.dispatchEvent(new Event('selectionchange'));
    });
    fireEvent.keyDown(textbox, { key: 'Enter', code: 'Enter' });
    await waitFor(() => expect(textbox.querySelectorAll('p')).toHaveLength(2));
    expect(textbox.querySelectorAll('p')[0]).toHaveTextContent('第一段');
    expect(textbox.querySelectorAll('p')[1]).toHaveAttribute('data-word-style', 'paragraph');
    expect(onChange.mock.lastCall?.[0].content.content.at(-1).attrs.paragraphStyle).toBe(
      'paragraph'
    );
  });

  it('automatically updates the definition and linked paragraphs in the same undoable formatting action', async () => {
    const { textbox, onChange } = await mount({ document: namedStyleDocument(true) });
    selectNodeContents(textbox, textbox.querySelector('p')!);
    fireEvent.focus(screen.getByRole('combobox', { name: '字号' }));
    fireEvent.keyDown(screen.getByRole('combobox', { name: '字号' }), { key: 'ArrowDown' });
    fireEvent.click(await screen.findByRole('option', { name: '20' }));
    await waitFor(() =>
      expect(textbox.querySelectorAll('p')[1].querySelector('span')).toHaveStyle({
        fontSize: '20pt',
      })
    );
    expect(onChange.mock.lastCall?.[0].content.attrs.paragraphStyles[0].run.fontSize).toBe(20);
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    await waitFor(() =>
      expect(textbox.querySelectorAll('p')[1].querySelector('span')).toHaveStyle({
        fontSize: '14pt',
      })
    );
    expect(textbox.querySelectorAll('p')[0].querySelector('span')).toHaveStyle({
      fontSize: '14pt',
    });
    expect(onChange.mock.lastCall?.[0].content.attrs.paragraphStyles[0].run.fontSize).toBe(14);
  });

  it('keeps heading styles inside list items and creates the next item once with its configured style', async () => {
    const model = namedStyleDocument();
    model.content.attrs!.paragraphStyles = [
      { id: 'review', name: '评审正文', basedOn: 'heading-2', next: 'paragraph' },
    ];
    model.content.content = [
      {
        type: 'orderedList',
        attrs: { start: 1 },
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'heading',
                attrs: { level: 2, paragraphStyle: 'review' },
                content: [{ type: 'text', text: '列表标题' }],
              },
            ],
          },
        ],
      },
    ];
    const { textbox, onChange } = await mount({ document: model });
    expect(textbox.querySelector('li h2')).toHaveTextContent('列表标题');
    selectNodeContents(textbox, textbox.querySelector('h2')!);
    act(() => {
      window.getSelection()!.collapseToEnd();
      document.dispatchEvent(new Event('selectionchange'));
    });
    fireEvent.keyDown(textbox, { key: 'Enter', code: 'Enter' });
    await waitFor(() => expect(textbox.querySelectorAll('li')).toHaveLength(2));
    expect(textbox.querySelectorAll('li')[1].querySelector('p')).toHaveAttribute(
      'data-word-style',
      'paragraph'
    );
    expect(onChange.mock.lastCall?.[0].content.content[0].content).toHaveLength(2);
  });

  it('preserves a composing paragraph until IME has completed before using the next style', async () => {
    const model = namedStyleDocument();
    model.content.content = model.content.content!.slice(0, 1);
    const { textbox } = await mount({ document: model });
    selectNodeContents(textbox, textbox.querySelector('p')!);
    act(() => {
      window.getSelection()!.collapseToEnd();
      document.dispatchEvent(new Event('selectionchange'));
    });
    fireEvent.compositionStart(textbox);
    fireEvent.keyDown(textbox, { key: 'Enter', code: 'Enter', isComposing: true, keyCode: 229 });
    expect(textbox.querySelectorAll('p')).toHaveLength(1);
    fireEvent.compositionEnd(textbox);
  });

  it.each([{ readOnly: true }, { disabled: true }])(
    'disables named style mutations in %j',
    async (options) => {
      const { onChange } = await mount({ ...options, document: namedStyleDocument() });
      expect(screen.getByRole('button', { name: '新建段落样式' })).toBeDisabled();
      expect(screen.getByRole('button', { name: '修改段落样式' })).toBeDisabled();
      expect(onChange).not.toHaveBeenCalled();
    }
  );
});

describe('StudioWord structured editing', () => {
  it('nests ordered list items via Tab and the list indent tools', async () => {
    const listDocument: StudioWordDocument = {
      ...documentModel(),
      content: {
        type: 'doc',
        content: [
          {
            type: 'orderedList',
            content: [
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: '第一项' }] }],
              },
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: '第二项' }] }],
              },
            ],
          },
        ],
      },
    };
    const { textbox } = await mount({ document: listDocument });
    const items = () => textbox.querySelectorAll('ol li');
    expect(items()).toHaveLength(2);
    // 单项无前兄弟项时 sink 不可用；有前兄弟项的第二项可下沉（Tab 或按钮）
    const sink = screen.getByRole('button', { name: '列表下沉缩进' });
    const lift = screen.getByRole('button', { name: '列表上提缩进' });
    selectNodeContents(textbox, items()[0].querySelector('p')!);
    await waitFor(() => expect(sink).toBeDisabled());
    selectNodeContents(textbox, items()[1].querySelector('p')!);
    await waitFor(() => expect(sink).not.toBeDisabled());
    fireEvent.keyDown(items()[1], { key: 'Tab' });
    await waitFor(() => expect(textbox.querySelector('ol li ol')).not.toBeNull());
    // 上提恢复顶层
    fireEvent.click(lift);
    await waitFor(() => expect(textbox.querySelector('ol li ol')).toBeNull());
    fireEvent.click(sink);
    await waitFor(() => expect(textbox.querySelector('ol li ol')).not.toBeNull());
  });

  it('renders an editable document, ZUVI ribbon and a scrollable paper stage', async () => {
    const { textbox, container, onChange } = await mount();
    expect(textbox).toHaveTextContent('项目评审内容');
    expect(textbox).toHaveAttribute('contenteditable', 'true');
    expect(textbox).toHaveAttribute('aria-multiline', 'true');
    expect(screen.getByRole('tab', { name: '开始' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('combobox', { name: '字体' })).toHaveClass('zuvi-combobox-input');
    const tabs = screen.getByRole('tablist', { name: 'Word 工具' });
    const ribbon = tabs.closest('.zuvi-studio-ribbon');
    expect(ribbon).not.toBeNull();
    const expectZuviButtons = () =>
      expect(
        Array.from(ribbon!.querySelectorAll('button')).every(
          (button) =>
            button.classList.contains('zuvi-button') ||
            button.classList.contains('zuvi-tab') ||
            button.classList.contains('zuvi-select-trigger') ||
            button.classList.contains('zuvi-combobox-toggle') ||
            button.classList.contains('zuvi-color-picker-swatch') ||
            button.classList.contains('zuvi-studio-word-highlight-trigger') ||
            button.classList.contains('zuvi-studio-word-case-trigger')
        )
      ).toBe(true);
    for (const name of ['开始', '插入', '布局', '引用', '审阅', '视图']) {
      fireEvent.click(within(tabs).getByRole('tab', { name }));
      expectZuviButtons();
    }
    fireEvent.click(within(tabs).getByRole('tab', { name: '开始' }));
    expect(container.querySelector('[data-part="word-stage"]')).toHaveClass(
      'zuvi-studio-word-stage'
    );
    expect(container.querySelector('[data-part="word-paper"]')).toHaveStyle({
      width: `${(210 * 96) / 25.4}px`,
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('formats a selected text range and undo restores the original structured content', async () => {
    const { textbox, onChange } = await mount();
    act(() => {
      textbox.focus();
      const range = document.createRange();
      range.selectNodeContents(textbox.querySelector('p')!);
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
      document.dispatchEvent(new Event('selectionchange'));
    });
    fireEvent.click(screen.getByRole('button', { name: '粗体' }));
    await waitFor(() => expect(textbox.querySelector('strong')).toHaveTextContent('项目评审内容'));
    expect(onChange.mock.lastCall?.[0].content.content[0].content[0].marks).toContainEqual({
      type: 'bold',
    });
    expect(screen.getByRole('button', { name: '粗体' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    await waitFor(() => expect(textbox.querySelector('strong')).toBeNull());
    expect(onChange.mock.lastCall?.[0].name).toBe('测试.docx');
  });

  it('inserts a real table and changes its row count through the ribbon', async () => {
    const { textbox, onChange } = await mount();
    fireEvent.click(screen.getByRole('tab', { name: '插入' }));
    fireEvent.click(screen.getByRole('button', { name: '插入表格' }));
    await waitFor(() => expect(textbox.querySelectorAll('tr')).toHaveLength(3));
    expect(textbox.querySelectorAll('th')).toHaveLength(3);
    expect(
      onChange.mock.lastCall?.[0].content.content.some(
        (node: { type: string }) => node.type === 'table'
      )
    ).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: '增加行' }));
    await waitFor(() => expect(textbox.querySelectorAll('tr')).toHaveLength(4));
    fireEvent.click(screen.getByRole('button', { name: '删除表格' }));
    await waitFor(() => expect(textbox.querySelector('table')).toBeNull());
  });

  it('takes an external document replacement without echoing a change event', async () => {
    const { textbox, rerender, onChange } = await mount();
    rerender(
      <WordHost
        document={documentModel('替换后的文档')}
        onChange={onChange}
        disabled={false}
        readOnly={false}
      />
    );
    await waitFor(() => expect(textbox).toHaveTextContent('替换后的文档'));
    expect(textbox).not.toHaveTextContent('项目评审内容');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('uses the latest host callback and metadata after a parent update', async () => {
    const { rerender, document, textbox } = await mount();
    const nextChange = vi.fn();
    const next = { ...document, name: '最新标题.docx', page: { ...document.page, margin: 30 } };
    rerender(<WordHost document={next} onChange={nextChange} disabled={false} readOnly={false} />);
    fireEvent.click(screen.getByRole('tab', { name: '插入' }));
    fireEvent.click(screen.getByRole('button', { name: '插入表格' }));
    await waitFor(() => expect(textbox.querySelector('table')).not.toBeNull());
    expect(nextChange.mock.lastCall?.[0].name).toBe('最新标题.docx');
    expect(nextChange.mock.lastCall?.[0].page.margin).toBe(30);
  });

  it('restores rejected controlled edits so the canvas and saved model agree', async () => {
    const value = documentModel();
    const ref = createRef<OfficeStudioHandle>();
    const onChange = vi.fn();
    const onSave = vi.fn();
    render(<OfficeStudio ref={ref} value={value} onChange={onChange} onSave={onSave} />);
    const textbox = await screen.findByRole('textbox', { name: 'Word 文档正文' });
    act(() => {
      textbox.focus();
      const range = document.createRange();
      range.selectNodeContents(textbox.querySelector('p')!);
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
      document.dispatchEvent(new Event('selectionchange'));
    });
    fireEvent.click(screen.getByRole('button', { name: '粗体' }));
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(onChange.mock.lastCall?.[0].content.content[0].content[0].marks).toContainEqual({
      type: 'bold',
    });
    await waitFor(() => expect(textbox.querySelector('strong')).toBeNull());
    expect(textbox).toHaveTextContent('项目评审内容');
    expect(ref.current?.getDocument()).toBe(value);
    await act(async () => ref.current?.save());
    expect(onSave).toHaveBeenCalledWith(value);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('keeps the caret and latest text when the controlled host accepts successive input', async () => {
    const ref = createRef<OfficeStudioHandle>();
    const onSave = vi.fn();
    function AcceptedWorkspace() {
      const [value, setValue] = useState(documentModel('原文'));
      return (
        <OfficeStudio
          ref={ref}
          value={value}
          onChange={(next) => {
            if (next.kind === 'word') setValue(next);
          }}
          onSave={onSave}
        />
      );
    }
    render(<AcceptedWorkspace />);
    const textbox = await screen.findByRole('textbox', { name: 'Word 文档正文' });
    act(() => {
      textbox.focus();
      const range = document.createRange();
      range.setStart(textbox.querySelector('p')!.firstChild!, 1);
      range.collapse(true);
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
      document.dispatchEvent(new Event('selectionchange'));
    });
    for (const [text, body, offset] of [
      ['甲', '原甲文', 2],
      ['乙', '原甲乙文', 3],
    ] as const) {
      fireEvent.paste(textbox, {
        clipboardData: { getData: (type: string) => (type === 'text/plain' ? text : '') },
      });
      await waitFor(() => expect(textbox).toHaveTextContent(body));
      expect(window.getSelection()?.anchorNode).toBe(textbox.querySelector('p')!.firstChild);
      expect(window.getSelection()?.anchorOffset).toBe(offset);
      expect(window.getSelection()?.isCollapsed).toBe(true);
    }
    await act(async () => ref.current?.save());
    expect(onSave.mock.lastCall?.[0].content.content[0].content[0].text).toBe('原甲乙文');
  });

  it('updates page settings while preserving the current document body', async () => {
    const { document, onChange } = await mount();
    fireEvent.click(screen.getByRole('tab', { name: '布局' }));
    fireEvent.click(screen.getByRole('button', { name: /纸张方向/ }));
    fireEvent.click(await screen.findByRole('option', { name: '横向' }));
    expect(onChange).toHaveBeenCalledWith({
      ...document,
      page: { ...document.page, orientation: 'landscape' },
    });
  });

  it.each([{ readOnly: true }, { disabled: true }])(
    'prevents document changes with %j and still allows zoom',
    async (options) => {
      const { textbox, onChange } = await mount(options);
      await waitFor(() => expect(textbox).toHaveAttribute('contenteditable', 'false'));
      expect(textbox).toHaveAttribute('aria-readonly', 'true');
      expect(screen.getByRole('button', { name: '粗体' })).toBeDisabled();
      fireEvent.click(screen.getByRole('button', { name: '粗体' }));
      fireEvent.click(screen.getByRole('tab', { name: '插入' }));
      expect(screen.getByRole('button', { name: '插入表格' })).toBeDisabled();
      fireEvent.click(screen.getByRole('button', { name: /Word 缩放/ }));
      fireEvent.click(await screen.findByRole('option', { name: '75%' }));
      expect(screen.getByRole('button', { name: /Word 缩放/ })).toHaveTextContent('75%');
      expect(onChange).not.toHaveBeenCalled();
    }
  );

  it('rejects unsafe hyperlink protocols without editing the document', async () => {
    const { onChange } = await mount();
    fireEvent.click(screen.getByRole('tab', { name: '插入' }));
    fireEvent.click(screen.getByRole('button', { name: '链接' }));
    const input = await screen.findByRole('textbox', { name: '链接地址' });
    fireEvent.change(input, { target: { value: 'javascript:alert(1)' } });
    fireEvent.click(screen.getByRole('button', { name: '应用链接' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('链接仅支持');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('survives StrictMode and renders on the server without browser globals', async () => {
    const document = documentModel();
    expect(() =>
      renderToString(
        <StudioWord
          document={document}
          onChange={() => undefined}
          disabled={false}
          readOnly={false}
        />
      )
    ).not.toThrow();
    const view = render(
      <StrictMode>
        <StudioWord
          document={document}
          onChange={() => undefined}
          disabled={false}
          readOnly={false}
        />
      </StrictMode>
    );
    await waitFor(() =>
      expect(view.getAllByRole('textbox', { name: 'Word 文档正文' })).toHaveLength(1)
    );
  });

  it('imports a local embedded image and refuses invalid image bytes without changing content', async () => {
    const { textbox, onChange } = await mount();
    fireEvent.click(screen.getByRole('tab', { name: '插入' }));
    const imageInput = screen.getByLabelText('选择 Word 图片');
    const file = new File(
      [Uint8Array.from(atob(PNG), (character) => character.charCodeAt(0))],
      '项目图.png',
      { type: 'image/png' }
    );
    fireEvent.change(imageInput, { target: { files: [file] } });
    await waitFor(() => expect(textbox.querySelector('img')).toHaveAttribute('alt', '项目图.png'));
    const nodes = onChange.mock.lastCall?.[0].content.content.flatMap(
      (node: { content?: { type: string; attrs?: { src?: string } }[] }) => node.content || []
    );
    expect(nodes.find((node: { type: string }) => node.type === 'image').attrs.src).toBe(
      `data:image/png;base64,${PNG}`
    );
    expect(textbox).toHaveTextContent('项目评审内容');
    onChange.mockClear();
    fireEvent.change(imageInput, {
      target: { files: [new File(['<svg/>'], '假的.png', { type: 'image/png' })] },
    });
    await waitFor(() =>
      expect(screen.getByText('请选择有效的 PNG 或 JPEG 图片。')).toBeInTheDocument()
    );
    expect(onChange).not.toHaveBeenCalled();
    expect(textbox.querySelectorAll('img[data-word-image]')).toHaveLength(1);
  });

  it('resizes a selected image with its aspect ratio and restores a deletion with undo', async () => {
    const model = documentModel();
    model.content.content![0].content!.unshift({
      type: 'image',
      attrs: { src: `data:image/png;base64,${PNG}`, width: 320, height: 160, alt: '示意图' },
    });
    const { textbox, onChange } = await mount({ document: model });
    const image = textbox.querySelector('img[data-word-image]')!;
    expect(image).not.toBeNull();
    fireEvent.click(image);
    const width = await screen.findByRole('spinbutton', { name: '图片宽度' });
    fireEvent.change(width, { target: { value: '3' } });
    await waitFor(() =>
      expect(textbox.querySelector('img[data-word-image]')).toHaveAttribute('width', '3')
    );
    fireEvent.change(width, { target: { value: '200' } });
    await waitFor(() =>
      expect(textbox.querySelector('img[data-word-image]')).toHaveAttribute('width', '200')
    );
    expect(textbox.querySelector('img[data-word-image]')).toHaveAttribute('height', '100');
    expect(onChange.mock.lastCall?.[0].content.content[0].content[0].attrs).toMatchObject({
      width: 200,
      height: 100,
    });
    const description = screen.getByRole('textbox', { name: '图片说明' });
    fireEvent.change(description, { target: { value: '项目' } });
    fireEvent.change(screen.getByRole('textbox', { name: '图片说明' }), {
      target: { value: '项目示意图' },
    });
    await waitFor(() =>
      expect(textbox.querySelector('img[data-word-image]')).toHaveAttribute('alt', '项目示意图')
    );
    fireEvent.click(screen.getByRole('button', { name: '删除图片' }));
    await waitFor(() => expect(textbox.querySelector('img[data-word-image]')).toBeNull());
    expect(textbox).toHaveTextContent('项目评审内容');
    fireEvent.click(screen.getByRole('tab', { name: '开始' }));
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    await waitFor(() => expect(textbox.querySelector('img[data-word-image]')).not.toBeNull());
  });

  it('previews a direct image resize and commits it as one undoable change', async () => {
    const model = documentModel();
    model.content.content![0].content!.unshift({
      type: 'image',
      attrs: { src: `data:image/png;base64,${PNG}`, width: 320, height: 160, alt: '示意图' },
    });
    const { textbox, onChange } = await mount({ document: model });
    const image = textbox.querySelector<HTMLImageElement>('img[data-word-image]')!;
    fireEvent.click(image);
    const imageNode = image.closest<HTMLElement>('[data-word-image-node]')!;
    const handle = imageNode.querySelector<HTMLElement>('[data-word-image-resize]')!;
    expect(imageNode).toHaveAttribute('data-selected');

    const pointer = (target: Element | Window, type: string, clientX: number, clientY: number) => {
      const event = new MouseEvent(type, { bubbles: true, button: 0, clientX, clientY });
      Object.defineProperty(event, 'pointerId', { value: 11 });
      fireEvent(target, event);
    };
    pointer(handle, 'pointerdown', 100, 100);
    pointer(window, 'pointermove', 180, 110);
    expect(image).toHaveAttribute('width', '400');
    expect(image).toHaveAttribute('height', '200');
    expect(onChange).not.toHaveBeenCalled();
    pointer(window, 'pointerup', 180, 110);

    await waitFor(() =>
      expect(onChange.mock.lastCall?.[0].content.content[0].content[0].attrs).toMatchObject({
        width: 400,
        height: 200,
      })
    );
    expect(onChange).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('tab', { name: '开始' }));
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    await waitFor(() => {
      expect(textbox.querySelector('img[data-word-image]')).toHaveAttribute('width', '320');
      expect(textbox.querySelector('img[data-word-image]')).toHaveAttribute('height', '160');
    });
  });

  it('changes picture wrapping, position and anchor flags and restores them with undo', async () => {
    const model = documentModel();
    model.content.content![0].content!.unshift({
      type: 'image',
      attrs: { src: `data:image/png;base64,${PNG}`, width: 320, height: 160, alt: '浮动示意图' },
    });
    const { textbox, onChange } = await mount({ document: model });
    fireEvent.click(textbox.querySelector('img[data-word-image]')!);
    fireEvent.click(await screen.findByRole('button', { name: /^图片文字环绕/ }));
    fireEvent.click(await screen.findByRole('option', { name: '四周环绕' }));
    await waitFor(() =>
      expect(textbox.querySelector('[data-word-image-node]')).toHaveAttribute('data-wrap', 'square')
    );
    expect(textbox.querySelector('[data-word-image-node]')).toHaveStyle({ float: 'right' });
    fireEvent.click(screen.getByRole('button', { name: '图片位置与环绕' }));
    await screen.findByRole('dialog', { name: '图片位置与环绕' });
    fireEvent.change(screen.getByRole('spinbutton', { name: '图片垂直偏移' }), {
      target: { value: '24' },
    });
    fireEvent.keyDown(screen.getByRole('spinbutton', { name: '图片垂直偏移' }), { key: 'Enter' });
    await waitFor(() =>
      expect(
        onChange.mock.lastCall?.[0].content.content[0].content[0].attrs.layout.vertical.offset
      ).toBe(24)
    );
    fireEvent.click(screen.getByRole('checkbox', { name: '锁定锚点' }));
    await waitFor(() =>
      expect(textbox.querySelector('[data-word-image-node]')).toHaveAttribute('draggable', 'false')
    );
    fireEvent.click(screen.getByRole('checkbox', { name: '随文字移动' }));
    expect(
      onChange.mock.lastCall?.[0].content.content[0].content[0].attrs.layout.vertical.relative
    ).toBe('page');
    fireEvent.click(screen.getByRole('button', { name: '完成' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    fireEvent.click(screen.getByRole('tab', { name: '开始' }));
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    await waitFor(() =>
      expect(
        onChange.mock.lastCall?.[0].content.content[0].content[0].attrs.layout.vertical.relative
      ).toBe('paragraph')
    );
    fireEvent.click(screen.getByRole('button', { name: '重做' }));
    await waitFor(() =>
      expect(
        onChange.mock.lastCall?.[0].content.content[0].content[0].attrs.layout.vertical.relative
      ).toBe('page')
    );
  });

  it('moves a floating picture with a preview, cancels it without a write and commits a complete gesture once', async () => {
    const model = documentModel();
    model.content.content![0].content!.unshift({
      type: 'image',
      attrs: {
        src: `data:image/png;base64,${PNG}`,
        width: 320,
        height: 160,
        alt: '浮动示意图',
        layout: {
          wrap: 'front',
          horizontal: { relative: 'column', offset: 10 },
          vertical: { relative: 'paragraph', offset: 15 },
          zIndex: 1,
        },
      },
    });
    const { textbox, onChange } = await mount({ document: model });
    fireEvent.click(textbox.querySelector('img[data-word-image]')!);
    const imageNode = textbox.querySelector<HTMLElement>('[data-word-image-node]')!;
    const mover = imageNode.querySelector<HTMLElement>('[data-word-image-move]')!;
    await waitFor(() => expect(mover).toHaveAttribute('tabindex', '0'));
    const pointer = (target: Element | Window, type: string, clientX: number, clientY: number) => {
      const event = new MouseEvent(type, { bubbles: true, button: 0, clientX, clientY });
      Object.defineProperty(event, 'pointerId', { value: 20 });
      fireEvent(target, event);
    };
    pointer(mover, 'pointerdown', 100, 100);
    pointer(window, 'pointermove', 120, 130);
    expect(imageNode).toHaveStyle({ left: '30px', top: '45px' });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(imageNode).toHaveStyle({ left: '10px', top: '15px' });
    expect(onChange).not.toHaveBeenCalled();
    pointer(mover, 'pointerdown', 100, 100);
    pointer(window, 'pointermove', 150, 120);
    pointer(window, 'pointerup', 150, 120);
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(onChange.mock.lastCall?.[0].content.content[0].content[0].attrs.layout).toMatchObject({
      horizontal: { offset: 60 },
      vertical: { offset: 35 },
    });
    fireEvent.click(screen.getByRole('tab', { name: '开始' }));
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    await waitFor(() => expect(imageNode).toHaveStyle({ left: '10px', top: '15px' }));
    fireEvent.keyDown(mover, { key: 'ArrowRight', shiftKey: true });
    await waitFor(() => expect(imageNode).toHaveStyle({ left: '20px', top: '15px' }));
  });

  it.each([{ readOnly: true }, { disabled: true }])(
    'keeps floating image controls locked in %j',
    async (options) => {
      const model = documentModel();
      model.content.content![0].content!.unshift({
        type: 'image',
        attrs: {
          src: `data:image/png;base64,${PNG}`,
          width: 320,
          height: 160,
          alt: '浮动示意图',
          layout: {
            wrap: 'front',
            horizontal: { relative: 'page', offset: 5 },
            vertical: { relative: 'page', offset: 5 },
          },
        },
      });
      const { textbox, onChange } = await mount({ ...options, document: model });
      fireEvent.click(textbox.querySelector('img[data-word-image]')!);
      expect(await screen.findByRole('button', { name: /^图片文字环绕/ })).toBeDisabled();
      expect(screen.getByRole('button', { name: '图片位置与环绕' })).toBeDisabled();
      fireEvent.keyDown(textbox.querySelector('[data-word-image-move]')!, { key: 'ArrowRight' });
      expect(onChange).not.toHaveBeenCalled();
    }
  );

  it('pastes a local JPEG and retains its real pixel dimensions', async () => {
    const { textbox, onChange } = await mount();
    const file = new File(
      [Uint8Array.from(atob(JPEG), (character) => character.charCodeAt(0))],
      '照片.jpg',
      { type: 'image/jpeg' }
    );
    fireEvent.paste(textbox, { clipboardData: { files: [file], getData: () => '' } });
    await waitFor(() =>
      expect(textbox.querySelector('img[data-word-image]')).toHaveAttribute(
        'src',
        `data:image/jpeg;base64,${JPEG}`
      )
    );
    expect(textbox.querySelector('img[data-word-image]')).toHaveAttribute('width', '32');
    expect(textbox.querySelector('img[data-word-image]')).toHaveAttribute('height', '16');
    expect(
      onChange.mock.lastCall?.[0].content.content
        .flatMap(
          (node: { content?: { type: string; attrs?: { width?: number; height?: number } }[] }) =>
            node.content || []
        )
        .find((node: { type: string }) => node.type === 'image').attrs
    ).toMatchObject({ width: 32, height: 16 });
  });

  it('edits and formats a header independently and adds or removes a footer page field', async () => {
    const { textbox, onChange } = await mount();
    fireEvent.click(screen.getByRole('tab', { name: '插入' }));
    fireEvent.click(screen.getByRole('button', { name: '编辑页眉' }));
    const header = await screen.findByRole('textbox', { name: 'Word 页眉' });
    act(() => header.focus());
    fireEvent.paste(header, {
      clipboardData: { getData: (type: string) => (type === 'text/plain' ? '公司抬头' : '') },
    });
    await waitFor(() => expect(header).toHaveTextContent('公司抬头'));
    expect(textbox).toHaveTextContent('项目评审内容');
    selectNodeContents(header, header.querySelector('p')!);
    fireEvent.click(screen.getByRole('tab', { name: '开始' }));
    fireEvent.click(screen.getByRole('button', { name: '粗体' }));
    await waitFor(() => expect(header.querySelector('strong')).toHaveTextContent('公司抬头'));
    expect(onChange.mock.lastCall?.[0].header.content[0].content[0].marks).toContainEqual({
      type: 'bold',
    });
    expect(textbox.querySelector('strong')).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: '插入' }));
    fireEvent.click(screen.getByRole('checkbox', { name: '显示页码' }));
    const footer = await screen.findByRole('textbox', { name: 'Word 页脚' });
    expect(footer.querySelector('[data-word-page-number="current"]')).toBeInTheDocument();
    expect(onChange.mock.lastCall?.[0].pageNumbers).toBe(true);
    fireEvent.click(screen.getByRole('checkbox', { name: '显示页码' }));
    await waitFor(() => expect(footer.querySelector('[data-word-page-number]')).toBeNull());
    expect(onChange.mock.lastCall?.[0].pageNumbers).toBe(false);
    expect(header).toHaveTextContent('公司抬头');
    expect(textbox).toHaveTextContent('项目评审内容');
  });

  it('uses the contextual ribbon and numeric position controls while the body is locked', async () => {
    const { textbox, onChange } = await mount();
    fireEvent.doubleClick(screen.getByLabelText('页眉区域'));
    const header = await screen.findByRole('textbox', { name: 'Word 页眉' });

    await waitFor(() => expect(header).toHaveAttribute('contenteditable', 'true'));
    expect(textbox).toHaveAttribute('contenteditable', 'false');
    expect(textbox).toHaveAttribute('aria-readonly', 'true');
    expect(screen.getByRole('tab', { name: '页眉和页脚' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('spinbutton', { name: '页眉距顶端（mm）' }), {
      target: { value: '18' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: '页脚距底端（mm）' }), {
      target: { value: '9.5' },
    });
    await waitFor(() =>
      expect(onChange.mock.lastCall?.[0].page).toMatchObject({
        headerDistance: 18,
        footerDistance: 9.5,
      })
    );

    fireEvent.keyDown(header, { key: 'Escape' });
    await waitFor(() => expect(textbox).toHaveAttribute('contenteditable', 'true'));
    expect(header).toHaveAttribute('contenteditable', 'false');
    expect(screen.queryByRole('tab', { name: '页眉和页脚' })).not.toBeInTheDocument();
  });

  it('requires a double click to edit page regions and exits by the close action or body double click', async () => {
    const model = documentModel();
    model.header = emptyRegion();
    model.footer = emptyRegion();
    const { textbox } = await mount({ document: model });
    const header = await screen.findByRole('textbox', { name: 'Word 页眉' });
    const footer = await screen.findByRole('textbox', { name: 'Word 页脚' });

    expect(header).toHaveAttribute('contenteditable', 'false');
    fireEvent.click(header);
    expect(header).toHaveAttribute('contenteditable', 'false');
    expect(screen.queryByRole('tab', { name: '页眉和页脚' })).not.toBeInTheDocument();

    fireEvent.doubleClick(screen.getByLabelText('页眉区域'));
    await waitFor(() => expect(header).toHaveAttribute('contenteditable', 'true'));
    fireEvent.click(screen.getByRole('button', { name: '关闭页眉和页脚' }));
    await waitFor(() => expect(textbox).toHaveAttribute('contenteditable', 'true'));
    expect(header).toHaveAttribute('contenteditable', 'false');

    fireEvent.doubleClick(screen.getByLabelText('页脚区域'));
    await waitFor(() => expect(footer).toHaveAttribute('contenteditable', 'true'));
    expect(textbox).toHaveAttribute('contenteditable', 'false');
    fireEvent.doubleClick(textbox);
    await waitFor(() => expect(textbox).toHaveAttribute('contenteditable', 'true'));
    expect(footer).toHaveAttribute('contenteditable', 'false');
  });

  it('finds across styled runs and replaces plain text in one undoable transaction', async () => {
    const model = documentModel();
    model.content.content = [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: '预', marks: [{ type: 'bold' }] },
          { type: 'text', text: '算预算' },
          { type: 'hardBreak' },
          { type: 'text', text: '后续' },
        ],
      },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '交付计划' }] },
    ];
    const { textbox, onChange } = await mount({ document: model });
    fireEvent.keyDown(textbox, { key: 'f', ctrlKey: true });
    const query = await screen.findByRole('textbox', { name: '查找内容' });
    fireEvent.change(query, { target: { value: '预算' } });
    expect(await screen.findByText('2 处匹配')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: '替换为' }), {
      target: { value: '<成本>' },
    });
    fireEvent.click(screen.getByRole('button', { name: '全部替换' }));
    await waitFor(() => expect(textbox.querySelector('p')).toHaveTextContent('<成本><成本>后续'));
    expect(textbox.querySelector('成本')).toBeNull();
    expect(textbox.querySelector('p br')).not.toBeNull();
    expect(textbox.querySelector('h2')).toHaveTextContent('交付计划');
    expect(onChange).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    await waitFor(() => expect(textbox.querySelector('p')).toHaveTextContent('预算预算后续'));
    expect(textbox.querySelector('strong')).toHaveTextContent('预');
    fireEvent.click(screen.getByRole('button', { name: '文档大纲' }));
    fireEvent.click(await screen.findByRole('button', { name: '交付计划' }));
    expect(window.getSelection()?.anchorNode?.parentElement?.closest('h2')).not.toBeNull();
  });

  it('filters matches by character format criteria', async () => {
    const model = documentModel();
    model.content.content = [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: '预算预算', marks: [{ type: 'bold' }] },
          { type: 'text', text: '预算' },
          { type: 'text', text: '斜体预算', marks: [{ type: 'italic' }] },
        ],
      },
    ];
    const { textbox } = await mount({ document: model });
    fireEvent.keyDown(textbox, { key: 'f', ctrlKey: true });
    const query = await screen.findByRole('textbox', { name: '查找内容' });
    fireEvent.change(query, { target: { value: '预算' } });
    expect(await screen.findByText('4 处匹配')).toBeInTheDocument();

    // 粗体：只有完整落在粗体区间的两处保留；跨粗体/普通边界的匹配被排除
    fireEvent.click(screen.getByRole('checkbox', { name: '粗体' }));
    expect(await screen.findByText('2 处匹配')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: '粗体' }));
    // 斜体：仅斜体区间一处
    fireEvent.click(screen.getByRole('checkbox', { name: '斜体' }));
    expect(await screen.findByText('1 处匹配')).toBeInTheDocument();
    // 同时要求粗体+斜体：无区间同时满足 → 0
    fireEvent.click(screen.getByRole('checkbox', { name: '粗体' }));
    expect(await screen.findByText('0 处匹配')).toBeInTheDocument();
  });

  it('inserts current and total page fields into the active footer and saves region distances', async () => {
    const { textbox, onChange } = await mount();
    fireEvent.click(screen.getByRole('tab', { name: '插入' }));
    fireEvent.click(screen.getByRole('button', { name: '编辑页脚' }));
    const footer = await screen.findByRole('textbox', { name: 'Word 页脚' });
    act(() => footer.focus());
    fireEvent.click(screen.getByRole('button', { name: '插入页码' }));
    fireEvent.click(screen.getByRole('button', { name: '插入总页数' }));
    await waitFor(() => expect(footer.querySelectorAll('[data-word-page-number]')).toHaveLength(2));
    expect(footer.querySelector('[data-word-page-number="current"]')).not.toBeNull();
    expect(footer.querySelector('[data-word-page-number="total"]')).not.toBeNull();
    expect(textbox.querySelector('[data-word-page-number]')).toBeNull();
    expect(onChange.mock.lastCall?.[0].pageNumbers).toBe(true);
    fireEvent.click(screen.getByRole('tab', { name: '布局' }));
    fireEvent.change(screen.getByRole('spinbutton', { name: '页眉距顶端（mm）' }), {
      target: { value: '0' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: '页脚距底端（mm）' }), {
      target: { value: '8.5' },
    });
    expect(onChange.mock.lastCall?.[0].page).toMatchObject({
      headerDistance: 0,
      footerDistance: 8.5,
    });
    expect(footer.querySelectorAll('[data-word-page-number]')).toHaveLength(2);
  });

  it('cycles search matches from the first result with Enter and replaces only the selected result', async () => {
    const { textbox, onChange } = await mount({ document: documentModel('预算与预算') });
    fireEvent.keyDown(textbox, { key: 'f', ctrlKey: true });
    const query = await screen.findByRole('textbox', { name: '查找内容' });
    fireEvent.change(query, { target: { value: '预算' } });
    await screen.findByText('2 处匹配');
    fireEvent.keyDown(query, { key: 'Enter' });
    expect(screen.getByRole('button', { name: '跳转匹配 1' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    fireEvent.keyDown(query, { key: 'Enter' });
    expect(screen.getByRole('button', { name: '跳转匹配 2' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    fireEvent.change(screen.getByRole('textbox', { name: '替换为' }), {
      target: { value: '成本' },
    });
    fireEvent.click(screen.getByRole('button', { name: '替换' }));
    await waitFor(() => expect(textbox).toHaveTextContent('预算与成本'));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('disables incomplete bulk results and rejects replacement growth without changing content', async () => {
    const { textbox, onChange } = await mount({ document: documentModel('预算'.repeat(10001)) });
    fireEvent.keyDown(textbox, { key: 'h', ctrlKey: true });
    const query = await screen.findByRole('textbox', { name: '查找内容' });
    fireEvent.change(query, { target: { value: '预算' } });
    expect(await screen.findByText('超过 10000 处匹配')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '全部替换' })).toBeDisabled();
    fireEvent.change(query, { target: { value: '预算预算' } });
    expect(await screen.findByText('5000 处匹配')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: '替换为' }), {
      target: { value: '改'.repeat(500) },
    });
    fireEvent.click(screen.getByRole('button', { name: '全部替换' }));
    expect(
      await screen.findByText('替换后的文本超过 200 万字符，请缩小替换范围。')
    ).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    expect(textbox.textContent).toBe('预算'.repeat(10001));
  });

  it('allows readonly navigation while disabling replacement and embedded image input', async () => {
    const model = documentModel('预算预算');
    model.header = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: '抬头' }] }],
    };
    const { textbox, onChange } = await mount({ document: model, readOnly: true });
    const header = await screen.findByRole('textbox', { name: 'Word 页眉' });
    expect(header).toHaveAttribute('contenteditable', 'false');
    fireEvent.keyDown(textbox, { key: 'h', ctrlKey: true });
    fireEvent.change(await screen.findByRole('textbox', { name: '查找内容' }), {
      target: { value: '预算' },
    });
    expect(await screen.findByText('2 处匹配')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '替换为' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '全部替换' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '下一处' })).not.toBeDisabled();
    fireEvent.click(screen.getByRole('tab', { name: '插入' }));
    expect(screen.getByLabelText('选择 Word 图片')).toBeDisabled();
    expect(screen.getByRole('button', { name: '编辑页眉' })).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('StudioWord typed font details', () => {
  it('keeps selected text when typing fonts with CSS punctuation and normalizes Word half-point sizes', async () => {
    const { textbox, onChange } = await mount();
    selectNodeContents(textbox, textbox.querySelector('p')!);
    const family = screen.getByRole('combobox', { name: '字体' });
    fireEvent.focus(family);
    fireEvent.change(family, { target: { value: 'Custom "Font"; & \\Family' } });
    fireEvent.keyDown(family, { key: 'Enter' });
    await waitFor(() =>
      expect(onChange.mock.lastCall?.[0].content.content[0].content[0].marks).toContainEqual(
        expect.objectContaining({
          type: 'textStyle',
          attrs: expect.objectContaining({ fontFamily: 'Custom "Font"; & \\Family' }),
        })
      )
    );
    expect(textbox.querySelector('span')?.style.fontFamily).toContain('Custom');
    const size = screen.getByRole('combobox', { name: '字号' });
    fireEvent.focus(size);
    fireEvent.change(size, { target: { value: '17,3pt' } });
    fireEvent.keyDown(size, { key: 'Enter' });
    await waitFor(() => expect(textbox.querySelector('span')).toHaveStyle({ fontSize: '17.5pt' }));
    expect(textbox).toHaveTextContent('项目评审内容');
    fireEvent.focus(size);
    fireEvent.change(size, { target: { value: '410' } });
    fireEvent.keyDown(size, { key: 'Enter' });
    expect(size).toHaveAttribute('aria-invalid', 'true');
    fireEvent.keyDown(size, { key: 'Escape' });
    expect(size).toHaveValue('17.5');
  });
});

/* ==================== 第一轮：字号步进 / 高亮 / 大小写 / 格式刷 ==================== */

const twoParagraphDoc = (): StudioWordDocument => ({
  version: 1,
  id: 'word-ui-test',
  name: '测试.docx',
  kind: 'word',
  page: { size: 'A4', orientation: 'portrait', margin: 20 },
  content: {
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: '项目评审内容' }] },
      { type: 'paragraph', content: [{ type: 'text', text: '目标段落文本' }] },
    ],
  },
});

describe('StudioWord 第一轮编辑能力', () => {
  it('uses the common size ladder for decimal, small and large sizes and clamps at 1 and 409pt', () => {
    const cases = [
      [1, false, 1],
      [1, true, 2],
      [7.5, true, 8],
      [8, false, 7],
      [12, true, 14],
      [17.5, true, 18],
      [17.5, false, 16],
      [72, true, 80],
      [73, false, 72],
      [80, true, 90],
      [408, true, 409],
      [409, true, 409],
      [409, false, 400],
    ] as const;
    for (const [current, increase, expected] of cases)
      expect(wordNextFontSize(current, increase)).toBe(expected);
  });

  it.each([{ readOnly: true }, { disabled: true }])(
    'disables font step and case actions in %j',
    async (permissions) => {
      await mount(permissions);
      for (const name of ['增大字号', '减小字号', '变更大小写'])
        expect(screen.getByRole('button', { name })).toBeDisabled();
    }
  );

  it('keeps paragraph boundaries and reversed Unicode selections after case conversion', async () => {
    const model = twoParagraphDoc();
    model.content.content = [
      { type: 'paragraph', content: [{ type: 'text', text: 'straße.' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'next WORD' }] },
    ];
    const view = await mount({ document: model });
    const box = view.textbox;
    act(() => {
      box.focus();
      const p = box.querySelectorAll('p');
      const s = window.getSelection()!;
      s.setBaseAndExtent(p[1].firstChild!, 9, p[0].firstChild!, 0);
      document.dispatchEvent(new Event('selectionchange'));
    });
    fireEvent.click(screen.getByRole('button', { name: '变更大小写' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: '全部大写' }));
    await waitFor(() => expect(box.querySelectorAll('p')[0]).toHaveTextContent('STRASSE.'));
    expect(box.querySelectorAll('p')[1]).toHaveTextContent('NEXT WORD');
    await waitFor(() => expect(window.getSelection()?.toString()).toContain('STRASSE.'));
    expect(window.getSelection()?.isCollapsed).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    expect(box.querySelectorAll('p')[0]).toHaveTextContent('straße.');
  });

  it('clears direct formatting while preserving headings, list structure, links and one-step undo/redo', async () => {
    const model = twoParagraphDoc();
    model.content.content = [
      {
        type: 'heading',
        attrs: { level: 2, textAlign: 'right', indentLeft: 18 },
        content: [
          {
            type: 'text',
            text: 'Linked title',
            marks: [{ type: 'bold' }, { type: 'link', attrs: { href: 'https://example.com' } }],
          },
        ],
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Keep list', marks: [{ type: 'italic' }] }],
              },
            ],
          },
        ],
      },
    ];
    const view = await mount({ document: model });
    const box = view.textbox;
    selectNodeContents(box, box.querySelector('h2')!);
    fireEvent.click(screen.getByRole('button', { name: '清除格式' }));
    expect(box.querySelector('h2')).toBeInTheDocument();
    expect(box.querySelector('h2 a')).toHaveAttribute('href', 'https://example.com');
    expect(box.querySelector('h2 strong')).toBeNull();
    expect(box.querySelector('ul li')).toHaveTextContent('Keep list');
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    expect(box.querySelector('h2 strong')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '重做' }));
    expect(box.querySelector('h2 strong')).toBeNull();
  });

  it('copies exact character and paragraph formats with continuous painting and does not toggle existing marks off', async () => {
    const model = twoParagraphDoc();
    model.content.content = [
      {
        type: 'paragraph',
        attrs: { textAlign: 'right', indentLeft: 18 },
        content: [
          {
            type: 'text',
            text: 'Source',
            marks: [
              { type: 'bold' },
              { type: 'textStyle', attrs: { fontSize: '18pt', color: '#0055aa' } },
            ],
          },
        ],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Target one', marks: [{ type: 'bold' }] }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Target two',
            marks: [{ type: 'italic' }, { type: 'link', attrs: { href: 'https://example.com' } }],
          },
        ],
      },
    ];
    const view = await mount({ document: model });
    const box = view.textbox;
    selectNodeContents(box, box.querySelectorAll('p')[0]);
    fireEvent.doubleClick(screen.getByRole('button', { name: '格式刷' }));
    selectNodeContents(box, box.querySelectorAll('p')[1]);
    await waitFor(() =>
      expect(box.querySelectorAll('p')[1].querySelector('strong')).toBeInTheDocument()
    );
    expect(box.querySelectorAll('p')[1]).toHaveStyle({ textAlign: 'right', marginLeft: '18pt' });
    expect(box.querySelectorAll('p')[1].querySelector('span')).toHaveStyle({
      fontSize: '18pt',
      color: '#0055aa',
    });
    expect(screen.getByRole('button', { name: '格式刷' })).toHaveAttribute('aria-pressed', 'true');
    selectNodeContents(box, box.querySelectorAll('p')[2]);
    await waitFor(() =>
      expect(box.querySelectorAll('p')[2].querySelector('strong')).toBeInTheDocument()
    );
    expect(box.querySelectorAll('p')[2].querySelector('em')).toBeNull();
    expect(box.querySelectorAll('p')[2].querySelector('a')).toHaveAttribute(
      'href',
      'https://example.com'
    );
    fireEvent.keyDown(box, { key: 'Escape', isComposing: true });
    expect(screen.getByRole('button', { name: '格式刷' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.keyDown(box, { key: 'Escape' });
    expect(screen.getByRole('button', { name: '格式刷' })).not.toHaveAttribute('aria-pressed');
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    expect(box.querySelectorAll('p')[2].querySelector('em')).toBeInTheDocument();
    expect(box.querySelectorAll('p')[1].querySelector('strong')).toBeInTheDocument();
  });

  it('字号阶梯：12pt 增大到 14pt，减小回到 12pt', async () => {
    const view = await mount();
    const textbox = view.textbox;
    selectNodeContents(textbox, textbox.querySelector('p')!);
    fireEvent.click(screen.getByRole('button', { name: '增大字号' }));
    expect(textbox.querySelector('p span')).toHaveStyle({ fontSize: '14pt' });
    fireEvent.click(screen.getByRole('button', { name: '减小字号' }));
    expect(textbox.querySelector('p span')).toHaveStyle({ fontSize: '12pt' });
    view.unmount();
  });

  it('steps mixed sizes independently, keeps links/colors and restores the entire selection in one undo', async () => {
    const model = documentModel();
    model.content.content![0].content = [
      {
        type: 'text',
        text: 'Small ',
        marks: [
          { type: 'textStyle', attrs: { fontSize: '12pt', color: '#0055aa' } },
          { type: 'bold' },
        ],
      },
      {
        type: 'text',
        text: 'Large',
        marks: [
          { type: 'textStyle', attrs: { fontSize: '17.5pt' } },
          { type: 'link', attrs: { href: 'https://example.com' } },
        ],
      },
    ];
    const view = await mount({ document: model });
    const box = view.textbox;
    selectNodeContents(box, box.querySelector('p')!);
    fireEvent.click(screen.getByRole('button', { name: '增大字号' }));
    const nodes = view.onChange.mock.lastCall?.[0].content.content[0].content;
    expect(
      nodes[0].marks.find((mark: { type: string }) => mark.type === 'textStyle').attrs.fontSize
    ).toBe('14pt');
    expect(
      nodes[1].marks.find((mark: { type: string }) => mark.type === 'textStyle').attrs.fontSize
    ).toBe('18pt');
    expect(box.querySelector('a')).toHaveAttribute('href', 'https://example.com');
    expect(window.getSelection()?.toString()).toBe('Small Large');
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    expect(box.querySelector('span')).toHaveStyle({ fontSize: '12pt' });
    expect(box.querySelector('a span')).toHaveStyle({ fontSize: '17.5pt' });
    fireEvent.click(screen.getByRole('button', { name: '重做' }));
    expect(box.querySelector('a span')).toHaveStyle({ fontSize: '18pt' });
  });

  it.each([
    ['句首字母大写', 'Hello world. Next sentence!'],
    ['每个单词首字母大写', 'Hello World. Next Sentence!'],
  ])('converts %s across marks while preserving a link and undo', async (label, result) => {
    const model = documentModel();
    model.content.content![0].content = [
      { type: 'text', text: 'hE', marks: [{ type: 'bold' }] },
      {
        type: 'text',
        text: 'LLO wORLD. nEXT sENTENCE!',
        marks: [{ type: 'link', attrs: { href: 'https://example.com' } }],
      },
    ];
    const view = await mount({ document: model });
    const box = view.textbox;
    selectNodeContents(box, box.querySelector('p')!);
    fireEvent.click(screen.getByRole('button', { name: '变更大小写' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: label }));
    expect(box.textContent).toBe(result);
    expect(box.querySelector('a')).toHaveAttribute('href', 'https://example.com');
    expect(box.querySelector('strong')).toHaveTextContent('He');
    await waitFor(() => expect(window.getSelection()?.toString()).toBe(result));
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    expect(box.textContent).toBe('hELLO wORLD. nEXT sENTENCE!');
    fireEvent.click(screen.getByRole('button', { name: '重做' }));
    expect(box.textContent).toBe(result);
  });

  it('preserves expanded Unicode selection and link marks when uppercase changes the text length', async () => {
    const model = documentModel();
    model.content.content![0].content = [
      {
        type: 'text',
        text: 'straße ﬁ',
        marks: [{ type: 'link', attrs: { href: 'https://example.com' } }, { type: 'italic' }],
      },
    ];
    const view = await mount({ document: model });
    const box = view.textbox;
    selectNodeContents(box, box.querySelector('p')!);
    fireEvent.click(screen.getByRole('button', { name: '变更大小写' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: '全部大写' }));
    expect(box.textContent).toBe('STRASSE FI');
    await waitFor(() => expect(window.getSelection()?.toString()).toBe('STRASSE FI'));
    expect(box.querySelector('a')).toHaveTextContent('STRASSE FI');
    expect(box.querySelector('em')).toHaveTextContent('STRASSE FI');
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    expect(box.textContent).toBe('straße ﬁ');
  });

  it('changes the caret word while preserving its mapped caret and applies a font step only to new input', async () => {
    const view = await mount({ document: documentModel('straße tail') });
    const box = view.textbox;
    act(() => {
      box.focus();
      const range = document.createRange();
      range.setStart(box.querySelector('p')!.firstChild!, 5);
      range.collapse(true);
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
      document.dispatchEvent(new Event('selectionchange'));
    });
    fireEvent.click(screen.getByRole('button', { name: '变更大小写' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: '全部大写' }));
    expect(box.textContent).toBe('STRASSE tail');
    await waitFor(() => expect(window.getSelection()?.anchorOffset).toBe(6));
    expect(window.getSelection()?.isCollapsed).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: '增大字号' }));
    expect(box.textContent).toBe('STRASSE tail');
    expect(box.querySelector('[style*=font-size]')).toBeNull();
    const user = (await import('@testing-library/user-event')).default.setup();
    await user.keyboard('X');
    await waitFor(() => expect(box.textContent).toBe('STRASSXE tail'));
    expect(box.querySelector('span')).toHaveStyle({ fontSize: '14pt' });
  });

  it('respects min/max font bounds and skips immutable or composing actions', async () => {
    const model = documentModel('Limit');
    model.content.content![0].content![0].marks = [
      { type: 'textStyle', attrs: { fontSize: '409pt' } },
    ];
    const view = await mount({ document: model });
    selectNodeContents(view.textbox, view.textbox.querySelector('p')!);
    fireEvent.click(screen.getByRole('button', { name: '增大字号' }));
    expect(view.onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '减小字号' }));
    expect(view.textbox.querySelector('span')).toHaveStyle({ fontSize: '400pt' });
  });

  it('文字高亮：选色写入 backgroundColor，无颜色清除', async () => {
    const view = await mount();
    const textbox = view.textbox;
    selectNodeContents(textbox, textbox.querySelector('p')!);
    fireEvent.click(screen.getByRole('button', { name: '文字高亮' }));
    fireEvent.click(screen.getByRole('menuitem', { name: /黄色/ }));
    await waitFor(() =>
      expect(textbox.querySelector('p span')).toHaveStyle({ backgroundColor: '#ffff00' })
    );
    const styleMark = view.onChange.mock.lastCall?.[0].content.content[0].content[0].marks.find(
      (mark: { type: string }) => mark.type === 'textStyle'
    );
    expect(styleMark.attrs.backgroundColor).toBe('#ffff00');

    selectNodeContents(textbox, textbox.querySelector('p')!);
    fireEvent.click(screen.getByRole('button', { name: '文字高亮' }));
    fireEvent.click(screen.getByRole('menuitem', { name: '无颜色' }));
    await waitFor(() => expect(textbox.querySelector('p span')).toBeNull());
    const clearedDoc = view.onChange.mock.lastCall?.[0].content.content[0];
    expect(clearedDoc?.content?.[0].marks ?? []).toHaveLength(0);
    view.unmount();
  });

  it('变更大小写：全部大写后撤销恢复原文', async () => {
    const view = await mount({ document: documentModel('hello World') });
    const textbox = view.textbox;
    const paragraph = textbox.querySelector('p')!;

    selectNodeContents(textbox, paragraph);
    fireEvent.click(screen.getByRole('button', { name: '变更大小写' }));
    await waitFor(() =>
      expect(screen.getByRole('menuitem', { name: '全部大写' })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole('menuitem', { name: '全部大写' }));
    await waitFor(() => expect(textbox.textContent).toContain('HELLO WORLD'));

    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    await waitFor(() => expect(textbox.textContent).toContain('hello World'));
    view.unmount();
  });

  it('格式刷：取用粗体格式应用到目标段落后自动解除', async () => {
    const view = await mount({ document: twoParagraphDoc() });
    const textbox = view.textbox;
    selectNodeContents(textbox, textbox.querySelector('p')!);
    fireEvent.click(screen.getByRole('button', { name: '粗体' }));
    await waitFor(() => expect(textbox.querySelector('strong')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: '格式刷' }));
    expect(screen.getByRole('button', { name: '格式刷' })).toHaveAttribute('aria-pressed', 'true');

    selectNodeContents(textbox, textbox.querySelectorAll('p')[1]);
    await waitFor(() => {
      const target = view.onChange.mock.lastCall?.[0].content.content[1];
      expect(target?.content[0].marks?.some((mark: { type: string }) => mark.type === 'bold')).toBe(
        true
      );
    });
    expect(screen.getByRole('button', { name: '格式刷' })).not.toHaveAttribute('aria-pressed');
    view.unmount();
  });

  it('格式刷：armed 后 Esc 解除，不改动文档', async () => {
    const view = await mount();
    const textbox = view.textbox;
    selectNodeContents(textbox, textbox.querySelector('p')!);
    fireEvent.click(screen.getByRole('button', { name: '粗体' }));
    await waitFor(() => expect(textbox.querySelector('strong')).toBeInTheDocument());
    const afterBold = view.onChange.mock.lastCall?.[0];

    fireEvent.click(screen.getByRole('button', { name: '格式刷' }));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByRole('button', { name: '格式刷' })).not.toHaveAttribute('aria-pressed');
    expect(view.onChange.mock.lastCall?.[0]).toBe(afterBold);
    view.unmount();
  });
});

describe('Word text and table conversion entry', () => {
  it('converts through the actual ribbon with a preview and independent undo/redo transactions', async () => {
    const model = documentModel('A\tB');
    model.content.content![0].content![0].marks = [{ type: 'bold' }];
    const { textbox, onChange } = await mount({ document: model });
    selectNodeContents(textbox, textbox.querySelector('p')!);
    fireEvent.click(screen.getByRole('tab', { name: '插入' }));
    fireEvent.click(screen.getByRole('button', { name: '文本转表格' }));
    expect(screen.getByText('1 行，2 列')).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '转换' }));
    await waitFor(() => expect(textbox.querySelectorAll('td')).toHaveLength(2));
    expect(textbox.querySelector('td strong')).toHaveTextContent('A');
    expect(onChange).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('tab', { name: '开始' }));
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    await waitFor(() => expect(textbox.querySelector('table')).toBeNull());
    expect(textbox.textContent).toContain('A\tB');
    fireEvent.click(screen.getByRole('button', { name: '重做' }));
    await waitFor(() => expect(textbox.querySelectorAll('td')).toHaveLength(2));
    selectNodeContents(textbox, textbox.querySelector('td p')!);
    fireEvent.click(screen.getByRole('tab', { name: '插入' }));
    fireEvent.click(screen.getByRole('button', { name: '表格转文本' }));
    fireEvent.click(screen.getByRole('button', { name: '转换' }));
    await waitFor(() => expect(textbox.querySelector('table')).toBeNull());
    expect(textbox.querySelector('strong')).toHaveTextContent('A');
    fireEvent.click(screen.getByRole('tab', { name: '开始' }));
    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    await waitFor(() => expect(textbox.querySelectorAll('td')).toHaveLength(2));
  });
  it('cancels without writes and rejects a stale conversion after an external document replacement', async () => {
    const { textbox, onChange, rerender } = await mount({ document: documentModel('A\tB') });
    selectNodeContents(textbox, textbox.querySelector('p')!);
    fireEvent.click(screen.getByRole('tab', { name: '插入' }));
    fireEvent.click(screen.getByRole('button', { name: '文本转表格' }));
    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '文本转表格' }));
    rerender(<WordHost document={documentModel('replacement')} onChange={onChange} disabled={false} readOnly={false} />);
    await waitFor(() => expect(textbox).toHaveTextContent('replacement'));
    fireEvent.click(screen.getByRole('button', { name: '转换' }));
    expect(screen.getByRole('alert')).toHaveTextContent('已变化');
    expect(textbox.querySelector('table')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
    rerender(<WordHost document={documentModel('replacement')} onChange={onChange} disabled={false} readOnly />);
    expect(screen.getByRole('button', { name: '转换' })).toBeDisabled();
  });
});

it('restores a rejected controlled conversion without changing the saved native model', async () => {
  const value = documentModel('A\tB');
  const ref = createRef<OfficeStudioHandle>();
  const onChange = vi.fn(), onSave = vi.fn();
  render(<OfficeStudio ref={ref} value={value} onChange={onChange} onSave={onSave} />);
  const body = await screen.findByRole('textbox', { name: 'Word 文档正文' });
  selectNodeContents(body, body.querySelector('p')!);
  fireEvent.click(screen.getByRole('tab', { name: '插入' }));
  fireEvent.click(screen.getByRole('button', { name: '文本转表格' }));
  fireEvent.click(screen.getByRole('button', { name: '转换' }));
  await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
  expect(onChange.mock.lastCall?.[0].content.content[0].type).toBe('table');
  await waitFor(() => expect(body.querySelector('table')).toBeNull());
  expect(body).toHaveTextContent('A B', { normalizeWhitespace: true });
  expect(ref.current?.getDocument()).toBe(value);
  await act(async () => ref.current?.save());
  expect(onSave).toHaveBeenCalledWith(value);
});


it('converts complete selected rows through the ribbon and preserves surrounding tables', async () => {
  const model = documentModel();
  model.content.content = [{ type: 'table', content: ['Before', 'Selected', 'After'].map((text) => ({ type: 'tableRow', content: [text, 'Value'].map((value) => ({ type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: value }] }] })) })) }, { type: 'paragraph', content: [{ type: 'text', text: 'Outside' }] }];
  const { textbox, onChange } = await mount({ document: model });
  const editor = (textbox as HTMLElement & { editor: Editor }).editor;
  const cells: number[] = [];
  editor.state.doc.descendants((node, position) => { if (node.type.name === 'tableCell') cells.push(position); });
  act(() => editor.view.dispatch(editor.state.tr.setSelection(CellSelection.create(editor.state.doc, cells[2], cells[3]))));
  fireEvent.click(screen.getByRole('tab', { name: '插入' }));
  fireEvent.click(screen.getByRole('button', { name: '表格转文本' }));
  expect(screen.getByText('转换所选 1 行，保留前后表格和字符格式。')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '取消' }));
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '表格转文本' }));
  fireEvent.click(screen.getByRole('button', { name: '转换' }));
  await waitFor(() => expect(textbox.querySelectorAll('table')).toHaveLength(2));
  expect(textbox.querySelectorAll('table')[0]).toHaveTextContent('Before');
  expect(textbox.querySelectorAll('table')[1]).toHaveTextContent('After');
  expect(textbox).toHaveTextContent('Outside');
  expect(onChange).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('tab', { name: '开始' }));
  fireEvent.click(screen.getByRole('button', { name: '撤销' }));
  await waitFor(() => expect(textbox.querySelectorAll('table')).toHaveLength(1));
  expect(textbox.querySelectorAll('tr')).toHaveLength(3);
  fireEvent.click(screen.getByRole('button', { name: '重做' }));
  await waitFor(() => expect(textbox.querySelectorAll('table')).toHaveLength(2));
});

it('inserts a table formula through ZUVI dialog, keeps cancelled drafts and refreshes in a separate undo transaction', async () => {
  const model = documentModel();
  model.content.content = [{ type: 'table', content: [{ type: 'tableRow', content: ['2', ''].map((text) => ({ type: 'tableCell', content: [{ type: 'paragraph', content: text ? [{ type: 'text', text }] : [] }] })) }] }];
  const { textbox, onChange } = await mount({ document: model });
  const editor = (textbox as HTMLElement & { editor: Editor }).editor;
  const cells: number[] = [];
  editor.state.doc.descendants((node, pos) => { if (node.type.name === 'tableCell') cells.push(pos); });
  act(() => editor.commands.setTextSelection(cells[1] + 2));
  fireEvent.click(screen.getByRole('tab', { name: '插入' }));
  fireEvent.click(screen.getByRole('button', { name: '表格公式' }));
  fireEvent.change(screen.getByRole('textbox', { name: '表格公式表达式' }), { target: { value: '=A1*4' } });
  fireEvent.click(screen.getByRole('button', { name: '取消' }));
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '表格公式' }));
  const input = screen.getByRole('textbox', { name: '表格公式表达式' });
  fireEvent.change(input, { target: { value: '=A1*4' } });
  fireEvent.compositionStart(input);
  expect(screen.getByRole('button', { name: '保存公式' })).toBeDisabled();
  fireEvent.compositionEnd(input);
  fireEvent.click(screen.getByRole('button', { name: '保存公式' }));
  await waitFor(() => expect(textbox.querySelector('[data-word-table-formula]')).toHaveTextContent('8'));
  act(() => editor.commands.insertContentAt({ from: cells[0] + 2, to: cells[0] + 3 }, '3'));
  fireEvent.click(screen.getByRole('button', { name: '刷新公式' }));
  await waitFor(() => expect(textbox.querySelector('[data-word-table-formula]')).toHaveTextContent('12'));
  fireEvent.click(screen.getByRole('tab', { name: '开始' }));
  fireEvent.click(screen.getByRole('button', { name: '撤销' }));
  await waitFor(() => expect(textbox.querySelector('[data-word-table-formula]')).toHaveTextContent('8'));
  fireEvent.click(screen.getByRole('button', { name: '重做' }));
  await waitFor(() => expect(textbox.querySelector('[data-word-table-formula]')).toHaveTextContent('12'));
});

it('keeps invalid formula drafts and blocks open dialogs after permissions or external content change', async () => {
  const model = documentModel();
  model.content.content = [{ type: 'table', content: [{ type: 'tableRow', content: ['2', ''].map((text) => ({ type: 'tableCell', content: [{ type: 'paragraph', content: text ? [{ type: 'text', text }] : [] }] })) }] }];
  const { textbox, onChange, rerender } = await mount({ document: model });
  const editor = (textbox as HTMLElement & { editor: Editor }).editor;
  const cells: number[] = [];
  editor.state.doc.descendants((node, pos) => { if (node.type.name === 'tableCell') cells.push(pos); });
  act(() => editor.commands.setTextSelection(cells[1] + 2));
  fireEvent.click(screen.getByRole('tab', { name: '插入' }));
  fireEvent.click(screen.getByRole('button', { name: '表格公式' }));
  const input = screen.getByRole('textbox', { name: '表格公式表达式' });
  fireEvent.change(input, { target: { value: '=B1' } });
  fireEvent.click(screen.getByRole('button', { name: '保存公式' }));
  expect(screen.getByRole('alert')).toHaveTextContent('循环引用');
  expect(input).toHaveValue('=B1');
  expect(onChange).not.toHaveBeenCalled();
  rerender(<WordHost document={model} onChange={onChange} disabled={false} readOnly />);
  expect(input).toBeDisabled();
  expect(screen.getByRole('button', { name: '保存公式' })).toBeDisabled();
  rerender(<WordHost document={documentModel('replacement')} onChange={onChange} disabled={false} readOnly={false} />);
  await waitFor(() => expect(textbox).toHaveTextContent('replacement'));
  fireEvent.change(input, { target: { value: '=1' } });
  fireEvent.click(screen.getByRole('button', { name: '保存公式' }));
  expect(screen.getByRole('alert')).toHaveTextContent('已变化');
  expect(onChange).not.toHaveBeenCalled();
});

it('restores a rejected controlled formula insertion and saves the original document', async () => {
  const value = documentModel();
  value.content.content = [{ type: 'table', content: [{ type: 'tableRow', content: ['2', ''].map((text) => ({ type: 'tableCell', content: [{ type: 'paragraph', content: text ? [{ type: 'text', text }] : [] }] })) }] }];
  const ref = createRef<OfficeStudioHandle>();
  const onChange = vi.fn(), onSave = vi.fn();
  render(<OfficeStudio ref={ref} value={value} onChange={onChange} onSave={onSave} />);
  const body = await screen.findByRole('textbox', { name: 'Word 文档正文' });
  const editor = (body as HTMLElement & { editor: Editor }).editor;
  const cells: number[] = [];
  editor.state.doc.descendants((node, pos) => { if (node.type.name === 'tableCell') cells.push(pos); });
  act(() => editor.commands.setTextSelection(cells[1] + 2));
  fireEvent.click(screen.getByRole('tab', { name: '插入' }));
  fireEvent.click(screen.getByRole('button', { name: '表格公式' }));
  fireEvent.change(screen.getByRole('textbox', { name: '表格公式表达式' }), { target: { value: '=A1*4' } });
  fireEvent.click(screen.getByRole('button', { name: '保存公式' }));
  await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(body.querySelector('[data-word-table-formula]')).toBeNull());
  expect(ref.current?.getDocument()).toBe(value);
  await act(async () => ref.current?.save());
  expect(onSave).toHaveBeenCalledWith(value);
});

it('applies image crop through the toolbar, cancels drafts and restores crop with undo and redo', async () => {
  const model = documentModel();
  model.content.content![0].content!.unshift({ type: 'image', attrs: { src: `data:image/png;base64,${PNG}`, width: 320, height: 160, alt: '裁剪示意图' } });
  const { textbox, onChange } = await mount({ document: model });
  fireEvent.click(textbox.querySelector('img[data-word-image]')!);
  fireEvent.click(screen.getByRole('button', { name: '裁剪图片' }));
  fireEvent.change(screen.getByRole('spinbutton', { name: '左边裁剪百分比' }), { target: { value: '25' } });
  fireEvent.click(screen.getByRole('button', { name: '取消' }));
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '裁剪图片' }));
  expect(screen.getByRole('spinbutton', { name: '左边裁剪百分比' })).toHaveValue(0);
  fireEvent.change(screen.getByRole('spinbutton', { name: '左边裁剪百分比' }), { target: { value: '25' } });
  fireEvent.click(screen.getByRole('button', { name: '应用裁剪' }));
  await waitFor(() => expect(textbox.querySelector('[data-word-image-crop-frame]')).toHaveStyle({ overflow: 'hidden' }));
  expect(onChange.mock.lastCall?.[0].content.content[0].content[0].attrs).toMatchObject({ crop: { left: 25, top: 0, right: 0, bottom: 0 }, width: 320, height: 160, src: `data:image/png;base64,${PNG}` });
  fireEvent.click(screen.getByRole('tab', { name: '开始' }));
  fireEvent.click(screen.getByRole('button', { name: '撤销' }));
  await waitFor(() => expect(textbox.querySelector('[data-word-image-crop-frame]')).not.toHaveStyle({ overflow: 'hidden' }));
  fireEvent.click(screen.getByRole('button', { name: '重做' }));
  await waitFor(() => expect(textbox.querySelector('[data-word-image-crop-frame]')).toHaveStyle({ overflow: 'hidden' }));
  fireEvent.click(textbox.querySelector('img[data-word-image]')!);
  fireEvent.click(screen.getByRole('button', { name: '裁剪图片' }));
  fireEvent.click(screen.getByRole('button', { name: '重置裁剪' }));
  fireEvent.click(screen.getByRole('button', { name: '应用裁剪' }));
  await waitFor(() => expect(textbox.querySelector('[data-word-image-crop-frame]')).not.toHaveStyle({ overflow: 'hidden' }));
  fireEvent.click(screen.getByRole('tab', { name: '开始' }));
  fireEvent.click(screen.getByRole('button', { name: '撤销' }));
  await waitFor(() => expect(textbox.querySelector('img[data-word-image]')).toHaveAttribute('data-word-image-crop', expect.stringContaining('25')));
  fireEvent.click(screen.getByRole('button', { name: '重做' }));
  await waitFor(() => expect(textbox.querySelector('img[data-word-image]')).not.toHaveAttribute('data-word-image-crop'));

});

it('blocks an open crop draft when permissions or external content change', async () => {
  const model = documentModel();
  model.content.content![0].content!.unshift({ type: 'image', attrs: { src: `data:image/png;base64,${PNG}`, width: 320, height: 160 } });
  const { textbox, onChange, rerender } = await mount({ document: model });
  fireEvent.click(textbox.querySelector('img[data-word-image]')!);
  fireEvent.click(screen.getByRole('button', { name: '裁剪图片' }));
  fireEvent.change(screen.getByRole('spinbutton', { name: '左边裁剪百分比' }), { target: { value: '25' } });
  rerender(<WordHost document={model} onChange={onChange} disabled={false} readOnly />);
  expect(screen.getByRole('button', { name: '应用裁剪' })).toBeDisabled();
  expect(onChange).not.toHaveBeenCalled();
  rerender(<WordHost document={documentModel('replacement')} onChange={onChange} disabled={false} readOnly={false} />);
  if (screen.queryByRole('button', { name: '应用裁剪' })) {
    fireEvent.click(screen.getByRole('button', { name: '应用裁剪' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('文档已变化');
  }
  expect(onChange).not.toHaveBeenCalled();
  expect(textbox.querySelector('img[data-word-image]')).toBeNull();
});

it('restores a rejected controlled crop and saves the original image', async () => {
  const value = documentModel();
  value.content.content![0].content!.unshift({ type: 'image', attrs: { src: `data:image/png;base64,${PNG}`, width: 320, height: 160 } });
  const ref = createRef<OfficeStudioHandle>();
  const onChange = vi.fn(), onSave = vi.fn();
  render(<OfficeStudio ref={ref} value={value} onChange={onChange} onSave={onSave} />);
  const body = await screen.findByRole('textbox', { name: 'Word 文档正文' });
  fireEvent.click(body.querySelector('img[data-word-image]')!);
  fireEvent.click(screen.getByRole('button', { name: '裁剪图片' }));
  fireEvent.change(screen.getByRole('spinbutton', { name: '左边裁剪百分比' }), { target: { value: '25' } });
  fireEvent.click(screen.getByRole('button', { name: '应用裁剪' }));
  await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(body.querySelector('img[data-word-image]')).not.toHaveAttribute('data-word-image-crop'));
  expect(ref.current?.getDocument()).toBe(value);
  await act(async () => ref.current?.save());
  expect(onSave).toHaveBeenCalledWith(value);
});

it('replaces a selected picture through the actual file input and restores its original crop with undo', async () => {
  const model = documentModel();
  model.content.content![0].content!.unshift({ type: 'image', attrs: { src: `data:image/png;base64,${PNG}`, width: 320, height: 160, alt: '保留说明', crop: { left: 25, top: 0, right: 0, bottom: 0 } } });
  const { textbox, onChange } = await mount({ document: model });
  fireEvent.click(textbox.querySelector('img[data-word-image]')!);
  fireEvent.click(screen.getByRole('button', { name: '替换图片' }));
  const input = screen.getByLabelText('选择替换 Word 图片');
  fireEvent.change(input, { target: { files: [new File([Uint8Array.from(atob(JPEG), char => char.charCodeAt(0))], '替换.jpg', { type: 'image/jpeg' })] } });
  await waitFor(() => expect(textbox.querySelector('img[data-word-image]')).toHaveAttribute('src', `data:image/jpeg;base64,${JPEG}`));
  expect(onChange.mock.lastCall?.[0].content.content[0].content[0].attrs).toMatchObject({ width: 320, height: 160, alt: '保留说明', crop: null });
  expect(textbox.querySelectorAll('img[data-word-image]')).toHaveLength(1);
  fireEvent.click(screen.getByRole('tab', { name: '开始' })); fireEvent.click(screen.getByRole('button', { name: '撤销' }));
  await waitFor(() => expect(textbox.querySelector('img[data-word-image]')).toHaveAttribute('src', `data:image/png;base64,${PNG}`));
  expect(textbox.querySelector('img[data-word-image]')).toHaveAttribute('data-word-image-crop', expect.stringContaining('25'));
  fireEvent.click(screen.getByRole('button', { name: '重做' }));
  await waitFor(() => expect(textbox.querySelector('img[data-word-image]')).toHaveAttribute('src', `data:image/jpeg;base64,${JPEG}`));
});
it('keeps the selected original image and history when a replacement file is invalid or cancelled', async () => {
  const model = documentModel();
  model.content.content![0].content!.unshift({ type: 'image', attrs: { src: `data:image/png;base64,${PNG}`, width: 320, height: 160 } });
  const { textbox, onChange } = await mount({ document: model });
  fireEvent.click(textbox.querySelector('img[data-word-image]')!);
  fireEvent.click(screen.getByRole('button', { name: '替换图片' }));
  fireEvent.change(screen.getByLabelText('选择替换 Word 图片'), { target: { files: [new File(['<svg/>'], 'invalid.png', { type: 'image/png' })] } });
  await screen.findByText('请选择有效的 PNG 或 JPEG 图片。');
  expect(onChange).not.toHaveBeenCalled();
  expect(textbox.querySelector('img[data-word-image]')).toHaveAttribute('src', `data:image/png;base64,${PNG}`);
  fireEvent.click(screen.getByRole('button', { name: '替换图片' }));
  fireEvent.change(screen.getByLabelText('选择替换 Word 图片'), { target: { files: [] } });
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '替换图片' }));
  fireEvent(screen.getByLabelText('选择替换 Word 图片'), new Event('cancel'));
  fireEvent.change(screen.getByLabelText('选择替换 Word 图片'), { target: { files: [new File([Uint8Array.from(atob(JPEG), char => char.charCodeAt(0))], 'late.jpg', { type: 'image/jpeg' })] } });
  await act(async () => { await Promise.resolve(); });
  expect(onChange).not.toHaveBeenCalled();
  expect(textbox.querySelector('img[data-word-image]')).toHaveAttribute('src', `data:image/png;base64,${PNG}`);

});

it('discards a delayed replacement after readonly or document changes', async () => {
  const model = documentModel();
  model.content.content![0].content!.unshift({ type: 'image', attrs: { src: `data:image/png;base64,${PNG}`, width: 320, height: 160 } });
  const { textbox, onChange, rerender } = await mount({ document: model });
  let reader: FileReader | null = null;
  const captureReader = (value: FileReader) => { reader = value; };
  const read = vi.spyOn(FileReader.prototype, 'readAsArrayBuffer').mockImplementation(function (this: FileReader) { captureReader(this); });
  try {
    fireEvent.click(textbox.querySelector('img[data-word-image]')!);
    fireEvent.click(screen.getByRole('button', { name: '替换图片' }));
    fireEvent.change(screen.getByLabelText('选择替换 Word 图片'), { target: { files: [new File(['delayed'], 'delayed.jpg')] } });
    expect(reader).not.toBeNull();
    rerender(<WordHost document={model} onChange={onChange} disabled={false} readOnly />);
    const bytes = Uint8Array.from(atob(JPEG), char => char.charCodeAt(0));
    await act(async () => {
      Object.defineProperty(reader!, 'result', { value: bytes.buffer });
      reader!.onload?.call(reader!, new ProgressEvent('load') as ProgressEvent<FileReader>);
    });
    expect(onChange).not.toHaveBeenCalled();
    expect(textbox.querySelector('img[data-word-image]')).toHaveAttribute('src', `data:image/png;base64,${PNG}`);
    expect(screen.getByRole('button', { name: '替换图片' })).toBeDisabled();
    rerender(<WordHost document={model} onChange={onChange} disabled={false} readOnly={false} />);
    fireEvent.click(textbox.querySelector('img[data-word-image]')!);
    fireEvent.click(screen.getByRole('button', { name: '替换图片' }));
    fireEvent.change(screen.getByLabelText('选择替换 Word 图片'), { target: { files: [new File(['delayed'], 'delayed.jpg')] } });
    const next = documentModel('外部替换文档');
    rerender(<WordHost document={next} onChange={onChange} disabled={false} readOnly={false} />);
    await act(async () => {
      Object.defineProperty(reader!, 'result', { value: bytes.buffer, configurable: true });
      reader!.onload?.call(reader!, new ProgressEvent('load') as ProgressEvent<FileReader>);
    });
    expect(onChange).not.toHaveBeenCalled(); expect(textbox.querySelector('img[data-word-image]')).toBeNull();
    expect(textbox).toHaveTextContent('外部替换文档');
  } finally { read.mockRestore(); }
});

it('restores a rejected controlled image replacement and saves the original source', async () => {
  const value = documentModel();
  value.content.content![0].content!.unshift({ type: 'image', attrs: { src: `data:image/png;base64,${PNG}`, width: 320, height: 160, crop: { left: 25, top: 0, right: 0, bottom: 0 } } });
  const ref = createRef<OfficeStudioHandle>();
  const onChange = vi.fn(), onSave = vi.fn();
  render(<OfficeStudio ref={ref} value={value} onChange={onChange} onSave={onSave} />);
  const body = await screen.findByRole('textbox', { name: 'Word 文档正文' });
  fireEvent.click(body.querySelector('img[data-word-image]')!);
  fireEvent.click(screen.getByRole('button', { name: '替换图片' }));
  fireEvent.change(screen.getByLabelText('选择替换 Word 图片'), { target: { files: [new File([Uint8Array.from(atob(JPEG), char => char.charCodeAt(0))], 'new.jpg', { type: 'image/jpeg' })] } });
  await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(body.querySelector('img[data-word-image]')).toHaveAttribute('src', `data:image/png;base64,${PNG}`));
  expect(body.querySelector('img[data-word-image]')).toHaveAttribute('data-word-image-crop', expect.stringContaining('25'));
  expect(ref.current?.getDocument()).toBe(value);
  await act(async () => ref.current?.save()); expect(onSave).toHaveBeenCalledWith(value);
});

it('inserts a structured fraction through the actual math dialog and undoes it atomically', async () => {
  const { textbox, onChange } = await mount();
  const editor = (textbox as HTMLElement & { editor: Editor }).editor;
  act(() => editor.commands.setTextSelection(1));
  fireEvent.click(screen.getByRole('tab', { name: '插入' }));
  fireEvent.click(screen.getByRole('button', { name: '数学公式' }));
  fireEvent.click(screen.getByRole('button', { name: '公式改为分式' }));
  fireEvent.change(screen.getByRole('textbox', { name: '公式 分子文字' }), { target: { value: 'x+1' } });
  fireEvent.click(screen.getByRole('button', { name: '取消' })); expect(onChange).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '数学公式' }));
  fireEvent.click(screen.getByRole('button', { name: '公式改为分式' }));
  fireEvent.change(screen.getByRole('textbox', { name: '公式 分子文字' }), { target: { value: 'x+1' } });
  fireEvent.click(screen.getByRole('button', { name: '保存数学公式' }));
  await waitFor(() => expect(textbox.querySelector('math mfrac')).not.toBeNull());
  expect(onChange.mock.lastCall?.[0].content.content[0].content[0].attrs.equation.numerator.text).toBe('x+1');
  fireEvent.click(screen.getByRole('tab', { name: '开始' })); fireEvent.click(screen.getByRole('button', { name: '撤销' }));
  await waitFor(() => expect(textbox.querySelector('[data-word-math]')).toBeNull());
  fireEvent.click(screen.getByRole('button', { name: '重做' }));
  await waitFor(() => expect(textbox.querySelector('math mfrac')).not.toBeNull());
});

it('blocks an open math draft after permissions or external content change', async () => {
  const value = documentModel();
  const { textbox, onChange, rerender } = await mount({ document: value });
  const editor = (textbox as HTMLElement & { editor: Editor }).editor;
  act(() => editor.commands.setTextSelection(1));
  fireEvent.click(screen.getByRole('tab', { name: '插入' }));
  fireEvent.click(screen.getByRole('button', { name: '数学公式' }));
  fireEvent.click(screen.getByRole('button', { name: '公式改为矩阵' }));
  rerender(<WordHost document={value} onChange={onChange} disabled={false} readOnly />);
  expect(screen.getByRole('button', { name: '保存数学公式' })).toBeDisabled();
  rerender(<WordHost document={documentModel('外部新内容')} onChange={onChange} disabled={false} readOnly={false} />);
  fireEvent.click(screen.getByRole('button', { name: '保存数学公式' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('文档已变化');
  expect(onChange).not.toHaveBeenCalled(); expect(textbox.querySelector('[data-word-math]')).toBeNull();
});

it('edits an existing math structure through the dialog with separate undo and redo', async () => {
  const { textbox, onChange } = await mount();
  const editor = (textbox as HTMLElement & { editor: Editor }).editor;
  act(() => editor.commands.setTextSelection(1));
  fireEvent.click(screen.getByRole('tab', { name: '插入' }));
  fireEvent.click(screen.getByRole('button', { name: '数学公式' }));
  fireEvent.click(screen.getByRole('button', { name: '保存数学公式' }));
  await waitFor(() => expect(textbox.querySelector('math mtext')).toHaveTextContent('x'));
  fireEvent.click(screen.getByRole('button', { name: '数学公式' }));
  expect(screen.getByRole('textbox', { name: '公式文字' })).toHaveValue('x');
  fireEvent.change(screen.getByRole('textbox', { name: '公式文字' }), { target: { value: 'y+2' } });
  fireEvent.click(screen.getByRole('button', { name: '保存数学公式' }));
  await waitFor(() => expect(textbox.querySelector('math mtext')).toHaveTextContent('y+2'));
  expect(textbox.querySelectorAll('[data-word-math]')).toHaveLength(1);
  expect(onChange).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole('tab', { name: '开始' }));
  fireEvent.click(screen.getByRole('button', { name: '撤销' }));
  await waitFor(() => expect(textbox.querySelector('math mtext')).toHaveTextContent('x'));
  fireEvent.click(screen.getByRole('button', { name: '重做' }));
  await waitFor(() => expect(textbox.querySelector('math mtext')).toHaveTextContent('y+2'));
});

it('keeps composition drafts out of the document through the actual math entry', async () => {
  const { textbox, onChange } = await mount();
  const editor = (textbox as HTMLElement & { editor: Editor }).editor;
  act(() => editor.commands.setTextSelection(1));
  fireEvent.click(screen.getByRole('tab', { name: '插入' }));
  fireEvent.click(screen.getByRole('button', { name: '数学公式' }));
  const input = screen.getByRole('textbox', { name: '公式文字' });
  fireEvent.compositionStart(input);
  fireEvent.change(input, { target: { value: '变量甲' } });
  expect(screen.getByRole('button', { name: '保存数学公式' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: '保存数学公式' }));
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.compositionEnd(input);
  Object.defineProperty(editor.view, 'composing', { configurable: true, value: true });
  fireEvent.click(screen.getByRole('button', { name: '保存数学公式' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('输入法');
  expect(onChange).not.toHaveBeenCalled();
  Object.defineProperty(editor.view, 'composing', { configurable: true, value: false });
  fireEvent.click(screen.getByRole('button', { name: '保存数学公式' }));
  await waitFor(() => expect(textbox.querySelector('math mtext')).toHaveTextContent('变量甲'));
  expect(onChange).toHaveBeenCalledTimes(1);
});

it.each([{ readOnly: true }, { disabled: true }])('disables actual math insertion and stale drafts with %j', async permissions => {
  const value = documentModel();
  const { textbox, onChange, rerender } = await mount({ document: value });
  const editor = (textbox as HTMLElement & { editor: Editor }).editor;
  act(() => editor.commands.setTextSelection(1));
  fireEvent.click(screen.getByRole('tab', { name: '插入' }));
  fireEvent.click(screen.getByRole('button', { name: '数学公式' }));
  rerender(<WordHost document={value} onChange={onChange} disabled={false} readOnly={false} {...permissions} />);
  expect(screen.getByRole('button', { name: '保存数学公式' })).toBeDisabled();
  expect(screen.getByRole('textbox', { name: '公式文字' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: '取消' }));
  expect(screen.getByRole('button', { name: '数学公式' })).toBeDisabled();
  expect(onChange).not.toHaveBeenCalled();
  expect(textbox.querySelector('[data-word-math]')).toBeNull();
});

it('restores a rejected controlled math edit and saves the original semantic model', async () => {
  const value = documentModel();
  const equation = { kind: 'fraction', numerator: { kind: 'text', text: 'x', format: { bold: true } }, denominator: { kind: 'text', text: '2' } };
  value.content.content![0].content = [{ type: 'mathEquation', attrs: { equation } }];
  const onChange = vi.fn(), onSave = vi.fn(), ref = createRef<OfficeStudioHandle>();
  render(<OfficeStudio ref={ref} value={value} onChange={onChange} onSave={onSave} />);
  const body = await screen.findByRole('textbox', { name: 'Word 文档正文' });
  const editor = (body as HTMLElement & { editor: Editor }).editor;
  act(() => editor.commands.setNodeSelection(1));
  fireEvent.click(screen.getByRole('tab', { name: '插入' }));
  fireEvent.click(screen.getByRole('button', { name: '数学公式' }));
  fireEvent.change(screen.getByRole('textbox', { name: '公式 分子文字' }), { target: { value: 'rejected' } });
  fireEvent.click(screen.getByRole('button', { name: '保存数学公式' }));
  await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(body.querySelector('mfrac mtext')).toHaveTextContent('x'));
  expect(JSON.parse(body.querySelector('[data-word-math]')!.getAttribute('data-word-math')!)).toEqual(equation);
  expect(ref.current?.getDocument()).toBe(value);
  await act(async () => ref.current?.save());
  expect(onSave).toHaveBeenCalledWith(value);
});

it('edits a second equation group member through the actual dialog and undoes the group atomically', async () => {
  const value = documentModel();
  const equation = { kind: 'display', align: 'centerGroup', body: { kind: 'text', text: 'x' }, following: [{ kind: 'text', text: 'y' }] };
  value.content.content![0].content = [{ type: 'mathEquation', attrs: { equation } }];
  const { textbox, onChange } = await mount({ document: value });
  const editor = (textbox as HTMLElement & { editor: Editor }).editor;
  act(() => editor.commands.setNodeSelection(1));
  fireEvent.click(screen.getByRole('tab', { name: '插入' }));
  fireEvent.click(screen.getByRole('button', { name: '数学公式' }));
  fireEvent.change(screen.getByRole('textbox', { name: '公式 组内第2公式文字' }), { target: { value: 'y+1' } });
  fireEvent.click(screen.getByRole('button', { name: '增加组内公式' }));
  fireEvent.click(screen.getByRole('button', { name: '保存数学公式' }));
  await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
  expect(JSON.parse(textbox.querySelector('[data-word-math]')!.getAttribute('data-word-math')!).following).toHaveLength(2);
  fireEvent.click(screen.getByRole('tab', { name: '开始' }));
  fireEvent.click(screen.getByRole('button', { name: '撤销' }));
  await waitFor(() => expect(JSON.parse(textbox.querySelector('[data-word-math]')!.getAttribute('data-word-math')!)).toEqual(equation));
  fireEvent.click(screen.getByRole('button', { name: '重做' }));
  await waitFor(() => expect(textbox.querySelectorAll('math mtext')[1]).toHaveTextContent('y+1'));
});

it.each(['header', 'footer'] as const)('edits a math group independently in the actual %s region with undo and redo', async region => {
  const value = documentModel();
  const equation = { kind: 'display', align: 'centerGroup', body: { kind: 'text', text: 'x' }, following: [{ kind: 'text', text: 'y' }] };
  value[region] = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'mathEquation', attrs: { equation } }] }] };
  const { textbox, onChange } = await mount({ document: value });
  fireEvent.doubleClick(screen.getByLabelText(region === 'header' ? '页眉区域' : '页脚区域'));
  const box = await screen.findByRole('textbox', { name: region === 'header' ? 'Word 页眉' : 'Word 页脚' });
  await waitFor(() => expect(box).toHaveAttribute('contenteditable', 'true'));
  const regionEditor = (box as HTMLElement & { editor: Editor }).editor;
  act(() => { box.focus(); regionEditor.commands.setNodeSelection(1); });
  fireEvent.click(screen.getByRole('tab', { name: '插入' }));
  fireEvent.click(screen.getByRole('button', { name: '数学公式' }));
  fireEvent.change(screen.getByRole('textbox', { name: '公式 组内第2公式文字' }), { target: { value: region + '+1' } });
  fireEvent.click(screen.getByRole('button', { name: '保存数学公式' }));
  await waitFor(() => expect(box.querySelectorAll('math mtext')[1]).toHaveTextContent(region + '+1'));
  expect(textbox).toHaveTextContent('项目评审内容');
  expect(onChange.mock.lastCall?.[0][region].content[0].content[0].attrs.equation.following[0].text).toBe(region + '+1');
  fireEvent.click(screen.getByRole('tab', { name: '开始' }));
  fireEvent.click(screen.getByRole('button', { name: '撤销' }));
  await waitFor(() => expect(box.querySelectorAll('math mtext')[1]).toHaveTextContent('y'));
  fireEvent.click(screen.getByRole('button', { name: '重做' }));
  await waitFor(() => expect(box.querySelectorAll('math mtext')[1]).toHaveTextContent(region + '+1'));
});

it('creates and removes bookmarks through the actual dialog with atomic history and duplicate validation', async () => {
  const { textbox } = await mount();
  const editor = (textbox as HTMLElement & { editor: Editor }).editor;
  act(() => editor.commands.setTextSelection({ from: 2, to: 5 }));
  fireEvent.click(screen.getByRole('tab', { name: '引用' }));
  fireEvent.click(screen.getByRole('button', { name: '书签' }));
  fireEvent.change(screen.getByLabelText('书签名称'), { target: { value: 'Here' } });
  fireEvent.click(screen.getByRole('button', { name: '添加书签' }));
  await waitFor(() => expect(textbox.querySelectorAll('[data-word-bookmark]')).toHaveLength(2));
  fireEvent.change(screen.getByLabelText('书签名称'), { target: { value: 'Here' } });
  fireEvent.click(screen.getByRole('button', { name: '添加书签' }));
  expect(screen.getByRole('alert')).toHaveTextContent('同名');
  fireEvent.click(screen.getByRole('button', { name: '删除书签 Here' }));
  await waitFor(() => expect(textbox.querySelectorAll('[data-word-bookmark]')).toHaveLength(0));
  fireEvent.click(screen.getByRole('button', { name: '关闭' }));
  fireEvent.click(screen.getByRole('tab', { name: '开始' }));
  fireEvent.click(screen.getByRole('button', { name: '撤销' }));
  await waitFor(() => expect(textbox.querySelectorAll('[data-word-bookmark]')).toHaveLength(2));
  fireEvent.click(screen.getByRole('button', { name: '撤销' }));
  await waitFor(() => expect(textbox.querySelectorAll('[data-word-bookmark]')).toHaveLength(0));
});

it('applies an internal bookmark link through the actual link dialog and preserves it through undo', async () => {
  const model = documentModel('Target and link');
  model.content.content![0].content!.unshift({ type: 'wordBookmark', attrs: { id: '9', name: 'Here', end: false } });
  model.content.content![0].content!.push({ type: 'wordBookmark', attrs: { id: '9', name: 'Here', end: true } });
  const { textbox } = await mount({ document: model });
  const editor = (textbox as HTMLElement & { editor: Editor }).editor;
  act(() => editor.commands.setTextSelection({ from: 13, to: 17 }));
  fireEvent.click(screen.getByRole('tab', { name: '引用' }));
  fireEvent.click(screen.getByRole('button', { name: '链接' }));
  fireEvent.change(screen.getByLabelText('链接地址'), { target: { value: '#Here' } });
  fireEvent.click(screen.getByRole('button', { name: '应用链接' }));
  await waitFor(() => expect(textbox.querySelector('a')).toHaveAttribute('href', '#Here'));
  fireEvent.click(screen.getByRole('tab', { name: '开始' }));
  fireEvent.click(screen.getByRole('button', { name: '撤销' }));
  await waitFor(() => expect(textbox.querySelector('a')).toBeNull());
  fireEvent.click(screen.getByRole('button', { name: '重做' }));
  await waitFor(() => expect(textbox.querySelector('a')).toHaveAttribute('href', '#Here'));
});

it('keeps bookmark browsing available in readonly and disables mutation', async () => {
  const model = documentModel('Target');
  model.content.content![0].content!.unshift({ type: 'wordBookmark', attrs: { id: '1', name: 'Here', end: false } });
  model.content.content![0].content!.push({ type: 'wordBookmark', attrs: { id: '1', name: 'Here', end: true } });
  const { textbox, onChange } = await mount({ document: model, readOnly: true });
  fireEvent.click(screen.getByRole('tab', { name: '引用' }));
  fireEvent.click(screen.getByRole('button', { name: '书签' }));
  fireEvent.change(screen.getByLabelText('书签名称'), { target: { value: 'Other' } });
  expect(screen.getByRole('button', { name: '添加书签' })).toBeDisabled();
  expect(screen.getByRole('button', { name: '删除书签 Here' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: '跳转书签 Here' }));
  const editor = (textbox as HTMLElement & { editor: Editor }).editor;
  expect(editor.state.selection.from).toBe(2);
  expect(editor.state.selection.to).toBe(8);
  expect(onChange).not.toHaveBeenCalled();
});

it('edits existing link display text and address in one transaction while retaining bold formatting', async () => {
  const model = documentModel('Old');
  model.content.content![0].content![0].marks = [{ type: 'bold' }, { type: 'link', attrs: { href: 'https://example.com' } }];
  const { textbox } = await mount({ document: model });
  const editor = (textbox as HTMLElement & { editor: Editor }).editor;
  act(() => editor.commands.setTextSelection(2));
  fireEvent.click(screen.getByRole('tab', { name: '引用' }));
  fireEvent.click(screen.getByRole('button', { name: '链接' }));
  expect(screen.getByLabelText('链接显示文字')).toHaveValue('Old');
  fireEvent.change(screen.getByLabelText('链接显示文字'), { target: { value: 'New label' } });
  fireEvent.change(screen.getByLabelText('链接地址'), { target: { value: 'https://example.org' } });
  fireEvent.click(screen.getByRole('button', { name: '应用链接' }));
  await waitFor(() => expect(textbox.querySelector('a')).toHaveTextContent('New label'));
  expect(textbox.querySelector('strong')).toHaveTextContent('New label');
  expect(textbox.querySelector('a')).toHaveAttribute('href', 'https://example.org');
  fireEvent.click(screen.getByRole('tab', { name: '开始' }));
  fireEvent.click(screen.getByRole('button', { name: '撤销' }));
  await waitFor(() => expect(textbox.querySelector('a')).toHaveTextContent('Old'));
  expect(textbox.querySelector('a')).toHaveAttribute('href', 'https://example.com');
});

it('retains mixed character marks and complete Unicode when replacing a link label', async () => {
  const model = documentModel();
  model.content.content![0].content = [
    { type: 'text', text: 'AB', marks: [{ type: 'bold' }, { type: 'link', attrs: { href: 'https://example.com' } }] },
    { type: 'text', text: 'CD', marks: [{ type: 'italic' }, { type: 'link', attrs: { href: 'https://example.com' } }] },
  ];
  const { textbox } = await mount({ document: model });
  const editor = (textbox as HTMLElement & { editor: Editor }).editor;
  act(() => editor.commands.setTextSelection(2));
  fireEvent.click(screen.getByRole('tab', { name: '引用' }));
  fireEvent.click(screen.getByRole('button', { name: '链接' }));
  fireEvent.change(screen.getByLabelText('链接显示文字'), { target: { value: 'XY🧮Z' } });
  fireEvent.click(screen.getByRole('button', { name: '应用链接' }));
  await waitFor(() => expect(textbox.querySelector('a')).toHaveTextContent('XY🧮Z'));
  expect(textbox.querySelector('strong')).toHaveTextContent('XY');
  expect(textbox.querySelector('em')).toHaveTextContent('🧮Z');
});

it('opens an internal link across regions in readonly without editing document data', async () => {
  const model = documentModel('Go');
  model.content.content![0].content![0].marks = [{ type: 'link', attrs: { href: '#HeaderTarget' } }];
  model.header = { type: 'doc', content: [{ type: 'paragraph', content: [
    { type: 'wordBookmark', attrs: { id: '3', name: 'HeaderTarget', end: false } },
    { type: 'text', text: 'Header' },
    { type: 'wordBookmark', attrs: { id: '3', name: 'HeaderTarget', end: true } },
  ] }] };
  const { textbox, onChange } = await mount({ document: model, readOnly: true });
  const header = await screen.findByRole('textbox', { name: 'Word 页眉' });
  fireEvent.click(textbox.querySelector('a')!);
  await waitFor(() => expect((header as HTMLElement & { editor: Editor }).editor.state.selection.from).toBe(2));
  expect((header as HTMLElement & { editor: Editor }).editor.state.selection.to).toBe(8);
  expect(onChange).not.toHaveBeenCalled();
});
