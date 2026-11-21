export interface GlobeLabelCandidate {
  id: string;
  x: number;
  y: number;
  /** Measured CSS-pixel size supplied by the Scene's cache, never measured here. */
  width: number;
  height: number;
  visible: boolean;
  priority?: number;
  selected?: boolean;
  hovered?: boolean;
}

export interface GlobeLabelRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface GlobeLabelLayoutOptions {
  width: number;
  height: number;
  maxLabels?: number;
  gap?: number;
  padding?: number;
  collisionPadding?: number;
  reserved?: readonly GlobeLabelRect[];
}

export interface GlobeLabelPosition {
  id: string;
  left: number;
  top: number;
  visible: boolean;
}

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const finiteOr = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

export function normalizeGlobeLabelBudget(maxLabels?: number): number {
  return clamp(Math.round(finiteOr(maxLabels, 12)), 1, 40);
}

function overlaps(a: GlobeLabelRect, b: GlobeLabelRect): boolean {
  return (
    a.left < b.left + b.width &&
    a.left + a.width > b.left &&
    a.top < b.top + b.height &&
    a.top + a.height > b.top
  );
}

/** Bounded spatial buckets: even stage-sized labels visit at most 67 x 67 cells. */
function createCollisionGrid(width: number, height: number) {
  const cellSize = Math.max(32, width / 64, height / 64);
  const lastColumn = Math.floor(width / cellSize) + 1;
  const lastRow = Math.floor(height / cellSize) + 1;
  const buckets = new Map<string, GlobeLabelRect[]>();
  const cells = (rect: GlobeLabelRect) => ({
    firstColumn: Math.max(-1, Math.floor(rect.left / cellSize)),
    lastColumn: Math.min(lastColumn, Math.floor((rect.left + rect.width) / cellSize)),
    firstRow: Math.max(-1, Math.floor(rect.top / cellSize)),
    lastRow: Math.min(lastRow, Math.floor((rect.top + rect.height) / cellSize)),
  });
  return {
    insert(rect: GlobeLabelRect) {
      const range = cells(rect);
      for (let row = range.firstRow; row <= range.lastRow; row++) {
        for (let column = range.firstColumn; column <= range.lastColumn; column++) {
          const key = `${column},${row}`;
          const bucket = buckets.get(key);
          if (bucket) bucket.push(rect);
          else buckets.set(key, [rect]);
        }
      }
    },
    collides(rect: GlobeLabelRect): boolean {
      const range = cells(rect);
      const seen = new Set<GlobeLabelRect>();
      for (let row = range.firstRow; row <= range.lastRow; row++) {
        for (let column = range.firstColumn; column <= range.lastColumn; column++) {
          const bucket = buckets.get(`${column},${row}`);
          if (!bucket) continue;
          for (const other of bucket) {
            if (seen.has(other)) continue;
            seen.add(other);
            if (overlaps(rect, other)) return true;
          }
        }
      }
      return false;
    },
  };
}

function isValidRect(rect: GlobeLabelRect): boolean {
  return (
    !!rect &&
    Number.isFinite(rect.left) &&
    Number.isFinite(rect.top) &&
    Number.isFinite(rect.width) &&
    rect.width > 0 &&
    Number.isFinite(rect.height) &&
    rect.height > 0 &&
    Number.isFinite(rect.left + rect.width) &&
    Number.isFinite(rect.top + rect.height)
  );
}

/**
 * Pure deterministic layout in input order. Selected, hovered, then numeric-priority
 * labels get first choice; stable ID ties do not depend on the current input order.
 * Only label visibility changes, never the input's marker visibility.
 */
export function layoutGlobeLabels(
  candidates: readonly GlobeLabelCandidate[],
  options: GlobeLabelLayoutOptions
): GlobeLabelPosition[] {
  if (!Array.isArray(candidates)) return [];
  const positions = candidates.map((candidate) => ({
    id: candidate.id,
    left: finiteOr(candidate.x, 0),
    top: finiteOr(candidate.y, 0),
    visible: false,
  }));
  const width = finiteOr(options?.width, 0);
  const height = finiteOr(options?.height, 0);
  if (width <= 0 || height <= 0) return positions;
  const budget = normalizeGlobeLabelBudget(options.maxLabels);
  const padding = clamp(finiteOr(options.padding, 4), 0, Math.min(width, height) / 2);
  const gap = clamp(finiteOr(options.gap, 8), 0, Math.max(width, height));
  const collisionPadding = clamp(finiteOr(options.collisionPadding, 2), 0, Math.max(width, height));
  const grid = createCollisionGrid(width, height);
  if (Array.isArray(options.reserved)) {
    for (const rect of options.reserved) if (isValidRect(rect)) grid.insert(rect);
  }
  const eligible = candidates
    .map((candidate, index) => ({ candidate, index }))
    .filter(
      ({ candidate }) =>
        candidate.visible === true &&
        typeof candidate.id === 'string' &&
        !!candidate.id.trim() &&
        Number.isFinite(candidate.x) &&
        candidate.x >= 0 &&
        candidate.x <= width &&
        Number.isFinite(candidate.y) &&
        candidate.y >= 0 &&
        candidate.y <= height &&
        Number.isFinite(candidate.width) &&
        candidate.width > 0 &&
        candidate.width <= width - padding * 2 &&
        Number.isFinite(candidate.height) &&
        candidate.height > 0 &&
        candidate.height <= height - padding * 2
    );
  eligible.sort((a, b) => {
    const rank =
      Number(!!b.candidate.selected) - Number(!!a.candidate.selected) ||
      Number(!!b.candidate.hovered) - Number(!!a.candidate.hovered) ||
      finiteOr(b.candidate.priority, 0) - finiteOr(a.candidate.priority, 0);
    if (rank) return rank;
    if (a.candidate.id !== b.candidate.id) return a.candidate.id < b.candidate.id ? -1 : 1;
    return a.index - b.index;
  });
  let placed = 0;
  for (const { candidate, index } of eligible) {
    if (placed >= budget) break;
    const { x, y, width: labelWidth, height: labelHeight } = candidate;
    // Slide only the perpendicular axis to keep the chosen side and marker gap.
    const horizontalLeft = clamp(x - labelWidth / 2, padding, width - padding - labelWidth);
    const verticalTop = clamp(y - labelHeight / 2, padding, height - padding - labelHeight);
    const placements: GlobeLabelRect[] = [
      { left: x + gap, top: verticalTop, width: labelWidth, height: labelHeight },
      { left: x - gap - labelWidth, top: verticalTop, width: labelWidth, height: labelHeight },
      { left: horizontalLeft, top: y - gap - labelHeight, width: labelWidth, height: labelHeight },
      { left: horizontalLeft, top: y + gap, width: labelWidth, height: labelHeight },
    ];
    for (const rect of placements) {
      if (
        !isValidRect(rect) ||
        rect.left < padding ||
        rect.top < padding ||
        rect.left + rect.width > width - padding ||
        rect.top + rect.height > height - padding
      )
        continue;
      const collisionRect = {
        left: rect.left - collisionPadding,
        top: rect.top - collisionPadding,
        width: rect.width + collisionPadding * 2,
        height: rect.height + collisionPadding * 2,
      };
      if (!isValidRect(collisionRect) || grid.collides(collisionRect)) continue;
      grid.insert(rect);
      positions[index] = { id: candidate.id, left: rect.left, top: rect.top, visible: true };
      placed++;
      break;
    }
  }
  return positions;
}
