import type { ChartProps } from '@zuvi/react';

export const SAMPLE_NOTICE = '教学示例 · 非实时';
export const SAMPLE_TEXT = 'Data tells a story. Design makes it clear.';
const round = (value: number) => Math.round(value * 100) / 100;

/** Flat, reproducible teaching data. No business telemetry or invented operational metrics. */
export const TREND_ROWS = Array.from({ length: 7 }, (_, index) => ({
  category: `${index * 30}°`,
  sin: round(10 * Math.sin((index * Math.PI) / 6)),
  cos: round(10 * Math.cos((index * Math.PI) / 6)),
}));
export const TREND_CATEGORIES = TREND_ROWS.map((row) => row.category);
export const TREND_SERIES = [
  { id: 'sin', name: '正弦 × 10', values: TREND_ROWS.map((row) => row.sin) },
  { id: 'cos', name: '余弦 × 10', values: TREND_ROWS.map((row) => row.cos) },
];

function countText(text: string) {
  const vowels = (text.match(/[aeiou]/gi) ?? []).length;
  const letters = (text.match(/[a-z]/gi) ?? []).length;
  const spaces = (text.match(/\s/g) ?? []).length;
  return {
    vowels,
    consonants: letters - vowels,
    spaces,
    punctuation: text.length - letters - spaces,
  };
}
const textCounts = countText(SAMPLE_TEXT);
export const COMPOSITION_ROWS = [
  { id: 'vowels', label: '元音', value: textCounts.vowels },
  { id: 'consonants', label: '辅音', value: textCounts.consonants },
  { id: 'spaces', label: '空格', value: textCounts.spaces },
  { id: 'punctuation', label: '标点', value: textCounts.punctuation },
];
export const TEXT_ROWS = [
  { category: '语句 A', text: 'Data tells a story.' },
  { category: '语句 B', text: 'Design makes it clear.' },
  { category: '语句 C', text: 'Charts reveal patterns.' },
].map((row) => ({ ...row, ...countText(row.text) }));
const textSeries = [
  { id: 'vowels', name: '元音', values: TEXT_ROWS.map((row) => row.vowels) },
  { id: 'consonants', name: '辅音', values: TEXT_ROWS.map((row) => row.consonants) },
  { id: 'spaces', name: '空格', values: TEXT_ROWS.map((row) => row.spaces) },
  { id: 'punctuation', name: '标点', values: TEXT_ROWS.map((row) => row.punctuation) },
];

export const SCATTER_ROWS = ['square', 'circle'].flatMap((seriesId) =>
  Array.from({ length: 5 }, (_, index) => {
    const x = index + 1;
    return {
      seriesId,
      id: `${seriesId}-${x}`,
      label: `${seriesId === 'square' ? '正方形边长' : '圆半径'} ${x}`,
      x,
      y: round((seriesId === 'square' ? 1 : Math.PI) * x * x),
      value: round((seriesId === 'square' ? 4 : 2 * Math.PI) * x),
    };
  })
);
const scatterSeries = [
  { id: 'square', name: '正方形' },
  { id: 'circle', name: '圆' },
].map((series) => ({
  ...series,
  points: SCATTER_ROWS.filter((row) => row.seriesId === series.id).map(
    ({ id, label, x, y, value }) => ({ id, label, x, y, value })
  ),
}));
export const HEATMAP_ROWS = Array.from({ length: 6 }, (_, row) =>
  Array.from({ length: 6 }, (_, col) => ({
    id: `dice-${row + 1}-${col + 1}`,
    row: String(row + 1),
    col: String(col + 1),
    value: row + col + 2,
  }))
).flat();
export const RADAR_ROWS = ['A', 'E', 'I', 'O', 'U'].map((category) => ({
  category,
  visualization: [...'visualization'].filter((letter) => letter.toUpperCase() === category).length,
  documentation: [...'documentation'].filter((letter) => letter.toUpperCase() === category).length,
}));
export const FUNNEL_ROWS = [
  { id: 'all', label: '全部字符', value: SAMPLE_TEXT.length },
  { id: 'non-space', label: '去除空格', value: SAMPLE_TEXT.length - textCounts.spaces },
  { id: 'letters', label: '仅保留字母', value: textCounts.vowels + textCounts.consonants },
  { id: 'vowels', label: '仅保留元音', value: textCounts.vowels },
];
export const WATERFALL_ROWS = [
  { id: 'all', label: '原文', value: SAMPLE_TEXT.length },
  { id: 'spaces', label: '移除空格', value: -textCounts.spaces },
  { id: 'punctuation', label: '移除标点', value: -textCounts.punctuation },
  { id: 'consonants', label: '移除辅音', value: -textCounts.consonants },
];

