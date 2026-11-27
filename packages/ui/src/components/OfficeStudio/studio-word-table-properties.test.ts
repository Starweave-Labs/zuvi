import { describe, expect, it } from 'vitest';
import {
  WORD_TABLE_MARGIN_SIDES,
  WORD_TABLE_GEOMETRY_CSS,
  wordEffectiveCellMargins,
  wordEffectiveRowSpacing,
  wordMergeTableProperties,
  wordTableAdjustGridSpacing,
  wordTableColumnsToGrid,
  wordTableCss,
  wordTableCellGapCss,
  wordTableFixedRowBudget,
  wordTableFixedRowHeight,
  wordTableGridSpanWidth,
  wordTableGridToColumns,
  wordTableProperties,
  wordTableMergedFixedRowBudget,
  wordTableRowMarginMaximum,
  wordTableRenderedColumnWidths,
  wordTableSpacingLayout,
} from './studio-word-table-properties';

describe('Word table defaults and direct overrides', () => {
  it('keeps explicit zero, native point precision and absent defaults distinct', () => {
    expect(wordTableProperties({})).toEqual({ defaultCellMargins: null, cellSpacing: null });
    expect(wordTableProperties({ defaultCellMargins: { top: 0, left: 5.25 }, cellSpacing: 0 }))
      .toEqual({ defaultCellMargins: { top: 0, left: 5.25 }, cellSpacing: 0 });
    expect(wordTableProperties({ defaultCellMargins: { bottom: 2000 }, cellSpacing: 2000 }))
      .toEqual({ defaultCellMargins: { bottom: 2000 }, cellSpacing: 2000 });
    expect(wordTableProperties({ defaultCellMargins: { left: 0.05 }, cellSpacing: 0.1 }))
      .toEqual({ defaultCellMargins: { left: 0.05 }, cellSpacing: 0.1 });
  });

  it('merges touched defaults and clears a side or the whole object without mutating input', () => {
    const current = { defaultCellMargins: { top: 5, left: 6 }, cellSpacing: 4.5 };
    const before = JSON.stringify(current);
    expect(wordMergeTableProperties(current, { defaultCellMargins: { top: 0 } }))
      .toEqual({ defaultCellMargins: { top: 0, left: 6 }, cellSpacing: 4.5 });
    expect(wordMergeTableProperties(current, { defaultCellMargins: { top: null } }))
      .toEqual({ defaultCellMargins: { left: 6 }, cellSpacing: 4.5 });
    expect(wordMergeTableProperties(current, { defaultCellMargins: null, cellSpacing: null }))
      .toEqual({ defaultCellMargins: null, cellSpacing: null });
    expect(wordMergeTableProperties(current, { defaultCellMargins: {}, cellSpacing: undefined }))
      .toEqual(current);
    expect(JSON.stringify(current)).toBe(before);
  });

  it('inherits each untouched side and responds to default changes or restoring defaults', () => {
    const direct = { cellMargins: { top: 0, right: 3 } };
    const initial = { defaultCellMargins: { top: 6, left: 7.5 }, cellSpacing: null };
    const changed = wordMergeTableProperties(initial, {
      defaultCellMargins: { top: 9, left: 10 },
    });
    const fallback = { bottom: 5.25, left: 6.25 };
    expect(wordEffectiveCellMargins(initial, direct, fallback))
      .toEqual({ top: 0, right: 3, bottom: 5.25, left: 7.5 });
    expect(wordEffectiveCellMargins(changed, direct, fallback))
      .toEqual({ top: 0, right: 3, bottom: 5.25, left: 10 });
    expect(wordEffectiveCellMargins(changed, { cellMargins: null }, fallback))
      .toEqual({ top: 9, right: 0, bottom: 5.25, left: 10 });
    expect(direct).toEqual({ cellMargins: { top: 0, right: 3 } });
  });

  it.each([
    [],
    { defaultCellMargins: [] },
    { defaultCellMargins: { unknown: 1 } },
    { defaultCellMargins: { left: -1 } },
    { defaultCellMargins: { right: 2000.05 } },
    { defaultCellMargins: { top: 1.01 } },
    { defaultCellMargins: { bottom: Infinity } },
    { cellSpacing: '5' },
    { cellSpacing: -1 },
    { cellSpacing: 0.01 },
    { cellSpacing: 0.05 },
    { cellSpacing: NaN },
    { cellSpacing: 2000.05 },
  ])('rejects unrepresentable table properties %j', (value) => {
    expect(() => wordTableProperties(value)).toThrow();
  });
});

