import type { ChartProps, ChartScatterSeries, ChartSeries, ChartSlice } from '@zuvi/react';
import { getChartForm, type ChartFormId } from './chart-fixtures';

export const MAX_JSON_CHARS = 60_000;
const MAX_ITEMS = 256;
const MAX_SERIES = 8;
const MAX_DEPTH = 6;
const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const COLOR_TOKEN = /^var\(--zuvi-(?:chart-series-[1-8]|color-(?:primary|success|info|warning|danger))\)$/;
export type ChartInputResult =
  | { ok: true; config: ChartProps; count: number }
  | { ok: false; error: string };

function fail(message: string): never { throw new Error(message); }
function checkTree(value: unknown, path = '$', depth = 0): void {
  if (depth > MAX_DEPTH) fail(`${path}：数据嵌套超过 ${MAX_DEPTH} 层。`);
  if (typeof value === 'number' && !Number.isFinite(value)) fail(`${path}：不接受非有限数字。`);
  if (value === null || typeof value !== 'object') {
    if (!['string', 'number', 'boolean', 'object'].includes(typeof value)) fail(`${path}：仅接受 JSON 值，不接受函数。`);
    return;
  }
  if (Array.isArray(value)) {
    if (value.length > MAX_ITEMS) fail(`${path}：数组最多 ${MAX_ITEMS} 项。`);
    value.forEach((item, index) => checkTree(item, `${path}[${index}]`, depth + 1));
    return;
  }
  if (Object.getPrototypeOf(value) !== Object.prototype) fail(`${path}：仅接受普通 JSON 对象。`);
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) fail(`${path}：禁止原型相关字段 ${key}。`);
    if (key.length > 80) fail(`${path}：字段名过长。`);
    checkTree(child, `${path}.${key}`, depth + 1);
  }
}
function record(value: unknown, keys: readonly string[], path: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) fail(`${path}：需要对象。`);
  const result = value as Record<string, unknown>;
  const unexpected = Object.keys(result).find((key) => !keys.includes(key));
  if (unexpected) fail(`${path}：不支持字段 ${unexpected}；请按当前形式的数据结构编辑。`);
  return result;
}
function array(value: unknown, path: string, maximum = MAX_ITEMS): unknown[] {
  if (!Array.isArray(value)) fail(`${path}：需要数组。`);
  if (value.length > maximum) fail(`${path}：最多 ${maximum} 项。`);
  return value;
}
function text(value: unknown, path: string): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 128) fail(`${path}：需要 1–128 字符的非空文字。`);
  return value;
}
function number(value: unknown, path: string, nonnegative = false): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > 1e12) fail(`${path}：需要有限数字，绝对值不超过 10¹²；不转换数字字符串。`);
  if (nonnegative && value < 0) fail(`${path}：需要非负数字。`);
  return value;
}
function unique(id: string, ids: Set<string>, path: string): void {
  if (ids.has(id)) fail(`${path}：id “${id}” 重复。`);
  ids.add(id);
}
function color(value: unknown, path: string): { color?: string } {
  if (value === undefined) return {};
  if (typeof value !== 'string' || !COLOR_TOKEN.test(value)) fail(`${path}：颜色仅接受图表系列或语义颜色令牌；不接受 URL 或任意 CSS。`);
  return { color: value };
}
function domain(value: unknown, path: string, nonnegative = false): readonly [number, number] {
  const values = array(value, path, 2);
  if (values.length !== 2) fail(`${path}：需要 [最小值, 最大值]。`);
  const min = number(values[0], `${path}[0]`, nonnegative);
  const max = number(values[1], `${path}[1]`, nonnegative);
  if (min >= max) fail(`${path}：最小值必须小于最大值。`);
  return [min, max];
}
function cartesian(root: Record<string, unknown>): { categories: string[]; series: ChartSeries[]; count: number } {
  const categories = array(root.categories, '$.categories').map((value, index) => text(value, `$.categories[${index}]`));
  const ids = new Set<string>();
  let count = 0;
  const series = array(root.series, '$.series', MAX_SERIES).map((value, index) => {
    const path = `$.series[${index}]`;
    const entry = record(value, ['id', 'name', 'values', 'color'], path);
    const id = text(entry.id, `${path}.id`);
    unique(id, ids, path);
    const values = array(entry.values, `${path}.values`).map((item, point) => item === null ? null : number(item, `${path}.values[${point}]`));
    if (values.length !== categories.length) fail(`${path}.values：长度必须与 categories（${categories.length}）一致。`);
    count += values.filter((item) => item !== null).length;
    return { id, name: text(entry.name, `${path}.name`), values, ...color(entry.color, `${path}.color`) };
  });
  if (count > MAX_ITEMS) fail(`$.series：此实验室最多展示 ${MAX_ITEMS} 个数据点。`);
  return { categories, series, count };
}
function scatter(root: Record<string, unknown>, bubble: boolean): { series: ChartScatterSeries[]; count: number } {
  const ids = new Set<string>();
  let count = 0;
  const series = array(root.series, '$.series', MAX_SERIES).map((value, index) => {
    const path = `$.series[${index}]`;
    const entry = record(value, ['id', 'name', 'points', 'color'], path);
    const id = text(entry.id, `${path}.id`);
    unique(id, ids, path);
    const pointIds = new Set<string>();
    const points = array(entry.points, `${path}.points`).map((item, point) => {
      const pointPath = `${path}.points[${point}]`;
      const datum = record(item, ['id', 'x', 'y', 'label', 'value'], pointPath);
      const pointId = text(datum.id, `${pointPath}.id`);
      unique(pointId, pointIds, pointPath);
      const magnitude = datum.value === undefined && !bubble ? {} : { value: number(datum.value, `${pointPath}.value`, true) };
      return {
        id: pointId,
        x: number(datum.x, `${pointPath}.x`),
        y: number(datum.y, `${pointPath}.y`),
        ...(datum.label === undefined ? {} : { label: text(datum.label, `${pointPath}.label`) }),
        ...magnitude,
      };
    });
    count += points.length;
    return { id, name: text(entry.name, `${path}.name`), points, ...color(entry.color, `${path}.color`) };
  });
  if (count > MAX_ITEMS) fail(`$.series：此实验室最多展示 ${MAX_ITEMS} 个散点。`);
  return { series, count };
}
function slices(root: Record<string, unknown>, signed = false): ChartSlice[] {
  const ids = new Set<string>();
  return array(root.data, '$.data').map((value, index) => {
    const path = `$.data[${index}]`;
    const entry = record(value, ['id', 'label', 'value', 'color'], path);
    const id = text(entry.id, `${path}.id`);
    unique(id, ids, path);
    return { id, label: text(entry.label, `${path}.label`), value: number(entry.value, `${path}.value`, !signed), ...color(entry.color, `${path}.color`) };
  });
}

