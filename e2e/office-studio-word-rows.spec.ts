import { expect, test } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  Document,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  Packer,
  HeightRule,
  TextRun,
} from '../docs/node_modules/docx/dist/index.mjs';
import JSZip from '../docs/node_modules/jszip/lib/index.js';
import { PDFDocument } from '../docs/node_modules/pdf-lib/cjs/index.js';

test('fixed rows use their clipped height during actual automatic pagination', async ({
  page,
  context,
}) => {
  const directory = path.resolve('docs/audits/2026-11-26/word-row-properties');
  await mkdir(directory, { recursive: true });
  const document = new Document({
    sections: [
      {
        children: [
          new Table({
            rows: Array.from(
              { length: 25 },
              (_, row) =>
                new TableRow({
                  height: { value: 480, rule: HeightRule.EXACT },
                  cantSplit: true,
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: Array.from(
                            { length: 12 },
                            (_, line) =>
                              new TextRun({
                                text: `Fixed row ${row + 1} line ${line + 1}`,
                                break: line ? 1 : 0,
                              })
                          ),
                        }),
                      ],
                    }),
                  ],
                })
            ),
          }),
        ],
      },
    ],
  });
  const source = Buffer.from(await Packer.toArrayBuffer(document));
  await writeFile(path.join(directory, 'fixed-layout-source.docx'), source);
  await page.addInitScript(() => {
    window.print = () => {
      window.parent.postMessage(
        { type: 'fixed-row-print', html: document.documentElement.outerHTML },
        '*'
      );
      window.dispatchEvent(new Event('afterprint'));
    };
  });
  await page.goto('/#/components/office-studio');
  await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
    name: 'Fixed-layout.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: source,
  });
  const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  await expect(body.locator('tr')).toHaveCount(25);
  await page.getByRole('tab', { name: '视图', exact: true }).click();
  await page.getByRole('checkbox', { name: '分页布局', exact: true }).click();
  await expect(body).toHaveAttribute('data-word-page-count', '1');
  await expect(body).toHaveAttribute('data-word-pagination-overflow', 'false');
  const heights = await body
    .locator('tr')
    .evaluateAll((rows) => rows.map((row) => row.getBoundingClientRect().height));
  expect(heights.every((height) => height >= 31 && height <= 33)).toBe(true);
  await page.screenshot({ path: path.join(directory, 'fixed-layout-page.png'), fullPage: true });
  await page.evaluate(() =>
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'fixed-row-print')
        (window as Window & { fixedRowPrint?: string }).fixedRowPrint = event.data.html;
    })
  );
  await page.getByRole('button', { name: '打印', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => (window as Window & { fixedRowPrint?: string }).fixedRowPrint))
    .toBeTruthy();
  const preview = await context.newPage();
  await preview.setContent(
    await page.evaluate(() => (window as Window & { fixedRowPrint?: string }).fixedRowPrint!)
  );
  await preview.evaluate(() => document.fonts.ready);
  const printedHeights = await preview
    .locator('tr')
    .evaluateAll((rows) => rows.map((row) => row.getBoundingClientRect().height));
  expect(printedHeights).toHaveLength(25);
  expect(printedHeights.every((height) => height >= 31 && height <= 33)).toBe(true);
  const pdf = await preview.pdf({
    path: path.join(directory, 'fixed-layout-print.pdf'),
    preferCSSPageSize: true,
    printBackground: true,
  });
  expect((await PDFDocument.load(pdf)).getPageCount()).toBe(1);
  await writeFile(
    path.join(directory, 'fixed-layout-evidence.json'),
    JSON.stringify({ editorHeights: heights, printedHeights, printedPages: 1 }, null, 2)
  );
  await preview.close();
});

