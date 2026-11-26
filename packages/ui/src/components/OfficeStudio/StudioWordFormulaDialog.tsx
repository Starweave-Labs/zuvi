'use client';
import * as React from 'react';
import { Button } from '../Button';
import { Input } from '../Input';
import { Modal } from '../Modal';
import { Select } from '../Select';
import { wordFormulaInstruction } from './studio-word-table-formula';
export function StudioWordFormulaDialog({
  initial,
  blocked,
  onClose,
  onSave,
}: {
  initial: string;
  blocked: boolean;
  onClose: () => void;
  onSave: (formula: string) => void;
}) {
  const [formula, setFormula] = React.useState(initial);
  const [error, setError] = React.useState('');
  const [composing, setComposing] = React.useState(false);
  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Modal.Content size="md">
        <Modal.Header>
          <Modal.Title>表格公式</Modal.Title>
          <Modal.Close />
        </Modal.Header>
        <Modal.Body>
          <p>使用 A1 单元格引用或 SUM(ABOVE)、SUM(LEFT) 等方向公式。</p>
          <Input
            aria-label="表格公式表达式"
            value={formula}
            disabled={blocked}
            onChange={(event) => {
              setFormula(event.target.value);
              setError('');
            }}
            onCompositionStart={() => setComposing(true)}
            onCompositionEnd={() => setComposing(false)}
          />
          <Select
            aria-label="常用表格公式"
            value=""
            disabled={blocked}
            options={['ABOVE', 'LEFT', 'BELOW', 'RIGHT'].map((direction) => ({
              value: `=SUM(${direction})`,
              label: `SUM(${direction})`,
            }))}
            onChange={(value) => {
              setFormula(String(value));
              setError('');
            }}
          />
          <Select
            aria-label="公式数字格式"
            value=""
            disabled={blocked}
            options={[
              { value: 'general', label: '常规' },
              { value: '0', label: '整数' },
              { value: '0.00', label: '两位小数' },
              { value: '#,##0.00', label: '千位分隔' },
              { value: '0.00%', label: '百分比' },
            ]}
            onChange={(value) => {
              try {
                const { expression } = wordFormulaInstruction(formula);
                setFormula(value === 'general' ? expression : `${expression} \\# "${value}"`);
                setError('');
              } catch (reason) {
                setError(reason instanceof Error ? reason.message : '公式格式无效。');
              }
            }}
          />
          {error && <p role="alert">{error}</p>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button
            disabled={blocked || composing || !formula.trim()}
            onClick={() => {
              if (composing || blocked) return;
              try {
                onSave(formula);
              } catch (reason) {
                setError(reason instanceof Error ? reason.message : '公式无法保存。');
              }
            }}
          >
            保存公式
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
