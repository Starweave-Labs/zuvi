import { PDFDict, PDFDocument, PDFHexString } from 'pdf-lib';
import type { SourceDocument } from './types';
import type { PdfWorkspaceSourceBinding } from './workspace-types';
import { importNativeMarks } from './read';
import { validateWorkspaceBindings } from './workspace-model';
import { load, required } from './objects';
import { APPLICATION_ID, name, PAGE_ID } from './constants';
import { sourceIdentity } from './runtime';

/** Used only for actual edited/composed output. An unchanged workspace returns original bytes directly. */
export async function bindWorkspaceSourceIdentities(
  bytes: Uint8Array, bindings: readonly PdfWorkspaceSourceBinding[],
): Promise<Uint8Array> {
  const source = await importNativeMarks(bytes);
  validateWorkspaceBindings(source, bindings);
  if (source.signed) throw new Error('Signed PDF cannot change native workspace identities.');
  const pdf = await load(bytes);
  bindWorkspacePdfIdentities(pdf, source, bindings);
  return new Uint8Array(await pdf.save({ updateFieldAppearances: false, useObjectStreams: false }));
}

/** A host may stamp inside its already-loaded, verified source before a real field-only rewrite. */
export function bindWorkspacePdfIdentities(
  pdf: PDFDocument, source: SourceDocument, bindings: readonly PdfWorkspaceSourceBinding[],
): void {
  validateWorkspaceBindings(source, bindings);
  if (source.signed) throw new Error('Signed PDF cannot change native workspace identities.');
  for (const [index, page] of pdf.getPages().entries()) {
    page.node.set(PAGE_ID, PDFHexString.fromText(bindings[index].uiPageId));
    for (const [ordinal, reference] of (page.node.Annots()?.asArray() ?? []).entries()) {
      const dictionary = pdf.context.lookup(reference), annotation = source.annotations.find((entry) => entry.page === index && entry._native.ordinal === ordinal);
      if (!(dictionary instanceof PDFDict)) throw new Error('Malformed source annotation during identity binding.');
      dictionary.set(APPLICATION_ID, PDFHexString.fromText(required(annotation, 'source annotation identity').id));
    }
  }
}

/** Scoped incoming IDs avoid collision with current/copy instances while IRT/Popup/P remain real refs. */
export async function scopeIncomingAnnotationIdentities(bytes: Uint8Array, operationId: string): Promise<Uint8Array> {
  if (typeof operationId !== 'string' || !operationId) throw new Error('Composition scope needs a captured identity.');
  const source = await importNativeMarks(bytes);
  if (source.signed) throw new Error('Signed incoming PDF cannot be composed.');
  const pdf = await load(bytes), scope = source.sourceHash + ':' + operationId;
  for (const [index, page] of pdf.getPages().entries()) {
    page.node.set(PAGE_ID, PDFHexString.fromText(sourceIdentity('page-incoming', scope + ':' + source.pages[index].id)));
    for (const [ordinal, reference] of (page.node.Annots()?.asArray() ?? []).entries()) {
      const dictionary = pdf.context.lookup(reference);
      if (!(dictionary instanceof PDFDict)) throw new Error('Malformed incoming annotation.');
      const annotation = required(source.annotations.find((entry) => entry.page === index && entry._native.ordinal === ordinal), 'incoming annotation identity');
      dictionary.set(APPLICATION_ID, PDFHexString.fromText(sourceIdentity('annotation-incoming', scope + ':' + annotation.id)));
      dictionary.set(name('ZuviAnnotationOriginId'), PDFHexString.fromText(annotation.originId ?? annotation.id));
    }
  }
  return new Uint8Array(await pdf.save({ updateFieldAppearances: false, useObjectStreams: false }));
}
