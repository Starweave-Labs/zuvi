import { PDFDict, PDFArray, PDFStream } from 'pdf-lib';
import type { PDFObject } from 'pdf-lib';
import type { AnnotationKind, NativeDeviceColor } from './types';
import type { AppearanceProperties, AppearanceInspection, AppearanceToken } from './parser-types';
import { get, has, number, numbers, finiteArray, text, annotationAppearance, streamBytes } from './objects';
import { name } from './constants';
import { latin1 } from './runtime';
import { deviceColorRgb } from './colors';

const PLAIN_AP_OPERATORS = new Set([
  'q', 'Q', 'gs', 'w', 'J', 'j', 'M', 'd',
  'g', 'G', 'rg', 'RG', 'k', 'K',
  'm', 'l', 'c', 'v', 'y', 'h', 're', 'S', 's', 'f', 'F', 'f*', 'B', 'B*', 'b', 'b*', 'n', 'W', 'W*',
  'BT', 'ET', 'Tf', 'Tm', 'Td', 'TD', 'T*', 'TL', 'Tc', 'Tw', 'Tz', 'Ts', 'Tr', 'Tj', 'TJ', "'", '"', 'cm',
]);

function numeric(tokens: AppearanceToken[], end: number, count: number): number[] | undefined {
  const values = tokens.slice(end - count, end);
  return finiteArray(values, count) ? values : undefined;
}
function strokeEnum(value: AppearanceToken): value is 0 | 1 | 2 {
  return value === 0 || value === 1 || value === 2;
}
function identity(matrix: number[] | undefined): boolean {
  return !!matrix && matrix.length === 6 && matrix.every((value, index) => value === [1, 0, 0, 1, 0, 0][index]);
}

