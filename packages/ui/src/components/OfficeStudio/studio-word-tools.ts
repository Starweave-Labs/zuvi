import { Mark, Node, type Editor } from '@tiptap/react';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGE_SOURCE = Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 40;
export const WORD_SEARCH_LIMIT = 10000;
const MAX_REPLACEMENT_DOCUMENT = 2000000;

export function safeWordImageSource(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length <= MAX_IMAGE_SOURCE &&
    /^data:image\/(png|jpeg);base64,[a-z\d+/]+={0,2}$/i.test(value)
  );
}

/** Only embedded raster images are rendered; pasted remote image URLs are never fetched. */
export const WordImage = Node.create({
  name: 'image',
  group: 'inline',
  inline: true,
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
      width: { default: 320 },
      height: { default: 180 },
      alt: { default: '' },
    };
  },
  parseHTML: () => [
    {
      tag: 'img[src]',
      getAttrs: (element) => {
        if (!(element instanceof HTMLElement) || !safeWordImageSource(element.getAttribute('src')))
          return false;
        const width = Number(element.getAttribute('width') || 320);
        const height = Number(element.getAttribute('height') || 180);
        return {
          src: element.getAttribute('src'),
          width: Math.max(1, Math.min(2000, Number.isFinite(width) ? width : 320)),
          height: Math.max(1, Math.min(2000, Number.isFinite(height) ? height : 180)),
          alt: (element.getAttribute('alt') || '').slice(0, 1000),
        };
      },
    },
  ],
  renderHTML: ({ node }) => [
    'img',
    {
      src: safeWordImageSource(node.attrs.src) ? node.attrs.src : '',
      width: Math.max(1, Math.min(2000, Number(node.attrs.width) || 320)),
      height: Math.max(1, Math.min(2000, Number(node.attrs.height) || 180)),
      style: `aspect-ratio: ${Math.max(1, Math.min(2000, Number(node.attrs.width) || 320))} / ${Math.max(1, Math.min(2000, Number(node.attrs.height) || 180))}`,
      alt: String(node.attrs.alt || '').slice(0, 1000),
      class: 'zuvi-studio-word-image',
      'data-word-image': '',
    },
  ],
  addNodeView() {
    return ({ node, editor, getPos }) => {
      const dom = document.createElement('span');
      const image = document.createElement('img');
      const handle = document.createElement('span');
      let current = node;
      let dragCleanup: (() => void) | null = null;

      dom.className = 'zuvi-studio-word-image-node';
      dom.dataset.wordImageNode = '';
      dom.contentEditable = 'false';
      dom.draggable = true;
      image.className = 'zuvi-studio-word-image';
      image.dataset.wordImage = '';
      image.draggable = false;
      handle.className = 'zuvi-studio-word-image-resize';
      handle.dataset.wordImageResize = '';
      handle.title = '拖动调整图片大小';
      handle.setAttribute('aria-hidden', 'true');
      dom.append(image, handle);

      const render = (attrs: Record<string, unknown>) => {
        const width = Math.max(1, Math.min(2000, Number(attrs.width) || 320));
        const height = Math.max(1, Math.min(2000, Number(attrs.height) || 180));
        image.src = safeWordImageSource(attrs.src) ? attrs.src : '';
        image.width = width;
        image.height = height;
        image.alt = String(attrs.alt || '').slice(0, 1000);
        image.style.aspectRatio = `${width} / ${height}`;
      };
      render(current.attrs);

      const startResize = (event: PointerEvent) => {
        if (!editor.isEditable || event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        dragCleanup?.();
        const position = getPos();
        if (typeof position !== 'number') return;
        const width = Math.max(1, Math.min(2000, Number(current.attrs.width) || 320));
        const height = Math.max(1, Math.min(2000, Number(current.attrs.height) || 180));
        const ratio = width / height;
        const box = image.getBoundingClientRect();
        const scaleX = box.width > 0 ? box.width / width : 1;
        const scaleY = box.height > 0 ? box.height / height : scaleX;
        const initialX = event.clientX;
        const initialY = event.clientY;
        const pointerId = event.pointerId;
        let nextWidth = width;
        let nextHeight = height;
        const move = (moveEvent: PointerEvent) => {
          if (moveEvent.pointerId !== pointerId) return;
          const fromX = width + (moveEvent.clientX - initialX) / Math.max(0.01, scaleX);
          const fromY = (height + (moveEvent.clientY - initialY) / Math.max(0.01, scaleY)) * ratio;
          nextWidth = Math.round(
            Math.max(
              1,
              Math.min(
                2000,
                Math.abs(moveEvent.clientX - initialX) >= Math.abs(moveEvent.clientY - initialY)
                  ? fromX
                  : fromY
              )
            )
          );
          nextHeight = Math.max(1, Math.min(2000, Math.round(nextWidth / ratio)));
          render({ ...current.attrs, width: nextWidth, height: nextHeight });
        };
        const cleanup = () => {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', finish);
          window.removeEventListener('pointercancel', cancel);
          window.removeEventListener('keydown', escape);
          window.removeEventListener('blur', cancel);
          dragCleanup = null;
        };
        const finish = (upEvent: PointerEvent) => {
          if (upEvent.pointerId !== pointerId) return;
          move(upEvent);
          cleanup();
          if (!editor.isEditable || (nextWidth === width && nextHeight === height)) return;
          const nextPosition = getPos();
          if (
            typeof nextPosition !== 'number' ||
            editor.state.doc.nodeAt(nextPosition)?.type !== node.type
          )
            return;
          editor.view.dispatch(
            editor.state.tr.setNodeMarkup(nextPosition, undefined, {
              ...current.attrs,
              width: nextWidth,
              height: nextHeight,
            })
          );
          editor.commands.setNodeSelection(nextPosition);
        };
        const cancel = () => {
          cleanup();
          render(current.attrs);
        };
        const escape = (keyEvent: KeyboardEvent) => {
          if (keyEvent.key !== 'Escape') return;
          keyEvent.preventDefault();
          cancel();
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', finish);
        window.addEventListener('pointercancel', cancel);
        window.addEventListener('keydown', escape);
        window.addEventListener('blur', cancel);
        dragCleanup = cancel;
      };
      handle.addEventListener('pointerdown', startResize);

      return {
        dom,
        update(next) {
          if (next.type !== current.type) return false;
          current = next;
          render(next.attrs);
          return true;
        },
        selectNode() {
          dom.dataset.selected = '';
        },
        deselectNode() {
          delete dom.dataset.selected;
        },
        stopEvent(event) {
          return event.target === handle;
        },
        ignoreMutation() {
          return true;
        },
        destroy() {
          dragCleanup?.();
          handle.removeEventListener('pointerdown', startResize);
        },
      };
    };
  },
});

