import type { StudioWordParagraphFormat } from './studio-types';

export type WordLineRule = 'auto' | 'exact' | 'atLeast';
export const WORD_PARAGRAPH_KEYS = [
  'textAlign',
  'indentLeft',
  'indentRight',
  'indentFirstLine',
  'spaceBefore',
  'spaceAfter',
  'lineHeight',
  'lineHeightRule',
  'lineHeightBasis',
] as const;
export const wordLineUnits = (rule: WordLineRule | 'points') => (rule === 'auto' ? 240 : 20);

export function wordParagraphNumber(
  value: unknown,
  key: string,
  rule: WordLineRule = 'auto'
): number | null {
  const input =
    typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim() : '';
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(input)) return null;
  const n = Number(input);
  const line = key === 'lineHeight';
  const min = line ? (rule === 'auto' ? 0.5 : 1) : key.startsWith('indent') ? -500 : 0;
  const max = line && rule === 'auto' ? 10 : 500;
  if (!Number.isFinite(n) || n < min || n > max) return null;
  if (line && rule === 'auto') return n;
  const units = n * 20;
  if (Math.abs(units - Math.round(units)) > 1e-6) return null;
  return Math.round(units) / 20;
}

export function wordParagraphFormatIssue(
  patch: Partial<StudioWordParagraphFormat>,
  base?: Partial<StudioWordParagraphFormat>
) {
  const value = {
    ...Object.fromEntries(Object.entries(base ?? {}).filter(([, input]) => input != null)),
    ...patch,
  } as Partial<StudioWordParagraphFormat>;
  const rule = value.lineHeightRule ?? 'auto';
  if (!['auto', 'exact', 'atLeast'].includes(rule)) return '行距类型无效。';
  for (const [key, input] of Object.entries(patch)) {
    if (!(WORD_PARAGRAPH_KEYS as readonly string[]).includes(key))
      return `不支持的段落属性：${key}。`;
    if (key === 'lineHeightRule') continue;
    if (key === 'lineHeightBasis') {
      if (!['auto', 'points'].includes(String(input))) return '行距单位基准无效。';
      continue;
    }
    if (key === 'textAlign') {
      if (!['left', 'center', 'right', 'justify'].includes(String(input))) return '段落对齐无效。';
    } else if (wordParagraphNumber(input, key, rule) === null)
      return `${key === 'lineHeight' ? '行距' : '段落缩进/间距'}的范围或精度无效。`;
  }
  if (
    value.lineHeight !== undefined &&
    wordParagraphNumber(value.lineHeight, 'lineHeight', rule) === null
  )
    return '行距的范围或精度无效。';
  return '';
}

export function wordParagraphLineCss(attrs: Record<string, unknown>): Record<string, string> {
  const rule = (attrs.lineHeightRule ?? 'auto') as WordLineRule;
  const value = wordParagraphNumber(attrs.lineHeight, 'lineHeight', rule);
  if (value === null || !['auto', 'exact', 'atLeast'].includes(rule)) return {};
  return rule === 'auto'
    ? { lineHeight: String(value) }
    : rule === 'exact'
      ? { lineHeight: `${value}pt` }
      : { lineHeight: `max(${value}pt, 1.2em)`, '--zuvi-word-min-line': `${value}pt` };
}
