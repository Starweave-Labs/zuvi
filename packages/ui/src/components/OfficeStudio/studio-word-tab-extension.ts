import { Extension, type Editor } from '@tiptap/react';
import { closeHistory } from '@tiptap/pm/history';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Node as RichNode } from '@tiptap/pm/model';
import { wordEditorParagraphStyles, wordSelectedParagraphs } from './studio-word-paragraph-layout';
import { resolveStudioWordParagraphStyle, studioWordNodeStyleId } from './studio-word-styles';
import { wordMergeTabStops, wordTabStops, wordDecimalSymbol, wordDefaultTabStop } from './studio-word-tabs';
import { wordLayoutTabElements } from './studio-word-tabs-dom';
import type { WordTabPatch } from './StudioWordTabsDialog';

function baseTabs(editor: Editor, node: RichNode) {
  return resolveStudioWordParagraphStyle(wordEditorParagraphStyles(editor), studioWordNodeStyleId(node.toJSON())).tabStops;
}
export function wordEffectiveTabStops(editor: Editor, node: RichNode) {
  return wordMergeTabStops(baseTabs(editor, node), node.attrs.tabStops);
}
export function wordSelectionTabStops(editor: Editor) {
  const formats = wordSelectedParagraphs(editor).map(({ node }) => wordEffectiveTabStops(editor, node));
  return formats.every((format) => JSON.stringify(format) === JSON.stringify(formats[0])) ? formats[0] ?? [] : null;
}
export function wordSetTabStops(editor: Editor, patch: WordTabPatch) {
  if (editor.isDestroyed || !editor.isEditable || editor.view.composing) return false;
  const stops = wordTabStops(patch.stops);
  if (!stops.length && !patch.clearAll) return false;
  const plans = wordSelectedParagraphs(editor).map(({ node, position }) => {
    const reset = patch.clearAll ? wordEffectiveTabStops(editor, node).map((stop) => ({ position: stop.position, alignment: 'clear' as const })) : node.attrs.tabStops;
    const own = wordMergeTabStops(reset, stops);
    wordMergeTabStops(baseTabs(editor, node), own);
    return { node, position, own };
  });
  const tr = closeHistory(editor.state.tr);
  for (const { node, position, own } of plans) {
    if (JSON.stringify(wordTabStops(node.attrs.tabStops)) === JSON.stringify(own)) continue;
    tr.setNodeMarkup(position, undefined, { ...node.attrs, tabStops: own });
  }
  if (!tr.docChanged) return false;
  editor.view.dispatch(tr); editor.commands.focus(); return true;
}

export function wordInsertTab(editor: Editor) {
  if (editor.isDestroyed || !editor.isEditable || editor.view.composing) return false;
  return editor.chain().focus().command(({ tr }) => { closeHistory(tr); return true; })
    .insertContent({ type: 'text', text: '\t' }).run();
}

type TabMeasurement = { position: number; width: string; leader: string };
const tabKey = new PluginKey<{ decorations: DecorationSet; measurements: TabMeasurement[]; revision: number }>('studioWordTabs');
export function wordRefreshTabLayout(editor: Editor) {
  if (!editor.isDestroyed) editor.view.dispatch(editor.state.tr.setMeta('studioWordTabRefresh', true).setMeta('addToHistory', false));
}
function decorations(doc: RichNode, measurements: TabMeasurement[] = []) {
  const list: Decoration[] = [];
  const byPosition = new Map(measurements.map((item) => [item.position, item]));
  doc.descendants((node, pos) => {
    if (!node.isText) return;
    for (let i = 0; i < node.text!.length; i++) if (node.text![i] === '\t') {
      const measured = byPosition.get(pos + i);
      list.push(Decoration.inline(pos + i, pos + i + 1, { 'data-word-tab': '', 'data-word-tab-position': String(pos+i), class: 'zuvi-studio-word-tab',
        ...(measured ? { style: `width:${measured.width}`, 'data-word-leader': measured.leader } : {}),
      }));
    }
  });
  return DecorationSet.create(doc, list);
}

