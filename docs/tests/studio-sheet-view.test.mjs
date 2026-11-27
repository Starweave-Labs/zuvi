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
const view = compiled('../../packages/ui/src/components/OfficeStudio/studio-sheet-view.ts');
const codec = compiled('../src/pages/collaboration/office-studio/studio-excel-codec.ts');
const prepare = compiled('../src/pages/collaboration/office-studio/studio-prepare.ts');
const print = compiled('../src/pages/collaboration/office-studio/studio-print.ts', {
  './studio-files': {
    exportStudioFile: async () => {
      throw new Error('PDF export is not used by this XLSX print test');
    },
  },
});
const S = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const primary =
  '<sheetView workbookViewId="0" zoomScale="10" zoomScaleNormal="175" showGridLines="false" showRowColHeaders="0" showZeros="false" rightToLeft="1" tabSelected="1" topLeftCell="D9" view="pageLayout" showOutlineSymbols="0" defaultGridColor="0"><pane state="frozen" xSplit="1" ySplit="2" topLeftCell="F8" activePane="bottomRight"/><selection pane="topLeft" activeCell="A1" sqref="A1"/><selection pane="bottomRight" activeCell="G9" sqref="G9:H10"/></sheetView>';
const secondary =
  '<sheetView workbookViewId="1" zoomScale="300" zoomScaleNormal="120" showGridLines="1" showRowColHeaders="false" rightToLeft="0" view="pageBreakPreview" topLeftCell="K15"><pane state="split" xSplit="120" ySplit="240" topLeftCell="K15" activePane="bottomRight"/><selection pane="bottomRight" activeCell="K15" sqref="K15:L16"/></sheetView>';
function plain(value) {
  return JSON.parse(JSON.stringify(value));
}
function xml(raw) {
  return new dom.window.DOMParser().parseFromString(raw, 'application/xml');
}
function attributes(node) {
  return Object.fromEntries(
    Array.from(node?.attributes ?? [], (attribute) => [attribute.name, attribute.value])
  );
}
function tree(node) {
  return {
    tag: node.localName,
    attributes: attributes(node),
    children: Array.from(node.children, tree),
    text: node.childElementCount ? '' : node.textContent,
  };
}
async function nativeViews(source, part = 'xl/worksheets/sheet1.xml') {
  const zip = await JSZip.loadAsync(await source.arrayBuffer());
  const sheet = xml(await zip.file(part).async('string'));
  return { zip, sheet, views: Array.from(sheet.getElementsByTagNameNS(S, 'sheetView')) };
}
async function sourceWithViews(fragment = `<sheetViews>${secondary}${primary}</sheetViews>`) {
  const workbook = new ExcelJS.Workbook();
  workbook.views = [
    { x: 0, y: 0, width: 1200, height: 800, activeTab: 0 },
    { x: 50, y: 50, width: 800, height: 600, activeTab: 1, firstSheet: 1 },
  ];
  const main = workbook.addWorksheet('Main');
  main.views = [{ state: 'normal' }];
  main.getColumn('A').width = 16;
  main.getColumn('B').hidden = true;
  main.getRow(4).hidden = true;
  main.getCell('A1').value = 'View heading';
  main.getCell('A1').font = { name: 'Arial', size: 24 };
  main.getCell('A1').alignment = { textRotation: 45, horizontal: 'right', indent: 1 };
  main.getCell('A1').border = { right: { style: 'double', color: { argb: 'FF123456' } } };
  main.getCell('A3').value = 7;
  main.getCell('A4').value = 'Hidden row';
  main.getCell('C2').value = { formula: 'A3*2', result: 14 };
  main.mergeCells('D6:F6');
  main.getCell('D6').value = 'Merged';
  main.getCell('D3').value = { text: 'Native link', hyperlink: 'https://example.com/sheet-view' };
  main.pageSetup = {
    orientation: 'landscape',
    scale: 83,
    showGridLines: true,
    showRowColHeaders: true,
    printArea: 'A1:F6',
  };
  workbook.addWorksheet('Other').getCell('A1').value = 'Other view';
  const zip = await JSZip.loadAsync(Buffer.from(await workbook.xlsx.writeBuffer()));
  const raw = await zip.file('xl/worksheets/sheet1.xml').async('string');
  zip.file(
    'xl/worksheets/sheet1.xml',
    raw.replace(/<sheetViews\b[^>]*>[\s\S]*?<\/sheetViews>/, fragment)
  );
  return new Blob([await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' })], {
    type: mime,
  });
}

