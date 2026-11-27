import { Extension, type Editor } from '@tiptap/react';
import { closeHistory } from '@tiptap/pm/history';
import { wordEditorParagraphStyles, wordSelectedParagraphs } from './studio-word-paragraph-layout';
import { resolveStudioWordParagraphStyle, studioWordNodeStyleId } from './studio-word-styles';
import {
  wordSurface,
  wordMergeSurface,
  wordPatchSurface,
  wordSurfaceCss,
  type StudioWordParagraphSurface,
  type WordSurfacePatch,
} from './studio-word-surface';
export function wordEffectiveSurface(editor: Editor, node: import('@tiptap/pm/model').Node) {
  const base = resolveStudioWordParagraphStyle(
    wordEditorParagraphStyles(editor),
    studioWordNodeStyleId(node.toJSON())
  ).surface;
  return wordMergeSurface(base, node.attrs.paragraphSurface);
}
export function wordSelectionSurfaces(editor: Editor) {
  return wordSelectedParagraphs(editor).map(({ node }) => wordEffectiveSurface(editor, node));
}
export function wordSetParagraphSurface(editor: Editor, patch: WordSurfacePatch) {
  if (editor.isDestroyed || !editor.isEditable || editor.view.composing) return false;
  const plans = wordSelectedParagraphs(editor).map(({ node, position }) => ({
    node,
    position,
    surface: wordPatchSurface(
      node.attrs.paragraphSurface,
      wordEffectiveSurface(editor, node),
      patch
    ),
  }));
  const tr = closeHistory(editor.state.tr);
  for (const { node, position, surface } of plans)
    if (JSON.stringify(wordSurface(node.attrs.paragraphSurface)) !== JSON.stringify(surface))
      tr.setNodeMarkup(position, undefined, { ...node.attrs, paragraphSurface: surface });
  if (!tr.docChanged) return false;
  editor.view.dispatch(tr);
  editor.commands.focus();
  return true;
}
export const WordParagraphSurface = Extension.create({
  name: 'studioWordParagraphSurface',
  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          paragraphSurface: {
            default: null,
            parseHTML: (element: HTMLElement) => {
              const raw = element.dataset.wordSurfaceOwn ?? element.dataset.wordSurface;
              if (!raw) return null;
              try {
                return wordSurface(JSON.parse(raw));
              } catch {
                return null;
              }
            },
            renderHTML: (attrs: Record<string, unknown>) => {
              const snapshot = attrs.paragraphStyleSnapshot as {
                surface?: StudioWordParagraphSurface;
              } | null;
              const effective = wordMergeSurface(snapshot?.surface, attrs.paragraphSurface);
              const css = wordSurfaceCss(effective);
              return {
                'data-word-surface': JSON.stringify(effective),
                ...(attrs.paragraphSurface != null
                  ? { 'data-word-surface-own': JSON.stringify(wordSurface(attrs.paragraphSurface)) }
                  : {}),
                ...(Object.keys(css).length
                  ? {
                      style: Object.entries(css)
                        .map(
                          ([key, value]) =>
                            `${key.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}:${value}`
                        )
                        .join(';'),
                    }
                  : {}),
              };
            },
          },
        },
      },
    ];
  },
});