test('Word row properties edit atomically and retain height and split flags through two DOCX reopenings', async ({
  page,
}) => {
  const directory = path.resolve('docs/audits/2026-11-26/word-row-properties');
  await mkdir(directory, { recursive: true });
  const document = new Document({
    sections: [
      {
        children: [
          new Table({
            rows: [
              new TableRow({
                height: { value: 480, rule: HeightRule.ATLEAST },
                cantSplit: true,
                children: [new TableCell({ children: [new Paragraph('Row one')] })],
              }),
              new TableRow({
                height: { value: 0, rule: HeightRule.AUTO },
                cantSplit: false,
                children: [new TableCell({ children: [new Paragraph('Row two')] })],
              }),
              new TableRow({
                height: { value: 480, rule: HeightRule.EXACT },
                cantSplit: true,
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: Array.from(
                          { length: 12 },
                          (_, index) =>
                            new TextRun({ text: `Clipped line ${index + 1}`, break: index ? 1 : 0 })
                        ),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });
  const source = Buffer.from(await Packer.toArrayBuffer(document));
  await writeFile(path.join(directory, 'rows-source.docx'), source);
  await page.goto('/#/components/office-studio');
  const load = (name: string, buffer: Buffer) =>
    page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
      name,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer,
    });
  await load('Rows.docx', source);
  const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  const row = body.locator('tr').filter({ hasText: 'Row one' });
  await expect(row).toHaveAttribute('data-word-row-height', '24');
  const fixed = body.locator('tr').filter({ hasText: 'Clipped line 12' });
  const assertFixed = async () => {
    await expect(fixed).toHaveAttribute('data-word-row-height-rule', 'exact');
    expect((await fixed.boundingBox())!.height).toBeGreaterThanOrEqual(31);
    expect((await fixed.boundingBox())!.height).toBeLessThanOrEqual(33);
    expect(
      await fixed
        .locator('[data-word-cell-content]')
        .evaluate((element) => element.scrollHeight > element.clientHeight)
    ).toBe(true);
    await expect(fixed).toContainText('Clipped line 12');
  };
  await assertFixed();
  const originalText = await body.textContent();
  await fixed.locator('p').click();
  await page.getByRole('tab', { name: '插入', exact: true }).click();
  await page.getByRole('button', { name: '表格行属性', exact: true }).click();
  const fixedDialog = page.getByRole('dialog', { name: '表格行属性', exact: true });
  await fixedDialog.getByRole('button', { name: /^表格行高规则/ }).click();
  await page.getByRole('option', { name: '自动', exact: true }).click();
  await fixedDialog.getByRole('button', { name: '应用行属性', exact: true }).click();
  expect((await fixed.boundingBox())!.height).toBeGreaterThan(150);
  await page.getByRole('tab', { name: '开始', exact: true }).click();
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  await assertFixed();
  expect(await body.textContent()).toBe(originalText);
  await row.locator('p').click();
  await page.getByRole('tab', { name: '插入', exact: true }).click();
  await page.getByRole('button', { name: '表格行属性', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '表格行属性', exact: true });
  await expect(dialog.getByRole('spinbutton', { name: '表格行高', exact: true })).toHaveValue('24');
  await dialog.getByRole('spinbutton', { name: '表格行高', exact: true }).fill('48');
  await dialog.getByRole('button', { name: /^表格行跨页/ }).click();
  await page.getByRole('option', { name: '允许行跨页', exact: true }).click();
  await dialog.getByRole('button', { name: '应用行属性', exact: true }).click();
  await expect(row).toHaveAttribute('data-word-row-height', '48');
  await expect(row).toHaveAttribute('data-word-row-allow-split', 'true');
  expect((await row.boundingBox())!.height).toBeGreaterThanOrEqual(63.5);
  await page.getByRole('tab', { name: '开始', exact: true }).click();
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  await expect(row).toHaveAttribute('data-word-row-height', '24');
  await expect(row).toHaveAttribute('data-word-row-allow-split', 'false');
  await page.getByRole('button', { name: '重做', exact: true }).click();
  await expect(row).toHaveAttribute('data-word-row-height', '48');
  for (let pass = 1; pass <= 2; pass++) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await pending).path())!);
    await writeFile(path.join(directory, `rows-roundtrip-${pass}.docx`), bytes);
    const xml = await (await JSZip.loadAsync(bytes)).file('word/document.xml')!.async('string');
    expect(xml).toMatch(/w:trHeight[^>]*w:val="960"/);
    expect(xml).toContain('Clipped line 12');
    await load(`Rows-reopened-${pass}.docx`, bytes);
    await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(
      `Rows-reopened-${pass}.docx`
    );
    await expect(row).toHaveAttribute('data-word-row-height', '48');
    await expect(row).toHaveAttribute('data-word-row-allow-split', 'true');
    await assertFixed();
  }
  await row.locator('p').click();
  await page.getByRole('tab', { name: '插入', exact: true }).click();
  await page.getByRole('button', { name: '表格行属性', exact: true }).click();
  const draftHeight = dialog.getByRole('spinbutton', { name: '表格行高', exact: true });
  await draftHeight.dispatchEvent('compositionstart', { data: '' });
  await expect(dialog.getByRole('button', { name: '应用行属性', exact: true })).toBeDisabled();
  await draftHeight.dispatchEvent('compositionend', { data: '48' });
  await expect(dialog.getByRole('button', { name: '应用行属性', exact: true })).toBeEnabled();
  await dialog.getByRole('spinbutton', { name: '表格行高', exact: true }).fill('2001');
  await expect(dialog.getByRole('button', { name: '应用行属性', exact: true })).toBeDisabled();
  await dialog.getByRole('button', { name: '取消', exact: true }).click();
  await expect(row).toHaveAttribute('data-word-row-height', '48');
  for (const small of [false, true]) {
    if (small) await page.setViewportSize({ width: 320, height: 720 });
    for (const theme of ['light', 'dark']) {
      if (theme === 'dark')
        await page.getByRole('button', { name: '切换暗色', exact: true }).click();
      await row.locator('p').click();
      await page.getByRole('button', { name: '表格行属性', exact: true }).click();
      await expect(dialog).toBeVisible();
      expect((await dialog.boundingBox())!.width).toBeLessThanOrEqual(small ? 320 : 1280);
      await page.screenshot({
        path: path.join(directory, `rows-${theme}${small ? '-320' : ''}.png`),
        fullPage: true,
      });
      await dialog.getByRole('button', { name: '取消', exact: true }).click();
      if (theme === 'dark')
        await page.getByRole('button', { name: '切换浅色', exact: true }).click();
    }
  }
  await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  await expect(page.getByRole('button', { name: '表格行属性', exact: true })).toBeDisabled();
});

test('native vertically merged fixed rows use their combined content height', async ({ page }) => {
  const directory = path.resolve('docs/audits/2026-11-26/word-row-properties');
  await mkdir(directory, { recursive: true });
  const document = new Document({
    sections: [
      {
        children: [
          new Table({
            rows: [
              new TableRow({
                height: { value: 480, rule: HeightRule.EXACT },
                children: [
                  new TableCell({
                    rowSpan: 2,
                    children: [
                      new Paragraph({
                        children: Array.from(
                          { length: 15 },
                          (_, index) =>
                            new TextRun({ text: `Merged line ${index + 1}`, break: index ? 1 : 0 })
                        ),
                      }),
                    ],
                  }),
                  new TableCell({ children: [new Paragraph('First row')] }),
                ],
              }),
              new TableRow({
                height: { value: 720, rule: HeightRule.EXACT },
                children: [new TableCell({ children: [new Paragraph('Second row')] })],
              }),
            ],
          }),
        ],
      },
    ],
  });
  const source = Buffer.from(await Packer.toArrayBuffer(document));
  await writeFile(path.join(directory, 'merged-fixed-source.docx'), source);
  await page.goto('/#/components/office-studio');
  await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
    name: 'Merged.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: source,
  });
  const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  const cell = body.locator('td[rowspan="2"]');
  await expect(cell).toHaveAttribute('data-word-fixed-cell-height', '60');
  const geometry = await cell.evaluate((element) => ({
    cell: element.getBoundingClientRect().height,
    content: element.querySelector('[data-word-cell-content]')!.getBoundingClientRect().height,
    text: element.textContent,
  }));
  expect(geometry.content).toBeGreaterThan(78);
  expect(geometry.content).toBeLessThan(81);
  expect(geometry.text).toContain('Merged line 15');
  await page.screenshot({ path: path.join(directory, 'merged-fixed-light.png'), fullPage: true });
  await writeFile(
    path.join(directory, 'merged-fixed-evidence.json'),
    JSON.stringify(geometry, null, 2)
  );
});

