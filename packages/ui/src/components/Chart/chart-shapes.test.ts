// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { buildChartGeometry, type ChartGeometry, type ChartRect } from './chart-geometry';
import {
  CHART_PALETTE,
  deriveVisibleChartModel,
  getChartDatums,
  hasChartData,
  normalizeChartData,
} from './chart-model';
import { scaleChartValue } from './chart-scale';

const size = { width: 640, height: 300 };
const waterfallData = [
  { id: 'start', label: 'Start', value: 20 },
  { id: 'cost', label: 'Cost', value: -8, color: 'var(--host-cost)' },
  { id: 'growth', label: 'Growth', value: 4 },
  { id: 'zero', label: 'Zero', value: 0 },
];

function expectFiniteGeometry(geometry: ChartGeometry) {
  const visit = (value: unknown): void => {
    if (typeof value === 'number') expect(Number.isFinite(value)).toBe(true);
    else if (typeof value === 'string') expect(value).not.toMatch(/NaN|Infinity/);
    else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') Object.values(value).forEach(visit);
  };
  visit(geometry);
  for (const mark of geometry.marks) {
    if (mark.rect) {
      expect(mark.rect.width).toBeGreaterThanOrEqual(0);
      expect(mark.rect.height).toBeGreaterThanOrEqual(0);
    }
  }
}

