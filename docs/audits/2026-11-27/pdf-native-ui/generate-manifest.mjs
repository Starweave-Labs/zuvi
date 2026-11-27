import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const audit = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(audit, '../../../..');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name === '.DS_Store') continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}
async function record(file) {
  const bytes = await readFile(file);
  return { path: path.relative(repo, file).split(path.sep).join('/'), bytes: bytes.length, sha256: digest(bytes) };
}
const sources = (await walk(path.join(repo, 'packages/ui/src/components/OfficeStudio'))).filter(file => /\.(?:ts|tsx|css)$/.test(file) && !file.includes('.test.'));
for (const file of [
  'docs/src/pages/collaboration/office-studio/studio-pdf-adapter.ts',
  'docs/src/pages/collaboration/office-studio/studio-pdf-annotation-editor.ts',
  'docs/src/pages/collaboration/office-studio/studio-pdf-native-document.ts',
  'docs/src/pages/collaboration/office-studio/studio-pdf-native-fonts.ts',
  'docs/src/pages/collaboration/office-studio/studio-pdf-codec.ts',
  'docs/src/pages/collaboration/office-studio/studio-pdf-compose.ts',
  'docs/src/pages/collaboration/office-studio/studio-pdf-composition.ts',
  'docs/src/pages/components/OfficeStudioPage.tsx',
]) sources.push(path.join(repo, file));
sources.push(...(await walk(path.join(repo, 'docs/src/pages/collaboration/office-studio/studio-pdf-native'))).filter(file => file.endsWith('.ts')));
const files = (await walk(audit)).filter(file => file !== path.join(audit, 'manifest.json'));
const manifest = { schemaVersion: 1, scope: ['P012', 'P014', 'P015', 'P016'], completionProven: false,
  sourceFiles: await Promise.all(sources.map(record)), files: await Promise.all(files.map(record)) };
await writeFile(path.join(audit, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Recorded ${manifest.sourceFiles.length} source files and ${manifest.files.length} audit files.`);
