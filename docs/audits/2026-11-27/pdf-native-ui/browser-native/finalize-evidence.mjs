import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { copyFile, cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';

const root = import.meta.dirname;
const repository = resolve(root, '../../../../..');
const hostAudit = resolve(root, '../../pdf-native-annotations/host-migration');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const json = async path => JSON.parse(await readFile(path, 'utf8'));
const record = async path => {
  const bytes = await readFile(path);
  return { path: relative(repository, path), bytes: bytes.length, sha256: digest(bytes) };
};
const records = paths => Promise.all(paths.map(record));
async function descendants(path) {
  const entries = await readdir(path, { withFileTypes: true });
  const nested = await Promise.all(entries.filter(entry => entry.name !== 'font-cache').map(entry => {
    const target = resolve(path, entry.name);
    return entry.isDirectory() ? descendants(target) : [target];
  }));
  return nested.flat().sort();
}

const logs = [
  ['/tmp/zuvi-pdf-native-ui-final.txt', 'playwright-10.txt'],
  ['/tmp/zuvi-pdf-native-ui-independent-complete.txt', 'independent-pypdf.txt'],
  ['/tmp/zuvi-pdf-native-ui-poppler-complete.txt', 'poppler.txt'],
  ['/tmp/zuvi-pdf-native-ui-pdfjs-complete.txt', 'pdfjs.txt'],
  ['/tmp/zuvi-pdf-native-none-full-first.txt', 'native-codec-composition-150.txt'],
  ['/tmp/zuvi-pdf-native-none-focused-first.txt', 'none-and-colors-45.txt'],
  ['/tmp/zuvi-pdf-native-none-typecheck.txt', 'native-source-noemit.txt'],
  ['/tmp/zuvi-pdf-native-none-lint-final.txt', 'native-source-eslint.txt'],
  ['/tmp/zuvi-pdf-native-ui-final-spec-types.txt', 'browser-spec-noemit.txt'],
  ['/tmp/zuvi-pdf-native-ui-null-spec-lint.txt', 'browser-spec-eslint.txt'],
  ['/tmp/zuvi-pdf-native-ui-final-audit-eslint.txt', 'audit-and-spec-eslint.txt'],
  ['/tmp/zuvi-pdf-native-audit-global-lint-final.txt', 'global-eslint-after-probe-repair.txt'],
];
await mkdir(root + '/logs', { recursive: true });
for (const [from, name] of logs) await copyFile(from, root + '/logs/' + name);
await copyFile('/tmp/zuvi-pdf-native-ui-types.json', root + '/browser-spec-types.json');
await cp('/tmp/zuvi-pdf-native-ui-final-results', root + '/final-results', { recursive: true });
const browserLog = await readFile(root + '/logs/playwright-10.txt', 'utf8');
assert.match(browserLog, /10 passed \(2\.7m\)/);
assert.doesNotMatch(browserLog, /\d+ failed/);
assert.equal((await json(root + '/final-results/.last-run.json')).status, 'passed');
const nativeLog = await readFile(root + '/logs/native-codec-composition-150.txt', 'utf8');
assert.match(nativeLog, /tests 150\s/);
assert.match(nativeLog, /pass 150\s/);
assert.match(nativeLog, /fail 0\s/);

const source = await json(hostAudit + '/source-contract.json');
assert.equal(source.status, 'passed');
assert.equal(source.modules, 31);
for (const item of source.sources) assert.equal((await record(item.path)).sha256, item.sha256);
const independent = await json(root + '/independent-pypdf.json');
assert.equal(independent.status, 'passed');
assert.equal(independent.files, 19);
const pdfs = await records(Object.keys(independent.reports).map(name => root + '/' + name));
for (const item of pdfs) assert.equal(item.sha256, independent.reports[item.path.split('/').at(-1)].sha256);

const poppler = await json(root + '/poppler.json');
const pdfjs = await json(root + '/pdfjs.json');
assert.equal(poppler.pages.length, 20);
assert.equal(pdfjs.results.length, 18);
for (const item of [...poppler.pages, ...pdfjs.results]) {
  item.pdfSha256 = (await record(root + '/' + item.pdf)).sha256;
  item.pngSha256 = (await record(item.png)).sha256;
}
const uiImages = (await readdir(root)).filter(name => name.endsWith('.png')).sort();
assert.equal(uiImages.length, 13);
const imageRecords = await records([
  ...poppler.pages.map(item => item.png), ...pdfjs.results.map(item => item.png),
  ...uiImages.map(name => root + '/' + name), root + '/render/contact-sheet.png',
  root + '/render/pdfjs-contact-sheet.png',
]);
const visualPath = root + '/visual-review.json';
if (process.argv.includes('--record-visual-review')) {
  // This flag records completed visual inspection; successful rendering alone is insufficient.
  await writeFile(visualPath, JSON.stringify({
    status: 'passed', reviewedAt: new Date().toISOString(), reviewer: 'Codex visual inspection',
    checks: ['Actual App CJK is a single clear layer after SDK accessible text CSS repair',
      'Light and dark native panes; property dialogs and discussion at 320px',
      'Two reopened FreeText pages retain CJK, line breaks, color and transparent background',
      'Four markers and geometric fill, dash, ends, vertices and ink remain visible',
      'Current copied page order and rotation are applied exactly once',
      'Explicit none removes Square/Highlight paint and FreeText border while retaining text',
      'Native fields, notes and original page content remain intact'],
    images: imageRecords,
    independentPdfjsOptions: { disableFontFace: true,
      scope: 'Independent path renderer; actual App uses its original FontFace/canvas pipeline.' },
  }, null, 2) + '\n');
}
const visual = await json(visualPath);
assert.equal(visual.status, 'passed');
assert.deepEqual(visual.images, imageRecords, 'Changed images require new actual visual inspection.');
poppler.status = 'passed';
pdfjs.status = 'passed';
poppler.visualReview = pdfjs.visualReview = 'visual-review.json';
await writeFile(root + '/poppler.json', JSON.stringify(poppler, null, 2) + '\n');
await writeFile(root + '/pdfjs.json', JSON.stringify(pdfjs, null, 2) + '\n');

const noneRoot = root + '/color-none';
await mkdir(noneRoot, { recursive: true });
// Existing fixed evidence and repaired QA executables must never be overwritten on a replay.
await cp('/tmp/zuvi-pdf-native-color-clear-repro/before-pinned', noneRoot + '/before-pinned', { recursive: true, force: false });
await cp('/tmp/zuvi-pdf-native-color-clear-repro/after-fixed', noneRoot + '/after-fixed', { recursive: true, force: false });
await copyFile('/tmp/zuvi-pdf-native-color-clear-repro/probe.txt', noneRoot + '/first-original-cli.txt');
const before = await json(noneRoot + '/before-pinned/proof.json');
const beforeContract = await json(hostAudit + '/source-contract-before-none.json');
for (const item of before.sources) {
  const name = item.path.split('/').at(-1);
  assert.equal((await record(noneRoot + '/before-pinned/source/' + name)).sha256, item.sha256);
  assert.equal(beforeContract.sources.find(source => source.path === item.path)?.sha256, item.sha256);
}
const probeSources = await json(noneRoot + '/probe-source-map.json');
assert.equal(probeSources.status, 'original-bytes-preserved');
for (const item of probeSources.records) {
  assert.equal((await record(repository + '/' + item.original.path)).sha256, item.original.sha256);
  assert.equal((await record(repository + '/' + item.runnable.path)).sha256, item.runnable.sha256);
}
const replay = await json(noneRoot + '/replay-validation.json');
assert.equal(replay.status, 'passed');
for (const item of replay.variants) {
  assert.equal(item.exitCode, 0);
  assert.equal(item.semanticMatchesOriginalEvidence, true);
  for (const file of item.replayFiles) assert.equal((await record(repository + '/' + file.path)).sha256, file.sha256);
}
const noneFiles = await records(await descendants(noneRoot));
const historical = [];
for (const name of ['first-attempt', 'second-attempt', 'third-attempt', 'fifth-attempt',
  'sixth-attempt', 'failed-active-pairs', 'before-fixture-geometry-fix']) {
  historical.push(...await descendants(root + '/' + name));
}
const distPaths = (await readdir(repository + '/packages/ui/dist'))
  .filter(name => /^(StudioPdf-.*\.(?:js|cjs)|style\.css|index\.js|index\.d\.ts)$/.test(name));
const productionPaths = [
  ...source.sources.map(item => item.path),
  ...['StudioPdf.tsx', 'StudioPdf.css', 'StudioPdfNativeLayer.tsx', 'StudioPdfTextLayer.tsx', 'StudioPdfTextLayer.css',
    'StudioPdfAnnotationDialog.tsx', 'studio-pdf-annotations.ts', 'studio-types.ts']
    .map(name => repository + '/packages/ui/src/components/OfficeStudio/' + name),
  repository + '/docs/src/pages/components/OfficeStudioPage.tsx',
  repository + '/docs/src/pages/collaboration/office-studio/studio-pdf-adapter.ts',
];
const spec = await record(repository + '/e2e/office-studio-pdf-native-annotations.spec.ts');
const manifest = {
  version: 1, status: 'verified-current-slice', finalizedAt: new Date().toISOString(),
  ledgerScope: ['P012', 'P014', 'P015', 'P016'],
  nativeTypes: ['FreeText', 'Text', 'Highlight', 'Underline', 'StrikeOut', 'Squiggly',
    'Square', 'Ink', 'Circle', 'Line', 'Polygon', 'PolyLine'],
  actualBrowser: { pass: 10, fail: 0, duration: '2.7m', port: 5275,
    command: 'ZUVI_E2E_PORT=5275 pnpm exec playwright test --config=e2e/playwright.config.ts e2e/office-studio-pdf-native-annotations.spec.ts --workers=1 --output=/tmp/zuvi-pdf-native-ui-final-results',
    spec, logs: await record(root + '/logs/playwright-10.txt'),
    results: await record(root + '/final-results/.last-run.json') },
  nativeCodecComposition: { pass: 150, fail: 0,
    command: 'node --test --test-reporter=spec docs/tests/studio-pdf-native*.test.mjs docs/tests/studio-pdf-codec.test.mjs docs/tests/studio-pdf-composition.test.mjs',
    log: await record(root + '/logs/native-codec-composition-150.txt') },
  typesAndLint: { nativeSourceNoEmit: 0, browserSpecNoEmit: 0, ownedEslint: 0,
    browserTypesConfig: await record(root + '/browser-spec-types.json'),
    auditAndSpecLint: await record(root + '/logs/audit-and-spec-eslint.txt'),
    globalEslintAfterProbeRepair: { exitCode: 0, log: await record(root + '/logs/global-eslint-after-probe-repair.txt') } },
  independentPypdf: { files: 19, status: independent.status,
    proof: await record(root + '/independent-pypdf.json') },
  renderers: { poppler: { pages: 20, status: poppler.status },
    pdfjs: { pages: 18, status: pdfjs.status, version: pdfjs.results[0].version,
      freeTextPaintCount: 1, cjkGlyphTextMatchesContents: true },
    actualApp: { images: 13, status: 'passed', sourceOfTruth: 'Actual latest OfficeStudio App screenshots',
      cjkDiagnosis: 'docs/audits/2026-11-27/pdf-text-layer/cjk-native-display/README.md' },
    visual: await record(visualPath) },
  productionSource: await records(productionPaths),
  actualBuiltUi: await records(distPaths.map(name => repository + '/packages/ui/dist/' + name)),
  fixtureAndOutputPdfs: pdfs,
  fixtures: await records((await readdir(root)).filter(name => name.startsWith('fixture-')).sort().map(name => root + '/' + name)),
  explicitNone: { beforeKind: before.kind, firstPdfCopiesOverwritten: true,
    explanation: before.note, files: noneFiles,
    probeSourceMap: await record(noneRoot + '/probe-source-map.json'),
    runnableProbeValidation: await record(noneRoot + '/replay-validation.json'),
    productionFix: 'C[]/IC[] explicitly store none; source effective defaults and untouched native Gray/CMYK identity remain separate.' },
  preservedHistoricalFailures: await records(historical),
  evidence: await records(['README.md', 'acceptance-matrix.json', 'poppler.json', 'pdfjs.json',
    'visual-review.json', 'verify-native-ui.py', 'render-native-ui.py', 'render-native-ui-pdfjs.mjs',
    'finalize-evidence.mjs', 'browser-spec-types.json', ...logs.map(([, name]) => 'logs/' + name)].map(name => root + '/' + name)),
  remainingRootOwned: ['Original 159-item current audit', 'P009-P011/P013 individual acceptance',
    'Whole repository final gates and full-site E2E', 'Audit archival and commit'],
};
await writeFile(root + '/manifest.json', JSON.stringify(manifest, null, 2) + '\n');
console.log('Finalized actual native UI:', manifest.actualBrowser.pass, 'browser tests,',
  manifest.nativeCodecComposition.pass, 'native/codec/composition tests,', pdfs.length,
  'PDFs,', poppler.pages.length, 'Poppler pages,', pdfjs.results.length, 'PDF.js pages,',
  uiImages.length, 'actual App PNGs.');
