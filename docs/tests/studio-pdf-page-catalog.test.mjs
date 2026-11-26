import assert from 'node:assert/strict';
import { Blob, Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import test from 'node:test';
import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFNumber,
  PDFRawStream,
  decodePDFRawStream,
} from 'pdf-lib';
import { basicPdf } from './studio-pdf-compose-fixtures.mjs';
import { readLabelEntries, setLabels } from './studio-pdf-compose-catalog-fixtures.mjs';
import { pdfTestRuntime } from './studio-pdf-test-runtime.mjs';

const OUTPUT = '/tmp/zuvi-pdf-page-catalog-native/output/pdf';
const name = PDFName.of;
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const source = async (fixture) =>
  new Blob([new Uint8Array(await fixture.bytes())], { type: 'application/pdf' });
function runtime() {
  const r = pdfTestRuntime();
  return {
    ...r.load('../src/pages/collaboration/office-studio/studio-pdf-codec.ts'),
    ...r.load('../src/pages/collaboration/office-studio/studio-pdf-composition.ts'),
    ...r.load('../../packages/ui/src/components/OfficeStudio/studio-pdf-pages.ts'),
  };
}
function printRange(pdf) {
  const preferences = pdf.catalog.lookup(name('ViewerPreferences'));
  const value =
    preferences instanceof PDFDict ? preferences.lookup(name('PrintPageRange')) : undefined;
  return value instanceof PDFArray
    ? value.asArray().map((entry) => pdf.context.lookup(entry).asNumber())
    : undefined;
}
function streams(pdf, page) {
  const contents = pdf.getPages()[page].node.Contents();
  return contents instanceof PDFArray ? contents.asArray() : contents ? [contents] : [];
}
function commands(pdf, page) {
  return streams(pdf, page)
    .map((ref) =>
      Buffer.from(decodePDFRawStream(pdf.context.lookup(ref)).decode()).toString('latin1')
    )
    .join('\n');
}
function appearances(pdf) {
  return pdf
    .getForm()
    .getFields()
    .flatMap((field) =>
      field.acroField.getWidgets().map((widget) => {
        const appearance = widget.dict.lookup(name('AP')).lookup(name('N'));
        assert.ok(appearance instanceof PDFRawStream);
        return hash(appearance.contents);
      })
    )
    .sort();
}
function canonicalFields(pdf) {
  for (const field of pdf.getForm().getFields())
    for (const widget of field.acroField.getWidgets()) {
      assert.equal(widget.dict.get(name('Parent')).toString(), field.ref.toString());
      const owners = pdf.getPages().filter((page) =>
        page.node
          .Annots()
          ?.asArray()
          .some((ref) => pdf.context.lookup(ref) === widget.dict)
      );
      assert.equal(owners.length, 1);
      assert.equal(widget.P().toString(), owners[0].ref.toString());
    }
}
async function evidence(file, blob) {
  await mkdir(OUTPUT, { recursive: true });
  await writeFile(`${OUTPUT}/${file}`, new Uint8Array(await blob.arrayBuffer()));
}
async function reopenAndSaveTwice(c, input, inspect) {
  let blob = input;
  for (let round = 0; round <= 2; round++) {
    const native = await PDFDocument.load(await blob.arrayBuffer());
    inspect(native, round);
    canonicalFields(native);
    if (round < 2) {
      const document = await c.importStudioPdf(blob, `Round-${round}.pdf`);
      document.marks = [
        {
          id: `round-${round}`,
          type: 'rectangle',
          page: 0,
          x: 210,
          y: 30,
          width: 15,
          height: 15,
          text: '',
          size: 12,
        },
      ];
      const next = await c.exportStudioPdf(document, blob);
      assert.notEqual(
        next,
        blob,
        'Both rounds write a real native PDF rather than returning unchanged bytes.'
      );
      blob = next;
    }
  }
  return blob;
}

