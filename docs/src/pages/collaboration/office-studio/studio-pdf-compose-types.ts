import type {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFObject,
  PDFPage,
  PDFRef,
  PDFStream,
} from 'pdf-lib';
import type { ClosedPdfCopier } from './studio-pdf-compose-utils';
import type { PdfNavigation } from './studio-pdf-compose-navigation';

export type StudioPdfComposeBytes = Blob | Uint8Array | ArrayBuffer;
export type StudioPdfComposeValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | StudioPdfComposeValue[]
  | { [key: string]: StudioPdfComposeValue };
export type StudioPdfComposeKind =
  | 'text'
  | 'date'
  | 'image'
  | 'checkbox'
  | 'radio'
  | 'dropdown'
  | 'list'
  | 'button'
  | 'signature'
  | 'opaque'
  | 'group';
export interface StudioPdfComposeSource {
  id: string;
  bytes: StudioPdfComposeBytes;
}
export interface StudioPdfComposePageSelection {
  sourceId: string;
  sourcePage: number;
  instanceId?: string;
  groupId?: string;
}
export interface StudioPdfComposeConflictPolicy {
  strategy?: 'rename' | 'link';
  valuePolicy?: 'reject' | 'first' | 'last';
}
export interface StudioPdfComposeInput {
  sources: readonly StudioPdfComposeSource[];
  pages: readonly StudioPdfComposePageSelection[];
  conflicts?: StudioPdfComposeConflictPolicy;
  catalogPolicy?: 'primary';
  orphanRadioValue?: 'reject' | 'clear';
}
export type StudioPdfComposeOptions = Omit<StudioPdfComposeInput, 'sources' | 'pages'>;
export interface StudioPdfComposeDiagnostic {
  sourceId?: string;
  path: string;
  reason?: string;
  code?: string;
  detail?: string;
}
export interface StudioPdfComposeValueResolution {
  field: string;
  policy: 'reject' | 'first' | 'last' | 'clear-unselected-radio';
  sourceId?: string;
  chosenSourceId?: string;
  key?: 'V' | 'DV';
  value?: string;
  currentBefore?: StudioPdfComposeValue;
  currentAfter?: StudioPdfComposeValue;
  defaultBefore?: StudioPdfComposeValue;
  defaultAfter?: StudioPdfComposeValue;
  currentStateBefore?: StudioPdfComposeValue;
  currentStateAfter?: StudioPdfComposeValue;
  defaultStateBefore?: StudioPdfComposeValue;
  defaultStateAfter?: StudioPdfComposeValue;
}
export interface StudioPdfComposeCatalogDecision {
  sourceId?: string;
  sourceIds?: string[];
  path: string;
  policy: string;
  detail: string;
}
export interface StudioPdfComposeReport {
  pages: { instanceId: string; sourceId: string; sourcePage: number; targetPage: number }[];
  fields: {
    sourceId: string;
    sourceName: string;
    targetName: string;
    kind: StudioPdfComposeKind;
    linked: boolean;
  }[];
  sources: { id: string; hash: string; pageCount: number }[];
  warnings: StudioPdfComposeDiagnostic[];
  prunedNavigation: StudioPdfComposeDiagnostic[];
  valueResolutions: StudioPdfComposeValueResolution[];
  catalogDecisions: StudioPdfComposeCatalogDecision[];
  destinationNames: { sourceId: string; sourceName: string; targetName: string }[];
  catalogPolicy?: { strategy: 'primary'; primarySourceId: string };
}
export interface StudioPdfComposeResult {
  bytes: Uint8Array;
  report: StudioPdfComposeReport;
  stats: { pages: number; fields: number; widgets: number; nativePageObjects: number };
  sourceHash: string;
}

