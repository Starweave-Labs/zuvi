import {
  PDFArray,
  PDFBool,
  PDFDict,
  PDFHexString,
  PDFName,
  PDFNull,
  PDFNumber,
  PDFRawStream,
  PDFRef,
  PDFString,
  PDFAcroTerminal,
  type PDFDocument,
  type PDFField,
  type PDFObject,
} from 'pdf-lib';
import type { StudioPdfField } from '@zuvi/react';
import { sha256 } from './studio-pdf-compose-sha256';

const key = (value: string) => PDFName.of(value);
const decoded = (value: PDFObject | undefined) =>
  value instanceof PDFString || value instanceof PDFHexString ? value.decodeText() : undefined;

/** A native terminal that pdf-lib does not expose through its public field wrappers. */
export class PassivePdfField {
  readonly acroField: PDFAcroTerminal;
  constructor(
    readonly ref: PDFRef,
    dict: PDFDict,
    private name: string
  ) {
    this.acroField = PDFAcroTerminal.fromDict(dict, ref);
    const widgets = this.acroField.getWidgets.bind(this.acroField);
    this.acroField.getWidgets = () =>
      !this.acroField.Kids() && dict.lookup(key('Subtype')) !== key('Widget') ? [] : widgets();
  }
  getName() {
    return this.name;
  }
}

export type NativePdfField = PDFField | PassivePdfField;

function inherited(dict: PDFDict, name: string, preserveReference = false): PDFObject | undefined {
  const visited = new Set<PDFDict>();
  let current: PDFDict | undefined = dict;
  while (current) {
    if (visited.has(current)) throw new Error('PDF 字段父级形成循环。');
    visited.add(current);
    const value = current.lookup(key(name));
    if (value !== undefined && value !== PDFNull)
      return preserveReference ? current.get(key(name)) : value;
    const parent: PDFObject | undefined = current.lookup(key('Parent'));
    current = parent instanceof PDFDict ? parent : undefined;
  }
}

const inheritedProperties = ['FT', 'Ff', 'V', 'DV', 'DA', 'Q', 'MaxLen', 'Opt'];

function normalizeNullProperties(dict: PDFDict) {
  for (const name of [...inheritedProperties, 'Parent', 'P', 'T', 'Kids']) {
    const value = dict.get(key(name), true);
    if (value === PDFNull || (value instanceof PDFRef && dict.context.lookup(value) === PDFNull))
      dict.delete(key(name));
  }
}

