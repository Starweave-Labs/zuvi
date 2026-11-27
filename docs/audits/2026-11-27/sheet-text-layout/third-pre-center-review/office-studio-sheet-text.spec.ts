import { expect, test, type Locator, type Page } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import ExcelJS from '../docs/node_modules/exceljs/excel.js';
import JSZip from '../docs/node_modules/jszip/lib/index.js';

const audit = path.resolve('docs/audits/2026-11-27/sheet-text-layout');
const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const hash = (bytes: Buffer | string) => createHash('sha256').update(bytes).digest('hex');
const wrapped = '自动换行随列宽变化并保留原始文字与工作簿默认字体。';

async function fixture() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Text', { properties: { defaultRowHeight: 18.75 } });
  for (const name of ['A', 'B', 'C', 'D']) sheet.getColumn(name).width = 16;
  sheet.getCell('A1').value = 'CENTER_TITLE';
  sheet.getCell('B1').alignment = { horizontal: 'general' };
  sheet.getCell('C1').alignment = { horizontal: 'general' };
  sheet.getCell('A2').value = wrapped;
  sheet.getCell('A3').value = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz';
  sheet.getCell('A3').font = { name: 'Arial', size: 22 };
  sheet.getCell('A4').value = 'ANGLED_TEXT';
  sheet.getCell('A4').alignment = { horizontal: 'right', indent: 2, textRotation: 45 };
  sheet.getCell('C4').value = 'Indented';
  sheet.getCell('A5').value = '竖排ABC';
  sheet.getRow(5).height = 90;
  sheet.getCell('A6').value = 42;
  sheet.getCell('A6').numFmt = '@';
  sheet.getCell('B6').value = { error: '#N/A' };
  sheet.getCell('C6').value = false;
  sheet.getCell('D6').value = '#N/A';
  sheet.getCell('A7').value = '**';
  sheet.getCell('A8').value = 'Line one\nLine two\nLine three';
  sheet.getCell('A8').alignment = { wrapText: true };
  sheet.getCell('B8').value = '分散对齐';
  sheet.getRow(8).height = 72;
  sheet.getCell('A9').value = 3;
  sheet.getCell('B9').value = {
    formula: "'Other'!A1",
    result: 'Cross sheet formula with a long text value',
  };
  sheet.getCell('B9').alignment = { wrapText: true };
  sheet.getCell('A10').value = {
    formula: 'SEQUENCE(2,2)',
    shareType: 'array',
    ref: 'A10:B11',
    result: 1,
  };
  sheet.getCell('B10').value = 2;
  sheet.getCell('A11').value = 3;
  sheet.getCell('B11').value = 4;
  sheet.getCell('B11').font = { name: 'Arial', size: 30 };
  sheet.getCell('D1').value = {
    text: 'Native label',
    hyperlink: 'https://example.com/native-text',
  };
  workbook.addWorksheet('Other').getCell('A1').value = 'Cross sheet formula with a long text value';
  const zip = await JSZip.loadAsync(Buffer.from(await workbook.xlsx.writeBuffer()));
  const raw = await zip.file('xl/styles.xml')!.async('string');
  const font0 = '<font><b/><i/><sz val="9.5"/><name val="Arial"/></font>';
  zip.file('xl/styles.xml', raw.replace(/(<fonts\b[^>]*>)<font>[\s\S]*?<\/font>/, '$1' + font0));
  const source = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  return { source, font0 };
}

