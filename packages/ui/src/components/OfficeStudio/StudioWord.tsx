'use client';
import { StudioWordFormulaDialog } from './StudioWordFormulaDialog';
import { WordFormulaField, wordSetTableFormula, wordRefreshTableFormulas } from './studio-word-formula-field';

import * as React from 'react';
import { flushSync } from 'react-dom';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Book,
  Clipboard,
  Close,
  Copy,
  FileText,
  Image as ImageIcon,
  Italic,
  Link,
  RotateCcw,
  Scissors,
  Search,
} from '@zuvi/icons';
import { EditorContent, Node, useEditor, useEditorState, type Editor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { ListItem } from '@tiptap/extension-list';
import { closeHistory } from '@tiptap/pm/history';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyleKit, FontFamily } from '@tiptap/extension-text-style';
import { DropdownMenu } from '../DropdownMenu';
import { studioFontFamilyCss, studioFontFamilyInput } from './studio-font-input';
import { Check, Droplet, Minus, Plus, Type as TypeIcon } from '@zuvi/icons';
import { TableKit } from '@tiptap/extension-table';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { ColorPicker } from '../ColorPicker';
import { Input } from '../Input';
import { Modal } from '../Modal';
import { Select } from '../Select';
import { Tabs } from '../Tabs';
import { StudioRibbonTabs } from './StudioRibbon';
import type {
  StudioEditorProps,
  StudioRichNode,
  StudioWordDocument,
  StudioWordParagraphStyle,
} from './studio-types';
import { StudioWordStyleDialog } from './StudioWordStyleDialog';
import { StudioWordCharacterDialog } from './StudioWordCharacterDialog';
import { StudioWordParagraphDialog } from './StudioWordParagraphDialog';
import { StudioWordTabsDialog } from './StudioWordTabsDialog';
import { WordTabs, wordSelectionTabStops, wordSetTabStops, wordInsertTab, wordRefreshTabLayout } from './studio-word-tab-extension';
import { StudioWordRuler as WordRuler } from './StudioWordRuler';
import { WordNumbering, wordSetNumberedContent, wordNumberingContext, wordContinueNumbering, wordRestartNumbering, wordChangeNumberingLevel, wordSetNumberingCatalog, wordToggleNumberingPreset, wordEditorNumbering, wordApplyNumbering } from './studio-word-numbering-extension';
import { StudioWordNumberingDialog } from './StudioWordNumberingDialog';
import {StudioWordSurfaceDialog} from './StudioWordSurfaceDialog';
import { WordTableRowProperties, wordDistributeColumns, wordDistributeRows, wordSelectedRows, wordSetRowProperties } from './studio-word-table-row-extension';
import { StudioWordRowDialog } from './StudioWordRowDialog';
import { StudioWordConversionDialog } from './StudioWordConversionDialog';
import { wordConversionTarget, wordApplyTableConversion, type WordConversionTarget } from './studio-word-table-conversion';
import { WordTableCell, WordTableHeader } from './studio-word-table-cell';
import {WordPaginationLayout,wordSetPagination} from './studio-word-pagination-extension';
import {WordParagraphSurface,wordSelectionSurfaces,wordSetParagraphSurface} from './studio-word-surface-extension';
import { materializeWordNumbering, wordNumberingCatalog, type WordNumberingCatalog } from './studio-word-numbering';
import {
  WordCharacterLayout,
  wordSelectionMetrics,
  wordSetCharacterLayout,
} from './studio-word-character-layout';
import { StudioWordImageLayoutTools } from './StudioWordImageLayoutTools';
import {
  WordParagraphStyles,
  wordApplyParagraphStyle,
  wordSetParagraphStyles,
} from './studio-word-style-extension';
import {
  getStudioWordParagraphStyles,
  materializeStudioWordStyles,
  reconcileStudioWordStyles,
  validateStudioWordParagraphStyles,
} from './studio-word-styles';
import {
  WORD_HIGHLIGHT_COLORS,
  WORD_FONT_SIZE_STEPS,
  WORD_SEARCH_LIMIT,
  WordImage,
  WordPageNumber,
  WordSubscript,
  WordSuperscript,
  type WordCaseMode,
  type WordFormatSnapshot,
  wordApplyFormat,
  wordCaptureFormat,
  wordClearFormat,
  wordFindMatches,
  type WordFormatCriteria,
  wordHeadings,
  wordReadImage,
  wordReplaceMatches,
  wordSetHighlight,
  wordStepFontSize,
  wordTransformSelectionCase,
} from './studio-word-tools';
import { StudioFontControl, type StudioFontCommitReason } from './StudioFontControl';
import { WordNonprinting, wordSetNonprinting } from './studio-word-nonprinting';

import {
  wordSetParagraphFormat,
  wordSelectionParagraphFormat,
  WordParagraphLayout as ParagraphLayout,
} from './studio-word-paragraph-layout';
import './StudioWord.css';

const PageBreak = Node.create({
  name: 'pageBreak',
  group: 'block',
  atom: true,
  selectable: true,
  parseHTML: () => [{ tag: 'div[data-word-page-break]' }],
  renderHTML: () => [
    'div',
    { 'data-word-page-break': '', class: 'zuvi-studio-word-page-break', 'aria-label': '分页符' },
  ],
});
const numberedContent=(root:StudioRichNode,styles:StudioWordParagraphStyle[],catalog?:WordNumberingCatalog)=>materializeWordNumbering(materializeStudioWordStyles(root,styles),catalog);

const EXTENSIONS = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3, 4, 5, 6] },
    link: { openOnClick: false, autolink: false, defaultProtocol: 'https' },
    codeBlock: false,
    code: false,
    trailingNode: false,
    listItem: false,
  }),
  ListItem.extend({ content: '(paragraph | heading) block*' }),
  TextStyleKit.configure({ fontFamily: false }),
  WordCharacterLayout,
  FontFamily.extend({
    addGlobalAttributes() {
      return (this.parent?.() ?? []).map((group) => ({
        ...group,
        attributes: {
          ...group.attributes,
          fontFamily: {
            ...group.attributes.fontFamily,
            renderHTML: (attrs) =>
              typeof attrs.fontFamily === 'string' && studioFontFamilyInput(attrs.fontFamily)
                ? { style: `font-family: ${studioFontFamilyCss(attrs.fontFamily)}` }
                : {},
          },
        },
      }));
    },
  }),
  TextAlign.extend({
    addKeyboardShortcuts() {
      return Object.fromEntries(
        [
          ['l', 'left'],
          ['e', 'center'],
          ['r', 'right'],
          ['j', 'justify'],
        ].map(([key, value]) => [
          `Mod-Shift-${key}`,
          () =>
            wordSetParagraphFormat(this.editor, {
              textAlign: value as 'left' | 'center' | 'right' | 'justify',
            }),
        ])
      );
    },
  }).configure({ types: ['heading', 'paragraph'] }),
  TableKit.configure({ table: { resizable: true }, tableCell: false, tableHeader: false }),
  WordTableCell,
  WordTableHeader,
  WordTableRowProperties,
  ParagraphLayout,
  WordParagraphSurface,
  PageBreak,
  WordImage,
  WordPageNumber,
  WordFormulaField,
  WordSubscript,
  WordSuperscript,
  WordNonprinting,
];

const MM_TO_PX = 96 / 25.4;
const FONT_OPTIONS = [
  { value: 'Noto Sans SC', label: '思源黑体' },
  { value: 'SimSun', label: '宋体' },
  { value: 'Microsoft YaHei', label: '微软雅黑' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
];
const SIZE_OPTIONS = WORD_FONT_SIZE_STEPS.map((size) => ({
  value: `${size}pt`,
  label: `${size}`,
}));
const STYLE_OPTIONS = [
  { value: 'paragraph', label: '正文' },
  { value: 'no-spacing', label: '无间距' },
  ...[1, 2, 3, 4, 5, 6].map((level) => ({ value: `heading-${level}`, label: `标题 ${level}` })),
];
const STYLE_PREVIEWS = STYLE_OPTIONS.slice(0, 3);
const ALIGNMENTS = [
  { value: 'left', label: '左对齐', Icon: AlignLeft },
  { value: 'center', label: '居中', Icon: AlignCenter },
  { value: 'right', label: '右对齐', Icon: AlignRight },
  { value: 'justify', label: '两端对齐', Icon: AlignJustify },
] as const;

function keepSelection(event: React.MouseEvent) {
  event.preventDefault();
}

function RibbonGroup({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`zuvi-studio-word-group ${className}`.trim()}
      data-part="word-tool-group"
      role="group"
      aria-label={label}
    >
      <div className="zuvi-studio-word-controls">{children}</div>
      <span className="zuvi-studio-word-group-label">{label}</span>
    </div>
  );
}

function RibbonRow({ children }: { children: React.ReactNode }) {
  return <div className="zuvi-studio-word-control-row">{children}</div>;
}

type WordRegion = 'header' | 'footer';
const EMPTY_REGION: StudioRichNode = { type: 'doc', content: [{ type: 'paragraph' }] };
const DEFAULT_REGION_DISTANCE = 12.5;

function RegionEditor({
  region,
  documentId,
  content,
  editable,
  onChange,
  onReady,
  onActive,
  onImagePaste,
  paragraphStyles,
  defaultTabStop,
  decimalSymbol,
  numberingCatalog,
}: {
  region: WordRegion;
  documentId: string;
  content: StudioRichNode;
  editable: boolean;
  onChange(content: StudioRichNode): void;
  onReady(region: WordRegion, editor: Editor | null): void;
  onActive(region: WordRegion): void;
  onImagePaste(file: File, editor: Editor | null): void;
  paragraphStyles: StudioWordParagraphStyle[];
  defaultTabStop?: number;
  decimalSymbol?: '.' | ',';
  numberingCatalog:WordNumberingCatalog;
}) {
  const latest = React.useRef({
    editable,
    onChange,
    onReady,
    onActive,
    onImagePaste,
    paragraphStyles,
    defaultTabStop,
    decimalSymbol,
    numberingCatalog,
  });
  latest.current = { editable, onChange, onReady, onActive, onImagePaste, paragraphStyles, defaultTabStop, decimalSymbol, numberingCatalog };
  const [request, setRequest] = React.useState(0);
  const editor: Editor | null = useEditor(
    {
      extensions: [
        ...EXTENSIONS,
        WordNumbering.configure({getCatalog:()=>latest.current.numberingCatalog}),
        WordTabs.configure({ getDefaultTabStop: () => latest.current.defaultTabStop ?? 36, getDecimalSymbol: () => latest.current.decimalSymbol }),
        WordParagraphStyles.configure({
          autoUpdate: false,
          getStyles: () => latest.current.paragraphStyles,
        }),
      ],
      content: numberedContent(content, paragraphStyles, numberingCatalog),
      editable,
      immediatelyRender: false,
      shouldRerenderOnTransaction: false,
      editorProps: {
        attributes: {
          role: 'textbox',
          'aria-label': region === 'header' ? 'Word 页眉' : 'Word 页脚',
          'aria-multiline': 'true',
          'aria-readonly': String(!editable),
          spellcheck: 'false',
        },
        handlePaste: (_view, event) => {
          const file = Array.from(event.clipboardData?.files || []).find((item) =>
            /^image\/(png|jpeg)$/.test(item.type)
          );
          if (!file || !latest.current.editable) return false;
          event.preventDefault();
          latest.current.onImagePaste(file, editor);
          return true;
        },
      },
      onFocus: () => latest.current.onActive(region),
      onUpdate: ({ editor: current }) => {
        if (!latest.current.editable) return;
        latest.current.onChange(current.getJSON() as StudioRichNode);
        setRequest((value) => value + 1);
      },
    },
    [documentId, region]
  );
  React.useEffect(() => {
    if (!editor) return;
    latest.current.onReady(region, editor);
    return () => latest.current.onReady(region, null);
  }, [editor, region]);
  React.useLayoutEffect(() => {
    editor?.setEditable(editable, false);
    editor?.setOptions({
      editorProps: {
        attributes: {
          role: 'textbox',
          'aria-label': region === 'header' ? 'Word 页眉' : 'Word 页脚',
          'aria-multiline': 'true',
          'aria-readonly': String(!editable),
          spellcheck: 'false',
        },
        handlePaste: (_view, event) => {
          const file = Array.from(event.clipboardData?.files || []).find((item) =>
            /^image\/(png|jpeg)$/.test(item.type)
          );
          if (!file || !latest.current.editable) return false;
          event.preventDefault();
          latest.current.onImagePaste(file, editor);
          return true;
        },
      },
    });
  }, [editor, editable, region]);
  React.useLayoutEffect(() => {
    if (
      editor &&
      !editor.isDestroyed &&
      JSON.stringify(editor.getJSON()) !==
        JSON.stringify(numberedContent(content, paragraphStyles, numberingCatalog))
    )
      wordSetNumberedContent(editor,numberedContent(content, paragraphStyles, numberingCatalog));
  }, [editor, content, request, paragraphStyles, numberingCatalog]);
  return (
    <EditorContent
      editor={editor}
      className="zuvi-studio-word-content zuvi-studio-word-region-content"
    />
  );
}

function withoutPageNumbers(node: StudioRichNode): StudioRichNode {
  return {
    ...node,
    ...(node.content
      ? {
          content: node.content
            .filter((child) => child.type !== 'pageNumber')
            .map(withoutPageNumbers),
        }
      : {}),
  };
}

function hasPageNumber(node?: StudioRichNode): boolean {
  return (
    !!node &&
    ((node.type === 'pageNumber' && node.attrs?.kind !== 'total') ||
      !!node.content?.some(hasPageNumber))
  );
}

