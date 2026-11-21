import type * as React from 'react';

export type DataGridStatus = 'loading' | 'ready' | 'empty' | 'error';

export interface DataGridError {
  code: 'load';
  message: string;
  cause?: unknown;
}

export type DataGridSortDirection = 'asc' | 'desc';

export interface DataGridSortState {
  key: string;
  dir: DataGridSortDirection;
}

export type DataGridSelectionReason = 'row' | 'all';

/** columnKey -> selected filter values; an empty record (or null) means no constraint. */
export type DataGridFilters = Record<string, readonly string[]>;

export interface DataGridColumn<T = unknown> {
  /** Unique column identity; duplicates keep the first occurrence with a warning. */
  key: string;
  /** Row field used for sorting and the default cell text. */
  dataIndex?: keyof T;
  header: React.ReactNode;
  /** Stable text for accessible names; sortable columns should provide it. */
  textValue?: string;
  /** Effective width in px; defaults to 120 and clamps to [minWidth, maxWidth]. */
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  align?: 'start' | 'center' | 'end';
  sortable?: boolean;
  /** Renders the header filter disclosure; enum options come from filterValues. */
  filterable?: boolean;
  /** Enum filter options; a row matches when its stringified dataIndex value is selected. */
  filterValues?: readonly string[];
  /** Fixed to the left edge; at most the first two sticky columns render fixed. */
  sticky?: boolean;
  /** rowIndex is the 0-based position in the current sorted view. */
  render?: (row: T, context: { rowIndex: number }) => React.ReactNode;
  headerRender?: (context: { sortState: DataGridSortState | null }) => React.ReactNode;
}

export interface DataGridLabels {
  grid: string;
  loading: string;
  error: string;
  retry: string;
  empty: string;
  selectAll: string;
  /** {label} is the row's first data value. */
  selectRow: string;
  /** {label} is the column text. */
  sortLabel: string;
  /** {label} is the column text; announced by the resize handle. */
  resizeColumn: string;
  /** Column text announced by the filter disclosure; opened panel lists filterValues. */
  filterLabel: string;
  /** Body text when filtering leaves zero rows while rows itself is non-empty. */
  filterEmpty: string;
}

export type DataGridPart =
  | 'root'
  | 'header'
  | 'headerRow'
  | 'headerCell'
  | 'viewport'
  | 'row'
  | 'cell'
  | 'stickyCell'
  | 'selectCell'
  | 'resizeHandle'
  | 'filterTrigger'
  | 'filterPanel'
  | 'empty'
  | 'loading'
  | /** Shell-level lazy-module load error. */ 'error';

export interface DataGridProps<T = unknown> extends Omit<
  React.ComponentPropsWithRef<'div'>,
  'children' | 'onChange' | 'onError'
> {
  columns: readonly DataGridColumn<T>[];
  rows: readonly T[];
  /** Row identity for selection/keys; defaults to the `id` field. */
  rowKey?: keyof T | ((row: T, index: number) => string);
  /** Body viewport height in px; default 320. */
  height?: number;
  /** Fixed row height in px; a virtualization requirement. Default 40. */
  rowHeight?: number;
  overscan?: number;
  /** Controlled per-column widths keyed by column key; values clamp to the column contract. */
  columnWidths?: Record<string, number>;
  defaultColumnWidths?: Record<string, number>;
  onColumnWidthsChange?: (widths: Record<string, number>) => void;
  sort?: DataGridSortState | null;
  defaultSort?: DataGridSortState | null;
  onSortChange?: (sort: DataGridSortState | null) => void;
  /** Controlled enum filters keyed by column key; server mode passes these plus rows. */
  filters?: DataGridFilters | null;
  defaultFilters?: DataGridFilters | null;
  onFiltersChange?: (filters: DataGridFilters | null) => void;
  selectedKeys?: readonly string[];
  defaultSelectedKeys?: readonly string[];
  onSelectedKeysChange?: (keys: string[], reason: DataGridSelectionReason) => void;
  isRowSelectable?: (row: T) => boolean;
  loading?: boolean;
  emptyContent?: React.ReactNode;
  loadingContent?: React.ReactNode;
  labels?: Partial<DataGridLabels>;
  onReady?: () => void;
  onStatusChange?: (status: DataGridStatus) => void;
  onError?: (error: DataGridError) => void;
  classNames?: Partial<Record<DataGridPart, string>>;
}
