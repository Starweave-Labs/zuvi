import { sheetTextFormatError } from './studio-cell-format-core';
import type { SheetTextFormat } from './studio-sheet-text-properties';

/** Font entry diagnostics stay with editor controls; model validation uses the shared core. */
export function studioCellFontIssue(cell: { fontFamily?: unknown; fontSize?: unknown }) {
  if (sheetTextFormatError({ fontFamily: cell.fontFamily } as SheetTextFormat))
    return '字体名称须为 1 至 255 个字符，并使用有效的 XML 文本。';
  if (sheetTextFormatError({ fontSize: cell.fontSize } as SheetTextFormat))
    return '字号须为 1 至 409 磅之间的数值。';
}
