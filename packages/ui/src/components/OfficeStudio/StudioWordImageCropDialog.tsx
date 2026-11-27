'use client';
import * as React from 'react';
import { Button } from '../Button';
import { Input } from '../Input';
import { Modal } from '../Modal';
import { wordImageCrop, type WordImageCrop } from './studio-word-image-crop';
const edges = ['left', 'top', 'right', 'bottom'] as const;
const labels = { left: '左', top: '上', right: '右', bottom: '下' };
export function StudioWordImageCropDialog({
  src,
  initial,
  blocked,
  onClose,
  onSave,
}: {
  src: string;
  initial: unknown;
  blocked: boolean;
  onClose: () => void;
  onSave: (crop: WordImageCrop | null) => void;
}) {
  const original = wordImageCrop(initial);
  const [draft, setDraft] = React.useState(
    () =>
      Object.fromEntries(edges.map((edge) => [edge, String(original?.[edge] ?? 0)])) as Record<
        (typeof edges)[number],
        string
      >
  );
  const [composing, setComposing] = React.useState(false);
  const [error, setError] = React.useState('');
  const dragCleanup = React.useRef<(() => void) | null>(null);
  const interactionAllowed = React.useRef(false);
  interactionAllowed.current = !blocked && !composing;
  React.useEffect(() => {
    if (blocked || composing) dragCleanup.current?.();
    return () => {
      dragCleanup.current?.();
    };
  }, [blocked, composing]);
  let crop: WordImageCrop | null = null,
    issue = '';
  try {
    if (edges.some((edge) => !draft[edge].trim())) throw new Error('请输入全部裁剪边距。');
    crop = wordImageCrop(Object.fromEntries(edges.map((edge) => [edge, Number(draft[edge])])));
  } catch (reason) {
    issue = reason instanceof Error ? reason.message : '裁剪区域无效。';
  }
  const region = crop ?? { left: 0, top: 0, right: 0, bottom: 0 };
  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Modal.Content size="md">
        <Modal.Header>
          <Modal.Title>图片裁剪</Modal.Title>
          <Modal.Close />
        </Modal.Header>
        <Modal.Body>
          <p>调整原图四边的裁剪百分比，框内区域会保留。原图可以随时恢复。</p>
          <div
            style={{ position: 'relative', lineHeight: 0, marginBlock: 12 }}
            data-word-crop-preview=""
          >
            <img
              src={src}
              alt="裁剪原图预览"
              style={{ display: 'block', width: '100%', height: 'auto' }}
            />
            {!issue && (
              <div
                aria-label="保留的裁剪区域"
                style={{
                  position: 'absolute',
                  inset: `${region.top}% ${region.right}% ${region.bottom}% ${region.left}%`,
                  border: '2px solid var(--zuvi-color-primary)',
                  boxShadow: '0 0 0 1px white',
                  background: 'transparent',
                }}
              >
                {edges.map((edge) => (
                  <button
                    key={edge}
                    type="button"
                    aria-label={`拖动${labels[edge]}边裁剪`}
                    disabled={blocked || composing}
                    style={{
                      position: 'absolute',
                      width: 16,
                      height: 16,
                      padding: 0,
                      border: '2px solid white',
                      background: 'var(--zuvi-color-primary)',
                      touchAction: 'none',
                      cursor: edge === 'left' || edge === 'right' ? 'ew-resize' : 'ns-resize',
                      ...(edge === 'left'
                        ? { left: -8, top: '50%' }
                        : edge === 'right'
                          ? { right: -8, top: '50%' }
                          : edge === 'top'
                            ? { top: -8, left: '50%' }
                            : { bottom: -8, left: '50%' }),
                    }}
                    onPointerDown={(event) => {
                      if (blocked || composing) return;
                      event.preventDefault();
                      const handle = event.currentTarget;
                      const preview = handle.parentElement?.parentElement?.getBoundingClientRect();
                      if (!preview || !preview.width || !preview.height) return;
                      const start = { ...region };
                      const origin =
                        edge === 'left' || edge === 'right' ? event.clientX : event.clientY;
                      const size =
                        edge === 'left' || edge === 'right' ? preview.width : preview.height;
                      const opposite =
                        edge === 'left'
                          ? 'right'
                          : edge === 'right'
                            ? 'left'
                            : edge === 'top'
                              ? 'bottom'
                              : 'top';
                      const move = (next: PointerEvent) => {
                        if (next.pointerId !== event.pointerId || !interactionAllowed.current)
                          return;
                        const coordinate =
                          edge === 'left' || edge === 'right' ? next.clientX : next.clientY;
                        const direction = edge === 'right' || edge === 'bottom' ? -1 : 1;
                        const value = Math.max(
                          0,
                          Math.min(
                            99.9 - start[opposite],
                            start[edge] + ((direction * (coordinate - origin)) / size) * 100
                          )
                        );
                        setDraft((current) => ({
                          ...current,
                          [edge]: String(Math.round(value * 1000) / 1000),
                        }));
                        setError('');
                      };
                      const end = (next: PointerEvent) => {
                        if (next.pointerId !== event.pointerId) return;
                        cleanup();
                      };
                      const cleanup = () => {
                        dragCleanup.current = null;
                        handle.removeEventListener('pointermove', move);
                        handle.removeEventListener('pointerup', end);
                        handle.removeEventListener('pointercancel', cancel);
                      };
                      const cancel = (next: PointerEvent) => {
                        if (next.pointerId !== event.pointerId) return;
                        setDraft(
                          Object.fromEntries(
                            edges.map((key) => [key, String(start[key])])
                          ) as typeof draft
                        );
                        end(next);
                      };
                      dragCleanup.current?.();
                      dragCleanup.current = cleanup;
                      handle.setPointerCapture(event.pointerId);
                      handle.addEventListener('pointermove', move);
                      handle.addEventListener('pointerup', end);
                      handle.addEventListener('pointercancel', cancel);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>
            {edges.map((edge) => (
              <label key={edge}>
                {labels[edge]}边裁剪 (%)
                <Input
                  aria-label={`${labels[edge]}边裁剪百分比`}
                  type="number"
                  min={0}
                  max={99.999}
                  step={0.1}
                  value={draft[edge]}
                  disabled={blocked}
                  onCompositionStart={() => setComposing(true)}
                  onCompositionEnd={() => setComposing(false)}
                  onChange={(event) => {
                    setDraft((current) => ({ ...current, [edge]: event.target.value }));
                    setError('');
                  }}
                />
              </label>
            ))}
          </div>
          {(issue || error) && <p role="alert">{issue || error}</p>}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="ghost"
            disabled={blocked || composing}
            onClick={() => {
              setDraft({ left: '0', top: '0', right: '0', bottom: '0' });
              setError('');
            }}
          >
            重置裁剪
          </Button>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button
            disabled={blocked || composing || !!issue}
            onClick={() => {
              if (blocked || composing || issue) return;
              try {
                onSave(crop);
              } catch (reason) {
                setError(reason instanceof Error ? reason.message : '裁剪无法保存。');
              }
            }}
          >
            应用裁剪
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
