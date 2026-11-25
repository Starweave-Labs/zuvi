import { Extension, type Editor } from '@tiptap/react';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { wordPaginate, type WordLayoutBlock, type WordPagination } from './studio-word-pagination';
import { effectiveParagraph } from './studio-word-paragraph-layout';
const key = new PluginKey<{ layout: WordPagination | null }>('studioWordPagination');
export interface WordPaginationOptions {
  height: number;
  margin: number;
  gap: number;
  enabled: boolean;
}
export function wordSetPagination(editor: Editor, options: WordPaginationOptions) {
  if (editor.isDestroyed) return;
  if (
    ![options.height, options.margin, options.gap].every(Number.isFinite) ||
    options.height <= 0 ||
    options.margin < 0 ||
    options.gap < 0
  )
    throw new Error('分页尺寸无效。');
  editor.view.dispatch(
    editor.state.tr.setMeta('wordPaginationOptions', options).setMeta('addToHistory', false)
  );
}
function measure(editor: Editor): WordLayoutBlock[] {
  const doc = editor.view.dom.ownerDocument,
    win = doc.defaultView!,
    source = editor.view.dom;
  const clone = source.cloneNode(true) as HTMLElement;
  clone.removeAttribute('id');
  clone.removeAttribute('role');
  clone.removeAttribute('contenteditable');
  clone.setAttribute('aria-hidden', 'true');
  const width = source.offsetWidth;
  if (!width) return [];
  clone.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;left:0;top:0;width:${width}px;height:auto;min-height:0;transform:none;`;
  const originals = [source, ...source.querySelectorAll<HTMLElement>('*')],
    copies = [clone, ...clone.querySelectorAll<HTMLElement>('*')];
  originals.forEach((node, index) => {
    const computed = win.getComputedStyle(node);
    for (const property of [
      'font-family',
      'font-size',
      'font-weight',
      'font-style',
      'line-height',
      'letter-spacing',
      'word-spacing',
      'margin-top',
      'margin-bottom',
      'margin-left',
      'margin-right',
      'text-indent',
      'padding-top',
      'padding-bottom',
      'padding-left',
      'padding-right',
      'border-top-width',
      'border-bottom-width',
      'border-left-width',
      'border-right-width',
      'border-top-style',
      'border-bottom-style',
      'box-sizing',
      'white-space',
      'text-align',
      'vertical-align',
      'display',
      'width',
      'max-width',
      'float',
      'position',
    ])
      copies[index].style.setProperty(property, computed.getPropertyValue(property));
  });
  clone.style.cssText += `position:absolute;width:${width}px;height:auto;min-height:0;margin:0;transform:none;`;
  clone.querySelectorAll('[data-word-auto-page-gap]').forEach((node) => node.remove());
  doc.body.append(clone);
  try {
    const blocks: WordLayoutBlock[] = [];
    editor.state.doc.descendants((node, position) => {
      if (node.type.name === 'pageBreak') {
        blocks.push({ from: position, to: position + node.nodeSize, lines: [], pageBreak: true });
        return false;
      }
      if (!['paragraph', 'heading', 'table'].includes(node.type.name)) return;
      const element = clone.querySelector<HTMLElement>(
        `[data-word-pagination-position="${position}"]`
      );
      if (!element) return false;
      const style = win.getComputedStyle(element),
        from = position + 1,
        to = position + node.nodeSize - 1;
      const flags = node.type.name === 'table' ? null : effectiveParagraph(editor, node);
      const block: WordLayoutBlock = {
        from: position,
        to: position + node.nodeSize,
        lines: [],
        before: parseFloat(style.marginTop) || 0,
        after: parseFloat(style.marginBottom) || 0,
        widowControl: flags?.widowControl !== false,
        keepNext: flags?.keepNext === true,
        keepLines: flags?.keepLines === true,
      };
      if (node.type.name === 'table') {
        block.lines = [
          {
            from: position,
            to: position + node.nodeSize,
            height: Math.max(1, element.getBoundingClientRect().height),
          },
        ];
        block.keepLines = true;
        blocks.push(block);
        return false;
      }
      const measured: { from: number; to: number; top: number; bottom: number }[] = [];
      let offset = from;
      const walker = doc.createTreeWalker(element, 5);
      while (walker.nextNode()) {
        if (walker.currentNode.nodeType === 1) {
          const inline = walker.currentNode as HTMLElement;
          if (inline.tagName === 'BR' || inline.matches('img,[data-word-page-number]')) offset++;
          continue;
        }
        const text = walker.currentNode as Text;
        if (text.parentElement?.closest('[contenteditable="false"]')) continue;
        for (let index = 0; index < text.length; index++) {
          const range = doc.createRange();
          range.setStart(text, index);
          range.setEnd(text, index + 1);
          const rect = range.getBoundingClientRect();
          if (rect.height > 0) {
            const last = measured.at(-1);
            if (last && Math.abs(last.top - rect.top) < 3) {
              last.to = offset + 1;
              last.bottom = Math.max(last.bottom, rect.bottom);
            } else
              measured.push({ from: offset, to: offset + 1, top: rect.top, bottom: rect.bottom });
          }
          offset++;
        }
      }
      const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2 || 20;
      block.lines = measured.length
        ? measured.map((line, index) => ({
            from: line.from,
            to: index === measured.length - 1 ? to : line.to,
            height:
              index < measured.length - 1
                ? Math.max(lineHeight, measured[index + 1].top - line.top)
                : lineHeight,
          }))
        : [{ from, to, height: Math.max(lineHeight, element.getBoundingClientRect().height) }];
      // Account for blank hard-break lines and paragraph borders as part of the final fragment.
      const total = block.lines.reduce((sum, line) => sum + line.height, 0),
        actual = element.getBoundingClientRect().height;
      if (actual > total) block.lines.at(-1)!.height += actual - total;
      blocks.push(block);
      return false;
    });
    return blocks;
  } finally {
    clone.remove();
  }
}
function markers(
  editor: Editor,
  layout: WordPagination | null,
  options: WordPaginationOptions,
  document: import('@tiptap/pm/model').Node
) {
  const decorations: Decoration[] = [];
  const ranges = new Map<number, { first: number; last: number }>();
  for (const entry of layout?.placements ?? []) {
    const old = ranges.get(entry.block);
    if (old) old.last = entry.page + 1;
    else ranges.set(entry.block, { first: entry.page + 1, last: entry.page + 1 });
  }
  const starts = new Map<number, number>();
  for (const entry of layout?.placements ?? [])
    if (!starts.has(entry.block)) starts.set(entry.block, entry.from);
  const entries = [...starts].sort((a, b) => a[1] - b[1]);
  let cursor = 0;
  document.descendants((node, pos) => {
    if (['paragraph', 'heading', 'table'].includes(node.type.name)) {
      while (cursor < entries.length && entries[cursor][1] < pos) cursor++;
      const block = entries[cursor]?.[1] < pos + node.nodeSize ? entries[cursor]?.[0] : undefined;
      const pages = block === undefined ? undefined : ranges.get(block);
      decorations.push(
        Decoration.node(pos, pos + node.nodeSize, {
          'data-word-pagination-position': String(pos),
          ...(pages
            ? {
                'data-word-page-first': String(pages.first),
                'data-word-page-last': String(pages.last),
              }
            : {}),
        })
      );
      return false;
    }
  });
  for (const boundary of layout?.breaks ?? []) {
    const size = boundary.remaining + options.margin * 2 + options.gap;
    decorations.push(
      Decoration.widget(
        boundary.position,
        () => {
          const span = editor.view.dom.ownerDocument.createElement(boundary.block ? 'div' : 'span');
          span.dataset.wordAutoPageGap = String(boundary.page);
          span.setAttribute('aria-hidden', 'true');
          span.contentEditable = 'false';
          span.className = 'zuvi-studio-word-page-gap';
          span.style.cssText = `display:block;height:${size}px;pointer-events:none;user-select:none;line-height:0;--word-gap-start:${boundary.remaining + options.margin}px;--word-gap-end:${boundary.remaining + options.margin + options.gap}px;--word-gap-margin:${options.margin}px;`;
          return span;
        },
        {
          side: -1,
          ignoreSelection: true,
          key: `page:${boundary.page}:${boundary.position}:${size}`,
        }
      )
    );
  }
  return DecorationSet.create(document, decorations);
}
export const WordPaginationLayout = Extension.create({
  name: 'studioWordPaginationLayout',
  addProseMirrorPlugins() {
    const editor = this.editor;
    let options: WordPaginationOptions = { height: 960, margin: 75, gap: 24, enabled: false };
    return [
      new Plugin({
        key,
        state: {
          init: () => ({ layout: null as WordPagination | null }),
          apply: (tr, old) => {
            const next = tr.getMeta('wordPaginationOptions') as WordPaginationOptions | undefined;
            if (next) options = next;
            const layout = tr.getMeta(key) as WordPagination | undefined;
            if (layout || next || tr.docChanged) {
              return {
                layout: layout ?? (tr.docChanged || !options.enabled ? null : old.layout),
              };
            }
            return old;
          },
        },
        props: {
          decorations: (state) =>
            options.enabled
              ? markers(editor, key.getState(state)?.layout ?? null, options, state.doc)
              : null,
        },
        view: () => {
          const win = editor.view.dom.ownerDocument.defaultView!;
          let frame = 0,
            disposed = false;
          const schedule = () => {
            if (disposed || frame || !options.enabled || editor.view.composing) return;
            frame = win.requestAnimationFrame(() => {
              frame = 0;
              if (disposed || !options.enabled || editor.view.composing) return;
              const blocks = measure(editor);
              if (!blocks.length) return;
              const layout = wordPaginate(blocks, options.height);
              if (JSON.stringify(layout) !== JSON.stringify(key.getState(editor.state)?.layout))
                editor.view.dispatch(
                  editor.state.tr.setMeta(key, layout).setMeta('addToHistory', false)
                );
              editor.view.dom.dataset.wordPageCount = String(layout.pages);
              editor.view.dom.dataset.wordPaginationOverflow = String(layout.overflow);
            });
          };
          const resize =
            typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
          resize?.observe(editor.view.dom);
          editor.view.dom.ownerDocument.fonts?.addEventListener('loadingdone', schedule);
          const afterComposition = () => {
            win.requestAnimationFrame(schedule);
          };
          editor.view.dom.addEventListener('compositionend', afterComposition);
          win.addEventListener('resize', schedule);
          void editor.view.dom.ownerDocument.fonts?.ready.then(schedule);
          schedule();
          return {
            update: (_view, old) => {
              if (!options.enabled) {
                delete editor.view.dom.dataset.wordPageCount;
                delete editor.view.dom.dataset.wordPaginationOverflow;
              }
              if (old.doc !== editor.state.doc || key.getState(old) !== key.getState(editor.state))
                schedule();
            },
            destroy: () => {
              disposed = true;
              win.cancelAnimationFrame(frame);
              resize?.disconnect();
              editor.view.dom.ownerDocument.fonts?.removeEventListener('loadingdone', schedule);
              editor.view.dom.removeEventListener('compositionend', afterComposition);
              win.removeEventListener('resize', schedule);
              delete editor.view.dom.dataset.wordPageCount;
              delete editor.view.dom.dataset.wordPaginationOverflow;
            },
          };
        },
      }),
    ];
  },
});