test('virtual move preserves original page labels and print preference through the actual composition adapter and two native saves', async () => {
  const c = runtime(),
    fixture = await basicPdf({ pages: 2 });
  setLabels(fixture.pdf, [
    [0, { P: 'A' }],
    [1, { P: 'B' }],
  ]);
  fixture.pdf.catalog.set(
    name('ViewerPreferences'),
    fixture.pdf.context.obj({ PrintPageRange: [0, 0], NumCopies: 2, PrintScaling: 'None' })
  );
  const original = await source(fixture),
    model = c.pdfMovePages(await c.importStudioPdf(original, 'Labels.pdf'), [1], 0);
  const output = await c.composeStudioPdf({
    snapshot: { document: model, source: original },
    mode: 'extract',
    pages: [0, 1],
    conflicts: { strategy: 'rename', valuePolicy: 'reject' },
  });
  await reopenAndSaveTwice(c, output.source, (pdf) => {
    assert.deepEqual(readLabelEntries(pdf), [
      { page: 0, style: undefined, prefix: 'B', first: 1 },
      { page: 1, style: undefined, prefix: 'A', first: 1 },
    ]);
    assert.deepEqual(printRange(pdf), [1, 1]);
    assert.equal(
      pdf.catalog.lookup(name('ViewerPreferences')).lookup(name('NumCopies')).asNumber(),
      2
    );
    assert.ok(commands(pdf, 0).includes(Buffer.from('SRC_PAGE_2').toString('hex').toUpperCase()));
    assert.ok(commands(pdf, 1).includes(Buffer.from('SRC_PAGE_1').toString('hex').toUpperCase()));
  });
});

