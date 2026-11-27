import { PDFName } from 'pdf-lib';
import type { AnnotationKind } from './types';

export const name = (value: string): PDFName => PDFName.of(value);
export const APPLICATION_ID = name('ZuviAnnotationId');
export const PAGE_ID = name('ZuviPageId');
export const KINDS = new Map<string, AnnotationKind>([
  ['FreeText', 'freeText'], ['Text', 'note'], ['Highlight', 'highlight'],
  ['Underline', 'underline'], ['StrikeOut', 'strikeOut'], ['Squiggly', 'squiggly'],
  ['Square', 'square'], ['Ink', 'ink'], ['Circle', 'circle'], ['Line', 'line'],
  ['Polygon', 'polygon'], ['PolyLine', 'polyLine'],
]);
export const LINE_ENDS = new Set<string>(['None', 'Square', 'Circle', 'Diamond', 'OpenArrow', 'ClosedArrow', 'Butt', 'ROpenArrow', 'RClosedArrow', 'Slash']);
export const MARKERS = new Set<string | undefined>(['highlight', 'underline', 'strikeOut', 'squiggly']);
export const STATES = new Map<string, Set<string>>([
  ['Marked', new Set(['Marked', 'Unmarked'])],
  ['Review', new Set(['Accepted', 'Rejected', 'Cancelled', 'Completed', 'None'])],
]);
export const MAX_ANNOTATIONS = 10_000;
export const MAX_POINTS = 10_000;
export const MAX_TEXT = 10_000;
