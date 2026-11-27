import { studioBorderCss } from './studio-cell-style';
import {
  sheetAutoRowHeights,
  sheetCenterContinuousSegments,
  sheetTextGraphemes,
  type SheetTextLayoutInput,
  type SheetTextMeasure,
} from './studio-sheet-text-layout';
import {
  sheetCellError,
  sheetDefaultTextFormat,
  sheetRowHeightMode,
} from './studio-sheet-text-properties';
import {
  studioCellAddress,
  studioColumnLabel,
  studioDisplayCell,
  studioHiddenColumns,
  studioHiddenRows,
  studioInputValue,
  studioMergedRange,
  studioParseAddress,
  studioParseRange,
  type SheetCalculation,
} from './studio-sheet-model';
import { studioCellHyperlink } from './studio-sheet-hyperlinks';
import { studioConditionalCellStyle } from './studio-sheet-rules';
import type {
  StudioCell,
  StudioExcelDocument,
  StudioSheet,
  StudioSheetHyperlink,
} from './studio-types';

/** One quoted family, followed by the same fallback fonts used by the editing surface. */
export function studioSheetTextFontFamily(family: string): string {
  return `"${family.replace(/["\\\t\n\r]/g, (character) => `\\${character.charCodeAt(0).toString(16)} `)}", Arial, sans-serif`;
}

/** Browser canvas measurement is shared by the grid and print preparation. */
export function studioSheetTextMeasure(
  owner: Document | undefined = globalThis.document
): SheetTextMeasure {
  let context: CanvasRenderingContext2D | null = null;
  if (owner?.defaultView && 'CanvasRenderingContext2D' in owner.defaultView) {
    try {
      context = owner.createElement('canvas').getContext('2d');
    } catch {
      /* A browser without canvas retains the deterministic display fallback. */
    }
  }
  return (text, font) => {
    const size = (font.sizePt * 4) / 3;
    const units = sheetTextGraphemes(text);
    if (!context) {
      const advances = units.map(
        (unit) =>
          size *
          (/^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Emoji_Presentation}]$/u.test(
            unit
          )
            ? 1
            : unit === ' '
              ? 0.25
              : 0.55)
      );
      return {
        width: advances.reduce((sum, width) => sum + width, 0),
        height: size * 1.15,
        advances,
      };
    }
    context.font = `${font.italic ? 'italic ' : ''}${font.bold ? '700' : '400'} ${size}px ${studioSheetTextFontFamily(font.family)}`;
    const width = context.measureText(text).width;
    if (units.length > 512) return { width, height: size * 1.15 };
    let previous = 0;
    const advances = units.map((_, index) => {
      const next = context!.measureText(units.slice(0, index + 1).join('')).width;
      const advance = next - previous;
      previous = next;
      return advance;
    });
    return {
      width,
      height: size * 1.15,
      ...(advances.every((advance) => advance >= 0) ? { advances } : {}),
    };
  };
}

export function studioSheetTextBorders(sheet: StudioSheet, address: string): StudioCell['borders'] {
  const cell = sheet.cells[address];
  const position = studioParseAddress(address)!;
  const merge = studioMergedRange(sheet, position);
  return merge
    ? {
        ...cell?.borders,
        right:
          sheet.cells[studioCellAddress(merge.firstRow, merge.lastCol)]?.borders?.right ??
          cell?.borders?.right,
        bottom:
          sheet.cells[studioCellAddress(merge.lastRow, merge.firstCol)]?.borders?.bottom ??
          cell?.borders?.bottom,
      }
    : cell?.borders;
}

/** Outer box includes each resolved border once; drawing coordinates use its outer origin. */
export function studioSheetTextPadding(borders: StudioCell['borders']) {
  const width = (side: keyof NonNullable<StudioCell['borders']>, fallback: number) => {
    const css = studioBorderCss(borders?.[side]);
    return css ? parseFloat(css) : fallback;
  };
  return {
    left: 5 + width('left', 0),
    right: 5 + width('right', 1),
    top: width('top', 0),
    bottom: width('bottom', 1),
  };
}

