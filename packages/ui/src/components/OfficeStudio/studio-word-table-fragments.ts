/** Original, unscaled row coordinates. Page gaps never enter these measurements. */
export interface WordCellLineFragment {
  from: number;
  to: number;
  top: number;
  bottom: number;
}
export interface WordCellFragmentMeasure {
  from: number;
  to: number;
  lines: readonly WordCellLineFragment[];
}
export interface WordTableFragmentBand {
  top: number;
  bottom: number;
  /** One insertion point per cell, including cells whose text already ended. */
  anchors: number[];
}

export function wordValidateCellFragmentMeasures(
  cells: readonly WordCellFragmentMeasure[],
  height: number
) {
  if (!cells.length || !Number.isFinite(height) || height <= 0)
    throw new Error('Invalid table fragment geometry.');
  const intervals: { top: number; bottom: number }[] = [];
  for (const cell of cells) {
    if (
      !Number.isInteger(cell.from) ||
      cell.from < 0 ||
      !Number.isInteger(cell.to) ||
      cell.from > cell.to
    )
      throw new Error('Invalid cell fragment positions.');
    let previousPosition = cell.from;
    let previousTop = 0;
    for (const line of cell.lines) {
      if (
        !Number.isInteger(line.from) ||
        !Number.isInteger(line.to) ||
        line.from < previousPosition ||
        line.to < line.from ||
        line.to > cell.to ||
        !Number.isFinite(line.top) ||
        !Number.isFinite(line.bottom) ||
        line.top < previousTop ||
        line.bottom <= line.top ||
        line.bottom > height
      )
        throw new Error('Invalid cell line geometry.');
      intervals.push({ top: line.top, bottom: line.bottom });
      previousPosition = line.to;
      previousTop = line.top;
    }
  }
  return intervals;
}

/** Group overlapping lines across all cells, so no common page cut bisects a line. */
export function wordTableFragmentBands(
  cells: readonly WordCellFragmentMeasure[],
  height: number
): WordTableFragmentBand[] {
  const intervals = wordValidateCellFragmentMeasures(cells, height);
  intervals.sort((a, b) => a.top - b.top || a.bottom - b.bottom);
  const groups: { top: number; bottom: number }[] = [];
  for (const interval of intervals) {
    const previous = groups.at(-1);
    if (previous && interval.top < previous.bottom)
      previous.bottom = Math.max(previous.bottom, interval.bottom);
    else groups.push({ ...interval });
  }
  if (!groups.length) return [{ top: 0, bottom: height, anchors: cells.map((cell) => cell.from) }];
  return groups.map((group, index) => ({
    top: index === 0 ? 0 : group.top,
    bottom: index === groups.length - 1 ? height : groups[index + 1].top,
    anchors: cells.map((cell) => {
      const following = cell.lines.find((line) => line.bottom > group.top);
      return following?.from ?? cell.to;
    }),
  }));
}

export interface WordTableCellPage {
  height: number;
  cells: { from: number; to: number; firstLine: number; endLine: number; advance: number }[];
  overflow: boolean;
}
export interface WordTableCellPagination {
  startOnNextPage: boolean;
  pages: WordTableCellPage[];
}

/** Consume each column independently, then use its maximum bottom as the row page height. */
export function wordPaginateTableCells(
  cells: readonly WordCellFragmentMeasure[],
  height: number,
  pageHeight: number,
  firstAvailable = pageHeight
): WordTableCellPagination {
  // Validate the complete input before allocating page results.
  wordValidateCellFragmentMeasures(cells, height);
  if (
    !Number.isFinite(pageHeight) ||
    pageHeight <= 0 ||
    !Number.isFinite(firstAvailable) ||
    firstAvailable < 0 ||
    firstAvailable > pageHeight
  )
    throw new Error('Invalid table page height.');
  const result: WordTableCellPagination = { startOnNextPage: false, pages: [] };
  const cursors = cells.map(() => 0);
  const bases = cells.map(() => 0);
  const trailing =
    height -
    cells.reduce(
      (bottom, cell) => cell.lines.reduce((value, line) => Math.max(value, line.bottom), bottom),
      0
    );
  let available = firstAvailable;
  if (cells.every((cell) => !cell.lines.length)) {
    result.startOnNextPage = height > available && available < pageHeight;
    result.pages.push({
      height,
      cells: cells.map((cell) => ({
        from: cell.from,
        to: cell.to,
        firstLine: 0,
        endLine: 0,
        advance: 0,
      })),
      overflow: height > (result.startOnNextPage ? pageHeight : available),
    });
    return result;
  }
  while (cursors.some((cursor, index) => cursor < cells[index].lines.length)) {
    const ends = cells.map((cell, index) => {
      let end = cursors[index];
      while (end < cell.lines.length) {
        const extent =
          cell.lines[end].bottom - bases[index] + (end === cell.lines.length - 1 ? trailing : 0);
        if (extent > available) break;
        end++;
      }
      return end;
    });
    const missingFirstContent = ends.some(
      (end, index) => end === cursors[index] && end < cells[index].lines.length
    );
    if (!result.pages.length && available < pageHeight && missingFirstContent) {
      result.startOnNextPage = true;
      available = pageHeight;
      continue;
    }
    let used = 0;
    let overflow = false;
    const fragments = cells.map((cell, index) => {
      const first = cursors[index];
      let end = ends[index];
      // A line taller than a full page must remain visible and cannot stall pagination.
      if (end === first && first < cell.lines.length) {
        end++;
        overflow = true;
      }
      const before = bases[index];
      if (end > first) {
        const bottom = cell.lines[end - 1].bottom;
        used = Math.max(used, bottom - bases[index] + (end === cell.lines.length ? trailing : 0));
        bases[index] = Math.min(bottom, cell.lines[end]?.top ?? bottom);
      }
      cursors[index] = end;
      return {
        from: cell.lines[first]?.from ?? cell.to,
        to: end > first ? cell.lines[end - 1].to : cell.to,
        firstLine: first,
        endLine: end,
        advance: bases[index] - before,
      };
    });
    result.pages.push({ height: used, cells: fragments, overflow: overflow || used > available });
    available = pageHeight;
  }
  return result;
}
