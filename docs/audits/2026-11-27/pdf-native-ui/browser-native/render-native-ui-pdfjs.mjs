import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = import.meta.dirname, repository = resolve(root, '../../../../..');
const require = createRequire(repository + '/docs/package.json');
const pdfRoot = dirname(require.resolve('pdfjs-dist/package.json'));
const pdfRequire = createRequire(resolve(pdfRoot, 'package.json'));
let canvas;
try { canvas = pdfRequire('@napi-rs/canvas'); }
catch { canvas = createRequire('/Users/meaili/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json')('@napi-rs/canvas'); }
globalThis.DOMMatrix ??= canvas.DOMMatrix;
globalThis.Path2D ??= canvas.Path2D;
globalThis.ImageData ??= canvas.ImageData;
const pdfjs = await import(pathToFileURL(resolve(pdfRoot, 'legacy/build/pdf.mjs')).href);
pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(resolve(pdfRoot, 'legacy/build/pdf.worker.mjs')).href;
const prefixes = ['p012-freetext', 'p014-markers', 'p016-geometry', 'gesture-history',
  'p015-discussion', 'legacy-migration', 'nonempty-recipe', 'explicit-none'];
const results = [];
for (const prefix of prefixes) for (const round of [1, 2]) {
  const file = `${prefix}-round-${round}.pdf`;
  const loading = pdfjs.getDocument({ data: new Uint8Array(await readFile(root + '/' + file)),
    isEvalSupported: false, disableFontFace: true, useSystemFonts: false, isOffscreenCanvasSupported: false,
    standardFontDataUrl: pdfRoot + '/standard_fonts/', cMapUrl: pdfRoot + '/cmaps/', cMapPacked: true, wasmUrl: pdfRoot + '/wasm/' });
  const document = await loading.promise;
  for (const number of prefix === 'nonempty-recipe' ? [2, 3] : [1]) {
    const page = await document.getPage(number), annotations = await page.getAnnotations({ intent: 'any' });
    const operators = await page.getOperatorList({ annotationMode: pdfjs.AnnotationMode.ENABLE });
    const painted = operators.fnArray.flatMap((operation, index) => operation === pdfjs.OPS.beginAnnotation ? [operators.argsArray[index][0]] : []);
    const textBodies = annotations.filter(annotation => annotation.annotationType === pdfjs.AnnotationType.FREETEXT);
    const bodyResults = [];
    for (const body of textBodies) {
      const count = painted.filter(id => id === body.id).length;
      assert.equal(count, 1, `${file} native FreeText ${body.id} must paint once`);
      let active = false, glyphText = '';
      for (const [index, operation] of operators.fnArray.entries()) {
        if (operation === pdfjs.OPS.beginAnnotation) active = operators.argsArray[index][0] === body.id;
        else if (operation === pdfjs.OPS.endAnnotation) active = false;
        else if (active && operation === pdfjs.OPS.showText) {
          const glyphs = operators.argsArray[index][0];
          for (const glyph of glyphs) if (typeof glyph === 'object' && glyph && typeof glyph.unicode === 'string') glyphText += glyph.unicode;
        }
      }
      const text = body.contentsObj?.str ?? '';
      if (/[\u3400-\u9fff]/.test(text)) assert.equal(glyphText.replace(/\s/g, ''), text.replace(/\s/g, ''), `${file} CJK glyphs differ from annotation text`);
      bodyResults.push({ id: body.id, contents: text, glyphText, paintCount: count });
    }
    const viewport = page.getViewport({ scale: 2 });
    const target = canvas.createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    await page.render({ canvas: target, canvasContext: target.getContext('2d'), viewport,
      annotationMode: pdfjs.AnnotationMode.ENABLE }).promise;
    const png = root + '/render/pdfjs-' + file.replace(/\.pdf$/, '') + '-page-' + number + '.png';
    await writeFile(png, target.toBuffer('image/png'));
    results.push({ pdf: file, page: number, png, version: pdfjs.version, freeTextBodies: bodyResults });
    console.log('rendered independent PDF.js', file, number);
  }
  await loading.destroy();
}
await writeFile(root + '/pdfjs.json', JSON.stringify({ status: 'rendered-awaiting-visual', results }, null, 2));
