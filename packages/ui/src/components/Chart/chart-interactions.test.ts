import { describe, expect, it } from 'vitest';
import {
  brushChartRange,
  bubbleRadius,
  buildChartCsv,
  nearestChartCategory,
  normalizeViewRange,
  sameChartRange,
  zoomChartRange,
} from './chart-interactions';
import { normalizeChartData } from './chart-model';
import type { NumericDomain } from './chart-scale';
import type { ChartDatum } from './chart-types';

function bounded(range: NumericDomain | null, domain: NumericDomain) {
  if (!range) return;
  expect(range.every(Number.isFinite)).toBe(true);
  expect(range[0]).toBeGreaterThanOrEqual(domain[0]);
  expect(range[1]).toBeLessThanOrEqual(domain[1]);
  expect(range[0]).toBeLessThan(range[1]);
}

describe('Chart viewport numerical helpers', () => {
  it('compares committed range values rather than tuple identity, with null as the full viewport', () => {
    expect(sameChartRange(null, null)).toBe(true);
    expect(sameChartRange([20, 80], [20, 80])).toBe(true);
    expect(sameChartRange(null, [0, 100])).toBe(false);
    expect(sameChartRange([20, 80], [20, 81])).toBe(false);
  });

  it('normalizes null, full-domain, clipped and invalid ranges without mutating source values', () => {
    const source = Object.freeze([-20, 80] as const);
    expect(normalizeViewRange(source, [0, 100])).toEqual([0, 80]);
    expect(source).toEqual([-20, 80]);
    for (const range of [
      null,
      undefined,
      [0, 100],
      [-10, 110],
      [80, 20],
      [20, 20],
      [NaN, 80],
      [120, 150],
    ] as const) {
      expect(normalizeViewRange(range, [0, 100])).toBeNull();
    }
  });

  it('keeps exact identity-zoom endpoints, including already narrower-than-minimum ranges', () => {
    expect(zoomChartRange([20, 80], [0, 100], 1)).toEqual([20, 80]);
    expect(zoomChartRange([49.999, 50.001], [0, 100], 1)).toEqual([49.999, 50.001]);
    expect(zoomChartRange(null, [0, 100], 1)).toBeNull();
  });

  it('zooms around a clamped X anchor and bounds the minimum span and full-domain reset', () => {
    expect(zoomChartRange(null, [0, 100], 0.5)).toEqual([25, 75]);
    expect(zoomChartRange(null, [0, 100], 0.5, 0)).toEqual([0, 50]);
    expect(zoomChartRange(null, [0, 100], 0.5, 1)).toEqual([50, 100]);
    expect(zoomChartRange(null, [0, 100], 0.5, NaN)).toEqual([25, 75]);
    expect(zoomChartRange([20, 80], [0, 100], 2)).toBeNull();
    const tiny = zoomChartRange(null, [0, 100], 1e-20)!;
    expect(tiny[1] - tiny[0]).toBeCloseTo(0.1);
    expect(zoomChartRange(tiny, [0, 100], 0.1)).toEqual(tiny);
    const exactMinimum = zoomChartRange(null, [0, 1], 0.001, 0)!;
    expect(zoomChartRange(exactMinimum, [0, 1], 0.1)).toEqual(exactMinimum);
  });

  it('keeps overflowing-span zoom/brush results finite and inside the original domain', () => {
    const domain: NumericDomain = [-Number.MAX_VALUE, Number.MAX_VALUE];
    bounded(zoomChartRange(null, domain, 0.5), domain);
    bounded(zoomChartRange(null, domain, 0.001, 0), domain);
    bounded(brushChartRange(20, 70, { left: 0, width: 100 }, domain), domain);
    expect(zoomChartRange(null, domain, 0.5)).not.toBeNull();
  });

  it('brush remains compatible with its left/width helper input, clamps before the threshold and respects reverse drag', () => {
    expect(brushChartRange(60, 160, { left: 20, width: 200 }, [0, 100])).toEqual([20, 70]);
    expect(brushChartRange(160, 60, { left: 20, width: 200 }, [0, 100])).toEqual([20, 70]);
    expect(brushChartRange(-500, 500, { left: 20, width: 200 }, [0, 100])).toEqual([0, 100]);
    expect(brushChartRange(-500, -50, { left: 20, width: 200 }, [0, 100])).toBeNull();
    expect(brushChartRange(60, 66, { left: 20, width: 200 }, [0, 100])).toBeNull();
  });

  it('invalid plot, domain and zoom factors return safe null ranges', () => {
    for (const factor of [0, -1, NaN, Infinity])
      expect(zoomChartRange(null, [0, 100], factor)).toBeNull();
    for (const plot of [
      { left: NaN, width: 100 },
      { left: 0, width: Infinity },
      { left: 0, width: 0 },
    ]) {
      expect(brushChartRange(20, 70, plot, [0, 100])).toBeNull();
    }
    expect(brushChartRange(20, 70, { left: 0, width: 100 }, [100, 0])).toBeNull();
  });
});

describe('existing Chart helper compatibility', () => {
  it('preserves numeric negative CSV values and protects formulas, quotes, multiline text and missing values', () => {
    const model = normalizeChartData({
      categories: ['=1+1', 'quoted,"text', 'multi\nline', '\tformula', ' @SUM(A1)'],
      series: [{ id: 'a', name: '+unsafe', values: [-3, null, 7, 4, 5] }],
    });
    const csv = buildChartCsv(model);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"\'=1+1"');
    expect(csv).toContain('"\'+unsafe"');
    expect(csv).toContain('"quoted,""text",""');
    expect(csv).toContain('"multi\nline","7"');
    expect(csv).toContain('"\'\tformula"');
    expect(csv).toContain('"\' @SUM(A1)"');
    expect(csv).toContain('"-3"');
    expect(csv.endsWith('\r\n')).toBe(true);
  });

  it('keeps scatter, heatmap and radial CSV columns and full source rows intact', () => {
    const scatter = normalizeChartData({
      type: 'scatter',
      series: [{ id: 'p', name: 'Points', points: [{ id: 'a', x: -1, y: 2, value: 3 }] }],
    });
    expect(buildChartCsv(scatter)).toContain(
      '"series","id","label","x","y","value"\r\n"Points","a","a","-1","2","3"'
    );
    const heatmap = normalizeChartData({
      type: 'heatmap',
      data: [{ id: 'c', row: 'r', col: 'k', value: -2 }],
    });
    expect(buildChartCsv(heatmap)).toContain('"id","row","col","value"\r\n"c","r","k","-2"');
    const pie = normalizeChartData({ type: 'pie', data: [{ id: 's', label: 'Slice', value: 4 }] });
    expect(buildChartCsv(pie)).toContain('"id","label","value"\r\n"s","Slice","4"');
  });

  it('preserves bubble area mapping and nearest category tie order', () => {
    expect(bubbleRadius(0, [0, 100])).toBe(4);
    expect(bubbleRadius(100, [0, 100])).toBe(20);
    expect(bubbleRadius(50, [0, 100]) ** 2).toBeCloseTo((4 ** 2 + 20 ** 2) / 2);
    const marks = [
      { datum: { index: 1 } as ChartDatum, x: 20 },
      { datum: { index: 2 } as ChartDatum, x: 40 },
    ];
    expect(nearestChartCategory(marks, 30)).toBe(1);
    expect(nearestChartCategory(marks, 39)).toBe(2);
    expect(nearestChartCategory([], 30)).toBeNull();
  });
});
