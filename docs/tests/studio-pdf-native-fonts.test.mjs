import { URL } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { lib, sha256 } from './studio-pdf-native-runtime.mjs';
import { importNativeMarks, updateMark, exportNativeMarks } from './studio-pdf-native-runtime.mjs';

test('complete CJK font remains one native font object through eight reopen/edit/save cycles', async () => {
  let bytes = await readFile(new URL('./fixtures/studio-pdf-native/native-font-source.pdf', import.meta.url));
  const firstSize = bytes.length;
  const first = await importNativeMarks(bytes);
  const firstFont = first.annotations.find((annotation) => annotation.id === 'native-cjk-freetext')._native.font.embeddedHash;
  for (let iteration = 1; iteration <= 8; iteration++) {
    const model = await importNativeMarks(bytes);
    const next = updateMark(model, 'native-cjk-freetext', { contents: '中文自由文本第' + iteration + '次\n字体和位置继续保留' });
    bytes = await exportNativeMarks(bytes, next);
    const reopened = await importNativeMarks(bytes);
    assert.equal(reopened.annotations.find((annotation) => annotation.id === 'native-cjk-freetext')._native.font.embeddedHash, firstFont);
  }
  const pdf = await lib.PDFDocument.load(bytes);
  const faces = pdf.context.enumerateIndirectObjects().filter(([, object]) => object instanceof lib.PDFDict && object.lookup(lib.PDFName.of('ZuviFontFamily'))?.decodeText() === 'NotoSansSC');
  assert.equal(faces.length, 1);
  assert.ok(bytes.length < firstSize + 50_000, 'AP streams can grow; an identical complete font must not be repeatedly embedded');
});

test('new glyphs use the source full font even when a same-family provider supplies different bytes', async () => {
  const bytes = await readFile(new URL('./fixtures/studio-pdf-native/native-font-source.pdf', import.meta.url));
  const model = await importNativeMarks(bytes), sourceFont = model.annotations.find((annotation) => annotation.id === 'native-cjk-freetext')._native.font.embeddedHash;
  const next = updateMark(model, 'native-cjk-freetext', { contents: '新的中文字符：重新编辑' });
  const wrongProvider = await readFile('/Users/meaili/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/poppler/fonts/DejaVuSans.ttf');
  assert.notEqual(sha256(wrongProvider), sourceFont);
  const reopened = await importNativeMarks(await exportNativeMarks(bytes, next, { fonts: new Map([['NotoSansSC', wrongProvider]]) }));
  assert.equal(reopened.annotations.find((annotation) => annotation.id === 'native-cjk-freetext')._native.font.embeddedHash, sourceFont);
});
