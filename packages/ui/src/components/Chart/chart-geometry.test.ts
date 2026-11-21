// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  buildChartGeometry,
  niceTicks,
  resolveChartDomain,
  scaleChartValue,
  type ChartDomain,
  type ChartGeometry,
} from './chart-geometry';
import {
  deriveVisibleChartModel,
  getChartDatums,
  normalizeChartData,
  type ChartDataInput,
  type ChartModel,
} from './chart-model';

const size = { width: 320, height: 300 };
const unsafe = (input: unknown) => normalizeChartData(input as ChartDataInput);
const cartesian = (type: 'line' | 'area' | 'bar', values: (number | null)[] = [1, 2, 3]) =>
  normalizeChartData({
    type,
    categories: values.map((_, index) => `Category ${index}`),
    series: [{ id: 's', name: 'Series', values }],
  });

function expectFiniteGeometry(geometry: ChartGeometry) {
  const visit = (value: unknown): void => {
    if (typeof value === 'number') expect(Number.isFinite(value)).toBe(true);
    else if (typeof value === 'string') expect(value).not.toMatch(/NaN|Infinity/);
    else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') Object.values(value).forEach(visit);
  };
  visit(geometry);
  expect(geometry.plot.width).toBeGreaterThan(0);
  expect(geometry.plot.height).toBeGreaterThan(0);
  for (const mark of geometry.marks) {
    expect(mark.x).toBeGreaterThanOrEqual(geometry.plot.left - 1e-9);
    expect(mark.x).toBeLessThanOrEqual(geometry.plot.left + geometry.plot.width + 1e-9);
    expect(mark.y).toBeGreaterThanOrEqual(geometry.plot.top - 1e-9);
    expect(mark.y).toBeLessThanOrEqual(geometry.plot.top + geometry.plot.height + 1e-9);
    if (mark.rect) {
      expect(mark.rect.width).toBeGreaterThanOrEqual(0);
      expect(mark.rect.height).toBeGreaterThanOrEqual(0);
    }
  }
}

