import { afterEach, describe, expect, it, vi } from 'vitest';
import { wordMeasureCellLines } from './studio-word-pagination-extension';

const original = Object.getOwnPropertyDescriptor(Range.prototype, 'getBoundingClientRect');
afterEach(() => {
  if (original) Object.defineProperty(Range.prototype, 'getBoundingClientRect', original);
  else Reflect.deleteProperty(Range.prototype, 'getBoundingClientRect');
});
function rects(
  measure: (range: Range) => { top: number; bottom: number; left: number; right: number }
) {
  Object.defineProperty(Range.prototype, 'getBoundingClientRect', {
    configurable: true,
    value: vi.fn(function (this: Range) {
      const rect = measure(this);
      return { ...rect, height: rect.bottom - rect.top, width: rect.right - rect.left };
    }),
  });
}
function paragraph(html: string) {
  const p = document.createElement('p');
  p.innerHTML = html;
  return p;
}
describe('cell line measurement', () => {
  it('keeps explicit line breaks separate when single-spacing glyph boxes overlap', () => {
    rects((range) => {
      const top = range.startContainer.textContent === 'bb' ? 10 : 0;
      const left = range.startOffset * 5;
      return { top, bottom: top + 20, left, right: left + 5 };
    });
    expect(wordMeasureCellLines(paragraph('aa<br>bb'), 3, 0)).toEqual([
      { from: 3, to: 5, top: 0, bottom: 20 },
      { from: 6, to: 8, top: 10, bottom: 30 },
    ]);
  });
  it('recognizes natural LTR wrapping despite overlapping glyph boxes', () => {
    rects((range) => {
      const top = range.startOffset < 2 ? 0 : 10;
      const left = (range.startOffset % 2) * 5;
      return { top, bottom: top + 20, left, right: left + 5 };
    });
    expect(wordMeasureCellLines(paragraph('abcd'), 3, 0)).toEqual([
      { from: 3, to: 5, top: 0, bottom: 20 },
      { from: 5, to: 7, top: 10, bottom: 30 },
    ]);
  });
  it('retains mixed font glyphs on the same physical line', () => {
    rects((range) => ({
      top: range.startOffset ? 10 : 0,
      bottom: 30,
      left: range.startOffset * 10,
      right: range.startOffset * 10 + 10,
    }));
    expect(wordMeasureCellLines(paragraph('ab'), 3, 0)).toEqual([
      { from: 3, to: 5, top: 0, bottom: 30 },
    ]);
  });
  it('recognizes wrapping in an RTL paragraph', () => {
    const p = paragraph('abcd');
    p.style.direction = 'rtl';
    rects((range) => {
      const top = range.startOffset < 2 ? 0 : 10;
      const right = 100 - (range.startOffset % 2) * 5;
      return { top, bottom: top + 20, left: right - 5, right };
    });
    expect(wordMeasureCellLines(p, 3, 0)).toHaveLength(2);
  });
});

it('measures logical line boxes without baseline-shift paint offsets', () => {
  const p = paragraph('<span style="position:relative;top:-10px">ab</span>');
  rects((range) => ({
    top: -10,
    bottom: 10,
    left: range.startOffset * 5,
    right: range.startOffset * 5 + 5,
  }));
  expect(wordMeasureCellLines(p, 3, 0)).toEqual([{ from: 3, to: 5, top: 0, bottom: 20 }]);
});

it.each([false, true])('keeps disjoint raised/lowered glyph boxes on the same line (lowered first: %s)', (lowered) => {
  rects((range) => {
    const top = (range.startOffset === 0) === lowered ? 40 : 0;
    return { top, bottom: top + 16, left: range.startOffset * 12, right: range.startOffset * 12 + 10 };
  });
  expect(wordMeasureCellLines(paragraph('ab'), 3, 0)).toEqual([
    { from: 3, to: 5, top: 0, bottom: 56 },
  ]);
});
