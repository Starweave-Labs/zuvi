/** Word table fields are calculated in their containing table, independently of sheet formulas. */
export interface WordFormulaCell {
  text: string;
  formula?: string;
}
export type WordFormulaTable = readonly (readonly WordFormulaCell[])[];
export class WordFormulaError extends Error {
  constructor(public readonly code: 'syntax' | 'reference' | 'cycle' | 'division' | 'limit') {
    super(
      {
        syntax: '公式语法无效。',
        reference: '单元格引用超出表格范围。',
        cycle: '公式包含循环引用。',
        division: '公式不能除以零。',
        limit: '公式超过计算范围。',
      }[code]
    );
  }
}
type Value = number | number[];
const fail = (code: WordFormulaError['code']): never => {
  throw new WordFormulaError(code);
};
const scalar = (value: Value): number => (typeof value === 'number' ? value : fail('syntax'));
const finite = (value: number): number => (Number.isFinite(value) ? value : fail('limit'));
const numeric = (text: string): number | null => {
  const clean = text.trim();
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(clean)) return null;
  const value = Number(clean);
  return Number.isFinite(value) ? value : null;
};

/** Preserve the native instruction while separating supported numeric picture switches. */
export function wordFormulaInstruction(instruction: string): {
  expression: string;
  format?: string;
} {
  const source = instruction
    .trim()
    .replace(/\s+\\\*\s+MERGEFORMAT$/i, '')
    .trim();
  const match = /^(.*?)\s+\\#\s+"([^"\r\n]+)"$/.exec(source);
  if (!match) {
    if (source.includes('\\')) fail('syntax');
    return { expression: source };
  }
  if (!/^(?:0|#,##0)(?:\.0{1,10})?%?$/.test(match[2])) fail('syntax');
  return { expression: match[1].trim(), format: match[2] };
}
export function wordFormatFormulaResult(value: number, instruction: string): string {
  const { format } = wordFormulaInstruction(instruction);
  if (!format) return String(value);
  const percent = format.endsWith('%');
  const digits = /\.(0+)/.exec(format)?.[1].length ?? 0;
  const formatted = finite(value * (percent ? 100 : 1)).toFixed(digits);
  const [integer, fraction] = formatted.split('.');
  const grouped = format.startsWith('#,##')
    ? integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    : integer;
  return grouped + (fraction === undefined ? '' : `.${fraction}`) + (percent ? '%' : '');
}

/** Recompute referenced fields rather than using stale visible caches. No expression is executed as code. */
export function wordCalculateTableFormula(
  table: WordFormulaTable,
  row: number,
  column: number,
  formula: string
): number {
  const visiting = new Set<string>();
  const cache = new Map<string, number>();
  let steps = 0;
  const tick = () => {
    if (++steps > 10000) fail('limit');
  };
  const cell = (r: number, c: number): WordFormulaCell => table[r]?.[c] ?? fail('reference');
  const calculateCell = (r: number, c: number): number | null => {
    tick();
    const source = cell(r, c);
    if (!source.formula) return numeric(source.text);
    const key = `${r}:${c}`;
    if (visiting.has(key)) fail('cycle');
    if (cache.has(key)) return cache.get(key)!;
    if (visiting.size > 100) fail('limit');
    visiting.add(key);
    try {
      const value = parse(source.formula, r, c);
      cache.set(key, value);
      return value;
    } finally {
      visiting.delete(key);
    }
  };
  const coordinates = (name: string): [number, number] => {
    const match = /^([A-Z]+)([1-9]\d*)$/.exec(name);
    if (!match) return fail('syntax');
    let c = 0;
    for (const letter of match[1]) c = c * 26 + letter.charCodeAt(0) - 64;
    const r = Number(match[2]) - 1;
    if (!Number.isSafeInteger(c) || !Number.isSafeInteger(r)) fail('reference');
    cell(r, c - 1);
    return [r, c - 1];
  };
  const parse = (source: string, r: number, c: number): number => {
    if (source.length > 2048) fail('limit');
    const expression = wordFormulaInstruction(source)
      .expression.trim()
      .replace(/^=/, '')
      .toUpperCase();
    const tokens: string[] = [];
    const pattern =
      /\s*(?:(\d+(?:\.\d*)?|\.\d+)(?:E([+-]?\d+))?|([A-Z]+[1-9]\d*|[A-Z]+)|([+\-*/^%(),:]))/gy;
    let offset = 0;
    while (offset < expression.length) {
      pattern.lastIndex = offset;
      const match = pattern.exec(expression);
      if (!match) return fail('syntax');
      tokens.push(match[1] ? match[1] + (match[2] ? `E${match[2]}` : '') : match[3] || match[4]);
      offset = pattern.lastIndex;
    }
    let position = 0,
      depth = 0;
    const take = (token: string) => (tokens[position] === token ? (position++, true) : false);
    const require = (token: string) => {
      if (!take(token)) fail('syntax');
    };
    const direction = (name: string): number[] => {
      const [dr, dc] =
        { ABOVE: [-1, 0], BELOW: [1, 0], LEFT: [0, -1], RIGHT: [0, 1] }[name as 'ABOVE'] ??
        fail('syntax');
      const values: number[] = [];
      let rr = r + dr,
        cc = c + dc;
      while (rr >= 0 && rr < table.length && cc >= 0 && cc < (table[rr]?.length ?? 0)) {
        const value = calculateCell(rr, cc);
        if (value === null && values.length) break;
        if (value !== null) values.push(value);
        rr += dr;
        cc += dc;
      }
      return values;
    };
    const primary = (): Value => {
      tick();
      if (++depth > 100) fail('limit');
      try {
        if (take('(')) {
          const value = sum();
          require(')');
          return value;
        }
        const token = tokens[position++];
        if (!token) return fail('syntax');
        if (/^\d|^\./.test(token)) return finite(Number(token));
        if (/^[A-Z]+[1-9]\d*$/.test(token)) {
          const [rr, cc] = coordinates(token);
          if (!take(':')) return calculateCell(rr, cc) ?? 0;
          const [endRow, endColumn] = coordinates(tokens[position++] || '');
          const values: number[] = [];
          for (let i = Math.min(rr, endRow); i <= Math.max(rr, endRow); i++)
            for (let j = Math.min(cc, endColumn); j <= Math.max(cc, endColumn); j++) {
              const value = calculateCell(i, j);
              if (value !== null) values.push(value);
            }
          return values;
        }
        if (['ABOVE', 'BELOW', 'LEFT', 'RIGHT'].includes(token)) return direction(token);
        require('(');
        const args: Value[] = [];
        if (!take(')')) {
          do {
            args.push(sum());
          } while (take(','));
          require(')');
        }
        const values = args.flat();
        if (token === 'SUM') return finite(values.reduce((a, b) => a + b, 0));
        if (token === 'PRODUCT') return finite(values.reduce((a, b) => a * b, 1));
        if (token === 'COUNT') return values.length;
        if (token === 'AVERAGE')
          return values.length
            ? finite(values.reduce((a, b) => a + b, 0) / values.length)
            : fail('division');
        if (token === 'MIN' || token === 'MAX')
          return values.length ? (token === 'MIN' ? Math.min(...values) : Math.max(...values)) : 0;
        if (token === 'ABS' && args.length === 1) return Math.abs(scalar(args[0]));
        if (token === 'ROUND' && args.length === 2) {
          const digits = scalar(args[1]);
          if (!Number.isInteger(digits) || Math.abs(digits) > 15) fail('limit');
          const scale = 10 ** digits;
          return finite(Math.round(scalar(args[0]) * scale) / scale);
        }
        return fail('syntax');
      } finally {
        depth--;
      }
    };
    const power = (): Value => {
      let value = primary();
      while (take('%')) value = scalar(value) / 100;
      if (take('^')) value = finite(scalar(value) ** scalar(unary()));
      return value;
    };
    let unaryDepth = 0;
    const unary = (): Value => {
      if (++unaryDepth > 100) fail('limit');
      try {
        return take('+') ? scalar(unary()) : take('-') ? -scalar(unary()) : power();
      } finally {
        unaryDepth--;
      }
    };
    const product = (): Value => {
      let value = unary();
      while (tokens[position] === '*' || tokens[position] === '/') {
        const operator = tokens[position++],
          right = scalar(unary());
        if (operator === '/' && right === 0) fail('division');
        value = finite(operator === '*' ? scalar(value) * right : scalar(value) / right);
      }
      return value;
    };
    const sum = (): Value => {
      let value = product();
      while (tokens[position] === '+' || tokens[position] === '-') {
        const operator = tokens[position++],
          right = scalar(product());
        value = finite(operator === '+' ? scalar(value) + right : scalar(value) - right);
      }
      return value;
    };
    const value = scalar(sum());
    if (position !== tokens.length) fail('syntax');
    return finite(value);
  };
  cell(row, column);
  visiting.add(`${row}:${column}`);
  return parse(formula, row, column);
}
