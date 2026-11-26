import { Plugin, type EditorState } from '@tiptap/pm/state';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import type { EditorView } from '@tiptap/pm/view';
import { closeHistory } from '@tiptap/pm/history';
import { columnResizingPluginKey, TableMap } from '@tiptap/pm/tables';
import {
  wordEffectiveCellMargins,
  wordEffectiveRowSpacing,
  wordTableGridSpacingShares,
  wordTableProperties,
  wordTableRenderedColumnWidths,
} from './studio-word-table-properties';
import { WORD_TABLE_NATIVE_MARGINS } from './studio-word-table-layout';

export interface WordColumnResizeOptions {
  cellMinWidth: number;
  maxColumnWidth?: number;
  previewColumns: (
    view: EditorView,
    tablePosition: number,
    column: number,
    baseWidth: number
  ) => boolean;
  restoreColumns: (view: EditorView, tablePosition: number) => void;
}

export function wordTableBaseColumns(table: ProseMirrorNode, fallback: number) {
  const widths: number[] = [];
  const explicit: boolean[] = [];
  table.firstChild?.forEach((cell) => {
    const span = Number(cell.attrs.colspan) || 1;
    for (let index = 0; index < span; index++) {
      const value = cell.attrs.colwidth?.[index];
      const known = typeof value === 'number' && Number.isFinite(value) && value > 0;
      widths.push(known ? value : fallback);
      explicit.push(known);
    }
  });
  return { widths, explicit };
}

/** Build a display-only first-row override; the original document stays immutable. */
export function wordTableColumnPreview(
  table: ProseMirrorNode,
  column: number,
  baseWidth: number
): ProseMirrorNode {
  if (!Number.isInteger(column) || column < 0 || !Number.isFinite(baseWidth) || baseWidth <= 0)
    throw new Error('表格列拖动尺寸无效。');
  const first = table.firstChild;
  if (!first) throw new Error('表格缺少行。');
  const cells: ProseMirrorNode[] = [];
  let current = 0;
  let found = false;
  first.forEach((cell) => {
    const span = Number(cell.attrs.colspan) || 1;
    if (column >= current && column < current + span) {
      const colwidth = cell.attrs.colwidth ? [...cell.attrs.colwidth] : Array(span).fill(0);
      colwidth[column - current] = baseWidth;
      cells.push(cell.type.create({ ...cell.attrs, colwidth }, cell.content, cell.marks));
      found = true;
    } else cells.push(cell);
    current += span;
  });
  if (!found) throw new Error('表格列拖动范围无效。');
  const rows: ProseMirrorNode[] = [first.type.create(first.attrs, cells, first.marks)];
  table.forEach((row, _offset, index) => { if (index > 0) rows.push(row); });
  return table.type.create(table.attrs, rows, table.marks);
}

function tableElement(view: EditorView, position: number): HTMLTableElement | null {
  const dom = view.nodeDOM(position);
  if (!(dom instanceof view.dom.ownerDocument.defaultView!.HTMLElement)) return null;
  return dom.matches('table') ? dom as HTMLTableElement : dom.querySelector('table');
}

function tableRows(table: ProseMirrorNode): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  table.forEach((row) => rows.push(row.attrs));
  return rows;
}

function displayOffset(table: ProseMirrorNode, widths: number[], column: number): number {
  return wordTableRenderedColumnWidths(widths, table.attrs, tableRows(table))[column] - widths[column];
}

function scaleFor(view: EditorView, table: HTMLTableElement): number | null {
  for (const element of [table, view.dom]) {
    const width = element.offsetWidth;
    const measured = element.getBoundingClientRect().width;
    const scale = width > 0 ? measured / width : NaN;
    if (Number.isFinite(scale) && scale > 0) return scale;
  }
  return null;
}

