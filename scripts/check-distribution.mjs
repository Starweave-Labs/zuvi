import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, URL } from 'node:url';

const require = createRequire(import.meta.url);
const requireUi = createRequire(new URL('../packages/ui/package.json', import.meta.url));
const { rollup } = createRequire(requireUi.resolve('vite'))('rollup');
const uiEntry = fileURLToPath(new URL('../packages/ui/dist/index.js', import.meta.url));
for (const component of ['Button', 'Chart']) {
  const bundle = await rollup({
    input: 'zuvi-distribution-probe',
    external: (id) =>
      !id.startsWith('.') && !id.startsWith('/') && id !== 'zuvi-distribution-probe',
    plugins: [
      {
        name: 'zuvi-distribution-probe',
        resolveId: (id) => (id === 'zuvi-distribution-probe' ? id : null),
        load: (id) =>
          id === 'zuvi-distribution-probe'
            ? `export { ${component} } from ${JSON.stringify(uiEntry)};`
            : null,
      },
    ],
    onwarn(warning) {
      // Rollup is not an RSC host; the package's preserved client directive is
      // verified below before consumers intentionally flatten it for the browser.
      if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.message.includes('use client'))
        return;
      assert.fail(`Consumer tree-shaking warning: ${warning.code}: ${warning.message}`);
    },
  });
  try {
    const { output } = await bundle.generate({ format: 'es' });
    const chunks = output.filter((item) => item.type === 'chunk');
    const modules = chunks.flatMap((chunk) => Object.keys(chunk.modules));
    assert.ok(
      !modules.some((file) =>
        /(?:Studio(?:Word|Sheet|Pdf|FontControl)|GlobeScene|globe-renderer)-/.test(file)
      ),
      `${component} consumer excludes unrelated lazy implementations`
    );
    assert.equal(
      modules.some((file) => /ChartView-/.test(file)),
      component === 'Chart',
      `${component} retains only its own plotting implementation`
    );
    assert.ok(
      chunks.some((chunk) => chunk.code.includes('@__PURE__')),
      `${component} retains consumer PURE annotations`
    );
    for (const chunk of chunks) {
      assert.doesNotMatch(
        chunk.code,
        /React\.lazy\(.*Studio(?:Word|Sheet|Pdf)/,
        'unused Office loaders stay tree-shaken'
      );
    }
    console.log(`${component}: consumer tree-shaking passed (${chunks.length} chunks)`);
  } finally {
    await bundle.close();
  }
}
for (const name of ['icons', 'i18n', 'blocks', 'ui']) {
  const entry = new URL(`../packages/${name}/dist/index.js`, import.meta.url);
  const module = await import(entry);
  assert.ok(Object.keys(module).length > 0, `${name} exposes exports`);
  assert.match(
    fs.readFileSync(entry, 'utf8'),
    /^['"]use client['"];?/,
    `${name} preserves its client boundary`
  );
  console.log(`${name}: ESM import and client boundary passed`);
}
const ui = await import(new URL('../packages/ui/dist/index.js', import.meta.url));
const uiCommonJs = require('../packages/ui/dist/index.cjs');
for (const name of [
  'Button',
  'Chart',
  'Globe',
  'OfficeEditor',
  'OfficeStudio',
  'createOfficeStudioDocument',
  'isOfficeStudioDocument',
]) {
  assert.equal(typeof ui[name], 'function', `react ESM exports ${name}`);
  assert.equal(typeof uiCommonJs[name], 'function', `react CommonJS exports ${name}`);
}
assert.equal(ui.createOfficeStudioDocument('word').kind, 'word');
assert.equal(ui.isOfficeStudioDocument(ui.createOfficeStudioDocument('excel')), true);
assert.match(
  fs.readFileSync(new URL('../packages/ui/dist/index.cjs', import.meta.url), 'utf8'),
  /['"]use client['"]/
);
for (const name of ['tokens', 'icons', 'i18n', 'ui', 'blocks', 'cli', 'mcp']) {
  const cwd = new URL(`../packages/${name}/`, import.meta.url);
  const [pack] = JSON.parse(
    execFileSync('npm', ['pack', '--dry-run', '--json'], { cwd, encoding: 'utf8' })
  );
  const files = pack.files.map((file) => file.path);
  assert.ok(
    files.some((file) => file.startsWith('dist/')),
    `${name} ships dist`
  );
  assert.ok(files.includes('README.md'), `${name} ships README`);
  assert.ok(files.includes('LICENSE'), `${name} ships LICENSE`);
  assert.ok(
    !files.some((file) => /(?:\.test\.|\.stories\.|node_modules\/)/.test(file)),
    `${name} excludes tests and dependencies`
  );
  if (name === 'cli' || name === 'mcp')
    assert.ok(files.includes('data/registry/registry.json'), `${name} ships the registry`);
  if (name === 'ui') {
    const manifest = JSON.parse(fs.readFileSync(new URL('package.json', cwd), 'utf8'));
    const globe = manifest.exports['./globe'];
    assert.ok(globe, 'react declares the Globe subpath');
    assert.equal((await import(new URL(globe.import, cwd))).Globe, ui.Globe);
    assert.equal(require(fileURLToPath(new URL(globe.require, cwd))).Globe, uiCommonJs.Globe);
    const declarations = fs.readFileSync(new URL(globe.types, cwd), 'utf8');
    for (const type of [
      'GlobeProps',
      'GlobePoint',
      'GlobeArc',
      'GlobeView',
      'GlobeViewChangeReason',
      'GlobeStatus',
      'GlobeRenderMode',
      'GlobeError',
      'GlobeLabels',
    ]) {
      assert.match(declarations, new RegExp(`\\b${type}\\b`), `react declares ${type}`);
    }
    const chart = manifest.exports['./chart'];
    assert.ok(chart, 'react declares the Chart subpath');
    assert.equal((await import(new URL(chart.import, cwd))).Chart, ui.Chart);
    assert.equal(require(fileURLToPath(new URL(chart.require, cwd))).Chart, uiCommonJs.Chart);
    const chartDeclarations = fs.readFileSync(new URL(chart.types, cwd), 'utf8');
    for (const type of [
      'ChartProps',
      'ChartBaseProps',
      'ChartCartesianProps',
      'ChartRadialProps',
      'ChartScatterProps',
      'ChartHeatmapProps',
      'ChartTreemapProps',
      'ChartFunnelProps',
      'ChartGaugeProps',
      'ChartWaterfallProps',
      'ChartHeatmapCell',
      'ChartWaterfallStep',
      'ChartSeries',
      'ChartSlice',
      'ChartScatterPoint',
      'ChartScatterSeries',
      'ChartDatum',
      'ChartError',
      'ChartLabels',
      'ChartStatus',
      'ChartType',
    ]) {
      assert.match(chartDeclarations, new RegExp(`\\b${type}\\b`), `react declares ${type}`);
    }
    assert.doesNotMatch(
      chartDeclarations,
      /export\s+.*\bChartViewProps\b/,
      'Chart View props remain internal'
    );
    const requireUi = createRequire(new URL('package.json', cwd));
    const React = requireUi('react');
    const { renderToStaticMarkup } = requireUi('react-dom/server');
    assert.match(
      renderToStaticMarkup(
        React.createElement(ui.Chart, {
          'aria-label': 'Distribution chart',
          categories: ['Sample'],
          series: [{ id: 'sample', name: 'Sample', values: [0] }],
        })
      ),
      /Distribution chart/,
      'Chart SSR renders without browser globals'
    );
    const exportTargets = (entry) =>
      typeof entry === 'string' ? [entry] : Object.values(entry).flatMap(exportTargets);
    for (const target of exportTargets(manifest.exports)) {
      assert.ok(files.includes(target.replace(/^\.\//, '')), `react ships export target ${target}`);
    }
    const modules = files.filter(
      (file) =>
        file.startsWith('dist/') && !file.startsWith('dist/browser/') && /\.(?:js|cjs)$/.test(file)
    );
    for (const file of modules) {
      const entry = new URL(file, cwd);
      const module = file.endsWith('.cjs') ? require(fileURLToPath(entry)) : await import(entry);
      assert.ok(Object.keys(module).length, `react lazy or shared module can load: ${file}`);
    }
    const styles = fs.readFileSync(new URL('dist/style.css', cwd), 'utf8');
    assert.match(styles, /\.zuvi-office-editor[\s,{[]/, 'react ships OfficeEditor styles');
    assert.match(styles, /\.zuvi-office-studio[\s,{[]/, 'react ships OfficeStudio styles');
    assert.match(styles, /\.zuvi-globe[\s,{[]/, 'react ships Globe styles');
    assert.match(styles, /\.zuvi-chart[\s,{[]/, 'react ships Chart styles');
    for (const file of ['zuvi.global.js', 'zuvi.css', 'LICENSE.txt']) {
      assert.ok(files.includes(`dist/browser/${file}`), `react ships browser ${file}`);
    }
    const browserNotices = fs.readFileSync(new URL('dist/browser/LICENSE.txt', cwd), 'utf8');
    for (const dependency of ['react', 'react-dom', '@tiptap/react', 'fast-formula-parser']) {
      assert.ok(
        browserNotices.includes(`${dependency}@`),
        `react browser ships ${dependency} license notices`
      );
    }
  }
  console.log(`${name}: npm pack passed (${files.length} files)`);
}
