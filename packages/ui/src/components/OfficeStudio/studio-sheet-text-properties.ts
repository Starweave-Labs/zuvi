import { sheetTextFormatError } from './studio-cell-format-core';
export { SHEET_TEXT_AUTHORING_INDENT_MAX } from './studio-cell-format-core';

/**
 * Pure format contract for Excel alignment and display adaptation.
 * Native imports retain valid combinations; interactive setters can request
 * the pinned ONLYOFFICE alignment/indent/rotation cleanup policy explicitly.
 */
export type SheetTextHorizontal =
  'general' | 'left' | 'center' | 'right' | 'fill' | 'justify' | 'distributed' | 'centerContinuous';
export type SheetTextVertical = 'top' | 'middle' | 'bottom' | 'justify' | 'distributed';
export type SheetTextRotation = number | 'vertical';
export type SheetTextScalar = string | number | boolean;
export type SheetTextDirection = 'ltr' | 'rtl';

export interface SheetTextFormat {
  align?: SheetTextHorizontal;
  verticalAlign?: SheetTextVertical;
  indent?: number;
  textRotation?: SheetTextRotation;
  wrap?: boolean;
  shrinkToFit?: boolean;
  fontFamily?: string;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
}

export type SheetTextFormatPatch = {
  [Key in keyof SheetTextFormat]?: SheetTextFormat[Key] | null;
};
export type SheetTextInteractionField = 'align' | 'textRotation' | 'indent';
export const SHEET_TEXT_FORMAT_KEYS = [
  'align',
  'verticalAlign',
  'indent',
  'textRotation',
  'wrap',
  'shrinkToFit',
  'fontFamily',
  'fontSize',
  'bold',
  'italic',
] as const;

/** A defined native mode map defaults unlisted rows to auto, including cached heights. */
export function sheetRowHeightMode(
  sheet: {
    rowHeights?: Readonly<Record<string, number>>;
    rowHeightModes?: Readonly<Record<string, 'auto' | 'fixed'>>;
  },
  row: number
): 'auto' | 'fixed' {
  if (!Number.isInteger(row) || row < 1 || row > 10000) throw new Error('Invalid row index.');
  return (
    sheet.rowHeightModes?.[String(row)] ??
    (sheet.rowHeightModes === undefined && sheet.rowHeights?.[String(row)] !== undefined
      ? 'fixed'
      : 'auto')
  );
}

/** This cap is our authoring policy; the pinned SDK only proved indent >= 0. */
const textFormatMessages = [
  '',
  '水平对齐方式无效。',
  '垂直对齐方式无效。',
  '缩进须为 0 至 250 之间的整数。',
  '文字旋转须为 -90 至 90 之间的整数，或使用竖排。',
  '自动换行、缩小字体、粗体和斜体属性须为布尔值。',
  '字号须为 1 至 409 磅之间的数值。',
  '字体名称须为 1 至 255 个字符，并使用有效的 XML 文本。'
] as const;

export function sheetTextFormatIssue(format: SheetTextFormat): string | undefined {
  const error = sheetTextFormatError(format);
  return error ? textFormatMessages[error] : undefined;
}

export function sheetDefaultTextFormat(defaultFont?: {
  family: string;
  sizePt: number;
  bold: boolean;
  italic: boolean;
}): Required<SheetTextFormat> {
  if (
    defaultFont !== undefined &&
    (!defaultFont ||
      typeof defaultFont.family !== 'string' ||
      typeof defaultFont.sizePt !== 'number' ||
      typeof defaultFont.bold !== 'boolean' ||
      typeof defaultFont.italic !== 'boolean')
  ) {
    throw new Error('工作簿默认字体上下文无效。');
  }
  const result: Required<SheetTextFormat> = {
    align: 'general',
    verticalAlign: 'bottom',
    indent: 0,
    textRotation: 0,
    wrap: false,
    shrinkToFit: false,
    fontFamily: defaultFont?.family ?? 'Calibri',
    fontSize: defaultFont?.sizePt ?? 11,
    bold: defaultFont?.bold ?? false,
    italic: defaultFont?.italic ?? false,
  };
  const issue = sheetTextFormatIssue(result);
  if (issue) throw new Error(issue);
  return result;
}

