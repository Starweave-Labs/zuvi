import { expect, test } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  Document,
  Paragraph,
  TextRun,
  Packer,
  LineRuleType,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  ExternalHyperlink,
} from '../docs/node_modules/docx/dist/index.mjs';
import JSZip from '../docs/node_modules/jszip/lib/index.js';
const audit = path.resolve('docs/audits/2026-11-26/word-keep');
test('inline picture height moves its own line before the page boundary', async ({ page }) => {
  const document = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            widowControl: false,
            spacing: { line: 360, lineRule: LineRuleType.EXACT },
            children: Array.from(
              { length: 37 },
              (_, index) => new TextRun({ text: `Picture filler ${index}`, break: index ? 1 : 0 })
            ),
          }),
          new Paragraph({
            widowControl: false,
            children: [
              new ImageRun({
                type: 'png',
                data: Buffer.from(
                  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y3nRmwAAAAASUVORK5CYII=',
                  'base64'
                ),
                transformation: { width: 180, height: 200 },
                altText: { name: '分页图片', title: '分页图片', description: '分页图片' },
              }),
              new TextRun({ text: 'After picture', break: 1 }),
            ],
          }),
        ],
      },
    ],
  });
  const pictureAudit = path.resolve('docs/audits/2026-11-26/word-inline-pagination');
  await mkdir(pictureAudit, { recursive: true });
  const source = Buffer.from(await Packer.toArrayBuffer(document));
  await writeFile(path.join(pictureAudit, 'inline-source.docx'), source);
  await page.goto('/#/components/office-studio');
  await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
    name: 'Inline-page.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: source,
  });
  const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  await expect(body.getByRole('img', { name: '分页图片' })).toBeVisible();
  await page.getByRole('tab', { name: '视图', exact: true }).click();
  await page.getByRole('checkbox', { name: '分页布局', exact: true }).click();
  const paragraph = body.locator('p').filter({ has: page.getByRole('img', { name: '分页图片' }) });
  await expect(paragraph).toHaveAttribute('data-word-page-first', '2');
  await expect(paragraph).toHaveAttribute('data-word-page-last', '2');
  await expect(body).toHaveAttribute('data-word-pagination-overflow', 'false');
  const image = body.getByRole('img', { name: '分页图片' });
  const gap = body.locator('[data-word-auto-page-gap]').first();
  await expect(gap).toHaveCount(1);
  expect((await image.boundingBox())!.y).toBeGreaterThanOrEqual(
    (await gap.boundingBox())!.y + (await gap.boundingBox())!.height - 1
  );
  await image.click();
  await page.getByRole('tab', { name: '插入', exact: true }).click();
  await page.getByRole('checkbox', { name: '保持比例', exact: true }).uncheck();
  await page.getByRole('spinbutton', { name: '图片高度', exact: true }).fill('240');
  await expect(image).toHaveAttribute('height', '240');
  await page.getByRole('tab', { name: '开始', exact: true }).click();
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  await expect(image).toHaveAttribute('height', '200');
  await page.getByRole('button', { name: '重做', exact: true }).click();
  await expect(image).toHaveAttribute('height', '240');
  for (let pass = 1; pass <= 2; pass++) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await pending).path())!);
    await writeFile(path.join(pictureAudit, `inline-roundtrip-${pass}.docx`), bytes);
    const xml = await (await JSZip.loadAsync(bytes)).file('word/document.xml')!.async('string');
    expect(xml).toContain('cy="2286000"');
    expect(xml).not.toContain('data-word-auto-page-gap');
    await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
      name: `Inline-reopened-${pass}.docx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: bytes,
    });
    await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(
      `Inline-reopened-${pass}.docx`
    );
    await expect(image).toHaveAttribute('height', '240');
    await page.getByRole('tab', { name: '视图', exact: true }).click();
    if (!(await page.getByRole('checkbox', { name: '分页布局', exact: true }).isChecked()))
      await page.getByRole('checkbox', { name: '分页布局', exact: true }).click();
    await expect(paragraph).toHaveAttribute('data-word-page-first', '2');
    await expect(paragraph).toHaveAttribute('data-word-page-last', '2');
  }
  await body.getByRole('img', { name: '分页图片' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(pictureAudit, 'inline-page-light.png'), fullPage: true });
  await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  await page.screenshot({ path: path.join(pictureAudit, 'inline-page-dark.png'), fullPage: true });
  await page.setViewportSize({ width: 320, height: 720 });
  await image.scrollIntoViewIfNeeded();
  await expect(paragraph).toHaveAttribute('data-word-page-first', '2');
  await page.screenshot({
    path: path.join(pictureAudit, 'inline-page-dark-320.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: '切换浅色', exact: true }).click();
  await page.screenshot({
    path: path.join(pictureAudit, 'inline-page-light-320.png'),
    fullPage: true,
  });
  await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  await image.click();
  await page.getByRole('tab', { name: '插入', exact: true }).click();
  await expect(page.getByRole('spinbutton', { name: '图片高度', exact: true })).toBeDisabled();
});
async function pdfPageText(bytes: Buffer) {
  if (!('withResolvers' in Promise))
    Object.defineProperty(Promise, 'withResolvers', {
      configurable: true,
      value: function () {
        let resolve: unknown, reject: unknown;
        const promise = new Promise((yes, no) => {
          resolve = yes;
          reject = no;
        });
        return { promise, resolve, reject };
      },
    });
  globalThis.DOMMatrix ??= class {} as typeof DOMMatrix;
  const pdfjs = await import('../docs/node_modules/pdfjs-dist/legacy/build/pdf.mjs');
  const task = pdfjs.getDocument({ data: new Uint8Array(bytes), useSystemFonts: true });
  const document = await task.promise;
  try {
    const pages: string[] = [];
    for (let index = 1; index <= document.numPages; index++) {
      const text = await (await document.getPage(index)).getTextContent();
      pages.push(text.items.map((item) => ('str' in item ? item.str : '')).join('\n'));
    }
    return pages;
  } finally {
    await task.destroy();
  }
}
test('native Word table repeats leading headers on every actual printed page', async ({
  page,
  context,
}) => {
  const directory = path.resolve('docs/audits/2026-11-26/word-table-pagination');
  await mkdir(directory, { recursive: true });
  const document = new Document({
    sections: [
      {
        children: [
          new Table({
            rows: [
              new TableRow({
                tableHeader: true,
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new ExternalHyperlink({
                            link: 'https://example.com/table-heading',
                            children: [new TextRun('Repeated table heading')],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              ...Array.from(
                { length: 65 },
                (_, index) =>
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph(`Table body row ${index + 1}`)] }),
                    ],
                  })
              ),
            ],
          }),
        ],
      },
    ],
  });
  const source = Buffer.from(await Packer.toArrayBuffer(document));
  await writeFile(path.join(directory, 'table-source.docx'), source);
  await page.addInitScript(() => {
    window.print = () => {
      window.parent.postMessage(
        { type: 'table-print', html: document.documentElement.outerHTML },
        '*'
      );
      window.dispatchEvent(new Event('afterprint'));
    };
  });
  await page.goto('/#/components/office-studio');
  await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
    name: 'Table-pages.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: source,
  });
  await expect(
    page
      .getByRole('textbox', { name: 'Word 文档正文', exact: true })
      .getByText('Table body row 65', { exact: true })
  ).toBeVisible();
  const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  const original = await body.textContent();
  await page.getByRole('tab', { name: '视图', exact: true }).click();
  await page.getByRole('checkbox', { name: '分页布局', exact: true }).click();
  await expect(body).toHaveAttribute('data-word-pagination-overflow', 'false');
  await expect
    .poll(async () => Number(await body.getAttribute('data-word-page-count')))
    .toBeGreaterThan(1);
  await expect(body.locator('[data-word-auto-page-row]').first()).toBeAttached();
  await expect(body.locator('[data-word-repeated-header]').first()).toContainText(
    'Repeated table heading'
  );
  const repeatedLink = body.locator('[data-word-repeated-header]').first().locator('a');
  await expect(repeatedLink).toHaveAttribute('href', 'https://example.com/table-heading');
  expect(
    await repeatedLink.evaluate((element) => {
      (element as HTMLElement).tabIndex = 0;
      (element as HTMLElement).focus();
      return document.activeElement === element;
    })
  ).toBe(false);
  expect(
    await body.evaluate((element) => {
      const clone = element.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('[data-word-auto-page-row]').forEach((node) => node.remove());
      return clone.textContent;
    })
  ).toBe(original);
  await page.screenshot({ path: path.join(directory, 'table-page-layout.png'), fullPage: true });
  const firstHeader = body.locator('th').first();
  await firstHeader.locator('p').evaluate((element) => {
    (element.closest('[contenteditable="true"]') as HTMLElement).focus();
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
  });
  await page.keyboard.insertText('Edited table heading');
  await expect(firstHeader).toHaveText('Edited table heading');
  await expect(body.locator('[data-word-repeated-header]').first()).toContainText(
    'Edited table heading'
  );
  await page.getByRole('tab', { name: '开始', exact: true }).click();
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  await expect(firstHeader).toHaveText('Repeated table heading');
  await page.getByRole('button', { name: '重做', exact: true }).click();
  await expect(firstHeader).toHaveText('Edited table heading');
  for (let pass = 1; pass <= 2; pass++) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await pending).path())!);
    await writeFile(path.join(directory, `table-roundtrip-${pass}.docx`), bytes);
    const xml = await (await JSZip.loadAsync(bytes)).file('word/document.xml')!.async('string');
    expect(xml).toContain('w:tblHeader');
    expect(xml.match(/Edited table heading/g)).toHaveLength(1);
    expect(xml).not.toContain('data-word-auto-page');
    await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
      name: `Table-reopened-${pass}.docx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: bytes,
    });
    await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(
      `Table-reopened-${pass}.docx`
    );
    await page.getByRole('tab', { name: '视图', exact: true }).click();
    if (!(await page.getByRole('checkbox', { name: '分页布局', exact: true }).isChecked()))
      await page.getByRole('checkbox', { name: '分页布局', exact: true }).click();
    await expect(body.locator('[data-word-repeated-header]').first()).toContainText(
      'Edited table heading'
    );
    await expect(body).toHaveAttribute('data-word-pagination-overflow', 'false');
  }
  await page.evaluate(() =>
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'table-print')
        (window as Window & { tablePrint?: string }).tablePrint = event.data.html;
    })
  );
  await page.getByRole('button', { name: '打印', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => (window as Window & { tablePrint?: string }).tablePrint))
    .toBeTruthy();
  const html = await page.evaluate(() => (window as Window & { tablePrint?: string }).tablePrint!);
  const preview = await context.newPage();
  await preview.setContent(html);
  await expect(preview.locator('thead > tr')).toHaveCount(1);
  await preview.evaluate(() => document.fonts.ready);
  const file = path.join(directory, 'table-print.pdf');
  await preview.pdf({ path: file, preferCSSPageSize: true, printBackground: true });
  await preview.close();
  const pages = await pdfPageText(await readFile(file));
  expect(pages.length).toBeGreaterThan(1);
  for (const text of pages) expect(text).toContain('Edited table heading');
  expect(pages.join('\n')).toContain('Table body row 65');
  await writeFile(
    path.join(directory, 'print-page-evidence.json'),
    JSON.stringify({ pages }, null, 2)
  );
  for (const small of [false, true]) {
    if (small) await page.setViewportSize({ width: 320, height: 720 });
    for (const theme of ['light', 'dark']) {
      if (theme === 'dark')
        await page.getByRole('button', { name: '切换暗色', exact: true }).click();
      const repeated = body.locator('[data-word-repeated-header]').first();
      await repeated.scrollIntoViewIfNeeded();
      await expect(repeated).toContainText('Edited table heading');
      const geometry = await repeated.evaluate((element) => {
        const row = element.closest('[data-word-auto-page-row]')!;
        return {
          headerBottom: element.getBoundingClientRect().bottom,
          nextTop: row.nextElementSibling!.getBoundingClientRect().top,
        };
      });
      expect(geometry.nextTop).toBeGreaterThanOrEqual(geometry.headerBottom - 1);
      await page.screenshot({
        path: path.join(directory, `table-${theme}${small ? '-320' : ''}.png`),
        fullPage: true,
      });
      if (theme === 'dark')
        await page.getByRole('button', { name: '切换浅色', exact: true }).click();
    }
  }
  await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  await firstHeader.click();
  await page.getByRole('tab', { name: '插入', exact: true }).click();
  await expect(page.getByRole('button', { name: '切换标题行', exact: true })).toBeDisabled();
});
test('pagination keep flags move measured paragraphs without editing text and persist through DOCX history and reopening', async ({
  page,
  context,
}) => {
  await mkdir(audit, { recursive: true });
  const lines = (label: string, count: number) =>
    Array.from(
      { length: count },
      (_, index) => new TextRun({ text: `${label} ${index + 1}`, break: index ? 1 : 0, size: 24 })
    );
  const doc = new Document({
    sections: [
      {
        properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
        children: [
          new Paragraph({
            spacing: { line: 360, lineRule: LineRuleType.EXACT, after: 0, before: 0 },
            widowControl: false,
            children: lines('Filler', 37),
          }),
          new Paragraph({
            spacing: { line: 360, lineRule: LineRuleType.EXACT, after: 0, before: 0 },
            widowControl: false,
            keepLines: false,
            keepNext: false,
            children: lines('Target', 6),
          }),
          new Paragraph({ children: [new TextRun('After target')] }),
        ],
      },
    ],
  });
  const source = Buffer.from(await Packer.toArrayBuffer(doc));
  await writeFile(path.join(audit, 'keep-source.docx'), source);
  await page.goto('/#/components/office-studio');
  const load = (name: string, buffer: Buffer) =>
    page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
      name,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer,
    });
  await load('Keep.docx', source);
  const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true }),
    target = body.locator('p').filter({ hasText: 'Target 1' });
  await page.getByRole('tab', { name: '视图', exact: true }).click();
  await page.getByRole('checkbox', { name: '分页布局', exact: true }).click();
  await expect(body).toHaveAttribute('data-word-page-count', '2');
  const original = await body.textContent();
  await page.evaluate(() =>
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'keep-print')
        (window as Window & { keepPrint?: string }).keepPrint = event.data.html;
    })
  );
  await page.addInitScript(() => {
    window.print = () => {
      window.parent.postMessage(
        { type: 'keep-print', html: document.documentElement.outerHTML },
        '*'
      );
      window.dispatchEvent(new Event('afterprint'));
    };
  });
  const printPdf = async (name: string) => {
    await page.evaluate(() => {
      delete (window as Window & { keepPrint?: string }).keepPrint;
    });
    await page.getByRole('button', { name: '打印', exact: true }).click();
    await expect
      .poll(() => page.evaluate(() => (window as Window & { keepPrint?: string }).keepPrint))
      .toBeTruthy();
    const html = await page.evaluate(() => (window as Window & { keepPrint?: string }).keepPrint!);
    const preview = await context.newPage();
    await preview.setContent(html);
    await preview.evaluate(() => document.fonts.ready);
    const file = path.join(audit, `${name}.pdf`);
    await preview.pdf({ path: file, preferCSSPageSize: true, printBackground: true });
    await preview.close();
    return pdfPageText(await readFile(file));
  };
  const freePages = await printPdf('keep-before');
  expect(freePages[0]).toContain('Target 1');
  expect(freePages[1]).toContain('Target 6');
  await expect(target.locator('[data-word-auto-page-gap]')).toHaveCount(1);
  await target.evaluate((element) => {
    (element.closest('[contenteditable="true"]') as HTMLElement).focus();
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  });
  await page.getByRole('tab', { name: '开始', exact: true }).click();
  await page.getByRole('button', { name: '段落设置', exact: true }).click();
  let dialog = page.getByRole('dialog', { name: '段落设置', exact: true });
  await dialog.getByRole('button', { name: /^段内不分页/ }).click();
  await page.getByRole('option', { name: '开启', exact: true }).click();
  await dialog.getByRole('button', { name: /^孤行控制/ }).click();
  await page.getByRole('option', { name: '开启', exact: true }).click();
  await dialog.getByRole('button', { name: '应用段落设置', exact: true }).click();
  await expect(target.locator('[data-word-auto-page-gap]')).toHaveCount(0);
  const keptPages = await printPdf('keep-after');
  expect(keptPages[0]).not.toContain('Target 1');
  expect(keptPages[1]).toContain('Target 1');
  expect(keptPages[1]).toContain('Target 6');
  await writeFile(
    path.join(audit, 'print-page-evidence.json'),
    JSON.stringify({ before: freePages, after: keptPages }, null, 2)
  );
  await expect(target).toHaveAttribute('data-word-keeplines', 'true');
  await expect(target).toHaveAttribute('data-word-page-first', '2');
  await expect(target).toHaveAttribute('data-word-page-last', '2');
  expect(await body.textContent()).toBe(original);
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  await expect(target.locator('[data-word-auto-page-gap]')).toHaveCount(1);
  await page.getByRole('button', { name: '重做', exact: true }).click();
  await expect(target.locator('[data-word-auto-page-gap]')).toHaveCount(0);
  for (let pass = 1; pass <= 2; pass++) {
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await download).path())!);
    await writeFile(path.join(audit, `keep-roundtrip-${pass}.docx`), bytes);
    const xml = await (await JSZip.loadAsync(bytes)).file('word/document.xml')!.async('string');
    expect(xml).toContain('w:keepLines');
    expect(xml).not.toContain('data-word-auto-page-gap');
    await load(`Reopened-${pass}.docx`, bytes);
    await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(
      `Reopened-${pass}.docx`
    );
    await page.getByRole('tab', { name: '视图', exact: true }).click();
    if (!(await page.getByRole('checkbox', { name: '分页布局', exact: true }).isChecked()))
      await page.getByRole('checkbox', { name: '分页布局', exact: true }).click();
    await expect(body).toHaveAttribute('data-word-page-count', '2');
    await page.getByRole('tab', { name: '开始', exact: true }).click();
    await expect(target).toHaveAttribute('data-word-keeplines', 'true');
    await expect(target.locator('[data-word-auto-page-gap]')).toHaveCount(0);
  }
  await target.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.join(audit, 'keep-lines-layout.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('tab', { name: '视图', exact: true }).click();
  await page.getByRole('checkbox', { name: '分页布局', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: '分页布局', exact: true })).not.toBeChecked();
  await expect(body.locator('[data-word-auto-page-gap]')).toHaveCount(0);
  expect(await body.textContent()).toBe(original);
  await page.getByRole('checkbox', { name: '分页布局', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: '分页布局', exact: true })).toBeChecked();
  await expect(body).toHaveAttribute('data-word-page-count', '2');
  await page.getByRole('tab', { name: '开始', exact: true }).click();
  for (const small of [false, true]) {
    if (small) await page.setViewportSize({ width: 320, height: 720 });
    for (const theme of ['light', 'dark']) {
      if (theme === 'dark')
        await page.getByRole('button', { name: '切换暗色', exact: true }).click();
      await target.evaluate((element) => {
        (element.closest('[contenteditable="true"]') as HTMLElement).focus();
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = window.getSelection()!;
        selection.removeAllRanges();
        selection.addRange(range);
        document.dispatchEvent(new Event('selectionchange'));
      });
      await page.getByRole('button', { name: '段落设置', exact: true }).click();
      dialog = page.getByRole('dialog', { name: '段落设置', exact: true });
      await expect(dialog.getByRole('button', { name: '应用段落设置', exact: true })).toBeVisible();
      const box = await dialog.boundingBox();
      expect(box!.width).toBeLessThanOrEqual(small ? 320 : 1280);
      await page.screenshot({
        path: path.join(audit, `keep-dialog-${theme}${small ? '-320' : ''}.png`),
        fullPage: true,
        animations: 'disabled',
      });
      await dialog.getByRole('button', { name: '取消', exact: true }).click();
      if (theme === 'dark')
        await page.getByRole('button', { name: '切换浅色', exact: true }).click();
    }
  }
  await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  await expect(page.getByRole('button', { name: '段落设置', exact: true })).toBeDisabled();
});

