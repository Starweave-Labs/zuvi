'use client';

import {
  PDFDocument,
  PDFTextField,
  PDFCheckBox,
  PDFDropdown,
  PDFRadioGroup,
  PDFOptionList,
  PDFButton,
  PDFHexString,
  PDFString,
  PDFDict,
  PDFName,
  PDFRef,
  EncryptedPDFError,
  StandardFonts,
  defaultDropdownAppearanceProvider,
  defaultOptionListAppearanceProvider,
  LineCapStyle,
  LineJoinStyle,
  degrees,
  rgb,
  pushGraphicsState,
  popGraphicsState,
  setLineWidth,
  setLineCap,
  setLineJoin,
  setStrokingRgbColor,
  moveTo,
  lineTo,
  stroke,
  type PDFField,
  type PDFFont,
  type PDFPage,
} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { applyPdfPageLayout, isolatePdfPageBuffers } from './studio-pdf-page-codec';
import { enumeratePdfFields, hasNativePdfSignature, passivePdfField, PassivePdfField, readPdfFieldWidgets } from './studio-pdf-field-reader';
import type { StudioPdfDocument, StudioPdfField, StudioPdfMark } from '../../../../../packages/ui/src/components/OfficeStudio/studio-types';
import type { PdfWorkspaceSourceBinding } from './studio-pdf-native/workspace-types';
import { readInventory } from './studio-pdf-native/read';
import { bindWorkspacePdfIdentities } from './studio-pdf-native/workspace-identities';
import { nativePdfWorkspace, validateNativePdfProjections, withNativePdfState } from './studio-pdf-native-document';
import {
  pdfFieldIssue,
  pdfFieldKind,
  pdfFieldWidgets,
} from '../../../../../packages/ui/src/components/OfficeStudio/studio-pdf-fields';

const MAX_PAGES = 200;
const quarterTurn = (angle: number) => ((angle % 360) + 360) % 360;
const DESIGN_KEY = PDFName.of('ZuviFieldDesign');
const IMAGE_KEY = PDFName.of('ZuviFieldImage');

function nativeDesign(field: PDFField): StudioPdfField['design'] {
  const value = field.acroField.dict.lookup(DESIGN_KEY);
  if (!(value instanceof PDFString || value instanceof PDFHexString)) return;
  try {
    const design = JSON.parse(value.decodeText()) as NonNullable<StudioPdfField['design']>;
    return {
      ...design,
      sourceName: field.getName(),
      required: field.isRequired(),
      ...(field instanceof PDFTextField ? { maxLength: field.getMaxLength() } : {}),
    };
  } catch {
    throw new Error('PDF 字段设计属性损坏。');
  }
}
let fontBytes: Promise<ArrayBuffer> | undefined;

async function loadSource(source: Blob) {
  if (!source.size || source.size > 50 * 1024 * 1024)
    throw new Error('请选择非空且不超过 50 MB 的 PDF 文件。');
  let pdf: PDFDocument;
  try {
    pdf = await PDFDocument.load(await source.arrayBuffer(), { updateMetadata: false });
  } catch (error) {
    if (
      error instanceof EncryptedPDFError ||
      // pdf-lib's ES5 Error subclasses can lose their name and prototype.
      (error instanceof Error &&
        error.message.startsWith('Input document to `PDFDocument.load` is encrypted.'))
    )
      throw new Error('此 PDF 已加密，请先解除密码保护后再编辑。');
    throw new Error('无法读取此 PDF，文件可能损坏或格式不受支持。');
  }
  if (pdf.getPageCount() < 1 || pdf.getPageCount() > MAX_PAGES)
    throw new Error('当前 PDF 编辑器支持 1 至 200 页。');
  // getForm() deletes XFA automatically, so inspect the source dictionary first.
  // PDFDict.lookup treats direct and indirect null entries as absent.
  if (pdf.catalog.AcroForm()?.lookup(PDFName.of('XFA')) !== undefined)
    throw new Error('此 PDF 使用 XFA 动态表单，当前编辑器暂不支持。');
  for (const page of pdf.getPages()) {
    if (!Number.isFinite(page.getRotation().angle) || page.getRotation().angle % 90 !== 0)
      throw new Error('PDF 含有不受支持的页面旋转。');
    pageBounds(page);
  }
  return pdf;
}

function pageBounds(page: PDFPage) {
  const media = page.getMediaBox();
  const crop = page.getCropBox();
  const left = Math.max(media.x, crop.x);
  const bottom = Math.max(media.y, crop.y);
  const right = Math.min(media.x + media.width, crop.x + crop.width);
  const top = Math.min(media.y + media.height, crop.y + crop.height);
  if (![left, bottom, right, top].every(Number.isFinite) || right <= left || top <= bottom)
    throw new Error('PDF 页面边界无效。');
  return { left, bottom, right, top };
}

