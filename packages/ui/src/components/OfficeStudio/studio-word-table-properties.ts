export const WORD_TABLE_MARGIN_SIDES = ['top', 'right', 'bottom', 'left'] as const;
export type WordTableMarginSide = (typeof WORD_TABLE_MARGIN_SIDES)[number];
export type WordTableMargins = Partial<Record<WordTableMarginSide, number>>;
export type WordTableMarginPatch = Partial<Record<WordTableMarginSide, number | null>>;
export const WORD_TABLE_GEOMETRY_CSS = {
  tableGapTop: '--zuvi-word-table-gap-top',
  tableGapBottom: '--zuvi-word-table-gap-bottom',
  rowSpacing: '--zuvi-word-row-spacing',
  cellGapTop: '--zuvi-word-cell-gap-top',
  cellGapRight: '--zuvi-word-cell-gap-right',
  cellGapBottom: '--zuvi-word-cell-gap-bottom',
  cellGapLeft: '--zuvi-word-cell-gap-left',
  cellBorderY: '--zuvi-word-cell-border-y',
} as const;

export interface WordTableProperties {
  defaultCellMargins: WordTableMargins | null;
  /** Actual visible gap in points; DOCX tblCellSpacing stores half this value. */
  cellSpacing: number | null;
}
export interface WordTablePropertiesPatch {
  defaultCellMargins?: WordTableMarginPatch | null;
  cellSpacing?: number | null;
}

function attributes(input: unknown): Record<string, unknown> {
  if (input == null) return {};
  if (typeof input !== 'object' || Array.isArray(input)) throw new Error('表格属性无效。');
  return input as Record<string, unknown>;
}

function points(input: unknown, label: string, unitsPerPoint = 20): number {
  if (
    typeof input !== 'number' ||
    !Number.isFinite(input) ||
    input < 0 ||
    input > 2000 ||
    Math.abs(input * unitsPerPoint - Math.round(input * unitsPerPoint)) > 1e-6
  )
    throw new Error(`${label}须在0到2000磅之间，精度为${1 / unitsPerPoint}磅。`);
  return Math.round(input * unitsPerPoint) / unitsPerPoint;
}

export function wordTableMargins(input: unknown): WordTableMargins | null {
  if (input == null) return null;
  const source = attributes(input);
  const result: WordTableMargins = {};
  for (const [side, value] of Object.entries(source)) {
    if (!WORD_TABLE_MARGIN_SIDES.includes(side as WordTableMarginSide))
      throw new Error('表格内边距方向无效。');
    result[side as WordTableMarginSide] = points(value, '表格内边距');
  }
  return Object.keys(result).length ? result : null;
}

export function wordTableSpacing(input: unknown): number | null {
  // The native half-gap must be an integer number of twips. A physical gap
  // therefore advances in 0.1pt steps, while an ordinary margin uses 0.05pt.
  return input == null ? null : points(input, '单元格间距', 10);
}

export function wordTableProperties(input: unknown): WordTableProperties {
  const value = attributes(input);
  return {
    defaultCellMargins: wordTableMargins(value.defaultCellMargins),
    cellSpacing: wordTableSpacing(value.cellSpacing),
  };
}

/** Undefined leaves a side unchanged; null removes its direct value. */
export function wordMergeTableMargins(
  current: unknown,
  patch: WordTableMarginPatch | null | undefined
): WordTableMargins | null {
  const previous = wordTableMargins(current);
  if (patch === undefined) return previous;
  if (patch === null) return null;
  const result: WordTableMargins = { ...previous };
  for (const [side, value] of Object.entries(attributes(patch))) {
    if (!WORD_TABLE_MARGIN_SIDES.includes(side as WordTableMarginSide))
      throw new Error('表格内边距方向无效。');
    if (value === undefined) continue;
    if (value === null) delete result[side as WordTableMarginSide];
    else result[side as WordTableMarginSide] = points(value, '表格内边距');
  }
  return Object.keys(result).length ? result : null;
}

