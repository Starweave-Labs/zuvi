import { expect, test } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  Document,
  Paragraph,
  TextRun,
  ExternalHyperlink,
  Packer,
  Table,
  TableRow,
  TableCell,
} from '../docs/node_modules/docx/dist/index.mjs';
import JSZip from '../docs/node_modules/jszip/lib/index.js';

test('text and table conversion preserves native rich content with cancellation, history and repeated DOCX reopening', async ({
  page,
}) => {
  const audit = path.resolve('docs/audits/2026-11-26/word-table-conversion');
  await mkdir(audit, { recursive: true });
  const bytes = Buffer.from(
    await Packer.toArrayBuffer(
      new Document({
        sections: [
          {
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Alpha', bold: true, size: 28, color: '0055AA' }),
                  new TextRun('\t'),
                  new ExternalHyperlink({
                    link: 'https://example.com/conversion',
                    children: [new TextRun({ text: 'Linked', italics: true })],
                  }),
                  new TextRun('\t\tTail'),
                ],
              }),
              new Paragraph({ children: [new TextRun('Second\tEnd')] }),
              new Paragraph({ children: [new TextRun('Keep outside')] }),
            ],
          },
        ],
      })
    )
  );
  await writeFile(path.join(audit, 'conversion-source.docx'), bytes);
  await page.goto('/#/components/office-studio');
  const importFile = async (name: string, buffer: Buffer) => {
    await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
      name,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer,
    });
    await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(name);
  };
  await importFile('Conversion.docx', bytes);
  const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  await expect(body).toContainText('Keep outside');
  await body.evaluate((element) => {
    const paragraphs = element.querySelectorAll('p');
    (element as HTMLElement).focus();
    const range = document.createRange();
    range.setStart(paragraphs[0], 0);
    range.setEnd(paragraphs[1], paragraphs[1].childNodes.length);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  });
  await page.getByRole('tab', { name: '插入', exact: true }).click();
  await page.getByRole('button', { name: '文本转表格', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('2 行，4 列');
  await page.getByRole('button', { name: '取消', exact: true }).click();
  await expect(body.locator('table')).toHaveCount(0);
  await page.getByRole('button', { name: '文本转表格', exact: true }).click();
  for (const theme of ['light', 'dark']) {
    if (theme === 'dark') {
      await page.getByRole('button', { name: '取消', exact: true }).click();
      await page.getByRole('button', { name: '切换暗色', exact: true }).click();
      await page.getByRole('button', { name: '文本转表格', exact: true }).click();
    }
    for (const width of [1280, 320]) {
      await page.setViewportSize({ width, height: 800 });
      await page.screenshot({
        path: path.join(audit, `conversion-dialog-${theme}-${width}.png`),
        fullPage: true,
        animations: 'disabled',
      });
    }
  }
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByRole('button', { name: '转换', exact: true }).click();
  const table = body.locator('table');
  await expect(table.locator('tr')).toHaveCount(2);
  await expect(table.locator('td')).toHaveCount(8);
  await expect(table.locator('strong')).toHaveText('Alpha');
  await expect(table.locator('td').first().locator('span')).toHaveCSS('color', 'rgb(0, 85, 170)');
  await expect(table.locator('a')).toHaveAttribute('href', 'https://example.com/conversion');
  await expect(table.locator('tr').first().locator('td').nth(2)).toHaveText('');
  await expect(body.locator('p').filter({ hasText: 'Keep outside' })).toHaveCount(1);
  await page.getByRole('tab', { name: '开始', exact: true }).click();
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  await expect(table).toHaveCount(0);
  await page.getByRole('button', { name: '重做', exact: true }).click();
  await expect(table.locator('td')).toHaveCount(8);
  const exportFile = async (name: string) => {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const buffer = await readFile((await (await pending).path())!);
    await writeFile(path.join(audit, name), buffer);
    return buffer;
  };
  for (let pass = 1; pass <= 2; pass++) {
    const buffer = await exportFile(`conversion-table-roundtrip-${pass}.docx`);
    const zip = await JSZip.loadAsync(buffer);
    const xml = await zip.file('word/document.xml')!.async('string');
    expect(xml).toContain('<w:tbl>');
    expect(xml.toLowerCase()).toContain('0055aa');
    expect(xml).toContain('w:sz w:val="28"');
    expect(await zip.file('word/_rels/document.xml.rels')!.async('string')).toContain(
      'https://example.com/conversion'
    );
    await importFile(`Table-reopened-${pass}.docx`, buffer);
    await expect(table.locator('td')).toHaveCount(8);
    await expect(table.locator('strong')).toHaveText('Alpha');
    await expect(table.locator('a')).toHaveText('Linked');
  }
  await table.locator('td').first().locator('p').click();
  await page.getByRole('tab', { name: '插入', exact: true }).click();
  await page.getByRole('button', { name: '表格转文本', exact: true }).click();
  await page.getByRole('button', { name: '转换', exact: true }).click();
  await expect(table).toHaveCount(0);
  await expect(body.locator('strong')).toHaveText('Alpha');
  await expect(body.locator('a')).toHaveAttribute('href', 'https://example.com/conversion');
  await page.getByRole('tab', { name: '开始', exact: true }).click();
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  await expect(table.locator('td')).toHaveCount(8);
  await page.getByRole('button', { name: '重做', exact: true }).click();
  await expect(table).toHaveCount(0);
  for (let pass = 1; pass <= 2; pass++) {
    const buffer = await exportFile(`conversion-text-roundtrip-${pass}.docx`);
    const xml = await (await JSZip.loadAsync(buffer)).file('word/document.xml')!.async('string');
    expect(xml).not.toContain('<w:tbl>');
    expect(xml).toContain('<w:tab/>');
    await importFile(`Text-reopened-${pass}.docx`, buffer);
    await expect(body.locator('strong')).toHaveText('Alpha');
    await expect(body.locator('a')).toHaveText('Linked');
    await expect(body).toContainText('Keep outside');
  }
  await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  await page.getByRole('tab', { name: '插入', exact: true }).click();
  await expect(page.getByRole('button', { name: '文本转表格', exact: true })).toBeDisabled();
  await writeFile(
    path.join(audit, 'conversion-browser-evidence.json'),
    JSON.stringify(
      { rows: 2, columns: 4, tableReopens: 2, textReopens: 2, history: true, readonly: true },
      null,
      2
    )
  );
});