/** Strings/comments cannot impersonate content operators; native device colors stay independent. */
export function appearanceProperties(stream: PDFObject | undefined): AppearanceProperties {
  const bytes = streamBytes(stream);
  if (!bytes) return { fonts: [], restrictions: ['Native AP has no single normal stream.'] };
  const source = latin1(bytes), tokens: AppearanceToken[] = [];
  const delimiter = (value: string): boolean => !value || /[\s()[\]<>/%{}]/.test(value);
  for (let index = 0; index < source.length;) {
    const char = source[index];
    if (/\s/.test(char)) { index++; continue; }
    if (char === '%') { while (index < source.length && !/[\r\n]/.test(source[index])) index++; continue; }
    if (char === '(') {
      let depth = 1; index++;
      while (index < source.length && depth) {
        if (source[index] === '\\') { index += 2; continue; }
        if (source[index] === '(') depth++;
        if (source[index] === ')') depth--;
        index++;
      }
      tokens.push({ literal: true }); continue;
    }
    if (char === '<' && source[index + 1] !== '<') {
      index++; while (index < source.length && source[index] !== '>') index++;
      index++; tokens.push({ literal: true }); continue;
    }
    if ('[]<>{}'.includes(char)) { tokens.push(char); index++; continue; }
    const start = index++;
    while (index < source.length && !delimiter(source[index])) index++;
    const token = source.slice(start, index);
    tokens.push(/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(token) ? Number(token) : token);
  }
  const fonts: { key: string; size: number }[] = [], restrictions: string[] = [];
  const textColors: NativeDeviceColor[] = [], graphicsStates: string[] = [], colorStack: NativeDeviceColor[] = [], textPositions: number[][] = [];
  let insideText = false, hasText = false, lineCap: 0 | 1 | 2 = 0, lineJoin: 0 | 1 | 2 = 0, miterLimit = 10;
  let currentColor: NativeDeviceColor = { space: 'gray', components: [0] };
  let position = [0, 0], linePosition = [0, 0], leading = 0;
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (typeof token !== 'string') continue;
    if (!token.startsWith('/') && !'[]<>{}'.includes(token) && !PLAIN_AP_OPERATORS.has(token)) {
      restrictions.push('Native AP uses an operator outside the plain device-color appearance model.');
    }
    const prior = tokens[index - 1];
    if (token === 'q') colorStack.push(currentColor);
    if (token === 'Q') currentColor = colorStack.pop() ?? { space: 'gray', components: [0] };
    if (token === 'BT') { insideText = true; hasText = true; position = [0, 0]; linePosition = [0, 0]; }
    if (token === 'ET') insideText = false;
    if (insideText && ["'", '"'].includes(token)) { linePosition = [linePosition[0], linePosition[1] - leading]; position = [...linePosition]; }
    if (token === 'Tf') {
      const key = tokens[index - 2];
      if (typeof key === 'string' && key.startsWith('/') && typeof prior === 'number' && Number.isFinite(prior)) {
        fonts.push({ key: key.slice(1).replace(/#([0-9a-f]{2})/gi, (_, value: string) => String.fromCharCode(parseInt(value, 16))), size: prior });
      } else restrictions.push('Unparsed native text font operator.');
    }
    const rgb = token === 'rg' ? numeric(tokens, index, 3) : undefined;
    const gray = token === 'g' ? numeric(tokens, index, 1) : undefined;
    const cmyk = token === 'k' ? numeric(tokens, index, 4) : undefined;
    const components = rgb ?? gray ?? cmyk;
    if (components && components.some((component) => component < 0 || component > 1)) {
      restrictions.push('Native text has invalid device-color components.');
    } else {
      if (rgb) currentColor = { space: 'rgb', components: rgb };
      if (gray) currentColor = { space: 'gray', components: gray };
      if (cmyk) currentColor = { space: 'cmyk', components: cmyk };
    }
    if (insideText && ['Tj', 'TJ', "'", '"'].includes(token)) { textColors.push(currentColor); textPositions.push([...position]); }
    if (insideText && ['cs', 'sc', 'scn'].includes(token)) restrictions.push('Native text uses a non-device fill color.');
    if (token === 'gs' && typeof prior === 'string') graphicsStates.push(prior.slice(1));
    if (token === 'Tm') {
      const matrix = numeric(tokens, index, 6);
      if (!matrix || matrix[0] !== 1 || matrix[1] !== 0 || matrix[2] !== 0 || matrix[3] !== 1) restrictions.push('Native text uses a transformed text matrix.');
      if (matrix) { position = matrix.slice(4); linePosition = [...position]; }
    }
    if (token === 'TL' && typeof prior === 'number' && Number.isFinite(prior)) leading = prior;
    if (['Td', 'TD'].includes(token)) {
      const values = numeric(tokens, index, 2);
      if (values) {
        if (token === 'TD') leading = -values[1];
        linePosition = [linePosition[0] + values[0], linePosition[1] + values[1]]; position = [...linePosition];
      }
    }
    if (token === 'T*') { linePosition = [linePosition[0], linePosition[1] - leading]; position = [...linePosition]; }
    if (['Tc', 'Tw', 'Ts'].includes(token) && prior !== 0) restrictions.push('Native text uses spacing or rise outside the plain layout.');
    if (token === 'Tz' && prior !== 100) restrictions.push('Native text has horizontal scaling.');
    if (token === 'Tr' && prior !== 0) restrictions.push('Native text uses a custom rendering mode.');
    if (token === 'cm' && !identity(numeric(tokens, index, 6))) restrictions.push('Native AP has a content transformation.');
    if (token === 'BI') restrictions.push('Native AP contains an inline image.');
    if (token === 'J' && strokeEnum(prior)) lineCap = prior;
    if (token === 'j' && strokeEnum(prior)) lineJoin = prior;
    if (token === 'M' && typeof prior === 'number' && Number.isFinite(prior) && prior >= 1) miterLimit = prior;
  }
  const uniqueFonts = [...new Map(fonts.map((font) => [font.key + ':' + font.size, font])).values()];
  if (uniqueFonts.length > 1) restrictions.push('Native AP has multiple fonts or font sizes.');
  if (new Set(textColors.map((value) => JSON.stringify(value))).size > 1) restrictions.push('Native AP has mixed text colors.');
  const baselines = [...new Set(textPositions.map((entry) => entry[1]))];
  const lineHeight = baselines.length > 1 ? baselines[0] - baselines[1] : undefined;
  const deviceColor = textColors.at(-1);
  return { fonts: uniqueFonts, color: deviceColor ? deviceColorRgb(deviceColor) ?? undefined : undefined, deviceColor, restrictions: [...new Set(restrictions)], lineCap, lineJoin, miterLimit, hasText, graphicsStates, firstTextPosition: textPositions[0], lineHeight };
}

export function appearanceRestrictions(dict: PDFDict, rect: number[], kind: AnnotationKind): AppearanceInspection {
  const appearance = annotationAppearance(dict);
  const properties: AppearanceProperties = has(dict, 'AP') ? appearanceProperties(appearance) : { fonts: [], restrictions: [], lineCap: kind === 'ink' ? 1 : 0, lineJoin: kind === 'ink' ? 1 : 0, miterLimit: 10, hasText: false, graphicsStates: [] };
  const restrictions = [...properties.restrictions], ap = get(dict, 'AP');
  if (ap instanceof PDFDict && get(ap, 'N') instanceof PDFDict) restrictions.push('Selected normal AP state is preserved without regeneration.');
  if (ap instanceof PDFDict && (has(ap, 'R') || has(ap, 'D'))) restrictions.push('Rollover/down AP states are preserved without regeneration.');
  if (has(dict, 'DS')) restrictions.push('Native default rich style is preserved without regeneration.');
  if ((number(get(dict, 'Rotate')) ?? 0) !== 0) restrictions.push('Native annotation rotation is preserved without regeneration.');
  if (appearance instanceof PDFStream) {
    const matrix = numbers(get(appearance.dict, 'Matrix')) ?? [1, 0, 0, 1, 0, 0];
    if (!identity(matrix)) restrictions.push('Native AP Matrix is preserved without regeneration.');
    const bbox = numbers(get(appearance.dict, 'BBox')), expected = [0, 0, rect[2] - rect[0], rect[3] - rect[1]];
    if (!bbox || bbox.length !== 4 || bbox.some((value, index) => Math.abs(value - expected[index]) > 0.05)) restrictions.push('Native AP BBox scaling or origin is preserved.');
    const resources = get(appearance.dict, 'Resources'), opacity = number(get(dict, 'CA')) ?? 1;
    const states = resources instanceof PDFDict ? get(resources, 'ExtGState') : undefined;
    for (const key of properties.graphicsStates ?? []) {
      const state = states instanceof PDFDict ? get(states, key) : undefined;
      if (!(state instanceof PDFDict)) { restrictions.push('Native AP graphics state cannot be resolved.'); continue; }
      for (const alpha of ['CA', 'ca']) if (has(state, alpha)) {
        const value = number(get(state, alpha));
        if (value === undefined || !Number.isFinite(value)) restrictions.push('Native AP has an invalid opacity.');
        else if (Math.abs(value - opacity) > 0.00001) restrictions.push('Native AP opacity differs from the canonical annotation value.');
      }
      if (state.keys().some((key) => has(state, key.decodeText()) && !['Type', 'CA', 'ca', 'BM'].includes(key.decodeText()))) restrictions.push('Native AP has additional graphics-state semantics.');
      if (has(state, 'SMask') && get(state, 'SMask') !== name('None')) restrictions.push('Native AP uses a soft mask.');
      const blend = text(get(state, 'BM'));
      if (blend && !['Normal', ...(kind === 'highlight' ? ['Multiply'] : [])].includes(blend)) restrictions.push('Native AP has a custom blend mode.');
    }
  }
  const border = get(dict, 'Border');
  if (!(get(dict, 'BS') instanceof PDFDict) && border instanceof PDFArray && (number(border.lookup(0)) || number(border.lookup(1)))) restrictions.push('Legacy rounded border radii are preserved.');
  if (kind !== 'freeText' && kind !== 'note' && properties.hasText) restrictions.push('Custom text inside a shape AP is preserved.');
  if (!['freeText', 'square', 'circle'].includes(kind) && has(dict, 'RD')) restrictions.push('Native shape rectangle differences are preserved without regeneration.');
  return { properties, restrictions: [...new Set(restrictions)] };
}
