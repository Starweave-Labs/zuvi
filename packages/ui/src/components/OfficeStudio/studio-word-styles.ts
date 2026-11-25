import type {
  StudioRichNode,
  StudioWordCharacterStyle,
  StudioWordParagraphFormat,
  StudioWordParagraphStyle,
} from './studio-types';
import { studioFontFamilyInput } from './studio-font-input';
import { wordMetricPoints } from './studio-word-metrics';
import { wordParagraphFormatIssue, wordLineUnits } from './studio-word-paragraph-format';
import {
  wordSurface,
  wordMergeSurface,
  type StudioWordParagraphSurface,
} from './studio-word-surface';
import { wordMergeTabStops, wordTabStops, type StudioWordTabStop } from './studio-word-tabs';

export const WORD_STYLE_LIMIT = 100;
export const WORD_BUILTIN_STYLES: StudioWordParagraphStyle[] = [
  { id: 'paragraph', name: '正文', headingLevel: 0 },
  {
    id: 'no-spacing',
    name: '无间距',
    headingLevel: 0,
    paragraph: { lineHeight: 1, spaceBefore: 0, spaceAfter: 0 },
  },
  ...([1, 2, 3, 4, 5, 6] as const).map((level, index) => ({
    id: `heading-${level}`,
    name: `标题 ${level}`,
    headingLevel: level,
    next: 'paragraph',
    run: { fontSize: [24, 20, 16, 14, 13, 12][index], bold: true },
    paragraph: {
      lineHeight: 1.35,
      spaceBefore: [24, 20, 16, 14, 13, 12][index],
      spaceAfter: [13.2, 11, 8.8, 7.7, 7.15, 6.6][index],
    },
  })),
];

export const WORD_BODY_RUN = {
  fontFamily: 'Noto Sans SC',
  fontSize: 12,
  letterSpacing: 0,
  baselineShift: 0,
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  color: '#1f2937',
  backgroundColor: null,
} satisfies Required<StudioWordCharacterStyle>;

const BODY_PARAGRAPH: Required<StudioWordParagraphFormat> = {
  textAlign: 'left',
  indentLeft: 0,
  indentRight: 0,
  indentFirstLine: 0,
  spaceBefore: 0,
  spaceAfter: 7.8,
  lineHeight: 1.75,
  lineHeightRule: 'auto',
  lineHeightBasis: 'auto',
};
const RUN_KEYS = Object.keys(WORD_BODY_RUN) as (keyof StudioWordCharacterStyle)[];
const PARAGRAPH_KEYS = Object.keys(BODY_PARAGRAPH) as (keyof StudioWordParagraphFormat)[];
const FLAGS = ['bold', 'italic', 'underline', 'strike'] as const;

export interface ResolvedStudioWordParagraphStyle {
  id: string;
  name: string;
  headingLevel: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  next: string;
  autoUpdate: boolean;
  run: Required<StudioWordCharacterStyle>;
  paragraph: Required<StudioWordParagraphFormat>;
  tabStops: StudioWordTabStop[];
  surface: StudioWordParagraphSurface;
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error(`${label}格式无效。`);
  return value as Record<string, unknown>;
}

function finite(value: unknown, label: string, min: number, max: number) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)
    throw new Error(`${label}必须在 ${min}–${max} 之间。`);
}

