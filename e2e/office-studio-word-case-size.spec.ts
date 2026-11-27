import { expect, test, type Locator } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  Document,
  Paragraph,
  TextRun,
  ExternalHyperlink,
  Packer,
} from '../docs/node_modules/docx/dist/index.mjs';
import JSZip from '../docs/node_modules/jszip/lib/index.js';

const audit = path.resolve('docs/audits/2026-11-25/word-case-size');
async function select(node: Locator) {
  await node.evaluate((element) => {
    (element.closest('[contenteditable="true"]') as HTMLElement).focus();
    const range = document.createRange();
    range.selectNodeContents(element);
    const s = window.getSelection()!;
    s.removeAllRanges();
    s.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  });
}
test('Word font steps and case modes retain mixed formatting, links and selection through native DOCX reopen', async ({
  page,
}) => {
  await mkdir(audit, { recursive: true });
  const document = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: 'Small ', size: 24, bold: true, color: '0055AA' }),
              new ExternalHyperlink({
                link: 'https://example.com',
                children: [new TextRun({ text: 'Large', size: 35 })],
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'hE', bold: true }),
              new ExternalHyperlink({
                link: 'https://example.com/case',
                children: [new TextRun('LLO wORLD. nEXT sENTENCE!')],
              }),
            ],
          }),
          new Paragraph({
            children: [
              new ExternalHyperlink({
                link: 'https://example.com/unicode',
                children: [new TextRun({ text: 'straße ﬁ', italics: true })],
              }),
            ],
          }),
          new Paragraph('caret word'),
        ],
      },
    ],
  });
  await page.goto('/#/components/office-studio');
  await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
    name: 'Case and size.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: Buffer.from(await Packer.toArrayBuffer(document)),
  });
  const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  const mixed = body.locator('p').filter({ hasText: 'Small Large' });
  await expect(mixed).toBeVisible();
  await select(mixed);
  await page.getByRole('button', { name: '增大字号', exact: true }).click();
  await expect(mixed.locator('span').filter({ hasText: 'Small ' })).toHaveCSS(
    'font-size',
    '18.6667px'
  );
  await expect(mixed.locator('a span')).toHaveCSS('font-size', '24px');
  await expect(mixed.locator('a')).toHaveAttribute('href', 'https://example.com');
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  await expect(mixed.locator('a span')).toHaveCSS('font-size', '23.3333px');
  await page.getByRole('button', { name: '重做', exact: true }).click();
  await expect(mixed.locator('a span')).toHaveCSS('font-size', '24px');
  const sentence = body.locator('p').filter({ hasText: /hello world/i });
  await select(sentence);
  await page.getByRole('button', { name: '变更大小写', exact: true }).click();
  await page.getByRole('menuitem', { name: '句首字母大写', exact: true }).click();
  await expect(sentence).toHaveText('Hello world. Next sentence!');
  await expect(sentence.locator('a')).toHaveAttribute('href', 'https://example.com/case');
  expect(await page.evaluate(() => window.getSelection()?.toString())).toBe(
    'Hello world. Next sentence!'
  );
  await page.getByRole('button', { name: '变更大小写', exact: true }).click();
  await page.getByRole('menuitem', { name: '每个单词首字母大写', exact: true }).click();
  await expect(sentence).toHaveText('Hello World. Next Sentence!');
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  await expect(sentence).toHaveText('Hello world. Next sentence!');
  await page.getByRole('button', { name: '重做', exact: true }).click();
  await expect(sentence).toHaveText('Hello World. Next Sentence!');
  const unicode = body.locator('p').filter({ hasText: /straße|STRASSE/ });
  await select(unicode);
  await page.getByRole('button', { name: '变更大小写', exact: true }).click();
  await page.getByRole('menuitem', { name: '全部大写', exact: true }).click();
  await expect(unicode).toHaveText('STRASSE FI');
  expect(await page.evaluate(() => window.getSelection()?.toString())).toBe('STRASSE FI');
  await expect(unicode.locator('a')).toHaveAttribute('href', 'https://example.com/unicode');
  await expect(unicode.locator('em')).toHaveText('STRASSE FI');
  const caret = body.locator('p').filter({ hasText: /word$/ });
  await caret.evaluate((element) => {
    (element.closest('[contenteditable="true"]') as HTMLElement).focus();
    const range = document.createRange();
    range.setStart(element.firstChild!, 2);
    range.collapse(true);
    const s = window.getSelection()!;
    s.removeAllRanges();
    s.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  });
  await page.getByRole('button', { name: '变更大小写', exact: true }).click();
  await page.getByRole('menuitem', { name: '全部大写', exact: true }).click();
  await expect(caret).toHaveText('CARET word');
  await expect.poll(() => page.evaluate(() => window.getSelection()?.anchorOffset)).toBe(2);
  await page.getByRole('button', { name: '增大字号', exact: true }).click();
  await body.pressSequentially('X');
  await expect(caret).toHaveText('CAXRET word');
  await expect(caret.locator('span')).toHaveCSS('font-size', '18.6667px');
  for (let pass = 1; pass <= 2; pass++) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await pending).path())!);
    await writeFile(path.join(audit, `case-size-roundtrip-${pass}.docx`), bytes);
    const zip = await JSZip.loadAsync(bytes);
    const content = await zip.file('word/document.xml')!.async('string');
    const relationships = await zip.file('word/_rels/document.xml.rels')!.async('string');
    expect(content).toContain('STRASSE FI');
    const extracted = content
      .match(/<w:t(?:\s[^>]*)?>(.*?)<\/w:t>/g)!
      .map((run) => run.replace(/<[^>]*>/g, ''))
      .join('');
    expect(extracted).toContain('Hello World. Next Sentence!');
    expect(content).toContain('w:sz w:val="28"');
    expect(content).toContain('w:sz w:val="36"');
    expect(relationships).toContain('https://example.com/unicode');
    await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
      name: 'Reopened.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: bytes,
    });
    await expect(mixed.locator('a span')).toHaveCSS('font-size', '24px');
    await expect(unicode.locator('a')).toHaveText('STRASSE FI');
    await expect(sentence).toHaveText('Hello World. Next Sentence!');
  }
  await page.screenshot({
    path: path.join(audit, 'case-size-light.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  await page.screenshot({
    path: path.join(audit, 'case-size-dark.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.setViewportSize({ width: 320, height: 720 });
  await select(sentence);
  await page.getByRole('button', { name: '变更大小写', exact: true }).click();
  await expect(
    page.getByRole('menuitem', { name: '每个单词首字母大写', exact: true })
  ).toBeVisible();
  await page.screenshot({
    path: path.join(audit, 'case-menu-dark-320.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.keyboard.press('Escape');
  await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  await expect(page.getByRole('button', { name: '增大字号', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: '变更大小写', exact: true })).toBeDisabled();
});
