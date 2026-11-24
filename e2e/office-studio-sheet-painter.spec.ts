import { expect, test } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import ExcelJS from '../docs/node_modules/exceljs/excel.js';

const audit = path.resolve('docs/audits/2026-11-25/sheet-painter');
test('format painter applies rectangular snapshots atomically and retains native XLSX styles and content after reopening', async ({
  page,
}) => {
  await mkdir(audit, { recursive: true });
  const workbook = new ExcelJS.Workbook();
  const data = workbook.addWorksheet('Painter');
  data.getCell('A1').value = 2;
  data.getCell('A1').font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFF0000' } };
  data.getCell('A1').numFmt = '0.00';
  data.getRow(1).height = 26;
  data.getRow(3).height = 26;
  data.getCell('A1').border = { bottom: { style: 'double', color: { argb: 'FF0000FF' } } };
  data.getCell('A2').value = 3;
  data.getCell('A2').font = { italic: true };
  data.getCell('B2').value = 'wrap';
  data.getCell('B2').alignment = { wrapText: true, horizontal: 'center', vertical: 'top' };
  data.getCell('D3').value = { formula: 'A1+A2', result: 5 };
  data.getCell('E3').value = { text: 'target', hyperlink: 'https://example.com' };
  data.getCell('E3').font = { bold: true, underline: true };
  data.getCell('E3').border = { top: { style: 'thick' } };
  data.getCell('E3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00FF00' } };
  data.getCell('E3').dataValidation = { type: 'list', formulae: ['"target,other"'] };
  data.getCell('F4').value = 'hidden';
  data.getRow(4).hidden = true;
  await page.goto('/#/components/office-studio');
  const importFile = async (name: string, bytes: Buffer) =>
    page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
      name,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: bytes,
    });
  await importFile('Painter.xlsx', Buffer.from(await workbook.xlsx.writeBuffer()));
  const cell = (address: string) => page.getByRole('gridcell', { name: address, exact: true });
  const grid = page.getByRole('grid');
  const brush = page.getByRole('button', { name: '格式刷', exact: true });
  const source = async () => {
    await cell('A1').click();
    await grid.press('Shift+ArrowRight');
    await grid.press('Shift+ArrowDown');
  };
  await expect(cell('A1')).toHaveText('2.00');
  await source();
  await brush.click();
  await expect(brush).toHaveAttribute('aria-pressed', 'true');
  await cell('D3').click();
  await expect(cell('D3')).toHaveCSS('font-weight', '700');
  await expect(cell('D3')).toHaveText('5.00');
  await expect(cell('E3')).not.toHaveCSS('font-weight', '700');
  await expect(cell('E3')).not.toHaveCSS('background-color', 'rgb(0, 255, 0)');
  await expect(brush).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: '撤销表格修改', exact: true }).click();
  await expect(cell('D3')).not.toHaveCSS('font-weight', '700');
  await expect(cell('E3')).toHaveCSS('background-color', 'rgb(0, 255, 0)');
  await page.getByRole('button', { name: '重做表格修改', exact: true }).click();
  await expect(cell('D3')).toHaveText('5.00');
  await source();
  await brush.dblclick();
  await cell('G3').click();
  await expect(cell('G3')).toHaveCSS('font-weight', '700');
  await expect(brush).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '清除格式', exact: true }).click();
  await expect(cell('G3')).not.toHaveCSS('font-weight', '700');
  await cell('D6').click();
  await expect(cell('D6')).toHaveCSS('font-weight', '700');
  // The target format was cleared, but the captured source remains intact.
  const start = await cell('D8').boundingBox();
  const end = await cell('E9').boundingBox();
  await page.mouse.move(start!.x + 10, start!.y + 10);
  await page.mouse.down();
  await page.mouse.move(end!.x + 10, end!.y + 10);
  await expect(cell('D8')).not.toHaveCSS('font-weight', '700');
  await grid.press('Escape');
  await page.mouse.up();
  await expect(cell('D8')).not.toHaveCSS('font-weight', '700');
  await source();
  await brush.click();
  await page.mouse.move(start!.x + 10, start!.y + 10);
  await page.mouse.down();
  await page.mouse.move(end!.x + 10, end!.y + 10);
  await expect(cell('D8')).not.toHaveCSS('font-weight', '700');
  await page.mouse.up();
  await expect(cell('D8')).toHaveCSS('font-weight', '700');
  await expect(cell('E9')).toHaveAttribute('data-wrap', 'true');
  await page.getByRole('button', { name: '撤销表格修改', exact: true }).click();
  await expect(cell('D8')).not.toHaveCSS('font-weight', '700');
  await page.getByRole('button', { name: '重做表格修改', exact: true }).click();
  const exportFile = async () => {
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    return readFile((await (await download).path())!);
  };
  for (let pass = 1; pass <= 2; pass++) {
    const bytes = await exportFile();
    await writeFile(path.join(audit, `painter-roundtrip-${pass}.xlsx`), bytes);
    const native = new ExcelJS.Workbook();
    await native.xlsx.load(bytes);
    const sheet = native.getWorksheet('Painter')!;
    expect(sheet.getCell('D3').value).toMatchObject({ formula: 'A1+A2', result: 5 });
    expect(sheet.getCell('D3').font).toMatchObject({ name: 'Arial', size: 16, bold: true });
    expect(sheet.getCell('D3').border.bottom?.style).toBe('double');
    expect(sheet.getCell('E3').value).toMatchObject({
      text: 'target',
      hyperlink: 'https://example.com',
    });
    expect(sheet.getCell('E3').border).toEqual({});
    expect(sheet.getCell('E3').font.bold).not.toBe(true);
    expect(sheet.getCell('E3').dataValidation.type).toBe('list');
    expect(sheet.getCell('D4').font.italic).toBe(true);
    expect(sheet.getCell('E9').alignment.wrapText).toBe(true);
    expect(sheet.getRow(4).hidden).toBe(true);
    expect(sheet.getRow(1).height).toBe(26);
    expect(sheet.getRow(3).height).toBe(26);
    await importFile(`Reopened-${pass}.xlsx`, bytes);
    await expect(cell('D3')).toHaveText('5.00');
    await expect(cell('D8')).toHaveCSS('font-weight', '700');
  }
  await source();
  await brush.dblclick();
  await grid.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.join(audit, 'painter-light.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  await page.screenshot({
    path: path.join(audit, 'painter-dark.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await grid.press('Escape');
  await page.setViewportSize({ width: 320, height: 720 });
  await cell('A1').click();
  await brush.click();
  const address = page.getByLabel('单元格地址', { exact: true });
  await address.fill('C6');
  await address.press('Enter');
  await grid.press('Enter');
  await expect(cell('C6')).toHaveCSS('font-weight', '700');
  await brush.click();
  await brush.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.join(audit, 'painter-dark-320.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: '切换浅色', exact: true }).click();
  await page.screenshot({
    path: path.join(audit, 'painter-light-320.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  await expect(brush).toBeDisabled();
  await expect(brush).toHaveAttribute('aria-pressed', 'false');
});
