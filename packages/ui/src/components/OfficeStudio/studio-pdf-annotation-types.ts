/** Serializable native PDF annotation data; PDF parsing and fonts remain host services. */
export type PdfPoint = readonly [number, number];
export type PdfRect = readonly [number, number, number, number];
export type PdfRgb = readonly [number, number, number];
export type PdfInsets = readonly [number, number, number, number];
export type PdfLineEnding =
  | 'None'
  | 'Square'
  | 'Circle'
  | 'Diamond'
  | 'OpenArrow'
  | 'ClosedArrow'
  | 'Butt'
  | 'ROpenArrow'
  | 'RClosedArrow'
  | 'Slash';
export type PdfEditableAnnotationKind =
  | 'freeText'
  | 'note'
  | 'highlight'
  | 'underline'
  | 'strikeOut'
  | 'squiggly'
  | 'square'
  | 'circle'
  | 'line'
  | 'polygon'
  | 'polyLine'
  | 'ink';
export type PdfAnnotationKind = PdfEditableAnnotationKind | 'opaque';
export type PdfReviewState =
  | { model: 'Marked'; state: 'Marked' | 'Unmarked' }
  | { model: 'Review'; state: 'Accepted' | 'Rejected' | 'Cancelled' | 'Completed' | 'None' };
export type PdfDeviceColor =
  | { space: 'none'; components: readonly [] }
  | { space: 'gray'; components: readonly [number] }
  | { space: 'rgb'; components: PdfRgb }
  | { space: 'cmyk'; components: readonly [number, number, number, number] };

export interface PdfAnnotationCapabilities {
  move: boolean;
  resize: boolean;
  reshape: boolean;
  contents: boolean;
  appearance: boolean;
  remove: boolean;
  reply: boolean;
  reasons?: readonly string[];
}
export interface PdfNativeAnnotationSource {
  key: string;
  subtype: string;
  flags: number;
  baselineHash: string;
  nativeName?: string;
  hasAppearance: boolean;
  appearanceHash?: string;
  fontHash?: string;
  /** Display RGB is independent; unchanged native device components are retained. */
  sourceColors?: { stroke?: PdfDeviceColor; fill?: PdfDeviceColor; text?: PdfDeviceColor };
}
export interface PdfAnnotationIdentity {
  id: string;
  originId?: string;
  pageId: string;
  contents: string;
  author: string;
  createdAt?: string;
  modifiedAt?: string;
  creationPdf?: string;
  modificationPdf?: string;
  inReplyTo?: string;
  replyType?: string;
  popupId?: string;
  popupOf?: string;
  native?: PdfNativeAnnotationSource;
  capabilities: PdfAnnotationCapabilities;
}
export interface PdfAnnotationBase extends PdfAnnotationIdentity {
  rect: PdfRect;
}
export interface PdfStroke {
  width: number;
  style: 'S' | 'D';
  dash?: readonly number[];
  lineCap: 0 | 1 | 2;
  lineJoin: 0 | 1 | 2;
  miterLimit: number;
}
export interface PdfPaint {
  color: PdfRgb | null;
  fill: PdfRgb | null;
  opacity: number;
  stroke: PdfStroke;
}
export interface PdfFreeTextFont {
  family: string;
  size: number;
  color: PdfRgb;
  sourceFontKey?: string;
}
export interface PdfFreeTextAnnotation extends PdfAnnotationBase, PdfPaint {
  kind: 'freeText';
  font: PdfFreeTextFont;
  align: 0 | 1 | 2;
  rectDifferences: PdfInsets;
  textPadding?: PdfInsets;
  lineHeight: number;
}
export interface PdfTextAnnotation extends PdfAnnotationBase, PdfPaint {
  kind: 'note';
  iconName: string;
  review?: PdfReviewState;
}
export interface PdfMarkerAnnotation extends PdfAnnotationBase, PdfPaint {
  kind: 'highlight' | 'underline' | 'strikeOut' | 'squiggly';
  quadPoints: readonly number[];
}
export interface PdfBoxAnnotation extends PdfAnnotationBase, PdfPaint {
  kind: 'square' | 'circle';
  rectDifferences: PdfInsets;
}
export interface PdfLineAnnotation extends PdfAnnotationBase, PdfPaint {
  kind: 'line';
  line: PdfRect;
  lineEnds: readonly [PdfLineEnding, PdfLineEnding];
}
export interface PdfPolygonAnnotation extends PdfAnnotationBase, PdfPaint {
  kind: 'polygon';
  vertices: readonly number[];
}
export interface PdfPolyLineAnnotation extends PdfAnnotationBase, PdfPaint {
  kind: 'polyLine';
  vertices: readonly number[];
  lineEnds: readonly [PdfLineEnding, PdfLineEnding];
}
export interface PdfInkAnnotation extends PdfAnnotationBase, PdfPaint {
  kind: 'ink';
  inkList: readonly (readonly number[])[];
}
/** Malformed/passive native geometry remains lossless without inventing a usable editor rectangle. */
export interface PdfOpaqueAnnotation extends PdfAnnotationIdentity {
  kind: 'opaque';
  rect?: PdfRect;
  nativeRect: readonly number[];
  passiveReason: string;
}
export type PdfAnnotation =
  | PdfFreeTextAnnotation
  | PdfTextAnnotation
  | PdfMarkerAnnotation
  | PdfBoxAnnotation
  | PdfLineAnnotation
  | PdfPolygonAnnotation
  | PdfPolyLineAnnotation
  | PdfInkAnnotation
  | PdfOpaqueAnnotation;