function readWidgets(pdf: PDFDocument, field: PDFField, hidden = false): NonNullable<StudioPdfField['widgets']> {
  return readPdfFieldWidgets(pdf, field).flatMap((widget, widgetIndex) => {
    const { flags = 0, ...rectangle } = widget;
    const nonvisual = !!(flags & (1 | 2 | 32)) || widget.width === 0 || widget.height === 0;
    if (nonvisual !== hidden) return [];
    const option = field instanceof PDFRadioGroup ? field.getOptions()[widgetIndex] : undefined;
    if (field instanceof PDFRadioGroup && option === undefined)
      throw new Error(`单选表单“${field.getName()}”的控件选项不完整。`);
    return [
      {
        ...rectangle,
        ...(option === undefined ? {} : { option }),
        ...(hidden ? { flags } : {}),
      },
    ];
  });
}

function readFields(pdf: PDFDocument): StudioPdfField[] {
  const names = new Set<string>();
  return enumeratePdfFields(pdf)
    .map((field): StudioPdfField => {
      const name = field.getName();
      if (!name || names.has(name)) throw new Error('PDF 含有重复或空的表单字段名称。');
      names.add(name);
      if (field instanceof PassivePdfField) return passivePdfField(pdf, field, '未知原生字段');
      const design = nativeDesign(field);
      const base = { name, readOnly: field.isReadOnly(), ...(design ? { design } : {}) };
      let result: StudioPdfField;
      if (field instanceof PDFTextField) {
        if (field.isRichFormatted() || field.isPassword() || field.isFileSelector())
          return passivePdfField(pdf, field, field.isPassword() ? '密码字段' : field.isFileSelector() ? '文件选择字段' : '富文本字段');
        const value = field.getText() ?? '';
        if (value.length > 10_000 || (!field.isMultiline() && /[\r\n]/.test(value)))
          return passivePdfField(pdf, field, '原生文本超出编辑范围');
        result = {
          ...base,
          type: 'text',
          value,
          multiline: field.isMultiline(),
        };
      } else if (field instanceof PDFCheckBox) {
        result = { ...base, type: 'checkbox', value: field.acroField.getWidgets().length ? field.isChecked() : field.acroField.getValue() !== PDFName.of('Off') };
      } else if (field instanceof PDFDropdown) {
        if (field.isMultiselect() || field.isEditable() || field.getSelected().length > 1)
          return passivePdfField(pdf, field, '原生下拉框包含额外编辑功能');
        if (
          !design &&
          field.acroField
            .getOptions()
            .some(
              (option) =>
                option.display && option.display.decodeText() !== option.value.decodeText()
            )
        )
          return passivePdfField(pdf, field, '原生下拉框使用独立显示标签');
        const options = design
          ? field.acroField.getOptions().map((option) => option.value.decodeText())
          : field.getOptions();
        if (field.getSelected().some((value) => !options.includes(value)))
          return passivePdfField(pdf, field, '原生下拉框包含列表外的值');
        result = {
          ...base,
          type: 'choice',
          value: field.getSelected()[0] ?? '',
          options,
        };
      } else if (field instanceof PDFOptionList && design?.kind === 'list') {
        const values = field.getSelected();
        result = {
          ...base,
          type: 'choice',
          value: values[0] || '',
          selectedValues: values,
          options: field.acroField.getOptions().map((option) => option.value.decodeText()),
        };
      } else if (field instanceof PDFButton && design?.kind === 'image') {
        const value = field.acroField.dict.lookup(IMAGE_KEY);
        result = {
          ...base,
          type: 'image',
          value:
            value instanceof PDFString || value instanceof PDFHexString ? value.decodeText() : '',
        };
      } else if (field instanceof PDFRadioGroup) {
        result = {
          ...base,
          type: 'choice',
          value: field.getSelected() ?? '',
          options: [...new Set(field.getOptions())],
        };
      } else {
        return passivePdfField(pdf, field, field instanceof PDFOptionList ? '原生列表框' : field instanceof PDFButton ? '原生按钮' : '数字签名字段');
      }
      result.widgets = readWidgets(pdf, field);
      const hiddenWidgets = readWidgets(pdf, field, true);
      if (hiddenWidgets.length) result.hiddenWidgets = hiddenWidgets;
      if (design && pdfFieldWidgets(result).length) {
        const issue = pdfFieldIssue(result, pdf.getPageCount());
        if (issue) throw new Error(issue);
      }
      return result;
    });
}

export async function importStudioPdf(
  source: Blob, name: string, options: { pageIds?: readonly string[]; native?: boolean } = {},
): Promise<StudioPdfDocument> {
  const pdf = await loadSource(source);
  if (options.pageIds && (options.pageIds.length !== pdf.getPageCount()
    || options.pageIds.some((id) => typeof id !== 'string' || !id)
    || new Set(options.pageIds).size !== options.pageIds.length)) throw new Error('PDF 页面身份与原文件不匹配。');
  const document: StudioPdfDocument = {
    version: 1,
    id: crypto.randomUUID(),
    name: name.trim() || '文档.pdf',
    kind: 'pdf',
    pageCount: pdf.getPageCount(),
    sourcePageCount: pdf.getPageCount(),
    pages: pdf.getPages().map((page, sourcePage) => ({ id: options.pageIds?.[sourcePage] ?? crypto.randomUUID(), sourcePage, bounds: pageBounds(page) })),
    marks: [],
    rotations: {},
    fields: readFields(pdf),
  };
  if (options.native === false) return document;
  const workspace = await nativePdfWorkspace(document, source);
  // Pure field documents keep the established legacy path until a native
  // operation is accepted. Widgets belong to AcroForm, not the annotation pane.
  if (options.native !== true && workspace.snapshot().annotations.every((annotation) => annotation.native?.subtype === 'Widget')) return document;
  return withNativePdfState(document, workspace);
}

