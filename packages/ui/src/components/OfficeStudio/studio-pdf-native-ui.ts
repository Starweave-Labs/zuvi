import type {
  PdfAnnotation,
  PdfAnnotationPatch,
  PdfEditableAnnotationKind,
  PdfNewAnnotation,
  PdfPoint,
  PdfRect,
  PdfRgb,
} from './studio-pdf-annotation-types';
import type { StudioPdfRenderResult } from './studio-types';

export type PdfNativeTool = 'select' | PdfEditableAnnotationKind | 'arrow';
export const PDF_NATIVE_LABELS: Record<PdfNativeTool | 'opaque', string> = {
  select: '选择',
  freeText: '文字',
  note: '便签',
  highlight: '高亮',
  underline: '下划线',
  strikeOut: '删除线',
  squiggly: '波浪线',
  square: '矩形',
  circle: '椭圆',
  line: '直线',
  arrow: '箭头',
  polygon: '多边形',
  polyLine: '折线',
  ink: '墨迹',
  opaque: '只读对象',
};

export function pdfNativeRgb(value: string): PdfRgb {
  const short = /^#?([a-f0-9]{3})$/i.exec(value),
    normal = /^#?([a-f0-9]{6})$/i.exec(value);
  const hex =
    normal?.[1] ??
    short?.[1]
      .split('')
      .map((letter) => letter + letter)
      .join('');
  if (!hex) throw new Error('请选择有效的颜色。');
  return [
    parseInt(hex.slice(0, 2), 16) / 255,
    parseInt(hex.slice(2, 4), 16) / 255,
    parseInt(hex.slice(4, 6), 16) / 255,
  ];
}
export function pdfNativeHex(value: PdfRgb | null): string {
  return value
    ? '#' +
        value
          .map((channel) =>
            Math.round(Math.min(1, Math.max(0, channel)) * 255)
              .toString(16)
              .padStart(2, '0')
          )
          .join('')
    : '#000000';
}

export function pdfNativeRootVisible(annotation: PdfAnnotation): boolean {
  return (
    !(annotation.native?.flags && annotation.native.flags & (1 | 2 | 32)) &&
    (!annotation.inReplyTo || annotation.replyType !== 'R') &&
    !['Widget', 'Popup', 'Link'].includes(annotation.native?.subtype ?? '')
  );
}
export function pdfNativeViewportRect(rect: PdfRect, view: StudioPdfRenderResult) {
  const points = [
    [rect[0], rect[1]],
    [rect[2], rect[1]],
    [rect[0], rect[3]],
    [rect[2], rect[3]],
  ].map(([x, y]) => view.toViewportPoint(x, y));
  const left = Math.min(...points.map((point) => point[0])),
    top = Math.min(...points.map((point) => point[1]));
  return {
    x: left,
    y: top,
    width: Math.max(1, Math.max(...points.map((point) => point[0])) - left),
    height: Math.max(1, Math.max(...points.map((point) => point[1])) - top),
  };
}
export function pdfNativeBounds(view: StudioPdfRenderResult) {
  const points = [
    [0, 0],
    [view.width, 0],
    [0, view.height],
    [view.width, view.height],
  ].map(([x, y]) => view.toPdfPoint(x, y));
  return {
    left: Math.min(...points.map((point) => point[0])),
    right: Math.max(...points.map((point) => point[0])),
    bottom: Math.min(...points.map((point) => point[1])),
    top: Math.max(...points.map((point) => point[1])),
  };
}
export function pdfNativeRect(points: readonly PdfPoint[], padding = 0): PdfRect {
  return [
    Math.min(...points.map((point) => point[0])) - padding,
    Math.min(...points.map((point) => point[1])) - padding,
    Math.max(...points.map((point) => point[0])) + padding,
    Math.max(...points.map((point) => point[1])) + padding,
  ];
}
export function pdfNativeTranslate(
  annotation: PdfAnnotation,
  x: number,
  y: number
): PdfAnnotationPatch {
  if (annotation.kind === 'opaque' || !annotation.rect) throw new Error('此对象不能移动。');
  return {
    kind: annotation.kind,
    rect: [
      x,
      y,
      x + annotation.rect[2] - annotation.rect[0],
      y + annotation.rect[3] - annotation.rect[1],
    ],
  };
}

