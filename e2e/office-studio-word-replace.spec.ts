import { expect, test } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import JSZip from '../docs/node_modules/jszip/lib/index.js';

test('replaces a native cropped image with JPEG, keeps its frame and restores original bytes with history', async ({
  page,
}) => {
  const audit = path.resolve('docs/audits/2026-11-26/word-image-replace');
  const source = await readFile('docs/audits/2026-11-26/word-image-crop/crop-source.docx');
  const jpeg = await readFile(path.join(audit, 'replacement.jpg'));
  const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
  await page.goto('/#/components/office-studio');
  const importFile = (bytes: Buffer, name: string) =>
    page
      .getByLabel('导入文档文件', { exact: true })
      .setInputFiles({
        name,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: bytes,
      });
  await importFile(source, '原图.docx');
  const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  const image = body.locator('img[data-word-image]');
  await image.click();
  const original = await image.getAttribute('src');
  const replace = async (bytes: Buffer, name: string) => {
    // Install the chooser listener before clicking the real ZUVI toolbar action.
    const pending = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: '替换图片', exact: true }).click();
    await (
      await pending
    ).setFiles({
      name,
      mimeType: name.endsWith('.jpg') ? 'image/jpeg' : 'image/png',
      buffer: bytes,
    });
  };
  await replace(Buffer.from('<svg/>'), 'invalid.png');
  await expect(page.getByRole('status').filter({ hasText: '请选择有效' })).toBeVisible();
  await expect(image).toHaveAttribute('src', original!);
  await replace(jpeg, '替换.jpg');
  await expect(image).toHaveAttribute('src', `data:image/jpeg;base64,${jpeg.toString('base64')}`);
  await expect(image).toHaveAttribute('width', '300');
  await expect(image).toHaveAttribute('height', '150');
  await expect(image).toHaveAttribute('alt', '四色原图');
  await expect(image).not.toHaveAttribute('data-word-image-crop');
  await expect(body.locator('img[data-word-image]')).toHaveCount(1);
  await page.getByRole('tab', { name: '开始', exact: true }).click();
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  await expect(image).toHaveAttribute('src', original!);
  await expect(image).toHaveAttribute('data-word-image-crop', /"left":25/);
  await page.getByRole('button', { name: '重做', exact: true }).click();
  await expect(image).toHaveAttribute('src', `data:image/jpeg;base64,${jpeg.toString('base64')}`);
  for (let round = 1; round <= 2; round++) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await pending).path())!);
    await writeFile(path.join(audit, `replacement-round-${round}.docx`), bytes);
    const zip = await JSZip.loadAsync(bytes),
      media = Object.values(zip.files).filter(
        (file) => file.name.startsWith('word/media/') && !file.dir
      );
    expect(media).toHaveLength(1);
    expect(hash(await media[0].async('nodebuffer'))).toBe(hash(jpeg));
    await importFile(bytes, `替换重开${round}.docx`);
    await expect(image).toHaveAttribute('src', `data:image/jpeg;base64,${jpeg.toString('base64')}`);
    await expect(image).toHaveAttribute('width', '300');
    await expect(image).toHaveAttribute('height', '150');
    await expect(image).not.toHaveAttribute('data-word-image-crop');
  }
  await image.click();
  await page.screenshot({ path: path.join(audit, 'replace-light.png'), fullPage: true });
  await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  await page.screenshot({ path: path.join(audit, 'replace-dark.png'), fullPage: true });
  await page.setViewportSize({ width: 320, height: 720 });
  await page.getByRole('button', { name: '替换图片', exact: true }).scrollIntoViewIfNeeded();
  await expect(page.getByRole('button', { name: '替换图片', exact: true })).toBeVisible();
  await page.screenshot({ path: path.join(audit, 'replace-320.png'), fullPage: true });
  await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  await image.click();
  await expect(page.getByRole('button', { name: '替换图片', exact: true })).toBeDisabled();
  await expect(body).toContainText('图片裁剪保留原图与文档内容。');
});
