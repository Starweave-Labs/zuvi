import { Extension, type Editor } from '@tiptap/react';
import { Plugin, type EditorState, type Transaction } from '@tiptap/pm/state';
import { closeHistory } from '@tiptap/pm/history';
import { splitBlock } from '@tiptap/pm/commands';
import { splitListItem } from '@tiptap/pm/schema-list';
import { wordMergeTabStops } from './studio-word-tabs';
import { wordMergeSurface } from './studio-word-surface';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import type { StudioRichNode, StudioWordParagraphStyle } from './studio-types';
import {
  WORD_BUILTIN_STYLES,
  applyStudioWordStyleToNode,
  getStudioWordParagraphStyles,
  resolveStudioWordParagraphStyle,
  studioWordNodeRun,
  studioWordNodeStyleId,
  studioWordRunMarks,
  validateStudioWordParagraphStyles,
} from './studio-word-styles';

const STYLE_TRANSACTION = 'studioWordStyle';
const isParagraph = (node: ProseMirrorNode) => ['paragraph', 'heading'].includes(node.type.name);

function localStyles(state: EditorState) {
  return getStudioWordParagraphStyles(state.doc.toJSON() as StudioRichNode);
}

function writeBlock(tr: Transaction, position: number, target: StudioRichNode) {
  const node = tr.doc.nodeAt(position)!;
  tr.setNodeMarkup(position, tr.doc.type.schema.nodes[target.type], target.attrs);
  let offset = position + 1;
  node.forEach((child, _offset, index) => {
    const desired = target.content?.[index]?.marks || [];
    const marks = desired.map((mark) => tr.doc.type.schema.markFromJSON(mark));
    if (child.isInline && !child.sameMarkup(child.mark(marks))) {
      tr.removeMark(offset, offset + child.nodeSize);
      for (const mark of marks) tr.addMark(offset, offset + child.nodeSize, mark);
    }
    offset += child.nodeSize;
  });
}

function setDefinitions(
  tr: Transaction,
  styles: StudioWordParagraphStyle[],
  previous: StudioWordParagraphStyle[]
) {
  const plans: { position: number; target: StudioRichNode }[] = [];
  tr.doc.descendants((node, position) => {
    if (!isParagraph(node) || typeof node.attrs.paragraphStyle !== 'string') return;
    const id = node.attrs.paragraphStyle;
    const old = resolveStudioWordParagraphStyle(previous, id);
    const exists = [...WORD_BUILTIN_STYLES, ...styles].some((style) => style.id === id);
    plans.push({
      position,
      target: applyStudioWordStyleToNode(
        node.toJSON() as StudioRichNode,
        resolveStudioWordParagraphStyle(styles, exists ? id : 'paragraph'),
        old
      ),
    });
    return false;
  });
  for (const plan of plans) writeBlock(tr, plan.position, plan.target);
  tr.setDocAttribute('paragraphStyles', styles.length ? styles : null);
  tr.setMeta(STYLE_TRANSACTION, true);
}

export function wordSetParagraphStyles(editor: Editor, input: unknown) {
  if (!editor.isEditable || editor.isDestroyed) return false;
  const styles = validateStudioWordParagraphStyles(input);
  const previous = localStyles(editor.state);
  const tr = closeHistory(editor.state.tr);
  setDefinitions(tr, styles, previous);
  editor.view.dispatch(tr);
  return true;
}

