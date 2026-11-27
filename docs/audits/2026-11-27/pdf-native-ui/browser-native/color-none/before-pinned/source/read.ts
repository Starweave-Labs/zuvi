import { PDFDocument, PDFDict, PDFArray, PDFRef, PDFStream, PDFBool, PDFObject } from 'pdf-lib';
import type { NativeDestination, SourceDocument, SourceAnnotation, NativePage, Dependency } from './types';
import { raw, get, has, text, number, numbers, readLineEnds, finiteArray, required, rectangleValid, stateValid, isoDate, annotationAppearance, streamHash, nativeFingerprint, loadSignature, load, graphTargets, unsupportedTextControl } from './objects';
import { appearanceRestrictions } from './appearance-parser';
import { readFreeTextFont } from './font-reader';
import { name, KINDS, LINE_ENDS, MARKERS, MAX_ANNOTATIONS, MAX_TEXT } from './constants';
import { sha256, sourceIdentity } from './runtime';
import { color, readDeviceColor } from './colors';

export function readDestination(pdf: PDFDocument, dict: PDFDict, pages: NativePage[]): NativeDestination | undefined {
  let value = get(dict, 'Dest');
  const action = get(dict, 'A');
  if (value === undefined && action instanceof PDFDict && get(action, 'S') === name('GoTo')) value = get(action, 'D');
  if (value === undefined) return;
  const resolveNamed = (key: string): PDFObject | undefined => {
    const direct = get(pdf.catalog, 'Dests');
    if (direct instanceof PDFDict && has(direct, key)) return get(direct, key);
    const names = get(pdf.catalog, 'Names');
    const root = names instanceof PDFDict ? get(names, 'Dests') : undefined;
    const seen = new Set<PDFDict>();
    const walk = (node: PDFObject | undefined): PDFObject | undefined => {
      if (!(node instanceof PDFDict) || seen.has(node)) return;
      seen.add(node);
      const entries = get(node, 'Names');
      if (entries instanceof PDFArray) for (let index = 0; index + 1 < entries.size(); index += 2) if (text(entries.lookup(index)) === key) return entries.lookup(index + 1);
      const kids = get(node, 'Kids');
      if (kids instanceof PDFArray) for (const child of kids.asArray()) { const found = walk(pdf.context.lookup(child)); if (found) return found; }
    };
    return walk(root);
  };
  const nativeName = text(value);
  if (nativeName !== undefined) value = resolveNamed(nativeName);
  if (value instanceof PDFDict) value = get(value, 'D');
  if (!(value instanceof PDFArray)) return { kind: 'unresolved-goTo', nativeName };
  const first = value.get(0);
  const target = first instanceof PDFRef ? pages.find((page) => page.ref === first.toString()) : undefined;
  return target ? { kind: 'goTo', targetPageId: target.id, nativeName } : { kind: 'unresolved-goTo', nativeName };
}

/** Resolve the actual font named by DA, never a document-wide font guess. */

function readInkList(dict: PDFDict): number[][] | undefined {
  const value = get(dict, 'InkList');
  if (!(value instanceof PDFArray)) return;
  const strokes = value.asArray().map((_, index) => numbers(value.lookup(index)));
  return strokes.every((stroke): stroke is number[] => stroke !== undefined) ? strokes : undefined;
}

