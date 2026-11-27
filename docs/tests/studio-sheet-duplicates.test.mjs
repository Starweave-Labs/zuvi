import assert from 'node:assert/strict';
import { Blob, Buffer } from 'node:buffer';
import { webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import { clearTimeout, setTimeout } from 'node:timers';
import { URL } from 'node:url';
import { runInNewContext } from 'node:vm';

const require = createRequire(new URL('../package.json', import.meta.url));
const uiRequire = createRequire(new URL('../../packages/ui/package.json', import.meta.url));
const ts = require('typescript');
const ExcelJS = require('exceljs');
const JSZip = require('jszip');
const { JSDOM } = uiRequire('jsdom');
const dom = new JSDOM('', { url: 'http://127.0.0.1:5272/' });
const modules = new Map();
function compiled(relative) {
  const url = new URL(relative, import.meta.url);
  if (modules.has(url.href)) return modules.get(url.href).exports;
  const module = { exports: {} };
  modules.set(url.href, module);
  const code = ts.transpileModule(readFileSync(url, 'utf8'), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
    },
  }).outputText;
  runInNewContext(code, {
    module,
    exports: module.exports,
    require: (id) => {
      if (id === '@zuvi/react') return models;
      if (id.startsWith('.')) return compiled(new URL(`${id}.ts`, url).href);
      return require(id);
    },
    Blob,
    Buffer,
    Uint8Array,
    Date,
    URL,
    Map,
    Set,
    Error,
    crypto: webcrypto,
    DOMParser: dom.window.DOMParser,
    XMLSerializer: dom.window.XMLSerializer,
    document: dom.window.document,
    setTimeout,
    clearTimeout,
  });
  return module.exports;
}
const models = compiled('../../packages/ui/src/components/OfficeStudio/studio-model.ts');
const sheets = compiled('../../packages/ui/src/components/OfficeStudio/studio-sheet-model.ts');
const duplicates = compiled(
  '../../packages/ui/src/components/OfficeStudio/studio-sheet-duplicates.ts'
);
const links = compiled('../../packages/ui/src/components/OfficeStudio/studio-sheet-hyperlinks.ts');
const codec = compiled('../src/pages/collaboration/office-studio/studio-excel-codec.ts');
const S = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const selection = (first, last = first) => ({
  anchor: sheets.studioParseAddress(first),
  focus: sheets.studioParseAddress(last),
});
const plain = (value) => JSON.parse(JSON.stringify(value));

async function fixture() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Duplicates');
  const other = workbook.addWorksheet('Other');
  const quoted = workbook.addWorksheet('Other quoted');
  other.getCell('A4').value = 7;
  other.getCell('B4').value = 5;
  quoted.getCell('A4').value = 3;
  quoted.getCell('B4').value = 9;
  sheet.getColumn('A').width = 20;
  sheet.getColumn('B').width = 28;
  sheet.getRow(3).height = 35;
  sheet.getCell('A1').value = 'Key';
  sheet.getCell('B1').value = 'Value';
  for (const address of ['A1', 'B1']) sheet.getCell(address).font = { bold: true };
  sheet.getCell('A2').value = 'A';
  sheet.getCell('B2').value = 10;
  sheet.getCell('A3').value = 'A';
  sheet.getCell('B3').value = 20;
  sheet.getCell('B3').font = { italic: true, color: { argb: 'FFFF0000' } };
  sheet.getCell('B3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
  sheet.getCell('B3').numFmt = '0.00';
  sheet.getCell('B3').border = { top: { style: 'thick', color: { argb: 'FF112233' } } };
  sheet.getCell('A4').value = 'B';
  sheet.getCell('A4').font = { bold: true };
  sheet.getCell('A4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCFFEE' } };
  sheet.getCell('B4').value = {
    formula: "LEN(A4)*3+$D$1+SUM(Other!A4:B4)+SUM('Other quoted'!$A4:B$4)",
    result: 29,
  };
  sheet.getCell('D1').value = 2;
  for (const row of [2, 3, 4]) sheet.getCell(`C${row}`).value = `outside-${row}`;
  sheet.getCell('B6').value = 'below';
  sheet.getCell('E4').value = {
    text: 'kept link',
    hyperlink: 'https://example.com/record',
    tooltip: 'record tooltip',
  };
  sheet.getCell('E3').value = { text: 'removed link', hyperlink: 'https://example.com/removed' };
  sheet.getCell('F4').value = { text: 'outside link', hyperlink: 'https://example.com/outside' };
  return new Blob([await workbook.xlsx.writeBuffer()]);
}
async function readNative(source) {
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(await source.arrayBuffer());
  const zip = await JSZip.loadAsync(await source.arrayBuffer());
  const xml = new dom.window.DOMParser().parseFromString(
    await zip.file('xl/worksheets/sheet1.xml').async('string'),
    'application/xml'
  );
  const cell = (address) =>
    Array.from(xml.getElementsByTagNameNS(S, 'c')).find(
      (node) => node.getAttribute('r') === address
    );
  return { book, sheet: book.getWorksheet('Duplicates'), zip, xml, cell };
}

