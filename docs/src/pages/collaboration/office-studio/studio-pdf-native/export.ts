import { PDFRef, PDFHexString, PDFDict } from 'pdf-lib';
import type { NativeDocument, ExportOptions } from './types';
import { raw, required, load, graphReferences } from './objects';
import { readInventory, importNativeMarks } from './read';
import { annotationView, modelView, translatedGeometry, validateAnnotation, changedFields } from './model-edit';
import { finalizeFonts } from './fonts';
import { writeAnnotation } from './write';
import { name, APPLICATION_ID, PAGE_ID } from './constants';

export async function exportNativeMarks(bytes: Uint8Array, model: NativeDocument, options: ExportOptions = {}): Promise<Uint8Array> {
  const fonts = options.fonts ?? new Map<string, Uint8Array>();
  const pdf = await load(bytes);
  const source = readInventory(pdf, bytes);
  if (model.sourceHash !== source.sourceHash) throw new Error('Annotation model/source binding does not match.');
  if (JSON.stringify(modelView(model)) === JSON.stringify(modelView(source))) return bytes;
  if (source.signed) throw new Error('Signed PDFs are unchanged only.');
  if (JSON.stringify(model.pages) !== JSON.stringify(source.pages)) throw new Error('Use the explicit page-layout prototype for copy/reorder/extract.');
  const originals = new Map(source.annotations.map((entry) => [entry.id, entry]));
  const current = new Map(model.annotations.map((entry) => [entry.id, entry]));
  if (current.size !== model.annotations.length) throw new Error('Duplicate annotation identity.');
  const removed = new Set(model.deleted ?? []);
  if ([...removed].some((id) => current.has(id))) throw new Error('Deleted annotation remains in the live model.');
  for (const original of originals.values()) if (!current.has(original.id) && !removed.has(original.id)) throw new Error('Native annotation omission is not an explicit delete.');
  const nativeDicts = new Map<string, PDFDict>();
  const nativeRefs = new Map<string, PDFRef>();
  for (const [pageIndex, page] of pdf.getPages().entries()) for (const [ordinal, entry] of (page.node.Annots()?.asArray() ?? []).entries()) {
    const original = source.annotations.find((annotation) => annotation._native.sourcePage === pageIndex && annotation._native.ordinal === ordinal);
    const dict = pdf.context.lookup(entry);
    if (!(dict instanceof PDFDict)) throw new Error('Malformed native annotation dictionary.');
    const ref = entry instanceof PDFRef ? entry : pdf.context.register(dict);
    if (entry !== ref) required(page.node.Annots(), 'annotations').set(ordinal, ref);
    if (original) { nativeDicts.set(original.id, dict); nativeRefs.set(original.id, ref); }
  }
  const removedRefs = new Set([...removed].map((id) => nativeRefs.get(id)?.toString()).filter((value): value is string => value !== undefined));
  // Popup annotations are owned, not independent replies; remove those belonging to a deleted node.
  const ownedPopups = new Set<string>();
  for (const [id, dict] of nativeDicts) {
    if (removed.has(id)) {
      const popup = raw(dict, 'Popup'); if (popup instanceof PDFRef) ownedPopups.add(popup.toString());
    }
  }
  for (const [id, dict] of nativeDicts) {
    const ref = nativeRefs.get(id);
    if (removed.has(id) || ownedPopups.has(ref?.toString() ?? '')) continue;
    if (graphReferences(pdf, dict, removedRefs)) throw new Error('An opaque annotation/action/group depends on an annotation being deleted.');
  }
  if (graphReferences(pdf, pdf.catalog, removedRefs)) throw new Error('A native catalog/field/structure depends on an annotation being deleted.');
  for (const page of pdf.getPages()) for (const key of ['A', 'AA']) {
    const action = raw(page.node, key);
    if (action && graphReferences(pdf, action, removedRefs)) throw new Error('A native page action depends on an annotation being deleted.');
  }
  for (const id of removed) {
    const original = originals.get(id);
    if (!original || (!original.capabilities.remove && !(original._native.subtype === 'Popup' && original.popupOf !== undefined && removed.has(original.popupOf)))) throw new Error('Invalid native deletion.');
  }
  for (const annotation of model.annotations) {
    if (!Number.isInteger(annotation.page) || model.pages[annotation.page]?.id !== annotation.pageId) throw new Error('Annotation page identity does not match its ordinal.');
    const original = originals.get(annotation.id);
    if (!original) {
      if (annotation._native) throw new Error('New annotation cannot impersonate source provenance.');
      validateAnnotation(annotation);
      nativeRefs.set(annotation.id, pdf.context.nextRef());
    } else {
      if (JSON.stringify(annotation._native) !== JSON.stringify(original._native) || annotation.kind !== original.kind || annotation.pageId !== original.pageId || annotation.page !== original.page || annotation.inReplyTo !== original.inReplyTo || annotation.replyType !== original.replyType) throw new Error('Native provenance and reply identity are immutable.');
      if (JSON.stringify(annotationView(annotation)) !== JSON.stringify(annotationView(original))) {
        if (!original.capabilities.geometry && !original.capabilities.contents && !original.capabilities.appearance) throw new Error('Opaque source annotation was changed.');
        validateAnnotation(annotation);
        if (!original.capabilities.appearance && !translatedGeometry(original, annotation) && (annotation.quadPoints || annotation.inkList || annotation.line || annotation.vertices)) throw new Error('Native AP cannot be regenerated for this shape edit.');
        for (const key of changedFields(original, annotation)) {
          if (['modifiedAt', 'modificationPdf'].includes(key)) continue;
          if (!['rect', 'quadPoints', 'inkList', 'line', 'vertices', 'contents', 'color', 'fill', 'opacity', 'border', 'font', 'align', 'padding', 'rectDifferences', 'lineHeight', 'lineCap', 'lineJoin', 'miterLimit', 'lineEnds'].includes(key)) throw new Error('A source identity/author/time/relationship was changed without an explicit operation.');
          const permission = ['rect', 'quadPoints', 'inkList', 'line', 'vertices'].includes(key) ? 'geometry' : key === 'contents' ? 'contents' : 'appearance';
          if (!original.capabilities[permission]) throw new Error('Native annotation property is not editable.');
          if (key === 'rect' && (annotation.rect[2] - annotation.rect[0] !== original.rect[2] - original.rect[0] || annotation.rect[3] - annotation.rect[1] !== original.rect[3] - original.rect[1]) && !original.capabilities.resize) throw new Error('Native annotation cannot be resized with this font.');
        }
      }
    }
  }
  for (const annotation of model.annotations) if (!originals.has(annotation.id) && annotation.inReplyTo) {
    if (!current.has(annotation.inReplyTo) || annotation.replyType !== 'R' || annotation.kind !== 'note') throw new Error('New reply has an invalid target or relationship.');
    const originalParent = originals.get(annotation.inReplyTo), currentParent = current.get(annotation.inReplyTo);
    if (originalParent ? !originalParent.capabilities.reply : !!((required(currentParent, 'reply parent').flags ?? 4) & (64 | 128))) throw new Error('Native parent does not permit this new reply.');
    const visited = new Set([annotation.id]);
    let parent: string | undefined = annotation.inReplyTo;
    while (parent) {
      if (visited.has(parent)) throw new Error('New reply introduces an IRT cycle.');
      visited.add(parent); parent = current.get(parent)?.inReplyTo;
    }
  }
  for (const [index, page] of pdf.getPages().entries()) {
    page.node.set(PAGE_ID, PDFHexString.fromText(model.pages[index].id));
    page.node.set(name('Annots'), pdf.context.obj((page.node.Annots()?.asArray() ?? []).filter((ref) => !removedRefs.has(ref.toString()) && !ownedPopups.has(ref.toString()))));
  }
  for (const annotation of model.annotations) {
    const original = originals.get(annotation.id);
    const ref = required(nativeRefs.get(annotation.id), 'annotation reference');
    if (ownedPopups.has(ref?.toString() ?? '')) continue;
    const originalDict = nativeDicts.get(annotation.id);
    const changed = !original || JSON.stringify(annotationView(annotation)) !== JSON.stringify(annotationView(original));
    if (!changed) {
      required(originalDict, 'source annotation dictionary').set(APPLICATION_ID, PDFHexString.fromText(annotation.id));
      continue;
    }
    const dict = originalDict ? originalDict.clone(pdf.context) : pdf.context.obj({});
    await writeAnnotation(pdf, annotation, dict, original, pdf.getPages()[annotation.page], fonts, nativeRefs);
    pdf.context.assign(ref, dict);
    if (!original) required(pdf.getPages()[annotation.page].node.Annots(), 'page annotations').push(ref);
  }
  await finalizeFonts(pdf);
  return new Uint8Array(await pdf.save({ updateFieldAppearances: false, useObjectStreams: false }));
}

/** The same native AP exporter is the preview authority; a host draws SVG interaction handles only. */

export async function previewNativeMarks(bytes: Uint8Array, model: NativeDocument, options?: ExportOptions) {
  const preview = await exportNativeMarks(bytes, model, options), inventory = await importNativeMarks(preview);
  const visible = inventory.annotations.filter((annotation) => !(annotation._native.flags & (1 | 2 | 32)));
  return {
    bytes: preview, visualAuthority: 'native-appearance', svgBodies: false, pageMapping: 'source-order',
    nativeAppearanceIds: visible.filter((annotation) => annotation._native.hasAppearance).map((annotation) => annotation.id),
    textIconFallbacks: visible.filter((annotation) => annotation.kind === 'note' && !annotation._native.hasAppearance).map((annotation) => ({ id: annotation.id, pageId: annotation.pageId, rect: annotation.rect, iconName: annotation._native.iconName, color: annotation.color, flags: annotation._native.flags })),
    requiresAnnotationLayer: visible.some((annotation) => annotation.kind === 'note' || !!(annotation._native.flags & (8 | 16))),
  };
}
