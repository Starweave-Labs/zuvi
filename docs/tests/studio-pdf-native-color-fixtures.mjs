import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { lib, nativeModule } from './studio-pdf-native-runtime.mjs';

export { lib };
const outputDirectory = await mkdtemp(join(tmpdir(), 'zuvi-native-color-migration-'));
export const read = nativeModule('read');
export const edit = nativeModule('model-edit');
export const codec = nativeModule('export');
export const runtime = nativeModule('runtime');
export const mapping = nativeModule('mapping');

export const colorCases = {
  gray: { stroke: [0.24], fill: [0.83], text: [0.03], strokeOp: 'G', fillOp: 'g' },
  cmyk: {
    stroke: [0.15, 0.35, 0.55, 0.2], fill: [0.1, 0.2, 0, 0.1],
    text: [0.55, 0.7, 0.6, 0.6], strokeOp: 'K', fillOp: 'k',
  },
};

export const kinds = [
  'freeText', 'square', 'circle', 'line', 'polygon', 'polyLine', 'ink',
  'highlight', 'underline', 'strikeOut', 'squiggly', 'note',
];
const nativeSubtypes = {
  freeText: 'FreeText', square: 'Square', circle: 'Circle', line: 'Line',
  polygon: 'Polygon', polyLine: 'PolyLine', ink: 'Ink', highlight: 'Highlight',
  underline: 'Underline', strikeOut: 'StrikeOut', squiggly: 'Squiggly', note: 'Text',
};
const filledKinds = new Set(['freeText', 'square', 'circle', 'line', 'polygon', 'polyLine']);
const name = (value) => lib.PDFName.of(value);
const nativeText = (value) => lib.PDFHexString.fromText(value);
const paint = (values, operator) => values.join(' ') + ' ' + operator;

function sourceAppearance(pdf, font, kind, width, height, colors, fillMode) {
  const operations = ['q', '/GS gs'];
  if (kind === 'freeText') {
    operations.push(paint(colors.stroke, colors.fillOp), `0 0 ${width} ${height} re f`);
    if (fillMode !== 'none') {
      operations.push(fillMode === 'missing' ? '0 G' : paint(colors.fill, colors.strokeOp));
      operations.push('1 w', `0.5 0.5 ${width - 1} ${height - 1} re S`);
    }
    operations.push('BT', '/F1 12 Tf', paint(colors.text, colors.fillOp));
    const baseline = height - 3 - 1 - font.heightAtSize(12, { descender: false });
    operations.push(`1 0 0 1 4 ${baseline} Tm`, '(Source color text) Tj', 'ET');
  } else if (kind === 'highlight') {
    operations.push(paint(colors.stroke, colors.fillOp), `0 0 ${width} ${height} re f`);
  } else if (['underline', 'strikeOut', 'squiggly'].includes(kind)) {
    operations.push(paint(colors.stroke, colors.strokeOp), '1 w');
    const baseline = kind === 'strikeOut' ? height / 2 : 0.5;
    operations.push(`0 ${baseline} m`);
    if (kind === 'squiggly') {
      for (let x = 2; x < width; x += 2) operations.push(`${x} ${x % 4 ? 1.3 : 0.1} l`);
    }
    operations.push(`${width} ${baseline} l S`);
  } else if (['ink', 'line', 'polyLine'].includes(kind)) {
    operations.push(paint(colors.stroke, colors.strokeOp), '1 w', '10 10 m');
    if (kind === 'line') operations.push(`${width - 10} ${height - 10} l S`);
    else operations.push(`${width / 2} ${height - 10} l`, `${width - 10} 10 l S`);
  } else if (kind === 'polygon') {
    operations.push(paint(colors.stroke, colors.strokeOp), paint(colors.fill, colors.fillOp), '1 w');
    operations.push('10 10 m', `${width - 10} 10 l`, `${width / 2} ${height - 10} l`, 'h', 'B');
  } else if (kind === 'circle') {
    const rx = (width - 1) / 2, ry = (height - 1) / 2, cx = width / 2, cy = height / 2;
    const k = 4 / 3 * Math.tan(Math.PI / 8);
    operations.push(paint(colors.stroke, colors.strokeOp), paint(colors.fill, colors.fillOp), '1 w');
    operations.push(`${cx + rx} ${cy} m`);
    operations.push(`${cx + rx} ${cy + k * ry} ${cx + k * rx} ${cy + ry} ${cx} ${cy + ry} c`);
    operations.push(`${cx - k * rx} ${cy + ry} ${cx - rx} ${cy + k * ry} ${cx - rx} ${cy} c`);
    operations.push(`${cx - rx} ${cy - k * ry} ${cx - k * rx} ${cy - ry} ${cx} ${cy - ry} c`);
    operations.push(`${cx + k * rx} ${cy - ry} ${cx + rx} ${cy - k * ry} ${cx + rx} ${cy} c`, 'h', 'B');
  } else {
    operations.push(paint(colors.stroke, colors.strokeOp), '1 w');
    if (kind === 'note') operations.push(paint(colors.stroke, colors.fillOp));
    else operations.push(paint(colors.fill, colors.fillOp));
    operations.push(`0.5 0.5 ${width - 1} ${height - 1} re B`);
  }
  operations.push('Q');
  const stream = pdf.context.flateStream(operations.join('\n'), {
    Type: 'XObject', Subtype: 'Form', FormType: 1, BBox: [0, 0, width, height],
    Resources: {
      Font: { F1: font.ref },
      ExtGState: { GS: { Type: 'ExtGState', CA: 0.8, ca: 0.8, ...(kind === 'highlight' ? { BM: 'Multiply' } : {}) } },
    },
  });
  return pdf.context.register(stream);
}

