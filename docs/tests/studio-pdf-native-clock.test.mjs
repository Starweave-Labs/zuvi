import test from 'node:test';
import assert from 'node:assert/strict';
import { runtime, sourceColorFixture, read, edit, codec, mapping, byName } from './studio-pdf-native-color-fixtures.mjs';

test('Latin1 maps all 256 bytes one-to-one, including 0x80..0x9f, and preserves chunk boundaries', () => {
  const bytes = Uint8Array.from({ length: 25000 }, (_, index) => index % 256);
  const value = runtime.latin1(bytes);
  assert.equal(value.length, bytes.length);
  for (let index = 0; index < bytes.length; index++) assert.equal(value.charCodeAt(index), bytes[index]);
  assert.equal(runtime.latin1(new Uint8Array()), '');
  assert.equal(runtime.latin1(Uint8Array.of(0x80)).charCodeAt(0), 0x80);
});

test('editTime honors explicit now, samples an injected clock once, and production defaults use the current time', () => {
  let calls = 0;
  const clock = () => { calls++; return '2034-05-06T07:08:09.000Z'; };
  assert.equal(runtime.editTime({ now: '2035-01-01T00:00:00.000Z', clock }), '2035-01-01T00:00:00.000Z');
  assert.equal(calls, 0);
  assert.equal(runtime.editTime({ clock }), '2034-05-06T07:08:09.000Z');
  assert.equal(calls, 1);
  const before = Date.now(), current = Date.parse(runtime.editTime()), after = Date.now();
  assert.ok(current >= before && current <= after, 'Default clock must not use a fixture date');
});

test('one native reply transaction samples the clock once and persists its injected creation date', async () => {
  const source = await sourceColorFixture(), initial = await read.importNativeMarks(source);
  const parent = byName(initial, 'gray-square');
  let calls = 0;
  const clock = () => { calls++; return '2034-05-06T07:08:09.000Z'; };
  const edited = edit.addReply(initial, parent.id, { id: 'injected-clock-reply', contents: 'Injected time', author: 'QA' }, { clock });
  assert.equal(calls, 1);
  const reply = edited.annotations.find((entry) => entry.id === 'injected-clock-reply');
  assert.equal(reply.createdAt, '2034-05-06T07:08:09.000Z');
  assert.equal(reply.modifiedAt, reply.createdAt);
  const reopened = await read.importNativeMarks(await codec.exportNativeMarks(source, edited));
  assert.equal(calls, 1, 'Export must not call the creation clock');
  assert.equal(reopened.annotations.find((entry) => entry.id === reply.id).creationPdf, 'D:20340506070809Z');
});

test('review production IDs are unique UUIDs and default timestamps are sampled at command creation', async () => {
  const initial = await read.importNativeMarks(await sourceColorFixture()), parent = byName(initial, 'gray-square');
  const before = Date.now();
  const first = edit.setReviewState(initial, parent.id, 'resolved');
  const second = edit.setReviewState(first, parent.id, 'open');
  const after = Date.now();
  const created = second.annotations.filter((entry) => !initial.annotations.some((origin) => origin.id === entry.id));
  assert.equal(created.length, 2);
  assert.equal(new Set(created.map((entry) => entry.id)).size, 2);
  for (const annotation of created) {
    assert.match(annotation.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    assert.ok(Date.parse(annotation.createdAt) >= before && Date.parse(annotation.createdAt) <= after);
  }
});

test('mapped command ledger captures clock and generated review ID once and survives export replay', async () => {
  const source = await sourceColorFixture(), base = await read.importNativeMarks(source);
  const descriptors = [
    { id: base.pages[0].id, sourcePage: 0 },
    { id: 'clock-copy-gray', sourcePage: 0, copyGroup: 'clock-group' },
    ...base.pages.slice(1).map((page, offset) => ({ id: page.id, sourcePage: offset + 1 })),
  ];
  let operation = mapping.mapNativePages(base, descriptors), calls = 0;
  const clock = () => { calls++; return `2034-05-06T07:08:0${calls}.000Z`; };
  const copied = operation.model.annotations.find((entry) => entry.pageId === 'clock-copy-gray' && entry._native.name === 'gray-square');
  assert.ok(copied);
  operation = mapping.updateMappedMark(operation, copied.id, { opacity: 0.3 }, { clock });
  operation = mapping.addMappedReply(operation, copied.id, { id: 'mapped-clock-reply', contents: 'Stored command clock' }, { clock });
  operation = mapping.setMappedReviewState(operation, copied.id, 'resolved', { clock, author: 'Clock reviewer' });
  assert.equal(calls, 3);
  const ledger = JSON.stringify(operation.commands), review = operation.commands[2];
  assert.equal(review.options.now, '2034-05-06T07:08:03.000Z');
  assert.match(review.options.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  const exported = await mapping.exportMappedNativeMarks(source, operation);
  assert.equal(calls, 3, 'Replay must use the captured clock and ID');
  assert.equal(JSON.stringify(operation.commands), ledger);
  const reopened = await read.importNativeMarks(exported);
  const nativeReply = reopened.annotations.find((entry) => entry.id === 'mapped-clock-reply');
  const nativeState = reopened.annotations.find((entry) => entry.id === review.options.id);
  assert.equal(nativeReply.createdAt, '2034-05-06T07:08:02.000Z');
  assert.equal(nativeReply.inReplyTo, copied.id);
  assert.equal(nativeState.createdAt, '2034-05-06T07:08:03.000Z');
  assert.equal(nativeState.review.state, 'Completed');
  const again = await codec.exportNativeMarks(exported, await read.importNativeMarks(exported));
  assert.strictEqual(again, exported);
});