test('partial native paragraph conversion keeps unselected text and formatting through DOCX reopening', async ({
  page,
}) => {
  const audit = path.resolve('docs/audits/2026-11-26/word-table-conversion');
  const buffer = Buffer.from(
    await Packer.toArrayBuffer(
      new Document({
        sections: [
          {
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Prefix Alpha,Beta Suffix', bold: true, size: 28 })],
              }),
            ],
          },
        ],
      })
    )
  );
  await writeFile(path.join(audit, 'partial-source.docx'), buffer);
  await page.goto('/#/components/office-studio');
  const importFile = (name: string, bytes: Buffer) =>
    page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
      name,
      buffer: bytes,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
  await importFile('Partial.docx', buffer);
  const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  await expect(body).toContainText('Prefix Alpha,Beta Suffix');
  await body.evaluate((element) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (!node.textContent?.includes('Prefix Alpha')) continue;
      (element as HTMLElement).focus();
      const range = document.createRange();
      range.setStart(node, 7);
      range.setEnd(node, 17);
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
      document.dispatchEvent(new Event('selectionchange'));
      break;
    }
  });
  await page.getByRole('tab', { name: '插入', exact: true }).click();
  await page.getByRole('button', { name: '文本转表格', exact: true }).click();
  await page.getByRole('button', { name: /^转换分隔符/ }).click();
  await page.getByRole('option', { name: '逗号', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('1 行，2 列');
  await page.getByRole('button', { name: '转换', exact: true }).click();
  await expect(body.locator('td')).toHaveCount(2);
  await expect(body.locator('td').first()).toHaveText('Alpha');
  await expect(body.locator('td').nth(1)).toHaveText('Beta');
  await expect(body.locator(':scope > p').first()).toHaveText('Prefix ');
  await expect(body.locator(':scope > p').last()).toHaveText(' Suffix');
  await page.getByRole('tab', { name: '开始', exact: true }).click();
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  await expect(body.locator('table')).toHaveCount(0);
  await expect(body).toContainText('Prefix Alpha,Beta Suffix');
  await page.getByRole('button', { name: '重做', exact: true }).click();
  for (let pass = 1; pass <= 2; pass++) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await pending).path())!);
    await writeFile(path.join(audit, `partial-roundtrip-${pass}.docx`), bytes);
    await importFile(`Partial-reopened-${pass}.docx`, bytes);
    await expect(body.locator('td')).toHaveCount(2);
    await expect(body.locator(':scope > p').first()).toHaveText('Prefix ');
    await expect(body.locator(':scope > p').last()).toHaveText(' Suffix');
    await expect(body.locator('strong')).toHaveCount(4);
  }
});

