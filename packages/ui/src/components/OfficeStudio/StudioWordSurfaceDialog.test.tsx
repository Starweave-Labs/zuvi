import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StudioWordSurfaceDialog } from './StudioWordSurfaceDialog';
import {StudioWordStyleDialog} from './StudioWordStyleDialog';
import type {StudioWordParagraphStyle} from './studio-types';
afterEach(cleanup);
describe('Word paragraph surface drafts', () => {
  it('previews the existing surface before any draft changes',()=>{
    render(<StudioWordSurfaceDialog surfaces={[{shading:{pattern:'clear',fill:'#ffeecc'},borders:{left:{style:'single',size:1}}}]} blocked={false} onSave={vi.fn()} onClose={vi.fn()}/>);
    const preview=screen.getByLabelText('段落边框底纹预览');
    expect(preview.style.backgroundColor).toBe('rgb(255, 238, 204)');expect(preview.style.borderLeftStyle).toBe('solid');expect(preview.style.borderLeftWidth).toBe('1pt');
  });
  it('keeps unedited native tab and surface definitions when renaming a paragraph style',()=>{
    const style:StudioWordParagraphStyle={id:'panel',name:'Panel',tabStops:[{position:72,alignment:'right'}],surface:{borders:{top:{style:'double',size:1}},shading:{pattern:'clear',fill:'#ffeecc'}}};
    const onChange=vi.fn();render(<StudioWordStyleDialog value={style} styles={[style]} onChange={onChange} onClose={vi.fn()}/>);
    fireEvent.change(screen.getByLabelText('样式名称'),{target:{value:'Renamed panel'}});fireEvent.click(screen.getByRole('button',{name:'保存样式'}));
    expect(onChange).toHaveBeenCalledOnce();const next=onChange.mock.calls[0][0][0];expect(next.surface).toEqual(style.surface);expect(next.tabStops).toEqual(style.tabStops);expect(next.name).toBe('Renamed panel');
  });
  it('keeps unedited mixed borders, validates native precision and cancels without writing', () => {
    const onSave = vi.fn(),
      onClose = vi.fn();
    render(
      <StudioWordSurfaceDialog
        surfaces={[
          { borders: { top: { style: 'single', size: 1 } } },
          { borders: { top: { style: 'double', size: 2 } } },
        ]}
        blocked={false}
        onSave={onSave}
        onClose={onClose}
      />
    );
    fireEvent.change(screen.getByLabelText('段落边框宽度（pt）'), { target: { value: '0.3' } });
    expect(screen.getByRole('button', { name: '应用段落边框底纹' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
  });
  it('preserves the draft on a permission change and submits only changed values', () => {
    const onSave = vi.fn(),
      props = {
        surfaces: [{ borders: { top: { style: 'single' as const, size: 1 } } }],
        onSave,
        onClose: vi.fn(),
      };
    const view = render(<StudioWordSurfaceDialog {...props} blocked={false} />);
    fireEvent.change(screen.getByLabelText('段落边框距文字（pt）'), { target: { value: '4' } });
    view.rerender(<StudioWordSurfaceDialog {...props} blocked />);
    expect(screen.getByLabelText('段落边框距文字（pt）')).toHaveValue('4');
    expect(screen.getByRole('button', { name: '应用段落边框底纹' })).toBeDisabled();
    view.rerender(<StudioWordSurfaceDialog {...props} blocked={false} />);
    fireEvent.click(screen.getByRole('button', { name: '应用段落边框底纹' }));
    expect(onSave).toHaveBeenCalledWith({ borders: { top: { space: 4 } } });
  });
});
