'use client';

import * as React from 'react';
import { useZuviConfig } from '../../config';
import { cx, FloatingPanel, isImeComposing, useControllableState } from '../../utils';
import {
  normalizeChartData,
  deriveVisibleChartModel,
  getChartDatums,
  hasChartData,
} from './chart-model';
import { buildChartGeometry, type ChartMark } from './chart-geometry';
import { chartAxisText } from './chart-text';
import { Download, RotateCcw } from '@zuvi/icons';
import { useChartViewport } from './useChartViewport';
import { buildChartCsv, bubbleRadius, nearestChartCategory } from './chart-interactions';
import { resolveChartDomain, scaleChartValue } from './chart-scale';
import type { ChartDatum, ChartLabels, ChartViewProps } from './chart-types';

function numberText(value: number, locale?: string) {
  if (!Number.isFinite(value)) return '—';
  const large = Math.abs(value) >= 1e6 || (value !== 0 && Math.abs(value) < 1e-4);
  try {
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: 4,
      ...(large ? { notation: 'scientific' as const } : {}),
    }).format(value);
  } catch {
    return String(Number(value.toPrecision(6)));
  }
}

function datumDescription(
  datum: ChartDatum,
  labels: ChartLabels,
  format: (value: number, context: 'x' | 'y' | 'value') => string
) {
  return datum.type === 'scatter'
    ? `${datum.seriesName} · ${datum.label} · ${labels.x} ${format(datum.x!, 'x')}, ${labels.y} ${format(datum.y!, 'y')}`
    : `${datum.label} · ${datum.seriesName}: ${format(datum.value, 'value')}`;
}

