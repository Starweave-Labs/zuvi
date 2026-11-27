import { afterEach, describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { TextStyleKit } from '@tiptap/extension-text-style';
import { WordParagraphStyles, wordSetParagraphStyles } from './studio-word-style-extension';
import {
  WordParagraphSurface,
  wordSetParagraphSurface,
  wordEffectiveSurface,
} from './studio-word-surface-extension';
import { materializeStudioWordStyles } from './studio-word-styles';
import { wordSurface, wordMergeSurface, wordSurfaceCss } from './studio-word-surface';
import type { StudioWordParagraphStyle, StudioRichNode } from './studio-types';
const editors: Editor[] = [];
afterEach(() => {
  editors.forEach((editor) => editor.destroy());
  editors.length = 0;
});
function setup(autoUpdate = false) {
  const styles: StudioWordParagraphStyle[] = [
    {
      id: 'panel',
      name: 'Panel',
      autoUpdate,
      surface: {
        borders: {
          top: { style: 'single', size: 1, color: '#0055aa' },
          left: { style: 'dotted', space: 3 },
        },
        shading: { pattern: 'clear', fill: '#ffeecc' },
      },
    },
  ];
  const root: StudioRichNode = {
    type: 'doc',
    attrs: { paragraphStyles: styles },
    content: [
      {
        type: 'paragraph',
        attrs: { paragraphStyle: 'panel' },
        content: [
          {
            type: 'text',
            text: 'Alpha',
            marks: [{ type: 'bold' }, { type: 'link', attrs: { href: 'https://example.com' } }],
          },
        ],
      },
      {
        type: 'paragraph',
        attrs: { paragraphSurface: { borders: { bottom: { style: 'double', size: 2 } } } },
        content: [{ type: 'text', text: 'Beta' }],
      },
    ],
  };
  const editor = new Editor({
    element: document.createElement('div'),
    extensions: [StarterKit, TextStyleKit, WordParagraphStyles, WordParagraphSurface],
    content: materializeStudioWordStyles(root, styles),
  });
  editors.push(editor);
  return { editor, styles };
}
describe('Word paragraph border and shading model', () => {
  it('validates native eighth-point widths, integer distances and supported shapes before mutation', () => {
    expect(
      wordSurface({
        borders: { top: { style: 'double', size: 0.375, space: 31 } },
        shading: { pattern: 'pct25', fill: 'auto' },
      }).borders?.top?.size
    ).toBe(0.375);
    for (const value of [
      { borders: { top: { style: 'single', size: 0.3 } } },
      { borders: { top: { style: 'single', space: 1.5 } } },
      { borders: { diagonal: { style: 'single' } } },
      { shading: { pattern: 'unknown' } },
      { shading: { pattern: 'clear', fill: 'red' } },
    ])
      expect(() => wordSurface(value)).toThrow();
  });
  it('merges inherited edges while explicit nil removes the matching edge', () => {
    expect(
      wordMergeSurface(
        { borders: { top: { style: 'single' }, left: { style: 'dotted' } } },
        { borders: { top: { style: 'nil' } } }
      )
    ).toEqual({ borders: { top: { style: 'nil' }, left: { style: 'dotted' } } });
  });
  it('formats mixed paragraphs in one transaction while retaining each unmodified edge, text and links', () => {
    const { editor } = setup();
    editor.commands.setTextSelection({ from: 1, to: editor.state.doc.content.size - 1 });
    const before = editor.getJSON();
    wordSetParagraphSurface(editor, {
      borders: { right: { style: 'dashed', size: 1.5, space: 4 } },
      shading: { pattern: 'clear', fill: '#ccffee' },
    });
    expect(editor.getJSON().content![0].content).toEqual(before.content![0].content);
    expect(wordEffectiveSurface(editor, editor.state.doc.child(0)).borders?.top?.style).toBe(
      'single'
    );
    expect(wordEffectiveSurface(editor, editor.state.doc.child(1)).borders?.bottom?.style).toBe(
      'double'
    );
    editor.commands.undo();
    expect(editor.getJSON()).toEqual(before);
    editor.commands.redo();
    expect(wordEffectiveSurface(editor, editor.state.doc.child(1)).borders?.right?.space).toBe(4);
  });
  it('keeps direct edge overrides when a named style changes and follows inherited edges', () => {
    const { editor, styles } = setup();
    wordSetParagraphSurface(editor, { borders: { top: { style: 'nil' } } });
    wordSetParagraphStyles(editor, [
      {
        ...styles[0],
        surface: { borders: { top: { style: 'double' }, left: { style: 'single', size: 2 } } },
      },
    ]);
    expect(wordEffectiveSurface(editor, editor.state.doc.child(0)).borders).toMatchObject({
      top: { style: 'nil' },
      left: { style: 'single', size: 2 },
    });
  });
  it('updates automatic styles and removes the edited direct delta in the same history action', () => {
    const { editor } = setup(true),
      before = editor.getJSON();
    wordSetParagraphSurface(editor, { shading: { pattern: 'solid', color: '#aabbcc' } });
    expect(editor.getJSON().attrs?.paragraphStyles[0].surface.shading.color).toBe('#aabbcc');
    expect(editor.state.doc.child(0).attrs.paragraphSurface).toBeNull();
    editor.commands.undo();
    expect(editor.getJSON()).toEqual(before);
  });
  it('rejects invalid batches and readonly/composition changes without editing or adding history', () => {
    const { editor } = setup(),
      before = editor.getJSON();
    expect(() => wordSetParagraphSurface(editor, { borders: { top: { size: 100 } } })).toThrow();
    expect(editor.getJSON()).toEqual(before);
    editor.setEditable(false);
    expect(wordSetParagraphSurface(editor, { shading: { pattern: 'nil' } })).toBe(false);
    editor.setEditable(true);
    Object.defineProperty(editor.view, 'composing', { value: true, configurable: true });
    expect(wordSetParagraphSurface(editor, { shading: { pattern: 'nil' } })).toBe(false);
    expect(editor.getJSON()).toEqual(before);
  });
  it('renders visible colors and padding without injecting unsupported CSS values', () => {
    expect(
      wordSurfaceCss({
        borders: { left: { style: 'dashed', size: 1, space: 3, color: '#112233' } },
        shading: { pattern: 'clear', fill: '#ffeeaa' },
      })
    ).toMatchObject({
      borderLeft: '1pt dashed #112233',
      paddingLeft: '3pt',
      backgroundColor: '#ffeeaa',
    });
  });
});