export function wordMergeTableProperties(
  current: unknown,
  patch: WordTablePropertiesPatch
): WordTableProperties {
  const previous = wordTableProperties(current);
  const changes = attributes(patch);
  return {
    defaultCellMargins: wordMergeTableMargins(
      previous.defaultCellMargins,
      changes.defaultCellMargins as WordTableMarginPatch | null | undefined
    ),
    cellSpacing:
      changes.cellSpacing === undefined
        ? previous.cellSpacing
        : wordTableSpacing(changes.cellSpacing),
  };
}

/** Only the nearest table participates; callers supply their display fallback. */
export function wordEffectiveCellMargins(
  tableAttrs: unknown,
  cellAttrs: unknown,
  fallback: WordTableMargins = {}
): Record<WordTableMarginSide, number> {
  const defaults = wordTableProperties(tableAttrs).defaultCellMargins;
  const direct = wordTableMargins(attributes(cellAttrs).cellMargins);
  const baseline = wordTableMargins(fallback);
  return Object.fromEntries(
    WORD_TABLE_MARGIN_SIDES.map((side) => [
      side,
      direct?.[side] ?? defaults?.[side] ?? baseline?.[side] ?? 0,
    ])
  ) as Record<WordTableMarginSide, number>;
}

export function wordEffectiveRowSpacing(tableAttrs: unknown, rowAttrs: unknown): number {
  return (
    wordTableSpacing(attributes(rowAttrs).cellSpacing) ??
    wordTableProperties(tableAttrs).cellSpacing ??
    0
  );
}

export type WordTableSpacingLayout =
  | { kind: 'uniform'; spacing: number; values: number[] }
  | { kind: 'mixed'; spacing: null; values: number[] };

/** Mixed row overrides remain distinct, rather than being normalized into a table value. */
export function wordTableSpacingLayout(
  tableAttrs: unknown,
  rows: readonly unknown[] = []
): WordTableSpacingLayout {
  const table = wordTableProperties(tableAttrs);
  const values = rows.length
    ? rows.map((row) => wordEffectiveRowSpacing(table, row))
    : [table.cellSpacing ?? 0];
  return values.every((value) => value === values[0])
    ? { kind: 'uniform', spacing: values[0], values }
    : { kind: 'mixed', spacing: null, values };
}

export function wordTableCss(
  tableAttrs: unknown,
  rows: readonly unknown[] = []
): Record<string, string> {
  const properties = wordTableProperties(tableAttrs);
  const layout = wordTableSpacingLayout(properties, rows);
  // Mixed rows use their native grid and per-row cell boxes. Their actual gaps
  // are supplied by row padding, not by one global border-spacing value.
  const spacing = layout.kind === 'uniform' ? layout.spacing : 0;
  const topGap = layout.kind === 'mixed' ? layout.values[0] / 2 : 0;
  const bottomGap = layout.kind === 'mixed' ? layout.values[layout.values.length - 1] / 2 : 0;
  const separate = layout.values.some((value) => value > 0);
  return {
    ...Object.fromEntries(
      WORD_TABLE_MARGIN_SIDES.flatMap((side) => [
        [
          `--zuvi-word-table-margin-${side}`,
          properties.defaultCellMargins?.[side] === undefined
            ? 'initial'
            : `${properties.defaultCellMargins[side]}pt`,
        ],
        [`--zuvi-word-cell-margin-${side}`, 'initial'],
      ])
    ),
    '--zuvi-word-cell-justify': 'initial',
    '--zuvi-word-table-spacing': `${properties.cellSpacing ?? 0}pt`,
    '--zuvi-word-row-spacing': 'initial',
    '--zuvi-word-cell-border-y': separate ? '2px' : '1px',
    [WORD_TABLE_GEOMETRY_CSS.tableGapTop]: `${topGap}pt`,
    [WORD_TABLE_GEOMETRY_CSS.tableGapBottom]: `${bottomGap}pt`,
    [WORD_TABLE_GEOMETRY_CSS.cellGapTop]: 'initial',
    [WORD_TABLE_GEOMETRY_CSS.cellGapRight]: 'initial',
    [WORD_TABLE_GEOMETRY_CSS.cellGapBottom]: 'initial',
    [WORD_TABLE_GEOMETRY_CSS.cellGapLeft]: 'initial',
    'border-collapse': separate ? 'separate' : 'collapse',
    'border-spacing': `${spacing}pt`,
    'padding-top': `${topGap}pt`,
    'padding-bottom': `${bottomGap}pt`,
  };
}

