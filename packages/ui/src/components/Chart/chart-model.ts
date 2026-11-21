import type { ChartDatum, ChartProps, ChartScatterPoint, ChartType } from './chart-types';
import { resolveChartDomain, scaleChartValue } from './chart-scale';

/** Theme tokens are deliberately left unresolved; an explicit datum/series color wins. */
export const CHART_PALETTE = [
  'var(--zuvi-chart-series-1)',
  'var(--zuvi-chart-series-2)',
  'var(--zuvi-chart-series-3)',
  'var(--zuvi-chart-series-4)',
  'var(--zuvi-chart-series-5)',
  'var(--zuvi-chart-series-6)',
  'var(--zuvi-chart-series-7)',
  'var(--zuvi-chart-series-8)',
] as const;

export const CHART_TYPES: readonly ChartType[] = [
  'line',
  'area',
  'bar',
  'pie',
  'donut',
  'scatter',
  'radar',
  'heatmap',
  'treemap',
  'funnel',
  'gauge',
  'waterfall',
  'sparkline',
];

export type ChartDataInput = Pick<ChartProps, 'type' | 'categories' | 'series' | 'data'> & {
  min?: number;
  max?: number;
  stack?: boolean;
};

export interface ChartModelCell {
  id: string;
  row: string;
  col: string;
  value: number;
  color: string;
  explicitColor: boolean;
  index: number;
}

export interface ChartModelScatterPoint extends ChartScatterPoint {
  /** Original input index, including points skipped for invalid coordinates. */
  index: number;
}

export interface ChartModelSeries {
  id: string;
  name: string;
  color: string;
  index: number;
  values: (number | null)[];
  points: ChartModelScatterPoint[];
}

export interface ChartModelSlice {
  id: string;
  label: string;
  value: number;
  color: string;
  index: number;
  /** Original waterfall interval, retained when a step is hidden. */
  startValue?: number;
  endValue?: number;
}