function applyToSelection(
  tr: Transaction,
  state: EditorState,
  id: string,
  styles: StudioWordParagraphStyle[]
) {
  const style = resolveStudioWordParagraphStyle(styles, id);
  const plans: { position: number; target: StudioRichNode }[] = [];
  tr.doc.nodesBetween(tr.selection.from, tr.selection.to, (node, position) => {
    if (!isParagraph(node)) return;
    const $position = tr.doc.resolve(position);
    const type = state.schema.nodes[style.headingLevel ? 'heading' : 'paragraph'];
    if (!$position.parent.canReplaceWith($position.index(), $position.index() + 1, type))
      return false;
    const previous = resolveStudioWordParagraphStyle(
      styles,
      studioWordNodeStyleId(node.toJSON() as StudioRichNode)
    );
    plans.push({
      position,
      target: applyStudioWordStyleToNode(node.toJSON() as StudioRichNode, style, previous),
    });
    return false;
  });
  if (!plans.length) return false;
  for (const plan of plans) writeBlock(tr, plan.position, plan.target);
  if (tr.selection.empty) {
    const marks = studioWordRunMarks(
      {
        type: 'text',
        marks: (tr.storedMarks || tr.selection.$from.marks()).map((mark) => mark.toJSON()),
      },
      style.run
    );
    tr.setStoredMarks(marks.map((mark) => state.schema.markFromJSON(mark)));
  }
  tr.setMeta(STYLE_TRANSACTION, true);
  return true;
}

export function wordApplyParagraphStyle(
  editor: Editor,
  id: string,
  styles = localStyles(editor.state)
) {
  if (!editor.isEditable || editor.isDestroyed) return false;
  return editor
    .chain()
    .focus()
    .command(({ state, tr }) => {
      closeHistory(tr);
      return applyToSelection(tr, state, id, styles);
    })
    .run();
}

function appearanceAt(state: EditorState) {
  const $from = state.selection.$from;
  const inline = $from.parent.childAfter($from.parentOffset).node || $from.nodeBefore;
  const marks = state.storedMarks || inline?.marks || $from.marks();
  return studioWordNodeRun({ type: 'text', marks: marks.map((mark) => mark.toJSON()) });
}

interface WordStyleExtensionOptions {
  getStyles?: () => StudioWordParagraphStyle[];
  /** A header/footer shares body definitions; direct regional edits remain overrides. */
  autoUpdate: boolean;
}

