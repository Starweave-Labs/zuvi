'use client';

import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  FileText,
  Maximize,
  MessageCircle,
  Navigation,
  RotateCcw,
  Settings,
  Search,
  Trash,
  Type,
  ZoomIn,
  ZoomOut,
} from '@zuvi/icons';
import { Button } from '../Button/Button';
import { Checkbox } from '../Checkbox/Checkbox';
import { ColorPicker } from '../ColorPicker/ColorPicker';
import { Input } from '../Input/Input';
import { InputNumber } from '../InputNumber/InputNumber';
import { Radio } from '../Radio/Radio';
import { RadioGroup } from '../Radio/RadioGroup';
import { Select } from '../Select/Select';
import { Tabs } from '../Tabs/Tabs';
import { StudioRibbonTabs } from './StudioRibbon';
import { StudioPdfFieldDialog } from './StudioPdfFieldDialog';
import { StudioPdfPageDialog, type PdfPageAction } from './StudioPdfPageDialog';
import { StudioPdfComposeDialog } from './StudioPdfComposeDialog';
import { StudioPdfAnnotationDialog } from './StudioPdfAnnotationDialog';
import { StudioPdfNativeLayer } from './StudioPdfNativeLayer';
import { StudioPdfTextLayer } from './StudioPdfTextLayer';
import { StudioPdfAnnotationPaintLayer } from './StudioPdfAnnotationPaintLayer';
import {
  StudioPdfNativeInspector,
  pdfNativeStyleIssue,
  type PdfNativeStyleDraft,
} from './StudioPdfNativeInspector';
import {
  PDF_NATIVE_LABELS,
  pdfNativeCreate,
  pdfNativeRootVisible,
  type PdfNativeTool,
} from './studio-pdf-native-ui';
import type { PdfAnnotation, PdfAnnotationPatch, PdfPoint } from './studio-pdf-annotation-types';
import type { PdfWorkspaceCommand } from './studio-pdf-annotation-workspace-types';
import type {
  StudioPdfAnnotationEditor,
  StudioPdfAnnotationInspection,
  StudioPdfAnnotationPreview,
} from './studio-pdf-annotations';
import { pdfCompositionSnapshotValid } from './studio-pdf-composition';
import {
  pdfPages,
  pdfInsertBlankPage,
  pdfRemovePages,
  pdfMovePages,
  pdfCopyPages,
  pdfRotatePages,
  pdfResizePages,
} from './studio-pdf-pages';
import {
  pdfFieldDesign,
  pdfFieldIssue,
  pdfFieldKind,
  pdfRemoveDesignedField,
  pdfSetDesignedField,
} from './studio-pdf-fields';
import type {
  StudioEditorProps,
  StudioPdfDocument,
  StudioPdfField,
  StudioPdfMark,
  StudioPdfPage,
  StudioPdfRenderer,
  StudioPdfRenderResult,
  StudioPdfSession,
  StudioPdfSearchResult,
  StudioPdfSnapshot,
  StudioPdfComposer,
  StudioPdfComposeRequest,
  StudioPdfComposeResult,
  StudioPdfTextSelection,
} from './studio-types';
import './StudioPdf.css';
import { isImeComposing } from '../../utils';

type Tool = 'select' | 'text' | 'highlight' | 'rectangle' | 'ink';
type Panel = 'marks' | 'fields' | 'search' | 'pages';
const markNames = { text: '文字', highlight: '高亮', rectangle: '矩形', ink: '手写签名' };
const zoomSteps = [0.5, 0.75, 1, 1.25, 1.5, 2];
const panelIcons = { search: Search, marks: MessageCircle, pages: FileText, fields: Settings };
const panelLabels = {
  search: 'PDF 文本查找侧栏',
  marks: 'PDF 批注侧栏',
  pages: 'PDF 页面缩略图侧栏',
  fields: 'PDF 表单侧栏',
};
interface Drawing {
  pointer: number;
  type: 'rectangle' | 'ink';
  points: [number, number][];
}
interface LoadedPdf {
  id: string;
  source: Blob;
  renderer: StudioPdfRenderer;
  session: StudioPdfSession;
  preview?: StudioPdfAnnotationPreview;
}
interface RenderedPage {
  loaded: LoadedPdf;
  page: number;
  zoom: number;
  rotation: number;
  descriptor?: StudioPdfPage;
  result: StudioPdfRenderResult;
}

function dispose(session: StudioPdfSession) {
  try {
    void Promise.resolve(session.destroy()).catch(() => undefined);
  } catch {
    // Disposal cannot update a component that has already released the session.
  }
}

function visibleBounds(view: StudioPdfRenderResult) {
  const points = [
    view.toPdfPoint(0, 0),
    view.toPdfPoint(view.width, 0),
    view.toPdfPoint(0, view.height),
    view.toPdfPoint(view.width, view.height),
  ];
  return {
    left: Math.min(...points.map(([x]) => x)),
    right: Math.max(...points.map(([x]) => x)),
    bottom: Math.min(...points.map(([, y]) => y)),
    top: Math.max(...points.map(([, y]) => y)),
  };
}

function markDimensions(mark: StudioPdfMark) {
  if (mark.type === 'highlight' || mark.type === 'rectangle')
    return { width: mark.width ?? 120, above: mark.height ?? 18, below: 0 };
  if (mark.type === 'ink') {
    const points = mark.points ?? [[mark.x, mark.y]];
    return {
      width: Math.max(1, ...points.map(([x]) => x - mark.x)),
      above: Math.max(1, ...points.map(([, y]) => y - mark.y)),
      below: 0,
    };
  }
  const lines = mark.text.replace(/\r\n?/g, '\n').split('\n');
  return {
    width: Math.max(1, ...lines.map((line) => [...line].length)) * mark.size,
    above: mark.size,
    below: Math.max(0, lines.length - 1) * mark.size * 1.35 + mark.size * 0.35,
  };
}

function translateMark(mark: StudioPdfMark, x: number, y: number): StudioPdfMark {
  return {
    ...mark,
    x,
    y,
    ...(mark.type === 'ink'
      ? {
          points: mark.points?.map(
            ([a, b]) => [a + x - mark.x, b + y - mark.y] as [number, number]
          ),
        }
      : {}),
  };
}

function fitMark(mark: StudioPdfMark, view: StudioPdfRenderResult) {
  const bounds = visibleBounds(view);
  const dimensions = markDimensions(mark);
  const padding = Math.max(4, (mark.lineWidth ?? 2) / 2 + 1);
  if (
    dimensions.width > bounds.right - bounds.left - padding * 2 ||
    dimensions.above + dimensions.below > bounds.top - bounds.bottom - padding * 2
  )
    return undefined;
  return translateMark(
    mark,
    Math.max(bounds.left + padding, Math.min(bounds.right - dimensions.width - padding, mark.x)),
    Math.max(
      bounds.bottom + dimensions.below + padding,
      Math.min(bounds.top - dimensions.above - padding, mark.y)
    )
  );
}

function drawingMark(
  drawing: Drawing,
  page: number,
  lineWidth: number,
  ink: string
): StudioPdfMark {
  const x = Math.min(...drawing.points.map(([a]) => a));
  const y = Math.min(...drawing.points.map(([, b]) => b));
  return {
    id: 'draft',
    page,
    type: drawing.type,
    x,
    y,
    text: '',
    size: 16,
    color: ink,
    lineWidth,
    ...(drawing.type === 'ink'
      ? { points: drawing.points }
      : {
          width: Math.max(...drawing.points.map(([a]) => a)) - x,
          height: Math.max(...drawing.points.map(([, b]) => b)) - y,
        }),
  };
}

function markContent(mark: StudioPdfMark) {
  if (mark.type === 'highlight' || mark.type === 'rectangle')
    return (
      <rect
        x={0}
        y={-(mark.height ?? 18)}
        width={mark.width ?? 120}
        height={mark.height ?? 18}
        fill={mark.type === 'highlight' ? (mark.color ?? '#f5c542') : 'none'}
        fillOpacity={mark.type === 'highlight' ? 0.3 : undefined}
        stroke={mark.type === 'rectangle' ? (mark.color ?? '#253044') : undefined}
        strokeWidth={mark.type === 'rectangle' ? (mark.lineWidth ?? 2) : undefined}
      />
    );
  if (mark.type === 'ink')
    return (
      <polyline
        points={mark.points?.map(([x, y]) => `${x - mark.x},${mark.y - y}`).join(' ')}
        fill="none"
        stroke={mark.color ?? '#253044'}
        strokeWidth={mark.lineWidth ?? 2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  return (
    <text fontSize={mark.size} fill={mark.color ?? '#253044'} aria-hidden="true">
      {mark.text
        .replace(/\r\n?/g, '\n')
        .split('\n')
        .map((line, index) => (
          <tspan key={index} x={0} dy={index === 0 ? 0 : mark.size * 1.35}>
            {line}
          </tspan>
        ))}
    </text>
  );
}

function pdfMatrix(view: StudioPdfRenderResult, x: number, y: number) {
  const origin = view.toViewportPoint(x, y);
  const axisX = view.toViewportPoint(x + 1, y);
  const axisY = view.toViewportPoint(x, y - 1);
  return [
    axisX[0] - origin[0],
    axisX[1] - origin[1],
    axisY[0] - origin[0],
    axisY[1] - origin[1],
    ...origin,
  ];
}

function widgetContentStyle(widget: NonNullable<StudioPdfField['widgets']>[number]): CSSProperties {
  const { width, height } = widget;
  const rotation = widget.rotation ?? 0;
  const swap = rotation === 90 || rotation === 270;
  return {
    width: swap ? height : width,
    height: swap ? width : height,
    transformOrigin: '0 0',
    transform:
      rotation === 90
        ? `translate(0px, ${height}px) rotate(-90deg)`
        : rotation === 180
          ? `translate(${width}px, ${height}px) rotate(180deg)`
          : rotation === 270
            ? `translate(${width}px, 0px) rotate(90deg)`
            : undefined,
    fontSize: Math.max(6, Math.min(16, (swap ? width : height) * 0.5)),
  };
}

function PdfThumbnail({
  loaded,
  page,
  rotation,
  descriptor,
  currentPage,
  disabled,
  draggable,
  onSelect,
}: {
  loaded: LoadedPdf;
  page: number;
  rotation: number;
  descriptor?: StudioPdfPage;
  currentPage: number;
  disabled: boolean;
  draggable?: boolean;
  onSelect(): void;
}) {
  const button = useRef<HTMLButtonElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const near = Math.abs(page - currentPage) <= 2;
  const [visible, setVisible] = useState(near);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (near) setVisible(true);
    if (!button.current || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(near || entry.isIntersecting),
      { rootMargin: '160px' }
    );
    observer.observe(button.current);
    return () => observer.disconnect();
  }, [near]);
  useEffect(() => {
    if (!visible || !canvas.current) return;
    const controller = new AbortController();
    setReady(false);
    setFailed(false);
    const destination = canvas.current;
    void Promise.resolve()
      .then(() =>
        loaded.session.render(page, destination, {
          scale: 0.25,
          rotation,
          ...(descriptor ? { page: descriptor } : {}),
          signal: controller.signal,
        })
      )
      .then(
        () => {
          if (!controller.signal.aborted) setReady(true);
        },
        () => {
          if (!controller.signal.aborted) setFailed(true);
        }
      );
    return () => controller.abort();
  }, [loaded, page, rotation, descriptor, visible]);
  return (
    <Button
      ref={button}
      variant="outline"
      fullWidth
      className="zuvi-studio-pdf-thumbnail"
      aria-label={`PDF 第 ${page + 1} 页缩略图`}
      aria-pressed={page === currentPage}
      draggable={draggable}
      disabled={disabled}
      onClick={onSelect}
    >
      <span className="zuvi-studio-pdf-thumbnail-paper">
        <canvas
          ref={canvas}
          aria-hidden="true"
          style={{ visibility: ready ? 'visible' : 'hidden' }}
        />
        {!ready && <span>{failed ? '预览暂不可用' : `第 ${page + 1} 页`}</span>}
      </span>
      <span>第 {page + 1} 页</span>
    </Button>
  );
}

