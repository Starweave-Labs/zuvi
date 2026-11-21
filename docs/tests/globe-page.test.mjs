import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';

const require = createRequire(import.meta.url);
const uiRequire = createRequire(new URL('../../packages/ui/package.json', import.meta.url));
const { JSDOM } = uiRequire('jsdom');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const docs = resolve(dirname(fileURLToPath(import.meta.url)), '../src');
const modules = new Map();
const globeCalls = [];
const element = (name) =>
  function Component({ children, label, tip }) {
    return React.createElement('div', { 'data-doc-test-component': name }, label, tip, children);
  };
const Descriptions = element('Descriptions');
Descriptions.Item = element('Descriptions.Item');
const ui = {
  Button({ children, iconEnd, ...props }) {
    const { variant: _variant, size: _size, ...attributes } = props;
    return React.createElement('button', attributes, children, iconEnd);
  },
  Descriptions,
  Tag: element('Tag'),
  Spin: element('Spin'),
  Skeleton: element('Skeleton'),
  Slider: element('Slider'),
  Switch: element('Switch'),
  Segmented: ({ options }) =>
    React.createElement(
      'div',
      null,
      options.map((option) => React.createElement('span', { key: option.value }, option.label))
    ),
  Collapse: ({ items, value = [], onChange }) =>
    React.createElement(
      'div',
      null,
      items.map((item) =>
        React.createElement(
          'div',
          { key: item.key },
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: () =>
                onChange(
                  value.includes(item.key)
                    ? value.filter((key) => key !== item.key)
                    : [...value, item.key]
                ),
            },
            item.label
          ),
          item.children
        )
      )
    ),
  Globe(props) {
    globeCalls.push(props);
    return React.createElement('div', {
      'data-doc-test-globe': true,
      'aria-label': props.labels.label,
    });
  },
};
const Icon = () => React.createElement('span', { 'aria-hidden': true });
const icons = { ArrowRight: Icon, Globe: Icon, MapPin: Icon };
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
        : id === '@zuvi/icons'
          ? icons
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
const GlobePage = load(resolve(docs, 'pages/components/GlobePage')).default;
const nav = load(resolve(docs, 'nav'));
function render() {
  globeCalls.length = 0;
  const markup = renderToStaticMarkup(React.createElement(GlobePage));
  return { markup, globes: [...globeCalls] };
}

test('Globe has one lazy data navigation route and the requested page title', () => {
  const matching = nav.navItems.filter((item) => item.path === '/components/globe');
  assert.deepEqual(matching, [
    { title: 'Globe 3D 地球', path: '/components/globe', group: 'data' },
  ]);
  assert.ok(nav.routeComponents['/components/globe']);
  const { markup } = render();
  assert.match(markup, /<h1[^>]*>Globe 3D 地球<\/h1>/);
  const source = readFileSync(resolve(docs, 'pages/components/GlobePage.tsx'), 'utf8');
  assert.match(source, /usePageTitle\('Globe 3D 地球'\)/);
  assert.match(source, /Globe as GlobeIcon/);
});

test('Globe docs mount one network scene with actual city coordinates and sample-derived connections', () => {
  const { markup, globes } = render();
  assert.equal(globes.length, 1, 'closed secondary examples must not mount extra scenes');
  const hero = globes[0];
  assert.equal(hero.points.length, 8);
  assert.equal(hero.arcs.length, 9);
  assert.deepEqual(hero.defaultView, { latitude: 20, longitude: 105, zoom: 1 });
  assert.equal(hero.view, undefined, 'defaultView lets automatic rotation own its camera');
  assert.equal(hero.autoRotate, true);
  assert.equal(hero.value, 'shanghai');
  assert.equal(typeof hero.onChange, 'function');
  assert.equal(typeof hero.onViewChange, 'function');
  const shanghai = hero.points.find((point) => point.id === 'shanghai');
  assert.equal(shanghai.latitude, 31.2304);
  assert.equal(shanghai.longitude, 121.4737);
  const sydney = hero.points.find((point) => point.id === 'sydney');
  assert.equal(sydney.latitude, -33.8688);
  assert.equal(sydney.longitude, 151.2093);
  const ids = new Set(hero.points.map((point) => point.id));
  assert.equal(ids.size, hero.points.length);
  for (const point of hero.points) {
    assert.ok(point.name && typeof point.name === 'string');
    assert.ok(point.latitude >= -90 && point.latitude <= 90);
    assert.ok(point.longitude >= -180 && point.longitude <= 180);
  }
  for (const point of hero.points) {
    assert.equal(
      point.value,
      hero.arcs.filter((arc) => arc.from === point.id || arc.to === point.id).length,
      `${point.id} uses full-data sample degree, never a timezone string`
    );
    assert.ok(hero.categories.some((category) => category.id === point.category));
    assert.equal(point.color, undefined, 'marker color is driven by its configured category');
    assert.ok(point.timeZone.includes('/'), 'timezone is separate descriptive metadata');
  }
  for (const arc of hero.arcs) {
    assert.ok(ids.has(arc.from) && ids.has(arc.to));
    assert.notEqual(arc.from, arc.to);
    const from = hero.points.find((point) => point.id === arc.from);
    const to = hero.points.find((point) => point.id === arc.to);
    assert.equal(arc.name, `${from.name} → ${to.name}`);
    assert.match(arc.value, /^示例路径 \d+$/);
  }
  assert.equal(hero.categories.length, 6);
  assert.deepEqual(hero.hiddenCategories, []);
  assert.equal(hero.pointLabels, 'auto');
  assert.equal(hero.maxLabels, 12);
  assert.equal(hero.valueScale, true);
  assert.equal(hero.searchable, true);
  assert.equal(hero.searchValue, '');
  assert.equal(hero.focus, null);
  assert.equal(hero.transitionDuration, 700);
  assert.equal(hero.showArcList, true);
  assert.equal(hero.arcValue, 'shanghai-tokyo');
  assert.match(markup, /<details class="globe-demo-settings" open="">/);
  assert.ok(markup.includes('data-globe-demo="network"'));
  assert.ok(markup.includes('示例数据 · 非实时'));
  assert.ok(markup.includes('上次交互缩放'));
  assert.ok(markup.includes('时区标签不计算夏令时'));
  assert.ok(markup.includes('所选城市详情'));
  assert.ok(markup.includes('加入巴黎'));
});