export function readInventory(pdf: PDFDocument, bytes: Uint8Array): SourceDocument {
  const sourceHash = sha256(bytes);
  const pages: NativePage[] = pdf.getPages().map((page, index) => ({
    id: text(get(page.node, 'ZuviPageId')) || sourceIdentity('page', sourceHash + ':' + index + ':' + page.ref.toString()),
    sourcePage: index, ref: page.ref.toString(),
    media: page.getMediaBox(), crop: page.getCropBox(), rotation: page.getRotation().angle,
    userUnit: number(get(page.node, 'UserUnit')) ?? 1,
  }));
  if (new Set(pages.map((page) => page.id)).size !== pages.length) throw new Error('Duplicate persisted page identities.');
  const annotations: SourceAnnotation[] = [];
  const dictionaries = new Map<string, PDFDict>();
  const identities = new Set<string>();
  const nativeRefs = new Map<string, string>();
  for (const [pageIndex, page] of pdf.getPages().entries()) {
    const entries = page.node.Annots()?.asArray() ?? [];
    for (const [ordinal, ref] of entries.entries()) {
      if (annotations.length >= MAX_ANNOTATIONS) throw new Error('Too many annotations.');
      const dict = pdf.context.lookup(ref);
      if (!(dict instanceof PDFDict)) throw new Error('Malformed annotation dictionary.');
      const key = ref instanceof PDFRef ? ref.toString() : 'direct:' + pageIndex + ':' + ordinal;
      if (nativeRefs.has(key)) throw new Error('One native annotation occurs in multiple page slots.');
      const id = text(get(dict, 'ZuviAnnotationId')) || sourceIdentity('annotation', sourceHash + ':' + pageIndex + ':' + key);
      if (identities.has(id)) throw new Error('Duplicate persisted annotation identities.');
      identities.add(id); nativeRefs.set(key, id); dictionaries.set(id, dict);
      const subtype = text(get(dict, 'Subtype')) ?? 'Unknown';
      const rect = numbers(get(dict, 'Rect')) ?? [];
      const flags = number(get(dict, 'F')) ?? 0;
      const opacity = number(get(dict, 'CA')) ?? 1;
      const border = get(dict, 'BS');
      const rawBorder = get(dict, 'Border');
      const legacyDash = rawBorder instanceof PDFArray && rawBorder.size() >= 4 ? numbers(rawBorder.lookup(3)) : undefined;
      const width = border instanceof PDFDict ? number(get(border, 'W')) ?? 1 : (rawBorder instanceof PDFArray ? number(rawBorder.lookup(2)) : undefined) ?? (['FreeText', 'Text'].includes(subtype) ? 0 : 1);
      const style = border instanceof PDFDict ? text(get(border, 'S')) ?? 'S' : legacyDash ? 'D' : 'S';
      const dash = border instanceof PDFDict ? numbers(get(border, 'D')) : legacyDash;
      const creationPdf = text(get(dict, 'CreationDate'));
      const modificationPdf = text(get(dict, 'M'));
      const font = subtype === 'FreeText' ? readFreeTextFont(pdf, page, dict) : undefined;
      const stateModel = text(get(dict, 'StateModel'));
      const state = text(get(dict, 'State'));
      const replyRef = raw(dict, 'IRT');
      const replyType = replyRef === undefined ? undefined : text(get(dict, 'RT')) ?? 'R';
      const appearanceInfo = appearanceRestrictions(dict, rect, KINDS.get(subtype) ?? 'opaque');
      const annotation: SourceAnnotation = {
        id, pageId: pages[pageIndex].id, page: pageIndex, kind: KINDS.get(subtype) ?? 'opaque',
        ...(text(get(dict, 'ZuviAnnotationOriginId')) === undefined ? {} : { originId: text(get(dict, 'ZuviAnnotationOriginId')) }),
        rect, contents: text(get(dict, 'Contents')) ?? '', author: text(get(dict, 'T')) ?? '',
        ...(creationPdf === undefined ? {} : { creationPdf, createdAt: isoDate(creationPdf) }),
        ...(modificationPdf === undefined ? {} : { modificationPdf, modifiedAt: isoDate(modificationPdf) }),
        opacity, color: color(get(dict, 'C')) ?? null, fill: color(get(dict, 'IC')) ?? null,
        border: { width, style, ...(dash === undefined ? {} : { dash }) },
        lineCap: appearanceInfo.properties.lineCap ?? 0, lineJoin: appearanceInfo.properties.lineJoin ?? 0, miterLimit: appearanceInfo.properties.miterLimit ?? 10,
        ...(font ? { font: { family: font.family, size: font.size, color: font.color } } : {}),
        ...(subtype === 'FreeText' ? {
          align: number(get(dict, 'Q')) ?? 0, rectDifferences: numbers(get(dict, 'RD')) ?? [0, 0, 0, 0],
          ...(get(dict, 'ZuviTextPadding') === undefined ? {} : { padding: numbers(get(dict, 'ZuviTextPadding')) }),
          lineHeight: number(get(dict, 'ZuviTextLineHeight')) ?? appearanceInfo.properties.lineHeight ?? (font?.size ?? 12) * 1.2,
        } : {}),
        ...(MARKERS.has(KINDS.get(subtype)) ? { quadPoints: numbers(get(dict, 'QuadPoints')) } : {}),
        ...(subtype === 'Ink' ? { inkList: readInkList(dict) } : {}),
        ...(['Square', 'Circle'].includes(subtype) ? { rectDifferences: numbers(get(dict, 'RD')) ?? [0, 0, 0, 0] } : {}),
        ...(subtype === 'Line' ? { line: numbers(get(dict, 'L')), lineEnds: readLineEnds(get(dict, 'LE')) ?? ['None', 'None'] } : {}),
        ...(['Polygon', 'PolyLine'].includes(subtype) ? { vertices: numbers(get(dict, 'Vertices')), ...(subtype === 'PolyLine' ? { lineEnds: readLineEnds(get(dict, 'LE')) ?? ['None', 'None'] } : {}) } : {}),
        ...(stateModel === undefined && state === undefined ? {} : { review: { model: stateModel, state } }),
        ...(replyRef === undefined ? {} : { replyType, _replyRef: replyRef.toString() }),
        ...(raw(dict, 'Popup') === undefined ? {} : { _popupRef: required(raw(dict, 'Popup'), 'Popup reference').toString() }),
        ...(subtype !== 'Popup' || raw(dict, 'Parent') === undefined ? {} : { _popupOwnerRef: required(raw(dict, 'Parent'), 'Popup owner').toString() }),
        _native: { key, sourcePage: pageIndex, ordinal, subtype, name: text(get(dict, 'NM')), flags,
          hash: nativeFingerprint(dict), appearanceHash: streamHash(annotationAppearance(dict)), hasAppearance: annotationAppearance(dict) instanceof PDFStream, font,
          ...(subtype === 'Text' ? { iconName: text(get(dict, 'Name')) ?? 'Note' } : {}),
          destination: readDestination(pdf, dict, pages), appearanceRestrictions: appearanceInfo.restrictions, colors: { stroke: readDeviceColor(get(dict, 'C')), fill: readDeviceColor(get(dict, 'IC')) },
          ...(subtype === 'FreeText' ? { textLayout: { firstPosition: appearanceInfo.properties.firstTextPosition, lineHeight: appearanceInfo.properties.lineHeight } } : {}) },
        capabilities: { geometry: false, resize: false, contents: false, appearance: false, remove: false, reply: false },
      };
      annotations.push(annotation);
    }
  }
  for (const annotation of annotations) {
    const dict = required(dictionaries.get(annotation.id), 'native annotation');
    const reasons = [];
    if (annotation._popupRef) { annotation.popupId = nativeRefs.get(annotation._popupRef); delete annotation._popupRef; }
    if (annotation._popupOwnerRef) { annotation.popupOf = nativeRefs.get(annotation._popupOwnerRef); delete annotation._popupOwnerRef; }
    if (annotation.kind === 'opaque') reasons.push('Unsupported native subtype.');
    if (typeof annotation.contents !== 'string' || annotation.contents.length > MAX_TEXT || unsupportedTextControl(annotation.contents)) reasons.push('Native text is outside the plain annotation editor.');
    if (!rectangleValid(annotation.rect, annotation.kind === 'note' || annotation.kind === 'opaque')) reasons.push('Unsupported native rectangle.');
    if (annotation._native.flags & (64 | 128)) reasons.push('Native read-only or locked flag.');
    if (has(dict, 'A') || has(dict, 'AA')) reasons.push('Native actions are preserved without execution or redesign.');
    if (has(dict, 'OC')) reasons.push('Optional-content visibility is preserved.');
    if (has(dict, 'RC') || has(dict, 'CL') || has(dict, 'BE')) reasons.push('Rich text, callout or cloudy border is outside the plain annotation editor.');
    if (has(dict, 'IT') && !['FreeText', 'FreeTextTypeWriter', 'Highlight', 'Square', 'Ink', 'LineArrow'].includes(text(get(dict, 'IT')) ?? '')) reasons.push('Unsupported native intent.');
    if (!Number.isInteger(annotation._native.flags) || annotation._native.flags < 0) reasons.push('Invalid annotation flags.');
    if (!Number.isFinite(annotation.opacity) || annotation.opacity < 0 || annotation.opacity > 1) reasons.push('Invalid opacity.');
    if (!Number.isFinite(annotation.border.width) || annotation.border.width < 0 || annotation.border.width > 72 || !['S', 'D'].includes(annotation.border.style)) reasons.push('Unsupported border.');
    if (annotation.border.dash && (!finiteArray(annotation.border.dash) || annotation.border.dash.some((value) => value < 0) || (annotation.border.dash.length > 0 && annotation.border.dash.every((value) => value === 0)))) reasons.push('Invalid native dash pattern.');
    for (const key of ['C', 'IC']) if (has(dict, key) && color(get(dict, key)) === undefined) reasons.push('Unsupported native color.');
    if (annotation.kind === 'line' && (!finiteArray(annotation.line, 4) || Math.hypot(annotation.line[2] - annotation.line[0], annotation.line[3] - annotation.line[1]) === 0)) reasons.push('Invalid native L line coordinates.');
    if (['line', 'polyLine'].includes(annotation.kind) && (!Array.isArray(annotation.lineEnds) || annotation.lineEnds.length !== 2 || annotation.lineEnds.some((value) => !LINE_ENDS.has(value)))) reasons.push('Invalid native line endings.');
    if (['polygon', 'polyLine'].includes(annotation.kind) && (!finiteArray(annotation.vertices) || annotation.vertices.length < (annotation.kind === 'polygon' ? 6 : 4) || annotation.vertices.length % 2)) reasons.push('Invalid native Vertices.');
    if (['square', 'circle'].includes(annotation.kind) && (!finiteArray(annotation.rectDifferences, 4) || annotation.rectDifferences.some((value) => value < 0))) reasons.push('Invalid native rectangle differences.');
    if (annotation.kind === 'line' && (['LL', 'LLE', 'LLO', 'Measure', 'CO', 'CP'].some((key) => has(dict, key)) || get(dict, 'Cap') === PDFBool.True)) reasons.push('Leader lines, measurements and captions are preserved outside the simple line editor.');
    if (annotation.review && !stateValid(annotation.review)) reasons.push('Unknown state model or state is preserved.');
    if (MARKERS.has(annotation.kind) && (!finiteArray(annotation.quadPoints) || !annotation.quadPoints.length || annotation.quadPoints.length % 8)) reasons.push('Invalid native QuadPoints.');
    if (annotation.kind === 'ink' && (!Array.isArray(annotation.inkList) || !annotation.inkList.length || annotation.inkList.some((stroke) => !finiteArray(stroke) || stroke.length < 4 || stroke.length % 2))) reasons.push('Invalid InkList.');
    if (annotation.kind === 'freeText' && (!annotation.font || !finiteArray(annotation.font.color, 3) || annotation.font.color.some((value) => value < 0 || value > 1) || ![0, 1, 2].includes(annotation.align ?? -1) || !finiteArray(annotation.rectDifferences, 4) || annotation.rectDifferences.some((value) => value < 0) || (annotation.padding !== undefined && (!finiteArray(annotation.padding, 4) || annotation.padding.some((value) => value < 0))) || annotation.lineHeight === undefined || !Number.isFinite(annotation.lineHeight) || annotation.lineHeight <= 0)) reasons.push('Unsupported FreeText appearance/font declaration.');
    if (annotation._replyRef !== undefined) {
      annotation.inReplyTo = nativeRefs.get(annotation._replyRef);
      if (!annotation.inReplyTo) reasons.push('Reply target is outside the canonical annotation inventory.');
      if (annotation.replyType !== 'R') reasons.push('Group or unknown RT is preserved as a relationship, not an editable reply.');
      delete annotation._replyRef;
    }
    annotation.capabilities = {
      geometry: !reasons.length,
      resize: !reasons.length && !annotation._native.appearanceRestrictions.length && !!(annotation.kind !== 'freeText' || annotation._native.font?.standard || annotation._native.font?.fullTrueType),
      contents: !reasons.length && !(annotation._native.flags & 512) && !!(annotation.kind !== 'freeText' || (!annotation._native.appearanceRestrictions.length && (annotation._native.font?.standard || annotation._native.font?.fullTrueType))),
      appearance: !reasons.length && !annotation._native.appearanceRestrictions.length && !!(annotation.kind !== 'freeText' || annotation._native.font?.standard || annotation._native.font?.fullTrueType),
      remove: !reasons.length,
      reply: !reasons.length,
    };
    if (reasons.length) annotation.passiveReasons = reasons;
  }
  // A cycle is retained opaque. Never flatten or manufacture a different parent.
  const byId = new Map(annotations.map((entry) => [entry.id, entry]));
  for (const annotation of annotations) {
    const visited = new Set([annotation.id]);
    let parent = annotation.inReplyTo;
    while (parent) {
      if (visited.has(parent)) {
        annotation.passiveReasons = [...(annotation.passiveReasons ?? []), 'Cyclic IRT graph.'];
        annotation.capabilities = { geometry: false, resize: false, contents: false, appearance: false, remove: false, reply: false };
        break;
      }
      visited.add(parent); parent = byId.get(parent)?.inReplyTo;
    }
  }
  const refIdentities = new Map([...nativeRefs]);
  const dependencies: Dependency[] = [];
  const roots: { kind: string; value: PDFObject | undefined; ownerId?: string; page?: number }[] = [{ kind: 'catalog', value: pdf.catalog }];
  pdf.getPages().forEach((page, index) => {
    for (const key of ['A', 'AA']) if (raw(page.node, key)) roots.push({ kind: 'page-' + key, page: index, value: raw(page.node, key) });
  });
  for (const annotation of annotations) roots.push({ kind: 'annotation-ref', ownerId: annotation.id, value: dictionaries.get(annotation.id) });
  for (const root of roots) for (const targetId of graphTargets(pdf, root.value, refIdentities)) dependencies.push({ kind: root.kind, ...(root.ownerId ? { ownerId: root.ownerId } : {}), ...(root.page === undefined ? {} : { page: root.page }), targetId });
  return { version: 1, sourceHash, signed: loadSignature(pdf), pages, annotations, deleted: [], dependencies };
}

export async function importNativeMarks(bytes: Uint8Array): Promise<SourceDocument> {
  const pdf = await load(bytes);
  return readInventory(pdf, bytes);
}

export async function inspectNativePdf(bytes: Uint8Array) {
  const pdf = await load(bytes);
  const inventory = readInventory(pdf, bytes);
  return {
    ...inventory,
    contentHashes: pdf.getPages().map((page) => {
      const contents = page.node.Contents();
      const streams = contents instanceof PDFArray ? contents.asArray().map((entry) => pdf.context.lookup(entry)) : contents ? [contents] : [];
      return streams.map(streamHash);
    }),
  };
}
