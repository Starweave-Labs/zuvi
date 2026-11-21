import { sanitizeArcs, sanitizePoints } from './globe-geometry';
import type { GlobeArc, GlobeCategory, GlobePoint, GlobeValueScale } from './globe-types';

export interface GlobeData {
  /** Full canonical data for selection, callbacks, and details; never value/category styled. */
  points: GlobePoint[];
  renderedPoints: GlobePoint[];
  arcs: GlobeArc[];
  renderedArcs: GlobeArc[];
  categories: GlobeCategory[];
  /** Full-data counts, including zero-count declared categories and unknown category IDs. */
  counts: ReadonlyMap<string, number>;
}

const MIN_POINT_SIZE = 0.008;
const MAX_POINT_SIZE = 0.06;
const DEFAULT_VALUE_RANGE: readonly [number, number] = [0.012, 0.036];
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const normalizeId = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

/** Invalid IDs/names are skipped without reserving the ID. The first valid ID wins. */
export function sanitizeCategories(categoriesRaw: readonly GlobeCategory[] = []): GlobeCategory[] {
  const categories: GlobeCategory[] = [];
  const ids = new Set<string>();
  if (!Array.isArray(categoriesRaw)) return categories;
  for (const category of categoriesRaw) {
    if (!category) continue;
    const id = normalizeId(category.id);
    const name = normalizeId(category.name);
    if (!id || !name || ids.has(id)) continue;
    ids.add(id);
    categories.push({
      ...category,
      id,
      name,
      color: normalizeId(category.color) || undefined,
    });
  }
  return categories;
}

/** Unknown IDs are retained: they can still hide points in an undeclared category. */
export function normalizeHiddenCategories(hidden: readonly string[] = []): string[] {
  if (!Array.isArray(hidden)) return [];
  const ids = new Set<string>();
  for (const value of hidden) {
    const id = normalizeId(value);
    if (id) ids.add(id);
  }
  return Array.from(ids);
}

function normalizePair(value: unknown): [number, number] | undefined {
  if (!Array.isArray(value) || !isFiniteNumber(value[0]) || !isFiniteNumber(value[1]))
    return undefined;
  return value[0] <= value[1] ? [value[0], value[1]] : [value[1], value[0]];
}

function createValueScale(
  points: readonly GlobePoint[],
  valueScale?: boolean | GlobeValueScale
): ((value: number) => number) | undefined {
  if (valueScale !== true && (!valueScale || typeof valueScale !== 'object')) return undefined;
  const options = typeof valueScale === 'object' ? valueScale : undefined;
  let domain = normalizePair(options?.domain);
  if (!domain) {
    let low = Infinity;
    let high = -Infinity;
    for (const point of points) {
      if (!isFiniteNumber(point.value)) continue;
      low = Math.min(low, point.value);
      high = Math.max(high, point.value);
    }
    if (low === Infinity) return undefined;
    domain = [low, high];
  }
  const range = normalizePair(options?.range) ?? DEFAULT_VALUE_RANGE;
  const minRadius = clamp(range[0], MIN_POINT_SIZE, MAX_POINT_SIZE);
  const maxRadius = clamp(range[1], MIN_POINT_SIZE, MAX_POINT_SIZE);
  const [low, high] = domain;
  return (value: number) => {
    let progress = 0.5;
    if (low !== high) {
      if (value <= low) progress = 0;
      else if (value >= high) progress = 1;
      else {
        const span = high - low;
        // Half-sized operands avoid overflow for domains spanning finite +/- MAX_VALUE.
        progress = Number.isFinite(span)
          ? (value - low) / span
          : (value / 2 - low / 2) / (high / 2 - low / 2);
      }
    }
    if (progress <= 0) return minRadius;
    if (progress >= 1) return maxRadius;
    // Linear area interpolation, not linear radius: negative numeric values are valid.
    return Math.sqrt(
      minRadius * minRadius + (maxRadius * maxRadius - minRadius * minRadius) * progress
    );
  };
}

