// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  buildGlobeData,
  normalizeGlobeSearchQuery,
  normalizeHiddenCategories,
  sanitizeCategories,
  searchGlobePoints,
} from './globe-data';
import { DEFAULT_ARC_WIDTH, DEFAULT_POINT_SIZE } from './globe-geometry';
import type { GlobeArc, GlobeCategory, GlobePoint, GlobeValueScale } from './globe-types';

const point = (id: string, extras: Partial<GlobePoint> = {}): GlobePoint => ({
  id,
  latitude: 0,
  longitude: 0,
  ...extras,
});
const arc = (id: string, from: string, to: string, extras: Partial<GlobeArc> = {}): GlobeArc => ({
  id,
  from,
  to,
  ...extras,
});
const size = (
  value: number,
  domain: readonly [number, number],
  range: readonly [number, number] = [0.012, 0.036]
) => buildGlobeData([point('p', { value })], [], [], { domain, range }).renderedPoints[0].size;

// Counts and scaling always belong to the full valid data, never a filtered subset.
describe('Globe category and canonical data preparation', () => {
  it('trims categories without mutation and gives the first valid ID/name precedence', () => {
    const raw = Object.freeze([
      Object.freeze({ id: ' a ', name: ' ', color: 'red' }),
      Object.freeze({ id: ' ', name: 'Invalid' }),
      Object.freeze({ id: ' a ', name: ' Alpha ', color: ' blue ' }),
      Object.freeze({ id: 'a', name: 'Duplicate', color: 'green' }),
      Object.freeze({ id: 'b', name: 'Beta', color: ' ' }),
    ]);
    expect(sanitizeCategories(raw)).toEqual([
      { id: 'a', name: 'Alpha', color: 'blue' },
      { id: 'b', name: 'Beta', color: undefined },
    ]);
    expect(raw[2]).toEqual({ id: ' a ', name: ' Alpha ', color: ' blue ' });
  });

  it('ignores invalid runtime category and hidden-ID inputs safely', () => {
    expect(sanitizeCategories(null as unknown as GlobeCategory[])).toEqual([]);
    expect(
      sanitizeCategories([
        null,
        { id: 3, name: 'Three' },
        { id: 'x', name: 3 },
        { id: 'ok', name: 'Okay' },
      ] as unknown as GlobeCategory[])
    ).toEqual([{ id: 'ok', name: 'Okay', color: undefined }]);
    expect(normalizeHiddenCategories(null as unknown as string[])).toEqual([]);
    expect(
      normalizeHiddenCategories([
        ' a ',
        '',
        'a',
        'unknown',
        ' unknown ',
        null,
        2,
      ] as unknown as string[])
    ).toEqual(['a', 'unknown']);
  });

  it('normalizes point IDs/categories and arcs consistently while preserving source data', () => {
    const rawPoints = Object.freeze([
      Object.freeze(point(' a ', { longitude: 540, category: ' group ', value: 0 })),
      Object.freeze(point('a', { name: 'Duplicate', value: 200 })),
      Object.freeze(point('b', { category: ' ' })),
    ]);
    const rawArcs = Object.freeze([Object.freeze(arc(' connection ', ' a ', ' b '))]);
    const data = buildGlobeData(
      rawPoints,
      rawArcs,
      [{ id: 'group', name: 'Group', color: 'red' }],
      true
    );
    expect(data.points.map((p) => p.id)).toEqual(['a', 'b']);
    expect(data.points[0]).toMatchObject({
      longitude: -180,
      category: 'group',
      size: DEFAULT_POINT_SIZE,
    });
    expect(data.points[0].color).toBeUndefined();
    expect(data.renderedPoints[0]).toMatchObject({
      color: 'red',
      size: Math.sqrt((0.012 ** 2 + 0.036 ** 2) / 2),
    });
    expect(data.renderedPoints[0]).not.toBe(data.points[0]);
    expect(data.arcs[0]).toMatchObject({
      id: 'connection',
      from: 'a',
      to: 'b',
      width: DEFAULT_ARC_WIDTH,
      animated: true,
    });
    expect(rawPoints[0].id).toBe(' a ');
    expect(rawPoints[0].size).toBeUndefined();
    expect(rawArcs[0]).toEqual({ id: ' connection ', from: ' a ', to: ' b ' });
  });

  it('allows an invalid first point or arc to be replaced by a later valid duplicate', () => {
    const data = buildGlobeData(
      [
        point('same', { latitude: NaN }),
        point(' same ', { latitude: 91 }),
        point('same', { longitude: Infinity }),
        point(' same ', { name: 'Valid' }),
        point('b'),
        point(' '),
        point('bad', { latitude: -91 }),
      ],
      [
        arc('x', 'same', 'missing'),
        arc(' x ', 'same', 'same'),
        arc('x', ' same ', ' b '),
        arc(' x ', 'b', 'same'),
      ]
    );
    expect(data.points.map((p) => p.id)).toEqual(['same', 'b']);
    expect(data.points[0].name).toBe('Valid');
    expect(data.arcs).toHaveLength(1);
    expect(data.arcs[0]).toMatchObject({ from: 'same', to: 'b' });
  });

  it('counts only full valid, first-wins points, including unknown/zero-count categories', () => {
    const data = buildGlobeData(
      [
        point('a', { category: ' east ' }),
        point('a', { category: 'west' }),
        point('b', { category: 'east' }),
        point('c', { category: 'unknown' }),
        point('d'),
        point('invalid', { latitude: 100, category: 'west' }),
      ],
      [],
      [
        { id: 'east', name: 'East' },
        { id: 'west', name: 'West' },
      ],
      true,
      ['east', 'unknown']
    );
    expect(Array.from(data.counts)).toEqual([
      ['east', 2],
      ['west', 0],
      ['unknown', 1],
    ]);
    expect(data.points).toHaveLength(4);
    expect(data.renderedPoints.map((p) => p.id)).toEqual(['d']);
  });

  it('uses category color only when a point has no explicit nonblank color', () => {
    const data = buildGlobeData(
      [
        point('explicit', { category: 'cat', color: ' var(--marker) ' }),
        point('blank', { category: 'cat', color: '  ' }),
        point('default', { category: 'cat' }),
        point('unknown', { category: 'unknown' }),
        point('none'),
      ],
      [],
      [{ id: 'cat', name: 'Category', color: ' oklch(60% 0.2 30) ' }]
    );
    expect(data.renderedPoints.map((p) => p.color)).toEqual([
      ' var(--marker) ',
      'oklch(60% 0.2 30)',
      'oklch(60% 0.2 30)',
      undefined,
      undefined,
    ]);
    expect(data.points.map((p) => p.color)).toEqual([
      ' var(--marker) ',
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });

  it('hides unknown-category matches but leaves uncategorized points and callback arcs intact', () => {
    const data = buildGlobeData(
      [
        point('hidden', { category: 'unknown' }),
        point('visible', { category: 'visible' }),
        point('none'),
        point('blank', { category: ' ' }),
      ],
      [
        arc('hide', 'hidden', 'visible'),
        arc('keep', 'none', 'visible'),
        arc('empty', 'blank', 'none'),
      ],
      [],
      false,
      [' unknown ', '', 'unknown']
    );
    expect(data.points).toHaveLength(4);
    expect(data.arcs).toHaveLength(3);
    expect(data.renderedPoints.map((p) => p.id)).toEqual(['visible', 'none', 'blank']);
    expect(data.renderedArcs.map((a) => a.id)).toEqual(['keep', 'empty']);
    expect(data.renderedArcs[0]).toBe(data.arcs[1]);
  });

  it('handles empty/non-array raw input without throwing', () => {
    expect(buildGlobeData()).toEqual({
      points: [],
      renderedPoints: [],
      arcs: [],
      renderedArcs: [],
      categories: [],
      counts: new Map(),
    });
    expect(
      buildGlobeData(null as unknown as GlobePoint[], null as unknown as GlobeArc[]).points
    ).toEqual([]);
  });
});

describe('Globe area-aware value scales', () => {
  it('maps finite negative/zero/positive numeric values with linear area, not radius', () => {
    const data = buildGlobeData(
      [point('low', { value: -10 }), point('middle', { value: 0 }), point('high', { value: 10 })],
      [],
      [],
      true
    );
    expect(data.renderedPoints[0].size).toBe(0.012);
    expect(data.renderedPoints[1].size).toBeCloseTo(Math.sqrt((0.012 ** 2 + 0.036 ** 2) / 2), 12);
    expect(data.renderedPoints[2].size).toBe(0.036);
    expect(data.points.every((p) => p.size === DEFAULT_POINT_SIZE)).toBe(true);
  });

  it('excludes strings, missing values, NaN and infinities from domain and scaling', () => {
    const data = buildGlobeData(
      [
        point('low', { value: 2 }),
        point('high', { value: 4 }),
        point('string', { value: '10000' }),
        point('missing'),
        point('nan', { value: NaN }),
        point('infinite', { value: Infinity }),
      ],
      [],
      [],
      true
    );
    expect(data.renderedPoints.map((p) => p.size)).toEqual([
      0.012,
      0.036,
      DEFAULT_POINT_SIZE,
      DEFAULT_POINT_SIZE,
      DEFAULT_POINT_SIZE,
      DEFAULT_POINT_SIZE,
    ]);
  });

  it('keeps defaults for entirely nonnumeric datasets, even with an explicit domain', () => {
    const raw = [point('string', { value: '4' }), point('missing'), point('nan', { value: NaN })];
    for (const scale of [true, { domain: [0, 10] }] as const) {
      expect(
        buildGlobeData(raw, [], [], scale).renderedPoints.every(
          (p) => p.size === DEFAULT_POINT_SIZE
        )
      ).toBe(true);
    }
  });

  it('gives all finite explicit raw sizes priority, clamping zero/negative/large sizes', () => {
    const data = buildGlobeData(
      [
        point('default-size', { value: 100, size: DEFAULT_POINT_SIZE }),
        point('zero', { value: 100, size: 0 }),
        point('negative', { value: 100, size: -1 }),
        point('large', { value: 100, size: 20 }),
        point('nan-size', { value: 100, size: NaN }),
        point('infinite-size', { value: 100, size: Infinity }),
      ],
      [],
      [],
      { domain: [0, 100] }
    );
    expect(data.renderedPoints.map((p) => p.size)).toEqual([
      DEFAULT_POINT_SIZE,
      0.008,
      0.008,
      0.06,
      0.036,
      0.036,
    ]);
    expect(data.points[4].size).toBe(DEFAULT_POINT_SIZE);
  });

  it('computes its domain before filtering and includes explicitly-sized points', () => {
    const raw = [
      point('low', { value: 0, category: 'hide', size: 0.02 }),
      point('middle', { value: 50 }),
      point('high', { value: 100, category: 'hide' }),
    ];
    const all = buildGlobeData(raw, [], [], true);
    const filtered = buildGlobeData(raw, [], [], true, ['hide']);
    expect(filtered.renderedPoints).toHaveLength(1);
    expect(filtered.renderedPoints[0].size).toBe(all.renderedPoints[1].size);
    expect(filtered.renderedPoints[0].size).toBeCloseTo(
      Math.sqrt((0.012 ** 2 + 0.036 ** 2) / 2),
      12
    );
  });

  it('ignores invalid and duplicate source points when inferring the domain', () => {
    const data = buildGlobeData(
      [
        point('a', { value: 0 }),
        point(' a ', { value: 1000 }),
        point('bad', { latitude: NaN, value: -1000 }),
        point('b', { value: 10 }),
      ],
      [],
      [],
      true
    );
    expect(data.renderedPoints.map((p) => p.size)).toEqual([0.012, 0.036]);
  });

  it('uses a sensible area midpoint for equal explicit or inferred domains', () => {
    const expected = Math.sqrt((0.012 ** 2 + 0.036 ** 2) / 2);
    expect(
      buildGlobeData(
        [point('a', { value: -5 }), point('b', { value: -5 })],
        [],
        [],
        true
      ).renderedPoints.map((p) => p.size)
    ).toEqual([expected, expected]);
    expect(size(-100, [5, 5])).toBeCloseTo(expected, 12);
    expect(size(100, [5, 5])).toBeCloseTo(expected, 12);
  });

  it('normalizes reversed domains/ranges and clamps values to explicit endpoints', () => {
    expect(size(-20, [10, -10], [0.04, 0.01])).toBe(0.01);
    expect(size(20, [10, -10], [0.04, 0.01])).toBe(0.04);
    expect(size(0, [10, -10], [0.04, 0.01])).toBeCloseTo(
      Math.sqrt((0.01 ** 2 + 0.04 ** 2) / 2),
      12
    );
  });

  it('clamps radius ranges, including negative and equal finite ranges', () => {
    expect(size(0, [0, 100], [-2, 2])).toBe(0.008);
    expect(size(100, [0, 100], [-2, 2])).toBe(0.06);
    expect(size(30, [0, 100], [-5, -1])).toBe(0.008);
    expect(size(30, [0, 100], [0.02, 0.02])).toBe(0.02);
  });

  it('falls back from nonfinite options to the inferred domain/default range', () => {
    const data = buildGlobeData(
      [point('low', { value: -2 }), point('high', { value: 2 })],
      [],
      [],
      {
        domain: [NaN, Infinity],
        range: [Infinity, NaN],
      }
    );
    expect(data.renderedPoints.map((p) => p.size)).toEqual([0.012, 0.036]);
    expect(
      buildGlobeData([point('p', { value: 10 })], [], [], {} as GlobeValueScale).renderedPoints[0]
        .size
    ).toBeCloseTo(Math.sqrt((0.012 ** 2 + 0.036 ** 2) / 2), 12);
  });

  it('avoids overflow for a domain spanning finite numeric extremes', () => {
    const max = Number.MAX_VALUE;
    expect(size(-max, [-max, max])).toBe(0.012);
    expect(size(max, [-max, max])).toBe(0.036);
    expect(size(0, [-max, max])).toBeCloseTo(Math.sqrt((0.012 ** 2 + 0.036 ** 2) / 2), 12);
    expect(Number.isFinite(size(max / 2, [-max, max]))).toBe(true);
  });

  it('is opt-in and never mutates the scale tuples or source objects', () => {
    const raw = Object.freeze([Object.freeze(point('p', { value: 10 }))]);
    const scale = Object.freeze({
      domain: Object.freeze([0, 10] as const),
      range: Object.freeze([0.03, 0.01] as const),
    });
    expect(buildGlobeData(raw).renderedPoints[0].size).toBe(DEFAULT_POINT_SIZE);
    expect(buildGlobeData(raw, [], [], false).renderedPoints[0].size).toBe(DEFAULT_POINT_SIZE);
    expect(buildGlobeData(raw, [], [], scale).renderedPoints[0].size).toBe(0.03);
    expect(scale.range).toEqual([0.03, 0.01]);
    expect(raw[0].size).toBeUndefined();
  });
});

describe('local Globe point search', () => {
  const points = Object.freeze([
    Object.freeze(point('A-1', { name: 'MÜNCHEN', category: ' Europe ' })),
    Object.freeze(point('tokyo', { name: '東京', category: 'east' })),
    Object.freeze(point('literal', { name: 'a.*b [test]' })),
    Object.freeze(point('empty')),
  ]);
  const categories = Object.freeze([
    { id: ' Europe ', name: ' Western ÉUROPE ' },
    { id: 'east', name: '東アジア' },
  ]);

  it('trims/lowers queries and safely accepts invalid runtime values', () => {
    expect(normalizeGlobeSearchQuery('  MÜNCHEN  ')).toBe('münchen');
    expect(normalizeGlobeSearchQuery('  東京  ')).toBe('東京');
    expect(normalizeGlobeSearchQuery()).toBe('');
    expect(normalizeGlobeSearchQuery(null as unknown as string)).toBe('');
    expect(normalizeGlobeSearchQuery(42 as unknown as string)).toBe('');
  });

  it('matches IDs, names, category IDs and normalized display names case-insensitively', () => {
    expect(searchGlobePoints(points, 'a-1', categories).map((p) => p.id)).toEqual(['A-1']);
    expect(searchGlobePoints(points, ' MÜnchen ', categories).map((p) => p.id)).toEqual(['A-1']);
    expect(searchGlobePoints(points, 'EUROPE', categories).map((p) => p.id)).toEqual(['A-1']);
    expect(searchGlobePoints(points, 'éurope', categories).map((p) => p.id)).toEqual(['A-1']);
    expect(searchGlobePoints(points, '東京', categories).map((p) => p.id)).toEqual(['tokyo']);
    expect(searchGlobePoints(points, '東アジア', categories).map((p) => p.id)).toEqual(['tokyo']);
  });

  it('treats punctuation as a literal substring, preserving point object references', () => {
    const matches = searchGlobePoints(points, '.*');
    expect(matches).toEqual([points[2]]);
    expect(matches[0]).toBe(points[2]);
    expect(searchGlobePoints(points, '[test]')).toEqual([points[2]]);
    expect(searchGlobePoints(points, 'no matches')).toEqual([]);
  });

  it('preserves the original array on blank queries and uses first valid category names', () => {
    expect(searchGlobePoints(points, ' \n\t ')).toBe(points);
    expect(searchGlobePoints(points, '')).toBe(points);
    expect(
      searchGlobePoints(points, 'other', [...categories, { id: 'Europe', name: 'Other' }])
    ).toEqual([]);
    expect(searchGlobePoints(null as unknown as GlobePoint[], 'query')).toEqual([]);
  });
});
