import type { NativeDocument, NativePage, MappedOperation, PageDescriptor } from './types';
import type {
  PdfWorkspaceEffects, PdfWorkspaceLayoutTarget, PdfWorkspaceMarkCommand,
  PdfWorkspacePage, PdfWorkspaceSourceBinding,
} from './workspace-types';
import { addMark, addReply, ensureId, removeMark, setReviewState, updateMark } from './model-edit';
import { mapNativePages } from './mapping';
import { toNativeAnnotationPatch, toNativeNewAnnotation } from './public-model';
import { pdfDate, plain } from './objects';

export const EMPTY_WORKSPACE_EFFECTS: PdfWorkspaceEffects = {
  removedReplies: [], removedLinks: [], removedPopups: [],
};

export function workspaceBindings(source: NativeDocument, uiPageIds: readonly string[]): PdfWorkspaceSourceBinding[] {
  if (source.pages.length < 1 || source.pages.length > 200 || uiPageIds.length !== source.pages.length
    || uiPageIds.some((id) => typeof id !== 'string' || !id) || new Set(uiPageIds).size !== uiPageIds.length) {
    throw new Error('UI page aliases do not match the immutable source pages.');
  }
  return source.pages.map((page, sourcePage) => ({ sourcePage, nativePageId: page.id, uiPageId: uiPageIds[sourcePage] }));
}
export function validateWorkspaceBindings(source: NativeDocument, bindings: readonly PdfWorkspaceSourceBinding[]): void {
  const expected = workspaceBindings(source, bindings.map((binding) => binding.uiPageId));
  if (JSON.stringify(expected) !== JSON.stringify(bindings)) throw new Error('Stored page alias/source binding differs from the actual source.');
}

/** Logical aliases do not write bytes; the exporter later stamps validated source identities explicitly. */
export function aliasWorkspaceSource(source: NativeDocument, bindings: readonly PdfWorkspaceSourceBinding[]): NativeDocument {
  validateWorkspaceBindings(source, bindings);
  const aliases = new Map(bindings.map((binding) => [binding.nativePageId, binding.uiPageId]));
  return {
    ...plain(source),
    pages: source.pages.map((page, index) => ({ ...plain(page), id: bindings[index].uiPageId })),
    annotations: source.annotations.map((annotation) => {
      const result = { ...plain(annotation), pageId: bindings[annotation.page].uiPageId };
      const destination = result._native?.destination;
      if (destination?.kind === 'goTo' && destination.targetPageId) {
        destination.targetPageId = aliases.get(destination.targetPageId) ?? destination.targetPageId;
      }
      return result;
    }),
  };
}
export function sourceCanvasPages(source: NativeDocument): PdfWorkspacePage[] {
  return source.pages.map((page, sourcePage) => ({
    id: page.id, sourcePage,
    bounds: { left: page.crop.x, bottom: page.crop.y, right: page.crop.x + page.crop.width, top: page.crop.y + page.crop.height },
  }));
}

export function applyWorkspaceMark(source: NativeDocument, command: PdfWorkspaceMarkCommand): NativeDocument {
  if (command.type !== 'remove') {
    if (typeof command.now !== 'string') throw new Error('Workspace mark command needs its captured timestamp.');
    pdfDate(command.now);
    const id = command.type === 'create' ? command.annotation.id : command.type === 'reply' ? command.reply.id : command.id;
    if (typeof id !== 'string' || !id) throw new Error('Workspace mark command needs its captured identity.');
  }
  switch (command.type) {
    case 'create': return addMark(source, toNativeNewAnnotation(command.annotation, command.annotation.id), { now: command.now });
    case 'update': return updateMark(source, command.id, toNativeAnnotationPatch(ensureId(source, command.id), command.patch), { now: command.now });
    case 'reply':
      for (const key of Object.keys(command.reply)) if (!['id', 'contents', 'author', 'pageId'].includes(key)) throw new Error('Unexpected workspace reply property.');
      return addReply(source, command.parentId, command.reply, { now: command.now });
    case 'review': return setReviewState(source, command.parentId, command.status, { now: command.now, id: command.id, author: command.author });
    case 'remove': return removeMark(source, command.id);
    default: throw new Error('Unknown workspace mark command.');
  }
}