/**
 * Pure full-data preparation. Pass raw source points so an explicit finite `size`
 * can be distinguished from the geometry sanitizer's default radius.
 */
export function buildGlobeData(
  pointsRaw: readonly GlobePoint[] = [],
  arcsRaw: readonly GlobeArc[] = [],
  categoriesRaw: readonly GlobeCategory[] = [],
  valueScale?: boolean | GlobeValueScale,
  hiddenCategories: readonly string[] = []
): GlobeData {
  const categories = sanitizeCategories(categoriesRaw);
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const counts = new Map<string, number>(categories.map((category) => [category.id, 0]));
  const sourcePoints: GlobePoint[] = [];
  const sourceSizes = new Map<string, number | undefined>();
  if (Array.isArray(pointsRaw)) {
    for (const point of pointsRaw) {
      if (!point) continue;
      const id = normalizeId(point.id);
      if (
        !id ||
        sourceSizes.has(id) ||
        !isFiniteNumber(point.latitude) ||
        point.latitude < -90 ||
        point.latitude > 90 ||
        !isFiniteNumber(point.longitude)
      )
        continue;
      sourceSizes.set(id, isFiniteNumber(point.size) ? point.size : undefined);
      sourcePoints.push({ ...point, id, category: normalizeId(point.category) || undefined });
    }
  }
  const points = sanitizePoints(sourcePoints);
  for (const point of points) {
    if (point.category) counts.set(point.category, (counts.get(point.category) ?? 0) + 1);
  }

  const sourceArcs: GlobeArc[] = [];
  if (Array.isArray(arcsRaw)) {
    for (const arc of arcsRaw) {
      if (!arc) continue;
      const id = normalizeId(arc.id);
      if (!id) continue;
      sourceArcs.push({ ...arc, id, from: normalizeId(arc.from), to: normalizeId(arc.to) });
    }
  }
  const arcs = sanitizeArcs(sourceArcs, points);
  const scale = createValueScale(points, valueScale);
  const hidden = new Set(normalizeHiddenCategories(hiddenCategories));
  const renderedPoints: GlobePoint[] = [];
  const visibleIds = new Set<string>();
  for (const point of points) {
    if (point.category && hidden.has(point.category)) continue;
    visibleIds.add(point.id);
    renderedPoints.push({
      ...point,
      color: point.color ?? (point.category ? categoryById.get(point.category)?.color : undefined),
      size:
        sourceSizes.get(point.id) !== undefined || !scale || !isFiniteNumber(point.value)
          ? point.size
          : scale(point.value),
    });
  }
  const renderedArcs = arcs.filter((arc) => visibleIds.has(arc.from) && visibleIds.has(arc.to));
  return { points, renderedPoints, arcs, renderedArcs, categories, counts };
}

/** Locale-independent Unicode case conversion; no regex, coercion, or remote search. */
export function normalizeGlobeSearchQuery(query?: string): string {
  return typeof query === 'string' ? query.trim().toLowerCase() : '';
}

/** A blank query preserves the source array reference for memoized callers. */
export function searchGlobePoints(
  points: readonly GlobePoint[],
  query: string,
  categories: readonly GlobeCategory[] = []
): readonly GlobePoint[] {
  if (!Array.isArray(points)) return [];
  const normalized = normalizeGlobeSearchQuery(query);
  if (!normalized) return points;
  const categoryNames = new Map(
    sanitizeCategories(categories).map((category) => [category.id, category.name])
  );
  const matches = (value: unknown) =>
    typeof value === 'string' && value.toLowerCase().includes(normalized);
  return points.filter(
    (point) =>
      point &&
      (matches(point.id) ||
        matches(point.name) ||
        matches(point.category) ||
        matches(categoryNames.get(normalizeId(point.category))))
  );
}
