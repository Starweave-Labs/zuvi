import { expect, test } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import ExcelJS from '../docs/node_modules/exceljs/excel.js';

const audit = path.resolve('docs/audits/2026-11-25/sheet-number-format');
test('custom formats preserve native values and formulas, preview regions, undo atomically and reopen twice in both themes and at 320px', async ({
  page,
}) => {
  await mkdir(audit, { recursive: true });
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Formats');
  for (const label of ['A', 'B', 'C']) sheet.getColumn(label).width = 28;
  sheet.getCell('A1').value = -12.5;
  sheet.getCell('A1').numFmt = '0.0';
  sheet.getCell('A2').value = 0;
  sheet.getCell('A3').value = '0042';
  sheet.getCell('B1').value = { formula: 'A1*2', result: -25 };
  sheet.getCell('C1').value = 45351.75;
  sheet.getCell('D1').value = 42;
  sheet.getCell('D2').value = false;
  sheet.getCell('D3').value = { formula: 'ISNUMBER(D1)', result: true };
  const source = Buffer.from(await workbook.xlsx.writeBuffer());
  await writeFile(path.join(audit, 'format-source.xlsx'), source);
  await page.goto('/#/components/office-studio');
  const importFile = (name: string, buffer: Buffer) =>
    page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
      name,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer,
    });
  await importFile('Formats.xlsx', source);
  const cell = (address: string) => page.getByRole('gridcell', { name: address, exact: true });
  const range = async (value: string) => {
    const input = page.getByLabel('单元格地址', { exact: true });
    await input.fill(value);
    await input.press('Enter');
  };
  const open = async (address: string) => {
    await range(address);
    await page.getByRole('button', { name: '自定义数字格式', exact: true }).click();
    return page.getByRole('dialog', { name: '自定义数字格式', exact: true });
  };
  const code = '0.00;[Red](0.00);"零";"文本："@';
  await expect(cell('A1')).toHaveText('-12.5');
  let dialog = await open('A1:B3');
  await expect(dialog.getByText(/选区包含多种格式/)).toBeVisible();
  await dialog.getByLabel('数字格式代码', { exact: true }).fill('garbage');
  await expect(dialog.getByRole('alert')).toBeVisible();
  await expect(dialog.getByRole('button', { name: '应用格式', exact: true })).toBeDisabled();
  await dialog.getByLabel('数字格式代码', { exact: true }).fill(code);
  await expect(dialog.getByText('(1234.56)', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: '应用格式', exact: true }).click();
  await expect(cell('A1')).toHaveText('(12.50)');
  await expect(cell('A1')).toHaveCSS('color', 'rgb(255, 0, 0)');
  await expect(cell('A2')).toHaveText('零');
  await expect(cell('A3')).toHaveText('文本：0042');
  await expect(cell('B1')).toHaveText('(25.00)');
  await page.getByRole('button', { name: '撤销表格修改', exact: true }).click();
  await expect(cell('A1')).toHaveText('-12.5');
  await expect(cell('A2')).toHaveText('0');
  await page.getByRole('button', { name: '重做表格修改', exact: true }).click();
  await expect(cell('B1')).toHaveText('(25.00)');
  dialog = await open('A1');
  await dialog.getByLabel('数字格式代码', { exact: true }).fill('0.000');
  await dialog.getByRole('button', { name: '取消', exact: true }).click();
  await expect(cell('A1')).toHaveText('(12.50)');
  dialog = await open('C1');
  await dialog.getByLabel('数字格式代码', { exact: true }).fill('dddd, mmmm d, yyyy hh:mm AM/PM');
  await dialog.getByRole('button', { name: /^格式地区/ }).click();
  await page.getByRole('option', { name: '中文（中国）', exact: true }).click();
  await expect(
    dialog.getByText('星期四, 2月 29, 2024 06:00 下午', { exact: true }).first()
  ).toBeVisible();
  await dialog.getByRole('button', { name: '应用格式', exact: true }).click();
  await expect(cell('C1')).toHaveText('星期四, 2月 29, 2024 06:00 下午');
  dialog = await open('D1:D2');
  await dialog.getByLabel('数字格式代码', { exact: true }).fill('@');
  await dialog.getByRole('button', { name: '应用格式', exact: true }).click();
  await expect(cell('D1')).toHaveText('42');
  await expect(cell('D2')).toHaveText('FALSE');
  await expect(cell('D3')).toHaveText('TRUE');
  for (let pass = 1; pass <= 2; pass++) {
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await download).path())!);
    await writeFile(path.join(audit, `format-roundtrip-${pass}.xlsx`), bytes);
    const saved = new ExcelJS.Workbook();
    await saved.xlsx.load(bytes);
    const data = saved.getWorksheet('Formats')!;
    expect(data.getCell('A1').value).toBe(-12.5);
    expect(data.getCell('A2').value).toBe(0);
    expect(data.getCell('A3').value).toBe('0042');
    expect(data.getCell('B1').value).toMatchObject({ formula: 'A1*2', result: -25 });
    expect(data.getCell('A1').numFmt).toBe(code);
    expect(data.getCell('D1').value).toBe(42);
    expect(data.getCell('D2').value).toBe(false);
    expect(data.getCell('D1').numFmt).toBe('@');
    expect(data.getCell('C1').numFmt).toBe('[$-0804]dddd, mmmm d, yyyy hh:mm AM/PM');
    await importFile(`Reopened-${pass}.xlsx`, bytes);
    await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(
      `Reopened-${pass}.xlsx`
    );
    await expect(cell('A1')).toHaveText('(12.50)');
    await expect(cell('A3')).toHaveText('文本：0042');
    await expect(cell('C1')).toHaveText('星期四, 2月 29, 2024 06:00 下午');
  }
  await page.getByRole('grid').scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.join(audit, 'format-results-light.png'),
    fullPage: true,
    animations: 'disabled',
  });
  for (const small of [false, true]) {
    if (small) await page.setViewportSize({ width: 320, height: 720 });
    for (const theme of ['light', 'dark']) {
      if (theme === 'dark')
        await page.getByRole('button', { name: '切换暗色', exact: true }).click();
      dialog = await open('C1');
      const box = await dialog.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.width).toBeLessThanOrEqual(small ? 320 : 1280);
      await expect(dialog.getByRole('button', { name: '应用格式', exact: true })).toBeVisible();
      await page.screenshot({
        path: path.join(audit, `format-dialog-${theme}${small ? '-320' : ''}.png`),
        fullPage: true,
        animations: 'disabled',
      });
      await dialog.press('Escape');
      if (theme === 'dark')
        await page.getByRole('button', { name: '切换浅色', exact: true }).click();
    }
  }
  await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  await expect(page.getByRole('button', { name: '自定义数字格式', exact: true })).toBeDisabled();
});