export function ChartView(props: ChartViewProps): React.ReactNode {
  const { locale } = useZuviConfig();
  const {
    type = 'line',
    categories,
    series,
    data,
    title,
    description,
    height = props.type === 'sparkline' ? 64 : 300,
    legend = props.type !== 'sparkline',
    grid = props.type !== 'sparkline',
    tooltip = true,
    tooltipMode = 'datum',
    animated = false,
    csv = false,
    showDataTable = props.type !== 'sparkline',
    disabled = false,
    loading = false,
    loadingContent,
    emptyContent,
    error,
    hiddenSeries,
    defaultHiddenSeries = [],
    onHiddenSeriesChange,
    value,
    defaultValue = null,
    onChange,
    onDataClick,
    renderTooltip,
    valueFormatter,
    xLabel,
    yLabel,
    xDomain,
    yDomain,
    labels: labelsProp,
    onViewStatus,
    onError,
    classNames,
  } = props;
  const labels = { ...locale.chart, ...labelsProp };
  const stack = 'stack' in props ? props.stack : false;
  const orientation = 'orientation' in props ? props.orientation : undefined;
  const minimum = 'min' in props ? props.min : undefined;
  const maximum = 'max' in props ? props.max : undefined;
  const bubble = type === 'scatter' && 'bubble' in props && props.bubble;
  const shapeOptions = React.useMemo(
    () => ({
      stack,
      orientation,
      markerPadding: type === 'scatter' ? (bubble ? 25 : 10) : 0,
      bottomPadding: xLabel ? 54 : 36,
    }),
    [stack, orientation, type, bubble, xLabel]
  );
  const model = React.useMemo(
    () => normalizeChartData({ type, categories, series, data, stack, min: minimum, max: maximum }),
    [type, categories, series, data, stack, minimum, maximum]
  );
  const [hidden, setHidden] = useControllableState<readonly string[]>({
    value: hiddenSeries,
    defaultValue: defaultHiddenSeries,
    onChange: (next) => onHiddenSeriesChange?.([...next]),
  });
  const visible = React.useMemo(() => deriveVisibleChartModel(model, hidden), [model, hidden]);
  const [selectedId, setSelectedId] = useControllableState<string | null>({
    value,
    defaultValue,
    onChange,
  });
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [focusedId, setFocusedId] = React.useState<string | null>(null);
  const [tableOpen, setTableOpen] = React.useState(false);
  const [soloId, setSoloId] = React.useState<string | null>(null);
  const downloads = React.useRef(new Set<string>());
  const [size, setSize] = React.useState({ width: 640, height: 300 });
  const plotRef = React.useRef<HTMLDivElement | null>(null);
  const anchorRef = React.useRef<HTMLSpanElement | null>(null);
  const buttonRefs = React.useRef(new Map<string, HTMLButtonElement>());
  const id = React.useId().replace(/:/g, '');
  const plotHeight = Number.isFinite(height)
    ? Math.max(type === 'sparkline' ? 32 : 180, Math.min(800, height))
    : type === 'sparkline'
      ? 64
      : 300;
  const baseGeometry = React.useMemo(
    () =>
      buildChartGeometry(
        visible,
        { width: size.width, height: plotHeight },
        { xDomain, yDomain, grid, ...shapeOptions }
      ),
    [visible, size.width, plotHeight, xDomain, yDomain, grid, shapeOptions]
  );
  const supportsViewport =
    ['line', 'area', 'bar', 'scatter'].includes(type) && !baseGeometry.horizontal;
  const viewportEnabled =
    supportsViewport &&
    Boolean(props.zoom || props.brush) &&
    !disabled &&
    !loading &&
    !model.invalid &&
    !error;
  const viewport = useChartViewport(
    props,
    plotRef,
    baseGeometry.xDomain,
    {
      x: baseGeometry.plot.left,
      y: baseGeometry.plot.top,
      width: baseGeometry.plot.width,
      height: baseGeometry.plot.height,
    },
    viewportEnabled
  );
  const geometry = React.useMemo(() => {
    if (!supportsViewport || !viewport.range) return baseGeometry;
    const current = buildChartGeometry(
      visible,
      { width: size.width, height: plotHeight },
      { xDomain: viewport.range, yDomain, grid, ...shapeOptions }
    );
    const inside = (datum: ChartDatum) => {
      const x = datum.x ?? datum.index;
      return x >= viewport.range![0] && x <= viewport.range![1];
    };
    current.marks = current.marks.filter((mark) => inside(mark.datum));
    const filtered = {
      ...visible,
      series: visible.series.map((series) => ({
        ...series,
        values: series.values.map((value, index) =>
          index >= viewport.range![0] && index <= viewport.range![1] ? value : null
        ),
        points: series.points.filter(
          (point) => point.x >= viewport.range![0] && point.x <= viewport.range![1]
        ),
      })),
    };
    current.seriesPaths = buildChartGeometry(
      filtered,
      { width: size.width, height: plotHeight },
      { xDomain: viewport.range, yDomain: current.yDomain, grid, ...shapeOptions }
    ).seriesPaths;
    return current;
  }, [
    viewport.range,
    baseGeometry,
    visible,
    size.width,
    plotHeight,
    yDomain,
    grid,
    shapeOptions,
    supportsViewport,
  ]);
  const datums = React.useMemo(() => getChartDatums(visible), [visible]);
  const activeMark = geometry.marks.find((mark) => mark.datum.id === activeId);
  const active = activeMark?.datum ?? datums.find((datum) => datum.id === activeId);
  const focusableMarks = geometry.marks;
  const firstId = focusableMarks[0]?.datum.id ?? null;
  const effectiveFocus = focusableMarks.some((mark) => mark.datum.id === focusedId)
    ? focusedId
    : firstId;
  const hiddenAll = hasChartData(model) && !hasChartData(visible);
  const invalid = model.invalid || (error !== undefined && error !== null && error !== false);
  const status = loading
    ? 'loading'
    : invalid
      ? 'error'
      : !hasChartData(visible)
        ? 'empty'
        : 'ready';
  const blocked = disabled || loading || invalid || status === 'empty';
  const focusedRef = React.useRef(focusedId);
  focusedRef.current = focusedId;
  const callbacks = React.useRef({ onViewStatus, onError, onDataClick });
  callbacks.current = { onViewStatus, onError, onDataClick };
  const format = React.useCallback(
    (numeric: number, context: 'x' | 'y' | 'value') => {
      if (valueFormatter) {
        try {
          return String(valueFormatter(numeric, context));
        } catch {
          /* A presentation callback must not corrupt geometry. */
        }
      }
      return numberText(numeric, locale.code);
    },
    [valueFormatter, locale.code]
  );
  React.useEffect(() => {
    callbacks.current.onViewStatus(status);
  }, [status]);
  React.useEffect(() => {
    if (
      soloId &&
      !visible.series.some((item) => item.id === soloId) &&
      !visible.slices.some((item) => item.id === soloId)
    )
      setSoloId(null);
  }, [soloId, visible]);
  React.useEffect(() => {
    if (model.invalid)
      callbacks.current.onError?.({
        code: 'data',
        message: 'Chart data does not match the chart type.',
        issues: model.issues,
      });
  }, [model]);
  React.useEffect(() => {
    const plot = plotRef.current;
    if (!plot) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const width = plot.getBoundingClientRect().width;
      if (width > 0)
        setSize((previous) =>
          previous.width === width ? previous : { width, height: plotHeight }
        );
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    measure();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
    observer?.observe(plot);
    window.addEventListener('resize', schedule);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [plotHeight]);
  React.useEffect(() => {
    if (blocked || !tooltip || !geometry.marks.some((mark) => mark.datum.id === activeId))
      setActiveId(null);
  }, [blocked, tooltip, geometry.marks, activeId]);
  React.useEffect(() => {
    const focused = focusedId ? buttonRefs.current.get(focusedId) : null;
    if (focusedId && (blocked || !focused || document.activeElement !== focused)) {
      setFocusedId(null);
      setActiveId(null);
    }
  }, [focusedId, firstId, visible, blocked, viewport.range]);

  const toggleSeries = (seriesId: string) => {
    if (disabled || loading) return;
    setActiveId(null);
    const normalized = [...new Set(hidden)];
    setHidden(
      normalized.includes(seriesId)
        ? normalized.filter((current) => current !== seriesId)
        : [...normalized, seriesId]
    );
  };
  const activateDatum = (datum: ChartDatum, event: React.MouseEvent<Element>) => {
    if (blocked || event.defaultPrevented) return;
    if (event.detail !== 0 && performance.now() < viewport.suppressClickUntil.current) {
      event.preventDefault();
      return;
    }
    callbacks.current.onDataClick?.(datum, event);
    if (event.defaultPrevented) return;
    setSelectedId(selectedId === datum.id ? null : datum.id);
    setActiveId(tooltip ? datum.id : null);
  };
  const showDatum = (mark: ChartMark) => {
    if (!blocked && tooltip) setActiveId(mark.datum.id);
  };
  const moveFocus = (datumId: string, direction: number | 'first' | 'last') => {
    const current = focusableMarks.findIndex((mark) => mark.datum.id === datumId);
    const next =
      direction === 'first'
        ? 0
        : direction === 'last'
          ? focusableMarks.length - 1
          : Math.max(0, Math.min(focusableMarks.length - 1, current + direction));
    const mark = focusableMarks[next];
    if (mark) {
      setFocusedId(mark.datum.id);
      buttonRefs.current.get(mark.datum.id)?.focus({ preventScroll: true });
      showDatum(mark);
    }
  };
  const radial = type === 'pie' || type === 'donut';
  const usesSliceData = ['pie', 'donut', 'treemap', 'funnel', 'gauge', 'waterfall'].includes(type);
  const legendItems = usesSliceData
    ? model.slices.map((slice) => ({ id: slice.id, name: slice.label, color: slice.color }))
    : model.series;
  const groupedTooltip =
    tooltipMode === 'crosshair' && ['line', 'area', 'bar'].includes(type) && !geometry.horizontal;
  const tooltipDatums =
    groupedTooltip && active
      ? datums.filter((datum) => datum.index === active.index)
      : active
        ? [active]
        : [];
  const bubbleValues = React.useMemo(
    () =>
      model.series.flatMap((series) =>
        series.points.flatMap((point) => (point.value === undefined ? [] : [point.value]))
      ),
    [model]
  );
  const suppliedBubbleDomain =
    type === 'scatter' && 'bubbleDomain' in props ? props.bubbleDomain : undefined;
  const sizeDomain =
    suppliedBubbleDomain &&
    suppliedBubbleDomain.every(Number.isFinite) &&
    suppliedBubbleDomain[0] >= 0 &&
    suppliedBubbleDomain[0] < suppliedBubbleDomain[1]
      ? suppliedBubbleDomain
      : resolveChartDomain(bubbleValues);
  const pointRadius = (datum: ChartDatum) => {
    const emphasized = selectedId === datum.id || activeId === datum.id;
    return bubble && datum.magnitude !== undefined
      ? `${bubbleRadius(datum.magnitude, sizeDomain) * (emphasized ? 1.15 : 1)}px`
      : emphasized
        ? 'calc(var(--zuvi-chart-point-radius) * 1.4)'
        : 'var(--zuvi-chart-point-radius)';
  };
  const opacity = (datum: ChartDatum) =>
    soloId && datum.seriesId !== soloId ? 0.16 : selectedId && selectedId !== datum.id ? 0.55 : 1;
  const downloadCsv = () => {
    if (disabled || loading || model.invalid) return;
    const url = URL.createObjectURL(
      new Blob([buildChartCsv(model)], { type: 'text/csv;charset=utf-8' })
    );
    downloads.current.add(url);
    const anchor = document.createElement('a');
    anchor.href = url;
    const filename =
      typeof title === 'string'
        ? [...title]
            .filter((character) => character.charCodeAt(0) >= 32 && !/[<>:"/\\|?*]/.test(character))
            .join('')
            .slice(0, 80)
        : 'chart';
    anchor.download = `${filename || 'chart'}.csv`;
    anchor.click();
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
      downloads.current.delete(url);
    }, 1000);
  };
  React.useEffect(
    () => () => {
      downloads.current.forEach((url) => URL.revokeObjectURL(url));
      downloads.current.clear();
    },
    []
  );
  const chartName = typeof title === 'string' ? title : labels.chart;
  const tooltipPositionKey = activeMark
    ? `${activeMark.datum.id}/${activeMark.x.toFixed(2)}/${activeMark.y.toFixed(2)}/${size.width}`
    : '';

  return (
    <>
      {legend && legendItems.length ? (
        <div
          data-part="legend"
          role="group"
          aria-label={labels.legend}
          className={cx('zuvi-chart-legend', classNames?.legend)}
        >
          {legendItems.map((item, index) => (
            <button
              key={item.id}
              type="button"
              data-part="legend-item"
              data-series-id={item.id}
              data-solo={soloId === item.id ? '' : undefined}
              aria-pressed={!hidden.includes(item.id)}
              disabled={disabled || loading}
              className={cx('zuvi-chart-legend-item', classNames?.legendItem)}
              onClick={(event) => {
                if (event.defaultPrevented || disabled || loading) return;
                if (event.shiftKey) setSoloId(soloId === item.id ? null : item.id);
                else {
                  setSoloId(null);
                  toggleSeries(item.id);
                }
              }}
              onKeyDown={(event) => {
                if (
                  event.defaultPrevented ||
                  disabled ||
                  loading ||
                  !event.shiftKey ||
                  isImeComposing(event.nativeEvent)
                )
                  return;
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSoloId(soloId === item.id ? null : item.id);
                }
              }}
              onKeyUp={(event) => {
                if (event.shiftKey && event.key === ' ') event.preventDefault();
              }}
            >
              <span
                className="zuvi-chart-legend-symbol"
                style={{
                  backgroundColor: item.color,
                  ...(index % 2 ? { borderRadius: '50%' } : {}),
                }}
                aria-hidden="true"
              />
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      ) : null}
      <div
        ref={plotRef}
        data-part="plot"
        className={cx('zuvi-chart-plot', classNames?.plot)}
        style={{ height: plotHeight }}
        data-visible-datum-count={geometry.marks.length}
        data-width={size.width}
        data-height={plotHeight}
        data-animated={animated ? '' : undefined}
        data-zoomed={viewport.range ? '' : undefined}
        data-viewport-enabled={viewportEnabled ? '' : undefined}
        tabIndex={viewportEnabled ? 0 : undefined}
        aria-label={
          viewportEnabled
            ? [props.zoom ? labels.zoomHint : '', props.brush ? labels.brushHint : '']
                .filter(Boolean)
                .join(' · ')
            : undefined
        }
        role={viewportEnabled ? 'group' : undefined}
        {...viewport.handlers}
        onMouseMove={(event) => {
          if (event.defaultPrevented || !groupedTooltip || blocked || viewport.selection) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          const x = event.clientX - bounds.left;
          const y = event.clientY - bounds.top;
          if (
            x < geometry.plot.left ||
            x > geometry.plot.left + geometry.plot.width ||
            y < geometry.plot.top ||
            y > geometry.plot.top + geometry.plot.height
          )
            return;
          const index = nearestChartCategory(geometry.marks, x);
          const mark = geometry.marks.find((mark) => mark.datum.index === index);
          if (mark) setActiveId(mark.datum.id);
        }}
        onMouseLeave={() => {
          if (!focusedRef.current) setActiveId(null);
        }}
      >
        <svg
          data-part="svg"
          className={cx('zuvi-chart-svg', classNames?.svg)}
          role="img"
          aria-label={chartName}
          aria-describedby={`${id}-description`}
          width="100%"
          height={plotHeight}
          viewBox={`0 0 ${size.width} ${plotHeight}`}
        >
          <title>{chartName}</title>
          <desc id={`${id}-description`}>
            {typeof description === 'string' ? description : labels.instructions}
          </desc>
          {geometry.radial ? (
            <circle
              cx={geometry.radial.cx}
              cy={geometry.radial.cy}
              r={
                geometry.radial.innerRadius
                  ? (geometry.radial.r + geometry.radial.innerRadius) / 2
                  : geometry.radial.r
              }
              fill={geometry.radial.innerRadius ? 'none' : 'var(--zuvi-color-bg-muted)'}
              stroke={geometry.radial.innerRadius ? 'var(--zuvi-color-bg-muted)' : 'none'}
              strokeWidth={geometry.radial.r - geometry.radial.innerRadius}
            />
          ) : null}
          {geometry.gauge ? (
            <path d={geometry.gauge.backgroundPath} fill="var(--zuvi-color-bg-muted)" />
          ) : null}
          {geometry.radar && status === 'ready' ? (
            <g data-part="radar-grid" aria-hidden="true">
              {grid
                ? geometry.radar.rings.map((ring) => (
                    <polygon
                      key={ring}
                      points={geometry
                        .radar!.axes.map(
                          (axis) =>
                            `${geometry.radar!.cx + Math.cos(axis.angle) * geometry.radar!.r * ring},${geometry.radar!.cy + Math.sin(axis.angle) * geometry.radar!.r * ring}`
                        )
                        .join(' ')}
                      fill="none"
                      className="zuvi-chart-grid"
                    />
                  ))
                : null}
              {grid
                ? geometry.radar.rings.map((ring) => (
                    <text
                      key={`scale-${ring}`}
                      data-part="radar-tick"
                      x={geometry.radar!.cx + 6}
                      y={geometry.radar!.cy - geometry.radar!.r * ring + 4}
                      className="zuvi-chart-tick"
                    >
                      {format(scaleChartValue(ring, [0, 1], geometry.yDomain), 'value')}
                    </text>
                  ))
                : null}
              {geometry.radar.axes.map((axis, index) => (
                <g key={index}>
                  <line
                    x1={geometry.radar!.cx}
                    y1={geometry.radar!.cy}
                    x2={geometry.radar!.cx + Math.cos(axis.angle) * geometry.radar!.r}
                    y2={geometry.radar!.cy + Math.sin(axis.angle) * geometry.radar!.r}
                    className="zuvi-chart-grid"
                  />
                  <text
                    x={geometry.radar!.cx + Math.cos(axis.angle) * (geometry.radar!.r + 14)}
                    y={geometry.radar!.cy + Math.sin(axis.angle) * (geometry.radar!.r + 14) + 4}
                    textAnchor="middle"
                    className="zuvi-chart-tick"
                  >
                    <title>{axis.label}</title>
                    {chartAxisText(axis.label, 70)}
                  </text>
                </g>
              ))}
            </g>
          ) : null}
          {geometry.backgrounds?.map((rect, index) => (
            <rect key={index} {...rect} fill="var(--zuvi-color-bg-muted)" aria-hidden="true" />
          ))}
          {!radial &&
          !['radar', 'treemap', 'funnel', 'gauge', 'sparkline'].includes(type) &&
          status === 'ready' ? (
            <>
              {grid
                ? (geometry.horizontal ? geometry.xTicks : geometry.yTicks).map((tick) => (
                    <line
                      key={tick.value}
                      data-part="grid"
                      x1={geometry.horizontal ? tick.position : geometry.plot.left}
                      x2={
                        geometry.horizontal
                          ? tick.position
                          : geometry.plot.left + geometry.plot.width
                      }
                      y1={geometry.horizontal ? geometry.plot.top : tick.position}
                      y2={
                        geometry.horizontal
                          ? geometry.plot.top + geometry.plot.height
                          : tick.position
                      }
                      className="zuvi-chart-grid"
                    />
                  ))
                : null}
              <line
                data-part="axis"
                x1={geometry.plot.left}
                x2={geometry.plot.left + geometry.plot.width}
                y1={
                  geometry.horizontal ? geometry.plot.top + geometry.plot.height : geometry.baseline
                }
                y2={
                  geometry.horizontal ? geometry.plot.top + geometry.plot.height : geometry.baseline
                }
                className="zuvi-chart-axis"
              />
              <line
                data-part="axis"
                data-zero-axis={geometry.horizontal ? '' : undefined}
                x1={geometry.horizontal ? geometry.baseline : geometry.plot.left}
                x2={geometry.horizontal ? geometry.baseline : geometry.plot.left}
                y1={geometry.plot.top}
                y2={geometry.plot.top + geometry.plot.height}
                className="zuvi-chart-axis"
              />
              {geometry.yTicks.map((tick) => (
                <text
                  key={tick.value}
                  data-part="y-tick"
                  x={geometry.plot.left - 9}
                  y={tick.position + 4}
                  textAnchor="end"
                  className="zuvi-chart-tick"
                >
                  <title>
                    {!geometry.horizontal && type !== 'heatmap' && valueFormatter
                      ? format(tick.value, 'y')
                      : tick.label}
                  </title>
                  {chartAxisText(
                    !geometry.horizontal && type !== 'heatmap' && valueFormatter
                      ? format(tick.value, 'y')
                      : tick.label,
                    geometry.plot.left - 10
                  )}
                </text>
              ))}
              {geometry.xTicks.map((tick, index) => {
                const label =
                  (type === 'scatter' || geometry.horizontal) && valueFormatter
                    ? format(tick.value, 'x')
                    : tick.label;
                const atStart = index === 0;
                const atEnd = index === geometry.xTicks.length - 1;
                const previous = geometry.xTicks[index - 1]?.position ?? geometry.plot.left;
                const next =
                  geometry.xTicks[index + 1]?.position ?? geometry.plot.left + geometry.plot.width;
                const available =
                  geometry.xTicks.length === 1
                    ? geometry.plot.width
                    : atStart
                      ? next - tick.position - 6
                      : atEnd
                        ? tick.position - previous - 6
                        : Math.min(tick.position - previous, next - tick.position) - 6;
                return (
                  <text
                    key={tick.value}
                    data-part="x-tick"
                    x={tick.position}
                    y={geometry.plot.top + geometry.plot.height + 22}
                    textAnchor={
                      geometry.xTicks.length === 1
                        ? 'middle'
                        : atStart
                          ? 'start'
                          : atEnd
                            ? 'end'
                            : 'middle'
                    }
                    className="zuvi-chart-tick"
                  >
                    <title>{label}</title>
                    {chartAxisText(label, Math.max(16, available))}
                  </text>
                );
              })}
              {xLabel ? (
                <text
                  x={geometry.plot.left + geometry.plot.width / 2}
                  y={plotHeight - 5}
                  textAnchor="middle"
                  className="zuvi-chart-axis-label"
                >
                  {xLabel}
                </text>
              ) : null}
              {yLabel ? (
                <text x={10} y={12} className="zuvi-chart-axis-label">
                  {yLabel}
                </text>
              ) : null}
            </>
          ) : null}
          {status === 'ready'
            ? geometry.seriesPaths.map((path, index) => (
                <g
                  key={path.id}
                  data-series-id={path.id}
                  opacity={soloId && path.id !== soloId ? 0.16 : 1}
                >
                  {path.areaPath ? (
                    <path d={path.areaPath} fill={path.color} opacity="0.12" />
                  ) : null}
                  {path.linePath ? (
                    <path
                      d={path.linePath}
                      fill="none"
                      stroke={path.color}
                      className="zuvi-chart-line"
                      strokeDasharray={
                        path.dashed
                          ? '5 4'
                          : index % 3 === 1
                            ? '6 3'
                            : index % 3 === 2
                              ? '2 3'
                              : undefined
                      }
                    />
                  ) : null}
                </g>
              ))
            : null}
          {status === 'ready'
            ? geometry.marks.map((mark) => (
                <g
                  key={mark.datum.id}
                  aria-hidden="true"
                  className={animated ? 'zuvi-chart-animated-mark' : undefined}
                >
                  {mark.rect ? (
                    <rect
                      data-part="mark"
                      data-datum-id={mark.datum.id}
                      data-series-id={mark.datum.seriesId}
                      x={mark.rect.x}
                      y={mark.rect.y}
                      width={mark.rect.width}
                      height={mark.rect.height}
                      rx={Math.min(3, mark.rect.width / 5)}
                      fill={mark.datum.color}
                      opacity={opacity(mark.datum)}
                      onMouseEnter={() => showDatum(mark)}
                      onMouseLeave={() => {
                        if (!focusedRef.current) setActiveId(null);
                      }}
                      onClick={(event) => activateDatum(mark.datum, event)}
                    />
                  ) : mark.kind === 'slice' ? (
                    <path
                      data-part="mark"
                      data-datum-id={mark.datum.id}
                      data-series-id={mark.datum.seriesId}
                      d={mark.path}
                      fill={mark.datum.color}
                      stroke="var(--zuvi-chart-bg)"
                      strokeWidth="2"
                      opacity={opacity(mark.datum)}
                      onMouseEnter={() => showDatum(mark)}
                      onMouseLeave={() => {
                        if (!focusedRef.current) setActiveId(null);
                      }}
                      onClick={(event) => activateDatum(mark.datum, event)}
                    />
                  ) : (
                    <circle
                      data-part="mark"
                      data-datum-id={mark.datum.id}
                      data-series-id={mark.datum.seriesId}
                      cx={mark.x}
                      cy={mark.y}
                      style={{ r: pointRadius(mark.datum) } as React.CSSProperties}
                      onMouseEnter={() => showDatum(mark)}
                      onMouseLeave={() => {
                        if (!focusedRef.current) setActiveId(null);
                      }}
                      onClick={(event) => activateDatum(mark.datum, event)}
                      fill={mark.datum.color}
                      stroke="var(--zuvi-chart-bg)"
                      strokeWidth="2"
                      opacity={opacity(mark.datum)}
                    />
                  )}
                  {mark.label ? (
                    <text
                      data-part="mark-label"
                      x={mark.x}
                      y={mark.y + 4}
                      textAnchor="middle"
                      className={
                        mark.kind === 'tile' || mark.kind === 'slice'
                          ? 'zuvi-chart-mark-label'
                          : 'zuvi-chart-cell-label'
                      }
                      style={{ pointerEvents: 'none' }}
                    >
                      <title>{mark.label}</title>
                      {chartAxisText(
                        mark.label,
                        mark.rect ? Math.max(10, mark.rect.width - 12) : geometry.plot.width / 2
                      )}
                    </text>
                  ) : null}
                </g>
              ))
            : null}
          {type === 'donut' && status === 'ready' && geometry.radial ? (
            <>
              <text
                data-part="total"
                x={geometry.radial.cx}
                y={geometry.radial.cy + 3}
                textAnchor="middle"
                className="zuvi-chart-total"
              >
                {geometry.radial.total === null ? '—' : format(geometry.radial.total, 'value')}
              </text>
              <text
                x={geometry.radial.cx}
                y={geometry.radial.cy + 24}
                textAnchor="middle"
                className="zuvi-chart-tick"
              >
                {labels.value}
              </text>
            </>
          ) : null}
          {geometry.gauge && status === 'ready' ? (
            <g data-part="gauge-summary">
              <text
                x={geometry.gauge.cx}
                y={geometry.gauge.cy + 3}
                textAnchor="middle"
                className="zuvi-chart-total"
              >
                {format(geometry.gauge.value, 'value')}
              </text>
              <text
                x={geometry.gauge.cx}
                y={geometry.gauge.cy + 23}
                textAnchor="middle"
                className="zuvi-chart-tick"
              >
                {format(geometry.gauge.min, 'value')} – {format(geometry.gauge.max, 'value')}
              </text>
            </g>
          ) : null}
          {groupedTooltip && activeMark ? (
            <line
              data-part="crosshair"
              x1={activeMark.x}
              x2={activeMark.x}
              y1={geometry.plot.top}
              y2={geometry.plot.top + geometry.plot.height}
              className={cx('zuvi-chart-crosshair', classNames?.crosshair)}
              aria-hidden="true"
            />
          ) : null}
          {viewport.selection ? (
            <rect
              data-part="brush"
              {...viewport.selection}
              className={cx('zuvi-chart-brush', classNames?.brush)}
              aria-hidden="true"
            />
          ) : null}
        </svg>
        <div
          className="zuvi-chart-hit-layer"
          onMouseLeave={() => {
            if (!focusedRef.current) setActiveId(null);
          }}
        >
          {!blocked
            ? geometry.marks.map((mark) => (
                <button
                  key={mark.datum.id}
                  type="button"
                  data-part="datum"
                  data-datum-id={mark.datum.id}
                  ref={(node) => {
                    if (node) buttonRefs.current.set(mark.datum.id, node);
                    else buttonRefs.current.delete(mark.datum.id);
                  }}
                  tabIndex={mark.datum.id === effectiveFocus ? 0 : -1}
                  aria-label={datumDescription(mark.datum, labels, format)}
                  aria-pressed={selectedId === mark.datum.id}
                  aria-describedby={activeId === mark.datum.id ? `${id}-tooltip` : `${id}-keys`}
                  className="zuvi-chart-datum"
                  style={{
                    left: mark.x,
                    top: mark.y,
                    ...(mark.rect
                      ? {
                          width: Math.max(24, mark.rect.width),
                          height: Math.max(24, mark.rect.height),
                          left: mark.rect.x + mark.rect.width / 2,
                          top: mark.rect.y + mark.rect.height / 2,
                        }
                      : {}),
                  }}
                  onClick={(event) => activateDatum(mark.datum, event)}
                  onMouseEnter={() => showDatum(mark)}
                  onMouseLeave={() => {
                    if (focusedRef.current !== mark.datum.id) setActiveId(null);
                  }}
                  onFocus={() => {
                    setFocusedId(mark.datum.id);
                    showDatum(mark);
                  }}
                  onBlur={() => {
                    setFocusedId(null);
                    setActiveId(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.defaultPrevented || isImeComposing(event.nativeEvent)) return;
                    if (event.key === 'Escape' && activeId) {
                      event.preventDefault();
                      event.stopPropagation();
                      setActiveId(null);
                    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                      event.preventDefault();
                      moveFocus(mark.datum.id, 1);
                    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                      event.preventDefault();
                      moveFocus(mark.datum.id, -1);
                    } else if (event.key === 'Home') {
                      event.preventDefault();
                      moveFocus(mark.datum.id, 'first');
                    } else if (event.key === 'End') {
                      event.preventDefault();
                      moveFocus(mark.datum.id, 'last');
                    }
                  }}
                />
              ))
            : null}
        </div>
        <span id={`${id}-keys`} className="zuvi-chart-sr-only">
          {labels.instructions}
        </span>
        {activeMark && active && !blocked && tooltip ? (
          <>
            <span
              ref={anchorRef}
              className="zuvi-chart-tooltip-anchor"
              style={{ left: activeMark.x, top: activeMark.y }}
            />
            <FloatingPanel
              key={tooltipPositionKey}
              open
              anchorRef={anchorRef}
              side="top"
              align="center"
              offsetVariable="--zuvi-space-2"
            >
              <div
                id={`${id}-tooltip`}
                role="tooltip"
                data-part="tooltip"
                className={cx('zuvi-chart-tooltip', classNames?.tooltip)}
              >
                {renderTooltip ? (
                  renderTooltip(active)
                ) : groupedTooltip ? (
                  <>
                    <strong>{active.label}</strong>
                    {tooltipDatums.map((datum) => (
                      <span key={datum.id} className="zuvi-chart-tooltip-row">
                        <span
                          className="zuvi-chart-color-dot"
                          style={{ background: datum.color }}
                          aria-hidden="true"
                        />
                        {datum.seriesName}
                        <b>{format(datum.value, 'value')}</b>
                      </span>
                    ))}
                  </>
                ) : (
                  <>
                    <strong>{active.label}</strong>
                    <span className="zuvi-chart-tooltip-row">
                      <span
                        className="zuvi-chart-color-dot"
                        aria-hidden="true"
                        style={{ background: active.color }}
                      />
                      {active.seriesName}
                      {type !== 'scatter' || active.magnitude !== undefined ? (
                        <b>{format(active.magnitude ?? active.value, 'value')}</b>
                      ) : null}
                    </span>
                    {type === 'scatter' ? (
                      <span>
                        {labels.x}: {format(active.x!, 'x')} · {labels.y}: {format(active.y!, 'y')}
                      </span>
                    ) : null}
                    {active.percent !== undefined ? (
                      <span>
                        {labels.percent}: {format(active.percent * 100, 'value')}%
                      </span>
                    ) : null}
                  </>
                )}
              </div>
            </FloatingPanel>
          </>
        ) : null}
        {status !== 'ready' ? (
          <div
            role="status"
            data-part={status}
            className={cx(
              'zuvi-chart-state',
              status === 'loading'
                ? classNames?.loading
                : status === 'error'
                  ? classNames?.error
                  : classNames?.empty
            )}
          >
            {status === 'loading' ? (
              loadingContent !== undefined ? (
                loadingContent
              ) : (
                labels.loading
              )
            ) : status === 'error' ? (
              (error ?? labels.invalidData)
            ) : hiddenAll ? (
              <>
                <span>{labels.noVisible}</span>
                <button type="button" disabled={disabled} onClick={() => setHidden([])}>
                  {labels.showAll}
                </button>
              </>
            ) : emptyContent !== undefined ? (
              emptyContent
            ) : (
              labels.empty
            )}
          </div>
        ) : null}
      </div>
      {model.issues.length && !model.invalid ? (
        <p className="zuvi-chart-data-warning" role="status">
          {labels.invalidData}
        </p>
      ) : null}
      {geometry.heatLegend && legend ? (
        <div data-part="heat-legend" className="zuvi-chart-heat-legend">
          <span>{format(geometry.heatLegend.min, 'value')}</span>
          <span className="zuvi-chart-heat-gradient" />
          <span>{format(geometry.heatLegend.max, 'value')}</span>
        </div>
      ) : null}
      {csv || viewport.range ? (
        <div data-part="actions" className={cx('zuvi-chart-actions', classNames?.actions)}>
          {viewport.range ? (
            <button
              type="button"
              aria-label={labels.resetZoom}
              disabled={disabled}
              onClick={(event) => {
                if (!event.defaultPrevented) viewport.reset();
              }}
            >
              <RotateCcw size={15} />
              {labels.resetZoom}
            </button>
          ) : null}
          {csv ? (
            <button
              type="button"
              aria-label={labels.downloadCsv}
              disabled={disabled || loading || model.invalid}
              onClick={(event) => {
                if (!event.defaultPrevented) downloadCsv();
              }}
            >
              <Download size={15} />
              {labels.downloadCsv}
            </button>
          ) : null}
        </div>
      ) : null}
      {props.zoom || props.brush ? (
        <p className="zuvi-chart-interaction-hint">
          {props.zoom ? labels.zoomHint : ''} {props.brush ? labels.brushHint : ''}
        </p>
      ) : null}
      {showDataTable ? (
        <details
          data-part="data-table"
          className={cx('zuvi-chart-data-table', classNames?.dataTable)}
          onToggle={(event) => setTableOpen(event.currentTarget.open)}
        >
          <summary>{labels.dataTable}</summary>
          {tableOpen ? (
            <div
              className="zuvi-chart-table-scroll"
              role="region"
              aria-label={labels.dataTable}
              tabIndex={0}
            >
              {type === 'heatmap' ? (
                <table>
                  <caption>{chartName}</caption>
                  <thead>
                    <tr>
                      <th scope="col">{labels.series}</th>
                      <th scope="col">{labels.category}</th>
                      <th scope="col">{labels.value}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {model.cells?.map((cell) => (
                      <tr key={cell.id}>
                        <th scope="row">{cell.row}</th>
                        <td>{cell.col}</td>
                        <td>{format(cell.value, 'value')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : usesSliceData ? (
                <table>
                  <caption>{chartName}</caption>
                  <thead>
                    <tr>
                      <th scope="col">{labels.category}</th>
                      <th scope="col">{labels.value}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {model.slices.map((slice) => (
                      <tr key={slice.id}>
                        <th scope="row">{slice.label}</th>
                        <td>{format(slice.value, 'value')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : type === 'scatter' ? (
                <table>
                  <caption>{chartName}</caption>
                  <thead>
                    <tr>
                      <th scope="col">{labels.series}</th>
                      <th scope="col">{labels.category}</th>
                      <th scope="col">{xLabel ?? labels.x}</th>
                      <th scope="col">{yLabel ?? labels.y}</th>
                      {bubble ? <th scope="col">{labels.value}</th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {model.series.flatMap((item) =>
                      item.points.map((point) => (
                        <tr key={`${item.id}:${point.id}`}>
                          <th scope="row">{item.name}</th>
                          <td>{point.label ?? point.id}</td>
                          <td>{format(point.x, 'x')}</td>
                          <td>{format(point.y, 'y')}</td>
                          {bubble ? (
                            <td>
                              {point.value === undefined ? '—' : format(point.value, 'value')}
                            </td>
                          ) : null}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                <table>
                  <caption>{chartName}</caption>
                  <thead>
                    <tr>
                      <th scope="col">{xLabel ?? labels.category}</th>
                      {model.series.map((item) => (
                        <th scope="col" key={item.id}>
                          {item.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {model.categories.map((category, index) => (
                      <tr key={index}>
                        <th scope="row">{category}</th>
                        {model.series.map((item) => (
                          <td key={item.id}>
                            {item.values[index] === null
                              ? '—'
                              : format(item.values[index], 'value')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : null}
        </details>
      ) : null}
    </>
  );
}
