import { Extension, type Editor } from '@tiptap/react';
import { closeHistory } from '@tiptap/pm/history';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Transaction } from '@tiptap/pm/state';
import { wordSelectedParagraphs } from './studio-word-paragraph-layout';
import {
  materializeWordNumbering,
  wordNumberingCatalog,
  wordNumberingLabels,
  wordNodeNumbering,
  type WordNumberingCatalog,
  type StudioWordNumberingRef,
  type StudioWordNumberingDefinition,
} from './studio-word-numbering';
import type { StudioRichNode } from './studio-types';
import {
  wordMeasureNumbering,
  wordNumberingStyle,
  type WordNumberingMeasurement,
} from './studio-word-numbering-layout';
const numberingKey = new PluginKey<WordNumberingMeasurement[]>('studioWordNumberingLayout');

const NORMALIZED = 'studioWordNumberingNormalized';
export function wordSetNumberedContent(editor: Editor, content: StudioRichNode) {
  if (editor.isDestroyed) return false;
  return editor
    .chain()
    .setContent(content, { emitUpdate: false })
    .command(({ tr }) => {
      for (const key of ['numberingDefinitions', 'numberingInstances', 'paragraphStyles'])
        if (key in tr.doc.attrs) tr.setDocAttribute(key, content.attrs?.[key] ?? null);
      tr.setMeta(NORMALIZED, true);
      return true;
    })
    .run();
}
const empty: WordNumberingCatalog = { definitions: [], instances: [] };
const canEdit = (editor: Editor) =>
  !editor.isDestroyed && editor.isEditable && !editor.view.composing;
const related = (definition: StudioWordNumberingDefinition) =>
  definition.levels.some((level, index) =>
    [...level.text.matchAll(/%([1-9])/g)].some((token) => Number(token[1]) !== index + 1)
  );
const fresh = (catalog: WordNumberingCatalog) => {
  const ids = new Set([
    ...catalog.instances.map((entry) => entry.id),
    ...catalog.definitions.map((entry) => entry.id),
  ]);
  let n = 1;
  while (ids.has(`numbering-instance-${n}`)) n++;
  return `numbering-instance-${n}`;
};
function local(doc: import('@tiptap/pm/model').Node, fallback = empty) {
  return wordNumberingCatalog(
    doc.attrs.numberingDefinitions ?? fallback.definitions,
    doc.attrs.numberingInstances ?? fallback.instances
  );
}
export function wordEditorNumbering(editor: Editor) {
  const provider = editor.extensionManager.extensions.find(
    (entry) => entry.name === 'studioWordNumbering'
  )?.options.getCatalog;
  return local(editor.state.doc, typeof provider === 'function' ? provider() : empty);
}
export function wordNumberingContext(editor: Editor) {
  const catalog = wordEditorNumbering(editor),
    paragraphs = wordSelectedParagraphs(editor);
  if (!paragraphs.length) return null;
  const current = paragraphs[0];
  const ref = wordNodeNumbering(current.node.toJSON(), catalog);
  if (!ref) return null;
  const label = wordNumberingLabels(editor.state.doc.toJSON(), catalog).find(
    (entry) => entry.position === current.position
  )!;
  return { ...label, catalog, selectionCount: paragraphs.length };
}
function writeCatalog(tr: Transaction, catalog: WordNumberingCatalog) {
  tr.setDocAttribute(
    'numberingDefinitions',
    catalog.definitions.length ? catalog.definitions : null
  );
  tr.setDocAttribute('numberingInstances', catalog.instances.length ? catalog.instances : null);
}
function validateTransaction(tr: Transaction, catalog: WordNumberingCatalog) {
  wordNumberingLabels(tr.doc.toJSON(), catalog);
  tr.setMeta(NORMALIZED, true);
}
export function wordSetNumberingCatalog(editor: Editor, input: WordNumberingCatalog) {
  if (!canEdit(editor)) return false;
  const catalog = wordNumberingCatalog(input.definitions, input.instances);
  wordNumberingLabels(editor.state.doc.toJSON(), catalog);
  const current = wordEditorNumbering(editor);
  if (JSON.stringify(current) === JSON.stringify(catalog)) return false;
  const tr = closeHistory(editor.state.tr);
  writeCatalog(tr, catalog);
  validateTransaction(tr, catalog);
  editor.view.dispatch(tr);
  editor.commands.focus();
  return true;
}

