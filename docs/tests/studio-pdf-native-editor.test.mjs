/* global AbortController, setTimeout */
import { Blob, Buffer } from 'node:buffer';
import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';
import { trueTypeFromWoff } from '../../scripts/office-fonts.mjs';
import { pdfTestRuntime } from './studio-pdf-test-runtime.mjs';

const require = createRequire(new URL('../package.json', import.meta.url));
const lib = require('pdf-lib');
const now = '2026-11-27T12:30:00.000Z';
const noto = trueTypeFromWoff(await readFile(require.resolve('@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-400-normal.woff')));
const runtime = (services) => {
  const graph = pdfTestRuntime({ fetch: async () => ({ ok: true, arrayBuffer: async () => new Uint8Array(noto).buffer }) });
  const codec = graph.load('../src/pages/collaboration/office-studio/studio-pdf-codec.ts');
  const host = graph.load('../src/pages/collaboration/office-studio/studio-pdf-annotation-editor.ts');
  return { ...codec, editor: host.createStudioPdfAnnotationEditor(services), native: graph.load('../src/pages/collaboration/office-studio/studio-pdf-native/read.ts'),
    workspace: graph.load('../src/pages/collaboration/office-studio/studio-pdf-native/workspace.ts').NativePdfWorkspace,
    documentHelpers: graph.load('../src/pages/collaboration/office-studio/studio-pdf-native-document.ts'),
    compose: graph.load('../src/pages/collaboration/office-studio/studio-pdf-composition.ts').composeStudioPdf };
};
const apply = (c, snapshot, command, extra = {}) => c.editor.apply({ snapshot, command, now, ...extra });
const nativeCommand = (command) => ({ type: 'mark', command: { ...command, ...(command.type === 'remove' ? {} : { now }) } });
const layout = (document, extras = []) => ({ type: 'layout', targets: [...extras, ...document.pages.map((page) => ({ id: page.id, fromPageId: page.id }))] });

async function original() {
  const pdf = await lib.PDFDocument.create({ updateMetadata: false });
  const first = pdf.addPage([400, 500]), second = pdf.addPage([400, 500]);
  const font = await pdf.embedFont(lib.StandardFonts.Helvetica), form = pdf.getForm();
  first.drawText('Original body remains untouched', { x: 30, y: 470, font, size: 12 });
  const text = form.createTextField('name'); text.setText('Initial');
  text.addToPage(first, { x: 30, y: 100, width: 220, height: 30, font });
  text.addToPage(second, { x: 30, y: 100, width: 220, height: 30, font });
  const checkbox = form.createCheckBox('check');
  checkbox.addToPage(second, { x: 300, y: 100, width: 20, height: 20 });
  form.updateFieldAppearances(font);
  return new Blob([new Uint8Array(await pdf.save({ updateFieldAppearances: false }))], { type: 'application/pdf' });
}
async function sourceSnapshot(c) {
  const source = await original(), document = await c.importStudioPdf(source, 'native-editor.pdf');
  return { document, source };
}
const annotation = (inspection, id) => inspection.snapshot.annotations.find((item) => item.id === id);

