// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import {
  buildGlobeArc, coordinateToVector, DEFAULT_ARC_WIDTH, DEFAULT_GLOBE_VIEW,
  DEFAULT_POINT_SIZE, globeRadius, interpolateGeodesic, normalizeGlobeView,
  normalizeLongitude, projectGlobePoint, projectGlobePosition, rotateGlobeVector,
  sanitizeArcs, sanitizePoints,
} from './globe-geometry';
import { getLandDots, GLOBE_COASTLINES, GLOBE_GEOGRAPHY_SOURCE, GLOBE_LAND_POLYGONS } from './globe-geography';
import type { GlobeVector, GlobeVectorInput } from './globe-geometry';
import type { GlobeArc, GlobePoint, GlobeView } from './globe-types';

const view: GlobeView = { latitude: 0, longitude: 0, zoom: 1 };
const point = (id: string, latitude = 0, longitude = 0): GlobePoint => ({ id, latitude, longitude });
function expectVector(actual: GlobeVectorInput, expected: GlobeVectorInput, precision = 10) {
  for (let i = 0; i < 3; i++) expect(actual[i]).toBeCloseTo(expected[i], precision);
}
function expectUnit(vector: GlobeVectorInput) {
  expect(vector.every(Number.isFinite)).toBe(true);
  expect(Math.hypot(...vector)).toBeCloseTo(1, 10);
}

describe('globe coordinates and view normalization', () => {
  it('maps east to +X, north to +Y, (0,0) to the front +Z', () => {
    expectVector(coordinateToVector(0, 0), [0, 0, 1]);
    expectVector(coordinateToVector(0, 90), [1, 0, 0]);
    expectVector(coordinateToVector(0, -90), [-1, 0, 0]);
    expectVector(coordinateToVector(90, 40), [0, 1, 0]);
    expectVector(coordinateToVector(-90, -40), [0, -1, 0]);
    expectVector(coordinateToVector(0, 180, 2), [0, 0, -2]);
  });

  it('normalizes the antimeridian and longitudes with multiple revolutions', () => {
    expect(normalizeLongitude(180)).toBe(-180);
    expect(normalizeLongitude(-180)).toBe(-180);
    expect(normalizeLongitude(540)).toBe(-180);
    expect(normalizeLongitude(720 + 25)).toBe(25);
    expect(normalizeLongitude(-720 - 25)).toBe(-25);
    expect(normalizeLongitude(NaN)).toBe(0);
    expect(Object.is(normalizeLongitude(-0), -0)).toBe(false);
  });

  it('clamps view latitude/zoom and fills missing or non-finite values without mutation', () => {
    expect(normalizeGlobeView()).toEqual(DEFAULT_GLOBE_VIEW);
    expect(normalizeGlobeView({ latitude: 150, longitude: 380, zoom: 10 })).toEqual({ latitude: 90, longitude: 20, zoom: 2 });
    expect(normalizeGlobeView({ latitude: -150, zoom: -10 })).toEqual({ latitude: -90, longitude: 105, zoom: 0.75 });
    const fallback = Object.freeze({ latitude: -20, longitude: -150, zoom: 1.2 });
    const input = Object.freeze({ latitude: NaN, longitude: Infinity, zoom: NaN });
    expect(normalizeGlobeView(input, fallback)).toEqual(fallback);
    expect(normalizeGlobeView({ zoom: 1.5 }, fallback)).toEqual({ ...fallback, zoom: 1.5 });
  });

  it('rotates any requested center to +Z, including poles and the dateline', () => {
    for (const latitude of [-90, -60, 0, 20, 75, 90]) {
      for (const longitude of [-180, -110, 0, 105, 179]) {
        expectVector(rotateGlobeVector(coordinateToVector(latitude, longitude), { latitude, longitude, zoom: 1 }), [0, 0, 1]);
      }
    }
  });

  it('preserves radius under view rotation and leaves tuple inputs unchanged', () => {
    const vector = Object.freeze([0.4, -0.3, 0.5]) as GlobeVectorInput;
    const rotated = rotateGlobeVector(vector, { latitude: 45, longitude: 83, zoom: 2 });
    expect(Math.hypot(...rotated)).toBeCloseTo(Math.hypot(...vector), 12);
    expect(vector).toEqual([0.4, -0.3, 0.5]);
  });
});

