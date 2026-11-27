import {
  sheetGeneralAlignment,
  sheetFirstStrongDirection,
  sheetTextFormatIssue,
  type SheetTextFormat,
  type SheetTextScalar,
  type SheetTextHorizontal,
} from './studio-sheet-text-properties';

export const SHEET_TEXT_POINTS_TO_PIXELS = 4 / 3;
export interface SheetTextFont {
  family: string;
  sizePt: number;
  bold: boolean;
  italic: boolean;
}
export interface SheetTextMetrics {
  width: number;
  height: number;
  ascent?: number;
  /** Optional shaped advances, one per grapheme, summing to width. */
  advances?: readonly number[];
}
export type SheetTextMeasure = (text: string, font: Readonly<SheetTextFont>) => SheetTextMetrics;
export interface SheetTextBox {
  /** Outer cell box in CSS px, before text insets. */
  width: number;
  height: number;
  /** Total text insets; include resolved border widths once, alongside content padding. */
  padding?: { left?: number; right?: number; top?: number; bottom?: number };
}
export interface SheetNumberFormatServices {
  format(code: string, value: string | number): string;
  validate?(code: unknown): string;
}
export interface SheetTextLayoutInput {
  value?: SheetTextScalar;
  error?: string;
  /** Displayed text supplied by real studioDisplayCell, including hyperlink labels. */
  display?: string;
  numberFormat?: string;
  format: Readonly<SheetTextFormat>;
  box: Readonly<SheetTextBox>;
  defaultFont: Readonly<SheetTextFont>;
  measure: SheetTextMeasure;
  numberFormats?: SheetNumberFormatServices;
  direction?: 'ltr' | 'rtl';
  /** JUSTIFY normally leaves each paragraph's last line unstretched. */
  justifyLastLine?: boolean;
}
export interface SheetTextRun {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Cell-relative transformed rectangle corners; glyphs rotate only in angled mode. */
  quad: readonly { x: number; y: number }[];
}
export interface SheetTextLine {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  paragraphEnd: boolean;
  gap: number;
  gapKind: 'none' | 'characters' | 'words' | 'lines';
  verticalGap?: number;
  runs: SheetTextRun[];
}
export interface SheetTextLayout {
  text: string;
  align: SheetTextHorizontal;
  direction: 'ltr' | 'rtl';
  wrapEffective: boolean;
  shrinkRequested: boolean;
  shrinkApplied: boolean;
  nominalFont: SheetTextFont;
  effectiveFont: SheetTextFont;
  indentPx: number;
  padding: Required<NonNullable<SheetTextBox['padding']>>;
  contentBox: { x: number; y: number; width: number; height: number };
  naturalTextBox: { width: number; height: number };
  drawBox: { x: number; y: number; width: number; height: number };
  /** CSS-pixel affine matrix, with CSS angle = -native textRotation. */
  transform: { a: number; b: number; c: number; d: number; e: number; f: number };
  verticalGlyphs: boolean;
  lines: SheetTextLine[];
  overconstrained: boolean;
  notes: string[];
}

function finiteSize(value: number, label: string, positive = false): number {
  if (!Number.isFinite(value) || value < 0 || (positive && value === 0)) {
    throw new Error('Invalid ' + label + ' in text geometry.');
  }
  return value;
}
export function sheetTextGraphemes(text: string): string[] {
  if (typeof Intl.Segmenter === 'function') {
    return Array.from(
      new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text),
      (entry) => entry.segment
    );
  }
  // Explicit fallback is conservative. ZWJ/complex clusters need a real segmenter.
  const result: string[] = [];
  for (const character of text) {
    if (/\p{Mark}/u.test(character) && result.length) result[result.length - 1] += character;
    else result.push(character);
  }
  return result;
}

type RawLine = { text: string; paragraphEnd: boolean };
function metricReader(measure: SheetTextMeasure, notes: Set<string>) {
  const cache = new Map<string, SheetTextMetrics>();
  return (text: string, font: SheetTextFont): SheetTextMetrics => {
    const key = JSON.stringify([font.family, font.sizePt, font.bold, font.italic, text]);
    const cached = cache.get(key);
    if (cached) return cached;
    const metric = measure(text, font);
    finiteSize(metric.width, 'measured width');
    finiteSize(metric.height, 'measured height', !!text);
    if (metric.advances) {
      if (
        metric.advances.length !== sheetTextGraphemes(text).length ||
        metric.advances.some((width) => !Number.isFinite(width) || width < 0) ||
        Math.abs(metric.advances.reduce((sum, width) => sum + width, 0) - metric.width) > 0.01
      ) {
        throw new Error('Shaped grapheme advances do not match measured text width.');
      }
    } else if (text) notes.add('shaped-advances-not-supplied');
    const result = { ...metric, advances: metric.advances ? [...metric.advances] : undefined };
    cache.set(key, result);
    return result;
  };
}
type ReadMetric = ReturnType<typeof metricReader>;