function color(value: string | undefined, fallback: string) {
  const hex = value ?? fallback;
  if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error('PDF 标注颜色须为六位十六进制色值。');
  return rgb(
    Number.parseInt(hex.slice(1, 3), 16) / 255,
    Number.parseInt(hex.slice(3, 5), 16) / 255,
    Number.parseInt(hex.slice(5, 7), 16) / 255
  );
}

function validateMark(mark: StudioPdfMark, pdf: PDFDocument, ids: Set<string>) {
  if (
    !mark ||
    typeof mark.id !== 'string' ||
    !mark.id ||
    ids.has(mark.id) ||
    !Number.isInteger(mark.page) ||
    mark.page < 0 ||
    mark.page >= pdf.getPageCount() ||
    !['text', 'highlight', 'rectangle', 'ink'].includes(mark.type) ||
    ![mark.x, mark.y, mark.size].every(Number.isFinite) ||
    mark.size < 6 ||
    mark.size > 144 ||
    typeof mark.text !== 'string' ||
    mark.text.length > 10_000
  )
    throw new Error('PDF 标注数据无效。');
  ids.add(mark.id);
  color(mark.color, mark.type === 'highlight' ? '#f5c542' : '#253044');
  const box = pageBounds(pdf.getPages()[mark.page]);
  if (mark.x < box.left || mark.y < box.bottom || mark.x > box.right || mark.y > box.top)
    throw new Error('标注位置超出 PDF 可见页面。');
  if (mark.type === 'highlight' || mark.type === 'rectangle') {
    const width = mark.width ?? 120;
    const height = mark.height ?? 18;
    const border = mark.type === 'rectangle' ? (mark.lineWidth ?? 2) / 2 : 0;
    if (
      ![width, height].every(Number.isFinite) ||
      width <= 0 ||
      height <= 0 ||
      mark.x - border < box.left - 0.01 ||
      mark.y - border < box.bottom - 0.01 ||
      mark.x + width + border > box.right + 0.01 ||
      mark.y + height + border > box.top + 0.01
    )
      throw new Error('绘图标注尺寸超出 PDF 可见页面。');
  }
  if (mark.type === 'rectangle' || mark.type === 'ink') {
    const width = mark.lineWidth ?? 2;
    if (!Number.isFinite(width) || width < 0.5 || width > 40)
      throw new Error('PDF 绘图线宽须在 0.5 至 40 点之间。');
    if (
      mark.type === 'ink' &&
      (!Array.isArray(mark.points) ||
        mark.points.length < 2 ||
        mark.points.length > 10000 ||
        mark.points.some(
          (point) =>
            !Array.isArray(point) ||
            point.length !== 2 ||
            !point.every(Number.isFinite) ||
            point[0] - width / 2 < box.left - 0.01 ||
            point[0] + width / 2 > box.right + 0.01 ||
            point[1] - width / 2 < box.bottom - 0.01 ||
            point[1] + width / 2 > box.top + 0.01
        ))
    )
      throw new Error('PDF 笔迹必须包含 2 至 10,000 个页面范围内的有效坐标。');
  }
}

async function annotationFont(pdf: PDFDocument, texts: string[]): Promise<PDFFont | undefined> {
  if (!texts.length) return undefined;
  let font: PDFFont;
  if (
    texts.some((text) =>
      [...text].some(
        (character) =>
          character !== '\n' &&
          character !== '\r' &&
          (character.codePointAt(0)! < 32 || character.codePointAt(0)! > 126)
      )
    )
  ) {
    if (!fontBytes) {
      fontBytes = fetch(`${import.meta.env.BASE_URL}office-pdf-assets/NotoSansSC.ttf`)
        .then((response) => {
          if (!response.ok) throw new Error('中文字体加载失败，请重试。');
          return response.arrayBuffer();
        })
        .catch((error) => {
          fontBytes = undefined;
          throw error;
        });
    }
    pdf.registerFontkit(fontkit);
    // The reconstructed Noto font must retain its outlines; subsetting loses glyphs.
    font = await pdf.embedFont(await fontBytes, { subset: false });
  } else {
    font = await pdf.embedFont(StandardFonts.Helvetica);
  }
  const characters = new Set(font.getCharacterSet());
  if (
    texts.some((text) =>
      [...text].some(
        (character) =>
          character !== '\n' && character !== '\r' && !characters.has(character.codePointAt(0)!)
      )
    )
  )
    throw new Error('新增文字或表单值包含当前字体未覆盖的字符，请替换后再保存。');
  return font;
}