export interface PdfNativeCreateStyle {
  text: string;
  author: string;
  font: string;
  fontSize: number;
  ink: string;
  marker: string;
  lineWidth: number;
}
export function pdfNativeCreate(
  tool: Exclude<PdfNativeTool, 'select'>,
  pageId: string,
  points: readonly PdfPoint[],
  style: PdfNativeCreateStyle,
  view: StudioPdfRenderResult
): PdfNewAnnotation {
  if (!points.length) throw new Error('请在页面内选择位置。');
  const bounds = pdfNativeBounds(view),
    first = points[0],
    last = points.at(-1)!;
  const common = { pageId, author: style.author, id: crypto.randomUUID() };
  if (tool === 'freeText') {
    if (!style.text.trim()) throw new Error('请先填写文字内容。');
    const width = Math.min(220, bounds.right - first[0] - 4),
      height = Math.min(
        Math.max(40, style.text.split('\n').length * style.fontSize * 1.2 + 6),
        first[1] - bounds.bottom - 4
      );
    if (width < style.fontSize + 4 || height < style.fontSize * 1.2 + 4)
      throw new Error('这里的空间不足，请选择页面内的其它位置。');
    return {
      ...common,
      kind: 'freeText',
      rect: [first[0], first[1] - height, first[0] + width, first[1]],
      contents: style.text,
      color: null,
      font: { family: style.font, size: style.fontSize, color: pdfNativeRgb(style.ink) },
    };
  }
  if (tool === 'note') {
    const x = Math.max(bounds.left + 2, Math.min(bounds.right - 24, first[0]));
    const y = Math.max(bounds.bottom + 2, Math.min(bounds.top - 24, first[1] - 22));
    return { ...common, kind: 'note', rect: [x, y, x + 22, y + 22], contents: style.text };
  }
  const drawn = pdfNativeRect(points);
  if (points.length < 2 || Math.hypot(drawn[2] - drawn[0], drawn[3] - drawn[1]) < 2)
    throw new Error('请拖动绘制一个有效区域。');
  const rgb = pdfNativeRgb(style.ink),
    stroke = { width: style.lineWidth };
  if (tool === 'line' || tool === 'arrow') {
    if (Math.hypot(last[0] - first[0], last[1] - first[1]) < 2)
      throw new Error('直线需要不同的起点和终点。');
    const padding = Math.max(2, style.lineWidth * 5),
      rect = pdfNativeRect([first, last], padding);
    return {
      ...common,
      kind: 'line',
      rect,
      line: [first[0], first[1], last[0], last[1]],
      lineEnds: ['None', tool === 'arrow' ? 'ClosedArrow' : 'None'],
      color: rgb,
      fill: tool === 'arrow' ? rgb : null,
      stroke,
    };
  }
  if (tool === 'ink' || tool === 'polygon' || tool === 'polyLine') {
    const coordinates = points.flatMap((point) => [point[0], point[1]]),
      rect = pdfNativeRect(points, Math.max(1, style.lineWidth / 2));
    if (tool === 'ink')
      return { ...common, kind: 'ink', rect, inkList: [coordinates], color: rgb, stroke };
    if (tool === 'polygon') {
      if (points.length < 3) throw new Error('多边形至少需要三个顶点。');
      return { ...common, kind: 'polygon', rect, vertices: coordinates, color: rgb, stroke };
    }
    return { ...common, kind: 'polyLine', rect, vertices: coordinates, color: rgb, stroke };
  }
  const rect = pdfNativeRect([first, last]);
  if (tool === 'square' || tool === 'circle')
    return { ...common, kind: tool, rect, color: rgb, stroke };
  const [x0, y0, x1, y1] = rect;
  return {
    ...common,
    kind: tool,
    rect,
    quadPoints: [x0, y1, x1, y1, x0, y0, x1, y0],
    color: pdfNativeRgb(style.marker),
  };
}
