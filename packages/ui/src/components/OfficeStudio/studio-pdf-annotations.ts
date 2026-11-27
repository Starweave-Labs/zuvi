import type { PdfNativePreviewDescriptor } from './studio-pdf-annotation-types';
import type {
  PdfWorkspaceCommand,
  PdfWorkspacePreviewBinding,
  PdfWorkspaceSerialized,
  PdfWorkspaceSnapshot,
} from './studio-pdf-annotation-workspace-types';
import type { StudioPdfDocument, StudioPdfSnapshot } from './studio-types';

/** The source-bound operation recipe is persisted; display capabilities are always re-read. */
export type StudioPdfNativeAnnotations = PdfWorkspaceSerialized;

export interface StudioPdfAnnotationInspection {
  state: StudioPdfNativeAnnotations;
  snapshot: PdfWorkspaceSnapshot;
}

export interface StudioPdfAnnotationRequest {
  snapshot: StudioPdfSnapshot;
  command: PdfWorkspaceCommand | { type: 'migrate' };
  /** Prepared page metadata from a single operation; source authority stays in snapshot. */
  next?: StudioPdfDocument;
  /** Captured when the user accepts the command, including any legacy migration. */
  now: string;
  signal?: AbortSignal;
}

export interface StudioPdfAnnotationPreview extends PdfNativePreviewDescriptor {
  binding: PdfWorkspacePreviewBinding;
  /** Actual references in the derived PDF; stable IDs keep selection independent of rewrites. */
  annotations?: readonly { id: string; key?: string; flags?: number }[];
}

/** A host prepares complete candidates and native appearances without changing active storage. */
export interface StudioPdfAnnotationEditor {
  inspect(
    snapshot: StudioPdfSnapshot,
    options?: { signal?: AbortSignal }
  ): Promise<StudioPdfAnnotationInspection>;
  apply(request: StudioPdfAnnotationRequest): Promise<StudioPdfSnapshot>;
  preview(
    snapshot: StudioPdfSnapshot,
    options?: { signal?: AbortSignal }
  ): Promise<StudioPdfAnnotationPreview>;
}
