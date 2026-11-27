'use client';

import * as React from 'react';
import { Button } from '../Button';
import { Input } from '../Input';
import { Modal } from '../Modal';
import { Select } from '../Select';
import {
  studioFormatNumber,
  studioNumberFormatColor,
  studioNumberFormatWithLocale,
  studioValidateNumberFormat,
  type StudioNumberFormatLocale,
} from './studio-number-format';

export interface SheetNumberFormatDialogState {
  sheetId: string;
  selection: import('./studio-sheet-model').SheetSelection;
  code: string;
  mixed: boolean;
  value: string | number | boolean;
  error?: string;
}

export function StudioSheetNumberFormatDialog({
  state,
  blocked,
  onClose,
  onSave,
}: {
  state: SheetNumberFormatDialogState;
  blocked: boolean;
  onClose(): void;
  onSave(code: string): void;
}) {
  const [code, setCode] = React.useState(state.code);
  const [locale, setLocale] = React.useState<StudioNumberFormatLocale>('original');
  const [saveError, setSaveError] = React.useState('');
  let effective = code;
  let issue = '';
  try {
    effective = studioValidateNumberFormat(studioNumberFormatWithLocale(code, locale));
  } catch (reason) {
    issue = reason instanceof Error ? reason.message : '格式代码无效。';
  }
  const samples: Array<[string, string | number | boolean, string?]> = [
    ['选中值', state.value, state.error],
    ['正数', 1234.56],
    ['负数', -1234.56],
    ['零', 0],
    ['文本', '文本'],
    ['日期时间', 45351.75],
  ];
  function preview(value: string | number | boolean, error?: string) {
    if (issue) return '—';
    if (error) return error;
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    try {
      return studioFormatNumber(effective, value);
    } catch {
      return String(value);
    }
  }
  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Modal.Content size="sm" className="zuvi-studio-sheet-number-dialog">
        <Modal.Header>
          <Modal.Title>自定义数字格式</Modal.Title>
          <Modal.Close />
        </Modal.Header>
        <Modal.Body>
          {state.mixed && <p>选区包含多种格式，应用后将统一使用此格式。</p>}
          <label>
            格式代码
            <Input.Textarea
              rows={2}
              aria-label="数字格式代码"
              value={code}
              spellCheck={false}
              disabled={blocked}
              onChange={(event) => {
                setCode(event.target.value);
                setSaveError('');
              }}
            />
          </label>
          <p className="zuvi-studio-sheet-number-help">
            用分号分隔正数、负数、零和文本；文字用双引号括起，@ 表示文本。
          </p>
          <Select
            aria-label="格式地区"
            value={locale}
            disabled={blocked}
            options={[
              { value: 'original', label: '保留代码中的地区' },
              { value: 'en-US', label: '英语（美国）' },
              { value: 'zh-CN', label: '中文（中国）' },
            ]}
            onChange={(value) => {
              setLocale(value as StudioNumberFormatLocale);
              setSaveError('');
            }}
          />
          <div className="zuvi-studio-sheet-number-examples">
            {[
              '0.00;[Red](0.00);"零";"文本："@',
              'yyyy-mm-dd hh:mm:ss',
              'dddd, mmmm d, yyyy',
              '[h]:mm:ss',
            ].map((sample) => (
              <Button
                key={sample}
                variant="ghost"
                size="sm"
                disabled={blocked}
                onClick={() => {
                  setCode(sample);
                  setSaveError('');
                }}
              >
                {sample}
              </Button>
            ))}
          </div>
          <dl
            aria-label="数字格式预览"
            aria-live="polite"
            className="zuvi-studio-sheet-number-preview"
          >
            {samples.map(([label, value, error]) => (
              <React.Fragment key={label}>
                <dt>{label}</dt>
                <dd
                  style={{
                    color: issue ? undefined : studioNumberFormatColor(effective, value, error),
                  }}
                >
                  {preview(value, error)}
                </dd>
              </React.Fragment>
            ))}
          </dl>
          {(issue || saveError) && (
            <p role="alert" className="zuvi-studio-sheet-rule-error">
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
                onSave(effective);
                onClose();
              } catch (reason) {
                setSaveError(reason instanceof Error ? reason.message : '格式未应用。');
              }
            }}
          >
            应用格式
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
