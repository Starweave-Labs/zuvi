'use client';

import * as React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useChartViewport } from './useChartViewport';
import type { ChartRect } from './chart-geometry';
import type { NumericDomain } from './chart-scale';

type ViewportProps = Parameters<typeof useChartViewport>[0];
interface HarnessProps extends ViewportProps {
  enabled?: boolean;
  plot?: ChartRect;
  domain?: NumericDomain;
  host?: React.DOMAttributes<HTMLDivElement>;
  onDatumClick?: React.MouseEventHandler<HTMLButtonElement>;
}
const PLOT: ChartRect = { x: 20, y: 10, width: 200, height: 100 };
const DOMAIN: NumericDomain = [0, 100];
const LEFT = 100;
const TOP = 50;

function Harness({
  enabled = true,
  plot = PLOT,
  domain = DOMAIN,
  host,
  onDatumClick,
  ...props
}: HarnessProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const viewport = useChartViewport(props, ref, domain, plot, enabled);
  return (
    <div data-testid="host" {...host}>
      <div
        ref={ref}
        data-testid="plot"
        tabIndex={0}
        {...viewport.handlers}
        data-range={JSON.stringify(viewport.range)}
        data-selection={JSON.stringify(viewport.selection)}
      >
        <button type="button" data-part="datum" onClick={onDatumClick}>
          Datum
        </button>
        <div data-part="actions">
          <button type="button">Action</button>
        </div>
      </div>
      <button type="button" data-testid="reset" onClick={viewport.reset}>
        Reset
      </button>
    </div>
  );
}

function pointer(
  target: Element,
  type: 'down' | 'move' | 'up' | 'cancel' | 'lost',
  pointerId = 1,
  x = 80,
  pointerType = 'touch',
  y = 60
) {
  const event = new PointerEvent(type === 'lost' ? 'lostpointercapture' : `pointer${type}`, {
    bubbles: true,
    cancelable: true,
    button: 0,
    pointerId,
    pointerType,
    clientX: LEFT + x,
    clientY: TOP + y,
  });
  fireEvent(target, event);
  return event;
}
function wheel(target: Element, deltaY = -100, init: WheelEventInit = {}) {
  const event = new WheelEvent('wheel', {
    bubbles: true,
    cancelable: true,
    clientX: LEFT + 120,
    clientY: TOP + 60,
    deltaY,
    ...init,
  });
  fireEvent(target, event);
  return event;
}
function nativeClick(target: Element, detail = 1) {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true, detail });
  fireEvent(target, event);
  return event;
}
function mount(props: HarnessProps = {}) {
  const view = render(<Harness {...props} />);
  const plot = view.getByTestId('plot');
  const datum = view.getByRole('button', { name: 'Datum' });
  const captured = new Set<number>();
  const capture = vi.fn((id: number) => {
    captured.add(id);
  });
  const hasCapture = vi.fn((id: number) => captured.has(id));
  const release = vi.fn((id: number) => {
    if (captured.delete(id))
      plot.dispatchEvent(
        new PointerEvent('lostpointercapture', {
          bubbles: true,
          cancelable: true,
          pointerId: id,
          pointerType: 'touch',
        })
      );
  });
  Object.defineProperties(plot, {
    setPointerCapture: { configurable: true, value: capture },
    hasPointerCapture: { configurable: true, value: hasCapture },
    releasePointerCapture: { configurable: true, value: release },
    clientWidth: { configurable: true, value: 250 },
  });
  vi.spyOn(plot, 'getBoundingClientRect').mockReturnValue({
    x: LEFT,
    y: TOP,
    left: LEFT,
    top: TOP,
    right: LEFT + 250,
    bottom: TOP + 150,
    width: 250,
    height: 150,
    toJSON() {},
  });
  return {
    ...view,
    plot,
    datum,
    captured,
    capture,
    hasCapture,
    release,
    range: () => JSON.parse(plot.getAttribute('data-range')!) as NumericDomain | null,
    selection: () => JSON.parse(plot.getAttribute('data-selection')!) as ChartRect | null,
    update: (next: Partial<HarnessProps>) => view.rerender(<Harness {...props} {...next} />),
  };
}
function beginPinch(view: ReturnType<typeof mount>) {
  pointer(view.datum, 'down', 1, 80);
  pointer(view.plot, 'down', 2, 160);
  pointer(view.plot, 'move', 1, 60);
}
function expectRange(actual: NumericDomain | null, expected: NumericDomain) {
  expect(actual).not.toBeNull();
  expect(actual![0]).toBeCloseTo(expected[0], 10);
  expect(actual![1]).toBeCloseTo(expected[1], 10);
}