function advances(text: string, font: SheetTextFont, read: ReadMetric): number[] {
  const metric = read(text, font);
  if (metric.advances) return [...metric.advances];
  const units = sheetTextGraphemes(text);
  const widths = units.map((unit) => read(unit, font).width);
  const sum = widths.reduce((total, width) => total + width, 0);
  return widths.map((width) => (sum > 0 ? (width * metric.width) / sum : 0));
}

function wrapLines(
  text: string,
  font: SheetTextFont,
  width: number,
  wrap: boolean,
  read: ReadMetric
): RawLine[] {
  if (!text) return [];
  const result: RawLine[] = [];
  for (const paragraph of text.replace(/\r\n|\r/g, '\n').split('\n')) {
    if (!wrap || !paragraph) {
      result.push({ text: paragraph, paragraphEnd: true });
      continue;
    }
    const units = sheetTextGraphemes(paragraph);
    const widths = advances(paragraph, font, read);
    let start = 0;
    while (start < units.length) {
      let end = start,
        occupied = 0,
        breakAt = -1;
      while (end < units.length && (end === start || occupied + widths[end] <= width + 0.00001)) {
        occupied += widths[end];
        if (units[end] === ' ') breakAt = end;
        end++;
      }
      if (end < units.length && breakAt > start) end = breakAt + 1;
      let line = units.slice(start, end).join('');
      if (end < units.length) line = line.replace(/ +$/, '');
      result.push({ text: line, paragraphEnd: end === units.length });
      start = end;
      while (start < units.length && units[start] === ' ') start++;
    }
  }
  return result;
}

function rotation(angle: number) {
  const radians = (-angle * Math.PI) / 180;
  const snap = (value: number) => (Math.abs(value) < 1e-12 ? 0 : value);
  return { cos: snap(Math.cos(radians)), sin: snap(Math.sin(radians)) };
}
function rotatedSize(width: number, height: number, angle: number) {
  const { cos, sin } = rotation(angle);
  return {
    width: Math.abs(cos) * width + Math.abs(sin) * height,
    height: Math.abs(sin) * width + Math.abs(cos) * height,
  };
}
function lineNaturalSize(raw: readonly RawLine[], font: SheetTextFont, read: ReadMetric) {
  const lineHeight = read('Mg', font).height;
  const sizes = raw.map((line) => ({
    width: read(line.text, font).width,
    height: Math.max(lineHeight, read(line.text, font).height),
  }));
  return {
    sizes,
    width: Math.max(0, ...sizes.map((size) => size.width)),
    height: sizes.reduce((sum, size) => sum + size.height, 0),
  };
}

function verticalNaturalSize(raw: readonly RawLine[], font: SheetTextFont, read: ReadMetric) {
  const lineHeight = read('Mg', font).height;
  const sizes = raw.map((column) => {
    const units = sheetTextGraphemes(column.text);
    return {
      width: Math.max(0, ...units.map((unit) => read(unit, font).width)),
      height: units.length * lineHeight,
    };
  });
  return {
    sizes,
    width: sizes.reduce((sum, size) => sum + size.width, 0),
    height: Math.max(0, ...sizes.map((size) => size.height)),
  };
}

function displayedText(input: SheetTextLayoutInput): string {
  if (input.error) return input.error;
  if (input.display !== undefined) return input.display;
  if (input.value === undefined) return '';
  if (typeof input.value === 'boolean') return input.value ? 'TRUE' : 'FALSE';
  if (input.numberFormat && input.numberFormats) {
    return input.numberFormats.format(input.numberFormat, input.value);
  }
  return String(input.value);
}