function contains(rect: ChartRect, x: number, y: number) {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

describe('waterfall original cumulative layout', () => {
  it('stores the full source slots, labels and intervals before visibility filtering', () => {
    const model = normalizeChartData({ type: 'waterfall', data: waterfallData });
    expect(model.categories).toEqual(['Start', 'Cost', 'Growth', 'Zero']);
    expect(model.waterfall).toEqual({ slots: 4, domain: [0, 20] });
    expect(model.slices.map((step) => [step.startValue, step.endValue])).toEqual([
      [0, 20],
      [20, 12],
      [12, 16],
      [16, 16],
    ]);
    const visible = deriveVisibleChartModel(model, ['cost']);
    expect(visible.categories).toBe(model.categories);
    expect(visible.waterfall).toBe(model.waterfall);
  });

  it.each(['start', 'cost', 'growth', 'zero'])(
    'hides %s without changing surviving offsets, category slots, domains or colors',
    (hiddenId) => {
      const model = normalizeChartData({ type: 'waterfall', data: waterfallData });
      const snapshot = structuredClone(model);
      const full = buildChartGeometry(model, size);
      const visible = deriveVisibleChartModel(model, [hiddenId]);
      const geometry = buildChartGeometry(visible, size);
      expect(geometry.marks).toEqual(full.marks.filter((mark) => mark.datum.seriesId !== hiddenId));
      expect(geometry.xTicks).toEqual(full.xTicks);
      expect(geometry.xDomain).toEqual(full.xDomain);
      expect(geometry.yDomain).toEqual(full.yDomain);
      expect(getChartDatums(visible)).toEqual(
        getChartDatums(model).filter((datum) => datum.seriesId !== hiddenId)
      );
      expect(model).toEqual(snapshot);
    }
  );

  it('keeps signed default colors and explicit overrides in canonical datums as well as marks', () => {
    const model = normalizeChartData({
      type: 'waterfall',
      data: [
        ...waterfallData,
        { id: 'loss', label: 'Loss', value: -3 },
        { id: 'token', label: 'Explicit default token', value: 1, color: CHART_PALETTE[0] },
      ],
    });
    const datums = getChartDatums(model);
    const geometry = buildChartGeometry(model, size);
    expect(datums.map((datum) => datum.color)).toEqual([
      CHART_PALETTE[1],
      'var(--host-cost)',
      CHART_PALETTE[1],
      CHART_PALETTE[1],
      CHART_PALETTE[3],
      CHART_PALETTE[0],
    ]);
    expect(geometry.marks.map((mark) => mark.datum)).toEqual(datums);
    expect(geometry.marks.map((mark) => [mark.startValue, mark.endValue])).toEqual([
      [0, 20],
      [20, 12],
      [12, 16],
      [16, 16],
      [16, 13],
      [13, 14],
    ]);
  });

  it('does not connect across a hidden intermediate step', () => {
    const model = normalizeChartData({ type: 'waterfall', data: waterfallData });
    const geometry = buildChartGeometry(deriveVisibleChartModel(model, ['cost']), size);
    const connectors = geometry.seriesPaths[0];
    expect(connectors.dashed).toBe(true);
    expect(connectors.linePath!.match(/\bM\b/g)).toHaveLength(1);
    expect(connectors.linePath!.match(/\bL\b/g)).toHaveLength(1);
    expect(geometry.marks.map((mark) => [mark.startValue, mark.endValue])).toEqual([
      [0, 20],
      [12, 16],
      [16, 16],
    ]);
  });

  it('keeps source layout through successive visible derivations and hiding every step', () => {
    const model = normalizeChartData({ type: 'waterfall', data: waterfallData });
    const full = buildChartGeometry(model, size);
    const first = deriveVisibleChartModel(model, ['start']);
    const second = deriveVisibleChartModel(first, ['cost', 'unknown', 'cost']);
    expect(buildChartGeometry(second, size).marks).toEqual(full.marks.slice(2));
    const empty = deriveVisibleChartModel(second, ['growth', 'zero']);
    expect(hasChartData(empty)).toBe(false);
    expect(getChartDatums(empty)).toEqual([]);
    const geometry = buildChartGeometry(empty, size);
    expect(geometry.marks).toEqual([]);
    expect(geometry.seriesPaths).toEqual([]);
    expect(geometry.xTicks).toEqual(full.xTicks);
    expect(geometry.yDomain).toEqual(full.yDomain);
  });

  it('honors a fixed y domain while retaining the original hidden-step offsets', () => {
    const model = normalizeChartData({ type: 'waterfall', data: waterfallData });
    const geometry = buildChartGeometry(deriveVisibleChartModel(model, ['start']), size, {
      yDomain: [-20, 40],
    });
    expect(geometry.yDomain).toEqual([-20, 40]);
    expect(geometry.marks[0]).toMatchObject({ startValue: 20, endValue: 12 });
    const y = (value: number) =>
      scaleChartValue(value, geometry.yDomain, [
        geometry.plot.top + geometry.plot.height,
        geometry.plot.top,
      ]);
    expect(geometry.marks[0].rect!.y).toBe(y(20));
    expect(geometry.marks[0].rect!.height).toBeCloseTo(y(12) - y(20));
    expectFiniteGeometry(geometry);
  });

  it('rejects overflowing original accumulation even if the offending step is hidden', () => {
    const model = normalizeChartData({
      type: 'waterfall',
      data: [
        { id: 'a', label: 'A', value: Number.MAX_VALUE },
        { id: 'b', label: 'B', value: Number.MAX_VALUE },
      ],
    });
    const visible = deriveVisibleChartModel(model, ['b']);
    expect(model.invalid).toBe(true);
    expect(visible.invalid).toBe(true);
    expect(buildChartGeometry(visible, size).marks).toEqual([]);
  });
});

describe('bounded sparse heatmap backgrounds', () => {
  it('keeps small-grid missing cells visible without inventing a datum', () => {
    const model = normalizeChartData({
      type: 'heatmap',
      data: [
        { id: 'a', row: 'r1', col: 'c1', value: -5 },
        { id: 'b', row: 'r2', col: 'c2', value: 10, color: 'var(--host-heat)' },
      ],
    });
    const geometry = buildChartGeometry(model, size);
    expect(geometry.backgrounds).toHaveLength(4);
    expect(geometry.marks).toHaveLength(2);
    expect(geometry.heatLegend).toEqual({ min: -5, max: 10 });
    expect(geometry.marks[0].heat).toBe(0);
    expect(geometry.marks[1].heat).toBe(1);
    expect(geometry.marks[1].datum.color).toBe('var(--host-heat)');
    const x = geometry.plot.left + geometry.plot.width * 0.75;
    const y = geometry.plot.top + geometry.plot.height * 0.25;
    expect(geometry.backgrounds!.some((rect) => contains(rect, x, y))).toBe(true);
    expect(geometry.marks.some((mark) => contains(mark.rect!, x, y))).toBe(false);
    expectFiniteGeometry(geometry);
  });

  it('bounds backgrounds for a 257 by 257 sparse grid and retains every input cell', () => {
    const count = 257;
    const model = normalizeChartData({
      type: 'heatmap',
      data: Array.from({ length: count }, (_, index) => ({
        id: `cell-${index}`,
        row: `row-${index}`,
        col: `col-${index}`,
        value: index,
      })),
    });
    const geometry = buildChartGeometry(model, size);
    expect(geometry.backgrounds!.length).toBeLessThanOrEqual(4096);
    expect(geometry.marks).toHaveLength(count);
    expect(geometry.marks.map((mark) => mark.datum.id)).toEqual(
      getChartDatums(model).map((datum) => datum.id)
    );
    const x = geometry.plot.left + geometry.plot.width * 0.75;
    const y = geometry.plot.top + geometry.plot.height * 0.25;
    expect(geometry.backgrounds!.some((rect) => contains(rect, x, y))).toBe(true);
    expect(geometry.marks.some((mark) => contains(mark.rect!, x, y))).toBe(false);
    expect(geometry.marks.every((mark) => mark.rect!.width > 0 && mark.rect!.height > 0)).toBe(
      true
    );
  });

  it('uses one background for ten thousand unique sparse rows and columns', () => {
    const count = 10_000;
    const model = normalizeChartData({
      type: 'heatmap',
      data: Array.from({ length: count }, (_, index) => ({
        id: `cell-${index}`,
        row: `row-${index}`,
        col: `col-${index}`,
        value: index % 17,
      })),
    });
    const geometry = buildChartGeometry(model, size);
    expect(model.invalid).toBe(false);
    expect(geometry.backgrounds).toEqual([
      {
        x: geometry.plot.left,
        y: geometry.plot.top,
        width: geometry.plot.width,
        height: geometry.plot.height,
      },
    ]);
    expect(geometry.marks).toHaveLength(count);
    expect(geometry.marks[count - 1].datum.id).toBe(`heatmap:cell-${count - 1}`);
    expect(geometry.xTicks.length).toBeLessThan(20);
    expect(geometry.yTicks.length).toBeLessThan(20);
    expect(geometry.marks.every((mark) => mark.rect!.width > 0 && mark.rect!.height > 0)).toBe(
      true
    );
  });

  it('keeps heatmap slots when cells are hidden and adds no backgrounds to an empty grid', () => {
    const model = normalizeChartData({
      type: 'heatmap',
      data: [
        { id: 'a', row: 'r1', col: 'c1', value: 0 },
        { id: 'b', row: 'r2', col: 'c2', value: 2 },
      ],
    });
    const full = buildChartGeometry(model, size);
    const visible = buildChartGeometry(deriveVisibleChartModel(model, ['a']), size);
    expect(visible.backgrounds).toEqual(full.backgrounds);
    expect(visible.marks[0].rect).toEqual(full.marks[1].rect);
    expect(
      buildChartGeometry(normalizeChartData({ type: 'heatmap', data: [] }), size).backgrounds
    ).toEqual([]);
  });
});

describe('scatter optional magnitude', () => {
  it('keeps an omitted magnitude separate from the existing fallback datum value', () => {
    const model = normalizeChartData({
      type: 'scatter',
      series: [
        {
          id: 's',
          name: 'S',
          points: [
            { id: 'ordinary', x: 1, y: 50 },
            { id: 'zero', x: 2, y: 60, value: 0 },
            { id: 'bubble', x: 3, y: 70, value: 4 },
          ],
        },
      ],
    });
    const datums = getChartDatums(model);
    expect(datums[0].value).toBe(50);
    expect(datums[0]).not.toHaveProperty('magnitude');
    expect(datums[1]).toMatchObject({ value: 0, magnitude: 0, y: 60 });
    expect(datums[2]).toMatchObject({ value: 4, magnitude: 4, y: 70 });
    expect(buildChartGeometry(model, size).marks.map((mark) => mark.datum)).toEqual(datums);
  });

  it.each([-1, NaN, Infinity, -Infinity])(
    'omits invalid magnitude %s without discarding valid coordinates',
    (value) => {
      const model = normalizeChartData({
        type: 'scatter',
        series: [{ id: 's', name: 'S', points: [{ id: 'p', x: 1, y: 7, value }] }],
      });
      expect(model.invalid).toBe(false);
      expect(model.issues).toHaveLength(1);
      expect(model.series[0].points[0]).not.toHaveProperty('value');
      const datum = getChartDatums(model)[0];
      expect(datum).toMatchObject({ value: 7, x: 1, y: 7 });
      expect(datum).not.toHaveProperty('magnitude');
    }
  );
});

describe('other expanded-form math regressions', () => {
  it.each(['bar', 'area'] as const)(
    'stacks %s signs separately and retains zero/null semantics',
    (type) => {
      const model = normalizeChartData({
        type,
        stack: true,
        categories: ['P', 'N', 'Gap', 'Zero'],
        series: [
          { id: 'a', name: 'A', values: [3, -2, null, 0] },
          { id: 'b', name: 'B', values: [4, -5, 8, 0] },
        ],
      });
      const geometry = buildChartGeometry(model, size, { stack: true });
      expect(geometry.yDomain).toEqual([-7, 8]);
      expect(geometry.marks.find((mark) => mark.datum.id === 'b:0')).toMatchObject({
        startValue: 3,
        endValue: 7,
      });
      expect(geometry.marks.find((mark) => mark.datum.id === 'b:1')).toMatchObject({
        startValue: -2,
        endValue: -7,
      });
      expect(geometry.marks.find((mark) => mark.datum.id === 'b:2')).toMatchObject({
        startValue: 0,
        endValue: 8,
      });
      expect(geometry.marks.find((mark) => mark.datum.id === 'b:3')).toMatchObject({
        startValue: 0,
        endValue: 0,
      });
      expect(geometry.marks.some((mark) => mark.datum.id === 'a:2')).toBe(false);
      const visible = buildChartGeometry(deriveVisibleChartModel(model, ['a']), size, {
        stack: true,
      });
      expect(visible.marks.find((mark) => mark.datum.id === 'b:0')).toMatchObject({
        startValue: 0,
        endValue: 4,
      });
      expectFiniteGeometry(geometry);
    }
  );

  it.each([false, true])('uses x(0) for a horizontal bar baseline (stack=%s)', (stack) => {
    const model = normalizeChartData({
      type: 'bar',
      categories: ['P', 'N', 'Zero'],
      series: [
        { id: 'a', name: 'A', values: [6, -3, 0] },
        { id: 'b', name: 'B', values: [2, -1, 0] },
      ],
    });
    const geometry = buildChartGeometry(model, size, {
      orientation: 'horizontal',
      stack,
      xDomain: [-10, 20],
    });
    expect(geometry.horizontal).toBe(true);
    expect(geometry.baseline).toBe(
      scaleChartValue(0, geometry.xDomain, [
        geometry.plot.left,
        geometry.plot.left + geometry.plot.width,
      ])
    );
    const zero = geometry.marks.find((mark) => mark.datum.id === 'a:2')!;
    expect(zero.rect!.x).toBe(geometry.baseline);
    expect(zero.rect!.width).toBe(0);
    expect(geometry.yTicks.map((tick) => tick.label)).toEqual(['P', 'N', 'Zero']);
    expectFiniteGeometry(geometry);
  });

  it('keeps radar axes and original series colors with zero and extreme finite values', () => {
    const model = normalizeChartData({
      type: 'radar',
      categories: ['A', 'B', 'C'],
      series: [
        { id: 'a', name: 'A', values: [0, Number.MAX_VALUE, Number.MIN_VALUE] },
        { id: 'b', name: 'B', color: 'var(--host-radar)', values: [0, 0, 0] },
      ],
    });
    const geometry = buildChartGeometry(deriveVisibleChartModel(model, ['a']), size);
    expect(geometry.radar!.axes.map((axis) => axis.label)).toEqual(['A', 'B', 'C']);
    expect(geometry.seriesPaths[0].color).toBe('var(--host-radar)');
    expect(
      geometry.marks.every((mark) => mark.x === geometry.radar!.cx && mark.y === geometry.radar!.cy)
    ).toBe(true);
    expectFiniteGeometry(buildChartGeometry(model, size));
    for (const values of [
      [1, -1, 2],
      [1, null, 2],
    ]) {
      const invalid = normalizeChartData({
        type: 'radar',
        categories: ['A', 'B', 'C'],
        series: [{ id: 's', name: 'S', values }],
      });
      expect(invalid.invalid).toBe(true);
      expect(buildChartGeometry(invalid, size).marks).toEqual([]);
    }
  });

  it.each([
    [0, 100, 0, 0],
    [-100, 100, 0, 0.5],
    [-Number.MAX_VALUE, Number.MAX_VALUE, 0, 0.5],
    [-Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, 1],
    [0, Number.MIN_VALUE, Number.MIN_VALUE, 1],
    [Number.MAX_VALUE * (1 - Number.EPSILON), Number.MAX_VALUE, Number.MAX_VALUE, 1],
  ])('gauge [%s, %s] maps %s to finite progress %s', (min, max, value, percent) => {
    const model = normalizeChartData({
      type: 'gauge',
      min,
      max,
      data: [{ id: 'g', label: 'Gauge', value }],
    });
    expect(model.invalid).toBe(false);
    expect(hasChartData(model)).toBe(true);
    expect(getChartDatums(model)[0].percent).toBe(percent);
    const geometry = buildChartGeometry(model, size);
    expect(geometry.marks).toHaveLength(1);
    if (percent === 0) expect(geometry.marks[0].path).toBe('');
    else expect(geometry.marks[0].path).toContain(' A ');
    expectFiniteGeometry(geometry);
  });

  it('preserves treemap proportions, single values, zeros and overflowing raw totals', () => {
    const model = normalizeChartData({
      type: 'treemap',
      data: [
        { id: 'a', label: 'A', value: 30 },
        { id: 'zero', label: 'Zero', value: 0 },
        { id: 'b', label: 'B', value: 20 },
        { id: 'c', label: 'C', value: 10 },
      ],
    });
    const geometry = buildChartGeometry(model, size);
    expect(getChartDatums(model).map((datum) => datum.id)).toEqual(['a', 'zero', 'b', 'c']);
    expect(geometry.marks.map((mark) => mark.datum.id)).toEqual(['a', 'b', 'c']);
    const areas = geometry.marks.map((mark) => (mark.rect!.width + 2) * (mark.rect!.height + 2));
    expect(areas[0] / areas[1]).toBeCloseTo(1.5, 8);
    expect(areas[1] / areas[2]).toBeCloseTo(2, 8);
    const single = buildChartGeometry(deriveVisibleChartModel(model, ['b', 'c']), size);
    expect(single.marks[0].rect).toEqual({
      x: 7,
      y: 7,
      width: size.width - 14,
      height: size.height - 14,
    });
    const empty = normalizeChartData({
      type: 'treemap',
      data: [{ id: 'z', label: 'Zero', value: 0 }],
    });
    expect(hasChartData(empty)).toBe(false);
    expect(buildChartGeometry(empty, size).marks).toEqual([]);
    const extreme = normalizeChartData({
      type: 'treemap',
      data: [
        { id: 'a', label: 'A', value: Number.MAX_VALUE },
        { id: 'b', label: 'B', value: Number.MAX_VALUE },
      ],
    });
    expect(getChartDatums(extreme).map((datum) => datum.percent)).toEqual([0.5, 0.5]);
    expectFiniteGeometry(buildChartGeometry(extreme, size));
  });

  it('retains funnel source order, including increases and zero stages', () => {
    const model = normalizeChartData({
      type: 'funnel',
      data: [
        { id: 'small', label: 'Small', value: 2 },
        { id: 'large', label: 'Large', value: 8 },
        { id: 'zero', label: 'Zero', value: 0 },
        { id: 'last', label: 'Last', value: 4 },
      ],
    });
    const snapshot = structuredClone(model);
    const geometry = buildChartGeometry(model, size);
    expect(geometry.marks.map((mark) => mark.datum.id)).toEqual(['small', 'large', 'zero', 'last']);
    expect(geometry.marks.map((mark) => mark.datum)).toEqual(getChartDatums(model));
    expect(
      geometry.marks.every((mark, index) => index === 0 || mark.y > geometry.marks[index - 1].y)
    ).toBe(true);
    expect(model).toEqual(snapshot);
    expectFiniteGeometry(geometry);
  });
});
