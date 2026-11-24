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
  StudioPdfRenderer,
  StudioPdfRenderResult,
  StudioPdfSession,
  StudioPdfSearchResult,
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
}
interface RenderedPage {
  loaded: LoadedPdf;
  page: number;
  zoom: number;
  rotation: number;
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
  currentPage,
  disabled,
  onSelect,
}: {
  loaded: LoadedPdf;
  page: number;
  rotation: number;
  currentPage: number;
  disabled: boolean;
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
  }, [loaded, page, rotation, visible]);
  return (
    <Button
      ref={button}
      variant="outline"
      fullWidth
      className="zuvi-studio-pdf-thumbnail"
      aria-label={`PDF 第 ${page + 1} 页缩略图`}
      aria-pressed={page === currentPage}
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
}: StudioEditorProps<StudioPdfDocument>) {
  const [loaded, setLoaded] = useState<LoadedPdf | null>(null);
  const [rendered, setRendered] = useState<RenderedPage | null>(null);
  const [page, setPage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [ribbon, setRibbon] = useState('home');
  const [tool, setTool] = useState<Tool>('select');
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
  const [drawing, setDrawing] = useState<Drawing | null>(null);
  const [, setHistoryVersion] = useState(0);
  const [error, setError] = useState('');
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
  const pastRef = useRef<StudioPdfDocument[]>([]);
  const futureRef = useRef<StudioPdfDocument[]>([]);
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

  const activeLoaded =
    loaded &&
    loaded.id === pdfDocument.id &&
    loaded.source === source &&
    loaded.renderer === pdfRenderer
      ? loaded
      : null;
  const rotation = pdfDocument.rotations[String(page)] ?? 0;
  const view =
    rendered &&
    rendered.loaded === activeLoaded &&
    rendered.page === page &&
    rendered.zoom === zoom &&
    rendered.rotation === rotation
      ? rendered.result
      : null;
  const canModify = !disabled && !readOnly && !!activeLoaded;
  const canModifyRef = useRef(canModify);
  canModifyRef.current = canModify;
  const selected = pdfDocument.marks.find((mark) => mark.id === selectedId);

  useEffect(() => {
    if (pdfDocument !== expectedRef.current) {
      pastRef.current = [];
      futureRef.current = [];
      setHistoryVersion((value) => value + 1);
      setDateDrafts({});
      setFieldDialog(null);
      fieldEdit.current = null;
    }
    expectedRef.current = pdfDocument;
  }, [pdfDocument]);

  useEffect(() => {
    setDateDrafts({});
    fieldEdit.current = null;
  }, [disabled, readOnly, source]);

  useEffect(() => {
    drawingRef.current = null;
    setDrawing(null);
    drag.current = null;
  }, [disabled, readOnly, page, zoom, rotation, tool]);

  useEffect(() => {
    if (inspector && panel === 'search') searchInput.current?.focus();
  }, [inspector, panel]);

  useEffect(() => {
    const controller = new AbortController();
    setSearchResults([]);
    setSearchIndex(0);
    setSearchError('');
    if (disabled || !activeLoaded || !searchRequest.text.trim()) {
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
          const valid = results
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
  }, [activeLoaded, searchRequest, pdfDocument.pageCount, disabled]);

  useEffect(() => {
    let active = true;
    let owned: StudioPdfSession | undefined;
    setLoaded(null);
    setRendered(null);
    setError('');
    setNotice('');
    setSelectedId(null);
    setPage(0);
    setTool('select');
    drag.current = null;
    drawingRef.current = null;
    setDrawing(null);
    setSearchResults([]);
    setSearchRequest({ text: '', version: 0 });
    pastRef.current = [];
    futureRef.current = [];
    setHistoryVersion((value) => value + 1);
    if (!source || !pdfRenderer) return;
    void Promise.resolve()
      .then(() => pdfRenderer.load(source))
      .then(
        (session) => {
          if (!active) {
            dispose(session);
            return;
          }
          owned = session;
          if (
            session.pageCount !== pdfDocument.pageCount ||
            session.pageCount < 1 ||
            session.pageCount > 200
          ) {
            dispose(session);
            owned = undefined;
            setError('PDF 草稿页数与原文件不一致，请重新导入文件。');
            return;
          }
          setLoaded({ id: pdfDocument.id, source, renderer: pdfRenderer, session });
        },
        (reason: unknown) => {
          if (active) setError(reason instanceof Error ? reason.message : 'PDF 加载失败，请重试。');
        }
      );
    return () => {
      active = false;
      if (owned) dispose(owned);
    };
  }, [source, pdfRenderer, pdfDocument.id, pdfDocument.pageCount, retry]);

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
            setRendered({ loaded: activeLoaded, page, zoom, rotation, result });
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
  }, [activeLoaded, page, zoom, rotation]);

  const remember = (snapshot: StudioPdfDocument) => {
    pastRef.current = [...pastRef.current.slice(-39), snapshot];
    futureRef.current = [];
    setHistoryVersion((value) => value + 1);
  };
  const commit = (next: StudioPdfDocument, addHistory = true) => {
    if (!canModifyRef.current) return;
    if (addHistory) remember(documentRef.current);
    documentRef.current = next;
    expectedRef.current = next;
    setNotice('');
    onChange(next);
  };
  const stepHistory = (direction: 'undo' | 'redo') => {
    if (!canModify) return;
    const from = direction === 'undo' ? pastRef : futureRef;
    const to = direction === 'undo' ? futureRef : pastRef;
    const next = from.current.pop();
    if (!next) return;
    to.current = [...to.current.slice(-39), documentRef.current];
    commit(next, false);
    setDateDrafts({});
    fieldEdit.current = null;
    setSelectedId(null);
    setHistoryVersion((value) => value + 1);
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
    if (!mark) return;
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
    commit({ ...current, marks: current.marks.filter((entry) => entry.id !== id) });
    if (selectedId === id) setSelectedId(null);
  };
  const addReply = (markId: string) => {
    if (!canModify) return;
    const draft = replyDraft.trim();
    if (!draft) return;
    const current = documentRef.current;
    const mark = current.marks.find((entry) => entry.id === markId);
    if (!mark) return;
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
    if (!view) return null;
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
                  label={field.design?.optionLabels?.[option] ?? option}
                  checked={(
                    field.selectedValues || (field.value ? [String(field.value)] : [])
                  ).includes(option)}
                  disabled={locked}
                  onChange={(checked) =>
                    changeSelections(
                      field,
                      field.design?.multiSelect
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
                  label: field.design?.optionLabels?.[option] ?? option,
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
      aria-pressed={tool === next}
      disabled={!canModify}
      onClick={() => {
        setTool(next);
        setSelectedId(null);
        setInspector(true);
        setPanel('marks');
      }}
    >
      {markNames[next]}
    </Button>
  );

  return (
    <div
      className="zuvi-studio-pdf"
      data-inspector={inspector ? 'open' : 'closed'}
      onKeyDown={(event) => {
        if (disabled) return;
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
          event.preventDefault();
          setInspector(true);
          setPanel('search');
          searchInput.current?.focus();
        }
        if (event.key === 'Escape') {
          setDraft(null);
          setTool('select');
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
                aria-pressed={tool === 'select'}
                disabled={disabled}
                onClick={() => setTool('select')}
              >
                选择
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
                  className="zuvi-studio-pdf-ribbon-tool"
                  iconStart={<RotateCcw />}
                  disabled={!canModify}
                  onClick={() => {
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
              </div>
              <span className="zuvi-studio-pdf-ribbon-caption" aria-hidden="true">
                批注
              </span>
            </div>
            <div className="zuvi-studio-pdf-ribbon-group" role="group" aria-label="绘图与签名">
              <div className="zuvi-studio-pdf-ribbon-group-body">
                {markToolButton('rectangle')}
                {markToolButton('ink')}
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

      {(error || notice) && (
        <div className="zuvi-studio-pdf-alert" role="alert">
          <span>{error || notice}</span>
          {error && (
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
          aria-busy={!!source && !!pdfRenderer && !view && !error}
        >
          {!source || !pdfRenderer ? (
            <div className="zuvi-studio-pdf-placeholder">
              <Type />
              <strong>{source ? 'PDF 预览暂不可用' : '导入 PDF 开始编辑'}</strong>
              <span>全文搜索、文字与绘图批注、旋转页面和表单填写</span>
            </div>
          ) : (
            <>
              {!view && !error && (
                <div className="zuvi-studio-pdf-loading" role="status">
                  正在加载第 {page + 1} 页…
                </div>
              )}
              <div
                ref={paper}
                className="zuvi-studio-pdf-paper"
                data-tool={tool}
                style={{
                  width: view?.width ?? rendered?.result.width ?? 595,
                  height: view?.height ?? rendered?.result.height ?? 842,
                  visibility: view ? 'visible' : 'hidden',
                }}
                onClick={(event) => {
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
                  const point = eventPoint(event.clientX, event.clientY);
                  if (point) extendDrawing(event.pointerId, point);
                }}
                onPointerUp={(event) => {
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
                        .filter((mark) => mark.page === page)
                        .map((mark) => {
                          const dimensions = markDimensions(mark);
                          const selectedMark = mark.id === selectedId;
                          const matrix = pdfMatrix(view, mark.x, mark.y);
                          return (
                            <g
                              key={mark.id}
                              role="button"
                              tabIndex={disabled ? -1 : 0}
                              aria-label={`PDF ${markNames[mark.type]}标注 ${mark.text || mark.id}`}
                              aria-pressed={selectedMark}
                              data-selected={selectedMark || undefined}
                              data-mark={mark.id}
                              transform={`matrix(${matrix.join(' ')})`}
                              onClick={(event) => {
                                event.stopPropagation();
                                if (!disabled) {
                                  setSelectedId(mark.id);
                                  setInspector(true);
                                  setPanel('marks');
                                }
                              }}
                              onPointerDown={(event) => {
                                event.stopPropagation();
                                if (disabled || tool !== 'select') return;
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
                                if (disabled) return;
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
                批注 {pdfDocument.marks.length}
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
                    <PdfThumbnail
                      key={index}
                      loaded={activeLoaded}
                      page={index}
                      rotation={pdfDocument.rotations[String(index)] ?? 0}
                      currentPage={page}
                      disabled={disabled}
                      onSelect={() => {
                        setPage(index);
                        setSelectedId(null);
                        setTool('select');
                      }}
                    />
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
                        disabled={!canModify}
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
                        disabled={!canModify}
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
                        disabled={!canModify || !selected}
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
                        disabled={!canModify || !selected}
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
                      disabled={!canModify}
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
                    disabled={!canModify}
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
                            disabled={!canModify}
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
                          disabled={!canModify}
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
                          disabled={!canModify || !replyDraft.trim()}
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
                      disabled={!canModify}
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
                          !canModify ||
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
                      {field.type === 'image' ? (
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
                              label={field.design?.optionLabels?.[option] ?? option}
                              disabled={!canModify || field.readOnly}
                              checked={(
                                field.selectedValues || (field.value ? [String(field.value)] : [])
                              ).includes(option)}
                              onChange={(checked) =>
                                changeSelections(
                                  field,
                                  field.design?.multiSelect
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
                                  label: field.design?.optionLabels?.[value] ?? value,
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
                        disabled={!canModify || !view}
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
      {fieldDialog && canModify && view && (
        <StudioPdfFieldDialog
          key={fieldDialog.field?.name || 'new'}
          field={fieldDialog.field}
          document={pdfDocument}
          page={page}
          bounds={visibleBounds(view)}
          getPageBounds={activeLoaded?.session.getPageBounds}
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
