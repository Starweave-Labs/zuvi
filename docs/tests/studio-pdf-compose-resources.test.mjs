import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, PDFString, PDFRawStream, StandardFonts } from 'pdf-lib';
import { prepareResources, rewrittenDA, daSemantics } from './studio-pdf-compose-test-loader.mjs';
import {
  ClosedPdfCopier,
  PdfComposeError,
  name,
  hash,
} from './studio-pdf-compose-test-loader.mjs';
import { basicPdf, inspect } from './studio-pdf-compose-fixtures.mjs';

test('DA tokenizer rewrites resource operands and ignores comments with escaped PDF names', async () => {
  const fixture = await basicPdf();
  fixture.fields.Shared.acroField.dict.set(
    name('DA'),
    PDFString.of('% /F1 is a comment\n/F#31 12 Tf 0 g')
  );
  const source = await inspect(await fixture.bytes());
  prepareResources(source, source.fields, 'SRC');
  assert.equal(
    rewrittenDA(source, source.fields[0]).decodeText(),
    '% /F1 is a comment\n/SRC_F1 12 Tf 0 g'
  );
});
test('DA resource compiler supports font, graphics state, color space and pattern namespaces', async () => {
  const fixture = await basicPdf(),
    form = fixture.pdf.getForm().acroForm.dict,
    dr = form.lookup(name('DR'));
  dr.set(name('ExtGState'), fixture.pdf.context.obj({ GS1: { Type: 'ExtGState', CA: 0.5 } }));
  dr.set(name('ColorSpace'), fixture.pdf.context.obj({ CS1: 'DeviceRGB' }));
  dr.set(
    name('Pattern'),
    fixture.pdf.context.obj({
      P1: {
        Type: 'Pattern',
        PatternType: 2,
        Shading: { ShadingType: 2, ColorSpace: 'DeviceRGB', Coords: [0, 0, 1, 1] },
      },
    })
  );
  fixture.fields.Shared.acroField.dict.set(
    name('DA'),
    PDFString.of('/F1 12 Tf /GS1 gs /CS1 cs 0.5 /P1 scn')
  );
  const source = await inspect(await fixture.bytes());
  prepareResources(source, source.fields, 'SRC');
  assert.equal(
    rewrittenDA(source, source.fields[0]).decodeText(),
    '/SRC_F1 12 Tf /SRC_GS1 gs /SRC_CS1 cs 0.5 /SRC_P1 scn'
  );
});
test('DA semantic comparison resolves actual font resources rather than matching /F1 text', async () => {
  const a = await basicPdf({ fontName: StandardFonts.Helvetica }),
    b = await basicPdf({ fontName: StandardFonts.TimesRoman }),
    sa = await inspect(await a.bytes()),
    sb = await inspect(await b.bytes());
  prepareResources(sa, sa.fields, 'A');
  prepareResources(sb, sb.fields, 'B');
  assert.notDeepEqual(daSemantics(sa, sa.fields[0]), daSemantics(sb, sb.fields[0]));
});
test('missing AcroForm DR font is recovered only from unambiguous existing appearance resources', async () => {
  const fixture = await basicPdf();
  fixture.pdf.getForm().acroForm.dict.delete(name('DR'));
  fixture.fields.Shared.acroField.dict.set(name('DA'), PDFString.of('/Helvetica 12 Tf 0 g'));
  const source = await inspect(await fixture.bytes());
  prepareResources(source, source.fields, 'RECOVERED');
  assert.equal(
    rewrittenDA(source, source.fields[0]).decodeText(),
    '/RECOVERED_Helvetica 12 Tf 0 g'
  );
});
test('unresolved DA resource and opaque content operators fail at their exact field path', async () => {
  const fixture = await basicPdf();
  fixture.fields.Shared.acroField.dict.set(name('DA'), PDFString.of('/Missing 12 Tf 0 g'));
  const bytes = await fixture.bytes(),
    before = hash(bytes),
    source = await inspect(bytes);
  assert.throws(
    () => prepareResources(source, source.fields, 'BAD'),
    (error) =>
      error instanceof PdfComposeError &&
      error.code === 'MISSING_DA_RESOURCE' &&
      error.path.includes('/DA')
  );
  assert.equal(hash(bytes), before);
  fixture.fields.Shared.acroField.dict.set(name('DA'), PDFString.of('/F1 12 Tf (literal) Tj'));
  const second = await inspect(await fixture.bytes());
  assert.throws(
    () => prepareResources(second, second.fields, 'BAD'),
    (error) => error.code === 'DA_SYNTAX'
  );
});
test('closed copier registers stream placeholders before traversing a cyclic stream dictionary', async () => {
  const pdf = await PDFDocument.create({ updateMetadata: false }),
    dict = pdf.context.obj({}),
    stream = PDFRawStream.of(dict, Uint8Array.of(65, 66)),
    ref = pdf.context.register(stream);
  dict.set(name('Cycle'), ref);
  const target = await PDFDocument.create({ updateMetadata: false }),
    source = { id: 'cycle-stream', pdf, fieldRefs: new Set(), annotations: new Map() },
    copier = new ClosedPdfCopier(source, target, new Map(), () => undefined),
    copied = copier.copy(ref),
    output = target.context.lookup(copied);
  assert.equal(hash(output.getContents()), hash(stream.getContents()));
  assert.equal(output.dict.get(name('Cycle')).toString(), copied.toString());
});
