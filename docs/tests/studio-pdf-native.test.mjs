import { URL } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  importNativeMarks, inspectNativePdf, updateMark, addMark, addReply,
  setReviewState, discussionState, removeMark, exportNativeMarks, previewNativeMarks,
} from './studio-pdf-native-runtime.mjs';
import { sha256, lib } from './studio-pdf-native-runtime.mjs';

const fixture = (name = 'native-marks-source.pdf') => readFile(new URL('./fixtures/studio-pdf-native/' + name, import.meta.url));
const byName = (model, name) => {
  const result = model.annotations.find((entry) => entry._native?.name === name);
  assert.ok(result, 'Missing source annotation: ' + name);
  return result;
};
const byId = (model, id) => {
  const result = model.annotations.find((entry) => entry.id === id);
  assert.ok(result, 'Missing annotation: ' + id);
  return result;
};

test('native import reads the supported subtypes, offset page coordinates and real IRT graph', async () => {
  const model = await importNativeMarks(await fixture());
  assert.equal(model.pages.length, 2);
  assert.equal(model.pages[1].rotation, 90);
  assert.equal(model.pages[1].crop.x, 35);
  assert.equal(model.pages[1].crop.y, 45);
  assert.deepEqual(new Set(model.annotations.filter((entry) => entry.kind !== 'opaque').map((entry) => entry.kind)), new Set(['freeText', 'note', 'highlight', 'underline', 'strikeOut', 'squiggly', 'square', 'ink']));
  const freeText = byName(model, 'source-free-text');
  assert.equal(freeText.font.family, 'Helvetica');
  assert.equal(freeText.font.size, 12);
  assert.equal(freeText.capabilities.contents, true);
  assert.equal(byName(model, 'source-reply').inReplyTo, freeText.id);
  assert.equal(byName(model, 'source-nested-reply').inReplyTo, byName(model, 'source-reply').id);
  assert.equal(byName(model, 'source-nested-reply').page, 1);
  assert.equal(byName(model, 'source-reply').createdAt, '2026-11-26T07:30:00.000Z');
  assert.equal(byName(model, 'source-reply').creationPdf, "D:20261126153000+08'00'");
  assert.equal(discussionState(model, freeText.id), 'resolved');
});

test('unchanged imports have deterministic identity and return every original byte', async () => {
  const bytes = await fixture();
  const first = await importNativeMarks(bytes), second = await importNativeMarks(bytes);
  assert.deepEqual(first.pages.map((entry) => entry.id), second.pages.map((entry) => entry.id));
  assert.deepEqual(first.annotations.map((entry) => entry.id), second.annotations.map((entry) => entry.id));
  assert.strictEqual(await exportNativeMarks(bytes, first), bytes);
});

test('FreeText native format, text and rectangle survive two reopen cycles without changing page Contents', async () => {
  const source = await fixture();
  const initial = await inspectNativePdf(source);
  const id = byName(initial, 'source-free-text').id;
  const edited = updateMark(initial, id, {
    contents: 'Edited native FreeText\nSecond line', rect: [50, 560, 370, 615],
    font: { family: 'Courier', size: 13, color: [0.2, 0.1, 0.5] }, align: 1,
    color: [0.98, 0.95, 1], border: { width: 1.5, style: 'D', dash: [4, 2] },
  });
  const saved = await exportNativeMarks(source, edited);
  const reopened = await inspectNativePdf(saved);
  const native = byId(reopened, id);
  assert.equal(native.contents, 'Edited native FreeText\nSecond line');
  assert.equal(native.font.family, 'Courier');
  assert.equal(native.font.size, 13);
  assert.equal(native.align, 1);
  assert.deepEqual(native.rect, [50, 560, 370, 615]);
  assert.deepEqual(native.border, { width: 1.5, style: 'D', dash: [4, 2] });
  assert.deepEqual(reopened.contentHashes, initial.contentHashes);
  assert.notEqual(native._native.appearanceHash, byId(initial, id)._native.appearanceHash);
  const second = updateMark(reopened, id, { contents: 'Second native save' }, { now: '2026-11-27T01:00:00.000Z' });
  const reopenedAgain = await inspectNativePdf(await exportNativeMarks(saved, second));
  assert.equal(byId(reopenedAgain, id).contents, 'Second native save');
  assert.deepEqual(reopenedAgain.pages.map((entry) => entry.id), initial.pages.map((entry) => entry.id));
  assert.deepEqual(reopenedAgain.contentHashes, initial.contentHashes);
});