test('allowed single-cell row fragments across pages while prohibited row remains intact', async ({
  page,
}) => {
  const directory = path.resolve('docs/audits/2026-11-26/word-row-properties');
  const sourceFor = async (cantSplit: boolean) =>
    Buffer.from(
      await Packer.toArrayBuffer(
        new Document({
          sections: [
            {
              children: [
                new Table({
                  rows: [
                    new TableRow({
                      cantSplit,
                      children: [
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: Array.from(
                                { length: 80 },
                                (_, index) =>
                                  new TextRun({
                                    text: `Row fragment ${index + 1}`,
                                    break: index ? 1 : 0,
                                  })
                              ),
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            },
          ],
        })
      )
    );
  await page.goto('/#/components/office-studio');
  const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  for (const cantSplit of [false, true]) {
    const source = await sourceFor(cantSplit);
    await writeFile(
      path.join(directory, `row-fragments-${cantSplit ? 'prohibited' : 'allowed'}.docx`),
      source
    );
    await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
      name: 'Fragments.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: source,
    });
    await expect(body).toContainText('Row fragment 80');
    await page.getByRole('tab', { name: '视图', exact: true }).click();
    const pagination = page.getByRole('checkbox', { name: '分页布局', exact: true });
    if (!(await pagination.isChecked())) await pagination.click();
    await expect(body).toHaveAttribute('data-word-pagination-overflow', String(cantSplit));
    if (!cantSplit) {
      await expect(body.locator('td [data-word-auto-page-gap]')).not.toHaveCount(0);
      expect(Number(await body.getAttribute('data-word-page-count'))).toBeGreaterThan(1);
      await expect(body.locator('tr')).toHaveCount(1);
      const gaps = await body
        .locator('td [data-word-auto-page-gap]')
        .evaluateAll((elements) =>
          elements.map((element) => element.getBoundingClientRect().height)
        );
      expect(gaps.every((height) => height >= 174)).toBe(true);
      await writeFile(
        path.join(directory, 'row-fragments-layout-evidence.json'),
        JSON.stringify(
          {
            pages: Number(await body.getAttribute('data-word-page-count')),
            gapHeights: gaps,
            rows: 1,
            lastLineRetained: true,
          },
          null,
          2
        )
      );
      await body.locator('td [data-word-auto-page-gap]').first().scrollIntoViewIfNeeded();
      await page.screenshot({
        path: path.join(directory, 'row-fragments-allowed-light.png'),
        fullPage: true,
      });
    } else {
      await body.locator('p').click();
      await page.getByRole('tab', { name: '插入', exact: true }).click();
      await page.getByRole('button', { name: '表格行属性', exact: true }).click();
      const dialog = page.getByRole('dialog', { name: '表格行属性', exact: true });
      await dialog.getByRole('button', { name: /^表格行跨页/ }).click();
      await page.getByRole('option', { name: '允许行跨页', exact: true }).click();
      await dialog.getByRole('button', { name: '应用行属性', exact: true }).click();
      await expect(body).toHaveAttribute('data-word-pagination-overflow', 'false');
      await page.getByRole('tab', { name: '开始', exact: true }).click();
      await page.getByRole('button', { name: '撤销', exact: true }).click();
      await expect(body).toHaveAttribute('data-word-pagination-overflow', 'true');
      await page.getByRole('button', { name: '重做', exact: true }).click();
      await expect(body).toHaveAttribute('data-word-pagination-overflow', 'false');
      const download = page.waitForEvent('download');
      await page.getByRole('button', { name: '导出文件', exact: true }).click();
      const bytes = await readFile((await (await download).path())!);
      await writeFile(path.join(directory, 'row-fragments-edited-roundtrip.docx'), bytes);
      const xml = await (await JSZip.loadAsync(bytes)).file('word/document.xml')!.async('string');
      expect(xml).not.toContain('data-word-auto-page');
      expect(xml).toContain('Row fragment 80');
      await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
        name: 'Fragments-reopened.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: bytes,
      });
      await expect(body).toHaveAttribute('data-word-pagination-overflow', 'false');
      await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(
        'Fragments-reopened.docx'
      );
      await page.getByRole('tab', { name: '视图', exact: true }).click();
      const reopenedPagination = page.getByRole('checkbox', { name: '分页布局', exact: true });
      if (!(await reopenedPagination.isChecked())) await reopenedPagination.click();
      await expect(body).toHaveAttribute('data-word-pagination-overflow', 'false');
      await expect(body.locator('td [data-word-auto-page-gap]')).not.toHaveCount(0);
      await expect(body).toContainText('Row fragment 80');
    }
  }
});

test('distributes selected fixed rows with atomic history and native DOCX reopening', async ({
  page,
}) => {
  const directory = path.resolve('docs/audits/2026-11-26/word-row-properties');
  const source = Buffer.from(
    await Packer.toArrayBuffer(
      new Document({
        sections: [
          {
            children: [
              new Table({
                rows: [24, 48].map(
                  (height, index) =>
                    new TableRow({
                      height: { value: height * 20, rule: HeightRule.EXACT },
                      cantSplit: index === 0,
                      children: [
                        new TableCell({ children: [new Paragraph(`Distribute row ${index + 1}`)] }),
                      ],
                    })
                ),
              }),
            ],
          },
        ],
      })
    )
  );
  await writeFile(path.join(directory, 'distribute-source.docx'), source);
  await page.goto('/#/components/office-studio');
  const load = async (buffer: Buffer, name: string) => {
    await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
      name,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer,
    });
    await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(name);
  };
  await load(source, 'Distribute.docx');
  const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  await body.evaluate((element) => {
    (element as HTMLElement).focus();
    const paragraphs = element.querySelectorAll('td p');
    const range = document.createRange();
    range.setStart(paragraphs[0].firstChild!, 0);
    range.setEnd(paragraphs[1].firstChild!, paragraphs[1].firstChild!.textContent!.length);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  });
  await page.getByRole('tab', { name: '插入', exact: true }).click();
  const distribute = page.getByRole('button', { name: '平均分布行', exact: true });
  await expect(distribute).toBeEnabled();
  await distribute.click();
  const rows = body.locator('tr');
  for (const row of await rows.all())
    await expect(row).toHaveAttribute('data-word-row-height', '36');
  await expect(rows.nth(0)).toHaveAttribute('data-word-row-allow-split', 'false');
  await expect(rows.nth(1)).toHaveAttribute('data-word-row-allow-split', 'true');
  await page.getByRole('tab', { name: '开始', exact: true }).click();
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  await expect(rows.nth(0)).toHaveAttribute('data-word-row-height', '24');
  await expect(rows.nth(1)).toHaveAttribute('data-word-row-height', '48');
  await page.getByRole('button', { name: '重做', exact: true }).click();
  for (const row of await rows.all())
    await expect(row).toHaveAttribute('data-word-row-height', '36');
  for (let pass = 1; pass <= 2; pass++) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await pending).path())!);
    await writeFile(path.join(directory, `distribute-roundtrip-${pass}.docx`), bytes);
    const xml = await (await JSZip.loadAsync(bytes)).file('word/document.xml')!.async('string');
    expect(xml.match(/w:trHeight[^>]*w:val="720"/g)).toHaveLength(2);
    await load(bytes, `Distributed-${pass}.docx`);
    for (const row of await rows.all())
      await expect(row).toHaveAttribute('data-word-row-height', '36');
    await expect(body).toContainText('Distribute row 2');
  }
  const heights = await rows.evaluateAll((elements) =>
    elements.map((element) => element.getBoundingClientRect().height)
  );
  expect(heights.every((height) => height >= 47 && height <= 49)).toBe(true);
  await writeFile(
    path.join(directory, 'distribute-evidence.json'),
    JSON.stringify({ heights, nativeTwips: 720, reopenCycles: 2 }, null, 2)
  );
  for (const small of [false, true]) {
    if (small) await page.setViewportSize({ width: 320, height: 720 });
    for (const theme of ['light', 'dark']) {
      if (theme === 'dark')
        await page.getByRole('button', { name: '切换暗色', exact: true }).click();
      await page.getByRole('tab', { name: '插入', exact: true }).click();
      await body.locator('p').first().click();
      await expect(distribute).toBeDisabled();
      await distribute.scrollIntoViewIfNeeded();
      await page.screenshot({
        path: path.join(directory, `distribute-${theme}${small ? '-320' : ''}.png`),
        fullPage: true,
      });
      if (theme === 'dark')
        await page.getByRole('button', { name: '切换浅色', exact: true }).click();
    }
  }
  await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  await expect(distribute).toBeDisabled();
});

