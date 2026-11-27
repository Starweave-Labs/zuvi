'use client';

import { useRef, useState } from 'react';
import { Button } from '../Button/Button';
import { Checkbox } from '../Checkbox/Checkbox';
import { ColorPicker } from '../ColorPicker/ColorPicker';
import { Input } from '../Input/Input';
import { Modal } from '../Modal/Modal';
import { Select } from '../Select/Select';
import type {
  PdfAnnotation,
  PdfAnnotationPatch,
  PdfLineEnding,
  PdfRect,
  PdfStrokePatch,
} from './studio-pdf-annotation-types';
import { PDF_NATIVE_LABELS, pdfNativeHex, pdfNativeRgb } from './studio-pdf-native-ui';

const lineEnds: PdfLineEnding[] = [
  'None',
  'Square',
  'Circle',
  'Diamond',
  'OpenArrow',
  'ClosedArrow',
  'Butt',
  'ROpenArrow',
  'RClosedArrow',
  'Slash',
];
const lineEndLabels: Record<PdfLineEnding, string> = {
  None: '无',
  Square: '方形',
  Circle: '圆形',
  Diamond: '菱形',
  OpenArrow: '空心箭头',
  ClosedArrow: '实心箭头',
  Butt: '平头',
  ROpenArrow: '反向空心箭头',
  RClosedArrow: '反向实心箭头',
  Slash: '斜线',
};
const fonts = ['Helvetica', 'Times-Roman', 'Courier', 'Noto Sans SC'];

