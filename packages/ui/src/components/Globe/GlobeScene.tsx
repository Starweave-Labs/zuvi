'use client';

import * as React from 'react';
import {
  Globe as GlobeIcon,
  Pause,
  Play,
  RotateCcw,
  Search,
  Close,
  MapPin,
  ZoomIn,
  ZoomOut,
} from '@zuvi/icons';
import { cx, FloatingPanel, useControllableState } from '../../utils';
import { createGlobeColorResolver } from './globe-color';
import {
  buildGlobeArc,
  coordinateToVector,
  globeRadius,
  normalizeGlobeView,
  projectGlobePoint,
  projectGlobePosition,
} from './globe-geometry';
import { buildGlobeData, normalizeHiddenCategories, searchGlobePoints } from './globe-data';
import { layoutGlobeLabels } from './globe-label-layout';
import { interpolateGlobeView, normalizeGlobeTransitionDuration } from './globe-transition';
import { GLOBE_COASTLINES, getLandDots } from './globe-geography';
import type {
  GlobePalette,
  GlobeRenderer,
  GlobeRendererModule,
  GlobeRendererSnapshot,
} from './globe-renderer-types';
import type {
  GlobeArc,
  GlobeCategory,
  GlobePoint,
  GlobeSceneProps,
  GlobeView,
  GlobeViewChangeReason,
} from './globe-types';

const EMPTY_POINTS: readonly GlobePoint[] = [];
const EMPTY_ARCS: readonly GlobeArc[] = [];
const EMPTY_CATEGORIES: readonly GlobeCategory[] = [];
const EMPTY_HIDDEN: readonly string[] = [];

interface ViewFlight {
  from: GlobeView;
  to: GlobeView;
  duration: number;
  started: number | null;
  pointId?: string;
}
let rendererPromise: Promise<GlobeRendererModule> | null = null;
function loadRenderer() {
  if (!rendererPromise) {
    rendererPromise = import('./globe-renderer').catch((error: unknown) => {
      rendererPromise = null;
      throw error;
    });
  }
  return rendererPromise;
}

interface PointerSession {
  pointers: Map<number, { x: number; y: number }>;
  view: GlobeView;
  startView: GlobeView;
  x: number;
  y: number;
  distance: number;
  moved: boolean;
}

type Size = { width: number; height: number };
function pathFromPositions(
  positions: readonly (readonly [number, number, number])[],
  view: GlobeView,
  size: Size
) {
  let path = '';
  let drawing = false;
  for (const position of positions) {
    const projected = projectGlobePosition(position, view, size.width, size.height);
    if (!projected.visible) {
      drawing = false;
      continue;
    }
    path += `${drawing ? 'L' : 'M'}${projected.x.toFixed(1)},${projected.y.toFixed(1)}`;
    drawing = true;
  }
  return path;
}

const coastVectors = GLOBE_COASTLINES.map((ring) => {
  const vectors: [number, number, number][] = [];
  for (let index = 0; index < ring.length; index += 2) {
    vectors.push(coordinateToVector(ring[index + 1], ring[index]));
  }
  return vectors;
});
const gridVectors: [number, number, number][][] = [];
for (const latitude of [-60, -30, 0, 30, 60]) {
  gridVectors.push(
    Array.from({ length: 181 }, (_, index) => coordinateToVector(latitude, index * 2 - 180))
  );
}
for (let longitude = -180; longitude < 180; longitude += 30) {
  gridVectors.push(
    Array.from({ length: 91 }, (_, index) => coordinateToVector(index * 2 - 90, longitude))
  );
}