describe('finite numeric domain helpers', () => {
  it('finds signed finite extents without counting null/nonfinite values', () => {
    expect(resolveChartDomain([null, -3, 5, NaN, Infinity, -Infinity])).toEqual([-3, 5]);
    expect(resolveChartDomain([2, 4], true)).toEqual([0, 4]);
    expect(resolveChartDomain([-2, -4], true)).toEqual([-4, 0]);
    expect(resolveChartDomain([2, 4])).toEqual([2, 4]);
    expect(resolveChartDomain([])).toEqual([0, 1]);
    expect(resolveChartDomain([null, NaN])).toEqual([0, 1]);
  });

  it.each([0, 3, -3, Number.MIN_VALUE, -Number.MIN_VALUE, Number.MAX_VALUE, -Number.MAX_VALUE])(
    'expands equal value %s to a finite ascending extent containing it',
    (value) => {
      const domain = resolveChartDomain([value, value]);
      expect(Number.isFinite(domain[0])).toBe(true);
      expect(Number.isFinite(domain[1])).toBe(true);
      expect(domain[0]).toBeLessThan(domain[1]);
      expect(domain[0]).toBeLessThanOrEqual(value);
      expect(domain[1]).toBeGreaterThanOrEqual(value);
    }
  );

  it('provides a zero-inclusive all-zero baseline', () => {
    expect(resolveChartDomain([0, 0], true)).toEqual([0, 1]);
    expect(resolveChartDomain([0, 0])).toEqual([-1, 1]);
  });

  it('scales normal, reversed output, and outside-domain values safely', () => {
    expect(scaleChartValue(0, [0, 10], [0, 100])).toBe(0);
    expect(scaleChartValue(5, [0, 10], [0, 100])).toBe(50);
    expect(scaleChartValue(10, [0, 10], [100, 0])).toBe(0);
    expect(scaleChartValue(3, [0, 10], [100, 0])).toBeCloseTo(70);
    expect(scaleChartValue(-100, [0, 10], [0, 100])).toBe(0);
    expect(scaleChartValue(100, [0, 10], [0, 100])).toBe(100);
    expect(scaleChartValue(5, [0, 0], [0, 100])).toBe(50);
    expect(scaleChartValue(NaN, [0, 10], [0, 100])).toBe(50);
  });

  it('scales overflowing signed spans, subnormals and near-equal extremes', () => {
    const extremes: ChartDomain = [-Number.MAX_VALUE, Number.MAX_VALUE];
    expect(scaleChartValue(0, extremes, [0, 100])).toBe(50);
    expect(scaleChartValue(-Number.MAX_VALUE, extremes, [0, 100])).toBe(0);
    expect(scaleChartValue(Number.MAX_VALUE, extremes, [0, 100])).toBe(100);
    expect(scaleChartValue(Number.MAX_VALUE / 2, extremes, [0, 100])).toBe(75);
    expect(scaleChartValue(0, [-Number.MIN_VALUE, Number.MIN_VALUE], [0, 100])).toBe(50);
    const narrow: ChartDomain = [Number.MAX_VALUE * (1 - Number.EPSILON), Number.MAX_VALUE];
    expect(scaleChartValue(narrow[0], narrow, [0, 100])).toBe(0);
    expect(scaleChartValue(narrow[1], narrow, [0, 100])).toBe(100);
    expect(scaleChartValue(0, [-1, 1], extremes)).toBe(0);
  });

  it('uses the 1/2/2.5/5/10 lattice including fractional ticks', () => {
    expect(niceTicks([0, 10])).toEqual([0, 2.5, 5, 7.5, 10]);
    expect(niceTicks([-5, 5])).toEqual([-5, -2.5, 0, 2.5, 5]);
    expect(niceTicks([0, 1])).toEqual([0, 0.25, 0.5, 0.75, 1]);
    expect(niceTicks([0, 4])).toEqual([0, 1, 2, 3, 4]);
    expect(niceTicks([0, 20])).toEqual([0, 5, 10, 15, 20]);
    expect(niceTicks([0, 40])).toEqual([0, 10, 20, 30, 40]);
  });

  it.each([
    [-Number.MAX_VALUE, Number.MAX_VALUE],
    [0, Number.MAX_VALUE],
    [-Number.MAX_VALUE, 0],
    [Number.MAX_VALUE * (1 - Number.EPSILON), Number.MAX_VALUE],
    [Number.MIN_VALUE, Number.MIN_VALUE * 3],
    [-Number.MIN_VALUE, Number.MIN_VALUE],
    [0.001, 0.004],
    [1e-100, 5e-100],
  ] as [number, number][])(
    'returns bounded ordered finite ticks for domain [%s, %s]',
    (minimum, maximum) => {
      const domain: ChartDomain = [minimum, maximum];
      for (const count of [2, 5, 12, 1e10, NaN, Infinity]) {
        const ticks = niceTicks(domain, count);
        expect(ticks.length).toBeGreaterThan(0);
        expect(ticks.length).toBeLessThanOrEqual(64);
        expect(new Set(ticks).size).toBe(ticks.length);
        ticks.forEach((value, index) => {
          expect(Number.isFinite(value)).toBe(true);
          expect(value).toBeGreaterThanOrEqual(domain[0]);
          expect(value).toBeLessThanOrEqual(domain[1]);
          if (index > 0) expect(value).toBeGreaterThan(ticks[index - 1]);
          expect(Object.is(value, -0)).toBe(false);
        });
      }
    }
  );

  it('rejects malformed tick domains without hanging', () => {
    expect(niceTicks([1, 1])).toEqual([]);
    expect(niceTicks([2, 1])).toEqual([]);
    expect(niceTicks([NaN, 1])).toEqual([]);
    expect(niceTicks([-Infinity, Infinity])).toEqual([]);
  });

  it('processes a large generator without a spread/argument limit', () => {
    function* values() {
      for (let index = 0; index < 150_000; index += 1) yield index - 75_000;
    }
    expect(resolveChartDomain(values())).toEqual([-75_000, 74_999]);
  });
});

