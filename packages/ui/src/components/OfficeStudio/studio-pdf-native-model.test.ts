import { createHash } from 'node:crypto';
import { expect, it } from 'vitest';
import { isOfficeStudioDocument } from './studio-model';
import {
  pdfCopyPages,
  pdfInsertBlankPage,
  pdfMovePages,
  pdfRemovePages,
  pdfResizePages,
} from './studio-pdf-pages';
import { pdfCopiedAnnotationId, sha256 } from './studio-pdf-source-id';
import type { StudioPdfDocument } from './studio-types';

function nativeDocument(): StudioPdfDocument {
  return {
    version: 1,
    id: 'source',
    kind: 'pdf',
    name: 'Source.pdf',
    pageCount: 2,
    sourcePageCount: 2,
    pages: [
      { id: 'first', sourcePage: 0 },
      { id: 'second', sourcePage: 1 },
    ],
    rotations: {},
    fields: [],
    marks: [
      {
        id: 'projection',
        nativeId: 'native-annotation',
        type: 'rectangle',
        page: 0,
        x: 20,
        y: 30,
        width: 100,
        height: 50,
        size: 12,
        text: '',
        lineWidth: 0,
      },
    ],
    nativeAnnotations: {
      version: 1,
      sourceHash: 'a'.repeat(64),
      bindings: [
        { sourcePage: 0, nativePageId: 'native-first', uiPageId: 'first' },
        { sourcePage: 1, nativePageId: 'native-second', uiPageId: 'second' },
      ],
      commands: [],
    },
  };
}
const independentId = (id: string, pageId: string) =>
  'annotation-copy:' +
  createHash('sha256')
    .update(id + ':' + pageId)
    .digest('hex')
    .slice(0, 32);

it('keeps native zero-width strokes and the native 72 point limit separate from legacy drawing restrictions', () => {
  const value = nativeDocument();
  for (const width of [0, 0.01, 40, 72]) {
    value.marks[0].lineWidth = width;
    expect(isOfficeStudioDocument(value)).toBe(true);
  }
  for (const width of [-1, NaN, 72.01]) {
    value.marks[0].lineWidth = width;
    expect(isOfficeStudioDocument(value)).toBe(false);
  }
  value.marks[0].lineWidth = 0;
  delete value.marks[0].nativeId;
  expect(isOfficeStudioDocument(value)).toBe(false);
  value.marks[0].lineWidth = 0.5;
  expect(isOfficeStudioDocument(value)).toBe(true);
});

it('requires a complete source binding and well formed source hash before native projections are accepted', () => {
  const original = nativeDocument();
  expect(isOfficeStudioDocument(original)).toBe(true);
  for (const change of [
    (doc: StudioPdfDocument) => {
      delete doc.nativeAnnotations;
    },
    (doc: StudioPdfDocument) => {
      doc.nativeAnnotations!.sourceHash = 'x'.repeat(64);
    },
    (doc: StudioPdfDocument) => {
      doc.nativeAnnotations!.bindings = doc.nativeAnnotations!.bindings.slice(0, -1);
    },
    (doc: StudioPdfDocument) => {
      doc.nativeAnnotations!.bindings[0].sourcePage = 1;
    },
    (doc: StudioPdfDocument) => {
      doc.nativeAnnotations!.bindings[0].uiPageId = 'second';
    },
    (doc: StudioPdfDocument) => {
      doc.nativeAnnotations!.bindings[0].nativePageId = 'native-second';
    },
  ]) {
    const value = structuredClone(original);
    change(value);
    expect(isOfficeStudioDocument(value)).toBe(false);
  }
  expect(isOfficeStudioDocument(original)).toBe(true);
});

it('records each copied instance as an explicit source and preserves independent stable annotation identities across successive copies', () => {
  const original = nativeDocument(),
    copied = pdfCopyPages(original, [0], 0);
  const firstCopy = copied.pages![0];
  expect(firstCopy.originPageId).toBe('first');
  expect(copied.marks[0].nativeId).toBe(independentId('native-annotation', firstCopy.id));
  const twice = pdfCopyPages(copied, [0], 3),
    secondCopy = twice.pages![3];
  expect(secondCopy.originPageId).toBe(firstCopy.id);
  expect(twice.marks.find((mark) => mark.page === 3)!.nativeId).toBe(
    independentId(copied.marks[0].nativeId!, secondCopy.id)
  );
  const commands = twice.nativeAnnotations!.commands;
  expect(commands).toHaveLength(2);
  expect(commands[1]).toEqual({
    type: 'layout',
    targets: expect.arrayContaining([
      expect.objectContaining({
        id: secondCopy.id,
        fromPageId: firstCopy.id,
        copyGroup: secondCopy.copyGroup,
      }),
    ]),
  });
  expect(isOfficeStudioDocument(twice)).toBe(true);
  expect(original).toEqual(nativeDocument());
});

it('keeps blank, move, delete and canvas-resize operations in ordered recipes without losing the original source count', () => {
  let value = pdfInsertBlankPage(nativeDocument(), 1, { width: 300, height: 600 });
  const blank = value.pages![1];
  value = pdfMovePages(value, [1], 0);
  value = pdfResizePages(value, [0], { width: 600, height: 300 });
  value = pdfRemovePages(value, [2]);
  expect(value.sourcePageCount).toBe(2);
  expect(value.pageCount).toBe(2);
  expect(value.pages![0].id).toBe(blank.id);
  expect(value.nativeAnnotations!.commands).toHaveLength(4);
  expect(value.nativeAnnotations!.commands[2]).toEqual({
    type: 'layout',
    targets: expect.arrayContaining([
      { id: blank.id, fromPageId: blank.id, size: { width: 600, height: 300 } },
    ]),
  });
  expect(isOfficeStudioDocument(value)).toBe(true);
});

it('rejects duplicate layout identities and incomplete recorded commands while leaving source-bound recipes serializable', () => {
  const valid = pdfCopyPages(nativeDocument(), [0], 0);
  expect(isOfficeStudioDocument(JSON.parse(JSON.stringify(valid)))).toBe(true);
  const duplicate = structuredClone(valid),
    layout = duplicate.nativeAnnotations!.commands[0];
  if (layout.type === 'layout') layout.targets = [layout.targets[0], layout.targets[0]];
  expect(isOfficeStudioDocument(duplicate)).toBe(false);
  const bad = structuredClone(valid);
  bad.nativeAnnotations!.commands = [
    ...bad.nativeAnnotations!.commands,
    {
      type: 'mark',
      command: {
        type: 'update',
        id: 'native-annotation',
        now: 'bad-date',
        patch: { kind: 'square' },
      },
    },
  ];
  expect(isOfficeStudioDocument(bad)).toBe(false);
});

it.each([
  '',
  '中文:复制:page-🙂',
  'a'.repeat(55),
  'a'.repeat(56),
  'a'.repeat(64),
  'x'.repeat(1000),
])('matches independent SHA-256 for stable native identity input %s', (text) => {
  const bytes = new TextEncoder().encode(text);
  expect(sha256(bytes)).toBe(createHash('sha256').update(bytes).digest('hex'));
  expect(pdfCopiedAnnotationId(text, 'page')).toBe(independentId(text, 'page'));
});
