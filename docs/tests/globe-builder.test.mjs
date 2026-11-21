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
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../src/pages/builder');
const modules = new Map();
const globeCalls = [];
const ui = {
  Globe(props) {
    globeCalls.push(props);
    return React.createElement('div', { 'data-globe-test-renderer': props.renderMode });
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
        ? ui
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
const { CatalogRender, catalogComponents } = load(resolve(root, 'builder-catalog'));
const defaults = () => JSON.parse(JSON.stringify(catalogComponents.Globe.defaultProps));
const document = (props = {}) => ({
  root: { props: { title: '地球示例', theme: 'light' } },
  content: [{ type: 'Globe', props: { ...defaults(), ...props, id: 'globe-example' } }],
});
const render = (props = {}, editing = false) => {
  globeCalls.length = 0;
  const markup = renderToStaticMarkup(
    React.createElement(CatalogRender, {
      type: 'Globe',
      p: { ...defaults(), ...props, id: 'globe-example' },
      editing,
    })
  );
  assert.equal(globeCalls.length, 1);
  return { markup, props: globeCalls[0] };
};

test('Globe uses serializable content catalog defaults and independent flat JSON fields', () => {
  const definition = catalog.catalogDefinitions.Globe;
  assert.equal(definition.label, 'Globe 3D 地球');
  assert.equal(definition.group, 'content');
  assert.equal(definition.fields.rowsJson.kind, 'rows');
  assert.equal(definition.fields.arcsJson.kind, 'rows');
  assert.equal(definition.fields.categoriesJson.kind, 'rows');
  assert.equal(definition.fields.rows, undefined);
  assert.equal(model.componentProps.Globe.rowsJson, 'json:rows');
  assert.equal(model.componentProps.Globe.arcsJson, 'json:rows');
  assert.equal(model.componentProps.Globe.categoriesJson, 'json:rows');
  assert.equal(defaults().renderMode, '2d');
  assert.equal(defaults().showPointList, true);
  assert.deepEqual(defaults().categoriesJson, []);
  assert.equal(defaults().legend, true);
  assert.equal(defaults().pointLabels, 'none');
  assert.equal(defaults().maxLabels, 12);
  assert.equal(defaults().valueScale, false);
  assert.equal(defaults().searchable, false);
  assert.equal(defaults().defaultSearchValue, '');
  assert.equal(defaults().showArcList, false);
  assert.equal(defaults().defaultArcValue, '');
  assert.equal(defaults().transitionDuration, 0);
  const input = document();
  assert.deepEqual(model.validateBuilderData(input), input);
  assert.deepEqual(
    model.parseBuilderImport(JSON.stringify(input)).pages[0].data.content,
    input.content
  );
  const { points, arcs, categories, issues } = catalog.resolveCatalogGlobeData(
    defaults().rowsJson,
    defaults().arcsJson,
    defaults().categoriesJson
  );
  assert.equal(issues.length, 0);
  assert.deepEqual(categories, []);
  assert.ok(points.length > 1 && arcs.length > 0);
  for (const point of points) {
    assert.equal(typeof point.latitude, 'number');
    assert.equal(typeof point.longitude, 'number');
    assert.equal(point.lat, undefined);
    assert.equal(point.lng, undefined);
    assert.ok(point.latitude >= -90 && point.latitude <= 90);
    assert.ok(point.longitude >= -180 && point.longitude <= 180);
  }
  for (const arc of arcs) {
    assert.ok(points.some((point) => point.id === arc.from));
    assert.ok(points.some((point) => point.id === arc.to));
  }
});

test('Globe row transformations preserve zero coordinates, scalar values and clamp geometric sizes', () => {
  const result = catalog.resolveCatalogGlobeData(
    [
      {
        id: ' equator ',
        lat: 0,
        lng: 0,
        name: '零点',
        value: 0,
        size: 5,
        color: 'var(--zuvi-color-success)',
        ignored: { nested: 'not forwarded' },
      },
      { id: 'south', lat: -33.8688, lng: 151.2093, value: '城市参考', size: -2 },
    ],
    [
      {
        id: 'route',
        from: ' equator ',
        to: 'south',
        width: 1,
        altitude: -1,
        animated: false,
        color: '#abcdef',
        ignored: ['not forwarded'],
      },
    ]
  );
  assert.deepEqual(result.issues, []);
  assert.deepEqual(result.points, [
    {
      id: 'equator',
      latitude: 0,
      longitude: 0,
      name: '零点',
      value: 0,
      size: 0.06,
      color: 'var(--zuvi-color-success)',
    },
    { id: 'south', latitude: -33.8688, longitude: 151.2093, value: '城市参考', size: 0.008 },
  ]);
  assert.deepEqual(result.arcs, [
    {
      id: 'route',
      from: 'equator',
      to: 'south',
      width: 0.02,
      altitude: 0.02,
      animated: false,
      color: '#abcdef',
    },
  ]);
});

test('Globe category and route metadata are sanitized independently without forwarding raw rows', () => {
  const result = catalog.resolveCatalogGlobeData(
    [
      { id: 'a', lat: 0, lng: 0, category: ' region ', value: 0, ignored: { unsafe: true } },
      { id: 'b', lat: 1, lng: 1, category: 'unconfigured' },
      { id: 'c', lat: 2, lng: 2, category: { nested: 'invalid' } },
    ],
    [
      {
        id: 'ab',
        from: 'a',
        to: 'b',
        name: '城市 A → 城市 B',
        value: 0,
        ignored: { unsafe: true },
      },
      { id: 'bc', from: 'b', to: 'c', name: 123, value: { unsafe: true } },
    ],
    [
      { id: ' region ', name: ' 地区 ', color: ' var(--zuvi-color-success) ', ignored: true },
      { id: 'region', name: 'duplicate' },
      { id: 'unsafe', name: '安全降级', color: 'url(https://external.test/)' },
      { id: 'unnamed', name: ' ' },
      { id: 'bad-name', name: { nested: 'invalid' } },
    ]
  );
  assert.deepEqual(result.categories, [
    { id: 'region', name: '地区', color: 'var(--zuvi-color-success)' },
    { id: 'unsafe', name: '安全降级' },
  ]);
  assert.deepEqual(result.points, [
    { id: 'a', latitude: 0, longitude: 0, category: 'region', value: 0 },
    { id: 'b', latitude: 1, longitude: 1, category: 'unconfigured' },
    { id: 'c', latitude: 2, longitude: 2 },
  ]);
  assert.deepEqual(result.arcs, [
    { id: 'ab', from: 'a', to: 'b', name: '城市 A → 城市 B', value: 0 },
    { id: 'bc', from: 'b', to: 'c' },
  ]);
  assert.ok(result.issues.some((issue) => issue.includes('分类第 2 行')));
  assert.ok(result.issues.some((issue) => issue.includes('分类第 3 行颜色无效')));
  assert.ok(result.issues.some((issue) => issue.includes('点位第 3 行分类无效')));
  assert.deepEqual(catalog.resolveCatalogGlobeData([], []).categories, []);
  const bounded = catalog.resolveCatalogGlobeData(
    [],
    [],
    Array.from({ length: 2001 }, () => ({}))
  );
  assert.ok(bounded.issues.length <= 13);
  assert.match(bounded.issues.at(-1), /同类数据问题/);
});

test('Globe route metadata preserves text safely and bounds long scalar values', () => {
  const result = catalog.resolveCatalogGlobeData(
    [
      { id: 'a', lat: 0, lng: 0 },
      { id: 'b', lat: 1, lng: 1 },
    ],
    [
      { id: 'ab', from: 'a', to: 'b', name: '<script>not HTML</script>', value: 'x'.repeat(10001) },
      { id: 'ba', from: 'b', to: 'a', value: Infinity },
    ],
    [{ id: 'region', name: '<img src=x onerror=alert(1)>', color: 'red; background: url(x)' }]
  );
  assert.equal(result.arcs[0].name, '<script>not HTML</script>');
  assert.equal(result.arcs[0].value.length, 10000);
  assert.equal(result.arcs[1].value, undefined);
  const output = render({
    rowsJson: [
      { id: 'a', name: '城市 A', lat: 0, lng: 0 },
      { id: 'b', name: '城市 B', lat: 1, lng: 1 },
    ],
    arcsJson: result.arcs,
    showArcList: true,
  });
  const details = renderToStaticMarkup(
    output.props.renderArcDetails(result.arcs[0], {
      from: output.props.points[0],
      to: output.props.points[1],
    })
  );
  assert.ok(details.includes('&lt;script&gt;not HTML&lt;/script&gt;'));
  assert.ok(!details.includes('<script>'));
  assert.ok(details.includes('城市 A → 城市 B'));
});

test('Globe skips invalid or duplicate points and routes without manufacturing coordinates', () => {
  const result = catalog.resolveCatalogGlobeData(
    [
      null,
      { id: 'empty' },
      { id: 'numeric-string', lat: '31.2', lng: 121.4 },
      { id: 'bad-latitude', lat: 91, lng: 0 },
      { id: 'bad-longitude', lat: 0, lng: -181 },
      { id: 'infinite', lat: Infinity, lng: 0 },
      { id: 'first', lat: 0, lng: 0 },
      { id: 'first', lat: 1, lng: 1 },
      { id: 'second', lat: -90, lng: 180 },
    ],
    [
      { id: 'missing', from: 'first', to: 'gone' },
      { id: 'self', from: 'first', to: 'first' },
      { id: 'ok', from: 'first', to: 'second' },
      { id: 'ok', from: 'second', to: 'first' },
      ['not a row'],
    ]
  );
  assert.deepEqual(result.points, [
    { id: 'first', latitude: 0, longitude: 0 },
    { id: 'second', latitude: -90, longitude: 180 },
  ]);
  assert.deepEqual(result.arcs, [{ id: 'ok', from: 'first', to: 'second' }]);
  assert.ok(result.issues.some((issue) => issue.includes('点位第 8 行')));
  assert.ok(result.issues.some((issue) => issue.includes('连接第 1 行')));
});

test('Globe ignores unsafe colors and non-finite optional geometry, with bounded diagnostics', () => {
  const result = catalog.resolveCatalogGlobeData(
    [
      {
        id: 'a',
        lat: 0,
        lng: 0,
        color: 'url(https://external.test/texture.png)',
        size: NaN,
        value: { forged: true },
      },
      { id: 'b', lat: 1, lng: 1, color: 'red; background: url(https://external.test/)' },
    ],
    [
      {
        id: 'r',
        from: 'a',
        to: 'b',
        color: '</style><script>alert(1)</script>',
        width: Infinity,
        altitude: NaN,
        animated: 'false',
      },
    ]
  );
  assert.deepEqual(result.points, [
    { id: 'a', latitude: 0, longitude: 0 },
    { id: 'b', latitude: 1, longitude: 1 },
  ]);
  assert.deepEqual(result.arcs, [{ id: 'r', from: 'a', to: 'b' }]);
  assert.equal(result.issues.length, 3);
  const bounded = catalog.resolveCatalogGlobeData(
    Array.from({ length: 2001 }, () => ({})),
    'unchecked JSON'
  );
  assert.ok(bounded.issues.length <= 13);
  assert.ok(bounded.issues.at(-1).includes('同类数据问题'));
  assert.deepEqual(bounded.points, []);
  assert.deepEqual(bounded.arcs, []);
});

test('Globe import validates flat rows and refuses nested models, functions and prototype keys', () => {
  assert.throws(
    () =>
      model.validateBuilderData(document({ rowsJson: [{ id: 'a', lat: { value: 0 }, lng: 0 }] })),
    /文字、数字、布尔值或空值/
  );
  assert.throws(
    () => model.validateBuilderData(document({ arcsJson: [{ id: 'r', from: ['a'], to: 'b' }] })),
    /文字、数字、布尔值或空值/
  );
  assert.throws(
    () => model.validateBuilderData(document({ rowsJson: [{ id: 'a', lat: Infinity, lng: 0 }] })),
    /文字、数字、布尔值或空值/
  );
  assert.throws(
    () =>
      model.validateBuilderData(
        document({ rowsJson: JSON.parse('[{"id":"a","lat":0,"lng":0,"__proto__":"blocked"}]') })
      ),
    /不支持的数据字段/
  );
  assert.throws(
    () => model.validateBuilderData(document({ onChange: () => {} })),
    /不支持的Globe属性/
  );
  assert.throws(
    () =>
      model.validateBuilderData(
        document({ categoriesJson: [{ id: 'region', name: { nested: 'bad' } }] })
      ),
    /文字、数字、布尔值或空值/
  );
  assert.throws(
    () =>
      model.validateBuilderData(
        document({
          categoriesJson: JSON.parse('[{"id":"region","name":"地区","constructor":"blocked"}]'),
        })
      ),
    /不支持的数据字段/
  );
  assert.throws(() => model.validateBuilderData(document({ latitude: 100 })), /latitude应在/);
  assert.throws(() => model.validateBuilderData(document({ renderMode: 'webgl' })), /不支持的选项/);
  assert.throws(
    () => model.validateBuilderData(document({ pointLabels: 'everything' })),
    /不支持的选项/
  );
  assert.throws(
    () => model.validateBuilderData(document({ transitionDuration: -1 })),
    /transitionDuration应在/
  );
  assert.throws(() => model.validateBuilderData(document({ maxLabels: 41 })), /maxLabels应在/);
  assert.throws(
    () => model.validateBuilderData(document({ valueScale: { domain: [0, 10] } })),
    /valueScale必须是开关值/
  );
});

test('Globe design canvas is lightweight 2d while runtime honors configured mode and selection', () => {
  const editor = render({ renderMode: 'auto', autoRotate: true, animateArcs: true }, true);
  assert.equal(editor.props.renderMode, '2d');
  assert.equal(editor.props.autoRotate, false);
  assert.equal(editor.props.animateArcs, false);
  assert.equal(editor.props.interactive, false);
  assert.equal(editor.props.wheelZoom, false);
  assert.equal(editor.props.value, 'shanghai');
  assert.deepEqual(editor.props.defaultView, { latitude: 20, longitude: 105, zoom: 1 });
  assert.ok(!editor.markup.includes('当前选择'));
  const runtime = render({ renderMode: 'auto', defaultValue: 'tokyo', wheelZoom: true });
  assert.equal(runtime.props.renderMode, 'auto');
  assert.equal(runtime.props.interactive, true);
  assert.equal(runtime.props.wheelZoom, true);
  assert.equal(runtime.props.autoRotate, true);
  assert.equal(runtime.props.value, 'tokyo');
  assert.equal(typeof runtime.props.onChange, 'function');
  assert.ok(runtime.markup.includes('当前选择：东京'));
  assert.equal(runtime.props.rowsJson, undefined);
  assert.equal(runtime.props.arcsJson, undefined);
  assert.equal(runtime.props.loading, undefined);
});

test('Globe builder config roundtrips categories, search, labels, sizing and arc details into runtime', () => {
  const configured = {
    categoriesJson: [{ id: 'east-asia', name: '东亚', color: 'var(--zuvi-color-primary)' }],
    rowsJson: [
      { id: 'a', name: '城市 A', lat: 0, lng: 0, category: 'east-asia', value: 2 },
      { id: 'b', name: '城市 B', lat: 1, lng: 1, category: 'east-asia', value: 5 },
    ],
    arcsJson: [{ id: 'ab', from: 'a', to: 'b', name: 'A 到 B', value: '示例路径' }],
    defaultValue: 'a',
    defaultArcValue: 'ab',
    pointLabels: 'auto',
    maxLabels: 7,
    valueScale: true,
    searchable: true,
    defaultSearchValue: '城市 B',
    showArcList: true,
    transitionDuration: 650,
    renderMode: 'auto',
  };
  const input = document(configured);
  assert.deepEqual(model.validateBuilderData(input), input);
  assert.deepEqual(
    model.parseBuilderImport(JSON.stringify(input)).pages[0].data.content,
    input.content
  );
  const runtime = render(configured);
  assert.deepEqual(runtime.props.categories, configured.categoriesJson);
  assert.equal(runtime.props.points[0].category, 'east-asia');
  assert.equal(runtime.props.arcs[0].name, 'A 到 B');
  assert.equal(runtime.props.arcs[0].value, '示例路径');
  assert.equal(runtime.props.pointLabels, 'auto');
  assert.equal(runtime.props.maxLabels, 7);
  assert.equal(runtime.props.valueScale, true);
  assert.equal(runtime.props.searchable, true);
  assert.equal(runtime.props.defaultSearchValue, '城市 B');
  assert.equal(runtime.props.showArcList, true);
  assert.equal(runtime.props.arcValue, 'ab');
  assert.equal(typeof runtime.props.onArcChange, 'function');
  assert.equal(runtime.props.transitionDuration, 650);
  assert.equal(runtime.props.categoriesJson, undefined);
  const details = renderToStaticMarkup(
    runtime.props.renderArcDetails(runtime.props.arcs[0], {
      from: runtime.props.points[0],
      to: runtime.props.points[1],
    })
  );
  assert.ok(details.includes('data-builder-globe-route-id="ab"'));
  assert.ok(details.includes('A 到 B'));
  assert.ok(details.includes('城市 A → 城市 B'));
  assert.ok(details.includes('端点 id：a → b'));
  assert.ok(details.includes('示例路径'));
  const editor = render({ ...configured, autoRotate: true, animateArcs: true }, true);
  assert.equal(editor.props.renderMode, '2d');
  assert.equal(editor.props.interactive, false);
  assert.equal(editor.props.autoRotate, false);
  assert.equal(editor.props.animateArcs, false);
  assert.equal(editor.props.transitionDuration, 0);
  assert.equal(editor.props.pointLabels, 'auto', 'editing still previews label layout');
  assert.deepEqual(editor.props.categories, configured.categoriesJson);
  const legacy = defaults();
  delete legacy.categoriesJson;
  const oldDocument = document(legacy);
  delete oldDocument.content[0].props.categoriesJson;
  assert.deepEqual(model.validateBuilderData(oldDocument), oldDocument);
  assert.deepEqual(render({ categoriesJson: undefined }).props.categories, []);
});

test('Globe adapter visibly reports invalid data and a missing selected id without crashing', () => {
  const output = render({
    rowsJson: [
      { id: 'a', lat: 0, lng: 0 },
      { id: 'bad', lat: 120, lng: 0 },
    ],
    arcsJson: [{ id: 'route', from: 'a', to: 'gone' }],
    defaultValue: 'gone',
    latitude: null,
    height: -10,
    rotationSpeed: 1000,
  });
  assert.equal(output.props.value, null);
  assert.equal(output.props.points.length, 1);
  assert.equal(output.props.arcs.length, 0);
  assert.equal(output.props.defaultView.latitude, 20);
  assert.equal(output.props.height, 160);
  assert.equal(output.props.rotationSpeed, 60);
  assert.ok(output.markup.includes('部分地球数据未绘制'));
  assert.ok(output.markup.includes('当前选择：未选择'));
});
