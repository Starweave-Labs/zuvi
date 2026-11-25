import { Extension, type Editor } from '@tiptap/react';
import { closeHistory } from '@tiptap/pm/history';
import type { StudioWordParagraphFormat } from './studio-types';
import {
  WORD_PARAGRAPH_KEYS,
  wordParagraphFormatIssue,
  wordParagraphLineCss,
  wordParagraphNumber,
} from './studio-word-paragraph-format';
import {
  getStudioWordParagraphStyles,
  resolveStudioWordParagraphStyle,
  studioWordNodeStyleId,
} from './studio-word-styles';
import type { StudioRichNode } from './studio-types';

const PARAGRAPH_LAYOUT = {
  indentLeft: 'margin-left',
  indentRight: 'margin-right',
  indentFirstLine: 'text-indent',
  spaceBefore: 'margin-top',
  spaceAfter: 'margin-bottom',
} as const;

export const WordParagraphLayout = Extension.create({
  name: 'studioParagraphLayout',
  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          ...Object.fromEntries(
            Object.entries(PARAGRAPH_LAYOUT).map(([key, css]) => [
              key,
              {
                default: null,
                parseHTML: (element: HTMLElement) => {
                  const raw = element.style.getPropertyValue(css);
                  const parsed = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+))(pt|px)$/.exec(raw);
                  return parsed
                    ? wordParagraphNumber(Number(parsed[1]) * (parsed[2] === 'px' ? 0.75 : 1), key)
                    : null;
                },
                renderHTML: (attributes: Record<string, unknown>) =>
                  typeof attributes[key] === 'number' && Number.isFinite(attributes[key])
                    ? { style: `${css}: ${attributes[key]}pt` }
                    : {},
              },
            ])
          ),
          lineHeight: {
            default: null,
            parseHTML: (element: HTMLElement) => {
              const rule = element.getAttribute('data-word-line-rule');
              const raw =
                rule === 'atLeast'
                  ? element.style.getPropertyValue('--zuvi-word-min-line')
                  : element.style.lineHeight;
              const measured = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+))(pt|px)$/.exec(raw);
              return measured
                ? wordParagraphNumber(
                    Number(measured[1]) * (measured[2] === 'px' ? 0.75 : 1),
                    'lineHeight',
                    rule === 'atLeast' ? 'atLeast' : 'exact'
                  )
                : wordParagraphNumber(raw, 'lineHeight');
            },
            renderHTML: (attributes: Record<string, unknown>) => {
              const css = wordParagraphLineCss(attributes);
              return Object.keys(css).length
                ? {
                    style: Object.entries(css)
                      .map(
                        ([key, value]) =>
                          `${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}:${value}`
                      )
                      .join(';'),
                  }
                : {};
            },
          },
          lineHeightRule: {
            default: null,
            parseHTML: (element: HTMLElement) =>
              element.getAttribute('data-word-line-rule') ||
              (/(?:pt|px)$/.test(element.style.lineHeight)
                ? 'exact'
                : element.style.lineHeight
                  ? 'auto'
                  : null),
            renderHTML: (attrs: Record<string, unknown>) =>
              ['auto', 'exact', 'atLeast'].includes(String(attrs.lineHeightRule))
                ? { 'data-word-line-rule': attrs.lineHeightRule }
                : {},
          },
          lineHeightBasis: { default: null, rendered: false },
          paragraphStyleDirectAttrs: {
            default: null,
            parseHTML: (element: HTMLElement) => {
              const encoded = element.getAttribute('data-word-paragraph-direct');
              if (encoded) {
                try {
                  const value = JSON.parse(encoded);
                  if (
                    Array.isArray(value) &&
                    value.every((key) => (WORD_PARAGRAPH_KEYS as readonly string[]).includes(key))
                  )
                    return value;
                } catch {
                  /* Use visible CSS for other pasted documents. */
                }
              }
              return [
                ...Object.entries(PARAGRAPH_LAYOUT)
                  .filter(([, css]) => element.style.getPropertyValue(css))
                  .map(([key]) => key),
                ...(element.style.textAlign ? ['textAlign'] : []),
                ...(element.style.lineHeight ? ['lineHeight', 'lineHeightRule'] : []),
              ];
            },
            renderHTML: (attrs: Record<string, unknown>) =>
              Array.isArray(attrs.paragraphStyleDirectAttrs)
                ? { 'data-word-paragraph-direct': JSON.stringify(attrs.paragraphStyleDirectAttrs) }
                : {},
          },
        },
      },
      {
        types: ['tableCell', 'tableHeader'],
        attributes: {
          backgroundColor: {
            default: null,
            renderHTML: (attributes: Record<string, unknown>) =>
              typeof attributes.backgroundColor === 'string' &&
              /^#[\da-f]{6}$/i.test(attributes.backgroundColor)
                ? { style: `background-color: ${attributes.backgroundColor}` }
                : {},
          },
        },
      },
    ];
  },
});