test('a nonempty restored recipe previews current page order, edited copied marks, fields and rotation without accepting a new pair', async () => {
  const c = runtime(), initial = await sourceSnapshot(c);
  const originalBytes = new Uint8Array(await initial.source.arrayBuffer());
  let workspace = await c.workspace.read(originalBytes, initial.document.pages.map((page) => page.id));
  workspace = workspace.accept({
    type: 'create', now, annotation: {
      id: 'recipe-text', kind: 'freeText', pageId: initial.document.pages[0].id,
      rect: [30, 200, 310, 240], contents: 'Original recipe text',
      font: { family: 'Helvetica', size: 12, color: [0, 0, 0] },
    },
  });
  const targets = [
    { id: initial.document.pages[1].id, fromPageId: initial.document.pages[1].id },
    { id: 'recipe-copy', fromPageId: initial.document.pages[0].id, copyGroup: 'recipe-copy-group' },
    { id: initial.document.pages[0].id, fromPageId: initial.document.pages[0].id },
  ];
  workspace = workspace.layout(targets);
  const copied = workspace.snapshot().annotations.find((mark) => mark.originId === 'recipe-text' && mark.pageId === 'recipe-copy');
  assert.ok(copied);
  workspace = workspace.accept({ type: 'update', id: copied.id, patch: { kind: 'freeText', contents: 'Edited current copy' }, now });
  const mapped = c.documentHelpers.remapNativePdfFields(initial.document, targets);
  const document = c.documentHelpers.withNativePdfState({
    ...initial.document, ...mapped, rotations: { '1': 90 },
    fields: mapped.fields.map((field) => field.name === 'name' ? { ...field, value: 'Preview field' } : field),
  }, workspace);
  const snapshot = { document: JSON.parse(JSON.stringify(document)), source: initial.source };
  const before = JSON.stringify(snapshot.document);
  const inspection = await c.editor.inspect(snapshot);
  assert.equal(inspection.state.commands.length, 3);
  const preview = await c.editor.preview(snapshot);
  assert.notEqual(preview.source, initial.source);
  assert.deepEqual(preview.binding.pages.map((page) => [page.id, page.sourcePage]), targets.map((target, index) => [target.id, index]));
  assert.deepEqual(preview.binding.rotations, {});
  assert.equal(preview.binding.sourcePageCount, 3);
  assert.equal(preview.rendersCurrentPageOrder, true);
  assert.ok(preview.nativeBodyIds.includes('recipe-text'));
  assert.ok(preview.nativeBodyIds.includes(copied.id));
  const pdf = await lib.PDFDocument.load(await preview.source.arrayBuffer());
  assert.deepEqual(pdf.getPages().map((page) => page.getRotation().angle), [0, 90, 0]);
  assert.equal(pdf.getForm().getTextField('name').getText(), 'Preview field');
  assert.equal(pdf.getForm().getTextField('name').acroField.getWidgets().length, 3);
  const native = await c.native.importNativeMarks(new Uint8Array(await preview.source.arrayBuffer()));
  assert.equal(preview.annotations.length, native.annotations.length);
  for (const mark of native.annotations) {
    const descriptor = preview.annotations.find((entry) => entry.id === mark.id);
    assert.ok(descriptor);
    assert.equal(descriptor.key, mark._native.key);
    assert.equal(descriptor.flags, mark._native.flags);
  }
  assert.equal(native.annotations.find((mark) => mark.id === copied.id).contents, 'Edited current copy');
  assert.equal(native.annotations.find((mark) => mark.id === 'recipe-text').contents, 'Original recipe text');
  assert.equal(native.annotations.find((mark) => mark.id === copied.id).pageId, 'recipe-copy');
  assert.equal(JSON.stringify(snapshot.document), before);
  assert.deepEqual(new Uint8Array(await initial.source.arrayBuffer()), originalBytes);
});

test('native inspect is read-only; accepted CJK creation checkpoints fields, IDs and recipe without touching the original Blob', async () => {
  const c = runtime(), original = await sourceSnapshot(c), initial = new Uint8Array(await original.source.arrayBuffer());
  const inspected = await c.editor.inspect(original);
  assert.equal(inspected.snapshot.annotations.filter((mark) => mark.kind !== 'opaque').length, 0);
  assert.equal(original.document.nativeAnnotations, undefined);
  const draft = { ...original, document: { ...original.document, fields: original.document.fields.map((field) =>
    field.name === 'name' ? { ...field, value: 'Accepted field draft' } : field) } };
  const result = await apply(c, draft, nativeCommand({
    type: 'create', annotation: { id: 'native-cjk', kind: 'freeText', pageId: draft.document.pages[0].id,
      rect: [30, 200, 320, 260], contents: '中文原生批注保持可编辑', font: { family: 'NotoSansSC', size: 12, color: [0, 0, 0] } },
  }));
  assert.notEqual(result.source, original.source);
  assert.deepEqual(new Uint8Array(await original.source.arrayBuffer()), initial);
  assert.equal(result.document.id, original.document.id);
  assert.deepEqual(result.document.pages.map((page) => page.id), original.document.pages.map((page) => page.id));
  assert.deepEqual(result.document.nativeAnnotations.commands, []);
  assert.deepEqual(Object.keys(result.document.nativeAnnotations).sort(), ['bindings', 'commands', 'sourceHash', 'version']);
  assert.ok(result.document.marks.some((mark) => mark.nativeId === 'native-cjk' && mark.type === 'text'));
  assert.equal((await lib.PDFDocument.load(await result.source.arrayBuffer())).getForm().getTextField('name').getText(), 'Accepted field draft');
  const native = await c.editor.inspect(result);
  assert.equal(annotation(native, 'native-cjk').contents, '中文原生批注保持可编辑');
  assert.equal(annotation(native, 'native-cjk').color, null);
  assert.equal(await c.exportStudioPdf(result.document, result.source), result.source);
});