/** Validate the entire graph before changing a document or writing its native file. */
export function validateStudioWordParagraphStyles(value: unknown): StudioWordParagraphStyle[] {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > WORD_STYLE_LIMIT)
    throw new Error(`一个文档最多支持 ${WORD_STYLE_LIMIT} 个自定义段落样式。`);
  const ids = new Set(WORD_BUILTIN_STYLES.map((style) => style.id));
  const names = new Set(WORD_BUILTIN_STYLES.map((style) => style.name.toLocaleLowerCase()));
  const styles: StudioWordParagraphStyle[] = [];
  for (const entry of value) {
    const style = record(entry, '段落样式');
    for (const key of Object.keys(style))
      if (
        ![
          'id',
          'name',
          'basedOn',
          'next',
          'headingLevel',
          'autoUpdate',
          'run',
          'paragraph',
          'tabStops',
          'surface',
        ].includes(key)
      )
        throw new Error(`段落样式包含不支持的 ${key} 属性。`);
    if (
      typeof style.id !== 'string' ||
      !/^[a-zA-Z][\w-]{0,95}$/.test(style.id) ||
      ids.has(style.id)
    )
      throw new Error('段落样式标识无效或重复。');
    ids.add(style.id);
    if (
      typeof style.name !== 'string' ||
      !style.name.trim() ||
      style.name.length > 80 ||
      Array.from(style.name).some((char) => {
        const point = char.codePointAt(0)!;
        return (
          point < 32 ||
          point === 127 ||
          (point >= 0xd800 && point <= 0xdfff) ||
          point === 0xfffe ||
          point === 0xffff
        );
      }) ||
      names.has(style.name.trim().toLocaleLowerCase())
    )
      throw new Error('样式名称必须唯一，并且在 1–80 个字符以内。');
    names.add(style.name.trim().toLocaleLowerCase());
    for (const key of ['basedOn', 'next'] as const)
      if (style[key] !== undefined && (typeof style[key] !== 'string' || !style[key]))
        throw new Error('样式的继承或后续样式无效。');
    if (style.headingLevel !== undefined) {
      finite(style.headingLevel, '标题级别', 0, 6);
      if (!Number.isInteger(style.headingLevel)) throw new Error('标题级别必须为整数。');
    }
    if (style.autoUpdate !== undefined && typeof style.autoUpdate !== 'boolean')
      throw new Error('样式自动更新标记无效。');
    if (style.tabStops !== undefined) wordTabStops(style.tabStops);
    if (style.surface !== undefined) wordSurface(style.surface);
    if (style.run !== undefined) {
      const run = record(style.run, '样式文字属性');
      for (const [key, input] of Object.entries(run)) {
        if (!RUN_KEYS.includes(key as keyof StudioWordCharacterStyle))
          throw new Error(`样式文字包含不支持的 ${key} 属性。`);
        if (FLAGS.includes(key as (typeof FLAGS)[number])) {
          if (typeof input !== 'boolean') throw new Error('样式文字格式标记无效。');
        } else if (key === 'fontSize') finite(input, '样式字号', 1, 409);
        else if (key === 'letterSpacing' || key === 'baselineShift') {
          if (typeof input !== 'number' || wordMetricPoints(input, key) === null)
            throw new Error('样式字符间距/位置度量无效。');
        } else if (key === 'fontFamily') {
          if (typeof input !== 'string' || studioFontFamilyInput(input) !== input)
            throw new Error('样式字体名称无效。');
        } else if (
          !(key === 'backgroundColor' && input === null) &&
          (typeof input !== 'string' || !/^#[\da-f]{6}$/i.test(input))
        )
          throw new Error('样式颜色需要六位十六进制颜色值。');
      }
    }
    if (style.paragraph !== undefined) {
      const paragraph = record(style.paragraph, '样式段落属性');
      for (const [key, input] of Object.entries(paragraph)) {
        if (!PARAGRAPH_KEYS.includes(key as keyof StudioWordParagraphFormat))
          throw new Error(`样式段落包含不支持的 ${key} 属性。`);
        if (key === 'textAlign') {
          if (!['left', 'center', 'right', 'justify'].includes(String(input)))
            throw new Error('样式对齐方式无效。');
        } else if (key === 'lineHeight') finite(input, '样式行距', 0.000001, 500);
        else if (key === 'lineHeightRule') {
          if (!['auto', 'exact', 'atLeast'].includes(String(input)))
            throw new Error('样式行距类型无效。');
        } else if (key === 'lineHeightBasis') {
          if (!['auto', 'points'].includes(String(input))) throw new Error('样式行距单位无效。');
        } else if (key.startsWith('space')) finite(input, '样式段落间距', 0, 500);
        else finite(input, '样式缩进', -500, 500);
      }
    }
    styles.push({ ...(entry as StudioWordParagraphStyle), name: style.name.trim() });
  }
  for (const style of styles) {
    if (style.basedOn && !ids.has(style.basedOn)) throw new Error('样式继承的基础样式不存在。');
    if (style.next && !ids.has(style.next)) throw new Error('后续段落样式不存在。');
    const resolved = resolveStudioWordParagraphStyle(styles, style.id);
    const issue = wordParagraphFormatIssue(resolved.paragraph);
    if (issue) throw new Error(issue);
  }
  return styles;
}

export function getStudioWordParagraphStyles(root: StudioRichNode): StudioWordParagraphStyle[] {
  return validateStudioWordParagraphStyles(root.attrs?.paragraphStyles);
}

