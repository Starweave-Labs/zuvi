import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sourceColorFixture, read, edit, codec, lib, colorCases, kinds, byName,
  nativeRecord, assertPaint, operatorValues, keepOutput,
} from './studio-pdf-native-color-fixtures.mjs';

const filled = new Set(['freeText', 'square', 'circle', 'line', 'polygon', 'polyLine']);

for (const [space, colors] of Object.entries(colorCases)) {
  for (const kind of kinds) {
    test(`${space} ${kind}: opacity/dash/resize keep native components and AP through two reopen cycles`, async () => {
      const source = await sourceColorFixture();
      const sourceCopy = source.slice();
      let bytes = source, model = await read.importNativeMarks(source);
      const original = byName(model, space + '-' + kind), originalRect = original.rect;
      assert.equal(original.capabilities.appearance, true);
      for (let round = 1; round <= 2; round++) {
        const annotation = byName(model, space + '-' + kind);
        const patch = {
          opacity: round === 1 ? 0.55 : 0.4,
          border: { width: 1.5, style: 'D', dash: round === 1 ? [5, 2] : [2, 1] },
          rect: [originalRect[0], originalRect[1], originalRect[2] + round * 12, originalRect[3] + round * 8],
          contents: 'Retained source color round ' + round,
        };
        if (kind === 'freeText') patch.padding = [3, 3, 3, 3];
        if (['line', 'polyLine'].includes(kind)) patch.lineEnds = ['ClosedArrow', 'Circle'];
        const edited = edit.updateMark(model, annotation.id, patch, { now: `2026-11-27T01:0${round}:00.000Z` });
        bytes = await codec.exportNativeMarks(bytes, edited);
        model = await read.importNativeMarks(bytes);
        const native = await nativeRecord(bytes, space + '-' + kind);
        assert.deepEqual(native.C, colors.stroke, 'C components and color space remain native');
        assert.deepEqual(native.IC, filled.has(kind) ? colors.fill : undefined, 'IC identity remains native or absent');
        if (kind === 'freeText') {
          assertPaint(native.AP, colors.fillOp, colors.stroke, 'FreeText background keeps native C');
          assertPaint(native.AP, colors.strokeOp, colors.fill, 'FreeText border keeps native IC');
          assertPaint(native.AP, colors.fillOp, colors.text, 'FreeText text keeps native device color');
          assertPaint(native.DA, colors.fillOp, colors.text, 'DA keeps native text color');
          assert.deepEqual(byName(model, space + '-' + kind)._native.font.deviceColor.components, colors.text);
        } else {
          const colorOperator = ['highlight', 'note'].includes(kind) ? colors.fillOp : colors.strokeOp;
          assertPaint(native.AP, colorOperator, colors.stroke);
          if (filled.has(kind)) assertPaint(native.AP, colors.fillOp, colors.fill);
        }
        await keepOutput(`${space}-${kind}-round-${round}.pdf`, bytes);
      }
      assert.deepEqual(source, sourceCopy, 'Source bytes are never mutated');
    });
  }
}

for (const space of Object.keys(colorCases)) {
  for (const kind of ['freeText', 'square']) {
    test(`${space} ${kind}: explicit RGB replacement writes three components and stays RGB on second save`, async () => {
      let bytes = await sourceColorFixture(), model = await read.importNativeMarks(bytes);
      const annotation = byName(model, space + '-' + kind);
      const color = [0.61, 0.12, 0.34], fill = [0.83, 0.73, 0.42], fontColor = [0.18, 0.52, 0.73];
      const patch = { color, fill, opacity: 0.45 };
      if (kind === 'freeText') patch.font = { ...annotation.font, color: fontColor };
      model = edit.updateMark(model, annotation.id, patch, { now: '2026-11-27T02:00:00.000Z' });
      for (let round = 1; round <= 2; round++) {
        if (round === 2) model = edit.updateMark(model, annotation.id, { opacity: 0.35 }, { now: '2026-11-27T02:01:00.000Z' });
        bytes = await codec.exportNativeMarks(bytes, model);
        model = await read.importNativeMarks(bytes);
        const native = await nativeRecord(bytes, space + '-' + kind);
        assert.deepEqual(native.C, color);
        assert.deepEqual(native.IC, fill);
        if (kind === 'freeText') {
          assertPaint(native.AP, 'rg', color);
          assertPaint(native.AP, 'RG', fill);
          assertPaint(native.AP, 'rg', fontColor);
          assertPaint(native.DA, 'rg', fontColor);
        } else {
          assertPaint(native.AP, 'RG', color);
          assertPaint(native.AP, 'rg', fill);
        }
        await keepOutput(`${space}-${kind}-rgb-round-${round}.pdf`, bytes);
      }
    });
  }
}

