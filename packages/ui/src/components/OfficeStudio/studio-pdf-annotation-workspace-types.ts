import type {
  PdfNativeAnnotationCommand,
  PdfNativeAnnotationDocument,
  PdfPageLayoutDescriptor,
} from './studio-pdf-annotation-types';

export interface PdfWorkspaceSourceBinding {
  sourcePage: number;
  nativePageId: string;
  uiPageId: string;
}
export interface PdfWorkspacePage extends PdfPageLayoutDescriptor {
  originPageId?: string;
  bounds?: { left: number; bottom: number; right: number; top: number };
}
/** fromPageId names the current instance, including an edited copy or a blank page. */
export interface PdfWorkspaceLayoutTarget {
  id: string;
  fromPageId?: string;
  copyGroup?: string;
  size?: { width: number; height: number };
}
export type PdfWorkspaceMarkCommand = Exclude<PdfNativeAnnotationCommand, { type: 'map' }>;
export type PdfWorkspaceCommand =
  | { type: 'mark'; command: PdfWorkspaceMarkCommand }
  | { type: 'layout'; targets: readonly PdfWorkspaceLayoutTarget[] };
/** Serializable source-bound history. No snapshot permission/provenance is accepted as input. */
export interface PdfWorkspaceSerialized {
  version: 1;
  sourceHash: string;
  bindings: readonly PdfWorkspaceSourceBinding[];
  commands: readonly PdfWorkspaceCommand[];
}
export interface PdfWorkspaceEffects {
  removedReplies: readonly string[];
  removedLinks: readonly { id: string; sourceId: string; reason: string }[];
  removedPopups: readonly { id: string; sourceId: string; page: number; reason: string }[];
}
export interface PdfWorkspaceSnapshot extends PdfNativeAnnotationDocument {
  canvasPages: readonly PdfWorkspacePage[];
  effects: PdfWorkspaceEffects;
}
export interface PdfWorkspacePreviewBinding {
  rendersCurrentPageOrder: true;
  pageCount: number;
  sourcePageCount: number;
  /** Preview bytes already contain current layout; original sourcePage/copyGroup are not reapplied. */
  pages: readonly { id: string; sourcePage: number }[];
  rotations: Readonly<Record<string, number>>;
}
