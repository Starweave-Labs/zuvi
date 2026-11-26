import { describe, expect, it } from 'vitest';
import { pdfCopyPages, pdfInsertBlankPage, pdfMovePages, pdfPages, pdfRemovePages, pdfResizePages, pdfRotatePages } from './studio-pdf-pages';
import { isOfficeStudioDocument } from './studio-model';
import type { StudioPdfDocument } from './studio-types';
function original(): StudioPdfDocument { return { version: 1, id: 'pages', name: 'Pages.pdf', kind: 'pdf', pageCount: 3, rotations: { 1: 90 }, marks: [{ id: 'mark', page: 1, type: 'text', x: 10, y: 30, text: 'Text', size: 12 }], fields: [{ name: 'check', type: 'checkbox', value: true, readOnly: false, widgets: [{ page: 0, x: 10, y: 10, width: 20, height: 20 }, { page: 2, x: 10, y: 10, width: 20, height: 20 }] }] }; }
describe('PDF page identity and mapping', () => {
  it('inserts, moves, copies and removes page instances while preserving independent mark identity and shared field widgets', () => {
    const before = original();
    const blank = pdfInsertBlankPage(before, 1, { width: 300, height: 600 });
    expect(blank.pageCount).toBe(4); expect(blank.sourcePageCount).toBe(3); expect(blank.marks[0].page).toBe(2); expect(blank.rotations).toEqual({ 2: 90 });
    const copied = pdfCopyPages(blank, [2], 0);
    expect(copied.marks).toHaveLength(2); expect(new Set(copied.marks.map(mark => mark.id)).size).toBe(2);
    const moved = pdfMovePages(copied, [4], 0);
    expect(moved.fields[0].widgets?.[1].page).toBe(0);
    const removed = pdfRemovePages(moved, [1, 3]);
    expect(removed.pageCount).toBe(3); expect(isOfficeStudioDocument(removed)).toBe(true);
    expect(before).toEqual(original());
  });
  it('rejects last-page deletion, invalid selection and dimensions before changing the original', () => {
    const before = original();
    expect(() => pdfRemovePages(before, [0, 1, 2])).toThrow('至少');
    expect(() => pdfRemovePages(before, [0, 0])).toThrow('重复');
    expect(() => pdfMovePages(before, [3], 0)).toThrow('有效');
    expect(() => pdfInsertBlankPage(before, 1, { width: Infinity, height: 300 })).toThrow('宽高');
    expect(() => pdfRotatePages(before, [1], 45)).toThrow('90');
    expect(before).toEqual(original());
  });
  it('keeps noncontiguous movement in source order and treats an unchanged placement as a no-op', () => {
    const before = original();
    expect(pdfMovePages(before, [0, 1], 2)).toBe(before);
    expect(pdfPages(pdfMovePages(before, [0, 2], 3)).map(page => page.sourcePage)).toEqual([1, 0, 2]);
    expect(pdfRotatePages(before, [0], 360)).toBe(before);
  });
  it('records resized canvas separately from the native page origin and rejects corrupted page metadata', () => {
    const before = original(), next = pdfResizePages(before, [0, 2], { width: 600, height: 300 });
    expect(next.pages?.[0]).toEqual({ id: 'source-0', sourcePage: 0, size: { width: 600, height: 300 } });
    expect(next.pages?.[1].size).toBeUndefined(); expect(next.fields).toEqual(before.fields);
    expect(() => pdfPages({ ...next, pages: [next.pages![0], next.pages![0], next.pages![2]] })).toThrow('身份');
    expect(isOfficeStudioDocument({ ...next, sourcePageCount: 0 })).toBe(false);
  });
});

it('maps nonvisual canonical radio widgets without clearing their value or exposing them as visible controls', () => {
  const before = original(); before.fields = [{ name: 'Hidden', type: 'choice', value: 'H', options: ['H', 'V'], readOnly: false,
    widgets: [{ page: 0, x: 40, y: 40, width: 16, height: 16, option: 'V' }],
    hiddenWidgets: [{ page: 0, x: 20, y: 40, width: 0, height: 0, option: 'H', flags: 32 }] }];
  const next = pdfInsertBlankPage(before, 0, { width: 200, height: 100 });
  expect(next.fields[0].value).toBe('H'); expect(next.fields[0].hiddenWidgets?.[0].page).toBe(1); expect(next.fields[0].widgets).toHaveLength(1);
  expect(new Set(next.fields[0].options)).toEqual(new Set(['H', 'V'])); expect(isOfficeStudioDocument(next)).toBe(true);
  const removed = pdfRemovePages(next, [1]); expect(removed.fields[0].value).toBe(''); expect(removed.fields[0].hiddenWidgets).toHaveLength(0); expect(removed.fields[0].options).toEqual([]);
});
