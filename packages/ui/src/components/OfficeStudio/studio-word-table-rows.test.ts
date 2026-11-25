import { describe, expect, it, vi } from 'vitest';
import { Editor, type JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { undoDepth } from '@tiptap/pm/history';
import { CellSelection } from '@tiptap/pm/tables';
import { TableKit } from '@tiptap/extension-table';
import { wordMergedRowHeight, wordRowCss, wordRowProperties } from './studio-word-table-rows';
import {
  WordTableRowProperties,
  wordDistributeRows,
  wordResizeRow,
  wordDistributeColumns,
  wordSelectedRows,
  wordSetRowProperties,
} from './studio-word-table-row-extension';

describe('Word table row properties', () => {
  it('cancels active drag on document replacement and loss of edit permission', () => {
    const editor = new Editor({
      extensions: [StarterKit, TableKit, WordTableRowProperties],
      content: {
        type: 'doc',
        content: [
          {
            type: 'table',
            content: [
              {
                type: 'tableRow',
                attrs: { rowHeight: 24, rowHeightRule: 'exact' },
                content: [
                  {
                    type: 'tableCell',
                    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'row' }] }],
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    try {
      editor.commands.setTextSelection(4);
      const row = editor.view.nodeDOM(1) as HTMLElement;
      row.dataset.wordNaturalRowHeight = '32';
      row.getBoundingClientRect = () =>
        ({ top: 0, bottom: 128, height: 128, left: 0, width: 300 }) as DOMRect;
      const start = () =>
        row.dispatchEvent(
          new MouseEvent('pointerdown', { bubbles: true, button: 0, clientY: 127 })
        );
      start();
      expect(document.querySelector('[data-word-row-resize-guide]')?.textContent).toBe('24.0 磅');
      editor.view.dispatch(editor.state.tr.insertText('changed', 4));
      expect(document.querySelector('[data-word-row-resize-guide]')).toBeNull();
      document.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientY: 63 }));
      expect(editor.state.doc.nodeAt(1)!.attrs.rowHeight).toBe(24);
      start();
      expect(document.querySelector('[data-word-row-resize-guide]')).not.toBeNull();
      editor.view.dom.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
      expect(document.querySelector('[data-word-row-resize-guide]')).toBeNull();
      document.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientY: 63 }));
      expect(editor.state.doc.nodeAt(1)!.attrs.rowHeight).toBe(24);
      editor.view.dom.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
      vi.spyOn(editor.view, 'composing', 'get').mockReturnValue(false);
      start();
      editor.setEditable(false);
      expect(document.querySelector('[data-word-row-resize-guide]')).toBeNull();
      document.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientY: 63 }));
      expect(editor.state.doc.nodeAt(1)!.attrs.rowHeight).toBe(24);
    } finally {
      editor.destroy();
    }
  });

  it('commits resized row height once while retaining exact rule, split policy and text', () => {
    const editor = new Editor({
      extensions: [StarterKit, TableKit, WordTableRowProperties],
      content: {
        type: 'doc',
        content: [
          {
            type: 'table',
            content: [
              {
                type: 'tableRow',
                attrs: { rowHeight: 24, rowHeightRule: 'exact', allowSplit: false },
                content: [
                  {
                    type: 'tableCell',
                    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Retained' }] }],
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    try {
      editor.commands.setTextSelection(4);
      const original = JSON.stringify(editor.getJSON());
      expect(wordResizeRow(editor, 1, 48)).toBe(true);
      expect(wordRowProperties(editor.state.doc.nodeAt(1)!.attrs)).toEqual({
        rowHeight: 48,
        rowHeightRule: 'exact',
        allowSplit: false,
      });
      expect(editor.commands.undo()).toBe(true);
      expect(JSON.stringify(editor.getJSON())).toBe(original);
      expect(editor.commands.redo()).toBe(true);
      expect(editor.getText()).toContain('Retained');
      const saved = JSON.stringify(editor.getJSON());
      expect(() => wordResizeRow(editor, 1, NaN)).toThrow();
      expect(JSON.stringify(editor.getJSON())).toBe(saved);
      editor.setEditable(false);
      expect(wordResizeRow(editor, 1, 36)).toBe(false);
    } finally {
      editor.destroy();
    }
  });

  it('rejects distribution during editor composition without changing history or document', () => {
    const editor = new Editor({
      extensions: [StarterKit, TableKit, WordTableRowProperties],
      content: {
        type: 'doc',
        content: [
          {
            type: 'table',
            content: [0, 1].map(() => ({
              type: 'tableRow',
              content: [80, 160].map((width) => ({
                type: 'tableCell',
                attrs: { colwidth: [width] },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'cell' }] }],
              })),
            })),
          },
        ],
      },
    });
    try {
      editor.commands.setTextSelection({ from: 4, to: editor.state.doc.content.size - 4 });
      const before = JSON.stringify(editor.getJSON());
      const selection = editor.state.selection;
      const history = undoDepth(editor.state);
      const composing = vi.spyOn(editor.view, 'composing', 'get').mockReturnValue(true);
      expect(wordDistributeRows(editor)).toBe(false);
      expect(wordDistributeColumns(editor)).toBe(false);
      expect(JSON.stringify(editor.getJSON())).toBe(before);
      expect(editor.state.selection.eq(selection)).toBe(true);
      composing.mockRestore();
      expect(undoDepth(editor.state)).toBe(history);
    } finally {
      editor.destroy();
    }
  });

  it('updates only selected width slots in a cell spanning across the selection boundary', () => {
    const paragraph = { type: 'paragraph', content: [{ type: 'text', text: 'cell' }] };
    const editor = new Editor({
      extensions: [StarterKit, TableKit, WordTableRowProperties],
      content: {
        type: 'doc',
        content: [
          {
            type: 'table',
            content: [
              {
                type: 'tableRow',
                content: [
                  { type: 'tableCell', attrs: { colwidth: [80] }, content: [paragraph] },
                  {
                    type: 'tableCell',
                    attrs: { colspan: 2, colwidth: [160, 300] },
                    content: [paragraph],
                  },
                ],
              },
              {
                type: 'tableRow',
                content: [80, 160, 300].map((width) => ({
                  type: 'tableCell',
                  attrs: { colwidth: [width] },
                  content: [paragraph],
                })),
              },
            ],
          },
        ],
      },
    });
    try {
      const table = editor.state.doc.firstChild!;
      const first = 2 + table.firstChild!.nodeSize;
      const second = first + table.child(1).firstChild!.nodeSize;
      editor.view.dispatch(
        editor.state.tr.setSelection(CellSelection.create(editor.state.doc, first, second))
      );
      expect(wordDistributeColumns(editor)).toBe(true);
      const rows = (editor.getJSON() as JSONContent).content![0].content!;
      expect(rows[0].content![0].attrs!.colwidth).toEqual([120]);
      expect(rows[0].content![1].attrs!.colwidth).toEqual([120, 300]);
      expect(rows[0].content![1].attrs!.colspan).toBe(2);
      expect(rows[1].content!.map((cell) => cell.attrs!.colwidth)).toEqual([[120], [120], [300]]);
    } finally {
      editor.destroy();
    }
  });

  it('equalizes only cell-selected columns and retains the remaining native widths', () => {
    const editor = new Editor({
      extensions: [StarterKit, TableKit, WordTableRowProperties],
      content: {
        type: 'doc',
        content: [
          {
            type: 'table',
            content: [0, 1].map(() => ({
              type: 'tableRow',
              content: [80, 160, 300].map((width) => ({
                type: 'tableCell',
                attrs: { colwidth: [width] },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'cell' }] }],
              })),
            })),
          },
        ],
      },
    });
    try {
      const table = editor.state.doc.firstChild!;
      const first = 2;
      const second = first + table.firstChild!.firstChild!.nodeSize;
      editor.view.dispatch(
        editor.state.tr.setSelection(CellSelection.create(editor.state.doc, first, second))
      );
      const original = JSON.stringify(editor.getJSON());
      expect(wordDistributeColumns(editor)).toBe(true);
      for (const row of (editor.getJSON() as JSONContent).content![0].content!)
        expect(row.content!.map((cell) => cell.attrs!.colwidth)).toEqual([[120], [120], [300]]);
      expect(editor.commands.undo()).toBe(true);
      expect(JSON.stringify(editor.getJSON())).toBe(original);
      expect(editor.commands.redo()).toBe(true);
      editor.view.dispatch(
        editor.state.tr.setSelection(CellSelection.create(editor.state.doc, first))
      );
      const saved = JSON.stringify(editor.getJSON());
      expect(wordDistributeColumns(editor)).toBe(false);
      expect(JSON.stringify(editor.getJSON())).toBe(saved);
    } finally {
      editor.destroy();
    }
  });

  it('isolates nested column distribution and retains vertical merges with stable repeat commands', () => {
    const paragraph = (text: string) => ({ type: 'paragraph', content: [{ type: 'text', text }] });
    const inner = {
      type: 'table',
      content: [
        {
          type: 'tableRow',
          content: [
            {
              type: 'tableCell',
              attrs: { rowspan: 2, colwidth: [80] },
              content: [paragraph('merged')],
            },
            { type: 'tableCell', attrs: { colwidth: [160] }, content: [paragraph('right')] },
          ],
        },
        {
          type: 'tableRow',
          content: [
            { type: 'tableCell', attrs: { colwidth: [160] }, content: [paragraph('bottom')] },
          ],
        },
      ],
    };
    const editor = new Editor({
      extensions: [StarterKit, TableKit, WordTableRowProperties],
      content: {
        type: 'doc',
        content: [
          {
            type: 'table',
            content: [
              {
                type: 'tableRow',
                content: [
                  {
                    type: 'tableCell',
                    attrs: { colwidth: [400] },
                    content: [paragraph('outer'), inner],
                  },
                  {
                    type: 'tableCell',
                    attrs: { colwidth: [200] },
                    content: [paragraph('outside')],
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    try {
      let caret = 0;
      editor.state.doc.descendants((node, position) => {
        if (node.isText && node.text === 'right') caret = position;
      });
      editor.commands.setTextSelection(caret);
      const original = JSON.stringify(editor.getJSON());
      expect(wordDistributeColumns(editor)).toBe(true);
      const outerCells = (editor.getJSON() as JSONContent).content![0].content![0].content!;
      expect(outerCells.map((cell) => cell.attrs!.colwidth)).toEqual([[400], [200]]);
      const rows = outerCells[0].content![1].content!;
      expect(rows[0].content![0].attrs!.rowspan).toBe(2);
      expect(rows[0].content!.map((cell) => cell.attrs!.colwidth)).toEqual([[120], [120]]);
      expect(rows[1].content![0].attrs!.colwidth).toEqual([120]);
      const saved = JSON.stringify(editor.getJSON());
      expect(wordDistributeColumns(editor)).toBe(false);
      expect(JSON.stringify(editor.getJSON())).toBe(saved);
      expect(editor.commands.undo()).toBe(true);
      expect(JSON.stringify(editor.getJSON())).toBe(original);
      expect(editor.commands.redo()).toBe(true);
      expect(JSON.stringify(editor.getJSON())).toBe(saved);
    } finally {
      editor.destroy();
    }
  });

  it('distributes table columns including merged cells in a single transaction', () => {
    const paragraph = { type: 'paragraph', content: [{ type: 'text', text: 'cell' }] };
    const editor = new Editor({
      extensions: [StarterKit, TableKit, WordTableRowProperties],
      content: {
        type: 'doc',
        content: [
          {
            type: 'table',
            content: [
              {
                type: 'tableRow',
                content: [
                  {
                    type: 'tableCell',
                    attrs: { colspan: 2, colwidth: [100, 200] },
                    content: [paragraph],
                  },
                ],
              },
              {
                type: 'tableRow',
                content: [100, 200].map((width) => ({
                  type: 'tableCell',
                  attrs: { colwidth: [width] },
                  content: [paragraph],
                })),
              },
            ],
          },
        ],
      },
    });
    try {
      editor.commands.setTextSelection(4);
      const element = editor.view.nodeDOM(0) as HTMLElement;
      const table = element.matches('table') ? element : element.querySelector('table')!;
      table.getBoundingClientRect = () => ({ width: 300 }) as DOMRect;
      const original = JSON.stringify(editor.getJSON());
      expect(wordDistributeColumns(editor)).toBe(true);
      const rows = (editor.getJSON() as JSONContent).content![0].content!;
      expect(rows[0].content![0].attrs!.colwidth).toEqual([150, 150]);
      expect(rows[1].content!.map((cell) => cell.attrs!.colwidth)).toEqual([[150], [150]]);
      expect(rows[0].content![0].attrs!.colspan).toBe(2);
      expect(editor.commands.undo()).toBe(true);
      expect(JSON.stringify(editor.getJSON())).toBe(original);
      expect(editor.commands.redo()).toBe(true);
      editor.setEditable(false);
      expect(wordDistributeColumns(editor)).toBe(false);
    } finally {
      editor.destroy();
    }
  });

  it('distributes fixed row totals in one transaction and preserves independent split policies', () => {
    const editor = new Editor({
      extensions: [StarterKit, TableKit, WordTableRowProperties],
      content: {
        type: 'doc',
        content: [
          {
            type: 'table',
            content: [24, 48].map((rowHeight, index) => ({
              type: 'tableRow',
              attrs: { rowHeight, rowHeightRule: 'exact', allowSplit: index === 0 },
              content: [
                {
                  type: 'tableCell',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'row' }] }],
                },
              ],
            })),
          },
        ],
      },
    });
    try {
      editor.commands.setTextSelection({ from: 4, to: 14 });
      for (const row of wordSelectedRows(editor)) {
        const element = editor.view.nodeDOM(row.position) as HTMLElement;
        element.getBoundingClientRect = () =>
          ({ height: row.properties.rowHeight! / 0.75 }) as DOMRect;
      }
      const original = JSON.stringify(editor.getJSON());
      expect(wordDistributeRows(editor)).toBe(true);
      expect(wordSelectedRows(editor).map((row) => row.properties.rowHeight)).toEqual([36, 36]);
      expect(wordSelectedRows(editor).map((row) => row.properties.allowSplit)).toEqual([
        true,
        false,
      ]);
      expect(editor.commands.undo()).toBe(true);
      expect(JSON.stringify(editor.getJSON())).toBe(original);
      expect(editor.commands.redo()).toBe(true);
      editor.setEditable(false);
      expect(wordDistributeRows(editor)).toBe(false);
    } finally {
      editor.destroy();
    }
  });

  it('sums only fully fixed merged rows and updates nested cell decorations through history', () => {
    const exact = (rowHeight: number) => ({ rowHeight, rowHeightRule: 'exact' });
    expect(wordMergedRowHeight([exact(24), exact(36)])).toBe(60);
    expect(wordMergedRowHeight([exact(24), { rowHeightRule: 'auto' }])).toBeNull();
    expect(wordMergedRowHeight([])).toBeNull();
    const paragraph = { type: 'paragraph', content: [{ type: 'text', text: 'Retained content' }] };
    const table = {
      type: 'table',
      content: [
        {
          type: 'tableRow',
          attrs: exact(24),
          content: [
            { type: 'tableCell', attrs: { rowspan: 2 }, content: [paragraph] },
            { type: 'tableCell', content: [paragraph] },
          ],
        },
        {
          type: 'tableRow',
          attrs: exact(36),
          content: [{ type: 'tableCell', content: [paragraph] }],
        },
      ],
    };
    const editor = new Editor({
      extensions: [StarterKit, TableKit, WordTableRowProperties],
      content: {
        type: 'doc',
        content: [
          {
            type: 'table',
            content: [
              { type: 'tableRow', content: [{ type: 'tableCell', content: [paragraph, table] }] },
            ],
          },
        ],
      },
    });
    try {
      const cell = () => editor.view.dom.querySelector('[data-word-fixed-cell-height]');
      expect(cell()?.getAttribute('data-word-fixed-cell-height')).toBe('60');
      expect(cell()?.getAttribute('rowspan')).toBe('2');
      let rowPosition = 0;
      editor.state.doc.descendants((node, position) => {
        if (node.type.name === 'tableRow' && node.attrs.rowHeight === 36) rowPosition = position;
      });
      editor.view.dispatch(
        editor.state.tr.setNodeMarkup(rowPosition, undefined, {
          rowHeight: 0,
          rowHeightRule: 'auto',
        })
      );
      expect(cell()).toBeNull();
      expect(editor.commands.undo()).toBe(true);
      expect(cell()?.getAttribute('data-word-fixed-cell-height')).toBe('60');
      expect(editor.commands.redo()).toBe(true);
      expect(cell()).toBeNull();
      expect(editor.getText()).toContain('Retained content');
    } finally {
      editor.destroy();
    }
  });
  it('uses natural row height without persisting pagination gaps and rejects missing measurement', () => {
    const editor = new Editor({
      extensions: [StarterKit, TableKit, WordTableRowProperties],
      content: {
        type: 'doc',
        content: [
          {
            type: 'table',
            content: [0, 1].map(() => ({
              type: 'tableRow',
              content: [
                {
                  type: 'tableCell',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'row' }] }],
                },
              ],
            })),
          },
        ],
      },
    });
    try {
      editor.commands.setTextSelection({ from: 4, to: 14 });
      Object.defineProperty(editor.view.dom, 'offsetWidth', { value: 600, configurable: true });
      editor.view.dom.getBoundingClientRect = () => ({ width: 300 }) as DOMRect;
      const rows = wordSelectedRows(editor);
      rows.forEach((row, index) => {
        const element = editor.view.nodeDOM(row.position) as HTMLElement;
        element.getBoundingClientRect = () => ({ height: index === 0 ? 120 : 40 }) as DOMRect;
        if (index === 0) {
          const gap = document.createElement('span');
          gap.dataset.wordAutoPageGap = '1';
          gap.getBoundingClientRect = () => ({ height: 100 }) as DOMRect;
          element.append(gap);
        }
      });
      expect(wordDistributeRows(editor)).toBe(true);
      expect(wordSelectedRows(editor).map((row) => row.properties)).toEqual([
        { rowHeight: 60, rowHeightRule: 'atLeast', allowSplit: null },
        { rowHeight: 60, rowHeightRule: 'atLeast', allowSplit: null },
      ]);
      editor.commands.undo();
      const element = editor.view.nodeDOM(rows[1].position) as HTMLElement;
      element.getBoundingClientRect = () => ({ height: 0 }) as DOMRect;
      const before = JSON.stringify(editor.getJSON());
      expect(wordDistributeRows(editor)).toBe(false);
      expect(JSON.stringify(editor.getJSON())).toBe(before);
    } finally {
      editor.destroy();
    }
  });
  it('preserves automatic height, explicit split flags and rejects invalid geometry', () => {
    expect(wordRowProperties({ rowHeightRule: 'auto' }).rowHeight).toBe(0);
    expect(() => wordRowProperties({ rowHeightRule: 'exact' })).toThrow('固定行高必须指定高度');
    expect(wordRowCss({ rowHeight: 24, rowHeightRule: 'exact' })).toEqual({
      height: '24pt',
      '--zuvi-word-row-height': '24pt',
    });
    expect(wordRowProperties({ rowHeight: 0, rowHeightRule: 'auto', allowSplit: true })).toEqual({
      rowHeight: 0,
      rowHeightRule: 'auto',
      allowSplit: true,
    });
    expect(wordRowCss({ rowHeight: 25, rowHeightRule: 'atLeast', allowSplit: false })).toEqual({
      height: '25pt',
      breakInside: 'avoid',
    });
    expect(wordRowCss({ rowHeight: 25, rowHeightRule: 'auto' })).toEqual({});
    for (const value of [
      { rowHeight: NaN },
      { rowHeight: -1 },
      { rowHeightRule: 'wrong' },
      { allowSplit: 'false' },
    ])
      expect(() => wordRowProperties(value)).toThrow();
  });
  it('applies a multirow selection in one history transaction and guards invalid or readonly edits', () => {
    const editor = new Editor({
      extensions: [StarterKit, TableKit, WordTableRowProperties],
      content: {
        type: 'doc',
        content: [
          {
            type: 'table',
            content: ['one', 'two'].map((text) => ({
              type: 'tableRow',
              content: [
                {
                  type: 'tableCell',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
                },
              ],
            })),
          },
        ],
      },
    });
    try {
      editor.commands.setTextSelection({ from: 4, to: 14 });
      expect(wordSelectedRows(editor)).toHaveLength(2);
      const original = JSON.stringify(editor.getJSON());
      expect(
        wordSetRowProperties(editor, { rowHeight: 24, rowHeightRule: 'exact', allowSplit: false })
      ).toBe(true);
      expect(
        wordSelectedRows(editor).every(
          (row) => row.properties.rowHeight === 24 && row.properties.allowSplit === false
        )
      ).toBe(true);
      expect(editor.commands.undo()).toBe(true);
      expect(JSON.stringify(editor.getJSON())).toBe(original);
      expect(editor.commands.redo()).toBe(true);
      const saved = JSON.stringify(editor.getJSON());
      expect(() => wordSetRowProperties(editor, { rowHeight: NaN })).toThrow();
      expect(JSON.stringify(editor.getJSON())).toBe(saved);
      editor.setEditable(false);
      expect(wordSetRowProperties(editor, { rowHeight: 30 })).toBe(false);
      expect(JSON.stringify(editor.getJSON())).toBe(saved);
    } finally {
      editor.destroy();
    }
  });
});

