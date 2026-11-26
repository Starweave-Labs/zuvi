import { expect, test } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  Document,
  Paragraph,
  Packer,
  Table,
  TableRow,
  TableCell,
  SimpleField,
} from '../docs/node_modules/docx/dist/index.mjs';
import JSZip from '../docs/node_modules/jszip/lib/index.js';
test('native table formula editing and refresh preserve fields through two DOCX reopenings', async ({
  page,
}) => {
  const audit = path.resolve('docs/audits/2026-11-26/word-table-formula');
  await mkdir(audit, { recursive: true });
  const source = Buffer.from(
    await Packer.toArrayBuffer(
      new Document({
        sections: [
          {
            children: [
              new Table({
                columnWidths: [2500, 2500, 2500],
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph('2')] }),
                      new TableCell({
                        children: [new Paragraph({ children: [new SimpleField('=A1*3', '99')] })],
                      }),
                      new TableCell({ children: [new Paragraph('')] }),
                    ],
                  }),
                ],
              }),
              new Paragraph('Formula outside'),
            ],
          },
        ],
      })
    )
  );
  await writeFile(path.join(audit, 'formula-source.docx'), source);
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
  await importFile('Formulas.docx', source);
  const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  const fields = body.locator('[data-word-table-formula]');
  await expect(fields).toHaveText('99');
  await body.locator('td').last().locator('p').click();
  await page.getByRole('tab', { name: '插入', exact: true }).click();
  await page.getByRole('button', { name: '表格公式', exact: true }).click();
  await page.getByRole('textbox', { name: '表格公式表达式' }).fill('=SUM(LEFT)');
  await page.screenshot({
    path: path.join(audit, 'formula-dialog-light.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.screenshot({
    path: path.join(audit, 'formula-dialog-light-320.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: '取消', exact: true }).click();
  await expect(fields).toHaveCount(1);
  await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  await page.getByRole('button', { name: '表格公式', exact: true }).click();
  await page.getByRole('textbox', { name: '表格公式表达式' }).fill('=SUM(LEFT)');
  await page.screenshot({
    path: path.join(audit, 'formula-dialog-dark-320.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.screenshot({
    path: path.join(audit, 'formula-dialog-dark.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: /^公式数字格式/ }).click();
  await page.getByRole('option', { name: '两位小数', exact: true }).click();
  await expect(page.getByRole('textbox', { name: '表格公式表达式' })).toHaveValue(
    '=SUM(LEFT) \\# "0.00"'
  );
  await page.getByRole('button', { name: '保存公式', exact: true }).click();
  await expect(fields).toHaveText(['99', '8.00']);
  await page.getByRole('button', { name: '刷新公式', exact: true }).click();
  await expect(fields).toHaveText(['6', '8.00']);
  await page.getByRole('tab', { name: '开始', exact: true }).click();
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  await expect(fields).toHaveText(['99', '8.00']);
  await page.getByRole('button', { name: '重做', exact: true }).click();
  await expect(fields).toHaveText(['6', '8.00']);
  for (let pass = 1; pass <= 2; pass++) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await pending).path())!);
    await writeFile(path.join(audit, `formula-roundtrip-${pass}.docx`), bytes);
    const zip = await JSZip.loadAsync(bytes);
    expect(await zip.file('word/document.xml')!.async('string')).toContain(
      'w:instr="=SUM(LEFT) \\# &quot;0.00&quot;"'
    );
    await importFile(`Formulas-reopened-${pass}.docx`, bytes);
    await expect(fields).toHaveText(['6', '8.00']);
    await expect(body).toContainText('Formula outside');
  }
  await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  await page.getByRole('tab', { name: '插入', exact: true }).click();
  await expect(page.getByRole('button', { name: '表格公式', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: '刷新公式', exact: true })).toBeDisabled();
});

test('native direction formulas and merged cells refresh independently through repeated DOCX saves', async ({
  page,
}) => {
  const audit = path.resolve('docs/audits/2026-11-26/word-table-formula');
  const numberCell = (text: string) => new TableCell({ children: [new Paragraph(text)] });
  const formulaCell = (formula: string) =>
    new TableCell({ children: [new Paragraph({ children: [new SimpleField(formula, '99')] })] });
  const table = (rows: TableRow[]) => new Table({ columnWidths: [2500, 2500, 2500], rows });
  const source = Buffer.from(
    await Packer.toArrayBuffer(
      new Document({
        sections: [
          {
            children: [
              table([
                new TableRow({
                  children: [numberCell('2'), numberCell('3'), formulaCell('=SUM(LEFT)')],
                }),
              ]),
              table([
                new TableRow({
                  children: [formulaCell('=SUM(RIGHT)'), numberCell('4'), numberCell('5')],
                }),
              ]),
              table([
                new TableRow({ children: [numberCell('6')] }),
                new TableRow({ children: [numberCell('7')] }),
                new TableRow({ children: [formulaCell('=SUM(ABOVE)')] }),
              ]),
              table([
                new TableRow({ children: [formulaCell('=SUM(BELOW)')] }),
                new TableRow({ children: [numberCell('8')] }),
                new TableRow({ children: [numberCell('9')] }),
              ]),
              table([
                new TableRow({
                  children: [
                    new TableCell({ columnSpan: 2, children: [new Paragraph('10')] }),
                    formulaCell('=SUM(LEFT)'),
                  ],
                }),
              ]),
            ],
          },
        ],
      })
    )
  );
  await writeFile(path.join(audit, 'directions-source.docx'), source);
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
  await importFile('Directions.docx', source);
  const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  const fields = body.locator('[data-word-table-formula]');
  await expect(fields).toHaveCount(5);
  await page.getByRole('tab', { name: '插入', exact: true }).click();
  await page.getByRole('button', { name: '刷新公式', exact: true }).click();
  await expect(fields).toHaveText(['5', '9', '13', '17', '10']);
  for (let pass = 1; pass <= 2; pass++) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await pending).path())!);
    await writeFile(path.join(audit, `directions-roundtrip-${pass}.docx`), bytes);
    await importFile(`Directions-${pass}.docx`, bytes);
    await expect(fields).toHaveText(['5', '9', '13', '17', '10']);
    await expect(body.locator('td[colspan="2"]')).toHaveText('10');
  }
});

