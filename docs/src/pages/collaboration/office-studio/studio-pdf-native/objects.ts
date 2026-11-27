import { PDFDocument, PDFDict, PDFArray, PDFName, PDFRef, PDFString, PDFHexString, PDFNumber, PDFNull, PDFRawStream, PDFStream, PDFObject, StandardFonts, decodePDFRawStream } from 'pdf-lib';
import type { ReviewState, UnknownReview, LineEnding } from './types';
import { name, STATES, LINE_ENDS } from './constants';
import { sha256 } from './runtime';

export function raw(dict: PDFDict, key: string): PDFObject | undefined {
  const value = dict.get(name(key));
  return value === undefined || dict.context.lookup(value) === PDFNull ? undefined : value;
}

export function get(dict: PDFDict, key: string): PDFObject | undefined {
  const value = raw(dict, key);
  return value === undefined ? undefined : dict.context.lookup(value);
}

export function has(dict: PDFDict, key: string): boolean { return raw(dict, key) !== undefined; }

export function text(value: PDFObject | undefined): string | undefined {
  return value instanceof PDFString || value instanceof PDFHexString || value instanceof PDFName
    ? value.decodeText() : undefined;
}

export function number(value: PDFObject | undefined): number | undefined { return value instanceof PDFNumber ? value.asNumber() : undefined; }

export function array(value: PDFObject | undefined): (number | null | undefined)[] | undefined {
  return value instanceof PDFArray ? value.asArray().map((_, index) => value.lookup(index) === PDFNull ? null : number(value.lookup(index))) : undefined;
}

export function names(value: PDFObject | undefined): (string | null | undefined)[] | undefined {
  return value instanceof PDFArray ? value.asArray().map((_, index) => value.lookup(index) === PDFNull ? null : text(value.lookup(index))) : undefined;
}
export function numbers(value: PDFObject | undefined): number[] | undefined {
  const parsed = array(value);
  return finiteArray(parsed) ? parsed : undefined;
}
export function readLineEnds(value: PDFObject | undefined): LineEnding[] | undefined {
  const entries = names(value);
  if (!entries || entries.length !== 2 || entries.some((entry) => typeof entry !== 'string' || !LINE_ENDS.has(entry))) return;
  return entries as LineEnding[];
}
export function required<T>(value: T | undefined | null, label: string): T {
  if (value === undefined || value === null) throw new Error('Missing ' + label + '.');
  return value;
}
export function keys<T extends object>(value: T): (keyof T)[] {
  return Object.keys(value) as (keyof T)[];
}
export function standardFont(value: string): value is StandardFonts {
  return Object.values(StandardFonts).some((font) => font === value);
}

export function finiteArray(value: unknown, count?: number): value is number[] {
  return Array.isArray(value) && (!count || value.length === count) && value.every((entry) => typeof entry === 'number' && Number.isFinite(entry));
}

/** PDF plain text permits tab/newline/carriage return, but not the other ASCII control codes. */
export function unsupportedTextControl(value: string): boolean {
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    if (code <= 8 || code === 11 || code === 12 || (code >= 14 && code <= 31)) return true;
  }
  return false;
}

export function plain<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }

export function num(value: number): string { return String(Number(value.toFixed(5))); }

export function rectangleValid(rect: unknown, allowZero = false): rect is number[] {
  return finiteArray(rect, 4) && (allowZero ? rect[2] >= rect[0] && rect[3] >= rect[1] : rect[2] > rect[0] && rect[3] > rect[1]);
}

export function stateValid(value: UnknownReview | undefined): value is ReviewState {
  return !!value && value.model !== undefined && value.state !== undefined && !!STATES.get(value.model)?.has(value.state);
}

export function pdfDate(iso: string): string {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) throw new Error('Invalid annotation timestamp.');
  return 'D:' + date.toISOString().slice(0, 19).replace(/[-:T]/g, '') + 'Z';
}