export function resolveStudioWordParagraphStyle(
  styles: readonly StudioWordParagraphStyle[],
  id: string,
  path: string[] = []
): ResolvedStudioWordParagraphStyle {
  if (path.includes(id) || path.length > WORD_STYLE_LIMIT)
    throw new Error('段落样式存在循环继承。');
  const source = [...WORD_BUILTIN_STYLES, ...styles].find((style) => style.id === id);
  if (!source) throw new Error(`段落样式 ${id} 不存在。`);
  const base = source.basedOn
    ? resolveStudioWordParagraphStyle(styles, source.basedOn, [...path, id])
    : {
        headingLevel: 0 as const,
        run: WORD_BODY_RUN,
        paragraph: BODY_PARAGRAPH,
        tabStops: [],
        surface: {},
      };
  const paragraph = { ...base.paragraph, ...source.paragraph };
  const rawLine =
    source.paragraph?.lineHeight === undefined
      ? base.paragraph.lineHeight * wordLineUnits(base.paragraph.lineHeightRule)
      : source.paragraph.lineHeight *
        wordLineUnits(
          source.paragraph.lineHeightRule ?? source.paragraph.lineHeightBasis ?? 'auto'
        );
  paragraph.lineHeight = rawLine / wordLineUnits(paragraph.lineHeightRule);
  paragraph.lineHeightBasis = paragraph.lineHeightRule === 'auto' ? 'auto' : 'points';
  return {
    id: source.id,
    name: source.name,
    headingLevel: source.headingLevel ?? base.headingLevel,
    next: source.next ?? source.id,
    autoUpdate: source.autoUpdate ?? false,
    run: { ...base.run, ...source.run },
    paragraph,
    tabStops: wordMergeTabStops(base.tabStops, source.tabStops),
    surface: wordMergeSurface(base.surface, source.surface),
  };
}

export function studioWordNodeStyleId(node: StudioRichNode) {
  if (typeof node.attrs?.paragraphStyle === 'string') return node.attrs.paragraphStyle;
  if (node.type === 'heading') return `heading-${node.attrs?.level || 1}`;
  return node.attrs?.lineHeight === 1 && node.attrs.spaceBefore === 0 && node.attrs.spaceAfter === 0
    ? 'no-spacing'
    : 'paragraph';
}

/** Linked paragraphs materialize inherited formatting; differences remain direct overrides. */
export function studioWordNodeRun(
  node: StudioRichNode,
  inherited: Required<StudioWordCharacterStyle> = WORD_BODY_RUN
): Required<StudioWordCharacterStyle> {
  const attrs = node.marks?.find((mark) => mark.type === 'textStyle')?.attrs || {};
  const rawSize = /^(\d+(?:\.\d+)?)(pt|px)$/.exec(String(attrs.fontSize || ''));
  return {
    ...inherited,
    ...Object.fromEntries(
      FLAGS.map((flag) => [
        flag,
        node.marks?.some((mark) => mark.type === flag) ? true : inherited[flag],
      ])
    ),
    fontFamily:
      typeof attrs.fontFamily === 'string' && attrs.fontFamily
        ? attrs.fontFamily
        : inherited.fontFamily,
    fontSize: rawSize ? Number(rawSize[1]) * (rawSize[2] === 'px' ? 0.75 : 1) : inherited.fontSize,
    letterSpacing:
      wordMetricPoints(attrs.letterSpacing, 'letterSpacing') ?? inherited.letterSpacing,
    baselineShift:
      wordMetricPoints(attrs.baselineShift, 'baselineShift') ?? inherited.baselineShift,
    color:
      typeof attrs.color === 'string' && attrs.color ? attrs.color.toLowerCase() : inherited.color,
    backgroundColor:
      typeof attrs.backgroundColor === 'string' && attrs.backgroundColor
        ? attrs.backgroundColor.toLowerCase()
        : attrs.backgroundColor === null
          ? null
          : inherited.backgroundColor,
  };
}

function runEqual(a: unknown, b: unknown) {
  return typeof a === 'string' && typeof b === 'string'
    ? a.toLowerCase() === b.toLowerCase()
    : a === b;
}

