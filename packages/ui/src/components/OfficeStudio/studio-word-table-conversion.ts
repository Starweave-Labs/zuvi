import type { Editor } from '@tiptap/react';
import { closeHistory } from '@tiptap/pm/history';
import { TextSelection, type Selection } from '@tiptap/pm/state';
import { Fragment, type Node as ProseMirrorNode, type Schema } from '@tiptap/pm/model';

export type WordTableSeparator = 'tab' | 'comma' | 'paragraph' | 'custom';
export function wordTableSeparator(kind: WordTableSeparator, custom = ''): string | null {
  if (kind === 'paragraph') return null;
  if (kind === 'tab') return '\t';
  if (kind === 'comma') return ',';
  if (kind !== 'custom' || Array.from(custom).length !== 1 || /[\r\n]/.test(custom))
    throw new Error('自定义分隔符须为一个字符，不能是换行。');
  return custom;
}

/** Split by document offsets, so marks and inline objects survive delimiter removal. */
export function wordTextToTable(
  schema: Schema,
  paragraphs: readonly ProseMirrorNode[],
  separator: string | null,
  paragraphColumns = 1
): ProseMirrorNode {
  if (!paragraphs.length || paragraphs.some((node) => node.type.name !== 'paragraph'))
    throw new Error('请选择连续的普通段落。');
  if (separator !== null && (Array.from(separator).length !== 1 || /[\r\n]/.test(separator)))
    throw new Error('分隔符无效。');
  if (!Number.isInteger(paragraphColumns) || paragraphColumns < 1 || paragraphColumns > 100)
    throw new Error('列数须为1到100。');
  if (paragraphs.length > (separator === null ? paragraphColumns * 1000 : 1000))
    throw new Error('转换范围超过1000行。');
  const rows: ProseMirrorNode[][] = [];
  for (const paragraph of paragraphs) {
    const cells: ProseMirrorNode[] = [];
    let start = 0;
    if (separator !== null) {
      paragraph.forEach((inline, offset) => {
        if (!inline.isText) return;
        let index = inline.text!.indexOf(separator);
        while (index >= 0) {
          const end = offset + index;
          cells.push(paragraph.copy(paragraph.content.cut(start, end)));
          if (cells.length >= 100) throw new Error('转换范围超过100列。');
          start = end + separator.length;
          index = inline.text!.indexOf(separator, index + separator.length);
        }
      });
    }
    cells.push(paragraph.copy(paragraph.content.cut(start)));
    if (separator !== null) rows.push(cells);
    else {
      if (!rows.length || rows.at(-1)!.length === paragraphColumns) rows.push([]);
      rows.at(-1)!.push(cells[0]);
    }
  }
  const columns =
    separator === null ? paragraphColumns : Math.max(...rows.map((row) => row.length));
  if (columns > 100 || rows.length > 1000) throw new Error('转换范围超过100列或1000行。');
  const tableRows = rows.map((row) => {
    const cells = Array.from({ length: columns }, (_, index) =>
      schema.nodes.tableCell.createChecked(null, row[index] ?? schema.nodes.paragraph.create())
    );
    return schema.nodes.tableRow.createChecked(null, cells);
  });
  return schema.nodes.table.createChecked(null, tableRows);
}

/** Retain all cell blocks and inline marks; covered merged-cell slots become empty fields. */
export function wordTableToText(
  schema: Schema,
  table: ProseMirrorNode,
  separator: string | null,
  convertNested = false
): Fragment {
  if (table.type.name !== 'table') throw new Error('请选择表格。');
  if (separator !== null && (Array.from(separator).length !== 1 || /[\r\n]/.test(separator)))
    throw new Error('分隔符无效。');
  const output: ProseMirrorNode[] = [];
  const occupied = new Map<number, number>();
  let rowIndex = 0;
  table.forEach((row) => {
    const fields: ProseMirrorNode[][] = [];
    let column = 0;
    row.forEach((cell) => {
      while ((occupied.get(column) ?? 0) > rowIndex) {
        fields.push([schema.nodes.paragraph.create()]);
        column++;
      }
      const blocks: ProseMirrorNode[] = [];
      cell.forEach((block) => {
        if (block.type.name === 'table' && convertNested) {
          wordTableToText(schema, block, separator, true).forEach((nested) => blocks.push(nested));
        } else blocks.push(block);
      });
      fields.push(blocks.length ? blocks : [schema.nodes.paragraph.create()]);
      const colspan = Number(cell.attrs.colspan) || 1;
      const rowspan = Number(cell.attrs.rowspan) || 1;
      if (
        !Number.isInteger(colspan) ||
        colspan < 1 ||
        colspan > 100 ||
        !Number.isInteger(rowspan) ||
        rowspan < 1 ||
        rowspan > 1000
      )
        throw new Error('合并范围无效或超过转换范围。');
      for (let i = 0; i < colspan; i++) {
        if (rowspan > 1) occupied.set(column + i, rowIndex + rowspan);
        if (i) fields.push([schema.nodes.paragraph.create()]);
      }
      column += colspan;
    });
    while ((occupied.get(column) ?? 0) > rowIndex) {
      fields.push([schema.nodes.paragraph.create()]);
      column++;
    }
    if (separator === null) output.push(...fields.flat());
    else {
      const paragraphs: ProseMirrorNode[] = [];
      fields.forEach((blocks, index) => {
        if (!index) paragraphs.push(...blocks);
        else {
          const previous = paragraphs.at(-1)!;
          if (previous.isTextblock && blocks[0].isTextblock) {
            paragraphs.pop();
            paragraphs.push(
              previous.copy(
                previous.content
                  .append(Fragment.from(schema.text(separator)))
                  .append(blocks[0].content)
              )
            );
            paragraphs.push(...blocks.slice(1));
          } else {
            if (previous.isTextblock) {
              paragraphs.pop();
              paragraphs.push(
                previous.copy(previous.content.append(Fragment.from(schema.text(separator))))
              );
            } else paragraphs.push(schema.nodes.paragraph.create(null, schema.text(separator)));
            paragraphs.push(...blocks);
          }
        }
      });
      output.push(...paragraphs);
    }
    rowIndex++;
  });
  return Fragment.fromArray(output);
}

