import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath, URL } from 'node:url';
import process from 'node:process';
import ts from 'typescript';

const localeFile = fileURLToPath(
  new URL('../../../../packages/ui/src/config/locale.ts', import.meta.url)
);
const expected = JSON.parse(
  fs.readFileSync(new URL('./expected-locales.json', import.meta.url), 'utf8')
);
const names = Object.keys(expected);
const program = ts.createProgram([localeFile], {
  strict: true,
  noEmit: true,
  skipLibCheck: true,
  types: [],
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
});
const diagnostics = ts.getPreEmitDiagnostics(program);
assert.equal(
  diagnostics.length,
  0,
  ts.formatDiagnostics(diagnostics, {
    getCurrentDirectory: () => process.cwd(),
    getCanonicalFileName: (name) => name,
    getNewLine: () => '\n',
  })
);

const sourceExports = {};
const transpiled = ts.transpileModule(fs.readFileSync(localeFile, 'utf8'), {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS,
  },
}).outputText;
new Function('exports', transpiled)(sourceExports);
const esm = await import(new URL('../../../../packages/ui/dist/index.js', import.meta.url));
const commonJs = createRequire(import.meta.url)(
  fileURLToPath(new URL('../../../../packages/ui/dist/index.cjs', import.meta.url))
);

function verifyKeysAndDescriptors(actual, fixture) {
  assert.deepEqual(Object.keys(actual), Object.keys(fixture));
  assert.equal(Object.getPrototypeOf(actual), Object.getPrototypeOf(fixture));
  for (const key of Object.keys(fixture)) {
    const descriptor = Object.getOwnPropertyDescriptor(actual, key);
    assert.equal(descriptor.enumerable, true);
    assert.equal(descriptor.writable, true);
    assert.equal(descriptor.configurable, true);
    if (fixture[key] && typeof fixture[key] === 'object')
      verifyKeysAndDescriptors(actual[key], fixture[key]);
  }
}

for (const [label, exports] of Object.entries({ source: sourceExports, ESM: esm, CommonJS: commonJs })) {
  for (const name of names) {
    assert.deepEqual(exports[name], expected[name], `${label}: ${name} values`);
    verifyKeysAndDescriptors(exports[name], expected[name]);
    for (const other of names.filter((other) => other !== name)) {
      assert.notEqual(exports[name], exports[other]);
      for (const [section, value] of Object.entries(expected[name]))
        if (value && typeof value === 'object')
          assert.notEqual(exports[name][section], exports[other][section]);
      assert.notEqual(exports[name].date.weekdays, exports[other].date.weekdays);
    }
  }
  const loading = exports.zhCN.accessibility.loading;
  exports.zhCN.accessibility.loading = 'independence probe';
  assert.equal(exports.enUS.accessibility.loading, expected.enUS.accessibility.loading);
  exports.zhCN.accessibility.loading = loading;
  console.log(`${label}: 10 locales preserve all values, key order, descriptors, and independent objects`);
}

for (const name of names) {
  const base = sourceExports[name];
  assert.equal(sourceExports.mergeLocale(base), base);
  const override = {
    code: 'test',
    accessibility: { loading: 'test loading' },
    globe: { label: 'test globe' },
    date: { weekdays: ['a', 'b'] },
  };
  const merged = sourceExports.mergeLocale(base, override);
  assert.equal(merged.code, 'test');
  assert.deepEqual(merged.accessibility, { ...expected[name].accessibility, loading: 'test loading' });
  assert.deepEqual(merged.globe, { ...expected[name].globe, label: 'test globe' });
  assert.notEqual(merged.date.weekdays, override.date.weekdays);
  assert.notEqual(merged.date.weekdays, base.date.weekdays);
  assert.deepEqual(merged.date.weekdays, override.date.weekdays);
  assert.deepEqual(base, expected[name]);
}
console.log('Locale typecheck and partial merge / weekdays copy checks passed');
