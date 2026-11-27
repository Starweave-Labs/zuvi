import { Extension, type Editor } from '@tiptap/react';
import { closeHistory } from '@tiptap/pm/history';
import { wordMetricPoints, wordMetricCss, type WordMetric } from './studio-word-metrics';

const metrics: WordMetric[] = ['letterSpacing', 'baselineShift'];
export const WordCharacterLayout = Extension.create({
  name: 'studioWordCharacterLayout',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: Object.fromEntries(
          metrics.map((metric) => [
            metric,
            {
              default: null,
              parseHTML: (element: HTMLElement) => {
                const top = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+))pt$/.exec(element.style.top);
                const raw =
                  element.getAttribute(`data-word-${metric}`) ??
                  (metric === 'letterSpacing'
                    ? element.style.letterSpacing
                    : element.style.position === 'relative' && top
                      ? `${-Number(top[1])}pt`
                      : element.style.verticalAlign === 'baseline'
                        ? '0pt'
                        : element.style.verticalAlign);
                const value = wordMetricPoints(raw, metric);
                return value === null ? null : `${value}pt`;
              },
              renderHTML: (attrs: Record<string, unknown>) => {
                const value = wordMetricPoints(attrs[metric], metric);
                if (value === null) return {};
                return {
                  [`data-word-${metric}`]: `${value}pt`,
                  style: Object.entries(wordMetricCss({ [metric]: value }))
                    .map(
                      ([key, css]) =>
                        `${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}:${css}`
                    )
                    .join(';'),
                };
              },
            },
          ])
        ),
      },
    ];
  },
});

export function wordSelectionMetrics(editor: Editor) {
  const values: Record<WordMetric, Set<number>> = {
    letterSpacing: new Set(),
    baselineShift: new Set(),
  };
  const collect = (attrs: Record<string, unknown>) =>
    metrics.forEach((metric) => values[metric].add(wordMetricPoints(attrs[metric], metric) ?? 0));
  const { from, to, empty } = editor.state.selection;
  if (empty) collect(editor.getAttributes('textStyle'));
  else
    editor.state.doc.nodesBetween(from, to, (node) => {
      if (node.isText || node.type.name === 'pageNumber')
        collect(node.marks.find((mark) => mark.type.name === 'textStyle')?.attrs ?? {});
    });
  return Object.fromEntries(
    metrics.map((metric) => [
      metric,
      values[metric].size > 1 ? null : (values[metric].values().next().value ?? 0),
    ])
  ) as Record<WordMetric, number | null>;
}

/** Apply each run independently so mixed typography and hyperlinks remain intact. */
export function wordSetCharacterLayout(
  editor: Editor,
  values: Partial<Record<WordMetric, number>>
) {
  if (!editor.isEditable || editor.isDestroyed) return false;
  const entries = (Object.entries(values) as [WordMetric, number][]).map(
    ([key, value]): [WordMetric, number] => {
      if (!metrics.includes(key) || typeof value !== 'number')
        throw new Error('字符度量格式无效。');
      const parsed = wordMetricPoints(value, key);
      if (parsed === null)
        throw new Error('字符间距/位置须在 ±500pt 以内；间距按 0.05pt、位置按 0.5pt 输入。');
      return [key, parsed];
    }
  );
  if (!entries.length) return false;
  const type = editor.schema.marks.textStyle;
  const { from, to, empty } = editor.state.selection;
  const tr = closeHistory(editor.state.tr);
  const apply = (
    marks: readonly import('@tiptap/pm/model').Mark[],
    start?: number,
    end?: number
  ) => {
    const previous = marks.find((mark) => mark.type === type);
    const attrs = {
      ...previous?.attrs,
      ...Object.fromEntries(entries.map(([key, value]) => [key, `${value}pt`])),
    };
    const next = type.create(attrs);
    if (previous?.eq(next)) return;
    if (start === undefined || end === undefined)
      tr.setStoredMarks([...marks.filter((mark) => mark.type !== type), next]);
    else {
      tr.removeMark(start, end, type);
      tr.addMark(start, end, next);
    }
  };
  if (empty) apply(editor.state.storedMarks ?? editor.state.selection.$from.marks());
  else
    editor.state.doc.nodesBetween(from, to, (node, pos) => {
      if (node.isText || node.type.name === 'pageNumber')
        apply(node.marks, Math.max(from, pos), Math.min(to, pos + node.nodeSize));
    });
  if (!tr.docChanged && !tr.storedMarksSet) return false;
  editor.view.dispatch(tr);
  editor.commands.focus();
  return true;
}