test('legacy four kinds and replies migrate once with captured IDs/time and remain compatibility projections', async () => {
  const c = runtime(), initial = await sourceSnapshot(c);
  const document = { ...initial.document, marks: [
    { id: 'legacy-text', page: 0, type: 'text', x: 30, y: 400, text: '旧文字中文', size: 12,
      replies: [{ id: 'old-reply', text: '旧回复中文' }] },
    { id: 'legacy-highlight', page: 0, type: 'highlight', x: 30, y: 360, width: 180, height: 18, text: 'Highlight discussion', size: 12 },
    { id: 'legacy-rectangle', page: 0, type: 'rectangle', x: 30, y: 300, width: 180, height: 40, text: 'Square discussion', size: 12 },
    { id: 'legacy-ink', page: 0, type: 'ink', x: 30, y: 280, points: [[30, 280], [100, 250], [180, 280]], text: 'Ink discussion', size: 12 },
  ] };
  const result = await apply(c, { ...initial, document }, { type: 'migrate' });
  assert.deepEqual(result.document.marks.map((mark) => mark.id).sort(), document.marks.map((mark) => mark.id).sort());
  assert.ok(result.document.marks.every((mark) => mark.nativeId));
  const native = await c.editor.inspect(result), migrated = native.snapshot.annotations.filter((mark) => mark.native?.subtype !== 'Widget');
  assert.equal(migrated.length, 5);
  assert.ok(migrated.every((mark) => mark.createdAt === now));
  const first = await c.exportStudioPdf(result.document, result.source), second = await c.exportStudioPdf(result.document, result.source);
  assert.equal(first, result.source); assert.equal(second, result.source);
  assert.equal((await c.native.importNativeMarks(new Uint8Array(await second.arrayBuffer()))).annotations.length,
    (await c.native.importNativeMarks(new Uint8Array(await first.arrayBuffer()))).annotations.length);
});

