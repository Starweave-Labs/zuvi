import { describe, expect, it } from 'vitest';
import { wordTableFragmentBands, wordPaginateTableCells } from './studio-word-table-fragments';

describe('synchronized table cell fragments', () => {
  it('keeps short and empty cells aligned with every continuation of a long cell', () => {
    const bands = wordTableFragmentBands(
      [
        {
          from: 3,
          to: 9,
          lines: [
            { from: 3, to: 5, top: 2, bottom: 12 },
            { from: 5, to: 7, top: 12, bottom: 22 },
            { from: 7, to: 9, top: 22, bottom: 32 },
          ],
        },
        { from: 12, to: 14, lines: [{ from: 12, to: 14, top: 2, bottom: 12 }] },
        { from: 17, to: 17, lines: [] },
      ],
      36
    );
    expect(bands).toEqual([
      { top: 0, bottom: 12, anchors: [3, 12, 17] },
      { top: 12, bottom: 22, anchors: [5, 14, 17] },
      { top: 22, bottom: 36, anchors: [7, 14, 17] },
    ]);
    expect(bands.reduce((sum, band) => sum + band.bottom - band.top, 0)).toBe(36);
  });

  it('moves all overlapping lines together when font heights differ across columns', () => {
    const bands = wordTableFragmentBands(
      [
        {
          from: 3,
          to: 7,
          lines: [
            { from: 3, to: 5, top: 2, bottom: 12 },
            { from: 5, to: 7, top: 12, bottom: 22 },
          ],
        },
        { from: 10, to: 12, lines: [{ from: 10, to: 12, top: 4, bottom: 20 }] },
      ],
      26
    );
    expect(bands).toEqual([{ top: 0, bottom: 26, anchors: [3, 10] }]);
  });

  it('retains paragraph gaps and trailing padding without inventing document positions', () => {
    expect(
      wordTableFragmentBands(
        [
          {
            from: 3,
            to: 10,
            lines: [
              { from: 3, to: 5, top: 4, bottom: 14 },
              { from: 8, to: 10, top: 30, bottom: 40 },
            ],
          },
        ],
        44
      )
    ).toEqual([
      { top: 0, bottom: 30, anchors: [3] },
      { top: 30, bottom: 44, anchors: [8] },
    ]);
    expect(wordTableFragmentBands([{ from: 3, to: 3, lines: [] }], 10)).toEqual([
      { top: 0, bottom: 10, anchors: [3] },
    ]);
  });

  it('rejects corrupt measurements before producing any partial layout', () => {
    const line = { from: 3, to: 5, top: 2, bottom: 12 };
    for (const patch of [{ top: -1 }, { bottom: 30 }, { from: 2 }, { to: 7 }, { top: NaN }])
      expect(() =>
        wordTableFragmentBands([{ from: 3, to: 5, lines: [{ ...line, ...patch }] }], 20)
      ).toThrow();
    expect(() => wordTableFragmentBands([], 20)).toThrow();
    expect(() => wordTableFragmentBands([{ from: 3, to: 3, lines: [] }], Infinity)).toThrow();
  });
});

describe('independent table cell page consumption', () => {
  const cells = [
    {
      from: 3,
      to: 7,
      lines: [
        { from: 3, to: 5, top: 2, bottom: 12 },
        { from: 5, to: 7, top: 12, bottom: 22 },
      ],
    },
    {
      from: 10,
      to: 14,
      lines: [
        { from: 10, to: 12, top: 4, bottom: 20 },
        { from: 12, to: 14, top: 20, bottom: 36 },
      ],
    },
    { from: 17, to: 17, lines: [] },
  ];
  it('splits staggered columns independently where there is no shared horizontal cut', () => {
    const result = wordPaginateTableCells(cells, 36, 20);
    expect(result.startOnNextPage).toBe(false);
    expect(result.pages.map((page) => page.height)).toEqual([20, 16]);
    expect(result.pages.map((page) => page.cells.map((cell) => [cell.from, cell.to]))).toEqual([
      [
        [3, 5],
        [10, 12],
        [17, 17],
      ],
      [
        [5, 7],
        [12, 14],
        [17, 17],
      ],
    ]);
    expect(result.pages.every((page) => !page.overflow)).toBe(true);
  });
  it('moves the first fragment together when only one column fits the preceding page', () => {
    const result = wordPaginateTableCells(cells, 36, 20, 15);
    expect(result.startOnNextPage).toBe(true);
    expect(result.pages[0].cells.map((cell) => cell.firstLine)).toEqual([0, 0, 0]);
    expect(result.pages.map((page) => page.height)).toEqual([20, 16]);
  });
  it('preserves oversized lines, trailing padding and empty rows without loops', () => {
    const result = wordPaginateTableCells(
      [
        {
          from: 3,
          to: 7,
          lines: [
            { from: 3, to: 5, top: 2, bottom: 32 },
            { from: 5, to: 7, top: 32, bottom: 42 },
          ],
        },
      ],
      44,
      20
    );
    expect(result.pages.map((page) => [page.height, page.overflow])).toEqual([
      [32, true],
      [12, false],
    ]);
    expect(wordPaginateTableCells([{ from: 3, to: 3, lines: [] }], 10, 20, 5)).toMatchObject({
      startOnNextPage: true,
      pages: [{ height: 10, overflow: false }],
    });
    expect(() => wordPaginateTableCells(cells, 36, 20, 21)).toThrow();
  });
});

it('retains complete glyph boxes when consecutive line boxes overlap', () => {
  const result = wordPaginateTableCells(
    [
      {
        from: 3,
        to: 7,
        lines: [
          { from: 3, to: 5, top: 0, bottom: 20 },
          { from: 5, to: 7, top: 10, bottom: 30 },
        ],
      },
    ],
    30,
    20
  );
  expect(result.pages.map((page) => [page.height, page.overflow])).toEqual([
    [20, false],
    [20, false],
  ]);
  expect(result.pages.map((page) => [page.cells[0].from, page.cells[0].to])).toEqual([
    [3, 5],
    [5, 7],
  ]);
});
