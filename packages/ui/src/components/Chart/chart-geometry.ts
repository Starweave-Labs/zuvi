import type { ChartDatum } from './chart-types';
import { getChartDatums, type ChartModel } from './chart-model';
import { buildChartShapes } from './chart-shapes';

export interface ChartSize {
  width: number;
  height: number;
}

export type ChartDomain = readonly [number, number];

export interface ChartTick {
  /** Category index for categorical axes; numeric value for continuous axes. */
  value: number;
  label: string;
  position: number;
}

export interface ChartRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ChartMark {
  datum: ChartDatum;
  /** Tooltip/focus anchor in the same logical pixels as the SVG viewBox. */
  x: number;
  y: number;
  kind: 'bar' | 'point' | 'slice' | 'cell' | 'tile';
  rect?: ChartRect;
  path?: string;
  radius?: number;
  heat?: number;
  label?: string;
  startValue?: number;
  endValue?: number;
}

export interface ChartSeriesPath {
  id: string;
  color: string;
  linePath?: string;
  areaPath?: string;
  dashed?: boolean;
}

export interface ChartGeometryOptions {
  xDomain?: ChartDomain;
  yDomain?: ChartDomain;
  /** Grid visibility belongs to the renderer; ticks remain available when false. */
  grid?: boolean;
  stack?: boolean;
  orientation?: 'horizontal';
  bubble?: boolean;
  bubbleDomain?: ChartDomain;
  /** Renderer-only space for scatter circles and a second row of axis captions. */
  markerPadding?: number;
  bottomPadding?: number;
}

export interface ChartGeometry {
  plot: { left: number; top: number; width: number; height: number };
  xTicks: ChartTick[];
  yTicks: ChartTick[];
  xDomain: ChartDomain;
  yDomain: ChartDomain;
  marks: ChartMark[];
  seriesPaths: ChartSeriesPath[];
  radial: { cx: number; cy: number; r: number; innerRadius: number; total: number | null } | null;
  baseline: number;
  horizontal?: boolean;
  backgrounds?: ChartRect[];
  heatLegend?: { min: number; max: number };
  radar?: {
    cx: number;
    cy: number;
    r: number;
    axes: { label: string; angle: number }[];
    rings: number[];
  };
  gauge?: {
    cx: number;
    cy: number;
    r: number;
    value: number;
    min: number;
    max: number;
    backgroundPath: string;
  };
}

const TAU = Math.PI * 2;
const NICE_STEPS = [1, 2, 2.5, 5, 10] as const;

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function ascending(domain: ChartDomain | undefined): domain is ChartDomain {
  return (
    Array.isArray(domain) &&
    domain.length === 2 &&
    finite(domain[0]) &&
    finite(domain[1]) &&
    domain[0] < domain[1]
  );
}

/**
 * Finite extent, with optional zero inclusion. Loops accept arbitrarily large iterables,
 * never spread into Math.min/max. Empty data is [0, 1]; equal ranges expand safely even
 * at Number.MAX_VALUE and Number.MIN_VALUE.
 */
export function resolveChartDomain(
  values: Iterable<number | null>,
  includeZero = false
): ChartDomain {
  let minimum = Infinity;
  let maximum = -Infinity;
  for (const value of values) {
    if (!finite(value)) continue;
    if (value < minimum) minimum = value;
    if (value > maximum) maximum = value;
  }
  if (minimum === Infinity) return [0, 1];
  if (includeZero) {
    minimum = Math.min(0, minimum);
    maximum = Math.max(0, maximum);
  }
  if (minimum < maximum) return [minimum, maximum];
  if (minimum === 0) return includeZero ? [0, 1] : [-1, 1];
  const delta = Math.max(Number.MIN_VALUE, Math.abs(minimum) * 0.1);
  const low = minimum - delta;
  const high = maximum + delta;
  return [finite(low) ? low : -Number.MAX_VALUE, finite(high) ? high : Number.MAX_VALUE];
}

/**
 * Clamped linear scale. Use direct subtraction for close extents and normalized
 * subtraction for overflowing spans such as [-MAX_VALUE, MAX_VALUE]. No SVG NaN/Infinity.
 */
