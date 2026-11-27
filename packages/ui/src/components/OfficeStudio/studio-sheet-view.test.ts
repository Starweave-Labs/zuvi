import { describe, expect, it } from 'vitest';
import { studioBuildRowLayout } from './studio-sheet-layout';
import {
  studioPatchSheetView,
  studioParseSheetZoom,
  studioSetSheetView,
  studioSheetView,
  studioSheetViewGeometry,
  studioViewCellBorders,
  studioViewColumnOffsets,
  studioViewPointerCell,
  studioViewRangeRects,
  studioViewRebasedScroll,
  studioViewRowLayout,
} from './studio-sheet-view';
import type { StudioExcelDocument } from './studio-types';

function fixture(): StudioExcelDocument {
  return {
    version: 1,
    kind: 'excel',
    id: 'view-model',
    name: 'View.xlsx',
    activeSheetId: 's',
    sheets: [
      {
        id: 's',
        name: 'Main',
        rowCount: 20,
        columnCount: 5,
        cells: { A1: { input: '3', fontSize: 24 }, C4: { input: '=A1*2' } },
        protectedRanges: ['A1:C4'],
      },
    ],
  };
}

describe('Sheet view authoring and physical coordinates', () => {
  it('retains native 10–24% zoom while only authoring 25–400 and preserves an unchanged model', () => {
    const original = fixture();
    original.sheets[0].view = { zoom: 10, showGridLines: true, showRowColHeaders: false };
    expect(studioSheetView(original.sheets[0].view).zoom).toBe(10);
    expect(studioSetSheetView(original, 's', { showGridLines: true })).toBe(original);
    expect(studioSetSheetView(original, 's', { zoom: undefined })).toBe(original);
    for (const zoom of [9, 10, 24, 24.5, 401, NaN]) {
      expect(() => studioSetSheetView(original, 's', { zoom })).toThrow();
    }
    const next = studioSetSheetView(original, 's', { zoom: 25, showGridLines: false });
    expect(next.sheets[0].view).toEqual({
      zoom: 25,
      showGridLines: false,
      showRowColHeaders: false,
    });
    expect(next.sheets[0].cells).toBe(original.sheets[0].cells);
    expect(next.sheets[0].protectedRanges).toBe(original.sheets[0].protectedRanges);
    expect(original.sheets[0].view.zoom).toBe(10);
    expect(studioSetSheetView(next, 's', { zoom: 400 }).sheets[0].view?.zoom).toBe(400);
  });

  it('rejects malformed native attributes and unknown patches before changing cells or view', () => {
    const original = fixture();
    expect(studioSheetView()).toEqual({ zoom: 100, showGridLines: true, showRowColHeaders: true });
    expect(() =>
      studioSheetView({ zoom: 25.5, showGridLines: true, showRowColHeaders: true })
    ).toThrow();
    expect(() => studioPatchSheetView(undefined, { showGridLines: 'false' } as never)).toThrow();
    expect(() => studioSetSheetView(original, 'missing', { zoom: 25 })).toThrow();
    expect(() => studioPatchSheetView(undefined, { zoom: 25, surprise: true } as never)).toThrow();
    expect(original.sheets[0].view).toBeUndefined();
    expect(original.sheets[0].cells.A1.input).toBe('3');
  });

  it('parses integer percent drafts without accepting decimals, garbage or out-of-range input', () => {
    expect(['25', '+400%', ' 125 ％ ', '00100'].map(studioParseSheetZoom)).toEqual([
      25, 400, 125, 100,
    ]);
    for (const input of ['', '24', '401', '100.0', '1e2', '100%%', '250abc'])
      expect(studioParseSheetZoom(input)).toBeUndefined();
  });

  it.each([25, 400])(
    'hits visible cells correctly at %i%% after scroll, hiding and freezing',
    (zoom) => {
      const geometry = studioSheetViewGeometry({
        zoom,
        showGridLines: true,
        showRowColHeaders: true,
      });
      const { scale, headerHeight, rowHeaderWidth } = geometry;
      const logical = studioBuildRowLayout([1, 3, 4, 6, 7, 8]);
      const input = {
        rect: { left: 13, top: 17, width: 40 + 600 * scale, height: 24 + 300 * scale },
        columnOffsets: studioViewColumnOffsets([0, 100, 100, 220, 300], scale, rowHeaderWidth),
        rowLayout: studioViewRowLayout(logical, scale),
        scrollLeft: 80 * scale,
        scrollTop: 24 * scale,
        freezeColumns: 1,
        freezeRows: 1,
        headerHeight,
        rowHeaderWidth,
      };
      expect(
        studioViewPointerCell({
          ...input,
          clientX: 13 + rowHeaderWidth + 150 * scale,
          clientY: 17 + headerHeight + 36 * scale,
        })
      ).toEqual({ row: 4, col: 4 });
      expect(
        studioViewPointerCell({
          ...input,
          clientX: 13 + rowHeaderWidth + 50 * scale,
          clientY: 17 + headerHeight + 12 * scale,
        })
      ).toEqual({ row: 1, col: 1 });
      expect(studioViewPointerCell({ ...input, clientX: 14, clientY: 18 })).toBeNull();
      expect(
        studioViewPointerCell({
          ...input,
          clientX: 13 + input.rect.width,
          clientY: 17 + headerHeight + 12 * scale,
        })
      ).toBeNull();
      expect(logical.offsets).toEqual([0, 24, 48, 72, 96, 120, 144]);
    }
  );

  it('removes header space and skips a hidden first column without moving logical cell identities', () => {
    const view = studioSheetViewGeometry({
      zoom: 25,
      showGridLines: false,
      showRowColHeaders: false,
    });
    expect(view).toEqual({ scale: 0.25, headerHeight: 0, rowHeaderWidth: 0 });
    const input = {
      clientX: 5,
      clientY: 3,
      rect: { left: 0, top: 0, width: 200, height: 100 },
      columnOffsets: studioViewColumnOffsets([0, 0, 100, 200], view.scale, 0),
      rowLayout: studioViewRowLayout(studioBuildRowLayout([2, 3]), view.scale),
      scrollLeft: 0,
      scrollTop: 0,
      freezeColumns: 1,
      freezeRows: 0,
      headerHeight: 0,
      rowHeaderWidth: 0,
    };
    expect(studioViewPointerCell(input)).toEqual({ row: 2, col: 2 });
  });

  it('splits and clips a scrolled fill preview at the frozen row and column boundaries', () => {
    const rects = studioViewRangeRects({
      range: { firstRow: 1, lastRow: 4, firstCol: 1, lastCol: 4 },
      columnOffsets: [40, 140, 140, 260, 340],
      rowLayout: studioBuildRowLayout([1, 3, 4]),
      freezeColumns: 1,
      freezeRows: 1,
      headerHeight: 24,
      viewport: { left: 50, top: 24, width: 300, height: 180 },
    });
    expect(rects).toEqual([
      { left: 90, top: 48, width: 100, height: 24 },
      { left: 90, top: 72, width: 100, height: 24 },
      { left: 190, top: 48, width: 150, height: 24 },
      { left: 190, top: 72, width: 150, height: 24 },
    ]);
    // Subtract scroll to obtain screen rectangles: none covers the header or the wrong lane.
    expect(rects.every((rect) => rect.left - 50 >= 40 && rect.top - 24 >= 24)).toBe(true);
  });

  it('scales explicit border widths once and rebases the same document viewport without editing its dimensions', () => {
    const borders = {
      input: '',
      borders: { right: { style: 'double' as const, color: '#112233' } },
    };
    expect(studioViewCellBorders(borders, 4)).toEqual({ borderRight: '12px double #112233' });
    expect(studioViewCellBorders(borders, 0.25)).toEqual({ borderRight: '0.75px double #112233' });
    const original = studioSheetViewGeometry(studioSheetView());
    const zoomed = studioSheetViewGeometry({
      zoom: 25,
      showGridLines: true,
      showRowColHeaders: false,
    });
    expect(studioViewRebasedScroll(original, zoomed, { left: 400, top: 600 })).toEqual({
      left: 100,
      top: 150,
    });
    expect(studioViewRebasedScroll(zoomed, original, { left: 100, top: 150 })).toEqual({
      left: 400,
      top: 600,
    });
    expect(borders.borders.right.style).toBe('double');
  });
});