export function studioWordRunMarks(
  source: StudioRichNode,
  appearance: Required<StudioWordCharacterStyle>
): NonNullable<StudioRichNode['marks']> {
  const result = (source.marks || []).filter(
    (mark) => ![...FLAGS, 'textStyle'].includes(mark.type as (typeof FLAGS)[number])
  );
  for (const flag of FLAGS) if (appearance[flag]) result.push({ type: flag });
  const old = source.marks?.find((mark) => mark.type === 'textStyle')?.attrs || {};
  const attrs: Record<string, unknown> = {
    ...old,
    fontFamily: appearance.fontFamily,
    fontSize: `${appearance.fontSize}pt`,
    letterSpacing: `${appearance.letterSpacing}pt`,
    baselineShift: `${appearance.baselineShift}pt`,
    color: appearance.color,
    backgroundColor: appearance.backgroundColor,
  };
  result.push({ type: 'textStyle', attrs });
  return result;
}

export function applyStudioWordStyleToNode(
  node: StudioRichNode,
  style: ResolvedStudioWordParagraphStyle,
  previous?: ResolvedStudioWordParagraphStyle
): StudioRichNode {
  const attrs: Record<string, unknown> = {
    ...node.attrs,
    paragraphStyle: style.id,
    paragraphStyleMaterialized: true,
    paragraphStyleSnapshot: {
      run: { ...style.run },
      paragraph: { ...style.paragraph },
      tabStops: style.tabStops,
      surface: style.surface,
      headingLevel: style.headingLevel,
    },
  };
  delete attrs.paragraphStyleFallback;
  const direct = Array.isArray(node.attrs?.paragraphStyleDirectAttrs)
    ? node.attrs.paragraphStyleDirectAttrs
    : undefined;
  const owns = (key: keyof StudioWordParagraphFormat, current: unknown) =>
    direct ? direct.includes(key) : previous && current !== previous.paragraph[key];
  for (const key of PARAGRAPH_KEYS) {
    if (['lineHeight', 'lineHeightRule', 'lineHeightBasis'].includes(key)) continue;
    const current =
      node.attrs?.[key] ??
      (node.attrs?.paragraphStyleMaterialized === true
        ? BODY_PARAGRAPH[key]
        : (previous?.paragraph[key] ?? BODY_PARAGRAPH[key]));
    if (!owns(key, current)) attrs[key] = style.paragraph[key];
  }
  const oldRule = (node.attrs?.lineHeightRule ??
    previous?.paragraph.lineHeightRule ??
    'auto') as Required<StudioWordParagraphFormat>['lineHeightRule'];
  const oldHeight = Number(
    node.attrs?.lineHeight ?? previous?.paragraph.lineHeight ?? BODY_PARAGRAPH.lineHeight
  );
  const rule = owns('lineHeightRule', oldRule) ? oldRule : style.paragraph.lineHeightRule;
  const raw = owns('lineHeight', oldHeight)
    ? oldHeight * wordLineUnits(oldRule)
    : style.paragraph.lineHeight * wordLineUnits(style.paragraph.lineHeightRule);
  attrs.lineHeightRule = rule;
  attrs.lineHeight = raw / wordLineUnits(rule);
  attrs.lineHeightBasis = rule === 'auto' ? 'auto' : 'points';
  const ownHeading = node.type === 'heading' ? Number(node.attrs?.level || 1) : 0;
  const level = !previous || ownHeading === previous.headingLevel ? style.headingLevel : ownHeading;
  if (level) attrs.level = level;
  else delete attrs.level;
  return {
    ...node,
    type: level ? 'heading' : 'paragraph',
    attrs,
    ...(node.content
      ? {
          content: node.content.map((child) => {
            if (!['text', 'pageNumber', 'image'].includes(child.type)) return child;
            const current = studioWordNodeRun(
              child,
              node.attrs?.paragraphStyleMaterialized === true
                ? WORD_BODY_RUN
                : (previous?.run ?? WORD_BODY_RUN)
            );
            const target = { ...current };
            for (const key of RUN_KEYS)
              if (!previous || runEqual(current[key], previous.run[key]))
                Object.assign(target, { [key]: style.run[key] });
            return { ...child, marks: studioWordRunMarks(child, target) };
          }),
        }
      : {}),
  };
}

