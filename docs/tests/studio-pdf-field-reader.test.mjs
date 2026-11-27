/* global structuredClone */
import assert from 'node:assert/strict';
import { Blob } from 'node:buffer';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import test from 'node:test';
import { URL } from 'node:url';
import { pdfTestRuntime } from './studio-pdf-test-runtime.mjs';

const require = createRequire(new URL('../package.json', import.meta.url));
const {
  PDFDocument,
  PDFDict,
  PDFName,
  PDFNull,
  PDFRef,
  PDFString,
  PDFHexString,
  PDFRawStream,
  StandardFonts,
} = require('pdf-lib');
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const save = async (pdf) =>
  new Blob(
    [new Uint8Array(await pdf.save({ updateFieldAppearances: false, useObjectStreams: false }))],
    { type: 'application/pdf' }
  );
const runtime = () => {
  const r = pdfTestRuntime();
  return {
    ...r.load('../src/pages/collaboration/office-studio/studio-pdf-codec.ts'),
    ...r.load('../src/pages/collaboration/office-studio/studio-pdf-field-reader.ts'),
    ...r.load('../../packages/ui/src/components/OfficeStudio/studio-pdf-pages.ts'),
  };
};

async function fixture() {
  const pdf = await PDFDocument.create(),
    font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = [pdf.addPage([400, 500]), pdf.addPage([300, 400])];
  const editable = pdf.getForm().createTextField('editable');
  editable.setText('Original');
  editable.addToPage(pages[0], { x: 20, y: 400, width: 140, height: 24, font });
  const passive = pdf.getForm().createTextField('custom');
  passive.setText('Private value');
  passive.addToPage(pages[0], { x: 20, y: 350, width: 140, height: 24, font });
  passive.acroField.dict.set(PDFName.of('FT'), PDFName.of('CustomField'));
  passive.acroField.dict.set(
    PDFName.of('V'),
    pdf.context.obj({ Nested: PDFString.of('Private value'), Codes: [1, 2, 3] })
  );
  passive.acroField.dict.set(PDFName.of('DV'), PDFString.of('Default'));
  const password = pdf.getForm().createTextField('password');
  password.setText('Secret-value');
  password.addToPage(pages[1], { x: 20, y: 300, width: 140, height: 24, font });
  password.enablePassword();
  const invisible = pdf.getForm().createTextField('invisible');
  invisible.setText('Hidden');
  invisible.addToPage(pages[1], { x: 20, y: 240, width: 140, height: 24, font });
  invisible.acroField.getWidgets()[0].setFlags(1);
  const zero = pdf.getForm().createTextField('zero');
  zero.setText('Zero');
  zero.addToPage(pages[1], { x: 20, y: 180, width: 140, height: 24, font });
  zero.acroField.getWidgets()[0].setFlags(0);
  zero.acroField.getWidgets()[0].setRectangle({ x: 20, y: 180, width: 0, height: 0 });
  const noWidget = pdf.getForm().createTextField('noWidget');
  noWidget.acroField.dict.set(PDFName.of('FT'), PDFName.of('CustomField'));
  noWidget.acroField.dict.delete(PDFName.of('Kids'));
  noWidget.acroField.dict.set(PDFName.of('V'), PDFString.of('Nonvisual'));
  return pdf;
}

function appearanceHashes(pdf) {
  const result = [];
  for (const page of pdf.getPages())
    for (const entry of page.node.Annots()?.asArray() ?? []) {
      const dict = pdf.context.lookup(entry),
        normal = dict instanceof PDFDict ? dict.lookup(PDFName.of('AP')) : undefined;
      const stream = normal instanceof PDFDict ? normal.lookup(PDFName.of('N')) : undefined;
      if (stream instanceof PDFRawStream) result.push(hash(stream.contents));
    }
  return result;
}