test('native duplicate removal compacts selected records, resets overwritten source formatting and retains formulas over two reopens', async () => {
  let source = await fixture();
  let document = await codec.importStudioExcel(source, 'Duplicates.xlsx');
  const id = document.activeSheetId;
  const originalModel = JSON.stringify(document);
  const originalBytes = Buffer.from(await source.arrayBuffer());
  const result = duplicates.studioRemoveSheetDuplicates(document, id, selection('A1', 'B4'), {
    columns: [1],
    header: true,
  });
  assert.equal(result.removedCount, 1);
  assert.equal(result.remainingCount, 2);
  assert.equal(JSON.stringify(document), originalModel);
  assert.deepEqual(Buffer.from(await source.arrayBuffer()), originalBytes);
  document = result.document;
  for (let pass = 0; pass < 2; pass++) {
    const before = JSON.stringify(document);
    source = await codec.exportStudioExcel(document, source);
    assert.equal(JSON.stringify(document), before);
    const saved = await readNative(source);
    assert.equal(saved.sheet.getCell('A1').value, 'Key');
    assert.equal(saved.sheet.getCell('A2').value, 'A');
    assert.equal(saved.sheet.getCell('A3').value, 'B');
    assert.equal(saved.sheet.getCell('A3').font.bold, true);
    assert.equal(saved.sheet.getCell('A3').fill.fgColor.argb, 'FFCCFFEE');
    assert.equal(Boolean(saved.sheet.getCell('B3').font.italic), false);
    assert.notEqual(saved.sheet.getCell('B3').font.color?.argb, 'FFFF0000');
    assert.notEqual(saved.sheet.getCell('B3').fill?.pattern, 'solid');
    // Native numFmtId=0 is Excel's General format; ExcelJS omits its string.
    assert.equal(saved.sheet.getCell('B3').numFmt ?? 'General', 'General');
    const style = Array.from(
      new dom.window.DOMParser()
        .parseFromString(await saved.zip.file('xl/styles.xml').async('string'), 'application/xml')
        .getElementsByTagNameNS(S, 'cellXfs')
    )[0].children[Number(saved.cell('B3').getAttribute('s') ?? 0)];
    assert.equal(Number(style.getAttribute('numFmtId') ?? 0), 0);
    assert.deepEqual(saved.sheet.getCell('B3').border, {});
    const formula = "LEN(A3)*3+$D$1+SUM(Other!A4:B4)+SUM('Other quoted'!$A4:B$4)";
    assert.equal(saved.sheet.getCell('B3').formula, formula);
    assert.equal(saved.cell('B3').getElementsByTagNameNS(S, 'f')[0].textContent, formula);
    assert.equal(saved.sheet.getCell('B3').result, 29);
    for (const address of ['A4', 'B4']) {
      assert.equal(saved.sheet.getCell(address).value, null);
      assert.equal(Boolean(saved.sheet.getCell(address).font.bold), false);
      assert.notEqual(saved.sheet.getCell(address).fill?.pattern, 'solid');
    }
    for (const row of [2, 3, 4])
      assert.equal(saved.sheet.getCell(`C${row}`).value, `outside-${row}`);
    assert.equal(saved.sheet.getCell('B6').value, 'below');
    assert.equal(saved.sheet.getRow(3).height, 35);
    assert.equal(saved.sheet.getColumn('A').width, 20);
    assert.equal(saved.sheet.getColumn('B').width, 28);
    assert.equal(saved.book.getWorksheet('Other').getCell('A4').value, 7);
    document = await codec.importStudioExcel(source, 'Reopened.xlsx');
    assert.equal(document.sheets[0].cells.B3.input, '=' + formula);
    const noop = duplicates.studioRemoveSheetDuplicates(document, id, selection('A1', 'B3'), {
      columns: [1],
      header: true,
    });
    assert.equal(noop.removedCount, 0);
    assert.equal(noop.document, document);
  }
});

