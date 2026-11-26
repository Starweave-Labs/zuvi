import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import StudioPdf from './StudioPdf';
import { OfficeStudio } from './OfficeStudio';
import type { StudioPdfComposer, StudioPdfComposeRequest, StudioPdfComposeResult, StudioPdfDocument, StudioPdfRenderer, StudioPdfSnapshot } from './studio-types';

afterEach(cleanup);
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
function initial(): StudioPdfSnapshot {
  return { source: new Blob(['Original PDF']), document: {
    version: 1, kind: 'pdf', id: 'source', name: 'Source.pdf', pageCount: 2, sourcePageCount: 2,
    pages: [{ id: 'first', sourcePage: 0 }, { id: 'second', sourcePage: 1 }],
    fields: [{ name: 'name', type: 'text', value: 'Original', readOnly: false, widgets: [{ page: 0, x: 20, y: 20, width: 160, height: 24 }] }],
    marks: [{ id: 'mark', type: 'text', page: 1, text: 'Pending', x: 20, y: 90, size: 12 }], rotations: {},
  } };
}
function result(request: StudioPdfComposeRequest): StudioPdfComposeResult {
  const original = request.snapshot.document;
  const pages = request.pages.map((page) => ({ id: original.pages![page].id, original: page }));
  if (request.mode === 'merge') pages.splice(request.insertAt!, 0, ...request.incoming!.pages.map((_, index) => ({ id: `incoming-${index}`, original: -1 })));
  const mapped = new Map(pages.flatMap((entry, page) => entry.original >= 0 ? [[entry.original, page] as const] : []));
  return {
    source: new Blob([`Combined ${pages.length}`]),
    document: { ...original, name: request.name ?? original.name, pageCount: pages.length, sourcePageCount: pages.length,
      pages: pages.map((entry, sourcePage) => ({ id: entry.id, sourcePage })),
      fields: original.fields.map((field) => ({ ...field, widgets: field.widgets?.flatMap((widget) => mapped.has(widget.page) ? [{ ...widget, page: mapped.get(widget.page)! }] : []) })),
      marks: original.marks.flatMap((mark) => mapped.has(mark.page) ? [{ ...mark, page: mapped.get(mark.page)! }] : []), rotations: {},
    },
  };
}
function host(options: { office?: boolean; compose?: StudioPdfComposer['compose']; model?: StudioPdfSnapshot; callback?: boolean; capability?: boolean } = {}) {
  const source = options.model ?? initial();
  let latest = source, accepted = true;
  const counts = new Map<Blob, number>([[source.source, source.document.pageCount]]);
  const makeRenderer = (): StudioPdfRenderer => ({ load: vi.fn(async (blob) => ({
    pageCount: counts.get(blob) ?? 2, supportsPageMapping: true, destroy: vi.fn(),
    render: vi.fn(async () => ({ width: 400, height: 500, toPdfPoint: (x: number, y: number) => [x, 500 - y] as [number, number], toViewportPoint: (x: number, y: number) => [x, 500 - y] as [number, number] })),
  })) });
  const renderer = makeRenderer();
  const composer: StudioPdfComposer = {
    inspect: vi.fn(async () => ({ pageCount: 2 })),
    compose: vi.fn(async (request) => {
      const next = await (options.compose ? options.compose(request) : result(request));
      counts.set(next.source, next.document.pageCount);
      return next;
    }),
  };
  const documentChange = vi.fn(), sourceChange = vi.fn();
  let update!: (next: StudioPdfSnapshot) => void;
  let setPermissions!: (next: { readOnly: boolean; disabled: boolean }) => void;
  let setRenderer!: (next: StudioPdfRenderer) => void;
  function Host() {
    const [snapshot, setSnapshot] = useState(source);
    const [permissions, changePermissions] = useState({ readOnly: false, disabled: false });
    const [currentRenderer, changeRenderer] = useState(renderer);
    latest = snapshot; update = setSnapshot; setPermissions = changePermissions; setRenderer = changeRenderer;
    const props = {
      source: snapshot.source, pdfRenderer: currentRenderer,
      pdfComposer: options.capability === false ? undefined : composer,
      onChange: (document: StudioPdfDocument) => { documentChange(document); setSnapshot((old) => ({ ...old, document })); },
      onPdfSourceChange: options.callback === false ? undefined : (change: { previous: StudioPdfSnapshot; next: StudioPdfSnapshot }) => {
        sourceChange(change);
        if (!accepted) return false;
        expect(change.previous.document).toBe(snapshot.document); expect(change.previous.source).toBe(snapshot.source);
        setSnapshot(change.next); return true;
      },
      ...permissions,
    };
    return options.office
      ? <OfficeStudio value={snapshot.document} {...props} onChange={(document) => { if (document.kind === 'pdf') props.onChange(document); }} />
      : <StudioPdf document={snapshot.document} {...props} />;
  }
  render(<Host />);
  return { initial: source, composer, sourceChange, documentChange, snapshot: () => latest, reject: (value: boolean) => { accepted = !value; }, update, setPermissions, setRenderer, makeRenderer };
}
async function ready() {
  await waitFor(() => expect(screen.getByRole('region', { name: 'PDF 页面编辑区' })).toHaveAttribute('aria-busy', 'false'));
}
async function merge() {
  fireEvent.click(screen.getByRole('button', { name: '合并 PDF 文件' }));
  const dialog = screen.getByRole('dialog', { name: '合并 PDF 文件' });
  fireEvent.change(within(dialog).getByLabelText('选择合并 PDF 文件'), { target: { files: [new File(['Incoming PDF'], 'Incoming.pdf', { type: 'application/pdf' })] } });
  await waitFor(() => expect(within(dialog).getByLabelText('加入 PDF 页码')).toHaveValue('1-2'));
  return dialog;
}
async function applyMerge() {
  const dialog = await merge(); fireEvent.click(within(dialog).getByRole('button', { name: '应用 PDF 合并' }));
  await waitFor(() => expect(screen.queryByRole('dialog', { name: '合并 PDF 文件' })).not.toBeInTheDocument()); await ready();
}