async function importFile(page: Page, bytes: Buffer, name: string) {
  await page
    .getByLabel('导入文档文件', { exact: true })
    .setInputFiles({ name, mimeType, buffer: bytes });
  await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(name);
}
async function range(page: Page, value: string) {
  const input = page.getByLabel('单元格地址', { exact: true });
  await input.fill(value);
  await input.press('Enter');
}
async function open(page: Page, address: string) {
  await range(page, address);
  await page.getByRole('button', { name: '文字排版', exact: true }).click();
  return page.getByRole('dialog', { name: '单元格文字排版', exact: true });
}
async function choose(page: Page, dialog: Locator, label: string, option: string) {
  const trigger = dialog.getByRole('button', { name: new RegExp('^' + label) });
  await trigger.click();
  const id = await trigger.getAttribute('aria-controls');
  await page.locator(`[id="${id}"]`).getByRole('option', { name: option, exact: true }).click();
}
async function apply(dialog: Locator) {
  await dialog.getByRole('button', { name: '应用排版', exact: true }).click();
  await expect(dialog).toBeHidden();
}
async function exportFile(page: Page) {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出文件', exact: true }).click();
  return readFile((await (await pending).path())!);
}
async function geometry(locator: Locator) {
  return locator.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const text = element.querySelector<HTMLElement>(
      '.zuvi-studio-sheet-text,.studio-print-text-clip'
    )!;
    return {
      width: box.width,
      height: box.height,
      textWidth: text.getBoundingClientRect().width,
      lines: Array.from(
        element.querySelectorAll<HTMLElement>(
          '.zuvi-studio-sheet-text-transform>span,.studio-print-text-transform>span'
        ),
        (line) => {
          const bounds = line.getBoundingClientRect();
          return {
            text: line.textContent,
            x: bounds.left - box.left,
            y: bounds.top - box.top,
            width: bounds.width,
            height: bounds.height,
          };
        }
      ),
    };
  });
}