export function studioSheetCellTextInput(
  document: StudioExcelDocument,
  sheet: StudioSheet,
  calculation: SheetCalculation,
  address: string,
  box: { width: number; height: number },
  measure: SheetTextMeasure,
  lastTextColumn?: number,
  nativeLink?: StudioSheetHyperlink
): SheetTextLayoutInput {
  const cell = sheet.cells[address];
  const key = `${sheet.id}:${address}`;
  const conditional = studioConditionalCellStyle(sheet, address, calculation);
  const displayed = { ...(cell ?? { input: '' }), ...conditional };
  const value =
    calculation.values.get(key) ??
    studioInputValue(cell?.input ?? '', cell?.numberFormat, cell?.valueType);
  const error = sheetCellError(cell, calculation.errors.get(key));
  const link =
    !cell?.input && !calculation.arrayOwners.has(key)
      ? (nativeLink ?? studioCellHyperlink(document, sheet.id, address, calculation))
      : undefined;
  const defaults = sheetDefaultTextFormat(document.defaultFont);
  let borders = studioSheetTextBorders(sheet, address);
  const position = studioParseAddress(address)!;
  if (lastTextColumn !== undefined && lastTextColumn > position.col) {
    borders = {
      ...borders,
      right: sheet.cells[studioCellAddress(position.row, lastTextColumn)]?.borders?.right,
    };
  }
  return {
    value,
    error,
    display:
      cell?.input || calculation.arrayOwners.has(key)
        ? studioDisplayCell(displayed, calculation.values.get(key), error)
        : link?.display || link?.target || link?.location || '',
    numberFormat: displayed.numberFormat,
    format: displayed,
    box: { ...box, padding: studioSheetTextPadding(borders) },
    defaultFont: {
      family: defaults.fontFamily,
      sizePt: defaults.fontSize,
      bold: defaults.bold,
      italic: defaults.italic,
    },
    measure,
  };
}

