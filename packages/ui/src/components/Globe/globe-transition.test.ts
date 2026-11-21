// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  easeCubic,
  interpolateGlobeView,
  normalizeGlobeTransitionDuration,
  normalizeGlobeView,
} from './globe-transition';
import { DEFAULT_GLOBE_VIEW } from './globe-geometry';
import type { GlobeView } from './globe-types';

const view: GlobeView = { latitude: 0, longitude: 0, zoom: 1 };

describe('Globe transition duration and easing', () => {
  it('defaults to instantaneous behavior and keeps 0 an explicit snap', () => {
    expect(normalizeGlobeTransitionDuration()).toBe(0);
    expect(normalizeGlobeTransitionDuration(0, 800)).toBe(0);
    expect(normalizeGlobeTransitionDuration(undefined, 800)).toBe(800);
    expect(normalizeGlobeTransitionDuration(420.5)).toBe(420.5);
  });

  it('clamps negative/long durations and falls back safely for nonfinite inputs', () => {
    expect(normalizeGlobeTransitionDuration(-100)).toBe(0);
    expect(normalizeGlobeTransitionDuration(6000)).toBe(5000);
    expect(normalizeGlobeTransitionDuration(NaN)).toBe(0);
    expect(normalizeGlobeTransitionDuration(Infinity)).toBe(0);
    expect(normalizeGlobeTransitionDuration(NaN, 6000)).toBe(5000);
    expect(normalizeGlobeTransitionDuration(undefined, NaN)).toBe(0);
    expect(normalizeGlobeTransitionDuration(undefined, -100)).toBe(0);
  });

  it('has exact easing endpoints and symmetric cubic in/out', () => {
    expect(easeCubic(0)).toBe(0);
    expect(easeCubic(1)).toBe(1);
    expect(easeCubic(0.25)).toBe(0.0625);
    expect(easeCubic(0.5)).toBe(0.5);
    expect(easeCubic(0.75)).toBe(0.9375);
    for (let index = 0; index <= 100; index++) {
      const t = index / 100;
      expect(easeCubic(t)).toBeCloseTo(1 - easeCubic(1 - t), 12);
      if (index) expect(easeCubic(t)).toBeGreaterThanOrEqual(easeCubic((index - 1) / 100));
    }
  });

  it('clamps progress and treats NaN as a starting state', () => {
    expect(easeCubic(-2)).toBe(0);
    expect(easeCubic(2)).toBe(1);
    expect(easeCubic(-Infinity)).toBe(0);
    expect(easeCubic(Infinity)).toBe(1);
    expect(easeCubic(NaN)).toBe(0);
  });
});

