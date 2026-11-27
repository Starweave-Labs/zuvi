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
    if (displayed === null && channel === 'color' && !['freeText', 'note'].includes(annotation.kind)) return { space: 'rgb', components: annotation.kind === 'highlight' ? [1, 1, 0] : [0, 0, 0] };
  }
  return rgbPaint(displayed);
}
/** A missing IC retains the existing black-border policy; an explicit empty IC is transparent. */
export function freeTextBorderPaint(annotation: AnnotationRecord, source?: AnnotationRecord): NativeDeviceColor {
  const paint = annotationPaint(annotation, source, 'fill');
  const missingSourceColor = !source || (source.fill === null && source._native?.colors?.fill === undefined);
  return paint.space === 'none' && annotation.fill === null && missingSourceColor
    ? { space: 'gray', components: [0] }
    : paint;
}
export function textPaint(annotation: AnnotationRecord, source: AnnotationRecord | undefined): NativeDeviceColor {
  if (!annotation.font) throw new Error('Missing text font.');
  const native = source?._native?.font?.deviceColor;
  return native && JSON.stringify(annotation.font.color) === JSON.stringify(source?.font?.color)
    ? { space: native.space, components: [...native.components] } : rgbPaint(annotation.font.color);
}
