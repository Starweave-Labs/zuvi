import { PDFArray, PDFDict, PDFName, PDFPage, PDFPageLeaf, PDFRef, PDFRadioGroup, PDFString, PDFHexString, type PDFDocument, type PDFObject } from 'pdf-lib';
import type { StudioPdfDocument, StudioPdfPage } from '@zuvi/react';
import { pdfPages } from '../../../../../packages/ui/src/components/OfficeStudio/studio-pdf-pages';

function isolatePageBuffers(pdf: PDFDocument, node: PDFPageLeaf) {
  const contents = node.Contents();
  if (contents instanceof PDFArray) node.set(PDFName.of('Contents'), contents.clone(pdf.context));
  const inherited = node.getInheritableAttribute(PDFName.of('Resources'));
  const source = inherited ? pdf.context.lookup(inherited) : undefined;
  if (source instanceof PDFDict) {
    const resources = source.clone(pdf.context);
    // Resource category dictionaries are mutable maps; their existing fonts,
    // images, appearance streams and graphics-state objects remain shared refs.
    for (const [key, value] of source.entries()) {
      const category = pdf.context.lookup(value);
      if (category instanceof PDFDict || category instanceof PDFArray) resources.set(key, category.clone(pdf.context));
    }
    node.set(PDFName.of('Resources'), resources);
  }
}

/** Isolate mutable containers before drawing, even without a structural page edit. */
export function isolatePdfPageBuffers(pdf: PDFDocument) {
  for (const page of pdf.getPages()) isolatePageBuffers(pdf, page.node);
}

/** Separate a terminal field merged with its widget before adding any child widgets. */
function splitCombinedFieldWidgets(pdf: PDFDocument) {
  const fieldKeys = ['FT', 'T', 'TU', 'TM', 'Ff', 'V', 'DV', 'Kids', 'DA', 'Q', 'DS', 'RV', 'Opt', 'MaxLen', 'TI', 'I', 'Lock', 'SV', 'ZuviFieldDesign', 'ZuviFieldImage'];
  const widgetKeys = ['Type', 'Subtype', 'Rect', 'P', 'Contents', 'NM', 'M', 'F', 'AP', 'AS', 'Border', 'C', 'OC', 'StructParent', 'Popup', 'H', 'MK', 'BS'];
  for (const field of pdf.getForm().getFields()) {
    const parent = field.acroField.dict;
    if (field.acroField.Kids() || parent.lookup(PDFName.of('Subtype')) !== PDFName.of('Widget')) continue;
    const widget = parent.clone(pdf.context);
    for (const key of fieldKeys) widget.delete(PDFName.of(key));
    widget.set(PDFName.of('Parent'), field.ref);
    const ref = pdf.context.register(widget);
    for (const page of pdf.getPages()) {
      const annotations = page.node.Annots();
      for (let index = 0; index < (annotations?.size() ?? 0); index++) {
        const entry = annotations!.get(index);
        if (entry && pdf.context.lookup(entry) === parent) {
          annotations!.set(index, ref);
          if (!widget.has(PDFName.of('P'))) widget.set(PDFName.of('P'), page.ref);
        }
      }
    }
    for (const key of widgetKeys) parent.delete(PDFName.of(key));
    field.acroField.setKids([ref]);
  }
}