export function wordApplyNumbering(
  editor: Editor,
  definitionId: string,
  level = 0,
  input?: WordNumberingCatalog
) {
  if (!canEdit(editor)) return false;
  const original = wordEditorNumbering(editor);
  const catalog = input ? wordNumberingCatalog(input.definitions, input.instances) : original;
  const definition = catalog.definitions.find((entry) => entry.id === definitionId);
  if (!definition || !Number.isInteger(level) || level < 0 || level >= definition.levels.length)
    throw new Error('编号定义或层级不存在。');
  const paragraphs = wordSelectedParagraphs(editor);
  if (!paragraphs.length) return false;
  const context = wordNumberingContext(editor);
  const existing =
    context?.definition.id === definitionId
      ? catalog.instances.find((entry) => entry.id === context.ref.instanceId)
      : undefined;
  const instance = existing ?? { id: fresh(catalog), definitionId };
  if (!catalog.instances.some((entry) => entry.id === instance.id))
    catalog.instances.push(instance);
  const tr = closeHistory(editor.state.tr);
  for (const { node, position } of paragraphs) {
    const ref: StudioWordNumberingRef = { instanceId: instance.id, level };
    if (
      node.attrs.numberingDisabled !== true &&
      JSON.stringify(node.attrs.numbering) === JSON.stringify(ref)
    )
      continue;
    tr.setNodeMarkup(position, undefined, {
      ...node.attrs,
      numbering: ref,
      numberingDisabled: false,
    });
  }
  if (!tr.docChanged && JSON.stringify(original) === JSON.stringify(catalog)) return false;
  writeCatalog(tr, catalog);
  validateTransaction(tr, catalog);
  editor.view.dispatch(tr);
  editor.commands.focus();
  return true;
}

export function wordRemoveNumbering(editor: Editor) {
  if (!canEdit(editor)) return false;
  const catalog = wordEditorNumbering(editor),
    tr = closeHistory(editor.state.tr);
  for (const { node, position } of wordSelectedParagraphs(editor)) {
    if (!wordNodeNumbering(node.toJSON(), catalog)) continue;
    tr.setNodeMarkup(position, undefined, {
      ...node.attrs,
      numbering: null,
      numberingDisabled: true,
    });
  }
  if (!tr.docChanged) return false;
  validateTransaction(tr, catalog);
  editor.view.dispatch(tr);
  editor.commands.focus();
  return true;
}
export function wordToggleNumberingPreset(editor: Editor, kind: 'bullet' | 'decimal') {
  if (!canEdit(editor)) return false;
  const context = wordNumberingContext(editor),
    inList = editor.isActive('listItem');
  const removing =
    !!context &&
    (kind === 'bullet' ? context.level.format === 'bullet' : context.level.format !== 'bullet');
  if (!inList && removing) return wordRemoveNumbering(editor);
  const catalog = wordEditorNumbering(editor);
  return editor
    .chain()
    .focus()
    .toggleList(kind === 'bullet' ? 'bulletList' : 'orderedList', 'listItem')
    .command(({ tr }) => {
      if (removing) {
        tr.doc.nodesBetween(tr.selection.from, tr.selection.to, (node, pos) => {
          if (!['paragraph', 'heading'].includes(node.type.name)) return;
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            numbering: null,
            numberingDisabled: true,
          });
          return false;
        });
      } else if (context) {
        let index = 1;
        while (catalog.definitions.some((entry) => entry.id === `numbering-definition-${index}`))
          index++;
        const id = `numbering-definition-${index}`,
          levels = context.definition.levels.map((level) => ({ ...level }));
        levels[context.ref.level].format = kind;
        levels[context.ref.level].text = kind === 'bullet' ? '•' : `%${context.ref.level + 1}.`;
        const prefix = kind === 'bullet' ? '项目符号' : '编号';
        let suffix = index,
          name = `${prefix} ${suffix}`;
        while (catalog.definitions.some((entry) => entry.name === name))
          name = `${prefix} ${++suffix}`;
        catalog.definitions.push({ id, name, levels });
        const previous = catalog.instances.find((entry) => entry.id === context.ref.instanceId)!;
        const instance = { ...previous, id: fresh(catalog), definitionId: id };
        catalog.instances.push(instance);
        tr.doc.descendants((node, pos) => {
          if (!['paragraph', 'heading'].includes(node.type.name)) return;
          const ref = wordNodeNumbering(node.toJSON(), catalog);
          if (ref?.instanceId !== context.ref.instanceId) return;
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            numbering: { ...ref, instanceId: instance.id },
            numberingDisabled: false,
          });
          return false;
        });
        writeCatalog(tr, catalog);
      } else
        tr.doc.nodesBetween(tr.selection.from, tr.selection.to, (node, pos) => {
          if (['paragraph', 'heading'].includes(node.type.name))
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              numbering: null,
              numberingDisabled: false,
            });
        });
      if (context) validateTransaction(tr, catalog);
      return true;
    })
    .run();
}
export function wordChangeNumberingLevel(editor: Editor, delta: -1 | 1) {
  if (!canEdit(editor)) return false;
  const catalog = wordEditorNumbering(editor);
  const plans = wordSelectedParagraphs(editor).map(({ node, position }) => {
    const ref = wordNodeNumbering(node.toJSON(), catalog);
    if (!ref) throw new Error('请先为所选段落设置编号。');
    const instance = catalog.instances.find((entry) => entry.id === ref.instanceId)!;
    const definition = catalog.definitions.find((entry) => entry.id === instance.definitionId)!;
    const level = ref.level + delta;
    if (level < 0 || level >= definition.levels.length)
      throw new Error('所选段落无法移动到该编号层级。');
    return { node, position, ref: { ...ref, level } };
  });
  const tr = closeHistory(editor.state.tr);
  for (const plan of plans)
    tr.setNodeMarkup(plan.position, undefined, {
      ...plan.node.attrs,
      numbering: plan.ref,
      numberingDisabled: false,
    });
  if (!tr.docChanged) return false;
  validateTransaction(tr, catalog);
  editor.view.dispatch(tr);
  editor.commands.focus();
  return true;
}

