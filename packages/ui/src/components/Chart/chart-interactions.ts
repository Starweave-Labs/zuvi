import type { ChartModel } from './chart-model';
import type { ChartDatum } from './chart-types';
import { ascending, finite, scaleChartValue, type NumericDomain } from './chart-scale';

/** Tuple values, not tuple identity, define a committed viewport. */
export function sameChartRange(a: NumericDomain | null, b: NumericDomain | null): boolean {
  return a === b || (a !== null && b !== null && a[0] === b[0] && a[1] === b[1]);
}

export function normalizeViewRange(
  range: readonly [number, number] | null | undefined,
  domain: NumericDomain
): NumericDomain | null {
  if (!ascending(range) || !ascending(domain)) return null;
  const low = Math.max(range[0], domain[0]);
  const high = Math.min(range[1], domain[1]);
  if (low >= high || (low <= domain[0] && high >= domain[1])) return null;
  return [low, high];
}

/** Work in normalized domain fractions so extreme input spans cannot overflow. */
export function zoomChartRange(
  current: NumericDomain | null,
  domain: NumericDomain,
  factor: number,
  anchor = 0.5
): NumericDomain | null {
  if (!ascending(domain) || !finite(factor) || factor <= 0) return null;
  const normalized = normalizeViewRange(current, domain);
  if (factor === 1) return normalized;
  const range = normalized ?? domain;
  const low = scaleChartValue(range[0], domain, [0, 1]);
  const high = scaleChartValue(range[1], domain, [0, 1]);
  const pivot = finite(anchor) ? Math.max(0, Math.min(1, anchor)) : 0.5;
  const position = low + (high - low) * pivot;
  const width = Math.max(0.001, Math.min(1, (high - low) * factor));
  const start = Math.max(0, Math.min(1 - width, position - width * pivot));
  if (width >= 1) return null;
  // Preserve exact endpoints at limits so a no-op zoom cannot drift or emit a callback.
  if (width === high - low && (pivot === 0.5 || start === low)) return normalized;
  return normalizeViewRange(
    [scaleChartValue(start, [0, 1], domain), scaleChartValue(start + width, [0, 1], domain)],
    domain
  );
}

export function brushChartRange(
  start: number,
  end: number,
  plot: { left: number; width: number },
  domain: NumericDomain
): NumericDomain | null {
  if (
    !finite(start) ||
    !finite(end) ||
    !finite(plot.left) ||
    !finite(plot.width) ||
    plot.width <= 0 ||
    !ascending(domain)
  )
    return null;
  start = Math.max(plot.left, Math.min(plot.left + plot.width, start));
  end = Math.max(plot.left, Math.min(plot.left + plot.width, end));
  if (Math.abs(start - end) < 8) return null;
  const value = (x: number) => {
    const fraction = Math.max(0, Math.min(1, (x - plot.left) / plot.width));
    return domain[0] * (1 - fraction) + domain[1] * fraction;
  };
  const range: NumericDomain = [value(Math.min(start, end)), value(Math.max(start, end))];
  return ascending(range) ? range : null;
}

export function bubbleRadius(
  value: number,
  domain: NumericDomain,
  range: NumericDomain = [4, 20]
): number {
  const fraction = ascending(domain) ? scaleChartValue(value, domain, [0, 1]) : 0.5;
  return Math.sqrt(range[0] * range[0] + (range[1] * range[1] - range[0] * range[0]) * fraction);
}

export function nearestChartCategory(
  marks: readonly { datum: ChartDatum; x: number }[],
  x: number
): number | null {
  let distance = Infinity;
  let index: number | null = null;
  for (const mark of marks) {
    const next = Math.abs(mark.x - x);
    if (next < distance) {
      distance = next;
      index = mark.datum.index;
    }
  }
  return index;
}

function csvField(value: unknown) {
  let text = value === null || value === undefined ? '' : String(value);
  // Preserve real numeric negative values. Prefix unsafe text formulas, including whitespace-obfuscated formulas.
  if (typeof value !== 'number' && (/^[\t\r\n]/.test(text) || /^[\s]*[=+\-@]/.test(text)))
    text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}

/** The full source model, never a legend- or zoom-filtered dataset. */
export function buildChartCsv(model: ChartModel): string {
  const rows: unknown[][] = [];
  if (model.type === 'heatmap') {
    rows.push(['id', 'row', 'col', 'value']);
    for (const cell of model.cells ?? []) rows.push([cell.id, cell.row, cell.col, cell.value]);
  } else if (model.type === 'scatter') {
    rows.push(['series', 'id', 'label', 'x', 'y', 'value']);
    for (const series of model.series)
      for (const point of series.points)
        rows.push([series.name, point.id, point.label ?? point.id, point.x, point.y, point.value]);
  } else if (model.slices.length) {
    rows.push(['id', 'label', 'value']);
    for (const slice of model.slices) rows.push([slice.id, slice.label, slice.value]);
  } else {
    rows.push(['category', ...model.series.map((series) => series.name)]);
    for (let index = 0; index < model.categories.length; index++)
      rows.push([model.categories[index], ...model.series.map((series) => series.values[index])]);
  }
  return '\uFEFF' + rows.map((row) => row.map(csvField).join(',')).join('\r\n') + '\r\n';
}
