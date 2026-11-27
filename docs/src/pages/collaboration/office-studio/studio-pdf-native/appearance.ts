import { PDFDocument, PDFDict, PDFRef, PDFNumber, PDFFont, PDFPage } from 'pdf-lib';
import type { AnnotationRecord, SourceAnnotation } from './types';
import { required, num } from './objects';
import { editableFont } from './fonts';
import { name, MARKERS } from './constants';
import { lineEndingGeometry } from './geometry';
import { annotationPaint, freeTextBorderPaint, paintOperator, textPaint } from './colors';

export function wrappedLines(textValue: string, width: number, font: PDFFont, size: number): string[] {
  const result = [];
  for (const paragraph of textValue.replace(/\r\n?/g, '\n').split('\n')) {
    let line = '';
    for (const character of paragraph) {
      if (font.widthOfTextAtSize(character, size) > width + 0.01) throw new Error('A glyph exceeds the FreeText content width.');
      const next = line + character;
      if (line && font.widthOfTextAtSize(next, size) > width + 0.01) { result.push(line); line = character; } else line = next;
    }
    result.push(line);
  }
  return result;
}

export function ellipsePath(x: number, y: number, width: number, height: number): string[] {
  const rx = width / 2, ry = height / 2, cx = x + rx, cy = y + ry, k = 4 / 3 * Math.tan(Math.PI / 8);
  return [
    num(cx + rx) + ' ' + num(cy) + ' m',
    [cx + rx, cy + k * ry, cx + k * rx, cy + ry, cx, cy + ry].map(num).join(' ') + ' c',
    [cx - k * rx, cy + ry, cx - rx, cy + k * ry, cx - rx, cy].map(num).join(' ') + ' c',
    [cx - rx, cy - k * ry, cx - k * rx, cy - ry, cx, cy - ry].map(num).join(' ') + ' c',
    [cx + k * rx, cy - ry, cx + rx, cy - k * ry, cx + rx, cy].map(num).join(' ') + ' c', 'h',
  ];
}

