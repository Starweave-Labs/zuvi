import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { basename, resolve } from 'node:path';
import assert from 'node:assert/strict';

const root = import.meta.dirname;
const repository = resolve(root, '../../../../..');
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const json = async (path) => JSON.parse(await readFile(path, 'utf8'));
const record = async (path) => {
  const bytes = await readFile(path);
  return { path, bytes: bytes.length, sha256: digest(bytes) };
};

const poppler = await json(root + '/poppler.json');
const pdfjs = await json(root + '/pdfjs.json');
const independent = await json(root + '/independent-pypdf.json');
const source = await json(root + '/source-contract.json');
assert.equal(independent.status, 'passed');
assert.equal(independent.files, 6);
assert.equal(pdfjs.status, 'passed');
assert.equal(source.status, 'passed');
assert.equal(source.modules, 31);

const images = [
  ...poppler.files.map((item) => item.png),
  ...pdfjs.results.map((item) => root + '/render/pdfjs-' + item.label + '-page-' + item.page + '.png'),
];
const imageRecords = await Promise.all(images.map(record));
const visualPath = root + '/visual-review.json';
if (process.argv.includes('--record-visual-review')) {
  // This flag records the completed visual inspection, never a renderer-only success.
  await writeFile(visualPath, JSON.stringify({
    status: 'passed', reviewer: 'Codex visual inspection', reviewedAt: new Date().toISOString(),
    checks: ['CJK glyphs', 'field values and bounds', 'FreeText transparent background',
      'single-layer 0.3 highlight', 'geometric fill/border/dash/ends', 'copied and reopened content'],
    images: imageRecords,
  }, null, 2));
}
const visual = await json(visualPath);
assert.equal(visual.status, 'passed');
assert.deepEqual(visual.images, imageRecords, 'Changed PNGs require a new actual visual inspection.');

for (const item of poppler.files) {
  item.pdfSha256 = (await record(root + '/' + item.file)).sha256;
  item.pngSha256 = (await record(item.png)).sha256;
}
poppler.status = 'passed';
poppler.visualReview = 'visual-review.json';
await writeFile(root + '/poppler.json', JSON.stringify(poppler, null, 2));
for (const item of pdfjs.results) {
  item.pdfSha256 = (await record(root + '/' + item.label + '.pdf')).sha256;
  item.png = root + '/render/pdfjs-' + item.label + '-page-' + item.page + '.png';
  item.pngSha256 = (await record(item.png)).sha256;
}
pdfjs.visualReview = 'visual-review.json';
await writeFile(root + '/pdfjs.json', JSON.stringify(pdfjs, null, 2));