test('enumerates unknown terminal fields, protects private values and retains Invisible and zero-area controls', async () => {
  const c = runtime(),
    source = await save(await fixture()),
    native = await PDFDocument.load(await source.arrayBuffer());
  assert.equal(
    native.getForm().getFields().length,
    4,
    'pdf-lib omits the two unknown terminal fields'
  );
  const document = await c.importStudioPdf(source, 'Passive.pdf');
  assert.equal(document.fields.length, 6);
  assert.equal(c.enumeratePdfFields(native).length, 6);
  for (const name of ['custom', 'password', 'noWidget']) {
    const field = document.fields.find((field) => field.name === name);
    assert.equal(field.type, 'opaque');
    assert.equal(field.readOnly, true);
    assert.equal(field.value, '');
    assert.match(field.nativeValueHash, /^[a-f0-9]{64}$/);
  }
  assert.ok(!JSON.stringify(document).includes('Secret-value'));
  assert.ok(!JSON.stringify(document).includes('Private value'));
  assert.equal(document.fields.find((field) => field.name === 'noWidget').widgets.length, 0);
  for (const name of ['invisible', 'zero']) {
    const field = document.fields.find((field) => field.name === name);
    assert.equal(field.widgets.length, 0);
    assert.equal(field.hiddenWidgets.length, 1);
  }
  assert.equal(
    document.fields.find((field) => field.name === 'invisible').hiddenWidgets[0].flags,
    1
  );
  assert.equal(document.fields.find((field) => field.name === 'zero').hiddenWidgets[0].flags, 0);
  assert.equal(await c.exportStudioPdf(document, source), source);
});

test('edits a supported field, preserves passive canonical values and appearances, and reopens twice', async () => {
  const c = runtime();
  let source = await save(await fixture()),
    document = await c.importStudioPdf(source, 'Source.pdf');
  const original = await PDFDocument.load(await source.arrayBuffer()),
    originalAp = appearanceHashes(original);
  const identity = document.fields
    .filter((field) => field.type === 'opaque')
    .map((field) => [field.name, field.nativeValueHash]);
  for (let round = 1; round <= 2; round++) {
    document.fields.find((field) => field.name === 'editable').value = `Edited ${round}`;
    source = await c.exportStudioPdf(document, source);
    const native = await PDFDocument.load(await source.arrayBuffer());
    assert.equal(c.enumeratePdfFields(native).length, 6);
    assert.equal(native.getForm().getTextField('editable').getText(), `Edited ${round}`);
    assert.equal(native.getForm().getTextField('password').getText(), 'Secret-value');
    assert.deepEqual(appearanceHashes(native).slice(1), originalAp.slice(1));
    document = await c.importStudioPdf(source, 'Reopened.pdf');
    assert.deepEqual(
      document.fields
        .filter((field) => field.type === 'opaque')
        .map((field) => [field.name, field.nativeValueHash]),
      identity
    );
  }
});

test('copies, moves and deletes native pages while keeping unknown and nonvisual field ownership', async () => {
  const c = runtime();
  let source = await save(await fixture()),
    document = await c.importStudioPdf(source, 'Source.pdf');
  document = c.pdfCopyPages(document, [0, 1], 0);
  document = c.pdfRemovePages(document, [2, 3]);
  document = c.pdfMovePages(document, [0], 2);
  source = await c.exportStudioPdf(document, source);
  const native = await PDFDocument.load(await source.arrayBuffer());
  assert.equal(native.getPageCount(), 2);
  assert.equal(c.enumeratePdfFields(native).length, 6);
  const reopened = await c.importStudioPdf(source, 'Copied.pdf');
  assert.equal(reopened.fields.find((field) => field.name === 'custom').widgets[0].page, 1);
  assert.equal(reopened.fields.find((field) => field.name === 'password').widgets[0].page, 0);
  assert.equal(reopened.fields.find((field) => field.name === 'zero').hiddenWidgets[0].page, 0);
  assert.equal(await c.exportStudioPdf(reopened, source), source);
});

