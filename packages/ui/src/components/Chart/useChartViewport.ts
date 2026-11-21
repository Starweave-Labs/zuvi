'use client';

import * as React from 'react';
import { useControllableState } from '../../utils';
import {
  brushChartRange,
  normalizeViewRange,
  sameChartRange,
  zoomChartRange,
} from './chart-interactions';
import { ascending, finite, type NumericDomain } from './chart-scale';
import type { ChartBaseProps } from './chart-types';
import type { ChartRect } from './chart-geometry';

type Point = { x: number; y: number };
type ViewportProps = Pick<
  ChartBaseProps,
  'viewRange' | 'defaultViewRange' | 'onViewRangeChange' | 'zoom' | 'brush'
>;
interface Session {
  owner: HTMLDivElement;
  pointers: Map<number, Point>;
  captured: Set<number>;
  pointerType: string;
  mode: 'pending' | 'brush' | 'pinch' | 'paused' | 'drain';
  start: number;
  brushAllowed: boolean;
  distance: number;
  anchor: number;
  baseline: NumericDomain | null;
  preview: NumericDomain | null;
  source: NumericDomain | null;
  domain: NumericDomain;
  controlled: boolean;
  zoom: boolean;
  brush: boolean;
  moved: boolean;
}

function releasePointer(current: Session, pointerId: number) {
  if (!current.captured.delete(pointerId)) return;
  try {
    current.owner.releasePointerCapture(pointerId);
  } catch {
    /* Capture may already be lost. */
  }
}
function releaseSession(current: Session | null) {
  if (current) for (const pointerId of [...current.captured]) releasePointer(current, pointerId);
}
function capturePointer(current: Session, pointerId: number) {
  if (current.captured.has(pointerId)) return true;
  try {
    current.owner.setPointerCapture(pointerId);
    current.captured.add(pointerId);
    return (
      typeof current.owner.hasPointerCapture !== 'function' ||
      current.owner.hasPointerCapture(pointerId)
    );
  } catch {
    return false;
  }
}
function insidePlot(point: Point, plot: ChartRect) {
  return (
    finite(plot.x) &&
    finite(plot.y) &&
    finite(plot.width) &&
    finite(plot.height) &&
    plot.width > 0 &&
    plot.height > 0 &&
    point.x >= plot.x &&
    point.x <= plot.x + plot.width &&
    point.y >= plot.y &&
    point.y <= plot.y + plot.height
  );
}

