import * as React from 'react';
import { Checkbox } from '../Checkbox';
import { Input } from '../Input';
import { Select } from '../Select';
import { Button } from '../Button';
import { Modal } from '../Modal';
import type { StudioWordImageLayout, StudioWordImagePosition } from './studio-types';
import {
  WORD_IMAGE_HORIZONTAL_BASES,
  WORD_IMAGE_VERTICAL_BASES,
  wordImageLayout,
} from './studio-word-images';
import { wordDefaultImageLayout } from './studio-word-image-preview';

const BASE_NAMES: Record<string, string> = {
  character: '锚点字符',
  column: '正文列',
  insideMargin: '内侧边距',
  leftMargin: '左页边距',
  margin: '页边距',
  outsideMargin: '外侧边距',
  page: '页面',
  rightMargin: '右页边距',
  bottomMargin: '下页边距',
  line: '锚点行',
  paragraph: '锚点段落',
  topMargin: '上页边距',
};
const WRAPS = [
  { value: 'inline', label: '嵌入文字' },
  { value: 'square', label: '四周环绕' },
  { value: 'tight', label: '紧密环绕' },
  { value: 'through', label: '穿越环绕' },
  { value: 'topBottom', label: '上下环绕' },
  { value: 'front', label: '浮于文字上方' },
  { value: 'behind', label: '衬于文字下方' },
];

function LayoutNumber({
  label,
  value,
  min = -10000,
  max = 10000,
  step = 0.5,
  disabled,
  onCommit,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  onCommit(value: number): void;
}) {
  const [draft, setDraft] = React.useState(String(value));
  React.useEffect(() => setDraft(String(value)), [value]);
  const valid =
    draft.trim() !== '' &&
    Number.isFinite(Number(draft)) &&
    Number(draft) >= min &&
    Number(draft) <= max &&
    (step !== 1 || Number.isInteger(Number(draft)));
  const commit = () => {
    if (valid) {
      const amount = Number(draft);
      if (amount !== value) onCommit(amount);
    }
  };
  return (
    <label className="zuvi-studio-word-image-number-label">
      <span>{label}</span>
      <Input
        type="number"
        size="sm"
        aria-label={label}
        title={label}
        min={min}
        max={max}
        step={step}
        className="zuvi-studio-word-image-size"
        value={draft}
        disabled={disabled}
        aria-invalid={!valid || undefined}
        data-studio-input-error={!valid ? `${label}无效，请修正输入或按 Esc 取消。` : undefined}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) return;
          if (event.key === 'Enter') {
            event.preventDefault();
            commit();
          } else if (event.key === 'Escape') {
            event.preventDefault();
            setDraft(String(value));
          }
        }}
      />
    </label>
  );
}

function PositionTools({
  axis,
  value,
  disabled,
  onChange,
}: {
  axis: 'horizontal' | 'vertical';
  value: StudioWordImagePosition;
  disabled: boolean;
  onChange(position: StudioWordImagePosition): void;
}) {
  const horizontal = axis === 'horizontal';
  const label = horizontal ? '水平' : '垂直';
  return (
    <fieldset className="zuvi-studio-word-image-position-axis">
      <legend>{label}位置</legend>
      <Select
        size="sm"
        aria-label={`图片${label}基准`}
        value={value.relative}
        disabled={disabled}
        options={(horizontal ? WORD_IMAGE_HORIZONTAL_BASES : WORD_IMAGE_VERTICAL_BASES).map(
          (base) => ({ value: base, label: BASE_NAMES[base] })
        )}
        onChange={(relative) => onChange({ ...value, relative })}
      />
      <Select
        size="sm"
        aria-label={`图片${label}定位`}
        value={value.align || 'offset'}
        disabled={disabled}
        options={[
          { value: 'offset', label: '偏移量（px）' },
          ...(horizontal
            ? [
                { value: 'left', label: '左对齐' },
                { value: 'center', label: '居中' },
                { value: 'right', label: '右对齐' },
              ]
            : [
                { value: 'top', label: '顶部' },
                { value: 'center', label: '居中' },
                { value: 'bottom', label: '底部' },
              ]),
          { value: 'inside', label: '内侧' },
          { value: 'outside', label: '外侧' },
        ]}
        onChange={(mode) =>
          onChange(
            mode === 'offset'
              ? { relative: value.relative, offset: 0 }
              : { relative: value.relative, align: mode }
          )
        }
      />
      {!value.align && (
        <LayoutNumber
          key={axis}
          label={`图片${label}偏移`}
          value={value.offset || 0}
          disabled={disabled}
          onCommit={(offset) => onChange({ relative: value.relative, offset })}
        />
      )}
    </fieldset>
  );
}

