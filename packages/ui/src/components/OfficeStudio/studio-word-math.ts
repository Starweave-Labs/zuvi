/** Semantic equation tree shared by editor, MathML preview and native OMML codecs. */
export type WordMathFormat = { bold?: boolean; italic?: boolean; underline?: boolean; strike?: boolean; fontFamily?: string; fontSize?: string; color?: string; backgroundColor?: string; letterSpacing?: string; baselineShift?: string; script?: 'baseline' | 'superscript' | 'subscript' };
export type WordMathNode =
  | { kind: 'text'; text: string; format?: WordMathFormat }
  | { kind: 'display'; body: WordMathNode; following?: WordMathNode[]; align: 'left' | 'center' | 'right' | 'centerGroup' }
  | { kind: 'row'; children: WordMathNode[] }
  | { kind: 'fraction'; numerator: WordMathNode; denominator: WordMathNode }
  | { kind: 'script'; base: WordMathNode; sub?: WordMathNode; sup?: WordMathNode }
  | { kind: 'radical'; body: WordMathNode; degree?: WordMathNode }
  | { kind: 'matrix'; rows: WordMathNode[][] }
  | { kind: 'delimiter'; left: string; right: string; body: WordMathNode };

export function wordMathTree(input: unknown): WordMathNode {
  let count = 0,
    textLength = 0;
  const seen = new Set<object>();
  const visit = (value: unknown, depth: number): WordMathNode => {
    if (++count > 2048 || depth > 32) throw new Error('公式结构过于复杂。');
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new Error('公式结构无效。');
    if (seen.has(value)) throw new Error('公式结构包含循环引用。');
    seen.add(value);
    try {
      const node = value as Record<string, unknown>;
      const allowed: Record<string, string[]> = {
        text: ['kind', 'text', 'format'],
        display: ['kind', 'body', 'following', 'align'],
        row: ['kind', 'children'],
        fraction: ['kind', 'numerator', 'denominator'],
        script: ['kind', 'base', 'sub', 'sup'],
        radical: ['kind', 'body', 'degree'],
        matrix: ['kind', 'rows'],
        delimiter: ['kind', 'left', 'right', 'body'],
      };
      if (
        typeof node.kind !== 'string' ||
        !allowed[node.kind] ||
        Object.keys(node).some((key) => !allowed[node.kind as string].includes(key))
      )
        throw new Error('公式节点属性无效。');
      const child = (v: unknown) => visit(v, depth + 1);
      switch (node.kind) {
        case 'text':
          if (
            typeof node.text !== 'string' ||
            Array.from(node.text).some(char => { const code = char.codePointAt(0)!; return (code < 32 && ![9, 10, 13].includes(code)) || (code >= 0xd800 && code <= 0xdfff) || code === 0xfffe || code === 0xffff; }) ||
            (textLength += node.text.length) > 20000
          )
            throw new Error('公式文字无效或过长。');
          return { kind: 'text', text: node.text, ...(node.format != null ? { format: wordMathFormat(node.format) } : {}) };

        case 'display':
          if (depth !== 0 || typeof node.align !== 'string' || !['left', 'center', 'right', 'centerGroup'].includes(node.align)) throw new Error('段落公式只能位于公式根节点，并需有效对齐。');
          if (node.following != null && (!Array.isArray(node.following) || node.following.length > 31)) throw new Error('段落公式组最多32个公式。');
          return { kind: 'display', body: child(node.body), ...(Array.isArray(node.following) && node.following.length ? { following: node.following.map(child) } : {}), align: node.align as 'left' | 'center' | 'right' | 'centerGroup' };
        case 'row':
          if (!Array.isArray(node.children) || !node.children.length || node.children.length > 512)
            throw new Error('公式行必须包含有效节点。');
          return { kind: 'row', children: node.children.map(child) };
        case 'fraction':
          return {
            kind: 'fraction',
            numerator: child(node.numerator),
            denominator: child(node.denominator),
          };
        case 'script':
          if (node.sub == null && node.sup == null) throw new Error('上下标结构至少需要一个标记。');
          return {
            kind: 'script',
            base: child(node.base),
            ...(node.sub != null ? { sub: child(node.sub) } : {}),
            ...(node.sup != null ? { sup: child(node.sup) } : {}),
          };
        case 'radical':
          return {
            kind: 'radical',
            body: child(node.body),
            ...(node.degree != null ? { degree: child(node.degree) } : {}),
          };
        case 'matrix': {
          if (!Array.isArray(node.rows) || !node.rows.length || node.rows.length > 32)
            throw new Error('矩阵最多支持32行。');
          const rows = node.rows as unknown[];
          const width = Array.isArray(rows[0]) ? rows[0].length : 0;
          if (
            !width ||
            width > 32 ||
            rows.some((row) => !Array.isArray(row) || row.length !== width)
          )
            throw new Error('矩阵每行必须具有相同的列数，最多32列。');
          return { kind: 'matrix', rows: rows.map((row) => (row as unknown[]).map(child)) };
        }
        case 'delimiter':
          if (
            typeof node.left !== 'string' ||
            typeof node.right !== 'string' ||
            [...node.left].length > 1 ||
            [...node.right].length > 1 ||
            [...node.left, ...node.right].some(char => { const code = char.codePointAt(0)!; return code < 32 || (code >= 0xd800 && code <= 0xdfff) || code === 0xfffe || code === 0xffff; })
          )
            throw new Error('公式括号必须为单个字符。');
          return { kind: 'delimiter', left: node.left, right: node.right, body: child(node.body) };
        default:
          throw new Error('不支持的公式节点。');
      }
    } finally {
      seen.delete(value);
    }
  };
  return visit(input, 0);
}
export function wordMathText(input: unknown): string {
  const render = (node: WordMathNode): string => {
    switch (node.kind) {
      case 'text':
        return node.text;
      case 'display': return [node.body, ...(node.following || [])].map(render).join(' ; ');
      case 'row':
        return node.children.map(render).join('');
      case 'fraction':
        return `(${render(node.numerator)})/(${render(node.denominator)})`;
      case 'script':
        return `${render(node.base)}${node.sub ? `_(${render(node.sub)})` : ''}${node.sup ? `^(${render(node.sup)})` : ''}`;
      case 'radical':
        return `${node.degree ? `root[${render(node.degree)}]` : 'sqrt'}(${render(node.body)})`;
      case 'matrix':
        return `[${node.rows.map((row) => row.map(render).join(', ')).join('; ')}]`;
      case 'delimiter':
        return node.left + render(node.body) + node.right;
    }
  };
  return render(wordMathTree(input));
}
export function wordMathMarkup(input: unknown): string {
  const escape = (value: string) =>
    value.replace(
      /[&<>"']/g,
      (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]!
    );
  const render = (node: WordMathNode): string => {
    switch (node.kind) {
      case 'text':
        return `<mtext${node.format ? ` style="${escape(wordMathFormatCss(node.format))}"` : ''}>${escape(node.text)}</mtext>`;
      case 'display': return node.following?.length ? `<mrow>${[node.body, ...node.following].map(render).join('<mspace width="1em"/>')}</mrow>` : render(node.body);
      case 'row':
        return `<mrow>${node.children.map(render).join('')}</mrow>`;
      case 'fraction':
        return `<mfrac>${render(node.numerator)}${render(node.denominator)}</mfrac>`;
      case 'script':
        return node.sub && node.sup
          ? `<msubsup>${render(node.base)}${render(node.sub)}${render(node.sup)}</msubsup>`
          : `<${node.sub ? 'msub' : 'msup'}>${render(node.base)}${render((node.sub || node.sup)!)}</${node.sub ? 'msub' : 'msup'}>`;
      case 'radical':
        return node.degree
          ? `<mroot>${render(node.body)}${render(node.degree)}</mroot>`
          : `<msqrt>${render(node.body)}</msqrt>`;
      case 'matrix':
        return `<mtable>${node.rows.map((row) => `<mtr>${row.map((cell) => `<mtd>${render(cell)}</mtd>`).join('')}</mtr>`).join('')}</mtable>`;
      case 'delimiter':
        return `<mrow><mo stretchy="true">${escape(node.left)}</mo>${render(node.body)}<mo stretchy="true">${escape(node.right)}</mo></mrow>`;
    }
  };
  const tree = wordMathTree(input);
  return `<math xmlns="http://www.w3.org/1998/Math/MathML"${tree.kind === 'display' ? ` display="block" style="display:flex;justify-content:${tree.align === 'left' ? 'flex-start' : tree.align === 'right' ? 'flex-end' : 'center'};"` : ''}>${render(tree)}</math>`;
}

export function wordMathFormatCss(format: WordMathFormat): string {
  const decorations = [format.underline ? 'underline' : '', format.strike ? 'line-through' : ''].filter(Boolean).join(' ');
  const extra = `${format.fontFamily ? `font-family:${JSON.stringify(format.fontFamily)};` : ''}${format.fontSize ? `font-size:${format.fontSize};` : ''}${format.color ? `color:${format.color};` : ''}${format.backgroundColor ? `background-color:${format.backgroundColor};` : ''}${format.letterSpacing ? `letter-spacing:${format.letterSpacing};` : ''}${format.baselineShift ? `position:relative;top:${-parseFloat(format.baselineShift)}pt;` : ''}${format.script ? `vertical-align:${format.script === 'superscript' ? 'super' : format.script === 'subscript' ? 'sub' : 'baseline'};` : ''}`;
  return extra + `${format.bold != null ? `font-weight:${format.bold ? 'bold' : 'normal'};` : ''}${format.italic != null ? `font-style:${format.italic ? 'italic' : 'normal'};` : ''}${format.underline != null || format.strike != null ? `text-decoration:${decorations || 'none'};` : ''}`;
}

export function wordMathFormat(input: unknown): WordMathFormat {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('公式文字格式无效。');
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (['bold', 'italic', 'underline', 'strike'].includes(key)) {
      if (typeof value !== 'boolean') throw new Error('公式文字格式无效。');
      result[key] = value;
    } else if (key === 'fontFamily') {
      if (typeof value !== 'string' || value.length > 128 || !/^[\p{L}\p{N} _.-]+$/u.test(value)) throw new Error('公式字体无效。');
      result[key] = value;
    } else if (['fontSize', 'letterSpacing', 'baselineShift'].includes(key)) {
      const match = typeof value === 'string' && /^([+-]?(?:\d+(?:\.\d*)?|\.\d+))pt$/.exec(value);
      const amount = match ? Number(match[1]) : NaN;
      const units = amount * (key === 'letterSpacing' ? 20 : 2);
      if (!Number.isFinite(amount) || Math.abs(units - Math.round(units)) > 1e-6 ||
        (key === 'fontSize' ? amount < 1 || amount > 409 : Math.abs(amount) > 500)) throw new Error('公式字号或字符位置无效。');
      result[key] = `${Object.is(amount, -0) ? 0 : amount}pt`;
    } else if (key === 'color' || key === 'backgroundColor') {
      if (typeof value !== 'string' || !/^#[0-9a-f]{6}$/i.test(value)) throw new Error('公式颜色无效。');
      result[key] = value.toLowerCase();
    } else if (key === 'script' && typeof value === 'string' && ['baseline', 'superscript', 'subscript'].includes(value)) {
      result[key] = value;
    } else throw new Error('公式文字格式无效。');
  }
  return result as WordMathFormat;
}
