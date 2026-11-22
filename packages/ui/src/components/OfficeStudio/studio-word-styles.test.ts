import { describe, expect, it } from 'vitest';
import type { StudioRichNode, StudioWordParagraphStyle } from './studio-types';
import {
  getStudioWordParagraphStyles,
  materializeStudioWordStyles,
  reconcileStudioWordStyles,
  removeStudioWordStyle,
  resolveStudioWordParagraphStyle,
  validateStudioWordParagraphStyles,
} from './studio-word-styles';

const styles: StudioWordParagraphStyle[] = [
  {
    id: 'review',
    name: '评审正文',
    run: { fontSize: 14, bold: true, color: '#185adb' },
    paragraph: { lineHeight: 1.5, spaceAfter: 12 },
  },
  { id: 'summary', name: '评审摘要', basedOn: 'review', run: { italic: true }, next: 'review' },
];
const paragraph = (size = 14, bold = true): StudioRichNode => ({
  type: 'paragraph',
  attrs: {
    paragraphStyle: 'review',
    paragraphStyleMaterialized: true,
    lineHeight: 1.5,
    spaceAfter: 12,
  },
  content: [
    {
      type: 'text',
      text: '评审内容',
      marks: [
        ...(bold ? [{ type: 'bold' }] : []),
        {
          type: 'textStyle',
          attrs: { fontFamily: 'Noto Sans SC', fontSize: `${size}pt`, color: '#185adb' },
        },
      ],
    },
  ],
});

describe('Word named style contracts', () => {
  it('resolves inheritance, next-paragraph styles and an explicit body level based on a heading', () => {
    const resolved = resolveStudioWordParagraphStyle(
      validateStudioWordParagraphStyles(styles),
      'summary'
    );
    expect(resolved).toMatchObject({
      next: 'review',
      run: { fontSize: 14, bold: true, italic: true, color: '#185adb' },
      paragraph: { lineHeight: 1.5, spaceAfter: 12 },
    });
    expect(
      resolveStudioWordParagraphStyle(
        [{ id: 'body', name: '普通提示', basedOn: 'heading-1', headingLevel: 0 }],
        'body'
      ).headingLevel
    ).toBe(0);
  });

  it('rejects cycles, unknown references, duplicate names and invalid dimensions before any mutation', () => {
    expect(() =>
      validateStudioWordParagraphStyles([
        { id: 'a', name: '甲', basedOn: 'b' },
        { id: 'b', name: '乙', basedOn: 'a' },
      ])
    ).toThrow(/循环/);
    expect(() =>
      validateStudioWordParagraphStyles([{ id: 'a', name: '甲', next: 'missing' }])
    ).toThrow(/后续/);
    expect(() =>
      validateStudioWordParagraphStyles([
        { id: 'a', name: '甲' },
        { id: 'b', name: '甲' },
      ])
    ).toThrow(/唯一/);
    expect(() =>
      validateStudioWordParagraphStyles([{ id: 'a', name: '甲', run: { fontSize: NaN } }])
    ).toThrow(/字号/);
    expect(() =>
      validateStudioWordParagraphStyles([
        { id: 'a', name: '甲', run: { fontFamily: 'Arial\nSerif' } },
      ])
    ).toThrow(/字体/);
    expect(() =>
      validateStudioWordParagraphStyles([{ id: 'a', name: '甲', paragraph: { lineHeight: 0 } }])
    ).toThrow(/行距/);
  });

  it('updates linked runs while preserving explicit font size and negative bold overrides', () => {
    const root: StudioRichNode = { type: 'doc', content: [paragraph(), paragraph(18, false)] };
    const original = JSON.stringify(root);
    const changed = styles.map((style) =>
      style.id === 'review'
        ? {
            ...style,
            run: { ...style.run, fontSize: 20 },
            paragraph: { ...style.paragraph, spaceAfter: 18 },
          }
        : style
    );
    const result = reconcileStudioWordStyles(root, styles, changed);
    const first = result.content![0];
    const second = result.content![1];
    expect(first.attrs?.spaceAfter).toBe(18);
    expect(first.content![0].marks).toContainEqual(
      expect.objectContaining({
        type: 'textStyle',
        attrs: expect.objectContaining({ fontSize: '20pt' }),
      })
    );
    expect(second.content![0].marks).toContainEqual(
      expect.objectContaining({
        type: 'textStyle',
        attrs: expect.objectContaining({ fontSize: '18pt' }),
      })
    );
    expect(second.content![0].marks?.some((mark) => mark.type === 'bold')).toBe(false);
    expect(JSON.stringify(root)).toBe(original);
  });

  it('reparents derived styles without losing the deleted base properties', () => {
    const result = removeStudioWordStyle(styles, 'review');
    expect(result).toHaveLength(1);
    expect(resolveStudioWordParagraphStyle(result, 'summary')).toMatchObject({
      next: 'paragraph',
      run: { fontSize: 14, bold: true, italic: true, color: '#185adb' },
      paragraph: { lineHeight: 1.5, spaceAfter: 12 },
    });
  });

  it('restores regional style bindings when a deleted definition is redone', () => {
    const root: StudioRichNode = { type: 'doc', content: [paragraph()] };
    const deleted = reconcileStudioWordStyles(root, styles, []);
    expect(deleted.content![0].attrs).toMatchObject({
      paragraphStyle: 'paragraph',
      paragraphStyleFallback: 'review',
    });
    const restored = reconcileStudioWordStyles(deleted, [], styles);
    expect(restored.content![0].attrs?.paragraphStyle).toBe('review');
    expect(restored.content![0].attrs?.paragraphStyleFallback).toBeUndefined();
    expect(restored.content![0].content![0].marks).toContainEqual(
      expect.objectContaining({
        type: 'textStyle',
        attrs: expect.objectContaining({ fontSize: '14pt' }),
      })
    );
  });

  it('preserves explicit clearing of an inherited text background', () => {
    const value = [
      { id: 'base', name: '高亮基础', run: { backgroundColor: '#ffff00' } },
      { id: 'plain', name: '无高亮', basedOn: 'base', run: { backgroundColor: null } },
    ];
    expect(
      resolveStudioWordParagraphStyle(validateStudioWordParagraphStyles(value), 'plain').run
        .backgroundColor
    ).toBeNull();
    expect(
      getStudioWordParagraphStyles({ type: 'doc', attrs: { paragraphStyles: value } })
    ).toHaveLength(2);
  });

  it('applies style links supplied by a host and updates inherited runs after a host edits the definitions', () => {
    const raw: StudioRichNode = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { paragraphStyle: 'review' },
          content: [{ type: 'text', text: '宿主文档' }],
        },
      ],
    };
    const initial = materializeStudioWordStyles(raw, styles);
    expect(initial.content![0].content![0].marks).toContainEqual({ type: 'bold' });
    expect(initial.content![0].content![0].marks).toContainEqual(
      expect.objectContaining({
        type: 'textStyle',
        attrs: expect.objectContaining({ fontSize: '14pt' }),
      })
    );
    const updated = materializeStudioWordStyles(
      initial,
      styles.map((style) =>
        style.id === 'review' ? { ...style, run: { ...style.run, fontSize: 20 } } : style
      )
    );
    expect(updated.content![0].content![0].marks).toContainEqual(
      expect.objectContaining({
        type: 'textStyle',
        attrs: expect.objectContaining({ fontSize: '20pt' }),
      })
    );
    expect(raw.content![0].content![0].marks).toBeUndefined();
  });
});
