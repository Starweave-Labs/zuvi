import { afterEach, describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { TextStyleKit } from '@tiptap/extension-text-style';
import { undoDepth } from '@tiptap/pm/history';
import { WordParagraphLayout } from './studio-word-paragraph-layout';
import { WordParagraphStyles, wordSetParagraphStyles } from './studio-word-style-extension';
import { WordTabs, wordEffectiveTabStops, wordSetTabStops } from './studio-word-tab-extension';
import { materializeStudioWordStyles } from './studio-word-styles';
import type { StudioRichNode, StudioWordParagraphStyle } from './studio-types';
import { wordMergeTabStops, wordNextTab, wordTabStops, wordDecimalSymbol, wordDefaultTabStop } from './studio-word-tabs';
const editors: Editor[] = [];
afterEach(() => { editors.forEach((editor) => editor.destroy()); editors.length = 0; });

describe('Word native tab definitions and alignment', () => {
  it('uses the native decimal symbol and refuses coercion or unsupported symbols', () => {
    expect(wordDecimalSymbol(undefined)).toBe('.');
    expect(wordDecimalSymbol('.')).toBe('.');
    expect(wordDecimalSymbol(',')).toBe(',');
    for(const symbol of [';',null,{toString:()=>'.'}])expect(()=>wordDecimalSymbol(symbol)).toThrow();
  });
  it('validates default intervals before measurement or native writing', () => {
    expect(wordDefaultTabStop(undefined)).toBe(36);
    expect(wordDefaultTabStop(30.05)).toBe(30.05);
    for (const value of [0,30.03,Infinity,'30',null])expect(()=>wordDefaultTabStop(value)).toThrow();
  });
  it('preserves native precision, sorted stops and explicit clear directives', () => {
    expect(wordTabStops([
      { position: 72.05, alignment: 'right', leader: 'dot' },
      { position: 36, alignment: 'clear' },
    ])).toEqual([
      { position: 36, alignment: 'clear' },
      { position: 72.05, alignment: 'right', leader: 'dot' },
    ]);
    for (const entry of [
      { position: '36', alignment: 'left' },
      { position: 36.03, alignment: 'left' },
      { position: Infinity, alignment: 'left' },
      { position: 36, alignment: 'bar' },
      { position: 36, alignment: 'left', leader: 'unknown' },
      { position: 36, alignment: 'left', ignored: true },
    ]) expect(() => wordTabStops([entry])).toThrow();
    expect(() => wordTabStops([{ position: 36, alignment: 'left' }, { position: 36, alignment: 'right' }])).toThrow();
  });
  it('merges inherited positions without losing removals or changing the source', () => {
    const base = [{ position: 36, alignment: 'left' }, { position: 72, alignment: 'center' }];
    expect(wordMergeTabStops(base, [{ position: 36, alignment: 'clear' }, { position: 108, alignment: 'right' }])).toEqual([
      { position: 36, alignment: 'clear' }, { position: 72, alignment: 'center' }, { position: 108, alignment: 'right' },
    ]);
    expect(base[0].alignment).toBe('left');
  });
  it('aligns left, center, right and decimals using the width of following text', () => {
    for (const [alignment, width] of [['left', 90], ['center', 70], ['right', 50], ['decimal', 60]] as const)
      expect(wordNextTab([{ position: 100, alignment, leader: 'dot' }], 10, 40, 30)).toMatchObject({ position: 100, width, leader: 'dot' });
    expect(wordNextTab([{ position: 100, alignment: 'decimal' }], 10, 40).width).toBe(50);
  });
  it('skips stops behind the insertion point or too short for aligned text and honors cleared defaults', () => {
    expect(wordNextTab([{ position: 36, alignment: 'right' }, { position: 72, alignment: 'center' }], 30, 20).width).toBe(32);
    expect(wordNextTab([{ position: 36, alignment: 'clear' }], 0, 0)).toMatchObject({ position: 72, width: 72 });
    expect(wordNextTab([], 36, 0)).toMatchObject({ position: 72, width: 36 });
    expect(wordNextTab([{ position: 100, alignment: 'left' }], 104, 0)).toMatchObject({ position: 108, width: 4 });
  });
  it('applies a position delta to mixed paragraphs in one transaction and preserves text, marks and other stops', () => {
    const editor = new Editor({ element: document.createElement('div'), extensions: [StarterKit, TextStyleKit, WordParagraphLayout, WordParagraphStyles, WordTabs],
      content: { type: 'doc', content: [36, 72].map((position) => ({ type: 'paragraph', attrs: { tabStops: [{ position, alignment: 'left' }] }, content: [{ type: 'text', text: 'A\tB', marks: [{ type: 'bold' }] }] })) } });
    editors.push(editor);
    editor.commands.setTextSelection({ from: 1, to: editor.state.doc.content.size - 1 });
    const original = editor.getJSON(), depth = undoDepth(editor.state);
    wordSetTabStops(editor, { clearAll: false, stops: [{ position: 120, alignment: 'decimal', leader: 'dot' }] });
    expect(undoDepth(editor.state)).toBe(depth + 1);
    expect(editor.getJSON().content!.map((p) => p.attrs!.tabStops.map((s: { position: number }) => s.position))).toEqual([[36,120],[72,120]]);
    expect(editor.getJSON().content![0].content).toEqual(original.content![0].content);
    expect(wordSetTabStops(editor, { clearAll: false, stops: [{ position: 120, alignment: 'decimal', leader: 'dot' }] })).toBe(false);
    editor.commands.undo(); expect(editor.getJSON()).toEqual(original);
    editor.commands.redo(); expect(editor.state.doc.textContent).toBe('A\tBA\tB');
    const changed = editor.getJSON(); editor.setEditable(false);
    expect(wordSetTabStops(editor, { clearAll: true, stops: [] })).toBe(false);
    expect(editor.getJSON()).toEqual(changed);
  });
  it('preserves native direct deltas during style changes and clears inherited positions explicitly', () => {
    const styles: StudioWordParagraphStyle[] = [{ id: 'tabs', name: 'Tabs', tabStops: [{ position: 36, alignment: 'left' }, { position: 72, alignment: 'right', leader: 'dot' }] }];
    const content: StudioRichNode = { type: 'doc', attrs: { paragraphStyles: styles }, content: [{ type: 'paragraph', attrs: { paragraphStyle: 'tabs', tabStops: [{ position: 36, alignment: 'clear' }] }, content: [{ type: 'text', text: 'A\tB' }] }] };
    const editor = new Editor({ element: document.createElement('div'), extensions: [StarterKit, TextStyleKit, WordParagraphLayout, WordParagraphStyles, WordTabs], content: materializeStudioWordStyles(content, styles) });
    editors.push(editor);
    expect(wordEffectiveTabStops(editor, editor.state.doc.firstChild!)).toEqual([{ position: 36, alignment: 'clear' }, { position: 72, alignment: 'right', leader: 'dot' }]);
    wordSetParagraphStyles(editor, [{ ...styles[0], tabStops: [{ position: 36, alignment: 'center' }, { position: 72, alignment: 'left' }, { position: 108, alignment: 'decimal' }] }]);
    expect(wordEffectiveTabStops(editor, editor.state.doc.firstChild!).map((stop) => stop.alignment)).toEqual(['clear','left','decimal']);
    wordSetTabStops(editor, { clearAll: true, stops: [] });
    expect(wordEffectiveTabStops(editor, editor.state.doc.firstChild!).every((stop) => stop.alignment === 'clear')).toBe(true);
    editor.commands.undo(); expect(wordEffectiveTabStops(editor, editor.state.doc.firstChild!).at(-1)?.alignment).toBe('decimal');
  });
  it('updates an automatic style and its other linked paragraphs in the same undo transaction', () => {
    const styles: StudioWordParagraphStyle[] = [{ id:'autoTabs', name:'Auto tabs', autoUpdate:true, tabStops:[{position:72,alignment:'left'}] }];
    const content: StudioRichNode = {type:'doc',attrs:{paragraphStyles:styles},content:['First','Second'].map((text)=>({type:'paragraph',attrs:{paragraphStyle:'autoTabs'},content:[{type:'text',text}]}))};
    const editor=new Editor({element:document.createElement('div'),extensions:[StarterKit,TextStyleKit,WordParagraphLayout,WordParagraphStyles,WordTabs],content:materializeStudioWordStyles(content,styles)});
    editors.push(editor); const original=editor.getJSON();
    wordSetTabStops(editor,{clearAll:false,stops:[{position:120,alignment:'right',leader:'dot'}]});
    expect(editor.getJSON().attrs?.paragraphStyles[0].tabStops).toHaveLength(2);
    for(const node of [editor.state.doc.child(0),editor.state.doc.child(1)]){
      expect(wordEffectiveTabStops(editor,node).at(-1)?.position).toBe(120);
      expect(node.attrs.tabStops).toBeNull();
    }
    editor.commands.undo();expect(editor.getJSON()).toEqual(original);
  });
});
