import { PDFDict, PDFRef, PDFHexString } from 'pdf-lib';
import { applyPdfPageLayout } from '../studio-pdf-page-codec';
import type { StudioPdfDocument } from '../../../../../../packages/ui/src/components/OfficeStudio/studio-types';
import type {
  NativeDocument, NativePage, PageDescriptor, MappedAnnotation, AnnotationRecord,
  MappedOperation, MappedCommand, Dependency, RemovedLink, RemovedPopup,
  AnnotationPatch, NewAnnotation, NewReply, EditOptions, ReviewOptions, ExportOptions,
} from './types';
import { load, get, text, plain, required } from './objects';
import { readInventory, importNativeMarks } from './read';
import { exportNativeMarks } from './export';
import { addMark, updateMark, addReply, setReviewState, removeMark } from './model-edit';
import { sourceIdentity, editTime } from './runtime';
import { name, APPLICATION_ID, PAGE_ID } from './constants';

function mappingOf(annotation: AnnotationRecord): MappedAnnotation['_mapping'] {
  return required(annotation._mapping, 'page-instance mapping');
}
interface PageMapping {
  scope: string;
  sourcePage?: number;
  index?: number;
  isCopy: boolean;
  ownerId?: string;
}

export function mapNativePages(base: NativeDocument, descriptors: PageDescriptor[]): MappedOperation {
  if (base.signed) throw new Error('Signed PDFs cannot change page layout.');
  if (!Array.isArray(descriptors) || !descriptors.length || descriptors.length > 200) throw new Error('Invalid page layout.');
  const pages: NativePage[] = [], annotations: MappedAnnotation[] = [], mappings: PageMapping[] = [];
  const pageIds = new Set<string>(), retainedOriginals = new Map<string, number>(), scopePages = new Set<string>();
  for (const [index, descriptor] of descriptors.entries()) {
    if (!descriptor || typeof descriptor.id !== 'string' || !descriptor.id || pageIds.has(descriptor.id)) throw new Error('Invalid or duplicate page identity.');
    pageIds.add(descriptor.id);
    if (descriptor.sourcePage === undefined) {
      if (!descriptor.size || ![descriptor.size.width, descriptor.size.height].every((value) => Number.isFinite(value) && value > 0)) throw new Error('Blank pages need a concrete positive size.');
      pages.push({ id: descriptor.id, size: plain(descriptor.size), media: { x: 0, y: 0, ...descriptor.size }, crop: { x: 0, y: 0, ...descriptor.size }, rotation: 0, userUnit: 1 });
      mappings.push({ scope: descriptor.id, index, isCopy: false });
      continue;
    }
    if (!Number.isInteger(descriptor.sourcePage) || !base.pages[descriptor.sourcePage]) throw new Error('Invalid source page.');
    const original = base.pages[descriptor.sourcePage];
    if (descriptor.copyGroup !== undefined && descriptor.id === original.id) throw new Error('Copied page needs its own identity.');
    const isCopy = descriptor.id !== original.id || descriptor.copyGroup !== undefined;
    if (!isCopy && retainedOriginals.has(original.id)) throw new Error('Original page identity used twice.');
    const scope = isCopy ? descriptor.copyGroup ?? descriptor.id : 'original';
    if (scopePages.has(scope + ':' + descriptor.sourcePage)) throw new Error('One copy group cannot contain duplicate instances of the same source page.');
    scopePages.add(scope + ':' + descriptor.sourcePage);
    if (!isCopy) retainedOriginals.set(original.id, index);
    pages.push({ ...plain(original), id: descriptor.id, sourcePage: descriptor.sourcePage, ...(descriptor.copyGroup ? { copyGroup: descriptor.copyGroup } : {}), ...(isCopy ? { originId: original.originId ?? original.id } : {}) });
    mappings.push({ scope, sourcePage: descriptor.sourcePage, index, isCopy });
    for (const source of base.annotations.filter((annotation) => annotation.pageId === original.id)) {
      annotations.push({
        ...plain(source), id: isCopy ? sourceIdentity('annotation-copy', source.id + ':' + descriptor.id) : source.id,
        page: index, pageId: descriptor.id, ...(isCopy ? { originId: source.originId ?? source.id } : {}),
        _mapping: { sourceId: source.id, scope, isCopy },
      });
    }
  }
  if (new Set(annotations.map((annotation) => annotation.id)).size !== annotations.length) throw new Error('Duplicate mapped annotation identity.');
  const targetFor = (sourceId: string, scope: string): MappedAnnotation | undefined =>
    annotations.find((annotation) => annotation._mapping.sourceId === sourceId && annotation._mapping.scope === scope)
    ?? annotations.find((annotation) => annotation._mapping.sourceId === sourceId && !annotation._mapping.isCopy);
  const ownedTargetFor = (sourceId: string, scope: string): MappedAnnotation | undefined =>
    annotations.find((annotation) => annotation._mapping.sourceId === sourceId && annotation._mapping.scope === scope);
  const removedLinks: RemovedLink[] = [], removedPopups = new Set<string>(), removedPopupRecords: RemovedPopup[] = [];
  for (const annotation of annotations) {
    if (annotation.inReplyTo) {
      const target = targetFor(annotation.inReplyTo, annotation._mapping.scope);
      if (!target) throw new Error(annotation.replyType === 'R' ? 'Retained reply has a removed parent; include its thread closure or delete that reply explicitly.' : 'Opaque Group/unknown relationship targets a removed page.');
      annotation.inReplyTo = target.id;
    }
    if (annotation.popupOf) {
      const target = ownedTargetFor(annotation.popupOf, annotation._mapping.scope);
      if (!target) {
        removedPopups.add(annotation.id);
        removedPopupRecords.push({ id: annotation.id, page: annotation.page, sourceId: annotation._mapping.sourceId, reason: 'Owned Popup has no owner in its page-instance group.' });
      } else annotation.popupOf = target.id;
    }
    if (annotation.popupId) annotation.popupId = ownedTargetFor(annotation.popupId, annotation._mapping.scope)?.id;
    const destination = annotation._native?.destination;
    if (destination?.kind === 'goTo') {
      const target = base.pages.findIndex((page) => page.id === destination.targetPageId);
      const own = mappings.find((entry) => entry.scope === annotation._mapping.scope && entry.sourcePage === target)
        ?? mappings.find((entry) => !entry.isCopy && entry.sourcePage === target);
      if (!own && annotation._native?.subtype === 'Link') removedLinks.push({ id: annotation.id, sourceId: annotation._mapping.sourceId, reason: 'Native GoTo destination page was removed.' });
    }
  }
  const live = annotations.filter((annotation) => !removedPopups.has(annotation.id) && !removedLinks.some((entry) => entry.id === annotation.id));
  const dependencies: Dependency[] = [];
  for (const dependency of base.dependencies) {
    // AcroForm owns Widget references. The real page codec validates/remaps its
    // field tree, calculations and widget actions; these are not mark-thread closure.
    if (base.annotations.find((annotation) => annotation.id === dependency.targetId)?._native?.subtype === 'Widget') continue;
    const owners: PageMapping[] = dependency.ownerId
      ? live.filter((annotation) => annotation._mapping.sourceId === dependency.ownerId).map((annotation) => ({ scope: annotation._mapping.scope, isCopy: annotation._mapping.isCopy, ownerId: annotation.id }))
      : dependency.page !== undefined ? mappings.filter((mapping) => mapping.sourcePage === dependency.page)
      : [{ scope: 'original', isCopy: false }];
    for (const owner of owners) {
      const target = targetFor(dependency.targetId, owner.scope);
      const sourceOwner = dependency.ownerId ? base.annotations.find((annotation) => annotation.id === dependency.ownerId) : undefined;
      if (!target && sourceOwner?.popupId === dependency.targetId) continue;
      if (!target || removedPopups.has(target.id)) throw new Error('A retained native action or structure has no annotation target in the selected page closure.');
      if (!dependency.ownerId && dependency.page === undefined && target._mapping.isCopy) throw new Error('A global native reference requires its original annotation instance.');
      dependencies.push({ kind: dependency.kind, ...(owner.ownerId ? { ownerId: owner.ownerId } : {}), ...(dependency.page === undefined ? {} : { page: owner.index }), targetId: target.id });
    }
  }
  return { base, descriptors: plain(descriptors), model: { ...base, pages, annotations: live, deleted: [], dependencies }, removedLinks, removedPopups: [...removedPopups], removedPopupRecords, commands: [] };
}

