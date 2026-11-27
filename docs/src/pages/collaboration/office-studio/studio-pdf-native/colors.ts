import type { PDFObject } from 'pdf-lib';
import type { NativeDeviceColor, AnnotationRecord } from './types';
import { array, finiteArray, num } from './objects';

export function readDeviceColor(value: PDFObject | undefined): NativeDeviceColor | undefined {
  const components = array(value);
  if (!finiteArray(components) || ![0, 1, 3, 4].includes(components.length) || components.some((entry) => entry < 0 || entry > 1)) return;
  const space = components.length === 0 ? 'none' : components.length === 1 ? 'gray' : components.length === 3 ? 'rgb' : 'cmyk';
  return { space, components: [...components] };
}
export function deviceColorRgb(value: NativeDeviceColor): number[] | null {
  if (value.space === 'none') return null;
  if (value.space === 'gray') return [value.components[0], value.components[0], value.components[0]];
  if (value.space === 'rgb') return [...value.components];
  return [0, 1, 2].map((index) => 1 - Math.min(1, value.components[index] + value.components[3]));
}
export function color(value: PDFObject | undefined): number[] | null | undefined {
  const native = readDeviceColor(value);
  return native ? deviceColorRgb(native) : undefined;
}
/** Effective source defaults are separate from the retained native key/component identity. */
export function sourceAnnotationColor(kind: string, value: PDFObject | undefined, channel: 'color' | 'fill'): number[] | null {
  const decoded = color(value);
  if (decoded !== undefined) return decoded;
  // Malformed present values stay passive; they are never promoted through a fallback.
  if (value !== undefined) return null;
  if (channel === 'fill') return kind === 'freeText' ? [0, 0, 0] : null;
  if (['freeText', 'note', 'opaque'].includes(kind)) return null;
  return kind === 'highlight' ? [1, 1, 0] : [0, 0, 0];
}
export function rgbPaint(value: number[] | null): NativeDeviceColor {
  return value === null ? { space: 'none', components: [] } : { space: 'rgb', components: [...value] };
}
export function paintOperator(value: NativeDeviceColor, stroke: boolean): string {
  if (value.space === 'none') return '';
  const operator = value.space === 'gray' ? stroke ? 'G' : 'g' : value.space === 'cmyk' ? stroke ? 'K' : 'k' : stroke ? 'RG' : 'rg';
  return value.components.map(num).join(' ') + ' ' + operator;
}
/** Preserve the source device components when the user has not changed its displayed color. */
export function annotationPaint(annotation: AnnotationRecord, source: AnnotationRecord | undefined, channel: 'color' | 'fill'): NativeDeviceColor {
  const displayed = annotation[channel];
  if (source && JSON.stringify(displayed) === JSON.stringify(source[channel])) {
    const native = channel === 'color' ? source._native?.colors?.stroke : source._native?.colors?.fill;
    if (native) return { space: native.space, components: [...native.components] };
  }
  return rgbPaint(displayed);
}
/** Source defaults and explicit none are already resolved before painting. */
export function freeTextBorderPaint(annotation: AnnotationRecord, source?: AnnotationRecord): NativeDeviceColor {
  return annotationPaint(annotation, source, 'fill');
}
export function textPaint(annotation: AnnotationRecord, source: AnnotationRecord | undefined): NativeDeviceColor {
  if (!annotation.font) throw new Error('Missing text font.');
  const native = source?._native?.font?.deviceColor;
  return native && JSON.stringify(annotation.font.color) === JSON.stringify(source?.font?.color)
    ? { space: native.space, components: [...native.components] } : rgbPaint(annotation.font.color);
}
