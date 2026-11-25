export type WordMetric = 'letterSpacing' | 'baselineShift';
export const WORD_METRIC_STEPS = { letterSpacing: 0.05, baselineShift: 0.5 };
export const WORD_METRIC_LIMIT = 500;

/** Signed point values use the same precision as native run spacing/position. */
export function wordMetricPoints(value: unknown, metric: WordMetric): number | null {
  const input =
    typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim() : '';
  const match = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+))(pt)?$/i.exec(input);
  if (!match) return null;
  const amount = Number(match[1]);
  const units = amount / WORD_METRIC_STEPS[metric];
  if (
    !Number.isFinite(amount) ||
    !Number.isFinite(units) ||
    Math.abs(amount) > WORD_METRIC_LIMIT ||
    Math.abs(units - Math.round(units)) > 1e-6
  )
    return null;
  const result = Math.round(units) / (metric === 'letterSpacing' ? 20 : 2);
  return Object.is(result, -0) ? 0 : result;
}

export function wordMetricCss(attrs: Record<string, unknown>) {
  const letterSpacing = wordMetricPoints(attrs.letterSpacing, 'letterSpacing');
  const baselineShift = wordMetricPoints(attrs.baselineShift, 'baselineShift');
  return {
    ...(letterSpacing !== null ? { letterSpacing: `${letterSpacing}pt` } : {}),
    ...(baselineShift !== null
      ? {
          verticalAlign: baselineShift === 0 ? 'baseline' : `${baselineShift}pt`,
          '--zuvi-word-baseline-shift': `${baselineShift}pt`,
        }
      : {}),
  };
}