const sourceTree = tree(
  xml(`<sheetViews xmlns="${S}">${secondary}${primary}</sheetViews>`).documentElement
);
test('primary view editing retains all other native window attributes, pane positions and selections over two real XLSX saves', async () => {
  let source = await sourceWithViews();
  let document = await codec.importStudioExcel(source, 'View.xlsx');
  const id = document.sheets[0].id;
  assert.deepEqual(plain(document.sheets[0].view), {
    zoom: 10,
    showGridLines: false,
    showRowColHeaders: false,
  });
  assert.deepEqual(plain(document.sheets[0].freeze), { rows: 2, columns: 1 });
  const originalCells = document.sheets[0].cells;
  document = view.studioSetSheetView(document, id, {
    zoom: 400,
    showGridLines: true,
    showRowColHeaders: true,
  });
  assert.equal(document.sheets[0].cells, originalCells);
  document = sheets.studioPatchCells(document, id, { A3: { input: '9' } });
  for (let pass = 0; pass < 2; pass++) {
    source = await codec.exportStudioExcel(document, source);
    const saved = await nativeViews(source);
    assert.equal(saved.views.length, 2);
    assert.deepEqual(tree(saved.views[0]), sourceTree.children[0]);
    const primaryView = saved.views[1];
    const expected = {
      ...sourceTree.children[1].attributes,
      zoomScale: '400',
      showGridLines: '1',
      showRowColHeaders: '1',
    };
    assert.deepEqual(attributes(primaryView), expected);
    assert.deepEqual(Array.from(primaryView.children, tree), sourceTree.children[1].children);
    const native = new ExcelJS.Workbook();
    await native.xlsx.load(await source.arrayBuffer());
    assert.equal(native.getWorksheet('Main').getCell('A3').value, 9);
    assert.equal(native.getWorksheet('Main').getCell('C2').value.result, 18);
    assert.equal(native.getWorksheet('Main').getColumn('B').hidden, true);
    assert.equal(native.getWorksheet('Main').getRow(4).hidden, true);
    assert.deepEqual(native.getWorksheet('Main').model.merges, ['D6:F6']);
    assert.equal(native.getWorksheet('Main').getCell('A1').alignment.textRotation, 45);
    assert.equal(native.getWorksheet('Main').pageSetup.scale, 83);
    assert.equal(native.getWorksheet('Main').pageSetup.showGridLines, true);
    assert.equal(native.getWorksheet('Main').pageSetup.showRowColHeaders, true);
    assert.equal(native.views[0].activeTab, 0);
    assert.equal(native.views[1].activeTab, 1);
    assert.equal(native.views[1].firstSheet, 1);
    document = await codec.importStudioExcel(source, 'View.xlsx');
    assert.deepEqual(plain(document.sheets[0].view), {
      zoom: 400,
      showGridLines: true,
      showRowColHeaders: true,
    });
    assert.deepEqual(plain(document.sheets[0].freeze), { rows: 2, columns: 1 });
  }
});

