import { expect, test, type Page } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import {
  PDFDocument,
  StandardFonts,
  PDFRawStream,
} from '../docs/node_modules/pdf-lib/cjs/index.js';

const audit = path.resolve('docs/audits/2026-11-24/pdf-fields');
const image = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAFAAAAAyCAIAAABET8urAAABkUlEQVR4nOWXsW3DMBBFPz+yiuElUqTKBBzBQGbwBJkhgEbwBKlcZB5X7hUgaQxZIo/kURJ5rxTuDnj4PIlyt/sISxDGIIxBGIMwxgsaxP28T56Mr9/dJuyebJcezrc39FmSWEWjJoxBNILw0EbLiBaQr2i0mDAGYQzCGIQxCGMQLSC/OUaLCT3814Ctnde7afk/26rOKjiVu/TE8/JxQjWW7hXCI0C0xqyYfMldecKzx7hqyCWwsH9paXe7zCxpDlvt05kwBrM7JQEqhny+DlsKe7GJivO/rYozM3pSHQqdHz3LnYkdc74Oz4aFzkxtyIsroysgVuLM1Q5nUm9UKduZ8tLy149wglAmz5nY/dKG62sJe6UvamBOXmKpXZQU6V4SZ6eVvIeSehmtqHElnsws/7rKJxBNLW14lML/sK/5x3M46s/8fDvlJ+xbs5XAzmyjB5tYl8OxerZhZ64Z72rHOODM/mzDzuzSNuDMDpY2yZlV491QdcmZfds+O7N724kzO1vaqLO73UfFePep+sgvoCCwQd+BD34AAAAASUVORK5CYII=',
  'base64'
);

async function openForm(page: Page) {
  const pdf = await PDFDocument.create();
  const paper = pdf.addPage([420, 600]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  paper.drawText('OfficeStudio form design', { x: 32, y: 564, size: 18, font });
  paper.drawText('Original page content is preserved.', { x: 32, y: 540, size: 11, font });
  const locked = pdf.getForm().createTextField('reference');
  locked.setText('LOCKED');
  locked.enableReadOnly();
  locked.addToPage(paper, { x: 240, y: 505, width: 120, height: 24, font });
  await page.goto('/#/components/office-studio');
  await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
    name: 'Form.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from(await pdf.save()),
  });
  await expect(page.getByLabel('PDF 页面表单 reference', { exact: true })).toBeDisabled();
  return pdf;
}

async function field(
  page: Page,
  kind: string,
  name: string,
  value: string,
  y: number,
  height = 28
) {
  await page.getByRole('button', { name: '新建表单字段', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '新建 PDF 字段', exact: true });
  if (kind !== '文本') {
    await dialog.getByRole('button', { name: /^PDF 字段类型/ }).click();
    await page.getByRole('option', { name: kind, exact: true }).click();
  }
  await dialog.getByLabel('PDF 字段名称', { exact: true }).fill(name);
  await dialog.getByLabel('控件 1 X', { exact: true }).fill('40');
  await dialog.getByLabel('控件 1 Y', { exact: true }).fill(String(y));
  await dialog.getByLabel('控件 1 高度', { exact: true }).fill(String(height));
  if (kind === '复选框') {
    await dialog.getByRole('checkbox', { name: '当前勾选', exact: true }).check();
    await dialog.getByLabel('PDF 复选导出值', { exact: true }).fill('Approved');
    await dialog.getByLabel('控件 1 宽度', { exact: true }).fill('22');
  } else if (kind === '图片') {
    await dialog
      .getByLabel('PDF 字段图片', { exact: true })
      .setInputFiles({ name: 'photo.png', mimeType: 'image/png', buffer: image });
  } else {
    await dialog.getByLabel('PDF 字段当前值', { exact: true }).fill(value);
  }
  return dialog;
}

