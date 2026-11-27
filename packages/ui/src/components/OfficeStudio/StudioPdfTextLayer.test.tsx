import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { StudioPdfTextLayer } from './StudioPdfTextLayer';
import { StudioPdfAnnotationPaintLayer } from './StudioPdfAnnotationPaintLayer';
import type { StudioPdfAnnotationLayerSession, StudioPdfSession, StudioPdfTextLayerSession, StudioPdfTextSelection } from './studio-types';

afterEach(() => { cleanup(); document.getSelection()?.removeAllRanges(); });
const selected: StudioPdfTextSelection = { text: 'Selected', quadPoints: [10, 20, 60, 20, 10, 10, 60, 10], rect: { x: 10, y: 10, width: 50, height: 10 } };
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done; }); return { resolve, promise }; }
function session(): StudioPdfSession {
  return { pageCount: 2, render: vi.fn(), destroy: vi.fn(), renderTextLayer: vi.fn(async (_page, container) => {
    container.append(document.createTextNode('Selected'));
    return { selection: () => selected, destroy: vi.fn(() => container.replaceChildren()) };
  }), renderAnnotationLayer: vi.fn(async (_page, container, options) => {
    const element = document.createElement('section'); element.tabIndex = 0;
    element.setAttribute('data-annotation-id', '15R'); element.textContent = 'Note';
    element.onclick = () => options.onSelect?.('native-note'); container.append(element);
    return { destroy: vi.fn(() => container.replaceChildren()) };
  }) };
}

it('reads the current source selection and allows page-only Ctrl+A without changing editor data', async () => {
  const renderer = session(), callback = vi.fn();
  render(<StudioPdfTextLayer session={renderer} page={0} scale={1} rotation={0} onSelection={callback} />);
  const layer = screen.getByRole('document', { name: 'PDF 第 1 页原文选择复制' });
  await waitFor(() => expect(layer).toHaveAttribute('data-ready', 'true'));
  fireEvent.keyDown(layer, { key: 'a', ctrlKey: true });
  expect(document.getSelection()?.toString()).toBe('Selected');
  expect(callback).toHaveBeenLastCalledWith(selected);
  const copy = new Event('copy', { bubbles: true, cancelable: true });
  expect(layer.dispatchEvent(copy)).toBe(true);
});

it('disabled viewing clears its selection, blocks copying and leaves unrelated selections alone', async () => {
  const renderer = session(), callback = vi.fn();
  const view = render(<StudioPdfTextLayer session={renderer} page={0} scale={1} rotation={0} onSelection={callback} />);
  const layer = screen.getByRole('document');
  await waitFor(() => expect(layer).toHaveAttribute('data-ready', 'true'));
  fireEvent.keyDown(layer, { key: 'a', ctrlKey: true });
  view.rerender(<StudioPdfTextLayer session={renderer} page={0} scale={1} rotation={0} onSelection={callback} disabled />);
  expect(document.getSelection()?.isCollapsed).toBe(true);
  expect(layer).toHaveAttribute('tabindex', '-1');
  const copy = new Event('copy', { bubbles: true, cancelable: true });
  expect(layer.dispatchEvent(copy)).toBe(false);
  expect(callback).toHaveBeenLastCalledWith(undefined);
  const elsewhere = document.createTextNode('Outside'); document.body.append(elsewhere);
  const range = document.createRange(); range.selectNodeContents(elsewhere);
  document.getSelection()?.addRange(range);
  cleanup(); expect(document.getSelection()?.toString()).toBe('Outside'); elsewhere.remove();
});

