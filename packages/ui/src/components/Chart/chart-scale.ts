export type NumericDomain = readonly [number, number];
export const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
export const ascending = (domain: unknown): domain is NumericDomain =>
  Array.isArray(domain) && domain.length === 2 && finite(domain[0]) && finite(domain[1]) && domain[0] < domain[1];

/** Zero inclusion is explicit; equal and extreme finite domains expand without overflow. */
export function resolveChartDomain(values: Iterable<number | null>, includeZero = false): NumericDomain {
  let minimum = Infinity;
  let maximum = -Infinity;
  for (const value of values) {
    if (!finite(value)) continue;
    minimum = Math.min(minimum, value);
    maximum = Math.max(maximum, value);
  }
  if (minimum === Infinity) return [0, 1];
  if (includeZero) { minimum = Math.min(0, minimum); maximum = Math.max(0, maximum); }
  if (minimum < maximum) return [minimum, maximum];
  if (minimum === 0) return includeZero ? [0, 1] : [-1, 1];
  const delta = Math.max(Number.MIN_VALUE, Math.abs(minimum) * 0.1);
  const low = minimum - delta;
  const high = maximum + delta;
  return [finite(low) ? low : -Number.MAX_VALUE, finite(high) ? high : Number.MAX_VALUE];
}

/** Clamped scale, also valid for overflowing input/output spans. */
export function scaleChartValue(value: number, domain: NumericDomain, range: NumericDomain): number {
  const start = finite(range[0]) ? range[0] : 0;
  const end = finite(range[1]) ? range[1] : start;
  let fraction = 0.5;
  if (ascending(domain) && finite(value)) {
    const clamped = Math.max(domain[0], Math.min(domain[1], value));
    const span = domain[1] - domain[0];
    if (finite(span) && span > 0) fraction = (clamped - domain[0]) / span;
    else {
      const magnitude = Math.max(Math.abs(domain[0]), Math.abs(domain[1]));
      fraction = (clamped / magnitude - domain[0] / magnitude) / (domain[1] / magnitude - domain[0] / magnitude);
    }
  }
  fraction = Math.max(0, Math.min(1, fraction));
  if (fraction === 0) return start;
  if (fraction === 1) return end;
  const result = start * (1 - fraction) + end * fraction;
  return finite(result) ? result : start / 2 + end / 2;
}

export function niceTicks(domain: NumericDomain, count = 5): number[] {
  if (!ascending(domain)) return [];
  const target = finite(count) ? Math.max(2, Math.min(12, Math.round(count))) : 5;
  const magnitude = Math.max(Math.abs(domain[0]), Math.abs(domain[1]));
  const span = domain[1] - domain[0];
  const rawStep = finite(span) ? span / (target - 1) : ((domain[1] / magnitude - domain[0] / magnitude) / (target - 1)) * magnitude;
  const safeStep = Math.max(Number.MIN_VALUE, rawStep);
  const power = 10 ** Math.floor(Math.log10(safeStep));
  let step = safeStep;
  if (power > 0 && finite(power)) step = ([1, 2, 2.5, 5, 10].find((value) => value >= safeStep / power) ?? 10) * power;
  if (!finite(step)) step = Number.MAX_VALUE;
  step = Math.max(Number.MIN_VALUE, step);
  const first = Math.ceil(domain[0] / step);
  const last = Math.floor(domain[1] / step);
  const ticks: number[] = [];
  for (let offset = 0; offset < 64; offset++) {
    const multiple = first + offset;
    if (multiple > last) break;
    const value = multiple * step;
    if (!finite(value) || value < domain[0] || value > domain[1]) continue;
    const normalized = value === 0 ? 0 : value;
    if (!ticks.length || normalized > ticks[ticks.length - 1]) ticks.push(normalized);
  }
  return ticks.length ? ticks : [domain[0], domain[1]];
}

export function chartTickLabel(value: number): string {
  if (value === 0) return '0';
  const magnitude = Math.abs(value);
  const label = magnitude >= 1e7 || magnitude < 1e-4
    ? value.toExponential(3).replace(/\.?0+e/, 'e').replace('e+', 'e')
    : String(Number(value.toPrecision(12)));
  return finite(Number(label)) ? label : String(value);
}

export function numericTicks(domain: NumericDomain, count: number, scale: (value: number) => number) {
  const values = niceTicks(domain, count);
  const labels = values.map(chartTickLabel);
  const occurrences = new Map<string, number>();
  labels.forEach((label) => occurrences.set(label, (occurrences.get(label) ?? 0) + 1));
  return values.map((value, index) => ({ value, label: occurrences.get(labels[index])! > 1 ? String(value) : labels[index], position: scale(value) }));
}

export const chartCoordinate = (value: number) => String(Number(value.toFixed(4)));
export const chartPoint = (cx: number, cy: number, radius: number, angle: number): [number, number] =>
  [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
const pair = (point: readonly number[]) => point.map(chartCoordinate).join(' ');

/** Full circles use two arcs; reverse inner winding creates a true donut hole. */
export function chartSectorPath(cx: number, cy: number, radius: number, innerRadius: number, start: number, end: number): string {
  const tau = Math.PI * 2;
  const outerStart = chartPoint(cx, cy, radius, start);
  const r = chartCoordinate(radius);
  if (end - start >= tau - 1e-14) {
    const middle = chartPoint(cx, cy, radius, start + Math.PI);
    const outer = `M ${pair(outerStart)} A ${r} ${r} 0 1 1 ${pair(middle)} A ${r} ${r} 0 1 1 ${pair(outerStart)} Z`;
    if (!innerRadius) return outer;
    const inner = chartPoint(cx, cy, innerRadius, start);
    const opposite = chartPoint(cx, cy, innerRadius, start + Math.PI);
    const ir = chartCoordinate(innerRadius);
    return `${outer} M ${pair(inner)} A ${ir} ${ir} 0 1 0 ${pair(opposite)} A ${ir} ${ir} 0 1 0 ${pair(inner)} Z`;
  }
  const outerEnd = chartPoint(cx, cy, radius, end);
  const large = end - start > Math.PI ? 1 : 0;
  const arc = `A ${r} ${r} 0 ${large} 1 ${pair(outerEnd)}`;
  if (!innerRadius) return `M ${chartCoordinate(cx)} ${chartCoordinate(cy)} L ${pair(outerStart)} ${arc} Z`;
  const ir = chartCoordinate(innerRadius);
  return `M ${pair(outerStart)} ${arc} L ${pair(chartPoint(cx, cy, innerRadius, end))} A ${ir} ${ir} 0 ${large} 0 ${pair(chartPoint(cx, cy, innerRadius, start))} Z`;
}
