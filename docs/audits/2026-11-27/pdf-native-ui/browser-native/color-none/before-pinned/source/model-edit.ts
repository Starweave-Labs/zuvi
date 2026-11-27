import type { AnnotationRecord, NativeDocument, EditOptions, ReviewOptions, AnnotationPatch, NewAnnotation, NewReply } from './types';
import { finiteArray, plain, keys, rectangleValid, stateValid, pdfDate, unsupportedTextControl } from './objects';
import { KINDS, LINE_ENDS, MARKERS, MAX_POINTS, MAX_TEXT } from './constants';
import { editTime } from './runtime';

export function annotationView(annotation: AnnotationRecord): Omit<AnnotationRecord, "_native" | "capabilities" | "passiveReasons"> {
  const { _native, capabilities: _capabilities, passiveReasons: _passiveReasons, ...editable } = annotation;
  return editable;
}

export function modelView(model: NativeDocument): object {
  return { pages: model.pages.map(({ ref: _ref, ...page }) => page), annotations: model.annotations.map(annotationView), deleted: [...(model.deleted ?? [])].sort() };
}

export function assertWritable(model: NativeDocument): void {
  if (model.signed) throw new Error('Signed PDFs are unchanged only.');
}

export function ensureId(model: NativeDocument, id: string): AnnotationRecord {
  const annotation = model.annotations.find((entry) => entry.id === id);
  if (!annotation) throw new Error('Annotation does not exist.');
  return annotation;
}

export function translatedGeometry(original: AnnotationRecord, updated: AnnotationRecord): boolean {
  if (updated.rect[2] - updated.rect[0] !== original.rect[2] - original.rect[0] || updated.rect[3] - updated.rect[1] !== original.rect[3] - original.rect[1]) return false;
  const transform = (points: number[] | undefined): number[] | undefined => points?.map((value, index) => value + (index % 2 ? updated.rect[1] - original.rect[1] : updated.rect[0] - original.rect[0]));
  return JSON.stringify(updated.quadPoints) === JSON.stringify(transform(original.quadPoints)) && JSON.stringify(updated.inkList) === JSON.stringify(original.inkList?.map(transform)) && JSON.stringify(updated.line) === JSON.stringify(transform(original.line)) && JSON.stringify(updated.vertices) === JSON.stringify(transform(original.vertices));
}

/** Pure, one-model mutation result; consumers put exactly this result into one history transaction. */

export function updateMark(model: NativeDocument, id: string, patch: AnnotationPatch, options: EditOptions = {}): NativeDocument {
  const now = editTime(options);
  assertWritable(model);
  const annotation = ensureId(model, id);
  const allowed = new Set(['rect', 'contents', 'color', 'fill', 'opacity', 'border', 'font', 'align', 'padding', 'rectDifferences', 'lineHeight', 'quadPoints', 'inkList', 'lineCap', 'lineJoin', 'miterLimit', 'line', 'vertices', 'lineEnds']);
  for (const key of Object.keys(patch)) {
    if (!allowed.has(key)) throw new Error('Annotation identity, authorship and native relations are immutable in a property edit.');
    const capability = ['rect', 'quadPoints', 'inkList', 'line', 'vertices'].includes(key) ? 'geometry' : key === 'contents' ? 'contents' : 'appearance';
    if (!annotation.capabilities[capability]) throw new Error('Native annotation does not permit this edit.');
  }
  const properties = plain(patch);
  if (properties.rect && rectangleValid(properties.rect, annotation.kind === 'note')) {
    const [x0, y0, x1, y1] = annotation.rect;
    const [nextX0, nextY0, nextX1, nextY1] = properties.rect;
    const width = x1 - x0, height = y1 - y0;
    const scaleX = width ? (nextX1 - nextX0) / width : 1, scaleY = height ? (nextY1 - nextY0) / height : 1;
    if ((scaleX !== 1 || scaleY !== 1) && !annotation.capabilities.resize) throw new Error('The native font only permits translation; resizing needs a supported exact font.');
    const transform = (points: number[]): number[] => points.map((value, index) => index % 2 ? nextY0 + (value - y0) * scaleY : nextX0 + (value - x0) * scaleX);
    if (annotation.quadPoints && properties.quadPoints === undefined) properties.quadPoints = transform(annotation.quadPoints);
    if (annotation.inkList && properties.inkList === undefined) properties.inkList = annotation.inkList.map(transform);
    if (annotation.line && properties.line === undefined) properties.line = transform(annotation.line);
    if (annotation.vertices && properties.vertices === undefined) properties.vertices = transform(annotation.vertices);
  }
  const updated = { ...annotation, ...properties, modifiedAt: now, modificationPdf: pdfDate(now) };
  if ((properties.quadPoints || properties.inkList || properties.line || properties.vertices) && !translatedGeometry(annotation, updated) && !annotation.capabilities.appearance) throw new Error('Native AP permits translation only; a shape edit requires appearance regeneration.');
  validateAnnotation(updated);
  return { ...model, annotations: model.annotations.map((entry) => entry.id === id ? updated : entry) };
}

