import type { GlobeArc, GlobePoint, GlobeView } from './globe-types';

/** Pure, dependency-free geometry shared by WebGL, the fallback, and hit targets. */
export type GlobeVector = [number, number, number];
export type GlobeVectorInput = readonly [number, number, number];
export interface GlobeProjection {
  x: number;
  y: number;
  visible: boolean;
}

export const DEFAULT_GLOBE_VIEW: Readonly<GlobeView> = {
  latitude: 20,
  longitude: 105,
  zoom: 1,
};
export const GLOBE_RADIUS_RATIO = 0.38;
export const DEFAULT_POINT_SIZE = 0.016;
export const DEFAULT_ARC_WIDTH = 0.0025;
const DEG = Math.PI / 180;
const EPSILON = 1e-7;

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const finiteOr = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

/** Wraps finite degrees into [-180, 180); invalid input becomes zero. */
export function normalizeLongitude(longitude: number): number {
  if (!Number.isFinite(longitude)) return 0;
  const result = ((longitude % 360) + 540) % 360 - 180;
  return result === 0 ? 0 : result;
}

export function normalizeGlobeView(
  input?: Partial<GlobeView>,
  fallback: Readonly<GlobeView> = DEFAULT_GLOBE_VIEW,
): GlobeView {
  return {
    latitude: clamp(finiteOr(input?.latitude, finiteOr(fallback.latitude, 20)), -90, 90),
    longitude: normalizeLongitude(finiteOr(input?.longitude, finiteOr(fallback.longitude, 105))),
    zoom: clamp(finiteOr(input?.zoom, finiteOr(fallback.zoom, 1)), 0.75, 2),
  };
}

/** At (0°, 0°) the sphere faces +Z; east is +X, north is +Y. */
export function coordinateToVector(latitude: number, longitude: number, radius = 1): GlobeVector {
  const lat = clamp(finiteOr(latitude, 0), -90, 90) * DEG;
  const lon = normalizeLongitude(longitude) * DEG;
  const r = Math.max(0, finiteOr(radius, 1));
  const cosLat = Math.cos(lat);
  return [r * cosLat * Math.sin(lon), r * Math.sin(lat), r * cosLat * Math.cos(lon)];
}

/** Rx(+view.latitude) · Ry(-view.longitude): the view coordinate is centered at +Z. */
export function rotateGlobeVector(position: GlobeVectorInput, view: GlobeView): GlobeVector {
  const normalized = normalizeGlobeView(view);
  const lat = normalized.latitude * DEG;
  const lon = normalized.longitude * DEG;
  const sinLon = Math.sin(lon);
  const cosLon = Math.cos(lon);
  const x = position[0] * cosLon - position[2] * sinLon;
  const z = position[0] * sinLon + position[2] * cosLon;
  return [x, position[1] * Math.cos(lat) - z * Math.sin(lat), position[1] * Math.sin(lat) + z * Math.cos(lat)];
}

/** Radius in stage CSS pixels. Closer zoom deliberately crops the globe, without a plateau. */
export function globeRadius(width: number, height: number, zoom = 1): number {
  return Math.max(0, Math.min(finiteOr(width, 0), finiteOr(height, 0)))
    * GLOBE_RADIUS_RATIO * clamp(finiteOr(zoom, 1), 0.75, 2);
}

/**
 * Orthographic projection with camera on +Z. Elevated geometry can remain visible
 * behind the limb if its ray clears the unit sphere. Surface points use z > epsilon.
 * `visible` also excludes positions outside the stage, including at cropped zoom.
 */
export function projectGlobePosition(
  position: GlobeVectorInput,
  view: GlobeView,
  width: number,
  height: number,
): GlobeProjection {
  const [rx, ry, rz] = rotateGlobeVector(position, view);
  const radius = globeRadius(width, height, view.zoom);
  const x = width / 2 + rx * radius;
  const y = height / 2 - ry * radius;
  const inFront = rz > EPSILON || rx * rx + ry * ry > 1 + EPSILON;
  return {
    x,
    y,
    visible: radius > 0 && Number.isFinite(x) && Number.isFinite(y) && inFront
      && x >= 0 && x <= width && y >= 0 && y <= height,
  };
}

/** Marker visibility is based on its surface anchor, not on the floating marker mesh. */
export function projectGlobePoint(
  point: Pick<GlobePoint, 'latitude' | 'longitude'>,
  view: GlobeView,
  width: number,
  height: number,
  altitude = 0,
): GlobeProjection {
  const position = coordinateToVector(point.latitude, point.longitude);
  const surface = projectGlobePosition(position, view, width, height);
  if (!altitude) return surface;
  const elevated = projectGlobePosition(coordinateToVector(point.latitude, point.longitude, 1 + altitude), view, width, height);
  return { ...elevated, visible: surface.visible && elevated.visible };
}

