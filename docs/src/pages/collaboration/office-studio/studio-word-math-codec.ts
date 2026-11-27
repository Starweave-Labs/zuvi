import {
  wordMathTree,
  wordMathFormat,
  type WordMathNode,
  type WordMathFormat,
} from '../../../../../packages/ui/src/components/OfficeStudio/studio-word-math';
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const M = 'http://schemas.openxmlformats.org/officeDocument/2006/math';
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]!
  );
export function wordMathOmml(input: unknown, inherited: WordMathFormat = {}): string {
  const render = (node: WordMathNode): string => {
    const slot = (name: string, value: WordMathNode) => `<m:${name}>${render(value)}</m:${name}>`;
    switch (node.kind) {
      case 'text':
        { const format = wordMathFormat({ ...inherited, ...node.format });
          let props = ([['bold', 'b'], ['italic', 'i'], ['underline', 'u'], ['strike', 'strike']] as const).map(([key, tag]) =>
            format[key] == null ? '' : `<w:${tag} w:val="${key === 'underline' ? format[key] ? 'single' : 'none' : format[key] ? '1' : '0'}"/>`).join('');
          if (format.fontFamily) props += `<w:rFonts w:ascii="${escape(format.fontFamily)}" w:hAnsi="${escape(format.fontFamily)}" w:eastAsia="${escape(format.fontFamily)}"/>`;
          if (format.fontSize) props += `<w:sz w:val="${parseFloat(format.fontSize) * 2}"/>`;
          if (format.color) props += `<w:color w:val="${format.color.slice(1)}"/>`;
          if (format.backgroundColor) props += `<w:shd w:val="clear" w:fill="${format.backgroundColor.slice(1)}"/>`;
          if (format.letterSpacing) props += `<w:spacing w:val="${Math.round(parseFloat(format.letterSpacing) * 20)}"/>`;
          if (format.baselineShift) props += `<w:position w:val="${Math.round(parseFloat(format.baselineShift) * 2)}"/>`;
          if (format.script) props += `<w:vertAlign w:val="${format.script}"/>`;
          const mathProps = format.bold != null || format.italic != null ? `<m:rPr><m:sty m:val="${format.bold ? format.italic ? 'bi' : 'b' : format.italic ? 'i' : 'p'}"/></m:rPr>` : '';
          return `<m:r>${mathProps}${props ? `<w:rPr>${props}</w:rPr>` : ''}<m:t xml:space="preserve">${escape(node.text).replace(/\r/g, '&#13;')}</m:t></m:r>`;
        }
      case 'display': return render(node.body);
      case 'row':
        return node.children.map(render).join('');
      case 'fraction':
        return `<m:f>${slot('num', node.numerator)}${slot('den', node.denominator)}</m:f>`;
      case 'script': {
        const kind = node.sub && node.sup ? 'sSubSup' : node.sub ? 'sSub' : 'sSup';
        return `<m:${kind}>${slot('e', node.base)}${node.sub ? slot('sub', node.sub) : ''}${node.sup ? slot('sup', node.sup) : ''}</m:${kind}>`;
      }
      case 'radical':
        return `<m:rad><m:radPr><m:degHide m:val="${node.degree ? '0' : '1'}"/></m:radPr>${node.degree ? slot('deg', node.degree) : '<m:deg/>'}${slot('e', node.body)}</m:rad>`;
      case 'matrix':
        return `<m:m><m:mPr/><m:mr>${node.rows[0].map((cell) => slot('e', cell)).join('')}</m:mr>${node.rows
          .slice(1)
          .map((row) => `<m:mr>${row.map((cell) => slot('e', cell)).join('')}</m:mr>`)
          .join('')}</m:m>`;
      case 'delimiter':
        return `<m:d><m:dPr><m:begChr m:val="${escape(node.left)}"/><m:endChr m:val="${escape(node.right)}"/></m:dPr>${slot('e', node.body)}</m:d>`;
    }
  };
  const tree = wordMathTree(input);
  const equation = (tree.kind === 'display' ? [tree.body, ...(tree.following || [])] : [tree]).map(value => `<m:oMath xmlns:m="${M}" xmlns:w="${W}">${render(value)}</m:oMath>`).join('');
  return tree.kind === 'display' ? `<m:oMathPara xmlns:m="${M}" xmlns:w="${W}"><m:oMathParaPr><m:jc m:val="${tree.align}"/></m:oMathParaPr>${equation}</m:oMathPara>` : equation;
}
export function readWordMath(element: Element): WordMathNode {
  // Reject attributes and hidden formatting that this semantic model cannot preserve.
  for (const item of [element, ...Array.from(element.getElementsByTagName('*'))]) {
    if (item.namespaceURI === W) {
      const parent = item.parentElement;
      if (item.localName === 'rPr' && parent?.namespaceURI === M && parent.localName === 'r') {
        if (Array.from(item.childNodes).some(node => (node.nodeType === 3 || node.nodeType === 4) && node.textContent?.trim()) || Array.from(item.attributes).some(attr => attr.namespaceURI !== 'http://www.w3.org/2000/xmlns/')) throw new Error('无效公式文字属性。');
        continue;
      }
      if (!['b', 'i', 'u', 'strike', 'rFonts', 'sz', 'color', 'shd', 'spacing', 'position', 'vertAlign'].includes(item.localName) || parent?.namespaceURI !== W || parent.localName !== 'rPr' || item.children.length || item.textContent?.trim() ||
        Array.from(item.attributes).some(attr => attr.namespaceURI !== 'http://www.w3.org/2000/xmlns/' && (attr.namespaceURI !== W || !(item.localName === 'rFonts' ? ['ascii', 'hAnsi', 'eastAsia'] : item.localName === 'shd' ? ['val', 'fill'] : ['val']).includes(attr.localName)))) throw new Error('不支持的公式文字格式。');
      continue;
    }
    if (item.namespaceURI !== M) throw new Error('不支持的数学公式命名空间。');
    if (item.localName !== 't' && Array.from(item.childNodes).some(node =>
      (node.nodeType === 3 || node.nodeType === 4) && node.textContent?.trim()))
      throw new Error('数学公式包含无法保留的直接文字。');
    for (const attr of Array.from(item.attributes)) {
      if (attr.namespaceURI === 'http://www.w3.org/2000/xmlns/') continue;
      if (item.localName === 't' && attr.namespaceURI === 'http://www.w3.org/XML/1998/namespace' && attr.localName === 'space' && attr.value === 'preserve') continue;
      if (['degHide', 'begChr', 'endChr', 'sty', 'jc'].includes(item.localName) && attr.namespaceURI === M && attr.localName === 'val') continue;
      throw new Error('暂不支持此数学公式的原生属性或格式。');
    }
    if (['degHide', 'begChr', 'endChr', 'sty', 'jc', 't'].includes(item.localName) && item.children.length) throw new Error('无效的数学公式属性节点。');
  }
  let nodes = 0;
  const children = (parent: Element) => Array.from(parent.children);
  const find = (parent: Element, name: string) =>
    children(parent).find((child) => child.namespaceURI === M && child.localName === name);
  const fail = (): never => {
    throw new Error('不支持或无效的原生数学公式结构。');
  };
  const row = (parent: Element, depth: number): WordMathNode => {
    const values = children(parent).map((child) => parse(child, depth + 1));
    return values.length === 1
      ? values[0]
      : values.length
        ? { kind: 'row', children: values }
        : { kind: 'text', text: '' };
  };
  const parse = (item: Element, depth: number): WordMathNode => {
    if (++nodes > 2048 || depth > 32 || item.namespaceURI !== M) fail();
    const allowed: Record<string, string[]> = {
      oMath: [],
      oMathPara: ['oMathParaPr', 'oMath'],
      r: ['t', 'rPr'],
      f: ['fPr', 'num', 'den'],
      sSub: ['sSubPr', 'e', 'sub'],
      sSup: ['sSupPr', 'e', 'sup'],
      sSubSup: ['sSubSupPr', 'e', 'sub', 'sup'],
      rad: ['radPr', 'deg', 'e'],
      m: ['mPr', 'mr'],
      d: ['dPr', 'e'],
    };
    if (!allowed[item.localName]) fail();
    if (
      item.localName !== 'oMath' &&
      children(item).some(
        (child) => !(item.localName === 'r' && child.namespaceURI === W && child.localName === 'rPr') && (child.namespaceURI !== M || !allowed[item.localName].includes(child.localName))
      )
    )
      fail();
    // Only mathematical rows and matrix rows admit repeated children.
    if (item.localName !== 'oMath') {
      const names = children(item).filter(child =>
        !(item.localName === 'm' && child.localName === 'mr') && !(item.localName === 'oMathPara' && child.localName === 'oMath') && !(item.localName === 'r' && child.localName === 't')).map(child => `${child.namespaceURI}:${child.localName}`);
      if (new Set(names).size !== names.length) fail();
    }
    const slot = (name: string) => {
      const value = find(item, name);
      if (!value || children(item).filter((child) => child.localName === name).length !== 1) fail();
      return row(value!, depth);
    };
    switch (item.localName) {
      case 'oMathPara': {
        const props = find(item, 'oMathParaPr');
        if (props && (children(props).some(child => child.namespaceURI !== M || child.localName !== 'jc') || children(props).length > 1)) fail();
        const align = props ? find(props, 'jc')?.getAttributeNS(M, 'val') || 'centerGroup' : 'centerGroup';
        if (!['left', 'center', 'right', 'centerGroup'].includes(align)) fail();
        const equations = children(item).filter(child => child.namespaceURI === M && child.localName === 'oMath');
        if (!equations.length || equations.length > 32) fail();
        return { kind: 'display', align: align as 'left' | 'center' | 'right' | 'centerGroup', body: parse(equations[0], depth + 1), ...(equations.length > 1 ? { following: equations.slice(1).map(equation => parse(equation, depth + 1)) } : {}) };
      }
      case 'oMath':
        return row(item, depth);
      case 'r': {
        const props = find(item, 'rPr');
        if (props && (children(props).some(child => child.namespaceURI !== M || child.localName !== 'sty') || children(props).length > 1)) fail();
        const style = props && find(props, 'sty');
        const mathStyle = style?.getAttributeNS(M, 'val');
        if (style && !['p', 'b', 'i', 'bi'].includes(mathStyle || '')) fail();
        const wordProps = children(item).find(child => child.namespaceURI === W && child.localName === 'rPr');
        const format: WordMathFormat = {};
        if (wordProps) {
          const keys = { b: 'bold', i: 'italic', u: 'underline', strike: 'strike' } as const;
          const seen = new Set<string>();
          for (const prop of children(wordProps)) {
            if (seen.has(prop.localName)) fail();
            seen.add(prop.localName);
            const val = prop.getAttributeNS(W, 'val');
            if (prop.localName === 'rFonts') {
              const names = ['ascii', 'hAnsi', 'eastAsia'].map(name => prop.getAttributeNS(W, name)).filter(Boolean);
              if (!names.length || new Set(names).size !== 1) fail();
              format.fontFamily = names[0]!; continue;
            }
            if (['sz', 'spacing', 'position'].includes(prop.localName)) {
              if (val == null || !/^[+-]?\d+$/.test(val)) fail();
              const key = prop.localName === 'sz' ? 'fontSize' : prop.localName === 'spacing' ? 'letterSpacing' : 'baselineShift';
              format[key] = `${Number(val) / (key === 'letterSpacing' ? 20 : 2)}pt`; continue;
            }
            if (prop.localName === 'color' || prop.localName === 'shd') {
              if (prop.localName === 'shd' && val !== 'clear') fail();
              const color = prop.localName === 'color' ? val : prop.getAttributeNS(W, 'fill');
              if (!color || !/^[0-9a-f]{6}$/i.test(color)) fail();
              format[prop.localName === 'color' ? 'color' : 'backgroundColor'] = `#${color!.toLowerCase()}`; continue;
            }
            if (prop.localName === 'vertAlign') {
              if (!['baseline', 'superscript', 'subscript'].includes(val || '')) fail();
              format.script = val as WordMathFormat['script']; continue;
            }

            if (prop.localName === 'u' ? val != null && !['single', 'none', '0', '1', 'true', 'false'].includes(val) : val != null && !['0', '1', 'true', 'false', 'on', 'off'].includes(val)) fail();
            format[keys[prop.localName as keyof typeof keys]] = !['0', 'false', 'off', 'none'].includes(val || '1');
          }
        }
        if (mathStyle) {
          const bold = mathStyle === 'b' || mathStyle === 'bi';
          const italic = mathStyle === 'i' || mathStyle === 'bi';
          if (format.bold != null || format.italic != null) {
            if (!!format.bold !== bold || !!format.italic !== italic) fail();
          } else { format.bold = bold; format.italic = italic; }
        }
        return {
          kind: 'text',
          ...(wordProps || mathStyle ? { format } : {}),
          text: children(item)
            .filter((child) => child.localName === 't')
            .map((child) => child.textContent || '')
            .join(''),
        };
      }
      case 'f': {
        const props = find(item, 'fPr');
        if (props && children(props).length) fail();
        return { kind: 'fraction', numerator: slot('num'), denominator: slot('den') };
      }
      case 'sSub':
      case 'sSup':
      case 'sSubSup': {
        const props = find(item, `${item.localName}Pr`);
        if (props && children(props).length) fail();
        return {
          kind: 'script',
          base: slot('e'),
          ...(item.localName !== 'sSup' ? { sub: slot('sub') } : {}),
          ...(item.localName !== 'sSub' ? { sup: slot('sup') } : {}),
        };
      }
      case 'rad': {
        const props = find(item, 'radPr');
        if (props && children(props).some((child) => child.localName !== 'degHide')) fail();
        const hidden = props && find(props, 'degHide');
        const hide = hidden?.getAttributeNS(M, 'val');
        if (hide != null && !['0', '1', 'true', 'false'].includes(hide)) fail();
        if (props && children(props).filter(child => child.localName === 'degHide').length > 1) fail();
        const degree = find(item, 'deg');
        if (degree && children(degree).length && ['1', 'true'].includes(hide || '')) fail();
        return {
          kind: 'radical',
          body: slot('e'),
          ...(degree && children(degree).length && hide !== '1' && hide !== 'true'
            ? { degree: row(degree, depth) }
            : {}),
        };
      }
      case 'm': {
        const props = find(item, 'mPr');
        if (props && children(props).length) fail();
        const rows = children(item)
          .filter((child) => child.localName === 'mr')
          .map((line) => {
            if (children(line).some((cell) => cell.namespaceURI !== M || cell.localName !== 'e'))
              fail();
            return children(line).map((cell) => row(cell, depth + 1));
          });
        return { kind: 'matrix', rows };
      }
      case 'd': {
        const props = find(item, 'dPr');
        if (
          props &&
          children(props).some((child) => !['begChr', 'endChr'].includes(child.localName))
        )
          fail();
        if (props && new Set(children(props).map(child => child.localName)).size !== children(props).length) fail();
        const character = (name: string, fallback: string) =>
          props ? (find(props, name)?.getAttributeNS(M, 'val') ?? fallback) : fallback;
        return {
          kind: 'delimiter',
          left: character('begChr', '('),
          right: character('endChr', ')'),
          body: slot('e'),
        };
      }
      default:
        return fail();
    }
  };
  return wordMathTree(parse(element, 0));
}
