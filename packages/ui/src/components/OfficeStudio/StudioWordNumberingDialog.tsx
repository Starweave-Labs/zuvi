'use client';
import * as React from 'react';
import { Button } from '../Button';
import { Input } from '../Input';
import { Modal } from '../Modal';
import { Select } from '../Select';
import { Checkbox } from '../Checkbox';
import {
  wordDefaultNumbering,
  wordNumberingCatalog,
  wordFormatNumber,
  type WordNumberingCatalog,
  type StudioWordNumberingLevel,
  type StudioWordNumberingDefinition,
} from './studio-word-numbering';
import type { StudioWordParagraphStyle } from './studio-types';

export interface WordNumberingSave {
  catalog: WordNumberingCatalog;
  apply: boolean;
  definitionId: string;
  level: number;
}
const numericKeys = ['start', 'indentLeft', 'indentFirstLine', 'fontSize'] as const;
type DraftLevel = Omit<StudioWordNumberingLevel, (typeof numericKeys)[number]> &
  Record<(typeof numericKeys)[number], string>;
const toDraft = (level: StudioWordNumberingLevel): DraftLevel => ({
  ...level,
  start: String(level.start),
  indentLeft: level.indentLeft === undefined ? '' : String(level.indentLeft),
  indentFirstLine: level.indentFirstLine === undefined ? '' : String(level.indentFirstLine),
  fontSize: level.fontSize === undefined ? '' : String(level.fontSize),
});
const formats = [
  { value: 'decimal', label: '1, 2, 3' },
  { value: 'upperRoman', label: 'I, II, III' },
  { value: 'lowerRoman', label: 'i, ii, iii' },
  { value: 'upperLetter', label: 'A, B, C' },
  { value: 'lowerLetter', label: 'a, b, c' },
  { value: 'bullet', label: '项目符号' },
];

