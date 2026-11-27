import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import ExcelJS from '../docs/node_modules/exceljs/excel.js';
import JSZip from '../docs/node_modules/jszip/lib/index.js';

test('value-list filters survive editing, export and reimport in the actual workbook UI', async ({
  page,
}) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('值列表');
  sheet.addRows([
    ['名称', '金额'],
    ['开发', 10],
    ['设计', 20],
    ['验证', 30],
    [null, 40],
  ]);
  await page.goto('/#/components/office-studio');
  await page
    .getByLabel('导入文档文件', { exact: true })
    .setInputFiles({
      name: '值列表.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
    });
  await expect(page.getByRole('gridcell', { name: 'A2', exact: true })).toHaveText('开发');
  await page.getByRole('tab', { name: '数据', exact: true }).click();
  await page.getByRole('textbox', { name: '筛选区域', exact: true }).fill('A1:B5');
  await page.getByRole('button', { name: /^筛选条件/ }).click();
  await page.getByRole('option', { name: '值列表', exact: true }).click();

  // 弹窗自动打开并默认全选候选值；取消勾选「设计」后应用
  const dialog = page.getByRole('dialog', { name: '筛选值列表' });
  await expect(dialog).toBeVisible();
  for (const name of ['开发', '设计', '验证', '（空白）'])
    await expect(dialog.getByRole('checkbox', { name })).toBeChecked();
  await dialog.getByRole('checkbox', { name: '设计' }).uncheck();
  await dialog.getByRole('button', { name: '应用值列表', exact: true }).click();
  await expect(page.getByRole('dialog', { name: '筛选值列表' })).toHaveCount(0);
  await expect(page.getByRole('gridcell', { name: 'A3', exact: true })).toHaveCount(0);
  await expect(page.getByRole('gridcell', { name: 'A2', exact: true })).toHaveText('开发');
  await expect(page.getByRole('gridcell', { name: 'A5', exact: true })).toHaveCount(1);

  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出文件', exact: true }).click();
  const file = await (await pending).path();
  const saved = await readFile(file!);
  const zip = await JSZip.loadAsync(saved);
  const worksheet = await zip.file('xl/worksheets/sheet1.xml')!.async('string');
  expect(worksheet).toMatch(/<filter val="开发"\/>/);
  expect(worksheet).toMatch(/<blankFilter\/>/);

  // 重开值列表弹窗草稿保留三项（含空白）；全部取消勾选应用后恢复全部行
  await page.getByRole('button', { name: '选择值（3）' }).click();
  const reopened = page.getByRole('dialog', { name: '筛选值列表' });
  await expect(reopened.getByRole('checkbox', { name: '开发' })).toBeChecked();
  await expect(reopened.getByRole('checkbox', { name: '设计' })).not.toBeChecked();
  await reopened.getByRole('button', { name: '全不选', exact: true }).click();
  await reopened.getByRole('button', { name: '应用值列表', exact: true }).click();
  await expect(page.getByRole('gridcell', { name: 'A3', exact: true })).toHaveCount(1);

  await page.getByRole('button', { name: '清除筛选', exact: true }).click();
  await expect(page.getByRole('gridcell', { name: 'A3', exact: true })).toHaveText('设计');
  await page
    .getByLabel('导入文档文件', { exact: true })
    .setInputFiles({
      name: '重开值列表.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: saved,
    });
  await expect(page.getByRole('gridcell', { name: 'A3', exact: true })).toHaveCount(0);
  await page.getByRole('tab', { name: '数据', exact: true }).click();
  await page.getByRole('button', { name: '清除筛选', exact: true }).click();
  await expect(page.getByRole('gridcell', { name: 'A3', exact: true })).toHaveText('设计');
});
