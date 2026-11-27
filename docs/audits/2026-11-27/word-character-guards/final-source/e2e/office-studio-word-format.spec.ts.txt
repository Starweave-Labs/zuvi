import { expect, test, type Locator } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  Document,
  Paragraph,
  TextRun,
  ExternalHyperlink,
  HeadingLevel,
  AlignmentType,
  Packer,
} from '../docs/node_modules/docx/dist/index.mjs';
import JSZip from '../docs/node_modules/jszip/lib/index.js';

const audit = path.resolve('docs/audits/2026-11-25/word-format');
async function select(node: Locator) {
  await node.evaluate((element) => {
    const root = element.closest('[contenteditable="true"]') as HTMLElement;
    root.focus();
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  });
}

test('Word painting preserves exact formats and links, clears formatting without losing structure and reopens native DOCX', async ({
  page,
}) => {
  await mkdir(audit, { recursive: true });
  const document = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            indent: { left: 360 },
            children: [
              new TextRun({ text: 'Source format', bold: true, size: 36, color: '0055AA' }),
            ],
          }),
          new Paragraph({ children: [new TextRun({ text: 'Target one', bold: true })] }),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new ExternalHyperlink({
                link: 'https://example.com/linked',
                children: [new TextRun({ text: 'Linked heading', italics: true })],
              }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [new TextRun({ text: 'Keep list structure', bold: true })],
          }),
        ],
      },
    ],
  });
  await page.goto('/#/components/office-studio');
  await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
    name: 'Formats.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: Buffer.from(await Packer.toArrayBuffer(document)),
  });
  const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  const source = body.locator('p').filter({ hasText: 'Source format' });
  const target = body.locator('p').filter({ hasText: 'Target one' });
  const heading = body.locator('h2').filter({ hasText: 'Linked heading' });
  await expect(source).toBeVisible();
  await select(source);
  await page.getByRole('button', { name: '格式刷', exact: true }).dblclick();
  await select(target);
  await expect(target.locator('strong')).toHaveText('Target one');
  await expect(target).toHaveCSS('text-align', 'right');
  await expect(target.locator('span').first()).toHaveCSS('font-size', '24px');
  await expect(target.locator('span').first()).toHaveCSS('color', 'rgb(0, 85, 170)');
  await expect(page.getByRole('button', { name: '格式刷', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await select(heading);
  await expect(heading.locator('strong')).toHaveText('Linked heading');
  await expect(heading.locator('a')).toHaveAttribute('href', 'https://example.com/linked');
  await expect(heading.locator('em')).toHaveCount(0);
  await body.press('Escape');
  await expect(page.getByRole('button', { name: '格式刷', exact: true })).not.toHaveAttribute(
    'aria-pressed'
  );
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  await expect(heading.locator('em')).toHaveText('Linked heading');
  await expect(target.locator('strong')).toHaveText('Target one');
  await page.getByRole('button', { name: '重做', exact: true }).click();
  await expect(heading.locator('em')).toHaveCount(0);
  await select(heading);
  await page.getByRole('button', { name: '清除格式', exact: true }).click();
  await expect(heading).toBeVisible();
  await expect(heading.locator('strong')).toHaveCount(0);
  await expect(heading.locator('a')).toHaveAttribute('href', 'https://example.com/linked');
  await expect(body.locator('ul li')).toContainText('Keep list structure');
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  await expect(heading.locator('strong')).toHaveText('Linked heading');
  await page.getByRole('button', { name: '重做', exact: true }).click();
  await expect(heading.locator('strong')).toHaveCount(0);
  for (let pass = 1; pass <= 2; pass++) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await pending).path())!);
    await writeFile(path.join(audit, `formats-roundtrip-${pass}.docx`), bytes);
    const zip = await JSZip.loadAsync(bytes);
    const xml = await zip.file('word/document.xml')!.async('string');
    const relationships = await zip.file('word/_rels/document.xml.rels')!.async('string');
    expect(xml).toContain('Linked heading');
    expect(xml).toContain('<w:hyperlink');
    expect(xml).toContain('<w:numPr>');
    expect(relationships).toContain('https://example.com/linked');
    await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
      name: 'Reopened.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: bytes,
    });
    await expect(heading.locator('a')).toHaveAttribute('href', 'https://example.com/linked');
    await expect(heading.locator('strong')).toHaveCount(0);
    await expect(target.locator('span').first()).toHaveCSS('font-size', '24px');
    await expect(target).toHaveCSS('text-align', 'right');
    await expect(body.locator('ul li')).toContainText('Keep list structure');
  }
  await page.screenshot({
    path: path.join(audit, 'word-format-light.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  await page.screenshot({
    path: path.join(audit, 'word-format-dark.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.setViewportSize({ width: 320, height: 720 });
  await select(target);
  await page.getByRole('button', { name: '格式刷', exact: true }).dblclick();
  await select(heading);
  await body.press('Escape');
  await expect(heading.locator('a')).toHaveAttribute('href', 'https://example.com/linked');
  await page.screenshot({
    path: path.join(audit, 'word-format-320.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  await expect(page.getByRole('button', { name: '格式刷', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: '清除格式', exact: true })).toBeDisabled();
});
