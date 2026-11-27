import { afterEach, describe, expect, it, vi } from 'vitest';
import { Editor, type JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import { columnResizing, columnResizingPluginKey } from '@tiptap/pm/tables';
import { undoDepth } from '@tiptap/pm/history';
import { WordTable, WordTableSpacing } from './studio-word-table-extension';
import { wordTableColumnMinimum, wordTableColumnResizePlugin } from './studio-word-column-resize';

let editor: Editor;
afterEach(() => { if (editor && !editor.isDestroyed) editor.destroy(); vi.restoreAllMocks(); });

function row(label: string, spacing: number, widths: number[] | null = [200, 160]): JSONContent {
  return {
    type: 'tableRow', attrs: { cellSpacing: spacing },
    content: [0, 1].map(index => ({
      type: 'tableCell', attrs: { colwidth: widths ? [widths[index]] : null, align: 'center' },
      content: [{ type: 'paragraph', content: [{ type: 'text', text: `${label}${index}`, marks: [{ type: 'bold' }] }] }],
    })),
  };
}

function create({ uniform = false, unknown = false, editable = true, merged = false } = {}) {
  const first = merged ? {
    type: 'tableRow', attrs: { cellSpacing: 0 },
    content: [{
      type: 'tableCell', attrs: { colspan: 2, colwidth: unknown ? null : [200, 160], align: 'right' },
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Merged', marks: [{ type: 'bold' }] }] }],
    }],
  } : row('A', 0, unknown ? null : [200, 160]);
  editor = new Editor({
    extensions: [StarterKit, TableKit.configure({ table: false }), WordTable, WordTableSpacing],
    editable,
    content: {
      type: 'doc', content: [{
        type: 'table', attrs: { cellSpacing: 6 },
        content: [first, row('B', uniform ? 0 : 12, unknown ? null : [200, 160])],
      }, { type: 'paragraph' }],
    },
  });
  return editor;
}

function rectangles(scale = 1, viewport = 800) {
  const table = editor.view.dom.querySelector('table')!;
  const columns = () => Array.from(table.querySelectorAll<HTMLTableColElement>(':scope > colgroup > col'));
  const outerWidth = () => parseFloat(table.style.width) || viewport;
  const gap = () => (parseFloat(table.style.borderSpacing) || 0) * 4 / 3;
  const columnWidth = (index: number) => {
    const values = columns().map(column => parseFloat(column.style.width) || 0);
    if (values[index]) return values[index];
    const unknown = values.filter(value => !value).length;
    return (outerWidth() - gap() * (values.length + 1) - values.reduce((sum, value) => sum + value, 0)) / unknown;
  };
  const rect = (left: number, width: number): DOMRect => ({
    left: left * scale, right: (left + width) * scale, top: 20, bottom: 60,
    width: width * scale, height: 40, x: left * scale, y: 20, toJSON: () => ({}),
  });
  Object.defineProperty(table, 'offsetWidth', { configurable: true, get: outerWidth });
  table.getBoundingClientRect = () => rect(100, outerWidth());
  Object.defineProperty(editor.view.dom, 'offsetWidth', { configurable: true, value: viewport });
  editor.view.dom.getBoundingClientRect = () => rect(0, viewport);
  columns().forEach((column, index) => {
    column.getBoundingClientRect = () => rect(
      100 + Array.from({ length: index }, (_, item) => columnWidth(item)).reduce((sum, width) => sum + width, 0),
      columnWidth(index)
    );
  });
  table.querySelectorAll('tr').forEach(bodyRow => {
    let column = 0;
    bodyRow.querySelectorAll<HTMLTableCellElement>(':scope > td,:scope > th').forEach(cell => {
      const start = column, span = cell.colSpan;
      cell.getBoundingClientRect = () => rect(
        100 + Array.from({ length: start }, (_, index) => columnWidth(index)).reduce((sum, width) => sum + width, 0),
        Array.from({ length: span }, (_, index) => columnWidth(start + index)).reduce((sum, width) => sum + width, 0) + gap() * (span - 1)
      );
      column += span;
    });
  });
  return table;
}

function activate(position = 2) {
  editor.view.dispatch(editor.state.tr.setMeta(columnResizingPluginKey, { setHandle: position })
    .setMeta('addToHistory', false));
  const cell = editor.view.nodeDOM(position) as HTMLElement;
  const startX = cell.getBoundingClientRect().right;
  cell.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, buttons: 1, clientX: startX }));
  return startX;
}
function move(clientX: number) {
  window.dispatchEvent(new MouseEvent('mousemove', { button: 0, buttons: 1, clientX }));
}
function release(clientX: number) {
  window.dispatchEvent(new MouseEvent('mouseup', { button: 0, buttons: 0, clientX }));
}
function widths(table: HTMLTableElement) {
  return Array.from(table.querySelectorAll<HTMLTableColElement>('col')).map(column => column.style.width);
}