beforeEach(() => {
  vi.stubGlobal(
    'PointerEvent',
    class extends MouseEvent {
      readonly pointerId: number;
      readonly pointerType: string;
      readonly isPrimary: boolean;
      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init);
        this.pointerId = init.pointerId ?? 1;
        this.pointerType = init.pointerType ?? 'touch';
        this.isPrimary = init.isPrimary ?? true;
      }
    }
  );
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn(() => 1)
  );
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('useChartViewport committed state and host capture', () => {
  it('treats controlled null as the full domain, never falls back to defaultViewRange', () => {
    const onRange = vi.fn();
    const view = mount({
      zoom: true,
      viewRange: null,
      defaultViewRange: [20, 80],
      onViewRangeChange: onRange,
    });
    expect(view.range()).toBeNull();
    expect(wheel(view.plot).defaultPrevented).toBe(true);
    expect(onRange).toHaveBeenCalledTimes(1);
    expect(view.range()).toBeNull();
    // The host has not accepted the request: identical wheel input is not a new state.
    wheel(view.plot);
    expect(onRange).toHaveBeenCalledTimes(1);
    const requested = onRange.mock.calls[0][0];
    view.update({ viewRange: requested });
    expect(view.range()).toEqual(requested);
    fireEvent.click(view.getByTestId('reset'));
    fireEvent.click(view.getByTestId('reset'));
    expect(onRange).toHaveBeenCalledTimes(2);
    expect(onRange).toHaveBeenLastCalledWith(null);
    expect(view.range()).toEqual(requested);
    view.update({ viewRange: null });
    expect(view.range()).toBeNull();
  });

  it('commits uncontrolled wheel and keyboard changes, with no repeated full-domain resets', () => {
    const onRange = vi.fn();
    const view = mount({ zoom: true, onViewRangeChange: onRange });
    fireEvent.click(view.getByTestId('reset'));
    expect(onRange).not.toHaveBeenCalled();
    wheel(view.plot);
    expect(view.range()).toEqual(onRange.mock.calls[0][0]);
    fireEvent.keyDown(view.plot, { key: '+' });
    expect(onRange).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(view.plot, { key: 'Escape' });
    expect(view.range()).toBeNull();
    expect(onRange).toHaveBeenLastCalledWith(null);
    const calls = onRange.mock.calls.length;
    fireEvent.doubleClick(view.plot);
    fireEvent.click(view.getByTestId('reset'));
    expect(wheel(view.plot, 100).defaultPrevented).toBe(false);
    expect(wheel(view.plot, 0).defaultPrevented).toBe(false);
    expect(onRange).toHaveBeenCalledTimes(calls);
  });

  it('bridges a real React passive root wheel capture veto to the non-passive native listener', () => {
    const onRange = vi.fn();
    const capture = vi.fn((event: React.WheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      // Native defaultPrevented can remain false because React delegates wheel passively.
      expect(event.defaultPrevented).toBe(true);
    });
    const view = mount({
      zoom: true,
      onViewRangeChange: onRange,
      host: { onWheelCapture: capture },
    });
    wheel(view.datum);
    expect(capture).toHaveBeenCalledTimes(1);
    expect(onRange).not.toHaveBeenCalled();
    expect(view.range()).toBeNull();
    view.update({ host: {} });
    expect(wheel(view.plot).defaultPrevented).toBe(true);
    expect(onRange).toHaveBeenCalledTimes(1);
  });

  it('ignores modified, horizontal-only and out-of-plot wheel events', () => {
    const onRange = vi.fn();
    const view = mount({ zoom: true, onViewRangeChange: onRange });
    for (const init of [
      { ctrlKey: true },
      { metaKey: true },
      { clientX: LEFT + 10 },
      { clientY: TOP + 120 },
    ]) {
      expect(wheel(view.plot, -100, init).defaultPrevented).toBe(false);
    }
    expect(wheel(view.plot, 0, { deltaX: -100 }).defaultPrevented).toBe(false);
    expect(onRange).not.toHaveBeenCalled();
  });

  it('root pointerdown capture can veto ownership and root key/doubleclick capture can veto commits', () => {
    const onRange = vi.fn();
    const view = mount({
      zoom: true,
      brush: true,
      defaultViewRange: [20, 80],
      onViewRangeChange: onRange,
      host: {
        onPointerDownCapture: (event) => event.preventDefault(),
        onKeyDownCapture: (event) => event.preventDefault(),
        onDoubleClickCapture: (event) => event.preventDefault(),
      },
    });
    pointer(view.plot, 'down');
    pointer(view.plot, 'move', 1, 160);
    pointer(view.plot, 'up', 1, 160);
    fireEvent.keyDown(view.plot, { key: '+' });
    fireEvent.doubleClick(view.plot);
    expect(view.capture).not.toHaveBeenCalled();
    expect(view.range()).toEqual([20, 80]);
    expect(onRange).not.toHaveBeenCalled();
  });

  it.each(['move', 'up'] as const)(
    'root pointer%s capture cancels a pinch preview instead of submitting it',
    (type) => {
      const onRange = vi.fn();
      const view = mount({ zoom: true, onViewRangeChange: onRange });
      beginPinch(view);
      expectRange(view.range(), [10, 90]);
      view.update({
        host:
          type === 'move'
            ? { onPointerMoveCapture: (event) => event.preventDefault() }
            : { onPointerUpCapture: (event) => event.preventDefault() },
      });
      pointer(view.plot, type, 1, 50);
      expect(view.range()).toBeNull();
      expect(view.captured.size).toBe(0);
      expect(onRange).not.toHaveBeenCalled();
      pointer(view.plot, 'up', 2, 160);
      expect(onRange).not.toHaveBeenCalled();
    }
  );
});