test('DA-only CMYK FreeText resolves its actual DR standard font and preserves color through two saves', async () => {
  let bytes = await sourceColorFixture(), model = await read.importNativeMarks(bytes);
  const annotation = byName(model, 'cmyk-freeText-no-ap');
  assert.equal(annotation._native.hasAppearance, false);
  assert.equal(annotation._native.font.family, 'Helvetica');
  assert.equal(annotation.capabilities.contents, true);
  for (let round = 1; round <= 2; round++) {
    model = edit.updateMark(model, annotation.id, { contents: 'DA only native text round ' + round, opacity: 0.45 }, { now: `2026-11-27T03:0${round}:00.000Z` });
    bytes = await codec.exportNativeMarks(bytes, model);
    model = await read.importNativeMarks(bytes);
    const native = await nativeRecord(bytes, 'cmyk-freeText-no-ap');
    assert.deepEqual(native.C, colorCases.cmyk.stroke);
    assert.deepEqual(native.IC, colorCases.cmyk.fill);
    assertPaint(native.DA, 'k', colorCases.cmyk.text);
    assertPaint(native.AP, 'k', colorCases.cmyk.text);
    assertPaint(native.AP, 'K', colorCases.cmyk.fill);
    await keepOutput(`cmyk-da-only-round-${round}.pdf`, bytes);
  }
});

test('FreeText missing IC retains the original black-border policy; explicit empty IC paints no border', async () => {
  let bytes = await sourceColorFixture(), model = await read.importNativeMarks(bytes);
  for (let round = 1; round <= 2; round++) {
    for (const name of ['cmyk-freeText-missing-fill', 'cmyk-freeText-empty-fill']) {
      const annotation = byName(model, name);
      model = edit.updateMark(model, annotation.id, { contents: 'Missing versus none round ' + round, opacity: 0.5 }, { now: `2026-11-27T04:0${round}:00.000Z` });
    }
    bytes = await codec.exportNativeMarks(bytes, model);
    model = await read.importNativeMarks(bytes);
    const missing = await nativeRecord(bytes, 'cmyk-freeText-missing-fill');
    const empty = await nativeRecord(bytes, 'cmyk-freeText-empty-fill');
    assert.equal(missing.IC, undefined);
    assert.deepEqual(empty.IC, []);
    const black = [...operatorValues(missing.AP, 'G', 1), ...operatorValues(missing.AP, 'RG', 3)];
    assert.ok(black.some((values) => values.every((value) => value === 0)), 'Missing IC preserves a visible black border');
    assert.match(missing.AP, /(?:^|\s)S(?:\s|$)/);
    assert.doesNotMatch(empty.AP, /(?:^|\s)(?:S|s|B|B\*|b|b\*)(?:\s|$)/, 'An explicit none color must not draw a border');
    await keepOutput(`cmyk-none-versus-missing-round-${round}.pdf`, bytes);
  }
});

test('CMYK support never promotes complex, action-bearing, locked or malformed DA sources to editable marks', async () => {
  const source = await sourceColorFixture(), model = await read.importNativeMarks(source);
  const snapshot = JSON.stringify(model);
  for (const name of ['cmyk-freeText-locked', 'cmyk-freeText-action', 'cmyk-freeText-complex', 'cmyk-invalid-da-0', 'cmyk-invalid-da-1', 'cmyk-invalid-da-2']) {
    const annotation = byName(model, name);
    assert.equal(annotation.capabilities.appearance, false, name);
    assert.equal(annotation.capabilities.contents, false, name);
    assert.throws(() => edit.updateMark(model, annotation.id, { contents: 'must be refused' }), /does not permit/, name);
  }
  assert.equal(JSON.stringify(model), snapshot);
  const changed = edit.updateMark(model, byName(model, 'gray-square').id, { opacity: 0.25 }, { now: '2026-11-27T05:00:00.000Z' });
  const saved = await codec.exportNativeMarks(source, changed);
  for (const name of ['cmyk-freeText-locked', 'cmyk-freeText-action', 'cmyk-freeText-complex']) {
    const before = await nativeRecord(source, name), after = await nativeRecord(saved, name);
    assert.equal(after.AP, before.AP, name + ' retains its exact AP data');
    assert.deepEqual(after.C, before.C);
    assert.deepEqual(after.IC, before.IC);
    if (name.endsWith('action')) assert.equal(after.dict.lookup(lib.PDFName.of('A')).toString(), before.dict.lookup(lib.PDFName.of('A')).toString());
  }
});

