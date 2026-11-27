import { expect, test, type Locator } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  Document,
  Paragraph,
  TextRun,
  Packer,
  LineRuleType,
  Header,
} from '../docs/node_modules/docx/dist/index.mjs';
import JSZip from '../docs/node_modules/jszip/lib/index.js';

const audit = path.resolve('docs/audits/2026-11-25/word-paragraph');
async function select(node: Locator) {
  await node.evaluate((element) => {
    (element.closest('[contenteditable="true"]') as HTMLElement).focus();
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  });
}
test('paragraph dialog and ruler preserve native indent and line rules with cancellation, history and repeated DOCX reopening', async ({
  page,
}) => {
  await mkdir(audit, { recursive: true });
  const doc = new Document({
    styles: { paragraphStyles: [{ id: 'HeaderReview', name: 'Header review', paragraph: {
      spacing: { line: 360, lineRule: LineRuleType.AUTO }, indent: { left: 160 },
    } }] },
    sections: [
      {
        headers: { default: new Header({ children: [new Paragraph({ style: 'HeaderReview', children: [new TextRun('Named header')] })] }) },
        children: [
          new Paragraph({
            indent: { left: 160, firstLine: 80 },
            spacing: { line: 360, lineRule: LineRuleType.AUTO, after: 120 },
            children: [new TextRun({ text: 'First paragraph', bold: true })],
          }),
          new Paragraph({
            indent: { left: 320, hanging: 80 },
            spacing: { line: 360, lineRule: LineRuleType.EXACT, after: 180 },
            children: [new TextRun('Second paragraph')],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Two lines', size: 48 }),
              new TextRun({ text: 'Second line', break: 1, size: 48 }),
            ],
          }),
        ],
      },
    ],
  });
  const source = Buffer.from(await Packer.toArrayBuffer(doc));
  await writeFile(path.join(audit, 'paragraph-source.docx'), source);
  await page.goto('/#/components/office-studio');
  const importFile = (name: string, buffer: Buffer) =>
    page
      .getByLabel('导入文档文件', { exact: true })
      .setInputFiles({
        name,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer,
      });
  await importFile('Paragraph.docx', source);
  const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  const first = body.locator('p').filter({ hasText: 'First paragraph' }),
    second = body.locator('p').filter({ hasText: 'Second paragraph' }),
    lines = body.locator('p').filter({ hasText: 'Two lines' });
  await expect(first).toBeVisible();
  const open = async (node: Locator) => {
    await select(node);
    await page.getByRole('button', { name: '段落设置', exact: true }).click();
    return page.getByRole('dialog', { name: '段落设置', exact: true });
  };
  const choose = async (label: string, value: string) => {
    await page
      .getByRole('dialog')
      .getByRole('button', { name: new RegExp(`^${label}`) })
      .click();
    await page.getByRole('option', { name: value, exact: true }).click();
  };
  const submit = () =>
    page.getByRole('dialog').getByRole('button', { name: '应用段落设置', exact: true }).click();
  const header = page.getByRole('textbox', { name: 'Word 页眉', exact: true });
  await page.getByLabel('页眉区域', { exact: true }).dblclick();
  await page.getByRole('tab', { name: '开始', exact: true }).click();
  const headerDialog = await open(header.locator('p').filter({ hasText: 'Named header' }));
  await expect(headerDialog.getByLabel('左缩进（pt）', { exact: true })).toHaveValue('8');
  await headerDialog.getByLabel('左缩进（pt）', { exact: true }).fill('24');
  await submit();
  await expect(header.locator('p')).toHaveCSS('margin-left', '32px');
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  expect(await header.locator('p').evaluate((el) => parseFloat(getComputedStyle(el).marginLeft))).toBeCloseTo(8 * 4 / 3, 3);
  await page.getByRole('button', { name: '重做', exact: true }).click();
  await page.getByRole('tab', { name: '页眉和页脚', exact: true }).click();
  await page.getByRole('button', { name: '关闭页眉和页脚', exact: true }).click();
  await first.evaluate((element) => {
    (element.closest('[contenteditable="true"]') as HTMLElement).focus();
    const range = document.createRange();
    range.setStartBefore(element);
    range.setEndAfter(element.nextElementSibling!);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  });
  await page.getByRole('button', { name: '段落设置', exact: true }).click();
  await page.getByLabel('左缩进（pt）', { exact: true }).fill('30');
  await page.getByLabel('右缩进（pt）', { exact: true }).fill('10');
  await choose('特殊缩进', '悬挂');
  await page.getByLabel('特殊缩进量（pt）', { exact: true }).fill('12');
  await choose('行距类型', '固定值');
  await page.getByLabel('行距量', { exact: true }).fill('24');
  await submit();
  await expect(first).toHaveCSS('margin-left', '40px');
  await expect(second).toHaveCSS('text-indent', '-16px');
  await expect(first).toHaveCSS('line-height', '32px');
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  expect(await first.evaluate((el) => parseFloat(getComputedStyle(el).marginLeft))).toBeCloseTo(
    (8 * 4) / 3,
    3
  );
  await page.getByRole('button', { name: '重做', exact: true }).click();
  await expect(first).toHaveCSS('margin-left', '40px');
  let dialog = await open(first);
  await dialog.getByLabel('左缩进（pt）', { exact: true }).fill('1x');
  await expect(dialog.getByRole('alert')).toBeVisible();
  await expect(dialog.getByRole('button', { name: '应用段落设置', exact: true })).toBeDisabled();
  await dialog.getByRole('button', { name: '取消', exact: true }).click();
  await select(first);
  const left = page.getByRole('slider', { name: '左缩进标尺', exact: true });
  await left.focus();
  await left.press('Shift+ArrowRight');
  await expect(left).toHaveAttribute('aria-valuenow', '40');
  await expect(first).toHaveCSS('text-indent', '-16px');
  const firstLine = page.getByRole('slider', { name: '首行缩进标尺', exact: true });
  await firstLine.focus();
  await firstLine.press('ArrowRight');
  await expect(firstLine).toHaveAttribute('aria-valuenow', '-11');
  const handle = await left.boundingBox();
  await page.mouse.move(handle!.x + handle!.width / 2, handle!.y + handle!.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle!.x + handle!.width / 2 + 30, handle!.y + handle!.height / 2, {
    steps: 4,
  });
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await expect(left).toHaveAttribute('aria-valuenow', '40');
  const next = await left.boundingBox();
  const ruler = left.locator('xpath=..');
  const rulerBox = await ruler.boundingBox();
  const zoom = rulerBox!.width / ((210 * 96) / 25.4);
  await page.mouse.move(next!.x + next!.width / 2, next!.y + next!.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    next!.x + next!.width / 2 + ((10 * 4) / 3) * zoom,
    next!.y + next!.height / 2,
    { steps: 4 }
  );
  await page.mouse.up();
  expect(Number(await left.getAttribute('aria-valuenow'))).toBeCloseTo(50, 0);
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  await expect(left).toHaveAttribute('aria-valuenow', '40');
  await page.getByRole('button', { name: '重做', exact: true }).click();
  dialog = await open(lines);
  await choose('行距类型', '固定值');
  await dialog.getByLabel('行距量', { exact: true }).fill('24');
  await submit();
  await expect(lines).toHaveCSS('line-height', '32px');
  expect((await lines.boundingBox())!.height).toBeCloseTo(64, 0);
  dialog = await open(second);
  await choose('行距类型', '最小值');
  await dialog.getByLabel('行距量', { exact: true }).fill('30');
  await submit();
  await expect(second).toHaveAttribute('data-word-line-rule', 'atLeast');
  for (let pass = 1; pass <= 2; pass++) {
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await download).path())!);
    await writeFile(path.join(audit, `paragraph-roundtrip-${pass}.docx`), bytes);
    const zip = await JSZip.loadAsync(bytes),
      xml = await zip.file('word/document.xml')!.async('string');
    expect(xml).toContain('w:line="480"');
    expect(xml).toContain('w:lineRule="exact"');
    expect(xml).toContain('w:lineRule="atLeast"');
    expect(xml).toContain('w:hanging="220"');
    await importFile(`Reopened-${pass}.docx`, bytes);
    await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(
      `Reopened-${pass}.docx`
    );
    await expect(second).toHaveAttribute('data-word-line-rule', 'atLeast');
    await expect(lines).toHaveCSS('line-height', '32px');
    await expect(header.locator('p')).toHaveCSS('margin-left', '32px');
  }
  await first.scrollIntoViewIfNeeded();
  await body.evaluate((element) => element.closest('.zuvi-office-studio')?.scrollIntoView({ block: 'start' }));
  await page.screenshot({
    path: path.join(audit, 'paragraph-results-light.png'),
    fullPage: true,
    animations: 'disabled',
  });
  for (const small of [false, true]) {
    if (small) await page.setViewportSize({ width: 320, height: 720 });
    for (const theme of ['light', 'dark']) {
      if (theme === 'dark')
        await page.getByRole('button', { name: '切换暗色', exact: true }).click();
      dialog = await open(first);
      await expect(dialog.getByRole('button', { name: '应用段落设置', exact: true })).toBeVisible();
      const box = await dialog.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.width).toBeLessThanOrEqual(small ? 320 : 1280);
      await page.screenshot({
        path: path.join(audit, `paragraph-dialog-${theme}${small ? '-320' : ''}.png`),
        fullPage: true,
        animations: 'disabled',
      });
      await dialog.press('Escape');
      if (theme === 'dark')
        await page.getByRole('button', { name: '切换浅色', exact: true }).click();
    }
  }
  await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  await expect(page.getByRole('button', { name: '段落设置', exact: true })).toBeDisabled();
  await expect(page.getByRole('slider', { name: '左缩进标尺', exact: true })).toBeDisabled();
});