describe('useChartViewport brush and native datum taps', () => {
  it('keeps a single datum touch tap native even with both zoom and brush enabled', () => {
    const onRange = vi.fn();
    const onDatumClick = vi.fn();
    const view = mount({ zoom: true, brush: true, onViewRangeChange: onRange, onDatumClick });
    const focus = vi.spyOn(view.plot, 'focus');
    expect(pointer(view.datum, 'down').defaultPrevented).toBe(false);
    expect(pointer(view.datum, 'move', 1, 81).defaultPrevented).toBe(false);
    expect(pointer(view.datum, 'up', 1, 81).defaultPrevented).toBe(false);
    expect(nativeClick(view.datum).defaultPrevented).toBe(false);
    expect(onDatumClick).toHaveBeenCalledTimes(1);
    expect(view.capture).not.toHaveBeenCalled();
    expect(focus).not.toHaveBeenCalled();
    expect(view.selection()).toBeNull();
    expect(onRange).not.toHaveBeenCalled();
  });

  it('allows a fresh datum tap immediately after a completed gesture instead of suppressing unrelated clicks', () => {
    const onDatumClick = vi.fn();
    const view = mount({ zoom: true, brush: true, onDatumClick });
    beginPinch(view);
    pointer(view.plot, 'up', 1, 60);
    pointer(view.plot, 'up', 2, 160);
    expect(nativeClick(view.datum).defaultPrevented).toBe(true);
    pointer(view.datum, 'down', 3, 80);
    pointer(view.datum, 'up', 3, 80);
    expect(nativeClick(view.datum).defaultPrevented).toBe(false);
    expect(onDatumClick).toHaveBeenCalledTimes(1);
  });

  it('allows a new mouse datum click immediately after a brush without starting another session', () => {
    const onDatumClick = vi.fn();
    const view = mount({ zoom: true, brush: true, onDatumClick });
    pointer(view.plot, 'down', 1, 60, 'mouse');
    pointer(view.plot, 'move', 1, 160, 'mouse');
    pointer(view.plot, 'up', 1, 160, 'mouse');
    expect(nativeClick(view.datum).defaultPrevented).toBe(true);
    pointer(view.datum, 'down', 2, 80, 'mouse');
    pointer(view.datum, 'up', 2, 80, 'mouse');
    expect(nativeClick(view.datum).defaultPrevented).toBe(false);
    expect(onDatumClick).toHaveBeenCalledTimes(1);
  });

  it('does not convert a one-finger datum drag or action control into a brush', () => {
    const onRange = vi.fn();
    const view = mount({ zoom: true, brush: true, onViewRangeChange: onRange });
    pointer(view.datum, 'down');
    pointer(view.datum, 'move', 1, 160);
    pointer(view.datum, 'up', 1, 160);
    const action = view.getByRole('button', { name: 'Action' });
    pointer(action, 'down');
    pointer(action, 'move', 1, 160);
    pointer(action, 'up', 1, 160);
    expect(view.selection()).toBeNull();
    expect(view.capture).not.toHaveBeenCalled();
    expect(onRange).not.toHaveBeenCalled();
  });

  it('previews a ChartRect brush, commits once and suppresses only native pointer clicks after a drag', () => {
    const onRange = vi.fn();
    const onDatumClick = vi.fn();
    const view = mount({ brush: true, onViewRangeChange: onRange, onDatumClick });
    pointer(view.plot, 'down', 1, 60, 'mouse');
    pointer(view.plot, 'move', 1, 160, 'mouse');
    expect(view.selection()).toEqual({ x: 60, y: 10, width: 100, height: 100 });
    expect(view.range()).toBeNull();
    expect(onRange).not.toHaveBeenCalled();
    pointer(view.plot, 'up', 1, 160, 'mouse');
    pointer(view.plot, 'up', 1, 160, 'mouse');
    expect(view.range()).toEqual([20, 70]);
    expect(view.selection()).toBeNull();
    expect(onRange).toHaveBeenCalledTimes(1);
    expect(view.captured.size).toBe(0);
    expect(nativeClick(view.datum).defaultPrevented).toBe(true);
    expect(onDatumClick).not.toHaveBeenCalled();
    expect(nativeClick(view.datum, 0).defaultPrevented).toBe(false);
    expect(onDatumClick).toHaveBeenCalledTimes(1);
  });

  it('uses the latest plot x/y/width/height after resizing during a brush', () => {
    const onRange = vi.fn();
    const view = mount({ brush: true, onViewRangeChange: onRange });
    pointer(view.plot, 'down', 1, 60, 'mouse');
    view.update({ plot: { x: 40, y: 25, width: 100, height: 75 } });
    pointer(view.plot, 'move', 1, 120, 'mouse');
    expect(view.selection()).toEqual({ x: 60, y: 25, width: 60, height: 75 });
    pointer(view.plot, 'up', 1, 120, 'mouse');
    expect(onRange).toHaveBeenCalledTimes(1);
    expect(onRange).toHaveBeenLastCalledWith([20, 80]);
  });

  it('does not emit callbacks for a too-small brush or a repeated full-domain brush', () => {
    const onRange = vi.fn();
    const view = mount({ brush: true, onViewRangeChange: onRange });
    pointer(view.plot, 'down', 1, 80, 'mouse');
    pointer(view.plot, 'up', 1, 86, 'mouse');
    pointer(view.plot, 'down', 2, 20, 'mouse');
    pointer(view.plot, 'up', 2, 220, 'mouse');
    pointer(view.plot, 'down', 3, 20, 'mouse');
    pointer(view.plot, 'up', 3, 220, 'mouse');
    expect(onRange).not.toHaveBeenCalled();
    expect(view.range()).toBeNull();
  });

  it('a root move veto clears an active brush and releases capture without committing', () => {
    const onRange = vi.fn();
    const view = mount({ brush: true, onViewRangeChange: onRange });
    pointer(view.plot, 'down', 1, 60, 'mouse');
    pointer(view.plot, 'move', 1, 160, 'mouse');
    view.update({ host: { onPointerMoveCapture: (event) => event.preventDefault() } });
    pointer(view.plot, 'move', 1, 180, 'mouse');
    pointer(view.plot, 'up', 1, 180, 'mouse');
    expect(view.selection()).toBeNull();
    expect(view.captured.size).toBe(0);
    expect(onRange).not.toHaveBeenCalled();
  });
});

