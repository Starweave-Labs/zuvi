import { Buffer } from 'node:buffer';
import { URL } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { lib, sha256 } from './studio-pdf-native-runtime.mjs';
import {
  importNativeMarks, updateMark, addMark, addReply, removeMark, exportNativeMarks,
} from './studio-pdf-native-runtime.mjs';
import {
  mapNativePages, exportMappedNativeMarks, updateMappedMark, addMappedReply, removeMappedMark,
} from './studio-pdf-native-runtime.mjs';

const { PDFDocument, PDFName, decodePDFRawStream } = lib;
const n = (value) => PDFName.of(value);
const fixture = () => readFile(new URL('./fixtures/studio-pdf-native/native-marks-source.pdf', import.meta.url));
const byName = (model, name) => model.annotations.find((annotation) => annotation._native?.name === name);
const nativeByName = (pdf, name) => pdf.getPages().flatMap((page) => page.node.Annots().asArray())
  .map((ref) => pdf.context.lookup(ref)).find((dict) => dict.lookup(n('NM'))?.decodeText() === name);
const appearanceText = (dict) => Buffer.from(decodePDFRawStream(dict.lookup(n('AP')).lookup(n('N'))).decode()).toString('latin1');
const saveFixtureEdit = async (edit) => {
  const pdf = await PDFDocument.load(await fixture());
  await edit(pdf);
  return new Uint8Array(await pdf.save({ updateFieldAppearances: false, useObjectStreams: false }));
};
const movePopupToPageTwo = async () => saveFixtureEdit((pdf) => {
  const pages = pdf.getPages(), annots = pages[0].node.Annots();
  const slot = annots.asArray().findIndex((ref) => pdf.context.lookup(ref).lookup(n('Subtype')) === n('Popup'));
  const ref = annots.get(slot), popup = pdf.context.lookup(ref);
  annots.remove(slot); pages[1].node.Annots().push(ref); popup.set(n('P'), pages[1].ref);
});

test('explicit QuadPoints/InkList shape changes repaint AP even when the rectangle is unchanged', async () => {
  const bytes = await fixture(), base = await importNativeMarks(bytes);
  const highlight = byName(base, 'source-highlight'), ink = byName(base, 'source-ink');
  let edited = updateMark(base, highlight.id, { quadPoints: highlight.quadPoints.map((value, index) => index % 2 ? value : value > 100 ? value - 35 : value) });
  edited = updateMark(edited, ink.id, { inkList: ink.inkList.map((stroke, index) => index ? stroke : stroke.map((value, axis) => axis === 3 ? value - 20 : value)) });
  const reopened = await importNativeMarks(await exportNativeMarks(bytes, edited));
  assert.notEqual(byName(reopened, 'source-highlight')._native.appearanceHash, highlight._native.appearanceHash);
  assert.notEqual(byName(reopened, 'source-ink')._native.appearanceHash, ink._native.appearanceHash);
});

test('complex marker AP permits translation but cannot be silently replaced by a shape edit', async () => {
  const bytes = await saveFixtureEdit((pdf) => {
    const stream = nativeByName(pdf, 'source-highlight').lookup(n('AP')).lookup(n('N'));
    stream.dict.set(n('Matrix'), pdf.context.obj([0, 1, -1, 0, 20, 0]));
  });
  const base = await importNativeMarks(bytes), mark = byName(base, 'source-highlight');
  assert.equal(mark.capabilities.geometry, true);
  assert.equal(mark.capabilities.appearance, false);
  assert.throws(() => updateMark(base, mark.id, { quadPoints: mark.quadPoints.map((value, index) => index === 2 ? value - 20 : value) }), /translation only/);
  const moved = updateMark(base, mark.id, { rect: mark.rect.map((value, index) => value + (index % 2 ? 4 : 8)) });
  const reopened = await importNativeMarks(await exportNativeMarks(bytes, moved));
  assert.equal(byName(reopened, 'source-highlight')._native.appearanceHash, mark._native.appearanceHash);
});

test('DA, date and state strings use ASCII PDF syntax while author and body remain Unicode text', async () => {
  const bytes = await fixture(), model = await importNativeMarks(bytes), mark = byName(model, 'source-free-text');
  const saved = await exportNativeMarks(bytes, updateMark(model, mark.id, { contents: 'ASCII appearance syntax' }));
  const pdf = await PDFDocument.load(saved), dict = nativeByName(pdf, 'source-free-text');
  assert.ok(dict.lookup(n('DA')) instanceof lib.PDFString);
  assert.ok(dict.lookup(n('M')) instanceof lib.PDFString);
  assert.match(dict.lookup(n('DA')).asString(), /^\/FT 12 Tf /);
  assert.match(dict.lookup(n('M')).asString(), /^D:\d{14}Z$/);
});