/** A real geographic fallback, not an empty canvas when GPU support is unavailable. */
function GlobeFallback({
  view,
  size,
  points,
  arcs,
  selectedId,
  selectedArcId,
  id,
}: {
  view: GlobeView;
  size: Size;
  points: readonly GlobePoint[];
  arcs: readonly GlobeArc[];
  selectedId: string | null;
  selectedArcId: string | null;
  id: string;
}) {
  const radius = globeRadius(size.width, size.height, view.zoom);
  const cx = size.width / 2;
  const cy = size.height / 2;
  const routeSamples = React.useMemo(() => {
    const lookup = new Map(points.map((point) => [point.id, point]));
    return arcs.flatMap((arc) => {
      const from = lookup.get(arc.from);
      const to = lookup.get(arc.to);
      if (!from || !to) return [];
      const start = coordinateToVector(from.latitude, from.longitude);
      const end = coordinateToVector(to.latitude, to.longitude);
      if (Math.hypot(start[0] - end[0], start[1] - end[1], start[2] - end[2]) < 1e-7) return [];
      return [{ arc, positions: buildGlobeArc(start, end, arc.altitude) }];
    });
  }, [points, arcs]);
  const land = getLandDots();
  let landPath = '';
  for (let index = 0; index < land.length; index += 2) {
    const point = projectGlobePoint(
      { latitude: land[index + 1], longitude: land[index] },
      view,
      size.width,
      size.height
    );
    if (!point.visible) continue;
    const dot = Math.max(0.65, radius / 190).toFixed(2);
    landPath += `M${point.x.toFixed(1)},${point.y.toFixed(1)}h${dot}v${dot}h-${dot}z`;
  }
  return (
    <svg className="zuvi-globe-map" aria-hidden="true" viewBox={`0 0 ${size.width} ${size.height}`}>
      <defs>
        <radialGradient id={`${id}-ocean`} cx="35%" cy="28%" r="78%">
          <stop offset="0" stopColor="var(--zuvi-globe-land-color)" />
          <stop offset="0.46" stopColor="var(--zuvi-globe-ocean-color)" />
          <stop offset="1" stopColor="var(--zuvi-globe-ocean-color)" />
        </radialGradient>
        <radialGradient id={`${id}-rim`}>
          <stop offset="0.8" stopColor="var(--zuvi-globe-atmosphere-color)" stopOpacity="0" />
          <stop offset="0.93" stopColor="var(--zuvi-globe-atmosphere-color)" stopOpacity="0.18" />
          <stop offset="1" stopColor="var(--zuvi-globe-atmosphere-color)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={radius * 1.1} fill={`url(#${id}-rim)`} />
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={`url(#${id}-ocean)`}
        stroke="var(--zuvi-globe-coast-color)"
        strokeOpacity="0.4"
      />
      <path
        d={gridVectors.map((line) => pathFromPositions(line, view, size)).join('')}
        className="zuvi-globe-grid"
      />
      <path d={landPath} fill="var(--zuvi-globe-land-color)" opacity="0.75" />
      <path
        d={coastVectors.map((line) => pathFromPositions(line, view, size)).join('')}
        className="zuvi-globe-coast"
      />
      {routeSamples.map(({ arc, positions }) => {
        const selected = selectedArcId === arc.id;
        const related = selectedArcId
          ? selected
          : !selectedId || arc.from === selectedId || arc.to === selectedId;
        return (
          <path
            key={arc.id}
            data-arc-id={arc.id}
            data-selected={selected ? '' : undefined}
            d={pathFromPositions(positions, view, size)}
            fill="none"
            stroke={arc.color ?? 'var(--zuvi-globe-arc-color)'}
            opacity={selected ? 1 : related ? 0.86 : 0.24}
            strokeWidth={Math.max(1, (arc.width ?? 0.003) * radius * 2) * (selected ? 1.5 : 1)}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

export function GlobeScene({
  points: pointsProp,
  arcs: arcsProp,
  categories: categoriesProp,
  legend,
  hiddenCategories,
  defaultHiddenCategories = EMPTY_HIDDEN,
  onHiddenCategoriesChange,
  pointLabels = 'none',
  maxLabels = 12,
  valueScale,
  searchable = false,
  searchValue,
  defaultSearchValue = '',
  onSearchValueChange,
  focus,
  transitionDuration = 0,
  arcValue,
  defaultArcValue = null,
  onArcChange,
  onArcClick,
  showArcList = false,
  renderArcDetails,
  value,
  defaultValue = null,
  onChange,
  onPointClick,
  view: viewProp,
  defaultView,
  onViewChange,
  autoRotate = true,
  rotationSpeed = 6,
  animateArcs = true,
  interactive = true,
  disabled = false,
  controls = true,
  wheelZoom = false,
  showPointList = true,
  renderMode = 'auto',
  loading,
  renderTooltip,
  labels,
  onError,
  classNames,
  onSceneStatus,
}: GlobeSceneProps): React.ReactNode {
  const [hidden, setHidden] = useControllableState<readonly string[]>({
    value: hiddenCategories,
    defaultValue: normalizeHiddenCategories(defaultHiddenCategories),
    onChange: (next) => onHiddenCategoriesChange?.([...next]),
  });
  const [query, setQuery] = useControllableState<string>({
    value: searchValue,
    defaultValue: defaultSearchValue,
    onChange: onSearchValueChange,
  });
  const data = React.useMemo(
    () =>
      buildGlobeData(
        pointsProp ?? EMPTY_POINTS,
        arcsProp ?? EMPTY_ARCS,
        categoriesProp ?? EMPTY_CATEGORIES,
        valueScale,
        hidden
      ),
    [pointsProp, arcsProp, categoriesProp, valueScale, hidden]
  );
  const {
    points: allPoints,
    arcs: allArcs,
    renderedPoints: points,
    renderedArcs: arcs,
    categories,
    counts,
  } = data;
  const pointById = React.useMemo(
    () => new Map(allPoints.map((point) => [point.id, point])),
    [allPoints]
  );
  const categoryById = React.useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );
  const searchPoints = React.useMemo(
    () => searchGlobePoints(points, searchable ? query : '', categories),
    [points, searchable, query, categories]
  );
  const initialView = React.useRef(normalizeGlobeView(defaultView));
  const callbacks = React.useRef({
    onViewChange,
    onPointClick,
    onArcClick,
    onError,
    onSceneStatus,
  });
  callbacks.current = { onViewChange, onPointClick, onArcClick, onError, onSceneStatus };
  const reason = React.useRef<GlobeViewChangeReason>('drag');
  const silentViewCommit = React.useRef(false);
  const [view, setView] = useControllableState<GlobeView>({
    value: viewProp !== undefined ? normalizeGlobeView(viewProp) : undefined,
    defaultValue: initialView.current,
    onChange: (next) => {
      if (!silentViewCommit.current)
        callbacks.current.onViewChange?.(next, { reason: reason.current });
    },
  });
  const controlledView = viewProp !== undefined;
  const [selectedId, setSelectedId] = useControllableState<string | null>({
    value,
    defaultValue,
    onChange,
  });
  const canonicalSelection = pointById.has(selectedId ?? '') ? selectedId : null;
  const effectiveSelection = points.some((point) => point.id === canonicalSelection)
    ? canonicalSelection
    : null;
  const hiddenSelection = canonicalSelection !== null && effectiveSelection === null;
  const [selectedArcId, setSelectedArcId] = useControllableState<string | null>({
    value: arcValue,
    defaultValue: defaultArcValue,
    onChange: onArcChange,
  });
  const effectiveArcSelection = arcs.some((arc) => arc.id === selectedArcId) ? selectedArcId : null;
  const selectedArc = allArcs.find((arc) => arc.id === effectiveArcSelection);
  const [arcListOpen, setArcListOpen] = React.useState(false);
  const [attempt, setAttempt] = React.useState(0);
  const [mode, setMode] = React.useState<'loading' | 'webgl' | '2d'>('loading');
  const [notice, setNotice] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const [fallbackView, setFallbackView] = React.useState({
    view,
    size: { width: 640, height: 420 },
  });
  const [tooltip, setTooltip] = React.useState<{
    point: GlobePoint;
    source: 'hover' | 'focus';
  } | null>(null);
  const [pointListOpen, setPointListOpen] = React.useState(false);
  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const tooltipAnchorRef = React.useRef<HTMLElement | null>(null);
  const markersRef = React.useRef(new Map<string, HTMLButtonElement>());
  const labelNodesRef = React.useRef(new Map<string, HTMLSpanElement>());
  const labelSizesRef = React.useRef(new Map<string, { width: number; height: number }>());
  const labelMeasureDirty = React.useRef(true);
  const tooltipRef = React.useRef(tooltip);
  tooltipRef.current = tooltip;
  const flight = React.useRef<ViewFlight | null>(null);
  const motionPreference = React.useRef(false);
  const actualSize = React.useRef<Size>({ width: 640, height: 420 });
  const liveView = React.useRef(view);
  const session = React.useRef<PointerSession | null>(null);
  const suppressPointClickUntil = React.useRef(0);
  const interaction = React.useRef({ hovered: false, focused: false });
  const schedule = React.useRef<() => void>(() => {});
  const latest = React.useRef({
    points,
    arcs,
    selectedId: effectiveSelection,
    selectedArcId: effectiveArcSelection,
    pointLabels,
    maxLabels,
    autoRotate,
    rotationSpeed,
    animateArcs,
    paused,
    disabled,
    interactive,
    controlledView: viewProp !== undefined,
  });
  latest.current = {
    points,
    arcs,
    selectedId: effectiveSelection,
    selectedArcId: effectiveArcSelection,
    pointLabels,
    maxLabels,
    autoRotate,
    rotationSpeed,
    animateArcs,
    paused,
    disabled,
    interactive,
    controlledView: viewProp !== undefined,
  };
  const id = React.useId().replace(/:/g, '');
  const blocked = disabled || !interactive;

  const requestView = React.useCallback(
    (requested: GlobeView, nextReason: GlobeViewChangeReason) => {
      const next = normalizeGlobeView(requested);
      const previous = liveView.current;
      flight.current = null;
      if (
        next.latitude === previous.latitude &&
        next.longitude === previous.longitude &&
        next.zoom === previous.zoom
      )
        return;
      reason.current = nextReason;
      if (!latest.current.controlledView) liveView.current = next;
      setView(next);
      schedule.current();
    },
    [setView]
  );

  const commitLiveView = React.useCallback(() => {
    if (latest.current.controlledView) return;
    silentViewCommit.current = true;
    try {
      setView({ ...liveView.current });
    } finally {
      silentViewCommit.current = false;
    }
  }, [setView]);
  const commitLiveViewRef = React.useRef(commitLiveView);
  commitLiveViewRef.current = commitLiveView;

  const focusPoint = React.useCallback(
    (point: GlobePoint, zoom?: number, nextReason: GlobeViewChangeReason = 'focus') => {
      const target = normalizeGlobeView({
        latitude: point.latitude,
        longitude: point.longitude,
        zoom: zoom ?? liveView.current.zoom,
      });
      const duration = normalizeGlobeTransitionDuration(transitionDuration, 0);
      if (latest.current.controlledView || motionPreference.current || !duration) {
        requestView(target, nextReason);
        return;
      }
      const previous = liveView.current;
      if (
        target.latitude === previous.latitude &&
        target.longitude === previous.longitude &&
        target.zoom === previous.zoom
      )
        return;
      flight.current = {
        from: { ...previous },
        to: target,
        duration,
        started: null,
        pointId: point.id,
      };
      reason.current = nextReason;
      callbacks.current.onViewChange?.(target, { reason: nextReason });
      setTooltip(null);
      schedule.current();
    },
    [transitionDuration, requestView]
  );

  const lastFocusRequest = React.useRef<{
    pointId: string;
    key?: string | number;
    zoom?: number;
  } | null>(null);
  React.useEffect(() => {
    if (!focus) {
      lastFocusRequest.current = null;
      return;
    }
    const previous = lastFocusRequest.current;
    if (
      previous?.pointId === focus.pointId &&
      previous.key === focus.key &&
      previous.zoom === focus.zoom
    )
      return;
    const point = pointById.get(focus.pointId);
    if (!point || blocked || !points.some((visible) => visible.id === point.id)) return;
    lastFocusRequest.current = { ...focus };
    focusPoint(point, focus.zoom);
  }, [focus, pointById, points, blocked, focusPoint]);

  React.useEffect(() => {
    if (controlledView) flight.current = null;
    if (flight.current && !controlledView) return;
    liveView.current = normalizeGlobeView({
      latitude: view.latitude,
      longitude: view.longitude,
      zoom: view.zoom,
    });
    schedule.current();
  }, [view.latitude, view.longitude, view.zoom, controlledView]);
  React.useEffect(() => {
    schedule.current();
  }, [
    points,
    arcs,
    effectiveSelection,
    effectiveArcSelection,
    pointLabels,
    maxLabels,
    autoRotate,
    rotationSpeed,
    animateArcs,
    paused,
    disabled,
    interactive,
  ]);
  React.useEffect(() => {
    labelMeasureDirty.current = true;
    if (
      flight.current &&
      (blocked || !points.some((point) => point.id === flight.current?.pointId))
    ) {
      flight.current = null;
    }
    schedule.current();
  }, [points, blocked, pointLabels, maxLabels]);

  React.useEffect(() => {
    const currentPoint =
      tooltip && points.some((point) => point.id === tooltip.point.id)
        ? pointById.get(tooltip.point.id)
        : undefined;
    const root = stageRef.current?.parentElement;
    const activeInsideGlobe = Boolean(
      root && document.activeElement && root.contains(document.activeElement)
    );
    const detachedTooltip = Boolean(
      tooltipAnchorRef.current && !tooltipAnchorRef.current.isConnected
    );
    if (tooltip && (!currentPoint || blocked || detachedTooltip)) {
      setTooltip(null);
    } else if (tooltip && currentPoint && currentPoint !== tooltip.point) {
      setTooltip({ ...tooltip, point: currentPoint });
    }
    if (interaction.current.focused && !activeInsideGlobe) {
      interaction.current.focused = false;
      schedule.current();
    }
  }, [points, pointById, tooltip, blocked, showPointList, searchable, query, showArcList]);
  React.useEffect(
    () => () => {
      const current = session.current;
      session.current = null;
      for (const pointerId of current?.pointers.keys() ?? []) {
        try {
          stageRef.current?.releasePointerCapture(pointerId);
        } catch {
          /* Unmount releases the remaining capture. */
        }
      }
    },
    []
  );

  React.useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    let active = true;
    let engine: GlobeRenderer | null = null;
    let rendererMode: 'webgl' | '2d' | null = null;
    let frame = 0;
    let previousTime = 0;
    let time = 0;
    let width = 0;
    let height = 0;
    let visible = true;
    let ready = false;
    let pendingTheme = true;
    let lastPoints: readonly GlobePoint[] | null = null;
    let lastArcs: readonly GlobeArc[] | null = null;
    let coloredPoints = latest.current.points;
    let coloredArcs = latest.current.arcs;
    const overlayCache = new Map<string, string>();
    let lastOverlaySignature = '';
    const root = stage.parentElement ?? stage;
    const colorResolver = createGlobeColorResolver(root);
    let palette: GlobePalette = colorResolver.palette();
    const media =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
    let reduce = media?.matches ?? false;
    motionPreference.current = reduce;
    setReducedMotion(reduce);
    if (reduce && flight.current) {
      liveView.current = flight.current.to;
      flight.current = null;
    }
    setMode('loading');
    setNotice(false);
    setDragging(false);
    callbacks.current.onSceneStatus('loading', null);

    const fallback = (cause: unknown, code: 'unsupported' | 'render' | 'context-lost') => {
      rendererMode = '2d';
      setMode('2d');
      setNotice(true);
      ready = false;
      callbacks.current.onError?.({
        code,
        message:
          code === 'context-lost'
            ? 'The WebGL context was lost.'
            : 'The 3D globe renderer is unavailable.',
        cause,
      });
      requestFrame();
    };
    const updateColors = () => {
      if (pendingTheme) {
        palette = colorResolver.palette();
        labelMeasureDirty.current = true;
        lastPoints = lastArcs = null;
        pendingTheme = false;
      }
      const current = latest.current;
      if (lastPoints !== current.points) {
        overlayCache.clear();
        lastOverlaySignature = '';
        coloredPoints = current.points.map((point) => ({
          ...point,
          color: point.color ? colorResolver.resolve(point.color, palette.point) : palette.point,
        }));
        lastPoints = current.points;
      }
      if (lastArcs !== current.arcs) {
        coloredArcs = current.arcs.map((arc) => ({
          ...arc,
          color: arc.color ? colorResolver.resolve(arc.color, palette.arc) : palette.arc,
        }));
        lastArcs = current.arcs;
      }
    };
    const draw = (timestamp: number) => {
      frame = 0;
      if (!active || !rendererMode || width <= 0 || height <= 0) return;
      const current = latest.current;
      let activeFlight = flight.current;
      if (activeFlight && (reduce || current.disabled || current.controlledView)) {
        if (reduce && !current.controlledView) liveView.current = activeFlight.to;
        flight.current = null;
        activeFlight = null;
      }
      const flying = Boolean(activeFlight && visible && !document.hidden);
      if (activeFlight && flying) {
        if (activeFlight.started === null) activeFlight.started = timestamp;
        const progress = Math.min(
          1,
          Math.max(0, (timestamp - activeFlight.started) / activeFlight.duration)
        );
        liveView.current = interpolateGlobeView(activeFlight.from, activeFlight.to, progress);
        if (progress >= 1) {
          flight.current = null;
          commitLiveViewRef.current();
        }
      }
      const running =
        !activeFlight &&
        !reduce &&
        !document.hidden &&
        visible &&
        !current.disabled &&
        !current.paused &&
        !interaction.current.hovered &&
        !interaction.current.focused &&
        !session.current;
      const speed = Number.isFinite(current.rotationSpeed)
        ? Math.max(-60, Math.min(60, current.rotationSpeed))
        : 6;
      const spinning = running && current.autoRotate && speed !== 0 && !current.controlledView;
      const flowing =
        rendererMode === 'webgl' &&
        running &&
        current.animateArcs &&
        current.arcs.some((arc) => arc.animated !== false);
      const elapsed = previousTime
        ? Math.min(0.05, Math.max(0, (timestamp - previousTime) / 1000))
        : 0;
      previousTime = spinning || flowing ? timestamp : 0;
      if (spinning) {
        liveView.current = normalizeGlobeView({
          ...liveView.current,
          longitude: liveView.current.longitude + speed * elapsed,
        });
      }
      if (spinning || flowing) time += elapsed;
      updateColors();
      const snapshot: GlobeRendererSnapshot = {
        view: liveView.current,
        points: coloredPoints,
        arcs: coloredArcs,
        selectedId: current.selectedId,
        selectedArcId: current.selectedArcId,
        palette,
        time,
        animateArcs: current.animateArcs && !reduce,
      };
      let projections;
      if (rendererMode === 'webgl' && engine) {
        try {
          projections = engine.render(snapshot);
        } catch (cause) {
          fallback(cause, 'render');
          return;
        }
      } else {
        projections = current.points.map((point) => ({
          id: point.id,
          ...projectGlobePoint(point, liveView.current, width, height),
        }));
        setFallbackView((previous) =>
          previous.view.latitude === liveView.current.latitude &&
          previous.view.longitude === liveView.current.longitude &&
          previous.view.zoom === liveView.current.zoom &&
          previous.size.width === width &&
          previous.size.height === height
            ? previous
            : { view: { ...liveView.current }, size: { width, height } }
        );
      }
      const radius = globeRadius(width, height, liveView.current.zoom);
      const sizeById = new Map(current.points.map((point) => [point.id, point.size ?? 0.016]));
      for (const point of projections) {
        const marker = markersRef.current.get(point.id);
        if (!marker) continue;
        const markerSize = Math.max(4, radius * (sizeById.get(point.id) ?? 0.016) * 2);
        const signature = `${point.x.toFixed(2)}/${point.y.toFixed(2)}/${point.visible}/${markerSize.toFixed(2)}/${current.disabled}/${current.interactive}`;
        if (overlayCache.get(point.id) === signature) continue;
        overlayCache.set(point.id, signature);
        marker.style.left = `${point.x}px`;
        marker.style.top = `${point.y}px`;
        marker.style.setProperty('--zuvi-globe-marker-size', `${markerSize}px`);
        marker.style.visibility = point.visible ? 'visible' : 'hidden';
        marker.tabIndex = point.visible && !current.disabled && current.interactive ? 0 : -1;
        marker.setAttribute('aria-hidden', String(!point.visible));
      }
      const overlaySignature = `${liveView.current.latitude}/${liveView.current.longitude}/${liveView.current.zoom}/${width}/${height}/${current.selectedId}/${tooltipRef.current?.point.id}/${current.pointLabels}/${current.maxLabels}`;
      if (
        current.pointLabels !== 'none' &&
        (overlaySignature !== lastOverlaySignature || labelMeasureDirty.current)
      ) {
        if (labelMeasureDirty.current) {
          labelSizesRef.current.clear();
          for (const [pointId, node] of labelNodesRef.current) {
            labelSizesRef.current.set(pointId, {
              width:
                node.offsetWidth ||
                Math.min(width - 8, Math.max(36, (node.textContent?.length ?? 4) * 7 + 16)),
              height: node.offsetHeight || 24,
            });
          }
          labelMeasureDirty.current = false;
        }
        const candidates = projections.map((point) => ({
          ...point,
          ...(labelSizesRef.current.get(point.id) ?? { width: 60, height: 24 }),
          visible:
            point.visible &&
            (current.pointLabels === 'auto' ||
              point.id === current.selectedId ||
              point.id === tooltipRef.current?.point.id),
          selected: point.id === current.selectedId,
          hovered: point.id === tooltipRef.current?.point.id,
        }));
        const reserved = [
          { left: width / 2 - 105, top: height - 63, width: 210, height: 63 },
          { left: width - 60, top: 0, width: 60, height: 45 },
        ];
        for (const position of layoutGlobeLabels(candidates, {
          width,
          height,
          maxLabels: current.maxLabels,
          gap: 12,
          reserved,
        })) {
          const node = labelNodesRef.current.get(position.id);
          if (!node) continue;
          node.style.transform = `translate(${position.left}px, ${position.top}px)`;
          node.style.visibility = position.visible ? 'visible' : 'hidden';
        }
        lastOverlaySignature = overlaySignature;
      }
      stage.dataset.viewLatitude = liveView.current.latitude.toFixed(2);
      stage.dataset.viewLongitude = liveView.current.longitude.toFixed(2);
      stage.dataset.viewZoom = liveView.current.zoom.toFixed(2);
      stage.dataset.animating = String(spinning || flowing || flying);
      stage.dataset.transitioning = String(Boolean(flight.current));
      stage.dataset.pointCount = String(current.points.length);
      stage.dataset.arcCount = String(current.arcs.length);
      if (!ready) {
        ready = true;
        callbacks.current.onSceneStatus(
          rendererMode === 'webgl' || renderMode === '2d' ? 'ready' : 'fallback',
          rendererMode
        );
      }
      if (spinning || flowing || (flying && flight.current)) requestFrame();
    };
    const requestFrame = () => {
      if (active && !frame) frame = window.requestAnimationFrame(draw);
    };
    schedule.current = requestFrame;
    const resize = () => {
      const rect = stage.getBoundingClientRect();
      width = Math.max(0, rect.width);
      height = Math.max(0, rect.height);
      actualSize.current = { width, height };
      labelMeasureDirty.current = true;
      overlayCache.clear();
      if (width > 0 && height > 0) {
        const ratio = Math.min(2, window.devicePixelRatio || 1, 4096 / width, 4096 / height);
        engine?.resize(width, height, ratio);
      }
      requestFrame();
    };
    const colorsChanged = () => {
      pendingTheme = true;
      requestFrame();
    };
    const colorScheme =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : null;
    if (colorScheme?.addEventListener) colorScheme.addEventListener('change', colorsChanged);
    else colorScheme?.addListener(colorsChanged);
    const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
    resizeObserver?.observe(stage);
    const intersection =
      typeof IntersectionObserver === 'function'
        ? new IntersectionObserver((entries) => {
            visible = entries[0]?.isIntersecting ?? true;
            if (!visible && flight.current) {
              flight.current = null;
            }
            previousTime = 0;
            requestFrame();
          })
        : null;
    intersection?.observe(stage);
    const mutation =
      typeof MutationObserver === 'function'
        ? new MutationObserver(() => {
            pendingTheme = true;
            requestFrame();
          })
        : null;
    for (let parent: HTMLElement | null = root; parent; parent = parent.parentElement) {
      mutation?.observe(parent, {
        attributes: true,
        attributeFilter: ['class', 'style', 'data-theme', 'dir'],
      });
    }
    const motionChanged = () => {
      reduce = media?.matches ?? false;
      motionPreference.current = reduce;
      if (reduce && flight.current) {
        liveView.current = flight.current.to;
        flight.current = null;
      }
      setReducedMotion(reduce);
      previousTime = 0;
      requestFrame();
    };
    const visibilityChanged = () => {
      if (document.hidden) flight.current = null;
      previousTime = 0;
      requestFrame();
    };
    if (media?.addEventListener) media.addEventListener('change', motionChanged);
    else media?.addListener(motionChanged);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', visibilityChanged);
    const lost = (event: Event) => {
      if (!active) return;
      event.preventDefault();
      fallback(event, 'context-lost');
    };
    const restored = () => {
      if (active) setAttempt((current) => current + 1);
    };
    canvas.addEventListener('webglcontextlost', lost);
    canvas.addEventListener('webglcontextrestored', restored);
    resize();
    if (renderMode === '2d') {
      rendererMode = '2d';
      setMode('2d');
      requestFrame();
    } else {
      loadRenderer().then(
        (module) => {
          if (!active) return;
          try {
            engine = module.createGlobeRenderer(canvas);
            rendererMode = 'webgl';
            setMode('webgl');
            resize();
          } catch (cause) {
            fallback(cause, 'unsupported');
          }
        },
        (cause: unknown) => {
          if (active) fallback(cause, 'render');
        }
      );
    }
    return () => {
      active = false;
      flight.current = null;
      schedule.current = () => {};
      if (frame) window.cancelAnimationFrame(frame);
      const currentPointer = session.current;
      session.current = null;
      for (const pointerId of currentPointer?.pointers.keys() ?? []) {
        try {
          stage.releasePointerCapture(pointerId);
        } catch {
          /* Reinitialization releases pointer ownership. */
        }
      }
      resizeObserver?.disconnect();
      intersection?.disconnect();
      mutation?.disconnect();
      if (media?.removeEventListener) media.removeEventListener('change', motionChanged);
      else media?.removeListener(motionChanged);
      if (colorScheme?.removeEventListener)
        colorScheme.removeEventListener('change', colorsChanged);
      else colorScheme?.removeListener(colorsChanged);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', visibilityChanged);
      canvas.removeEventListener('webglcontextlost', lost);
      canvas.removeEventListener('webglcontextrestored', restored);
      colorResolver.dispose();
      engine?.dispose();
    };
  }, [attempt, renderMode]);

  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !wheelZoom || blocked) return;
    const wheel = (event: WheelEvent) => {
      if (event.defaultPrevented || (event.target as HTMLElement).closest('button,summary,a,input'))
        return;
      const multiplier =
        event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.clientHeight : 1;
      const next = normalizeGlobeView({
        ...liveView.current,
        zoom: liveView.current.zoom * Math.exp(-event.deltaY * multiplier * 0.001),
      });
      if (next.zoom === liveView.current.zoom) return;
      event.preventDefault();
      setTooltip(null);
      requestView(next, 'zoom');
    };
    stage.addEventListener('wheel', wheel, { passive: false });
    return () => stage.removeEventListener('wheel', wheel);
  }, [wheelZoom, blocked, requestView]);

  const finishPointer = (cancel: boolean) => {
    const current = session.current;
    if (!current) return;
    session.current = null;
    setDragging(false);
    const stage = stageRef.current;
    for (const pointerId of current.pointers.keys()) {
      try {
        if (stage?.hasPointerCapture(pointerId)) stage.releasePointerCapture(pointerId);
      } catch {
        /* Capture may already have been released. */
      }
    }
    if (cancel && current.moved) requestView(current.startView, 'drag');
    schedule.current();
  };
  React.useEffect(() => {
    if (!blocked || !session.current) return;
    const current = session.current;
    session.current = null;
    setDragging(false);
    for (const pointerId of current.pointers.keys()) {
      try {
        stageRef.current?.releasePointerCapture(pointerId);
      } catch {
        /* The disabled session no longer owns the pointer. */
      }
    }
  }, [blocked]);
  const selectPoint = (point: GlobePoint, event: React.MouseEvent<HTMLElement>) => {
    if (
      event.currentTarget.dataset.part === 'point' &&
      event.detail !== 0 &&
      performance.now() < suppressPointClickUntil.current
    ) {
      event.preventDefault();
      return;
    }
    const source = pointById.get(point.id) ?? point;
    callbacks.current.onPointClick?.(source, event);
    if (event.defaultPrevented || blocked) return;
    setTooltip(null);
    setSelectedId(effectiveSelection === point.id ? null : point.id);
    focusPoint(source, undefined, 'point');
  };
  const selectArc = (arc: GlobeArc, event: React.MouseEvent<HTMLElement>) => {
    const source = allArcs.find((item) => item.id === arc.id) ?? arc;
    callbacks.current.onArcClick?.(source, event);
    if (event.defaultPrevented || blocked) return;
    setSelectedArcId(effectiveArcSelection === arc.id ? null : arc.id);
    setTooltip(null);
    schedule.current();
  };
  const toggleCategory = (categoryId: string) => {
    if (blocked) return;
    const normalized = normalizeHiddenCategories(hidden);
    setHidden(
      normalized.includes(categoryId)
        ? normalized.filter((id) => id !== categoryId)
        : [...normalized, categoryId]
    );
  };
  const showTooltip = (point: GlobePoint, anchor: HTMLElement, source: 'hover' | 'focus') => {
    if (blocked || session.current) return;
    tooltipAnchorRef.current = anchor;
    setTooltip({ point: pointById.get(point.id) ?? point, source });
    schedule.current();
  };
  const pointLabel = (point: GlobePoint) => point.name ?? point.id;
  const coordinateLabel = (point: GlobePoint) =>
    `${labels.latitude} ${point.latitude.toFixed(2)}°, ${labels.longitude} ${point.longitude.toFixed(2)}°`;

  return (
    <>
      {(legend ?? categories.length > 0) && categories.length > 0 ? (
        <fieldset
          data-part="legend"
          className={cx('zuvi-globe-legend', classNames?.legend)}
          disabled={blocked}
        >
          <legend className="zuvi-globe-sr-only">{labels.legend}</legend>
          {categories.map((category) => (
            <label
              key={category.id}
              data-part="legend-item"
              data-category-id={category.id}
              className={cx('zuvi-globe-legend-item', classNames?.legendItem)}
            >
              <input
                type="checkbox"
                aria-label={category.name}
                checked={!normalizeHiddenCategories(hidden).includes(category.id)}
                onChange={() => toggleCategory(category.id)}
              />
              <span
                className="zuvi-globe-category-dot"
                style={category.color ? { background: category.color } : undefined}
                aria-hidden="true"
              />
              <span>{category.name}</span>
              <span className="zuvi-globe-category-count">{counts.get(category.id) ?? 0}</span>
            </label>
          ))}
          <button
            type="button"
            className="zuvi-globe-show-all"
            onClick={() => setHidden([])}
            disabled={blocked || !hidden.length}
          >
            {labels.showAll}
          </button>
        </fieldset>
      ) : null}
      {hiddenSelection ? (
        <div className="zuvi-globe-filter-notice" role="status">
          <span>{labels.hiddenSelection}</span>
          <button type="button" onClick={() => setHidden([])} disabled={blocked}>
            {labels.showAll}
          </button>
        </div>
      ) : null}
      <div
        ref={stageRef}
        data-part="stage"
        role="group"
        aria-label={labels.label}
        aria-describedby={blocked ? undefined : `${id}-instructions`}
        aria-disabled={disabled || undefined}
        tabIndex={blocked ? undefined : 0}
        data-dragging={dragging ? '' : undefined}
        data-interactive={blocked ? undefined : 'true'}
        className={cx('zuvi-globe-stage', classNames?.stage)}
        onMouseEnter={() => {
          interaction.current.hovered = true;
          schedule.current();
        }}
        onMouseLeave={() => {
          interaction.current.hovered = false;
          if (tooltip?.source === 'hover') setTooltip(null);
          schedule.current();
        }}
        onFocusCapture={() => {
          interaction.current.focused = true;
          schedule.current();
        }}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            interaction.current.focused = false;
            setTooltip(null);
            schedule.current();
          }
        }}
        onPointerDown={(event) => {
          if (
            event.defaultPrevented ||
            blocked ||
            event.button !== 0 ||
            (event.target as HTMLElement).closest('button,summary,a,input')
          )
            return;
          if (session.current && event.pointerType !== 'touch') return;
          flight.current = null;
          try {
            event.currentTarget.setPointerCapture(event.pointerId);
          } catch {
            return;
          }
          const point = { x: event.clientX, y: event.clientY };
          if (!session.current)
            session.current = {
              pointers: new Map(),
              view: { ...liveView.current },
              startView: { ...liveView.current },
              x: point.x,
              y: point.y,
              distance: 0,
              moved: false,
            };
          session.current.pointers.set(event.pointerId, point);
          if (session.current.pointers.size === 2) {
            const [first, second] = [...session.current.pointers.values()];
            session.current.distance = Math.hypot(second.x - first.x, second.y - first.y);
            session.current.view = { ...liveView.current };
          }
          event.currentTarget.focus({ preventScroll: true });
          setTooltip(null);
          schedule.current();
          if (event.pointerType !== 'touch') event.preventDefault();
        }}
        onPointerMove={(event) => {
          const current = session.current;
          if (!current?.pointers.has(event.pointerId)) return;
          current.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
          if (current.pointers.size >= 2) {
            const [first, second] = [...current.pointers.values()];
            const distance = Math.hypot(second.x - first.x, second.y - first.y);
            if (current.distance > 0)
              requestView(
                { ...current.view, zoom: (current.view.zoom * distance) / current.distance },
                'zoom'
              );
          } else {
            const dx = event.clientX - current.x;
            const dy = event.clientY - current.y;
            if (!current.moved && Math.hypot(dx, dy) < 3) return;
            requestView(
              {
                ...current.view,
                longitude: current.view.longitude - dx * 0.32,
                latitude: current.view.latitude + dy * 0.32,
              },
              'drag'
            );
          }
          current.moved = true;
          suppressPointClickUntil.current = performance.now() + 500;
          setDragging(true);
        }}
        onPointerUp={(event) => {
          const current = session.current;
          if (!current?.pointers.has(event.pointerId)) return;
          current.pointers.delete(event.pointerId);
          if (current.pointers.size === 0) finishPointer(false);
          else if (current.pointers.size === 1) {
            const point = [...current.pointers.values()][0];
            current.x = point.x;
            current.y = point.y;
            current.distance = 0;
            current.view = { ...liveView.current };
          } else {
            const [first, second] = [...current.pointers.values()];
            current.distance = Math.hypot(second.x - first.x, second.y - first.y);
            current.view = { ...liveView.current };
          }
          try {
            event.currentTarget.releasePointerCapture(event.pointerId);
          } catch {
            /* The completed session already owns the view. */
          }
        }}
        onPointerCancel={() => finishPointer(true)}
        onLostPointerCapture={(event) => {
          if (session.current?.pointers.has(event.pointerId)) finishPointer(true);
        }}
        onKeyDown={(event) => {
          if (event.defaultPrevented) return;
          if (event.key === 'Escape' && (tooltip || session.current || flight.current)) {
            event.preventDefault();
            event.stopPropagation();
            setTooltip(null);
            flight.current = null;
            finishPointer(true);
            schedule.current();
            return;
          }
          if (
            blocked ||
            event.target !== event.currentTarget ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey
          )
            return;
          const next = { ...liveView.current };
          const step = event.shiftKey ? 15 : 5;
          if (event.key === 'ArrowLeft') next.longitude -= step;
          else if (event.key === 'ArrowRight') next.longitude += step;
          else if (event.key === 'ArrowUp') next.latitude += step;
          else if (event.key === 'ArrowDown') next.latitude -= step;
          else if (event.key === '+' || event.key === '=') next.zoom += 0.1;
          else if (event.key === '-' || event.key === '_') next.zoom -= 0.1;
          else if (event.key === 'Home') Object.assign(next, initialView.current);
          else return;
          event.preventDefault();
          setTooltip(null);
          requestView(next, event.key === 'Home' ? 'reset' : 'keyboard');
        }}
      >
        <span id={`${id}-instructions`} className="zuvi-globe-sr-only">
          {labels.instructions}
        </span>
        <canvas
          key={`${attempt}-${renderMode}`}
          ref={canvasRef}
          data-part="canvas"
          aria-hidden="true"
          className={cx('zuvi-globe-canvas', classNames?.canvas)}
          style={{ visibility: mode === 'webgl' ? 'visible' : 'hidden' }}
        />
        {mode !== 'webgl' ? (
          <GlobeFallback
            view={fallbackView.view}
            size={fallbackView.size}
            points={points}
            arcs={arcs}
            selectedId={effectiveSelection}
            selectedArcId={effectiveArcSelection}
            id={id}
          />
        ) : null}
        <div className="zuvi-globe-points">
          {points.map((point) => (
            <button
              key={point.id}
              type="button"
              data-part="point"
              data-point-id={point.id}
              data-point-size={point.size}
              ref={(node) => {
                if (node) markersRef.current.set(point.id, node);
                else markersRef.current.delete(point.id);
              }}
              className={cx('zuvi-globe-point', classNames?.point)}
              style={
                point.color
                  ? ({ '--zuvi-globe-marker-color': point.color } as React.CSSProperties)
                  : undefined
              }
              tabIndex={-1}
              aria-label={pointLabel(point)}
              aria-pressed={point.id === effectiveSelection}
              aria-describedby={tooltip?.point.id === point.id ? `${id}-tooltip` : undefined}
              disabled={blocked}
              onClick={(event) => selectPoint(point, event)}
              onMouseEnter={(event) => showTooltip(point, event.currentTarget, 'hover')}
              onMouseLeave={() => {
                if (tooltip?.source === 'hover') setTooltip(null);
              }}
              onFocus={(event) => showTooltip(point, event.currentTarget, 'focus')}
              onBlur={() => setTooltip(null)}
            >
              <span className="zuvi-globe-point-dot" aria-hidden="true" />
            </button>
          ))}
        </div>
        {pointLabels !== 'none' ? (
          <div className="zuvi-globe-labels" aria-hidden="true">
            {points.map((point) => (
              <span
                key={point.id}
                data-part="label"
                data-point-id={point.id}
                aria-hidden="true"
                data-selected={effectiveSelection === point.id ? '' : undefined}
                ref={(node) => {
                  if (node) labelNodesRef.current.set(point.id, node);
                  else {
                    labelNodesRef.current.delete(point.id);
                    labelSizesRef.current.delete(point.id);
                  }
                }}
                className={cx('zuvi-globe-label', classNames?.label)}
              >
                {pointLabel(point)}
              </span>
            ))}
          </div>
        ) : null}
        {controls ? (
          <div
            data-part="controls"
            role="group"
            aria-label={labels.instructions}
            className={cx('zuvi-globe-controls', classNames?.controls)}
          >
            <button
              type="button"
              data-part="control"
              className={cx('zuvi-globe-control', classNames?.control)}
              disabled={blocked || !autoRotate || viewProp !== undefined || reducedMotion}
              aria-label={paused || !autoRotate ? labels.rotate : labels.pause}
              aria-pressed={!paused && autoRotate}
              onClick={() => setPaused((current) => !current)}
            >
              {paused || !autoRotate ? <Play size={16} /> : <Pause size={16} />}
            </button>
            <span className="zuvi-globe-control-divider" aria-hidden="true" />
            <button
              type="button"
              data-part="control"
              className={cx('zuvi-globe-control', classNames?.control)}
              disabled={blocked || view.zoom >= 2}
              aria-label={labels.zoomIn}
              onClick={() =>
                requestView({ ...liveView.current, zoom: liveView.current.zoom + 0.15 }, 'zoom')
              }
            >
              <ZoomIn size={17} />
            </button>
            <button
              type="button"
              data-part="control"
              className={cx('zuvi-globe-control', classNames?.control)}
              disabled={blocked || view.zoom <= 0.75}
              aria-label={labels.zoomOut}
              onClick={() =>
                requestView({ ...liveView.current, zoom: liveView.current.zoom - 0.15 }, 'zoom')
              }
            >
              <ZoomOut size={17} />
            </button>
            <button
              type="button"
              data-part="control"
              className={cx('zuvi-globe-control', classNames?.control)}
              disabled={blocked}
              aria-label={labels.reset}
              onClick={() => requestView(initialView.current, 'reset')}
            >
              <RotateCcw size={17} />
            </button>
          </div>
        ) : null}
        <span className="zuvi-globe-renderer-badge" aria-hidden="true">
          <GlobeIcon size={12} /> {mode === 'webgl' ? '3D' : '2D'}
        </span>
        {mode === 'loading' ? (
          <div
            data-part="loading"
            role="status"
            className={cx('zuvi-globe-loading', classNames?.loading)}
          >
            {loading !== undefined ? loading : labels.loading}
          </div>
        ) : null}
        {notice ? (
          <div
            data-part="fallback"
            role="status"
            className={cx('zuvi-globe-notice', classNames?.fallback)}
          >
            <span>{labels.fallback}</span>
            <button
              type="button"
              className="zuvi-globe-retry"
              disabled={disabled}
              onClick={() => setAttempt((current) => current + 1)}
            >
              {labels.retry}
            </button>
          </div>
        ) : null}
      </div>
      {showPointList ? (
        <details
          data-part="point-list"
          className={cx('zuvi-globe-point-list', classNames?.pointList)}
          onToggle={(event) => {
            setPointListOpen(event.currentTarget.open);
            if (!event.currentTarget.open) setTooltip(null);
          }}
        >
          <summary>
            {labels.points}
            <span className="zuvi-globe-point-count">{points.length}</span>
          </summary>
          {pointListOpen && searchable ? (
            <div data-part="search" className={cx('zuvi-globe-search', classNames?.search)}>
              <div className="zuvi-globe-search-field">
                <Search size={15} aria-hidden="true" />
                <input
                  type="search"
                  aria-label={labels.search}
                  placeholder={labels.searchPlaceholder}
                  value={query}
                  disabled={blocked}
                  onChange={(event) => setQuery(event.target.value)}
                />
                {query ? (
                  <button
                    type="button"
                    aria-label={labels.clearSearch}
                    disabled={blocked}
                    onClick={() => setQuery('')}
                  >
                    <Close size={14} />
                  </button>
                ) : null}
              </div>
              <span className="zuvi-globe-search-count" role="status">
                {labels.searchResults.replace('{count}', String(searchPoints.length))}
              </span>
            </div>
          ) : null}
          {pointListOpen && searchPoints.length ? (
            <ul>
              {searchPoints.map((point) => (
                <li key={point.id}>
                  <button
                    type="button"
                    data-part="point-item"
                    data-point-id={point.id}
                    className={cx('zuvi-globe-point-item', classNames?.pointItem)}
                    aria-pressed={point.id === effectiveSelection}
                    disabled={blocked}
                    aria-describedby={tooltip?.point.id === point.id ? `${id}-tooltip` : undefined}
                    onClick={(event) => selectPoint(point, event)}
                    onMouseEnter={(event) => showTooltip(point, event.currentTarget, 'hover')}
                    onMouseLeave={() => {
                      if (tooltip?.source === 'hover') setTooltip(null);
                    }}
                    onFocus={(event) => {
                      interaction.current.focused = true;
                      showTooltip(point, event.currentTarget, 'focus');
                      schedule.current();
                    }}
                    onBlur={() => {
                      interaction.current.focused = false;
                      setTooltip(null);
                      schedule.current();
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape' && tooltip) {
                        setTooltip(null);
                        event.preventDefault();
                        event.stopPropagation();
                      }
                    }}
                  >
                    <span>
                      <strong>{pointLabel(point)}</strong>
                      <span className="zuvi-globe-point-coordinate">{coordinateLabel(point)}</span>
                    </span>
                    {point.value !== undefined ? (
                      <span className="zuvi-globe-point-value">{point.value}</span>
                    ) : null}
                    {point.category ? (
                      <span className="zuvi-globe-point-category">
                        {categoryById.get(point.category)?.name ?? point.category}
                      </span>
                    ) : null}
                  </button>
                  {searchable ? (
                    <button
                      type="button"
                      data-part="focus-point"
                      className="zuvi-globe-focus-point"
                      aria-label={labels.focusPoint.replace('{name}', pointLabel(point))}
                      disabled={blocked}
                      onClick={(event) => {
                        if (!event.defaultPrevented) focusPoint(pointById.get(point.id) ?? point);
                      }}
                    >
                      <MapPin size={14} />
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : pointListOpen && !searchPoints.length ? (
            <p role="status">{searchable && query.trim() ? labels.noResults : labels.noPoints}</p>
          ) : null}
        </details>
      ) : null}
      {showArcList ? (
        <details
          data-part="arc-list"
          className={cx('zuvi-globe-arc-list', classNames?.arcList)}
          onToggle={(event) => setArcListOpen(event.currentTarget.open)}
        >
          <summary>
            {labels.arcs}
            <span className="zuvi-globe-point-count">{arcs.length}</span>
          </summary>
          {arcListOpen && arcs.length ? (
            <ul>
              {arcs.map((arc) => (
                <li key={arc.id}>
                  <button
                    type="button"
                    data-part="arc-item"
                    data-arc-id={arc.id}
                    className={cx('zuvi-globe-arc-item', classNames?.arcItem)}
                    aria-pressed={arc.id === effectiveArcSelection}
                    disabled={blocked}
                    onClick={(event) => selectArc(arc, event)}
                  >
                    <span>
                      <strong>
                        {arc.name ??
                          `${pointLabel(pointById.get(arc.from)!)} → ${pointLabel(pointById.get(arc.to)!)}`}
                      </strong>
                      <span className="zuvi-globe-point-coordinate">
                        {pointLabel(pointById.get(arc.from)!)} →{' '}
                        {pointLabel(pointById.get(arc.to)!)}
                      </span>
                    </span>
                    {arc.value !== undefined ? (
                      <span className="zuvi-globe-point-value">{arc.value}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : arcListOpen ? (
            <p>{labels.noArcs}</p>
          ) : null}
        </details>
      ) : null}
      {selectedArc ? (
        <section
          data-part="arc-details"
          data-arc-id={selectedArc.id}
          aria-label={labels.selectedArc}
          className={cx('zuvi-globe-arc-details', classNames?.arcDetails)}
        >
          {renderArcDetails ? (
            renderArcDetails(selectedArc, {
              from: pointById.get(selectedArc.from)!,
              to: pointById.get(selectedArc.to)!,
            })
          ) : (
            <>
              <strong>{selectedArc.name ?? selectedArc.id}</strong>
              <span>
                {pointLabel(pointById.get(selectedArc.from)!)} →{' '}
                {pointLabel(pointById.get(selectedArc.to)!)}
              </span>
              {selectedArc.value !== undefined ? (
                <span>
                  {labels.value}: {selectedArc.value}
                </span>
              ) : null}
            </>
          )}
        </section>
      ) : null}
      {tooltip && !blocked ? (
        <FloatingPanel
          open
          anchorRef={tooltipAnchorRef}
          side="top"
          align="center"
          offsetVariable="--zuvi-space-2"
        >
          <div
            role="tooltip"
            id={`${id}-tooltip`}
            data-part="tooltip"
            className={cx('zuvi-globe-tooltip', classNames?.tooltip)}
          >
            {renderTooltip ? (
              renderTooltip(tooltip.point)
            ) : (
              <>
                <strong>{pointLabel(tooltip.point)}</strong>
                {tooltip.point.value !== undefined ? (
                  <span>
                    {labels.value}: {tooltip.point.value}
                  </span>
                ) : null}
                <span className="zuvi-globe-tooltip-coordinate">
                  {coordinateLabel(tooltip.point)}
                </span>
              </>
            )}
          </div>
        </FloatingPanel>
      ) : null}
    </>
  );
}
