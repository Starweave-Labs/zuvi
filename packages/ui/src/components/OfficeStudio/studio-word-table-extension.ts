import { Extension, mergeAttributes } from '@tiptap/react';
import type { DOMOutputSpec, Node as ProseMirrorNode } from '@tiptap/pm/model';
import type { EditorView } from '@tiptap/pm/view';
import { Table, TableView, createColGroup } from '@tiptap/extension-table';
import { columnResizing, columnResizingPluginKey } from '@tiptap/pm/tables';
import { wordTableColumnPreview, wordTableColumnResizePlugin } from './studio-word-column-resize';
import { wordFillMixedTableRows, wordObserveMixedTableRows } from './studio-word-table-mixed-layout';
import {
  wordTableCss,
  wordTableMargins,
  wordTableProperties,
  wordTableRenderedColumnWidths,
  wordTableRowSpacingCss,
  wordTableSpacing,
  wordTableSpacingLayout,
} from './studio-word-table-properties';

function cssText(styles: Record<string, string>): string {
  return Object.entries(styles).map(([property, value]) => `${property}:${value}`).join(';');
}

function rows(node: ProseMirrorNode): Record<string, unknown>[] {
  const result: Record<string, unknown>[] = [];
  node.forEach((row) => result.push(row.attrs));
  return result;
}

function tableLayout(node: ProseMirrorNode, cellMinWidth: number) {
  const rowAttrs = rows(node);
  const properties = wordTableProperties(node.attrs);
  const layout = wordTableSpacingLayout(properties, rowAttrs);
  const styles = wordTableCss(properties, rowAttrs);
  const generated = createColGroup(node, cellMinWidth);
  const baseColumns: number[] = [];
  const fixedColumns: boolean[] = [];
  node.firstChild?.forEach((cell) => {
    const span = Number(cell.attrs.colspan) || 1;
    for (let index = 0; index < span; index++) {
      const width = cell.attrs.colwidth?.[index];
      baseColumns.push(typeof width === 'number' && width !== 0 ? width : cellMinWidth);
      fixedColumns.push(typeof width === 'number' && width > 0);
    }
  });
  const columnWidths = baseColumns.length
    ? wordTableRenderedColumnWidths(baseColumns, properties, rowAttrs)
    : [];
  const spacing = layout.kind === 'uniform' ? layout.spacing : 0;
  const gapPixels = ((columnWidths.length + 1) * spacing * 4) / 3;
  const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0) + gapPixels;
  const colgroup: DOMOutputSpec = [
    'colgroup',
    {},
    ...columnWidths.map((width, index): DOMOutputSpec => [
      'col',
      { style: `${fixedColumns[index] ? 'width' : 'min-width'}:${width}px` },
    ]),
  ];
  const group = columnWidths.length ? {
    colgroup,
    tableWidth: generated.tableWidth ? `${totalWidth}px` : '',
    tableMinWidth: generated.tableMinWidth ? `${totalWidth}px` : '',
  } : generated;
  if (group.tableWidth) styles.width = group.tableWidth;
  else if (group.tableMinWidth) styles['min-width'] = group.tableMinWidth;
  return {
    group,
    styles,
    columnWidths,
    fixedColumns,
    attributes: {
      'data-word-table-properties': '',
      'data-word-spacing-layout': layout.kind,
      ...(layout.kind === 'mixed'
        ? { 'data-word-row-spacing-values': JSON.stringify(layout.values) }
        : {}),
    },
  };
}

const tableViews = new WeakMap<HTMLTableElement, WordTableView>();
function tableViewAt(view: EditorView, position: number): WordTableView | undefined {
  const dom = view.nodeDOM(position);
  if (!(dom instanceof view.dom.ownerDocument.defaultView!.HTMLElement)) return undefined;
  const table = dom.matches('table') ? dom as HTMLTableElement : dom.querySelector('table');
  return table ? tableViews.get(table) : undefined;
}

/** Keep editable column widths and the serialized table footprint consistent. */
class WordTableView extends TableView {
  private preview: { column: number; baseWidth: number } | null = null;
  private stopObserving: (() => void) | null = null;
  private startupFrame: number | null = null;
  private destroyed = false;

  constructor(
    node: ProseMirrorNode,
    cellMinWidth: number,
    view?: EditorView,
    htmlAttributes: Record<string, unknown> = {}
  ) {
    super(node, cellMinWidth, view, htmlAttributes);
    this.applyTableProperties(node);
    tableViews.set(this.table, this);
  }

  private applyTableProperties(node: ProseMirrorNode) {
    const layout = tableLayout(node, this.cellMinWidth);
    layout.columnWidths.forEach((width, index) => {
      const column = this.colgroup.children[index] as HTMLTableColElement | undefined;
      if (!column) return;
      const property = layout.fixedColumns[index] ? 'width' : 'min-width';
      column.style.removeProperty(property === 'width' ? 'min-width' : 'width');
      column.style.setProperty(property, `${width}px`);
    });
    for (const [property, value] of Object.entries(layout.styles))
      this.table.style.setProperty(property, value);
    for (const [name, value] of Object.entries(layout.attributes))
      this.table.setAttribute(name, value);
    if (!('data-word-row-spacing-values' in layout.attributes))
      this.table.removeAttribute('data-word-row-spacing-values');
    this.scheduleMixedFill();
  }

