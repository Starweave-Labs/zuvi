/** Conservative SVG-label width at the component's 11px axis font. */
export function chartTextWidth(text: string): number {
  let width = 0;
  for (const character of Array.from(text)) {
    if (/\p{Mark}/u.test(character)) continue;
    if (/[MW@%]/.test(character)) width += 10;
    else if (/[il.,' :]/.test(character)) width += 4;
    else width += character.codePointAt(0)! > 255 ? 12 : 7;
  }
  return width;
}

/** Only display labels are abbreviated; the tooltip, SVG title and data table keep full text. */
export function chartAxisText(text: string, width: number): string {
  if (chartTextWidth(text) <= width) return text;
  const characters = Array.from(text);
  let result = '';
  for (const character of characters) {
    if (chartTextWidth(result + character + '…') > width) break;
    result += character;
  }
  return result + '…';
}
