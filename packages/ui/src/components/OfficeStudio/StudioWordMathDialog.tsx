'use client';
import * as React from 'react';
import { Button } from '../Button';
import { Input } from '../Input';
import { Modal } from '../Modal';
import { wordMathTree, wordMathMarkup, type WordMathNode } from './studio-word-math';
const text = (value = 'x'): WordMathNode => ({ kind: 'text', text: value });
const templates: { label: string; create: () => WordMathNode }[] = [
  { label: '文字', create: () => text() },
  { label: '组合', create: () => ({ kind: 'row', children: [text()] }) },
  {
    label: '分式',
    create: () => ({ kind: 'fraction', numerator: text('a'), denominator: text('b') }),
  },
  {
    label: '上下标',
    create: () => ({ kind: 'script', base: text(), sub: text('i'), sup: text('2') }),
  },
  { label: '根式', create: () => ({ kind: 'radical', body: text() }) },
  {
    label: '矩阵',
    create: () => ({
      kind: 'matrix',
      rows: [
        [text('a'), text('b')],
        [text('c'), text('d')],
      ],
    }),
  },
  { label: '括号', create: () => ({ kind: 'delimiter', left: '(', right: ')', body: text() }) },
];
function MathPart({
  node,
  path,
  blocked,
  change,
}: {
  node: WordMathNode;
  path: string;
  blocked: boolean;
  change: (node: WordMathNode) => void;
}) {
  const part = (value: WordMathNode, label: string, save: (next: WordMathNode) => void) => (
    <MathPart key={label} node={value} path={`${path} ${label}`} blocked={blocked} change={save} />
  );
  return (
    <fieldset
      style={{
        minWidth: 0,
        border: '1px solid var(--zuvi-color-border)',
        padding: 8,
        marginBlock: 8,
      }}
    >
      <legend>{path}</legend>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {templates.map((template) => (
          <Button
            key={template.label}
            size="sm"
            variant="ghost"
            disabled={blocked}
            aria-label={`${path}改为${template.label}`}
            onClick={() => change(template.create())}
          >
            {template.label}
          </Button>
        ))}
      </div>
      {path === '公式' && node.kind !== 'display' && <Button variant="ghost" disabled={blocked} aria-label="改为段落公式" onClick={() => change({ kind: 'display', body: node, align: 'center' })}>段落公式</Button>}
      {node.kind === 'display' && <>
        <Button variant="ghost" disabled={blocked} aria-label="改为行内公式" onClick={() => change(node.body)}>行内公式</Button>
        {(['left', 'center', 'right', 'centerGroup'] as const).map(align => <Button key={align} variant={node.align === align ? 'secondary' : 'ghost'} disabled={blocked} aria-label={`段落公式对齐${align}`} aria-pressed={node.align === align} onClick={() => change({ ...node, align })}>{({ left: '左对齐', center: '居中', right: '右对齐', centerGroup: '公式组居中' })[align]}</Button>)}
        {part(node.body, '段落内容', body => change({ ...node, body }))}
      </>}
      {node.kind === 'text' && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {([['bold', '加粗'], ['italic', '斜体'], ['underline', '下划线'], ['strike', '删除线']] as const).map(([key, label]) =>
          <Button key={key} size="sm" variant="ghost" disabled={blocked} aria-label={`${path}${label}`}
            aria-pressed={!!node.format?.[key]} onClick={() => change({ ...node, format: { ...node.format, [key]: !node.format?.[key] } })}>{label}</Button>)}
      </div>}
      {node.kind === 'text' && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {([['baseline', '正常位置'], ['superscript', '文字上标'], ['subscript', '文字下标']] as const).map(([script, label]) =>
          <Button key={script} size="sm" variant="ghost" aria-label={`${path}${label}`} aria-pressed={(node.format?.script || 'baseline') === script}
            disabled={blocked} onClick={() => change({ ...node, format: { ...node.format, script } })}>{label}</Button>)}
      </div>}
      {node.kind === 'text' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(130px, 100%), 1fr))', gap: 4 }}>
        {([['fontFamily', '字体'], ['fontSize', '字号'], ['color', '文字颜色'], ['backgroundColor', '背景颜色'], ['letterSpacing', '字符间距'], ['baselineShift', '字符位置']] as const).map(([key, label]) =>
          <label key={key} style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}><span>{label}</span><Input aria-label={`${path}${label}`} placeholder={key === 'fontSize' ? '12pt' : key === 'letterSpacing' || key === 'baselineShift' ? '0pt' : key.includes('Color') || key === 'color' ? '#000000' : 'Cambria Math'}
            disabled={blocked} value={node.format?.[key] || ''} onChange={event => {
              const format = { ...node.format }; const value = event.target.value;
              if (value) format[key] = value; else delete format[key];
              change({ ...node, format });
            }} /></label>)}
      </div>}
      {node.kind === 'text' && (
        <Input
          aria-label={`${path}文字`}
          value={node.text}
          disabled={blocked}
          onChange={(event) => change({ ...node, text: event.target.value })}
        />
      )}
      {node.kind === 'row' && (
        <>
          {node.children.map((child, index) => (
            <div key={index}>
              {part(child, `第${index + 1}项`, (next) =>
                change({
                  ...node,
                  children: node.children.map((value, i) => (i === index ? next : value)),
                })
              )}
              {node.children.length > 1 && (
                <Button
                  size="sm"
                  disabled={blocked}
                  aria-label={`${path}删除第${index + 1}项`}
                  onClick={() =>
                    change({ ...node, children: node.children.filter((_, i) => i !== index) })
                  }
                >
                  删除项
                </Button>
              )}
            </div>
          ))}
          <Button
            disabled={blocked || node.children.length >= 512}
            onClick={() => change({ ...node, children: [...node.children, text()] })}
          >
            添加公式项
          </Button>
        </>
      )}
      {node.kind === 'fraction' && (
        <>
          {part(node.numerator, '分子', (next) => change({ ...node, numerator: next }))}
          {part(node.denominator, '分母', (next) => change({ ...node, denominator: next }))}
        </>
      )}
      {node.kind === 'script' && (
        <>
          {part(node.base, '基数', (next) => change({ ...node, base: next }))}
          {node.sub && part(node.sub, '下标', (next) => change({ ...node, sub: next }))}
          {node.sup && part(node.sup, '上标', (next) => change({ ...node, sup: next }))}
          <Button
            disabled={blocked}
            onClick={() => {
              const { sub, ...rest } = node;
              change(sub ? (node.sup ? rest : { ...rest, sup: text() }) : { ...node, sub: text() });
            }}
          >
            {node.sub ? '移除下标' : '添加下标'}
          </Button>
          <Button
            disabled={blocked}
            onClick={() => {
              const { sup, ...rest } = node;
              change(sup ? (node.sub ? rest : { ...rest, sub: text() }) : { ...node, sup: text() });
            }}
          >
            {node.sup ? '移除上标' : '添加上标'}
          </Button>
        </>
      )}
      {node.kind === 'radical' && (
        <>
          {part(node.body, '被开方项', (next) => change({ ...node, body: next }))}
          {node.degree && part(node.degree, '根次数', (next) => change({ ...node, degree: next }))}
          <Button
            disabled={blocked}
            onClick={() => {
              const { degree, ...rest } = node;
              change(degree ? rest : { ...node, degree: text('3') });
            }}
          >
            {node.degree ? '平方根' : '指定根次数'}
          </Button>
        </>
      )}
      {node.kind === 'matrix' && (
        <>
          {node.rows.map((row, r) =>
            row.map((cell, c) =>
              part(cell, `第${r + 1}行第${c + 1}列`, (next) =>
                change({
                  ...node,
                  rows: node.rows.map((line, i) =>
                    i === r ? line.map((value, j) => (j === c ? next : value)) : line
                  ),
                })
              )
            )
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <Button
              disabled={blocked || node.rows.length >= 32}
              onClick={() =>
                change({ ...node, rows: [...node.rows, node.rows[0].map(() => text('0'))] })
              }
            >
              增加矩阵行
            </Button>
            <Button
              disabled={blocked || node.rows.length <= 1}
              onClick={() => change({ ...node, rows: node.rows.slice(0, -1) })}
            >
              减少矩阵行
            </Button>
            <Button
              disabled={blocked || node.rows[0].length >= 32}
              onClick={() => change({ ...node, rows: node.rows.map((row) => [...row, text('0')]) })}
            >
              增加矩阵列
            </Button>
            <Button
              disabled={blocked || node.rows[0].length <= 1}
              onClick={() => change({ ...node, rows: node.rows.map((row) => row.slice(0, -1)) })}
            >
              减少矩阵列
            </Button>
          </div>
        </>
      )}
      {node.kind === 'delimiter' && (
        <>
          <Input
            aria-label={`${path}左括号`}
            value={node.left}
            disabled={blocked}
            onChange={(event) => change({ ...node, left: event.target.value })}
          />
          <Input
            aria-label={`${path}右括号`}
            value={node.right}
            disabled={blocked}
            onChange={(event) => change({ ...node, right: event.target.value })}
          />
          {part(node.body, '括号内容', (next) => change({ ...node, body: next }))}
        </>
      )}
    </fieldset>
  );
}
export function StudioWordMathDialog({
  initial,
  blocked,
  onClose,
  onSave,
}: {
  initial: unknown;
  blocked: boolean;
  onClose: () => void;
  onSave: (tree: WordMathNode) => void;
}) {
  const [draft, setDraft] = React.useState(() => wordMathTree(initial));
  const [composing, setComposing] = React.useState(false),
    [error, setError] = React.useState('');
  let issue = '',
    markup = '';
  try {
    markup = wordMathMarkup(draft);
  } catch (reason) {
    issue = reason instanceof Error ? reason.message : '公式无效。';
  }
  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Modal.Content size="lg">
        <Modal.Header>
          <Modal.Title>数学公式</Modal.Title>
          <Modal.Close />
        </Modal.Header>
        <Modal.Body
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={() => setComposing(false)}
        >
          <div
            aria-label="数学公式预览"
            style={{ overflowX: 'auto', padding: 12 }}
            dangerouslySetInnerHTML={{ __html: markup }}
          />
          <MathPart
            node={draft}
            path="公式"
            blocked={blocked}
            change={(next) => {
              setDraft(next);
              setError('');
            }}
          />
          {(issue || error) && <p role="alert">{issue || error}</p>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button
            disabled={blocked || composing || !!issue}
            onClick={() => {
              if (blocked || composing || issue) return;
              try {
                onSave(wordMathTree(draft));
              } catch (reason) {
                setError(reason instanceof Error ? reason.message : '公式保存失败。');
              }
            }}
          >
            保存数学公式
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