/** Validate the canonical tree before pdf-lib recursively visits it, including unknown FT. */
export function enumeratePdfFields(pdf: PDFDocument): NativePdfField[] {
  const form = pdf.catalog.AcroForm();
  if (!form) return [];
  const roots = form.lookup(key('Fields'));
  if (roots === undefined) return [];
  if (!(roots instanceof PDFArray)) throw new Error('PDF 表单字段树无效。');
  const seen = new Set<PDFDict>(),
    names = new Set<string>();
  const terminals: { ref: PDFRef; dict: PDFDict; name: string }[] = [];
  const widgetOwners = new Map<PDFDict, PDFDict>();
  const pageOwners = new Map<PDFDict, PDFRef>();
  for (const page of pdf.getPages()) {
    const annotations = page.node.Annots();
    for (const annotation of annotations?.asArray() ?? []) {
      const dict = pdf.context.lookup(annotation);
      if (dict instanceof PDFDict) normalizeNullProperties(dict);
      if (!(dict instanceof PDFDict) || dict.lookup(key('Subtype')) !== key('Widget')) continue;
      if (pageOwners.has(dict)) throw new Error('PDF 控件关联了多个页面。');
      pageOwners.set(dict, page.ref);
    }
  }
  const walk = (value: PDFObject, parent: PDFRef | undefined, parts: string[]) => {
    const dict = pdf.context.lookup(value);
    if (!(value instanceof PDFRef) || !(dict instanceof PDFDict))
      throw new Error('PDF 字段缺少独立的原生对象引用。');
    normalizeNullProperties(dict);
    if (seen.has(dict) || seen.size >= 10000)
      throw new Error('PDF 字段树循环、重复引用或超出范围。');
    seen.add(dict);
    const actualParent = dict.get(key('Parent'));
    if (parent ? actualParent?.toString() !== parent.toString() : actualParent !== undefined)
      throw new Error('PDF 字段的父子关系不一致。');
    const part = decoded(dict.lookup(key('T')));
    if (!part?.trim() || part.includes('.') || /[\r\n]/.test(part))
      throw new Error('PDF 字段的原生名称无效。');
    const fullName = [...parts, part].join('.');
    if (fullName.length > 256 || names.has(fullName))
      throw new Error('PDF 含有重复或过长的字段名称。');
    names.add(fullName);
    const kids = dict.lookup(key('Kids'));
    if (kids !== undefined && !(kids instanceof PDFArray)) throw new Error('PDF 字段子对象无效。');
    const children = kids instanceof PDFArray ? kids.asArray() : [];
    const isField = (entry: PDFObject) => {
      const child = pdf.context.lookup(entry);
      if (child instanceof PDFDict) normalizeNullProperties(child);
      return child instanceof PDFDict && child.has(key('T'));
    };
    if (children.some(isField)) {
      if (!children.every(isField)) throw new Error('PDF 同一字段混合了字段子级与控件。');
      for (const child of children) walk(child, value, [...parts, part]);
      return;
    }
    const type = inherited(dict, 'FT');
    if (!(type instanceof PDFName)) throw new Error(`表单“${fullName}”缺少原生字段类型。`);
    const flags = inherited(dict, 'Ff');
    if (
      flags !== undefined &&
      (!(flags instanceof PDFNumber) ||
        !Number.isInteger(flags.asNumber()) ||
        flags.asNumber() < 0 ||
        flags.asNumber() > 0xffffffff)
    )
      throw new Error(`表单“${fullName}”的原生属性无效。`);
    const widgets = children.length
      ? children
      : dict.lookup(key('Subtype')) === key('Widget')
        ? [value]
        : [];
    for (const entry of widgets) {
      const widget = pdf.context.lookup(entry);
      if (!(widget instanceof PDFDict) || widget.lookup(key('Subtype')) !== key('Widget'))
        throw new Error(`表单“${fullName}”含有非控件子对象。`);
      if (widgetOwners.has(widget)) throw new Error('PDF 控件同时属于多个字段。');
      widgetOwners.set(widget, dict);
      const page = pageOwners.get(widget),
        owner = widget.get(key('P'));
      if (!page || (owner !== undefined && owner.toString() !== page.toString()))
        throw new Error(`表单“${fullName}”的控件页面不一致。`);
      if (widget !== dict && widget.get(key('Parent'))?.toString() !== value.toString())
        throw new Error(`表单“${fullName}”的控件父级不一致。`);
    }
    terminals.push({ ref: value, dict, name: fullName });
    if (terminals.length > 2000) throw new Error('PDF 字段超过 2000 项。');
  };
  for (const root of roots.asArray()) walk(root, undefined, []);
  if ([...pageOwners.keys()].some((widget) => !widgetOwners.has(widget)))
    throw new Error('PDF 页面包含未关联原生字段树的控件。');
  // pdf-lib stops inheritance at raw indirect nulls and reads several attributes only
  // on the terminal. Materialize effective properties in this loaded PDF, preserving
  // non-null references, before it constructs wrappers or reads private field flags.
  // The original Blob remains untouched and unchanged exports still return it exactly.
  for (const { dict } of terminals)
    for (const name of inheritedProperties) {
      if (dict.lookup(key(name)) !== undefined) continue;
      const value =
        inherited(dict, name, true) ??
        (name === 'DA' || name === 'Q' ? form.get(key(name)) : undefined);
      if (value !== undefined && value !== PDFNull) dict.set(key(name), value);
    }
  const wrapped = new Map(
    pdf
      .getForm()
      .getFields()
      .map((field) => [field.ref.toString(), field])
  );
  return terminals.map(
    ({ ref, dict, name }) => wrapped.get(ref.toString()) ?? new PassivePdfField(ref, dict, name)
  );
}

