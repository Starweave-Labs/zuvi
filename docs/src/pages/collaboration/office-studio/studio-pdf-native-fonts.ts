import { PDFDocument } from 'pdf-lib';
import type { PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { PdfNativeHostServices } from './studio-pdf-native/public-types';
import { sha256 } from './studio-pdf-native/runtime';
import { standardFont } from './studio-pdf-native/objects';
import { throwIfAborted } from './studio-pdf-native/host-fonts';

let notoBytes: Promise<Uint8Array> | undefined;

export function abortable<T>(operation: Promise<T>, signal?: AbortSignal): Promise<T> {
  throwIfAborted(signal);
  if (!signal) return operation;
  return new Promise<T>((resolve, reject) => {
    const abort = () => reject(new DOMException('PDF 批注操作已取消。', 'AbortError'));
    signal.addEventListener('abort', abort, { once: true });
    operation.then(
      (result) => { signal.removeEventListener('abort', abort); if (!signal.aborted) resolve(result); },
      (error: unknown) => { signal.removeEventListener('abort', abort); reject(error); },
    );
  });
}

export async function nativeNotoFont(signal?: AbortSignal): Promise<Uint8Array> {
  throwIfAborted(signal);
  if (!notoBytes) {
    notoBytes = fetch(import.meta.env.BASE_URL + 'office-pdf-assets/NotoSansSC.ttf')
      .then(async (response) => {
        if (!response.ok) throw new Error('中文批注字体加载失败，请重试。');
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (!bytes.length) throw new Error('中文批注字体为空。');
        return bytes;
      })
      .catch((error: unknown) => { notoBytes = undefined; throw error; });
  }
  return new Uint8Array(await abortable(notoBytes, signal));
}

export const nativePdfHostServices: Partial<PdfNativeHostServices> = {
  async resolveFont(request, signal) {
    if (request.family !== 'NotoSansSC' && request.family !== 'Noto Sans SC') {
      throw new Error('此批注字体没有可用的完整字体程序，请选择受支持字体。');
    }
    const bytes = await nativeNotoFont(signal);
    return { family: request.family, bytes, hash: sha256(bytes) };
  },
};

/** Legacy text baselines use the actual selected font before accepting a native rectangle. */
export async function legacyPdfFont(
  family: string, services: Partial<PdfNativeHostServices>, signal?: AbortSignal,
): Promise<PDFFont> {
  const pdf = await PDFDocument.create({ updateMetadata: false });
  if (standardFont(family)) return pdf.embedFont(family);
  const resolver = services.resolveFont ?? nativePdfHostServices.resolveFont;
  if (!resolver) throw new Error('批注字体提供器不可用。');
  const result = await abortable(resolver({ family, explicitReplacement: false }, signal), signal);
  if (result.family !== family || result.hash !== sha256(result.bytes)) throw new Error('批注字体与声明不匹配。');
  pdf.registerFontkit(fontkit);
  return pdf.embedFont(result.bytes, { subset: false, customName: family });
}
