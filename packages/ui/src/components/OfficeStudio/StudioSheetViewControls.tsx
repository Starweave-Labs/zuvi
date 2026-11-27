'use client';

import * as React from 'react';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { Input } from '../Input';
import { Select } from '../Select';
import { studioParseSheetZoom, type SheetViewState } from './studio-sheet-view';

export function StudioSheetViewControls({
  view,
  contextKey,
  disabled,
  readOnly,
  onChange,
  onIssueChange,
  onFocusGrid,
}: {
  view: SheetViewState;
  contextKey: string;
  disabled: boolean;
  readOnly: boolean;
  onChange(patch: Partial<SheetViewState>): boolean;
  onIssueChange(issue: string): void;
  onFocusGrid(): void;
}) {
  const [draft, setDraft] = React.useState(String(view.zoom));
  const [issue, setIssue] = React.useState('');
  const draftRef = React.useRef(draft);
  const dirty = React.useRef(false);
  const composing = React.useRef(false);
  const blurPending = React.useRef(false);
  const zoomIssue = '缩放比例须为 25 至 400 之间的整数。';
  const reset = React.useCallback(() => {
    dirty.current = false;
    composing.current = false;
    blurPending.current = false;
    draftRef.current = String(view.zoom);
    setDraft(draftRef.current);
    setIssue('');
  }, [view.zoom]);
  React.useLayoutEffect(() => {
    reset();
    // A new worksheet, permission mode or stored zoom cancels the previous draft.
  }, [reset, contextKey, disabled]);
  React.useEffect(() => {
    onIssueChange(issue);
  }, [issue, onIssueChange]);
  React.useEffect(() => () => onIssueChange(''), [onIssueChange]);
  function commit(focus: boolean) {
    if (disabled || !dirty.current) return;
    if (composing.current) {
      blurPending.current = true;
      setIssue('请先完成缩放输入，再保存文档。');
      return;
    }
    const zoom = studioParseSheetZoom(draftRef.current);
    if (zoom === undefined) {
      setIssue(zoomIssue);
      return;
    }
    // Clear before the host is called: it may synchronously focus and blur us.
    dirty.current = false;
    blurPending.current = false;
    setIssue('');
    if (onChange({ zoom })) {
      draftRef.current = String(zoom);
      setDraft(draftRef.current);
      if (focus) onFocusGrid();
    } else {
      dirty.current = true;
      setIssue('请先确认单元格输入，再调整视图。');
    }
  }
  return (
    <>
      <div className="zuvi-studio-sheet-toolgroup zuvi-studio-sheet-viewgroup">
        <div className="zuvi-studio-sheet-toolrow">
          <Button
            size="sm"
            variant="ghost"
            aria-label="缩小工作表"
            disabled={disabled || view.zoom <= 25 || !!issue}
            onClick={() => onChange({ zoom: Math.max(25, view.zoom - 10) })}
          >
            −
          </Button>
          <Input
            size="sm"
            className="zuvi-studio-sheet-zoom-input"
            aria-label="工作表缩放百分比"
            inputMode="numeric"
            value={draft}
            disabled={disabled}
            status={issue ? 'error' : 'default'}
            aria-invalid={!!issue || undefined}
            data-studio-input-error={(!readOnly && issue) || undefined}
            onChange={(event) => {
              draftRef.current = event.target.value;
              setDraft(draftRef.current);
              dirty.current = true;
              setIssue(studioParseSheetZoom(draftRef.current) === undefined ? zoomIssue : '');
            }}
            onCompositionStart={() => {
              composing.current = true;
            }}
            onCompositionEnd={() => {
              composing.current = false;
              if (blurPending.current) commit(false);
            }}
            onBlur={() => commit(false)}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing || event.keyCode === 229) return;
              if (event.key === 'Enter') {
                event.preventDefault();
                commit(true);
              }
              if (event.key === 'Escape') {
                event.preventDefault();
                reset();
                onFocusGrid();
              }
            }}
          />
          <span aria-hidden="true">%</span>
          <Button
            size="sm"
            variant="ghost"
            aria-label="放大工作表"
            disabled={disabled || view.zoom >= 400 || !!issue}
            onClick={() => onChange({ zoom: Math.min(400, Math.max(25, view.zoom + 10)) })}
          >
            ＋
          </Button>
        </div>
        <Select
          size="sm"
          aria-label="工作表缩放预设"
          value={String(view.zoom)}
          disabled={disabled || !!issue}
          options={[...new Set([25, 50, 75, 100, 125, 150, 200, 300, 400, view.zoom])]
            .sort((a, b) => a - b)
            .map((zoom) => ({ value: String(zoom), label: `${zoom}%`, disabled: zoom < 25 }))}
          onChange={(zoom) => onChange({ zoom: Number(zoom) })}
        />
        <span>{readOnly ? '当前预览缩放' : '缩放'}</span>
      </div>
      <div className="zuvi-studio-sheet-toolgroup zuvi-studio-sheet-viewgroup">
        <Checkbox
          label="显示网格线"
          checked={view.showGridLines}
          disabled={disabled || !!issue}
          onChange={(showGridLines) => onChange({ showGridLines })}
        />
        <Checkbox
          label="显示行列标题"
          checked={view.showRowColHeaders}
          disabled={disabled || !!issue}
          onChange={(showRowColHeaders) => onChange({ showRowColHeaders })}
        />
        <span>{readOnly ? '当前预览显示' : '显示'}</span>
      </div>
      {issue && (
        <p role="alert" className="zuvi-studio-sheet-view-error">
          {issue}
        </p>
      )}
    </>
  );
}