/** Calculated spill and hyperlink cells participate without creating synthetic stored cells. */
export function studioSheetDerivedRowHeights(
  document: StudioExcelDocument,
  sheet: StudioSheet,
  calculation: SheetCalculation,
  rows: readonly number[],
  columnOffsets: readonly number[],
  measure: SheetTextMeasure,
  effectiveHiddenRows: ReadonlySet<number> = studioHiddenRows(sheet, calculation)
): Record<string, number> {
  const addresses = new Set(Object.keys(sheet.cells));
  const rowSet = new Set(rows);
  const queryRows = new Set(rows);
  const mergeOrigins = new Map<string, { row: number; visibleRows: number }>();
  const extraOriginRows = new Set<number>();
  for (const input of sheet.merges ?? []) {
    const range = studioParseRange(input)!;
    const visible = Array.from(
      { length: range.lastRow - range.firstRow + 1 },
      (_, index) => range.firstRow + index
    ).filter((row) => !effectiveHiddenRows.has(row));
    const address = studioCellAddress(range.firstRow, range.firstCol);
    addresses.add(address);
    mergeOrigins.set(address, { row: visible[0] ?? range.firstRow, visibleRows: visible.length });
    if (
      visible.length === 1 &&
      rowSet.has(visible[0]) &&
      sheetRowHeightMode(sheet, visible[0]) === 'auto'
    ) {
      queryRows.add(range.firstRow);
      extraOriginRows.add(range.firstRow);
    }
  }
  // Index only the requested rows. Sparse column slots preserve first-match
  // native link precedence without rescanning every link for each measured cell.
  const nativeLinks = new Map<number, Array<StudioSheetHyperlink | undefined>>();
  const sortedRows = [...queryRows].sort((left, right) => left - right);
  const firstRowIndex = (minimum: number) => {
    let low = 0,
      high = sortedRows.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      if (sortedRows[middle] < minimum) low = middle + 1;
      else high = middle;
    }
    return low;
  };
  const prefix = `${sheet.id}:`;
  for (const key of calculation.arrayOwners.keys())
    if (key.startsWith(prefix)) addresses.add(key.slice(prefix.length));
  for (const link of sheet.hyperlinks ?? []) {
    const range = studioParseRange(link.ref)!;
    // Existing formatted cells already participate. One otherwise empty linked cell
    // per row represents the identical default text, avoiding full-column expansion.
    for (
      let index = firstRowIndex(range.firstRow);
      index < sortedRows.length && sortedRows[index] <= range.lastRow;
      index++
    ) {
      const row = sortedRows[index];
      if (!extraOriginRows.has(row) && sheetRowHeightMode(sheet, row) === 'fixed') continue;
      const rowLinks = nativeLinks.get(row) ?? [];
      nativeLinks.set(row, rowLinks);
      let represented = false;
      for (
        let col = range.firstCol;
        col <= Math.min(range.lastCol, columnOffsets.length - 1);
        col++
      ) {
        const address = studioCellAddress(row, col);
        if (
          sheet.cells[address]?.input ||
          calculation.arrayOwners.has(prefix + address) ||
          columnOffsets[col] <= columnOffsets[col - 1]
        )
          continue;
        if (!rowLinks[col]) rowLinks[col] = link;
        if (sheet.cells[address]) continue;
        if (!represented) {
          addresses.add(address);
          represented = true;
        }
      }
    }
  }
  const hiddenColumns = studioHiddenColumns(sheet);
  const centeredRows = new Map<number, ReturnType<typeof studioSheetCenteredTextSegments>>();
  const grouped = new Map<
    number,
    Array<{
      address: string;
      input: SheetTextLayoutInput;
      mergedRows?: number;
      hiddenColumn?: boolean;
    }>
  >();
  for (const address of addresses) {
    const position = studioParseAddress(address)!;
    const merge = studioMergedRange(sheet, position);
    if (merge && (position.row !== merge.firstRow || position.col !== merge.firstCol)) continue;
    const mergedOrigin = mergeOrigins.get(address);
    // Automatic fitting has a unique physical row only after applying the full
    // hidden/filter state. A caller's requested subset never splits a visible merge.
    if (merge && mergedOrigin?.visibleRows !== 1) continue;
    const targetRow = mergedOrigin?.row ?? position.row;
    if (
      !rowSet.has(targetRow) ||
      effectiveHiddenRows.has(targetRow) ||
      sheetRowHeightMode(sheet, targetRow) === 'fixed'
    )
      continue;
    let center;
    if (sheet.cells[address]?.align === 'centerContinuous' && !merge) {
      let segments = centeredRows.get(position.row);
      if (!segments) {
        segments = studioSheetCenteredTextSegments(
          document,
          sheet,
          calculation,
          position.row,
          columnOffsets
        );
        centeredRows.set(position.row, segments);
      }
      center = segments.find((segment) => segment.ownerCol === position.col);
    }
    const end = merge?.lastCol ?? center?.lastCol ?? position.col;
    if (end >= columnOffsets.length) continue;
    const width = center?.width ?? columnOffsets[end] - columnOffsets[position.col - 1];
    if (width <= 0) continue;
    const cells = grouped.get(targetRow) ?? [];
    cells.push({
      address,
      input: studioSheetCellTextInput(
        document,
        sheet,
        calculation,
        address,
        { width, height: ((sheet.defaultRowHeight ?? 18) * 4) / 3 },
        measure,
        center?.lastCol,
        nativeLinks.get(position.row)?.[position.col]
      ),
      mergedRows: mergedOrigin?.visibleRows ?? 1,
      hiddenColumn: !merge && hiddenColumns.has(studioColumnLabel(position.col)),
    });
    grouped.set(targetRow, cells);
  }
  return Object.fromEntries(
    sheetAutoRowHeights(
      rows.map((row) => ({
        row,
        mode: sheetRowHeightMode(sheet, row),
        heightPt: sheet.rowHeights?.[String(row)],
        hidden: effectiveHiddenRows.has(row),
        cells: grouped.get(row) ?? [],
      })),
      { defaultHeightPt: sheet.defaultRowHeight }
    ).map(({ row, heightPt }) => [String(row), heightPt])
  );
}

export function studioSheetCenteredTextSegments(
  document: StudioExcelDocument,
  sheet: StudioSheet,
  calculation: SheetCalculation,
  row: number,
  columnOffsets: readonly number[],
  freezeColumns = sheet.freeze?.columns ?? 0
) {
  const hidden = studioHiddenColumns(sheet);
  return sheetCenterContinuousSegments(
    Array.from({ length: columnOffsets.length - 1 }, (_, index) => {
      const col = index + 1;
      const address = studioCellAddress(row, col);
      const cell = sheet.cells[address];
      return {
        col,
        x: columnOffsets[index],
        width: columnOffsets[col] - columnOffsets[index],
        align: cell?.align,
        occupied:
          !!cell?.input ||
          calculation.arrayOwners.has(`${sheet.id}:${address}`) ||
          !!studioCellHyperlink(document, sheet.id, address, calculation),
        hidden: hidden.has(studioColumnLabel(col)),
        merged: !!studioMergedRange(sheet, { row, col }),
        frozenLane: col <= freezeColumns ? 'frozen' : 'scroll',
      };
    })
  ).segments;
}