test('nested and vertically merged native table formulas refresh using their own grids and reopen twice', async ({
  page,
}) => {
  const audit = path.resolve('docs/audits/2026-11-26/word-table-formula');
  const numberCell = (text: string) => new TableCell({ children: [new Paragraph(text)] });
  const formulaCell = (formula: string) =>
    new TableCell({ children: [new Paragraph({ children: [new SimpleField(formula, '99')] })] });
  const nested = new Table({
    columnWidths: [2000, 2000],
    rows: [new TableRow({ children: [numberCell('4'), formulaCell('=A1*2')] })],
  });
  const outer = new Table({
    columnWidths: [3000, 4000],
    rows: [
      new TableRow({
        children: [
          new TableCell({ rowSpan: 2, children: [new Paragraph('3')] }),
          new TableCell({
            children: [
              new Paragraph({ children: [new SimpleField('=SUM(LEFT)', '99')] }),
              nested,
              new Paragraph('Outer tail'),
            ],
          }),
        ],
      }),
      new TableRow({ children: [formulaCell('=SUM(ABOVE)')] }),
    ],
  });
  const source = Buffer.from(
    await Packer.toArrayBuffer(new Document({ sections: [{ children: [outer] }] }))
  );
  await writeFile(path.join(audit, 'nested-merge-source.docx'), source);
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
  await importFile('Nested-merge.docx', source);
  const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  const fields = body.locator('[data-word-table-formula]');
  await expect(fields).toHaveCount(3);
  await page.getByRole('tab', { name: '插入', exact: true }).click();
  await page.getByRole('button', { name: '刷新公式', exact: true }).click();
  await expect(fields).toHaveText(['3', '8', '3']);
  for (let pass = 1; pass <= 2; pass++) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await pending).path())!);
    await writeFile(path.join(audit, `nested-merge-roundtrip-${pass}.docx`), bytes);
    await importFile(`Nested-merge-${pass}.docx`, bytes);
    await expect(fields).toHaveText(['3', '8', '3']);
    await expect(body.locator('td[rowspan="2"]')).toHaveText('3');
    await expect(body.locator('table')).toHaveCount(2);
    await expect(body).toContainText('Outer tail');
  }
});