export function wordEditorParagraphStyles(editor: Editor) {
  const provider = editor.extensionManager.extensions.find(
    (extension) => extension.name === 'studioWordParagraphStyles'
  )?.options.getStyles;
  return typeof provider === 'function'
    ? provider()
    : getStudioWordParagraphStyles(editor.state.doc.toJSON() as StudioRichNode);
}

export function effectiveParagraph(editor: Editor, node: import('@tiptap/pm/model').Node) {
  const base = resolveStudioWordParagraphStyle(
    wordEditorParagraphStyles(editor),
    studioWordNodeStyleId(node.toJSON() as StudioRichNode)
  ).paragraph;
  return Object.fromEntries(
    WORD_PARAGRAPH_KEYS.map((key) => [key, node.attrs[key] ?? base[key]])
  ) as Required<StudioWordParagraphFormat>;
}

export function wordSelectedParagraphs(editor: Editor) {
  const result: { position: number; node: import('@tiptap/pm/model').Node }[] = [];
  const { from, to } = editor.state.selection;
  editor.state.doc.nodesBetween(from, to, (node, position) => {
    if (node.type.name === 'paragraph' || node.type.name === 'heading') {
      result.push({ position, node });
      return false;
    }
  });
  return result;
}

export function wordSelectionParagraphFormat(editor: Editor) {
  const paragraphs = wordSelectedParagraphs(editor);
  const formats = paragraphs.map(({ node }) => effectiveParagraph(editor, node));
  return Object.fromEntries(
    WORD_PARAGRAPH_KEYS.map((key) => {
      const values = new Set(formats.map((format) => format[key]));
      return [key, values.size > 1 ? null : (values.values().next().value ?? null)];
    })
  ) as Record<(typeof WORD_PARAGRAPH_KEYS)[number], string | number | null>;
}

export function wordSetParagraphFormat(
  editor: Editor,
  patch:
    | Partial<StudioWordParagraphFormat>
    | ((current: Required<StudioWordParagraphFormat>) => Partial<StudioWordParagraphFormat>)
) {
  if (
    editor.isDestroyed ||
    !editor.isEditable ||
    (typeof patch !== 'function' && !Object.keys(patch).length)
  )
    return false;
  const paragraphs = wordSelectedParagraphs(editor);
  const plans = paragraphs.map(({ node, position }) => {
    const base = effectiveParagraph(editor, node);
    const input = typeof patch === 'function' ? patch(base) : patch;
    const update = {
      ...input,
      ...(input.lineHeightRule !== undefined && input.lineHeight === undefined
        ? { lineHeight: base.lineHeight }
        : {}),
      ...('lineHeight' in input || 'lineHeightRule' in input
        ? {
            lineHeightRule: input.lineHeightRule ?? base.lineHeightRule,
            lineHeightBasis:
              (input.lineHeightRule ?? base.lineHeightRule) === 'auto'
                ? ('auto' as const)
                : ('points' as const),
          }
        : {}),
    };
    const issue = wordParagraphFormatIssue(update, base);
    if (issue) throw new Error(issue);
    const style = resolveStudioWordParagraphStyle(
      wordEditorParagraphStyles(editor),
      studioWordNodeStyleId(node.toJSON() as StudioRichNode)
    );
    const old = Array.isArray(node.attrs.paragraphStyleDirectAttrs)
      ? node.attrs.paragraphStyleDirectAttrs
      : WORD_PARAGRAPH_KEYS.filter(
          (key) =>
            key !== 'lineHeightBasis' &&
            node.attrs[key] != null &&
            node.attrs[key] !== style.paragraph[key]
        );
    const direct = style.autoUpdate
      ? []
      : [...new Set([...old, ...Object.keys(update).filter((key) => key !== 'lineHeightBasis')])];
    return { node, position, update, direct };
  });
  const tr = closeHistory(editor.state.tr);
  for (const { position, node, update, direct } of plans) {
    if (
      !Object.keys(update).length ||
      (Object.entries(update).every(([key, value]) => node.attrs[key] === value) &&
        JSON.stringify(node.attrs.paragraphStyleDirectAttrs) === JSON.stringify(direct))
    )
      continue;
    tr.setNodeMarkup(position, undefined, {
      ...node.attrs,
      ...update,
      paragraphStyleDirectAttrs: direct,
    });
  }
  if (!tr.docChanged) return false;
  editor.view.dispatch(tr);
  editor.commands.focus();
  return true;
}
