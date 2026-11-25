import { Extension, type Editor } from '@tiptap/react';
import { CellSelection, TableMap } from '@tiptap/pm/tables';
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
/** Equalize selected row heights without clipping existing content. */
export function wordDistributeRows(editor: Editor): boolean {
  if (editor.isDestroyed || !editor.isEditable || editor.view.composing) return false;
  const rows = wordSelectedRows(editor);
  if (rows.length < 2) return false;
  const surfaceWidth = editor.view.dom.offsetWidth;
  const scale = surfaceWidth > 0 ? editor.view.dom.getBoundingClientRect().width / surfaceWidth : 1;
  if (!Number.isFinite(scale) || scale <= 0) return false;
  const heights = rows.map((row) => {
    const element = editor.view.nodeDOM(row.position);
    if (!(element instanceof editor.view.dom.ownerDocument.defaultView!.HTMLElement)) return NaN;
    // Decorative page gaps are view-only and must never become native row height.
    const gaps = Array.from(
      element.querySelectorAll<HTMLElement>('[data-word-auto-page-gap]')
    ).reduce((sum, gap) => sum + gap.getBoundingClientRect().height, 0);
    return ((element.getBoundingClientRect().height - gaps) / scale) * 0.75;
  });
  if (heights.some((height) => !Number.isFinite(height) || height <= 0 || height > 2000))
    return false;
  const allFixed = rows.every((row) => row.properties.rowHeightRule === 'exact');
  const height = allFixed
    ? rows.reduce((sum, row) => sum + row.properties.rowHeight!, 0) / rows.length
    : Math.max(...heights);
  return wordSetRowProperties(editor, {
    rowHeight: Math.round(height * 100) / 100,
    rowHeightRule: allFixed ? 'exact' : 'atLeast',
  });
}
/** Equalize selected columns, or the current table columns for a text caret. */
export function wordDistributeColumns(editor: Editor): boolean {
  if (editor.isDestroyed || !editor.isEditable || editor.view.composing) return false;
  const selection = editor.state.selection;
  let depth = selection.$from.depth;
  while (depth > 0 && selection.$from.node(depth).type.name !== 'table') depth--;
  if (!depth || selection.to > selection.$from.end(depth)) return false;
  const table = selection.$from.node(depth);
  const position = selection.$from.before(depth);
  const map = TableMap.get(table);
  if (map.width < 2 || map.problems?.length) return false;
  const element = editor.view.nodeDOM(position) as HTMLElement | null;
  const surface = element?.matches('table') ? element : element?.querySelector('table');
  const surfaceWidth = editor.view.dom.offsetWidth;
  const scale = surfaceWidth > 0 ? editor.view.dom.getBoundingClientRect().width / surfaceWidth : 1;
  if (!Number.isFinite(scale) || scale <= 0) return false;
  const nativeWidths: (number | undefined)[] = Array.from({ length: map.width });
  for (const offset of new Set(map.map)) {
    const cell = table.nodeAt(offset)!;
    const rectangle = map.findCell(offset);
    const widths = cell.attrs.colwidth as number[] | null;
    if (widths?.length === rectangle.right - rectangle.left)
      widths.forEach((width, index) => {
        if (Number.isFinite(width) && width > 0) nativeWidths[rectangle.left + index] = width;
      });
  }
  const complete = nativeWidths.every((width) => width !== undefined);
  const width = complete
    ? nativeWidths.reduce<number>((sum, width) => sum + width!, 0)
    : surface
      ? surface.getBoundingClientRect().width / scale
      : undefined;
  if (!width || !Number.isFinite(width) || width <= 0) return false;
  const rectangle =
    selection instanceof CellSelection
      ? map.rectBetween(
          selection.$anchorCell.pos - position - 1,
          selection.$headCell.pos - position - 1
        )
      : { left: 0, right: map.width };
  if (rectangle.right - rectangle.left < 2) return false;
  // Partial distribution requires known widths for the untouched columns.
  if (!complete && (rectangle.left !== 0 || rectangle.right !== map.width)) return false;
  const selectedWidth = complete
    ? nativeWidths
        .slice(rectangle.left, rectangle.right)
        .reduce<number>((sum, value) => sum + value!, 0)
    : width;
  const columnWidth = Math.round((selectedWidth / (rectangle.right - rectangle.left)) * 100) / 100;
  if (columnWidth < 25 || columnWidth > 20000) return false;
  const transaction = closeHistory(editor.state.tr);
  // TableMap repeats positions for spans. Each cell must be updated exactly once.
  for (const offset of new Set(map.map)) {
    const cell = table.nodeAt(offset);
    if (!cell) return false;
    const cellRectangle = map.findCell(offset);
    if (cellRectangle.right <= rectangle.left || cellRectangle.left >= rectangle.right) continue;
    const colwidth = Array.from({ length: Number(cell.attrs.colspan) || 1 }, (_, index) => {
      const column = cellRectangle.left + index;
      return column >= rectangle.left && column < rectangle.right
        ? columnWidth
        : nativeWidths[column]!;
    });
    if (JSON.stringify(cell.attrs.colwidth) !== JSON.stringify(colwidth))
      transaction.setNodeMarkup(position + 1 + offset, undefined, { ...cell.attrs, colwidth });
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