/** undefined leaves a field untouched; null writes its explicit clearing default. */
export function sheetApplyTextFormatPatch<T extends SheetTextFormat>(
  previous: T,
  patch: SheetTextFormatPatch,
  lastChanged?: SheetTextInteractionField,
  defaultFont?: Parameters<typeof sheetDefaultTextFormat>[0]
): T {
  const candidate = { ...previous };
  const defaults = sheetDefaultTextFormat(defaultFont);
  for (const key of Object.keys(patch) as Array<keyof SheetTextFormat>) {
    if (!(SHEET_TEXT_FORMAT_KEYS as readonly string[]).includes(key)) {
      throw new Error('Non-format field in text patch: ' + key);
    }
    if (patch[key] === undefined) continue;
    Object.assign(candidate, { [key]: patch[key] === null ? defaults[key] : patch[key] });
  }
  // Import/native mode has no lastChanged and never normalizes away source identity.
  if (
    lastChanged === 'align' &&
    candidate.textRotation !== 'vertical' &&
    !['left', 'right'].includes(candidate.align ?? 'general')
  )
    candidate.indent = 0;
  if (
    lastChanged === 'textRotation' &&
    candidate.textRotation !== 'vertical' &&
    (candidate.textRotation ?? 0) !== 0
  )
    candidate.indent = 0;
  if (
    lastChanged === 'indent' &&
    (candidate.indent ?? 0) > 0 &&
    candidate.textRotation !== 'vertical'
  ) {
    candidate.textRotation = 0;
    if (!['left', 'right'].includes(candidate.align ?? 'general')) candidate.align = 'left';
  }
  const issue = sheetTextFormatIssue(candidate);
  if (issue) throw new Error(issue);
  return candidate;
}

export function sheetTextFormatUpdatePlan(
  addresses: readonly string[],
  cells: Readonly<Record<string, SheetTextFormat>>,
  patch: SheetTextFormatPatch,
  options: {
    lastChanged?: SheetTextInteractionField;
    canFormat?: (address: string) => boolean;
    defaultFont?: Parameters<typeof sheetDefaultTextFormat>[0];
  } = {}
): Readonly<Record<string, Partial<SheetTextFormat>>> {
  const targets = [...new Set(addresses)];
  if (targets.length > 10000) throw new Error('Text format batch exceeds 10000 cells.');
  // Caller supplies the addresses expanded by the real studioFormattingSelection.
  for (const address of targets) {
    const parsed = /^([A-Z]{1,3})([1-9]\d*)$/.exec(address);
    const column =
      parsed?.[1].split('').reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0) ?? 0;
    if (
      !parsed ||
      column > 256 ||
      Number(parsed[2]) > 10000 ||
      options.canFormat?.(address) === false
    ) {
      throw new Error('Text format batch rejected at ' + address + '; no updates committed.');
    }
  }
  const updates: Record<string, Partial<SheetTextFormat>> = {};
  for (const address of targets) {
    const previous = cells[address] ?? {};
    const candidate = sheetApplyTextFormatPatch(
      previous,
      patch,
      options.lastChanged,
      options.defaultFont
    );
    const changed: Partial<SheetTextFormat> = {};
    for (const key of SHEET_TEXT_FORMAT_KEYS) {
      if (candidate[key] !== previous[key]) Object.assign(changed, { [key]: candidate[key] });
    }
    if (Object.keys(changed).length) updates[address] = changed;
  }
  return updates;
}