describe('Word row spacing and CSS scope', () => {
  it('retains row zero overrides and reports differing row gaps without flattening them', () => {
    const table = { cellSpacing: 5 };
    expect(wordEffectiveRowSpacing(table, {})).toBe(5);
    expect(wordEffectiveRowSpacing(table, { cellSpacing: 0 })).toBe(0);
    expect(wordEffectiveRowSpacing(table, { cellSpacing: null })).toBe(5);
    expect(wordTableSpacingLayout(table, [{}, { cellSpacing: 0 }]))
      .toEqual({ kind: 'mixed', spacing: null, values: [5, 0] });
    expect(wordTableSpacingLayout(table, [{ cellSpacing: 0 }, { cellSpacing: 0 }]))
      .toEqual({ kind: 'uniform', spacing: 0, values: [0, 0] });
    expect(table).toEqual({ cellSpacing: 5 });
  });

  it('isolates nested table defaults and accounts for the two separate cell borders', () => {
    const outer = wordTableCss({ defaultCellMargins: { top: 0, left: 7 }, cellSpacing: 5 });
    expect(outer['--zuvi-word-table-margin-top']).toBe('0pt');
    expect(outer['--zuvi-word-table-margin-left']).toBe('7pt');
    expect(outer['border-collapse']).toBe('separate');
    expect(outer['border-spacing']).toBe('5pt');
    expect(outer['--zuvi-word-cell-border-y']).toBe('2px');
    const nested = wordTableCss({});
    for (const side of WORD_TABLE_MARGIN_SIDES) {
      expect(nested[`--zuvi-word-table-margin-${side}`]).toBe('initial');
      expect(nested[`--zuvi-word-cell-margin-${side}`]).toBe('initial');
    }
    expect(nested['--zuvi-word-cell-justify']).toBe('initial');
    expect(nested['--zuvi-word-cell-border-y']).toBe('1px');
    expect(nested['border-collapse']).toBe('collapse');
  });

  it('uses half exterior table gaps and actual per-cell row gaps for mixed rows', () => {
    const css = wordTableCss({ cellSpacing: 6 }, [{ cellSpacing: 0 }, { cellSpacing: 12 }]);
    expect(css['border-spacing']).toBe('0pt');
    expect(css[WORD_TABLE_GEOMETRY_CSS.tableGapTop]).toBe('0pt');
    expect(css[WORD_TABLE_GEOMETRY_CSS.tableGapBottom]).toBe('6pt');
    expect(css['padding-top']).toBe('0pt');
    expect(css['padding-bottom']).toBe('6pt');
    const first = wordTableCellGapCss(12, true, false);
    expect(first[WORD_TABLE_GEOMETRY_CSS.cellGapLeft]).toBe('12pt');
    expect(first[WORD_TABLE_GEOMETRY_CSS.cellGapRight]).toBe('6pt');
    const spanning = wordTableCellGapCss(0, true, true, 12);
    expect(spanning[WORD_TABLE_GEOMETRY_CSS.cellGapTop]).toBe('0pt');
    expect(spanning[WORD_TABLE_GEOMETRY_CSS.cellGapBottom]).toBe('6pt');
  });
});

