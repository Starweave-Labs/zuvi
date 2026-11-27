import { expect, test } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  Document,
  Header,
  Footer,
  Paragraph,
  TextRun,
  Tab,
  Table,
  TableRow,
  TableCell,
  Packer,
} from '../docs/node_modules/docx/dist/index.mjs';
import JSZip from '../docs/node_modules/jszip/lib/index.js';

const audit = path.resolve('docs/audits/2026-11-25/word-nonprinting');
test('Word nonprinting markers preserve text, selection, document history, native DOCX whitespace and printing', async ({
  page,
}) => {
  await mkdir(audit, { recursive: true });
  const native = new Document({
    sections: [
      {
        headers: { default: new Header({ children: [new Paragraph('Header  text')] }) },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [new TextRun({ children: ['Footer', new Tab(), 'text'] })],
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({ children: ['  😀 A ', new Tab(), ' B\u00a0Z  '], bold: true }),
              new TextRun({ break: 1 }),
              new TextRun('Next line'),
            ],
          }),
          new Paragraph(''),
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [new TextRun({ children: ['Cell ', new Tab(), 'content'] })],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });
  const source = Buffer.from(await Packer.toArrayBuffer(native));
  await writeFile(path.join(audit, 'nonprinting-source.docx'), source);
  await page.goto('/#/components/office-studio');
  const importFile = (name: string, bytes: Buffer) =>
    page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
      name,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: bytes,
    });
  await importFile('Nonprinting.docx', source);
  const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  const paragraph = body.locator('p').first();
  const toggle = page.getByRole('button', { name: '显示非打印字符', exact: true });
  await expect(paragraph).toContainText('Next line');
  await page.evaluate(() => document.fonts.ready);
  const originalText = await paragraph.textContent();
  const originalHeight = (await paragraph.boundingBox())!.height;
  await paragraph.evaluate((element) => {
    (element.closest('[contenteditable]') as HTMLElement).focus();
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  });
  const selection = await page.evaluate(() => window.getSelection()!.toString());
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(body.locator('[data-word-nonprinting="tab"]')).toHaveCount(2);
  await expect(body.locator('[data-word-nonprinting="line-break"]')).toHaveCount(1);
  await expect(body.locator('[data-word-nonprinting="nbsp"]')).toHaveCount(1);
  await expect(
    page
      .getByRole('textbox', { name: 'Word 页眉', exact: true })
      .locator('[data-word-nonprinting="paragraph"]')
  ).toHaveCount(1);
  await expect(
    page
      .getByRole('textbox', { name: 'Word 页脚', exact: true })
      .locator('[data-word-nonprinting="tab"]')
  ).toHaveCount(1);
  expect(await paragraph.textContent()).toBe(originalText);
  expect(await page.evaluate(() => window.getSelection()!.toString())).toBe(selection);
  expect((await paragraph.boundingBox())!.height).toBeCloseTo(originalHeight, 1);
  const space = body.locator('[data-word-nonprinting="space"]').first();
  expect(await space.evaluate((element) => getComputedStyle(element, '::before').content)).toBe(
    '"·"'
  );
  await page.emulateMedia({ media: 'print' });
  await expect
    .poll(() => space.evaluate((element) => getComputedStyle(element, '::before').display))
    .toBe('none');
  await page.emulateMedia({ media: 'screen' });
  await body.focus();
  await expect
    .poll(() =>
      body.evaluate((element) => {
        const editor = (element as HTMLElement & { editor: { view: { hasFocus(): boolean } } })
          .editor;
        return editor.view.hasFocus() && element.ownerDocument.activeElement === element;
      })
    )
    .toBe(true);
  await body.press('ArrowRight');
  await expect.poll(() => page.evaluate(() => window.getSelection()?.isCollapsed)).toBe(true);
  await expect
    .poll(() =>
      body.evaluate((element) => {
        const editor = (
          element as HTMLElement & {
            editor: { state: { selection: { empty: boolean } } };
          }
        ).editor;
        return editor.state.selection.empty;
      })
    )
    .toBe(true);
  await body.pressSequentially(' edited');
  await expect(paragraph).toContainText('Next line edited');
  await body.press('Control+Shift+8');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  expect(await paragraph.textContent()).toBe(originalText);
  await page.getByRole('button', { name: '重做', exact: true }).click();
  await expect(paragraph).toContainText('Next line edited');
  await body.press('Meta+8');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  for (let pass = 1; pass <= 2; pass++) {
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await download).path())!);
    await writeFile(path.join(audit, `nonprinting-roundtrip-${pass}.docx`), bytes);
    const zip = await JSZip.loadAsync(bytes);
    const xml = await zip.file('word/document.xml')!.async('string');
    expect(xml.match(/<w:tab\/>/g)).toHaveLength(2);
    expect(xml).toContain(' B\u00a0Z  ');
    expect(xml).toContain('Next line edited');
    expect(xml).not.toContain('data-word-nonprinting');
    expect(xml).not.toContain('¶');
    expect(xml).not.toContain('→');
    await importFile(`Reopened-${pass}.docx`, bytes);
    await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(
      `Reopened-${pass}.docx`
    );
    await expect(toggle).toBeEnabled();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect(paragraph).toContainText('Next line edited');
    await expect(body.locator('[data-word-nonprinting="tab"]')).toHaveCount(2);
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  }
  await body.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.join(audit, 'nonprinting-light.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  await page.screenshot({
    path: path.join(audit, 'nonprinting-dark.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.setViewportSize({ width: 320, height: 720 });
  await toggle.click();
  await expect(body.locator('[data-word-nonprinting]')).toHaveCount(0);
  await toggle.click();
  await page.getByRole('button', { name: /^Word 缩放/ }).click();
  await page.getByRole('option', { name: '50%', exact: true }).click();
  await page
    .locator('.zuvi-studio-word')
    .evaluate((element) => element.scrollIntoView({ block: 'start' }));
  await page.screenshot({
    path: path.join(audit, 'nonprinting-dark-320.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: '切换浅色', exact: true }).click();
  await page.screenshot({
    path: path.join(audit, 'nonprinting-light-320.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  await expect(toggle).toBeEnabled();
  await toggle.click();
  await expect(body.locator('[data-word-nonprinting]')).toHaveCount(0);
  await toggle.click();
  await expect(body.locator('[data-word-nonprinting="tab"]')).toHaveCount(2);
});
