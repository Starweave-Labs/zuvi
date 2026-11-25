export const WORD_SURFACE_SIDES = ['top', 'bottom', 'left', 'right', 'between', 'bar'] as const;
export type WordSurfaceSide = (typeof WORD_SURFACE_SIDES)[number];
export const WORD_SURFACE_LINES = [
  'nil',
  'none',
  'single',
  'double',
  'dotted',
  'dashed',
  'dotDash',
  'dotDotDash',
  'thick',
  'triple',
  'wave',
  'doubleWave',
  'dashSmallGap',
  'dashDotStroked',
  'inset',
  'outset',
] as const;
export type WordSurfaceLine = (typeof WORD_SURFACE_LINES)[number];
export const WORD_SHADING_PATTERNS = [
  'nil',
  'clear',
  'solid',
  'pct5',
  'pct10',
  'pct12',
  'pct15',
  'pct20',
  'pct25',
  'pct30',
  'pct35',
  'pct37',
  'pct40',
  'pct45',
  'pct50',
  'pct55',
  'pct60',
  'pct62',
  'pct65',
  'pct70',
  'pct75',
  'pct80',
  'pct85',
  'pct87',
  'pct90',
  'pct95',
  'horzStripe',
  'vertStripe',
  'reverseDiagStripe',
  'diagStripe',
  'horzCross',
  'diagCross',
  'thinHorzStripe',
  'thinVertStripe',
  'thinReverseDiagStripe',
  'thinDiagStripe',
  'thinHorzCross',
  'thinDiagCross',
] as const;
export interface StudioWordParagraphBorder {
  style: WordSurfaceLine;
  size?: number;
  color?: string;
  space?: number;
  shadow?: boolean;
  frame?: boolean;
}
export interface StudioWordParagraphShading {
  pattern: (typeof WORD_SHADING_PATTERNS)[number];
  fill?: string;
  color?: string;
}
export interface StudioWordParagraphSurface {
  borders?: Partial<Record<WordSurfaceSide, StudioWordParagraphBorder>>;
  shading?: StudioWordParagraphShading;
}
export interface WordSurfacePatch {
  borders?: Partial<Record<WordSurfaceSide, Partial<StudioWordParagraphBorder>>>;
  shading?: Partial<StudioWordParagraphShading>;
}
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const color = (value: unknown) =>
  value === 'auto' || (typeof value === 'string' && /^#[\da-f]{6}$/i.test(value));
export function wordSurface(value: unknown): StudioWordParagraphSurface {
  if (value == null) return {};
  if (!record(value) || Object.keys(value).some((key) => !['borders', 'shading'].includes(key)))
    throw new Error('段落边框/底纹格式无效。');
  const result: StudioWordParagraphSurface = {};
  if (value.borders !== undefined) {
    if (!record(value.borders)) throw new Error('段落边框无效。');
    result.borders = {};
    for (const [side, border] of Object.entries(value.borders)) {
      if (
        !WORD_SURFACE_SIDES.includes(side as WordSurfaceSide) ||
        !record(border) ||
        !WORD_SURFACE_LINES.includes(border.style as WordSurfaceLine) ||
        Object.keys(border).some(
          (key) => !['style', 'size', 'color', 'space', 'shadow', 'frame'].includes(key)
        )
      )
        throw new Error('段落边框线型或边位无效。');
      if (
        border.size !== undefined &&
        (typeof border.size !== 'number' ||
          !Number.isInteger(border.size * 8) ||
          border.size < 0.25 ||
          border.size > 12)
      )
        throw new Error('边框宽度须为 0.25–12pt，步长 0.125pt。');
      if (
        border.space !== undefined &&
        (typeof border.space !== 'number' ||
          !Number.isInteger(border.space) ||
          border.space < 0 ||
          border.space > 31)
      )
        throw new Error('边框距文字须为 0–31pt 的整数。');
      if (border.color !== undefined && !color(border.color))
        throw new Error('边框颜色须为 RGB 或 auto。');
      for (const key of ['shadow', 'frame'])
        if (border[key] !== undefined && typeof border[key] !== 'boolean')
          throw new Error('边框阴影/框架属性无效。');
      result.borders[side as WordSurfaceSide] = {
        ...border,
      } as unknown as StudioWordParagraphBorder;
    }
  }
  if (value.shading !== undefined) {
    const shading = value.shading;
    if (
      !record(shading) ||
      !WORD_SHADING_PATTERNS.includes(shading.pattern as StudioWordParagraphShading['pattern']) ||
      Object.keys(shading).some((key) => !['pattern', 'fill', 'color'].includes(key))
    )
      throw new Error('段落底纹图案无效。');
    if (
      (shading.fill !== undefined && !color(shading.fill)) ||
      (shading.color !== undefined && !color(shading.color))
    )
      throw new Error('底纹颜色须为 RGB 或 auto。');
    result.shading = { ...shading } as unknown as StudioWordParagraphShading;
  }
  return result;
}
export function wordMergeSurface(base: unknown, own: unknown): StudioWordParagraphSurface {
  const parent = wordSurface(base),
    direct = wordSurface(own);
  return {
    ...parent,
    ...direct,
    ...(parent.borders || direct.borders
      ? { borders: { ...parent.borders, ...direct.borders } }
      : {}),
  };
}
export function wordPatchSurface(
  own: unknown,
  effective: unknown,
  patch: WordSurfacePatch
): StudioWordParagraphSurface {
  const result = wordSurface(own),
    current = wordSurface(effective);
  if (patch.borders) {
    result.borders = { ...result.borders };
    for (const [side, values] of Object.entries(patch.borders))
      result.borders[side as WordSurfaceSide] = {
        style: 'nil',
        ...current.borders?.[side as WordSurfaceSide],
        ...values,
      };
  }
  if (patch.shading) result.shading = { pattern: 'clear', ...current.shading, ...patch.shading };
  return wordSurface(result);
}
export function wordClearSurface(): StudioWordParagraphSurface {
  return {
    borders: Object.fromEntries(WORD_SURFACE_SIDES.map((side) => [side, { style: 'nil' }])),
    shading: { pattern: 'nil' },
  };
}

export function wordSurfaceCss(value: unknown): Record<string, string> {
  const surface = wordSurface(value),
    styles: Record<string, string> = {};
  for (const side of ['top', 'bottom', 'left', 'right'] as const) {
    const border = surface.borders?.[side];
    if (!border) continue;
    const hidden = border.style === 'nil' || border.style === 'none';
    const line =
      border.style === 'double' || border.style === 'triple' || border.style === 'doubleWave'
        ? 'double'
        : border.style === 'dotted'
          ? 'dotted'
          : /dash/i.test(border.style)
            ? 'dashed'
            : border.style === 'inset' || border.style === 'outset'
              ? border.style
              : 'solid';
    styles[`border${side[0].toUpperCase()+side.slice(1)}`] = hidden
      ? 'none'
      : `${border.size ?? 0.5}pt ${line} ${border.color === 'auto' || !border.color ? 'currentColor' : border.color}`;
    styles[`padding${side[0].toUpperCase()+side.slice(1)}`] = hidden ? '0pt' : `${border.space ?? 0}pt`;
    if (border.shadow) styles.boxShadow = '2pt 2pt 0 currentColor';
  }
  const shading = surface.shading;
  if (shading) {
    const fill = shading.fill && shading.fill !== 'auto' ? shading.fill : 'transparent';
    const foreground = shading.color && shading.color !== 'auto' ? shading.color : 'currentColor';
    styles.backgroundColor =
      shading.pattern === 'nil' ? 'transparent' : shading.pattern === 'solid' ? foreground : fill;
    styles.backgroundImage = 'none';
    if (shading.pattern.startsWith('pct')) {
      const pct = Number(shading.pattern.slice(3));
      const radius=4*Math.sqrt(Math.min(pct,100-pct)/100/Math.PI);
      styles.backgroundImage=pct<=50?`radial-gradient(circle, ${foreground} ${radius}px, transparent ${radius}px)`:`radial-gradient(circle, transparent ${radius}px, ${foreground} ${radius}px)`;
      styles.backgroundSize='4px 4px';
    } else if (/Stripe|Cross/.test(shading.pattern)) {
      const thin = shading.pattern.startsWith('thin'),
        width = thin ? '1px' : '2px',
        gap = thin ? '5px' : '8px';
      const stripe = (angle: string) =>
        `repeating-linear-gradient(${angle}, ${foreground} 0 ${width}, transparent ${width} ${gap})`;
      const diagonal = /Diag|diag/.test(shading.pattern),
        angle = /reverseDiag|ReverseDiag/.test(shading.pattern)
          ? '-45deg'
          : diagonal
            ? '45deg'
            : /vert|Vert/.test(shading.pattern)
              ? '90deg'
              : '0deg';
      styles.backgroundImage = /Cross/.test(shading.pattern)
        ? `${stripe(angle)},${stripe(diagonal ? '-45deg' : '90deg')}`
        : stripe(angle);
    }
  }
  return styles;
}
