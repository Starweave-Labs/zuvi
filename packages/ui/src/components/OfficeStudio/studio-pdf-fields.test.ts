import { describe, expect, it } from 'vitest';
import { pdfFieldIssue, pdfSetDesignedField, pdfRemoveDesignedField } from './studio-pdf-fields';
import type { StudioPdfDocument, StudioPdfField } from './studio-types';

const field: StudioPdfField = {
  name: 'customer',
  type: 'text',
  value: '',
  readOnly: false,
  widgets: [{ page: 0, x: 10, y: 10, width: 100, height: 24 }],
  design: { kind: 'text' },
};
const document: StudioPdfDocument = {
  version: 1,
  id: 'pdf',
  name: 'form.pdf',
  kind: 'pdf',
  pageCount: 1,
  marks: [],
  rotations: {},
  fields: [field],
};

describe('PDF field design validation', () => {
  it('rejects duplicate hierarchy roots, empty name parts and stale edit targets without mutating the document', () => {
    for (const name of ['customer', 'customer.name'])
      expect(() => pdfSetDesignedField(document, { ...field, name })).toThrow('名称已存在');
    expect(() =>
      pdfSetDesignedField({ ...document, fields: [{ ...field, name: 'customer.name' }] }, field)
    ).toThrow('名称已存在');
    for (const name of ['customer.', '.customer', 'customer..name'])
      expect(pdfFieldIssue({ ...field, name }, 1)).toBeDefined();
    expect(() => pdfSetDesignedField(document, { ...field, name: 'new' }, 'missing')).toThrow(
      '不存在'
    );
    expect(document.fields).toEqual([field]);
  });

  it('checks default text against multiline and maximum-length constraints before export', () => {
    expect(
      pdfFieldIssue({ ...field, design: { kind: 'text', maxLength: 2, defaultValue: 'ABC' } }, 1)
    ).toContain('字符上限');
    expect(
      pdfFieldIssue({ ...field, design: { kind: 'text', defaultValue: 'A\nB' } }, 1)
    ).toContain('换行');
    expect(
      pdfFieldIssue(
        { ...field, multiline: true, design: { kind: 'text', defaultValue: 'A\nB' } },
        1
      )
    ).toBeUndefined();
  });

  it('records removal of source fields and allows their names to be reused by new fields', () => {
    const source = {
      ...document,
      fields: [{ ...field, design: { kind: 'text' as const, sourceName: 'original' } }],
    };
    const removed = pdfRemoveDesignedField(source, 'customer');
    expect(removed.removedFields).toEqual(['original']);
    expect(pdfSetDesignedField(removed, { ...field, name: 'original' }).fields).toHaveLength(1);
    expect(source.fields).toHaveLength(1);
  });
});
