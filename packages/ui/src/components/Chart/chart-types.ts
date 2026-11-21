import type * as React from 'react';

export type ChartType =
  | 'line'
  | 'area'
  | 'bar'
  | 'pie'
  | 'donut'
  | 'scatter'
  | 'radar'
  | 'heatmap'
  | 'treemap'
  | 'funnel'
  | 'gauge'
  | 'waterfall'
  | 'sparkline';
export type ChartStatus = 'loading' | 'ready' | 'empty' | 'error';

export interface ChartSeries {
  id: string;
  name: string;
  color?: string;
  /** Finite numbers or null gaps, aligned with categories. No numeric-string coercion. */
  values: readonly (number | null)[];
}

export interface ChartSlice {
  id: string;
  label: string;
  /** Finite value; nonnegative for proportions, or inside min/max for a gauge. */
  value: number;
  color?: string;
}

export interface ChartScatterPoint {
  id: string;
  x: number;
  y: number;
  label?: string;
  /** Optional bubble magnitude when the chart enables `bubble`; area-mapped radius. */
  value?: number;
}

export interface ChartScatterSeries {
  id: string;
  name: string;
  color?: string;
  points: readonly ChartScatterPoint[];
}

export interface ChartHeatmapCell {
  id: string;
  /** Row/category key; ordered by first appearance. */
  row: string;
  /** Column key; ordered by first appearance. */
  col: string;
  /** Finite value of any sign; the color scale spans the visible cells. */
  value: number;
  color?: string;
}

export interface ChartWaterfallStep {
  id: string;
  label: string;
  /** Signed delta relative to the running total; the first step starts at zero. */
  value: number;
  color?: string;
}

/** IDs: slice.id; encodeURIComponent(series.id):index; or encoded series.id:point.id. */
export interface ChartDatum {
  id: string;
  type: ChartType;
  seriesId: string;
  seriesName: string;
  index: number;
  label: string;
  value: number;
  x?: number;
  y?: number;
  /** Valid supplied scatter magnitude; missing values never fall back to Y for bubble sizing. */
  magnitude?: number;
  /** Visible share, gauge progress, or funnel ratio to the first stage (may exceed 1). */
  percent?: number;
  color: string;
}

export interface ChartError {
  code: 'load' | 'data';
  message: string;
  issues?: readonly string[];
  cause?: unknown;
}

export interface ChartLabels {
  chart: string;
  loading: string;
  error: string;
  retry: string;
  empty: string;
  noVisible: string;
  showAll: string;
  legend: string;
  dataTable: string;
  category: string;
  series: string;
  value: string;
  x: string;
  y: string;
  percent: string;
  instructions: string;
  invalidData: string;
  /** Shown in the description while `zoom` is enabled. */
  zoomHint: string;
  /** Shown in the description while `brush` is enabled. */
  brushHint: string;
  /** Zoom-reset control aria-label. */
  resetZoom: string;
  /** CSV download control aria-label. */
  downloadCsv: string;
}

export interface ChartBaseProps extends Omit<
  React.ComponentPropsWithRef<'div'>,
  'children' | 'title' | 'color' | 'onChange' | 'onError' | 'defaultValue'
> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Plot height in CSS px: [180, 800], default 300; sparkline [32, 800], default 64. */
  height?: number;
  legend?: boolean;
  grid?: boolean;
  tooltip?: boolean;
  showDataTable?: boolean;
  disabled?: boolean;
  loading?: boolean;
  loadingContent?: React.ReactNode;
  emptyContent?: React.ReactNode;
  /** Host-provided data error. The previous data remains available in its table. */
  error?: React.ReactNode;
  hiddenSeries?: readonly string[];
  defaultHiddenSeries?: readonly string[];
  onHiddenSeriesChange?: (ids: string[]) => void;
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (id: string | null) => void;
  onDataClick?: (datum: ChartDatum, event: React.MouseEvent<Element>) => void;
  renderTooltip?: (datum: ChartDatum) => React.ReactNode;
  valueFormatter?: (value: number, context: 'x' | 'y' | 'value') => string;
  xLabel?: string;
  yLabel?: string;
  /** Optional finite ascending numeric domains; ignored for radial charts. */
  xDomain?: readonly [number, number];
  yDomain?: readonly [number, number];
  /** Opt-in entry/update transitions; reduced motion always wins. */
  animated?: boolean;
  /** Opt-in crosshair tooltip for cartesian charts; the default tooltip is per datum. */
  tooltipMode?: 'datum' | 'crosshair';
  /** Opt-in wheel/pinch X zoom for cartesian and scatter charts. */
  zoom?: boolean;
  /** Opt-in drag-to-zoom rectangle for cartesian and scatter charts. */
  brush?: boolean;
  /** Controlled visible X range inside the axis domain; null restores the full domain. */
  viewRange?: readonly [number, number] | null;
  defaultViewRange?: readonly [number, number] | null;
  onViewRangeChange?: (range: readonly [number, number] | null) => void;
  /** Opt-in CSV download control over the full canonical data. */
  csv?: boolean;
  labels?: Partial<ChartLabels>;
  onReady?: () => void;
  onStatusChange?: (status: ChartStatus) => void;
  onError?: (error: ChartError) => void;
  classNames?: {
    root?: string;
    header?: string;
    title?: string;
    description?: string;
    plot?: string;
    svg?: string;
    legend?: string;
    legendItem?: string;
    tooltip?: string;
    dataTable?: string;
    loading?: string;
    empty?: string;
    error?: string;
    crosshair?: string;
    brush?: string;
    actions?: string;
  };
}

export interface ChartCartesianProps extends ChartBaseProps {
  type?: 'line' | 'area' | 'bar' | 'radar' | 'sparkline';
  categories: readonly string[];
  series: readonly ChartSeries[];
  /** Cumulate visible series; null gaps stay gaps. Bar stacks from the baseline, area from the previous band. */
  stack?: boolean;
  /** Horizontal bars place categories on the Y axis; line/area ignore this. */
  orientation?: 'horizontal';
  data?: never;
}

export interface ChartRadialProps extends ChartBaseProps {
  type: 'pie' | 'donut';
  data: readonly ChartSlice[];
  categories?: never;
  series?: never;
}

export interface ChartScatterProps extends ChartBaseProps {
  type: 'scatter';
  series: readonly ChartScatterSeries[];
  /** Map optional point values to area-aware bubble radii. */
  bubble?: boolean;
  /** Explicit bubble value domain; defaults to the full-data extent. */
  bubbleDomain?: readonly [number, number];
  categories?: never;
  data?: never;
}

export interface ChartHeatmapProps extends ChartBaseProps {
  type: 'heatmap';
  data: readonly ChartHeatmapCell[];
  categories?: never;
  series?: never;
}

export interface ChartTreemapProps extends ChartBaseProps {
  type: 'treemap';
  data: readonly ChartSlice[];
  categories?: never;
  series?: never;
}

export interface ChartFunnelProps extends ChartBaseProps {
  type: 'funnel';
  data: readonly ChartSlice[];
  categories?: never;
  series?: never;
}

export interface ChartGaugeProps extends ChartBaseProps {
  type: 'gauge';
  /** The first slice carries the displayed value. */
  data: readonly ChartSlice[];
  /** Defaults to 0; must stay below max. */
  min?: number;
  /** Defaults to max(100, value). */
  max?: number;
  categories?: never;
  series?: never;
}

export interface ChartWaterfallProps extends ChartBaseProps {
  type: 'waterfall';
  data: readonly ChartWaterfallStep[];
  categories?: never;
  series?: never;
}

export type ChartProps =
  | ChartCartesianProps
  | ChartRadialProps
  | ChartScatterProps
  | ChartHeatmapProps
  | ChartTreemapProps
  | ChartFunnelProps
  | ChartGaugeProps
  | ChartWaterfallProps;

/** Internal, no graphics dependency in the public type surface. */
export type ChartViewProps = ChartProps & {
  onViewStatus: (status: ChartStatus) => void;
};
