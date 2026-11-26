import { expect, it } from 'vitest';
import { wordMathTree, wordMathText, wordMathMarkup, type WordMathNode } from './studio-word-math';
const text = (value: string): WordMathNode => ({ kind: 'text', text: value });
it('preserves nested fractions, simultaneous scripts, indexed roots and rectangular matrices', () => {
  const tree: WordMathNode = {
    kind: 'row',
    children: [
      {
        kind: 'fraction',
        numerator: { kind: 'script', base: text('x'), sub: text('i'), sup: text('2') },
        denominator: { kind: 'radical', body: text('y'), degree: text('3') },
      },
      {
        kind: 'delimiter',
        left: '[',
        right: ']',
        body: {
          kind: 'matrix',
          rows: [
            [text('1'), text('2')],
            [text('3'), text('4')],
          ],
        },
      },
    ],
  };
  expect(wordMathTree(tree)).toEqual(tree);
  expect(wordMathText(tree)).toBe('(x_(i)^(2))/(root[3](y))[[1, 2; 3, 4]]');
  expect(wordMathMarkup(tree)).toContain('<msubsup>');
  expect(wordMathMarkup(tree)).toContain('<mroot>');
  expect(wordMathMarkup(tree).match(/<mtd>/g)).toHaveLength(4);
});
it('escapes equation text and rejects malformed, cyclic, huge or ragged structures', () => {
  expect(wordMathMarkup(text('<&'))).toContain('&lt;&amp;');
  expect(() => wordMathTree({ kind: 'matrix', rows: [[text('1')], []] })).toThrow('相同');
  expect(() => wordMathTree({ kind: 'script', base: text('x') })).toThrow('至少');
  expect(() => wordMathTree({ kind: 'text', text: 'x', html: '<script>' })).toThrow('属性');
  const cycle = { kind: 'row', children: [] as unknown[] };
  cycle.children.push(cycle);
  expect(() => wordMathTree(cycle)).toThrow('循环');
  expect(() => wordMathTree(text('x'.repeat(20001)))).toThrow('过长');
  let deep: WordMathNode = text('x');
  for (let i = 0; i < 34; i++) deep = { kind: 'radical', body: deep };
  expect(() => wordMathTree(deep)).toThrow('复杂');
});

it('preserves explicit local text formats and rejects unsupported or invalid format values', () => {
  const node = { kind: 'text', text: '<x>', format: { bold: false, italic: true, underline: true, strike: true } };
  expect(wordMathTree(node)).toEqual(node);
  expect(wordMathMarkup(node)).toContain('font-weight:normal;font-style:italic;text-decoration:underline line-through;');
  expect(wordMathMarkup(node)).toContain('&lt;x&gt;');
  expect(() => wordMathTree({ ...node, format: { bold: 'yes' } })).toThrow('格式');
  expect(() => wordMathTree({ ...node, format: { custom: true } })).toThrow('格式');
});

it('validates and escapes native typography with half-point sizes and signed native metric precision', () => {
  const node = { kind: 'text', text: 'x', format: { fontFamily: 'Cambria Math', fontSize: '14.5pt', color: '#AA2244', backgroundColor: '#eeeeff', letterSpacing: '-0.05pt', baselineShift: '1.5pt', script: 'superscript' } };
  expect(wordMathTree(node)).toEqual({ ...node, format: { ...node.format, color: '#aa2244' } });
  expect(wordMathMarkup(node)).toContain('font-family:&quot;Cambria Math&quot;');
  expect(wordMathMarkup(node)).toContain('top:-1.5pt;');
  for (const format of [{ fontFamily: 'bad;color:red' }, { color: 'red' }, { fontSize: '1.25pt' }, { letterSpacing: '0.01pt' }, { baselineShift: '0.1pt' }, { script: 'bad' }])
    expect(() => wordMathTree({ ...node, format })).toThrow();
});

it('preserves root display formulas and rejects nested display or invalid alignment', () => {
  const tree = { kind: 'display', align: 'right', body: text('x') };
  expect(wordMathTree(tree)).toEqual(tree);
  expect(wordMathText(tree)).toBe('x');
  expect(wordMathMarkup(tree)).toContain('display="block"');
  expect(wordMathMarkup(tree)).toContain('justify-content:flex-end');
  expect(() => wordMathTree({ kind: 'radical', body: tree })).toThrow('根节点');
  expect(() => wordMathTree({ ...tree, align: 'bad' })).toThrow('对齐');
});

it('rejects non-XML characters and malformed surrogate text without rejecting full Unicode symbols', () => {
  for (const value of ['\u0000', '\ud800', '\udfff', '\ufffe', '\uffff']) {
    expect(() => wordMathTree(text(value))).toThrow('文字');
    expect(() => wordMathTree({ kind: 'delimiter', left: value, right: ')', body: text('x') })).toThrow('括号');
  }
  expect(wordMathTree(text('😀\t\n\r'))).toEqual(text('😀\t\n\r'));
});