export function scaleChartValue(value: number, domain: ChartDomain, range: ChartDomain): number {
  const start = finite(range[0]) ? range[0] : 0;
  const end = finite(range[1]) ? range[1] : start;
  let fraction = 0.5;
  if (ascending(domain) && finite(value)) {
    const clamped = Math.max(domain[0], Math.min(domain[1], value));
    const span = domain[1] - domain[0];
    if (finite(span) && span > 0) {
      fraction = (clamped - domain[0]) / span;
    } else {
      const magnitude = Math.max(Math.abs(domain[0]), Math.abs(domain[1]));
      fraction =
        (clamped / magnitude - domain[0] / magnitude) /
        (domain[1] / magnitude - domain[0] / magnitude);
    }
  }
  fraction = Math.max(0, Math.min(1, fraction));
  if (fraction === 0) return start;
  if (fraction === 1) return end;
  // Weighted interpolation also supports public callers passing overflowing range spans.
  const result = start * (1 - fraction) + end * fraction;
  return finite(result) ? result : start / 2 + end / 2;
}

/**
 * At most 64 finite, ascending ticks on a 1/2/2.5/5/10 decimal lattice. The requested
 * count is a density target, bounded to [2, 12], not a data cap. The bounded offset loop
 * cannot hang on near-equal huge ranges whose lattice indices exceed safe integers.
 */
export function niceTicks(domain: ChartDomain, count = 5): number[] {
  if (!ascending(domain)) return [];
  const target = finite(count) ? Math.max(2, Math.min(12, Math.round(count))) : 5;
  const magnitude = Math.max(Math.abs(domain[0]), Math.abs(domain[1]));
  const span = domain[1] - domain[0];
  const rawStep = finite(span)
    ? span / (target - 1)
    : ((domain[1] / magnitude - domain[0] / magnitude) / (target - 1)) * magnitude;
  const safeStep = Math.max(Number.MIN_VALUE, rawStep);
  const power = 10 ** Math.floor(Math.log10(safeStep));
  let step = safeStep;
  if (power > 0 && finite(power)) {
    const fraction = safeStep / power;
    const unit = NICE_STEPS.find((candidate) => candidate >= fraction) ?? 10;
    step = unit * power;
  }
  if (!finite(step)) step = Number.MAX_VALUE;
  step = Math.max(Number.MIN_VALUE, step);
  const first = Math.ceil(domain[0] / step);
  const last = Math.floor(domain[1] / step);
  const ticks: number[] = [];
  for (let offset = 0; offset < 64; offset += 1) {
    const multiple = first + offset;
    if (multiple > last) break;
    const value = multiple * step;
    if (!finite(value) || value < domain[0] || value > domain[1]) continue;
    const normalized = value === 0 ? 0 : value;
    if (ticks.length === 0 || normalized > ticks[ticks.length - 1]) ticks.push(normalized);
  }
  // Extremely narrow/subnormal ranges may contain no representable lattice point.
  return ticks.length > 0 ? ticks : [domain[0], domain[1]];
}

function tickLabel(value: number): string {
  if (value === 0) return '0';
  const magnitude = Math.abs(value);
  const label =
    magnitude >= 1e7 || magnitude < 1e-4
      ? value
          .toExponential(3)
          .replace(/\.?0+e/, 'e')
          .replace('e+', 'e')
      : String(Number(value.toPrecision(12)));
  // A rounded MAX_VALUE label must not claim a value that parses as Infinity.
  return finite(Number(label)) ? label : String(value);
}

function numericTicks(
  domain: ChartDomain,
  count: number,
  scale: (value: number) => number
): ChartTick[] {
  const values = niceTicks(domain, count);
  const labels = values.map(tickLabel);
  const occurrences = new Map<string, number>();
  for (const label of labels) occurrences.set(label, (occurrences.get(label) ?? 0) + 1);
  // Near-equal huge domains need round-trip precision, not identical compact labels.
  return values.map((value, index) => ({
    value,
    label: occurrences.get(labels[index])! > 1 ? String(value) : labels[index],
    position: scale(value),
  }));
}

function drawableSize(value: number, fallback: number): number {
  // Real measured pixels are preserved. Bound only nonsensical layout magnitudes,
  // never the number of datums; this also makes all path arithmetic finite.
  return finite(value) && value > 0 ? Math.max(1, Math.min(1_000_000, value)) : fallback;
}

