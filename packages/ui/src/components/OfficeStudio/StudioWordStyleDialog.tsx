import * as React from 'react';
import {
  wordLineUnits,
  wordParagraphLineCss,
  type WordLineRule,
} from './studio-word-paragraph-format';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { Input } from '../Input';
import { Modal } from '../Modal';
import { Select } from '../Select';
import type {
  StudioWordCharacterStyle,
  StudioWordParagraphFormat,
  StudioWordParagraphStyle,
} from './studio-types';
import {
  WORD_BUILTIN_STYLES,
  removeStudioWordStyle,
  resolveStudioWordParagraphStyle,
  validateStudioWordParagraphStyles,
} from './studio-word-styles';
import { studioFontFamilyCss } from './studio-font-input';

const FLAGS = [
  ['bold', '粗体'],
  ['italic', '斜体'],
  ['underline', '下划线'],
  ['strike', '删除线'],
] as const;
const NUMBERS = [
  ['spaceBefore', '样式段前（pt）', 0, 500],
  ['spaceAfter', '样式段后（pt）', 0, 500],
  ['indentLeft', '样式左缩进（pt）', -500, 500],
  ['indentRight', '样式右缩进（pt）', -500, 500],
  ['indentFirstLine', '样式首行缩进（pt）', -500, 500],
] as const;

