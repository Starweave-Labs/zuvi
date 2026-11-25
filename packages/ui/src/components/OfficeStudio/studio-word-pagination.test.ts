import { describe, expect, it } from 'vitest';
import { wordPaginate, type WordLayoutBlock } from './studio-word-pagination';
const block = (
  from: number,
  count: number,
  options: Partial<WordLayoutBlock> = {}
): WordLayoutBlock => ({
  from,
  to: from + count,
  lines: Array.from({ length: count }, (_, i) => ({
    from: from + i,
    to: from + i + 1,
    height: 20,
  })),
  widowControl: false,
  ...options,
});
describe('Word measured pagination', () => {
  it('reserves repeated table headers on every continuation page', () => {
    const result = wordPaginate([block(0, 10, { continuationBefore: 20 })], 100);
    expect(result.placements.map((entry) => entry.page)).toEqual([0, 0, 0, 0, 0, 1, 1, 1, 1, 2]);
    expect(result.placements.filter((entry) => entry.page > 0 && entry.top === 20)).toHaveLength(2);
    expect(result.breaks.map((entry) => entry.continuationBefore)).toEqual([20, 20]);
    const oversized = wordPaginate(
      [
        {
          from: 0,
          to: 2,
          widowControl: false,
          continuationBefore: 30,
          lines: [
            { from: 0, to: 1, height: 80 },
            { from: 1, to: 2, height: 120 },
          ],
        },
      ],
      100
    );
    expect(oversized.pages).toBe(2);
    expect(oversized.overflow).toBe(true);
    expect(oversized.breaks[0].continuationBefore).toBeUndefined();
    expect(() => wordPaginate([block(0, 1, { continuationBefore: NaN })], 100)).toThrow();
  });
  it('splits paragraphs across pages by actual line heights', () => {
    const value = wordPaginate([block(0, 8)], 100);
    expect(value.pages).toBe(2);
    expect(value.placements.map((p) => p.page)).toEqual([0, 0, 0, 0, 0, 1, 1, 1]);
    expect(value.breaks[0]).toMatchObject({ position: 5, block: false });
  });
  it('moves a keep-lines paragraph to the next page without splitting it', () => {
    const value = wordPaginate([block(0, 3), block(3, 3, { keepLines: true })], 100);
    expect(value.placements.filter((p) => p.block === 1).map((p) => p.page)).toEqual([1, 1, 1]);
    expect(value.breaks[0]).toMatchObject({ position: 3, remaining: 40, block: true });
  });
  it('keeps a heading with the next paragraph first two lines', () => {
    const value = wordPaginate(
      [block(0, 3), block(3, 1, { keepNext: true }), block(4, 3, { widowControl: true })],
      100
    );
    expect(value.placements.find((p) => p.block === 1)?.page).toBe(1);
    expect(value.placements.find((p) => p.block === 2)?.page).toBe(1);
  });
  it('moves the complete intermediate paragraphs in keep-next chains and splits freely without a keep flag', () => {
    const chain = wordPaginate(
      [block(0, 3), block(3, 1, { keepNext: true }), block(4, 3, { keepNext: true }), block(7, 1)],
      100
    );
    expect(chain.placements.filter((p) => p.block === 1).map((p) => p.page)).toEqual([1]);
    expect(chain.placements.filter((p) => p.block === 2).map((p) => p.page)).toEqual([1, 1, 1]);
    const free = wordPaginate([block(0, 3), block(3, 3)], 100);
    expect(free.placements.filter((p) => p.block === 1).map((p) => p.page)).toEqual([0, 0, 1]);
  });
  it('avoids both orphan first lines and widow last lines when space permits', () => {
    const orphan = wordPaginate([block(0, 4), block(4, 4, { widowControl: true })], 100);
    expect(orphan.placements.filter((p) => p.block === 1).every((p) => p.page === 1)).toBe(true);
    const widow = wordPaginate([block(0, 6, { widowControl: true })], 100);
    expect(widow.placements.map((p) => p.page)).toEqual([0, 0, 0, 0, 1, 1]);
  });
  it('handles oversized keep constraints and explicit empty pages without loops', () => {
    const result = wordPaginate(
      [
        block(0, 8, { keepLines: true }),
        { from: 8, to: 9, lines: [], pageBreak: true },
        { from: 9, to: 10, lines: [], pageBreak: true },
        block(10, 1),
      ],
      100
    );
    expect(result.pages).toBe(4);
    expect(result.placements.at(-1)?.page).toBe(3);
    expect(
      wordPaginate(
        [{ from: 0, to: 1, lines: [{ from: 0, to: 1, height: 150 }], keepLines: true }],
        100
      ).overflow
    ).toBe(true);
  });
  it('rejects invalid geometry before building partial results', () => {
    expect(() => wordPaginate([block(0, 1)], 0)).toThrow();
    expect(() =>
      wordPaginate([{ ...block(0, 1), lines: [{ from: 0, to: 1, height: NaN }] }], 100)
    ).toThrow();
  });
});