describe('Cartesian and scatter geometry', () => {
  it.each(['line', 'area', 'bar'] as const)(
    'draws every %s datum in measured logical pixels with categorical tick names',
    (type) => {
      const model = cartesian(type);
      const geometry = buildChartGeometry(model, size);
      expect(geometry.marks).toHaveLength(3);
      expect(geometry.marks.map((mark) => mark.datum)).toEqual(getChartDatums(model));
      expect(geometry.xTicks.map((tick) => [tick.value, tick.label])).toEqual([
        [0, 'Category 0'],
        [1, 'Category 1'],
        [2, 'Category 2'],
      ]);
      expect(geometry.yDomain).toEqual([0, 3]);
      expect(geometry.plot.width).toBeGreaterThanOrEqual(64);
      expect(geometry.plot.height).toBeGreaterThanOrEqual(80);
      expect(geometry.plot.left + geometry.plot.width).toBeLessThanOrEqual(size.width);
      expect(geometry.plot.top + geometry.plot.height).toBeLessThanOrEqual(size.height);
      expect(geometry.radial).toBeNull();
      expectFiniteGeometry(geometry);
    }
  );

  it('uses numeric continuous domains and axes for scatter without forced zero inclusion', () => {
    const model = normalizeChartData({
      type: 'scatter',
      series: [
        {
          id: 's',
          name: 'Samples',
          points: [
            { id: 'a', x: 10, y: 100 },
            { id: 'b', x: 20, y: 200 },
          ],
        },
      ],
    });
    const geometry = buildChartGeometry(model, size);
    expect(geometry.xDomain).toEqual([10, 20]);
    expect(geometry.yDomain).toEqual([100, 200]);
    expect(geometry.xTicks.every((tick) => Number.isFinite(tick.value))).toBe(true);
    expect(geometry.marks.map((mark) => mark.kind)).toEqual(['point', 'point']);
    expect(geometry.seriesPaths).toEqual([]);
    expect(geometry.marks[0].x).toBe(geometry.plot.left);
    expect(geometry.marks[1].x).toBe(geometry.plot.left + geometry.plot.width);
    expect(geometry.marks[0].y).toBe(geometry.plot.top + geometry.plot.height);
    expect(geometry.marks[1].y).toBe(geometry.plot.top);
    expectFiniteGeometry(geometry);
  });

  it.each(['line', 'area', 'bar'] as const)(
    'includes zero with positive, negative, signed and all-zero %s values',
    (type) => {
      for (const [values, expected] of [
        [
          [2, 3],
          [0, 3],
        ],
        [
          [-2, -3],
          [-3, 0],
        ],
        [
          [-2, 3],
          [-2, 3],
        ],
        [
          [0, 0],
          [0, 1],
        ],
      ] as [[number, number], [number, number]][]) {
        const geometry = buildChartGeometry(cartesian(type, values), size);
        expect(geometry.yDomain).toEqual(expected);
        expect(geometry.baseline).toBeGreaterThanOrEqual(geometry.plot.top);
        expect(geometry.baseline).toBeLessThanOrEqual(geometry.plot.top + geometry.plot.height);
        expect(geometry.marks).toHaveLength(2);
        expectFiniteGeometry(geometry);
      }
    }
  );

  it.each(['line', 'area'] as const)(
    'splits %s at null gaps and preserves lone point markers',
    (type) => {
      const model = cartesian(type, [null, 1, null, 2, 3, null, 0, null]);
      const geometry = buildChartGeometry(model, size);
      expect(geometry.marks.map((mark) => mark.datum.index)).toEqual([1, 3, 4, 6]);
      expect(geometry.marks.every((mark) => mark.kind === 'point')).toBe(true);
      expect(geometry.seriesPaths).toHaveLength(1);
      const path = geometry.seriesPaths[0];
      expect(path.id).toBe('s');
      expect(path.color).toBe(model.series[0].color);
      expect(path.linePath!.match(/\bM\b/g)).toHaveLength(3);
      expect(path.linePath!.match(/\bL\b/g)).toHaveLength(1);
      if (type === 'area') {
        expect(path.areaPath!.match(/\bM\b/g)).toHaveLength(3);
        expect(path.areaPath!.match(/\bZ\b/g)).toHaveLength(3);
      } else expect(path.areaPath).toBeUndefined();
      expectFiniteGeometry(geometry);
    }
  );

  it.each(['line', 'area'] as const)('does not join %s paths between different series', (type) => {
    const model = normalizeChartData({
      type,
      categories: ['A', 'B'],
      series: [
        { id: 'first', name: 'First', values: [1, 2] },
        { id: 'gaps', name: 'Gaps', values: [null, null] },
        { id: 'last', name: 'Last', color: 'red', values: [3, 4] },
      ],
    });
    const geometry = buildChartGeometry(model, size);
    expect(geometry.seriesPaths.map((path) => path.id)).toEqual(['first', 'last']);
    expect(geometry.seriesPaths[1].color).toBe('red');
    expect(geometry.marks).toHaveLength(4);
    for (const path of geometry.seriesPaths) {
      expect(path.linePath!.match(/\bM\b/g)).toHaveLength(1);
      if (type === 'area') expect(path.areaPath!.match(/\bZ\b/g)).toHaveLength(1);
    }
  });

  it.each(['line', 'area', 'bar'] as const)(
    'centers a single-category %s mark and expands zero domains',
    (type) => {
      const geometry = buildChartGeometry(cartesian(type, [0]), size);
      expect(geometry.marks).toHaveLength(1);
      expect(geometry.marks[0].x).toBeCloseTo(geometry.plot.left + geometry.plot.width / 2);
      expect(geometry.marks[0].y).toBe(geometry.baseline);
      if (type === 'bar') expect(geometry.marks[0].rect!.height).toBe(0);
      expectFiniteGeometry(geometry);
    }
  );

  it('expands equal scatter x and y domains to drawable centered points', () => {
    const model = normalizeChartData({
      type: 'scatter',
      series: [
        {
          id: 's',
          name: 'S',
          points: [
            { id: 'a', x: 0, y: 2 },
            { id: 'b', x: 0, y: 2 },
          ],
        },
      ],
    });
    const geometry = buildChartGeometry(model, size);
    expect(geometry.xDomain[0]).toBeLessThan(0);
    expect(geometry.xDomain[1]).toBeGreaterThan(0);
    expect(geometry.yDomain[0]).toBeLessThan(2);
    expect(geometry.yDomain[1]).toBeGreaterThan(2);
    expect(geometry.marks[0].x).toBeCloseTo(geometry.plot.left + geometry.plot.width / 2);
    expect(geometry.marks[0].y).toBeCloseTo(geometry.plot.top + geometry.plot.height / 2);
    expectFiniteGeometry(geometry);
  });

  it('groups bars around a common zero baseline with positive rect dimensions', () => {
    const model = normalizeChartData({
      type: 'bar',
      categories: ['A', 'B', 'C'],
      series: [
        { id: 'a', name: 'A', values: [10, -5, 0] },
        { id: 'b', name: 'B', values: [5, -2, 1] },
      ],
    });
    const geometry = buildChartGeometry(model, size);
    expect(geometry.marks).toHaveLength(6);
    const positive = geometry.marks[0];
    const negative = geometry.marks[1];
    const zero = geometry.marks[2];
    expect(positive.rect!.y + positive.rect!.height).toBeCloseTo(geometry.baseline);
    expect(positive.y).toBeLessThan(geometry.baseline);
    expect(negative.rect!.y).toBe(geometry.baseline);
    expect(negative.y).toBeGreaterThan(geometry.baseline);
    expect(zero.rect!.height).toBe(0);
    expect(positive.rect!.x + positive.rect!.width).toBeLessThan(geometry.marks[3].rect!.x);
    expectFiniteGeometry(geometry);
  });

  it('uses visible series for bar grouping/domain, while preserving datum IDs and colors', () => {
    const model = normalizeChartData({
      type: 'bar',
      categories: ['A', 'B'],
      series: [
        { id: 'a', name: 'A', values: [100, 50] },
        { id: 'b', name: 'B', values: [2, 3] },
      ],
    });
    const all = buildChartGeometry(model, size);
    const visible = buildChartGeometry(deriveVisibleChartModel(model, ['a']), size);
    expect(visible.yDomain).toEqual([0, 3]);
    expect(visible.marks.map((mark) => mark.datum)).toEqual(
      all.marks.filter((mark) => mark.datum.seriesId === 'b').map((mark) => mark.datum)
    );
    expect(visible.marks[0].rect!.width).toBeGreaterThan(all.marks[2].rect!.width);
    expect(visible.marks[0].x).toBe(visible.xTicks[0].position);
  });

  it('honors valid numeric domain overrides and ignores malformed overrides', () => {
    const model = normalizeChartData({
      type: 'scatter',
      series: [
        {
          id: 's',
          name: 'S',
          points: [
            { id: 'a', x: 10, y: 100 },
            { id: 'b', x: 20, y: 200 },
          ],
        },
      ],
    });
    const geometry = buildChartGeometry(model, size, { xDomain: [0, 40], yDomain: [0, 400] });
    expect(geometry.xDomain).toEqual([0, 40]);
    expect(geometry.yDomain).toEqual([0, 400]);
    expect(geometry.marks[0].x).toBeCloseTo(geometry.plot.left + geometry.plot.width * 0.25);
    expect(geometry.marks[0].y).toBeCloseTo(geometry.plot.top + geometry.plot.height * 0.75);
    for (const domain of [
      [2, 1],
      [1, 1],
      [NaN, 2],
      [-Infinity, Infinity],
    ] as [number, number][]) {
      const ignored = buildChartGeometry(model, size, { xDomain: domain, yDomain: domain });
      expect(ignored.xDomain).toEqual([10, 20]);
      expect(ignored.yDomain).toEqual([100, 200]);
      expectFiniteGeometry(ignored);
    }
  });

  it('applies categorical numeric xDomain without coercing category labels', () => {
    const geometry = buildChartGeometry(cartesian('line', [1, 2, 3]), size, { xDomain: [-1, 3] });
    expect(geometry.xDomain).toEqual([-1, 3]);
    expect(geometry.xTicks.map((tick) => tick.label)).toEqual([
      'Category 0',
      'Category 1',
      'Category 2',
    ]);
    expect(geometry.marks[0].x).toBeCloseTo(geometry.plot.left + geometry.plot.width / 4);
  });

  it('keeps grouped bars inside the plot when xDomain clips category bands', () => {
    const model = normalizeChartData({
      type: 'bar',
      categories: ['A', 'B', 'C'],
      series: [
        { id: 'a', name: 'A', values: [1, 2, 3] },
        { id: 'b', name: 'B', values: [3, 2, 1] },
      ],
    });
    for (const xDomain of [
      [0, 1],
      [0.25, 0.75],
      [-1, 0],
      [2, 3],
    ] as [number, number][]) {
      const geometry = buildChartGeometry(model, size, { xDomain });
      expect(geometry.marks).toHaveLength(6);
      expectFiniteGeometry(geometry);
      for (const mark of geometry.marks) {
        expect(mark.rect!.x).toBeGreaterThanOrEqual(geometry.plot.left);
        expect(mark.rect!.x + mark.rect!.width).toBeLessThanOrEqual(
          geometry.plot.left + geometry.plot.width
        );
      }
    }
  });

  it('keeps tick data when the renderer disables grid lines', () => {
    const model = cartesian('line');
    const geometry = buildChartGeometry(model, size, { grid: false });
    const enabled = buildChartGeometry(model, size, { grid: true });
    expect(geometry.xTicks).toEqual(enabled.xTicks);
    expect(geometry.yTicks).toEqual(enabled.yTicks);
  });

  it('adapts categorical tick stride to width and label length without capping marks', () => {
    const values = Array.from({ length: 101 }, (_, index) => index);
    const model = cartesian('line', values);
    const narrow = buildChartGeometry(model, size);
    const wide = buildChartGeometry(model, { width: 1000, height: 300 });
    expect(narrow.marks).toHaveLength(101);
    expect(wide.marks).toHaveLength(101);
    expect(narrow.xTicks.length).toBeLessThan(wide.xTicks.length);
    expect(narrow.xTicks[0].value).toBe(0);
    expect(narrow.xTicks[narrow.xTicks.length - 1].value).toBe(100);
    expect(new Set(narrow.xTicks.map((tick) => tick.value)).size).toBe(narrow.xTicks.length);
    const shortLabels = normalizeChartData({
      categories: Array.from({ length: 15 }, (_, index) => `${index}`),
      series: [{ id: 's', name: 'S', values: Array(15).fill(1) }],
    });
    const longLabels = {
      ...shortLabels,
      categories: shortLabels.categories.map((label) => `${label} long category label`),
    };
    expect(buildChartGeometry(longLabels, size).xTicks.length).toBeLessThanOrEqual(
      buildChartGeometry(shortLabels, size).xTicks.length
    );
  });

  it.each(['line', 'area', 'bar'] as const)(
    'renders %s malformed numeric gaps without connecting them',
    (type) => {
      const model = unsafe({
        type,
        categories: ['A', 'B', 'C'],
        series: [{ id: 's', name: 'S', values: [1, NaN, 2] }],
      });
      const geometry = buildChartGeometry(model, size);
      expect(model.invalid).toBe(false);
      expect(geometry.marks.map((mark) => mark.datum.index)).toEqual([0, 2]);
      if (type !== 'bar') expect(geometry.seriesPaths[0].linePath!.match(/\bM\b/g)).toHaveLength(2);
      expectFiniteGeometry(geometry);
    }
  );

  it('skips bad scatter coordinates in geometry, matching canonical datums', () => {
    const model = unsafe({
      type: 'scatter',
      series: [
        {
          id: 's',
          name: 'S',
          points: [
            { id: 'bad', x: NaN, y: Infinity },
            { id: 'good', x: 1, y: 2 },
          ],
        },
      ],
    });
    const geometry = buildChartGeometry(model, size);
    expect(model.invalid).toBe(false);
    expect(geometry.marks).toHaveLength(1);
    expect(geometry.marks[0].datum).toEqual(getChartDatums(model)[0]);
    expectFiniteGeometry(geometry);
  });
});