test('source AP, embedded font, opaque marks and both native links remain unchanged during unrelated edits', async () => {
  const source = await fixture();
  const initial = await importNativeMarks(source);
  const edited = updateMark(initial, byName(initial, 'source-free-text').id, { contents: 'Changed text' });
  const saved = await exportNativeMarks(source, edited);
  const reopened = await importNativeMarks(saved);
  for (const name of ['source-embedded-free-text', 'source-highlight', 'source-ink', 'opaque-stamp', 'locked-square', 'source-note']) {
    assert.equal(byName(reopened, name)._native.appearanceHash, byName(initial, name)._native.appearanceHash, name);
  }
  assert.equal(byName(reopened, 'source-embedded-free-text')._native.font.embeddedHash, byName(initial, 'source-embedded-free-text')._native.font.embeddedHash);
  const pdfBefore = await lib.PDFDocument.load(source), pdfAfter = await lib.PDFDocument.load(saved);
  const native = (pdf, nm) => pdf.getPages().flatMap((page) => page.node.Annots().asArray()).map((ref) => pdf.context.lookup(ref)).find((dict) => dict.lookup(lib.PDFName.of('NM'))?.decodeText() === nm);
  for (const name of ['source-internal-link', 'source-external-link', 'action-bearing-note']) {
    assert.equal(native(pdfAfter, name).lookup(lib.PDFName.of('A')).toString(), native(pdfBefore, name).lookup(lib.PDFName.of('A')).toString());
  }
});

test('all four text markers retain exact QuadPoints, color and zero opacity as native annotations', async () => {
  const source = await fixture();
  let model = await importNativeMarks(source);
  const quads = [60, 175, 245, 178, 60, 155, 245, 158];
  for (const [index, kind] of ['highlight', 'underline', 'strikeOut', 'squiggly'].entries()) {
    model = addMark(model, { id: 'new-' + kind, kind, pageId: model.pages[0].id, rect: [55, 150 - index * 25, 250, 180 - index * 25], quadPoints: quads.map((value, axis) => axis % 2 ? value - index * 25 : value), color: [0.2, 0.6, 0.4], opacity: index ? 0.45 : 0 });
  }
  const reopened = await importNativeMarks(await exportNativeMarks(source, model));
  for (const [index, kind] of ['highlight', 'underline', 'strikeOut', 'squiggly'].entries()) {
    const mark = byId(reopened, 'new-' + kind);
    assert.equal(mark.kind, kind);
    assert.deepEqual(mark.quadPoints, quads.map((value, axis) => axis % 2 ? value - index * 25 : value));
    assert.deepEqual(mark.color, [0.2, 0.6, 0.4]);
    assert.equal(mark.opacity, index ? 0.45 : 0);
    assert.ok(mark._native.appearanceHash);
  }
});

test('geometry movement translates native QuadPoints and all InkList strokes exactly once', async () => {
  const source = await fixture();
  const model = await importNativeMarks(source);
  let edited = model;
  for (const name of ['source-highlight', 'source-ink']) {
    const mark = byName(edited, name);
    edited = updateMark(edited, mark.id, { rect: mark.rect.map((value, index) => value + (index % 2 ? 9 : 17)) });
  }
  const reopened = await importNativeMarks(await exportNativeMarks(source, edited));
  const first = byName(model, 'source-highlight'), moved = byName(reopened, 'source-highlight');
  assert.deepEqual(moved.quadPoints, first.quadPoints.map((value, index) => value + (index % 2 ? 9 : 17)));
  assert.equal(moved._native.appearanceHash, first._native.appearanceHash);
  assert.deepEqual(byName(reopened, 'source-ink').inkList, byName(model, 'source-ink').inkList.map((stroke) => stroke.map((value, index) => value + (index % 2 ? 9 : 17))));
  assert.equal(byName(reopened, 'source-ink')._native.appearanceHash, byName(model, 'source-ink')._native.appearanceHash);
});

