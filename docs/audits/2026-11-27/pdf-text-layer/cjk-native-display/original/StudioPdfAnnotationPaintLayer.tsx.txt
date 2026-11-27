'use client';

import { useEffect, useRef, useState } from 'react';
import type { StudioPdfAnnotationLayerSession, StudioPdfPage, StudioPdfSession } from './studio-types';
import './StudioPdfTextLayer.css';

export function StudioPdfAnnotationPaintLayer({ session, page, scale, rotation, descriptor, canvas, annotations, disabled = false, onSelect }: {
  session: StudioPdfSession;
  page: number;
  scale: number;
  rotation: number;
  descriptor?: StudioPdfPage;
  canvas: HTMLCanvasElement | null;
  annotations?: readonly { id: string; key?: string; flags?: number }[];
  disabled?: boolean;
  onSelect?(id: string): void;
}) {
  const container = useRef<HTMLDivElement>(null), callback = useRef(onSelect), blocked = useRef(disabled), values = useRef(annotations);
  const [ready, setReady] = useState(false), [error, setError] = useState('');
  callback.current = onSelect; blocked.current = disabled; values.current = annotations;
  const annotationKey = annotations?.map(value => `${value.id}:${value.key ?? ''}:${value.flags ?? ''}`).join('\n') ?? '';
  useEffect(() => {
    const element = container.current;
    if (!element || !canvas || !session.renderAnnotationLayer) return;
    const controller = new AbortController();
    let owned: StudioPdfAnnotationLayerSession | undefined;
    setReady(false); setError('');
    void session.renderAnnotationLayer(page, element, { scale, rotation, page: descriptor, canvas, annotations: values.current,
      signal: controller.signal, onSelect: id => { if (!blocked.current) callback.current?.(id); } }).then(layer => {
      if (controller.signal.aborted) { layer.destroy(); return; }
      owned = layer; setReady(true);
    }, cause => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'PDF 批注外观层加载失败。');
    });
    return () => { controller.abort(); owned?.destroy(); };
  }, [session, page, scale, rotation, descriptor, canvas, annotationKey]);
  useEffect(() => {
    for (const element of container.current?.querySelectorAll<HTMLElement>('section[tabindex]') ?? []) element.tabIndex = disabled ? -1 : 0;
  }, [disabled, ready]);
  return <>
    <div ref={container} className={`annotationLayer zuvi-studio-pdf-annotation-paint-layer${disabled ? ' disabled' : ''}`}
      aria-label="PDF 原生批注外观" data-ready={ready ? 'true' : 'false'} data-disabled={disabled || undefined}
      onClick={event => { if ((event.target as Element).closest('[data-annotation-id]')) event.stopPropagation(); }}
      onPointerDown={event => { if ((event.target as Element).closest('[data-annotation-id]')) event.stopPropagation(); }} />
    {error && <span className="zuvi-studio-pdf-text-layer-error" role="alert">{error}</span>}
  </>;
}
