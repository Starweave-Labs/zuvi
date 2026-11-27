import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import process from 'node:process';

const repository = resolve(import.meta.dirname, '../../../../..');
const require = createRequire(repository + '/docs/package.json');
const viteRoot = dirname(require.resolve('vite/package.json'));
const { createServer } = await import(pathToFileURL(resolve(viteRoot, 'dist/node/index.js')).href);
const server = await createServer({
  root: repository + '/docs',
  configFile: repository + '/docs/vite.config.ts',
  cacheDir: '/tmp/zuvi-pdf-native-ui-vite-5275',
  optimizeDeps: { include: ['pdfjs-dist', 'pdf-lib', '@pdf-lib/fontkit', 'docx', 'exceljs'], force: true },
  server: { host: 'localhost', port: 5275, strictPort: true, warmup: { clientFiles: [
    './src/pages/collaboration/office-studio/studio-pdf-adapter.ts',
    './src/pages/collaboration/office-studio/studio-pdf-annotation-editor.ts',
  ] } },
});
await server.listen();
console.log('Native UI frontend on http://localhost:5275; isolated dependency cache.');
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
  void server.close().then(() => process.exit(0));
});
