import { afterEach, describe, expect, it, vi } from 'vitest';
import { Editor, type JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import { closeHistory } from '@tiptap/pm/history';
import { Plugin } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import TextAlign from '@tiptap/extension-text-align';
import { WordTable, WordTableSpacing } from './studio-word-table-extension';
import { WordTableCell, WordTableHeader, wordTableCellNodeView } from './studio-word-table-cell';
import * as mixedLayout from './studio-word-table-mixed-layout';

let editor: Editor | undefined;
afterEach(() => { if (editor && !editor.isDestroyed) editor.destroy(); vi.restoreAllMocks(); });

function row(label: string, spacing: number | null = null): JSONContent {
  return {
    type: 'tableRow',
    attrs: { cellSpacing: spacing },
    content: [200, 160].map((width, index) => ({
      type: 'tableCell',
      attrs: { colwidth: [width] },
      content: [{ type: 'paragraph', content: [{ type: 'text', text: `${label}${index}` }] }],
    })),
  };
}

function create(content: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'table',
      attrs: { defaultCellMargins: { top: 0, left: 5.25 }, cellSpacing: 6 },
      content: [row('A'), row('B')],
    },
    { type: 'paragraph' },
  ],
}) {
  editor = new Editor({
    extensions: [StarterKit, TableKit.configure({ table: false }), WordTable, WordTableSpacing],
    content,
  });
  return editor;
}

function editableTable(instance: Editor): HTMLTableElement {
  return instance.view.dom.querySelector('table')!;
}

