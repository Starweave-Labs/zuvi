import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ui = require('@zuvi/react');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../src/pages/builder');
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
const catalog = load(resolve(root, 'builder-catalog-data'));
const model = load(resolve(root, 'builder-model'));
const scenes = load(resolve(root, 'builder-data-sources'));
const chartModel = load(resolve(root, '../../../../packages/ui/src/components/Chart/chart-model'));
const { CatalogRender, catalogComponents } = load(resolve(root, 'builder-catalog'));
const chartTypes = [
  'line', 'area', 'bar', 'pie', 'donut', 'scatter', 'radar',
  'heatmap', 'treemap', 'funnel', 'gauge', 'waterfall', 'sparkline',
];
const chartForms = [
  ...chartTypes.map((type) => ({ type })),
  { type: 'area', stack: true },
  { type: 'bar', stack: true },
  { type: 'bar', orientation: 'horizontal' },
  { type: 'scatter', bubble: true },
];
const formData = (type) =>
  type === 'heatmap'
    ? { rowsJson: [{ id: 'cell / 1', row: 'A', col: '一月', value: -2 }], seriesJson: [] }
    : type === 'waterfall'
      ? { rowsJson: [{ id: 'step / 1', label: '增量', value: -2 }], seriesJson: [] }
      : ['pie', 'donut', 'treemap', 'funnel', 'gauge'].includes(type)
        ? { rowsJson: [{ id: 'a', label: 'A', value: 2 }], seriesJson: [] }
        : type === 'scatter'
          ? {
              rowsJson: [{ id: 'p', seriesId: 'a', x: 0, y: -1, value: 4 }],
              seriesJson: [{ id: 'a', name: 'A' }],
            }
          : {};
const defaults = () => JSON.parse(JSON.stringify(catalogComponents.Chart.defaultProps));
const document = (props = {}) => ({
  root: { props: { title: '图表示例', theme: 'light' } },
  content: [{ type: 'Chart', props: { ...defaults(), ...props, id: 'chart-example' } }],
});
const render = (props = {}, editing = false) => {
  chartCalls.length = 0;
  const markup = renderToStaticMarkup(
    React.createElement(CatalogRender, {
      type: 'Chart',
      p: { ...defaults(), ...props, id: 'chart-example' },
      editing,
    })
  );
  assert.equal(chartCalls.length, 1);
  return { markup, props: chartCalls[0] };
};
const assertNormalized = (props) => {
  const normalized = chartModel.normalizeChartData(props);
  assert.equal(normalized.invalid, false, normalized.issues.join('\n'));
  assert.deepEqual(normalized.issues, []);
};

test('Chart is a separate serializable catalog entry, with default six-month data and no DataChart replacement', () => {
  const definition = catalog.catalogDefinitions.Chart;
  assert.equal(definition.label, 'Chart 数据图表');
  assert.equal(definition.group, 'content');
  assert.deepEqual(definition.fields.type.options, chartTypes);
  assert.equal(chartForms.length, 17);
  assert.equal(definition.fields.rowsJson.kind, 'rows');
  assert.equal(definition.fields.seriesJson.kind, 'rows');
  assert.equal(definition.fields.rows, undefined);
  assert.equal(definition.fields.series, undefined);
  assert.equal(model.componentProps.Chart.rowsJson, 'json:rows');
  assert.equal(model.componentProps.Chart.seriesJson, 'json:rows');
  assert.ok(model.componentProps.DataChart, 'original scene schema still exists');
  assert.ok(scenes.scenePropSchemas.DataChart, 'original data-linked chart remains registered');
  assert.equal(defaults().height, 300);
  for (const key of ['legend', 'grid', 'tooltip', 'showDataTable'])
    assert.equal(defaults()[key], true, key);
  for (const key of ['loading', 'disabled', 'stack', 'bubble', 'zoom', 'brush', 'animated', 'csv'])
    assert.equal(defaults()[key], false, key);
  assert.equal(defaults().orientation, 'vertical');
  assert.equal(defaults().tooltipMode, 'datum');
  assert.equal(defaults().min, 0);
  assert.equal(defaults().max, 100);
  assert.deepEqual(definition.fields.orientation.options, ['vertical', 'horizontal']);
  assert.deepEqual(definition.fields.tooltipMode.options, ['datum', 'crosshair']);
  assert.equal(definition.fields.min.min, undefined, 'negative gauge bounds remain valid');
  assert.equal(defaults().defaultValue, '');
  const data = document();
  assert.deepEqual(model.validateBuilderData(data), data);
  assert.deepEqual(
    model.parseBuilderImport(JSON.stringify(data)).pages[0].data.content,
    data.content
  );
  const { props, issues } = catalog.resolveCatalogChartData(
    'line',
    defaults().rowsJson,
    defaults().seriesJson
  );
  assert.deepEqual(issues, []);
  assert.equal(props.categories.length, 6);
  assert.equal(props.series.length, 2);
  assertNormalized(props);
});