function startingBaseWidth(
  table: ProseMirrorNode,
  map: TableMap,
  column: number,
  widths: number[],
  explicit: boolean[],
  element: HTMLTableElement,
  scale: number
): number | null {
  // A known model width is already in the canonical base coordinate system.
  // offsetWidth rounds fractional layouts, so a rectangle-based scale estimate
  // must not rewrite that identity before the pointer has actually moved.
  if (explicit[column]) return widths[column];
  const col = element.querySelectorAll<HTMLTableColElement>(':scope > colgroup > col')[column];
  const computed = col ? element.ownerDocument.defaultView!.getComputedStyle(col).width : '';
  if (/^\d+(?:\.\d+)?px$/.test(computed)) {
    const usedWidth = parseFloat(computed);
    const base = usedWidth - displayOffset(table, widths, column);
    if (Number.isFinite(base) && base > 0) return base;
  }
  const measured = col?.getBoundingClientRect().width;
  if (measured && Number.isFinite(measured) && measured > 0) {
    const base = measured / scale - displayOffset(table, widths, column);
    if (!Number.isFinite(base) || base <= 0) return null;
    return base;
  }
  // A single-column cell supplies a reliable fallback when a renderer does not
  // expose COL rectangles. A merged cell alone cannot uniquely resolve several
  // unspecified columns, so avoid inventing equal widths from its offsetWidth.
  const rows = element.querySelectorAll<HTMLTableRowElement>(
    ':scope > tbody > tr:not([data-word-auto-page-row]),:scope > tr:not([data-word-auto-page-row])'
  );
  for (let index = 0; index < map.height; index++) {
    const offset = map.map[index * map.width + column];
    const rectangle = map.findCell(offset);
    if (rectangle.right - rectangle.left !== 1 || rectangle.top !== index) continue;
    const cells = rows[index]?.querySelectorAll<HTMLElement>(':scope > td,:scope > th');
    let current = 0;
    let cellIndex = 0;
    table.child(index).forEach((cell, _offset, item) => {
      if (current === column) cellIndex = item;
      current += Number(cell.attrs.colspan) || 1;
    });
    const measuredCell = cells?.[cellIndex]?.getBoundingClientRect().width;
    if (measuredCell && measuredCell > 0) {
      const base = measuredCell / scale - displayOffset(table, widths, column);
      if (Number.isFinite(base) && base > 0) return base;
    }
  }
  return null;
}

/** Keep every affected cell box wide enough after row-specific gaps and padding. */
export function wordTableColumnMinimum(
  table: ProseMirrorNode,
  column: number,
  minimum: number
): number {
  const map = TableMap.get(table);
  const { widths } = wordTableBaseColumns(table, minimum);
  const shares = wordTableGridSpacingShares(map.width);
  const defaultGap = (wordTableProperties(table.attrs).cellSpacing ?? 0) * 4 / 3;
  let required = minimum;
  const inspected = new Set<number>();
  for (let rowIndex = 0; rowIndex < map.height; rowIndex++) {
    const offset = map.map[rowIndex * map.width + column];
    if (inspected.has(offset)) continue;
    inspected.add(offset);
    const cell = table.nodeAt(offset)!;
    const rectangle = map.findCell(offset);
    const gap = wordEffectiveRowSpacing(table.attrs, table.child(rectangle.top).attrs) * 4 / 3;
    const margins = wordEffectiveCellMargins(table.attrs, cell.attrs, WORD_TABLE_NATIVE_MARGINS);
    const cellMinimum = Math.max(minimum, (margins.left + margins.right) * 4 / 3 + 2);
    const otherWidths = widths.slice(rectangle.left, rectangle.right)
      .reduce((sum, value, index) => sum + (rectangle.left + index === column ? 0 : value), 0);
    const gridGap = shares.slice(rectangle.left, rectangle.right)
      .reduce((sum, share) => sum + share * defaultGap, 0);
    const cellGap = gap * (1 + (rectangle.left === 0 ? 0.5 : 0) +
      (rectangle.right === map.width ? 0.5 : 0));
    required = Math.max(required, cellMinimum + cellGap - gridGap - otherWidths);
  }
  return required;
}

interface ResizeSession {
  doc: ProseMirrorNode;
  table: ProseMirrorNode;
  tablePosition: number;
  tableStart: number;
  column: number;
  scale: number;
  startX: number;
  startWidth: number;
  minimum: number;
  maximum: number;
  finishing: boolean;
  detach: () => void;
}

