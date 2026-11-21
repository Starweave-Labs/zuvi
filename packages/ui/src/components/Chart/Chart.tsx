'use client';

import * as React from 'react';
import { useZuviConfig } from '../../config';
import { cx } from '../../utils';
import type { ChartProps, ChartStatus, ChartViewProps } from './chart-types';
import './Chart.css';

const chartProperties = new Set(
  'type categories series data title description height legend grid tooltip showDataTable disabled loading loadingContent emptyContent error hiddenSeries defaultHiddenSeries onHiddenSeriesChange value defaultValue onChange onDataClick renderTooltip valueFormatter xLabel yLabel xDomain yDomain labels onReady onStatusChange onError classNames animated tooltipMode zoom brush viewRange defaultViewRange onViewRangeChange csv stack orientation bubble bubbleDomain min max'.split(
    ' '
  )
);
let viewPromise: Promise<typeof import('./ChartView')> | null = null;
function loadChartView() {
  if (!viewPromise) {
    viewPromise = import('./ChartView').catch((error: unknown) => {
      viewPromise = null;
      throw error;
    });
  }
  return viewPromise;
}

/** Dependency-free SVG charts with a lazily loaded plotting and interaction layer. */
export function Chart({ ref, ...props }: ChartProps): React.ReactNode {
  const { locale } = useZuviConfig();
  const labels = { ...locale.chart, ...props.labels };
  // Chart-only properties never leak onto the native root; all native handlers survive.
  const nativeProps: Record<string, unknown> = { ...props };
  chartProperties.forEach((key) => delete nativeProps[key]);
  const [View, setView] = React.useState<React.ComponentType<ChartViewProps> | null>(null);
  const [status, setStatus] = React.useState<ChartStatus>('loading');
  const [attempt, setAttempt] = React.useState(0);
  const callbacks = React.useRef(props);
  callbacks.current = props;
  React.useEffect(() => {
    callbacks.current.onStatusChange?.(status);
    if (status === 'ready') callbacks.current.onReady?.();
  }, [status]);
  React.useEffect(() => {
    let active = true;
    setStatus('loading');
    loadChartView().then(
      (module) => {
        if (active) setView(() => module.ChartView);
      },
      (cause: unknown) => {
        if (!active) return;
        setStatus('error');
        callbacks.current.onError?.({ code: 'load', message: 'Chart module unavailable.', cause });
      }
    );
    return () => {
      active = false;
    };
  }, [attempt]);
  const pending = status === 'error' ? 'error' : 'loading';
  const compact = props.type === 'sparkline';
  const plotHeight = Number.isFinite(props.height)
    ? Math.max(compact ? 32 : 180, Math.min(800, props.height!))
    : compact
      ? 64
      : 300;

  return (
    <div
      {...nativeProps}
      ref={ref}
      data-part="root"
      data-type={props.type ?? 'line'}
      data-status={status}
      role={props.role ?? 'group'}
      aria-label={
        props['aria-label'] ?? (typeof props.title === 'string' ? props.title : labels.chart)
      }
      aria-busy={status === 'loading'}
      aria-disabled={props.disabled || undefined}
      className={cx('zuvi-chart', props.classNames?.root, props.className)}
      style={props.style}
    >
      {props.title !== undefined || props.description !== undefined ? (
        <div data-part="header" className={cx('zuvi-chart-header', props.classNames?.header)}>
          {(['title', 'description'] as const).map((part) =>
            props[part] !== undefined ? (
              <div
                key={part}
                data-part={part}
                className={cx(`zuvi-chart-${part}`, props.classNames?.[part])}
              >
                {props[part]}
              </div>
            ) : null
          )}
        </div>
      ) : null}
      {View ? (
        <View {...props} labels={labels} onViewStatus={setStatus} />
      ) : (
        <div
          data-part="plot"
          className={cx('zuvi-chart-plot', props.classNames?.plot)}
          style={{ height: plotHeight }}
        >
          <div
            data-part={pending}
            role="status"
            className={cx('zuvi-chart-state', props.classNames?.[pending])}
          >
            {pending === 'error' ? (
              <>
                <span>{labels.error}</span>
                <button
                  type="button"
                  onClick={() => setAttempt((current) => current + 1)}
                  disabled={props.disabled}
                >
                  {labels.retry}
                </button>
              </>
            ) : props.loadingContent !== undefined ? (
              props.loadingContent
            ) : (
              labels.loading
            )}
          </div>
        </div>
      )}
    </div>
  );
}
