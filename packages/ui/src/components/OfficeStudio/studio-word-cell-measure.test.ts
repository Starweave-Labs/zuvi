import { afterEach, describe, expect, it, vi } from 'vitest';
import { wordMeasureCellLines } from './studio-word-pagination-extension';
import { wordPaginate } from './studio-word-pagination';

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

it('measures an equation as one atomic position and includes its whole height without walking internal text', () => {
  const p = paragraph('a<span data-word-math="" contenteditable="false"><math><mfrac><mtext>numerator</mtext><mtext>denominator</mtext></mfrac></math></span>b');
  const formula = p.querySelector('[data-word-math]')!;
  Object.defineProperty(formula, 'getBoundingClientRect', { value: () => ({ top: 0, bottom: 60, height: 60, left: 5, right: 25, width: 20 }) });
  rects(range => {
    if (!['a', 'b'].includes(range.startContainer.textContent!)) throw new Error('Equation internal text must be atomic');
    return { top: 20, bottom: 40, left: range.startContainer.textContent === 'a' ? 0 : 25, right: range.startContainer.textContent === 'a' ? 5 : 30 };
  });
  expect(wordMeasureCellLines(p, 3, 0)).toEqual([{ from: 3, to: 6, top: 0, bottom: 60 }]);
});

it.each([false, true])('keeps a wrapped equation on a separate physical line (RTL: %s)', rtl => {
  const p = paragraph('a<span data-word-math="" contenteditable="false"><math><mtext>x</mtext></math></span>');
  p.style.direction = rtl ? 'rtl' : 'ltr';
  Object.defineProperty(p.querySelector('[data-word-math]')!, 'getBoundingClientRect', { value: () => ({ top: 10, bottom: 50, height: 40, left: rtl ? 80 : 0, right: rtl ? 100 : 20, width: 20 }) });
  rects(() => ({ top: 0, bottom: 20, left: rtl ? 0 : 80, right: rtl ? 20 : 100 }));
  expect(wordMeasureCellLines(p, 3, 0)).toEqual([
    { from: 3, to: 4, top: 0, bottom: 20 },
    { from: 4, to: 5, top: 10, bottom: 50 },
  ]);
});

it('counts zero-width bookmark atoms without changing physical line height', () => {
  rects(range => ({ top: 0, bottom: 20, left: range.startContainer.textContent === 'a' ? 0 : 5, right: range.startContainer.textContent === 'a' ? 5 : 10 }));
  expect(wordMeasureCellLines(paragraph('a<span data-word-bookmark="0"></span>b'), 3, 0)).toEqual([{ from: 3, to: 6, top: 0, bottom: 20 }]);
});

it('converts first and last glyph overhangs to the natural row flow boundary before strict cell pagination', () => {
  const p = paragraph('aa<br>bb<br>cc');
  rects(range => {
    const index = ['aa', 'bb', 'cc'].indexOf(range.startContainer.textContent!);
    const top = index * 16 - 0.5;
    return { top, bottom: top + 18, left: range.startOffset * 5, right: range.startOffset * 5 + 5 };
  });
  const lines = wordMeasureCellLines(p, 4, 0, 49);
  expect(lines).toEqual([
    { from: 4, to: 6, top: 0, bottom: 17.5 },
    { from: 7, to: 9, top: 15.5, bottom: 33.5 },
    { from: 10, to: 12, top: 31.5, bottom: 49 },
  ]);
  const result = wordPaginate([{ from: 0, to: 20, widowControl: false, lines: [
    { from: 1, to: 19, height: 49, cells: [{ from: 4, to: 12, lines }] },
  ] }], 24);
  expect(result.overflow).toBe(false); expect(result.pages).toBe(3);
});

it('removes a raised-run paint offset before applying the row flow boundary', () => {
  const p = paragraph('<span style="position:relative;top:-16px">aa</span><br>bb');
  rects(range => {
    const raised = range.startContainer.textContent === 'aa';
    const top = raised ? -16.5 : 15.5;
    return { top, bottom: top + 18, left: range.startOffset * 5, right: range.startOffset * 5 + 5 };
  });
  expect(wordMeasureCellLines(p, 4, 0, 33)).toEqual([
    { from: 4, to: 6, top: 0, bottom: 17.5 },
    { from: 7, to: 9, top: 15.5, bottom: 33 },
  ]);
  expect(() => wordMeasureCellLines(p, 4, 0, 0)).toThrow();
});
