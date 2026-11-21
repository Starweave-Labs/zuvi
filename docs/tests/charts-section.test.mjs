import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInThisContext } from 'node:vm';
import { fileURLToPath, URL } from 'node:url';

const require = createRequire(new URL('../package.json', import.meta.url));
const ts = require('typescript');
const root = new URL('../../', import.meta.url);
const charts = new URL('../src/pages/charts/', import.meta.url);
const source = (name) => readFileSync(new URL(name, charts), 'utf8');
const cache = new Map();

// Execute only our authored pure-data modules, in memory. No Chart dist or application build.
function loadData(name) {
  if (cache.has(name)) return cache.get(name);
  assert.ok(['chart-fixtures.ts', 'chart-input.ts'].includes(name));
  const result = ts.transpileModule(source(name), {
    fileName: name,
    reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  });
  assert.equal(
    (result.diagnostics ?? []).filter((item) => item.category === ts.DiagnosticCategory.Error)
      .length,
    0
  );
  const module = { exports: {} };
  const run = runInThisContext(`(function(require, module, exports) {\n${result.outputText}\n})`, {
    filename: name,
  });
  run(
    (specifier) => {
      assert.equal(specifier, './chart-fixtures');
      return loadData('chart-fixtures.ts');
    },
    module,
    module.exports
  );
  cache.set(name, module.exports);
  return module.exports;
}
const fixtures = loadData('chart-fixtures.ts');
const input = loadData('chart-input.ts');
const expectedForms = [
  ['line', 'line'],
  ['area', 'area'],
  ['stacked-area', 'area'],
  ['bar', 'bar'],
  ['stacked-bar', 'bar'],
  ['horizontal-bar', 'bar'],
  ['pie', 'pie'],
  ['donut', 'donut'],
  ['scatter', 'scatter'],
  ['bubble', 'scatter'],
  ['radar', 'radar'],
  ['heatmap', 'heatmap'],
  ['treemap', 'treemap'],
  ['funnel', 'funnel'],
  ['gauge', 'gauge'],
  ['waterfall', 'waterfall'],
  ['sparkline', 'sparkline'],
];
const preset = (id) => JSON.stringify(fixtures.getChartInput(fixtures.getChartForm(id)));
const parse = (id, data) =>
  input.parseChartInput(id, typeof data === 'string' ? data : JSON.stringify(data));
const reject = (id, data, message) => {
  const result = parse(id, data);
  assert.equal(result.ok, false, `Must reject ${id}: ${JSON.stringify(data)}`);
  if (message) assert.match(result.error, message);
};

test('17 named forms use exactly the locked 13 Chart discriminants and four prop variants', () => {
  const { CHART_FORMS, CHART_FAMILIES, getChartForm } = fixtures;
  assert.deepEqual(
    CHART_FORMS.map((form) => [form.id, form.config.type]),
    expectedForms
  );
  assert.equal(new Set(CHART_FORMS.map((form) => form.label)).size, 17);
  assert.equal(new Set(CHART_FORMS.map((form) => form.id)).size, 17);
  assert.deepEqual(
    CHART_FAMILIES.map((family) => family.id),
    ['trend', 'compare', 'composition', 'distribution', 'relation', 'multidim', 'process']
  );
  for (const family of CHART_FAMILIES) {
    assert.ok(family.label && family.question);
    assert.ok(
      CHART_FORMS.some((form) => form.family === family.id),
      `Populated family: ${family.id}`
    );
  }
  for (const form of CHART_FORMS) {
    assert.ok(CHART_FAMILIES.some((family) => family.id === form.family));
    assert.match(form.config['aria-label'], /示例/);
    assert.match(form.config.title, /示例/);
    assert.ok(form.description && form.source && form.exampleTitle);
    assert.equal(form.config.animated, undefined, 'Simple defaults are not changed in fixtures');
    assert.equal(form.config.zoom, undefined);
    assert.equal(form.config.brush, undefined);
  }
  assert.equal(getChartForm('stacked-area').config.stack, true);
  assert.equal(getChartForm('stacked-bar').config.stack, true);
  assert.equal(getChartForm('horizontal-bar').config.orientation, 'horizontal');
  assert.equal(getChartForm('bubble').config.bubble, true);
  assert.deepEqual(getChartForm('bubble').config.bubbleDomain, [4, 32]);
  assert.equal(getChartForm('scatter').config.bubble, undefined);
  const typeSource = readFileSync(
    new URL('packages/ui/src/components/Chart/chart-types.ts', root),
    'utf8'
  );
  const locked = [
    ...typeSource.match(/export type ChartType =([\s\S]*?);/)[1].matchAll(/'([^']+)'/g),
  ].map((match) => match[1]);
  assert.deepEqual([...new Set(CHART_FORMS.map((form) => form.config.type))].sort(), locked.sort());
});

