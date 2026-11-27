import type {
  StudioPdfAnnotationEditor, StudioPdfAnnotationPreview, StudioPdfAnnotationRequest,
} from '../../../../../packages/ui/src/components/OfficeStudio/studio-pdf-annotations';
import type { StudioPdfDocument, StudioPdfSnapshot } from '../../../../../packages/ui/src/components/OfficeStudio/studio-types';
import type { PdfNativeHostServices } from './studio-pdf-native/public-types';
import type { PdfWorkspaceCommand } from './studio-pdf-native/workspace-types';
import { importStudioPdf, exportStudioPdfFields } from './studio-pdf-codec';
import {
  migrateLegacyPdfMarks, nativePdfMarkProjections, nativePdfWorkspace, remapNativePdfFields,
  validateNativePdfProjections, withNativePdfState,
} from './studio-pdf-native-document';
import { NativePdfWorkspace } from './studio-pdf-native/workspace';
import { importNativeMarks } from './studio-pdf-native/read';
import { pdfDate } from './studio-pdf-native/objects';
import { sha256 } from './studio-pdf-native/runtime';
import { throwIfAborted } from './studio-pdf-native/host-fonts';
import { abortable, nativePdfHostServices } from './studio-pdf-native-fonts';

async function sourceForBytes(bytes: Uint8Array, previous: Blob): Promise<Blob> {
  return sha256(bytes) === sha256(new Uint8Array(await previous.arrayBuffer()))
    ? previous : new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
}

function captureCommand(command: PdfWorkspaceCommand, now: string): PdfWorkspaceCommand {
  if (command.type === 'layout' || command.command.type === 'remove') return command;
  return { type: 'mark', command: { ...command.command, now } };
}

/** Current native/field/rotation state is materialized before a new page command. */
async function prepareCurrent(
  snapshot: StudioPdfSnapshot, now: string | undefined, signal: AbortSignal | undefined,
  services: Partial<PdfNativeHostServices>,
): Promise<{ snapshot: StudioPdfSnapshot; workspace: NativePdfWorkspace; previous: StudioPdfDocument }> {
  let workspace = await nativePdfWorkspace(snapshot.document, snapshot.source, signal, services);
  validateNativePdfProjections(snapshot.document, workspace.snapshot());
  let document = snapshot.document;
  if (now && document.marks.some((mark) => mark.nativeId === undefined)) {
    const migrated = await migrateLegacyPdfMarks(document, workspace, now, signal, services);
    workspace = migrated.workspace; document = migrated.document;
  }
  const binding = workspace.previewBinding();
  let source = snapshot.source;
  if (workspace.serialize().commands.length) source = await sourceForBytes(await abortable(workspace.export({ signal }), signal), source);
  const fieldDocument: StudioPdfDocument = {
    ...document, marks: document.marks.filter((mark) => mark.nativeId === undefined),
    pageCount: binding.pageCount, sourcePageCount: binding.sourcePageCount, pages: [...binding.pages],
  };
  source = await abortable(exportStudioPdfFields(fieldDocument, source, workspace.serialize().commands.length
    ? {} : { nativeBindings: workspace.serialize().bindings }), signal);
  throwIfAborted(signal);
  const imported = await importStudioPdf(source, document.name, { pageIds: binding.pages.map((page) => page.id) });
  const current = {
    ...imported, id: document.id,
    marks: nativePdfMarkProjections((await nativePdfWorkspace(imported, source, signal, services)).snapshot(), document.marks),
  };
  workspace = await nativePdfWorkspace(current, source, signal, services);
  return { snapshot: { document: current, source }, workspace, previous: document };
}