export function isoDate(value: string | undefined): string | undefined {
  if (typeof value !== 'string') return;
  // Preserve any partial/unknown raw date; expose ISO only when every component is present.
  const match = /^D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(Z|[+-]\d{2}'?\d{2}'?)?$/.exec(value);
  if (!match) return;
  const zone = !match[7] || match[7] === 'Z' ? 'Z' : match[7].replace(/'/g, '').replace(/(\d{2})(\d{2})$/, '$1:$2');
  const candidate = match[1] + '-' + match[2] + '-' + match[3] + 'T' + match[4] + ':' + match[5] + ':' + match[6] + zone;
  const date = new Date(candidate);
  if (Number.isFinite(date.getTime())) return date.toISOString();
}

export function annotationAppearance(dict: PDFDict): PDFObject | undefined {
  const ap = get(dict, 'AP');
  const normal = ap instanceof PDFDict ? get(ap, 'N') : undefined;
  if (normal instanceof PDFDict) {
    const selected = text(get(dict, 'AS'));
    return selected ? get(normal, selected) : undefined;
  }
  return normal;
}

export function streamBytes(stream: PDFObject | undefined): Uint8Array | undefined {
  if (stream instanceof PDFRawStream) return decodePDFRawStream(stream).decode();
  if (stream instanceof PDFStream) return stream.getContents();
}

export function streamHash(stream: PDFObject | undefined): string | undefined {
  const bytes = streamBytes(stream);
  return bytes ? sha256(bytes) : undefined;
}

/** A small content lexer, not a PDF layout converter. Strings/comments cannot masquerade as Tf. */

export function writeText(dict: PDFDict, key: string, value: string | undefined): void {
  if (value === undefined) dict.delete(name(key));
  // Content operator/date/enum strings must be ASCII bytes; UTF-16 DA is not valid PDF syntax.
  else if (['DA', 'M', 'CreationDate', 'State', 'StateModel'].includes(key)) dict.set(name(key), PDFString.of(value));
  else dict.set(name(key), PDFHexString.fromText(value));
}

export function nativeFingerprint(dict: PDFDict): string {
  // P is page ownership, IRT and Popup have explicit graph contracts, and app IDs are invisible identity only.
  const values = dict.entries().filter(([key]) => !['P', 'ZuviAnnotationId'].includes(key.decodeText()))
    .map(([key, value]) => [key.decodeText(), value.toString()]).sort(([left], [right]) => left.localeCompare(right));
  return sha256(JSON.stringify(values) + ':' + (streamHash(annotationAppearance(dict)) ?? ''));
}

export function loadSignature(pdf: PDFDocument): boolean {
  const seen = new Set<PDFObject>();
  const visit = (value: PDFObject | undefined): boolean => {
    const object = pdf.context.lookup(value);
    if (!object || seen.has(object)) return false;
    seen.add(object);
    if (object instanceof PDFArray) return object.asArray().some(visit);
    if (!(object instanceof PDFDict)) return false;
    const range = get(object, 'ByteRange');
    if (range instanceof PDFArray && range.size() > 0) return true;
    if (get(object, 'Type') === name('Sig') && has(object, 'Contents')) return true;
    if (get(object, 'FT') === name('Sig')) {
      const signature = get(object, 'V');
      if (signature !== undefined) return true;
    }
    return object.entries().some(([key, entry]) => key !== name('Parent') && visit(entry));
  };
  return visit(pdf.catalog);
}

export async function load(bytes: Uint8Array): Promise<PDFDocument> {
  if (!(bytes instanceof Uint8Array) || !bytes.length || bytes.length > 50 * 1024 * 1024) throw new Error('PDF source must be nonempty and at most 50 MB.');
  const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
  if (pdf.getPageCount() < 1 || pdf.getPageCount() > 200) throw new Error('PDF prototype supports 1 to 200 pages.');
  const acroForm = get(pdf.catalog, 'AcroForm');
  if (acroForm instanceof PDFDict && has(acroForm, 'XFA')) throw new Error('XFA is unsupported; source remains intact.');
  for (const page of pdf.getPages()) {
    if (!Number.isFinite(page.getRotation().angle) || page.getRotation().angle % 90 !== 0) throw new Error('Unsupported page rotation.');
    const media = page.getMediaBox(), crop = page.getCropBox();
    if (![media.x, media.y, media.width, media.height, crop.x, crop.y, crop.width, crop.height].every(Number.isFinite) || media.width <= 0 || media.height <= 0 || crop.width <= 0 || crop.height <= 0) throw new Error('Invalid page bounds.');
  }
  return pdf;
}

export function graphTargets(pdf: PDFDocument, value: PDFObject | undefined, refIdentities: Map<string, string>, seen = new Set<PDFObject>(), result = new Set<string>()): Set<string> {
  if (value instanceof PDFRef && refIdentities.has(value.toString())) {
    result.add(required(refIdentities.get(value.toString()), 'reference identity'));
    return result; // Dependency edges are direct; the target's own graph is checked separately.
  }
  const object = pdf.context.lookup(value);
  if (!object || seen.has(object)) return result;
  seen.add(object);
  if (object instanceof PDFArray) object.asArray().forEach((entry) => graphTargets(pdf, entry, refIdentities, seen, result));
  // A GoTo destination owns a page reference, not every annotation on that page.
  if (object instanceof PDFDict && !['Page', 'Pages'].includes(text(get(object, 'Type')) ?? '')) for (const [key, entry] of object.entries()) {
    if (!['P', 'AP', 'Resources'].includes(key.decodeText())) graphTargets(pdf, entry, refIdentities, seen, result);
  }
  return result;
}

export function graphReferences(pdf: PDFDocument, value: PDFObject | undefined, targetRefs: Set<string>): boolean {
  return graphTargets(pdf, value, new Map([...targetRefs].map((ref) => [ref, ref]))).size > 0;
}

/** Native annotation export; Contents and existing appearance/font streams are not flattened or redrawn. */
