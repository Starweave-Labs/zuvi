import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { URL } from 'node:url';
import ts from 'typescript';
import { loadCatalog, resolveRepoRoot } from '../dist/tools/search.js';
import { buildExampleCode, formatAttribute, generateCode } from '../dist/tools/generate.js';
import { handleLine, SERVER_VERSION } from '../dist/index.js';

const catalog = loadCatalog();

/** Read literal props from a valid Globe example without depending on JSX formatting. */
function globeExampleProps(code) {
  const source = ts.createSourceFile(
    'GlobeExample.tsx',
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  assert.deepEqual(source.parseDiagnostics, [], 'Generated Globe JSX must parse');
  const tags = [];
  function visit(node) {
    if (
      (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) &&
      node.tagName.getText(source) === 'Globe'
    ) {
      tags.push(node);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.equal(tags.length, 1, 'Expected exactly one Globe element');
  return Object.fromEntries(
    tags[0].attributes.properties.map((attribute) => {
      assert.ok(ts.isJsxAttribute(attribute), 'Expected a named Globe prop');
      const name = attribute.name.getText(source);
      const initializer = attribute.initializer;
      if (!initializer) return [name, true];
      if (ts.isStringLiteral(initializer)) return [name, initializer.text];
      assert.ok(ts.isJsxExpression(initializer) && initializer.expression);
      return [name, JSON.parse(initializer.expression.getText(source))];
    })
  );
}
// Chart-specific tests execute the actual current generator source; other branches keep
// their existing bundled-dist coverage. No build or substitute runtime is required here.
const chartSource = ts.transpileModule(
  readFileSync(new URL('../src/tools/generate.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }
);
const chartSearch = await import('../dist/tools/search.js');
const chartModule = { exports: {} };
new Function('require', 'module', 'exports', chartSource.outputText)(
  (id) => {
    assert.equal(id, './search.js');
    return chartSearch;
  },
  chartModule,
  chartModule.exports
);
const chartCatalog = loadCatalog(fileURLToPath(new URL('../../../', import.meta.url)));
const generateChartCode = (props = {}) => chartModule.exports.generateCode(chartCatalog, 'Chart', props);
const chartTypes = ['line', 'area', 'bar', 'pie', 'donut', 'scatter', 'radar', 'heatmap', 'treemap', 'funnel', 'gauge', 'waterfall', 'sparkline'];
const chartForms = [
  ...chartTypes.map((type) => ({ type })),
  { type: 'area', stack: true },
  { type: 'bar', stack: true },
  { type: 'bar', orientation: 'horizontal' },
  { type: 'scatter', bubble: true },
];
const chartDataTypes = ['pie', 'donut', 'treemap', 'funnel', 'gauge', 'heatmap', 'waterfall'];

/** Read literal Chart props and reject malformed JSX without evaluating generated code. */
function chartExampleProps(code) {
  const source = ts.createSourceFile(
    'ChartExample.tsx',
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  assert.deepEqual(source.parseDiagnostics, [], 'Generated Chart JSX must parse');
  const tags = [];
  function visit(node) {
    if (
      (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) &&
      node.tagName.getText(source) === 'Chart'
    ) {
      tags.push(node);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.equal(tags.length, 1, 'Expected exactly one Chart element');
  return Object.fromEntries(
    tags[0].attributes.properties.map((attribute) => {
      assert.ok(ts.isJsxAttribute(attribute), 'Expected a named Chart prop');
      const name = attribute.name.getText(source);
      const initializer = attribute.initializer;
      if (!initializer) return [name, true];
      if (ts.isStringLiteral(initializer)) return [name, initializer.text];
      assert.ok(ts.isJsxExpression(initializer) && initializer.expression);
      return [name, JSON.parse(initializer.expression.getText(source))];
    })
  );
}

test('catalog resolves every shipped component from bundled data', () => {
  const registry = JSON.parse(
    readFileSync(new URL('../data/registry/registry.json', import.meta.url), 'utf8')
  );
  assert.equal(
    catalog.size,
    registry.items.filter((item) => item.type === 'registry:component').length
  );
  assert.ok(catalog.has('officeeditor'));
  assert.ok(catalog.has('officestudio'));
  assert.ok(catalog.has('globe'));
  assert.ok(catalog.has('chart'));
  assert.equal(resolveRepoRoot(), fileURLToPath(new URL('../data', import.meta.url)));
});
test('server reports the published package version', () => {
  assert.equal(SERVER_VERSION, '1.0.0');
  const initialized = JSON.parse(
    handleLine(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize' }))
  );
  assert.equal(initialized.result.serverInfo.version, SERVER_VERSION);
});
test('explicit false survives JSX generation', () => {
  assert.equal(formatAttribute('preview', false), ' preview={false}');
  assert.equal(formatAttribute('size', 0), ' size={0}');
});
test('all components have generated examples with real imports and required props', () => {
  for (const entry of catalog.values()) {
    const result = generateCode(catalog, entry.name);
    assert.equal(result.ok, true);
    assert.match(result.code, /import/);
    const compiled = ts.transpileModule(result.code, {
      fileName: `${entry.name}Example.tsx`,
      compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
      reportDiagnostics: true,
    });
    assert.deepEqual(
      compiled.diagnostics?.filter(
        (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error
      ),
      [],
      `${entry.name} generated example must compile as TSX`
    );
  }
  assert.match(generateCode(catalog, 'Select').code, /options=/);
  assert.match(generateCode(catalog, 'Combobox').code, /options=/);
  assert.match(generateCode(catalog, 'VirtualTable').code, /height=/);
  assert.match(generateCode(catalog, 'Progress').code, /aria-label="Task progress"/);
  assert.match(generateCode(catalog, 'Message').code, /useMessage/);
  assert.doesNotMatch(generateCode(catalog, 'Notification').code, /import \{ Notification \}/);
});
test('Office examples accept backend configuration and expose standalone document creation', () => {
  const editor = generateCode(catalog, 'OfficeEditor');
  assert.equal(editor.ok, true);
  assert.match(editor.code, /type OfficeEditorConfig/);
  assert.match(editor.code, /documentServerUrl=\{documentServerUrl\}/);
  assert.match(editor.code, /config=\{config\}/);
  assert.match(editor.code, /documentServerUrl: string; config: OfficeEditorConfig/);
  assert.doesNotMatch(editor.code, /https?:\/\//);
  const studio = generateCode(catalog, 'OfficeStudio');
  assert.equal(studio.ok, true);
  assert.match(studio.code, /createOfficeStudioDocument\('word'\)/);
  assert.match(studio.code, /onSave, onImport and onExport/);
  assert.doesNotMatch(studio.code, /documentServerUrl/);
});
test('Globe example uses numeric categorized points, a named arc and opt-in exploration props', () => {
  const result = generateCode(catalog, 'Globe');
  assert.equal(result.ok, true);
  assert.match(result.code, /import \{ Globe \} from '@zuvi\/react'/);
  assert.match(result.code, /Synthetic sample locations/);
  assert.match(result.code, /Keep point values numeric for valueScale/);
  assert.match(result.code, /value selects a point without moving the camera/);
  const props = globeExampleProps(result.code);
  assert.equal(props['aria-label'], 'Sample locations');
  assert.deepEqual(props.points, [
    {
      id: 'sample-a',
      name: 'Sample A',
      latitude: 35,
      longitude: 105,
      category: 'sample-hub',
      value: 120,
    },
    {
      id: 'sample-b',
      name: 'Sample B',
      latitude: -15,
      longitude: -40,
      category: 'sample-region',
      value: 45,
    },
  ]);
  assert.deepEqual(props.categories, [
    { id: 'sample-hub', name: 'Sample hub', color: '#6366f1' },
    { id: 'sample-region', name: 'Sample region', color: '#06b6d4' },
  ]);
  assert.deepEqual(props.arcs, [
    {
      id: 'sample-arc',
      from: 'sample-a',
      to: 'sample-b',
      name: 'Sample connection',
      value: 30,
    },
  ]);
  for (const point of props.points) {
    assert.ok(Number.isFinite(point.latitude) && Math.abs(point.latitude) <= 90);
    assert.ok(Number.isFinite(point.longitude) && Math.abs(point.longitude) <= 180);
    assert.ok(Number.isFinite(point.value));
    assert.ok(props.categories.some((category) => category.id === point.category));
  }
  assert.equal(props.arcs[0].from, props.points[0].id);
  assert.equal(props.arcs[0].to, props.points[1].id);
  assert.equal(props.pointLabels, 'auto');
  assert.equal(props.searchable, true);
  assert.deepEqual(props.valueScale, { domain: [0, 120], range: [0.012, 0.036] });
  assert.equal(props.transitionDuration, 700);
  assert.equal(props.showArcList, true);
  assert.deepEqual(globeExampleProps(buildExampleCode(catalog.get('globe'))), props);
});
test('Globe example honors caller data, false flags, zero duration and independent selections', () => {
  const overrides = {
    'aria-label': 'Custom globe',
    autoRotate: false,
    points: [
      { id: 'custom-a', name: 'Custom A', latitude: 0, longitude: 0, value: 0, category: 'custom' },
      {
        id: 'custom-b',
        name: 'Custom B',
        latitude: 10,
        longitude: 20,
        value: 10,
        category: 'custom',
      },
    ],
    arcs: [{ id: 'custom-arc', from: 'custom-a', to: 'custom-b', name: 'Custom route', value: 0 }],
    categories: [{ id: 'custom', name: 'Custom category' }],
    legend: false,
    hiddenCategories: ['custom'],
    pointLabels: 'selected',
    maxLabels: 4,
    searchable: false,
    searchValue: 'Custom',
    valueScale: false,
    focus: { pointId: 'custom-b', key: 'refocus', zoom: 1.25 },
    transitionDuration: 0,
    showArcList: false,
    value: 'custom-a',
    arcValue: 'custom-arc',
  };
  const result = generateCode(catalog, 'Globe', overrides);
  assert.equal(result.ok, true);
  assert.deepEqual(globeExampleProps(result.code), overrides);
  const empty = generateCode(catalog, 'Globe', { points: [], arcs: [], categories: [] });
  assert.equal(empty.ok, true);
  const emptyProps = globeExampleProps(empty.code);
  assert.deepEqual(emptyProps.points, []);
  assert.deepEqual(emptyProps.arcs, []);
  assert.deepEqual(emptyProps.categories, []);
  const callbacks = generateCode(catalog, 'Globe', {
    onSearchValueChange: '{setSearchValue}',
    onHiddenCategoriesChange: '{setHiddenCategories}',
    onArcChange: '{setArcValue}',
    onArcClick: '{handleArcClick}',
    renderArcDetails: '{renderArcDetails}',
  });
  assert.equal(callbacks.ok, true);
  assert.match(callbacks.code, /onSearchValueChange=\{setSearchValue\}/);
  assert.match(callbacks.code, /onHiddenCategoriesChange=\{setHiddenCategories\}/);
  assert.match(callbacks.code, /onArcChange=\{setArcValue\}/);
  assert.match(callbacks.code, /onArcClick=\{handleArcClick\}/);
  assert.match(callbacks.code, /renderArcDetails=\{renderArcDetails\}/);
});
test('Chart source metadata exposes 13 discriminants, 17 forms and separate opt-in defaults', () => {
  const entry = chartCatalog.get('chart');
  assert.equal(entry.sources.meta, true);
  assert.deepEqual(entry.props.type.enum, chartTypes);
  assert.equal(chartForms.length, 17);
  assert.equal(entry.props.type.default, "'line'");
  assert.equal(entry.props.height.default, '300');
  for (const name of ['legend', 'grid', 'tooltip', 'showDataTable']) {
    assert.equal(entry.props[name].type, 'boolean');
    assert.equal(entry.props[name].default, 'true');
  }
  for (const name of ['loading', 'disabled', 'stack', 'bubble', 'animated', 'zoom', 'brush', 'csv'])
    assert.equal(entry.props[name].default, 'false');
  for (const name of ['categories', 'series', 'data', 'bubbleDomain', 'viewRange', 'defaultViewRange', 'onViewRangeChange', 'min', 'max']) assert.ok(entry.props[name]);
  assert.equal(entry.props.tooltipMode.default, "'datum'");
  assert.deepEqual(entry.props.orientation.enum, ['horizontal']);
  assert.match(entry.props.categories.type, /string\[\]/);
  assert.match(entry.props.series.type, /ChartSeries\[\].*ChartScatterSeries\[\]/);
  assert.equal(entry.props.data.type, 'readonly ChartSlice[] | readonly ChartHeatmapCell[] | readonly ChartWaterfallStep[]');
  assert.match(entry.props.labels.desc, /21/);
});

test('Chart source generator produces valid named examples for all 17 forms without mixed data families', () => {
  const defaultResult = generateChartCode();
  assert.equal(defaultResult.ok, true);
  assert.match(defaultResult.code, /import \{ Chart \} from '@zuvi\/react'/);
  assert.match(defaultResult.code, /Synthetic sample data; not live metrics/);
  const defaults = chartExampleProps(defaultResult.code);
  assert.equal(defaults.type, 'line');
  assert.equal(defaults.title, 'Synthetic sample chart');
  assert.equal(defaults['aria-label'], 'Synthetic sample chart');
  assert.deepEqual(defaults.categories, ['Jan', 'Feb', 'Mar']);
  assert.equal(defaults.series.length, 2);
  assert.deepEqual(chartExampleProps(chartModule.exports.buildExampleCode(chartCatalog.get('chart'))), defaults);
  for (const form of chartForms) {
    const { type } = form;
    const result = generateChartCode(form);
    assert.equal(result.ok, true);
    assert.deepEqual(result.warnings, []);
    const props = chartExampleProps(result.code);
    assert.equal(props.type, type);
    for (const [key, value] of Object.entries(form)) assert.deepEqual(props[key], value);
    if (chartDataTypes.includes(type)) {
      assert.equal('categories' in props, false);
      assert.equal('series' in props, false);
      assert.ok(props.data.every((item) => Number.isFinite(item.value)));
      if (type === 'heatmap') {
        assert.ok(props.data.every((cell) => typeof cell.row === 'string' && typeof cell.col === 'string'));
        assert.equal(new Set(props.data.map((cell) => JSON.stringify([cell.row, cell.col]))).size, props.data.length);
        assert.ok(props.data.some((cell) => cell.value < 0));
      } else if (type === 'waterfall') {
        assert.ok(props.data.some((step) => step.value < 0));
      } else {
        assert.equal(props.data.length, type === 'gauge' ? 1 : 2);
        assert.ok(props.data.every((slice) => slice.value >= 0));
      }
    } else if (type === 'scatter') {
      assert.equal('categories' in props, false);
      assert.equal('data' in props, false);
      assert.equal(props.series.length, 2);
      for (const series of props.series) {
        assert.equal('values' in series, false);
        assert.ok(
          series.points.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
        );
      }
      assert.ok(props.series[0].points.some((point) => !Number.isInteger(point.x)));
      if (form.bubble) assert.ok(props.series.every((series) => series.points.every((point) => Number.isFinite(point.value) && point.value >= 0)));
    } else {
      assert.equal('data' in props, false);
      if (type === 'radar') assert.ok(props.categories.length >= 3);
      for (const series of props.series) {
        assert.equal(series.values.length, props.categories.length);
        assert.ok(series.values.every((value) => Number.isFinite(value)));
        assert.equal('points' in series, false);
      }
    }
    const compiled = ts.transpileModule(result.code, {
      fileName: `Chart-${type}.tsx`,
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
      reportDiagnostics: true,
    });
    assert.deepEqual(compiled.diagnostics, [], `Chart ${type} must compile as TSX`);
  }
});

test('Chart source generation preserves caller data, explicit false flags and null selection/ranges', () => {
  const shared = {
    title: 'Custom chart',
    'aria-label': 'Custom chart',
    height: 180,
    legend: false,
    grid: false,
    tooltip: false,
    showDataTable: false,
    loading: false,
    disabled: false,
    error: null,
    emptyContent: null,
    animated: false,
    zoom: false,
    brush: false,
    csv: false,
    tooltipMode: 'datum',
    hiddenSeries: ['custom'],
    value: null,
    defaultValue: null,
    viewRange: null,
    defaultViewRange: null,
  };
  for (const type of chartTypes) {
    const data = type === 'heatmap'
      ? { data: [{ id: 'custom', row: 'A', col: 'B', value: -2 }] }
      : type === 'gauge'
        ? { data: [{ id: 'custom', label: 'G', value: -2 }], min: -4, max: 0 }
        : type === 'waterfall'
          ? { data: [{ id: 'custom', label: 'Delta', value: -2 }] }
          : chartDataTypes.includes(type)
            ? { data: [{ id: 'custom', label: 'Custom slice', value: 0 }] }
            : type === 'scatter'
              ? { bubble: false, bubbleDomain: [0, 8], series: [{ id: 'custom', name: 'Custom series', points: [{ id: 'p', x: -1.5, y: 0, value: 0 }] }] }
              : type === 'radar'
                ? { categories: ['A', 'B', 'C'], series: [{ id: 'custom', name: 'Custom series', values: [0, 2, 3] }] }
                : { ...(type === 'area' || type === 'bar' ? { stack: false } : {}), categories: ['A', 'B'], series: [{ id: 'custom', name: 'Custom series', values: [0, null] }] };
    const overrides = { ...shared, type, ...data };
    const result = generateChartCode(overrides);
    assert.equal(result.ok, true);
    assert.deepEqual(result.warnings, []);
    assert.deepEqual(chartExampleProps(result.code), overrides);
    const empty = generateChartCode(
      chartDataTypes.includes(type)
        ? { type, data: [] }
        : type === 'scatter'
          ? { type, series: [] }
          : { type, categories: [], series: [] }
    );
    const emptyProps = chartExampleProps(empty.code);
    assert.deepEqual(chartDataTypes.includes(type) ? emptyProps.data : emptyProps.series, []);
  }
  const callbacks = generateChartCode({
    onViewRangeChange: '{(range) => console.log(range)}',
    onHiddenSeriesChange: '{(ids) => console.log(ids)}',
    onChange: '{(id) => console.log(id)}',
    onDataClick: '{(datum, event) => console.log(datum.value, event.type)}',
    renderTooltip: '{(datum) => <strong>{datum.label}</strong>}',
    valueFormatter: '{(value, context) => `${context}: ${value}`}',
    onReady: '{() => console.log("ready")}',
    onStatusChange: '{(status) => console.log(status)}',
    onError: '{(error) => console.log(error.code)}',
  });
  assert.equal(callbacks.ok, true);
  assert.deepEqual(callbacks.warnings, []);
  const compiled = ts.transpileModule(callbacks.code, {
    fileName: 'ChartCallbacks.tsx',
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
    reportDiagnostics: true,
  });
  assert.deepEqual(compiled.diagnostics, []);
  assert.match(callbacks.code, /onHiddenSeriesChange=\{/);
  assert.match(callbacks.code, /onViewRangeChange=\{/);
  assert.match(callbacks.code, /renderTooltip=\{/);
});

test('Chart bundled metadata and generation match source after dist/data refresh', () => {
  assert.deepEqual(catalog.get('chart').props.type.enum, chartTypes);
  assert.deepEqual(
    chartExampleProps(buildExampleCode(catalog.get('chart'))),
    chartExampleProps(chartModule.exports.buildExampleCode(chartCatalog.get('chart')))
  );
  for (const form of chartForms) {
    const bundled = generateCode(catalog, 'Chart', form);
    const source = generateChartCode(form);
    assert.equal(bundled.ok, true);
    assert.deepEqual(bundled.warnings, source.warnings);
    assert.deepEqual(chartExampleProps(bundled.code), chartExampleProps(source.code));
  }
  const props = { type: 'bar', stack: false, animated: false, zoom: false, brush: false, csv: false, value: null, viewRange: null, defaultViewRange: null, error: null };
  assert.deepEqual(
    chartExampleProps(generateCode(catalog, 'Chart', props).code),
    chartExampleProps(generateChartCode(props).code)
  );
});

test('RPC gives useful failures and recognizes all three tools', () => {
  const call = (name, args) =>
    JSON.parse(
      handleLine(
        JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: { name, arguments: args },
        })
      )
    );
  assert.equal(JSON.parse(handleLine('{')).error.code, -32700);
  assert.equal(call('zuvi_get_component_api', { name: 'unknown' }).result.isError, true);
  assert.equal(
    call('zuvi_search_components', { query: 'button' }).result.structuredContent.results[0].name,
    'Button'
  );
  assert.match(
    call('zuvi_generate_code', { component: 'Image', props: { preview: false } }).result
      .structuredContent.code,
    /preview=\{false\}/
  );
});
test('stdio server handles split input and exits after EOF', async () => {
  const child = spawn(
    process.execPath,
    [fileURLToPath(new URL('../dist/index.js', import.meta.url))],
    { cwd: '/tmp' }
  );
  let output = '';
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    output += chunk;
  });
  const done = new Promise((resolve, reject) => {
    child.on('exit', resolve);
    child.on('error', reject);
  });
  child.stdin.write('{"jsonrpc":"2.0","id":1,"method":"initial');
  child.stdin.end('ize"}\n{"jsonrpc":"2.0","id":2,"method":"tools/list"}\n');
  assert.equal(await done, 0);
  const lines = output.trim().split('\n').map(JSON.parse);
  assert.equal(lines[0].result.serverInfo.name, '@zuvi/mcp');
  assert.equal(lines[1].result.tools.length, 3);
});
