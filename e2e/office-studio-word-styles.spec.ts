import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import JSZip from '../docs/node_modules/jszip/lib/index.js';

for (const theme of ['light', 'dark'] as const) {
  test(`Word named styles edit and export through the real browser in ${theme} mode`, async ({
    page,
  }, info) => {
    await page.goto('/#/components/office-studio');
    const body = page.getByRole('textbox', { name: 'Word 文档正文' });
    await expect(body).toBeVisible();
    if (theme === 'dark') await page.getByRole('button', { name: '切换暗色', exact: true }).click();
    const paragraph = body.locator('p').filter({ hasText: '在页面中直接编辑正文' }).first();
    await paragraph.click({ clickCount: 3 });
    await page.getByRole('button', { name: '新建段落样式' }).click();
    const dialog = page.getByRole('dialog', { name: '新建段落样式' });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('样式名称', { exact: true }).fill('浏览器复核正文');
    await dialog.getByLabel('样式字号', { exact: true }).fill('14');
    await expect(dialog.getByLabel('样式预览', { exact: true })).toHaveCSS(
      'background-color',
      'rgb(255, 255, 255)'
    );
    await page.screenshot({
      path: info.outputPath(`word-style-dialog-${theme}.png`),
      fullPage: true,
      animations: 'disabled',
    });
    await dialog.getByLabel('样式预览', { exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({
      path: info.outputPath(`word-style-preview-${theme}.png`),
      fullPage: true,
      animations: 'disabled',
    });
    await dialog.getByRole('button', { name: '保存样式' }).click();
    await expect(dialog).toBeHidden();
    await page.getByRole('button', { name: /^段落样式/ }).click();
    await page.getByRole('option', { name: '浏览器复核正文', exact: true }).click();
    await expect(paragraph).toHaveAttribute('data-word-style', /^style-/);
    await expect(paragraph.locator('span').first()).toHaveCSS('font-size', '18.6667px');
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const download = await pending;
    const path = await download.path();
    expect(path).toBeTruthy();
    const zip = await JSZip.loadAsync(await readFile(path!));
    const styles = await zip.file('word/styles.xml')!.async('string');
    const content = await zip.file('word/document.xml')!.async('string');
    expect(styles).toContain('浏览器复核正文');
    expect(content).toMatch(/w:pStyle w:val="ZuviStyle_style-/);
    await page.screenshot({
      path: info.outputPath(`word-style-applied-${theme}.png`),
      fullPage: true,
      animations: 'disabled',
    });
  });
}

test('Word style dialog fits a 320px viewport and cancels without editing the document', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('/#/components/office-studio');
  const body = page.getByRole('textbox', { name: 'Word 文档正文' });
  await expect(body).toBeVisible();
  const before = await body.textContent();
  await page.getByRole('button', { name: '新建段落样式' }).click();
  const dialog = page.getByRole('dialog', { name: '新建段落样式' });
  await expect(dialog).toBeVisible();
  const geometry = await dialog.boundingBox();
  expect(geometry!.x).toBeGreaterThanOrEqual(0);
  expect(geometry!.x + geometry!.width).toBeLessThanOrEqual(321);
  const sizes = await dialog.evaluate((element) => ({
    client: element.clientWidth,
    scroll: element.scrollWidth,
  }));
  expect(sizes.scroll).toBeLessThanOrEqual(sizes.client + 1);
  await dialog.getByLabel('样式名称', { exact: true }).fill('取消的样式');
  await page.screenshot({
    path: info.outputPath('word-style-dialog-320.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await dialog.getByRole('button', { name: '取消', exact: true }).click();
  await expect(dialog).toBeHidden();
  expect(await body.textContent()).toBe(before);
});
