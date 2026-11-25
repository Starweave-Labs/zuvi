'use client';
import * as React from 'react';
import { useEditorState, type Editor } from '@tiptap/react';
import { Button } from '../Button';
import {
  wordSelectionParagraphFormat,
  wordSelectedParagraphs,
  effectiveParagraph,
  wordSetParagraphFormat,
} from './studio-word-paragraph-layout';
import type { StudioWordParagraphFormat } from './studio-types';

type Handle = 'first' | 'hanging' | 'left' | 'right';
const handles: [Handle, string][] = [
  ['first', '首行缩进标尺'],
  ['hanging', '悬挂缩进标尺'],
  ['left', '左缩进标尺'],
  ['right', '右缩进标尺'],
];
const propsFor = (
  handle: Handle,
  value: number,
  current: Required<StudioWordParagraphFormat>
): Partial<StudioWordParagraphFormat> =>
  handle === 'first'
    ? { indentFirstLine: value }
    : handle === 'right'
      ? { indentRight: value }
      : handle === 'hanging'
        ? {
            indentLeft: value,
            indentFirstLine: current.indentLeft + current.indentFirstLine - value,
          }
        : { indentLeft: value };
const cssNames = {
  indentLeft: 'margin-left',
  indentRight: 'margin-right',
  indentFirstLine: 'text-indent',
} as const;

