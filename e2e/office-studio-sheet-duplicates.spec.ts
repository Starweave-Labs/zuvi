import { expect, test, type Page } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import ExcelJS from '../docs/node_modules/exceljs/excel.js';

const audit = path.resolve('.release/office-continuation/duplicates/browser');
const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
async function sourceFile() {
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet('Records');
  sheet.addRow(['Key', 'Label', 'Amount', 'Outside']);
  sheet.addRow([1, 'First', 10, 'Keep 2']);
  sheet.addRow([1, 'Duplicate', 20, 'Keep 3']);
  sheet.addRow(['1', 'Text', 30, 'Keep 4']);
  sheet.addRow([true, 'Boolean', 40, 'Keep 5']);
  sheet.addRow([null, 'Blank', 50, 'Keep 6']);
  sheet.addRow([null, 'Blank duplicate', 60, 'Keep 7']);
  sheet.addRow(['', 'Empty text', 70, 'Keep 8']);
  sheet.addRow([{ formula: '""', result: '' }, 'Empty formula duplicate', 80, 'Keep 9']);
  sheet.addRow([2, 'Last', { formula: 'A10*10', result: 20 }, 'Keep 10']);
  sheet.getCell('B10').value = { text: 'Last', hyperlink: 'https://example.com/record/2' };
  sheet.getCell('B3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } };
  sheet.getCell('B3').font = { bold: true };
  sheet.getCell('B4').font = { italic: true, color: { argb: 'FF112233' } };
  sheet.getColumn('B').width = 24;
  sheet.getRow(4).height = 32;
  book.addWorksheet('Other').getCell('A1').value = 'Other untouched';
  const bytes = Buffer.from(await book.xlsx.writeBuffer());
  const original = new ExcelJS.Workbook();
  await original.xlsx.load(bytes);
  expect(original.getWorksheet('Records')!.getCell('A8').value).toBe('');
  return bytes;
}
async function load(page: Page, bytes: Buffer, name: string) {
  await page
    .getByLabel('导入文档文件', { exact: true })
    .setInputFiles({ name, mimeType, buffer: bytes });
  await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(name);
  await expect(page.getByRole('grid')).toBeVisible();
}
async function select(page: Page, text: string) {
  const field = page.getByLabel('单元格地址', { exact: true });
  await field.fill(text);
  await field.press('Enter');
}
async function open(page: Page) {
  await page.getByRole('tab', { name: '数据', exact: true }).click();
  await page.getByRole('button', { name: '删除重复项', exact: true }).click();
  return page.getByRole('dialog', { name: '删除重复项', exact: true });
}
async function exportFile(page: Page, name: string) {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出文件', exact: true }).click();
  const bytes = await readFile((await (await pending).path())!);
  await writeFile(path.join(audit, name), bytes);
  return bytes;
}
async function native(bytes: Buffer) {
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(bytes);
  const sheet = book.getWorksheet('Records')!;
  expect(sheet.getCell('A2').value).toBe(1);
  expect(sheet.getCell('A3').value).toBe('1');
  expect(sheet.getCell('A4').value).toBe(true);
  expect(sheet.getCell('A5').value).toBeNull();
  expect(sheet.getCell('A6').value).toBe('');
  expect(sheet.getCell('A7').value).toBe(2);
  expect(sheet.getCell('C7').value).toEqual({ formula: 'A7*10', result: 20 });
  expect(sheet.getCell('B3').font.italic).toBe(true);
  expect(Boolean(sheet.getCell('B3').font.bold)).toBe(false);
  expect(sheet.getCell('B3').fill?.pattern).not.toBe('solid');
  expect(sheet.getCell('B7').hyperlink).toBe('https://example.com/record/2');
  for (const row of [8, 9, 10])
    for (const col of ['A', 'B', 'C']) expect(sheet.getCell(col + row).value).toBeNull();
  for (let row = 2; row <= 10; row++) expect(sheet.getCell('D' + row).value).toBe('Keep ' + row);
  expect(sheet.getRow(4).height).toBe(32);
  expect(sheet.getColumn('B').width).toBe(24);
  expect(book.getWorksheet('Other')!.getCell('A1').value).toBe('Other untouched');
}
test('duplicate records keep typed blanks, first rows, styles, links and outside data through history and two native reopens', async ({
  page,
}) => {
  test.setTimeout(90000);
  await mkdir(audit, { recursive: true });
  const source = await sourceFile();
  await writeFile(path.join(audit, 'source.xlsx'), source);
  await page.goto('/#/components/office-studio');
  await load(page, source, 'Duplicates.xlsx');
  await select(page, 'A1:C10');
  let dialog = await open(page);
  await dialog.getByRole('checkbox', { name: 'B 列 · Label', exact: true }).uncheck();
  await dialog.getByRole('checkbox', { name: 'C 列 · Amount', exact: true }).uncheck();
  await dialog.getByRole('button', { name: '删除重复记录', exact: true }).click();
  await expect(page.getByText(/已删除 3 条重复记录，保留 6 条记录/)).toBeVisible();
  await expect(page.getByRole('gridcell', { name: 'B3', exact: true })).toContainText('Text');
  await page.getByRole('tab', { name: '开始', exact: true }).click();
  await page.getByRole('button', { name: '撤销表格修改', exact: true }).click();
  await expect(page.getByRole('gridcell', { name: 'B3', exact: true })).toContainText('Duplicate');
  await page.getByRole('button', { name: '重做表格修改', exact: true }).click();
  for (let pass = 1; pass <= 2; pass++) {
    const bytes = await exportFile(page, 'roundtrip-' + pass + '.xlsx');
    await native(bytes);
    await load(page, bytes, 'Reopened-' + pass + '.xlsx');
  }
  await select(page, 'A1:C7');
  dialog = await open(page);
  await dialog.getByRole('button', { name: '取消全选列', exact: true }).click();
  await expect(dialog.getByRole('button', { name: '删除重复记录', exact: true })).toBeDisabled();
  await dialog.getByRole('button', { name: '取消', exact: true }).click();
  for (const width of [1280, 320]) {
    await page.setViewportSize({ width, height: 800 });
    for (const theme of ['light', 'dark']) {
      if (theme === 'dark')
        await page.getByRole('button', { name: '切换暗色', exact: true }).click();
      dialog = await open(page);
      await expect(dialog.getByRole('button', { name: '删除重复记录', exact: true })).toBeVisible();
      const rect = await dialog.boundingBox();
      expect(rect!.x).toBeGreaterThanOrEqual(0);
      expect(rect!.width).toBeLessThanOrEqual(width);
      await page.screenshot({
        path: path.join(audit, 'dialog-' + theme + '-' + width + '.png'),
        fullPage: true,
        animations: 'disabled',
      });
      await dialog.getByRole('button', { name: '取消', exact: true }).click();
      if (theme === 'dark')
        await page.getByRole('button', { name: '切换浅色', exact: true }).click();
    }
  }
  await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  await expect(page.getByRole('button', { name: '删除重复项', exact: true })).toBeDisabled();
});