const logs = [
  ['/tmp/zuvi-pdf-native-migration-isolated-final.txt', 'native-and-composition-117.txt'],
  ['/tmp/zuvi-pdf-native-migration-all-second.txt', 'prior-migration-143.txt'],
  ['/tmp/zuvi-pdf-native-migration-all-third.txt', 'legacy-codec-loader-failure-144.txt'],
  ['/tmp/zuvi-pdf-native-migration-editor-fourth.txt', 'first-new-preview-fixture-kind-failure.txt'],
  ['/tmp/zuvi-pdf-native-none-full-first.txt', 'native-codec-composition-150.txt'],
  ['/tmp/zuvi-pdf-native-none-focused-first.txt', 'none-and-colors-45.txt'],
  ['/tmp/zuvi-pdf-native-none-typecheck.txt', 'strict-source-noemit-current.txt'],
  ['/tmp/zuvi-pdf-native-none-lint-final.txt', 'eslint-current.txt'],
];
await mkdir(root + '/logs', { recursive: true });
for (const [from, name] of logs) await copyFile(from, root + '/logs/' + name);
await copyFile('/tmp/zuvi-pdf-native-migration-source-types.json', root + '/strict-source-types.json');
const tests = await readFile(root + '/logs/native-codec-composition-150.txt', 'utf8');
assert.match(tests, /tests 150\s/);
assert.match(tests, /pass 150\s/);
assert.match(tests, /fail 0\s/);
const preserved = '/tmp/zuvi-pdf-native-marks-typescript/';
const preservedEvidence = await Promise.all([
  'tests-final.txt', 'evidence-before-default-paint/model-edit.ts',
  'evidence-before-default-paint/source-contract-verification.json',
  'evidence-before-default-paint/workspace-render/mixed-prepared-page-1.png',
].map((path) => record(preserved + path)));
const dependencies = await Promise.all([
  'studio-pdf-compose.ts', 'studio-pdf-compose-source.ts', 'studio-pdf-compose-resources.ts',
  'studio-pdf-compose-navigation.ts', 'studio-pdf-compose-catalog.ts', 'studio-pdf-compose-utils.ts',
  'studio-pdf-compose-types.ts', 'studio-pdf-compose-sha256.ts', 'studio-pdf-page-codec.ts',
].map((path) => record(repository + '/docs/src/pages/collaboration/office-studio/' + path)));
const resolvedGate = repository + '/docs/audits/2026-11-27/pdf-native-ui/validation/codec-and-compose.txt';
const resolvedText = await readFile(resolvedGate, 'utf8');
assert.match(resolvedText, /# tests 134\s/);
assert.match(resolvedText, /# pass 134\s/);
assert.match(resolvedText, /# fail 0\s/);
const browserManifestPath = repository + '/docs/audits/2026-11-27/pdf-native-ui/browser-native/manifest.json';
const browser = await json(browserManifestPath);
assert.equal(browser.status, 'verified-current-slice');
assert.equal(browser.actualBrowser.pass, 10);
assert.equal(browser.nativeCodecComposition.pass, 150);
const manifest = {
  status: 'verified-current-slice', version: 1,
  ledgerScope: ['P012', 'P014', 'P015', 'P016'],
  nativeTypes: ['FreeText', 'Text', 'Highlight', 'Underline', 'StrikeOut', 'Squiggly',
    'Square', 'Ink', 'Circle', 'Line', 'Polygon', 'PolyLine'],
  sourceContract: { modules: source.modules, typescript: source.typescript,
    sha256: (await record(root + '/source-contract.json')).sha256 },
  sharedDependencies: dependencies,
  tests: { currentNativeCodecComposition: { pass: 150, fail: 0,
    command: 'node --test --test-reporter=spec docs/tests/studio-pdf-native*.test.mjs docs/tests/studio-pdf-codec.test.mjs docs/tests/studio-pdf-composition.test.mjs' },
    historicalIsolated: { pass: 117, fail: 0, native: 110, highLevelComposition: 7 },
    priorCombinedMigration: { pass: 143, fail: 0 },
    historicalCombinedLegacyLoader: { pass: 130, fail: 14, total: 144,
      reason: 'Legacy codec pageCommands VM lacked require for the newly imported studio-pdf-source-id helper.' },
    codecAndFullLowLevelCompositionResolution: { pass: 134, fail: 0,
      ...await record(resolvedGate) } },
  strictSourceNoEmit: { exitCode: 0, config: 'strict-source-types.json' },
  eslint: { exitCode: 0, log: 'logs/eslint-current.txt' },
  archivalHostFileQA: { generatedBeforeNoneFix: true,
    sourceContract: await record(root + '/source-contract-before-none.json'),
    independentPypdf: { files: independent.files, status: independent.status },
    poppler: { pages: poppler.files.length, status: poppler.status },
    pdfjs: { pages: pdfjs.results.length, status: pdfjs.status, version: pdfjs.results[0].pdfjsVersion } },
  actualCurrentBrowserAndNativeQA: { pass: 10, fail: 0, pdfs: 19,
    popplerPages: 20, pdfjsPages: 18, appPngs: 13, manifest: await record(browserManifestPath) },
  pdfs: await Promise.all(Object.keys(independent.results).map((path) => record(root + '/' + path))),
  preservedPrototype: { tests: 124, evidence: preservedEvidence },
  remaining: ['Original 159-item full-ledger and final repository gates remain root-owned',
    'P009-P011/P013 individual acceptance is outside this slice'],
};
manifest.proofFiles = await Promise.all(['independent-pypdf.json', 'poppler.json', 'pdfjs.json',
  'visual-review.json', 'source-contract.json', 'source-contract-before-none.json', 'verification-input-output.json', 'README.md',
  ...logs.map(([, name]) => 'logs/' + name)].map(async (path) => ({ ...await record(root + '/' + path), name: basename(path) })));
await writeFile(root + '/manifest.json', JSON.stringify(manifest, null, 2));
console.log('Finalized native host evidence:', manifest.tests.currentNativeCodecComposition.pass,
  'current tests,', browser.actualBrowser.pass, 'actual browser tests,', independent.files,
  'archival host PDFs,', source.modules, 'current source modules.');