/** Change the sequence from the current paragraph onward; earlier items keep their identity. */
export function wordRestartNumbering(editor: Editor, start = 1) {
  if (!canEdit(editor)) return false;
  if (!Number.isInteger(start) || start < 1 || start > 100000)
    throw new Error('编号起始值须为 1–100000。');
  const context = wordNumberingContext(editor);
  if (!context) return false;
  const { catalog, ref, position, definition } = context;
  const instance = {
    id: fresh(catalog),
    definitionId: definition.id,
    startOverrides: { [ref.level]: start },
  };
  catalog.instances.push(instance);
  const tr = closeHistory(editor.state.tr);
  let stopped = false;
  editor.state.doc.descendants((node, pos) => {
    if (stopped || pos < position || !['paragraph', 'heading'].includes(node.type.name)) return;
    const current = wordNodeNumbering(node.toJSON(), catalog);
    if (current?.instanceId !== ref.instanceId) return;
    if (!related(definition) && current.level < ref.level) {
      stopped = true;
      return false;
    }
    tr.setNodeMarkup(pos, undefined, {
      ...node.attrs,
      numbering: { ...current, instanceId: instance.id },
      numberingDisabled: false,
    });
    return false;
  });
  writeCatalog(tr, catalog);
  validateTransaction(tr, catalog);
  editor.view.dispatch(tr);
  editor.commands.focus();
  return true;
}
export function wordContinueNumbering(editor: Editor) {
  if (!canEdit(editor)) return false;
  const context = wordNumberingContext(editor);
  if (!context) return false;
  const labels = wordNumberingLabels(editor.state.doc.toJSON(), context.catalog);
  const candidates = labels.filter(
    (entry) =>
      entry.position < context.position &&
      entry.ref.instanceId !== context.ref.instanceId &&
      entry.ref.level === context.ref.level
  );
  const prior =
    context.ref.level > 0
      ? candidates.at(-1)
      : (candidates
          .filter(
            (entry) =>
              entry.level.format === context.level.format &&
              (entry.level.format === 'bullet' || entry.level.text === context.level.text)
          )
          .at(-1) ?? candidates.at(-1));
  if (!prior) return false;
  const tr = closeHistory(editor.state.tr);
  let stopped = false;
  for (const label of labels) {
    if (
      label.position < context.position ||
      label.ref.instanceId !== context.ref.instanceId ||
      stopped
    )
      continue;
    if (!related(context.definition) && label.ref.level < context.ref.level) {
      stopped = true;
      continue;
    }
    const node = tr.doc.nodeAt(label.position)!;
    tr.setNodeMarkup(label.position, undefined, {
      ...node.attrs,
      numbering: { ...label.ref, instanceId: prior.ref.instanceId },
      numberingDisabled: false,
    });
  }
  if (!tr.docChanged) return false;
  validateTransaction(tr, context.catalog);
  editor.view.dispatch(tr);
  editor.commands.focus();
  return true;
}

