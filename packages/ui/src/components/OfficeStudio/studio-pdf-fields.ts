import type { StudioPdfDocument, StudioPdfField, StudioPdfFieldDesign } from './studio-types';

export const PDF_FIELD_KINDS = [
  'text',
  'date',
  'image',
  'checkbox',
  'radio',
  'dropdown',
  'list',
] as const;
export const PDF_FIELD_KIND_NAMES: Record<StudioPdfFieldDesign['kind'], string> = {
  text: '文本',
  date: '日期',
  image: '图片',
  checkbox: '复选框',
  radio: '单选组',
  dropdown: '下拉框',
  list: '列表框',
};
const plain = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const finite = (value: unknown, min: number, max: number) =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const text = (value: unknown, max: number) =>
  typeof value === 'string' &&
  value.length <= max &&
  !Array.from(value).some((char) => {
    const point = char.codePointAt(0)!;
    return (
      (point < 32 && ![9, 10, 13].includes(point)) ||
      (point >= 0xd800 && point <= 0xdfff) ||
      point === 0xfffe ||
      point === 0xffff
    );
  });

export function pdfFieldWidgets(field: StudioPdfField): NonNullable<StudioPdfField['widgets']> {
  return [...(Array.isArray(field.widgets) ? field.widgets : []), ...(Array.isArray(field.hiddenWidgets) ? field.hiddenWidgets : [])];
}

export function pdfFieldKind(field: StudioPdfField): StudioPdfFieldDesign['kind'] {
  return (
    field.design?.kind ||
    (field.type === 'checkbox'
      ? 'checkbox'
      : field.type === 'image'
        ? 'image'
        : field.type === 'text'
          ? 'text'
          : pdfFieldWidgets(field).some((widget) => plain(widget) && widget.option !== undefined)
            ? 'radio'
            : 'dropdown')
  );
}

export function pdfFieldDesign(field: StudioPdfField): StudioPdfFieldDesign {
  if (field.type === 'opaque') throw new Error('此原生字段以只读方式保留，不能修改设计。');
  return (
    field.design || {
      kind: pdfFieldKind(field),
      sourceName: field.name,
      fontSize: 12,
      textColor: '#253044',
      background: '#ffffff',
      borderColor: '#8898a3',
      borderWidth: 1,
    }
  );
}