test('continuous page copies of edited copies preserve interleaved edits/replies/new marks and support old pair undo', async () => {
  const c = runtime(), initial = await sourceSnapshot(c);
  let current = await apply(c, initial, nativeCommand({ type: 'create', annotation: { id: 'native-text',
    kind: 'freeText', pageId: initial.document.pages[0].id, rect: [30, 200, 330, 260],
    contents: 'Before copying', font: { family: 'Helvetica', size: 12, color: [0, 0, 0] } } }));
  current = await apply(c, current, nativeCommand({ type: 'reply', parentId: 'native-text', reply: { id: 'before-copy-reply', contents: 'Before copy', author: 'Reviewer' } }));
  const prior = current;
  const originals = current.document.pages.map((page) => page.id);
  current = await apply(c, current, layout(current.document, [
    { id: 'first-copy-a', fromPageId: originals[0], copyGroup: 'first-copy' },
    { id: 'first-copy-b', fromPageId: originals[1], copyGroup: 'first-copy' },
  ]));
  const first = (await c.editor.inspect(current)).snapshot.annotations.find((mark) => mark.originId === 'native-text' && mark.pageId === 'first-copy-a');
  current = await apply(c, current, nativeCommand({ type: 'update', id: first.id, patch: { kind: 'freeText', contents: 'Edited current copy' } }));
  current = await apply(c, current, nativeCommand({ type: 'reply', parentId: first.id, reply: { id: 'only-first-copy-reply', contents: 'Copy reply', author: 'Reviewer' } }));
  current = await apply(c, current, nativeCommand({ type: 'create', annotation: { id: 'only-first-copy-circle', kind: 'circle',
    pageId: 'first-copy-a', rect: [280, 150, 350, 200], fill: [0.8, 0.9, 1] } }));
  current = await apply(c, current, layout(current.document, [
    { id: 'second-copy-a', fromPageId: 'first-copy-a', copyGroup: 'second-copy' },
    { id: 'second-copy-b', fromPageId: 'first-copy-b', copyGroup: 'second-copy' },
  ]));
  const afterCopy = current;
  current = await apply(c, current, { type: 'layout', targets: current.document.pages
    .filter((page) => !['first-copy-a', 'first-copy-b'].includes(page.id)).reverse().map((page) => ({ id: page.id, fromPageId: page.id })) });
  const inspected = await c.editor.inspect(current);
  assert.ok(inspected.snapshot.annotations.some((mark) => mark.originId === 'native-text' && mark.pageId === 'second-copy-a' && mark.contents === 'Edited current copy'));
  assert.ok(inspected.snapshot.annotations.some((mark) => mark.originId === 'only-first-copy-circle' && mark.pageId === 'second-copy-a'));
  const copiedReply = inspected.snapshot.annotations.find((mark) => mark.originId === 'only-first-copy-reply' && mark.pageId === 'second-copy-a');
  assert.equal(inspected.snapshot.annotations.find((mark) => mark.id === copiedReply.inReplyTo).pageId, 'second-copy-a');
  assert.deepEqual(current.document.nativeAnnotations.commands, []);
  assert.equal((await c.editor.inspect(prior)).snapshot.annotations.some((mark) => mark.pageId === 'second-copy-a'), false);
  assert.equal((await c.editor.inspect(afterCopy)).snapshot.canvasPages.length, 6);
});

test('forged provenance, native projections, locked commands and aborted font preparation return no candidate mutation', async () => {
  const c = runtime(), initial = await sourceSnapshot(c);
  const accepted = await apply(c, initial, nativeCommand({ type: 'create', annotation: { id: 'safe-square', kind: 'square',
    pageId: initial.document.pages[0].id, rect: [30, 200, 130, 250] } }));
  const sourceBytes = new Uint8Array(await accepted.source.arrayBuffer()), serialized = JSON.stringify(accepted.document);
  await assert.rejects(c.editor.inspect({ ...accepted, document: { ...accepted.document, nativeAnnotations: {
    ...accepted.document.nativeAnnotations, sourceHash: 'forged' } } }), /binding/);
  await assert.rejects(apply(c, accepted, nativeCommand({ type: 'update', id: 'safe-square',
    patch: { kind: 'square', native: { flags: 0 } } })), /Unexpected/);
  const native = await c.editor.inspect(accepted), widget = native.snapshot.annotations.find((mark) => mark.native?.subtype === 'Widget');
  await assert.rejects(apply(c, accepted, nativeCommand({ type: 'remove', id: widget.id })), /cannot|removed/);
  const invalidProjection = { ...accepted.document, marks: accepted.document.marks.map((mark) => ({ ...mark, nativeId: 'forged' })) };
  await assert.rejects(c.exportStudioPdf(invalidProjection, accepted.source), /投影/);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(apply(c, accepted, { type: 'migrate' }, { signal: controller.signal }), { name: 'AbortError' });
  assert.equal(JSON.stringify(accepted.document), serialized);
  assert.deepEqual(new Uint8Array(await accepted.source.arrayBuffer()), sourceBytes);
  let waiting;
  const blocked = runtime({ resolveFont: () => new Promise((resolve) => { waiting = resolve; }) });
  const pendingController = new AbortController();
  const pending = apply(blocked, initial, nativeCommand({ type: 'create', annotation: { id: 'blocked-font', kind: 'freeText',
    pageId: initial.document.pages[0].id, rect: [30, 200, 330, 260], contents: '中文', font: { family: 'NotoSansSC', size: 12, color: [0, 0, 0] } } }),
    { signal: pendingController.signal });
  while (!waiting) await new Promise((resolve) => setTimeout(resolve, 0));
  pendingController.abort();
  await assert.rejects(pending, { name: 'AbortError' });
});

