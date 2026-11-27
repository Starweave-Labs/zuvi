import assert from 'node:assert/strict';
import test from 'node:test';
import { Blob } from 'node:buffer';
import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';
import { createRequire } from 'node:module';
import { TextDecoder } from 'node:util';
import { pdfTestRuntime } from './studio-pdf-test-runtime.mjs';
import { sourceColorFixture, nativeRecord, colorCases } from './studio-pdf-native-color-fixtures.mjs';

const require = createRequire(new URL('../package.json', import.meta.url)), lib = require('pdf-lib');
const original = new Uint8Array(await readFile(new URL('./fixtures/studio-pdf-native/native-marks-source.pdf', import.meta.url)));
const now = '2026-11-27T08:00:00.000Z';
function runtime() {
  const graph = pdfTestRuntime(), base = '../src/pages/collaboration/office-studio/';
  return { codec: graph.load(base + 'studio-pdf-codec.ts'),
    editor: graph.load(base + 'studio-pdf-annotation-editor.ts').createStudioPdfAnnotationEditor(),
    read: graph.load(base + 'studio-pdf-native/read.ts') };
}
async function initial(c) {
  const pdf = await lib.PDFDocument.create({ updateMetadata: false });
  const page = pdf.addPage([420, 600]), font = await pdf.embedFont(lib.StandardFonts.Helvetica);
  page.drawText('Original Contents are immutable.', { x: 30, y: 570, font, size: 14 });
  const source = new Blob([new Uint8Array(await pdf.save({ useObjectStreams: false }))], { type: 'application/pdf' });
  return { source, document: await c.codec.importStudioPdf(source, 'Explicit-none.pdf', { native: true }) };
}
const apply = (c, snapshot, command) => c.editor.apply({ snapshot, command: { type: 'mark', command }, now });
async function reopen(c, snapshot) {
  return { source: snapshot.source, document: await c.codec.importStudioPdf(snapshot.source, 'Reopened.pdf', { native: true }) };
}
async function native(snapshot, id) {
  const pdf = await lib.PDFDocument.load(await snapshot.source.arrayBuffer());
  const name = lib.PDFName.of, result = [];
  for (const page of pdf.getPages()) for (const ref of page.node.Annots()?.asArray() ?? []) {
    const dict = pdf.context.lookup(ref), value = dict.lookup(name('ZuviAnnotationId'));
    if (value?.decodeText?.() !== id) continue;
    const array = key => {
      const value = dict.lookup(name(key));
      return value instanceof lib.PDFArray ? value.asArray().map(item => item.asNumber()) : undefined;
    };
    const appearance = dict.lookup(name('AP'), lib.PDFDict).lookup(name('N'), lib.PDFRawStream);
    result.push({ pdf, dict, C: array('C'), IC: array('IC'), AP: new TextDecoder().decode(lib.decodePDFRawStream(appearance).decode()) });
  }
  assert.equal(result.length, 1);
  return result[0];
}
const paint = /(?:^|\s)(?:S|s|B|B\*|b|b\*|f|f\*|F)(?:\s|$)/;

for (const kind of ['square', 'highlight', 'freeText']) {
  test(`${kind}: public null clearing persists explicit empty C/IC through checkpoint, opacity/stroke and two reopens`, async () => {
    const c = runtime(), source = await initial(c), id = 'none-' + kind;
    const originalBytes = new Uint8Array(await source.source.arrayBuffer());
    const common = { id, pageId: source.document.pages[0].id, kind, rect: [40, 350, 260, 410] };
    const annotation = kind === 'square' ? { ...common, color: [1, 0, 0], fill: null, stroke: { width: 2 } }
      : kind === 'highlight' ? { ...common, color: [1, 0, 0], quadPoints: [40, 410, 260, 410, 40, 350, 260, 350] }
        : { ...common, contents: 'Visible text; transparent border.', color: null, fill: [0, 0.8, 0.2],
          stroke: { width: 1 }, font: { family: 'Helvetica', size: 12, color: [0.1, 0.2, 0.3] } };
    let current = await apply(c, source, { type: 'create', annotation, now });
    current = await apply(c, current, { type: 'update', id, patch: kind === 'freeText' ? { kind, fill: null } : { kind, color: null }, now });
    for (let round = 0; round < 3; round++) {
      const record = await native(current, id);
      assert.deepEqual(kind === 'freeText' ? record.IC : record.C, []);
      assert.doesNotMatch(record.AP, paint, 'None color cannot resurrect a painted border/marker.');
      if (kind === 'freeText') assert.match(record.AP, /Tj/, 'Clearing the border preserves text.');
      const inspection = await c.editor.inspect(current), model = inspection.snapshot.annotations.find(item => item.id === id);
      assert.equal(kind === 'freeText' ? model.fill : model.color, null);
      assert.strictEqual(await c.codec.exportStudioPdf(current.document, current.source), current.source);
      if (round === 2) break;
      current = await reopen(c, current);
      current = await apply(c, current, { type: 'update', id, patch: kind === 'freeText'
        ? { kind, stroke: { width: round + 2 } } : { kind, opacity: 0.5 - round * 0.1 }, now });
    }
    assert.deepEqual(new Uint8Array(await source.source.arrayBuffer()), originalBytes);
  });
}

