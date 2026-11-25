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
