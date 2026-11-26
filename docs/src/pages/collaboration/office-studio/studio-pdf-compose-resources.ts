import {
  PDFArray,
  PDFDict,
  PDFName,
  PDFString,
  PDFHexString,
  PDFStream,
  type PDFObject,
  type PDFDocument,
} from 'pdf-lib';
import { fail, name, read, resolve, canonical } from './studio-pdf-compose-utils';

import type {
  PdfComposeSourceState,
  PdfFieldRecord,
  PdfDAToken,
  PdfDAResource,
  PdfDAAnalysis,
  PdfResourceState,
  StudioPdfComposeValue,
} from './studio-pdf-compose-types';
import type { ClosedPdfCopier } from './studio-pdf-compose-utils';
const SPACE = /[\0\t\n\f\r ]/;
const NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)$/;
const BUILTIN_COLORSPACES = new Set(['DeviceGray', 'DeviceRGB', 'DeviceCMYK', 'Pattern']);
const NUMERIC_OPERATORS = new Map([
  ['g', 1],
  ['G', 1],
  ['rg', 3],
  ['RG', 3],
  ['k', 4],
  ['K', 4],
  ['Tc', 1],
  ['Tw', 1],
  ['Tz', 1],
  ['TL', 1],
  ['Tr', 1],
  ['Ts', 1],
  ['w', 1],
  ['J', 1],
  ['j', 1],
  ['M', 1],
  ['i', 1],
  ['cm', 6],
]);

