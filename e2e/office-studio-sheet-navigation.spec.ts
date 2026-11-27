import { expect, test } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import ExcelJS from '../docs/node_modules/exceljs/excel.js';

const audit = path.resolve('docs/audits/2026-11-25/sheet-navigation');
test('Ctrl and Command Shift navigation retain the anchor, skip hidden data and format the native XLSX range atomically', async ({
  page,
}) => {
  await mkdir(audit, { recursive: true });
  const workbook = new ExcelJS.Workbook();
  const data = workbook.addWorksheet('Data');
  for (const row of [1, 2, 3, 6, 7]) data.getCell(`A${row}`).value = row;
  data.getCell('B1').value = 'hidden';
  data.getCell('C1').value = 'edge';
  data.getColumn('B').hidden = true;
  data.getRow(2).hidden = true;
  data.getCell('E1').value = 'merged';
  data.mergeCells('E1:F1');
  await page.goto('/#/components/office-studio');
  await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
    name: 'Navigation.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
  });
  const grid = page.getByRole('grid');
  const cell = (address: string) => page.getByRole('gridcell', { name: address, exact: true });
  await expect(cell('A1')).toHaveText('1');
  await expect(cell('A2')).toHaveCount(0);
  await cell('A1').click();
  await grid.press('Control+Shift+ArrowDown');
  await expect(cell('A3')).toHaveAttribute('data-active', 'true');
  await expect(cell('A1')).toHaveAttribute('aria-selected', 'true');
  await grid.press('Control+Shift+ArrowDown');
  await expect(cell('A6')).toHaveAttribute('data-active', 'true');
  await expect(cell('A4')).toHaveAttribute('aria-selected', 'true');
  await grid.press('Control+b');
  await expect(cell('A1')).toHaveCSS('font-weight', '700');
  await expect(cell('A6')).toHaveCSS('font-weight', '700');
  await page.getByRole('button', { name: '撤销表格修改', exact: true }).click();
  await expect(cell('A1')).not.toHaveCSS('font-weight', '700');
  await page.getByRole('button', { name: '重做表格修改', exact: true }).click();
  await expect(cell('A6')).toHaveCSS('font-weight', '700');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出文件', exact: true }).click();
  const bytes = await readFile((await (await download).path())!);
  await writeFile(path.join(audit, 'navigation-formatted.xlsx'), bytes);
  const native = new ExcelJS.Workbook();
  await native.xlsx.load(bytes);
  const sheet = native.getWorksheet('Data')!;
  for (const row of [1, 2, 3, 4, 5, 6]) expect(sheet.getCell(`A${row}`).font.bold).toBe(true);
  expect(sheet.getCell('A7').font?.bold).not.toBe(true);
  expect(sheet.getRow(2).hidden).toBe(true);
  expect(sheet.getColumn('B').hidden).toBe(true);
  expect(sheet.getCell('A4').value).toBeNull();
  await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
    name: 'Reopened.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: bytes,
  });
  await expect(cell('A6')).toHaveCSS('font-weight', '700');
  await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  await expect(page.getByRole('switch', { name: '只读预览', exact: true })).toHaveAttribute(
    'aria-checked',
    'true'
  );
  await cell('A1').click();
  await grid.press('Meta+Shift+ArrowRight');
  await expect(cell('C1')).toHaveAttribute('data-active', 'true');
  await expect(cell('A1')).toHaveAttribute('aria-selected', 'true');
  await expect(cell('B1')).toHaveCount(0);
  await grid.press('Meta+Shift+ArrowLeft');
  await expect(cell('A1')).toHaveAttribute('data-active', 'true');
  await expect(cell('C1')).toHaveAttribute('aria-selected', 'false');
  await grid.press('Meta+Shift+ArrowRight');
  await grid.press('Meta+Shift+ArrowRight');
  await expect(cell('E1')).toHaveAttribute('data-active', 'true');
  await expect(grid).toHaveAttribute(
    'aria-activedescendant',
    (await cell('E1').getAttribute('id')) as string
  );
  await expect(page.getByLabel('表格公式栏', { exact: true })).toHaveValue('merged');
  await page.screenshot({
    path: path.join(audit, 'navigation-light.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  await page.screenshot({
    path: path.join(audit, 'navigation-dark.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.setViewportSize({ width: 320, height: 720 });
  await cell('A1').click();
  await grid.press('Control+Shift+ArrowDown');
  await expect(cell('A3')).toHaveAttribute('aria-selected', 'true');
  await page.screenshot({
    path: path.join(audit, 'navigation-dark-320.png'),
    fullPage: true,
    animations: 'disabled',
  });
});