export default function StudioPdf({
  document: pdfDocument,
  onChange,
  disabled,
  readOnly,
  source,
  pdfRenderer,
  pdfComposer,
  pdfAnnotations,
  onPdfSourceChange,
}: StudioEditorProps<StudioPdfDocument>) {
  const [loaded, setLoaded] = useState<LoadedPdf | null>(null);
  const [rendered, setRendered] = useState<RenderedPage | null>(null);
  const [page, setPage] = useState(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([0]);
  const [pageDialog, setPageDialog] = useState<{
    action: PdfPageAction;
    snapshot: StudioPdfDocument;
    selection: number[];
    source?: Blob;
    renderer?: StudioPdfRenderer;
    session?: StudioPdfSession;
  } | null>(null);
  const [composeDialog, setComposeDialog] = useState<{
    mode: 'merge' | 'extract';
    snapshot: StudioPdfSnapshot;
    selection: number[];
    currentPage: number;
    renderer: StudioPdfRenderer;
    session: StudioPdfSession;
    composer: StudioPdfComposer;
  } | null>(null);
  const [composeBusy, setComposeBusy] = useState(false);
  const [nativeBusy, setNativeBusy] = useState(false);
  const [nativeTool, setNativeTool] = useState<PdfNativeTool>('select');
  const [nativeStyle, setNativeStyle] = useState<PdfNativeStyleDraft>({
    text: '',
    author: '',
    font: 'Noto Sans SC',
    fontSize: '16',
    ink: '#253044',
    marker: '#f5c542',
    lineWidth: '2',
  });
  const [nativeInspection, setNativeInspection] = useState<{
    source: Blob;
    editor: StudioPdfAnnotationEditor;
    state: StudioPdfDocument['nativeAnnotations'];
    result: StudioPdfAnnotationInspection;
  } | null>(null);
  const [nativePreview, setNativePreview] = useState<{
    source: Blob;
    editor: StudioPdfAnnotationEditor;
    state: StudioPdfDocument['nativeAnnotations'];
    pages: StudioPdfDocument['pages'];
    rotations: StudioPdfDocument['rotations'];
    result: StudioPdfAnnotationPreview;
  } | null>(null);
  const [nativeDialog, setNativeDialog] = useState<{
    annotation: PdfAnnotation;
    snapshot: StudioPdfSnapshot;
    editor: StudioPdfAnnotationEditor;
  } | null>(null);
  const [nativeSelection, setNativeSelection] = useState<StudioPdfTextSelection | undefined>();
  const nativeTask = useRef<AbortController | null>(null),
    nativeComposing = useRef(false);
  const nativeEditorRef = useRef(pdfAnnotations);
  nativeEditorRef.current = pdfAnnotations;
  const composeTask = useRef<AbortController | null>(null);
  const pageDrag = useRef<{ snapshot: StudioPdfDocument; selection: number[] } | null>(null);
  const pageDescriptors = pdfDocument.pages;
  const originalPageCount = pdfDocument.sourcePageCount ?? pdfDocument.pageCount;
  const [zoom, setZoom] = useState(1);
  const [ribbon, setRibbon] = useState('home');
  const [tool, setTool] = useState<Tool>('select');
  const [textSelectionMode, setTextSelectionMode] = useState(false);
  const [text, setText] = useState('');
  const [size, setSize] = useState(16);
  const [ink, setInk] = useState('#253044');
  const [highlight, setHighlight] = useState('#f5c542');
  const [lineWidth, setLineWidth] = useState(2);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [inspector, setInspector] = useState(true);
  const [panel, setPanel] = useState<Panel>('marks');
  const [query, setQuery] = useState('');
  const [searchRequest, setSearchRequest] = useState({ text: '', version: 0 });
  const [searchResults, setSearchResults] = useState<StudioPdfSearchResult[]>([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchIndex, setSearchIndex] = useState(0);
  const searchScope = useRef<{
    loaded: LoadedPdf | null;
    request: typeof searchRequest;
    pages?: readonly StudioPdfPage[];
    complete: boolean;
  } | null>(null);
  const [drawing, setDrawing] = useState<Drawing | null>(null);
  const [, setHistoryVersion] = useState(0);
  const [error, setError] = useState('');
  const [nativeLoadError, setNativeLoadError] = useState('');
  const [notice, setNotice] = useState('');
  const [retry, setRetry] = useState(0);
  const [fieldDialog, setFieldDialog] = useState<{ field?: StudioPdfField } | null>(null);
  const [dateDrafts, setDateDrafts] = useState<Record<string, string>>({});
  const dateDraftRef = useRef(dateDrafts);
  dateDraftRef.current = dateDrafts;
  const fieldEdit = useRef<{ name: string; saved: boolean } | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const paper = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const documentRef = useRef(pdfDocument);
  const expectedRef = useRef(pdfDocument);
  const sourceRef = useRef(source);
  const expectedSourceRef = useRef(source);
  const pastRef = useRef<StudioPdfSnapshot[]>([]);
  const futureRef = useRef<StudioPdfSnapshot[]>([]);
  const pageViews = useRef(
    new WeakMap<StudioPdfDocument, { current?: string; selected: string[] }>()
  );
  const drawingRef = useRef<Drawing | null>(null);
  const suppressClick = useRef(false);
  const drag = useRef<{
    mode: 'move' | 'resize';
    pointer: number;
    mark: StudioPdfMark;
    point: [number, number];
    snapshot: StudioPdfDocument;
    saved: boolean;
  } | null>(null);
  const formId = useId();
  const panelId = useId();
  documentRef.current = pdfDocument;
  sourceRef.current = source;
  const sourceChangeRef = useRef(onPdfSourceChange);
  sourceChangeRef.current = onPdfSourceChange;
  const currentNative =
    nativeInspection &&
    nativeInspection.source === source &&
    nativeInspection.editor === pdfAnnotations &&
    nativeInspection.state === pdfDocument.nativeAnnotations
      ? nativeInspection.result
      : undefined;
  const needsNativePreview = !!pdfAnnotations && !!pdfDocument.nativeAnnotations?.commands.length;
  const currentPreview =
    needsNativePreview &&
    nativePreview &&
    nativePreview.source === source &&
    nativePreview.editor === pdfAnnotations &&
    nativePreview.state === pdfDocument.nativeAnnotations &&
    nativePreview.pages === pageDescriptors &&
    nativePreview.rotations === pdfDocument.rotations
      ? nativePreview.result
      : undefined;
  const renderDescriptors = currentPreview?.binding.pages ?? pageDescriptors;
  const descriptor = renderDescriptors?.[page];

  const activeLoaded =
    loaded &&
    loaded.id === pdfDocument.id &&
    loaded.source === source &&
    loaded.renderer === pdfRenderer &&
    loaded.preview === currentPreview &&
    (!needsNativePreview || !!currentPreview)
      ? loaded
      : null;
  const rotation =
    (currentPreview ? currentPreview.binding.rotations : pdfDocument.rotations)[String(page)] ?? 0;
  const view =
    rendered &&
    rendered.loaded === activeLoaded &&
    rendered.page === page &&
    rendered.zoom === zoom &&
    rendered.rotation === rotation &&
    rendered.descriptor === descriptor
      ? rendered.result
      : null;
  const canManagePages =
    !!activeLoaded?.session.supportsPageMapping &&
    (!pdfAnnotations || (!!currentNative && !!onPdfSourceChange));
  const canEditSource =
    !disabled &&
    !readOnly &&
    !!activeLoaded &&
    (!pdfAnnotations || (!!currentNative && !currentNative.snapshot.signed));
  const canEditSourceRef = useRef(canEditSource);
  canEditSourceRef.current = canEditSource;
  const canModify = canEditSource && !composeBusy && !nativeBusy;
  const canModifyRef = useRef(canModify);
  canModifyRef.current = canModify;
  const selected = pdfDocument.marks.find((mark) => mark.id === selectedId);
  const canModifySelectedMark = canModify && !selected?.nativeId;
  const canModifyNative =
    canModify && !!view && !!currentNative && !!pdfAnnotations && !!onPdfSourceChange;
  const visibleError = error || nativeLoadError;
  const markCount = currentNative
    ? currentNative.snapshot.annotations.filter(pdfNativeRootVisible).length +
      pdfDocument.marks.filter((mark) => !mark.nativeId).length
    : pdfDocument.marks.length;

  useEffect(() => {
    const controller = new AbortController();
    setNativeLoadError('');
    if (!source || !pdfAnnotations) {
      setNativeInspection(null);
      return;
    }
    const state = documentRef.current.nativeAnnotations;
    void pdfAnnotations
      .inspect({ document: documentRef.current, source }, { signal: controller.signal })
      .then(
        (result) => {
          if (!controller.signal.aborted)
            setNativeInspection({ source, editor: pdfAnnotations, state, result });
        },
        (cause) => {
          if (!controller.signal.aborted)
            setNativeLoadError(cause instanceof Error ? cause.message : '批注读取失败。');
        }
      );
    return () => controller.abort();
  }, [
    source,
    pdfAnnotations,
    pdfDocument.nativeAnnotations,
    pdfDocument.id,
    pdfDocument.pages,
    retry,
  ]);

  useEffect(() => {
    const controller = new AbortController();
    if (!source || !pdfAnnotations || !needsNativePreview) {
      setNativePreview(null);
      return;
    }
    const document = documentRef.current,
      snapshot = { document, source };
    void Promise.resolve()
      .then(() => pdfAnnotations.preview(snapshot, { signal: controller.signal }))
      .then((result) => {
        if (controller.signal.aborted) return;
        const pages = pdfPages(document),
          binding = result?.binding;
        if (
          !(result?.source instanceof Blob) ||
          !result.source.size ||
          !binding?.rendersCurrentPageOrder ||
          binding.pageCount !== document.pageCount ||
          binding.sourcePageCount !== document.pageCount ||
          binding.pages?.length !== pages.length ||
          !binding.pages.every(
            (entry, index) => entry.id === pages[index].id && entry.sourcePage === index
          ) ||
          !binding.rotations ||
          !Object.values(binding.rotations).every(
            (value) => Number.isFinite(value) && value % 90 === 0
          )
        ) {
          throw new Error('批注预览返回了不完整的页面映射，当前原文件已保留。');
        }
        setNativePreview({
          source,
          editor: pdfAnnotations,
          state: document.nativeAnnotations,
          pages: document.pages,
          rotations: document.rotations,
          result,
        });
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setNativeLoadError(
            cause instanceof Error ? cause.message : '批注预览失败，当前原文件已保留。'
          );
      });
    return () => controller.abort();
  }, [
    source,
    pdfAnnotations,
    needsNativePreview,
    pdfDocument.nativeAnnotations,
    pdfDocument.id,
    pdfDocument.pages,
    pdfDocument.rotations,
    retry,
  ]);

  useEffect(() => {
    nativeTask.current?.abort();
    nativeTask.current = null;
    setNativeBusy(false);
    setNativeDialog(null);
    setNativeSelection(undefined);
    setNativeTool('select');
    nativeComposing.current = false;
  }, [source, pdfAnnotations, pdfRenderer, disabled, readOnly]);
  useEffect(() => () => nativeTask.current?.abort(), []);
  useEffect(() => {
    setPage(0);
    setSelectedId(null);
    setTextSelectionMode(false);
  }, [pdfDocument.id]);

  useEffect(() => {
    const legacySourceReplacement =
      pdfDocument === expectedRef.current &&
      source &&
      source !== expectedSourceRef.current &&
      !sourceChangeRef.current;
    if (legacySourceReplacement) {
      // Hosts with the original model-only API replace the source themselves.
      // Their existing document history continues against that explicitly supplied source.
      pastRef.current = pastRef.current.map((entry) => ({ ...entry, source }));
      futureRef.current = futureRef.current.map((entry) => ({ ...entry, source }));
    }
    if (
      pdfDocument !== expectedRef.current ||
      (source !== expectedSourceRef.current && !legacySourceReplacement)
    ) {
      pastRef.current = [];
      futureRef.current = [];
      setHistoryVersion((value) => value + 1);
      setDateDrafts({});
      setFieldDialog(null);
      setPageDialog(null);
      composeTask.current?.abort();
      composeTask.current = null;
      setComposeBusy(false);
      setComposeDialog(null);
      fieldEdit.current = null;
    }
    expectedRef.current = pdfDocument;
    expectedSourceRef.current = source;
  }, [pdfDocument, source]);

  useEffect(() => {
    setDateDrafts({});
    fieldEdit.current = null;
    pageDrag.current = null;
    setPageDialog(null);
    setFieldDialog(null);
    composeTask.current?.abort();
    composeTask.current = null;
    setComposeBusy(false);
    setComposeDialog(null);
  }, [disabled, readOnly, source, pdfRenderer, pdfComposer]);

  useEffect(() => () => composeTask.current?.abort(), []);

  useEffect(() => {
    drawingRef.current = null;
    setDrawing(null);
    drag.current = null;
  }, [disabled, readOnly, page, zoom, rotation, tool, composeBusy, textSelectionMode]);

  useEffect(() => {
    if (inspector && panel === 'search') searchInput.current?.focus();
  }, [inspector, panel]);

  useEffect(() => {
    const controller = new AbortController();
    const previous = searchScope.current;
    const same =
      previous?.loaded === activeLoaded &&
      previous?.request === searchRequest &&
      previous?.pages === renderDescriptors;
    const scope = same
      ? previous!
      : { loaded: activeLoaded, request: searchRequest, pages: renderDescriptors, complete: false };
    searchScope.current = scope;
    if (!same) {
      setSearchResults([]);
      setSearchIndex(0);
      setSearchError('');
    }
    if (disabled || !activeLoaded || !searchRequest.text.trim()) {
      setSearchBusy(false);
      return;
    }
    if (scope.complete) {
      setSearchBusy(false);
      return;
    }
    if (!activeLoaded.session.search) {
      setSearchBusy(false);
      setSearchError('当前 PDF 渲染器没有提供文本查找。');
      return;
    }
    setSearchBusy(true);
    void Promise.resolve()
      .then(() => activeLoaded.session.search!(searchRequest.text, { signal: controller.signal }))
      .then(
        (results) => {
          if (controller.signal.aborted) return;
          const mapped = renderDescriptors
            ? results.flatMap((result) =>
                renderDescriptors.flatMap((entry, index) =>
                  entry.sourcePage === result.page ? [{ ...result, page: index }] : []
                )
              )
            : results;
          const valid = mapped
            .filter(
              (result) =>
                Number.isInteger(result.page) &&
                result.page >= 0 &&
                result.page < pdfDocument.pageCount &&
                typeof result.text === 'string' &&
                result.rect &&
                Object.values(result.rect).every(Number.isFinite) &&
                result.rect.width > 0 &&
                result.rect.height > 0
            )
            .slice(0, 1000);
          setSearchResults(valid);
          setSearchBusy(false);
          scope.complete = true;
          if (valid.length) {
            setPage(valid[0].page);
            setSelectedId(null);
          }
        },
        (reason: unknown) => {
          if (controller.signal.aborted) return;
          setSearchBusy(false);
          setSearchError(reason instanceof Error ? reason.message : 'PDF 查找失败，请重试。');
        }
      );
    return () => controller.abort();
  }, [activeLoaded, searchRequest, pdfDocument.pageCount, renderDescriptors, disabled]);

  useEffect(() => {
    let active = true;
    let owned: StudioPdfSession | undefined;
    setLoaded(null);
    setRendered(null);
    setError('');
    setNotice('');
    setTool('select');
    drag.current = null;
    drawingRef.current = null;
    setDrawing(null);
    setSearchResults([]);
    setSearchRequest({ text: '', version: 0 });
    if (!source || !pdfRenderer || (needsNativePreview && !currentPreview)) return;
    void Promise.resolve()
      .then(() => pdfRenderer.load(currentPreview?.source ?? source))
      .then(
        (session) => {
          if (!active) {
            dispose(session);
            return;
          }
          owned = session;
          if (
            session.pageCount !==
              (currentPreview?.binding.sourcePageCount ??
                documentRef.current.sourcePageCount ??
                documentRef.current.pageCount) ||
            session.pageCount < 1 ||
            session.pageCount > 200
          ) {
            dispose(session);
            owned = undefined;
            setError('PDF 草稿页数与原文件不一致，请重新导入文件。');
            return;
          }
          if (
            !session.supportsPageMapping &&
            !currentPreview &&
            documentRef.current.pages?.some(
              (entry, index) => entry.sourcePage !== index || entry.size
            )
          ) {
            dispose(session);
            owned = undefined;
            setError('当前 PDF 渲染器不支持页面编辑映射，请使用支持此能力的适配器。');
            return;
          }
          setLoaded({
            id: pdfDocument.id,
            source,
            renderer: pdfRenderer,
            session,
            ...(currentPreview ? { preview: currentPreview } : {}),
          });
        },
        (reason: unknown) => {
          if (active) setError(reason instanceof Error ? reason.message : 'PDF 加载失败，请重试。');
        }
      );
    return () => {
      active = false;
      if (owned) dispose(owned);
    };
  }, [
    source,
    pdfRenderer,
    pdfDocument.id,
    originalPageCount,
    retry,
    needsNativePreview,
    currentPreview,
  ]);

  useEffect(() => {
    if (!activeLoaded || !canvas.current) return;
    const controller = new AbortController();
    let active = true;
    drag.current = null;
    setRendered(null);
    setError('');
    const destination = canvas.current;
    void Promise.resolve()
      .then(() =>
        activeLoaded.session.render(page, destination, {
          scale: zoom,
          rotation,
          ...(descriptor ? { page: descriptor } : {}),
          signal: controller.signal,
        })
      )
      .then(
        (result) => {
          if (active && !controller.signal.aborted) {
            if (
              !Number.isFinite(result.width) ||
              !Number.isFinite(result.height) ||
              result.width <= 0 ||
              result.height <= 0
            ) {
              setError('PDF 渲染器返回了无效的页面尺寸。');
              return;
            }
            setRendered({ loaded: activeLoaded, page, zoom, rotation, descriptor, result });
          }
        },
        (reason: unknown) => {
          if (active && !controller.signal.aborted)
            setError(reason instanceof Error ? reason.message : 'PDF 页面渲染失败。');
        }
      );
    return () => {
      active = false;
      controller.abort();
    };
  }, [activeLoaded, page, zoom, rotation, descriptor]);

  const remember = (snapshot: StudioPdfDocument, originalSource = sourceRef.current) => {
    if (!originalSource) return;
    const pages = pdfPages(snapshot);
    pageViews.current.set(snapshot, {
      current: pages[page]?.id,
      selected: selectedPages.flatMap((index) => (pages[index] ? [pages[index].id] : [])),
    });
    pastRef.current = [
      ...pastRef.current.slice(-39),
      { document: snapshot, source: originalSource },
    ];
    futureRef.current = [];
    setHistoryVersion((value) => value + 1);
  };
  const commit = (next: StudioPdfDocument, addHistory = true): boolean => {
    if (!canModifyRef.current) return false;
    if (addHistory) remember(documentRef.current);
    documentRef.current = next;
    expectedRef.current = next;
    setNotice('');
    onChange(next);
    return true;
  };
  const commitSnapshot = (next: StudioPdfSnapshot, addHistory = true): boolean => {
    const previousSource = sourceRef.current;
    if (!canEditSourceRef.current || !previousSource || !sourceChangeRef.current) return false;
    const previous = { document: documentRef.current, source: previousSource };
    expectedRef.current = next.document;
    expectedSourceRef.current = next.source;
    let accepted = false;
    try {
      accepted = sourceChangeRef.current({ previous, next }) === true;
    } finally {
      if (!accepted) {
        expectedRef.current = previous.document;
        expectedSourceRef.current = previous.source;
      }
    }
    if (!accepted) return false;
    if (addHistory) remember(previous.document, previous.source);
    documentRef.current = next.document;
    sourceRef.current = next.source;
    setNotice('');
    return true;
  };
  const applyNative = async (
    command: PdfWorkspaceCommand | { type: 'migrate' },
    next?: StudioPdfDocument
  ): Promise<boolean> => {
    const editor = nativeEditorRef.current,
      original = sourceRef.current;
    if (
      !canModifyRef.current ||
      !editor ||
      !original ||
      !sourceChangeRef.current ||
      nativeTask.current ||
      nativeComposing.current
    )
      return false;
    const invalidDate = Object.entries(dateDraftRef.current)
      .map(([name, value]) => {
        const field = documentRef.current.fields.find((entry) => entry.name === name);
        return field && pdfFieldIssue({ ...field, value }, documentRef.current.pageCount);
      })
      .find(Boolean);
    if (invalidDate) {
      setNotice(invalidDate);
      return false;
    }
    const snapshot = { document: documentRef.current, source: original },
      controller = new AbortController();
    const now =
      command.type === 'mark' && command.command.type !== 'remove'
        ? command.command.now
        : new Date().toISOString();
    nativeTask.current = controller;
    setNativeBusy(true);
    setNotice('');
    try {
      const result = await editor.apply({
        snapshot,
        command,
        next,
        now,
        signal: controller.signal,
      });
      if (controller.signal.aborted || nativeTask.current !== controller) return false;
      if (
        documentRef.current !== snapshot.document ||
        sourceRef.current !== snapshot.source ||
        nativeEditorRef.current !== editor ||
        !canEditSourceRef.current
      )
        throw new Error('生成批注期间当前 PDF 或编辑权限已变化，结果未应用。');
      if (!pdfCompositionSnapshotValid(result, snapshot))
        throw new Error('批注编辑器返回了不完整的原文件与模型。');
      if (!commitSnapshot(result)) throw new Error('当前宿主未接受 PDF 原文件与模型，批注未改变。');
      setNotice('');
      return true;
    } catch (cause) {
      if (!controller.signal.aborted)
        setNotice(cause instanceof Error ? cause.message : '批注未应用，当前内容已保留。');
      return false;
    } finally {
      if (nativeTask.current === controller) {
        nativeTask.current = null;
        setNativeBusy(false);
      }
    }
  };
  const selectNative = (id: string | null) => {
    if (disabled) return;
    setSelectedId(id);
    const annotation = currentNative?.snapshot.annotations.find((entry) => entry.id === id);
    const index =
      annotation &&
      pdfPages(documentRef.current).findIndex((entry) => entry.id === annotation.pageId);
    if (index !== undefined && index >= 0) setPage(index);
    setPanel('marks');
    setInspector(true);
    setNativeTool('select');
    setTextSelectionMode(false);
  };
  const createNative = async (
    tool: Exclude<PdfNativeTool, 'select'>,
    points: readonly PdfPoint[]
  ): Promise<boolean> => {
    if (!canModifyNative || !view) return false;
    try {
      const issue = pdfNativeStyleIssue(nativeStyle);
      if (issue) throw new Error(issue);
      const annotation = pdfNativeCreate(
        tool,
        pdfPages(documentRef.current)[page].id,
        points,
        {
          ...nativeStyle,
          fontSize: Number(nativeStyle.fontSize),
          lineWidth: Number(nativeStyle.lineWidth),
        },
        view
      );
      const accepted = await applyNative({
        type: 'mark',
        command: {
          type: 'create',
          annotation: { ...annotation, id: annotation.id! },
          now: new Date().toISOString(),
        },
      });
      if (accepted) {
        setSelectedId(annotation.id!);
        setNativeTool('select');
        setPanel('marks');
        setInspector(true);
      }
      return accepted;
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : '批注未创建。');
      return false;
    }
  };
  const patchNative = async (id: string, patch: PdfAnnotationPatch) =>
    applyNative({
      type: 'mark',
      command: { type: 'update', id, patch, now: new Date().toISOString() },
    });
  const removeNative = async (id: string) => {
    const accepted = await applyNative({ type: 'mark', command: { type: 'remove', id } });
    if (accepted && selectedId === id) setSelectedId(null);
    return accepted;
  };
  const openNativeProperties = (id: string) => {
    const annotation = currentNative?.snapshot.annotations.find((entry) => entry.id === id);
    if (disabled || nativeBusy || !annotation || !source || !pdfAnnotations) return;
    setNativeDialog({
      annotation,
      snapshot: { document: documentRef.current, source },
      editor: pdfAnnotations,
    });
  };
  const stepHistory = (direction: 'undo' | 'redo') => {
    if (!canModify || !sourceRef.current) return;
    const from = direction === 'undo' ? pastRef : futureRef;
    const to = direction === 'undo' ? futureRef : pastRef;
    const next = from.current.at(-1);
    if (!next) return;
    const current = { document: documentRef.current, source: sourceRef.current };
    const currentPages = pdfPages(current.document);
    pageViews.current.set(current.document, {
      current: currentPages[page]?.id,
      selected: selectedPages.flatMap((index) =>
        currentPages[index] ? [currentPages[index].id] : []
      ),
    });
    try {
      const accepted =
        next.source === current.source ? commit(next.document, false) : commitSnapshot(next, false);
      if (!accepted) {
        setNotice('当前宿主未接受 PDF 原文件切换，历史未改变。');
        return;
      }
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : 'PDF 历史恢复失败，当前内容仍保留。');
      return;
    }
    from.current.pop();
    to.current = [...to.current.slice(-39), current];
    setDateDrafts({});
    fieldEdit.current = null;
    setSelectedId(null);
    const pages = pdfPages(next.document),
      prior = pageViews.current.get(next.document),
      restored = pages.findIndex((entry) => entry.id === prior?.current);
    setPage(restored >= 0 ? restored : Math.min(page, next.document.pageCount - 1));
    const restoredSelection = pages.flatMap((entry, index) =>
      prior?.selected.includes(entry.id) ? [index] : []
    );
    setSelectedPages(
      restoredSelection.length
        ? restoredSelection
        : [restored >= 0 ? restored : Math.min(page, next.document.pageCount - 1)]
    );
    setPageDialog(null);
    setHistoryVersion((value) => value + 1);
  };
  const commitPages = (next: StudioPdfDocument) => {
    if (!canModifyRef.current || next === documentRef.current) return;
    const previousPages = pdfPages(documentRef.current),
      selectedIds = selectedPages.flatMap((index) =>
        previousPages[index] ? [previousPages[index].id] : []
      );
    const currentId = previousPages[page]?.id;
    const nextIndex = pdfPages(next).findIndex((entry) => entry.id === currentId);
    if (pdfAnnotations) {
      const pages = pdfPages(next);
      const targets = pages.map((entry) => {
        const retained = previousPages.some((old) => old.id === entry.id),
          fromPageId = retained ? entry.id : entry.originPageId;
        return {
          id: entry.id,
          ...(fromPageId ? { fromPageId } : {}),
          ...(!retained && entry.copyGroup ? { copyGroup: entry.copyGroup } : {}),
          ...(entry.size ? { size: entry.size } : {}),
        };
      });
      void applyNative({ type: 'layout', targets }, next).then((accepted) => {
        if (!accepted) return;
        setPage(nextIndex >= 0 ? nextIndex : Math.min(page, next.pageCount - 1));
        const selection = pages.flatMap((entry, index) =>
          selectedIds.includes(entry.id) ? [index] : []
        );
        setSelectedPages(
          selection.length
            ? selection
            : [nextIndex >= 0 ? nextIndex : Math.min(page, next.pageCount - 1)]
        );
        setSelectedId(null);
        setFieldDialog(null);
        setPageDialog(null);
        setNativeTool('select');
        pageDrag.current = null;
      });
      return;
    }
    commit(next);
    setPage(nextIndex >= 0 ? nextIndex : Math.min(page, next.pageCount - 1));
    const selection = pdfPages(next).flatMap((entry, index) =>
      selectedIds.includes(entry.id) ? [index] : []
    );
    setSelectedPages(
      selection.length
        ? selection
        : [nextIndex >= 0 ? nextIndex : Math.min(page, next.pageCount - 1)]
    );
    setSelectedId(null);
    setFieldDialog(null);
    setPageDialog(null);
    setTool('select');
    pageDrag.current = null;
  };
  const pageOperation = (operation: () => StudioPdfDocument) => {
    if (!canModifyRef.current || !canManagePages) return;
    try {
      commitPages(operation());
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : '页面操作失败。');
    }
  };
  const openPageDialog = (action: PdfPageAction) => {
    if (!canModify || !canManagePages) return;
    setPageDialog({
      action,
      snapshot: documentRef.current,
      selection: selectedPages.filter((index) => index < pdfDocument.pageCount),
      source,
      renderer: pdfRenderer,
      session: activeLoaded?.session,
    });
  };
  const openComposition = (mode: 'merge' | 'extract') => {
    if (
      !canModify ||
      !canManagePages ||
      !source ||
      !pdfRenderer ||
      !pdfComposer ||
      !onPdfSourceChange ||
      !activeLoaded
    )
      return;
    const invalid = Object.entries(dateDraftRef.current)
      .map(([name, value]) => {
        const field = documentRef.current.fields.find((entry) => entry.name === name);
        return field && pdfFieldIssue({ ...field, value }, documentRef.current.pageCount);
      })
      .find(Boolean);
    if (invalid) {
      setNotice(invalid);
      return;
    }
    fieldEdit.current = null;
    setComposeDialog({
      mode,
      snapshot: { document: documentRef.current, source },
      selection: selectedPages.length ? [...selectedPages] : [page],
      currentPage: page,
      renderer: pdfRenderer,
      session: activeLoaded.session,
      composer: pdfComposer,
    });
  };
  const closeComposition = () => {
    composeTask.current?.abort();
    composeTask.current = null;
    setComposeBusy(false);
    setComposeDialog(null);
  };
  const applyComposition = async (
    options: Omit<StudioPdfComposeRequest, 'snapshot' | 'signal'>
  ) => {
    const dialog = composeDialog;
    if (!dialog || composeTask.current) return;
    const unchanged = () =>
      documentRef.current === dialog.snapshot.document &&
      sourceRef.current === dialog.snapshot.source &&
      pdfRenderer === dialog.renderer &&
      pdfComposer === dialog.composer &&
      activeLoaded?.session === dialog.session &&
      canEditSourceRef.current;
    if (!unchanged()) throw new Error('当前 PDF 已变化，请重新打开页面组合窗口。');
    const controller = new AbortController();
    composeTask.current = controller;
    setComposeBusy(true);
    try {
      const result: StudioPdfComposeResult = await dialog.composer.compose({
        ...options,
        snapshot: dialog.snapshot,
        signal: controller.signal,
      });
      if (controller.signal.aborted || composeTask.current !== controller) return;
      if (!unchanged()) throw new Error('生成 PDF 期间当前内容或编辑权限已变化，结果未应用。');
      if (!pdfCompositionSnapshotValid(result, dialog.snapshot))
        throw new Error('PDF 组合适配器返回了不完整的原文件与模型。');
      if (!commitSnapshot(result)) throw new Error('当前宿主未接受 PDF 原文件与模型，结果未应用。');
      const previousPages = pdfPages(dialog.snapshot.document),
        nextPages = pdfPages(result.document);
      const currentId = previousPages[dialog.currentPage]?.id;
      const nextPage = nextPages.findIndex((entry) => entry.id === currentId);
      setPage(nextPage >= 0 ? nextPage : 0);
      const selectedIds = new Set(dialog.selection.map((index) => previousPages[index]?.id));
      const nextSelection = nextPages.flatMap((entry, index) =>
        selectedIds.has(entry.id) ? [index] : []
      );
      setSelectedPages(nextSelection.length ? nextSelection : [nextPage >= 0 ? nextPage : 0]);
      setSelectedId(null);
      setDateDrafts({});
      fieldEdit.current = null;
      setComposeDialog(null);
      setTool('select');
      setNotice(
        result.warnings?.join('；') ||
          (options.mode === 'merge' ? 'PDF 文件已合并。' : 'PDF 页面已提取。')
      );
    } finally {
      if (composeTask.current === controller) {
        composeTask.current = null;
        setComposeBusy(false);
      }
    }
  };
  const changeField = (name: string, value: string | boolean) => {
    const current = documentRef.current;
    const field = current.fields.find((entry) => entry.name === name);
    if (!canModify || !field || field.readOnly || field.value === value) return;
    const nextField = { ...field, value };
    if (field.design) {
      const issue = pdfFieldIssue(nextField, current.pageCount);
      if (issue) {
        setNotice(issue);
        return;
      }
    }
    const editing = fieldEdit.current?.name === name ? fieldEdit.current : null;
    commit(
      {
        ...current,
        fields: current.fields.map((entry) => (entry.name === name ? nextField : entry)),
      },
      !editing?.saved
    );
    if (editing) editing.saved = true;
  };
  const clearDateDraft = (name: string) => {
    setDateDrafts((current) => {
      const next = { ...current };
      delete next[name];
      return next;
    });
  };
  const commitDate = (name: string) => {
    const value = dateDraftRef.current[name];
    const field = documentRef.current.fields.find((entry) => entry.name === name);
    if (value === undefined || !field || !canModify || field.readOnly) return;
    const issue = pdfFieldIssue({ ...field, value }, documentRef.current.pageCount);
    if (issue) {
      setNotice(issue);
      return;
    }
    changeField(name, value);
    clearDateDraft(name);
  };
  const dateInput = (field: StudioPdfField, label: string, overlay = false) => {
    const value = dateDrafts[field.name] ?? String(field.value);
    const issue = pdfFieldIssue({ ...field, value }, pdfDocument.pageCount);
    return (
      <Input
        className={overlay ? 'zuvi-studio-pdf-widget-input' : undefined}
        classNames={overlay ? { input: 'zuvi-studio-pdf-widget-value' } : undefined}
        size="sm"
        aria-label={label}
        placeholder="YYYY-MM-DD"
        inputMode="numeric"
        value={value}
        disabled={!canModify || field.readOnly}
        maxLength={10}
        aria-invalid={!!issue}
        data-studio-input-error={issue}
        onChange={(event) => {
          if (!canModify || field.readOnly) return;
          const next = { ...dateDraftRef.current, [field.name]: event.target.value };
          dateDraftRef.current = next;
          setDateDrafts(next);
        }}
        onBlur={() => commitDate(field.name)}
        onKeyDown={(event) => {
          if (isImeComposing(event.nativeEvent)) return;
          if (event.key === 'Enter') {
            event.preventDefault();
            commitDate(field.name);
          }
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            clearDateDraft(field.name);
            setNotice('');
          }
        }}
      />
    );
  };
  const changeSelections = (field: StudioPdfField, selectedValues: string[]) => {
    if (!canModify || field.readOnly) return;
    const next = { ...field, selectedValues, value: selectedValues[0] || '' };
    const issue = pdfFieldIssue(next, pdfDocument.pageCount);
    if (issue) {
      setNotice(issue);
      return;
    }
    commit({
      ...documentRef.current,
      fields: documentRef.current.fields.map((entry) => (entry.name === field.name ? next : entry)),
    });
  };
  const readFieldImage = (field: StudioPdfField, file?: File) => {
    if (!file || !canModify || field.readOnly) return;
    if (!/^image\/(png|jpeg)$/.test(file.type) || file.size > 8 * 1024 * 1024) {
      setNotice('图片字段支持 8 MiB 以内的 PNG/JPEG。');
      return;
    }
    const documentId = pdfDocument.id;
    const reader = new FileReader();
    reader.onload = () => {
      if (
        documentRef.current.id !== documentId ||
        !canModifyRef.current ||
        documentRef.current.fields.find((entry) => entry.name === field.name)?.readOnly
      )
        return;
      changeField(field.name, String(reader.result));
    };
    reader.onerror = () => setNotice('图片读取失败。');
    reader.readAsDataURL(file);
  };
  const changeMark = (
    id: string,
    update: Partial<StudioPdfMark>,
    fit = false,
    addHistory = true
  ) => {
    if (!canModify) return;
    const current = documentRef.current;
    const mark = current.marks.find((entry) => entry.id === id);
    if (!mark || mark.nativeId) return;
    let next: StudioPdfMark | undefined = {
      ...translateMark(mark, update.x ?? mark.x, update.y ?? mark.y),
      ...update,
    };
    if (fit && view && mark.page === page) next = fitMark(next, view);
    if (!next) {
      setNotice('这段标注超过页面范围，请缩小字号、缩短文字或换行。');
      return;
    }
    commit(
      { ...current, marks: current.marks.map((entry) => (entry.id === id ? next! : entry)) },
      addHistory
    );
  };
  const removeMark = (id: string) => {
    if (!canModify) return;
    const current = documentRef.current;
    if (current.marks.find((mark) => mark.id === id)?.nativeId) return;
    commit({ ...current, marks: current.marks.filter((entry) => entry.id !== id) });
    if (selectedId === id) setSelectedId(null);
  };
  const addReply = (markId: string) => {
    if (!canModify) return;
    const draft = replyDraft.trim();
    if (!draft) return;
    const current = documentRef.current;
    const mark = current.marks.find((entry) => entry.id === markId);
    if (!mark || mark.nativeId) return;
    if ((mark.replies?.length ?? 0) >= 99) {
      setNotice('每个标注最多 99 条回复，请先删除部分回复。');
      return;
    }
    commit({
      ...current,
      marks: current.marks.map((entry) =>
        entry.id === markId
          ? {
              ...entry,
              replies: [
                ...(entry.replies ?? []),
                { id: crypto.randomUUID(), text: draft.slice(0, 2000) },
              ],
            }
          : entry
      ),
    });
    setReplyDraft('');
  };
  const removeReply = (markId: string, replyId: string) => {
    if (!canModify) return;
    const current = documentRef.current;
    if (current.marks.find((mark) => mark.id === markId)?.nativeId) return;
    commit({
      ...current,
      marks: current.marks.map((entry) =>
        entry.id === markId
          ? { ...entry, replies: (entry.replies ?? []).filter((reply) => reply.id !== replyId) }
          : entry
      ),
    });
  };
  const eventPoint = (clientX: number, clientY: number): [number, number] | undefined => {
    if (!view || !paper.current) return;
    const box = paper.current.getBoundingClientRect();
    if (box.width <= 0 || box.height <= 0) return;
    return view.toPdfPoint(
      ((clientX - box.left) * view.width) / box.width,
      ((clientY - box.top) * view.height) / box.height
    );
  };
  const addMark = (point: [number, number]) => {
    if (!canModify || !view || (tool !== 'text' && tool !== 'highlight')) return;
    if (tool === 'text' && !text.trim()) {
      setNotice('先在右侧填写文字，再点击页面放置。');
      setInspector(true);
      setPanel('marks');
      return;
    }
    const bounds = visibleBounds(view);
    const mark = fitMark(
      {
        id: crypto.randomUUID(),
        page,
        type: tool,
        x: point[0],
        y: tool === 'highlight' ? point[1] - 9 : point[1],
        text: tool === 'text' ? text : '',
        size,
        color: tool === 'text' ? ink : highlight,
        ...(tool === 'highlight'
          ? { width: Math.min(120, bounds.right - bounds.left - 8), height: 18 }
          : {}),
      },
      view
    );
    if (!mark) {
      setNotice('这段标注超过页面范围，请缩小字号、缩短文字或换行。');
      return;
    }
    const current = documentRef.current;
    if (current.marks.length >= 2000) {
      setNotice('当前文档最多支持 2000 个标注，请删除部分内容后继续。');
      return;
    }
    commit({ ...current, marks: [...current.marks, mark] });
    setSelectedId(mark.id);
    setTool('select');
  };

  const startSearch = () => {
    setSearchRequest((request) => ({ text: query, version: request.version + 1 }));
  };
  const selectResult = (index: number) => {
    const result = searchResults[index];
    if (disabled || !result) return;
    setSearchIndex(index);
    setPage(result.page);
    setSelectedId(null);
    setTool('select');
  };
  const setDraft = (next: Drawing | null) => {
    drawingRef.current = next;
    setDrawing(next);
  };
  const drawingPoint = (point: [number, number]): [number, number] => {
    const box = visibleBounds(view!);
    const padding = Math.max(4, lineWidth / 2 + 1);
    return [
      Math.max(box.left + padding, Math.min(box.right - padding, point[0])),
      Math.max(box.bottom + padding, Math.min(box.top - padding, point[1])),
    ];
  };
  const extendDrawing = (pointer: number, point: [number, number]) => {
    const current = drawingRef.current;
    if (!canModify || !view || !current || current.pointer !== pointer) return;
    const nextPoint = drawingPoint(point);
    if (current.type === 'rectangle') {
      setDraft({ ...current, points: [current.points[0], nextPoint] });
      return;
    }
    const last = current.points[current.points.length - 1];
    if (Math.hypot(nextPoint[0] - last[0], nextPoint[1] - last[1]) < 0.5) return;
    if (current.points.length >= 10000) {
      setNotice('单条笔迹最多包含 10,000 个坐标，请松开后继续绘制。');
      return;
    }
    setDraft({ ...current, points: [...current.points, nextPoint] });
  };
  const finishDrawing = (pointer: number) => {
    const current = drawingRef.current;
    if (!canModify || !view || !current || current.pointer !== pointer) return;
    setDraft(null);
    suppressClick.current = true;
    const mark = drawingMark(current, page, lineWidth, ink);
    if (
      current.points.length < 2 ||
      (mark.type === 'rectangle' && ((mark.width ?? 0) < 2 || (mark.height ?? 0) < 2))
    )
      return;
    mark.id = crypto.randomUUID();
    const model = documentRef.current;
    if (
      model.marks.length >= 2000 ||
      model.marks.reduce((total, entry) => total + (entry.points?.length ?? 0), 0) +
        (mark.points?.length ?? 0) >
        100_000
    ) {
      setNotice('标注或笔迹数量已达到当前文档上限，请删除部分内容后继续。');
      return;
    }
    commit({ ...model, marks: [...model.marks, mark] });
    setSelectedId(mark.id);
    setInspector(true);
    setPanel('marks');
  };
  const previewMark = drawing ? drawingMark(drawing, page, lineWidth, ink) : null;

  const overlayField = (
    field: StudioPdfField,
    widget: NonNullable<StudioPdfField['widgets']>[number],
    index: number
  ) => {
    if (!view || field.type === 'opaque') return null;
    const matrix = pdfMatrix(view, widget.x, widget.y + widget.height);
    const locked = !canModify || field.readOnly;
    const label = `PDF 页面表单 ${field.name}${widget.option === undefined ? '' : ` ${widget.option}`}`;
    const kind = pdfFieldKind(field);
    return (
      <div
        key={`${field.name}-${index}`}
        className="zuvi-studio-pdf-widget"
        data-field={field.name}
        style={{
          width: widget.width,
          height: widget.height,
          transform: `matrix(${matrix.join(',')})`,
        }}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div
          className="zuvi-studio-pdf-widget-content"
          data-designed={!!field.design || undefined}
          style={{
            ...widgetContentStyle(widget),
            ...(field.design
              ? {
                  fontSize: field.design.fontSize,
                  color: field.design.textColor,
                  background: field.design.background,
                  border: `${field.design.borderWidth ?? 1}px solid ${field.design.borderColor || '#8898a3'}`,
                }
              : {}),
          }}
          title={field.design?.tooltip}
        >
          {widget.option !== undefined ? (
            <Radio
              className="zuvi-studio-pdf-widget-check"
              aria-label={label}
              value={widget.option}
              disabled={locked}
            />
          ) : field.type === 'checkbox' ? (
            <Checkbox
              className="zuvi-studio-pdf-widget-check"
              aria-label={label}
              name={`${formId}-${field.name}`}
              checked={Boolean(field.value)}
              disabled={locked}
              onChange={(checked) => changeField(field.name, checked)}
            />
          ) : kind === 'image' ? (
            <label className="zuvi-studio-pdf-image-field">
              {field.value ? (
                <img src={String(field.value)} alt={field.name} />
              ) : (
                <span>选择图片</span>
              )}
              <input
                type="file"
                accept="image/png,image/jpeg"
                aria-label={label}
                disabled={locked}
                onChange={(event) => readFieldImage(field, event.target.files?.[0])}
              />
            </label>
          ) : kind === 'list' ? (
            <div className="zuvi-studio-pdf-list-field" role="group" aria-label={label}>
              {(field.options || []).map((option) => (
                <Checkbox
                  key={option}
                  label={field.design?.optionLabels?.[option] ?? field.optionLabels?.[option] ?? option}
                  checked={(
                    field.selectedValues || (field.value ? [String(field.value)] : [])
                  ).includes(option)}
                  disabled={locked}
                  onChange={(checked) =>
                    changeSelections(
                      field,
                      field.design?.multiSelect || field.multiSelect
                        ? checked
                          ? [...(field.selectedValues || []), option]
                          : (field.selectedValues || []).filter((value) => value !== option)
                        : checked
                          ? [option]
                          : []
                    )
                  }
                />
              ))}
            </div>
          ) : field.type === 'choice' ? (
            <Select
              className="zuvi-studio-pdf-widget-input"
              classNames={{ trigger: 'zuvi-studio-pdf-widget-value' }}
              size="sm"
              aria-label={label}
              name={`${formId}-${field.name}`}
              disabled={locked}
              value={String(field.value)}
              placeholder="未选择"
              options={[
                { value: '', label: '未选择' },
                ...(field.options ?? []).map((option) => ({
                  value: option,
                  label: field.design?.optionLabels?.[option] ?? field.optionLabels?.[option] ?? option,
                })),
              ]}
              onChange={(value) => changeField(field.name, value)}
            />
          ) : kind === 'date' ? (
            dateInput(field, label, true)
          ) : field.multiline ? (
            <Input.Textarea
              className="zuvi-studio-pdf-widget-input"
              classNames={{ textarea: 'zuvi-studio-pdf-widget-value' }}
              size="sm"
              aria-label={label}
              disabled={locked}
              value={String(field.value)}
              maxLength={field.design?.maxLength ?? 10_000}
              onFocus={() => {
                fieldEdit.current = { name: field.name, saved: false };
              }}
              onBlur={() => {
                fieldEdit.current = null;
              }}
              onChange={(event) => changeField(field.name, event.target.value)}
            />
          ) : (
            <Input
              className="zuvi-studio-pdf-widget-input"
              classNames={{ input: 'zuvi-studio-pdf-widget-value' }}
              size="sm"
              aria-label={label}
              disabled={locked}
              value={String(field.value)}
              maxLength={field.design?.maxLength ?? 10_000}
              onFocus={() => {
                fieldEdit.current = { name: field.name, saved: false };
              }}
              onBlur={() => {
                fieldEdit.current = null;
              }}
              onChange={(event) => changeField(field.name, event.target.value)}
            />
          )}
        </div>
      </div>
    );
  };

  const markToolButton = (next: Exclude<Tool, 'select'>) => (
    <Button
      size="sm"
      variant="ghost"
      className="zuvi-studio-pdf-ribbon-tool"
      iconStart={next === 'text' ? <Type /> : next === 'rectangle' ? <Maximize /> : <Edit />}
      aria-pressed={
        pdfAnnotations
          ? nativeTool ===
            (
              { text: 'freeText', rectangle: 'square', highlight: 'highlight', ink: 'ink' } as const
            )[next]
          : tool === next
      }
      disabled={pdfAnnotations ? !canModifyNative : !canModify}
      onClick={() => {
        setTool(next);
        setTextSelectionMode(false);
        if (pdfAnnotations)
          setNativeTool(
            (
              { text: 'freeText', rectangle: 'square', highlight: 'highlight', ink: 'ink' } as const
            )[next]
          );
        setSelectedId(null);
        setInspector(true);
        setPanel('marks');
      }}
    >
      {markNames[next]}
    </Button>
  );
  const nativeToolButton = (next: PdfNativeTool) => (
    <Button
      size="sm"
      variant="ghost"
      className="zuvi-studio-pdf-ribbon-tool"
      aria-pressed={nativeTool === next}
      disabled={!canModifyNative}
      onPointerDown={(event) => event.preventDefault()}
      onClick={() => {
        setNativeTool(next);
        setTextSelectionMode(false);
        setSelectedId(null);
        setPanel('marks');
        setInspector(true);
      }}
    >
      {PDF_NATIVE_LABELS[next]}
    </Button>
  );

  return (
    <div
      className="zuvi-studio-pdf"
      data-inspector={inspector ? 'open' : 'closed'}
      onKeyDown={(event) => {
        if (disabled || isImeComposing(event.nativeEvent)) return;
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
          event.preventDefault();
          setInspector(true);
          setPanel('search');
          searchInput.current?.focus();
        }
        if (event.key === 'Escape') {
          setDraft(null);
          setTool('select');
          setNativeTool('select');
          setTextSelectionMode(false);
        }
        const target = event.target as HTMLElement;
        if (target.closest('input, textarea, select, [contenteditable="true"]')) return;
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
          event.preventDefault();
          stepHistory(event.shiftKey ? 'redo' : 'undo');
        }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
          event.preventDefault();
          stepHistory('redo');
        }
      }}
    >
      {Object.entries(dateDrafts).map(([name, value]) => {
        const field = pdfDocument.fields.find((entry) => entry.name === name);
        const issue = field && pdfFieldIssue({ ...field, value }, pdfDocument.pageCount);
        return issue ? <span key={name} hidden data-studio-input-error={issue} /> : null;
      })}
      <Tabs
        value={ribbon}
        onValueChange={setRibbon}
        className="zuvi-studio-ribbon zuvi-studio-pdf-ribbon"
      >
        <StudioRibbonTabs>
          <Tabs.List aria-label="PDF 功能区选项卡">
            <Tabs.Trigger value="home" disabled={disabled}>
              开始
            </Tabs.Trigger>
            <Tabs.Trigger value="comment" disabled={disabled}>
              批注
            </Tabs.Trigger>
          </Tabs.List>
        </StudioRibbonTabs>
        <div className="zuvi-studio-pdf-ribbon-controls" role="group" aria-label="PDF 编辑工具栏">
          <div className="zuvi-studio-pdf-ribbon-group" role="group" aria-label="编辑">
            <div className="zuvi-studio-pdf-ribbon-group-body">
              <div className="zuvi-studio-pdf-ribbon-stack">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!canModify || !pastRef.current.length}
                  onClick={() => stepHistory('undo')}
                >
                  撤销
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!canModify || !futureRef.current.length}
                  onClick={() => stepHistory('redo')}
                >
                  重做
                </Button>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="zuvi-studio-pdf-ribbon-tool"
                iconStart={<Navigation />}
                aria-pressed={
                  !textSelectionMode &&
                  (pdfAnnotations ? nativeTool === 'select' : tool === 'select')
                }
                disabled={disabled}
                onClick={() => {
                  setTool('select');
                  setNativeTool('select');
                  setTextSelectionMode(false);
                }}
              >
                选择
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="zuvi-studio-pdf-ribbon-tool"
                iconStart={<Type />}
                aria-pressed={textSelectionMode}
                disabled={disabled || !view || !activeLoaded?.session.renderTextLayer}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => {
                  setTool('select');
                  setNativeTool('select');
                  setSelectedId(null);
                  setTextSelectionMode(true);
                  paper.current?.querySelector<HTMLElement>('.zuvi-studio-pdf-text-layer')?.focus();
                }}
              >
                选择文字
              </Button>
            </div>
            <span className="zuvi-studio-pdf-ribbon-caption" aria-hidden="true">
              编辑
            </span>
          </div>
          <Tabs.Panel value="home" className="zuvi-studio-pdf-ribbon-panel">
            <div className="zuvi-studio-pdf-ribbon-group" role="group" aria-label="插入">
              <div className="zuvi-studio-pdf-ribbon-group-body">
                {markToolButton('text')}
                {markToolButton('rectangle')}
                <Button
                  size="sm"
                  variant="ghost"
                  className="zuvi-studio-pdf-ribbon-tool"
                  disabled={!canModify || !view}
                  onClick={() => {
                    setFieldDialog({});
                    setPanel('fields');
                    setInspector(true);
                  }}
                >
                  新建表单字段
                </Button>
              </div>
              <span className="zuvi-studio-pdf-ribbon-caption" aria-hidden="true">
                插入
              </span>
            </div>
            <div className="zuvi-studio-pdf-ribbon-group" role="group" aria-label="页面">
              <div className="zuvi-studio-pdf-ribbon-group-body">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!canModify || !canManagePages || pdfDocument.pageCount >= 200}
                  onClick={() => openPageDialog('insert')}
                >
                  插入空白页
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={
                    !canModify ||
                    !canManagePages ||
                    !selectedPages.length ||
                    selectedPages.length >= pdfDocument.pageCount
                  }
                  onClick={() =>
                    pageOperation(() => pdfRemovePages(documentRef.current, selectedPages))
                  }
                >
                  删除所选页
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!canModify || !canManagePages || !selectedPages.length}
                  onClick={() => openPageDialog('move')}
                >
                  移动所选页
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={
                    !canModify ||
                    !canManagePages ||
                    !selectedPages.length ||
                    pdfDocument.pageCount + selectedPages.length > 200
                  }
                  onClick={() => openPageDialog('copy')}
                >
                  复制所选页
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={
                    !canModify ||
                    !canManagePages ||
                    !pdfComposer ||
                    !onPdfSourceChange ||
                    pdfDocument.pageCount >= 200
                  }
                  onClick={() => openComposition('merge')}
                >
                  合并 PDF 文件
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!canModify || !canManagePages || !pdfComposer || !onPdfSourceChange}
                  onClick={() => openComposition('extract')}
                >
                  提取 PDF 页面
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!canModify || !canManagePages || !selectedPages.length}
                  onClick={() =>
                    pageOperation(() => pdfRotatePages(documentRef.current, selectedPages, 90))
                  }
                >
                  旋转所选页
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!canModify || !canManagePages || !selectedPages.length}
                  onClick={() => openPageDialog('resize')}
                >
                  页面尺寸
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="zuvi-studio-pdf-ribbon-tool"
                  iconStart={<RotateCcw />}
                  disabled={!canModify}
                  onClick={() => {
                    if (pdfAnnotations) {
                      pageOperation(() => pdfRotatePages(documentRef.current, [page], 90));
                      return;
                    }
                    const current = documentRef.current;
                    commit({
                      ...current,
                      rotations: {
                        ...current.rotations,
                        [String(page)]: (((rotation + 90) % 360) + 360) % 360,
                      },
                    });
                  }}
                >
                  旋转当前页
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="zuvi-studio-pdf-ribbon-tool"
                  iconStart={<FileText />}
                  disabled={disabled || !activeLoaded}
                  aria-pressed={panel === 'pages' && inspector}
                  onClick={() => {
                    setInspector(true);
                    setPanel('pages');
                  }}
                >
                  页面
                </Button>
              </div>
              <span className="zuvi-studio-pdf-ribbon-caption" aria-hidden="true">
                页面
              </span>
            </div>
            <div className="zuvi-studio-pdf-ribbon-group" role="group" aria-label="查看">
              <div className="zuvi-studio-pdf-ribbon-group-body">
                <Button
                  size="sm"
                  variant="ghost"
                  className="zuvi-studio-pdf-ribbon-tool"
                  iconStart={<Search />}
                  disabled={disabled || !activeLoaded?.session.search}
                  aria-pressed={panel === 'search' && inspector}
                  onClick={() => {
                    setInspector(true);
                    setPanel('search');
                  }}
                >
                  查找
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="zuvi-studio-pdf-ribbon-tool"
                  aria-label="PDF 批注与表单侧栏"
                  aria-pressed={inspector}
                  iconStart={<Settings />}
                  disabled={disabled}
                  onClick={() => setInspector((value) => !value)}
                >
                  侧栏
                </Button>
              </div>
              <span className="zuvi-studio-pdf-ribbon-caption" aria-hidden="true">
                查看
              </span>
            </div>
          </Tabs.Panel>
          <Tabs.Panel value="comment" className="zuvi-studio-pdf-ribbon-panel">
            <div className="zuvi-studio-pdf-ribbon-group" role="group" aria-label="批注工具">
              <div className="zuvi-studio-pdf-ribbon-group-body">
                {markToolButton('text')}
                {markToolButton('highlight')}
                {pdfAnnotations && (
                  <>
                    {nativeToolButton('note')}
                    {nativeToolButton('underline')}
                    {nativeToolButton('strikeOut')}
                    {nativeToolButton('squiggly')}
                  </>
                )}
              </div>
              <span className="zuvi-studio-pdf-ribbon-caption" aria-hidden="true">
                批注
              </span>
            </div>
            <div className="zuvi-studio-pdf-ribbon-group" role="group" aria-label="绘图与签名">
              <div className="zuvi-studio-pdf-ribbon-group-body">
                {markToolButton('rectangle')}
                {markToolButton('ink')}
                {pdfAnnotations && (
                  <>
                    {nativeToolButton('circle')}
                    {nativeToolButton('line')}
                    {nativeToolButton('arrow')}
                    {nativeToolButton('polygon')}
                    {nativeToolButton('polyLine')}
                  </>
                )}
              </div>
              <span className="zuvi-studio-pdf-ribbon-caption" aria-hidden="true">
                绘图与签名
              </span>
            </div>
            <div className="zuvi-studio-pdf-ribbon-group" role="group" aria-label="显示批注">
              <div className="zuvi-studio-pdf-ribbon-group-body">
                <Button
                  size="sm"
                  variant="ghost"
                  className="zuvi-studio-pdf-ribbon-tool"
                  iconStart={<MessageCircle />}
                  disabled={disabled}
                  aria-pressed={panel === 'marks' && inspector}
                  onClick={() => {
                    setInspector(true);
                    setPanel('marks');
                  }}
                >
                  批注列表
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="zuvi-studio-pdf-ribbon-tool"
                  iconStart={<Settings />}
                  disabled={disabled}
                  aria-label="PDF 批注与表单侧栏"
                  aria-pressed={inspector}
                  onClick={() => setInspector((value) => !value)}
                >
                  侧栏
                </Button>
              </div>
              <span className="zuvi-studio-pdf-ribbon-caption" aria-hidden="true">
                显示
              </span>
            </div>
          </Tabs.Panel>
        </div>
      </Tabs>

      {(visibleError || notice) && (
        <div className="zuvi-studio-pdf-alert" role="alert">
          <span>{visibleError || notice}</span>
          {visibleError && (
            <Button
              size="sm"
              variant="ghost"
              disabled={disabled}
              onClick={() => setRetry((value) => value + 1)}
            >
              重新加载
            </Button>
          )}
        </div>
      )}
      <div className="zuvi-studio-pdf-workspace">
        <nav className="zuvi-studio-pdf-side-navigation" aria-label="PDF 侧边导航">
          {(['search', 'marks', 'pages', 'fields'] as const).map((value) => {
            const Icon = panelIcons[value];
            const pressed = inspector && panel === value;
            return (
              <Button
                key={value}
                size="sm"
                variant="ghost"
                iconStart={<Icon />}
                aria-label={panelLabels[value]}
                title={panelLabels[value]}
                aria-pressed={pressed}
                aria-controls={panelId}
                disabled={
                  disabled ||
                  (value === 'search' && !activeLoaded?.session.search) ||
                  (value === 'pages' && !activeLoaded)
                }
                onClick={() => {
                  if (pressed) setInspector(false);
                  else {
                    setInspector(true);
                    setPanel(value);
                  }
                }}
              />
            );
          })}
        </nav>
        <div
          className="zuvi-studio-pdf-viewport"
          role="region"
          aria-label="PDF 页面编辑区"
          tabIndex={0}
          aria-busy={
            !!source &&
            !!pdfRenderer &&
            (!view || (!!pdfAnnotations && !currentNative) || nativeBusy) &&
            !visibleError
          }
        >
          {!source || !pdfRenderer ? (
            <div className="zuvi-studio-pdf-placeholder">
              <Type />
              <strong>{source ? 'PDF 预览暂不可用' : '导入 PDF 开始编辑'}</strong>
              <span>全文搜索、文字与绘图批注、旋转页面和表单填写</span>
            </div>
          ) : (
            <>
              {!view && !visibleError && (
                <div className="zuvi-studio-pdf-loading" role="status">
                  正在加载第 {page + 1} 页…
                </div>
              )}
              <div
                ref={paper}
                className="zuvi-studio-pdf-paper"
                data-tool={pdfAnnotations ? nativeTool : tool}
                data-text-selection={textSelectionMode || undefined}
                style={{
                  width: view?.width ?? rendered?.result.width ?? 595,
                  height: view?.height ?? rendered?.result.height ?? 842,
                  visibility: view ? 'visible' : 'hidden',
                }}
                onClick={(event) => {
                  if (pdfAnnotations) {
                    if (nativeTool === 'select') setSelectedId(null);
                    return;
                  }
                  if (suppressClick.current) {
                    suppressClick.current = false;
                    return;
                  }
                  if (tool === 'select') {
                    setSelectedId(null);
                    return;
                  }
                  const point = eventPoint(event.clientX, event.clientY);
                  if (point) addMark(point);
                }}
                onPointerDown={(event) => {
                  if (pdfAnnotations) return;
                  if (
                    !canModify ||
                    !view ||
                    event.button !== 0 ||
                    (tool !== 'rectangle' && tool !== 'ink')
                  )
                    return;
                  const point = eventPoint(event.clientX, event.clientY);
                  if (!point) return;
                  event.preventDefault();
                  event.currentTarget.setPointerCapture?.(event.pointerId);
                  setDraft({ pointer: event.pointerId, type: tool, points: [drawingPoint(point)] });
                }}
                onPointerMove={(event) => {
                  if (pdfAnnotations) return;
                  const point = eventPoint(event.clientX, event.clientY);
                  if (point) extendDrawing(event.pointerId, point);
                }}
                onPointerUp={(event) => {
                  if (pdfAnnotations) return;
                  const point = eventPoint(event.clientX, event.clientY);
                  if (point) extendDrawing(event.pointerId, point);
                  finishDrawing(event.pointerId);
                  if (event.currentTarget.hasPointerCapture?.(event.pointerId))
                    event.currentTarget.releasePointerCapture(event.pointerId);
                }}
                onPointerCancel={() => setDraft(null)}
              >
                <canvas ref={canvas} role="img" aria-label={`PDF 第 ${page + 1} 页原文`} />
                {view && (
                  <>
                    {activeLoaded?.session.renderTextLayer && (
                      <StudioPdfTextLayer
                        session={activeLoaded.session}
                        page={page}
                        scale={zoom}
                        rotation={rotation}
                        descriptor={descriptor}
                        disabled={disabled}
                        onSelection={setNativeSelection}
                      />
                    )}
                    {activeLoaded?.session.renderAnnotationLayer && (
                      <StudioPdfAnnotationPaintLayer
                        session={activeLoaded.session}
                        page={page}
                        scale={zoom}
                        rotation={rotation}
                        descriptor={descriptor}
                        canvas={canvas.current}
                        disabled={disabled || textSelectionMode}
                        onSelect={selectNative}
                        annotations={
                          currentPreview?.annotations ??
                          currentNative?.snapshot.annotations.map((annotation) => ({
                            id: annotation.id,
                            key: annotation.native?.key,
                            flags: annotation.native?.flags,
                          }))
                        }
                      />
                    )}
                    {pdfAnnotations && currentNative && (
                      <StudioPdfNativeLayer
                        annotations={currentNative.snapshot.annotations}
                        pageId={pdfPages(pdfDocument)[page].id}
                        view={view}
                        tool={nativeTool}
                        selectedId={selectedId}
                        disabled={disabled || textSelectionMode}
                        canEdit={canModifyNative && !textSelectionMode}
                        ink={nativeStyle.ink}
                        marker={nativeStyle.marker}
                        lineWidth={Number(nativeStyle.lineWidth) || 0}
                        paintReferences={currentPreview?.annotations}
                        onSelect={selectNative}
                        onCreate={createNative}
                        onPatch={patchNative}
                        onRemove={removeNative}
                        onProperties={openNativeProperties}
                      />
                    )}
                    <svg
                      className="zuvi-studio-pdf-annotations"
                      viewBox={`0 0 ${view.width} ${view.height}`}
                      aria-label="PDF 页面标注"
                      onPointerMove={(event) => {
                        const current = drag.current;
                        const point = eventPoint(event.clientX, event.clientY);
                        if (canModify && current && point && event.pointerId === current.pointer) {
                          if (!current.saved) {
                            remember(current.snapshot);
                            current.saved = true;
                          }
                          if (current.mode === 'resize') {
                            const top = current.mark.y + (current.mark.height ?? 18);
                            const bottom = Math.min(top - 2, point[1]);
                            changeMark(
                              current.mark.id,
                              {
                                width: Math.max(2, point[0] - current.mark.x),
                                y: bottom,
                                height: top - bottom,
                              },
                              true,
                              false
                            );
                          } else {
                            changeMark(
                              current.mark.id,
                              {
                                x: current.mark.x + point[0] - current.point[0],
                                y: current.mark.y + point[1] - current.point[1],
                              },
                              true,
                              false
                            );
                          }
                        }
                      }}
                      onPointerUp={(event) => {
                        if (drag.current?.pointer === event.pointerId) drag.current = null;
                      }}
                      onPointerCancel={() => {
                        drag.current = null;
                      }}
                    >
                      {searchResults.map((result, index) =>
                        result.page === page ? (
                          <g
                            key={`search-${index}`}
                            transform={`matrix(${pdfMatrix(view, result.rect.x, result.rect.y).join(' ')})`}
                            className="zuvi-studio-pdf-search-hit"
                            aria-hidden="true"
                          >
                            <rect
                              x={0}
                              y={-result.rect.height}
                              width={result.rect.width}
                              height={result.rect.height}
                              fill={index === searchIndex ? '#f5ad31' : '#f5d86b'}
                              fillOpacity={index === searchIndex ? 0.4 : 0.2}
                              stroke={index === searchIndex ? '#d29112' : undefined}
                              strokeWidth={0.8}
                            />
                          </g>
                        ) : null
                      )}
                      {pdfDocument.marks
                        .filter((mark) => mark.page === page && !mark.nativeId)
                        .map((mark) => {
                          const dimensions = markDimensions(mark);
                          const selectedMark = mark.id === selectedId;
                          const matrix = pdfMatrix(view, mark.x, mark.y);
                          return (
                            <g
                              key={mark.id}
                              role="button"
                              tabIndex={disabled || textSelectionMode ? -1 : 0}
                              aria-label={`PDF ${markNames[mark.type]}标注 ${mark.text || mark.id}`}
                              aria-pressed={selectedMark}
                              data-selected={selectedMark || undefined}
                              data-mark={mark.id}
                              transform={`matrix(${matrix.join(' ')})`}
                              onClick={(event) => {
                                event.stopPropagation();
                                if (!disabled && !textSelectionMode) {
                                  setSelectedId(mark.id);
                                  setInspector(true);
                                  setPanel('marks');
                                }
                              }}
                              onPointerDown={(event) => {
                                event.stopPropagation();
                                if (disabled || textSelectionMode || tool !== 'select') return;
                                setSelectedId(mark.id);
                                const point = eventPoint(event.clientX, event.clientY);
                                if (canModify && point) {
                                  drag.current = {
                                    mode: 'move',
                                    pointer: event.pointerId,
                                    mark,
                                    point,
                                    snapshot: documentRef.current,
                                    saved: false,
                                  };
                                  event.currentTarget.parentElement?.setPointerCapture?.(
                                    event.pointerId
                                  );
                                  event.preventDefault();
                                }
                              }}
                              onKeyDown={(event) => {
                                if (
                                  disabled ||
                                  textSelectionMode ||
                                  isImeComposing(event.nativeEvent)
                                )
                                  return;
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  setSelectedId(mark.id);
                                  setInspector(true);
                                  setPanel('marks');
                                }
                                if (!canModify) return;
                                if (event.key === 'Delete' || event.key === 'Backspace') {
                                  event.preventDefault();
                                  removeMark(mark.id);
                                }
                                const arrows: Record<string, [number, number]> = {
                                  ArrowLeft: [-1, 0],
                                  ArrowRight: [1, 0],
                                  ArrowUp: [0, -1],
                                  ArrowDown: [0, 1],
                                };
                                const direction = arrows[event.key];
                                if (direction) {
                                  event.preventDefault();
                                  const origin = view.toViewportPoint(mark.x, mark.y);
                                  const step = event.shiftKey ? 10 : 1;
                                  const point = view.toPdfPoint(
                                    origin[0] + direction[0] * step,
                                    origin[1] + direction[1] * step
                                  );
                                  changeMark(mark.id, { x: point[0], y: point[1] }, true);
                                }
                              }}
                            >
                              <rect
                                className="zuvi-studio-pdf-mark-hit"
                                x={-2}
                                y={-dimensions.above - 2}
                                width={dimensions.width + 4}
                                height={dimensions.above + dimensions.below + 4}
                              />
                              {markContent(mark)}
                              {selectedMark &&
                                canModify &&
                                (mark.type === 'rectangle' || mark.type === 'highlight') && (
                                  <rect
                                    className="zuvi-studio-pdf-mark-resize"
                                    data-mark-resize={mark.id}
                                    aria-hidden="true"
                                    x={dimensions.width - 4}
                                    y={-4}
                                    width={8}
                                    height={8}
                                    rx={1.5}
                                    onPointerDown={(event) => {
                                      event.stopPropagation();
                                      const point = eventPoint(event.clientX, event.clientY);
                                      if (!point) return;
                                      drag.current = {
                                        mode: 'resize',
                                        pointer: event.pointerId,
                                        mark,
                                        point,
                                        snapshot: documentRef.current,
                                        saved: false,
                                      };
                                      event.currentTarget.ownerSVGElement?.setPointerCapture?.(
                                        event.pointerId
                                      );
                                      event.preventDefault();
                                    }}
                                  />
                                )}
                            </g>
                          );
                        })}
                      {previewMark && (
                        <g
                          transform={`matrix(${pdfMatrix(view, previewMark.x, previewMark.y).join(' ')})`}
                          className="zuvi-studio-pdf-drawing-preview"
                          aria-hidden="true"
                        >
                          {markContent(previewMark)}
                        </g>
                      )}
                    </svg>
                    <div className="zuvi-studio-pdf-form-layer">
                      {pdfDocument.fields.flatMap((field) => {
                        const widgets = (field.widgets ?? []).flatMap((widget, index) =>
                          widget.page === page ? [overlayField(field, widget, index)] : []
                        );
                        return widgets.length &&
                          field.widgets?.some((widget) => widget.option !== undefined)
                          ? [
                              <RadioGroup
                                key={JSON.stringify(['radio', field.name])}
                                className="zuvi-studio-pdf-widget-radio-group"
                                name={`${formId}-${field.name}`}
                                value={String(field.value)}
                                disabled={!canModify || field.readOnly}
                                aria-label={`PDF 页面单选表单 ${field.name}`}
                                onChange={(value) => changeField(field.name, value)}
                              >
                                {widgets}
                              </RadioGroup>,
                            ]
                          : widgets;
                      })}
                    </div>
                  </>
                )}
              </div>
              {view && (
                <span className="zuvi-studio-pdf-page-caption">
                  第 {page + 1} 页 · {Math.round(zoom * 100)}%
                </span>
              )}
            </>
          )}
        </div>

        {inspector && (
          <aside
            id={panelId}
            className="zuvi-studio-pdf-inspector"
            data-panel={panel}
            data-side={panel === 'pages' || panel === 'search' ? 'left' : 'right'}
            aria-label="PDF 批注与表单"
          >
            <div className="zuvi-studio-pdf-panel-switch" role="group" aria-label="PDF 侧栏内容">
              <Button
                size="sm"
                variant="ghost"
                aria-pressed={panel === 'marks'}
                onClick={() => setPanel('marks')}
                disabled={disabled}
              >
                批注 {markCount}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                aria-pressed={panel === 'fields'}
                onClick={() => setPanel('fields')}
                disabled={disabled}
              >
                表单 {pdfDocument.fields.length}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                aria-pressed={panel === 'search'}
                onClick={() => setPanel('search')}
                disabled={disabled || !activeLoaded?.session.search}
              >
                文本查找
              </Button>
              <Button
                size="sm"
                variant="ghost"
                aria-pressed={panel === 'pages'}
                disabled={disabled || !activeLoaded}
                onClick={() => setPanel('pages')}
              >
                页面缩略图
              </Button>
            </div>
            {panel === 'pages' ? (
              <div className="zuvi-studio-pdf-panel-body" aria-label="PDF 页面缩略导航">
                {activeLoaded &&
                  Array.from({ length: pdfDocument.pageCount }, (_, index) => (
                    <div
                      key={pageDescriptors?.[index]?.id ?? index}
                      className="zuvi-studio-pdf-page-item"
                      data-pdf-page-id={pageDescriptors?.[index]?.id ?? `source-${index}`}
                      data-pdf-page-index={index}
                      onDragStart={(event) => {
                        if (!canModifyRef.current || !canManagePages) return;
                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData('text/plain', 'zuvi-pdf-pages');
                        pageDrag.current = {
                          snapshot: documentRef.current,
                          selection: selectedPages.includes(index) ? selectedPages : [index],
                        };
                      }}
                      onDragOver={(event) => {
                        if (canModifyRef.current && canManagePages && pageDrag.current) {
                          event.preventDefault();
                          event.dataTransfer.dropEffect = 'move';
                        }
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        const dragged = pageDrag.current,
                          bounds = event.currentTarget.getBoundingClientRect();
                        const position =
                          index + (event.clientY >= bounds.top + bounds.height / 2 ? 1 : 0);
                        if (dragged && dragged.snapshot === documentRef.current)
                          pageOperation(() =>
                            pdfMovePages(documentRef.current, dragged.selection, position)
                          );
                        pageDrag.current = null;
                      }}
                      onDragEnd={() => {
                        pageDrag.current = null;
                      }}
                    >
                      <Checkbox
                        aria-label={`选择 PDF 第 ${index + 1} 页`}
                        checked={selectedPages.includes(index)}
                        disabled={disabled}
                        onChange={(checked) =>
                          setSelectedPages((previous) =>
                            checked
                              ? [...new Set([...previous, index])].sort((a, b) => a - b)
                              : previous.filter((entry) => entry !== index)
                          )
                        }
                      />
                      <PdfThumbnail
                        descriptor={renderDescriptors?.[index]}
                        loaded={activeLoaded}
                        page={index}
                        rotation={
                          (currentPreview
                            ? currentPreview.binding.rotations
                            : pdfDocument.rotations)[String(index)] ?? 0
                        }
                        currentPage={page}
                        draggable={canModify && canManagePages}
                        disabled={disabled}
                        onSelect={() => {
                          setPage(index);
                          setSelectedPages([index]);
                          setSelectedId(null);
                          setTool('select');
                        }}
                      />
                    </div>
                  ))}
              </div>
            ) : panel === 'search' ? (
              <div className="zuvi-studio-pdf-panel-body">
                <form
                  role="search"
                  aria-label="PDF 全文查找"
                  onSubmit={(event) => {
                    event.preventDefault();
                    startSearch();
                  }}
                >
                  <Input
                    ref={searchInput}
                    size="sm"
                    aria-label="PDF 查找文字"
                    placeholder="输入文档中的文字"
                    maxLength={256}
                    value={query}
                    disabled={disabled || !activeLoaded?.session.search}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={disabled || !query.trim() || !activeLoaded?.session.search}
                    aria-busy={searchBusy}
                    type="submit"
                  >
                    查找全部
                  </Button>
                </form>
                <div className="zuvi-studio-pdf-search-navigation">
                  <span role="status">
                    {searchBusy
                      ? '正在查找…'
                      : searchResults.length
                        ? `${searchIndex + 1} / ${searchResults.length}`
                        : searchRequest.text
                          ? '未找到文本'
                          : '支持原文 PDF 的文本查找'}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="PDF 上一个匹配"
                    disabled={disabled || !searchResults.length}
                    onClick={() =>
                      selectResult((searchIndex - 1 + searchResults.length) % searchResults.length)
                    }
                    iconStart={<ChevronLeft />}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="PDF 下一个匹配"
                    disabled={disabled || !searchResults.length}
                    onClick={() => selectResult((searchIndex + 1) % searchResults.length)}
                    iconStart={<ChevronRight />}
                  />
                </div>
                {searchError && <p role="alert">{searchError}</p>}
                <p className="zuvi-studio-pdf-hint">
                  点击结果跳转并标出文本所在位置。扫描图片页需要 OCR 才能查找文字。
                </p>
                {searchResults.length === 1000 && (
                  <p className="zuvi-studio-pdf-hint">最多显示前 1000 处匹配，请缩小查找范围。</p>
                )}
                <div className="zuvi-studio-pdf-mark-list" aria-label="PDF 查找结果">
                  {searchResults.map((result, index) => (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="zuvi-studio-pdf-list-item"
                      key={index}
                      disabled={disabled}
                      aria-pressed={index === searchIndex}
                      onClick={() => selectResult(index)}
                    >
                      <span>
                        <strong>
                          第 {result.page + 1} 页 · 匹配 {index + 1}
                        </strong>
                        <small>{result.text}</small>
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : panel === 'marks' ? (
              pdfAnnotations ? (
                <StudioPdfNativeInspector
                  snapshot={currentNative?.snapshot}
                  selectedId={selectedId}
                  tool={nativeTool}
                  style={nativeStyle}
                  disabled={disabled}
                  canEdit={canModifyNative}
                  busy={nativeBusy}
                  selectionText={nativeSelection?.text}
                  onStyle={(patch) => setNativeStyle((previous) => ({ ...previous, ...patch }))}
                  onTool={(value) => {
                    setNativeTool(value);
                    setTextSelectionMode(false);
                    setSelectedId(null);
                  }}
                  onSelect={selectNative}
                  onProperties={openNativeProperties}
                  onRemove={removeNative}
                  onReply={(id, contents, author) =>
                    applyNative({
                      type: 'mark',
                      command: {
                        type: 'reply',
                        parentId: id,
                        reply: { id: crypto.randomUUID(), contents, author },
                        now: new Date().toISOString(),
                      },
                    })
                  }
                  onReview={(id, status, author) =>
                    applyNative({
                      type: 'mark',
                      command: {
                        type: 'review',
                        parentId: id,
                        id: crypto.randomUUID(),
                        status,
                        author,
                        now: new Date().toISOString(),
                      },
                    })
                  }
                  onPlace={() => {
                    if (view && (nativeTool === 'freeText' || nativeTool === 'note'))
                      void createNative(nativeTool, [
                        view.toPdfPoint(view.width / 2, view.height / 2),
                      ]);
                  }}
                  onMarkSelection={() => {
                    if (
                      !nativeSelection ||
                      !['highlight', 'underline', 'strikeOut', 'squiggly'].includes(nativeTool)
                    )
                      return;
                    const { rect, quadPoints } = nativeSelection;
                    void applyNative({
                      type: 'mark',
                      command: {
                        type: 'create',
                        now: new Date().toISOString(),
                        annotation: {
                          id: crypto.randomUUID(),
                          pageId: pdfPages(documentRef.current)[page].id,
                          kind: nativeTool as 'highlight' | 'underline' | 'strikeOut' | 'squiggly',
                          rect: [rect.x, rect.y, rect.x + rect.width, rect.y + rect.height],
                          quadPoints,
                          author: nativeStyle.author,
                          color: [
                            parseInt(nativeStyle.marker.slice(1, 3), 16) / 255,
                            parseInt(nativeStyle.marker.slice(3, 5), 16) / 255,
                            parseInt(nativeStyle.marker.slice(5, 7), 16) / 255,
                          ],
                        },
                      },
                    });
                  }}
                  onMigrate={() => void applyNative({ type: 'migrate' })}
                  legacyCount={pdfDocument.marks.filter((mark) => !mark.nativeId).length}
                  onComposition={(value) => {
                    nativeComposing.current = value;
                  }}
                />
              ) : (
                <div className="zuvi-studio-pdf-panel-body">
                  <strong>
                    {selected
                      ? `编辑${markNames[selected.type]}标注`
                      : `添加${tool === 'select' ? '文字' : markNames[tool]}`}
                  </strong>
                  {(selected?.type ?? (tool === 'select' ? 'text' : tool)) === 'text' ? (
                    <>
                      <label>
                        文字内容
                        <Input.Textarea
                          size="sm"
                          aria-label={selected ? 'PDF 选中标注文字' : 'PDF 新增文字'}
                          rows={4}
                          value={selected ? selected.text : text}
                          maxLength={1000}
                          disabled={!canModifySelectedMark}
                          onChange={(event) =>
                            selected
                              ? changeMark(selected.id, { text: event.target.value }, true)
                              : setText(event.target.value)
                          }
                        />
                      </label>
                      <label>
                        字号
                        <InputNumber
                          size="sm"
                          aria-label="PDF 文字字号"
                          min={6}
                          max={144}
                          value={selected?.size ?? size}
                          disabled={!canModifySelectedMark}
                          onChange={(value) => {
                            if (value !== null) {
                              if (selected) changeMark(selected.id, { size: value }, true);
                              else setSize(value);
                            }
                          }}
                        />
                      </label>
                    </>
                  ) : (selected?.type ?? tool) === 'ink' ? (
                    <p className="zuvi-studio-pdf-hint">
                      按住页面拖动绘制手写签名，可连续画多笔。完成后点“选择”移动笔迹。
                    </p>
                  ) : (
                    <div className="zuvi-studio-pdf-mark-sizes">
                      <label>
                        宽度
                        <InputNumber
                          size="sm"
                          aria-label={`PDF ${(selected?.type ?? tool) === 'rectangle' ? '矩形' : '高亮'}宽度`}
                          min={1}
                          max={2000}
                          value={selected?.width ?? 120}
                          disabled={!canModifySelectedMark || !selected}
                          onChange={(value) => {
                            if (value !== null && selected)
                              changeMark(selected.id, { width: value }, true);
                          }}
                        />
                      </label>
                      <label>
                        高度
                        <InputNumber
                          size="sm"
                          aria-label={`PDF ${(selected?.type ?? tool) === 'rectangle' ? '矩形' : '高亮'}高度`}
                          min={1}
                          max={2000}
                          value={selected?.height ?? 18}
                          disabled={!canModifySelectedMark || !selected}
                          onChange={(value) => {
                            if (value !== null && selected)
                              changeMark(selected.id, { height: value }, true);
                          }}
                        />
                      </label>
                    </div>
                  )}
                  {((selected?.type ?? tool) === 'rectangle' ||
                    (selected?.type ?? tool) === 'ink') && (
                    <label>
                      线宽
                      <InputNumber
                        size="sm"
                        aria-label="PDF 绘图线宽"
                        value={selected?.lineWidth ?? lineWidth}
                        min={0.5}
                        max={40}
                        step={0.5}
                        precision={1}
                        disabled={!canModifySelectedMark}
                        onChange={(value) => {
                          if (value !== null) {
                            if (selected) changeMark(selected.id, { lineWidth: value }, true);
                            else setLineWidth(value);
                          }
                        }}
                      />
                    </label>
                  )}
                  <div className="zuvi-studio-pdf-color">
                    <span>颜色</span>
                    <ColorPicker
                      size="sm"
                      role="group"
                      aria-label="PDF 标注颜色"
                      value={selected?.color ?? (tool === 'highlight' ? highlight : ink)}
                      disabled={!canModifySelectedMark}
                      onChange={(value) => {
                        if (selected) changeMark(selected.id, { color: value });
                        else if (tool === 'highlight') setHighlight(value);
                        else setInk(value);
                      }}
                    />
                  </div>
                  {selected ? (
                    <>
                      <div className="zuvi-studio-pdf-replies" aria-label="PDF 标注回复">
                        <span className="zuvi-studio-pdf-replies-title">
                          回复（{selected.replies?.length ?? 0}）
                        </span>
                        {(selected.replies ?? []).map((reply) => (
                          <div className="zuvi-studio-pdf-reply" key={reply.id}>
                            <span className="zuvi-studio-pdf-reply-text">{reply.text}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              aria-label={`删除回复 ${reply.text.slice(0, 16)}`}
                              disabled={!canModifySelectedMark}
                              onClick={() => removeReply(selected.id, reply.id)}
                            >
                              删除
                            </Button>
                          </div>
                        ))}
                        {(selected.replies?.length ?? 0) === 0 ? (
                          <p className="zuvi-studio-pdf-hint">还没有回复，针对此标注展开讨论。</p>
                        ) : null}
                        <div className="zuvi-studio-pdf-reply-input">
                          <Input
                            size="sm"
                            aria-label="PDF 回复内容"
                            placeholder="写下回复，Enter 发送"
                            maxLength={2000}
                            value={replyDraft}
                            disabled={!canModifySelectedMark}
                            onChange={(event) => setReplyDraft(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                                event.preventDefault();
                                addReply(selected.id);
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!canModifySelectedMark || !replyDraft.trim()}
                            onClick={() => addReply(selected.id)}
                          >
                            回复
                          </Button>
                        </div>
                      </div>
                      <p className="zuvi-studio-pdf-hint">
                        拖动页面上的标注调整位置。方向键微调，Delete 删除。
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        iconStart={<Trash />}
                        disabled={!canModifySelectedMark}
                        onClick={() => removeMark(selected.id)}
                      >
                        删除选中标注
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="zuvi-studio-pdf-hint">
                        {tool === 'rectangle'
                          ? '在页面上按住并拖动，绘制矩形框。'
                          : tool === 'ink'
                            ? '在页面上按住并移动鼠标或手写笔，绘制签名。松开后保存这一笔。'
                            : '选择文字或高亮工具后点击页面放置，也可以使用下方按钮。'}
                      </p>
                      {(tool === 'select' || tool === 'text' || tool === 'highlight') && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={
                            !canModifySelectedMark ||
                            !view ||
                            tool === 'select' ||
                            (tool === 'text' && !text.trim())
                          }
                          onClick={() => {
                            if (view) addMark(view.toPdfPoint(view.width / 2, view.height / 2));
                          }}
                        >
                          放在当前页中央
                        </Button>
                      )}
                    </>
                  )}
                  <div className="zuvi-studio-pdf-mark-list" aria-label="PDF 标注列表">
                    {pdfDocument.marks.length === 0 ? (
                      <p className="zuvi-studio-pdf-hint">还没有标注。原文页面会完整保留。</p>
                    ) : (
                      pdfDocument.marks.map((mark, index) => (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="zuvi-studio-pdf-list-item"
                          key={mark.id}
                          aria-pressed={mark.id === selectedId}
                          disabled={disabled}
                          onClick={() => {
                            setPage(mark.page);
                            setSelectedId(mark.id);
                            setTool('select');
                            setTextSelectionMode(false);
                          }}
                        >
                          <span
                            className="zuvi-studio-pdf-mark-dot"
                            style={{
                              background:
                                mark.color ?? (mark.type === 'highlight' ? '#f5c542' : '#253044'),
                            }}
                          />
                          <span>
                            <strong>
                              第 {mark.page + 1} 页 · {markNames[mark.type]} {index + 1}
                            </strong>
                            <small>
                              {mark.type === 'text'
                                ? mark.text.slice(0, 32) || '空文字'
                                : mark.type === 'highlight'
                                  ? '透明高亮标注'
                                  : mark.type === 'ink'
                                    ? `${mark.points?.length ?? 0} 个笔迹坐标`
                                    : '矩形框标注'}
                            </small>
                          </span>
                        </Button>
                      ))
                    )}
                  </div>
                </div>
              )
            ) : (
              <div className="zuvi-studio-pdf-panel-body">
                <p className="zuvi-studio-pdf-hint">
                  直接点击页面上的表单填写，或在这里修改。保存后仍是可填写的 PDF 表单。
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!canModify || !view}
                  onClick={() => setFieldDialog({})}
                >
                  新建 PDF 字段
                </Button>
                {pdfDocument.fields.length === 0 ? (
                  <p className="zuvi-studio-pdf-hint">此文件没有可填写的 PDF 表单。</p>
                ) : (
                  pdfDocument.fields.map((field) => (
                    <div className="zuvi-studio-pdf-field" key={field.name}>
                      {field.type === 'opaque' ? (
                        <div className="zuvi-studio-pdf-passive-field">
                          <strong>{field.name}</strong>
                          <p>{field.passiveReason} · 保留原始值与外观</p>
                        </div>
                      ) : field.type === 'image' ? (
                        <label>
                          {field.name}
                          <input
                            type="file"
                            accept="image/png,image/jpeg"
                            aria-label={`PDF 表单 ${field.name}`}
                            disabled={!canModify || field.readOnly}
                            onChange={(event) => readFieldImage(field, event.target.files?.[0])}
                          />
                        </label>
                      ) : pdfFieldKind(field) === 'list' ? (
                        <div role="group" aria-label={`PDF 表单 ${field.name}`}>
                          {(field.options || []).map((option) => (
                            <Checkbox
                              key={option}
                              label={field.design?.optionLabels?.[option] ?? field.optionLabels?.[option] ?? option}
                              disabled={!canModify || field.readOnly}
                              checked={(
                                field.selectedValues || (field.value ? [String(field.value)] : [])
                              ).includes(option)}
                              onChange={(checked) =>
                                changeSelections(
                                  field,
                                  field.design?.multiSelect || field.multiSelect
                                    ? checked
                                      ? [...(field.selectedValues || []), option]
                                      : (field.selectedValues || []).filter(
                                          (value) => value !== option
                                        )
                                    : checked
                                      ? [option]
                                      : []
                                )
                              }
                            />
                          ))}
                        </div>
                      ) : field.type === 'checkbox' ? (
                        <Checkbox
                          label={field.name}
                          aria-label={`PDF 表单 ${field.name}`}
                          checked={Boolean(field.value)}
                          disabled={!canModify || field.readOnly}
                          onChange={(value) => changeField(field.name, value)}
                        />
                      ) : (
                        <label>
                          {field.name}
                          {field.type === 'choice' ? (
                            <Select
                              size="sm"
                              aria-label={`PDF 表单 ${field.name}`}
                              value={String(field.value)}
                              disabled={!canModify || field.readOnly}
                              options={[
                                { value: '', label: '未选择' },
                                ...(field.options ?? []).map((value) => ({
                                  value,
                                  label:
                                    field.design?.optionLabels?.[value] ??
                                    field.optionLabels?.[value] ??
                                    value,
                                })),
                              ]}
                              onChange={(value) => changeField(field.name, value)}
                            />
                          ) : pdfFieldKind(field) === 'date' ? (
                            dateInput(field, `PDF 表单 ${field.name}`)
                          ) : field.multiline ? (
                            <Input.Textarea
                              size="sm"
                              aria-label={`PDF 表单 ${field.name}`}
                              rows={3}
                              maxLength={field.design?.maxLength ?? 10_000}
                              value={String(field.value)}
                              disabled={!canModify || field.readOnly}
                              onFocus={() => {
                                fieldEdit.current = { name: field.name, saved: false };
                              }}
                              onBlur={() => {
                                fieldEdit.current = null;
                              }}
                              onChange={(event) => changeField(field.name, event.target.value)}
                            />
                          ) : (
                            <Input
                              size="sm"
                              aria-label={`PDF 表单 ${field.name}`}
                              maxLength={field.design?.maxLength ?? 10_000}
                              value={String(field.value)}
                              disabled={!canModify || field.readOnly}
                              onFocus={() => {
                                fieldEdit.current = { name: field.name, saved: false };
                              }}
                              onBlur={() => {
                                fieldEdit.current = null;
                              }}
                              onChange={(event) => changeField(field.name, event.target.value)}
                            />
                          )}
                        </label>
                      )}
                      {field.readOnly && <small>只读字段</small>}
                      {field.design?.required && <small>必填</small>}
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={!canModify || !view || field.type === 'opaque'}
                        aria-label={`设计 PDF 字段 ${field.name}`}
                        onClick={() =>
                          setFieldDialog({ field: { ...field, design: pdfFieldDesign(field) } })
                        }
                      >
                        字段属性
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </aside>
        )}
      </div>
      <div className="zuvi-studio-pdf-statusbar" role="group" aria-label="PDF 状态栏">
        <div className="zuvi-studio-pdf-navigation" role="group" aria-label="PDF 页面导航">
          <Button
            size="sm"
            variant="ghost"
            aria-label="PDF 上一页"
            iconStart={<ChevronLeft />}
            disabled={disabled || page <= 0}
            onClick={() => {
              setPage((value) => value - 1);
              setSelectedId(null);
            }}
          />
          <InputNumber
            size="sm"
            aria-label="PDF 跳转页"
            value={page + 1}
            min={1}
            max={pdfDocument.pageCount}
            precision={0}
            disabled={disabled}
            onChange={(value) => {
              if (value !== null) {
                setPage(Math.max(0, Math.min(pdfDocument.pageCount - 1, value - 1)));
                setSelectedId(null);
              }
            }}
          />
          <span>/ {pdfDocument.pageCount}</span>
          <Button
            size="sm"
            variant="ghost"
            aria-label="PDF 下一页"
            iconStart={<ChevronRight />}
            disabled={disabled || page >= pdfDocument.pageCount - 1}
            onClick={() => {
              setPage((value) => value + 1);
              setSelectedId(null);
            }}
          />
        </div>
        <span
          className="zuvi-studio-pdf-status-mode"
          tabIndex={0}
          title="PDF 原有正文保持原版式；可编辑新增批注和原文件的可填写表单。"
          aria-label={
            (disabled
              ? '已禁用'
              : readOnly
                ? '只读'
                : tool === 'select'
                  ? '选择工具'
                  : markNames[tool]) +
            '。PDF 原有正文保持原版式；可编辑新增批注和原文件的可填写表单。'
          }
        >
          {disabled
            ? '已禁用'
            : readOnly
              ? '只读'
              : tool === 'select'
                ? '选择工具'
                : markNames[tool]}
        </span>
        <div className="zuvi-studio-pdf-zoom" role="group" aria-label="PDF 视图缩放">
          <Button
            size="sm"
            variant="ghost"
            iconStart={<ZoomOut />}
            aria-label="PDF 缩小视图"
            disabled={disabled || zoom <= zoomSteps[0]}
            onClick={() => setZoom(zoomSteps[Math.max(0, zoomSteps.indexOf(zoom) - 1)])}
          />
          <Select
            size="sm"
            aria-label="PDF 缩放"
            value={String(zoom)}
            disabled={disabled}
            classNames={{ listbox: 'zuvi-studio-pdf-zoom-listbox' }}
            options={zoomSteps.map((value) => ({ value: String(value), label: value * 100 + '%' }))}
            onChange={(value) => setZoom(Number(value))}
          />
          <Button
            size="sm"
            variant="ghost"
            iconStart={<ZoomIn />}
            aria-label="PDF 放大视图"
            disabled={disabled || zoom >= zoomSteps[zoomSteps.length - 1]}
            onClick={() =>
              setZoom(zoomSteps[Math.min(zoomSteps.length - 1, zoomSteps.indexOf(zoom) + 1)])
            }
          />
        </div>
      </div>
      {pageDialog && (
        <StudioPdfPageDialog
          action={pageDialog.action}
          pageCount={pdfDocument.pageCount}
          currentPage={page}
          width={view ? visibleBounds(view).right - visibleBounds(view).left : 595.28}
          height={view ? visibleBounds(view).top - visibleBounds(view).bottom : 841.89}
          blocked={
            !canModify ||
            documentRef.current !== pageDialog.snapshot ||
            source !== pageDialog.source ||
            pdfRenderer !== pageDialog.renderer ||
            activeLoaded?.session !== pageDialog.session
          }
          onClose={() => setPageDialog(null)}
          onApply={(value) => {
            if (
              !canModifyRef.current ||
              documentRef.current !== pageDialog.snapshot ||
              source !== pageDialog.source ||
              pdfRenderer !== pageDialog.renderer ||
              activeLoaded?.session !== pageDialog.session
            )
              return;
            pageOperation(() =>
              pageDialog.action === 'insert'
                ? pdfInsertBlankPage(documentRef.current, value.position, value)
                : pageDialog.action === 'resize'
                  ? pdfResizePages(documentRef.current, pageDialog.selection, value)
                  : pageDialog.action === 'copy'
                    ? pdfCopyPages(documentRef.current, pageDialog.selection, value.position)
                    : pdfMovePages(documentRef.current, pageDialog.selection, value.position)
            );
          }}
        />
      )}
      {composeDialog && (
        <StudioPdfComposeDialog
          mode={composeDialog.mode}
          pageCount={composeDialog.snapshot.document.pageCount}
          currentPage={composeDialog.currentPage}
          selectedPages={composeDialog.selection}
          name={composeDialog.snapshot.document.name}
          composer={composeDialog.composer}
          blocked={
            !canEditSource ||
            pdfDocument !== composeDialog.snapshot.document ||
            source !== composeDialog.snapshot.source ||
            pdfRenderer !== composeDialog.renderer ||
            pdfComposer !== composeDialog.composer ||
            activeLoaded?.session !== composeDialog.session
          }
          busy={composeBusy}
          onClose={closeComposition}
          onApply={applyComposition}
        />
      )}
      {nativeDialog && (
        <StudioPdfAnnotationDialog
          key={nativeDialog.annotation.id}
          annotation={nativeDialog.annotation}
          busy={nativeBusy}
          notice={notice}
          disabled={
            !canModifyNative ||
            nativeDialog.snapshot.document !== documentRef.current ||
            nativeDialog.snapshot.source !== source ||
            nativeDialog.editor !== pdfAnnotations
          }
          onCancel={() => {
            nativeTask.current?.abort();
            setNativeDialog(null);
          }}
          onApply={(patch) => patchNative(nativeDialog.annotation.id, patch)}
        />
      )}
      {fieldDialog && canModify && view && (
        <StudioPdfFieldDialog
          key={fieldDialog.field?.name || 'new'}
          field={fieldDialog.field}
          document={pdfDocument}
          page={page}
          bounds={visibleBounds(view)}
          getPageBounds={
            activeLoaded?.session.getPageBounds
              ? (index) => activeLoaded.session.getPageBounds!(index, renderDescriptors?.[index])
              : undefined
          }
          onClose={() => setFieldDialog(null)}
          onSave={(field) => {
            if (documentRef.current !== pdfDocument)
              throw new Error('文档已更新，请重新打开字段设计。');
            commit(pdfSetDesignedField(documentRef.current, field, fieldDialog.field?.name));
            setFieldDialog(null);
            setPanel('fields');
            setInspector(true);
          }}
          onDelete={(name) => {
            commit(pdfRemoveDesignedField(documentRef.current, name));
            setFieldDialog(null);
          }}
        />
      )}
    </div>
  );
}

export { StudioPdf };