export function pdfFieldIssue(field: StudioPdfField, pageCount: number): string | undefined {
  if (
    !plain(field) ||
    !text(field.name, 256) ||
    !field.name.trim() ||
    /[\r\n]/.test(field.name) ||
    field.name.split('.').some((part) => !part.trim()) ||
    typeof field.readOnly !== 'boolean'
  )
    return 'PDF 字段名称或只读属性无效。';
  if (field.type === 'opaque') {
    if (field.readOnly !== true || field.value !== '' || field.design !== undefined ||
      field.options !== undefined || field.multiline !== undefined || field.selectedValues !== undefined ||
      !text(field.nativeType, 256) || !field.nativeType || !text(field.passiveReason, 1000) || !field.passiveReason ||
      !/^[a-f0-9]{64}$/.test(field.nativeValueHash ?? '')) return 'PDF 只读原生字段身份无效。';
    for (const widget of pdfFieldWidgets(field)) {
      const hidden = field.hiddenWidgets?.includes(widget);
      if (!plain(widget) || !Number.isInteger(widget.page) || !finite(widget.page, 0, pageCount - 1) ||
        !finite(widget.x, -100000, 100000) || !finite(widget.y, -100000, 100000) ||
        !finite(widget.width, hidden ? 0 : Number.MIN_VALUE, 100000) || !finite(widget.height, hidden ? 0 : Number.MIN_VALUE, 100000) ||
        !Number.isInteger(widget.flags) || !finite(widget.flags, 0, 4294967295) ||
        (!!(widget.flags! & (1 | 2 | 32)) || widget.width === 0 || widget.height === 0) !== !!hidden ||
        (widget.rotation !== undefined && (!finite(widget.rotation, -360000, 360000) || widget.rotation % 90 !== 0)))
        return 'PDF 原生控件身份或位置无效。';
    }
    return;
  }
  const kind = pdfFieldKind(field);
  const design = field.design;
  if (design !== undefined && (!plain(design) || !PDF_FIELD_KINDS.includes(design.kind)))
    return 'PDF 字段设计类型无效。';
  if (
    !['text', 'checkbox', 'choice', 'image'].includes(field.type) ||
    (['text', 'date'].includes(kind) && field.type !== 'text') ||
    (['radio', 'dropdown', 'list'].includes(kind) && field.type !== 'choice') ||
    (kind === 'checkbox' && field.type !== 'checkbox') ||
    (kind === 'image' && field.type !== 'image')
  )
    return 'PDF 字段类型与设计不匹配。';
  if (
    field.type === 'checkbox'
      ? typeof field.value !== 'boolean'
      : !text(field.value, kind === 'image' ? 12 * 1024 * 1024 : 10000)
  )
    return 'PDF 字段值无效或超出长度限制。';
  if (design) {
    if (design.sourceName !== undefined && (!text(design.sourceName, 256) || !design.sourceName))
      return 'PDF 来源字段名称无效。';
    if (
      ['required', 'multiSelect'].some(
        (key) =>
          design[key as 'required'] !== undefined && typeof design[key as 'required'] !== 'boolean'
      )
    )
      return 'PDF 字段属性无效。';
    if (design.tooltip !== undefined && !text(design.tooltip, 1000)) return 'PDF 字段提示无效。';
    if (
      design.maxLength !== undefined &&
      (!finite(design.maxLength, 1, 10000) ||
        !Number.isInteger(design.maxLength) ||
        field.type !== 'text')
    )
      return 'PDF 字符上限须为 1–10000 的整数。';
    if (design.fontSize !== undefined && !finite(design.fontSize, 4, 144))
      return 'PDF 字段字号须为 4–144 点。';
    if (design.borderWidth !== undefined && !finite(design.borderWidth, 0, 12))
      return 'PDF 字段边框宽度须为 0–12 点。';
    for (const key of ['textColor', 'background', 'borderColor'] as const)
      if (design[key] !== undefined && !/^#[\da-f]{6}$/i.test(design[key]!))
        return 'PDF 字段颜色须为六位十六进制。';
    if (design.multiSelect && kind !== 'list') return '只有列表框支持多选。';
    if (
      design.exportValue !== undefined &&
      (!text(design.exportValue, 256) || !design.exportValue || design.exportValue === 'Off')
    )
      return '复选导出值无效。';
    if (
      design.optionLabels !== undefined &&
      (!plain(design.optionLabels) ||
        Object.entries(design.optionLabels).some(
          ([key, label]) => !field.options?.includes(key) || !text(label, 1000)
        ))
    )
      return 'PDF 选项显示名称无效。';
  }
  if (typeof field.value === 'string' && field.type === 'text') {
    if (field.value.length > (design?.maxLength ?? 10000)) return 'PDF 字段超过允许的文字长度。';
    if (!field.multiline && /[\r\n]/.test(field.value)) return '单行字段不能包含换行。';
    if (kind === 'date' && field.value && !pdfFieldDateValid(field.value))
      return '日期字段需要有效的 YYYY-MM-DD 日期。';
  }
  if (
    field.type === 'image' &&
    field.value &&
    !/^data:image\/(png|jpeg);base64,[a-z\d+/]+={0,2}$/i.test(String(field.value))
  )
    return '图片字段仅支持嵌入 PNG/JPEG。';
  if (field.type === 'choice') {
    if (
      !Array.isArray(field.options) ||
      field.options.length > 1000 ||
      field.options.some((option) => !text(option, 1000) || !option) ||
      new Set(field.options).size !== field.options.length
    )
      return 'PDF 字段选项必须唯一，且不超过 1000 项。';
    if (field.value && !field.options.includes(String(field.value)))
      return 'PDF 字段当前选项不在候选列表中。';
  }
  for (const values of [field.selectedValues, design?.defaultSelections])
    if (
      values !== undefined &&
      (!Array.isArray(values) ||
        values.length > 1000 ||
        new Set(values).size !== values.length ||
        values.some((value) => !field.options?.includes(value)) ||
        (!design?.multiSelect && values.length > 1))
    )
      return 'PDF 列表选中值无效。';
  if (design?.defaultValue !== undefined) {
    if (
      field.type === 'checkbox'
        ? typeof design.defaultValue !== 'boolean'
        : !text(design.defaultValue, 10000)
    )
      return 'PDF 字段默认值无效。';
    if (
      field.type === 'text' &&
      (String(design.defaultValue).length > (design.maxLength ?? 10000) ||
        (!field.multiline && /[\r\n]/.test(String(design.defaultValue))))
    )
      return 'PDF 默认文字超过字符上限或包含不允许的换行。';
    if (
      field.type === 'choice' &&
      design.defaultValue &&
      !field.options?.includes(String(design.defaultValue))
    )
      return 'PDF 默认选项无效。';
    if (kind === 'date' && design.defaultValue && !pdfFieldDateValid(String(design.defaultValue)))
      return 'PDF 默认日期无效。';
  }
  const widgets = pdfFieldWidgets(field);
  if (
    !Array.isArray(field.widgets) ||
    (field.hiddenWidgets !== undefined && !Array.isArray(field.hiddenWidgets)) ||
    widgets.length > 2000 ||
    (design && !widgets.length)
  )
    return 'PDF 设计字段至少需要一个控件。';
  if (
    kind === 'radio' &&
    field.options?.some((option) => !widgets.some((widget) => plain(widget) && widget.option === option))
  )
    return '单选组的每个选项都需要对应控件。';
  for (const widget of widgets) {
    if (!plain(widget)) return 'PDF 控件页面、位置或尺寸无效。';
    const hidden = field.hiddenWidgets?.includes(widget);
    if (widget.flags !== undefined && ((!!(widget.flags & (1 | 2 | 32)) || widget.width === 0 || widget.height === 0) !== !!hidden)) return 'PDF 控件的可见性属性无效。';
    if (
      !plain(widget) ||
      !Number.isInteger(widget.page) ||
      !finite(widget.page, 0, pageCount - 1) ||
      !finite(widget.x, -100000, 100000) ||
      !finite(widget.y, -100000, 100000) ||
      !finite(widget.width, hidden ? 0 : 1, 100000) ||
      !finite(widget.height, hidden ? 0 : 1, 100000) ||
      (widget.flags !== undefined && (!finite(widget.flags, 0, 4294967295) || !Number.isInteger(widget.flags))) ||
      (widget.rotation !== undefined &&
        (!finite(widget.rotation, -360000, 360000) || widget.rotation % 90 !== 0))
    )
      return 'PDF 控件页面、位置或尺寸无效。';
    if (kind === 'radio' && (!widget.option || !field.options?.includes(widget.option)))
      return 'PDF 单选控件需要有效的导出选项。';
  }
}

export function pdfFieldDateValid(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function pdfSetDesignedField(
  document: StudioPdfDocument,
  field: StudioPdfField,
  previousName?: string
): StudioPdfDocument {
  const issue = pdfFieldIssue(field, document.pageCount);
  if (issue) throw new Error(issue);
  if (!field.design) throw new Error('字段缺少设计属性。');
  if (
    document.fields.some(
      (entry) =>
        entry.name !== previousName &&
        (entry.name === field.name ||
          entry.name.startsWith(`${field.name}.`) ||
          field.name.startsWith(`${entry.name}.`))
    )
  )
    throw new Error('PDF 字段名称已存在。重复控件请添加到同一字段。');
  if (previousName && !document.fields.some((entry) => entry.name === previousName))
    throw new Error('PDF 字段不存在，请重新打开设计窗口。');
  if (previousName && document.fields.some((entry) => entry.name === previousName && entry.type === 'opaque'))
    throw new Error('此原生字段以只读方式保留，不能修改设计。');
  if (!previousName && document.fields.length >= 2000)
    throw new Error('PDF 字段数量已达到 2000 项上限。');
  const fields = previousName
    ? document.fields.map((entry) => (entry.name === previousName ? field : entry))
    : [...document.fields, field];
  return { ...document, fields };
}

export function pdfRemoveDesignedField(
  document: StudioPdfDocument,
  name: string
): StudioPdfDocument {
  const field = document.fields.find((entry) => entry.name === name);
  if (!field) throw new Error('PDF 字段不存在。');
  if (field.type === 'opaque') throw new Error('此原生字段以只读方式保留，不能单独删除。');
  const source = field.design ? field.design.sourceName : field.name;
  return {
    ...document,
    fields: document.fields.filter((entry) => entry !== field),
    removedFields: [...new Set([...(document.removedFields || []), ...(source ? [source] : [])])],
  };
}
