import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { StudioPdfNativeLayer } from './StudioPdfNativeLayer';
import type { PdfAnnotation, PdfFreeTextAnnotation } from './studio-pdf-annotation-types';
import type { StudioPdfRenderResult } from './studio-types';
import type { PdfNativeTool } from './studio-pdf-native-ui';

afterEach(cleanup);
const view: StudioPdfRenderResult = {
  width: 400,
  height: 500,
  toPdfPoint: (x, y) => [x, 500 - y],
  toViewportPoint: (x, y) => [x, 500 - y],
};
function annotation(): PdfFreeTextAnnotation {
  return {
    kind: 'freeText',
    id: 'original',
    pageId: 'page',
    contents: '内容',
    author: '作者',
    rect: [40, 300, 240, 350],
    capabilities: {
      move: true,
      resize: true,
      reshape: false,
      contents: true,
      appearance: true,
      remove: true,
      reply: true,
    },
    color: null,
    fill: null,
    opacity: 1,
    stroke: { width: 0, style: 'S', lineCap: 0, lineJoin: 0, miterLimit: 10 },
    font: { family: 'Noto Sans SC', size: 16, color: [0, 0, 0] },
    align: 0,
    lineHeight: 19.2,
    rectDifferences: [0, 0, 0, 0],
    native: {
      key: '12 0 R',
      subtype: 'FreeText',
      flags: 4,
      baselineHash: 'a'.repeat(64),
      hasAppearance: true,
    },
  };
}
const box = (left: number, top: number, width: number, height: number): DOMRect => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
  x: left,
  y: top,
  toJSON: () => ({}),
});
function pointer(target: Element, type: string, x: number, y: number, id = 7) {
  const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0 });
  Object.defineProperty(event, 'pointerId', { value: id });
  fireEvent(target, event);
}
function layer(
  options: {
    tool?: PdfNativeTool;
    disabled?: boolean;
    canEdit?: boolean;
    marks?: PdfAnnotation[];
  } = {}
) {
  const marks = options.marks ?? [annotation()];
  const props = {
    annotations: marks,
    pageId: 'page',
    view,
    tool: options.tool ?? 'select',
    selectedId: 'original',
    disabled: options.disabled ?? false,
    canEdit: options.canEdit ?? true,
    ink: '#123456',
    marker: '#ffcc00',
    lineWidth: 2,
    onSelect: vi.fn(),
    onCreate: vi.fn(async () => true),
    onPatch: vi.fn(async () => true),
    onRemove: vi.fn(async () => true),
    onProperties: vi.fn(),
  };
  const f = render(<StudioPdfNativeLayer {...props} />),
    root = screen.getByRole('group', { name: 'PDF 原生批注交互层' });
  vi.spyOn(root, 'getBoundingClientRect').mockReturnValue(box(100, 30, 400, 500));
  return {
    ...f,
    props,
    root,
    hit: () => screen.getByRole('button', { name: 'PDF 批注 文字 内容' }),
  };
}

it('previews all pointer movement and accepts a changed rectangle only once on release', () => {
  const f = layer();
  pointer(f.hit(), 'pointerdown', 160, 200);
  pointer(f.hit(), 'pointermove', 170, 210);
  pointer(f.hit(), 'pointermove', 180, 220);
  expect(f.props.onPatch).not.toHaveBeenCalled();
  expect(f.root.querySelector('svg > rect')).toBeInTheDocument();
  pointer(f.hit(), 'pointerup', 180, 220);
  expect(f.props.onPatch).toHaveBeenCalledTimes(1);
  expect(f.props.onPatch).toHaveBeenCalledWith('original', {
    kind: 'freeText',
    rect: [60, 280, 260, 330],
  });
  expect(f.root.querySelector('svg > rect')).not.toBeInTheDocument();
  expect(f.props.annotations[0].rect).toEqual([40, 300, 240, 350]);
});

it.each(['Escape', 'pointercancel'] as const)(
  'discards a movement ghost on %s without creating a transaction',
  (action) => {
    const f = layer();
    pointer(f.hit(), 'pointerdown', 160, 200);
    pointer(f.hit(), 'pointermove', 180, 220);
    if (action === 'Escape') fireEvent.keyDown(f.root, { key: 'Escape' });
    else pointer(f.hit(), 'pointercancel', 180, 220);
    pointer(f.hit(), 'pointerup', 180, 220);
    expect(f.props.onPatch).not.toHaveBeenCalled();
    expect(f.root.querySelector('svg > rect')).not.toBeInTheDocument();
  }
);

