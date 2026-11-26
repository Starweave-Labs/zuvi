'use client';
import * as React from 'react';
import type { Editor } from '@tiptap/react';
import { Button } from '../Button';
import { Input } from '../Input';
import { Modal } from '../Modal';
import {
  wordCellTable,
  wordSelectedCellPositions,
  wordSetCellProperties,
} from './studio-word-cell-command';
import { wordCellProperties, type WordCellProperties } from './studio-word-cell-properties';
import {
  wordEffectiveCellMargins,
  wordMergeTableProperties,
  type WordTablePropertiesPatch,
} from './studio-word-table-properties';

const sides = ['top', 'right', 'bottom', 'left'] as const;
const labels = ['上', '右', '下', '左'];
type Values = Record<(typeof sides)[number], string>;
const baseline = { top: 0, right: 5.4, bottom: 0, left: 5.4 };

export function StudioWordCellDialog({
  editor,
  blocked,
  onClose,
}: {
  editor: Editor;
  blocked: boolean;
  onClose: () => void;
}) {
  const [, refresh] = React.useReducer((value) => value + 1, 0);
  React.useEffect(() => {
    const update = () => refresh();
    editor.on('transaction', update);
    editor.on('update', update);
    editor.on('destroy', update);
    const dom = editor.view.dom;
    dom.addEventListener('compositionstart', update);
    dom.addEventListener('compositionend', update);
    return () => {
      editor.off('transaction', update);
      editor.off('update', update);
      editor.off('destroy', update);
      dom.removeEventListener('compositionstart', update);
      dom.removeEventListener('compositionend', update);
    };
  }, [editor]);
  const [snapshot] = React.useState(() => ({
    doc: editor.state.doc,
    selection: editor.state.selection,
    table: wordCellTable(editor)!,
    cells: wordSelectedCellPositions(editor).map((pos) => editor.state.doc.nodeAt(pos)!),
  }));
  const [margins, setMargins] = React.useState<Values>(
    () =>
      Object.fromEntries(
        sides.map((side) => {
          const values = snapshot.cells.map((cell) => cell.attrs.cellMargins?.[side]);
          return [
            side,
            values.length && values.every((value) => value === values[0]) && values[0] !== undefined
              ? String(values[0])
              : '',
          ];
        })
      ) as Values
  );
  const [defaults, setDefaults] = React.useState<Values>(
    () =>
      Object.fromEntries(
        sides.map((side) => [
          side,
          String(snapshot.table.node.attrs.defaultCellMargins?.[side] ?? ''),
        ])
      ) as Values
  );
  const [spacing, setSpacing] = React.useState(String(snapshot.table.node.attrs.cellSpacing ?? ''));
  const [dirtyMargins, setDirtyMargins] = React.useState<
    Partial<Record<(typeof sides)[number], boolean>>
  >({});
  const [dirtyDefaults, setDirtyDefaults] = React.useState<
    Partial<Record<(typeof sides)[number], boolean>>
  >({});
  const [dirtySpacing, setDirtySpacing] = React.useState(false);
  const [restore, setRestore] = React.useState(false);
  const [alignment, setAlignment] = React.useState<{
    vertical: 'top' | 'center' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  } | null>(null);
  const [error, setError] = React.useState(''),
    [composing, setComposing] = React.useState(false);
  const disabled =
    blocked ||
    composing ||
    editor.isDestroyed ||
    !editor.isEditable ||
    editor.view.composing ||
    editor.state.doc !== snapshot.doc;
  const effective = snapshot.cells.map((cell) =>
    wordEffectiveCellMargins(snapshot.table.node.attrs, cell.attrs, baseline)
  );
  const parse = (value: string) => {
    if (!/^\d+(?:\.\d+)?$/.test(value)) throw new Error('请输入有效的单元格边距或间距。');
    return Number(value);
  };
  const save = () => {
    if (disabled || !editor.isEditable || editor.view.composing) return;
    try {
      const patch: WordCellProperties = {
        ...(alignment ? { verticalAlign: alignment.vertical } : {}),
      };
      if (restore) patch.cellMargins = null;
      else {
        const values = Object.fromEntries(
          sides
            .filter((side) => dirtyMargins[side] && margins[side] !== '')
            .map((side) => [side, parse(margins[side])])
        );
        if (Object.keys(values).length) patch.cellMargins = values;
      }
      const tablePatch: WordTablePropertiesPatch = {};
      const changedDefaults = Object.fromEntries(
        sides
          .filter((side) => dirtyDefaults[side])
          .map((side) => [side, defaults[side] === '' ? null : parse(defaults[side])])
      );
      if (Object.keys(changedDefaults).length) tablePatch.defaultCellMargins = changedDefaults;
      if (dirtySpacing) tablePatch.cellSpacing = spacing === '' ? null : parse(spacing);
      // Validate the whole draft before restoring selection or dispatching any change.
      wordCellProperties(patch);
      wordMergeTableProperties(snapshot.table.node.attrs, tablePatch);
      editor.view.dispatch(
        editor.state.tr.setSelection(snapshot.selection).setMeta('addToHistory', false)
      );
      wordSetCellProperties(editor, patch, alignment?.horizontal, tablePatch);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '单元格属性无效。');
    }
  };
  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Modal.Content size="sm">
        <Modal.Header>
          <Modal.Title>单元格对齐与边距</Modal.Title>
          <Modal.Close />
        </Modal.Header>
        <Modal.Body>
          <div aria-label="九宫格对齐" className="zuvi-studio-word-cell-align-grid">
            {(['top', 'center', 'bottom'] as const).flatMap((vertical, row) =>
              (['left', 'center', 'right'] as const).map((horizontal, col) => {
                const label = `${['上', '中', '下'][row]}${['左', '中', '右'][col]}对齐`;
                const selected =
                  alignment?.vertical === vertical && alignment.horizontal === horizontal;
                return (
                  <Button
                    key={label}
                    aria-label={label}
                    aria-pressed={selected}
                    variant={selected ? 'primary' : 'outline'}
                    disabled={disabled}
                    onClick={() => setAlignment({ vertical, horizontal })}
                  >
                    {label}
                  </Button>
                );
              })
            )}
          </div>
          <p>
            所选 {snapshot.cells.length} 个单元格。未选择对齐或留空直接边距会保留原属性；单位为磅。
          </p>
          <div
            role="group"
            aria-label="单元格直接内边距"
            className="zuvi-studio-word-cell-margins-grid"
          >
            {sides.map((side, index) => (
              <label key={side}>
                {labels[index]}内边距
                <Input
                  aria-label={`单元格${side}内边距`}
                  value={margins[side]}
                  placeholder={
                    effective.every((value) => value[side] === effective[0][side])
                      ? `继承 ${effective[0][side]}`
                      : '混合值'
                  }
                  disabled={disabled || restore}
                  onChange={(event) => {
                    setMargins((values) => ({ ...values, [side]: event.target.value }));
                    setDirtyMargins((values) => ({ ...values, [side]: true }));
                  }}
                  onCompositionStart={() => setComposing(true)}
                  onCompositionEnd={() => setComposing(false)}
                />
              </label>
            ))}
          </div>
          <Button
            disabled={disabled}
            aria-pressed={restore}
            variant={restore ? 'primary' : 'outline'}
            onClick={() => setRestore((value) => !value)}
          >
            恢复表格默认边距
          </Button>
          {restore && <p role="status">应用后所选单元格将继承表格默认内边距。</p>}
          <p>当前表格默认内边距</p>
          <div
            role="group"
            aria-label="表格默认内边距"
            className="zuvi-studio-word-cell-margins-grid"
          >
            {sides.map((side, index) => (
              <label key={side}>
                {labels[index]}默认内边距
                <Input
                  aria-label={`表格默认${side}内边距`}
                  value={defaults[side]}
                  disabled={disabled}
                  onChange={(event) => {
                    setDefaults((values) => ({ ...values, [side]: event.target.value }));
                    setDirtyDefaults((values) => ({ ...values, [side]: true }));
                  }}
                  onCompositionStart={() => setComposing(true)}
                  onCompositionEnd={() => setComposing(false)}
                />
              </label>
            ))}
          </div>
          <label>
            整张表格的单元格间距
            <Input
              aria-label="单元格间距"
              value={spacing}
              disabled={disabled}
              onChange={(event) => {
                setSpacing(event.target.value);
                setDirtySpacing(true);
              }}
              onCompositionStart={() => setComposing(true)}
              onCompositionEnd={() => setComposing(false)}
            />
          </label>
          {error && <p role="alert">{error}</p>}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={onClose}>取消</Button>
          <Button disabled={disabled} onClick={save}>
            应用单元格属性
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