test('advanced text editing, native default font, automatic rows, print and two XLSX reopens use the actual editor', async ({
  page,
  context,
}) => {
  test.setTimeout(150000);
  await mkdir(audit, { recursive: true });
  const { source, font0 } = await fixture();
  await writeFile(path.join(audit, 'text-source.xlsx'), source);
  await page.addInitScript(() => {
    window.print = () => {
      window.parent.postMessage(
        { type: 'sheet-text-print', html: document.documentElement.outerHTML },
        '*'
      );
      window.dispatchEvent(new Event('afterprint'));
    };
  });
  await page.goto('/#/components/office-studio');
  await importFile(page, source, 'Text.xlsx');
  const cell = (address: string) => page.getByRole('gridcell', { name: address, exact: true });
  await expect(page.getByRole('combobox', { name: '表格字体', exact: true })).toHaveValue('Arial');
  await expect(page.getByRole('combobox', { name: '表格字号', exact: true })).toHaveValue('9.5');
  await expect(page.getByRole('button', { name: '表格加粗', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await expect(cell('A1')).toHaveText('CENTER_TITLE');
  const nativeWidth = await cell('A1').evaluate((element) => element.getBoundingClientRect().width);
  let dialog = await open(page, 'A1:C1');
  await choose(page, dialog, '文字水平对齐', '跨选区居中');
  await apply(dialog);
  await expect(cell('A1')).toHaveAttribute('data-center-continuous-span', '1:3');
  await expect(cell('A1').locator('.zuvi-studio-sheet-text')).toHaveCSS(
    'width',
    `${nativeWidth * 3}px`
  );
  await expect(cell('B1')).not.toHaveAttribute('aria-colspan');
  await page.getByRole('button', { name: '撤销表格修改', exact: true }).click();
  await expect(cell('A1')).not.toHaveAttribute('data-center-continuous-span');
  await page.getByRole('button', { name: '重做表格修改', exact: true }).click();
  await expect(cell('A1')).toHaveAttribute('data-center-continuous-span', '1:3');

  const beforeWrap = await cell('A2').evaluate((element) => element.getBoundingClientRect().height);
  dialog = await open(page, 'A2');
  await dialog.getByRole('checkbox', { name: '自动换行', exact: true }).check();
  await dialog.getByRole('checkbox', { name: '缩小字体填充', exact: true }).check();
  await apply(dialog);
  const wrappedHeight = await cell('A2').evaluate(
    (element) => element.getBoundingClientRect().height
  );
  expect(wrappedHeight).toBeGreaterThan(beforeWrap);
  await expect(cell('A2').locator('[data-shrink-applied]')).toHaveCount(0);
  await page.getByRole('button', { name: '撤销表格修改', exact: true }).click();
  await expect
    .poll(() => cell('A2').evaluate((element) => element.getBoundingClientRect().height))
    .toBeCloseTo(beforeWrap, 2);
  await page.getByRole('button', { name: '重做表格修改', exact: true }).click();
  await expect
    .poll(() => cell('A2').evaluate((element) => element.getBoundingClientRect().height))
    .toBeCloseTo(wrappedHeight, 2);

  dialog = await open(page, 'A3');
  await dialog.getByRole('checkbox', { name: '缩小字体填充', exact: true }).check();
  await apply(dialog);
  expect(
    Number(
      await cell('A3').locator('.zuvi-studio-sheet-text').getAttribute('data-effective-font-size')
    )
  ).toBeLessThan(22);
  dialog = await open(page, 'A4');
  await dialog.getByLabel('文字旋转角度', { exact: true }).fill('-45');
  await choose(page, dialog, '文字垂直对齐', '顶端');
  await apply(dialog);
  expect(
    await cell('A4')
      .locator('.zuvi-studio-sheet-text-transform')
      .evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).b)
  ).toBeCloseTo(Math.SQRT1_2, 5);
  dialog = await open(page, 'C4');
  await choose(page, dialog, '文字水平对齐', '右对齐');
  await dialog.getByLabel('文字缩进', { exact: true }).fill('2');
  await apply(dialog);
  dialog = await open(page, 'A5');
  await choose(page, dialog, '文字方向', '竖排文字');
  await choose(page, dialog, '文字垂直对齐', '顶端');
  await apply(dialog);
  await expect(cell('A5').locator('[data-text-rotation="vertical"]')).toBeVisible();
  await expect(cell('A5').locator('.zuvi-studio-sheet-text-transform>span')).toHaveCount(5);
  dialog = await open(page, 'A7');
  await choose(page, dialog, '文字水平对齐', '填充');
  await apply(dialog);
  expect((await cell('A7').textContent())!.length).toBeGreaterThan(2);
  dialog = await open(page, 'A8');
  await choose(page, dialog, '文字水平对齐', '两端对齐');
  await choose(page, dialog, '文字垂直对齐', '分散对齐');
  await apply(dialog);
  const verticalLines = await geometry(cell('A8'));
  expect(verticalLines.lines).toHaveLength(3);
  expect(verticalLines.lines[1].y - verticalLines.lines[0].y).toBeGreaterThan(
    verticalLines.lines[0].height
  );
  dialog = await open(page, 'B8');
  await choose(page, dialog, '文字水平对齐', '分散对齐');
  await apply(dialog);
  expect(
    await cell('B8')
      .locator('.zuvi-studio-sheet-text-transform>span')
      .evaluate((element) => parseFloat(getComputedStyle(element).letterSpacing))
  ).toBeGreaterThan(0);
  await range(page, 'B11');
  await expect(cell('B11')).toHaveText('4');
  expect((await geometry(cell('B11'))).height).toBeGreaterThan(beforeWrap);

  const rounds: Array<{ file: string; sha256: string }> = [];
  for (let round = 1; round <= 2; round++) {
    const bytes = await exportFile(page);
    const filename = `text-roundtrip-${round}.xlsx`;
    await writeFile(path.join(audit, filename), bytes);
    const zip = await JSZip.loadAsync(bytes);
    const styles = await zip.file('xl/styles.xml')!.async('string');
    expect(styles).toContain(font0);
    const xml = await zip.file('xl/worksheets/sheet1.xml')!.async('string');
    expect(xml.match(/<row\b[^>]*\br="2"[^>]*>/)![0]).not.toContain('customHeight="1"');
    expect(xml.match(/<row\b[^>]*\br="5"[^>]*>/)![0]).toContain('customHeight="1"');
    expect(xml).toMatch(/<f[^>]*t="array"[^>]*ref="A10:B11"/);
    const native = new ExcelJS.Workbook();
    await native.xlsx.load(bytes);
    const data = native.getWorksheet('Text')!;
    for (const address of ['A1', 'B1', 'C1'])
      expect(data.getCell(address).alignment.horizontal).toBe('centerContinuous');
    expect(data.getCell('A2').value).toBe(wrapped);
    expect(data.getCell('A2').alignment).toMatchObject({ wrapText: true, shrinkToFit: true });
    expect(data.getCell('A3').font.size).toBe(22);
    expect(data.getCell('A3').alignment.shrinkToFit).toBe(true);
    expect(data.getCell('A4').alignment).toMatchObject({
      textRotation: -45,
      indent: 0,
      vertical: 'top',
    });
    expect(data.getCell('C4').alignment).toMatchObject({
      horizontal: 'right',
      indent: 2,
      textRotation: 0,
    });
    expect(data.getCell('A5').alignment.textRotation).toBe('vertical');
    expect(data.getRow(5).height).toBe(90);
    expect(data.getCell('A7').value).toBe('**');
    expect(data.getCell('A7').alignment.horizontal).toBe('fill');
    expect(data.getCell('A8').alignment).toMatchObject({
      horizontal: 'justify',
      vertical: 'distributed',
    });
    expect(data.getCell('B8').alignment.horizontal).toBe('distributed');
    expect(data.getCell('B9').value).toMatchObject({ formula: "'Other'!A1" });
    expect(data.getCell('D1').value).toMatchObject({
      hyperlink: 'https://example.com/native-text',
    });
    expect(data.getCell('B6').value).toEqual({ error: '#N/A' });
    expect(data.getCell('C6').value).toBe(false);
    expect(data.getCell('D6').value).toBe('#N/A');
    rounds.push({ file: filename, sha256: hash(bytes) });
    await importFile(page, bytes, `Text-reopened-${round}.xlsx`);
    await range(page, 'A2');
    await expect
      .poll(() => cell('A2').evaluate((element) => element.getBoundingClientRect().height))
      .toBeCloseTo(wrappedHeight, 2);
    await expect(cell('A1')).toHaveAttribute('data-center-continuous-span', '1:3');
    await range(page, 'A5');
    await expect(cell('A5').locator('[data-text-rotation="vertical"]')).toBeVisible();
  }

  const measured: Record<string, Awaited<ReturnType<typeof geometry>>> = {};
  for (const address of ['A1', 'A2', 'A3', 'A4', 'C4', 'A5', 'A8', 'B8']) {
    await range(page, address);
    measured[address] = await geometry(cell(address));
  }
  await range(page, 'A6');
  await expect(cell('A6').locator('.zuvi-studio-sheet-text')).toHaveAttribute(
    'data-text-align',
    'left'
  );
  await expect(
    page.getByRole('gridcell', { name: /^B6(?: |$)/ }).locator('.zuvi-studio-sheet-text')
  ).toHaveAttribute('data-text-align', 'center');
  await expect(cell('C6').locator('.zuvi-studio-sheet-text')).toHaveAttribute(
    'data-text-align',
    'center'
  );
  await expect(cell('D6').locator('.zuvi-studio-sheet-text')).toHaveAttribute(
    'data-text-align',
    'left'
  );
  await page.evaluate(() =>
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'sheet-text-print')
        (window as Window & { sheetTextPrint?: string }).sheetTextPrint = event.data.html;
    })
  );
  await page.getByRole('button', { name: '打印', exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() => (window as Window & { sheetTextPrint?: string }).sheetTextPrint)
    )
    .toBeTruthy();
  const printed = await page.evaluate(
    () => (window as Window & { sheetTextPrint?: string }).sheetTextPrint!
  );
  await writeFile(path.join(audit, 'text-print.html'), printed);
  const preview = await context.newPage();
  await preview.setContent(printed);
  await preview.evaluate(() => document.fonts.ready);
  const printTable = preview.locator('.studio-print-sheet').first().locator('table');
  const printedGeometry: Record<string, Awaited<ReturnType<typeof geometry>>> = {};
  for (const address of Object.keys(measured)) {
    const row = Number(address.slice(1));
    const column = address.charCodeAt(0) - 65;
    const actual = await geometry(
      printTable
        .locator('tr')
        .nth(row - 1)
        .locator('td')
        .nth(column)
    );
    printedGeometry[address] = actual;
    expect(actual.width).toBeCloseTo(measured[address].width, 1);
    expect(actual.height).toBeCloseTo(measured[address].height, 1);
    expect(actual.textWidth).toBeCloseTo(measured[address].textWidth, 1);
    expect(actual.lines).toHaveLength(measured[address].lines.length);
    for (let index = 0; index < actual.lines.length; index++) {
      expect(actual.lines[index].x).toBeCloseTo(measured[address].lines[index].x, 1);
      expect(actual.lines[index].y).toBeCloseTo(measured[address].lines[index].y, 1);
    }
  }
  await preview.screenshot({
    path: path.join(audit, 'text-print.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await preview.pdf({
    path: path.join(audit, 'text-print.pdf'),
    preferCSSPageSize: true,
    printBackground: true,
  });
  await preview.close();
  await range(page, 'A1');
  await page.screenshot({
    path: path.join(audit, 'text-results-light.png'),
    fullPage: true,
    animations: 'disabled',
  });
  for (const small of [false, true]) {
    if (small) await page.setViewportSize({ width: 320, height: 720 });
    for (const theme of ['light', 'dark']) {
      if (theme === 'dark')
        await page.getByRole('button', { name: '切换暗色', exact: true }).click();
      dialog = await open(page, 'A4');
      const bounds = await dialog.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.width).toBeLessThanOrEqual(small ? 320 : 1280);
      await expect(dialog.getByRole('button', { name: '应用排版', exact: true })).toBeVisible();
      await page.screenshot({
        path: path.join(audit, `text-dialog-${theme}${small ? '-320' : ''}.png`),
        fullPage: true,
        animations: 'disabled',
      });
      await dialog.getByRole('button', { name: '取消', exact: true }).click();
      await expect(dialog).toBeHidden();
      if (theme === 'dark')
        await page.getByRole('button', { name: '切换浅色', exact: true }).click();
    }
  }
  await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  await expect(page.getByRole('button', { name: '文字排版', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: '自动换行', exact: true })).toBeDisabled();
  await writeFile(
    path.join(audit, 'browser-roundtrip-evidence.json'),
    JSON.stringify(
      {
        source: { file: 'text-source.xlsx', sha256: hash(source) },
        rounds,
        grid: measured,
        print: printedGeometry,
        viewport: { width: 320, height: 720 },
        readOnly: true,
      },
      null,
      2
    ) + '\n'
  );
});

