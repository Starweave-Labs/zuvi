import type { NativeDocument } from './types';
import type {
  PdfWorkspaceCommand, PdfWorkspaceEffects, PdfWorkspaceLayoutTarget, PdfWorkspaceMarkCommand,
  PdfWorkspacePage, PdfWorkspacePreviewBinding, PdfWorkspaceSerialized, PdfWorkspaceSnapshot, PdfWorkspaceSourceBinding,
} from './workspace-types';
import type {
  PdfAnnotationPatch, PdfNativeExportOptions, PdfNativeHostServices, PdfNativePreviewDescriptor, PdfNewAnnotation, PdfReply,
} from './public-types';
import { importNativeMarks } from './read';
import { exportNativeMarks } from './export';
import { exportMappedNativeMarks } from './mapping';
import { toPdfAnnotation } from './public-model';
import { plain } from './objects';
import { sha256 } from './runtime';
import {
  aliasWorkspaceSource, applyWorkspaceMark, EMPTY_WORKSPACE_EFFECTS, projectWorkspaceLayout,
  sourceCanvasPages, validateWorkspaceBindings, workspaceBindings,
} from './workspace-model';
import { bindWorkspaceSourceIdentities } from './workspace-identities';
import { nativeExportOptions, throwIfAborted } from './host-fonts';

/** Prototype host bridge, deliberately not re-exported by public index.ts pending root review. */
export class NativePdfWorkspace {
  private constructor(
    private readonly original: Uint8Array,
    private readonly bindings: readonly PdfWorkspaceSourceBinding[],
    private readonly model: NativeDocument,
    private readonly canvasPages: readonly PdfWorkspacePage[],
    private readonly history: readonly PdfWorkspaceCommand[],
    private readonly services: Partial<PdfNativeHostServices>,
    private readonly effects: PdfWorkspaceEffects,
  ) {}

  static async read(bytes: Uint8Array, uiSourcePageIds: readonly string[], services: Partial<PdfNativeHostServices> = {}): Promise<NativePdfWorkspace> {
    const original = new Uint8Array(bytes), source = await importNativeMarks(original);
    const bindings = workspaceBindings(source, uiSourcePageIds), model = aliasWorkspaceSource(source, bindings);
    return new NativePdfWorkspace(original, bindings, model, sourceCanvasPages(model), [], services, EMPTY_WORKSPACE_EFFECTS);
  }
  static async restore(bytes: Uint8Array, stored: PdfWorkspaceSerialized, services: Partial<PdfNativeHostServices> = {}): Promise<NativePdfWorkspace> {
    const original = new Uint8Array(bytes), source = await importNativeMarks(original);
    if (stored.version !== 1 || stored.sourceHash !== source.sourceHash) throw new Error('Stored native workspace/source binding does not match.');
    validateWorkspaceBindings(source, stored.bindings);
    const model = aliasWorkspaceSource(source, stored.bindings);
    let workspace = new NativePdfWorkspace(original, plain(stored.bindings), model, sourceCanvasPages(model), [], services, EMPTY_WORKSPACE_EFFECTS);
    for (const command of stored.commands) {
      if (command.type === 'mark') workspace = workspace.accept(command.command);
      else if (command.type === 'layout') workspace = workspace.layout(command.targets);
      else throw new Error('Unknown native workspace command.');
    }
    return workspace;
  }
  private next(model: NativeDocument, pages: readonly PdfWorkspacePage[], command: PdfWorkspaceCommand, effects = this.effects): NativePdfWorkspace {
    return new NativePdfWorkspace(this.original, this.bindings, model, pages, [...this.history, plain(command)], this.services, effects);
  }
  private id(value?: string): string { return value ?? this.services.createId?.() ?? crypto.randomUUID(); }
  private now(value?: string): string { return value ?? this.services.nowIso?.() ?? new Date().toISOString(); }

