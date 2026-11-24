import type * as React from 'react';

export type OfficeStudioKind = 'word' | 'excel' | 'pdf';

export interface StudioRichNode {
  type: string;
  attrs?: Record<string, unknown>;
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  content?: StudioRichNode[];
}

export interface StudioWordImagePosition {
  relative: string;
  /** Pixel offsets are converted to native DOCX EMUs. Use either offset or align. */
  offset?: number;
  align?: string;
}

export interface StudioWordImageLayout {
  wrap: 'square' | 'tight' | 'through' | 'topBottom' | 'front' | 'behind';
  horizontal: StudioWordImagePosition;
  vertical: StudioWordImagePosition;
  wrapSide?: 'bothSides' | 'left' | 'right' | 'largest';
  distance?: { top?: number; right?: number; bottom?: number; left?: number };
  /** Native wrap paths use a 21600-unit coordinate space and do not crop the image. */
  polygon?: [number, number][];
  allowOverlap?: boolean;
  lockAnchor?: boolean;
  layoutInCell?: boolean;
  zIndex?: number;
}

interface StudioDocumentBase {
  version: 1;
  id: string;
  name: string;
}

export interface StudioWordCharacterStyle {
  fontFamily?: string;
  /** Font size in points. */
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  color?: string;
  /** null explicitly clears an inherited text background. */
  backgroundColor?: string | null;
}

export interface StudioWordParagraphFormat {
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  indentLeft?: number;
  indentRight?: number;
  indentFirstLine?: number;
  spaceBefore?: number;
  spaceAfter?: number;
  lineHeight?: number;
}

/** Definitions live in content.attrs.paragraphStyles; paragraphs link via attrs.paragraphStyle. */
export interface StudioWordParagraphStyle {
  id: string;
  name: string;
  /** Another definition, or paragraph / no-spacing / heading-1 through heading-6. */
  basedOn?: string;
  /** The style applied when Enter creates the next paragraph. Missing retains this style. */
  next?: string;
  /** 0 is body text, 1–6 are outline heading levels. Missing inherits the base. */
  headingLevel?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  autoUpdate?: boolean;
  run?: StudioWordCharacterStyle;
  paragraph?: StudioWordParagraphFormat;
}

export interface StudioWordDocument extends StudioDocumentBase {
  kind: 'word';
  content: StudioRichNode;
  /** Default section header/footer, each represented by a doc root. */
  header?: StudioRichNode;
  footer?: StudioRichNode;
  pageNumbers?: boolean;
  page: {
    size: 'A4' | 'Letter';
    orientation: 'portrait' | 'landscape';
    margin: number;
    headerDistance?: number;
    footerDistance?: number;
  };
}

export interface StudioCell {
  input: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  /** A single font name; unknown imported font names remain editable. */
  fontFamily?: string;
  /** Excel font size in points, from 1 to 409 inclusive. */
  fontSize?: number;
  wrap?: boolean;
  color?: string;
  background?: string;
  numberFormat?: string;
  align?: 'left' | 'center' | 'right' | 'general';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  /** Missing retains source borders; {} explicitly removes all borders. */
  borders?: Partial<
    Record<
      'top' | 'bottom' | 'left' | 'right',
      {
        style:
          | 'thin'
          | 'medium'
          | 'thick'
          | 'double'
          | 'dotted'
          | 'dashed'
          | 'hair'
          | 'dashDot'
          | 'dashDotDot'
          | 'mediumDashed'
          | 'mediumDashDot'
          | 'mediumDashDotDot'
          | 'slantDashDot';
        color?: string;
      }
    >
  >;
}

export interface StudioSheetChart {
  id: string;
  type: 'bar' | 'line';
  title: string;
  /** First row holds series titles; first column holds categories. */
  range: string;
}

export interface StudioSheetFilter {
  range: string;
  columns: Record<
    string,
    {
      operator:
        | 'contains'
        | 'equals'
        | 'greater'
        | 'less'
        /** 按单元格字体颜色/填充颜色筛选；value 为 #hex，缺失颜色的行不匹配。 */
        | 'fontColor'
        | 'fillColor';
      value: string;
    }
  >;
}

export interface StudioSheetStructureEdit {
  axis: 'row' | 'column';
  type: 'insert' | 'delete';
  /** One-based position in the sheet before this operation. */
  index: number;
  count: number;
}

export interface StudioSheetHyperlink {
  id: string;
  /** An inclusive single-cell or rectangular A1 reference. */
  ref: string;
  /** External relationship target, or a # prefixed workbook location. */
  target?: string;
  /** Workbook location, or the fragment of an external relationship target. */
  location?: string;
  tooltip?: string;
  display?: string;
}