export function StudioPdfAnnotationDialog({
  annotation,
  disabled,
  busy,
  notice,
  onCancel,
  onApply,
}: {
  annotation: PdfAnnotation;
  disabled: boolean;
  busy: boolean;
  notice?: string;
  onCancel(): void;
  onApply(patch: PdfAnnotationPatch): Promise<boolean>;
}) {
  const rect = annotation.rect ?? [0, 0, 0, 0],
    editable = annotation.kind !== 'opaque' ? annotation : undefined;
  const initial = {
    text: annotation.contents,
    x: String(rect[0]),
    y: String(rect[1]),
    width: String(rect[2] - rect[0]),
    height: String(rect[3] - rect[1]),
    color: pdfNativeHex(editable?.color ?? null),
    fill: pdfNativeHex(editable?.fill ?? null),
    noColor: editable?.color === null,
    noFill: editable?.fill === null,
    opacity: String((editable?.opacity ?? 1) * 100),
    lineWidth: String(editable?.stroke.width ?? 0),
    lineStyle: editable?.stroke.style ?? 'S',
    font: annotation.kind === 'freeText' ? annotation.font.family : 'Helvetica',
    fontSize: annotation.kind === 'freeText' ? String(annotation.font.size) : '16',
    fontColor: annotation.kind === 'freeText' ? pdfNativeHex(annotation.font.color) : '#000000',
    lineHeight: annotation.kind === 'freeText' ? String(annotation.lineHeight) : '19.2',
    align: annotation.kind === 'freeText' ? String(annotation.align) : '0',
    start:
      annotation.kind === 'line' || annotation.kind === 'polyLine'
        ? annotation.lineEnds[0]
        : 'None',
    end:
      annotation.kind === 'line' || annotation.kind === 'polyLine'
        ? annotation.lineEnds[1]
        : 'None',
    vertices:
      annotation.kind === 'polygon' || annotation.kind === 'polyLine'
        ? annotation.vertices
            .reduce<string[]>(
              (rows, number, index, values) =>
                index % 2 ? rows : [...rows, `${number}, ${values[index + 1]}`],
              []
            )
            .join('\n')
        : '',
  };
  const [draft, setDraft] = useState(initial),
    [error, setError] = useState('');
  const dirty = useRef(new Set<keyof typeof initial>()),
    composing = useRef(false);
  const set = <K extends keyof typeof initial>(key: K, value: (typeof initial)[K]) => {
    dirty.current.add(key);
    setDraft((previous) => ({ ...previous, [key]: value }));
    setError('');
  };
  const blocked = disabled || busy || !editable;
  const number = (key: keyof typeof initial, minimum: number, maximum: number) => {
    const value = String(draft[key]).trim();
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value)) throw new Error('请填写有效的数值。');
    const result = Number(value);
    if (!Number.isFinite(result) || result < minimum || result > maximum)
      throw new Error(`数值须在 ${minimum} 至 ${maximum} 之间。`);
    return result;
  };
  const scalar = (
    key: keyof typeof initial,
    label: string,
    minimum: number,
    maximum: number,
    allowed: boolean
  ) => (
    <label>
      {label}
      <Input
        size="sm"
        inputMode="decimal"
        aria-label={`PDF 批注${label}`}
        value={String(draft[key])}
        disabled={blocked || !allowed}
        onChange={(event) => set(key, event.target.value as (typeof initial)[typeof key])}
      />
      <small>
        {minimum}–{maximum}
      </small>
    </label>
  );
  const apply = async () => {
    if (blocked || !editable || composing.current) return;
    try {
      const patch: PdfAnnotationPatch = { kind: editable.kind };
      if (dirty.current.has('text') && draft.text !== annotation.contents)
        patch.contents = draft.text;
      if (
        ['x', 'y', 'width', 'height'].some((key) => dirty.current.has(key as keyof typeof initial))
      ) {
        const x = number('x', -14400, 14400),
          y = number('y', -14400, 14400);
        const width = number('width', annotation.kind === 'note' ? 0 : 0.01, 14400),
          height = number('height', annotation.kind === 'note' ? 0 : 0.01, 14400);
        const next: PdfRect = [x, y, x + width, y + height];
        if (next.some((value, index) => value !== rect[index])) patch.rect = next;
      }
      for (const [key, none] of [
        ['color', 'noColor'],
        ['fill', 'noFill'],
      ] as const)
        if (dirty.current.has(key) || dirty.current.has(none)) {
          const next = draft[none] ? null : pdfNativeRgb(draft[key]);
          if (JSON.stringify(next) !== JSON.stringify(editable[key])) patch[key] = next;
        }
      if (dirty.current.has('opacity')) {
        const value = number('opacity', 0, 100) / 100;
        if (value !== editable.opacity) patch.opacity = value;
      }
      const stroke: PdfStrokePatch = {};
      if (dirty.current.has('lineWidth')) {
        const value = number('lineWidth', 0, 72);
        if (value !== editable.stroke.width) stroke.width = value;
      }
      if (dirty.current.has('lineStyle') && draft.lineStyle !== editable.stroke.style)
        stroke.style = draft.lineStyle;
      if (Object.keys(stroke).length) patch.stroke = stroke;
      if (patch.kind === 'freeText' && annotation.kind === 'freeText') {
        const font: NonNullable<typeof patch.font> = {};
        if (dirty.current.has('font') && draft.font !== annotation.font.family)
          font.family = draft.font;
        if (dirty.current.has('fontSize')) {
          const value = number('fontSize', 1, 144);
          if (value !== annotation.font.size) font.size = value;
        }
        if (dirty.current.has('fontColor')) {
          const value = pdfNativeRgb(draft.fontColor);
          if (JSON.stringify(value) !== JSON.stringify(annotation.font.color)) font.color = value;
        }
        if (Object.keys(font).length) patch.font = font;
        if (dirty.current.has('align')) patch.align = Number(draft.align) as 0 | 1 | 2;
        if (dirty.current.has('lineHeight')) {
          const value = number('lineHeight', 0.01, 1000);
          if (value !== annotation.lineHeight) patch.lineHeight = value;
        } else if (
          font.size !== undefined &&
          Math.abs(annotation.lineHeight - annotation.font.size * 1.2) < 0.0001
        )
          patch.lineHeight = font.size * 1.2;
      }
      if (
        (patch.kind === 'line' || patch.kind === 'polyLine') &&
        (annotation.kind === 'line' || annotation.kind === 'polyLine') &&
        (dirty.current.has('start') || dirty.current.has('end'))
      ) {
        patch.lineEnds = [draft.start, draft.end];
      }
      if (
        (patch.kind === 'polygon' || patch.kind === 'polyLine') &&
        dirty.current.has('vertices')
      ) {
        const points = draft.vertices
          .trim()
          .split(/\n/)
          .flatMap((row) => {
            const pair = row.trim().split(/\s*,\s*|\s+/);
            if (
              pair.length !== 2 ||
              pair.some((value) => !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value))
            )
              throw new Error('每行请填写一组 x, y 顶点坐标。');
            const numbers = pair.map(Number);
            if (numbers.some((value) => !Number.isFinite(value))) throw new Error('顶点坐标无效。');
            return numbers;
          });
        if (points.length < (patch.kind === 'polygon' ? 6 : 4) || points.length > 20000)
          throw new Error('请填写足够的顶点，最多 10000 组。');
        patch.vertices = points;
      }
      if (Object.keys(patch).length === 1 || (await onApply(patch))) onCancel();
      else setError('批注未应用，请检查当前内容与编辑权限。');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '批注属性未应用。');
    }
  };
  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <Modal.Content aria-label="PDF 批注属性" className="zuvi-studio-pdf-native-dialog" size="md">
        <Modal.Header>
          <Modal.Title>{PDF_NATIVE_LABELS[annotation.kind]}属性</Modal.Title>
          <Modal.Close aria-label="关闭 PDF 批注属性" />
        </Modal.Header>
        <Modal.Body>
          <div
            className="zuvi-studio-pdf-native-property-grid"
            onCompositionStart={() => {
              composing.current = true;
            }}
            onCompositionEnd={() => {
              composing.current = false;
            }}
          >
            <label className="zuvi-studio-pdf-native-property-text">
              {annotation.kind === 'freeText' ? '文字内容' : '批注内容'}
              <Input.Textarea
                aria-label="PDF 批注内容"
                value={draft.text}
                maxLength={10000}
                rows={3}
                disabled={blocked || !annotation.capabilities.contents}
                onChange={(event) => set('text', event.target.value)}
              />
            </label>
            {scalar('x', '横坐标', -14400, 14400, annotation.capabilities.move)}
            {scalar('y', '纵坐标', -14400, 14400, annotation.capabilities.move)}
            {scalar(
              'width',
              '宽度',
              annotation.kind === 'note' ? 0 : 0.01,
              14400,
              annotation.capabilities.resize
            )}
            {scalar(
              'height',
              '高度',
              annotation.kind === 'note' ? 0 : 0.01,
              14400,
              annotation.capabilities.resize
            )}
            {annotation.kind === 'freeText' && (
              <>
                <label>
                  字体
                  <Select
                    aria-label="PDF 批注字体"
                    value={draft.font}
                    disabled={blocked || !annotation.capabilities.appearance}
                    options={[...new Set([annotation.font.family, ...fonts])].map((value) => ({
                      label: value,
                      value,
                    }))}
                    onChange={(value) => set('font', String(value))}
                  />
                </label>
                {scalar('fontSize', '字号', 1, 144, annotation.capabilities.appearance)}
                <label>
                  文字颜色
                  <ColorPicker
                    aria-label="PDF 批注文字颜色"
                    value={draft.fontColor}
                    disabled={blocked || !annotation.capabilities.appearance}
                    onChange={(value) => set('fontColor', value)}
                  />
                </label>
                <label>
                  对齐
                  <Select
                    aria-label="PDF 批注对齐"
                    value={draft.align}
                    disabled={blocked || !annotation.capabilities.appearance}
                    options={[
                      { label: '左对齐', value: '0' },
                      { label: '居中', value: '1' },
                      { label: '右对齐', value: '2' },
                    ]}
                    onChange={(value) => set('align', String(value))}
                  />
                </label>
                {scalar('lineHeight', '行高', 0.01, 1000, annotation.capabilities.appearance)}
              </>
            )}
            <div className="zuvi-studio-pdf-native-property-color">
              <span>{annotation.kind === 'freeText' ? '背景颜色' : '线条颜色'}</span>
              <ColorPicker
                aria-label="PDF 批注线条或背景颜色"
                value={draft.color}
                disabled={blocked || !annotation.capabilities.appearance || draft.noColor}
                onChange={(value) => set('color', value)}
              />
              <Checkbox
                label="无颜色"
                checked={draft.noColor}
                disabled={blocked || !annotation.capabilities.appearance}
                onChange={(value) => set('noColor', value)}
              />
            </div>
            <div className="zuvi-studio-pdf-native-property-color">
              <span>{annotation.kind === 'freeText' ? '边框颜色' : '填充'}</span>
              <ColorPicker
                aria-label={
                  annotation.kind === 'freeText' ? 'PDF 批注边框颜色' : 'PDF 批注填充颜色'
                }
                value={draft.fill}
                disabled={blocked || !annotation.capabilities.appearance || draft.noFill}
                onChange={(value) => set('fill', value)}
              />
              <Checkbox
                label={annotation.kind === 'freeText' ? '无边框颜色' : '无填充'}
                checked={draft.noFill}
                disabled={blocked || !annotation.capabilities.appearance}
                onChange={(value) => set('noFill', value)}
              />
            </div>
            {scalar('opacity', '不透明度百分比', 0, 100, annotation.capabilities.appearance)}
            {scalar('lineWidth', '线宽', 0, 72, annotation.capabilities.appearance)}
            <label>
              线型
              <Select
                aria-label="PDF 批注线型"
                value={draft.lineStyle}
                disabled={blocked || !annotation.capabilities.appearance}
                options={[
                  { label: '实线', value: 'S' },
                  { label: '虚线', value: 'D' },
                ]}
                onChange={(value) => set('lineStyle', value as 'S' | 'D')}
              />
            </label>
            {(annotation.kind === 'line' || annotation.kind === 'polyLine') && (
              <>
                <label>
                  起点形状
                  <Select
                    aria-label="PDF 批注起点形状"
                    value={draft.start}
                    disabled={blocked || !annotation.capabilities.appearance}
                    options={lineEnds.map((value) => ({ label: lineEndLabels[value], value }))}
                    onChange={(value) => set('start', value as PdfLineEnding)}
                  />
                </label>
                <label>
                  终点形状
                  <Select
                    aria-label="PDF 批注终点形状"
                    value={draft.end}
                    disabled={blocked || !annotation.capabilities.appearance}
                    options={lineEnds.map((value) => ({ label: lineEndLabels[value], value }))}
                    onChange={(value) => set('end', value as PdfLineEnding)}
                  />
                </label>
              </>
            )}
            {(annotation.kind === 'polygon' || annotation.kind === 'polyLine') && (
              <label className="zuvi-studio-pdf-native-property-text">
                顶点坐标（每行 x, y；单位磅）
                <Input.Textarea
                  aria-label="PDF 批注顶点坐标"
                  rows={4}
                  value={draft.vertices}
                  disabled={blocked || !annotation.capabilities.reshape}
                  onChange={(event) => set('vertices', event.target.value)}
                />
              </label>
            )}
            {annotation.capabilities.reasons?.length ? (
              <p className="zuvi-studio-pdf-hint">{annotation.capabilities.reasons.join(' ')}</p>
            ) : null}
            {(notice || error) && (
              <p role="alert" data-studio-input-error={notice || error}>
                {notice || error}
              </p>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" onClick={onCancel}>
            取消
          </Button>
          <Button disabled={blocked} loading={busy} onClick={() => void apply()}>
            应用批注属性
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
