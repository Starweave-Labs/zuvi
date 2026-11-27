import type { LineEnding, AnnotationRecord } from './types';
export type EndingGeometry =
  | { shape: 'none'; points: number[][]; filled: false; bounds: number[] }
  | { shape: 'circle'; center: number[]; radius: number; filled: true; bounds: number[] }
  | { shape: 'polygon' | 'polyline'; points: number[][]; closed: boolean; filled: boolean; bounds: number[] };
const finitePoint = (point: readonly number[]): boolean => point.length === 2 && point.every(Number.isFinite);
export function lineEndingGeometry(endpoint: number[], toward: number[], ending: LineEnding, width: number): EndingGeometry {
  if (!finitePoint(endpoint) || !finitePoint(toward) || !Number.isFinite(width) || width < 0) throw new Error('Invalid line-ending geometry.');
  const [x, y] = endpoint, length = Math.hypot(toward[0], toward[1]);
  const u = length ? [toward[0] / length, toward[1] / length] : [1, 0], v = [-u[1], u[0]];
  const point = (along: number, across: number): number[] => [x + u[0] * along + v[0] * across, y + u[1] * along + v[1] * across];
  const arrowLength = Math.max(6, 4 * width), half = Math.max(3, 2 * width), radius = Math.max(3, 1.5 * width);
  if (ending === 'None') return { shape: 'none', points: [endpoint], filled: false, bounds: [x, y, x, y] };
  if (ending === 'Circle') return { shape: 'circle', center: endpoint, radius, filled: true, bounds: [x - radius, y - radius, x + radius, y + radius] };
  let points: number[][], filled = false, closed = false;
  if (ending === 'Square') { points = [point(-radius, -radius), point(radius, -radius), point(radius, radius), point(-radius, radius)]; closed = filled = true; }
  else if (ending === 'Diamond') { points = [point(-half, 0), point(0, -half), point(half, 0), point(0, half)]; closed = filled = true; }
  else if (['OpenArrow', 'ClosedArrow', 'ROpenArrow', 'RClosedArrow'].includes(ending)) {
    const direction = ending.startsWith('R') ? -1 : 1;
    points = [point(direction * arrowLength, half), endpoint, point(direction * arrowLength, -half)];
    closed = filled = ending.endsWith('ClosedArrow');
  } else if (ending === 'Butt') points = [point(0, -half), point(0, half)];
  else if (ending === 'Slash') points = [point(-radius, -radius), point(radius, radius)];
  else throw new Error('Unsupported native line ending.');
  return { shape: closed ? 'polygon' : 'polyline', points, closed, filled, bounds: [Math.min(...points.map((value) => value[0])), Math.min(...points.map((value) => value[1])), Math.max(...points.map((value) => value[0])), Math.max(...points.map((value) => value[1]))] };
}
export function geometryPaintBounds(annotation: AnnotationRecord): number[] {
  const values: number[] = [];
  if (annotation.kind === 'line') values.push(...annotation.line ?? []);
  else if (['polygon', 'polyLine'].includes(annotation.kind)) values.push(...annotation.vertices ?? []);
  else return annotation.rect;
  const rects: number[][] = [];
  if (['line', 'polyLine'].includes(annotation.kind)) {
    const points = annotation.kind === 'line' ? annotation.line : annotation.vertices;
    if (!points || !annotation.lineEnds) throw new Error('Missing line geometry.');
    const start = points.slice(0, 2), second = points.slice(2, 4), end = points.slice(-2), penultimate = points.slice(-4, -2);
    rects.push(lineEndingGeometry(start, [second[0] - start[0], second[1] - start[1]], annotation.lineEnds[0], annotation.border.width).bounds);
    rects.push(lineEndingGeometry(end, [penultimate[0] - end[0], penultimate[1] - end[1]], annotation.lineEnds[1], annotation.border.width).bounds);
  }
  const xs = values.filter((_, index) => index % 2 === 0), ys = values.filter((_, index) => index % 2 === 1);
  rects.push([Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]);
  const pad = annotation.border.width / 2 * (annotation.lineJoin === 0 ? annotation.miterLimit : 1);
  return [Math.min(...rects.map((rect) => rect[0])) - pad, Math.min(...rects.map((rect) => rect[1])) - pad, Math.max(...rects.map((rect) => rect[2])) + pad, Math.max(...rects.map((rect) => rect[3])) + pad];
}
