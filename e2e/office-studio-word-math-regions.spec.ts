import { expect, test } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import JSZip from '../docs/node_modules/jszip/lib/index.js';

test('edits independent header and footer equation groups and reopens both regions twice', async ({ page }) => {
  const audit = path.resolve('docs/audits/2026-11-26/word-math-regions');
  const zip = await JSZip.loadAsync(await readFile('docs/audits/2026-11-26/word-math-groups/math-source.docx'));
  const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const group = (label: string) => `<m:oMathPara xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"><m:oMathParaPr><m:jc m:val="centerGroup"/></m:oMathParaPr><m:oMath><m:r><m:t>${label}</m:t></m:r></m:oMath><m:oMath><m:r><m:t>y</m:t></m:r></m:oMath></m:oMathPara>`;
  const main = await zip.file('word/document.xml')!.async('string');
  zip.file('word/document.xml', main.replace(/<w:body>[\s\S]*<\/w:body>/, `<w:body><w:p><w:r><w:t>正文保持</w:t></w:r></w:p><w:sectPr><w:headerReference w:type="default" r:id="mathHeader"/><w:footerReference w:type="default" r:id="mathFooter"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:bottom="1134" w:left="1134" w:right="1134" w:header="567" w:footer="567"/></w:sectPr></w:body>`));
  zip.file('word/header1.xml', `<w:hdr xmlns:w="${W}"><w:p>${group('header')}</w:p></w:hdr>`);
  zip.file('word/footer1.xml', `<w:ftr xmlns:w="${W}"><w:p>${group('footer')}</w:p></w:ftr>`);
  const relPath = 'word/_rels/document.xml.rels';
  const rels = await zip.file(relPath)!.async('string');
  zip.file(relPath, rels.replace('</Relationships>', '<Relationship Id="mathHeader" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/><Relationship Id="mathFooter" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>'));
  const types = await zip.file('[Content_Types].xml')!.async('string');
  zip.file('[Content_Types].xml', types.replace('</Types>', '<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>'));
  const source = await zip.generateAsync({ type: 'nodebuffer' });
  await writeFile(path.join(audit, 'regions-source.docx'), source);
  await page.goto('/#/components/office-studio');
  const importFile = (buffer: Buffer, name: string) => page.getByLabel('导入文档文件', { exact: true }).setInputFiles({ name, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer });
  await importFile(source, '区域公式.docx');
  const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  const expected: Record<string, string> = {};
  for (const [region, label] of [['header', '页眉'], ['footer', '页脚']]) {
    const box = page.getByRole('textbox', { name: `Word ${label}`, exact: true });
    await page.getByLabel(`${label}区域`, { exact: true }).dblclick();
    await expect(box).toHaveAttribute('contenteditable', 'true');
    await box.locator('[data-word-math]').click();
    await page.getByRole('tab', { name: '插入', exact: true }).click();
    await page.getByRole('button', { name: '数学公式', exact: true }).click();
    await page.getByRole('textbox', { name: '公式 组内第2公式文字', exact: true }).fill(`${region}+1`);
    await page.getByRole('button', { name: '保存数学公式', exact: true }).click();
    await expect(box.locator('mtext').nth(1)).toHaveText(`${region}+1`);
    expected[region] = (await box.locator('[data-word-math]').getAttribute('data-word-math'))!;
    await page.getByRole('tab', { name: '开始', exact: true }).click();
    await page.getByRole('button', { name: '撤销', exact: true }).click();
    await expect(box.locator('mtext').nth(1)).toHaveText('y');
    await page.getByRole('button', { name: '重做', exact: true }).click();
    await expect(box.locator('mtext').nth(1)).toHaveText(`${region}+1`);
    await expect(body).toHaveText('正文保持');
  }
  for (let round = 1; round <= 2; round++) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await pending).path())!);
    await writeFile(path.join(audit, `regions-round-${round}.docx`), bytes);
    await importFile(bytes, `区域重开${round}.docx`);
    for (const [region, label] of [['header', '页眉'], ['footer', '页脚']])
      await expect(page.getByRole('textbox', { name: `Word ${label}`, exact: true }).locator('[data-word-math]')).toHaveAttribute('data-word-math', expected[region]);
    await expect(body).toHaveText('正文保持');
  }
  await page.getByRole('textbox', { name: 'Word 页脚', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(audit, 'regions-light.png'), fullPage: true });
  await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  await page.screenshot({ path: path.join(audit, 'regions-dark.png'), fullPage: true });
  await page.setViewportSize({ width: 320, height: 720 });
  await page.screenshot({ path: path.join(audit, 'regions-320.png'), fullPage: true });
  await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  for (const label of ['页眉', '页脚']) await expect(page.getByRole('textbox', { name: `Word ${label}`, exact: true })).toHaveAttribute('contenteditable', 'false');
});
