import { expect, test } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import JSZip from '../docs/node_modules/jszip/lib/index.js';

test('keeps tall equation atoms and following text positions together at an actual page boundary', async ({ page, context }) => {
  const audit = path.resolve('docs/audits/2026-11-26/word-math-regions');
  const zip = await JSZip.loadAsync(await readFile('docs/audits/2026-11-26/word-math-groups/math-source.docx'));
  const main = await zip.file('word/document.xml')!.async('string');
  const filler = `<w:p><w:pPr><w:widowControl w:val="0"/><w:spacing w:line="360" w:lineRule="exact"/></w:pPr><w:r>${Array.from({ length: 37 }, (_, i) => `${i ? '<w:br/>' : ''}<w:t>Math filler ${i}</w:t>`).join('')}</w:r></w:p>`;
  const t = (text: string) => `<m:r><w:rPr><w:sz w:val="72"/></w:rPr><m:t>${text}</m:t></m:r>`;
  const equation = `<w:p><w:pPr><w:widowControl w:val="0"/></w:pPr><w:r><w:t>before</w:t></w:r><m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"><m:f><m:num>${t('x')}</m:num><m:den><m:f><m:num>${t('a')}</m:num><m:den>${t('b')}</m:den></m:f></m:den></m:f></m:oMath><w:r><w:t>after</w:t><w:br/><w:t>next line</w:t></w:r></w:p>`;
  zip.file('word/document.xml', main.replace('<w:body>', `<w:body>${filler}${equation}`));
  const source = await zip.generateAsync({ type: 'nodebuffer' });
  await writeFile(path.join(audit, 'layout-source.docx'), source);
  await page.goto('/#/components/office-studio');
  await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({ name: 'Math-layout.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: source });
  const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  await page.getByRole('tab', { name: '视图', exact: true }).click();
  await page.getByRole('checkbox', { name: '分页布局', exact: true }).check();
  const paragraph = body.locator('p').filter({ hasText: 'before' });
  await expect(paragraph).toHaveAttribute('data-word-page-first', '2');
  await expect(paragraph.locator('[data-word-math]')).toHaveCount(1);
  await expect(paragraph).toContainText('after');
  await expect(paragraph).toContainText('next line');
  await expect(paragraph.locator('mfrac')).toHaveCount(2);
  const math = paragraph.locator('[data-word-math]');
  const original = (await math.getAttribute('data-word-math'))!;
  await math.click();
  await page.getByRole('tab', { name: '插入', exact: true }).click();
  await page.getByRole('button', { name: '数学公式', exact: true }).click();
  await page.getByRole('textbox', { name: '公式 分子文字', exact: true }).fill('x+1');
  await page.getByRole('button', { name: '保存数学公式', exact: true }).click();
  const edited = (await math.getAttribute('data-word-math'))!;
  expect(edited).not.toBe(original);
  await page.getByRole('tab', { name: '开始', exact: true }).click();
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  await expect(math).toHaveAttribute('data-word-math', original);
  await page.getByRole('button', { name: '重做', exact: true }).click();
  await expect(math).toHaveAttribute('data-word-math', edited);
  for (let round = 1; round <= 2; round++) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await pending).path())!);
    await writeFile(path.join(audit, `layout-round-${round}.docx`), bytes);
    const saved = await JSZip.loadAsync(bytes);
    const native = await saved.file('word/document.xml')!.async('string');
    expect((native.match(/<m:f>/g) || [])).toHaveLength(3);
    expect(native).toContain('x+1');
    await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({ name: `Math-layout-round-${round}.docx`, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: bytes });
    await page.getByRole('tab', { name: '视图', exact: true }).click();
    await page.getByRole('checkbox', { name: '分页布局', exact: true }).check();
    await expect(paragraph).toHaveAttribute('data-word-page-first', '2');
    await expect(math).toHaveAttribute('data-word-math', edited);
    await expect(paragraph).toContainText('after');
    await expect(paragraph).toContainText('next line');
  }
  await page.evaluate(() => window.addEventListener('message', event => {
    if (event.data?.type === 'math-layout-print') (window as Window & { mathLayoutPrint?: string }).mathLayoutPrint = event.data.html;
  }));
  await page.addInitScript(() => {
    window.print = () => {
      window.parent.postMessage({ type: 'math-layout-print', html: document.documentElement.outerHTML }, '*');
      window.dispatchEvent(new Event('afterprint'));
    };
  });
  await page.getByRole('button', { name: '打印', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as Window & { mathLayoutPrint?: string }).mathLayoutPrint)).toBeTruthy();
  const html = await page.evaluate(() => (window as Window & { mathLayoutPrint?: string }).mathLayoutPrint!);
  const preview = await context.newPage();
  await preview.setContent(html);
  await preview.evaluate(() => document.fonts.ready);
  const printFile = path.join(audit, 'math-layout-print.pdf');
  await preview.pdf({ path: printFile, preferCSSPageSize: true, printBackground: true });
  await preview.close();

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
  const task = pdfjs.getDocument({ data: new Uint8Array(await readFile(printFile)), useSystemFonts: true });
  const pdf = await task.promise;
  const texts: string[] = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const content = await (await pdf.getPage(n)).getTextContent();
    texts.push(content.items.map(item => 'str' in item ? item.str : '').join(' '));
  }
  await task.destroy();
  const compact = texts.map(text => text.replace(/\s/g, ''));
  expect(compact[0]).toContain('Mathfiller36');
  expect(compact[0]).not.toContain('before');
  expect(compact[1]).toContain('before');
  expect(compact[1]).toContain('after');
  expect(compact[1]).toContain('nextline');
  await writeFile(path.join(audit, 'math-layout-print-pages.json'), JSON.stringify(texts, null, 2) + '\n');
  await paragraph.scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(audit, 'math-layout-light.png'), fullPage: true });
  await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  await page.screenshot({ path: path.join(audit, 'math-layout-dark.png'), fullPage: true });
  await page.setViewportSize({ width: 320, height: 720 });
  await paragraph.scrollIntoViewIfNeeded();
  await expect(paragraph).toHaveAttribute('data-word-page-first', '2');
  await page.screenshot({ path: path.join(audit, 'math-layout-320.png'), fullPage: true });
});
