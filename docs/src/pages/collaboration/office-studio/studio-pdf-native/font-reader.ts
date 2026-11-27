import { PDFDocument, PDFDict, PDFArray, PDFRawStream, PDFStream, PDFPage } from 'pdf-lib';
import type { PDFObject } from 'pdf-lib';
import type { NativeFontSource, NativeDeviceColor } from './types';
import { get, has, text, annotationAppearance, streamHash, standardFont } from './objects';
import { name } from './constants';
import { appearanceProperties } from './appearance-parser';
import { deviceColorRgb } from './colors';

interface DefaultAppearanceFont {
  key: string;
  size: number;
  deviceColor: NativeDeviceColor;
}

/** Only one Tf and one device-color operator are accepted; complex DA stays passive. */
export function defaultAppearanceFont(value: string | undefined): DefaultAppearanceFont | undefined {
  if (value === undefined) return;
  const numberToken = '[-+]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)';
  const expression = new RegExp('^\\s*\\/([^\\s/()\\[\\]<>%{}]+)\\s+(' + numberToken
    + ')\\s+Tf\\s+((?:' + numberToken + '\\s+){0,3}' + numberToken + ')\\s+(g|rg|k)\\s*$');
  const match = expression.exec(value);
  if (!match) return;
  const size = Number(match[2]), components = match[3].trim().split(/\s+/).map(Number);
  const count = match[4] === 'g' ? 1 : match[4] === 'rg' ? 3 : 4;
  if (!Number.isFinite(size) || size < 1 || size > 144 || components.length !== count
    || components.some((component) => !Number.isFinite(component) || component < 0 || component > 1)) return;
  const key = match[1].replace(/#([0-9a-f]{2})/gi, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));
  return { key, size, deviceColor: { space: count === 1 ? 'gray' : count === 3 ? 'rgb' : 'cmyk', components } };
}

/** AP Resources, annotation DR, then the actual owning page; shared by reading and exact font extraction. */
export function sourceFreeTextFont(page: PDFPage, dict: PDFDict, key: string): PDFDict | undefined {
  const appearance = annotationAppearance(dict);
  const resources = appearance instanceof PDFStream ? get(appearance.dict, 'Resources') : undefined;
  const appearanceFonts = resources instanceof PDFDict ? get(resources, 'Font') : undefined;
  const directResources = get(dict, 'DR');
  const directFonts = directResources instanceof PDFDict ? get(directResources, 'Font') : undefined;
  const pageResources = page.node.Resources();
  const pageFonts = pageResources instanceof PDFDict ? get(pageResources, 'Font') : undefined;
  return [appearanceFonts, directFonts, pageFonts]
    .filter((entry) => entry instanceof PDFDict)
    .map((entry) => get(entry, key)).find((entry): entry is PDFDict => entry instanceof PDFDict);
}

/** The supported full-source layout is the same Identity-H/CIDToGID contract used for native reuse. */
export function fullTrueTypeFontFile(dict: PDFDict): PDFObject | undefined {
  if (get(dict, 'Subtype') !== name('Type0') || get(dict, 'Encoding') !== name('Identity-H')) return;
  const descendants = get(dict, 'DescendantFonts'), child = descendants instanceof PDFArray ? descendants.lookup(0) : undefined;
  if (!(child instanceof PDFDict) || get(child, 'Subtype') !== name('CIDFontType2') || get(child, 'CIDToGIDMap') !== name('Identity')) return;
  const descriptor = get(child, 'FontDescriptor');
  return descriptor instanceof PDFDict ? get(descriptor, 'FontFile2') : undefined;
}

export function readFreeTextFont(_pdf: PDFDocument, page: PDFPage, dict: PDFDict): NativeFontSource | undefined {
  const fallback = defaultAppearanceFont(text(get(dict, 'DA')));
  const appearance = annotationAppearance(dict);
  const parsed = appearanceProperties(appearance), actual = parsed.fonts[0];
  const nativeKey = actual?.key ?? fallback?.key, size = actual?.size ?? fallback?.size;
  if (!nativeKey || size === undefined || !Number.isFinite(size) || size < 1 || size > 144) return;
  const font = sourceFreeTextFont(page, dict, nativeKey);
  if (!(font instanceof PDFDict)) return;
  const family = text(get(font, 'BaseFont'));
  if (!family) return;
  let descriptor = get(font, 'FontDescriptor');
  const descendants = get(font, 'DescendantFonts');
  if (descendants instanceof PDFArray) {
    const descendant = descendants.lookup(0);
    if (descendant instanceof PDFDict) descriptor = get(descendant, 'FontDescriptor');
  }
  const embedded = descriptor instanceof PDFDict ? get(descriptor, 'FontFile2') : undefined;
  const hasEmbedded = descriptor instanceof PDFDict && ['FontFile', 'FontFile2', 'FontFile3'].some((key) => has(descriptor, key));
  const encoding = get(font, 'Encoding');
  const plainStandardEncoding = encoding === undefined || encoding === name('WinAnsiEncoding');
  const customMetrics = ['Widths', 'FirstChar', 'LastChar', 'FontDescriptor', 'ToUnicode'].some((key) => has(font, key));
  const isStandard = standardFont(family) && get(font, 'Subtype') === name('Type1')
    && !hasEmbedded && plainStandardEncoding && !customMetrics;
  const fullTrueType = fullTrueTypeFontFile(font) instanceof PDFRawStream && !/^[A-Z]{6}\+/.test(family);
  return {
    family, size,
    color: parsed.color ?? (fallback ? deviceColorRgb(fallback.deviceColor) ?? [0, 0, 0] : [0, 0, 0]),
    nativeKey, standard: isStandard, fullTrueType,
    deviceColor: parsed.deviceColor ?? fallback?.deviceColor ?? { space: 'gray', components: [0] },
    ...(embedded instanceof PDFStream ? { embeddedHash: streamHash(embedded) } : {}),
  };
}