describe('Word table properties extension', () => {
  it('renders real table spacing and retains generated column widths with margin styles', () => {
    const instance = create();
    const table = editableTable(instance);
    expect(table.style.borderCollapse).toBe('separate');
    expect(table.style.borderSpacing).toBe('6pt');
    expect(table.style.width).toBe('384px');
    expect(table.style.getPropertyValue('--zuvi-word-cell-border-y')).toBe('2px');
    expect(table.style.getPropertyValue('--zuvi-word-table-margin-top')).toBe('0pt');
    const serialized = document.createElement('div');
    serialized.innerHTML = instance.getHTML();
    expect(serialized.querySelector('table')!.style.width).toBe('384px');
    expect(Array.from(serialized.querySelectorAll('col')).map((column) => column.style.width))
      .toEqual(['200px', '160px']);
    expect(serialized.querySelector('td')!.hasAttribute('data-word-table-margins')).toBe(false);
  });

  it('updates actual editable attrs and preserves a single table-property history action', () => {
    const instance = create();
    const before = instance.getJSON();
    const node = instance.state.doc.firstChild!;
    instance.view.dispatch(closeHistory(instance.state.tr).setNodeMarkup(0, undefined, {
      ...node.attrs,
      defaultCellMargins: { top: 0, left: 4.5 },
      cellSpacing: 3,
    }));
    let table = editableTable(instance);
    expect(table.style.width).toBe('372px');
    expect(table.style.borderSpacing).toBe('3pt');
    expect(table.style.getPropertyValue('--zuvi-word-table-margin-left')).toBe('4.5pt');
    expect(JSON.parse(table.getAttribute('data-word-table-margins')!))
      .toEqual({ top: 0, left: 4.5 });
    instance.commands.undo();
    expect(instance.getJSON()).toEqual(before);
    expect(editableTable(instance).style.width).toBe('384px');
    instance.commands.redo();
    table = editableTable(instance);
    expect(table.style.width).toBe('372px');
    expect(table.style.getPropertyValue('--zuvi-word-table-margin-left')).toBe('4.5pt');
  });

  it('preserves default identity and explicit row zero overrides over two HTML reopenings', () => {
    const instance = create({
      type: 'doc',
      content: [{
        type: 'table',
        attrs: { defaultCellMargins: { top: 0, left: 5.25 }, cellSpacing: 6 },
        content: [row('Inherited'), row('Zero', 0)],
      }],
    });
    for (let round = 0; round < 3; round++) {
      const table = instance.state.doc.firstChild!;
      expect(table.attrs.defaultCellMargins).toEqual({ top: 0, left: 5.25 });
      expect(table.attrs.cellSpacing).toBe(6);
      expect(table.child(0).attrs.cellSpacing).toBeNull();
      expect(table.child(1).attrs.cellSpacing).toBe(0);
      expect(editableTable(instance).getAttribute('data-word-spacing-layout')).toBe('mixed');
      expect(editableTable(instance).getAttribute('data-word-row-spacing-values')).toBe('[6,0]');
      expect(editableTable(instance).style.borderSpacing).toBe('0pt');
      expect(editableTable(instance).style.paddingTop).toBe('3pt');
      expect(editableTable(instance).style.paddingBottom).toBe('0pt');
      expect(Array.from(editableTable(instance).querySelectorAll('col')).map(column => column.style.width))
        .toEqual(['212px', '172px']);
      expect(table.child(0).child(0).attrs.colwidth).toEqual([200]);
      if (round < 2) instance.commands.setContent(instance.getHTML());
    }
  });

  it('refreshes row-only changes and keeps overrides independent from the table default', () => {
    const instance = create();
    const table = instance.state.doc.firstChild!;
    const secondRowPosition = 1 + table.firstChild!.nodeSize;
    instance.view.dispatch(instance.state.tr.setNodeMarkup(1, undefined, {
      ...table.firstChild!.attrs,
      cellSpacing: 0,
    }));
    expect(editableTable(instance).getAttribute('data-word-spacing-layout')).toBe('mixed');
    expect(editableTable(instance).querySelector('tr')!.getAttribute('data-word-row-cell-spacing'))
      .toBe('0');
    instance.view.dispatch(instance.state.tr.setNodeMarkup(secondRowPosition, undefined, {
      ...instance.state.doc.nodeAt(secondRowPosition)!.attrs,
      cellSpacing: 0,
    }));
    expect(instance.state.doc.firstChild!.attrs.cellSpacing).toBe(6);
    expect(editableTable(instance).getAttribute('data-word-spacing-layout')).toBe('uniform');
    expect(editableTable(instance).hasAttribute('data-word-row-spacing-values')).toBe(false);
    expect(editableTable(instance).style.borderCollapse).toBe('collapse');
    expect(editableTable(instance).style.borderSpacing).toBe('0pt');
    // Row overrides keep the original native grid width, even when they all
    // agree on a gap that differs from the table's declared default.
    expect(editableTable(instance).style.width).toBe('384px');
    expect(editableTable(instance).style.paddingTop).toBe('0pt');
    expect(editableTable(instance).style.paddingBottom).toBe('0pt');
  });

  it('renders mixed row geometry with a native colgroup and distinct row variables', () => {
    const instance = create({
      type: 'doc',
      content: [{
        type: 'table',
        attrs: { cellSpacing: 6 },
        content: [row('Zero', 0), row('Wide', 12)],
      }],
    });
    const table = editableTable(instance);
    expect(table.style.width).toBe('384px');
    expect(table.style.borderSpacing).toBe('0pt');
    expect(table.style.getPropertyValue('--zuvi-word-table-gap-top')).toBe('0pt');
    expect(table.style.getPropertyValue('--zuvi-word-table-gap-bottom')).toBe('6pt');
    const bodyRows = table.querySelectorAll('tr');
    expect(bodyRows[0].style.getPropertyValue('--zuvi-word-row-spacing')).toBe('0pt');
    expect(bodyRows[1].style.getPropertyValue('--zuvi-word-row-spacing')).toBe('12pt');
    const serialized = document.createElement('div');
    serialized.innerHTML = instance.getHTML();
    expect(serialized.querySelector('table')!.style.borderSpacing).toBe('0pt');
    expect(serialized.querySelector('table')!.style.paddingBottom).toBe('6pt');
    expect(Array.from(serialized.querySelectorAll('col')).map(column => column.style.width))
      .toEqual(['212px', '172px']);
  });

  it('resets table variables in nested tables while retaining their own column geometry', () => {
    const instance = create({
      type: 'doc',
      content: [{
        type: 'table',
        attrs: { defaultCellMargins: { left: 12 }, cellSpacing: 6 },
        content: [{
          type: 'tableRow',
          content: [{
            type: 'tableCell',
            attrs: { colwidth: [420] },
            content: [
              { type: 'paragraph', content: [{ type: 'text', text: 'Outer' }] },
              {
                type: 'table',
                content: [row('Nested')],
              },
            ],
          }],
        }],
      }],
    });
    const [outer, nested] = instance.view.dom.querySelectorAll('table');
    expect(outer.style.getPropertyValue('--zuvi-word-table-margin-left')).toBe('12pt');
    expect(nested.style.getPropertyValue('--zuvi-word-table-margin-left')).toBe('initial');
    expect(nested.style.getPropertyValue('--zuvi-word-cell-margin-left')).toBe('initial');
    expect(nested.style.getPropertyValue('--zuvi-word-cell-justify')).toBe('initial');
    expect(nested.style.getPropertyValue('--zuvi-word-cell-border-y')).toBe('1px');
    expect(nested.style.width).toBe('360px');
    const nestedNode = instance.state.doc.firstChild!.firstChild!.firstChild!.child(1);
    expect(nestedNode.attrs.defaultCellMargins).toBeNull();
    expect(nestedNode.attrs.cellSpacing).toBeNull();
  });

  it('keeps explicit table zero when serializing and clearing margins', () => {
    const instance = create();
    instance.view.dispatch(instance.state.tr.setNodeMarkup(0, undefined, {
      ...instance.state.doc.firstChild!.attrs,
      defaultCellMargins: null,
      cellSpacing: 0,
    }));
    const html = instance.getHTML();
    expect(html).toContain('data-word-cell-spacing="0"');
    expect(html).not.toContain('data-word-table-margins');
    instance.commands.setContent(html);
    expect(instance.state.doc.firstChild!.attrs.defaultCellMargins).toBeNull();
    expect(instance.state.doc.firstChild!.attrs.cellSpacing).toBe(0);
    expect(editableTable(instance).style.getPropertyValue('--zuvi-word-cell-border-y')).toBe('1px');
  });

  it('starts mixed observations after attachment and cancels pending work on destruction', () => {
    const frames = new Map<number, FrameRequestCallback>(); let next = 0;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      const id = ++next; frames.set(id, callback); return id;
    });
    const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(id => { frames.delete(id); });
    const stop = vi.fn();
    const observe = vi.spyOn(mixedLayout, 'wordObserveMixedTableRows').mockReturnValue(stop);
    const fill = vi.spyOn(mixedLayout, 'wordFillMixedTableRows').mockImplementation(() => {});
    const instance = create({
      type: 'doc', content: [{ type: 'table', attrs: { cellSpacing: 6 },
        content: [row('Zero', 0), row('Wide', 12)] }, { type: 'paragraph' }],
    });
    expect(observe).not.toHaveBeenCalled();
    document.body.append(instance.view.dom);
    const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(0));
    expect(observe).toHaveBeenCalledOnce(); expect(fill).toHaveBeenCalledOnce();
    const first = instance.state.doc.firstChild!.firstChild!;
    instance.view.dispatch(instance.state.tr.setNodeMarkup(1, undefined, { ...first.attrs, cellSpacing: 2 }));
    expect(frames.size).toBe(1);
    instance.destroy();
    expect(stop).toHaveBeenCalledOnce(); expect(cancel).toHaveBeenCalled();
    expect(frames.size).toBe(0); expect(observe).toHaveBeenCalledOnce();
  });
});

