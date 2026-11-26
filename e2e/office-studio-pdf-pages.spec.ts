import { expect, test, type Page } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument, StandardFonts, degrees } from '../docs/node_modules/pdf-lib/cjs/index.js';
const audit = path.resolve('docs/audits/2026-11-26/pdf-pages');
async function open(page: Page) {
  await mkdir(audit, { recursive: true });
  const pdf = await PDFDocument.create(),
    font = await pdf.embedFont(StandardFonts.Helvetica);
  const first = pdf.addPage([400, 500]),
    second = pdf.addPage([300, 400]);
  first.setRotation(degrees(90));
  first.drawText('Original first page', { x: 40, y: 440, size: 18, font });
  second.drawText('Original second page', { x: 40, y: 340, size: 16, font });
  const field = pdf.getForm().createTextField('shared');
  field.setText('Source');
  field.addToPage(first, { x: 40, y: 380, width: 120, height: 24, font });
  field.addToPage(second, { x: 40, y: 280, width: 120, height: 24, font });
  const bytes = Buffer.from(await pdf.save({ updateFieldAppearances: false }));
  await writeFile(path.join(audit, 'pages-source.pdf'), bytes);
  await page.goto('/#/components/office-studio');
  await page
    .getByLabel('导入文档文件', { exact: true })
    .setInputFiles({ name: 'Pages.pdf', mimeType: 'application/pdf', buffer: bytes });
  await expect(page.getByLabel('PDF 页面表单 shared', { exact: true })).toHaveValue('Source');
  return pdf;
}
async function selectPage(page: Page, number: number, checked: boolean) {
  const control = page.getByRole('checkbox', { name: `选择 PDF 第 ${number} 页`, exact: true });
  if ((await control.isChecked()) !== checked)
    await page
      .locator('.zuvi-studio-pdf-page-item label.zuvi-checkbox')
      .filter({ has: control })
      .click();
  if (checked) await expect(control).toBeChecked();
  else await expect(control).not.toBeChecked();
}
async function exported(page: Page, name: string) {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出文件', exact: true }).click();
  const bytes = await readFile((await (await pending).path())!);
  await writeFile(path.join(audit, name), bytes);
  return bytes;
}
test('edits native PDF page dimensions, copies and removes pages, and preserves fields through history and two reopens', async ({
  page,
}) => {
  test.setTimeout(90000);
  await open(page);
  await page.getByRole('button', { name: '插入空白页', exact: true }).click();
  let dialog = page.getByRole('dialog', { name: '插入 PDF 空白页', exact: true });
  await dialog.getByLabel('PDF 页面宽度').fill('320');
  await dialog.getByLabel('PDF 页面高度').fill('480');
  await dialog.getByLabel('PDF 页面插入位置').fill('2');
  await dialog.getByRole('button', { name: '应用 PDF 页面操作' }).click();
  await page.getByRole('button', { name: '页面缩略图', exact: true }).click();
  await expect(page.getByRole('button', { name: /PDF 第 \d+ 页缩略图/ })).toHaveCount(3);
  await page.getByRole('button', { name: 'PDF 第 2 页缩略图', exact: true }).click();
  const paper = page.locator('.zuvi-studio-pdf-paper');
  await expect(paper).toBeVisible();
  await expect(paper).toHaveCSS('width', '320px');
  await expect(paper).toHaveCSS('height', '480px');
  const blank = await paper.locator('canvas').evaluate((element) => {
    const canvas = element as HTMLCanvasElement;
    return Array.from(
      canvas.getContext('2d')!.getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data
    );
  });
  expect(blank).toEqual([255, 255, 255, 255]);
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  await expect(page.getByRole('button', { name: /PDF 第 \d+ 页缩略图/ })).toHaveCount(2);
  await page.getByRole('button', { name: '重做', exact: true }).click();
  await expect(page.getByRole('button', { name: /PDF 第 \d+ 页缩略图/ })).toHaveCount(3);
  await selectPage(page, 2, false);
  await selectPage(page, 1, true);
  await selectPage(page, 3, true);
  await page.getByRole('button', { name: '旋转所选页', exact: true }).click();
  await selectPage(page, 1, false);
  await selectPage(page, 3, false);
  await selectPage(page, 2, true);
  await page.getByRole('button', { name: '页面尺寸', exact: true }).click();
  dialog = page.getByRole('dialog', { name: '修改 PDF 页面尺寸', exact: true });
  await dialog.getByRole('button', { name: '交换宽高' }).click();
  await dialog.getByRole('button', { name: '应用 PDF 页面操作' }).click();
  await expect(paper).toHaveCSS('width', '480px');
  await expect(paper).toHaveCSS('height', '320px');
  await selectPage(page, 2, false);
  await selectPage(page, 1, true);
  await page.getByRole('button', { name: '复制所选页', exact: true }).click();
  dialog = page.getByRole('dialog', { name: '复制所选 PDF 页面', exact: true });
  await dialog.getByLabel('PDF 页面插入位置').fill('4');
  await dialog.getByRole('button', { name: '应用 PDF 页面操作' }).click();
  await expect(page.getByRole('button', { name: /PDF 第 \d+ 页缩略图/ })).toHaveCount(4);
  await selectPage(page, 4, true);
  await page.getByRole('button', { name: '删除所选页', exact: true }).click();
  await expect(page.getByRole('button', { name: /PDF 第 \d+ 页缩略图/ })).toHaveCount(2);
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  await expect(page.getByRole('button', { name: /PDF 第 \d+ 页缩略图/ })).toHaveCount(4);
  await page.getByRole('button', { name: '重做', exact: true }).click();
  await expect(page.getByRole('button', { name: /PDF 第 \d+ 页缩略图/ })).toHaveCount(2);
  for (let round = 1; round <= 2; round++) {
    const bytes = await exported(page, `pages-round-${round}.pdf`),
      pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(2);
    expect(pdf.getPages()[0].getWidth()).toBe(480);
    expect(pdf.getPages()[0].getHeight()).toBe(320);
    expect(pdf.getPages()[1].getRotation().angle).toBe(90);
    expect(pdf.getForm().getTextField('shared').acroField.getWidgets()).toHaveLength(1);
    expect(pdf.getForm().getTextField('shared').getText()).toBe('Source');
    await page
      .getByLabel('导入文档文件', { exact: true })
      .setInputFiles({
        name: `Pages-round-${round}.pdf`,
        mimeType: 'application/pdf',
        buffer: bytes,
      });
    await expect(paper).toBeVisible();
    await expect(paper).toHaveCSS('width', '480px');
  }
  await page.getByRole('switch', { name: '只读预览', exact: true }).check();
  await expect(page.getByRole('button', { name: '插入空白页', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: '页面尺寸', exact: true })).toBeDisabled();
  await page.getByRole('switch', { name: '只读预览', exact: true }).uncheck();
  await page.screenshot({
    path: path.join(audit, 'pages-light.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  await page.screenshot({
    path: path.join(audit, 'pages-dark.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: '页面尺寸', exact: true }).click();
  await page.setViewportSize({ width: 320, height: 720 });
  dialog = page.getByRole('dialog', { name: '修改 PDF 页面尺寸', exact: true });
  expect((await dialog.boundingBox())!.width).toBeLessThanOrEqual(320);
  await expect(dialog).toHaveCSS('opacity', '1');
  const geometry = await dialog.evaluate((element) => ({
    width: element.clientWidth,
    scroll: element.scrollWidth,
  }));
  expect(geometry.scroll).toBeLessThanOrEqual(geometry.width + 1);
  await page.screenshot({
    path: path.join(audit, 'pages-dialog-dark-320.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await dialog.getByRole('button', { name: '取消' }).click();
});
test('moves native page references by dragging a thumbnail after the final page', async ({
  page,
}) => {
  const source = await open(page);
  await page.getByRole('button', { name: '页面缩略图', exact: true }).click();
  await page.locator('.zuvi-office-studio').scrollIntoViewIfNeeded();
  const rows = page.locator('.zuvi-studio-pdf-page-item'),
    thumbnails = page.getByRole('button', { name: /PDF 第 \d+ 页缩略图/ });
  await expect(rows.last().locator('canvas')).toBeVisible();
  await expect(thumbnails.first()).toHaveAttribute('draggable', 'true');
  const target = await rows.last().boundingBox(),
    start = await thumbnails.first().boundingBox(),
    viewport = page.viewportSize()!;
  expect(start!.y).toBeGreaterThanOrEqual(0);
  expect(target!.y + target!.height).toBeLessThanOrEqual(viewport.height);
  await page.evaluate(() => {
    const events: unknown[] = [];
    (window as Window & { pdfDragEvents?: unknown[] }).pdfDragEvents = events;
    const record = (event: Event) => {
      const drag = event as DragEvent,
        element = event.target instanceof Element ? event.target : null;
      const row = element?.closest('.zuvi-studio-pdf-page-item'),
        current = event.currentTarget instanceof Element ? event.currentTarget : null;
      events.push({
        type: event.type,
        target: element?.tagName,
        targetClass: element?.className,
        row: row?.getAttribute('data-pdf-page-index'),
        currentTarget: current?.tagName ?? '#document',
        currentRow: current?.getAttribute('data-pdf-page-index'),
        x: drag.clientX,
        y: drag.clientY,
        effect: drag.dataTransfer?.dropEffect,
      });
    };
    for (const type of ['dragstart', 'dragover', 'drop', 'dragend'])
      document.addEventListener(type, record, true);
    for (const row of document.querySelectorAll('.zuvi-studio-pdf-page-item'))
      row.addEventListener('drop', record, true);
  });
  await thumbnails
    .first()
    .dragTo(rows.last(), { targetPosition: { x: 20, y: target!.height - 8 } });
  const events = await page.evaluate(
    () =>
      (
        window as Window & {
          pdfDragEvents?: { type: string; row: string | null; currentRow?: string | null }[];
        }
      ).pdfDragEvents!
  );
  await writeFile(
    path.join(audit, 'pages-drag-events.json'),
    JSON.stringify(events, null, 2) + '\n'
  );
  expect(events.some((event) => event.type === 'dragstart' && event.row === '0')).toBe(true);
  expect(
    events.some((event) => event.type === 'drop' && event.row === '1' && event.currentRow === '1')
  ).toBe(true);
  await expect(page.getByRole('spinbutton', { name: 'PDF 跳转页', exact: true })).toHaveValue('2');
  const bytes = await exported(page, 'pages-dragged.pdf'),
    pdf = await PDFDocument.load(bytes);
  expect(pdf.getPages().map((entry) => entry.ref.toString())).toEqual([
    source.getPages()[1].ref.toString(),
    source.getPages()[0].ref.toString(),
  ]);
  expect(pdf.getForm().getTextField('shared').acroField.getWidgets()).toHaveLength(2);
});