export function lineAppearance(annotation: AnnotationRecord, width: number, height: number, source?: AnnotationRecord): string {
  const [left, bottom] = annotation.rect;
  const local = (x: number, y: number): string => num(x - left) + ' ' + num(y - bottom);
  const strokePaint = annotationPaint(annotation, source, 'color'), fillPaint = annotationPaint(annotation, source, 'fill');
  const hasStroke = annotation.border.width > 0 && strokePaint.space !== 'none', hasFill = fillPaint.space !== 'none';
  const ops = ['q', '/GS gs', paintOperator(strokePaint, true), num(annotation.border.width) + ' w', num(annotation.lineCap) + ' J', num(annotation.lineJoin) + ' j', num(annotation.miterLimit) + ' M'];
  if (annotation.border.style === 'D') ops.push('[' + (annotation.border.dash ?? [3, 3]).map(num).join(' ') + '] 0 d');
  if (['square', 'circle'].includes(annotation.kind)) {
    const inset = annotation.border.width / 2;
    const [rdLeft, rdTop, rdRight, rdBottom] = required(annotation.rectDifferences, 'rectangle differences');
    const x = rdLeft + inset, y = rdBottom + inset, bodyWidth = Math.max(0, width - rdLeft - rdRight - annotation.border.width), bodyHeight = Math.max(0, height - rdTop - rdBottom - annotation.border.width);
    ops.push(paintOperator(fillPaint, false));
    if (annotation.kind === 'circle') ops.push(...ellipsePath(x, y, bodyWidth, bodyHeight));
    else ops.push([x, y, bodyWidth, bodyHeight].map(num).join(' ') + ' re');
    ops.push(hasFill ? (hasStroke ? 'B' : 'f') : hasStroke ? 'S' : 'n');
  } else if (['line', 'polygon', 'polyLine'].includes(annotation.kind)) {
    const points = required(annotation.kind === 'line' ? annotation.line : annotation.vertices, 'line or vertices');
    ops.push(paintOperator(fillPaint, false), local(points[0], points[1]) + ' m');
    for (let index = 2; index < points.length; index += 2) ops.push(local(points[index], points[index + 1]) + ' l');
    if (annotation.kind === 'polygon') ops.push('h');
    const bodyFill = annotation.kind !== 'line' && hasFill;
    ops.push(bodyFill ? hasStroke ? 'B' : 'f' : hasStroke ? 'S' : 'n');
    if (annotation.kind !== 'polygon') {
      const start = points.slice(0, 2), second = points.slice(2, 4), end = points.slice(-2), penultimate = points.slice(-4, -2);
      const lineEnds = required(annotation.lineEnds, 'line endings');
      const endings = [
        lineEndingGeometry(start, [second[0] - start[0], second[1] - start[1]], lineEnds[0], annotation.border.width),
        lineEndingGeometry(end, [penultimate[0] - end[0], penultimate[1] - end[1]], lineEnds[1], annotation.border.width),
      ];
      for (const ending of endings) {
        if (ending.shape === 'none') continue;
        ops.push('q', '[] 0 d');
        if (ending.shape === 'circle') ops.push(...ellipsePath(ending.center[0] - left - ending.radius, ending.center[1] - bottom - ending.radius, ending.radius * 2, ending.radius * 2));
        else {
          ending.points.forEach(([x, y], index) => ops.push(local(x, y) + (index ? ' l' : ' m')));
          if (ending.closed) ops.push('h');
        }
        const filled = ending.filled && hasFill;
        ops.push(filled ? hasStroke ? 'B' : 'f' : hasStroke ? 'S' : 'n', 'Q');
      }
    }
  } else if (annotation.kind === 'ink' && strokePaint.space !== 'none') {
    for (const stroke of required(annotation.inkList, 'ink strokes')) {
      ops.push(local(stroke[0], stroke[1]) + ' m');
      for (let index = 2; index < stroke.length; index += 2) ops.push(local(stroke[index], stroke[index + 1]) + ' l');
      ops.push('S');
    }
  } else if (MARKERS.has(annotation.kind) && strokePaint.space !== 'none') {
    ops.push(paintOperator(strokePaint, false));
    const quadPoints = required(annotation.quadPoints, 'QuadPoints');
    for (let index = 0; index < quadPoints.length; index += 8) {
      const q = quadPoints.slice(index, index + 8);
      if (annotation.kind === 'highlight') {
        ops.push(local(q[0], q[1]) + ' m', local(q[2], q[3]) + ' l', local(q[6], q[7]) + ' l', local(q[4], q[5]) + ' l', 'h', 'f');
      } else {
        const p0 = annotation.kind === 'strikeOut' ? [(q[0] + q[4]) / 2, (q[1] + q[5]) / 2] : [q[4], q[5]];
        const p1 = annotation.kind === 'strikeOut' ? [(q[2] + q[6]) / 2, (q[3] + q[7]) / 2] : [q[6], q[7]];
        ops.push(local(p0[0], p0[1]) + ' m');
        if (annotation.kind === 'squiggly') {
          const length = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), steps = Math.max(2, Math.ceil(length / 2));
          for (let step = 1; step <= steps; step++) {
            const t = step / steps, amplitude = step === steps ? 0 : (step % 2 ? 0.8 : -0.8);
            const normalX = length ? -(p1[1] - p0[1]) / length : 0, normalY = length ? (p1[0] - p0[0]) / length : 0;
            ops.push(local(p0[0] + t * (p1[0] - p0[0]) + normalX * amplitude, p0[1] + t * (p1[1] - p0[1]) + normalY * amplitude) + ' l');
          }
        } else ops.push(local(p1[0], p1[1]) + ' l');
        ops.push('S');
      }
    }
  } else if (annotation.kind === 'note') {
    ops.push(paintOperator(strokePaint, false), '0.45 0.32 0.05 RG', '0.7 w',
      '0.35 0.35 ' + num(width - 0.7) + ' ' + num(height - 0.7) + ' re',
      strokePaint.space === 'none' ? 'S' : 'B');
    for (const y of [height * 0.65, height * 0.45, height * 0.25]) ops.push(num(width * 0.2) + ' ' + num(y) + ' m', num(width * 0.8) + ' ' + num(y) + ' l', 'S');
  }
  ops.push('Q');
  return ops.filter(Boolean).join('\n');
}

