'use client';

import * as React from 'react';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { Modal } from '../Modal';

/** 值列表弹窗最多列出的不同显示值数量；超出部分折叠为提示。 */
export const STUDIO_FILTER_VALUES_LIMIT = 500;

export interface SheetFilterValuesDialogState {
  column: string;
  range: string;
  /** Distinct display tokens for the column; '' renders as （空白）. */
  options: readonly string[];
  /** Distinct tokens omitted because the column exceeded the listing limit. */
  truncated: number;
  selected: readonly string[];
}

export function StudioSheetFilterValuesDialog({
  state,
  blocked,
  onClose,
  onSave,
}: {
  state: SheetFilterValuesDialogState;
  blocked: boolean;
  onClose(): void;
  onSave(selected: string[]): void;
}) {
  const formId = React.useId();
  const [selected, setSelected] = React.useState<string[]>([...state.selected]);
  const [saveError, setSaveError] = React.useState('');
  const label = (value: string) => (value === '' ? '（空白）' : value);
  const apply = () => {
    if (blocked) return;
    try {
      onSave(selected);
      onClose();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '无法应用值列表筛选。');
    }
  };
  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Modal.Content size="sm" className="zuvi-studio-sheet-filter-values-dialog">
        <Modal.Header>
          <Modal.Title>筛选值列表</Modal.Title>
          <Modal.Description>
            {state.column} 列 · {state.range}
          </Modal.Description>
          <Modal.Close />
        </Modal.Header>
        <Modal.Body>
          <p>勾选要显示的值；取消勾选的行会被隐藏，清空全部勾选等于清除该列筛选条件。</p>
          <form
            id={formId}
            onSubmit={(event) => {
              event.preventDefault();
              apply();
            }}
          >
            <div className="zuvi-studio-sheet-duplicate-actions">
              <Button
                size="sm"
                variant="ghost"
                type="button"
                disabled={blocked}
                onClick={() => {
                  setSelected([...state.options]);
                  setSaveError('');
                }}
              >
                全选
              </Button>
              <Button
                size="sm"
                variant="ghost"
                type="button"
                disabled={blocked}
                onClick={() => {
                  setSelected([]);
                  setSaveError('');
                }}
              >
                全不选
              </Button>
              <span>已选 {selected.length} / {state.options.length}</span>
            </div>
            <div className="zuvi-studio-sheet-filter-values-list">
              {state.options.map((option) => (
                <Checkbox
                  key={option}
                  checked={selected.includes(option)}
                  disabled={blocked}
                  label={label(option)}
                  onChange={(checked) => {
                    setSelected((previous) =>
                      checked
                        ? [...previous, option]
                        : previous.filter((entry) => entry !== option)
                    );
                    setSaveError('');
                  }}
                />
              ))}
            </div>
            {state.truncated > 0 && (
              <p>该列还有 {state.truncated} 个不同值未列出，请缩小筛选区域或先用其他条件过滤。</p>
            )}
            {saveError && (
              <p role="alert" className="zuvi-studio-sheet-rule-error">
                {saveError}
              </p>
            )}
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button type="submit" form={formId} disabled={blocked}>
            应用值列表
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