export function StudioWordStyleDialog({
  value,
  styles,
  onChange,
  onClose,
}: {
  value: StudioWordParagraphStyle;
  styles: StudioWordParagraphStyle[];
  onChange(styles: StudioWordParagraphStyle[], message: string): void;
  onClose(): void;
}) {
  const editing = styles.some((style) => style.id === value.id);
  const [name, setName] = React.useState(value.name);
  const [basedOn, setBasedOn] = React.useState(value.basedOn || 'paragraph');
  const [next, setNext] = React.useState(value.next || '__self');
  const [level, setLevel] = React.useState(
    value.headingLevel === undefined ? '' : String(value.headingLevel)
  );
  const [autoUpdate, setAutoUpdate] = React.useState(value.autoUpdate || false);
  const [run, setRun] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(value.run || {}).map(([key, input]) => [
        key,
        input === null ? '__clear' : String(input),
      ])
    )
  );
  const [paragraph, setParagraph] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(value.paragraph || {}).map(([key, input]) => [key, String(input)])
    )
  );
  const [error, setError] = React.useState('');
  const allStyles = [...WORD_BUILTIN_STYLES, ...styles];
  const base = resolveStudioWordParagraphStyle(styles, basedOn);
  const effectiveLineRule = (paragraph.lineHeightRule ||
    base.paragraph.lineHeightRule) as WordLineRule;
  const lineNumber = Number(paragraph.lineHeight);
  const displayedLine =
    paragraph.lineHeight === '' || paragraph.lineHeight === undefined
      ? ''
      : Number.isFinite(lineNumber)
        ? String(
            (lineNumber *
              wordLineUnits(
                (paragraph.lineHeightRule || paragraph.lineHeightBasis || 'auto') as
                  WordLineRule | 'points'
              )) /
              wordLineUnits(effectiveLineRule)
          )
        : paragraph.lineHeight;
  const options = allStyles.map((style) => ({ value: style.id, label: style.name }));
  const changeRun = (key: string, input: string) =>
    setRun((current) => ({ ...current, [key]: input }));
  const changeParagraph = (key: string, input: string) =>
    setParagraph((current) => ({ ...current, [key]: input }));
  const build = (): StudioWordParagraphStyle => ({
    id: value.id,
    name,
    basedOn,
    ...(next !== '__self' ? { next } : {}),
    ...(level !== ''
      ? { headingLevel: Number(level) as StudioWordParagraphStyle['headingLevel'] }
      : {}),
    autoUpdate,
    run: Object.fromEntries(
      Object.entries(run)
        .filter(([, input]) => input !== '')
        .map(([key, input]) => [
          key,
          ['fontSize', 'letterSpacing', 'baselineShift'].includes(key)
            ? Number(input)
            : key === 'backgroundColor' && input === '__clear'
              ? null
              : FLAGS.some(([flag]) => flag === key)
                ? input === 'true'
                : input,
        ])
    ) as StudioWordCharacterStyle,
    paragraph: Object.fromEntries(
      Object.entries(paragraph)
        .filter(([, input]) => input !== '')
        .map(([key, input]) => [
          key,
          ['textAlign', 'lineHeightRule', 'lineHeightBasis'].includes(key) ? input : Number(input),
        ])
    ) as StudioWordParagraphFormat,
  });
  let preview = base;
  try {
    preview = resolveStudioWordParagraphStyle(
      [...styles.filter((style) => style.id !== value.id), build()],
      value.id
    );
  } catch {
    /* Keep the inherited preview while an input is incomplete. */
  }
  const save = () => {
    try {
      const candidate = build();
      const nextStyles = validateStudioWordParagraphStyles(
        editing
          ? styles.map((style) => (style.id === value.id ? candidate : style))
          : [...styles, candidate]
      );
      onChange(nextStyles, `${editing ? '已更新' : '已创建'}样式“${candidate.name.trim()}”。`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '样式无法保存。');
    }
  };
  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <Modal.Content size="lg" className="zuvi-studio-word-style-dialog">
        <Modal.Header>
          <Modal.Title>{editing ? '修改段落样式' : '新建段落样式'}</Modal.Title>
          <Modal.Close />
        </Modal.Header>
        <Modal.Body>
          <div className="zuvi-studio-word-style-form">
            <label>
              名称
              <Input
                aria-label="样式名称"
                value={name}
                maxLength={80}
                autoFocus
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <label>
              基于样式
              <Select
                aria-label="基于样式"
                value={basedOn}
                options={options.filter((option) => option.value !== value.id)}
                onChange={setBasedOn}
              />
            </label>
            <label>
              后续段落
              <Select
                aria-label="后续段落样式"
                value={next}
                options={[{ value: '__self', label: '沿用本样式' }, ...options]}
                onChange={setNext}
              />
            </label>
            <label>
              大纲级别
              <Select
                aria-label="样式大纲级别"
                value={level}
                options={[
                  {
                    value: '',
                    label: `继承（${base.headingLevel ? `标题 ${base.headingLevel}` : '正文'}）`,
                  },
                  { value: '0', label: '正文' },
                  ...[1, 2, 3, 4, 5, 6].map((number) => ({
                    value: String(number),
                    label: `标题 ${number}`,
                  })),
                ]}
                onChange={setLevel}
              />
            </label>
            <label>
              字体
              <Input
                aria-label="样式字体"
                value={run.fontFamily || ''}
                placeholder={`继承：${base.run.fontFamily}`}
                onChange={(event) => changeRun('fontFamily', event.target.value)}
              />
            </label>
            <label>
              字号（pt）
              <Input
                aria-label="样式字号"
                type="number"
                min={1}
                max={409}
                step="0.5"
                value={run.fontSize || ''}
                placeholder={`继承：${base.run.fontSize}`}
                onChange={(event) => changeRun('fontSize', event.target.value)}
              />
            </label>
            {(['letterSpacing', 'baselineShift'] as const).map((key) => (
              <label key={key}>
                {key === 'letterSpacing' ? '字符间距（pt）' : '字符位置（pt）'}
                <Input
                  aria-label={`样式${key === 'letterSpacing' ? '字符间距' : '字符位置'}`}
                  inputMode="decimal"
                  value={run[key] ?? ''}
                  placeholder={`继承：${base.run[key]}`}
                  onChange={(event) => changeRun(key, event.target.value)}
                />
              </label>
            ))}
            {FLAGS.map(([key, label]) => (
              <label key={key}>
                {label}
                <Select
                  aria-label={`样式${label}`}
                  value={run[key] || ''}
                  options={[
                    { value: '', label: `继承（${base.run[key] ? '启用' : '关闭'}）` },
                    { value: 'true', label: '启用' },
                    { value: 'false', label: '关闭' },
                  ]}
                  onChange={(input) => changeRun(key, input)}
                />
              </label>
            ))}
            <label>
              文字颜色
              <Input
                aria-label="样式文字颜色"
                value={run.color || ''}
                placeholder={`继承：${base.run.color}`}
                onChange={(event) => changeRun('color', event.target.value)}
              />
            </label>
            <div className="zuvi-studio-word-style-background">
              <label>
                文字背景
                <Input
                  aria-label="样式文字背景"
                  disabled={run.backgroundColor === '__clear'}
                  value={run.backgroundColor === '__clear' ? '' : run.backgroundColor || ''}
                  placeholder={
                    base.run.backgroundColor ? `继承：${base.run.backgroundColor}` : '继承：无背景'
                  }
                  onChange={(event) => changeRun('backgroundColor', event.target.value)}
                />
              </label>
              <Checkbox
                label="清除基础背景"
                checked={run.backgroundColor === '__clear'}
                onChange={(checked) => changeRun('backgroundColor', checked ? '__clear' : '')}
              />
            </div>
            <label>
              对齐
              <Select
                aria-label="样式对齐"
                value={paragraph.textAlign || ''}
                options={[
                  { value: '', label: '继承' },
                  { value: 'left', label: '左对齐' },
                  { value: 'center', label: '居中' },
                  { value: 'right', label: '右对齐' },
                  { value: 'justify', label: '两端对齐' },
                ]}
                onChange={(input) => changeParagraph('textAlign', input)}
              />
            </label>
            <label>
              行距类型
              <Select
                aria-label="样式行距类型"
                value={paragraph.lineHeightRule || ''}
                options={[
                  { value: '', label: '继承' },
                  { value: 'auto', label: '倍数' },
                  { value: 'exact', label: '固定值' },
                  { value: 'atLeast', label: '最小值' },
                ]}
                onChange={(rule) =>
                  setParagraph((current) =>
                    rule
                      ? {
                          ...current,
                          lineHeightRule: rule,
                          lineHeightBasis: rule === 'auto' ? 'auto' : 'points',
                          lineHeight:
                            wordLineUnits(rule as WordLineRule) === wordLineUnits(effectiveLineRule)
                              ? displayedLine || String(base.paragraph.lineHeight)
                              : rule === 'auto'
                                ? '1.75'
                                : '12',
                        }
                      : { ...current, lineHeightRule: '', lineHeight: '', lineHeightBasis: '' }
                  )
                }
              />
            </label>
            <label>
              {effectiveLineRule === 'auto' ? '样式行距（倍）' : '样式行距（pt）'}
              <Input
                aria-label="样式行距量"
                inputMode="decimal"
                value={displayedLine}
                placeholder={`继承：${base.paragraph.lineHeight}`}
                onChange={(event) =>
                  setParagraph((current) => ({
                    ...current,
                    lineHeight: event.target.value,
                    lineHeightRule: effectiveLineRule,
                    lineHeightBasis: effectiveLineRule === 'auto' ? 'auto' : 'points',
                  }))
                }
              />
            </label>
            {NUMBERS.map(([key, label, min, max]) => (
              <label key={key}>
                {label}
                <Input
                  aria-label={label}
                  type="number"
                  min={min}
                  max={max}
                  step="0.1"
                  value={paragraph[key] || ''}
                  placeholder={`继承：${base.paragraph[key]}`}
                  onChange={(event) => changeParagraph(key, event.target.value)}
                />
              </label>
            ))}
          </div>
          <p className="zuvi-studio-word-style-hint">
            留空的格式沿用基础样式。修改样式会更新使用它的段落，保留单独设置的不同格式。
          </p>
          <Checkbox
            label="正文格式修改时自动更新此样式"
            checked={autoUpdate}
            onChange={setAutoUpdate}
          />
          <div
            className="zuvi-studio-word-style-live-preview"
            aria-label="样式预览"
            style={{
              fontFamily: studioFontFamilyCss(preview.run.fontFamily),
              fontSize: `${preview.run.fontSize}pt`,
              letterSpacing: `${preview.run.letterSpacing}pt`,
              position: 'relative',
              top: `${-preview.run.baselineShift}pt`,
              fontWeight: preview.run.bold ? 'bold' : 'normal',
              fontStyle: preview.run.italic ? 'italic' : 'normal',
              textDecoration:
                [preview.run.underline ? 'underline' : '', preview.run.strike ? 'line-through' : '']
                  .filter(Boolean)
                  .join(' ') || 'none',
              color: preview.run.color,
              background: preview.run.backgroundColor || undefined,
              textAlign: preview.paragraph.textAlign,
              ...wordParagraphLineCss(preview.paragraph),
            }}
          >
            让想法，成为下一步。AaBbCc 123
          </div>
          {error && <p role="alert">{error}</p>}
        </Modal.Body>
        <Modal.Footer className="zuvi-studio-word-style-actions">
          {editing && (
            <Button
              variant="ghost"
              onClick={() => {
                try {
                  onChange(removeStudioWordStyle(styles, value.id), `已删除样式“${value.name}”。`);
                } catch (cause) {
                  setError(cause instanceof Error ? cause.message : '样式无法删除。');
                }
              }}
            >
              删除样式
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button onClick={save}>保存样式</Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
