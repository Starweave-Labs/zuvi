'use client';
import * as React from 'react';
import { Button } from '../Button';
import { Input } from '../Input';
import { Modal } from '../Modal';
import { Select } from '../Select';
import { wordMetricPoints, WORD_METRIC_STEPS, type WordMetric } from './studio-word-metrics';

const fields: { key: WordMetric; label: string; modes: [string, string] }[] = [
  { key: 'letterSpacing', label: '字符间距', modes: ['加宽', '紧缩'] },
  { key: 'baselineShift', label: '字符位置', modes: ['提升', '降低'] },
];
export function StudioWordCharacterDialog({
  values,
  text,
  blocked,
  onClose,
  onSave,
}: {
  values: Record<WordMetric, number | null>;
  text: string;
  blocked: boolean;
  onClose(): void;
  onSave(values: Partial<Record<WordMetric, number>>): void;
}) {
  const [modes, setModes] = React.useState(() =>
    Object.fromEntries(
      fields.map(({ key }) => [
        key,
        values[key] === null
          ? 'keep'
          : values[key] === 0
            ? 'normal'
            : values[key]! > 0
              ? 'positive'
              : 'negative',
      ])
    )
  );
  const [drafts, setDrafts] = React.useState(() =>
    Object.fromEntries(fields.map(({ key }) => [key, String(Math.abs(values[key] ?? 1))]))
  );
  const [dirty, setDirty] = React.useState<Partial<Record<WordMetric, boolean>>>({});
  const [saveError, setSaveError] = React.useState('');
  const [composing, setComposing] = React.useState(false);
  const patch: Partial<Record<WordMetric, number>> = {};
  const preview: Record<WordMetric, number> = {
    letterSpacing: values.letterSpacing ?? 0,
    baselineShift: values.baselineShift ?? 0,
  };
  let issue = '';
  for (const { key, label } of fields) {
    if (modes[key] === 'keep') continue;
    const amount = modes[key] === 'normal' ? 0 : wordMetricPoints(drafts[key], key);
    if (amount === null || amount < 0)
      issue = `${label}的量须为 0–500pt，步长 ${WORD_METRIC_STEPS[key]}pt。`;
    else {
      preview[key] = modes[key] === 'negative' ? -amount : amount;
      if (dirty[key]) patch[key] = preview[key];
    }
  }
  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Modal.Content size="sm" className="zuvi-studio-word-character-dialog">
        <Modal.Header>
          <Modal.Title>字符间距与位置</Modal.Title>
          <Modal.Close />
        </Modal.Header>
        <Modal.Body>
          {fields.map(({ key, label, modes: labels }) => (
            <div key={key} className="zuvi-studio-word-character-field">
              <span>{label}</span>
              <Select
                aria-label={label}
                disabled={blocked}
                value={modes[key]}
                options={[
                  { value: 'keep', label: values[key] === null ? '混合（保持原值）' : '保持原值' },
                  { value: 'normal', label: '标准' },
                  { value: 'positive', label: labels[0] },
                  { value: 'negative', label: labels[1] },
                ]}
                onChange={(value) => {
                  setModes((current) => ({ ...current, [key]: value }));
                  setDirty((current) => ({ ...current, [key]: true }));
                  if (value !== 'normal' && (!drafts[key] || Number(drafts[key]) === 0))
                    setDrafts((current) => ({ ...current, [key]: '1' }));
                  setSaveError('');
                }}
              />
              <Input
                aria-label={`${label}量（pt）`}
                inputMode="decimal"
                value={drafts[key]}
                disabled={blocked || modes[key] === 'normal' || modes[key] === 'keep'}
                onCompositionStart={() => setComposing(true)}
                onCompositionEnd={() => setComposing(false)}
                onChange={(event) => {
                  setDrafts((current) => ({ ...current, [key]: event.target.value }));
                  setDirty((current) => ({ ...current, [key]: true }));
                  setSaveError('');
                }}
              />
            </div>
          ))}
          <p>间距按 0.05pt、位置按 0.5pt 输入；未修改的混合格式保持原样。</p>
          <div
            className="zuvi-studio-word-character-preview"
            aria-label="字符格式预览"
            aria-live="polite"
          >
            <span
              style={{
                letterSpacing: `${preview.letterSpacing}pt`,
                position: 'relative',
                top: `${-preview.baselineShift}pt`,
              }}
            >
              {Array.from(text || '字符间距与位置 AaBb 123')
                .slice(0, 80)
                .join('')}
            </span>
          </div>
          <p>{`预览：间距 ${preview.letterSpacing}pt，位置 ${preview.baselineShift}pt`}</p>
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
            disabled={blocked || composing || !!issue}
            onClick={() => {
              if (blocked || composing || issue) return;
              try {
                onSave(patch);
                onClose();
              } catch (error) {
                setSaveError(error instanceof Error ? error.message : '字符格式未应用。');
              }
            }}
          >
            应用字符格式
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
