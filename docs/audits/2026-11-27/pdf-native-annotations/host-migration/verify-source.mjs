import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath, URL } from 'node:url';
import { Buffer } from 'node:buffer';
const repository = '/Users/meaili/.codex/worktrees/finish-office-studio/6a665831-e304-4533-acf4-c350d6b31c59';
const require = createRequire(repository + '/package.json'), ts = require('typescript');
const audit = fileURLToPath(new URL('./',import.meta.url));
const host = repository + '/docs/src/pages/collaboration/office-studio/';
const paths = (await readdir(host + 'studio-pdf-native')).filter(name => name.endsWith('.ts')).map(name => host + 'studio-pdf-native/' + name);
paths.push(...['studio-pdf-native-document.ts','studio-pdf-native-fonts.ts','studio-pdf-annotation-editor.ts','studio-pdf-codec.ts','studio-pdf-composition.ts'].map(name => host + name));
const findings = [], sources = [];
for (const path of paths) {
  const text = await readFile(path,'utf8'), source = ts.createSourceFile(path,text,ts.ScriptTarget.ES2022,true);
  const visit = node => {
    if (node.kind === ts.SyntaxKind.AnyKeyword) findings.push({ path,kind:'AnyKeyword' });
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text.startsWith('node:')) findings.push({path,kind:'Node import'});
    if (ts.isIdentifier(node) && ['Buffer','require','process','__dirname','__filename'].includes(node.text)) findings.push({path,kind:'Node identifier',name:node.text});
    ts.forEachChild(node,visit);
  }; visit(source);
  if (/@ts-(ignore|expect-error|nocheck)/.test(text)) findings.push({path,kind:'type suppression'});
  sources.push({path,bytes:Buffer.byteLength(text),sha256:createHash('sha256').update(text).digest('hex')});
}
await writeFile(audit+'source-contract.json',JSON.stringify({status:findings.length?'failed':'passed',typescript:ts.version,modules:sources.length,findings,sources},null,2));
if(findings.length) throw new Error(JSON.stringify(findings));
console.log('AST verified',sources.length,'actual host modules: no AnyKeyword, Node runtime imports/identifiers, or type suppressions');
