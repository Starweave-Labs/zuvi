# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-pdf-text-layer.spec.ts >> uses real PDF.js text selections and one native appearance across crop, UserUnit, rotation and zoom
- Location: e2e/office-studio-pdf-text-layer.spec.ts:94:1

# Error details

```
Error: expect(received).toBeCloseTo(expected, precision)

Expected: 45
Received: 0

Expected precision:    1
Expected difference: < 0.05
Received difference:   45
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic: SELECTABLE ORIGINAL Angled source text Second source line
  - generic:
    - region "PDF 批注 Original note":
      - img "PDF 便利贴"
    - region "PDF 批注 blue-no-zoom-rotate" [ref=e4]
    - region "PDF 批注 Highlight"
    - region "PDF 批注 red-no-rotate"
    - region "PDF 批注 green-no-zoom" [ref=e8]
```

# Test source

```ts
  30  |   page.node.addAnnot(note); refs.push({ id: 'no-ap-note', key: note.toString(), flags: 4 });
  31  |   const gs = pdf.context.register(pdf.context.obj({ Type: 'ExtGState', ca: 0.3, CA: 0.3 }));
  32  |   const appearance = pdf.context.register(pdf.context.flateStream('q /GS gs 1 1 0 rg 0 0 120 20 re f Q',
  33  |     { Type: 'XObject', Subtype: 'Form', BBox: [0, 0, 120, 20], Resources: { ExtGState: { GS: gs } } }));
  34  |   const marker = pdf.context.register(pdf.context.obj({ Type: 'Annot', Subtype: 'Highlight', P: page.ref, F: 4,
  35  |     Rect: [80, 250, 200, 270], QuadPoints: [80, 270, 200, 270, 80, 250, 200, 250], C: [1, 1, 0], CA: 0.3,
  36  |     AP: { N: appearance }, NM: PDFString.of('single-alpha'), ZuviAnnotationId: PDFString.of('single-alpha') }));
  37  |   page.node.addAnnot(marker); refs.push({ id: 'single-alpha', key: marker.toString(), flags: 4 });
  38  |   const field = pdf.getForm().createTextField('source-field'); field.setText('Field value');
  39  |   field.addToPage(page, { x: 250, y: 70, width: 130, height: 25, font });
  40  |   return { bytes: new Uint8Array(await pdf.save({ updateFieldAppearances: false })), refs };
  41  | }
  42  | 
  43  | async function harness(page: Page, data: Awaited<ReturnType<typeof fixture>>) {
  44  |   await page.goto('/');
  45  |   await page.evaluate(async ({ bytes, refs, stylesheet }) => {
  46  |     const modulePath = '/src/pages/collaboration/office-studio/studio-pdf-adapter.ts';
  47  |     const cssPath = stylesheet;
  48  |     await import(cssPath);
  49  |     const { studioPdfRenderer } = await import(modulePath);
  50  |     const source = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
  51  |     const renderer = await studioPdfRenderer.load(source);
  52  |     document.body.replaceChildren(); document.body.style.margin = '0'; document.body.style.background = '#e5e7eb';
  53  |     const paper = document.createElement('div'); paper.id = 'layer-paper';
  54  |     Object.assign(paper.style, { position: 'relative', overflow: 'hidden', margin: '16px', background: 'white' });
  55  |     const canvas = document.createElement('canvas'); canvas.style.width = '100%'; canvas.style.height = '100%'; paper.append(canvas);
  56  |     const text = document.createElement('div'); text.className = 'textLayer zuvi-studio-pdf-text-layer'; paper.append(text);
  57  |     const annotations = document.createElement('div'); annotations.className = 'annotationLayer zuvi-studio-pdf-annotation-paint-layer'; paper.append(annotations);
  58  |     document.body.append(paper);
  59  |     const selected: string[] = [];
  60  |     let textLayer: { selection(): unknown; destroy(): void } | undefined;
  61  |     let annotationLayer: { destroy(): void } | undefined;
  62  |     let view: { width: number; height: number; toPdfPoint(x: number, y: number): number[]; toViewportPoint(x: number, y: number): number[] };
  63  |     const environment = {
  64  |       async setView(scale: number, rotation: number) {
  65  |         textLayer?.destroy(); annotationLayer?.destroy(); textLayer = undefined; annotationLayer = undefined;
  66  |         view = await renderer.render(0, canvas, { scale, rotation });
  67  |         paper.style.width = `${view.width}px`; paper.style.height = `${view.height}px`;
  68  |         textLayer = await renderer.renderTextLayer(0, text, { scale, rotation });
  69  |         annotationLayer = await renderer.renderAnnotationLayer(0, annotations, { scale, rotation, canvas, annotations: refs, onSelect: (id: string) => selected.push(id) });
  70  |         return { width: view.width, height: view.height };
  71  |       },
  72  |       select(needle: string, start: number, end: number) {
  73  |         const span = [...text.querySelectorAll('span')].find(element => element.textContent === needle);
  74  |         if (!span?.firstChild) throw new Error('Original text span not found');
  75  |         const range = document.createRange(); range.setStart(span.firstChild, start); range.setEnd(span.firstChild, end);
  76  |         const selection = document.getSelection(); selection?.removeAllRanges(); selection?.addRange(range);
  77  |         return textLayer?.selection();
  78  |       },
  79  |       selection: () => textLayer?.selection(),
  80  |       selected,
  81  |       point: (x: number, y: number) => view.toViewportPoint(x, y),
  82  |       pixel(x: number, y: number) {
  83  |         const point = view.toViewportPoint(x, y), ratio = canvas.width / view.width;
  84  |         return [...canvas.getContext('2d')!.getImageData(Math.round(point[0] * ratio), Math.round(point[1] * ratio), 1, 1).data];
  85  |       },
  86  |       async sourceHash() { return [...new Uint8Array(await crypto.subtle.digest('SHA-256', await source.arrayBuffer()))].map(value => value.toString(16).padStart(2, '0')).join(''); },
  87  |       destroy() { textLayer?.destroy(); annotationLayer?.destroy(); return renderer.destroy(); },
  88  |     };
  89  |     (window as unknown as { pdfLayerQA: typeof environment }).pdfLayerQA = environment;
  90  |     await environment.setView(1, 0);
  91  |   }, { bytes: [...data.bytes], refs: data.refs, stylesheet: `/@fs${repo}/packages/ui/src/components/OfficeStudio/StudioPdfTextLayer.css` });
  92  | }
  93  | 
  94  | test('uses real PDF.js text selections and one native appearance across crop, UserUnit, rotation and zoom', async ({ page }) => {
  95  |   test.setTimeout(180000); await mkdir(audit, { recursive: true });
  96  |   const data = await fixture(), hash = createHash('sha256').update(data.bytes).digest('hex');
  97  |   await writeFile(path.join(audit, 'renderer-source.pdf'), data.bytes);
  98  |   const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  99  |   await harness(page, data);
  100 |   const matrix: unknown[] = [];
  101 |   for (const scale of [0.5, 1, 2]) for (const rotation of [0, 90, 180, 270]) {
  102 |     const result = await page.evaluate(async ({ scale, rotation }) => {
  103 |       const qa = (window as unknown as { pdfLayerQA: {
  104 |         setView(scale: number, rotation: number): Promise<{ width: number; height: number }>;
  105 |         select(text: string, start: number, end: number): { text: string; quadPoints: number[]; rect: { x: number; y: number; width: number; height: number } };
  106 |         pixel(x: number, y: number): number[]; sourceHash(): Promise<string>;
  107 |       } }).pdfLayerQA;
  108 |       const view = await qa.setView(scale, rotation);
  109 |       const selection = qa.select('SELECTABLE ORIGINAL', 3, 10);
  110 |       const boxes = Object.fromEntries(['red-no-rotate', 'green-no-zoom', 'blue-no-zoom-rotate'].map(id => {
  111 |         const element = document.querySelector<HTMLElement>(`[data-studio-annotation-id="${id}"]`)!;
  112 |         const bounds = element.getBoundingClientRect();
  113 |         const canvas = element.querySelector('canvas');
  114 |         return [id, { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height,
  115 |           noZoom: element.dataset.noZoom, canvas: canvas && { width: canvas.width, height: canvas.height,
  116 |             pixel: [...canvas.getContext('2d')!.getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data] } }];
  117 |       }));
  118 |       const icons = [...document.querySelectorAll<HTMLImageElement>('.textAnnotation img')].map(image => ({ src: image.src, loaded: image.complete && image.naturalWidth > 0 }));
  119 |       return { scale, rotation, view, selection, boxes, icons, alpha: qa.pixel(140, 260), hash: await qa.sourceHash(),
  120 |         duplicateWidgets: document.querySelectorAll('.zuvi-studio-pdf-annotation-paint-layer input, .zuvi-studio-pdf-annotation-paint-layer select, .zuvi-studio-pdf-annotation-paint-layer textarea').length };
  121 |     }, { scale, rotation });
  122 |     expect(result.selection.text).toBe('ECTABLE'); expect(result.selection.quadPoints).toHaveLength(8);
  123 |     expect(result.selection.rect.x).toBeGreaterThan(70); expect(result.selection.rect.y).toBeLessThan(450);
  124 |     expect(result.selection.rect.height).toBeGreaterThan(10); expect(result.hash).toBe(hash);
  125 |     expect(result.duplicateWidgets).toBe(0);
  126 |     for (const [id, color] of [['red-no-rotate', [255, 0, 0]], ['green-no-zoom', [0, 255, 0]], ['blue-no-zoom-rotate', [0, 0, 255]]] as const) {
  127 |       expect(result.boxes[id].canvas?.pixel.slice(0, 3)).toEqual(color);
  128 |       expect(result.boxes[id].canvas!.width).toBeGreaterThanOrEqual(60 * scale * 1.5);
  129 |     }
> 130 |     expect(result.boxes['red-no-rotate'].width).toBeCloseTo(90 * scale, 1);
      |                                                 ^ Error: expect(received).toBeCloseTo(expected, precision)
  131 |     expect(result.boxes['red-no-rotate'].height).toBeCloseTo(60 * scale, 1);
  132 |     expect(result.boxes['blue-no-zoom-rotate'].width).toBeCloseTo(90, 1);
  133 |     expect(result.boxes['blue-no-zoom-rotate'].height).toBeCloseTo(60, 1);
  134 |     expect(result.boxes['green-no-zoom'].width).toBeCloseTo(rotation % 180 ? 60 : 90, 1);
  135 |     expect(result.boxes['green-no-zoom'].height).toBeCloseTo(rotation % 180 ? 90 : 60, 1);
  136 |     expect(result.alpha.slice(0, 3)).toEqual([255, 255, 178]);
  137 |     matrix.push(result);
  138 |   }
  139 |   await page.locator('[data-studio-annotation-id="no-ap-note"]').click();
  140 |   expect(await page.evaluate(() => (window as unknown as { pdfLayerQA: { selected: string[] } }).pdfLayerQA.selected)).toContain('no-ap-note');
  141 |   await page.evaluate(() => (window as unknown as { pdfLayerQA: { select(text: string, start: number, end: number): unknown } }).pdfLayerQA.select('Angled source text', 0, 6));
  142 |   const angled = await page.evaluate(() => (window as unknown as { pdfLayerQA: { selection(): { text: string; quadPoints: number[] } } }).pdfLayerQA.selection());
  143 |   expect(angled.text).toBe('Angled'); expect(angled.quadPoints[1]).not.toBe(angled.quadPoints[3]);
  144 |   await page.screenshot({ path: path.join(audit, 'renderer-text-and-annotations.png'), fullPage: true });
  145 |   expect(errors).toEqual([]);
  146 |   await writeFile(path.join(audit, 'renderer-matrix.json'), JSON.stringify({ hash, matrix, angled, errors }, null, 2) + '\n');
  147 |   await page.evaluate(() => (window as unknown as { pdfLayerQA: { destroy(): Promise<void> } }).pdfLayerQA.destroy());
  148 | });
  149 | 
```