function coordinate(value: number): string {
  return String(Number(value.toFixed(4)));
}

function point(cx: number, cy: number, radius: number, angle: number): [number, number] {
  return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
}

function xy(position: readonly [number, number]): string {
  return `${coordinate(position[0])} ${coordinate(position[1])}`;
}

function sectorPath(
  cx: number,
  cy: number,
  radius: number,
  innerRadius: number,
  start: number,
  end: number,
  fullCircle: boolean
): string {
  const outerStart = point(cx, cy, radius, start);
  const radiusText = coordinate(radius);
  if (fullCircle) {
    const outerMiddle = point(cx, cy, radius, start + Math.PI);
    const outer = `M ${xy(outerStart)} A ${radiusText} ${radiusText} 0 1 1 ${xy(outerMiddle)} A ${radiusText} ${radiusText} 0 1 1 ${xy(outerStart)} Z`;
    if (innerRadius === 0) return outer;
    const innerStart = point(cx, cy, innerRadius, start);
    const innerMiddle = point(cx, cy, innerRadius, start + Math.PI);
    const innerText = coordinate(innerRadius);
    // Opposite winding gives a hole with the SVG default nonzero fill rule.
    return `${outer} M ${xy(innerStart)} A ${innerText} ${innerText} 0 1 0 ${xy(innerMiddle)} A ${innerText} ${innerText} 0 1 0 ${xy(innerStart)} Z`;
  }
  const outerEnd = point(cx, cy, radius, end);
  const large = end - start > Math.PI ? 1 : 0;
  const arc = `A ${radiusText} ${radiusText} 0 ${large} 1 ${xy(outerEnd)}`;
  if (innerRadius === 0)
    return `M ${coordinate(cx)} ${coordinate(cy)} L ${xy(outerStart)} ${arc} Z`;
  const innerStart = point(cx, cy, innerRadius, start);
  const innerEnd = point(cx, cy, innerRadius, end);
  const innerText = coordinate(innerRadius);
  return `M ${xy(outerStart)} ${arc} L ${xy(innerEnd)} A ${innerText} ${innerText} 0 ${large} 0 ${xy(innerStart)} Z`;
}

function* datumValues(datums: readonly ChartDatum[], axis: 'x' | 'y'): Iterable<number> {
  for (const datum of datums)
    yield axis === 'x' ? (datum.x ?? datum.index) : (datum.y ?? datum.value);
}

/**
 * Pure dependency-free SVG geometry for the supplied normalized/visible model. Invalid
 * models never draw. Every safe Cartesian datum has a mark (including zeros and lone
 * points); radial zeros stay in the model/table without a sector. All passes are linear
 * in input size, except a maximum of 64 tick candidates per numeric axis.
 */
