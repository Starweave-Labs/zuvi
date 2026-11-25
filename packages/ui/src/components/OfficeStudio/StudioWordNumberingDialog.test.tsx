import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StudioWordNumberingDialog } from './StudioWordNumberingDialog';
import { wordDefaultNumbering, type WordNumberingCatalog } from './studio-word-numbering';
afterEach(cleanup);
const catalog = (): WordNumberingCatalog => ({
  definitions: [{ id: 'outline', name: 'Outline', levels: wordDefaultNumbering() }],
  instances: [{ id: 'first', definitionId: 'outline' }],
});
describe('Word numbering definition drafts', () => {
  it('keeps invalid drafts per level, supports all nine levels and cancels without saving', () => {
    const onSave = vi.fn(),
      onClose = vi.fn();
    render(
      <StudioWordNumberingDialog
        catalog={catalog()}
        currentId="outline"
        styles={[]}
        blocked={false}
        onSave={onSave}
        onClose={onClose}
      />
    );
    fireEvent.change(screen.getByLabelText('层级起始编号'), { target: { value: '1.5' } });
    expect(screen.getByRole('button', { name: '保存编号定义' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /编辑编号层级/ }));
    fireEvent.click(screen.getByRole('option', { name: '第 9 级' }));
    fireEvent.change(screen.getByLabelText('层级编号模板'), { target: { value: '%1.%9)' } });
    expect(screen.getByRole('button', { name: '保存编号定义' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
  });
  it('retains open drafts when permissions change and applies a newly named definition with its selected level', () => {
    const onSave = vi.fn(),
      props = { catalog: catalog(), styles: [], onSave, onClose: vi.fn() };
    const view = render(<StudioWordNumberingDialog {...props} blocked={false} />);
    fireEvent.click(screen.getByRole('button', { name: '新建编号定义' }));
    fireEvent.change(screen.getByLabelText('编号定义名称'), { target: { value: '条款编号' } });
    view.rerender(<StudioWordNumberingDialog {...props} blocked />);
    expect(screen.getByLabelText('编号定义名称')).toHaveValue('条款编号');
    expect(screen.getByRole('button', { name: '保存编号定义' })).toBeDisabled();
    view.rerender(<StudioWordNumberingDialog {...props} blocked={false} />);
    fireEvent.click(screen.getByRole('button', { name: '保存编号定义' }));
    expect(onSave).toHaveBeenCalledOnce();
    const saved = onSave.mock.calls[0][0];
    expect(saved.apply).toBe(true);
    expect(
      saved.catalog.definitions.find((entry: { id: string }) => entry.id === saved.definitionId)
        .name
    ).toBe('条款编号');
    expect(
      saved.catalog.definitions.find((entry: { id: string }) => entry.id === saved.definitionId)
        .levels
    ).toHaveLength(9);
  });
});
