import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { setTimeout } from 'node:timers/promises';

const require = createRequire(import.meta.url);
const uiRequire = createRequire(new URL('../../packages/ui/package.json', import.meta.url));
const { JSDOM } = uiRequire('jsdom');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ui = require('@zuvi/react');
const docs = resolve(dirname(fileURLToPath(import.meta.url)), '../src');
const modules = new Map();
const chartCalls = [];
const observedUi = {
  ...ui,
  Chart(props) {
    chartCalls.push(props);
    return React.createElement(ui.Chart, props);
  },
};
function load(name) {
  const filename = [name, `${name}.ts`, `${name}.tsx`].find(existsSync);
  assert.ok(filename, name);
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} };
  modules.set(filename, module);
  const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  new Function('require', 'module', 'exports', compiled)(
    (id) =>
      id === '@zuvi/react'
        ? observedUi
        : id.endsWith('.css')
          ? {}
          : id.startsWith('.')
            ? load(resolve(dirname(filename), id))
            : require(id),
    module,
    module.exports
  );
  return module.exports;
}
const ChartPage = load(resolve(docs, 'pages/components/ChartPage')).default;
const nav = load(resolve(docs, 'nav'));
const chartModel = load(resolve(docs, '../../packages/ui/src/components/Chart/chart-model'));
function render() {
  chartCalls.length = 0;
  const markup = renderToStaticMarkup(React.createElement(ChartPage));
  return { markup, charts: [...chartCalls] };
}

test('Chart has exactly one lazy data route and renders the real exported component with the requested title', () => {
  assert.equal(
    typeof ui.Chart,
    'function',
    'build the shared UI package before running Chart docs tests'
  );
  assert.deepEqual(
    nav.navItems.filter((item) => item.path === '/components/chart'),
    [{ title: 'Chart 数据图表', path: '/components/chart', group: 'data' }]
  );
  assert.ok(nav.routeComponents['/components/chart']);
  const { markup } = render();
  assert.match(markup, /<h1[^>]*>Chart 数据图表<\/h1>/);
  assert.ok(markup.includes('class="zuvi-chart"'), 'the public Chart is rendered, not a stub SVG');
  const source = readFileSync(resolve(docs, 'pages/components/ChartPage.tsx'), 'utf8');
  assert.match(source, /usePageTitle\('Chart 数据图表'\)/);
  assert.match(
    readFileSync(resolve(docs, 'nav.ts'), 'utf8'),
    /lazy\(\(\) => import\('\.\/pages\/components\/ChartPage'\)\)/
  );
});

test('primary trend and compact radial/scatter examples contain valid explicitly synthetic data', () => {
  const { markup, charts } = render();
  assert.equal(charts.length, 3, 'closed signed/state panels must not mount charts');
  assert.deepEqual(
    charts.map((props) => props.type),
    ['line', 'donut', 'scatter']
  );
  for (const props of charts) {
    assert.ok(props['aria-label'], 'each chart has a unique explicit accessible name');
    const normalized = chartModel.normalizeChartData(props);
    assert.equal(normalized.invalid, false, normalized.issues.join('\n'));
    assert.deepEqual(normalized.issues, []);
  }
  const trend = charts[0];
  assert.equal(trend.categories.length, 6);
  assert.equal(trend.series.length, 2);
  assert.deepEqual(
    trend.series.map((series) => series.values),
    [
      [28, 36, 32, 48, 54, 64],
      [20, 28, 38, 34, 46, 52],
    ]
  );
  assert.equal(trend.height, 300);
  assert.equal(trend.value, 'design:5');
  assert.deepEqual(trend.hiddenSeries, []);
  assert.equal(trend.legend, true);
  assert.equal(trend.grid, true);
  assert.equal(trend.tooltip, true);
  assert.equal(trend.showDataTable, true);
  assert.equal(typeof trend.onChange, 'function');
  assert.equal(typeof trend.onHiddenSeriesChange, 'function');
  assert.equal(typeof trend.onDataClick, 'function');
  assert.equal(charts[1].data.length, 4);
  assert.equal(
    charts[1].data.reduce((sum, slice) => sum + slice.value, 0),
    100
  );
  assert.equal(charts[2].series.flatMap((series) => series.points).length, 8);
  assert.ok(markup.includes('合成示例 · 非实时'));
  assert.ok(markup.includes('不用于推断因果'));
  assert.ok(markup.includes('等待 onDataClick 事件'));
  assert.ok(markup.includes('data-chart-event'));
  assert.ok(markup.includes('所选数据详情'));
  assert.ok(markup.includes('设计项目 · 6 月'));
  assert.ok(
    markup.includes('116'),
    'hero total is derived from the two series, not fake telemetry'
  );
});

