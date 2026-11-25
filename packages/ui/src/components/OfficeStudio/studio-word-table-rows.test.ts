import { describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import { wordMergedRowHeight, wordRowCss, wordRowProperties } from './studio-word-table-rows';
import {
  WordTableRowProperties,
  wordSelectedRows,
  wordSetRowProperties,
} from './studio-word-table-row-extension';

describe('Word table row properties', () => {
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