export function StudioWordImageLayoutTools({
  layout: input,
  disabled,
  onChange,
}: {
  layout: unknown;
  disabled: boolean;
  onChange(layout: StudioWordImageLayout | null): void;
}) {
  const layout = wordImageLayout(input);
  const [positionOpen, setPositionOpen] = React.useState(false);
  const update = (patch: Partial<StudioWordImageLayout>) => onChange({ ...layout!, ...patch });
  return (
    <div className="zuvi-studio-word-image-layout" role="group" aria-label="图片环绕与位置">
      <Select
        size="sm"
        aria-label="图片文字环绕"
        disabled={disabled}
        value={layout?.wrap || 'inline'}
        options={WRAPS}
        onChange={(wrap) =>
          onChange(
            wrap === 'inline'
              ? null
              : {
                  ...(layout || wordDefaultImageLayout()),
                  wrap: wrap as StudioWordImageLayout['wrap'],
                  ...(!['tight', 'through'].includes(wrap) ? { polygon: undefined } : {}),
                }
          )
        }
      />
      {layout && (
        <Button size="sm" variant="ghost" disabled={disabled} onClick={() => setPositionOpen(true)}>
          图片位置与环绕
        </Button>
      )}
      <Modal open={positionOpen && !disabled && !!layout} onOpenChange={setPositionOpen}>
        <Modal.Content size="lg">
          <Modal.Header>
            <Modal.Title>图片位置与环绕</Modal.Title>
            <Modal.Close />
          </Modal.Header>
          <Modal.Body>
            <div className="zuvi-studio-word-image-position-form">
              {layout && (
                <>
                  <PositionTools
                    axis="horizontal"
                    value={layout.horizontal}
                    disabled={disabled}
                    onChange={(horizontal) => update({ horizontal })}
                  />
                  <PositionTools
                    axis="vertical"
                    value={layout.vertical}
                    disabled={disabled}
                    onChange={(vertical) => update({ vertical })}
                  />
                  {!['front', 'behind', 'topBottom'].includes(layout.wrap) && (
                    <Select
                      size="sm"
                      aria-label="图片环绕侧"
                      value={layout.wrapSide || 'bothSides'}
                      disabled={disabled}
                      options={[
                        { value: 'bothSides', label: '两侧文字' },
                        { value: 'left', label: '仅左侧文字' },
                        { value: 'right', label: '仅右侧文字' },
                        { value: 'largest', label: '较宽一侧' },
                      ]}
                      onChange={(side) =>
                        update({ wrapSide: side as StudioWordImageLayout['wrapSide'] })
                      }
                    />
                  )}
                  <fieldset className="zuvi-studio-word-image-position-axis">
                    <legend>与文字的距离（px）</legend>
                    {(['top', 'right', 'bottom', 'left'] as const).map((side, index) => (
                      <LayoutNumber
                        key={side}
                        label={`图片${['上', '右', '下', '左'][index]}侧文字间距`}
                        min={0}
                        max={1000}
                        value={layout.distance?.[side] || 0}
                        disabled={disabled}
                        onCommit={(amount) =>
                          update({ distance: { ...layout.distance, [side]: amount } })
                        }
                      />
                    ))}
                  </fieldset>
                  <Checkbox
                    label="随文字移动"
                    checked={
                      layout.vertical.relative !== 'page' && layout.vertical.relative !== 'margin'
                    }
                    disabled={disabled}
                    onChange={(move) =>
                      update({
                        vertical: {
                          relative: move ? 'paragraph' : 'page',
                          offset: layout.vertical.offset || 0,
                        },
                      })
                    }
                  />
                  <Checkbox
                    label="锁定锚点"
                    checked={layout.lockAnchor || false}
                    disabled={disabled}
                    onChange={(lockAnchor) => update({ lockAnchor })}
                  />
                  <Checkbox
                    label="允许重叠"
                    checked={layout.allowOverlap !== false}
                    disabled={disabled}
                    onChange={(allowOverlap) => update({ allowOverlap })}
                  />
                  <Checkbox
                    label="表格内布局"
                    checked={layout.layoutInCell !== false}
                    disabled={disabled}
                    onChange={(layoutInCell) => update({ layoutInCell })}
                  />
                  <LayoutNumber
                    label="图片层级"
                    step={1}
                    min={0}
                    max={4294967295}
                    value={layout.zIndex ?? 1}
                    disabled={disabled}
                    onCommit={(zIndex) => {
                      if (Number.isInteger(zIndex)) update({ zIndex });
                    }}
                  />
                </>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={() => setPositionOpen(false)}>完成</Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </div>
  );
}
