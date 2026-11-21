import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { URL } from 'node:url';

const require = createRequire(new URL('../package.json', import.meta.url));
const ts = require('typescript');
const docs = new URL('../', import.meta.url);
const page = () => readFileSync(new URL('src/pages/components/DataGridPage.tsx', docs), 'utf8');
const nav = () => readFileSync(new URL('src/nav.ts', docs), 'utf8');

test('DataGrid docs page parses and uses only the public @zuvi/react API', () => {
  const source = page();
  const result = ts.transpileModule(source, {
    fileName: 'DataGridPage.tsx',
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
    0
  );
  assert.match(source, /usePageTitle\('DataGrid 数据网格'\)/);
  assert.match(source, /import \{ DataGrid[^\n]*from '@zuvi\/react';/);
  assert.doesNotMatch(source, /DataGridView|data-grid-model|data-grid-virtual/);
  assert.match(source, /makeRows\(10000\)/);
  assert.match(source, /rowHeight=\{40\}/);
  assert.match(source, /isRowSelectable=/);
  assert.match(source, /onSelectedKeysChange=/);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML|\beval\s*\(|\bnew Function\b|fetch\s*\(/);
});

test('DataGrid is registered in the docs navigation with the data group', () => {
  const source = nav();
  assert.match(
    source,
    /const DataGridPage = lazy\(\(\) => import\('\.\/pages\/components\/DataGridPage'\)\);/
  );
  assert.match(
    source,
    /\{ title: 'DataGrid 数据网格', path: '\/components\/data-grid', group: 'data' \}/
  );
  assert.match(source, /'\/components\/data-grid': DataGridPage,/);
});

test('DataGrid component metadata stays in sync with the documented props', () => {
  const meta = JSON.parse(
    readFileSync(
      new URL('../../packages/ui/src/components/DataGrid/meta.json', import.meta.url),
      'utf8'
    )
  );
  const source = page();
  for (const name of [
    'columns',
    'rows',
    'rowKey',
    'height',
    'rowHeight',
    'sort',
    'selectedKeys',
    'isRowSelectable',
    'labels',
    'classNames',
    'columnWidths',
  ]) {
    assert.ok(meta.props[name], `meta.json 缺少 ${name}`);
  }
  assert.equal(meta.related.join(','), 'Table,VirtualTable');
  assert.ok(source.includes("dir: 'asc' | 'desc'"), '文档必须说明与 Table 排序词表的差异');
});