test('all presets validate the correct editable data union; no executable or incompatible props leak into JSON', () => {
  for (const form of fixtures.CHART_FORMS) {
    const data = fixtures.getChartInput(form);
    const result = parse(form.id, data);
    assert.equal(result.ok, true, `${form.id}: ${result.error ?? ''}`);
    assert.ok(result.count > 0 && result.count <= 256);
    assert.equal(result.config.type, form.config.type);
    assert.equal(result.config.stack, form.config.stack);
    assert.equal(result.config.orientation, form.config.orientation);
    assert.equal(result.config.bubble, form.config.bubble);
    assert.ok(!('title' in data) && !('type' in data) && !('onChange' in data));
    if (form.config.type === 'scatter')
      assert.ok('series' in data && !('categories' in data) && !('data' in data));
    else if ('categories' in form.config)
      assert.ok('categories' in data && 'series' in data && !('data' in data));
    else assert.ok('data' in data && !('series' in data) && !('categories' in data));
  }
});

test('flat shared fixtures are reproducible text counts, trigonometry, geometry and dice enumeration', () => {
  const counts = fixtures.COMPOSITION_ROWS;
  assert.equal(
    counts.reduce((sum, item) => sum + item.value, 0),
    fixtures.SAMPLE_TEXT.length
  );
  assert.equal(
    counts.find((row) => row.id === 'vowels').value,
    (fixtures.SAMPLE_TEXT.match(/[aeiou]/gi) ?? []).length
  );
  for (const row of fixtures.TREND_ROWS) {
    const angle = Number.parseFloat(row.category);
    assert.ok(Math.abs(row.sin - 10 * Math.sin((angle * Math.PI) / 180)) <= 0.00501);
    assert.ok(Math.abs(row.cos - 10 * Math.cos((angle * Math.PI) / 180)) <= 0.00501);
  }
  for (const row of fixtures.SCATTER_ROWS) {
    const area = (row.seriesId === 'square' ? 1 : Math.PI) * row.x ** 2;
    const perimeter = (row.seriesId === 'square' ? 4 : 2 * Math.PI) * row.x;
    assert.ok(Math.abs(row.y - area) <= 0.00501);
    assert.ok(Math.abs(row.value - perimeter) <= 0.00501);
  }
  assert.equal(fixtures.HEATMAP_ROWS.length, 36);
  assert.equal(
    fixtures.HEATMAP_ROWS.reduce((sum, row) => sum + row.value, 0),
    252
  );
  assert.equal(new Set(fixtures.HEATMAP_ROWS.map((row) => `${row.row}:${row.col}`)).size, 36);
  assert.equal(
    fixtures.WATERFALL_ROWS.reduce((sum, row) => sum + row.value, 0),
    counts.find((row) => row.id === 'vowels').value
  );
  const funnel = fixtures.FUNNEL_ROWS;
  assert.ok(funnel.every((row, index) => index === 0 || row.value <= funnel[index - 1].value));
  for (const name of [
    'TREND_ROWS',
    'COMPOSITION_ROWS',
    'TEXT_ROWS',
    'SCATTER_ROWS',
    'HEATMAP_ROWS',
    'RADAR_ROWS',
    'FUNNEL_ROWS',
    'WATERFALL_ROWS',
  ]) {
    for (const row of fixtures[name])
      assert.ok(
        Object.values(row).every(
          (value) =>
            typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value))
        ),
        `${name} stays flat`
      );
  }
  assert.match(fixtures.SAMPLE_NOTICE, /示例.*非实时/);
});

