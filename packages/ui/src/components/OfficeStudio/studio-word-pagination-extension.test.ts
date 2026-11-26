import { afterEach, expect, it, vi } from 'vitest';
import { Editor, type JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import { undoDepth } from '@tiptap/pm/history';
import { WordPaginationLayout, wordSetPagination } from './studio-word-pagination-extension';
import { WordTable, WordTableSpacing } from './studio-word-table-extension';
import { WordTableCell, WordTableHeader } from './studio-word-table-cell';

let editor: Editor | undefined;
afterEach(() => {
  editor?.destroy(); editor = undefined;
  vi.restoreAllMocks(); vi.unstubAllGlobals();
  document.body.replaceChildren();
});

function rect(width: number, height: number, top = 0, left = 0): DOMRect {
  return { x: left, y: top, left, right: left + width, top, bottom: top + height, width, height, toJSON: () => ({ width, height, top, left }) } as DOMRect;
}
function setup() {
  const frames = new Map<number, FrameRequestCallback>(); let frameId = 0;
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
    const id = ++frameId; frames.set(id, callback); return id;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(id => { frames.delete(id); });
  vi.stubGlobal('ResizeObserver', class {
    observe() {} unobserve() {} disconnect() {}
  });
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
    return this.tagName === 'TABLE' ? 400 : this.tagName === 'TD' ? 200 : 600;
  });
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const table = this.tagName === 'TABLE' ? this : this.closest('table');
    if (this.tagName === 'P' && !table) return rect(600, 16);
    const minima = Array.from(table?.querySelectorAll<HTMLElement>('[data-word-cell-content]') || [], content => parseFloat(content.style.minHeight) || 0);
    if (this.tagName === 'TABLE' && this.closest('[aria-hidden="true"]')) expect(minima).toEqual([0, 0]);
    const height = Math.max(49, ...minima);
    return rect(this.tagName === 'TABLE' ? 400 : this.tagName === 'TD' ? 200 : 600, height);
  });
  const rangeRect = function (this: Range) {
    const text = this.startContainer.textContent || '';
    const index = Number(text.at(-1)) - 1;
    if (!/^[AB][123]$/.test(text)) return rect(5, 18);
    const top = text.startsWith('A') ? index * 16 - 0.5 : index * 20 + 0.5;
    return rect(5, text.startsWith('A') ? 18 : 20, top, this.startOffset * 5);
  };
  const oldRangeRect = Object.getOwnPropertyDescriptor(Range.prototype, 'getBoundingClientRect');
  Object.defineProperty(Range.prototype, 'getBoundingClientRect', { configurable: true, value: rangeRect });
  const restoreRange = () => {
    if (oldRangeRect) Object.defineProperty(Range.prototype, 'getBoundingClientRect', oldRangeRect);
    else Reflect.deleteProperty(Range.prototype, 'getBoundingClientRect');
  };
  const content = (label: string, count: number): JSONContent => ({
    type: 'tableCell', attrs: { colwidth: [200] }, content: [{ type: 'paragraph', content:
      Array.from({ length: count }, (_, index) => [
        ...(index ? [{ type: 'hardBreak' }] : []), { type: 'text', text: `${label}${index + 1}` },
      ]).flat(),
    }],
  });
  const host = document.createElement('div'); document.body.append(host);
  editor = new Editor({
    element: host,
    extensions: [StarterKit, TableKit.configure({ table: false, tableCell: false, tableHeader: false }), WordTable, WordTableSpacing, WordTableCell, WordTableHeader, WordPaginationLayout],
    content: { type: 'doc', content: [{ type: 'table', content: [{ type: 'tableRow', content: [content('A', 3), content('B', 2)] }] }, { type: 'paragraph' }] },
  });
  const flush = () => {
    let turns = 0;
    while (frames.size) {
      if (++turns > 10) throw new Error('Pagination frames did not settle');
      const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(0));
    }
  };
  return { editor, frames, flush, restoreRange };
}

it('publishes strict multi-cell pagination after glyph overhang conversion and ignores view minima without changing the document or history', async () => {
  const f = setup();
  try {
    f.flush();
    const doc = f.editor.state.doc, history = undoDepth(f.editor.state), json = f.editor.getJSON();
    const contents = Array.from(f.editor.view.dom.querySelectorAll<HTMLElement>('[data-word-cell-content]'));
    contents.forEach(content => { content.style.minHeight = '900px'; });
    wordSetPagination(f.editor, { height: 24, margin: 8, gap: 4, enabled: true });
    expect(() => f.flush()).not.toThrow();
    await new Promise(resolve => setTimeout(resolve, 0));
    f.flush();
    expect(f.editor.view.dom.dataset.wordPaginationOverflow).toBe('false');
    expect(Number(f.editor.view.dom.dataset.wordPageCount)).toBeGreaterThan(1);
    expect(f.editor.view.dom.querySelector('tr')!.getAttribute('data-word-natural-row-height')).toBe('49');
    for (const cell of f.editor.view.dom.querySelectorAll('td'))
      expect(cell.querySelectorAll('[data-word-cell-page-gap]').length).toBeGreaterThan(0);
    expect(contents.map(content => content.style.minHeight)).toEqual(['900px', '900px']);
    expect(f.editor.state.doc).toBe(doc); expect(f.editor.getJSON()).toEqual(json);
    expect(undoDepth(f.editor.state)).toBe(history); expect(f.frames.size).toBe(0);
    wordSetPagination(f.editor, { height: 24, margin: 8, gap: 4, enabled: false });
    f.flush();
    expect(f.editor.view.dom.hasAttribute('data-word-pagination-overflow')).toBe(false);
    expect(f.editor.view.dom.querySelectorAll('[data-word-cell-page-gap]')).toHaveLength(0);
    expect(f.editor.state.doc).toBe(doc); expect(undoDepth(f.editor.state)).toBe(history);
    wordSetPagination(f.editor, { height: 24, margin: 8, gap: 4, enabled: true });
    f.flush();
    expect(f.editor.view.dom.dataset.wordPaginationOverflow).toBe('false');
    expect(f.editor.view.dom.querySelector('tr')!.getAttribute('data-word-natural-row-height')).toBe('49');
  } finally {
    f.restoreRange();
  }
});

it('does not publish a queued layout after disabling or destroying the real editor', () => {
  const f = setup();
  try {
    f.flush();
    wordSetPagination(f.editor, { height: 24, margin: 8, gap: 4, enabled: true });
    expect(f.frames.size).toBeGreaterThan(0);
    wordSetPagination(f.editor, { height: 24, margin: 8, gap: 4, enabled: false });
    f.flush();
    expect(f.editor.view.dom.hasAttribute('data-word-pagination-overflow')).toBe(false);
    wordSetPagination(f.editor, { height: 24, margin: 8, gap: 4, enabled: true });
    const body = f.editor.view.dom;
    f.editor.destroy(); f.flush();
    expect(body.hasAttribute('data-word-pagination-overflow')).toBe(false);
    expect(f.frames.size).toBe(0);
  } finally {
    f.restoreRange();
  }
});