export interface ChartModel {
  type: ChartType;
  categories: string[];
  series: ChartModelSeries[];
  slices: ChartModelSlice[];
  cells?: ChartModelCell[];
  rows?: string[];
  columns?: string[];
  gauge?: { min: number; max: number };
  /** Full source slot count and cumulative domain; visibility never reflows waterfall. */
  waterfall?: { slots: number; domain: readonly [number, number] };
  issues: string[];
  /**
   * Structural/type/name/id/alignment errors (including duplicates) are fatal for drawing.
   * Bad Cartesian numeric values are nonfatal null gaps; bad scatter coordinates are
   * nonfatal skipped points. Bad radial values are fatal, never a partial misleading pie.
   * Safe retained data remains available to the legend/table even when invalid is true.
   */
  invalid: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isName(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isId(value: unknown): value is string {
  if (!isName(value)) return false;
  // encodeURIComponent is the stable Cartesian/scatter ID convention. Reject malformed
  // UTF-16 rather than allowing an unpaired surrogate to throw during datum creation.
  try {
    encodeURIComponent(value);
    return true;
  } catch {
    return false;
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function defaultColor(index: number): string {
  return CHART_PALETTE[index % CHART_PALETTE.length];
}

/**
 * Normalize without coercing numbers, sorting, mutating input, or capping data.
 * Malformed entries are reported and excluded. Duplicate IDs retain the first
 * structurally valid entry; an invalid earlier entry does not reserve its ID.
 * Duplicate category labels are allowed: category identity is its original index.
 */
export function normalizeChartData(input: ChartDataInput): ChartModel {
  const model: ChartModel = {
    type: 'line',
    categories: [],
    series: [],
    slices: [],
    issues: [],
    invalid: false,
  };
  const issue = (message: string, fatal = true) => {
    model.issues.push(message);
    if (fatal) model.invalid = true;
  };

  if (!isRecord(input)) {
    issue('Chart data must be an object.');
    return model;
  }
  const source: Record<string, unknown> = input;
  const type = source.type ?? (source.type === undefined ? 'line' : null);
  if (!CHART_TYPES.includes(type as ChartType)) {
    issue('type must be a supported Chart type.');
    return model;
  }
  model.type = type as ChartType;

  const readColor = (value: unknown, index: number, path: string): string => {
    if (value === undefined) return defaultColor(index);
    if (isName(value)) return value;
    issue(`${path}.color must be a nonempty string when supplied.`);
    return defaultColor(index);
  };

  if (type === 'heatmap') {
    model.cells = [];
    model.rows = [];
    model.columns = [];
    if (source.categories !== undefined || source.series !== undefined)
      issue('Heatmap charts use cell data.');
    if (!Array.isArray(source.data)) {
      issue('data must be an array of heatmap cells.');
      return model;
    }
    const ids = new Set<string>();
    const locations = new Map<string, Set<string>>();
    const rowIds = new Set<string>();
    const columnIds = new Set<string>();
    for (let index = 0; index < source.data.length; index++) {
      const cell = source.data[index];
      if (!isRecord(cell) || !isId(cell.id) || !isName(cell.row) || !isName(cell.col)) {
        issue(`data[${index}] needs cell id, row and col.`);
        continue;
      }
      if (ids.has(cell.id) || locations.get(cell.row)?.has(cell.col)) {
        issue(`data[${index}] duplicates a cell ID or coordinate.`);
        continue;
      }
      if (!isFiniteNumber(cell.value)) {
        issue(`data[${index}].value must be finite.`);
        continue;
      }
      const color = readColor(cell.color, index, `data[${index}]`);
      ids.add(cell.id);
      const columns = locations.get(cell.row) ?? new Set<string>();
      columns.add(cell.col);
      locations.set(cell.row, columns);
      if (!rowIds.has(cell.row)) {
        rowIds.add(cell.row);
        model.rows.push(cell.row);
      }
      if (!columnIds.has(cell.col)) {
        columnIds.add(cell.col);
        model.columns.push(cell.col);
      }
      model.cells.push({
        id: cell.id,
        row: cell.row,
        col: cell.col,
        value: cell.value,
        color,
        explicitColor: cell.color !== undefined,
        index,
      });
    }
    return model;
  }

  if (
    type === 'pie' ||
    type === 'donut' ||
    type === 'treemap' ||
    type === 'funnel' ||
    type === 'gauge' ||
    type === 'waterfall'
  ) {
    if (source.categories !== undefined || source.series !== undefined) {
      issue('Radial charts use data, not categories or series.');
    }
    if (!Array.isArray(source.data)) {
      issue('data must be an array of slices.');
      return model;
    }
    const seen = new Set<string>();
    const retained = new Set<string>();
    for (let index = 0; index < source.data.length; index += 1) {
      const slice: unknown = source.data[index];
      const path = `data[${index}]`;
      if (!isRecord(slice)) {
        issue(`${path} must be a slice object.`);
        continue;
      }
      const validId = isId(slice.id);
      if (!validId) issue(`${path}.id must be a nonempty, well-formed string.`);
      if (validId) {
        if (seen.has(slice.id as string))
          issue(`${path}.id duplicates ${JSON.stringify(slice.id)}.`);
        seen.add(slice.id as string);
      }
      const validLabel = isName(slice.label);
      if (!validLabel) issue(`${path}.label must be a nonempty string.`);
      const validValue =
        isFiniteNumber(slice.value) &&
        (type === 'waterfall' || type === 'gauge' || slice.value >= 0);
      if (!validValue)
        issue(
          `${path}.value must be ${type === 'waterfall' || type === 'gauge' ? 'finite' : 'a finite, nonnegative number'}.`
        );
      const color =
        type === 'waterfall' && slice.color === undefined
          ? defaultColor((slice.value as number) < 0 ? 3 : 1)
          : readColor(slice.color, index, path);
      if (!validId || !validLabel || !validValue || retained.has(slice.id as string)) continue;
      if (slice.color !== undefined && !isName(slice.color)) continue;
      const id = slice.id as string;
      retained.add(id);
      model.slices.push({
        id,
        label: slice.label as string,
        value: slice.value as number,
        color,
        index,
      });
    }
    if (type === 'gauge') {
      const current = model.slices[0]?.value ?? 0;
      const minimum = source.min === undefined ? 0 : source.min;
      const maximum = source.max === undefined ? Math.max(100, current) : source.max;
      if (!isFiniteNumber(minimum) || !isFiniteNumber(maximum) || minimum >= maximum)
        issue('Gauge min and max must be finite and ascending.');
      else {
        model.gauge = { min: minimum, max: maximum };
        if (model.slices.length > 1) issue('Gauge data accepts a single value.');
        if (current < minimum || current > maximum) issue('Gauge value must stay inside min/max.');
      }
    }
    if (type === 'waterfall') {
      let total = 0;
      let minimum = 0;
      let maximum = 0;
      model.categories = model.slices.map((step) => step.label);
      for (const step of model.slices) {
        const next = total + step.value;
        if (!isFiniteNumber(next)) {
          issue('Waterfall cumulative values must stay finite.');
          break;
        }
        step.startValue = total;
        step.endValue = next;
        total = next;
        minimum = Math.min(minimum, total);
        maximum = Math.max(maximum, total);
      }
      model.waterfall = {
        slots: source.data.length,
        domain: resolveChartDomain([minimum, maximum], true),
      };
    }
    return model;
  }

  if (source.data !== undefined) issue('Cartesian and scatter charts use series, not data.');
  if (type === 'scatter') {
    if (source.categories !== undefined)
      issue('Scatter charts use numeric points, not categories.');
  } else if (!Array.isArray(source.categories)) {
    issue('categories must be an array of strings.');
  } else {
    for (let index = 0; index < source.categories.length; index += 1) {
      const category: unknown = source.categories[index];
      if (!isName(category)) issue(`categories[${index}] must be a nonempty string.`);
      // Preserve indices even on invalid input; no later category is shifted into a gap.
      model.categories.push(typeof category === 'string' ? category : '');
    }
  }

  if (type === 'radar' && model.categories.length < 3)
    issue('Radar charts need at least three axes.');
  if (!Array.isArray(source.series)) {
    issue('series must be an array.');
    return model;
  }
  const seen = new Set<string>();
  const retained = new Set<string>();
  for (let index = 0; index < source.series.length; index += 1) {
    const series: unknown = source.series[index];
    const path = `series[${index}]`;
    if (!isRecord(series)) {
      issue(`${path} must be a series object.`);
      continue;
    }
    const validId = isId(series.id);
    if (!validId) issue(`${path}.id must be a nonempty, well-formed string.`);
    if (validId) {
      if (seen.has(series.id as string))
        issue(`${path}.id duplicates ${JSON.stringify(series.id)}.`);
      seen.add(series.id as string);
    }
    const validName = isName(series.name);
    if (!validName) issue(`${path}.name must be a nonempty string.`);
    const color = readColor(series.color, index, path);
    const collection = type === 'scatter' ? series.points : series.values;
    if (!Array.isArray(collection)) {
      issue(`${path}.${type === 'scatter' ? 'points' : 'values'} must be an array.`);
      continue;
    }
    if (type !== 'scatter' && collection.length !== model.categories.length) {
      issue(
        `${path}.values length ${collection.length} must match categories length ${model.categories.length}.`
      );
      continue;
    }
    if (type === 'scatter' ? series.values !== undefined : series.points !== undefined) {
      issue(`${path} must not mix values and points.`);
      continue;
    }
    if (!validId || !validName || retained.has(series.id as string)) continue;
    if (series.color !== undefined && !isName(series.color)) continue;
    const id = series.id as string;
    const normalized: ChartModelSeries = {
      id,
      name: series.name as string,
      color,
      index,
      values: [],
      points: [],
    };
    retained.add(id);

    if (type !== 'scatter') {
      for (let valueIndex = 0; valueIndex < collection.length; valueIndex += 1) {
        const value: unknown = collection[valueIndex];
        if (type === 'radar' && (!isFiniteNumber(value) || value < 0)) {
          issue(`${path}.values[${valueIndex}] must be a nonnegative radar value.`);
          normalized.values.push(null);
        } else if (value === null || isFiniteNumber(value)) {
          normalized.values.push(value);
        } else {
          issue(`${path}.values[${valueIndex}] is not finite; retained as a null gap.`, false);
          normalized.values.push(null);
        }
      }
    } else {
      const seenPoints = new Set<string>();
      const retainedPoints = new Set<string>();
      for (let pointIndex = 0; pointIndex < collection.length; pointIndex += 1) {
        const point: unknown = collection[pointIndex];
        const pointPath = `${path}.points[${pointIndex}]`;
        if (!isRecord(point)) {
          issue(`${pointPath} must be a point object.`);
          continue;
        }
        const validPointId = isId(point.id);
        if (!validPointId) issue(`${pointPath}.id must be a nonempty, well-formed string.`);
        if (validPointId) {
          if (seenPoints.has(point.id as string)) {
            issue(`${pointPath}.id duplicates ${JSON.stringify(point.id)} within its series.`);
          }
          seenPoints.add(point.id as string);
        }
        const validLabel = point.label === undefined || isName(point.label);
        if (!validLabel) issue(`${pointPath}.label must be a nonempty string when supplied.`);
        const validCoordinates = isFiniteNumber(point.x) && isFiniteNumber(point.y);
        if (point.value !== undefined && (!isFiniteNumber(point.value) || point.value < 0))
          issue(`${pointPath}.value must be nonnegative and finite; magnitude omitted.`, false);
        if (!validCoordinates)
          issue(`${pointPath} has nonfinite coordinates; point skipped.`, false);
        if (
          !validPointId ||
          !validLabel ||
          !validCoordinates ||
          retainedPoints.has(point.id as string)
        ) {
          continue;
        }
        const pointId = point.id as string;
        retainedPoints.add(pointId);
        normalized.points.push({
          id: pointId,
          x: point.x as number,
          y: point.y as number,
          ...(point.label === undefined ? {} : { label: point.label as string }),
          ...(isFiniteNumber(point.value) && point.value >= 0 ? { value: point.value } : {}),
          index: pointIndex,
        });
      }
    }
    model.series.push(normalized);
  }
  if (source.stack === true && (type === 'bar' || type === 'area')) {
    const positive = new Map<number, number>();
    const negative = new Map<number, number>();
    for (const series of model.series)
      for (let index = 0; index < series.values.length; index++) {
        const value = series.values[index];
        if (value === null) continue;
        const group = value < 0 ? negative : positive;
        const total = (group.get(index) ?? 0) + value;
        if (!isFiniteNumber(total)) {
          issue('Stacked cumulative values must stay finite.');
          return model;
        }
        group.set(index, total);
      }
  }
  return model;
}

/** Raw series/slice IDs are toggle IDs, never encoded datum IDs. Colors/indices stay stable. */
export function deriveVisibleChartModel(
  model: ChartModel,
  hiddenIds: readonly string[] = []
): ChartModel {
  const hidden = new Set(hiddenIds);
  return {
    ...model,
    series: model.series.filter((series) => !hidden.has(series.id)),
    slices: model.slices.filter((slice) => !hidden.has(slice.id)),
    ...(model.cells ? { cells: model.cells.filter((cell) => !hidden.has(cell.id)) } : {}),
  };
}

/**
 * The canonical tooltip, table, keyboard-selection and mark data. Null gaps produce no
 * datum; zero slices do. Radial percentages are fractions of the supplied (visible) model.
 * Max scaling plus compensated summation avoids overflowing the raw radial total.
 */
export function getChartDatums(model: ChartModel): ChartDatum[] {
  const datums: ChartDatum[] = [];
  if (model.type === 'heatmap') {
    return (model.cells ?? []).map((cell) => ({
      id: `heatmap:${encodeURIComponent(cell.id)}`,
      type: model.type,
      seriesId: cell.id,
      seriesName: cell.row,
      index: cell.index,
      label: `${cell.row} · ${cell.col}`,
      value: cell.value,
      color: cell.color,
    }));
  }
  if (model.type === 'waterfall') {
    return model.slices.map((slice) => ({
      id: `waterfall:${encodeURIComponent(slice.id)}`,
      type: model.type,
      seriesId: slice.id,
      seriesName: slice.label,
      index: slice.index,
      label: slice.label,
      value: slice.value,
      color: slice.color,
    }));
  }
  if (
    model.type === 'pie' ||
    model.type === 'donut' ||
    model.type === 'treemap' ||
    model.type === 'funnel' ||
    model.type === 'gauge'
  ) {
    let maximum = 0;
    for (const slice of model.slices) {
      if (isFiniteNumber(slice.value) && slice.value > maximum) maximum = slice.value;
    }
    let scaledSum = 0;
    let compensation = 0;
    if (maximum > 0) {
      for (const slice of model.slices) {
        if (!isFiniteNumber(slice.value) || slice.value < 0) continue;
        const adjusted = slice.value / maximum - compensation;
        const next = scaledSum + adjusted;
        compensation = next - scaledSum - adjusted;
        scaledSum = next;
      }
    }
    for (const slice of model.slices) {
      if (!isFiniteNumber(slice.value) || (slice.value < 0 && model.type !== 'gauge')) continue;
      datums.push({
        id: slice.id,
        type: model.type,
        seriesId: slice.id,
        seriesName: slice.label,
        index: slice.index,
        label: slice.label,
        value: slice.value,
        percent:
          model.type === 'funnel'
            ? model.slices[0]?.value > 0
              ? Math.min(Number.MAX_VALUE, slice.value / model.slices[0].value)
              : 0
            : model.type === 'gauge'
              ? model.gauge
                ? scaleChartValue(slice.value, [model.gauge.min, model.gauge.max], [0, 1])
                : 0
              : scaledSum > 0
                ? Math.min(1, slice.value / maximum / scaledSum)
                : 0,
        color: slice.color,
      });
    }
    return datums;
  }
  for (const series of model.series) {
    const prefix = `${encodeURIComponent(series.id)}:`;
    if (model.type === 'scatter') {
      for (const point of series.points) {
        if (!isFiniteNumber(point.x) || !isFiniteNumber(point.y)) continue;
        datums.push({
          id: prefix + encodeURIComponent(point.id),
          type: model.type,
          seriesId: series.id,
          seriesName: series.name,
          index: point.index,
          label: point.label ?? point.id,
          value: point.value ?? point.y,
          ...(point.value === undefined ? {} : { magnitude: point.value }),
          x: point.x,
          y: point.y,
          color: series.color,
        });
      }
    } else {
      for (let index = 0; index < series.values.length; index += 1) {
        const value = series.values[index];
        if (!isFiniteNumber(value)) continue;
        datums.push({
          id: prefix + index,
          type: model.type,
          seriesId: series.id,
          seriesName: series.name,
          index,
          label: model.categories[index] ?? String(index + 1),
          value,
          color: series.color,
        });
      }
    }
  }
  return datums;
}

/** True only for drawable data; fatal structural errors and all-zero radial data are empty. */
export function hasChartData(model: ChartModel): boolean {
  if (model.invalid) return false;
  if (model.type === 'heatmap') return Boolean(model.cells?.length);
  if (model.type === 'gauge' || model.type === 'waterfall')
    return model.slices.some((slice) => isFiniteNumber(slice.value));
  if (
    model.type === 'pie' ||
    model.type === 'donut' ||
    model.type === 'treemap' ||
    model.type === 'funnel'
  ) {
    return model.slices.some((slice) => isFiniteNumber(slice.value) && slice.value > 0);
  }
  for (const series of model.series) {
    if (model.type === 'scatter') {
      if (series.points.some((point) => isFiniteNumber(point.x) && isFiniteNumber(point.y)))
        return true;
    } else if (series.values.some(isFiniteNumber)) {
      return true;
    }
  }
  return false;
}