function applyCommand(model: NativeDocument, command: MappedCommand): NativeDocument {
  if (command.type === 'add') return addMark(model, command.mark, command.options);
  if (command.type === 'update') return updateMark(model, command.id, command.patch, command.options);
  if (command.type === 'reply') return addReply(model, command.parentId, command.reply, command.options);
  if (command.type === 'review') return setReviewState(model, command.parentId, command.status, command.options);
  return removeMark(model, command.id);
}
export function addMappedMark(operation: MappedOperation, mark: NewAnnotation, options: EditOptions = {}): MappedOperation {
  return withCommand(operation, { type: 'add', mark: plain(mark), options: { now: editTime(options) } });
}
function withCommand(operation: MappedOperation, command: MappedCommand): MappedOperation {
  return { ...operation, model: applyCommand(operation.model, command), commands: [...operation.commands, plain(command)] };
}
export function updateMappedMark(operation: MappedOperation, id: string, patch: AnnotationPatch, options: EditOptions = {}): MappedOperation {
  return withCommand(operation, { type: 'update', id, patch: plain(patch), options: { now: editTime(options) } });
}
export function addMappedReply(operation: MappedOperation, parentId: string, reply: NewReply, options: EditOptions = {}): MappedOperation {
  return withCommand(operation, { type: 'reply', parentId, reply: plain(reply), options: { now: editTime(options) } });
}
export function setMappedReviewState(operation: MappedOperation, parentId: string, status: 'resolved' | 'open', options: ReviewOptions = {}): MappedOperation {
  return withCommand(operation, { type: 'review', parentId, status, options: { now: editTime(options), id: options.id ?? crypto.randomUUID(), author: options.author } });
}
export function removeMappedMark(operation: MappedOperation, id: string): MappedOperation {
  return withCommand(operation, { type: 'remove', id });
}