export const WordPageNumber = Node.create({
  name: 'pageNumber',
  group: 'inline',
  inline: true,
  atom: true,
  addAttributes: () => ({ kind: { default: 'current' } }),
  parseHTML: () => [
    {
      tag: 'span[data-word-page-number]',
      getAttrs: (element) => ({
        kind: (element as HTMLElement).dataset.wordPageNumber === 'total' ? 'total' : 'current',
      }),
    },
  ],
  renderHTML: ({ node }) => [
    'span',
    {
      'data-word-page-number': node.attrs.kind === 'total' ? 'total' : 'current',
      'aria-label': node.attrs.kind === 'total' ? '总页数（导出时计算）' : '页码（导出时计算）',
      contenteditable: 'false',
      class: 'zuvi-studio-word-page-number',
    },
    '1',
  ],
});

export const WordSuperscript = Mark.create({
  name: 'superscript',
  excludes: 'subscript',
  parseHTML: () => [{ tag: 'sup' }],
  renderHTML: () => ['sup', 0],
});

export const WordSubscript = Mark.create({
  name: 'subscript',
  excludes: 'superscript',
  parseHTML: () => [{ tag: 'sub' }],
  renderHTML: () => ['sub', 0],
});

export interface WordMatch {
  from: number;
  to: number;
  text: string;
}
/** 限制匹配范围的字符格式；true 的维度要求匹配区间内每个字符都携带该格式。 */
export interface WordFormatCriteria {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
}

