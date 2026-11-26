import { Node, type Editor } from '@tiptap/react';
import { NodeSelection } from '@tiptap/pm/state';
import type { DOMOutputSpec } from '@tiptap/pm/model';
import type { WordMathNode } from './studio-word-math';
import { closeHistory } from '@tiptap/pm/history';
import { wordMathTree, wordMathText, wordMathMarkup, wordMathFormatCss } from './studio-word-math';
const empty = { kind: 'text', text: 'x' };
export const WordMath = Node.create({
  name: 'mathEquation',
  group: 'inline',
  inline: true,
  atom: true,
  addAttributes: () => ({ equation: { default: empty, rendered: false } }),
  renderText: ({ node }) => wordMathText(node.attrs.equation),
  parseHTML: () => [
    {
      tag: 'span[data-word-math]',
      getAttrs: (element) => {
        try {
          return {
            equation: wordMathTree(JSON.parse((element as HTMLElement).dataset.wordMath || 'null')),
          };
        } catch {
          return false;
        }
      },
    },
  ],
  renderHTML: ({ node }) => {
    const tree = wordMathTree(node.attrs.equation);
    const spec = (value: WordMathNode): DOMOutputSpec => {
      const element = (tag: string, ...children: (DOMOutputSpec | string)[]): DOMOutputSpec =>
        [`http://www.w3.org/1998/Math/MathML ${tag}`, {}, ...children];
      switch (value.kind) {
        case 'text': return ['http://www.w3.org/1998/Math/MathML mtext', value.format ? { style: wordMathFormatCss(value.format) } : {}, value.text];
        case 'display': return spec(value.body);
        case 'row': return element('mrow', ...value.children.map(spec));
        case 'fraction': return element('mfrac', spec(value.numerator), spec(value.denominator));
        case 'script': return value.sub && value.sup
          ? element('msubsup', spec(value.base), spec(value.sub), spec(value.sup))
          : element(value.sub ? 'msub' : 'msup', spec(value.base), spec((value.sub || value.sup)!));
        case 'radical': return value.degree
          ? element('mroot', spec(value.body), spec(value.degree))
          : element('msqrt', spec(value.body));
        case 'matrix': return element('mtable', ...value.rows.map(row => element('mtr', ...row.map(cell => element('mtd', spec(cell))))));
        case 'delimiter': return element('mrow',
          ['http://www.w3.org/1998/Math/MathML mo', { stretchy: 'true' }, value.left],
          spec(value.body),
          ['http://www.w3.org/1998/Math/MathML mo', { stretchy: 'true' }, value.right]);
      }
    };
    return ['span', {
      'data-word-math': JSON.stringify(tree), contenteditable: 'false',
      role: 'math', 'aria-label': wordMathText(tree),
    }, ['http://www.w3.org/1998/Math/MathML math', tree.kind === 'display' ? { display: 'block', style: `display:flex;justify-content:${tree.align === 'left' ? 'flex-start' : tree.align === 'right' ? 'flex-end' : 'center'};` } : {}, spec(tree)]];
  },
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('span');
      const render = (value: unknown) => {
        const tree = wordMathTree(value);
        dom.dataset.wordMath = JSON.stringify(tree);
        dom.contentEditable = 'false';
        dom.setAttribute('role', 'math');
        dom.setAttribute('aria-label', wordMathText(tree));
        dom.innerHTML = wordMathMarkup(tree);
      };
      render(node.attrs.equation);
      return {
        dom,
        update(next) {
          if (next.type !== node.type) return false;
          render(next.attrs.equation);
          return true;
        },
        ignoreMutation: () => true,
      };
    };
  },
});
export function wordSetMath(editor: Editor, input: unknown): boolean {
  if (editor.isDestroyed || !editor.isEditable || editor.view.composing) return false;
  const tree = wordMathTree(input),
    { selection } = editor.state;
  const editing = selection instanceof NodeSelection && selection.node.type.name === 'mathEquation';
  if (!selection.empty && !editing) throw new Error('请将光标放在正文中，或选择一个数学公式。');
  if (!selection.$from.parent.inlineContent) throw new Error('当前位置无法插入数学公式。');
  if (editing && JSON.stringify(selection.node.attrs.equation) === JSON.stringify(tree))
    return false;
  const transaction = closeHistory(editor.state.tr);
  if (editing)
    transaction.setNodeMarkup(
      selection.from,
      undefined,
      { ...selection.node.attrs, equation: tree },
      selection.node.marks
    );
  else
    transaction.insert(
      selection.from,
      editor.schema.nodes.mathEquation.create(
        { equation: tree },
        null,
        editor.state.storedMarks || selection.$from.marks()
      )
    );
  transaction.setSelection(NodeSelection.create(transaction.doc, selection.from));
  editor.view.dispatch(transaction.scrollIntoView());
  return true;
}
