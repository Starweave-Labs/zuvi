'use client';

import { useEffect, useState } from 'react';
import { Button } from '../Button/Button';
import { ColorPicker } from '../ColorPicker/ColorPicker';
import { Input } from '../Input/Input';
import { Select } from '../Select/Select';
import type { PdfAnnotation } from './studio-pdf-annotation-types';
import type { PdfWorkspaceSnapshot } from './studio-pdf-annotation-workspace-types';
import {
  PDF_NATIVE_LABELS,
  pdfNativeRootVisible,
  type PdfNativeCreateStyle,
  type PdfNativeTool,
} from './studio-pdf-native-ui';
import { isImeComposing } from '../../utils';

export type PdfNativeStyleDraft = Omit<PdfNativeCreateStyle, 'fontSize' | 'lineWidth'> & {
  fontSize: string;
  lineWidth: string;
};
export function pdfNativeStyleIssue(style: PdfNativeStyleDraft): string {
  for (const [value, minimum, maximum, label] of [
    [style.fontSize, 1, 144, '字号'],
    [style.lineWidth, 0, 72, '线宽'],
  ] as const) {
    if (
      !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim()) ||
      Number(value) < minimum ||
      Number(value) > maximum ||
      !Number.isFinite(Number(value))
    )
      return `${label}须在 ${minimum} 至 ${maximum} 之间。`;
  }
  return '';
}
function thread(snapshot: PdfWorkspaceSnapshot, id: string) {
  const ids = new Set([id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const item of snapshot.annotations)
      if (
        item.replyType === 'R' &&
        item.inReplyTo &&
        ids.has(item.inReplyTo) &&
        !ids.has(item.id)
      ) {
        ids.add(item.id);
        changed = true;
      }
  }
  return snapshot.annotations.filter((item) => ids.has(item.id));
}
function resolved(items: PdfAnnotation[]) {
  const review = items
    .filter((item) => item.kind === 'note' && item.review?.model === 'Review')
    .reduce<PdfAnnotation | undefined>(
      (last, item) =>
        !last ||
        (item.modifiedAt ?? item.createdAt ?? '') >= (last.modifiedAt ?? last.createdAt ?? '')
          ? item
          : last,
      undefined
    );
  return review?.kind === 'note' && review.review?.state === 'Completed';
}

