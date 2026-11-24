import { describe, expect, it } from 'vitest';
import { wordDefaultImageLayout, wordImageCss } from './studio-word-image-preview';
import { wordImageLayoutIssue } from './studio-word-images';

describe('Word image positioning contract', () => {
  it('allows every wrapping mode with paragraph and page anchoring', () => {
    for (const wrap of ['square', 'tight', 'through', 'topBottom', 'front', 'behind'] as const) {
      expect(wordImageLayoutIssue(wordDefaultImageLayout(wrap))).toBeUndefined();
      expect(
        wordImageLayoutIssue({
          ...wordDefaultImageLayout(wrap),
          vertical: { relative: 'page', align: 'center' },
        })
      ).toBeUndefined();
    }
  });

  it('rejects invalid positions, unclosed contours and unsafe numeric layout properties', () => {
    const base = wordDefaultImageLayout();
    for (const patch of [
      { horizontal: { relative: 'page', align: 'left', offset: 5 } },
      { vertical: { relative: 'paragraph' } },
      { distance: { left: NaN } },
      { allowOverlap: 'true' },
      { zIndex: 1.5 },
      { zIndex: 4294967296 },
      {
        wrap: 'tight',
        polygon: [
          [0, 0],
          [0, 21600],
          [21600, 0],
          [1, 1],
        ],
      },
    ])
      expect(wordImageLayoutIssue({ ...base, ...patch })).toBeTruthy();
  });

  it('keeps picture contour and image pixels separate in the wrapping preview', () => {
    const style = wordImageCss(
      {
        ...wordDefaultImageLayout('tight'),
        polygon: [
          [0, 0],
          [0, 21600],
          [21600, 21600],
          [0, 0],
        ],
      },
      300,
      150
    );
    expect(style.shapeOutside).toBe('polygon(0% 0%,0% 100%,100% 100%,0% 0%)');
    expect(style.clipPath).toBeUndefined();
    expect(style.float).toBe('right');
    expect(wordImageCss(wordDefaultImageLayout('behind'), 300, 150)).toMatchObject({
      position: 'absolute',
      zIndex: '-1',
    });
  });
});
