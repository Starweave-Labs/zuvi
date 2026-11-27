import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import test from 'node:test';
import { URL } from 'node:url';
import { pdfTestRuntime } from './studio-pdf-test-runtime.mjs';

const require = createRequire(new URL('../package.json', import.meta.url));
const { PDFDocument, PDFDict, PDFName, PDFString, StandardFonts } = require('pdf-lib');
const name = (value) => PDFName.of(value);
const digest = (value) => createHash('sha256').update(value).digest('hex');
const composer = () => pdfTestRuntime().load('../src/pages/collaboration/office-studio/studio-pdf-compose.ts');

async function fixture(combined = false) {
  const pdf = await PDFDocument.create(), font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = [pdf.addPage([400, 400]), pdf.addPage([400, 400])];
  const field = pdf.getForm().createTextField('form');
  field.setText('Native field');
  field.addToPage(pages[0], { x: 20, y: 320, width: 160, height: 25, font });
  if (!combined) field.addToPage(pages[1], { x: 20, y: 320, width: 160, height: 25, font });
  else {
    const widget = field.acroField.getWidgets()[0], child = field.acroField.Kids().get(0);
    for (const [key, value] of widget.dict.entries()) if (key !== name('Parent')) field.acroField.dict.set(key, value);
    field.acroField.dict.delete(name('Kids'));
    pages[0].node.Annots().set(pages[0].node.Annots().indexOf(child), field.ref);
    pdf.context.delete(child);
    const link = pdf.context.register(pdf.context.obj({ Type: 'Annot', Subtype: 'Link',
      P: pages[1].ref, Rect: [20, 20, 80, 40], NM: PDFString.of('hide-widget'),
      A: { S: 'Hide', T: field.ref, H: true },
    }));
    pages[1].node.addAnnot(link);
  }
  const parent = pdf.context.obj({ Type: 'Annot', Subtype: 'Text', P: pages[0].ref,
    Rect: [200, 200, 222, 222], Contents: PDFString.of('Parent note'), NM: PDFString.of('parent'), F: 4 });
  const parentRef = pdf.context.register(parent);
  const replyRef = pdf.context.register(pdf.context.obj({ Type: 'Annot', Subtype: 'Text',
    P: pages[1].ref, Rect: [200, 200, 222, 222], Contents: PDFString.of('Cross-page reply'),
    NM: PDFString.of('reply'), IRT: parentRef, RT: 'R', F: 32 }));
  const popupRef = pdf.context.register(pdf.context.obj({ Type: 'Annot', Subtype: 'Popup',
    P: pages[1].ref, Rect: [230, 100, 360, 220], NM: PDFString.of('popup'), Parent: parentRef }));
  parent.set(name('Popup'), popupRef);
  pages[0].node.addAnnot(parentRef);
  pages[1].node.addAnnot(replyRef);
  pages[1].node.addAnnot(popupRef);
  return new Uint8Array(await pdf.save({ updateFieldAppearances: false, useObjectStreams: false }));
}
function annotation(pdf, page, nativeName) {
  return pdf.getPages()[page].node.Annots().asArray().map((ref) => ({ ref, dict: pdf.context.lookup(ref) }))
    .find(({ dict }) => dict instanceof PDFDict && dict.lookup(name('NM'))?.decodeText() === nativeName);
}
function thread(pdf, parentPage, replyPage) {
  const parent = annotation(pdf, parentPage, 'parent'), reply = annotation(pdf, replyPage, 'reply'), popup = annotation(pdf, replyPage, 'popup');
  assert.ok(parent && reply && popup);
  assert.equal(reply.dict.get(name('IRT')).toString(), parent.ref.toString());
  assert.equal(parent.dict.get(name('Popup')).toString(), popup.ref.toString());
  assert.equal(popup.dict.get(name('Parent')).toString(), parent.ref.toString());
  for (const [entry, page] of [[parent, parentPage], [reply, replyPage], [popup, replyPage]])
    assert.equal(entry.dict.get(name('P')).toString(), pdf.getPages()[page].ref.toString());
}

test('maps cross-page IRT and Popup references through native extraction with interactive fields', async () => {
  const source = await fixture(), before = digest(source);
  const output = await composer().composePdf({ sources: [{ id: 'source', bytes: source }],
    pages: [{ sourceId: 'source', sourcePage: 1, instanceId: 'second' }, { sourceId: 'source', sourcePage: 0, instanceId: 'first' }] });
  const pdf = await PDFDocument.load(output.bytes);
  thread(pdf, 1, 0);
  assert.equal(pdf.getForm().getTextField('form').getText(), 'Native field');
  assert.equal(pdf.getForm().getTextField('form').acroField.getWidgets().length, 2);
  assert.equal(digest(source), before);
});

test('keeps cross-page threads and Popups inside each selected copy group', async () => {
  const source = await fixture();
  const output = await composer().composePdf({ sources: [{ id: 'source', bytes: source }], pages: [
    { sourceId: 'source', sourcePage: 0, groupId: 'A', instanceId: 'A0' },
    { sourceId: 'source', sourcePage: 1, groupId: 'B', instanceId: 'B1' },
    { sourceId: 'source', sourcePage: 1, groupId: 'A', instanceId: 'A1' },
    { sourceId: 'source', sourcePage: 0, groupId: 'B', instanceId: 'B0' },
  ] });
  const pdf = await PDFDocument.load(output.bytes);
  thread(pdf, 0, 2); thread(pdf, 3, 1);
  assert.notEqual(annotation(pdf, 0, 'parent').ref.toString(), annotation(pdf, 3, 'parent').ref.toString());
  assert.equal(pdf.getForm().getTextField('form').acroField.getWidgets().length, 4);
});

test('preserves annotation identity for cross-page Hide targeting a combined field and widget', async () => {
  const source = await fixture(true);
  const output = await composer().composePdf({ sources: [{ id: 'source', bytes: source }],
    pages: [{ sourceId: 'source', sourcePage: 0, instanceId: 'first' }, { sourceId: 'source', sourcePage: 1, instanceId: 'second' }] });
  const pdf = await PDFDocument.load(output.bytes), field = pdf.getForm().getTextField('form');
  const target = annotation(pdf, 1, 'hide-widget').dict.lookup(name('A')).get(name('T'));
  const widget = pdf.context.lookup(target);
  assert.equal(widget.lookup(name('Subtype')), name('Widget'));
  assert.equal(widget.get(name('Parent')).toString(), field.ref.toString());
  assert.notEqual(target.toString(), field.ref.toString());
  assert.equal(field.getText(), 'Native field');
  thread(pdf, 0, 1);
});

test('still refuses a retained thread whose parent is on an unselected page without changing source bytes', async () => {
  const source = await fixture(), before = digest(source);
  await assert.rejects(composer().composePdf({ sources: [{ id: 'source', bytes: source }],
    pages: [{ sourceId: 'source', sourcePage: 1, instanceId: 'reply-only' }] }),
    (error) => error.code === 'UNSELECTED_INTERACTIVE_REFERENCE');
  assert.equal(digest(source), before);
});
