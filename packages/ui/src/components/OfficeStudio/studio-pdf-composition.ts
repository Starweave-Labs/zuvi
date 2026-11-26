import type { StudioPdfComposeResult, StudioPdfSnapshot } from './studio-types';
import { isOfficeStudioDocument } from './studio-model';

/** Page ranges preserve user order; duplicate pages require an explicit page-copy action. */
export function pdfCompositionPages(value: string, pageCount: number): number[] {
  if (!Number.isInteger(pageCount) || pageCount < 1 || pageCount > 200)
    throw new Error('PDF 页数须为 1 至 200。');
  const tokens = value.trim().split(/[,，]/);
  if (!value.trim() || tokens.some((token) => !token.trim()))
    throw new Error('请填写页码，例如 1,3-5。');
  const pages: number[] = [];
  for (const token of tokens) {
    const match = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(token.trim());
    if (!match) throw new Error('页码格式无效，请使用 1,3-5 这样的格式。');
    const first = Number(match[1]), last = Number(match[2] ?? match[1]);
    if (first < 1 || last < first || last > pageCount)
      throw new Error(`页码须在 1 至 ${pageCount} 之间，范围须从小到大。`);
    for (let page = first; page <= last; page++) {
      if (pages.includes(page - 1)) throw new Error('页码不能重复。');
      pages.push(page - 1);
    }
  }
  return pages;
}

export function pdfCompositionSnapshotValid(
  result: StudioPdfComposeResult,
  previous: StudioPdfSnapshot
): boolean {
  return (
    !!result &&
    isOfficeStudioDocument(result.document) &&
    result.document.kind === 'pdf' &&
    result.document.id === previous.document.id &&
    result.source instanceof Blob &&
    result.source.size > 0 &&
    result.source.size <= 50 * 1024 * 1024 &&
    result.document.sourcePageCount === result.document.pageCount &&
    result.document.pages?.length === result.document.pageCount &&
    result.document.pages.every((page, index) => page.sourcePage === index) &&
    (result.warnings === undefined ||
      (Array.isArray(result.warnings) && result.warnings.every((warning) => typeof warning === 'string')))
  );
}