test('nested ranges survive copy, blank insertion, multi-page move and deletion with original refs, resources, field AP and defaults intact', async () => {
  const c = runtime(),
    fixture = await basicPdf({ pages: 5, value: 'Current' }),
    field = fixture.fields.Shared;
  field.acroField.dict.set(name('DV'), PDFHexString.fromText('Default'));
  field.addToPage(fixture.pages[4], { x: 20, y: 280, width: 130, height: 30, font: fixture.font });
  field.updateAppearances(fixture.font);
  setLabels(
    fixture.pdf,
    [
      [0, { Type: 'PageLabel', S: 'r', P: '前言-', St: 3 }],
      [2, { S: 'D', P: '正文-', St: 8 }],
      [4, { S: 'A', P: 'Appendix-', St: 2 }],
    ],
    true
  );
  fixture.pdf.catalog.set(
    name('ViewerPreferences'),
    fixture.pdf.context.obj({
      PrintPageRange: [0, 1, 3, 4],
      NumCopies: 3,
      Duplex: 'DuplexFlipLongEdge',
    })
  );
  fixture.pdf.catalog.set(name('Lang'), PDFHexString.fromText('zh-CN'));
  fixture.pdf.catalog.set(
    name('Metadata'),
    fixture.pdf.context.register(
      fixture.pdf.context.stream('<x:xmpmeta>preserved</x:xmpmeta>', {
        Type: 'Metadata',
        Subtype: 'XML',
      })
    )
  );
  const original = await source(fixture),
    before = await PDFDocument.load(await original.arrayBuffer()),
    digest = hash(new Uint8Array(await original.arrayBuffer()));
  const originalRefs = before.getPages().map((page) => page.ref.toString()),
    originalStreams = before
      .getPages()
      .map((_, index) => streams(before, index).map((ref) => ref.toString()));
  const originalAppearances = appearances(before),
    metadataRef = before.catalog.get(name('Metadata')).toString();
  let document = c.pdfCopyPages(await c.importStudioPdf(original, 'Complex.pdf'), [1, 4], 3);
  document = c.pdfInsertBlankPage(document, 2, { width: 320, height: 240 });
  document = c.pdfMovePages(document, [0, 6], 8);
  document = c.pdfRemovePages(document, [2, 5]);
  assert.deepEqual(
    document.pages.map((page) => page.sourcePage),
    [1, undefined, 1, 4, 0, 3]
  );
  const labels = [
    { page: 0, style: 'r', prefix: '前言-', first: 4 },
    { page: 1, style: 'D', prefix: undefined, first: 2 },
    { page: 2, style: 'r', prefix: '前言-', first: 4 },
    { page: 3, style: 'A', prefix: 'Appendix-', first: 2 },
    { page: 4, style: 'r', prefix: '前言-', first: 3 },
    { page: 5, style: 'D', prefix: '正文-', first: 9 },
  ];
  const prepared = await c.exportStudioPdf(document, original),
    native = await PDFDocument.load(await prepared.arrayBuffer());
  assert.deepEqual(readLabelEntries(native), labels);
  assert.deepEqual(printRange(native), [0, 0, 2, 5]);
  assert.deepEqual(
    [
      native.getPages()[0].ref.toString(),
      native.getPages()[4].ref.toString(),
      native.getPages()[5].ref.toString(),
    ],
    [originalRefs[1], originalRefs[0], originalRefs[3]]
  );
  for (const [index, descriptor] of document.pages.entries())
    if (descriptor.sourcePage !== undefined)
      assert.deepEqual(
        streams(native, index).map((ref) => ref.toString()),
        originalStreams[descriptor.sourcePage]
      );
  assert.notEqual(native.getPages()[0].ref.toString(), native.getPages()[2].ref.toString());
  assert.notEqual(native.getPages()[3].ref.toString(), originalRefs[4]);
  assert.equal(native.catalog.get(name('Metadata')).toString(), metadataRef);
  assert.deepEqual(appearances(native), originalAppearances);
  canonicalFields(native);
  const stable = await reopenAndSaveTwice(c, prepared, (pdf) => {
    assert.deepEqual(readLabelEntries(pdf), labels);
    assert.deepEqual(printRange(pdf), [0, 0, 2, 5]);
    assert.equal(pdf.getForm().getTextField('Shared').getText(), 'Current');
    assert.equal(
      pdf.getForm().getTextField('Shared').acroField.dict.lookup(name('DV')).decodeText(),
      'Default'
    );
    assert.deepEqual(appearances(pdf), originalAppearances);
    assert.equal(pdf.catalog.lookup(name('Lang')).decodeText(), 'zh-CN');
    assert.equal(
      pdf.catalog.lookup(name('ViewerPreferences')).lookup(name('Duplex')),
      name('DuplexFlipLongEdge')
    );
  });
  // Composition sees the corrected native base and maps one more extraction without stale source indexes.
  const extracted = await c.composeStudioPdf({
    snapshot: { document, source: original },
    mode: 'extract',
    pages: [5, 1, 3, 0],
    conflicts: { strategy: 'rename', valuePolicy: 'reject' },
  });
  const expected = [labels[5], labels[1], labels[3], labels[0]].map((entry, page) => ({
    ...entry,
    page,
  }));
  const finished = await reopenAndSaveTwice(c, extracted.source, (pdf) => {
    assert.deepEqual(readLabelEntries(pdf), expected);
    assert.deepEqual(printRange(pdf), [0, 0, 2, 3]);
    assert.equal(pdf.getPageCount(), 4);
    assert.equal(
      pdf.context
        .enumerateIndirectObjects()
        .filter(
          ([, value]) => value instanceof PDFDict && value.lookup(name('Type')) === name('Page')
        ).length,
      4
    );
    assert.equal(pdf.getForm().getTextField('Shared').getText(), 'Current');
    assert.equal(
      pdf.getForm().getTextField('Shared').acroField.dict.lookup(name('DV')).decodeText(),
      'Default'
    );
    assert.equal(pdf.getForm().getTextField('Shared').acroField.getWidgets().length, 1);
  });
  assert.equal(hash(new Uint8Array(await original.arrayBuffer())), digest);
  await evidence('catalog-complex-original.pdf', original);
  await evidence('catalog-complex-prepared.pdf', stable);
  await evidence('catalog-complex-extracted.pdf', finished);
});