test('equal table columns preserve merged geometry through native DOCX export', async ({
  page,
}) => {
  const directory = path.resolve('docs/audits/2026-11-26/word-row-properties');
  const source = Buffer.from(
    await Packer.toArrayBuffer(
      new Document({
        sections: [
          {
            children: [
              new Table({
                columnWidths: [2000, 4000],
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({ columnSpan: 2, children: [new Paragraph('Merged columns')] }),
                    ],
                  }),
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph('Column one')] }),
                      new TableCell({ children: [new Paragraph('Column two')] }),
                    ],
                  }),
                ],
              }),
            ],
          },
        ],
      })
    )
  );
  await writeFile(path.join(directory, 'columns-source.docx'), source);
  await page.goto('/#/components/office-studio');
  const load = async (bytes: Buffer, name: string) => {
    await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
      name,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: bytes,
    });
    await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(name);
  };
  await load(source, 'Columns.docx');
  const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  await body.locator('p').last().click();
  await page.getByRole('tab', { name: '插入', exact: true }).click();
  const button = page.getByRole('button', { name: '平均分布表格列', exact: true });
  const originalWidth = await body
    .locator('table')
    .evaluate((table) => table.getBoundingClientRect().width);
  await button.click();
  const assertEqual = async () => {
    const widths = await body
      .locator('tr')
      .last()
      .locator('td')
      .evaluateAll((cells) => cells.map((cell) => cell.getBoundingClientRect().width));
    expect(Math.abs(widths[0] - widths[1])).toBeLessThan(1);
    expect(Math.abs(widths[0] + widths[1] - originalWidth)).toBeLessThan(1);
    await expect(body.locator('td[colspan="2"]')).toHaveCount(1);
    await expect(body).toContainText('Merged columns');
    return widths;
  };
  await assertEqual();
  await page.getByRole('tab', { name: '开始', exact: true }).click();
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  const restored = await body
    .locator('tr')
    .last()
    .locator('td')
    .evaluateAll((cells) => cells.map((cell) => cell.getAttribute('colwidth')));
  expect(restored[0]).not.toBe(restored[1]);
  await page.getByRole('button', { name: '重做', exact: true }).click();
  for (let pass = 1; pass <= 2; pass++) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await pending).path())!);
    await writeFile(path.join(directory, `columns-roundtrip-${pass}.docx`), bytes);
    await load(bytes, `Columns-reopened-${pass}.docx`);
    await assertEqual();
  }
  await writeFile(
    path.join(directory, 'columns-evidence.json'),
    JSON.stringify({ widths: await assertEqual(), reopenCycles: 2 }, null, 2)
  );
  for (const small of [false, true]) {
    if (small) await page.setViewportSize({ width: 320, height: 720 });
    for (const theme of ['light', 'dark']) {
      if (theme === 'dark')
        await page.getByRole('button', { name: '切换暗色', exact: true }).click();
      await body.locator('p').last().click();
      await page.getByRole('tab', { name: '插入', exact: true }).click();
      await expect(button).toBeEnabled();
      const nativeWidths = await body
        .locator('td')
        .evaluateAll((cells) => cells.map((cell) => cell.getAttribute('colwidth')));
      await button.click();
      expect(
        await body
          .locator('td')
          .evaluateAll((cells) => cells.map((cell) => cell.getAttribute('colwidth')))
      ).toEqual(nativeWidths);
      await button.scrollIntoViewIfNeeded();
      await page.screenshot({
        path: path.join(directory, `columns-${theme}${small ? '-320' : ''}.png`),
        fullPage: true,
      });
      if (theme === 'dark')
        await page.getByRole('button', { name: '切换浅色', exact: true }).click();
    }
  }
  await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  await expect(button).toBeDisabled();
});