export type StudioSheetComparisonOperator =
  | 'equal'
  | 'notEqual'
  | 'greaterThan'
  | 'greaterThanOrEqual'
  | 'lessThan'
  | 'lessThanOrEqual'
  | 'between'
  | 'notBetween';

export type StudioSheetConditionalStyle = Pick<
  StudioCell,
  'bold' | 'italic' | 'underline' | 'color' | 'background' | 'numberFormat'
>;

interface StudioSheetConditionalFormatBase {
  id: string;
  /** A normalized, inclusive A1 rectangle, including A1:A1 for a single cell. */
  range: string;
  /** Smaller priorities take precedence, matching XLSX conditional formatting. */
  priority: number;
  stopIfTrue?: boolean;
  style?: StudioSheetConditionalStyle;
}

export type StudioSheetConditionalFormat = StudioSheetConditionalFormatBase &
  (
    | { type: 'cellIs'; operator: StudioSheetComparisonOperator; formulae: string[] }
    | { type: 'expression'; formula: string }
    | { type: 'containsText'; text: string }
    | { type: 'duplicateValues' | 'uniqueValues' }
    | { type: 'top10'; rank: number; percent?: boolean; bottom?: boolean }
    | { type: 'aboveAverage'; aboveAverage?: boolean }
    | { type: 'colorScale'; colors: [string, string] | [string, string, string] }
  );

interface StudioSheetDataValidationBase {
  id: string;
  /** Formula references are relative to this rectangle's top-left cell. */
  range: string;
  allowBlank?: boolean;
  showInputMessage?: boolean;
  inputTitle?: string;
  inputMessage?: string;
  showErrorMessage?: boolean;
  errorStyle?: 'stop' | 'warning' | 'information';
  errorTitle?: string;
  errorMessage?: string;
}

export type StudioSheetDataValidation = StudioSheetDataValidationBase &
  (
    | {
        type: 'list';
        /** A literal list uses at most 255 characters in XLSX. Choose one of values/source. */
        values?: string[];
        /** A single row or column reference, optionally qualified by a worksheet name. */
        source?: string;
      }
    | {
        type: 'whole' | 'decimal' | 'date' | 'time' | 'textLength';
        operator: StudioSheetComparisonOperator;
        /** Numeric constants or formulas starting with =. Dates/times use Excel serials. */
        formula1: string;
        formula2?: string;
      }
    | { type: 'custom'; formula: string }
  );

export interface StudioSheet {
  id: string;
  name: string;
  cells: Record<string, StudioCell>;
  rowCount: number;
  columnCount: number;
  columnWidths?: Record<string, number>;
  /** Default row height in points; absent uses 18pt (24 CSS pixels). */
  defaultRowHeight?: number;
  /** Positive point heights keyed by one-based rows; {} explicitly resets source heights. */
  rowHeights?: Record<string, number>;
  /** Manual hides retain the last height; [] explicitly shows previously hidden source rows. */
  hiddenRows?: number[];
  /** Column labels hidden manually; [] explicitly shows all columns. Hidden columns keep widths. */
  hiddenColumns?: string[];
  merges?: string[];
  freeze?: { rows: number; columns: number };
  filter?: StudioSheetFilter;
  charts?: StudioSheetChart[];
  conditionalFormats?: StudioSheetConditionalFormat[];
  dataValidations?: StudioSheetDataValidation[];
  /** Undefined retains legacy source metadata; [] explicitly removes all links. */
  hyperlinks?: StudioSheetHyperlink[];
  /** Replayed against the original XLSX to retain row, column and cell styling. */
  structureEdits?: StudioSheetStructureEdit[];
}

export interface StudioExcelDocument extends StudioDocumentBase {
  kind: 'excel';
  sheets: StudioSheet[];
  activeSheetId: string;
}

/** A reply in a PDF annotation discussion thread; order within `replies` is display order. */
export interface StudioPdfMarkReply {
  id: string;
  text: string;
}

export interface StudioPdfMark {
  id: string;
  page: number;
  type: 'text' | 'highlight' | 'rectangle' | 'ink';
  /** Coordinates in PDF points, from the page's bottom-left corner. */
  x: number;
  y: number;
  text: string;
  size: number;
  width?: number;
  height?: number;
  color?: string;
  /** Absolute points in the same PDF coordinates as x/y. */
  points?: [number, number][];
  lineWidth?: number;
  /** Discussion thread attached to this annotation; rendered below the mark inspector. */
  replies?: StudioPdfMarkReply[];
}

