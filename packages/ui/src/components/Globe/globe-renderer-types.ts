import type { GlobeArc, GlobePoint, GlobeView } from './globe-types';

export interface GlobePalette {
  ocean: string;
  land: string;
  coast: string;
  grid: string;
  atmosphere: string;
  point: string;
  arc: string;
}

export interface GlobeProjectedPoint {
  id: string;
  x: number;
  y: number;
  visible: boolean;
}

export interface GlobeRendererSnapshot {
  view: GlobeView;
  points: readonly GlobePoint[];
  arcs: readonly GlobeArc[];
  selectedId: string | null;
  selectedArcId?: string | null;
  palette: GlobePalette;
  animateArcs: boolean;
  /** Accumulated visible, non-reduced-motion animation time, in seconds. */
  time: number;
}

export interface GlobeRenderer {
  resize: (width: number, height: number, pixelRatio: number) => void;
  render: (snapshot: GlobeRendererSnapshot) => readonly GlobeProjectedPoint[];
  dispose: () => void;
}

export interface GlobeRendererModule {
  createGlobeRenderer: (canvas: HTMLCanvasElement) => GlobeRenderer;
}
