import { Blob } from 'node:buffer';
import { webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { URL } from 'node:url';

const require = createRequire(new URL('../package.json', import.meta.url));
const ts = require('typescript');

/** Execute the actual TypeScript codec/helper graph without using a stale dist bundle. */
export function pdfTestRuntime(options = {}) {
  const modules = new Map(), requests = [];
  const load = (path) => {
    const url = path instanceof URL ? path : new URL(path, import.meta.url);
    if (modules.has(url.href)) return modules.get(url.href).exports;
    const module = { exports: {} };
    modules.set(url.href, module);
    const compiled = ts.transpileModule(readFileSync(url, 'utf8').replaceAll('import.meta.env.BASE_URL', "'/test-base/'"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const execute = new Function('scope', 'const { module, exports, require, Blob, crypto, fetch } = scope;\n' + compiled);
    execute({
      module,
      exports: module.exports,
      Blob,
      crypto: webcrypto,
      fetch: async (...args) => {
        requests.push(args[0]);
        if (!options.fetch) throw new Error('Unexpected network request');
        return options.fetch(...args);
      },
      require: (id) => {
        if (id in (options.overrides ?? {})) return options.overrides[id];
        if (id === '@zuvi/react') return load(new URL('../../packages/ui/src/components/OfficeStudio/studio-model.ts', import.meta.url));
        if (id.startsWith('.')) return load(new URL(id.endsWith('.ts') ? id : `${id}.ts`, url));
        return require(id);
      },
    });
    return module.exports;
  };
  return { load, requests };
}
