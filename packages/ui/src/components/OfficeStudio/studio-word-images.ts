import type { StudioWordImageLayout } from './studio-types';

export const WORD_IMAGE_WRAPS = [
  'square',
  'tight',
  'through',
  'topBottom',
  'front',
  'behind',
] as const;
export const WORD_IMAGE_HORIZONTAL_BASES = [
  'character',
  'column',
  'insideMargin',
  'leftMargin',
  'margin',
  'outsideMargin',
  'page',
  'rightMargin',
] as const;
export const WORD_IMAGE_VERTICAL_BASES = [
  'bottomMargin',
  'insideMargin',
  'line',
  'margin',
  'outsideMargin',
  'page',
  'paragraph',
  'topMargin',
] as const;
export const WORD_IMAGE_HORIZONTAL_ALIGN = [
  'left',
  'center',
  'right',
  'inside',
  'outside',
] as const;
export const WORD_IMAGE_VERTICAL_ALIGN = ['top', 'center', 'bottom', 'inside', 'outside'] as const;
export const WORD_IMAGE_WRAP_SIDES = ['bothSides', 'left', 'right', 'largest'] as const;
export const WORD_IMAGE_RECTANGLE: [number, number][] = [
  [0, 0],
  [0, 21600],
  [21600, 21600],
  [21600, 0],
  [0, 0],
];

const plain = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const numeric = (value: unknown, min: number, max: number) =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;

/** All floating properties are validated before a transaction or a native file is written. */
export function wordImageLayoutIssue(value: unknown): string | undefined {
  if (value == null) return;
  const issue = '图片布局无效，请检查环绕、位置、间距、锚点及层级。';
  if (!plain(value)) return issue;
  const keys = [
    'wrap',
    'horizontal',
    'vertical',
    'wrapSide',
    'distance',
    'polygon',
    'allowOverlap',
    'lockAnchor',
    'layoutInCell',
    'zIndex',
  ];
  if (Object.keys(value).some((key) => !keys.includes(key))) return issue;
  if (!WORD_IMAGE_WRAPS.includes(value.wrap as StudioWordImageLayout['wrap'])) return issue;
  for (const axis of ['horizontal', 'vertical'] as const) {
    const position = value[axis];
    const bases: readonly string[] =
      axis === 'horizontal' ? WORD_IMAGE_HORIZONTAL_BASES : WORD_IMAGE_VERTICAL_BASES;
    const aligns: readonly string[] =
      axis === 'horizontal' ? WORD_IMAGE_HORIZONTAL_ALIGN : WORD_IMAGE_VERTICAL_ALIGN;
    if (
      !plain(position) ||
      Object.keys(position).some((key) => !['relative', 'offset', 'align'].includes(key)) ||
      !bases.includes(String(position.relative))
    )
      return issue;
    if (
      (position.offset !== undefined && position.align !== undefined) ||
      (position.offset === undefined && position.align === undefined)
    )
      return issue;
    if (position.offset !== undefined && !numeric(position.offset, -10000, 10000)) return issue;
    if (position.align !== undefined && !aligns.includes(String(position.align))) return issue;
  }
  if (
    value.wrapSide !== undefined &&
    !WORD_IMAGE_WRAP_SIDES.includes(value.wrapSide as (typeof WORD_IMAGE_WRAP_SIDES)[number])
  )
    return issue;
  if (
    value.distance !== undefined &&
    (!plain(value.distance) ||
      Object.entries(value.distance).some(
        ([side, amount]) =>
          !['top', 'right', 'bottom', 'left'].includes(side) || !numeric(amount, 0, 1000)
      ))
  )
    return issue;
  if (value.polygon !== undefined) {
    if (
      !['tight', 'through'].includes(String(value.wrap)) ||
      !Array.isArray(value.polygon) ||
      value.polygon.length < 4 ||
      value.polygon.length > 200 ||
      value.polygon.some(
        (point) =>
          !Array.isArray(point) ||
          point.length !== 2 ||
          point.some((n) => !numeric(n, -216000, 216000) || !Number.isInteger(n))
      )
    )
      return issue;
    const first = value.polygon[0] as number[];
    const last = value.polygon[value.polygon.length - 1] as number[];
    if (first[0] !== last[0] || first[1] !== last[1]) return issue;
  }
  for (const key of ['allowOverlap', 'lockAnchor', 'layoutInCell'])
    if (value[key] !== undefined && typeof value[key] !== 'boolean') return issue;
  if (
    value.zIndex !== undefined &&
    (!numeric(value.zIndex, 0, 4294967295) || !Number.isInteger(value.zIndex))
  )
    return issue;
}

export function wordImageLayout(value: unknown): StudioWordImageLayout | undefined {
  const issue = wordImageLayoutIssue(value);
  if (issue) throw new Error(issue);
  return value == null ? undefined : (value as StudioWordImageLayout);
}