test('native hyperlinks follow retained records and clear deleted tails without changing adjacent links', async () => {
  let source = await fixture();
  let document = await codec.importStudioExcel(source, 'Links.xlsx');
  const id = document.activeSheetId;
  document = duplicates.studioRemoveSheetDuplicates(document, id, selection('A1', 'E4'), {
    columns: [1],
    header: true,
  }).document;
  for (let pass = 0; pass < 2; pass++) {
    source = await codec.exportStudioExcel(document, source);
    const native = await readNative(source);
    assert.equal(native.sheet.getCell('E3').value.hyperlink, 'https://example.com/record');
    // ExcelJS does not expose tooltip when reading an existing link. The
    // actual native hyperlink attribute and our independent importer do.
    const hyperlink = Array.from(native.xml.getElementsByTagNameNS(S, 'hyperlink')).find(
      (node) => node.getAttribute('ref') === 'E3'
    );
    assert.equal(hyperlink.getAttribute('tooltip'), 'record tooltip');
    assert.equal(native.sheet.getCell('E4').value, null);
    assert.equal(native.sheet.getCell('F4').value.hyperlink, 'https://example.com/outside');
    document = await codec.importStudioExcel(source, 'Links-reopened.xlsx');
    assert.equal(
      links.studioSheetHyperlinksAt(document.sheets[0], 'E3')[0].target,
      'https://example.com/record'
    );
    assert.equal(
      links.studioSheetHyperlinksAt(document.sheets[0], 'E3')[0].tooltip,
      'record tooltip'
    );
    assert.equal(links.studioSheetHyperlinksAt(document.sheets[0], 'E4').length, 0);
  }
});

test('native typed comparison distinguishes numeric, text, boolean, true blank and explicit empty text through two reopens', async () => {
  const workbook = new ExcelJS.Workbook(),
    sheet = workbook.addWorksheet('Duplicates');
  sheet.getCell('A1').value = 'Key';
  const values = [
    1,
    '1',
    true,
    'true',
    null,
    null,
    '',
    { formula: '""', result: '' },
    { formula: '1', result: 1 },
    { formula: 'TRUE()', result: true },
  ];
  values.forEach((value, index) => {
    sheet.getCell(`A${index + 2}`).value = value;
    sheet.getCell(`B${index + 2}`).value = index + 2;
  });
  let source = new Blob([await workbook.xlsx.writeBuffer()]),
    document = await codec.importStudioExcel(source, 'Types.xlsx');
  const id = document.activeSheetId;
  assert.equal(document.sheets[0].cells.A8.input, "'");
  const result = duplicates.studioRemoveSheetDuplicates(document, id, selection('A1', 'B11'), {
    columns: [1],
    header: true,
  });
  assert.equal(result.removedCount, 4);
  assert.equal(result.remainingCount, 6);
  document = result.document;
  for (let pass = 0; pass < 2; pass++) {
    source = await codec.exportStudioExcel(document, source);
    const native = await readNative(source);
    assert.deepEqual(
      [2, 3, 4, 5, 6, 7].map((row) => native.sheet.getCell(`A${row}`).value),
      [1, '1', true, 'true', null, '']
    );
    assert.deepEqual(
      [2, 3, 4, 5, 6, 7].map((row) => native.sheet.getCell(`B${row}`).value),
      [2, 3, 4, 5, 6, 8]
    );
    assert.equal(native.cell('A3').getAttribute('t'), 's');
    assert.equal(native.cell('A4').getAttribute('t'), 'b');
    assert.equal(native.cell('A7').getAttribute('t'), 's');
    for (const row of [8, 9, 10, 11]) assert.equal(native.sheet.getCell(`A${row}`).value, null);
    document = await codec.importStudioExcel(source, 'Types-reopened.xlsx');
    assert.equal(document.sheets[0].cells.A7.input, "'");
    const rerun = duplicates.studioRemoveSheetDuplicates(document, id, selection('A2', 'B7'), {
      columns: [1],
      header: false,
    });
    assert.equal(rerun.removedCount, 0);
    assert.equal(rerun.remainingCount, 6);
  }
});