/** Parse DA as PDF tokens; never replace names inside comments or strings. */
export function analyseDA(
  source: PdfComposeSourceState,
  value: PDFObject | undefined,
  path: string
): PdfDAAnalysis {
  if (value === undefined) return { raw: undefined, tokens: [], resources: [] };
  if (!(value instanceof PDFString || value instanceof PDFHexString))
    fail('DA_TYPE', source.id, path, 'Default appearance must be a PDF string');
  const raw = value.decodeText(),
    tokens: PdfDAToken[] = [];
  for (let index = 0; index < raw.length;) {
    if (SPACE.test(raw[index])) {
      index++;
      continue;
    }
    if (raw[index] === '%') {
      while (index < raw.length && !/[\r\n]/.test(raw[index])) index++;
      continue;
    }
    const start = index;
    if ('()<>[]{}'.includes(raw[index]))
      fail(
        'DA_SYNTAX',
        source.id,
        `${path}@${index}`,
        'Opaque strings, arrays, or dictionaries in DA cannot be rewritten safely'
      );
    const isName = raw[index] === '/';
    if (isName) index++;
    while (index < raw.length && !SPACE.test(raw[index]) && !'()<>[]{}/%'.includes(raw[index]))
      index++;
    if (index === start || (isName && index === start + 1))
      fail('DA_SYNTAX', source.id, `${path}@${index}`, 'Invalid PDF token in DA');
    const token = raw.slice(start, index),
      decoded = isName
        ? token
            .slice(1)
            .replace(/#([\da-f]{2})/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
        : token;
    tokens.push({
      start,
      end: index,
      raw: token,
      type: isName ? 'name' : NUMBER.test(token) ? 'number' : 'operator',
      value: decoded,
    });
  }
  const resources: PdfDAResource[] = [],
    operands: PdfDAToken[] = [];
  const requireTypes = (operator: PdfDAToken, types: readonly PdfDAToken['type'][]): void => {
    if (
      operands.length !== types.length ||
      operands.some((operand, index) => operand.type !== types[index])
    )
      fail(
        'DA_OPERANDS',
        source.id,
        `${path}@${operator.start}`,
        `Invalid operands for ${operator.value}`
      );
  };
  for (const token of tokens) {
    if (token.type !== 'operator') {
      operands.push(token);
      continue;
    }
    const op = token.value;
    if (op === 'Tf') {
      requireTypes(token, ['name', 'number']);
      resources.push({ token: operands[0], category: 'Font', fontSize: Number(operands[1].value) });
    } else if (['gs', 'Do', 'sh'].includes(op)) {
      requireTypes(token, ['name']);
      resources.push({
        token: operands[0],
        category: op === 'gs' ? 'ExtGState' : op === 'Do' ? 'XObject' : 'Shading',
      });
    } else if (op === 'cs' || op === 'CS') {
      requireTypes(token, ['name']);
      if (!BUILTIN_COLORSPACES.has(operands[0].value))
        resources.push({ token: operands[0], category: 'ColorSpace' });
    } else if (op === 'scn' || op === 'SCN') {
      const last = operands.at(-1);
      if (last?.type === 'name') resources.push({ token: last, category: 'Pattern' });
      if (
        operands
          .slice(0, operands.at(-1)?.type === 'name' ? -1 : undefined)
          .some((operand) => operand.type !== 'number')
      )
        fail('DA_OPERANDS', source.id, path, `Invalid color operands for ${op}`);
    } else if (op === 'sc' || op === 'SC') {
      if (!operands.length || operands.some((operand) => operand.type !== 'number'))
        fail('DA_OPERANDS', source.id, path, `Invalid color operands for ${op}`);
    } else if (NUMERIC_OPERATORS.has(op))
      requireTypes(token, Array(NUMERIC_OPERATORS.get(op)).fill('number'));
    else if (['q', 'Q', 'BT', 'ET'].includes(op)) requireTypes(token, []);
    else if (op === 'ri') requireTypes(token, ['name']);
    else
      fail(
        'DA_OPERATOR',
        source.id,
        `${path}@${token.start}`,
        `Unsupported default-appearance operator ${op}`
      );
    operands.length = 0;
  }
  if (operands.length) fail('DA_OPERANDS', source.id, path, 'DA ends with dangling operands');
  return { raw, tokens, resources };
}

function appearanceFonts(
  source: PdfComposeSourceState,
  record: PdfFieldRecord,
  fontName: string
): PDFObject[] {
  const found: PDFObject[] = [];
  const visiting = new Set<PDFObject>();
  const walk = (value: PDFObject | undefined): void => {
    const object = resolve(source, value);
    if (!object || visiting.has(object)) return;
    visiting.add(object);
    if (object instanceof PDFStream) {
      const resources = read(source, object.dict, 'Resources'),
        fonts = read(source, resources, 'Font');
      if (fonts instanceof PDFDict) {
        const font = fonts.get(name(fontName));
        if (font) found.push(font);
      }
    } else if (object instanceof PDFDict) for (const [, entry] of object.entries()) walk(entry);
  };
  for (const widget of record.widgets ?? []) walk(widget.dict.get(name('AP')));
  return found;
}

export function prepareResources(
  source: PdfComposeSourceState,
  records: readonly PdfFieldRecord[],
  prefix: string
): PdfResourceState {
  const entries = new Map<string, Map<string, PDFObject> | PDFArray>(),
    dr = read(source, source.form, 'DR');
  if (dr && !(dr instanceof PDFDict))
    fail('DR_TYPE', source.id, '/AcroForm/DR', 'Default resources must be a dictionary');
  for (const [category, value] of dr?.entries() ?? []) {
    const object = resolve(source, value),
      key = category.decodeText();
    if (key === 'ProcSet' && object instanceof PDFArray) {
      entries.set(key, object);
      continue;
    }
    if (!(object instanceof PDFDict))
      fail(
        'DR_CATEGORY',
        source.id,
        `/AcroForm/DR/${key}`,
        'Resource category must be a dictionary'
      );
    entries.set(
      key,
      new Map(
        object.entries().map(([resourceName, resource]) => [resourceName.decodeText(), resource])
      )
    );
  }
  const analyses = new Map<PdfFieldRecord, PdfDAAnalysis>();
  for (const record of records) {
    const analysis = analyseDA(source, record.effective.DA, `${record.path}/DA`);
    analyses.set(record, analysis);
    for (const resource of analysis.resources) {
      let category = entries.get(resource.category);
      if (!category) {
        category = new Map();
        entries.set(resource.category, category);
      }
      if (!(category instanceof Map))
        fail('DR_CATEGORY', source.id, record.path, 'Resource category has an incompatible shape');
      if (!category.has(resource.token.value) && resource.category === 'Font') {
        const candidates = appearanceFonts(source, record, resource.token.value);
        if (
          candidates.length &&
          candidates.every(
            (value) =>
              JSON.stringify(canonical(source, value)) ===
              JSON.stringify(canonical(source, candidates[0]))
          )
        )
          category.set(resource.token.value, candidates[0]);
      }
      // pdf-lib's vector-only button providers use this exact zero-size Tf
      // marker to retain DA colors. It is not a font resource for text layout.
      if (
        !category.has(resource.token.value) &&
        resource.category === 'Font' &&
        resource.token.value === 'dummy__noop' &&
        resource.fontSize === 0 &&
        ['checkbox', 'radio'].includes(record.kind)
      ) {
        resource.noop = true;
        continue;
      }
      if (!category.has(resource.token.value))
        fail(
          'MISSING_DA_RESOURCE',
          source.id,
          `${record.path}/DA`,
          `Cannot resolve /${resource.token.value} in /DR/${resource.category} or retained appearances`
        );
    }
  }
  source.resources = { prefix, entries, analyses, names: new Map<string, Map<string, string>>() };
  for (const [category, resources] of entries)
    if (resources instanceof Map)
      resourceState(source).names.set(
        category,
        new Map([...resources.keys()].map((key) => [key, `${prefix}_${key}`]))
      );
  return source.resources;
}

export function daSemantics(
  source: PdfComposeSourceState,
  record: PdfFieldRecord
): StudioPdfComposeValue {
  const state = resourceState(source),
    analysis =
      state.analyses.get(record) ?? analyseDA(source, record.effective.DA, `${record.path}/DA`),
    categories = new Map<PdfDAToken, string>(
      analysis.resources
        .filter((resource) => !resource.noop)
        .map((resource) => [resource.token, resource.category])
    );
  return analysis.tokens.map((token) => {
    const category = categories.get(token);
    if (category) {
      const entries = state.entries.get(category);
      if (!(entries instanceof Map))
        fail('DR_CATEGORY', source.id, `${record.path}/DA`, 'Default resource category is missing');
      return [category, canonical(source, entries.get(token.value))];
    }
    return token.type === 'number' ? Number(token.value) : [token.type, token.value];
  });
}

export function rewrittenDA(
  source: PdfComposeSourceState,
  record: PdfFieldRecord
): PDFString | undefined {
  const state = resourceState(source),
    analysis =
      state.analyses.get(record) ?? analyseDA(source, record.effective.DA, `${record.path}/DA`);
  if (analysis.raw === undefined) return undefined;
  let raw = analysis.raw;
  for (const { token, category } of analysis.resources
    .filter((resource) => !resource.noop)
    .sort((a, b) => b.token.start - a.token.start)) {
    const mapped = state.names.get(category)?.get(token.value);
    if (mapped === undefined)
      fail(
        'MISSING_DA_RESOURCE',
        source.id,
        `${record.path}/DA`,
        `Cannot resolve /${token.value} in /DR/${category}`
      );
    raw = `${raw.slice(0, token.start)}${PDFName.of(mapped).toString()}${raw.slice(token.end)}`;
  }
  return PDFString.of(raw);
}

export function copyResources(
  source: PdfComposeSourceState,
  target: PDFDocument,
  copier: ClosedPdfCopier,
  targetDR: PDFDict
): void {
  const state = resourceState(source);
  for (const [category, resources] of state.entries) {
    if (category === 'ProcSet') {
      if (!(resources instanceof PDFArray))
        fail('DR_CATEGORY', source.id, '/AcroForm/DR/ProcSet', 'ProcSet must be an array');
      const previous = targetDR.lookup(name(category)),
        array = previous instanceof PDFArray ? previous : target.context.obj([]);
      if (!(previous instanceof PDFArray)) targetDR.set(name(category), array);
      for (const entry of resources.asArray())
        if (!array.asArray().some((current) => current.toString() === entry.toString()))
          array.push(copier.copy(entry, '/AcroForm/DR/ProcSet'));
      continue;
    }
    if (!(resources instanceof Map))
      fail(
        'DR_CATEGORY',
        source.id,
        `/AcroForm/DR/${category}`,
        'Default resources must be a dictionary category'
      );
    const previous = targetDR.lookup(name(category)),
      dictionary = previous instanceof PDFDict ? previous : target.context.obj({});
    if (!(previous instanceof PDFDict)) targetDR.set(name(category), dictionary);
    for (const [resourceName, value] of resources) {
      const mapped = state.names.get(category)?.get(resourceName);
      if (mapped === undefined)
        fail(
          'MISSING_DA_RESOURCE',
          source.id,
          `/AcroForm/DR/${category}`,
          'Default resource name is missing'
        );
      dictionary.set(name(mapped), copier.copy(value, `/AcroForm/DR/${category}/${resourceName}`));
    }
  }
}
function resourceState(source: PdfComposeSourceState): PdfResourceState {
  if (!source.resources)
    fail('RESOURCE_STATE', source.id, '/AcroForm/DR', 'Default resources have not been prepared');
  return source.resources;
}