test('docs publish the exact six-type data API, state semantics, customization and flat builder contract', () => {
  const { markup } = render();
  for (const text of [
    'ChartSeries',
    'ChartSlice',
    'ChartScatterSeries',
    'ChartDatum',
    'ChartLabels',
    'categories / series',
    'onDataClick',
    'hiddenSeries',
    'defaultHiddenSeries',
    'valueFormatter',
    'renderTooltip',
    'onStatusChange',
    'onError',
    'ConfigProvider.locale.chart',
    'rowsJson',
    'seriesJson',
    'valueKey',
    'seriesId',
    'DataChart',
    'npm / ESM',
    'CDN / IIFE',
    '离线 HTML',
    '模块本身加载失败',
    'Tab',
    'Enter / Space',
    'encodeURIComponent',
  ])
    assert.ok(markup.includes(text), text);
  for (const part of [
    'root',
    'header',
    'title',
    'description',
    'plot',
    'svg',
    'legend',
    'legend-item',
    'datum',
    'mark',
    'tooltip',
    'data-table',
    'loading',
    'empty',
    'error',
  ])
    assert.ok(markup.includes(`data-part=&quot;${part}&quot;`), part);
  for (const suffix of [
    'bg',
    'border-radius',
    'grid-color',
    'axis-color',
    'text-color',
    ...Array.from({ length: 8 }, (_, index) => `series-${index + 1}`),
    'line-width',
    'point-radius',
  ])
    assert.ok(markup.includes(`--zuvi-chart-${suffix}`), suffix);
});

