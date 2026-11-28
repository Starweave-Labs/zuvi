/* global structuredClone */
import assert from 'node:assert/strict';
import { Blob, Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import { URL } from 'node:url';
import { trueTypeFromWoff } from '../../scripts/office-fonts.mjs';
import { pdfTestRuntime } from './studio-pdf-test-runtime.mjs';

const require = createRequire(new URL('../package.json', import.meta.url));
const {
  PDFDocument,
  PDFArray,
  PDFDict,
  PDFRawStream,
  PDFName,
  PDFString,
  StandardFonts,
  degrees,
  decodePDFRawStream,
} = require('pdf-lib');
function codec(fetch) {
  const runtime = pdfTestRuntime({ fetch });
  return { ...runtime.load('../src/pages/collaboration/office-studio/studio-pdf-codec.ts'), requests: runtime.requests };
}

const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
async function blob(pdf) {
  return new Blob(
    [new Uint8Array(await pdf.save({ useObjectStreams: false, updateFieldAppearances: false }))],
    { type: 'application/pdf' }
  );
}

async function original() {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([480, 640]);
  page.setCropBox(30, 40, 400, 560);
  page.setRotation(degrees(90));
  const second = pdf.addPage([300, 400]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText('Original page content', { x: 70, y: 550, size: 16, font });
  second.drawText('Original second page', { x: 40, y: 350, size: 14, font });
  const form = pdf.getForm();
  const name = form.createTextField('name');
  name.setText('Original');
  name.addToPage(page, { x: 70, y: 450, width: 180, height: 26, font });
  const confirmed = form.createCheckBox('confirmed');
  confirmed.addToPage(page, { x: 70, y: 400, width: 18, height: 18 });
  confirmed.addToPage(second, { x: 40, y: 280, width: 18, height: 18 });
  const status = form.createDropdown('status');
  status.addOptions(['Draft', 'Approved']);
  status.select('Draft');
  status.addToPage(page, { x: 110, y: 400, width: 150, height: 24, font });
  const choice = form.createRadioGroup('choice');
  choice.addOptionToPage('A', page, { x: 70, y: 350, width: 16, height: 16 });
  choice.addOptionToPage('B', page, { x: 110, y: 350, width: 16, height: 16 });
  choice.addOptionToPage('C', second, { x: 40, y: 250, width: 16, height: 16 });
  choice.select('A');
  const notes = form.createTextField('notes');
  notes.enableMultiline();
  notes.setText('Line 1\nLine 2');
  notes.addToPage(page, { x: 70, y: 270, width: 180, height: 54, font });
  const reference = form.createTextField('reference');
  reference.setText('LOCKED');
  reference.enableReadOnly();
  reference.addToPage(page, { x: 70, y: 220, width: 100, height: 24, font });
  form.updateFieldAppearances(font);
  return blob(pdf);
}

function streams(pdf, index) {
  const contents = pdf.getPages()[index].node.Contents();
  if (!contents) return [];
  const entries = contents instanceof PDFArray ? contents.asArray() : [contents];
  return entries
    .map((entry) => pdf.context.lookup(entry))
    .filter((entry) => entry instanceof PDFRawStream);
}
const streamHashes = (pdf, index) =>
  streams(pdf, index).map((stream) => digest(stream.getContents()));
const pageInstructions = (pdf, index) =>
  streams(pdf, index)
    .map((stream) => Buffer.from(decodePDFRawStream(stream).decode()).toString())
    .join('\n');

test('creates every designed field kind as native AcroForm data with original page streams unchanged', async () => {
  const c = codec();
  const source = await original();
  const originalPdf = await PDFDocument.load(await source.arrayBuffer());
  let document = await c.importStudioPdf(source, 'Designed.pdf');
  const widget = (y, extra = {}) => ({ page: 1, x: 40, y, width: 160, height: 24, ...extra });
  const text = (name, y, design, value = '') => ({
    name,
    type: 'text',
    value,
    readOnly: false,
    widgets: [widget(y)],
    design: { kind: 'text', fontSize: 12, borderWidth: 1, ...design },
  });
  const additions = [
    text(
      'designed_name',
      200,
      { required: true, tooltip: 'Your name', maxLength: 20, defaultValue: 'Guest' },
      'Alice'
    ),
    text('date', 160, { kind: 'date', defaultValue: '2026-11-24' }, '2026-11-24'),
    {
      name: 'accept',
      type: 'checkbox',
      value: true,
      readOnly: false,
      widgets: [widget(120, { width: 20, height: 20 })],
      design: { kind: 'checkbox', exportValue: 'Approved', defaultValue: true },
    },
    {
      name: 'level',
      type: 'choice',
      value: 'B',
      options: ['A', 'B'],
      readOnly: false,
      widgets: [
        widget(80, { width: 18, height: 18, option: 'A' }),
        widget(80, { x: 80, width: 18, height: 18, option: 'B' }),
      ],
      design: { kind: 'radio', defaultValue: 'A' },
    },
    {
      name: 'state',
      type: 'choice',
      value: 'approved',
      options: ['draft', 'approved'],
      readOnly: false,
      widgets: [widget(40)],
      design: {
        kind: 'dropdown',
        optionLabels: { draft: 'Draft label', approved: 'Approved label' },
        defaultValue: 'draft',
      },
    },
    {
      name: 'tags',
      type: 'choice',
      value: 'a',
      options: ['a', 'b', 'c'],
      selectedValues: ['a', 'c'],
      readOnly: false,
      widgets: [widget(270, { x: 200, width: 80, height: 60 })],
      design: {
        kind: 'list',
        multiSelect: true,
        defaultSelections: ['b'],
        optionLabels: { a: 'Alpha', b: 'Beta', c: 'Gamma' },
      },
    },
    {
      name: 'photo',
      type: 'image',
      value:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y3nRmwAAAAASUVORK5CYII=',
      readOnly: false,
      widgets: [widget(200, { x: 210, width: 60, height: 50 })],
      design: { kind: 'image', tooltip: 'Profile image' },
    },
  ];
  document.fields.push(...additions);
  for (let pass = 0; pass < 2; pass++) {
    const output = await c.exportStudioPdf(document, source);
    const pdf = await PDFDocument.load(await output.arrayBuffer());
    const form = pdf.getForm();
    assert.equal(form.getTextField('designed_name').getText(), 'Alice');
    assert.equal(form.getTextField('designed_name').getMaxLength(), 20);
    assert.equal(form.getTextField('designed_name').isRequired(), true);
    assert.equal(
      form.getTextField('designed_name').acroField.dict.lookup(PDFName.of('TU')).decodeText(),
      'Your name'
    );
    assert.equal(form.getTextField('date').getText(), '2026-11-24');
    assert.equal(form.getCheckBox('accept').isChecked(), true);
    assert.equal(form.getCheckBox('accept').acroField.getOnValue().decodeText(), 'Approved');
    for (const widget of form.getCheckBox('accept').acroField.getWidgets()) {
      const ap = widget.dict.lookup(PDFName.of('AP'), PDFDict);
      for (const key of ['N', 'D']) {
        const appearances = ap.lookup(PDFName.of(key), PDFDict);
        assert.ok(
          appearances.has(PDFName.of('Approved')),
          'Every checkbox appearance uses the export value.'
        );
        assert.equal(appearances.has(PDFName.of('Yes')), false);
      }
    }
    assert.equal(form.getRadioGroup('level').getSelected(), 'B');
    assert.equal(
      form.getRadioGroup('level').acroField.dict.lookup(PDFName.of('DV')),
      form.getRadioGroup('level').acroField.getWidgets()[0].getOnValue()
    );
    assert.deepEqual(form.getDropdown('state').getSelected(), ['approved']);
    assert.deepEqual(form.getOptionList('tags').getSelected(), ['a', 'c']);
    const stateAppearance = form
      .getDropdown('state')
      .acroField.getWidgets()[0]
      .getAppearances().normal;
    const listAppearance = form
      .getOptionList('tags')
      .acroField.getWidgets()[0]
      .getAppearances().normal;
    const stateCommands = Buffer.from(decodePDFRawStream(stateAppearance).decode()).toString();
    const listCommands = Buffer.from(decodePDFRawStream(listAppearance).decode()).toString();
    assert.ok(
      stateCommands.includes(Buffer.from('Approved label').toString('hex').toUpperCase()),
      'Dropdown renders the display label.'
    );
    assert.ok(
      listCommands.includes('0.6 0.7568627450980392 0.8549019607843137 rg'),
      'Selected display labels have a native highlight.'
    );
    assert.equal(form.getButton('photo').acroField.getWidgets().length, 1);
    for (const index of [0, 1])
      for (const hash of streamHashes(originalPdf, index))
        assert.ok(streamHashes(pdf, index).includes(hash));
    document = await c.importStudioPdf(output, 'Designed-reopened.pdf');
    assert.equal(document.fields.length, 13);
    assert.equal(document.fields.find((field) => field.name === 'state').value, 'approved');
    assert.deepEqual(Array.from(document.fields.find((field) => field.name === 'state').options), [
      'draft',
      'approved',
    ]);
    assert.equal(
      document.fields.find((field) => field.name === 'state').design.optionLabels.approved,
      'Approved label'
    );
    assert.deepEqual(
      Array.from(document.fields.find((field) => field.name === 'tags').selectedValues),
      ['a', 'c']
    );
    assert.equal(document.fields.find((field) => field.name === 'photo').value, additions[6].value);
    assert.deepEqual(
      JSON.parse(JSON.stringify(document.fields.find((field) => field.name === 'date').widgets[0])),
      { ...widget(160), rotation: 0 }
    );
    assert.equal(
      await c.exportStudioPdf(document, output),
      output,
      'An unchanged designed PDF can retain its exact original bytes.'
    );
    document.fields = document.fields.map((field) =>
      additions.some((entry) => entry.name === field.name)
        ? { ...field, design: { ...field.design, sourceName: undefined } }
        : field
    );
  }
});

test('explicit design edits rename, reposition and delete fields while retaining untouched readonly data', async () => {
  const c = codec();
  const source = await original();
  const document = await c.importStudioPdf(source, 'Field-design.pdf');
  const initial = document.fields.find((field) => field.name === 'name');
  document.fields = document.fields
    .filter((field) => field.name !== 'status')
    .map((field) =>
      field.name === 'name'
        ? {
            ...field,
            name: 'customer',
            value: 'New Name',
            readOnly: true,
            widgets: initial.widgets.map((widget) => ({ ...widget, x: widget.x + 20 })),
            design: {
              kind: 'text',
              sourceName: 'name',
              required: true,
              maxLength: 30,
              defaultValue: 'Default',
            },
          }
        : field
    );
  document.removedFields = ['status'];
  const saved = await c.exportStudioPdf(document, source);
  const reopened = await PDFDocument.load(await saved.arrayBuffer());
  assert.equal(reopened.getForm().getTextField('customer').getText(), 'New Name');
  assert.equal(reopened.getForm().getTextField('customer').isReadOnly(), true);
  assert.equal(
    reopened.getForm().getTextField('customer').acroField.getWidgets()[0].getRectangle().x,
    initial.widgets[0].x + 20
  );
  assert.equal(reopened.getForm().getTextField('reference').getText(), 'LOCKED');
  assert.equal(
    reopened
      .getForm()
      .getFields()
      .some((field) => ['name', 'status'].includes(field.getName())),
    false
  );
});

test('imports original AcroForm values, real widget rectangles, pages, radio options and read-only metadata', async () => {
  const c = codec();
  const source = await original();
  const document = await c.importStudioPdf(source, 'Contract.pdf');
  assert.equal(document.kind, 'pdf');
  assert.equal(document.pageCount, 2);
  assert.equal(document.name, 'Contract.pdf');
  assert.deepEqual(Array.from(document.marks), []);
  const name = document.fields.find((field) => field.name === 'name');
  assert.equal(name.value, 'Original');
  assert.equal(name.widgets[0].page, 0);
  assert.equal(name.widgets[0].x, 69.5);
  assert.equal(name.widgets[0].y, 449.5);
  assert.equal(name.widgets[0].width, 181);
  assert.equal(name.widgets[0].height, 27);
  assert.equal(name.widgets[0].rotation, 0);
  const choice = document.fields.find((field) => field.name === 'choice');
  assert.equal(choice.value, 'A');
  assert.deepEqual(
    Array.from(choice.widgets, (widget) => [widget.page, widget.option]),
    [
      [0, 'A'],
      [0, 'B'],
      [1, 'C'],
    ]
  );
  assert.deepEqual(
    Array.from(
      document.fields.find((field) => field.name === 'confirmed').widgets,
      (widget) => widget.page
    ),
    [0, 1]
  );
  assert.equal(document.fields.find((field) => field.name === 'notes').multiline, true);
  assert.equal(document.fields.find((field) => field.name === 'reference').readOnly, true);
  assert.equal(c.requests.length, 0);
});

test('unchanged PDF exports return the exact source without reserialization or a font request', async () => {
  const c = codec();
  const source = await original();
  const document = await c.importStudioPdf(source, 'Original.pdf');
  document.rotations = { 0: 360 };
  // JSON producers may reorder object keys without changing widget geometry.
  document.fields = document.fields.map((field) => ({
    ...field,
    widgets: field.widgets.map(({ page, x, y, width, height, rotation, option }) => ({
      x,
      y,
      width,
      height,
      page,
      rotation,
      ...(option === undefined ? {} : { option }),
    })),
  }));
  assert.equal(await c.exportStudioPdf(document, source), source);
  assert.equal(c.requests.length, 0);
});

test('fills native option lists and labelled dropdowns by export values and keeps display labels across reopen rounds', async () => {
  const c = codec();
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([480, 640]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const form = pdf.getForm();
  const levels = form.createOptionList('levels');
  levels.acroField.setOptions([
    { value: PDFString.of('junior'), display: PDFString.of('Junior level') },
    { value: PDFString.of('senior'), display: PDFString.of('Senior level') },
  ]);
  levels.acroField.dict.set(PDFName.of('V'), PDFString.of('junior'));
  levels.addToPage(page, { x: 60, y: 420, width: 150, height: 60, font });
  const tags = form.createOptionList('tags');
  tags.enableMultiselect();
  tags.setOptions(['a', 'b', 'c']);
  tags.select(['a', 'c']);
  tags.addToPage(page, { x: 260, y: 420, width: 150, height: 60, font });
  const status = form.createDropdown('status');
  status.acroField.setOptions([
    { value: PDFString.of('draft'), display: PDFString.of('Draft label') },
    { value: PDFString.of('approved'), display: PDFString.of('Approved label') },
  ]);
  status.acroField.dict.set(PDFName.of('V'), PDFString.of('draft'));
  status.addToPage(page, { x: 60, y: 320, width: 180, height: 24, font });
  const source = await blob(pdf);

  const imported = await c.importStudioPdf(source, 'Options.pdf');
  const levelsField = imported.fields.find((field) => field.name === 'levels');
  const tagsField = imported.fields.find((field) => field.name === 'tags');
  const statusField = imported.fields.find((field) => field.name === 'status');
  assert.deepEqual(
    [levelsField, tagsField, statusField].map((field) => field.type),
    ['choice', 'choice', 'choice']
  );
  assert.deepEqual(levelsField.options, ['junior', 'senior']);
  assert.deepEqual(levelsField.optionLabels, {
    junior: 'Junior level',
    senior: 'Senior level',
  });
  assert.deepEqual(levelsField.selectedValues, ['junior']);
  assert.equal(levelsField.value, 'junior');
  assert.equal(tagsField.multiSelect, true);
  assert.deepEqual(tagsField.selectedValues, ['a', 'c']);
  assert.deepEqual(statusField.options, ['draft', 'approved']);
  assert.deepEqual(statusField.optionLabels, {
    draft: 'Draft label',
    approved: 'Approved label',
  });
  assert.equal(statusField.value, 'draft');

  const rounds = [
    { levels: ['senior'], tags: ['a', 'b'], status: 'approved' },
    { levels: ['junior'], tags: ['b', 'c'], status: 'draft' },
    { levels: ['senior'], tags: ['a', 'c'], status: 'approved' },
  ];
  const fill = (document, target) => ({
    ...document,
    fields: document.fields.map((field) => {
      if (field.name === 'levels')
        return { ...field, value: target.levels[0], selectedValues: target.levels };
      if (field.name === 'tags')
        return { ...field, value: target.tags[0], selectedValues: target.tags };
      if (field.name === 'status') return { ...field, value: target.status };
      return field;
    }),
  });
  let output = await c.exportStudioPdf(fill(imported, rounds[0]), source);
  for (const [round, target] of rounds.entries()) {
    const roundPdf = await PDFDocument.load(await output.arrayBuffer());
    const roundForm = roundPdf.getForm();
    assert.deepEqual(roundForm.getOptionList('levels').getSelected(), target.levels);
    assert.deepEqual(roundForm.getOptionList('tags').getSelected(), target.tags);
    assert.deepEqual(roundForm.getDropdown('status').getSelected(), [target.status]);
    const rawStatus = roundForm.getDropdown('status').acroField.getOptions();
    assert.deepEqual(rawStatus.map((option) => option.value.decodeText()), ['draft', 'approved']);
    assert.deepEqual(
      rawStatus.map((option) => option.display.decodeText()),
      ['Draft label', 'Approved label'],
      'The native Opt array keeps independent display labels.'
    );
    const statusCommands = Buffer.from(
      decodePDFRawStream(
        roundForm.getDropdown('status').acroField.getWidgets()[0].getAppearances().normal
      ).decode()
    ).toString();
    assert.ok(
      statusCommands.includes(
        Buffer.from(target.status === 'draft' ? 'Draft label' : 'Approved label')
          .toString('hex')
          .toUpperCase()
      ),
      'The dropdown appearance renders the display label.'
    );

    const reopened = await c.importStudioPdf(output, `Options-reopened-${round}.pdf`);
    const reopenedStatus = reopened.fields.find((field) => field.name === 'status');
    assert.deepEqual(reopenedStatus.options, ['draft', 'approved']);
    assert.deepEqual(reopenedStatus.optionLabels, {
      draft: 'Draft label',
      approved: 'Approved label',
    });
    assert.equal(reopenedStatus.value, target.status);
    const reopenedTags = reopened.fields.find((field) => field.name === 'tags');
    assert.equal(reopenedTags.multiSelect, true);
    assert.deepEqual(reopenedTags.selectedValues, target.tags);
    const reopenedLevels = reopened.fields.find((field) => field.name === 'levels');
    assert.deepEqual(reopenedLevels.selectedValues, target.levels);
    assert.deepEqual(reopenedLevels.optionLabels, {
      junior: 'Junior level',
      senior: 'Senior level',
    });
    assert.equal(await c.exportStudioPdf(reopened, output), output);
    output = await c.exportStudioPdf(fill(reopened, rounds[(round + 1) % rounds.length]), output);
  }
  const finalPdf = await PDFDocument.load(await output.arrayBuffer());
  assert.deepEqual(finalPdf.getForm().getOptionList('levels').getSelected(), ['senior']);
  assert.deepEqual(finalPdf.getForm().getOptionList('tags').getSelected(), ['a', 'b']);
  assert.deepEqual(finalPdf.getForm().getDropdown('status').getSelected(), ['approved']);
});

test('exports real text, transparent highlight, additional rotation and editable native forms while preserving every original page stream', async () => {
  const c = codec();
  const source = await original();
  const beforeBytes = Buffer.from(await source.arrayBuffer());
  const before = await PDFDocument.load(beforeBytes);
  const document = await c.importStudioPdf(source, 'Changed.pdf');
  document.marks = [
    {
      id: 'text',
      page: 0,
      type: 'text',
      x: 70,
      y: 120,
      text: 'Added annotation\nSecond line',
      size: 14,
      color: '#253044',
    },
    {
      id: 'highlight',
      page: 0,
      type: 'highlight',
      x: 100,
      y: 180,
      text: '',
      size: 16,
      width: 64,
      height: 18,
      color: '#f5c542',
    },
  ];
  document.rotations = { 0: 90, 1: 270 };
  const values = {
    name: 'Alice',
    confirmed: true,
    status: 'Approved',
    choice: 'B',
    notes: 'New\nLines',
  };
  document.fields = document.fields.map((field) =>
    field.name in values ? { ...field, value: values[field.name] } : field
  );
  const output = await c.exportStudioPdf(document, source);
  assert.equal(output.type, 'application/pdf');
  const reopened = await PDFDocument.load(await output.arrayBuffer());
  assert.equal(reopened.getPages()[0].getRotation().angle, 180);
  assert.equal(reopened.getPages()[1].getRotation().angle, 270);
  const form = reopened.getForm();
  assert.equal(form.getTextField('name').getText(), 'Alice');
  assert.equal(form.getCheckBox('confirmed').isChecked(), true);
  assert.deepEqual(form.getDropdown('status').getSelected(), ['Approved']);
  assert.equal(form.getRadioGroup('choice').getSelected(), 'B');
  assert.equal(form.getTextField('notes').getText(), 'New\nLines');
  assert.equal(form.getTextField('reference').getText(), 'LOCKED');
  assert.equal(form.getTextField('reference').isReadOnly(), true);
  assert.equal(form.getFields().length, before.getForm().getFields().length);
  for (const index of [0, 1])
    for (const hash of streamHashes(before, index))
      assert.ok(
        streamHashes(reopened, index).includes(hash),
        `original stream on page ${index + 1} survives`
      );
  const instructions = pageInstructions(reopened, 0);
  assert.match(instructions, new RegExp(Buffer.from('Added annotation').toString('hex'), 'i'));
  assert.match(instructions, /1 0 0 1 100 180 cm/);
  const states = reopened.getPages()[0].node.Resources().lookup(PDFName.of('ExtGState'));
  assert.ok(
    states.entries().some(([, state]) => state.lookup(PDFName.of('ca')).asNumber() === 0.3)
  );
  assert.equal(digest(Buffer.from(await source.arrayBuffer())), digest(beforeBytes));
  assert.equal(c.requests.length, 0);
  const model = await c.importStudioPdf(output, 'Reopened.pdf');
  assert.equal(model.fields.find((field) => field.name === 'name').value, 'Alice');
  assert.equal(model.fields.find((field) => field.name === 'confirmed').widgets.length, 2);
});

test('uses the bundled full Chinese font and retries a failed font load without changing the source', async () => {
  const fontRoot = new URL(
    '../node_modules/@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-400-normal.woff',
    import.meta.url
  );
  const font = trueTypeFromWoff(readFileSync(fontRoot));
  let attempts = 0;
  const c = codec(async () => {
    attempts += 1;
    return attempts === 1
      ? { ok: false }
      : {
          ok: true,
          arrayBuffer: async () =>
            font.buffer.slice(font.byteOffset, font.byteOffset + font.byteLength),
        };
  });
  const source = await original();
  const hash = digest(Buffer.from(await source.arrayBuffer()));
  const document = await c.importStudioPdf(source, 'Chinese.pdf');
  document.marks = [
    { id: 'chinese', page: 0, type: 'text', x: 70, y: 100, text: '中文标注', size: 16 },
  ];
  document.fields = document.fields.map((field) =>
    field.name === 'name' ? { ...field, value: '中文确认' } : field
  );
  await assert.rejects(c.exportStudioPdf(document, source), /中文字体加载失败/);
  const output = await c.exportStudioPdf(document, source);
  const reopened = await PDFDocument.load(await output.arrayBuffer());
  assert.equal(reopened.getForm().getTextField('name').getText(), '中文确认');
  assert.ok(output.size > 100_000, 'the full CJK font, including outlines, is embedded');
  assert.equal(c.requests.length, 2);
  assert.equal(c.requests[0], '/test-base/office-pdf-assets/NotoSansSC.ttf');
  assert.equal(digest(Buffer.from(await source.arrayBuffer())), hash);
});

test('validates crop-box offsets, native field structure, readonly values, choices and finite annotation/rotation data', async () => {
  const c = codec();
  const source = await original();
  const originalDocument = await c.importStudioPdf(source, 'Validation.pdf');
  const baseMark = {
    id: 'test',
    page: 0,
    type: 'highlight',
    x: 30,
    y: 40,
    size: 16,
    text: '',
    width: 10,
    height: 10,
  };
  const cases = [
    { ...originalDocument, marks: [{ ...baseMark, x: 29 }] },
    { ...originalDocument, marks: [{ ...baseMark, y: 39 }] },
    { ...originalDocument, marks: [{ ...baseMark, x: 429, width: 2 }] },
    { ...originalDocument, marks: [{ ...baseMark, y: 599, height: 2 }] },
    { ...originalDocument, marks: [{ ...baseMark, width: -1 }] },
    { ...originalDocument, marks: [{ ...baseMark, x: NaN }] },
    { ...originalDocument, marks: [{ ...baseMark, size: Infinity }] },
    { ...originalDocument, marks: [{ ...baseMark, color: 'yellow' }] },
    { ...originalDocument, marks: [{ ...baseMark, page: 2 }] },
    { ...originalDocument, marks: [baseMark, baseMark] },
    { ...originalDocument, rotations: { 0: 45 } },
    { ...originalDocument, rotations: { '01': 90 } },
    { ...originalDocument, rotations: { 2: 90 } },
    { ...originalDocument, pageCount: 3 },
    { ...originalDocument, fields: originalDocument.fields.slice(1) },
    {
      ...originalDocument,
      fields: originalDocument.fields.map((field) =>
        field.name === 'reference' ? { ...field, value: 'CHANGED' } : field
      ),
    },
    {
      ...originalDocument,
      fields: originalDocument.fields.map((field) =>
        field.name === 'status' ? { ...field, value: 'Unknown' } : field
      ),
    },
    {
      ...originalDocument,
      fields: originalDocument.fields.map((field) =>
        field.name === 'confirmed' ? { ...field, value: 'true' } : field
      ),
    },
    {
      ...originalDocument,
      fields: originalDocument.fields.map((field) =>
        field.name === 'name' ? { ...field, readOnly: true } : field
      ),
    },
    {
      ...originalDocument,
      fields: originalDocument.fields.map((field) =>
        field.name === 'name' ? { ...field, widgets: [{ ...field.widgets[0], x: 100 }] } : field
      ),
    },
  ];
  for (const document of cases) await assert.rejects(c.exportStudioPdf(document, source));
  const fitting = { ...originalDocument, marks: [baseMark] };
  assert.equal((await c.exportStudioPdf(fitting, source)).type, 'application/pdf');
  await assert.rejects(
    c.exportStudioPdf(
      {
        ...originalDocument,
        marks: [{ ...baseMark, type: 'text', x: 425, text: 'Too wide', size: 14 }],
      },
      source
    ),
    /文字标注超出/
  );
  const native = await PDFDocument.load(await source.arrayBuffer());
  native.getForm().getTextField('name').setMaxLength(8);
  const maxSource = await blob(native);
  const maxDocument = await c.importStudioPdf(maxSource, 'Maximum.pdf');
  maxDocument.fields = maxDocument.fields.map((field) =>
    field.name === 'name' ? { ...field, value: 'Longer than limit' } : field
  );
  await assert.rejects(c.exportStudioPdf(maxDocument, maxSource), /允许的文字长度/);
});

test('retains passive native fields without exposing editable values and still rejects encrypted PDFs and XFA', async () => {
  const c = codec();
  const mutations = [
    (pdf) => {
      pdf.getForm().acroForm.dict.set(PDFName.of('XFA'), PDFString.of('<xfa/>'));
    },
    (pdf) => {
      pdf.getForm().createOptionList('list');
    },
    (pdf) => {
      pdf.getForm().createButton('button');
    },
    (pdf) => {
      pdf.getForm().getTextField('name').acroField.dict.set(PDFName.of('FT'), PDFName.of('Sig'));
    },
    (pdf) => {
      pdf.getForm().getTextField('name').enableRichFormatting();
    },
    (pdf) => {
      pdf.getForm().getTextField('name').enablePassword();
    },
    (pdf) => {
      pdf.getForm().getTextField('name').enableFileSelection();
    },
    (pdf) => {
      pdf.getForm().getDropdown('status').enableMultiselect();
    },
    (pdf) => {
      pdf.getForm().getDropdown('status').enableEditing();
    },
    (pdf) => {
      const field = pdf.getForm().getDropdown('status');
      field.acroField.setOptions([
        { value: PDFString.of('same'), display: PDFString.of('First') },
        { value: PDFString.of('same'), display: PDFString.of('Second') },
      ]);
      field.acroField.dict.set(PDFName.of('V'), PDFString.of('same'));
    },
    (pdf) => {
      pdf.getForm().getTextField('name').setText('Single\nLine');
    },
  ];
  const source = await original();
  for (const [index, mutate] of mutations.entries()) {
    const pdf = await PDFDocument.load(await source.arrayBuffer());
    mutate(pdf);
    const nativeSource = await blob(pdf);
    if (index === 0) {
      await assert.rejects(c.importStudioPdf(nativeSource, 'Dynamic.pdf'), /不支持/);
      continue;
    }
    const document = await c.importStudioPdf(nativeSource, 'Passive.pdf');
    const fields = document.fields.filter((field) => field.type === 'opaque');
    assert.equal(fields.length, 1);
    assert.equal(fields[0].readOnly, true);
    assert.equal(fields[0].value, '');
    assert.match(fields[0].nativeValueHash, /^[a-f0-9]{64}$/);
    assert.equal(await c.exportStudioPdf(document, nativeSource), nativeSource);
    const changed = structuredClone(document);
    changed.fields.find((field) => field.type === 'opaque').value = 'Tampered';
    await assert.rejects(c.exportStudioPdf(changed, nativeSource), /只读原生/);
  }
  const encrypted = await PDFDocument.load(await source.arrayBuffer());
  encrypted.context.trailerInfo.Encrypt = encrypted.context.register(
    encrypted.context.obj({ Filter: PDFName.of('Standard'), V: 1, R: 2, P: -4 })
  );
  const protectedSource = await blob(encrypted);
  await assert.rejects(c.importStudioPdf(protectedSource, 'Protected.pdf'), /已加密/);
  await assert.rejects(
    c.exportStudioPdf(await c.importStudioPdf(source, 'Original.pdf'), protectedSource),
    /已加密/
  );
  await assert.rejects(c.importStudioPdf(new Blob(['not a PDF']), 'Broken.pdf'), /损坏|格式/);
  await assert.rejects(c.importStudioPdf(new Blob([]), 'Empty.pdf'), /非空/);
  const oversized = await PDFDocument.create();
  for (let page = 0; page < 201; page += 1) oversized.addPage([100, 100]);
  await assert.rejects(c.importStudioPdf(await blob(oversized), 'Too many.pdf'), /200 页/);
});

test('exports rectangles and handwritten signatures as native vector instructions without replacing original page streams', async () => {
  const c = codec();
  const source = await original();
  const before = await PDFDocument.load(await source.arrayBuffer());
  const document = await c.importStudioPdf(source, 'Signed.pdf');
  document.marks = [
    {
      id: 'box',
      page: 0,
      type: 'rectangle',
      x: 100,
      y: 180,
      width: 64,
      height: 36,
      text: '',
      size: 16,
      lineWidth: 3,
      color: '#336699',
    },
    {
      id: 'signature',
      page: 1,
      type: 'ink',
      x: 50,
      y: 180,
      points: [
        [50, 200],
        [80, 180],
        [95, 205],
      ],
      text: '',
      size: 16,
      lineWidth: 2.5,
      color: '#253044',
    },
  ];
  const output = await c.exportStudioPdf(document, source);
  const after = await PDFDocument.load(await output.arrayBuffer());
  assert.equal(after.getPageCount(), 2);
  assert.equal(after.getPages()[0].getRotation().angle, 90);
  for (const index of [0, 1])
    for (const hash of streamHashes(before, index))
      assert.ok(streamHashes(after, index).includes(hash));
  const rectangle = pageInstructions(after, 0);
  assert.match(rectangle, /3 w/);
  assert.match(rectangle, /0\.2 0\.4 0\.6 RG/);
  const signature = pageInstructions(after, 1);
  assert.match(signature, /2\.5 w/);
  assert.match(signature, /1 J/);
  assert.match(signature, /1 j/);
  assert.match(signature, /50 200 m\s+80 180 l\s+95 205 l\s+S/);
  assert.equal(
    c.requests.length,
    0,
    'vector annotations do not request fonts or upload source files'
  );
  const reopened = await c.importStudioPdf(output, 'Reopened.pdf');
  assert.equal(reopened.fields.find((field) => field.name === 'name').value, 'Original');
  assert.equal(
    await c.exportStudioPdf(reopened, output),
    output,
    'reopening does not apply vector annotations a second time'
  );
});

test('rejects invalid signature points, drawing widths and strokes extending outside the visible crop box', async () => {
  const c = codec();
  const source = await original();
  const document = await c.importStudioPdf(source, 'Invalid drawing.pdf');
  const base = {
    id: 'ink',
    page: 0,
    type: 'ink',
    x: 70,
    y: 180,
    points: [
      [70, 180],
      [100, 200],
    ],
    text: '',
    size: 16,
    lineWidth: 2,
    color: '#253044',
  };
  const invalid = [
    { ...base, points: [] },
    { ...base, points: [[70, 180]] },
    {
      ...base,
      points: [
        [70, 180],
        [NaN, 200],
      ],
    },
    {
      ...base,
      points: [
        [70, 180],
        [30, 200],
      ],
    },
    {
      ...base,
      points: [
        [70, 180],
        [100, 601],
      ],
    },
    { ...base, points: Array.from({ length: 10001 }, () => [70, 180]) },
    { ...base, lineWidth: 0 },
    { ...base, lineWidth: 0.25 },
    { ...base, lineWidth: 41 },
    { ...base, type: 'rectangle', x: 30, width: 50, height: 20 },
    { ...base, type: 'rectangle', width: 400, height: 20 },
    { ...base, type: 'rectangle', width: -5, height: 20 },
  ];
  for (const mark of invalid)
    await assert.rejects(c.exportStudioPdf({ ...document, marks: [mark] }, source));
  assert.equal(
    (await c.exportStudioPdf({ ...document, marks: [base] }, source)).type,
    'application/pdf'
  );
  const tooMany = Array.from({ length: 11 }, (_, index) => ({
    ...base,
    id: `signature-${index}`,
    points: Array.from({ length: 10000 }, () => [70, 180]),
  }));
  await assert.rejects(c.exportStudioPdf({ ...document, marks: tooMany }, source), /100,000/);
});

test('deletes a source field and creates a replacement with the same name without duplicate native widgets', async () => {
  const c = codec();
  const source = await original();
  const document = await c.importStudioPdf(source, 'Replaced.pdf');
  const initial = document.fields.find((field) => field.name === 'name');
  document.fields = document.fields.filter((field) => field.name !== 'name');
  document.removedFields = ['name'];
  document.fields.push({ ...initial, value: 'Replacement', design: { kind: 'text' } });
  const output = await c.exportStudioPdf(document, source);
  const pdf = await PDFDocument.load(await output.arrayBuffer());
  assert.equal(pdf.getForm().getTextField('name').getText(), 'Replacement');
  assert.equal(pdf.getForm().getTextField('name').acroField.getWidgets().length, 1);
  assert.equal(
    pdf
      .getForm()
      .getFields()
      .filter((field) => field.getName() === 'name').length,
    1
  );
  const reopened = await c.importStudioPdf(output, 'Reopened.pdf');
  assert.equal(await c.exportStudioPdf(reopened, output), output);
});

test('repeated radio export options stay synchronized across pages and survive repeated reopens', async () => {
  const c = codec();
  let source = await original();
  let document = await c.importStudioPdf(source, 'Radio.pdf');
  document.fields.push({
    name: 'repeated',
    type: 'choice',
    value: 'A',
    readOnly: false,
    options: ['A', 'B'],
    design: { kind: 'radio', defaultValue: 'A' },
    widgets: [
      { page: 0, x: 300, y: 180, width: 20, height: 20, option: 'A' },
      { page: 1, x: 200, y: 300, width: 20, height: 20, option: 'A' },
      { page: 1, x: 240, y: 300, width: 20, height: 20, option: 'B' },
    ],
  });
  for (let pass = 0; pass < 2; pass++) {
    source = await c.exportStudioPdf(document, source);
    document = await c.importStudioPdf(source, 'Reopened.pdf');
    const field = document.fields.find((entry) => entry.name === 'repeated');
    assert.deepEqual(field.options, ['A', 'B']);
    assert.equal(field.value, 'A');
    assert.equal(field.widgets.length, 3);
    const native = await PDFDocument.load(await source.arrayBuffer());
    const widgets = native.getForm().getRadioGroup('repeated').acroField.getWidgets();
    assert.equal(widgets[0].getAppearanceState(), widgets[0].getOnValue());
    assert.equal(widgets[1].getAppearanceState(), widgets[1].getOnValue());
  }
});


function pageCommands() {
  return pdfTestRuntime().load('../../packages/ui/src/components/OfficeStudio/studio-pdf-pages.ts');
}

test('inserts real blank pages, remaps native widgets and keeps source streams and repeated rotation idempotent', async () => {
  const c = codec(), commands = pageCommands(), source = await original();
  const before = await PDFDocument.load(await source.arrayBuffer());
  let document = await c.importStudioPdf(source, 'Pages.pdf');
  document = commands.pdfInsertBlankPage(document, 1, { width: 600, height: 300 });
  document = commands.pdfRotatePages(document, [0, 2], 90);
  assert.equal(document.pageCount, 3);
  assert.equal(document.fields.find(field => field.name === 'confirmed').widgets[1].page, 2);
  for (let repeat = 0; repeat < 2; repeat++) {
    const bytes = await c.exportStudioPdf(document, source), pdf = await PDFDocument.load(await bytes.arrayBuffer());
    assert.equal(pdf.getPageCount(), 3);
    assert.equal(pdf.getPages()[1].getWidth(), 600); assert.equal(pdf.getPages()[1].getHeight(), 300);
    assert.equal(pdf.getPages()[0].getRotation().angle, 180); assert.equal(pdf.getPages()[2].getRotation().angle, 90);
    assert.deepEqual(streamHashes(pdf, 0), streamHashes(before, 0)); assert.deepEqual(streamHashes(pdf, 2), streamHashes(before, 1));
    const reopened = await c.importStudioPdf(bytes, 'Reopened.pdf');
    assert.equal(reopened.fields.find(field => field.name === 'confirmed').widgets[1].page, 2);
    assert.equal(reopened.pages.length, 3);
    assert.equal(await c.exportStudioPdf(reopened, bytes), bytes);
  }
});

test('removes source widgets on deleted pages while retaining shared fields, appearances and remaining source content', async () => {
  const c = codec(), commands = pageCommands();
  const initial = await PDFDocument.load(await (await original()).arrayBuffer());
  const link = initial.context.register(initial.context.obj({ Type: PDFName.of('Annot'), Subtype: PDFName.of('Link'), Rect: [40, 40, 100, 60], Dest: [initial.getPages()[0].ref, PDFName.of('Fit')] }));
  initial.getPages()[1].node.addAnnot(link);
  const source = await blob(initial), nativeSource = await PDFDocument.load(await source.arrayBuffer()), originalDocument = await c.importStudioPdf(source, 'Delete.pdf');
  const document = commands.pdfRemovePages(originalDocument, [0]);
  const saved = await c.exportStudioPdf(document, source), pdf = await PDFDocument.load(await saved.arrayBuffer());
  assert.equal(pdf.getPageCount(), 1);
  assert.deepEqual(streamHashes(pdf, 0), streamHashes(nativeSource, 1));
  assert.equal(pdf.getForm().getCheckBox('confirmed').acroField.getWidgets().length, 1);
  assert.equal(pdf.getForm().getRadioGroup('choice').acroField.getWidgets().length, 1);
  assert.ok(pdf.getForm().getCheckBox('confirmed').acroField.getWidgets()[0].getAppearances().normal);
  assert.equal(pdf.getForm().getTextField('name').acroField.getWidgets().length, 0);
  assert.ok(!(pdf.getPages()[0].node.Annots()?.asArray() ?? []).some(ref => pdf.context.lookup(ref).get(PDFName.of('Subtype')) === PDFName.of('Link')));
  const reopened = await c.importStudioPdf(saved, 'Reopened.pdf');
  assert.equal(reopened.fields.find(field => field.name === 'confirmed').widgets[0].page, 0);
  assert.throws(() => commands.pdfRemovePages(document, [0]), /至少/);
  assert.equal(originalDocument.pageCount, 2);
});

test('copies native pages and widgets into shared field trees, preserves independent annotation owners and moves page references', async () => {
  const c = codec(), commands = pageCommands(), source = await original();
  let document = await c.importStudioPdf(source, 'Copy.pdf');
  document = commands.pdfCopyPages(document, [0], 2);
  document.fields = document.fields.map(field => field.name === 'name' ? { ...field, value: 'Copied' } : field);
  let saved = await c.exportStudioPdf(document, source), pdf = await PDFDocument.load(await saved.arrayBuffer());
  assert.equal(pdf.getPageCount(), 3);
  const widgets = pdf.getForm().getTextField('name').acroField.getWidgets();
  assert.equal(widgets.length, 2); assert.equal(pdf.getForm().getTextField('name').getText(), 'Copied');
  assert.notEqual(widgets[0].dict, widgets[1].dict); assert.equal(widgets[1].P().toString(), pdf.getPages()[2].ref.toString());
  assert.equal(pdf.getForm().getFields().filter(field => field.getName() === 'name').length, 1);
  document = await c.importStudioPdf(saved, 'Copied.pdf');
  document = commands.pdfMovePages(document, [2], 0);
  const originalRefs = pdf.getPages().map(page => page.ref.toString());
  saved = await c.exportStudioPdf(document, saved); pdf = await PDFDocument.load(await saved.arrayBuffer());
  assert.deepEqual(pdf.getPages().map(page => page.ref.toString()), [originalRefs[2], originalRefs[0], originalRefs[1]]);
  assert.equal((await c.importStudioPdf(saved, 'Moved.pdf')).fields.find(field => field.name === 'name').widgets.length, 2);
});

test('resizes the visible native canvas at an offset crop origin without scaling original contents', async () => {
  const c = codec(), commands = pageCommands(), source = await original(), before = await PDFDocument.load(await source.arrayBuffer());
  const document = commands.pdfResizePages(await c.importStudioPdf(source, 'Resize.pdf'), [0, 1], { width: 500, height: 600 });
  const output = await c.exportStudioPdf(document, source), pdf = await PDFDocument.load(await output.arrayBuffer());
  assert.deepEqual(pdf.getPages()[0].getCropBox(), { x: 30, y: 40, width: 500, height: 600 });
  assert.deepEqual(pdf.getPages()[1].getCropBox(), { x: 0, y: 0, width: 500, height: 600 });
  assert.deepEqual(streamHashes(pdf, 0), streamHashes(before, 0));
  assert.equal((await c.importStudioPdf(output, 'Resize-reopened.pdf')).pages[0].bounds.right, 530);
  assert.throws(() => commands.pdfResizePages(document, [0], { width: NaN, height: 600 }), /宽高/);
  assert.equal(before.getPageCount(), 2);
  assert.equal(before.getPages()[0].getCropBox().width, 400);
});


test('repairs named destinations and catalog navigation after deletion and maps copied-group links to copied page references', async () => {
  const c = codec(), commands = pageCommands(), initial = await PDFDocument.load(await (await original()).arrayBuffer());
  const [first, second] = initial.getPages();
  const namedTree = initial.context.register(initial.context.obj({ Names: [PDFString.of('Alive'), [second.ref, PDFName.of('Fit')], PDFString.of('Dead'), [first.ref, PDFName.of('Fit')]] }));
  initial.catalog.set(PDFName.of('Names'), initial.context.obj({ Dests: namedTree }));
  initial.catalog.set(PDFName.of('OpenAction'), initial.context.obj([first.ref, PDFName.of('Fit')]));
  const outline = initial.context.register(initial.context.obj({ Title: PDFString.of('Deleted target'), Dest: [first.ref, PDFName.of('Fit')] }));
  initial.catalog.set(PDFName.of('Outlines'), initial.context.obj({ First: outline, Last: outline, Count: 1 }));
  second.node.addAnnot(initial.context.register(initial.context.obj({ Type: PDFName.of('Annot'), Subtype: PDFName.of('Link'), Rect: [20, 20, 40, 40], Dest: PDFString.of('Dead') })));
  first.node.addAnnot(initial.context.register(initial.context.obj({ Type: PDFName.of('Annot'), Subtype: PDFName.of('Link'), Rect: [20, 20, 40, 40], A: { S: PDFName.of('GoTo'), D: PDFString.of('Alive') } })));
  const source = await blob(initial), originalDocument = await c.importStudioPdf(source, 'Navigation.pdf');
  const removed = await PDFDocument.load(await (await c.exportStudioPdf(commands.pdfRemovePages(originalDocument, [0]), source)).arrayBuffer());
  assert.equal(removed.catalog.has(PDFName.of('OpenAction')), false);
  assert.equal(removed.catalog.lookup(PDFName.of('Outlines')).lookup(PDFName.of('First')).has(PDFName.of('Dest')), false);
  const tree = removed.catalog.lookup(PDFName.of('Names')).lookup(PDFName.of('Dests')).lookup(PDFName.of('Names'));
  assert.equal(tree.size(), 2); assert.equal(tree.lookup(0).decodeText(), 'Alive');
  assert.equal((removed.getPages()[0].node.Annots()?.asArray() ?? []).filter(ref => removed.context.lookup(ref).get(PDFName.of('Subtype')) === PDFName.of('Link')).length, 0);
  const copied = await PDFDocument.load(await (await c.exportStudioPdf(commands.pdfCopyPages(originalDocument, [0, 1], 2), source)).arrayBuffer());
  const linkFor = index => copied.getPages()[index].node.Annots().asArray().map(ref => copied.context.lookup(ref)).find(dict => dict.get(PDFName.of('Subtype')) === PDFName.of('Link'));
  assert.equal(linkFor(0).lookup(PDFName.of('A')).lookup(PDFName.of('D')).decodeText(), 'Alive');
  assert.equal(linkFor(2).lookup(PDFName.of('A')).lookup(PDFName.of('D')).get(0).toString(), copied.getPages()[3].ref.toString());
  assert.equal(linkFor(3).lookup(PDFName.of('Dest')).get(0).toString(), copied.getPages()[2].ref.toString());
});

test('page transformations keep readonly and source field-structure protections and reject invalid drafts without modifying source bytes', async () => {
  const c = codec(), commands = pageCommands(), source = await original(), hash = digest(Buffer.from(await source.arrayBuffer()));
  const document = commands.pdfInsertBlankPage(await c.importStudioPdf(source, 'Guard.pdf'), 1, { width: 300, height: 400 });
  await assert.rejects(c.exportStudioPdf({ ...document, fields: document.fields.map(field => field.name === 'reference' ? { ...field, value: 'Changed' } : field) }, source), /只读/);
  await assert.rejects(c.exportStudioPdf({ ...document, fields: document.fields.map(field => field.name === 'name' ? { ...field, widgets: [{ ...field.widgets[0], x: 200 }] } : field) }, source), /结构/);
  await assert.rejects(c.exportStudioPdf({ ...document, sourcePageCount: 3 }, source), /来源/);
  assert.equal(digest(Buffer.from(await source.arrayBuffer())), hash);
  assert.equal((await c.exportStudioPdf(document, source)).type, 'application/pdf');
});

test('preserves the original instance reference when its copy is inserted before it and keeps ordinary links on the original', async () => {
  const c = codec(), commands = pageCommands(), initial = await PDFDocument.create();
  const first = initial.addPage([300, 400]), second = initial.addPage([300, 400]);
  first.node.addAnnot(initial.context.register(initial.context.obj({ Type: PDFName.of('Annot'), Subtype: PDFName.of('Link'), Rect: [20, 20, 60, 40], Dest: [first.ref, PDFName.of('Fit')] })));
  second.node.addAnnot(initial.context.register(initial.context.obj({ Type: PDFName.of('Annot'), Subtype: PDFName.of('Link'), Rect: [20, 20, 60, 40], Dest: [first.ref, PDFName.of('Fit')] })));
  let source = await blob(initial), document = await c.importStudioPdf(source, 'Original-reference.pdf');
  document = commands.pdfCopyPages(document, [0], 0);
  const firstSave = await c.exportStudioPdf(document, source), saved = await PDFDocument.load(await firstSave.arrayBuffer());
  const destination = (pdf, index) => pdf.context.lookup(pdf.getPages()[index].node.Annots().get(0)).lookup(PDFName.of('Dest')).get(0).toString();
  assert.equal(saved.getPages()[1].ref.toString(), first.ref.toString());
  assert.notEqual(saved.getPages()[0].ref.toString(), first.ref.toString());
  assert.equal(destination(saved, 2), saved.getPages()[1].ref.toString());
  assert.equal(destination(saved, 0), saved.getPages()[0].ref.toString());
  source = firstSave; document = await c.importStudioPdf(source, 'Reopened-reference.pdf');
  document = commands.pdfInsertBlankPage(document, 3, { width: 200, height: 200 });
  const secondSave = await c.exportStudioPdf(document, source), reopened = await PDFDocument.load(await secondSave.arrayBuffer());
  assert.equal(destination(reopened, 2), reopened.getPages()[1].ref.toString());
  assert.equal(destination(reopened, 0), reopened.getPages()[0].ref.toString());
});

test('splits a valid combined field/widget before page duplication without creating a self-referencing field tree', async () => {
  const c = codec(), commands = pageCommands(), initial = await PDFDocument.create();
  const page = initial.addPage([300, 400]), font = await initial.embedFont(StandardFonts.Helvetica);
  page.drawText('Merged widget source', { x: 20, y: 350, size: 16, font });
  const field = initial.getForm().createTextField('Shared'); field.setText('Original'); field.enableReadOnly();
  field.acroField.dict.set(PDFName.of('TU'), PDFString.of('Field tooltip'));
  field.addToPage(page, { x: 40, y: 200, width: 160, height: 30, font });
  const widget = field.acroField.getWidgets()[0], widgetRef = field.acroField.Kids().get(0);
  widget.dict.set(PDFName.of('Contents'), PDFString.of('Widget contents'));
  for (const [key, value] of widget.dict.entries()) if (key !== PDFName.of('Parent')) field.acroField.dict.set(key, value);
  field.acroField.dict.delete(PDFName.of('Kids'));
  const annots = page.node.Annots(); annots.set(annots.indexOf(widgetRef), field.ref); initial.context.delete(widgetRef);
  let source = await blob(initial), native = await PDFDocument.load(await source.arrayBuffer());
  const originalField = native.getForm().getTextField('Shared'), appearance = originalField.acroField.dict.lookup(PDFName.of('AP')).lookup(PDFName.of('N'));
  const appearanceHash = digest(appearance.getContents());
  assert.equal(originalField.acroField.Kids(), undefined);
  assert.equal(native.getPages()[0].node.Annots().get(0).toString(), originalField.ref.toString());
  let document = await c.importStudioPdf(source, 'Merged-widget.pdf');
  for (let round = 0; round < 2; round++) {
    document = commands.pdfCopyPages(document, [0], document.pageCount);
    source = await c.exportStudioPdf(document, source); native = await PDFDocument.load(await source.arrayBuffer());
    const fields = native.getForm().getFields(); assert.equal(fields.length, 1);
    const parent = native.getForm().getTextField('Shared'), kids = parent.acroField.Kids();
    assert.equal(parent.getText(), 'Original'); assert.equal(parent.isReadOnly(), true);
    assert.equal(parent.acroField.dict.lookup(PDFName.of('TU')).decodeText(), 'Field tooltip');
    assert.equal(kids.size(), round + 2); assert.equal(parent.acroField.dict.has(PDFName.of('Subtype')), false);
    for (let index = 0; index < kids.size(); index++) {
      const ref = kids.get(index), child = native.context.lookup(ref);
      assert.notEqual(ref.toString(), parent.ref.toString()); assert.equal(child.get(PDFName.of('Parent')).toString(), parent.ref.toString());
      assert.equal(child.lookup(PDFName.of('Subtype')), PDFName.of('Widget')); assert.equal(child.has(PDFName.of('T')), false);
      assert.equal(child.lookup(PDFName.of('Contents')).decodeText(), 'Widget contents');
      assert.equal(digest(child.lookup(PDFName.of('AP')).lookup(PDFName.of('N')).getContents()), appearanceHash);
      const owner = native.getPages().find(entry => entry.ref.toString() === child.get(PDFName.of('P')).toString());
      assert.ok(owner.node.Annots().asArray().some(entry => entry.toString() === ref.toString()));
    }
    document = await c.importStudioPdf(source, 'Merged-reopened.pdf');
    assert.equal(document.fields.length, 1); assert.equal(document.fields[0].widgets.length, round + 2);
  }
});

test('materializes inherited page boxes resources and rotation before reparenting original leaves', async () => {
  const c = codec(), commands = pageCommands(), initial = await PDFDocument.create();
  const page = initial.addPage([300, 400]), font = await initial.embedFont(StandardFonts.Helvetica);
  page.drawText('Inherited page resources', { x: 20, y: 340, size: 18, font });
  const root = initial.catalog.Pages(), rootRef = initial.catalog.get(PDFName.of('Pages'));
  const resources = page.node.get(PDFName.of('Resources'));
  const branch = initial.context.register(initial.context.obj({ Type: PDFName.of('Pages'), Parent: rootRef, Kids: [page.ref], Count: 1, MediaBox: [0, 0, 300, 400], Resources: resources, Rotate: 90 }));
  root.set(PDFName.of('Kids'), initial.context.obj([branch])); page.node.setParent(branch);
  for (const key of ['MediaBox', 'Resources', 'Rotate']) page.node.delete(PDFName.of(key));
  let source = await blob(initial), native = await PDFDocument.load(await source.arrayBuffer());
  const hashes = streamHashes(native, 0), originalRef = native.getPages()[0].ref.toString();
  assert.equal(native.getPages()[0].getWidth(), 300); assert.equal(native.getPages()[0].getRotation().angle, 90);
  assert.equal(native.getPages()[0].node.has(PDFName.of('MediaBox')), false);
  let document = commands.pdfInsertBlankPage(await c.importStudioPdf(source, 'Inherited.pdf'), 1, { width: 200, height: 100 });
  for (let round = 0; round < 2; round++) {
    source = await c.exportStudioPdf(document, source); native = await PDFDocument.load(await source.arrayBuffer());
    const index = native.getPages().findIndex(entry => entry.ref.toString() === originalRef), kept = native.getPages()[index];
    assert.equal(kept.getWidth(), 300); assert.equal(kept.getHeight(), 400); assert.equal(kept.getRotation().angle, 90);
    assert.ok(kept.node.has(PDFName.of('MediaBox'))); assert.ok(kept.node.has(PDFName.of('Resources'))); assert.ok(kept.node.has(PDFName.of('Rotate')));
    const fonts = kept.node.Resources().lookup(PDFName.of('Font')); assert.ok(fonts.entries().length > 0);
    const name = fonts.entries()[0][1], fontDictionary = native.context.lookup(name); assert.equal(fontDictionary.lookup(PDFName.of('BaseFont')), PDFName.of('Helvetica'));
    assert.deepEqual(streamHashes(native, index), hashes);
    document = await c.importStudioPdf(source, 'Inherited-reopened.pdf');
    if (!round) document = commands.pdfMovePages(document, [0], 2);
  }
});

test('maps AA and chained actions within copied groups, prunes deleted targets and bounds cyclic Next actions', async () => {
  const c = codec(), commands = pageCommands(), initial = await PDFDocument.load(await (await original()).arrayBuffer());
  const [first, second] = initial.getPages(), field = initial.getForm().getCheckBox('confirmed');
  const jump = () => initial.context.register(initial.context.obj({ S: PDFName.of('GoTo'), D: [second.ref, PDFName.of('Fit')] }));
  field.acroField.getWidgets()[0].dict.set(PDFName.of('AA'), initial.context.obj({ U: jump() }));
  field.acroField.dict.set(PDFName.of('AA'), initial.context.obj({ V: jump() }));
  const cycle = initial.context.register(initial.context.obj({ S: PDFName.of('URI'), URI: PDFString.of('https://example.com/cycle') }));
  initial.context.lookup(cycle).set(PDFName.of('Next'), cycle);
  first.node.set(PDFName.of('AA'), initial.context.obj({ O: { S: PDFName.of('URI'), URI: PDFString.of('https://example.com/page'), Next: [jump(), cycle] } }));
  initial.catalog.set(PDFName.of('OpenAction'), initial.context.obj({ S: PDFName.of('URI'), URI: PDFString.of('https://example.com/open'), Next: jump() }));
  const source = await blob(initial), copiedDocument = commands.pdfCopyPages(await c.importStudioPdf(source, 'Actions.pdf'), [0, 1], 2);
  const copied = await PDFDocument.load(await (await c.exportStudioPdf(copiedDocument, source)).arrayBuffer());
  const widgetAt = (pdf, index) => pdf.getForm().getCheckBox('confirmed').acroField.getWidgets().find(widget => widget.P().toString() === pdf.getPages()[index].ref.toString());
  const actionAt = (widget) => widget.dict.lookup(PDFName.of('AA')).lookup(PDFName.of('U'));
  assert.equal(actionAt(widgetAt(copied, 0)).lookup(PDFName.of('D')).get(0).toString(), copied.getPages()[1].ref.toString());
  assert.equal(actionAt(widgetAt(copied, 2)).lookup(PDFName.of('D')).get(0).toString(), copied.getPages()[3].ref.toString());
  const copiedNext = copied.getPages()[2].node.lookup(PDFName.of('AA')).lookup(PDFName.of('O')).lookup(PDFName.of('Next'));
  assert.equal(copiedNext.lookup(0).lookup(PDFName.of('D')).get(0).toString(), copied.getPages()[3].ref.toString());
  assert.equal(copiedNext.lookup(1).has(PDFName.of('Next')), false);
  const removed = await PDFDocument.load(await (await c.exportStudioPdf(commands.pdfRemovePages(copiedDocument, [1]), source)).arrayBuffer());
  assert.equal(widgetAt(removed, 0).dict.lookup(PDFName.of('AA')).has(PDFName.of('U')), false);
  assert.equal(removed.getForm().getCheckBox('confirmed').acroField.dict.lookup(PDFName.of('AA')).has(PDFName.of('V')), false);
  assert.equal(removed.catalog.lookup(PDFName.of('OpenAction')).has(PDFName.of('Next')), false);
  assert.equal(actionAt(widgetAt(removed, 1)).lookup(PDFName.of('D')).get(0).toString(), removed.getPages()[2].ref.toString());
  assert.equal(removed.getPages()[0].node.lookup(PDFName.of('AA')).lookup(PDFName.of('O')).lookup(PDFName.of('Next')).size(), 1);
});

test('keeps hidden radio widgets and their selected export value across insertions, copies and removal of the original page', async () => {
  const c = codec(), commands = pageCommands(), initial = await PDFDocument.create(), page = initial.addPage([300, 400]);
  const radio = initial.getForm().createRadioGroup('Hidden'); radio.addOptionToPage('H', page, { x: 20, y: 80, width: 16, height: 16 }); radio.addOptionToPage('V', page, { x: 60, y: 80, width: 16, height: 16 }); radio.select('H');
  const hidden = radio.acroField.getWidgets()[0]; hidden.setFlags(32); hidden.setRectangle({ x: 20, y: 80, width: 0, height: 0 });
  let source = await blob(initial), before = await PDFDocument.load(await source.arrayBuffer());
  const onHash = digest(before.getForm().getRadioGroup('Hidden').acroField.getWidgets()[0].getAppearances().normal.lookup(hidden.getOnValue()).getContents());
  let document = await c.importStudioPdf(source, 'Hidden.pdf');
  assert.equal(document.fields[0].widgets.length, 1); assert.equal(document.fields[0].hiddenWidgets.length, 1); assert.equal(document.fields[0].hiddenWidgets[0].option, 'H');
  for (let round = 0; round < 2; round++) {
    document = commands.pdfInsertBlankPage(document, document.pageCount, { width: 200, height: 100 });
    source = await c.exportStudioPdf(document, source); const pdf = await PDFDocument.load(await source.arrayBuffer()), native = pdf.getForm().getRadioGroup('Hidden');
    assert.deepEqual(native.getOptions(), ['H', 'V']); assert.equal(native.getSelected(), 'H');
    const widget = native.acroField.getWidgets().find(entry => entry.getFlags() & 32);
    assert.equal(widget.getRectangle().width, 0); assert.equal(widget.getAppearanceState(), widget.getOnValue());
    assert.equal(digest(widget.getAppearances().normal.lookup(widget.getOnValue()).getContents()), onHash);
    document = await c.importStudioPdf(source, 'Hidden-reopened.pdf');
  }
  document = commands.pdfRemovePages(commands.pdfCopyPages(document, [0], document.pageCount), [0]);
  const copied = await PDFDocument.load(await (await c.exportStudioPdf(document, source)).arrayBuffer()), native = copied.getForm().getRadioGroup('Hidden');
  assert.equal(native.getSelected(), 'H'); assert.equal(native.acroField.getWidgets().length, 2); assert.ok(native.acroField.getWidgets().some(widget => widget.getFlags() & 32));
});

test('radio options preserve meaning after copy and original-page deletion while choice ordering guards remain strict', async () => {
  const c = codec(), commands = pageCommands(); let source = await original(), document = await c.importStudioPdf(source, 'Radio-order.pdf');
  document = commands.pdfRemovePages(commands.pdfCopyPages(document, [0], 2), [0]);
  assert.deepEqual(Array.from(document.fields.find(field => field.name === 'choice').options), ['A', 'B', 'C']);
  for (let round = 0; round < 2; round++) {
    source = await c.exportStudioPdf(document, source); const pdf = await PDFDocument.load(await source.arrayBuffer()), radio = pdf.getForm().getRadioGroup('choice');
    assert.deepEqual(radio.getOptions(), ['C', 'A', 'B']); assert.equal(radio.getSelected(), 'A');
    assert.equal(radio.acroField.getWidgets()[1].getAppearanceState(), radio.acroField.getWidgets()[1].getOnValue());
    document = await c.importStudioPdf(source, 'Radio-reopened.pdf'); if (!round) document = commands.pdfRotatePages(document, [1], 90);
  }
  const ordinarySource = await original(), ordinary = await c.importStudioPdf(ordinarySource, 'Dropdown-order.pdf');
  ordinary.fields.find(field => field.name === 'status').options.reverse();
  await assert.rejects(c.exportStudioPdf(ordinary, ordinarySource), /结构/);
});

test('drawing only on a copied page isolates Contents and mutable resource maps while retaining original streams and widget appearances', async () => {
  const c = codec(), commands = pageCommands(), initial = await PDFDocument.create(), page = initial.addPage([300, 400]), font = await initial.embedFont(StandardFonts.Helvetica);
  page.drawText('Original only', { x: 20, y: 340, size: 18, font }); const field = initial.getForm().createTextField('Shared'); field.setText('Original'); field.addToPage(page, { x: 40, y: 180, width: 120, height: 24, font });
  let source = await blob(initial), before = await PDFDocument.load(await source.arrayBuffer()), document = commands.pdfCopyPages(await c.importStudioPdf(source, 'Contents.pdf'), [0], 1);
  const instructions = pageInstructions(before, 0), hashes = streamHashes(before, 0), refs = before.getPages()[0].node.Contents().asArray().map(ref => ref.toString());
  const appearanceHash = digest(before.getForm().getTextField('Shared').acroField.getWidgets()[0].getAppearances().normal.getContents());
  document.marks = [{ id: 'copy-rectangle', type: 'rectangle', page: 1, x: 40, y: 40, width: 80, height: 30, text: '', size: 12 }, { id: 'copy-highlight', type: 'highlight', page: 1, x: 40, y: 80, width: 80, height: 20, text: '', size: 12, color: '#ff0000' }];
  for (let round = 0; round < 2; round++) {
    source = await c.exportStudioPdf(document, source); const pdf = await PDFDocument.load(await source.arrayBuffer());
    assert.equal(pageInstructions(pdf, 0), instructions); assert.deepEqual(streamHashes(pdf, 0), hashes); assert.deepEqual(pdf.getPages()[0].node.Contents().asArray().map(ref => ref.toString()), refs);
    assert.match(pageInstructions(pdf, 1), /1 0 0 1 40 40 cm[\s\S]*?0 30 l\n80 30 l\n80 0 l\nh\nS/); assert.match(pageInstructions(pdf, 1), /1 0 0 1 40 80 cm[\s\S]*?0 20 l\n80 20 l\n80 0 l\nh\nf/);
    const resource = index => pdf.getPages()[index].node.Resources().lookup(PDFName.of('ExtGState'));
    assert.equal(resource(0).entries().length, 0); assert.ok(resource(1).entries().length > 0);
    assert.equal(pdf.getForm().getTextField('Shared').acroField.getWidgets().length, 2); assert.ok(pdf.getForm().getTextField('Shared').acroField.getWidgets().every(widget => digest(widget.getAppearances().normal.getContents()) === appearanceHash));
    document = await c.importStudioPdf(source, 'Contents-reopened.pdf'); if (!round) document.marks = [{ id: 'second-copy-rectangle', type: 'rectangle', page: 1, x: 140, y: 40, width: 50, height: 30, text: '', size: 12 }];
  }
});

test('keeps each repeated-source copy self actions on its own page while field-global actions retain their original context', async () => {
  const c = codec(), commands = pageCommands(), initial = await PDFDocument.create(), page = initial.addPage([300, 400]);
  const field = initial.getForm().createCheckBox('Self'); field.addToPage(page, { x: 40, y: 100, width: 18, height: 18 });
  const jump = () => initial.context.obj({ S: PDFName.of('GoTo'), D: [page.ref, PDFName.of('Fit')] });
  page.node.set(PDFName.of('AA'), initial.context.obj({ O: jump() })); field.acroField.dict.set(PDFName.of('AA'), initial.context.obj({ V: jump() }));
  field.acroField.getWidgets()[0].dict.set(PDFName.of('AA'), initial.context.obj({ U: jump() }));
  const linkAction = jump(); linkAction.set(PDFName.of('Next'), jump()); page.node.addAnnot(initial.context.register(initial.context.obj({ Type: PDFName.of('Annot'), Subtype: PDFName.of('Link'), Rect: [20, 20, 60, 40], A: linkAction })));
  let source = await blob(initial), document = await c.importStudioPdf(source, 'Repeated-self.pdf');
  document = commands.pdfCopyPages(commands.pdfCopyPages(document, [0], 1), [0, 1], 2);
  for (let round = 0; round < 2; round++) {
    source = await c.exportStudioPdf(document, source); const pdf = await PDFDocument.load(await source.arrayBuffer()), native = pdf.getForm().getCheckBox('Self');
    for (const current of pdf.getPages()) {
      const owner = current.ref.toString(), widget = native.acroField.getWidgets().find(entry => entry.P().toString() === owner);
      assert.equal(widget.dict.lookup(PDFName.of('AA')).lookup(PDFName.of('U')).lookup(PDFName.of('D')).get(0).toString(), owner);
      assert.equal(current.node.lookup(PDFName.of('AA')).lookup(PDFName.of('O')).lookup(PDFName.of('D')).get(0).toString(), owner);
      const link = current.node.Annots().asArray().map(ref => pdf.context.lookup(ref)).find(dict => dict.get(PDFName.of('Subtype')) === PDFName.of('Link')), action = link.lookup(PDFName.of('A'));
      assert.equal(action.lookup(PDFName.of('D')).get(0).toString(), owner); assert.equal(action.lookup(PDFName.of('Next')).lookup(PDFName.of('D')).get(0).toString(), owner);
    }
    assert.equal(native.acroField.dict.lookup(PDFName.of('AA')).lookup(PDFName.of('V')).lookup(PDFName.of('D')).get(0).toString(), pdf.getPages()[0].ref.toString());
    document = await c.importStudioPdf(source, 'Self-reopened.pdf'); if (!round) document = commands.pdfCopyPages(document, [2, 3], 4);
  }
});

test('clears designed text, date, choice, list and image values without recreating field refs or leaving stale appearances', async () => {
  const c = codec(), pdf = await PDFDocument.create(); pdf.addPage([400, 500]);
  const original = await blob(pdf), base = await c.importStudioPdf(original, 'Designed.pdf');
  const widget = (y) => [{ page: 0, x: 20, y, width: 140, height: 26 }];
  base.fields = [
    { name: 'text', type: 'text', value: 'Original', readOnly: false, design: { kind: 'text', defaultValue: 'Default' }, widgets: widget(420) },
    { name: 'date', type: 'text', value: '2026-11-26', readOnly: false, design: { kind: 'date', defaultValue: '2026-01-01' }, widgets: widget(370) },
    { name: 'drop', type: 'choice', value: 'A', options: ['A', 'B'], readOnly: false, design: { kind: 'dropdown', optionLabels: { A: 'Alpha', B: 'Beta' }, defaultValue: 'B' }, widgets: widget(320) },
    { name: 'list', type: 'choice', value: 'A', selectedValues: ['A', 'B'], options: ['A', 'B'], readOnly: false, design: { kind: 'list', multiSelect: true, defaultSelections: ['B'] }, widgets: [{ ...widget(240)[0], height: 60 }] },
    { name: 'image', type: 'image', value: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9N8AAAAASUVORK5CYII=', readOnly: false, design: { kind: 'image' }, widgets: widget(190) },
  ];
  const filled = await c.exportStudioPdf(base, original), before = await PDFDocument.load(await filled.arrayBuffer());
  const refs = new Map(before.getForm().getFields().map((field) => [field.getName(), field.ref.toString()]));
  const oldAp = new Map(before.getForm().getFields().map((field) => [field.getName(), digest(field.acroField.getWidgets()[0].getAppearances().normal.getContents())]));
  const draft = await c.importStudioPdf(filled, 'Filled.pdf');
  draft.fields = draft.fields.map((field) => ({ ...field, value: '', ...(field.design?.kind === 'list' ? { selectedValues: [] } : {}) }));
  const cleared = await c.exportStudioPdf(draft, filled), after = await PDFDocument.load(await cleared.arrayBuffer());
  for (const field of after.getForm().getFields()) {
    assert.equal(field.ref.toString(), refs.get(field.getName()));
    assert.notEqual(digest(field.acroField.getWidgets()[0].getAppearances().normal.getContents()), oldAp.get(field.getName()));
  }
  assert.equal(after.getForm().getTextField('text').getText(), undefined);
  assert.equal(after.getForm().getTextField('date').getText(), undefined);
  assert.deepEqual(after.getForm().getDropdown('drop').getSelected(), []);
  assert.deepEqual(after.getForm().getOptionList('list').getSelected(), []);
  assert.equal(after.getForm().getButton('image').acroField.dict.lookup(PDFName.of('ZuviFieldImage')).decodeText(), '');
  assert.equal(after.getForm().getTextField('text').acroField.dict.lookup(PDFName.of('DV')).decodeText(), 'Default');
  assert.equal(after.getForm().getTextField('date').acroField.dict.lookup(PDFName.of('DV')).decodeText(), '2026-01-01');
  assert.deepEqual(after.getForm().getOptionList('list').acroField.dict.lookup(PDFName.of('DV')).asArray().map((item) => item.decodeText()), ['B']);
  const reopened = await c.importStudioPdf(cleared, 'Cleared.pdf'); assert.equal(await c.exportStudioPdf(reopened, cleared), cleared);
});
