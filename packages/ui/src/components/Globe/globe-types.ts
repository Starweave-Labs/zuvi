import type * as React from 'react';

/** Geographic coordinates in degrees, latitude [-90, 90], longitude [-180, 180]. */
export interface GlobePoint {
  id: string;
  latitude: number;
  longitude: number;
  name?: string;
  value?: number | string;
  /** Category ID used by the optional legend; unclassified points remain visible. */
  category?: string;
  /** Any browser CSS color; explicit colors take precedence over category colors. */
  color?: string;
  /** Radius relative to the globe radius; clamped to [0.008, 0.06]. */
  size?: number;
}

export interface GlobeCategory {
  id: string;
  name: string;
  color?: string;
}

export interface GlobeValueScale {
  /** Explicit or full-data numeric domain; never recomputed from filtered points. */
  domain?: readonly [number, number];
  /** Point-radius range, clamped to [0.008, 0.06]. */
  range?: readonly [number, number];
}

export interface GlobeFocusRequest {
  /** Point to bring into view without changing selection. */
  pointId: string;
  /** Change this key to request the same point again. */
  key?: string | number;
  /** Optional target zoom; defaults to the current zoom. */
  zoom?: number;
}

export type GlobeLabelMode = 'none' | 'selected' | 'auto';

export interface GlobeArc {
  id: string;
  from: string;
  to: string;
  name?: string;
  value?: number | string;
  color?: string;
  /** Radius relative to the globe radius; clamped to [0.001, 0.02]. */
  width?: number;
  /** Height above the globe radius; clamped to [0.02, 0.8]. */
  altitude?: number;
  /** Moving light along the connection; defaults to true. */
  animated?: boolean;
}

export interface GlobeView {
  latitude: number;
  longitude: number;
  /** Magnification, clamped to [0.75, 2]. */
  zoom: number;
}

export type GlobeViewChangeReason = 'drag' | 'zoom' | 'keyboard' | 'reset' | 'point' | 'focus';
export type GlobeStatus = 'loading' | 'ready' | 'fallback' | 'error';
export type GlobeRenderMode = 'auto' | '2d';

export interface GlobeError {
  code: 'load' | 'unsupported' | 'render' | 'context-lost';
  message: string;
  cause?: unknown;
}

export interface GlobeLabels {
  label: string;
  loading: string;
  rotate: string;
  pause: string;
  zoomIn: string;
  zoomOut: string;
  reset: string;
  points: string;
  noPoints: string;
  instructions: string;
  fallback: string;
  error: string;
  retry: string;
  latitude: string;
  longitude: string;
  value: string;
  search: string;
  searchPlaceholder: string;
  clearSearch: string;
  searchResults: string;
  noResults: string;
  legend: string;
  showAll: string;
  hiddenSelection: string;
  focusPoint: string;
  arcs: string;
  noArcs: string;
  selectedArc: string;
}

export interface GlobeProps extends Omit<
  React.ComponentPropsWithRef<'div'>,
  'children' | 'color' | 'onChange' | 'onError' | 'defaultValue'
> {
  points?: readonly GlobePoint[];
  arcs?: readonly GlobeArc[];
  categories?: readonly GlobeCategory[];
  /** Show the category legend; defaults to true when categories are provided. */
  legend?: boolean;
  hiddenCategories?: readonly string[];
  defaultHiddenCategories?: readonly string[];
  onHiddenCategoriesChange?: (categories: string[]) => void;
  /** Visual marker labels; defaults to none for backwards-compatible rendering. */
  pointLabels?: GlobeLabelMode;
  /** Automatic label budget, clamped to [1, 40]; defaults to 12. */
  maxLabels?: number;
  /** Optional area-aware numeric value to marker-radius mapping. */
  valueScale?: GlobeValueScale | boolean;
  /** Adds a local point-list search field; disabled by default. */
  searchable?: boolean;
  searchValue?: string;
  defaultSearchValue?: string;
  onSearchValueChange?: (value: string) => void;
  /** Declarative focus requests do not change the selected point. */
  focus?: GlobeFocusRequest | null;
  /** Focus/selection flight duration in ms; 0 keeps instantaneous behavior. */
  transitionDuration?: number;
  arcValue?: string | null;
  defaultArcValue?: string | null;
  onArcChange?: (id: string | null) => void;
  onArcClick?: (arc: GlobeArc, event: React.MouseEvent<HTMLElement>) => void;
  showArcList?: boolean;
  renderArcDetails?: (
    arc: GlobeArc,
    endpoints: { from: GlobePoint; to: GlobePoint }
  ) => React.ReactNode;
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (value: string | null) => void;
  onPointClick?: (point: GlobePoint, event: React.MouseEvent<HTMLElement>) => void;
  view?: GlobeView;
  defaultView?: Partial<GlobeView>;
  onViewChange?: (view: GlobeView, details: { reason: GlobeViewChangeReason }) => void;
  autoRotate?: boolean;
  /** Degrees per second; defaults to 6 and is clamped to [-60, 60]. */
  rotationSpeed?: number;
  animateArcs?: boolean;
  interactive?: boolean;
  disabled?: boolean;
  controls?: boolean;
  /** Opt-in: wheel zoom is disabled by default so scrolling the page stays native. */
  wheelZoom?: boolean;
  /** An accessible point list is available by default, even without WebGL. */
  showPointList?: boolean;
  renderMode?: GlobeRenderMode;
  height?: number | string;
  loading?: React.ReactNode;
  renderTooltip?: (point: GlobePoint) => React.ReactNode;
  labels?: Partial<GlobeLabels>;
  onReady?: (details: { renderer: 'webgl' | '2d' }) => void;
  onError?: (error: GlobeError) => void;
  onStatusChange?: (status: GlobeStatus) => void;
  classNames?: {
    root?: string;
    stage?: string;
    canvas?: string;
    controls?: string;
    control?: string;
    point?: string;
    tooltip?: string;
    pointList?: string;
    pointItem?: string;
    loading?: string;
    fallback?: string;
    error?: string;
    label?: string;
    legend?: string;
    legendItem?: string;
    search?: string;
    arcList?: string;
    arcItem?: string;
    arcDetails?: string;
  };
}

export interface GlobeSceneProps extends Omit<GlobeProps, 'ref' | 'className' | 'style'> {
  labels: GlobeLabels;
  onSceneStatus: (status: GlobeStatus, renderer: 'webgl' | '2d' | null) => void;
  onRetry: () => void;
}
