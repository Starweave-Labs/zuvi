import { describe, expect, it } from 'vitest';
import {
  sheetAutoRowHeights,
  sheetCenterContinuousSegments,
  sheetLayoutText,
  type SheetTextBox,
  type SheetTextFont,
  type SheetTextLayoutInput,
  type SheetTextMeasure,
} from './studio-sheet-text-layout';
import type { SheetTextFormat, SheetTextScalar } from './studio-sheet-text-properties';
import { studioFormatNumber } from './studio-number-format';

const defaultFont: SheetTextFont = { family: 'Test Sans', sizePt: 10, bold: false, italic: false };
// Synthetic shaped advances exercise geometry, not native font acceptance.
const measure: SheetTextMeasure = (text, font) => {
  const units = Array.from(
    new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text),
    (entry) => entry.segment
  );
  const factor = font.sizePt / 10;
  let widths = units.map((unit) => (unit === ' ' ? 4 : 10) * factor);
  if (text === 'fi') widths = [10 * factor, 8 * factor];
  return {
    width: widths.reduce((sum, width) => sum + width, 0),
    height: 20 * factor,
    ascent: 15 * factor,
    advances: widths,
  };
};
function input(
  format: SheetTextFormat = {},
  value: SheetTextScalar = 'ABCD',
  box: Partial<SheetTextBox> = {}
): SheetTextLayoutInput {
  return { value, format, box: { width: 100, height: 60, ...box }, defaultFont, measure };
}

