import { expect, test, type Page, type Locator } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { PDFDocument, PDFName, PDFDict } from '../docs/node_modules/pdf-lib/cjs/index.js';
import { basicPdf, sevenFields, addLink } from '../docs/tests/studio-pdf-compose-fixtures.mjs';

const audit = path.resolve('docs/audits/2026-11-27/pdf-composition');
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
async function ready(page: Page) {
  await expect(page.getByRole('region', { name: 'PDF 页面编辑区', exact: true }).first()).toHaveAttribute('aria-busy', 'false');
}
async function snapshot(page: Page) {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('zuvi-office-studio', 2); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    const id = await new Promise<string>((resolve, reject) => {
      const request = database.transaction('preferences').objectStore('preferences').get('active'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    const file = await new Promise<{ id: string; revision: number; document: { kind: string; pageCount: number; sourcePageCount: number; name: string; pages: { id: string; sourcePage: number }[]; marks: { id: string; page: number }[]; fields: { name: string; value: string | boolean; type: string; readOnly: boolean; widgets?: { page: number }[] }[] }; source: Blob }>((resolve, reject) => {
      const request = database.transaction('files').objectStore('files').get(id); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    database.close();
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await file.source.arrayBuffer()))).map((value) => value.toString(16).padStart(2, '0')).join('');
    return { id: file.id, revision: file.revision, document: file.document, sourceHash: digest, sourceSize: file.source.size };
  });
}
async function save(page: Page) {
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.locator('.zuvi-office-studio [data-save-state]').first()).toHaveAttribute('data-save-state', 'saved');
}
async function imported(page: Page, bytes: Uint8Array, name: string) {
  await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({ name, mimeType: 'application/pdf', buffer: Buffer.from(bytes) }); await ready(page);
}
async function exported(page: Page, name: string, scope: Page | Locator = page) {
  const pending = page.waitForEvent('download'); await scope.getByRole('button', { name: '导出文件', exact: true }).click();
  const bytes = await readFile((await (await pending).path())!); await writeFile(path.join(audit, name), bytes); return bytes;
}
async function merge(page: Page, bytes: Uint8Array, name: string) {
  await page.getByRole('button', { name: '合并 PDF 文件', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '合并 PDF 文件', exact: true });
  await dialog.getByLabel('选择合并 PDF 文件', { exact: true }).setInputFiles({ name, mimeType: 'application/pdf', buffer: Buffer.from(bytes) });
  await expect(dialog.getByLabel('加入 PDF 页码', { exact: true })).toHaveValue('1-2'); return dialog;
}

