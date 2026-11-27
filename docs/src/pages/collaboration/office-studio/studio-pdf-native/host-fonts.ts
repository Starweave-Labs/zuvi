import type { NativeDocument, ExportOptions } from './types';
import type { PdfNativeExportOptions, PdfNativeHostServices } from './public-types';
import { standardFont } from './objects';
import { sha256 } from './runtime';

export function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) throw new DOMException('Native annotation operation was cancelled.', 'AbortError');
}

/** Source full-font bytes remain the authority; a same-family provider never replaces them. */
export async function nativeExportOptions(
  model: NativeDocument,
  services: Partial<PdfNativeHostServices>,
  options: PdfNativeExportOptions = {},
): Promise<ExportOptions> {
  throwIfAborted(options.signal);
  const fonts = new Map<string, Uint8Array>();
  for (const [family, bytes] of options.fonts ?? []) fonts.set(family, new Uint8Array(bytes));
  for (const annotation of model.annotations) {
    if (annotation.kind !== 'freeText' || !annotation.font) continue;
    const family = annotation.font.family, native = annotation._native?.font;
    const sourceFamily = native?.family === family;
    if (sourceFamily || standardFont(family) || fonts.has(family) || !services.resolveFont) continue;
    const request = {
      family,
      ...(native ? { sourceFontKey: native.nativeKey } : {}),
      ...(native?.embeddedHash === undefined ? {} : { sourceFontHash: native.embeddedHash }),
      explicitReplacement: native !== undefined && native.family !== family,
    };
    const resolved = await services.resolveFont(request, options.signal);
    throwIfAborted(options.signal);
    if (resolved.family !== family || !(resolved.bytes instanceof Uint8Array) || resolved.bytes.length === 0
      || resolved.hash !== sha256(resolved.bytes)) throw new Error('Font provider returned mismatched family, bytes or hash.');
    if (services.hashBytes && await services.hashBytes(resolved.bytes) !== resolved.hash) {
      throw new Error('Font provider and host hash disagree.');
    }
    throwIfAborted(options.signal);
    fonts.set(family, new Uint8Array(resolved.bytes));
  }
  return { fonts };
}
