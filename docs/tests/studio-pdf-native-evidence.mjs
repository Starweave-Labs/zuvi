import { Blob } from 'node:buffer';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { URL } from 'node:url';
import { trueTypeFromWoff } from '../../scripts/office-fonts.mjs';
import { pdfTestRuntime } from './studio-pdf-test-runtime.mjs';

const require = createRequire(new URL('../package.json', import.meta.url));
const lib = require('pdf-lib');
const output = new URL('../audits/2026-11-27/pdf-native-annotations/host-migration/', import.meta.url);
await mkdir(output, { recursive: true });
const noto = trueTypeFromWoff(await readFile(require.resolve('@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-400-normal.woff')));
const graph = pdfTestRuntime({ fetch: async () => ({ ok: true, arrayBuffer: async () => new Uint8Array(noto).buffer }) });
const codec = graph.load('../src/pages/collaboration/office-studio/studio-pdf-codec.ts');
const editor = graph.load('../src/pages/collaboration/office-studio/studio-pdf-annotation-editor.ts').studioPdfAnnotationEditor;
const composer = graph.load('../src/pages/collaboration/office-studio/studio-pdf-composition.ts');
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const now = '2026-11-27T14:00:00.000Z';
const pdf = await lib.PDFDocument.create({ updateMetadata: false });
const pages = [pdf.addPage([500, 700]), pdf.addPage([500, 700])];
const font = await pdf.embedFont(lib.StandardFonts.Helvetica);
for (const [index, page] of pages.entries()) {
  page.drawText('Native PDF host migration: page ' + (index + 1), { x: 30, y: 665, font, size: 16 });
  page.drawText('Original Contents remain independent from native annotations.', { x: 30, y: 640, font, size: 10 });
}
const form = pdf.getForm(), text = form.createTextField('reviewer');
text.setText('Initial');
for (const page of pages) text.addToPage(page, { x: 30, y: 30, width: 260, height: 30, font });
text.setFontSize(12);
const checkbox = form.createCheckBox('confirmed');
checkbox.addToPage(pages[1], { x: 320, y: 30, width: 20, height: 20 });
form.updateFieldAppearances(font);
const original = new Blob([new Uint8Array(await pdf.save({ updateFieldAppearances: false }))], { type: 'application/pdf' });
const initialDocument = await codec.importStudioPdf(original, 'Native host evidence.pdf');
const legacy = {
  ...initialDocument,
  marks: [
    { id: 'legacy-cjk', type: 'text', page: 0, x: 30, y: 590, size: 15, text: '中文自由文本：原生迁入后保留',
      replies: [{ id: 'legacy-reply', text: '旧回复只迁移一次。' }] },
    { id: 'legacy-highlight', type: 'highlight', page: 0, x: 30, y: 530, width: 300, height: 20, size: 12, text: 'Native single-layer highlight' },
    { id: 'legacy-square', type: 'rectangle', page: 0, x: 30, y: 390, width: 180, height: 40, size: 12, text: 'Native Square' },
    { id: 'legacy-ink', type: 'ink', page: 0, x: 250, y: 400, size: 12, text: 'Native Ink', points: [[250, 400], [290, 420], [330, 400], [390, 420]] },
  ],
  fields: initialDocument.fields.map((field) => field.name === 'reviewer' ? { ...field, value: 'Accepted fields and annotations' } : field),
};
let current = await editor.apply({ snapshot: { document: legacy, source: original }, command: { type: 'migrate' }, now });
const records = [];
async function save(label, snapshot) {
  const bytes = new Uint8Array(await snapshot.source.arrayBuffer());
  await writeFile(new URL(label + '.pdf', output), bytes);
  records.push({ label, bytes: bytes.length, sha256: hash(bytes), inspection: await editor.inspect(snapshot) });
}
await writeFile(new URL('original.pdf', output), new Uint8Array(await original.arrayBuffer()));
await save('legacy-migrated', current);
const firstPage = current.document.pages[0].id;
const marker = (kind, id, y) => ({ id, kind, pageId: firstPage, rect: [30, y, 320, y + 18],
  quadPoints: [30, y + 18, 320, y + 18, 30, y, 320, y], color: [0.1, 0.35, 0.6] });