test('fresh FreeText default black border and explicit null remain distinct even when stroke width is nonzero', async () => {
  const c = runtime();
  for (const explicitNone of [false, true]) {
    let current = await initial(c), id = 'fresh-border-' + explicitNone;
    current = await apply(c, current, { type: 'create', now, annotation: {
      id, kind: 'freeText', pageId: current.document.pages[0].id, rect: [40, 350, 260, 410],
      contents: 'Default versus explicit border none', color: null, stroke: { width: 2 },
      font: { family: 'Helvetica', size: 12, color: [0.1, 0.2, 0.3] }, ...(explicitNone ? { fill: null } : {}),
    } });
    for (let round = 0; round < 2; round++) {
      const record = await native(current, id);
      assert.deepEqual(record.IC, explicitNone ? [] : [0, 0, 0]);
      if (explicitNone) assert.doesNotMatch(record.AP, paint);
      else assert.match(record.AP, /(?:^|\s)S(?:\s|$)/);
      current = await reopen(c, current);
      current = await apply(c, current, { type: 'update', id, patch: { kind: 'freeText', stroke: { width: 3 } }, now });
    }
  }
});

test('source missing C/IC projects effective defaults but untouched keys remain absent before and after a style repaint', async () => {
  const c = runtime();
  for (const kind of ['square', 'highlight', 'freeText']) {
    let current = await initial(c), id = 'missing-' + kind;
    const common = { id, kind, pageId: current.document.pages[0].id, rect: [40, 350, 260, 410] };
    const annotation = kind === 'freeText' ? { ...common, contents: 'Missing IC has default black border', color: null,
      stroke: { width: 2 }, font: { family: 'Helvetica', size: 12, color: [0.1, 0.2, 0.3] } }
      : kind === 'square' ? { ...common, color: [0, 0, 0], stroke: { width: 2 } }
        : { ...common, color: [1, 1, 0], quadPoints: [40, 410, 260, 410, 40, 350, 260, 350] };
    current = await apply(c, current, { type: 'create', annotation, now });
    const before = await native(current, id), key = kind === 'freeText' ? 'IC' : 'C';
    before.dict.delete(lib.PDFName.of(key));
    const bytes = new Uint8Array(await before.pdf.save({ useObjectStreams: false, updateFieldAppearances: false }));
    const source = new Blob([bytes], { type: 'application/pdf' });
    current = { source, document: await c.codec.importStudioPdf(source, 'Missing-native-key.pdf', { native: true }) };
    const model = (await c.editor.inspect(current)).snapshot.annotations.find(item => item.id === id);
    assert.deepEqual(kind === 'freeText' ? model.fill : model.color, kind === 'highlight' ? [1, 1, 0] : [0, 0, 0]);
    assert.strictEqual(await c.codec.exportStudioPdf(current.document, current.source), current.source);
    for (let round = 0; round < 2; round++) {
      current = await apply(c, current, { type: 'update', id, patch: { kind, opacity: 0.5 - round * 0.1 }, now });
      const saved = await native(current, id);
      assert.equal(kind === 'freeText' ? saved.IC : saved.C, undefined, 'No unrelated update may materialize an absent source color key.');
      assert.match(saved.AP, paint, 'Effective native default remains painted.');
      current = await reopen(c, current);
    }
    current = await apply(c, current, { type: 'update', id, patch: kind === 'freeText' ? { kind, fill: null } : { kind, color: null }, now });
    assert.deepEqual(kind === 'freeText' ? (await native(current, id)).IC : (await native(current, id)).C, []);
  }
});

test('new none serialization does not quantize unmodified CMYK components or loosen passive color/font guards', async () => {
  const c = runtime(), bytes = await sourceColorFixture(), source = new Blob([bytes], { type: 'application/pdf' });
  let current = { source, document: await c.codec.importStudioPdf(source, 'CMYK.pdf', { native: true }) };
  const model = (await c.editor.inspect(current)).snapshot;
  const annotation = model.annotations.find(item => item.native?.nativeName === 'cmyk-square');
  assert.ok(annotation);
  current = await apply(c, current, { type: 'update', id: annotation.id, patch: { kind: 'square', opacity: 0.4 }, now });
  const saved = await nativeRecord(new Uint8Array(await current.source.arrayBuffer()), 'cmyk-square');
  assert.deepEqual(saved.C, colorCases.cmyk.stroke); assert.deepEqual(saved.IC, colorCases.cmyk.fill);
  const passive = (await c.read.importNativeMarks(original)).annotations.find(item => !item.capabilities.appearance && item.kind === 'freeText');
  assert.ok(passive, 'Original passive font/appearance fixture remains present.');
});
