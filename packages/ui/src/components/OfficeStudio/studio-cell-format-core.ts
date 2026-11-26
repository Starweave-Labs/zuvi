import type { SheetTextFormat } from './studio-sheet-text-properties';

export const SHEET_TEXT_AUTHORING_INDENT_MAX = 250;

export function sheetTextFormatError(format: SheetTextFormat): 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 {
  if (
    format.align !== undefined &&
    ![
      'general',
      'left',
      'center',
      'right',
      'fill',
      'justify',
      'distributed',
      'centerContinuous',
    ].includes(format.align)
  ) {
    return 1;
  }
  if (
    format.verticalAlign !== undefined &&
    !['top', 'middle', 'bottom', 'justify', 'distributed'].includes(format.verticalAlign)
  ) {
    return 2;
  }
  if (
    format.indent !== undefined &&
    (!Number.isInteger(format.indent) ||
      format.indent < 0 ||
      format.indent > SHEET_TEXT_AUTHORING_INDENT_MAX)
  ) {
    return 3;
  }
  if (
    format.textRotation !== undefined &&
    format.textRotation !== 'vertical' &&
    (!Number.isInteger(format.textRotation) ||
      format.textRotation < -90 ||
      format.textRotation > 90)
  ) {
    return 4;
  }
  for (const key of ['wrap', 'shrinkToFit', 'bold', 'italic'] as const) {
    if (format[key] !== undefined && typeof format[key] !== 'boolean') {
      return 5;
    }
  }
  if (
    format.fontSize !== undefined &&
    (!Number.isFinite(format.fontSize) || format.fontSize < 1 || format.fontSize > 409)
  ) {
    return 6;
  }
  if (
    format.fontFamily !== undefined &&
    (typeof format.fontFamily !== 'string' ||
      !format.fontFamily.trim() ||
      format.fontFamily.length > 255 ||
      // eslint-disable-next-line no-control-regex -- Font names must be valid XML text.
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f\p{Cs}\ufffe\uffff]/u.test(format.fontFamily))
  ) {
    return 7;
  }
  return 0;
}

export const studioBorderSides = ['top', 'bottom', 'left', 'right'] as const;
export const studioBorderStyles = [
  'thin',
  'medium',
  'thick',
  'double',
  'dotted',
  'dashed',
  'hair',
  'dashDot',
  'dashDotDot',
  'mediumDashed',
  'mediumDashDot',
  'mediumDashDotDot',
  'slantDashDot',
] as const;


export function studioCellBorderError(borders: unknown): 0 | 1 | 2 {
  if (borders === undefined) return 0;
  if (!borders || typeof borders !== 'object' || Array.isArray(borders)) return 1;
  for (const [side, value] of Object.entries(borders) as [string, unknown][]) {
    if (!studioBorderSides.includes(side as (typeof studioBorderSides)[number]) ||
      !value || typeof value !== 'object' || Array.isArray(value)) return 2;
    const border = value as Record<string, unknown>;
    if (!studioBorderStyles.includes(border.style as (typeof studioBorderStyles)[number]) ||
      Object.keys(border).some((name) => !['style', 'color'].includes(name)) ||
      (border.color !== undefined && (typeof border.color !== 'string' || !/^#[\da-f]{6}$/i.test(border.color)))) return 2;
  }
  return 0;
}

export function studioCellStyleValid(cell: { [Key in keyof SheetTextFormat]?: unknown } & { borders?: unknown }): boolean {
  return sheetTextFormatError(cell as SheetTextFormat) === 0 && studioCellBorderError(cell.borders) === 0;
}