it('atomically changes the native source, isolates the following field edit and undoes or redoes the complete pair', async () => {
  const f = host({ office: true }); await ready();
  const dialog = await merge();
  fireEvent.change(within(dialog).getByLabelText('加入 PDF 页码'), { target: { value: '2' } });
  fireEvent.change(within(dialog).getByLabelText('合并 PDF 插入位置'), { target: { value: '3' } });
  fireEvent.click(within(dialog).getByRole('button', { name: '应用 PDF 合并' }));
  await waitFor(() => expect(f.snapshot().document.pageCount).toBe(3)); await ready();
  expect(f.sourceChange).toHaveBeenCalledTimes(1); expect(f.documentChange).not.toHaveBeenCalled();
  const combined = f.snapshot(); expect(combined.source).not.toBe(f.initial.source);
  expect(f.composer.compose).toHaveBeenCalledWith(expect.objectContaining({ insertAt: 2, incoming: expect.objectContaining({ pages: [1] }) }));
  fireEvent.change(screen.getByLabelText('PDF 页面表单 name'), { target: { value: 'Edited' } });
  fireEvent.click(screen.getByRole('button', { name: '撤销' }));
  expect(f.snapshot().source).toBe(combined.source); expect(f.snapshot().document.fields[0].value).toBe('Original');
  fireEvent.click(screen.getByRole('button', { name: '撤销' })); await ready();
  expect(f.snapshot().source).toBe(f.initial.source); expect(f.snapshot().document).toBe(f.initial.document);
  fireEvent.click(screen.getByRole('button', { name: '重做' })); await ready();
  expect(f.snapshot().source).toBe(combined.source); expect(f.snapshot().document).toBe(combined.document);
  expect(f.sourceChange).toHaveBeenCalledTimes(3);
});

it('extracts in entered page order with stable identities, remaps editable marks and restores the original name and source', async () => {
  const f = host(); await ready(); fireEvent.click(screen.getByRole('button', { name: '提取 PDF 页面' }));
  const dialog = screen.getByRole('dialog', { name: '提取 PDF 页面' });
  fireEvent.change(within(dialog).getByLabelText('提取 PDF 页码'), { target: { value: '2,1' } });
  fireEvent.click(within(dialog).getByRole('button', { name: '应用 PDF 提取' }));
  await waitFor(() => expect(f.snapshot().document.name).toBe('Source-提取.pdf')); await ready();
  expect(f.snapshot().document.pages!.map((page) => page.id)).toEqual(['second', 'first']);
  expect(f.snapshot().document.marks[0]).toEqual({ ...f.initial.document.marks[0], page: 0 });
  fireEvent.click(screen.getByRole('button', { name: '撤销' })); await ready(); expect(f.snapshot()).toEqual(f.initial);
});

it('blocks invalid ranges and composition submission during IME, and cancels without changing history', async () => {
  const f = host(); await ready(); fireEvent.click(screen.getByRole('button', { name: '提取 PDF 页面' }));
  const dialog = screen.getByRole('dialog', { name: '提取 PDF 页面' }), input = within(dialog).getByLabelText('提取 PDF 页码');
  fireEvent.change(input, { target: { value: '1,1' } }); fireEvent.click(within(dialog).getByRole('button', { name: '应用 PDF 提取' }));
  expect(within(dialog).getByRole('alert')).toHaveTextContent('不能重复');
  fireEvent.change(input, { target: { value: '2' } }); fireEvent.compositionStart(input);
  fireEvent.keyDown(input, { key: 'Enter', isComposing: true }); fireEvent.submit(input.closest('form')!);
  expect(f.composer.compose).not.toHaveBeenCalled(); fireEvent.compositionEnd(input);
  fireEvent.click(within(dialog).getByRole('button', { name: '取消' })); expect(f.snapshot()).toBe(f.initial);
  expect(screen.getByRole('button', { name: '撤销' })).toBeDisabled();
});

