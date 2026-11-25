import { Extension, type Editor } from '@tiptap/react';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Node } from '@tiptap/pm/model';

interface NonprintingState {
  enabled: boolean;
  decorations: DecorationSet;
}
const nonprintingKey = new PluginKey<NonprintingState>('studioWordNonprinting');

function marker(position: number, kind: 'paragraph' | 'line-break') {
  return Decoration.widget(
    position,
    (view) => {
      const span = view.dom.ownerDocument.createElement('span');
      span.className = 'zuvi-studio-word-nonprinting-end';
      span.dataset.wordNonprinting = kind;
      span.setAttribute('aria-hidden', 'true');
      span.contentEditable = 'false';
      return span;
    },
    { side: 1, ignoreSelection: true, key: `${kind}:${position}` }
  );
}

/** Decorations retain the original text and positions; glyphs exist only in CSS. */
function decorations(document: Node) {
  const result: Decoration[] = [];
  document.descendants((node, position) => {
    if (node.isText) {
      for (let offset = 0; offset < node.text!.length; offset++) {
        const character = node.text![offset];
        const kind =
          character === ' '
            ? 'space'
            : character === '\t'
              ? 'tab'
              : character === '\u00a0'
                ? 'nbsp'
                : undefined;
        if (kind)
          result.push(
            Decoration.inline(position + offset, position + offset + 1, {
              class: 'zuvi-studio-word-nonprinting-space',
              'data-word-nonprinting': kind,
            })
          );
      }
    } else if (node.type.name === 'hardBreak') {
      result.push(marker(position, 'line-break'));
    } else if (node.type.name === 'paragraph' || node.type.name === 'heading') {
      result.push(marker(position + node.nodeSize - 1, 'paragraph'));
    }
  });
  return DecorationSet.create(document, result);
}

export const WordNonprinting = Extension.create({
  name: 'studioWordNonprinting',
  addProseMirrorPlugins() {
    return [
      new Plugin<NonprintingState>({
        key: nonprintingKey,
        state: {
          init: () => ({ enabled: false, decorations: DecorationSet.empty }),
          apply(transaction, previous) {
            const enabled = transaction.getMeta(nonprintingKey) ?? previous.enabled;
            if (enabled === previous.enabled && !transaction.docChanged) return previous;
            return {
              enabled,
              decorations: enabled ? decorations(transaction.doc) : DecorationSet.empty,
            };
          },
        },
        props: { decorations: (state) => nonprintingKey.getState(state)?.decorations },
      }),
    ];
  },
});

export function wordSetNonprinting(editor: Editor, enabled: boolean) {
  if (editor.isDestroyed || nonprintingKey.getState(editor.state)?.enabled === enabled) return;
  editor.view.dispatch(
    editor.state.tr.setMeta(nonprintingKey, enabled).setMeta('addToHistory', false)
  );
}