/** 校验 [from, to) 内的每段文本都满足格式条件；区间无文本节点视为不满足。 */
function rangeHasFormat(
  doc: Editor['state']['doc'],
  from: number,
  to: number,
  criteria: WordFormatCriteria
): boolean {
  const active = Object.entries(criteria).filter(([, required]) => required);
  if (active.length === 0) return true;
  let sawText = false;
  let satisfied = true;
  doc.nodesBetween(from, to, (node) => {
    if (!satisfied) return false;
    if (!node.isText) return true;
    sawText = true;
    const has = (name: string) => node.marks.some((mark) => mark.type.name === name);
    if (
      (criteria.bold && !has('bold')) ||
      (criteria.italic && !has('italic')) ||
      (criteria.underline && !has('underline')) ||
      (criteria.strike && !has('strike'))
    )
      satisfied = false;
    return false;
  });
  return sawText && satisfied;
}

/** Textblock offsets include inline atoms, so matches span styled runs without losing positions. */
export function wordFindMatches(
  editor: Editor,
  query: string,
  matchCase = false,
  format?: WordFormatCriteria
): WordMatch[] {
  if (!query || query.length > 5000) return [];
  const pattern = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), matchCase ? 'g' : 'gi');
  const matches: WordMatch[] = [];
  editor.state.doc.descendants((node, position) => {
    if (!node.isTextblock) return;
    const text = node.textBetween(0, node.content.size, '', '\ufffc');
    pattern.lastIndex = 0;
    for (
      let match = pattern.exec(text);
      match && matches.length <= WORD_SEARCH_LIMIT;
      match = pattern.exec(text)
    ) {
      const from = position + 1 + match.index;
      const to = from + match[0].length;
      if (format && !rangeHasFormat(editor.state.doc, from, to, format)) continue;
      matches.push({ from, to, text: match[0] });
    }
    return false;
  });
  return matches;
}

export interface WordHeading {
  position: number;
  level: number;
  text: string;
}

export function wordHeadings(editor: Editor): WordHeading[] {
  const headings: WordHeading[] = [];
  editor.state.doc.descendants((node, position) => {
    if (node.type.name === 'heading')
      headings.push({
        position: position + 1,
        level: Number(node.attrs.level),
        text: node.textContent,
      });
  });
  return headings;
}

/** Replacements are plain text and use one transaction, retaining document structure and undo. */
export function wordReplaceMatches(editor: Editor, matches: WordMatch[], replacement: string) {
  if (!matches.length || !editor.isEditable) return false;
  if (replacement.length > 10000) throw new Error('替换文本最大支持 1 万字符。');
  const resultingSize =
    editor.state.doc.textContent.length +
    matches.length * replacement.length -
    matches.reduce((length, match) => length + match.to - match.from, 0);
  if (resultingSize > MAX_REPLACEMENT_DOCUMENT)
    throw new Error('替换后的文本超过 200 万字符，请缩小替换范围。');
  const transaction = editor.state.tr;
  for (const match of [...matches].sort((a, b) => b.from - a.from))
    transaction.insertText(replacement, match.from, match.to);
  editor.view.dispatch(transaction);
  return true;
}