test('merges native pages and fields with editable marks, paired history, persistence, old-version export and two PDF reopens', async ({ page }) => {
  test.setTimeout(180000); await mkdir(audit, { recursive: true });
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  const first = await sevenFields(), second = await basicPdf({ pages: 2, fieldName: 'Text', value: 'Incoming', label: 'INCOMING' });
  const vendor = first.pdf.getForm().createTextField('Vendor'); vendor.setText('PASSIVE'); vendor.addToPage(first.pages[0], { x: 20, y: 30, width: 150, height: 27, font: first.font }); vendor.enableReadOnly(); vendor.updateAppearances(first.font); vendor.acroField.dict.set(PDFName.of('FT'), PDFName.of('VendorPassive'));
  addLink(second.pdf, second.pages[0], second.pages[1], { NM: 'incoming-link' });
  const original = await first.bytes(), incoming = await second.bytes();
  await writeFile(path.join(audit, 'primary-source.pdf'), original); await writeFile(path.join(audit, 'incoming-source.pdf'), incoming);
  await page.goto('/#/components/office-studio'); await imported(page, original, 'Primary.pdf');
  await page.getByLabel('PDF 页面表单 Text', { exact: true }).fill('合并前的中文');
  await page.getByRole('tab', { name: '批注', exact: true }).click(); await page.getByRole('button', { name: '矩形', exact: true }).click();
  const paper = page.locator('.zuvi-studio-pdf-paper'); await paper.scrollIntoViewIfNeeded(); const box = await paper.boundingBox();
  await page.mouse.move(box!.x + 210, box!.y + 330); await page.mouse.down(); await page.mouse.move(box!.x + 260, box!.y + 350, { steps: 4 }); await page.mouse.up();
  await page.getByRole('tab', { name: '开始', exact: true }).click();
  await page.getByRole('button', { name: '复制所选页', exact: true }).click();
  const copy = page.getByRole('dialog', { name: '复制所选 PDF 页面', exact: true }); await copy.getByLabel('PDF 页面插入位置').fill('3'); await copy.getByRole('button', { name: '应用 PDF 页面操作' }).click();
  await save(page); const before = await snapshot(page); expect(before.document.pageCount).toBe(3); expect(before.document.marks).toHaveLength(2); expect(before.sourceHash).toBe(hash(original));
  let dialog = await merge(page, incoming, 'Incoming.pdf');
  await dialog.getByLabel('合并 PDF 插入位置').fill('2'); await dialog.getByLabel('加入 PDF 页码').fill('2,1'); await dialog.getByRole('button', { name: '取消', exact: true }).click();
  expect(await snapshot(page)).toEqual(before);
  dialog = await merge(page, incoming, 'Incoming.pdf'); await dialog.getByLabel('合并 PDF 插入位置').fill('2'); await dialog.getByLabel('加入 PDF 页码').fill('2,1'); await dialog.getByRole('button', { name: '应用 PDF 合并', exact: true }).click();
  await expect(dialog).not.toBeVisible(); await ready(page); await save(page);
  const combined = await snapshot(page); expect(combined.document.pageCount).toBe(5); expect(combined.document.sourcePageCount).toBe(5); expect(combined.sourceHash).not.toBe(before.sourceHash);
  expect(combined.document.fields.map((field) => field.name)).toContain('Text__2'); expect(combined.document.fields.find((field) => field.name === 'Vendor')?.readOnly).toBe(true);
  expect(combined.document.marks.map((mark) => mark.page)).toEqual([0, 4]);
  await page.getByLabel('PDF 页面表单 Text', { exact: true }).first().fill('After merge');
  await page.getByRole('button', { name: '撤销', exact: true }).click(); await expect(page.getByLabel('PDF 页面表单 Text', { exact: true }).first()).toHaveValue('合并前的中文'); await save(page);
  expect((await snapshot(page)).sourceHash).toBe(combined.sourceHash);
  await page.getByRole('button', { name: '撤销', exact: true }).click(); await ready(page); await save(page);
  const undone = await snapshot(page); expect(undone.document.pageCount).toBe(3); expect(undone.sourceHash).toBe(before.sourceHash); expect(undone.document.marks).toEqual(before.document.marks);
  await page.getByRole('button', { name: '重做', exact: true }).click(); await ready(page); await save(page); expect((await snapshot(page)).sourceHash).toBe(combined.sourceHash);
  await page.reload(); await ready(page); const fresh = await snapshot(page); expect(fresh.document.pageCount).toBe(5); expect(fresh.sourceHash).toBe(combined.sourceHash); expect(fresh.document.marks).toEqual(combined.document.marks);
  await page.getByRole('button', { name: '历史版本', exact: true }).click(); const history = page.getByRole('dialog', { name: '文档历史版本', exact: true });
  await history.getByRole('button', { name: new RegExp(`^版本 ${before.revision} ·`) }).click(); await expect(history.getByLabel('PDF 页面表单 Text', { exact: true }).first()).toHaveValue('合并前的中文');
  const historical = await PDFDocument.load(await exported(page, 'before-composition-history.pdf', history)); expect(historical.getPageCount()).toBe(3); expect(historical.getForm().getTextField('Text').getText()).toBe('合并前的中文'); expect(historical.getForm().getFields().some((field) => field.getName() === 'Text__2')).toBe(false);
  await history.locator('[data-part=footer]').getByRole('button', { name: '关闭', exact: true }).click();
  await expect(history).toHaveCount(0);
  await page.getByRole('button', { name: '页面缩略图', exact: true }).click(); await expect(page.getByRole('button', { name: /PDF 第 \d+ 页缩略图/ })).toHaveCount(5);
  await page.screenshot({ path: path.join(audit, 'combined-light.png'), fullPage: true, animations: 'disabled' });
  for (let round = 1; round <= 2; round++) {
    const bytes = await exported(page, `combined-round-${round}.pdf`), native = await PDFDocument.load(bytes); expect(native.getPageCount()).toBe(5); expect(native.getForm().getTextField('Text').getText()).toBe('合并前的中文'); expect(native.getForm().getTextField('Text__2').getText()).toBe('Incoming'); expect(native.getForm().getTextField('Text').acroField.getWidgets()).toHaveLength(2);
    const link = native.getPages()[2].node.Annots()!.asArray().map((ref) => native.context.lookup(ref)).find((dict) => dict instanceof PDFDict && dict.lookup(PDFName.of('Subtype')) === PDFName.of('Link')) as PDFDict;
    expect(link.lookup(PDFName.of('Dest')).get(0).toString()).toBe(native.getPages()[1].ref.toString());
    await imported(page, bytes, `Reopened-${round}.pdf`); await expect(page.getByLabel('PDF 页面表单 Text', { exact: true }).first()).toHaveValue('合并前的中文');
  }
  await writeFile(path.join(audit, 'paired-history-and-refresh.json'), JSON.stringify({ before, combined, undone, fresh, errors }, null, 2) + '\n'); expect(errors).toEqual([]);
});