test('refuses passive value, type, flags, geometry, deletion and design replacement without modifying the source', async () => {
  const c = runtime(),
    source = await save(await fixture()),
    document = await c.importStudioPdf(source, 'Source.pdf');
  const digest = hash(new Uint8Array(await source.arrayBuffer()));
  const changes = [
    (doc) => {
      doc.fields.find((field) => field.name === 'custom').value = 'Edited';
    },
    (doc) => {
      doc.fields.find((field) => field.name === 'custom').nativeValueHash = 'a'.repeat(64);
    },
    (doc) => {
      doc.fields.find((field) => field.name === 'custom').nativeType = 'Tx';
    },
    (doc) => {
      doc.fields.find((field) => field.name === 'custom').widgets[0].flags = 2;
    },
    (doc) => {
      doc.fields.find((field) => field.name === 'custom').widgets[0].x += 10;
    },
    (doc) => {
      doc.fields = doc.fields.filter((field) => field.name !== 'custom');
    },
    (doc) => {
      doc.fields = doc.fields.filter((field) => field.name !== 'custom');
      doc.removedFields = ['custom'];
    },
    (doc) => {
      const field = doc.fields.find((field) => field.name === 'custom');
      field.type = 'text';
      field.design = { kind: 'text', sourceName: 'custom' };
    },
  ];
  for (const change of changes) {
    const draft = structuredClone(document);
    change(draft);
    await assert.rejects(c.exportStudioPdf(draft, source), /只读原生|原有字段缺失/);
    assert.equal(hash(new Uint8Array(await source.arrayBuffer())), digest);
  }
});

test('validates canonical cycles, duplicate roots, orphan widgets and unknown FT before public field traversal', async () => {
  const c = runtime();
  const mutations = [
    (pdf) => {
      const fields = pdf.getForm().acroForm.Fields();
      fields.push(fields.get(0));
    },
    (pdf) => {
      const field = pdf.getForm().getTextField('editable');
      field.acroField.dict.set(PDFName.of('Kids'), pdf.context.obj([field.ref]));
    },
    (pdf) => {
      const fields = pdf.getForm().acroForm.Fields();
      fields.remove(0);
    },
    (pdf) => {
      const field = pdf.getForm().getTextField('editable');
      field.acroField.dict.set(PDFName.of('FT'), pdf.context.obj(42));
    },
  ];
  for (const mutate of mutations) {
    const pdf = await fixture();
    mutate(pdf);
    const source = await save(pdf);
    await assert.rejects(
      c.importStudioPdf(source, 'Invalid.pdf'),
      /重复|循环|原生字段树|原生字段类型/
    );
  }
});

test('reads unsigned signature fields passively but prevents editing an existing signature payload', async () => {
  const c = runtime();
  for (const signed of [false, true]) {
    const pdf = await fixture(),
      field = pdf.getForm().createTextField('signature');
    field.acroField.dict.set(PDFName.of('FT'), PDFName.of('Sig'));
    if (signed)
      field.acroField.dict.set(
        PDFName.of('V'),
        pdf.context.obj({
          Type: 'Sig',
          Contents: PDFHexString.of('001122'),
          ByteRange: [0, 100, 120, 200],
        })
      );
    const source = await save(pdf),
      document = await c.importStudioPdf(source, 'Signature.pdf');
    assert.equal(document.fields.find((entry) => entry.name === 'signature').type, 'opaque');
    assert.equal(await c.exportStudioPdf(document, source), source);
    document.fields.find((entry) => entry.name === 'editable').value = 'Edited';
    if (signed) await assert.rejects(c.exportStudioPdf(document, source), /数字签名/);
    else assert.ok((await c.exportStudioPdf(document, source)).size > 0);
  }
});