describe('radial geometry', () => {
  it.each(['pie', 'donut'] as const)(
    'uses finite arcs and percentage-bearing centroid anchors for %s',
    (type) => {
      const model = normalizeChartData({
        type,
        data: [
          { id: 'a', label: 'A', value: 1 },
          { id: 'b', label: 'B', value: 3 },
        ],
      });
      const geometry = buildChartGeometry(model, size);
      expect(geometry.marks.map((mark) => mark.kind)).toEqual(['slice', 'slice']);
      expect(geometry.marks.map((mark) => mark.datum.percent)).toEqual([0.25, 0.75]);
      expect(geometry.radial!.total).toBe(4);
      expect(geometry.radial!.innerRadius).toBe(type === 'donut' ? geometry.radial!.r * 0.6 : 0);
      expect(geometry.xTicks).toEqual([]);
      expect(geometry.yTicks).toEqual([]);
      for (const mark of geometry.marks) {
        const distance = Math.hypot(mark.x - geometry.radial!.cx, mark.y - geometry.radial!.cy);
        expect(distance).toBeLessThan(geometry.radial!.r);
        if (type === 'donut') expect(distance).toBeGreaterThan(geometry.radial!.innerRadius);
        expect(mark.path).toMatch(/^M .* A .* Z$/);
      }
      expectFiniteGeometry(geometry);
    }
  );

  it.each(['pie', 'donut'] as const)(
    'uses two outer arcs for a single full-circle %s slice',
    (type) => {
      const model = normalizeChartData({ type, data: [{ id: 'whole', label: 'Whole', value: 7 }] });
      const geometry = buildChartGeometry(model, size);
      expect(geometry.marks).toHaveLength(1);
      const mark = geometry.marks[0];
      expect(mark.datum.percent).toBe(1);
      expect(mark.path!.match(/\bA\b/g)).toHaveLength(type === 'donut' ? 4 : 2);
      if (type === 'pie') {
        expect(mark.x).toBe(geometry.radial!.cx);
        expect(mark.y).toBe(geometry.radial!.cy);
      } else {
        expect(mark.path).toContain('0 1 0');
        expect(
          Math.hypot(mark.x - geometry.radial!.cx, mark.y - geometry.radial!.cy)
        ).toBeGreaterThan(geometry.radial!.innerRadius);
      }
      expectFiniteGeometry(geometry);
    }
  );

  it('keeps radial zeros in canonical data but creates no sectors for them', () => {
    const model = normalizeChartData({
      type: 'pie',
      data: [
        { id: 'z', label: 'Zero', value: 0 },
        { id: 'whole', label: 'Whole', value: 1 },
        { id: 'z2', label: 'Zero 2', value: 0 },
      ],
    });
    const geometry = buildChartGeometry(model, size);
    expect(getChartDatums(model)).toHaveLength(3);
    expect(geometry.marks.map((mark) => mark.datum.id)).toEqual(['whole']);
    expect(geometry.marks[0].path!.match(/\bA\b/g)).toHaveLength(2);
    expect(geometry.marks[0].datum.index).toBe(1);
  });

  it.each(['pie', 'donut'] as const)(
    'returns neutral all-zero %s geometry with no misleading circle',
    (type) => {
      const model = normalizeChartData({ type, data: [{ id: 'z', label: 'Zero', value: 0 }] });
      const geometry = buildChartGeometry(model, size);
      expect(model.invalid).toBe(false);
      expect(geometry.marks).toEqual([]);
      expect(geometry.seriesPaths).toEqual([]);
      expect(geometry.radial!.total).toBe(0);
      expect(geometry.radial!.r).toBeGreaterThan(0);
      expect(getChartDatums(model)[0].percent).toBe(0);
      expectFiniteGeometry(geometry);
    }
  );

  it('recomputes full-circle geometry and percentages after hiding a slice', () => {
    const model = normalizeChartData({
      type: 'donut',
      data: [
        { id: 'a', label: 'A', value: 3 },
        { id: 'b', label: 'B', value: 7 },
      ],
    });
    const geometry = buildChartGeometry(deriveVisibleChartModel(model, ['a']), size);
    expect(geometry.marks).toHaveLength(1);
    expect(geometry.marks[0].datum).toMatchObject({
      id: 'b',
      seriesId: 'b',
      index: 1,
      percent: 1,
      color: model.slices[1].color,
    });
    expect(geometry.marks[0].path!.match(/\bA\b/g)).toHaveLength(4);
    expect(geometry.radial!.total).toBe(7);
  });

  it('handles overflowing totals and underflowed tiny shares without losing table data', () => {
    const model = normalizeChartData({
      type: 'pie',
      data: [
        { id: 'a', label: 'A', value: Number.MAX_VALUE },
        { id: 'b', label: 'B', value: Number.MAX_VALUE },
        { id: 'tiny', label: 'Tiny', value: Number.MIN_VALUE },
      ],
    });
    const geometry = buildChartGeometry(model, size);
    expect(model.invalid).toBe(false);
    expect(geometry.radial!.total).toBeNull();
    expect(geometry.marks.map((mark) => mark.datum.percent)).toEqual([0.5, 0.5]);
    expect(getChartDatums(model)).toHaveLength(3);
    expectFiniteGeometry(geometry);
  });

  it('draws subnormal positive slices and ignores domain overrides for radial geometry', () => {
    const model = normalizeChartData({
      type: 'pie',
      data: [
        { id: 'a', label: 'A', value: Number.MIN_VALUE },
        { id: 'b', label: 'B', value: Number.MIN_VALUE },
      ],
    });
    const geometry = buildChartGeometry(model, size, { xDomain: [-2, 2], yDomain: [-3, 3] });
    expect(geometry.marks).toHaveLength(2);
    expect(geometry.marks.map((mark) => mark.datum.percent)).toEqual([0.5, 0.5]);
    expect(geometry.xDomain).toEqual([0, 1]);
    expect(geometry.yDomain).toEqual([0, 1]);
    expectFiniteGeometry(geometry);
  });

  it.each([-1, NaN, Infinity, -Infinity])(
    'never draws a partial circle for fatal radial value %s',
    (value) => {
      const model = unsafe({
        type: 'pie',
        data: [
          { id: 'good', label: 'Good', value: 2 },
          { id: 'bad', label: 'Bad', value },
        ],
      });
      const geometry = buildChartGeometry(model, size);
      expect(model.invalid).toBe(true);
      expect(geometry.marks).toEqual([]);
      expect(geometry.radial).toBeNull();
      expectFiniteGeometry(geometry);
    }
  );
});