function addSource(pdf, page, font, kind, nm, rect, colors, options = {}) {
  const [x0, y0, x1, y1] = rect;
  const body = {
    Type: 'Annot', Subtype: nativeSubtypes[kind], P: page.ref, Rect: rect,
    NM: nativeText(nm), Contents: nativeText(kind === 'freeText' ? 'Source color text' : 'Source color comment'),
    T: nativeText('Native QA'), F: options.flags ?? 4, C: colors.stroke, CA: 0.8,
    CreationDate: lib.PDFString.of('D:20261127000000Z'), M: lib.PDFString.of('D:20261127000000Z'),
    BS: { W: 1, S: 'S' },
  };
  if (filledKinds.has(kind) && options.fillMode !== 'missing') body.IC = options.fillMode === 'none' ? [] : colors.fill;
  if (kind === 'freeText') Object.assign(body, {
    DA: lib.PDFString.of(options.da ?? '/F1 12 Tf ' + paint(colors.text, colors.fillOp)),
    DR: { Font: { F1: font.ref } }, Q: 0, RD: [0, 0, 0, 0], ZuviTextPadding: [3, 3, 3, 3],
  });
  if (['square', 'circle'].includes(kind)) body.RD = [0, 0, 0, 0];
  if (kind === 'line') Object.assign(body, { L: [x0 + 10, y0 + 10, x1 - 10, y1 - 10], LE: ['None', 'None'] });
  if (kind === 'polygon') body.Vertices = [x0 + 10, y0 + 10, x1 - 10, y0 + 10, x0 + (x1 - x0) / 2, y1 - 10];
  if (kind === 'polyLine') Object.assign(body, { Vertices: [x0 + 10, y0 + 10, x0 + (x1 - x0) / 2, y1 - 10, x1 - 10, y0 + 10], LE: ['None', 'None'] });
  if (kind === 'ink') body.InkList = [[x0 + 10, y0 + 10, x0 + (x1 - x0) / 2, y1 - 10, x1 - 10, y0 + 10]];
  if (['highlight', 'underline', 'strikeOut', 'squiggly'].includes(kind)) body.QuadPoints = [x0, y1, x1, y1, x0, y0, x1, y0];
  if (kind === 'note') body.Name = 'Comment';
  if (!options.noAp) body.AP = { N: sourceAppearance(pdf, font, kind, x1 - x0, y1 - y0, colors, options.fillMode) };
  if (options.action) body.A = { S: 'JavaScript', JS: nativeText('void(0)') };
  const dict = pdf.context.obj(body), ref = pdf.context.register(dict);
  const annots = page.node.Annots() ?? pdf.context.obj([]);
  annots.push(ref);
  page.node.set(name('Annots'), annots);
  return dict;
}

