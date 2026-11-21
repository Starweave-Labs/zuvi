import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axe from 'axe-core';
import { ConfigProvider, enUS } from '../../config';
import { Globe } from './Globe';
import { projectGlobePoint } from './globe-geometry';
import type { GlobePoint, GlobeView } from './globe-types';
import type { GlobeRendererSnapshot } from './globe-renderer-types';

const rendererMock = vi.hoisted(() => ({
  create: vi.fn(),
  resize: vi.fn(),
  render: vi.fn(),
  dispose: vi.fn(),
}));
vi.mock('./globe-renderer', () => ({ createGlobeRenderer: rendererMock.create }));

const points: GlobePoint[] = [
  { id: 'shanghai', name: '上海', latitude: 31.23, longitude: 121.47, value: 48 },
  { id: 'london', name: '伦敦', latitude: 51.51, longitude: -0.13, value: 24 },
];
let reduced = false;
let motionChanged: (() => void) | null = null;
let frameId = 0;
let frames: Map<number, FrameRequestCallback>;
let restoreRect: ReturnType<typeof vi.spyOn>;

function root(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.zuvi-globe')!;
}
function stage(container: HTMLElement) {
  return container.querySelector<HTMLElement>('.zuvi-globe-stage')!;
}
async function nextFrame(time = 1000) {
  await act(async () => {
    const queued = [...frames.values()];
    frames.clear();
    for (const callback of queued) callback(time);
  });
}
async function ready(container: HTMLElement, mode: 'webgl' | '2d' = '2d') {
  // 懒加载视图模块在冷 worker 中转译，整包并行跑时可能超过 waitFor 默认 1s。
  const budget = { timeout: 8000 };
  await waitFor(
    () => expect(container.querySelector('.zuvi-globe-stage canvas')).toBeInTheDocument(),
    budget
  );
  if (mode === 'webgl') await waitFor(() => expect(rendererMock.create).toHaveBeenCalled(), budget);
  await waitFor(
    async () => {
      await nextFrame();
      expect(root(container)).toHaveAttribute('data-renderer', mode);
    },
    budget
  );
}
async function openPoints(container: HTMLElement) {
  const details = container.querySelector<HTMLDetailsElement>('[data-part="point-list"]')!;
  fireEvent(details, new Event('toggle'));
  details.open = true;
  fireEvent(details, new Event('toggle'));
  await waitFor(() => expect(details.querySelector('[data-part="point-item"]')).not.toBeNull());
  return within(details);
}

beforeEach(() => {
  frames = new Map();
  frameId = 0;
  reduced = false;
  motionChanged = null;
  rendererMock.create.mockReset();
  rendererMock.dispose.mockReset();
  rendererMock.resize.mockReset();
  rendererMock.render.mockReset();
  rendererMock.render.mockImplementation((snapshot: GlobeRendererSnapshot) =>
    snapshot.points.map((point) => ({
      id: point.id,
      ...projectGlobePoint(point, snapshot.view, 640, 420),
    }))
  );
  rendererMock.create.mockImplementation(() => ({
    resize: rendererMock.resize,
    render: rendererMock.render,
    dispose: rendererMock.dispose,
  }));
  restoreRect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
    width: 640,
    height: 420,
    top: 0,
    left: 0,
    right: 640,
    bottom: 420,
    x: 0,
    y: 0,
    toJSON() {
      return {};
    },
  }));
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++frameId, callback);
    return frameId;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    frames.delete(id);
  });
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    }
  );
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
    }
  );
  vi.stubGlobal('matchMedia', (query: string) => ({
    get matches() {
      return query.includes('reduced-motion') && reduced;
    },
    addEventListener(_event: string, listener: () => void) {
      if (query.includes('reduced-motion')) motionChanged = listener;
    },
    removeEventListener() {
      if (query.includes('reduced-motion')) motionChanged = null;
    },
  }));
  vi.stubGlobal(
    'PointerEvent',
    class extends MouseEvent {
      readonly pointerId: number;
      readonly pointerType: string;
      readonly isPrimary: boolean;
      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init);
        this.pointerId = init.pointerId ?? 1;
        this.pointerType = init.pointerType ?? 'mouse';
        this.isPrimary = init.isPrimary ?? true;
      }
    }
  );
  HTMLElement.prototype.setPointerCapture = vi.fn();
  HTMLElement.prototype.hasPointerCapture = vi.fn(() => true);
  HTMLElement.prototype.releasePointerCapture = vi.fn();
});

