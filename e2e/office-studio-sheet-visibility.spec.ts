import { expect, test, type Page } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import ExcelJS from '../docs/node_modules/exceljs/excel.js';
import JSZip from '../docs/node_modules/jszip/lib/index.js';

const audit = path.resolve('.release/office-continuation/x030/browser');
const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
async function fixture() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Visibility');
  for (const col of ['A', 'B', 'C', 'D', 'E', 'F']) sheet.getColumn(col).width = 16;
  sheet.getColumn('B').width = 20;
  sheet.getColumn('C').width = 24;
  sheet.getColumn('B').hidden = true;
  sheet.getCell('A1').value = 'Value';
  for (const row of [2, 3, 4]) sheet.getCell(`A${row}`).value = row;
  sheet.getCell('E4').value = { formula: 'SUM(A2:A4)', result: 9 };
  sheet.getCell('A6').value = 'Manual source row';
  sheet.getRow(2).height = 32;
  sheet.getRow(3).height = 40;
  sheet.getRow(6).height = 26;
  sheet.getRow(2).hidden = true;
  sheet.getRow(6).hidden = true;
  sheet.autoFilter = 'A1:A4';
  const zip = await JSZip.loadAsync(Buffer.from(await workbook.xlsx.writeBuffer()));
  const part = 'xl/worksheets/sheet1.xml';
  let xml = await zip.file(part)!.async('string');
  xml = xml.replace(/(<row\b[^>]*\br="3"[^>]*)customHeight="1"/, '$1customHeight="0"');
  xml = xml.replace(
    /<autoFilter\b[^>]*\/>/,
    '<autoFilter ref="A1:A4"><filterColumn colId="0"><customFilters><customFilter operator="greaterThan" val="2"/></customFilters></filterColumn></autoFilter>'
  );
  zip.file(part, xml);
  return zip.generateAsync({ type: 'nodebuffer' });
}
async function importFile(page: Page, buffer: Buffer, name: string) {
  await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({ name, mimeType, buffer });
  await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(name);
  await expect(page.getByRole('grid')).toBeVisible();
}
async function range(page: Page, value: string) {
  const field = page.getByLabel('单元格地址', { exact: true });
  await field.fill(value);
  await field.press('Enter');
}
async function exportFile(page: Page, name: string) {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出文件', exact: true }).click();
  const bytes = await readFile((await (await pending).path())!);
  await writeFile(path.join(audit, name), bytes);
  return bytes;
}
async function checkNative(bytes: Buffer, hidden: boolean) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes);
  const sheet = workbook.getWorksheet('Visibility')!;
  expect(sheet.getRow(2).height).toBe(32);
  expect(sheet.getRow(6).height).toBe(26);
  for (const row of [2, 3, 6]) expect(Boolean(sheet.getRow(row).hidden)).toBe(hidden);
  for (const col of ['B', 'C']) expect(Boolean(sheet.getColumn(col).hidden)).toBe(hidden);
  expect(sheet.getColumn('B').width).toBe(20);
  expect(sheet.getColumn('C').width).toBe(24);
  expect(sheet.getCell('E4').value).toEqual({ formula: 'SUM(A2:A4)', result: 9 });
  const zip = await JSZip.loadAsync(bytes);
  const xml = await zip.file('xl/worksheets/sheet1.xml')!.async('string');
  expect(xml).toContain(hidden ? 'zuvi:manualHiddenRows="2 3 6"' : 'zuvi:manualHiddenRows=""');
  const row = xml.match(/<row\b[^>]*\br="3"[^>]*>/)![0];
  expect(row).toContain('customHeight="0"');
  return xml;
}

test('row and column visibility preserves sizing, history and native filter overlap through two reopens', async ({
  page,
}) => {
  test.setTimeout(90000);
  await mkdir(audit, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  const source = await fixture();
  await writeFile(path.join(audit, 'source.xlsx'), source);
  await page.goto('/#/components/office-studio');
  await importFile(page, source, 'Visibility.xlsx');
  const cell = (address: string) => page.getByRole('gridcell', { name: address, exact: true });
  const button = (name: string) => page.getByRole('button', { name, exact: true });
  await expect(cell('A2')).toHaveCount(0);
  await expect(cell('A6')).toHaveCount(0);
  await expect(cell('B1')).toHaveCount(0);
  await range(page, 'B1:C1');
  await button('隐藏列').click();
  await expect(cell('C1')).toHaveCount(0);
  await expect(cell('D1')).toHaveAttribute('data-active', 'true');
  await button('撤销表格修改').click();
  await expect(cell('C1')).toBeVisible();
  await expect(cell('B1')).toHaveCount(0);
  await button('重做表格修改').click();
  await expect(cell('C1')).toHaveCount(0);
  await range(page, 'A2:A3');
  await button('隐藏行').click();
  await expect(cell('A3')).toHaveCount(0);
  await button('撤销表格修改').click();
  await expect(cell('A3')).toBeVisible();
  await expect(cell('A2')).toHaveCount(0);
  await button('重做表格修改').click();
  await expect(cell('A3')).toHaveCount(0);
  for (let pass = 1; pass <= 2; pass++) {
    const bytes = await exportFile(page, `hidden-roundtrip-${pass}.xlsx`);
    await checkNative(bytes, true);
    await importFile(page, bytes, `Reopened-${pass}.xlsx`);
    await expect(cell('A3')).toHaveCount(0);
    await expect(cell('C1')).toHaveCount(0);
  }
  await range(page, 'A1:D4');
  await button('显示选区行').click();
  await expect(cell('A3')).toBeVisible();
  await expect(cell('A2')).toHaveCount(0);
  await expect(cell('A6')).toHaveCount(0);
  await button('显示选区列').click();
  await expect(cell('B1')).toBeVisible();
  await expect(cell('C1')).toBeVisible();
  await button('显示全部行').click();
  await expect(cell('A6')).toBeVisible();
  await expect(cell('A2')).toHaveCount(0);
  await page.getByRole('tab', { name: '数据', exact: true }).click();
  await button('清除筛选').click();
  await expect(cell('A2')).toBeVisible();
  const finalBytes = await exportFile(page, 'shown.xlsx');
  await checkNative(finalBytes, false);
  await importFile(page, finalBytes, 'Shown.xlsx');
  await expect(cell('A2')).toBeVisible();
  await page.getByRole('tab', { name: '开始', exact: true }).click();
  for (const theme of ['light', 'dark']) {
    if (theme === 'dark') await button('切换暗色').click();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await button('显示全部列').scrollIntoViewIfNeeded();
    await page.locator('.zuvi-studio-sheet').screenshot({
      path: path.join(audit, `${theme}.png`),
      animations: 'disabled',
    });
    await page.setViewportSize({ width: 320, height: 720 });
    await range(page, 'B1:C1');
    await button('隐藏列').click();
    await expect(cell('C1')).toHaveCount(0);
    await button('显示全部列').click();
    await expect(cell('C1')).toBeAttached();
    await button('隐藏行').scrollIntoViewIfNeeded();
    await page.locator('.zuvi-studio-sheet').screenshot({
      path: path.join(audit, `${theme}-320.png`),
      animations: 'disabled',
    });
  }
  await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  for (const name of ['隐藏行', '显示选区行', '显示全部行', '隐藏列', '显示选区列', '显示全部列'])
    await expect(button(name)).toBeDisabled();
});