test('wide rows map only allowlisted fields to aligned cartesian props, preserving signed, zero and null values', () => {
  const rows = [
    { category: ' 一月 ', revenue: 0, net: -4, ignored: { unsafe: true } },
    { category: '二月', revenue: null, net: 12 },
    { category: '二月', revenue: 8, net: 0 },
  ];
  const series = [
    {
      id: ' revenue ',
      name: ' 收入 ',
      valueKey: 'revenue',
      color: 'var(--zuvi-color-primary)',
      values: ['never forwarded'],
    },
    { id: 'net', name: '净变化', valueKey: 'net', color: '#abcdef', extra: { nested: 'ignored' } },
  ];
  for (const type of ['line', 'area', 'bar', 'sparkline']) {
    const result = catalog.resolveCatalogChartData(type, rows, series);
    assert.deepEqual(result.issues, []);
    assert.deepEqual(result.props, {
      type,
      categories: ['一月', '二月', '二月'],
      series: [
        { id: 'revenue', name: '收入', color: 'var(--zuvi-color-primary)', values: [0, null, 8] },
        { id: 'net', name: '净变化', color: '#abcdef', values: [-4, 12, 0] },
      ],
    });
    assertNormalized(result.props);
    assert.notEqual(result.props.series[0], series[0]);
    assert.notEqual(result.props.categories, rows);
    assert.equal(result.props.data, undefined);
  }
  assert.deepEqual(catalog.resolveCatalogChartData(undefined, [], []).props, {
    type: 'line',
    categories: [],
    series: [],
  });
});

test('cartesian resolver never coerces numbers or invents zeros and skips invalid series/rows without misaligning columns', () => {
  const result = catalog.resolveCatalogChartData(
    'line',
    [
      null,
      ['not a row'],
      { category: 123, value: 1 },
      { category: 'A', value: '12' },
      { category: 'B', value: Infinity },
      { category: 'C', value: NaN },
      { category: 'D' },
      { category: 'E', value: false },
      { category: 'F', value: null },
      { category: 'G', value: -2 },
    ],
    [
      { id: 'valid', name: '系列', valueKey: 'value' },
      { id: ' valid ', name: '重复', valueKey: 'value' },
      { id: 'no-key', name: '缺列' },
      { id: 'unsafe', name: '不安全', valueKey: '__proto__' },
      { id: '\ud800', name: '错误字符', valueKey: 'value' },
      { id: 'empty-name', name: ' ', valueKey: 'value' },
    ]
  );
  assert.deepEqual(result.props.categories, ['A', 'B', 'C', 'D', 'E', 'F', 'G']);
  assert.deepEqual(result.props.series, [
    { id: 'valid', name: '系列', values: [null, null, null, null, null, null, -2] },
  ]);
  assert.ok(result.issues.some((message) => message.includes('系列第 2 行')));
  assert.ok(result.issues.some((message) => message.includes('按缺口显示')));
  assertNormalized(result.props);
  for (const invalidType of ['stacked', null, 1, {}, ['line']]) {
    const invalid = catalog.resolveCatalogChartData(
      invalidType,
      [{ category: 'A', value: 10 }],
      [{ id: 'x', name: 'X', valueKey: 'value' }]
    );
    assert.deepEqual(invalid.props, { type: 'line', categories: [], series: [] });
    assert.match(invalid.issues[0], /图表类型无效/);
  }
});

