/* global AbortController */
import assert from 'node:assert/strict';
import { Blob, Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { PDFDocument, PDFName, PDFDict, PDFArray, StandardFonts, decodePDFRawStream } from 'pdf-lib';
import { basicPdf, sevenFields, hiddenOpaque, combineFieldWidget, addLink } from './studio-pdf-compose-fixtures.mjs';
import { pdfTestRuntime } from './studio-pdf-test-runtime.mjs';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const source = async (fixture) => new Blob([new Uint8Array(await fixture.bytes())], { type: 'application/pdf' });
function runtime() {
  const r = pdfTestRuntime();
  return { ...r.load('../src/pages/collaboration/office-studio/studio-pdf-composition.ts'),
    ...r.load('../src/pages/collaboration/office-studio/studio-pdf-codec.ts'),
    ...r.load('../../packages/ui/src/components/OfficeStudio/studio-pdf-pages.ts') };
}
function request(document, original, options = {}) {
  return { snapshot: { document, source: original }, mode: 'extract', pages: [0],
    conflicts: { strategy: 'rename', valuePolicy: 'reject' }, orphanRadioValue: 'reject', ...options };
}
function commands(pdf, index) {
  const contents = pdf.getPages()[index].node.Contents();
  return (contents instanceof PDFArray ? contents.asArray() : contents ? [contents] : [])
    .map((ref) => Buffer.from(decodePDFRawStream(pdf.context.lookup(ref)).decode()).toString('latin1')).join('\n');
}

test('rebases virtual pages, native edits, links and resource conflicts while keeping editable marks out of the new base', async () => {
  const c = runtime(), first = await sevenFields(), second = await basicPdf({ pages: 2, fieldName: 'Text', value: 'Incoming', fontName: StandardFonts.Courier });
  addLink(second.pdf, second.pages[0], second.pages[1]);
  const original = await source(first), incoming = await source(second), before = hash(new Uint8Array(await original.arrayBuffer()));
  let document = await c.importStudioPdf(original, 'Current.pdf');
  document = c.pdfInsertBlankPage(document, 1, { width: 320, height: 240 });
  document = c.pdfCopyPages(document, [0], 3);
  document = c.pdfRotatePages(document, [2], 90);
  document.fields.find((field) => field.name === 'Text').value = 'Edited before merge';
  document.fields.find((field) => field.name === 'Date').value = '2027-01-02';
  document.fields.find((field) => field.name === 'Choice').value = 'B';
  document.marks = [{ id: 'pending', type: 'text', page: 3, text: 'Pending mark', x: 20, y: 45, size: 10,
    replies: [{ id: 'reply', text: 'Editable discussion' }] }];
  const snapshot = JSON.stringify(document);
  const output = await c.composeStudioPdf(request(document, original, {
    mode: 'merge', pages: [0, 1, 2, 3], insertAt: 1, incoming: { source: incoming, name: 'Incoming.pdf', pages: [1, 0] },
  }));
  assert.equal(JSON.stringify(document), snapshot); assert.equal(hash(new Uint8Array(await original.arrayBuffer())), before);
  assert.equal(output.document.id, document.id); assert.equal(output.document.pageCount, 6); assert.equal(output.document.sourcePageCount, 6);
  assert.deepEqual(output.document.pages.map((page) => page.sourcePage), [0, 1, 2, 3, 4, 5]);
  assert.deepEqual(output.document.pages.filter((page) => document.pages.some((original) => original.id === page.id)).map((page) => page.id), document.pages.map((page) => page.id));
  assert.deepEqual(output.document.marks, [{ ...document.marks[0], page: 5 }]);
  assert.ok(output.warnings.some((message) => message.includes('Text → Text__2')));
  assert.equal(output.sourceHash, hash(new Uint8Array(await output.source.arrayBuffer())));
  const native = await PDFDocument.load(await output.source.arrayBuffer());
  assert.equal(native.getForm().getTextField('Text').getText(), 'Edited before merge');
  assert.equal(native.getForm().getTextField('Text__2').getText(), 'Incoming');
  assert.equal(native.getForm().getTextField('Date').getText(), '2027-01-02');
  assert.equal(native.getForm().getRadioGroup('Choice').getSelected(), 'B');
  const radio = native.getForm().getRadioGroup('Choice'), a = radio.getOptions().indexOf('A');
  assert.equal(radio.acroField.dict.lookup(PDFName.of('DV')).toString(), radio.acroField.getWidgets()[a].getOnValue().toString());
  assert.deepEqual(native.getForm().getOptionList('List').getSelected(), ['Alpha', 'Gamma']);
  assert.equal(native.getPages()[3].getWidth(), 320); assert.equal(native.getPages()[3].getHeight(), 240);
  assert.equal(native.getPages()[4].getRotation().angle, 90);
  const link = native.getPages()[2].node.Annots().asArray().map((ref) => native.context.lookup(ref)).find((dict) => dict instanceof PDFDict && dict.lookup(PDFName.of('Subtype')) === PDFName.of('Link'));
  assert.equal(link.lookup(PDFName.of('Dest')).get(0).toString(), native.getPages()[1].ref.toString());
  const text = Buffer.from('Pending mark').toString('hex').toUpperCase();
  assert.ok(!commands(native, 5).includes(text), 'The new base does not burn editable marks into page content.');
  let exported = await c.exportStudioPdf(output.document, output.source);
  for (let round = 1; round <= 2; round++) {
    const reopenedNative = await PDFDocument.load(await exported.arrayBuffer());
    assert.equal(commands(reopenedNative, 5).split(text).length - 1, 1);
    const reopened = await c.importStudioPdf(exported, 'Reopened.pdf');
    assert.equal(reopened.fields.find((field) => field.name === 'Text__2').value, 'Incoming');
    assert.equal(reopened.fields.find((field) => field.name === 'List').type, 'opaque');
    if (round === 1) { reopened.fields.find((field) => field.name === 'Text').value = 'Round two'; exported = await c.exportStudioPdf(reopened, exported); }
  }
});

test('keeps a prior page-copy transaction with combined Hide and ResetForm semantics through composition and extraction', async () => {
  const c = runtime(), fixture = await basicPdf({ pages: 2 });
  const field = fixture.fields.Shared;
  combineFieldWidget(fixture, 'Shared');
  const hide = () => fixture.pdf.context.obj({ S: 'Hide', T: field.ref, H: true });
  field.acroField.dict.set(PDFName.of('AA'), fixture.pdf.context.obj({ V: hide(), Fo: hide() }));
  fixture.pdf.catalog.set(PDFName.of('OpenAction'), fixture.pdf.context.obj({ S: 'ResetForm', Fields: [field.ref], Next: hide() }));
  const original = await source(fixture);
  let document = c.pdfCopyPages(await c.importStudioPdf(original, 'Combined.pdf'), [0], 0);
  const output = await c.composeStudioPdf(request(document, original, { pages: [0, 1, 2] }));
  let native = await PDFDocument.load(await output.source.arrayBuffer());
  const canonical = native.getForm().getTextField('Shared'), widgets = canonical.acroField.getWidgets();
  assert.equal(widgets.length, 2);
  const originalWidget = widgets.find((widget) => widget.P().toString() === native.getPages()[1].ref.toString());
  assert.equal(canonical.acroField.dict.lookup(PDFName.of('AA')).lookup(PDFName.of('V')).get(PDFName.of('T')).toString(), native.context.getObjectRef(originalWidget.dict).toString());
  for (const widget of widgets) assert.equal(widget.dict.lookup(PDFName.of('AA')).lookup(PDFName.of('Fo')).get(PDFName.of('T')).toString(), native.context.getObjectRef(widget.dict).toString());
  assert.equal(native.catalog.lookup(PDFName.of('OpenAction')).lookup(PDFName.of('Fields')).lookup(0).decodeText(), canonical.getName());
  const extracted = await c.composeStudioPdf(request(output.document, output.source, { pages: [1, 0], name: 'Extracted.pdf' }));
  assert.equal(extracted.document.name, 'Extracted.pdf');
  assert.deepEqual(extracted.document.pages.map((page) => page.id), [output.document.pages[1].id, output.document.pages[0].id]);
  native = await PDFDocument.load(await extracted.source.arrayBuffer());
  assert.equal(native.getPageCount(), 2); assert.equal(native.getForm().getTextField('Shared').acroField.getWidgets().length, 2);
  document = await c.importStudioPdf(extracted.source, 'Again.pdf'); assert.equal(await c.exportStudioPdf(document, extracted.source), extracted.source);
});

test('links compatible equal fields and retains independent fields by default, while value conflicts leave both inputs unchanged', async () => {
  const c = runtime(), one = await basicPdf({ pages: 1, value: 'Same' }), two = await basicPdf({ pages: 1, value: 'Same' });
  const original = await source(one), incoming = await source(two), document = await c.importStudioPdf(original, 'Current.pdf');
  const options = { mode: 'merge', pages: [0], insertAt: 1, incoming: { source: incoming, name: 'Incoming.pdf', pages: [0] } };
  const linked = await c.composeStudioPdf(request(document, original, { ...options, conflicts: { strategy: 'link', valuePolicy: 'reject' } }));
  let native = await PDFDocument.load(await linked.source.arrayBuffer());
  assert.equal(native.getForm().getFields().length, 1); assert.equal(native.getForm().getTextField('Shared').acroField.getWidgets().length, 2);
  const renamed = await c.composeStudioPdf(request(document, original, options));
  native = await PDFDocument.load(await renamed.source.arrayBuffer()); assert.equal(native.getForm().getFields().length, 2);
  two.fields.Shared.setText('Conflict'); two.fields.Shared.updateAppearances(two.font);
  const conflicting = await source(two), hashes = await Promise.all([original, conflicting].map(async (blob) => hash(new Uint8Array(await blob.arrayBuffer()))));
  const before = JSON.stringify(document);
  for (const valuePolicy of ['reject', 'first', 'last']) {
    await assert.rejects(c.composeStudioPdf(request(document, original, { ...options, incoming: { source: conflicting, name: 'Conflict.pdf', pages: [0] }, conflicts: { strategy: 'link', valuePolicy } })), /同名字段|LINK_/);
    assert.equal(JSON.stringify(document), before);
    assert.deepEqual(await Promise.all([original, conflicting].map(async (blob) => hash(new Uint8Array(await blob.arrayBuffer())))), hashes);
  }
});

test('preserves zero-area, Invisible, NoView and unknown passive fields in an extracted base and later native edits', async () => {
  const c = runtime(), fixture = await hiddenOpaque(), original = await source(fixture), document = await c.importStudioPdf(original, 'Passive.pdf');
  const output = await c.composeStudioPdf(request(document, original, { pages: [0] }));
  assert.equal(output.document.fields.length, 4);
  assert.equal(output.document.fields.find((field) => field.name === 'Opaque').type, 'opaque');
  assert.ok(output.document.fields.every((field) => !field.widgets.length && field.hiddenWidgets.length === 1));
  const edited = { ...output.document, marks: [{ id: 'mark', page: 0, type: 'rectangle', x: 200, y: 30, width: 20, height: 20, text: '', size: 12 }] };
  const saved = await c.exportStudioPdf(edited, output.source), reopened = await c.importStudioPdf(saved, 'Reopened.pdf');
  assert.deepEqual(reopened.fields.map((field) => [field.name, field.hiddenWidgets[0].flags]), [['Zero', 0], ['Invisible', 1], ['NoView', 32], ['Opaque', 0]]);
  assert.equal(reopened.fields.find((field) => field.name === 'Opaque').nativeValueHash, output.document.fields.find((field) => field.name === 'Opaque').nativeValueHash);
});

test('requires an explicit policy when extracting only the current or only the default radio widget, preserving V and DV independently', async () => {
  const c = runtime(), fixture = await basicPdf({ pages: 2, form: false }), { pdf, pages } = fixture;
  const radio = pdf.getForm().createRadioGroup('Choice'); radio.disableMutualExclusion();
  radio.addOptionToPage('A', pages[0], { x: 20, y: 40, width: 20, height: 20 });
  radio.addOptionToPage('B', pages[1], { x: 20, y: 40, width: 20, height: 20 }); radio.select('B');
  radio.acroField.dict.set(PDFName.of('DV'), radio.acroField.getWidgets()[0].getOnValue());
  const original = await source(fixture), document = await c.importStudioPdf(original, 'Radio.pdf');
  for (const page of [0, 1]) {
    await assert.rejects(c.composeStudioPdf(request(document, original, { pages: [page] })), /单选值|RADIO_VALUE_OUTSIDE/);
    const output = await c.composeStudioPdf(request(document, original, { pages: [page], orphanRadioValue: 'clear' }));
    const native = await PDFDocument.load(await output.source.arrayBuffer()), field = native.getForm().getRadioGroup('Choice');
    assert.equal(field.getSelected(), page === 0 ? undefined : 'B');
    assert.equal(field.acroField.dict.lookup(PDFName.of('DV')).toString(), page === 0 ? field.acroField.getWidgets()[0].getOnValue().toString() : '/Off');
    assert.ok(output.report.valueResolutions.length > 0);
  }
});

test('rejects incompatible names, unsupported native actions, invalid snapshots and cancellation without mutating the active model', async () => {
  const c = runtime(), fixture = await basicPdf({ pages: 2 }), original = await source(fixture), document = await c.importStudioPdf(original, 'Current.pdf');
  const before = JSON.stringify(document), digest = hash(new Uint8Array(await original.arrayBuffer()));
  const controller = new AbortController(); controller.abort();
  await assert.rejects(c.composeStudioPdf(request(document, original, { signal: controller.signal })), (error) => error.name === 'AbortError');
  await assert.rejects(c.composeStudioPdf(request(document, original, { pages: [0, 0] })), /不重复/);
  await assert.rejects(c.composeStudioPdf(request(document, original, { mode: 'merge', pages: [0] })), /合并/);
  const incoming = await hiddenOpaque();
  incoming.pdf.catalog.set(PDFName.of('OpenAction'), incoming.pdf.context.obj({ S: 'JavaScript', JS: incoming.pdf.context.obj('unsafe()') }));
  await assert.rejects(c.composeStudioPdf(request(document, original, { mode: 'merge', pages: [0, 1], insertAt: 2, incoming: { source: await source(incoming), name: 'Actions.pdf', pages: [0] } })), /链接或动作|ACTION/);
  assert.equal(JSON.stringify(document), before); assert.equal(hash(new Uint8Array(await original.arrayBuffer())), digest);
});

test('replaces a designed field on copied pages without leaving dangling old widget annotations', async () => {
  const c = runtime(), fixture = await basicPdf({ pages: 2 }), original = await source(fixture);
  let document = c.pdfCopyPages(await c.importStudioPdf(original, 'Original.pdf'), [0], 2);
  document.fields[0] = { ...document.fields[0], design: { kind: 'text', sourceName: 'Shared', maxLength: 60 },
    widgets: document.fields[0].widgets.map((widget) => ({ ...widget, x: widget.x + 10 })) };
  const replaced = await c.exportStudioPdf(document, original), native = await PDFDocument.load(await replaced.arrayBuffer());
  for (const page of native.getPages()) for (const ref of page.node.Annots().asArray())
    assert.ok(native.context.lookup(ref) instanceof PDFDict, 'Every retained annotation ref resolves to a dictionary.');
  const field = native.getForm().getTextField('Shared');
  assert.equal(field.acroField.getWidgets().length, 2); assert.equal(field.getMaxLength(), 60);
  document = await c.importStudioPdf(replaced, 'Replaced.pdf');
  const output = await c.composeStudioPdf(request(document, replaced, { pages: [2, 0] }));
  assert.equal(output.document.pageCount, 2);
  assert.equal((await PDFDocument.load(await output.source.arrayBuffer())).getForm().getTextField('Shared').acroField.getWidgets().length, 2);
});
