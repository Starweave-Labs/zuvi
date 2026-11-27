import {
  PDFArray,
  PDFDict,
  PDFName,
  PDFNull,
  PDFRef,
  PDFString,
  PDFHexString,
  PDFRawStream,
  PDFStream,
  type PDFDocument,
  type PDFObject,
  type PDFPage,
} from 'pdf-lib';
import { sha256 } from './studio-pdf-compose-sha256';
import type {
  PdfComposeSourceState,
  PdfPageResolver,
  PdfSourceContext,
  StudioPdfComposeBytes,
  StudioPdfComposeValue,
} from './studio-pdf-compose-types';
export const name = (value: string): PDFName => PDFName.of(value);
export const text = (value: PDFObject | undefined): string | undefined =>
  value instanceof PDFName || value instanceof PDFString || value instanceof PDFHexString
    ? value.decodeText()
    : undefined;
export const hash = sha256;
export class PdfComposeError extends Error {
  readonly code: string;
  readonly source: string | undefined;
  readonly path: string;
  constructor(code: string, source: string | undefined, path: string, detail: string) {
    super(`${source ?? 'output'}:${path}: ${detail}`);
    this.name = 'PdfComposeError';
    this.code = code;
    this.source = source;
    this.path = path;
  }
}
export function fail(
  code: string,
  source: string | undefined,
  path: string,
  detail: string
): never {
  throw new PdfComposeError(code, source, path, detail);
}
export function resolve(
  source: PdfSourceContext,
  value: PDFObject | undefined
): PDFObject | undefined {
  return value instanceof PDFRef ? source.pdf.context.lookup(value) : value;
}
export function read(
  source: PdfSourceContext,
  dict: PDFObject | undefined,
  key: string
): PDFObject | undefined {
  const value = resolve(source, dict instanceof PDFDict ? dict.get(name(key)) : undefined);
  // Null dictionary values, including indirect nulls, are equivalent to absent keys.
  // Keep resolve unchanged: null array entries (for example XYZ coordinates) are real values.
  return value === PDFNull ? undefined : value;
}
export function refKey(source: PdfSourceContext, object: PDFObject): string | undefined {
  const ref = object instanceof PDFRef ? object : source.pdf.context.getObjectRef(object);
  return ref?.toString();
}
export function canonical(
  source: PdfSourceContext,
  object: PDFObject | undefined,
  excluded: readonly string[] = [],
  visiting = new Set<PDFObject>()
): StudioPdfComposeValue {
  const value = resolve(source, object);
  if (value === undefined) return undefined;
  if (value instanceof PDFStream) {
    const hashes = (source.streamHashes ??= new Map<PDFStream, string>());
    if (!hashes.has(value)) hashes.set(value, hash(value.getContents()));
    return ['stream', hashes.get(value), canonical(source, value.dict, ['Length'], visiting)];
  }
  if (value instanceof PDFDict || value instanceof PDFArray) {
    if (visiting.has(value)) return '[cycle]';
    visiting.add(value);
    let result: StudioPdfComposeValue;
    if (value instanceof PDFArray)
      result = value.asArray().map((entry) => canonical(source, entry, [], visiting));
    else {
      const record: Record<string, StudioPdfComposeValue> = {};
      for (const [key, entry] of value
        .entries()
        .filter(([key]) => !excluded.includes(key.decodeText()))
        .sort(([a], [b]) => a.decodeText().localeCompare(b.decodeText())))
        record[key.decodeText()] = canonical(source, entry, [], visiting);
      result = record;
    }
    visiting.delete(value);
    return result;
  }
  if (value instanceof PDFString || value instanceof PDFHexString)
    return ['string', value.decodeText()];
  return value.toString();
}
export function byteArray(value: StudioPdfComposeBytes): Promise<Uint8Array> {
  if (value instanceof Uint8Array) return Promise.resolve(value);
  if (value instanceof ArrayBuffer) return Promise.resolve(new Uint8Array(value));
  if (value instanceof Blob) return value.arrayBuffer().then((buffer) => new Uint8Array(buffer));
  throw new TypeError('PDF input must be Blob, Uint8Array, or ArrayBuffer');
}