test('pie, donut, treemap and funnel retain nonnegative slices and zero without forwarding unrelated fields', () => {
  for (const type of ['pie', 'donut', 'treemap', 'funnel']) {
    const result = catalog.resolveCatalogChartData(
      type,
      [
        {
          id: ' design ',
          label: ' 产品设计 ',
          value: 42,
          color: 'var(--zuvi-color-primary)',
          ignored: { nested: true },
        },
        { id: 'zero', label: '零值', value: 0 },
        { id: 'design', label: '重复', value: 1 },
        { id: 'negative', label: '负值', value: -1 },
        { id: 'numeric-string', label: '文字数值', value: '18' },
        { id: 'infinite', label: '非有限', value: Infinity },
        { id: 'no-label', value: 12 },
        { id: 'bad-color', label: '安全降级', value: 8, color: 'url(https://external.test/asset)' },
      ],
      { unrelated: 'ignored for radial' }
    );
    assert.deepEqual(result.props, {
      type,
      data: [
        { id: 'design', label: '产品设计', value: 42, color: 'var(--zuvi-color-primary)' },
        { id: 'zero', label: '零值', value: 0 },
        { id: 'bad-color', label: '安全降级', value: 8 },
      ],
    });
    assert.equal(result.props.categories, undefined);
    assert.equal(result.props.series, undefined);
    assertNormalized(result.props);
    assert.ok(result.issues.some((message) => message.includes('非负有限数值')));
    assert.ok(result.issues.some((message) => message.includes('颜色无效')));
  }
});

test('scatter groups flat points by explicit seriesId, validates series-local IDs, and preserves zero and negative coordinates', () => {
  const result = catalog.resolveCatalogChartData(
    'scatter',
    [
      {
        id: ' p ',
        seriesId: ' a ',
        x: 0,
        y: -2,
        label: '零点',
        color: '#bad',
        ignored: { nested: true },
      },
      { id: 'p', seriesId: 'b', x: -3, y: 0 },
      { id: 'p', seriesId: 'a', x: 12, y: 24 },
      { id: 'missing-series', seriesId: 'gone', x: 1, y: 2 },
      { id: 'string-x', seriesId: 'a', x: '4', y: 2 },
      { id: 'infinite', seriesId: 'a', x: 4, y: Infinity },
      { id: 'bad-label', seriesId: 'a', x: 4, y: 6, label: { nested: true } },
    ],
    [
      { id: 'a', name: 'A', color: 'var(--zuvi-color-info)', valueKey: 'not forwarded' },
      { id: 'b', name: 'B' },
      { id: 'a', name: 'Duplicate' },
      { id: 'bad-name', name: null },
    ]
  );
  assert.deepEqual(result.props, {
    type: 'scatter',
    series: [
      {
        id: 'a',
        name: 'A',
        color: 'var(--zuvi-color-info)',
        points: [
          { id: 'p', x: 0, y: -2, label: '零点' },
          { id: 'bad-label', x: 4, y: 6 },
        ],
      },
      { id: 'b', name: 'B', points: [{ id: 'p', x: -3, y: 0 }] },
    ],
  });
  assert.equal(result.props.categories, undefined);
  assert.equal(result.props.data, undefined);
  assert.ok(result.issues.some((message) => message.includes('散点第 3 行')));
  assertNormalized(result.props);
  const datums = chartModel.getChartDatums(chartModel.normalizeChartData(result.props));
  assert.deepEqual(
    datums.map((datum) => datum.id),
    ['a:p', 'a:bad-label', 'b:p']
  );
});

