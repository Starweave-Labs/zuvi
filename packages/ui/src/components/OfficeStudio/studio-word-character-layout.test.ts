import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Editor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { TextStyleKit } from '@tiptap/extension-text-style';
import { undoDepth } from '@tiptap/pm/history';
import {
  WordCharacterLayout,
  wordSelectionMetrics,
  wordSetCharacterLayout,
} from './studio-word-character-layout';
import { wordMetricPoints, wordMetricCss } from './studio-word-metrics';
import { WordParagraphStyles } from './studio-word-style-extension';
import {
  wordApplyFormat,
  wordCaptureFormat,
  wordClearFormat,
  WordSuperscript,
  WordSubscript,
  WordPageNumber,
} from './studio-word-tools';
import {
  materializeStudioWordStyles,
  reconcileStudioWordStyles,
  validateStudioWordParagraphStyles,
} from './studio-word-styles';
import type { StudioRichNode, StudioWordParagraphStyle } from './studio-types';

const editors: Editor[] = [];
beforeAll(() => {
  if (!Range.prototype.getClientRects)
    Range.prototype.getClientRects = (() => []) as unknown as typeof Range.prototype.getClientRects;
  if (!Range.prototype.getBoundingClientRect)
    Range.prototype.getBoundingClientRect = (() => ({
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
    })) as typeof Range.prototype.getBoundingClientRect;
});
afterEach(() => {
  editors.forEach((e) => e.destroy());
  editors.length = 0;
  vi.restoreAllMocks();
});
function fixture() {
  const editor = new Editor({
    element: document.createElement('div'),
    extensions: [
      StarterKit,
      TextStyleKit,
      WordCharacterLayout,
      WordParagraphStyles,
      WordSuperscript,
      WordSubscript,
      WordPageNumber,
    ],
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'A',
              marks: [
                { type: 'bold' },
                { type: 'superscript' },
                {
                  type: 'textStyle',
                  attrs: { fontSize: '14pt', letterSpacing: '1pt', baselineShift: '2pt' },
                },
              ],
            },
            {
              type: 'text',
              text: 'BC',
              marks: [
                { type: 'italic' },
                { type: 'link', attrs: { href: 'https://example.com' } },
                {
                  type: 'textStyle',
                  attrs: { fontSize: '30pt', letterSpacing: '-0.1pt', baselineShift: '0pt' },
                },
              ],
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'dest',
              marks: [{ type: 'link', attrs: { href: 'https://example.com/target' } }],
            },
          ],
        },
      ],
    },
  });
  editors.push(editor);
  return editor;
}
const runs = (editor: Editor) => editor.getJSON().content![0].content! as StudioRichNode[];
const attrs = (node: StudioRichNode) => node.marks?.find((m) => m.type === 'textStyle')?.attrs;
describe('Word character spacing and position', () => {
  it('formats page-field characters and restores their marks in one undo', () => {
    const e = fixture();
    e.commands.insertContentAt(4, { type: 'pageNumber', attrs: { kind: 'current' } });
    e.commands.setTextSelection({ from: 4, to: 5 });
    wordSetCharacterLayout(e, { letterSpacing: 0.3, baselineShift: 1.5 });
    expect(attrs(runs(e).find((n) => n.type === 'pageNumber')!)).toMatchObject({
      letterSpacing: '0.3pt',
      baselineShift: '1.5pt',
    });
    expect(wordSelectionMetrics(e)).toEqual({ letterSpacing: 0.3, baselineShift: 1.5 });
    e.commands.undo();
    expect(attrs(runs(e).find((n) => n.type === 'pageNumber')!)).toBeUndefined();
  });
  it('validates native precision, signed limits and CSS safely', () => {
    expect(wordMetricPoints('-0.05pt', 'letterSpacing')).toBe(-0.05);
    expect(wordMetricPoints('2.5pt', 'baselineShift')).toBe(2.5);
    for (const value of ['1px', '1pt;color:red', '1e3', '1.03', 501, NaN])
      expect(wordMetricPoints(value, 'letterSpacing')).toBeNull();
    expect(wordMetricPoints('.75pt', 'baselineShift')).toBeNull();
    expect(wordMetricCss({ letterSpacing: '1.2pt', baselineShift: '-2.5pt' })).toEqual({
      letterSpacing: '1.2pt',
      verticalAlign: '-2.5pt',
      '--zuvi-word-baseline-shift': '-2.5pt',
    });
    expect(wordMetricCss({ baselineShift: '0pt' })).toEqual({
      verticalAlign: 'baseline',
      '--zuvi-word-baseline-shift': '0pt',
    });
  });
  it('applies mixed runs in one transaction, preserving size, links, superscript and text with undo/redo', () => {
    const e = fixture();
    e.commands.setTextSelection({ from: 1, to: 4 });
    const original = e.getJSON();
    expect(wordSelectionMetrics(e)).toEqual({ letterSpacing: null, baselineShift: null });
    expect(wordSetCharacterLayout(e, { letterSpacing: 1.2, baselineShift: -2.5 })).toBe(true);
    expect(undoDepth(e.state)).toBe(1);
    expect(e.getText()).toBe('ABC\n\ndest');
    expect(runs(e).map((n) => attrs(n))).toEqual([
      expect.objectContaining({
        fontSize: '14pt',
        letterSpacing: '1.2pt',
        baselineShift: '-2.5pt',
      }),
      expect.objectContaining({
        fontSize: '30pt',
        letterSpacing: '1.2pt',
        baselineShift: '-2.5pt',
      }),
    ]);
    expect(runs(e)[0].marks?.some((m) => m.type === 'superscript')).toBe(true);
    expect(runs(e)[1].marks?.some((m) => m.type === 'link')).toBe(true);
    e.commands.undo();
    expect(e.getJSON()).toEqual(original);
    e.commands.redo();
    expect(wordSelectionMetrics(e)).toEqual({ letterSpacing: 1.2, baselineShift: -2.5 });
  });
  it('keeps untouched mixed values, is idempotent, rejects invalid values atomically and respects read-only', () => {
    const e = fixture();
    e.commands.setTextSelection({ from: 1, to: 4 });
    wordSetCharacterLayout(e, { letterSpacing: 2 });
    expect(runs(e).map((n) => attrs(n)?.baselineShift)).toEqual(['2pt', '0pt']);
    expect(wordSetCharacterLayout(e, { letterSpacing: 2 })).toBe(false);
    const original = e.getJSON();
    expect(() => wordSetCharacterLayout(e, { letterSpacing: 3, baselineShift: 1.25 })).toThrow();
    expect(e.getJSON()).toEqual(original);
    e.setEditable(false);
    expect(wordSetCharacterLayout(e, { letterSpacing: 3 })).toBe(false);
    expect(e.getJSON()).toEqual(original);
  });
  it('formats only subsequent text at an insertion point and keeps undo/redo transactional', () => {
    const e = fixture();
    e.commands.setTextSelection(3);
    const original = e.getJSON();
    wordSetCharacterLayout(e, { letterSpacing: 2, baselineShift: 1 });
    expect(e.getJSON()).toEqual(original);
    e.commands.insertContent('Z');
    expect(e.getText()).toBe('ABZC\n\ndest');
    expect(attrs(runs(e).find((n) => n.text === 'Z')!)).toMatchObject({
      letterSpacing: '2pt',
      baselineShift: '1pt',
      fontSize: '30pt',
    });
    e.commands.undo();
    expect(e.getJSON()).toEqual(original);
    e.commands.redo();
    expect(e.getText()).toContain('ABZC');
  });
  it('includes the new metrics in painting and clears them with other direct character formatting', () => {
    const e = fixture();
    e.commands.setTextSelection({ from: 1, to: 2 });
    const snapshot = wordCaptureFormat(e);
    e.commands.setTextSelection({ from: 6, to: 10 });
    wordApplyFormat(e, snapshot);
    expect(attrs(e.getJSON().content![1].content![0])).toMatchObject({
      letterSpacing: '1pt',
      baselineShift: '2pt',
    });
    expect(e.getJSON().content![1].content![0].marks?.some((m) => m.type === 'link')).toBe(true);
    wordClearFormat(e);
    expect(e.getJSON().content![1].content![0].marks?.some((m) => m.type === 'textStyle')).toBe(
      false
    );
  });
  it('inherits style metrics and preserves explicit zero and condensed overrides across style modifications', () => {
    const styles: StudioWordParagraphStyle[] = [
      { id: 'wide', name: '加宽', run: { letterSpacing: 1, baselineShift: 2 } },
      { id: 'normal', name: '归零', basedOn: 'wide', run: { letterSpacing: 0, baselineShift: 0 } },
    ];
    const doc: StudioRichNode = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { paragraphStyle: 'wide' },
          content: [
            { type: 'text', text: 'inherit' },
            {
              type: 'text',
              text: 'direct',
              marks: [
                { type: 'textStyle', attrs: { letterSpacing: '-0.2pt', baselineShift: '0pt' } },
              ],
            },
          ],
        },
      ],
    };
    const materialized = materializeStudioWordStyles(doc, styles);
    expect(attrs(materialized.content![0].content![0])).toMatchObject({
      letterSpacing: '1pt',
      baselineShift: '2pt',
    });
    const changed = styles.map((s) =>
      s.id === 'wide' ? { ...s, run: { letterSpacing: 3, baselineShift: 4 } } : s
    );
    const reconciled = reconcileStudioWordStyles(materialized, styles, changed);
    expect(attrs(reconciled.content![0].content![0])).toMatchObject({
      letterSpacing: '3pt',
      baselineShift: '4pt',
    });
    expect(attrs(reconciled.content![0].content![1])).toMatchObject({
      letterSpacing: '-0.2pt',
      baselineShift: '0pt',
    });
    expect(() =>
      validateStudioWordParagraphStyles([{ id: 'bad', name: '错误', run: { baselineShift: 0.25 } }])
    ).toThrow();
  });
});

it('reads legacy paint offsets and new baseline alignment while retaining explicit zero on HTML reopen', () => {
  const editor = new Editor({
    extensions: [StarterKit, TextStyleKit, WordCharacterLayout],
    content:
      '<p><span style="position:relative;top:-2pt">Legacy</span><span style="vertical-align:-1.5pt">Lowered</span><span style="vertical-align:baseline">Reset</span></p>',
  });
  editors.push(editor);
  expect(runs(editor).map((node) => attrs(node)?.baselineShift)).toEqual(['2pt', '-1.5pt', '0pt']);
  const html = editor.getHTML();
  editor.commands.setContent(html);
  expect(runs(editor).map((node) => attrs(node)?.baselineShift)).toEqual(['2pt', '-1.5pt', '0pt']);
  expect(editor.getText()).toBe('LegacyLoweredReset');
});
