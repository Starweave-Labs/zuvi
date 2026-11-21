import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Chart } from './Chart';
import { normalizeChartData } from './chart-model';
import { buildChartGeometry } from './chart-geometry';
import {
  brushChartRange,
  buildChartCsv,
  normalizeViewRange,
  zoomChartRange,
} from './chart-interactions';
import type { ChartProps } from './chart-types';

const categories = ['A', 'B', 'C', 'D'];
const series = [
  { id: 'a', name: 'Alpha', values: [2, 4, 3, 6] },
  { id: 'b', name: 'Beta', values: [1, 2, 5, 3] },
];
const slices = [
  { id: 'a', label: 'Alpha', value: 30 },
  { id: 'b', label: 'Beta', value: 20 },
  { id: 'c', label: 'Gamma', value: 10 },
];
const size = { width: 640, height: 300 };

function query(container: HTMLElement, selector: string) {
  return container.querySelector<HTMLElement>(selector)!;
}
async function ready(container: HTMLElement) {
  await waitFor(
    () => expect(query(container, '.zuvi-chart')).toHaveAttribute('data-status', 'ready'),
    { timeout: 3000 }
  );
}

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 640,
    bottom: 300,
    width: 640,
    height: 300,
    toJSON() {},
  });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    }
  );
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  }));
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Chart expanded forms', () => {
  const forms: ChartProps[] = [
    { type: 'line', categories, series },
    { type: 'area', categories, series },
    { type: 'area', stack: true, categories, series },
    { type: 'bar', categories, series },
    { type: 'bar', stack: true, categories, series },
    { type: 'bar', orientation: 'horizontal', categories, series },
    { type: 'pie', data: slices },
    { type: 'donut', data: slices },
    {
      type: 'scatter',
      series: [
        {
          id: 'p',
          name: 'P',
          points: [
            { id: '1', x: 1, y: 2 },
            { id: '2', x: 2, y: 4 },
          ],
        },
      ],
    },
    {
      type: 'scatter',
      bubble: true,
      series: [
        {
          id: 'p',
          name: 'P',
          points: [
            { id: '1', x: 1, y: 2, value: 4 },
            { id: '2', x: 2, y: 4, value: 20 },
          ],
        },
      ],
    },
    { type: 'radar', categories, series },
    {
      type: 'heatmap',
      data: [
        { id: '1', row: 'r1', col: 'c1', value: -3 },
        { id: '2', row: 'r2', col: 'c2', value: 8 },
      ],
    },
    { type: 'treemap', data: slices },
    { type: 'funnel', data: slices },
    { type: 'gauge', data: [{ id: 'g', label: 'Gauge', value: 70 }], min: 0, max: 100 },
    {
      type: 'waterfall',
      data: [
        { id: 'a', label: 'Start', value: 20 },
        { id: 'b', label: 'Decrease', value: -8 },
        { id: 'c', label: 'Increase', value: 4 },
      ],
    },
    { type: 'sparkline', categories, series },
  ];
  it.each(forms.map((props, index) => [index, props] as const))(
    'renders form %i with real finite geometry and native datums',
    async (_index, props) => {
      const { container } = render(<Chart {...props} />);
      await ready(container);
      expect(container.querySelectorAll('[data-part="mark"]').length).toBeGreaterThan(0);
      const svg = query(container, 'svg');
      expect(svg.innerHTML).not.toMatch(/NaN|Infinity/);
      expect(container.querySelectorAll('[data-part="datum"]').length).toBeGreaterThan(0);
      for (const mark of buildChartGeometry(
        normalizeChartData(props),
        size,
        'stack' in props ? { stack: props.stack, orientation: props.orientation } : {}
      ).marks) {
        expect(Number.isFinite(mark.x)).toBe(true);
        expect(Number.isFinite(mark.y)).toBe(true);
      }
    }
  );

  it('stacked signs accumulate from separate zero baselines and null remains a gap', () => {
    const model = normalizeChartData({
      type: 'bar',
      categories: ['P', 'N', 'Gap'],
      series: [
        { id: 'a', name: 'A', values: [3, -2, null] },
        { id: 'b', name: 'B', values: [4, -5, 8] },
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
    expect(geometry.marks.some((mark) => mark.datum.id === 'a:2')).toBe(false);
  });

  it('radar rejects insufficient axes and negative/missing values', () => {
    expect(
      normalizeChartData({
        type: 'radar',
        categories: ['a', 'b'],
        series: [{ id: 'a', name: 'A', values: [1, 2] }],
      }).invalid
    ).toBe(true);
    expect(
      normalizeChartData({
        type: 'radar',
        categories: ['a', 'b', 'c'],
        series: [{ id: 'a', name: 'A', values: [1, -2, null] }],
      }).invalid
    ).toBe(true);
  });

  it('heatmap keeps signed values and renders an explicit missing cell background', () => {
    const model = normalizeChartData({
      type: 'heatmap',
      data: [
        { id: 'a', row: 'r1', col: 'c1', value: -5 },
        { id: 'b', row: 'r2', col: 'c2', value: 10 },
      ],
    });
    const geometry = buildChartGeometry(model, size);
    expect(geometry.marks).toHaveLength(2);
    expect(geometry.backgrounds).toHaveLength(4);
    expect(geometry.heatLegend).toEqual({ min: -5, max: 10 });
    expect(
      normalizeChartData({
        type: 'heatmap',
        data: [
          { id: 'a', row: 'r', col: 'c', value: 1 },
          { id: 'b', row: 'r', col: 'c', value: 2 },
        ],
      }).invalid
    ).toBe(true);
  });

  it('treemap maintains proportional area and single values occupy the whole map', () => {
    const model = normalizeChartData({ type: 'treemap', data: slices });
    const marks = buildChartGeometry(model, size).marks;
    const area = marks.map((mark) => (mark.rect!.width + 2) * (mark.rect!.height + 2));
    expect(area[0] / area[1]).toBeCloseTo(1.5, 4);
    expect(
      buildChartGeometry(normalizeChartData({ type: 'treemap', data: [slices[0]] }), size).marks[0]
        .rect?.width
    ).toBe(size.width - 14);
  });

  it('radar grid publishes numeric ring labels as well as named axes', async () => {
    const { container } = render(<Chart type="radar" categories={categories} series={series} />);
    await ready(container);
    expect(container.querySelectorAll('[data-part="radar-tick"]')).toHaveLength(4);
    expect(
      [...container.querySelectorAll('[data-part="radar-tick"]')].map((tick) => tick.textContent)
    ).toEqual(['1.5', '3', '4.5', '6']);
  });

  it('funnel keeps stage order and gauge bounds are strict', () => {
    expect(
      buildChartGeometry(
        normalizeChartData({ type: 'funnel', data: [slices[2], slices[0], slices[1]] }),
        size
      ).marks.map((mark) => mark.datum.id)
    ).toEqual(['c', 'a', 'b']);
    expect(normalizeChartData({ type: 'gauge', min: 10, max: 10, data: [slices[0]] }).invalid).toBe(
      true
    );
    expect(normalizeChartData({ type: 'gauge', min: 0, max: 10, data: [slices[0]] }).invalid).toBe(
      true
    );
  });

  it('waterfall connectors preserve cumulative increase and decrease', () => {
    const geometry = buildChartGeometry(
      normalizeChartData({
        type: 'waterfall',
        data: [
          { id: 'a', label: 'A', value: 5 },
          { id: 'b', label: 'B', value: -8 },
          { id: 'c', label: 'C', value: 6 },
        ],
      }),
      size
    );
    expect(geometry.marks.map((mark) => [mark.startValue, mark.endValue])).toEqual([
      [0, 5],
      [5, -3],
      [-3, 3],
    ]);
    expect(geometry.seriesPaths[0].dashed).toBe(true);
  });
});

describe('Chart advanced interaction', () => {
  it('crosshair shows all visible same-category values without changing selected data', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Chart categories={categories} series={series} tooltipMode="crosshair" onChange={onChange} />
    );
    await ready(container);
    fireEvent.mouseMove(query(container, '[data-part="plot"]'), { clientX: 246, clientY: 120 });
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Alpha');
    expect(screen.getByRole('tooltip')).toHaveTextContent('Beta');
    expect(container.querySelector('[data-part="crosshair"]')).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('Shift legend emphasis is independent from hiddenSeries', async () => {
    const onHidden = vi.fn();
    const { container } = render(
      <Chart categories={categories} series={series} onHiddenSeriesChange={onHidden} />
    );
    await ready(container);
    fireEvent.click(screen.getByRole('button', { name: 'Alpha' }), { shiftKey: true });
    expect(query(container, '[data-part="legend-item"][data-series-id="a"]')).toHaveAttribute(
      'data-solo'
    );
    expect(container.querySelectorAll('[data-part="mark"]')).toHaveLength(8);
    expect(onHidden).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Alpha' }));
    expect(onHidden).toHaveBeenCalledWith(['a']);
  });

  it('range normalization, zoom and brush never corrupt the full domain', () => {
    expect(normalizeViewRange([1, 3], [0, 6])).toEqual([1, 3]);
    expect(normalizeViewRange([-1, 9], [0, 6])).toBeNull();
    expect(normalizeViewRange([3, 1], [0, 6])).toBeNull();
    expect(zoomChartRange(null, [0, 10], 0.5)).toEqual([2.5, 7.5]);
    expect(brushChartRange(20, 70, { left: 0, width: 100 }, [0, 10])).toEqual([2, 7]);
  });

  it('controlled view range only requests zoom changes, keyboard reset restores null', async () => {
    const onRange = vi.fn();
    const { container, rerender } = render(
      <Chart
        categories={categories}
        series={series}
        zoom
        viewRange={null}
        onViewRangeChange={onRange}
      />
    );
    await ready(container);
    const plot = query(container, '[data-part="plot"]');
    fireEvent.keyDown(plot, { key: '+' });
    expect(onRange).toHaveBeenCalled();
    expect(plot).not.toHaveAttribute('data-zoomed');
    rerender(
      <Chart
        categories={categories}
        series={series}
        zoom
        viewRange={[1, 2]}
        onViewRangeChange={onRange}
      />
    );
    expect(plot).toHaveAttribute('data-zoomed');
    fireEvent.keyDown(plot, { key: 'Escape' });
    expect(onRange).toHaveBeenLastCalledWith(null);
  });

  it('CSV retains all source values with correct escaping and textual formula protection', () => {
    const model = normalizeChartData({
      categories: ['=1+1', 'quoted,"text', 'multi\nline'],
      series: [{ id: 'a', name: 'A', values: [-3, null, 7] }],
    });
    const csv = buildChartCsv(model);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"\'=1+1"');
    expect(csv).toContain('"quoted,""text"');
    expect(csv).toContain('"-3"');
    expect(csv).toContain('\r\n');
  });

  it('bubble sizes represent area and keep source values in tooltip', async () => {
    const { container } = render(
      <Chart
        type="scatter"
        bubble
        bubbleDomain={[4, 20]}
        series={[
          {
            id: 'a',
            name: 'A',
            points: [
              { id: 'x', x: 1, y: 2, value: 4 },
              { id: 'y', x: 3, y: 5, value: 20 },
            ],
          },
        ]}
      />
    );
    await ready(container);
    const circles = [...container.querySelectorAll<SVGCircleElement>('circle[data-part="mark"]')];
    expect(circles[0].style.r).toBe('4px');
    expect(circles[1].style.r).toBe('20px');
  });

  it('horizontal signed bars draw the zero baseline vertically at x(0)', async () => {
    const props: ChartProps = {
      type: 'bar',
      orientation: 'horizontal',
      categories: ['Negative', 'Positive'],
      series: [{ id: 'a', name: 'A', values: [-4, 6] }],
    };
    const { container } = render(<Chart {...props} />);
    await ready(container);
    const geometry = buildChartGeometry(normalizeChartData(props), size, {
      orientation: 'horizontal',
    });
    const zero = container.querySelector('[data-zero-axis]')!;
    expect(Number(zero.getAttribute('x1'))).toBe(geometry.baseline);
    expect(zero.getAttribute('x1')).toBe(zero.getAttribute('x2'));
    expect(Number(zero.getAttribute('y2'))).toBe(geometry.plot.top + geometry.plot.height);
  });

  it('disabled plots keep their image but stop shape callbacks and touch capture', async () => {
    const onDataClick = vi.fn();
    const { container } = render(
      <Chart
        categories={categories}
        series={series}
        disabled
        zoom
        brush
        onDataClick={onDataClick}
      />
    );
    await ready(container);
    expect(query(container, '[data-part="plot"]')).not.toHaveAttribute('data-viewport-enabled');
    fireEvent.click(query(container, '[data-part="mark"]'));
    expect(onDataClick).not.toHaveBeenCalled();
    expect(container.querySelectorAll('[data-part="datum"]')).toHaveLength(0);
  });

  it('host click veto prevents data callbacks, not just selection', async () => {
    const onDataClick = vi.fn();
    const { container } = render(
      <Chart
        categories={categories}
        series={series}
        onDataClick={onDataClick}
        onClickCapture={(event) => event.preventDefault()}
      />
    );
    await ready(container);
    fireEvent.click(query(container, '[data-part="datum"]'));
    expect(onDataClick).not.toHaveBeenCalled();
  });

  it('Shift+Enter and Shift+Space emphasize independently without hiding data', async () => {
    const onHidden = vi.fn();
    const { container } = render(
      <Chart categories={categories} series={series} onHiddenSeriesChange={onHidden} />
    );
    await ready(container);
    const button = screen.getByRole('button', { name: 'Alpha' });
    fireEvent.keyDown(button, { key: 'Enter', shiftKey: true });
    expect(button).toHaveAttribute('data-solo');
    fireEvent.keyDown(button, { key: ' ', shiftKey: true });
    fireEvent.keyUp(button, { key: ' ', shiftKey: true });
    expect(button).not.toHaveAttribute('data-solo');
    expect(container.querySelectorAll('[data-part="mark"]')).toHaveLength(8);
    expect(onHidden).not.toHaveBeenCalled();
  });

  it('custom tooltip remains authoritative in crosshair mode', async () => {
    const { container } = render(
      <Chart
        categories={categories}
        series={series}
        tooltipMode="crosshair"
        renderTooltip={(datum) => <span>Custom {datum.label}</span>}
      />
    );
    await ready(container);
    fireEvent.mouseEnter(query(container, '[data-part="datum"]'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Custom A');
    expect(screen.getByRole('tooltip')).not.toHaveTextContent('Beta');
  });

  it('missing bubble magnitudes keep normal radii and remain missing in the canonical table', async () => {
    const { container } = render(
      <Chart
        type="scatter"
        bubble
        bubbleDomain={[4, 20]}
        series={[
          {
            id: 'a',
            name: 'A',
            points: [
              { id: 'missing', x: 1, y: 200 },
              { id: 'present', x: 2, y: 3, value: 20 },
            ],
          },
        ]}
      />
    );
    await ready(container);
    const circles = [...container.querySelectorAll<SVGCircleElement>('circle[data-part="mark"]')];
    expect(circles[0].style.r).toBe('var(--zuvi-chart-point-radius)');
    expect(circles[1].style.r).toBe('20px');
    const details = query(container, '[data-part="data-table"]') as HTMLDetailsElement;
    details.open = true;
    fireEvent(details, new Event('toggle'));
    expect(await screen.findByRole('columnheader', { name: '数值' })).toBeInTheDocument();
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('—');
  });
});
