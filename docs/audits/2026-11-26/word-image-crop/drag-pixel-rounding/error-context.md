# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-word-crop.spec.ts >> native image crop preserves original bytes through visual editing, reset, print and two reopenings
- Location: e2e/office-studio-word-crop.spec.ts:8:1

# Error details

```
Error: expect(locator).toHaveValue(expected) failed

Locator:  getByRole('dialog', { name: '图片裁剪', exact: true }).getByRole('spinbutton', { name: '左边裁剪百分比' })
Expected: "30"
Received: "29.948"
Timeout:  5000ms

Call log:
  - Expect "toHaveValue" getByRole('dialog', { name: '图片裁剪', exact: true }).getByRole('spinbutton', { name: '左边裁剪百分比' }) with timeout 5000ms
  - waiting for getByRole('dialog', { name: '图片裁剪', exact: true }).getByRole('spinbutton', { name: '左边裁剪百分比' })
    14 × locator resolved to <input min="0" step="0.1" max="99.999" type="number" value="29.948" data-part="input" aria-label="左边裁剪百分比" class="zuvi-input-field"/>
       - unexpected value "29.948"

```

```yaml
- spinbutton "左边裁剪百分比": "29.948"
```

# Test source

```ts
  1   | import { expect, test } from '@playwright/test';
  2   | import { readFile, writeFile } from 'node:fs/promises';
  3   | import path from 'node:path';
  4   | import { createHash } from 'node:crypto';
  5   | import { Document, Paragraph, ImageRun, Packer } from '../docs/node_modules/docx/dist/index.mjs';
  6   | import JSZip from '../docs/node_modules/jszip/lib/index.js';
  7   |
  8   | test('native image crop preserves original bytes through visual editing, reset, print and two reopenings', async ({
  9   |   page,
  10  |   context,
  11  | }) => {
  12  |   const audit = path.resolve('docs/audits/2026-11-26/word-image-crop');
  13  |   const original = await readFile(path.join(audit, 'source-bars.png'));
  14  |   const hash = (data: Buffer) => createHash('sha256').update(data).digest('hex');
  15  |   const source = Buffer.from(
  16  |     await Packer.toArrayBuffer(
  17  |       new Document({
  18  |         sections: [
  19  |           {
  20  |             children: [
  21  |               new Paragraph({
  22  |                 children: [
  23  |                   new ImageRun({
  24  |                     type: 'png',
  25  |                     data: original,
  26  |                     transformation: { width: 300, height: 150 },
  27  |                     crop: { left: 25, right: 25 },
  28  |                     altText: { name: '四色原图', description: '四色原图', title: '四色原图' },
  29  |                   }),
  30  |                 ],
  31  |               }),
  32  |               new Paragraph('图片裁剪保留原图与文档内容。'),
  33  |             ],
  34  |           },
  35  |         ],
  36  |       })
  37  |     )
  38  |   );
  39  |   await writeFile(path.join(audit, 'crop-source.docx'), source);
  40  |   await page.addInitScript(() => {
  41  |     window.print = () => {
  42  |       window.parent.postMessage(
  43  |         { type: 'crop-print', html: document.documentElement.outerHTML },
  44  |         '*'
  45  |       );
  46  |       window.dispatchEvent(new Event('afterprint'));
  47  |     };
  48  |   });
  49  |   await page.goto('/#/components/office-studio');
  50  |   const importFile = async (buffer: Buffer, name: string) =>
  51  |     page
  52  |       .getByLabel('导入文档文件', { exact: true })
  53  |       .setInputFiles({
  54  |         name,
  55  |         mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  56  |         buffer,
  57  |       });
  58  |   await importFile(source, '图片裁剪.docx');
  59  |   const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  60  |   const image = body.getByRole('img', { name: '四色原图', exact: true });
  61  |   const frame = body.locator('[data-word-image-crop-frame]');
  62  |   await expect(image).toHaveCSS('left', '-150px');
  63  |   await image.click();
  64  |   await page.getByRole('button', { name: '裁剪图片', exact: true }).click();
  65  |   const dialog = page.getByRole('dialog', { name: '图片裁剪', exact: true });
  66  |   await expect(dialog.getByRole('spinbutton', { name: '左边裁剪百分比' })).toHaveValue('25');
  67  |   await dialog.getByRole('spinbutton', { name: '左边裁剪百分比' }).fill('30');
  68  |   await dialog.getByRole('button', { name: '取消', exact: true }).click();
  69  |   await expect(image).toHaveCSS('left', '-150px');
  70  |   await page.getByRole('button', { name: '裁剪图片', exact: true }).click();
  71  |   const handle = dialog.getByRole('button', { name: '拖动左边裁剪' });
  72  |   const handleBox = (await handle.boundingBox())!;
  73  |   const previewBox = (await dialog.locator('[data-word-crop-preview]').boundingBox())!;
  74  |   await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  75  |   await page.mouse.down();
  76  |   await page.mouse.move(
  77  |     handleBox.x + handleBox.width / 2 + previewBox.width * 0.05,
  78  |     handleBox.y + handleBox.height / 2
  79  |   );
  80  |   await page.mouse.up();
> 81  |   await expect(dialog.getByRole('spinbutton', { name: '左边裁剪百分比' })).toHaveValue('30');
      |                                                                     ^ Error: expect(locator).toHaveValue(expected) failed
  82  |   await dialog.getByRole('spinbutton', { name: '右边裁剪百分比' }).fill('80');
  83  |   await expect(dialog.getByRole('button', { name: '应用裁剪' })).toBeDisabled();
  84  |   await dialog.getByRole('spinbutton', { name: '右边裁剪百分比' }).fill('25');
  85  |   await page.screenshot({
  86  |     path: path.join(audit, 'crop-light.png'),
  87  |     fullPage: true,
  88  |     animations: 'disabled',
  89  |   });
  90  |   await dialog.getByRole('button', { name: '应用裁剪' }).click();
  91  |   await expect(image).toHaveAttribute('data-word-image-crop', /"left":30/);
  92  |   await page.getByRole('tab', { name: '开始', exact: true }).click();
  93  |   await page.getByRole('button', { name: '撤销', exact: true }).click();
  94  |   await expect(image).toHaveAttribute('data-word-image-crop', /"left":25/);
  95  |   await page.getByRole('button', { name: '重做', exact: true }).click();
  96  |   await expect(image).toHaveAttribute('data-word-image-crop', /"left":30/);
  97  |   const exportFile = async () => {
  98  |     const pending = page.waitForEvent('download');
  99  |     await page.getByRole('button', { name: '导出文件', exact: true }).click();
  100 |     return readFile((await (await pending).path())!);
  101 |   };
  102 |   for (let round = 1; round <= 2; round++) {
  103 |     const bytes = await exportFile();
  104 |     await writeFile(path.join(audit, `crop-round-${round}.docx`), bytes);
  105 |     const zip = await JSZip.loadAsync(bytes);
  106 |     const xml = await zip.file('word/document.xml')!.async('string');
  107 |     expect(xml).toContain('l="30000"');
  108 |     expect(xml).toContain('r="25000"');
  109 |     const media = Object.values(zip.files).filter(
  110 |       (file) => file.name.startsWith('word/media/') && !file.dir
  111 |     );
  112 |     expect(media).toHaveLength(1);
  113 |     expect(hash(await media[0].async('nodebuffer'))).toBe(hash(original));
  114 |     await importFile(bytes, `重开裁剪${round}.docx`);
  115 |     await expect(image).toHaveAttribute('data-word-image-crop', /"left":30/);
  116 |     await expect(frame).toHaveCSS('overflow', 'hidden');
  117 |   }
  118 |   await page.evaluate(() =>
  119 |     window.addEventListener('message', (event) => {
  120 |       if (event.data?.type === 'crop-print')
  121 |         (window as Window & { cropPrint?: string }).cropPrint = event.data.html;
  122 |     })
  123 |   );
  124 |   await page.getByRole('button', { name: '打印', exact: true }).click();
  125 |   await expect
  126 |     .poll(() => page.evaluate(() => (window as Window & { cropPrint?: string }).cropPrint))
  127 |     .toBeTruthy();
  128 |   const printed = await page.evaluate(() => (window as Window & { cropPrint?: string }).cropPrint!);
  129 |   await writeFile(path.join(audit, 'crop-print.html'), printed);
  130 |   const preview = await context.newPage();
  131 |   await preview.setContent(printed);
  132 |   const printedFrame = preview.locator('[data-word-image-crop-frame]');
  133 |   await expect(printedFrame).toHaveCSS('width', '300px');
  134 |   await expect(printedFrame).toHaveCSS('height', '150px');
  135 |   await expect(printedFrame.locator('img')).toHaveCSS('left', '-200px');
  136 |   await preview.screenshot({ path: path.join(audit, 'crop-print.png'), fullPage: true });
  137 |   await preview.close();
  138 |   await image.click();
  139 |   await page.getByRole('button', { name: '裁剪图片', exact: true }).click();
  140 |   await dialog.getByRole('button', { name: '重置裁剪', exact: true }).click();
  141 |   await dialog.getByRole('button', { name: '应用裁剪', exact: true }).click();
  142 |   await expect(image).not.toHaveAttribute('data-word-image-crop');
  143 |   await page.getByRole('tab', { name: '开始', exact: true }).click();
  144 |   await page.getByRole('button', { name: '撤销', exact: true }).click();
  145 |   await expect(image).toHaveAttribute('data-word-image-crop', /"left":30/);
  146 |   await image.click();
  147 |   await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  148 |   await page.getByRole('button', { name: '裁剪图片', exact: true }).click();
  149 |   await page.screenshot({
  150 |     path: path.join(audit, 'crop-dark.png'),
  151 |     fullPage: true,
  152 |     animations: 'disabled',
  153 |   });
  154 |   await page.setViewportSize({ width: 320, height: 720 });
  155 |   const geometry = await dialog.boundingBox();
  156 |   expect(geometry!.width).toBeLessThanOrEqual(320);
  157 |   const size = await dialog.evaluate((element) => ({
  158 |     width: element.clientWidth,
  159 |     scroll: element.scrollWidth,
  160 |   }));
  161 |   expect(size.scroll).toBeLessThanOrEqual(size.width + 1);
  162 |   await page.screenshot({
  163 |     path: path.join(audit, 'crop-320.png'),
  164 |     fullPage: true,
  165 |     animations: 'disabled',
  166 |   });
  167 |   await dialog.getByRole('button', { name: '取消', exact: true }).click();
  168 |   await page.setViewportSize({ width: 1280, height: 800 });
  169 |   await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  170 |   await image.click();
  171 |   await expect(page.getByRole('button', { name: '裁剪图片', exact: true })).toBeDisabled();
  172 |   await expect(body).toContainText('图片裁剪保留原图与文档内容。');
  173 | });
  174 |
```
