import FormulaParser from 'fast-formula-parser';

export type StudioNumberFormatLocale = 'original' | 'en-US' | 'zh-CN';
type Token = { kind: 'literal' | 'directive' | 'code'; raw: string };
const ssf = (
  FormulaParser as typeof FormulaParser & {
    SSF: {
      format(code: string, value: string | number): string;
      _eval(code: string, value: string | number, options: object, sections: number): string;
      parse_date_code(value: number): { m: number; q: number } | null;
    };
  }
).SSF;
const colors: Record<string, string> = {
  black: '#000000',
  blue: '#0000ff',
  cyan: '#00ffff',
  green: '#00ff00',
  magenta: '#ff00ff',
  red: '#ff0000',
  white: '#ffffff',
  yellow: '#ffff00',
};
const condition = /^(<=|>=|<>|=|<|>)([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)$/i;
const region = /^\$([^\]"[-]*)-([\da-f]+)$/i;

function sections(code: string): Token[][] {
  const result: Token[][] = [[]];
  for (let index = 0; index < code.length;) {
    const first = index;
    const character = code[index];
    let kind: Token['kind'] = 'code';
    if (character === ';') {
      result.push([]);
      index++;
      continue;
    }
    if (character === '"') {
      kind = 'literal';
      index++;
      while (index < code.length && code[index] !== '"') index++;
      if (index === code.length) throw new Error('格式中的引号未闭合。');
      index++;
    } else if (['\\', '_', '*'].includes(character)) {
      kind = 'literal';
      if (index + 1 === code.length) throw new Error('转义、占位或填充符后需要一个字符。');
      index += 1 + String.fromCodePoint(code.codePointAt(index + 1)!).length;
    } else if (character === '[') {
      kind = 'directive';
      index = code.indexOf(']', index + 1);
      if (index < 0) throw new Error('格式中的方括号未闭合。');
      index++;
    } else {
      const tail = code.slice(index);
      const token =
        /^(?:General|AM\/PM|A\/P)/i.exec(tail)?.[0] ??
        /^[ymdhs]+/i.exec(tail)?.[0] ??
        /^E[+-]0+/i.exec(tail)?.[0] ??
        String.fromCodePoint(code.codePointAt(index)!);
      // Date runs are split by letter so minutes/month names retain their context.
      if (/^[ymdhs]+$/i.test(token)) {
        index++;
        while (index < code.length && code[index].toLowerCase() === character.toLowerCase())
          index++;
      } else index += token.length;
    }
    result[result.length - 1].push({ kind, raw: code.slice(first, index) });
  }
  return result;
}

function localeOf(tokens: Token[]) {
  const locale = tokens.find(
    (token) => token.kind === 'directive' && region.test(token.raw.slice(1, -1))
  );
  return locale ? parseInt(region.exec(locale.raw.slice(1, -1))![2], 16) : undefined;
}

function selected(tokens: Token[][], value: string | number): Token[] {
  let numericCount = tokens.length;
  const hasText = tokens[tokens.length - 1].some(
    (token) => token.kind === 'code' && token.raw === '@'
  );
  if (typeof value === 'string')
    return tokens.length === 4 || hasText
      ? tokens[tokens.length - 1]
      : [{ kind: 'code', raw: '@' }];
  if (numericCount < 4 && hasText) numericCount--;
  if (!numericCount) return [{ kind: 'code', raw: 'General' }];
  const conditionAt = (index: number) =>
    tokens[index]?.find(
      (token) => token.kind === 'directive' && condition.test(token.raw.slice(1, -1))
    );
  const c1 = conditionAt(0),
    c2 = conditionAt(1);
  if (c1 || c2) {
    const matches = (token: Token | undefined) => {
      if (!token) return false;
      const [, operator, input] = condition.exec(token.raw.slice(1, -1))!;
      const limit = Number(input);
      return operator === '='
        ? value === limit
        : operator === '<>'
          ? value !== limit
          : operator === '>'
            ? value > limit
            : operator === '<'
              ? value < limit
              : operator === '>='
                ? value >= limit
                : value <= limit;
    };
    if (matches(c1)) return tokens[0];
    if (matches(c2)) return tokens[1];
    return tokens[c1 && c2 ? 2 : 1] ?? [];
  }
  return (
    tokens[value < 0 && numericCount >= 2 ? 1 : value === 0 && numericCount >= 3 ? 2 : 0] ?? []
  );
}

/** Strict authoring validation; imported codes can still use the display fallback. */
export function studioValidateNumberFormat(code: unknown): string {
  if (
    typeof code !== 'string' ||
    !code.trim() ||
    code.length > 255 ||
    Array.from(code).some(
      (character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127
    ) ||
    Array.from(code).some(
      (character) =>
        character.length === 1 &&
        character.charCodeAt(0) >= 0xd800 &&
        character.charCodeAt(0) <= 0xdfff
    )
  )
    throw new Error('格式代码须为 1–255 个字符，且不能包含控制字符。');
  const parts = sections(code);
  if (parts.length > 4) throw new Error('最多支持正数、负数、零和文本四个分节。');
  parts.forEach((part, index) => {
    let conditions = 0;
    for (const token of part) {
      if (token.kind === 'code' && /^[a-z]$/i.test(token.raw) && !/^[ymdhs]$/i.test(token.raw))
        throw new Error('普通文字请用双引号括起；当前不支持该格式标记。');
      if (token.kind !== 'directive') continue;
      const directive = token.raw.slice(1, -1);
      const comparison = condition.exec(directive);
      const locale = region.exec(directive);
      if (comparison) {
        if (
          index > 1 ||
          (index === parts.length - 1 &&
            part.some((item) => item.kind === 'code' && item.raw === '@')) ||
          ++conditions > 1 ||
          !Number.isFinite(Number(comparison[2]))
        )
          throw new Error('条件仅能出现在前两个数值分节，每节最多一个有效条件。');
      } else if (locale) {
        if (![0x409, 0x804].includes(parseInt(locale[2], 16)))
          throw new Error('当前地区预览支持英语（美国）和中文（中国）。');
      } else if (!colors[directive.toLowerCase()] && !/^(?:h{1,2}|m{1,2}|s{1,2})$/i.test(directive))
        throw new Error('不支持的方括号标记，请使用基本颜色、条件、地区或累计时间。');
    }
  });
  try {
    for (const part of parts) {
      const unconditional = part
        .filter((token) => token.kind !== 'directive' || !condition.test(token.raw.slice(1, -1)))
        .map((token) => token.raw)
        .join('');
      for (const value of [1234.56, -1234.56, 0, 45350.75, '文本'])
        studioFormatNumber(unconditional, value);
    }
  } catch {
    throw new Error('格式代码无法解析，请检查数字、日期时间和文字占位符。');
  }
  return code;
}

export function studioNumberFormatWithLocale(
  code: string,
  locale: StudioNumberFormatLocale
): string {
  if (locale === 'original') return code;
  if (locale !== 'en-US' && locale !== 'zh-CN') throw new Error('地区选项无效。');
  const tag = locale === 'zh-CN' ? '0804' : '0409';
  return sections(code)
    .map((part) => {
      let replaced = false;
      const output = part
        .map((token) => {
          const match = token.kind === 'directive' && region.exec(token.raw.slice(1, -1));
          if (!match) return token.raw;
          replaced = true;
          return `[$${match[1]}-${tag}]`;
        })
        .join('');
      return replaced || !part.length ? output : `[$-${tag}]${output}`;
    })
    .join(';');
}

/** Rendering uses the existing SSF engine; locale names are substituted as literals. */
export function studioFormatNumber(code: string, value: number | string): string {
  const parts = sections(code);
  const date = typeof value === 'number' ? ssf.parse_date_code(value) : null;
  let prefix = '\ue000nf';
  while (code.includes(prefix) || String(value).includes(prefix)) prefix += 'x';
  const markers: string[] = [];
  const chosen = selected(parts, value);
  const normalized = (() => {
    const part = chosen;
    const chinese = localeOf(part) === 0x804;
    return part
      .map((token) => {
        const locale = token.kind === 'directive' && region.exec(token.raw.slice(1, -1));
        if (locale) return locale[1] ? `"${locale[1]}"` : '';
        if (token.kind !== 'code') return token.raw;
        if (token.raw.toLowerCase() === 'general') return 'General';
        if (token.raw.codePointAt(0)! > 127) return `"${token.raw}"`;
        if (!chinese || !date) return token.raw;
        if (/^m{3,5}$/i.test(token.raw)) return `"${date.m}月"`;
        if (/^d{3,4}$/i.test(token.raw))
          return `"${token.raw.length === 3 ? '周' : '星期'}${'日一二三四五六'[date.q]}"`;
        if (/^(?:AM\/PM|A\/P)$/i.test(token.raw)) {
          const marker = `${prefix}${markers.length}`;
          markers.push(marker);
          return `${token.raw}"${marker}"`;
        }
        return token.raw;
      })
      .join('');
  })();
  const numericCount =
    parts.length < 4 && parts.at(-1)!.some((token) => token.kind === 'code' && token.raw === '@')
      ? parts.length - 1
      : parts.length;
  let result = !chosen.length
    ? ''
    : /^General$/i.test(normalized)
      ? ssf.format('General', value)
      : value === ''
        ? ''
        : ssf._eval(normalized, value, {}, numericCount);
  for (const marker of markers)
    result = result
      .replace(`AM${marker}`, '上午')
      .replace(`PM${marker}`, '下午')
      .replace(`A${marker}`, '上午')
      .replace(`P${marker}`, '下午');
  return result;
}

export function studioNumberFormatColor(
  code: string | undefined,
  value: string | number | boolean,
  error?: string
): string | undefined {
  if (!code || error || typeof value === 'boolean' || value === '') return;
  try {
    const part = selected(sections(code), value);
    const color = part.find(
      (token) => token.kind === 'directive' && colors[token.raw.slice(1, -1).toLowerCase()]
    );
    return color ? colors[color.raw.slice(1, -1).toLowerCase()] : undefined;
  } catch {
    return;
  }
}
