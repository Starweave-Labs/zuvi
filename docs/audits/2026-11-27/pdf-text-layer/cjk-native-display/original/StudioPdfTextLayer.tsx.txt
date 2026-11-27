'use client';

import { useEffect, useRef, useState } from 'react';
import type { StudioPdfPage, StudioPdfSession, StudioPdfTextLayerSession, StudioPdfTextSelection } from './studio-types';
import './StudioPdfTextLayer.css';

export function StudioPdfTextLayer({ session, page, scale, rotation, descriptor, disabled = false, onSelection }: {
  session: StudioPdfSession;
  page: number;
  scale: number;
  rotation: number;
  descriptor?: StudioPdfPage;
  disabled?: boolean;
  onSelection?(selection: StudioPdfTextSelection | undefined): void;
}) {
  const container = useRef<HTMLDivElement>(null), current = useRef<StudioPdfTextLayerSession | undefined>(undefined);
  const [ready, setReady] = useState(false), [error, setError] = useState('');
  const callback = useRef(onSelection), blocked = useRef(disabled);
  callback.current = onSelection; blocked.current = disabled;
  useEffect(() => {
    const element = container.current;
    if (!element || !session.renderTextLayer) return;
    const controller = new AbortController();
    let owned: StudioPdfTextLayerSession | undefined;
    current.current = undefined; setReady(false); setError(''); callback.current?.(undefined);
    const changed = () => callback.current?.(blocked.current ? undefined : current.current?.selection());
    element.ownerDocument.addEventListener('selectionchange', changed);
    void session.renderTextLayer(page, element, { scale, rotation, page: descriptor, signal: controller.signal }).then(layer => {
      if (controller.signal.aborted) { layer.destroy(); return; }
      owned = layer; current.current = layer; setReady(true); changed();
    }, cause => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'PDF 文本层加载失败。');
    });
    return () => {
      controller.abort(); owned?.destroy(); current.current = undefined;
      element.ownerDocument.removeEventListener('selectionchange', changed); callback.current?.(undefined);
    };
  }, [session, page, scale, rotation, descriptor]);
  useEffect(() => {
    if (!disabled) return;
    const selected = container.current?.ownerDocument.getSelection();
    if (selected?.anchorNode && container.current?.contains(selected.anchorNode)) selected.removeAllRanges();
    callback.current?.(undefined);
  }, [disabled]);
  return <>
    <div ref={container} className="textLayer zuvi-studio-pdf-text-layer" role="document"
      aria-label={`PDF 第 ${page + 1} 页原文选择复制`} tabIndex={disabled ? -1 : 0}
      data-ready={ready ? 'true' : 'false'} data-disabled={disabled || undefined}
      onCopy={event => { if (disabled) event.preventDefault(); event.stopPropagation(); }}
      onKeyDown={event => {
        if (disabled || event.nativeEvent.isComposing) return;
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
          event.preventDefault(); event.stopPropagation();
          const element = container.current;
          if (!element) return;
          const range = element.ownerDocument.createRange(); range.selectNodeContents(element);
          const selection = element.ownerDocument.getSelection(); selection?.removeAllRanges(); selection?.addRange(range);
          callback.current?.(current.current?.selection());
        }
      }} />
    {error && <span className="zuvi-studio-pdf-text-layer-error" role="alert">{error}</span>}
  </>;
}