export const CHART_FAMILIES = [
  { id: 'trend', label: '趋势', question: '随顺序如何变化？' },
  { id: 'compare', label: '比较', question: '不同类别谁更多？' },
  { id: 'composition', label: '组成', question: '整体由什么构成？' },
  { id: 'distribution', label: '分布', question: '数值集中在哪里？' },
  { id: 'relation', label: '关系', question: '两个变量如何相伴？' },
  { id: 'multidim', label: '多维', question: '多个维度如何对照？' },
  { id: 'process', label: '流程', question: '每一步改变了什么？' },
] as const;
export type ChartFamilyId = (typeof CHART_FAMILIES)[number]['id'];
export type ChartFormId =
  | 'line'
  | 'area'
  | 'stacked-area'
  | 'bar'
  | 'stacked-bar'
  | 'horizontal-bar'
  | 'pie'
  | 'donut'
  | 'scatter'
  | 'bubble'
  | 'radar'
  | 'heatmap'
  | 'treemap'
  | 'funnel'
  | 'gauge'
  | 'waterfall'
  | 'sparkline';
export interface ChartForm {
  id: ChartFormId;
  label: string;
  family: ChartFamilyId;
  exampleTitle: string;
  description: string;
  source: string;
  config: ChartProps;
}

const textSource = `字符逐个统计，忽略字母大小写。原文：“${SAMPLE_TEXT}”`;
const trigSource = '由 y = 10 sin(θ) 与 y = 10 cos(θ) 计算；每 30° 取样，保留两位小数。';
const geometrySource = '由正方形与圆的面积、周长公式计算；π 取 Math.PI，保留两位小数。';
const fragmentsSource = `三条固定短句逐字符统计：${TEXT_ROWS.map((row) => `“${row.text}”`).join('、')}。`;
function defineForm(form: ChartForm): ChartForm {
  return {
    ...form,
    config: {
      ...form.config,
      title: `${form.exampleTitle}（示例）`,
      description: form.description,
      'aria-label': `${form.label} · ${form.exampleTitle}（示例）`,
    },
  };
}