test('explicit empty input with text valueType stays native text when moved and reopens as an empty text key', async () => {
  let source = await fixture(),
    document = await codec.importStudioExcel(source, 'Explicit.xlsx');
  const id = document.activeSheetId;
  document.sheets[0].cells.A4 = { input: '', valueType: 'text' };
  const result = duplicates.studioRemoveSheetDuplicates(document, id, selection('A1', 'B4'), {
    columns: [1],
    header: true,
  });
  assert.equal(result.removedCount, 1);
  assert.equal(result.remainingCount, 2);
  document = result.document;
  assert.equal(document.sheets[0].cells.A3.input, '');
  assert.equal(document.sheets[0].cells.A3.valueType, 'text');
  for (let pass = 0; pass < 2; pass++) {
    source = await codec.exportStudioExcel(document, source);
    const native = await readNative(source);
    assert.equal(native.sheet.getCell('A3').value, '');
    assert.equal(native.cell('A3').getAttribute('t'), 's');
    document = await codec.importStudioExcel(source, 'Explicit-reopened.xlsx');
    assert.equal(document.sheets[0].cells.A3.input, "'");
  }
});

test('native sources and original model remain unchanged when duplicate removal refuses unsafe regions', async () => {
  const source = await fixture(),
    original = await codec.importStudioExcel(source, 'Guards.xlsx');
  const sourceBytes = Buffer.from(await source.arrayBuffer());
  for (const kind of ['protected', 'merged', 'array', 'validation', 'conditional']) {
    const document = plain(original),
      sheet = document.sheets[0],
      id = sheet.id;
    if (kind === 'protected') sheet.protectedRanges = ['B4'];
    if (kind === 'merged') sheet.merges = ['A3:A4'];
    if (kind === 'array') sheet.cells.B4 = { input: '=SEQUENCE(2,1)', array: { type: 'dynamic' } };
    if (kind === 'validation')
      sheet.dataValidations = [
        { id: 'v', range: 'B3:B4', type: 'whole', operator: 'greaterThan', formula1: '0' },
      ];
    if (kind === 'conditional')
      sheet.conditionalFormats = [
        {
          id: 'c',
          priority: 1,
          range: 'B3:B4',
          type: 'cellIs',
          operator: 'greaterThan',
          formulae: ['0'],
          style: { bold: true },
        },
      ];
    const before = JSON.stringify(document);
    assert.throws(
      () =>
        duplicates.studioRemoveSheetDuplicates(document, id, selection('A1', 'B4'), {
          columns: [1],
          header: true,
        }),
      undefined,
      kind
    );
    assert.equal(JSON.stringify(document), before, kind);
    assert.deepEqual(Buffer.from(await source.arrayBuffer()), sourceBytes, kind);
  }
});