describe('safety, sizing and performance bounds', () => {
  it.each(['line', 'area', 'bar', 'pie', 'donut', 'scatter'] as const)(
    'never draws structurally invalid %s models',
    (type) => {
      const model: ChartModel =
        type === 'pie' || type === 'donut'
          ? normalizeChartData({
              type,
              data: [
                { id: 's', label: 'S', value: 1 },
                { id: 's', label: 'Duplicate', value: 2 },
              ],
            })
          : type === 'scatter'
            ? normalizeChartData({
                type,
                series: [
                  {
                    id: 's',
                    name: 'S',
                    points: [
                      { id: 'a', x: 1, y: 2 },
                      { id: 'a', x: 3, y: 4 },
                    ],
                  },
                ],
              })
            : normalizeChartData({
                type,
                categories: ['A'],
                series: [
                  { id: 's', name: 'S', values: [1] },
                  { id: 's', name: 'Duplicate', values: [2] },
                ],
              });
      expect(model.invalid).toBe(true);
      expect(getChartDatums(model).length).toBeGreaterThan(0);
      const geometry = buildChartGeometry(model, size);
      expect(geometry.marks).toEqual([]);
      expect(geometry.seriesPaths).toEqual([]);
      expectFiniteGeometry(geometry);
    }
  );

  it.each(['line', 'area', 'bar', 'pie', 'donut', 'scatter'] as const)(
    'returns finite empty %s geometry for an empty visible model',
    (type) => {
      const model: ChartModel =
        type === 'pie' || type === 'donut'
          ? normalizeChartData({ type, data: [] })
          : type === 'scatter'
            ? normalizeChartData({ type, series: [] })
            : normalizeChartData({ type, categories: [], series: [] });
      const geometry = buildChartGeometry(model, size);
      expect(geometry.marks).toEqual([]);
      expect(geometry.seriesPaths).toEqual([]);
      expectFiniteGeometry(geometry);
    }
  );

  it.each(['line', 'area', 'bar', 'scatter'] as const)(
    'keeps %s coordinates/ticks finite for overflowing and subnormal domains',
    (type) => {
      for (const values of [
        [-Number.MAX_VALUE, 0, Number.MAX_VALUE],
        [Number.MAX_VALUE, Number.MAX_VALUE],
        [-Number.MAX_VALUE, -Number.MAX_VALUE],
        [Number.MIN_VALUE, 0, -Number.MIN_VALUE],
        [Number.MAX_VALUE * (1 - Number.EPSILON), Number.MAX_VALUE],
      ]) {
        const model =
          type === 'scatter'
            ? normalizeChartData({
                type,
                series: [
                  {
                    id: 's',
                    name: 'S',
                    points: values.map((value, index) => ({
                      id: String(index),
                      x: value,
                      y: value,
                    })),
                  },
                ],
              })
            : cartesian(type, values);
        const geometry = buildChartGeometry(model, size);
        expect(geometry.marks).toHaveLength(values.length);
        expectFiniteGeometry(geometry);
      }
    }
  );

  it('produces distinguishable fractional tick labels instead of rounded integers', () => {
    const geometry = buildChartGeometry(cartesian('line', [0, 0.01]), size);
    const labels = geometry.yTicks.map((tick) => tick.label);
    expect(new Set(labels).size).toBe(labels.length);
    expect(labels.some((label) => label.includes('.'))).toBe(true);
    expect(geometry.yTicks.some((tick) => tick.value === 0)).toBe(true);
  });

  it('keeps near-equal extreme tick labels distinct and finite when parsed', () => {
    const minimum = Number.MAX_VALUE * (1 - Number.EPSILON);
    const maximum = Number.MAX_VALUE;
    const model = normalizeChartData({
      type: 'scatter',
      series: [
        {
          id: 's',
          name: 'S',
          points: [
            { id: 'a', x: minimum, y: minimum },
            { id: 'b', x: maximum, y: maximum },
          ],
        },
      ],
    });
    const geometry = buildChartGeometry(model, size);
    for (const ticks of [geometry.xTicks, geometry.yTicks]) {
      expect(new Set(ticks.map((tick) => tick.label)).size).toBe(ticks.length);
      expect(ticks.every((tick) => Number.isFinite(Number(tick.label)))).toBe(true);
    }
    expectFiniteGeometry(geometry);
  });

  it('keeps measured viewBox-sized geometry rather than stretching a fixed-width plot', () => {
    const model = cartesian('line');
    const small = buildChartGeometry(model, { width: 320, height: 180 });
    const large = buildChartGeometry(model, { width: 900, height: 800 });
    expect(large.plot.width).toBeGreaterThan(small.plot.width);
    expect(large.plot.height).toBeGreaterThan(small.plot.height);
    expect(small.marks[2].x).toBe(small.plot.left + small.plot.width);
    expect(large.marks[2].x).toBe(large.plot.left + large.plot.width);
    expectFiniteGeometry(small);
    expectFiniteGeometry(large);
  });

  it('keeps plot width >=64 and height >=80 at normal mobile dimensions', () => {
    for (const width of [64, 100, 200, 320]) {
      for (const height of [80, 100, 180, 300]) {
        const geometry = buildChartGeometry(cartesian('bar'), { width, height });
        expect(geometry.plot.width).toBeGreaterThanOrEqual(64);
        expect(geometry.plot.height).toBeGreaterThanOrEqual(80);
        expectFiniteGeometry(geometry);
      }
    }
  });

  it('safely clamps pathological sizes while preserving positive drawable dimensions', () => {
    for (const value of [
      0,
      -1,
      NaN,
      Infinity,
      -Infinity,
      Number.MIN_VALUE,
      1,
      50,
      Number.MAX_VALUE,
    ]) {
      for (const model of [
        cartesian('bar'),
        normalizeChartData({ type: 'donut', data: [{ id: 'a', label: 'A', value: 1 }] }),
      ]) {
        const geometry = buildChartGeometry(model, { width: value, height: value });
        expectFiniteGeometry(geometry);
      }
    }
  });

  it('does not mutate a visible normalized model or domains when creating geometry', () => {
    const model = cartesian('area', [1, null, -2]);
    const snapshot = structuredClone(model);
    const xDomain = Object.freeze([-1, 4]) as ChartDomain;
    const yDomain = Object.freeze([-3, 3]) as ChartDomain;
    buildChartGeometry(model, Object.freeze(size), { xDomain, yDomain });
    expect(model).toEqual(snapshot);
    expect(xDomain).toEqual([-1, 4]);
    expect(yDomain).toEqual([-3, 3]);
  });

  it('keeps every large-series datum/mark while bounding only axis ticks', () => {
    const count = 30_005;
    const model = cartesian(
      'line',
      Array.from({ length: count }, (_, index) => index % 17)
    );
    const geometry = buildChartGeometry(model, size);
    expect(geometry.marks).toHaveLength(count);
    expect(geometry.marks[count - 1].datum.id).toBe(`s:${count - 1}`);
    expect(geometry.seriesPaths).toHaveLength(1);
    expect(geometry.xTicks.length).toBeLessThan(10);
    expect(geometry.yTicks.length).toBeLessThanOrEqual(64);
    expect(geometry.seriesPaths[0].linePath).not.toMatch(/NaN|Infinity/);
  });
});
