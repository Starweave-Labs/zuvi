'use client';

import * as React from 'react';
import { cx, isImeComposing, useControllableState } from '../../utils';
import { useZuviConfig } from '../../config';
import {
  applyFilters,
  buildRowRegistry,
  computeSelectAllState,
  computeStickyOffsets,
  cycleSort,
  normalizeColumns,
  resolveColumnWidths,
  resolveFilters,
  resolveSort,
  resolveStickyColumns,
  sortRowIndices,
  toggleAllSelection,
  toggleRowSelection,
  type NormalizedColumn,
} from './data-grid-model';
import { clampDataGridScroll, computeDataGridWindow } from './data-grid-virtual';
import type {
  DataGridFilters,
  DataGridProps,
  DataGridSelectionReason,
  DataGridSortState,
  DataGridStatus,
} from './data-grid-types';

const SELECT_COLUMN_WIDTH = 44;
const FOCUS_SCROLL_GUARD = 1;
const RESIZE_STEP = 16;

export interface DataGridViewProps<T> extends DataGridProps<T> {
  onViewStatus: (status: DataGridStatus) => void;
}

interface FocusCell {
  rowIndex: number;
  colIndex: number;
}

const scheduleFrame = (callback: () => void) =>
  typeof requestAnimationFrame === 'function'
    ? requestAnimationFrame(callback)
    : (setTimeout(callback, 16) as unknown as number);
const cancelFrame = (handle: number) =>
  typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame(handle) : clearTimeout(handle);

function cellText(value: unknown): React.ReactNode {
  if (value === null || value === undefined) return '—';
  return value as React.ReactNode;
}