function numberedDecorations(
  doc: import('@tiptap/pm/model').Node,
  catalog: WordNumberingCatalog,
  measurements: WordNumberingMeasurement[] = []
) {
  const decorations: Decoration[] = [];
  for (const label of wordNumberingLabels(doc.toJSON(), catalog)) {
    const node = doc.nodeAt(label.position)!;
    const css = wordNumberingStyle(node.attrs, label.level, label.ref.level);
    const measured = measurements.find((entry) => entry.position === label.position);
    decorations.push(
      Decoration.node(label.position, label.position + node.nodeSize, {
        'data-word-numbering-label': label.text,
        'data-word-numbering-level': String(label.ref.level),
        'data-word-numbering-instance': label.ref.instanceId,
        'data-word-numbering-position': String(label.position),
        'data-word-numbering-layout': JSON.stringify(label.level),
        style: Object.entries({
          ...css,
          'text-indent': measured?.indent ?? '0pt',
          '--zuvi-numbering-shift': measured?.shift ?? '0%',
        })
          .map(([key, value]) => `${key}:${value}`)
          .join(';'),
      })
    );
  }
  return DecorationSet.create(doc, decorations);
}
export const WordNumbering = Extension.create<{ getCatalog?: () => WordNumberingCatalog }>({
  name: 'studioWordNumbering',
  addOptions: () => ({}),
  addGlobalAttributes() {
    return [
      {
        types: ['doc'],
        attributes: {
          numberingDefinitions: { default: null, rendered: false },
          numberingInstances: { default: null, rendered: false },
        },
      },
      {
        types: ['paragraph', 'heading'],
        attributes: {
          numbering: {
            default: null,
            parseHTML: (element: HTMLElement) => {
              try {
                return JSON.parse(element.dataset.wordNumbering ?? 'null');
              } catch {
                return null;
              }
            },
            renderHTML: (attrs: Record<string, unknown>) =>
              attrs.numbering ? { 'data-word-numbering': JSON.stringify(attrs.numbering) } : {},
          },
          numberingDisabled: {
            default: false,
            parseHTML: (element: HTMLElement) => element.dataset.wordNumberingDisabled === 'true',
            renderHTML: (attrs: Record<string, unknown>) =>
              attrs.numberingDisabled ? { 'data-word-numbering-disabled': 'true' } : {},
          },
        },
      },
      {
        types: ['orderedList', 'bulletList'],
        attributes: {
          numberingInstanceId: {
            default: null,
            parseHTML: (element: HTMLElement) => element.dataset.wordListInstance ?? null,
            renderHTML: (attrs: Record<string, unknown>) =>
              attrs.numberingInstanceId
                ? { 'data-word-list-instance': attrs.numberingInstanceId }
                : {},
          },
        },
      },
    ];
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: numberingKey,
        state: {
          init: () => [] as WordNumberingMeasurement[],
          apply: (tr, old) => tr.getMeta(numberingKey) ?? (tr.docChanged ? [] : old),
        },
        props: {
          decorations: (state) =>
            numberedDecorations(
              state.doc,
              local(state.doc, this.options.getCatalog?.()),
              numberingKey.getState(state)
            ),
        },
        view: (view) => {
          const win = view.dom.ownerDocument.defaultView!;
          let frame = 0,
            disposed = false;
          const schedule = () => {
            if (disposed || frame) return;
            frame = win.requestAnimationFrame(() => {
              frame = 0;
              if (disposed) return;
              const measured = wordMeasureNumbering(view.dom);
              if (JSON.stringify(measured) !== JSON.stringify(numberingKey.getState(view.state)))
                view.dispatch(
                  view.state.tr.setMeta(numberingKey, measured).setMeta('addToHistory', false)
                );
            });
          };
          const resize =
            typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
          resize?.observe(view.dom);
          view.dom.ownerDocument.fonts?.addEventListener('loadingdone', schedule);
          void view.dom.ownerDocument.fonts?.ready.then(schedule);
          schedule();
          return {
            update: (_: unknown, old: import('@tiptap/pm/state').EditorState) => {
              if (old.doc !== view.state.doc) schedule();
            },
            destroy: () => {
              disposed = true;
              win.cancelAnimationFrame(frame);
              resize?.disconnect();
              view.dom.ownerDocument.fonts?.removeEventListener('loadingdone', schedule);
            },
          };
        },
        appendTransaction: (transactions, _, state) => {
          if (
            !transactions.some((tr) => tr.docChanged) ||
            transactions.some((tr) => tr.getMeta(NORMALIZED))
          )
            return null;
          const original = state.doc.toJSON() as StudioRichNode;
          const ready = materializeWordNumbering(original);
          if (JSON.stringify(original) === JSON.stringify(ready)) return null;
          const tr = state.tr;
          const visit = (node: StudioRichNode, position: number) => {
            const current = tr.doc.nodeAt(position);
            if (current && JSON.stringify(current.attrs) !== JSON.stringify(node.attrs ?? {}))
              tr.setNodeMarkup(position, undefined, node.attrs);
            let offset = position + 1;
            for (const child of node.content ?? []) {
              visit(child, offset);
              offset += state.schema.nodeFromJSON(child).nodeSize;
            }
          };
          let offset = 0;
          for (const node of ready.content ?? []) {
            visit(node, offset);
            offset += state.schema.nodeFromJSON(node).nodeSize;
          }
          const catalog = wordNumberingCatalog(
            ready.attrs?.numberingDefinitions,
            ready.attrs?.numberingInstances
          );
          writeCatalog(tr, catalog);
          tr.setMeta(NORMALIZED, true);
          return tr;
        },
      }),
    ];
  },
});
