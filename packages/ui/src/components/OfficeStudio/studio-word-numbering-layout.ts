import { wordNextTab } from './studio-word-tabs';
import { wordNumberingTabStops, type StudioWordNumberingLevel } from './studio-word-numbering';
import { studioFontFamilyCss } from './studio-font-input';
export function wordNumberingStyle(
  attrs: Record<string, unknown>,
  level: StudioWordNumberingLevel,
  index: number
): Record<string, string> {
  const direct = attrs.paragraphStyleDirectAttrs;
  const owned = (key: string) =>
    typeof attrs[key] === 'number' &&
    (!Array.isArray(direct) || direct.includes(key) || attrs[key] !== 0);
  const left = owned('indentLeft')
    ? Number(attrs.indentLeft)
    : (level.indentLeft ?? (index + 1) * 36);
  const first = owned('indentFirstLine')
    ? Number(attrs.indentFirstLine)
    : (level.indentFirstLine ?? -18);
  return {
    'margin-left': `${left}pt`,
    'text-indent': '0pt',
    '--zuvi-numbering-hang': `${first}pt`,
    ...(level.fontFamily
      ? { '--zuvi-numbering-family': studioFontFamilyCss(level.fontFamily) }
      : {}),
    ...(level.fontSize ? { '--zuvi-numbering-size': `${level.fontSize}pt` } : {}),
    ...(level.color ? { '--zuvi-numbering-color': level.color } : {}),
    ...(level.bold !== undefined ? { '--zuvi-numbering-weight': level.bold ? '700' : '400' } : {}),
    ...(level.italic !== undefined
      ? { '--zuvi-numbering-style': level.italic ? 'italic' : 'normal' }
      : {}),
  };
}
export interface WordNumberingMeasurement {
  position: number;
  indent: string;
  shift: string;
}
/** View/print measurements never add a character or change a paragraph's direct formatting. */
export function wordMeasureNumbering(root: HTMLElement): WordNumberingMeasurement[] {
  const doc = root.ownerDocument,
    win = doc.defaultView;
  if (!win) return [];
  const result: WordNumberingMeasurement[] = [];
  for (const paragraph of root.querySelectorAll<HTMLElement>('[data-word-numbering-label]')) {
    if (!paragraph.offsetWidth) continue;
    const label = paragraph.dataset.wordNumberingLabel ?? '';
    let level: StudioWordNumberingLevel;
    try {
      level = JSON.parse(paragraph.dataset.wordNumberingLayout ?? '{}');
    } catch {
      continue;
    }
    const base = win.getComputedStyle(paragraph),
      style = win.getComputedStyle(paragraph, '::before');
    const sample = doc.createElement('span');
    sample.textContent = label;
    sample.style.cssText =
      'position:absolute;visibility:hidden;pointer-events:none;white-space:pre;left:0;top:0';
    for (const key of [
      'font-family',
      'font-size',
      'font-weight',
      'font-style',
      'font-variant',
      'letter-spacing',
      'word-spacing',
    ])
      sample.style.setProperty(key, style.getPropertyValue(key) || base.getPropertyValue(key));
    doc.body.append(sample);
    const width = sample.getBoundingClientRect().width * 0.75;
    sample.textContent = ' ';
    const space = sample.getBoundingClientRect().width * 0.75;
    sample.remove();
    const left = (parseFloat(base.marginLeft) || 0) * 0.75;
    const first = parseFloat(base.getPropertyValue('--zuvi-numbering-hang')) || 0;
    const alignment = level.alignment ?? 'left';
    const start =
      left + first - (alignment === 'right' ? width : alignment === 'center' ? width / 2 : 0);
    let target = start + width;
    if ((level.suffix ?? 'tab') === 'tab') {
      const stops = wordNumberingTabStops(level.tabStops).map((entry) => ({
        ...entry,
        alignment: entry.alignment === 'num' ? ('left' as const) : entry.alignment,
      }));
      if (!stops.some((entry) => entry.position === left))
        stops.push({ position: left, alignment: 'left' });
      stops.sort((a, b) => a.position - b.position);
      target += wordNextTab(
        stops,
        target,
        0,
        0,
        Number(paragraph.dataset.wordDefaultTab || 36)
      ).width;
    } else if (level.suffix === 'space') target += space;
    result.push({
      position: Number(paragraph.dataset.wordNumberingPosition),
      indent: `${target - left}pt`,
      shift: alignment === 'right' ? '-100%' : alignment === 'center' ? '-50%' : '0%',
    });
  }
  return result;
}
export function wordLayoutPrintedNumbering(root: HTMLElement) {
  [...root.querySelectorAll<HTMLElement>('[data-word-numbering-label]')].forEach(
    (paragraph, index) => {
      paragraph.dataset.wordNumberingPosition = String(index);
    }
  );
  const measurements = wordMeasureNumbering(root);
  for (const paragraph of root.querySelectorAll<HTMLElement>('[data-word-numbering-label]')) {
    const entry = measurements.find(
      (item) => item.position === Number(paragraph.dataset.wordNumberingPosition)
    );
    if (!entry) continue;
    paragraph.style.textIndent = entry.indent;
    paragraph.style.setProperty('--zuvi-numbering-shift', entry.shift);
  }
}