export function validateAnnotation(annotation: AnnotationRecord): void {
  if (!annotation || typeof annotation.id !== 'string' || !annotation.id || ![...KINDS.values()].includes(annotation.kind)) throw new Error('Unsupported editable annotation.');
  if (!rectangleValid(annotation.rect, annotation.kind === 'note')) throw new Error('Invalid annotation rectangle.');
  if (typeof annotation.contents !== 'string' || annotation.contents.length > MAX_TEXT || unsupportedTextControl(annotation.contents)) throw new Error('Invalid annotation text.');
  if (typeof annotation.author !== 'string' || annotation.author.length > 1000) throw new Error('Invalid author.');
  for (const value of [annotation.color, annotation.fill, annotation.font?.color]) {
    if (value !== null && value !== undefined && (!finiteArray(value, 3) || value.some((component) => component < 0 || component > 1))) throw new Error('Invalid annotation color.');
  }
  if (!Number.isFinite(annotation.opacity) || annotation.opacity < 0 || annotation.opacity > 1) throw new Error('Invalid annotation opacity.');
  if (!annotation.border || !Number.isFinite(annotation.border.width) || annotation.border.width < 0 || annotation.border.width > 72 || !['S', 'D'].includes(annotation.border.style)) throw new Error('Unsupported border.');
  if (annotation.border.dash && (!finiteArray(annotation.border.dash) || annotation.border.dash.some((value) => value < 0) || (annotation.border.dash.length > 0 && annotation.border.dash.every((value) => value === 0)))) throw new Error('Invalid dash pattern.');
  if (![0, 1, 2].includes(annotation.lineCap) || ![0, 1, 2].includes(annotation.lineJoin)) throw new Error('Invalid stroke cap or join.');
  if (!Number.isFinite(annotation.miterLimit) || annotation.miterLimit < 1 || annotation.miterLimit > 100) throw new Error('Invalid miter limit.');
  if (annotation.kind === 'line' && (!finiteArray(annotation.line, 4) || Math.hypot(annotation.line[2] - annotation.line[0], annotation.line[3] - annotation.line[1]) === 0)) throw new Error('Invalid line coordinates.');
  if (['line', 'polyLine'].includes(annotation.kind) && (!Array.isArray(annotation.lineEnds) || annotation.lineEnds.length !== 2 || annotation.lineEnds.some((value) => !LINE_ENDS.has(value)))) throw new Error('Invalid line endings.');
  if (['polygon', 'polyLine'].includes(annotation.kind) && (!finiteArray(annotation.vertices) || annotation.vertices.length < (annotation.kind === 'polygon' ? 6 : 4) || annotation.vertices.length % 2 || annotation.vertices.length > MAX_POINTS * 2)) throw new Error('Invalid polygon vertices.');
  if (['square', 'circle'].includes(annotation.kind) && (!finiteArray(annotation.rectDifferences, 4) || annotation.rectDifferences.some((value) => value < 0) || annotation.rectDifferences[0] + annotation.rectDifferences[2] >= annotation.rect[2] - annotation.rect[0] || annotation.rectDifferences[1] + annotation.rectDifferences[3] >= annotation.rect[3] - annotation.rect[1])) throw new Error('Invalid shape rectangle differences.');
  if (annotation.kind === 'freeText' && (!annotation.font || typeof annotation.font.family !== 'string' || !Number.isFinite(annotation.font.size) || annotation.font.size < 1 || annotation.font.size > 144 || ![0, 1, 2].includes(annotation.align ?? -1) || !finiteArray(annotation.rectDifferences, 4) || annotation.rectDifferences.some((value) => value < 0) || (annotation.padding !== undefined && (!finiteArray(annotation.padding, 4) || annotation.padding.some((value) => value < 0))) || annotation.lineHeight === undefined || !Number.isFinite(annotation.lineHeight) || annotation.lineHeight <= 0 || annotation.lineHeight > 1000)) throw new Error('Invalid FreeText style.');
  if (MARKERS.has(annotation.kind) && (!finiteArray(annotation.quadPoints) || !annotation.quadPoints.length || annotation.quadPoints.length % 8 || annotation.quadPoints.length > MAX_POINTS * 2)) throw new Error('Invalid marker QuadPoints.');
  if (annotation.kind === 'ink' && (!Array.isArray(annotation.inkList) || !annotation.inkList.length || annotation.inkList.reduce((sum, stroke) => sum + stroke.length, 0) > MAX_POINTS * 2 || annotation.inkList.some((stroke) => !finiteArray(stroke) || stroke.length < 4 || stroke.length % 2))) throw new Error('Invalid InkList.');
  if (annotation.review && !stateValid(annotation.review)) throw new Error('Invalid review state.');
  if (annotation.createdAt !== undefined) pdfDate(annotation.createdAt);
  if (annotation.modifiedAt !== undefined) pdfDate(annotation.modifiedAt);
}

