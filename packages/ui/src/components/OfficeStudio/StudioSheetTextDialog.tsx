'use client';

import * as React from 'react';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { Input } from '../Input';
import { Modal } from '../Modal';
import { Select } from '../Select';
import { StudioSheetText } from './StudioSheetText';
import { sheetLayoutText, type SheetTextLayoutInput } from './studio-sheet-text-layout';
import {
  sheetApplyTextFormatPatch,
  type SheetTextFormatPatch,
  type SheetTextInteractionField,
} from './studio-sheet-text-properties';
import type { SheetSelection } from './studio-sheet-model';
import type { StudioExcelDocument } from './studio-types';

export interface SheetTextFormatOperation {
  patch: SheetTextFormatPatch;
  lastChanged?: SheetTextInteractionField;
}
export interface SheetTextDialogState {
  document: StudioExcelDocument;
  sheetId: string;
  selection: SheetSelection;
  input: SheetTextLayoutInput;
  mixed: boolean;
}
const horizontal = [
  ['general', '常规'],
  ['left', '左对齐'],
  ['center', '居中'],
  ['right', '右对齐'],
  ['fill', '填充'],
  ['justify', '两端对齐'],
  ['centerContinuous', '跨选区居中'],
  ['distributed', '分散对齐'],
].map(([value, label]) => ({ value, label }));
const vertical = [
  ['top', '顶端'],
  ['middle', '居中'],
  ['bottom', '底端'],
  ['justify', '两端对齐'],
  ['distributed', '分散对齐'],
].map(([value, label]) => ({ value, label }));