export function StudioWordNumberingDialog({
  catalog,
  currentId,
  currentLevel = 0,
  styles,
  blocked,
  onClose,
  onSave,
}: {
  catalog: WordNumberingCatalog;
  currentId?: string;
  currentLevel?: number;
  styles: StudioWordParagraphStyle[];
  blocked: boolean;
  onClose(): void;
  onSave(value: WordNumberingSave): void;
}) {
  const [definitions, setDefinitions] = React.useState(() => structuredClone(catalog.definitions));
  const [selected, setSelected] = React.useState(currentId ?? catalog.definitions[0]?.id ?? '');
  const [level, setLevel] = React.useState(currentLevel);
  const [apply, setApply] = React.useState(!currentId);
  const [drafts, setDrafts] = React.useState<Record<string, DraftLevel[]>>(() =>
    Object.fromEntries(
      catalog.definitions.map((definition) => [definition.id, definition.levels.map(toDraft)])
    )
  );
  const [error, setError] = React.useState('');
  const selectedDefinition = definitions.find((entry) => entry.id === selected);
  const current = drafts[selected]?.[level];
  const update = (patch: Partial<DraftLevel>) => {
    setDrafts((all) => ({
      ...all,
      [selected]: all[selected].map((entry, index) =>
        index === level ? { ...entry, ...patch } : entry
      ),
    }));
    setError('');
  };
  let issue = '',
    parsed: WordNumberingCatalog | undefined;
  try {
    parsed = wordNumberingCatalog(
      definitions.map((definition) => ({
        ...definition,
        levels: drafts[definition.id].map((draft) => {
          const result = { ...draft } as unknown as StudioWordNumberingLevel;
          for (const key of numericKeys) {
            const raw = draft[key].trim();
            if (!raw && key !== 'start') {
              delete result[key];
              continue;
            }
            if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw))
              throw new Error('编号数值包含空白或非数字字符。');
            result[key] = Number(raw);
          }
          return result;
        }),
      })),
      catalog.instances
    );
  } catch (reason) {
    issue = reason instanceof Error ? reason.message : '编号定义无效。';
  }
  const create = () => {
    let index = 1;
    while (
      definitions.some((entry) => entry.id === `custom-numbering-${index}`) ||
      catalog.instances.some((entry) => entry.id === `custom-numbering-${index}`)
    )
      index++;
    const id = `custom-numbering-${index}`;
    let suffix = index,
      name = `多级编号 ${suffix}`;
    while (definitions.some((entry) => entry.name === name)) name = `多级编号 ${++suffix}`;
    const definition: StudioWordNumberingDefinition = {
      id,
      name,
      levels: wordDefaultNumbering().map((entry, index) => ({
        ...entry,
        text: Array.from({ length: index + 1 }, (_, i) => `%${i + 1}`).join('.') + '.',
      })),
    };
    setDefinitions((all) => [...all, definition]);
    setDrafts((all) => ({ ...all, [id]: definition.levels.map(toDraft) }));
    setSelected(id);
    setLevel(0);
    setApply(true);
    setError('');
  };
  const styleOptions = [
    { value: 'none', label: '不关联' },
    ...[
      'paragraph',
      'heading-1',
      'heading-2',
      'heading-3',
      'heading-4',
      'heading-5',
      'heading-6',
    ].map((id) => ({ value: id, label: id === 'paragraph' ? '正文' : `标题 ${id.slice(-1)}` })),
    ...styles.map((style) => ({ value: style.id, label: style.name })),
  ];
  const preview = parsed?.definitions.find((entry) => entry.id === selected)?.levels[level];
  const label = preview?.text.replace(/%([1-9])/g, (_, key: string) => {
    const value = parsed!.definitions.find((entry) => entry.id === selected)!.levels[
      Number(key) - 1
    ];
    return wordFormatNumber(value.start, preview.legal ? 'decimal' : value.format);
  });
  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Modal.Content size="lg" className="zuvi-studio-word-numbering-dialog">
        <Modal.Header>
          <Modal.Title>多级编号定义</Modal.Title>
          <Modal.Close />
        </Modal.Header>
        <Modal.Body>
          <div className="zuvi-studio-word-numbering-choice">
            <Select
              aria-label="编号定义"
              value={selected}
              disabled={blocked || !definitions.length}
              options={definitions.map((entry) => ({ value: entry.id, label: entry.name }))}
              onChange={(id) => {
                setSelected(id);
                setLevel(0);
                setError('');
              }}
            />
            <Button size="sm" disabled={blocked || definitions.length >= 100} onClick={create}>
              新建编号定义
            </Button>
          </div>
          {selectedDefinition && current && (
            <>
              <label>
                定义名称
                <Input
                  aria-label="编号定义名称"
                  disabled={blocked}
                  value={selectedDefinition.name}
                  onChange={(event) => {
                    setDefinitions((all) =>
                      all.map((entry) =>
                        entry.id === selected ? { ...entry, name: event.target.value } : entry
                      )
                    );
                    setError('');
                  }}
                />
              </label>
              <div className="zuvi-studio-word-numbering-choice">
                <Select
                  aria-label="编辑编号层级"
                  value={String(level)}
                  disabled={blocked}
                  options={drafts[selected].map((_, index) => ({
                    value: String(index),
                    label: `第 ${index + 1} 级`,
                  }))}
                  onChange={(value) => setLevel(Number(value))}
                />
                <Button
                  size="sm"
                  disabled={blocked || drafts[selected].length >= 9}
                  onClick={() =>
                    setDrafts((all) => ({
                      ...all,
                      [selected]: [
                        ...all[selected],
                        ...wordDefaultNumbering().slice(all[selected].length).map(toDraft),
                      ],
                    }))
                  }
                >
                  扩展为九级
                </Button>
              </div>
              <div className="zuvi-studio-word-numbering-fields">
                <label>
                  编号格式
                  <Select
                    aria-label="层级编号格式"
                    value={current.format}
                    disabled={blocked}
                    options={formats}
                    onChange={(value) =>
                      update({
                        format: value as DraftLevel['format'],
                        ...(value === 'bullet'
                          ? { text: '•' }
                          : current.format === 'bullet'
                            ? { text: `%${level + 1}.` }
                            : {}),
                      })
                    }
                  />
                </label>
                <label>
                  编号模板
                  <Input
                    aria-label="层级编号模板"
                    disabled={blocked}
                    value={current.text}
                    onChange={(event) => update({ text: event.target.value })}
                  />
                </label>
                <label>
                  起始编号
                  <Input
                    aria-label="层级起始编号"
                    inputMode="numeric"
                    disabled={blocked}
                    value={current.start}
                    onChange={(event) => update({ start: event.target.value })}
                  />
                </label>
                <label>
                  重新开始
                  <Select
                    aria-label="层级重新开始"
                    value={
                      current.restartAfter === undefined
                        ? 'default'
                        : current.restartAfter === null
                          ? 'never'
                          : String(current.restartAfter)
                    }
                    disabled={blocked}
                    options={[
                      { value: 'default', label: '默认：上一级出现后' },
                      { value: 'never', label: '不自动重新开始' },
                      ...Array.from({ length: level }, (_, index) => ({
                        value: String(index),
                        label: `第 ${index + 1} 级出现后`,
                      })),
                    ]}
                    onChange={(value) =>
                      update({
                        restartAfter:
                          value === 'default'
                            ? undefined
                            : value === 'never'
                              ? null
                              : Number(value),
                      })
                    }
                  />
                </label>
                <label>
                  关联段落样式
                  <Select
                    aria-label="编号关联样式"
                    disabled={blocked}
                    value={current.paragraphStyle ?? 'none'}
                    options={styleOptions}
                    onChange={(value) =>
                      update({ paragraphStyle: value === 'none' ? undefined : value })
                    }
                  />
                </label>
                <label>
                  编号后缀
                  <Select
                    aria-label="编号后缀"
                    disabled={blocked}
                    value={current.suffix ?? 'tab'}
                    options={[
                      { value: 'tab', label: '制表符' },
                      { value: 'space', label: '空格' },
                      { value: 'nothing', label: '无' },
                    ]}
                    onChange={(value) => update({ suffix: value as DraftLevel['suffix'] })}
                  />
                </label>
                <label>
                  左缩进（pt）
                  <Input
                    aria-label="编号左缩进（pt）"
                    inputMode="decimal"
                    disabled={blocked}
                    value={current.indentLeft}
                    onChange={(event) => update({ indentLeft: event.target.value })}
                  />
                </label>
                <label>
                  首行/悬挂（pt）
                  <Input
                    aria-label="编号首行缩进（pt）"
                    inputMode="decimal"
                    disabled={blocked}
                    value={current.indentFirstLine}
                    onChange={(event) => update({ indentFirstLine: event.target.value })}
                  />
                </label>
                <label>
                  编号对齐
                  <Select
                    aria-label="编号对齐"
                    disabled={blocked}
                    value={current.alignment ?? 'left'}
                    options={[
                      { value: 'left', label: '左对齐' },
                      { value: 'center', label: '居中' },
                      { value: 'right', label: '右对齐' },
                    ]}
                    onChange={(value) => update({ alignment: value as DraftLevel['alignment'] })}
                  />
                </label>
                <label>
                  编号字体
                  <Input
                    aria-label="编号字体"
                    disabled={blocked}
                    value={current.fontFamily ?? ''}
                    placeholder="继承段落"
                    onChange={(event) => update({ fontFamily: event.target.value || undefined })}
                  />
                </label>
                <label>
                  编号字号（pt）
                  <Input
                    aria-label="编号字号（pt）"
                    disabled={blocked}
                    inputMode="decimal"
                    value={current.fontSize}
                    placeholder="继承段落"
                    onChange={(event) => update({ fontSize: event.target.value })}
                  />
                </label>
                <label>
                  编号颜色
                  <Input
                    aria-label="编号颜色"
                    disabled={blocked}
                    value={current.color ?? ''}
                    placeholder="继承段落"
                    onChange={(event) => update({ color: event.target.value || undefined })}
                  />
                </label>
              </div>
              <div className="zuvi-studio-word-numbering-checks">
                <Checkbox
                  label="编号粗体"
                  disabled={blocked}
                  checked={current.bold ?? false}
                  onChange={(checked) => update({ bold: checked })}
                />
                <Checkbox
                  label="编号斜体"
                  disabled={blocked}
                  checked={current.italic ?? false}
                  onChange={(checked) => update({ italic: checked })}
                />
                <Checkbox
                  label="所有层级显示阿拉伯数字"
                  disabled={blocked}
                  checked={current.legal ?? false}
                  onChange={(checked) => update({ legal: checked })}
                />
              </div>
              <p>
                模板使用 %1–%9
                引用当前及更高层级。空白字体、字号与颜色继承段落。显式起始覆盖的实例继续保留其覆盖。
              </p>
              <div aria-label="编号预览" className="zuvi-studio-word-numbering-preview">
                {label ?? '请修正编号定义'} 预览段落
              </div>
              <Checkbox
                label="应用所选定义与层级到选区"
                disabled={blocked}
                checked={apply}
                onChange={setApply}
              />
            </>
          )}
          {(issue || error) && <p role="alert">{issue || error}</p>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button
            disabled={blocked || !parsed || !selectedDefinition}
            onClick={() => {
              if (blocked || !parsed) return;
              try {
                onSave({ catalog: parsed, apply, definitionId: selected, level });
                onClose();
              } catch (reason) {
                setError(reason instanceof Error ? reason.message : '编号未保存。');
              }
            }}
          >
            保存编号定义
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
