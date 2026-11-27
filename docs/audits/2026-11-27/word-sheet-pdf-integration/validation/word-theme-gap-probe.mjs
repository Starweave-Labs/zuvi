import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Reuse the exact native codec loader, without registering its test callbacks.
const loader = resolve('docs/tests/office-studio-word.test.mjs');
const original = await readFile(loader, 'utf8');
const directory = resolve('docs/audits/2026-11-27/word-sheet-pdf-integration/validation/word-theme-gap-probe');
await mkdir(directory, { recursive: true });
const harness = original
  .replace("import test from 'node:test';", 'const test = () => {};')
  .replaceAll('import.meta.url', JSON.stringify(pathToFileURL(loader).href));
const probe = `
const probeFs = await import('node:fs/promises');
const probePath = ${JSON.stringify(directory)};
const probeTheme = '<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:themeElements><a:fontScheme name="Original"><a:majorFont><a:latin typeface="Arial"/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/></a:minorFont></a:fontScheme><a:clrScheme name="Original"><a:accent1><a:srgbClr val="4472C4"/></a:accent1></a:clrScheme></a:themeElements></a:theme>';
const probeCases = [
  ['theme-reference', '<w:rFonts w:asciiTheme="minorHAnsi"/><w:color w:themeColor="accent1"/>'],
  ['automatic-color', '<w:color w:val="auto"/>'],
  ['alpha-color', '<w:color w:val="4472C4"/><w14:textFill xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"><w14:solidFill><w14:srgbClr w14:val="4472C4"><w14:alpha w14:val="50000"/></w14:srgbClr></w14:solidFill></w14:textFill>'],
];
const probeReports = [];
for (const [name, properties] of probeCases) {
  const input = await fixture('<w:p><w:r><w:rPr>' + properties + '</w:rPr><w:t>Theme identity</w:t></w:r></w:p>', {'word/theme/theme1.xml': probeTheme});
  await probeFs.writeFile(probePath + '/' + name + '-source.docx', Buffer.from(await input.arrayBuffer()));
  try {
    let doc = await importStudioWord(input, name + '.docx');
    const imported = JSON.parse(JSON.stringify(doc));
    const rounds = [];
    for (let pass = 1; pass <= 2; pass++) {
      const output = await exportStudioWord(doc);
      await probeFs.writeFile(probePath + '/' + name + '-round-' + pass + '.docx', Buffer.from(await output.arrayBuffer()));
      const archive = await JSZip.loadAsync(await output.arrayBuffer());
      const native = await archive.file('word/document.xml').async('string');
      const theme = archive.file('word/theme/theme1.xml');
      rounds.push({pass, native, theme: theme ? await theme.async('string') : null, retainsColorReference: /w:themeColor="accent1"/.test(native), retainsFontReference: /w:(?:asciiTheme|hAnsiTheme)="minorHAnsi"/.test(native), retainsAutoColor: /w:color[^>]*w:val="auto"/.test(native), retainsAlpha: /alpha[^>]*(?:val="50000")/.test(native)});
      doc = await importStudioWord(output, name + '.docx');
    }
    const retained = rounds.every(round => name === 'theme-reference' ? round.retainsColorReference && round.retainsFontReference : name === 'automatic-color' ? round.retainsAutoColor : round.retainsAlpha);
    probeReports.push({name, imported, rounds, status:retained ? 'identity-retained' : 'accepted-input-with-identity-loss'});
  } catch (error) { probeReports.push({name,status:'rejected-input',message:String(error.message)}); }
}
globalThis.__officeThemeProbeReports = probeReports;
`;
await import('data:text/javascript;base64,' + Buffer.from(harness + probe).toString('base64'));
const output = {
  scope: 'Diagnostic only; W005 and W021 remain incomplete',
  loaderSha256: createHash('sha256').update(original).digest('hex'),
  reports: globalThis.__officeThemeProbeReports,
};
delete globalThis.__officeThemeProbeReports;
await writeFile(directory + '/results.json', JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify(output.reports.map(({ name, status, rounds, message }) => ({ name, status, message, rounds: rounds?.map(({ pass, retainsColorReference, retainsFontReference, retainsAutoColor, retainsAlpha }) => ({ pass, retainsColorReference, retainsFontReference, retainsAutoColor, retainsAlpha })) })), null, 2));