/** Copy only an allowed object closure; page and field references must be preallocated. */
export class ClosedPdfCopier {
  readonly source: PdfComposeSourceState;
  readonly target: PDFDocument;
  readonly mapping: Map<string, PDFRef>;
  readonly pageResolver: PdfPageResolver;
  readonly objects = new Map<PDFObject, PDFObject>();
  readonly refs = new Map<string, PDFRef>();
  readonly sharedRefs: Map<string, PDFRef>;
  readonly sharedObjects: Map<PDFObject, PDFObject>;
  readonly shareable: Map<PDFObject, boolean>;
  private nodes = 0;
  constructor(
    source: PdfComposeSourceState,
    target: PDFDocument,
    mapping: Map<string, PDFRef>,
    pageResolver: PdfPageResolver
  ) {
    this.source = source;
    this.target = target;
    this.mapping = mapping;
    this.pageResolver = pageResolver;
    if (source.sharedTarget !== target) {
      source.sharedTarget = target;
      source.sharedRefs = new Map();
      source.sharedObjects = new Map();
      source.shareable = new Map();
    }
    this.sharedRefs = source.sharedRefs ??= new Map();
    this.sharedObjects = source.sharedObjects ??= new Map();
    this.shareable = source.shareable ??= new Map();
  }
  canShare(value: PDFObject | undefined): boolean {
    const root = resolve(this.source, value);
    if (!root) return false;
    const cached = this.shareable.get(root);
    if (cached !== undefined) return cached;
    const pending: (PDFObject | undefined)[] = [value],
      visited = new Set<PDFObject>();
    while (pending.length) {
      const entry = pending.pop(),
        object = resolve(this.source, entry);
      if (!object) {
        this.shareable.set(root, false);
        return false;
      }
      const ref = entry instanceof PDFRef ? entry : this.source.pdf.context.getObjectRef(object),
        key = ref?.toString();
      if (
        (key && (this.source.fieldRefs.has(key) || this.source.annotations.has(key))) ||
        (object instanceof PDFDict &&
          ['Page', 'Pages', 'Action'].includes(text(read(this.source, object, 'Type')) ?? ''))
      ) {
        this.shareable.set(root, false);
        return false;
      }
      if (visited.has(object)) continue;
      visited.add(object);
      if (object instanceof PDFStream) pending.push(object.dict);
      else if (object instanceof PDFDict)
        for (const [, item] of object.entries()) pending.push(item);
      else if (object instanceof PDFArray) for (const item of object.asArray()) pending.push(item);
    }
    this.shareable.set(root, true);
    return true;
  }
  shareCandidate(object: PDFObject): boolean {
    return (
      (object instanceof PDFStream ||
        (object instanceof PDFDict && text(read(this.source, object, 'Type')) === 'Font')) &&
      this.canShare(object)
    );
  }
  copy(value: PDFObject, path?: string): PDFObject;
  copy(value: undefined, path?: string): undefined;
  copy(value: PDFObject | undefined, path?: string): PDFObject | undefined;
  copy(value: PDFObject | undefined, path = '/'): PDFObject | undefined {
    if (++this.nodes > 1_000_000)
      fail('COPY_LIMIT', this.source.id, path, 'PDF object closure exceeds the supported limit');
    if (value === undefined) return undefined;
    if (value instanceof PDFRef) {
      const key = value.toString(),
        mapped = this.mapping.get(key);
      if (mapped) return mapped;
      const object = resolve(this.source, value);
      if (!object) fail('DANGLING_REFERENCE', this.source.id, path, `Missing object ${key}`);
      if (this.source.fieldRefs.has(key) || this.source.annotations.has(key))
        fail(
          'UNSELECTED_INTERACTIVE_REFERENCE',
          this.source.id,
          path,
          `Reference to an unselected field or annotation ${key}`
        );
      if (object instanceof PDFDict && text(read(this.source, object, 'Type')) === 'Page') {
        const page = this.pageResolver(value);
        if (page) return page;
        fail(
          'UNSELECTED_PAGE_REFERENCE',
          this.source.id,
          path,
          `Reference to unselected page ${key}`
        );
      }
      if (object instanceof PDFDict && text(read(this.source, object, 'Type')) === 'Pages')
        fail(
          'PAGE_TREE_ESCAPE',
          this.source.id,
          path,
          'Unexpected reference to an original /Pages branch'
        );
      const shared = this.shareCandidate(object),
        sharedRef = this.sharedRefs.get(key),
        localRef = this.refs.get(key);
      if (shared && sharedRef) return sharedRef;
      if (localRef) return localRef;
      const ref = this.target.context.nextRef();
      this.refs.set(key, ref);
      if (shared) this.sharedRefs.set(key, ref);
      this.target.context.assign(ref, this.copy(object, `${path}@${key}`));
      return ref;
    }
    if (value instanceof PDFDict) {
      const registered = this.source.pdf.context.getObjectRef(value)?.toString(),
        mapped = registered && this.mapping.get(registered);
      if (mapped) return mapped;
      if (
        registered &&
        (this.source.fieldRefs.has(registered) || this.source.annotations.has(registered))
      )
        fail(
          'UNSELECTED_INTERACTIVE_REFERENCE',
          this.source.id,
          path,
          `Unmapped interactive dictionary ${registered}`
        );
      const type = text(read(this.source, value, 'Type')),
        action = text(read(this.source, value, 'S'));
      if (
        type === 'Action' ||
        [
          'GoTo',
          'GoToR',
          'GoToE',
          'Launch',
          'Thread',
          'URI',
          'Sound',
          'Movie',
          'Hide',
          'Named',
          'SubmitForm',
          'ResetForm',
          'ImportData',
          'JavaScript',
          'SetOCGState',
          'Rendition',
          'Trans',
          'GoTo3DView',
        ].includes(action ?? '')
      )
        fail(
          'UNMIGRATED_ACTION',
          this.source.id,
          path,
          'An action outside a recognized navigation entry cannot be copied without a semantic mapping'
        );
      if (type === 'Page') {
        const ref = this.source.pdf.context.getObjectRef(value),
          page = ref && this.pageResolver(ref);
        if (page) return page;
        fail(
          'UNSELECTED_PAGE_REFERENCE',
          this.source.id,
          path,
          'Reference to an unselected direct page dictionary'
        );
      }
      if (type === 'Pages')
        fail('PAGE_TREE_ESCAPE', this.source.id, path, 'Unexpected original /Pages dictionary');
    }
    const shared = this.shareCandidate(value),
      sharedObject = this.sharedObjects.get(value),
      localObject = this.objects.get(value);
    if (shared && sharedObject) return sharedObject;
    if (localObject) return localObject;
    if (value instanceof PDFRawStream || value instanceof PDFStream) {
      for (const key of ['F', 'FFilter', 'FDecodeParms'])
        if (value.dict.has(name(key)))
          fail(
            'EXTERNAL_STREAM',
            this.source.id,
            `${path}/${key}`,
            'External stream data cannot be embedded from a Blob-only source'
          );
      if (value.dict.has(name('Ref')))
        fail(
          'EXTERNAL_XOBJECT',
          this.source.id,
          `${path}/Ref`,
          'Reference XObjects require an external source-resolution policy'
        );
      const dict = this.target.context.obj({}),
        stream = PDFRawStream.of(dict, value.getContents().slice());
      this.objects.set(value, stream);
      this.objects.set(value.dict, dict);
      if (shared) this.sharedObjects.set(value, stream);
      for (const [key, entry] of value.dict.entries())
        dict.set(key, this.copy(entry, `${path}/dict/${key.decodeText()}`));
      return stream;
    }
    if (value instanceof PDFArray) {
      const array = this.target.context.obj([]);
      this.objects.set(value, array);
      for (let index = 0; index < value.size(); index++)
        array.push(this.copy(value.get(index), `${path}[${index}]`));
      return array;
    }
    if (value instanceof PDFDict) {
      const dict = this.target.context.obj({});
      this.objects.set(value, dict);
      if (shared) this.sharedObjects.set(value, dict);
      for (const [key, entry] of value.entries())
        dict.set(key, this.copy(entry, `${path}/${key.decodeText()}`));
      return dict;
    }
    return value.clone();
  }
}
export function isolatePageContainers(target: PDFDocument, page: PDFPage): void {
  const contents = page.node.Contents();
  if (contents instanceof PDFArray) page.node.set(name('Contents'), contents.clone(target.context));
  const source = page.node.Resources();
  if (source instanceof PDFDict) {
    const resources = source.clone(target.context);
    for (const [key, entry] of source.entries()) {
      const value = target.context.lookup(entry);
      if (value instanceof PDFDict || value instanceof PDFArray)
        resources.set(key, value.clone(target.context));
    }
    page.node.set(name('Resources'), resources);
  }
}