describe('native table grid and CSS column geometry', () => {
  it.each([[120], [120, 160], [120, 160, 180]])(
    'adds horizontal spacing once for %j columns and reverses repeated conversions',
    (...widths: number[]) => {
      const spacing = 6;
      const gapPixels = 8;
      const grid = wordTableColumnsToGrid(widths, spacing);
      expect(grid.reduce((sum, width) => sum + width, 0))
        .toBeCloseTo(widths.reduce((sum, width) => sum + width, 0) + (widths.length + 1) * gapPixels);
      for (let round = 0; round < 3; round++) {
        const columns = wordTableGridToColumns(grid, spacing);
        columns.forEach((width, index) => expect(width).toBeCloseTo(widths[index]));
        wordTableColumnsToGrid(columns, spacing)
          .forEach((width, index) => expect(width).toBeCloseTo(grid[index]));
      }
      wordTableAdjustGridSpacing(grid, spacing, 0)
        .forEach((width, index) => expect(width).toBeCloseTo(widths[index]));
    }
  );

  it('keeps the former internal gap inside a merged cell and the exterior gaps outside', () => {
    const grid = wordTableColumnsToGrid([120, 160, 180], 6);
    expect(wordTableGridSpanWidth(grid, 0, 2, 6)).toBeCloseTo(120 + 160 + 8);
    expect(wordTableGridSpanWidth(grid, 0, 3, 6)).toBeCloseTo(120 + 160 + 180 + 16);
    expect(wordTableGridSpanWidth(grid, 1, 1, 6)).toBeCloseTo(160);
  });

  it('rejects an impossible gap or invalid grid before changing any widths', () => {
    const grid = [4, 4];
    expect(() => wordTableGridToColumns(grid, 6)).toThrow(/间距/);
    expect(grid).toEqual([4, 4]);
    expect(() => wordTableColumnsToGrid([], 0)).toThrow(/列宽/);
    expect(() => wordTableColumnsToGrid([NaN], 0)).toThrow(/列宽/);
    expect(() => wordTableGridSpanWidth([120, 160], 1, 2, 0)).toThrow(/范围/);
  });

  it('preserves a shared native grid for mixed rows and consistent uniform overrides', () => {
    const base = [200, 160];
    const table = { cellSpacing: 6 };
    expect(wordTableRenderedColumnWidths(base, table, [{}, {}])).toEqual(base);
    expect(wordTableRenderedColumnWidths(base, table, [{ cellSpacing: 0 }, { cellSpacing: 12 }]))
      .toEqual([212, 172]);
    expect(wordTableRenderedColumnWidths(base, table, [{ cellSpacing: 0 }, { cellSpacing: 0 }]))
      .toEqual([212, 172]);
    expect(wordTableRenderedColumnWidths(base, table, [{ cellSpacing: 3 }, { cellSpacing: 3 }]))
      .toEqual([206, 166]);
    expect(base).toEqual([200, 160]);
  });
});