test('secondary workbook windows retain their own tab identities after unrelated view edits, primary navigation and sheet deletion', async () => {
  const source = await sourceWithViews();
  const original = await codec.importStudioExcel(source, 'Windows.xlsx');
  const main = original.sheets[0],
    other = original.sheets[1];
  const edited = view.studioSetSheetView(original, main.id, { zoom: 25 });
  const navigated = { ...edited, activeSheetId: other.id };
  let current = navigated,
    bytes = source;
  for (let pass = 0; pass < 2; pass++) {
    bytes = await codec.exportStudioExcel(current, bytes);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await bytes.arrayBuffer());
    assert.equal(workbook.views[0].activeTab, 1);
    assert.equal(workbook.views[1].activeTab, 1);
    assert.equal(workbook.views[1].firstSheet, 1);
    assert.equal(workbook.worksheets[workbook.views[1].activeTab].name, 'Other');
    current = await codec.importStudioExcel(bytes, 'Windows.xlsx');
  }
  current = sheets.studioDeleteSheet(navigated, main.id);
  bytes = await codec.exportStudioExcel(current, source);
  let saved = new ExcelJS.Workbook();
  await saved.xlsx.load(await bytes.arrayBuffer());
  assert.deepEqual(
    saved.worksheets.map((sheet) => sheet.name),
    ['Other']
  );
  assert.equal(saved.views[0].activeTab, 0);
  assert.equal(saved.views[1].activeTab, 0);
  assert.equal(saved.views[1].firstSheet, 0);
  assert.equal(saved.worksheets[saved.views[1].activeTab].name, 'Other');

  // Removing the secondary window's active sheet frees id 2 for a new sheet.
  // Its tab must fall back to Main, rather than silently point to the replacement.
  const deleted = sheets.studioDeleteSheet(edited, other.id);
  const replacement = {
    ...deleted,
    sheets: [
      ...deleted.sheets,
      {
        id: 'replacement',
        name: 'Replacement',
        rowCount: 5,
        columnCount: 3,
        cells: { A1: { input: 'New worksheet' } },
      },
    ],
  };
  bytes = await codec.exportStudioExcel(replacement, source);
  saved = new ExcelJS.Workbook();
  await saved.xlsx.load(await bytes.arrayBuffer());
  assert.deepEqual(
    saved.worksheets.map((sheet) => sheet.name),
    ['Main', 'Replacement']
  );
  assert.equal(saved.getWorksheet('Replacement').id, 2);
  assert.equal(saved.views[1].activeTab, 0);
  assert.equal(saved.views[1].firstSheet, 0);
  assert.equal(saved.worksheets[saved.views[1].activeTab].name, 'Main');
  const reopened = await codec.importStudioExcel(bytes, 'Replacement.xlsx');
  bytes = await codec.exportStudioExcel(reopened, bytes);
  saved = new ExcelJS.Workbook();
  await saved.xlsx.load(await bytes.arrayBuffer());
  assert.equal(saved.views[1].activeTab, 0);
  assert.equal(saved.worksheets[saved.views[1].activeTab].name, 'Main');
  const renamed = sheets.studioRenameSheet(edited, other.id, 'Renamed Other');
  bytes = await codec.exportStudioExcel(renamed, source);
  saved = new ExcelJS.Workbook();
  await saved.xlsx.load(await bytes.arrayBuffer());
  assert.equal(saved.views[1].activeTab, 1);
  assert.equal(saved.worksheets[saved.views[1].activeTab].name, 'Renamed Other');

  const zip = await JSZip.loadAsync(await source.arrayBuffer());
  const bookXml = xml(await zip.file('xl/workbook.xml').async('string'));
  const secondaryWindow = bookXml.getElementsByTagNameNS(S, 'workbookView')[1];
  secondaryWindow.setAttribute('activeTab', '999');
  secondaryWindow.setAttribute('firstSheet', '999');
  zip.file('xl/workbook.xml', new dom.window.XMLSerializer().serializeToString(bookXml));
  const invalidSource = new Blob([await zip.generateAsync({ type: 'uint8array' })], { type: mime });
  const invalid = await codec.importStudioExcel(invalidSource, 'Invalid window.xlsx');
  bytes = await codec.exportStudioExcel(
    { ...invalid, activeSheetId: invalid.sheets[1].id },
    invalidSource
  );
  saved = new ExcelJS.Workbook();
  await saved.xlsx.load(await bytes.arrayBuffer());
  assert.equal(saved.views[1].activeTab, 1);
  assert.equal(saved.views[1].firstSheet, 0);
  assert.equal(saved.worksheets[saved.views[1].activeTab].name, 'Other');
});