export function DataGridView<T>(props: DataGridViewProps<T>): React.ReactNode {
  const { locale } = useZuviConfig();
  const labels = { ...locale.dataGrid, ...props.labels };
  const {
    columns: columnsInput,
    rows,
    rowKey,
    height = 320,
    rowHeight = 40,
    overscan = 6,
    loading = false,
    emptyContent,
    loadingContent,
    isRowSelectable,
    onViewStatus,
    classNames,
  } = props;

  const gridId = React.useId().replace(/:/g, '');
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const scrollTopRef = React.useRef(0);
  const frameRef = React.useRef(0);
  const selectionReason = React.useRef<DataGridSelectionReason>('row');

  const columnResult = React.useMemo(() => normalizeColumns(columnsInput), [columnsInput]);
  const [filters, setFilters] = useControllableState<DataGridFilters | null>({
    value: props.filters,
    defaultValue: props.defaultFilters ?? null,
    onChange: props.onFiltersChange,
  });
  const filterResult = React.useMemo(
    () => resolveFilters(filters, columnResult.columns),
    [filters, columnResult.columns]
  );
  // Filters narrow the dataset before sorting; every downstream view
  // (registry, window, aria-rowcount) operates on the filtered rows.
  const filteredRows = React.useMemo(
    () => applyFilters(rows, columnResult.columns, filterResult.filters),
    [rows, columnResult.columns, filterResult.filters]
  );
  const registry = React.useMemo(
    () => buildRowRegistry(filteredRows, rowKey, isRowSelectable),
    [filteredRows, rowKey, isRowSelectable]
  );
  const [sort, setSort] = useControllableState<DataGridSortState | null>({
    value: props.sort,
    defaultValue: props.defaultSort ?? null,
    onChange: props.onSortChange,
  });
  const sortResult = React.useMemo(
    () => resolveSort(sort, columnResult.columns),
    [sort, columnResult.columns]
  );
  const viewOrder = React.useMemo(
    () => sortRowIndices(filteredRows, columnResult.columns, sortResult.sort),
    [filteredRows, columnResult.columns, sortResult.sort]
  );
  const [selected, setSelected] = useControllableState<readonly string[]>({
    value: props.selectedKeys,
    defaultValue: props.defaultSelectedKeys ?? [],
    onChange: (keys) => props.onSelectedKeysChange?.([...keys], selectionReason.current),
  });
  const allState = React.useMemo(
    () => computeSelectAllState(selected, registry),
    [selected, registry]
  );
  const [focused, setFocused] = React.useState<FocusCell | null>(null);
  const [scrollTop, setScrollTop] = React.useState(0);
  const [columnWidths, setColumnWidths] = useControllableState<Record<string, number>>({
    value: props.columnWidths,
    defaultValue: props.defaultColumnWidths ?? {},
    onChange: props.onColumnWidthsChange,
  });
  // At most one filter panel is open at a time; key = column key or null.
  const [openFilter, setOpenFilter] = React.useState<string | null>(null);
  const gridRef = React.useRef<HTMLDivElement | null>(null);
  const filterTriggerRefs = React.useRef(new Map<string, HTMLButtonElement>());

  const totalColumns = columnResult.columns.length + 1;
  const rowCount = filteredRows.length;
  const contentHeight = rowCount * rowHeight;
  const widthResult = React.useMemo(
    () => resolveColumnWidths(columnWidths, columnResult.columns),
    [columnWidths, columnResult.columns]
  );
  const stickyResult = React.useMemo(
    () => resolveStickyColumns(columnResult.columns),
    [columnResult.columns]
  );
  const stickyOffsets = React.useMemo(
    () =>
      computeStickyOffsets(
        SELECT_COLUMN_WIDTH,
        columnResult.columns.map((column) => ({
          key: column.key,
          width: widthResult.widths[column.key],
        })),
        stickyResult.stickyKeys
      ),
    [widthResult.widths, columnResult.columns, stickyResult.stickyKeys]
  );
  const effectiveWidths = React.useMemo(
    () => columnResult.columns.map((column) => widthResult.widths[column.key] ?? column.width),
    [columnResult.columns, widthResult.widths]
  );
  const window = computeDataGridWindow({
    scrollTop,
    viewportHeight: height,
    rowCount,
    rowHeight,
    overscan,
  });
  const windowRef = React.useRef(window);
  windowRef.current = window;
  const status = loading ? 'loading' : rowCount === 0 ? 'empty' : 'ready';
  // Rows exist but the active filters matched none: say so instead of "no data".
  const filteredEmpty = status === 'empty' && rows.length > 0;
  const labelColumn = React.useMemo(
    () => columnResult.columns.find((column) => column.dataIndex !== undefined),
    [columnResult.columns]
  );
  const rowLabel = (sourceIndex: number) => {
    const column = labelColumn;
    if (column) {
      const value = filteredRows[sourceIndex][column.dataIndex!];
      if (value !== null && value !== undefined && value !== '') return String(value);
    }
    return registry.keys[sourceIndex] ?? '';
  };
  const issues = React.useMemo(
    () => [
      ...columnResult.issues,
      ...registry.issues,
      ...(sortResult.issue ? [sortResult.issue] : []),
      ...filterResult.issues,
      ...widthResult.issues,
      ...(stickyResult.issue ? [stickyResult.issue] : []),
    ],
    [
      columnResult.issues,
      registry.issues,
      sortResult.issue,
      filterResult.issues,
      widthResult.issues,
      stickyResult.issue,
    ]
  );

  const resizeState = React.useRef<{
    pointerId: number;
    key: string;
    startX: number;
    startWidth: number;
    min: number;
    max: number;
  } | null>(null);
  const beginResize = (column: NormalizedColumn<T>, event: React.PointerEvent<HTMLDivElement>) => {
    // jsdom omits PointerEvent.button; real browsers report 0 for the primary
    // button, so only an explicitly non-primary press (1/2) is rejected.
    if ((event.button ?? 0) > 0 || loading) return;
    event.preventDefault();
    event.stopPropagation();
    // Capture is best-effort: pointerup is matched by pointerId either way,
    // and jsdom has no active pointer so the request may legitimately fail.
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* Capture unavailable in this environment. */
    }
    resizeState.current = {
      pointerId: event.pointerId,
      key: column.key,
      startX: event.clientX,
      startWidth: widthResult.widths[column.key] ?? column.width,
      min: column.minWidth ?? 60,
      max: column.maxWidth ?? Number.MAX_SAFE_INTEGER,
    };
    document.documentElement.dataset.zDatagridResizing = '';
  };
  const moveResize = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = resizeState.current;
    if (!state || state.pointerId !== event.pointerId) return;
    const dx = event.clientX - state.startX;
    // Environments without pointer coordinates (jsdom) must not emit NaN widths.
    if (!Number.isFinite(dx)) return;
    const next = Math.min(Math.max(state.startWidth + dx, state.min), state.max);
    setColumnWidths((previous) => ({
      ...previous,
      [state.key]: Math.round(next),
    }));
  };
  const endResize = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = resizeState.current;
    if (!state || state.pointerId !== event.pointerId) return;
    resizeState.current = null;
    delete document.documentElement.dataset.zDatagridResizing;
  };
  const resizeByKeyboard = (column: NormalizedColumn<T>, delta: number | 'min' | 'max') => {
    const current = widthResult.widths[column.key] ?? column.width;
    const min = column.minWidth ?? 60;
    const max = column.maxWidth ?? Number.MAX_SAFE_INTEGER;
    const next =
      delta === 'min' ? min : delta === 'max' ? max : Math.min(Math.max(current + delta, min), max);
    if (next === current) return;
    setColumnWidths((previous) => ({ ...previous, [column.key]: Math.round(next) }));
  };

  // Unmount during a drag would leak the global resize cursor lock.
  React.useEffect(
    () => () => {
      if (!resizeState.current) delete document.documentElement.dataset.zDatagridResizing;
    },
    []
  );

  // A press outside the open panel or its trigger dismisses the panel.
  React.useEffect(() => {
    if (!openFilter) return;
    const onPointerDown = (event: Event) => {
      const target = event.target;
      const root = gridRef.current;
      if (!(target instanceof Node) || !root) {
        setOpenFilter(null);
        return;
      }
      const panel = root.querySelector('[data-part="filter-panel"]');
      const trigger = filterTriggerRefs.current.get(openFilter);
      if (!panel?.contains(target) && !trigger?.contains(target)) setOpenFilter(null);
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [openFilter]);

  const callbacks = React.useRef({ onViewStatus, onReady: props.onReady });
  callbacks.current = { onViewStatus, onReady: props.onReady };
  React.useEffect(() => {
    callbacks.current.onViewStatus(status);
    if (status === 'ready') callbacks.current.onReady?.();
  }, [status]);
  const warned = React.useRef('');
  React.useEffect(() => {
    const text = issues.join('\n');
    if (text && warned.current !== text) {
      warned.current = text;
      console.warn(`DataGrid: ${text}`);
    }
  }, [issues]);

  // Data shrink must not leave the scroll position past the content.
  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const clamped = clampDataGridScroll(scrollTopRef.current, contentHeight, height);
    if (clamped !== viewport.scrollTop) {
      viewport.scrollTop = clamped;
      scrollTopRef.current = clamped;
      setScrollTop(clamped);
    }
  }, [contentHeight, height]);

  // aria-activedescendant must never point at a row outside the rendered window.
  React.useEffect(() => {
    if (focused && (focused.rowIndex < window.start || focused.rowIndex >= window.end))
      setFocused(null);
  }, [focused, window.start, window.end]);

  React.useEffect(
    () => () => {
      if (frameRef.current) cancelFrame(frameRef.current);
    },
    []
  );

  const scrollTo = (next: number) => {
    const clamped = clampDataGridScroll(next, contentHeight, height);
    const viewport = viewportRef.current;
    scrollTopRef.current = clamped;
    setScrollTop(clamped);
    if (viewport && viewport.scrollTop !== clamped) viewport.scrollTop = clamped;
  };
  const ensureRowVisible = (rowIndex: number) => {
    const rowTop = rowIndex * rowHeight;
    const current = scrollTopRef.current;
    if (rowTop < current) scrollTo(rowTop);
    else if (rowTop + rowHeight > current + height) scrollTo(rowTop + rowHeight - height);
  };
  const moveFocus = (rowIndex: number, colIndex: number) => {
    const next = {
      rowIndex: Math.max(0, Math.min(rowCount - 1, rowIndex)),
      colIndex: Math.max(0, Math.min(totalColumns - 1, colIndex)),
    };
    setFocused(next);
    ensureRowVisible(next.rowIndex);
  };

  const toggleRow = (key: string) => {
    selectionReason.current = 'row';
    setSelected((previous) => toggleRowSelection(previous, key));
  };
  const toggleAll = () => {
    selectionReason.current = 'all';
    setSelected((previous) => toggleAllSelection(previous, registry));
  };

  const toggleFilterValue = (column: NormalizedColumn<T>, value: string) => {
    const current = filters?.[column.key] ?? [];
    const next = current.includes(value)
      ? current.filter((entry) => entry !== value)
      : [...current, value];
    const nextFilters: DataGridFilters = { ...filters, [column.key]: next };
    if (next.length === 0) delete nextFilters[column.key];
    // Unchecking every option removes the constraint instead of matching none.
    setFilters(Object.keys(nextFilters).length > 0 ? nextFilters : null);
  };
  const closeFilterPanel = (columnKey: string) => {
    setOpenFilter(null);
    filterTriggerRefs.current.get(columnKey)?.focus();
  };

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    scrollTopRef.current = element.scrollTop;
    if (frameRef.current) return;
    frameRef.current = scheduleFrame(() => {
      frameRef.current = 0;
      setScrollTop(scrollTopRef.current);
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || isImeComposing(event.nativeEvent)) return;
    const page = Math.max(FOCUS_SCROLL_GUARD, Math.ceil(height / rowHeight) - FOCUS_SCROLL_GUARD);
    const base = focused ?? { rowIndex: windowRef.current.start, colIndex: 0 };
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveFocus(base.rowIndex + 1, base.colIndex);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveFocus(base.rowIndex - 1, base.colIndex);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveFocus(base.rowIndex, base.colIndex + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveFocus(base.rowIndex, base.colIndex - 1);
    } else if (event.key === 'Home' && event.ctrlKey) {
      event.preventDefault();
      scrollTo(0);
      moveFocus(0, 0);
    } else if (event.key === 'End' && event.ctrlKey) {
      event.preventDefault();
      scrollTo(contentHeight);
      moveFocus(rowCount - 1, totalColumns - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      moveFocus(base.rowIndex, 0);
    } else if (event.key === 'End') {
      event.preventDefault();
      moveFocus(base.rowIndex, totalColumns - 1);
    } else if (event.key === 'PageDown') {
      event.preventDefault();
      moveFocus(base.rowIndex + page, base.colIndex);
    } else if (event.key === 'PageUp') {
      event.preventDefault();
      moveFocus(base.rowIndex - page, base.colIndex);
    } else if (event.key === ' ' && focused) {
      event.preventDefault();
      const key = registry.keys[viewOrder[focused.rowIndex]];
      if (key !== null && key !== undefined) toggleRow(key);
    }
  };

  const template = [SELECT_COLUMN_WIDTH, ...effectiveWidths].map((width) => `${width}px`).join(' ');
  const activeSort = sortResult.sort;
  const cellId = (rowIndex: number, colIndex: number) => `${gridId}-c${rowIndex}-${colIndex}`;
  const focusable = status === 'ready' && rowCount > 0;
  const stickyStyle = (key: string) =>
    stickyResult.stickyKeys.has(key) ? { left: stickyOffsets[key] } : undefined;
  const stickyClass = (key: string) =>
    stickyResult.stickyKeys.has(key)
      ? cx(
          'zuvi-datagrid-cell--sticky',
          'zuvi-datagrid-cell--sticky-column',
          classNames?.stickyCell
        )
      : undefined;

  return (
    <div
      ref={gridRef}
      role="grid"
      data-part="grid"
      className="zuvi-datagrid-grid"
      aria-rowcount={rowCount}
      aria-label={
        typeof props['aria-label'] === 'string' && props['aria-label'].trim()
          ? props['aria-label']
          : labels.grid
      }
      tabIndex={focusable ? 0 : undefined}
      aria-activedescendant={
        focused && focusable ? cellId(focused.rowIndex, focused.colIndex) : undefined
      }
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
      onKeyDown={handleKeyDown}
      onFocus={(event) => {
        if (
          !focused &&
          focusable &&
          !event.currentTarget.contains(event.relatedTarget as Node | null)
        ) {
          setFocused({ rowIndex: windowRef.current.start, colIndex: 0 });
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(null);
      }}
    >
      <div
        ref={viewportRef}
        data-part="viewport"
        className={cx('zuvi-datagrid-viewport', classNames?.viewport)}
        style={{ height }}
        onScroll={handleScroll}
      >
        <div
          role="row"
          data-part="header-row"
          className={cx('zuvi-datagrid-header-row', classNames?.headerRow)}
          style={{ gridTemplateColumns: template }}
        >
          <div
            role="columnheader"
            aria-colindex={1}
            data-part="select-cell"
            className={cx(
              'zuvi-datagrid-cell',
              'zuvi-datagrid-cell--sticky',
              classNames?.selectCell
            )}
          >
            <input
              type="checkbox"
              data-part="select-all"
              aria-label={labels.selectAll}
              aria-checked={allState === 'mixed' ? 'mixed' : allState === 'all' ? 'true' : 'false'}
              checked={allState === 'all'}
              disabled={loading}
              onChange={toggleAll}
              ref={(node) => {
                if (node) node.indeterminate = allState === 'mixed';
              }}
            />
          </div>
          {columnResult.columns.map((column, index) => {
            const colIndex = index + 1;
            const sorted = activeSort?.key === column.key ? activeSort : null;
            const header = column.headerRender
              ? column.headerRender({ sortState: activeSort })
              : column.header;
            return (
              <div
                key={column.key}
                role="columnheader"
                aria-colindex={colIndex + 1}
                aria-sort={sorted ? (sorted.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                data-part="header-cell"
                data-align={column.align}
                data-sortable={column.sortable || undefined}
                data-sticky={stickyResult.stickyKeys.has(column.key) || undefined}
                data-filter-open={openFilter === column.key ? 'true' : undefined}
                className={cx(
                  'zuvi-datagrid-cell',
                  'zuvi-datagrid-header-cell',
                  stickyClass(column.key),
                  classNames?.headerCell
                )}
                style={{ width: effectiveWidths[index], ...stickyStyle(column.key) }}
              >
                {column.sortable ? (
                  <button
                    type="button"
                    data-part="sort"
                    data-sorted={sorted ? sorted.dir : undefined}
                    aria-label={labels.sortLabel.replace('{label}', column.textValue ?? column.key)}
                    onClick={(event) => {
                      if (event.defaultPrevented) return;
                      setSort(cycleSort(activeSort, column.key));
                    }}
                  >
                    <span className="zuvi-datagrid-header-text">{header}</span>
                    <span aria-hidden="true" className="zuvi-datagrid-sort-arrow">
                      {sorted ? (sorted.dir === 'asc' ? '↑' : '↓') : '↕'}
                    </span>
                  </button>
                ) : (
                  <span className="zuvi-datagrid-header-text">{header}</span>
                )}
                {column.filterable && column.filterValues && column.filterValues.length > 0 ? (
                  <>
                    <button
                      type="button"
                      data-part="filter-trigger"
                      className={cx('zuvi-datagrid-filter-trigger', classNames?.filterTrigger)}
                      data-filtered={filters?.[column.key]?.length ? 'true' : undefined}
                      data-open={openFilter === column.key ? 'true' : undefined}
                      aria-label={labels.filterLabel.replace(
                        '{label}',
                        column.textValue ?? column.key
                      )}
                      aria-expanded={openFilter === column.key}
                      ref={(node) => {
                        if (node) filterTriggerRefs.current.set(column.key, node);
                        else filterTriggerRefs.current.delete(column.key);
                      }}
                      onClick={() =>
                        setOpenFilter(openFilter === column.key ? null : column.key)
                      }
                    >
                      <span aria-hidden="true" className="zuvi-datagrid-filter-icon">
                        ▾
                      </span>
                    </button>
                    {openFilter === column.key ? (
                      <div
                        data-part="filter-panel"
                        className={cx('zuvi-datagrid-filter-panel', classNames?.filterPanel)}
                        onKeyDown={(event) => {
                          // Grid keyboard handling must not react to panel keys.
                          event.stopPropagation();
                          if (event.key === 'Escape' && !event.defaultPrevented) {
                            event.preventDefault();
                            closeFilterPanel(column.key);
                          }
                        }}
                      >
                        {column.filterValues.map((value, optionIndex) => {
                          const checked = (filters?.[column.key] ?? []).includes(value);
                          return (
                            <label
                              key={value}
                              className="zuvi-datagrid-filter-option"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                autoFocus={optionIndex === 0}
                                onChange={() => toggleFilterValue(column, value)}
                              />
                              <span>{value}</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : null}
                  </>
                ) : null}
                <div
                  data-part="resize-handle"
                  role="separator"
                  tabIndex={0}
                  aria-orientation="vertical"
                  aria-label={labels.resizeColumn.replace(
                    '{label}',
                    column.textValue ?? column.key
                  )}
                  aria-valuemin={column.minWidth ?? 60}
                  aria-valuemax={Number.isFinite(column.maxWidth) ? column.maxWidth : undefined}
                  aria-valuenow={effectiveWidths[index]}
                  className="zuvi-datagrid-resize"
                  onKeyDown={(event) => {
                    if (event.defaultPrevented || isImeComposing(event.nativeEvent)) return;
                    if (event.key === 'ArrowLeft') {
                      event.preventDefault();
                      resizeByKeyboard(column, -RESIZE_STEP);
                    } else if (event.key === 'ArrowRight') {
                      event.preventDefault();
                      resizeByKeyboard(column, RESIZE_STEP);
                    } else if (event.key === 'ArrowUp') {
                      event.preventDefault();
                      resizeByKeyboard(column, -RESIZE_STEP);
                    } else if (event.key === 'ArrowDown') {
                      event.preventDefault();
                      resizeByKeyboard(column, RESIZE_STEP);
                    } else if (event.key === 'Home') {
                      event.preventDefault();
                      resizeByKeyboard(column, 'min');
                    } else if (event.key === 'End') {
                      event.preventDefault();
                      resizeByKeyboard(column, 'max');
                    }
                  }}
                  onPointerDown={(event) => beginResize(column, event)}
                  onPointerMove={moveResize}
                  onPointerUp={endResize}
                  onPointerCancel={endResize}
                />
              </div>
            );
          })}
        </div>
        {status === 'ready' ? (
          <div data-part="spacer" style={{ height: contentHeight, position: 'relative' }}>
            <div style={{ position: 'absolute', top: window.start * rowHeight, left: 0, right: 0 }}>
              {viewOrder.slice(window.start, window.end).map((sourceIndex, offset) => {
                const viewIndex = window.start + offset;
                const row = filteredRows[sourceIndex];
                const key = registry.keys[sourceIndex];
                const selectable = key !== null && registry.selectable[sourceIndex];
                const isSelected = key !== null && selected.includes(key);
                return (
                  <div
                    key={key ?? `dg-row-${sourceIndex}`}
                    role="row"
                    aria-rowindex={viewIndex + 1}
                    aria-selected={isSelected || undefined}
                    data-selected={isSelected || undefined}
                    data-part="row"
                    className={cx('zuvi-datagrid-row', classNames?.row)}
                    style={{ gridTemplateColumns: template, height: rowHeight }}
                  >
                    <div
                      role="gridcell"
                      id={cellId(viewIndex, 0)}
                      aria-colindex={1}
                      aria-selected={isSelected || undefined}
                      data-part="select-cell"
                      className={cx(
                        'zuvi-datagrid-cell',
                        'zuvi-datagrid-cell--sticky',
                        classNames?.selectCell
                      )}
                    >
                      {selectable ? (
                        <input
                          type="checkbox"
                          aria-label={labels.selectRow.replace('{label}', rowLabel(sourceIndex))}
                          checked={isSelected}
                          disabled={loading}
                          onChange={() => toggleRow(key as string)}
                        />
                      ) : null}
                    </div>
                    {columnResult.columns.map((column, index) => {
                      const colIndex = index + 1;
                      return (
                        <div
                          key={column.key}
                          role="gridcell"
                          id={cellId(viewIndex, colIndex)}
                          aria-colindex={colIndex + 1}
                          data-part="cell"
                          data-align={column.align}
                          data-sticky={stickyResult.stickyKeys.has(column.key) || undefined}
                          data-focused={
                            focused?.rowIndex === viewIndex && focused.colIndex === colIndex
                              ? ''
                              : undefined
                          }
                          className={cx(
                            'zuvi-datagrid-cell',
                            stickyClass(column.key),
                            classNames?.cell
                          )}
                          style={stickyStyle(column.key)}
                          onClick={(event) => {
                            if (event.defaultPrevented) return;
                            setFocused({ rowIndex: viewIndex, colIndex });
                          }}
                        >
                          {column.render
                            ? column.render(row, { rowIndex: viewIndex })
                            : cellText(
                                column.dataIndex !== undefined
                                  ? row[column.dataIndex]
                                  : column.textValue
                              )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div
            role="status"
            data-part={status}
            data-filtered-empty={filteredEmpty || undefined}
            className={cx(
              'zuvi-datagrid-state',
              status === 'empty' ? classNames?.empty : classNames?.loading
            )}
          >
            {status === 'loading'
              ? loadingContent !== undefined
                ? loadingContent
                : labels.loading
              : emptyContent !== undefined
                ? emptyContent
                : filteredEmpty
                  ? labels.filterEmpty
                  : labels.empty}
          </div>
        )}
      </div>
    </div>
  );
}

export type { NormalizedColumn };