test('all five numbering styles and prefix-only labels retain their own starts after native reorder and merge', async () => {
  const c = runtime(),
    fixture = await basicPdf({ pages: 6 }),
    incoming = await basicPdf({ pages: 1, form: false });
  const definitions = [
    [0, { S: 'D', P: 'Decimal-', St: 10 }],
    [1, { S: 'R', P: 'Roman-', St: 4 }],
    [2, { S: 'r', P: 'roman-', St: 3 }],
    [3, { S: 'A', P: 'Letter-', St: 2 }],
    [4, { S: 'a', P: 'letter-', St: 26 }],
    [5, { P: 'cover', St: 7 }],
  ];
  setLabels(fixture.pdf, definitions);
  const original = await source(fixture);
  let document = await c.importStudioPdf(original, 'Styles.pdf');
  for (let index = 0; index < 6; index++)
    document = c.pdfMovePages(
      document,
      [document.pages.findIndex((page) => page.sourcePage === 5 - index)],
      index
    );
  const output = await c.composeStudioPdf({
    snapshot: { document, source: original },
    mode: 'merge',
    pages: [0, 1, 2, 3, 4, 5],
    insertAt: 3,
    incoming: { source: await source(incoming), name: 'Incoming.pdf', pages: [0] },
    conflicts: { strategy: 'rename', valuePolicy: 'reject' },
  });
  const expected = [...definitions]
    .reverse()
    .map(([, props], page) => ({ page, style: props.S, prefix: props.P, first: props.St }));
  expected.splice(3, 0, { page: 3, style: 'D', prefix: undefined, first: 1 });
  expected.forEach((entry, page) => {
    entry.page = page;
  });
  await reopenAndSaveTwice(c, output.source, (pdf) => {
    assert.deepEqual(readLabelEntries(pdf), expected);
  });
});

test('unlabelled sources stay unlabelled and removing the entire print selection removes only that preference', async () => {
  const c = runtime(),
    fixture = await basicPdf({ pages: 3, form: false });
  fixture.pdf.catalog.set(
    name('ViewerPreferences'),
    fixture.pdf.context.obj({ PrintPageRange: [0, 0], NumCopies: 2, HideToolbar: true })
  );
  const original = await source(fixture),
    document = c.pdfInsertBlankPage(
      c.pdfRemovePages(await c.importStudioPdf(original, 'Unlabelled.pdf'), [0]),
      1,
      { width: 320, height: 240 }
    );
  const prepared = await c.exportStudioPdf(document, original),
    native = await PDFDocument.load(await prepared.arrayBuffer());
  assert.equal(native.catalog.lookup(name('PageLabels')), undefined);
  assert.equal(printRange(native), undefined);
  const output = await c.composeStudioPdf({
    snapshot: { document, source: original },
    mode: 'extract',
    pages: [2, 1, 0],
    conflicts: { strategy: 'rename', valuePolicy: 'reject' },
  });
  await reopenAndSaveTwice(c, output.source, (pdf) => {
    assert.equal(pdf.catalog.lookup(name('PageLabels')), undefined);
    assert.equal(printRange(pdf), undefined);
    assert.equal(
      pdf.catalog.lookup(name('ViewerPreferences')).lookup(name('NumCopies')).asNumber(),
      2
    );
    assert.equal(
      pdf.catalog.lookup(name('ViewerPreferences')).lookup(name('HideToolbar')).asBoolean(),
      true
    );
  });
});

const invalidLabels = [
  ['unknown style', (f) => setLabels(f.pdf, [[0, { S: 'Unsupported' }]])],
  [
    'non-text prefix',
    (f) => setLabels(f.pdf, [[0, { S: 'D' }]]),
    (pdf) =>
      pdf.catalog
        .lookup(name('PageLabels'))
        .lookup(name('Nums'))
        .lookup(1)
        .set(name('P'), PDFNumber.of(5)),
  ],
  ['zero start', (f) => setLabels(f.pdf, [[0, { S: 'D', St: 0 }]])],
  ['overflow start', (f) => setLabels(f.pdf, [[0, { S: 'D', St: Number.MAX_SAFE_INTEGER }]])],
  ['missing first page', (f) => setLabels(f.pdf, [[1, { S: 'D' }]])],
  [
    'unsorted branches',
    (f) => {
      const child = (index) =>
        f.pdf.context.register(
          f.pdf.context.obj({
            Nums: [index, f.pdf.context.obj({ S: 'D' })],
            Limits: [index, index],
          })
        );
      f.pdf.catalog.set(
        name('PageLabels'),
        f.pdf.context.register(f.pdf.context.obj({ Kids: [child(1), child(0)] }))
      );
    },
  ],
  [
    'cyclic children',
    (f) => {
      const dict = f.pdf.context.obj({}),
        ref = f.pdf.context.register(dict);
      dict.set(name('Kids'), f.pdf.context.obj([ref]));
      f.pdf.catalog.set(name('PageLabels'), ref);
    },
  ],
  [
    'incorrect limits',
    (f) => setLabels(f.pdf, [[0, { S: 'D' }]], true),
    (pdf) =>
      pdf.catalog
        .lookup(name('PageLabels'))
        .lookup(name('Kids'))
        .lookup(0)
        .set(name('Limits'), pdf.context.obj([0, 1])),
  ],
  ['opaque label property', (f) => setLabels(f.pdf, [[0, { S: 'D', Private: 'value' }]])],
];
for (const [label, create, mutate] of invalidLabels)
  test(`rejects ${label} labels before exporting any changed page tree`, async () => {
    const c = runtime(),
      fixture = await basicPdf({ pages: 2 });
    create(fixture);
    mutate?.(fixture.pdf);
    const original = await source(fixture),
      digest = hash(new Uint8Array(await original.arrayBuffer()));
    const document = c.pdfMovePages(await c.importStudioPdf(original, 'Invalid.pdf'), [1], 0);
    await assert.rejects(c.exportStudioPdf(document, original), /PDF 页面目录无效.*PageLabels/);
    assert.equal(hash(new Uint8Array(await original.arrayBuffer())), digest);
  });