test('Globe docs publish the public API, customization slots, keyboard and provenance caveats', () => {
  const { markup, globes } = render();
  for (const text of [
    'GlobePoint',
    'GlobeArc',
    'GlobeView',
    'onPointClick',
    'onViewChange',
    'rotationSpeed',
    'onStatusChange',
    'renderTooltip',
    'showPointList',
    'wheelZoom',
    'GlobeCategory',
    'GlobeValueScale',
    'GlobeFocusRequest',
    'hiddenCategories',
    'pointLabels',
    'maxLabels',
    'valueScale',
    'searchable',
    'searchValue',
    'transitionDuration',
    'arcValue',
    'onArcClick',
    'renderArcDetails',
    'categoriesJson',
    'ESM / npm',
    'CDN / IIFE 与离线 HTML',
    'rowsJson',
    'arcsJson',
    'ne_110m_land 4.1.0',
    'Public domain',
    'Home',
    'Escape',
  ]) {
    assert.ok(markup.includes(text), text);
  }
  for (const part of [
    'root',
    'stage',
    'canvas',
    'controls',
    'control',
    'point',
    'tooltip',
    'point-list',
    'point-item',
    'label',
    'legend',
    'legend-item',
    'search',
    'arc-list',
    'arc-item',
    'arc-details',
    'loading',
    'fallback',
    'error',
  ]) {
    assert.ok(markup.includes(`data-part=&quot;${part}&quot;`), part);
  }
  for (const suffix of [
    'height',
    'bg',
    'border-radius',
    'ocean-color',
    'land-color',
    'coast-color',
    'grid-color',
    'atmosphere-color',
    'point-color',
    'arc-color',
  ]) {
    assert.ok(markup.includes(`--zuvi-globe-${suffix}`), suffix);
  }
  assert.match(markup, /https:\/\/www\.naturalearthdata\.com\/about\/terms-of-use\//);
  assert.ok(markup.includes('不应作为导航、测量或行政区划依据'));
  const tooltip = renderToStaticMarkup(globes[0].renderTooltip(globes[0].points[0]));
  assert.ok(tooltip.includes('上海 Shanghai'));
  assert.ok(tooltip.includes('31.2304° N'));
  assert.ok(tooltip.includes('121.4737° E'));
  assert.ok(tooltip.includes('示例连接数：3'));
  const arc = globes[0].arcs[0];
  const route = renderToStaticMarkup(
    globes[0].renderArcDetails(arc, {
      from: globes[0].points.find((point) => point.id === arc.from),
      to: globes[0].points.find((point) => point.id === arc.to),
    })
  );
  assert.ok(route.includes('data-globe-route-id="shanghai-tokyo"'));
  assert.ok(route.includes('上海 Shanghai → 东京 Tokyo'));
  assert.ok(route.includes('端点 id：shanghai → tokyo'));
  assert.ok(route.includes('示例路径 1'));
});

test('Globe docs use token-only panel palettes and shrinkable responsive layouts', () => {
  const css = readFileSync(resolve(docs, 'pages/components/globe-page.css'), 'utf8');
  const { globes } = render();
  assert.ok(css.includes('min-width: 0'));
  assert.ok(css.includes('minmax(0, 1fr)'));
  assert.ok(css.includes('@media (max-width: 400px)'));
  assert.ok(css.includes("data-palette='transparent'"));
  assert.ok(!/#[\da-f]{3,8}\b/i.test(css), 'demo CSS colors should consume tokens');
  assert.equal(globes[0].style['--zuvi-globe-bg'], 'transparent');
  for (const [key, value] of Object.entries(globes[0].style)) {
    if (key.endsWith('-color')) assert.ok(value.includes('var(--zuvi-'), key);
  }
  for (const category of globes[0].categories) {
    assert.ok(category.color.includes('var(--zuvi-'), category.id);
  }
});

test('Globe demo retains hidden selection, separates search and repeats independent focus requests', async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/' });
  const previous = new Map();
  for (const [key, value] of Object.entries({
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    IS_REACT_ACT_ENVIRONMENT: true,
  })) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const { createRoot } = require('react-dom/client');
  const root = createRoot(dom.window.document.getElementById('root'));
  const latest = () =>
    globeCalls.filter((props) => props.labels.label === '全球城市网络地球').at(-1);
  try {
    await React.act(() => root.render(React.createElement(GlobePage)));
    const initial = latest();
    assert.equal(globeCalls.filter((props) => props.labels.label === '密集城市网络地球').length, 0);
    await React.act(() => initial.onHiddenCategoriesChange(['east-asia']));
    assert.equal(latest().value, 'shanghai', 'filtering must not clear the selected id');
    assert.deepEqual(latest().hiddenCategories, ['east-asia']);
    assert.equal(latest().points.length, 8, 'the core gets complete data and owns filtering');
    assert.equal(latest().arcs.length, 9);
    assert.equal(dom.window.document.querySelector('[data-globe-neighbor-id="tokyo"]'), null);
    assert.ok(
      dom.window.document.querySelector('[data-globe-visible-counts]').textContent.includes('6 / 8')
    );
    await React.act(() => latest().onSearchValueChange('Tokyo'));
    assert.equal(latest().searchValue, 'Tokyo');
    assert.equal(latest().value, 'shanghai');
    assert.deepEqual(latest().points, initial.points, 'search does not replace map points');
    assert.deepEqual(latest().arcs, initial.arcs, 'search does not replace routes');
    await React.act(() => latest().onHiddenCategoriesChange([]));
    const neighbor = dom.window.document.querySelector('[data-globe-neighbor-id="tokyo"]');
    assert.ok(neighbor);
    await React.act(() => neighbor.click());
    assert.equal(latest().value, 'shanghai');
    assert.equal(latest().focus.pointId, 'tokyo');
    const firstKey = latest().focus.key;
    await React.act(() => neighbor.click());
    assert.equal(latest().focus.pointId, 'tokyo');
    assert.ok(latest().focus.key > firstKey, 'same-point focus receives a fresh request key');
    await React.act(() =>
      dom.window.document.querySelector('[data-globe-select-route-id="shanghai-singapore"]').click()
    );
    assert.equal(latest().arcValue, 'shanghai-singapore');
    assert.equal(latest().value, 'shanghai');

    const denseToggle = [...dom.window.document.querySelectorAll('button')].find(
      (button) => button.textContent === '展开 60 城市网络'
    );
    globeCalls.length = 0;
    await React.act(() => denseToggle.click());
    const dense = globeCalls.find((props) => props.labels.label === '密集城市网络地球');
    assert.ok(dense);
    assert.equal(dense.points.length, 60);
    assert.equal(dense.arcs.length, 60);
    assert.equal(dense.renderMode, '2d');
    assert.equal(dense.autoRotate, false);
    assert.equal(dense.animateArcs, false);
    assert.equal(dense.pointLabels, 'auto');
    assert.equal(dense.maxLabels, 12);
    assert.equal(dense.searchable, true);
    assert.equal(dense.categories.length, 8);
    assert.equal(new Set(dense.points.map((point) => point.id)).size, 60);
    for (const point of dense.points) {
      assert.ok(point.name.includes(' '), 'fixture uses real bilingual city names');
      assert.ok(point.latitude >= -90 && point.latitude <= 90);
      assert.ok(point.longitude >= -180 && point.longitude <= 180);
      assert.equal(point.value, 2);
    }
    for (const arc of dense.arcs) {
      assert.ok(dense.points.some((point) => point.id === arc.from));
      assert.ok(dense.points.some((point) => point.id === arc.to));
      assert.notEqual(arc.from, arc.to);
    }
    globeCalls.length = 0;
    await React.act(() => denseToggle.click());
    assert.equal(globeCalls.filter((props) => props.labels.label === '密集城市网络地球').length, 0);
    assert.equal(dom.window.document.querySelector('[data-globe-demo="dense"]'), null);
  } finally {
    await React.act(() => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});