function sameWidgets(left: StudioPdfField['widgets'], right: StudioPdfField['widgets'], flags = 0) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length || [...left, ...right].some(widget => !widget || typeof widget !== 'object')) return false;
  const key = (widget: NonNullable<StudioPdfField['widgets']>[number]) => JSON.stringify([widget.page, widget.x, widget.y, widget.width, widget.height, widget.rotation ?? 0, widget.option ?? null, widget.flags ?? flags]);
  const leftKeys = left.map(key).sort(), rightKeys = right.map(key).sort();
  return leftKeys.every((entry, index) => entry === rightKeys[index]);
}

function sameOptions(left: StudioPdfField['options'], right: StudioPdfField['options'], radio: boolean) {
  if (!radio) return JSON.stringify(left) === JSON.stringify(right);
  if (!Array.isArray(left) || !Array.isArray(right) || new Set(left).size !== left.length || new Set(right).size !== right.length || left.length !== right.length) return false;
  const values = new Set(right); return left.every(value => values.has(value));
}

function sameDesignedField(left: StudioPdfField, right: StudioPdfField, compareValues = true) {
  const radio = pdfFieldKind(right) === 'radio';
  const normalize = (field: StudioPdfField) => {
    const design = { ...field.design };
    delete design.sourceName;
    return {
      name: field.name,
      type: field.type,
      readOnly: field.readOnly,
      multiline: !!field.multiline,
      options: radio ? [...(field.options || [])].sort() : field.options || [],
      value: compareValues ? field.value : undefined,
      selectedValues: compareValues ? field.selectedValues || [] : undefined,
      design,
    };
  };
  return (
    JSON.stringify(normalize(left)) === JSON.stringify(normalize(right)) &&
    sameWidgets(left.widgets, right.widgets) &&
    sameWidgets(left.hiddenWidgets || [], right.hiddenWidgets || [], 32)
  );
}

/** Remove actual annotation refs; pdf-lib 1.17 removes AP refs and can leave dangling widgets. */
function removeNativeField(pdf: PDFDocument, name: string) {
  const form = pdf.getForm(), native = form.getField(name);
  const widgets = new Set(native.acroField.getWidgets().map((widget) => widget.dict));
  for (const page of pdf.getPages()) {
    const annotations = page.node.Annots();
    for (let index = (annotations?.size() ?? 0) - 1; index >= 0; index--) {
      const dict = annotations!.lookup(index);
      if (dict === native.acroField.dict || (dict instanceof PDFDict && widgets.has(dict))) annotations!.remove(index);
    }
  }
  form.acroForm.removeField(native.acroField);
  form.markFieldAsClean(native.ref);
  for (const ref of native.acroField.Kids()?.asArray() ?? []) {
    if (ref instanceof PDFRef) pdf.context.delete(ref);
  }
  pdf.context.delete(native.ref);
}

/** The resource alias changes without renaming the embedded font's native BaseFont. */
function formFont(pdf: PDFDocument, font: PDFFont): PDFFont {
  const form = pdf.getForm().acroForm.dict;
  const old = form.lookup(PDFName.of('DR'));
  const resources = old instanceof PDFDict ? old.clone(pdf.context) : pdf.context.obj({});
  const oldFonts = resources.lookup(PDFName.of('Font'));
  const fonts = oldFonts instanceof PDFDict ? oldFonts.clone(pdf.context) : pdf.context.obj({});
  let alias = `ZuviEdit${font.ref.objectNumber}`;
  while (fonts.has(PDFName.of(alias))) alias += '_';
  fonts.set(PDFName.of(alias), font.ref);
  resources.set(PDFName.of('Font'), fonts);
  form.set(PDFName.of('DR'), resources);
  return new Proxy(font, { get(target, name, receiver) { return name === 'name' ? alias : Reflect.get(target, name, receiver); } });
}

async function writeNativeValue(pdf: PDFDocument, field: StudioPdfField, native: PDFField, font?: PDFFont) {
  if (native instanceof PDFTextField) {
    native.setText(String(field.value));
    if (font) native.updateAppearances(font);
  } else if (native instanceof PDFCheckBox) {
    if (field.value) native.check(); else native.uncheck();
    if (native.needsAppearancesUpdate()) native.updateAppearances();
  } else if (native instanceof PDFDropdown || native instanceof PDFOptionList) {
    const selected = native instanceof PDFOptionList ? field.selectedValues || (field.value ? [String(field.value)] : []) : field.value ? [String(field.value)] : [];
    native.acroField.setValues(selected.map((value) => PDFHexString.fromText(value)));
    const label = (value: string) => field.design?.optionLabels?.[value] ?? value;
    if (font) native.updateAppearances(font, (original, widget, appearanceFont) => {
      if (original instanceof PDFDropdown) {
        const display = new Proxy(original, { get(target, key, receiver) { return key === 'getSelected' ? () => selected.map(label) : Reflect.get(target, key, receiver); } });
        return defaultDropdownAppearanceProvider(display, widget, appearanceFont);
      }
      const display = new Proxy(original, { get(target, key, receiver) {
        if (key === 'getOptions') return () => (field.options || []).map(label);
        if (key === 'getSelected') return () => selected.map(label);
        return Reflect.get(target, key, receiver);
      } });
      return defaultOptionListAppearanceProvider(display, widget, appearanceFont);
    });
  } else if (native instanceof PDFRadioGroup) {
    if (field.value) native.select(String(field.value)); else native.clear();
    if (native.needsAppearancesUpdate()) native.updateAppearances();
  } else if (native instanceof PDFButton && field.type === 'image') {
    if (field.value) {
      const match = /^data:image\/(png|jpeg);base64,([a-z\d+/]+={0,2})$/i.exec(String(field.value));
      if (!match) throw new Error('PDF 图片字段的数据无效。');
      const image = match[1].toLowerCase() === 'png' ? await pdf.embedPng(String(field.value)) : await pdf.embedJpg(String(field.value));
      native.setImage(image);
    } else if (font) native.updateAppearances(font);
    native.acroField.dict.set(IMAGE_KEY, PDFHexString.fromText(String(field.value)));
  }
}

