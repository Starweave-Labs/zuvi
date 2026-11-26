import type { StudioWordImageLayout } from './studio-types';
import { wordImageLayoutValid } from './studio-word-image-contract';

export function wordImageLayoutIssue(value: unknown): string | undefined {
  return wordImageLayoutValid(value) ? undefined : '图片布局无效，请检查环绕、位置、间距、锚点及层级。';
}

export function wordImageLayout(value: unknown): StudioWordImageLayout | undefined {
  const issue = wordImageLayoutIssue(value);
  if (issue) throw new Error(issue);
  return value == null ? undefined : (value as StudioWordImageLayout);
}

export { WORD_IMAGE_WRAPS, WORD_IMAGE_HORIZONTAL_BASES, WORD_IMAGE_VERTICAL_BASES, WORD_IMAGE_HORIZONTAL_ALIGN, WORD_IMAGE_VERTICAL_ALIGN, WORD_IMAGE_WRAP_SIDES, WORD_IMAGE_RECTANGLE, wordImageLayoutValid } from './studio-word-image-contract';