test('heatmap maps signed scalar cells with unique coordinates and sanitized colors', () => {
  const result = catalog.resolveCatalogChartData('heatmap', [
    { id: ' a ', row: ' R ', col: ' C ', value: -4, color: '#abcdef', ignored: {} },
    { id: 'b', row: 'R', col: 'D', value: 0 },
    { id: 'c', row: 'S', col: 'C', value: 8 },
    { id: 'duplicate-coordinate', row: ' R ', col: 'C', value: 12 },
    { id: 'a', row: 'T', col: 'C', value: 12 },
    { id: 'string', row: 'T', col: 'C', value: '12' },
    { id: 'infinite', row: 'T', col: 'C', value: Infinity },
    { id: 'missing', row: 'T', value: 2 },
    { id: 'color', row: 'T', col: 'C', value: -1, color: 'url(x)' },
  ], { ignored: 'data family needs no series' });
  assert.deepEqual(result.props, {
    type: 'heatmap',
    data: [
      { id: 'a', row: 'R', col: 'C', value: -4, color: '#abcdef' },
      { id: 'b', row: 'R', col: 'D', value: 0 },
      { id: 'c', row: 'S', col: 'C', value: 8 },
      { id: 'color', row: 'T', col: 'C', value: -1 },
    ],
  });
  assert.ok(result.issues.some((message) => message.includes('不重复')));
  assert.ok(result.issues.some((message) => message.includes('颜色无效')));
  assertNormalized(result.props);
});

test('waterfall preserves signed increments while gauge requires one finite in-range value and valid bounds', () => {
  const waterfall = catalog.resolveCatalogChartData('waterfall', [
    { id: 'start', label: '开始', value: 20 },
    { id: 'cost', label: '成本', value: -6 },
    { id: 'zero', label: '零', value: 0 },
    { id: 'string', label: '无效', value: '3' },
  ], []);
  assert.deepEqual(waterfall.props.data.map((step) => step.value), [20, -6, 0]);
  assert.equal(waterfall.props.series, undefined);
  assertNormalized(waterfall.props);
  for (const value of [-4, 0, 8]) {
    const gauge = catalog.resolveCatalogChartData('gauge', [{ id: 'g', label: '温度', value }], [], { min: -4, max: 8 });
    assert.deepEqual(gauge.issues, []);
    assert.deepEqual(gauge.props, { type: 'gauge', data: [{ id: 'g', label: '温度', value }], min: -4, max: 8 });
    assertNormalized(gauge.props);
  }
  const defaultGauge = catalog.resolveCatalogChartData('gauge', [{ id: 'g', label: 'G', value: 140 }], []);
  assert.equal(defaultGauge.props.min, 0);
  assert.equal(defaultGauge.props.max, 140);
  const one = [{ id: 'g', label: 'G', value: 2 }];
  for (const options of [{ min: 4, max: 4 }, { min: 8, max: 4 }, { min: '0', max: 4 }, { min: NaN, max: 4 }, { min: 0, max: Infinity }, { min: 3, max: 4 }, { min: -4, max: 1 }]) {
    const result = catalog.resolveCatalogChartData('gauge', one, [], options);
    assert.deepEqual(result.props.data, []);
    assert.ok(result.issues.length > 0);
  }
  for (const rows of [[], [...one, { id: 'other', label: 'Other', value: 1 }], [...one, { id: 'bad', label: 'Bad', value: '1' }], [{ id: 'g', label: 'G', value: null }]]) {
    const result = catalog.resolveCatalogChartData('gauge', rows, [], { min: 0, max: 4 });
    assert.deepEqual(result.props.data, []);
    assert.ok(result.issues.length > 0);
  }
});

