export interface WordLayoutLine {
  from: number;
  to: number;
  height: number;
}
export interface WordLayoutBlock {
  from: number;
  to: number;
  lines: WordLayoutLine[];
  before?: number;
  after?: number;
  keepLines?: boolean;
  keepNext?: boolean;
  widowControl?: boolean;
  pageBreak?: boolean;
}
export interface WordPagePlacement {
  from: number;
  to: number;
  page: number;
  top: number;
  height: number;
  block: number;
  line: number;
}
export interface WordPageBreak {
  position: number;
  page: number;
  remaining: number;
  block: boolean;
}
export interface WordPagination {
  placements: WordPagePlacement[];
  breaks: WordPageBreak[];
  pages: number;
  overflow: boolean;
}

/** Layout only: page boundaries never become editable document nodes or undo entries. */
export function wordPaginate(blocks: readonly WordLayoutBlock[], height: number): WordPagination {
  if (!Number.isFinite(height) || height <= 0) throw new Error('可用页高无效。');
  for (const block of blocks) {
    if (
      !Number.isInteger(block.from) ||
      !Number.isInteger(block.to) ||
      block.to < block.from ||
      [block.before ?? 0, block.after ?? 0].some((n) => !Number.isFinite(n) || n < 0) ||
      block.lines.some(
        (line) =>
          !Number.isInteger(line.from) ||
          !Number.isInteger(line.to) ||
          line.from < block.from ||
          line.to > block.to ||
          line.to < line.from ||
          !Number.isFinite(line.height) ||
          line.height <= 0
      )
    )
      throw new Error('分页测量数据无效。');
  }
  const result: WordPagination = { placements: [], breaks: [], pages: 1, overflow: false };
  let page = 0,
    y = 0;
  const next = (position: number, block: boolean) => {
    result.breaks.push({ position, page: page + 1, remaining: Math.max(0, height - y), block });
    page++;
    y = 0;
    result.pages = page + 1;
  };
  const total = (block: WordLayoutBlock) =>
    (block.before ?? 0) +
    (block.after ?? 0) +
    block.lines.reduce((sum, line) => sum + line.height, 0);
  for (let index = 0; index < blocks.length; index++) {
    const block = blocks[index];
    if (block.pageBreak) {
      next(block.from, true);
      continue;
    }
    if (!block.lines.length) continue;
    const own = total(block);
    // Keep chains stop at explicit breaks and move together when they fit an entire page.
    let chain = own,
      tail = index;
    while (blocks[tail]?.keepNext && blocks[tail + 1] && !blocks[tail + 1].pageBreak) {
      const following = blocks[++tail];
      chain +=
        (following.before ?? 0) +
        (following.keepLines || following.keepNext
          ? following.lines.reduce((sum, line) => sum + line.height, 0)
          : following.lines
              .slice(0, following.widowControl === false ? 1 : 2)
              .reduce((sum, line) => sum + line.height, 0));
      if (following.keepNext) chain += following.after ?? 0;
    }
    if (block.keepNext && y > 0 && chain <= height && y + chain > height) next(block.from, true);
    if (block.keepLines && own <= height && y + own > height && y > 0) next(block.from, true);
    y += page === 0 || y > 0 ? (block.before ?? 0) : 0;
    let line = 0;
    while (line < block.lines.length) {
      let count = 0,
        used = 0;
      while (
        line + count < block.lines.length &&
        y + used + block.lines[line + count].height <= height + 0.01
      ) {
        used += block.lines[line + count].height;
        count++;
      }
      const remaining = block.lines.length - line;
      if (count === 0) {
        if (y > 0) {
          next(block.lines[line].from, line === 0);
          continue;
        }
        count = 1;
        used = block.lines[line].height;
        result.overflow = true;
      }
      if (count < remaining && block.widowControl !== false && remaining > 1) {
        if (count === 1 && y > 0) {
          next(block.lines[line].from, line === 0);
          continue;
        }
        if (remaining - count === 1 && count > 2) {
          count--;
          used -= block.lines[line + count].height;
        } else if (remaining - count === 1 && count === 2 && y > 0) {
          next(block.lines[line].from, line === 0);
          continue;
        }
      }
      for (let offset = 0; offset < count; offset++) {
        const measured = block.lines[line + offset];
        result.placements.push({
          ...measured,
          page,
          top: y,
          height: measured.height,
          block: index,
          line: line + offset,
        });
        y += measured.height;
      }
      line += count;
      if (line < block.lines.length) next(block.lines[line].from, false);
    }
    y += block.after ?? 0;
    if (y > height + 0.01) {
      y = Math.min(y, height);
    }
  }
  return result;
}