it('ignores unrelated pointer IDs and unchanged clicks, and cancels a drag after the inspected object is replaced', () => {
  const f = layer();
  pointer(f.hit(), 'pointerdown', 160, 200);
  pointer(f.hit(), 'pointermove', 190, 220, 8);
  pointer(f.hit(), 'pointerup', 190, 220, 8);
  expect(f.props.onPatch).not.toHaveBeenCalled();
  pointer(f.hit(), 'pointerdown', 160, 200);
  pointer(f.hit(), 'pointerup', 160, 200);
  expect(f.props.onPatch).not.toHaveBeenCalled();
  pointer(f.hit(), 'pointerdown', 160, 200);
  pointer(f.hit(), 'pointermove', 180, 220);
  f.rerender(
    <StudioPdfNativeLayer {...f.props} annotations={[{ ...annotation(), contents: '替换' }]} />
  );
  pointer(f.root, 'pointerup', 180, 220);
  expect(f.props.onPatch).not.toHaveBeenCalled();
});

it('draws a shape in PDF coordinates after preview and cancels an unfinished shape on a permission change', () => {
  const f = layer({ tool: 'square' });
  pointer(f.root, 'pointerdown', 150, 130);
  pointer(f.root, 'pointermove', 240, 220);
  expect(f.props.onCreate).not.toHaveBeenCalled();
  pointer(f.root, 'pointerup', 240, 220);
  expect(f.props.onCreate).toHaveBeenCalledTimes(1);
  expect(f.props.onCreate).toHaveBeenCalledWith('square', [
    [50, 400],
    [140, 310],
  ]);
  pointer(f.root, 'pointerdown', 150, 130);
  pointer(f.root, 'pointermove', 240, 220);
  f.rerender(<StudioPdfNativeLayer {...f.props} canEdit={false} />);
  pointer(f.root, 'pointerup', 240, 220);
  expect(f.props.onCreate).toHaveBeenCalledTimes(1);
});

it.each([
  { canEdit: false, disabled: false },
  { canEdit: false, disabled: true },
])('respects read-only and disabled pointer/keyboard behavior: %j', (options) => {
  const f = layer(options);
  pointer(f.hit(), 'pointerdown', 160, 200);
  pointer(f.hit(), 'pointermove', 180, 220);
  pointer(f.hit(), 'pointerup', 180, 220);
  fireEvent.keyDown(f.hit(), { key: 'ArrowRight' });
  fireEvent.keyDown(f.hit(), { key: 'Delete' });
  expect(f.props.onPatch).not.toHaveBeenCalled();
  expect(f.props.onRemove).not.toHaveBeenCalled();
  if (options.disabled) expect(f.props.onSelect).not.toHaveBeenCalled();
  else expect(f.props.onSelect).toHaveBeenCalledWith('original');
});

it('ignores native IME key events and uses one or ten point keyboard increments', () => {
  const f = layer();
  fireEvent.keyDown(f.hit(), { key: 'ArrowRight', isComposing: true });
  fireEvent.keyDown(f.hit(), { key: 'Delete', keyCode: 229 });
  expect(f.props.onPatch).not.toHaveBeenCalled();
  expect(f.props.onRemove).not.toHaveBeenCalled();
  fireEvent.keyDown(f.hit(), { key: 'ArrowRight' });
  fireEvent.keyDown(f.hit(), { key: 'ArrowUp', shiftKey: true });
  expect(f.props.onPatch.mock.calls).toEqual([
    ['original', { kind: 'freeText', rect: [41, 300, 241, 350] }],
    ['original', { kind: 'freeText', rect: [40, 310, 240, 360] }],
  ]);
});

it('takes the actual painted rectangle with derived object references even when no NoZoom/NoRotate flag is present', async () => {
  const props = {
    annotations: [annotation()],
    paintReferences: [{ id: 'original', key: '90 0 R', flags: 4 }],
    pageId: 'page',
    view,
    tool: 'select' as const,
    selectedId: 'original',
    disabled: false,
    canEdit: true,
    ink: '#000000',
    marker: '#ffff00',
    lineWidth: 0,
    onSelect: vi.fn(),
    onCreate: vi.fn(async () => true),
    onPatch: vi.fn(async () => true),
    onRemove: vi.fn(async () => true),
    onProperties: vi.fn(),
  };
  render(
    <div>
      <div className="zuvi-studio-pdf-annotation-paint-layer">
        <section data-annotation-id="90R" />
      </div>
      <StudioPdfNativeLayer {...props} />
    </div>
  );
  const root = screen.getByRole('group', { name: 'PDF 原生批注交互层' }),
    section = window.document.querySelector('section')!;
  vi.spyOn(root, 'getBoundingClientRect').mockReturnValue(box(100, 30, 400, 500));
  vi.spyOn(section, 'getBoundingClientRect').mockReturnValue(box(160, 190, 100, 40));
  await act(async () => section.parentElement!.setAttribute('data-ready', 'true'));
  expect(screen.getByRole('button', { name: 'PDF 批注 文字 内容' })).toHaveStyle({
    left: '60px',
    top: '160px',
    width: '100px',
    height: '40px',
  });
});
