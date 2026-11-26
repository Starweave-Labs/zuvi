import { wordCellProperties, wordCellPropertiesCss } from './studio-word-cell-properties';
import { getRenderedAttributes, mergeAttributes } from '@tiptap/react';
import { TableCell, TableHeader } from '@tiptap/extension-table';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import type { NodeView, ViewMutationRecord } from '@tiptap/pm/view';

// Every cell owns these variables. Otherwise outer-cell formatting leaks into nested tables.
const baseStyle = ['top', 'right', 'bottom', 'left'].map(side => {
  const fallback = side === 'top' || side === 'bottom' ? '0pt' : '5.4pt';
  return `--zuvi-word-cell-margin-${side}:var(--zuvi-word-table-margin-${side},${fallback});padding-${side}:var(--zuvi-word-cell-margin-${side})`;
}).join(';') + ';--zuvi-word-cell-justify:flex-start;--zuvi-word-cell-background:transparent';
const cellAttributes = {
  backgroundColor: {
    default: null,
    parseHTML: (element: HTMLElement) => element.getAttribute('data-word-cell-background') || null,
    renderHTML: (attrs: Record<string, unknown>) => typeof attrs.backgroundColor === 'string' && /^#[0-9a-f]{6}$/i.test(attrs.backgroundColor) ? {
      'data-word-cell-background': attrs.backgroundColor,
      style: `background-color:${attrs.backgroundColor};--zuvi-word-cell-background:${attrs.backgroundColor}`,
    } : {},
  },
  verticalAlign: {
    default: null,
    parseHTML: (element: HTMLElement) => ({ middle: 'center', top: 'top', bottom: 'bottom' } as Record<string, string>)[element.style.verticalAlign] || null,
    renderHTML: (attrs: Record<string, unknown>) => attrs.verticalAlign ? {
      style: `vertical-align:${wordCellPropertiesCss(attrs).verticalAlign};--zuvi-word-cell-justify:${attrs.verticalAlign === 'center' ? 'safe center' : attrs.verticalAlign === 'bottom' ? 'safe flex-end' : 'flex-start'}`,
    } : {},
  },
  cellMargins: {
    default: null,
    parseHTML: (element: HTMLElement) => {
      const raw = element.getAttribute('data-word-cell-margins');
      if (!raw) return null;
      try { return wordCellProperties({ cellMargins: JSON.parse(raw) }).cellMargins; } catch { return null; }
    },
    renderHTML: (attrs: Record<string, unknown>) => attrs.cellMargins ? {
      'data-word-cell-margins': JSON.stringify(wordCellProperties(attrs).cellMargins),
      style: Object.entries(wordCellPropertiesCss({ cellMargins: attrs.cellMargins })).map(([key, value]) => `${key}:${value};--zuvi-word-cell-margin-${key.slice(8)}:${value}`).join(';'),
    } : {},
  },
};

/** The wrapper owns view-only fill sizes; document formatting remains on the cell. */
export function wordTableCellNodeView(
  node: ProseMirrorNode,
  tag: 'td' | 'th',
  renderAttributes: (current: ProseMirrorNode) => Record<string, unknown>
): NodeView {
  const dom = document.createElement(tag);
  const contentDOM = dom.appendChild(document.createElement('div'));
  contentDOM.setAttribute('data-word-cell-content', '');
  let current = node;
  let destroyed = false;
  let ownedAttributes = new Map<string, string>();
  let ownedClasses = new Set<string>();
  let ownedStyles = new Map<string, { value: string; priority: string }>();
  const apply = (attrs: Record<string, unknown>) => {
    const nextAttributes = new Map(Object.entries(attrs)
      .filter(([name, value]) => name !== 'style' && name !== 'class' && value != null)
      .map(([name, value]) => [name, String(value)]));
    for (const [name, previous] of ownedAttributes)
      if (!nextAttributes.has(name) && dom.getAttribute(name) === previous) dom.removeAttribute(name);
    for (const [name, value] of nextAttributes) dom.setAttribute(name, value);
    const nextClasses = new Set(String(attrs.class ?? '').split(/\s+/).filter(Boolean));
    for (const name of ownedClasses) if (!nextClasses.has(name)) dom.classList.remove(name);
    for (const name of nextClasses) dom.classList.add(name);
    const parsed = document.createElement('div').style;
    parsed.cssText = String(attrs.style ?? '');
    const nextStyles = new Map<string, { value: string; priority: string }>();
    for (let index = 0; index < parsed.length; index++) {
      const name = parsed.item(index);
      nextStyles.set(name, { value: parsed.getPropertyValue(name), priority: parsed.getPropertyPriority(name) });
    }
    for (const [name, previous] of ownedStyles)
      if (!nextStyles.has(name) && dom.style.getPropertyValue(name) === previous.value &&
        dom.style.getPropertyPriority(name) === previous.priority) dom.style.removeProperty(name);
    for (const [name, value] of nextStyles) dom.style.setProperty(name, value.value, value.priority);
    ownedAttributes = nextAttributes;
    ownedClasses = nextClasses;
    ownedStyles = nextStyles;
  };
  apply(renderAttributes(node));
  return {
    dom,
    contentDOM,
    update(next) {
      if (destroyed || next.type !== current.type) return false;
      apply(renderAttributes(next));
      current = next;
      return true;
    },
    ignoreMutation(mutation: ViewMutationRecord) {
      return mutation.type === 'attributes' && mutation.attributeName === 'style' &&
        mutation.target === contentDOM;
    },
    destroy() {
      destroyed = true;
      ownedAttributes.clear();
      ownedClasses.clear();
      ownedStyles.clear();
    },
  };
}

export const WordTableCell = TableCell.extend({
  addAttributes() { return { ...this.parent?.(), ...cellAttributes }; },
  renderHTML({ HTMLAttributes }) {
    return ['td', mergeAttributes({ style: baseStyle }, this.options.HTMLAttributes, HTMLAttributes), ['div', { 'data-word-cell-content': '' }, 0]];
  },
  addNodeView() {
    return ({ node }) => wordTableCellNodeView(node, 'td', current =>
      mergeAttributes({ style: baseStyle }, this.options.HTMLAttributes,
        getRenderedAttributes(current, this.editor.extensionManager.attributes)));
  },
});
export const WordTableHeader = TableHeader.extend({
  addAttributes() { return { ...this.parent?.(), ...cellAttributes }; },
  renderHTML({ HTMLAttributes }) {
    return ['th', mergeAttributes({ style: `${baseStyle};--zuvi-word-cell-background:color-mix(in srgb, var(--zuvi-studio-word-ink) 6%, var(--zuvi-studio-word-paper-bg))` }, this.options.HTMLAttributes, HTMLAttributes), ['div', { 'data-word-cell-content': '' }, 0]];
  },
  addNodeView() {
    const header = `${baseStyle};--zuvi-word-cell-background:color-mix(in srgb, var(--zuvi-studio-word-ink) 6%, var(--zuvi-studio-word-paper-bg))`;
    return ({ node }) => wordTableCellNodeView(node, 'th', current =>
      mergeAttributes({ style: header }, this.options.HTMLAttributes,
        getRenderedAttributes(current, this.editor.extensionManager.attributes)));
  },
});
