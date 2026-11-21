import type { DataGridColumn, DataGridSortState } from './data-grid-types';

export const DATA_GRID_DEFAULT_WIDTH = 120;
export const DATA_GRID_DEFAULT_MIN_WIDTH = 60;

export interface NormalizedColumn<T> extends DataGridColumn<T> {
  /** Effective width after clamping to [minWidth, maxWidth]. */
  width: number;
}

/**
 * Column normalization without mutating input: duplicate keys keep the first
 * occurrence with a warning, widths clamp defensively, and sortable columns
 * without a usable sort source are reported so sorting stays honest.
 */
export function normalizeColumns<T>(columns: readonly DataGridColumn<T>[]): {
  columns: NormalizedColumn<T>[];
  issues: string[];
} {
  const issues: string[] = [];
  const seen = new Set<string>();
  const normalized: NormalizedColumn<T>[] = [];
  columns.forEach((column) => {
    if (seen.has(column.key)) {
      issues.push(`列 key "${column.key}" 重复，已保留第一个同名列。`);
      return;
    }
    seen.add(column.key);
    const minWidth = finiteNumber(column.minWidth, DATA_GRID_DEFAULT_MIN_WIDTH);
    const maxWidth = finiteNumber(column.maxWidth, Number.MAX_SAFE_INTEGER);
    const base = finiteNumber(column.width, DATA_GRID_DEFAULT_WIDTH);
    const width = Math.min(Math.max(base, minWidth), maxWidth);
    if (width !== base) issues.push(`列 "${column.key}" 宽度 ${base} 已钳制为 ${width}。`);
    if (column.sortable && column.dataIndex === undefined && column.textValue === undefined) {
      issues.push(`列 "${column.key}" 声明可排序，但缺少 dataIndex / textValue，排序将被忽略。`);
    }
    normalized.push({ ...column, width });
  });
  return { columns: normalized, issues };
}