/** 13 API discriminants, 17 named forms; variants are props, not extra type values. */
export const CHART_FORMS: readonly ChartForm[] = [
  defineForm({
    id: 'line',
    label: '折线图',
    family: 'trend',
    exampleTitle: '正弦与余弦',
    description: '沿角度观察两个函数的变化；负值与零点都保留。',
    source: trigSource,
    config: {
      type: 'line',
      categories: TREND_CATEGORIES,
      series: TREND_SERIES,
      xLabel: '角度',
      yLabel: '函数值',
    },
  }),
  defineForm({
    id: 'area',
    label: '面积图',
    family: 'trend',
    exampleTitle: '正弦的上半周期',
    description: '以零为基线填充面积，强调曲线与基线之间的变化。',
    source: trigSource,
    config: {
      type: 'area',
      categories: TREND_CATEGORIES,
      series: [TREND_SERIES[0]],
      xLabel: '角度',
      yLabel: '函数值',
    },
  }),
  defineForm({
    id: 'stacked-area',
    label: '堆叠面积图',
    family: 'trend',
    exampleTitle: '三条短句的字符组成',
    description: '累积字符数量，观察总量与组成；语句顺序不是时间。',
    source: fragmentsSource,
    config: {
      type: 'area',
      stack: true,
      categories: TEXT_ROWS.map((row) => row.category),
      series: textSeries,
      xLabel: '语句',
      yLabel: '字符数',
    },
  }),
  defineForm({
    id: 'bar',
    label: '柱状图',
    family: 'compare',
    exampleTitle: '原文的四类字符',
    description: '从共同零基线比较类别数量；计数单位是字符。',
    source: textSource,
    config: {
      type: 'bar',
      categories: COMPOSITION_ROWS.map((row) => row.label),
      series: [
        { id: 'characters', name: '字符数', values: COMPOSITION_ROWS.map((row) => row.value) },
      ],
      yLabel: '字符数',
    },
  }),
  defineForm({
    id: 'stacked-bar',
    label: '堆叠柱状图',
    family: 'composition',
    exampleTitle: '短句长度与组成',
    description: '每根柱的总高度等于原文长度，各色段对应字符类别。',
    source: fragmentsSource,
    config: {
      type: 'bar',
      stack: true,
      categories: TEXT_ROWS.map((row) => row.category),
      series: textSeries,
      yLabel: '字符数',
    },
  }),
  defineForm({
    id: 'horizontal-bar',
    label: '条形图',
    family: 'compare',
    exampleTitle: '横向比较字符数量',
    description: '长类别名称放在纵轴，以横向长度比较数量。',
    source: textSource,
    config: {
      type: 'bar',
      orientation: 'horizontal',
      categories: COMPOSITION_ROWS.map((row) => row.label),
      series: [
        { id: 'characters', name: '字符数', values: COMPOSITION_ROWS.map((row) => row.value) },
      ],
      xLabel: '字符数',
    },
  }),
  defineForm({
    id: 'pie',
    label: '饼图',
    family: 'composition',
    exampleTitle: '一段文字的组成',
    description: '以扇区表达部分与整体；同一字符只归入一类。',
    source: textSource,
    config: { type: 'pie', data: COMPOSITION_ROWS },
  }),
  defineForm({
    id: 'donut',
    label: '环形图',
    family: 'composition',
    exampleTitle: '字符组成的另一种视角',
    description: '与饼图复用相同切片；留白不代表额外的数据。',
    source: textSource,
    config: { type: 'donut', data: COMPOSITION_ROWS },
  }),
  defineForm({
    id: 'scatter',
    label: '散点图',
    family: 'relation',
    exampleTitle: '尺寸与面积',
    description: '横轴为边长或半径，纵轴为面积；曲线关系来自几何公式。',
    source: geometrySource,
    config: { type: 'scatter', series: scatterSeries, xLabel: '边长 / 半径', yLabel: '面积' },
  }),
  defineForm({
    id: 'bubble',
    label: '气泡图',
    family: 'relation',
    exampleTitle: '尺寸、面积与周长',
    description: '位置编码尺寸与面积，气泡面积编码周长，而不是气泡半径。',
    source: geometrySource,
    config: {
      type: 'scatter',
      bubble: true,
      bubbleDomain: [4, 32],
      series: scatterSeries,
      xLabel: '边长 / 半径',
      yLabel: '面积',
    },
  }),
  defineForm({
    id: 'radar',
    label: '雷达图',
    family: 'multidim',
    exampleTitle: '两个词的元音频次',
    description: '五个轴使用相同计数单位；不把多边形面积当作综合评分。',
    source: '分别统计 “visualization” 与 “documentation” 中 A / E / I / O / U 的出现次数。',
    config: {
      type: 'radar',
      categories: RADAR_ROWS.map((row) => row.category),
      series: [
        {
          id: 'visualization',
          name: 'visualization',
          values: RADAR_ROWS.map((row) => row.visualization),
        },
        {
          id: 'documentation',
          name: 'documentation',
          values: RADAR_ROWS.map((row) => row.documentation),
        },
      ],
    },
  }),
  defineForm({
    id: 'heatmap',
    label: '热力图',
    family: 'distribution',
    exampleTitle: '两枚骰子的点数和',
    description: '36 个格子覆盖全部有序组合；颜色表示点数和，不表示概率。',
    source: '枚举两枚六面骰子各 1–6 点的有序组合，格值为 A + B。',
    config: { type: 'heatmap', data: HEATMAP_ROWS, xLabel: '骰子 B', yLabel: '骰子 A' },
  }),
  defineForm({
    id: 'treemap',
    label: '矩形树图',
    family: 'composition',
    exampleTitle: '用面积阅读字符组成',
    description: '矩形面积与字符数量成比例；当前 API 使用扁平切片，不是层级树。',
    source: textSource,
    config: { type: 'treemap', data: COMPOSITION_ROWS },
  }),
  defineForm({
    id: 'funnel',
    label: '漏斗图',
    family: 'process',
    exampleTitle: '从原文筛选到元音',
    description: '每一步都是上一阶段的子集；这是文本筛选，不是转化率看板。',
    source: textSource,
    config: { type: 'funnel', data: FUNNEL_ROWS },
  }),
  defineForm({
    id: 'gauge',
    label: '仪表图',
    family: 'compare',
    exampleTitle: '字母占原文的比例',
    description: '0–100 的固定范围；数值是字母数除以全部字符数的百分比。',
    source: textSource,
    config: {
      type: 'gauge',
      min: 0,
      max: 100,
      data: [
        {
          id: 'letter-share',
          label: '字母占比（%）',
          value: round(((textCounts.vowels + textCounts.consonants) / SAMPLE_TEXT.length) * 100),
        },
      ],
    },
  }),
  defineForm({
    id: 'waterfall',
    label: '瀑布图',
    family: 'process',
    exampleTitle: '字符筛选的增减过程',
    description: '先加入原文，再依次移除空格、标点与辅音；末端累计值等于元音数。',
    source: textSource,
    config: { type: 'waterfall', data: WATERFALL_ROWS, yLabel: '字符数' },
  }),
  defineForm({
    id: 'sparkline',
    label: '迷你趋势图',
    family: 'trend',
    exampleTitle: '正弦函数速览',
    description: '在有限空间内表达变化方向；精确值仍应通过完整示例与数据表阅读。',
    source: trigSource,
    config: { type: 'sparkline', categories: TREND_CATEGORIES, series: [TREND_SERIES[0]] },
  }),
];

