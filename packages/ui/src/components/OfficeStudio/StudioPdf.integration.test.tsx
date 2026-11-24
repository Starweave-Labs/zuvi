import * as React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { OfficeStudio } from './OfficeStudio';
import type { OfficeStudioHandle, StudioPdfDocument, StudioPdfRenderer } from './studio-types';

afterEach(cleanup);

it('commits date drafts before file operations and blocks invalid snapshots until corrected or cancelled', async () => {
  const source = new Blob(['%PDF-original']);
  const model: StudioPdfDocument = {
    version: 1,
    id: 'date-form',
    name: 'form.pdf',
    kind: 'pdf',
    pageCount: 1,
    marks: [],
    rotations: {},
    fields: [
      {
        name: 'date',
        type: 'text',
        value: '',
        readOnly: false,
        design: { kind: 'date' },
        widgets: [{ page: 0, x: 10, y: 10, width: 160, height: 26 }],
      },
    ],
  };
  const renderer: StudioPdfRenderer = {
    load: vi.fn(async () => ({
      pageCount: 1,
      destroy: vi.fn(),
      render: vi.fn(async () => ({
        width: 400,
        height: 600,
        toPdfPoint: (x: number, y: number) => [x, 600 - y] as [number, number],
        toViewportPoint: (x: number, y: number) => [x, 600 - y] as [number, number],
      })),
    })),
  };
  const ref = React.createRef<OfficeStudioHandle>();
  const save = vi.fn();
  const exportFile = vi.fn();
  const print = vi.fn();
  function Host() {
    const [value, setValue] = React.useState(model);
    return (
      <OfficeStudio
        ref={ref}
        value={value}
        onChange={(next) => {
          if (next.kind === 'pdf') setValue(next);
        }}
        source={source}
        pdfRenderer={renderer}
        onSave={save}
        onExport={exportFile}
        onPrint={print}
      />
    );
  }
  render(<Host />);
  const input = await screen.findByLabelText('PDF 页面表单 date');
  await waitFor(() => expect(input).toBeEnabled());
  await userEvent.type(input, '2026-11-24');
  await act(() => ref.current!.save());
  expect(save.mock.calls[0][0].fields[0].value).toBe('2026-11-24');
  fireEvent.change(input, { target: { value: '2026-02-30' } });
  await act(async () => {
    await expect(ref.current!.export()).rejects.toThrow('有效');
    await expect(ref.current!.print()).rejects.toThrow('有效');
    expect(() => ref.current!.getDocument()).toThrow('有效');
  });
  expect(exportFile).not.toHaveBeenCalled();
  expect(print).not.toHaveBeenCalled();
  expect(input).toHaveValue('2026-02-30');
  fireEvent.keyDown(input, { key: 'Escape' });
  await act(() => ref.current!.export());
  expect(exportFile.mock.calls[0][0].fields[0].value).toBe('2026-11-24');
});