function imageSize(bytes: Uint8Array): {
  mime: 'image/png' | 'image/jpeg';
  width: number;
  height: number;
} {
  if (
    bytes.length >= 24 &&
    [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte)
  ) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return { mime: 'image/png', width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (bytes[0] === 255 && bytes[1] === 216) {
    let offset = 2;
    while (offset + 3 < bytes.length) {
      if (bytes[offset++] !== 255) break;
      while (bytes[offset] === 255) offset++;
      const marker = bytes[offset++];
      if (marker === 217 || marker === 218) break;
      if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
      const length = bytes[offset] * 256 + bytes[offset + 1];
      if (length < 2 || offset + length > bytes.length) break;
      if (
        [192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(marker) &&
        length >= 7
      ) {
        return {
          mime: 'image/jpeg',
          width: bytes[offset + 5] * 256 + bytes[offset + 6],
          height: bytes[offset + 3] * 256 + bytes[offset + 4],
        };
      }
      offset += length;
    }
  }
  throw new Error('请选择有效的 PNG 或 JPEG 图片。');
}

export async function wordReadImage(file: File, maxWidth: number) {
  if (file.size > MAX_IMAGE_BYTES) throw new Error('单张图片最大支持 8 MB。');
  const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      reader.result instanceof ArrayBuffer
        ? resolve(reader.result)
        : reject(new Error('图片无法读取。'));
    reader.onerror = () => reject(new Error('图片无法读取。'));
    reader.onabort = () => reject(new Error('图片读取已取消。'));
    reader.readAsArrayBuffer(file);
  });
  const bytes = new Uint8Array(buffer);
  const size = imageSize(bytes);
  if (!size.width || !size.height || size.width > 50000 || size.height > 50000)
    throw new Error('图片尺寸无效或过大。');
  const scale = Math.min(1, Math.max(1, maxWidth) / size.width, 1200 / size.height);
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 8192)
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  return {
    src: `data:${size.mime};base64,${btoa(binary)}`,
    width: Math.max(1, Math.round(size.width * scale)),
    height: Math.max(1, Math.round(size.height * scale)),
    alt: file.name.slice(0, 1000),
  };
}

/* ------------------------- 字号步进 / 大小写 / 格式刷 ------------------------ */

const WORD_FONT_SIZE_MIN = 1;
export const WORD_HIGHLIGHT_COLORS: { label: string; value: string }[] = [
  { label: '黄色', value: '#ffff00' },
  { label: '亮绿', value: '#00ff00' },
  { label: '青色', value: '#00ffff' },
  { label: '紫红', value: '#ff00ff' },
  { label: '蓝色', value: '#0000ff' },
  { label: '红色', value: '#ff0000' },
  { label: '深蓝', value: '#000080' },
  { label: '深青', value: '#008080' },
  { label: '深绿', value: '#008000' },
  { label: '深紫红', value: '#800080' },
  { label: '深红', value: '#800000' },
  { label: '深黄', value: '#808000' },
  { label: '深灰', value: '#808080' },
  { label: '浅灰', value: '#c0c0c0' },
  { label: '黑色', value: '#000000' },
  { label: '白色', value: '#ffffff' },
];

/** 按 sizeStep 步进选区字号；sizeStep 为 0（Excel/未配置）时按 1 磅步进。 */
export function wordStepFontSize(editor: Editor, delta: number, sizeStep = 1, max = 300): boolean {
  if (!editor || editor.isDestroyed) return false;
  const current = Number.parseFloat(editor.getAttributes('textStyle').fontSize) || 12;
  const step = sizeStep > 0 ? sizeStep : 1;
  const next = Math.min(max, Math.max(WORD_FONT_SIZE_MIN, current + delta * step));
  if (next === current) return false;
  return editor.chain().focus().setFontSize(`${next}pt`).run();
}

export type WordCaseMode = 'upper' | 'lower' | 'toggle';