it('discards late text-layer sessions after page changes and does not restore their selections', async () => {
  const renderer = session(), first = deferred<StudioPdfTextLayerSession>(), callback = vi.fn();
  renderer.renderTextLayer = vi.fn().mockReturnValueOnce(first.promise).mockImplementationOnce(async (_page, container) => {
    container.textContent = 'New page'; return { selection: () => undefined, destroy: vi.fn() };
  });
  const view = render(<StudioPdfTextLayer session={renderer} page={0} scale={1} rotation={0} onSelection={callback} />);
  const firstOptions = vi.mocked(renderer.renderTextLayer).mock.calls[0][2];
  view.rerender(<StudioPdfTextLayer session={renderer} page={1} scale={1} rotation={90} onSelection={callback} />);
  expect(firstOptions.signal?.aborted).toBe(true);
  const old = { selection: () => selected, destroy: vi.fn() };
  await act(async () => first.resolve(old));
  await waitFor(() => expect(screen.getByRole('document')).toHaveTextContent('New page'));
  expect(old.destroy).toHaveBeenCalledOnce();
  expect(callback).not.toHaveBeenCalledWith(selected);
});

it('cancels text extraction and removes selection listeners when unmounted', async () => {
  const renderer = session(), pending = deferred<StudioPdfTextLayerSession>();
  renderer.renderTextLayer = vi.fn(() => pending.promise);
  const add = vi.spyOn(document, 'addEventListener'), remove = vi.spyOn(document, 'removeEventListener');
  const view = render(<StudioPdfTextLayer session={renderer} page={0} scale={1} rotation={0} />);
  const options = vi.mocked(renderer.renderTextLayer).mock.calls[0][2]; view.unmount();
  expect(options.signal?.aborted).toBe(true);
  expect(add.mock.calls.filter(([name]) => name === 'selectionchange')).toHaveLength(1);
  expect(remove.mock.calls.filter(([name]) => name === 'selectionchange')).toHaveLength(1);
  const late = { selection: () => selected, destroy: vi.fn() }; await act(async () => pending.resolve(late));
  expect(late.destroy).toHaveBeenCalledOnce(); add.mockRestore(); remove.mockRestore();
});

it('does not select native paint in disabled mode and does not rebuild it for equivalent ID input', async () => {
  const renderer = session(), callback = vi.fn(), canvas = document.createElement('canvas');
  const annotations = [{ id: 'native-note', key: '15 0 R', flags: 4 }];
  const view = render(<StudioPdfAnnotationPaintLayer session={renderer} page={0} scale={1} rotation={0} canvas={canvas} annotations={annotations} onSelect={callback} />);
  await waitFor(() => expect(screen.getByLabelText('PDF 原生批注外观')).toHaveAttribute('data-ready', 'true'));
  fireEvent.click(screen.getByText('Note')); expect(callback).toHaveBeenLastCalledWith('native-note');
  view.rerender(<StudioPdfAnnotationPaintLayer session={renderer} page={0} scale={1} rotation={0} canvas={canvas} annotations={[...annotations]} onSelect={callback} disabled />);
  expect(renderer.renderAnnotationLayer).toHaveBeenCalledOnce();
  expect(screen.getByText('Note')).toHaveAttribute('tabindex', '-1');
  callback.mockClear(); fireEvent.click(screen.getByText('Note')); expect(callback).not.toHaveBeenCalled();
});

it('destroys an obsolete annotation layer after a canvas/session change', async () => {
  const renderer = session(), pending = deferred<StudioPdfAnnotationLayerSession>(), first = document.createElement('canvas'), next = document.createElement('canvas');
  renderer.renderAnnotationLayer = vi.fn().mockReturnValueOnce(pending.promise).mockResolvedValueOnce({ destroy: vi.fn() });
  const view = render(<StudioPdfAnnotationPaintLayer session={renderer} page={0} scale={1} rotation={0} canvas={first} />);
  const options = vi.mocked(renderer.renderAnnotationLayer).mock.calls[0][2];
  view.rerender(<StudioPdfAnnotationPaintLayer session={renderer} page={0} scale={2} rotation={0} canvas={next} />);
  expect(options.signal?.aborted).toBe(true);
  const old = { destroy: vi.fn() }; await act(async () => pending.resolve(old));
  expect(old.destroy).toHaveBeenCalledOnce();
});
