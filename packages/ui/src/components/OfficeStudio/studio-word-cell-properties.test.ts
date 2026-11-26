import { expect, it } from 'vitest';
import { wordCellProperties, wordCellPropertiesCss } from './studio-word-cell-properties';
it('preserves independent zero and decimal margins and maps center to CSS middle', () => {
  const value = { verticalAlign: 'center', cellMargins: { top: 0, left: 5.25, right: 2, bottom: 10 } };
  expect(wordCellProperties(value)).toEqual(value);
  expect(wordCellPropertiesCss(value)).toEqual({ verticalAlign: 'middle', 'padding-top': '0pt', 'padding-left': '5.25pt', 'padding-right': '2pt', 'padding-bottom': '10pt' });
});
it.each([{ verticalAlign: 'stretch' }, { cellMargins: { left: -1 } }, { cellMargins: { top: Infinity } }, { cellMargins: { right: 1.01 } }, { cellMargins: { unknown: 1 } }])('rejects invalid native cell properties %j', value => {
  expect(() => wordCellProperties(value)).toThrow();
});
