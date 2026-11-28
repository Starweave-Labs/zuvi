import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Editor, type Content, type JSONContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { undoDepth } from '@tiptap/pm/history';
import { wordFindMatches, wordReplaceMatches, WordImage } from './studio-word-tools';

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
  editors.forEach((editor) => editor.destroy());
  editors.length = 0;
  vi.restoreAllMocks();
});

const PNG_1PX =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y3nRmwAAAAASUVORK5CYII=';

function editorWith(content: Content) {
  const editor = new Editor({
    element: document.createElement('div'),
    extensions: [StarterKit, WordImage],
    content,
  });
  editors.push(editor);
  return editor;
}
const doc = (...paragraphs: JSONContent[]): JSONContent => ({
  type: 'doc',
  content: paragraphs,
});
const paragraph = (text: string): JSONContent => ({
  type: 'paragraph',
  content: [{ type: 'text', text }],
});
const matchTexts = (editor: Editor, ...args: Parameters<typeof wordFindMatches>) =>
  wordFindMatches(...args).map((match) => editor.state.doc.textBetween(match.from, match.to));

describe('Word find whole-word matching', () => {
  it('keeps plain literal search results without the option (regression)', () => {
    const editor = editorWith(doc(paragraph('cat catalog scat cat')));
    expect(matchTexts(editor, editor, 'cat')).toEqual(['cat', 'cat', 'cat', 'cat']);
    // 未传 options / 传空 options 的旧调用形态行为不变
    expect(matchTexts(editor, editor, 'cat', false, undefined, {})).toEqual([
      'cat',
      'cat',
      'cat',
      'cat',
    ]);
    expect(wordFindMatches(editor, 'CAT')).toHaveLength(4);
    expect(wordFindMatches(editor, '')).toEqual([]);
    expect(wordFindMatches(editor, 'x'.repeat(5001))).toEqual([]);
  });

  it('excludes matches whose sides touch word characters', () => {
    const editor = editorWith(doc(paragraph('cat catalog scat cat')));
    const whole = wordFindMatches(editor, 'cat', false, undefined, { wholeWord: true });
    expect(matchTexts(editor, editor, 'cat', false, undefined, { wholeWord: true })).toEqual([
      'cat',
      'cat',
    ]);
    // 文本起止视为边界：首段 "cat"（from=1）与末尾 "cat" 命中，其余排除
    expect(whole.map((match) => [match.from, match.to])).toEqual([
      [1, 4],
      [18, 21],
    ]);
    expect(undoDepth(editor.state)).toBe(0);
  });

  it('treats CJK characters as independent word boundaries', () => {
    // 纯 CJK 环境：每个 CJK 字符都是独立边界，整词匹配退化为普通匹配
    const cjk = editorWith(doc(paragraph('中文测试中文测试')));
    expect(matchTexts(cjk, cjk, '中文')).toEqual(['中文', '中文']);
    expect(matchTexts(cjk, cjk, '中文', false, undefined, { wholeWord: true })).toEqual([
      '中文',
      '中文',
    ]);
    // 英文查询紧邻 CJK 字符：CJK 是合法边界，仍然命中
    const mixed = editorWith(doc(paragraph('中文cat中文 英文catx英文')));
    expect(matchTexts(mixed, mixed, 'cat', false, undefined, { wholeWord: true })).toEqual(['cat']);
    // 紧邻 ASCII 词字符仍按 \w 规则排除（"中文x" 中的 x 是词字符）
    const blocked = editorWith(doc(paragraph('中文 中文x')));
    expect(matchTexts(blocked, blocked, '中文')).toEqual(['中文', '中文']);
    expect(matchTexts(blocked, blocked, '中文', false, undefined, { wholeWord: true })).toEqual([
      '中文',
    ]);
  });

  it('combines whole-word with match case and format criteria', () => {
    const editor = editorWith(
      doc({
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Cat', marks: [{ type: 'bold' }] },
          { type: 'text', text: ' cat catx' },
        ],
      })
    );
    // 文本 "Cat cat catx"：整词命中 Cat(0) 与 cat(4)，"catx" 内排除
    expect(wordFindMatches(editor, 'Cat', false, undefined, { wholeWord: true })).toHaveLength(2);
    // 与格式组合：仅保留加粗的 Cat(0)
    const wholeBold = wordFindMatches(editor, 'Cat', false, { bold: true }, { wholeWord: true });
    expect(wholeBold).toHaveLength(1);
    expect(wholeBold[0]).toMatchObject({ from: 1, to: 4 });
    expect(wordFindMatches(editor, 'Cat', false, { italic: true }, { wholeWord: true })).toEqual(
      []
    );
    // 与大小写组合：matchCase 时小写 "cat" 不再命中 "Cat"
    expect(wordFindMatches(editor, 'cat', true, undefined, { wholeWord: true })).toHaveLength(1);
    expect(wordFindMatches(editor, 'Cat', true, undefined, { wholeWord: true })).toHaveLength(1);
    expect(wordFindMatches(editor, 'CAT', true, undefined, { wholeWord: true })).toEqual([]);
  });

  it('treats inline atoms as word boundaries', () => {
    const editor = editorWith(
      doc({
        type: 'paragraph',
        content: [
          { type: 'text', text: 'cat' },
          { type: 'image', attrs: { src: PNG_1PX, width: 8, height: 8 } },
          { type: 'text', text: 's' },
        ],
      })
    );
    // "cat" 后紧跟图片占位符（\ufffc），占位符不是词字符 → 仍算整词
    expect(wordFindMatches(editor, 'cat', false, undefined, { wholeWord: true })).toHaveLength(1);
  });

  it('spans styled runs and replaces whole-word matches in one undoable transaction', () => {
    const editor = editorWith(doc(paragraph('cat catalog catx cat')));
    const matches = wordFindMatches(editor, 'cat', false, undefined, { wholeWord: true });
    expect(matches).toHaveLength(2);
    expect(wordReplaceMatches(editor, matches, 'dog')).toBe(true);
    expect(editor.state.doc.textContent).toBe('dog catalog catx dog');
    expect(undoDepth(editor.state)).toBe(1);
    editor.commands.undo();
    expect(editor.state.doc.textContent).toBe('cat catalog catx cat');
  });
});