/** Rebuild the page tree in the original context, retaining content and original references. */
export function applyPdfPageLayout(pdf: PDFDocument, document: StudioPdfDocument): boolean {
  if (!document.pages) return false;
  const descriptors = pdfPages(document), originals = [...pdf.getPages()];
  if ((document.sourcePageCount ?? document.pageCount) !== originals.length) throw new Error('PDF 页面来源与原文件不匹配。');
  const changed = descriptors.length !== originals.length || descriptors.some((page, index) => page.sourcePage !== index || page.size !== undefined);
  if (!changed) return false;
  // The leaf loses its former /Pages ancestors when it is attached to the new tree.
  // Materialize all native inheritables on retained originals as well as copies.
  for (const page of originals) {
    for (const key of PDFPageLeaf.InheritableEntries) {
      const name = PDFName.of(key), value = page.node.getInheritableAttribute(name);
      if (!page.node.has(name) && value) page.node.set(name, value);
    }
  }
  splitCombinedFieldWidgets(pdf);
  const protectedRefs = new Set(originals.map(page => page.ref.toString()));
  for (const field of pdf.getForm().getFields()) {
    let parent = field.acroField.getParent(); protectedRefs.add(field.ref.toString());
    while (parent && !protectedRefs.has(parent.ref.toString())) { protectedRefs.add(parent.ref.toString()); parent = parent.getParent(); }
  }
  const fieldWidgets = new Map<PDFDict, ReturnType<ReturnType<PDFDocument['getForm']>['getFields']>[number]>();
  for (const field of pdf.getForm().getFields()) for (const widget of field.acroField.getWidgets()) fieldWidgets.set(widget.dict, field);
  const used = new Set<number>();
  const targets = descriptors.map(descriptor => {
    if (descriptor.sourcePage === undefined) {
      const page = PDFPage.create(pdf);
      page.setSize(descriptor.size!.width, descriptor.size!.height);
      return page;
    }
    const source = originals[descriptor.sourcePage];
    if (!source) throw new Error('PDF 来源页码无效。');
    // A front-inserted copy must never take the original instance's reference.
    // If the original is deleted, every remaining copy owns a separate reference.
    if (!descriptor.copyGroup && !used.has(descriptor.sourcePage)) { used.add(descriptor.sourcePage); return source; }
    const node = source.node.clone();
    isolatePageBuffers(pdf, node);
    for (const key of PDFPageLeaf.InheritableEntries) {
      const name = PDFName.of(key), value = source.node.getInheritableAttribute(name);
      if (!node.get(name) && value) node.set(name, value);
    }
    node.delete(PDFName.of('Parent')); node.delete(PDFName.of('Annots'));
    const page = PDFPage.of(node, pdf.context.register(node), pdf);
    const annots = source.node.Annots()?.asArray() ?? [], mapping = new Map<PDFObject, PDFObject>();
    for (const entry of annots) {
      const dict = pdf.context.lookup(entry);
      if (!(dict instanceof PDFDict)) continue;
      const copy = dict.clone(pdf.context), ref = pdf.context.register(copy);
      mapping.set(entry, ref); mapping.set(dict, copy);
    }
    const actionCopies = new Map<PDFObject, PDFObject>(mapping);
    const copyActionGraph = (value: PDFObject): PDFObject => {
      if (actionCopies.has(value)) return actionCopies.get(value)!;
      if (value instanceof PDFRef) {
        if (protectedRefs.has(value.toString())) return value;
        const resolved = pdf.context.lookup(value);
        if (!(resolved instanceof PDFDict || resolved instanceof PDFArray)) return value;
        const ref = pdf.context.nextRef(); actionCopies.set(value, ref);
        pdf.context.assign(ref, copyActionGraph(resolved)); return ref;
      }
      if (value instanceof PDFDict) {
        const copy = pdf.context.obj({}); actionCopies.set(value, copy);
        for (const [key, entry] of value.entries()) copy.set(key, copyActionGraph(entry)); return copy;
      }
      if (value instanceof PDFArray) {
        const copy = pdf.context.obj([]); actionCopies.set(value, copy);
        for (const entry of value.asArray()) copy.push(copyActionGraph(entry)); return copy;
      }
      return value;
    };
    for (const key of ['A', 'AA']) { const value = source.node.get(PDFName.of(key)); if (value) node.set(PDFName.of(key), copyActionGraph(value)); }
    const copyDirect = (value: PDFObject): PDFObject => {
      if (mapping.has(value)) return mapping.get(value)!;
      if (value instanceof PDFRef) return value;
      if (value instanceof PDFArray) { const result = pdf.context.obj([]); for (const entry of value.asArray()) result.push(copyDirect(entry)); return result; }
      if (value instanceof PDFDict) { const result = pdf.context.obj({}); for (const [key, entry] of value.entries()) result.set(key, copyDirect(entry)); return result; }
      return value.clone();
    };
    for (const entry of annots) {
      const original = pdf.context.lookup(entry);
      if (!(original instanceof PDFDict)) continue;
      const copied = mapping.get(original);
      if (!(copied instanceof PDFDict)) continue;
      for (const [key, value] of original.entries()) copied.set(key, copyDirect(value));
      for (const key of ['A', 'AA']) { const value = original.get(PDFName.of(key)); if (value) copied.set(PDFName.of(key), copyActionGraph(value)); }
      const directDestination = original.lookup(PDFName.of('Dest')); if (directDestination instanceof PDFArray || directDestination instanceof PDFDict) copied.set(PDFName.of('Dest'), copyDirect(directDestination));
      const copiedAction = copied.lookup(PDFName.of('A')); if (copiedAction instanceof PDFDict) { const dest = copiedAction.lookup(PDFName.of('D')); if (dest instanceof PDFArray) copiedAction.set(PDFName.of('D'), copyDirect(dest)); }
      copied.set(PDFName.of('P'), page.ref);
      const field = fieldWidgets.get(original);
      if (field) {
        for (const key of ['T', 'FT', 'Ff', 'V', 'DV', 'Kids', 'Opt', 'MaxLen']) copied.delete(PDFName.of(key));
        copied.set(PDFName.of('Parent'), field.ref);
        if (field instanceof PDFRadioGroup) { const index = field.acroField.getWidgets().findIndex(widget => widget.dict === original); const options = field.acroField.getExportValues() ?? []; const value = options[index]; if (value) field.acroField.setOpt([...options, value]); }
        field.acroField.addWidget(mapping.get(entry) as PDFRef);
      }
      const dest = copied.lookup(PDFName.of('Dest'));
      if (dest instanceof PDFArray && dest.get(0)?.toString() === source.ref.toString()) dest.set(0, page.ref);
    }
    page.node.set(PDFName.of('Annots'), pdf.context.obj(annots.map(entry => mapping.get(entry) ?? entry)));
    return page;
  });
  // Remove only widgets whose source page was deleted. Shared fields and /AP stay native.
  const retained = new Set(targets.map(page => page.ref.toString()));
  for (const field of pdf.getForm().getFields()) {
    const selected = field instanceof PDFRadioGroup ? field.getSelected() : undefined;
    const widgets = field.acroField.getWidgets();
    for (let index = widgets.length - 1; index >= 0; index--) {
      const widget = widgets[index], owner = widget.P();
      const page = owner ? originals.find(entry => entry.ref.toString() === owner.toString()) : originals.find(entry => entry.node.Annots()?.asArray().some(ref => pdf.context.lookup(ref) === widget.dict));
      if (page && !retained.has(page.ref.toString())) { if (field instanceof PDFRadioGroup) field.acroField.removeExportValue(index); field.acroField.removeWidget(index); }
    }
    if (field instanceof PDFRadioGroup && selected && !field.getOptions().includes(selected)) field.clear();
  }
  while (pdf.getPageCount()) pdf.removePage(pdf.getPageCount() - 1);
  for (const page of targets) pdf.addPage(page);
  descriptors.forEach((descriptor: StudioPdfPage, index) => {
    if (descriptor.size && descriptor.sourcePage !== undefined) {
      const page = targets[index], box = descriptor.bounds ?? (() => { const rect = page.getCropBox(); return { left: rect.x, bottom: rect.y }; })();
      page.setMediaBox(box.left, box.bottom, descriptor.size.width, descriptor.size.height);
      page.setCropBox(box.left, box.bottom, descriptor.size.width, descriptor.size.height);
    }
  });
  // Resolve direct and named destinations against the actual retained page tree.
  const originalRefs = new Set(originals.map(page => page.ref.toString())), named = new Map<string, PDFObject>();
  const nameOf = (value: PDFObject | undefined) => value instanceof PDFName || value instanceof PDFString || value instanceof PDFHexString ? value.decodeText() : undefined;
  const validDirect = (value: PDFObject | undefined): boolean => {
    if (value instanceof PDFDict) return validDirect(value.lookup(PDFName.of('D')));
    const first = value instanceof PDFArray ? value.get(0) : undefined;
    return !(first instanceof PDFRef && originalRefs.has(first.toString()) && !retained.has(first.toString()));
  };
  const legacy = pdf.catalog.lookup(PDFName.of('Dests'));
  if (legacy instanceof PDFDict) for (const [key, value] of legacy.entries()) { const resolved = pdf.context.lookup(value); if (resolved) named.set(key.decodeText(), resolved); if (!validDirect(resolved)) legacy.delete(key); }
  const names = pdf.catalog.lookup(PDFName.of('Names'));
  const destinationTree = names instanceof PDFDict ? names.lookup(PDFName.of('Dests')) : undefined;
  const visitedNames = new Set<PDFDict>();
  const pruneNames = (tree: PDFDict): PDFObject[] => {
    if (visitedNames.has(tree)) return []; visitedNames.add(tree);
    const values = tree.lookup(PDFName.of('Names')), keys: PDFObject[] = [];
    if (values instanceof PDFArray) {
      for (let index = values.size() - 2; index >= 0; index -= 2) { const key = values.lookup(index), value = values.lookup(index + 1); const name = nameOf(key); if (name && value) named.set(name, value); if (!validDirect(value)) { values.remove(index + 1); values.remove(index); } }
      for (let index = 0; index < values.size(); index += 2) { const key = values.get(index); if (key) keys.push(key); }
    }
    const kids = tree.lookup(PDFName.of('Kids'));
    if (kids instanceof PDFArray) for (let index = kids.size() - 1; index >= 0; index--) { const kid = kids.lookup(index); if (!(kid instanceof PDFDict)) continue; const child = pruneNames(kid); if (!child.length) kids.remove(index); else keys.unshift(...child); }
    if (keys.length) tree.set(PDFName.of('Limits'), pdf.context.obj([keys[0], keys[keys.length - 1]])); else tree.delete(PDFName.of('Limits'));
    return keys;
  };
  if (destinationTree instanceof PDFDict) pruneNames(destinationTree);
  const valid = (value: PDFObject | undefined) => { const name = nameOf(value); return name && named.has(name) ? validDirect(named.get(name)) : validDirect(value); };
  const mappedDestination = (value: PDFObject | undefined, group?: string, owner?: number): PDFObject | undefined => {
    if (!group) return valid(value) ? value : undefined;
    const name = nameOf(value), resolved = name && named.has(name) ? named.get(name) : value;
    const direct = resolved instanceof PDFDict ? resolved.lookup(PDFName.of('D')) : resolved;
    const first = direct instanceof PDFArray ? direct.get(0) : undefined;
    if (direct instanceof PDFArray && first instanceof PDFRef) {
      const sourceIndex = originals.findIndex(entry => entry.ref.toString() === first.toString());
      const own = owner !== undefined && descriptors[owner]?.sourcePage === sourceIndex ? owner : -1;
      const targetIndex = own >= 0 ? own : descriptors.findIndex(entry => entry.copyGroup === group && entry.sourcePage === sourceIndex);
      if (targetIndex >= 0) { const copied = pdf.context.obj(direct.asArray()); copied.set(0, targets[targetIndex].ref); return copied; }
    }
    return valid(value) ? value : undefined;
  };
  const actionCache = new Map<string, Map<PDFObject, PDFObject | undefined>>();
  const actionVisiting = new Map<string, Set<PDFObject>>();
  const sanitizeAction = (value: PDFObject | undefined, group?: string, owner?: number): PDFObject | undefined => {
    if (!value) return value;
    const object = pdf.context.lookup(value);
    if (!(object instanceof PDFDict || object instanceof PDFArray)) return value;
    const scope = group ? `${group}:${owner ?? 'field'}` : 'original';
    const cache = actionCache.get(scope) ?? new Map<PDFObject, PDFObject | undefined>(), visiting = actionVisiting.get(scope) ?? new Set<PDFObject>();
    actionCache.set(scope, cache); actionVisiting.set(scope, visiting);
    if (cache.has(object)) return cache.get(object);
    if (visiting.has(object)) return undefined;
    visiting.add(object);
    let result: PDFObject | undefined = value;
    if (object instanceof PDFArray) {
      const kept = object.asArray().flatMap(entry => { const action = sanitizeAction(entry, group, owner); return action ? [action] : []; });
      result = kept.length ? pdf.context.obj(kept) : undefined;
    } else {
      if (object.lookup(PDFName.of('S')) === PDFName.of('GoTo')) {
        const destination = mappedDestination(object.lookup(PDFName.of('D')), group, owner);
        if (!destination) result = undefined; else object.set(PDFName.of('D'), destination);
      }
      if (result && object.has(PDFName.of('Next'))) {
        const next = sanitizeAction(object.get(PDFName.of('Next')), group, owner);
        if (next) object.set(PDFName.of('Next'), next); else object.delete(PDFName.of('Next'));
      }
    }
    visiting.delete(object); cache.set(object, result); return result;
  };
  const repair = (dict: PDFDict, group?: string, owner?: number) => {
    let broken = false;
    if (dict.has(PDFName.of('Dest'))) { const destination = mappedDestination(dict.lookup(PDFName.of('Dest')), group, owner); if (destination) dict.set(PDFName.of('Dest'), destination); else { dict.delete(PDFName.of('Dest')); broken = true; } }
    if (dict.has(PDFName.of('A'))) { const action = sanitizeAction(dict.get(PDFName.of('A')), group, owner); if (action) dict.set(PDFName.of('A'), action); else { dict.delete(PDFName.of('A')); broken = true; } }
    const additional = dict.lookup(PDFName.of('AA'));
    if (additional instanceof PDFDict) for (const [event, value] of additional.entries()) { const action = sanitizeAction(value, group, owner); if (action) additional.set(event, action); else additional.delete(event); }
    return broken;
  };
  targets.forEach((page, pageIndex) => {
    const group = descriptors[pageIndex].copyGroup; repair(page.node, group, pageIndex);
    const annots = page.node.Annots();
    for (let index = (annots?.size() ?? 0) - 1; index >= 0; index--) {
      const annotation = annots!.lookup(index); if (!(annotation instanceof PDFDict)) continue;
      if (repair(annotation, group, pageIndex) && annotation.lookup(PDFName.of('Subtype')) === PDFName.of('Link')) annots!.remove(index);
    }
  });
  const outlines = pdf.catalog.lookup(PDFName.of('Outlines')), visited = new Set<PDFDict>();
  const walk = (dict: PDFDict) => { if (visited.has(dict)) return; visited.add(dict); repair(dict); for (const key of ['First', 'Next']) { const item = dict.lookup(PDFName.of(key)); if (item instanceof PDFDict) walk(item); } };
  if (outlines instanceof PDFDict) walk(outlines);
  const open = pdf.catalog.lookup(PDFName.of('OpenAction'));
  if (open) { const sanitized = open instanceof PDFArray ? mappedDestination(open) : sanitizeAction(open); if (sanitized) pdf.catalog.set(PDFName.of('OpenAction'), sanitized); else pdf.catalog.delete(PDFName.of('OpenAction')); }
  repair(pdf.catalog);
  for (const field of pdf.getForm().getFields()) repair(field.acroField.dict);
  return true;
}
