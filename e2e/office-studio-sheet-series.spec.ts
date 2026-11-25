import { expect, test } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import ExcelJS from '../docs/node_modules/exceljs/excel.js';
import JSZip from '../docs/node_modules/jszip/lib/index.js';

const audit = path.resolve('docs/audits/2026-11-25/sheet-series');
test('series stop drafts, per-track bounds and one-step history preserve native XLSX tails through repeated reopenings', async ({
  page,
}) => {
  await mkdir(audit, { recursive: true });
  const workbook = new ExcelJS.Workbook();
  const data = workbook.addWorksheet('Series');
  data.getColumn('C').width = 14;
  data.getColumn('F').width = 20;
  data.getColumn('I').width = 15;
  data.getCell('A1').value = 0.1;
  data.getCell('A1').font = { bold: true, color: { argb: 'FF0055AA' } };
  data.getCell('A1').numFmt = '0.0';
  data.getCell('A2').value = 4;
  data.getCell('A4').value = 99;
  data.getCell('A4').font = { italic: true };
  data.getCell('A5').value = { text: 'merged tail', hyperlink: 'https://example.com/tail' };
  data.getCell('A5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
  data.mergeCells('A5:B5');
  data.getCell('C1').value = new Date('2024-02-28T00:00:00.000Z');
  data.getCell('C1').numFmt = 'yyyy-mm-dd';
  data.getCell('C4').value = 'date tail';
  data.getCell('E1').value = '订单008';
  data.getCell('E2').value = '订单010';
  data.getCell('E5').value = 'text tail';
  data.getCell('A9').value = 10;
  data.getCell('B9').value = 7;
  data.getCell('F9').value = 'descending tail';
  data.getCell('G1').value = { formula: 'SUM(A1:A3)', result: 4.1 };
  data.getCell('G1').numFmt = '0.0';
  data.getCell('G1').font = { bold: true };
  const source = Buffer.from(await workbook.xlsx.writeBuffer());
  await writeFile(path.join(audit, 'series-source.xlsx'), source);
  await page.goto('/#/components/office-studio');
  const importFile = (name: string, bytes: Buffer) =>
    page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
      name,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: bytes,
    });
  await importFile('Series.xlsx', source);
  const cell = (address: string) => page.getByRole('gridcell', { name: address, exact: true });
  const range = async (value: string) => {
    const address = page.getByLabel('单元格地址', { exact: true });
    await address.fill(value);
    await address.press('Enter');
  };
  const open = async (value: string) => {
    await range(value);
    await page.getByRole('button', { name: '序列填充', exact: true }).click();
    await expect(page.getByRole('dialog', { name: '序列填充', exact: true })).toBeVisible();
  };
  const choose = async (label: string, option: string) => {
    await page.getByRole('button', { name: new RegExp(`^${label}`) }).click();
    await page.getByRole('option', { name: option, exact: true }).click();
  };
  const submit = () => page.getByRole('button', { name: '填充序列', exact: true }).click();
  await expect(cell('A1')).toHaveText('0.1');
  await range('A4');
  await page.getByRole('button', { name: '保护所选区域', exact: true }).click();
  await open('A1:A8');
  await page.getByLabel('序列步长', { exact: true }).fill('0.1');
  await page.getByLabel('序列停止值', { exact: true }).fill('bad');
  await submit();
  await expect(page.getByRole('alert')).toContainText('停止值');
  await expect(cell('A2')).toHaveText('4');
  await page.getByLabel('序列停止值', { exact: true }).fill('0.3');
  await page.getByLabel('序列步长', { exact: true }).fill('0');
  await submit();
  await expect(page.getByRole('alert')).toContainText('不能为 0');
  await page.getByLabel('序列步长', { exact: true }).fill('0.1');
  await submit();
  await expect(cell('A2')).toHaveText('0.2');
  await expect(cell('A3')).toHaveText('0.3');
  await expect(cell('A4')).toHaveText('99');
  await expect(cell('A5')).toHaveText('merged tail');
  await expect(cell('A6')).toBeEmpty();
  await page.getByRole('button', { name: '撤销表格修改', exact: true }).click();
  await expect(cell('A2')).toHaveText('4');
  await expect(cell('A3')).toBeEmpty();
  await page.getByRole('button', { name: '重做表格修改', exact: true }).click();
  await expect(cell('A3')).toHaveCSS('font-weight', '700');
  await open('C1:C6');
  await choose('序列类型', '日期（步长单位：天）');
  await page.getByLabel('序列停止值', { exact: true }).fill('2024-02-30');
  await submit();
  await expect(page.getByRole('alert')).toContainText('日期');
  await page.getByLabel('序列停止值', { exact: true }).fill('2024-03-01');
  await submit();
  await expect(cell('C2')).toHaveText('2024-02-29');
  await expect(cell('C3')).toHaveText('2024-03-01');
  await expect(cell('C4')).toHaveText('date tail');
  await open('E1:E6');
  await choose('序列类型', '文本末尾数字');
  await choose('序列种子数量', '前两个单元格');
  await page.getByLabel('序列停止值', { exact: true }).fill('其他014');
  await submit();
  await expect(page.getByRole('alert')).toContainText('前缀');
  await page.getByLabel('序列停止值', { exact: true }).fill('订单014');
  await submit();
  await expect(cell('E3')).toHaveText('订单012');
  await expect(cell('E4')).toHaveText('订单014');
  await expect(cell('E5')).toHaveText('text tail');
  await open('A9:H9');
  await choose('序列填充方向', '向右');
  await choose('序列种子数量', '前两个单元格');
  await page.getByLabel('序列停止值', { exact: true }).fill('-2');
  await submit();
  await expect(cell('C9')).toHaveText('4');
  await expect(cell('D9')).toHaveText('1');
  await expect(cell('E9')).toHaveText('-2');
  await expect(cell('F9')).toHaveText('descending tail');
  await range('G1:G3');
  await page
    .getByRole('grid')
    .dispatchEvent('keydown', { key: 'd', ctrlKey: true, isComposing: true });
  await expect(cell('G2')).toBeEmpty();
  await page.getByRole('button', { name: '向下填充', exact: true }).click();
  await expect(cell('G2')).toHaveText('99.5');
  await expect(cell('G3')).toHaveText('99.3');
  await range('G1:I1');
  await page.getByRole('button', { name: '向右填充', exact: true }).click();
  await expect(cell('H1')).toHaveText('0.0');
  await page.getByRole('button', { name: '撤销表格修改', exact: true }).click();
  await expect(cell('H1')).toBeEmpty();
  await page.getByRole('button', { name: '重做表格修改', exact: true }).click();
  await expect(cell('H1')).toHaveText('0.0');
  for (let pass = 1; pass <= 2; pass++) {
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await download).path())!);
    await writeFile(path.join(audit, `series-roundtrip-${pass}.xlsx`), bytes);
    const native = new ExcelJS.Workbook();
    await native.xlsx.load(bytes);
    const sheet = native.getWorksheet('Series')!;
    expect(sheet.getCell('A2').value).toBe(0.2);
    expect(sheet.getCell('A3').value).toBe(0.3);
    expect(sheet.getCell('A3').font.bold).toBe(true);
    expect(sheet.getCell('A4').value).toBe(99);
    expect(sheet.getCell('A4').font.italic).toBe(true);
    expect(sheet.getCell('A5').value).toMatchObject({
      text: 'merged tail',
      hyperlink: 'https://example.com/tail',
    });
    expect(sheet.model.merges).toContain('A5:B5');
    expect((sheet.getCell('C2').value as Date).toISOString()).toBe('2024-02-29T00:00:00.000Z');
    expect((sheet.getCell('C3').value as Date).toISOString()).toBe('2024-03-01T00:00:00.000Z');
    expect(sheet.getCell('E4').value).toBe('订单014');
    expect(sheet.getCell('E5').value).toBe('text tail');
    expect(sheet.getCell('E9').value).toBe(-2);
    expect(sheet.getCell('F9').value).toBe('descending tail');
    expect(sheet.getCell('G2').value).toMatchObject({ formula: 'SUM(A2:A4)', result: 99.5 });
    expect(sheet.getCell('G3').value).toMatchObject({ formula: 'SUM(A3:A5)', result: 99.3 });
    expect(sheet.getCell('H1').value).toMatchObject({ formula: 'SUM(B1:B3)' });
    const zip = await JSZip.loadAsync(bytes);
    const xml = await zip.file('xl/worksheets/sheet1.xml')!.async('string');
    const h1 = xml.match(/<c\b[^>]*\br="H1"[^>]*>[\s\S]*?<\/c>/)?.[0];
    expect(h1).toContain('<v>0</v>');
    expect(sheet.getCell('I1').value).toMatchObject({ formula: 'SUM(C1:C3)' });
    expect(sheet.getCell('G2').font.bold).toBe(true);
    await importFile(`Reopened-${pass}.xlsx`, bytes);
    await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(
      `Reopened-${pass}.xlsx`
    );
    await expect(cell('A3')).toHaveText('0.3');
    await expect(cell('C3')).toHaveText('2024-03-01');
    await expect(cell('E4')).toHaveText('订单014');
    await expect(cell('G2')).toHaveText('99.5');
  }
  await page.getByRole('grid').scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.join(audit, 'series-results-light.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await open('A1:A8');
  await page.getByLabel('序列步长', { exact: true }).fill('0.1');
  await page.getByLabel('序列停止值', { exact: true }).fill('0.3');
  await page.screenshot({
    path: path.join(audit, 'series-dialog-light.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('dialog').press('Escape');
  await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  await open('A1:A8');
  await page.getByLabel('序列步长', { exact: true }).fill('0.1');
  await page.getByLabel('序列停止值', { exact: true }).fill('0.3');
  await page.screenshot({
    path: path.join(audit, 'series-dialog-dark.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('dialog').press('Escape');
  await page.setViewportSize({ width: 320, height: 720 });
  await open('C1:C6');
  await choose('序列类型', '日期（步长单位：天）');
  await page.getByLabel('序列停止值', { exact: true }).fill('2024-03-01');
  await page.getByLabel('序列停止值', { exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.join(audit, 'series-dialog-dark-320.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('dialog').press('Escape');
  await page.getByRole('button', { name: '切换浅色', exact: true }).click();
  await open('A1:A8');
  await page.getByLabel('序列步长', { exact: true }).fill('0.1');
  await page.getByLabel('序列停止值', { exact: true }).fill('0.3');
  await page.screenshot({
    path: path.join(audit, 'series-dialog-light-320.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('dialog').press('Escape');
  await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  await expect(page.getByRole('button', { name: '序列填充', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: '向下填充', exact: true })).toBeDisabled();
});