describe('orthographic projection shared with WebGL', () => {
  it('uses CSS pixels and the uncapped .75..2 zoom range', () => {
    expect(globeRadius(800, 500, 1)).toBe(190);
    expect(globeRadius(800, 500, 0.75)).toBe(142.5);
    expect(globeRadius(800, 500, 2)).toBe(380);
    expect(globeRadius(800, 500, 9)).toBe(380);
    expect(globeRadius(800, 500, -2)).toBe(142.5);
    expect(globeRadius(0, 500)).toBe(0);
    expect(globeRadius(-2, 500)).toBe(0);
    expect(globeRadius(NaN, 500)).toBe(0);
    expect(globeRadius(800, Infinity)).toBe(0);
    expect(globeRadius(800, 500, NaN)).toBe(190);
  });

  it('centers a chosen coordinate and inverts canvas Y for northern points', () => {
    const chosen = { latitude: 20, longitude: 105, zoom: 1 };
    expect(projectGlobePoint(point('center', 20, 105), chosen, 800, 500)).toEqual({ x: 400, y: 250, visible: true });
    const north = projectGlobePoint(point('north', 30), view, 800, 500);
    expect(north.x).toBeCloseTo(400);
    expect(north.y).toBeCloseTo(155);
    expect(north.visible).toBe(true);
    const east = projectGlobePoint(point('east', 0, 30), view, 800, 500);
    expect(east.x).toBeCloseTo(495);
    expect(east.y).toBeCloseTo(250);
  });

  it('hides backside/surface-limb anchors and reveals them after rotation', () => {
    expect(projectGlobePoint(point('back', 0, 180), view, 800, 500).visible).toBe(false);
    expect(projectGlobePoint(point('limb', 0, 90), view, 800, 500).visible).toBe(false);
    expect(projectGlobePoint(point('near', 0, 89.99), view, 800, 500).visible).toBe(true);
    expect(projectGlobePoint(point('back', 0, 180), { ...view, longitude: 180 }, 800, 500).visible).toBe(true);
  });

  it('occludes elevated rear arc positions only when the unit sphere blocks the camera ray', () => {
    expect(projectGlobePosition([1.1, 0, -0.2], view, 800, 500).visible).toBe(true);
    expect(projectGlobePosition([0.9, 0, -0.7], view, 800, 500).visible).toBe(false);
    expect(projectGlobePosition([1, 0, 0], view, 800, 500).visible).toBe(false);
    // A marker remains tied to its surface anchor, rather than peeking through the limb.
    expect(projectGlobePoint(point('rear', 0, 95), view, 800, 500, 0.2).visible).toBe(false);
  });

  it('hides positions outside the stage when close zoom intentionally crops the globe', () => {
    expect(projectGlobePoint(point('high', 60), view, 500, 500).visible).toBe(true);
    expect(projectGlobePoint(point('high', 60), { ...view, zoom: 2 }, 500, 500).visible).toBe(false);
    expect(projectGlobePoint(point('center'), view, 0, 0).visible).toBe(false);
  });
});