test('nested vertically merged table distributes its own columns without changing outer widths', async ({
  page,
}) => {
  const directory = path.resolve('docs/audits/2026-11-26/word-row-properties');
  const inner = new Table({
    columnWidths: [1200, 2400],
    rows: [
      new TableRow({
        children: [
          new TableCell({ rowSpan: 2, children: [new Paragraph('Nested merged')] }),
          new TableCell({ children: [new Paragraph('Nested right')] }),
        ],
      }),
      new TableRow({ children: [new TableCell({ children: [new Paragraph('Nested bottom')] })] }),
    ],
  });
  const source = Buffer.from(
    await Packer.toArrayBuffer(
      new Document({
        sections: [
          {
            children: [
              new Table({
                columnWidths: [5000, 2000],
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [
                          new Paragraph('Outer before'),
                          inner,
                          new Paragraph('Outer after'),
                        ],
                      }),
                      new TableCell({ children: [new Paragraph('Outer second')] }),
                    ],
                  }),
                ],
              }),
            ],
          },
        ],
      })
    )
  );
  await writeFile(path.join(directory, 'nested-columns-source.docx'), source);
  await page.goto('/#/components/office-studio');
  const load = async (bytes: Buffer, name: string) => {
    await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
      name,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: bytes,
    });
    await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(name);
  };
  await load(source, 'Nested-columns.docx');
  const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  const outerCells = body.locator('table').first().locator(':scope > tbody > tr > td');
  const original = await outerCells.evaluateAll((cells) =>
    cells.map((cell) => cell.getAttribute('colwidth'))
  );
  await body
    .locator('p')
    .filter({ hasText: /^Nested right$/ })
    .click();
  await page.getByRole('tab', { name: '插入', exact: true }).click();
  await page.getByRole('button', { name: '平均分布表格列', exact: true }).click();
  const assertNested = async () => {
    expect(
      await outerCells.evaluateAll((cells) => cells.map((cell) => cell.getAttribute('colwidth')))
    ).toEqual(original);
    const table = body.locator('table').nth(1);
    await expect(table.locator('td[rowspan="2"]')).toHaveCount(1);
    const widths = await table
      .locator('tr')
      .first()
      .locator(':scope > td')
      .evaluateAll((cells) => cells.map((cell) => cell.getBoundingClientRect().width));
    expect(Math.abs(widths[0] - widths[1])).toBeLessThan(1);
    await expect(body).toContainText('Outer second');
  };
  await assertNested();
  for (let pass = 1; pass <= 2; pass++) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await pending).path())!);
    await writeFile(path.join(directory, `nested-columns-roundtrip-${pass}.docx`), bytes);
    await load(bytes, `Nested-reopened-${pass}.docx`);
    await assertNested();
  }
});

