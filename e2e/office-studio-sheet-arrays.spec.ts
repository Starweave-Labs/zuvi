import { expect, test } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import ExcelJS from '../docs/node_modules/exceljs/excel.js';
import JSZip from '../docs/node_modules/jszip/lib/index.js';

const audit = path.resolve('docs/audits/2026-11-24/sheet-arrays');

test('fixed and dynamic array formulas edit atomically, report conflicts and survive two native XLSX reopen cycles', async ({
  page,
}) => {
  test.setTimeout(120000);
  await mkdir(audit, { recursive: true });
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Arrays');
  sheet.addRows([
    [1, 2],
    [3, 4],
  ]);
  sheet.getCell('E1').value = { formula: 'A1:B2*2', shareType: 'array', ref: 'E1:F2', result: 2 };
  sheet.getCell('F1').value = 4;
  sheet.getCell('E2').value = 6;
  sheet.getCell('F2').value = 8;
  sheet.getCell('J1').value = { formula: 'F2+1', result: 9 };
  await page.goto('/#/components/office-studio');
  await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
    name: 'Arrays.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
  });
  const cell = (address: string) => page.getByRole('gridcell', { name: address, exact: true });
  const navigate = async (address: string) => {
    await page.getByLabel('单元格地址', { exact: true }).fill(address);
    await page.getByLabel('单元格地址', { exact: true }).press('Enter');
  };
  await expect(cell('F2')).toHaveText('8');
  await expect(cell('J1')).toHaveText('9');
  await cell('F2').dblclick();
  await expect(page.getByLabel('编辑 F2', { exact: true })).toHaveCount(0);
  await expect(page.getByLabel('表格公式栏', { exact: true })).toHaveAttribute('readonly');
  await navigate('E1');
  const formula = page.getByLabel('表格公式栏', { exact: true });
  await formula.fill('=A1:B2*3');
  await formula.press('Enter');
  await expect(cell('F2')).toHaveText('12');
  await expect(cell('J1')).toHaveText('13');
  await page.getByRole('button', { name: '撤销表格修改', exact: true }).click();
  await expect(cell('F2')).toHaveText('8');
  await page.getByRole('button', { name: '重做表格修改', exact: true }).click();
  await expect(cell('F2')).toHaveText('12');
  await navigate('E5');
  await page.getByRole('button', { name: '数组公式', exact: true }).click();
  let dialog = page.getByRole('dialog', { name: '数组公式', exact: true });
  await dialog.getByLabel('数组公式表达式', { exact: true }).fill('=SEQUENCE(2,3,10,2)');
  await dialog.getByRole('button', { name: '应用数组公式', exact: true }).click();
  await expect(cell('G6')).toHaveText('20');
  await navigate('J2');
  await formula.fill('=SUM(E5#)');
  await formula.press('Enter');
  await expect(cell('J2')).toHaveText('90');
  for (let pass = 1; pass <= 2; pass++) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const buffer = await readFile((await (await pending).path())!);
    await writeFile(path.join(audit, `arrays-roundtrip-${pass}.xlsx`), buffer);
    const zip = await JSZip.loadAsync(buffer);
    const xml = await zip.file('xl/worksheets/sheet1.xml')!.async('string');
    expect(xml).toMatch(/<f[^>]*t="array"[^>]*ref="E1:F2"/);
    expect(xml).toMatch(/<c[^>]*r="E5"[^>]*cm="1"/);
    expect(await zip.file('xl/metadata.xml')!.async('string')).toContain('dynamicArrayProperties');
    const saved = new ExcelJS.Workbook();
    await saved.xlsx.load(buffer);
    expect(saved.getWorksheet('Arrays')!.getCell('F2').value).toBe(12);
    expect(saved.getWorksheet('Arrays')!.getCell('G6').value).toBe(20);
    await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
      name: 'Reopened.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer,
    });
    await expect(cell('F2')).toHaveText('12');
    await expect(cell('G6')).toHaveText('20');
    await expect(cell('J2')).toHaveText('90');
  }
  await navigate('E5');
  await formula.fill('=SEQUENCE(1,1,7)');
  await formula.press('Enter');
  await expect(cell('G6')).toHaveText('');
  await expect(cell('E5')).toHaveText('7');
  await navigate('F6');
  await formula.fill('keep');
  await formula.press('Enter');
  await navigate('E5');
  await formula.fill('=SEQUENCE(2,2)');
  await formula.press('Enter');
  await expect(page.getByRole('gridcell', { name: 'E5 #SPILL!', exact: true })).toHaveText(
    '#SPILL!'
  );
  await expect(cell('F6')).toHaveText('keep');
  await navigate('F6');
  await formula.fill('');
  await formula.press('Enter');
  await expect(cell('E5')).toHaveText('1');
  await expect(cell('F6')).toHaveText('4');
  await navigate('F6');
  await page.getByRole('button', { name: '保护所选区域', exact: true }).click();
  await expect(page.getByRole('gridcell', { name: 'E5 #SPILL!', exact: true })).toHaveText(
    '#SPILL!'
  );
  const protectedDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出文件', exact: true }).click();
  const protectedBytes = await readFile((await (await protectedDownload).path())!);
  await writeFile(path.join(audit, 'arrays-protected.xlsx'), protectedBytes);
  const protectedZip = await JSZip.loadAsync(protectedBytes);
  expect(await protectedZip.file('xl/worksheets/sheet1.xml')!.async('string')).toContain(
    '<sheetProtection'
  );
  await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
    name: 'Protected.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: protectedBytes,
  });
  await expect(page.getByRole('gridcell', { name: 'E5 #SPILL!', exact: true })).toHaveText(
    '#SPILL!'
  );
  await page.getByRole('button', { name: '取消区域保护', exact: true }).click();
  await expect(cell('F6')).toHaveText('4');
  await page.screenshot({
    path: path.join(audit, 'arrays-light.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  await expect(page.getByRole('switch', { name: '只读预览', exact: true })).toHaveAttribute(
    'aria-checked',
    'true'
  );
  await expect(page.getByRole('button', { name: '数组公式', exact: true })).toBeDisabled();
  await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  await page.screenshot({
    path: path.join(audit, 'arrays-dark.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await navigate('E5');
  await page.getByRole('button', { name: '数组公式', exact: true }).click();
  await page.setViewportSize({ width: 320, height: 720 });
  dialog = page.getByRole('dialog', { name: '数组公式', exact: true });
  const box = await dialog.boundingBox();
  expect(box!.width).toBeLessThanOrEqual(320);
  const sizes = await dialog.evaluate((element) => ({
    width: element.clientWidth,
    scroll: element.scrollWidth,
  }));
  expect(sizes.scroll).toBeLessThanOrEqual(sizes.width + 1);
  await page.screenshot({
    path: path.join(audit, 'array-dialog-dark-320.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await dialog.getByRole('button', { name: '取消', exact: true }).click();
});
