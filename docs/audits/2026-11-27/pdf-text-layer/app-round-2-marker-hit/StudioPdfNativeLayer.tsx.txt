'use client';

import { useEffect, useId, useRef, useState, type PointerEvent } from 'react';
import { Button } from '../Button/Button';
import type {
  PdfAnnotation,
  PdfAnnotationPatch,
  PdfPoint,
  PdfRect,
} from './studio-pdf-annotation-types';
import type { StudioPdfRenderResult } from './studio-types';
import {
  PDF_NATIVE_LABELS,
  pdfNativeBounds,
  pdfNativeRect,
  pdfNativeRootVisible,
  pdfNativeTranslate,
  pdfNativeViewportRect,
  type PdfNativeTool,
} from './studio-pdf-native-ui';
import { isImeComposing } from '../../utils';

interface Gesture {
  pointer: number;
  tool: PdfNativeTool;
  points: PdfPoint[];
  annotation?: PdfAnnotation;
  resize?: boolean;
  rect?: PdfRect;
}

export function StudioPdfNativeLayer({
  annotations,
  paintReferences,
  pageId,
  view,
  tool,
  selectedId,
  disabled,
  canEdit,
  ink,
  marker,
  lineWidth,
  onSelect,
  onCreate,
  onPatch,
  onRemove,
  onProperties,
}: {
  annotations: readonly PdfAnnotation[];
  paintReferences?: readonly { id: string; key?: string; flags?: number }[];
  pageId: string;
  view: StudioPdfRenderResult;
  tool: PdfNativeTool;
  selectedId: string | null;
  disabled: boolean;
  canEdit: boolean;
  ink: string;
  marker: string;
  lineWidth: number;
  onSelect(id: string | null): void;
  onCreate(tool: Exclude<PdfNativeTool, 'select'>, points: readonly PdfPoint[]): Promise<boolean>;
  onPatch(id: string, patch: PdfAnnotationPatch): Promise<boolean>;
  onRemove(id: string): Promise<boolean>;
  onProperties(id: string): void;
}) {
  const root = useRef<HTMLDivElement>(null),
    gesture = useRef<Gesture | null>(null);
  const [draft, setDraft] = useState<Gesture | null>(null),
    markerId = useId().replaceAll(':', '');
  const [, refreshPaintBounds] = useState(0);
  const cancel = () => {
    gesture.current = null;
    setDraft(null);
  };
  useEffect(() => {
    gesture.current = null;
    setDraft(null);
  }, [annotations, pageId, view, tool, disabled, canEdit]);
  useEffect(() => {
    const layer = root.current?.parentElement?.querySelector(
      '.zuvi-studio-pdf-annotation-paint-layer'
    );
    if (!layer) return;
    const observer = new MutationObserver(() => refreshPaintBounds((version) => version + 1));
    observer.observe(layer, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'data-ready'],
    });
    return () => observer.disconnect();
  }, [pageId, view]);
  const displayRect = (annotation: PdfAnnotation) => {
    {
      const reference = /^(\d+)\s+(\d+)\s+R$/.exec(
        (paintReferences
          ? paintReferences.find((item) => item.id === annotation.id)?.key
          : annotation.native?.key) ?? ''
      );
      const id = reference && `${reference[1]}R${reference[2] === '0' ? '' : reference[2]}`;
      const element =
        id &&
        root.current?.parentElement?.querySelector<HTMLElement>(
          `.zuvi-studio-pdf-annotation-paint-layer [data-annotation-id="${id}"]`
        );
      const box = element && element.getBoundingClientRect(),
        parent = root.current?.getBoundingClientRect();
      if (box && parent && parent.width > 0 && parent.height > 0 && box.width > 0 && box.height > 0)
        return {
          x: ((box.left - parent.left) * view.width) / parent.width,
          y: ((box.top - parent.top) * view.height) / parent.height,
          width: (box.width * view.width) / parent.width,
          height: (box.height * view.height) / parent.height,
        };
    }
    return pdfNativeViewportRect(annotation.rect!, view);
  };
  const point = (x: number, y: number): PdfPoint | undefined => {
    const box = root.current?.getBoundingClientRect();
    if (!box || !box.width || !box.height) return;
    const value = view.toPdfPoint(
      ((x - box.left) * view.width) / box.width,
      ((y - box.top) * view.height) / box.height
    );
    const bounds = pdfNativeBounds(view),
      padding =
        tool === 'arrow' || tool === 'line'
          ? Math.max(8, lineWidth * 5 + 2)
          : Math.max(4, lineWidth / 2 + 1);
    return [
      Math.max(bounds.left + padding, Math.min(bounds.right - padding, value[0])),
      Math.max(bounds.bottom + padding, Math.min(bounds.top - padding, value[1])),
    ];
  };
  const clamp = (rect: PdfRect): PdfRect => {
    const bounds = pdfNativeBounds(view),
      width = rect[2] - rect[0],
      height = rect[3] - rect[1];
    const x = Math.max(bounds.left, Math.min(bounds.right - width, rect[0])),
      y = Math.max(bounds.bottom, Math.min(bounds.top - height, rect[1]));
    return [x, y, x + width, y + height];
  };
  const startMove = (
    event: PointerEvent<HTMLElement>,
    annotation: PdfAnnotation,
    resize = false
  ) => {
    if (disabled) return;
    event.stopPropagation();
    onSelect(annotation.id);
    if (
      !canEdit ||
      tool !== 'select' ||
      event.button !== 0 ||
      !annotation.rect ||
      !(resize ? annotation.capabilities.resize : annotation.capabilities.move)
    )
      return;
    const value = point(event.clientX, event.clientY);
    if (!value) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    gesture.current = {
      pointer: event.pointerId,
      tool,
      points: [value],
      annotation,
      resize,
      rect: annotation.rect,
    };
  };
  const move = (pointer: number, x: number, y: number) => {
    const current = gesture.current,
      value = point(x, y);
    if (!canEdit || !current || current.pointer !== pointer || !value) return;
    let next: Gesture;
    if (current.annotation?.rect) {
      const original = current.annotation.rect;
      const dx = value[0] - current.points[0][0],
        dy = value[1] - current.points[0][1];
      const rect: PdfRect = current.resize
        ? [
            original[0],
            original[1] + Math.min(dy, original[3] - original[1] - 1),
            Math.max(original[0] + 1, original[2] + dx),
            original[3],
          ]
        : [original[0] + dx, original[1] + dy, original[2] + dx, original[3] + dy];
      next = { ...current, rect: clamp(rect) };
    } else if (['ink', 'polygon', 'polyLine'].includes(current.tool)) {
      const last = current.points.at(-1)!;
      if (
        current.points.length >= 10000 ||
        Math.hypot(last[0] - value[0], last[1] - value[1]) < 0.5
      )
        return;
      next = { ...current, points: [...current.points, value] };
    } else next = { ...current, points: [current.points[0], value] };
    gesture.current = next;
    setDraft(next);
  };
  const finish = (pointer: number) => {
    const current = gesture.current;
    if (!current || current.pointer !== pointer || !canEdit) {
      cancel();
      return;
    }
    cancel();
    if (current.annotation?.rect && current.rect) {
      if (
        current.annotation !==
          annotations.find((annotation) => annotation.id === current.annotation?.id) ||
        current.annotation.kind === 'opaque'
      )
        return;
      if (current.rect.some((value, index) => value !== current.annotation!.rect![index]))
        void onPatch(current.annotation.id, { kind: current.annotation.kind, rect: current.rect });
    } else if (current.tool !== 'select') void onCreate(current.tool, current.points);
  };
  const preview =
    draft && !draft.annotation && draft.points.length > 1
      ? pdfNativeViewportRect(pdfNativeRect(draft.points), view)
      : undefined;
  const path = draft?.points
    .map(
      (point, index) => `${index ? 'L' : 'M'}${view.toViewportPoint(point[0], point[1]).join(' ')}`
    )
    .join(' ');
  const scale = Math.hypot(
    ...view
      .toViewportPoint(lineWidth, 0)
      .map((value, index) => value - view.toViewportPoint(0, 0)[index])
  );
  return (
    <div
      ref={root}
      className="zuvi-studio-pdf-native-layer"
      role="group"
      aria-label="PDF 原生批注交互层"
      data-drawing={tool !== 'select' || undefined}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !isImeComposing(event.nativeEvent)) {
          event.stopPropagation();
          cancel();
        }
      }}
      onClick={(event) => {
        event.stopPropagation();
      }}
      onPointerDown={(event) => {
        if (!canEdit || tool === 'select' || event.button !== 0) return;
        const value = point(event.clientX, event.clientY);
        if (!value) return;
        event.stopPropagation();
        event.preventDefault();
        event.currentTarget.setPointerCapture?.(event.pointerId);
        gesture.current = { pointer: event.pointerId, tool, points: [value] };
      }}
      onPointerMove={(event) => move(event.pointerId, event.clientX, event.clientY)}
      onPointerUp={(event) => {
        move(event.pointerId, event.clientX, event.clientY);
        finish(event.pointerId);
        if (event.currentTarget.hasPointerCapture?.(event.pointerId))
          event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={cancel}
    >
      {annotations
        .filter(
          (annotation) =>
            annotation.pageId === pageId && pdfNativeRootVisible(annotation) && annotation.rect
        )
        .map((annotation) => {
          const box = displayRect(annotation),
            selected = selectedId === annotation.id;
          return (
            <Button
              key={annotation.id}
              size="sm"
              variant="ghost"
              className="zuvi-studio-pdf-native-hit"
              style={{ left: box.x, top: box.y, width: box.width, height: box.height }}
              aria-label={`PDF 批注 ${PDF_NATIVE_LABELS[annotation.kind]} ${annotation.contents.slice(0, 32) || annotation.id}`}
              aria-pressed={selected}
              disabled={disabled}
              data-native-id={annotation.id}
              data-native-kind={annotation.kind}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(annotation.id);
              }}
              onDoubleClick={() => onProperties(annotation.id)}
              onPointerDown={(event) => startMove(event, annotation)}
              onPointerMove={(event) => move(event.pointerId, event.clientX, event.clientY)}
              onPointerUp={(event) => {
                event.stopPropagation();
                move(event.pointerId, event.clientX, event.clientY);
                finish(event.pointerId);
              }}
              onPointerCancel={cancel}
              onKeyDown={(event) => {
                if (!canEdit || isImeComposing(event.nativeEvent)) return;
                if (event.key === 'Delete' || event.key === 'Backspace') {
                  if (annotation.capabilities.remove) {
                    event.preventDefault();
                    void onRemove(annotation.id);
                  }
                  return;
                }
                if (event.key === 'Enter') {
                  event.preventDefault();
                  onProperties(annotation.id);
                  return;
                }
                if (
                  !annotation.capabilities.move ||
                  !annotation.rect ||
                  !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)
                )
                  return;
                event.preventDefault();
                const step = event.shiftKey ? 10 : 1;
                const next = clamp([
                  annotation.rect[0] +
                    (event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0),
                  annotation.rect[1] +
                    (event.key === 'ArrowUp' ? step : event.key === 'ArrowDown' ? -step : 0),
                  annotation.rect[2] +
                    (event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0),
                  annotation.rect[3] +
                    (event.key === 'ArrowUp' ? step : event.key === 'ArrowDown' ? -step : 0),
                ]);
                if (next.some((value, index) => value !== annotation.rect![index]))
                  void onPatch(annotation.id, pdfNativeTranslate(annotation, next[0], next[1]));
              }}
            >
              {selected && canEdit && annotation.capabilities.resize && (
                <span
                  className="zuvi-studio-pdf-native-resize"
                  aria-hidden="true"
                  onPointerDown={(event) => startMove(event, annotation, true)}
                />
              )}
            </Button>
          );
        })}
      <svg
        className="zuvi-studio-pdf-native-preview"
        viewBox={`0 0 ${view.width} ${view.height}`}
        aria-hidden="true"
      >
        <defs>
          <marker id={markerId} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0 0 L8 4 L0 8 Z" fill={ink} />
          </marker>
        </defs>
        {draft?.annotation && draft.rect
          ? (() => {
              const rect = pdfNativeViewportRect(draft.rect, view);
              return (
                <rect
                  {...rect}
                  fill="none"
                  stroke="var(--zuvi-color-primary)"
                  strokeWidth="1.5"
                  strokeDasharray="5 3"
                />
              );
            })()
          : null}
        {preview && (draft?.tool === 'square' || draft?.tool === 'circle') ? (
          draft.tool === 'circle' ? (
            <ellipse
              cx={preview.x + preview.width / 2}
              cy={preview.y + preview.height / 2}
              rx={preview.width / 2}
              ry={preview.height / 2}
              fill="none"
              stroke={ink}
              strokeWidth={scale}
            />
          ) : (
            <rect {...preview} fill="none" stroke={ink} strokeWidth={scale} />
          )
        ) : null}
        {preview &&
        ['highlight', 'underline', 'strikeOut', 'squiggly'].includes(draft?.tool ?? '') ? (
          <rect {...preview} fill={marker} opacity="0.3" />
        ) : null}
        {path && ['ink', 'line', 'arrow', 'polygon', 'polyLine'].includes(draft?.tool ?? '') ? (
          <path
            d={path + (draft?.tool === 'polygon' ? ' Z' : '')}
            fill="none"
            stroke={ink}
            strokeWidth={scale}
            strokeLinecap="round"
            strokeLinejoin="round"
            markerEnd={draft?.tool === 'arrow' ? `url(#${markerId})` : undefined}
          />
        ) : null}
      </svg>
    </div>
  );
}
