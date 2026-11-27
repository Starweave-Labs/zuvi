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
async function nativePositions(bytes: ArrayBuffer | Buffer) {
  const zip = await JSZip.loadAsync(bytes);
  for (const part of ['word/document.xml', 'word/styles.xml', 'word/header1.xml', 'word/footer1.xml']) {
    const entry = zip.file(part);
    if (!entry) continue;
    zip.file(part, (await entry.async('string')).replace(
      /(<w:position\b[^>]*\bw:val=")([+-]?(?:\d+(?:\.\d*)?|\.\d+))pt(")/g,
      (_match, start, points, end) => `${start}${Math.round(Number(points) * 2)}${end}`
    ));
  }
  return zip.generateAsync({ type: 'nodebuffer' });
}
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
  const source = await nativePositions(await zip.generateAsync({ type: 'nodebuffer' }));
  await writeFile(path.join(audit, 'metrics-source.docx'), source);
  await page.goto('/#/components/office-studio');
  const importFile = (name: string, buffer: Buffer) =>
    page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
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
    expect(text).toContain('w:position w:val="-5"');
    expect(text).toContain('w:spacing w:val="0"');
    expect(await native.file('word/header1.xml')!.async('string')).toContain(
      'w:position w:val="3"'
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

test('baseline shifts expand automatic line boxes while exact line rules retain fixed height through DOCX reopening', async ({
  page,
}) => {
  const directory = path.resolve('docs/audits/2026-11-26/word-baseline-line-rules');
  await mkdir(directory, { recursive: true });
  const source = await nativePositions(
    await Packer.toArrayBuffer(
      new Document({
        sections: [
          {
            children: [
              new Paragraph({
                spacing: { before: 0, after: 0, line: 240, lineRule: 'auto' },
                children: [
                  new TextRun({ text: 'Raised auto', font: 'Arial', size: 24, position: '12pt' }),
                  new TextRun({ text: ' Base auto', font: 'Arial', size: 24 }),
                ],
              }),
              new Paragraph({
                spacing: { before: 400, after: 0, line: 240, lineRule: 'exact' },
                children: [
                  new TextRun({ text: 'Raised exact', font: 'Arial', size: 24, position: '12pt' }),
                  new TextRun({ text: ' Base exact', font: 'Arial', size: 24 }),
                ],
              }),
              new Paragraph({
                spacing: { before: 400, after: 0, line: 240, lineRule: 'auto' },
                children: [
                  new TextRun({
                    text: 'Raised reference',
                    font: 'Arial',
                    size: 24,
                    position: '0pt',
                  }),
                  new TextRun({ text: ' Base reference', font: 'Arial', size: 24 }),
                ],
              }),
              new Paragraph({
                spacing: { before: 400, after: 0, line: 240, lineRule: 'auto' },
                children: [
                  new TextRun({ text: 'Lowered auto', font: 'Arial', size: 24, position: '-12pt' }),
                  new TextRun({ text: ' Base lowered', font: 'Arial', size: 24 }),
                ],
              }),
              new Paragraph({
                spacing: { before: 400, after: 0, line: 240, lineRule: 'atLeast' },
                children: [
                  new TextRun({
                    text: 'Raised minimum',
                    font: 'Arial',
                    size: 24,
                    position: '12pt',
                  }),
                  new TextRun({ text: ' Base minimum', font: 'Arial', size: 24 }),
                ],
              }),
            ],
          },
        ],
      })
    )
  );
  await writeFile(path.join(directory, 'baseline-line-rules-source.docx'), source);
  await page.goto('/#/components/office-studio');
  const importFile = (name: string, buffer: Buffer) =>
    page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
      name,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer,
    });
  await importFile('Baseline line rules.docx', source);
  const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  const automatic = body.locator('p').filter({ hasText: 'Raised auto' });
  const exact = body.locator('p').filter({ hasText: 'Raised exact' });
  const measurements = [];
  for (let pass = 0; pass <= 2; pass++) {
    await expect(automatic).toHaveAttribute('data-word-line-rule', 'auto');
    await expect(exact).toHaveAttribute('data-word-line-rule', 'exact');
    const geometry = await body.evaluate((element) => {
      const paragraphs = element.querySelectorAll('p');
      const scale = element.getBoundingClientRect().width / (element as HTMLElement).offsetWidth;
      return Array.from(paragraphs).map((p) => {
        const span = p.querySelector('[data-word-baselineshift]') ?? p.querySelector('span')!;
        const rect = p.getBoundingClientRect();
        const style = getComputedStyle(span);
        return {
          baseGlyphTop: (p.lastElementChild!.getBoundingClientRect().top - rect.top) / scale,
          glyphHeight: span.getBoundingClientRect().height / scale,
          fontSize: Number.parseFloat(style.fontSize),
          height: rect.height / scale,
          glyphTop: (span.getBoundingClientRect().top - rect.top) / scale,
          position: style.position,
          top: style.top,
          align: style.verticalAlign,
        };
      });
    });
    expect(geometry[0].height).toBeGreaterThan(geometry[1].height);
    // Inline glyph boxes include font bearings; the paragraph's inherited strut can
    // differ from Arial's box. Compare the two runs in the same line instead.
    expect(geometry[0].baseGlyphTop - geometry[0].glyphTop).toBeCloseTo(16, 0);
    expect(geometry[0].height).toBeCloseTo(geometry[0].fontSize + 16, 0);
    expect(geometry[0].glyphTop + geometry[0].glyphHeight).toBeLessThan(geometry[0].height);
    expect(geometry[1].glyphTop - geometry[1].baseGlyphTop).toBeCloseTo(-16, 0);
    expect(geometry[0].glyphTop - geometry[1].glyphTop).toBeCloseTo(16, 0);
    expect(geometry[2].baseGlyphTop - geometry[2].glyphTop).toBeCloseTo(0, 0);
    expect(geometry[1].height).toBeCloseTo(16, 0);
    expect(geometry[1].glyphTop).toBeLessThan(0);
    expect(geometry[1].position).toBe('relative');
    expect(geometry[1].align).toBe('top');
    expect(geometry[3].glyphTop - geometry[3].baseGlyphTop).toBeCloseTo(16, 0);
    expect(geometry[3].height).toBeGreaterThan(geometry[2].height);
    expect(geometry[4].baseGlyphTop - geometry[4].glyphTop).toBeCloseTo(16, 0);
    expect(geometry[4].height).toBeGreaterThan(geometry[2].height);
    measurements.push(geometry);
    if (pass === 2) break;
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await pending).path())!);
    await writeFile(path.join(directory, `baseline-line-rules-roundtrip-${pass + 1}.docx`), bytes);
    const xml = await (await JSZip.loadAsync(bytes)).file('word/document.xml')!.async('string');
    expect(xml).toContain('w:lineRule="exact"');
    expect(xml.match(/w:position w:val="24"/g)).toHaveLength(3);
    expect(xml).toContain('w:position w:val="-24"');
    expect(xml).toContain('w:lineRule="atLeast"');
    expect(xml).toContain('w:position w:val="0"');
    await importFile(`Baseline-reopened-${pass + 1}.docx`, bytes);
    await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(
      `Baseline-reopened-${pass + 1}.docx`
    );
  }
  await body.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.join(directory, 'baseline-line-rules-light.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  await page.setViewportSize({ width: 320, height: 720 });
  await body.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.join(directory, 'baseline-line-rules-dark-320.png'),
    fullPage: true,
  });
  await writeFile(
    path.join(directory, 'baseline-line-rules-evidence.json'),
    JSON.stringify(measurements, null, 2)
  );
});