it('aborts an in-flight merge on cancel and ignores its eventual native result', async () => {
  const task = deferred<StudioPdfComposeResult>(); const f = host({ compose: () => task.promise }); await ready();
  const dialog = await merge(); fireEvent.click(within(dialog).getByRole('button', { name: '应用 PDF 合并' }));
  await waitFor(() => expect(f.composer.compose).toHaveBeenCalledTimes(1));
  const request = vi.mocked(f.composer.compose).mock.calls[0][0];
  fireEvent.click(within(dialog).getByRole('button', { name: '取消' })); expect(request.signal?.aborted).toBe(true);
  await act(async () => task.resolve(result(request))); expect(f.sourceChange).not.toHaveBeenCalled(); expect(f.snapshot()).toBe(f.initial);
});

it.each(['readOnly', 'disabled'] as const)('discards a pending result when %s becomes active', async (permission) => {
  const task = deferred<StudioPdfComposeResult>(); const f = host({ compose: () => task.promise }); await ready();
  const dialog = await merge(); fireEvent.click(within(dialog).getByRole('button', { name: '应用 PDF 合并' }));
  await waitFor(() => expect(f.composer.compose).toHaveBeenCalledTimes(1)); const request = vi.mocked(f.composer.compose).mock.calls[0][0];
  act(() => f.setPermissions({ readOnly: permission === 'readOnly', disabled: permission === 'disabled' }));
  expect(screen.queryByRole('dialog', { name: '合并 PDF 文件' })).not.toBeInTheDocument();
  await act(async () => task.resolve(result(request))); expect(f.sourceChange).not.toHaveBeenCalled(); expect(f.snapshot()).toBe(f.initial);
  expect(screen.getByRole('button', { name: '合并 PDF 文件' })).toBeDisabled();
});

it.each(['document', 'source', 'renderer'] as const)('rejects a result from an old %s scope', async (scope) => {
  const task = deferred<StudioPdfComposeResult>(); const f = host({ compose: () => task.promise }); await ready();
  const dialog = await merge(); fireEvent.click(within(dialog).getByRole('button', { name: '应用 PDF 合并' }));
  await waitFor(() => expect(f.composer.compose).toHaveBeenCalledTimes(1)); const request = vi.mocked(f.composer.compose).mock.calls[0][0];
  act(() => {
    if (scope === 'renderer') f.setRenderer(f.makeRenderer());
    else f.update({ ...f.initial, ...(scope === 'source' ? { source: new Blob(['Replaced']) } : { document: { ...f.initial.document, name: 'New input.pdf' } }) });
  });
  const before = f.snapshot(); await act(async () => task.resolve(result(request)));
  expect(f.sourceChange).not.toHaveBeenCalled(); expect(f.snapshot()).toBe(before);
});

it('keeps prior history intact when the controlled host rejects composition', async () => {
  const f = host(); await ready(); fireEvent.click(screen.getByRole('button', { name: '旋转当前页' })); await ready();
  f.reject(true); const dialog = await merge(); fireEvent.click(within(dialog).getByRole('button', { name: '应用 PDF 合并' }));
  await waitFor(() => expect(within(dialog).getByRole('alert')).toHaveTextContent('未接受'));
  expect(f.snapshot().source).toBe(f.initial.source); expect(f.snapshot().document.rotations).toEqual({ '0': 90 });
  fireEvent.click(within(dialog).getByRole('button', { name: '取消' })); fireEvent.click(screen.getByRole('button', { name: '撤销' }));
  expect(f.snapshot().document.rotations).toEqual({}); expect(f.sourceChange).toHaveBeenCalledTimes(1);
});

it('does not pop a paired history entry when its native source restoration is rejected', async () => {
  const f = host(); await ready(); await applyMerge(); const combined = f.snapshot();
  f.reject(true); fireEvent.click(screen.getByRole('button', { name: '撤销' }));
  expect(f.snapshot()).toBe(combined); expect(screen.getByRole('button', { name: '撤销' })).toBeEnabled();
  expect(screen.getByRole('button', { name: '重做' })).toBeDisabled();
  f.reject(false); fireEvent.click(screen.getByRole('button', { name: '撤销' })); await ready(); expect(f.snapshot()).toEqual(f.initial);
});

it.each([{ callback: false }, { capability: false }])('disables composition without a complete host capability: %j', async (options) => {
  const f = host(options); await ready();
  expect(screen.getByRole('button', { name: '合并 PDF 文件' })).toBeDisabled(); expect(screen.getByRole('button', { name: '提取 PDF 页面' })).toBeDisabled();
  expect(f.sourceChange).not.toHaveBeenCalled();
});

it('keeps passive source appearances visible without editable HTML controls or a design entry', async () => {
  const model = initial(); model.document.fields.push({ name: 'private', type: 'opaque', value: '', readOnly: true, nativeType: 'CustomField', nativeValueHash: '1'.repeat(64), passiveReason: '未知原生字段', widgets: [{ page: 0, x: 20, y: 200, width: 100, height: 24, flags: 4 }] });
  host({ model }); await ready(); expect(screen.queryByLabelText('PDF 页面表单 private')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '表单 2' })); expect(screen.getByText('未知原生字段 · 保留原始值与外观')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '设计 PDF 字段 private' })).toBeDisabled();
});
