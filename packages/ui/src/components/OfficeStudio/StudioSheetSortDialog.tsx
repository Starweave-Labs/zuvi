'use client';

import * as React from 'react';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { Modal } from '../Modal';
import { Select } from '../Select';
import { studioColumnLabel } from './studio-sheet-model';
import type { StudioSortKey } from './studio-sheet-model';

export interface StudioSortDialogState {
  /** Column indexes available inside the current selection (1-based). */
  firstCol: number;
  lastCol: number;
  /** Active column when the dialog opened; becomes the first sort key. */
  activeColumn: number;
}

interface SortDialogProps {
  state: StudioSortDialogState;
  sheetName: string;
  blocked: boolean;
  onClose(): void;
  onApply(keys: StudioSortKey[], header: boolean): void;
}

/** 多关键字排序对话框：层级式排序键列表，键列限定在当前选区内。 */
export function StudioSheetSortDialog({ state, sheetName, blocked, onClose, onApply }: SortDialogProps) {
  const formId = React.useId();
  const columnOptions = React.useMemo(() => {
    const options: { value: string; label: string }[] = [];
    for (let column = state.firstCol; column <= state.lastCol; column++) {
      const label = studioColumnLabel(column);
      options.push({ value: String(column), label: `${label} 列` });
    }
    return options;
  }, [state.firstCol, state.lastCol]);

  const initialKeys = React.useMemo<StudioSortKey[]>(() => {
    const active = Math.min(Math.max(state.activeColumn, state.firstCol), state.lastCol);
    return [{ column: active, direction: 'asc' }];
  }, [state]);

  const [keys, setKeys] = React.useState<StudioSortKey[]>(initialKeys);
  const [header, setHeader] = React.useState(true);

  const updateKey = (index: number, patch: Partial<StudioSortKey>) => {
    setKeys((previous) =>
      previous.map((key, position) => (position === index ? { ...key, ...patch } : key))
    );
  };
  const moveKey = (index: number, delta: -1 | 1) => {
    setKeys((previous) => {
      const target = index + delta;
      if (target < 0 || target >= previous.length) return previous;
      const next = [...previous];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };
  const removeKey = (index: number) => {
    setKeys((previous) => previous.filter((_, position) => position !== index));
  };
  const addKey = () => {
    setKeys((previous) => {
      if (previous.length >= state.lastCol - state.firstCol + 1) return previous;
      const used = new Set(previous.map((key) => key.column));
      const nextColumn =
        Array.from({ length: state.lastCol - state.firstCol + 1 }, (_, offset) => state.firstCol + offset).find(
          (column) => !used.has(column)
        ) ?? state.firstCol;
      return [...previous, { column: nextColumn, direction: 'asc' }];
    });
  };

  const apply = () => {
    if (blocked || keys.length === 0) return;
    onApply(keys, header);
  };

  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Modal.Content size="md" className="zuvi-studio-sheet-sort-dialog">
        <Modal.Header>
          <Modal.Title>多关键字排序</Modal.Title>
          <Modal.Description>
            {sheetName} · 排序键从上到下依次生效，先按首键排列，值相同再比较下一键。
          </Modal.Description>
          <Modal.Close />
        </Modal.Header>
        <Modal.Body>
          <form
            id={formId}
            onSubmit={(event) => {
              event.preventDefault();
              apply();
            }}
          >
            {keys.map((key, index) => (
              <div
                key={index}
                role="group"
                aria-label={`排序键 ${index + 1}`}
                className="zuvi-studio-sheet-sort-level"
              >
                <span className="zuvi-studio-sheet-sort-level-index">{index + 1}</span>
                <Select
                  size="sm"
                  aria-label={`排序键 ${index + 1} 的列`}
                  value={String(key.column)}
                  disabled={blocked}
                  options={columnOptions}
                  onChange={(value) => updateKey(index, { column: Number(value) })}
                />
                <Select
                  size="sm"
                  aria-label={`排序键 ${index + 1} 的方向`}
                  value={key.direction}
                  disabled={blocked}
                  options={[
                    { value: 'asc', label: '升序' },
                    { value: 'desc', label: '降序' },
                  ]}
                  onChange={(value) =>
                    updateKey(index, { direction: value as StudioSortKey['direction'] })
                  }
                />
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`上移排序键 ${index + 1}`}
                  disabled={blocked || index === 0}
                  onClick={() => moveKey(index, -1)}
                >
                  ↑
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`下移排序键 ${index + 1}`}
                  disabled={blocked || index === keys.length - 1}
                  onClick={() => moveKey(index, 1)}
                >
                  ↓
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`删除排序键 ${index + 1}`}
                  disabled={blocked || keys.length === 1}
                  onClick={() => removeKey(index)}
                >
                  删除
                </Button>
              </div>
            ))}
            <div className="zuvi-studio-sheet-sort-actions">
              <Button
                size="sm"
                variant="outline"
                type="button"
                disabled={blocked || keys.length >= state.lastCol - state.firstCol + 1}
                onClick={addKey}
              >
                添加排序键
              </Button>
            </div>
            <Checkbox
              checked={header}
              disabled={blocked}
              onChange={(checked) => setHeader(checked)}
              label="首行作为标题，不参与排序"
            />
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Modal.Close>关闭</Modal.Close>
          <Button
            size="sm"
            variant="primary"
            type="submit"
            form={formId}
            disabled={blocked || keys.length === 0}
          >
            应用排序
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
