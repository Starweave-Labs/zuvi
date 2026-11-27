import assert from 'node:assert/strict';
import { Blob } from 'node:buffer';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import { URL } from 'node:url';

const require = createRequire(new URL('../package.json', import.meta.url));
const uiRequire = createRequire(new URL('../../packages/ui/package.json', import.meta.url));
const ts = require('typescript'), { JSDOM } = uiRequire('jsdom');
const code = ts.transpileModule(readFileSync(new URL('../src/pages/collaboration/office-studio/studio-pdf-adapter.ts', import.meta.url), 'utf8').replaceAll('import.meta.env.BASE_URL', "'/test/'"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
const glyph = { A: 3, B: 5, C: 10, D: 7, E: 11 };
function host(items, styles = { regular: { fontFamily: 'sans-serif', ascent: 0.8, descent: -0.2 } }, wait) {
  const dom = new JSDOM('<body><div id="text"></div><div id="outside">Outside</div></body>');
  const { document } = dom.window, container = document.getElementById('text');
  dom.window.HTMLCanvasElement.prototype.getContext = () => ({ font: '', measureText: text => ({ width: [...text].reduce((width, char) => width + (glyph[char] ?? 8), 0) }) });
  const instances = [];
  class Layer {
    static cleanup() {}
    constructor({ container, textContentSource, viewport }) { this.container = container; this.content = textContentSource; this.viewport = viewport; this.textDivs = []; this.textContentItemsStr = []; this.cancelled = 0; instances.push(this); }
    async render() { for (const item of this.content.items) { const span = document.createElement('span'); span.textContent = item.str; span.style.fontFamily = 'sans-serif'; span.style.fontSize = '20px'; span.style.fontWeight = 'normal'; span.style.fontStyle = 'normal'; this.container.append(span); this.textDivs.push(span); this.textContentItemsStr.push(item.str); } }
    cancel() { this.cancelled++; }
  }
  const page = { userUnit: 1, rotate: 0, getTextContent: async () => ({ items, styles }), getViewport: ({ scale, rotation }) => ({ scale, rotation, userUnit: 1 }) };
  let destroyed = 0;
  const loading = { promise: Promise.resolve({ numPages: 1, getPage: () => wait ?? Promise.resolve(page) }), destroy: async () => { destroyed++; } };
  const exports = {};
  runInNewContext(code, { exports, Blob, Uint8Array, ArrayBuffer, Error, DOMException: globalThis.DOMException, Element: dom.window.Element,
    require: name => name === 'pdfjs-dist' ? { getDocument: () => loading, GlobalWorkerOptions: {}, TextLayer: Layer }
      : name.endsWith('?url') ? '/assets/' + name.split('/').at(-1).replace('?url', '') : require(name),
  });
  return { ...exports, dom, document, container, instances, page, destroyCount: () => destroyed };
}
const item = (str = 'ABCDE', transform = [20, 0, 0, 20, 20, 60], dir = 'ltr') => ({ str, transform, dir, width: 72, height: 20, fontName: 'regular', hasEOL: false });
function select(h, index, start, end) { const node = h.instances[0].textDivs[index].firstChild; const range = h.document.createRange(); range.setStart(node, start); range.setEnd(node, end); h.document.getSelection().removeAllRanges(); h.document.getSelection().addRange(range); }
async function layer(h, options = {}) { const renderer = await h.studioPdfRenderer.load(new Blob(['%PDF-mocked'])); return { renderer, text: await renderer.renderTextLayer(0, h.container, { scale: 1, rotation: 0, ...options }) }; }

test('partial source glyph selection uses actual advances rather than equal character counts', async () => {
  const h = host([item()]), { renderer, text } = await layer(h);
  select(h, 0, 1, 3);
  const result = text.selection();
  assert.equal(result.text, 'BC');
  assert.deepEqual(Array.from(result.quadPoints), [26, 76, 56, 76, 26, 56, 56, 56]);
  assert.deepEqual(JSON.parse(JSON.stringify(result.rect)), { x: 26, y: 56, width: 30, height: 20 });
  assert.equal(h.container.style.getPropertyValue('--scale-round-x'), '0.001px');
  await renderer.destroy(); h.dom.window.close();
});

test('page rotation does not rotate stored PDF QuadPoints and run rotation remains intact', async () => {
  const angle = Math.PI / 4, h = host([item('ABCDE', [20 * Math.cos(angle), 20 * Math.sin(angle), -20 * Math.sin(angle), 20 * Math.cos(angle), 20, 60])]);
  const { renderer, text } = await layer(h, { rotation: 270 }); select(h, 0, 0, 2);
  const result = text.selection();
  assert.equal(result.text, 'AB');
  const q = result.quadPoints;
  assert.ok(Math.abs((q[3] - q[1]) / (q[2] - q[0]) - 1) < 1e-9);
  assert.ok(Math.abs(q[2] - q[0] - 16 * Math.cos(angle)) < 1e-9);
  await renderer.destroy(); h.dom.window.close();
});

test('RTL logical offsets are measured from the opposite end of the source run', async () => {
  const h = host([item('ABCDE', undefined, 'rtl')]), { renderer, text } = await layer(h); select(h, 0, 1, 3);
  const result = text.selection();
  assert.equal(result.text, 'BC');
  assert.deepEqual(Array.from(result.quadPoints), [56, 76, 86, 76, 56, 56, 86, 56]);
  await renderer.destroy(); h.dom.window.close();
});

test('vertical writing uses the source vertical advance and glyph orientation', async () => {
  const vertical = { ...item(), width: 20, height: 72 }, h = host([vertical], { regular: { fontFamily: 'sans-serif', vertical: true, ascent: 0.8, descent: -0.2 } });
  const { renderer, text } = await layer(h); select(h, 0, 1, 3);
  const result = text.selection();
  assert.equal(result.text, 'BC');
  assert.deepEqual(Array.from(result.quadPoints), [36, 54, 36, 24, 16, 54, 16, 24]);
  await renderer.destroy(); h.dom.window.close();
});

test('unrelated DOM selections are not returned, and destruction removes only its owned selection', async () => {
  const h = host([item()]), { renderer, text } = await layer(h);
  const range = h.document.createRange(); range.selectNodeContents(h.document.getElementById('outside'));
  h.document.getSelection().addRange(range); assert.equal(text.selection(), undefined);
  text.destroy(); assert.equal(h.document.getSelection().toString(), 'Outside'); assert.equal(text.selection(), undefined);
  assert.equal(h.instances[0].cancelled, 1); await renderer.destroy(); h.dom.window.close();
});

test('a cancelled source page load never creates a text layer or changes the container', async () => {
  let resolve; const wait = new Promise(done => { resolve = done; });
  const h = host([item()], undefined, wait), renderer = await h.studioPdfRenderer.load(new Blob(['%PDF-mocked'])), controller = new globalThis.AbortController();
  const pending = renderer.renderTextLayer(0, h.container, { scale: 1, rotation: 0, signal: controller.signal });
  controller.abort(); resolve(h.page);
  await assert.rejects(pending, { name: 'AbortError' }); assert.equal(h.instances.length, 0); assert.equal(h.container.textContent, '');
  await renderer.destroy(); assert.equal(h.destroyCount(), 1); h.dom.window.close();
});
