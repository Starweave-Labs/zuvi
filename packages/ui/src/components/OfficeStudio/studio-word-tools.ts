import { Mark, Node, type Editor } from '@tiptap/react';
import { closeHistory } from '@tiptap/pm/history';
import { wordMergeTabStops } from './studio-word-tabs';
import {wordMergeSurface,wordClearSurface} from './studio-word-surface';
import { TextSelection } from '@tiptap/pm/state';
import {
  resolveStudioWordParagraphStyle,
  getStudioWordParagraphStyles,
} from './studio-word-styles';
import type { StudioRichNode } from './studio-types';
import { wordDefaultImageLayout, wordImageCss } from './studio-word-image-preview';
import { wordImageLayout } from './studio-word-images';

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
      layout: { default: null, rendered: false },
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
        let layout;
        try {
          layout = wordImageLayout(
            JSON.parse(element.getAttribute('data-word-image-layout') || 'null')
          );
        } catch {
          return false;
        }
        return {
          src: element.getAttribute('src'),
          width: Math.max(1, Math.min(2000, Number.isFinite(width) ? width : 320)),
          height: Math.max(1, Math.min(2000, Number.isFinite(height) ? height : 180)),
          alt: (element.getAttribute('alt') || '').slice(0, 1000),
          layout: layout || null,
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
      ...(node.attrs.layout
        ? {
            'data-word-image-layout': JSON.stringify(wordImageLayout(node.attrs.layout)),
            style: `aspect-ratio: ${Number(node.attrs.width) || 320} / ${Number(node.attrs.height) || 180};${Object.entries(
              wordImageCss(
                wordImageLayout(node.attrs.layout),
                Number(node.attrs.width) || 320,
                Number(node.attrs.height) || 180
              )
            )
              .map(
                ([key, value]) =>
                  `${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}:${value}`
              )
              .join(';')}`,
          }
        : {}),
    },
  ],
  addNodeView() {
    return ({ node, editor, getPos }) => {
      const dom = document.createElement('span');
      const image = document.createElement('img');
      const handle = document.createElement('span');
      const mover = document.createElement('span');
      let current = node;
      let dragCleanup: (() => void) | null = null;
      let geometryFrame = 0;
      let destroyed = false;
      const previewGeometry = () => {
        const paper = dom.closest<HTMLElement>('[data-part="word-paper"]');
        const paragraph = dom.parentElement?.closest<HTMLElement>('p,h1,h2,h3,h4,h5,h6');
        const body = dom.closest<HTMLElement>('.tiptap');
        if (!paper || !paragraph || !body || paper.offsetWidth <= 0) return;
        const page = paper.getBoundingClientRect();
        const box = paragraph.getBoundingClientRect();
        const bodyBox = body.getBoundingClientRect();
        const scale = page.width / paper.offsetWidth || 1;
        const margin =
          parseFloat(getComputedStyle(paper).getPropertyValue('--zuvi-studio-word-page-margin')) ||
          0;
        const pageHeight =
          parseFloat(getComputedStyle(paper).getPropertyValue('--zuvi-studio-word-page-height')) ||
          paper.offsetHeight;
        const originX = (page.left - box.left) / scale;
        const originY = (page.top - box.top) / scale;
        const columnX = (bodyBox.left - box.left) / scale;
        const columnWidth = bodyBox.width / scale;
        const textRange = document.createRange();
        textRange.setStart(paragraph, 0);
        textRange.setEndBefore(dom);
        const textBox = textRange.getBoundingClientRect();
        const character = textRange.toString() ? (textBox.right - box.left) / scale : 0;
        const line = textRange.toString()
          ? (textBox.bottom - box.top) / scale -
            (parseFloat(getComputedStyle(paragraph).lineHeight) || 24)
          : 0;
        return {
          horizontal: {
            page: { start: originX, size: paper.offsetWidth },
            margin: { start: originX + margin, size: Math.max(0, paper.offsetWidth - margin * 2) },
            column: { start: columnX, size: columnWidth },
            character: { start: character, size: 0 },
            leftMargin: { start: originX, size: margin },
            insideMargin: { start: originX, size: margin },
            rightMargin: { start: originX + paper.offsetWidth - margin, size: margin },
            outsideMargin: { start: originX + paper.offsetWidth - margin, size: margin },
          },
          vertical: {
            page: { start: originY, size: pageHeight },
            margin: { start: originY + margin, size: Math.max(0, pageHeight - margin * 2) },
            paragraph: { start: 0, size: box.height / scale },
            line: { start: line, size: 0 },
            topMargin: { start: originY, size: margin },
            insideMargin: { start: originY, size: margin },
            bottomMargin: { start: originY + pageHeight - margin, size: margin },
            outsideMargin: { start: originY + pageHeight - margin, size: margin },
          },
        };
      };

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
      mover.className = 'zuvi-studio-word-image-move';
      mover.dataset.wordImageMove = '';
      mover.setAttribute('role', 'button');
      mover.setAttribute('aria-label', '移动浮动图片');
      mover.title = '拖动移动图片；方向键微调，Shift+方向键移动 10 像素';
      mover.textContent = '✥';
      mover.tabIndex = -1;
      dom.append(image, handle, mover);

      const render = (attrs: Record<string, unknown>) => {
        const width = Math.max(1, Math.min(2000, Number(attrs.width) || 320));
        const height = Math.max(1, Math.min(2000, Number(attrs.height) || 180));
        image.src = safeWordImageSource(attrs.src) ? attrs.src : '';
        image.width = width;
        image.height = height;
        image.alt = String(attrs.alt || '').slice(0, 1000);
        image.style.aspectRatio = `${width} / ${height}`;
        const layout = wordImageLayout(attrs.layout);
        dom.removeAttribute('style');
        dom.draggable = !layout?.lockAnchor;
        if (layout) {
          dom.dataset.wordImageLayout = JSON.stringify(layout);
          dom.dataset.wrap = layout.wrap;
          Object.assign(dom.style, wordImageCss(layout, width, height, previewGeometry()));
          if (dom.dataset.selected !== undefined) mover.tabIndex = editor.isEditable ? 0 : -1;
          mover.setAttribute('aria-disabled', String(!editor.isEditable));
        } else {
          delete dom.dataset.wordImageLayout;
          delete dom.dataset.wrap;
          mover.tabIndex = -1;
        }
      };
      render(current.attrs);
      const refreshGeometry = () => {
        if (geometryFrame || typeof requestAnimationFrame !== 'function') return;
        geometryFrame = requestAnimationFrame(() => {
          geometryFrame = 0;
          if (!destroyed && !dragCleanup) render(current.attrs);
        });
      };
      const resizeObserver =
        typeof ResizeObserver === 'function' ? new ResizeObserver(refreshGeometry) : undefined;
      refreshGeometry();
      editor.on('transaction', refreshGeometry);
      window.addEventListener('resize', refreshGeometry);
      const observeGeometry = () => {
        if (destroyed) return;
        const paper = dom.closest<HTMLElement>('[data-part="word-paper"]');
        const paragraph = dom.parentElement;
        if (paper) resizeObserver?.observe(paper);
        if (paragraph) resizeObserver?.observe(paragraph);
      };
      queueMicrotask(observeGeometry);

      const startResize = (event: PointerEvent) => {
        if (!editor.isEditable || event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        dragCleanup?.();
        const position = getPos();
        if (typeof position !== 'number') return;
        const width = Math.max(1, Math.min(2000, Number(current.attrs.width) || 320));
        const height = Math.max(1, Math.min(2000, Number(current.attrs.height) || 180));
        const original = current;
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
          if (
            !editor.isEditable ||
            current !== original ||
            (nextWidth === width && nextHeight === height)
          ) {
            render(current.attrs);
            return;
          }
          const nextPosition = getPos();
          if (
            typeof nextPosition !== 'number' ||
            editor.state.doc.nodeAt(nextPosition)?.type !== node.type
          )
            return;
          editor.view.dispatch(
            closeHistory(editor.state.tr).setNodeMarkup(nextPosition, undefined, {
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
      const moveBy = (x: number, y: number) => {
        const position = getPos();
        if (!editor.isEditable || typeof position !== 'number') return;
        const layout = wordImageLayout(current.attrs.layout) || wordDefaultImageLayout();
        const patch = {
          ...layout,
          horizontal: {
            relative: layout.horizontal.relative,
            offset: Math.max(-10000, Math.min(10000, (layout.horizontal.offset || 0) + x)),
          },
          vertical: {
            relative: layout.vertical.relative,
            offset: Math.max(-10000, Math.min(10000, (layout.vertical.offset || 0) + y)),
          },
        };
        editor.view.dispatch(
          closeHistory(editor.state.tr).setNodeMarkup(position, undefined, {
            ...current.attrs,
            layout: patch,
          })
        );
        editor.commands.setNodeSelection(position);
      };
      const startMove = (event: PointerEvent) => {
        if (!editor.isEditable || event.button !== 0 || !current.attrs.layout) return;
        event.preventDefault();
        event.stopPropagation();
        dragCleanup?.();
        const initial = current;
        const layout = wordImageLayout(initial.attrs.layout)!;
        const width = Number(initial.attrs.width) || 320;
        const height = Number(initial.attrs.height) || 180;
        const rect = image.getBoundingClientRect();
        const scaleX = rect.width > 0 ? rect.width / width : 1;
        const scaleY = rect.height > 0 ? rect.height / height : scaleX;
        let next = layout;
        const move = (input: PointerEvent) => {
          if (input.pointerId !== event.pointerId) return;
          next = {
            ...layout,
            horizontal: {
              relative: layout.horizontal.relative,
              offset: Math.max(
                -10000,
                Math.min(
                  10000,
                  (layout.horizontal.offset || 0) + (input.clientX - event.clientX) / scaleX
                )
              ),
            },
            vertical: {
              relative: layout.vertical.relative,
              offset: Math.max(
                -10000,
                Math.min(
                  10000,
                  (layout.vertical.offset || 0) + (input.clientY - event.clientY) / scaleY
                )
              ),
            },
          };
          render({ ...initial.attrs, layout: next });
        };
        const cleanup = () => {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', finish);
          window.removeEventListener('pointercancel', cancel);
          window.removeEventListener('keydown', escape);
          window.removeEventListener('blur', cancel);
          dragCleanup = null;
        };
        const cancel = () => {
          cleanup();
          render(current.attrs);
        };
        const finish = (input: PointerEvent) => {
          if (input.pointerId !== event.pointerId) return;
          move(input);
          cleanup();
          const position = getPos();
          if (
            !editor.isEditable ||
            !current.eq(initial) ||
            typeof position !== 'number' ||
            !editor.state.doc.nodeAt(position)?.eq(initial)
          ) {
            render(current.attrs);
            return;
          }
          if (
            Math.abs(input.clientX - event.clientX) < 1 &&
            Math.abs(input.clientY - event.clientY) < 1
          ) {
            render(current.attrs);
            return;
          }
          editor.view.dispatch(
            closeHistory(editor.state.tr).setNodeMarkup(position, undefined, {
              ...initial.attrs,
              layout: next,
            })
          );
          editor.commands.setNodeSelection(position);
        };
        const escape = (input: KeyboardEvent) => {
          if (input.key === 'Escape') {
            input.preventDefault();
            cancel();
          }
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', finish);
        window.addEventListener('pointercancel', cancel);
        window.addEventListener('keydown', escape);
        window.addEventListener('blur', cancel);
        dragCleanup = cancel;
      };
      const keyMove = (event: KeyboardEvent) => {
        const directions: Record<string, [number, number]> = {
          ArrowLeft: [-1, 0],
          ArrowRight: [1, 0],
          ArrowUp: [0, -1],
          ArrowDown: [0, 1],
        };
        const amount = directions[event.key];
        if (!amount || event.isComposing) return;
        event.preventDefault();
        event.stopPropagation();
        moveBy(amount[0] * (event.shiftKey ? 10 : 1), amount[1] * (event.shiftKey ? 10 : 1));
      };
      mover.addEventListener('pointerdown', startMove);
      mover.addEventListener('keydown', keyMove);

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
          mover.tabIndex = current.attrs.layout && editor.isEditable ? 0 : -1;
        },
        deselectNode() {
          delete dom.dataset.selected;
          mover.tabIndex = -1;
        },
        stopEvent(event) {
          return event.target === handle || event.target === mover;
        },
        ignoreMutation() {
          return true;
        },
        destroy() {
          destroyed = true;
          dragCleanup?.();
          handle.removeEventListener('pointerdown', startResize);
          mover.removeEventListener('pointerdown', startMove);
          mover.removeEventListener('keydown', keyMove);
          resizeObserver?.disconnect();
          if (geometryFrame) cancelAnimationFrame(geometryFrame);
          editor.off('transaction', refreshGeometry);
          window.removeEventListener('resize', refreshGeometry);
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

export const WORD_FONT_SIZE_STEPS = [
  8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72,
] as const;
const WORD_FONT_SIZE_MAX = 409;

export function wordNextFontSize(current: number, increase: boolean): number {
  if (!Number.isFinite(current)) current = 12;
  if (current < 8) return Math.max(1, increase ? Math.floor(current) + 1 : Math.ceil(current) - 1);
  if (increase)
    return Math.min(
      WORD_FONT_SIZE_MAX,
      WORD_FONT_SIZE_STEPS.find((size) => size > current) ?? (Math.floor(current / 10) + 1) * 10
    );
  return Math.max(
    WORD_FONT_SIZE_MIN,
    current > 72
      ? Math.max(72, (Math.ceil(current / 10) - 1) * 10)
      : ([...WORD_FONT_SIZE_STEPS].reverse().find((size) => size < current) ?? 7)
  );
}

/** Each selected run keeps its own size and other marks; a caret changes only subsequent input. */
export function wordStepFontSize(editor: Editor, delta: number): boolean {
  if (!editor || editor.isDestroyed || !editor.isEditable || editor.view.composing || !delta)
    return false;
  editor.view.focus();
  const { from, to, empty } = editor.state.selection;
  const styles = getStudioWordParagraphStyles(editor.getJSON() as StudioRichNode);
  const defaultSize = (position: number) => {
    const node = editor.state.doc.resolve(position).parent;
    const id =
      typeof node.attrs.paragraphStyle === 'string'
        ? node.attrs.paragraphStyle
        : node.type.name === 'heading'
          ? `heading-${node.attrs.level}`
          : 'paragraph';
    return resolveStudioWordParagraphStyle(styles, id).run.fontSize;
  };
  const markType = editor.schema.marks.textStyle;
  const sizedMark = (marks: readonly import('@tiptap/pm/model').Mark[], position: number) => {
    const attrs = marks.find((mark) => mark.type === markType)?.attrs || {};
    const raw = /^(\d+(?:\.\d+)?)(pt|px)$/.exec(String(attrs.fontSize || ''));
    const current = raw ? Number(raw[1]) * (raw[2] === 'px' ? 0.75 : 1) : defaultSize(position);
    const next = wordNextFontSize(current, delta > 0);
    return next === current ? undefined : markType.create({ ...attrs, fontSize: `${next}pt` });
  };
  const tr = closeHistory(editor.state.tr);
  let changed = false;
  if (empty) {
    const mark = sizedMark(editor.state.storedMarks || editor.state.selection.$from.marks(), from);
    if (!mark) return false;
    tr.addStoredMark(mark);
    changed = true;
  } else
    editor.state.doc.nodesBetween(from, to, (node, position) => {
      if (!node.isText) return;
      const start = Math.max(from, position);
      const end = Math.min(to, position + node.nodeSize);
      const mark = sizedMark(node.marks, start);
      if (!mark || end <= start) return;
      tr.removeMark(start, end, markType).addMark(start, end, mark);
      changed = true;
    });
  if (!changed) return false;
  editor.view.dispatch(tr);
  return true;
}

export type WordCaseMode = 'sentence' | 'lower' | 'upper' | 'title' | 'toggle';
const wordSegments = new Intl.Segmenter('en', { granularity: 'word' });
const cased = (char: string) =>
  char.toLocaleUpperCase('zh-Hans-CN') !== char.toLocaleLowerCase('zh-Hans-CN');

/** Transform across mark boundaries, retaining each character's original marks and selection. */
export function wordTransformSelectionCase(editor: Editor, mode: WordCaseMode): boolean {
  if (!editor || editor.isDestroyed || !editor.isEditable || editor.view.composing) return false;
  const selection = editor.state.selection;
  let { from, to } = selection;
  if (selection.empty) {
    const parent = selection.$from.parent;
    if (!parent.isTextblock) return false;
    const text = parent.textBetween(0, parent.content.size, '', '\ufffc');
    const offset = selection.$from.parentOffset;
    const segment = [...wordSegments.segment(text)].find(
      (segment) =>
        segment.isWordLike &&
        segment.index <= offset &&
        segment.index + segment.segment.length >= offset
    );
    if (!segment) return false;
    from = selection.$from.start() + segment.index;
    to = from + segment.segment.length;
  }
  const changes: {
    from: number;
    to: number;
    text: string;
    marks: readonly import('@tiptap/pm/model').Mark[];
    caretOffset?: number;
  }[] = [];
  editor.state.doc.nodesBetween(from, to, (block, position) => {
    if (!block.isTextblock) return;
    const text = block.textBetween(0, block.content.size, '', '\ufffc');
    const wordStarts = new Set<number>();
    for (const segment of wordSegments.segment(text)) {
      if (!segment.isWordLike) continue;
      let offset = segment.index;
      for (const char of segment.segment) {
        if (cased(char)) {
          wordStarts.add(offset);
          break;
        }
        offset += char.length;
      }
    }
    const transformed = new Map<number, string>();
    let offset = 0;
    let sentenceStart = true;
    for (const char of text) {
      const upper = char.toLocaleUpperCase('zh-Hans-CN');
      const lower = char.toLocaleLowerCase('zh-Hans-CN');
      transformed.set(
        offset,
        mode === 'upper'
          ? upper
          : mode === 'lower'
            ? lower
            : mode === 'toggle'
              ? char === upper
                ? lower
                : upper
              : mode === 'title'
                ? wordStarts.has(offset)
                  ? upper
                  : lower
                : sentenceStart && cased(char)
                  ? upper
                  : lower
      );
      if (cased(char)) sentenceStart = false;
      if (/[.!?。！？\n]/u.test(char)) sentenceStart = true;
      offset += char.length;
    }
    block.descendants((node, inner) => {
      if (!node.isText || !node.text) return;
      let cursor = inner;
      let start = -1;
      let end = -1;
      let original = '';
      let converted = '';
      let caretOffset = 0;
      for (const char of node.text) {
        const charStart = position + 1 + cursor;
        const charEnd = charStart + char.length;
        if (charStart >= from && charEnd <= to) {
          if (start < 0) start = charStart;
          end = charEnd;
          original += char;
          converted += transformed.get(cursor)!;
          if (charEnd <= selection.from) caretOffset = converted.length;
        }
        cursor += char.length;
      }
      if (start >= 0 && original !== converted)
        changes.push({
          from: start,
          to: end,
          text: converted,
          marks: node.marks,
          ...(selection.empty && selection.from >= start && selection.from <= end
            ? { caretOffset }
            : {}),
        });
    });
    return false;
  });
  if (!changes.length) return false;
  if (
    editor.state.doc.textContent.length +
      changes.reduce(
        (length, change) => length + change.text.length - (change.to - change.from),
        0
      ) >
    MAX_REPLACEMENT_DOCUMENT
  )
    throw new Error('转换后的文本超过 200 万字符，请缩小选区。');
  const transaction = closeHistory(editor.state.tr);
  for (const change of [...changes].sort((a, b) => b.from - a.from))
    transaction.replaceWith(change.from, change.to, editor.schema.text(change.text, change.marks));
  const caretChange = changes.find((change) => change.caretOffset !== undefined);
  transaction.setSelection(
    selection.empty
      ? TextSelection.create(
          transaction.doc,
          caretChange
            ? transaction.mapping.map(caretChange.from, -1) + caretChange.caretOffset!
            : transaction.mapping.map(selection.from, 1)
        )
      : TextSelection.create(
          transaction.doc,
          transaction.mapping.map(selection.anchor, selection.anchor === from ? -1 : 1),
          transaction.mapping.map(selection.head, selection.head === from ? -1 : 1)
        )
  );
  editor.view.dispatch(transaction);
  editor.commands.focus(null, { scrollIntoView: false });
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
  paragraph: Record<string, unknown>;
}

const WORD_TEXT_STYLE_ATTRS = [
  'fontFamily',
  'fontSize',
  'color',
  'backgroundColor',
  'letterSpacing',
  'baselineShift',
] as const;
const WORD_PARAGRAPH_FORMAT_ATTRS = [
  'textAlign',
  'indentLeft',
  'indentRight',
  'indentFirstLine',
  'spaceBefore',
  'spaceAfter',
  'lineHeight',
  'lineHeightRule',
  'lineHeightBasis',
] as const;

/** Clear direct character/paragraph formatting without changing links, list/table structure or heading levels. */
export function wordClearFormat(editor: Editor): boolean {
  if (!editor || editor.isDestroyed || !editor.isEditable) return false;
  const { from, to } = editor.state.selection;
  const transaction = closeHistory(editor.state.tr);
  for (const type of Object.values(editor.schema.marks)) {
    if (type.name === 'link') continue;
    transaction.removeMark(from, to, type);
    transaction.removeStoredMark(type);
  }
  editor.state.doc.nodesBetween(from, to, (node, position) => {
    if (!['paragraph', 'heading'].includes(node.type.name)) return;
    transaction.setNodeMarkup(position, undefined, {
      ...node.attrs,
      ...Object.fromEntries(WORD_PARAGRAPH_FORMAT_ATTRS.map((key) => [key, null])),
      paragraphStyle: 'paragraph',
      paragraphStyleMaterialized: true,
      paragraphStyleFallback: null,
      paragraphStyleSnapshot: null,
      tabStops: null,
      paragraphSurface:null,
      paragraphStyleDirectAttrs: null,
    });
  });
  editor.view.dispatch(transaction);
  return true;
}

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
  const node = editor.state.selection.$from.parent;
  const paragraph = Object.fromEntries(
    WORD_PARAGRAPH_FORMAT_ATTRS.map((key) => [key, node.attrs[key] ?? null])
  );
  paragraph.tabStops = wordMergeTabStops(node.attrs.paragraphStyleSnapshot?.tabStops, node.attrs.tabStops);
  paragraph.paragraphSurface=wordMergeSurface(node.attrs.paragraphStyleSnapshot?.surface,node.attrs.paragraphSurface);
  return { marks, textStyle, paragraph };
}

/** 将格式刷快照应用到当前选区；无快照或文档失配返回 false。 */
export function wordApplyFormat(editor: Editor, snapshot: WordFormatSnapshot | null): boolean {
  if (
    !editor ||
    editor.isDestroyed ||
    !editor.isEditable ||
    !snapshot ||
    editor.state.selection.empty
  )
    return false;
  const { from, to } = editor.state.selection;
  const transaction = closeHistory(editor.state.tr);
  for (const [name, active] of Object.entries(snapshot.marks)) {
    const type = editor.schema.marks[name];
    if (!type) continue;
    transaction.removeMark(from, to, type);
    if (active) transaction.addMark(from, to, type.create());
  }
  const textStyle = editor.schema.marks.textStyle;
  transaction.removeMark(from, to, textStyle);
  const attributes = Object.fromEntries(
    Object.entries(snapshot.textStyle).filter(([, value]) => value !== null)
  );
  if (Object.keys(attributes).length) transaction.addMark(from, to, textStyle.create(attributes));
  editor.state.doc.nodesBetween(from, to, (node, position) => {
    if (!['paragraph', 'heading'].includes(node.type.name)) return;
    transaction.setNodeMarkup(position, undefined, {
      ...node.attrs,
      ...snapshot.paragraph,
      paragraphSurface:wordMergeSurface(wordClearSurface(),snapshot.paragraph.paragraphSurface),
      tabStops: wordMergeTabStops(
        wordMergeTabStops(node.attrs.paragraphStyleSnapshot?.tabStops, node.attrs.tabStops).map((stop) => ({ position: stop.position, alignment: 'clear' })),
        snapshot.paragraph.tabStops
      ),
      paragraphStyleDirectAttrs: WORD_PARAGRAPH_FORMAT_ATTRS.filter(
        (key) => key !== 'lineHeightBasis'
      ),
    });
  });
  editor.view.dispatch(transaction);
  return true;
}