test('JSON parser rejects prototype keys, functions, deep objects, nonfinite values and arbitrary CSS', () => {
  for (const key of ['__proto__', 'prototype', 'constructor']) {
    reject('line', `{"categories":[],"series":[],"${key}":{}}`, /原型/);
    reject(
      'line',
      `{"categories":["A"],"series":[{"id":"a","name":"A","values":[1],"${key}":{}}]}`,
      /原型/
    );
  }
  assert.equal({}.polluted, undefined);
  reject(
    'line',
    '{"categories":["A"],"series":[{"id":"a","name":"A","values":[1e999]}]}',
    /非有限/
  );
  reject(
    'line',
    '{"categories":["A"],"series":[{"id":"a","name":"A","values":[Infinity]}]}',
    /语法/
  );
  reject('line', '{"categories":[],"series":[],"onChange":()=>1}', /语法/);
  reject('line', { categories: [], series: [], onChange: 'alert(1)' }, /不支持字段/);
  let deep = {};
  for (let level = 0; level < 8; level++) deep = { child: deep };
  reject('line', { categories: [], series: [], nested: deep }, /嵌套/);
  reject(
    'line',
    { categories: ['A'], series: [{ id: 'a', name: 'A', values: ['1'] }] },
    /有限数字/
  );
  reject(
    'pie',
    { data: [{ id: 'a', label: 'A', value: 1, color: 'url(https://example.invalid/a.svg)' }] },
    /颜色/
  );
  assert.equal(
    parse('pie', { data: [{ id: 'a', label: 'A', value: 1, color: 'var(--zuvi-chart-series-8)' }] })
      .ok,
    true
  );
  reject('line', ' '.repeat(input.MAX_JSON_CHARS + 1), /最多/);
});

test('data validation preserves gaps, zero and signed deltas, but rejects malformed branch data and ids', () => {
  const signed = {
    categories: ['A', 'B', 'C'],
    series: [{ id: 'a', name: 'A', values: [-2, null, 0] }],
  };
  const accepted = parse('line', signed);
  assert.equal(accepted.ok, true);
  assert.deepEqual(accepted.config.series[0].values, [-2, null, 0]);
  assert.equal(accepted.count, 2);
  assert.equal(parse('pie', { data: [{ id: 'a', label: 'A', value: 0 }] }).ok, true);
  assert.equal(parse('waterfall', { data: [{ id: 'a', label: 'A', value: -3 }] }).ok, true);
  assert.equal(parse('line', { categories: [], series: [] }).ok, true);
  reject('line', { categories: ['A'], series: [{ id: 'a', name: 'A', values: [] }] }, /长度/);
  reject(
    'line',
    {
      categories: [],
      series: [
        { id: 'a', name: 'A', values: [] },
        { id: 'a', name: 'B', values: [] },
      ],
    },
    /重复/
  );
  reject('pie', { data: [{ id: 'a', label: 'A', value: -1 }] }, /非负/);
  reject(
    'pie',
    {
      data: [
        { id: 'a', label: 'A', value: 1 },
        { id: 'a', label: 'B', value: 2 },
      ],
    },
    /重复/
  );
  reject(
    'heatmap',
    {
      data: [
        { id: 'a', row: 'A', col: 'B', value: 1 },
        { id: 'b', row: 'A', col: 'B', value: 2 },
      ],
    },
    /row \/ col/
  );
  reject('line', { data: [] }, /不支持字段/);
  reject('bar', { categories: ['A'], series: [{ id: 'a', name: 'A', points: [] }] }, /不支持字段/);
  reject(
    'bubble',
    { series: [{ id: 'a', name: 'A', points: [{ id: 'p', x: 1, y: 2 }] }] },
    /value/
  );
  reject(
    'bubble',
    { series: [{ id: 'a', name: 'A', points: [{ id: 'p', x: 1, y: 2, value: -1 }] }] },
    /非负/
  );
  reject('bubble', { ...JSON.parse(preset('bubble')), bubbleDomain: [4, 4] }, /最小值/);
  reject('gauge', { data: [{ id: 'a', label: 'A', value: 110 }], min: 0, max: 100 }, /范围/);
  reject('gauge', { data: [] }, /一个切片/);
  reject(
    'funnel',
    {
      data: [
        { id: 'a', label: 'A', value: 1 },
        { id: 'b', label: 'B', value: 2 },
      ],
    },
    /非递增/
  );
  reject(
    'line',
    {
      categories: ['A'],
      series: Array.from({ length: 9 }, (_, i) => ({ id: String(i), name: 'A', values: [1] })),
    },
    /最多 8/
  );
  reject('line', { categories: Array(257).fill('A'), series: [] }, /最多 256/);
});

