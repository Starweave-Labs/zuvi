import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { StudioWordMathDialog } from './StudioWordMathDialog';
afterEach(cleanup);
const initial = { kind: 'text', text: 'x' };
it('edits nested fractions and matrices with a live structural preview and cancels without saving', () => {
  const save = vi.fn(), close = vi.fn();
  render(<StudioWordMathDialog initial={initial} blocked={false} onSave={save} onClose={close} />);
  fireEvent.click(screen.getByRole('button', { name: '公式改为分式' }));
  fireEvent.change(screen.getByRole('textbox', { name: '公式 分子文字' }), { target: { value: 'a+1' } });
  fireEvent.click(screen.getByRole('button', { name: '公式 分母改为矩阵' }));
  fireEvent.change(screen.getByRole('textbox', { name: '公式 分母 第1行第2列文字' }), { target: { value: '5' } });
  fireEvent.click(screen.getByRole('button', { name: '增加矩阵行' }));
  expect(screen.getByLabelText('数学公式预览').querySelectorAll('math mtr')).toHaveLength(3);
  expect(screen.getByLabelText('数学公式预览').querySelector('math mfrac')).not.toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '保存数学公式' }));
  expect(save.mock.lastCall?.[0].numerator.text).toBe('a+1');
  expect(save.mock.lastCall?.[0].denominator.rows[0][1].text).toBe('5');
  fireEvent.click(screen.getByRole('button', { name: '取消' })); expect(close).toHaveBeenCalledOnce();
});
it('keeps invalid drafts and blocks composition or changed permissions', () => {
  const save = vi.fn(), props = { initial, onSave: save, onClose: vi.fn() };
  const { rerender } = render(<StudioWordMathDialog {...props} blocked={false} />);
  fireEvent.click(screen.getByRole('button', { name: '公式改为括号' }));
  const input = screen.getByRole('textbox', { name: '公式左括号' });
  fireEvent.change(input, { target: { value: 'bad' } });
  expect(screen.getByRole('alert')).toHaveTextContent('单个字符'); expect(screen.getByRole('button', { name: '保存数学公式' })).toBeDisabled();
  fireEvent.change(input, { target: { value: '[' } }); fireEvent.compositionStart(input);
  expect(screen.getByRole('button', { name: '保存数学公式' })).toBeDisabled(); fireEvent.compositionEnd(input);
  rerender(<StudioWordMathDialog {...props} blocked />);
  expect(input).toBeDisabled(); expect(screen.getByRole('button', { name: '保存数学公式' })).toBeDisabled(); expect(save).not.toHaveBeenCalled();
});

it('edits separate numerator and denominator formats with permission and composition guards', () => {
  const save = vi.fn();
  const props = { initial: { kind: 'fraction', numerator: initial, denominator: { kind: 'text', text: '2' } }, onSave: save, onClose: vi.fn() };
  const { rerender } = render(<StudioWordMathDialog {...props} blocked={false} />);
  fireEvent.click(screen.getByRole('button', { name: '公式 分子加粗' }));
  fireEvent.click(screen.getByRole('button', { name: '公式 分母斜体' }));
  expect(screen.getByRole('button', { name: '公式 分子加粗' })).toHaveAttribute('aria-pressed', 'true');
  const preview = screen.getByLabelText('数学公式预览').querySelectorAll('mtext');
  expect(preview[0].getAttribute('style')).toContain('font-weight:bold;');
  expect(preview[1].getAttribute('style')).toContain('font-style:italic;');
  fireEvent.click(screen.getByRole('button', { name: '保存数学公式' }));
  expect(save.mock.lastCall?.[0].numerator.format).toEqual({ bold: true });
  expect(save.mock.lastCall?.[0].denominator.format).toEqual({ italic: true });
  rerender(<StudioWordMathDialog {...props} blocked />);
  expect(screen.getByRole('button', { name: '公式 分子加粗' })).toBeDisabled();
});

it('edits typography and keeps invalid metrics in the draft until corrected', () => {
  const save = vi.fn();
  render(<StudioWordMathDialog initial={initial} blocked={false} onSave={save} onClose={vi.fn()} />);
  for (const [name, value] of [['公式字体', 'Cambria Math'], ['公式字号', '14.5pt'], ['公式文字颜色', '#224466'], ['公式背景颜色', '#eeeeff'], ['公式字符间距', '-0.05pt'], ['公式字符位置', '1.5pt']])
    fireEvent.change(screen.getByRole('textbox', { name }), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: '公式文字上标' }));
  fireEvent.change(screen.getByRole('textbox', { name: '公式字符间距' }), { target: { value: '0.01pt' } });
  expect(screen.getByRole('button', { name: '保存数学公式' })).toBeDisabled();
  expect(screen.getByRole('alert')).toHaveTextContent('位置');
  fireEvent.change(screen.getByRole('textbox', { name: '公式字符间距' }), { target: { value: '-0.05pt' } });
  fireEvent.click(screen.getByRole('button', { name: '保存数学公式' }));
  expect(save.mock.lastCall?.[0].format).toEqual({ fontFamily: 'Cambria Math', fontSize: '14.5pt', color: '#224466', backgroundColor: '#eeeeff', letterSpacing: '-0.05pt', baselineShift: '1.5pt', script: 'superscript' });
});

it('changes inline formulas to aligned display formulas without losing their structure', () => {
  const save = vi.fn();
  render(<StudioWordMathDialog initial={initial} blocked={false} onSave={save} onClose={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: '改为段落公式' }));
  fireEvent.click(screen.getByRole('button', { name: '段落公式对齐right' }));
  fireEvent.click(screen.getByRole('button', { name: '公式 段落内容改为分式' }));
  expect(screen.getByLabelText('数学公式预览').querySelector('math')?.getAttribute('display')).toBe('block');
  fireEvent.click(screen.getByRole('button', { name: '保存数学公式' }));
  expect(save.mock.lastCall?.[0].align).toBe('right');
  expect(save.mock.lastCall?.[0].body.kind).toBe('fraction');
  fireEvent.click(screen.getByRole('button', { name: '改为行内公式' }));
  fireEvent.click(screen.getByRole('button', { name: '保存数学公式' }));
  expect(save.mock.lastCall?.[0].kind).toBe('fraction');
});