test('splits combined widgets while Hide keeps annotation identity and ResetForm keeps field identity through page copies', async () => {
  const c = runtime(),
    pdf = await fixture(),
    field = pdf.getForm().getTextField('editable'),
    page = pdf.getPages()[0];
  const widget = field.acroField.getWidgets()[0],
    child = field.acroField.Kids().get(0);
  for (const [key, value] of widget.dict.entries())
    if (key !== PDFName.of('Parent')) field.acroField.dict.set(key, value);
  field.acroField.dict.delete(PDFName.of('Kids'));
  page.node.Annots().set(page.node.Annots().indexOf(child), field.ref);
  pdf.context.delete(child);
  const hide = () => pdf.context.obj({ S: 'Hide', T: field.ref, H: true });
  field.acroField.dict.set(PDFName.of('AA'), pdf.context.obj({ V: hide(), Fo: hide() }));
  field.acroField.dict.set(PDFName.of('A'), hide());
  pdf.catalog.set(
    PDFName.of('OpenAction'),
    pdf.context.obj({ S: 'ResetForm', Fields: [field.ref], Next: hide() })
  );
  const source = await save(pdf),
    document = c.pdfCopyPages(await c.importStudioPdf(source, 'Combined.pdf'), [0], 0);
  const output = await c.exportStudioPdf(document, source),
    native = await PDFDocument.load(await output.arrayBuffer());
  const canonical = native.getForm().getTextField('editable'),
    widgets = canonical.acroField.getWidgets();
  assert.equal(widgets.length, 2);
  assert.equal(canonical.acroField.dict.lookup(PDFName.of('A')), undefined);
  assert.equal(
    canonical.acroField.dict.lookup(PDFName.of('AA')).lookup(PDFName.of('Fo')),
    undefined
  );
  const original = widgets.find(
    (widget) => widget.P().toString() === native.getPages()[1].ref.toString()
  );
  const originalRef = native.context.getObjectRef(original.dict);
  const globalHide = canonical.acroField.dict.lookup(PDFName.of('AA')).lookup(PDFName.of('V'));
  assert.equal(globalHide.get(PDFName.of('T')).toString(), originalRef.toString());
  for (const widget of widgets) {
    const event = widget.dict.lookup(PDFName.of('AA')).lookup(PDFName.of('Fo'));
    assert.equal(
      event.get(PDFName.of('T')).toString(),
      native.context.getObjectRef(widget.dict).toString()
    );
    assert.equal(widget.dict.lookup(PDFName.of('AA')).lookup(PDFName.of('V')), undefined);
    assert.equal(
      widget.dict.lookup(PDFName.of('A')).get(PDFName.of('T')).toString(),
      native.context.getObjectRef(widget.dict).toString()
    );
  }
  const reset = native.catalog.lookup(PDFName.of('OpenAction'));
  assert.equal(reset.lookup(PDFName.of('Fields')).get(0).toString(), canonical.ref.toString());
  assert.equal(
    reset.lookup(PDFName.of('Next')).get(PDFName.of('T')).toString(),
    originalRef.toString()
  );
  const reopened = await c.importStudioPdf(output, 'Reopened.pdf');
  assert.equal(await c.exportStudioPdf(reopened, output), output);
});

test('bounds cyclic indirect passive values and retains the original source bytes', async () => {
  const c = runtime(),
    pdf = await fixture();
  const custom = c.enumeratePdfFields(pdf).find((field) => field.getName() === 'custom');
  const ref = pdf.context.nextRef();
  pdf.context.assign(ref, ref);
  custom.acroField.dict.set(PDFName.of('V'), ref);
  const source = await save(pdf),
    digest = hash(new Uint8Array(await source.arrayBuffer()));
  await assert.rejects(c.importStudioPdf(source, 'Cyclic.pdf'), /原生字段值形成循环/);
  assert.equal(hash(new Uint8Array(await source.arrayBuffer())), digest);
});

test('inherits through direct and indirect null entries when protecting passive current and default values', async () => {
  const c = runtime();
  for (const indirect of [false, true]) {
    const pdf = await fixture(),
      field = pdf.getForm().getTextField('password');
    const parent = pdf.context.obj({
      T: PDFString.of('Root'),
      Kids: [field.ref],
      FT: PDFName.of('Tx'),
      Ff: field.acroField.dict.get(PDFName.of('Ff')),
      V: PDFString.of('Parent-current'),
      DV: PDFString.of('Parent-default'),
    });
    const parentRef = pdf.context.register(parent),
      roots = pdf.getForm().acroForm.Fields();
    roots.set(roots.indexOf(field.ref), parentRef);
    field.acroField.dict.set(PDFName.of('Parent'), parentRef);
    field.acroField.dict.delete(PDFName.of('FT'));
    field.acroField.dict.delete(PDFName.of('Ff'));
    for (const name of ['V', 'DV'])
      field.acroField.dict.set(
        PDFName.of(name),
        indirect ? pdf.context.register(PDFNull) : PDFNull
      );
    const source = await save(pdf),
      document = await c.importStudioPdf(source, 'Inherited.pdf');
    const identity = document.fields.find(
      (entry) => entry.name === 'Root.password'
    ).nativeValueHash;
    assert.ok(!JSON.stringify(document).includes('Parent-current'));
    assert.equal(await c.exportStudioPdf(document, source), source);
    for (const name of ['V', 'DV']) {
      const changed = await PDFDocument.load(await source.arrayBuffer());
      const ancestor = changed.catalog
        .AcroForm()
        .lookup(PDFName.of('Fields'))
        .asArray()
        .map((entry) => changed.context.lookup(entry))
        .find((entry) => entry.lookup(PDFName.of('T'))?.decodeText() === 'Root');
      ancestor.set(PDFName.of(name), PDFString.of(`Changed-parent-${name}`));
      const changedSource = await save(changed),
        reopened = await c.importStudioPdf(changedSource, 'Changed.pdf');
      assert.notEqual(
        reopened.fields.find((entry) => entry.name === 'Root.password').nativeValueHash,
        identity
      );
      await assert.rejects(c.exportStudioPdf(document, changedSource), /只读原生/);
      assert.equal(await c.exportStudioPdf(reopened, changedSource), changedSource);
    }
  }
});