test('out-of-range CMYK text AP stays passive even when the source DA and annotation colors are valid', async () => {
  const source = await sourceColorFixture();
  const native = await nativeRecord(source, 'cmyk-freeText');
  const oldAppearance = native.dict.lookup(lib.PDFName.of('AP'), lib.PDFDict).lookup(lib.PDFName.of('N'), lib.PDFRawStream);
  const contents = native.AP.replace(colorCases.cmyk.text.join(' ') + ' k', '1.2 0.7 0.6 0.6 k');
  assert.notEqual(contents, native.AP);
  const appearance = native.pdf.context.flateStream(contents, {
    Type: 'XObject', Subtype: 'Form', FormType: 1, BBox: [0, 0, 240, 70],
    Resources: oldAppearance.dict.lookup(lib.PDFName.of('Resources')),
  });
  native.dict.set(lib.PDFName.of('AP'), native.pdf.context.obj({ N: native.pdf.context.register(appearance) }));
  const malformed = new Uint8Array(await native.pdf.save({ useObjectStreams: false, updateFieldAppearances: false }));
  const model = await read.importNativeMarks(malformed), annotation = byName(model, 'cmyk-freeText');
  assert.equal(annotation.capabilities.contents, false);
  assert.equal(annotation.capabilities.appearance, false);
  assert.throws(() => edit.updateMark(model, annotation.id, { contents: 'refuse' }), /does not permit/);
  const unrelated = edit.updateMark(model, byName(model, 'gray-square').id, { opacity: 0.25 }, { now: '2026-11-27T06:00:00.000Z' });
  const saved = await codec.exportNativeMarks(malformed, unrelated);
  assert.equal((await nativeRecord(saved, 'cmyk-freeText')).AP, contents);
});

test('DA-only color parsing rejects invalid components and non-device operators without mutating source', async () => {
  const source = await sourceColorFixture();
  for (const da of [
    '/F1 12 Tf 1.1 g', '/F1 12 Tf -0.1 0.2 0.3 rg',
    '/F1 12 Tf 0.1 0.2 0.3 1.1 k', '/F1 12 Tf NaN g',
    '/F1 12 Tf /DeviceCMYK cs 0.1 0.2 0.3 0.4 scn',
  ]) {
    const native = await nativeRecord(source, 'cmyk-freeText-no-ap');
    native.dict.set(lib.PDFName.of('DA'), lib.PDFString.of(da));
    const bytes = new Uint8Array(await native.pdf.save({ useObjectStreams: false, updateFieldAppearances: false }));
    const model = await read.importNativeMarks(bytes), annotation = byName(model, 'cmyk-freeText-no-ap');
    assert.equal(annotation.capabilities.contents, false, da);
    assert.equal(annotation.capabilities.appearance, false, da);
    assert.throws(() => edit.updateMark(model, annotation.id, { contents: 'refuse' }), /does not permit/, da);
    assert.strictEqual(await codec.exportNativeMarks(bytes, model), bytes);
  }
});