describe('Word find tab special character', () => {
  it('matches literal tab characters stored in text nodes', () => {
    // Word 编辑器中 tab 以普通文本 '\t' 存储（wordInsertTab / 装饰扫描均按字面 tab 处理）
    const editor = editorWith(doc(paragraph('col1\tcol2'), paragraph('a\tb')));
    const matches = wordFindMatches(editor, 'col1\tcol2');
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({ from: 1, to: 10, text: 'col1\tcol2' });
    expect(wordFindMatches(editor, 'a\tb')).toHaveLength(1);
    // tab 本身不是词字符，整词模式下按边界规则正常判断
    expect(wordFindMatches(editor, 'col1\tcol2', false, undefined, { wholeWord: true })).toEqual(
      matches
    );
    expect(wordFindMatches(editor, '\t')).toHaveLength(2);
  });

  it('does not match newlines across paragraphs (documented remaining gap)', () => {
    const editor = editorWith(doc(paragraph('a'), paragraph('b')));
    expect(wordFindMatches(editor, 'a\nb')).toEqual([]);
  });

  it('replaces a tab match with plain text in one transaction', () => {
    const editor = editorWith(doc(paragraph('名称\t值')));
    const matches = wordFindMatches(editor, '\t');
    expect(matches).toHaveLength(1);
    expect(wordReplaceMatches(editor, matches, '：')).toBe(true);
    expect(editor.state.doc.textContent).toBe('名称：值');
    expect(undoDepth(editor.state)).toBe(1);
    editor.commands.undo();
    expect(editor.state.doc.textContent).toBe('名称\t值');
  });
});