/** A local, structured rich-text document editor. Page margins are in millimetres. */
export function StudioWord({
  document,
  onChange,
  disabled,
  readOnly,
}: StudioEditorProps<StudioWordDocument>) {
  const editable = !disabled && !readOnly;
  const latest = React.useRef({ document, onChange, editable });
  latest.current = { document, onChange, editable };
  const [tab, setTab] = React.useState('home');
  const [zoom, setZoom] = React.useState('fit');
  const [stageWidth, setStageWidth] = React.useState(900);
  const [paperHeight, setPaperHeight] = React.useState(0);
  const [showRuler, setShowRuler] = React.useState(true);
  const [showNonprinting, setShowNonprinting] = React.useState(false);
  const [statisticsOpen, setStatisticsOpen] = React.useState(false);
  const [clipboardBusy, setClipboardBusy] = React.useState(false);
  const [tableRows, setTableRows] = React.useState('3');
  const [numberStart,setNumberStart]=React.useState('1');
  const [numberDialog,setNumberDialog]=React.useState<{editor:Editor;doc:Editor['state']['doc'];selection:Editor['state']['selection'];catalog:WordNumberingCatalog;currentId?:string;level:number}|null>(null);
  const [surfaceDialog,setSurfaceDialog]=React.useState<{editor:Editor;doc:Editor['state']['doc'];selection:Editor['state']['selection'];surfaces:ReturnType<typeof wordSelectionSurfaces>}|null>(null);
  const [formulaDialog, setFormulaDialog] = React.useState<{ editor: Editor; doc: Editor['state']['doc']; selection: Editor['state']['selection']; initial: string } | null>(null);
  const [conversionDialog, setConversionDialog] = React.useState<{ editor: Editor; target: WordConversionTarget } | null>(null);
  const [rowDialog, setRowDialog] = React.useState<{ editor: Editor; doc: Editor['state']['doc']; selection: Editor['state']['selection']; rows: ReturnType<typeof wordSelectedRows> } | null>(null);
  const [tableColumns, setTableColumns] = React.useState('3');
  const [tableHeader, setTableHeader] = React.useState(true);
  const [linkOpen, setLinkOpen] = React.useState(false);
  const [linkHref, setLinkHref] = React.useState('');
  const [linkError, setLinkError] = React.useState('');
  const [contentRequest, setContentRequest] = React.useState(0);
  const [region, setRegion] = React.useState<'content' | WordRegion>('content');
  const [regions, setRegions] = React.useState<Partial<Record<WordRegion, Editor>>>({});
  const [sidePanel, setSidePanel] = React.useState<'search' | 'outline' | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [replacement, setReplacement] = React.useState('');
  const [matchCase, setMatchCase] = React.useState(false);
  const [formatCriteria, setFormatCriteria] = React.useState<WordFormatCriteria>({});
  const [styleDialog, setStyleDialog] = React.useState<StudioWordParagraphStyle | null>(null);
  const [characterDialog, setCharacterDialog] = React.useState<{
    editor: Editor;
    doc: Editor['state']['doc'];
    selection: Editor['state']['selection'];
    values: ReturnType<typeof wordSelectionMetrics>;
    text: string;
  } | null>(null);
  const [paragraphDialog, setParagraphDialog] = React.useState<{
    editor: Editor;
    doc: Editor['state']['doc'];
    selection: Editor['state']['selection'];
    values: ReturnType<typeof wordSelectionParagraphFormat>;
  } | null>(null);
  const [tabsDialog, setTabsDialog] = React.useState<{
    editor: Editor; doc: Editor['state']['doc']; selection: Editor['state']['selection'];
    values: ReturnType<typeof wordSelectionTabStops>;
  } | null>(null);
  const styleDefinitions = document.content.attrs?.paragraphStyles;
  const paragraphStyles = React.useMemo(
    () => validateStudioWordParagraphStyles(styleDefinitions),
    [styleDefinitions]
  );
  const numberCatalog=React.useMemo(()=>{
    const value=numberedContent(document.content,paragraphStyles);
    return wordNumberingCatalog(value.attrs?.numberingDefinitions,value.attrs?.numberingInstances);
  },[document.content,paragraphStyles]);
  const styleOptions = [
    ...STYLE_OPTIONS,
    ...paragraphStyles.map((style) => ({ value: style.id, label: style.name })),
  ];
  const [matchIndex, setMatchIndex] = React.useState(-1);
  const [imageBusy, setImageBusy] = React.useState(false);
  const [notice, setNotice] = React.useState('');
  const [lockImageRatio, setLockImageRatio] = React.useState(true);
  const imageRatioRef = React.useRef<{
    editor: Editor;
    position: number;
    src: unknown;
    ratio: number;
  } | null>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const paperRef = React.useRef<HTMLElement>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const imageOperationRef = React.useRef(false);
  const clipboardOperationRef = React.useRef(false);
  const previousTabRef = React.useRef('home');
  const insertImageRef = React.useRef<(file: File, target: Editor | null) => Promise<void>>(
    async () => undefined
  );
  const focusRegionRef = React.useRef<WordRegion | null>(null);
  const bodyEditor: Editor | null = useEditor(
    {
      extensions: [...EXTENSIONS, WordParagraphStyles, WordNumbering, WordPaginationLayout,
        WordTabs.configure({ getDefaultTabStop: () => latest.current.document.defaultTabStop ?? 36, getDecimalSymbol: () => latest.current.document.decimalSymbol })],
      content: numberedContent(document.content, paragraphStyles),
      editable: editable && region === 'content',
      immediatelyRender: false,
      shouldRerenderOnTransaction: false,
      editorProps: {
        attributes: {
          role: 'textbox',
          'aria-label': 'Word 文档正文',
          'aria-multiline': 'true',
          'aria-readonly': String(!editable || region !== 'content'),
          spellcheck: 'false',
        },
        handlePaste: (_view, event) => {
          const file = Array.from(event.clipboardData?.files || []).find((item) =>
            /^image\/(png|jpeg)$/.test(item.type)
          );
          if (!file || !latest.current.editable) return false;
          event.preventDefault();
          void insertImageRef.current(file, bodyEditor);
          return true;
        },
      },
      onFocus: () => {
        setRegion('content');
        setTab((current) => (current === 'header-footer' ? previousTabRef.current : current));
      },
      onUpdate: ({ editor: current }) => {
        const state = latest.current;
        if (!state.editable) return;
        const content = current.getJSON() as StudioRichNode;
        const previousStyles = getStudioWordParagraphStyles(state.document.content);
        const nextStyles = getStudioWordParagraphStyles(content);
        const changedStyles = JSON.stringify(previousStyles) !== JSON.stringify(nextStyles);
        const nextDocument: StudioWordDocument = {
          ...state.document,
          content,
          ...(changedStyles && state.document.header
            ? {
                header: reconcileStudioWordStyles(
                  state.document.header,
                  previousStyles,
                  nextStyles
                ),
              }
            : {}),
          ...(changedStyles && state.document.footer
            ? {
                footer: reconcileStudioWordStyles(
                  state.document.footer,
                  previousStyles,
                  nextStyles
                ),
              }
            : {}),
        };
        latest.current.document = nextDocument;
        state.onChange(nextDocument);
        setContentRequest((request) => request + 1);
      },
    },
    [document.id]
  );

  const editor =
    region !== 'content' && regions[region] && !regions[region]!.isDestroyed
      ? regions[region]!
      : bodyEditor;
  const registerRegion = React.useCallback((name: WordRegion, current: Editor | null) => {
    setRegions((previous) => {
      if (previous[name] === current || (!current && !previous[name])) return previous;
      const next = { ...previous };
      if (current) next[name] = current;
      else delete next[name];
      return next;
    });
  }, []);
  React.useLayoutEffect(() => {
    for (const current of [bodyEditor, regions.header, regions.footer])
      if (current) wordSetNonprinting(current, showNonprinting);
  }, [bodyEditor, regions, showNonprinting]);
  React.useEffect(() => {
    setRegion('content');
    setTab((current) => (current === 'header-footer' ? 'home' : current));
    setSidePanel(null);
    setStatisticsOpen(false);
    setLinkOpen(false);
    setStyleDialog(null);
    setCharacterDialog(null);
    setParagraphDialog(null);
    setTabsDialog(null);
    setNumberDialog(null);
    setSurfaceDialog(null);
    setRowDialog(null);
    setNotice('');
  }, [document.id]);
  React.useLayoutEffect(() => {
    for (const target of [bodyEditor, regions.header, regions.footer])
      if (target) wordRefreshTabLayout(target);
  }, [bodyEditor, regions.header, regions.footer, document.defaultTabStop, document.decimalSymbol]);
  React.useEffect(() => {
    const requested = focusRegionRef.current;
    if (
      requested &&
      requested === region &&
      regions[requested] &&
      !regions[requested]!.isDestroyed
    ) {
      focusRegionRef.current = null;
      regions[requested]!.commands.focus('end');
    }
  }, [regions, region]);
  const focusBodyOnCloseRef = React.useRef(false);
  React.useEffect(() => {
    if (
      region === 'content' &&
      focusBodyOnCloseRef.current &&
      bodyEditor &&
      !bodyEditor.isDestroyed
    ) {
      focusBodyOnCloseRef.current = false;
      bodyEditor.commands.focus();
    }
  }, [bodyEditor, region]);
  React.useEffect(() => {
    if (sidePanel === 'search') searchInputRef.current?.focus();
  }, [sidePanel]);
  React.useEffect(() => setMatchIndex(-1), [editor, searchQuery, matchCase, formatCriteria]);

  const selection = useEditorState({
    editor,
    selector: ({ editor: current }) => {
      if (!current || current.isDestroyed || !current.schema) return null;
      const style = current.getAttributes('textStyle');
      const paragraph = current.getAttributes('paragraph');
      const numbered=wordNumberingContext(current);
      return {
        bold: current.isActive('bold'),
        italic: current.isActive('italic'),
        underline: current.isActive('underline'),
        strike: current.isActive('strike'),
        superscript: current.isActive('superscript'),
        subscript: current.isActive('subscript'),
        image: current.isActive('image') ? current.getAttributes('image') : null,
        matches: wordFindMatches(current, searchQuery, matchCase, formatCriteria),
        bullet: current.isActive('bulletList') || numbered?.level.format === 'bullet',
        ordered: current.isActive('orderedList') || (!!numbered && numbered.level.format !== 'bullet'),
        numbering: numbered,
        canSinkList: current.isActive('listItem') ? current.can().sinkListItem('listItem') : !!numbered && numbered.ref.level+1<numbered.definition.levels.length,
        canLiftList: current.isActive('listItem') ? current.can().liftListItem('listItem') : !!numbered && numbered.ref.level>0,
        align: (current.getAttributes('heading').textAlign ||
          current.getAttributes('paragraph').textAlign ||
          'left') as string,
        from: current.state.selection.from,
        to: current.state.selection.to,
        font: (style.fontFamily || 'Noto Sans SC') as string,
        fontSize: (style.fontSize || '12pt') as string,
        color: (style.color || '#000000') as string,
        highlight: (style.backgroundColor || '') as string,
        style:
          ((current.getAttributes('heading').paragraphStyle ||
            paragraph.paragraphStyle) as string) ||
          (current.isActive('heading')
            ? `heading-${current.getAttributes('heading').level}`
            : paragraph.lineHeight === 1 &&
                paragraph.spaceBefore === 0 &&
                paragraph.spaceAfter === 0
              ? 'no-spacing'
              : 'paragraph'),
        selectedText: current.state.doc.textBetween(
          current.state.selection.from,
          current.state.selection.to,
          '\n'
        ),
        undo: current.can().undo(),
        redo: current.can().redo(),
        inTable: current.isActive('table'),
        indent: Number(current.state.selection.$from.parent.attrs.indentLeft || 0),
        lineHeight: String(
          current.state.selection.$from.parent.attrs.lineHeight ||
            (current.isActive('heading') ? 1.35 : 1.75)
        ),
        canMerge: current.can().mergeCells(),
        lineHeightRule: String(current.state.selection.$from.parent.attrs.lineHeightRule ?? 'auto'),
        canSplit: current.can().splitCell(),
      };
    },
  });
  const bodySummary = useEditorState({
    editor: bodyEditor,
    selector: ({ editor: current }) => {
      if (!current || current.isDestroyed || !current.schema) return null;
      const text = current.getText();
      let paragraphs = 0;
      current.state.doc.descendants((node) => {
        if (['paragraph', 'heading'].includes(node.type.name)) paragraphs++;
      });
      return {
        headings: wordHeadings(current),
        characters: Array.from(text).length,
        nonWhitespaceCharacters: Array.from(text.replace(/\s/g, '')).length,
        paragraphs,
      };
    },
  });
  const outline = bodySummary?.headings || [];

  React.useEffect(() => {
    if (!selection?.image) imageRatioRef.current = null;
  }, [selection?.image]);

  React.useLayoutEffect(() => {
    if (!bodyEditor || bodyEditor.isDestroyed || !bodyEditor.schema) return;
    bodyEditor.setEditable(editable && region === 'content', false);
    bodyEditor.setOptions({
      editorProps: {
        attributes: {
          role: 'textbox',
          'aria-label': 'Word 文档正文',
          'aria-multiline': 'true',
          'aria-readonly': String(!editable || region !== 'content'),
          spellcheck: 'false',
        },
        handlePaste: (_view, event) => {
          const file = Array.from(event.clipboardData?.files || []).find((item) =>
            /^image\/(png|jpeg)$/.test(item.type)
          );
          if (!file || !latest.current.editable) return false;
          event.preventDefault();
          void insertImageRef.current(file, bodyEditor);
          return true;
        },
      },
    });
  }, [bodyEditor, editable, region]);

  React.useLayoutEffect(() => {
    if (!bodyEditor || bodyEditor.isDestroyed) return;
    // A host can reject an update without changing the content reference. Accepted
    // content already matches the editor, so leave its selection and history alone.
    const content = numberedContent(document.content, paragraphStyles);
    if (JSON.stringify(bodyEditor.getJSON()) !== JSON.stringify(content)) {
      wordSetNumberedContent(bodyEditor,content);
    }
  }, [bodyEditor, document.content, contentRequest, paragraphStyles]);

  const [portraitWidth, portraitHeight] =
    document.page.size === 'Letter' ? [215.9, 279.4] : [210, 297];
  const landscape = document.page.orientation === 'landscape';
  const pageWidth = (landscape ? portraitHeight : portraitWidth) * MM_TO_PX;
  const pageHeight = (landscape ? portraitWidth : portraitHeight) * MM_TO_PX;
  const margin = Math.min(60, Math.max(5, document.page.margin)) * MM_TO_PX;
  const scale =
    zoom === 'fit' ? Math.min(1, Math.max(0.25, (stageWidth - 48) / pageWidth)) : Number(zoom);
  const headerDistance = document.page.headerDistance ?? DEFAULT_REGION_DISTANCE;
  const footerDistance = document.page.footerDistance ?? DEFAULT_REGION_DISTANCE;
  const [paginatedView,setPaginatedView]=React.useState(false);
  React.useLayoutEffect(()=>{
    if(bodyEditor)wordSetPagination(bodyEditor,{enabled:paginatedView,height:pageHeight-margin*2,margin,gap:24});
  },[bodyEditor,paginatedView,pageHeight,margin]);

  React.useEffect(() => {
    const stage = stageRef.current;
    const paper = paperRef.current;
    if (!stage || !paper) return;
    const measure = () => {
      if (stage.clientWidth) setStageWidth(stage.clientWidth);
      setPaperHeight(paper.offsetHeight);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    observer.observe(paper);
    return () => observer.disconnect();
  }, [bodyEditor, pageWidth, pageHeight, margin]);

  const updatePage = (patch: Partial<StudioWordDocument['page']>) => {
    if (!editable) return;
    const current = latest.current;
    current.onChange({ ...current.document, page: { ...current.document.page, ...patch } });
  };

  async function insertImage(file: File, target = editor) {
    if (!target || !latest.current.editable || imageOperationRef.current) return;
    const id = latest.current.document.id;
    imageOperationRef.current = true;
    setImageBusy(true);
    setNotice('正在读取图片…');
    try {
      const attrs = await wordReadImage(file, pageWidth - margin * 2);
      if (latest.current.document.id !== id || !latest.current.editable || target.isDestroyed)
        return;
      target.chain().focus().insertContent({ type: 'image', attrs }).run();
      setNotice('图片已插入，可选中图片调整尺寸。');
    } catch (error) {
      if (latest.current.document.id === id)
        setNotice(error instanceof Error ? error.message : '图片插入失败。');
    } finally {
      imageOperationRef.current = false;
      setImageBusy(false);
    }
  }
  insertImageRef.current = insertImage;

  const openRegion = (name: WordRegion) => {
    if (!editable) return;
    const state = latest.current;
    if (!state.document[name]) state.onChange({ ...state.document, [name]: EMPTY_REGION });
    if (tab !== 'header-footer') previousTabRef.current = tab;
    focusRegionRef.current = name;
    setRegion(name);
    setTab('header-footer');
  };

  const closeRegion = () => {
    if (region === 'content') return;
    focusRegionRef.current = null;
    focusBodyOnCloseRef.current = true;
    setRegion('content');
    setTab((current) => (current === 'header-footer' ? previousTabRef.current : current));
  };

  const changeTab = (value: string) => {
    if (region !== 'content' && value !== 'header-footer') previousTabRef.current = value;
    setTab(value);
  };

  const updateRegion = (name: WordRegion, content: StudioRichNode) => {
    const state = latest.current;
    if (state.editable)
      state.onChange({
        ...state.document,
        ...(content.attrs?.numberingDefinitions ? {content:{...state.document.content,attrs:{...state.document.content.attrs,numberingDefinitions:content.attrs.numberingDefinitions,numberingInstances:content.attrs.numberingInstances}}}:{}),
        [name]: content,
        ...(name === 'footer' ? { pageNumbers: hasPageNumber(content) } : {}),
      });
  };

  const togglePageNumbers = (value: boolean) => {
    const state = latest.current;
    if (!state.editable) return;
    const footer = withoutPageNumbers(state.document.footer || EMPTY_REGION);
    if (value)
      footer.content = [
        ...(footer.content || []),
        {
          type: 'paragraph',
          attrs: { textAlign: 'center' },
          content: [{ type: 'pageNumber', attrs: { kind: 'current' } }],
        },
      ];
    state.onChange({ ...state.document, footer, pageNumbers: value });
  };

  const navigateMatch = (index: number) => {
    const matches = selection?.matches || [];
    if (!editor || !matches.length) return;
    const next = (index + matches.length) % matches.length;
    setMatchIndex(next);
    editor.chain().focus().setTextSelection(matches[next]).scrollIntoView().run();
  };
  const stepMatch = (direction: number) => {
    const count = selection?.matches.length || 0;
    navigateMatch(matchIndex < 0 ? (direction > 0 ? 0 : count - 1) : matchIndex + direction);
  };

  const updateImage = (patch: Record<string, unknown>) => {
    if (!editor || !editable || !selection?.image) return;
    const position = editor.state.selection.from;
    editor
      .chain()
      .command(({ tr }) => {
        closeHistory(tr);
        return true;
      })
      .updateAttributes('image', patch)
      .setNodeSelection(position)
      .run();
  };

  const resizeImage = (dimension: 'width' | 'height', value: string) => {
    if (!editor || !editable || !selection?.image) return;
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount < 1 || amount > 2000) return;
    const attrs = selection.image;
    const patch = { [dimension]: amount };
    if (lockImageRatio) {
      const position = editor.state.selection.from;
      let original = imageRatioRef.current;
      if (
        !original ||
        original.editor !== editor ||
        original.position !== position ||
        original.src !== attrs.src
      ) {
        original = {
          editor,
          position,
          src: attrs.src,
          ratio: Number(attrs.width) / Number(attrs.height),
        };
        imageRatioRef.current = original;
      }
      const other = dimension === 'width' ? 'height' : 'width';
      patch[other] = Math.max(
        1,
        Math.min(
          2000,
          Math.round(dimension === 'width' ? amount / original.ratio : amount * original.ratio)
        )
      );
    }
    updateImage(patch);
  };

  const applyLink = () => {
    if (!editor || !editable) return;
    const href = linkHref.trim();
    if (!href) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      let protocol = '';
      try {
        protocol = new URL(href).protocol;
      } catch {
        setLinkError('请输入完整的 https://、http:// 或 mailto: 地址。');
        return;
      }
      if (!['https:', 'http:', 'mailto:'].includes(protocol)) {
        setLinkError('链接仅支持 https://、http:// 和 mailto: 地址。');
        return;
      }
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    }
    setLinkOpen(false);
  };

  const fontOptions = FONT_OPTIONS;
  const sizeOptions = SIZE_OPTIONS.map((option) => ({ ...option, value: option.label }));
  const fontSelectionRef = React.useRef<{
    editor: Editor;
    selection: Editor['state']['selection'];
    doc: Editor['state']['doc'];
  } | null>(null);
  const rememberFontSelection = () => {
    if (editor && !editor.isDestroyed)
      fontSelectionRef.current = {
        editor,
        selection: editor.state.selection,
        doc: editor.state.doc,
      };
  };
  const commitFont = (kind: 'family' | 'size', value: string, reason: StudioFontCommitReason) => {
    const saved = fontSelectionRef.current;
    if (
      !editor ||
      !editable ||
      !saved ||
      saved.editor !== editor ||
      editor.isDestroyed ||
      saved.doc !== editor.state.doc
    )
      return false;
    const chain = editor.chain().command(({ tr }) => {
      tr.setSelection(saved.selection);
      return true;
    });
    if (reason !== 'blur') chain.focus();
    return kind === 'family'
      ? chain.setFontFamily(value).run()
      : chain.setFontSize(`${value}pt`).run();
  };
  const fontContextKey = `${document.id}:${region}:${selection?.from}:${selection?.to}`;
  const toolsDisabled = !editor || !editable;
  const applyParagraphStyle = (value: string) => {
    if (!editor || !editable) return;
    if (
      paragraphStyles.some((style) => style.id === value) ||
      editor.state.selection.$from.parent.attrs.paragraphStyle
    ) {
      try {
        wordApplyParagraphStyle(editor, value, paragraphStyles);
      } catch (cause) {
        setNotice(cause instanceof Error ? cause.message : '样式无法应用。');
      }
      return;
    }
    const chain = editor.chain().focus();
    if (value === 'no-spacing')
      chain
        .setParagraph()
        .updateAttributes('paragraph', { lineHeight: 1, spaceBefore: 0, spaceAfter: 0 })
        .run();
    else if (value === 'paragraph')
      chain
        .setParagraph()
        .updateAttributes('paragraph', { lineHeight: null, spaceBefore: null, spaceAfter: null })
        .run();
    else chain.setHeading({ level: Number(value.slice(-1)) as 1 | 2 | 3 | 4 | 5 | 6 }).run();
  };
  const adjustIndent = (amount: number) => {
    if (!editor || !editable) return;
    wordSetParagraphFormat(editor, (current) => ({
      indentLeft: Math.max(0, Math.min(500, current.indentLeft + amount)),
    }));
  };
  const lineOptions = [
    1,
    1.15,
    1.5,
    1.75,
    2,
    ...(selection?.lineHeightRule === 'auto' &&
    selection.lineHeight &&
    ![1, 1.15, 1.5, 1.75, 2].includes(Number(selection.lineHeight))
      ? [Number(selection.lineHeight)]
      : []),
  ].map((value) => ({ value: String(value), label: `${value} 倍行距` }));
  if (selection?.lineHeightRule !== 'auto' && selection)
    lineOptions.push({
      value: 'current',
      label: `${selection.lineHeight}pt ${selection.lineHeightRule === 'exact' ? '固定' : '最小'}`,
    });
  const openParagraphSettings = () => {
    if (!editor || !editable || editor.view.composing) return;
    const root = editor.view.dom.closest('.zuvi-studio-word'),
      focused = window.document.activeElement;
    if (
      focused instanceof HTMLElement &&
      root?.contains(focused) &&
      focused.matches('input,textarea')
    )
      flushSync(() => focused.blur());
    if (root?.querySelector('[data-studio-input-error]')) {
      setNotice('请先修正当前输入，或按 Esc 取消。');
      return;
    }
    setParagraphDialog({
      editor,
      doc: editor.state.doc,
      selection: editor.state.selection,
      values: wordSelectionParagraphFormat(editor),
    });
  };
  const prepareTabAction = () => {
    if (!editor || !editable || editor.view.composing) return false;
    const root = editor.view.dom.closest('.zuvi-studio-word'), focused = window.document.activeElement;
    if (focused instanceof HTMLElement && root?.contains(focused) && focused.matches('input,textarea'))
      flushSync(() => focused.blur());
    if (root?.querySelector('[data-studio-input-error]')) {
      setNotice('请先修正当前输入，或按 Esc 取消。'); return false;
    }
    return true;
  };
  const openTabsSettings = () => {
    if (!prepareTabAction() || !editor) return;
    setTabsDialog({ editor, doc: editor.state.doc, selection: editor.state.selection, values: wordSelectionTabStops(editor) });
  };
  // ---- 本轮新增：字号步进 / 高亮 / 大小写 / 格式刷 ----
  const [highlightOpen, setHighlightOpen] = React.useState(false);
  const [caseMenuOpen, setCaseMenuOpen] = React.useState(false);
  const [formatPainter, setFormatPainter] = React.useState<WordFormatSnapshot | null>(null);
  const [continuousPainter, setContinuousPainter] = React.useState(false);
  const painterTargetRef = React.useRef('');
  React.useEffect(() => {
    setFormatPainter(null);
    setContinuousPainter(false);
    painterTargetRef.current = '';
  }, [document.id, editable]);
  const formatPainterRef = React.useRef<WordFormatSnapshot | null>(null);
  formatPainterRef.current = formatPainter;
  const stepFontSize = (delta: number) => {
    if (!editor || !editable) return;
    wordStepFontSize(editor, delta);
  };
  const setHighlight = (color: string | null) => {
    if (!editor || !editable) return;
    wordSetHighlight(editor, color);
    setHighlightOpen(false);
  };
  const transformCase = (mode: WordCaseMode) => {
    if (!editor || !editable) return;
    try {
      if (wordTransformSelectionCase(editor, mode)) setCaseMenuOpen(false);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '大小写转换失败，请缩小选区后重试。');
    }
  };
  const armFormatPainter = (continuous = false) => {
    if (!editor || !editable || !selection?.selectedText) return;
    setFormatPainter(wordCaptureFormat(editor));
    setContinuousPainter(continuous);
    painterTargetRef.current = `${region}:${editor.state.selection.from}:${editor.state.selection.to}`;
  };
  const disarmFormatPainter = () => {
    setFormatPainter(null);
    setContinuousPainter(false);
  };
  // Apply each new selection once; continuous mode remains armed until Escape.
  React.useEffect(() => {
    const snapshot = formatPainterRef.current;
    if (!snapshot || !editor || !editable) return;
    if (editor.state.selection.empty) return;
    const target = `${region}:${editor.state.selection.from}:${editor.state.selection.to}`;
    if (painterTargetRef.current === target) return;
    painterTargetRef.current = target;
    if (wordApplyFormat(editor, snapshot)) {
      if (!continuousPainter) setFormatPainter(null);
      setNotice(continuousPainter ? '已应用格式刷；继续选择目标，Esc 结束。' : '已应用格式刷。');
    }
  }, [
    editor?.state.selection.from,
    editor?.state.selection.to,
    editor,
    editable,
    region,
    continuousPainter,
  ]);
  React.useEffect(() => {
    if (!formatPainter) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.isComposing || event.keyCode === 229) return;
      event.preventDefault();
      disarmFormatPainter();
      setNotice('已取消格式刷。');
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [formatPainter]);

  const handleClipboard = async (action: 'copy' | 'cut' | 'paste') => {
    const target = editor;
    if (!target || clipboardOperationRef.current || (action !== 'copy' && !editable)) return;
    const documentId = latest.current.document.id;
    const originalContent = target.state.doc;
    const range = { from: target.state.selection.from, to: target.state.selection.to };
    const clipboard = typeof navigator === 'undefined' ? undefined : navigator.clipboard;
    clipboardOperationRef.current = true;
    setClipboardBusy(true);
    try {
      if (action === 'paste') {
        if (!clipboard?.readText) throw new Error('clipboard unavailable');
        const text = await clipboard.readText();
        if (
          !text ||
          target.isDestroyed ||
          latest.current.document.id !== documentId ||
          !latest.current.editable ||
          !target.state.doc.eq(originalContent)
        )
          return;
        const lines = text.replace(/\r\n?/g, '\n').split('\n');
        target
          .chain()
          .focus()
          .insertContentAt(
            range,
            lines.length === 1
              ? { type: 'text', text }
              : lines.map((line) => ({
                  type: 'paragraph',
                  content: line ? [{ type: 'text', text: line }] : [],
                }))
          )
          .run();
      } else {
        const text = originalContent.textBetween(range.from, range.to, '\n');
        if (!text) return;
        if (!clipboard?.writeText) throw new Error('clipboard unavailable');
        await clipboard.writeText(text);
        if (action === 'cut') {
          if (
            target.isDestroyed ||
            latest.current.document.id !== documentId ||
            !latest.current.editable ||
            !target.state.doc.eq(originalContent)
          )
            return;
          target.chain().focus().setTextSelection(range).deleteSelection().run();
        }
      }
      if (latest.current.document.id === documentId)
        setNotice(
          action === 'copy'
            ? '已复制所选文本。'
            : action === 'cut'
              ? '已剪切所选文本。'
              : '已粘贴文本。'
        );
    } catch {
      if (latest.current.document.id === documentId)
        setNotice(
          `请使用 Ctrl/⌘+${action === 'copy' ? 'C' : action === 'cut' ? 'X' : 'V'} ${action === 'copy' ? '复制' : action === 'cut' ? '剪切' : '粘贴'}。`
        );
    } finally {
      clipboardOperationRef.current = false;
      setClipboardBusy(false);
    }
  };

  return (
    <div
      className="zuvi-studio-word"
      data-part="word"
      data-readonly={!editable || undefined}
      data-nonprinting={showNonprinting || undefined}
      onClick={(event) => {
        const image =
          event.target instanceof HTMLElement ? event.target.closest('img[data-word-image]') : null;
        if (!image) return;
        for (const [name, current] of [
          ['content', bodyEditor],
          ['header', regions.header],
          ['footer', regions.footer],
        ] as const) {
          if (!current || current.isDestroyed || !current.view.dom.contains(image)) continue;
          event.preventDefault();
          const node = image.closest('[data-word-image-node]') || image;
          const position = current.view.posAtDOM(node, 0);
          current.chain().focus().setNodeSelection(position).run();
          setRegion(name);
          setTab('insert');
          break;
        }
      }}
      onKeyDownCapture={(event) => {
        if (
          !disabled &&
          (event.ctrlKey || event.metaKey) &&
          !event.altKey &&
          !event.nativeEvent.isComposing &&
          event.keyCode !== 229 &&
          ((event.shiftKey && ['8', '*'].includes(event.key)) ||
            (event.metaKey && event.key === '8')) &&
          !(
            event.target instanceof Element &&
            event.target.closest('input, textarea, select, [role="combobox"], [role="dialog"]')
          )
        ) {
          event.preventDefault();
          event.stopPropagation();
          setShowNonprinting((value) => !value);
          return;
        }
        if (
          (event.ctrlKey || event.metaKey) &&
          !event.altKey &&
          ['f', 'h'].includes(event.key.toLowerCase())
        ) {
          event.preventDefault();
          setSidePanel('search');
          if (event.key.toLowerCase() === 'h') setNotice('输入查找内容和替换文本。');
          searchInputRef.current?.focus();
        } else if (event.key === 'Escape' && sidePanel) {
          event.preventDefault();
          setSidePanel(null);
        } else if (event.key === 'Escape' && region !== 'content') {
          event.preventDefault();
          closeRegion();
        }
      }}
    >
      <Tabs
        value={tab}
        onValueChange={changeTab}
        className="zuvi-studio-word-ribbon zuvi-studio-ribbon"
      >
        <StudioRibbonTabs>
          <Tabs.List aria-label="Word 工具">
            <Tabs.Trigger value="home">开始</Tabs.Trigger>
            <Tabs.Trigger value="insert">插入</Tabs.Trigger>
            <Tabs.Trigger value="layout">布局</Tabs.Trigger>
            <Tabs.Trigger value="references">引用</Tabs.Trigger>
            <Tabs.Trigger value="review">审阅</Tabs.Trigger>
            <Tabs.Trigger value="view">视图</Tabs.Trigger>
            {region !== 'content' && (
              <Tabs.Trigger value="header-footer" className="zuvi-studio-word-context-tab">
                页眉和页脚
              </Tabs.Trigger>
            )}
          </Tabs.List>
        </StudioRibbonTabs>
        <Tabs.Panel value="home" className="zuvi-studio-word-tool-row">
          <RibbonGroup label="剪贴板" className="zuvi-studio-word-clipboard-group">
            <Button
              variant="ghost"
              size="sm"
              className="zuvi-studio-word-large-tool"
              title="粘贴剪贴板文本 (Ctrl/⌘+V)"
              disabled={toolsDisabled || clipboardBusy}
              onMouseDown={keepSelection}
              onClick={() => void handleClipboard('paste')}
            >
              <Clipboard size={24} />
              <span>粘贴</span>
            </Button>
            <div className="zuvi-studio-word-tool-stack">
              <Button
                variant="ghost"
                size="sm"
                iconStart={<Scissors size={16} />}
                title="剪切所选文本 (Ctrl/⌘+X)"
                disabled={toolsDisabled || clipboardBusy || !selection?.selectedText}
                onMouseDown={keepSelection}
                onClick={() => void handleClipboard('cut')}
              >
                剪切
              </Button>
              <Button
                variant="ghost"
                size="sm"
                iconStart={<Copy size={16} />}
                title="复制所选文本 (Ctrl/⌘+C)"
                disabled={!editor || clipboardBusy || !selection?.selectedText}
                onMouseDown={keepSelection}
                onClick={() => void handleClipboard('copy')}
              >
                复制
              </Button>
            </div>
          </RibbonGroup>
          <Button
            variant="ghost"
            size="sm"
            className="zuvi-studio-word-large-tool"
            aria-label="格式刷"
            title="格式刷：单击应用一次，双击连续应用；复制文字和段落格式，Esc 结束"
            aria-pressed={formatPainter ? true : undefined}
            disabled={toolsDisabled || !selection?.selectedText}
            onMouseDown={keepSelection}
            onClick={() => armFormatPainter()}
            onDoubleClick={() => armFormatPainter(true)}
          >
            <Droplet size={24} />
            <span>格式刷</span>
          </Button>
          <RibbonGroup label="历史" className="zuvi-studio-word-history-group">
            <Button
              iconStart={<RotateCcw size={16} />}
              variant="ghost"
              size="sm"
              disabled={toolsDisabled || !selection?.undo}
              onMouseDown={keepSelection}
              onClick={() => editor?.chain().focus().undo().run()}
            >
              撤销
            </Button>
            <Button
              iconStart={<RotateCcw size={16} style={{ transform: 'scaleX(-1)' }} />}
              variant="ghost"
              size="sm"
              disabled={toolsDisabled || !selection?.redo}
              onMouseDown={keepSelection}
              onClick={() => editor?.chain().focus().redo().run()}
            >
              重做
            </Button>
          </RibbonGroup>
          <RibbonGroup label="字体" className="zuvi-studio-word-font-group">
            <RibbonRow>
              <StudioFontControl
                label="字体"
                kind="family"
                options={fontOptions}
                value={selection?.font || 'Noto Sans SC'}
                disabled={toolsDisabled}
                contextKey={fontContextKey}
                className="zuvi-studio-word-font"
                onEditStart={rememberFontSelection}
                onCommit={(value, reason) => commitFont('family', value, reason)}
                onCancel={() => editor?.commands.focus()}
              />
              <StudioFontControl
                label="字号"
                kind="size"
                maxSize={409}
                sizeStep={0.5}
                options={sizeOptions}
                value={(selection?.fontSize || '12pt').replace(/pt$/i, '')}
                disabled={toolsDisabled}
                contextKey={fontContextKey}
                className="zuvi-studio-word-size"
                onEditStart={rememberFontSelection}
                onCommit={(value, reason) => commitFont('size', value, reason)}
                onCancel={() => editor?.commands.focus()}
              />
              <Button
                aria-label="增大字号"
                title="增大字号"
                variant="ghost"
                size="sm"
                disabled={toolsDisabled}
                onMouseDown={keepSelection}
                onClick={() => stepFontSize(1)}
              >
                <Plus size={14} />
              </Button>
              <Button
                aria-label="减小字号"
                title="减小字号"
                variant="ghost"
                size="sm"
                disabled={toolsDisabled}
                onMouseDown={keepSelection}
                onClick={() => stepFontSize(-1)}
              >
                <Minus size={14} />
              </Button>
            </RibbonRow>
            <Button
              size="sm"
              variant="ghost"
              disabled={toolsDisabled}
              onMouseDown={keepSelection}
              onClick={() => {
                if (!editor || !editable || editor.view.composing) return;
                const root = editor.view.dom.closest('.zuvi-studio-word');
                const focused = window.document.activeElement;
                if (
                  focused instanceof HTMLElement &&
                  root?.contains(focused) &&
                  focused.matches('input,textarea')
                )
                  flushSync(() => focused.blur());
                if (root?.querySelector('[data-studio-input-error]')) {
                  setNotice('请先修正当前输入，或按 Esc 取消。');
                  return;
                }
                setCharacterDialog({
                  editor,
                  doc: editor.state.doc,
                  selection: editor.state.selection,
                  values: wordSelectionMetrics(editor),
                  text: editor.state.doc.textBetween(
                    editor.state.selection.from,
                    editor.state.selection.to,
                    ' '
                  ),
                });
              }}
            >
              字符间距与位置
            </Button>
            <RibbonRow>
              <Button
                aria-label="粗体"
                title="粗体 (Ctrl/⌘+B)"
                aria-pressed={selection?.bold || false}
                variant="ghost"
                size="sm"
                disabled={toolsDisabled}
                onMouseDown={keepSelection}
                onClick={() => editor?.chain().focus().toggleBold().run()}
              >
                <Bold size={16} />
              </Button>
              <Button
                aria-label="斜体"
                title="斜体 (Ctrl/⌘+I)"
                aria-pressed={selection?.italic || false}
                variant="ghost"
                size="sm"
                disabled={toolsDisabled}
                onMouseDown={keepSelection}
                onClick={() => editor?.chain().focus().toggleItalic().run()}
              >
                <Italic size={16} />
              </Button>
              <Button
                aria-label="下划线"
                aria-pressed={selection?.underline || false}
                variant="ghost"
                size="sm"
                disabled={toolsDisabled}
                onMouseDown={keepSelection}
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
              >
                <span className="zuvi-studio-word-underline">U</span>
              </Button>
              <Button
                aria-label="删除线"
                aria-pressed={selection?.strike || false}
                variant="ghost"
                size="sm"
                disabled={toolsDisabled}
                onMouseDown={keepSelection}
                onClick={() => editor?.chain().focus().toggleStrike().run()}
              >
                <s>S</s>
              </Button>
              <Button
                aria-label="上标"
                aria-pressed={selection?.superscript || false}
                variant="ghost"
                size="sm"
                disabled={toolsDisabled}
                onMouseDown={keepSelection}
                onClick={() => editor?.chain().focus().toggleMark('superscript').run()}
              >
                x<sup>2</sup>
              </Button>
              <Button
                aria-label="下标"
                aria-pressed={selection?.subscript || false}
                variant="ghost"
                size="sm"
                disabled={toolsDisabled}
                onMouseDown={keepSelection}
                onClick={() => editor?.chain().focus().toggleMark('subscript').run()}
              >
                x<sub>2</sub>
              </Button>
              <ColorPicker
                aria-label="文字颜色"
                title="文字颜色"
                value={selection?.color || '#000000'}
                disabled={toolsDisabled}
                size="sm"
                onChange={(value) => editor?.chain().focus().setColor(value).run()}
              />
              <Button
                aria-label="清除格式"
                title="清除文字和段落格式"
                variant="ghost"
                size="sm"
                disabled={toolsDisabled}
                onMouseDown={keepSelection}
                onClick={() => {
                  if (editor) wordClearFormat(editor);
                }}
              >
                <span aria-hidden="true" className="zuvi-studio-word-clear-format">
                  A
                </span>
              </Button>
              <DropdownMenu
                open={highlightOpen}
                onOpenChange={(open) => {
                  setHighlightOpen(open);
                  if (!open && editor && !editor.isDestroyed) editor.commands.focus();
                }}
              >
                <DropdownMenu.Trigger
                  className="zuvi-studio-word-highlight-trigger"
                  onMouseDown={keepSelection}
                  aria-label="文字高亮"
                  title="文字高亮"
                  aria-pressed={selection?.highlight ? true : undefined}
                  disabled={toolsDisabled}
                >
                  <Droplet size={16} />
                  <span
                    aria-hidden="true"
                    className="zuvi-studio-word-highlight-bar"
                    style={{ background: selection?.highlight || 'transparent' }}
                  />
                </DropdownMenu.Trigger>
                <DropdownMenu.Content className="zuvi-studio-word-highlight-menu">
                  <DropdownMenu.Label>高亮颜色</DropdownMenu.Label>
                  <DropdownMenu.Item
                    onSelect={() => setHighlight(null)}
                    disabled={!selection?.highlight}
                  >
                    <span className="zuvi-studio-word-highlight-row">
                      无颜色
                      {!selection?.highlight ? <Check size={14} aria-hidden="true" /> : null}
                    </span>
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator />
                  {WORD_HIGHLIGHT_COLORS.map((color) => (
                    <DropdownMenu.Item key={color.value} onSelect={() => setHighlight(color.value)}>
                      <span className="zuvi-studio-word-highlight-row">
                        <span
                          aria-hidden="true"
                          className="zuvi-studio-word-highlight-swatch"
                          style={{ background: color.value }}
                        />
                        {color.label}
                        {selection?.highlight?.toLowerCase() === color.value ? (
                          <Check size={14} aria-hidden="true" />
                        ) : null}
                      </span>
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu>
              <DropdownMenu
                open={caseMenuOpen}
                onOpenChange={(open) => {
                  setCaseMenuOpen(open);
                  if (!open && editor && !editor.isDestroyed) editor.commands.focus();
                }}
              >
                <DropdownMenu.Trigger
                  className="zuvi-studio-word-case-trigger"
                  onMouseDown={keepSelection}
                  aria-label="变更大小写"
                  title="变更大小写"
                  disabled={toolsDisabled}
                >
                  <TypeIcon size={16} />
                </DropdownMenu.Trigger>
                <DropdownMenu.Content className="zuvi-studio-word-case-menu">
                  <DropdownMenu.Label>变更大小写</DropdownMenu.Label>
                  <DropdownMenu.Item onSelect={() => transformCase('sentence')}>
                    句首字母大写
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onSelect={() => transformCase('title')}>
                    每个单词首字母大写
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onSelect={() => transformCase('upper')}>
                    全部大写
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onSelect={() => transformCase('lower')}>
                    全部小写
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onSelect={() => transformCase('toggle')}>
                    切换大小写
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu>
            </RibbonRow>
          </RibbonGroup>
          <RibbonGroup label="段落" className="zuvi-studio-word-paragraph-group">
            <RibbonRow>
              <Button
                aria-label="项目符号"
                title="项目符号"
                aria-pressed={selection?.bullet || false}
                variant="ghost"
                size="sm"
                disabled={toolsDisabled}
                onMouseDown={keepSelection}
                onClick={() => {if(prepareTabAction()&&editor)try{wordToggleNumberingPreset(editor,'bullet');}catch(error){setNotice(error instanceof Error?error.message:'编号未修改。');}}}
              >
                <span aria-hidden="true">• ≡</span>
              </Button>
              <Button
                aria-label="编号列表"
                title="编号列表"
                aria-pressed={selection?.ordered || false}
                variant="ghost"
                size="sm"
                disabled={toolsDisabled}
                onMouseDown={keepSelection}
                onClick={() => {if(prepareTabAction()&&editor)try{wordToggleNumberingPreset(editor,'decimal');}catch(error){setNotice(error instanceof Error?error.message:'编号未修改。');}}}
              >
                <span aria-hidden="true">1. ≡</span>
              </Button>
              <Button
                aria-label="列表下沉缩进"
                title="列表下沉缩进（Tab）：编号变为下一级，如 1.1"
                variant="ghost"
                size="sm"
                disabled={toolsDisabled || !selection?.canSinkList}
                onMouseDown={keepSelection}
                onClick={() => {if(editor)try{if(editor.isActive('listItem'))editor.chain().focus().sinkListItem('listItem').run();else wordChangeNumberingLevel(editor,1);}catch(error){setNotice(error instanceof Error?error.message:'层级未修改。');}}}
              >
                <span aria-hidden="true">1.1 →</span>
              </Button>
              <Button
                aria-label="列表上提缩进"
                title="列表上提缩进（Shift+Tab）：回到上一级编号"
                variant="ghost"
                size="sm"
                disabled={toolsDisabled || !selection?.canLiftList}
                onMouseDown={keepSelection}
                onClick={() => {if(editor)try{if(editor.isActive('listItem'))editor.chain().focus().liftListItem('listItem').run();else wordChangeNumberingLevel(editor,-1);}catch(error){setNotice(error instanceof Error?error.message:'层级未修改。');}}}
              >
                <span aria-hidden="true">← 1.1</span>
              </Button>
              <Button
                aria-label="减少缩进"
                title="减少缩进"
                variant="ghost"
                size="sm"
                disabled={toolsDisabled || (selection?.indent || 0) <= 0}
                onMouseDown={keepSelection}
                onClick={() => adjustIndent(-18)}
              >
                ← ≡
              </Button>
              <Button
                aria-label="增加缩进"
                title="增加缩进"
                variant="ghost"
                size="sm"
                disabled={toolsDisabled}
                onMouseDown={keepSelection}
                onClick={() => adjustIndent(18)}
              >
                ≡ →
              </Button>
              <Button size="sm" variant="ghost" disabled={toolsDisabled||!selection?.numbering} onMouseDown={keepSelection} onClick={()=>{
                if(!prepareTabAction()||!editor)return;
                try{setNotice(wordContinueNumbering(editor)?'已继续此前编号，可撤销恢复。':'没有可继续的此前编号。');}catch(error){setNotice(error instanceof Error?error.message:'编号未修改。');}
              }}>继续编号</Button>
              <Input aria-label="编号起始值" size="sm" value={numberStart} inputMode="numeric" disabled={toolsDisabled||!selection?.numbering} aria-invalid={!/^\d+$/.test(numberStart)||Number(numberStart)<1||Number(numberStart)>100000} onChange={(event)=>setNumberStart(event.target.value)} onKeyDown={(event)=>{
                if(event.nativeEvent.isComposing||event.keyCode===229)return;
                if(event.key==='Escape'){event.preventDefault();event.stopPropagation();setNumberStart('1');}
                else if(event.key==='Enter'&&/^\d+$/.test(numberStart)&&Number(numberStart)>=1&&Number(numberStart)<=100000&&prepareTabAction()&&editor){event.preventDefault();try{wordRestartNumbering(editor,Number(numberStart));}catch(error){setNotice(error instanceof Error?error.message:'编号未修改。');}}
              }} />
              <Button size="sm" variant="ghost" disabled={toolsDisabled||!selection?.numbering||!/^\d+$/.test(numberStart)||Number(numberStart)<1||Number(numberStart)>100000} onMouseDown={keepSelection} onClick={()=>{
                if(!prepareTabAction()||!editor)return;
                try{wordRestartNumbering(editor,Number(numberStart));setNotice('已重新开始编号，可撤销恢复。');}catch(error){setNotice(error instanceof Error?error.message:'编号未修改。');}
              }}>重新开始编号</Button>
              <Select aria-label="编号格式" size="sm" disabled={toolsDisabled||!selection?.numbering} value={selection?.numbering?.level.format ?? 'decimal'}
                options={[{value:'decimal',label:'1, 2, 3'},{value:'upperRoman',label:'I, II, III'},{value:'lowerRoman',label:'i, ii, iii'},{value:'upperLetter',label:'A, B, C'},{value:'lowerLetter',label:'a, b, c'},{value:'bullet',label:'• 项目符号'}]} onChange={(format)=>{
                  if(!prepareTabAction()||!editor)return;
                  const current=wordNumberingContext(editor);if(!current)return;
                  const next=structuredClone(current.catalog),level=next.definitions.find((entry)=>entry.id===current.definition.id)!.levels[current.ref.level];
                  level.format=format as typeof level.format;if(format==='bullet')level.text='•';else if(current.level.format==='bullet')level.text=`%${current.ref.level+1}.`;
                  try{wordSetNumberingCatalog(editor,next);setNotice('已修改编号格式，可撤销恢复。');}catch(error){setNotice(error instanceof Error?error.message:'编号格式未修改。');}
                }} />
              <Button size="sm" variant="ghost" disabled={toolsDisabled} onMouseDown={keepSelection} onClick={()=>{
                if(!prepareTabAction()||!editor)return;
                const current=wordNumberingContext(editor);
                setNumberDialog({editor,doc:editor.state.doc,selection:editor.state.selection,catalog:wordEditorNumbering(editor),currentId:current?.definition.id,level:current?.ref.level??0});
              }}>多级编号定义</Button>
              <Button size="sm" variant="ghost" disabled={toolsDisabled} onMouseDown={keepSelection} onClick={()=>{
                if(!prepareTabAction()||!editor)return;
                setSurfaceDialog({editor,doc:editor.state.doc,selection:editor.state.selection,surfaces:wordSelectionSurfaces(editor)});
              }}>段落边框与底纹</Button>
              <Select
                aria-label="段落行距"
                size="sm"
                disabled={toolsDisabled}
                value={
                  selection?.lineHeightRule === 'auto' ? selection?.lineHeight || '1.75' : 'current'
                }
                options={lineOptions}
                onChange={(value) => {
                  if (editor && value !== 'current')
                    wordSetParagraphFormat(editor, {
                      lineHeight: Number(value),
                      lineHeightRule: 'auto',
                    });
                }}
              />
              <Button
                size="sm"
                variant="ghost"
                disabled={toolsDisabled}
                onMouseDown={keepSelection}
                onClick={openParagraphSettings}
              >
                段落设置
              </Button>
              <Button size="sm" variant="ghost" disabled={toolsDisabled} onMouseDown={keepSelection} onClick={openTabsSettings}>制表位</Button>
              <Button size="sm" variant="ghost" disabled={toolsDisabled} onMouseDown={keepSelection}
                onClick={() => { if (prepareTabAction() && editor) wordInsertTab(editor); }}>插入制表符</Button>
            </RibbonRow>
            <RibbonRow>
              {ALIGNMENTS.map(({ value, label, Icon }) => (
                <Button
                  key={value}
                  aria-label={label}
                  title={label}
                  aria-pressed={selection?.align === value}
                  variant="ghost"
                  size="sm"
                  disabled={toolsDisabled}
                  onMouseDown={keepSelection}
                  onClick={() => editor && wordSetParagraphFormat(editor, { textAlign: value })}
                >
                  <Icon size={16} />
                </Button>
              ))}
              <Button
                aria-label="显示非打印字符"
                title="显示非打印字符（Ctrl+Shift+8 / ⌘+8）"
                aria-pressed={showNonprinting}
                variant="ghost"
                size="sm"
                disabled={disabled || !bodyEditor}
                onMouseDown={keepSelection}
                onClick={() => setShowNonprinting((value) => !value)}
              >
                <span aria-hidden="true">¶</span>
              </Button>
            </RibbonRow>
          </RibbonGroup>
          <RibbonGroup label="样式" className="zuvi-studio-word-styles-group">
            <div className="zuvi-studio-word-style-gallery" data-part="word-style-gallery">
              {STYLE_PREVIEWS.map(({ value, label }) => (
                <Button
                  key={value}
                  variant="ghost"
                  size="sm"
                  className="zuvi-studio-word-style-preview"
                  data-style={value}
                  aria-label={`${label}样式`}
                  aria-pressed={selection?.style === value}
                  title={label}
                  disabled={toolsDisabled}
                  onMouseDown={keepSelection}
                  onClick={() => applyParagraphStyle(value)}
                >
                  <span className="zuvi-studio-word-style-sample" aria-hidden="true">
                    AaBbCc
                  </span>
                  <span>{label}</span>
                </Button>
              ))}
            </div>
            <Select
              aria-label="段落样式"
              className="zuvi-studio-word-style-list"
              options={styleOptions}
              value={selection?.style || 'paragraph'}
              disabled={toolsDisabled}
              size="sm"
              onChange={applyParagraphStyle}
            />
            <RibbonRow>
              <Button
                variant="ghost"
                size="sm"
                aria-label="新建段落样式"
                disabled={toolsDisabled}
                onMouseDown={keepSelection}
                onClick={() =>
                  setStyleDialog({
                    id: `style-${globalThis.crypto.randomUUID()}`,
                    name: '',
                    basedOn: selection?.style || 'paragraph',
                  })
                }
              >
                新建样式
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label="修改段落样式"
                disabled={
                  toolsDisabled || !paragraphStyles.some((style) => style.id === selection?.style)
                }
                onMouseDown={keepSelection}
                onClick={() =>
                  setStyleDialog(
                    paragraphStyles.find((style) => style.id === selection?.style) || null
                  )
                }
              >
                修改样式
              </Button>
            </RibbonRow>
          </RibbonGroup>
          <RibbonGroup label="编辑" className="zuvi-studio-word-navigation-group">
            <Button
              aria-label="查找与替换"
              title="查找与替换 (Ctrl/⌘+F)"
              iconStart={<Search size={16} />}
              variant="ghost"
              size="sm"
              disabled={!editor}
              onClick={() => setSidePanel('search')}
            >
              查找
            </Button>
            <Button
              aria-label="文档大纲"
              title="文档大纲"
              iconStart={<Book size={16} />}
              variant="ghost"
              size="sm"
              disabled={!bodyEditor}
              onClick={() => setSidePanel('outline')}
            >
              大纲
            </Button>
          </RibbonGroup>
        </Tabs.Panel>
        <Tabs.Panel value="insert" className="zuvi-studio-word-tool-row">
          <RibbonGroup label="页面">
            <Button
              variant="ghost"
              size="sm"
              className="zuvi-studio-word-large-tool"
              title="插入分页符"
              disabled={toolsDisabled}
              onMouseDown={keepSelection}
              onClick={() => editor?.chain().focus().insertContent({ type: 'pageBreak' }).run()}
            >
              <FileText size={24} />
              <span>分页符</span>
            </Button>
          </RibbonGroup>
          <RibbonGroup label="表格" className="zuvi-studio-word-table-group">
            <Select
              aria-label="表格行数"
              size="sm"
              value={tableRows}
              disabled={toolsDisabled}
              options={[2, 3, 4, 5, 6, 8, 10].map((value) => ({
                value: String(value),
                label: `${value} 行`,
              }))}
              onChange={setTableRows}
            />
            <Select
              aria-label="表格列数"
              size="sm"
              value={tableColumns}
              disabled={toolsDisabled}
              options={[2, 3, 4, 5, 6, 8].map((value) => ({
                value: String(value),
                label: `${value} 列`,
              }))}
              onChange={setTableColumns}
            />
            <Checkbox
              label="标题行"
              checked={tableHeader}
              disabled={toolsDisabled}
              onChange={setTableHeader}
            />
            <Button
              variant="secondary"
              size="sm"
              disabled={toolsDisabled}
              onMouseDown={keepSelection}
              onClick={() =>
                editor
                  ?.chain()
                  .focus()
                  .insertTable({
                    rows: Number(tableRows),
                    cols: Number(tableColumns),
                    withHeaderRow: tableHeader,
                  })
                  .run()
              }
            >
              插入表格
            </Button>
          </RibbonGroup>
          <RibbonGroup label="图片">
            <input
              type="file"
              accept="image/png,image/jpeg"
              aria-label="选择 Word 图片"
              ref={imageInputRef}
              className="zuvi-studio-word-file-input"
              tabIndex={-1}
              disabled={toolsDisabled || imageBusy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) void insertImage(file);
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              className="zuvi-studio-word-large-tool"
              disabled={toolsDisabled || imageBusy}
              onMouseDown={keepSelection}
              onClick={() => imageInputRef.current?.click()}
            >
              <ImageIcon size={24} />
              {imageBusy ? '正在读取…' : '插入图片'}
            </Button>
            {selection?.image && (
              <>
                <Input
                  type="number"
                  min={1}
                  max={2000}
                  size="sm"
                  aria-label="图片宽度"
                  value={String(selection.image.width)}
                  disabled={toolsDisabled}
                  className="zuvi-studio-word-image-size"
                  onChange={(event) => resizeImage('width', event.target.value)}
                />
                <span>×</span>
                <Input
                  type="number"
                  min={1}
                  max={2000}
                  size="sm"
                  aria-label="图片高度"
                  value={String(selection.image.height)}
                  disabled={toolsDisabled}
                  className="zuvi-studio-word-image-size"
                  onChange={(event) => resizeImage('height', event.target.value)}
                />
                <Checkbox
                  label="保持比例"
                  checked={lockImageRatio}
                  disabled={toolsDisabled}
                  onChange={(value) => {
                    imageRatioRef.current = null;
                    setLockImageRatio(value);
                  }}
                />
                <Input
                  size="sm"
                  aria-label="图片说明"
                  value={String(selection.image.alt || '')}
                  disabled={toolsDisabled}
                  maxLength={1000}
                  onChange={(event) => updateImage({ alt: event.target.value })}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={toolsDisabled}
                  onMouseDown={keepSelection}
                  onClick={() => editor?.chain().focus().deleteSelection().run()}
                >
                  删除图片
                </Button>
                <StudioWordImageLayoutTools
                  key={`${document.id}:${region}:${selection.from}`}
                  layout={selection.image.layout}
                  disabled={toolsDisabled}
                  onChange={(layout) => updateImage({ layout })}
                />
              </>
            )}
          </RibbonGroup>
          <RibbonGroup label="链接">
            <Button
              iconStart={<Link size={15} />}
              variant="ghost"
              size="sm"
              disabled={toolsDisabled}
              onMouseDown={keepSelection}
              onClick={() => {
                setLinkHref(editor?.getAttributes('link').href || '');
                setLinkError('');
                setLinkOpen(true);
              }}
            >
              链接
            </Button>
          </RibbonGroup>
          <RibbonGroup label="页眉页脚" className="zuvi-studio-word-header-group">
            <Button
              variant="ghost"
              size="sm"
              disabled={toolsDisabled}
              onClick={() => openRegion('header')}
            >
              编辑页眉
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={toolsDisabled}
              onClick={() => openRegion('footer')}
            >
              编辑页脚
            </Button>
            <Checkbox
              label="显示页码"
              checked={document.pageNumbers || hasPageNumber(document.footer)}
              disabled={toolsDisabled}
              onChange={togglePageNumbers}
            />
            <Button
              variant="ghost"
              size="sm"
              disabled={toolsDisabled}
              onMouseDown={keepSelection}
              onClick={() =>
                editor
                  ?.chain()
                  .focus()
                  .insertContent({ type: 'pageNumber', attrs: { kind: 'current' } })
                  .run()
              }
            >
              插入页码
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={toolsDisabled}
              onMouseDown={keepSelection}
              onClick={() =>
                editor
                  ?.chain()
                  .focus()
                  .insertContent({ type: 'pageNumber', attrs: { kind: 'total' } })
                  .run()
              }
            >
              插入总页数
            </Button>
            {region !== 'content' && (
              <Button
                variant="ghost"
                size="sm"
                disabled={!bodyEditor}
                onClick={() => {
                  setRegion('content');
                  bodyEditor?.commands.focus();
                }}
              >
                返回正文
              </Button>
            )}
          </RibbonGroup>
          <RibbonGroup label="文本">
            <Button
              variant="ghost"
              size="sm"
              disabled={toolsDisabled}
              onMouseDown={keepSelection}
              onClick={() => editor?.chain().focus().setHorizontalRule().run()}
            >
              分隔线
            </Button>
          </RibbonGroup>
          <RibbonGroup label="表格工具" className="zuvi-studio-word-table-tools-group">
            <Button variant="ghost" size="sm" disabled={toolsDisabled || !selection?.inTable} onMouseDown={keepSelection} onClick={() => {
              if (!editor || toolsDisabled || editor.view.composing) return;
              const node = editor.state.doc.nodeAt(editor.state.selection.from);
              setFormulaDialog({ editor, doc: editor.state.doc, selection: editor.state.selection, initial: node?.type.name === 'tableFormula' ? node.attrs.formula : '=SUM(ABOVE)' });
            }}>表格公式</Button>
            <Button variant="ghost" size="sm" disabled={toolsDisabled || !editor} onMouseDown={keepSelection} onClick={() => {
              if (!editor || toolsDisabled) return;
              try { wordRefreshTableFormulas(editor); } catch (reason) { setNotice(reason instanceof Error ? reason.message : '公式刷新失败。'); }
            }}>刷新公式</Button>
            <Button variant="ghost" size="sm" disabled={toolsDisabled || !editor || !wordConversionTarget(editor)} onMouseDown={keepSelection} onClick={() => {
              if (!editor || toolsDisabled || editor.view.composing) return;
              const target = wordConversionTarget(editor);
              if (target) setConversionDialog({ editor, target });
            }}>{editor?.isActive('table') ? '表格转文本' : '文本转表格'}</Button>
            <Button variant="ghost" size="sm" disabled={toolsDisabled || !selection?.inTable} onMouseDown={keepSelection} onClick={() => {
              if (!editor || toolsDisabled) return;
              const rows = wordSelectedRows(editor);
              if (rows.length) setRowDialog({ editor, doc: editor.state.doc, selection: editor.state.selection, rows });
            }}>表格行属性</Button>
            <Button variant="ghost" size="sm" disabled={toolsDisabled || !selection?.inTable}
              onMouseDown={keepSelection} onClick={() => {
                if (!editor || toolsDisabled) return;
                const changed = wordDistributeColumns(editor);
                setNotice(changed ? '已平均分布表格列，可撤销恢复。' : '列宽保持原样或无法测量。');
              }}>平均分布表格列</Button>
            <Button variant="ghost" size="sm"
              disabled={toolsDisabled || !editor || wordSelectedRows(editor).length < 2}
              onMouseDown={keepSelection}
              onClick={() => {
                if (!editor || toolsDisabled) return;
                const changed = wordDistributeRows(editor);
                setNotice(changed ? '已平均分布所选行，可撤销恢复。' : '行高度保持原样或无法测量。');
              }}>平均分布行</Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={toolsDisabled || !selection?.inTable}
              onMouseDown={keepSelection}
              onClick={() => editor?.chain().focus().addRowAfter().run()}
            >
              增加行
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={toolsDisabled || !selection?.inTable}
              onMouseDown={keepSelection}
              onClick={() => editor?.chain().focus().addColumnAfter().run()}
            >
              增加列
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={toolsDisabled || !selection?.inTable}
              onMouseDown={keepSelection}
              onClick={() => editor?.chain().focus().deleteRow().run()}
            >
              删除行
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={toolsDisabled || !selection?.inTable}
              onMouseDown={keepSelection}
              onClick={() => editor?.chain().focus().deleteColumn().run()}
            >
              删除列
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={toolsDisabled || !selection?.canMerge}
              onMouseDown={keepSelection}
              onClick={() => editor?.chain().focus().mergeCells().run()}
            >
              合并单元格
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={toolsDisabled || !selection?.canSplit}
              onMouseDown={keepSelection}
              onClick={() => editor?.chain().focus().splitCell().run()}
            >
              拆分单元格
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={toolsDisabled || !selection?.inTable}
              onMouseDown={keepSelection}
              onClick={() => editor?.chain().focus().toggleHeaderRow().run()}
            >
              切换标题行
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={toolsDisabled || !selection?.inTable}
              onMouseDown={keepSelection}
              onClick={() => editor?.chain().focus().deleteTable().run()}
            >
              删除表格
            </Button>
          </RibbonGroup>
        </Tabs.Panel>
        <Tabs.Panel value="layout" className="zuvi-studio-word-tool-row">
          <RibbonGroup label="页面设置" className="zuvi-studio-word-page-group">
            <Select
              aria-label="纸张尺寸"
              size="sm"
              disabled={toolsDisabled}
              value={document.page.size}
              options={[
                { value: 'A4', label: 'A4 · 210 × 297 mm' },
                { value: 'Letter', label: 'Letter · 216 × 279 mm' },
              ]}
              onChange={(value) => updatePage({ size: value as 'A4' | 'Letter' })}
            />
            <Select
              aria-label="纸张方向"
              size="sm"
              disabled={toolsDisabled}
              value={document.page.orientation}
              options={[
                { value: 'portrait', label: '纵向' },
                { value: 'landscape', label: '横向' },
              ]}
              onChange={(value) => updatePage({ orientation: value as 'portrait' | 'landscape' })}
            />
            <Select
              aria-label="页边距"
              size="sm"
              disabled={toolsDisabled}
              value={String(document.page.margin)}
              options={[
                10,
                15,
                20,
                25,
                30,
                40,
                50,
                ...(![10, 15, 20, 25, 30, 40, 50].includes(document.page.margin)
                  ? [document.page.margin]
                  : []),
              ].map((value) => ({ value: String(value), label: `${value} mm` }))}
              onChange={(value) => updatePage({ margin: Number(value) })}
            />
          </RibbonGroup>
          <RibbonGroup label="段落" className="zuvi-studio-word-layout-group">
            <Button
              variant="ghost"
              size="sm"
              disabled={toolsDisabled || (selection?.indent || 0) <= 0}
              onMouseDown={keepSelection}
              onClick={() => adjustIndent(-18)}
            >
              减少缩进
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={toolsDisabled}
              onMouseDown={keepSelection}
              onClick={() => adjustIndent(18)}
            >
              增加缩进
            </Button>
            <Select
              aria-label="段落行距"
              size="sm"
              disabled={toolsDisabled}
              value={
                selection?.lineHeightRule === 'auto' ? selection?.lineHeight || '1.75' : 'current'
              }
              options={lineOptions}
              onChange={(value) => {
                if (editor && value !== 'current')
                  wordSetParagraphFormat(editor, {
                    lineHeight: Number(value),
                    lineHeightRule: 'auto',
                  });
              }}
            />
            <Button
              size="sm"
              variant="ghost"
              disabled={toolsDisabled}
              onMouseDown={keepSelection}
              onClick={openParagraphSettings}
            >
              段落设置
            </Button>
          </RibbonGroup>
          <RibbonGroup label="页眉页脚" className="zuvi-studio-word-distance-group">
            <label className="zuvi-studio-word-distance-label">
              页眉
              <Input
                type="number"
                min={0}
                max={80}
                step={0.5}
                size="sm"
                aria-label="页眉距顶端（mm）"
                disabled={toolsDisabled}
                value={String(document.page.headerDistance ?? 12.5)}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  if (event.target.value && Number.isFinite(value) && value >= 0 && value <= 80)
                    updatePage({ headerDistance: value });
                }}
              />
            </label>
            <label className="zuvi-studio-word-distance-label">
              页脚
              <Input
                type="number"
                min={0}
                max={80}
                step={0.5}
                size="sm"
                aria-label="页脚距底端（mm）"
                disabled={toolsDisabled}
                value={String(document.page.footerDistance ?? 12.5)}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  if (event.target.value && Number.isFinite(value) && value >= 0 && value <= 80)
                    updatePage({ footerDistance: value });
                }}
              />
            </label>
          </RibbonGroup>
        </Tabs.Panel>
        <Tabs.Panel value="references" className="zuvi-studio-word-tool-row">
          <RibbonGroup label="目录">
            <Button
              variant="ghost"
              size="sm"
              className="zuvi-studio-word-large-tool"
              iconStart={<Book size={24} />}
              disabled={!bodyEditor}
              title="按文档标题导航"
              onClick={() => setSidePanel('outline')}
            >
              文档大纲
            </Button>
          </RibbonGroup>
          <RibbonGroup label="标题级别">
            <Select
              aria-label="引用标题样式"
              size="sm"
              options={STYLE_OPTIONS}
              value={selection?.style || 'paragraph'}
              disabled={toolsDisabled}
              onChange={applyParagraphStyle}
            />
          </RibbonGroup>
          <RibbonGroup label="链接">
            <Button
              iconStart={<Link size={24} />}
              className="zuvi-studio-word-large-tool"
              variant="ghost"
              size="sm"
              disabled={toolsDisabled}
              onMouseDown={keepSelection}
              onClick={() => {
                setLinkHref(editor?.getAttributes('link').href || '');
                setLinkError('');
                setLinkOpen(true);
              }}
            >
              链接
            </Button>
          </RibbonGroup>
        </Tabs.Panel>
        <Tabs.Panel value="review" className="zuvi-studio-word-tool-row">
          <RibbonGroup label="校对">
            <Button
              iconStart={<FileText size={24} />}
              className="zuvi-studio-word-large-tool"
              variant="ghost"
              size="sm"
              disabled={!bodyEditor}
              onClick={() => setStatisticsOpen(true)}
            >
              字数统计
            </Button>
          </RibbonGroup>
          <RibbonGroup label="查找">
            <Button
              iconStart={<Search size={24} />}
              className="zuvi-studio-word-large-tool"
              variant="ghost"
              size="sm"
              disabled={!editor}
              onClick={() => setSidePanel('search')}
            >
              查找与替换
            </Button>
          </RibbonGroup>
        </Tabs.Panel>
        <Tabs.Panel value="view" className="zuvi-studio-word-tool-row">
          <RibbonGroup label="显示" className="zuvi-studio-word-view-group">
            <Checkbox label="标尺" checked={showRuler} onChange={setShowRuler} />
            <Checkbox label="分页布局" checked={paginatedView} disabled={disabled} onChange={setPaginatedView}/>
            <Checkbox
              label="非打印字符"
              checked={showNonprinting}
              onChange={setShowNonprinting}
              disabled={disabled}
            />
            <Checkbox
              label="导航窗格"
              checked={!!sidePanel}
              onChange={(value) => setSidePanel(value ? 'outline' : null)}
            />
          </RibbonGroup>
          <RibbonGroup label="缩放">
            <Button
              variant="ghost"
              size="sm"
              className="zuvi-studio-word-large-tool"
              onClick={() => setZoom('1')}
              aria-pressed={zoom === '1'}
            >
              <span className="zuvi-studio-word-zoom-sample">100%</span>
              <span>实际大小</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="zuvi-studio-word-large-tool"
              onClick={() => setZoom('fit')}
              aria-pressed={zoom === 'fit'}
            >
              <FileText size={24} />
              <span>适应宽度</span>
            </Button>
          </RibbonGroup>
        </Tabs.Panel>
        {region !== 'content' && (
          <Tabs.Panel value="header-footer" className="zuvi-studio-word-tool-row">
            <RibbonGroup label="导航" className="zuvi-studio-word-header-group">
              <Button
                variant="ghost"
                size="sm"
                aria-pressed={region === 'header'}
                disabled={!editable}
                onClick={() => openRegion('header')}
              >
                转到页眉
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-pressed={region === 'footer'}
                disabled={!editable}
                onClick={() => openRegion('footer')}
              >
                转到页脚
              </Button>
            </RibbonGroup>
            <RibbonGroup label="插入">
              <Button
                variant="ghost"
                size="sm"
                disabled={toolsDisabled}
                onMouseDown={keepSelection}
                onClick={() =>
                  editor
                    ?.chain()
                    .focus()
                    .insertContent({ type: 'pageNumber', attrs: { kind: 'current' } })
                    .run()
                }
              >
                插入页码
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={toolsDisabled}
                onMouseDown={keepSelection}
                onClick={() =>
                  editor
                    ?.chain()
                    .focus()
                    .insertContent({ type: 'pageNumber', attrs: { kind: 'total' } })
                    .run()
                }
              >
                插入总页数
              </Button>
            </RibbonGroup>
            <RibbonGroup label="位置" className="zuvi-studio-word-distance-group">
              <label className="zuvi-studio-word-distance-label">
                页眉距顶端
                <Input
                  type="number"
                  min={0}
                  max={80}
                  step={0.5}
                  size="sm"
                  aria-label="页眉距顶端（mm）"
                  disabled={!editable}
                  value={String(headerDistance)}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (event.target.value && Number.isFinite(value) && value >= 0 && value <= 80)
                      updatePage({ headerDistance: value });
                  }}
                />
              </label>
              <label className="zuvi-studio-word-distance-label">
                页脚距底端
                <Input
                  type="number"
                  min={0}
                  max={80}
                  step={0.5}
                  size="sm"
                  aria-label="页脚距底端（mm）"
                  disabled={!editable}
                  value={String(footerDistance)}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (event.target.value && Number.isFinite(value) && value >= 0 && value <= 80)
                      updatePage({ footerDistance: value });
                  }}
                />
              </label>
            </RibbonGroup>
            <RibbonGroup label="关闭">
              <Button
                variant="ghost"
                size="sm"
                className="zuvi-studio-word-large-tool"
                iconStart={<Close size={22} />}
                onClick={closeRegion}
              >
                关闭页眉和页脚
              </Button>
            </RibbonGroup>
          </Tabs.Panel>
        )}
      </Tabs>
      <div className="zuvi-studio-word-workspace" data-part="word-workspace">
        <div className="zuvi-studio-word-navigation-rail" role="toolbar" aria-label="Word 文档工具">
          <Button
            variant="ghost"
            size="sm"
            aria-label="打开查找与替换"
            title="查找与替换"
            aria-pressed={sidePanel === 'search'}
            disabled={!editor}
            onClick={() => setSidePanel(sidePanel === 'search' ? null : 'search')}
          >
            <Search size={18} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="打开文档大纲"
            title="文档大纲"
            aria-pressed={sidePanel === 'outline'}
            disabled={!bodyEditor}
            onClick={() => setSidePanel(sidePanel === 'outline' ? null : 'outline')}
          >
            <Book size={18} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="打开字数统计"
            title="字数统计"
            disabled={!bodyEditor}
            onClick={() => setStatisticsOpen(true)}
          >
            <FileText size={18} />
          </Button>
        </div>
        {sidePanel && (
          <aside
            className="zuvi-studio-word-sidebar"
            data-part="word-navigation"
            aria-label={sidePanel === 'search' ? 'Word 查找与替换' : 'Word 文档大纲'}
          >
            <div className="zuvi-studio-word-sidebar-heading">
              <strong>{sidePanel === 'search' ? '查找与替换' : '文档大纲'}</strong>
              <Button
                size="sm"
                variant="ghost"
                aria-label="关闭文档导航"
                onClick={() => setSidePanel(null)}
              >
                ×
              </Button>
            </div>
            {sidePanel === 'search' ? (
              <>
                <span className="zuvi-studio-word-sidebar-note">
                  {region === 'content' ? '正文' : region === 'header' ? '页眉' : '页脚'}中查找
                </span>
                <Input
                  aria-label="查找内容"
                  ref={searchInputRef}
                  size="sm"
                  value={searchQuery}
                  maxLength={5000}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      stepMatch(event.shiftKey ? -1 : 1);
                    }
                  }}
                />
                <Checkbox label="区分大小写" checked={matchCase} onChange={setMatchCase} />
                <div
                  className="zuvi-studio-word-format-filter"
                  role="group"
                  aria-label="按格式查找"
                >
                  <span className="zuvi-studio-word-sidebar-note">按格式筛选：</span>
                  {(
                    [
                      ['bold', '粗体'],
                      ['italic', '斜体'],
                      ['underline', '下划线'],
                      ['strike', '删除线'],
                    ] as const
                  ).map(([key, label]) => (
                    <Checkbox
                      key={key}
                      label={label}
                      checked={formatCriteria[key] === true}
                      onChange={(checked) =>
                        setFormatCriteria((previous) => ({ ...previous, [key]: checked }))
                      }
                    />
                  ))}
                </div>
                <div className="zuvi-studio-word-search-actions">
                  <span role="status">
                    {(selection?.matches.length || 0) > WORD_SEARCH_LIMIT
                      ? `超过 ${WORD_SEARCH_LIMIT} 处匹配`
                      : `${selection?.matches.length || 0} 处匹配`}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!selection?.matches.length}
                    onClick={() => stepMatch(-1)}
                  >
                    上一处
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!selection?.matches.length}
                    onClick={() => stepMatch(1)}
                  >
                    下一处
                  </Button>
                </div>
                <Input
                  aria-label="替换为"
                  size="sm"
                  value={replacement}
                  maxLength={10000}
                  disabled={!editable}
                  onChange={(event) => setReplacement(event.target.value)}
                />
                <div className="zuvi-studio-word-search-actions">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={toolsDisabled || !selection?.matches.length}
                    onClick={() => {
                      const matches = selection?.matches || [];
                      if (editor && matches.length) {
                        try {
                          if (
                            wordReplaceMatches(
                              editor,
                              [matches[Math.max(0, Math.min(matchIndex, matches.length - 1))]],
                              replacement
                            )
                          )
                            setNotice('已替换一处匹配。');
                        } catch (error) {
                          setNotice(error instanceof Error ? error.message : '替换失败。');
                        }
                      }
                    }}
                  >
                    替换
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={
                      toolsDisabled ||
                      !selection?.matches.length ||
                      selection.matches.length > WORD_SEARCH_LIMIT
                    }
                    onClick={() => {
                      if (editor && selection?.matches.length) {
                        const count = selection.matches.length;
                        try {
                          if (wordReplaceMatches(editor, selection.matches, replacement)) {
                            setMatchIndex(-1);
                            setNotice(`已替换 ${count} 处匹配。`);
                          }
                        } catch (error) {
                          setNotice(error instanceof Error ? error.message : '替换失败。');
                        }
                      }
                    }}
                  >
                    全部替换
                  </Button>
                </div>
                {(selection?.matches.length || 0) > WORD_SEARCH_LIMIT && (
                  <p className="zuvi-studio-word-sidebar-note">
                    匹配超过上限，请缩小查找范围后再全部替换。
                  </p>
                )}
                <div className="zuvi-studio-word-navigation-list">
                  {(selection?.matches || []).slice(0, 200).map((match, index) => (
                    <Button
                      key={`${match.from}-${match.to}`}
                      variant="ghost"
                      size="sm"
                      aria-label={`跳转匹配 ${index + 1}`}
                      aria-pressed={index === matchIndex}
                      onClick={() => navigateMatch(index)}
                    >
                      {index + 1}. {match.text}
                    </Button>
                  ))}
                </div>
              </>
            ) : (
              <div className="zuvi-studio-word-navigation-list">
                {!outline.length && (
                  <p className="zuvi-studio-word-sidebar-note">
                    应用标题样式后，可在这里快速跳转。
                  </p>
                )}
                {outline.map((heading, index) => (
                  <Button
                    key={`${heading.position}-${index}`}
                    size="sm"
                    variant="ghost"
                    style={{ paddingInlineStart: 8 + (heading.level - 1) * 12 }}
                    onClick={() => {
                      setRegion('content');
                      bodyEditor
                        ?.chain()
                        .focus()
                        .setTextSelection(heading.position)
                        .scrollIntoView()
                        .run();
                    }}
                  >
                    {heading.text || '未命名标题'}
                  </Button>
                ))}
              </div>
            )}
          </aside>
        )}
        <div className="zuvi-studio-word-stage" data-part="word-stage" ref={stageRef}>
          {showRuler && (
            <WordRuler
              length={pageWidth}
              margin={margin}
              scale={scale}
              editor={editor}
              blocked={toolsDisabled}
              onNotice={setNotice}
            />
          )}
          <div
            className="zuvi-studio-word-paper-space"
            style={{
              width: pageWidth * scale,
              minHeight: Math.max(pageHeight, paperHeight) * scale,
            }}
          >
            {showRuler && <WordRuler length={pageHeight} margin={margin} scale={scale} vertical />}
            <article
              ref={paperRef}
              className="zuvi-studio-word-paper"
              data-part="word-paper"
              aria-label="文档纸张"
              style={
                {
                  width: pageWidth,
                  minHeight: pageHeight,
                  paddingInline: margin,
                  transform: `scale(${scale})`,
                  '--zuvi-studio-word-page-margin': `${margin}px`,
                  '--zuvi-studio-word-page-height': `${pageHeight}px`,
                  '--zuvi-studio-word-header-distance': `${headerDistance * MM_TO_PX}px`,
                  '--zuvi-studio-word-footer-distance': `${footerDistance * MM_TO_PX}px`,
                } as React.CSSProperties
              }
              data-editing-region={region !== 'content' ? region : undefined}
              onDoubleClick={(event) => {
                if (!editable) return;
                const target = event.target instanceof Element ? event.target : null;
                const requested = target?.closest<HTMLElement>('[data-region]')?.dataset.region;
                if (requested === 'header' || requested === 'footer') {
                  openRegion(requested);
                  return;
                }
                if (region !== 'content') {
                  closeRegion();
                  return;
                }
                const box = event.currentTarget.getBoundingClientRect();
                const localY = (event.clientY - box.top) / Math.max(0.01, scale);
                if (localY <= margin) openRegion('header');
                else if (localY >= event.currentTarget.offsetHeight - margin) openRegion('footer');
              }}
            >
              <section
                className="zuvi-studio-word-region"
                data-region="header"
                data-active={region === 'header' || undefined}
                data-empty={!document.header || undefined}
                aria-label="页眉区域"
              >
                <span className="zuvi-studio-word-region-label">页眉</span>
                {document.header && (
                  <RegionEditor
                    region="header"
                    documentId={document.id}
                    content={document.header}
                    paragraphStyles={paragraphStyles}
                    numberingCatalog={numberCatalog}
                    defaultTabStop={document.defaultTabStop}
                    decimalSymbol={document.decimalSymbol}
                    editable={editable && region === 'header'}
                    onReady={registerRegion}
                    onActive={setRegion}
                    onImagePaste={(file, target) => {
                      void insertImage(file, target);
                    }}
                    onChange={(content) => updateRegion('header', content)}
                  />
                )}
              </section>
              <EditorContent
                editor={bodyEditor}
                className="zuvi-studio-word-content zuvi-studio-word-body"
              />
              <section
                className="zuvi-studio-word-region"
                data-region="footer"
                data-active={region === 'footer' || undefined}
                data-empty={!document.footer || undefined}
                aria-label="页脚区域"
              >
                <span className="zuvi-studio-word-region-label">页脚</span>
                {document.footer && (
                  <RegionEditor
                    region="footer"
                    documentId={document.id}
                    content={document.footer}
                    paragraphStyles={paragraphStyles}
                    numberingCatalog={numberCatalog}
                    defaultTabStop={document.defaultTabStop}
                    decimalSymbol={document.decimalSymbol}
                    editable={editable && region === 'footer'}
                    onReady={registerRegion}
                    onActive={setRegion}
                    onImagePaste={(file, target) => {
                      void insertImage(file, target);
                    }}
                    onChange={(content) => updateRegion('footer', content)}
                  />
                )}
              </section>
            </article>
          </div>
        </div>
      </div>
      <div className="zuvi-studio-word-status" data-part="word-status">
        <span>
          {bodySummary?.nonWhitespaceCharacters || 0} 字 · {document.page.size} ·{' '}
          {landscape ? '横向' : '纵向'}
          {!editable ? ' · 只读' : ''}
          {region !== 'content' ? ` · 正在${region === 'header' ? '编辑页眉' : '编辑页脚'}` : ''}
        </span>
        {notice && (
          <span role="status" className="zuvi-studio-word-notice">
            {notice}
          </span>
        )}
        <div className="zuvi-studio-word-zoom">
          <span>缩放</span>
          <Select
            aria-label="Word 缩放"
            size="sm"
            value={zoom}
            options={[
              { value: 'fit', label: '适应宽度' },
              ...[0.5, 0.75, 1, 1.25, 1.5].map((value) => ({
                value: String(value),
                label: `${Math.round(value * 100)}%`,
              })),
            ]}
            onChange={setZoom}
          />
        </div>
      </div>
      {surfaceDialog&&<StudioWordSurfaceDialog surfaces={surfaceDialog.surfaces} blocked={!editable}
        onClose={()=>{setSurfaceDialog(null);if(!surfaceDialog.editor.isDestroyed)surfaceDialog.editor.commands.focus();}}
        onSave={(patch)=>{
          const target=surfaceDialog.editor;
          if(!latest.current.editable||target.isDestroyed||target!==editor||target.state.doc!==surfaceDialog.doc)throw new Error('文档或编辑区域已变化，请重新打开段落边框。');
          target.view.dispatch(target.state.tr.setSelection(surfaceDialog.selection).setMeta('addToHistory',false));
          const changed=wordSetParagraphSurface(target,patch);setNotice(changed?'已应用段落边框和底纹，可撤销恢复。':'段落边框/底纹保持原样。');
        }} />}
      {formulaDialog && <StudioWordFormulaDialog initial={formulaDialog.initial} blocked={!editable} onClose={() => { setFormulaDialog(null); if (!formulaDialog.editor.isDestroyed) formulaDialog.editor.commands.focus(); }} onSave={(formula) => {
        const target = formulaDialog.editor;
        if (!latest.current.editable || target.isDestroyed || target !== editor || !target.isEditable) throw new Error('当前文档只读或编辑区域已变化。');
        if (target.state.doc !== formulaDialog.doc) throw new Error('文档已变化，请重新打开公式。');
        target.view.dispatch(target.state.tr.setSelection(formulaDialog.selection).setMeta('addToHistory', false));
        if (!wordSetTableFormula(target, formula)) throw new Error('请结束输入法组合后重试。');
        setFormulaDialog(null); target.commands.focus();
      }} />}
      {conversionDialog && <StudioWordConversionDialog target={conversionDialog.target} blocked={!editable}
        onClose={() => { setConversionDialog(null); if (!conversionDialog.editor.isDestroyed) conversionDialog.editor.commands.focus(); }}
        onSave={(separator, columns, convertNested) => {
          const target = conversionDialog.editor;
          if (!latest.current.editable || target !== editor || target.isDestroyed) throw new Error('编辑区域或权限已变化，请重新打开转换。');
          if (target.view.composing) throw new Error('请结束输入法组合后重试转换。');
          if (target.state.doc !== conversionDialog.target.doc) throw new Error('文档已变化，请重新打开转换。');
          target.view.dispatch(target.state.tr.setSelection(conversionDialog.target.selection).setMeta('addToHistory', false));
          if (!wordApplyTableConversion(target, conversionDialog.target, separator, columns, convertNested)) throw new Error('请结束输入法组合后重试转换。');
          setConversionDialog(null);
          target.commands.focus();
          setNotice('已转换内容，可撤销恢复。');
        }} />}
      {rowDialog && <StudioWordRowDialog rows={rowDialog.rows.map((row) => row.properties)} blocked={!editable}
        onClose={() => { setRowDialog(null); if (!rowDialog.editor.isDestroyed) rowDialog.editor.commands.focus(); }}
        onSave={(patch) => {
          const target = rowDialog.editor;
          if (!latest.current.editable || target.isDestroyed || target !== editor || target.state.doc !== rowDialog.doc || target.view.composing) throw new Error('文档或编辑区域已变化，请重新打开表格行属性。');
          target.view.dispatch(target.state.tr.setSelection(rowDialog.selection).setMeta('addToHistory', false));
          const changed = wordSetRowProperties(target, patch);
          setNotice(changed ? '已应用表格行属性，可撤销恢复。' : '表格行属性保持原样。');
        }} />}
      {numberDialog&&<StudioWordNumberingDialog catalog={numberDialog.catalog} currentId={numberDialog.currentId} currentLevel={numberDialog.level} styles={paragraphStyles} blocked={!editable}
        onClose={()=>{setNumberDialog(null);if(!numberDialog.editor.isDestroyed)numberDialog.editor.commands.focus();}}
        onSave={(value)=>{
          const target=numberDialog.editor;
          if(!latest.current.editable||target.isDestroyed||target!==editor||target.state.doc!==numberDialog.doc)throw new Error('文档或编辑区域已变化，请重新打开编号定义。');
          target.view.dispatch(target.state.tr.setSelection(numberDialog.selection).setMeta('addToHistory',false));
          const changed=value.apply?wordApplyNumbering(target,value.definitionId,value.level,value.catalog):wordSetNumberingCatalog(target,value.catalog);
          setNotice(changed?'已保存编号定义，可撤销恢复。':'编号定义保持原样。');
        }} />}
      {tabsDialog && (
        <StudioWordTabsDialog values={tabsDialog.values} defaultTabStop={document.defaultTabStop} blocked={!editable}
          onClose={() => { setTabsDialog(null); if (!tabsDialog.editor.isDestroyed) tabsDialog.editor.commands.focus(); }}
          onSave={(patch) => {
            const target = tabsDialog.editor;
            if (!latest.current.editable || target.isDestroyed || target !== editor || target.state.doc !== tabsDialog.doc)
              throw new Error('文档或编辑区域已变化，请重新选择段落。');
            target.view.dispatch(target.state.tr.setSelection(tabsDialog.selection).setMeta('addToHistory', false));
            const changed = wordSetTabStops(target, patch);
            setNotice(changed ? '已应用制表位，可撤销恢复。' : '制表位保持原样。');
          }} />
      )}
      {paragraphDialog && (
        <StudioWordParagraphDialog
          values={paragraphDialog.values}
          blocked={!editable}
          onClose={() => {
            setParagraphDialog(null);
            if (!paragraphDialog.editor.isDestroyed) paragraphDialog.editor.commands.focus();
          }}
          onSave={(patch) => {
            const target = paragraphDialog.editor;
            if (
              !latest.current.editable ||
              target.isDestroyed ||
              target !== editor ||
              target.state.doc !== paragraphDialog.doc
            )
              throw new Error('文档或编辑区域已变化，请重新选择段落。');
            target.view.dispatch(
              target.state.tr.setSelection(paragraphDialog.selection).setMeta('addToHistory', false)
            );
            const changed = wordSetParagraphFormat(target, patch);
            setNotice(changed ? '已应用段落设置，可撤销恢复。' : '段落格式保持原样。');
          }}
        />
      )}
      {characterDialog && (
        <StudioWordCharacterDialog
          values={characterDialog.values}
          text={characterDialog.text}
          blocked={!editable}
          onClose={() => {
            setCharacterDialog(null);
            if (!characterDialog.editor.isDestroyed) characterDialog.editor.commands.focus();
          }}
          onSave={(values) => {
            const target = characterDialog.editor;
            if (
              !latest.current.editable ||
              target.isDestroyed ||
              target !== editor ||
              target.state.doc !== characterDialog.doc
            )
              throw new Error('文档或编辑区域已变化，请重新选择文字。');
            target.view.dispatch(
              target.state.tr.setSelection(characterDialog.selection).setMeta('addToHistory', false)
            );
            const changed = wordSetCharacterLayout(target, values);
            setNotice(changed ? '已应用字符间距与位置，可撤销恢复。' : '字符格式保持原样。');
          }}
        />
      )}
      {styleDialog && editable && (
        <StudioWordStyleDialog
          key={styleDialog.id}
          value={styleDialog}
          styles={paragraphStyles}
          onClose={() => setStyleDialog(null)}
          onChange={(styles, message) => {
            if (!bodyEditor || !editable || !wordSetParagraphStyles(bodyEditor, styles))
              throw new Error('当前编辑器无法修改样式。');
            setStyleDialog(null);
            setRegion('content');
            setNotice(message);
          }}
        />
      )}
      <Modal open={statisticsOpen} onOpenChange={setStatisticsOpen}>
        <Modal.Content size="sm">
          <Modal.Header>
            <Modal.Title>字数统计</Modal.Title>
            <Modal.Close />
          </Modal.Header>
          <Modal.Body>
            <dl className="zuvi-studio-word-statistics">
              <div>
                <dt>字符数（含空白）</dt>
                <dd>{bodySummary?.characters || 0}</dd>
              </div>
              <div>
                <dt>字符数（不含空白）</dt>
                <dd>{bodySummary?.nonWhitespaceCharacters || 0}</dd>
              </div>
              <div>
                <dt>段落数</dt>
                <dd>{bodySummary?.paragraphs || 0}</dd>
              </div>
            </dl>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={() => setStatisticsOpen(false)}>
              关闭
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
      <Modal open={linkOpen && editable} onOpenChange={setLinkOpen}>
        <Modal.Content size="sm">
          <Modal.Header>
            <Modal.Title>编辑链接</Modal.Title>
            <Modal.Close />
          </Modal.Header>
          <Modal.Body>
            <label className="zuvi-studio-word-link-label">
              链接地址
              <Input
                aria-label="链接地址"
                value={linkHref}
                onChange={(event) => {
                  setLinkHref(event.target.value);
                  setLinkError('');
                }}
                placeholder="https://example.com"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') applyLink();
                }}
              />
            </label>
            <p className="zuvi-studio-word-link-note">选择正文后添加链接；留空会移除当前链接。</p>
            {linkError ? (
              <p role="alert" className="zuvi-studio-word-link-error">
                {linkError}
              </p>
            ) : null}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" onClick={() => setLinkOpen(false)}>
              取消
            </Button>
            <Button onClick={applyLink}>应用链接</Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </div>
  );
}

export default StudioWord;