export function useChartViewport(
  props: ViewportProps,
  plotRef: React.RefObject<HTMLDivElement | null>,
  domain: NumericDomain,
  plot: ChartRect,
  enabled: boolean
) {
  const [range, setRange] = useControllableState<NumericDomain | null>({
    value: props.viewRange,
    defaultValue: props.defaultViewRange ?? null,
    onChange: props.onViewRangeChange,
  });
  const effectiveRange = normalizeViewRange(range, domain);
  const rangeStart = effectiveRange?.[0];
  const rangeEnd = effectiveRange?.[1];
  const domainStart = domain[0];
  const domainEnd = domain[1];
  // undefined means no preview; null is a real preview of the full domain.
  const [preview, setPreview] = React.useState<NumericDomain | null | undefined>(undefined);
  const [selection, setSelection] = React.useState<ChartRect | null>(null);
  const session = React.useRef<Session | null>(null);
  const suppressClickUntil = React.useRef(0);
  const wheelVetoes = React.useRef(new WeakSet<Event>());
  const lastCommit = React.useRef<{
    source: NumericDomain | null;
    next: NumericDomain | null;
    domain: NumericDomain;
  } | null>(null);
  const controlled = props.viewRange !== undefined;
  const latest = React.useRef({
    effectiveRange,
    domain,
    plot,
    setRange,
    zoom: Boolean(props.zoom),
    brush: Boolean(props.brush),
    enabled,
    controlled,
  });
  latest.current = {
    effectiveRange,
    domain,
    plot,
    setRange,
    zoom: Boolean(props.zoom),
    brush: Boolean(props.brush),
    enabled,
    controlled,
  };

  const suppressClick = (current: Session) => {
    if (current.moved) suppressClickUntil.current = performance.now() + 500;
  };
  const cancel = React.useCallback(() => {
    const current = session.current;
    session.current = null;
    if (current?.moved) suppressClickUntil.current = performance.now() + 500;
    releaseSession(current);
    setSelection(null);
    setPreview(undefined);
  }, []);
  const commit = React.useCallback((requested: NumericDomain | null) => {
    const current = latest.current;
    if (!current.enabled) return;
    const next = normalizeViewRange(requested, current.domain);
    if (sameChartRange(next, current.effectiveRange)) return;
    const previous = lastCommit.current;
    // A controlled host can reject a request; do not repeatedly submit that same state.
    if (
      current.controlled &&
      previous &&
      sameChartRange(previous.source, current.effectiveRange) &&
      sameChartRange(previous.next, next) &&
      sameChartRange(previous.domain, current.domain)
    )
      return;
    lastCommit.current = { source: current.effectiveRange, next, domain: [...current.domain] };
    if (!current.controlled) current.effectiveRange = next;
    current.setRange(next);
  }, []);
  const coordinate = (
    event: { clientX: number; clientY: number },
    owner: HTMLDivElement
  ): Point | null => {
    const bounds = owner.getBoundingClientRect();
    const point = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    return finite(point.x) && finite(point.y) ? point : null;
  };
  const usable = (current: Session) => {
    const context = latest.current;
    return (
      context.enabled &&
      ascending(context.domain) &&
      current.owner === plotRef.current &&
      current.zoom === context.zoom &&
      current.brush === context.brush &&
      (current.mode === 'drain' ||
        (current.controlled === context.controlled &&
          sameChartRange(current.source, context.effectiveRange) &&
          sameChartRange(current.domain, context.domain)))
    );
  };
  const rebaseline = (current: Session) => {
    const [a, b] = [...current.pointers.values()];
    current.distance = Math.hypot(b.x - a.x, b.y - a.y);
    current.anchor = ((a.x + b.x) / 2 - latest.current.plot.x) / latest.current.plot.width;
    current.baseline = current.preview;
    current.mode = 'pinch';
  };
  const move = (current: Session, pointerId: number, point: Point) => {
    current.pointers.set(pointerId, point);
    const context = latest.current;
    if (current.mode === 'pinch' && current.pointers.size === 2) {
      const [a, b] = [...current.pointers.values()];
      const distance = Math.hypot(b.x - a.x, b.y - a.y);
      if (!finite(distance) || distance <= 0) return;
      if (!finite(current.distance) || current.distance <= 0) {
        rebaseline(current);
        return;
      }
      if (!current.moved && Math.abs(distance - current.distance) <= 3) return;
      current.moved = true;
      const next = zoomChartRange(
        current.baseline,
        context.domain,
        current.distance / distance,
        current.anchor
      );
      if (!sameChartRange(next, current.preview)) {
        current.preview = next;
        setPreview(next);
      }
    } else if (
      current.pointers.size === 1 &&
      current.brushAllowed &&
      (current.mode === 'pending' || current.mode === 'brush') &&
      Math.abs(point.x - current.start) > 3
    ) {
      const start = Math.max(
        context.plot.x,
        Math.min(context.plot.x + context.plot.width, current.start)
      );
      const end = Math.max(context.plot.x, Math.min(context.plot.x + context.plot.width, point.x));
      current.mode = 'brush';
      current.moved = true;
      setSelection({
        x: Math.min(start, end),
        y: context.plot.y,
        width: Math.abs(start - end),
        height: context.plot.height,
      });
    }
    suppressClick(current);
  };

  React.useEffect(() => {
    lastCommit.current = null;
  }, [controlled, rangeStart, rangeEnd, domainStart, domainEnd]);
  React.useEffect(() => {
    if (session.current && !usable(session.current)) cancel();
    // All event paths also validate the latest context, before effects have run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    enabled,
    props.zoom,
    props.brush,
    controlled,
    rangeStart,
    rangeEnd,
    domainStart,
    domainEnd,
    cancel,
  ]);
  React.useEffect(() => {
    const element = plotRef.current;
    if (!element || !props.zoom) return;
    const wheel = (event: WheelEvent) => {
      const current = latest.current;
      if (
        !current.enabled ||
        !current.zoom ||
        session.current ||
        event.defaultPrevented ||
        wheelVetoes.current.has(event) ||
        event.ctrlKey ||
        event.metaKey ||
        !finite(event.deltaY) ||
        event.deltaY === 0 ||
        !ascending(current.domain)
      )
        return;
      const point = coordinate(event, element);
      if (!point || !insidePlot(point, current.plot)) return;
      const mode =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? element.clientWidth || current.plot.width
            : 1;
      const factor = Math.exp(Math.max(-0.7, Math.min(0.7, event.deltaY * mode * 0.002)));
      const next = zoomChartRange(
        current.effectiveRange,
        current.domain,
        factor,
        (point.x - current.plot.x) / current.plot.width
      );
      if (sameChartRange(next, current.effectiveRange)) return;
      event.preventDefault();
      commit(next);
    };
    element.addEventListener('wheel', wheel, { passive: false });
    return () => element.removeEventListener('wheel', wheel);
    // The native listener reads changing layout and callbacks through latest.
  }, [plotRef, props.zoom, commit]);
  React.useEffect(
    () => () => {
      const current = session.current;
      session.current = null;
      // React clears plotRef before effect cleanup; the session owns the actual element.
      releaseSession(current);
    },
    []
  );

  const reset = () => {
    if (latest.current.enabled) {
      cancel();
      commit(null);
    }
  };
  const handlers = {
    onWheelCapture(event: React.WheelEvent<HTMLDivElement>) {
      // React delegates wheel capture passively. Its synthetic veto can exist even when
      // nativeEvent.defaultPrevented is false, before our non-passive native listener.
      if (event.defaultPrevented) wheelVetoes.current.add(event.nativeEvent);
    },
    onPointerDownCapture(event: React.PointerEvent<HTMLDivElement>) {
      const context = latest.current;
      if (
        !context.enabled ||
        event.defaultPrevented ||
        event.button !== 0 ||
        !ascending(context.domain)
      )
        return;
      const target = event.target instanceof Element ? event.target : null;
      if (
        target?.closest(
          '[data-part="actions"], input, summary, select, textarea, a[href], button:not([data-part="datum"])'
        )
      )
        return;
      const datum = Boolean(target?.closest('[data-part="datum"], [data-part="mark"]'));
      const touch = event.pointerType === 'touch';
      // Even a datum click that starts no viewport session is a new user action,
      // not the compatibility click emitted at the end of the preceding gesture.
      if (!session.current) suppressClickUntil.current = 0;
      if (
        (!touch && (!context.brush || datum)) ||
        (touch && !context.zoom && (!context.brush || datum))
      )
        return;
      const point = coordinate(event, event.currentTarget);
      if (!point || !insidePlot(point, context.plot)) return;
      let current = session.current;
      if (current && !usable(current)) {
        cancel();
        current = null;
      }
      if (
        current &&
        (current.pointers.has(event.pointerId) ||
          !touch ||
          current.pointerType !== 'touch' ||
          current.mode === 'drain')
      )
        return;
      if (!current) {
        current = {
          owner: event.currentTarget,
          pointers: new Map(),
          captured: new Set(),
          pointerType: event.pointerType,
          mode: 'pending',
          start: point.x,
          brushAllowed: context.brush && !datum,
          distance: 0,
          anchor: 0.5,
          baseline: context.effectiveRange,
          preview: context.effectiveRange,
          source: context.effectiveRange,
          domain: [...context.domain],
          controlled: context.controlled,
          zoom: context.zoom,
          brush: context.brush,
          moved: false,
        };
        session.current = current;
      }
      current.pointers.set(event.pointerId, point);
      // A single datum touch is only observed: no focus, preventDefault or explicit capture.
      if (!datum || current.pointers.size > 1) {
        for (const pointerId of current.pointers.keys()) {
          if (!capturePointer(current, pointerId)) {
            cancel();
            return;
          }
        }
      }
      if (current.pointers.size === 2 && context.zoom) {
        rebaseline(current);
        setSelection(null);
      } else if (current.pointers.size > 2) current.mode = 'paused';
      else if (current.pointers.size > 1) {
        current.mode = 'drain';
        setSelection(null);
      }
      if (!datum) event.currentTarget.focus({ preventScroll: true });
    },
    onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
      const current = session.current;
      if (!current?.pointers.has(event.pointerId)) return;
      if (event.defaultPrevented || !usable(current)) {
        cancel();
        return;
      }
      const point = coordinate(event, current.owner);
      if (!point) {
        cancel();
        return;
      }
      move(current, event.pointerId, point);
      if (current.moved && current.mode !== 'drain') event.preventDefault();
    },
    onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
      const current = session.current;
      if (!current?.pointers.has(event.pointerId)) return;
      if (event.defaultPrevented || !usable(current)) {
        cancel();
        return;
      }
      const point = coordinate(event, current.owner);
      if (!point) {
        cancel();
        return;
      }
      move(current, event.pointerId, point);
      const wasPinch = current.mode === 'pinch';
      const wasBrush = current.mode === 'brush';
      current.pointers.delete(event.pointerId);
      // Remove ownership before releasing: synchronous lostcapture must not cancel others.
      releasePointer(current, event.pointerId);
      if (wasBrush) {
        const context = latest.current;
        const next = brushChartRange(
          current.start,
          point.x,
          { left: context.plot.x, width: context.plot.width },
          current.source ?? context.domain
        );
        if (next) commit(next);
      } else if (wasPinch && current.pointers.size < 2) {
        current.mode = 'drain';
        setPreview(undefined);
        commit(current.preview);
      } else if (current.mode === 'paused' && current.pointers.size === 2) {
        // Freeze with 3+ fingers, then start from the remaining pair and existing preview.
        rebaseline(current);
      }
      suppressClick(current);
      if (!current.pointers.size) {
        session.current = null;
        releaseSession(current);
        setSelection(null);
        setPreview(undefined);
      }
    },
    onPointerCancel(event: React.PointerEvent<HTMLDivElement>) {
      if (session.current?.pointers.has(event.pointerId)) cancel();
    },
    onLostPointerCapture(event: React.PointerEvent<HTMLDivElement>) {
      const current = session.current;
      // Implicit capture leaving a datum when we take ownership is not owner capture loss.
      if (current?.captured.has(event.pointerId) && event.target === current.owner) cancel();
    },
    onClickCapture(event: React.MouseEvent<HTMLDivElement>) {
      if (
        latest.current.enabled &&
        !event.defaultPrevented &&
        event.detail !== 0 &&
        performance.now() < suppressClickUntil.current
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    onDoubleClick(event: React.MouseEvent<HTMLDivElement>) {
      if (
        !event.defaultPrevented &&
        latest.current.enabled &&
        (latest.current.zoom || latest.current.brush)
      )
        reset();
    },
    onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
      const current = latest.current;
      if (
        !current.enabled ||
        event.defaultPrevented ||
        event.target !== event.currentTarget ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.nativeEvent.isComposing
      )
        return;
      if (event.key === 'Escape' && (current.effectiveRange || selection || session.current)) {
        event.preventDefault();
        event.stopPropagation();
        reset();
      } else if (current.zoom && ['+', '=', '-'].includes(event.key)) {
        const next = zoomChartRange(
          current.effectiveRange,
          current.domain,
          event.key === '-' ? 1.5 : 0.67
        );
        if (sameChartRange(next, current.effectiveRange)) return;
        event.preventDefault();
        cancel();
        commit(next);
      }
    },
  };
  return {
    range: enabled && preview !== undefined ? normalizeViewRange(preview, domain) : effectiveRange,
    selection,
    handlers,
    reset,
    suppressClickUntil,
  };
}