afterEach(() => {
  cleanup();
  restoreRect.mockRestore();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete (HTMLElement.prototype as unknown as Record<string, unknown>).setPointerCapture;
  delete (HTMLElement.prototype as unknown as Record<string, unknown>).hasPointerCapture;
  delete (HTMLElement.prototype as unknown as Record<string, unknown>).releasePointerCapture;
});

describe('Globe', () => {
  it('has SSR-safe loading markup and a native root ref/attributes/style/slots', async () => {
    const markup = renderToString(<Globe aria-label="业务地球" />);
    expect(markup).toContain('data-status="loading"');
    expect(markup).toContain('业务地球');
    expect(rendererMock.create).not.toHaveBeenCalled();
    const ref = React.createRef<HTMLDivElement>();
    const { container } = render(
      <Globe
        ref={ref}
        renderMode="2d"
        height={360}
        className="host"
        classNames={{ stage: 'stage-slot' }}
        data-host="yes"
      />
    );
    expect(ref.current).toBe(root(container));
    expect(root(container)).toHaveClass('host');
    expect(root(container)).toHaveAttribute('data-host', 'yes');
    expect(root(container).style.getPropertyValue('--zuvi-globe-height')).toBe('360px');
    await ready(container);
    expect(stage(container)).toHaveClass('stage-slot');
    expect(rendererMock.create).not.toHaveBeenCalled();
  });

  it('reports 2D ready and empty business data is not a renderer failure', async () => {
    const onReady = vi.fn();
    const onError = vi.fn();
    const onStatusChange = vi.fn();
    const { container } = render(
      <Globe renderMode="2d" onReady={onReady} onError={onError} onStatusChange={onStatusChange} />
    );
    await ready(container);
    expect(root(container)).toHaveAttribute('data-status', 'ready');
    expect(onReady).toHaveBeenCalledWith({ renderer: '2d' });
    expect(onError).not.toHaveBeenCalled();
    expect(onStatusChange.mock.calls.map(([status]) => status)).toEqual(['loading', 'ready']);
    const details = container.querySelector<HTMLDetailsElement>('details')!;
    details.open = true;
    fireEvent(details, new Event('toggle'));
    expect(await screen.findByText('暂无点位')).toBeInTheDocument();
  });

  it('validates/deduplicates points and keeps source data unchanged', async () => {
    const source = Object.freeze([
      ...points,
      { ...points[0], name: '重复' },
      { ...points[0], id: 'invalid', latitude: NaN },
    ]);
    const { container } = render(<Globe renderMode="2d" points={source} />);
    await ready(container);
    const list = await openPoints(container);
    expect(list.getAllByRole('button')).toHaveLength(2);
    expect(list.queryByText('重复')).not.toBeInTheDocument();
    expect(source).toHaveLength(4);
  });

  it('selects, centers and toggles a point with uncontrolled state', async () => {
    const onChange = vi.fn();
    const onViewChange = vi.fn();
    const onPointClick = vi.fn();
    const { container } = render(
      <Globe
        renderMode="2d"
        points={points}
        onChange={onChange}
        onViewChange={onViewChange}
        onPointClick={onPointClick}
      />
    );
    await ready(container);
    const list = await openPoints(container);
    const point = list.getByRole('button', { name: /伦敦/ });
    fireEvent.click(point);
    expect(point).toHaveAttribute('aria-pressed', 'true');
    expect(onChange).toHaveBeenLastCalledWith('london');
    expect(onPointClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'london' }),
      expect.anything()
    );
    expect(onViewChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ latitude: 51.51, longitude: expect.closeTo(-0.13, 4) }),
      { reason: 'point' }
    );
    fireEvent.click(point);
    expect(point).toHaveAttribute('aria-pressed', 'false');
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('honors controlled selection and event preventDefault', async () => {
    const onChange = vi.fn();
    const prevent = vi.fn((_point, event: React.MouseEvent) => event.preventDefault());
    const component = (cancellable = false) => (
      <Globe
        renderMode="2d"
        points={points}
        value="shanghai"
        onChange={onChange}
        onPointClick={cancellable ? prevent : undefined}
      />
    );
    const { container, rerender } = render(component());
    await ready(container);
    const list = await openPoints(container);
    const point = list.getByRole('button', { name: /伦敦/ });
    fireEvent.click(point);
    expect(onChange).toHaveBeenLastCalledWith('london');
    expect(point).toHaveAttribute('aria-pressed', 'false');
    expect(list.getByRole('button', { name: /上海/ })).toHaveAttribute('aria-pressed', 'true');
    onChange.mockClear();
    rerender(component(true));
    fireEvent.click(point);
    expect(prevent).toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('supports keyboard rotation/zoom/reset and clamps both zoom edges', async () => {
    const onViewChange = vi.fn();
    const { container } = render(
      <Globe
        renderMode="2d"
        defaultView={{ latitude: 0, longitude: 0, zoom: 1 }}
        onViewChange={onViewChange}
      />
    );
    await ready(container);
    const target = stage(container);
    fireEvent.keyDown(target, { key: 'ArrowRight' });
    expect(onViewChange).toHaveBeenLastCalledWith(
      { latitude: 0, longitude: 5, zoom: 1 },
      { reason: 'keyboard' }
    );
    fireEvent.keyDown(target, { key: 'ArrowUp', shiftKey: true });
    expect(onViewChange).toHaveBeenLastCalledWith(
      { latitude: 15, longitude: 5, zoom: 1 },
      { reason: 'keyboard' }
    );
    for (let index = 0; index < 20; index++) fireEvent.keyDown(target, { key: '+' });
    expect(onViewChange).toHaveBeenLastCalledWith(expect.objectContaining({ zoom: 2 }), {
      reason: 'keyboard',
    });
    expect(within(target).getByRole('button', { name: '放大' })).toBeDisabled();
    for (let index = 0; index < 30; index++) fireEvent.keyDown(target, { key: '-' });
    expect(onViewChange).toHaveBeenLastCalledWith(expect.objectContaining({ zoom: 0.75 }), {
      reason: 'keyboard',
    });
    expect(within(target).getByRole('button', { name: '缩小' })).toBeDisabled();
    fireEvent.keyDown(target, { key: 'Home' });
    expect(onViewChange).toHaveBeenLastCalledWith(
      { latitude: 0, longitude: 0, zoom: 1 },
      { reason: 'reset' }
    );
  });

  it('refreshes an open tooltip and animation ownership when points or focused list items change', async () => {
    const { container, rerender } = render(<Globe renderMode="2d" points={points} autoRotate />);
    await ready(container);
    const list = await openPoints(container);
    const london = list.getByRole('button', { name: /伦敦/ });
    fireEvent.focus(london);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('伦敦');
    const updated = [{ ...points[0] }, { ...points[1], name: '伦敦更新', value: 99 }];
    rerender(<Globe renderMode="2d" points={updated} autoRotate />);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('伦敦更新');
    rerender(<Globe renderMode="2d" points={[updated[0]]} autoRotate />);
    await nextFrame();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(stage(container)).toHaveAttribute('data-animating', 'true');
  });

  it('honors host capture cancellation before starting pointer or keyboard interaction', async () => {
    const onViewChange = vi.fn();
    const { container } = render(
      <Globe
        renderMode="2d"
        points={points}
        onViewChange={onViewChange}
        onKeyDownCapture={(event) => event.preventDefault()}
        onPointerDownCapture={(event) => event.preventDefault()}
      />
    );
    await ready(container);
    const target = stage(container);
    fireEvent.keyDown(target, { key: 'ArrowRight' });
    fireEvent.pointerDown(target, {
      pointerId: 1,
      pointerType: 'touch',
      button: 0,
      clientX: 50,
      clientY: 50,
    });
    expect(onViewChange).not.toHaveBeenCalled();
    expect(target).not.toHaveAttribute('data-dragging');
  });

  it('rebaselines a pinch when a third finger briefly joins and leaves', async () => {
    const onViewChange = vi.fn();
    const { container } = render(<Globe renderMode="2d" onViewChange={onViewChange} />);
    await ready(container);
    const target = stage(container);
    fireEvent.pointerDown(target, {
      pointerId: 1,
      pointerType: 'touch',
      button: 0,
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerDown(target, {
      pointerId: 2,
      pointerType: 'touch',
      button: 0,
      clientX: 160,
      clientY: 100,
    });
    fireEvent.pointerMove(target, {
      pointerId: 1,
      pointerType: 'touch',
      clientX: 90,
      clientY: 100,
    });
    fireEvent.pointerMove(target, {
      pointerId: 2,
      pointerType: 'touch',
      clientX: 170,
      clientY: 100,
    });
    fireEvent.pointerDown(target, {
      pointerId: 3,
      pointerType: 'touch',
      button: 0,
      clientX: 130,
      clientY: 140,
    });
    fireEvent.pointerUp(target, { pointerId: 3, pointerType: 'touch', clientX: 130, clientY: 140 });
    onViewChange.mockClear();
    fireEvent.pointerMove(target, {
      pointerId: 1,
      pointerType: 'touch',
      clientX: 80,
      clientY: 100,
    });
    fireEvent.pointerMove(target, {
      pointerId: 2,
      pointerType: 'touch',
      clientX: 180,
      clientY: 100,
    });
    await act(async () => {});
    expect(onViewChange).toHaveBeenCalledWith(
      expect.objectContaining({ zoom: expect.any(Number) }),
      { reason: 'zoom' }
    );
  });

  it('filters categories and endpoint arcs without clearing a temporarily hidden selection', async () => {
    const data = points.map((point, index) => ({ ...point, category: index ? 'west' : 'east' }));
    const onChange = vi.fn();
    const onHidden = vi.fn();
    const { container } = render(
      <Globe
        renderMode="2d"
        points={data}
        categories={[
          { id: 'east', name: '东区' },
          { id: 'west', name: '西区' },
        ]}
        arcs={[{ id: 'route', from: 'shanghai', to: 'london' }]}
        value="shanghai"
        onChange={onChange}
        onHiddenCategoriesChange={onHidden}
        autoRotate={false}
      />
    );
    await ready(container);
    const east = screen.getByRole('checkbox', { name: '东区' });
    fireEvent.click(east);
    await nextFrame();
    expect(east).not.toBeChecked();
    expect(stage(container)).toHaveAttribute('data-point-count', '1');
    expect(stage(container)).toHaveAttribute('data-arc-count', '0');
    expect(screen.getByText('所选点位已被当前筛选隐藏')).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    expect(onHidden).toHaveBeenLastCalledWith(['east']);
    fireEvent.click(east);
    await nextFrame();
    expect(stage(container)).toHaveAttribute('data-point-count', '2');
    expect(stage(container)).toHaveAttribute('data-arc-count', '1');
    const list = await openPoints(container);
    expect(list.getByRole('button', { name: /上海/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('controlled category filters only request updates and search narrows the list not the scene', async () => {
    const onHidden = vi.fn();
    const onSearch = vi.fn();
    const data = points.map((point, index) => ({ ...point, category: index ? 'west' : 'east' }));
    const { container } = render(
      <Globe
        renderMode="2d"
        points={data}
        searchable
        hiddenCategories={[]}
        onHiddenCategoriesChange={onHidden}
        onSearchValueChange={onSearch}
        categories={[
          { id: 'east', name: '东区' },
          { id: 'west', name: '西区' },
        ]}
        autoRotate={false}
      />
    );
    await ready(container);
    fireEvent.click(screen.getByRole('checkbox', { name: '东区' }));
    await nextFrame();
    expect(screen.getByRole('checkbox', { name: '东区' })).toBeChecked();
    expect(onHidden).toHaveBeenCalledWith(['east']);
    const list = await openPoints(container);
    const input = list.getByRole('searchbox');
    fireEvent.change(input, { target: { value: '伦敦' } });
    expect(container.querySelectorAll('[data-part="point-item"]')).toHaveLength(1);
    expect(stage(container)).toHaveAttribute('data-point-count', '2');
    expect(onSearch).toHaveBeenLastCalledWith('伦敦');
    fireEvent.change(input, { target: { value: '不存在' } });
    expect(container.querySelectorAll('[data-part="point-item"]')).toHaveLength(0);
    expect(list.getByText('没有匹配的点位')).toBeInTheDocument();
  });

  it('maps numeric values and category styles but keeps callbacks source-safe', async () => {
    const data = points.map((point, index) => ({
      ...point,
      category: 'city',
      value: index ? 10 : 0,
    }));
    const onPointClick = vi.fn();
    const { container } = render(
      <Globe
        points={data}
        categories={[{ id: 'city', name: '城市', color: 'red' }]}
        valueScale
        onPointClick={onPointClick}
        autoRotate={false}
      />
    );
    await ready(container, 'webgl');
    const rendered = rendererMock.render.mock.lastCall?.[0].points as GlobePoint[];
    expect(rendered.map((point) => point.size)).toEqual([0.012, 0.036]);
    const list = await openPoints(container);
    fireEvent.click(list.getByRole('button', { name: /伦敦/ }));
    expect(onPointClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'london', size: 0.016, color: undefined }),
      expect.anything()
    );
  });

  it('selects routes independently, updates renderer highlighting and preserves point selection', async () => {
    const onChange = vi.fn();
    const onArcChange = vi.fn();
    const onArcClick = vi.fn();
    const { container } = render(
      <Globe
        points={points}
        arcs={[{ id: 'ab', from: 'shanghai', to: 'london', name: '跨区连接', value: 2 }]}
        value="shanghai"
        onChange={onChange}
        onArcChange={onArcChange}
        onArcClick={onArcClick}
        showArcList
        autoRotate={false}
      />
    );
    await ready(container, 'webgl');
    const details = container.querySelector<HTMLDetailsElement>('[data-part="arc-list"]')!;
    details.open = true;
    fireEvent(details, new Event('toggle'));
    const arc = await within(details).findByRole('button', { name: /跨区连接/ });
    fireEvent.click(arc);
    await nextFrame();
    expect(arc).toHaveAttribute('aria-pressed', 'true');
    expect(onArcChange).toHaveBeenLastCalledWith('ab');
    expect(onChange).not.toHaveBeenCalled();
    expect(rendererMock.render.mock.lastCall?.[0].selectedArcId).toBe('ab');
    expect(container.querySelector('[data-part="arc-details"]')).toHaveTextContent('跨区连接');
    fireEvent.click(arc);
    await nextFrame();
    expect(onArcChange).toHaveBeenLastCalledWith(null);
    expect(container.querySelector('[data-part="arc-details"]')).not.toBeInTheDocument();
  });

  it('flies from the live view via one target callback and focus never changes selection', async () => {
    const onViewChange = vi.fn();
    const onChange = vi.fn();
    const { container, rerender } = render(
      <Globe
        renderMode="2d"
        points={points}
        autoRotate={false}
        transitionDuration={600}
        defaultView={{ latitude: 0, longitude: 0, zoom: 1 }}
        onViewChange={onViewChange}
        onChange={onChange}
      />
    );
    await ready(container);
    rerender(
      <Globe
        renderMode="2d"
        points={points}
        autoRotate={false}
        transitionDuration={600}
        defaultView={{ latitude: 0, longitude: 0, zoom: 1 }}
        focus={{ pointId: 'shanghai', key: 1 }}
        onViewChange={onViewChange}
        onChange={onChange}
      />
    );
    await nextFrame(1100);
    expect(stage(container)).toHaveAttribute('data-transitioning', 'true');
    await nextFrame(1400);
    expect(Number(stage(container).dataset.viewLongitude)).toBeGreaterThan(0);
    expect(Number(stage(container).dataset.viewLongitude)).toBeLessThan(121.47);
    await nextFrame(1700);
    expect(stage(container)).toHaveAttribute('data-transitioning', 'false');
    expect(stage(container)).toHaveAttribute('data-view-longitude', '121.47');
    expect(onViewChange).toHaveBeenCalledTimes(1);
    expect(onViewChange).toHaveBeenCalledWith(expect.objectContaining({ latitude: 31.23 }), {
      reason: 'focus',
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('new focus requests and keyboard interaction cancel an in-progress flight', async () => {
    const onViewChange = vi.fn();
    const component = (focus: string | null) => (
      <Globe
        renderMode="2d"
        points={points}
        autoRotate={false}
        transitionDuration={800}
        focus={focus ? { pointId: focus } : null}
        onViewChange={onViewChange}
      />
    );
    const { container, rerender } = render(component(null));
    await ready(container);
    rerender(component('london'));
    await nextFrame(1100);
    await nextFrame(1300);
    rerender(component('shanghai'));
    await nextFrame(1400);
    expect(stage(container)).toHaveAttribute('data-transitioning', 'true');
    fireEvent.keyDown(stage(container), { key: '+' });
    await nextFrame(1500);
    expect(stage(container)).toHaveAttribute('data-transitioning', 'false');
    expect(onViewChange.mock.calls.map(([, details]) => details.reason)).toEqual([
      'focus',
      'focus',
      'keyboard',
    ]);
  });

  it('reduced motion and controlled view never start an implicit flight', async () => {
    reduced = true;
    const onViewChange = vi.fn();
    const { container, rerender } = render(
      <Globe
        renderMode="2d"
        points={points}
        autoRotate={false}
        transitionDuration={600}
        onViewChange={onViewChange}
      />
    );
    await ready(container);
    rerender(
      <Globe
        renderMode="2d"
        points={points}
        autoRotate={false}
        transitionDuration={600}
        focus={{ pointId: 'london' }}
        onViewChange={onViewChange}
      />
    );
    await nextFrame();
    expect(stage(container)).toHaveAttribute('data-transitioning', 'false');
    expect(stage(container)).toHaveAttribute('data-view-latitude', '51.51');
    reduced = false;
    await act(async () => motionChanged?.());
    rerender(
      <Globe
        renderMode="2d"
        points={points}
        view={{ latitude: 0, longitude: 0, zoom: 1 }}
        transitionDuration={600}
        focus={{ pointId: 'shanghai' }}
        onViewChange={onViewChange}
      />
    );
    await nextFrame();
    expect(stage(container)).toHaveAttribute('data-transitioning', 'false');
    expect(stage(container)).toHaveAttribute('data-view-latitude', '0.00');
    expect(onViewChange).toHaveBeenLastCalledWith(expect.objectContaining({ latitude: 31.23 }), {
      reason: 'focus',
    });
  });

  it('automatic labels respect the budget and remain decorative', async () => {
    const { container } = render(
      <Globe renderMode="2d" points={points} autoRotate={false} pointLabels="auto" maxLabels={1} />
    );
    await ready(container);
    const labels = [...container.querySelectorAll<HTMLElement>('[data-part="label"]')];
    expect(labels).toHaveLength(2);
    expect(
      labels.filter((label) => label.style.visibility === 'visible').length
    ).toBeLessThanOrEqual(1);
    expect(container.querySelector('.zuvi-globe-labels')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelectorAll('[data-part="point"]')).toHaveLength(2);
  });

  it('controlled view requests changes without moving until the owner updates', async () => {
    const camera: GlobeView = { latitude: 0, longitude: 0, zoom: 1 };
    const onViewChange = vi.fn();
    const { container, rerender } = render(
      <Globe renderMode="2d" view={camera} onViewChange={onViewChange} />
    );
    await ready(container);
    fireEvent.keyDown(stage(container), { key: 'ArrowRight' });
    await nextFrame();
    expect(stage(container)).toHaveAttribute('data-view-longitude', '0.00');
    expect(onViewChange).toHaveBeenLastCalledWith(
      { ...camera, longitude: 5 },
      { reason: 'keyboard' }
    );
    rerender(
      <Globe renderMode="2d" view={{ ...camera, longitude: 10 }} onViewChange={onViewChange} />
    );
    await nextFrame();
    expect(stage(container)).toHaveAttribute('data-view-longitude', '10.00');
  });

  it('uses provider locale and explicit label overrides with custom tooltip', async () => {
    const { container } = render(
      <ConfigProvider locale={enUS}>
        <Globe
          renderMode="2d"
          points={points}
          labels={{ reset: 'Back to overview' }}
          renderTooltip={(point) => <span>Node: {point.name}</span>}
        />
      </ConfigProvider>
    );
    await ready(container);
    expect(screen.getByRole('button', { name: 'Back to overview' })).toBeInTheDocument();
    const list = await openPoints(container);
    fireEvent.focus(list.getByRole('button', { name: /伦敦/ }));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Node: 伦敦');
    fireEvent.keyDown(list.getByRole('button', { name: /伦敦/ }), { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('disabled and noninteractive controls stay unavailable but data remains readable', async () => {
    const onChange = vi.fn();
    const onViewChange = vi.fn();
    const { container } = render(
      <Globe
        renderMode="2d"
        disabled
        points={points}
        onChange={onChange}
        onViewChange={onViewChange}
      />
    );
    await ready(container);
    expect(stage(container)).not.toHaveAttribute('tabindex');
    expect(root(container)).toHaveAttribute('aria-disabled', 'true');
    const list = await openPoints(container);
    expect(list.getByRole('button', { name: /上海/ })).toBeDisabled();
    fireEvent.keyDown(stage(container), { key: 'ArrowRight' });
    expect(onViewChange).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('wheel zoom is opt-in and never captures the default page scroll', async () => {
    const onViewChange = vi.fn();
    const { container, rerender } = render(<Globe renderMode="2d" onViewChange={onViewChange} />);
    await ready(container);
    fireEvent.wheel(stage(container), { deltaY: -100, cancelable: true });
    expect(onViewChange).not.toHaveBeenCalled();
    rerender(<Globe renderMode="2d" wheelZoom onViewChange={onViewChange} />);
    const event = new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true });
    fireEvent(stage(container), event);
    expect(event.defaultPrevented).toBe(true);
    expect(onViewChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ zoom: expect.closeTo(Math.exp(0.1)) }),
      { reason: 'zoom' }
    );
  });

  it('creates WebGL lazily, updates data without recreating it and disposes on unmount', async () => {
    const onReady = vi.fn();
    const { container, rerender, unmount } = render(
      <Globe points={points} autoRotate={false} onReady={onReady} />
    );
    await ready(container, 'webgl');
    expect(onReady).toHaveBeenCalledWith({ renderer: 'webgl' });
    expect(rendererMock.resize).toHaveBeenCalledWith(640, 420, expect.any(Number));
    rerender(<Globe points={[points[0]]} autoRotate={false} onReady={onReady} />);
    await nextFrame();
    expect(rendererMock.create).toHaveBeenCalledTimes(1);
    expect(rendererMock.render.mock.lastCall?.[0].points).toHaveLength(1);
    unmount();
    expect(rendererMock.dispose).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
  });

  it('falls back on unavailable WebGL, reports the reason and retries to actual rendering', async () => {
    rendererMock.create.mockImplementationOnce(() => {
      throw new Error('No WebGL2');
    });
    const onError = vi.fn();
    const { container } = render(<Globe points={points} onError={onError} />);
    await waitFor(() => expect(rendererMock.create).toHaveBeenCalled());
    await waitFor(async () => {
      await nextFrame();
      expect(root(container)).toHaveAttribute('data-status', 'fallback');
    });
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'unsupported' }));
    fireEvent.click(screen.getByRole('button', { name: /重试/ }));
    await waitFor(() => expect(rendererMock.create).toHaveBeenCalledTimes(2));
    await nextFrame();
    expect(root(container)).toHaveAttribute('data-renderer', 'webgl');
  });

  it('context loss keeps the data, restoration recreates the renderer safely', async () => {
    const onError = vi.fn();
    const { container } = render(<Globe points={points} onError={onError} />);
    await ready(container, 'webgl');
    const canvas = container.querySelector('canvas')!;
    const event = new Event('webglcontextlost', { cancelable: true });
    fireEvent(canvas, event);
    await nextFrame();
    expect(event.defaultPrevented).toBe(true);
    expect(root(container)).toHaveAttribute('data-renderer', '2d');
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'context-lost' }));
    fireEvent(canvas, new Event('webglcontextrestored'));
    await waitFor(() => expect(rendererMock.create).toHaveBeenCalledTimes(2));
    await nextFrame();
    expect(rendererMock.dispose).toHaveBeenCalledTimes(1);
    expect(root(container)).toHaveAttribute('data-renderer', 'webgl');
  });

  it('reduced motion and hover stop automatic frame scheduling', async () => {
    reduced = true;
    const { container } = render(<Globe points={points} />);
    await ready(container, 'webgl');
    expect(stage(container)).toHaveAttribute('data-animating', 'false');
    expect(frames.size).toBe(0);
    await act(async () => {
      reduced = false;
      motionChanged?.();
    });
    await nextFrame(1100);
    await nextFrame(1150);
    expect(stage(container)).toHaveAttribute('data-animating', 'true');
    expect(frames.size).toBe(1);
    fireEvent.mouseEnter(stage(container));
    await nextFrame(1200);
    expect(stage(container)).toHaveAttribute('data-animating', 'false');
    expect(frames.size).toBe(0);
  });

  it('StrictMode leaves one active renderer and removes all animation work', async () => {
    const { container, unmount } = render(
      <React.StrictMode>
        <Globe points={points} />
      </React.StrictMode>
    );
    await ready(container, 'webgl');
    expect(rendererMock.create.mock.calls.length - rendererMock.dispose.mock.calls.length).toBe(1);
    unmount();
    expect(rendererMock.create.mock.calls.length).toBe(rendererMock.dispose.mock.calls.length);
    expect(frames.size).toBe(0);
  });

  it('passes an axe scan with keyboard point list and decorative canvas', async () => {
    const { container } = render(
      <main>
        <Globe renderMode="2d" points={points} />
      </main>
    );
    await ready(container);
    await openPoints(container);
    const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(result.violations).toEqual([]);
  });
});
