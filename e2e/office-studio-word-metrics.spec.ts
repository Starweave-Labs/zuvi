import { expect, test, type Locator } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  Document,
  Paragraph,
  TextRun,
  ExternalHyperlink,
  Header,
  Footer,
  Packer,
} from '../docs/node_modules/docx/dist/index.mjs';
import JSZip from '../docs/node_modules/jszip/lib/index.js';

const audit = path.resolve('docs/audits/2026-11-25/word-metrics');
async function select(node: Locator, caret = false) {
  await node.evaluate((element, empty) => {
    (element.closest('[contenteditable="true"]') as HTMLElement).focus();
    const range = document.createRange();
    range.selectNodeContents(element);
    if (empty) range.collapse(false);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  }, caret);
}
test('character metrics preserve native typography, zero overrides, caret input, undo and two DOCX reopen cycles in both themes and at 320px', async ({
  page,
}) => {
  await mkdir(audit, { recursive: true });
  const document = new Document({
    styles: {
      paragraphStyles: [
        { id: 'Wide', name: 'Wide metrics', run: { characterSpacing: 40, position: '3pt' } },
      ],
    },
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Header', characterSpacing: 6, position: '1.5pt' })],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Footer', characterSpacing: -2, position: '-1.5pt' }),
                ],
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'A 中😀',
                size: 28,
                bold: true,
                characterSpacing: 24,
                position: '2pt',
              }),
              new ExternalHyperlink({
                link: 'https://example.com/metrics',
                children: [
                  new TextRun({
                    text: 'B',
                    size: 60,
                    italics: true,
                    characterSpacing: -10,
                    position: '-2.5pt',
                  }),
                ],
              }),
            ],
          }),
          new Paragraph('Caret'),
          new Paragraph({
            style: 'Wide',
            children: [new TextRun('Inherited'), new TextRun({ text: 'Zero', position: '0pt' })],
          }),
        ],
      },
    ],
  });
  const zip = await JSZip.loadAsync(await Packer.toArrayBuffer(document));
  const xml = await zip.file('word/document.xml')!.async('string');
  zip.file(
    'word/document.xml',
    xml.replace(/<w:r\b[^>]*>[\s\S]*?<\/w:r>/g, (run) =>
      run.includes('<w:t>Zero</w:t>')
        ? run.replace('</w:rPr>', '<w:spacing w:val="0"/></w:rPr>')
        : run
    )
  );
  const source = await zip.generateAsync({ type: 'nodebuffer' });
  await writeFile(path.join(audit, 'metrics-source.docx'), source);
  await page.goto('/#/components/office-studio');
  const importFile = (name: string, buffer: Buffer) =>
    page
      .getByLabel('导入文档文件', { exact: true })
      .setInputFiles({
        name,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer,
      });
  await importFile('Metrics.docx', source);
  const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  const mixed = body.locator('p').filter({ hasText: 'A 中😀B' });
  const caret = body.locator('p').filter({ hasText: 'Caret' });
  const zero = body.locator('p').filter({ hasText: 'InheritedZero' });
  await expect(mixed).toBeVisible();
  const open = async (node: Locator, empty = false) => {
    await select(node, empty);
    await page.getByRole('button', { name: '字符间距与位置', exact: true }).click();
    return page.getByRole('dialog', { name: '字符间距与位置', exact: true });
  };
  const choose = async (label: string, mode: string) => {
    await page
      .getByRole('dialog')
      .getByRole('button', { name: new RegExp(`^${label}`) })
      .click();
    await page.getByRole('option', { name: mode, exact: true }).click();
  };
  const submit = () =>
    page.getByRole('dialog').getByRole('button', { name: '应用字符格式', exact: true }).click();
  let dialog = await open(mixed);
  await expect(dialog.getByText('混合（保持原值）', { exact: true })).toHaveCount(2);
  await choose('字符间距', '加宽');
  await dialog.getByLabel('字符间距量（pt）', { exact: true }).fill('1.2');
  await choose('字符位置', '降低');
  await dialog.getByLabel('字符位置量（pt）', { exact: true }).fill('2.5');
  await submit();
  const a = mixed.locator('span[data-word-letterspacing]').filter({ hasText: 'A 中😀' });
  const b = mixed.locator('span[data-word-letterspacing]').filter({ hasText: 'B' });
  await expect(a).toHaveAttribute('data-word-letterspacing', '1.2pt');
  await expect(b).toHaveAttribute('data-word-baselineshift', '-2.5pt');
  expect(await a.evaluate((element) => parseFloat(getComputedStyle(element).fontSize))).toBeCloseTo(
    (14 * 4) / 3,
    3
  );
  expect(await b.evaluate((element) => parseFloat(getComputedStyle(element).fontSize))).toBeCloseTo(
    40,
    3
  );
  await expect(mixed.locator('a')).toHaveAttribute('href', 'https://example.com/metrics');
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  await expect(b).toHaveAttribute('data-word-letterspacing', '-0.5pt');
  await expect(a).toHaveAttribute('data-word-baselineshift', '2pt');
  await page.getByRole('button', { name: '重做', exact: true }).click();
  await expect(b).toHaveAttribute('data-word-letterspacing', '1.2pt');
  dialog = await open(mixed);
  await choose('字符位置', '提升');
  await dialog.getByLabel('字符位置量（pt）', { exact: true }).fill('1.25');
  await expect(dialog.getByRole('alert')).toBeVisible();
  await expect(dialog.getByRole('button', { name: '应用字符格式', exact: true })).toBeDisabled();
  await dialog.getByRole('button', { name: '取消', exact: true }).click();
  await expect(a).toHaveAttribute('data-word-baselineshift', '-2.5pt');
  await open(zero);
  await choose('字符间距', '标准');
  await choose('字符位置', '标准');
  await submit();
  await expect(zero.locator('span[data-word-letterspacing]')).toHaveAttribute(
    'data-word-letterspacing',
    '0pt'
  );
  await open(caret, true);
  await choose('字符间距', '加宽');
  await page.getByLabel('字符间距量（pt）', { exact: true }).fill('0.5');
  await choose('字符位置', '提升');
  await page.getByLabel('字符位置量（pt）', { exact: true }).fill('1');
  await submit();
  await expect(body).toBeFocused();
  await page.keyboard.type('Z');
  await expect(caret).toHaveText('CaretZ');
  await expect(
    caret.locator('span[data-word-letterspacing]').filter({ hasText: 'Z' })
  ).toHaveAttribute('data-word-baselineshift', '1pt');
  for (let pass = 1; pass <= 2; pass++) {
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await download).path())!);
    await writeFile(path.join(audit, `metrics-roundtrip-${pass}.docx`), bytes);
    const native = await JSZip.loadAsync(bytes);
    const text = await native.file('word/document.xml')!.async('string');
    expect(text).toContain('w:spacing w:val="24"');
    expect(text).toContain('w:position w:val="-2.5pt"');
    expect(text).toContain('w:spacing w:val="0"');
    expect(await native.file('word/header1.xml')!.async('string')).toContain(
      'w:position w:val="1.5pt"'
    );
    await importFile(`Reopened-${pass}.docx`, bytes);
    await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(
      `Reopened-${pass}.docx`
    );
    await expect(a).toHaveAttribute('data-word-letterspacing', '1.2pt');
    await expect(b).toHaveAttribute('data-word-baselineshift', '-2.5pt');
    await expect(caret).toHaveText('CaretZ');
    await expect(zero.locator('span[data-word-letterspacing]')).toHaveAttribute(
      'data-word-letterspacing',
      '0pt'
    );
  }
  await body.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.join(audit, 'metrics-results-light.png'),
    fullPage: true,
    animations: 'disabled',
  });
  for (const small of [false, true]) {
    if (small) await page.setViewportSize({ width: 320, height: 720 });
    for (const theme of ['light', 'dark']) {
      if (theme === 'dark')
        await page.getByRole('button', { name: '切换暗色', exact: true }).click();
      dialog = await open(mixed);
      await expect(dialog.getByRole('button', { name: '应用字符格式', exact: true })).toBeVisible();
      const rect = await dialog.boundingBox();
      expect(rect!.x).toBeGreaterThanOrEqual(0);
      expect(rect!.width).toBeLessThanOrEqual(small ? 320 : 1280);
      await page.screenshot({
        path: path.join(audit, `metrics-dialog-${theme}${small ? '-320' : ''}.png`),
        fullPage: true,
        animations: 'disabled',
      });
      await dialog.press('Escape');
      if (theme === 'dark')
        await page.getByRole('button', { name: '切换浅色', exact: true }).click();
    }
  }
  await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  await expect(page.getByRole('button', { name: '字符间距与位置', exact: true })).toBeDisabled();
});
