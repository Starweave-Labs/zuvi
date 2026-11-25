'use client';
import * as React from 'react';
import { Button } from '../Button';
import { Input } from '../Input';
import { Modal } from '../Modal';
import { Select } from '../Select';
import {
  wordParagraphNumber,
  wordParagraphLineCss,
  type WordLineRule,
  WORD_KEEP_FLAGS,
} from './studio-word-paragraph-format';
import type { StudioWordParagraphFormat } from './studio-types';

const numeric = [
  ['indentLeft', '左缩进（pt）'],
  ['indentRight', '右缩进（pt）'],
  ['spaceBefore', '段前（pt）'],
  ['spaceAfter', '段后（pt）'],
] as const;
type Values = Record<keyof Required<StudioWordParagraphFormat>, string | number | boolean | null>;
export function StudioWordParagraphDialog({
  values,
  blocked,
  onClose,
  onSave,
}: {
  values: Values;
  blocked: boolean;
  onClose(): void;
  onSave(patch: Partial<StudioWordParagraphFormat>): void;
}) {
  const [draft, setDraft] = React.useState<Record<string, string>>(() =>
    Object.fromEntries([
      ...numeric.map(([key]) => [key, values[key] === null ? '' : String(values[key])]),
      ['lineHeight', values.lineHeight === null ? '' : String(values.lineHeight)],
      [
        'firstAmount',
        values.indentFirstLine === null ? '' : String(Math.abs(Number(values.indentFirstLine))),
      ],
    ])
  );
  const [align, setAlign] = React.useState(String(values.textAlign ?? 'keep'));
  const [rule, setRule] = React.useState(String(values.lineHeightRule ?? 'keep'));
  const [first, setFirst] = React.useState(
    values.indentFirstLine === null
      ? 'keep'
      : Number(values.indentFirstLine) === 0
        ? 'none'
        : Number(values.indentFirstLine) > 0
          ? 'first'
          : 'hanging'
  );
  const [dirty, setDirty] = React.useState<Record<string, boolean>>({});
  const [keep, setKeep] = React.useState(() =>
    Object.fromEntries(
      WORD_KEEP_FLAGS.map((key) => [key, values[key] === null ? 'keep' : String(values[key])])
    )
  );
  const [saveError, setSaveError] = React.useState('');
  const change = (key: string, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setDirty((current) => ({ ...current, [key]: true }));
    setSaveError('');
  };
  const patch: Partial<StudioWordParagraphFormat> = {};
  for (const key of WORD_KEEP_FLAGS)
    if (dirty[key] && keep[key] !== 'keep') patch[key] = keep[key] === 'true';
  let issue = '';
  if (dirty.textAlign && align !== 'keep')
    patch.textAlign = align as StudioWordParagraphFormat['textAlign'];
  for (const [key, label] of numeric)
    if (dirty[key] && draft[key] !== '') {
      const value = wordParagraphNumber(draft[key], key);
      if (value === null)
        issue = `${label}范围/精度无效；缩进 ±500pt，段间距 0–500pt，步长 0.05pt。`;
      else patch[key] = value;
    }
  if ((dirty.first || dirty.firstAmount) && first !== 'keep') {
    const value = first === 'none' ? 0 : wordParagraphNumber(draft.firstAmount, 'indentFirstLine');
    if (value === null || value < 0) issue = '特殊缩进量须为 0–500pt，步长 0.05pt。';
    else patch.indentFirstLine = first === 'hanging' ? -value : value;
  }
  if ((dirty.lineHeight || dirty.lineHeightRule) && rule !== 'keep') {
    const value = wordParagraphNumber(draft.lineHeight, 'lineHeight', rule as WordLineRule);
    if (value === null)
      issue = rule === 'auto' ? '倍数行距须为 0.5–10。' : '行距须为 1–500pt，步长 0.05pt。';
    else {
      patch.lineHeight = value;
      patch.lineHeightRule = rule as WordLineRule;
    }
  }
  const preview = {
    textAlign: values.textAlign ?? 'left',
    indentLeft: values.indentLeft ?? 0,
    indentRight: values.indentRight ?? 0,
    indentFirstLine: values.indentFirstLine ?? 0,
    spaceBefore: values.spaceBefore ?? 0,
    spaceAfter: values.spaceAfter ?? 0,
    lineHeight: values.lineHeight ?? 1.75,
    lineHeightRule: values.lineHeightRule ?? 'auto',
    ...patch,
  };
  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Modal.Content size="sm" className="zuvi-studio-word-paragraph-dialog">
        <Modal.Header>
          <Modal.Title>段落设置</Modal.Title>
          <Modal.Close />
        </Modal.Header>
        <Modal.Body>
          <label>
            对齐
            <Select
              aria-label="段落对齐"
              value={align}
              disabled={blocked}
              options={[
                { value: 'keep', label: '保持原值' },
                { value: 'left', label: '左对齐' },
                { value: 'center', label: '居中' },
                { value: 'right', label: '右对齐' },
                { value: 'justify', label: '两端对齐' },
              ]}
              onChange={(value) => {
                setAlign(value);
                setDirty((current) => ({ ...current, textAlign: true }));
                setSaveError('');
              }}
            />
          </label>
          <div className="zuvi-studio-word-paragraph-fields">
            {numeric.map(([key, label]) => (
              <label key={key}>
                {label}
                <Input
                  aria-label={label}
                  inputMode="decimal"
                  value={draft[key]}
                  placeholder="混合（保持）"
                  disabled={blocked}
                  onChange={(event) => change(key, event.target.value)}
                />
              </label>
            ))}
          </div>
          <div className="zuvi-studio-word-paragraph-fields">
            <label>
              特殊缩进
              <Select
                aria-label="特殊缩进"
                value={first}
                disabled={blocked}
                options={[
                  { value: 'keep', label: '保持原值' },
                  { value: 'none', label: '无' },
                  { value: 'first', label: '首行' },
                  { value: 'hanging', label: '悬挂' },
                ]}
                onChange={(value) => {
                  setFirst(value);
                  setDirty((current) => ({ ...current, first: true }));
                  if (!draft.firstAmount || Number(draft.firstAmount) === 0)
                    setDraft((current) => ({ ...current, firstAmount: '24' }));
                  setSaveError('');
                }}
              />
            </label>
            <label>
              缩进量（pt）
              <Input
                aria-label="特殊缩进量（pt）"
                inputMode="decimal"
                value={draft.firstAmount}
                disabled={blocked || first === 'keep' || first === 'none'}
                onChange={(event) => change('firstAmount', event.target.value)}
              />
            </label>
            <label>
              行距
              <Select
                aria-label="行距类型"
                value={rule}
                disabled={blocked}
                options={[
                  { value: 'keep', label: '保持原值' },
                  { value: 'auto', label: '倍数' },
                  { value: 'exact', label: '固定值' },
                  { value: 'atLeast', label: '最小值' },
                ]}
                onChange={(value) => {
                  if (value !== rule && value !== 'keep')
                    setDraft((current) => ({
                      ...current,
                      lineHeight: value === 'auto' ? '1.75' : '12',
                    }));
                  setRule(value);
                  setDirty((current) => ({ ...current, lineHeightRule: true }));
                  setSaveError('');
                }}
              />
            </label>
            <label>
              {rule === 'auto' ? '倍数值' : '行距量（pt）'}
              <Input
                aria-label="行距量"
                inputMode="decimal"
                value={draft.lineHeight}
                placeholder="混合（保持）"
                disabled={blocked || rule === 'keep'}
                onChange={(event) => change('lineHeight', event.target.value)}
              />
            </label>
          </div>
          <p>空白或“保持原值”保留选区各自格式；修改只影响所选段落。</p>
          <div className="zuvi-studio-word-keep-fields">
            {WORD_KEEP_FLAGS.map((key) => (
              <label key={key}>
                {key === 'widowControl'
                  ? '孤行控制'
                  : key === 'keepNext'
                    ? '与下段同页'
                    : '段内不分页'}
                <Select
                  aria-label={
                    key === 'widowControl'
                      ? '孤行控制'
                      : key === 'keepNext'
                        ? '与下段同页'
                        : '段内不分页'
                  }
                  value={keep[key]}
                  disabled={blocked}
                  options={[
                    { value: 'keep', label: '保持原值' },
                    { value: 'true', label: '开启' },
                    { value: 'false', label: '关闭' },
                  ]}
                  onChange={(value) => {
                    setKeep((old) => ({ ...old, [key]: value }));
                    setDirty((old) => ({ ...old, [key]: true }));
                    setSaveError('');
                  }}
                />
              </label>
            ))}
          </div>
          <div className="zuvi-studio-word-paragraph-preview" aria-label="段落预览">
            <p
              data-word-line-rule={preview.lineHeightRule}
              style={{
                textAlign: preview.textAlign as React.CSSProperties['textAlign'],
                marginLeft: `${preview.indentLeft}pt`,
                marginRight: `${preview.indentRight}pt`,
                textIndent: `${preview.indentFirstLine}pt`,
                marginTop: `${preview.spaceBefore}pt`,
                marginBottom: `${preview.spaceAfter}pt`,
                ...wordParagraphLineCss(preview),
              }}
            >
              段落缩进与行距预览。
              <br />
              第二行展示悬挂与段落间距。
            </p>
          </div>
          {(issue || saveError) && (
            <p role="alert" className="zuvi-studio-word-character-error">
              {issue || saveError}
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button
            disabled={blocked || !!issue}
            onClick={() => {
              if (blocked || issue) return;
              try {
                onSave(patch);
                onClose();
              } catch (error) {
                setSaveError(error instanceof Error ? error.message : '段落设置未应用。');
              }
            }}
          >
            应用段落设置
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
