import { useState } from 'react';
import { Button } from '../Button';
import { Input } from '../Input';
import { Modal } from '../Modal';
import { pdfPageSize } from './studio-pdf-pages';

export type PdfPageAction = 'insert' | 'resize' | 'move' | 'copy';
export function StudioPdfPageDialog({ action, pageCount, currentPage, width, height, blocked, onClose, onApply }: { action: PdfPageAction; pageCount: number; currentPage: number; width: number; height: number; blocked: boolean; onClose(): void; onApply(value: { position: number; width: number; height: number }): void }) {
  const [values, setValues] = useState({ width: String(width), height: String(height), position: String(currentPage + 2) });
  const [composing, setComposing] = useState(false), [error, setError] = useState('');
  const size = action === 'insert' || action === 'resize', title = { insert: '插入 PDF 空白页', resize: '修改 PDF 页面尺寸', move: '移动所选 PDF 页面', copy: '复制所选 PDF 页面' }[action];
  const save = () => {
    if (blocked || composing) return;
    try {
      const numeric = (value: string) => /^\d+(?:\.\d+)?$/.test(value.trim()) ? Number(value) : NaN;
      const dimensions = size ? pdfPageSize({ width: numeric(values.width), height: numeric(values.height) }) : { width, height };
      const position = numeric(values.position) - 1;
      if (action !== 'resize' && (!Number.isInteger(position) || position < 0 || position > pageCount)) throw new Error(`插入位置须在 1 至 ${pageCount + 1} 之间。`);
      onApply({ ...dimensions, position });
    } catch (cause) { setError(cause instanceof Error ? cause.message : '页面属性无效。'); }
  };
  return <Modal open onOpenChange={open => !open && onClose()}><Modal.Content size="sm" className="zuvi-studio-pdf-page-dialog">
    <Modal.Header><Modal.Title>{title}</Modal.Title></Modal.Header>
    <Modal.Body>
      {size && <><label>宽度（磅）<Input aria-label="PDF 页面宽度" value={values.width} disabled={blocked} onChange={event => setValues(previous => ({ ...previous, width: event.target.value }))} onCompositionStart={() => setComposing(true)} onCompositionEnd={() => setComposing(false)} /></label>
      <label>高度（磅）<Input aria-label="PDF 页面高度" value={values.height} disabled={blocked} onChange={event => setValues(previous => ({ ...previous, height: event.target.value }))} onCompositionStart={() => setComposing(true)} onCompositionEnd={() => setComposing(false)} /></label>
      <Button disabled={blocked || composing} onClick={() => setValues(previous => ({ ...previous, width: previous.height, height: previous.width }))}>交换宽高</Button></>}
      {action !== 'resize' && <label>放在第几页之前（{pageCount + 1} 表示末尾）<Input aria-label="PDF 页面插入位置" value={values.position} disabled={blocked} onChange={event => setValues(previous => ({ ...previous, position: event.target.value }))} onCompositionStart={() => setComposing(true)} onCompositionEnd={() => setComposing(false)} /></label>}
      {action === 'resize' && <p>修改可见画布尺寸，保留原内容坐标。</p>}
      {error && <p role="alert">{error}</p>}
    </Modal.Body>
    <Modal.Footer><Button onClick={onClose}>取消</Button><Button disabled={blocked || composing} onClick={save}>应用 PDF 页面操作</Button></Modal.Footer>
  </Modal.Content></Modal>;
}
