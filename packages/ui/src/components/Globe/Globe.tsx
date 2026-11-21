'use client';

import * as React from 'react';
import { useZuviConfig } from '../../config';
import { cx } from '../../utils';
import type { GlobeProps, GlobeSceneProps, GlobeStatus } from './globe-types';
import './Globe.css';

let scenePromise: Promise<typeof import('./GlobeScene')> | null = null;
function loadScene() {
  if (!scenePromise) {
    scenePromise = import('./GlobeScene').catch((error: unknown) => {
      scenePromise = null;
      throw error;
    });
  }
  return scenePromise;
}

/** A self-contained geographic visualization; the renderer loads only on mount. */
export function Globe({
  ref,
  points,
  arcs,
  categories,
  legend,
  hiddenCategories,
  defaultHiddenCategories,
  onHiddenCategoriesChange,
  pointLabels,
  maxLabels,
  valueScale,
  searchable,
  searchValue,
  defaultSearchValue,
  onSearchValueChange,
  focus,
  transitionDuration,
  arcValue,
  defaultArcValue,
  onArcChange,
  onArcClick,
  showArcList,
  renderArcDetails,
  value,
  defaultValue,
  onChange,
  onPointClick,
  view,
  defaultView,
  onViewChange,
  autoRotate,
  rotationSpeed,
  animateArcs,
  interactive,
  disabled,
  controls,
  wheelZoom,
  showPointList,
  renderMode,
  height,
  loading,
  renderTooltip,
  labels: labelsProp,
  onReady,
  onError,
  onStatusChange,
  classNames,
  className,
  style,
  'aria-label': ariaLabel,
  ...rest
}: GlobeProps): React.ReactNode {
  const { locale } = useZuviConfig();
  const labels = { ...locale.globe, ...labelsProp };
  const [Scene, setScene] = React.useState<React.ComponentType<GlobeSceneProps> | null>(null);
  const [status, setStatus] = React.useState<GlobeStatus>('loading');
  const [renderer, setRenderer] = React.useState<'webgl' | '2d' | null>(null);
  const [attempt, setAttempt] = React.useState(0);
  const callbacks = React.useRef({ onReady, onError, onStatusChange });
  callbacks.current = { onReady, onError, onStatusChange };
  const lastStatus = React.useRef<{ status: GlobeStatus | null; renderer: 'webgl' | '2d' | null }>({
    status: null,
    renderer: null,
  });
  const onSceneStatus = React.useCallback(
    (next: GlobeStatus, nextRenderer: 'webgl' | '2d' | null) => {
      const previous = lastStatus.current;
      lastStatus.current = { status: next, renderer: nextRenderer };
      setStatus(next);
      setRenderer(nextRenderer);
      if (previous.status !== next) callbacks.current.onStatusChange?.(next);
      if (
        nextRenderer &&
        (next === 'ready' || next === 'fallback') &&
        (previous.renderer !== nextRenderer || previous.status === 'loading')
      ) {
        callbacks.current.onReady?.({ renderer: nextRenderer });
      }
    },
    []
  );
  const retry = React.useCallback(() => setAttempt((current) => current + 1), []);

  React.useEffect(() => {
    let active = true;
    onSceneStatus('loading', null);
    loadScene().then(
      (module) => {
        if (active) setScene(() => module.GlobeScene);
      },
      (cause: unknown) => {
        if (!active) return;
        onSceneStatus('error', null);
        callbacks.current.onError?.({
          code: 'load',
          message: 'The globe module could not be loaded.',
          cause,
        });
      }
    );
    return () => {
      active = false;
    };
  }, [attempt, onSceneStatus]);

  return (
    <div
      {...rest}
      ref={ref}
      data-part="root"
      data-status={status}
      data-renderer={renderer ?? undefined}
      data-disabled={disabled ? '' : undefined}
      role={rest.role ?? 'group'}
      aria-label={ariaLabel ?? labels.label}
      aria-busy={status === 'loading'}
      aria-disabled={disabled || undefined}
      className={cx('zuvi-globe', classNames?.root, className)}
      style={
        {
          ...(height !== undefined
            ? { '--zuvi-globe-height': typeof height === 'number' ? `${height}px` : height }
            : {}),
          ...style,
        } as React.CSSProperties
      }
    >
      {Scene ? (
        <Scene
          points={points}
          arcs={arcs}
          categories={categories}
          legend={legend}
          hiddenCategories={hiddenCategories}
          defaultHiddenCategories={defaultHiddenCategories}
          onHiddenCategoriesChange={onHiddenCategoriesChange}
          pointLabels={pointLabels}
          maxLabels={maxLabels}
          valueScale={valueScale}
          searchable={searchable}
          searchValue={searchValue}
          defaultSearchValue={defaultSearchValue}
          onSearchValueChange={onSearchValueChange}
          focus={focus}
          transitionDuration={transitionDuration}
          arcValue={arcValue}
          defaultArcValue={defaultArcValue}
          onArcChange={onArcChange}
          onArcClick={onArcClick}
          showArcList={showArcList}
          renderArcDetails={renderArcDetails}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          onPointClick={onPointClick}
          view={view}
          defaultView={defaultView}
          onViewChange={onViewChange}
          autoRotate={autoRotate}
          rotationSpeed={rotationSpeed}
          animateArcs={animateArcs}
          interactive={interactive}
          disabled={disabled}
          controls={controls}
          wheelZoom={wheelZoom}
          showPointList={showPointList}
          renderMode={renderMode}
          loading={loading}
          renderTooltip={renderTooltip}
          labels={labels}
          onError={(error) => callbacks.current.onError?.(error)}
          classNames={classNames}
          onSceneStatus={onSceneStatus}
          onRetry={retry}
        />
      ) : (
        <div data-part="stage" className={cx('zuvi-globe-stage', classNames?.stage)}>
          <div className="zuvi-globe-placeholder" aria-hidden="true" />
          {status === 'error' ? (
            <div
              data-part="error"
              role="status"
              className={cx('zuvi-globe-notice', classNames?.error)}
            >
              <span>{labels.error}</span>
              <button
                type="button"
                className="zuvi-globe-retry"
                onClick={retry}
                disabled={disabled}
              >
                {labels.retry}
              </button>
            </div>
          ) : (
            <div
              data-part="loading"
              role="status"
              className={cx('zuvi-globe-loading', classNames?.loading)}
            >
              {loading !== undefined ? loading : labels.loading}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