test('nested native table conversion preserves nested structures by default and converts them recursively on request', async ({
  page,
}) => {
  const audit = path.resolve('docs/audits/2026-11-26/word-table-conversion');
  const nested = new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph('Nested A')] }),
          new TableCell({ children: [new Paragraph('Nested B')] }),
        ],
      }),
    ],
  });
  const outer = new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph('Outer start'), nested, new Paragraph('Outer end')],
          }),
          new TableCell({ children: [new Paragraph('Right cell')] }),
        ],
      }),
    ],
  });
  const source = Buffer.from(
    await Packer.toArrayBuffer(
      new Document({ sections: [{ children: [outer, new Paragraph('Outside')] }] })
    )
  );
  await writeFile(path.join(audit, 'nested-source.docx'), source);
  await page.goto('/#/components/office-studio');
  const input = page.getByLabel('导入文档文件', { exact: true });
  await input.setInputFiles({
    name: 'Nested conversion.docx',
    buffer: source,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  await expect(body.locator('table')).toHaveCount(2);
  const open = async () => {
    await body.locator('p').filter({ hasText: 'Outer start' }).click();
    await page.getByRole('tab', { name: '插入', exact: true }).click();
    await page.getByRole('button', { name: '表格转文本', exact: true }).click();
  };
  await open();
  await expect(page.getByRole('dialog')).toContainText('保留嵌套表格');
  await page.getByRole('button', { name: '转换', exact: true }).click();
  await expect(body.locator('table')).toHaveCount(1);
  await expect(body).toContainText('Nested A');
  await page.getByRole('tab', { name: '开始', exact: true }).click();
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  await expect(body.locator('table')).toHaveCount(2);
  await open();
  await page.getByRole('checkbox', { name: '同时转换嵌套表格', exact: true }).check();
  await page.getByRole('button', { name: '转换', exact: true }).click();
  await expect(body.locator('table')).toHaveCount(0);
  for (let pass = 1; pass <= 2; pass++) {
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await download).path())!);
    await writeFile(path.join(audit, `nested-roundtrip-${pass}.docx`), bytes);
    await input.setInputFiles({
      name: `Nested-reopened-${pass}.docx`,
      buffer: bytes,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    await expect(body.locator('table')).toHaveCount(0);
    for (const text of [
      'Outer start',
      'Nested A',
      'Nested B',
      'Outer end',
      'Right cell',
      'Outside',
    ])
      await expect(body).toContainText(text);
  }
});

