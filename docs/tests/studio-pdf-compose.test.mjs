import test from 'node:test';
import assert from 'node:assert/strict';
import { Buffer, Blob } from 'node:buffer';
import {
  PDFDocument,
  PDFArray,
  PDFDict,
  PDFName,
  PDFNull,
  PDFNumber,
  PDFString,
  PDFHexString,
  StandardFonts,
} from 'pdf-lib';
import { composePdf, extractPdf, PdfComposeError } from './studio-pdf-compose-test-loader.mjs';
import { hash, canonical, name, text, read, resolve } from './studio-pdf-compose-test-loader.mjs';
import {
  basicPdf,
  sevenFields,
  hiddenOpaque,
  combineFieldWidget,
  nestedPage,
  addAnnot,
  addLink,
  addGoTo,
  inspect,
  decodedContents,
  apHashes,
  streamBytes,
  saveEvidence,
} from './studio-pdf-compose-fixtures.mjs';

async function reopenTwice(bytes, verify) {
  for (let round = 0; round < 3; round++) {
    const source = await inspect(bytes);
    await verify(source, round);
    if (round < 2)
      bytes = (
        await extractPdf(
          bytes,
          source.pages.map((_, index) => index)
        )
      ).bytes;
  }
  return bytes;
}
async function rejected(inputs, options, code) {
  const originals = inputs.map((input) => hash(input.bytes));
  await assert.rejects(
    () =>
      composePdf({
        sources: inputs,
        pages: inputs.map((input) => ({ sourceId: input.id, sourcePage: 0 })),
        ...options,
      }),
    (error) =>
      error instanceof PdfComposeError && error.code === code && typeof error.path === 'string'
  );
  assert.deepEqual(
    inputs.map((input) => hash(input.bytes)),
    originals
  );
}
function nativePages(source) {
  return source.pdf.context
    .enumerateIndirectObjects()
    .filter(([, dict]) => dict instanceof PDFDict && text(read(source, dict, 'Type')) === 'Page');
}
function field(source, fieldName) {
  const record = source.fields.find((record) => record.fullName === fieldName);
  assert.ok(record, `canonical field ${fieldName}`);
  return record;
}
function assertCanonical(source) {
  for (const record of source.fields) {
    const kids = read(source, record.dict, 'Kids');
    assert.ok(kids instanceof PDFArray);
    assert.equal(kids.size(), record.widgets.length);
    for (const widget of record.widgets) {
      assert.notEqual(widget.dict, record.dict);
      assert.equal(widget.dict.get(name('Parent')).toString(), record.ref.toString());
      assert.equal(
        widget.dict.get(name('P')).toString(),
        source.pages[widget.pageIndex].ref.toString()
      );
      assert.ok(streamBytes(source, widget.dict.get(name('AP'))).length);
    }
  }
}

test('treats direct and indirect null dictionary values as absent while retaining null destination coordinates', async () => {
  for (const indirect of [false, true]) {
    for (const key of ['V', 'DV', 'Ff', 'Q', 'MaxLen']) {
      const fixture = await basicPdf({ pages: 2 }),
        original = fixture.fields.Shared;
      original.acroField.dict.set(
        name(key),
        indirect ? fixture.pdf.context.register(PDFNull) : PDFNull
      );
      addLink(fixture.pdf, fixture.pages[0], fixture.pages[1], {
        Dest: fixture.pdf.context.obj([fixture.pages[1].ref, 'XYZ', null, null, 1]),
      });
      const bytes = await fixture.bytes(),
        output = await extractPdf(bytes, [0, 1]);
      await reopenTwice(output.bytes, (source) => {
        const target = field(source, 'Shared');
        assert.equal(read(source, target.dict, key), undefined);
        const link = source.pages[0].node
          .Annots()
          .asArray()
          .map((entry) => source.pdf.context.lookup(entry))
          .find(
            (entry) => entry instanceof PDFDict && entry.lookup(name('Subtype')) === name('Link')
          );
        const destination = link.lookup(name('Dest'));
        assert.equal(destination.get(2), PDFNull);
        assert.equal(destination.get(3), PDFNull);
      });
      assert.equal(hash(bytes), hash(await fixture.bytes()));
    }
    const fixtures = [];
    for (const sourceId of ['current', 'incoming']) {
      const fixture = await basicPdf({ pages: 1, form: false }),
        dropdown = fixture.pdf.getForm().createDropdown('Shared');
      dropdown.setOptions(['A', 'B']);
      dropdown.addToPage(fixture.pages[0], {
        x: 20,
        y: 40,
        width: 140,
        height: 27,
        font: fixture.font,
      });
      dropdown.updateAppearances(fixture.font);
      if (sourceId === 'current')
        dropdown.acroField.dict.set(
          name('V'),
          indirect ? fixture.pdf.context.register(PDFNull) : PDFNull
        );
      fixtures.push({ id: sourceId, bytes: await fixture.bytes() });
    }
    const linked = await composePdf({
      sources: fixtures,
      pages: fixtures.map((source) => ({ sourceId: source.id, sourcePage: 0 })),
      conflicts: { strategy: 'link', valuePolicy: 'reject' },
    });
    await reopenTwice(linked.bytes, (source) => {
      assert.equal(source.fields.length, 1);
      assert.equal(field(source, 'Shared').widgets.length, 2);
      assert.equal(read(source, field(source, 'Shared').dict, 'V'), undefined);
    });
  }
});