test('unchanged native 10% zoom, Boolean lexical values and omitted default view properties survive edit and repeated reopen', async () => {
  for (const fragment of [
    `<sheetViews>${primary.replace('zoomScale="10"', 'zoomScale="+010"')}</sheetViews>`,
    '<sheetViews><sheetView workbookViewId="0" zoomScaleNormal="90" showZeros="false"><selection activeCell="C2" sqref="C2:D3"/></sheetView></sheetViews>',
    '',
  ]) {
    let source = await sourceWithViews(fragment);
    let document = await codec.importStudioExcel(source, 'Defaults.xlsx');
    const initialViews = (await nativeViews(source)).views.map(tree);
    document = sheets.studioPatchCells(document, document.sheets[0].id, { A3: { input: '8' } });
    for (let pass = 0; pass < 2; pass++) {
      source = await codec.exportStudioExcel(document, source);
      assert.deepEqual((await nativeViews(source)).views.map(tree), initialViews);
      document = await codec.importStudioExcel(source, 'Defaults.xlsx');
      assert.equal(document.sheets[0].view.zoom, fragment.includes('+010') ? 10 : 100);
    }
  }
});

test('freeze change and cancellation only replace the primary pane, preserving other native views through two reopens', async () => {
  let source = await sourceWithViews();
  let document = await codec.importStudioExcel(source, 'Freeze.xlsx');
  const secondaryTree = (await nativeViews(source)).views[0];
  const expectedSecondary = tree(secondaryTree);
  document = view.studioSetSheetView(document, document.sheets[0].id, { zoom: 25 });
  document = sheets.studioSetFreeze(document, document.sheets[0].id, 4, 3);
  for (let pass = 0; pass < 2; pass++) {
    source = await codec.exportStudioExcel(document, source);
    const saved = await nativeViews(source);
    assert.deepEqual(tree(saved.views[0]), expectedSecondary);
    const primaryView = saved.views[1];
    assert.equal(primaryView.getAttribute('zoomScale'), '25');
    assert.equal(primaryView.getAttribute('zoomScaleNormal'), '175');
    assert.deepEqual(attributes(primaryView.querySelector('pane')), {
      state: 'frozen',
      xSplit: '3',
      ySplit: '4',
      topLeftCell: 'D5',
      activePane: 'bottomRight',
    });
    assert.deepEqual(attributes(primaryView.querySelector('selection')), {
      pane: 'bottomRight',
      activeCell: 'D5',
      sqref: 'D5',
    });
    document = await codec.importStudioExcel(source, 'Freeze.xlsx');
    assert.deepEqual(plain(document.sheets[0].freeze), { rows: 4, columns: 3 });
  }
  document = sheets.studioSetFreeze(document, document.sheets[0].id, 0, 0);
  source = await codec.exportStudioExcel(document, source);
  const saved = await nativeViews(source);
  assert.deepEqual(tree(saved.views[0]), expectedSecondary);
  assert.equal(saved.views[1].querySelector('pane'), null);
  assert.equal(saved.views[1].querySelector('selection[pane]'), null);
  assert.equal(saved.views[1].getAttribute('zoomScale'), '25');
  const reopened = await codec.importStudioExcel(source, 'Freeze.xlsx');
  assert.equal(reopened.sheets[0].freeze, undefined);
});

test('native view only hydration restores an older complete workspace without replacing its edited values or changing the source bytes', async () => {
  const source = await sourceWithViews();
  const sourceBytes = Buffer.from(await source.arrayBuffer());
  const imported = await codec.importStudioExcel(source, 'Legacy.xlsx');
  const legacy = sheets.studioPatchCells(imported, imported.sheets[0].id, { A3: { input: '19' } });
  delete legacy.sheets[0].view;
  const record = {
    id: legacy.id,
    document: legacy,
    source,
    revision: 1,
    createdAt: 1,
    updatedAt: 1,
  };
  const hydrated = await prepare.prepareStudioFile(record);
  assert.deepEqual(plain(hydrated.sheets[0].view), {
    zoom: 10,
    showGridLines: false,
    showRowColHeaders: false,
  });
  assert.equal(hydrated.sheets[0].cells.A3.input, '19');
  assert.equal(hydrated.sheets[0].cells, legacy.sheets[0].cells);
  assert.equal(legacy.sheets[0].view, undefined);
  assert.equal(record.document, legacy);
  assert.deepEqual(Buffer.from(await source.arrayBuffer()), sourceBytes);
  assert.equal(await prepare.prepareStudioFile({ ...record, document: hydrated }), hydrated);
  await assert.rejects(
    prepare.prepareStudioFile({
      ...record,
      source: new Blob(['wrong type'], { type: 'application/pdf' }),
    }),
    /源文件类型不匹配/
  );
  const saved = await codec.exportStudioExcel(legacy, source);
  assert.equal((await codec.importStudioExcel(saved, 'Legacy.xlsx')).sheets[0].view.zoom, 10);
});