describe('Word cell view-only content layout', () => {
  function cellEditor(header = false) {
    vi.spyOn(mixedLayout, 'wordObserveMixedTableRows').mockReturnValue(() => {});
    vi.spyOn(mixedLayout, 'wordFillMixedTableRows').mockImplementation(() => {});
    editor = new Editor({
      extensions: [StarterKit, TextAlign.configure({ types: ['paragraph'] }),
        TableKit.configure({ table: false, tableCell: false, tableHeader: false }),
        WordTable, WordTableSpacing, WordTableCell, WordTableHeader],
      content: { type: 'doc', content: [{ type: 'table', attrs: { cellSpacing: 6 },
        content: [{ type: 'tableRow', attrs: { cellSpacing: 0 }, content: [{
          type: header ? 'tableHeader' : 'tableCell',
          attrs: { colwidth: [200], backgroundColor: '#336699', cellMargins: { top: 0, bottom: 5 } },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Short', marks: [{ type: 'bold' }] }] }],
        }] }, { type: 'tableRow', attrs: { cellSpacing: 12 }, content: [{ type: 'tableCell',
          attrs: { colwidth: [200] }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Tall' }] }],
        }] }] }, { type: 'paragraph' }] },
    });
    document.body.append(editor.view.dom);
    return editor;
  }

  it('preserves the same wrapper and its fill through paragraph formatting and DOM observation', async () => {
    const instance = cellEditor();
    const cell = instance.view.nodeDOM(2) as HTMLTableCellElement;
    const wrapper = cell.querySelector<HTMLElement>('[data-word-cell-content]')!;
    const before = instance.getJSON();
    wrapper.style.minHeight = '226px';
    await new Promise(resolve => setTimeout(resolve, 25));
    expect(instance.getJSON()).toEqual(before);
    expect(cell.querySelector('[data-word-cell-content]')).toBe(wrapper);
    expect(wrapper.style.minHeight).toBe('226px');
    const paragraph = instance.state.doc.nodeAt(3)!;
    instance.view.dispatch(instance.state.tr.setNodeMarkup(3, undefined,
      { ...paragraph.attrs, textAlign: 'right' }));
    await new Promise(resolve => setTimeout(resolve, 25));
    expect(cell.querySelector('[data-word-cell-content]')).toBe(wrapper);
    expect(wrapper.style.minHeight).toBe('226px');
    expect(wrapper.querySelector('p')!.style.textAlign).toBe('right');
    expect(instance.getHTML()).not.toContain('min-height:226');
  });

  it.each([false, true])('updates cell schema attrs without deleting layout decorations (header=%s)', async header => {
    const instance = cellEditor(header);
    instance.registerPlugin(new Plugin({ props: {
      decorations: state => DecorationSet.create(state.doc, [Decoration.node(2,
        2 + state.doc.nodeAt(2)!.nodeSize, {
          style: '--zuvi-word-cell-height:71.75pt;--zuvi-word-cell-gap-left:6pt',
          'data-word-fixed-cell-height': '71.75',
          class: 'selectedCell column-resize-dragging',
        })]),
    } }));
    const cell = instance.view.nodeDOM(2) as HTMLTableCellElement;
    const wrapper = cell.querySelector<HTMLElement>('[data-word-cell-content]')!;
    wrapper.style.minHeight = '226px';
    const before = instance.state.doc.nodeAt(2)!;
    const transaction = instance.state.tr.setNodeMarkup(2, undefined, {
      ...before.attrs, colwidth: [240], backgroundColor: null, verticalAlign: 'center',
      cellMargins: { top: 0, left: 5.25 },
    });
    const nextCellPosition = 2 + instance.state.doc.firstChild!.firstChild!.nodeSize;
    transaction.setNodeMarkup(nextCellPosition, undefined,
      { ...instance.state.doc.nodeAt(nextCellPosition)!.attrs, colwidth: [240] });
    instance.view.dispatch(transaction);
    await new Promise(resolve => setTimeout(resolve, 25));
    const current = instance.view.nodeDOM(2) as HTMLTableCellElement;
    expect(current).toBe(cell);
    expect(current.querySelector('[data-word-cell-content]')).toBe(wrapper);
    expect(wrapper.style.minHeight).toBe('226px');
    expect(current.getAttribute('colwidth')).toBe('240');
    expect(current.hasAttribute('data-word-cell-background')).toBe(false);
    expect(current.style.backgroundColor).toBe('');
    expect(current.style.verticalAlign).toBe('middle');
    expect(current.style.getPropertyValue('--zuvi-word-cell-margin-top')).toBe('0pt');
    expect(current.style.getPropertyValue('--zuvi-word-cell-margin-left')).toBe('5.25pt');
    expect(current.style.getPropertyValue('--zuvi-word-cell-height')).toBe('71.75pt');
    expect(current.style.getPropertyValue('--zuvi-word-cell-gap-left')).toBe('6pt');
    expect(current.getAttribute('data-word-fixed-cell-height')).toBe('71.75');
    expect(current.classList.contains('selectedCell')).toBe(true);
    expect(current.classList.contains('column-resize-dragging')).toBe(true);
    expect(wrapper.querySelector('strong')?.textContent).toBe('Short');
    instance.commands.setContent(instance.getHTML());
    expect(instance.state.doc.nodeAt(2)!.attrs).toMatchObject({ verticalAlign: 'center',
      colwidth: [240], cellMargins: { top: 0, left: 5.25 } });
  });

  it('ignores only direct wrapper style and still forwards text, children and selections', () => {
    const instance = cellEditor(); const node = instance.state.doc.nodeAt(2)!;
    const view = wordTableCellNodeView(node, 'td', current => ({ colspan: current.attrs.colspan }));
    const wrapper = view.contentDOM!;
    const mutation = (type: MutationRecordType, target: Node, attributeName: string | null = null): MutationRecord => ({
      type, target, attributeName, attributeNamespace: null, oldValue: null,
      addedNodes: document.createDocumentFragment().childNodes,
      removedNodes: document.createDocumentFragment().childNodes,
      nextSibling: null, previousSibling: null,
    });
    expect(view.ignoreMutation!(mutation('attributes', wrapper, 'style'))).toBe(true);
    expect(view.ignoreMutation!(mutation('attributes', view.dom, 'style'))).toBe(false);
    expect(view.ignoreMutation!(mutation('childList', wrapper))).toBe(false);
    const text = document.createTextNode('text'); wrapper.append(text);
    expect(view.ignoreMutation!(mutation('characterData', text))).toBe(false);
    expect(view.ignoreMutation!({ type: 'selection', target: wrapper })).toBe(false);
    const header = instance.schema.nodes.tableHeader.create(node.attrs, node.content);
    expect(view.update!(header, [], DecorationSet.empty)).toBe(false);
    view.destroy?.();
    expect(view.update!(node, [], DecorationSet.empty)).toBe(false);
    expect(view.contentDOM).toBe(wrapper);
  });
});