test('text formatting holds invalid drafts, cancels cleanly and rejects protected batches before adding history', async ({
  page,
}) => {
  test.setTimeout(90000);
  await mkdir(audit, { recursive: true });
  const { source } = await fixture();
  await page.goto('/#/components/office-studio');
  await importFile(page, source, 'Text-guards.xlsx');
  const formula = page.getByLabel('表格公式栏', { exact: true });
  await formula.fill('x'.repeat(32768));
  await page.getByRole('button', { name: '文字排版', exact: true }).click();
  await expect(page.getByRole('dialog', { name: '单元格文字排版', exact: true })).toHaveCount(0);
  await expect(page.locator('.zuvi-studio-sheet')).toHaveAttribute('data-studio-input-error');
  await formula.press('Escape');
  let dialog = await open(page, 'A1');
  await dialog.getByLabel('文字缩进', { exact: true }).fill('251');
  await expect(dialog.getByRole('alert')).toHaveText('缩进须为 0 至 250 之间的整数。');
  await expect(dialog.getByRole('button', { name: '应用排版', exact: true })).toBeDisabled();
  await expect(page.locator('.zuvi-studio-sheet')).toHaveAttribute('data-studio-input-error');
  await dialog.getByRole('button', { name: '取消', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('.zuvi-studio-sheet')).not.toHaveAttribute('data-studio-input-error');
  await expect(page.getByRole('button', { name: '撤销表格修改', exact: true })).toBeDisabled();
  await range(page, 'B1');
  await page.getByRole('button', { name: '保护所选区域', exact: true }).click();
  dialog = await open(page, 'A1:C1');
  await choose(page, dialog, '文字水平对齐', '跨选区居中');
  await dialog.getByRole('button', { name: '应用排版', exact: true }).click();
  await expect(dialog.getByRole('alert')).toHaveText('选区包含受保护区域，整次格式应用已取消。');
  await page.screenshot({
    path: path.join(audit, 'text-protected-rejection.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await dialog.getByRole('button', { name: '取消', exact: true }).click();
  await expect(dialog).toBeHidden();
  const protectedBytes = await exportFile(page);
  await writeFile(path.join(audit, 'text-protected-after-rejection.xlsx'), protectedBytes);
  const saved = new ExcelJS.Workbook();
  await saved.xlsx.load(protectedBytes);
  expect(saved.getWorksheet('Text')!.getCell('A1').alignment.horizontal).not.toBe(
    'centerContinuous'
  );
  await page.getByRole('button', { name: '撤销表格修改', exact: true }).click();
  await expect(page.getByRole('button', { name: '撤销表格修改', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: '取消区域保护', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: '重做表格修改', exact: true }).click();
  await expect(page.getByRole('button', { name: '取消区域保护', exact: true })).toBeEnabled();
  await writeFile(
    path.join(audit, 'browser-guard-evidence.json'),
    JSON.stringify(
      {
        sourceHash: hash(source),
        outputHash: hash(protectedBytes),
        invalidDraftRejected: true,
        cancelClearedGuard: true,
        protectedBatchRejected: true,
        undoStepsForProtection: 1,
        redoRestoredProtection: true,
      },
      null,
      2
    ) + '\n'
  );
});