test('radar retains aligned finite nonnegative axes, drops invalid rows rather than inventing values and requires three axes', () => {
  const series = [{ id: 'a', name: 'A', valueKey: 'a' }, { id: 'b', name: 'B', valueKey: 'b' }];
  const result = catalog.resolveCatalogChartData('radar', [
    { category: 'A', a: 0, b: 4 },
    { category: 'bad-null', a: null, b: 1 },
    { category: 'bad-negative', a: -1, b: 1 },
    { category: 'bad-string', a: '1', b: 1 },
    { category: 'bad-infinite', a: Infinity, b: 1 },
    { category: 'B', a: 8, b: 0 },
    { category: 'C', a: 2, b: 3 },
  ], series);
  assert.deepEqual(result.props.categories, ['A', 'B', 'C']);
  assert.deepEqual(result.props.series.map((item) => item.values), [[0, 8, 2], [4, 0, 3]]);
  assert.ok(result.issues.some((message) => message.includes('不接受 null')));
  assertNormalized(result.props);
  const short = catalog.resolveCatalogChartData('radar', [{ category: 'A', a: 1, b: 1 }], series);
  assert.ok(short.issues.some((message) => message.includes('至少三个')));
  assert.equal(chartModel.normalizeChartData(short.props).invalid, true);
});

test('scatter bubble value is optional but must be nonnegative and finite when provided', () => {
  const result = catalog.resolveCatalogChartData('scatter', [
    { id: 'plain', seriesId: 'a', x: -2, y: 0 },
    { id: 'zero', seriesId: 'a', x: 0, y: -1, value: 0 },
    { id: 'bubble', seriesId: 'a', x: 2, y: 4, value: 8 },
    ...[-1, null, '8', Infinity, NaN, {}].map((value, index) => ({ id: `bad-${index}`, seriesId: 'a', x: 1, y: 2, value })),
  ], [{ id: 'a', name: 'A' }]);
  assert.deepEqual(result.props.series[0].points, [
    { id: 'plain', x: -2, y: 0 },
    { id: 'zero', x: 0, y: -1, value: 0 },
    { id: 'bubble', x: 2, y: 4, value: 8 },
  ]);
  assert.equal(result.issues.length, 6);
  assertNormalized(result.props);
});

test('resolver bounds diagnostics and processing, rejects inherited required fields and never invokes accessors', () => {
  const bounded = catalog.resolveCatalogChartData(
    'pie',
    Array.from({ length: 2001 }, () => ({})),
    []
  );
  assert.deepEqual(bounded.props.data, []);
  assert.ok(bounded.issues.length <= 13);
  assert.match(bounded.issues[0], /超过 2000 行/);
  assert.match(bounded.issues.at(-1), /同类数据问题/);
  const badRows = catalog.resolveCatalogChartData('scatter', 'unchecked JSON', 'unchecked JSON');
  assert.deepEqual(badRows.props.series, []);
  assert.equal(badRows.issues.length, 2);
  const getter = { id: 'safe', label: 'Getter' };
  Object.defineProperty(getter, 'value', {
    enumerable: true,
    get: () => {
      throw new Error('must not invoke');
    },
  });
  assert.deepEqual(
    catalog.resolveCatalogChartData(
      'pie',
      [getter, Object.create({ id: 'inherited', label: 'Inherited', value: 8 })],
      []
    ).props.data,
    []
  );
  const rows = Object.freeze([Object.freeze({ category: 'A', value: 1 })]);
  const series = Object.freeze([Object.freeze({ id: 'a', name: 'A', valueKey: 'value' })]);
  assertNormalized(catalog.resolveCatalogChartData('line', rows, series).props);
});

test('Chart color sanitization refuses escaped/comment-obfuscated URLs without mutating safe token colors', () => {
  for (const color of [
    'u\\72l(https://external.test/)',
    'u/**/rl(https://external.test/)',
    'red; background: url(x)',
    '</style><script>alert(1)</script>',
    'image-set(url(x) 1x)',
    'red\n',
  ]) {
    const result = catalog.resolveCatalogChartData(
      'pie',
      [{ id: 'a', label: 'A', value: 1, color }],
      []
    );
    assert.deepEqual(result.props.data, [{ id: 'a', label: 'A', value: 1 }]);
    assert.match(result.issues[0], /颜色无效/);
  }
  const result = catalog.resolveCatalogChartData(
    'pie',
    [
      {
        id: 'a',
        label: 'A',
        value: 1,
        color: 'color-mix(in srgb, var(--zuvi-color-primary) 60%, var(--zuvi-color-info))',
      },
    ],
    []
  );
  assert.deepEqual(result.issues, []);
  assert.match(result.props.data[0].color, /^color-mix/);
});

