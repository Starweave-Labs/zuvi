import { Extension, type Editor } from '@tiptap/react';
import { CellSelection, TableMap } from '@tiptap/pm/tables';
import { closeHistory } from '@tiptap/pm/history';
import { wordRowProperties, wordRowCss, type WordRowProperties } from './studio-word-table-rows';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { wordTableHeightBudgets, wordTableCellColumns } from './studio-word-table-layout';
import type { StudioRichNode } from './studio-types';
import { wordEffectiveRowSpacing, wordTableCellGapCss } from './studio-word-table-properties';

function rowHeightInPoints(element: HTMLElement, scale: number) {
  const natural = Number(element.getAttribute('data-word-natural-row-height'));
  if (Number.isFinite(natural) && natural > 0) return natural * 0.75;
  const gaps = Array.from(
    element.querySelectorAll<HTMLElement>('[data-word-auto-page-gap]')
  ).reduce((sum, gap) => sum + gap.getBoundingClientRect().height, 0);
  return ((element.getBoundingClientRect().height - gaps) / scale) * 0.75;
}

const fixedCellKey = new PluginKey<DecorationSet>('studioWordFixedCellHeights');
function fixedCells(document: ProseMirrorNode) {
  const decorations: Decoration[] = [];
  document.descendants((table, tablePosition) => {
    if (table.type.name !== 'table') return;
    const geometry = wordTableHeightBudgets(table.toJSON() as StudioRichNode);
    const columns = wordTableCellColumns(table.toJSON() as StudioRichNode);
    table.forEach((row, rowOffset, rowIndex) => {
      const budget = geometry.rows[rowIndex];
      const rowPosition = tablePosition + 1 + rowOffset;
      if (budget)
        decorations.push(
          Decoration.node(rowPosition, rowPosition + row.nodeSize, {
            'data-word-rendered-row-height': String(budget.outerHeight),
            style: `--zuvi-word-row-render-height:${budget.outerHeight}pt`,
          })
        );
      row.forEach((cell, cellOffset, cellIndex) => {
        const height = geometry.cells[rowIndex][cellIndex]?.outerHeight;
        const span = Math.max(1, Number(cell.attrs.rowspan) || 1);
        const end = Math.min(table.childCount - 1, rowIndex + span - 1);
        const endSpacing = wordEffectiveRowSpacing(table.attrs, table.child(end).attrs);
        const column = columns.cells[rowIndex][cellIndex];
        const gaps = wordTableCellGapCss(
          wordEffectiveRowSpacing(table.attrs, row.attrs),
          column.first,
          column.last,
          endSpacing
        );
        const rawHeight =
          height === undefined
            ? null
            : Array.from({ length: span }, (_, index) =>
                Number(table.child(rowIndex + index).attrs.rowHeight)
              ).reduce((sum, value) => sum + value, 0);
        const position = tablePosition + 2 + rowOffset + cellOffset;
        decorations.push(
          Decoration.node(position, position + cell.nodeSize, {
            ...(height === undefined
              ? {}
              : {
                  'data-word-rendered-cell-height': String(height),
                  ...(span > 1 ? { 'data-word-fixed-cell-height': String(rawHeight) } : {}),
                }),
            style: `${Object.entries(gaps)
              .map(([key, value]) => `${key}:${value}`)
              .join(
                ';'
              )};--zuvi-word-cell-end-spacing:${endSpacing}pt${height === undefined ? '' : `;--zuvi-word-cell-height:${height}pt`}`,
          })
        );
      });
    });
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
    // The pagination model supplies the original size for independently split columns.
    return rowHeightInPoints(element, scale);
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
export function wordResizeRow(editor: Editor, position: number, height: number): boolean {
  if (editor.isDestroyed || !editor.isEditable || editor.view.composing) return false;
  const node = editor.state.doc.nodeAt(position);
  if (node?.type.name !== 'tableRow') return false;
  const old = wordRowProperties(node.attrs);
  const properties = wordRowProperties({
    ...old,
    rowHeight: height,
    rowHeightRule: old.rowHeightRule === 'exact' ? 'exact' : 'atLeast',
  });
  if (JSON.stringify(old) === JSON.stringify(properties)) return false;
  editor.view.dispatch(
    closeHistory(editor.state.tr).setNodeMarkup(position, undefined, {
      ...node.attrs,
      ...properties,
    })
  );
  return true;
}

export const WordTableRowProperties = Extension.create({
  name: 'studioWordTableRowProperties',
  addProseMirrorPlugins() {
    const editor = this.editor;
    return [
      new Plugin({
        key: fixedCellKey,
        state: {
          init: (_config, state) => fixedCells(state.doc),
          apply: (transaction, previous) =>
            transaction.docChanged ? fixedCells(transaction.doc) : previous,
        },
        props: { decorations: (state) => fixedCellKey.getState(state) ?? DecorationSet.empty },
        view: (view) => {
          const owner = view.dom.ownerDocument;
          const win = owner.defaultView!;
          let drag: {
            position: number;
            document: ProseMirrorNode;
            pointer: number;
            startY: number;
            startBottom: number;
            height: number;
            scale: number;
            value: number;
            guide: HTMLElement;
          } | null = null;
          const cancel = () => {
            drag?.guide.remove();
            drag = null;
            view.dom.removeAttribute('data-word-row-resizing');
          };
          const targetRow = (event: PointerEvent) => {
            const target = event.target;
            if (!(target instanceof win.HTMLElement)) return null;
            const row = target.closest<HTMLElement>('tr:not([data-word-auto-page-row])');
            if (!row || !view.dom.contains(row) || row.closest('[data-word-repeated-header]'))
              return null;
            const rect = row.getBoundingClientRect();
            return Math.abs(event.clientY - rect.bottom) <= 5 ? row : null;
          };
          const down = (event: PointerEvent) => {
            if (event.button !== 0 || drag || !view.editable || view.composing) return;
            const row = targetRow(event);
            if (!row) return;
            const position = view.posAtDOM(row, 0) - 1;
            const node = view.state.doc.nodeAt(position);
            if (node?.type.name !== 'tableRow') return;
            const scale =
              view.dom.offsetWidth > 0
                ? view.dom.getBoundingClientRect().width / view.dom.offsetWidth
                : 1;
            if (!Number.isFinite(scale) || scale <= 0) return;
            if (!Number.isFinite(scale) || scale <= 0) return;
            const rect = row.getBoundingClientRect();
            const properties = wordRowProperties(node.attrs);
            // The visible box includes margins and borders; an exact row already owns its native height.
            const height =
              properties.rowHeightRule === 'exact' && properties.rowHeight !== null
                ? properties.rowHeight
                : rowHeightInPoints(row, scale);
            if (!Number.isFinite(height) || height < 0 || height > 2000) return;
            const guide = owner.createElement('div');
            guide.dataset.wordRowResizeGuide = '';
            guide.setAttribute('role', 'status');
            guide.setAttribute('aria-live', 'polite');
            guide.style.cssText = `position:fixed;pointer-events:none;z-index:10000;border-top:2px solid var(--zuvi-color-primary,#1677ff);left:${rect.left}px;top:${rect.bottom}px;width:${rect.width}px;font:12px sans-serif;color:var(--zuvi-color-primary,#1677ff);`;
            guide.textContent = `${height.toFixed(1)} 磅`;
            owner.body.append(guide);
            drag = {
              position,
              document: view.state.doc,
              pointer: event.pointerId,
              startY: event.clientY,
              startBottom: rect.bottom,
              height,
              scale,
              value: height,
              guide,
            };
            view.dom.dataset.wordRowResizing = 'true';
            event.preventDefault();
            event.stopPropagation();
          };
          const move = (event: PointerEvent) => {
            if (!drag || event.pointerId !== drag.pointer) return;
            if (!view.editable || view.composing || view.state.doc !== drag.document) {
              cancel();
              return;
            }
            drag.value =
              Math.round(
                Math.max(
                  0,
                  Math.min(2000, drag.height + ((event.clientY - drag.startY) / drag.scale) * 0.75)
                ) * 2
              ) / 2;
            drag.guide.style.top = `${drag.startBottom + ((drag.value - drag.height) / 0.75) * drag.scale}px`;
            drag.guide.textContent = `${drag.value.toFixed(1)} 磅`;
            event.preventDefault();
          };
          const up = (event: PointerEvent) => {
            if (!drag || event.pointerId !== drag.pointer) return;
            // Pointerup may arrive at a new coordinate without a preceding move.
            move(event);
            if (!drag) return;
            const current = drag;
            cancel();
            if (Math.abs(event.clientY - current.startY) < 2 || view.state.doc !== current.document)
              return;
            wordResizeRow(editor, current.position, current.value);
          };
          const keydown = (event: KeyboardEvent) => {
            if (drag && event.key === 'Escape') {
              cancel();
              event.preventDefault();
              event.stopPropagation();
            }
          };
          const pointerCancel = (event: PointerEvent) => {
            if (drag?.pointer === event.pointerId) cancel();
          };
          view.dom.addEventListener('pointerdown', down, true);
          view.dom.addEventListener('compositionstart', cancel, true);
          owner.addEventListener('pointermove', move);
          owner.addEventListener('pointerup', up);
          owner.addEventListener('pointercancel', pointerCancel);
          owner.addEventListener('keydown', keydown, true);
          win.addEventListener('blur', cancel);
          owner.addEventListener('scroll', cancel, true);
          win.addEventListener('resize', cancel);
          return {
            update: () => {
              if (drag && (!view.editable || view.state.doc !== drag.document)) cancel();
            },
            destroy: () => {
              cancel();
              view.dom.removeEventListener('pointerdown', down, true);
              view.dom.removeEventListener('compositionstart', cancel, true);
              owner.removeEventListener('pointermove', move);
              owner.removeEventListener('pointerup', up);
              owner.removeEventListener('pointercancel', pointerCancel);
              owner.removeEventListener('keydown', keydown, true);
              win.removeEventListener('blur', cancel);
              owner.removeEventListener('scroll', cancel, true);
              win.removeEventListener('resize', cancel);
            },
          };
        },
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