describe('short geodesics and elevated arc sampling', () => {
  it('crosses the antimeridian on the short side rather than through Greenwich', () => {
    const a = coordinateToVector(0, 170);
    const b = coordinateToVector(0, -170);
    expectVector(interpolateGeodesic(a, b, 0.5), [0, 0, -1]);
    expectVector(interpolateGeodesic(a, b, 0), a);
    expectVector(interpolateGeodesic(a, b, 1), b);
    const samples = buildGlobeArc(a, b, 0.2, 64);
    expect(samples).toHaveLength(65);
    expectVector(samples[0], a);
    expectVector(samples[64], b);
    expectVector(samples[32], [0, 0, -1.2]);
    expect(samples.every((sample) => sample[2] < 0)).toBe(true);
  });

  it('handles coincident and near-coincident endpoints without NaN or a zero vector', () => {
    const a = coordinateToVector(37.77, -122.42);
    for (let i = 0; i <= 20; i++) expectUnit(interpolateGeodesic(a, a, i / 20));
    expectVector(interpolateGeodesic(a, a, 0.5), a);
    const close = coordinateToVector(37.7700000001, -122.4199999999);
    expectUnit(interpolateGeodesic(a, close, 0.5));
    expect(buildGlobeArc(a, a).every((sample) => sample.every(Number.isFinite))).toBe(true);
  });

  it('uses a deterministic nonzero semicircle for exact antipodes and reverses consistently', () => {
    const a: GlobeVector = [0, 0, 1];
    const b: GlobeVector = [0, 0, -1];
    const midpoint = interpolateGeodesic(a, b, 0.5);
    expectVector(midpoint, [1, 0, 0]);
    expect(interpolateGeodesic(a, b, 0.5)).toEqual(midpoint);
    for (let i = 0; i <= 32; i++) {
      const t = i / 32;
      expectUnit(interpolateGeodesic(a, b, t));
      expectVector(interpolateGeodesic(a, b, t), interpolateGeodesic(b, a, 1 - t));
    }
    const oblique = coordinateToVector(23, 64);
    const opposite = oblique.map((component) => -component) as GlobeVector;
    expectUnit(interpolateGeodesic(oblique, opposite, 0.5));
  });

  it('handles nearly antipodal routes in the actual endpoint plane', () => {
    const a = coordinateToVector(0, 0);
    const b = coordinateToVector(0.00001, 179.99999);
    const middle = interpolateGeodesic(a, b, 0.5);
    expectUnit(middle);
    expect(middle[0]).toBeGreaterThan(0.5);
    expect(middle[1]).toBeGreaterThan(0.5);
    expect(Math.abs(middle[2])).toBeLessThan(1e-5);
  });

  it('bounds altitude/segment counts and normalizes arbitrary radii', () => {
    const a: GlobeVector = [0, 0, 5];
    const b: GlobeVector = [2, 0, 0];
    const high = buildGlobeArc(a, b, 5, 8);
    expect(Math.hypot(...high[4])).toBeCloseTo(1.8);
    expectVector(high[0], [0, 0, 1]);
    expectVector(high[8], [1, 0, 0]);
    expect(Math.hypot(...buildGlobeArc(a, b, -1, 8)[4])).toBeCloseTo(1.02);
    expect(buildGlobeArc(a, b, undefined, -2)).toHaveLength(3);
    expect(buildGlobeArc(a, b, undefined, Infinity)).toHaveLength(65);
    expect(buildGlobeArc(a, b, undefined, 900)).toHaveLength(513);
    expectUnit(interpolateGeodesic([0, 0, 0], [NaN, 0, 0], 0.5));
  });
});

describe('data validation and first-valid-ID semantics', () => {
  it('skips invalid points without reserving IDs and never mutates input', () => {
    const first = Object.freeze({ ...point('kept', 10, 540), size: 0.5 });
    const input = Object.freeze([
      point('same', NaN), point('same', 40, -75), point('same', 55, 20),
      point('', 10), point('  ', 10), point('invalid', 91), point('invalid', -91),
      point('infinity', 0, Infinity), first,
    ]);
    const result = sanitizePoints(input);
    expect(result.map((item) => item.id)).toEqual(['same', 'kept']);
    expect(result[0].latitude).toBe(40);
    expect(result[1]).toMatchObject({ longitude: -180, size: 0.06 });
    expect(first.longitude).toBe(540);
    expect(first.size).toBe(0.5);
    expect(result[1]).not.toBe(first);
  });

  it('clamps/defaults point sizes and rejects blank per-point colors', () => {
    const result = sanitizePoints([
      { ...point('a'), size: 0 }, { ...point('b'), size: NaN },
      { ...point('c'), size: Infinity }, { ...point('d'), color: ' ' },
      { ...point('e'), color: 'rgb(1, 2, 3)' },
    ]);
    expect(result.map((item) => item.size)).toEqual([0.008, DEFAULT_POINT_SIZE, DEFAULT_POINT_SIZE, DEFAULT_POINT_SIZE, DEFAULT_POINT_SIZE]);
    expect(result[3].color).toBeUndefined();
    expect(result[4].color).toBe('rgb(1, 2, 3)');
  });

  it('skips missing/self endpoints and duplicate arcs, keeping the first valid ID', () => {
    const input: GlobeArc[] = [
      { id: 'same', from: 'missing', to: 'b' }, { id: 'same', from: 'a', to: 'b' },
      { id: 'same', from: 'b', to: 'a' }, { id: 'self', from: 'a', to: 'a' },
      { id: '', from: 'a', to: 'b' }, { id: 'bad-endpoint', from: 'bad', to: 'b' },
    ];
    const result = sanitizeArcs(input, [point('a'), point('b'), point('bad', NaN)]);
    expect(result.map((arc) => arc.id)).toEqual(['same']);
    expect(result[0]).toMatchObject({ from: 'a', to: 'b', width: DEFAULT_ARC_WIDTH, animated: true });
  });

  it('clamps arc width/altitude, defaults non-finite values, and preserves animation opt-out', () => {
    const points = [point('a'), point('b', 10, 20)];
    const input = Object.freeze([
      Object.freeze({ id: 'wide', from: 'a', to: 'b', width: 1, altitude: 5, animated: false }),
      Object.freeze({ id: 'thin', from: 'a', to: 'b', width: -1, altitude: -1 }),
      Object.freeze({ id: 'default', from: 'a', to: 'b', width: NaN, altitude: NaN, color: '' }),
    ]);
    const result = sanitizeArcs(input, points);
    expect(result[0]).toMatchObject({ width: 0.02, altitude: 0.8, animated: false });
    expect(result[1]).toMatchObject({ width: 0.001, altitude: 0.02, animated: true });
    expect(result[2]).toMatchObject({ width: DEFAULT_ARC_WIDTH });
    expect(result[2].altitude).toBeUndefined();
    expect(result[2].color).toBeUndefined();
    expect(input[0].width).toBe(1);
  });
});

