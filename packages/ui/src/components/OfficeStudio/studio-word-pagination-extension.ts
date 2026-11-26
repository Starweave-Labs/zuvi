import { Extension, type Editor } from '@tiptap/react';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import {
  wordPaginate,
  type WordLayoutBlock,
  type WordPagination,
  type WordPageBreak,
} from './studio-word-pagination';
import type { WordCellFragmentMeasure, WordCellLineFragment } from './studio-word-table-fragments';
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
export function wordMeasureCellLines(
  content: HTMLElement,
  from: number,
  top: number
): WordCellLineFragment[] {
  const doc = content.ownerDocument;
  const lines: WordCellLineFragment[] = [];
  const walker = doc.createTreeWalker(content, 5);
  let position = from;
  let hardBreak = false;
  let previousLeft = 0,
    previousRight = 0;
  const rtl = doc.defaultView!.getComputedStyle(content).direction === 'rtl';
  while (walker.nextNode()) {
    const current = walker.currentNode;
    if (current.nodeType === 1) {
      const element = current as HTMLElement;
      if (element.matches('[data-word-bookmark]')) { position++; continue; }
      if (element.matches('[data-word-math]')) {
        const rect = element.getBoundingClientRect();
        if (rect.height > 0) {
          const previous = lines.at(-1);
          const y = rect.top - top, bottom = rect.bottom - top;
          const wrapped = previous && y > previous.top + 1 &&
            (rtl ? rect.right > previousRight + 1 : rect.left < previousLeft - 1);
          const advances = rtl ? rect.right < previousRight - 1 : rect.left > previousLeft + 1;
          const overlaps = previous && y < previous.bottom && bottom > previous.top;
          if (previous && !hardBreak && !wrapped && (overlaps || advances)) {
            previous.to = position + 1; previous.top = Math.min(previous.top, y); previous.bottom = Math.max(previous.bottom, bottom);
          } else lines.push({ from: position, to: position + 1, top: y, bottom });
          hardBreak = false; previousLeft = rect.left; previousRight = rect.right;
        }
        position++;
      }
      if ((current as HTMLElement).matches('br:not(.ProseMirror-trailingBreak)')) {
        position++;
        hardBreak = true;
      }
      continue;
    }
    const text = current as Text;
    if (text.parentElement?.closest('[data-word-math]')) continue;
    let shift = 0;
    for (
      let parent = text.parentElement;
      parent && parent !== content;
      parent = parent.parentElement
    ) {
      const style = doc.defaultView!.getComputedStyle(parent);
      if (style.position === 'relative') shift += parseFloat(style.top) || 0;
    }
    for (let offset = 0; offset < text.length; offset++) {
      const range = doc.createRange();
      range.setStart(text, offset);
      range.setEnd(text, offset + 1);
      const rect = range.getBoundingClientRect();
      if (rect.height > 0) {
        const previous = lines.at(-1);
        const y = rect.top - top - shift;
        const bottom = rect.bottom - top - shift;
        const wrapped =
          previous &&
          y > previous.top + 1 &&
          (rtl ? rect.right > previousRight + 1 : rect.left < previousLeft - 1);
        const advances = rtl ? rect.right < previousRight - 1 : rect.left > previousLeft + 1;
        const overlaps = previous && y < previous.bottom && bottom > previous.top;
        if (previous && !hardBreak && !wrapped && (overlaps || advances)) {
          previous.top = Math.min(previous.top, y);
          previous.to = position + 1;
          previous.bottom = Math.max(previous.bottom, bottom);
        } else lines.push({ from: position, to: position + 1, top: y, bottom });
        hardBreak = false;
        previousLeft = rect.left;
        previousRight = rect.right;
      }
      position++;
    }
  }
  return lines;
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
      'border-collapse',
      'border-spacing',
      'table-layout',
      'box-sizing',
      'white-space',
      'text-align',
      'vertical-align',
      'display',
      'width',
      'max-width',
      'aspect-ratio',
      'float',
      'position',
    ])
      copies[index].style.setProperty(property, computed.getPropertyValue(property));
    if (
      node.matches('[data-word-cell-content]') &&
      node.parentElement?.parentElement?.matches(
        'tr[data-word-row-height-rule="exact"][data-word-row-height]'
      )
    ) {
      copies[index].style.height = computed.height;
      copies[index].style.overflow = computed.overflow;
    }
  });
  clone.style.cssText += `position:absolute;width:${width}px;height:auto;min-height:0;margin:0;transform:none;`;
  clone
    .querySelectorAll('[data-word-auto-page-row],[data-word-auto-page-gap]')
    .forEach((node) => node.remove());
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
        const table = element.matches('table') ? element : element.querySelector('table');
        const rows = Array.from(
          table?.querySelectorAll<HTMLElement>(':scope > tbody > tr,:scope > tr') ?? []
        );
        let headerCount = 0;
        while (
          headerCount < node.childCount &&
          node.child(headerCount).childCount > 0 &&
          Array.from({ length: node.child(headerCount).childCount }, (_, index) =>
            node.child(headerCount).child(index)
          ).every((cell) => cell.type.name === 'tableHeader')
        )
          headerCount++;
        const repeatable =
          headerCount > 0 &&
          headerCount < node.childCount &&
          Array.from({ length: headerCount }, (_, index) => node.child(index)).every(
            (row, index) => {
              let valid = true;
              row.forEach((cell) => {
                if (index + (Number(cell.attrs.rowspan) || 1) > headerCount) valid = false;
              });
              return valid;
            }
          );
        if (repeatable)
          block.continuationBefore = rows
            .slice(0, headerCount)
            .reduce((sum, row) => sum + row.getBoundingClientRect().height, 0);
        let rowPosition = position + 1;
        let groupEnd = repeatable ? headerCount + 1 : 0;
        node.forEach((row, offset, index) => {
          if (index >= rows.length) return;
          const rowFrom = position + 1 + offset;
          const rowTo = rowFrom + row.nodeSize;
          row.forEach((cell) => {
            groupEnd = Math.max(groupEnd, index + Math.max(1, Number(cell.attrs.rowspan) || 1));
          });
          const rowHeight = Math.max(1, rows[index].getBoundingClientRect().height);
          const previous = block.lines.at(-1);
          const multiCell =
            !repeatable &&
            index >= headerCount &&
            groupEnd <= index + 1 &&
            row.attrs.allowSplit !== false &&
            row.attrs.rowHeightRule !== 'exact' &&
            row.childCount > 1 &&
            Array.from({ length: row.childCount }, (_, i) => row.child(i)).every(
              (cell) =>
                Number(cell.attrs.rowspan ?? 1) === 1 &&
                cell.childCount === 1 &&
                cell.firstChild?.type.name === 'paragraph' &&
                Array.from({ length: cell.firstChild.childCount }, (_, i) =>
                  cell.firstChild!.child(i)
                ).every((inline) => inline.isText || inline.type.name === 'hardBreak')
            );
          if (rowPosition === rowFrom && multiCell) {
            const rowRect = rows[index].getBoundingClientRect();
            const elements = rows[index].querySelectorAll<HTMLElement>(':scope > td,:scope > th');
            const cells: WordCellFragmentMeasure[] = [];
            row.forEach((cell, offset, cellIndex) => {
              const from = rowFrom + offset + 3;
              const content = elements[cellIndex]?.querySelector<HTMLElement>(
                '[data-word-cell-content] > p'
              );
              if (content)
                cells.push({
                  from,
                  to: rowFrom + offset + cell.nodeSize - 1,
                  lines: wordMeasureCellLines(content, from, rowRect.top),
                });
            });
            block.lines.push({
              from: rowFrom,
              to: rowTo,
              height: rowHeight,
              ...(cells.length === row.childCount ? { cells } : {}),
            });
          } else if (rowPosition === rowFrom) {
            // A single unmerged cell can carry editable line fragments directly. Other
            // row geometries retain their merge group until synchronized cell fragments exist.
            const cell = row.firstChild;
            const paragraph = cell?.firstChild;
            const canFragment =
              !repeatable &&
              index >= headerCount &&
              groupEnd <= index + 1 &&
              row.attrs.allowSplit !== false &&
              row.attrs.rowHeightRule !== 'exact' &&
              row.childCount === 1 &&
              Number(cell?.attrs.rowspan ?? 1) === 1 &&
              cell?.childCount === 1 &&
              paragraph?.type.name === 'paragraph' &&
              Array.from({ length: paragraph.childCount }, (_, childIndex) =>
                paragraph.child(childIndex)
              ).every((inline) => inline.isText || inline.type.name === 'hardBreak');
            const content = rows[index].querySelector<HTMLElement>('[data-word-cell-content] > p');
            const fragments: { from: number; to: number; top: number; bottom: number }[] = [];
            if (canFragment && content) {
              let textPosition = rowFrom + 3;
              const walker = doc.createTreeWalker(content, 5);
              while (walker.nextNode()) {
                const current = walker.currentNode;
                if (current.nodeType === 1) {
                  if ((current as HTMLElement).matches('br:not(.ProseMirror-trailingBreak),img'))
                    textPosition++;
                  continue;
                }
                const text = current as Text;
                for (let offset = 0; offset < text.length; offset++) {
                  const range = doc.createRange();
                  range.setStart(text, offset);
                  range.setEnd(text, offset + 1);
                  const rect = range.getBoundingClientRect();
                  if (rect.height > 0) {
                    const previous = fragments.at(-1);
                    if (previous && rect.top < previous.bottom && rect.bottom > previous.top) {
                      previous.to = textPosition + 1;
                      previous.bottom = Math.max(previous.bottom, rect.bottom);
                    } else
                      fragments.push({
                        from: textPosition,
                        to: textPosition + 1,
                        top: rect.top,
                        bottom: rect.bottom,
                      });
                  }
                  textPosition++;
                }
              }
            }
            if (fragments.length > 1) {
              const rowRect = rows[index].getBoundingClientRect();
              fragments.forEach((fragment, fragmentIndex) =>
                block.lines.push({
                  from: fragmentIndex === 0 ? rowFrom : fragment.from,
                  to: fragmentIndex === fragments.length - 1 ? rowTo : fragment.to,
                  height:
                    (fragmentIndex === fragments.length - 1
                      ? rowRect.bottom
                      : fragments[fragmentIndex + 1].top) -
                    (fragmentIndex === 0 ? rowRect.top : fragment.top),
                })
              );
            } else block.lines.push({ from: rowFrom, to: rowTo, height: rowHeight });
          } else if (previous) {
            previous.to = rowTo;
            previous.height += rowHeight;
          }
          if (index + 1 >= groupEnd) rowPosition = rowTo;
        });
        if (!block.lines.length)
          block.lines = [
            {
              from: position,
              to: position + node.nodeSize,
              height: Math.max(1, element.getBoundingClientRect().height),
            },
          ];
        block.widowControl = false;
        blocks.push(block);
        return false;
      }
      const measured: { from: number; to: number; top: number; bottom: number }[] = [];
      let offset = from;
      const walker = doc.createTreeWalker(element, 5);
      while (walker.nextNode()) {
        if (walker.currentNode.nodeType === 1) {
          const inline = walker.currentNode as HTMLElement;
          if (inline.matches('.ProseMirror-separator,.ProseMirror-trailingBreak')) continue;
          if (inline.tagName === 'IMG' || inline.matches('[data-word-math]')) {
            const wrap = inline.closest('[data-wrap]')?.getAttribute('data-wrap');
            if (!wrap || wrap === 'inline') {
              const rect = inline.getBoundingClientRect();
              if (rect.height > 0) {
                const last = measured.at(-1);
                if (last && rect.top < last.bottom && rect.bottom > last.top) {
                  last.to = offset + 1;
                  last.top = Math.min(last.top, rect.top);
                  last.bottom = Math.max(last.bottom, rect.bottom);
                } else
                  measured.push({
                    from: offset,
                    to: offset + 1,
                    top: rect.top,
                    bottom: rect.bottom,
                  });
              }
            }
          }
          if (inline.tagName === 'BR' || inline.matches('img,[data-word-page-number],[data-word-math],[data-word-bookmark]')) offset++;
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
            if (last && rect.top < last.bottom && rect.bottom > last.top) {
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
                ? Math.max(lineHeight, line.bottom - line.top, measured[index + 1].top - line.top)
                : Math.max(lineHeight, line.bottom - line.top),
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
  const rowHeights = new Map<number, number>();
  for (const placement of layout?.placements ?? [])
    if (placement.rowFrom !== undefined && placement.naturalRowHeight !== undefined)
      rowHeights.set(placement.rowFrom, placement.naturalRowHeight);
  for (const [position, height] of rowHeights) {
    const row = document.nodeAt(position);
    if (row?.type.name === 'tableRow')
      decorations.push(
        Decoration.node(position, position + row.nodeSize, {
          'data-word-natural-row-height': String(height),
        })
      );
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
  const boundaries = (layout?.breaks ?? []).flatMap<
    WordPageBreak & { cellPadding?: number; cellIndex?: number }
  >((boundary) =>
    boundary.cellBreaks
      ? boundary.cellBreaks.map((cell, cellIndex) => ({
          ...boundary,
          position: cell.position,
          cellPadding: cell.padding,
          cellIndex,
        }))
      : [{ ...boundary, cellPadding: undefined, cellIndex: undefined }]
  );
  for (const boundary of boundaries) {
    const size =
      boundary.remaining + options.margin * 2 + options.gap + (boundary.cellPadding ?? 0);
    const parent = document.resolve(boundary.position).parent;
    const tableBoundary = parent.type.name === 'table';
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
          if (boundary.cellPadding !== undefined) {
            span.dataset.wordCellPageGap = 'true';
            if (boundary.cellIndex === 0) {
              span.dataset.wordCellPageLabel = 'true';
              const node = editor.view.domAtPos(boundary.position).node;
              const element = node.nodeType === 1 ? (node as HTMLElement) : node.parentElement;
              const paragraph = element?.closest('p');
              const surface = editor.view.dom.getBoundingClientRect();
              const scale = surface.width / editor.view.dom.offsetWidth;
              const left =
                paragraph && scale > 0
                  ? (paragraph.getBoundingClientRect().left - surface.left) / scale
                  : 0;
              span.style.setProperty('--word-table-gap-left', `${-options.margin - left}px`);
              span.style.setProperty(
                '--word-table-gap-width',
                `${editor.view.dom.offsetWidth + options.margin * 2}px`
              );
            }
            span.style.cssText += `width:100%;margin-inline-start:0;background:none;--word-gap-start:${(boundary.cellPadding ?? 0) + boundary.remaining + options.margin}px;--word-gap-end:${(boundary.cellPadding ?? 0) + boundary.remaining + options.margin + options.gap}px;`;
          }
          if (tableBoundary) {
            const row = editor.view.dom.ownerDocument.createElement('tr');
            row.dataset.wordAutoPageRow = String(boundary.page);
            const cell = editor.view.dom.ownerDocument.createElement('td');
            let columns = 0;
            parent.firstChild?.forEach((node) => {
              columns += Number(node.attrs.colspan) || 1;
            });
            cell.colSpan = Math.max(1, columns);
            cell.style.cssText = 'padding:0;border:0;line-height:0;';
            row.setAttribute('aria-hidden', 'true');
            row.inert = true;
            row.contentEditable = 'false';
            cell.append(span);
            if (boundary.continuationBefore) {
              const position = document.resolve(boundary.position).before();
              const container = editor.view.dom.querySelector(
                `[data-word-pagination-position="${position}"]`
              );
              const source = container?.matches('table')
                ? container
                : container?.querySelector('table');
              if (source) {
                const repeated = source.cloneNode(false) as HTMLElement;
                repeated.removeAttribute('data-word-pagination-position');
                repeated.dataset.wordRepeatedHeader = '';
                repeated.style.cssText = 'width:100%;margin:0;pointer-events:none;';
                const colgroup = source.querySelector(':scope > colgroup');
                if (colgroup) repeated.append(colgroup.cloneNode(true));
                const body = editor.view.dom.ownerDocument.createElement('tbody');
                const sourceRows = source.querySelectorAll(
                  ':scope > tbody > tr:not([data-word-auto-page-row]),:scope > tr:not([data-word-auto-page-row])'
                );
                for (let index = 0; index < parent.childCount; index++) {
                  const header = parent.child(index);
                  if (
                    !header.childCount ||
                    !Array.from({ length: header.childCount }, (_, cellIndex) =>
                      header.child(cellIndex)
                    ).every((cell) => cell.type.name === 'tableHeader')
                  )
                    break;
                  if (sourceRows[index]) body.append(sourceRows[index].cloneNode(true));
                }
                body.querySelectorAll('[id],[data-word-pagination-position]').forEach((node) => {
                  node.removeAttribute('id');
                  node.removeAttribute('data-word-pagination-position');
                });
                body
                  .querySelectorAll(
                    'button,input,select,textarea,[data-word-image-resize],[data-word-image-move]'
                  )
                  .forEach((node) => node.remove());
                repeated.append(body);
                cell.append(repeated);
              }
            }
            row.append(cell);
            return row;
          }
          return span;
        },
        {
          side: -1,
          ignoreSelection: true,
          key: `page:${boundary.page}:${boundary.position}:${size}:${boundary.continuationBefore ?? 0}:${boundary.cellIndex ?? -1}`,
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
          editor.view.dom.addEventListener('load', schedule, true);
          editor.view.dom.addEventListener('error', schedule, true);
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
              editor.view.dom.removeEventListener('load', schedule, true);
              editor.view.dom.removeEventListener('error', schedule, true);
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
