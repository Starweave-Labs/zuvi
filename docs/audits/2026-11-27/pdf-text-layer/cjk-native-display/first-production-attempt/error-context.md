# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-pdf-cjk-display.spec.ts >> renders CJK FreeText once in the actual fresh OfficeStudio without diagnostic CSS or changed font options
- Location: e2e/office-studio-pdf-cjk-display.spec.ts:72:1

# Error details

```
Error: expect(locator).toBeEnabled() failed

Locator:  getByLabel('PDF 批注署名', { exact: true })
Expected: enabled
Received: disabled
Timeout:  5000ms

Call log:
  - Expect "toBeEnabled" getByLabel('PDF 批注署名', { exact: true }) with timeout 5000ms
  - waiting for getByLabel('PDF 批注署名', { exact: true })
    5 × locator resolved to <input disabled value="" maxlength="1000" data-part="input" aria-label="PDF 批注署名" class="zuvi-input-field"/>
      - unexpected value "disabled"

```

```yaml
- textbox "PDF 批注署名" [disabled]
```

# Test source

```ts
  1   | import { expect, test } from '@playwright/test';
  2   | import { createHash } from 'node:crypto';
  3   | import { mkdir, readFile, writeFile } from 'node:fs/promises';
  4   | import path from 'node:path';
  5   | 
  6   | const audit = path.resolve(process.env.ZUVI_CJK_AUDIT ?? 'docs/audits/2026-11-27/pdf-text-layer/cjk-native-display');
  7   | const fixture = path.resolve(process.env.ZUVI_CJK_SOURCE ?? 'docs/audits/2026-11-27/pdf-native-ui/browser-native/fixture-native-twelve-types.pdf');
  8   | const baselineFile = path.resolve(process.env.ZUVI_CJK_BASELINE ?? 'docs/audits/2026-11-27/pdf-text-layer/cjk-native-display/baseline/diagnosis.json');
  9   | const contents = '中文自由文本：原生迁入后保留';
  10  | 
  11  | test('diagnoses real OfficeStudio CJK FreeText canvas and transparent accessibility DOM independently', async ({ page }) => {
  12  |   test.setTimeout(90000); await mkdir(audit, { recursive: true });
  13  |   const bytes = await readFile(fixture), sourceHash = createHash('sha256').update(bytes).digest('hex');
  14  |   await writeFile(path.join(audit, 'actual-source.pdf'), bytes);
  15  |   const errors: string[] = [];
  16  |   page.on('pageerror', error => errors.push(error.message));
  17  |   await page.addInitScript(() => {
  18  |     const original = CanvasRenderingContext2D.prototype.fillText;
  19  |     const paints: unknown[] = [];
  20  |     (window as unknown as { pdfGlyphPaints: unknown[] }).pdfGlyphPaints = paints;
  21  |     CanvasRenderingContext2D.prototype.fillText = function(text, x, y, maxWidth) {
  22  |       const matrix = this.getTransform();
  23  |       paints.push({ text, x, y, font: this.font, width: this.canvas.width, height: this.canvas.height,
  24  |         matrix: [matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f] });
  25  |       if (maxWidth === undefined) original.call(this, text, x, y); else original.call(this, text, x, y, maxWidth);
  26  |     };
  27  |   });
  28  |   await page.setViewportSize({ width: 1440, height: 1100 });
  29  |   await page.goto('/#/components/office-studio');
  30  |   await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({ name: 'CJK-diagnostic.pdf', mimeType: 'application/pdf', buffer: bytes });
  31  |   await expect(page.getByLabel('PDF 批注署名', { exact: true })).toBeEnabled();
  32  |   await page.getByRole('button', { name: '全屏编辑', exact: true }).click();
  33  |   const paper = page.locator('.zuvi-studio-pdf-paper');
  34  |   await expect(paper.locator('.annotationLayer')).toHaveAttribute('data-ready', 'true');
  35  |   await page.screenshot({ path: path.join(audit, 'actual-before.png'), fullPage: true, animations: 'disabled' });
  36  |   const before = await paper.evaluate(async (element) => {
  37  |     const dom = [...element.querySelectorAll('.annotationTextContent')].map(value => {
  38  |       const style = getComputedStyle(value), rect = value.getBoundingClientRect();
  39  |       return { html: value.outerHTML, text: value.textContent, opacity: style.opacity, color: style.color,
  40  |         position: style.position, font: style.font, fontFamily: style.fontFamily, fontSize: style.fontSize,
  41  |         rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
  42  |         lines: [...value.querySelectorAll('span')].flatMap(span => { const range = document.createRange(); range.selectNodeContents(span); return [...range.getClientRects()].map(rect => ({ x: rect.x, y: rect.y, width: rect.width, height: rect.height })); }) };
  43  |     });
  44  |     const canvases = await Promise.all([...element.querySelectorAll('canvas')].map(async (canvas) => {
  45  |       const blob = await new Promise<Blob>(resolve => canvas.toBlob(value => resolve(value!)));
  46  |       const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer()))].map(value => value.toString(16).padStart(2, '0')).join('');
  47  |       return { hash, width: canvas.width, height: canvas.height, parent: canvas.parentElement?.className, url: canvas.toDataURL() };
  48  |     }));
  49  |     return { dom, canvases, fontStatus: document.fonts.status, fonts: [...document.fonts].map(font => ({ family: font.family, status: font.status })),
  50  |       paints: (window as unknown as { pdfGlyphPaints: unknown[] }).pdfGlyphPaints };
  51  |   });
  52  |   expect(before.dom.some(value => value.text === contents)).toBe(true);
  53  |   await writeFile(path.join(audit, 'before-dom-and-paints.json'), JSON.stringify({ sourceHash, ...before, canvases: before.canvases.map(({ url: _url, ...value }) => value) }, null, 2) + '\n');
  54  |   for (const [index, canvas] of before.canvases.entries()) await writeFile(path.join(audit, `actual-canvas-${index}.png`), Buffer.from(canvas.url.split(',')[1], 'base64'));
  55  |   // Actual SDK css at pdf_viewer.css:1254. This is a diagnostic override, not a changed renderer option.
  56  |   await page.addStyleTag({ content: '.zuvi-studio-pdf-annotation-paint-layer .annotationTextContent { position:absolute; width:100%; height:100%; opacity:0; color:transparent; user-select:none; }' });
  57  |   await page.screenshot({ path: path.join(audit, 'actual-with-sdk-accessibility-css.png'), fullPage: true, animations: 'disabled' });
  58  |   const after = await paper.evaluate(async element => ({
  59  |     dom: [...element.querySelectorAll('.annotationTextContent')].map(value => ({ text: value.textContent, opacity: getComputedStyle(value).opacity, color: getComputedStyle(value).color })),
  60  |     canvases: await Promise.all([...element.querySelectorAll('canvas')].map(async canvas => {
  61  |       const blob = await new Promise<Blob>(resolve => canvas.toBlob(value => resolve(value!)));
  62  |       return [...new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer()))].map(value => value.toString(16).padStart(2, '0')).join('');
  63  |     })),
  64  |     paints: (window as unknown as { pdfGlyphPaints: unknown[] }).pdfGlyphPaints,
  65  |   }));
  66  |   expect(after.canvases).toEqual(before.canvases.map(value => value.hash));
  67  |   expect(after.paints).toEqual(before.paints); expect(after.dom.every(value => value.opacity === '0')).toBe(true);
  68  |   expect(errors).toEqual([]);
  69  |   await writeFile(path.join(audit, 'diagnosis.json'), JSON.stringify({ sourceHash, before: before.dom, after, canvasHashesUnchanged: true, paintCallsUnchanged: true, errors }, null, 2) + '\n');
  70  | });
  71  | 
  72  | test('renders CJK FreeText once in the actual fresh OfficeStudio without diagnostic CSS or changed font options', async ({ page }) => {
  73  |   test.setTimeout(90000); await mkdir(audit, { recursive: true });
  74  |   const bytes = await readFile(fixture), sourceHash = createHash('sha256').update(bytes).digest('hex');
  75  |   await page.addInitScript(() => {
  76  |     const original = CanvasRenderingContext2D.prototype.fillText;
  77  |     (window as unknown as { cjkPaints: unknown[] }).cjkPaints = [];
  78  |     CanvasRenderingContext2D.prototype.fillText = function(text, x, y, maxWidth) {
  79  |       (window as unknown as { cjkPaints: unknown[] }).cjkPaints.push({ text, font: this.font, width: this.canvas.width, height: this.canvas.height });
  80  |       if (maxWidth === undefined) original.call(this, text, x, y); else original.call(this, text, x, y, maxWidth);
  81  |     };
  82  |   });
  83  |   await page.setViewportSize({ width: 1440, height: 1100 }); await page.goto('/#/components/office-studio');
  84  |   await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({ name: 'CJK-final.pdf', mimeType: 'application/pdf', buffer: bytes });
> 85  |   await expect(page.getByLabel('PDF 批注署名', { exact: true })).toBeEnabled();
      |                                                              ^ Error: expect(locator).toBeEnabled() failed
  86  |   await page.getByRole('button', { name: '全屏编辑', exact: true }).click();
  87  |   const paper = page.locator('.zuvi-studio-pdf-paper'); await expect(paper.locator('.annotationLayer')).toHaveAttribute('data-ready', 'true');
  88  |   const result = await paper.evaluate(async element => ({
  89  |     dom: [...element.querySelectorAll('.freeTextAnnotation .annotationTextContent')].map(value => ({ text: value.textContent,
  90  |       role: value.getAttribute('role'), position: getComputedStyle(value).position,
  91  |       color: getComputedStyle(value).color, opacity: getComputedStyle(value).opacity, display: getComputedStyle(value).display })),
  92  |     fonts: [...document.fonts].map(font => ({ family: font.family, status: font.status })),
  93  |     paints: (window as unknown as { cjkPaints: { text: string; font: string; width: number; height: number }[] }).cjkPaints,
  94  |     canvasHashes: await Promise.all([...element.querySelectorAll('canvas')].map(async canvas => {
  95  |       const blob = await new Promise<Blob>(resolve => canvas.toBlob(value => resolve(value!)));
  96  |       return [...new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer()))].map(value => value.toString(16).padStart(2, '0')).join('');
  97  |     })),
  98  |   }));
  99  |   expect(result.dom).toHaveLength(1); expect(result.dom[0]).toMatchObject({ text: contents, role: 'comment', position: 'absolute', color: 'rgba(0, 0, 0, 0)', opacity: '0' });
  100 |   expect(result.dom[0].display).not.toBe('none');
  101 |   const cjk = result.paints.filter(value => /px g_d\d+_f\d+,/.test(value.font)); expect(cjk).toHaveLength([...contents].length);
  102 |   const baseline = JSON.parse(await readFile(baselineFile, 'utf8')) as { after: { canvases: string[] } };
  103 |   expect(result.canvasHashes).toEqual(baseline.after.canvases);
  104 |   await page.screenshot({ path: path.join(audit, 'actual-production-fixed.png'), fullPage: true, animations: 'disabled' });
  105 |   const persisted = await page.evaluate(async () => {
  106 |     const modulePath = '/src/pages/collaboration/office-studio/studio-storage.ts';
  107 |     const { createStudioStorage } = await import(modulePath);
  108 |     const storage = createStudioStorage(), id = await storage.activeId(), file = id ? await storage.load(id) : undefined;
  109 |     if (!file?.source) throw new Error('Persisted source is missing');
  110 |     return [...new Uint8Array(await crypto.subtle.digest('SHA-256', await file.source.arrayBuffer()))].map(value => value.toString(16).padStart(2, '0')).join('');
  111 |   });
  112 |   expect(persisted).toBe(sourceHash);
  113 |   await writeFile(path.join(audit, 'actual-final.json'), JSON.stringify({ sourceHash, persisted, ...result, cjkPaintCount: cjk.length, canvasPixelsEqualBaseline: true }, null, 2) + '\n');
  114 | });
  115 | 
```