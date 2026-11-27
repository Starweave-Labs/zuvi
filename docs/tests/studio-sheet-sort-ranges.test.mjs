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
const codec = compiled('../src/pages/collaboration/office-studio/studio-excel-codec.ts');
const S = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const selection = (first, last = first) => ({
  anchor: sheets.studioParseAddress(first),
  focus: sheets.studioParseAddress(last),
});

async function fixture() {
  const book = new ExcelJS.Workbook(),
    main = book.addWorksheet('Sort Data');
  const foreign = book.addWorksheet('Other'),
    quoted = book.addWorksheet('Other quoted');
  main.getCell('A1').value = 'Key';
  main.getCell('B1').value = 'Amount';
  main.getCell('C1').value = 'External';
  main.getCell('D1').value = 'Quoted';
  main.getCell('E2').value = 'outside';
  for (const [row, key, amount] of [
    [2, 'Z', 10],
    [3, 'Y', 20],
    [4, 'A', 30],
  ]) {
    const value = 3 * 10 ** (row - 2);
    main.getCell(`A${row}`).value = key;
    main.getCell(`B${row}`).value = amount;
    main.getCell(`C${row}`).value = { formula: `SUM(Other!A${row}:B${row})`, result: value };
    main.getCell(`D${row}`).value = {
      formula: `SUM('Other quoted'!$A${row}:B$${row})`,
      result: value,
    };
    for (const sheet of [foreign, quoted]) {
      sheet.getCell(`A${row}`).value = 10 ** (row - 2);
      sheet.getCell(`B${row}`).value = 2 * 10 ** (row - 2);
    }
  }
  return new Blob([await book.xlsx.writeBuffer()]);
}

test('native sorting retains external and quoted A1 range qualifiers with original values and XML caches through two reopens', async () => {
  let source = await fixture(),
    document = await codec.importStudioExcel(source, 'Sort-ranges.xlsx');
  const id = document.activeSheetId,
    originalDocument = document,
    before = JSON.stringify(document),
    originalBytes = Buffer.from(await source.arrayBuffer());
  document = sheets.studioSortRangeByKeys(
    document,
    id,
    selection('A1', 'D4'),
    [{ column: 1, direction: 'asc' }],
    true
  );
  assert.deepEqual(Buffer.from(await source.arrayBuffer()), originalBytes);
  assert.equal(JSON.stringify(originalDocument), before);
  for (let pass = 0; pass < 2; pass++) {
    const unchanged = JSON.stringify(document);
    source = await codec.exportStudioExcel(document, source);
    assert.equal(JSON.stringify(document), unchanged);
    const book = new ExcelJS.Workbook();
    await book.xlsx.load(await source.arrayBuffer());
    const main = book.getWorksheet('Sort Data'),
      zip = await JSZip.loadAsync(await source.arrayBuffer());
    const xml = new dom.window.DOMParser().parseFromString(
      await zip.file('xl/worksheets/sheet1.xml').async('string'),
      'application/xml'
    );
    const cell = (address) =>
      Array.from(xml.getElementsByTagNameNS(S, 'c')).find(
        (node) => node.getAttribute('r') === address
      );
    assert.deepEqual(
      [2, 3, 4].map((row) => main.getCell(`A${row}`).value),
      ['A', 'Y', 'Z']
    );
    for (const [sourceRow, targetRow, value] of [
      [4, 2, 300],
      [3, 3, 30],
      [2, 4, 3],
    ]) {
      const formulas = {
        C: `SUM(Other!A${sourceRow}:B${sourceRow})`,
        D: `SUM('Other quoted'!$A${sourceRow}:B$${sourceRow})`,
      };
      for (const column of ['C', 'D']) {
        const address = `${column}${targetRow}`;
        assert.equal(main.getCell(address).formula, formulas[column]);
        assert.equal(main.getCell(address).result, value);
        assert.equal(cell(address).getElementsByTagNameNS(S, 'f')[0].textContent, formulas[column]);
        assert.equal(Number(cell(address).getElementsByTagNameNS(S, 'v')[0].textContent), value);
      }
    }
    assert.equal(main.getCell('E2').value, 'outside');
    for (const name of ['Other', 'Other quoted'])
      assert.equal(book.getWorksheet(name).getCell('B4').value, 200);
    document = await codec.importStudioExcel(source, 'Sort-ranges-reopened.xlsx');
    const calculation = sheets.studioCalculate(document);
    assert.equal(calculation.values.get(`${id}:C2`), 300);
    assert.equal(calculation.values.get(`${id}:D4`), 3);
  }
});

test('unsafe current-sheet sort ranges reject without changing the imported model or original XLSX', async () => {
  const source = await fixture(),
    original = await codec.importStudioExcel(source, 'Sort-reject.xlsx'),
    originalBytes = Buffer.from(await source.arrayBuffer());
  for (const formula of ["=SUM('Sort Data'!B2:B4)", "=SUM('Sort Data'!B4:B5)", '=SUM(B4:E4)']) {
    const document = JSON.parse(JSON.stringify(original));
    document.sheets[0].cells.C4 = { input: formula };
    const before = JSON.stringify(document);
    assert.throws(() =>
      sheets.studioSortRangeByKeys(
        document,
        document.activeSheetId,
        selection('A1', 'D4'),
        [{ column: 1, direction: 'asc' }],
        true
      )
    );
    assert.equal(JSON.stringify(document), before);
    assert.deepEqual(Buffer.from(await source.arrayBuffer()), originalBytes);
  }
});
