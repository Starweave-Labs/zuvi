import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axe from 'axe-core';
import { ConfigProvider, enUS } from '../../config';
import { Chart } from './Chart';
import type { ChartProps, ChartDatum } from './chart-types';

const categories = ['一月', '二月', '三月'];
const series = [
  { id: 'sales', name: '销售', values: [10, 20, 15] },
  { id: 'cost', name: '成本', values: [5, 8, 7] },
];
let resizeCallback: ResizeObserverCallback | null;
let width = 640;
let observerDisconnect: ReturnType<typeof vi.fn>;
let frames: Map<number, FrameRequestCallback>;
let nextId: number;

async function ready(container: HTMLElement) {
  // The first real lazy import also transforms its plotting modules in a cold
  // test worker; the full parallel suite can push this past a 3s budget.
  await waitFor(
    () => expect(container.querySelector('.zuvi-chart')).toHaveAttribute('data-status', 'ready'),
    { timeout: 8000 }
  );
}
async function flushFrame() {
  await act(async () => {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((callback) => callback(100));
  });
}
function chart(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.zuvi-chart')!;
}
function datum(container: HTMLElement, id: string) {
  return [...container.querySelectorAll<HTMLButtonElement>('[data-part="datum"]')].find(
    (node) => node.dataset.datumId === id
  )!;
}
function openTable(container: HTMLElement) {
  const details = container.querySelector<HTMLDetailsElement>('[data-part="data-table"]')!;
  details.open = true;
  fireEvent(details, new Event('toggle'));
  return within(details);
}

beforeEach(() => {
  width = 640;
  resizeCallback = null;
  frames = new Map();
  nextId = 0;
  observerDisconnect = vi.fn();
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    width,
    height: 300,
    right: width,
    bottom: 300,
    toJSON() {
      return {};
    },
  }));
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: ResizeObserverCallback) {
        resizeCallback = callback;
      }
      observe() {}
      disconnect() {
        observerDisconnect();
      }
    }
  );
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++nextId, callback);
    return nextId;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
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

