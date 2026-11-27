import type { NativeDocument, MappedOperation } from './types';
import type {
  PdfAnnotationPatch, PdfNativeAnnotationCommand, PdfNativeAnnotationDocument, PdfNativeExportOptions,
  PdfNativeHostServices, PdfNativePreviewDescriptor, PdfNewAnnotation, PdfPageLayoutDescriptor, PdfReply,
} from './public-types';
import { importNativeMarks } from './read';
import { exportNativeMarks } from './export';
import { addMark, addReply, discussionState, ensureId, removeMark, setReviewState, updateMark } from './model-edit';
import {
  addMappedMark, addMappedReply, exportMappedNativeMarks, mapNativePages, removeMappedMark,
  setMappedReviewState, updateMappedMark,
} from './mapping';
import { toNativeAnnotationPatch, toNativeNewAnnotation, toPdfAnnotation } from './public-model';
import { nativeExportOptions, throwIfAborted } from './host-fonts';
import { plain, pdfDate } from './objects';
import { sha256 } from './runtime';

export interface PdfNativeEditOptions { now?: string }
export interface PdfNativeReviewOptions extends PdfNativeEditOptions { id?: string; author?: string }

/**
 * Immutable native state. Snapshot edits never change parser provenance or permissions.
 * Hosts can persist the serializable command ledger and keep one returned session per history transaction.
 */
export class NativePdfAnnotationSession {
  private constructor(
    private readonly sourceBytes: Uint8Array,
    private readonly native: NativeDocument,
    private readonly services: Partial<PdfNativeHostServices>,
    private readonly ledger: readonly PdfNativeAnnotationCommand[],
    private readonly mapping?: MappedOperation,
  ) {}

  static async read(bytes: Uint8Array, services: Partial<PdfNativeHostServices> = {}): Promise<NativePdfAnnotationSession> {
    const source = new Uint8Array(bytes);
    return new NativePdfAnnotationSession(source, await importNativeMarks(source), services, []);
  }

  private next(native: NativeDocument, command: PdfNativeAnnotationCommand, mapping?: MappedOperation): NativePdfAnnotationSession {
    return new NativePdfAnnotationSession(this.sourceBytes, native, this.services, [...this.ledger, plain(command)], mapping);
  }
  private now(options: PdfNativeEditOptions): string {
    return options.now ?? this.services.nowIso?.() ?? new Date().toISOString();
  }
  private createId(id: string | undefined): string {
    return id ?? this.services.createId?.() ?? crypto.randomUUID();
  }

  snapshot(): PdfNativeAnnotationDocument {
    return {
      version: 1, sourceHash: this.native.sourceHash, signed: this.native.signed,
      pages: this.native.pages.map(({ ref: _ref, size: _size, ...page }) => plain(page)),
      annotations: this.native.annotations.map((annotation) => toPdfAnnotation(annotation, this.native.signed)),
      deleted: [...this.native.deleted],
      removedLinks: plain(this.mapping?.removedLinks ?? []),
      removedPopups: plain(this.mapping?.removedPopupRecords ?? []),
    };
  }
  commands(): readonly PdfNativeAnnotationCommand[] { return plain(this.ledger); }
  revision(): string { return sha256(this.native.sourceHash + ':' + JSON.stringify(this.ledger)); }