/** All geometry uses CSS px. No cell, font, formula, array or merge is modified. */
export function sheetLayoutText(input: SheetTextLayoutInput): SheetTextLayout {
  const issue = sheetTextFormatIssue(input.format);
  if (issue) throw new Error(issue);
  const width = finiteSize(input.box.width, 'cell width', true);
  const height = finiteSize(input.box.height, 'cell height', true);
  const notes = new Set<string>();
  const read = metricReader(input.measure, notes);
  const text = displayedText(input);
  if (text.length > 32767) throw new Error('Cell display exceeds 32767 characters.');
  const defaults = input.defaultFont;
  if (
    !defaults ||
    typeof defaults.family !== 'string' ||
    typeof defaults.sizePt !== 'number' ||
    typeof defaults.bold !== 'boolean' ||
    typeof defaults.italic !== 'boolean'
  ) {
    throw new Error('工作簿默认字体上下文无效。');
  }
  const defaultIssue = sheetTextFormatIssue({
    fontFamily: defaults.family,
    fontSize: defaults.sizePt,
    bold: defaults.bold,
    italic: defaults.italic,
  });
  if (defaultIssue) throw new Error(defaultIssue);
  const nominalFont: SheetTextFont = {
    family: input.format.fontFamily ?? defaults.family,
    sizePt: input.format.fontSize ?? defaults.sizePt,
    bold: input.format.bold ?? defaults.bold,
    italic: input.format.italic ?? defaults.italic,
  };
  const effectiveFont = { ...nominalFont };
  const direction = input.direction ?? sheetFirstStrongDirection(text);
  const align =
    input.format.align && input.format.align !== 'general'
      ? input.format.align
      : sheetGeneralAlignment(input.value, {
          error: input.error,
          numberFormat: input.numberFormat,
          direction,
        });
  const verticalGlyphs = input.format.textRotation === 'vertical';
  const angle = typeof input.format.textRotation === 'number' ? input.format.textRotation : 0;
  const padding = {
    left: finiteSize(input.box.padding?.left ?? 0, 'left padding'),
    right: finiteSize(input.box.padding?.right ?? 0, 'right padding'),
    top: finiteSize(input.box.padding?.top ?? 0, 'top padding'),
    bottom: finiteSize(input.box.padding?.bottom ?? 0, 'bottom padding'),
  };
  const indentPx = (input.format.indent ?? 0) * read(' ', { ...defaults }).width * 3;
  const vertical = input.format.verticalAlign ?? 'bottom';
  if (verticalGlyphs) {
    if (align === 'right') padding.bottom += indentPx;
    else padding.top += indentPx;
  } else {
    if (align === 'left') padding.left += indentPx;
    if (align === 'right') padding.right += indentPx;
    if (align === 'distributed') {
      padding.left += indentPx;
      padding.right += indentPx;
    }
  }
  const contentBox = {
    x: padding.left,
    y: padding.top,
    width: Math.max(0, width - padding.left - padding.right),
    height: Math.max(0, height - padding.top - padding.bottom),
  };
  const wrapEffective =
    !!input.format.wrap ||
    align === 'justify' ||
    align === 'distributed' ||
    vertical === 'justify' ||
    vertical === 'distributed';
  const shrinkRequested = !!input.format.shrinkToFit;
  if (direction === 'rtl') notes.add('rtl-visual-shaping-needs-adapter');
  if (text.includes('\t')) notes.add('tab-stop-layout-not-implemented');
  if (!input.format.wrap && /[\r\n]/.test(text)) {
    notes.add('explicit-linebreak-display-contract-needs-ui-integration');
  }
  if (typeof Intl.Segmenter !== 'function') notes.add('grapheme-fallback-needs-segmenter');

  let raw = wrapLines(text, effectiveFont, contentBox.width, wrapEffective, read);
  if (align === 'fill')
    raw = raw.map((line) => {
      const width = read(line.text, effectiveFont).width;
      if (!line.text || width <= 0 || width > contentBox.width) return line;
      let count = Math.min(
        Math.floor(32767 / line.text.length),
        Math.max(1, Math.floor(contentBox.width / width))
      );
      while (count > 1 && read(line.text.repeat(count), effectiveFont).width > contentBox.width)
        count--;
      return { ...line, text: line.text.repeat(count) };
    });
  let natural = lineNaturalSize(raw, effectiveFont, read);
  // Angled wrap changes both projected width and height. This deterministic
  // conservative pass never claims native-perfect line breaking.
  if (!verticalGlyphs && angle !== 0 && wrapEffective && text) {
    notes.add('angled-wrap-native-parity-not-proven');
    const { cos, sin } = rotation(angle);
    if (Math.abs(cos) > 0.00001) {
      let wrapWidth = contentBox.width;
      for (let attempt = 0; attempt < 8; attempt++) {
        const nextWidth = Math.max(
          1,
          (contentBox.width - Math.abs(sin) * natural.height) / Math.abs(cos)
        );
        if (nextWidth >= wrapWidth - 0.01) break;
        wrapWidth = nextWidth;
        raw = wrapLines(text, effectiveFont, wrapWidth, true, read);
        natural = lineNaturalSize(raw, effectiveFont, read);
      }
    }
  }
  if (verticalGlyphs) {
    const columns = text ? text.replace(/\r\n|\r/g, '\n').split('\n') : [];
    raw = columns.map((column) => ({ text: column, paragraphEnd: true }));
    natural = verticalNaturalSize(raw, effectiveFont, read);
    if (wrapEffective) notes.add('vertical-multicolumn-wrap-native-parity-not-proven');
  }
  let projected = rotatedSize(natural.width, natural.height, angle);
  if (shrinkRequested && !wrapEffective && text && projected.width > contentBox.width) {
    if (verticalGlyphs) notes.add('vertical-shrink-native-parity-not-proven');
    const minimum = Math.min(1, nominalFont.sizePt);
    for (
      let attempt = 0;
      attempt < 64 && projected.width > contentBox.width + 0.01 && effectiveFont.sizePt > minimum;
      attempt++
    ) {
      const proportional =
        Math.floor(((effectiveFont.sizePt * contentBox.width) / projected.width) * 2) / 2;
      effectiveFont.sizePt = Math.max(minimum, Math.min(effectiveFont.sizePt - 0.5, proportional));
      if (verticalGlyphs) natural = verticalNaturalSize(raw, effectiveFont, read);
      else {
        raw = wrapLines(text, effectiveFont, contentBox.width, false, read);
        natural = lineNaturalSize(raw, effectiveFont, read);
      }
      projected = rotatedSize(natural.width, natural.height, angle);
    }
  }

  const lines: SheetTextLine[] = [];
  let drawWidth = natural.width,
    drawHeight = natural.height;
  if (!verticalGlyphs) {
    let top = 0;
    for (let index = 0; index < raw.length; index++) {
      const source = raw[index],
        size = natural.sizes[index];
      const units = sheetTextGraphemes(source.text);
      const widths = advances(source.text, effectiveFont, read);
      const occupied = widths.reduce((sum, amount) => sum + amount, 0);
      const free = Math.max(0, contentBox.width - occupied);
      const eligibleSpaces = units
        .map((unit, unitIndex) =>
          unit === ' ' && unitIndex > 0 && unitIndex < units.length - 1 ? unitIndex : -1
        )
        .filter((unitIndex) => unitIndex >= 0);
      const distributed = align === 'distributed' && units.length > 1;
      const justified =
        align === 'justify' &&
        eligibleSpaces.length > 0 &&
        (!source.paragraphEnd || !!input.justifyLastLine);
      const gap = distributed
        ? free / (units.length - 1)
        : justified
          ? free / eligibleSpaces.length
          : 0;
      const stretchedWidth =
        occupied + gap * (distributed ? units.length - 1 : justified ? eligibleSpaces.length : 0);
      const horizontal =
        align === 'right'
          ? contentBox.width - stretchedWidth
          : align === 'center' ||
              align === 'centerContinuous' ||
              (align === 'distributed' && units.length <= 1)
            ? (contentBox.width - stretchedWidth) / 2
            : 0;
      const runs: SheetTextRun[] = [];
      let cursor = horizontal;
      for (let unitIndex = 0; unitIndex < units.length; unitIndex++) {
        runs.push({
          text: units[unitIndex],
          x: cursor,
          y: top,
          width: widths[unitIndex],
          height: size.height,
          quad: [],
        });
        cursor += widths[unitIndex];
        if (
          (distributed && unitIndex < units.length - 1) ||
          (justified && eligibleSpaces.includes(unitIndex))
        )
          cursor += gap;
      }
      lines.push({
        text: source.text,
        x: horizontal,
        y: top,
        width: stretchedWidth,
        height: size.height,
        paragraphEnd: source.paragraphEnd,
        gap,
        gapKind: distributed ? 'characters' : justified ? 'words' : 'none',
        runs,
      });
      top += size.height;
    }
    if ((vertical === 'distributed' || vertical === 'justify') && lines.length > 1) {
      const gap = Math.max(0, contentBox.height - natural.height) / (lines.length - 1);
      for (let index = 0; index < lines.length; index++) {
        lines[index].y += gap * index;
        lines[index].verticalGap = gap;
        for (const run of lines[index].runs) run.y += gap * index;
      }
      drawHeight += gap * (lines.length - 1);
    }
    // Normal horizontal alignment positions runs inside the available cell width.
    // An angled block must instead be positioned as a whole rotated rectangle.
    if (angle !== 0) {
      for (const line of lines) {
        const shift = -line.x;
        line.x = 0;
        for (const run of line.runs) run.x += shift;
      }
    } else drawWidth = contentBox.width;
  } else {
    let left = 0;
    for (let index = 0; index < raw.length; index++) {
      const units = sheetTextGraphemes(raw[index].text);
      const size = natural.sizes[index];
      const lineHeight = read('Mg', effectiveFont).height;
      const distributed = vertical === 'distributed' && units.length > 1;
      const gap = distributed
        ? Math.max(0, contentBox.height - size.height) / (units.length - 1)
        : 0;
      const runs = units.map((unit, unitIndex): SheetTextRun => ({
        text: unit,
        x: left + (size.width - read(unit, effectiveFont).width) / 2,
        y: unitIndex * (lineHeight + gap),
        width: read(unit, effectiveFont).width,
        height: lineHeight,
        quad: [],
      }));
      lines.push({
        text: raw[index].text,
        x: left,
        y: 0,
        width: size.width,
        height: size.height + gap * Math.max(0, units.length - 1),
        paragraphEnd: true,
        gap,
        gapKind: distributed ? 'characters' : 'none',
        runs,
      });
      drawHeight = Math.max(drawHeight, lines[index].height);
      left += size.width;
    }
  }
  projected = rotatedSize(drawWidth, drawHeight, angle);
  const blockHorizontal =
    angle === 0 && !verticalGlyphs
      ? 0
      : align === 'right'
        ? contentBox.width - projected.width
        : align === 'center' || align === 'centerContinuous'
          ? (contentBox.width - projected.width) / 2
          : 0;
  const blockVertical =
    vertical === 'top' || vertical === 'justify'
      ? 0
      : vertical === 'middle' || vertical === 'distributed'
        ? (contentBox.height - projected.height) / 2
        : contentBox.height - projected.height;
  const drawBox = {
    x: contentBox.x + blockHorizontal,
    y: contentBox.y + blockVertical,
    width: projected.width,
    height: projected.height,
  };
  const { cos, sin } = rotation(angle);
  const corners = [
    [0, 0],
    [drawWidth, 0],
    [0, drawHeight],
    [drawWidth, drawHeight],
  ];
  const minX = Math.min(...corners.map(([x, y]) => cos * x - sin * y));
  const minY = Math.min(...corners.map(([x, y]) => sin * x + cos * y));
  const transform = { a: cos, b: sin, c: -sin, d: cos, e: drawBox.x - minX, f: drawBox.y - minY };
  for (const line of lines)
    for (const run of line.runs) {
      run.quad = [
        [run.x, run.y],
        [run.x + run.width, run.y],
        [run.x + run.width, run.y + run.height],
        [run.x, run.y + run.height],
      ].map(([x, y]) => ({
        x: cos * x - sin * y + transform.e,
        y: sin * x + cos * y + transform.f,
      }));
    }
  const naturalTextBox = rotatedSize(natural.width, natural.height, angle);
  return {
    text,
    align,
    direction,
    wrapEffective,
    shrinkRequested,
    shrinkApplied: effectiveFont.sizePt < nominalFont.sizePt,
    nominalFont,
    effectiveFont,
    indentPx,
    padding,
    contentBox,
    naturalTextBox,
    drawBox,
    transform,
    verticalGlyphs,
    lines,
    overconstrained:
      naturalTextBox.width > contentBox.width + 0.01 ||
      naturalTextBox.height > contentBox.height + 0.01,
    notes: [...notes],
  };
}