export interface WordConversionTarget {
  doc: ProseMirrorNode;
  selection: Selection;
  from: number;
  to: number;
  nodes: ProseMirrorNode[];
  direction: 'textToTable' | 'tableToText';
  before?: ProseMirrorNode;
  after?: ProseMirrorNode;
}

export function wordConversionTarget(editor: Editor): WordConversionTarget | null {
  if (editor.isDestroyed) return null;
  const { doc, selection } = editor.state;
  const { $from, $to } = selection;
  const selectedNode = doc.nodeAt(selection.from);
  if (
    selectedNode?.type.name === 'table' &&
    selection.to === selection.from + selectedNode.nodeSize
  )
    return {
      doc,
      selection,
      from: selection.from,
      to: selection.to,
      nodes: [selectedNode],
      direction: 'tableToText',
    };
  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth);
    if (node.type.name === 'table') {
      const from = $from.before(depth);
      if ($to.pos > from + node.nodeSize) return null;
      return {
        doc,
        selection,
        from,
        to: from + node.nodeSize,
        nodes: [node],
        direction: 'tableToText',
      };
    }
  }
  const range = $from.blockRange($to);
  if (!range) return null;
  const nodes: ProseMirrorNode[] = [];
  for (let index = range.startIndex; index < range.endIndex; index++) {
    const node = range.parent.child(index);
    if (node.type.name !== 'paragraph') return null;
    nodes.push(node);
  }
  if (!nodes.length) return null;
  if (
    !selection.empty &&
    $from.parent.type.name === 'paragraph' &&
    $to.parent.type.name === 'paragraph'
  ) {
    const first = nodes[0],
      last = nodes[nodes.length - 1];
    const start = $from.parentOffset,
      end = $to.parentOffset;
    const before = start > 0 ? first.copy(first.content.cut(0, start)) : undefined;
    const after = end < last.content.size ? last.copy(last.content.cut(end)) : undefined;
    if (nodes.length === 1) nodes[0] = first.copy(first.content.cut(start, end));
    else {
      nodes[0] = first.copy(first.content.cut(start));
      nodes[nodes.length - 1] = last.copy(last.content.cut(0, end));
    }
    return {
      doc,
      selection,
      from: range.start,
      to: range.end,
      nodes,
      direction: 'textToTable',
      before,
      after,
    };
  }
  return { doc, selection, from: range.start, to: range.end, nodes, direction: 'textToTable' };
}

export function wordApplyTableConversion(
  editor: Editor,
  target: WordConversionTarget,
  separator: string | null,
  columns = 1,
  convertNested = false
): boolean {
  if (editor.isDestroyed || !editor.isEditable || editor.view.composing) return false;
  if (editor.state.doc !== target.doc || !editor.state.selection.eq(target.selection))
    throw new Error('文档或选区已变化，请重新打开转换。');
  const content =
    target.direction === 'textToTable'
      ? Fragment.fromArray([
          ...(target.before ? [target.before] : []),
          wordTextToTable(editor.schema, target.nodes, separator, columns),
          ...(target.after ? [target.after] : []),
        ])
      : wordTableToText(editor.schema, target.nodes[0], separator, convertNested);
  const tr = closeHistory(editor.state.tr).replaceWith(target.from, target.to, content);
  tr.setSelection(
    TextSelection.near(
      tr.doc.resolve(
        Math.min(target.from + (target.before?.nodeSize ?? 0) + 1, tr.doc.content.size)
      )
    )
  );
  editor.view.dispatch(tr.scrollIntoView());
  editor.view.dispatch(closeHistory(editor.state.tr).setMeta('addToHistory', false));
  return true;
}
