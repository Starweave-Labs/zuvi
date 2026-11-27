import { expect, test } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { Document, Paragraph, ImageRun, Packer } from '../docs/node_modules/docx/dist/index.mjs';
import JSZip from '../docs/node_modules/jszip/lib/index.js';

test('native image crop preserves original bytes through visual editing, reset, print and two reopenings', async ({
  page,
  context,
}) => {
  const audit = path.resolve('docs/audits/2026-11-26/word-image-crop');
  const original = await readFile(path.join(audit, 'source-bars.png'));
  const hash = (data: Buffer) => createHash('sha256').update(data).digest('hex');
  const source = Buffer.from(
    await Packer.toArrayBuffer(
      new Document({
        sections: [
          {
            children: [
              new Paragraph({
                children: [
                  new ImageRun({
                    type: 'png',
                    data: original,
                    transformation: { width: 300, height: 150 },
                    crop: { left: 25, right: 25 },
                    altText: { name: '四色原图', description: '四色原图', title: '四色原图' },
                  }),
                ],
              }),
              new Paragraph('图片裁剪保留原图与文档内容。'),
            ],
          },
        ],
      })
    )
  );
  await writeFile(path.join(audit, 'crop-source.docx'), source);
  await page.addInitScript(() => {
    window.print = () => {
      window.parent.postMessage(
        { type: 'crop-print', html: document.documentElement.outerHTML },
        '*'
      );
      window.dispatchEvent(new Event('afterprint'));
    };
  });
  await page.goto('/#/components/office-studio');
  const importFile = async (buffer: Buffer, name: string) =>
    page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
      name,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer,
    });
  await importFile(source, '图片裁剪.docx');
  const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  const image = body.getByRole('img', { name: '四色原图', exact: true });
  const frame = body.locator('[data-word-image-crop-frame]');
  await expect(image).toHaveCSS('left', '-150px');
  await image.click();
  await page.getByRole('button', { name: '裁剪图片', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '图片裁剪', exact: true });
  await expect(dialog.getByRole('spinbutton', { name: '左边裁剪百分比' })).toHaveValue('25');
  await dialog.getByRole('spinbutton', { name: '左边裁剪百分比' }).fill('30');
  await dialog.getByRole('button', { name: '取消', exact: true }).click();
  await expect(image).toHaveCSS('left', '-150px');
  await page.getByRole('button', { name: '裁剪图片', exact: true }).click();
  const handle = dialog.getByRole('button', { name: '拖动左边裁剪' });
  const handleBox = (await handle.boundingBox())!;
  const previewBox = (await dialog.locator('[data-word-crop-preview]').boundingBox())!;
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    handleBox.x + handleBox.width / 2 + previewBox.width * 0.05,
    handleBox.y + handleBox.height / 2
  );
  await page.mouse.up();
  const dragged = Number(
    await dialog.getByRole('spinbutton', { name: '左边裁剪百分比' }).inputValue()
  );
  expect(dragged).toBeGreaterThan(29.8);
  expect(dragged).toBeLessThan(30.2);
  await dialog.getByRole('spinbutton', { name: '左边裁剪百分比' }).fill('30');
  await dialog.getByRole('spinbutton', { name: '右边裁剪百分比' }).fill('80');
  await expect(dialog.getByRole('button', { name: '应用裁剪' })).toBeDisabled();
  await dialog.getByRole('spinbutton', { name: '右边裁剪百分比' }).fill('25');
  await page.screenshot({
    path: path.join(audit, 'crop-light.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await dialog.getByRole('button', { name: '应用裁剪' }).click();
  await expect(image).toHaveAttribute('data-word-image-crop', /"left":30/);
  await page.getByRole('tab', { name: '开始', exact: true }).click();
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  await expect(image).toHaveAttribute('data-word-image-crop', /"left":25/);
  await page.getByRole('button', { name: '重做', exact: true }).click();
  await expect(image).toHaveAttribute('data-word-image-crop', /"left":30/);
  const exportFile = async () => {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    return readFile((await (await pending).path())!);
  };
  for (let round = 1; round <= 2; round++) {
    const bytes = await exportFile();
    await writeFile(path.join(audit, `crop-round-${round}.docx`), bytes);
    const zip = await JSZip.loadAsync(bytes);
    const xml = await zip.file('word/document.xml')!.async('string');
    expect(xml).toContain('l="30000"');
    expect(xml).toContain('r="25000"');
    const media = Object.values(zip.files).filter(
      (file) => file.name.startsWith('word/media/') && !file.dir
    );
    expect(media).toHaveLength(1);
    expect(hash(await media[0].async('nodebuffer'))).toBe(hash(original));
    await importFile(bytes, `重开裁剪${round}.docx`);
    await expect(image).toHaveAttribute('data-word-image-crop', /"left":30/);
    await expect(frame).toHaveCSS('overflow', 'hidden');
  }
  await page.evaluate(() =>
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'crop-print')
        (window as Window & { cropPrint?: string }).cropPrint = event.data.html;
    })
  );
  await page.getByRole('button', { name: '打印', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => (window as Window & { cropPrint?: string }).cropPrint))
    .toBeTruthy();
  const printed = await page.evaluate(() => (window as Window & { cropPrint?: string }).cropPrint!);
  await writeFile(path.join(audit, 'crop-print.html'), printed);
  const preview = await context.newPage();
  await preview.setContent(printed);
  const printedFrame = preview.locator('[data-word-image-crop-frame]');
  await expect(printedFrame).toHaveCSS('width', '300px');
  await expect(printedFrame).toHaveCSS('height', '150px');
  await expect(printedFrame.locator('img')).toHaveCSS('left', '-200px');
  await preview.screenshot({ path: path.join(audit, 'crop-print.png'), fullPage: true });
  await preview.close();
  await image.click();
  await page.getByRole('button', { name: '裁剪图片', exact: true }).click();
  await dialog.getByRole('button', { name: '重置裁剪', exact: true }).click();
  await dialog.getByRole('button', { name: '应用裁剪', exact: true }).click();
  await expect(image).not.toHaveAttribute('data-word-image-crop');
  await page.getByRole('tab', { name: '开始', exact: true }).click();
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  await expect(image).toHaveAttribute('data-word-image-crop', /"left":30/);
  await image.click();
  await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  await page.getByRole('button', { name: '裁剪图片', exact: true }).click();
  await page.screenshot({
    path: path.join(audit, 'crop-dark.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.setViewportSize({ width: 320, height: 720 });
  const geometry = await dialog.boundingBox();
  expect(geometry!.width).toBeLessThanOrEqual(320);
  const size = await dialog.evaluate((element) => ({
    width: element.clientWidth,
    scroll: element.scrollWidth,
  }));
  expect(size.scroll).toBeLessThanOrEqual(size.width + 1);
  await page.screenshot({
    path: path.join(audit, 'crop-320.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await dialog.getByRole('button', { name: '取消', exact: true }).click();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  await image.click();
  await expect(page.getByRole('button', { name: '裁剪图片', exact: true })).toBeDisabled();
  await expect(body).toContainText('图片裁剪保留原图与文档内容。');
});