export function createStudioPdfAnnotationEditor(
  services: Partial<PdfNativeHostServices> = nativePdfHostServices,
): StudioPdfAnnotationEditor {
  return {
    async inspect(snapshot, options = {}) {
      const workspace = await nativePdfWorkspace(snapshot.document, snapshot.source, options.signal, services);
      validateNativePdfProjections(snapshot.document, workspace.snapshot());
      throwIfAborted(options.signal);
      return { state: workspace.serialize(), snapshot: workspace.snapshot() };
    },
    async apply(request: StudioPdfAnnotationRequest): Promise<StudioPdfSnapshot> {
      throwIfAborted(request.signal); pdfDate(request.now);
      const prepared = await prepareCurrent(request.snapshot, request.now, request.signal, services);
      let workspace = prepared.workspace;
      const command = request.command.type === 'migrate' ? undefined : captureCommand(request.command, request.now);
      let fields = prepared.snapshot.document.fields;
      let rotations: StudioPdfDocument['rotations'] = {};
      if (command?.type === 'layout') {
        const remapped = remapNativePdfFields(prepared.snapshot.document, command.targets);
        // next supplies page presentation metadata, never field/source authority.
        fields = remapped.fields;
        const originalPages = request.snapshot.document.pages ?? [];
        const intended = request.next?.rotations ?? {};
        rotations = Object.fromEntries(command.targets.flatMap((target, index) => {
          const from = originalPages.findIndex((page) => page.id === target.fromPageId);
          const previous = from < 0 ? 0 : request.snapshot.document.rotations[String(from)] ?? 0;
          const next = request.next ? intended[String(index)] ?? 0 : previous;
          const delta = ((next - previous) % 360 + 360) % 360;
          return delta ? [[String(index), delta]] : [];
        }));
        workspace = workspace.layout(command.targets);
      } else if (command?.type === 'mark') workspace = workspace.accept(command.command);
      throwIfAborted(request.signal);
      const binding = workspace.previewBinding();
      let source = await sourceForBytes(await abortable(workspace.export({ signal: request.signal }), request.signal), prepared.snapshot.source);
      source = await abortable(exportStudioPdfFields({
        ...prepared.snapshot.document, fields, rotations, marks: [],
        pageCount: binding.pageCount, sourcePageCount: binding.sourcePageCount, pages: [...binding.pages],
      }, source), request.signal);
      throwIfAborted(request.signal);
      const imported = await importStudioPdf(source, prepared.snapshot.document.name, { pageIds: binding.pages.map((page) => page.id) });
      const native = await nativePdfWorkspace(imported, source, request.signal, services);
      const document = withNativePdfState({
        ...imported, id: request.snapshot.document.id,
        marks: nativePdfMarkProjections(native.snapshot(), prepared.previous.marks),
      }, native);
      throwIfAborted(request.signal);
      // The UI accepts this immutable pair once; no storage or active source changes happen here.
      return { document, source };
    },
    async preview(snapshot, options = {}): Promise<StudioPdfAnnotationPreview> {
      const workspace = await nativePdfWorkspace(snapshot.document, snapshot.source, options.signal, services);
      validateNativePdfProjections(snapshot.document, workspace.snapshot());
      const binding = workspace.previewBinding();
      let source = snapshot.source;
      if (workspace.serialize().commands.length) source = await sourceForBytes(await abortable(workspace.export({ signal: options.signal }), options.signal), source);
      source = await abortable(exportStudioPdfFields({
        ...snapshot.document, marks: [], pageCount: binding.pageCount, sourcePageCount: binding.sourcePageCount, pages: [...binding.pages],
      }, source, workspace.serialize().commands.length ? {} : { nativeBindings: workspace.serialize().bindings }), options.signal);
      const current = await importNativeMarks(new Uint8Array(await source.arrayBuffer()));
      throwIfAborted(options.signal);
      const visible = current.annotations.filter((annotation) => !(annotation._native.flags & (1 | 2 | 32)));
      return {
        source, revision: sha256(new Uint8Array(await source.arrayBuffer())), rendersCurrentPageOrder: true,
        // Object references can change during journal replay and field preparation.
        // Paint-layer identity comes from the final preview bytes, not the source snapshot.
        annotations: current.annotations.map((annotation) => ({
          id: annotation.id, key: annotation._native.key, flags: annotation._native.flags,
        })),
        nativeBodyIds: visible.filter((annotation) => annotation._native.hasAppearance).map((annotation) => annotation.id),
        noApIconIds: visible.filter((annotation) => annotation.kind === 'note' && !annotation._native.hasAppearance).map((annotation) => annotation.id),
        requiresAnnotationLayer: visible.some((annotation) => annotation.kind === 'note' || !!(annotation._native.flags & (8 | 16))),
        binding,
      };
    },
  };
}

export const studioPdfAnnotationEditor = createStudioPdfAnnotationEditor();