async function writeDesignedField(pdf: PDFDocument, field: StudioPdfField, font: PDFFont) {
  const form = pdf.getForm();
  const design = field.design!;
  const kind = pdfFieldKind(field);
  const native =
    kind === 'checkbox'
      ? form.createCheckBox(field.name)
      : kind === 'radio'
        ? form.createRadioGroup(field.name)
        : kind === 'dropdown'
          ? form.createDropdown(field.name)
          : kind === 'list'
            ? form.createOptionList(field.name)
            : kind === 'image'
              ? form.createButton(field.name)
              : form.createTextField(field.name);
  if (native instanceof PDFTextField) {
    if (field.multiline) native.enableMultiline();
    if (design.maxLength !== undefined) native.setMaxLength(design.maxLength);
  }
  if (native instanceof PDFDropdown || native instanceof PDFOptionList) {
    native.setOptions(field.options || []);
    if (native instanceof PDFOptionList && design.multiSelect) native.enableMultiselect();
  }
  const borderWidth = design.borderWidth ?? 1;
  if (native instanceof PDFRadioGroup) native.disableMutualExclusion();
  for (const widget of pdfFieldWidgets(field)) {
    const page = pdf.getPages()[widget.page];
    const options = {
      x: widget.x + borderWidth / 2,
      y: widget.y + borderWidth / 2,
      width: Math.max(0.01, widget.width - borderWidth),
      height: Math.max(0.01, widget.height - borderWidth),
      borderWidth,
      textColor: color(design.textColor, '#253044'),
      backgroundColor: color(design.background, '#ffffff'),
      borderColor: color(design.borderColor, '#8898a3'),
      rotate: degrees(widget.rotation || 0),
      font,
    };
    if (native instanceof PDFRadioGroup) native.addOptionToPage(widget.option!, page, options);
    else if (native instanceof PDFButton) native.addToPage('', page, options);
    else native.addToPage(page, options);
    const created = native.acroField.getWidgets().at(-1)!;
    if (widget.flags !== undefined || field.hiddenWidgets?.includes(widget)) created.setFlags(widget.flags ?? 32);
    created.setRectangle({ x: widget.x, y: widget.y, width: widget.width, height: widget.height });
  }
  if (native instanceof PDFTextField) {
    native.setText(String(field.value));
    native.setFontSize(design.fontSize ?? 12);
    native.updateAppearances(font);
  } else if (native instanceof PDFCheckBox) {
    const exportValue = PDFName.of(design.exportValue || 'Yes');
    for (const widget of native.acroField.getWidgets()) {
      const ap = widget.dict.lookup(PDFName.of('AP'), PDFDict);
      const previous = widget.getOnValue();
      for (const key of ['N', 'D', 'R']) {
        const appearances = ap.lookup(PDFName.of(key));
        if (!(appearances instanceof PDFDict)) continue;
        if (previous && previous !== exportValue) {
          const stream = appearances.get(previous);
          if (stream) {
            appearances.delete(previous);
            appearances.set(exportValue, stream);
          }
        }
      }
    }
    if (field.value) native.check();
    else native.uncheck();
  } else if (native instanceof PDFDropdown || native instanceof PDFOptionList) {
    const selected =
      native instanceof PDFOptionList
        ? field.selectedValues || (field.value ? [String(field.value)] : [])
        : field.value
          ? [String(field.value)]
          : [];
    native.acroField.setValues(selected.map((value) => PDFHexString.fromText(value)));
    if (design.optionLabels)
      native.acroField.setOptions(
        (field.options || []).map((value) => ({
          value: PDFHexString.fromText(value),
          display: PDFHexString.fromText(design.optionLabels?.[value] ?? value),
        }))
      );
    native.setFontSize(design.fontSize ?? 12);
    const label = (value: string) => design.optionLabels?.[value] ?? value;
    native.updateAppearances(font, (nativeField, widget, appearanceFont) => {
      if (nativeField instanceof PDFDropdown) {
        const display = new Proxy(nativeField, {
          get(target, key, receiver) {
            if (key === 'getSelected') return () => selected.map(label);
            return Reflect.get(target, key, receiver);
          },
        });
        return defaultDropdownAppearanceProvider(display, widget, appearanceFont);
      }
      const display = new Proxy(nativeField, {
        get(target, key, receiver) {
          if (key === 'getOptions') return () => (field.options || []).map(label);
          if (key === 'getSelected') return () => selected.map(label);
          return Reflect.get(target, key, receiver);
        },
      });
      return defaultOptionListAppearanceProvider(display, widget, appearanceFont);
    });
  } else if (native instanceof PDFRadioGroup) {
    if (field.value) native.select(String(field.value));
    else native.clear();
    if (native.needsAppearancesUpdate()) native.updateAppearances();
  } else if (native instanceof PDFButton && field.value) {
    const match = /^data:image\/(png|jpeg);base64,([a-z\d+/]+={0,2})$/i.exec(String(field.value));
    if (!match) throw new Error('PDF 图片字段的数据无效。');
    const image =
      match[1].toLowerCase() === 'png'
        ? await pdf.embedPng(String(field.value))
        : await pdf.embedJpg(String(field.value));
    native.setImage(image);
    native.acroField.dict.set(IMAGE_KEY, PDFHexString.fromText(String(field.value)));
  }
  if (design.required) native.enableRequired();
  else native.disableRequired();
  if (field.readOnly) native.enableReadOnly();
  else native.disableReadOnly();
  if (design.tooltip)
    native.acroField.dict.set(PDFName.of('TU'), PDFHexString.fromText(design.tooltip));
  if (design.defaultSelections)
    native.acroField.dict.set(
      PDFName.of('DV'),
      pdf.context.obj(design.defaultSelections.map((value) => PDFHexString.fromText(value)))
    );
  else if (design.defaultValue !== undefined) {
    const defaultRadio =
      native instanceof PDFRadioGroup && design.defaultValue
        ? native.acroField
            .getWidgets()
            .at(field.widgets!.findIndex((widget) => widget.option === design.defaultValue))
            ?.getOnValue()
        : undefined;
    native.acroField.dict.set(
      PDFName.of('DV'),
      kind === 'checkbox'
        ? PDFName.of(design.defaultValue ? design.exportValue || 'Yes' : 'Off')
        : kind === 'radio'
          ? defaultRadio || PDFName.of('Off')
          : PDFHexString.fromText(String(design.defaultValue))
    );
  }
  const savedDesign = { ...design };
  delete savedDesign.sourceName;
  native.acroField.dict.set(DESIGN_KEY, PDFHexString.fromText(JSON.stringify(savedDesign)));
}