function unit(vector: GlobeVectorInput): GlobeVector {
  const length = Math.hypot(vector[0], vector[1], vector[2]);
  if (!Number.isFinite(length) || length < EPSILON) return [0, 0, 1];
  return [vector[0] / length, vector[1] / length, vector[2] / length];
}

/** Short great-circle interpolation; exact antipodes choose a deterministic nonzero semicircle. */
export function interpolateGeodesic(start: GlobeVectorInput, end: GlobeVectorInput, progress: number): GlobeVector {
  const a = unit(start);
  const b = unit(end);
  const t = clamp(finiteOr(progress, 0), 0, 1);
  if (t === 0) return a;
  if (t === 1) return b;
  const dot = clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1);
  if (dot > 1 - 1e-12) {
    return unit([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);
  }
  const tangent: GlobeVector = [b[0] - a[0] * dot, b[1] - a[1] * dot, b[2] - a[2] * dot];
  let tangentLength = Math.hypot(...tangent);
  if (tangentLength < 1e-10) {
    // Project the least-aligned axis onto the tangent plane. Its choice is stable,
    // also for a reversed exact-antipodal connection, unlike normalizing a + b.
    const axis: GlobeVector = Math.abs(a[0]) <= Math.abs(a[1]) && Math.abs(a[0]) <= Math.abs(a[2])
      ? [1, 0, 0] : Math.abs(a[1]) <= Math.abs(a[2]) ? [0, 1, 0] : [0, 0, 1];
    const alignment = a[0] * axis[0] + a[1] * axis[1] + a[2] * axis[2];
    tangent[0] = axis[0] - a[0] * alignment;
    tangent[1] = axis[1] - a[1] * alignment;
    tangent[2] = axis[2] - a[2] * alignment;
    tangentLength = Math.hypot(...tangent);
  }
  const angle = Math.acos(dot) * t;
  const scale = Math.sin(angle) / tangentLength;
  return unit([
    a[0] * Math.cos(angle) + tangent[0] * scale,
    a[1] * Math.cos(angle) + tangent[1] * scale,
    a[2] * Math.cos(angle) + tangent[2] * scale,
  ]);
}

/** Elevated great-circle samples (segments + 1), with both endpoints at radius 1. */
export function buildGlobeArc(
  start: GlobeVectorInput,
  end: GlobeVectorInput,
  altitude?: number,
  segments = 64,
): GlobeVector[] {
  const a = unit(start);
  const b = unit(end);
  const dot = clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1);
  const height = clamp(finiteOr(altitude, 0.08 + Math.acos(dot) * 0.16), 0.02, 0.8);
  const count = clamp(Math.round(finiteOr(segments, 64)), 2, 512);
  return Array.from({ length: count + 1 }, (_, index) => {
    const t = index / count;
    const direction = interpolateGeodesic(a, b, t);
    const radius = 1 + height * Math.sin(Math.PI * t);
    return [direction[0] * radius, direction[1] * radius, direction[2] * radius];
  });
}

/** Invalid coordinates/IDs are skipped. First valid ID wins. Input is never mutated. */
export function sanitizePoints(points: readonly GlobePoint[]): GlobePoint[] {
  const ids = new Set<string>();
  const result: GlobePoint[] = [];
  if (!Array.isArray(points)) return result;
  for (const point of points) {
    if (!point || typeof point.id !== 'string' || !point.id.trim() || ids.has(point.id)
      || !Number.isFinite(point.latitude) || point.latitude < -90 || point.latitude > 90
      || !Number.isFinite(point.longitude)) continue;
    ids.add(point.id);
    result.push({
      ...point,
      longitude: normalizeLongitude(point.longitude),
      size: clamp(finiteOr(point.size, DEFAULT_POINT_SIZE), 0.008, 0.06),
      color: typeof point.color === 'string' && point.color.trim() ? point.color : undefined,
    });
  }
  return result;
}

/** Missing endpoints/self-connections are skipped. First valid arc ID wins. */
export function sanitizeArcs(arcs: readonly GlobeArc[], points: readonly GlobePoint[]): GlobeArc[] {
  const pointIds = new Set(sanitizePoints(points).map((point) => point.id));
  const ids = new Set<string>();
  const result: GlobeArc[] = [];
  if (!Array.isArray(arcs)) return result;
  for (const arc of arcs) {
    if (!arc || typeof arc.id !== 'string' || !arc.id.trim() || ids.has(arc.id)
      || !pointIds.has(arc.from) || !pointIds.has(arc.to) || arc.from === arc.to) continue;
    ids.add(arc.id);
    result.push({
      ...arc,
      width: clamp(finiteOr(arc.width, DEFAULT_ARC_WIDTH), 0.001, 0.02),
      altitude: typeof arc.altitude === 'number' && Number.isFinite(arc.altitude)
        ? clamp(arc.altitude, 0.02, 0.8) : undefined,
      animated: arc.animated !== false,
      color: typeof arc.color === 'string' && arc.color.trim() ? arc.color : undefined,
    });
  }
  return result;
}