test('accepted native source composes with a second annotated PDF, restores scopes and edits after two real reopen cycles', async () => {
  const c = runtime(), initial = await sourceSnapshot(c);
  const accepted = await apply(c, initial, nativeCommand({ type: 'create', annotation: { id: 'compose-text', kind: 'freeText',
    pageId: initial.document.pages[0].id, rect: [30, 200, 330, 260], contents: 'Native before merge',
    font: { family: 'Helvetica', size: 12, color: [0, 0, 0] } } }));
  const replied = await apply(c, accepted, nativeCommand({ type: 'reply', parentId: 'compose-text',
    reply: { id: 'compose-cross-page-reply', pageId: accepted.document.pages[1].id, contents: 'Cross-page native', author: 'Reviewer' } }));
  const merged = await c.compose({ mode: 'merge', snapshot: replied, pages: [0, 1], insertAt: 2, name: 'merged.pdf',
    incoming: { source: replied.source, name: 'incoming.pdf', pages: [0, 1] }, conflicts: { strategy: 'rename' }, orphanRadioValue: 'clear' });
  const inspected = await c.editor.inspect(merged);
  assert.equal(merged.document.pageCount, 4);
  assert.equal(new Set(inspected.snapshot.annotations.map((mark) => mark.id)).size, inspected.snapshot.annotations.length);
  assert.ok(inspected.snapshot.annotations.some((mark) => mark.originId === 'compose-text'));
  for (const reply of inspected.snapshot.annotations.filter((mark) => mark.inReplyTo)) {
    const parent = inspected.snapshot.annotations.find((mark) => mark.id === reply.inReplyTo);
    assert.equal(inspected.snapshot.canvasPages.findIndex((page) => page.id === reply.pageId) < 2,
      inspected.snapshot.canvasPages.findIndex((page) => page.id === parent.pageId) < 2);
  }
  const firstSaved = await c.exportStudioPdf(merged.document, merged.source);
  const firstDocument = await c.importStudioPdf(firstSaved, 'first.pdf');
  const changed = await apply(c, { document: firstDocument, source: firstSaved }, nativeCommand({ type: 'update', id: 'compose-text',
    patch: { kind: 'freeText', contents: 'Native after reopen' } }));
  const secondSaved = await c.exportStudioPdf(changed.document, changed.source);
  const secondDocument = await c.importStudioPdf(secondSaved, 'second.pdf');
  assert.equal(annotation(await c.editor.inspect({ document: secondDocument, source: secondSaved }), 'compose-text').contents, 'Native after reopen');
  assert.equal((await lib.PDFDocument.load(await secondSaved.arrayBuffer())).getForm().getTextField('name').getText(), 'Initial');
});