export function addMark(model: NativeDocument, mark: NewAnnotation, options: EditOptions = {}): NativeDocument {
  const now = editTime(options);
  assertWritable(model);
  if (mark.inReplyTo) {
    const parent = ensureId(model, mark.inReplyTo);
    if (mark.kind !== 'note' || mark.replyType !== 'R' || !parent.capabilities.reply) throw new Error('Native parent does not permit this reply.');
  }
  if (model.annotations.some((entry) => entry.id === mark.id) || model.deleted.includes(mark.id)) throw new Error('Duplicate annotation identity.');
  const page = model.pages.find((entry) => entry.id === mark.pageId);
  if (!page) throw new Error('Annotation page does not exist.');
  const defaultColor = mark.kind === 'freeText' ? null
    : mark.kind === 'note' ? [1, 0.88, 0.3]
    : mark.kind === 'highlight' ? [1, 0.85, 0.1] : [0, 0, 0];
  const annotation: AnnotationRecord = {
    contents: '', author: '', opacity: mark.kind === 'highlight' ? 0.3 : 1, color: defaultColor, fill: null,
    border: { width: ['freeText', 'note'].includes(mark.kind) ? 0 : 1, style: 'S' },
    lineCap: mark.kind === 'ink' ? 1 : 0, lineJoin: mark.kind === 'ink' ? 1 : 0,
    miterLimit: 2,
    ...(['square', 'circle'].includes(mark.kind) ? { rectDifferences: [0, 0, 0, 0] } : {}),
    ...(['line', 'polyLine'].includes(mark.kind) ? { lineEnds: ['None', 'None'] } : {}),
    ...(mark.kind === 'freeText' ? { align: 0, rectDifferences: [0, 0, 0, 0], padding: [2, 2, 2, 2], lineHeight: (mark.font?.size ?? 12) * 1.2 } : {}),
    ...plain(mark), page: model.pages.indexOf(page), createdAt: now, modifiedAt: now,
    creationPdf: pdfDate(now), modificationPdf: pdfDate(now),
    capabilities: { geometry: true, resize: true, contents: true, appearance: true, remove: true, reply: true },
  };
  validateAnnotation(annotation);
  return { ...model, annotations: [...model.annotations, annotation] };
}

