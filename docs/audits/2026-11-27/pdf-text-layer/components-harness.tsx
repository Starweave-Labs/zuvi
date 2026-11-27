import { createElement, Fragment } from 'react';
import { createRoot } from 'react-dom/client';
import { getDocument, TextLayer } from 'pdfjs-dist';
import { StudioPdfTextLayer } from '../../../../packages/ui/src/components/OfficeStudio/StudioPdfTextLayer';
import { StudioPdfAnnotationPaintLayer } from '../../../../packages/ui/src/components/OfficeStudio/StudioPdfAnnotationPaintLayer';
import type { StudioPdfTextSelection } from '../../../../packages/ui/src/components/OfficeStudio/studio-types';
import { studioPdfRenderer } from '../../../src/pages/collaboration/office-studio/studio-pdf-adapter';

/** Browser QA only: the same private UI components consume the real host renderer. */
export async function mountPdfLayerComponents(bytes: number[], annotations: { id: string; key: string; flags: number }[]) {
  const source = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
  const session = await studioPdfRenderer.load(source);
  const paper = document.createElement('div');
  paper.style.cssText = 'position:relative;margin:16px;background:white;overflow:hidden';
  const canvas = document.createElement('canvas'); paper.append(canvas);
  const view = await session.render(0, canvas, { scale: 1, rotation: 0 });
  paper.style.width = `${view.width}px`; paper.style.height = `${view.height}px`;
  const container = document.createElement('div'); paper.append(container);
  document.body.replaceChildren(paper); document.body.style.margin = '0';
  const root = createRoot(container), selected: string[] = [], values: (StudioPdfTextSelection | undefined)[] = [];
  let disabled = false;
  const show = () => root.render(createElement(Fragment, null,
    createElement(StudioPdfTextLayer, { session, page: 0, scale: 1, rotation: 0, disabled,
      onSelection: selection => values.push(selection) }),
    createElement(StudioPdfAnnotationPaintLayer, { session, page: 0, scale: 1, rotation: 0, canvas, annotations, disabled,
      onSelect: id => selected.push(id) }),
  ));
  show();
  return {
    disable(value: boolean) { disabled = value; show(); },
    selection: () => values.at(-1),
    selected,
    async cancel() {
      const target = document.createElement('div'), controller = new AbortController();
      const pending = session.renderTextLayer!(0, target, { scale: 1, rotation: 0, signal: controller.signal });
      controller.abort();
      try { await pending; return { error: '', children: target.childElementCount }; }
      catch (error) { return { error: error instanceof Error ? error.name : String(error), children: target.childElementCount }; }
    },
    async destroy() { root.unmount(); await session.destroy(); },
  };
}

/** Keep the real SDK stream open so its documented global-cache pending guard is exercised. */
export async function holdPdfTextLayer(bytes: number[]) {
  const loading = getDocument({ data: new Uint8Array(bytes), disableWorkerRendering: true, useSystemFonts: true });
  const pdf = await loading.promise, page = await pdf.getPage(1), viewport = page.getViewport({ scale: 1, rotation: 0 });
  const container = document.createElement('div');
  container.className = 'textLayer zuvi-studio-pdf-text-layer'; container.dataset.pdfConcurrent = 'true';
  container.style.setProperty('--total-scale-factor', String(viewport.scale * viewport.userUnit));
  container.style.setProperty('--scale-round-x', '0.001px'); container.style.setProperty('--scale-round-y', '0.001px');
  document.body.append(container);
  let finish: () => void = () => {};
  const gate = new Promise<void>(resolve => { finish = resolve; });
  const stream = page.streamTextContent().pipeThrough(new TransformStream({
    transform(chunk, controller) { controller.enqueue(chunk); },
    async flush() { await gate; },
  }));
  const layer = new TextLayer({ textContentSource: stream, container, viewport });
  const complete = layer.render();
  return {
    async release() { finish(); await complete; },
    async destroy() { finish(); layer.cancel(); container.remove(); await loading.destroy(); TextLayer.cleanup(); },
  };
}
