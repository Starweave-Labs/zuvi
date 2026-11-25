'use client';
import * as React from 'react';
import { Button } from '../Button';
import { Input } from '../Input';
import { Modal } from '../Modal';
import { Select } from '../Select';
import { Checkbox } from '../Checkbox';
import {
  WORD_SURFACE_SIDES,
  WORD_SURFACE_LINES,
  WORD_SHADING_PATTERNS,
  wordSurface,
  wordSurfaceCss,
  wordPatchSurface,
  type StudioWordParagraphSurface,
  type WordSurfacePatch,
  type WordSurfaceSide,
  type StudioWordParagraphBorder,
} from './studio-word-surface';
const sides = {
  top: '上边',
  bottom: '下边',
  left: '左边',
  right: '右边',
  between: '段间',
  bar: '竖线',
};
const lines: Record<string, string> = {
  nil: '无',
  none: '无（none）',
  single: '单线',
  double: '双线',
  dotted: '点线',
  dashed: '虚线',
  dotDash: '点划线',
  dotDotDash: '双点划线',
  thick: '粗线',
  triple: '三线',
  wave: '波浪线',
  doubleWave: '双波浪',
  dashSmallGap: '短虚线',
  dashDotStroked: '斜点划线',
  inset: '凹陷',
  outset: '凸起',
};
type BorderDraft = {
  style: string;
  size: string;
  space: string;
  color: string;
  shadow: boolean;
  frame: boolean;
};
const same = (values: unknown[]) =>
  values.every((value) => JSON.stringify(value) === JSON.stringify(values[0]));