for (const variation of ['custom encoding differences', 'custom source widths']) {
  test(`standard family with ${variation} stays passive and retains the actual source font/AP`, async () => {
    const source = await sourceColorFixture(), native = await nativeRecord(source, 'cmyk-freeText');
    const normal = native.dict.lookup(lib.PDFName.of('AP'), lib.PDFDict).lookup(lib.PDFName.of('N'), lib.PDFRawStream);
    const oldResources = normal.dict.lookup(lib.PDFName.of('Resources'), lib.PDFDict);
    const font = oldResources.lookup(lib.PDFName.of('Font'), lib.PDFDict).lookup(lib.PDFName.of('F1'), lib.PDFDict).clone(native.pdf.context);
    if (variation === 'custom encoding differences') {
      font.set(lib.PDFName.of('Encoding'), native.pdf.context.obj({ Type: 'Encoding', BaseEncoding: 'WinAnsiEncoding', Differences: [65, lib.PDFName.of('B')] }));
    } else {
      font.set(lib.PDFName.of('FirstChar'), lib.PDFNumber.of(65));
      font.set(lib.PDFName.of('LastChar'), lib.PDFNumber.of(65));
      font.set(lib.PDFName.of('Widths'), native.pdf.context.obj([1200]));
    }
    const customFont = native.pdf.context.register(font), resources = oldResources.clone(native.pdf.context);
    resources.set(lib.PDFName.of('Font'), native.pdf.context.obj({ F1: customFont }));
    const content = native.AP.replace('(Source color text) Tj', '(AAA) Tj');
    const appearance = native.pdf.context.flateStream(content, { Type: 'XObject', Subtype: 'Form', FormType: 1, BBox: [0, 0, 240, 70], Resources: resources });
    native.dict.set(lib.PDFName.of('AP'), native.pdf.context.obj({ N: native.pdf.context.register(appearance) }));
    native.dict.set(lib.PDFName.of('DR'), native.pdf.context.obj({ Font: { F1: customFont } }));
    native.dict.set(lib.PDFName.of('Contents'), lib.PDFHexString.fromText('AAA'));
    const bytes = new Uint8Array(await native.pdf.save({ useObjectStreams: false, updateFieldAppearances: false }));
    const fixtureName = variation.replaceAll(' ', '-') + '.pdf';
    await keepOutput('source-' + fixtureName, bytes);
    const model = await read.importNativeMarks(bytes), annotation = byName(model, 'cmyk-freeText');
    assert.equal(annotation.capabilities.contents, false, 'A standard family name cannot authorize replacement of source encoding/metrics');
    assert.equal(annotation.capabilities.appearance, false);
    assert.throws(() => edit.updateMark(model, annotation.id, { contents: 'AB' }), /does not permit/);
    assert.strictEqual(await codec.exportNativeMarks(bytes, model), bytes);
    const unrelated = edit.updateMark(model, byName(model, 'gray-square').id, { opacity: 0.25 }, { now: '2026-11-27T07:00:00.000Z' });
    const saved = await codec.exportNativeMarks(bytes, unrelated);
    const reopened = await nativeRecord(saved, 'cmyk-freeText');
    assert.equal(reopened.AP, content);
    const savedFont = reopened.dict.lookup(lib.PDFName.of('AP'), lib.PDFDict).lookup(lib.PDFName.of('N'), lib.PDFRawStream)
      .dict.lookup(lib.PDFName.of('Resources'), lib.PDFDict).lookup(lib.PDFName.of('Font'), lib.PDFDict).lookup(lib.PDFName.of('F1'), lib.PDFDict);
    assert.equal(savedFont.toString(), font.toString(), 'Actual custom source encoding and metrics survive');
    await keepOutput('retained-' + fixtureName, saved);
  });
}

test('aggregate Gray/CMYK fixture preserves all color models across two saves for visual QA', async () => {
  let bytes = await sourceColorFixture(), model = await read.importNativeMarks(bytes);
  const originals = new Map(model.annotations.map((entry) => [entry._native.name, [...entry.rect]]));
  for (let round = 1; round <= 2; round++) {
    for (const [space, colors] of Object.entries(colorCases)) {
      for (const kind of kinds) {
        const nm = space + '-' + kind, annotation = byName(model, nm), original = originals.get(nm);
        const patch = {
          opacity: round === 1 ? 0.55 : 0.4,
          border: { width: 1.5, style: 'D', dash: round === 1 ? [5, 2] : [2, 1] },
          rect: [original[0], original[1] - round * 8, original[2] + round * 12, original[3]],
          contents: space.toUpperCase() + ' native color round ' + round,
        };
        if (kind === 'freeText') patch.padding = [3, 3, 3, 3];
        if (['line', 'polyLine'].includes(kind)) patch.lineEnds = ['ClosedArrow', 'Circle'];
        model = edit.updateMark(model, annotation.id, patch, { now: `2026-11-27T08:0${round}:00.000Z` });
        assert.deepEqual(model.annotations.find((entry) => entry.id === annotation.id)._native.colors.stroke.components, colors.stroke);
      }
    }
    for (const nm of ['cmyk-freeText-no-ap', 'cmyk-freeText-missing-fill', 'cmyk-freeText-empty-fill']) {
      model = edit.updateMark(model, byName(model, nm).id, { contents: 'CMYK retained body round ' + round, opacity: 0.5 }, { now: `2026-11-27T08:0${round}:00.000Z` });
    }
    bytes = await codec.exportNativeMarks(bytes, model);
    model = await read.importNativeMarks(bytes);
    for (const [space, colors] of Object.entries(colorCases)) {
      const native = await nativeRecord(bytes, space + '-freeText');
      assert.deepEqual(native.C, colors.stroke);
      assert.deepEqual(native.IC, colors.fill);
      assertPaint(native.AP, colors.fillOp, colors.text);
    }
    await keepOutput(`native-device-colors-round-${round}.pdf`, bytes);
  }
});

