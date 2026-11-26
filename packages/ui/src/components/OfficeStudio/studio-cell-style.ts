import type { CSSProperties } from 'react';
import type { StudioCell } from './studio-types';
import { sheetTextFormatIssue, type SheetTextFormat } from './studio-sheet-text-properties';

import { studioBorderSides, studioCellBorderError } from './studio-cell-format-core';
export { studioBorderSides, studioBorderStyles } from './studio-cell-format-core';

export function studioCellStyleIssue(
  cell: { [Key in keyof SheetTextFormat]?: unknown } & { borders?: unknown }
) {
  const textIssue = sheetTextFormatIssue(cell as SheetTextFormat);
  if (textIssue) return textIssue;
  const borderIssue = studioCellBorderError(cell.borders);
  return borderIssue === 1 ? '单元格边框无效。' : borderIssue === 2 ? '单元格边框线型或颜色无效。' : null;
}

export function studioBorderCss(
  border: NonNullable<StudioCell['borders']>[(typeof studioBorderSides)[number]],
  fallback = 'var(--zuvi-color-fg)'
) {
  if (!border) return undefined;
  const width =
    border.style === 'double' || border.style === 'thick'
      ? 3
      : border.style.startsWith('medium')
        ? 2
        : 1;
  const style =
    border.style === 'double'
      ? 'double'
      : border.style === 'dotted' || border.style === 'hair'
        ? 'dotted'
        : /dash/i.test(border.style)
          ? 'dashed'
          : 'solid';
  return `${width}px ${style} ${border.color ?? fallback}`;
}

export function studioCellBordersCss(cell: StudioCell): CSSProperties {
  return Object.fromEntries(
    studioBorderSides
      .filter((side) => cell.borders?.[side])
      .map((side) => [
        `border${side[0].toUpperCase()}${side.slice(1)}`,
        studioBorderCss(cell.borders?.[side]),
      ])
  ) as CSSProperties;
}