describe('Excel pure text geometry', () => {
  it('fills the available width by repeating display without changing the logical text or shrinking it', () => {
    const result = sheetLayoutText(input({ align: 'fill' }, 'AB', { width: 95 }));
    expect(result.text).toBe('AB');
    expect(result.lines[0].text).toBe('ABABABAB');
    expect(result.naturalTextBox.width).toBe(80);
    expect(result.notes).not.toContain('fill-rendering-not-implemented');
    const wide = sheetLayoutText(input({ align: 'fill' }, 'ABCDEFGHIJKL', { width: 40 }));
    expect(wide.lines[0].text).toBe('ABCDEFGHIJKL');
  });
  it('inherits actual default-font family, size and flags while explicit false stays direct', () => {
    const inherited = sheetLayoutText({
      ...input({}, 'AB'),
      defaultFont: { family: 'Theme Font', sizePt: 9.5, bold: true, italic: true },
    });
    expect(inherited.nominalFont).toEqual({
      family: 'Theme Font',
      sizePt: 9.5,
      bold: true,
      italic: true,
    });
    const direct = sheetLayoutText({
      ...input({ bold: false, italic: false }, 'AB'),
      defaultFont: { family: 'Theme Font', sizePt: 9.5, bold: true, italic: true },
    });
    expect(direct.nominalFont.bold).toBe(false);
    expect(direct.nominalFont.italic).toBe(false);
    expect(() =>
      sheetLayoutText({
        ...input({}, 'AB'),
        defaultFont: { family: '', sizePt: 9.5, bold: true, italic: true },
      })
    ).toThrow('字体名称');
    expect(() =>
      sheetLayoutText({
        ...input({}, 'AB'),
        defaultFont: { family: 'Theme Font', sizePt: 9.5, bold: undefined, italic: true } as never,
      })
    ).toThrow('默认字体上下文');
  });

  it('positions measured text for left/center/right and actual numeric @ formatting', () => {
    const results = ['left', 'center', 'right'].map((align) =>
      sheetLayoutText(input({ align: align as 'left' | 'center' | 'right' }))
    );
    expect(results.map((result) => result.lines[0].runs[0].quad[0].x)).toEqual([0, 30, 60]);
    const formatted = sheetLayoutText({
      ...input({}, 42),
      numberFormat: '@',
      numberFormats: { format: studioFormatNumber },
    });
    expect(formatted.text).toBe('42');
    expect(formatted.align).toBe('left');
  });
  it('uses default-font three-space indent independently of cell font size', () => {
    const left = sheetLayoutText(input({ align: 'left', indent: 2, fontSize: 20 }));
    const right = sheetLayoutText(input({ align: 'right', indent: 2, fontSize: 20 }));
    const distributed = sheetLayoutText(input({ align: 'distributed', indent: 1 }));
    expect(left.indentPx).toBe(24);
    expect(left.contentBox.x).toBe(24);
    expect(right.contentBox.width).toBe(76);
    expect(distributed.contentBox.x).toBe(12);
    expect(distributed.contentBox.width).toBe(76);
  });
  it('rotates measured blocks in both directions and swaps dimensions at right angles', () => {
    for (const angle of [-90, 90]) {
      const result = sheetLayoutText(
        input({ textRotation: angle, align: 'left', verticalAlign: 'top' }, 'ABCD', {
          width: 100,
          height: 100,
        })
      );
      expect(result.naturalTextBox.width).toBeCloseTo(20);
      expect(result.naturalTextBox.height).toBeCloseTo(40);
      expect(result.transform.b).toBe(angle === 90 ? -1 : 1);
      expect(result.verticalGlyphs).toBe(false);
    }
    for (const angle of [-45, 45]) {
      const result = sheetLayoutText(
        input({ textRotation: angle }, 'ABCD', { width: 100, height: 100 })
      );
      expect(result.naturalTextBox.width).toBeCloseTo(60 / Math.sqrt(2));
      expect(result.naturalTextBox.height).toBeCloseTo(60 / Math.sqrt(2));
      expect(Math.sign(result.transform.b)).toBe(angle > 0 ? -1 : 1);
    }
  });
  it('keeps combined characters and emoji upright in vertical mode', () => {
    const result = sheetLayoutText(
      input({ textRotation: 'vertical', verticalAlign: 'top' }, 'a\u0301👨‍👩‍👧‍👦', {
        width: 100,
        height: 100,
      })
    );
    expect(result.verticalGlyphs).toBe(true);
    expect(result.lines[0].runs.map((run) => run.text)).toEqual(['a\u0301', '👨‍👩‍👧‍👦']);
    expect(result.transform.b).toBe(0);
    expect(result.lines[0].runs[1].y - result.lines[0].runs[0].y).toBe(20);
    expect(result.lines[0].runs[0].quad[1].y).toBe(result.lines[0].runs[0].quad[0].y);
  });
  it('retains wrap/shrink flags and nominal font when explicit or effective wrap wins', () => {
    const formats: SheetTextFormat[] = [
      { wrap: true, shrinkToFit: true, fontSize: 12.5 },
      { align: 'distributed', shrinkToFit: true, fontSize: 12.5 },
      { verticalAlign: 'justify', shrinkToFit: true, fontSize: 12.5 },
    ];
    for (const format of formats) {
      const snapshot = JSON.stringify(format);
      const result = sheetLayoutText(input(format, 'ABCDEFGHIJKL', { width: 40 }));
      expect(result.wrapEffective).toBe(true);
      expect(result.shrinkApplied).toBe(false);
      expect(result.effectiveFont.sizePt).toBe(12.5);
      expect(result.lines.length).toBeGreaterThan(1);
      expect(JSON.stringify(format)).toBe(snapshot);
    }
  });
  it('shrinks drawing only, respects half-point/minimum steps and never enlarges tiny fonts', () => {
    const format = Object.freeze({ shrinkToFit: true, fontSize: 10 });
    const result = sheetLayoutText(input(format, 'ABCDEFGHIJ', { width: 50 }));
    expect(result.effectiveFont.sizePt).toBe(5);
    expect(result.nominalFont.sizePt).toBe(10);
    expect(result.naturalTextBox.width).toBe(50);
    expect(format.fontSize).toBe(10);
    const minimum = sheetLayoutText(input(format, 'ABCDEFGHIJ', { width: 1 }));
    expect(minimum.effectiveFont.sizePt).toBe(1);
    expect(minimum.overconstrained).toBe(true);
    const tiny = sheetLayoutText(
      input({ shrinkToFit: true, fontSize: 1 }, 'ABCDEFGHIJ', { width: 1 })
    );
    expect(tiny.effectiveFont.sizePt).toBe(1);
    expect(tiny.shrinkApplied).toBe(false);
    expect(() => sheetLayoutText(input({ shrinkToFit: true, fontSize: 0.5 }, 'AB'))).toThrow(
      '字号'
    );
  });
  it('shrinks upright vertical glyph width without rewriting their nominal font', () => {
    const format: SheetTextFormat = { textRotation: 'vertical', shrinkToFit: true, fontSize: 10 };
    const result = sheetLayoutText(input(format, 'AB', { width: 6, height: 100 }));
    expect(result.effectiveFont.sizePt).toBe(6);
    expect(result.nominalFont.sizePt).toBe(10);
    expect(result.naturalTextBox.width).toBe(6);
    expect(result.transform.b).toBe(0);
    expect(format.fontSize).toBe(10);
    expect(result.notes).toContain('vertical-shrink-native-parity-not-proven');
  });
  it('distributes real character gaps to both edges, including injected shaped advances', () => {
    const result = sheetLayoutText(input({ align: 'distributed' }));
    expect(result.lines[0].gap).toBe(20);
    expect(result.lines[0].runs.map((run) => run.x)).toEqual([0, 30, 60, 90]);
    const ligature = sheetLayoutText(input({ align: 'distributed' }, 'fi'));
    expect(ligature.lines[0].runs.map((run) => run.width)).toEqual([10, 8]);
    expect(ligature.lines[0].runs[1].x).toBe(92);
    expect(sheetLayoutText(input({ align: 'distributed' }, 'A')).lines[0].runs[0].x).toBe(45);
  });
  it('justifies interior word gaps while preserving paragraph-final lines', () => {
    const wrapped = sheetLayoutText(
      input({ align: 'justify' }, 'A B C D E F', { width: 55, height: 100 })
    );
    expect(wrapped.lines[0].gapKind).toBe('words');
    expect(wrapped.lines[0].gap).toBeGreaterThan(0);
    expect(wrapped.lines[0].width).toBeCloseTo(55);
    expect(wrapped.lines.at(-1)!.gap).toBe(0);
    const explicit = sheetLayoutText({
      ...input({ align: 'justify' }, 'A B C'),
      justifyLastLine: true,
    });
    expect(explicit.lines[0].gap).toBe(31);
    expect(explicit.lines[0].width).toBeCloseTo(100);
  });
  it('allocates vertical line gaps without feeding alignment whitespace into natural height', () => {
    for (const verticalAlign of ['distributed', 'justify'] as const) {
      const result = sheetLayoutText(input({ verticalAlign }, 'A\nB\nC', { height: 100 }));
      expect(result.lines.map((line) => line.runs[0].quad[0].y)).toEqual([0, 40, 80]);
      expect(result.lines[1].verticalGap).toBe(20);
      expect(result.naturalTextBox.height).toBe(60);
      expect(
        sheetAutoRowHeights([
          {
            row: 1,
            mode: 'auto',
            heightPt: 100,
            cells: [{ address: 'A1', input: input({ verticalAlign }, 'A\nB\nC', { height: 100 }) }],
          },
        ])[0].heightPt
      ).toBe(45);
    }
  });
  it('segments centerContinuous visually and lets logical occupants block empty-looking cells', () => {
    const slots = Array.from({ length: 5 }, (_, index) => ({
      col: index + 1,
      x: index * 80,
      width: 80,
      align: 'centerContinuous' as const,
      occupied: index === 0 || index === 3,
    }));
    const snapshot = JSON.stringify(slots);
    const result = sheetCenterContinuousSegments(slots);
    expect(
      result.segments.map((segment) => [segment.ownerCol, segment.lastCol, segment.width])
    ).toEqual([
      [1, 3, 240],
      [4, 5, 160],
    ]);
    expect(JSON.stringify(slots)).toBe(snapshot);
    expect(
      sheetCenterContinuousSegments([slots[0], { ...slots[1], occupied: true }, ...slots.slice(2)])
        .segments[0].width
    ).toBe(80);
  });
  it('reports frozen/hidden/merge crossing restrictions explicitly', () => {
    const first = { col: 1, x: 0, width: 80, align: 'centerContinuous' as const, occupied: true };
    const second = {
      col: 2,
      x: 80,
      width: 80,
      align: 'centerContinuous' as const,
      occupied: false,
    };
    expect(sheetCenterContinuousSegments([first, { ...second, hidden: true }]).notes).toContain(
      'hidden-column-crossing-not-bridged'
    );
    expect(
      sheetCenterContinuousSegments([
        { ...first, frozenLane: 'frozen' },
        { ...second, frozenLane: 'body' },
      ]).notes
    ).toContain('frozen-lane-crossing-not-bridged');
    expect(sheetCenterContinuousSegments([{ ...first, merged: true }, second]).segments).toEqual(
      []
    );
  });
  it('grows/shrinks from default baseline while excluding fixed, hidden and multirow content', () => {
    const row = (text: string) => ({
      row: 1,
      mode: 'auto' as const,
      heightPt: 100,
      cells: [{ address: 'A1', input: input({ wrap: true }, text, { width: 40 }) }],
    });
    expect(sheetAutoRowHeights([row('ABCDEFGHIJKL')])[0].heightPt).toBe(45);
    expect(sheetAutoRowHeights([row('A')])[0].heightPt).toBe(18);
    const noMeasure: SheetTextMeasure = () => {
      throw new Error('excluded row was measured');
    };
    const guarded = sheetAutoRowHeights([
      {
        row: 2,
        mode: 'fixed',
        heightPt: 30.1,
        cells: [{ address: 'A2', input: { ...input({}, 'long'), measure: noMeasure } }],
      },
      {
        row: 3,
        mode: 'auto',
        hidden: true,
        heightPt: 27.1,
        cells: [{ address: 'A3', input: { ...input({}, 'long'), measure: noMeasure } }],
      },
      {
        row: 4,
        mode: 'auto',
        cells: [
          { address: 'A4', mergedRows: 2, input: { ...input({}, 'long'), measure: noMeasure } },
          {
            address: 'B4',
            hiddenColumn: true,
            input: { ...input({}, 'long'), measure: noMeasure },
          },
        ],
      },
    ]);
    expect(guarded.map((result) => result.heightPt)).toEqual([30.1, 27.1, 18]);
    expect(guarded[2].excluded).toEqual(['A4', 'B4']);
  });
  it('rejects invalid dimensions or shaped metrics without changing the format', () => {
    const format = { wrap: true };
    expect(() => sheetLayoutText(input(format, 'A', { width: NaN }))).toThrow('Invalid');
    expect(() =>
      sheetLayoutText({ ...input(format, 'A'), measure: () => ({ width: NaN, height: 20 }) })
    ).toThrow('Invalid');
    expect(() =>
      sheetLayoutText({
        ...input(format, 'A'),
        measure: () => ({ width: 20, height: 20, advances: [10] }),
      })
    ).toThrow('advances');
    expect(format).toEqual({ wrap: true });
  });
});
