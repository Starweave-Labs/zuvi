import * as React from 'react';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { Input } from '../Input';
import { Modal } from '../Modal';
import { Select } from '../Select';
import type { StudioPdfDocument, StudioPdfField, StudioPdfFieldDesign } from './studio-types';
import {
  PDF_FIELD_KINDS,
  PDF_FIELD_KIND_NAMES,
  pdfFieldDesign,
  pdfFieldIssue,
  pdfSetDesignedField,
} from './studio-pdf-fields';

export function StudioPdfFieldDialog({
  field,
  document,
  page,
  bounds,
  getPageBounds,
  onClose,
  onSave,
  onDelete,
}: {
  field?: StudioPdfField;
  document: StudioPdfDocument;
  page: number;
  bounds: { left: number; bottom: number; right: number; top: number };
  getPageBounds?(page: number): Promise<typeof bounds>;
  onClose(): void;
  onSave(field: StudioPdfField): void;
  onDelete?(name: string): void;
}) {
  const defaults = field
    ? pdfFieldDesign(field)
    : {
        kind: 'text' as const,
        fontSize: 12,
        background: '#ffffff',
        textColor: '#253044',
        borderColor: '#8898a3',
        borderWidth: 1,
      };
  const [name, setName] = React.useState(field?.name || `field_${document.fields.length + 1}`);
  const [kind, setKind] = React.useState(defaults.kind);
  const [readOnly, setReadOnly] = React.useState(field?.readOnly || false);
  const [required, setRequired] = React.useState(defaults.required || false);
  const [multiline, setMultiline] = React.useState(field?.multiline || false);
  const [multiSelect, setMultiSelect] = React.useState(defaults.multiSelect || false);
  const [tooltip, setTooltip] = React.useState(defaults.tooltip || '');
  const [maxLength, setMaxLength] = React.useState(String(defaults.maxLength || ''));
  const [options, setOptions] = React.useState(
    (field?.options || ['A', 'B'])
      .map(
        (value) =>
          `${value}${defaults.optionLabels?.[value] && defaults.optionLabels[value] !== value ? `|${defaults.optionLabels[value]}` : ''}`
      )
      .join('\n')
  );
  const [value, setValue] = React.useState(
    field?.design?.kind === 'list'
      ? (field.selectedValues || []).join('\n')
      : String(field?.value ?? '')
  );
  const [checked, setChecked] = React.useState(Boolean(field?.value));
  const [initialValue, setInitialValue] = React.useState(
    defaults.kind === 'list'
      ? (defaults.defaultSelections || []).join('\n')
      : String(defaults.defaultValue ?? '')
  );
  const [exportValue, setExportValue] = React.useState(defaults.exportValue || 'Yes');
  const [fontSize, setFontSize] = React.useState(String(defaults.fontSize ?? 12));
  const [borderWidth, setBorderWidth] = React.useState(String(defaults.borderWidth ?? 1));
  const [colors, setColors] = React.useState({
    textColor: defaults.textColor || '#253044',
    background: defaults.background || '#ffffff',
    borderColor: defaults.borderColor || '#8898a3',
  });
  const [widgets, setWidgets] = React.useState<NonNullable<StudioPdfField['widgets']>>(() =>
    field?.widgets?.length
      ? field.widgets.map((widget) => ({ ...widget }))
      : [
          {
            page,
            x: bounds.left + 12,
            y: bounds.top - 50,
            width: Math.min(160, bounds.right - bounds.left - 24),
            height: 26,
          },
        ]
  );
  const [error, setError] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [imageLoading, setImageLoading] = React.useState(false);
  const active = React.useRef(true);
  const imageRequest = React.useRef(0);
  React.useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const [widgetDrafts, setWidgetDrafts] = React.useState<Record<string, string>>({});
  const choice = ['radio', 'dropdown', 'list'].includes(kind);
  const changeWidget = (
    index: number,
    key: 'page' | 'x' | 'y' | 'width' | 'height' | 'rotation',
    input: string
  ) => setWidgetDrafts((current) => ({ ...current, [`${index}:${key}`]: input }));
  const save = async () => {
    if (saving || imageLoading) return;
    setSaving(true);
    try {
      const lines = options.split(/\r?\n/).filter((line) => line.trim());
      const entries = lines.map((line) => {
        const index = line.indexOf('|');
        return index < 0
          ? [line.trim(), line.trim()]
          : [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      });
      const optionValues = entries.map(([stored]) => stored);
      const optionLabels = Object.fromEntries(
        entries.filter(([stored, label]) => stored !== label)
      );
      const fieldWidgets = widgets.map((widget, index) => {
        const result = { ...widget };
        for (const key of ['page', 'x', 'y', 'width', 'height', 'rotation'] as const) {
          const raw = widgetDrafts[`${index}:${key}`];
          if (raw !== undefined) {
            if (!raw.trim() || !Number.isFinite(Number(raw)))
              throw new Error('控件位置或尺寸必须为有效数字。');
            result[key] = key === 'page' ? Number(raw) - 1 : Number(raw);
          }
        }
        if (kind === 'radio')
          result.option = result.option || optionValues[index] || optionValues[0];
        else delete result.option;
        if (
          result.page === page &&
          (result.x < bounds.left ||
            result.y < bounds.bottom ||
            result.x + result.width > bounds.right ||
            result.y + result.height > bounds.top)
        )
          throw new Error('控件超出当前页面可见范围。');
        return result;
      });
      const design: StudioPdfFieldDesign = {
        ...defaults,
        kind,
        required,
        tooltip,
        fontSize: Number(fontSize),
        borderWidth: Number(borderWidth),
        ...colors,
        ...(choice ? { optionLabels } : { optionLabels: undefined }),
        ...(kind === 'checkbox'
          ? { exportValue, defaultValue: initialValue === 'true' }
          : { exportValue: undefined, defaultValue: initialValue }),
        ...(kind === 'list'
          ? {
              multiSelect,
              defaultSelections: initialValue.split(/\r?\n/).filter(Boolean),
              defaultValue: undefined,
            }
          : { multiSelect: undefined, defaultSelections: undefined }),
        ...(['text', 'date'].includes(kind) && maxLength
          ? { maxLength: Number(maxLength) }
          : { maxLength: undefined }),
      };
      const selectedValues = kind === 'list' ? value.split(/\r?\n/).filter(Boolean) : undefined;
      const result: StudioPdfField = {
        name: name.trim(),
        type:
          kind === 'checkbox'
            ? 'checkbox'
            : kind === 'image'
              ? 'image'
              : choice
                ? 'choice'
                : 'text',
        readOnly,
        value: kind === 'checkbox' ? checked : kind === 'list' ? selectedValues?.[0] || '' : value,
        ...(selectedValues ? { selectedValues } : {}),
        ...(choice ? { options: optionValues } : {}),
        ...(['text', 'date'].includes(kind) ? { multiline: kind === 'text' && multiline } : {}),
        widgets: fieldWidgets,
        design,
      };
      const issue = pdfFieldIssue(result, document.pageCount);
      if (issue) throw new Error(issue);
      pdfSetDesignedField(document, result, field?.name);
      const pages = new Set(fieldWidgets.map((widget) => widget.page));
      const pageBounds = new Map([[page, bounds]]);
      for (const index of pages) {
        if (index !== page && getPageBounds) pageBounds.set(index, await getPageBounds(index));
      }
      for (const widget of fieldWidgets) {
        const box = pageBounds.get(widget.page);
        if (
          box &&
          (widget.x < box.left ||
            widget.y < box.bottom ||
            widget.x + widget.width > box.right ||
            widget.y + widget.height > box.top)
        )
          throw new Error(`控件超出第 ${widget.page + 1} 页可见范围。`);
        if (widget.width <= design.borderWidth! || widget.height <= design.borderWidth!)
          throw new Error('控件尺寸必须大于边框宽度。');
      }
      if (!active.current) return;
      onSave(result);
    } catch (cause) {
      if (active.current) setError(cause instanceof Error ? cause.message : '字段无法保存。');
    } finally {
      if (active.current) setSaving(false);
    }
  };
  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <Modal.Content size="lg" className="zuvi-studio-pdf-field-dialog">
        <Modal.Header>
          <Modal.Title>{field ? '编辑 PDF 字段' : '新建 PDF 字段'}</Modal.Title>
          <Modal.Close />
        </Modal.Header>
        <Modal.Body>
          <div className="zuvi-studio-pdf-field-form">
            <label>
              字段名称
              <Input
                aria-label="PDF 字段名称"
                value={name}
                maxLength={256}
                autoFocus
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <label>
              字段类型
              <Select
                aria-label="PDF 字段类型"
                value={kind}
                options={PDF_FIELD_KINDS.map((value) => ({
                  value,
                  label: PDF_FIELD_KIND_NAMES[value],
                }))}
                onChange={(value) => {
                  setImageLoading(false);
                  setKind(value as StudioPdfFieldDesign['kind']);
                  setValue('');
                  setInitialValue('');
                  setChecked(false);
                }}
              />
            </label>
            <label>
              提示
              <Input
                aria-label="PDF 字段提示"
                value={tooltip}
                maxLength={1000}
                onChange={(event) => setTooltip(event.target.value)}
              />
            </label>
            {['text', 'date'].includes(kind) && (
              <label>
                字符上限
                <Input
                  type="number"
                  aria-label="PDF 字符上限"
                  min={1}
                  max={10000}
                  value={maxLength}
                  onChange={(event) => setMaxLength(event.target.value)}
                />
              </label>
            )}
            <label>
              字号（pt）
              <Input
                type="number"
                aria-label="PDF 字段字号"
                min={4}
                max={144}
                value={fontSize}
                onChange={(event) => setFontSize(event.target.value)}
              />
            </label>
            <label>
              边框宽度（pt）
              <Input
                type="number"
                aria-label="PDF 字段边框宽度"
                min={0}
                max={12}
                step="0.5"
                value={borderWidth}
                onChange={(event) => setBorderWidth(event.target.value)}
              />
            </label>
            {(['textColor', 'background', 'borderColor'] as const).map((key, index) => (
              <label key={key}>
                {['文字颜色', '背景颜色', '边框颜色'][index]}
                <Input
                  aria-label={`PDF 字段${['文字颜色', '背景颜色', '边框颜色'][index]}`}
                  value={colors[key]}
                  onChange={(event) =>
                    setColors((current) => ({ ...current, [key]: event.target.value }))
                  }
                />
              </label>
            ))}
          </div>
          <div className="zuvi-studio-pdf-field-flags">
            <Checkbox label="必填字段" checked={required} onChange={setRequired} />
            <Checkbox label="只读字段" checked={readOnly} onChange={setReadOnly} />
            {kind === 'text' && (
              <Checkbox label="多行文本" checked={multiline} onChange={setMultiline} />
            )}
            {kind === 'list' && (
              <Checkbox label="允许多选" checked={multiSelect} onChange={setMultiSelect} />
            )}
          </div>
          {choice && (
            <label>
              选项：每行一个导出值，可用“导出值|显示文字”
              <Input.Textarea
                aria-label="PDF 字段选项"
                value={options}
                rows={4}
                onChange={(event) => setOptions(event.target.value)}
              />
            </label>
          )}
          {kind === 'checkbox' ? (
            <>
              <Checkbox label="当前勾选" checked={checked} onChange={setChecked} />
              <label>
                导出值
                <Input
                  aria-label="PDF 复选导出值"
                  value={exportValue}
                  onChange={(event) => setExportValue(event.target.value)}
                />
              </label>
              <Checkbox
                label="默认勾选"
                checked={initialValue === 'true'}
                onChange={(checked) => setInitialValue(String(checked))}
              />
            </>
          ) : kind === 'image' ? (
            <label>
              字段图片
              <input
                type="file"
                accept="image/png,image/jpeg"
                aria-label="PDF 字段图片"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  if (!/^image\/(png|jpeg)$/.test(file.type) || file.size > 8 * 1024 * 1024) {
                    setError('图片仅支持 PNG/JPEG，最大 8 MiB。');
                    return;
                  }
                  const request = ++imageRequest.current;
                  setImageLoading(true);
                  const reader = new FileReader();
                  reader.onload = () => {
                    if (!active.current || request !== imageRequest.current) return;
                    setValue(String(reader.result));
                    setImageLoading(false);
                  };
                  reader.onerror = () => {
                    if (!active.current || request !== imageRequest.current) return;
                    setError('图片读取失败。');
                    setImageLoading(false);
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          ) : (
            <>
              <label>
                当前值
                {kind === 'list' || (kind === 'text' && multiline) ? (
                  <Input.Textarea
                    aria-label="PDF 字段当前值"
                    value={value}
                    rows={2}
                    onChange={(event) => setValue(event.target.value)}
                  />
                ) : (
                  <Input
                    aria-label="PDF 字段当前值"
                    type={kind === 'date' ? 'date' : 'text'}
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                  />
                )}
              </label>
              <label>
                默认值
                <Input.Textarea
                  aria-label="PDF 字段默认值"
                  value={initialValue}
                  rows={2}
                  onChange={(event) => setInitialValue(event.target.value)}
                />
              </label>
            </>
          )}
          <p className="zuvi-studio-pdf-hint">
            同一字段可以有多个控件；填写任一控件会同步。坐标单位为 PDF 点，原点位于页面左下角。
          </p>
          {widgets.map((widget, index) => (
            <fieldset key={index} className="zuvi-studio-pdf-widget-editor">
              <legend>控件 {index + 1}</legend>
              {(['page', 'x', 'y', 'width', 'height', 'rotation'] as const).map((key, i) => (
                <label key={key}>
                  {['页码', 'X', 'Y', '宽度', '高度', '旋转'][i]}
                  <Input
                    type="number"
                    aria-label={`控件 ${index + 1} ${['页码', 'X', 'Y', '宽度', '高度', '旋转'][i]}`}
                    value={
                      widgetDrafts[`${index}:${key}`] ??
                      String(key === 'page' ? widget.page + 1 : widget[key] || 0)
                    }
                    onChange={(event) => changeWidget(index, key, event.target.value)}
                  />
                </label>
              ))}
              {kind === 'radio' && (
                <label>
                  导出选项
                  <Input
                    aria-label={`控件 ${index + 1} 导出选项`}
                    value={widget.option || ''}
                    placeholder="对应候选导出值"
                    onChange={(event) =>
                      setWidgets((current) =>
                        current.map((entry, i) =>
                          i === index ? { ...entry, option: event.target.value } : entry
                        )
                      )
                    }
                  />
                </label>
              )}
              <Button
                size="sm"
                variant="ghost"
                disabled={widgets.length <= 1}
                onClick={() => {
                  setWidgets((current) => current.filter((_, i) => i !== index));
                  setWidgetDrafts((current) =>
                    Object.fromEntries(
                      Object.entries(current).flatMap(([key, value]) => {
                        const [i, property] = key.split(':');
                        const position = Number(i);
                        return position === index
                          ? []
                          : [[`${position > index ? position - 1 : position}:${property}`, value]];
                      })
                    )
                  );
                }}
              >
                删除控件 {index + 1}
              </Button>
            </fieldset>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setWidgets((current) => [
                ...current,
                {
                  ...current[current.length - 1],
                  page,
                  x: bounds.left + 12,
                  y: Math.max(bounds.bottom + 6, current[current.length - 1].y - 40),
                  option: undefined,
                },
              ])
            }
          >
            添加控件
          </Button>
          {error && <p role="alert">{error}</p>}
        </Modal.Body>
        <Modal.Footer>
          {field && onDelete && (
            <Button variant="ghost" onClick={() => onDelete(field.name)}>
              删除字段
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button disabled={saving || imageLoading} onClick={() => void save()}>
            保存字段
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