export async function appearance(pdf: PDFDocument, annotation: AnnotationRecord, sourceDict: PDFDict, sourceAnnotation: SourceAnnotation | undefined, sourcePage: PDFPage, fonts: ReadonlyMap<string, Uint8Array>): Promise<PDFRef> {
  const width = annotation.rect[2] - annotation.rect[0], height = annotation.rect[3] - annotation.rect[1];
  const resources = pdf.context.obj({ ExtGState: { GS: { Type: 'ExtGState', CA: annotation.opacity, ca: annotation.opacity, ...(annotation.kind === 'highlight' ? { BM: 'Multiply' } : {}) } } });
  let contents;
  if (annotation.kind === 'freeText') {
    const fontInfo = required(annotation.font, 'FreeText font');
    const lineHeight = required(annotation.lineHeight, 'FreeText line height');
    const font = await editableFont(pdf, annotation, sourceDict, sourcePage, fonts);
    const [rdLeft, rdTop, rdRight, rdBottom] = required(annotation.rectDifferences, 'rectangle differences');
    let padding = annotation.padding;
    if (!padding && sourceAnnotation?._native.textLayout?.firstPosition) {
      const oldFont = required(sourceAnnotation.font, 'source font').family === fontInfo.family ? font : await editableFont(pdf, sourceAnnotation, sourceDict, sourcePage, fonts);
      const [x, y] = required(sourceAnnotation._native.textLayout?.firstPosition, 'source text position');
      const sourceFont = required(sourceAnnotation.font, 'source font');
      const [oldLeft, oldTop, oldRight] = required(sourceAnnotation.rectDifferences, 'source rectangle differences');
      const oldWidth = sourceAnnotation.rect[2] - sourceAnnotation.rect[0], oldHeight = sourceAnnotation.rect[3] - sourceAnnotation.rect[1];
      const oldBorder = sourceAnnotation.border.width, oldTextWidth = oldFont.widthOfTextAtSize(sourceAnnotation.contents.split(/\r\n?|\n/)[0], sourceFont.size);
      const innerLeft = oldLeft + oldBorder, innerRight = oldWidth - oldRight - oldBorder;
      let left = 0, right = 0;
      if (sourceAnnotation.align === 0) left = x - innerLeft;
      else if (sourceAnnotation.align === 2) right = innerRight - x - oldTextWidth;
      else {
        const offset = x + oldTextWidth / 2 - (innerLeft + innerRight) / 2;
        left = Math.max(0, offset * 2); right = Math.max(0, -offset * 2);
      }
      padding = [left, oldHeight - oldTop - oldBorder - y - oldFont.heightAtSize(sourceFont.size, { descender: false }), right, 0];
      if (padding.some((value) => value < -0.05)) throw new Error('Source FreeText placement cannot be represented by plain insets.');
      padding = padding.map((value) => Math.max(0, value));
    }
    padding ??= [2, 2, 2, 2];
    const [left, top, right, bottom] = padding;
    const available = width - rdLeft - rdRight - left - right - annotation.border.width * 2;
    const availableHeight = height - rdTop - rdBottom - top - bottom - annotation.border.width * 2;
    if (available <= 0 || availableHeight <= 0) throw new Error('FreeText content box is empty.');
    const lines = wrappedLines(annotation.contents, available, font, fontInfo.size);
    const ascent = font.heightAtSize(fontInfo.size, { descender: false });
    const total = font.heightAtSize(fontInfo.size) + (lines.length - 1) * lineHeight;
    if (total > availableHeight + 0.01) throw new Error('FreeText content does not fit; original source is unchanged.');
    const ops = ['q', '/GS gs'];
    const background = annotationPaint(annotation, sourceAnnotation, 'color');
    if (background.space !== 'none') ops.push(paintOperator(background, false), [rdLeft, rdBottom, width - rdLeft - rdRight, height - rdTop - rdBottom].map(num).join(' ') + ' re', 'f');
    const borderPaint = freeTextBorderPaint(annotation, sourceAnnotation);
    if (annotation.border.width && borderPaint.space !== 'none') {
      if (annotation.border.style === 'D') ops.push('[' + (annotation.border.dash ?? [3, 3]).map(num).join(' ') + '] 0 d');
      ops.push(paintOperator(borderPaint, true), num(annotation.border.width) + ' w', [rdLeft + annotation.border.width / 2, rdBottom + annotation.border.width / 2, width - rdLeft - rdRight - annotation.border.width, height - rdTop - rdBottom - annotation.border.width].map(num).join(' ') + ' re', 'S');
    }
    ops.push([rdLeft + left + annotation.border.width, rdBottom + bottom + annotation.border.width, available, availableHeight].map(num).join(' ') + ' re', 'W', 'n', 'BT', '/FT ' + num(fontInfo.size) + ' Tf', paintOperator(textPaint(annotation, sourceAnnotation), false));
    lines.forEach((line, index) => {
      const lineWidth = font.widthOfTextAtSize(line, fontInfo.size);
      const x = rdLeft + left + annotation.border.width + (annotation.align === 1 ? (available - lineWidth) / 2 : annotation.align === 2 ? available - lineWidth : 0);
      const y = height - rdTop - top - annotation.border.width - ascent - index * lineHeight;
      ops.push('1 0 0 1 ' + num(x) + ' ' + num(y) + ' Tm', font.encodeText(line).toString() + ' Tj');
    });
    ops.push('ET', 'Q');
    resources.set(name('Font'), pdf.context.obj({ FT: font.ref }));
    sourceDict.set(name('ZuviTextPadding'), pdf.context.obj(padding));
    sourceDict.set(name('ZuviTextLineHeight'), PDFNumber.of(lineHeight));
    contents = ops.join('\n');
  } else contents = lineAppearance(annotation, width, height, sourceAnnotation);
  const stream = pdf.context.flateStream(contents, { Type: 'XObject', Subtype: 'Form', FormType: 1, BBox: [0, 0, width, height], Resources: resources });
  return pdf.context.register(stream);
}