/** Parse as untrusted data, validate the selected union branch, then create a fresh allow-listed config. */
export function parseChartInput(formId: ChartFormId, json: string): ChartInputResult {
  try {
    if (json.length > MAX_JSON_CHARS) fail(`JSON 最多 ${MAX_JSON_CHARS.toLocaleString('en-US')} 字符。`);
    const form = getChartForm(formId);
    if (!form) fail('未知图表形式。');
    let parsed: unknown;
    try { parsed = JSON.parse(json); } catch { fail('JSON 语法不正确：请使用双引号，移除注释、函数与尾随逗号。'); }
    checkTree(parsed);
    const config = form.config;
    switch (config.type) {
      case undefined:
      case 'line':
      case 'area':
      case 'bar':
      case 'radar':
      case 'sparkline': {
        const root = record(parsed, ['categories', 'series'], '$');
        const { categories, series, count } = cartesian(root);
        return { ok: true, config: { ...config, categories, series }, count };
      }
      case 'scatter': {
        const root = record(parsed, config.bubble ? ['series', 'bubbleDomain'] : ['series'], '$');
        const { series, count } = scatter(root, Boolean(config.bubble));
        const bubbleDomain = config.bubble && root.bubbleDomain !== undefined ? domain(root.bubbleDomain, '$.bubbleDomain', true) : undefined;
        return { ok: true, config: { ...config, series, bubbleDomain }, count };
      }
      case 'heatmap': {
        const root = record(parsed, ['data'], '$');
        const ids = new Set<string>();
        const coordinates = new Set<string>();
        const data = array(root.data, '$.data').map((value, index) => {
          const path = `$.data[${index}]`;
          const entry = record(value, ['id', 'row', 'col', 'value', 'color'], path);
          const id = text(entry.id, `${path}.id`);
          unique(id, ids, path);
          const row = text(entry.row, `${path}.row`);
          const col = text(entry.col, `${path}.col`);
          const coordinate = JSON.stringify([row, col]);
          if (coordinates.has(coordinate)) fail(`${path}：同一 row / col 只能有一个格值。`);
          coordinates.add(coordinate);
          return { id, row, col, value: number(entry.value, `${path}.value`), ...color(entry.color, `${path}.color`) };
        });
        return { ok: true, config: { ...config, data }, count: data.length };
      }
      case 'gauge': {
        const root = record(parsed, ['data', 'min', 'max'], '$');
        const data = slices(root);
        if (data.length !== 1) fail('$.data：仪表示例需要且仅需要一个切片。');
        const min = root.min === undefined ? 0 : number(root.min, '$.min');
        const max = root.max === undefined ? Math.max(100, data[0].value) : number(root.max, '$.max');
        if (min >= max) fail('仪表范围：min 必须小于 max。');
        if (data[0].value < min || data[0].value > max) fail('$.data[0].value：数值必须在仪表 min / max 范围内。');
        return { ok: true, config: { ...config, data, min, max }, count: 1 };
      }
      case 'waterfall': {
        const root = record(parsed, ['data'], '$');
        const data = slices(root, true);
        let total = 0;
        data.forEach((step, index) => { total = number(total + step.value, `$.data[${index}] 的累计值`); });
        return { ok: true, config: { ...config, data }, count: data.length };
      }
      case 'pie':
      case 'donut':
      case 'treemap':
      case 'funnel': {
        const root = record(parsed, ['data'], '$');
        const data = slices(root);
        if (config.type === 'funnel' && data.some((step, index) => index > 0 && step.value > data[index - 1].value)) fail('$.data：本例漏斗各阶段数量必须非递增，才能表达逐步筛选。');
        return { ok: true, config: { ...config, data }, count: data.length };
      }
    }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : '数据校验失败。原图表保持不变。' };
  }
}

export function chartInputHint(formId: ChartFormId): string {
  const type = getChartForm(formId)?.config.type;
  if (type === 'scatter') return formId === 'bubble'
    ? '{ series: [{ id, name, points: [{ id, x, y, value, label? }] }], bubbleDomain?: [min, max] }；value 非负，domain 递增。'
    : '{ series: [{ id, name, points: [{ id, x, y, label?, value? }] }] }；x / y 为有限数字。';
  if (type === 'heatmap') return '{ data: [{ id, row, col, value }] }；id 与 row / col 组合唯一，value 可为负值。';
  if (type === 'gauge') return '{ data: [{ id, label, value }], min?, max? }；一个切片，min < max，value 在范围内。';
  if (type === 'waterfall') return '{ data: [{ id, label, value }] }；value 是带符号的增减量，不是累计值。';
  if (type === 'pie' || type === 'donut' || type === 'treemap' || type === 'funnel') return `{ data: [{ id, label, value }] }；value 为非负有限数字${type === 'funnel' ? '，阶段数量非递增' : ''}。`;
  return '{ categories: [文字], series: [{ id, name, values: [数字或 null] }] }；values 与 categories 等长，null 是缺口。';
}