export interface SheetCenterSlot {
  col: number;
  x: number;
  width: number;
  align?: SheetTextHorizontal;
  /** Logical occupancy includes formulas, arrays and links even with empty display. */
  occupied: boolean;
  hidden?: boolean;
  merged?: boolean;
  frozenLane?: string;
}
export interface SheetCenterSegment {
  ownerCol: number;
  firstCol: number;
  lastCol: number;
  x: number;
  width: number;
  memberCols: number[];
}
export function sheetCenterContinuousSegments(slots: readonly SheetCenterSlot[]): {
  segments: SheetCenterSegment[];
  notes: string[];
} {
  const segments: SheetCenterSegment[] = [];
  const notes = new Set<string>();
  let index = 0;
  while (index < slots.length) {
    const owner = slots[index];
    finiteSize(owner.x, 'column offset');
    finiteSize(owner.width, 'column width');
    if (owner.hidden) notes.add('hidden-column-crossing-not-bridged');
    if (owner.merged) notes.add('merged-centerContinuous-not-bridged');
    if (owner.align !== 'centerContinuous' || !owner.occupied || owner.hidden || owner.merged) {
      index++;
      continue;
    }
    let end = index + 1;
    while (end < slots.length) {
      const candidate = slots[end],
        previous = slots[end - 1];
      if (candidate.hidden) {
        notes.add('hidden-column-crossing-not-bridged');
        break;
      }
      if (candidate.frozenLane !== owner.frozenLane) {
        notes.add('frozen-lane-crossing-not-bridged');
        break;
      }
      if (
        candidate.align !== 'centerContinuous' ||
        candidate.occupied ||
        candidate.merged ||
        candidate.col !== previous.col + 1 ||
        Math.abs(candidate.x - (previous.x + previous.width)) > 0.01
      )
        break;
      finiteSize(candidate.width, 'column width', true);
      end++;
    }
    const members = slots.slice(index, end);
    segments.push({
      ownerCol: owner.col,
      firstCol: owner.col,
      lastCol: members[members.length - 1].col,
      x: owner.x,
      width: members.reduce((sum, member) => sum + member.width, 0),
      memberCols: members.map((member) => member.col),
    });
    index = end;
  }
  return { segments, notes: [...notes] };
}