test('materializes effective terminal values and flags before constructing native wrappers or exposing editable values', async () => {
  const c = runtime();
  for (const indirect of [false, true])
    for (const password of [false, true]) {
      const pdf = await fixture(),
        field = pdf.getForm().getTextField('password');
      const parent = pdf.context.obj({
        T: PDFString.of('Root'),
        Kids: [field.ref],
        FT: PDFName.of('Tx'),
        Ff: password ? 8192 : 0,
        V: PDFString.of('Inherited-current'),
        DV: PDFString.of('Inherited-default'),
        MaxLen: 60,
        Q: 2,
        DA: PDFString.of('/Helvetica 12 Tf 0 g'),
      });
      const parentRef = pdf.context.register(parent),
        roots = pdf.getForm().acroForm.Fields();
      roots.set(roots.indexOf(field.ref), parentRef);
      field.acroField.dict.set(PDFName.of('Parent'), parentRef);
      for (const name of ['FT', 'Ff', 'V', 'DV', 'Q', 'MaxLen', 'DA'])
        field.acroField.dict.set(
          PDFName.of(name),
          indirect ? pdf.context.register(PDFNull) : PDFNull
        );
      const source = await save(pdf),
        before = hash(new Uint8Array(await source.arrayBuffer()));
      let document = await c.importStudioPdf(source, 'Inherited.pdf');
      const imported = document.fields.find((entry) => entry.name === 'Root.password');
      assert.equal(imported.type, password ? 'opaque' : 'text');
      assert.equal(imported.value, password ? '' : 'Inherited-current');
      if (password) assert.ok(!JSON.stringify(document).includes('Inherited-current'));
      assert.equal(await c.exportStudioPdf(document, source), source);
      document.fields.find((entry) => entry.name === 'editable').value = 'Independent edit';
      let output = await c.exportStudioPdf(document, source);
      for (let round = 1; round <= 2; round++) {
        const native = await PDFDocument.load(await output.arrayBuffer()),
          wrapped = c
            .enumeratePdfFields(native)
            .find((entry) => entry.getName() === 'Root.password');
        assert.equal(wrapped.getText(), 'Inherited-current');
        assert.equal(wrapped.getMaxLength(), 60);
        assert.equal(wrapped.getAlignment(), 2);
        assert.equal(wrapped.isPassword(), password);
        assert.equal(
          wrapped.acroField.dict.lookup(PDFName.of('DV')).decodeText(),
          'Inherited-default'
        );
        document = await c.importStudioPdf(output, `Reopened-${round}.pdf`);
        assert.equal(
          document.fields.find((entry) => entry.name === 'Root.password').value,
          password ? '' : 'Inherited-current'
        );
        if (password) assert.ok(!JSON.stringify(document).includes('Inherited-current'));
        document.fields.find((entry) => entry.name === 'editable').value = `Round ${round}`;
        output = await c.exportStudioPdf(document, output);
      }
      assert.equal(hash(new Uint8Array(await source.arrayBuffer())), before);
    }
});

