import type { PDFFont } from 'pdf-lib';

export type AnnotationKind =
  | 'freeText' | 'note' | 'highlight' | 'underline' | 'strikeOut' | 'squiggly'
  | 'square' | 'circle' | 'line' | 'polygon' | 'polyLine' | 'ink' | 'opaque';
export type LineEnding =
  | 'None' | 'Square' | 'Circle' | 'Diamond' | 'OpenArrow' | 'ClosedArrow'
  | 'Butt' | 'ROpenArrow' | 'RClosedArrow' | 'Slash';
export type ReviewState =
  | { model: 'Marked'; state: 'Marked' | 'Unmarked' }
  | { model: 'Review'; state: 'Accepted' | 'Rejected' | 'Cancelled' | 'Completed' | 'None' };
export interface NativeDeviceColor {
  space: 'none' | 'gray' | 'rgb' | 'cmyk';
  components: number[];
}
export interface Capabilities {
  geometry: boolean;
  resize: boolean;
  contents: boolean;
  appearance: boolean;
  remove: boolean;
  reply: boolean;
}
export interface AnnotationFont {
  family: string;
  size: number;
  color: number[];
}
export interface NativeFontSource extends AnnotationFont {
  nativeKey: string;
  standard: boolean;
  fullTrueType: boolean;
  embeddedHash?: string;
  deviceColor?: NativeDeviceColor;
}
export interface NativeDestination {
  kind: 'goTo' | 'unresolved-goTo';
  targetPageId?: string;
  nativeName?: string;
}
export interface NativeSource {
  key: string;
  sourcePage: number;
  ordinal: number;
  subtype: string;
  name?: string;
  flags: number;
  hash: string;
  appearanceHash?: string;
  hasAppearance: boolean;
  iconName?: string;
  font?: NativeFontSource;
  destination?: NativeDestination;
  appearanceRestrictions: string[];
  textLayout?: { firstPosition?: number[]; lineHeight?: number };
  colors?: { stroke?: NativeDeviceColor; fill?: NativeDeviceColor };
}
export interface Stroke {
  width: number;
  style: string;
  dash?: number[];
}
/** Internal runtime structure; public discriminated model is adapted in public-model.ts. */
export interface UnknownReview { model?: string; state?: string }
export interface AnnotationRecord {
  id: string;
  originId?: string;
  pageId: string;
  page: number;
  kind: AnnotationKind;
  rect: number[];
  contents: string;
  author: string;
  createdAt?: string;
  modifiedAt?: string;
  creationPdf?: string;
  modificationPdf?: string;
  opacity: number;
  color: number[] | null;
  fill: number[] | null;
  border: Stroke;
  lineCap: 0 | 1 | 2;
  lineJoin: 0 | 1 | 2;
  miterLimit: number;
  font?: AnnotationFont;
  align?: number;
  rectDifferences?: number[];
  padding?: number[];
  lineHeight?: number;
  quadPoints?: number[];
  inkList?: number[][];
  line?: number[];
  lineEnds?: LineEnding[];
  vertices?: number[];
  review?: UnknownReview;
  inReplyTo?: string;
  replyType?: string;
  popupId?: string;
  popupOf?: string;
  flags?: number;
  _native?: NativeSource;
  _mapping?: { sourceId: string; scope: string; isCopy: boolean };
  _replyRef?: string;
  _popupRef?: string;
  _popupOwnerRef?: string;
  capabilities: Capabilities;
  passiveReasons?: string[];
}
export interface PageBox { x: number; y: number; width: number; height: number }
export interface NativePage {
  id: string;
  sourcePage?: number;
  ref?: string;
  media: PageBox;
  crop: PageBox;
  rotation: number;
  userUnit: number;
  size?: { width: number; height: number };
  copyGroup?: string;
  originId?: string;
}
export interface Dependency {
  kind: string;
  ownerId?: string;
  page?: number;
  targetId: string;
}
export interface NativeDocument {
  version: 1;
  sourceHash: string;
  signed: boolean;
  pages: NativePage[];
  annotations: AnnotationRecord[];
  deleted: string[];
  dependencies: Dependency[];
}
export interface SourceAnnotation extends AnnotationRecord { _native: NativeSource }
export interface SourceDocument extends NativeDocument { annotations: SourceAnnotation[] }
export interface MappedAnnotation extends AnnotationRecord {
  _mapping: { sourceId: string; scope: string; isCopy: boolean };
}
export interface EditOptions { now?: string; clock?: () => string }
export interface ReviewOptions extends EditOptions { id?: string; author?: string }
export type AnnotationPatch = Partial<Pick<AnnotationRecord,
  | 'rect' | 'contents' | 'color' | 'fill' | 'opacity' | 'border' | 'font' | 'align'
  | 'padding' | 'rectDifferences' | 'lineHeight' | 'quadPoints' | 'inkList' | 'lineCap'
  | 'lineJoin' | 'miterLimit' | 'line' | 'vertices' | 'lineEnds'>>;
export type NewAnnotation = Pick<AnnotationRecord, 'id' | 'kind' | 'pageId' | 'rect'>
  & Partial<Omit<AnnotationRecord, 'id' | 'kind' | 'pageId' | 'rect' | '_native' | 'capabilities'>>;
export interface NewReply {
  id: string;
  contents?: string;
  author?: string;
  pageId?: string;
  review?: ReviewState;
}
export interface FontCacheEntry {
  font: PDFFont;
  coverage: Set<number>;
  bytes?: Uint8Array;
  family: string;
  reused: boolean;
}
export interface ExportOptions { fonts?: ReadonlyMap<string, Uint8Array> }
export interface PageDescriptor {
  id: string;
  sourcePage?: number;
  copyGroup?: string;
  size?: { width: number; height: number };
}
export type MappedCommand =
  | { type: 'add'; mark: NewAnnotation; options: EditOptions }
  | { type: 'update'; id: string; patch: AnnotationPatch; options: EditOptions }
  | { type: 'reply'; parentId: string; reply: NewReply; options: EditOptions }
  | { type: 'review'; parentId: string; status: 'resolved' | 'open'; options: ReviewOptions }
  | { type: 'remove'; id: string };
export interface RemovedLink { id: string; sourceId: string; reason: string }
export interface RemovedPopup { id: string; page: number; sourceId: string; reason: string }
export interface MappedOperation {
  base: NativeDocument;
  descriptors: PageDescriptor[];
  model: NativeDocument;
  removedLinks: RemovedLink[];
  removedPopups: string[];
  removedPopupRecords: RemovedPopup[];
  commands: MappedCommand[];
}
