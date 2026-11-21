/**
 * Pure virtualization window math, extracted from the RFC-005 prototype's
 * proven numbers: fixed row height, overscan padding and clamped scrollTop.
 * The same lineage as VirtualTable; a shared utils migration is a later,
 * non-blocking step.
 */
export interface DataGridWindow {
  /** First view row in the DOM window (0-based, includes overscan). */
  start: number;
  /** Exclusive end; `rows.slice(start, end)`. */
  end: number;
  count: number;
}

export function computeDataGridWindow(options: {
  scrollTop: number;
  viewportHeight: number;
  rowCount: number;
  rowHeight: number;
  overscan: number;
}): DataGridWindow {
  const { viewportHeight, rowCount } = options;
  const rowHeight = safePositive(options.rowHeight, 40);
  const overscan = Math.max(0, Math.floor(safePositive(options.overscan, 6)));
  const scrollTop = Number.isFinite(options.scrollTop) ? Math.max(0, options.scrollTop) : 0;
  if (!Number.isFinite(viewportHeight) || viewportHeight <= 0 || rowCount <= 0) {
    return { start: 0, end: 0, count: 0 };
  }
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const count = Math.ceil(viewportHeight / rowHeight) + overscan * 2;
  const end = Math.min(rowCount, start + count);
  return { start, end, count: end - start };
}

/** Header-aware clamp: never scroll past the content, never below zero. */
export function clampDataGridScroll(
  scrollTop: number,
  contentHeight: number,
  viewportHeight: number
): number {
  const max = Math.max(0, contentHeight - viewportHeight);
  const value = Number.isFinite(scrollTop) ? scrollTop : 0;
  return Math.min(Math.max(0, value), max);
}

function safePositive(value: number, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}