describe('raw native exact-row height budgets', () => {
  it('distinguishes the inner clip, border centers and outer box for the native fixture', () => {
    // Independent LibreOffice output establishes the 77pt border-center distance
    // for H=72pt, top=0/bottom=5pt and 1pt borders at zero physical spacing.
    // Nonzero gaps below follow the pinned reference calculation, not LO, whose
    // rendering ignored the fixture's tblCellSpacing value.
    const zero = wordTableFixedRowBudget(72, { top: 0, bottom: 5 }, 0, 1);
    expect(zero.innerHeight).toBe(76);
    expect(zero.borderCenterHeight).toBe(77);
    expect(zero.outerHeight).toBe(78);
    const physicalTwelve = wordTableFixedRowBudget(72, { top: 0, bottom: 5 }, 12, 1);
    expect(physicalTwelve.innerHeight).toBe(64);
    expect(physicalTwelve.borderCenterHeight).toBe(65);
    expect(physicalTwelve.outerHeight).toBe(66);
    expect(physicalTwelve.contentHeight).toBe(59);
    const physicalSix = wordTableFixedRowBudget(72, { top: 0, bottom: 5 }, 6, 1);
    expect(physicalSix.borderCenterHeight).toBe(71);
    expect(physicalSix.outerHeight).toBe(72);
  });

  it('retains raw height while margin changes alter the cell box rather than the text budget', () => {
    const base = wordTableFixedRowBudget(24, {}, 0);
    const padded = wordTableFixedRowBudget(24, { top: 0, bottom: 5 }, 0);
    expect(base.rawHeight).toBe(24);
    expect(padded.rawHeight).toBe(24);
    expect(padded.outerHeight).toBe(29.75);
    expect(padded.borderCenterHeight).toBe(29);
    expect(padded.innerHeight).toBe(28.25);
    expect(padded.contentHeight).toBe(base.contentHeight);
    expect(wordTableFixedRowHeight(24, { top: 0, bottom: 5 }, 0)).toBe(29.75);
  });

  it('uses caller-resolved row maxima and supports native eighth-point borders', () => {
    const margins = [{ top: 2.5, bottom: 0 }, { top: 0, bottom: 5 }];
    const maxima = wordTableRowMarginMaximum(margins);
    expect(maxima).toEqual({ top: 2.5, bottom: 5 });
    const budget = wordTableFixedRowBudget(24, maxima, 6, { top: 0.125, bottom: 0.25 });
    expect(budget.innerHeight).toBe(25.375);
    expect(budget.outerHeight).toBe(25.75);
    expect(budget.contentHeight).toBe(17.875);
    expect(margins).toEqual([{ top: 2.5, bottom: 0 }, { top: 0, bottom: 5 }]);
  });

  it('sums separated spanning row boxes with their actual inter-row gap', () => {
    const rows = [
      wordTableFixedRowBudget(24, { top: 0, bottom: 0 }, 6),
      wordTableFixedRowBudget(24, { top: 0, bottom: 5 }, 6),
    ];
    const merged = wordTableMergedFixedRowBudget(rows)!;
    expect(merged.interRowGaps).toEqual([6]);
    expect(merged.sharedBorders).toEqual([0]);
    expect(merged.outerHeight).toBe(48.5);
    expect(merged.innerHeight).toBe(47);
    expect(merged.contentHeight).toBe(42);
  });

  it('counts a collapsed shared border once when spanning zero-gap rows', () => {
    const rows = [
      wordTableFixedRowBudget(24, {}, 0),
      wordTableFixedRowBudget(24, { bottom: 5 }, 0),
    ];
    const merged = wordTableMergedFixedRowBudget(rows)!;
    expect(merged.sharedBorders).toEqual([0.75]);
    expect(merged.outerHeight).toBe(53.75);
    expect(merged.borderCenterHeight).toBe(53);
    expect(wordTableMergedFixedRowBudget([])).toBeNull();
  });

  it('keeps mixed spacing in the spanning height and allows resolved shared borders', () => {
    const mixed = wordTableMergedFixedRowBudget([
      wordTableFixedRowBudget(24, {}, 2),
      wordTableFixedRowBudget(24, { bottom: 5 }, 8),
    ])!;
    expect(mixed.interRowGaps).toEqual([5]);
    expect(mixed.outerHeight).toBe(49.5);
    const collapsed = [wordTableFixedRowBudget(24, {}, 0), wordTableFixedRowBudget(24, {}, 0)];
    expect(wordTableMergedFixedRowBudget(collapsed, undefined, [0.5])!.sharedBorders)
      .toEqual([0.5]);
    expect(() => wordTableMergedFixedRowBudget(collapsed, undefined, []))
      .toThrow(/数量/);
  });

  it('flags an impossible native aperture and rejects invalid dimensions', () => {
    const budget = wordTableFixedRowBudget(0, {}, 6, 1);
    expect(budget.rawInnerHeight).toBe(-7);
    expect(budget.overconstrained).toBe(true);
    expect(budget.innerHeight).toBe(0);
    expect(budget.outerHeight).toBe(2);
    expect(() => wordTableFixedRowBudget(-1, {}, 0)).toThrow(/行高/);
    expect(() => wordTableFixedRowBudget(24, {}, 0, NaN)).toThrow(/边框/);
  });
});