describe('pure shortest-path Globe flights', () => {
  it('crosses the antimeridian eastward on the short path', () => {
    const source = { ...view, longitude: 170 };
    const target = { ...view, longitude: -170 };
    expect(interpolateGlobeView(source, target, 0)).toEqual(source);
    expect(interpolateGlobeView(source, target, 0.25).longitude).toBeCloseTo(171.25, 12);
    expect(interpolateGlobeView(source, target, 0.5).longitude).toBe(-180);
    expect(interpolateGlobeView(source, target, 0.75).longitude).toBeCloseTo(-171.25, 12);
    expect(interpolateGlobeView(source, target, 1)).toEqual(target);
  });

  it('crosses the antimeridian westward on the short path', () => {
    const source = { ...view, longitude: -170 };
    const target = { ...view, longitude: 170 };
    expect(interpolateGlobeView(source, target, 0.25).longitude).toBeCloseTo(-171.25, 12);
    expect(interpolateGlobeView(source, target, 0.5).longitude).toBe(-180);
    expect(interpolateGlobeView(source, target, 0.75).longitude).toBeCloseTo(171.25, 12);
  });

  it('interpolates latitude/zoom with the same easing and preserves exact normalized endpoints', () => {
    const source = { latitude: -40, longitude: -30, zoom: 0.75 };
    const target = { latitude: 40, longitude: 30, zoom: 2 };
    expect(interpolateGlobeView(source, target, -1)).toEqual(source);
    expect(interpolateGlobeView(source, target, 0.25)).toEqual({
      latitude: -35,
      longitude: -26.25,
      zoom: 0.828125,
    });
    expect(interpolateGlobeView(source, target, 0.5)).toEqual({
      latitude: 0,
      longitude: 0,
      zoom: 1.375,
    });
    expect(interpolateGlobeView(source, target, 2)).toEqual(target);
  });

  it('normalizes source and target before interpolation, including multiple revolutions', () => {
    const source = { latitude: -150, longitude: 530, zoom: -10 };
    const target = { latitude: 150, longitude: 910, zoom: 10 };
    expect(interpolateGlobeView(source, target, 0)).toEqual({
      latitude: -90,
      longitude: 170,
      zoom: 0.75,
    });
    expect(interpolateGlobeView(source, target, 0.5)).toEqual({
      latitude: 0,
      longitude: -180,
      zoom: 1.375,
    });
    expect(interpolateGlobeView(source, target, 1)).toEqual({
      latitude: 90,
      longitude: -170,
      zoom: 2,
    });
  });

  it('keeps equal/equivalent views stationary without NaN or accidental whole turns', () => {
    const source = { latitude: 20, longitude: 179, zoom: 1.2 };
    const target = { ...source, longitude: 179 + 720 };
    for (let index = 0; index <= 20; index++)
      expect(interpolateGlobeView(source, target, index / 20)).toEqual(source);
    expect(
      interpolateGlobeView({ ...view, longitude: 180 }, { ...view, longitude: -180 }, 0.5)
    ).toEqual({ ...view, longitude: -180 });
  });

  it('chooses a deterministic finite semicircle for exact antipodal camera angles', () => {
    expect(interpolateGlobeView(view, { ...view, longitude: 180 }, 0.5)).toEqual({
      ...view,
      longitude: -90,
    });
    const source = { latitude: 90, longitude: -180, zoom: 0.75 };
    const target = { latitude: -90, longitude: 0, zoom: 2 };
    for (let index = 0; index <= 100; index++) {
      const current = interpolateGlobeView(source, target, index / 100);
      expect(Object.values(current).every(Number.isFinite)).toBe(true);
      expect(current.latitude).toBeGreaterThanOrEqual(-90);
      expect(current.latitude).toBeLessThanOrEqual(90);
      expect(current.longitude).toBeGreaterThanOrEqual(-180);
      expect(current.longitude).toBeLessThan(180);
    }
  });

  it('falls back missing/invalid target axes to the current normalized source', () => {
    const source = { latitude: 35, longitude: 181, zoom: 1.6 };
    expect(interpolateGlobeView(source, { latitude: NaN, longitude: Infinity }, 1)).toEqual({
      latitude: 35,
      longitude: -179,
      zoom: 1.6,
    });
    expect(interpolateGlobeView(source, { latitude: 45 }, 0.5)).toEqual({
      latitude: 40,
      longitude: -179,
      zoom: 1.6,
    });
    expect(interpolateGlobeView(source, undefined, 0.5)).toEqual(normalizeGlobeView(source));
    expect(interpolateGlobeView(undefined, undefined, 0.5)).toEqual(DEFAULT_GLOBE_VIEW);
  });

  it('uses safe defaults for invalid source/progress and supports interruption from any current view', () => {
    const invalid = { latitude: NaN, longitude: Infinity, zoom: NaN };
    expect(interpolateGlobeView(invalid, { ...view, longitude: 10 }, NaN)).toEqual(
      DEFAULT_GLOBE_VIEW
    );
    expect(interpolateGlobeView(view, { ...view, longitude: 10 }, Infinity)).toEqual({
      ...view,
      longitude: 10,
    });
    const current = interpolateGlobeView(
      { ...view, longitude: 170 },
      { ...view, longitude: -170 },
      0.3
    );
    expect(interpolateGlobeView(current, { ...view, longitude: 40 }, 0)).toEqual(current);
    expect(interpolateGlobeView(current, { ...view, longitude: 40 }, 1)).toEqual({
      ...view,
      longitude: 40,
    });
  });

  it('never mutates frozen source or target view objects', () => {
    const source = Object.freeze({ ...view, longitude: 170 });
    const target = Object.freeze({ ...view, longitude: -170 });
    expect(interpolateGlobeView(source, target, 0.5)).toEqual({ ...view, longitude: -180 });
    expect(source.longitude).toBe(170);
    expect(target.longitude).toBe(-170);
  });
});