describe('bundled public-domain geography', () => {
  it('retains actual Natural Earth rings, including the Caspian hole, within a compact budget', () => {
    expect(GLOBE_GEOGRAPHY_SOURCE.license).toBe('Public domain');
    expect(GLOBE_GEOGRAPHY_SOURCE.url).toContain('ne_110m_land.zip');
    expect(GLOBE_LAND_POLYGONS).toHaveLength(127);
    expect(GLOBE_COASTLINES).toHaveLength(128);
    expect(GLOBE_LAND_POLYGONS.some((polygon) => polygon.length > 1)).toBe(true);
    const pairs = GLOBE_COASTLINES.reduce((count, ring) => count + ring.length / 2, 0);
    expect(pairs).toBeGreaterThan(4900);
    expect(pairs).toBeLessThan(5150);
    for (const polygon of GLOBE_LAND_POLYGONS) {
      for (const ring of polygon) {
        expect(GLOBE_COASTLINES.includes(ring)).toBe(true);
        expect(ring.length % 2).toBe(0);
        for (let i = 0; i < ring.length; i += 2) {
          expect(Number.isFinite(ring[i])).toBe(true);
          expect(Math.abs(ring[i])).toBeLessThanOrEqual(180);
          expect(Math.abs(ring[i + 1])).toBeLessThanOrEqual(90);
        }
      }
    }
  });

  it('provides cached equal-area land dots, including Antarctica, without duplicated source arrays', () => {
    const dots = getLandDots();
    expect(getLandDots()).toBe(dots);
    expect(dots.length / 2).toBeGreaterThan(2500);
    expect(dots.length / 2).toBeLessThan(4000);
    expect(dots.length % 2).toBe(0);
    let antarctic = false;
    for (let i = 0; i < dots.length; i += 2) {
      expect(Math.abs(dots[i])).toBeLessThanOrEqual(180);
      expect(Math.abs(dots[i + 1])).toBeLessThanOrEqual(90);
      if (dots[i + 1] < -75) antarctic = true;
    }
    expect(antarctic).toBe(true);
  });
});

describe('SSR import safety', () => {
  it('imports the renderer with no DOM/context/animation access', async () => {
    const browserAccess = vi.fn(() => { throw new Error('browser resource accessed during import'); });
    vi.stubGlobal('window', undefined);
    vi.stubGlobal('document', undefined);
    vi.stubGlobal('requestAnimationFrame', browserAccess);
    try {
      const renderer = await import('./globe-renderer');
      expect(typeof renderer.createGlobeRenderer).toBe('function');
      expect(browserAccess).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