  serialize(): PdfWorkspaceSerialized {
    return { version: 1, sourceHash: this.model.sourceHash, bindings: plain(this.bindings), commands: plain(this.history) };
  }
  snapshot(): PdfWorkspaceSnapshot {
    return {
      version: 1, sourceHash: this.model.sourceHash, signed: this.model.signed,
      pages: this.model.pages.map(({ ref: _ref, size: _size, ...page }) => plain(page)),
      canvasPages: plain(this.canvasPages),
      annotations: this.model.annotations.map((annotation) => toPdfAnnotation(annotation, this.model.signed)),
      deleted: [...this.model.deleted],
      removedLinks: plain(this.effects.removedLinks), removedPopups: plain(this.effects.removedPopups), effects: plain(this.effects),
    };
  }
  /** Captured commands are the only inputs to immutable history; source metadata is never restored from a snapshot. */
  accept(command: PdfWorkspaceMarkCommand): NativePdfWorkspace {
    return this.next(applyWorkspaceMark(this.model, command), this.canvasPages, { type: 'mark', command });
  }
  create(annotation: PdfNewAnnotation, now?: string): NativePdfWorkspace {
    return this.accept({ type: 'create', annotation: { ...plain(annotation), id: this.id(annotation.id) }, now: this.now(now) });
  }
  update(id: string, patch: PdfAnnotationPatch, now?: string): NativePdfWorkspace {
    return this.accept({ type: 'update', id, patch: plain(patch), now: this.now(now) });
  }
  reply(parentId: string, reply: PdfReply, now?: string): NativePdfWorkspace {
    return this.accept({ type: 'reply', parentId, reply: { ...plain(reply), id: this.id(reply.id) }, now: this.now(now) });
  }
  review(parentId: string, status: 'resolved' | 'open', author: string, now?: string, id?: string): NativePdfWorkspace {
    return this.accept({ type: 'review', parentId, status, author, now: this.now(now), id: this.id(id) });
  }
  remove(id: string): NativePdfWorkspace { return this.accept({ type: 'remove', id }); }
  layout(targets: readonly PdfWorkspaceLayoutTarget[]): NativePdfWorkspace {
    const projected = projectWorkspaceLayout(this.model, this.canvasPages, targets);
    return this.next(projected.model, projected.canvasPages, { type: 'layout', targets }, projected.effects);
  }

  async export(options: PdfNativeExportOptions = {}): Promise<Uint8Array> {
    throwIfAborted(options.signal);
    if (this.history.length === 0) return new Uint8Array(this.original);
    let bytes = await bindWorkspaceSourceIdentities(this.original, this.bindings);
    let current: NativeDocument = await importNativeMarks(bytes);
    for (const command of this.history) {
      throwIfAborted(options.signal);
      if (command.type === 'mark') current = applyWorkspaceMark(current, command.command);
      else {
        // Historical UI copyGroup belongs to an existing instance. Reapplying it would create another copy.
        const currentTargets = command.targets.map((target) => {
          if (target.id !== target.fromPageId) return target;
          const { copyGroup: _copyGroup, ...retained } = target;
          return retained;
        });
        const projected = projectWorkspaceLayout(current, sourceCanvasPages(current), currentTargets);
        const settings = await nativeExportOptions(projected.operation.model, this.services, options);
        bytes = await exportMappedNativeMarks(bytes, projected.operation, settings);
        current = await importNativeMarks(bytes);
      }
    }
    const result = await exportNativeMarks(bytes, current, await nativeExportOptions(current, this.services, options));
    throwIfAborted(options.signal);
    return new Uint8Array(result);
  }
  previewBinding(): PdfWorkspacePreviewBinding {
    return {
      rendersCurrentPageOrder: true, pageCount: this.model.pages.length, sourcePageCount: this.model.pages.length,
      pages: this.model.pages.map((page, sourcePage) => ({ id: page.id, sourcePage })), rotations: {},
    };
  }
  async preview(options: PdfNativeExportOptions = {}): Promise<PdfNativePreviewDescriptor & { binding: PdfWorkspacePreviewBinding }> {
    const bytes = await this.export(options), current = await importNativeMarks(bytes);
    const visible = current.annotations.filter((annotation) => !((annotation._native?.flags ?? 0) & (1 | 2 | 32)));
    throwIfAborted(options.signal);
    return {
      source: new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }), revision: sha256(bytes),
      rendersCurrentPageOrder: true,
      nativeBodyIds: visible.filter((annotation) => annotation._native?.hasAppearance).map((annotation) => annotation.id),
      noApIconIds: visible.filter((annotation) => annotation.kind === 'note' && !annotation._native?.hasAppearance).map((annotation) => annotation.id),
      requiresAnnotationLayer: visible.some((annotation) => annotation.kind === 'note' || !!((annotation._native?.flags ?? 0) & (8 | 16))),
      binding: this.previewBinding(),
    };
  }
}