test('source fallback window is used when workbook view zero is absent and a split primary remains explicitly unsupported', async () => {
  const fallback = await sourceWithViews(
    '<sheetViews><sheetView workbookViewId="1" zoomScale="24" showGridLines="0" showRowColHeaders="true"/></sheetViews>'
  );
  const document = await codec.importStudioExcel(fallback, 'Fallback.xlsx');
  assert.deepEqual(plain(document.sheets[0].view), {
    zoom: 24,
    showGridLines: false,
    showRowColHeaders: true,
  });
  const saved = await codec.exportStudioExcel(document, fallback);
  assert.equal((await nativeViews(saved)).views[0].getAttribute('zoomScale'), '24');
  const split = await sourceWithViews(
    `<sheetViews>${secondary.replace('workbookViewId="1"', 'workbookViewId="0"')}</sheetViews>`
  );
  await assert.rejects(codec.importStudioExcel(split, 'Split.xlsx'), /暂不支持拆分窗格/);
});

test('malformed primary zoom or booleans reject native import without changing original bytes and invalid model values reject export', async () => {
  for (const attributes of [
    'zoomScale="9"',
    'zoomScale="401"',
    'zoomScale="100.0"',
    'showGridLines="yes"',
    'showRowColHeaders="TRUE"',
  ]) {
    const source = await sourceWithViews(
      `<sheetViews><sheetView workbookViewId="0" ${attributes}/></sheetViews>`
    );
    const before = Buffer.from(await source.arrayBuffer());
    await assert.rejects(codec.importStudioExcel(source, 'Invalid.xlsx'), /缩放比例|视图显示属性/);
    assert.deepEqual(Buffer.from(await source.arrayBuffer()), before);
  }
  const source = await sourceWithViews();
  const document = await codec.importStudioExcel(source, 'Invalid model.xlsx');
  document.sheets[0].view.showGridLines = 'false';
  await assert.rejects(codec.exportStudioExcel(document, source), /工作簿|单元格/);
});

test('new workbooks save view properties in native sheetView and preserve document print scale, grid and heading policy', async () => {
  let document = models.createOfficeStudioDocument('excel');
  const id = document.sheets[0].id;
  document = sheets.studioPatchCells(document, id, {
    A1: { input: 'Printed content', fontSize: 24, wrap: true },
  });
  const initialPrint = print.createStudioPrintHtml(document);
  const cellModel = document.sheets[0].cells;
  document = view.studioSetSheetView(document, id, {
    zoom: 400,
    showGridLines: false,
    showRowColHeaders: false,
  });
  assert.equal(print.createStudioPrintHtml(document), initialPrint);
  assert.equal(document.sheets[0].cells, cellModel);
  let source;
  for (let pass = 0; pass < 2; pass++) {
    source = await codec.exportStudioExcel(document, source);
    const { views } = await nativeViews(source);
    assert.equal(views[0].getAttribute('zoomScale'), '400');
    assert.equal(views[0].getAttribute('showGridLines'), '0');
    assert.equal(views[0].getAttribute('showRowColHeaders'), '0');
    document = await codec.importStudioExcel(source, 'New.xlsx');
    assert.deepEqual(plain(document.sheets[0].view), {
      zoom: 400,
      showGridLines: false,
      showRowColHeaders: false,
    });
  }
});