  create(value: PdfNewAnnotation, options: PdfNativeEditOptions = {}): NativePdfAnnotationSession {
    const id = this.createId(value.id), now = this.now(options), accepted = { ...plain(value), id };
    const mark = toNativeNewAnnotation(accepted, id);
    const mapping = this.mapping ? addMappedMark(this.mapping, mark, { now }) : undefined;
    const native = mapping?.model ?? addMark(this.native, mark, { now });
    return this.next(native, { type: 'create', annotation: accepted, now }, mapping);
  }
  update(id: string, patch: PdfAnnotationPatch, options: PdfNativeEditOptions = {}): NativePdfAnnotationSession {
    const annotation = ensureId(this.native, id), properties = toNativeAnnotationPatch(annotation, patch);
    if (Object.keys(properties).length === 0) return this;
    const now = this.now(options);
    const mapping = this.mapping ? updateMappedMark(this.mapping, id, properties, { now }) : undefined;
    const native = mapping?.model ?? updateMark(this.native, id, properties, { now });
    return this.next(native, { type: 'update', id, patch: plain(patch), now }, mapping);
  }
  reply(parentId: string, value: PdfReply, options: PdfNativeEditOptions = {}): NativePdfAnnotationSession {
    for (const key of Object.keys(value)) if (!['id', 'contents', 'author', 'pageId'].includes(key)) {
      throw new Error('Unexpected public reply property: ' + key + '.');
    }
    const now = this.now(options), id = this.createId(value.id), reply = { ...plain(value), id };
    const mapping = this.mapping ? addMappedReply(this.mapping, parentId, reply, { now }) : undefined;
    const native = mapping?.model ?? addReply(this.native, parentId, reply, { now });
    return this.next(native, { type: 'reply', parentId, reply, now }, mapping);
  }
  review(parentId: string, status: 'resolved' | 'open', options: PdfNativeReviewOptions = {}): NativePdfAnnotationSession {
    const now = this.now(options), id = this.createId(options.id), author = options.author ?? '';
    const mapping = this.mapping ? setMappedReviewState(this.mapping, parentId, status, { now, id, author }) : undefined;
    const native = mapping?.model ?? setReviewState(this.native, parentId, status, { now, id, author });
    return this.next(native, { type: 'review', parentId, status, now, id, author }, mapping);
  }
  discussion(parentId: string): 'resolved' | 'open' { return discussionState(this.native, parentId); }
  remove(id: string): NativePdfAnnotationSession {
    const mapping = this.mapping ? removeMappedMark(this.mapping, id) : undefined;
    const native = mapping?.model ?? removeMark(this.native, id);
    return this.next(native, { type: 'remove', id }, mapping);
  }
  mapPages(pages: readonly PdfPageLayoutDescriptor[]): NativePdfAnnotationSession {
    if (this.mapping) throw new Error('Save and reopen before mapping page instances a second time.');
    const descriptors = plain(pages.map((page) => ({ ...page }))), mapping = mapNativePages(this.native, descriptors);
    return this.next(mapping.model, { type: 'map', pages: descriptors }, mapping);
  }

  /** Model and bytes are revalidated by the native exporter before any result is returned. */
  async export(options: PdfNativeExportOptions = {}): Promise<Uint8Array> {
    const settings = await nativeExportOptions(this.native, this.services, options);
    const bytes = this.mapping
      ? await exportMappedNativeMarks(this.sourceBytes, this.mapping, settings)
      : await exportNativeMarks(this.sourceBytes, this.native, settings);
    throwIfAborted(options.signal);
    return new Uint8Array(bytes);
  }
  async preview(options: PdfNativeExportOptions = {}): Promise<PdfNativePreviewDescriptor> {
    const bytes = await this.export(options), current = await importNativeMarks(bytes);
    throwIfAborted(options.signal);
    const visible = current.annotations.filter((annotation) => !((annotation._native?.flags ?? 0) & (1 | 2 | 32)));
    return {
      source: new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }),
      revision: sha256(bytes), rendersCurrentPageOrder: true,
      nativeBodyIds: visible.filter((annotation) => annotation._native?.hasAppearance).map((annotation) => annotation.id),
      noApIconIds: visible.filter((annotation) => annotation.kind === 'note' && !annotation._native?.hasAppearance).map((annotation) => annotation.id),
      requiresAnnotationLayer: visible.some((annotation) => annotation.kind === 'note' || !!((annotation._native?.flags ?? 0) & (8 | 16))),
    };
  }
}

export async function importPdfNativeAnnotationSession(
  bytes: Uint8Array, services: Partial<PdfNativeHostServices> = {},
): Promise<NativePdfAnnotationSession> {
  return NativePdfAnnotationSession.read(bytes, services);
}

/** A persisted UI snapshot alone never authorizes edits; only explicit checked commands are replayed. */
export async function restorePdfNativeAnnotationSession(
  bytes: Uint8Array, sourceHash: string, commands: readonly PdfNativeAnnotationCommand[],
  services: Partial<PdfNativeHostServices> = {},
): Promise<NativePdfAnnotationSession> {
  let session = await NativePdfAnnotationSession.read(bytes, services);
  if (session.snapshot().sourceHash !== sourceHash) throw new Error('Native annotation ledger/source binding does not match.');
  for (const command of commands) {
    if (command.type === 'create' || command.type === 'update' || command.type === 'reply' || command.type === 'review') {
      if (typeof command.now !== 'string') throw new Error('Native annotation command needs its captured timestamp.');
      pdfDate(command.now);
      const id = command.type === 'create' ? command.annotation.id : command.type === 'reply' ? command.reply.id : command.id;
      if (typeof id !== 'string' || !id) throw new Error('Native annotation command needs its captured identity.');
    }
    switch (command.type) {
      case 'create': session = session.create(command.annotation, { now: command.now }); break;
      case 'update': session = session.update(command.id, command.patch, { now: command.now }); break;
      case 'reply': session = session.reply(command.parentId, command.reply, { now: command.now }); break;
      case 'review': session = session.review(command.parentId, command.status, { now: command.now, id: command.id, author: command.author }); break;
      case 'remove': session = session.remove(command.id); break;
      case 'map': session = session.mapPages(command.pages); break;
      default: throw new Error('Unknown native annotation command.');
    }
  }
  return session;
}