export function StudioPdfNativeInspector({
  snapshot,
  selectedId,
  tool,
  style,
  disabled,
  canEdit,
  busy,
  selectionText,
  onStyle,
  onTool,
  onSelect,
  onProperties,
  onRemove,
  onReply,
  onReview,
  onPlace,
  onMarkSelection,
  onMigrate,
  legacyCount,
  onComposition,
}: {
  snapshot?: PdfWorkspaceSnapshot;
  selectedId: string | null;
  tool: PdfNativeTool;
  style: PdfNativeStyleDraft;
  disabled: boolean;
  canEdit: boolean;
  busy: boolean;
  selectionText?: string;
  onStyle(value: Partial<PdfNativeStyleDraft>): void;
  onTool(value: PdfNativeTool): void;
  onSelect(id: string): void;
  onProperties(id: string): void;
  onRemove(id: string): Promise<boolean>;
  onReply(id: string, contents: string, author: string): Promise<boolean>;
  onReview(id: string, status: 'resolved' | 'open', author: string): Promise<boolean>;
  onPlace(): void;
  onMarkSelection(): void;
  onMigrate(): void;
  legacyCount: number;
  onComposition(value: boolean): void;
}) {
  const selected = snapshot?.annotations.find((annotation) => annotation.id === selectedId);
  const [reply, setReply] = useState('');
  useEffect(() => setReply(''), [selectedId]);
  const issue = pdfNativeStyleIssue(style),
    items = snapshot && selected ? thread(snapshot, selected.id) : [];
  const replies = items.filter((item) => item.id !== selectedId && item.contents.length > 0),
    isResolved = resolved(items);
  const blocked = !canEdit || busy;
  const send = async () => {
    if (blocked || !selected?.capabilities.reply || !reply.trim()) return;
    if (await onReply(selected.id, reply, style.author)) setReply('');
  };
  return (
    <div
      className="zuvi-studio-pdf-panel-body zuvi-studio-pdf-native-inspector"
      onCompositionStart={() => onComposition(true)}
      onCompositionEnd={() => onComposition(false)}
    >
      {!snapshot ? <p role="status">正在读取可编辑批注…</p> : null}
      {legacyCount > 0 && (
        <>
          <p className="zuvi-studio-pdf-hint">
            {legacyCount} 条旧批注可保存为重开后继续编辑的批注。
          </p>
          <Button size="sm" disabled={blocked} onClick={onMigrate}>
            保留旧批注编辑能力
          </Button>
        </>
      )}
      {selected ? (
        <>
          <strong>{PDF_NATIVE_LABELS[selected.kind]}</strong>
          <p className="zuvi-studio-pdf-native-content">{selected.contents || '未填写内容'}</p>
          <small>
            {selected.author || '未署名'}
            {selected.createdAt ? ` · ${new Date(selected.createdAt).toLocaleString()}` : ''}
          </small>
          <Button
            size="sm"
            variant="outline"
            disabled={disabled || busy}
            onClick={() => onProperties(selected.id)}
          >
            编辑批注属性
          </Button>
          {selected.capabilities.reasons?.length ? (
            <p className="zuvi-studio-pdf-hint">{selected.capabilities.reasons.join(' ')}</p>
          ) : null}
          <div className="zuvi-studio-pdf-native-thread" aria-label="PDF 原生批注回复">
            <strong>
              回复（{replies.length}）{isResolved ? ' · 已解决' : ''}
            </strong>
            {replies.map((item) => (
              <div className="zuvi-studio-pdf-reply" key={item.id}>
                <div>
                  <span>{item.contents}</span>
                  <small>
                    {item.author || '未署名'}
                    {item.createdAt ? ` · ${new Date(item.createdAt).toLocaleString()}` : ''}
                  </small>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`删除回复 ${item.contents.slice(0, 16)}`}
                  disabled={blocked || !item.capabilities.remove}
                  onClick={() => void onRemove(item.id)}
                >
                  删除
                </Button>
              </div>
            ))}
            <Input
              size="sm"
              aria-label="PDF 回复内容"
              maxLength={10000}
              value={reply}
              disabled={blocked || !selected.capabilities.reply}
              onChange={(event) => setReply(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !isImeComposing(event.nativeEvent)) {
                  event.preventDefault();
                  void send();
                }
              }}
            />
            <div className="zuvi-studio-pdf-native-actions">
              <Button
                size="sm"
                variant="outline"
                disabled={blocked || !selected.capabilities.reply || !reply.trim()}
                onClick={() => void send()}
              >
                回复
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={blocked || !selected.capabilities.reply}
                onClick={() =>
                  void onReview(selected.id, isResolved ? 'open' : 'resolved', style.author)
                }
              >
                {isResolved ? '重新打开讨论' : '解决讨论'}
              </Button>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={blocked || !selected.capabilities.remove}
            onClick={() => void onRemove(selected.id)}
          >
            删除选中标注
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={disabled || busy}
            onClick={() => onTool('freeText')}
          >
            新增批注
          </Button>
        </>
      ) : (
        <>
          <strong>添加{tool === 'select' ? '文字' : PDF_NATIVE_LABELS[tool]}批注</strong>
          <label>
            类型
            <Select
              size="sm"
              aria-label="PDF 新增批注类型"
              value={tool === 'select' ? 'freeText' : tool}
              disabled={blocked}
              options={Object.entries(PDF_NATIVE_LABELS)
                .filter(([value]) => value !== 'select' && value !== 'opaque')
                .map(([value, label]) => ({ value, label }))}
              onChange={(value) => onTool(String(value) as PdfNativeTool)}
            />
          </label>
          <label>
            文字或说明
            <Input.Textarea
              size="sm"
              aria-label="PDF 新增文字"
              value={style.text}
              rows={4}
              maxLength={10000}
              disabled={blocked}
              onChange={(event) => onStyle({ text: event.target.value })}
            />
          </label>
          <label>
            字体
            <Select
              size="sm"
              aria-label="PDF 新增批注字体"
              value={style.font}
              disabled={blocked}
              options={['Noto Sans SC', 'Helvetica', 'Times-Roman', 'Courier'].map((value) => ({
                label: value,
                value,
              }))}
              onChange={(value) => onStyle({ font: String(value) })}
            />
          </label>
          <label>
            字号
            <Input
              size="sm"
              aria-label="PDF 文字字号"
              inputMode="decimal"
              value={style.fontSize}
              disabled={blocked}
              onChange={(event) => onStyle({ fontSize: event.target.value })}
            />
          </label>
          <label>
            线宽
            <Input
              size="sm"
              aria-label="PDF 绘图线宽"
              inputMode="decimal"
              value={style.lineWidth}
              disabled={blocked}
              onChange={(event) => onStyle({ lineWidth: event.target.value })}
            />
          </label>
          <label>
            文字与线条颜色
            <ColorPicker
              size="sm"
              aria-label="PDF 标注颜色"
              value={style.ink}
              disabled={blocked}
              onChange={(value) => onStyle({ ink: value })}
            />
          </label>
          <label>
            文字标记颜色
            <ColorPicker
              size="sm"
              aria-label="PDF 文字标记颜色"
              value={style.marker}
              disabled={blocked}
              onChange={(value) => onStyle({ marker: value })}
            />
          </label>
          {issue && (
            <p role="alert" data-studio-input-error={issue}>
              {issue}
            </p>
          )}
          {(tool === 'freeText' || tool === 'note') && (
            <Button
              size="sm"
              variant="outline"
              disabled={blocked || !!issue || (tool === 'freeText' && !style.text.trim())}
              onClick={onPlace}
            >
              放在当前页中央
            </Button>
          )}
          {['highlight', 'underline', 'strikeOut', 'squiggly'].includes(tool) && (
            <Button
              size="sm"
              variant="outline"
              disabled={blocked || !!issue || !selectionText}
              onClick={onMarkSelection}
            >
              应用到所选文字
            </Button>
          )}
          <p className="zuvi-studio-pdf-hint">
            文字或便签点击页面放置；图形按住拖动，墨迹和多边形沿指针轨迹绘制。选中批注后可用方向键移动，Enter
            编辑属性。
          </p>
        </>
      )}
      <label>
        新批注与回复署名
        <Input
          size="sm"
          aria-label="PDF 批注署名"
          value={style.author}
          maxLength={1000}
          disabled={blocked}
          onChange={(event) => onStyle({ author: event.target.value })}
        />
      </label>
      <div className="zuvi-studio-pdf-mark-list" aria-label="PDF 批注列表">
        {(snapshot?.annotations ?? []).filter(pdfNativeRootVisible).map((annotation) => (
          <Button
            key={annotation.id}
            size="sm"
            variant="ghost"
            className="zuvi-studio-pdf-list-item"
            disabled={disabled || busy}
            aria-pressed={annotation.id === selectedId}
            onClick={() => onSelect(annotation.id)}
          >
            <span>
              <strong>
                第 {(snapshot?.pages.findIndex((page) => page.id === annotation.pageId) ?? -1) + 1}{' '}
                页 · {PDF_NATIVE_LABELS[annotation.kind]}
              </strong>
              <small>{annotation.contents.slice(0, 80) || '未填写内容'}</small>
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