test('Chart JSON validation roundtrips each type and rejects nested models, unsafe fields and serialized callbacks', () => {
  for (const form of chartForms) {
    const data = document({ ...form, ...formData(form.type), tooltipMode: 'crosshair', zoom: true, brush: true, animated: true, csv: true });
    assert.deepEqual(model.validateBuilderData(data), data);
    assert.deepEqual(
      model.parseBuilderImport(JSON.stringify(data)).pages[0].data.content,
      data.content
    );
  }
  for (const prop of [
    { rowsJson: [{ category: 'A', value: { nested: 1 } }] },
    { seriesJson: [{ id: 'a', name: 'A', values: [1, 2] }] },
    { rowsJson: [{ category: 'A', value: Infinity }] },
    { rowsJson: JSON.parse('[{"category":"A","constructor":"blocked"}]') },
    { onChange: () => {} },
    { onDataClick: 'serialized callback' },
    { labels: { empty: 'nested props are not accepted' } },
    { data: [{ id: 'a', label: 'A', value: 1 }] },
    { orientation: 'diagonal' },
    { tooltipMode: 'shared' },
    { zoom: 'false' },
    { min: Infinity },
    { max: '100' },
    { onViewRangeChange: 'serialized callback' },
  ])
    assert.throws(() => model.validateBuilderData(document(prop)));
  assert.throws(() => model.validateBuilderData(document({ type: 'stacked' })), /不支持的选项/);
  assert.throws(() => model.validateBuilderData(document({ height: 801 })), /height应在/);
  assert.throws(
    () => model.validateBuilderData(document({ loading: 'false' })),
    /loading必须是开关值/
  );
});

test('adapter renders the real public Chart with sanitized discriminated data, serializable labels and bounded presentation', () => {
  assert.equal(
    typeof ui.Chart,
    'function',
    'build the shared UI package before running Chart docs tests'
  );
  const configured = {
    type: 'donut',
    rowsJson: [{ id: 'a', label: 'A', value: 2 }],
    seriesJson: [],
    height: 1000,
    title: '<script>not HTML</script>',
    label: '安全图表',
    legend: false,
    grid: false,
    tooltip: false,
    showDataTable: false,
    loading: true,
    error: '外部数据错误',
    xLabel: 'X',
    yLabel: 'Y',
    defaultValue: 'a',
    defaultHiddenSeries: ' a,missing ',
    dataTableLabel: '查看数据',
    emptyLabel: '暂无记录',
  };
  const output = render(configured);
  assert.equal(output.props.type, 'donut');
  assert.deepEqual(output.props.data, [{ id: 'a', label: 'A', value: 2 }]);
  assert.equal(output.props.categories, undefined);
  assert.equal(output.props.series, undefined);
  assert.equal(output.props.rowsJson, undefined);
  assert.equal(output.props.seriesJson, undefined);
  assert.equal(output.props.height, 800);
  assert.equal(output.props.value, 'a');
  assert.deepEqual(output.props.hiddenSeries, ['a']);
  assert.deepEqual(output.props.labels, { dataTable: '查看数据', empty: '暂无记录' });
  for (const key of ['legend', 'grid', 'tooltip', 'showDataTable'])
    assert.equal(output.props[key], false);
  assert.equal(output.props.loading, true);
  assert.equal(output.props.error, '外部数据错误');
  assert.equal(output.props.disabled, false);
  assert.equal(output.props['aria-label'], '安全图表');
  for (const key of ['onChange', 'onDataClick', 'onHiddenSeriesChange'])
    assert.equal(typeof output.props[key], 'function');
  assert.ok(output.markup.includes('class="zuvi-chart"'));
  assert.ok(output.markup.includes('data-type="donut"'));
  assert.ok(output.markup.includes('&lt;script&gt;not HTML&lt;/script&gt;'));
  assert.ok(!output.markup.includes('<script>not HTML'));
  const editor = render(configured, true);
  assert.equal(editor.props.disabled, true);
  assert.ok(!editor.markup.includes('data-builder-chart-selection'));
});

