import {
  PDFDocument,
  PDFName,
  PDFString,
  PDFHexString,
  PDFNumber,
  PDFDict,
  PDFArray,
  StandardFonts,
  rgb,
  decodePDFRawStream,
} from 'pdf-lib';
import { writeFile, mkdir } from 'node:fs/promises';
import { Buffer } from 'node:buffer';
import { hash, name, resolve } from './studio-pdf-compose-test-loader.mjs';
import { loadSource } from './studio-pdf-compose-test-loader.mjs';
export const OUTPUT = '/tmp/zuvi-pdf-compose-migration-native/output/pdf';
const PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAFAAAAAwCAIAAAAJh2qgAAABGklEQVR4nO2YIQ7CQBBFPz81OMItegGCBRwejSAEy1GwKByOI9RzAxJOwQkIglAENZSZ3YHPU03FtC9vkmbbGS/2yMGhu8vyXEIMQgxCDEIMQgxCDEKMIvHzqvXxcVnWNy/b068JV0/PBnqrMpl5kVe10dxVm3FsX4N/U+GqlWqC1Axo65qaEINh8zpFZmRbD2dCDAbPax6ZEIMQg/H32XarCTEIMQp8D8vR/PMhhBiEGIQYtBo02Qzhyew8MJlDiEGIQcNZfltttc/4F44Y2TAvPArbOtva4r/SsSKb54Xf4eHu3PqQ7KGa4jvcLrWfLRIcD99K7aqa9Dxcp240T+CZ7QdAbd6fXpEDQgxCDEIMQgxCDOZ+gdTcAGbPRSYezDUhAAAAAElFTkSuQmCC';
export function addAnnot(pdf, page, values) {
  const dict = values instanceof PDFDict ? values : pdf.context.obj(values);
  const ref = pdf.context.register(dict);
  page.node.addAnnot(ref);
  return { dict, ref };
}
export function addLink(pdf, source, target, extra = {}) {
  return addAnnot(pdf, source, {
    Type: 'Annot',
    Subtype: 'Link',
    Rect: [10, 10, 80, 30],
    P: source.ref,
    Dest: pdf.context.obj([target.ref, PDFName.of('Fit')]),
    ...extra,
  });
}
export function addGoTo(pdf, page, target, additional = false) {
  const action = pdf.context.obj({ S: 'GoTo', D: [target.ref, PDFName.of('Fit')] });
  if (additional) page.node.set(name('AA'), pdf.context.obj({ O: action }));
  else page.node.set(name('A'), action);
}
export function forceDA(field, _font) {
  field.acroField.dict.set(name('DA'), PDFString.of('/F1 12 Tf 0 g'));
}
export async function basicPdf({
  pages = 3,
  label = 'SRC',
  fontName = StandardFonts.Helvetica,
  fieldName = 'Shared',
  value = 'Hello',
  kind = 'text',
  form = true,
} = {}) {
  const pdf = await PDFDocument.create({ updateMetadata: false }),
    font = await pdf.embedFont(fontName);
  const pageList = Array.from({ length: pages }, (_, index) => {
    const page = pdf.addPage([300 + index * 10, 400 + index * 10]);
    page.drawText(`${label}_PAGE_${index + 1}`, { x: 20, y: 350, size: 18, font });
    return page;
  });
  const fields = {};
  if (form) {
    const native = pdf.getForm();
    let field;
    const options = {
      x: 20,
      y: 280,
      width: 130,
      height: 30,
      font,
      borderWidth: 1,
      textColor: rgb(0.1, 0.2, 0.3),
    };
    if (kind === 'checkbox') {
      field = native.createCheckBox(fieldName);
      field.addToPage(pageList[0], { ...options, width: 20, height: 20 });
      if (value) field.check();
      field.acroField.dict.set(name('DV'), name(value ? 'Yes' : 'Off'));
    } else if (kind === 'radio') {
      field = native.createRadioGroup(fieldName);
      field.disableMutualExclusion();
      field.addOptionToPage('A', pageList[0], { ...options, width: 20, height: 20 });
      field.addOptionToPage('B', pageList[0], { ...options, x: 80, width: 20, height: 20 });
      if (value) field.select(value);
      field.acroField.dict.set(name('DV'), name(value ? (value === 'A' ? '0' : '1') : 'Off'));
    } else if (kind === 'dropdown') {
      field = native.createDropdown(fieldName);
      field.setOptions(['One', 'Two']);
      field.addToPage(pageList[0], options);
      if (value) field.select(value);
      field.updateAppearances(font);
      forceDA(field, font);
    } else if (kind === 'list') {
      field = native.createOptionList(fieldName);
      field.setOptions(['Alpha', 'Beta', 'Gamma']);
      field.enableMultiselect();
      field.addToPage(pageList[0], { ...options, height: 65 });
      field.select(Array.isArray(value) ? value : [value]);
      field.updateAppearances(font);
      forceDA(field, font);
    } else {
      field = native.createTextField(fieldName);
      field.addToPage(pageList[0], options);
      field.setText(String(value));
      field.updateAppearances(font);
      forceDA(field, font);
    }
    fields[fieldName] = field;
    native.acroForm.dict.set(
      name('DR'),
      pdf.context.obj({ Font: { F1: font.ref, Helvetica: font.ref, [font.name]: font.ref } })
    );
  }
  return {
    pdf,
    font,
    pages: pageList,
    fields,
    bytes: () => pdf.save({ useObjectStreams: false, updateFieldAppearances: false }),
  };
}
export async function sevenFields({ label = 'SEVEN' } = {}) {
  const fixture = await basicPdf({ pages: 2, label, form: false }),
    { pdf, font, pages } = fixture,
    form = pdf.getForm();
  const base = { x: 20, width: 150, height: 27, font, borderWidth: 1 };
  for (const [label, y] of [
    ['Text', 330],
    ['Date', 283],
    ['Image', 238],
    ['Checkbox', 172],
    ['Radio A / B', 123],
  ])
    pages[0].drawText(label, { x: 20, y, size: 10, font });
  for (const [label, y] of [
    ['Dropdown', 309],
    ['List (multiple selection)', 257],
  ])
    pages[1].drawText(label, { x: 20, y, size: 10, font });
  const fields = {};
  const textField = form.createTextField('Text');
  textField.addToPage(pages[0], { ...base, y: 295 });
  textField.setText('Native text');
  textField.updateAppearances(font);
  forceDA(textField, font);
  fields.Text = textField;
  const date = form.createTextField('Date');
  date.addToPage(pages[0], { ...base, y: 248 });
  date.setText('2026-11-26');
  date.updateAppearances(font);
  forceDA(date, font);
  date.acroField.dict.set(
    name('ZuviFieldDesign'),
    PDFHexString.fromText(JSON.stringify({ kind: 'date', dateFormat: 'YYYY-MM-DD', fontSize: 12 }))
  );
  fields.Date = date;
  const image = form.createButton('Image');
  image.addToPage('', pages[0], { ...base, y: 190, width: 65, height: 40 });
  const png = await pdf.embedPng(Uint8Array.from(Buffer.from(PNG, 'base64')));
  image.setImage(png);
  image.acroField.dict.set(
    name('ZuviFieldDesign'),
    PDFHexString.fromText(JSON.stringify({ kind: 'image', fontSize: 12 }))
  );
  image.acroField.dict.set(
    name('ZuviFieldImage'),
    PDFHexString.fromText(`data:image/png;base64,${PNG}`)
  );
  fields.Image = image;
  const checked = form.createCheckBox('Checked');
  checked.addToPage(pages[0], { ...base, y: 145, width: 20, height: 20 });
  checked.check();
  checked.acroField.dict.set(name('DV'), name('Yes'));
  fields.Checked = checked;
  const radio = form.createRadioGroup('Choice');
  radio.disableMutualExclusion();
  radio.addOptionToPage('A', pages[0], { ...base, y: 95, width: 20, height: 20 });
  radio.addOptionToPage('B', pages[0], { ...base, x: 90, y: 95, width: 20, height: 20 });
  radio.select('A');
  radio.acroField.dict.set(name('DV'), name('0'));
  fields.Choice = radio;
  const dropdown = form.createDropdown('Drop');
  dropdown.setOptions(['One', 'Two']);
  dropdown.addToPage(pages[1], { ...base, y: 275 });
  dropdown.select('Two');
  dropdown.updateAppearances(font);
  forceDA(dropdown, font);
  fields.Drop = dropdown;
  const list = form.createOptionList('List');
  list.setOptions(['Alpha', 'Beta', 'Gamma']);
  list.enableMultiselect();
  list.addToPage(pages[1], { ...base, y: 175, height: 75 });
  list.select(['Alpha', 'Gamma']);
  list.updateAppearances(font);
  forceDA(list, font);
  fields.List = list;
  form.acroForm.dict.set(
    name('DR'),
    pdf.context.obj({ Font: { F1: font.ref, Helvetica: font.ref } })
  );
  return { ...fixture, fields };
}
export async function hiddenOpaque() {
  const fixture = await basicPdf({ pages: 2, label: 'HIDDEN', form: false }),
    { pdf, font, pages } = fixture,
    form = pdf.getForm();
  const fields = {};
  for (const [index, [fieldName, flags, zero]] of [
    ['Zero', 0, true],
    ['Invisible', 1, false],
    ['NoView', 32, true],
    ['Opaque', 0, true],
  ].entries()) {
    const field = form.createTextField(fieldName);
    field.addToPage(pages[0], { x: 20, y: 60 + index * 40, width: 140, height: 27, font });
    field.setText(`value-${fieldName}`);
    field.updateAppearances(font);
    forceDA(field, font);
    const widget = field.acroField.getWidgets()[0];
    widget.dict.set(name('F'), PDFNumber.of(flags));
    if (zero)
      widget.dict.set(name('Rect'), pdf.context.obj([20, 60 + index * 40, 20, 60 + index * 40]));
    if (fieldName === 'Opaque') {
      field.acroField.dict.set(name('FT'), name('VendorPassive'));
      field.acroField.dict.set(name('Ff'), PDFNumber.of(1));
      field.acroField.dict.set(
        name('VendorData'),
        pdf.context.obj({ Version: 3, Token: PDFHexString.fromText('opaque-retained') })
      );
    }
    fields[fieldName] = field;
  }
  form.acroForm.dict.set(
    name('DR'),
    pdf.context.obj({ Font: { F1: font.ref, Helvetica: font.ref } })
  );
  return { ...fixture, fields };
}
export function combineFieldWidget(fixture, fieldName) {
  const field = fixture.fields[fieldName],
    widget = field.acroField.getWidgets()[0],
    oldRef = fixture.pdf.context.getObjectRef(widget.dict),
    page = fixture.pages.find((page) => page.node.Annots()?.asArray().includes(oldRef));
  for (const [key, value] of widget.dict.entries())
    if (key !== name('Parent')) field.acroField.dict.set(key, value);
  field.acroField.dict.delete(name('Kids'));
  const annots = page.node.Annots();
  annots.set(annots.indexOf(oldRef), field.ref);
  return field;
}
export function nestedPage(fixture, index = 0) {
  const { pdf, pages } = fixture,
    page = pages[index],
    root = pdf.catalog.Pages(),
    rootRef = pdf.context.getObjectRef(root),
    branch = pdf.context.obj({
      Type: 'Pages',
      Parent: rootRef,
      Kids: [page.ref],
      Count: 1,
      MediaBox: [0, 0, 300, 400],
      Resources: page.node.Resources(),
      Rotate: 90,
    }),
    branchRef = pdf.context.register(branch),
    kids = root.Kids();
  kids.set(index, branchRef);
  page.node.set(name('Parent'), branchRef);
  for (const key of ['MediaBox', 'CropBox', 'Resources', 'Rotate']) page.node.delete(name(key));
  return branch;
}
export function streamBytes(source, value, visited = new Set()) {
  const object = resolve(source, value);
  if (!object || visited.has(object)) return [];
  visited.add(object);
  if (object?.getContents) return [hash(object.getContents())];
  if (object instanceof PDFArray)
    return object.asArray().flatMap((entry) => streamBytes(source, entry, visited));
  if (object instanceof PDFDict)
    return object.entries().flatMap(([, entry]) => streamBytes(source, entry, visited));
  return [];
}
export async function inspect(bytes) {
  return loadSource({ id: 'inspect', bytes });
}
export function decodedContents(source) {
  return source.pdf.context
    .enumerateIndirectObjects()
    .flatMap(([, object]) =>
      object?.getContents
        ? [Buffer.from(decodePDFRawStream(object).decode()).toString('latin1')]
        : []
    )
    .join('\n');
}
export async function saveEvidence(filename, bytes) {
  await mkdir(OUTPUT, { recursive: true });
  await writeFile(`${OUTPUT}/${filename}`, bytes);
}
export function apHashes(source, fieldName) {
  const field = source.fields.find((field) => field.fullName === fieldName);
  return field.widgets.flatMap((widget) => streamBytes(source, widget.dict.get(name('AP')))).sort();
}