test('mouse cell selection distributes only selected columns and reopens native widths', async ({
  page,
}) => {
  const directory = path.resolve('docs/audits/2026-11-26/word-row-properties');
  const source = Buffer.from(
    await Packer.toArrayBuffer(
      new Document({
        sections: [
          {
            children: [
              new Table({
                columnWidths: [1200, 2400, 4500],
                rows: [0, 1].map(
                  (row) =>
                    new TableRow({
                      children: [0, 1, 2].map(
                        (column) =>
                          new TableCell({ children: [new Paragraph(`Selected ${row}-${column}`)] })
                      ),
                    })
                ),
              }),
            ],
          },
        ],
      })
    )
  );
  await writeFile(path.join(directory, 'selected-columns-source.docx'), source);
  await page.goto('/#/components/office-studio');
  const load = async (bytes: Buffer, name: string) => {
    await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
      name,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: bytes,
    });
    await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(name);
  };
  await load(source, 'Selected-columns.docx');
  const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  const cells = body.locator('tr').first().locator('td');
  const original = await cells.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('colwidth'))
  );
  await cells.nth(0).scrollIntoViewIfNeeded();
  const selectColumns = async () => {
    await cells.nth(0).scrollIntoViewIfNeeded();
    const start = (await cells.nth(0).boundingBox())!;
    const end = (await cells.nth(1).boundingBox())!;
    await page.mouse.move(start.x + 4, start.y + start.height / 2);
    await page.mouse.down();
    await page.mouse.move(end.x + end.width - 4, end.y + end.height / 2, { steps: 10 });
    await page.mouse.up();
    await expect(body.locator('td.selectedCell')).toHaveCount(2);
  };
  await selectColumns();
  await page.getByRole('tab', { name: '插入', exact: true }).click();
  await page.getByRole('button', { name: '平均分布表格列', exact: true }).click();
  const assertWidths = async () => {
    const widths = await cells.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('colwidth'))
    );
    expect(widths[0]).toBe(widths[1]);
    expect(widths[2]).toBe(original[2]);
    return widths;
  };
  await assertWidths();
  await page.getByRole('tab', { name: '开始', exact: true }).click();
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  expect(
    await cells.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('colwidth'))
    )
  ).toEqual(original);
  await page.getByRole('button', { name: '重做', exact: true }).click();
  for (let pass = 1; pass <= 2; pass++) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await pending).path())!);
    await writeFile(path.join(directory, `selected-columns-roundtrip-${pass}.docx`), bytes);
    await load(bytes, `Selected-reopened-${pass}.docx`);
    await assertWidths();
  }
  await writeFile(
    path.join(directory, 'selected-columns-evidence.json'),
    JSON.stringify({ original, result: await assertWidths(), reopenCycles: 2 }, null, 2)
  );
  for (const small of [false, true]) {
    if (small) await page.setViewportSize({ width: 320, height: 720 });
    for (const theme of ['light', 'dark']) {
      if (theme === 'dark')
        await page.getByRole('button', { name: '切换暗色', exact: true }).click();
      await selectColumns();
      await page.getByRole('tab', { name: '插入', exact: true }).click();
      await page.getByRole('button', { name: '平均分布表格列', exact: true }).click();
      await assertWidths();
      await cells.nth(0).scrollIntoViewIfNeeded();
      await page.screenshot({
        path: path.join(directory, `selected-columns-${theme}${small ? '-320' : ''}.png`),
        fullPage: true,
      });
      if (theme === 'dark')
        await page.getByRole('button', { name: '切换浅色', exact: true }).click();
    }
  }
  await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  await expect(page.getByRole('button', { name: '平均分布表格列', exact: true })).toBeDisabled();
});

