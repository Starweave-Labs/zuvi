import { URL } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { lib } from './studio-pdf-native-runtime.mjs';
import { importNativeMarks, inspectNativePdf, updateMark, addReply, removeMark, exportNativeMarks } from './studio-pdf-native-runtime.mjs';
import { mapNativePages, exportMappedNativeMarks } from './studio-pdf-native-runtime.mjs';

const fixture = () => readFile(new URL('./fixtures/studio-pdf-native/native-marks-source.pdf', import.meta.url));
const byName = (model, name) => model.annotations.find((annotation) => annotation._native?.name === name);
const byId = (model, id) => model.annotations.find((annotation) => annotation.id === id);
const targetPage = async (bytes, pageIndex, annotationId) => {
  const pdf = await lib.PDFDocument.load(bytes);
  const dict = pdf.getPages()[pageIndex].node.Annots().asArray().map((ref) => pdf.context.lookup(ref)).find((annotation) => annotation.lookup(lib.PDFName.of('ZuviAnnotationId'))?.decodeText() === annotationId);
  const action = dict.lookup(lib.PDFName.of('A'));
  const target = action.lookup(lib.PDFName.of('D')).get(0);
  return pdf.getPages().findIndex((page) => page.ref.toString() === target.toString());
};

test('reordered page instances retain annotation IDs, content hashes and cross-page IRT targets', async () => {
  const bytes = await fixture();
  const base = await inspectNativePdf(bytes);
  const operation = mapNativePages(base, [
    { id: base.pages[1].id, sourcePage: 1 }, { id: base.pages[0].id, sourcePage: 0 },
  ]);
  const saved = await exportMappedNativeMarks(bytes, operation);
  const reopened = await inspectNativePdf(saved);
  assert.deepEqual(reopened.pages.map((page) => page.id), [base.pages[1].id, base.pages[0].id]);
  assert.deepEqual(reopened.contentHashes, [base.contentHashes[1], base.contentHashes[0]]);
  assert.equal(byId(reopened, byName(base, 'source-nested-reply').id).page, 0);
  assert.equal(byId(reopened, byName(base, 'source-nested-reply').id).inReplyTo, byName(base, 'source-reply').id);
  assert.equal(await targetPage(saved, 1, byName(base, 'source-internal-link').id), 0);
});

test('front-inserted copied group has independent persistent identities and its own cross-page IRT/link closure', async () => {
  const bytes = await fixture();
  const base = await inspectNativePdf(bytes);
  const operation = mapNativePages(base, [
    { id: 'copy-page-one', sourcePage: 0, copyGroup: 'copy-group' },
    { id: 'copy-page-two', sourcePage: 1, copyGroup: 'copy-group' },
    { id: base.pages[0].id, sourcePage: 0 }, { id: base.pages[1].id, sourcePage: 1 },
  ]);
  const copiedReply = operation.model.annotations.find((annotation) => annotation.page === 0 && annotation.originId === byName(base, 'source-reply').id);
  const copiedNested = operation.model.annotations.find((annotation) => annotation.page === 1 && annotation.originId === byName(base, 'source-nested-reply').id);
  const copiedLink = operation.model.annotations.find((annotation) => annotation.page === 0 && annotation.originId === byName(base, 'source-internal-link').id);
  const saved = await exportMappedNativeMarks(bytes, operation);
  const reopened = await inspectNativePdf(saved);
  assert.equal(reopened.pages.length, 4);
  assert.deepEqual(reopened.pages.map((page) => page.id), ['copy-page-one', 'copy-page-two', base.pages[0].id, base.pages[1].id]);
  assert.equal(new Set(reopened.annotations.map((annotation) => annotation.id)).size, reopened.annotations.length);
  assert.equal(byId(reopened, copiedNested.id).inReplyTo, copiedReply.id);
  assert.equal(byId(reopened, byName(base, 'source-nested-reply').id).inReplyTo, byName(base, 'source-reply').id);
  assert.equal(await targetPage(saved, 0, copiedLink.id), 1);
  assert.equal(await targetPage(saved, 2, byName(base, 'source-internal-link').id), 3);
  assert.deepEqual(reopened.contentHashes, [base.contentHashes[0], base.contentHashes[1], base.contentHashes[0], base.contentHashes[1]]);
  for (const annotation of operation.model.annotations.filter((entry) => entry._mapping.isCopy && entry._native.appearanceHash)) assert.equal(byId(reopened, annotation.id)._native.appearanceHash, byId(base, annotation.originId)._native.appearanceHash);
  const copiedEmbedded = operation.model.annotations.find((annotation) => annotation.page === 0 && annotation.originId === byName(base, 'source-embedded-free-text').id);
  assert.equal(byId(reopened, copiedEmbedded.id)._native.font.embeddedHash, byName(base, 'source-embedded-free-text')._native.font.embeddedHash);
});

