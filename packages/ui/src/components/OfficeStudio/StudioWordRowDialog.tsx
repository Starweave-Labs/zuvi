'use client';
import * as React from 'react';
import { Button } from '../Button';
import { Input } from '../Input';
import { Modal } from '../Modal';
import { Select } from '../Select';
import {
  wordRowProperties,
  type WordRowProperties,
  type WordRowHeightRule,
} from './studio-word-table-rows';

export function StudioWordRowDialog({
  rows,
  blocked,
  onClose,
  onSave,
}: {
  rows: WordRowProperties[];
  blocked: boolean;
  onClose: () => void;
  onSave: (patch: Partial<WordRowProperties>) => void;
}) {
  const same = (key: keyof WordRowProperties) => rows.every((row) => row[key] === rows[0][key]);
  const [height, setHeight] = React.useState(
    same('rowHeight') ? String(rows[0].rowHeight ?? '') : ''
  );
  const [rule, setRule] = React.useState(same('rowHeightRule') ? rows[0].rowHeightRule : 'keep');
  const [split, setSplit] = React.useState(
    same('allowSplit')
      ? rows[0].allowSplit === null
        ? 'default'
        : rows[0].allowSplit
          ? 'yes'
          : 'no'
      : 'keep'
  );
  const [dirty, setDirty] = React.useState({ height: false, rule: false, split: false });
  const [error, setError] = React.useState('');
  const [composing, setComposing] = React.useState(false);
  const patch: Partial<WordRowProperties> = {};
  let issue = '';
  if (dirty.height) {
    if (height && !/^\d+(?:\.\d+)?$/.test(height)) issue = '请输入有效的行高。';
    else patch.rowHeight = height ? Number(height) : null;
  }
  if (dirty.rule && rule !== 'keep') patch.rowHeightRule = rule as WordRowHeightRule;
  if (dirty.split && split !== 'keep')
    patch.allowSplit = split === 'default' ? null : split === 'yes';
  try {
    for (const row of rows) wordRowProperties({ ...row, ...patch });
  } catch (reason) {
    issue = reason instanceof Error ? reason.message : '行属性无效。';
  }
  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Modal.Content size="sm">
        <Modal.Header>
          <Modal.Title>表格行属性</Modal.Title>
          <Modal.Close />
        </Modal.Header>
        <Modal.Body>
          <p>所选 {rows.length} 行</p>
          <label>
            行高（磅）
            <Input
              type="number"
              min={0}
              max={2000}
              step={0.5}
              aria-label="表格行高"
              onCompositionStart={() => setComposing(true)}
              onCompositionEnd={() => setComposing(false)}
              value={height}
              placeholder={same('rowHeight') ? '自动' : '混合值'}
              disabled={blocked || rule === 'auto'}
              onChange={(event) => {
                setHeight(event.target.value);
                setDirty((value) => ({ ...value, height: true }));
                setError('');
              }}
            />
          </label>
          <Select
            aria-label="表格行高规则"
            value={rule}
            disabled={blocked}
            options={[
              { value: 'keep', label: '保持各行原值' },
              { value: 'auto', label: '自动' },
              { value: 'atLeast', label: '最小值' },
              { value: 'exact', label: '固定值' },
            ]}
            onChange={(value) => {
              setRule(value);
              setDirty((current) => ({ ...current, rule: true }));
              setError('');
            }}
          />
          <Select
            aria-label="表格行跨页"
            value={split}
            disabled={blocked}
            options={[
              { value: 'keep', label: '保持各行原值' },
              { value: 'default', label: '默认跨页策略' },
              { value: 'yes', label: '允许行跨页' },
              { value: 'no', label: '禁止行跨页' },
            ]}
            onChange={(value) => {
              setSplit(value);
              setDirty((current) => ({ ...current, split: true }));
              setError('');
            }}
          />
          {(issue || error) && <p role="alert">{issue || error}</p>}
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
              } catch (reason) {
                setError(reason instanceof Error ? reason.message : '行属性未应用。');
              }
            }}
          >
            应用行属性
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
