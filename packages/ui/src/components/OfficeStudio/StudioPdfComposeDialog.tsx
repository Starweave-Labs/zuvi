import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { Input } from '../Input';
import { Modal } from '../Modal';
import { Select } from '../Select';
import { isImeComposing } from '../../utils';
import { pdfCompositionPages } from './studio-pdf-composition';
import type { StudioPdfComposer, StudioPdfComposeRequest } from './studio-types';

type CompositionOptions = Omit<StudioPdfComposeRequest, 'snapshot' | 'signal'>;

export function StudioPdfComposeDialog({
  mode,
  pageCount,
  currentPage,
  selectedPages,
  name,
  composer,
  blocked,
  busy,
  onClose,
  onApply,
}: {
  mode: 'merge' | 'extract';
  pageCount: number;
  currentPage: number;
  selectedPages: number[];
  name: string;
  composer: StudioPdfComposer;
  blocked: boolean;
  busy: boolean;
  onClose(): void;
  onApply(options: CompositionOptions): Promise<void>;
}) {
  const [pages, setPages] = useState(selectedPages.map((page) => page + 1).join(','));
  const [position, setPosition] = useState(String(currentPage + 2));
  const [outputName, setOutputName] = useState(mode === 'extract' ? `${name.replace(/\.pdf$/i, '')}-提取.pdf` : name);
  const [incoming, setIncoming] = useState<{ source: File; pageCount: number } | null>(null);
  const [incomingPages, setIncomingPages] = useState('');
  const [reading, setReading] = useState(false);
  const [strategy, setStrategy] = useState<'rename' | 'link'>('rename');
  const [valuePolicy, setValuePolicy] = useState<'reject' | 'first' | 'last'>('reject');
  const [clearRadio, setClearRadio] = useState(false);
  const [error, setError] = useState('');
  const [composing, setComposing] = useState(false);
  const composingRef = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const inspection = useRef<AbortController | null>(null);
  const formId = useId();
  const unavailable = blocked || busy;
  useEffect(() => () => inspection.current?.abort(), []);
  useEffect(() => {
    if (blocked) {
      inspection.current?.abort();
      setReading(false);
    }
  }, [blocked]);

  const choose = async (file: File) => {
    if (unavailable) return;
    inspection.current?.abort();
    const controller = new AbortController();
    inspection.current = controller;
    setIncoming(null);
    setIncomingPages('');
    setReading(true);
    setError('');
    try {
      const result = await composer.inspect(file, { signal: controller.signal });
      if (controller.signal.aborted) return;
      if (!Number.isInteger(result.pageCount) || result.pageCount < 1 || result.pageCount > 200)
        throw new Error('加入的 PDF 页数须为 1 至 200。');
      setIncoming({ source: file, pageCount: result.pageCount });
      setIncomingPages(`1${result.pageCount > 1 ? `-${result.pageCount}` : ''}`);
    } catch (cause) {
      if (!controller.signal.aborted)
        setError(cause instanceof Error ? cause.message : '无法读取加入的 PDF。');
    } finally {
      if (inspection.current === controller) setReading(false);
    }
  };

  const apply = async () => {
    if (unavailable || reading || composingRef.current) return;
    setError('');
    try {
      if (!outputName.trim() || outputName.trim().length > 200)
        throw new Error('文档名称须为 1 至 200 个字符。');
      const currentPages = mode === 'extract'
        ? pdfCompositionPages(pages, pageCount)
        : Array.from({ length: pageCount }, (_, index) => index);
      let joining: StudioPdfComposeRequest['incoming'];
      let insertAt: number | undefined;
      if (mode === 'merge') {
        if (!incoming) throw new Error('请先选择要加入的 PDF 文件。');
        joining = {
          source: incoming.source,
          name: incoming.source.name,
          pages: pdfCompositionPages(incomingPages, incoming.pageCount),
        };
        if (currentPages.length + joining.pages.length > 200)
          throw new Error('合并后的 PDF 最多支持 200 页，请减少加入的页码。');
        insertAt = /^\d+$/.test(position.trim()) ? Number(position.trim()) - 1 : NaN;
        if (!Number.isInteger(insertAt) || insertAt < 0 || insertAt > pageCount)
          throw new Error(`插入位置须为 1 至 ${pageCount + 1}。`);
      }
      await onApply({
        mode,
        pages: currentPages,
        incoming: joining,
        insertAt,
        name: outputName.trim(),
        conflicts: { strategy, valuePolicy: strategy === 'rename' ? 'reject' : valuePolicy },
        orphanRadioValue: clearRadio ? 'clear' : 'reject',
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'PDF 页面组合失败，请重试。');
    }
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <Modal.Content size="sm" className="zuvi-studio-pdf-compose-dialog">
        <Modal.Header>
          <Modal.Title>{mode === 'merge' ? '合并 PDF 文件' : '提取 PDF 页面'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form
            id={formId}
            onSubmit={(event) => { event.preventDefault(); void apply(); }}
            onCompositionStart={() => { composingRef.current = true; setComposing(true); }}
            onCompositionEnd={() => { composingRef.current = false; setComposing(false); }}
            onKeyDown={(event) => {
              if (isImeComposing(event.nativeEvent) && event.key === 'Enter') event.preventDefault();
            }}
          >
            {mode === 'merge' ? (
              <>
                <Button variant="outline" disabled={unavailable || reading} onClick={() => fileInput.current?.click()}>
                  {reading ? '正在读取 PDF…' : incoming ? '更换加入的 PDF' : '选择加入的 PDF'}
                </Button>
                <input
                  ref={fileInput}
                  type="file"
                  accept=".pdf,application/pdf"
                  aria-label="选择合并 PDF 文件"
                  hidden
                  disabled={unavailable || reading}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (file) void choose(file);
                  }}
                />
                {incoming && <p className="zuvi-studio-pdf-compose-file">{incoming.source.name} · {incoming.pageCount} 页</p>}
                <label>加入文件的页码
                  <Input aria-label="加入 PDF 页码" value={incomingPages} placeholder="例如 1,3-5" disabled={unavailable || !incoming} onChange={(event) => setIncomingPages(event.target.value)} />
                </label>
                <label>放在第几页之前（{pageCount + 1} 表示末尾）
                  <Input aria-label="合并 PDF 插入位置" value={position} inputMode="numeric" disabled={unavailable} onChange={(event) => setPosition(event.target.value)} />
                </label>
                <label>同名字段
                  <Select
                    aria-label="PDF 同名字段处理"
                    value={strategy}
                    disabled={unavailable}
                    options={[{ value: 'rename', label: '自动改名，保留独立字段' }, { value: 'link', label: '连接兼容字段，共享填写值' }]}
                    onChange={(value) => setStrategy(value as 'rename' | 'link')}
                  />
                </label>
                {strategy === 'link' && <label>字段值冲突
                  <Select
                    aria-label="PDF 字段值冲突处理"
                    value={valuePolicy}
                    disabled={unavailable}
                    options={[
                      { value: 'reject', label: '有冲突时停止合并' },
                      { value: 'first', label: '复选／单选采用当前文件的值' },
                      { value: 'last', label: '复选／单选采用加入文件的值' },
                    ]}
                    onChange={(value) => setValuePolicy(value as 'reject' | 'first' | 'last')}
                  />
                </label>}
              </>
            ) : (
              <>
                <label>提取页码（按输入顺序排列）
                  <Input aria-label="提取 PDF 页码" value={pages} placeholder="例如 1,3-5" disabled={unavailable} onChange={(event) => setPages(event.target.value)} />
                </label>
                <p>生成只包含这些页面的文档，可撤销回原文件。</p>
              </>
            )}
            <label>文档名称
              <Input aria-label="组合后的 PDF 名称" value={outputName} maxLength={200} disabled={unavailable} onChange={(event) => setOutputName(event.target.value)} />
            </label>
            <Checkbox
              className="zuvi-studio-pdf-compose-check"
              checked={clearRadio}
              disabled={unavailable}
              onChange={setClearRadio}
              label="清除在所选页面中已无控件的单选值"
            />
            <p className="zuvi-studio-pdf-hint">页码可写为 1,3-5。未选择此项时，无法保留的单选值会阻止操作。</p>
            {busy && <p role="status">正在生成 PDF，可取消此次操作。</p>}
            {error && <p role="alert" data-studio-input-error={error}>{error}</p>}
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={onClose}>取消</Button>
          <Button type="submit" form={formId} disabled={unavailable || reading || composing}>
            {mode === 'merge' ? '应用 PDF 合并' : '应用 PDF 提取'}
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