export function addReply(model: NativeDocument, parentId: string, reply: NewReply, options: EditOptions = {}): NativeDocument {
  const now = editTime(options);
  assertWritable(model);
  const parent = ensureId(model, parentId);
  if (!parent.capabilities.reply) throw new Error('Native parent does not permit a reply.');
  const result = addMark(model, {
    kind: 'note', pageId: reply.pageId ?? parent.pageId, rect: [parent.rect[0], parent.rect[1], parent.rect[0] + 18, parent.rect[1] + 18],
    ...reply, inReplyTo: parentId, replyType: 'R', flags: 32,
  }, { now });
  return result;
}

export function setReviewState(model: NativeDocument, parentId: string, status: "resolved" | "open", options: ReviewOptions = {}): NativeDocument {
  const now = editTime(options), id = options.id ?? crypto.randomUUID(), author = options.author ?? '';
  if (!['resolved', 'open'].includes(status)) throw new Error('Invalid discussion state.');
  return addReply(model, parentId, { id, contents: '', author, review: { model: 'Review', state: status === 'resolved' ? 'Completed' : 'None' } }, { now });
}

export function discussionState(model: NativeDocument, parentId: string): "resolved" | "open" {
  const reachable = new Set([parentId]);
  let expanded = true;
  while (expanded) {
    expanded = false;
    for (const annotation of model.annotations) if (annotation.replyType === 'R' && annotation.inReplyTo !== undefined && reachable.has(annotation.inReplyTo) && !reachable.has(annotation.id)) {
      reachable.add(annotation.id); expanded = true;
    }
  }
  const states = model.annotations.filter((entry) => reachable.has(entry.id) && entry.review?.model === 'Review');
  const latest = states.reduce<AnnotationRecord | undefined>((selected, entry) => !selected || (entry.modifiedAt ?? entry.createdAt ?? '') >= (selected.modifiedAt ?? selected.createdAt ?? '') ? entry : selected, undefined);
  return latest?.review?.state === 'Completed' ? 'resolved' : 'open';
}

/** Delete an R-reply subtree. Group/unknown/locked dependents cause an atomic refusal. */

export function removeMark(model: NativeDocument, id: string): NativeDocument {
  assertWritable(model);
  const annotation = ensureId(model, id);
  if (!annotation.capabilities.remove) throw new Error('Native annotation cannot be removed.');
  const removed = new Set([id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const entry of model.annotations) if (!removed.has(entry.id)) {
      if (entry.inReplyTo !== undefined && removed.has(entry.inReplyTo)) {
        if (entry.replyType !== 'R' || !entry.capabilities.remove) throw new Error('Opaque, Group or locked reply depends on this annotation.');
        removed.add(entry.id); changed = true;
      } else if (entry._native?.subtype === 'Popup' && entry.popupOf !== undefined && removed.has(entry.popupOf)) { removed.add(entry.id); changed = true; }
    }
  }
  for (const dependency of model.dependencies ?? []) if (removed.has(dependency.targetId) && (!dependency.ownerId || !removed.has(dependency.ownerId))) throw new Error('A retained native action, structure or opaque object depends on this annotation.');
  // Unsaved new annotations have no source object to delete. Their omitted creation is already explicit.
  const persisted = model.annotations.filter((entry) => removed.has(entry.id) && entry._native !== undefined).map((entry) => entry.id);
  return {
    ...model, annotations: model.annotations.filter((entry) => !removed.has(entry.id)),
    deleted: [...new Set([...model.deleted, ...persisted])].sort(),
    dependencies: model.dependencies.filter((dependency) => !dependency.ownerId || !removed.has(dependency.ownerId)),
  };
}

export function changedFields(before: AnnotationRecord, after: AnnotationRecord): (keyof AnnotationRecord)[] {
  const left = annotationView(before), right = annotationView(after);
  return keys(right).filter((key) => JSON.stringify(left[key]) !== JSON.stringify(right[key]));
}
