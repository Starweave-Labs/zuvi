// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { ChartDataInput } from './chart-model';
import {
  CHART_PALETTE,
  deriveVisibleChartModel,
  getChartDatums,
  hasChartData,
  normalizeChartData,
} from './chart-model';

const unsafe = (input: unknown) => normalizeChartData(input as ChartDataInput);

function cartesian(type: 'line' | 'area' | 'bar' = 'line') {
  return normalizeChartData({
    type,
    categories: ['Jan', 'Feb', 'Mar'],
    series: [{ id: 'revenue', name: 'Revenue', values: [3, null, -2] }],
  });
}

describe('normalizeChartData', () => {
  it.each(['line', 'area', 'bar'] as const)(
    'normalizes %s without changing signed values or gaps',
    (type) => {
      const model = cartesian(type);
      expect(model).toMatchObject({
        type,
        categories: ['Jan', 'Feb', 'Mar'],
        slices: [],
        issues: [],
        invalid: false,
      });
      expect(model.series[0]).toEqual({
        id: 'revenue',
        name: 'Revenue',
        color: CHART_PALETTE[0],
        index: 0,
        values: [3, null, -2],
        points: [],
      });
      expect(hasChartData(model)).toBe(true);
    }
  );

  it('defaults only an omitted type to line', () => {
    expect(normalizeChartData({ categories: [], series: [] }).type).toBe('line');
    expect(unsafe({ type: null, categories: [], series: [] }).invalid).toBe(true);
    expect(unsafe({ type: 'bubble', categories: [], series: [] }).invalid).toBe(true);
  });

  it.each(['pie', 'donut'] as const)('normalizes %s and retains zero-valued slices', (type) => {
    const model = normalizeChartData({
      type,
      data: [
        { id: 'a', label: 'A', value: 2 },
        { id: 'zero', label: 'Zero', value: 0, color: '#123456' },
      ],
    });
    expect(model.invalid).toBe(false);
    expect(model.series).toEqual([]);
    expect(model.slices).toEqual([
      { id: 'a', label: 'A', value: 2, color: CHART_PALETTE[0], index: 0 },
      { id: 'zero', label: 'Zero', value: 0, color: '#123456', index: 1 },
    ]);
    expect(hasChartData(model)).toBe(true);
  });

  it('normalizes scatter points with original point indices', () => {
    const model = normalizeChartData({
      type: 'scatter',
      series: [
        {
          id: 's',
          name: 'Samples',
          points: [
            { id: 'p', x: -5, y: 0 },
            { id: 'named', x: 1.25, y: 3, label: 'Named point' },
          ],
        },
      ],
    });
    expect(model.invalid).toBe(false);
    expect(model.categories).toEqual([]);
    expect(model.series[0].values).toEqual([]);
    expect(model.series[0].points).toEqual([
      { id: 'p', x: -5, y: 0, index: 0 },
      { id: 'named', x: 1.25, y: 3, label: 'Named point', index: 1 },
    ]);
  });

  it('uses all eight theme tokens and preserves explicit colors and input ordering', () => {
    const input = {
      categories: ['A'],
      series: Array.from({ length: 10 }, (_, index) => ({
        id: `s${index}`,
        name: `Series ${index}`,
        values: [index],
        ...(index === 3 ? { color: 'var(--host-accent)' } : {}),
      })),
    };
    const snapshot = structuredClone(input);
    const model = normalizeChartData(input);
    expect(CHART_PALETTE).toHaveLength(8);
    expect(model.series.map((series) => series.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(model.series[3].color).toBe('var(--host-accent)');
    expect(model.series[7].color).toBe('var(--zuvi-chart-series-8)');
    expect(model.series[8].color).toBe(CHART_PALETTE[0]);
    expect(input).toEqual(snapshot);
    expect(model.categories).not.toBe(input.categories);
    expect(model.series[0].values).not.toBe(input.series[0].values);
  });

  it('accepts frozen input and never writes through normalized arrays', () => {
    const values = Object.freeze([1, null, 2]);
    const series = Object.freeze([Object.freeze({ id: 's', name: 'S', values })]);
    const input = Object.freeze({ categories: Object.freeze(['A', 'B', 'C']), series });
    const model = normalizeChartData(input);
    model.categories[0] = 'Changed';
    model.series[0].values[0] = 9;
    expect(input.categories[0]).toBe('A');
    expect(values[0]).toBe(1);
  });

  it('records nonfinite/nonnumeric Cartesian values as nonfatal gaps, never coerced zeros', () => {
    const model = unsafe({
      type: 'area',
      categories: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
      series: [
        { id: 's', name: 'S', values: [0, null, NaN, Infinity, -Infinity, '3', undefined, false] },
      ],
    });
    expect(model.invalid).toBe(false);
    expect(model.series[0].values).toEqual([0, null, null, null, null, null, null, null]);
    expect(model.issues).toHaveLength(6);
    expect(model.issues.every((issue) => issue.includes('null gap'))).toBe(true);
    expect(getChartDatums(model).map((datum) => datum.value)).toEqual([0]);
    expect(hasChartData(model)).toBe(true);
  });

  it('preserves sparse array indices as reported gaps', () => {
    const values: number[] = new Array(3);
    values[2] = 4;
    const model = normalizeChartData({
      categories: ['a', 'b', 'c'],
      series: [{ id: 's', name: 'S', values }],
    });
    expect(model.invalid).toBe(false);
    expect(model.series[0].values).toEqual([null, null, 4]);
    expect(model.issues).toHaveLength(2);
    expect(getChartDatums(model)[0].id).toBe('s:2');
  });

  it('skips nonfinite scatter coordinates nonfatally without shifting datum identity', () => {
    const model = unsafe({
      type: 'scatter',
      series: [
        {
          id: 's',
          name: 'S',
          points: [
            { id: 'bad-x', x: Infinity, y: 1 },
            { id: 'bad-y', x: 0, y: NaN },
            { id: 'string', x: '2', y: 3 },
            { id: 'good', x: -1, y: 0 },
          ],
        },
      ],
    });
    expect(model.invalid).toBe(false);
    expect(model.issues).toHaveLength(3);
    expect(model.series[0].points).toEqual([{ id: 'good', x: -1, y: 0, index: 3 }]);
    expect(getChartDatums(model)[0]).toMatchObject({
      id: 's:good',
      index: 3,
      x: -1,
      y: 0,
      value: 0,
    });
  });

  it.each([-1, NaN, Infinity, -Infinity, '2', null])(
    'rejects radial value %s fatally while retaining safe table data',
    (value) => {
      const model = unsafe({
        type: 'pie',
        data: [
          { id: 'bad', label: 'Bad', value },
          { id: 'good', label: 'Good', value: 2 },
        ],
      });
      expect(model.invalid).toBe(true);
      expect(model.slices.map((slice) => slice.id)).toEqual(['good']);
      expect(getChartDatums(model).map((datum) => datum.id)).toEqual(['good']);
      expect(hasChartData(model)).toBe(false);
      expect(model.issues[0]).toContain('finite, nonnegative');
    }
  );

  it.each([
    null,
    [],
    3,
    { categories: 'A', series: [] },
    { categories: ['A'], series: {} },
    { categories: ['A'], series: [null] },
    { categories: ['A'], series: [{ id: 's', name: 'S', values: [1, 2] }] },
    { categories: ['A'], series: [{ id: 's', name: 'S', values: [] }] },
    { categories: ['A', 2], series: [{ id: 's', name: 'S', values: [1, 2] }] },
    { categories: ['A'], series: [{ id: '', name: 'S', values: [1] }] },
    { categories: ['A'], series: [{ id: 's', name: ' ', values: [1] }] },
    { categories: ['A'], series: [{ id: 's', name: 'S', values: [1], color: '' }] },
    { categories: ['A'], series: [{ id: 's', name: 'S', values: [1], points: [] }] },
    { type: 'scatter', categories: ['A'], series: [] },
    { type: 'scatter', series: [{ id: 's', name: 'S', points: 'bad' }] },
    { type: 'scatter', series: [{ id: 's', name: 'S', points: [null] }] },
    { type: 'scatter', series: [{ id: 's', name: 'S', points: [{ id: '', x: 1, y: 2 }] }] },
    {
      type: 'scatter',
      series: [{ id: 's', name: 'S', points: [{ id: 'p', label: '', x: 1, y: 2 }] }],
    },
    { type: 'pie', data: null },
    { type: 'pie', series: [], data: [] },
    { type: 'pie', data: [null] },
    { type: 'pie', data: [{ id: 'a', label: '', value: 2 }] },
    { type: 'pie', data: [{ id: '', label: 'A', value: 2 }] },
    { type: 'line', categories: [], series: [], data: [] },
  ])('reports structural input errors without throwing (%j)', (input) => {
    const model = unsafe(input);
    expect(model.invalid).toBe(true);
    expect(model.issues.length).toBeGreaterThan(0);
    expect(hasChartData(model)).toBe(false);
    expect(() => getChartDatums(model)).not.toThrow();
  });

  it('rejects IDs with unpaired UTF-16 surrogates before URI encoding', () => {
    const model = unsafe({ categories: ['A'], series: [{ id: '\ud800', name: 'S', values: [1] }] });
    expect(model.invalid).toBe(true);
    expect(model.series).toEqual([]);
    expect(() => getChartDatums(model)).not.toThrow();
  });

  it('permits repeated category labels, since category identity is positional', () => {
    const model = normalizeChartData({
      categories: ['A', 'A'],
      series: [{ id: 's', name: 'S', values: [1, 2] }],
    });
    expect(model.invalid).toBe(false);
    expect(getChartDatums(model).map((datum) => datum.id)).toEqual(['s:0', 's:1']);
  });

  it('retains the first valid duplicate series and reports duplicates as fatal', () => {
    const model = unsafe({
      categories: ['A'],
      series: [
        { id: 's', name: '', values: [7] },
        { id: 's', name: 'First valid', values: [2] },
        { id: 's', name: 'Later duplicate', values: [3] },
      ],
    });
    expect(model.invalid).toBe(true);
    expect(model.series).toHaveLength(1);
    expect(model.series[0]).toMatchObject({
      id: 's',
      name: 'First valid',
      values: [2],
      index: 1,
      color: CHART_PALETTE[1],
    });
    expect(model.issues.filter((issue) => issue.includes('duplicates'))).toHaveLength(2);
  });

  it('retains the first valid duplicate slice, with its original index/color', () => {
    const model = unsafe({
      type: 'donut',
      data: [
        { id: 's', label: 'Bad', value: -1 },
        { id: 's', label: 'First valid', value: 2 },
        { id: 's', label: 'Later', value: 3 },
      ],
    });
    expect(model.invalid).toBe(true);
    expect(model.slices).toHaveLength(1);
    expect(model.slices[0]).toMatchObject({ id: 's', label: 'First valid', value: 2, index: 1 });
    expect(model.issues.filter((issue) => issue.includes('duplicates'))).toHaveLength(2);
  });

  it('scopes point duplicates to a series and lets a skipped point yield its ID to a valid one', () => {
    const model = unsafe({
      type: 'scatter',
      series: [
        {
          id: 'a',
          name: 'A',
          points: [
            { id: 'p', x: NaN, y: 2 },
            { id: 'p', x: 1, y: 2 },
            { id: 'p', x: 9, y: 9 },
          ],
        },
        { id: 'b', name: 'B', points: [{ id: 'p', x: 3, y: 4 }] },
      ],
    });
    expect(model.invalid).toBe(true);
    expect(model.series[0].points).toEqual([{ id: 'p', x: 1, y: 2, index: 1 }]);
    expect(model.series[1].points).toEqual([{ id: 'p', x: 3, y: 4, index: 0 }]);
    expect(getChartDatums(model).map((datum) => datum.id)).toEqual(['a:p', 'b:p']);
  });

  it('does not impose a hidden datum cap or spread large numeric arrays', () => {
    const count = 100_005;
    const categories = Array.from({ length: count }, (_, index) => `C${index}`);
    const values = Array.from({ length: count }, (_, index) => index);
    const model = normalizeChartData({ categories, series: [{ id: 's', name: 'S', values }] });
    expect(model.invalid).toBe(false);
    expect(model.series[0].values).toHaveLength(count);
    const datums = getChartDatums(model);
    expect(datums).toHaveLength(count);
    expect(datums[count - 1]).toMatchObject({
      id: `s:${count - 1}`,
      index: count - 1,
      value: count - 1,
    });
  });
});

describe('visible model and canonical datums', () => {
  it('creates complete Cartesian datums for zero/signed values but none for null gaps', () => {
    expect(getChartDatums(cartesian())).toEqual([
      {
        id: 'revenue:0',
        type: 'line',
        seriesId: 'revenue',
        seriesName: 'Revenue',
        index: 0,
        label: 'Jan',
        value: 3,
        color: CHART_PALETTE[0],
      },
      {
        id: 'revenue:2',
        type: 'line',
        seriesId: 'revenue',
        seriesName: 'Revenue',
        index: 2,
        label: 'Mar',
        value: -2,
        color: CHART_PALETTE[0],
      },
    ]);
  });

  it('encodes separators/percent/unicode without ID collisions and uses raw toggle IDs', () => {
    const model = normalizeChartData({
      type: 'scatter',
      series: [
        { id: 'a:b', name: 'A', points: [{ id: 'c', x: 1, y: 2 }] },
        { id: 'a', name: 'B', points: [{ id: 'b:c', x: 2, y: 3 }] },
        { id: '% /中文', name: 'C', points: [{ id: '😀:', x: 3, y: 4 }] },
      ],
    });
    const datums = getChartDatums(model);
    expect(datums.map((datum) => datum.id)).toEqual([
      'a%3Ab:c',
      'a:b%3Ac',
      `${encodeURIComponent('% /中文')}:${encodeURIComponent('😀:')}`,
    ]);
    expect(new Set(datums.map((datum) => datum.id)).size).toBe(3);
    expect(datums.map((datum) => datum.seriesId)).toEqual(['a:b', 'a', '% /中文']);
    expect(
      getChartDatums(deriveVisibleChartModel(model, ['a:b'])).map((datum) => datum.seriesId)
    ).toEqual(['a', '% /中文']);
  });

  it('keeps radial IDs raw and computes percentages using only visible slices', () => {
    const model = normalizeChartData({
      type: 'pie',
      data: [
        { id: 'a:b', label: 'A', value: 2 },
        { id: 'b', label: 'B', value: 6 },
        { id: 'z', label: 'Zero', value: 0 },
      ],
    });
    expect(getChartDatums(model).map((datum) => [datum.id, datum.seriesId, datum.percent])).toEqual(
      [
        ['a:b', 'a:b', 0.25],
        ['b', 'b', 0.75],
        ['z', 'z', 0],
      ]
    );
    const visible = deriveVisibleChartModel(model, ['b']);
    expect(getChartDatums(visible).map((datum) => datum.percent)).toEqual([1, 0]);
    expect(visible.slices[1].index).toBe(2);
    expect(visible.slices[1].color).toBe(CHART_PALETTE[2]);
    expect(model.slices).toHaveLength(3);
  });

  it('computes finite percentages even when the raw total would overflow', () => {
    const model = normalizeChartData({
      type: 'donut',
      data: [
        { id: 'a', label: 'A', value: Number.MAX_VALUE },
        { id: 'b', label: 'B', value: Number.MAX_VALUE },
        { id: 'tiny', label: 'Tiny', value: Number.MIN_VALUE },
      ],
    });
    expect(model.invalid).toBe(false);
    const datums = getChartDatums(model);
    expect(datums).toHaveLength(3);
    expect(datums.map((datum) => datum.percent)).toEqual([0.5, 0.5, 0]);
    expect(datums.every((datum) => Number.isFinite(datum.percent))).toBe(true);
    expect(datums[2].value).toBe(Number.MIN_VALUE);
  });

  it('normalizes subnormal radial values without treating them as empty', () => {
    const model = normalizeChartData({
      type: 'pie',
      data: [
        { id: 'a', label: 'A', value: Number.MIN_VALUE },
        { id: 'b', label: 'B', value: Number.MIN_VALUE },
      ],
    });
    expect(getChartDatums(model).map((datum) => datum.percent)).toEqual([0.5, 0.5]);
    expect(hasChartData(model)).toBe(true);
  });

  it('treats empty, all-gap and all-zero radial models as empty; Cartesian zero remains valid data', () => {
    expect(hasChartData(normalizeChartData({ categories: [], series: [] }))).toBe(false);
    expect(
      hasChartData(
        normalizeChartData({ categories: ['A'], series: [{ id: 's', name: 'S', values: [null] }] })
      )
    ).toBe(false);
    const zeroRadial = normalizeChartData({
      type: 'pie',
      data: [{ id: 'z', label: 'Zero', value: 0 }],
    });
    expect(hasChartData(zeroRadial)).toBe(false);
    expect(getChartDatums(zeroRadial)[0].percent).toBe(0);
    expect(
      hasChartData(
        normalizeChartData({ categories: ['A'], series: [{ id: 's', name: 'S', values: [0] }] })
      )
    ).toBe(true);
    expect(hasChartData(normalizeChartData({ type: 'scatter', series: [] }))).toBe(false);
  });

  it('preserves issues/invalid state on filtering and cannot hide a structural error away', () => {
    const model = unsafe({
      type: 'pie',
      data: [
        { id: 'bad', label: 'Bad', value: -1 },
        { id: 'good', label: 'Good', value: 4 },
      ],
    });
    const visible = deriveVisibleChartModel(model, ['bad']);
    expect(visible.invalid).toBe(true);
    expect(visible.issues).toBe(model.issues);
    expect(hasChartData(visible)).toBe(false);
    expect(getChartDatums(visible)[0].value).toBe(4);
  });

  it('hides every series without mutating source colors, categories, or datum identity', () => {
    const model = cartesian('bar');
    const before = getChartDatums(model);
    const visible = deriveVisibleChartModel(model, ['revenue', 'unknown', 'revenue']);
    expect(visible.series).toEqual([]);
    expect(visible.categories).toBe(model.categories);
    expect(hasChartData(visible)).toBe(false);
    expect(getChartDatums(model)).toEqual(before);
  });
});