test('extracts radio pages with an explicit value policy, native V/DV checks, undo and repeated reopens', async ({ page }) => {
  test.setTimeout(120000); await mkdir(audit, { recursive: true });
  const fixture = await basicPdf({ pages: 2, form: false, label: 'RADIO' }), radio = fixture.pdf.getForm().createRadioGroup('Choice'); radio.disableMutualExclusion();
  radio.addOptionToPage('A', fixture.pages[0], { x: 40, y: 120, width: 20, height: 20 }); radio.addOptionToPage('B', fixture.pages[1], { x: 40, y: 120, width: 20, height: 20 }); radio.select('B'); radio.acroField.dict.set(PDFName.of('DV'), radio.acroField.getWidgets()[0].getOnValue()!);
  const bytes = await fixture.bytes(); await writeFile(path.join(audit, 'radio-source.pdf'), bytes); await page.goto('/#/components/office-studio'); await imported(page, bytes, 'Radio.pdf'); const before = await snapshot(page);
  await page.getByRole('button', { name: '提取 PDF 页面', exact: true }).click(); const dialog = page.getByRole('dialog', { name: '提取 PDF 页面', exact: true }); await dialog.getByLabel('提取 PDF 页码').fill('1'); await dialog.getByRole('button', { name: '应用 PDF 提取', exact: true }).click(); await expect(dialog.getByRole('alert')).toContainText('单选值'); expect((await snapshot(page)).sourceHash).toBe(before.sourceHash);
  const clearing = dialog.getByRole('checkbox', { name: '清除在所选页面中已无控件的单选值', exact: true }); await clearing.locator('..').click(); await expect(clearing).toBeChecked(); await dialog.getByRole('button', { name: '应用 PDF 提取', exact: true }).click(); await expect(dialog).not.toBeVisible(); await ready(page); await save(page);
  const extracted = await snapshot(page); expect(extracted.document.pageCount).toBe(1); expect(extracted.document.fields[0].value).toBe('');
  let native = await PDFDocument.load(await exported(page, 'radio-cleared.pdf')), field = native.getForm().getRadioGroup('Choice'); expect(field.getSelected()).toBeUndefined(); expect(field.acroField.dict.lookup(PDFName.of('DV')).toString()).toBe(field.acroField.getWidgets()[0].getOnValue()!.toString());
  await page.getByRole('button', { name: '撤销', exact: true }).click(); await ready(page); await save(page); expect((await snapshot(page)).sourceHash).toBe(before.sourceHash); expect((await snapshot(page)).document.pageCount).toBe(2);
  await page.getByRole('button', { name: '重做', exact: true }).click(); await ready(page);
  const choose = page.getByRole('radio', { name: 'PDF 页面表单 Choice A', exact: true }); await choose.locator('..').click(); await expect(choose).toBeChecked();
  for (let round = 1; round <= 2; round++) { const output = await exported(page, `radio-round-${round}.pdf`); native = await PDFDocument.load(output); field = native.getForm().getRadioGroup('Choice'); expect(native.getPageCount()).toBe(1); expect(field.getSelected()).toBe('A'); expect(field.acroField.dict.lookup(PDFName.of('DV')).toString()).toBe(field.acroField.getWidgets()[0].getOnValue()!.toString()); await imported(page, output, `Radio-reopened-${round}.pdf`); }
  await writeFile(path.join(audit, 'radio-policy.json'), JSON.stringify({ before, extracted }, null, 2) + '\n');
});