test('legacy Border dash arrays are read and rebuilt as real dashed BS and AP', async () => {
  const bytes = await saveFixtureEdit((pdf) => {
    const square = nativeByName(pdf, 'source-square');
    square.delete(n('BS')); square.set(n('Border'), pdf.context.obj([0, 0, 2, [5, 2]]));
  });
  const base = await importNativeMarks(bytes), square = byName(base, 'source-square');
  assert.deepEqual(square.border, { width: 2, style: 'D', dash: [5, 2] });
  const saved = await exportNativeMarks(bytes, updateMark(base, square.id, { fill: [0.8, 1, 0.8] }));
  const reopened = await importNativeMarks(saved);
  assert.deepEqual(byName(reopened, 'source-square').border, { width: 2, style: 'D', dash: [5, 2] });
  assert.match(appearanceText(nativeByName(await PDFDocument.load(saved), 'source-square')), /\[5 2\] 0 d/);
});

test('actual AP font size wins over DA and simple text edits preserve the original text baseline', async () => {
  const bytes = await fixture(), base = await importNativeMarks(bytes), freeText = byName(base, 'source-free-text');
  const saved = await exportNativeMarks(bytes, updateMark(base, freeText.id, { contents: 'Baseline is preserved' }));
  const sourceFirst = freeText._native.textLayout.firstPosition;
  const after = byName(await importNativeMarks(saved), 'source-free-text')._native.textLayout.firstPosition;
  assert.deepEqual(after, sourceFirst);
  const changed = await saveFixtureEdit((pdf) => {
    const dict = nativeByName(pdf, 'source-free-text'), old = dict.lookup(n('AP')).lookup(n('N'));
    dict.set(n('AP'), pdf.context.obj({ N: pdf.context.register(pdf.context.flateStream('q BT /F1 20 Tf 0.1 0.15 0.2 rg 1 0 0 1 2 24 Tm (Source FreeText) Tj ET Q', {
      Type: 'XObject', Subtype: 'Form', BBox: [0, 0, 300, 45], Resources: old.dict.lookup(n('Resources')),
    })) }));
  });
  const model = await importNativeMarks(changed);
  assert.equal(byName(model, 'source-free-text').font.size, 20);
  const resaved = await exportNativeMarks(changed, updateMark(model, byName(model, 'source-free-text').id, { contents: 'AP font twenty' }));
  assert.equal(byName(await importNativeMarks(resaved), 'source-free-text').font.size, 20);
});

test('comments/literal strings cannot forge an appearance font operator', async () => {
  const bytes = await saveFixtureEdit((pdf) => {
    const dict = nativeByName(pdf, 'source-free-text'), old = dict.lookup(n('AP')).lookup(n('N'));
    dict.set(n('AP'), pdf.context.obj({ N: pdf.context.register(pdf.context.flateStream('% /F1 90 Tf\nq BT /F1 12 Tf 0 0 0 rg 1 0 0 1 2 31 Tm (literal /F1 99 Tf) Tj ET Q', {
      Type: 'XObject', Subtype: 'Form', BBox: [0, 0, 300, 45], Resources: old.dict.lookup(n('Resources')),
    })) }));
  });
  assert.equal(byName(await importNativeMarks(bytes), 'source-free-text').font.size, 12);
});