test('editing one mark isolates a shared source AP without changing the passive Group appearance', async () => {
  const source = await fixture();
  const model = await importNativeMarks(source);
  assert.equal(byName(model, 'source-square')._native.appearanceHash, byName(model, 'opaque-group')._native.appearanceHash);
  const edited = updateMark(model, byName(model, 'source-square').id, { color: [0.6, 0.15, 0.2], fill: [1, 0.9, 0.85], opacity: 0.4, border: { width: 3, style: 'D', dash: [5, 3] } });
  const reopened = await importNativeMarks(await exportNativeMarks(source, edited));
  assert.notEqual(byName(reopened, 'source-square')._native.appearanceHash, byName(model, 'source-square')._native.appearanceHash);
  assert.equal(byName(reopened, 'opaque-group')._native.appearanceHash, byName(model, 'opaque-group')._native.appearanceHash);
  assert.deepEqual(byName(reopened, 'source-square').border, { width: 3, style: 'D', dash: [5, 3] });
});

test('native reply authors, timestamps, nesting and resolve/reopen state survive repeated saves', async () => {
  const source = await fixture();
  let model = await importNativeMarks(source);
  const parent = byName(model, 'source-note');
  model = addReply(model, parent.id, { id: 'new-reply', contents: '原生回复', author: '审阅甲' }, { now: '2026-11-27T02:03:04.000Z' });
  model = addReply(model, 'new-reply', { id: 'new-nested-reply', contents: 'Nested reply', author: 'Reviewer D', pageId: model.pages[1].id }, { now: '2026-11-27T02:04:00.000Z' });
  model = setReviewState(model, parent.id, 'resolved', { id: 'resolved-state', author: '审阅乙', now: '2026-11-27T02:05:00.000Z' });
  const saved = await exportNativeMarks(source, model);
  const reopened = await importNativeMarks(saved);
  assert.equal(byId(reopened, 'new-reply').author, '审阅甲');
  assert.equal(byId(reopened, 'new-reply').contents, '原生回复');
  assert.equal(byId(reopened, 'new-reply').creationPdf, 'D:20261127020304Z');
  assert.equal(byId(reopened, 'new-nested-reply').inReplyTo, 'new-reply');
  assert.equal(byId(reopened, 'new-nested-reply').page, 1);
  assert.equal(discussionState(reopened, parent.id), 'resolved');
  const open = setReviewState(reopened, parent.id, 'open', { id: 'open-state', author: 'Reviewer E', now: '2026-11-27T02:06:00.000Z' });
  const again = await importNativeMarks(await exportNativeMarks(saved, open));
  assert.equal(discussionState(again, parent.id), 'open');
  assert.deepEqual(byId(again, 'open-state').review, { model: 'Review', state: 'None' });
});

test('native parent deletion removes its R-reply subtree and owned Popup, including cross-page replies', async () => {
  const source = await fixture();
  const model = await importNativeMarks(source);
  const removed = removeMark(model, byName(model, 'source-free-text').id);
  assert.equal(removed.annotations.some((entry) => entry._native?.name === 'source-popup'), false);
  const reopened = await importNativeMarks(await exportNativeMarks(source, removed));
  for (const name of ['source-free-text', 'source-popup', 'source-reply', 'source-nested-reply', 'source-state']) assert.equal(reopened.annotations.some((entry) => entry._native?.name === name), false, name);
  assert.equal(byName(reopened, 'source-ink')._native.appearanceHash, byName(model, 'source-ink')._native.appearanceHash);
});

test('deleting an R reply removes its nested replies while keeping the parent and independent state', async () => {
  const source = await fixture();
  const model = await importNativeMarks(source);
  const removed = removeMark(model, byName(model, 'source-reply').id);
  const reopened = await importNativeMarks(await exportNativeMarks(source, removed));
  assert.ok(byName(reopened, 'source-free-text'));
  assert.ok(byName(reopened, 'source-state'));
  assert.equal(reopened.annotations.some((entry) => entry._native?.name === 'source-reply'), false);
  assert.equal(reopened.annotations.some((entry) => entry._native?.name === 'source-nested-reply'), false);
});

test('Group dependencies, unknown native actions and locked marks refuse edits/deletions without mutation', async () => {
  const model = await importNativeMarks(await fixture());
  const before = JSON.stringify(model);
  assert.throws(() => removeMark(model, byName(model, 'source-square').id), /Group|locked/);
  assert.throws(() => updateMark(model, byName(model, 'locked-square').id, { rect: [350, 350, 450, 420] }), /does not permit/);
  assert.throws(() => updateMark(model, byName(model, 'action-bearing-note').id, { contents: 'changed' }), /does not permit/);
  assert.equal(byName(model, 'opaque-group').replyType, 'Group');
  assert.equal(JSON.stringify(model), before);
});

