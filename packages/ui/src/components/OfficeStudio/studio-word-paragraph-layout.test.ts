import { afterEach, describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { TextStyleKit } from '@tiptap/extension-text-style';
import { undoDepth } from '@tiptap/pm/history';
import {
  WordParagraphLayout,
  wordSelectedParagraphs,
  wordSelectionParagraphFormat,
  wordSetParagraphFormat,
} from './studio-word-paragraph-layout';
import { wordParagraphNumber } from './studio-word-paragraph-format';
import { WordParagraphStyles, wordSetParagraphStyles } from './studio-word-style-extension';
import {
  materializeStudioWordStyles,
  reconcileStudioWordStyles,
  resolveStudioWordParagraphStyle,
} from './studio-word-styles';
import type { StudioRichNode, StudioWordParagraphStyle } from './studio-types';

const editors: Editor[] = [];
afterEach(() => {
  editors.forEach((editor) => editor.destroy());
  editors.length = 0;
});
const styles: StudioWordParagraphStyle[] = [
  {
    id: 'review',
    name: 'Review',
    paragraph: { indentLeft: 8, indentFirstLine: 4, lineHeight: 1.5, spaceAfter: 6 },
  },
];
function fixture() {
  const doc: StudioRichNode = {
    type: 'doc',
    attrs: { paragraphStyles: styles },
    content: [
      {
        type: 'paragraph',
        attrs: { paragraphStyle: 'review' },
        content: [
          {
            type: 'text',
            text: 'Alpha',
            marks: [{ type: 'bold' }, { type: 'link', attrs: { href: 'https://example.com' } }],
          },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 2, indentLeft: 16, lineHeight: 18, lineHeightRule: 'exact' },
        content: [{ type: 'text', text: 'Beta' }],
      },
    ],
  };
  const editor = new Editor({
    element: document.createElement('div'),
    extensions: [StarterKit, TextStyleKit, WordParagraphLayout, WordParagraphStyles],
    content: materializeStudioWordStyles(doc, styles),
  });
  editors.push(editor);
  return editor;
}
describe('Word paragraph layout model', () => {
  it('updates automatic styles with boolean keep values in the same undo group',()=>{
    const definition:StudioWordParagraphStyle={id:'autoKeep',name:'Auto keep',autoUpdate:true,paragraph:{keepNext:true,widowControl:true}};
    const root:StudioRichNode={type:'doc',attrs:{paragraphStyles:[definition]},content:['First','Second'].map((text)=>({type:'paragraph',attrs:{paragraphStyle:'autoKeep'},content:[{type:'text',text}]}))};
    const editor=new Editor({element:document.createElement('div'),extensions:[StarterKit,TextStyleKit,WordParagraphLayout,WordParagraphStyles],content:materializeStudioWordStyles(root,[definition])});editors.push(editor);
    const original=editor.getJSON();wordSetParagraphFormat(editor,{keepNext:false,keepLines:true,widowControl:false});
    expect(editor.getJSON().attrs?.paragraphStyles[0].paragraph).toMatchObject({keepNext:false,keepLines:true,widowControl:false});
    expect(editor.getJSON().content!.map((node)=>node.attrs?.keepNext)).toEqual([false,false]);
    editor.commands.undo();expect(editor.getJSON()).toEqual(original);
  });
  it('applies pagination flags atomically and preserves explicit false during style changes', () => {
    const editor = fixture();
    editor.commands.setTextSelection({ from: 1, to: 12 });
    const original = editor.getJSON();
    wordSetParagraphFormat(editor, { keepLines: true, keepNext: true, widowControl: false });
    expect(
      wordSelectedParagraphs(editor).every(
        ({ node }) =>
          node.attrs.keepLines && node.attrs.keepNext && node.attrs.widowControl === false
      )
    ).toBe(true);
    editor.commands.undo();
    expect(editor.getJSON()).toEqual(original);
    editor.commands.redo();
    wordSetParagraphStyles(editor, [
      { ...styles[0], paragraph: { ...styles[0].paragraph, keepLines: false, widowControl: true } },
    ]);
    expect(editor.getJSON().content![0].attrs).toMatchObject({
      keepLines: true,
      widowControl: false,
    });
    expect(() => wordSetParagraphFormat(editor, { keepNext: 'true' as never })).toThrow();
    editor.setEditable(false);
    expect(wordSetParagraphFormat(editor, { keepNext: false })).toBe(false);
  });
  it('reads shared body style definitions when formatting a header/footer without local definitions', () => {
    const editor = new Editor({
      element: document.createElement('div'),
      extensions: [
        StarterKit,
        TextStyleKit,
        WordParagraphLayout,
        WordParagraphStyles.configure({ autoUpdate: false, getStyles: () => styles }),
      ],
      content: materializeStudioWordStyles(
        {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              attrs: { paragraphStyle: 'review' },
              content: [{ type: 'text', text: 'Header' }],
            },
          ],
        },
        styles
      ),
    });
    editors.push(editor);
    expect(wordSelectionParagraphFormat(editor)).toMatchObject({ indentLeft: 8, lineHeight: 1.5 });
    expect(wordSetParagraphFormat(editor, { indentLeft: 24 })).toBe(true);
    expect(wordSelectionParagraphFormat(editor).indentLeft).toBe(24);
    expect(editor.state.doc.attrs.paragraphStyles).toBeNull();
    editor.commands.undo();
    expect(wordSelectionParagraphFormat(editor).indentLeft).toBe(8);
  });
  it('validates signed twip distances and independent multiple/point line units', () => {
    expect(wordParagraphNumber('-0.05', 'indentFirstLine')).toBe(-0.05);
    expect(wordParagraphNumber('-1', 'spaceBefore')).toBeNull();
    expect(wordParagraphNumber('.03', 'indentLeft')).toBeNull();
    expect(wordParagraphNumber('20', 'lineHeight', 'auto')).toBeNull();
    expect(wordParagraphNumber('20', 'lineHeight', 'exact')).toBe(20);
    expect(wordParagraphNumber('0', 'lineHeight', 'exact')).toBeNull();
    expect(wordParagraphNumber('Infinity', 'indentLeft')).toBeNull();
  });
  it('applies all selected paragraphs/headings atomically without changing text, links or run formatting', () => {
    const editor = fixture();
    editor.commands.setTextSelection({ from: 1, to: 12 });
    const original = editor.getJSON();
    const initialDepth = undoDepth(editor.state);
    expect(wordSelectionParagraphFormat(editor).indentLeft).toBeNull();
    wordSetParagraphFormat(editor, {
      indentLeft: 30,
      indentRight: 10,
      indentFirstLine: -12,
      spaceBefore: 6,
      spaceAfter: 9,
      lineHeightRule: 'exact',
      lineHeight: 24,
    });
    expect(undoDepth(editor.state)).toBe(initialDepth + 1);
    for (const { node } of wordSelectedParagraphs(editor))
      expect(node.attrs).toMatchObject({
        indentLeft: 30,
        indentRight: 10,
        indentFirstLine: -12,
        spaceBefore: 6,
        spaceAfter: 9,
        lineHeightRule: 'exact',
        lineHeight: 24,
      });
    expect(editor.getJSON().content![0].content).toEqual(original.content![0].content);
    editor.commands.undo();
    expect(editor.getJSON()).toEqual(original);
    editor.commands.redo();
    expect(wordSelectionParagraphFormat(editor).lineHeight).toBe(24);
  });
  it('keeps each first-line position when a hanging indent moves the selected paragraph bodies', () => {
    const editor = fixture();
    editor.commands.setTextSelection({ from: 1, to: 12 });
    wordSetParagraphFormat(editor, (current) => ({
      indentLeft: 30,
      indentFirstLine: current.indentLeft + current.indentFirstLine - 30,
    }));
    const nodes = wordSelectedParagraphs(editor);
    expect(nodes.map(({ node }) => node.attrs.indentFirstLine)).toEqual([-18, -14]);
    expect(nodes.map(({ node }) => node.attrs.indentLeft + node.attrs.indentFirstLine)).toEqual([
      12, 16,
    ]);
  });
  it('rejects invalid mixed batches before mutation and guards read-only editing', () => {
    const editor = fixture();
    editor.commands.setTextSelection({ from: 1, to: 12 });
    const original = editor.getJSON();
    expect(() =>
      wordSetParagraphFormat(editor, { indentLeft: 50, lineHeight: 20, lineHeightRule: 'auto' })
    ).toThrow();
    expect(editor.getJSON()).toEqual(original);
    editor.setEditable(false);
    expect(wordSetParagraphFormat(editor, { indentLeft: 50 })).toBe(false);
    expect(editor.getJSON()).toEqual(original);
  });
  it('preserves explicit matching zero and line-rule overrides when the linked style changes', () => {
    const editor = fixture();
    editor.commands.setTextSelection({ from: 1, to: 6 });
    wordSetParagraphFormat(editor, {
      indentFirstLine: 0,
      spaceBefore: 0,
      lineHeight: 1.5,
      lineHeightRule: 'auto',
    });
    wordSetParagraphStyles(editor, [
      {
        id: 'review',
        name: 'Review',
        paragraph: {
          indentLeft: 32,
          indentFirstLine: 24,
          spaceBefore: 12,
          lineHeightRule: 'exact',
          lineHeight: 18,
        },
      },
    ]);
    expect(editor.getJSON().content![0].attrs).toMatchObject({
      indentLeft: 32,
      indentFirstLine: 0,
      spaceBefore: 0,
      lineHeightRule: 'auto',
      lineHeight: 1.5,
    });
  });
  it('preserves native raw-unit inheritance for styles with an own rule or own value only', () => {
    const initial: StudioWordParagraphStyle[] = [
      { id: 'base', name: 'Base', paragraph: { lineHeight: 2, lineHeightRule: 'auto' } },
      { id: 'rule', name: 'Rule', basedOn: 'base', paragraph: { lineHeightRule: 'exact' } },
      {
        id: 'value',
        name: 'Value',
        basedOn: 'base',
        paragraph: { lineHeight: 1.5, lineHeightBasis: 'auto' },
      },
    ];
    expect(resolveStudioWordParagraphStyle(initial, 'rule').paragraph).toMatchObject({
      lineHeightRule: 'exact',
      lineHeight: 24,
    });
    const changed = initial.map((style) =>
      style.id === 'base'
        ? { ...style, paragraph: { lineHeightRule: 'exact' as const, lineHeight: 18 } }
        : style
    );
    expect(resolveStudioWordParagraphStyle(changed, 'value').paragraph).toMatchObject({
      lineHeightRule: 'exact',
      lineHeight: 18,
    });
  });
  it('converts direct native line values when only their inherited rule changes', () => {
    const previous: StudioWordParagraphStyle[] = [
      { id: 'base', name: 'Base', paragraph: { lineHeight: 1.5, lineHeightRule: 'auto' } },
    ];
    const root: StudioRichNode = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: {
            paragraphStyle: 'base',
            paragraphStyleMaterialized: true,
            lineHeight: 2,
            lineHeightRule: 'auto',
            paragraphStyleDirectAttrs: ['lineHeight'],
          },
          content: [{ type: 'text', text: 'raw units' }],
        },
      ],
    };
    const next = reconcileStudioWordStyles(root, previous, [
      { id: 'base', name: 'Base', paragraph: { lineHeight: 18, lineHeightRule: 'exact' } },
    ]);
    expect(next.content![0].attrs).toMatchObject({ lineHeightRule: 'exact', lineHeight: 24 });
  });
});