describe('Word column resize geometry', () => {
  it('retains the original hover, state and decorations rather than replacing table editing', () => {
    const source = columnResizing({ View: null });
    const wrapped = wordTableColumnResizePlugin(source, {
      cellMinWidth: 25, previewColumns: () => true, restoreColumns: () => {},
    });
    expect(wrapped.spec.key).toBe(source.spec.key);
    expect(wrapped.spec.state).toBe(source.spec.state);
    expect(wrapped.spec.props!.decorations).toBe(source.spec.props!.decorations);
    expect(wrapped.spec.props!.handleDOMEvents!.mousemove).toBe(source.spec.props!.handleDOMEvents!.mousemove);
    expect(wrapped.spec.props!.handleDOMEvents!.mouseleave).toBe(source.spec.props!.handleDOMEvents!.mouseleave);
  });

  it('previews the native mixed grid without a jump, then commits only base widths once', () => {
    create(); const table = rectangles(); const before = editor.getJSON();
    expect(widths(table)).toEqual(['212px', '172px']);
    expect(table.style.width).toBe('384px');
    const start = activate();
    expect(widths(table)).toEqual(['212px', '172px']);
    expect(table.style.width).toBe('384px');
    expect(editor.getJSON()).toEqual(before);
    move(start + 40);
    expect(widths(table)).toEqual(['252px', '172px']);
    expect(table.style.width).toBe('424px');
    expect(editor.getJSON()).toEqual(before);
    release(start + 40);
    const model = editor.state.doc.firstChild!;
    expect(model.child(0).child(0).attrs.colwidth).toEqual([240]);
    expect(model.child(1).child(0).attrs.colwidth).toEqual([240]);
    expect(model.child(0).child(1).attrs.colwidth).toEqual([160]);
    expect(model.child(0).child(0).attrs.align).toBe('center');
    expect(model.child(0).child(0).firstChild!.firstChild!.marks[0].type.name).toBe('bold');
    expect(undoDepth(editor.state)).toBe(1);
    editor.commands.undo(); expect(editor.getJSON()).toEqual(before);
    expect(widths(table)).toEqual(['212px', '172px']);
    editor.commands.redo(); expect(widths(table)).toEqual(['252px', '172px']);
  });

  it('keeps a uniform row override on the same native grid and cancels preview exactly', () => {
    create({ uniform: true }); const table = rectangles(); const before = editor.getJSON();
    const start = activate();
    expect(widths(table)).toEqual(['212px', '172px']);
    move(start + 20);
    expect(widths(table)).toEqual(['232px', '172px']);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    expect(widths(table)).toEqual(['212px', '172px']);
    expect(table.style.width).toBe('384px');
    expect(table.hasAttribute('data-word-column-resize-preview')).toBe(false);
    expect(editor.getJSON()).toEqual(before);
    expect(undoDepth(editor.state)).toBe(0);
    move(start + 60); release(start + 60);
    expect(editor.getJSON()).toEqual(before);
  });

  it('converts screen deltas to model pixels at paper zoom', () => {
    create(); const table = rectangles(0.5); const start = activate();
    move(start + 20);
    expect(widths(table)).toEqual(['252px', '172px']);
    release(start + 20);
    expect(editor.state.doc.firstChild!.firstChild!.firstChild!.attrs.colwidth).toEqual([240]);
  });

  it('resolves unknown widths from real auto columns without storing the native gap twice', () => {
    create({ unknown: true }); const table = rectangles(1, 800); const before = editor.getJSON();
    const start = activate();
    expect(columnResizingPluginKey.getState(editor.state)!.dragging).toMatchObject({ startWidth: 388 });
    expect(table.querySelector('col')!.style.width).toBe('400px');
    expect(editor.getJSON()).toEqual(before);
    move(start + 40);
    expect(table.querySelector('col')!.style.width).toBe('440px');
    release(start + 40);
    expect(editor.state.doc.firstChild!.firstChild!.firstChild!.attrs.colwidth).toEqual([428]);
    expect(editor.state.doc.firstChild!.child(1).firstChild!.attrs.colwidth).toEqual([428]);
    expect(editor.state.doc.firstChild!.firstChild!.child(1).attrs.colwidth).toBeNull();
  });

  it('does not materialize unknown widths for a click without movement', () => {
    create({ unknown: true }); rectangles(); const before = editor.getJSON();
    const start = activate(); release(start);
    expect(editor.getJSON()).toEqual(before);
    expect(undoDepth(editor.state)).toBe(0);
  });

  it('keeps a known base value when fractional rectangle measurements differ slightly', () => {
    create(); const table = rectangles();
    const column = table.querySelector('col')!;
    const original = column.getBoundingClientRect.bind(column);
    column.getBoundingClientRect = () => ({ ...original(), width: 212.3 }) as DOMRect;
    const start = activate();
    expect(columnResizingPluginKey.getState(editor.state)!.dragging).toMatchObject({ startWidth: 200 });
    move(start + 40); release(start + 40);
    expect(editor.state.doc.firstChild!.firstChild!.firstChild!.attrs.colwidth).toEqual([240]);
  });

  it('uses the unscaled computed width for an automatic column before subtracting native gaps', () => {
    create({ unknown: true }); const table = rectangles(); const column = table.querySelector('col')!;
    const computed = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element, pseudo) => {
      const style = computed(element, pseudo);
      if (element !== column) return style;
      return new Proxy(style, { get(target, property) {
        if (property === 'width') return '400px';
        const value = Reflect.get(target, property, target);
        return typeof value === 'function' ? value.bind(target) : value;
      } });
    });
    const start = activate();
    expect(columnResizingPluginKey.getState(editor.state)!.dragging).toMatchObject({ startWidth: 388 });
    move(start + 40); release(start + 40);
    expect(editor.state.doc.firstChild!.firstChild!.firstChild!.attrs.colwidth).toEqual([428]);
  });

  it('preserves unknown slots of a merged cell while resizing its last logical column', () => {
    create({ unknown: true, merged: true }); const table = rectangles(); const before = editor.getJSON();
    const start = activate();
    expect(editor.getJSON()).toEqual(before);
    move(start + 40); release(start + 40);
    const model = editor.state.doc.firstChild!;
    expect(model.firstChild!.firstChild!.attrs.colwidth).toEqual([0, 428]);
    expect(model.child(1).child(0).attrs.colwidth).toBeNull();
    expect(model.child(1).child(1).attrs.colwidth).toEqual([428]);
    expect(table.querySelectorAll('col')[1].style.width).toBe('440px');
  });

  it('uses the last logical column of a merged cell and preserves its other width', () => {
    create({ merged: true }); const table = rectangles(); const before = editor.getJSON();
    const start = activate(); move(start + 40); release(start + 40);
    const model = editor.state.doc.firstChild!;
    expect(model.firstChild!.firstChild!.attrs.colwidth).toEqual([200, 200]);
    expect(model.child(1).child(0).attrs.colwidth).toEqual([200]);
    expect(model.child(1).child(1).attrs.colwidth).toEqual([200]);
    expect(model.firstChild!.firstChild!.attrs.align).toBe('right');
    expect(widths(table)).toEqual(['212px', '212px']);
    editor.commands.undo(); expect(editor.getJSON()).toEqual(before);
  });

  it('keeps row-specific gaps outside the minimum visible cell box', () => {
    create(); const table = rectangles(); const start = activate();
    expect(wordTableColumnMinimum(editor.state.doc.firstChild!, 0, 25)).toBe(37);
    move(start - 1000);
    expect(table.querySelector('col')!.style.width).toBe('49px');
    release(start - 1000);
    expect(editor.state.doc.firstChild!.firstChild!.firstChild!.attrs.colwidth).toEqual([37]);
  });
});