test('field-only source rewrites stamp preexisting fallback annotation IDs and leave native appearances and streams unchanged', async () => {
  const c = runtime();
  const source = new Blob([new Uint8Array(await readFile(new URL('./fixtures/studio-pdf-native/native-marks-source.pdf', import.meta.url)))], { type: 'application/pdf' });
  const document = await c.importStudioPdf(source, 'existing-native.pdf');
  const before = await c.editor.inspect({ document, source });
  const bytesBefore = await c.native.inspectNativePdf(new Uint8Array(await source.arrayBuffer()));
  const draft = { ...document, fields: [...document.fields, {
    name: 'new-field', type: 'text', value: 'Native retained', readOnly: false,
    widgets: [{ page: 0, x: 30, y: 30, width: 200, height: 30 }],
    design: { kind: 'text', fontSize: 12, borderWidth: 1 },
  }] };
  const saved = await c.exportStudioPdf(draft, source);
  const imported = await c.importStudioPdf(saved, 'rewritten.pdf');
  const after = await c.editor.inspect({ document: imported, source: saved });
  const bytesAfter = await c.native.inspectNativePdf(new Uint8Array(await saved.arrayBuffer()));
  // pdf-lib normalizes a source page when adding its first widget. The only
  // permitted new Contents are its neutral q/Q wrappers around the exact source stream.
  assert.deepEqual(bytesAfter.contentHashes[0].slice(1, -1), bytesBefore.contentHashes[0]);
  assert.equal(bytesAfter.contentHashes[0].length, bytesBefore.contentHashes[0].length + 2);
  assert.deepEqual(bytesAfter.contentHashes[1], bytesBefore.contentHashes[1]);
  const pdfAfter = await lib.PDFDocument.load(await saved.arrayBuffer());
  const contents = pdfAfter.getPage(0).node.Contents();
  const wrappers = [contents.get(0), contents.get(contents.size() - 1)].map((ref) =>
    Buffer.from(lib.decodePDFRawStream(pdfAfter.context.lookup(ref)).decode()).toString('ascii').trim());
  assert.deepEqual(wrappers, ['q', 'Q']);
  for (const annotation of before.snapshot.annotations) {
    const retained = after.snapshot.annotations.find((entry) => entry.id === annotation.id);
    assert.ok(retained);
    assert.equal(retained.native.appearanceHash, annotation.native.appearanceHash);
  }
  assert.equal(await c.exportStudioPdf(imported, saved), saved);
});

test('page metadata rotation applies only the new delta after pending native source preparation', async () => {
  const c = runtime(), initial = await sourceSnapshot(c);
  const document = { ...initial.document, rotations: { '0': 90 } };
  const next = { ...document, rotations: { '0': 180 } };
  const result = await apply(c, { document, source: initial.source }, layout(document), { next });
  const pdf = await lib.PDFDocument.load(await result.source.arrayBuffer());
  assert.equal(pdf.getPage(0).getRotation().angle, 180);
  assert.deepEqual(result.document.rotations, {});
  assert.deepEqual(result.document.nativeAnnotations.commands, []);
  const preview = await c.editor.preview(result);
  assert.deepEqual(preview.binding.rotations, {});
  assert.deepEqual(preview.binding.pages.map((page) => page.sourcePage), [0, 1]);
});

test('signed sources remain unchanged and failed native fitting/font coverage accepts no source or model mutation', async () => {
  const c = runtime(), initial = await sourceSnapshot(c);
  const serialized = JSON.stringify(initial.document), originalBytes = new Uint8Array(await initial.source.arrayBuffer());
  await assert.rejects(apply(c, initial, nativeCommand({ type: 'create', annotation: { id: 'too-narrow', kind: 'freeText',
    pageId: initial.document.pages[0].id, rect: [30, 200, 31, 220], contents: 'Wide glyph', font: { family: 'Helvetica', size: 12, color: [0, 0, 0] } } })),
    /glyph|box|fit/i);
  await assert.rejects(apply(c, initial, nativeCommand({ type: 'create', annotation: { id: 'bad-coverage', kind: 'freeText',
    pageId: initial.document.pages[0].id, rect: [30, 200, 300, 260], contents: '中文', font: { family: 'Helvetica', size: 12, color: [0, 0, 0] } } })),
    /cover/i);
  assert.equal(JSON.stringify(initial.document), serialized);
  assert.deepEqual(new Uint8Array(await initial.source.arrayBuffer()), originalBytes);
  const signed = new Blob([new Uint8Array(await readFile(new URL('./fixtures/studio-pdf-native/native-marks-signed-marker.pdf', import.meta.url)))], { type: 'application/pdf' });
  const document = await c.importStudioPdf(signed, 'signed.pdf');
  assert.equal(await c.exportStudioPdf(document, signed), signed);
  await assert.rejects(apply(c, { document, source: signed }, nativeCommand({ type: 'create', annotation: { id: 'signed-write',
    kind: 'square', pageId: document.pages[0].id, rect: [30, 200, 130, 250] } })), /signed/i);
});
