import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const WORKSPACE = '/Users/meaili/.codex/worktrees/finish-office-studio/6a665831-e304-4533-acf4-c350d6b31c59';

const require = createRequire(WORKSPACE + '/docs/package.json');
const pdfRoot = dirname(require.resolve('pdfjs-dist/package.json'));
const pdfRequire = createRequire(resolve(pdfRoot, 'package.json'));
let canvas;
try { canvas = pdfRequire('@napi-rs/canvas'); }
catch { canvas = createRequire('/Users/meaili/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json')('@napi-rs/canvas'); }
globalThis.DOMMatrix ??= canvas.DOMMatrix;
globalThis.Path2D ??= canvas.Path2D;
globalThis.ImageData ??= canvas.ImageData;
const pdfjs = await import(pathToFileURL(resolve(pdfRoot, 'legacy/build/pdf.mjs')));
pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(resolve(pdfRoot, 'legacy/build/pdf.worker.mjs')).href;
const root = import.meta.dirname;

const results = [];
for (const [label,pageNumber,text] of [
  ['native-twelve-types',1,'中文自由文本：原生迁入后保留'],
  ['copy-edited',1,'复制页独立中文编辑'],
  ['merged-round-2',1,'重开编辑保留字体'],
]) {
  const data = new Uint8Array(await readFile(root + '/' + label + '.pdf'));
  const loading = pdfjs.getDocument({ data,isEvalSupported:false,disableFontFace:true,useSystemFonts:false,
    standardFontDataUrl:pdfRoot+'/standard_fonts/',cMapUrl:pdfRoot+'/cmaps/',cMapPacked:true,
    wasmUrl:pdfRoot+'/wasm/',isOffscreenCanvasSupported:false });
  const document = await loading.promise, page = await document.getPage(pageNumber);
  const viewport = page.getViewport({ scale:2 }), target = canvas.createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height));
  const annotations = await page.getAnnotations({intent:'any'});
  const body = annotations.find(item => item.contentsObj?.str === text);
  const operators = await page.getOperatorList({annotationMode:pdfjs.AnnotationMode.ENABLE});
  const painted = operators.fnArray.flatMap((operation,index) => operation === pdfjs.OPS.beginAnnotation ? [operators.argsArray[index][0]] : []);
  if (!body || painted.filter(id => id === body.id).length !== 1) throw new Error('Native CJK missing or doubled: ' + label);
  await page.render({canvas:target,canvasContext:target.getContext('2d'),viewport,annotationMode:pdfjs.AnnotationMode.ENABLE}).promise;
  await writeFile(root+'/render/pdfjs-'+label+'-page-'+pageNumber+'.png', target.toBuffer('image/png'));
  results.push({label,page:pageNumber,pdfjsVersion:pdfjs.version,cjkText:text,paintCount:1,pages:document.numPages});
  await loading.destroy();
  console.log('rendered actual PDF.js',label,pageNumber);
}
await writeFile(root+'/pdfjs.json',JSON.stringify({status:'passed',results},null,2));