test('keeps rejected field conflicts unchanged and verifies the actual merge and extraction dialogs in light, dark and 320px', async ({ page }) => {
  test.setTimeout(120000); await mkdir(audit, { recursive: true });
  const first = await basicPdf({ pages: 2, value: 'Current' }), second = await basicPdf({ pages: 2, value: 'Incoming' });
  const original = await first.bytes(), incoming = await second.bytes(); await page.goto('/#/components/office-studio'); await imported(page, original, 'Conflict.pdf'); const before = await snapshot(page);
  let dialog = await merge(page, incoming, 'Conflict-incoming.pdf'); await dialog.getByRole('button', { name: /^PDF 同名字段处理/ }).click(); await page.getByRole('option', { name: '连接兼容字段，共享填写值', exact: true }).click(); await dialog.getByRole('button', { name: '应用 PDF 合并', exact: true }).click(); await expect(dialog.getByRole('alert')).toContainText('同名字段'); expect(await snapshot(page)).toEqual(before); await dialog.getByRole('button', { name: '取消', exact: true }).click();
  dialog = await merge(page, incoming, 'Conflict-incoming.pdf'); await page.screenshot({ path: path.join(audit, 'merge-dialog-light.png'), fullPage: true, animations: 'disabled' });
  await dialog.getByRole('button', { name: '取消', exact: true }).click(); await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  dialog = await merge(page, incoming, 'Conflict-incoming.pdf'); await page.screenshot({ path: path.join(audit, 'merge-dialog-dark.png'), fullPage: true, animations: 'disabled' });
  await page.setViewportSize({ width: 320, height: 720 }); const bounds = await dialog.boundingBox(); expect(bounds!.width).toBeLessThanOrEqual(320); const sizes = await dialog.evaluate((element) => ({ width: element.clientWidth, scroll: element.scrollWidth })); expect(sizes.scroll).toBeLessThanOrEqual(sizes.width + 1);
  await dialog.getByLabel('组合后的 PDF 名称').fill('Merged.pdf'); await expect(dialog.getByRole('button', { name: '应用 PDF 合并', exact: true })).toBeInViewport(); await page.screenshot({ path: path.join(audit, 'merge-dialog-dark-320.png'), fullPage: true, animations: 'disabled' }); await dialog.getByRole('button', { name: '取消', exact: true }).click();
  await page.getByRole('button', { name: '提取 PDF 页面', exact: true }).click(); dialog = page.getByRole('dialog', { name: '提取 PDF 页面', exact: true }); await dialog.getByLabel('提取 PDF 页码').fill('1,1'); await dialog.getByRole('button', { name: '应用 PDF 提取', exact: true }).click(); await expect(dialog.getByRole('alert')).toContainText('不能重复'); await page.screenshot({ path: path.join(audit, 'extract-dialog-dark-320.png'), fullPage: true, animations: 'disabled' }); await dialog.getByRole('button', { name: '取消', exact: true }).click();
  const readonly = page.getByRole('switch', { name: '只读预览', exact: true }); await readonly.click(); await expect(page.getByRole('button', { name: '合并 PDF 文件', exact: true })).toBeDisabled(); await expect(page.getByRole('button', { name: '提取 PDF 页面', exact: true })).toBeDisabled(); expect((await snapshot(page)).sourceHash).toBe(before.sourceHash);
  await writeFile(path.join(audit, 'conflicts-and-dialog-geometry.json'), JSON.stringify({ before, bounds, sizes }, null, 2) + '\n');
});