test('single-page extraction retains parent/replies/Popup and explicitly removes a link to a discarded page', async () => {
  const bytes = await fixture();
  const base = await importNativeMarks(bytes);
  const operation = mapNativePages(base, [{ id: base.pages[0].id, sourcePage: 0 }]);
  assert.equal(operation.removedLinks.length, 1);
  assert.equal(operation.removedLinks[0].sourceId, byName(base, 'source-internal-link').id);
  const reopened = await importNativeMarks(await exportMappedNativeMarks(bytes, operation));
  assert.equal(reopened.pages.length, 1);
  assert.ok(byId(reopened, byName(base, 'source-free-text').id));
  assert.ok(byId(reopened, byName(base, 'source-reply').id));
  assert.ok(byId(reopened, byName(base, 'source-popup').id));
  assert.equal(byId(reopened, byName(base, 'source-reply').id).inReplyTo, byName(base, 'source-free-text').id);
  assert.equal(byId(reopened, byName(base, 'source-popup').id).popupOf, byName(base, 'source-free-text').id);
  assert.equal(reopened.annotations.some((annotation) => annotation._native.name === 'source-internal-link'), false);
  assert.equal(reopened.annotations.some((annotation) => annotation._native.name === 'source-nested-reply'), false);
});

test('reply-only extraction refuses a dangling IRT until that dependent reply is explicitly deleted', async () => {
  const bytes = await fixture();
  const base = await importNativeMarks(bytes);
  const before = JSON.stringify(base);
  assert.throws(() => mapNativePages(base, [{ id: base.pages[1].id, sourcePage: 1 }]), /Retained reply has a removed parent/);
  assert.equal(JSON.stringify(base), before);
  const cleaned = removeMark(base, byName(base, 'source-nested-reply').id);
  const operation = mapNativePages(cleaned, [{ id: cleaned.pages[1].id, sourcePage: 1 }]);
  const reopened = await importNativeMarks(await exportMappedNativeMarks(bytes, operation));
  assert.equal(reopened.pages.length, 1);
  assert.ok(byName(reopened, 'source-external-link'));
  assert.equal(reopened.annotations.some((annotation) => annotation.inReplyTo), false);
});

test('copied pending text edits/replies survive native copy, subsequent editing and a second source save', async () => {
  const bytes = await fixture();
  let base = await importNativeMarks(bytes);
  const freeText = byName(base, 'source-free-text');
  base = updateMark(base, freeText.id, { contents: 'Edit before copying' });
  base = addReply(base, byName(base, 'source-note').id, { id: 'reply-before-copy', contents: 'Copied reply', author: 'Reviewer E' });
  const operation = mapNativePages(base, [
    { id: 'edited-copy-one', sourcePage: 0, copyGroup: 'edited-copy' },
    { id: 'edited-copy-two', sourcePage: 1, copyGroup: 'edited-copy' },
    { id: base.pages[0].id, sourcePage: 0 }, { id: base.pages[1].id, sourcePage: 1 },
  ]);
  const copiedText = operation.model.annotations.find((annotation) => annotation.page === 0 && annotation.originId === freeText.id);
  const copiedReply = operation.model.annotations.find((annotation) => annotation.page === 0 && annotation.originId === 'reply-before-copy');
  const first = await exportMappedNativeMarks(bytes, operation);
  const reopened = await importNativeMarks(first);
  assert.equal(byId(reopened, copiedText.id).contents, 'Edit before copying');
  assert.equal(byId(reopened, copiedReply.id).contents, 'Copied reply');
  const oldOriginalAP = byId(reopened, freeText.id)._native.appearanceHash;
  const revised = updateMark(reopened, copiedText.id, { contents: 'Copy edited independently' });
  const again = await importNativeMarks(await exportNativeMarks(first, revised));
  assert.equal(byId(again, copiedText.id).contents, 'Copy edited independently');
  assert.equal(byId(again, freeText.id).contents, 'Edit before copying');
  assert.equal(byId(again, freeText.id)._native.appearanceHash, oldOriginalAP);
  assert.equal(byId(again, copiedReply.id).originId, 'reply-before-copy');
});

test('copy-group ambiguity, duplicate page IDs and a reused original identity cannot enter the mapping model', async () => {
  const base = await importNativeMarks(await fixture());
  assert.throws(() => mapNativePages(base, [{ id: 'duplicate', sourcePage: 0 }, { id: 'duplicate', sourcePage: 1 }]), /duplicate page/);
  assert.throws(() => mapNativePages(base, [{ id: 'copy-a', sourcePage: 0, copyGroup: 'group' }, { id: 'copy-b', sourcePage: 0, copyGroup: 'group' }]), /duplicate instances/);
  assert.throws(() => mapNativePages(base, [{ id: base.pages[0].id, sourcePage: 0, copyGroup: 'group' }]), /own identity/);
});