/** Apply changes to the original PDF's page streams and original AcroForm. */
export async function exportStudioPdfFields(
  document: StudioPdfDocument, source: Blob,
  options: { nativeBindings?: readonly PdfWorkspaceSourceBinding[] } = {},
): Promise<Blob> {
  const pdf = await loadSource(source);
  const signed = hasNativePdfSignature(pdf);
  if (options.nativeBindings && !signed) {
    bindWorkspacePdfIdentities(pdf, readInventory(pdf, new Uint8Array(await source.arrayBuffer())), options.nativeBindings);
  }
  isolatePdfPageBuffers(pdf);
  const layoutChanged = applyPdfPageLayout(pdf, document);
  const originalFields = readFields(pdf);
  if (
    document.version !== 1 ||
    document.kind !== 'pdf' ||
    document.pageCount !== pdf.getPageCount() ||
    !Array.isArray(document.marks) ||
    document.marks.length > 2000 ||
    !Array.isArray(document.fields) ||
    document.fields.length > 2000 ||
    !document.rotations ||
    typeof document.rotations !== 'object' ||
    Array.isArray(document.rotations)
  )
    throw new Error('PDF 草稿与原文件不匹配。');

  const ids = new Set<string>();
  document.marks.forEach((mark) => validateMark(mark, pdf, ids));
  if (document.marks.reduce((total, mark) => total + (mark.points?.length ?? 0), 0) > 100_000)
    throw new Error('PDF 笔迹点数过多，当前最多支持 100,000 个坐标。');
  const rotations = Object.entries(document.rotations).map(([key, angle]) => {
    const page = Number(key);
    if (
      !Number.isInteger(page) ||
      String(page) !== key ||
      page < 0 ||
      page >= pdf.getPageCount() ||
      !Number.isFinite(angle) ||
      angle % 90 !== 0
    )
      throw new Error('PDF 草稿包含无效的页面旋转。');
    return { page, angle: quarterTurn(angle) };
  });

  const changedFields: StudioPdfField[] = [];
  const designedFields: StudioPdfField[] = [];
  const fieldNames = new Set<string>();
  const handledSources = new Set<string>();
  const removed = document.removedFields || [];
  if (
    !Array.isArray(removed) ||
    new Set(removed).size !== removed.length ||
    removed.some((name) => !originalFields.some((field) => field.name === name))
  )
    throw new Error('PDF 删除字段记录与原文件不匹配。');
  if (removed.some((name) => originalFields.some((field) => field.name === name && field.type === 'opaque')))
    throw new Error('PDF 只读原生字段不能单独删除。');
  for (const name of removed) handledSources.add(name);
  for (const field of document.fields) {
    if (fieldNames.has(field.name)) throw new Error('PDF 草稿包含重复字段名称。');
    const passiveSource = originalFields.find((entry) => entry.name === field.name);
    if (field.type === 'opaque' || passiveSource?.type === 'opaque') {
      if (!passiveSource || passiveSource.type !== 'opaque' || field.type !== 'opaque' ||
        pdfFieldIssue(field, pdf.getPageCount()) || field.nativeType !== passiveSource.nativeType ||
        field.nativeValueHash !== passiveSource.nativeValueHash || field.passiveReason !== passiveSource.passiveReason ||
        !sameWidgets(field.widgets ?? [], passiveSource.widgets ?? []) ||
        !sameWidgets(field.hiddenWidgets ?? [], passiveSource.hiddenWidgets ?? [], 32))
        throw new Error('PDF 只读原生字段的身份、值或控件结构不能修改。');
      fieldNames.add(field.name);
      handledSources.add(field.name);
      continue;
    }
    if (field.design) {
      const issue = !field.widgets?.length && originalFields.some(entry => entry.name === (field.design?.sourceName ?? field.name) && !entry.widgets?.length && sameDesignedField(field, entry, false)) ? undefined : pdfFieldIssue(field, pdf.getPageCount());
      if (issue) throw new Error(issue);
      const sourceName = field.design.sourceName;
      const original = sourceName
        ? originalFields.find((entry) => entry.name === sourceName)
        : originalFields.find(
            (entry) => entry.name === field.name && entry.design && !removed.includes(entry.name)
          );
      if (sourceName && !original) throw new Error('PDF 设计字段的来源不存在。');
      if (original?.type === 'opaque') throw new Error('PDF 只读原生字段不能替换设计。');
      if (original) {
        if (handledSources.has(original.name))
          throw new Error('PDF 同一来源字段被重复编辑或删除。');
        handledSources.add(original.name);
      } else if (
        originalFields.some((entry) => entry.name === field.name && !removed.includes(entry.name))
      )
        throw new Error('新增 PDF 字段与原字段重名。');
      for (const widget of field.widgets || []) {
        const bounds = pageBounds(pdf.getPages()[widget.page]);
        if (
          widget.x < bounds.left - 0.01 ||
          widget.y < bounds.bottom - 0.01 ||
          widget.x + widget.width > bounds.right + 0.01 ||
          widget.y + widget.height > bounds.top + 0.01 ||
          widget.width <= (field.design.borderWidth ?? 1) ||
          widget.height <= (field.design.borderWidth ?? 1)
        )
          throw new Error('PDF 字段控件超出可见页面或尺寸过小。');
      }
      if (!original || !sameDesignedField(field, original, false)) designedFields.push(field);
      else if (!sameDesignedField(field, original)) {
        if (original.readOnly) throw new Error(`表单“${field.name}”为只读，不能修改。`);
        changedFields.push(field);
      }
      fieldNames.add(field.name);
      continue;
    }
    const original = originalFields.find((entry) => entry.name === field.name);
    if (
      !original ||
      fieldNames.has(field.name) ||
      field.type !== original.type ||
      field.readOnly !== original.readOnly ||
      !sameOptions(field.options, original.options, pdf.getForm().getField(original.name) instanceof PDFRadioGroup) ||
      (field.multiline !== undefined && field.multiline !== original.multiline) ||
      (field.widgets !== undefined && !sameWidgets(field.widgets, original.widgets)) ||
      (field.hiddenWidgets !== undefined && !sameWidgets(field.hiddenWidgets, original.hiddenWidgets || [], 32)) ||
      typeof field.value !== typeof original.value ||
      (typeof field.value === 'string' && field.value.length > 10_000)
    )
      throw new Error('PDF 草稿的表单结构或字段值与原文件不匹配。');
    fieldNames.add(field.name);
    handledSources.add(field.name);
    if (field.value !== original.value) {
      if (original.readOnly) throw new Error(`表单“${field.name}”为只读，不能修改。`);
      if (
        field.type === 'choice' &&
        field.value !== '' &&
        !original.options?.includes(String(field.value))
      )
        throw new Error(`表单“${field.name}”的选项无效。`);
      const native = pdf.getForm().getField(field.name);
      if (
        native instanceof PDFTextField &&
        native.getMaxLength() !== undefined &&
        String(field.value).length > native.getMaxLength()!
      )
        throw new Error(`表单“${field.name}”超过原字段允许的文字长度。`);
      changedFields.push(field);
    }
  }
  if (originalFields.some((field) => !handledSources.has(field.name)))
    throw new Error('PDF 原有字段缺失，请通过表单设计操作删除。');

  if (
    !layoutChanged &&
    !document.marks.length &&
    !rotations.some((entry) => entry.angle) &&
    !changedFields.length &&
    !designedFields.length &&
    !removed.length
  )
    return source;
  if (signed) throw new Error('此 PDF 已含数字签名，修改会使签名失效，请使用未签名的副本。');
  const form = pdf.getForm();
  const texts = [
    ...document.marks.filter((mark) => mark.type === 'text' && mark.text).map((mark) => mark.text),
    ...changedFields
      .flatMap((field) => {
        const native = form.getField(field.name);
        if (native instanceof PDFTextField) return [String(field.value)];
        if (native instanceof PDFDropdown || native instanceof PDFOptionList)
          return (field.options || []).map((value) => field.design?.optionLabels?.[value] ?? value);
        return [];
      }),
    ...designedFields.flatMap((field) => [
      field.type === 'image' ? '' : String(field.value),
      ...(field.options || []).map((value) => field.design?.optionLabels?.[value] ?? value),
    ]),
  ];
  const needsFieldFont = designedFields.length > 0 || changedFields.some((field) =>
    field.type === 'text' || field.type === 'choice' || field.type === 'image');
  const embedded = await annotationFont(pdf, needsFieldFont ? [...texts, ' '] : texts);
  const font = embedded && needsFieldFont ? formFont(pdf, embedded) : embedded;
  for (const name of removed) removeNativeField(pdf, name);
  for (const field of designedFields) {
    const sourceName =
      field.design?.sourceName ||
      (originalFields.some(
        (entry) => entry.name === field.name && entry.design && !removed.includes(entry.name)
      )
        ? field.name
        : undefined);
    if (sourceName) removeNativeField(pdf, sourceName);
  }
  if (designedFields.length) {
    const fieldFont = font || (await pdf.embedFont(StandardFonts.Helvetica));
    for (const field of designedFields) await writeDesignedField(pdf, field, fieldFont);
  }
  for (const entry of rotations) {
    const page = pdf.getPages()[entry.page];
    page.setRotation(degrees(quarterTurn(page.getRotation().angle + entry.angle)));
  }
  for (const mark of document.marks) {
    const page = pdf.getPages()[mark.page];
    if (mark.type === 'highlight') {
      page.drawRectangle({
        x: mark.x,
        y: mark.y,
        width: mark.width ?? 120,
        height: mark.height ?? 18,
        color: color(mark.color, '#f5c542'),
        opacity: 0.3,
      });
    } else if (mark.type === 'rectangle') {
      page.drawRectangle({
        x: mark.x,
        y: mark.y,
        width: mark.width ?? 120,
        height: mark.height ?? 18,
        borderColor: color(mark.color, '#253044'),
        borderWidth: mark.lineWidth ?? 2,
      });
    } else if (mark.type === 'ink') {
      const points = mark.points!;
      const ink = color(mark.color, '#253044');
      page.pushOperators(
        pushGraphicsState(),
        setLineWidth(mark.lineWidth ?? 2),
        setLineCap(LineCapStyle.Round),
        setLineJoin(LineJoinStyle.Round),
        setStrokingRgbColor(ink.red, ink.green, ink.blue),
        moveTo(points[0][0], points[0][1]),
        ...points.slice(1).map(([x, y]) => lineTo(x, y)),
        stroke(),
        popGraphicsState()
      );
    } else if (mark.text && font) {
      const text = mark.text.replace(/\r\n?/g, '\n');
      const box = pageBounds(page);
      const lines = text.split('\n');
      const ascent = font.heightAtSize(mark.size, { descender: false });
      const descent = font.heightAtSize(mark.size) - ascent;
      if (
        lines.some((line) => font.widthOfTextAtSize(line, mark.size) > box.right - mark.x + 0.01) ||
        mark.y + ascent > box.top + 0.01 ||
        mark.y - (lines.length - 1) * mark.size * 1.35 - descent < box.bottom - 0.01
      )
        throw new Error('文字标注超出 PDF 可见页面，请移动位置、缩小字号或换行后保存。');
      page.drawText(text, {
        x: mark.x,
        y: mark.y,
        font,
        size: mark.size,
        color: color(mark.color, '#253044'),
        lineHeight: mark.size * 1.35,
      });
    }
  }

  for (const field of changedFields) await writeNativeValue(pdf, field, form.getField(field.name), font);
  return new Blob([new Uint8Array(await pdf.save({ updateFieldAppearances: false }))], {
    type: 'application/pdf',
  });
}

/** Native recipes are replayed before field/rotation changes; compatibility projections never paint twice. */
export async function exportStudioPdf(document: StudioPdfDocument, source: Blob): Promise<Blob> {
  if (!document.nativeAnnotations && !document.marks.some((mark) => mark.nativeId !== undefined)) {
    return exportStudioPdfFields(document, source);
  }
  const workspace = await nativePdfWorkspace(document, source);
  const snapshot = workspace.snapshot();
  validateNativePdfProjections(document, snapshot);
  const legacy = document.marks.filter((mark) => mark.nativeId === undefined);
  if (!workspace.serialize().commands.length) {
    return exportStudioPdfFields({ ...document, marks: legacy }, source, { nativeBindings: workspace.serialize().bindings });
  }
  const bytes = await workspace.export();
  const currentSource = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
  const binding = workspace.previewBinding();
  return exportStudioPdfFields({
    ...document, marks: legacy, pageCount: binding.pageCount, sourcePageCount: binding.sourcePageCount,
    pages: [...binding.pages],
  }, currentSource);
}
