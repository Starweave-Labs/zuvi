'use client';

import * as React from 'react';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { Modal } from '../Modal';
import {
  studioColumnLabel,
  studioSelectionBounds,
  type SheetSelection,
} from './studio-sheet-model';
import type { StudioExcelDocument } from './studio-types';

export interface SheetDuplicatesDialogState {
  document: StudioExcelDocument;
  sheetId: string;
  sheetName: string;
  selection: SheetSelection;
  labels: string[];
}

export function StudioSheetDuplicatesDialog({
  state,
  blocked,
  onClose,
  onSave,
}: {
  state: SheetDuplicatesDialogState;
  blocked: boolean;
  onClose(): void;
  onSave(options: { columns: number[]; header: boolean }): void;
}) {
  const formId = React.useId();
  const range = studioSelectionBounds(state.selection);
  const available = Array.from(
    { length: range.lastCol - range.firstCol + 1 },
    (_, i) => range.firstCol + i
  );
  const [columns, setColumns] = React.useState(available);
  const [header, setHeader] = React.useState(true);
  const [saveError, setSaveError] = React.useState('');
  const composing = React.useRef(false);
  const issue = columns.length === 0 ? '请至少选择一列用于比较。' : '';
  const apply = () => {
    if (blocked || issue || composing.current) return;
    try {
      onSave({ columns, header });
      onClose();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '无法删除重复项。');
    }
  };
  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Modal.Content size="sm" className="zuvi-studio-sheet-duplicates-dialog">
        <Modal.Header>
          <Modal.Title>删除重复项</Modal.Title>
          <Modal.Description>
            {state.sheetName} · {studioColumnLabel(range.firstCol)}
            {range.firstRow}:{studioColumnLabel(range.lastCol)}
            {range.lastRow}
          </Modal.Description>
          <Modal.Close />
        </Modal.Header>
        <Modal.Body>
          <p>保留第一条记录，将选区内数据向上移动并清空尾部；选区外内容保持原样。</p>
          <form
            id={formId}
            onSubmit={(event) => {
              event.preventDefault();
              apply();
            }}
            onCompositionStart={() => {
              composing.current = true;
            }}
            onCompositionEnd={() => {
              composing.current = false;
            }}
          >
            <Checkbox
              checked={header}
              disabled={blocked}
              label="首行作为标题，不参与比较"
              onChange={(value) => {
                setHeader(value);
                setSaveError('');
              }}
            />
            <fieldset disabled={blocked}>
              <legend>比较列</legend>
              <div className="zuvi-studio-sheet-duplicate-actions">
                <Button
                  size="sm"
                  variant="ghost"
                  type="button"
                  disabled={blocked}
                  onClick={() => {
                    setColumns(available);
                    setSaveError('');
                  }}
                >
                  全选列
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  type="button"
                  disabled={blocked}
                  onClick={() => {
                    setColumns([]);
                    setSaveError('');
                  }}
                >
                  取消全选列
                </Button>
              </div>
              <div className="zuvi-studio-sheet-duplicate-columns">
                {available.map((column, index) => {
                  const label = studioColumnLabel(column);
                  return (
                    <Checkbox
                      key={column}
                      checked={columns.includes(column)}
                      disabled={blocked}
                      label={
                        label +
                        ' 列' +
                        (header && state.labels[index] ? ' · ' + state.labels[index] : '')
                      }
                      onChange={(checked) => {
                        setColumns((previous) =>
                          checked
                            ? [...previous, column].sort((a, b) => a - b)
                            : previous.filter((item) => item !== column)
                        );
                        setSaveError('');
                      }}
                    />
                  );
                })}
              </div>
            </fieldset>
            <p>
              按实际值和类型比较；文本区分大小写及空格，数字与文本分别比较，空白与文本空串分别比较。
            </p>
            {(issue || saveError) && (
              <p role="alert" className="zuvi-studio-sheet-rule-error">
                {issue || saveError}
              </p>
            )}
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button type="submit" form={formId} disabled={blocked || !!issue}>
            删除重复记录
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