  private scheduleMixedFill() {
    if (this.destroyed || this.startupFrame !== null) return;
    const win = this.table.ownerDocument.defaultView;
    if (!win || typeof win.requestAnimationFrame !== 'function') return;
    // NodeView construction precedes connection and the insertion of row DOM.
    // Start the observer after attachment, rather than keeping its detached noop.
    this.startupFrame = win.requestAnimationFrame(() => {
      this.startupFrame = null;
      if (this.destroyed || !this.table.isConnected) return;
      if (this.table.getAttribute('data-word-spacing-layout') === 'mixed') {
        if (!this.stopObserving) this.stopObserving = wordObserveMixedTableRows(this.table);
      } else {
        this.stopObserving?.();
        this.stopObserving = null;
      }
      wordFillMixedTableRows(this.table);
    });
  }

  update(node: ProseMirrorNode) {
    if (!super.update(node)) return false;
    // A row override can change the effective layout while the table's own
    // markup remains unchanged. Preserve it instead of collapsing it to tblPr.
    if (this.preview) {
      try {
        this.applyTableProperties(wordTableColumnPreview(node,
          this.preview.column, this.preview.baseWidth));
      } catch {
        this.preview = null;
        this.applyTableProperties(node);
      }
    } else this.applyTableProperties(node);
    return true;
  }

  previewColumns(column: number, baseWidth: number): boolean {
    try {
      const temporary = wordTableColumnPreview(this.node, column, baseWidth);
      this.preview = { column, baseWidth };
      this.applyTableProperties(temporary);
      this.table.setAttribute('data-word-column-resize-preview', '');
      return true;
    } catch {
      return false;
    }
  }

  restoreColumns() {
    this.preview = null;
    this.table.removeAttribute('data-word-column-resize-preview');
    this.applyTableProperties(this.node);
  }

  destroy() {
    this.destroyed = true;
    this.stopObserving?.();
    this.stopObserving = null;
    if (this.startupFrame !== null)
      this.table.ownerDocument.defaultView?.cancelAnimationFrame(this.startupFrame);
    this.startupFrame = null;
    this.preview = null;
    tableViews.delete(this.table);
  }
}

export const WordTable = Table.extend({
  addOptions() {
    return { ...this.parent!(), resizable: true, View: WordTableView };
  },
  addAttributes() {
    return {
      ...this.parent?.(),
      defaultCellMargins: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const source = element.getAttribute('data-word-table-margins');
          if (!source) return null;
          try {
            return wordTableMargins(JSON.parse(source));
          } catch {
            return null;
          }
        },
        renderHTML: (attrs: Record<string, unknown>) => {
          const margins = wordTableMargins(attrs.defaultCellMargins);
          return margins ? { 'data-word-table-margins': JSON.stringify(margins) } : {};
        },
      },
      cellSpacing: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const source = element.getAttribute('data-word-cell-spacing');
          if (!source) return null;
          try {
            return wordTableSpacing(Number(source));
          } catch {
            return null;
          }
        },
        renderHTML: (attrs: Record<string, unknown>) => {
          const spacing = wordTableSpacing(attrs.cellSpacing);
          return spacing === null ? {} : { 'data-word-cell-spacing': String(spacing) };
        },
      },
    };
  },
  addProseMirrorPlugins() {
    const plugins = this.parent!();
    if (this.options.resizable && !plugins.some(plugin => plugin.spec.key === columnResizingPluginKey)) {
      // Register while readonly as well: the gesture guards permission on every
      // event, and remains available when the same editor is subsequently unlocked.
      plugins.unshift(columnResizing({
        handleWidth: this.options.handleWidth,
        cellMinWidth: this.options.cellMinWidth,
        defaultCellMinWidth: this.options.cellMinWidth,
        View: null,
        lastColumnResizable: this.options.lastColumnResizable,
      }));
    }
    return plugins.map(plugin => plugin.spec.key === columnResizingPluginKey
      ? wordTableColumnResizePlugin(plugin, {
          cellMinWidth: this.options.cellMinWidth,
          previewColumns: (view, position, column, width) =>
            tableViewAt(view, position)?.previewColumns(column, width) ?? false,
          restoreColumns: (view, position) => tableViewAt(view, position)?.restoreColumns(),
        })
      : plugin);
  },
  renderHTML({ node, HTMLAttributes }) {
    const layout = tableLayout(node, this.options.cellMinWidth);
    const table: DOMOutputSpec = [
      'table',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, layout.attributes, {
        style: cssText(layout.styles),
      }),
      ...(layout.group.colgroup ? [layout.group.colgroup] : []),
      ['tbody', 0],
    ];
    return this.options.renderWrapper ? ['div', { class: 'tableWrapper' }, table] : table;
  },
});

/** Row-level native spacing overrides are kept separately from the table default. */
export const WordTableSpacing = Extension.create({
  name: 'studioWordTableSpacing',
  addGlobalAttributes() {
    return [
      {
        types: ['tableRow'],
        attributes: {
          cellSpacing: {
            default: null,
            parseHTML: (element: HTMLElement) => {
              const source = element.getAttribute('data-word-row-cell-spacing');
              if (!source) return null;
              try {
                return wordTableSpacing(Number(source));
              } catch {
                return null;
              }
            },
            renderHTML: (attrs: Record<string, unknown>) => {
              const spacing = wordTableSpacing(attrs.cellSpacing);
              return {
                ...(spacing === null
                  ? {}
                  : { 'data-word-row-cell-spacing': String(spacing) }),
                style: cssText(wordTableRowSpacingCss(attrs)),
              };
            },
          },
        },
      },
    ];
  },
});