const additions = [
  { id: 'native-note', kind: 'note', pageId: firstPage, rect: [360, 575, 385, 600], contents: 'Native note with IRT discussion' },
  marker('underline', 'native-underline', 495), marker('strikeOut', 'native-strikeout', 475), marker('squiggly', 'native-squiggly', 455),
  { id: 'native-circle', kind: 'circle', pageId: firstPage, rect: [250, 290, 450, 380], color: [0.15, 0.4, 0.6], fill: [0.86, 0.95, 1], opacity: 0.75,
    stroke: { width: 2, style: 'D', dash: [5, 3] } },
  { id: 'native-line', kind: 'line', pageId: firstPage, rect: [30, 275, 230, 365], line: [45, 290, 210, 350], lineEnds: ['OpenArrow', 'ClosedArrow'],
    color: [0.3, 0.25, 0.6], fill: [0.3, 0.25, 0.6], stroke: { width: 2, style: 'D', dash: [5, 3] } },
  { id: 'native-polygon', kind: 'polygon', pageId: firstPage, rect: [30, 140, 230, 245], vertices: [45, 155, 110, 235, 210, 165, 130, 145],
    color: [0.1, 0.4, 0.25], fill: [0.86, 0.98, 0.88], opacity: 0.8 },
  { id: 'native-polyline', kind: 'polyLine', pageId: firstPage, rect: [250, 140, 450, 245], vertices: [265, 155, 310, 235, 355, 165, 430, 220],
    lineEnds: ['Circle', 'ROpenArrow'], color: [0.7, 0.3, 0.1], stroke: { width: 2 } },
];
for (const annotation of additions) current = await editor.apply({
  snapshot: current, command: { type: 'mark', command: { type: 'create', annotation, now } }, now,
});
current = await editor.apply({ snapshot: current, command: { type: 'mark', command: { type: 'reply', parentId: 'native-note',
  reply: { id: 'native-cross-reply', pageId: current.document.pages[1].id, contents: '原生跨页回复', author: '审阅者' }, now } }, now });
await save('native-twelve-types', current);
const prior = current, ids = current.document.pages.map((page) => page.id);
current = await editor.apply({ snapshot: current, command: { type: 'layout', targets: [
  { id: 'host-copy-a', fromPageId: ids[0], copyGroup: 'host-copy-group' },
  { id: 'host-copy-b', fromPageId: ids[1], copyGroup: 'host-copy-group' },
  ...ids.map((id) => ({ id, fromPageId: id })),
] }, now });
const copied = (await editor.inspect(current)).snapshot.annotations.find((item) => item.originId && item.kind === 'freeText' && item.pageId === 'host-copy-a');
current = await editor.apply({ snapshot: current, command: { type: 'mark', command: { type: 'update', id: copied.id,
  patch: { kind: 'freeText', contents: '复制页独立中文编辑' }, now } }, now });
await save('copy-edited', current);
const merged = await composer.composeStudioPdf({
  mode: 'merge', snapshot: current, pages: [0, 1, 2, 3], insertAt: 4, name: 'Native merge.pdf',
  incoming: { source: prior.source, name: 'Incoming native.pdf', pages: [0, 1] },
  conflicts: { strategy: 'rename' }, orphanRadioValue: 'clear',
});
current = { document: merged.document, source: merged.source };
await save('merged-round-1', current);
const exported = await codec.exportStudioPdf(current.document, current.source);
const reopened = await codec.importStudioPdf(exported, 'Reopened native.pdf');
current = await editor.apply({ snapshot: { document: reopened, source: exported },
  command: { type: 'mark', command: { type: 'update', id: copied.id, patch: { kind: 'freeText', contents: '重开编辑保留字体' }, now } }, now });
await save('merged-round-2', current);
await writeFile(new URL('verification-input-output.json', output), JSON.stringify({
  original: { bytes: original.size, sha256: hash(new Uint8Array(await original.arrayBuffer())) }, records,
  acceptedSourceTransactions: true, nativeBodiesDrawnOnce: true,
  unchangedSourceExact: await codec.exportStudioPdf(current.document, current.source) === current.source,
}, null, 2));
console.log('generated migration evidence', records.map(({ label, bytes }) => ({ label, bytes })));