export interface SheetAutoRowCell {
  address: string;
  input: SheetTextLayoutInput;
  mergedRows?: number;
  hiddenColumn?: boolean;
}
export interface SheetAutoRow {
  row: number;
  mode?: 'auto' | 'fixed';
  heightPt?: number;
  hidden?: boolean;
  cells: readonly SheetAutoRowCell[];
}
export interface SheetAutoRowResult {
  row: number;
  heightPt: number;
  mode: 'auto' | 'fixed';
  hidden: boolean;
  measured: string[];
  excluded: string[];
  notes: string[];
}
/** Cached old auto heights never become a max baseline, so rows can shrink. */
export function sheetAutoRowHeights(
  rows: readonly SheetAutoRow[],
  options: {
    defaultHeightPt?: number;
    maximumHeightPt?: number;
  } = {}
): SheetAutoRowResult[] {
  const fallback = finiteSize(options.defaultHeightPt ?? 18, 'default row height', true);
  const maximum = finiteSize(options.maximumHeightPt ?? 409.5, 'maximum row height', true);
  return rows.map((row) => {
    if (!Number.isInteger(row.row) || row.row < 1 || row.row > 10000) {
      throw new Error('Invalid auto row index.');
    }
    if (row.heightPt !== undefined) finiteSize(row.heightPt, 'stored row height', true);
    if (row.heightPt !== undefined && row.heightPt > maximum) {
      throw new Error('Stored row height exceeds the supported maximum.');
    }
    if (row.mode !== undefined && row.mode !== 'auto' && row.mode !== 'fixed') {
      throw new Error('Invalid row-height mode.');
    }
    const mode = row.mode ?? (row.heightPt === undefined ? 'auto' : 'fixed');
    const measured: string[] = [],
      excluded: string[] = [];
    const notes = new Set<string>();
    let heightPt = mode === 'fixed' || row.hidden ? (row.heightPt ?? fallback) : fallback;
    if (mode === 'auto' && !row.hidden)
      for (const cell of row.cells) {
        if (cell.hiddenColumn || (cell.mergedRows ?? 1) > 1) {
          excluded.push(cell.address);
          continue;
        }
        const layout = sheetLayoutText(cell.input);
        if (!layout.text) continue;
        measured.push(cell.address);
        for (const note of layout.notes) notes.add(note);
        const required =
          (layout.naturalTextBox.height + layout.padding.top + layout.padding.bottom) /
          SHEET_TEXT_POINTS_TO_PIXELS;
        heightPt = Math.max(heightPt, required);
      }
    if (mode === 'auto' && !row.hidden) {
      heightPt = Math.min(maximum, Math.ceil(heightPt * 4 - 1e-8) / 4);
    }
    return {
      row: row.row,
      heightPt,
      mode,
      hidden: !!row.hidden,
      measured,
      excluded,
      notes: [...notes],
    };
  });
}