test('merged boundary retains unselected column widths through native mouse editing', async ({
  page,
}) => {
  const directory = path.resolve('docs/audits/2026-11-26/word-row-properties');
  const source = Buffer.from(
    await Packer.toArrayBuffer(
      new Document({
        sections: [
          {
            children: [
              new Table({
                columnWidths: [1200, 2400, 4500],
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph('First column')] }),
                      new TableCell({ columnSpan: 2, children: [new Paragraph('Boundary merge')] }),
                    ],
                  }),
                  new TableRow({
                    children: [0, 1, 2].map(
                      (column) => new TableCell({ children: [new Paragraph(`Boundary ${column}`)] })
                    ),
                  }),
                ],
              }),
            ],
          },
        ],
      })
    )
  );
  await writeFile(path.join(directory, 'boundary-columns-source.docx'), source);
  await page.goto('/#/components/office-studio');
  const load = async (bytes: Buffer, name: string) => {
    await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
      name,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: bytes,
    });
    await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(name);
  };
  await load(source, 'Boundary-columns.docx');
  const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  const cells = body.locator('tr').last().locator('td');
  const original = await cells.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('colwidth'))
  );
  await cells.nth(0).scrollIntoViewIfNeeded();
  const selectColumns = async () => {
    await cells.nth(0).scrollIntoViewIfNeeded();
    const start = (await cells.nth(0).boundingBox())!;
    const end = (await cells.nth(1).boundingBox())!;
    await page.mouse.move(start.x + 4, start.y + start.height / 2);
    await page.mouse.down();
    await page.mouse.move(end.x + end.width - 4, end.y + end.height / 2, { steps: 10 });
    await page.mouse.up();
    await expect(body.locator('td.selectedCell')).toHaveCount(2);
  };
  await selectColumns();
  await page.getByRole('tab', { name: '插入', exact: true }).click();
  await page.getByRole('button', { name: '平均分布表格列', exact: true }).click();
  const assertWidths = async () => {
    const widths = await cells.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('colwidth'))
    );
    expect(widths[0]).toBe(widths[1]);
    expect(widths[2]).toBe(original[2]);
    const merged = body.locator('td[colspan="2"]');
    await expect(merged).toHaveCount(1);
    await expect(merged).toHaveAttribute('colwidth', `${widths[1]},${widths[2]}`);
    await expect(merged).toContainText('Boundary merge');
    return widths;
  };
  await assertWidths();
  await page.getByRole('tab', { name: '开始', exact: true }).click();
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  expect(
    await cells.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('colwidth'))
    )
  ).toEqual(original);
  await page.getByRole('button', { name: '重做', exact: true }).click();
  for (let pass = 1; pass <= 2; pass++) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await pending).path())!);
    await writeFile(path.join(directory, `boundary-columns-roundtrip-${pass}.docx`), bytes);
    await load(bytes, `Boundary-reopened-${pass}.docx`);
    await assertWidths();
  }
  await writeFile(
    path.join(directory, 'boundary-columns-evidence.json'),
    JSON.stringify({ original, result: await assertWidths(), reopenCycles: 2 }, null, 2)
  );
  for (const small of [false, true]) {
    if (small) await page.setViewportSize({ width: 320, height: 720 });
    for (const theme of ['light', 'dark']) {
      if (theme === 'dark')
        await page.getByRole('button', { name: '切换暗色', exact: true }).click();
      await selectColumns();
      await page.getByRole('tab', { name: '插入', exact: true }).click();
      await page.getByRole('button', { name: '平均分布表格列', exact: true }).click();
      await assertWidths();
      await cells.nth(0).scrollIntoViewIfNeeded();
      await page.screenshot({
        path: path.join(directory, `boundary-columns-${theme}${small ? '-320' : ''}.png`),
        fullPage: true,
      });
      if (theme === 'dark')
        await page.getByRole('button', { name: '切换浅色', exact: true }).click();
    }
  }
  await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  await expect(page.getByRole('button', { name: '平均分布表格列', exact: true })).toBeDisabled();
});