export const WordTabs = Extension.create<{ getDefaultTabStop?: () => number; getDecimalSymbol?: () => unknown }>({
  name: 'studioWordTabs',
  addOptions: () => ({ getDefaultTabStop: undefined }),
  addGlobalAttributes() {
    return [{ types: ['paragraph', 'heading'], attributes: {
      tabStops: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const data = element.getAttribute('data-word-tabs-own') ?? element.getAttribute('data-word-tabs');
          if (!data) return null;
          try { return wordTabStops(JSON.parse(data)); } catch { return null; }
        },
        renderHTML: (attrs: Record<string, unknown>) => {
          const base = (attrs.paragraphStyleSnapshot as { tabStops?: unknown } | null)?.tabStops;
          return { 'data-word-tabs': JSON.stringify(wordMergeTabStops(base, attrs.tabStops)),
            'data-word-default-tab': String(wordDefaultTabStop(this.options.getDefaultTabStop?.())),
            'data-word-decimal-symbol': wordDecimalSymbol(this.options.getDecimalSymbol?.()),
            ...(attrs.tabStops != null ? { 'data-word-tabs-own': JSON.stringify(wordTabStops(attrs.tabStops)) } : {}) };
        },
      },
    } }];
  },
  addKeyboardShortcuts() {
    return { Tab: () => {
      if (!this.editor.isEditable || this.editor.view.composing || this.editor.isActive('table') || this.editor.isActive('listItem')) return false;
      return wordInsertTab(this.editor);
    } };
  },
  addProseMirrorPlugins() {
    return [new Plugin({
      key: tabKey,
      state: { init: (_, state) => ({ decorations: decorations(state.doc), measurements: [] as TabMeasurement[], revision: 0 }), apply: (tr, old) => {
        const measured = tr.getMeta(tabKey) as TabMeasurement[] | undefined;
        const revision = old.revision + (tr.getMeta('studioWordTabRefresh') ? 1 : 0);
        return measured || tr.docChanged || revision !== old.revision
          ? { decorations: measured || tr.docChanged ? decorations(tr.doc, measured) : old.decorations, measurements: measured ?? (tr.docChanged ? [] : old.measurements), revision } : old;
      } },
      props: { decorations: (state) => tabKey.getState(state)?.decorations },
      view: (view) => {
        const win = view.dom.ownerDocument.defaultView!;
        let frame = 0, destroyed = false;
        const schedule = () => {
          if (destroyed || frame) return;
          frame = win.requestAnimationFrame(() => {
            frame = 0; if (destroyed) return;
            const interval = wordDefaultTabStop(this.options.getDefaultTabStop?.());
            const symbol = wordDecimalSymbol(this.options.getDecimalSymbol?.());
            for (const paragraph of view.dom.querySelectorAll<HTMLElement>('[data-word-tabs]'))
              {
                if (paragraph.dataset.wordDefaultTab !== String(interval)) paragraph.dataset.wordDefaultTab = String(interval);
                if (paragraph.dataset.wordDecimalSymbol !== symbol) paragraph.dataset.wordDecimalSymbol = symbol;
              }
            wordLayoutTabElements(view.dom);
            const measured = [...view.dom.querySelectorAll<HTMLElement>('[data-word-tab-position]')].map((element) => ({
              position: Number(element.dataset.wordTabPosition), width: element.style.width, leader: element.dataset.wordLeader ?? 'none',
            })).filter((item) => item.width);
            if (JSON.stringify(measured) !== JSON.stringify(tabKey.getState(view.state)?.measurements))
              view.dispatch(view.state.tr.setMeta(tabKey, measured).setMeta('addToHistory', false));
          });
        };
        const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
        resize?.observe(view.dom);
        win.addEventListener('resize', schedule);
        view.dom.ownerDocument.fonts?.addEventListener('loadingdone', schedule);
        void view.dom.ownerDocument.fonts?.ready.then(schedule);
        schedule();
        return { update: (_, old) => { if (old.doc !== view.state.doc || tabKey.getState(old)?.revision !== tabKey.getState(view.state)?.revision) schedule(); }, destroy: () => {
          destroyed = true; win.cancelAnimationFrame(frame); resize?.disconnect();
          win.removeEventListener('resize', schedule);
          view.dom.ownerDocument.fonts?.removeEventListener('loadingdone', schedule);
        } };
      },
    })];
  },
});