export function buildChartGeometry(
  model: ChartModel,
  size: ChartSize,
  options: ChartGeometryOptions = {}
): ChartGeometry {
  const width = drawableSize(size.width, 320);
  const height = drawableSize(size.height, 300);
  const radialType = model.type === 'pie' || model.type === 'donut';
  const horizontalRoom = Math.max(0, width - 64);
  const verticalRoom = Math.max(0, height - 80);
  const markerPadding =
    model.type === 'scatter' && finite(options.markerPadding)
      ? Math.max(0, Math.min(32, width / 8, height / 8, options.markerPadding))
      : 0;
  const captionPadding = finite(options.bottomPadding)
    ? Math.max(36, Math.min(80, options.bottomPadding))
    : 36;
  const left = radialType
    ? Math.min(12, width / 8)
    : Math.min(60, horizontalRoom * 0.75) + markerPadding;
  const right = radialType ? left : Math.min(20, horizontalRoom * 0.25) + markerPadding;
  const top = radialType
    ? Math.min(12, height / 8)
    : Math.min(16, verticalRoom * 0.3) + markerPadding;
  const bottom = radialType ? top : Math.min(captionPadding, verticalRoom * 0.7) + markerPadding;
  const plot = { left, top, width: width - left - right, height: height - top - bottom };
  const geometry: ChartGeometry = {
    plot,
    xTicks: [],
    yTicks: [],
    xDomain: [0, 1],
    yDomain: [0, 1],
    marks: [],
    seriesPaths: [],
    radial: null,
    baseline: plot.top + plot.height,
  };
  if (model.invalid) return geometry;
  if (
    model.type === 'radar' ||
    model.type === 'heatmap' ||
    model.type === 'treemap' ||
    model.type === 'funnel' ||
    model.type === 'gauge' ||
    model.type === 'waterfall'
  ) {
    return buildChartShapes(model, { width, height }, geometry, options);
  }
  if (model.type === 'sparkline') {
    geometry.plot = {
      left: 8,
      top: 8,
      width: Math.max(1, width - 16),
      height: Math.max(1, height - 16),
    };
    Object.assign(plot, geometry.plot);
  }
  const datums = getChartDatums(model);
  const datumById = new Map(datums.map((datum) => [datum.id, datum]));

  if (radialType) {
    const cx = plot.left + plot.width / 2;
    const cy = plot.top + plot.height / 2;
    const r = Math.min(plot.width, plot.height) / 2;
    const innerRadius = model.type === 'donut' ? r * 0.6 : 0;
    let total = 0;
    let lastPositive = -1;
    for (let index = 0; index < datums.length; index += 1) {
      total += datums[index].value;
      if ((datums[index].percent ?? 0) > 0) lastPositive = index;
    }
    geometry.radial = { cx, cy, r, innerRadius, total: finite(total) ? total : null };
    let cumulative = 0;
    let compensation = 0;
    for (let index = 0; index < datums.length; index += 1) {
      const datum = datums[index];
      const percent = datum.percent ?? 0;
      if (datum.value <= 0 || percent <= 0) continue;
      const adjusted = percent - compensation;
      const sum = cumulative + adjusted;
      compensation = sum - cumulative - adjusted;
      const next = index === lastPositive ? 1 : Math.min(1, sum);
      const start = -Math.PI / 2 + cumulative * TAU;
      const end = -Math.PI / 2 + next * TAU;
      const angle = end - start;
      cumulative = next;
      // IEEE-754 may underflow a tiny share or its angular span; the datum is not dropped.
      if (angle <= 0) continue;
      const fullCircle = angle === TAU;
      const midpoint = start + angle / 2;
      const anchorRadius =
        innerRadius > 0
          ? (r + innerRadius) / 2
          : fullCircle
            ? 0
            : ((2 * r) / 3) * (Math.sin(angle / 2) / (angle / 2));
      const anchor = point(cx, cy, anchorRadius, midpoint);
      geometry.marks.push({
        datum,
        kind: 'slice',
        x: anchor[0],
        y: anchor[1],
        path: sectorPath(cx, cy, r, innerRadius, start, end, fullCircle),
      });
    }
    return geometry;
  }

  const scatter = model.type === 'scatter';
  const horizontal = model.type === 'bar' && options.orientation === 'horizontal';
  const stacked = Boolean(options.stack && (model.type === 'bar' || model.type === 'area'));
  const stacks = new Map<string, { start: number; end: number }>();
  const positive = new Map<number, number>();
  const negative = new Map<number, number>();
  if (stacked)
    for (const datum of datums) {
      const group = datum.value < 0 ? negative : positive;
      const start = group.get(datum.index) ?? 0;
      const end = start + datum.value;
      if (!Number.isFinite(end)) return { ...geometry, marks: [], seriesPaths: [] };
      group.set(datum.index, end);
      stacks.set(datum.id, { start, end });
    }
  const categories = model.categories.length;
  const categoricalDomain: ChartDomain =
    model.type === 'bar'
      ? [-0.5, Math.max(0.5, categories - 0.5)]
      : categories > 1
        ? [0, categories - 1]
        : [-0.5, 0.5];
  geometry.xDomain = ascending(options.xDomain)
    ? [options.xDomain[0], options.xDomain[1]]
    : scatter
      ? resolveChartDomain(datumValues(datums, 'x'))
      : categoricalDomain;
  geometry.yDomain = ascending(options.yDomain)
    ? [options.yDomain[0], options.yDomain[1]]
    : stacked
      ? resolveChartDomain([...positive.values(), ...negative.values()], true)
      : resolveChartDomain(datumValues(datums, 'y'), !scatter);
  const xRange: ChartDomain = [plot.left, plot.left + plot.width];
  const yRange: ChartDomain = [plot.top + plot.height, plot.top];
  const scaleX = (value: number) => scaleChartValue(value, geometry.xDomain, xRange);
  const scaleY = (value: number) => scaleChartValue(value, geometry.yDomain, yRange);
  geometry.baseline = scaleY(0);
  const yCount = Math.max(2, Math.min(8, Math.floor(plot.height / 48) + 1));
  geometry.yTicks = numericTicks(geometry.yDomain, yCount, scaleY);
  if (scatter) {
    const xCount = Math.max(2, Math.min(8, Math.floor(plot.width / 72) + 1));
    geometry.xTicks = numericTicks(geometry.xDomain, xCount, scaleX);
  } else if (categories > 0) {
    let longest = 0;
    for (const category of model.categories) longest = Math.max(longest, category.length);
    const spacing = Math.max(48, Math.min(128, longest * 7 + 16));
    const slots = Math.max(2, Math.floor(plot.width / spacing) + 1);
    const stride = Math.max(1, Math.ceil((categories - 1) / (slots - 1)));
    for (let index = 0; index < categories; index += stride) {
      if (index < geometry.xDomain[0] || index > geometry.xDomain[1]) continue;
      geometry.xTicks.push({
        value: index,
        label: model.categories[index],
        position: scaleX(index),
      });
    }
    const last = categories - 1;
    if (
      last >= geometry.xDomain[0] &&
      last <= geometry.xDomain[1] &&
      geometry.xTicks[geometry.xTicks.length - 1]?.value !== last
    ) {
      geometry.xTicks.push({ value: last, label: model.categories[last], position: scaleX(last) });
    }
  }

  if (horizontal) {
    geometry.horizontal = true;
    const valuesDomain = ascending(options.xDomain) ? options.xDomain : geometry.yDomain;
    const band = plot.height / Math.max(1, categories);
    geometry.xDomain = valuesDomain;
    geometry.yDomain = categoricalDomain;
    const x = (value: number) => scaleChartValue(value, valuesDomain, xRange);
    geometry.baseline = x(0);
    geometry.xTicks = numericTicks(valuesDomain, Math.max(2, Math.floor(plot.width / 80)), x);
    const stride = Math.max(1, Math.ceil(categories / Math.max(1, Math.floor(plot.height / 25))));
    geometry.yTicks = model.categories.flatMap((label, index) =>
      index % stride ? [] : [{ value: index, label, position: plot.top + (index + 0.5) * band }]
    );
    const groups = stacked ? 1 : Math.max(1, model.series.length);
    const positions = new Map(model.series.map((series, index) => [series.id, index]));
    for (const datum of datums) {
      const stack = stacks.get(datum.id);
      const start = x(stack?.start ?? 0);
      const end = x(stack?.end ?? datum.value);
      const height = ((band * 0.8) / groups) * 0.9;
      const y =
        plot.top +
        datum.index * band +
        band * 0.1 +
        ((stacked ? 0 : positions.get(datum.seriesId)!) * band * 0.8) / groups;
      geometry.marks.push({
        datum,
        kind: 'bar',
        x: end,
        y: y + height / 2,
        rect: { x: Math.min(start, end), y, width: Math.abs(end - start), height },
        startValue: stack?.start ?? 0,
        endValue: stack?.end ?? datum.value,
      });
    }
    return geometry;
  }

  if (model.type === 'bar') {
    const seriesPositions = new Map<string, number>();
    model.series.forEach((series, index) => seriesPositions.set(series.id, index));
    const groups = stacked ? 1 : Math.max(1, model.series.length);
    for (const datum of datums) {
      const bandLeft = scaleX(datum.index - 0.5);
      const bandRight = scaleX(datum.index + 0.5);
      // Domain overrides can clip half of an edge band; keep its bars inside the plot.
      const center = (bandLeft + bandRight) / 2;
      const band = Math.max(0, bandRight - bandLeft);
      const groupWidth = band * 0.8;
      const slot = groupWidth / groups;
      const barWidth = slot * 0.9;
      const x =
        center -
        groupWidth / 2 +
        (stacked ? 0 : (seriesPositions.get(datum.seriesId) ?? 0)) * slot +
        slot * 0.05;
      const stack = stacks.get(datum.id);
      const y = scaleY(stack?.end ?? datum.value);
      const baseline = scaleY(stack?.start ?? 0);
      const rect = {
        x,
        y: Math.min(y, baseline),
        width: barWidth,
        height: Math.abs(y - baseline),
      };
      geometry.marks.push({
        datum,
        kind: 'bar',
        x: x + barWidth / 2,
        y,
        rect,
        ...(stack ? { startValue: stack.start, endValue: stack.end } : {}),
      });
    }
    return geometry;
  }

  if (stacked && model.type === 'area') {
    for (const series of model.series) {
      let upper: string[] = [];
      let lower: string[] = [];
      const line: string[] = [];
      const areas: string[] = [];
      let previous = -2;
      let previousSign = 0;
      const close = () => {
        if (upper.length)
          areas.push(
            upper.join(' ') +
              ' ' +
              [...lower]
                .reverse()
                .map((position) => `L ${position}`)
                .join(' ') +
              ' Z'
          );
        upper = [];
        lower = [];
      };
      for (let index = 0; index < series.values.length; index++) {
        const value = series.values[index];
        if (value === null) {
          close();
          previous = -2;
          continue;
        }
        const datum = datumById.get(`${encodeURIComponent(series.id)}:${index}`)!;
        const stack = stacks.get(datum.id)!;
        const x = scaleX(index);
        const y = scaleY(stack.end);
        const baseline = scaleY(stack.start);
        const discontinuity =
          index !== previous + 1 ||
          (previousSign !== 0 && Math.sign(value) !== 0 && Math.sign(value) !== previousSign);
        if (discontinuity) close();
        const command = `${upper.length ? 'L' : 'M'} ${coordinate(x)} ${coordinate(y)}`;
        upper.push(command);
        lower.push(`${coordinate(x)} ${coordinate(baseline)}`);
        line.push(`${discontinuity ? 'M' : 'L'} ${coordinate(x)} ${coordinate(y)}`);
        geometry.marks.push({
          datum,
          kind: 'point',
          x,
          y,
          startValue: stack.start,
          endValue: stack.end,
        });
        previous = index;
        previousSign = Math.sign(value);
      }
      close();
      if (line.length)
        geometry.seriesPaths.push({
          id: series.id,
          color: series.color,
          linePath: line.join(' '),
          areaPath: areas.join(' '),
        });
    }
    return geometry;
  }

  let currentId: string | undefined;
  let currentColor = '';
  let previousIndex = -2;
  let firstX = 0;
  let lastX = 0;
  let line: string[] = [];
  let area: string[] = [];
  const closeArea = () => {
    if (previousIndex < 0) return;
    area.push(
      `L ${coordinate(lastX)} ${coordinate(geometry.baseline)} L ${coordinate(firstX)} ${coordinate(geometry.baseline)} Z`
    );
  };
  const finishSeries = () => {
    if (currentId === undefined || line.length === 0) return;
    if (model.type === 'area') closeArea();
    geometry.seriesPaths.push({
      id: currentId,
      color: currentColor,
      linePath: line.join(' '),
      ...(model.type === 'area' ? { areaPath: area.join(' ') } : {}),
    });
  };
  for (const datum of datums) {
    const x = scaleX(scatter ? datum.x! : datum.index);
    const y = scaleY(datum.y ?? datum.value);
    geometry.marks.push({ datum, kind: 'point', x, y });
    if (scatter) continue;
    if (datum.seriesId !== currentId) {
      finishSeries();
      currentId = datum.seriesId;
      currentColor = datum.color;
      previousIndex = -2;
      line = [];
      area = [];
    }
    const newSegment = datum.index !== previousIndex + 1;
    if (newSegment) {
      if (model.type === 'area') closeArea();
      firstX = x;
    }
    const command = `${newSegment ? 'M' : 'L'} ${coordinate(x)} ${coordinate(y)}`;
    line.push(command);
    if (model.type === 'area') area.push(command);
    lastX = x;
    previousIndex = datum.index;
  }
  finishSeries();
  return geometry;
}
