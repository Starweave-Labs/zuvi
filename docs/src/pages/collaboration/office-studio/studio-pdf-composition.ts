import type { StudioPdfComposer, StudioPdfComposeRequest, StudioPdfComposeResult } from '@zuvi/react';
import { pdfPages } from '../../../../../packages/ui/src/components/OfficeStudio/studio-pdf-pages';
import { exportStudioPdf, importStudioPdf } from './studio-pdf-codec';
import { composePdf, PdfComposeError, type StudioPdfComposeReport } from './studio-pdf-compose';

function abort(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('PDF 页面组合已取消。', 'AbortError');
}

function selectedPages(pages: number[], count: number) {
  if (!Array.isArray(pages) || !pages.length || pages.length > 200 || new Set(pages).size !== pages.length ||
    pages.some((page) => !Number.isInteger(page) || page < 0 || page >= count))
    throw new Error('请选择有效且不重复的 PDF 页码。');
}

export async function inspectStudioPdfComposition(source: Blob, options?: { signal?: AbortSignal }) {
  abort(options?.signal);
  const document = await importStudioPdf(source, '加入.pdf');
  abort(options?.signal);
  return { pageCount: document.pageCount };
}

function compositionError(cause: unknown, request: StudioPdfComposeRequest): Error {
  if (!(cause instanceof PdfComposeError)) return cause instanceof Error ? cause : new Error('PDF 页面组合失败。');
  const file = cause.source === 'incoming' ? request.incoming?.name : request.snapshot.document.name;
  let detail = '此文件的字段、资源或链接无法完整保留。';
  if (cause.code.startsWith('LINK')) detail = '同名字段的类型、属性或填写值不兼容，请改用自动改名，或先统一字段值。';
  else if (cause.code.includes('RADIO') && cause.code.includes('VALUE')) detail = '所选页面不包含当前或默认的单选值。请包含对应控件，或选择清除失去控件的单选值。';
  else if (cause.code.includes('SIGN') || cause.code.includes('XFA')) detail = '此文件含有签名或动态表单，无法保留现有状态完成页面组合。';
  else if (cause.code.includes('OPAQUE_FIELD_RENAME') || cause.code.includes('OPAQUE_RENAME_METADATA')) detail = '同名原生字段包含无法安全改名的属性，请先在原文件中更名。';
  else if (cause.code.includes('ACTION') || cause.code.includes('URI') || cause.code.includes('RELATIVE')) detail = '此文件包含无法在合并后保持的链接或动作。';
  return new Error(`${file ? `${file}：` : ''}${detail}（${cause.code}，${cause.path}）`);
}

function warnings(report: StudioPdfComposeReport): string[] {
  const result: string[] = [];
  const renamed = report.fields.filter((field) => field.sourceName !== field.targetName);
  if (renamed.length) result.push(`${renamed.length} 个同名字段已自动改名：${renamed.slice(0, 4).map((field) => `${field.sourceName} → ${field.targetName}`).join('、')}${renamed.length > 4 ? '…' : ''}`);
  if (report.prunedNavigation.length) result.push(`已移除 ${report.prunedNavigation.length} 处指向未选内容的导航目标`);
  if (report.valueResolutions.length) result.push(`已按所选策略处理 ${report.valueResolutions.length} 处字段值`);
  if (report.warnings.length) result.push('合并后的文档属性采用当前 PDF 的设置');
  return result;
}

/** Rebase native fields and page edits, retaining editable marks in the model exactly once. */
export async function composeStudioPdf(request: StudioPdfComposeRequest): Promise<StudioPdfComposeResult & { report: StudioPdfComposeReport; sourceHash: string }> {
  abort(request.signal);
  const { document, source } = request.snapshot;
  const current = pdfPages(document);
  selectedPages(request.pages, document.pageCount);
  if (request.mode !== 'merge' && request.mode !== 'extract') throw new Error('PDF 页面组合类型无效。');
  const outputName = request.name?.trim() || document.name;
  if (!outputName || outputName.length > 200 || /[\r\n]/.test(outputName)) throw new Error('PDF 文档名称无效。');
  // Native fields, rotations, dimensions and virtual page mapping become the new base.
  // Pending marks stay editable; burning them in here would draw them twice on later exports.
  const prepared = await exportStudioPdf({ ...document, marks: [] }, source);
  abort(request.signal);
  const sources = [{ id: 'current', bytes: prepared }];
  const pages = request.pages.map((page) => ({ sourceId: 'current', sourcePage: page, instanceId: current[page].id }));
  if (request.mode === 'merge') {
    if (!request.incoming || !Number.isInteger(request.insertAt) || request.insertAt! < 0 || request.insertAt! > current.length ||
      request.pages.length !== current.length || request.pages.some((page, index) => page !== index))
      throw new Error('合并时请保留全部当前页面并选择有效的插入位置。');
    const incoming = await inspectStudioPdfComposition(request.incoming.source, { signal: request.signal });
    selectedPages(request.incoming.pages, incoming.pageCount);
    if (pages.length + request.incoming.pages.length > 200) throw new Error('合并后的 PDF 最多支持 200 页。');
    sources.push({ id: 'incoming', bytes: request.incoming.source });
    pages.splice(request.insertAt!, 0, ...request.incoming.pages.map((page) => ({ sourceId: 'incoming', sourcePage: page, instanceId: crypto.randomUUID() })));
  } else if (request.incoming !== undefined || request.insertAt !== undefined) throw new Error('提取页面不接受加入文件或插入位置。');
  let result;
  try {
    result = await composePdf({ sources, pages, conflicts: request.conflicts, catalogPolicy: 'primary', orphanRadioValue: request.orphanRadioValue });
  } catch (cause) {
    throw compositionError(cause, request);
  }
  abort(request.signal);
  const output = new Blob([new Uint8Array(result.bytes)], { type: 'application/pdf' });
  const imported = await importStudioPdf(output, outputName);
  abort(request.signal);
  const mapped = new Map(pages.flatMap((page, index) => page.sourceId === 'current' ? [[page.sourcePage, index] as const] : []));
  return {
    document: {
      ...imported,
      id: document.id,
      pages: imported.pages!.map((page, index) => ({ ...page, id: pages[index].instanceId })),
      marks: document.marks.flatMap((mark) => {
        const page = mapped.get(mark.page);
        return page === undefined ? [] : [{ ...mark, page }];
      }),
    },
    source: output,
    warnings: warnings(result.report),
    report: result.report,
    sourceHash: result.sourceHash,
  };
}

export const studioPdfComposer: StudioPdfComposer = {
  inspect: inspectStudioPdfComposition,
  compose: composeStudioPdf,
};