for (const operator of ['sh', 'Do']) {
  test(`source AP with a real ${operator} resource permits translation only and preserves the complete appearance`, async () => {
    const source = await sourceColorFixture(), native = await nativeRecord(source, 'cmyk-freeText');
    const normal = native.dict.lookup(lib.PDFName.of('AP'), lib.PDFDict).lookup(lib.PDFName.of('N'), lib.PDFRawStream);
    const resources = normal.dict.lookup(lib.PDFName.of('Resources'), lib.PDFDict).clone(native.pdf.context);
    if (operator === 'sh') {
      const shading = native.pdf.context.obj({
        ShadingType: 2, ColorSpace: 'DeviceRGB', Coords: [0, 0, 240, 70],
        Function: { FunctionType: 2, Domain: [0, 1], C0: [0, 0, 0], C1: [1, 0, 0], N: 1 }, Extend: [true, true],
      });
      resources.set(lib.PDFName.of('Shading'), native.pdf.context.obj({ S1: native.pdf.context.register(shading) }));
    } else {
      const xobject = native.pdf.context.flateStream('q 0.1 0.3 0.5 rg 0 0 100 70 re f Q', { Type: 'XObject', Subtype: 'Form', FormType: 1, BBox: [0, 0, 100, 70], Resources: {} });
      resources.set(lib.PDFName.of('XObject'), native.pdf.context.obj({ X1: native.pdf.context.register(xobject) }));
    }
    const content = native.AP.replace('BT', `q /${operator === 'sh' ? 'S1' : 'X1'} ${operator} Q\nBT`);
    const appearance = native.pdf.context.flateStream(content, { Type: 'XObject', Subtype: 'Form', FormType: 1, BBox: [0, 0, 240, 70], Resources: resources });
    native.dict.set(lib.PDFName.of('AP'), native.pdf.context.obj({ N: native.pdf.context.register(appearance) }));
    const bytes = new Uint8Array(await native.pdf.save({ useObjectStreams: false, updateFieldAppearances: false }));
    const model = await read.importNativeMarks(bytes), annotation = byName(model, 'cmyk-freeText'), snapshot = JSON.stringify(model);
    assert.equal(annotation.capabilities.geometry, true);
    assert.equal(annotation.capabilities.resize, false);
    assert.equal(annotation.capabilities.contents, false);
    assert.equal(annotation.capabilities.appearance, false);
    assert.throws(() => edit.updateMark(model, annotation.id, { contents: 'refuse' }), /does not permit/);
    assert.throws(() => edit.updateMark(model, annotation.id, { opacity: 0.3 }), /does not permit/);
    assert.throws(() => edit.updateMark(model, annotation.id, { rect: [40, 770, 290, 840] }), /only permits translation/);
    assert.equal(JSON.stringify(model), snapshot);
    const movedRect = annotation.rect.map((value, axis) => value + (axis % 2 ? 5 : 8));
    const moved = edit.updateMark(model, annotation.id, { rect: movedRect }, { now: '2026-11-27T09:00:00.000Z' });
    const saved = await codec.exportNativeMarks(bytes, moved), reopened = await nativeRecord(saved, 'cmyk-freeText');
    assert.equal(reopened.AP, content);
    assert.deepEqual(reopened.rect, movedRect);
    const savedResources = reopened.dict.lookup(lib.PDFName.of('AP'), lib.PDFDict).lookup(lib.PDFName.of('N'), lib.PDFRawStream)
      .dict.lookup(lib.PDFName.of('Resources'), lib.PDFDict);
    assert.equal(savedResources.lookup(lib.PDFName.of(operator === 'sh' ? 'Shading' : 'XObject')).toString(), resources.lookup(lib.PDFName.of(operator === 'sh' ? 'Shading' : 'XObject')).toString());
    await keepOutput(`source-complex-${operator}.pdf`, bytes);
    await keepOutput(`retained-complex-${operator}.pdf`, saved);
  });
}

test('every forbidden ASCII control code is rejected before a property transaction changes the model', async () => {
  const model = await read.importNativeMarks(await sourceColorFixture()), annotation = byName(model, 'gray-freeText');
  const snapshot = JSON.stringify(model);
  const forbidden = [...Array.from({ length: 9 }, (_, value) => value), 11, 12, ...Array.from({ length: 18 }, (_, value) => value + 14)];
  for (const code of forbidden) {
    assert.throws(() => edit.updateMark(model, annotation.id, { contents: 'Text' + String.fromCharCode(code) }, { now: '2026-11-27T10:00:00.000Z' }), /Invalid annotation text/, 'Code ' + code);
    assert.equal(JSON.stringify(model), snapshot);
  }
});