export function wordTableRowSpacingCss(rowAttrs: unknown): Record<string, string> {
  const spacing = wordTableSpacing(attributes(rowAttrs).cellSpacing);
  return {
    '--zuvi-word-row-spacing':
      spacing === null ? 'var(--zuvi-word-table-spacing,0pt)' : `${spacing}pt`,
    [WORD_TABLE_GEOMETRY_CSS.cellGapTop]: 'calc(var(--zuvi-word-row-spacing,0pt)/2)',
    [WORD_TABLE_GEOMETRY_CSS.cellGapRight]: 'calc(var(--zuvi-word-row-spacing,0pt)/2)',
    [WORD_TABLE_GEOMETRY_CSS.cellGapBottom]: 'calc(var(--zuvi-word-row-spacing,0pt)/2)',
    [WORD_TABLE_GEOMETRY_CSS.cellGapLeft]: 'calc(var(--zuvi-word-row-spacing,0pt)/2)',
  };
}

/** First/last cells own a full exterior gap; a spanning cell ends in its last row. */
export function wordTableCellGapCss(
  physicalGap: number | null,
  first: boolean,
  last: boolean,
  endRowPhysicalGap: number | null = physicalGap
): Record<string, string> {
  const spacing = wordTableSpacing(physicalGap) ?? 0;
  const ending = wordTableSpacing(endRowPhysicalGap) ?? 0;
  return {
    [WORD_TABLE_GEOMETRY_CSS.cellGapTop]: `${spacing / 2}pt`,
    [WORD_TABLE_GEOMETRY_CSS.cellGapRight]: `${last ? spacing : spacing / 2}pt`,
    [WORD_TABLE_GEOMETRY_CSS.cellGapBottom]: `${ending / 2}pt`,
    [WORD_TABLE_GEOMETRY_CSS.cellGapLeft]: `${first ? spacing : spacing / 2}pt`,
  };
}

export interface WordTableVerticalBorders {
  top: number;
  bottom: number;
}
export interface WordTableFixedRowBudget {
  rawHeight: number;
  rawInnerHeight: number;
  topMargin: number;
  bottomMargin: number;
  spacing: number;
  borders: WordTableVerticalBorders;
  innerHeight: number;
  outerHeight: number;
  borderCenterHeight: number;
  contentHeight: number;
  overconstrained: boolean;
}
export interface WordTableMergedRowBudget {
  topMargin: number;
  bottomMargin: number;
  borders: WordTableVerticalBorders;
  innerHeight: number;
  outerHeight: number;
  borderCenterHeight: number;
  contentHeight: number;
  interRowGaps: number[];
  sharedBorders: number[];
  overconstrained: boolean;
}

function finiteHeight(input: unknown, label: string): number {
  if (typeof input !== 'number' || !Number.isFinite(input) || input < 0 || input > 2000)
    throw new Error(`${label}须在0到2000磅之间。`);
  return input;
}

function verticalBorders(
  input: number | Partial<WordTableVerticalBorders>
): WordTableVerticalBorders {
  if (typeof input === 'number') {
    const border = finiteHeight(input, '单元格边框宽度');
    return { top: border, bottom: border };
  }
  const value = attributes(input);
  return {
    top: finiteHeight(value.top ?? 0, '单元格上边框宽度'),
    bottom: finiteHeight(value.bottom ?? 0, '单元格下边框宽度'),
  };
}

/** Caller resolves inherited margins and assigns a merged cell's bottom to its ending row. */
export function wordTableRowMarginMaximum(
  values: readonly WordTableMargins[]
): Pick<Record<WordTableMarginSide, number>, 'top' | 'bottom'> {
  const margins = values.map(wordTableMargins);
  return {
    top: margins.reduce((maximum, value) => Math.max(maximum, value?.top ?? 0), 0),
    bottom: margins.reduce((maximum, value) => Math.max(maximum, value?.bottom ?? 0), 0),
  };
}

/**
 * Raw DOCX exact height is unchanged by the native reader. The reference engine
 * adds the effective row margins, subtracts the physical gap and maximum top
 * border, and then clips the inner aperture at that height. The border box also
 * includes both cell borders; it is not the raw H minus the gap.
 *
 * Border widths use points without the margin's twip rounding: native borders
 * may use eighths of a point. The default 0.75pt represents the current 1px UI.
 */
