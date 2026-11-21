// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { layoutGlobeLabels, normalizeGlobeLabelBudget } from './globe-label-layout';
import type {
  GlobeLabelCandidate,
  GlobeLabelLayoutOptions,
  GlobeLabelRect,
} from './globe-label-layout';

const label = (id: string, extras: Partial<GlobeLabelCandidate> = {}): GlobeLabelCandidate => ({
  id,
  x: 100,
  y: 100,
  width: 40,
  height: 20,
  visible: true,
  ...extras,
});
const options: GlobeLabelLayoutOptions = {
  width: 200,
  height: 200,
  padding: 0,
  collisionPadding: 0,
  gap: 8,
};
const intersects = (a: GlobeLabelRect, b: GlobeLabelRect) =>
  a.left < b.left + b.width &&
  a.left + a.width > b.left &&
  a.top < b.top + b.height &&
  a.top + a.height > b.top;

const sideReservations = [
  { left: 108, top: 96, width: 40, height: 8 },
  { left: 52, top: 96, width: 40, height: 8 },
];

describe('Globe label placements and collisions', () => {
  it('places an isolated label to the right using cached dimensions', () => {
    expect(layoutGlobeLabels([label('a')], options)).toEqual([
      { id: 'a', left: 108, top: 90, visible: true },
    ]);
  });

  it('tries the left side after the right side intersects reserved controls', () => {
    expect(
      layoutGlobeLabels([label('a')], { ...options, reserved: sideReservations.slice(0, 1) })
    ).toEqual([{ id: 'a', left: 52, top: 90, visible: true }]);
  });

  it('tries top then bottom when the earlier placements are blocked', () => {
    expect(layoutGlobeLabels([label('a')], { ...options, reserved: sideReservations })).toEqual([
      { id: 'a', left: 80, top: 72, visible: true },
    ]);
    expect(
      layoutGlobeLabels([label('a')], {
        ...options,
        reserved: [...sideReservations, { left: 80, top: 72, width: 40, height: 20 }],
      })
    ).toEqual([{ id: 'a', left: 80, top: 108, visible: true }]);
  });

  it('hides labels that cannot fit without changing marker visibility', () => {
    const candidate = Object.freeze(label('a', { selected: true }));
    const result = layoutGlobeLabels([candidate], {
      ...options,
      reserved: [{ left: 0, top: 0, width: 200, height: 200 }],
    });
    expect(result).toEqual([{ id: 'a', left: 100, top: 100, visible: false }]);
    expect(candidate.visible).toBe(true);
  });

  it('slides the perpendicular axis at stage edges and preserves the side gap', () => {
    expect(layoutGlobeLabels([label('right', { x: 195 })], options)).toEqual([
      { id: 'right', left: 147, top: 90, visible: true },
    ]);
    expect(
      layoutGlobeLabels([label('corner', { x: 0, y: 0 })], { ...options, padding: 4 })
    ).toEqual([{ id: 'corner', left: 8, top: 4, visible: true }]);
  });

  it('prevents overlap across spatial bucket boundaries', () => {
    const candidates = [
      label('a', { x: 20, y: 48, width: 70, height: 25 }),
      label('b', { x: 40, y: 48, width: 70, height: 25 }),
    ];
    const results = layoutGlobeLabels(candidates, { ...options, width: 300, height: 250, gap: 14 });
    const shown = results.filter((position) => position.visible);
    expect(shown).toHaveLength(2);
    const rects = shown.map((position) => ({ ...position, width: 70, height: 25 }));
    expect(intersects(rects[0], rects[1])).toBe(false);
  });

  it('allows touching rectangles with zero padding, but honors collision padding', () => {
    const candidates = [label('a'), label('b', { y: 120 })];
    const touching = layoutGlobeLabels(candidates, options);
    expect(touching.map((position) => position.left)).toEqual([108, 108]);
    expect(touching.every((position) => position.visible)).toBe(true);
    const padded = layoutGlobeLabels(candidates, { ...options, collisionPadding: 2 });
    expect(padded[1]).toMatchObject({ left: 52, visible: true });
  });

  it('returns an entry for every candidate, including occluded, invalid and over-budget labels', () => {
    const candidates = [
      label('occluded', { visible: false }),
      label('nan', { x: NaN }),
      label('infinity', { y: Infinity }),
      label('valid'),
    ];
    const results = layoutGlobeLabels(candidates, options);
    expect(results.map((position) => position.id)).toEqual(
      candidates.map((candidate) => candidate.id)
    );
    expect(results.map((position) => position.visible)).toEqual([false, false, false, true]);
    expect(
      results.every((position) => Number.isFinite(position.left) && Number.isFinite(position.top))
    ).toBe(true);
  });

  it('rejects missing/negative/nonfinite label dimensions and out-of-stage anchors', () => {
    const candidates = [
      label('negative', { width: -1 }),
      label('zero', { height: 0 }),
      label('nan', { width: NaN }),
      label('infinity', { height: Infinity }),
      label('outside-left', { x: -1 }),
      label('outside-bottom', { y: 201 }),
      label('too-wide', { width: 201 }),
      label('too-high', { height: 201 }),
      label(' '),
    ];
    expect(layoutGlobeLabels(candidates, options).every((position) => !position.visible)).toBe(
      true
    );
  });

  it('handles invalid/zero stages and invalid option values without nonfinite positions', () => {
    for (const width of [0, -100, NaN, Infinity]) {
      expect(layoutGlobeLabels([label('a')], { ...options, width })[0].visible).toBe(false);
    }
    expect(
      layoutGlobeLabels([label('a')], {
        width: 200,
        height: 200,
        gap: NaN,
        padding: NaN,
        collisionPadding: NaN,
      })[0]
    ).toMatchObject({ left: 108, top: 90, visible: true });
    expect(layoutGlobeLabels([], options)).toEqual([]);
  });

  it('ignores invalid/offstage reservations and safely indexes very large valid rectangles', () => {
    const reserved = [
      { left: NaN, top: 0, width: 100, height: 100 },
      { left: 0, top: 0, width: -1, height: 100 },
      { left: 1e10, top: 1e10, width: 100, height: 100 },
    ];
    expect(layoutGlobeLabels([label('a')], { ...options, reserved })[0].visible).toBe(true);
    expect(
      layoutGlobeLabels([label('a')], {
        ...options,
        reserved: [{ left: -1e12, top: -1e12, width: 2e12, height: 2e12 }],
      })[0].visible
    ).toBe(false);
  });
});