describe('Chart', () => {
  it('keeps SSR stable and forwards a native root ref, attributes, style and slots', async () => {
    const markup = renderToString(
      <Chart categories={categories} series={series} aria-label="季度趋势" />
    );
    expect(markup).toContain('data-status="loading"');
    expect(markup).toContain('季度趋势');
    const ref = React.createRef<HTMLDivElement>();
    const { container } = render(
      <Chart
        ref={ref}
        categories={categories}
        series={series}
        className="host-chart"
        classNames={{ svg: 'host-svg', title: 'host-title' }}
        title="季度趋势"
        data-host="yes"
        style={{ marginTop: 9 }}
      />
    );
    await ready(container);
    expect(ref.current).toBe(chart(container));
    expect(chart(container)).toHaveClass('host-chart');
    expect(chart(container)).toHaveAttribute('data-host', 'yes');
    expect(chart(container).style.marginTop).toBe('9px');
    expect(container.querySelector('svg')).toHaveClass('host-svg');
    expect(screen.getByText('季度趋势', { selector: '[data-part="title"]' })).toHaveClass(
      'host-title'
    );
  });

  it.each(['line', 'area', 'bar', 'pie', 'donut', 'scatter'] as const)(
    'renders the %s variant with real marks and matching table data',
    async (type) => {
      const props: ChartProps =
        type === 'pie' || type === 'donut'
          ? {
              type,
              data: [
                { id: 'a', label: '区域 A', value: 10 },
                { id: 'b', label: '区域 B', value: 20 },
              ],
            }
          : type === 'scatter'
            ? {
                type,
                series: [
                  {
                    id: 'points',
                    name: '样本',
                    points: [
                      { id: 'a', label: '样本 A', x: 1, y: 2 },
                      { id: 'b', x: 2, y: 3 },
                    ],
                  },
                ],
              }
            : { type, categories, series };
      const { container } = render(<Chart {...props} />);
      await ready(container);
      expect(chart(container)).toHaveAttribute('data-type', type);
      expect(container.querySelectorAll('[data-part="mark"]').length).toBeGreaterThan(0);
      expect(container.querySelectorAll('[data-part="datum"]').length).toBeGreaterThan(0);
      const table = openTable(container);
      expect(await table.findByRole('table')).toBeInTheDocument();
      expect(table.getAllByRole('row').length).toBeGreaterThan(1);
    }
  );

  it('legend toggles hide and restore series without losing canonical table rows', async () => {
    const onHiddenSeriesChange = vi.fn();
    const { container } = render(
      <Chart categories={categories} series={series} onHiddenSeriesChange={onHiddenSeriesChange} />
    );
    await ready(container);
    const legend = within(container.querySelector<HTMLElement>('[data-part="legend"]')!);
    fireEvent.click(legend.getByRole('button', { name: '销售' }));
    expect(legend.getByRole('button', { name: '销售' })).toHaveAttribute('aria-pressed', 'false');
    expect(container.querySelectorAll('[data-part="mark"][data-series-id="sales"]')).toHaveLength(
      0
    );
    expect(onHiddenSeriesChange).toHaveBeenLastCalledWith(['sales']);
    const table = openTable(container);
    expect(await table.findByRole('columnheader', { name: '销售' })).toBeInTheDocument();
    fireEvent.click(legend.getByRole('button', { name: '成本' }));
    await waitFor(() => expect(chart(container)).toHaveAttribute('data-status', 'empty'));
    expect(screen.getByText('所有数据系列已隐藏')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '显示全部系列' }));
    await ready(container);
    expect(container.querySelectorAll('[data-part="mark"]')).toHaveLength(6);
  });

  it('painted radial sectors respond across the whole shape, not just the small keyboard anchor', async () => {
    const onDataClick = vi.fn();
    const { container } = render(
      <Chart
        type="pie"
        data={[{ id: 'all', label: '全部', value: 10 }]}
        onDataClick={onDataClick}
      />
    );
    await ready(container);
    const shape = container.querySelector<SVGPathElement>('path[data-part="mark"]')!;
    fireEvent.mouseEnter(shape);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('全部');
    fireEvent.click(shape);
    expect(onDataClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'all', percent: 1 }),
      expect.anything()
    );
    expect(datum(container, 'all')).toHaveAttribute('aria-pressed', 'true');
  });

  it('respects native root capture cancellation on both legend and data controls', async () => {
    const onHiddenSeriesChange = vi.fn();
    const onChange = vi.fn();
    const { container } = render(
      <Chart
        categories={categories}
        series={series}
        onHiddenSeriesChange={onHiddenSeriesChange}
        onChange={onChange}
        onClickCapture={(event) => event.preventDefault()}
      />
    );
    await ready(container);
    fireEvent.click(screen.getByRole('button', { name: '销售' }));
    fireEvent.click(datum(container, 'sales:0'));
    expect(onHiddenSeriesChange).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('distinct high-precision numeric ticks keep distinct axis labels', async () => {
    const { container } = render(
      <Chart
        type="scatter"
        series={[
          {
            id: 'close',
            name: '精度',
            points: [
              { id: 'a', x: 1.00001, y: 1.00001 },
              { id: 'b', x: 1.00004, y: 1.00004 },
            ],
          },
        ]}
      />
    );
    await ready(container);
    const yTicks = [...container.querySelectorAll<SVGTextElement>('[data-part="y-tick"]')];
    const values = yTicks.map((node) => node.textContent);
    expect(values.length).toBeGreaterThan(1);
    expect(new Set(values).size).toBe(values.length);
  });

  it('clears stale focus ownership after disabling then re-enabling a chart', async () => {
    const { container, rerender } = render(<Chart categories={categories} series={series} />);
    await ready(container);
    await act(async () => datum(container, 'sales:0').focus());
    expect(await screen.findByRole('tooltip')).toBeInTheDocument();
    rerender(<Chart categories={categories} series={series} disabled />);
    rerender(<Chart categories={categories} series={series} />);
    fireEvent.mouseEnter(datum(container, 'sales:0'));
    expect(await screen.findByRole('tooltip')).toBeInTheDocument();
    fireEvent.mouseLeave(datum(container, 'sales:0'));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('long category labels stay abbreviated on the axis but fully available in data', async () => {
    const long = 'WWWWWWWWWWWWWWWWWWWW';
    const { container } = render(
      <Chart categories={['开始', long]} series={[{ id: 'a', name: '系列', values: [1, 2] }]} />
    );
    await ready(container);
    const ticks = [...container.querySelectorAll('.zuvi-chart-tick')];
    const label = ticks.find((node) => node.querySelector('title')?.textContent === long)!;
    expect(label.querySelector('title')).toHaveTextContent(long);
    const table = openTable(container);
    expect(await table.findByRole('rowheader', { name: long })).toBeInTheDocument();
  });

  it('controlled visibility and selection only request updates', async () => {
    const onHiddenSeriesChange = vi.fn();
    const onChange = vi.fn();
    const { container } = render(
      <Chart
        categories={categories}
        series={series}
        hiddenSeries={[]}
        value="sales:0"
        onHiddenSeriesChange={onHiddenSeriesChange}
        onChange={onChange}
      />
    );
    await ready(container);
    fireEvent.click(screen.getByRole('button', { name: '销售' }));
    expect(onHiddenSeriesChange).toHaveBeenCalledWith(['sales']);
    expect(screen.getByRole('button', { name: '销售' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(datum(container, 'sales:1'));
    expect(onChange).toHaveBeenLastCalledWith('sales:1');
    expect(datum(container, 'sales:1')).toHaveAttribute('aria-pressed', 'false');
    expect(datum(container, 'sales:0')).toHaveAttribute('aria-pressed', 'true');
  });

  it('roving keyboard focus shows a tooltip, navigates and only consumes Escape when open', async () => {
    const { container } = render(<Chart categories={categories} series={series} />);
    await ready(container);
    const first = datum(container, 'sales:0');
    await act(async () => first.focus());
    expect(await screen.findByRole('tooltip')).toHaveTextContent('一月');
    fireEvent.keyDown(first, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(datum(container, 'sales:1'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('二月');
    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    fireEvent(document.activeElement!, escape);
    expect(escape.defaultPrevented).toBe(true);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    const unused = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    fireEvent(document.activeElement!, unused);
    expect(unused.defaultPrevented).toBe(false);
    fireEvent.keyDown(document.activeElement!, { key: 'End' });
    expect(document.activeElement).toBe(datum(container, 'cost:2'));
  });

  it('supplies current datum callbacks and event cancellation prevents default selection', async () => {
    const onChange = vi.fn();
    const cancelled = vi.fn((_datum: ChartDatum, event: React.MouseEvent<Element>) =>
      event.preventDefault()
    );
    const next = vi.fn();
    const { container, rerender } = render(
      <Chart categories={categories} series={series} onChange={onChange} onDataClick={cancelled} />
    );
    await ready(container);
    fireEvent.click(datum(container, 'sales:1'));
    expect(cancelled).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'sales:1', label: '二月', value: 20 }),
      expect.anything()
    );
    expect(onChange).not.toHaveBeenCalled();
    rerender(
      <Chart
        categories={categories}
        series={[{ ...series[0], values: [10, 99, 15] }]}
        onChange={onChange}
        onDataClick={next}
      />
    );
    fireEvent.click(datum(container, 'sales:1'));
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ value: 99 }), expect.anything());
    expect(datum(container, 'sales:1')).toHaveAttribute('aria-pressed', 'true');
  });

  it('does not turn null or invalid numeric values into zero, and rejects negative pie values', async () => {
    const onError = vi.fn();
    const { container, rerender } = render(
      <Chart
        categories={categories}
        series={[{ id: 'gap', name: '缺失值', values: [2, null, 3] }]}
      />
    );
    await ready(container);
    expect(container.querySelectorAll('[data-part="mark"]')).toHaveLength(2);
    const table = openTable(container);
    expect(await table.findByText('—', { selector: 'td' })).toBeInTheDocument();
    rerender(
      <Chart type="pie" data={[{ id: 'bad', label: '负数', value: -1 }]} onError={onError} />
    );
    await waitFor(() => expect(chart(container)).toHaveAttribute('data-status', 'error'));
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'data' }));
    expect(container.querySelectorAll('[data-part="mark"]')).toHaveLength(0);
  });

  it('distinguishes loading, all-zero radial empty data and host errors', async () => {
    const { container, rerender } = render(
      <Chart categories={[]} series={[]} loading loadingContent={<span>等待数据源</span>} />
    );
    await waitFor(() => expect(screen.getByText('等待数据源')).toBeInTheDocument());
    expect(chart(container)).toHaveAttribute('data-status', 'loading');
    rerender(<Chart type="donut" data={[{ id: 'zero', label: '零值', value: 0 }]} />);
    await waitFor(() => expect(chart(container)).toHaveAttribute('data-status', 'empty'));
    expect(screen.getByText('暂无图表数据')).toBeInTheDocument();
    rerender(<Chart categories={categories} series={series} error="数据源不可用" />);
    await waitFor(() => expect(chart(container)).toHaveAttribute('data-status', 'error'));
    expect(screen.getByText('数据源不可用')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-part="datum"]')).toHaveLength(0);
  });

  it('honors locale, custom formatting/tooltip and disabled interactions', async () => {
    const { container, rerender } = render(
      <ConfigProvider locale={enUS}>
        <Chart
          categories={categories}
          series={series}
          valueFormatter={(value) => `${value} units`}
          renderTooltip={(datum) => <strong>Value {datum.value}</strong>}
        />
      </ConfigProvider>
    );
    await ready(container);
    fireEvent.mouseEnter(datum(container, 'sales:0'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Value 10');
    const table = openTable(container);
    expect(await table.findByText('10 units', { selector: 'td' })).toBeInTheDocument();
    rerender(
      <ConfigProvider locale={enUS}>
        <Chart categories={categories} series={series} disabled />
      </ConfigProvider>
    );
    expect(container.querySelectorAll('[data-part="datum"]')).toHaveLength(0);
    expect(screen.getByRole('button', { name: '销售' })).toBeDisabled();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('recovers layout from a hidden container, updates viewBox and cleans resize work', async () => {
    width = 0;
    const { container, unmount } = render(<Chart categories={categories} series={series} />);
    await ready(container);
    width = 320;
    await act(async () => resizeCallback?.([], {} as ResizeObserver));
    await flushFrame();
    expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 320 300');
    fireEvent(window, new Event('resize'));
    expect(frames.size).toBe(1);
    unmount();
    expect(frames.size).toBe(0);
    expect(observerDisconnect).toHaveBeenCalled();
  });

  it('StrictMode keeps one visible chart and preserves update/cleanup behavior', async () => {
    const onReady = vi.fn();
    const { container, unmount } = render(
      <React.StrictMode>
        <Chart categories={categories} series={series} onReady={onReady} />
      </React.StrictMode>
    );
    await ready(container);
    expect(container.querySelectorAll('svg')).toHaveLength(1);
    await waitFor(() => expect(onReady).toHaveBeenCalled());
    unmount();
    expect(frames.size).toBe(0);
  });

  it('passes axe with a complete legend, keyboard data points and a semantic table', async () => {
    const { container } = render(
      <main>
        <Chart title="销售趋势" categories={categories} series={series} />
      </main>
    );
    await ready(container);
    openTable(container);
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toEqual([]);
  });
});
