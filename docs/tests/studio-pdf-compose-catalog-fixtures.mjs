import { PDFArray, PDFDict, PDFDocument, PDFHexString, PDFNumber, PDFRef } from 'pdf-lib';
import { loadSource } from './studio-pdf-compose-test-loader.mjs';
import { ClosedPdfCopier, hash, name, text } from './studio-pdf-compose-test-loader.mjs';
import { PdfNavigation } from './studio-pdf-compose-test-loader.mjs';
import { copyCatalog } from './studio-pdf-compose-test-loader.mjs';

export async function sourcePdf(id, pageCount = 3, customize) {
  const pdf = await PDFDocument.create({ updateMetadata: false });
  for (let index = 0; index < pageCount; index++) {
    const page = pdf.addPage([300 + index * 10, 400]);
    page.drawText(`${id} selected native page ${index + 1}`, { x: 20, y: 350, size: 12 });
  }
  if (customize) await customize(pdf, pdf.getPages());
  const bytes = await pdf.save({ updateFieldAppearances: false, useObjectStreams: false });
  return { id, bytes, originalHash: hash(bytes) };
}
export function setNames(pdf, entries, legacy = false) {
  if (legacy) {
    const dict = pdf.context.obj({});
    for (const [key, value] of entries) dict.set(name(key), value);
    pdf.catalog.set(name('Dests'), pdf.context.register(dict));
    return;
  }
  const names = pdf.context.obj([]);
  for (const [key, value] of entries) {
    names.push(PDFHexString.fromText(key));
    names.push(value);
  }
  const leaf = pdf.context.register(pdf.context.obj({ Names: names }));
  pdf.catalog.set(name('Names'), pdf.context.register(pdf.context.obj({ Dests: leaf })));
}
export function setOutlines(pdf, descriptions) {
  const root = pdf.context.obj({ Type: 'Outlines' }),
    rootRef = pdf.context.register(root);
  const prepare = (description) => {
    const dict = pdf.context.obj({ Title: PDFHexString.fromText(description.title) }),
      ref = pdf.context.register(dict);
    if (description.destination !== undefined)
      dict.set(
        name('Dest'),
        typeof description.destination === 'number'
          ? pdf.context.obj([pdf.getPages()[description.destination].ref, 'Fit'])
          : description.destination
      );
    if (description.action) dict.set(name('A'), description.action);
    if (description.color) dict.set(name('C'), pdf.context.obj(description.color));
    if (description.flags !== undefined) dict.set(name('F'), PDFNumber.of(description.flags));
    return { ...description, dict, ref, children: (description.children ?? []).map(prepare) };
  };
  const items = descriptions.map(prepare),
    visible = (children) =>
      children.length +
      children.reduce((sum, child) => sum + (child.open ? visible(child.children) : 0), 0);
  const wire = (children, parent, parentRef) => {
    if (!children.length) return;
    parent.set(name('First'), children[0].ref);
    parent.set(name('Last'), children[children.length - 1].ref);
    children.forEach((child, index) => {
      child.dict.set(name('Parent'), parentRef);
      if (index) child.dict.set(name('Prev'), children[index - 1].ref);
      if (index + 1 < children.length) child.dict.set(name('Next'), children[index + 1].ref);
      if (child.children.length) {
        wire(child.children, child.dict, child.ref);
        child.dict.set(
          name('Count'),
          PDFNumber.of((child.open ? 1 : -1) * visible(child.children))
        );
      }
    });
  };
  wire(items, root, rootRef);
  root.set(name('Count'), PDFNumber.of(visible(items)));
  pdf.catalog.set(name('Outlines'), rootRef);
  return { root, rootRef, items };
}
export function setLabels(pdf, entries, nested = false) {
  const nums = pdf.context.obj([]);
  for (const [index, properties] of entries) {
    const dict = pdf.context.obj({});
    for (const [key, value] of Object.entries(properties))
      dict.set(name(key), key === 'P' ? PDFHexString.fromText(value) : pdf.context.obj(value));
    nums.push(PDFNumber.of(index));
    nums.push(dict);
  }
  let tree;
  if (nested) {
    const first = entries[0][0],
      last = entries[entries.length - 1][0],
      leaf = pdf.context.register(pdf.context.obj({ Nums: nums, Limits: [first, last] }));
    tree = pdf.context.obj({ Kids: [leaf] });
  } else tree = pdf.context.obj({ Nums: nums });
  pdf.catalog.set(name('PageLabels'), pdf.context.register(tree));
}
export async function prepareCatalog(inputs, selections, overrides = {}) {
  const sources = await Promise.all(inputs.map(loadSource)),
    target = await PDFDocument.create({ updateMetadata: false }),
    report = { warnings: [], prunedNavigation: [] },
    scopes = new Map();
  for (const source of sources) source.instances = [];
  selections.forEach(([sourceId, sourcePage], index) => {
    const source = sources.find((entry) => entry.id === sourceId),
      nativePage = source.pages[sourcePage],
      page = target.addPage([nativePage.getWidth(), nativePage.getHeight()]);
    source.instances.push({ sourcePage, index, page });
  });
  for (let index = 0; index < sources.length; index++) {
    const source = sources[index],
      mapping = new Map();
    for (const instance of source.instances) {
      const ref = source.pages[instance.sourcePage].ref.toString();
      if (!mapping.has(ref)) mapping.set(ref, instance.page.ref);
    }
    const pageResolver = (ref) => mapping.get(ref.toString()),
      copier = new ClosedPdfCopier(source, target, mapping, pageResolver);
    for (const instance of source.instances) {
      const native = source.pages[instance.sourcePage];
      for (const key of ['Resources', 'MediaBox', 'CropBox', 'Rotate']) {
        const value = native.node.getInheritableAttribute(name(key));
        if (value)
          instance.page.node.set(
            name(key),
            copier.copy(value, `/Pages[${instance.sourcePage}]/${key}`)
          );
      }
      if (native.node.has(name('Contents')))
        instance.page.node.set(
          name('Contents'),
          copier.copy(native.node.get(name('Contents')), `/Pages[${instance.sourcePage}]/Contents`)
        );
    }
    const navigation = new PdfNavigation({
      source,
      target,
      copier,
      resolvePage: pageResolver,
      fieldNames: new Map(),
      report,
    });
    scopes.set(source.id, {
      copier,
      navigation,
      namePrefix: `${source.id}:`,
      ...overrides[source.id],
    });
  }
  return { sources, target, scopes, report };
}
export async function composeCatalog(inputs, selections, overrides) {
  const prepared = await prepareCatalog(inputs, selections, overrides);
  copyCatalog(prepared);
  prepared.bytes = await prepared.target.save({
    updateFieldAppearances: false,
    useObjectStreams: false,
  });
  return prepared;
}
export async function reopenTwice(bytes) {
  const once = await PDFDocument.load(bytes, { updateMetadata: false }),
    saved = await once.save({ updateFieldAppearances: false, useObjectStreams: false }),
    twice = await PDFDocument.load(saved, { updateMetadata: false });
  return [once, twice];
}
export function lookup(pdf, value) {
  return value instanceof PDFRef ? pdf.context.lookup(value) : value;
}
export function catalogNames(pdf) {
  const names = lookup(pdf, pdf.catalog.get(name('Names'))),
    dests = lookup(pdf, names?.get(name('Dests'))),
    values = lookup(pdf, dests?.get(name('Names'))),
    result = new Map();
  for (let index = 0; index < (values?.size() ?? 0); index += 2)
    result.set(text(lookup(pdf, values.get(index))), lookup(pdf, values.get(index + 1)));
  return result;
}
export function targetPageIndex(pdf, destination) {
  let array = lookup(pdf, destination);
  while (array instanceof PDFDict) array = lookup(pdf, array.get(name('D')));
  return pdf
    .getPages()
    .findIndex(
      (page) =>
        array instanceof PDFArray &&
        array.get(0) instanceof PDFRef &&
        page.ref.toString() === array.get(0).toString()
    );
}
export function readOutlineTree(pdf) {
  const rootRef = pdf.catalog.get(name('Outlines')),
    root = lookup(pdf, rootRef);
  if (!root) return { count: 0, items: [] };
  const walk = (parent, parentRef) => {
    const items = [];
    let value = parent.get(name('First')),
      previous;
    while (value) {
      const dict = lookup(pdf, value);
      if (
        !(dict instanceof PDFDict) ||
        !(dict.get(name('Parent')) instanceof PDFRef) ||
        dict.get(name('Parent')).toString() !== parentRef.toString()
      )
        throw new Error('Invalid canonical outline parent');
      if (
        previous
          ? dict.get(name('Prev'))?.toString() !== previous.toString()
          : !!dict.get(name('Prev'))
      )
        throw new Error('Invalid canonical outline Prev');
      const children = walk(dict, value);
      items.push({
        title: text(lookup(pdf, dict.get(name('Title')))),
        count: lookup(pdf, dict.get(name('Count')))?.asNumber(),
        pageIndex: dict.has(name('Dest'))
          ? targetPageIndex(pdf, dict.get(name('Dest')))
          : undefined,
        children,
        ref: value,
      });
      previous = value;
      value = dict.get(name('Next'));
    }
    if (items.length && parent.get(name('Last'))?.toString() !== previous.toString())
      throw new Error('Invalid canonical outline Last');
    return items;
  };
  return { count: lookup(pdf, root.get(name('Count'))).asNumber(), items: walk(root, rootRef) };
}
export function readLabelEntries(pdf) {
  const root = lookup(pdf, pdf.catalog.get(name('PageLabels'))),
    nums = lookup(pdf, root?.get(name('Nums'))),
    result = [];
  for (let index = 0; index < (nums?.size() ?? 0); index += 2) {
    const label = lookup(pdf, nums.get(index + 1));
    result.push({
      page: lookup(pdf, nums.get(index)).asNumber(),
      style: text(lookup(pdf, label.get(name('S')))),
      prefix: text(lookup(pdf, label.get(name('P')))),
      first: lookup(pdf, label.get(name('St')))?.asNumber() ?? 1,
    });
  }
  return result;
}
export function readActionSequence(pdf, value, result = [], visiting = new Set()) {
  const object = lookup(pdf, value);
  if (visiting.has(object)) throw new Error('Cyclic target action');
  visiting.add(object);
  if (object instanceof PDFArray)
    object.asArray().forEach((entry) => readActionSequence(pdf, entry, result, visiting));
  else if (object instanceof PDFDict) {
    result.push({
      kind: text(lookup(pdf, object.get(name('S')))),
      uri: text(lookup(pdf, object.get(name('URI')))),
      page: object.has(name('D')) ? targetPageIndex(pdf, object.get(name('D'))) : undefined,
    });
    if (object.has(name('Next')))
      readActionSequence(pdf, object.get(name('Next')), result, visiting);
  }
  visiting.delete(object);
  return result;
}
export function allPageObjectCount(pdf) {
  return pdf.context
    .enumerateIndirectObjects()
    .filter(
      ([, object]) =>
        object instanceof PDFDict && text(lookup(pdf, object.get(name('Type')))) === 'Page'
    ).length;
}
