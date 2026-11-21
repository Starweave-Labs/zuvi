import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { parseArgs } from 'node:util';
import { officeRuleConsumerLines } from './office-consumer-fixture.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const { values } = parseArgs({
  options: { local: { type: 'boolean', default: false }, dir: { type: 'string' } },
});
const directory = path.resolve(root, values.dir || '.release/github-packages');
const release = JSON.parse(fs.readFileSync(path.join(directory, 'github-packages.json'), 'utf8'));
const owner = release.repository.split('/')[0].toLowerCase();
const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'zuvi-github-consumer-'));
let server;
try {
  let registry = 'https://npm.pkg.github.com/';
  if (values.local) {
    const packages = new Map(
      release.packages.map((entry) => {
        const tarball = path.resolve(directory, entry.filename);
        assert.equal(path.dirname(tarball), directory);
        const manifest = JSON.parse(
          execFileSync('tar', ['-xOf', tarball, 'package/package.json'], { encoding: 'utf8' })
        );
        return [entry.name, { ...entry, manifest, tarball }];
      })
    );
    server = http.createServer((request, response) => {
      const requested = decodeURIComponent(request.url.split('?')[0]).slice(1);
      if (requested.startsWith('tarballs/')) {
        const entry = [...packages.values()].find(
          ({ filename }) => requested === 'tarballs/' + filename
        );
        if (entry) {
          response.setHeader('content-type', 'application/octet-stream');
          response.end(fs.readFileSync(entry.tarball));
          return;
        }
      }
      const entry = packages.get(requested);
      if (entry) {
        response.setHeader('content-type', 'application/json');
        response.end(
          JSON.stringify({
            name: entry.name,
            'dist-tags': { latest: entry.version },
            versions: {
              [entry.version]: {
                ...entry.manifest,
                dist: {
                  tarball: registry + 'tarballs/' + entry.filename,
                  integrity: entry.integrity,
                  shasum: entry.shasum,
                },
              },
            },
          })
        );
        return;
      }
      response.writeHead(404);
      response.end(JSON.stringify({ error: 'Package not found' }));
    });
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    registry = 'http://127.0.0.1:' + server.address().port + '/';
  }
  const dependencies = Object.fromEntries(
    release.packages.map((entry) => [entry.sourceName, 'npm:' + entry.name + '@' + entry.version])
  );
  Object.assign(dependencies, {
    react: '19.0.0',
    'react-dom': '19.0.0',
    '@types/react': '^19.0.0',
    '@types/react-dom': '^19.0.0',
    '@types/three': '^0.187.0',
  });
  fs.writeFileSync(
    path.join(cwd, 'package.json'),
    JSON.stringify({ private: true, type: 'module', dependencies })
  );
  let npmrc = 'registry=https://registry.npmjs.org/\n@' + owner + ':registry=' + registry + '\n';
  if (!values.local) npmrc += '//npm.pkg.github.com/:_authToken=' + '$' + '{NODE_AUTH_TOKEN}\n';
  fs.writeFileSync(path.join(cwd, '.npmrc'), npmrc);
  await new Promise((resolve, reject) => {
    const child = spawn(
      'npm',
      ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--package-lock=false'],
      {
        cwd,
        env: { ...process.env, npm_config_cache: path.join(cwd, '.cache') },
        stdio: 'inherit',
      }
    );
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error('Consumer install exited ' + code))
    );
  });
  const installed = [];
  for (const entry of release.packages) {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(cwd, 'node_modules', entry.sourceName, 'package.json'), 'utf8')
    );
    assert.equal(manifest.name, entry.name);
    assert.equal(manifest.version, entry.version);
    if (!values.local) {
      const integrity = JSON.parse(
        execFileSync(
          'npm',
          ['view', entry.name + '@' + entry.version, 'dist.integrity', '--json'],
          {
            cwd,
            encoding: 'utf8',
            env: { ...process.env, npm_config_cache: path.join(cwd, '.cache') },
          }
        )
      );
      assert.equal(
        integrity,
        entry.integrity,
        entry.name + ' registry integrity differs from release tarball'
      );
    }
    installed.push({
      sourceName: entry.sourceName,
      name: manifest.name,
      version: manifest.version,
    });
  }
  fs.writeFileSync(
    path.join(cwd, 'check.mjs'),
    [
      "import assert from 'node:assert/strict';",
      "import { createRequire } from 'node:module';",
      "import React from 'react';",
      "import { renderToStaticMarkup } from 'react-dom/server';",
      "import { Button, Chart, Globe, OfficeEditor, OfficeStudio, createOfficeStudioDocument } from '@zuvi/react';",
      'const require = createRequire(import.meta.url);',
      "for (const name of ['tokens', 'icons', 'i18n', 'react', 'blocks']) assert.ok(Object.keys(await import('@zuvi/' + name)).length);",
      "assert.equal(typeof require('@zuvi/react').Button, 'function');",
      "assert.equal(typeof OfficeEditor, 'function');",
      "assert.equal(typeof OfficeStudio, 'function');",
      "assert.equal(typeof Chart, 'function');",
      "assert.equal((await import('@zuvi/react/chart')).Chart, Chart);",
      "assert.equal(require('@zuvi/react/chart').Chart, require('@zuvi/react').Chart);",
      "assert.match(renderToStaticMarkup(React.createElement(Chart, { 'aria-label': 'Installed chart', categories: ['Sample'], series: [{ id: 'sample', name: 'Sample', values: [0] }] })), /Installed chart/);",
      "assert.equal(typeof Globe, 'function');",
      "assert.equal((await import('@zuvi/react/globe')).Globe, Globe);",
      "assert.equal(require('@zuvi/react/globe').Globe, require('@zuvi/react').Globe);",
      "assert.match(renderToStaticMarkup(React.createElement(Globe, { 'aria-label': 'Installed globe', renderMode: '2d' })), /Installed globe/);",
      "assert.equal(require('@zuvi/react/office-editor').OfficeEditor, require('@zuvi/react').OfficeEditor);",
      "assert.equal(require('@zuvi/react/office-studio').OfficeStudio, require('@zuvi/react').OfficeStudio);",
      "assert.equal(createOfficeStudioDocument('word').kind, 'word');",
      "assert.match(renderToStaticMarkup(React.createElement(Button, null, 'Installed ZUVI')), /Installed ZUVI/);",
      "require.resolve('@zuvi/react/styles.css');",
      "require.resolve('@zuvi/tokens/css');",
      "console.log('Installed ESM, CommonJS, React 19 SSR, CSS and dependency aliases passed');",
    ].join('\n')
  );
  execFileSync(process.execPath, ['check.mjs'], { cwd, stdio: 'inherit' });
  const cli = execFileSync(
    process.execPath,
    [path.join(cwd, 'node_modules/@zuvi/cli/dist/index.js'), 'list'],
    { cwd, encoding: 'utf8' }
  );
  for (const name of [
    'button',
    'splitter',
    'chart',
    'globe',
    'office-editor',
    'office-studio',
    'kanban',
  ])
    assert.ok(cli.includes(name), 'Installed CLI finds ' + name);
  const requests = [
    { jsonrpc: '2.0', id: 1, method: 'initialize' },
    { jsonrpc: '2.0', id: 2, method: 'tools/list' },
  ];
  const mcp = execFileSync(
    process.execPath,
    [path.join(cwd, 'node_modules/@zuvi/mcp/dist/index.js')],
    {
      cwd,
      encoding: 'utf8',
      input: requests.map((request) => JSON.stringify(request)).join('\n') + '\n',
    }
  )
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
  assert.equal(mcp[0].result.serverInfo.version, release.version);
  assert.equal(mcp[1].result.tools.length, 3);
  fs.writeFileSync(
    path.join(cwd, 'consumer.tsx'),
    [
      "import { Button, Globe as RootGlobe, type GlobeProps } from '@zuvi/react';",
      "import { Globe, type GlobePoint, type GlobeArc, type GlobeView, type GlobeLabels, type GlobeError, type GlobeStatus, type GlobeRenderMode, type GlobeViewChangeReason } from '@zuvi/react/globe';",
      "import { OfficeStudio, createOfficeStudioDocument, type OfficeStudioHandle, type StudioPdfSearchResult, type StudioSheetChart, type StudioSheetStructureEdit } from '@zuvi/react/office-studio';",
      "import { OfficeEditor, type OfficeEditorConfig } from '@zuvi/react/office-editor';",
      "import { DashboardBlock } from '@zuvi/blocks';",
      "import { tokens } from '@zuvi/tokens';",
      "import { Search } from '@zuvi/icons';",
      "import { useAutoTranslate } from '@zuvi/i18n';",
      "export const example = <><Button variant='primary'>发布检查</Button><DashboardBlock /><Search /></>;",
      'export const api = { tokens, useAutoTranslate };',
      "const points: readonly GlobePoint[] = [{ id: 'sample', name: 'Synthetic sample', latitude: 35, longitude: 105 }];",
      'const arcs: readonly GlobeArc[] = [];',
      'const view: GlobeView = { latitude: 35, longitude: 105, zoom: 1 };',
      "const globeProps: GlobeProps = { points, arcs, view, labels: { label: 'Sample locations' } };",
      'export function GlobeExample() { return <><RootGlobe {...globeProps} /><Globe {...globeProps} renderMode="2d" /></>; }',
      'export type GlobePublicTypes = { labels: GlobeLabels; error: GlobeError; status: GlobeStatus; mode: GlobeRenderMode; reason: GlobeViewChangeReason };',
      "import { Chart as RootChart, type ChartProps } from '@zuvi/react';",
      "import { Chart, type ChartBaseProps, type ChartCartesianProps, type ChartRadialProps, type ChartScatterProps, type ChartSeries, type ChartSlice, type ChartScatterPoint, type ChartScatterSeries, type ChartDatum, type ChartLabels, type ChartError, type ChartStatus, type ChartType } from '@zuvi/react/chart';",
      "import { createRef } from 'react';",
      "const series: readonly ChartSeries[] = [{ id: 'sample', name: 'Sample', values: [0, null] }];",
      "const data: readonly ChartSlice[] = [{ id: 'sample', label: 'Sample', value: 0 }];",
      "const scatterPoints: readonly ChartScatterPoint[] = [{ id: 'p', x: -1.5, y: 2.25 }];",
      "const scatterSeries: readonly ChartScatterSeries[] = [{ id: 'sample', name: 'Sample', points: scatterPoints }];",
      'const chartBase: ChartBaseProps = { ref: createRef<HTMLDivElement>(), value: null, hiddenSeries: [], onChange: (id) => { void id; }, onHiddenSeriesChange: (ids) => { void ids; }, onDataClick: (datum, event) => { void datum.value; void event.type; } };',
      "const cartesian: ChartCartesianProps = { ...chartBase, type: 'line', categories: ['A', 'B'], series };",
      "const radial: ChartRadialProps = { ...chartBase, type: 'pie', data };",
      "const scatter: ChartScatterProps = { ...chartBase, type: 'scatter', series: scatterSeries };",
      'const chartProps: ChartProps = cartesian;',
      'export function ChartExample() { return <><RootChart {...chartProps} /><Chart {...cartesian} type="area" /><Chart {...cartesian} type="bar" /><Chart {...radial} /><Chart {...radial} type="donut" /><Chart {...scatter} /></>; }',
      'export type ChartPublicTypes = { datum: ChartDatum; labels: ChartLabels; error: ChartError; status: ChartStatus; type: ChartType };',
      '// @ts-expect-error radial charts do not accept categories',
      "const invalidChart: ChartProps = { type: 'pie', data, categories: ['A'] };",
      'void invalidChart;',
      'export function OfficeExample({ config, documentServerUrl }: { config: OfficeEditorConfig; documentServerUrl: string }) {',
      "  return <><OfficeEditor config={config} documentServerUrl={documentServerUrl} /><OfficeStudio defaultValue={createOfficeStudioDocument('word')} onPrint={async (document) => { void document; }} /></>;",
      '}',
      'export function printStudio(handle: OfficeStudioHandle) { return handle.print(); }',
      'export type OfficeSearchHit = StudioPdfSearchResult;',
      'export type OfficeChart = StudioSheetChart;',
      'export type OfficeStructureEdit = StudioSheetStructureEdit;',
      ...officeRuleConsumerLines(),
    ].join('\n')
  );
  fs.writeFileSync(
    path.join(cwd, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'ES2022',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        lib: ['ES2022', 'DOM', 'DOM.Iterable'],
        jsx: 'react-jsx',
        strict: true,
        noEmit: true,
      },
      include: ['consumer.tsx'],
    })
  );
  execFileSync(
    process.execPath,
    [path.join(root, 'node_modules/typescript/bin/tsc'), '-p', path.join(cwd, 'tsconfig.json')],
    { stdio: 'inherit' }
  );
  execFileSync(
    process.execPath,
    [
      path.join(cwd, 'node_modules/@zuvi/cli/dist/index.js'),
      'add',
      'office-studio',
      'globe',
      'chart',
    ],
    { cwd, stdio: 'inherit' }
  );
  const repeatedGlobe = execFileSync(
    process.execPath,
    [path.join(cwd, 'node_modules/@zuvi/cli/dist/index.js'), 'add', 'globe'],
    { cwd, encoding: 'utf8' }
  );
  assert.match(repeatedGlobe, /skipped/);
  assert.doesNotMatch(repeatedGlobe, /^\s*(?:created|updated)\s/m, 'Globe add is idempotent');
  const globeDiff = execFileSync(
    process.execPath,
    [path.join(cwd, 'node_modules/@zuvi/cli/dist/index.js'), 'diff', 'globe'],
    { cwd, encoding: 'utf8' }
  );
  assert.doesNotMatch(globeDiff, /^--- /m, 'Globe diff stays unchanged');
  const repeatedChart = execFileSync(
    process.execPath,
    [path.join(cwd, 'node_modules/@zuvi/cli/dist/index.js'), 'add', 'chart'],
    { cwd, encoding: 'utf8' }
  );
  assert.match(repeatedChart, /skipped/);
  assert.doesNotMatch(repeatedChart, /^\s*(?:created|updated)\s/m, 'Chart add is idempotent');
  const chartDiff = execFileSync(
    process.execPath,
    [path.join(cwd, 'node_modules/@zuvi/cli/dist/index.js'), 'diff', 'chart'],
    { cwd, encoding: 'utf8' }
  );
  assert.doesNotMatch(chartDiff, /^--- /m, 'Chart diff stays unchanged');
  fs.writeFileSync(path.join(cwd, 'src/styles.d.ts'), "declare module '*.css';\n");
  fs.writeFileSync(
    path.join(cwd, 'tsconfig-cli.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'Bundler',
        lib: ['ES2022', 'DOM', 'DOM.Iterable'],
        jsx: 'react-jsx',
        strict: true,
        skipLibCheck: true,
        noEmit: true,
      },
      include: ['src'],
    })
  );
  execFileSync(
    process.execPath,
    [path.join(root, 'node_modules/typescript/bin/tsc'), '-p', path.join(cwd, 'tsconfig-cli.json')],
    { stdio: 'inherit' }
  );
  fs.writeFileSync(
    path.join(directory, values.local ? 'consumer-local.json' : 'consumer-registry.json'),
    JSON.stringify(
      {
        version: release.version,
        registry: values.local ? 'local tarballs through npm aliases' : registry,
        packages: installed,
        checks: [
          'ESM',
          'CommonJS',
          'React 19 SSR',
          'CSS exports',
          'CLI registry',
          'MCP stdio',
          'strict TypeScript declarations',
          'Office component subpaths and public APIs',
          'Globe root/subpath exports, public types and SSR-safe import',
          'Public Excel conditional formatting and validation types; internal runtimes remain private',
          'Installed CLI OfficeStudio, Globe and Chart source compilation',
          'Globe CLI add idempotence and unchanged diff',
          'Chart root/subpath exports, public types, six data families and SSR-safe import',
          'Chart CLI add idempotence and unchanged diff',
        ],
      },
      null,
      2
    ) + '\n'
  );
  console.log(
    'GitHub Packages consumer passed: ' + installed.length + ' packages at ' + release.version
  );
} finally {
  if (server) await new Promise((resolve) => server.close(resolve));
  fs.rmSync(cwd, { recursive: true, force: true });
}