let fixturePromise;
export function sourceColorFixture() {
  fixturePromise ??= (async () => {
    const pdf = await lib.PDFDocument.create({ updateMetadata: false });
    pdf.setTitle('Independent native Gray and CMYK annotation QA');
    pdf.setCreationDate(new Date('2026-11-27T00:00:00.000Z'));
    pdf.setModificationDate(new Date('2026-11-27T00:00:00.000Z'));
    const font = await pdf.embedFont(lib.StandardFonts.Helvetica);
    for (const [space, colors] of Object.entries(colorCases)) {
      const page = pdf.addPage([612, 900]);
      page.drawText(space.toUpperCase() + ' native annotation colors', { x: 40, y: 866, size: 18, font });
      for (const [index, kind] of kinds.entries()) {
        const column = index % 2, row = Math.floor(index / 2);
        const x = 40 + column * 275, y = 770 - row * 130;
        page.drawText(kind, { x, y: y + 79, size: 10, font });
        const rect = kind === 'note' ? [x, y, x + 28, y + 28] : [x, y, x + 240, y + 70];
        addSource(pdf, page, font, kind, space + '-' + kind, rect, colors);
      }
    }
    const extras = pdf.addPage([612, 792]);
    extras.drawText('Explicit none, missing IC and DA-only source', { x: 40, y: 740, size: 16, font });
    const colors = colorCases.cmyk;
    addSource(pdf, extras, font, 'freeText', 'cmyk-freeText-missing-fill', [40, 620, 280, 690], colors, { fillMode: 'missing' });
    addSource(pdf, extras, font, 'freeText', 'cmyk-freeText-empty-fill', [320, 620, 560, 690], colors, { fillMode: 'none' });
    addSource(pdf, extras, font, 'freeText', 'cmyk-freeText-no-ap', [40, 500, 280, 570], colors, { noAp: true });
    addSource(pdf, extras, font, 'freeText', 'cmyk-freeText-locked', [320, 500, 560, 570], colors, { flags: 4 | 128 });
    addSource(pdf, extras, font, 'freeText', 'cmyk-freeText-action', [40, 380, 280, 450], colors, { noAp: true, action: true });
    addSource(pdf, extras, font, 'freeText', 'cmyk-freeText-complex', [320, 380, 560, 450], colors, { da: '/F1 12 Tf 0.2 0.3 0.4 0.1 k' })
      .lookup(name('AP'), lib.PDFDict).lookup(name('N'), lib.PDFRawStream).dict.set(name('Matrix'), pdf.context.obj([1, 0.1, 0, 1, 0, 0]));
    for (const [index, da] of [
      '/F1 12 Tf 0.2 0.3 0.4 0.1 k q',
      '(/F1 12 Tf 0.2 0.3 0.4 0.1 k)',
      '% /F1 12 Tf 0.2 0.3 0.4 0.1 k',
    ].entries()) {
      addSource(pdf, extras, font, 'freeText', 'cmyk-invalid-da-' + index, [40 + index * 185, 220, 205 + index * 185, 290], colors, { noAp: true, da });
    }
    const bytes = new Uint8Array(await pdf.save({ useObjectStreams: false, updateFieldAppearances: false }));
    await mkdir(outputDirectory, { recursive: true });
    await writeFile(join(outputDirectory, 'native-device-color-source.pdf'), bytes);
    return bytes;
  })();
  return fixturePromise;
}

export function byName(model, nm) {
  const annotation = model.annotations.find((entry) => entry._native?.name === nm);
  assert.ok(annotation, 'Missing model annotation ' + nm);
  return annotation;
}

export async function nativeRecord(bytes, nm) {
  const pdf = await lib.PDFDocument.load(bytes, { updateMetadata: false });
  const dict = pdf.getPages().flatMap((page) => page.node.Annots()?.asArray() ?? [])
    .map((ref) => pdf.context.lookup(ref, lib.PDFDict))
    .find((entry) => entry.lookup(name('NM'))?.decodeText() === nm);
  assert.ok(dict, 'Missing native annotation ' + nm);
  const components = (key) => {
    const value = dict.lookup(name(key));
    return value instanceof lib.PDFArray ? value.asArray().map((entry) => pdf.context.lookup(entry, lib.PDFNumber).asNumber()) : undefined;
  };
  const ap = dict.lookup(name('AP'));
  const normal = ap instanceof lib.PDFDict ? ap.lookup(name('N')) : undefined;
  const data = normal instanceof lib.PDFRawStream ? lib.decodePDFRawStream(normal).decode() : undefined;
  const source = data ? Array.from(data, (byte) => String.fromCharCode(byte)).join('') : undefined;
  const da = dict.lookup(name('DA'));
  return {
    pdf, dict, C: components('C'), IC: components('IC'), rect: components('Rect'),
    DA: da instanceof lib.PDFString || da instanceof lib.PDFHexString ? da.decodeText() : undefined,
    AP: source,
  };
}

export function operatorValues(source, operator, count) {
  const tokens = source.split(/\s+/);
  const values = [];
  for (let index = count; index < tokens.length; index++) {
    if (tokens[index] !== operator) continue;
    const prior = tokens.slice(index - count, index);
    if (prior.every((value) => /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value))) values.push(prior.map(Number));
  }
  return values;
}

export function assertPaint(source, operator, expected, message) {
  assert.ok(source, 'Missing appearance stream');
  assert.ok(operatorValues(source, operator, expected.length).some((values) => JSON.stringify(values) === JSON.stringify(expected)), message ?? `Missing native ${expected.join(' ')} ${operator}`);
}

export async function keepOutput(name, bytes) {
  await writeFile(join(outputDirectory, name), bytes);
}
