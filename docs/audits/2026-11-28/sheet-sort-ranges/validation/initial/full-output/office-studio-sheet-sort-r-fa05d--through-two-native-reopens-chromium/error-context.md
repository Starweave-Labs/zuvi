# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-sheet-sort-ranges.spec.ts >> sorting preserves complete external ranges, calculated values and history through two native reopens
- Location: e2e/office-studio-sheet-sort-ranges.spec.ts:9:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('gridcell', { name: 'A2', exact: true })
Expected substring: "A"
Received string:    "Z"
Timeout: 5000ms

Call log:
  - Expect "toContainText" getByRole('gridcell', { name: 'A2', exact: true }) with timeout 5000ms
  - waiting for getByRole('gridcell', { name: 'A2', exact: true })
    14 × locator resolved to <div title="Z" id="_r_o_-A2" role="gridcell" aria-label="A2" aria-colindex="2" aria-selected="true" data-selected="true" class="zuvi-studio-sheet-cell">…</div>
       - unexpected value "Z"

```

```yaml
- gridcell "A2" [selected]: Z
```

# Test source

```ts
  1   | import { expect, test } from '@playwright/test';
  2   | import { mkdir, readFile, writeFile } from 'node:fs/promises';
  3   | import path from 'node:path';
  4   | import ExcelJS from '../docs/node_modules/exceljs/excel.js';
  5   | import JSZip from '../docs/node_modules/jszip/lib/index.js';
  6   | 
  7   | const audit = path.resolve('.release/office-continuation/sort-range-fix/browser');
  8   | const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  9   | test('sorting preserves complete external ranges, calculated values and history through two native reopens', async ({
  10  |   page,
  11  | }) => {
  12  |   test.setTimeout(60000);
  13  |   await mkdir(audit, { recursive: true });
  14  |   const book = new ExcelJS.Workbook(),
  15  |     sheet = book.addWorksheet('Sort Data');
  16  |   const other = book.addWorksheet('Other'),
  17  |     quoted = book.addWorksheet('Other quoted');
  18  |   sheet.addRow(['Key', 'Amount', 'External', 'Quoted', 'Outside']);
  19  |   for (const [row, label, amount] of [
  20  |     [2, 'Z', 10],
  21  |     [3, 'Y', 20],
  22  |     [4, 'A', 30],
  23  |   ] as const) {
  24  |     sheet.getCell('A' + row).value = label;
  25  |     sheet.getCell('B' + row).value = amount;
  26  |     const value = 3 * 10 ** (row - 2);
  27  |     sheet.getCell('C' + row).value = {
  28  |       formula: 'SUM(Other!A' + row + ':B' + row + ')',
  29  |       result: value,
  30  |     };
  31  |     sheet.getCell('D' + row).value = {
  32  |       formula: "SUM('Other quoted'!$A" + row + ':B$' + row + ')',
  33  |       result: value,
  34  |     };
  35  |     sheet.getCell('E' + row).value = 'Outside ' + row;
  36  |     for (const target of [other, quoted]) {
  37  |       target.getCell('A' + row).value = 10 ** (row - 2);
  38  |       target.getCell('B' + row).value = 2 * 10 ** (row - 2);
  39  |     }
  40  |   }
  41  |   const source = Buffer.from(await book.xlsx.writeBuffer());
  42  |   await writeFile(path.join(audit, 'source.xlsx'), source);
  43  |   const load = async (bytes: Buffer, name: string) => {
  44  |     await page
  45  |       .getByLabel('导入文档文件', { exact: true })
  46  |       .setInputFiles({ name, mimeType, buffer: bytes });
  47  |     await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(name);
  48  |     await expect(page.getByRole('grid')).toBeVisible();
  49  |   };
  50  |   const range = async (value: string) => {
  51  |     const field = page.getByLabel('单元格地址', { exact: true });
  52  |     await field.fill(value);
  53  |     await field.press('Enter');
  54  |   };
  55  |   const cell = (address: string) => page.getByRole('gridcell', { name: address, exact: true });
  56  |   await page.goto('/#/components/office-studio');
  57  |   await load(source, 'Sort ranges.xlsx');
  58  |   await range('D4:A1');
  59  |   await page.getByRole('tab', { name: '数据', exact: true }).click();
  60  |   await page.getByRole('button', { name: '升序排序', exact: true }).click();
> 61  |   await expect(cell('A2')).toContainText('A');
      |                            ^ Error: expect(locator).toContainText(expected) failed
  62  |   await expect(cell('C2')).toContainText('300');
  63  |   await expect(cell('C4')).toContainText('3');
  64  |   await page.getByRole('tab', { name: '开始', exact: true }).click();
  65  |   await page.getByRole('button', { name: '撤销表格修改', exact: true }).click();
  66  |   await expect(cell('A2')).toContainText('Z');
  67  |   await expect(cell('C2')).toContainText('3');
  68  |   await page.getByRole('button', { name: '重做表格修改', exact: true }).click();
  69  |   await expect(cell('C2')).toContainText('300');
  70  |   for (let pass = 1; pass <= 2; pass++) {
  71  |     const pending = page.waitForEvent('download');
  72  |     await page.getByRole('button', { name: '导出文件', exact: true }).click();
  73  |     const bytes = await readFile((await (await pending).path())!);
  74  |     await writeFile(path.join(audit, 'roundtrip-' + pass + '.xlsx'), bytes);
  75  |     const saved = new ExcelJS.Workbook();
  76  |     await saved.xlsx.load(bytes);
  77  |     const native = saved.getWorksheet('Sort Data')!;
  78  |     const zip = await JSZip.loadAsync(bytes);
  79  |     const xml = await zip.file('xl/worksheets/sheet1.xml')!.async('string');
  80  |     const nativeCells = await page.evaluate((xml) => {
  81  |       const parsed = new DOMParser().parseFromString(xml, 'application/xml');
  82  |       const ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  83  |       return Object.fromEntries(
  84  |         Array.from(parsed.getElementsByTagNameNS(ns, 'c')).map((entry) => [
  85  |           entry.getAttribute('r'),
  86  |           {
  87  |             formula: entry.getElementsByTagNameNS(ns, 'f')[0]?.textContent,
  88  |             value: entry.getElementsByTagNameNS(ns, 'v')[0]?.textContent,
  89  |           },
  90  |         ])
  91  |       );
  92  |     }, xml);
  93  |     for (const [sourceRow, targetRow, value] of [
  94  |       [4, 2, 300],
  95  |       [3, 3, 30],
  96  |       [2, 4, 3],
  97  |     ]) {
  98  |       const formulas = {
  99  |         C: 'SUM(Other!A' + sourceRow + ':B' + sourceRow + ')',
  100 |         D: "SUM('Other quoted'!$A" + sourceRow + ':B$' + sourceRow + ')',
  101 |       };
  102 |       for (const column of ['C', 'D'] as const) {
  103 |         expect(native.getCell(column + targetRow).value).toEqual({
  104 |           formula: formulas[column],
  105 |           result: value,
  106 |         });
  107 |         expect(nativeCells[column + targetRow]).toEqual({
  108 |           formula: formulas[column],
  109 |           value: String(value),
  110 |         });
  111 |       }
  112 |       expect(native.getCell('E' + targetRow).value).toBe('Outside ' + targetRow);
  113 |     }
  114 |     expect(saved.getWorksheet('Other')!.getCell('B4').value).toBe(200);
  115 |     await load(bytes, 'Sort reopened ' + pass + '.xlsx');
  116 |     await expect(cell('C2')).toContainText('300');
  117 |     await expect(cell('D4')).toContainText('3');
  118 |   }
  119 | });
  120 | 
```