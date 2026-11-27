import { URL } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { lib, read, edit, codec, nativeRecord, keepOutput } from './studio-pdf-native-color-fixtures.mjs';

const sourcePath = new URL('./fixtures/studio-pdf-native/native-font-source.pdf', import.meta.url);
const key = (value) => lib.PDFName.of(value);

for (const variation of ['cid-map', 'vertical-encoding']) {
  test(`real complete source TTF with ${variation} remains translation-only and retains its exact program, mapping and AP`, async () => {
    const source = new Uint8Array(await readFile(sourcePath)), originalModel = await read.importNativeMarks(source);
    const originalAnnotation = originalModel.annotations.find((entry) => entry.id === 'native-cjk-freetext');
    assert.ok(originalAnnotation);
    assert.equal(originalAnnotation._native.font.fullTrueType, true, 'The baseline is the actual complete Identity-H source font');
    const native = await nativeRecord(source, originalAnnotation._native.name);
    const normal = native.dict.lookup(key('AP'), lib.PDFDict).lookup(key('N'), lib.PDFRawStream);
    const resources = normal.dict.lookup(key('Resources'), lib.PDFDict).clone(native.pdf.context);
    const fonts = resources.lookup(key('Font'), lib.PDFDict).clone(native.pdf.context);
    const sourceFontKey = originalAnnotation._native.font.nativeKey;
    const font = fonts.lookup(key(sourceFontKey), lib.PDFDict).clone(native.pdf.context);
    assert.equal(font.lookup(key('Subtype')), key('Type0'));
    assert.equal(font.lookup(key('Encoding')), key('Identity-H'));
    if (variation === 'vertical-encoding') {
      font.set(key('Encoding'), key('Identity-V'));
    } else {
      const descendant = font.lookup(key('DescendantFonts'), lib.PDFArray).lookup(0, lib.PDFDict).clone(native.pdf.context);
      const match = /<([0-9A-Fa-f]{4,})>\s*Tj/.exec(native.AP);
      assert.ok(match, 'The source uses real encoded CJK glyphs');
      const firstCid = parseInt(match[1].slice(0, 4), 16);
      assert.ok(firstCid > 0);
      const mapping = new Uint8Array(65536 * 2);
      for (let cid = 0; cid < 65536; cid++) { mapping[cid * 2] = cid >> 8; mapping[cid * 2 + 1] = cid & 255; }
      const replacement = firstCid > 1 ? firstCid - 1 : firstCid + 1;
      mapping[firstCid * 2] = replacement >> 8;
      mapping[firstCid * 2 + 1] = replacement & 255;
      descendant.set(key('CIDToGIDMap'), native.pdf.context.register(native.pdf.context.flateStream(mapping)));
      font.set(key('DescendantFonts'), native.pdf.context.obj([native.pdf.context.register(descendant)]));
    }
    fonts.set(key(sourceFontKey), native.pdf.context.register(font));
    resources.set(key('Font'), fonts);
    const bbox = normal.dict.lookup(key('BBox'), lib.PDFArray).asArray().map((value) => value.asNumber());
    const appearance = native.pdf.context.flateStream(native.AP, { Type: 'XObject', Subtype: 'Form', FormType: 1, BBox: bbox, Resources: resources });
    native.dict.set(key('AP'), native.pdf.context.obj({ N: native.pdf.context.register(appearance) }));
    native.dict.set(key('DR'), native.pdf.context.obj({ Font: { [sourceFontKey]: fonts.get(key(sourceFontKey)) } }));
    const bytes = new Uint8Array(await native.pdf.save({ useObjectStreams: false, updateFieldAppearances: false }));
    await keepOutput(`type0-${variation}-source.pdf`, bytes);
    const model = await read.importNativeMarks(bytes), annotation = model.annotations.find((entry) => entry.id === originalAnnotation.id);
    assert.ok(annotation);
    assert.equal(annotation._native.font.fullTrueType, false);
    assert.equal(annotation._native.font.embeddedHash, originalAnnotation._native.font.embeddedHash);
    assert.equal(annotation.capabilities.geometry, true);
    assert.equal(annotation.capabilities.contents, false);
    assert.equal(annotation.capabilities.resize, false);
    assert.equal(annotation.capabilities.appearance, false);
    const snapshot = JSON.stringify(model), [x0, y0, x1, y1] = annotation.rect;
    assert.throws(() => edit.updateMark(model, annotation.id, { contents: '必须保持原字形' }), /does not permit/);
    assert.throws(() => edit.updateMark(model, annotation.id, { rect: [x0, y0, x1 + 10, y1] }), /only permits translation/);
    assert.equal(JSON.stringify(model), snapshot);
    const rect = [x0 + 8, y0 + 5, x1 + 8, y1 + 5];
    const moved = edit.updateMark(model, annotation.id, { rect }, { now: '2026-11-27T11:00:00.000Z' });
    const saved = await codec.exportNativeMarks(bytes, moved), reopened = await nativeRecord(saved, originalAnnotation._native.name);
    assert.equal(reopened.AP, native.AP);
    assert.deepEqual(reopened.rect, rect);
    const savedFont = reopened.dict.lookup(key('AP'), lib.PDFDict).lookup(key('N'), lib.PDFRawStream)
      .dict.lookup(key('Resources'), lib.PDFDict).lookup(key('Font'), lib.PDFDict).lookup(key(sourceFontKey), lib.PDFDict);
    assert.equal(savedFont.toString(), font.toString());
    const reopenedModel = await read.importNativeMarks(saved);
    assert.equal(reopenedModel.annotations.find((entry) => entry.id === annotation.id)._native.font.embeddedHash, originalAnnotation._native.font.embeddedHash);
    await keepOutput(`type0-${variation}-retained.pdf`, saved);
  });
}