describe('useChartViewport pinch sessions', () => {
  it('previews internally and commits only once when the pair ends, never brushes the remaining finger', () => {
    const onRange = vi.fn();
    const onDatumClick = vi.fn();
    const view = mount({ zoom: true, brush: true, onViewRangeChange: onRange, onDatumClick });
    beginPinch(view);
    expect(view.captured).toEqual(new Set([1, 2]));
    expectRange(view.range(), [10, 90]);
    pointer(view.plot, 'move', 2, 180);
    const preview = view.range();
    expect(preview![0]).toBeCloseTo(100 / 6);
    expect(preview![1]).toBeCloseTo(500 / 6);
    expect(onRange).not.toHaveBeenCalled();
    pointer(view.plot, 'up', 1, 60);
    expect(onRange).toHaveBeenCalledTimes(1);
    expect(onRange).toHaveBeenLastCalledWith(preview);
    pointer(view.plot, 'move', 2, 200);
    pointer(view.plot, 'up', 2, 200);
    expect(view.range()).toEqual(preview);
    expect(view.selection()).toBeNull();
    expect(onRange).toHaveBeenCalledTimes(1);
    expect(view.release.mock.calls.map(([id]) => id)).toEqual([1, 2]);
    expect(nativeClick(view.datum).defaultPrevented).toBe(true);
    expect(onDatumClick).not.toHaveBeenCalled();
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('a controlled pinch preview clears on commit if the host does not accept its range', () => {
    const onRange = vi.fn();
    const view = mount({ zoom: true, viewRange: null, onViewRangeChange: onRange });
    beginPinch(view);
    expectRange(view.range(), [10, 90]);
    expect(onRange).not.toHaveBeenCalled();
    pointer(view.plot, 'up', 1, 60);
    expect(onRange).toHaveBeenCalledTimes(1);
    expectRange(onRange.mock.calls[0][0], [10, 90]);
    expect(view.range()).toBeNull();
    pointer(view.plot, 'up', 2, 160);
    expect(onRange).toHaveBeenCalledTimes(1);
  });

  it('unchanged pinch input and returning to the original range do not submit unchanged states', () => {
    const onRange = vi.fn();
    const view = mount({ zoom: true, defaultViewRange: [20, 80], onViewRangeChange: onRange });
    pointer(view.datum, 'down', 1, 80);
    pointer(view.plot, 'down', 2, 160);
    pointer(view.plot, 'up', 1, 80);
    pointer(view.plot, 'up', 2, 160);
    expect(onRange).not.toHaveBeenCalled();
    pointer(view.datum, 'down', 1, 80);
    pointer(view.plot, 'down', 2, 160);
    pointer(view.plot, 'move', 1, 60);
    pointer(view.plot, 'move', 1, 80);
    pointer(view.plot, 'up', 1, 80);
    pointer(view.plot, 'up', 2, 160);
    expect(view.range()).toEqual([20, 80]);
    expect(onRange).not.toHaveBeenCalled();
  });

  it('represents a full-domain pinch preview as null and commits it once', () => {
    const onRange = vi.fn();
    const view = mount({ zoom: true, defaultViewRange: [20, 80], onViewRangeChange: onRange });
    pointer(view.plot, 'down', 1, 80);
    pointer(view.plot, 'down', 2, 160);
    pointer(view.plot, 'move', 1, 110);
    pointer(view.plot, 'move', 2, 140);
    expect(view.range()).toBeNull();
    expect(onRange).not.toHaveBeenCalled();
    pointer(view.plot, 'up', 1, 110);
    pointer(view.plot, 'up', 2, 140);
    expect(onRange).toHaveBeenCalledTimes(1);
    expect(onRange).toHaveBeenLastCalledWith(null);
  });

  it('freezes for a third finger and rebaselines the remaining pair from the current preview', () => {
    const onRange = vi.fn();
    const view = mount({ zoom: true, brush: true, onViewRangeChange: onRange });
    beginPinch(view);
    pointer(view.plot, 'down', 3, 120);
    pointer(view.plot, 'move', 1, 40);
    pointer(view.plot, 'move', 3, 130);
    expectRange(view.range(), [10, 90]);
    pointer(view.plot, 'up', 2, 160);
    pointer(view.plot, 'move', 1, 40);
    expectRange(view.range(), [10, 90]);
    pointer(view.plot, 'move', 1, 30);
    const preview = view.range();
    expect(preview![0]).toBeCloseTo(12.6);
    expect(preview![1]).toBeCloseTo(84.6);
    expect(onRange).not.toHaveBeenCalled();
    pointer(view.plot, 'up', 1, 30);
    pointer(view.plot, 'up', 3, 130);
    expect(onRange).toHaveBeenCalledTimes(1);
    expect(onRange).toHaveBeenLastCalledWith(preview);
    expect(view.captured.size).toBe(0);
  });

  it('ignores implicit datum capture loss during takeover, but cancels capture loss on the owner', () => {
    const onRange = vi.fn();
    const view = mount({ zoom: true, onViewRangeChange: onRange });
    beginPinch(view);
    pointer(view.datum, 'lost', 1);
    pointer(view.plot, 'cancel', 99);
    pointer(view.plot, 'lost', 99);
    expectRange(view.range(), [10, 90]);
    pointer(view.plot, 'lost', 1);
    expect(view.range()).toBeNull();
    expect(view.captured.size).toBe(0);
    expect(onRange).not.toHaveBeenCalled();
  });
});

describe('useChartViewport cancellation and lifetime', () => {
  it.each(['brush', 'pinch'] as const)(
    'cancel/lostcapture safely drops a %s session without rollback callbacks',
    (kind) => {
      const onRange = vi.fn();
      const view = mount({
        brush: true,
        zoom: true,
        defaultViewRange: [20, 80],
        onViewRangeChange: onRange,
      });
      for (const end of ['cancel', 'lost'] as const) {
        if (kind === 'pinch') beginPinch(view);
        else {
          pointer(view.plot, 'down', 1, 60, 'mouse');
          pointer(view.plot, 'move', 1, 160, 'mouse');
        }
        pointer(view.plot, end, 1);
        pointer(view.plot, 'up', 1, 160);
        pointer(view.plot, 'up', 2, 160);
        expect(view.range()).toEqual([20, 80]);
        expect(view.selection()).toBeNull();
        expect(view.captured.size).toBe(0);
      }
      expect(onRange).not.toHaveBeenCalled();
    }
  );

  it('cancels a paused three-finger session without committing the preview', () => {
    const onRange = vi.fn();
    const view = mount({ zoom: true, onViewRangeChange: onRange });
    beginPinch(view);
    pointer(view.plot, 'down', 3, 120);
    pointer(view.plot, 'cancel', 3, 120);
    expect(view.range()).toBeNull();
    expect(view.captured.size).toBe(0);
    expect(view.release).toHaveBeenCalledTimes(3);
    expect(onRange).not.toHaveBeenCalled();
  });

  it.each(['brush', 'pinch'] as const)(
    'disable drops a %s session and all disabled inputs remain inert after it',
    (kind) => {
      const onRange = vi.fn();
      const view = mount({
        zoom: true,
        brush: true,
        defaultViewRange: [20, 80],
        onViewRangeChange: onRange,
      });
      if (kind === 'pinch') beginPinch(view);
      else {
        pointer(view.plot, 'down', 1, 60, 'mouse');
        pointer(view.plot, 'move', 1, 160, 'mouse');
      }
      view.update({ enabled: false });
      expect(view.captured.size).toBe(0);
      const captures = view.capture.mock.calls.length;
      expect(pointer(view.plot, 'move', 1, 180).defaultPrevented).toBe(false);
      pointer(view.plot, 'up', 1, 180);
      pointer(view.plot, 'up', 2, 160);
      pointer(view.plot, 'down', 3, 100);
      expect(wheel(view.plot).defaultPrevented).toBe(false);
      fireEvent.keyDown(view.plot, { key: '+' });
      fireEvent.doubleClick(view.plot);
      fireEvent.click(view.getByTestId('reset'));
      expect(view.capture).toHaveBeenCalledTimes(captures);
      expect(view.range()).toEqual([20, 80]);
      expect(view.selection()).toBeNull();
      expect(onRange).not.toHaveBeenCalled();
      view.update({ enabled: true });
      pointer(view.plot, 'up', 3, 100);
      expect(onRange).not.toHaveBeenCalled();
      wheel(view.plot);
      expect(onRange).toHaveBeenCalledTimes(1);
    }
  );

  it('cancels preview on an external controlled range change or removed gesture option', () => {
    const onRange = vi.fn();
    const view = mount({ zoom: true, viewRange: null, onViewRangeChange: onRange });
    beginPinch(view);
    view.update({ viewRange: [30, 70] });
    expect(view.range()).toEqual([30, 70]);
    expect(view.captured.size).toBe(0);
    beginPinch(view);
    view.update({ viewRange: [30, 70], zoom: false });
    expect(view.captured.size).toBe(0);
    expect(view.range()).toEqual([30, 70]);
    expect(wheel(view.plot).defaultPrevented).toBe(false);
    expect(onRange).not.toHaveBeenCalled();
  });

  it.each(['brush', 'pinch'] as const)(
    'unmount releases the actual %s capture owner after React clears its ref, with no RAF work',
    (kind) => {
      const onRange = vi.fn();
      const view = mount({ zoom: true, brush: true, onViewRangeChange: onRange });
      const remove = vi.spyOn(view.plot, 'removeEventListener');
      if (kind === 'pinch') beginPinch(view);
      else {
        pointer(view.plot, 'down', 1, 60, 'mouse');
        pointer(view.plot, 'move', 1, 160, 'mouse');
      }
      view.unmount();
      expect(view.captured.size).toBe(0);
      expect(view.release).toHaveBeenCalledTimes(kind === 'pinch' ? 2 : 1);
      expect(remove).toHaveBeenCalledWith('wheel', expect.any(Function));
      wheel(view.plot);
      pointer(view.plot, 'up', 1, 160);
      expect(onRange).not.toHaveBeenCalled();
      expect(requestAnimationFrame).not.toHaveBeenCalled();
      expect(cancelAnimationFrame).not.toHaveBeenCalled();
    }
  );

  it('capture failure during datum pinch takeover releases any partial ownership and never commits', () => {
    const onRange = vi.fn();
    const view = mount({ zoom: true, onViewRangeChange: onRange });
    view.capture
      .mockImplementationOnce((id) => {
        view.captured.add(id);
      })
      .mockImplementationOnce(() => {
        throw new Error('capture unavailable');
      });
    pointer(view.datum, 'down', 1, 80);
    pointer(view.plot, 'down', 2, 160);
    pointer(view.plot, 'move', 1, 40);
    pointer(view.plot, 'up', 1, 40);
    pointer(view.plot, 'up', 2, 160);
    expect(view.captured.size).toBe(0);
    expect(view.release).toHaveBeenCalledWith(1);
    expect(view.range()).toBeNull();
    expect(onRange).not.toHaveBeenCalled();
  });

  it('a capture request without actual ownership cannot start a brush', () => {
    const onRange = vi.fn();
    const view = mount({ brush: true, onViewRangeChange: onRange });
    view.capture.mockImplementationOnce(() => {});
    pointer(view.plot, 'down', 1, 80, 'mouse');
    pointer(view.plot, 'move', 1, 160, 'mouse');
    pointer(view.plot, 'up', 1, 160, 'mouse');
    expect(view.selection()).toBeNull();
    expect(onRange).not.toHaveBeenCalled();
  });
});