test('unreconstructable subset source font retains its AP and allows translation while rejecting content or resize', async () => {
  const source = await fixture();
  const model = await importNativeMarks(source);
  const embedded = byName(model, 'source-embedded-free-text');
  assert.equal(embedded.capabilities.contents, false);
  assert.equal(embedded.capabilities.resize, false);
  assert.throws(() => updateMark(model, embedded.id, { contents: 'wrong-font replacement' }), /does not permit/);
  assert.throws(() => updateMark(model, embedded.id, { rect: [50, 465, 310, 505] }), /only permits translation/);
  const moved = updateMark(model, embedded.id, { rect: [55, 465, 305, 505] });
  const reopened = await importNativeMarks(await exportNativeMarks(source, moved));
  assert.equal(byName(reopened, 'source-embedded-free-text')._native.appearanceHash, embedded._native.appearanceHash);
  assert.equal(byName(reopened, 'source-embedded-free-text')._native.font.embeddedHash, embedded._native.font.embeddedHash);
});

test('font coverage and FreeText fitting failures leave source bytes and the accepted model unchanged', async () => {
  const source = await fixture();
  const model = await importNativeMarks(source);
  const before = JSON.stringify(model), hash = sha256(source);
  const unsupported = updateMark(model, byName(model, 'source-free-text').id, { contents: '缺字' });
  await assert.rejects(exportNativeMarks(source, unsupported), /font does not cover/);
  const overflow = updateMark(model, byName(model, 'source-free-text').id, { contents: 'a\n'.repeat(100) });
  await assert.rejects(exportNativeMarks(source, overflow), /does not fit/);
  assert.equal(sha256(source), hash);
  assert.equal(JSON.stringify(model), before);
});

test('opaque omission, forged source provenance and model/source mismatches are rejected atomically', async () => {
  const source = await fixture();
  const model = await importNativeMarks(source);
  const opaque = byName(model, 'opaque-stamp');
  const omission = { ...model, annotations: model.annotations.filter((entry) => entry.id !== opaque.id) };
  await assert.rejects(exportNativeMarks(source, omission), /explicit delete/);
  const forged = { ...model, annotations: model.annotations.map((entry) => entry.id === opaque.id ? { ...entry, contents: 'fake', capabilities: { geometry: true, contents: true, appearance: true, remove: true, reply: true } } : entry) };
  await assert.rejects(exportNativeMarks(source, forged), /Opaque source/);
  await assert.rejects(exportNativeMarks(source, { ...model, sourceHash: 'wrong-source' }), /binding does not match/);
});

test('encrypted and XFA sources are refused and native signature markers allow unchanged bytes only', async () => {
  await assert.rejects(importNativeMarks(await fixture('native-marks-encrypted.pdf')), /encrypted/i);
  await assert.rejects(importNativeMarks(await fixture('native-marks-xfa.pdf')), /XFA/);
  const signed = await fixture('native-marks-signed-marker.pdf');
  const model = await importNativeMarks(signed);
  assert.equal(model.signed, true);
  assert.strictEqual(await exportNativeMarks(signed, model), signed);
  assert.throws(() => updateMark(model, byName(model, 'source-free-text').id, { contents: 'edit' }), /Signed/);
  await assert.rejects(exportNativeMarks(signed, { ...model, annotations: model.annotations.slice(1) }), /Signed/);
});

test('native preview uses the AP document as visual authority and creates no extra Contents layer', async () => {
  const source = await fixture();
  const initial = await inspectNativePdf(source);
  const edited = updateMark(initial, byName(initial, 'source-free-text').id, { contents: 'Preview edit' });
  const preview = await previewNativeMarks(source, edited);
  assert.equal(preview.svgBodies, false);
  assert.equal(preview.visualAuthority, 'native-appearance');
  const native = await inspectNativePdf(preview.bytes);
  assert.deepEqual(native.contentHashes, initial.contentHashes);
  assert.equal(native.annotations.filter((entry) => entry.id === byName(initial, 'source-free-text').id).length, 1);
});