test('FreeText Rotate/Matrix, DS and R/D states retain native appearance and reject regeneration', async () => {
  const bytes = await saveFixtureEdit((pdf) => {
    const dict = nativeByName(pdf, 'source-free-text'), ap = dict.lookup(n('AP')), stream = ap.lookup(n('N'));
    stream.dict.set(n('Matrix'), pdf.context.obj([0, 1, -1, 0, 45, 0])); dict.set(n('Rotate'), pdf.context.obj(90));
    dict.set(n('DS'), lib.PDFString.of('font: 20pt serif; color:#123456'));
    ap.set(n('R'), ap.get(n('N'))); ap.set(n('D'), ap.get(n('N')));
  });
  const base = await importNativeMarks(bytes), freeText = byName(base, 'source-free-text');
  assert.equal(freeText.capabilities.geometry, true);
  assert.equal(freeText.capabilities.contents, false);
  assert.equal(freeText.capabilities.appearance, false);
  assert.throws(() => updateMark(base, freeText.id, { contents: 'loses rotation' }), /does not permit/);
  const changed = updateMark(base, byName(base, 'source-ink').id, { contents: 'unrelated shape comment' });
  const saved = await exportNativeMarks(bytes, changed);
  const sourceDict = nativeByName(await PDFDocument.load(bytes), 'source-free-text'), savedDict = nativeByName(await PDFDocument.load(saved), 'source-free-text');
  assert.equal(savedDict.lookup(n('Rotate')).toString(), '90');
  assert.equal(savedDict.lookup(n('DS')).decodeText(), sourceDict.lookup(n('DS')).decodeText());
  for (const key of ['N', 'R', 'D']) {
    const sourceAP = sourceDict.lookup(n('AP')).lookup(n(key)), savedAP = savedDict.lookup(n('AP')).lookup(n(key));
    assert.equal(sha256(decodePDFRawStream(savedAP).decode()), sha256(decodePDFRawStream(sourceAP).decode()));
    assert.equal(savedAP.dict.lookup(n('Matrix')).toString(), sourceAP.dict.lookup(n('Matrix')).toString());
  }
});

test('public addMark and forged new replies cannot bypass the native parent reply permission', async () => {
  const bytes = await fixture(), base = await importNativeMarks(bytes), parent = byName(base, 'action-bearing-note');
  assert.throws(() => addMark(base, { id: 'bypass-reply', kind: 'note', pageId: parent.pageId, rect: [430, 550, 448, 568], inReplyTo: parent.id, replyType: 'R' }), /does not permit/);
  const valid = addReply(base, byName(base, 'source-note').id, { id: 'forged-reply', contents: 'body', author: 'Editor' });
  const forged = { ...valid, annotations: valid.annotations.map((annotation) => annotation.id === 'forged-reply' ? { ...annotation, inReplyTo: parent.id } : annotation) };
  await assert.rejects(exportNativeMarks(bytes, forged), /parent does not permit/);
  const fontParent = byName(base, 'source-embedded-free-text');
  assert.equal(fontParent.capabilities.contents, false);
  const allowed = addReply(base, fontParent.id, { id: 'font-safe-reply', contents: 'Comment without changing source text' });
  const reopened = await importNativeMarks(await exportNativeMarks(bytes, allowed));
  assert.equal(byName(reopened, 'source-embedded-free-text')._native.appearanceHash, fontParent._native.appearanceHash);
});

test('native page Hide action dependencies refuse deletion before model commit and at export', async () => {
  const bytes = await saveFixtureEdit((pdf) => {
    const page = pdf.getPages()[0], ref = page.node.Annots().asArray().find((entry) => pdf.context.lookup(entry).lookup(n('NM'))?.decodeText() === 'source-note');
    page.node.set(n('AA'), pdf.context.obj({ PO: { S: 'Hide', T: ref, H: true } }));
  });
  const base = await importNativeMarks(bytes), parent = byName(base, 'source-note'), before = JSON.stringify(base);
  assert.throws(() => removeMark(base, parent.id), /retained native action/);
  assert.equal(JSON.stringify(base), before);
  const forged = { ...base, deleted: [parent.id], annotations: base.annotations.filter((annotation) => annotation.id !== parent.id) };
  await assert.rejects(exportNativeMarks(bytes, forged), /page action/);
});

test('mapped command ledger permits independent copy edits/replies/deletes before the first save', async () => {
  const bytes = await fixture(), base = await importNativeMarks(bytes);
  let operation = mapNativePages(base, [
    { id: 'draft-copy-one', sourcePage: 0, copyGroup: 'draft-copy' },
    { id: 'draft-copy-two', sourcePage: 1, copyGroup: 'draft-copy' },
    { id: base.pages[0].id, sourcePage: 0 }, { id: base.pages[1].id, sourcePage: 1 },
  ]);
  const copiedText = operation.model.annotations.find((annotation) => annotation.page === 0 && annotation.originId === byName(base, 'source-free-text').id);
  const copiedNote = operation.model.annotations.find((annotation) => annotation.page === 0 && annotation.originId === byName(base, 'source-note').id);
  const copiedInk = operation.model.annotations.find((annotation) => annotation.page === 0 && annotation.originId === byName(base, 'source-ink').id);
  operation = updateMappedMark(operation, copiedText.id, { contents: 'Draft copy only' });
  operation = addMappedReply(operation, copiedNote.id, { id: 'draft-copy-reply', contents: 'Copied discussion', author: 'Editor' });
  operation = removeMappedMark(operation, copiedInk.id);
  const reopened = await importNativeMarks(await exportMappedNativeMarks(bytes, operation));
  assert.equal(reopened.annotations.find((annotation) => annotation.id === copiedText.id).contents, 'Draft copy only');
  assert.equal(byName(reopened, 'source-free-text').contents, 'Source FreeText');
  assert.equal(reopened.annotations.find((annotation) => annotation.id === 'draft-copy-reply').inReplyTo, copiedNote.id);
  assert.equal(reopened.annotations.some((annotation) => annotation.id === copiedInk.id), false);
  assert.ok(byName(reopened, 'source-ink'));
});

