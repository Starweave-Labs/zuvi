import {
  PDFDocument,
  PDFArray,
  PDFDict,
  PDFName,
  PDFNull,
  PDFRef,
  PDFString,
  PDFHexString,
  PDFNumber,
  PDFStream,
  type PDFObject,
} from 'pdf-lib';
import {
  byteArray,
  fail,
  name,
  text,
  read,
  resolve,
  canonical,
  PdfComposeError,
} from './studio-pdf-compose-utils';
import type {
  PdfComposeSourceState,
  PdfFieldRecord,
  PdfFieldDesign,
  PdfWidgetRecord,
  StudioPdfComposeSource,
  StudioPdfComposeValue,
} from './studio-pdf-compose-types';
const ALLOWED_CATALOG = [
  'Type',
  'Pages',
  'AcroForm',
  'Names',
  'Dests',
  'Outlines',
  'OpenAction',
  'AA',
  'Metadata',
  'PageLayout',
  'PageMode',
  'ViewerPreferences',
  'Lang',
  'Version',
  'Extensions',
  'PageLabels',
];

/** Normalize absent dictionary entries before presence checks; arrays and stream bytes stay intact. */
function normalizeDictionaryNulls(pdf: PDFDocument) {
  const pending = pdf.context.enumerateIndirectObjects().map(([, object]) => object);
  const visited = new Set<PDFObject>();
  while (pending.length) {
    const object = pending.pop()!;
    if (visited.has(object)) continue;
    visited.add(object);
    if (object instanceof PDFStream) pending.push(object.dict);
    else if (object instanceof PDFDict)
      for (const [key, value] of object.entries()) {
        if (value === PDFNull || (value instanceof PDFRef && pdf.context.lookup(value) === PDFNull))
          object.delete(key);
        else if (!(value instanceof PDFRef)) pending.push(value);
      }
    else if (object instanceof PDFArray)
      for (const value of object.asArray()) if (!(value instanceof PDFRef)) pending.push(value);
  }
}
export async function loadSource(input: StudioPdfComposeSource): Promise<PdfComposeSourceState> {
  try {
    return await loadSourceUnchecked(input);
  } catch (error) {
    if (error instanceof PdfComposeError) throw error;
    fail('INPUT_STRUCTURE', input.id, '/', error instanceof Error ? error.message : String(error));
  }
}
async function loadSourceUnchecked(input: StudioPdfComposeSource): Promise<PdfComposeSourceState> {
  const bytes = await byteArray(input.bytes);
  if (!bytes.length || bytes.length > 50 * 1024 * 1024)
    fail('INPUT_LIMIT', input.id, '/', 'PDF source must be nonempty and at most 50 MiB');
  let pdf: PDFDocument;
  try {
    pdf = await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (error) {
    fail('INPUT_READ', input.id, '/', error instanceof Error ? error.message : String(error));
  }
  normalizeDictionaryNulls(pdf);
  const source: PdfComposeSourceState = {
    id: input.id,
    pdf,
    bytes,
    pages: pdf.getPages(),
    fields: [],
    groups: [],
    widgetOwners: new Map(),
    fieldRefs: new Set(),
    annotations: new Map(),
    names: new Map(),
    instances: [],
    selectedFields: [],
    fieldNodes: new Map(),
    fieldNames: new Map(),
    fieldMapping: new Map(),
    annotationNames: new Map(),
    annotationMapping: new Map(),
  };
  if (!source.pages.length || source.pages.length > 200)
    fail('PAGE_LIMIT', input.id, '/Pages', 'PDF source must contain 1 to 200 pages');
  for (const [key] of pdf.catalog.entries())
    if (!ALLOWED_CATALOG.includes(key.decodeText()))
      fail(
        'OPAQUE_CATALOG',
        input.id,
        `/${key.decodeText()}`,
        'This catalog feature cannot be retained safely by this composer'
      );
  const form = read(source, pdf.catalog, 'AcroForm');
  source.form = form instanceof PDFDict ? form : undefined;
  if (form && !(form instanceof PDFDict))
    fail('ACROFORM_TYPE', input.id, '/AcroForm', 'Canonical AcroForm must be a dictionary');
  if (source.form?.has(name('XFA')))
    fail('XFA', input.id, '/AcroForm/XFA', 'Dynamic XFA forms cannot be composed safely');
  for (const key of ['SigFlags', 'Perms'])
    if (source.form?.has(name(key)))
      fail(
        'SIGNATURE_POLICY',
        input.id,
        `/AcroForm/${key}`,
        'Signature policy cannot be retained safely'
      );
  if (read(source, source.form, 'NeedAppearances')?.toString() === 'true')
    fail(
      'DYNAMIC_APPEARANCE',
      input.id,
      '/AcroForm/NeedAppearances',
      'Viewer-generated appearances cannot be proven identical after composition; materialize the source appearances first'
    );
  for (const [key] of source.form?.entries() ?? [])
    if (!['Fields', 'DR', 'DA', 'Q', 'NeedAppearances', 'CO'].includes(key.decodeText()))
      fail(
        'OPAQUE_ACROFORM',
        input.id,
        `/AcroForm/${key.decodeText()}`,
        'AcroForm property cannot be combined safely'
      );
  const visited = new Set<PDFDict>(),
    names = new Set<string>(),
    widgetPages = new Map<PDFDict, number>();
  for (let index = 0; index < source.pages.length; index++) {
    for (const entry of source.pages[index].node.Annots()?.asArray() ?? []) {
      const dict = resolve(source, entry);
      if (!(dict instanceof PDFDict))
        fail(
          'ANNOTATION_DICTIONARY',
          input.id,
          `/Pages[${index}]/Annots`,
          'Annotation is not a dictionary'
        );
      if (widgetPages.has(dict))
        fail(
          'ANNOTATION_OWNER',
          input.id,
          `/Pages[${index}]/Annots`,
          'Annotation is listed more than once or on multiple pages'
        );
      widgetPages.set(dict, index);
    }
  }
  const walkField = (value: PDFObject, parent: PdfFieldRecord | undefined, path: string): void => {
    const dict = resolve(source, value);
    if (!(dict instanceof PDFDict))
      fail('FIELD_DICTIONARY', input.id, path, 'Field entry is not a dictionary');
    if (visited.has(dict))
      fail('FIELD_CYCLE', input.id, path, 'Field tree is cyclic or aliases a field twice');
    visited.add(dict);
    const ref = value instanceof PDFRef ? value : pdf.context.getObjectRef(dict);
    if (!ref)
      fail(
        'DIRECT_FIELD',
        input.id,
        path,
        'Direct field dictionaries require normalization before composition'
      );
    source.fieldRefs.add(ref.toString());
    for (const key of ['Lock', 'SV'])
      if (dict.has(name(key)))
        fail(
          'SIGNATURE_FIELD_POLICY',
          input.id,
          `${path}/${key}`,
          'Signature seed and field-lock policies require a separate signing workflow'
        );
    const statedParent = dict.get(name('Parent'));
    if (
      (parent &&
        (!(statedParent instanceof PDFRef) || statedParent.toString() !== parent.ref.toString())) ||
      (!parent && statedParent)
    )
      fail(
        'FIELD_PARENT',
        input.id,
        `${path}/Parent`,
        'Canonical field /Parent does not agree with its /Kids hierarchy'
      );
    const part = text(read(source, dict, 'T')),
      parts = [...(parent?.parts ?? []), ...(part === undefined ? [] : [part])];
    const declaredName = read(source, dict, 'T');
    if (
      declaredName !== undefined &&
      !(declaredName instanceof PDFString) &&
      !(declaredName instanceof PDFHexString)
    )
      fail('FIELD_NAME_TYPE', input.id, `${path}/T`, 'Partial field name must be a text string');
    const fullName = part === undefined ? undefined : parts.join('.');
    const record: PdfFieldRecord = {
      source,
      dict,
      ref,
      parent,
      parts,
      fullName,
      path,
      effective: {},
      kind: 'group',
      flags: 0,
      widgets: [],
    };
    for (const key of ['FT', 'Ff', 'V', 'DV', 'DA', 'Q', 'MaxLen', 'Opt'] as const)
      record.effective[key] =
        read(source, dict, key) ??
        parent?.effective[key] ??
        (key === 'DA' || key === 'Q' ? read(source, source.form, key) : undefined);
    const kids = read(source, dict, 'Kids');
    if (kids && !(kids instanceof PDFArray))
      fail('FIELD_KIDS', input.id, `${path}/Kids`, 'Field children must be an array');
    const entries = kids instanceof PDFArray ? kids.asArray() : [];
    const childFields = entries.filter((entry) => {
      const child = resolve(source, entry);
      return child instanceof PDFDict && (child.has(name('T')) || child.has(name('FT')));
    });
    if (childFields.length) {
      if (childFields.length !== entries.length)
        fail('MIXED_FIELD_KIDS', input.id, path, 'Field tree mixes child fields and widgets');
      source.groups.push(record);
      for (let index = 0; index < entries.length; index++)
        walkField(entries[index], record, `${path}/Kids[${index}]`);
      return;
    }
    const ft = text(record.effective.FT);
    if (!ft || !(record.effective.FT instanceof PDFName))
      fail(
        'FIELD_TYPE',
        input.id,
        `${path}/FT`,
        'Terminal field must have an inherited PDF name field type'
      );
    if (ft === 'Sig' && record.effective.V && record.effective.V.toString() !== 'null')
      fail(
        'SIGNED_FIELD',
        input.id,
        `${path}/V`,
        'Existing digital signatures cannot remain valid after composition'
      );
    if (fullName !== undefined && names.has(fullName))
      fail(
        'DUPLICATE_SOURCE_NAME',
        input.id,
        path,
        `Source contains ambiguous duplicate field name ${fullName}`
      );
    if (fullName !== undefined) names.add(fullName);
    const flags = record.effective.Ff instanceof PDFNumber ? record.effective.Ff.asNumber() : 0;
    if (record.effective.Ff !== undefined && !(record.effective.Ff instanceof PDFNumber))
      fail('FIELD_FLAGS', input.id, `${path}/Ff`, 'Field flags must be numeric');
    if (!Number.isInteger(flags) || flags < 0 || flags > 0xffffffff)
      fail('FIELD_FLAGS', input.id, `${path}/Ff`, 'Field flags must be an unsigned integer');
    const q = record.effective.Q,
      max = record.effective.MaxLen;
    if (
      q !== undefined &&
      (!(q instanceof PDFNumber) ||
        !Number.isInteger(q.asNumber()) ||
        q.asNumber() < 0 ||
        q.asNumber() > 2)
    )
      fail('FIELD_ALIGNMENT', input.id, `${path}/Q`, 'Text quadding must be 0, 1 or 2');
    if (
      max !== undefined &&
      (!(max instanceof PDFNumber) ||
        !Number.isInteger(max.asNumber()) ||
        max.asNumber() < 0 ||
        max.asNumber() > 0x7fffffff)
    )
      fail(
        'FIELD_MAX_LENGTH',
        input.id,
        `${path}/MaxLen`,
        'Text maximum length must be a nonnegative integer'
      );
    record.kind =
      ft === 'Tx'
        ? 'text'
        : ft === 'Ch'
          ? flags & (1 << 17)
            ? 'dropdown'
            : 'list'
          : ft === 'Sig'
            ? 'signature'
            : ft !== 'Btn'
              ? 'opaque'
              : flags & (1 << 16)
                ? 'button'
                : flags & (1 << 15)
                  ? 'radio'
                  : 'checkbox';
    record.flags = flags;
    const designKind = parseDesign(source, dict)?.kind;
    if (record.kind === 'text' && (designKind === 'date' || designKind === 'image'))
      record.kind = designKind;
    if (record.kind === 'button' && parseDesign(source, dict)?.kind === 'image')
      record.kind = 'image';
    const isString = (value: PDFObject | undefined): value is PDFString | PDFHexString =>
      value instanceof PDFString || value instanceof PDFHexString;
    for (const key of ['V', 'DV'] as const) {
      const value = record.effective[key];
      if (value === undefined || value.toString() === 'null') continue;
      if (
        (ft === 'Tx' && !isString(value)) ||
        (ft === 'Btn' && !(flags & (1 << 16)) && !(value instanceof PDFName)) ||
        (ft === 'Ch' &&
          !isString(value) &&
          (!(value instanceof PDFArray) ||
            value.asArray().some((entry) => !isString(resolve(source, entry)))))
      )
        fail(
          'FIELD_VALUE_TYPE',
          input.id,
          `${path}/${key}`,
          'Field value type does not agree with its canonical field type'
        );
    }
    const optionValues = record.effective.Opt;
    if (
      ft === 'Ch' &&
      optionValues !== undefined &&
      (!(optionValues instanceof PDFArray) ||
        optionValues.asArray().some((entry) => {
          const value = resolve(source, entry);
          return (
            !isString(value) &&
            (!(value instanceof PDFArray) ||
              value.size() !== 2 ||
              value.asArray().some((part) => !isString(resolve(source, part))))
          );
        }))
    )
      fail(
        'FIELD_OPTIONS',
        input.id,
        `${path}/Opt`,
        'Choice options must be text values or export/display pairs'
      );
    const widgetValues = entries.length
      ? entries
      : text(read(source, dict, 'Subtype')) === 'Widget'
        ? [value]
        : [];
    record.widgets = widgetValues.map((entry, index) => {
      const widget = resolve(source, entry);
      if (!(widget instanceof PDFDict) || text(read(source, widget, 'Subtype')) !== 'Widget')
        fail(
          'WIDGET_DICTIONARY',
          input.id,
          `${path}/Kids[${index}]`,
          'Field child is not a widget'
        );
      const owner = widget.get(name('P')),
        pageIndex = widgetPages.get(widget);
      if (
        pageIndex === undefined ||
        (owner &&
          (!(owner instanceof PDFRef) ||
            source.pages[pageIndex].ref.toString() !== owner.toString()))
      )
        fail(
          'WIDGET_OWNER',
          input.id,
          `${path}/Kids[${index}]/P`,
          'Widget /P and unique page /Annots ownership disagree'
        );
      const rect = read(source, widget, 'Rect');
      if (
        !(rect instanceof PDFArray) ||
        rect.size() !== 4 ||
        rect.asArray().some((item) => !Number.isFinite(numeric(resolve(source, item))))
      )
        fail('WIDGET_RECT', input.id, `${path}/Kids[${index}]/Rect`, 'Widget rectangle is invalid');
      const result: PdfWidgetRecord = {
        field: record,
        dict: widget,
        ref: entry instanceof PDFRef ? entry : pdf.context.getObjectRef(widget),
        pageIndex,
        index,
        path: `${path}/widget[${index}]`,
        flags: numeric(read(source, widget, 'F')) ?? 0,
        option: undefined,
      };
      if (
        read(source, widget, 'F') !== undefined &&
        !(read(source, widget, 'F') instanceof PDFNumber)
      )
        fail('WIDGET_FLAGS', input.id, `${result.path}/F`, 'Annotation flags must be numeric');
      const widgetParent = widget.get(name('Parent'));
      if (
        widget !== dict &&
        (!(widgetParent instanceof PDFRef) || widgetParent.toString() !== ref.toString())
      )
        fail(
          'WIDGET_PARENT',
          input.id,
          `${result.path}/Parent`,
          'Widget /Parent does not agree with its canonical field'
        );
      if (!Number.isInteger(result.flags) || result.flags < 0 || result.flags > 0xffffffff)
        fail(
          'WIDGET_FLAGS',
          input.id,
          `${result.path}/F`,
          'Annotation flags must be an unsigned integer'
        );
      if (record.kind === 'radio') {
        const opt = record.effective.Opt,
          option = opt instanceof PDFArray ? resolve(source, opt.get(index)) : opt;
        result.option = text(option) ?? onValue(source, widget);
        if (result.option === undefined)
          fail('RADIO_OPTION', input.id, result.path, 'Radio widget has no export option');
      }
      if (source.widgetOwners.has(widget))
        fail(
          'WIDGET_PARENT',
          input.id,
          result.path,
          'Widget is held by more than one canonical field'
        );
      source.widgetOwners.set(widget, result);
      return result;
    });
    if (
      record.kind === 'radio' &&
      optionValues !== undefined &&
      (!(optionValues instanceof PDFArray) ||
        optionValues.size() !== record.widgets.length ||
        optionValues.asArray().some((entry) => !isString(resolve(source, entry))))
    )
      fail(
        'FIELD_OPTIONS',
        input.id,
        `${path}/Opt`,
        'Radio export options must be text values in canonical widget order'
      );
    source.fields.push(record);
  };
  const fields = read(source, source.form, 'Fields');
  if (fields && !(fields instanceof PDFArray))
    fail('FIELD_ARRAY', input.id, '/AcroForm/Fields', 'Canonical fields must be an array');
  if (fields instanceof PDFArray)
    fields
      .asArray()
      .forEach((entry, index) => walkField(entry, undefined, `/AcroForm/Fields[${index}]`));
  for (let index = 0; index < source.pages.length; index++) {
    const page = source.pages[index];
    const media = page.getMediaBox(),
      crop = page.getCropBox();
    if (
      ![media.x, media.y, media.width, media.height, crop.x, crop.y, crop.width, crop.height].every(
        Number.isFinite
      ) ||
      media.width <= 0 ||
      media.height <= 0 ||
      crop.width <= 0 ||
      crop.height <= 0 ||
      page.getRotation().angle % 90
    )
      fail('PAGE_GEOMETRY', input.id, `/Pages[${index}]`, 'Page geometry or rotation is invalid');
    for (const entry of page.node.Annots()?.asArray() ?? []) {
      const dict = resolve(source, entry);
      if (!(dict instanceof PDFDict))
        fail(
          'ANNOTATION_DICTIONARY',
          input.id,
          `/Pages[${index}]/Annots`,
          'Annotation is not a dictionary'
        );
      if (text(read(source, dict, 'Subtype')) === 'Widget' && !source.widgetOwners.has(dict))
        fail(
          'ORPHAN_WIDGET',
          input.id,
          `/Pages[${index}]/Annots`,
          'Widget is missing from the canonical field tree'
        );
      const ref = entry instanceof PDFRef ? entry : pdf.context.getObjectRef(dict);
      if (!ref)
        fail(
          'DIRECT_ANNOTATION',
          input.id,
          `/Pages[${index}]/Annots`,
          'Direct annotations require normalization'
        );
      source.annotations.set(ref.toString(), { ref, dict, pageIndex: index });
    }
  }
  const namesDictionary = read(source, pdf.catalog, 'Names');
  if (namesDictionary instanceof PDFDict)
    for (const [key] of namesDictionary.entries())
      if (key !== name('Dests'))
        fail(
          'OPAQUE_NAMES',
          input.id,
          `/Names/${key.decodeText()}`,
          'Document-wide name-tree semantics cannot be retained safely'
        );
  const legacy = read(source, pdf.catalog, 'Dests');
  if (legacy instanceof PDFDict)
    for (const [key, value] of legacy.entries()) source.names.set(key.decodeText(), value);
  const namesRoot = read(source, namesDictionary, 'Dests'),
    seenNames = new Set<PDFDict>();
  const collectNames = (dict: PDFObject | undefined): void => {
    if (!(dict instanceof PDFDict) || seenNames.has(dict))
      fail(
        'DESTINATION_TREE',
        input.id,
        '/Names/Dests',
        'Named destination tree is invalid or cyclic'
      );
    seenNames.add(dict);
    const values = read(source, dict, 'Names');
    if (values instanceof PDFArray) {
      if (values.size() % 2)
        fail('DESTINATION_TREE', input.id, '/Names/Dests/Names', 'Names array has odd length');
      for (let index = 0; index < values.size(); index += 2) {
        const key = text(resolve(source, values.get(index)));
        if (key === undefined || source.names.has(key))
          fail(
            'DESTINATION_NAME',
            input.id,
            '/Names/Dests/Names',
            'Destination name is missing or duplicate'
          );
        source.names.set(key, values.get(index + 1));
      }
    }
    const kids = read(source, dict, 'Kids');
    if (kids instanceof PDFArray)
      kids.asArray().forEach((entry) => collectNames(resolve(source, entry)));
  };
  if (namesRoot) collectNames(namesRoot);
  return source;
}
export function parseDesign(
  source: PdfComposeSourceState,
  field: PDFDict
): PdfFieldDesign | undefined {
  const value = read(source, field, 'ZuviFieldDesign');
  if (!(value instanceof PDFString || value instanceof PDFHexString)) return undefined;
  try {
    const parsed: unknown = JSON.parse(value.decodeText());
    if (!isDesign(parsed))
      fail(
        'FIELD_DESIGN',
        source.id,
        '/AcroForm/ZuviFieldDesign',
        'Preserved field design must be a JSON object'
      );
    return parsed;
  } catch {
    fail(
      'FIELD_DESIGN',
      source.id,
      '/AcroForm/ZuviFieldDesign',
      'Invalid preserved field design metadata'
    );
  }
}
export function onValue(
  source: PdfComposeSourceState,
  widget: PDFDict | undefined
): string | undefined {
  const ap = read(source, widget, 'AP'),
    normal = read(source, ap, 'N');
  if (!(normal instanceof PDFDict)) return undefined;
  return normal
    .entries()
    .map(([key]) => key.decodeText())
    .find((key) => key !== 'Off');
}
export function fieldValue(record: PdfFieldRecord, defaultValue = false): StudioPdfComposeValue {
  const value = record.effective[defaultValue ? 'DV' : 'V'];
  if (record.kind === 'radio') {
    const raw = text(value);
    if (!raw || raw === 'Off') return undefined;
    return (
      record.widgets.find((widget) => onValue(record.source, widget.dict) === raw)?.option ?? raw
    );
  }
  if (record.kind === 'checkbox') return text(value) !== undefined && text(value) !== 'Off';
  if (record.kind === 'image')
    return defaultValue
      ? (text(value) ?? parseDesign(record.source, record.dict)?.defaultValue ?? '')
      : (text(read(record.source, record.dict, 'ZuviFieldImage')) ?? '');
  if (record.kind === 'dropdown' || record.kind === 'list')
    return value instanceof PDFArray
      ? value.asArray().map((entry) => text(resolve(record.source, entry)))
      : value
        ? [text(value)]
        : [];
  return text(value);
}
export function fieldDefinition(record: PdfFieldRecord): Record<string, StudioPdfComposeValue> {
  const result: Record<string, StudioPdfComposeValue> = Object.fromEntries(
    (['FT', 'Ff', 'Q', 'MaxLen'] as const).map((key) => [
      key,
      canonical(record.source, record.effective[key]),
    ])
  );
  result.kind = record.kind;
  result.options =
    record.kind === 'radio'
      ? [...new Set(record.widgets.map((widget) => widget.option))].sort()
      : canonical(record.source, record.effective.Opt);
  result.da = text(record.effective.DA) ?? '';
  const design = parseDesign(record.source, record.dict);
  if (design) {
    const copy = { ...design };
    for (const key of ['defaultValue', 'defaultSelections', 'sourceName']) delete copy[key];
    result.design = copy;
  }
  if (record.dict.has(name('AA')) || record.dict.has(name('A')))
    result.actions = canonical(record.source, record.dict, [
      'Parent',
      'Kids',
      'T',
      'TU',
      'TM',
      'FT',
      'Ff',
      'V',
      'DV',
      'Q',
      'DA',
      'MaxLen',
      'Opt',
      'AP',
      'AS',
      'P',
      'Rect',
      'Type',
      'Subtype',
      'F',
      'Contents',
      'MK',
      'ZuviFieldImage',
      'ZuviFieldDesign',
    ]);
  return result;
}

function numeric(value: PDFObject | undefined): number | undefined {
  return value instanceof PDFNumber ? value.asNumber() : undefined;
}
function isValue(value: unknown): value is StudioPdfComposeValue {
  return (
    value === null ||
    value === undefined ||
    ['string', 'number', 'boolean'].includes(typeof value) ||
    (Array.isArray(value)
      ? value.every(isValue)
      : typeof value === 'object' && Object.values(value).every(isValue))
  );
}
function isDesign(value: unknown): value is PdfFieldDesign {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.values(value).every(isValue)
  );
}