export function wordTableFixedRowBudget(
  rawHeight: number,
  effectiveMaxMargins: WordTableMargins,
  physicalGap: number | null,
  border: number | Partial<WordTableVerticalBorders> = 0.75
): WordTableFixedRowBudget {
  const height = finiteHeight(rawHeight, '固定行高');
  const margins = wordTableMargins(effectiveMaxMargins);
  const spacing = wordTableSpacing(physicalGap) ?? 0;
  const borders = verticalBorders(border);
  const topMargin = margins?.top ?? 0;
  const bottomMargin = margins?.bottom ?? 0;
  const rawInnerHeight = height + topMargin + bottomMargin - spacing - borders.top;
  // Negative native apertures have no valid CSS height. Flag this domain so a
  // caller can reject or explicitly handle it, instead of claiming native parity.
  const innerHeight = Math.max(0, rawInnerHeight);
  return {
    rawHeight: height,
    rawInnerHeight,
    topMargin,
    bottomMargin,
    spacing,
    borders,
    innerHeight,
    outerHeight: innerHeight + borders.top + borders.bottom,
    borderCenterHeight: innerHeight + (borders.top + borders.bottom) / 2,
    contentHeight: Math.max(0, innerHeight - topMargin - bottomMargin),
    overconstrained: rawInnerHeight < 0,
  };
}

export function wordTableFixedRowHeight(
  rawHeight: number,
  effectiveMaxMargins: WordTableMargins,
  physicalGap: number | null,
  border: number | Partial<WordTableVerticalBorders> = 0.75
): number {
  return wordTableFixedRowBudget(rawHeight, effectiveMaxMargins, physicalGap, border).outerHeight;
}

/**
 * A spanning box consumes all row boxes and positive inter-row gaps. Two zero
 * gaps share their collapsed border instead of counting it twice. Callers with
 * differing border styles may supply the resolved shared-border widths.
 */
export function wordTableMergedFixedRowBudget(
  rows: readonly WordTableFixedRowBudget[],
  border?: number | Partial<WordTableVerticalBorders>,
  sharedBorderWidths?: readonly number[]
): WordTableMergedRowBudget | null {
  if (!rows.length) return null;
  if (sharedBorderWidths && sharedBorderWidths.length !== rows.length - 1)
    throw new Error('合并行的共享边框数量无效。');
  const borders = verticalBorders(border ?? {
    top: rows[0].borders.top,
    bottom: rows[rows.length - 1].borders.bottom,
  });
  const interRowGaps = rows.slice(1).map((row, index) =>
    (rows[index].spacing + row.spacing) / 2
  );
  const sharedBorders = interRowGaps.map((gap, index) =>
    gap > 0 ? 0 : finiteHeight(
      sharedBorderWidths?.[index] ??
        Math.max(rows[index].borders.bottom, rows[index + 1].borders.top),
      '共享边框宽度'
    )
  );
  const outerHeight = rows.reduce((sum, row) => sum + row.outerHeight, 0) +
    interRowGaps.reduce((sum, gap) => sum + gap, 0) -
    sharedBorders.reduce((sum, width) => sum + width, 0);
  const innerHeight = Math.max(0, outerHeight - borders.top - borders.bottom);
  const topMargin = rows[0].topMargin;
  const bottomMargin = rows[rows.length - 1].bottomMargin;
  return {
    topMargin,
    bottomMargin,
    borders,
    innerHeight,
    outerHeight,
    borderCenterHeight: outerHeight - (borders.top + borders.bottom) / 2,
    contentHeight: Math.max(0, innerHeight - topMargin - bottomMargin),
    interRowGaps,
    sharedBorders,
    overconstrained: rows.some((row) => row.overconstrained) ||
      outerHeight < borders.top + borders.bottom,
  };
}

export function wordTableMergedFixedRowHeight(
  rows: readonly WordTableFixedRowBudget[],
  border?: number | Partial<WordTableVerticalBorders>
): number | null {
  return wordTableMergedFixedRowBudget(rows, border)?.outerHeight ?? null;
}

