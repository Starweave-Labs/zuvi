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
function compiled(relative, overrides = {}) {
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
      if (overrides[id] !== undefined) return overrides[id];
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
const structure = compiled(
  '../../packages/ui/src/components/OfficeStudio/studio-sheet-structure.ts'
);
const codec = compiled('../src/pages/collaboration/office-studio/studio-excel-codec.ts');
const S = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const plain = (value) => JSON.parse(JSON.stringify(value));
async function fixture() {
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet('Visibility');
  sheet.getColumn('A').width = 18;
  sheet.getColumn('B').width = 24;
  sheet.getColumn('B').hidden = true;
  sheet.getCell('A1').value = 'Value';
  sheet.getCell('A2').value = 2;
  sheet.getCell('A3').value = 3;
  sheet.getCell('A4').value = 4;
  sheet.getCell('C2').value = { formula: 'SUM(A2:A4)', result: 9 };
  sheet.getRow(2).height = 32;
  sheet.getRow(3).height = 42;
  sheet.getRow(5).height = 26;
  sheet.getRow(5).hidden = true;
  const zip = await JSZip.loadAsync(await book.xlsx.writeBuffer());
  const part = 'xl/worksheets/sheet1.xml';
  const raw = await zip.file(part).async('string');
  // Native auto height with an explicitly cached point height.
  zip.file(part, raw.replace(/(<row\b[^>]*\br="3"[^>]*)customHeight="1"/, '$1customHeight="0"'));
  return new Blob([await zip.generateAsync({ type: 'uint8array' })]);
}

async function native(source) {
  const zip = await JSZip.loadAsync(await source.arrayBuffer());
  const xml = new dom.window.DOMParser().parseFromString(
    await zip.file('xl/worksheets/sheet1.xml').async('string'),
    'application/xml'
  );
  const row = (number) =>
    Array.from(xml.getElementsByTagNameNS(S, 'row')).find(
      (item) => Number(item.getAttribute('r')) === number
    );
  return { zip, xml, row };
}

test('manual visibility preserves dimensions, auto/fixed modes and filter overlap over two XLSX reopens', async () => {
  let source = await fixture();
  let document = await codec.importStudioExcel(source, 'Visibility.xlsx');
  const id = document.activeSheetId;
  const original = plain(document.sheets[0]);
  assert.equal(original.rowHeightModes['2'], 'fixed');
  assert.equal(original.rowHeightModes['3'], 'auto');
  document = sheets.studioSetFilter(document, id, {
    range: 'A1:A4',
    columns: { A: { operator: 'greater', value: '2' } },
  });
  document = sheets.studioSetRowsHidden(document, id, [2, 3, 5]);
  const selected = { firstRow: 2, lastRow: 3, firstCol: 1, lastCol: 2 };
  document = sheets.studioSetRangeHidden(document, id, selected, 'columns', true);
  for (let pass = 0; pass < 2; pass++) {
    source = await codec.exportStudioExcel(document, source);
    const saved = await native(source);
    assert.equal(
      saved.xml.documentElement.getAttributeNS('urn:zuvi:office-studio', 'manualHiddenRows'),
      '2 3 5'
    );
    assert.equal(saved.row(2).getAttribute('hidden'), '1');
    assert.equal(saved.row(2).getAttribute('ht'), '32');
    assert.equal(saved.row(2).getAttribute('customHeight'), '1');
    assert.equal(saved.row(3).getAttribute('customHeight'), '0');
    document = await codec.importStudioExcel(source, 'Visibility.xlsx');
    const current = plain(document.sheets[0]);
    assert.deepEqual(current.hiddenRows, [2, 3, 5]);
    assert.deepEqual(current.hiddenColumns, ['A', 'B']);
    for (const [row, mode] of Object.entries(original.rowHeightModes))
      assert.equal(current.rowHeightModes[row], mode);
    assert.equal(current.rowHeights['2'], 32);
    assert.equal(current.columnWidths.B, original.columnWidths.B);
    assert.equal(current.cells.C2.input, '=SUM(A2:A4)');
  }
  document = sheets.studioSetRangeHidden(document, document.activeSheetId, selected, 'rows', false);
  assert.deepEqual(plain(document.sheets[0].hiddenRows), [5]);
  assert.deepEqual(
    [...sheets.studioHiddenRows(document.sheets[0], sheets.studioCalculate(document))].sort(),
    [2, 5]
  );
  document = sheets.studioSetRowsHidden(document, document.activeSheetId, []);
  document = sheets.studioSetColumnsHidden(document, document.activeSheetId, []);
  source = await codec.exportStudioExcel(document, source);
  document = await codec.importStudioExcel(source, 'Visibility.xlsx');
  assert.deepEqual(plain(document.sheets[0].hiddenRows), []);
  document = sheets.studioSetFilter(document, document.activeSheetId);
  assert.equal(
    sheets.studioHiddenRows(document.sheets[0], sheets.studioCalculate(document)).size,
    0
  );
  assert.equal(document.sheets[0].rowHeights['2'], 32);
  assert.equal(document.sheets[0].rowHeightModes['3'], 'auto');
});

test('external native unhiding overrides stale manual overlap metadata', async () => {
  let source = await fixture();
  let document = await codec.importStudioExcel(source, 'Visibility.xlsx');
  document = sheets.studioSetRowsHidden(document, document.activeSheetId, [2]);
  document = sheets.studioSetFilter(document, document.activeSheetId, {
    range: 'A1:A4',
    columns: { A: { operator: 'greater', value: '2' } },
  });
  source = await codec.exportStudioExcel(document, source);
  const { zip, xml, row } = await native(source);
  row(2).removeAttribute('hidden');
  xml.getElementsByTagNameNS(S, 'autoFilter')[0].remove();
  zip.file('xl/worksheets/sheet1.xml', new dom.window.XMLSerializer().serializeToString(xml));
  source = new Blob([await zip.generateAsync({ type: 'uint8array' })]);
  document = await codec.importStudioExcel(source, 'Visibility.xlsx');
  assert.deepEqual(plain(document.sheets[0].hiddenRows), []);
});

test('invalid manual row metadata refuses import without changing source bytes', async () => {
  const source = await fixture();
  const { zip, xml } = await native(source);
  xml.documentElement.setAttributeNS(
    'http://www.w3.org/2000/xmlns/',
    'xmlns:zuvi',
    'urn:zuvi:office-studio'
  );
  xml.documentElement.setAttributeNS('urn:zuvi:office-studio', 'zuvi:manualHiddenRows', '3 2');
  zip.file('xl/worksheets/sheet1.xml', new dom.window.XMLSerializer().serializeToString(xml));
  const invalid = new Blob([await zip.generateAsync({ type: 'uint8array' })]);
  const before = Buffer.from(await invalid.arrayBuffer());
  await assert.rejects(codec.importStudioExcel(invalid, 'Invalid.xlsx'), /手动隐藏行/);
  assert.deepEqual(Buffer.from(await invalid.arrayBuffer()), before);
});

test('legacy layout hydration migrates overlapping manual rows through native row insertion without mutating inputs', async () => {
  let source = await fixture();
  let document = await codec.importStudioExcel(source, 'Visibility.xlsx');
  document = sheets.studioSetRowsHidden(document, document.activeSheetId, [2, 5]);
  document = sheets.studioSetFilter(document, document.activeSheetId, {
    range: 'A1:A4',
    columns: { A: { operator: 'greater', value: '2' } },
  });
  source = await codec.exportStudioExcel(document, source);
  document = await codec.importStudioExcel(source, 'Visibility.xlsx');
  // An older saved workspace lacks the native layout fields, but retains its edit log.
  for (const key of ['defaultRowHeight', 'rowHeights', 'rowHeightModes', 'hiddenRows'])
    delete document.sheets[0][key];
  document = structure.studioChangeSheetStructure(document, document.activeSheetId, {
    axis: 'row',
    type: 'insert',
    index: 2,
    count: 1,
  });
  const originalModel = JSON.stringify(document);
  const originalBytes = Buffer.from(await source.arrayBuffer());
  const next = await codec.exportStudioExcel(document, source);
  assert.equal(JSON.stringify(document), originalModel);
  assert.deepEqual(Buffer.from(await source.arrayBuffer()), originalBytes);
  source = next;
  for (let pass = 0; pass < 2; pass++) {
    document = await codec.importStudioExcel(source, 'Migrated.xlsx');
    assert.deepEqual(plain(document.sheets[0].hiddenRows), [3, 6]);
    assert.equal(document.sheets[0].rowHeights['3'], 32);
    assert.equal(document.sheets[0].rowHeightModes['3'], 'fixed');
    assert.equal(document.sheets[0].rowHeightModes['4'], 'auto');
    assert.equal(document.sheets[0].cells.C3.input, '=SUM(A3:A5)');
    source = await codec.exportStudioExcel(document, source);
  }
});