export interface StudioPdfFieldDesign {
  kind: 'text' | 'date' | 'image' | 'checkbox' | 'radio' | 'dropdown' | 'list';
  /** Existing source field replaced by an explicit design edit. Missing denotes a new field. */
  sourceName?: string;
  required?: boolean;
  tooltip?: string;
  maxLength?: number;
  multiSelect?: boolean;
  optionLabels?: Record<string, string>;
  exportValue?: string;
  defaultValue?: string | boolean;
  defaultSelections?: string[];
  fontSize?: number;
  textColor?: string;
  background?: string;
  borderColor?: string;
  borderWidth?: number;
}

export interface StudioPdfField {
  name: string;
  type: 'text' | 'checkbox' | 'choice' | 'image';
  value: string | boolean;
  options?: string[];
  readOnly: boolean;
  multiline?: boolean;
  selectedValues?: string[];
  design?: StudioPdfFieldDesign;
  widgets?: {
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
    option?: string;
  }[];
}

export interface StudioPdfDocument extends StudioDocumentBase {
  kind: 'pdf';
  pageCount: number;
  marks: StudioPdfMark[];
  rotations: Record<string, number>;
  fields: StudioPdfField[];
  /** Source fields removed through a design action, independently of value-only edits. */
  removedFields?: string[];
}

export type OfficeStudioDocument = StudioWordDocument | StudioExcelDocument | StudioPdfDocument;

export interface StudioPdfRenderResult {
  width: number;
  height: number;
  toPdfPoint(x: number, y: number): [number, number];
  toViewportPoint(x: number, y: number): [number, number];
}

export interface StudioPdfSession {
  pageCount: number;
  /** Visible crop box in absolute PDF points; avoids rendering pages just to place fields. */
  getPageBounds?(
    page: number
  ): Promise<{ left: number; bottom: number; right: number; top: number }>;
  render(
    page: number,
    canvas: HTMLCanvasElement,
    options: { scale: number; rotation: number; signal?: AbortSignal }
  ): Promise<StudioPdfRenderResult>;
  search?(query: string, options?: { signal?: AbortSignal }): Promise<StudioPdfSearchResult[]>;
  destroy(): void | Promise<void>;
}

export interface StudioPdfSearchResult {
  page: number;
  text: string;
  rect: { x: number; y: number; width: number; height: number };
}

/** A host-supplied PDF renderer keeps workers and PDF assets outside the UI bundle. */
export interface StudioPdfRenderer {
  load(source: Blob): Promise<StudioPdfSession>;
}

export interface StudioEditorProps<T extends OfficeStudioDocument> {
  document: T;
  onChange(document: T): void;
  disabled: boolean;
  readOnly: boolean;
  source?: Blob;
  pdfRenderer?: StudioPdfRenderer;
}

export interface OfficeStudioHandle {
  getDocument(): OfficeStudioDocument;
  save(): Promise<void>;
  export(): Promise<void>;
  print(): Promise<void>;
  setFullscreen(value: boolean): void;
}

export interface OfficeStudioProps extends Omit<
  React.ComponentPropsWithoutRef<'section'>,
  'children' | 'defaultValue' | 'onChange' | 'onError'
> {
  ref?: React.Ref<OfficeStudioHandle>;
  value?: OfficeStudioDocument;
  defaultValue?: OfficeStudioDocument;
  onChange?: (document: OfficeStudioDocument) => void;
  source?: Blob;
  pdfRenderer?: StudioPdfRenderer;
  onSave?: (document: OfficeStudioDocument) => void | Promise<void>;
  onExport?: (document: OfficeStudioDocument) => void | Promise<void>;
  onPrint?: (document: OfficeStudioDocument) => void | Promise<void>;
  onImport?: (file: File) => void | Promise<void>;
  onCreate?: (kind: OfficeStudioKind) => void | Promise<void>;
  onError?: (error: Error) => void;
  disabled?: boolean;
  readOnly?: boolean;
  height?: number | string;
  fullscreen?: boolean;
  defaultFullscreen?: boolean;
  onFullscreenChange?: (fullscreen: boolean) => void;
  saveState?: 'saved' | 'saving' | 'unsaved' | 'error';
  classNames?: {
    root?: string;
    header?: string;
    title?: string;
    actions?: string;
    stage?: string;
    loading?: string;
    status?: string;
    error?: string;
  };
}