/** Retain the original hover/state/decorations and replace only its base-width gesture. */
export function wordTableColumnResizePlugin(
  source: Plugin,
  options: WordColumnResizeOptions
): Plugin {
  const sessions = new WeakMap<EditorView, ResizeSession>();
  const original = source.spec.props ?? {};
  const maximum = options.maxColumnWidth ?? 5000;
  const valid = (view: EditorView, session: ResizeSession) =>
    !view.isDestroyed && view.editable && !view.composing && view.state.doc === session.doc;

  const clean = (view: EditorView, cancelled: boolean, dispatch = true) => {
    const session = sessions.get(view);
    if (!session) return;
    sessions.delete(view);
    session.detach();
    if (!view.isDestroyed) options.restoreColumns(view, session.tablePosition);
    if (dispatch && !view.isDestroyed) {
      view.dispatch(view.state.tr.setMeta(columnResizingPluginKey,
        cancelled ? { setHandle: -1 } : { setDragging: false }
      ).setMeta('addToHistory', false));
    }
  };

  const begin = (view: EditorView, event: MouseEvent): boolean => {
    if (event.button !== 0 || view.isDestroyed || !view.editable || view.composing) return false;
    const state = columnResizingPluginKey.getState(view.state);
    if (!state || state.activeHandle < 0 || state.dragging || sessions.has(view)) return false;
    const cell = view.state.doc.nodeAt(state.activeHandle);
    if (!cell || !['tableCell', 'tableHeader'].includes(cell.type.name)) return false;
    const resolved = view.state.doc.resolve(state.activeHandle);
    const table = resolved.node(-1);
    const map = TableMap.get(table);
    const tableStart = resolved.start(-1);
    const tablePosition = tableStart - 1;
    const column = map.colCount(state.activeHandle - tableStart) + Number(cell.attrs.colspan) - 1;
    const element = tableElement(view, tablePosition);
    if (!element || !Number.isInteger(column) || column < 0 || column >= map.width || map.problems?.length)
      return false;
    const scale = scaleFor(view, element);
    if (scale === null) return false;
    const base = wordTableBaseColumns(table, options.cellMinWidth);
    const startWidth = startingBaseWidth(table, map, column, base.widths, base.explicit, element, scale);
    const minimum = wordTableColumnMinimum(table, column, options.cellMinWidth);
    if (startWidth === null || !Number.isFinite(minimum) || minimum > maximum || startWidth > maximum)
      return false;
    const win = view.dom.ownerDocument.defaultView!;
    const session: ResizeSession = {
      doc: view.state.doc, table, tablePosition, tableStart, column, scale,
      startX: event.clientX, startWidth, minimum, maximum, finishing: false,
      detach: () => {},
    };
    sessions.set(view, session);
    const widthAt = (clientX: number) => Math.abs(clientX - session.startX) < 1e-6
      ? session.startWidth
      : Math.max(session.minimum, Math.min(session.maximum,
          session.startWidth + (clientX - session.startX) / session.scale));

    const finish = (release: MouseEvent) => {
      if (release.button !== 0) return;
      if (!valid(view, session)) { clean(view, true); return; }
      const width = widthAt(release.clientX);
      session.finishing = true;
      try {
        if (Math.abs(release.clientX - session.startX) > 1e-6 &&
          Math.abs(width - session.startWidth) > 1e-6) {
          const transaction = closeHistory(view.state.tr);
          const changed = new Set<number>();
          for (let row = 0; row < map.height; row++) {
            const offset = map.map[row * map.width + column];
            if (changed.has(offset)) continue;
            changed.add(offset);
            const node = table.nodeAt(offset)!;
            const index = column - map.findCell(offset).left;
            const widths = node.attrs.colwidth ? [...node.attrs.colwidth] : Array(node.attrs.colspan).fill(0);
            if (widths[index] === width) continue;
            widths[index] = width;
            transaction.setNodeMarkup(tableStart + offset, undefined,
              { ...node.attrs, colwidth: widths }, node.marks);
          }
          if (transaction.docChanged) view.dispatch(transaction);
        }
      } finally {
        clean(view, false);
      }
    };
    const move = (motion: MouseEvent) => {
      if (!valid(view, session)) { clean(view, true); return; }
      if (!(motion.buttons & 1)) { finish(motion); return; }
      if (!options.previewColumns(view, tablePosition, column, widthAt(motion.clientX)))
        clean(view, true);
    };
    const escape = (key: KeyboardEvent) => {
      if (key.key !== 'Escape') return;
      key.preventDefault();
      key.stopPropagation();
      clean(view, true);
    };
    const cancel = () => clean(view, true);
    session.detach = () => {
      win.removeEventListener('mousemove', move);
      win.removeEventListener('mouseup', finish);
      win.removeEventListener('keydown', escape, true);
      win.removeEventListener('blur', cancel);
      win.removeEventListener('pointercancel', cancel);
    };
    view.dispatch(closeHistory(view.state.tr).setMeta(columnResizingPluginKey, {
      setDragging: { startX: session.startX, startWidth: session.startWidth },
    }).setMeta('addToHistory', false));
    if (!sessions.has(view) || !options.previewColumns(view, tablePosition, column, session.startWidth)) {
      clean(view, true);
      return true;
    }
    win.addEventListener('mousemove', move);
    win.addEventListener('mouseup', finish);
    win.addEventListener('keydown', escape, true);
    win.addEventListener('blur', cancel);
    win.addEventListener('pointercancel', cancel);
    event.preventDefault();
    return true;
  };

  return new Plugin({
    ...source.spec,
    props: {
      ...original,
      handleDOMEvents: {
        ...original.handleDOMEvents,
        mousedown: begin,
        compositionstart: (view, event) => {
          clean(view, true);
          return original.handleDOMEvents?.compositionstart?.call(source, view, event) ?? false;
        },
      },
    },
    view(view) {
      const previous = source.spec.view?.(view);
      return {
        update(current: EditorView, state: EditorState) {
          previous?.update?.(current, state);
          const session = sessions.get(current);
          if (session && !session.finishing && !valid(current, session)) clean(current, true);
        },
        destroy() {
          clean(view, true, false);
          previous?.destroy?.();
        },
      };
    },
  });
}