function columns(input: readonly number[]): number[] {
  if (
    !Array.isArray(input) ||
    !input.length ||
    input.some((value) => typeof value !== 'number' || !Number.isFinite(value) || value <= 0)
  )
    throw new Error('表格列宽无效。');
  return [...input];
}

/** Shares of the native grid occupied by horizontal gaps in an unmerged row. */
export function wordTableGridSpacingShares(count: number): number[] {
  if (!Number.isInteger(count) || count < 1) throw new Error('表格列数无效。');
  // Both exterior gaps belong to a single-column table. In multiple columns,
  // each edge owns an exterior gap and half an interior gap; middle columns
  // own two halves. This agrees with ONLYOFFICE's cell-margin geometry, without
  // copying its spacing-update assignment for coincident first/last columns.
  return Array.from({ length: count }, (_, index) =>
    count === 1 ? 2 : index === 0 || index === count - 1 ? 1.5 : 1
  );
}

/**
 * Native grid widths are CSS pixels (DOCX twips / 15); spacingPoints is the
 * physical visible gap in points, twice the raw DOCX tblCellSpacing value.
 */
export function wordTableGridToColumns(
  gridWidths: readonly number[],
  spacingPoints: number | null
): number[] {
  const grid = columns(gridWidths);
  const spacing = ((wordTableSpacing(spacingPoints) ?? 0) * 4) / 3;
  const shares = wordTableGridSpacingShares(grid.length);
  const result = grid.map((width, index) => width - shares[index] * spacing);
  if (result.some((width) => width <= 0)) throw new Error('单元格间距超过表格列宽。');
  // Returned CSS col widths include the cell box, but exclude spacing. Padding
  // and borders remain inside the cell box and must not be subtracted again.
  return result;
}

/** Reverse the conversion once when serializing native grid widths. */
export function wordTableColumnsToGrid(
  columnWidths: readonly number[],
  spacingPoints: number | null
): number[] {
  const content = columns(columnWidths);
  const spacing = ((wordTableSpacing(spacingPoints) ?? 0) * 4) / 3;
  const shares = wordTableGridSpacingShares(content.length);
  return content.map((width, index) => width + shares[index] * spacing);
}

/**
 * Model colwidths are based on the table's declared physical gap. Mixed rows
 * display the shared native grid; uniform overrides convert that same grid for
 * their effective gap. This preserves native table width when row overrides
 * differ from the table default, without rewriting any model columns.
 */
export function wordTableRenderedColumnWidths(
  baseColumnWidths: readonly number[],
  tableAttrs: unknown,
  rowAttrs: readonly unknown[] = []
): number[] {
  const properties = wordTableProperties(tableAttrs);
  const grid = wordTableColumnsToGrid(baseColumnWidths, properties.cellSpacing);
  const layout = wordTableSpacingLayout(properties, rowAttrs);
  return layout.kind === 'mixed' ? grid : wordTableGridToColumns(grid, layout.spacing);
}

/** Changing spacing preserves the actual cell box widths, including explicit zero. */
export function wordTableAdjustGridSpacing(
  gridWidths: readonly number[],
  previousPoints: number | null,
  nextPoints: number | null
): number[] {
  return wordTableColumnsToGrid(
    wordTableGridToColumns(gridWidths, previousPoints),
    nextPoints
  );
}

/** Visible merged cell box width, excluding row gaps but including padding/borders. */
export function wordTableGridSpanWidth(
  gridWidths: readonly number[],
  start: number,
  span: number,
  spacingPoints: number | null
): number {
  const grid = columns(gridWidths);
  if (
    !Number.isInteger(start) ||
    !Number.isInteger(span) ||
    start < 0 ||
    span < 1 ||
    start + span > grid.length
  )
    throw new Error('表格合并列范围无效。');
  const spacing = ((wordTableSpacing(spacingPoints) ?? 0) * 4) / 3;
  const gapShares = 1 + (start === 0 ? 0.5 : 0) + (start + span === grid.length ? 0.5 : 0);
  const width = grid.slice(start, start + span).reduce((sum, value) => sum + value, 0);
  const result = width - spacing * gapShares;
  if (result <= 0) throw new Error('单元格间距超过表格列宽。');
  return result;
}
