export type WordRowHeightRule = 'auto' | 'atLeast' | 'exact';
export interface WordRowProperties {
  rowHeight: number | null;
  rowHeightRule: WordRowHeightRule;
  allowSplit: boolean | null;
}
export function wordRowProperties(value: unknown): WordRowProperties {
  if (value != null && (typeof value !== 'object' || Array.isArray(value)))
    throw new Error('表格行属性无效。');
  const attrs = (value ?? {}) as Record<string, unknown>;
  const height = attrs.rowHeight ?? null;
  if (
    height !== null &&
    (typeof height !== 'number' || !Number.isFinite(height) || height < 0 || height > 2000)
  )
    throw new Error('行高必须在 0 到 2000 磅之间。');
  const rule = attrs.rowHeightRule ?? 'atLeast';
  if (!['auto', 'atLeast', 'exact'].includes(String(rule))) throw new Error('行高规则无效。');
  if (rule === 'exact' && height === null) throw new Error('固定行高必须指定高度。');
  const allowSplit = attrs.allowSplit ?? null;
  if (allowSplit !== null && typeof allowSplit !== 'boolean') throw new Error('行跨页属性无效。');
  return {
    rowHeight: rule === 'auto' && height === null ? 0 : (height as number | null),
    rowHeightRule: rule as WordRowHeightRule,
    allowSplit: allowSplit as boolean | null,
  };
}
export function wordRowCss(value: unknown): Record<string, string> {
  const properties = wordRowProperties(value);
  return {
    ...(properties.rowHeight !== null && properties.rowHeightRule !== 'auto'
      ? { height: `${properties.rowHeight}pt` }
      : {}),
    ...(properties.rowHeight !== null && properties.rowHeightRule === 'exact'
      ? { '--zuvi-word-row-height': `${properties.rowHeight}pt` }
      : {}),
    ...(properties.allowSplit !== null
      ? { breakInside: properties.allowSplit ? 'auto' : 'avoid' }
      : {}),
  };
}
export function wordMergedRowHeight(values: readonly unknown[]): number | null {
  if (!values.length) return null;
  const rows = values.map(wordRowProperties);
  if (rows.some((row) => row.rowHeightRule !== 'exact' || row.rowHeight === null)) return null;
  return rows.reduce((sum, row) => sum + row.rowHeight!, 0);
}
