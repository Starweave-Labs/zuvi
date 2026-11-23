import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import ExcelJS from '../docs/node_modules/exceljs/excel.js';
import JSZip from '../docs/node_modules/jszip/lib/index.js';

test('color filters survive editing, undo, export and reimport in the actual workbook UI', async ({
  page,
}) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('颜色筛选');
  sheet.addRows([
    ['项目', '预算'],
    ['开发', 10],
    ['设计', 20],
  ]);
  sheet.getCell('A2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF4FF' } };
  await page.goto('/#/components/office-studio');
  await page
    .getByLabel('导入文档文件', { exact: true })
    .setInputFiles({
      name: '颜色筛选.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
    });
  await expect(page.getByRole('gridcell', { name: 'A2', exact: true })).toHaveText('开发');
  await page.getByRole('tab', { name: '数据', exact: true }).click();
  await page.getByRole('textbox', { name: '筛选区域', exact: true }).fill('A1:B3');
  await page.getByRole('button', { name: /^筛选条件/ }).click();
  await page.getByRole('option', { name: '填充颜色', exact: true }).click();
  await page.getByRole('button', { name: '应用筛选', exact: true }).click();
  await expect(page.getByRole('gridcell', { name: 'A3', exact: true })).toHaveCount(0);
  await expect(page.getByRole('gridcell', { name: 'A2', exact: true })).toHaveText('开发');
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出文件', exact: true }).click();
  const file = await (await pending).path();
  const saved = await readFile(file!);
  const zip = await JSZip.loadAsync(saved);
  expect(await zip.file('xl/worksheets/sheet1.xml')!.async('string')).toMatch(
    /<colorFilter dxfId="\d+" cellColor="1"/
  );
  await page.getByRole('button', { name: '清除筛选', exact: true }).click();
  await expect(page.getByRole('gridcell', { name: 'A3', exact: true })).toHaveText('设计');
  await page.getByRole('tab', { name: '开始', exact: true }).click();
  await page.getByRole('button', { name: '撤销表格修改', exact: true }).click();
  await expect(page.getByRole('gridcell', { name: 'A3', exact: true })).toHaveCount(0);
  await page
    .getByLabel('导入文档文件', { exact: true })
    .setInputFiles({
      name: '重开颜色.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: saved,
    });
  await expect(page.getByRole('gridcell', { name: 'A2', exact: true })).toHaveText('开发');
  await expect(page.getByRole('gridcell', { name: 'A3', exact: true })).toHaveCount(0);
  await page.getByRole('tab', { name: '数据', exact: true }).click();
  await page.getByRole('button', { name: '清除筛选', exact: true }).click();
  await expect(page.getByRole('gridcell', { name: 'A3', exact: true })).toHaveText('设计');
});