test('adapter forwards all 17 forms and opt-in interaction controls with canonical selection IDs', () => {
  for (const form of chartForms) {
    const data = formData(form.type);
    const defaultValue = form.type === 'heatmap' ? `heatmap:${encodeURIComponent('cell / 1')}`
      : form.type === 'waterfall' ? `waterfall:${encodeURIComponent('step / 1')}`
        : ['pie', 'donut', 'treemap', 'funnel', 'gauge'].includes(form.type) ? 'a'
          : form.type === 'scatter' ? 'a:p' : 'design:0';
    const hiddenId = form.type === 'heatmap' ? 'cell / 1'
      : form.type === 'waterfall' ? 'step / 1'
        : data.rowsJson ? 'a' : 'design';
    const output = render({ ...form, ...data, defaultValue, defaultHiddenSeries: `${hiddenId},missing`, tooltipMode: 'crosshair', zoom: true, brush: true, animated: true, csv: true });
    assert.equal(output.props.type, form.type);
    assert.equal(output.props.value, defaultValue);
    assert.deepEqual(output.props.hiddenSeries, [hiddenId]);
    assert.equal(output.props.tooltipMode, 'crosshair');
    for (const key of ['zoom', 'brush', 'animated', 'csv']) assert.equal(output.props[key], true, key);
    if (form.type === 'scatter') assert.equal(output.props.bubble, form.bubble ?? false);
    if (form.type === 'area' || form.type === 'bar') assert.equal(output.props.stack, form.stack ?? false);
    assert.equal(output.props.orientation, form.orientation);
    assert.equal(output.props.rowsJson, undefined);
    assert.equal(output.props.seriesJson, undefined);
    assertNormalized(output.props);
  }
  const baseline = render().props;
  assert.equal(baseline.tooltipMode, 'datum');
  for (const key of ['zoom', 'brush', 'animated', 'csv']) assert.equal(baseline[key], false);
  const signedGauge = render({ type: 'gauge', rowsJson: [{ id: 'g', label: 'G', value: -2 }], seriesJson: [], min: -4, max: 0, defaultValue: 'g' });
  assert.equal(signedGauge.props.value, 'g');
  assert.equal(signedGauge.props.min, -4);
  assert.equal(signedGauge.props.max, 0);
  assertNormalized(signedGauge.props);
  const badGauge = render({ type: 'gauge', rowsJson: [{ id: 'g', label: 'G', value: 2 }], min: 3, max: 1 });
  assert.deepEqual(badGauge.props.data, []);
  assert.match(badGauge.markup, /min &lt; max/);
});

test('adapter reports sanitized data issues instead of silently drawing malformed input and missing selection IDs', () => {
  const output = render({
    type: 'bar',
    rowsJson: [
      { category: 'A', value: 0 },
      { category: 'B', value: '4' },
    ],
    seriesJson: [{ id: 'a', name: 'A', valueKey: 'value', color: 'red; background: url(x)' }],
    defaultValue: 'gone',
    height: -1,
    loading: 'true',
    disabled: 'true',
    error: { unsafe: true },
    title: { unsafe: true },
    label: { unsafe: true },
    dataTableLabel: { unsafe: true },
  });
  assert.deepEqual(output.props.series, [{ id: 'a', name: 'A', values: [0, null] }]);
  assert.equal(output.props.value, null);
  assert.equal(output.props.height, 180);
  assert.equal(output.props.loading, false);
  assert.equal(output.props.disabled, false);
  assert.equal(output.props.error, undefined);
  assert.equal(output.props.title, undefined);
  assert.deepEqual(output.props.labels, {});
  assert.ok(output.markup.includes('部分图表数据未绘制'));
  assert.ok(output.markup.includes('按缺口显示'));
  assert.ok(output.markup.includes('当前选择：未选择'));
  assertNormalized(output.props);
});
