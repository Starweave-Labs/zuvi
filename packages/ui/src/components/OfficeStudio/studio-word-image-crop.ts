/** Crop edges are percentages of the original embedded raster, never destructive pixel edits. */
export interface WordImageCrop {
  left: number;
  top: number;
  right: number;
  bottom: number;
}
const edges = ['left', 'top', 'right', 'bottom'] as const;
export function wordImageCrop(value: unknown): WordImageCrop | null {
  if (value == null) return null;
  if (typeof value !== 'object' || Array.isArray(value)) throw new Error('图片裁剪区域无效。');
  const source = value as Record<string, unknown>;
  if (Object.keys(source).some((key) => !edges.includes(key as (typeof edges)[number])))
    throw new Error('图片裁剪属性无效。');
  const crop = Object.fromEntries(
    edges.map((edge) => {
      const amount = source[edge] ?? 0;
      if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0 || amount >= 100)
        throw new Error('裁剪边距须为0到100之间的百分比。');
      return [edge, Math.round(amount * 1000) / 1000];
    })
  ) as unknown as WordImageCrop;
  if (crop.left + crop.right >= 100 || crop.top + crop.bottom >= 100)
    throw new Error('裁剪区域必须保留可见图片。');
  return edges.every((edge) => crop[edge] === 0) ? null : crop;
}
export function wordImageCropGeometry(value: unknown, width: number, height: number) {
  const crop = wordImageCrop(value) ?? { left: 0, top: 0, right: 0, bottom: 0 };
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0)
    throw new Error('图片尺寸无效。');
  const fullWidth = width / (1 - (crop.left + crop.right) / 100);
  const fullHeight = height / (1 - (crop.top + crop.bottom) / 100);
  return {
    width: fullWidth,
    height: fullHeight,
    left: (-fullWidth * crop.left) / 100,
    top: (-fullHeight * crop.top) / 100,
  };
}