test('three lazy pages have matching nav, hash tabs and 86 navigation entries; group follows data', () => {
  const nav = readFileSync(new URL('../src/nav.ts', import.meta.url), 'utf8');
  const links = [...nav.matchAll(/\{ title: '([^']+)', path: '([^']+)', group: '([^']+)' \}/g)];
  assert.equal(links.length, 86);
  assert.deepEqual(
    links.filter((match) => match[3] === 'visualization').map((match) => [match[1], match[2]]),
    [
      ['图表画廊', '/charts'],
      ['交互与联动', '/charts/interactions'],
      ['可视化实验室', '/charts/playground'],
    ]
  );
  assert.match(nav, /data: '数据展示',\s*visualization: '数据可视化'/);
  assert.match(nav, /'data',\s*'visualization',\s*'feedback'/);
  const pages = [
    ['ChartsGalleryPage', '/charts'],
    ['ChartInteractionsPage', '/charts/interactions'],
    ['ChartPlaygroundPage', '/charts/playground'],
  ];
  for (const [name, path] of pages) {
    assert.match(
      nav,
      new RegExp(`const ${name} = lazy\\(\\(\\) => import\\('\\./pages/charts/${name}'\\)\\);`)
    );
    assert.ok(nav.includes(`'${path}': ${name}`));
    assert.ok(source(`${name}.tsx`).includes(`active="${path}"`));
    assert.ok(source('ChartSection.tsx').includes(`path: '${path}'`));
  }
  assert.match(source('ChartSection.tsx'), /href=\{`#\$\{link\.path\}`\}/);
  assert.match(source('ChartSection.tsx'), /usePageTitle\(title\)/);
  assert.match(source('ChartSection.tsx'), /className="doc-h1"/);
  assert.match(source('ChartSection.tsx'), /#\/components\/chart/);
  assert.match(readFileSync(new URL('e2e/docs-design.spec.ts', root), 'utf8'), /toHaveCount\(86\)/);
});

test('gallery mounts previews on visibility and detail on selection; playground keeps one transactional Chart', () => {
  const gallery = source('ChartsGalleryPage.tsx');
  const section = source('ChartSection.tsx');
  const lab = source('ChartPlaygroundPage.tsx');
  const interactions = source('ChartInteractionsPage.tsx');
  assert.match(section, /IntersectionObserver/);
  assert.match(section, /visible \? \(/);
  assert.match(section, /animated=\{false\}/);
  assert.match(gallery, /\['donut', 'bubble', 'heatmap'\]/);
  assert.match(gallery, /showDetail \? \(/);
  assert.match(gallery, /type="search"/);
  assert.match(gallery, /aria-pressed=\{family/);
  assert.equal((lab.match(/<Chart\b/g) ?? []).length, 1);
  assert.ok(lab.indexOf('if (!result.ok)') < lab.indexOf('setApplied((current)'));
  assert.match(lab, /上一份有效数据、预览和可复制代码保持不变/);
  assert.match(lab, /config: result\.config/);
  assert.match(lab, /chartExampleCode\(committedForm, displayConfig/);
  assert.match(lab, /data-chart-local-theme/);
  assert.match(section, /navigator\.clipboard/);
  assert.match(section, /手动复制/);
  assert.match(interactions, /tooltipMode="crosshair"/);
  assert.match(
    interactions,
    /value: selectedId,\s*onChange: changeSelection,\s*onDataClick: activateDatum/
  );
  assert.match(interactions, /viewRange=\{range\}\s+onViewRangeChange=\{changeRange\}/);
  assert.match(interactions, /zoom=\{zoom\}\s+brush=\{brush\}/);
  assert.match(interactions, /Shift 高亮应保留 hiddenSeries/);
  assert.match(interactions, /键盘等价选择/);
  assert.match(interactions, /csv\s+labels=/);
  assert.match(interactions, /减少动态效果/);
});

test('page sources parse and local CSS uses tokens, bounded type sizes and narrow-container fallbacks', () => {
  for (const name of [
    'chart-fixtures.ts',
    'chart-input.ts',
    'ChartSection.tsx',
    'ChartsGalleryPage.tsx',
    'ChartInteractionsPage.tsx',
    'ChartPlaygroundPage.tsx',
  ]) {
    const result = ts.transpileModule(source(name), {
      fileName: name,
      reportDiagnostics: true,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.ReactJSX,
      },
    });
    assert.equal(
      (result.diagnostics ?? []).filter((item) => item.category === ts.DiagnosticCategory.Error)
        .length,
      0,
      name
    );
    assert.doesNotMatch(
      source(name),
      /dangerouslySetInnerHTML|\beval\s*\(|\bnew Function\b|fetch\s*\(/
    );
  }
  const css = source('charts-section.css');
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|:root\b|@import\b|url\s*\(|https?:\/\//i);
  assert.doesNotMatch(css, /(?:^|[;{\s])(?:rgb|hsl|oklch|lab)\(/i);
  assert.match(css, /container: visualization \/ inline-size/);
  assert.match(css, /grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(css, /@media \(max-width: 400px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /focus-visible/);
  assert.match(css, /font-variant-numeric: tabular-nums/);
  assert.match(css, /overflow-wrap: anywhere/);
  assert.match(css, /min-height: 40px/);
  const lab = source('ChartPlaygroundPage.tsx');
  for (const token of [
    'bg',
    'axis-color',
    'grid-color',
    'text-color',
    'line-width',
    'point-radius',
  ])
    assert.ok(lab.includes(`--zuvi-chart-${token}`));
  assert.match(lab, /chart-series-\$\{index \+ 1\}/);
});

test('laboratory is preview-first, wide and tabbed rather than a stack of settings cards', () => {
  const lab = source('ChartPlaygroundPage.tsx');
  const shell = readFileSync(new URL('docs/src/App.tsx', root), 'utf8');
  const css = source('charts-section.css');
  assert.match(lab, /workbench\s*>/);
  assert.match(lab, /<Tabs\s+value=\{panel\}/);
  assert.match(lab, /<Tabs\.Trigger value="data"/);
  assert.match(lab, /<Tabs\.Trigger value="appearance"/);
  assert.match(lab, /<Tabs\.Trigger value="code"/);
  assert.ok(
    lab.indexOf('className="viz-lab-preview"') < lab.indexOf('className="viz-lab-inspector"')
  );
  assert.equal((lab.match(/<Chart\b/g) ?? []).length, 1);
  assert.match(lab, /<CodeSnippet code=\{code\} label="当前有效配置" inline/);
  assert.match(shell, /displayedRoute === '\/charts\/playground'/);
  assert.match(css, /@container visualization \(min-width: 880px\)/);
  assert.match(css, /minmax\(0, 1fr\) clamp\(320px, 30cqi, 360px\)/);
  assert.match(css, /height: clamp\(400px, calc\(100dvh - 330px\), 480px\)/);
  assert.match(css, /\.viz-page--workbench \.viz-section-header/);
  assert.match(lab, /event\.nativeEvent\.isComposing/);
});

test('laboratory transitions are local, opt-out capable and avoid remounting same-form data updates', () => {
  const lab = source('ChartPlaygroundPage.tsx');
  const css = source('charts-section.css');
  assert.match(lab, /\[animated, setAnimated\] = useState\(true\)/);
  assert.match(lab, /key=\{applied\.formId\}/);
  assert.doesNotMatch(lab, /key=\{`\$\{applied\.formId\}-\$\{applied\.revision\}`\}/);
  assert.match(lab, /data-motion=\{animated \? 'on' : 'off'\}/);
  assert.match(lab, /启用平滑过渡/);
  assert.match(css, /@media \(prefers-reduced-motion: no-preference\)/);
  assert.match(css, /viz-lab-workbench\[data-motion='on'\]/);
  for (const name of ['enter', 'panel-enter', 'chart-enter'])
    assert.ok(css.includes(`@keyframes viz-workbench-${name}`));
  assert.doesNotMatch(lab, /requestAnimationFrame|setInterval|setTimeout/);
});

test('copyable code contains the actual applied data branch and selected variant, not fake type aliases', () => {
  for (const form of fixtures.CHART_FORMS) {
    const accepted = parse(form.id, preset(form.id));
    assert.equal(accepted.ok, true);
    const code = fixtures.chartExampleCode(form, accepted.config, {
      height: 300,
      csv: true,
      animated: false,
      theme: 'dark',
      style: { '--zuvi-chart-line-width': '4' },
    });
    assert.match(code, /@zuvi\/react/);
    assert.match(code, /satisfies ChartProps/);
    assert.match(code, /data-theme="dark"/);
    assert.ok(code.includes(`"type": "${form.config.type}"`));
    assert.ok(code.includes('"csv": true'));
    assert.ok(!code.includes('"type": "bubble"') && !code.includes('"type": "stacked-bar"'));
    const result = ts.transpileModule(code, {
      fileName: 'example.tsx',
      reportDiagnostics: true,
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX },
    });
    assert.equal(
      (result.diagnostics ?? []).filter((item) => item.category === ts.DiagnosticCategory.Error)
        .length,
      0,
      form.id
    );
  }
});

test('owned pages and helpers strictly type-check against locked public Chart props without a build', () => {
  const base = fileURLToPath(root);
  const lockedPath = fileURLToPath(
    new URL('packages/ui/src/components/Chart/chart-types.ts', root)
  );
  const files = [
    'chart-fixtures.ts',
    'chart-input.ts',
    'ChartSection.tsx',
    'ChartsGalleryPage.tsx',
    'ChartInteractionsPage.tsx',
    'ChartPlaygroundPage.tsx',
  ].map((name) => fileURLToPath(new URL(name, charts)));
  const options = {
    noEmit: true,
    strict: true,
    skipLibCheck: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    baseUrl: base,
    paths: { '@zuvi/react': [lockedPath] },
  };
  const host = ts.createCompilerHost(options);
  const read = host.readFile.bind(host);
  // Public Chart signature only, appended in memory. Never edit or run engine/View source.
  host.readFile = (path) => {
    const contents = read(path);
    return path === lockedPath && contents !== undefined
      ? `${contents}\nexport declare const Chart: React.ComponentType<ChartProps>;\nexport { Tabs } from ${JSON.stringify(fileURLToPath(new URL('packages/ui/src/components/Tabs/Tabs', root)))};\n`
      : contents;
  };
  const program = ts.createProgram(files, options, host);
  const errors = [...program.getSyntacticDiagnostics(), ...program.getSemanticDiagnostics()].filter(
    (item) => item.category === ts.DiagnosticCategory.Error
  );
  const messages = ts.formatDiagnostics(errors, {
    getCurrentDirectory: () => base,
    getCanonicalFileName: (name) => name,
    getNewLine: () => '\n',
  });
  assert.equal(errors.length, 0, messages);
});

// Main owns the dist rebuild. Enable only AFTER main confirms that build; never import stale dist by default.
test(
  'fresh Chart dist exposes the documented React component (integration pending main build)',
  {
    skip:
      process.env.CHART_DOCS_CHECK_DIST !== '1'
        ? 'Pending main Chart build; source/fixture checks only.'
        : false,
  },
  async () => {
    const path = new URL('packages/ui/dist/index.js', root);
    assert.ok(existsSync(path), `Build missing: ${fileURLToPath(path)}`);
    const api = await import(path.href);
    assert.ok(api.Chart, 'Real distribution must expose Chart');
  }
);
