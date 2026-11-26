import { expect, it } from 'vitest';
import { wordImageCrop, wordImageCropGeometry } from './studio-word-image-crop';
it('validates percentages and normalizes reset without modifying original data', () => {
  const source = { left: 10.12345, right: 20, top: 5, bottom: 0 };
  expect(wordImageCrop(source)).toEqual({ left: 10.123, right: 20, top: 5, bottom: 0 });
  expect(source.left).toBe(10.12345);
  expect(wordImageCrop({})).toBeNull();
  expect(wordImageCrop(null)).toBeNull();
});
it('rejects hidden, negative, nonfinite, wrong-type and unknown crop regions', () => {
  for (const crop of [
    { left: 100 },
    { left: 50, right: 50 },
    { top: 60, bottom: 40 },
    { left: -1 },
    { top: NaN },
    { right: Infinity },
    { left: '5' },
    { unknown: 2 },
    [],
  ])
    expect(() => wordImageCrop(crop)).toThrow();
});
it('maps the original raster into the visible frame with independent horizontal and vertical crops', () => {
  expect(wordImageCropGeometry({ left: 25, right: 25, top: 10, bottom: 40 }, 200, 100)).toEqual({
    width: 400,
    height: 200,
    left: -100,
    top: -20,
  });
  expect(wordImageCropGeometry(null, 200, 100)).toEqual({
    width: 200,
    height: 100,
    left: -0,
    top: -0,
  });
  expect(() => wordImageCropGeometry(null, 0, 100)).toThrow();
});
