import { expect, test } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import ExcelJS from '../docs/node_modules/exceljs/excel.js';
import JSZip from '../docs/node_modules/jszip/lib/index.js';

const audit = path.resolve('.release/office-continuation/sort-range-fix/browser');
const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
test('sorting preserves complete external ranges, calculated values and history through two native reopens', async ({
  page,
}) => {
  test.setTimeout(60000);
  await mkdir(audit, { recursive: true });
  const book = new ExcelJS.Workbook(),
    sheet = book.addWorksheet('Sort Data');
  const other = book.addWorksheet('Other'),
    quoted = book.addWorksheet('Other quoted');
  sheet.addRow(['Key', 'Amount', 'External', 'Quoted', 'Outside']);
  for (const [row, label, amount] of [
    [2, 'Z', 10],
    [3, 'Y', 20],
    [4, 'A', 30],
  ] as const) {
    sheet.getCell('A' + row).value = label;
    sheet.getCell('B' + row).value = amount;
    const value = 3 * 10 ** (row - 2);
    sheet.getCell('C' + row).value = {
      formula: 'SUM(Other!A' + row + ':B' + row + ')',
      result: value,
    };
    sheet.getCell('D' + row).value = {
      formula: "SUM('Other quoted'!$A" + row + ':B$' + row + ')',
      result: value,
    };
    sheet.getCell('E' + row).value = 'Outside ' + row;
    for (const target of [other, quoted]) {
      target.getCell('A' + row).value = 10 ** (row - 2);
      target.getCell('B' + row).value = 2 * 10 ** (row - 2);
    }
  }
  const source = Buffer.from(await book.xlsx.writeBuffer());
  await writeFile(path.join(audit, 'source.xlsx'), source);
  const load = async (bytes: Buffer, name: string) => {
    await page
      .getByLabel('导入文档文件', { exact: true })
      .setInputFiles({ name, mimeType, buffer: bytes });
    await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(name);
    await expect(page.getByRole('grid')).toBeVisible();
  };
  const range = async (value: string) => {
    const field = page.getByLabel('单元格地址', { exact: true });
    await field.fill(value);
    await field.press('Enter');
  };
  const cell = (address: string) => page.getByRole('gridcell', { name: address, exact: true });
  await page.goto('/#/components/office-studio');
  await load(source, 'Sort ranges.xlsx');
  await range('D4');
  const grid = page.getByRole('grid');
  await grid.press('Shift+Home');
  for (let step = 0; step < 3; step++) await grid.press('Shift+ArrowUp');
  await expect(cell('A1')).toHaveAttribute('data-active', 'true');
  await expect(cell('D4')).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: '数据', exact: true }).click();
  await page.getByRole('button', { name: '升序排序', exact: true }).click();
  await expect(cell('A2')).toContainText('A');
  await expect(cell('C2')).toContainText('300');
  await expect(cell('C4')).toContainText('3');
  await page.getByRole('tab', { name: '开始', exact: true }).click();
  await page.getByRole('button', { name: '撤销表格修改', exact: true }).click();
  await expect(cell('A2')).toContainText('Z');
  await expect(cell('C2')).toContainText('3');
  await page.getByRole('button', { name: '重做表格修改', exact: true }).click();
  await expect(cell('C2')).toContainText('300');
  for (let pass = 1; pass <= 2; pass++) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await pending).path())!);
    await writeFile(path.join(audit, 'roundtrip-' + pass + '.xlsx'), bytes);
    const saved = new ExcelJS.Workbook();
    await saved.xlsx.load(bytes);
    const native = saved.getWorksheet('Sort Data')!;
    const zip = await JSZip.loadAsync(bytes);
    const xml = await zip.file('xl/worksheets/sheet1.xml')!.async('string');
    const nativeCells = await page.evaluate((xml) => {
      const parsed = new DOMParser().parseFromString(xml, 'application/xml');
      const ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
      return Object.fromEntries(
        Array.from(parsed.getElementsByTagNameNS(ns, 'c')).map((entry) => [
          entry.getAttribute('r'),
          {
            formula: entry.getElementsByTagNameNS(ns, 'f')[0]?.textContent,
            value: entry.getElementsByTagNameNS(ns, 'v')[0]?.textContent,
          },
        ])
      );
    }, xml);
    for (const [sourceRow, targetRow, value] of [
      [4, 2, 300],
      [3, 3, 30],
      [2, 4, 3],
    ]) {
      const formulas = {
        C: 'SUM(Other!A' + sourceRow + ':B' + sourceRow + ')',
        D: "SUM('Other quoted'!$A" + sourceRow + ':B$' + sourceRow + ')',
      };
      for (const column of ['C', 'D'] as const) {
        expect(native.getCell(column + targetRow).value).toEqual({
          formula: formulas[column],
          result: value,
        });
        expect(nativeCells[column + targetRow]).toEqual({
          formula: formulas[column],
          value: String(value),
        });
      }
      expect(native.getCell('E' + targetRow).value).toBe('Outside ' + targetRow);
    }
    expect(saved.getWorksheet('Other')!.getCell('B4').value).toBe(200);
    await load(bytes, 'Sort reopened ' + pass + '.xlsx');
    await expect(cell('C2')).toContainText('300');
    await expect(cell('D4')).toContainText('3');
  }
});