function finiteNumber(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/**
 * Merges controlled/UNcontrolled per-key widths with the column contract:
 * unknown keys are ignored with a warning, missing keys keep the column
 * default, and every result re-clamps into [minWidth, maxWidth] so a caller
 * can never push the template out of contract.
 */
export function resolveColumnWidths<T>(
  widths: Record<string, number> | undefined,
  columns: readonly NormalizedColumn<T>[]
): { widths: Record<string, number>; issues: string[] } {
  const issues: string[] = [];
  const resolved: Record<string, number> = {};
  const declared = new Set(columns.map((column) => column.key));
  if (widths) {
    for (const [key, value] of Object.entries(widths)) {
      if (!declared.has(key)) {
        issues.push(`columnWidths 包含未声明的列 "${key}"，已忽略。`);
        continue;
      }
      resolved[key] = finiteNumber(value, Number.NaN);
    }
  }
  for (const column of columns) {
    const base = resolved[column.key];
    const width = Math.min(
      Math.max(base, column.minWidth ?? DATA_GRID_DEFAULT_MIN_WIDTH),
      column.maxWidth ?? Number.MAX_SAFE_INTEGER
    );
    if (base !== undefined && width !== base) {
      issues.push(`列 "${column.key}" 宽度 ${base} 已钳制为 ${width}。`);
    }
    resolved[column.key] = Number.isFinite(width) ? width : column.width;
  }
  return { widths: resolved, issues };
}

/** Sticky columns render left-fixed in source order, capped at the first two with a warning. */
export function resolveStickyColumns<T>(columns: readonly NormalizedColumn<T>[]): {
  stickyKeys: Set<string>;
  issue: string | null;
} {
  const sticky = columns.filter((column) => column.sticky);
  if (sticky.length > 2) {
    return {
      stickyKeys: new Set(sticky.slice(0, 2).map((column) => column.key)),
      issue: `sticky 列超过 2 个，仅前两列（${sticky
        .slice(0, 2)
        .map((column) => `"${column.key}"`)
        .join('、')}）固定渲染。`,
    };
  }
  return { stickyKeys: new Set(sticky.map((column) => column.key)), issue: null };
}

/** Cumulative left offsets for the select cell plus sticky business columns. */
export function computeStickyOffsets(
  selectWidth: number,
  columns: readonly { key: string; width: number }[],
  stickyKeys: ReadonlySet<string>
): Record<string, number> {
  const offsets: Record<string, number> = {};
  let left = selectWidth;
  columns.forEach((column) => {
    if (stickyKeys.has(column.key)) {
      offsets[column.key] = left;
      left += column.width;
    }
  });
  return offsets;
}

export function resolveRowKey<T>(
  row: T,
  index: number,
  rowKey: keyof T | ((row: T, index: number) => string) | undefined
): string | null {
  const value =
    rowKey === undefined
      ? (row as Record<string, unknown>)?.id
      : typeof rowKey === 'function'
        ? rowKey(row, index)
        : row[rowKey];
  if (value === null || value === undefined || value === '') return null;
  return String(value);
}

export interface RowRegistry {
  /** Resolved key per source row; null rows are excluded from selection. */
  keys: (string | null)[];
  selectable: boolean[];
  issues: string[];
}

/**
 * Selection registry over source rows. Duplicate or missing rowKey values keep
 * rendering but are skipped from the selection registry with a warning, so a
 * broken identity can never select the wrong row.
 */
export function buildRowRegistry<T>(
  rows: readonly T[],
  rowKey: keyof T | ((row: T, index: number) => string) | undefined,
  isRowSelectable?: (row: T) => boolean
): RowRegistry {
  const issues: string[] = [];
  const keys: (string | null)[] = [];
  const selectable: boolean[] = [];
  const seen = new Set<string>();
  rows.forEach((row, index) => {
    const key = resolveRowKey(row, index, rowKey);
    if (key === null) {
      issues.push(`第 ${index + 1} 行缺少 rowKey，已跳过选择注册。`);
      keys.push(null);
      selectable.push(false);
      return;
    }
    if (seen.has(key)) {
      issues.push(`rowKey "${key}" 重复，重复行已跳过选择注册。`);
      keys.push(null);
      selectable.push(false);
      return;
    }
    seen.add(key);
    keys.push(key);
    selectable.push(isRowSelectable ? isRowSelectable(row) : true);
  });
  return { keys, selectable, issues };
}

export type SelectAllState = 'all' | 'none' | 'mixed';

export function computeSelectAllState(
  selected: readonly string[],
  registry: RowRegistry
): SelectAllState {
  const selectable = registry.keys.filter(
    (key, index) => key !== null && registry.selectable[index]
  );
  if (!selectable.length) return 'none';
  const selectedSet = new Set(selected);
  const count = selectable.reduce(
    (total, key) => total + (selectedSet.has(key as string) ? 1 : 0),
    0
  );
  if (count === 0) return 'none';
  return count === selectable.length ? 'all' : 'mixed';
}

export function toggleAllSelection(selected: readonly string[], registry: RowRegistry): string[] {
  const selectable = registry.keys.filter(
    (key, index) => key !== null && registry.selectable[index]
  ) as string[];
  const state = computeSelectAllState(selected, registry);
  return state === 'all' ? [] : selectable;
}

export function toggleRowSelection(selected: readonly string[], key: string): string[] {
  const next = selected.filter((current) => current !== key);
  return next.length === selected.length ? [...next, key] : next;
}

/** asc → desc → clear; a new column always restarts at asc. */
export function cycleSort(
  current: DataGridSortState | null,
  key: string
): DataGridSortState | null {
  if (!current || current.key !== key) return { key, dir: 'asc' };
  if (current.dir === 'asc') return { key, dir: 'desc' };
  return null;
}

/** Invalid sort targets resolve to null with an issue instead of lying in the header. */
export function resolveSort<T>(
  sort: DataGridSortState | null | undefined,
  columns: readonly NormalizedColumn<T>[]
): { sort: DataGridSortState | null; issue: string | null } {
  if (!sort) return { sort: null, issue: null };
  const column = columns.find((candidate) => candidate.key === sort.key);
  if (!column) return { sort: null, issue: `sort.key "${sort.key}" 不是已声明的列，排序已忽略。` };
  if (!column.sortable)
    return { sort: null, issue: `列 "${sort.key}" 未声明 sortable，排序已忽略。` };
  if (sort.dir !== 'asc' && sort.dir !== 'desc') {
    return { sort: null, issue: `sort.dir "${String(sort.dir)}" 无效，排序已忽略。` };
  }
  return { sort: { key: sort.key, dir: sort.dir }, issue: null };
}

function sortValue<T>(row: T, column: NormalizedColumn<T>): unknown {
  if (column.dataIndex !== undefined) return row[column.dataIndex];
  return column.textValue;
}

function baseCompare(left: unknown, right: unknown): number {
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  if (typeof left === 'boolean' && typeof right === 'boolean') return Number(left) - Number(right);
  return String(left).localeCompare(String(right));
}

/**
 * Returns source-row indices in view order. Sorting never mutates `rows`;
 * nullish values group last regardless of direction so gaps stay findable.
 */
export function sortRowIndices<T>(
  rows: readonly T[],
  columns: readonly NormalizedColumn<T>[],
  sort: DataGridSortState | null
): number[] {
  const indices = rows.map((_, index) => index);
  if (!sort) return indices;
  const column = columns.find((candidate) => candidate.key === sort.key);
  if (!column) return indices;
  const dirFactor = sort.dir === 'asc' ? 1 : -1;
  const keyed = indices.map((index) => ({ index, value: sortValue(rows[index], column) }));
  keyed.sort((left, right) => {
    const leftNull = left.value === null || left.value === undefined;
    const rightNull = right.value === null || right.value === undefined;
    if (leftNull && rightNull) return 0;
    if (leftNull) return 1;
    if (rightNull) return -1;
    return dirFactor * baseCompare(left.value, right.value);
  });
  return keyed.map((entry) => entry.index);
}

/**
 * Validates filter state against the column contract: unknown or non-filterable
 * keys are dropped with a warning, and empty selections mean "no constraint"
 * so unchecking everything restores all rows instead of matching none.
 */
export function resolveFilters<T>(
  filters: Record<string, readonly string[]> | null | undefined,
  columns: readonly NormalizedColumn<T>[]
): { filters: Record<string, readonly string[]>; issues: string[] } {
  const issues: string[] = [];
  const resolved: Record<string, readonly string[]> = {};
  if (filters) {
    for (const [key, values] of Object.entries(filters)) {
      const column = columns.find((candidate) => candidate.key === key);
      if (!column) {
        issues.push(`filters 包含未声明的列 "${key}"，已忽略。`);
        continue;
      }
      if (!column.filterable) {
        issues.push(`列 "${key}" 未声明 filterable，筛选已忽略。`);
        continue;
      }
      if (Array.isArray(values) && values.length > 0) resolved[key] = values;
    }
  }
  return { filters: resolved, issues };
}

/**
 * Client-side enum filtering applied before sorting: a row survives when, for
 * every constrained column, its stringified dataIndex value is among the
 * selected values. Rows with a nullish value do not match any non-empty
 * constraint, so narrowing an enum excludes gaps instead of surfacing them.
 */
export function applyFilters<T>(
  rows: readonly T[],
  columns: readonly NormalizedColumn<T>[],
  filters: Record<string, readonly string[]>
): T[] {
  // Empty selections are no constraint; resolveFilters reports them upstream.
  const entries = Object.entries(filters).filter(([, values]) => values.length > 0);
  if (entries.length === 0) return [...rows];
  return rows.filter((row) =>
    entries.every(([key, values]) => {
      const column = columns.find((candidate) => candidate.key === key);
      if (!column || column.dataIndex === undefined) return true;
      const value = row[column.dataIndex];
      if (value === null || value === undefined) return false;
      return values.includes(String(value));
    })
  );
}
