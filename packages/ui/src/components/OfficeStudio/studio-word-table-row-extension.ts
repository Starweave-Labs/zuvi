import { Extension, type Editor } from '@tiptap/react';
import { closeHistory } from '@tiptap/pm/history';
import {
  wordRowProperties,
  wordRowCss,
  wordMergedRowHeight,
  type WordRowProperties,
} from './studio-word-table-rows';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

const fixedCellKey = new PluginKey<DecorationSet>('studioWordFixedCellHeights');
function fixedCells(document: ProseMirrorNode) {
  const decorations: Decoration[] = [];
  document.descendants((table, tablePosition) => {
    if (table.type.name !== 'table') return;
    table.forEach((row, rowOffset, rowIndex) =>
      row.forEach((cell, cellOffset) => {
        const span = Number(cell.attrs.rowspan) || 1;
        if (!Number.isInteger(span) || span <= 1 || rowIndex + span > table.childCount) return;
        const height = wordMergedRowHeight(
          Array.from({ length: span }, (_, index) => table.child(rowIndex + index).attrs)
        );
        if (height === null) return;
        const position = tablePosition + 2 + rowOffset + cellOffset;
        decorations.push(
          Decoration.node(position, position + cell.nodeSize, {
            'data-word-fixed-cell-height': String(height),
            style: `--zuvi-word-cell-height:${height}pt`,
          })
        );
      })
    );
  });
  return DecorationSet.create(document, decorations);
}

export function wordSelectedRows(editor: Editor) {
  const rows: { position: number; properties: WordRowProperties }[] = [];
  const selection = editor.state.selection;
  let tableDepth = selection.$from.depth;
  while (tableDepth > 0 && selection.$from.node(tableDepth).type.name !== 'table') tableDepth--;
  if (!tableDepth || selection.to > selection.$from.end(tableDepth)) return rows;
  const tablePosition = selection.$from.before(tableDepth);
  editor.state.doc.nodesBetween(
    editor.state.selection.from,
    Math.min(
      editor.state.doc.content.size,
      Math.max(editor.state.selection.to, editor.state.selection.from + 1)
    ),
    (node, position) => {
      if (node.type.name === 'tableRow') {
        const resolved = editor.state.doc.resolve(position);
        if (
          resolved.parent.type.name === 'table' &&
          resolved.before(resolved.depth) === tablePosition
        )
          rows.push({ position, properties: wordRowProperties(node.attrs) });
      }
    }
  );
  return rows;
}
export function wordSetRowProperties(editor: Editor, patch: Partial<WordRowProperties>): boolean {
  if (editor.isDestroyed || !editor.isEditable || editor.view.composing) return false;
  const rows = wordSelectedRows(editor);
  if (!rows.length) return false;
  const updates = rows.map((row) => ({
    ...row,
    properties: wordRowProperties({ ...row.properties, ...patch }),
  }));
  const transaction = closeHistory(editor.state.tr);
  for (const row of updates) {
    const node = editor.state.doc.nodeAt(row.position)!;
    if (JSON.stringify(wordRowProperties(node.attrs)) !== JSON.stringify(row.properties))
      transaction.setNodeMarkup(row.position, undefined, { ...node.attrs, ...row.properties });
  }
  if (!transaction.docChanged) return false;
  editor.view.dispatch(transaction);
  return true;
}
export const WordTableRowProperties = Extension.create({
  name: 'studioWordTableRowProperties',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: fixedCellKey,
        state: {
          init: (_config, state) => fixedCells(state.doc),
          apply: (transaction, previous) =>
            transaction.docChanged ? fixedCells(transaction.doc) : previous,
        },
        props: { decorations: (state) => fixedCellKey.getState(state) ?? DecorationSet.empty },
      }),
    ];
  },
  addGlobalAttributes() {
    return [
      {
        types: ['tableRow'],
        attributes: {
          rowHeight: {
            default: null,
            parseHTML: (element) =>
              element.hasAttribute('data-word-row-height')
                ? Number(element.getAttribute('data-word-row-height'))
                : null,
            renderHTML: (attrs) => {
              const properties = wordRowProperties(attrs);
              const styles = wordRowCss(properties);
              return {
                ...(properties.rowHeight !== null
                  ? { 'data-word-row-height': String(properties.rowHeight) }
                  : {}),
                ...(Object.keys(styles).length
                  ? {
                      style: Object.entries(styles)
                        .map(
                          ([key, value]) =>
                            `${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}:${value}`
                        )
                        .join(';'),
                    }
                  : {}),
              };
            },
          },
          rowHeightRule: {
            default: 'atLeast',
            parseHTML: (element) => element.getAttribute('data-word-row-height-rule') ?? 'atLeast',
            renderHTML: (attrs) => ({
              'data-word-row-height-rule': wordRowProperties(attrs).rowHeightRule,
            }),
          },
          allowSplit: {
            default: null,
            parseHTML: (element) =>
              element.hasAttribute('data-word-row-allow-split')
                ? element.getAttribute('data-word-row-allow-split') === 'true'
                : null,
            renderHTML: (attrs) =>
              attrs.allowSplit === null
                ? {}
                : { 'data-word-row-allow-split': String(wordRowProperties(attrs).allowSplit) },
          },
        },
      },
    ];
  },
});
