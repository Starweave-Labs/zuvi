import { PDFDocument, PDFDict, PDFArray, PDFRef, PDFRawStream, PDFFont, PDFPage, StandardFontEmbedder, CustomFontEmbedder } from 'pdf-lib';
import type { AnnotationRecord, FontCacheEntry } from './types';
import { raw, get, has, text, streamBytes, streamHash, required, standardFont, writeText } from './objects';
import { fullTrueTypeFontFile, sourceFreeTextFont } from './font-reader';
import { name } from './constants';
import { sha256 } from './runtime';
import fontkit from '@pdf-lib/fontkit';

const FONT_CACHE = new WeakMap<PDFDocument, Map<string, FontCacheEntry>>();

export { fullTrueTypeFontFile } from './font-reader';

export function reusableFont(pdf: PDFDocument, family: string, bytes?: Uint8Array): { ref: PDFRef; dict: PDFDict } | undefined {
  const hash = bytes && sha256(bytes);
  for (const [ref, dict] of pdf.context.enumerateIndirectObjects()) {
    if (!(dict instanceof PDFDict) || get(dict, 'Type') !== name('Font')) continue;
    if (!bytes) {
      if (get(dict, 'Subtype') === name('Type1') && text(get(dict, 'BaseFont')) === family && get(dict, 'Encoding') === name('WinAnsiEncoding') && !has(dict, 'Widths') && !has(dict, 'ToUnicode') && !has(dict, 'FontDescriptor')) return { ref, dict };
      continue;
    }
    if (text(get(dict, 'ZuviFontHash')) !== hash || text(get(dict, 'ZuviFontFamily')) !== family) continue;
    const file = fullTrueTypeFontFile(dict), cmap = get(dict, 'ToUnicode'), descendants = get(dict, 'DescendantFonts');
    const child = descendants instanceof PDFArray ? descendants.lookup(0) : undefined;
    if (!(file instanceof PDFRawStream) || !(cmap instanceof PDFRawStream) || !(child instanceof PDFDict) || !raw(child, 'W')) continue;
    if (streamHash(file) !== hash || streamHash(cmap) !== text(get(dict, 'ZuviFontCMapHash')) || sha256(required(raw(child, 'W'), 'font widths').toString()) !== text(get(dict, 'ZuviFontWidthHash'))) continue;
    return { ref, dict };
  }
}

export async function finalizeFonts(pdf: PDFDocument): Promise<void> {
  for (const value of FONT_CACHE.get(pdf)?.values() ?? []) {
    if (value.reused) continue;
    await value.font.embed();
    const dict = pdf.context.lookup(value.font.ref);
    if (!(dict instanceof PDFDict) || !value.bytes) continue;
    const file = fullTrueTypeFontFile(dict), cmap = get(dict, 'ToUnicode'), descendants = get(dict, 'DescendantFonts');
    const child = descendants instanceof PDFArray ? descendants.lookup(0) : undefined;
    if (!(file instanceof PDFRawStream) || !(cmap instanceof PDFRawStream) || !(child instanceof PDFDict)) continue;
    writeText(dict, 'ZuviFontHash', sha256(value.bytes));
    writeText(dict, 'ZuviFontFamily', value.family);
    writeText(dict, 'ZuviFontCMapHash', streamHash(cmap));
    writeText(dict, 'ZuviFontWidthHash', sha256(required(raw(child, 'W'), 'font widths').toString()));
  }
}

export async function editableFont(pdf: PDFDocument, annotation: AnnotationRecord, sourceDict: PDFDict | undefined, sourcePage: PDFPage, fonts: ReadonlyMap<string, Uint8Array>): Promise<PDFFont> {
  const family = required(annotation.font, 'annotation font').family;
  let font, bytes, reused = false;
  let cache = FONT_CACHE.get(pdf);
  if (!cache) { cache = new Map(); FONT_CACHE.set(pdf, cache); }
  if (sourceDict && annotation._native?.font?.fullTrueType && family === annotation._native.font.family) {
      const native = sourceFreeTextFont(sourcePage, sourceDict, annotation._native.font.nativeKey);
      let descriptor = native instanceof PDFDict ? get(native, 'FontDescriptor') : undefined;
      const descendants = native instanceof PDFDict ? get(native, 'DescendantFonts') : undefined;
      if (descendants instanceof PDFArray) { const first = descendants.lookup(0); if (first instanceof PDFDict) descriptor = get(first, 'FontDescriptor'); }
      const stream = descriptor instanceof PDFDict ? get(descriptor, 'FontFile2') : undefined;
      bytes = streamBytes(stream);
  } else if (!annotation._native || family !== annotation._native.font?.family) bytes = fonts?.get(family);
  if (!bytes && standardFont(family) && (!annotation._native?.font || annotation._native.font.standard || family !== annotation._native.font.family)) {
    const cached = cache.get(family);
    font = cached?.font; reused = cached?.reused ?? false;
    if (!font) {
      const existing = reusableFont(pdf, family);
      if (existing) { font = PDFFont.of(existing.ref, pdf, StandardFontEmbedder.for(String(family) as Parameters<typeof StandardFontEmbedder.for>[0])); reused = true; }
      else font = await pdf.embedFont(family);
    }
  } else {
    if (!bytes) throw new Error('The selected native font cannot be reconstructed; supply that exact full font or choose an explicit supported font.');
    const cached = cache.get(family + ':' + sha256(bytes));
    font = cached?.font; reused = cached?.reused ?? false;
    if (!font) {
      const existing = reusableFont(pdf, family, bytes);
      if (existing) { font = PDFFont.of(existing.ref, pdf, await CustomFontEmbedder.for(fontkit, bytes, family)); reused = true; }
      else { pdf.registerFontkit(fontkit); font = await pdf.embedFont(bytes, { subset: false, customName: family }); }
    }
  }
  const cacheKey = bytes ? family + ':' + sha256(bytes) : family;
  const coverage = cache.get(cacheKey)?.coverage ?? new Set(font.getCharacterSet());
  cache.set(cacheKey, { font, coverage, bytes, family, reused });
  if ([...annotation.contents].some((character) => !['\r', '\n'].includes(character) && !coverage.has(character.codePointAt(0) ?? -1))) throw new Error('Selected annotation font does not cover all characters.');
  return font;
}