test('native mouse row selection converts only selected rows and preserves two surrounding tables on reopening', async ({
  page,
}) => {
  const audit = path.resolve('docs/audits/2026-11-26/word-table-conversion');
  const table = new Table({
    columnWidths: [3000, 3000],
    rows: ['Before', 'Selected', 'After'].map(
      (text) =>
        new TableRow({
          children: [text, 'Value'].map(
            (value) => new TableCell({ children: [new Paragraph(value)] })
          ),
        })
    ),
  });
  const source = Buffer.from(
    await Packer.toArrayBuffer(
      new Document({ sections: [{ children: [table, new Paragraph('Outside')] }] })
    )
  );
  await writeFile(path.join(audit, 'selected-rows-source.docx'), source);
  await page.goto('/#/components/office-studio');
  const input = page.getByLabel('导入文档文件', { exact: true });
  await input.setInputFiles({
    name: 'Selected rows.docx',
    buffer: source,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(
    'Selected rows.docx'
  );
  await expect(body.locator('tr')).toHaveCount(3);
  const topLeft = body.locator('tr').first().locator('td').first();
  const bottomLeft = body.locator('tr').last().locator('td').first();
  await topLeft.scrollIntoViewIfNeeded();
  const top = (await topLeft.boundingBox())!,
    bottom = (await bottomLeft.boundingBox())!;
  await page.mouse.move(top.x + 4, top.y + top.height / 2);
  await page.mouse.down();
  await page.mouse.move(bottom.x + 4, bottom.y + bottom.height / 2, { steps: 10 });
  await page.mouse.up();
  await expect(body.locator('td.selectedCell')).toHaveCount(3);
  await page.getByRole('tab', { name: '插入', exact: true }).click();
  await expect(page.getByRole('button', { name: '表格转文本', exact: true })).toBeDisabled();
  await expect(body.locator('table')).toHaveCount(1);
  const cells = body.locator('tr').nth(1).locator('td');
  await expect(cells.first()).toHaveText('Selected');
  await cells.first().scrollIntoViewIfNeeded();
  const first = (await cells.first().boundingBox())!,
    last = (await cells.last().boundingBox())!;
  await page.mouse.move(first.x + 4, first.y + first.height / 2);
  await page.mouse.down();
  await page.mouse.move(last.x + last.width - 4, last.y + last.height / 2, { steps: 10 });
  await page.mouse.up();
  await expect(body.locator('td.selectedCell')).toHaveCount(2);
  await page.getByRole('tab', { name: '插入', exact: true }).click();
  await page.getByRole('button', { name: '表格转文本', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('转换所选 1 行');
  await page.screenshot({
    path: path.join(audit, 'selected-rows-dialog-light.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.screenshot({
    path: path.join(audit, 'selected-rows-dialog-light-320.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: '取消', exact: true }).click();
  await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  await page.getByRole('button', { name: '表格转文本', exact: true }).click();
  await page.screenshot({
    path: path.join(audit, 'selected-rows-dialog-dark-320.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.screenshot({
    path: path.join(audit, 'selected-rows-dialog-dark.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: '转换', exact: true }).click();
  await expect(body.locator('table')).toHaveCount(2);
  await expect(body.locator('table').first()).toContainText('Before');
  await expect(body.locator('table').last()).toContainText('After');
  await page.getByRole('tab', { name: '开始', exact: true }).click();
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  await expect(body.locator('table')).toHaveCount(1);
  await expect(body.locator('tr')).toHaveCount(3);
  await page.getByRole('button', { name: '重做', exact: true }).click();
  for (let pass = 1; pass <= 2; pass++) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await pending).path())!);
    await writeFile(path.join(audit, `selected-rows-roundtrip-${pass}.docx`), bytes);
    await input.setInputFiles({
      name: `Rows-reopened-${pass}.docx`,
      buffer: bytes,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(
      `Rows-reopened-${pass}.docx`
    );
    await expect(body.locator('table')).toHaveCount(2);
    await expect(body).toContainText('Selected');
    await expect(body).toContainText('Outside');
  }
  await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  await body.locator('table').first().locator('p').first().click();
  await page.getByRole('tab', { name: '插入', exact: true }).click();
  await expect(page.getByRole('button', { name: '表格转文本', exact: true })).toBeDisabled();
});

test('native merged row selection expands vertical merges and keeps untouched rows through DOCX reopening', async ({
  page,
}) => {
  const audit = path.resolve('docs/audits/2026-11-26/word-table-conversion');
  const table = new Table({
    columnWidths: [3000, 3000],
    rows: [
      new TableRow({
        children: [
          new TableCell({ rowSpan: 2, children: [new Paragraph('Merged')] }),
          new TableCell({ children: [new Paragraph('Top')] }),
        ],
      }),
      new TableRow({ children: [new TableCell({ children: [new Paragraph('Bottom')] })] }),
      new TableRow({
        children: [new TableCell({ columnSpan: 2, children: [new Paragraph('Wide untouched')] })],
      }),
    ],
  });
  const source = Buffer.from(
    await Packer.toArrayBuffer(
      new Document({ sections: [{ children: [table, new Paragraph('Outside merged')] }] })
    )
  );
  await writeFile(path.join(audit, 'merged-rows-source.docx'), source);
  await page.goto('/#/components/office-studio');
  const input = page.getByLabel('导入文档文件', { exact: true });
  const importFile = async (name: string, buffer: Buffer) => {
    await input.setInputFiles({
      name,
      buffer,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(name);
  };
  await importFile('Merged rows.docx', source);
  const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  await expect(body.locator('td[rowspan="2"]')).toHaveText('Merged');
  const firstCell = body.locator('td[rowspan="2"]');
  const lastCell = body.locator('td').filter({ hasText: /^Bottom$/ });
  await firstCell.scrollIntoViewIfNeeded();
  const first = (await firstCell.boundingBox())!,
    last = (await lastCell.boundingBox())!;
  await page.mouse.move(first.x + 4, first.y + 8);
  await page.mouse.down();
  await page.mouse.move(last.x + last.width - 4, last.y + last.height / 2, { steps: 10 });
  await page.mouse.up();
  await expect(body.locator('td.selectedCell')).toHaveCount(3);
  await page.getByRole('tab', { name: '插入', exact: true }).click();
  await page.getByRole('button', { name: '表格转文本', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('转换所选 2 行');
  await page.getByRole('button', { name: '转换', exact: true }).click();
  await expect(body.locator('table')).toHaveCount(1);
  await expect(body.locator('td[colspan="2"]')).toHaveText('Wide untouched');
  for (const text of ['Merged', 'Top', 'Bottom', 'Outside merged'])
    await expect(body).toContainText(text);
  await page.getByRole('tab', { name: '开始', exact: true }).click();
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  await expect(body.locator('td[rowspan="2"]')).toHaveText('Merged');
  await expect(body.locator('tr')).toHaveCount(3);
  await page.getByRole('button', { name: '重做', exact: true }).click();
  for (let pass = 1; pass <= 2; pass++) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await pending).path())!);
    await writeFile(path.join(audit, `merged-rows-roundtrip-${pass}.docx`), bytes);
    await importFile(`Merged-reopened-${pass}.docx`, bytes);
    await expect(body.locator('table')).toHaveCount(1);
    await expect(body.locator('td[colspan="2"]')).toHaveText('Wide untouched');
    for (const text of ['Merged', 'Top', 'Bottom', 'Outside merged'])
      await expect(body).toContainText(text);
  }
});
