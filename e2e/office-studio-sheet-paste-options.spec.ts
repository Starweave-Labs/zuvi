import { expect, test } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import ExcelJS from '../docs/node_modules/exceljs/excel.js';

const audit = path.resolve('docs/audits/2026-11-25/sheet-paste-options');
test('skip blanks and arithmetic Paste Special preserve native data and formulas, cancel errors atomically and distinguish reopened empty text', async ({
  page,
}) => {
  await mkdir(audit, { recursive: true });
  const workbook = new ExcelJS.Workbook();
  const data = workbook.addWorksheet('Paste');
  for (const col of ['D', 'E', 'G', 'K', 'L']) data.getColumn(col).width = 14;
  data.getCell('A1').value = 2;
  data.getCell('B1').font = { bold: true };
  data.getCell('A2').value = 0;
  data.getCell('B2').value = false;
  data.getCell('A3').value = { formula: 'A4*2', result: 6 };
  data.getCell('A4').value = 3;
  data.getCell('D4').value = 10;
  data.getCell('D4').font = { italic: true };
  data.getCell('D4').numFmt = '0.00';
  data.getCell('E4').value = { text: 'keep link', hyperlink: 'https://example.com/keep' };
  data.getCell('E4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
  data.getCell('D5').value = 4;
  data.getCell('E5').value = 5;
  data.getCell('G4').value = { formula: 'G5+1', result: 5 };
  data.getCell('G4').numFmt = '0.00';
  data.getCell('G5').value = 4;
  data.getCell('G8').value = { formula: 'G9+1', result: 5 };
  data.getCell('G8').numFmt = '0.00';
  data.getCell('G9').value = 4;
  for (const address of ['H4', 'I4', 'J4']) data.getCell(address).value = 12;
  data.getCell('H1').value = '';
  data.getCell('H2').value = ' ';
  data.getCell('H3').value = { formula: '""', result: '' };
  data.getCell('L1').value = 'keep';
  const source = Buffer.from(await workbook.xlsx.writeBuffer());
  await writeFile(path.join(audit, 'paste-source.xlsx'), source);
  await page.goto('/#/components/office-studio');
  const importFile = (name: string, bytes: Buffer) =>
    page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
      name,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: bytes,
    });
  await importFile('Paste.xlsx', source);
  const grid = page.getByRole('grid');
  const cell = (address: string) => page.getByRole('gridcell', { name: address, exact: true });
  const range = async (value: string) => {
    const address = page.getByLabel('单元格地址', { exact: true });
    await address.fill(value);
    await address.press('Enter');
  };
  const copy = async (value: string, count: number) => {
    await range(value);
    await grid.press('Control+c');
    await expect(
      page.getByText(`已复制 ${count} 个单元格，可使用选择性粘贴。`, { exact: true })
    ).toBeVisible();
  };
  const open = async (address: string, operation: string, skip = false, formula = false) => {
    await range(address);
    await page.getByRole('button', { name: '选择性粘贴', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: '选择性粘贴', exact: true });
    await dialog.getByRole('radio', { name: formula ? /^仅公式/ : /^仅值/ }).click();
    if (skip) await dialog.getByRole('checkbox', { name: '跳过空白单元格', exact: true }).click();
    if (operation !== '无运算') {
      await dialog.getByRole('button', { name: /^粘贴运算/ }).click();
      await page.getByRole('option', { name: operation, exact: true }).click();
    }
    return dialog;
  };
  const submit = () =>
    page.getByRole('dialog').getByRole('button', { name: '粘贴', exact: true }).click();
  await expect(cell('A1')).toHaveText('2');
  await range('E4');
  await page.getByRole('button', { name: '保护所选区域', exact: true }).click();
  await copy('A1:B2', 4);
  await open('D4', '乘', true);
  await submit();
  await expect(cell('D4')).toHaveText('20.00');
  await expect(cell('D5')).toHaveText('0');
  await expect(cell('E5')).toHaveText('0');
  await expect(cell('E4')).toHaveText('keep link');
  await expect(cell('E4')).toHaveCSS('background-color', 'rgb(255, 255, 0)');
  await page.getByRole('button', { name: '撤销表格修改', exact: true }).click();
  await expect(cell('D4')).toHaveText('10.00');
  await expect(cell('D5')).toHaveText('4');
  await page.getByRole('button', { name: '重做表格修改', exact: true }).click();
  await expect(cell('D4')).toHaveText('20.00');
  await copy('A1:B2', 4);
  const failed = await open('D4', '除', true);
  await submit();
  await expect(failed.getByRole('alert')).toContainText('不能除以零');
  await expect(cell('D4')).toHaveText('20.00');
  await failed.getByRole('button', { name: /^粘贴运算/ }).click();
  await page.getByRole('option', { name: '加', exact: true }).click();
  await submit();
  await expect(cell('D4')).toHaveText('22.00');
  await copy('A1', 1);
  for (const [address, operation, expected] of [
    ['G4', '加', '7.00'],
    ['H4', '减', '10'],
    ['I4', '除', '6'],
    ['J4', '乘', '24'],
  ]) {
    await open(address, operation);
    await submit();
    await expect(cell(address)).toHaveText(expected);
  }
  await copy('A3', 1);
  await open('G8', '加', false, true);
  await submit();
  await expect(cell('G8')).toHaveText('13.00');
  await copy('H1:H3', 3);
  await open('K1', '无运算', true);
  await submit();
  for (let pass = 1; pass <= 2; pass++) {
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await download).path())!);
    await writeFile(path.join(audit, `paste-roundtrip-${pass}.xlsx`), bytes);
    const native = new ExcelJS.Workbook();
    await native.xlsx.load(bytes);
    const sheet = native.getWorksheet('Paste')!;
    expect(sheet.getCell('D4').value).toBe(22);
    expect(sheet.getCell('D4').font.italic).toBe(true);
    expect(sheet.getCell('D4').numFmt).toBe('0.00');
    expect(sheet.getCell('D5').value).toBe(0);
    expect(sheet.getCell('E5').value).toBe(0);
    expect(sheet.getCell('E4').value).toMatchObject({
      text: 'keep link',
      hyperlink: 'https://example.com/keep',
    });
    expect(sheet.getCell('E4').fill.fgColor?.argb).toBe('FFFFFF00');
    expect(sheet.getCell('G4').value).toMatchObject({ formula: '(G5+1)+(2)', result: 7 });
    expect(sheet.getCell('G8').value).toMatchObject({ formula: '(G9+1)+(G9*2)', result: 13 });
    expect(sheet.getCell('H4').value).toBe(10);
    expect(sheet.getCell('I4').value).toBe(6);
    expect(sheet.getCell('J4').value).toBe(24);
    expect(sheet.getCell('K1').type).toBe(ExcelJS.ValueType.String);
    expect(sheet.getCell('K1').value).toBe('');
    expect(sheet.getCell('K2').value).toBe(' ');
    expect(sheet.getCell('K3').type).toBe(ExcelJS.ValueType.String);
    await importFile(`Reopened-${pass}.xlsx`, bytes);
    await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(
      `Reopened-${pass}.xlsx`
    );
    await expect(cell('D4')).toHaveText('22.00');
    await copy('K1', 1);
    await open('L1', '无运算', true);
    await submit();
    await expect(cell('L1')).toBeEmpty();
  }
  await grid.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.join(audit, 'paste-empty-text-light.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await range('A1');
  await page.screenshot({
    path: path.join(audit, 'paste-results-light.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await copy('A1:B2', 4);
  await open('D4', '加', true);
  await page.screenshot({
    path: path.join(audit, 'paste-dialog-light.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('dialog').press('Escape');
  await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  await open('D4', '加', true);
  await page.screenshot({
    path: path.join(audit, 'paste-dialog-dark.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('dialog').press('Escape');
  await page.setViewportSize({ width: 320, height: 720 });
  const small = await open('D4', '除', true);
  await small
    .getByRole('checkbox', { name: '跳过空白单元格', exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.join(audit, 'paste-dialog-dark-320.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await small.press('Escape');
  await page.getByRole('button', { name: '切换浅色', exact: true }).click();
  await open('D4', '加', true);
  await page.screenshot({
    path: path.join(audit, 'paste-dialog-light-320.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('dialog').press('Escape');
  await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  await expect(page.getByRole('button', { name: '选择性粘贴', exact: true })).toBeDisabled();
});