it('distributes original pagination row sizes instead of summing independent column gaps', () => {
  const editor = new Editor({
    extensions: [StarterKit, TableKit, WordTableRowProperties],
    content: {
      type: 'doc',
      content: [
        {
          type: 'table',
          content: [0, 1].map(() => ({
            type: 'tableRow',
            attrs: { rowHeightRule: 'auto' },
            content: [
              {
                type: 'tableCell',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'row' }] }],
              },
            ],
          })),
        },
      ],
    },
  });
  try {
    editor.commands.setTextSelection({ from: 4, to: 14 });
    Object.defineProperty(editor.view.dom, 'offsetWidth', { configurable: true, value: 400 });
    editor.view.dom.getBoundingClientRect = () => ({ width: 200 }) as DOMRect;
    wordSelectedRows(editor).forEach((row, index) => {
      const element = editor.view.nodeDOM(row.position) as HTMLElement;
      element.dataset.wordNaturalRowHeight = String(index ? 120 : 80);
      element.getBoundingClientRect = () => ({ height: index ? 600 : 500 }) as DOMRect;
    });
    const original = JSON.stringify(editor.getJSON());
    expect(wordDistributeRows(editor)).toBe(true);
    expect(wordSelectedRows(editor).map((row) => row.properties.rowHeight)).toEqual([90, 90]);
    expect(JSON.stringify(editor.getJSON())).not.toContain('wordNaturalRowHeight');
    expect(editor.commands.undo()).toBe(true);
    expect(JSON.stringify(editor.getJSON())).toBe(original);
    expect(editor.commands.redo()).toBe(true);
    expect(wordSelectedRows(editor).map((row) => row.properties.rowHeight)).toEqual([90, 90]);
  } finally {
    editor.destroy();
  }
});