for (const value of [[0], [1, 0], [0, 1, 1, 1], [0, 2], [0.5, 1]])
  test(`rejects malformed native print range ${JSON.stringify(value)}`, async () => {
    const c = runtime(),
      fixture = await basicPdf({ pages: 2 });
    fixture.pdf.catalog.set(
      name('ViewerPreferences'),
      fixture.pdf.context.obj({ PrintPageRange: value })
    );
    const original = await source(fixture),
      document = c.pdfCopyPages(await c.importStudioPdf(original, 'Print.pdf'), [0], 2);
    await assert.rejects(c.exportStudioPdf(document, original), /PDF 页面目录无效.*PrintPageRange/);
  });

test('catalog remapping preserves an unrelated native catalog feature and composition continues to reject unsupported semantics', async () => {
  const c = runtime(),
    fixture = await basicPdf({ pages: 2 });
  setLabels(fixture.pdf, [[0, { S: 'D', St: 5 }]]);
  const opaque = fixture.pdf.context.register(
    fixture.pdf.context.obj({ Owner: PDFHexString.fromText('preserved') })
  );
  fixture.pdf.catalog.set(name('PrivateCatalogFeature'), opaque);
  const original = await source(fixture),
    document = c.pdfMovePages(await c.importStudioPdf(original, 'Opaque.pdf'), [1], 0);
  const output = await c.exportStudioPdf(document, original),
    native = await PDFDocument.load(await output.arrayBuffer());
  assert.equal(native.catalog.get(name('PrivateCatalogFeature')).toString(), opaque.toString());
  assert.equal(
    native.catalog.lookup(name('PrivateCatalogFeature')).lookup(name('Owner')).decodeText(),
    'preserved'
  );
  await assert.rejects(
    c.composeStudioPdf({
      snapshot: { document, source: original },
      mode: 'extract',
      pages: [0, 1],
      conflicts: { strategy: 'rename', valuePolicy: 'reject' },
    }),
    /OPAQUE_CATALOG/
  );
});

test('catalog remapping does not bypass native signature protection', async () => {
  const c = runtime(),
    fixture = await basicPdf({ pages: 2 });
  const signature = fixture.pdf.getForm().createTextField('Signature');
  signature.acroField.dict.set(name('FT'), name('Sig'));
  signature.acroField.dict.set(
    name('V'),
    fixture.pdf.context.obj({
      Type: 'Sig',
      Contents: PDFHexString.of('001122'),
      ByteRange: [0, 100, 120, 200],
    })
  );
  setLabels(fixture.pdf, [[0, { S: 'D', St: 5 }]]);
  const original = await source(fixture),
    document = c.pdfMovePages(await c.importStudioPdf(original, 'Signed.pdf'), [1], 0);
  await assert.rejects(c.exportStudioPdf(document, original), /数字签名/);
});