export function readPdfFieldWidgets(
  pdf: PDFDocument,
  field: NativePdfField
): NonNullable<StudioPdfField['widgets']> {
  const dict = field.acroField.dict;
  const widgets =
    !field.acroField.Kids() && dict.lookup(key('Subtype')) !== key('Widget')
      ? []
      : field.acroField.getWidgets();
  return widgets.map((widget) => {
    const owners = pdf.getPages().flatMap((page, index) =>
      page.node
        .Annots()
        ?.asArray()
        .some((entry) => pdf.context.lookup(entry) === widget.dict)
        ? [index]
        : []
    );
    if (owners.length !== 1) throw new Error(`表单“${field.getName()}”的控件未唯一关联页面。`);
    const rectangle = widget.getRectangle();
    const flags = widget.getFlags();
    if (
      !Object.values(rectangle).every(Number.isFinite) ||
      rectangle.width < 0 ||
      rectangle.height < 0 ||
      !Number.isInteger(flags) ||
      flags < 0 ||
      flags > 0xffffffff
    )
      throw new Error(`表单“${field.getName()}”含有无效的控件位置或属性。`);
    const rotation = widget.getAppearanceCharacteristics()?.getRotation() ?? 0;
    if (!Number.isFinite(rotation) || rotation % 90 !== 0)
      throw new Error(`表单“${field.getName()}”含有不受支持的控件旋转。`);
    return { page: owners[0], ...rectangle, rotation: ((rotation % 360) + 360) % 360, flags };
  });
}

function valueIdentity(
  pdf: PDFDocument,
  value: PDFObject | undefined,
  visiting = new Set<PDFObject>()
): unknown {
  if (value === undefined || value === PDFNull) return null;
  if (value instanceof PDFRef) {
    if (visiting.has(value)) throw new Error('PDF 原生字段值形成循环，无法安全保存。');
    visiting.add(value);
    const result = valueIdentity(pdf, pdf.context.lookup(value), visiting);
    visiting.delete(value);
    return result;
  }
  if (value instanceof PDFName) return ['name', value.decodeText()];
  if (value instanceof PDFString || value instanceof PDFHexString)
    return ['text', value.decodeText()];
  if (value instanceof PDFNumber) return ['number', value.asNumber()];
  if (value instanceof PDFBool) return ['boolean', value.asBoolean()];
  if (visiting.has(value)) throw new Error('PDF 原生字段值形成循环，无法安全保存。');
  visiting.add(value);
  let result: unknown;
  if (value instanceof PDFRawStream)
    result = ['stream', sha256(value.contents), valueIdentity(pdf, value.dict, visiting)];
  else if (value instanceof PDFArray)
    result = ['array', value.asArray().map((entry) => valueIdentity(pdf, entry, visiting))];
  else if (value instanceof PDFDict)
    result = [
      'dictionary',
      value
        .entries()
        .sort(([a], [b]) => a.decodeText().localeCompare(b.decodeText()))
        .map(([name, entry]) => [name.decodeText(), valueIdentity(pdf, entry, visiting)]),
    ];
  else throw new Error('PDF 原生字段值的对象类型无法保持。');
  visiting.delete(value);
  return result;
}

/** Passwords and other passive values never enter the editable JSON as plain text. */
export function passivePdfField(
  pdf: PDFDocument,
  field: NativePdfField,
  reason: string
): StudioPdfField {
  const identityKeys = [
    'FT',
    'Ff',
    'V',
    'DV',
    'Q',
    'MaxLen',
    'Opt',
    'TU',
    'TM',
    'DS',
    'RV',
    'ZuviFieldDesign',
    'ZuviFieldImage',
  ];
  const identity = identityKeys.map((name) => [
    name,
    valueIdentity(pdf, inherited(field.acroField.dict, name)),
  ]);
  const nativeType = inherited(field.acroField.dict, 'FT');
  const all = readPdfFieldWidgets(pdf, field);
  const nonvisual = (widget: (typeof all)[number]) =>
    !!(widget.flags! & (1 | 2 | 32)) || widget.width === 0 || widget.height === 0;
  return {
    name: field.getName(),
    type: 'opaque',
    value: '',
    readOnly: true,
    nativeType: nativeType instanceof PDFName ? nativeType.decodeText() : '',
    passiveReason: reason,
    nativeValueHash: sha256(new TextEncoder().encode(JSON.stringify(identity))),
    widgets: all.filter((widget) => !nonvisual(widget)),
    ...(all.some(nonvisual) ? { hiddenWidgets: all.filter(nonvisual) } : {}),
  };
}

export function hasNativePdfSignature(pdf: PDFDocument): boolean {
  return enumeratePdfFields(pdf).some(
    (field) =>
      inherited(field.acroField.dict, 'FT') === key('Sig') &&
      inherited(field.acroField.dict, 'V') !== undefined
  );
}
