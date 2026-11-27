import { PDFHexString } from 'pdf-lib';
import { composePdf } from '../studio-pdf-compose';
import type {
  StudioPdfComposeOptions, StudioPdfComposePageSelection, StudioPdfComposeResult,
} from '../studio-pdf-compose-types';
import { importNativeMarks } from './read';
import { load, required } from './objects';
import { PAGE_ID } from './constants';
import { workspaceBindings } from './workspace-model';
import { bindWorkspaceSourceIdentities, scopeIncomingAnnotationIdentities } from './workspace-identities';
import { sha256 } from './runtime';

export interface NativeCompositionSource { id: string; bytes: Uint8Array; incomingScope?: string }

/** The real host copier owns cross-page IRT/Popup/field references; this adapter only binds stable identities. */
export async function composeNativeAnnotationSources(
  sources: readonly NativeCompositionSource[],
  pages: readonly StudioPdfComposePageSelection[],
  options: StudioPdfComposeOptions = {},
): Promise<StudioPdfComposeResult> {
  const identities = new Set<string>(), selected = new Set<string>();
  const prepared: { id: string; bytes: Uint8Array }[] = [];
  for (const page of pages) {
    const key = page.sourceId + ':' + page.sourcePage;
    if (selected.has(key)) throw new Error('Expand duplicate page selections into current workspace instances before composing native annotations.');
    selected.add(key);
  }
  for (const input of sources) {
    const original = await importNativeMarks(input.bytes);
    const bytes = input.incomingScope
      ? await scopeIncomingAnnotationIdentities(input.bytes, input.incomingScope)
      : await bindWorkspaceSourceIdentities(input.bytes, workspaceBindings(original, original.pages.map((page) => page.id)));
    const model = await importNativeMarks(bytes);
    for (const annotation of model.annotations) {
      if (identities.has(annotation.id)) throw new Error('Incoming native annotation identity collides; provide a captured incoming scope.');
      identities.add(annotation.id);
    }
    prepared.push({ id: input.id, bytes });
  }
  const result = await composePdf({ ...options, sources: prepared, pages });
  const target = await load(new Uint8Array(result.bytes));
  for (const [index, page] of target.getPages().entries()) {
    page.node.set(PAGE_ID, PDFHexString.fromText(required(result.report.pages[index]?.instanceId, 'composed page identity')));
  }
  const bytes = new Uint8Array(await target.save({ updateFieldAppearances: false, useObjectStreams: false }));
  await importNativeMarks(bytes);
  return { ...result, bytes, sourceHash: sha256(bytes) };
}