export function getChartForm(id: string): ChartForm | undefined {
  return CHART_FORMS.find((form) => form.id === id);
}

/** Only the selected discriminant's editable data. No callbacks, refs or executable configuration. */
export function getChartInput(form: ChartForm): Record<string, unknown> {
  const config = form.config;
  if (config.type === 'scatter') {
    return config.bubble
      ? { series: config.series, bubbleDomain: config.bubbleDomain }
      : { series: config.series };
  }
  if ('categories' in config && config.categories !== undefined) {
    return { categories: config.categories, series: config.series };
  }
  if (config.type === 'gauge') return { data: config.data, min: config.min, max: config.max };
  return { data: config.data };
}

type ExampleOptions = Pick<
  ChartProps,
  'height' | 'legend' | 'grid' | 'tooltip' | 'showDataTable' | 'animated' | 'csv' | 'style'
> & { theme?: 'light' | 'dark' };
export function chartExampleCode(
  form: ChartForm,
  config: ChartProps = form.config,
  options: ExampleOptions = {}
): string {
  const { style, theme, ...props } = options;
  const styleDeclaration = style
    ? `\nconst chartStyle = ${JSON.stringify(style, null, 2)} as CSSProperties;\n`
    : '';
  const plot = `<Chart {...props}${style ? ' style={chartStyle}' : ''} />`;
  return `import { Chart, type ChartProps } from '@zuvi/react';${style ? "\nimport type { CSSProperties } from 'react';" : ''}\n\n// ${SAMPLE_NOTICE} · ${form.label}\nconst props = ${JSON.stringify({ ...config, animated: false, ...props }, null, 2)} satisfies ChartProps;\n${styleDeclaration}\nexport default function Example() {\n  return (${theme ? `\n    <div data-theme="${theme}">\n      ${plot}\n    </div>\n  ` : `\n    ${plot}\n  `});\n}\n`;
}