export function StudioSheetTextDialog({
  state,
  blocked,
  onClose,
  onSave,
  onIssueChange,
}: {
  state: SheetTextDialogState;
  blocked: boolean;
  onClose(): void;
  onSave(operations: readonly SheetTextFormatOperation[]): void;
  onIssueChange(issue: string): void;
}) {
  const [operations, setOperations] = React.useState<SheetTextFormatOperation[]>([]);
  const [indent, setIndent] = React.useState(String(state.input.format.indent ?? 0));
  const [angle, setAngle] = React.useState(
    String(
      typeof state.input.format.textRotation === 'number' ? state.input.format.textRotation : 0
    )
  );
  const [pending, setPending] = React.useState({ indent: false, angle: false });
  const [saveError, setSaveError] = React.useState('');
  const composing = React.useRef(false);
  const draft = operations.reduce(
    (format, operation) =>
      sheetApplyTextFormatPatch(
        format,
        operation.patch,
        operation.lastChanged,
        state.document.defaultFont
      ),
    state.input.format
  );
  const parse = (text: string, minimum: number, maximum: number) =>
    /^[-+]?\d+$/.test(text.trim()) && Number(text) >= minimum && Number(text) <= maximum
      ? Number(text)
      : undefined;
  const indentValue = parse(indent, 0, 250);
  const angleValue = parse(angle, -90, 90);
  const issue =
    pending.indent && indentValue === undefined
      ? '缩进须为 0 至 250 之间的整数。'
      : pending.angle && angleValue === undefined
        ? '文字旋转须为 -90 至 90 之间的整数。'
        : '';
  React.useEffect(() => {
    onIssueChange(issue);
  }, [issue, onIssueChange]);
  const previewFormat = issue
    ? draft
    : {
        ...draft,
        ...(pending.indent ? { indent: indentValue } : {}),
        ...(pending.angle ? { textRotation: angleValue } : {}),
      };
  const preview = sheetLayoutText({
    ...state.input,
    format: previewFormat,
    box: { ...state.input.box, width: 240, height: 112 },
    display: state.input.display || '文字排版预览 ABC 123',
  });
  function append(patch: SheetTextFormatPatch, lastChanged?: SheetTextInteractionField) {
    if (issue || blocked) return;
    const additions: SheetTextFormatOperation[] = [];
    if (pending.indent && indentValue !== undefined && lastChanged !== 'indent')
      additions.push({ patch: { indent: indentValue }, lastChanged: 'indent' });
    if (pending.angle && angleValue !== undefined && lastChanged !== 'textRotation')
      additions.push({ patch: { textRotation: angleValue }, lastChanged: 'textRotation' });
    additions.push({ patch, lastChanged });
    const next = additions.reduce(
      (format, operation) =>
        sheetApplyTextFormatPatch(
          format,
          operation.patch,
          operation.lastChanged,
          state.document.defaultFont
        ),
      draft
    );
    setOperations((current) => [...current, ...additions]);
    setIndent(String(next.indent ?? 0));
    setAngle(String(typeof next.textRotation === 'number' ? next.textRotation : 0));
    setPending({ indent: false, angle: false });
    setSaveError('');
  }
  function flushNumeric(field: 'indent' | 'angle') {
    if (composing.current) return;
    if (!pending[field]) return;
    const value = field === 'indent' ? indentValue : angleValue;
    if (value === undefined) return;
    append(
      field === 'indent' ? { indent: value } : { textRotation: value },
      field === 'indent' ? 'indent' : 'textRotation'
    );
  }
  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Modal.Content size="md" className="zuvi-studio-sheet-text-dialog">
        <Modal.Header>
          <Modal.Title>单元格文字排版</Modal.Title>
          <Modal.Close />
        </Modal.Header>
        <Modal.Body>
          {state.mixed && (
            <p className="zuvi-studio-sheet-text-help">选区有多种格式；只应用本次修改的属性。</p>
          )}
          <div className="zuvi-studio-sheet-text-controls">
            <label>
              水平对齐
              <Select
                aria-label="文字水平对齐"
                options={horizontal}
                value={draft.align ?? 'general'}
                disabled={blocked}
                onChange={(align) =>
                  append({ align: align as NonNullable<SheetTextFormatPatch['align']> }, 'align')
                }
              />
            </label>
            <label>
              垂直对齐
              <Select
                aria-label="文字垂直对齐"
                options={vertical}
                value={draft.verticalAlign ?? 'bottom'}
                disabled={blocked}
                onChange={(verticalAlign) =>
                  append({
                    verticalAlign: verticalAlign as NonNullable<
                      SheetTextFormatPatch['verticalAlign']
                    >,
                  })
                }
              />
            </label>
            <label>
              缩进
              <Input
                aria-label="文字缩进"
                value={indent}
                inputMode="numeric"
                disabled={blocked}
                status={pending.indent && indentValue === undefined ? 'error' : 'default'}
                onChange={(event) => {
                  setIndent(event.target.value);
                  setPending((value) => ({ ...value, indent: true }));
                  setSaveError('');
                }}
                onCompositionStart={() => {
                  composing.current = true;
                }}
                onCompositionEnd={() => {
                  composing.current = false;
                }}
                onBlur={() => flushNumeric('indent')}
              />
            </label>
            <label>
              文字方向
              <Select
                aria-label="文字方向"
                options={[
                  { value: 'angle', label: '按角度旋转' },
                  { value: 'vertical', label: '竖排文字' },
                ]}
                value={draft.textRotation === 'vertical' ? 'vertical' : 'angle'}
                disabled={blocked}
                onChange={(value) =>
                  append(
                    { textRotation: value === 'vertical' ? 'vertical' : (angleValue ?? 0) },
                    'textRotation'
                  )
                }
              />
            </label>
            {draft.textRotation !== 'vertical' && (
              <label>
                旋转角度
                <Input
                  aria-label="文字旋转角度"
                  value={angle}
                  inputMode="numeric"
                  disabled={blocked}
                  status={pending.angle && angleValue === undefined ? 'error' : 'default'}
                  onChange={(event) => {
                    setAngle(event.target.value);
                    setPending((value) => ({ ...value, angle: true }));
                    setSaveError('');
                  }}
                  onCompositionStart={() => {
                    composing.current = true;
                  }}
                  onCompositionEnd={() => {
                    composing.current = false;
                  }}
                  onBlur={() => flushNumeric('angle')}
                />
              </label>
            )}
            <div className="zuvi-studio-sheet-text-checks">
              <Checkbox
                label="自动换行"
                checked={!!draft.wrap}
                disabled={blocked || !!issue}
                onChange={(wrap) => append({ wrap })}
              />
              <Checkbox
                label="缩小字体填充"
                checked={!!draft.shrinkToFit}
                disabled={blocked || !!issue}
                onChange={(shrinkToFit) => append({ shrinkToFit })}
              />
            </div>
          </div>
          <p className="zuvi-studio-sheet-text-help">
            正角度向上旋转。换行或两端、分散对齐时，保留缩小字体设置并优先换行。
          </p>
          <div className="zuvi-studio-sheet-text-preview" aria-label="文字排版预览">
            <StudioSheetText layout={preview} width={240} height={112} />
          </div>
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
              if (blocked || issue || composing.current) return;
              const final = [...operations];
              if (pending.indent && indentValue !== undefined)
                final.push({ patch: { indent: indentValue }, lastChanged: 'indent' });
              if (pending.angle && angleValue !== undefined)
                final.push({ patch: { textRotation: angleValue }, lastChanged: 'textRotation' });
              try {
                onSave(final);
                onClose();
              } catch (error) {
                setSaveError(error instanceof Error ? error.message : '文字排版未应用。');
              }
            }}
          >
            应用排版
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