test('creates seven native PDF field kinds, edits repeated controls and survives undo and two reopen cycles', async ({
  page,
}) => {
  test.setTimeout(120000);
  await mkdir(audit, { recursive: true });
  const original = await openForm(page);
  let dialog = await field(page, '文本', 'customer', 'Alice', 460);
  await dialog.getByLabel('PDF 字符上限').fill('20');
  await dialog.getByLabel('PDF 字段提示').fill('Your name');
  await dialog.getByRole('checkbox', { name: '必填字段', exact: true }).check();
  await dialog.getByRole('button', { name: '添加控件', exact: true }).click();
  await dialog.getByLabel('控件 2 Y', { exact: true }).fill('420');
  await dialog.getByRole('button', { name: '保存字段', exact: true }).click();
  const customers = page.getByLabel('PDF 页面表单 customer', { exact: true });
  await expect(customers).toHaveCount(2);
  await customers.first().fill('Bob');
  await customers.first().press('Tab');
  await expect(customers.last()).toHaveValue('Bob');
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  await expect(customers.first()).toHaveValue('Alice');
  await page.getByRole('button', { name: '重做', exact: true }).click();
  await expect(customers.first()).toHaveValue('Bob');
  dialog = await field(page, '文本', 'customer.name', '', 380);
  await dialog.getByRole('button', { name: '保存字段', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('名称已存在');
  await dialog.getByRole('button', { name: '取消', exact: true }).click();
  dialog = await field(page, '日期', 'date', '', 380);
  await dialog.getByRole('button', { name: '保存字段', exact: true }).click();
  const date = page.getByLabel('PDF 页面表单 date', { exact: true });
  await date.pressSequentially('2026-11-24');
  await date.press('Enter');
  await expect(date).toHaveValue('2026-11-24');
  await date.fill('2026-02-30');
  await page.getByRole('button', { name: '导出文件', exact: true }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: '有效的 YYYY-MM-DD' }).first()
  ).toBeVisible();
  await date.press('Escape');
  dialog = await field(page, '复选框', 'accept', '', 340, 22);
  await dialog.getByRole('button', { name: '保存字段', exact: true }).click();
  dialog = await field(page, '单选组', 'level', 'B', 300, 22);
  await dialog.getByLabel('控件 1 宽度', { exact: true }).fill('22');
  await dialog.getByLabel('控件 1 导出选项', { exact: true }).fill('A');
  await dialog.getByRole('button', { name: '添加控件', exact: true }).click();
  await dialog.getByLabel('控件 2 X', { exact: true }).fill('80');
  await dialog.getByLabel('控件 2 Y', { exact: true }).fill('300');
  await dialog.getByLabel('控件 2 宽度', { exact: true }).fill('22');
  await dialog.getByLabel('控件 2 高度', { exact: true }).fill('22');
  await dialog.getByLabel('控件 2 导出选项', { exact: true }).fill('B');
  await dialog.getByRole('button', { name: '保存字段', exact: true }).click();
  dialog = await field(page, '下拉框', 'status', 'approved', 255);
  await dialog.getByLabel('PDF 字段选项', { exact: true }).fill('draft|Draft\napproved|Approved');
  await dialog.getByLabel('PDF 字段默认值', { exact: true }).fill('draft');
  await dialog.getByRole('button', { name: '保存字段', exact: true }).click();
  dialog = await field(page, '列表框', 'tags', 'blue\ngreen', 150, 80);
  await dialog.getByLabel('PDF 字段选项', { exact: true }).fill('blue|Blue\ngreen|Green\nred|Red');
  await dialog.getByRole('checkbox', { name: '允许多选', exact: true }).check();
  await dialog.getByLabel('PDF 字段默认值', { exact: true }).fill('green');
  await dialog.getByRole('button', { name: '保存字段', exact: true }).click();
  dialog = await field(page, '图片', 'photo', '', 60, 60);
  await dialog.getByRole('button', { name: '保存字段', exact: true }).click();
  await expect(page.getByRole('img', { name: 'photo', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '设计 PDF 字段 photo', exact: true }).click();
  await page.getByRole('button', { name: '删除字段', exact: true }).click();
  await expect(page.getByRole('img', { name: 'photo', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  await expect(page.getByRole('img', { name: 'photo', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '设计 PDF 字段 customer', exact: true }).click();
  const properties = page.getByRole('dialog', { name: '编辑 PDF 字段', exact: true });
  await properties.getByLabel('控件 1 X', { exact: true }).fill('50');
  await properties.getByRole('checkbox', { name: '只读字段', exact: true }).check();
  await properties.getByRole('button', { name: '保存字段', exact: true }).click();
  await expect(customers.first()).toBeDisabled();
  for (let pass = 0; pass < 2; pass++) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const buffer = await readFile((await (await pending).path())!);
    await writeFile(path.join(audit, `form-roundtrip-${pass + 1}.pdf`), buffer);
    const saved = await PDFDocument.load(buffer);
    const form = saved.getForm();
    expect(form.getFields()).toHaveLength(8);
    expect(form.getTextField('customer').getText()).toBe('Bob');
    expect(form.getTextField('customer').isRequired()).toBe(true);
    expect(form.getTextField('customer').isReadOnly()).toBe(true);
    expect(form.getTextField('customer').acroField.getWidgets()[0].getRectangle().x).toBe(50);
    expect(form.getTextField('customer').getMaxLength()).toBe(20);
    expect(form.getTextField('customer').acroField.getWidgets()).toHaveLength(2);
    expect(form.getTextField('date').getText()).toBe('2026-11-24');
    expect(form.getCheckBox('accept').isChecked()).toBe(true);
    expect(form.getRadioGroup('level').getSelected()).toBe('B');
    expect(form.getDropdown('status').getSelected()).toEqual(['approved']);
    expect(form.getOptionList('tags').getSelected()).toEqual(['blue', 'green']);
    expect(form.getTextField('reference').getText()).toBe('LOCKED');
    expect(form.getTextField('reference').isReadOnly()).toBe(true);
    const hashes = (pdf: PDFDocument) =>
      pdf
        .getPages()[0]
        .node.Contents()!
        .asArray()
        .map((entry) => {
          const stream = pdf.context.lookup(entry) as PDFRawStream;
          return createHash('sha256').update(stream.getContents()).digest('hex');
        });
    for (const hash of hashes(original)) expect(hashes(saved)).toContain(hash);
    await page
      .getByLabel('导入文档文件', { exact: true })
      .setInputFiles({ name: 'Reopened.pdf', mimeType: 'application/pdf', buffer });
    await expect(page.getByLabel('PDF 页面表单 customer', { exact: true }).first()).toHaveValue(
      'Bob'
    );
    await expect(page.getByLabel('PDF 页面表单 date', { exact: true })).toHaveValue('2026-11-24');
  }
  await page.screenshot({
    path: path.join(audit, 'fields-light.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  await page.screenshot({
    path: path.join(audit, 'fields-dark.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: '表单 8', exact: true }).click();
  await page.getByRole('button', { name: '设计 PDF 字段 customer', exact: true }).click();
  await page.setViewportSize({ width: 320, height: 720 });
  const edit = page.getByRole('dialog', { name: '编辑 PDF 字段', exact: true });
  const geometry = await edit.boundingBox();
  expect(geometry!.width).toBeLessThanOrEqual(320);
  const sizes = await edit.evaluate((element) => ({
    width: element.clientWidth,
    scroll: element.scrollWidth,
  }));
  expect(sizes.scroll).toBeLessThanOrEqual(sizes.width + 1);
  await page.screenshot({
    path: path.join(audit, 'field-dialog-dark-320.png'),
    fullPage: true,
    animations: 'disabled',
  });
});
