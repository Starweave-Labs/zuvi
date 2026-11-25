'use client';
import * as React from 'react';
import { Button } from '../Button';
import { Input } from '../Input';
import { Modal } from '../Modal';
import { Select } from '../Select';
import { Checkbox } from '../Checkbox';
import {
  wordTableSeparator,
  wordTableToText,
  wordTextToTable,
  type WordConversionTarget,
  type WordTableSeparator,
} from './studio-word-table-conversion';

export function StudioWordConversionDialog({
  target,
  blocked,
  onClose,
  onSave,
}: {
  target: WordConversionTarget;
  blocked: boolean;
  onClose: () => void;
  onSave: (separator: string | null, columns: number, convertNested: boolean) => void;
}) {
  const [kind, setKind] = React.useState<WordTableSeparator>('tab');
  const [custom, setCustom] = React.useState(';');
  const [columns, setColumns] = React.useState('2');
  const [composing, setComposing] = React.useState(false);
  const [error, setError] = React.useState('');
  const [convertNested, setConvertNested] = React.useState(false);
  const toTable = target.direction === 'textToTable';
  let issue = '';
  const preview: string[][] = [];
  let separator: string | null = '\t';
  try {
    separator = wordTableSeparator(kind, custom);
    const count = Number(columns);
    if (toTable) {
      const table = wordTextToTable(target.doc.type.schema, target.nodes, separator, count);
      table.forEach((row) => {
        const cells: string[] = [];
        row.forEach((cell) => cells.push(cell.textContent));
        preview.push(cells);
      });
    } else {
      const paragraphs = wordTableToText(
        target.doc.type.schema,
        target.nodes[0],
        separator,
        convertNested
      );
      paragraphs.forEach((paragraph) =>
        preview.push([
          paragraph.type.name === 'table'
            ? `（保留嵌套表格）${paragraph.textContent}`
            : paragraph.textContent,
        ])
      );
    }
  } catch (reason) {
    issue = reason instanceof Error ? reason.message : '转换设置无效。';
  }
  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Modal.Content size="md">
        <Modal.Header>
          <Modal.Title>{toTable ? '文本转换为表格' : '表格转换为文本'}</Modal.Title>
          <Modal.Close />
        </Modal.Header>
        <Modal.Body>
          <p>
            {toTable
              ? `将所选 ${target.nodes.length} 个段落中的选中文本转换为表格。`
              : '转换当前表格，保留文字和字符格式；合并覆盖位置留为空字段。'}
          </p>
          <Select
            aria-label="转换分隔符"
            value={kind}
            disabled={blocked}
            onChange={(value) => {
              setKind(value as WordTableSeparator);
              setError('');
            }}
            options={[
              { value: 'tab', label: '制表符' },
              { value: 'comma', label: '逗号' },
              { value: 'paragraph', label: '段落' },
              { value: 'custom', label: '自定义' },
            ]}
          />
          {!toTable && (
            <Checkbox
              label="同时转换嵌套表格"
              checked={convertNested}
              disabled={blocked}
              onChange={setConvertNested}
            />
          )}
          {kind === 'custom' && (
            <Input
              aria-label="自定义转换分隔符"
              value={custom}
              disabled={blocked}
              onCompositionStart={() => setComposing(true)}
              onCompositionEnd={() => setComposing(false)}
              onChange={(event) => {
                setCustom(event.target.value);
                setError('');
              }}
            />
          )}
          {kind === 'paragraph' && toTable && (
            <Input
              aria-label="段落转换列数"
              type="number"
              min={1}
              max={100}
              value={columns}
              disabled={blocked}
              onCompositionStart={() => setComposing(true)}
              onCompositionEnd={() => setComposing(false)}
              onChange={(event) => {
                setColumns(event.target.value);
                setError('');
              }}
            />
          )}
          {issue || error ? (
            <p role="alert">{issue || error}</p>
          ) : (
            <>
              <p>
                {toTable
                  ? `${preview.length} 行，${preview[0]?.length ?? 0} 列`
                  : `${preview.length} 个内容块`}
              </p>
              <div style={{ overflow: 'auto', maxHeight: 240 }} aria-label="转换内容预览">
                <table>
                  <tbody>
                    {preview.slice(0, 20).map((row, index) => (
                      <tr key={index}>
                        {row.map((text, column) => (
                          <td
                            key={column}
                            style={{
                              border: '1px solid var(--zuvi-color-border)',
                              padding: 6,
                              whiteSpace: 'pre-wrap',
                            }}
                          >
                            {text || '（空）'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.length > 20 && <p>预览显示前20行，转换包含全部内容。</p>}
            </>
          )}
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
                onSave(separator, Number(columns), convertNested);
              } catch (reason) {
                setError(reason instanceof Error ? reason.message : '转换失败。');
              }
            }}
          >
            转换
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
