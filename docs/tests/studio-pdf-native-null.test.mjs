import { URL } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { lib } from './studio-pdf-native-runtime.mjs';
import { importNativeMarks, updateMark, exportNativeMarks, nativeMarksInternals } from './studio-pdf-native-runtime.mjs';
import { mapNativePages, exportMappedNativeMarks } from './studio-pdf-native-runtime.mjs';

const { PDFDocument, PDFName, PDFNull } = lib;
const n = (value) => PDFName.of(value);
const fixture = () => readFile(new URL('./fixtures/studio-pdf-native/native-marks-source.pdf', import.meta.url));
const modify = async (change) => {
  const pdf = await PDFDocument.load(await fixture());
  change(pdf);
  return new Uint8Array(await pdf.save({ updateFieldAppearances: false, useObjectStreams: false }));
};
const freeText = (pdf) => pdf.getPages()[0].node.Annots().asArray().map((ref) => pdf.context.lookup(ref)).find((dict) => dict.lookup(n('NM'))?.decodeText() === 'source-free-text');

test('direct and indirect dictionary null mean absent for AP/actions/rich text/intent/XFA', async () => {
  const bytes = await modify((pdf) => {
    const dict = freeText(pdf), indirect = pdf.context.register(PDFNull);
    for (const key of ['A', 'RC', 'IT', 'AP']) dict.set(n(key), PDFNull);
    for (const key of ['AA', 'OC', 'CL', 'BE', 'DS']) dict.set(n(key), indirect);
    pdf.catalog.set(n('AcroForm'), pdf.context.obj({ Fields: [], XFA: indirect }));
  });
  const base = await importNativeMarks(bytes), mark = base.annotations.find((annotation) => annotation._native.name === 'source-free-text');
  assert.equal(mark.capabilities.contents, true);
  assert.equal(mark.capabilities.appearance, true);
  assert.equal(base.signed, false);
  const saved = await exportNativeMarks(bytes, updateMark(base, mark.id, { contents: 'Null is absent, with real native AP now.' }));
  assert.equal((await importNativeMarks(saved)).annotations.find((annotation) => annotation.id === mark.id).contents, 'Null is absent, with real native AP now.');
});

for (const indirect of [false, true]) {
  test('blank signature V ' + (indirect ? 'indirect' : 'direct') + ' null does not mark the source signed', async () => {
    const bytes = await modify((pdf) => {
      const empty = indirect ? pdf.context.register(PDFNull) : PDFNull;
      const field = pdf.context.register(pdf.context.obj({ FT: 'Sig', T: lib.PDFString.of('Unfilled signature'), V: empty }));
      pdf.catalog.set(n('AcroForm'), pdf.context.obj({ Fields: [field], XFA: empty }));
    });
    const base = await importNativeMarks(bytes);
    assert.equal(base.signed, false);
    const mark = base.annotations.find((annotation) => annotation._native.name === 'source-free-text');
    assert.ok(await exportNativeMarks(bytes, updateMark(base, mark.id, { contents: 'Allowed with an unfilled signature field' })));
  });
}

test('array null elements remain null while the array-valued dictionary key remains present', async () => {
  const pdf = await PDFDocument.create(), dict = pdf.context.obj({ D: [0, null, 25, null], Empty: pdf.context.register(PDFNull) });
  assert.equal(nativeMarksInternals.get(dict, 'Empty'), undefined);
  assert.equal(nativeMarksInternals.raw(dict, 'Empty'), undefined);
  assert.equal(nativeMarksInternals.has(dict, 'D'), true);
  assert.deepEqual(nativeMarksInternals.array(nativeMarksInternals.get(dict, 'D')), [0, null, 25, null]);
});

test('GoTo XYZ nullable x/y/zoom survives a native copy group without null normalization inside arrays', async () => {
  const bytes = await modify((pdf) => {
    const link = pdf.getPages()[0].node.Annots().asArray().map((ref) => pdf.context.lookup(ref)).find((dict) => dict.lookup(n('NM'))?.decodeText() === 'source-internal-link');
    link.lookup(n('A')).set(n('D'), pdf.context.obj([pdf.getPages()[1].ref, n('XYZ'), null, null, null]));
  });
  const base = await importNativeMarks(bytes), operation = mapNativePages(base, [
    { id: 'nullable-copy-one', sourcePage: 0, copyGroup: 'nullable-copy' }, { id: 'nullable-copy-two', sourcePage: 1, copyGroup: 'nullable-copy' },
    { id: base.pages[0].id, sourcePage: 0 }, { id: base.pages[1].id, sourcePage: 1 },
  ]);
  const saved = await exportMappedNativeMarks(bytes, operation), pdf = await PDFDocument.load(saved);
  const link = pdf.getPages()[0].node.Annots().asArray().map((ref) => pdf.context.lookup(ref)).find((dict) => dict.lookup(n('Subtype')) === n('Link') && dict.lookup(n('A'))?.lookup(n('S')) === n('GoTo'));
  const target = link.lookup(n('A')).lookup(n('D'));
  assert.equal(target.get(0).toString(), pdf.getPages()[1].ref.toString());
  for (let index = 2; index <= 4; index++) assert.strictEqual(target.get(index), PDFNull);
});
