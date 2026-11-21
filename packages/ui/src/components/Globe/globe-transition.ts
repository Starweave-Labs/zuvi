import { normalizeGlobeView, normalizeLongitude } from './globe-geometry';
import type { GlobeView } from './globe-types';

export { normalizeGlobeView } from './globe-geometry';

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const finiteOr = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const normalizeProgress = (progress: number): number =>
  typeof progress === 'number' && !Number.isNaN(progress) ? clamp(progress, 0, 1) : 0;

/** Backwards-compatible instant updates by default; explicit durations cap at 5s. */
export function normalizeGlobeTransitionDuration(duration?: number, fallback = 0): number {
  return clamp(finiteOr(duration, finiteOr(fallback, 0)), 0, 5000);
}

/** Cubic in/out easing, with clamped exact endpoints and a safe NaN starting state. */
export function easeCubic(progress: number): number {
  const t = normalizeProgress(progress);
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/**
 * Pure camera-angle flight: eased latitude/zoom and the shortest wrapped longitude.
 * A partial or invalid target keeps the current normalized source for omitted axes.
 * Exact antipodal longitude ties consistently choose the westward semicircle.
 */
export function interpolateGlobeView(
  source: Partial<GlobeView> | undefined,
  target: Partial<GlobeView> | undefined,
  progress: number
): GlobeView {
  const start = normalizeGlobeView(source);
  const end = normalizeGlobeView(target, start);
  const t = normalizeProgress(progress);
  if (t === 0) return start;
  if (t === 1) return end;
  const eased = easeCubic(t);
  const longitudeDelta = normalizeLongitude(end.longitude - start.longitude);
  return normalizeGlobeView(
    {
      latitude: start.latitude + (end.latitude - start.latitude) * eased,
      longitude: start.longitude + longitudeDelta * eased,
      zoom: start.zoom + (end.zoom - start.zoom) * eased,
    },
    start
  );
}