export type PdfStrokePatch = Partial<Omit<PdfStroke, 'dash'>> & { dash?: readonly number[] | null };
interface PdfPaintPatch {
  color?: PdfRgb | null;
  fill?: PdfRgb | null;
  opacity?: number;
  stroke?: PdfStrokePatch;
}
interface PdfCommonPatch extends PdfPaintPatch {
  rect?: PdfRect;
  contents?: string;
}
export type PdfAnnotationPatch =
  | (PdfCommonPatch & {
      kind: 'freeText';
      font?: Partial<PdfFreeTextFont>;
      align?: 0 | 1 | 2;
      rectDifferences?: PdfInsets;
      textPadding?: PdfInsets;
      lineHeight?: number;
    })
  | (PdfCommonPatch & { kind: 'note' })
  | (PdfCommonPatch & {
      kind: 'highlight' | 'underline' | 'strikeOut' | 'squiggly';
      quadPoints?: readonly number[];
    })
  | (PdfCommonPatch & { kind: 'square' | 'circle'; rectDifferences?: PdfInsets })
  | (PdfCommonPatch & {
      kind: 'line';
      line?: PdfRect;
      lineEnds?: readonly [PdfLineEnding, PdfLineEnding];
    })
  | (PdfCommonPatch & { kind: 'polygon'; vertices?: readonly number[] })
  | (PdfCommonPatch & {
      kind: 'polyLine';
      vertices?: readonly number[];
      lineEnds?: readonly [PdfLineEnding, PdfLineEnding];
    })
  | (PdfCommonPatch & { kind: 'ink'; inkList?: readonly (readonly number[])[] });

interface PdfNewCommon extends PdfPaintPatch {
  id?: string;
  pageId: string;
  rect: PdfRect;
  contents?: string;
  author?: string;
}
export type PdfNewAnnotation =
  | (PdfNewCommon & {
      kind: 'freeText';
      font: Omit<PdfFreeTextFont, 'sourceFontKey'>;
      align?: 0 | 1 | 2;
      rectDifferences?: PdfInsets;
      textPadding?: PdfInsets;
      lineHeight?: number;
    })
  | (PdfNewCommon & { kind: 'note' })
  | (PdfNewCommon & {
      kind: 'highlight' | 'underline' | 'strikeOut' | 'squiggly';
      quadPoints: readonly number[];
    })
  | (PdfNewCommon & { kind: 'square' | 'circle'; rectDifferences?: PdfInsets })
  | (PdfNewCommon & {
      kind: 'line';
      line: PdfRect;
      lineEnds?: readonly [PdfLineEnding, PdfLineEnding];
    })
  | (PdfNewCommon & { kind: 'polygon'; vertices: readonly number[] })
  | (PdfNewCommon & {
      kind: 'polyLine';
      vertices: readonly number[];
      lineEnds?: readonly [PdfLineEnding, PdfLineEnding];
    })
  | (PdfNewCommon & { kind: 'ink'; inkList: readonly (readonly number[])[] });

export interface PdfReply {
  id?: string;
  contents: string;
  author: string;
  pageId?: string;
}
export interface PdfPageLayoutDescriptor {
  id: string;
  sourcePage?: number;
  copyGroup?: string;
  size?: { width: number; height: number };
}
export interface PdfNativePage {
  id: string;
  sourcePage?: number;
  originId?: string;
  copyGroup?: string;
  media: { x: number; y: number; width: number; height: number };
  crop: { x: number; y: number; width: number; height: number };
  rotation: number;
  userUnit: number;
}
export interface PdfNativeAnnotationDocument {
  version: 1;
  sourceHash: string;
  signed: boolean;
  pages: readonly PdfNativePage[];
  annotations: readonly PdfAnnotation[];
  deleted: readonly string[];
  removedLinks: readonly { id: string; sourceId: string; reason: string }[];
  removedPopups: readonly { id: string; sourceId: string; page: number; reason: string }[];
}
export interface PdfNativeHostServices {
  hashBytes(bytes: Uint8Array): Promise<string>;
  nowIso(): string;
  createId(): string;
  resolveFont(
    request: {
      family: string;
      sourceFontKey?: string;
      sourceFontHash?: string;
      explicitReplacement: boolean;
    },
    signal?: AbortSignal
  ): Promise<{ family: string; bytes: Uint8Array; hash: string }>;
}
export interface PdfNativeExportOptions {
  fonts?: ReadonlyMap<string, Uint8Array>;
  signal?: AbortSignal;
}
export interface PdfNativePreviewDescriptor {
  source: Blob;
  revision: string;
  rendersCurrentPageOrder: true;
  nativeBodyIds: readonly string[];
  requiresAnnotationLayer: boolean;
  noApIconIds: readonly string[];
}
/** Serializable operations capture time and identity at acceptance, never during export. */
export type PdfNativeAnnotationCommand =
  | { type: 'create'; annotation: PdfNewAnnotation & { id: string }; now: string }
  | { type: 'update'; id: string; patch: PdfAnnotationPatch; now: string }
  | { type: 'reply'; parentId: string; reply: PdfReply & { id: string }; now: string }
  | {
      type: 'review';
      parentId: string;
      status: 'resolved' | 'open';
      author: string;
      id: string;
      now: string;
    }
  | { type: 'remove'; id: string }
  | { type: 'map'; pages: readonly PdfPageLayoutDescriptor[] };