test('ignores optional null policies, actions and widget dictionary entries while preserving real navigation and appearances', async () => {
  const cases = [
    (f) => [f.pdf.getForm().acroForm.dict, 'XFA'],
    (f) => [f.pdf.getForm().acroForm.dict, 'SigFlags'],
    (f) => [f.pdf.catalog, 'UnknownNullFeature'],
    (f) => [f.fields.Shared.acroField.dict, 'Lock'],
    (f) => [f.fields.Shared.acroField.dict, 'SV'],
    (f) => [f.fields.Shared.acroField.dict, 'Parent'],
    (f) => [f.fields.Shared.acroField.dict, 'A'],
    (f) => [f.fields.Shared.acroField.dict, 'AA'],
    (f) => [f.fields.Shared.acroField.getWidgets()[0].dict, 'P'],
    (f) => [f.fields.Shared.acroField.getWidgets()[0].dict, 'T'],
    (f) => [f.fields.Shared.acroField.getWidgets()[0].dict, 'FT'],
    (f) => [f.fields.Shared.acroField.getWidgets()[0].dict, 'A'],
    (f) => [f.fields.Shared.acroField.getWidgets()[0].dict, 'AA'],
    (f) => [f.pdf.catalog, 'OpenAction'],
    (f) => {
      const action = f.pdf.context.obj({ S: 'Named', N: 'NextPage' });
      f.pdf.catalog.set(name('OpenAction'), action);
      return [action, 'Next'];
    },
    (f) => {
      const action = f.pdf.context.obj({ S: 'ResetForm' });
      f.pdf.catalog.set(name('OpenAction'), action);
      return [action, 'Fields'];
    },
  ];
  for (const indirect of [false, true])
    for (const select of cases) {
      const fixture = await basicPdf({ pages: 2 }),
        originalSource = await inspect(await fixture.bytes());
      const originalAp = apHashes(originalSource, 'Shared');
      const [dict, key] = select(fixture);
      dict.set(name(key), indirect ? fixture.pdf.context.register(PDFNull) : PDFNull);
      const original = await fixture.bytes(),
        before = hash(original);
      const output = await extractPdf(original, [1, 0]);
      await reopenTwice(output.bytes, (source) => {
        assert.equal(source.fields.length, 1);
        assert.equal(field(source, 'Shared').effective.V.decodeText(), 'Hello');
        assert.deepEqual(apHashes(source, 'Shared'), originalAp);
        assertCanonical(source);
      });
      assert.equal(hash(original), before);
    }
});
test('extracts only selected native pages, order and stream closure through two recompositions', async () => {
  const fixture = await basicPdf({ pages: 5, label: 'CLOSED', form: false }),
    original = await fixture.bytes();
  const result = await extractPdf(original, [4, 0]);
  assert.equal(result.stats.nativePageObjects, 2);
  const finished = await reopenTwice(result.bytes, (source) => {
    assert.equal(source.pages.length, 2);
    assert.equal(nativePages(source).length, 2);
    const contents = decodedContents(source);
    assert.ok(contents.includes(Buffer.from('CLOSED_PAGE_5').toString('hex').toUpperCase()));
    assert.ok(contents.includes(Buffer.from('CLOSED_PAGE_1').toString('hex').toUpperCase()));
    assert.ok(!contents.includes(Buffer.from('CLOSED_PAGE_2').toString('hex').toUpperCase()));
    assert.equal(source.pages[0].getWidth(), 340);
    assert.equal(source.pages[1].getWidth(), 300);
  });
  await saveEvidence('selected-native-pages.pdf', finished);
  assert.equal(hash(original), hash(await fixture.bytes()));
});
test('multi-source merge keeps page resource and AcroForm font namespaces distinct', async () => {
  const a = await basicPdf({ label: 'A', fontName: StandardFonts.Helvetica }),
    b = await basicPdf({ label: 'B', fontName: StandardFonts.TimesRoman });
  const result = await composePdf({
    sources: [
      { id: 'a', bytes: await a.bytes() },
      { id: 'b', bytes: await b.bytes() },
    ],
    pages: [
      { sourceId: 'b', sourcePage: 0 },
      { sourceId: 'a', sourcePage: 0 },
    ],
  });
  await reopenTwice(result.bytes, (source) => {
    assertCanonical(source);
    const fonts = read(source, read(source, source.form, 'DR'), 'Font'),
      bases = new Set(
        fonts.entries().map(([, value]) => text(read(source, resolve(source, value), 'BaseFont')))
      );
    assert.deepEqual([...bases].sort(), ['Helvetica', 'Times-Roman']);
    const aField = field(source, 'Shared'),
      bField = field(source, 'Shared__2');
    assert.match(text(aField.effective.DA), /Z\d_/);
    assert.match(text(bField.effective.DA), /Z\d_/);
    assert.equal(aField.widgets[0].pageIndex, 1);
    assert.equal(bField.widgets[0].pageIndex, 0);
  });
});
test('materializes nested page inheritance without losing resources, dimensions or rotation', async () => {
  const fixture = await basicPdf({ pages: 2, label: 'NESTED', form: false });
  nestedPage(fixture, 0);
  await reopenTwice((await extractPdf(await fixture.bytes(), [1, 0])).bytes, (source) => {
    const page = source.pages[1];
    assert.equal(page.getWidth(), 300);
    assert.equal(page.getHeight(), 400);
    assert.equal(page.getRotation().angle, 90);
    assert.ok(page.node.Resources()?.lookup(name('Font')) instanceof PDFDict);
    assert.ok(
      decodedContents(source).includes(Buffer.from('NESTED_PAGE_1').toString('hex').toUpperCase())
    );
  });
});
test('splits merged field/widget into canonical parent plus child and retains every appearance', async () => {
  const fixture = await basicPdf({ pages: 1 }),
    originalField = combineFieldWidget(fixture, 'Shared');
  originalField.acroField.dict.set(
    name('AA'),
    fixture.pdf.context.obj({ U: { S: 'GoTo', D: [fixture.pages[0].ref, PDFName.of('Fit')] } })
  );
  const bytes = await fixture.bytes(),
    original = await inspect(bytes),
    aps = apHashes(original, 'Shared');
  await reopenTwice((await extractPdf(bytes, [0, 0])).bytes, (source) => {
    assertCanonical(source);
    const record = field(source, 'Shared');
    assert.equal(record.widgets.length, 2);
    assert.equal(text(record.effective.V), 'Hello');
    assert.equal(record.dict.get(name('Subtype')), undefined);
    for (const widget of record.widgets) {
      assert.deepEqual(streamBytes(source, widget.dict.get(name('AP'))).sort(), aps);
      const action = read(source, read(source, widget.dict, 'AA'), 'U');
      assert.equal(
        read(source, action, 'D').get(0).toString(),
        source.pages[widget.pageIndex].ref.toString()
      );
    }
  });
});
test('preserves seven common native form kinds and values without flattening', async () => {
  const fixture = await sevenFields(),
    bytes = await fixture.bytes(),
    original = await inspect(bytes),
    expected = new Map(
      original.fields.map((record) => [record.fullName, apHashes(original, record.fullName)])
    );
  await saveEvidence('seven-fields-source.pdf', bytes);
  const result = await extractPdf(bytes, [1, 0]);
  assert.equal(result.stats.fields, 7);
  assert.equal(result.stats.widgets, 8);
  const finished = await reopenTwice(result.bytes, (source) => {
    assertCanonical(source);
    assert.deepEqual(source.fields.map((record) => record.kind).sort(), [
      'checkbox',
      'date',
      'dropdown',
      'image',
      'list',
      'radio',
      'text',
    ]);
    for (const [fieldName, hashes] of expected)
      assert.deepEqual(apHashes(source, fieldName), hashes);
    const native = source.pdf.getForm();
    assert.equal(native.getTextField('Text').getText(), 'Native text');
    assert.equal(native.getTextField('Date').getText(), '2026-11-26');
    assert.equal(native.getCheckBox('Checked').isChecked(), true);
    assert.equal(native.getRadioGroup('Choice').getSelected(), 'A');
    assert.deepEqual(native.getDropdown('Drop').getSelected(), ['Two']);
    assert.deepEqual(native.getOptionList('List').getSelected(), ['Alpha', 'Gamma']);
    assert.ok(
      text(read(source, field(source, 'Image').dict, 'ZuviFieldImage')).startsWith(
        'data:image/png;base64,'
      )
    );
  });
  await saveEvidence('seven-fields-native.pdf', finished);
});
for (const [fieldName, flags, zero] of [
  ['Zero', 0, true],
  ['Invisible', 1, false],
  ['NoView', 32, true],
]) {
  test(`retains ${fieldName} widget original Rect/F/V/AP through two native recompositions`, async () => {
    const fixture = await hiddenOpaque(),
      originalBytes = await fixture.bytes(),
      original = await inspect(originalBytes),
      originalField = field(original, fieldName),
      rect = canonical(original, originalField.widgets[0].dict.get(name('Rect'))),
      aps = apHashes(original, fieldName);
    await reopenTwice((await extractPdf(originalBytes, [0])).bytes, (source) => {
      assertCanonical(source);
      const record = field(source, fieldName),
        widget = record.widgets[0];
      assert.equal(widget.flags, flags);
      assert.deepEqual(canonical(source, widget.dict.get(name('Rect'))), rect);
      assert.equal(text(record.effective.V), `value-${fieldName}`);
      assert.deepEqual(apHashes(source, fieldName), aps);
      if (zero)
        assert.equal(
          read(source, widget.dict, 'Rect').get(0).toString(),
          read(source, widget.dict, 'Rect').get(2).toString()
        );
    });
  });
}
test('passively retains opaque canonical field type, value, flags, extension and zero-area appearance', async () => {
  const fixture = await hiddenOpaque(),
    bytes = await fixture.bytes(),
    original = await inspect(bytes),
    record = field(original, 'Opaque'),
    metadata = canonical(original, record.dict.get(name('VendorData'))),
    aps = apHashes(original, 'Opaque');
  const finished = await reopenTwice((await extractPdf(bytes, [0])).bytes, (source) => {
    const current = field(source, 'Opaque');
    assert.equal(current.kind, 'opaque');
    assert.equal(text(current.effective.FT), 'VendorPassive');
    assert.equal(current.flags, 1);
    assert.equal(text(current.effective.V), 'value-Opaque');
    assert.deepEqual(canonical(source, current.dict.get(name('VendorData'))), metadata);
    assert.deepEqual(apHashes(source, 'Opaque'), aps);
    assertCanonical(source);
  });
  await saveEvidence('hidden-opaque-native.pdf', finished);
});
test('rename keeps hierarchical roots and changes only colliding source subtree names', async () => {
  const a = await basicPdf({ fieldName: 'Profile.Shared', value: 'First' }),
    b = await basicPdf({ fieldName: 'Profile.Shared', value: 'Second' });
  const result = await composePdf({
    sources: [
      { id: 'a', bytes: await a.bytes() },
      { id: 'b', bytes: await b.bytes() },
    ],
    pages: [
      { sourceId: 'a', sourcePage: 0 },
      { sourceId: 'b', sourcePage: 0 },
    ],
  });
  assert.deepEqual(
    result.report.fields.map((record) => record.targetName),
    ['Profile.Shared', 'Profile__2.Shared']
  );
  await reopenTwice(result.bytes, (source) => {
    for (const fieldName of ['Profile.Shared', 'Profile__2.Shared']) {
      const record = field(source, fieldName);
      assert.equal(text(read(source, record.dict, 'T')), 'Shared');
      assert.equal(text(read(source, record.parent.dict, 'T')), fieldName.split('.')[0]);
    }
    assert.equal(text(field(source, 'Profile.Shared').effective.V), 'First');
    assert.equal(text(field(source, 'Profile__2.Shared').effective.V), 'Second');
  });
});
test('link merges compatible fields into one canonical field and keeps both original AP streams', async () => {
  const a = await basicPdf({ value: 'Same' }),
    b = await basicPdf({ value: 'Same' }),
    ab = await a.bytes(),
    bb = await b.bytes(),
    originalA = await inspect(ab),
    originalB = await inspect(bb),
    expected = [...apHashes(originalA, 'Shared'), ...apHashes(originalB, 'Shared')].sort();
  const result = await composePdf({
    sources: [
      { id: 'a', bytes: ab },
      { id: 'b', bytes: bb },
    ],
    pages: [
      { sourceId: 'a', sourcePage: 0 },
      { sourceId: 'b', sourcePage: 0 },
    ],
    conflicts: { strategy: 'link' },
  });
  assert.equal(result.stats.fields, 1);
  await reopenTwice(result.bytes, (source) => {
    assertCanonical(source);
    assert.equal(field(source, 'Shared').widgets.length, 2);
    assert.equal(text(field(source, 'Shared').effective.V), 'Same');
    assert.deepEqual(apHashes(source, 'Shared'), expected);
  });
});
test('same /F1 DA name with different underlying fonts is incompatible for link', async () => {
  const a = await basicPdf({ fontName: StandardFonts.Helvetica }),
    b = await basicPdf({ fontName: StandardFonts.TimesRoman });
  await rejected(
    [
      { id: 'a', bytes: await a.bytes() },
      { id: 'b', bytes: await b.bytes() },
    ],
    { conflicts: { strategy: 'link' } },
    'LINK_DEFINITION'
  );
});
test('link refuses different field types without mutating either input', async () => {
  const a = await basicPdf(),
    b = await basicPdf({ kind: 'checkbox', value: true });
  await rejected(
    [
      { id: 'a', bytes: await a.bytes() },
      { id: 'b', bytes: await b.bytes() },
    ],
    { conflicts: { strategy: 'link' } },
    'LINK_DEFINITION'
  );
});
test('link conflicting text values refuses first-value policy rather than leaving stale AP', async () => {
  const a = await basicPdf({ value: 'First' }),
    b = await basicPdf({ value: 'Second' });
  await rejected(
    [
      { id: 'a', bytes: await a.bytes() },
      { id: 'b', bytes: await b.bytes() },
    ],
    { conflicts: { strategy: 'link', valuePolicy: 'first' } },
    'LINK_VALUE_APPEARANCE'
  );
});
test('link default policy rejects conflicting V and DV', async () => {
  const a = await basicPdf({ kind: 'checkbox', value: true }),
    b = await basicPdf({ kind: 'checkbox', value: false });
  await rejected(
    [
      { id: 'a', bytes: await a.bytes() },
      { id: 'b', bytes: await b.bytes() },
    ],
    { conflicts: { strategy: 'link' } },
    'LINK_VALUE'
  );
});
test('explicit checkbox link policy synchronizes canonical V/DV and every AP/AS without stream regeneration', async () => {
  const a = await basicPdf({ kind: 'checkbox', value: true }),
    b = await basicPdf({ kind: 'checkbox', value: false });
  const result = await composePdf({
    sources: [
      { id: 'a', bytes: await a.bytes() },
      { id: 'b', bytes: await b.bytes() },
    ],
    pages: [
      { sourceId: 'a', sourcePage: 0 },
      { sourceId: 'b', sourcePage: 0 },
    ],
    conflicts: { strategy: 'link', valuePolicy: 'first' },
  });
  assert.equal(result.report.valueResolutions.length, 1);
  await reopenTwice(result.bytes, (source) => {
    assertCanonical(source);
    const record = field(source, 'Shared');
    assert.equal(text(record.effective.V), 'Yes');
    assert.equal(text(record.effective.DV), 'Yes');
    for (const widget of record.widgets) {
      assert.equal(text(read(source, widget.dict, 'AS')), 'Yes');
      assert.ok(read(source, read(source, widget.dict, 'AP'), 'N').has(name('Yes')));
    }
    assert.equal(source.pdf.getForm().getCheckBox('Shared').isChecked(), true);
  });
});
test('explicit radio link policy remaps on-state names and Opt in exact Kids order', async () => {
  const a = await basicPdf({ kind: 'radio', value: 'A' }),
    b = await basicPdf({ kind: 'radio', value: 'B' });
  const result = await composePdf({
    sources: [
      { id: 'a', bytes: await a.bytes() },
      { id: 'b', bytes: await b.bytes() },
    ],
    pages: [
      { sourceId: 'b', sourcePage: 0 },
      { sourceId: 'a', sourcePage: 0 },
    ],
    conflicts: { strategy: 'link', valuePolicy: 'first' },
  });
  await reopenTwice(result.bytes, (source) => {
    assertCanonical(source);
    const record = field(source, 'Shared');
    assert.deepEqual(
      record.widgets.map((widget) => widget.option),
      ['A', 'B', 'A', 'B']
    );
    assert.equal(source.pdf.getForm().getRadioGroup('Shared').getSelected(), 'A');
    for (const widget of record.widgets) {
      const state = text(read(source, widget.dict, 'AS')),
        normal = read(source, read(source, widget.dict, 'AP'), 'N');
      assert.ok(normal.has(name(state)));
      if (widget.option === 'A') assert.notEqual(state, 'Off');
      else assert.equal(state, 'Off');
    }
  });
});
test('radio link preserves independent original default A and current B through two native recompositions', async () => {
  const a = await basicPdf({ kind: 'radio', value: 'B' }),
    b = await basicPdf({ kind: 'radio', value: 'A' });
  a.fields.Shared.acroField.dict.set(name('DV'), name('0'));
  b.fields.Shared.acroField.dict.set(name('DV'), name('1'));
  const result = await composePdf({
    sources: [
      { id: 'a', bytes: await a.bytes() },
      { id: 'b', bytes: await b.bytes() },
    ],
    pages: [
      { sourceId: 'a', sourcePage: 0 },
      { sourceId: 'b', sourcePage: 0 },
    ],
    conflicts: { strategy: 'link', valuePolicy: 'first' },
  });
  const finished = await reopenTwice(result.bytes, (source) => {
    const record = field(source, 'Shared');
    assert.equal(source.pdf.getForm().getRadioGroup('Shared').getSelected(), 'B');
    const defaults = record.widgets.filter((widget) =>
      read(source, read(source, widget.dict, 'AP'), 'N').has(record.effective.DV)
    );
    assert.deepEqual(
      defaults.map((widget) => widget.option),
      ['A', 'A']
    );
    assert.notEqual(record.effective.V.toString(), record.effective.DV.toString());
    for (const widget of record.widgets)
      assert.equal(text(read(source, widget.dict, 'AS')) !== 'Off', widget.option === 'B');
  });
  await saveEvidence('linked-radio-independent-default.pdf', finished);
});
test('checkbox link preserves independent false default and true current value', async () => {
  const a = await basicPdf({ kind: 'checkbox', value: true }),
    b = await basicPdf({ kind: 'checkbox', value: false });
  a.fields.Shared.acroField.dict.set(name('DV'), name('Off'));
  b.fields.Shared.acroField.dict.set(name('DV'), name('Yes'));
  const result = await composePdf({
    sources: [
      { id: 'a', bytes: await a.bytes() },
      { id: 'b', bytes: await b.bytes() },
    ],
    pages: [
      { sourceId: 'a', sourcePage: 0 },
      { sourceId: 'b', sourcePage: 0 },
    ],
    conflicts: { strategy: 'link', valuePolicy: 'first' },
  });
  const finished = await reopenTwice(result.bytes, (source) => {
    const record = field(source, 'Shared');
    assert.equal(text(record.effective.V), 'Yes');
    assert.equal(text(record.effective.DV), 'Off');
    for (const widget of record.widgets) assert.equal(text(read(source, widget.dict, 'AS')), 'Yes');
  });
  await saveEvidence('linked-checkbox-independent-default.pdf', finished);
});
test('equal current V with differing DV still rejects default link policy', async () => {
  const a = await basicPdf({ kind: 'radio', value: 'B' }),
    b = await basicPdf({ kind: 'radio', value: 'B' });
  a.fields.Shared.acroField.dict.set(name('DV'), name('0'));
  await rejected(
    [
      { id: 'a', bytes: await a.bytes() },
      { id: 'b', bytes: await b.bytes() },
    ],
    { conflicts: { strategy: 'link' } },
    'LINK_VALUE'
  );
});
test('choice option order remains significant for link', async () => {
  const a = await basicPdf({ kind: 'dropdown', value: 'One' }),
    b = await basicPdf({ kind: 'dropdown', value: 'One' });
  b.fields.Shared.setOptions(['Two', 'One']);
  await rejected(
    [
      { id: 'a', bytes: await a.bytes() },
      { id: 'b', bytes: await b.bytes() },
    ],
    { conflicts: { strategy: 'link' } },
    'LINK_DEFINITION'
  );
});
test('radio selected option omitted by extraction requires explicit clear policy', async () => {
  const fixture = await basicPdf({ pages: 2, kind: 'radio', value: 'A' }),
    radio = fixture.fields.Shared,
    widgets = radio.acroField.getWidgets(),
    second = widgets[1],
    secondRef = fixture.pdf.context.getObjectRef(second.dict);
  fixture.pages[0].node.removeAnnot(secondRef);
  fixture.pages[1].node.addAnnot(secondRef);
  second.dict.set(name('P'), fixture.pages[1].ref);
  radio.select('B');
  radio.acroField.dict.delete(name('DV'));
  const bytes = await fixture.bytes();
  await rejected([{ id: 'source', bytes }], {}, 'RADIO_VALUE_OUTSIDE_SELECTION');
  const result = await extractPdf(bytes, [0], { orphanRadioValue: 'clear' });
  assert.equal(result.report.valueResolutions[0].policy, 'clear-unselected-radio');
  await reopenTwice(result.bytes, (source) => {
    assert.equal(source.pdf.getForm().getRadioGroup('Shared').getSelected(), undefined);
    assert.deepEqual(
      field(source, 'Shared').widgets.map((widget) => widget.option),
      ['A']
    );
  });
});
test('hidden selected radio widget remains a canonical option with value and AP through extraction', async () => {
  const fixture = await basicPdf({ kind: 'radio', value: 'A' }),
    hidden = fixture.fields.Shared.acroField.getWidgets()[0];
  hidden.dict.set(name('F'), PDFNumber.of(32));
  hidden.dict.set(name('Rect'), fixture.pdf.context.obj([20, 280, 20, 280]));
  await reopenTwice((await extractPdf(await fixture.bytes(), [0])).bytes, (source) => {
    assertCanonical(source);
    assert.equal(source.pdf.getForm().getRadioGroup('Shared').getSelected(), 'A');
    const record = field(source, 'Shared');
    assert.deepEqual(
      record.widgets.map((widget) => widget.option),
      ['A', 'B']
    );
    assert.equal(record.widgets[0].flags, 32);
    assert.equal(text(read(source, record.widgets[0].dict, 'AS')), text(record.effective.V));
  });
});
test('self A/AA/Next destinations use each selected instance and cross-page jumps use its group', async () => {
  const fixture = await basicPdf({ pages: 2 }),
    { pdf, pages } = fixture;
  addGoTo(pdf, pages[0], pages[0]);
  addGoTo(pdf, pages[0], pages[1], true);
  const widget = fixture.fields.Shared.acroField.getWidgets()[0];
  widget.dict.set(
    name('AA'),
    pdf.context.obj({
      U: {
        S: 'GoTo',
        D: [pages[0].ref, PDFName.of('Fit')],
        Next: [{ S: 'GoTo', D: [pages[1].ref, PDFName.of('Fit')] }],
      },
    })
  );
  const result = await composePdf({
    sources: [{ id: 's', bytes: await fixture.bytes() }],
    pages: [
      { sourceId: 's', sourcePage: 0, groupId: 'a' },
      { sourceId: 's', sourcePage: 1, groupId: 'a' },
      { sourceId: 's', sourcePage: 0, groupId: 'b' },
      { sourceId: 's', sourcePage: 1, groupId: 'b' },
    ],
  });
  await reopenTwice(result.bytes, (source) => {
    for (const index of [0, 2]) {
      const page = source.pages[index];
      assert.equal(
        read(source, read(source, page.node, 'A'), 'D')
          .get(0)
          .toString(),
        page.ref.toString()
      );
      assert.equal(
        read(source, read(source, read(source, page.node, 'AA'), 'O'), 'D')
          .get(0)
          .toString(),
        source.pages[index + 1].ref.toString()
      );
    }
    for (const widget of field(source, 'Shared').widgets) {
      const action = read(source, read(source, widget.dict, 'AA'), 'U');
      assert.equal(
        read(source, action, 'D').get(0).toString(),
        source.pages[widget.pageIndex].ref.toString()
      );
      const next = read(source, action, 'Next');
      assert.equal(
        read(source, resolve(source, next.get(0)), 'D')
          .get(0)
          .toString(),
        source.pages[widget.pageIndex + 1].ref.toString()
      );
    }
  });
});
test('unselected GoTo is pruned while safe Next URI survives', async () => {
  const fixture = await basicPdf({ pages: 2, form: false }),
    { pdf, pages } = fixture;
  addAnnot(pdf, pages[0], {
    Type: 'Annot',
    Subtype: 'Link',
    Rect: [20, 20, 80, 50],
    P: pages[0].ref,
    A: {
      S: 'GoTo',
      D: [pages[1].ref, PDFName.of('Fit')],
      Next: { S: 'URI', URI: PDFString.of('https://example.test/after') },
    },
  });
  const result = await extractPdf(await fixture.bytes(), [0]);
  assert.ok(result.report.prunedNavigation.length);
  await reopenTwice(result.bytes, (source) => {
    const annotation = resolve(source, source.pages[0].node.Annots().get(0)),
      action = read(source, annotation, 'A');
    assert.equal(text(read(source, action, 'S')), 'URI');
    assert.equal(text(read(source, action, 'URI')), 'https://example.test/after');
    assert.equal(nativePages(source).length, 1);
  });
});
test('ResetForm static field lists are renamed and do not reset other merged sources', async () => {
  const a = await basicPdf(),
    b = await basicPdf();
  b.fields.Shared.acroField
    .getWidgets()[0]
    .dict.set(name('A'), b.pdf.context.obj({ S: 'ResetForm' }));
  const result = await composePdf({
    sources: [
      { id: 'a', bytes: await a.bytes() },
      { id: 'b', bytes: await b.bytes() },
    ],
    pages: [
      { sourceId: 'a', sourcePage: 0 },
      { sourceId: 'b', sourcePage: 0 },
    ],
  });
  await reopenTwice(result.bytes, (source) => {
    const action = read(source, field(source, 'Shared__2').widgets[0].dict, 'A');
    assert.deepEqual(read(source, action, 'Fields').asArray().map(text), ['Shared__2']);
  });
});
test('JavaScript referring to old field names fails with a path and immutable source bytes', async () => {
  const fixture = await basicPdf();
  fixture.fields.Shared.acroField.dict.set(
    name('AA'),
    fixture.pdf.context.obj({
      K: { S: 'JavaScript', JS: PDFString.of('this.getField("Shared").value = 1;') },
    })
  );
  await rejected([{ id: 'scripted', bytes: await fixture.bytes() }], {}, 'OPAQUE_ACTION');
});
test('cyclic action Next fails instead of truncating executable semantics', async () => {
  const fixture = await basicPdf(),
    action = fixture.pdf.context.obj({ S: 'URI', URI: PDFString.of('https://example.test') }),
    ref = fixture.pdf.context.register(action);
  action.set(name('Next'), ref);
  fixture.pages[0].node.set(name('A'), ref);
  await rejected([{ id: 'cycle', bytes: await fixture.bytes() }], {}, 'ACTION_CYCLE');
});
test('opaque action embedded under an unrecognized field key is a located failure', async () => {
  const fixture = await basicPdf();
  fixture.fields.Shared.acroField.dict.set(
    name('VendorAction'),
    fixture.pdf.context.obj({ S: 'JavaScript', JS: PDFString.of('this.getField("Shared")') })
  );
  await rejected([{ id: 'opaque-action', bytes: await fixture.bytes() }], {}, 'UNMIGRATED_ACTION');
});
test('viewer-generated form appearances are rejected until source AP is materialized', async () => {
  const fixture = await basicPdf();
  fixture.pdf.getForm().acroForm.dict.set(name('NeedAppearances'), fixture.pdf.context.obj(true));
  await rejected([{ id: 'dynamic-ap', bytes: await fixture.bytes() }], {}, 'DYNAMIC_APPEARANCE');
});
test('unmapped canonical field reference cannot drag an unselected widget/page into output', async () => {
  const fixture = await basicPdf({ pages: 2 }),
    global = fixture.pdf.getForm().createTextField('Unselected');
  global.addToPage(fixture.pages[1], { x: 20, y: 150, width: 100, height: 30, font: fixture.font });
  global.setText('outside');
  global.updateAppearances(fixture.font);
  fixture.fields.Shared.acroField.dict.set(name('VendorPeer'), global.ref);
  await rejected(
    [{ id: 'escape', bytes: await fixture.bytes() }],
    {},
    'UNSELECTED_INTERACTIVE_REFERENCE'
  );
});
test('unselected annotation references are rejected before any extra page is copied', async () => {
  const fixture = await basicPdf({ pages: 2, form: false }),
    outside = addAnnot(fixture.pdf, fixture.pages[1], {
      Type: 'Annot',
      Subtype: 'Text',
      Rect: [10, 10, 20, 20],
      P: fixture.pages[1].ref,
      Contents: PDFString.of('outside'),
    });
  addAnnot(fixture.pdf, fixture.pages[0], {
    Type: 'Annot',
    Subtype: 'Text',
    Rect: [10, 10, 20, 20],
    P: fixture.pages[0].ref,
    IRT: outside.ref,
  });
  await rejected(
    [{ id: 'annot-escape', bytes: await fixture.bytes() }],
    {},
    'UNSELECTED_INTERACTIVE_REFERENCE'
  );
});
test('wrong widget P versus unique Annots owner is rejected', async () => {
  const fixture = await basicPdf({ pages: 2 });
  fixture.fields.Shared.acroField.getWidgets()[0].dict.set(name('P'), fixture.pages[1].ref);
  await rejected([{ id: 'owner', bytes: await fixture.bytes() }], {}, 'WIDGET_OWNER');
});
test('canonical field tree cycles are rejected without recursing indefinitely', async () => {
  const fixture = await basicPdf();
  fixture.fields.Shared.acroField.dict.set(
    name('Kids'),
    fixture.pdf.context.obj([fixture.fields.Shared.ref])
  );
  await rejected([{ id: 'field-cycle', bytes: await fixture.bytes() }], {}, 'FIELD_CYCLE');
});
test('opaque document-wide name trees are a located all-or-nothing failure', async () => {
  const fixture = await basicPdf();
  fixture.pdf.catalog.set(
    name('Names'),
    fixture.pdf.context.obj({
      JavaScript: { Names: [PDFString.of('unsafe'), { S: 'JavaScript', JS: PDFString.of('1') }] },
    })
  );
  await rejected([{ id: 'opaque-name', bytes: await fixture.bytes() }], {}, 'OPAQUE_NAMES');
});
test('source/selection validation rejects duplicate ids, invalid indexes and empty output', async () => {
  const fixture = await basicPdf(),
    bytes = await fixture.bytes();
  await rejected(
    [
      { id: 's', bytes },
      { id: 's', bytes },
    ],
    {},
    'SOURCE_ID'
  );
  await rejected(
    [{ id: 's', bytes }],
    { pages: [{ sourceId: 's', sourcePage: 20 }] },
    'SELECTION_PAGE'
  );
  await rejected([{ id: 's', bytes }], { pages: [] }, 'SELECTION_LIMIT');
});
test('isolates Contents and mutable Resources for copied instances before future drawing', async () => {
  const fixture = await basicPdf({ pages: 1, form: false }),
    result = await extractPdf(await fixture.bytes(), [0, 0]),
    pdf = await PDFDocument.load(result.bytes),
    pages = pdf.getPages(),
    before = pages[0].node
      .Contents()
      .asArray()
      .map((ref) => ref.toString());
  pages[1].drawRectangle({
    x: 180,
    y: 150,
    width: 60,
    height: 40,
    color: { type: 'RGB', red: 1, green: 0, blue: 0 },
  });
  assert.deepEqual(
    pages[0].node
      .Contents()
      .asArray()
      .map((ref) => ref.toString()),
    before
  );
  assert.notEqual(pages[0].node.Resources(), pages[1].node.Resources());
  assert.notEqual(
    pages[0].node.Resources().lookup(name('XObject')),
    pages[1].node.Resources().lookup(name('XObject'))
  );
  const reopened = await inspect(
    await pdf.save({ updateFieldAppearances: false, useObjectStreams: false })
  );
  assert.equal(reopened.pages[0].node.Contents().size(), before.length);
  assert.ok(reopened.pages[1].node.Contents().size() > before.length);
});
test('copied instances share immutable native stream/font references while owning mutable arrays', async () => {
  const fixture = await basicPdf({ pages: 1, form: false }),
    result = await extractPdf(await fixture.bytes(), [0, 0]),
    source = await inspect(result.bytes),
    [first, second] = source.pages;
  assert.notEqual(first.node.Contents(), second.node.Contents());
  assert.deepEqual(
    first.node
      .Contents()
      .asArray()
      .map((ref) => ref.toString()),
    second.node
      .Contents()
      .asArray()
      .map((ref) => ref.toString())
  );
  assert.notEqual(first.node.Resources(), second.node.Resources());
  const firstFonts = first.node.Resources().lookup(name('Font')),
    secondFonts = second.node.Resources().lookup(name('Font'));
  assert.notEqual(firstFonts, secondFonts);
  assert.deepEqual(
    firstFonts.entries().map(([, ref]) => ref.toString()),
    secondFonts.entries().map(([, ref]) => ref.toString())
  );
});
test('non-widget popup Parent and Popup links retain their native annotation relationship', async () => {
  const fixture = await basicPdf({ pages: 1, form: false }),
    parent = addAnnot(fixture.pdf, fixture.pages[0], {
      Type: 'Annot',
      Subtype: 'Text',
      Rect: [40, 40, 60, 60],
      P: fixture.pages[0].ref,
      Contents: PDFString.of('Native comment'),
    }),
    popup = addAnnot(fixture.pdf, fixture.pages[0], {
      Type: 'Annot',
      Subtype: 'Popup',
      Rect: [70, 40, 170, 120],
      P: fixture.pages[0].ref,
      Parent: parent.ref,
    });
  parent.dict.set(name('Popup'), popup.ref);
  await reopenTwice((await extractPdf(await fixture.bytes(), [0, 0])).bytes, (source) => {
    for (const page of source.pages) {
      const annots = page.node.Annots().asArray(),
        [parent, popup] = annots.map((entry) => resolve(source, entry));
      assert.equal(parent.get(name('Popup')).toString(), annots[1].toString());
      assert.equal(popup.get(name('Parent')).toString(), annots[0].toString());
      assert.equal(popup.get(name('P')).toString(), page.ref.toString());
    }
  });
});
test('AcroForm default DA and Q become explicit independent leaf attributes', async () => {
  const fixture = await basicPdf();
  fixture.fields.Shared.acroField.dict.delete(name('DA'));
  fixture.pdf.getForm().acroForm.dict.set(name('DA'), PDFString.of('/F1 15 Tf 0.1 0.2 0.3 rg'));
  fixture.pdf.getForm().acroForm.dict.set(name('Q'), PDFNumber.of(2));
  await reopenTwice((await extractPdf(await fixture.bytes(), [0])).bytes, (source) => {
    const record = field(source, 'Shared');
    assert.equal(record.dict.get(name('Q')).asNumber(), 2);
    assert.match(text(record.effective.DA), /15 Tf 0\.1 0\.2 0\.3 rg/);
    assert.ok(record.dict.has(name('DA')));
  });
});
test('nonvisual canonical field value and calculation-order identity are retained', async () => {
  const fixture = await basicPdf(),
    global = fixture.pdf.getForm().createTextField('Global');
  global.acroField.dict.set(name('V'), PDFHexString.fromText('global-value'));
  global.acroField.dict.set(name('DV'), PDFHexString.fromText('global-default'));
  fixture.pdf.getForm().acroForm.dict.set(name('CO'), fixture.pdf.context.obj([global.ref]));
  await reopenTwice((await extractPdf(await fixture.bytes(), [0])).bytes, (source) => {
    const record = field(source, 'Global');
    assert.equal(record.widgets.length, 0);
    assert.equal(text(record.effective.V), 'global-value');
    assert.equal(text(record.effective.DV), 'global-default');
    assert.equal(read(source, source.form, 'CO').get(0).toString(), record.ref.toString());
  });
});
test('image link compares independent native DV instead of substituting current image data', async () => {
  const a = await sevenFields(),
    b = await sevenFields();
  a.fields.Image.acroField.dict.set(name('DV'), PDFHexString.fromText('default-A'));
  b.fields.Image.acroField.dict.set(name('DV'), PDFHexString.fromText('default-B'));
  await rejected(
    [
      { id: 'a', bytes: await a.bytes() },
      { id: 'b', bytes: await b.bytes() },
    ],
    {
      pages: [
        { sourceId: 'a', sourcePage: 0 },
        { sourceId: 'b', sourcePage: 0 },
      ],
      conflicts: { strategy: 'link', valuePolicy: 'first' },
    },
    'LINK_VALUE_APPEARANCE'
  );
});
test('radio last-value policy retains selected source V, DV and independent design default', async () => {
  const a = await basicPdf({ kind: 'radio', value: 'A' }),
    b = await basicPdf({ kind: 'radio', value: 'B' });
  a.fields.Shared.acroField.dict.set(
    name('ZuviFieldDesign'),
    PDFHexString.fromText(JSON.stringify({ kind: 'radio', defaultValue: 'A' }))
  );
  b.fields.Shared.acroField.dict.set(name('DV'), name('0'));
  b.fields.Shared.acroField.dict.set(
    name('ZuviFieldDesign'),
    PDFHexString.fromText(JSON.stringify({ kind: 'radio', defaultValue: 'A' }))
  );
  const result = await composePdf({
    sources: [
      { id: 'a', bytes: await a.bytes() },
      { id: 'b', bytes: await b.bytes() },
    ],
    pages: [
      { sourceId: 'a', sourcePage: 0 },
      { sourceId: 'b', sourcePage: 0 },
    ],
    conflicts: { strategy: 'link', valuePolicy: 'last' },
  });
  await reopenTwice(result.bytes, (source) => {
    const record = field(source, 'Shared'),
      design = JSON.parse(text(read(source, record.dict, 'ZuviFieldDesign')));
    assert.equal(source.pdf.getForm().getRadioGroup('Shared').getSelected(), 'B');
    assert.equal(design.defaultValue, 'A');
    assert.deepEqual(
      record.widgets
        .filter((widget) =>
          read(source, read(source, widget.dict, 'AP'), 'N').has(record.effective.DV)
        )
        .map((widget) => widget.option),
      ['A', 'A']
    );
  });
});
test('radio native on-state aliases are linked by logical export option without losing V or DV', async () => {
  const a = await basicPdf({ kind: 'radio', value: 'A' }),
    b = await basicPdf({ kind: 'radio', value: 'A' });
  a.fields.Shared.acroField.dict.set(name('DV'), name('1'));
  b.fields.Shared.acroField.dict.set(name('DV'), name('1'));
  for (const widget of b.fields.Shared.acroField.getWidgets()) {
    const ap = widget.dict.lookup(name('AP'));
    for (const key of ['N', 'D', 'R']) {
      const normal = ap.lookup(name(key));
      if (!(normal instanceof PDFDict)) continue;
      for (const state of normal.keys())
        if (state !== name('Off')) {
          const appearance = normal.get(state);
          normal.delete(state);
          normal.set(name(`B${state.decodeText()}`), appearance);
        }
    }
    const state = text(widget.dict.lookup(name('AS')));
    if (state !== 'Off') widget.dict.set(name('AS'), name(`B${state}`));
  }
  b.fields.Shared.acroField.dict.set(name('V'), name('B0'));
  b.fields.Shared.acroField.dict.set(name('DV'), name('B1'));
  const ab = await a.bytes(),
    bb = await b.bytes(),
    sa = await inspect(ab),
    sb = await inspect(bb),
    expected = [...apHashes(sa, 'Shared'), ...apHashes(sb, 'Shared')].sort();
  const result = await composePdf({
    sources: [
      { id: 'a', bytes: ab },
      { id: 'b', bytes: bb },
    ],
    pages: [
      { sourceId: 'a', sourcePage: 0 },
      { sourceId: 'b', sourcePage: 0 },
    ],
    conflicts: { strategy: 'link' },
  });
  await reopenTwice(result.bytes, (source) => {
    assert.equal(source.pdf.getForm().getRadioGroup('Shared').getSelected(), 'A');
    assert.deepEqual(apHashes(source, 'Shared'), expected);
    const record = field(source, 'Shared');
    assert.deepEqual(
      record.widgets
        .filter((widget) =>
          read(source, read(source, widget.dict, 'AP'), 'N').has(record.effective.DV)
        )
        .map((widget) => widget.option),
      ['B', 'B']
    );
  });
});
test('different checkbox native export state is an incompatible link definition', async () => {
  const a = await basicPdf({ kind: 'checkbox', value: true }),
    b = await basicPdf({ kind: 'checkbox', value: true });
  for (const widget of b.fields.Shared.acroField.getWidgets()) {
    const ap = widget.dict.lookup(name('AP'));
    for (const key of ['N', 'D', 'R']) {
      const normal = ap.lookup(name(key));
      if (!(normal instanceof PDFDict)) continue;
      const appearance = normal.get(name('Yes'));
      normal.delete(name('Yes'));
      normal.set(name('On'), appearance);
    }
    widget.dict.set(name('AS'), name('On'));
  }
  b.fields.Shared.acroField.dict.set(name('V'), name('On'));
  b.fields.Shared.acroField.dict.set(name('DV'), name('On'));
  await rejected(
    [
      { id: 'a', bytes: await a.bytes() },
      { id: 'b', bytes: await b.bytes() },
    ],
    { conflicts: { strategy: 'link' } },
    'LINK_DEFINITION'
  );
});
test('signed field is rejected before native composition and source bytes remain immutable', async () => {
  const fixture = await basicPdf();
  fixture.fields.Shared.acroField.dict.set(name('FT'), name('Sig'));
  fixture.fields.Shared.acroField.dict.set(
    name('V'),
    fixture.pdf.context.obj({
      Type: 'Sig',
      ByteRange: [0, 10, 20, 30],
      Contents: PDFHexString.of('FFFF'),
    })
  );
  await rejected([{ id: 'signed', bytes: await fixture.bytes() }], {}, 'SIGNED_FIELD');
});
test('native bytes API accepts Blob source input and returns reopenable immutable bytes', async () => {
  const fixture = await basicPdf({ pages: 1, form: false }),
    bytes = await fixture.bytes(),
    originalHash = hash(bytes),
    result = await composePdf({
      sources: [{ id: 'blob', bytes: new Blob([bytes], { type: 'application/pdf' }) }],
      pages: [{ sourceId: 'blob', sourcePage: 0, instanceId: 'stable-page' }],
    });
  assert.equal(hash(bytes), originalHash);
  assert.equal(result.report.pages[0].instanceId, 'stable-page');
  assert.equal((await inspect(result.bytes)).pages.length, 1);
});
test('combined opaque widget preserves raw FT, value, Rect, F and AP without pdf-lib field classification', async () => {
  const fixture = await hiddenOpaque();
  combineFieldWidget(fixture, 'Opaque');
  const bytes = await fixture.bytes(),
    original = await inspect(bytes),
    originalRecord = field(original, 'Opaque'),
    rect = canonical(original, originalRecord.widgets[0].dict.get(name('Rect'))),
    aps = apHashes(original, 'Opaque');
  await reopenTwice((await extractPdf(bytes, [0, 0])).bytes, (source) => {
    const record = field(source, 'Opaque');
    assert.equal(text(record.effective.FT), 'VendorPassive');
    assert.equal(text(record.effective.V), 'value-Opaque');
    assert.equal(record.widgets.length, 2);
    for (const widget of record.widgets) {
      assert.equal(widget.flags, 0);
      assert.deepEqual(canonical(source, widget.dict.get(name('Rect'))), rect);
      assert.deepEqual(streamBytes(source, widget.dict.get(name('AP'))).sort(), aps);
    }
    assertCanonical(source);
  });
});
test('duplicate opaque field names cannot be renamed or linked without private semantic support', async () => {
  const a = await hiddenOpaque(),
    b = await hiddenOpaque();
  await rejected(
    [
      { id: 'a', bytes: await a.bytes() },
      { id: 'b', bytes: await b.bytes() },
    ],
    {},
    'OPAQUE_FIELD_RENAME'
  );
  await rejected(
    [
      { id: 'a', bytes: await a.bytes() },
      { id: 'b', bytes: await b.bytes() },
    ],
    { conflicts: { strategy: 'link' } },
    'LINK_OPAQUE_FIELD'
  );
});
test('malformed standard field values cannot masquerade as empty values during link', async () => {
  const fixture = await basicPdf();
  fixture.fields.Shared.acroField.dict.set(name('V'), PDFNumber.of(42));
  await rejected([{ id: 'bad-value', bytes: await fixture.bytes() }], {}, 'FIELD_VALUE_TYPE');
});
test('anonymous field groups have an explicit unsupported-name error rather than a partial output', async () => {
  const fixture = await basicPdf({ fieldName: 'Group.Child' }),
    parent = fixture.fields['Group.Child'].acroField.getParent();
  parent.dict.delete(name('T'));
  await rejected([{ id: 'anonymous', bytes: await fixture.bytes() }], {}, 'FIELD_NAME');
});
test('final link resolution report identifies the actual chosen source after three input records', async () => {
  const a = await basicPdf({ kind: 'radio', value: 'A' }),
    b = await basicPdf({ kind: 'radio', value: 'B' }),
    c = await basicPdf({ kind: 'radio', value: 'A' });
  const result = await composePdf({
    sources: [
      { id: 'a', bytes: await a.bytes() },
      { id: 'b', bytes: await b.bytes() },
      { id: 'c', bytes: await c.bytes() },
    ],
    pages: ['a', 'b', 'c'].map((sourceId) => ({ sourceId, sourcePage: 0 })),
    conflicts: { strategy: 'link', valuePolicy: 'last' },
  });
  assert.equal(result.report.valueResolutions.length, 1);
  const resolution = result.report.valueResolutions[0];
  assert.equal(resolution.sourceId, 'b');
  assert.equal(resolution.chosenSourceId, 'c');
  assert.equal(resolution.currentBefore, 'B');
  assert.equal(resolution.currentAfter, 'A');
  assert.equal(resolution.defaultBefore, 'B');
  assert.equal(resolution.defaultAfter, 'A');
  assert.equal(
    (await inspect(result.bytes)).pdf.getForm().getRadioGroup('Shared').getSelected(),
    'A'
  );
});
test('combined widget Hide reference targets its own child annotation and field-global context retains the original instance', async () => {
  const fixture = await basicPdf({ pages: 1 });
  const combined = combineFieldWidget(fixture, 'Shared');
  combined.acroField.dict.set(
    name('AA'),
    fixture.pdf.context.obj({
      F: { S: 'Hide', T: combined.ref, H: false },
      U: { S: 'Hide', T: combined.ref, H: true },
    })
  );
  const result = await composePdf({
    sources: [{ id: 's', bytes: await fixture.bytes() }],
    pages: [
      { sourceId: 's', sourcePage: 0, groupId: 'copy' },
      { sourceId: 's', sourcePage: 0 },
    ],
  });
  await reopenTwice(result.bytes, (source) => {
    const record = field(source, 'Shared'),
      original = record.widgets.find((widget) => widget.pageIndex === 1);
    const global = read(source, read(source, record.dict, 'AA'), 'F');
    assert.equal(global.get(name('T')).toString(), original.ref.toString());
    for (const widget of record.widgets) {
      const action = read(source, read(source, widget.dict, 'AA'), 'U');
      assert.equal(action.get(name('T')).toString(), widget.ref.toString());
      assert.notEqual(action.get(name('T')).toString(), record.ref.toString());
      assert.equal(read(source, action, 'H').toString(), 'true');
    }
  });
});
test('Hide field names are rewritten, native annotation NM identity remains unchanged', async () => {
  const a = await basicPdf(),
    b = await basicPdf();
  b.fields.Shared.acroField
    .getWidgets()[0]
    .dict.set(
      name('AA'),
      b.pdf.context.obj({ U: { S: 'Hide', T: PDFString.of('Shared'), H: true } })
    );
  b.fields.Shared.acroField
    .getWidgets()[0]
    .dict.set(name('NM'), PDFHexString.fromText('native-widget-identity'));
  const result = await composePdf({
    sources: [
      { id: 'a', bytes: await a.bytes() },
      { id: 'b', bytes: await b.bytes() },
    ],
    pages: [
      { sourceId: 'a', sourcePage: 0 },
      { sourceId: 'b', sourcePage: 0 },
    ],
  });
  await reopenTwice(result.bytes, (source) => {
    const widget = field(source, 'Shared__2').widgets[0],
      action = read(source, read(source, widget.dict, 'AA'), 'U');
    assert.equal(text(read(source, action, 'T')), 'Shared__2');
    assert.equal(text(read(source, widget.dict, 'NM')), 'native-widget-identity');
  });
});
test('field-global GoTo and cross-group fallback retain the original page behind a front-inserted copy', async () => {
  const fixture = await basicPdf({ pages: 2 });
  fixture.fields.Shared.acroField.dict.set(
    name('AA'),
    fixture.pdf.context.obj({ F: { S: 'GoTo', D: [fixture.pages[0].ref, PDFName.of('Fit')] } })
  );
  fixture.fields.Shared.acroField
    .getWidgets()[0]
    .dict.set(
      name('AA'),
      fixture.pdf.context.obj({ U: { S: 'GoTo', D: [fixture.pages[1].ref, PDFName.of('Fit')] } })
    );
  const result = await composePdf({
    sources: [{ id: 's', bytes: await fixture.bytes() }],
    pages: [
      { sourceId: 's', sourcePage: 0, groupId: 'copy' },
      { sourceId: 's', sourcePage: 0 },
      { sourceId: 's', sourcePage: 1 },
    ],
  });
  await reopenTwice(result.bytes, (source) => {
    const record = field(source, 'Shared'),
      global = read(source, read(source, record.dict, 'AA'), 'F');
    assert.equal(read(source, global, 'D').get(0).toString(), source.pages[1].ref.toString());
    for (const widget of record.widgets) {
      const action = read(source, read(source, widget.dict, 'AA'), 'U');
      assert.equal(read(source, action, 'D').get(0).toString(), source.pages[2].ref.toString());
    }
  });
});
test('relative and executable URI links reject instead of changing their origin or dynamic name semantics', async () => {
  for (const [uri, code] of [
    ['other.pdf', 'RELATIVE_URI'],
    ['javascript:this.getField("Shared")', 'OPAQUE_URI_SCHEME'],
    ['blob:https://example.test/temporary', 'OPAQUE_URI_SCHEME'],
  ]) {
    const fixture = await basicPdf({ form: false });
    addAnnot(fixture.pdf, fixture.pages[0], {
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [20, 20, 50, 50],
      P: fixture.pages[0].ref,
      A: { S: 'URI', URI: PDFString.of(uri) },
    });
    await rejected([{ id: 'uri', bytes: await fixture.bytes() }], {}, code);
  }
});
test('GoToR keeps absolute remote names and page numbers but refuses relative file targets', async () => {
  for (const destination of [PDFName.of('Chapter'), [PDFNumber.of(4), PDFName.of('Fit')]]) {
    const fixture = await basicPdf({ form: false });
    addAnnot(fixture.pdf, fixture.pages[0], {
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [20, 20, 50, 50],
      P: fixture.pages[0].ref,
      A: {
        S: 'GoToR',
        F: PDFString.of('https://example.test/original.pdf'),
        D: Array.isArray(destination) ? fixture.pdf.context.obj(destination) : destination,
      },
    });
    await reopenTwice((await extractPdf(await fixture.bytes(), [0])).bytes, (source) => {
      const action = read(source, resolve(source, source.pages[0].node.Annots().get(0)), 'A');
      assert.equal(text(read(source, action, 'F')), 'https://example.test/original.pdf');
      assert.equal(
        read(source, action, 'D').toString(),
        Array.isArray(destination) ? '[ 4 /Fit ]' : '/Chapter'
      );
    });
  }
  const fixture = await basicPdf({ form: false });
  addAnnot(fixture.pdf, fixture.pages[0], {
    Type: 'Annot',
    Subtype: 'Link',
    Rect: [20, 20, 50, 50],
    P: fixture.pages[0].ref,
    A: { S: 'GoToR', F: PDFString.of('../original.pdf'), D: PDFName.of('Chapter') },
  });
  await rejected(
    [{ id: 'remote-relative', bytes: await fixture.bytes() }],
    {},
    'RELATIVE_REMOTE_FILE'
  );
});
test('external stream data and reference XObjects cannot silently disappear from a Blob-only composition', async () => {
  for (const [key, value, code] of [
    ['F', PDFString.of('/original/external-stream.bin'), 'EXTERNAL_STREAM'],
    ['Ref', { F: PDFString.of('/original/referenced.pdf'), Page: 0 }, 'EXTERNAL_XOBJECT'],
  ]) {
    const fixture = await basicPdf({ form: false }),
      contents = fixture.pdf.context.lookup(fixture.pages[0].node.Contents().get(0));
    contents.dict.set(
      name(key),
      value instanceof PDFString ? value : fixture.pdf.context.obj(value)
    );
    await rejected([{ id: 'external', bytes: await fixture.bytes() }], {}, code);
  }
});
test('unsigned signature seed and field-lock policies reject before name or page changes', async () => {
  for (const key of ['SV', 'Lock']) {
    const fixture = await basicPdf();
    fixture.fields.Shared.acroField.dict.set(name('FT'), name('Sig'));
    fixture.fields.Shared.acroField.dict.delete(name('V'));
    fixture.fields.Shared.acroField.dict.set(
      name(key),
      fixture.pdf.context.obj({ Fields: [PDFString.of('Shared')] })
    );
    await rejected(
      [{ id: 'signature-policy', bytes: await fixture.bytes() }],
      {},
      'SIGNATURE_FIELD_POLICY'
    );
  }
});
test('private field-name binding metadata rejects unsafe conflict renaming', async () => {
  const a = await basicPdf(),
    b = await basicPdf();
  b.fields.Shared.acroField.dict.set(name('VendorBinding'), PDFString.of('Shared'));
  await rejected(
    [
      { id: 'a', bytes: await a.bytes() },
      { id: 'b', bytes: await b.bytes() },
    ],
    {},
    'OPAQUE_RENAME_METADATA'
  );
});
test('link rejects different canonical mapping names or alternative labels rather than discarding one', async () => {
  for (const key of ['TM', 'TU']) {
    const a = await basicPdf(),
      b = await basicPdf();
    b.fields.Shared.acroField.dict.set(name(key), PDFString.of('different-native-metadata'));
    await rejected(
      [
        { id: 'a', bytes: await a.bytes() },
        { id: 'b', bytes: await b.bytes() },
      ],
      { conflicts: { strategy: 'link' } },
      'LINK_DEFINITION'
    );
  }
});
test('absolute SubmitForm preserves its source export mapping and relative submission targets reject', async () => {
  const a = await basicPdf(),
    b = await basicPdf();
  b.fields.Shared.acroField.dict.set(name('TM'), PDFString.of('serverField'));
  b.fields.Shared.acroField
    .getWidgets()[0]
    .dict.set(
      name('A'),
      b.pdf.context.obj({ S: 'SubmitForm', F: PDFString.of('https://example.test/submit') })
    );
  const result = await composePdf({
    sources: [
      { id: 'a', bytes: await a.bytes() },
      { id: 'b', bytes: await b.bytes() },
    ],
    pages: [
      { sourceId: 'a', sourcePage: 0 },
      { sourceId: 'b', sourcePage: 0 },
    ],
  });
  await reopenTwice(result.bytes, (source) => {
    const record = field(source, 'Shared__2'),
      action = read(source, record.widgets[0].dict, 'A');
    assert.equal(text(read(source, record.dict, 'TM')), 'serverField');
    assert.equal(text(read(source, action, 'F')), 'https://example.test/submit');
    assert.deepEqual(read(source, action, 'Fields').asArray().map(text), ['Shared__2']);
  });
  const fixture = await basicPdf();
  fixture.fields.Shared.acroField
    .getWidgets()[0]
    .dict.set(name('A'), fixture.pdf.context.obj({ S: 'SubmitForm', F: PDFString.of('./submit') }));
  await rejected(
    [{ id: 'relative-submit', bytes: await fixture.bytes() }],
    {},
    'RELATIVE_REMOTE_FILE'
  );
});
