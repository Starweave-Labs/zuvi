'use client';
import * as React from 'react';
import { Button } from '../Button';
import { Input } from '../Input';
import { Modal } from '../Modal';
import { Select } from '../Select';
import { wordMergeTabStops, wordTabStops, type StudioWordTabStop } from './studio-word-tabs';

export interface WordTabPatch {
  stops: StudioWordTabStop[];
  clearAll: boolean;
}
const alignments = [
  { value: 'left', label: '左对齐' }, { value: 'center', label: '居中' },
  { value: 'right', label: '右对齐' }, { value: 'decimal', label: '小数点对齐' },
];
const leaders = [
  { value: 'none', label: '无' }, { value: 'dot', label: '点线 ……' },
  { value: 'hyphen', label: '短线 ----' }, { value: 'underscore', label: '实线 ____' },
  { value: 'middleDot', label: '中点 ····' },
];

export function StudioWordTabsDialog({ values, defaultTabStop = 36, blocked, onClose, onSave }: {
  values: StudioWordTabStop[] | null;
  defaultTabStop?: number;
  blocked: boolean;
  onClose(): void;
  onSave(patch: WordTabPatch): void;
}) {
  const [patch, setPatch] = React.useState<WordTabPatch>({ stops: [], clearAll: false });
  const [position, setPosition] = React.useState('');
  const [alignment, setAlignment] = React.useState('left');
  const [leader, setLeader] = React.useState('none');
  const [selected, setSelected] = React.useState<number | null>(null);
  const [draftDirty, setDraftDirty] = React.useState(false);
  const [saveError, setSaveError] = React.useState('');
  const visible = wordMergeTabStops(patch.clearAll ? [] : values, patch.stops)
    .filter((stop) => stop.alignment !== 'clear');
  let issue = '';
  let candidate: StudioWordTabStop | null = null;
  if (position !== '') {
    try {
      if (!/^\+?(?:\d+(?:\.\d*)?|\.\d+)$/.test(position.trim())) throw new Error('制表位位置须为数字。');
      candidate = wordTabStops([{ position: Number(position), alignment, leader }])[0];
    } catch (error) { issue = error instanceof Error ? error.message : '制表位位置无效。'; }
  } else if (draftDirty) issue = '请填写制表位位置，或清空草稿。';
  const change = (action: () => void) => {
    action(); setDraftDirty(true); setSaveError('');
  };
  const merge = (stops: StudioWordTabStop[]) => {
    try {
      const next = wordMergeTabStops(patch.stops, stops);
      wordMergeTabStops(patch.clearAll ? [] : values, next);
      setPatch({ ...patch, stops: next }); setSaveError(''); return true;
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '制表位未设置。'); return false;
    }
  };
  const add = () => {
    if (!candidate || issue || blocked) return;
    if (!merge([
      ...(selected !== null && selected !== candidate.position ? [{ position: selected, alignment: 'clear' as const }] : []),
      candidate,
    ])) return;
    setSelected(candidate.position); setDraftDirty(false);
  };
  return (
    <Modal open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Content size="sm" className="zuvi-studio-word-tabs-dialog">
        <Modal.Header><Modal.Title>制表位</Modal.Title><Modal.Close /></Modal.Header>
        <Modal.Body>
          <p>位置从正文或单元格左边缘计算。当前默认每 {defaultTabStop}pt 一个制表位；修改只影响所选段落。</p>
          {values === null && !patch.clearAll && <p role="status">所选段落制表位不同；新增或清除位置会分别应用并保留其他制表位。</p>}
          <div className="zuvi-studio-word-tabs-list" aria-label="已设置制表位">
            {visible.length ? visible.map((stop) => (
              <Button key={stop.position} variant="ghost" size="sm" disabled={blocked}
                aria-pressed={selected === stop.position}
                onClick={() => {
                  setSelected(stop.position); setPosition(String(stop.position));
                  setAlignment(stop.alignment); setLeader(stop.leader ?? 'none');
                  setDraftDirty(false); setSaveError('');
                }}>
                {stop.position}pt · {alignments.find((item) => item.value === stop.alignment)?.label} · {leaders.find((item) => item.value === (stop.leader ?? 'none'))?.label}
              </Button>
            )) : <p>没有共同的自定义制表位。</p>}
          </div>
          <label>制表位位置（pt）<Input aria-label="制表位位置（pt）" inputMode="decimal" disabled={blocked}
            value={position} onChange={(event) => change(() => setPosition(event.target.value))} /></label>
          <div className="zuvi-studio-word-paragraph-fields">
            <label>对齐<Select aria-label="制表位对齐" disabled={blocked} value={alignment} options={alignments}
              onChange={(value) => change(() => setAlignment(value))} /></label>
            <label>前导符<Select aria-label="制表位前导符" disabled={blocked} value={leader} options={leaders}
              onChange={(value) => change(() => setLeader(value))} /></label>
          </div>
          <div className="zuvi-studio-word-tabs-actions">
            <Button variant="secondary" size="sm" disabled={blocked || !candidate || !!issue} onClick={add}>设置制表位</Button>
            <Button variant="ghost" size="sm" disabled={blocked || selected === null} onClick={() => {
              if (selected === null) return;
              merge([{ position: selected, alignment: 'clear' }]);
              setSelected(null); setPosition(''); setDraftDirty(false);
            }}>清除所选</Button>
            <Button variant="ghost" size="sm" disabled={blocked} onClick={() => {
              setPatch({ stops: [], clearAll: true }); setSelected(null);
              setPosition(''); setDraftDirty(false); setSaveError('');
            }}>全部清除</Button>
            <Button variant="ghost" size="sm" disabled={blocked || !position} onClick={() => {
              setPosition(''); setSelected(null); setDraftDirty(false); setSaveError('');
            }}>清空草稿</Button>
          </div>
          {(issue || saveError) && <p role="alert" className="zuvi-studio-word-character-error">{issue || saveError}</p>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button disabled={blocked || !!issue} onClick={() => {
            if (blocked || issue) return;
            try {
              const stops = draftDirty && candidate ? wordMergeTabStops(patch.stops, [
                ...(selected !== null && selected !== candidate.position ? [{ position: selected, alignment: 'clear' as const }] : []), candidate,
              ]) : patch.stops;
              onSave({ ...patch, stops }); onClose();
            } catch (error) { setSaveError(error instanceof Error ? error.message : '制表位未应用。'); }
          }}>应用制表位</Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