export const WordParagraphStyles = Extension.create<WordStyleExtensionOptions>({
  name: 'studioWordParagraphStyles',
  priority: 1000,
  addOptions: () => ({ autoUpdate: true }),
  addGlobalAttributes() {
    return [
      {
        types: ['doc'],
        attributes: { paragraphStyles: { default: null, rendered: false } },
      },
      {
        types: ['paragraph', 'heading'],
        attributes: {
          paragraphStyleSnapshot: { default: null, rendered: false },
          paragraphStyleMaterialized: { default: false, rendered: false },
          paragraphStyleFallback: { default: null, rendered: false },
          paragraphStyle: {
            default: null,
            parseHTML: (element) => element.getAttribute('data-word-style'),
            renderHTML: (attrs) =>
              typeof attrs.paragraphStyle === 'string'
                ? { 'data-word-style': attrs.paragraphStyle }
                : {},
          },
        },
      },
    ];
  },
  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const editor = this.editor;
        const node = editor.state.selection.$from.parent;
        if (!isParagraph(node) || !node.attrs.paragraphStyle) return false;
        const styles = this.options.getStyles?.() || localStyles(editor.state);
        const style = resolveStudioWordParagraphStyle(styles, node.attrs.paragraphStyle);
        const actual = appearanceAt(editor.state);
        const capture: { transaction?: Transaction } = {};
        const split = editor.isActive('listItem')
          ? splitListItem(editor.schema.nodes.listItem)
          : splitBlock;
        if (
          !split(editor.state, (tr) => {
            capture.transaction = tr;
          }) ||
          !capture.transaction
        )
          return false;
        const tr = closeHistory(capture.transaction);
        applyToSelection(tr, editor.state, style.next, styles);
        const nextRun = { ...resolveStudioWordParagraphStyle(styles, style.next).run };
        for (const key of Object.keys(nextRun) as (keyof typeof nextRun)[])
          if (actual[key] !== style.run[key]) Object.assign(nextRun, { [key]: actual[key] });
        const source = {
          type: 'text',
          marks: (editor.state.storedMarks || editor.state.selection.$from.marks()).map((mark) =>
            mark.toJSON()
          ),
        };
        tr.setStoredMarks(
          studioWordRunMarks(source, nextRun).map((mark) => editor.schema.markFromJSON(mark))
        );
        editor.view.dispatch(tr);
        return true;
      },
    };
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        appendTransaction: (transactions, oldState, state) => {
          if (
            !this.options.autoUpdate ||
            !transactions.some((tr) => tr.docChanged) ||
            transactions.some((tr) => tr.getMeta(STYLE_TRANSACTION)) ||
            JSON.stringify(oldState.doc.attrs.paragraphStyles) !==
              JSON.stringify(state.doc.attrs.paragraphStyles)
          )
            return null;
          const old = oldState.selection.$from.parent;
          const current = state.selection.$from.parent;
          const id = current.attrs.paragraphStyle;
          if (
            !isParagraph(old) ||
            !isParagraph(current) ||
            typeof id !== 'string' ||
            old.attrs.paragraphStyle !== id ||
            old.textContent !== current.textContent
          )
            return null;
          const styles = localStyles(state);
          const definition = styles.find((style) => style.id === id);
          if (!definition?.autoUpdate) return null;
          const previousRun = appearanceAt(oldState);
          const currentRun = appearanceAt(state);
          const run = Object.fromEntries(
            Object.keys(currentRun)
              .filter(
                (key) =>
                  previousRun[key as keyof typeof previousRun] !==
                  currentRun[key as keyof typeof currentRun]
              )
              .map((key) => [key, currentRun[key as keyof typeof currentRun]])
          );
          const paragraph = Object.fromEntries(
            [
              'textAlign',
              'indentLeft',
              'indentRight',
              'indentFirstLine',
              'spaceBefore',
              'spaceAfter',
              'lineHeight',
            ]
              .filter((key) => old.attrs[key] !== current.attrs[key])
              .map((key) => [
                key,
                current.attrs[key] ??
                  resolveStudioWordParagraphStyle([], 'paragraph').paragraph[
                    key as keyof typeof definition.paragraph
                  ],
              ])
          );
          const tabStops =
            JSON.stringify(old.attrs.tabStops) !== JSON.stringify(current.attrs.tabStops)
              ? wordMergeTabStops(
                  resolveStudioWordParagraphStyle(styles, id).tabStops,
                  current.attrs.tabStops
                )
              : undefined;
          const surface =
            JSON.stringify(old.attrs.paragraphSurface) !==
            JSON.stringify(current.attrs.paragraphSurface)
              ? wordMergeSurface(
                  resolveStudioWordParagraphStyle(styles, id).surface,
                  current.attrs.paragraphSurface
                )
              : undefined;
          if (
            !Object.keys(run).length &&
            !Object.keys(paragraph).length &&
            tabStops === undefined &&
            surface === undefined
          )
            return null;
          const next = validateStudioWordParagraphStyles(
            styles.map((style) =>
              style.id === id
                ? {
                    ...style,
                    run: { ...style.run, ...run },
                    paragraph: { ...style.paragraph, ...paragraph },
                    ...(tabStops !== undefined ? { tabStops } : {}),
                    ...(surface !== undefined ? { surface } : {}),
                  }
                : style
            )
          );
          const tr = state.tr;
          setDefinitions(tr, next, styles);
          if (tabStops !== undefined)
            state.doc.descendants((node, position) => {
              if (
                !isParagraph(node) ||
                node.attrs.paragraphStyle !== id ||
                JSON.stringify(oldState.doc.nodeAt(position)?.attrs.tabStops) ===
                  JSON.stringify(node.attrs.tabStops)
              )
                return;
              const updated = tr.doc.nodeAt(position)!;
              tr.setNodeMarkup(position, undefined, { ...updated.attrs, tabStops: null });
              return false;
            });
          if (surface !== undefined)
            state.doc.descendants((node, position) => {
              if (
                !isParagraph(node) ||
                node.attrs.paragraphStyle !== id ||
                JSON.stringify(oldState.doc.nodeAt(position)?.attrs.paragraphSurface) ===
                  JSON.stringify(node.attrs.paragraphSurface)
              )
                return;
              const updated = tr.doc.nodeAt(position)!;
              tr.setNodeMarkup(position, undefined, { ...updated.attrs, paragraphSurface: null });
              return false;
            });
          return tr;
        },
      }),
    ];
  },
});
