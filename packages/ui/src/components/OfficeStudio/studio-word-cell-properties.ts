export type WordCellVerticalAlign = 'top' | 'center' | 'bottom';
export interface WordCellProperties {
  verticalAlign?: WordCellVerticalAlign;
  cellMargins?: Partial<Record<'top' | 'right' | 'bottom' | 'left', number>> | null;
}
export function wordCellProperties(input: unknown): WordCellProperties {
  if (input == null) return {};
  if (typeof input !== 'object' || Array.isArray(input)) throw new Error('单元格属性无效。');
  const value = input as Record<string, unknown>;
  const result: WordCellProperties = {};
  if (value.verticalAlign != null) {
    if (!['top', 'center', 'bottom'].includes(String(value.verticalAlign))) throw new Error('单元格垂直对齐无效。');
    result.verticalAlign = value.verticalAlign as WordCellVerticalAlign;
  }
  if (value.cellMargins === null) result.cellMargins = null;
  else if (value.cellMargins !== undefined) {
    if (typeof value.cellMargins !== 'object' || Array.isArray(value.cellMargins)) throw new Error('单元格内边距无效。');
    result.cellMargins = {};
    for (const [side, amount] of Object.entries(value.cellMargins)) {
      if (!['top', 'right', 'bottom', 'left'].includes(side) || typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0 || amount > 2000 || Math.abs(amount * 20 - Math.round(amount * 20)) > 1e-6)
        throw new Error('单元格内边距须在0到2000磅之间，精度为0.05磅。');
      result.cellMargins[side as keyof NonNullable<WordCellProperties['cellMargins']>] = amount;
    }
  }
  return result;
}
export function wordCellPropertiesCss(input: unknown): Record<string, string> {
  const properties = wordCellProperties(input);
  return {
    ...(properties.verticalAlign ? { verticalAlign: properties.verticalAlign === 'center' ? 'middle' : properties.verticalAlign } : {}),
    ...Object.fromEntries(Object.entries(properties.cellMargins || {}).map(([side, amount]) => [`padding-${side}`, `${amount}pt`])),
  };
}