test('keep-next headings and orphan control move actual browser lines to the following page', async ({
  page,
}) => {
  await mkdir(audit, { recursive: true });
  await page.goto('/#/components/office-studio');
  const runs = (label: string, count: number) =>
    Array.from(
      { length: count },
      (_, index) => new TextRun({ text: `${label} ${index + 1}`, break: index ? 1 : 0, size: 24 })
    );
  const spacing = { line: 360, lineRule: LineRuleType.EXACT, after: 0, before: 0 };
  for (const flag of ['keepNext', 'widowControl'] as const) {
    const count = flag === 'keepNext' ? 37 : 39;
    const doc = new Document({
      sections: [
        {
          properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
          children: [
            new Paragraph({ spacing, widowControl: false, children: runs('Filler', count) }),
            new Paragraph({
              spacing,
              widowControl: false,
              keepNext: false,
              children: runs('Constraint', flag === 'keepNext' ? 2 : 4),
            }),
            new Paragraph({ spacing, widowControl: true, children: runs('Follower', 4) }),
          ],
        },
      ],
    });
    const load = (name: string, buffer: Buffer) =>
      page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
        name,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer,
      });
    const source = Buffer.from(await Packer.toArrayBuffer(doc));
    await writeFile(path.join(audit, `${flag}-source.docx`), source);
    await load(`${flag}.docx`, source);
    const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
    await page.getByRole('tab', { name: '视图', exact: true }).click();
    if (!(await page.getByRole('checkbox', { name: '分页布局', exact: true }).isChecked()))
      await page.getByRole('checkbox', { name: '分页布局', exact: true }).click();
    const target = body.locator('p').filter({ hasText: 'Constraint 1' });
    await expect(target).toHaveAttribute('data-word-page-first', '1');
    if (flag === 'widowControl') await expect(target).toHaveAttribute('data-word-page-last', '2');
    await target.evaluate((element) => {
      (element.closest('[contenteditable="true"]') as HTMLElement).focus();
      const range = document.createRange();
      range.selectNodeContents(element);
      const s = window.getSelection()!;
      s.removeAllRanges();
      s.addRange(range);
      document.dispatchEvent(new Event('selectionchange'));
    });
    await page.getByRole('tab', { name: '开始', exact: true }).click();
    await page.getByRole('button', { name: '段落设置', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: '段落设置', exact: true });
    await dialog
      .getByRole('button', { name: flag === 'keepNext' ? /^与下段同页/ : /^孤行控制/ })
      .click();
    await page.getByRole('option', { name: '开启', exact: true }).click();
    await dialog.getByRole('button', { name: '应用段落设置', exact: true }).click();
    await expect(target).toHaveAttribute('data-word-page-first', '2');
    await expect(target).toHaveAttribute('data-word-page-last', '2');
    await page.getByRole('button', { name: '撤销', exact: true }).click();
    await expect(target).toHaveAttribute('data-word-page-first', '1');
    await page.getByRole('button', { name: '重做', exact: true }).click();
    await expect(target).toHaveAttribute('data-word-page-first', '2');
    for (let pass = 1; pass <= 2; pass++) {
      const pending = page.waitForEvent('download');
      await page.getByRole('button', { name: '导出文件', exact: true }).click();
      const bytes = await readFile((await (await pending).path())!);
      await writeFile(path.join(audit, `${flag}-roundtrip-${pass}.docx`), bytes);
      await load(`${flag}-reopened-${pass}.docx`, bytes);
      await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(
        `${flag}-reopened-${pass}.docx`
      );
      await page.getByRole('tab', { name: '视图', exact: true }).click();
      if (!(await page.getByRole('checkbox', { name: '分页布局', exact: true }).isChecked()))
        await page.getByRole('checkbox', { name: '分页布局', exact: true }).click();
      await expect(target).toHaveAttribute('data-word-page-first', '2');
      await page.getByRole('tab', { name: '开始', exact: true }).click();
    }
    await target.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(audit, `${flag}-layout.png`),
      fullPage: true,
      animations: 'disabled',
    });
  }
});