/** Reconcile all linked paragraphs, including those in tables or header/footer roots. */
export function reconcileStudioWordStyles(
  root: StudioRichNode,
  previous: readonly StudioWordParagraphStyle[],
  styles: readonly StudioWordParagraphStyle[]
): StudioRichNode {
  const walk = (node: StudioRichNode): StudioRichNode => {
    const fallback = node.attrs?.paragraphStyleFallback;
    const restoring = typeof fallback === 'string' && styles.some((style) => style.id === fallback);
    const id = restoring ? fallback : node.attrs?.paragraphStyle;
    let result = node;
    if (['paragraph', 'heading'].includes(node.type) && typeof id === 'string') {
      const known = [...WORD_BUILTIN_STYLES, ...previous].some((style) => style.id === id);
      const old = resolveStudioWordParagraphStyle(previous, restoring || !known ? 'paragraph' : id);
      const exists = [...WORD_BUILTIN_STYLES, ...styles].some((style) => style.id === id);
      result = applyStudioWordStyleToNode(
        node,
        resolveStudioWordParagraphStyle(styles, exists ? id : 'paragraph'),
        old
      );
      if (!exists) result.attrs = { ...result.attrs, paragraphStyleFallback: id };
      else if (!restoring && typeof fallback === 'string')
        result.attrs = { ...result.attrs, paragraphStyleFallback: fallback };
    }
    if (result.content) result = { ...result, content: result.content.map(walk) };
    return result;
  };
  return walk(materializeStudioWordStyles(root, previous));
}

/** A host may provide only a style link; materialize inherited values before editing or encoding. */
export function materializeStudioWordStyles(
  root: StudioRichNode,
  styles: readonly StudioWordParagraphStyle[]
): StudioRichNode {
  const walk = (node: StudioRichNode): StudioRichNode => {
    let result = node;
    const id = node.attrs?.paragraphStyle;
    if (['paragraph', 'heading'].includes(node.type) && typeof id === 'string') {
      const style = resolveStudioWordParagraphStyle(styles, id);
      if (node.attrs?.paragraphStyleMaterialized !== true) {
        const target = applyStudioWordStyleToNode(node, style);
        for (const key of PARAGRAPH_KEYS)
          if (node.attrs?.[key] != null) target.attrs![key] = node.attrs[key];
        target.content = node.content?.map((child) =>
          ['text', 'image', 'pageNumber'].includes(child.type)
            ? { ...child, marks: studioWordRunMarks(child, studioWordNodeRun(child, style.run)) }
            : child
        );
        result = target;
      } else {
        const snapshot = node.attrs?.paragraphStyleSnapshot;
        if (snapshot != null) {
          const source = record(snapshot, '已应用样式');
          record(source.run, '已应用样式文字');
          record(source.paragraph, '已应用样式段落');
          finite(source.headingLevel, '已应用样式大纲级别', 0, 6);
          const checked = validateStudioWordParagraphStyles([
            {
              id: 'snapshot',
              name: '已应用样式',
              run: source.run,
              paragraph: source.paragraph,
              tabStops: source.tabStops,
              surface: source.surface,
              headingLevel: source.headingLevel,
            },
          ]);
          const previous = resolveStudioWordParagraphStyle(checked, 'snapshot');
          if (
            JSON.stringify({
              run: previous.run,
              paragraph: previous.paragraph,
              tabStops: previous.tabStops,
              surface: previous.surface,
              headingLevel: previous.headingLevel,
            }) !==
            JSON.stringify({
              run: style.run,
              paragraph: style.paragraph,
              tabStops: style.tabStops,
              surface: style.surface,
              headingLevel: style.headingLevel,
            })
          )
            result = applyStudioWordStyleToNode(node, style, previous);
        } else
          result = {
            ...node,
            attrs: {
              ...node.attrs,
              paragraphStyleSnapshot: {
                tabStops: style.tabStops,
                surface: style.surface,
                run: { ...style.run },
                paragraph: { ...style.paragraph },
                headingLevel: style.headingLevel,
              },
            },
          };
      }
    }
    if (result.content) result = { ...result, content: result.content.map(walk) };
    return result;
  };
  return walk(root);
}

export function removeStudioWordStyle(styles: StudioWordParagraphStyle[], id: string) {
  const removed = styles.find((style) => style.id === id);
  if (!removed) throw new Error('无法删除内置样式。');
  return validateStudioWordParagraphStyles(
    styles
      .filter((style) => style.id !== id)
      .map((style) => ({
        ...style,
        ...(style.basedOn === id
          ? {
              basedOn: removed.basedOn || 'paragraph',
              headingLevel: style.headingLevel ?? removed.headingLevel,
              run: { ...removed.run, ...style.run },
              paragraph: { ...removed.paragraph, ...style.paragraph },
            }
          : {}),
        ...(style.next === id ? { next: 'paragraph' } : {}),
      }))
  );
}