export type PdfFieldProperty = 'FT' | 'Ff' | 'V' | 'DV' | 'DA' | 'Q' | 'MaxLen' | 'Opt';
export interface PdfFieldDesign {
  [key: string]: StudioPdfComposeValue;
}
export interface PdfRadioState {
  option: string;
  ordinal: number;
  key: string;
}
export interface PdfFieldRecord {
  source: PdfComposeSourceState;
  dict: PDFDict;
  ref: PDFRef;
  parent?: PdfFieldRecord;
  parts: string[];
  fullName?: string;
  path: string;
  effective: Partial<Record<PdfFieldProperty, PDFObject>>;
  kind: StudioPdfComposeKind;
  flags: number;
  widgets: PdfWidgetRecord[];
  radioStates?: { byRaw: Map<string, PdfRadioState>; counts: Map<string, number> };
}
export interface PdfWidgetRecord {
  field: PdfFieldRecord;
  dict: PDFDict;
  ref?: PDFRef;
  pageIndex: number;
  index: number;
  path: string;
  flags: number;
  option?: string;
}
export interface PdfNativeAnnotation {
  ref: PDFRef;
  dict: PDFDict;
  pageIndex: number;
}
export interface PdfFieldNode {
  fullName: string;
  part: string;
  parts: string[];
  dict: PDFDict;
  ref: PDFRef;
  parent?: PdfFieldNode;
  children: PdfFieldNode[];
  terminal: boolean;
  records: PdfFieldRecord[];
  valueRecord: PdfFieldRecord;
  widgets: PdfTargetAnnotation[];
}
export interface PdfTargetAnnotation {
  entry: PDFObject;
  original?: PdfWidgetRecord;
  originalDict: PDFDict;
  dict: PDFDict;
  ref: PDFRef;
  page: PDFPage;
  index: number;
  instance: PdfPageInstance;
  fieldNode?: PdfFieldNode;
}
export interface PdfPageInstance {
  sourceId: string;
  sourcePage: number;
  source: PdfComposeSourceState;
  index: number;
  instanceId: string;
  groupId: string;
  page: PDFPage;
  annotations: PdfTargetAnnotation[];
  mapping: Map<string, PDFRef>;
  annotationNames: Map<string, string[]>;
  copier?: ClosedPdfCopier;
  navigation?: PdfNavigation;
}
export interface PdfDAToken {
  start: number;
  end: number;
  raw: string;
  type: 'name' | 'number' | 'operator';
  value: string;
}
export interface PdfDAResource {
  token: PdfDAToken;
  category: string;
  fontSize?: number;
  noop?: boolean;
}
export interface PdfDAAnalysis {
  raw?: string;
  tokens: PdfDAToken[];
  resources: PdfDAResource[];
}
export interface PdfResourceState {
  prefix: string;
  entries: Map<string, Map<string, PDFObject> | PDFArray>;
  analyses: Map<PdfFieldRecord, PdfDAAnalysis>;
  names: Map<string, Map<string, string>>;
}
export interface PdfSourceContext {
  id: string;
  pdf: PDFDocument;
  streamHashes?: Map<PDFStream, string>;
}
export interface PdfComposeSourceState {
  id: string;
  bytes: Uint8Array;
  pdf: PDFDocument;
  pages: PDFPage[];
  fields: PdfFieldRecord[];
  groups: PdfFieldRecord[];
  form?: PDFDict;
  widgetOwners: Map<PDFDict, PdfWidgetRecord>;
  fieldRefs: Set<string>;
  annotations: Map<string, PdfNativeAnnotation>;
  names: Map<string, PDFObject>;
  instances: PdfPageInstance[];
  selectedFields: PdfFieldRecord[];
  fieldNodes: Map<PdfFieldRecord, PdfFieldNode>;
  fieldNames: Map<string, string>;
  fieldMapping: Map<string, PDFRef>;
  annotationNames: Map<string, string[]>;
  annotationMapping: Map<string, PDFRef>;
  resources?: PdfResourceState;
  streamHashes?: Map<PDFStream, string>;
  sharedTarget?: PDFDocument;
  sharedRefs?: Map<string, PDFRef>;
  sharedObjects?: Map<PDFObject, PDFObject>;
  shareable?: Map<PDFObject, boolean>;
}
export interface PdfComposeScope {
  copier: ClosedPdfCopier;
  navigation: PdfNavigation;
  namePrefix: string;
}
export type PdfPageResolver = (ref: PDFRef) => PDFRef | undefined;