function size(value: PdfWorkspaceLayoutTarget['size']): void {
  if (value && (!Number.isFinite(value.width) || !Number.isFinite(value.height)
    || value.width < 1 || value.height < 1 || value.width > 14400 || value.height > 14400)) {
    throw new Error('Workspace page size is outside the supported range.');
  }
}
export function workspaceLayoutDescriptors(source: NativeDocument, targets: readonly PdfWorkspaceLayoutTarget[]): PageDescriptor[] {
  if (!Array.isArray(targets) || targets.length < 1 || targets.length > 200) throw new Error('Invalid workspace page layout.');
  const ids = new Set<string>();
  return targets.map((target) => {
    for (const key of Object.keys(target)) if (!['id', 'fromPageId', 'copyGroup', 'size'].includes(key)) throw new Error('Unexpected workspace layout property.');
    if (!target.id || typeof target.id !== 'string' || ids.has(target.id)) throw new Error('Duplicate or invalid workspace page identity.');
    ids.add(target.id); size(target.size);
    if (target.fromPageId === undefined) {
      if (!target.size || source.pages.some((page) => page.id === target.id) || target.copyGroup !== undefined) {
        throw new Error('A new blank page needs a new identity and concrete size.');
      }
      return { id: target.id, size: plain(target.size) };
    }
    const sourcePage = source.pages.findIndex((page) => page.id === target.fromPageId);
    if (sourcePage < 0) throw new Error('Workspace copy/retained origin is not a current page instance.');
    const copy = target.id !== target.fromPageId;
    if (copy && (source.pages.some((page) => page.id === target.id) || typeof target.copyGroup !== 'string' || !target.copyGroup)) {
      throw new Error('A copied page needs a fresh identity and captured copy group.');
    }
    if (!copy && target.copyGroup !== undefined && target.copyGroup !== source.pages[sourcePage].copyGroup) {
      throw new Error('Retained page copy-group identity cannot be changed.');
    }
    return {
      id: target.id, sourcePage,
      ...(copy ? { copyGroup: target.copyGroup } : {}),
      ...(target.size === undefined ? {} : { size: plain(target.size) }),
    };
  });
}

/** Remove R-reply subtrees crossing a deleted page, without discarding Group/action/locked dependencies. */
export function workspaceDeletionClosure(source: NativeDocument, targets: readonly PdfWorkspaceLayoutTarget[]): {
  model: NativeDocument; removedReplies: string[];
} {
  const kept = new Set(targets.flatMap((target) => target.fromPageId ? [target.fromPageId] : []));
  const removedPages = new Set(source.pages.filter((page) => !kept.has(page.id)).map((page) => page.id));
  let model = source;
  while (true) {
    const reply = model.annotations.find((annotation) => !removedPages.has(annotation.pageId)
      && annotation.replyType === 'R' && annotation.inReplyTo !== undefined
      && model.annotations.some((parent) => parent.id === annotation.inReplyTo && removedPages.has(parent.pageId)));
    if (!reply?.inReplyTo) break;
    model = removeMark(model, reply.inReplyTo);
  }
  const remaining = new Set(model.annotations.map((annotation) => annotation.id));
  return { model, removedReplies: source.annotations.filter((annotation) => annotation.replyType === 'R'
    && !remaining.has(annotation.id)).map((annotation) => annotation.id) };
}

function resizePage(page: NativePage, target: PdfWorkspaceLayoutTarget): NativePage {
  if (!target.size) return page;
  return {
    ...page, size: plain(target.size),
    media: { x: page.crop.x, y: page.crop.y, ...target.size },
    crop: { x: page.crop.x, y: page.crop.y, ...target.size },
  };
}

export function projectWorkspaceLayout(
  source: NativeDocument, canvasPages: readonly PdfWorkspacePage[], targets: readonly PdfWorkspaceLayoutTarget[],
): { model: NativeDocument; canvasPages: PdfWorkspacePage[]; effects: PdfWorkspaceEffects; operation: MappedOperation } {
  const descriptors = workspaceLayoutDescriptors(source, targets);
  const closure = workspaceDeletionClosure(source, targets), operation = mapNativePages(closure.model, descriptors);
  const model = plain(operation.model);
  // These virtual destinations describe the next current instance, never a source-provenance input to export.
  for (const annotation of model.annotations) {
    const mapping = annotation._mapping, destination = annotation._native?.destination;
    if (!mapping || destination?.kind !== 'goTo' || !destination.targetPageId) continue;
    const targetId = destination.targetPageId;
    const own = targets.find((target) => target.fromPageId === targetId
      && (mapping.isCopy ? target.id !== target.fromPageId && target.copyGroup === mapping.scope : target.id === target.fromPageId));
    const retained = targets.find((target) => target.fromPageId === targetId && target.id === target.fromPageId);
    destination.targetPageId = (own ?? retained)?.id;
  }
  model.pages = model.pages.map((page, index) => resizePage(page, targets[index]));
  const nextCanvas = targets.map((target) => {
    const previous = canvasPages.find((page) => page.id === target.fromPageId);
    if (!previous) return {
      id: target.id, size: plain(target.size),
      bounds: { left: 0, bottom: 0, right: target.size?.width ?? 0, top: target.size?.height ?? 0 },
    };
    return {
      ...plain(previous), id: target.id,
      ...(target.id !== target.fromPageId ? { originPageId: previous.id, copyGroup: target.copyGroup } : {}),
      ...(target.size === undefined ? {} : { size: plain(target.size) }),
    };
  });
  return {
    model, canvasPages: nextCanvas,
    effects: { removedReplies: closure.removedReplies, removedLinks: operation.removedLinks, removedPopups: operation.removedPopupRecords },
    operation,
  };
}