type FormatToken = { kind: 'code' | 'literal' | 'directive'; raw: string };
const condition = /^(<=|>=|<>|=|<|>)([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)$/i;

/**
 * Small classification companion to the real studio-number-format.ts scanner.
 * Formatting itself is injected from the real implementation, never recreated.
 * Migration should export a shared selected-section helper from that module.
 */
function formatSections(code: string): FormatToken[][] {
  const result: FormatToken[][] = [[]];
  for (let index = 0; index < code.length;) {
    const start = index;
    const char = code[index];
    if (char === ';') {
      result.push([]);
      index++;
      continue;
    }
    let kind: FormatToken['kind'] = 'code';
    if (char === '"') {
      kind = 'literal';
      index++;
      while (index < code.length && code[index] !== '"') index++;
      if (index >= code.length) throw new Error('Unclosed number-format literal.');
      index++;
    } else if (char === '\\' || char === '_' || char === '*') {
      kind = 'literal';
      if (index + 1 >= code.length) throw new Error('Incomplete number-format escape.');
      index += 1 + String.fromCodePoint(code.codePointAt(index + 1)!).length;
    } else if (char === '[') {
      kind = 'directive';
      index = code.indexOf(']', index + 1);
      if (index < 0) throw new Error('Unclosed number-format directive.');
      index++;
    } else {
      index += String.fromCodePoint(code.codePointAt(index)!).length;
    }
    result[result.length - 1].push({ kind, raw: code.slice(start, index) });
  }
  if (result.length > 4) throw new Error('Number format has more than four sections.');
  return result;
}

function conditionMatches(token: FormatToken | undefined, value: number): boolean {
  if (!token) return false;
  const matched = condition.exec(token.raw.slice(1, -1));
  if (!matched) return false;
  const limit = Number(matched[2]);
  switch (matched[1]) {
    case '=':
      return value === limit;
    case '<>':
      return value !== limit;
    case '>':
      return value > limit;
    case '<':
      return value < limit;
    case '>=':
      return value >= limit;
    default:
      return value <= limit;
  }
}

export function sheetEffectiveTextNumberFormat(code: string | undefined, value: number): boolean {
  if (!code || !Number.isFinite(value)) return false;
  let parts: FormatToken[][];
  try {
    parts = formatSections(code);
  } catch {
    // Imported unsupported formats already display through studioDisplayCell's
    // fallback. A malformed format is not evidence of a numeric text format.
    return false;
  }
  const containsAt = (part: FormatToken[]) =>
    part.some((token) => token.kind === 'code' && token.raw === '@');
  // The real renderer routes a single text section's numeric value through General;
  // the native text-format alignment is still left. Quoted/escaped @ is not text.
  if (
    parts.length === 1 &&
    containsAt(parts[0]) &&
    parts[0].every((token) => token.kind !== 'code' || token.raw === '@')
  )
    return true;
  let numericCount = parts.length;
  if (numericCount < 4 && containsAt(parts[parts.length - 1])) numericCount--;
  if (!numericCount) return false;
  const conditionAt = (index: number) =>
    parts[index]?.find(
      (token) => token.kind === 'directive' && condition.test(token.raw.slice(1, -1))
    );
  const first = conditionAt(0),
    second = conditionAt(1);
  let chosen: FormatToken[];
  if (first || second) {
    chosen = conditionMatches(first, value)
      ? parts[0]
      : conditionMatches(second, value)
        ? parts[1]
        : (parts[first && second ? 2 : 1] ?? []);
  } else {
    chosen =
      parts[value < 0 && numericCount >= 2 ? 1 : value === 0 && numericCount >= 3 ? 2 : 0] ?? [];
  }
  return containsAt(chosen);
}

export function sheetFirstStrongDirection(
  text: string,
  fallback: SheetTextDirection = 'ltr'
): SheetTextDirection {
  for (const character of text) {
    if (!/\p{Letter}/u.test(character)) continue;
    return /[\p{Script=Arabic}\p{Script=Hebrew}]/u.test(character) ? 'rtl' : 'ltr';
  }
  return fallback;
}

export function sheetGeneralAlignment(
  value: SheetTextScalar | undefined,
  options: { error?: string; numberFormat?: string; direction?: SheetTextDirection } = {}
): 'left' | 'center' | 'right' {
  if (options.error || typeof value === 'boolean') return 'center';
  if (typeof value === 'number') {
    return sheetEffectiveTextNumberFormat(options.numberFormat, value) ? 'left' : 'right';
  }
  if (typeof value === 'string') {
    return (options.direction ?? sheetFirstStrongDirection(value)) === 'rtl' ? 'right' : 'left';
  }
  return 'left';
}

/**
 * Native literal errors use unquoted error-code inputs in the existing codec.
 * Quoted strings and explicit text stay text even when their display is "#…".
 * Formula errors come only from the calculation error map.
 */
export function sheetCellError(
  cell: { input: string; valueType?: 'number' | 'boolean' | 'text' } | undefined,
  calculatedError?: string
): string | undefined {
  if (calculatedError) return calculatedError;
  if (
    !cell ||
    cell.valueType === 'text' ||
    cell.input.startsWith("'") ||
    cell.input.startsWith('=')
  )
    return undefined;
  return ['#DIV/0!', '#N/A', '#NAME?', '#NULL!', '#NUM!', '#REF!', '#VALUE!'].includes(cell.input)
    ? cell.input
    : undefined;
}

function nativeBoolean(value: string | undefined, field: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (value === '1' || value === 'true') return true;
  if (value === '0' || value === 'false') return false;
  throw new Error('Invalid native Boolean: ' + field);
}

/** Alignment-only conversion: fonts, values, formulas and other attrs stay outside. */
export function sheetTextFormatFromNative(raw: Readonly<Record<string, string>>): SheetTextFormat {
  const result: SheetTextFormat = {};
  if (raw.horizontal !== undefined) result.align = raw.horizontal as SheetTextHorizontal;
  if (raw.vertical !== undefined) {
    result.verticalAlign = (
      raw.vertical === 'center' ? 'middle' : raw.vertical
    ) as SheetTextVertical;
  }
  if (raw.indent !== undefined) {
    if (!/^(?:0|[1-9]\d*)$/.test(raw.indent)) throw new Error('Invalid native indent.');
    result.indent = Number(raw.indent);
  }
  if (raw.textRotation !== undefined) {
    if (!/^(?:0|[1-9]\d*)$/.test(raw.textRotation)) throw new Error('Invalid native rotation.');
    const rotation = Number(raw.textRotation);
    if (rotation !== 255 && rotation > 180) throw new Error('Invalid native rotation.');
    result.textRotation = rotation === 255 ? 'vertical' : rotation > 90 ? 90 - rotation : rotation;
  }
  const wrap = nativeBoolean(raw.wrapText, 'wrapText');
  const shrink = nativeBoolean(raw.shrinkToFit, 'shrinkToFit');
  if (wrap !== undefined) result.wrap = wrap;
  if (shrink !== undefined) result.shrinkToFit = shrink;
  const issue = sheetTextFormatIssue(result);
  if (issue) throw new Error(issue);
  return result;
}

/** null means delete a raw attr; absence means do not change the target attr. */
export function sheetTextFormatToNativePatch(
  format: SheetTextFormat
): Record<string, string | null> {
  const issue = sheetTextFormatIssue(format);
  if (issue) throw new Error(issue);
  const result: Record<string, string | null> = {};
  if (format.align !== undefined) {
    result.horizontal = format.align === 'general' ? null : format.align;
  }
  if (format.verticalAlign !== undefined) {
    result.vertical = format.verticalAlign === 'middle' ? 'center' : format.verticalAlign;
  }
  if (format.indent !== undefined) result.indent = String(format.indent);
  if (format.textRotation !== undefined) {
    result.textRotation = String(
      format.textRotation === 'vertical'
        ? 255
        : format.textRotation < 0
          ? 90 - format.textRotation
          : format.textRotation
    );
  }
  if (format.wrap !== undefined) result.wrapText = format.wrap ? '1' : '0';
  if (format.shrinkToFit !== undefined) result.shrinkToFit = format.shrinkToFit ? '1' : '0';
  return result;
}

export function sheetRowStateFromNative(raw: Readonly<Record<string, string>>): {
  mode: 'auto' | 'fixed';
  heightPt?: number;
  hidden: boolean;
} {
  const fixed = nativeBoolean(raw.customHeight, 'customHeight') ?? false;
  const hidden = nativeBoolean(raw.hidden, 'hidden') ?? false;
  let height: number | undefined;
  if (raw.ht !== undefined) {
    if (!/^[+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(raw.ht)) {
      throw new Error('Invalid native row height.');
    }
    height = Number(raw.ht);
    if (!Number.isFinite(height) || height < 0 || height > 409.5) {
      throw new Error('Native row height outside 0 to 409.5 points.');
    }
  }
  return {
    mode: fixed ? 'fixed' : 'auto',
    ...(height !== undefined && height > 0 ? { heightPt: height } : {}),
    hidden: hidden || height === 0,
  };
}
