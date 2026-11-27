import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import {
  Document,
  Paragraph,
  ImageRun,
  Packer,
  TextRun,
} from '../docs/node_modules/docx/dist/index.mjs';
import JSZip from '../docs/node_modules/jszip/lib/index.js';

test('floating Word pictures wrap, move, undo and keep page anchors through native export', async ({
  page,
}, info) => {
  const document = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new ImageRun({
                type: 'png',
                data: Buffer.from(
                  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y3nRmwAAAAASUVORK5CYII=',
                  'base64'
                ),
                transformation: { width: 180, height: 110 },
                altText: { name: '布局示意图', description: '布局示意图', title: '布局示意图' },
              }),
              new TextRun('图片后的文字需要自然环绕。'.repeat(12)),
            ],
          }),
          new Paragraph('下一段文字仍然可以继续编辑。'.repeat(8)),
        ],
      },
    ],
  });
  await page.goto('/#/components/office-studio');
  await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
    name: '浮动图片.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: Buffer.from(await Packer.toArrayBuffer(document)),
  });
  const body = page.getByRole('textbox', { name: 'Word 文档正文' });
  const image = body.getByRole('img', { name: '布局示意图' });
  await expect(image).toBeVisible();
  await image.click();
  await page.getByRole('button', { name: /^图片文字环绕/ }).click();
  await page.getByRole('option', { name: '四周环绕', exact: true }).click();
  const node = body.locator('[data-word-image-node]');
  await expect(node).toHaveCSS('float', 'right');
  await expect(node).toHaveAttribute('data-wrap', 'square');
  await page.screenshot({
    path: info.outputPath('word-image-square.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: /^图片文字环绕/ }).click();
  await page.getByRole('option', { name: '浮于文字上方', exact: true }).click();
  await page.getByRole('button', { name: '图片位置与环绕', exact: true }).click();
  await page.getByRole('button', { name: /^图片水平定位/ }).click();
  await page.getByRole('option', { name: '偏移量（px）', exact: true }).click();
  const horizontal = page.getByRole('spinbutton', { name: '图片水平偏移', exact: true });
  await horizontal.fill('40');
  await horizontal.press('Enter');
  const vertical = page.getByRole('spinbutton', { name: '图片垂直偏移', exact: true });
  await vertical.fill('35');
  await vertical.press('Enter');
  await page.getByRole('button', { name: '完成', exact: true }).click();
  const before = await image.boundingBox();
  const mover = page.getByRole('button', { name: '移动浮动图片', exact: true });
  await mover.focus();
  await mover.press('Shift+ArrowRight');
  await expect(node).toHaveAttribute('data-word-image-layout', /"offset":50/);
  const after = await image.boundingBox();
  expect(after!.x - before!.x).toBeGreaterThan(5);
  await page.getByRole('tab', { name: '开始', exact: true }).click();
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  await image.click();
  await page.getByRole('button', { name: '图片位置与环绕', exact: true }).click();
  await expect(page.getByRole('spinbutton', { name: '图片水平偏移', exact: true })).toHaveValue(
    '40'
  );
  await page.getByRole('checkbox', { name: '随文字移动', exact: true }).uncheck();
  await expect(page.getByRole('button', { name: /^图片垂直基准/ })).toContainText('页面');
  await page.getByRole('button', { name: '完成', exact: true }).click();
  await page.screenshot({
    path: info.outputPath('word-image-page-anchor.png'),
    fullPage: true,
    animations: 'disabled',
  });
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出文件', exact: true }).click();
  const download = await pending;
  const buffer = await readFile((await download.path())!);
  const zip = await JSZip.loadAsync(buffer);
  const native = await zip.file('word/document.xml')!.async('string');
  expect(native).toContain('<wp:anchor');
  expect(native).toContain('<wp:positionV relativeFrom="page">');
  expect(native).toContain('<wp:wrapNone');
  await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
    name: '重开浮动图片.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer,
  });
  await expect(image).toBeVisible();
  await image.click();
  await expect(page.getByRole('button', { name: /^图片文字环绕/ })).toContainText('浮于文字上方');
  await page.getByRole('button', { name: '图片位置与环绕', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: '随文字移动', exact: true })).not.toBeChecked();
  await page.getByRole('button', { name: '完成', exact: true }).click();
  await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  await page.getByRole('button', { name: '图片位置与环绕', exact: true }).click();
  await page.screenshot({
    path: info.outputPath('word-image-position-dark.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.setViewportSize({ width: 320, height: 720 });
  const positionDialog = page.getByRole('dialog', { name: '图片位置与环绕', exact: true });
  const geometry = await positionDialog.boundingBox();
  expect(geometry!.width).toBeLessThanOrEqual(320);
  const sizes = await positionDialog.evaluate((element) => ({
    width: element.clientWidth,
    scroll: element.scrollWidth,
  }));
  expect(sizes.scroll).toBeLessThanOrEqual(sizes.width + 1);
  await page.screenshot({
    path: info.outputPath('word-image-position-320.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: '完成', exact: true }).click();
  await expect(body).toContainText('下一段文字仍然可以继续编辑');
});