test('mapped opaque IRT tampering is rejected instead of overriding native Group relationships', async () => {
  const bytes = await fixture(), base = await importNativeMarks(bytes);
  const operation = mapNativePages(base, base.pages.map((page, sourcePage) => ({ id: page.id, sourcePage })));
  const group = byName(base, 'opaque-group'), locked = byName(base, 'locked-square');
  operation.model = { ...operation.model, annotations: operation.model.annotations.map((annotation) => annotation.id === group.id ? { ...annotation, inReplyTo: locked.id } : annotation) };
  await assert.rejects(exportMappedNativeMarks(bytes, operation), /explicit command ledger/);
});

test('cross-page Popup extraction clears the retained root pointer and removes a Popup with no owner', async () => {
  const bytes = await movePopupToPageTwo(), base = await importNativeMarks(bytes);
  const _parent = byName(base, 'source-free-text'), popup = byName(base, 'source-popup');
  const first = mapNativePages(base, [{ id: base.pages[0].id, sourcePage: 0 }]);
  const extracted = await exportMappedNativeMarks(bytes, first);
  const pdf = await PDFDocument.load(extracted);
  assert.equal(nativeByName(pdf, 'source-free-text').has(n('Popup')), false);
  assert.equal((await importNativeMarks(extracted)).annotations.some((annotation) => annotation.id === popup.id), false);
  const cleaned = removeMark(base, byName(base, 'source-nested-reply').id);
  const second = mapNativePages(cleaned, [{ id: base.pages[1].id, sourcePage: 1 }]);
  assert.equal(second.removedPopups.length, 1);
  const reopened = await importNativeMarks(await exportMappedNativeMarks(bytes, second));
  assert.equal(reopened.annotations.some((annotation) => annotation._native.name === 'source-popup'), false);
});

test('a copied root never borrows the original cross-page Popup; a copied group owns its own Popup', async () => {
  const bytes = await movePopupToPageTwo(), base = await importNativeMarks(bytes);
  const ownerOnly = mapNativePages(base, [
    { id: 'owner-only-copy', sourcePage: 0, copyGroup: 'owner-only' },
    { id: base.pages[0].id, sourcePage: 0 }, { id: base.pages[1].id, sourcePage: 1 },
  ]);
  const copied = ownerOnly.model.annotations.find((annotation) => annotation.page === 0 && annotation.originId === byName(base, 'source-free-text').id);
  assert.equal(copied.popupId, undefined);
  const saved = await exportMappedNativeMarks(bytes, ownerOnly), pdf = await PDFDocument.load(saved);
  const native = pdf.getPages()[0].node.Annots().asArray().map((ref) => pdf.context.lookup(ref)).find((dict) => dict.lookup(n('ZuviAnnotationId'))?.decodeText() === copied.id);
  assert.equal(native.has(n('Popup')), false);
  const full = mapNativePages(base, [
    { id: 'full-copy-one', sourcePage: 0, copyGroup: 'full-copy' }, { id: 'full-copy-two', sourcePage: 1, copyGroup: 'full-copy' },
    { id: base.pages[0].id, sourcePage: 0 }, { id: base.pages[1].id, sourcePage: 1 },
  ]);
  const reopened = await importNativeMarks(await exportMappedNativeMarks(bytes, full));
  const root = reopened.annotations.find((annotation) => annotation.originId === byName(base, 'source-free-text').id);
  const popup = reopened.annotations.find((annotation) => annotation.id === root.popupId);
  assert.equal(popup.popupOf, root.id);
  assert.equal(popup.pageId, 'full-copy-two');
});
