import { expect, it } from 'vitest';
import {
  wordCalculateTableFormula,
  WordFormulaError,
  type WordFormulaTable,
} from './studio-word-table-formula';
const table: WordFormulaTable = [
  [{ text: 'Heading' }, { text: '2' }, { text: '4' }],
  [{ text: '3' }, { text: '5' }, { text: '' }],
  [{ text: '7' }, { text: '' }, { text: '9' }],
];
it('calculates arithmetic, precedence, signed exponents, percentages and explicit references', () => {
  const calc = (formula: string) => wordCalculateTableFormula(table, 2, 1, formula);
  expect(calc('= B1 + C1 * 2')).toBe(10);
  expect(calc('=(B1+C1)/3')).toBe(2);
  expect(calc('=-2^2')).toBe(-4);
  expect(calc('=2^-2')).toBe(0.25);
  expect(calc('=2^3^2')).toBe(512);
  expect(calc('=50% * 8')).toBe(4);
  expect(calc('=1e-2 + .5')).toBe(0.51);
});
it('calculates all four SUM directions with numeric runs and ignores leading headings', () => {
  expect(wordCalculateTableFormula(table, 2, 1, '=SUM(ABOVE)')).toBe(7);
  expect(wordCalculateTableFormula(table, 1, 2, '=SUM(LEFT)')).toBe(8);
  expect(wordCalculateTableFormula(table, 0, 0, '=SUM(RIGHT)')).toBe(6);
  expect(wordCalculateTableFormula(table, 0, 0, '=SUM(BELOW)')).toBe(10);
  expect(wordCalculateTableFormula(table, 2, 0, '=SUM(ABOVE)')).toBe(3);
  const interrupted = [[{ text: '8' }], [{ text: '' }], [{ text: '2' }], [{ text: '' }]];
  expect(wordCalculateTableFormula(interrupted, 3, 0, '=SUM(ABOVE)')).toBe(2);
});
it('expands rectangular and reversed ranges without evaluating nonnumeric labels', () => {
  expect(wordCalculateTableFormula(table, 2, 1, '=SUM(A1:C2)')).toBe(14);
  expect(wordCalculateTableFormula(table, 2, 1, '=SUM(C2:A1, 6)')).toBe(20);
  expect(wordCalculateTableFormula(table, 2, 1, '=COUNT(A1:C2)')).toBe(4);
  expect(wordCalculateTableFormula(table, 2, 1, '=AVERAGE(B1:C1)')).toBe(3);
  expect(wordCalculateTableFormula(table, 2, 1, '=PRODUCT(B1:C1)')).toBe(8);
  expect(wordCalculateTableFormula(table, 2, 1, '=ROUND(ABS(-1.234),2)')).toBe(1.23);
});
it('refreshes dependent formula fields from their source instead of stale result text', () => {
  const cells: WordFormulaTable = [
    [
      { text: '2' },
      { text: '99', formula: '=A1*3' },
      { text: 'stale', formula: '=B1+1' },
      { text: '' },
    ],
  ];
  expect(wordCalculateTableFormula(cells, 0, 3, '=SUM(LEFT)')).toBe(15);
  expect(wordCalculateTableFormula(cells, 0, 3, '=C1')).toBe(7);
  expect(cells[0][1].text).toBe('99');
});
it('rejects direct, indirect and range cycles without mutating the input', () => {
  const cells: WordFormulaTable = [
    [
      { text: 'cached', formula: '=B1' },
      { text: 'cached', formula: '=A1' },
    ],
  ];
  for (const formula of ['=A1', '=B1', '=SUM(A1:B1)']) {
    expect(() => wordCalculateTableFormula(cells, 0, 0, formula)).toThrow('循环引用');
  }
  expect(cells[0][0].text).toBe('cached');
});
it('rejects out of range references, malformed expressions and nonfinite results', () => {
  for (const formula of [
    '=A0',
    '=D1',
    '=ZZ999',
    '=A1:D1',
    '=SUM(',
    '=1+',
    '=1 2',
    '=SUM(A1);alert(1)',
    '=UNKNOWN(2)',
    '=ABOVE',
    '=SUM(A1:B1)+1/0',
  ]) {
    expect(() => wordCalculateTableFormula(table, 2, 1, formula)).toThrow(WordFormulaError);
  }
  expect(() => wordCalculateTableFormula(table, 2, 1, '=1/0')).toThrow('除以零');
  expect(() => wordCalculateTableFormula(table, 2, 1, '=10^999')).toThrow('计算范围');
  expect(() =>
    wordCalculateTableFormula(table, 2, 1, '=' + '('.repeat(101) + '1' + ')'.repeat(101))
  ).toThrow('计算范围');
});
it('addresses columns beyond Z and rejects missing cells in ragged tables', () => {
  const wide = [Array.from({ length: 28 }, (_, i) => ({ text: String(i + 1) }))];
  expect(wordCalculateTableFormula(wide, 0, 0, '=AA1+AB1')).toBe(55);
  expect(() =>
    wordCalculateTableFormula(
      [[{ text: '1' }, { text: '2' }], [{ text: '3' }]],
      0,
      0,
      '=SUM(B1:B2)'
    )
  ).toThrow('引用超出');
});

it('bounds unary and power recursion before exhausting the JavaScript stack', () => {
  for (const formula of ['=' + '-'.repeat(101) + '1', '=' + '1^'.repeat(101) + '1']) {
    expect(() => wordCalculateTableFormula(table, 2, 1, formula)).toThrow('计算范围');
  }
});

it('calculates native numeric-picture instructions without using formatted dependency caches', async () => {
  const { wordFormatFormulaResult } = await import('./studio-word-table-formula');
  const cells = [
    [{ text: '1234.5' }, { text: 'stale', formula: '=A1*2 \\# "#,##0.00"' }, { text: '' }],
  ];
  expect(wordCalculateTableFormula(cells, 0, 2, '=B1+1')).toBe(2470);
  expect(wordFormatFormulaResult(2469, '=A1*2 \\# "#,##0.00"')).toBe('2,469.00');
  expect(wordFormatFormulaResult(0.125, '=1/8 \\# "0.0%"')).toBe('12.5%');
  expect(wordFormatFormulaResult(-1234.5, '=A1 \\# "#,##0.00" \\* MERGEFORMAT')).toBe('-1,234.50');
  expect(() => wordCalculateTableFormula(cells, 0, 2, '=A1 \\# "unsupported"')).toThrow('语法');
});