describe('Globe label determinism, priority and budgets', () => {
  it('gives selected then hovered labels priority regardless of source order or numeric priority', () => {
    const candidates = [
      label('ordinary', { priority: 1000 }),
      label('hovered', { hovered: true }),
      label('selected', { selected: true, priority: -100 }),
    ];
    const one = layoutGlobeLabels(candidates, { ...options, maxLabels: 1 });
    expect(one.map((position) => position.visible)).toEqual([false, false, true]);
    const two = layoutGlobeLabels(candidates, { ...options, maxLabels: 2 });
    expect(two.map((position) => position.visible)).toEqual([false, true, true]);
    expect(two[2].left).toBe(108);
    expect(two[1].left).toBe(52);
  });

  it('ranks finite numeric priority and falls back safely for invalid priorities', () => {
    const candidates = [
      label('negative', { priority: -2 }),
      label('nan', { priority: NaN }),
      label('highest', { priority: 5 }),
      label('infinity', { priority: Infinity }),
    ];
    expect(
      layoutGlobeLabels(candidates, { ...options, maxLabels: 1 })
        .filter((position) => position.visible)
        .map((position) => position.id)
    ).toEqual(['highest']);
  });

  it('uses stable ID ties so reorderings give the same choices/placements', () => {
    const candidates = [label('z'), label('a'), label('m')];
    const byId = (items: ReturnType<typeof layoutGlobeLabels>) =>
      items.slice().sort((a, b) => (a.id < b.id ? -1 : 1));
    const result = layoutGlobeLabels(candidates, { ...options, maxLabels: 2 });
    expect(result.map((position) => position.id)).toEqual(['z', 'a', 'm']);
    expect(result.filter((position) => position.visible).map((position) => position.id)).toEqual([
      'a',
      'm',
    ]);
    expect(
      byId(layoutGlobeLabels(candidates.slice().reverse(), { ...options, maxLabels: 2 }))
    ).toEqual(byId(result));
  });

  it('skips an impossible high-priority label rather than wasting the budget', () => {
    const candidates = [label('selected', { selected: true, width: 400 }), label('ordinary')];
    expect(
      layoutGlobeLabels(candidates, { ...options, maxLabels: 1 }).map(
        (position) => position.visible
      )
    ).toEqual([false, true]);
  });

  it('clamps the automatic label budget to 1..40 and defaults invalid input to 12', () => {
    expect(normalizeGlobeLabelBudget()).toBe(12);
    expect(normalizeGlobeLabelBudget(NaN)).toBe(12);
    expect(normalizeGlobeLabelBudget(Infinity)).toBe(12);
    expect(normalizeGlobeLabelBudget(-5)).toBe(1);
    expect(normalizeGlobeLabelBudget(0)).toBe(1);
    expect(normalizeGlobeLabelBudget(2.6)).toBe(3);
    expect(normalizeGlobeLabelBudget(500)).toBe(40);
    const candidates = Array.from({ length: 100 }, (_, index) =>
      label(`point-${index}`, { x: 10 + (index % 10) * 150, y: 30 + Math.floor(index / 10) * 70 })
    );
    for (const [maxLabels, expected] of [
      [undefined, 12],
      [-1, 1],
      [1000, 40],
    ] as const) {
      expect(
        layoutGlobeLabels(candidates, { width: 1800, height: 800, maxLabels }).filter(
          (position) => position.visible
        )
      ).toHaveLength(expected);
    }
  });

  it('does not mutate frozen candidates or reservation rectangles', () => {
    const candidates = Object.freeze([Object.freeze(label('a')), Object.freeze(label('b'))]);
    const reserved = Object.freeze([Object.freeze(sideReservations[0])]);
    const inputOptions = Object.freeze({ ...options, reserved });
    const first = layoutGlobeLabels(candidates, inputOptions);
    expect(layoutGlobeLabels(candidates, inputOptions)).toEqual(first);
    expect(candidates[0]).toEqual(label('a'));
    expect(reserved[0]).toEqual(sideReservations[0]);
  });

  it('handles a large dense candidate set while still prioritizing a selected label at the end', () => {
    const candidates = Array.from({ length: 20000 }, (_, index) => label(`point-${index}`));
    candidates.push(label('selected', { selected: true }));
    const result = layoutGlobeLabels(candidates, { ...options, maxLabels: 40 });
    expect(result).toHaveLength(20001);
    expect(result[result.length - 1]).toMatchObject({ id: 'selected', left: 108, visible: true });
    expect(result.filter((position) => position.visible)).toHaveLength(2);
  });
});