export async function exportMappedNativeMarks(bytes: Uint8Array, operation: MappedOperation, options?: ExportOptions): Promise<Uint8Array> {
  const original = await importNativeMarks(bytes);
  const sourceAnnotations = new Map(original.annotations.map((annotation) => [annotation.id, annotation]));
  const trustedBase: NativeDocument = { ...operation.base, signed: original.signed, dependencies: original.dependencies, annotations: operation.base.annotations.map((annotation) => {
    const source = sourceAnnotations.get(annotation.id);
    return source ? { ...annotation, _native: source._native, capabilities: source.capabilities, ...(source.passiveReasons ? { passiveReasons: source.passiveReasons } : {}) } : annotation;
  }) };
  const canonical = mapNativePages(trustedBase, operation.descriptors), commands = operation.commands;
  const expectedModel = commands.reduce(applyCommand, canonical.model);
  if (JSON.stringify(operation.model) !== JSON.stringify(expectedModel) || JSON.stringify(operation.removedLinks) !== JSON.stringify(canonical.removedLinks) || JSON.stringify(operation.removedPopups) !== JSON.stringify(canonical.removedPopups) || JSON.stringify(operation.removedPopupRecords) !== JSON.stringify(canonical.removedPopupRecords)) throw new Error('Mapped operation differs from its source, descriptors or explicit command ledger.');
  const prepared = await exportNativeMarks(bytes, operation.base, options), pdf = await load(prepared);
  if (readInventory(pdf, prepared).signed) throw new Error('Signed PDFs cannot change page layout.');
  const baseBySlot = new Map<string, string>();
  for (const annotation of operation.base.annotations) if (annotation._native) baseBySlot.set(annotation._native.sourcePage + ':' + annotation._native.ordinal, annotation.id);
  for (const [pageIndex, page] of pdf.getPages().entries()) for (const [ordinal, ref] of (page.node.Annots()?.asArray() ?? []).entries()) {
    const dict = pdf.context.lookup(ref);
    if (!(dict instanceof PDFDict)) throw new Error('Malformed native annotation.');
    const id = text(get(dict, 'ZuviAnnotationId')) ?? baseBySlot.get(pageIndex + ':' + ordinal);
    if (!id) throw new Error('Missing source annotation identity before mapping.');
    dict.set(APPLICATION_ID, PDFHexString.fromText(id));
  }
  const layout: StudioPdfDocument = {
    version: 1, kind: 'pdf', id: operation.base.sourceHash, name: 'native-annotations.pdf',
    sourcePageCount: pdf.getPageCount(), pageCount: operation.descriptors.length,
    pages: operation.descriptors, marks: [], rotations: {}, fields: [],
  };
  applyPdfPageLayout(pdf, layout);
  const refs = new Map<string, PDFRef>(), dictionaries = new Map<string, PDFDict>(), expected = canonical.model.annotations;
  for (const [pageIndex, page] of pdf.getPages().entries()) {
    page.node.set(PAGE_ID, PDFHexString.fromText(canonical.model.pages[pageIndex].id));
    const kept: PDFRef[] = [];
    for (const ref of page.node.Annots()?.asArray() ?? []) {
      const dict = pdf.context.lookup(ref);
      if (!(dict instanceof PDFDict) || !(ref instanceof PDFRef)) throw new Error('Mapped annotations need indirect canonical dictionaries.');
      const sourceId = text(get(dict, 'ZuviAnnotationId'));
      const annotation = expected.find((entry) => entry.page === pageIndex && mappingOf(entry).sourceId === sourceId);
      if (!annotation && canonical.removedPopupRecords.some((entry) => entry.page === pageIndex && entry.sourceId === sourceId)) continue;
      if (!annotation) throw new Error('Current page copier retained an annotation absent from the explicit mapped model.');
      kept.push(ref); refs.set(annotation.id, ref); dictionaries.set(annotation.id, dict);
      dict.set(APPLICATION_ID, PDFHexString.fromText(annotation.id));
      if (mappingOf(annotation).isCopy) {
        dict.set(name('NM'), PDFHexString.fromText(annotation.id));
        dict.set(name('ZuviAnnotationOriginId'), PDFHexString.fromText(required(annotation.originId, 'copy origin')));
      }
    }
    page.node.set(name('Annots'), pdf.context.obj(kept));
  }
  for (const annotation of expected) {
    const dict = required(dictionaries.get(annotation.id), 'mapped annotation dictionary');
    dict.set(name('P'), pdf.getPages()[annotation.page].ref);
    if (annotation.inReplyTo) dict.set(name('IRT'), required(refs.get(annotation.inReplyTo), 'mapped reply target'));
    if (annotation.popupId) dict.set(name('Popup'), required(refs.get(annotation.popupId), 'mapped Popup'));
    else if (operation.base.annotations.find((source) => source.id === mappingOf(annotation).sourceId)?.popupId) dict.delete(name('Popup'));
    if (annotation.popupOf) dict.set(name('Parent'), required(refs.get(annotation.popupOf), 'mapped Popup owner'));
  }
  const mapped = new Uint8Array(await pdf.save({ updateFieldAppearances: false, useObjectStreams: false }));
  return commands.length ? exportNativeMarks(mapped, commands.reduce(applyCommand, await importNativeMarks(mapped)), options) : mapped;
}