test('natural row distribution retains full multiline content through native reopening', async ({
  page,
}) => {
  const directory = path.resolve('docs/audits/2026-11-26/word-row-properties');
  const source = Buffer.from(
    await Packer.toArrayBuffer(
      new Document({
        sections: [
          {
            children: [
              new Table({
                rows: [1, 5].map(
                  (lines) =>
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: Array.from(
                                { length: lines },
                                (_, index) =>
                                  new TextRun({
                                    text: `Natural ${lines} line ${index + 1}`,
                                    font: 'Arial',
                                    size: 24,
                                    break: index ? 1 : 0,
                                  })
                              ),
                            }),
                          ],
                        }),
                      ],
                    })
                ),
              }),
            ],
          },
        ],
      })
    )
  );
  await writeFile(path.join(directory, 'natural-rows-source.docx'), source);
  await page.goto('/#/components/office-studio');
  const load = async (bytes: Buffer, name: string) => {
    await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
      name,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: bytes,
    });
    await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(name);
  };
  await load(source, 'Natural.docx');
  const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  await body.evaluate((element) => {
    (element as HTMLElement).focus();
    const paragraphs = element.querySelectorAll('td p');
    const range = document.createRange();
    range.setStart(paragraphs[0].firstChild!, 0);
    range.setEndAfter(paragraphs[1].lastChild!);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  });
  await page.getByRole('tab', { name: '插入', exact: true }).click();
  await page.getByRole('button', { name: '平均分布行', exact: true }).click();
  const assertRows = async () => {
    const rows = body.locator('tr');
    const heights = await rows.evaluateAll((elements) =>
      elements.map((element) => element.getBoundingClientRect().height)
    );
    expect(Math.abs(heights[0] - heights[1])).toBeLessThan(1);
    for (const row of await rows.all())
      await expect(row).toHaveAttribute('data-word-row-height-rule', 'atLeast');
    await expect(body).toContainText('Natural 5 line 5');
    return heights;
  };
  await assertRows();
  await page.getByRole('tab', { name: '开始', exact: true }).click();
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  await expect(body.locator('tr').first()).not.toHaveAttribute('data-word-row-height');
  await page.getByRole('button', { name: '重做', exact: true }).click();
  for (let pass = 1; pass <= 2; pass++) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await pending).path())!);
    await writeFile(path.join(directory, `natural-rows-roundtrip-${pass}.docx`), bytes);
    await load(bytes, `Natural-reopened-${pass}.docx`);
    await assertRows();
  }
  await writeFile(
    path.join(directory, 'natural-rows-evidence.json'),
    JSON.stringify(
      { heights: await assertRows(), lastLineRetained: true, reopenCycles: 2 },
      null,
      2
    )
  );
});