function transformCase(text: string, mode: WordCaseMode): string {
  if (mode === 'upper') return text.toLocaleUpperCase('zh-Hans-CN');
  if (mode === 'lower') return text.toLocaleLowerCase('zh-Hans-CN');
  return Array.from(text)
    .map((char) => {
      const upper = char.toLocaleUpperCase('zh-Hans-CN');
      const lower = char.toLocaleLowerCase('zh-Hans-CN');
      return char === upper ? lower : upper;
    })
    .join('');
}

/**
 * 将选区文本转换为指定大小写；单事务提交（一次撤销），不改链接内文本。
 * 转换完成后恢复原选区（Office 行为），便于连续调整。
 */
export function wordTransformSelectionCase(editor: Editor, mode: WordCaseMode): boolean {
  if (!editor || editor.isDestroyed) return false;
  const { from, to, empty } = editor.state.selection;
  if (empty) return false;
  const changes: { from: number; to: number; text: string }[] = [];
  editor.state.doc.nodesBetween(from, to, (node, position) => {
    // 容器节点必须继续下钻（返回 false 会连文本节点一起跳过）
    if (!node.isText || !node.text) return true;
    if (node.marks.some((mark) => mark.type.name === 'link')) return false;
    // 文本节点 position 即首字符前界；选区边界裁剪到本节点文本范围
    const start = Math.max(from, position);
    const end = Math.min(to, position + node.nodeSize);
    if (end <= start) return true;
    const slice = node.text.slice(start - position, end - position);
    const converted = transformCase(slice, mode);
    if (converted !== slice) changes.push({ from: start, to: end, text: converted });
    return true;
  });
  if (changes.length === 0) return false;
  // 与 wordReplaceMatches 一致：直接派发事务（chain().command 在部分环境下不派发）
  const transaction = editor.state.tr;
  for (const change of [...changes].sort((a, b) => b.from - a.from))
    transaction.insertText(change.text, change.from, change.to);
  editor.view.dispatch(transaction);
  return true;
}

export function wordSetHighlight(editor: Editor, color: string | null): boolean {
  if (!editor || editor.isDestroyed) return false;
  const chain = editor.chain().focus();
  return (color == null ? chain.unsetBackgroundColor() : chain.setBackgroundColor(color)).run();
}

export interface WordFormatSnapshot {
  marks: Record<string, unknown>;
  textStyle: Record<string, string | null>;
}

const WORD_TEXT_STYLE_ATTRS = ['fontFamily', 'fontSize', 'color', 'backgroundColor'] as const;

/** 捕获选区锚点的字符格式快照，供格式刷应用。 */
export function wordCaptureFormat(editor: Editor): WordFormatSnapshot | null {
  if (!editor || editor.isDestroyed) return null;
  const marks: Record<string, unknown> = {};
  for (const name of ['bold', 'italic', 'underline', 'strike', 'superscript', 'subscript'])
    marks[name] = editor.isActive(name);
  const style = editor.getAttributes('textStyle');
  const textStyle: Record<string, string | null> = {};
  for (const attr of WORD_TEXT_STYLE_ATTRS)
    textStyle[attr] = typeof style[attr] === 'string' ? (style[attr] as string) : null;
  return { marks, textStyle };
}

/** 将格式刷快照应用到当前选区；无快照或文档失配返回 false。 */
export function wordApplyFormat(editor: Editor, snapshot: WordFormatSnapshot | null): boolean {
  if (!editor || editor.isDestroyed || !snapshot) return false;
  const chain = editor.chain().focus();
  for (const [name, active] of Object.entries(snapshot.marks)) {
    if (active) chain.toggleMark(name, undefined, { extendEmptyMarkRange: true });
    else chain.unsetMark(name, { extendEmptyMarkRange: true });
  }
  for (const [attr, value] of Object.entries(snapshot.textStyle)) {
    if (value == null) chain.unsetMark('textStyle', { extendEmptyMarkRange: true });
    else chain.setMark('textStyle', { [attr]: value });
  }
  return chain.removeEmptyTextStyle().run();
}
