import * as React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StudioWordParagraphDialog } from './StudioWordParagraphDialog';
import { StudioWordTabsDialog } from './StudioWordTabsDialog';
import { StudioWordSurfaceDialog } from './StudioWordSurfaceDialog';

afterEach(cleanup);
const paragraphValues: React.ComponentProps<typeof StudioWordParagraphDialog>['values'] = {
  textAlign: 'left',
  indentLeft: 0,
  indentRight: 0,
  indentFirstLine: 0,
  spaceBefore: 0,
  spaceAfter: 0,
  lineHeight: 1,
  lineHeightRule: 'auto',
  lineHeightBasis: 'auto',
  widowControl: true,
  keepNext: false,
  keepLines: false,
};
const cases = [
  {
    name: 'paragraph',
    field: '左缩进（pt）',
    value: '24',
    invalid: '24x',
    apply: '应用段落设置',
    dialog: (props: { blocked: boolean; onSave: () => void; onClose: () => void }) => (
      <StudioWordParagraphDialog {...props} values={paragraphValues} />
    ),
  },
  {
    name: 'tabs',
    field: '制表位位置（pt）',
    value: '72',
    invalid: '72x',
    apply: '应用制表位',
    dialog: (props: { blocked: boolean; onSave: () => void; onClose: () => void }) => (
      <StudioWordTabsDialog {...props} values={[]} />
    ),
  },
  {
    name: 'surface',
    field: '段落边框距文字（pt）',
    value: '4',
    invalid: '4x',
    apply: '应用段落边框底纹',
    dialog: (props: { blocked: boolean; onSave: () => void; onClose: () => void }) => (
      <StudioWordSurfaceDialog
        {...props}
        surfaces={[{ borders: { top: { style: 'single', size: 1 } } }]}
      />
    ),
  },
];

describe.each(cases)(
  'Word $name dialog composition',
  ({ field, value, invalid, apply, dialog }) => {
    it('keeps valid numeric IME drafts outside the document until composition ends', () => {
      const onSave = vi.fn(),
        onClose = vi.fn();
      render(dialog({ blocked: false, onSave, onClose }));
      const input = screen.getByLabelText(field);
      fireEvent.focus(input);
      fireEvent.compositionStart(input);
      fireEvent.change(input, { target: { value } });
      fireEvent.click(screen.getByRole('button', { name: apply }));
      expect(onSave).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: apply })).toBeDisabled();
      fireEvent.keyDown(input, { key: 'Enter', isComposing: true, keyCode: 229 });
      expect(onSave).not.toHaveBeenCalled();
      fireEvent.compositionEnd(input);
      expect(screen.getByRole('button', { name: apply })).toBeEnabled();
      fireEvent.click(screen.getByRole('button', { name: apply }));
      expect(onSave).toHaveBeenCalledOnce();
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('retains invalid and blocked drafts and allows cancellation without saving', () => {
      const onSave = vi.fn(),
        onClose = vi.fn();
      const view = render(dialog({ blocked: false, onSave, onClose }));
      const input = screen.getByLabelText(field);
      fireEvent.compositionStart(input);
      fireEvent.change(input, { target: { value: invalid } });
      fireEvent.keyDown(input, { key: 'Enter', isComposing: true, keyCode: 229 });
      fireEvent.compositionEnd(input);
      expect(screen.getByRole('button', { name: apply })).toBeDisabled();
      expect(screen.getByRole('alert')).toBeVisible();
      view.rerender(dialog({ blocked: true, onSave, onClose }));
      expect(input).toHaveValue(invalid);
      expect(input).toBeDisabled();
      expect(screen.getByRole('button', { name: apply })).toBeDisabled();
      fireEvent.click(screen.getByRole('button', { name: '取消' }));
      expect(onSave).not.toHaveBeenCalled();
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('preserves a composing draft across permission changes and does not close for the IME Escape', () => {
      const onSave = vi.fn(),
        onClose = vi.fn();
      const view = render(dialog({ blocked: false, onSave, onClose }));
      const input = screen.getByLabelText(field);
      fireEvent.focus(input);
      fireEvent.compositionStart(input);
      fireEvent.change(input, { target: { value } });
      fireEvent.keyDown(input, { key: 'Escape', isComposing: true, keyCode: 229 });
      expect(onClose).not.toHaveBeenCalled();
      view.rerender(dialog({ blocked: true, onSave, onClose }));
      expect(input).toHaveValue(value);
      fireEvent.compositionEnd(input);
      expect(screen.getByRole('button', { name: apply })).toBeDisabled();
      view.rerender(dialog({ blocked: false, onSave, onClose }));
      expect(input).toHaveValue(value);
      fireEvent.click(screen.getByRole('button', { name: apply }));
      expect(onSave).toHaveBeenCalledOnce();
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('keeps a rejected save available for correction and cancels without a second save', () => {
      const onSave = vi.fn(() => {
          throw new Error('文档已变化');
        }),
        onClose = vi.fn();
      render(dialog({ blocked: false, onSave, onClose }));
      const input = screen.getByLabelText(field);
      fireEvent.change(input, { target: { value } });
      fireEvent.click(screen.getByRole('button', { name: apply }));
      expect(screen.getByRole('alert')).toHaveTextContent('文档已变化');
      expect(input).toHaveValue(value);
      expect(onSave).toHaveBeenCalledOnce();
      expect(onClose).not.toHaveBeenCalled();
      fireEvent.compositionStart(input);
      fireEvent.click(screen.getByRole('button', { name: apply }));
      expect(onSave).toHaveBeenCalledOnce();
      fireEvent.click(screen.getByRole('button', { name: '取消' }));
      expect(onSave).toHaveBeenCalledOnce();
      expect(onClose).toHaveBeenCalledOnce();
    });
  }
);