export function StudioWordSurfaceDialog({
  surfaces,
  blocked,
  onClose,
  onSave,
}: {
  surfaces: StudioWordParagraphSurface[];
  blocked: boolean;
  onClose(): void;
  onSave(patch: WordSurfacePatch): void;
}) {
  const [side, setSide] = React.useState<WordSurfaceSide>('top');
  const [drafts, setDrafts] = React.useState<Record<WordSurfaceSide, BorderDraft>>(
    () =>
      Object.fromEntries(
        WORD_SURFACE_SIDES.map((side) => {
          const values = surfaces.map((surface) => surface.borders?.[side]);
          const border = same(values) ? values[0] : undefined;
          return [
            side,
            {
              style: same(values) ? (border?.style ?? 'nil') : 'keep',
              size: String(border?.size ?? 0.5),
              space: String(border?.space ?? 0),
              color: border?.color ?? 'auto',
              shadow: border?.shadow ?? false,
              frame: border?.frame ?? false,
            },
          ];
        })
      ) as Record<WordSurfaceSide, BorderDraft>
  );
  const common = React.useMemo(
    () => (same(surfaces.map((surface) => surface.shading)) ? surfaces[0]?.shading : undefined),
    [surfaces]
  );
  const [pattern, setPattern] = React.useState(
    common?.pattern ?? (same(surfaces.map((surface) => surface.shading)) ? 'clear' : 'keep')
  );
  const [fill, setFill] = React.useState(common?.fill ?? 'auto'),
    [foreground, setForeground] = React.useState(common?.color ?? 'auto');
  const [dirty, setDirty] = React.useState<Record<string, boolean>>({});
  const [error, setError] = React.useState('');
  const change = (key: keyof BorderDraft, value: string | boolean) => {
    setDrafts((all) => ({ ...all, [side]: { ...all[side], [key]: value } }));
    setDirty((all) => ({ ...all, [`${side}.${key}`]: true }));
    setError('');
  };
  const patch: WordSurfacePatch = {};
  let issue = '';
  for (const edge of WORD_SURFACE_SIDES) {
    const values: Partial<StudioWordParagraphBorder> = {};
    for (const key of ['style', 'size', 'space', 'color', 'shadow', 'frame'] as const)
      if (dirty[`${edge}.${key}`]) {
        const value = drafts[edge][key];
        if (key === 'style') {
          if (value !== 'keep') values.style = value as StudioWordParagraphBorder['style'];
        } else if (key === 'size' || key === 'space') {
          if (!/^\d+(?:\.\d+)?$/.test(String(value))) issue = '边框宽度或距离须为数值。';
          else values[key] = Number(value);
        } else if (key === 'color') values.color = String(value);
        else values[key] = Boolean(value);
      }
    if (Object.keys(values).length) (patch.borders ??= {})[edge] = values;
  }
  if (dirty.pattern && pattern !== 'keep') (patch.shading ??= {}).pattern = pattern as never;
  if (dirty.fill) (patch.shading ??= {}).fill = fill;
  if (dirty.foreground) (patch.shading ??= {}).color = foreground;
  try {
    for (const surface of surfaces) wordSurface(wordPatchSurface({}, surface, patch));
  } catch (reason) {
    issue = reason instanceof Error ? reason.message : '边框/底纹无效。';
  }
  const preview = wordPatchSurface(surfaces[0], surfaces[0], issue ? {} : patch);
  const selected = drafts[side];
  const preset = (none: boolean) => {
    setDrafts(
      (all) =>
        Object.fromEntries(
          WORD_SURFACE_SIDES.map((edge) => [edge, { ...all[edge], style: none ? 'nil' : 'single' }])
        ) as Record<WordSurfaceSide, BorderDraft>
    );
    setDirty((all) => ({
      ...all,
      ...Object.fromEntries(WORD_SURFACE_SIDES.map((edge) => [`${edge}.style`, true])),
    }));
  };
  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Modal.Content size="md" className="zuvi-studio-word-surface-dialog">
        <Modal.Header>
          <Modal.Title>段落边框与底纹</Modal.Title>
          <Modal.Close />
        </Modal.Header>
        <Modal.Body>
          <div className="zuvi-studio-word-surface-presets">
            <Button size="sm" variant="secondary" disabled={blocked} onClick={() => preset(true)}>
              清除所有边框
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={blocked}
              onClick={() => {
                setDrafts((all) => ({
                  ...all,
                  ...Object.fromEntries(
                    ['top', 'bottom', 'left', 'right'].map((edge) => [
                      edge,
                      { ...all[edge as WordSurfaceSide], style: 'single' },
                    ])
                  ),
                }));
                setDirty((all) => ({
                  ...all,
                  ...Object.fromEntries(
                    ['top', 'bottom', 'left', 'right'].map((edge) => [`${edge}.style`, true])
                  ),
                }));
              }}
            >
              外边框
            </Button>
          </div>
          <label>
            编辑边位
            <Select
              aria-label="段落边框边位"
              disabled={blocked}
              value={side}
              options={WORD_SURFACE_SIDES.map((edge) => ({ value: edge, label: sides[edge] }))}
              onChange={(value) => setSide(value as WordSurfaceSide)}
            />
          </label>
          <div className="zuvi-studio-word-surface-fields">
            <label>
              线型
              <Select
                aria-label="段落边框线型"
                disabled={blocked}
                value={selected.style}
                options={[
                  { value: 'keep', label: '保持每段原值' },
                  ...WORD_SURFACE_LINES.map((style) => ({ value: style, label: lines[style] })),
                ]}
                onChange={(value) => change('style', value)}
              />
            </label>
            <label>
              宽度（pt）
              <Input
                aria-label="段落边框宽度（pt）"
                inputMode="decimal"
                disabled={blocked}
                value={selected.size}
                onChange={(event) => change('size', event.target.value)}
              />
            </label>
            <label>
              距文字（pt）
              <Input
                aria-label="段落边框距文字（pt）"
                inputMode="numeric"
                disabled={blocked}
                value={selected.space}
                onChange={(event) => change('space', event.target.value)}
              />
            </label>
            <label>
              颜色
              <Input
                aria-label="段落边框颜色"
                disabled={blocked}
                value={selected.color}
                placeholder="#112233 或 auto"
                onChange={(event) => change('color', event.target.value)}
              />
            </label>
          </div>
          <div className="zuvi-studio-word-surface-presets">
            <Checkbox
              label="边框阴影"
              disabled={blocked}
              checked={selected.shadow}
              onChange={(value) => change('shadow', value)}
            />
            <Checkbox
              label="边框框架"
              disabled={blocked}
              checked={selected.frame}
              onChange={(value) => change('frame', value)}
            />
          </div>
          <div className="zuvi-studio-word-surface-fields">
            <label>
              底纹图案
              <Select
                aria-label="段落底纹图案"
                disabled={blocked}
                value={pattern}
                options={[
                  { value: 'keep', label: '保持每段原值' },
                  ...WORD_SHADING_PATTERNS.map((value) => ({
                    value,
                    label:
                      value === 'nil'
                        ? '无底纹'
                        : value === 'clear'
                          ? '纯底色'
                          : value === 'solid'
                            ? '实心前景'
                            : value.startsWith('pct')
                              ? `${value.slice(3)}%`
                              : value,
                  })),
                ]}
                onChange={(value) => {
                  setPattern(value);
                  setDirty((all) => ({ ...all, pattern: true }));
                  setError('');
                }}
              />
            </label>
            <label>
              底色
              <Input
                aria-label="段落底纹底色"
                disabled={blocked}
                value={fill}
                onChange={(event) => {
                  setFill(event.target.value);
                  setDirty((all) => ({ ...all, fill: true }));
                  setError('');
                }}
              />
            </label>
            <label>
              图案颜色
              <Input
                aria-label="段落底纹图案颜色"
                disabled={blocked}
                value={foreground}
                onChange={(event) => {
                  setForeground(event.target.value);
                  setDirty((all) => ({ ...all, foreground: true }));
                  setError('');
                }}
              />
            </label>
          </div>
          <p>只应用修改过的字段；“保持每段原值”保留混合格式。颜色使用 #RRGGBB 或 auto。</p>
          <div
            className="zuvi-studio-word-surface-preview"
            aria-label="段落边框底纹预览"
            style={wordSurfaceCss(preview)}
          >
            段落边框与底纹预览。
            <br />
            第二行显示文字和边框距离。
          </div>
          {(issue || error) && <p role="alert">{issue || error}</p>}
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
                onSave(patch);
                onClose();
              } catch (reason) {
                setError(reason instanceof Error ? reason.message : '段落边框/底纹未应用。');
              }
            }}
          >
            应用段落边框底纹
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