export function StudioWordRuler({
  length,
  margin,
  scale,
  vertical = false,
  editor = null,
  blocked = false,
  onNotice,
}: {
  length: number;
  margin: number;
  scale: number;
  vertical?: boolean;
  editor?: Editor | null;
  blocked?: boolean;
  onNotice?: (message: string) => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const cleanup = React.useRef<((cancel: boolean) => void) | undefined>(undefined);
  const latest = React.useRef({ editor, blocked });
  latest.current = { editor, blocked };
  const selected = useEditorState({
    editor,
    selector: ({ editor: current }) => {
      if (!current || current.isDestroyed || !current.schema) return null;
      const paragraphs = wordSelectedParagraphs(current);
      if (!paragraphs.length) return null;
      const value = effectiveParagraph(current, paragraphs[0].node);
      return {
        value,
        mixed: wordSelectionParagraphFormat(current),
        from: current.state.selection.from,
        to: current.state.selection.to,
      };
    },
  });
  const [area, setArea] = React.useState({
    origin: margin,
    width: length - margin * 2,
    table: false,
  });
  const [preview, setPreview] = React.useState<Required<StudioWordParagraphFormat> | null>(null);
  React.useLayoutEffect(() => {
    if (vertical) return;
    let observed: HTMLElement | null = null;
    const resize =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => measure());
    const measure = () => {
      const current = latest.current.editor;
      let next = { origin: margin, width: length - margin * 2, table: false };
      let cellElement: HTMLElement | null = null;
      if (current && !current.isDestroyed && ref.current) {
        const pos = current.state.selection.$from;
        for (let depth = pos.depth; depth > 0; depth--) {
          if (!['tableCell', 'tableHeader'].includes(pos.node(depth).type.name)) continue;
          const cell = current.view.nodeDOM(pos.before(depth));
          if (cell instanceof HTMLElement) {
            cellElement = cell;
            const rect = cell.getBoundingClientRect(),
              ruler = ref.current.getBoundingClientRect(),
              style = getComputedStyle(cell);
            const left =
                (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.borderLeftWidth) || 0),
              right =
                (parseFloat(style.paddingRight) || 0) + (parseFloat(style.borderRightWidth) || 0);
            next = {
              origin: (rect.left - ruler.left) / scale + left,
              width: Math.max(16, rect.width / scale - left - right),
              table: true,
            };
          }
          break;
        }
      }
      if (observed !== cellElement) {
        if (observed) resize?.unobserve(observed);
        observed = cellElement;
        if (observed) resize?.observe(observed);
      }
      setArea((old) =>
        old.origin === next.origin && old.width === next.width && old.table === next.table
          ? old
          : next
      );
    };
    measure();
    if (ref.current) resize?.observe(ref.current);
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      resize?.disconnect();
    };
  }, [editor, selected?.from, selected?.to, length, margin, scale, vertical]);
  React.useEffect(() => () => cleanup.current?.(true), [editor, blocked, length, margin, scale]);
  const value = preview ?? selected?.value;
  const bounds = (handle: Handle) => {
    const width = area.width * 0.75,
      left = value?.indentLeft ?? 0,
      right = value?.indentRight ?? 0;
    const outside = area.table ? 0 : -area.origin * 0.75;
    const min = handle === 'first' ? Math.max(-500, outside - left) : Math.max(-500, outside);
    const max = Math.max(
      min,
      Math.min(
        500,
        handle === 'first'
          ? width - right - left - 4
          : handle === 'right'
            ? width - left - 12
            : width - right - 12
      )
    );
    return { min, max };
  };
  const apply = (handle: Handle, number: number) => {
    const current = latest.current;
    if (
      !current.editor ||
      current.blocked ||
      current.editor.isDestroyed ||
      !current.editor.isEditable
    )
      return;
    try {
      wordSetParagraphFormat(current.editor, (base) => propsFor(handle, number, base));
      onNotice?.('已调整标尺缩进，可撤销恢复。');
    } catch (error) {
      onNotice?.(error instanceof Error ? error.message : '标尺缩进未应用。');
    }
  };
  const drag = (handle: Handle, event: React.PointerEvent<HTMLButtonElement>) => {
    const current = latest.current,
      active = current.editor;
    if (
      event.button !== 0 ||
      current.blocked ||
      !active ||
      active.isDestroyed ||
      !active.isEditable ||
      !ref.current ||
      !value
    )
      return;
    event.preventDefault();
    cleanup.current?.(true);
    const original = active.state.doc,
      initial = { ...value },
      limit = bounds(handle);
    let target =
      handle === 'first'
        ? initial.indentFirstLine
        : handle === 'right'
          ? initial.indentRight
          : initial.indentLeft;
    const initialAmount = target;
    const initialPointer = (event.clientX - ref.current.getBoundingClientRect().left) / scale;
    const elements = wordSelectedParagraphs(active).flatMap(({ position, node }) => {
      const element = active.view.nodeDOM(position);
      if (!(element instanceof HTMLElement)) return [];
      return [
        {
          element,
          format: effectiveParagraph(active, node),
          styles: Object.fromEntries(
            Object.values(cssNames).map((css) => [
              css,
              [element.style.getPropertyValue(css), element.style.getPropertyPriority(css)],
            ])
          ),
        },
      ];
    });
    const move = (next: PointerEvent) => {
      if (!ref.current || next.pointerId !== event.pointerId) return;
      const x = (next.clientX - ref.current.getBoundingClientRect().left) / scale;
      const raw = initialAmount + (x - initialPointer) * 0.75 * (handle === 'right' ? -1 : 1);
      target = Math.round(Math.max(limit.min, Math.min(limit.max, raw)) * 20) / 20;
      for (const item of elements)
        for (const [key, amount] of Object.entries(propsFor(handle, target, item.format)))
          item.element.style.setProperty(
            cssNames[key as keyof typeof cssNames],
            `${amount}pt`,
            'important'
          );
      setPreview({ ...initial, ...propsFor(handle, target, initial) });
    };
    const finish = (cancel: boolean) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', cancelled);
      window.removeEventListener('keydown', key, true);
      for (const item of elements)
        for (const [css, [old, priority]] of Object.entries(item.styles))
          if (old) item.element.style.setProperty(css, old, priority);
          else item.element.style.removeProperty(css);
      cleanup.current = undefined;
      setPreview(null);
      if (
        !cancel &&
        latest.current.editor === active &&
        !latest.current.blocked &&
        !active.isDestroyed &&
        active.state.doc === original
      )
        apply(handle, target);
    };
    const end = (next: PointerEvent) => {
      if (next.pointerId === event.pointerId) finish(false);
    };
    const cancelled = () => finish(true);
    const key = (next: KeyboardEvent) => {
      if (next.key === 'Escape') {
        next.preventDefault();
        next.stopPropagation();
        finish(true);
      }
    };
    cleanup.current = finish;
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', cancelled);
    window.addEventListener('keydown', key, true);
  };
  const unit = (96 / 25.4) * 10,
    count = Math.floor((length - margin * 2) / unit);
  return (
    <div
      ref={ref}
      className={`zuvi-studio-word-ruler zuvi-studio-word-ruler-${vertical ? 'vertical' : 'horizontal'}`}
      data-part="word-ruler"
      data-orientation={vertical ? 'vertical' : 'horizontal'}
      aria-label={vertical ? undefined : '段落缩进标尺'}
      aria-hidden={vertical || undefined}
      style={
        {
          '--zuvi-studio-word-ruler-unit': `${unit * scale}px`,
          '--zuvi-studio-word-ruler-margin': `${margin * scale}px`,
          [vertical ? 'height' : 'width']: length * scale,
        } as React.CSSProperties
      }
    >
      <span className="zuvi-studio-word-ruler-text-area" aria-hidden="true" />
      {Array.from({ length: Math.max(0, count) + 1 }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className="zuvi-studio-word-ruler-number"
          style={{ [vertical ? 'top' : 'left']: (margin + index * unit) * scale }}
        >
          {index}
        </span>
      ))}
      {!vertical &&
        value &&
        handles.map(([handle, label]) => {
          const amount =
            handle === 'first'
              ? value.indentFirstLine
              : handle === 'right'
                ? value.indentRight
                : value.indentLeft;
          const x =
            handle === 'first'
              ? area.origin + ((value.indentLeft + value.indentFirstLine) * 4) / 3
              : handle === 'right'
                ? area.origin + area.width - (value.indentRight * 4) / 3
                : area.origin + (value.indentLeft * 4) / 3;
          const limit = bounds(handle);
          return (
            <Button
              key={handle}
              role="slider"
              aria-label={label}
              aria-orientation="horizontal"
              aria-valuemin={limit.min}
              aria-valuemax={limit.max}
              aria-valuenow={amount}
              aria-valuetext={`${amount}pt${selected?.mixed[handle === 'first' ? 'indentFirstLine' : handle === 'right' ? 'indentRight' : 'indentLeft'] === null ? '（混合）' : ''}`}
              title={`${label} ${amount}pt`}
              disabled={blocked}
              className={`zuvi-studio-word-ruler-handle zuvi-studio-word-ruler-handle-${handle}`}
              style={{ left: x * scale }}
              onMouseDown={(event) => event.preventDefault()}
              onPointerDown={(event) => drag(handle, event)}
              onKeyDown={(event) => {
                if (blocked || event.nativeEvent.isComposing) return;
                let next = amount;
                if (event.key === 'ArrowLeft' || event.key === 'ArrowDown')
                  next -= event.shiftKey ? 10 : 1;
                else if (event.key === 'ArrowRight' || event.key === 'ArrowUp')
                  next += event.shiftKey ? 10 : 1;
                else if (event.key === 'Home') next = limit.min;
                else if (event.key === 'End') next = limit.max;
                else if (event.key === 'Delete' || event.key === 'Backspace') {
                  event.preventDefault();
                  if (handle === 'hanging' && editor)
                    wordSetParagraphFormat(editor, { indentFirstLine: 0 });
                  else apply(handle, 0);
                  return;
                } else return;
                event.preventDefault();
                apply(handle, Math.max(limit.min, Math.min(limit.max, next)));
              }}
            >
              <span aria-hidden="true" />
            </Button>
          );
        })}
    </div>
  );
}
