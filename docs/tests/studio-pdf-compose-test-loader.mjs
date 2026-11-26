import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath, URL } from 'node:url';
const require = createRequire(new URL('../package.json', import.meta.url));
const ts = require('typescript');
const root = new URL('../src/pages/collaboration/office-studio/', import.meta.url);
const cache = new Map();
function load(name) {
  if (cache.has(name)) return cache.get(name).exports;
  const module = { exports: {} };
  cache.set(name, module);
  const file = new URL(`${name}.ts`, root),
    source = readFileSync(file, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
    },
  }).outputText;
  const localRequire = (id) =>
    id.startsWith('./studio-pdf-compose') ? load(id.slice(2)) : require(id);
  new Function('exports', 'module', 'require', '__filename', compiled)(
    module.exports,
    module,
    localRequire,
    fileURLToPath(file)
  );
  return module.exports;
}
export const { composePdf, extractPdf, PdfComposeError } = load('studio-pdf-compose');
export const { loadSource, fieldDefinition, fieldValue, onValue, parseDesign } = load(
  'studio-pdf-compose-source'
);
export const { ClosedPdfCopier, canonical, hash, name, text, read, resolve, byteArray } = load(
  'studio-pdf-compose-utils'
);
export const { prepareResources, rewrittenDA, daSemantics } = load('studio-pdf-compose-resources');
export const { PdfNavigation } = load('studio-pdf-compose-navigation');
export const { copyCatalog } = load('studio-pdf-compose-catalog');
export const { sha256 } = load('studio-pdf-compose-sha256');
