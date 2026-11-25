import { mergeAttributes } from '@tiptap/react';
import { TableCell, TableHeader } from '@tiptap/extension-table';

export const WordTableCell = TableCell.extend({
  renderHTML({ HTMLAttributes }) {
    return [
      'td',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      ['div', { 'data-word-cell-content': '' }, 0],
    ];
  },
});
export const WordTableHeader = TableHeader.extend({
  renderHTML({ HTMLAttributes }) {
    return [
      'th',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      ['div', { 'data-word-cell-content': '' }, 0],
    ];
  },
});
