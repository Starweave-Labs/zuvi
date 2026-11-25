export interface StudioWordTabStop {
  /** Distance from the text area's left edge, in points; native precision is one twip. */
  position: number;
  alignment: 'left' | 'center' | 'right' | 'decimal' | 'clear';
  leader?: 'none' | 'dot' | 'hyphen' | 'underscore' | 'middleDot';
}

export const WORD_DEFAULT_TAB = 36;
export const WORD_TAB_LIMIT = 64;
export const WORD_TAB_MAX = 1584;
export function wordDefaultTabStop(value: unknown): number {
  if (value === undefined) return WORD_DEFAULT_TAB;
  if (typeof value !== 'number' || value <= 0 || value > WORD_TAB_MAX || !Number.isInteger(value * 20))
    throw new Error('默认制表间隔须为 0.05–1584pt，步长 0.05pt。');
  return value;
}
export function wordDecimalSymbol(value: unknown): '.' | ',' {
  if (value === undefined || value === '.') return '.';
  if (value === ',') return ',';
  throw new Error('小数点制表位仅支持点号或逗号小数符号。');
}

/** Native tab definitions are deltas: a clear directive removes an inherited stop. */
export function wordTabStops(input: unknown): StudioWordTabStop[] {
  if (input == null) return [];
  if (!Array.isArray(input) || input.length > WORD_TAB_LIMIT)
    throw new Error(`每个段落最多支持 ${WORD_TAB_LIMIT} 个制表位。`);
  const positions = new Set<number>();
  return input.map((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry))
      throw new Error('制表位格式无效。');
    if (Object.keys(entry).some((key) => !['position', 'alignment', 'leader'].includes(key)))
      throw new Error('制表位包含不支持的属性。');
    const { position, alignment, leader } = entry;
    if (
      typeof position !== 'number' || !Number.isFinite(position) ||
      position < 0 || position > WORD_TAB_MAX ||
      Math.abs(position * 20 - Math.round(position * 20)) > 1e-6
    ) throw new Error(`制表位须为 0–${WORD_TAB_MAX}pt，步长 0.05pt。`);
    const rounded = Math.round(position * 20) / 20;
    if (positions.has(rounded)) throw new Error('制表位位置不能重复。');
    positions.add(rounded);
    if (!['left', 'center', 'right', 'decimal', 'clear'].includes(alignment))
      throw new Error('制表位对齐方式无效。');
    if (leader !== undefined && !['none', 'dot', 'hyphen', 'underscore', 'middleDot'].includes(leader))
      throw new Error('制表位前导符无效。');
    return { position: rounded, alignment, ...(leader !== undefined ? { leader } : {}) };
  }).sort((a, b) => a.position - b.position);
}

export function wordMergeTabStops(base: unknown, own: unknown): StudioWordTabStop[] {
  const map = new Map(wordTabStops(base).map((stop) => [stop.position, stop]));
  for (const stop of wordTabStops(own)) map.set(stop.position, stop);
  if (map.size > WORD_TAB_LIMIT) throw new Error('继承后的制表位数量超过限制。');
  return [...map.values()].sort((a, b) => a.position - b.position);
}

/** Choose the next reachable alignment target; default stops follow the last custom stop. */
export function wordNextTab(
  stops: readonly StudioWordTabStop[],
  current: number,
  followingWidth: number,
  decimalWidth = followingWidth,
  interval = WORD_DEFAULT_TAB
) {
  if (![current, followingWidth, decimalWidth, interval].every(Number.isFinite) || interval <= 0)
    throw new Error('制表位度量无效。');
  const offset = (stop: StudioWordTabStop) =>
    stop.alignment === 'center' ? followingWidth / 2 :
      stop.alignment === 'right' ? followingWidth :
        stop.alignment === 'decimal' ? decimalWidth : 0;
  for (const stop of stops) {
    if (stop.alignment === 'clear') continue;
    const start = stop.position - offset(stop);
    if (start > current + 0.01) return { ...stop, width: start - current };
  }
  const last = Math.max(0, ...stops.filter((stop) => stop.alignment !== 'clear').map((stop) => stop.position));
  let position = (Math.floor(Math.max(current, last) / interval) + 1) * interval;
  while (stops.some((stop) => stop.alignment === 'clear' && stop.position === position)) position += interval;
  return { position, alignment: 'left' as const, leader: 'none' as const, width: position - current };
}