describe('Word column resize transaction and cancellation', () => {
  it('separates the resize from the preceding typing transaction', () => {
    create(); const original = editor.getJSON();
    editor.view.dispatch(editor.state.tr.insertText('typed', editor.state.doc.content.size - 1));
    const typed = editor.getJSON(); rectangles(); const start = activate();
    move(start + 40); release(start + 40);
    expect(undoDepth(editor.state)).toBe(2);
    editor.commands.undo(); expect(editor.getJSON()).toEqual(typed);
    editor.commands.undo(); expect(editor.getJSON()).toEqual(original);
  });

  it('cancels immediately when permission changes and supports later unlocking', () => {
    create(); const table = rectangles(); const before = editor.getJSON(); const start = activate();
    move(start + 40); editor.setEditable(false);
    expect(table.hasAttribute('data-word-column-resize-preview')).toBe(false);
    expect(widths(table)).toEqual(['212px', '172px']);
    release(start + 40); expect(editor.getJSON()).toEqual(before);
    editor.setEditable(true); const next = activate(); move(next + 40); release(next + 40);
    expect(editor.state.doc.firstChild!.firstChild!.firstChild!.attrs.colwidth).toEqual([240]);
  });

  it('keeps the plugin available for an editor initialized readonly', () => {
    create({ editable: false }); rectangles(); const before = editor.getJSON();
    expect(columnResizingPluginKey.getState(editor.state)).toBeDefined();
    const plugin = editor.state.plugins.find(value => value.spec.key === columnResizingPluginKey)!;
    expect(plugin.props.handleDOMEvents!.mousedown!.call(plugin, editor.view,
      new MouseEvent('mousedown', { button: 0, buttons: 1, clientX: 312 }))).toBe(false);
    expect(editor.getJSON()).toEqual(before);
    editor.setEditable(true); const start = activate(); move(start + 40); release(start + 40);
    expect(editor.getJSON()).not.toEqual(before);
  });

  it('restores columns on blur and removes every gesture listener', () => {
    create(); const table = rectangles();
    const added = vi.spyOn(window, 'addEventListener'); const removed = vi.spyOn(window, 'removeEventListener');
    const before = editor.getJSON(); const start = activate(); move(start + 40);
    const listeners = added.mock.calls.filter(([type]) => ['mousemove', 'mouseup', 'keydown', 'blur', 'pointercancel'].includes(type));
    window.dispatchEvent(new Event('blur'));
    expect(editor.getJSON()).toEqual(before);
    expect(widths(table)).toEqual(['212px', '172px']);
    for (const [type, listener] of listeners)
      expect(removed.mock.calls.some(call => call[0] === type && call[1] === listener)).toBe(true);
    release(start + 40); expect(editor.getJSON()).toEqual(before);
  });

  it('cancels when the document changes without undoing the external edit', () => {
    create(); const table = rectangles(); const start = activate(); move(start + 40);
    editor.view.dispatch(editor.state.tr.insertText('external', 4));
    const changed = editor.getJSON();
    expect(table.hasAttribute('data-word-column-resize-preview')).toBe(false);
    expect(widths(table)).toEqual(['212px', '172px']);
    release(start + 40); expect(editor.getJSON()).toEqual(changed);
    expect(editor.getText()).toContain('external');
    expect(undoDepth(editor.state)).toBe(1);
  });

  it('cancels on composition start and does not save a subsequent mouse release', () => {
    create(); const table = rectangles(); const before = editor.getJSON(); const start = activate();
    move(start + 40);
    editor.view.dom.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    expect(table.hasAttribute('data-word-column-resize-preview')).toBe(false);
    release(start + 40); expect(editor.getJSON()).toEqual(before);
  });

  it('cleans listeners on destruction before any late mouse event', () => {
    create(); rectangles(); const start = activate(); move(start + 40);
    const view = editor.view; const before = view.state.doc;
    editor.destroy(); move(start + 80); release(start + 80);
    expect(view.state.doc).toBe(before);
  });

  it('cancels a pointer cancellation without committing the preview', () => {
    create(); const table = rectangles(); const before = editor.getJSON(); const start = activate();
    move(start + 40); window.dispatchEvent(new Event('pointercancel'));
    expect(table.hasAttribute('data-word-column-resize-preview')).toBe(false);
    expect(widths(table)).toEqual(['212px', '172px']);
    release(start + 40); expect(editor.getJSON()).toEqual(before);
    expect(undoDepth(editor.state)).toBe(0);
  });

  it('rejects an unmeasurable scale and active composition before a gesture', () => {
    create(); const table = rectangles(); const before = editor.getJSON();
    editor.view.dispatch(editor.state.tr.setMeta(columnResizingPluginKey, { setHandle: 2 })
      .setMeta('addToHistory', false));
    const plugin = editor.state.plugins.find(value => value.spec.key === columnResizingPluginKey)!;
    const start = () => plugin.props.handleDOMEvents!.mousedown!.call(plugin, editor.view,
      new MouseEvent('mousedown', { button: 0, buttons: 1, clientX: 312 }));
    vi.spyOn(editor.view, 'composing', 'get').mockReturnValue(true);
    expect(start()).toBe(false);
    vi.restoreAllMocks();
    Object.defineProperty(table, 'offsetWidth', { configurable: true, value: 0 });
    Object.defineProperty(editor.view.dom, 'offsetWidth', { configurable: true, value: 0 });
    expect(start()).toBe(false);
    expect(editor.getJSON()).toEqual(before);
    expect(undoDepth(editor.state)).toBe(0);
  });
});
