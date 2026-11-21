import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { createContext } from '../packages/cli/dist/index.js';
import { add } from '../packages/cli/dist/commands/add.js';
import { diff } from '../packages/cli/dist/commands/diff.js';
import { loadCatalog } from '../packages/mcp/dist/tools/search.js';
import { generateCode } from '../packages/mcp/dist/tools/generate.js';
import { officeRuleConsumerLines } from './office-consumer-fixture.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRegistry = JSON.parse(
  fs.readFileSync(path.join(root, 'registry/registry.json'), 'utf8')
);
const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'zuvi-consumer-'));
try {
  const ctx = createContext({ cwd, log: () => {} });
  assert.deepEqual(
    ctx.registry,
    sourceRegistry,
    'CLI bundled registry is stale; rebuild @zuvi/cli'
  );
  const sourceFiles = new Set([
    ...sourceRegistry.sharedFiles,
    ...sourceRegistry.items.flatMap((item) => [...item.files, item.meta]),
  ]);
  for (const file of sourceFiles) {
    assert.deepEqual(
      fs.readFileSync(path.join(ctx.registryRoot, file)),
      fs.readFileSync(path.join(root, file)),
      `CLI bundled source is stale: ${file}; rebuild @zuvi/cli`
    );
  }
  const added = await add({ ctx, names: [], all: true });
  assert.deepEqual(added.warnings, []);
  assert.equal(added.items.length, sourceRegistry.items.length);
  const repeatedGlobe = await add({ ctx, names: ['globe'] });
  assert.ok(
    repeatedGlobe.written.every((file) => file.status === 'skipped'),
    'Globe add is idempotent'
  );
  const repeatedChart = await add({ ctx, names: ['chart'] });
  assert.ok(
    repeatedChart.written.every((file) => file.status === 'skipped'),
    'Chart add is idempotent'
  );
  const repeatedDataGrid = await add({ ctx, names: ['data-grid'] });
  assert.ok(
    repeatedDataGrid.written.every((file) => file.status === 'skipped'),
    'DataGrid add is idempotent'
  );
  const compared = await diff({ ctx, names: ctx.allItems().map((item) => item.name) });
  assert.ok(compared.files.every((file) => file.state === 'same'));

  const examples = path.join(cwd, 'src/examples');
  fs.mkdirSync(examples, { recursive: true });
  const catalog = loadCatalog();
  assert.deepEqual(
    [...catalog.values()],
    [...loadCatalog(root).values()],
    'MCP bundled component metadata is stale; rebuild @zuvi/mcp'
  );
  assert.equal(
    catalog.size,
    sourceRegistry.items.filter((item) => item.type === 'registry:component').length
  );
  for (const entry of catalog.values()) {
    const result = generateCode(catalog, entry.name);
    assert.equal(result.ok, true);
    fs.writeFileSync(path.join(examples, `${entry.name}.tsx`), result.code);
  }
  fs.writeFileSync(
    path.join(examples, 'office-subpaths.tsx'),
    [
      "import { OfficeStudio, createOfficeStudioDocument, type OfficeStudioHandle, type StudioPdfSearchResult, type StudioSheetChart, type StudioSheetStructureEdit } from '@zuvi/react/office-studio';",
      "import { OfficeEditor, type OfficeEditorConfig } from '@zuvi/react/office-editor';",
      'export function OfficeSubpathsExample({ config, documentServerUrl }: { config: OfficeEditorConfig; documentServerUrl: string }) {',
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
    path.join(examples, 'globe-subpath.tsx'),
    [
      "import { Globe as RootGlobe, type GlobeProps } from '@zuvi/react';",
      "import { Globe, type GlobePoint, type GlobeArc, type GlobeView, type GlobeLabels, type GlobeError, type GlobeStatus, type GlobeRenderMode, type GlobeViewChangeReason } from '@zuvi/react/globe';",
      "const points: readonly GlobePoint[] = [{ id: 'sample', name: 'Synthetic sample', latitude: 35, longitude: 105 }];",
      'const arcs: readonly GlobeArc[] = [];',
      'const view: GlobeView = { latitude: 35, longitude: 105, zoom: 1 };',
      "const props: GlobeProps = { points, arcs, view, labels: { label: 'Sample locations' } };",
      'export function GlobeSubpathExample() { return <><RootGlobe {...props} /><Globe {...props} renderMode="2d" /></>; }',
      'export type GlobePublicTypes = { labels: GlobeLabels; error: GlobeError; status: GlobeStatus; mode: GlobeRenderMode; reason: GlobeViewChangeReason };',
    ].join('\n')
  );
  const chartForms = [
    ...[
      'line',
      'area',
      'bar',
      'pie',
      'donut',
      'scatter',
      'radar',
      'heatmap',
      'treemap',
      'funnel',
      'gauge',
      'waterfall',
      'sparkline',
    ].map((type) => ({ name: type, props: { type } })),
    { name: 'stacked-area', props: { type: 'area', stack: true } },
    { name: 'stacked-bar', props: { type: 'bar', stack: true } },
    { name: 'horizontal-bar', props: { type: 'bar', orientation: 'horizontal' } },
    { name: 'bubble', props: { type: 'scatter', bubble: true, bubbleDomain: [0, 100] } },
  ];
  for (const form of chartForms) {
    const result = generateCode(catalog, 'Chart', form.props);
    assert.equal(result.ok, true);
    fs.writeFileSync(path.join(examples, `chart-${form.name}.tsx`), result.code);
  }
  fs.writeFileSync(
    path.join(examples, 'data-grid-subpath.tsx'),
    [
      "import { DataGrid as RootDataGrid, type DataGridProps } from '@zuvi/react';",
      "import { DataGrid, type DataGridColumn, type DataGridLabels, type DataGridError, type DataGridStatus, type DataGridSortState, type DataGridSelectionReason } from '@zuvi/react/data-grid';",
      'interface SampleRow { id: string; name: string; amount: number }',
      "const rows: readonly SampleRow[] = [{ id: 'row-1', name: 'Sample row', amount: 120 }];",
      "const columns: readonly DataGridColumn<SampleRow>[] = [{ key: 'name', dataIndex: 'name', header: 'Name', textValue: 'Name', sortable: true, width: 200 }];",
      "const props: DataGridProps<SampleRow> = { columns, rows, height: 320, labels: { selectAll: 'Select all' } };",
      'const onSort = (sort: DataGridSortState | null) => { void sort; };',
      'const onSelect = (keys: string[], reason: DataGridSelectionReason) => { void keys; void reason; };',
      'export function DataGridSubpathExample() {',
      '  return <><RootDataGrid {...props} /><DataGrid {...props} sort={null} onSortChange={onSort} selectedKeys={[]} onSelectedKeysChange={onSelect} /></>;',
      '}',
      'export type DataGridPublicTypes = { labels: DataGridLabels; error: DataGridError; status: DataGridStatus };',
      '// @ts-expect-error DataGrid requires columns; an empty grid is a contract error, not an empty view',
      'const invalidEmpty: DataGridProps<SampleRow> = { rows };',
      'void invalidEmpty;',
      '// @ts-expect-error DataGridColumn requires header; a headerless column is a contract error',
      "const invalidColumn: DataGridColumn<SampleRow> = { key: 'broken' };",
      'void invalidColumn;',
    ].join('\n')
  );
  fs.writeFileSync(
    path.join(examples, 'chart-subpath.tsx'),
    [
      "import { Chart as RootChart, type ChartProps } from '@zuvi/react';",
      "import { Chart, type ChartBaseProps, type ChartCartesianProps, type ChartRadialProps, type ChartScatterProps, type ChartHeatmapProps, type ChartTreemapProps, type ChartFunnelProps, type ChartGaugeProps, type ChartWaterfallProps, type ChartHeatmapCell, type ChartWaterfallStep, type ChartSeries, type ChartSlice, type ChartScatterPoint, type ChartScatterSeries, type ChartDatum, type ChartLabels, type ChartError, type ChartStatus, type ChartType } from '@zuvi/react/chart';",
      "import { createRef } from 'react';",
      "const series: readonly ChartSeries[] = [{ id: 'sample', name: 'Sample', values: [0, null] }];",
      "const data: readonly ChartSlice[] = [{ id: 'sample', label: 'Sample', value: 0 }];",
      "const points: readonly ChartScatterPoint[] = [{ id: 'p', x: -1.5, y: 2.25 }];",
      "const scatterSeries: readonly ChartScatterSeries[] = [{ id: 'sample', name: 'Sample', points }];",
      'const ref = createRef<HTMLDivElement>();',
      'const onChange = (id: string | null) => { void id; };',
      "const base: ChartBaseProps = { ref, value: null, hiddenSeries: [], onChange, onHiddenSeriesChange: (ids) => { void ids; }, labels: { dataTable: 'Sample data' }, onDataClick: (datum, event) => { void datum.value; void event.type; } };",
      "const cartesian: ChartCartesianProps = { ...base, type: 'line', categories: ['A', 'B'], series };",
      "const radial: ChartRadialProps = { ...base, type: 'pie', data };",
      "const scatter: ChartScatterProps = { ...base, type: 'scatter', series: scatterSeries, bubble: true, bubbleDomain: [0, 100] };",
      "const cells: readonly ChartHeatmapCell[] = [{ id: 'cell', row: 'R', col: 'C', value: -3 }];",
      "const steps: readonly ChartWaterfallStep[] = [{ id: 'step', label: 'Change', value: -3 }];",
      "const heatmap: ChartHeatmapProps = { ...base, type: 'heatmap', data: cells };",
      "const treemap: ChartTreemapProps = { ...base, type: 'treemap', data };",
      "const funnel: ChartFunnelProps = { ...base, type: 'funnel', data };",
      "const gauge: ChartGaugeProps = { ...base, type: 'gauge', data, min: -10, max: 10 };",
      "const waterfall: ChartWaterfallProps = { ...base, type: 'waterfall', data: steps };",
      'const props: ChartProps = cartesian;',
      'export function ChartSubpathExample() { return <><RootChart {...props} /><Chart {...radial} /><Chart {...scatter} /><Chart {...heatmap} /><Chart {...treemap} /><Chart {...funnel} /><Chart {...gauge} /><Chart {...waterfall} /></>; }',
      'export type ChartPublicTypes = { base: ChartBaseProps; datum: ChartDatum; labels: ChartLabels; error: ChartError; status: ChartStatus; type: ChartType };',
      '// @ts-expect-error radial charts do not accept categories',
      "const invalidRadial: ChartProps = { type: 'pie', data, categories: ['A'] };",
      '// @ts-expect-error scatter charts require points, not category-aligned values',
      "const invalidScatter: ChartProps = { type: 'scatter', series };",
      '// @ts-expect-error Chart is not an imperative graphics-engine ref',
      'const invalidRef: ChartBaseProps = { ref: createRef<SVGSVGElement>() };',
      'void invalidRadial; void invalidScatter; void invalidRef;',
    ].join('\n')
  );
  fs.writeFileSync(path.join(cwd, 'src/styles.d.ts'), "declare module '*.css';\n");
  const workspacePackages = new Map([
    ['@zuvi/react', 'ui'],
    ['@zuvi/tokens', 'tokens'],
    ['@zuvi/icons', 'icons'],
    ['@zuvi/i18n', 'i18n'],
  ]);
  const dependencies = new Set([
    'react',
    'react-dom',
    '@types/react',
    '@types/react-dom',
    '@types/three',
    '@zuvi/react',
    ...added.dependencies,
  ]);
  for (const name of dependencies) {
    const folder = workspacePackages.get(name);
    const candidates = folder
      ? [path.join(root, 'packages', folder)]
      : ['packages/ui/node_modules', 'packages/i18n/node_modules', 'node_modules'].map((modules) =>
          path.join(root, modules, name)
        );
    const source = candidates.find((candidate) => fs.existsSync(candidate));
    assert.ok(source, `Declared consumer dependency is not installed: ${name}`);
    const destination = path.join(cwd, 'node_modules', name);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.symlinkSync(fs.realpathSync(source), destination, 'dir');
  }
  fs.writeFileSync(
    path.join(cwd, 'package.json'),
    JSON.stringify({ private: true, type: 'module' })
  );
  fs.writeFileSync(
    path.join(cwd, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'ES2022',
        lib: ['ES2022', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        moduleResolution: 'Bundler',
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
    [path.join(root, 'node_modules/typescript/bin/tsc'), '-p', path.join(cwd, 'tsconfig.json')],
    { stdio: 'inherit' }
  );
  console.log(
    `Consumer passed: ${added.items.length} registry items, ${added.written.length} files, ${catalog.size} MCP examples plus seventeen Chart forms and Office/Globe/Chart/DataGrid subpaths; bundled sources current, Globe/Chart/DataGrid add idempotent, diff unchanged`
  );
} finally {
  fs.rmSync(cwd, { recursive: true, force: true });
}
