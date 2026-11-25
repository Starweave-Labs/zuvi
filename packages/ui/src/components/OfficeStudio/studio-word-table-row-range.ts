import { Fragment, type Node as ProseMirrorNode } from '@tiptap/pm/model';
import { CellSelection, TableMap } from '@tiptap/pm/tables';

/** A partial row range is safe only when no vertical merge crosses either cut. */
export function wordSplitTableRows(table: ProseMirrorNode, first: number, end: number) {
  if (
    table.type.name !== 'table' ||
    !Number.isInteger(first) ||
    !Number.isInteger(end) ||
    first < 0 ||
    end <= first ||
    end > table.childCount
  )
    throw new Error('表格行范围无效。');
  const map = TableMap.get(table);
  if (map.problems?.length) throw new Error('表格合并结构无效，请先修复表格。');
  for (const boundary of [first, end]) {
    if (boundary === 0 || boundary === map.height) continue;
    for (let column = 0; column < map.width; column++) {
      if (map.map[(boundary - 1) * map.width + column] === map.map[boundary * map.width + column])
        throw new Error('纵向合并单元格跨越转换边界，请选择完整合并范围。');
    }
  }
  const slice = (start: number, stop: number) =>
    Fragment.fromArray(
      Array.from({ length: stop - start }, (_, index) => table.child(start + index))
    );
  return {
    before: first ? table.copy(slice(0, first)) : undefined,
    selected: table.copy(slice(first, end)),
    after: end < table.childCount ? table.copy(slice(end, table.childCount)) : undefined,
  };
}

/** Return a row range only when the cell selection covers the entire table width. */
export function wordSelectedTableRowRange(selection: CellSelection) {
  const table = selection.$anchorCell.node(-1);
  const map = TableMap.get(table);
  const tableStart = selection.$anchorCell.start(-1);
  const rectangle = map.rectBetween(
    selection.$anchorCell.pos - tableStart,
    selection.$headCell.pos - tableStart
  );
  if (rectangle.left !== 0 || rectangle.right !== map.width) return null;
  return { first: rectangle.top, end: rectangle.bottom };
}