for (const indirect of [false, true])
  test(`accepts ${indirect ? 'indirect' : 'direct'} null XFA entries through two native edit and save rounds`, async () => {
    const c = runtime(),
      pdf = await fixture();
    pdf.getForm().acroForm.dict.set(
      PDFName.of('XFA'),
      indirect ? pdf.context.register(PDFNull) : PDFNull
    );
    const source = await save(pdf),
      digest = hash(new Uint8Array(await source.arrayBuffer())),
      nativeSource = await PDFDocument.load(await source.arrayBuffer());
    const rawXfa = nativeSource.catalog.AcroForm().get(PDFName.of('XFA'), true);
    assert.equal(rawXfa instanceof PDFRef, indirect);
    assert.equal(nativeSource.context.lookup(rawXfa), PDFNull);
    assert.equal(nativeSource.catalog.AcroForm().lookup(PDFName.of('XFA')), undefined);
    let document = await c.importStudioPdf(source, 'Null-XFA.pdf'),
      current = source;
    assert.equal(await c.exportStudioPdf(document, source), source);
    for (let round = 1; round <= 2; round++) {
      document.fields.find((field) => field.name === 'editable').value = `Null-XFA round ${round}`;
      current = await c.exportStudioPdf(document, current);
      const native = await PDFDocument.load(await current.arrayBuffer());
      assert.equal(native.getForm().getTextField('editable').getText(), `Null-XFA round ${round}`);
      document = await c.importStudioPdf(current, `Reopened-${round}.pdf`);
      assert.equal(document.fields.find((field) => field.name === 'editable').value, `Null-XFA round ${round}`);
      assert.equal(await c.exportStudioPdf(document, current), current);
    }
    assert.equal(hash(new Uint8Array(await source.arrayBuffer())), digest);
  });

test('continues to reject actual XFA streams and packet arrays on import and export without changing source bytes', async () => {
  const c = runtime(),
    original = await save(await fixture()),
    document = await c.importStudioPdf(original, 'Original.pdf');
  for (const packets of [false, true]) {
    const pdf = await fixture(),
      stream = pdf.context.register(pdf.context.stream('<template xmlns="http://www.xfa.org/schema/xfa-template/3.3/"/>'));
    pdf.getForm().acroForm.dict.set(
      PDFName.of('XFA'),
      packets ? pdf.context.obj([PDFString.of('template'), stream]) : stream
    );
    const source = await save(pdf),
      digest = hash(new Uint8Array(await source.arrayBuffer()));
    await assert.rejects(c.importStudioPdf(source, 'Dynamic-XFA.pdf'), /XFA 动态表单/);
    await assert.rejects(c.exportStudioPdf(document, source), /XFA 动态表单/);
    assert.equal(hash(new Uint8Array(await source.arrayBuffer())), digest);
  }
});

test('ignores null structural dictionary entries without weakening required field and widget ownership', async () => {
  const c = runtime();
  for (const indirect of [false, true]) {
    const pdf = await fixture(),
      field = pdf.getForm().getTextField('editable');
    const nil = () => (indirect ? pdf.context.register(PDFNull) : PDFNull);
    field.acroField.dict.set(PDFName.of('Parent'), nil());
    const widget = field.acroField.getWidgets()[0];
    for (const name of ['P', 'T', 'FT']) widget.dict.set(PDFName.of(name), nil());
    const source = await save(pdf),
      document = await c.importStudioPdf(source, 'Nullable.pdf');
    assert.equal(document.fields.find((entry) => entry.name === 'editable').type, 'text');
    assert.equal(await c.exportStudioPdf(document, source), source);
    document.fields.find((entry) => entry.name === 'editable').value = 'Edited';
    const output = await c.exportStudioPdf(document, source),
      native = await PDFDocument.load(await output.arrayBuffer());
    assert.equal(native.getForm().getTextField('editable').getText(), 'Edited');
    assert.equal(
      (await c.importStudioPdf(output, 'Again.pdf')).fields.length,
      document.fields.length
    );
    const invalid = await PDFDocument.load(await source.arrayBuffer());
    c.enumeratePdfFields(invalid)
      .find((entry) => entry.getName() === 'editable')
      .acroField.getWidgets()[0]
      .dict.set(PDFName.of('Parent'), indirect ? invalid.context.register(PDFNull) : PDFNull);
    await assert.rejects(c.importStudioPdf(await save(invalid), 'Missing-owner.pdf'), /父级不一致/);
  }
});
