import {
  wordSurface,
  WORD_SURFACE_SIDES,
  type StudioWordParagraphSurface,
} from '../../../../../packages/ui/src/components/OfficeStudio/studio-word-surface';
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const children = (node?: Element) =>
  node ? Array.from(node.children).filter((entry) => entry.namespaceURI === W) : [];
const child = (node: Element | undefined, name: string) =>
  children(node).find((entry) => entry.localName === name);
const attr = (node: Element | undefined, name = 'val') => node?.getAttributeNS(W, name) ?? '';
const enabled = (raw: string) => !['0', 'false', 'off'].includes(raw);
function integer(raw: string, label: string, min: number, max: number) {
  if (!/^\d+$/.test(raw) || Number(raw) < min || Number(raw) > max)
    throw new Error(`段落${label}无效。`);
  return Number(raw);
}
const color = (raw: string) => (raw === 'auto' ? 'auto' : `#${raw}`);
export function readWordSurface(properties?: Element): StudioWordParagraphSurface | undefined {
  const borders = child(properties, 'pBdr'),
    shading = child(properties, 'shd');
  if (!borders && !shading) return undefined;
  const result: StudioWordParagraphSurface = {};
  if (borders) {
    result.borders = {};
    for (const entry of children(borders)) {
      if (!(WORD_SURFACE_SIDES as readonly string[]).includes(entry.localName))
        throw new Error(`段落边框 ${entry.localName} 尚未支持。`);
      result.borders[entry.localName as (typeof WORD_SURFACE_SIDES)[number]] = {
        style: attr(entry) as never,
        ...(attr(entry, 'sz') ? { size: integer(attr(entry, 'sz'), '边框宽度', 2, 96) / 8 } : {}),
        ...(attr(entry, 'space')
          ? { space: integer(attr(entry, 'space'), '边框距离', 0, 31) }
          : {}),
        ...(attr(entry, 'color') ? { color: color(attr(entry, 'color')) } : {}),
        ...(entry.hasAttributeNS(W, 'shadow') ? { shadow: enabled(attr(entry, 'shadow')) } : {}),
        ...(entry.hasAttributeNS(W, 'frame') ? { frame: enabled(attr(entry, 'frame')) } : {}),
      };
    }
  }
  if (shading)
    result.shading = {
      pattern: (attr(shading) || 'clear') as never,
      ...(attr(shading, 'fill') ? { fill: color(attr(shading, 'fill')) } : {}),
      ...(attr(shading, 'color') ? { color: color(attr(shading, 'color')) } : {}),
    };
  return wordSurface(result);
}
const escaped = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]!
  );
const nativeColor = (value: string) => (value === 'auto' ? value : value.slice(1));
export function wordSurfaceXml(input: unknown) {
  const value = wordSurface(input);
  let xml = '';
  if (value.borders)
    xml += `<w:pBdr>${Object.entries(value.borders)
      .map(
        ([side, border]) =>
          `<w:${side} w:val="${border.style}"${border.size !== undefined ? ` w:sz="${border.size * 8}"` : ''}${border.space !== undefined ? ` w:space="${border.space}"` : ''}${border.color ? ` w:color="${nativeColor(border.color)}"` : ''}${border.shadow !== undefined ? ` w:shadow="${border.shadow ? 1 : 0}"` : ''}${border.frame !== undefined ? ` w:frame="${border.frame ? 1 : 0}"` : ''}/>`
      )
      .join('')}</w:pBdr>`;
  if (value.shading)
    xml += `<w:shd w:val="${value.shading.pattern}"${value.shading.fill ? ` w:fill="${nativeColor(value.shading.fill)}"` : ''}${value.shading.color ? ` w:color="${nativeColor(value.shading.color)}"` : ''}/>`;
  return xml;
}
export function patchWordSurfaceStyles(
  xml: string,
  styles: { id: string; surface?: StudioWordParagraphSurface }[]
) {
  for (const style of styles) {
    if (!style.surface) continue;
    const marker = `w:styleId="${escaped(style.id)}"`;
    const start = xml.indexOf(marker),
      end = xml.indexOf('</w:style>', start);
    if (start < 0 || end < 0) throw new Error('段落边框样式缺失。');
    const tagStart = xml.lastIndexOf('<w:style', start),
      whole = xml.slice(tagStart, end + '</w:style>'.length);
    const surface = wordSurfaceXml(style.surface);
    const next = whole.includes('<w:pPr>')
      ? whole.replace('<w:pPr>', `<w:pPr>${surface}`)
      : whole.replace('</w:style>', `<w:pPr>${surface}</w:pPr></w:style>`);
    xml = xml.slice(0, tagStart) + next + xml.slice(end + '</w:style>'.length);
  }
  return xml;
}
