import { describe, expect, it } from 'vitest';
import { clampDataGridScroll, computeDataGridWindow } from './data-grid-virtual';

describe('computeDataGridWindow', () => {
  const base = { scrollTop: 0, viewportHeight: 200, rowCount: 300, rowHeight: 40, overscan: 6 };

  it('opens with a padded window at the top', () => {
    expect(computeDataGridWindow({ ...base, scrollTop: 0 })).toEqual({
      start: 0,
      end: 17,
      count: 17,
    });
  });

  it('shifts the window with overscan around the visible rows', () => {
    // scrollTop 400 → first visible row 10, minus overscan 6 → start 4.
    expect(computeDataGridWindow({ ...base, scrollTop: 400 }).start).toBe(4);
    expect(computeDataGridWindow({ ...base, scrollTop: 400 }).end).toBe(21);
  });

  it('clamps to the row count at the bottom', () => {
    // 300 rows × 40px − 200px viewport → max scrollTop 11800.
    const window = computeDataGridWindow({ ...base, scrollTop: 300 * 40 - 200 });
    expect(window.end).toBe(300);
    expect(window.start).toBe(289);
  });

  it('degrades safely on empty or invalid input', () => {
    expect(computeDataGridWindow({ ...base, rowCount: 0 })).toEqual({ start: 0, end: 0, count: 0 });
    expect(computeDataGridWindow({ ...base, scrollTop: Number.NaN })).toEqual({
      start: 0,
      end: 17,
      count: 17,
    });
    expect(computeDataGridWindow({ ...base, scrollTop: 0, rowHeight: 0 }).count).toBeGreaterThan(0);
  });
});

describe('clampDataGridScroll', () => {
  it('clamps into [0, contentHeight - viewportHeight]', () => {
    expect(clampDataGridScroll(-5, 1200, 200)).toBe(0);
    expect(clampDataGridScroll(500, 1200, 200)).toBe(500);
    expect(clampDataGridScroll(1500, 1200, 200)).toBe(1000);
    expect(clampDataGridScroll(300, 120, 200)).toBe(0);
  });

  it('treats non-finite input as zero', () => {
    expect(clampDataGridScroll(Number.NaN, 1200, 200)).toBe(0);
  });
});