test('Chart docs styling stays token-driven, container responsive and scoped to the new page', () => {
  const css = readFileSync(resolve(docs, 'pages/components/chart-page.css'), 'utf8');
  assert.ok(css.includes('min-width: 0'));
  assert.ok(css.includes('minmax(0, 1fr)'));
  assert.ok(css.includes('container: chart-doc / inline-size'));
  assert.ok(css.includes('@container chart-doc'));
  assert.ok(css.includes('@media (max-width: 400px)'));
  assert.ok(!/#[\da-f]{3,8}\b/i.test(css), 'demo CSS consumes semantic tokens in both themes');
  assert.ok(
    !/https?:\/\/|@import|:root|data-theme=/.test(css),
    'no external assets or global theme overrides'
  );
  const { charts } = render();
  for (const chart of charts) {
    const colors = chart.type === 'donut' ? chart.data : chart.series;
    for (const entry of colors) assert.ok(entry.color.includes('var(--zuvi-'));
  }
  assert.equal(charts[0].style['--zuvi-chart-bg'], 'transparent');
  assert.equal(charts[0].style['--zuvi-chart-line-width'], '2.5');
  assert.equal(charts[0].style['--zuvi-chart-point-radius'], '4px');
});

test('real docs interactions retype/recolor without changing data, reflect actual events, and mount secondary panels only when open', async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', {
    url: 'http://localhost/',
    pretendToBeVisual: true,
  });
  const previous = new Map();
  for (const [key, value] of Object.entries({
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    Element: dom.window.Element,
    Node: dom.window.Node,
    IS_REACT_ACT_ENVIRONMENT: true,
  })) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const { createRoot } = require('react-dom/client');
  const root = createRoot(dom.window.document.getElementById('root'));
  const latest = (label = '半年项目趋势图') =>
    chartCalls.filter((props) => props['aria-label'] === label).at(-1);
  const button = (name) =>
    [...dom.window.document.querySelectorAll('button')].find((node) => node.textContent === name);
  const flushView = async () => {
    await React.act(async () => {
      await setTimeout(40);
    });
  };
  try {
    await React.act(() => root.render(React.createElement(ChartPage)));
    await flushView();
    assert.equal(dom.window.document.title, 'Chart 数据图表 · ZUVI 文档');
    const original = latest();
    await React.act(() => button('面积').click());
    assert.equal(latest().type, 'area');
    assert.deepEqual(latest().series, original.series);
    assert.deepEqual(latest().categories, original.categories);
    await React.act(() => button('柱状').click());
    assert.equal(latest().type, 'bar');
    await React.act(() => button('柔和').click());
    assert.equal(latest().style['--zuvi-chart-bg'], 'var(--zuvi-color-bg-muted)');
    assert.equal(latest().style['--zuvi-chart-point-radius'], '3px');
    assert.deepEqual(latest().series, original.series);
    await React.act(() => button('强调').click());
    assert.equal(latest().style['--zuvi-chart-line-width'], '4');
    await React.act(() => latest().onHiddenSeriesChange(['design']));
    assert.equal(latest().value, 'design:5');
    assert.deepEqual(latest().hiddenSeries, ['design']);
    assert.ok(
      dom.window.document
        .querySelector('[aria-label="所选数据详情"]')
        .textContent.includes('所选系列已隐藏')
    );
    const normalized = chartModel.normalizeChartData(latest());
    const datum = chartModel.getChartDatums(normalized).find((item) => item.id === 'development:2');
    await React.act(() => {
      latest().onDataClick(datum);
      latest().onChange(datum.id);
    });
    const event = JSON.parse(dom.window.document.querySelector('[data-chart-event]').textContent);
    assert.deepEqual(event, {
      id: 'development:2',
      type: 'bar',
      seriesId: 'development',
      label: '3 月',
      value: 38,
    });
    assert.ok(
      dom.window.document
        .querySelector('[aria-label="所选数据详情"]')
        .textContent.includes('研发项目 · 3 月')
    );
    await React.act(() => button('饼图').click());
    assert.equal(latest('项目组成图').type, 'pie');
    assert.equal(latest('投入与结果散点图').type, 'scatter');
    assert.equal(latest('正负值与数据缺口图'), undefined);
    await React.act(async () => {
      button('正负值与数据缺口').click();
      await setTimeout(0);
    });
    await flushView();
    assert.deepEqual(latest('正负值与数据缺口图').series[0].values, [12, -8, null, 0, 16]);
    await React.act(() => button('正负值与数据缺口').click());
    assert.equal(dom.window.document.querySelector('[aria-label="正负值与数据缺口图"]'), null);
    await React.act(async () => {
      button('加载、空数据与错误').click();
      await setTimeout(0);
    });
    await flushView();
    assert.equal(latest('应用数据状态图').loading, true);
    await React.act(() => button('错误').click());
    assert.equal(latest('应用数据状态图').loading, false);
    assert.match(latest('应用数据状态图').error, /示例数据请求失败/);
    await React.act(() => button('重试示例').click());
    assert.equal(latest('应用数据状态图').error, undefined);
    await React.act(() => button('空数据').click());
    assert.deepEqual(latest('应用数据状态图').categories, []);
    assert.deepEqual(latest('应用数据状态图').series, []);
    await React.act(() => button('加载、空数据与错误').click());
    assert.equal(dom.window.document.querySelector('[aria-label="应用数据状态图"]'), null);
  } finally {
    await React.act(() => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});
