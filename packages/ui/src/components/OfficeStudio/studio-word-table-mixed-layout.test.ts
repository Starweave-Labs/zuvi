import { afterEach, expect, it, vi } from 'vitest';
import { wordFillMixedTableRows, wordObserveMixedTableRows } from './studio-word-table-mixed-layout';

const cleanups: (() => void)[] = [];
afterEach(() => {
  cleanups.splice(0).reverse().forEach(cleanup => cleanup());
  vi.restoreAllMocks();
  document.body.replaceChildren();
});
function rect(width: number, height: number): DOMRect {
  return { width, height, x: 0, y: 0, left: 0, top: 0, right: width, bottom: height, toJSON: () => ({ width, height }) } as DOMRect;
}
function fixture(html = '<tbody><tr><td data-cell="short"><div data-word-cell-content><p><strong>Short</strong></p></div></td><td data-cell="long"><div data-word-cell-content><p>Long content</p></div></td></tr></tbody>') {
  const table = document.createElement('table');
  table.setAttribute('data-word-spacing-layout', 'mixed');
  table.setAttribute('data-word-table-margins', '{"top":0,"left":7}');
  table.innerHTML = html;
  document.body.append(table);
  Object.defineProperty(table, 'offsetWidth', { configurable: true, value: 200 });
  const tableRect = vi.spyOn(table, 'getBoundingClientRect').mockReturnValue(rect(200, 200));
  const cells = Array.from(table.rows).flatMap(row => Array.from(row.cells));
  const wrappers = cells.map(cell => cell.querySelector<HTMLElement>(':scope > [data-word-cell-content]')!);
  return { table, cells, wrappers, tableRect };
}

it('clears every owned old fill before measuring and fills short and tall natural cells to the row box without changing content or other styles', () => {
  const f = fixture(), nodes = f.wrappers.map(wrapper => wrapper.firstChild), text = f.table.textContent;
  f.wrappers.forEach((wrapper, index) => {
    wrapper.style.cssText = 'padding:3px 5px;border:1px solid black;box-sizing:border-box;height:auto';
    wrapper.firstElementChild!.setAttribute('style', `height:${index ? 80 : 20}px`);
  });
  let height = 1009;
  for (const cell of f.cells) {
    cell.style.paddingTop = '4px'; cell.style.paddingBottom = '6px';
    vi.spyOn(cell, 'getBoundingClientRect').mockImplementation(() => {
      expect(f.wrappers.every(wrapper => wrapper.style.minHeight === '')).toBe(true);
      return rect(100, height);
    });
  }
  wordFillMixedTableRows(f.table);
  expect(f.wrappers.map(wrapper => wrapper.style.minHeight)).toEqual(['999px', '999px']);
  height = 110.019;
  wordFillMixedTableRows(f.table);
  for (const [index, wrapper] of f.wrappers.entries()) {
    expect(parseFloat(wrapper.style.minHeight)).toBe(100.015625);
    expect(wrapper.style.height).toBe('auto'); expect(wrapper.style.padding).toBe('3px 5px');
    expect(wrapper.style.border).toBe('1px solid black'); expect(wrapper.firstChild).toBe(nodes[index]);
    expect(f.cells[index].getAttribute('data-cell')).toBe(index ? 'long' : 'short');
  }
  expect(f.table.textContent).toBe(text);
  expect(f.table.getAttribute('data-word-table-margins')).toBe('{"top":0,"left":7}');
  wordFillMixedTableRows(f.table);
  expect(f.wrappers.map(wrapper => parseFloat(wrapper.style.minHeight))).toEqual([100.015625, 100.015625]);
});

it('normalizes transformed cell rectangles by the table scale before subtracting unscaled outer spacing', () => {
  const f = fixture(); f.tableRect.mockReturnValue(rect(400, 400));
  for (const cell of f.cells) {
    cell.style.paddingTop = '10px'; cell.style.paddingBottom = '12px';
    vi.spyOn(cell, 'getBoundingClientRect').mockReturnValue(rect(200, 244));
  }
  wordFillMixedTableRows(f.table);
  expect(f.wrappers.map(wrapper => wrapper.style.minHeight)).toEqual(['100px', '100px']);
});

it('fills an automatic rowspan using its whole cell box and clears fixed and exact fills without measuring or increasing them', () => {
  const f = fixture('<tbody><tr><td rowspan="2"><div data-word-cell-content>Auto span</div></td><td><div data-word-cell-content style="height:48px">Fixed</div></td></tr><tr><td><div data-word-cell-content style="height:60px">Exact</div></td></tr></tbody>');
  f.cells[0].style.paddingTop = '8px'; f.cells[0].style.paddingBottom = '12px';
  for (const cell of f.cells) vi.spyOn(cell, 'getBoundingClientRect').mockReturnValue(rect(100, 220));
  wordFillMixedTableRows(f.table);
  f.cells[1].setAttribute('data-word-fixed-cell-height', '48');
  f.table.rows[1].setAttribute('data-word-row-height-rule', 'exact');
  for (const cell of f.cells.slice(1))
    vi.mocked(cell.getBoundingClientRect).mockImplementation(() => { throw new Error('Fixed cells must not be measured.'); });
  wordFillMixedTableRows(f.table);
  expect(f.wrappers.map(wrapper => wrapper.style.minHeight)).toEqual(['200px', '', '']);
  expect(f.wrappers[1].style.height).toBe('48px'); expect(f.wrappers[2].style.height).toBe('60px');
  expect(f.cells[0].rowSpan).toBe(2); expect(f.table.textContent).toBe('Auto spanFixedExact');
});

it('clears old fills on uniform layout and invalid visible scales without touching inner padding, borders or nested cells', () => {
  const f = fixture('<tbody><tr><td><div data-word-cell-content style="padding:4px;border:1px solid black"><p>Outer</p><table><tbody><tr><td><div data-word-cell-content style="min-height:77px">Inner</div></td></tr></tbody></table></div></td></tr></tbody>');
  const nested = f.table.querySelector('table')!.querySelector<HTMLElement>('[data-word-cell-content]')!;
  const measured = vi.spyOn(f.cells[0], 'getBoundingClientRect').mockReturnValue(rect(100, 40));
  wordFillMixedTableRows(f.table);
  expect(f.wrappers[0].style.minHeight).toBe('40px');
  f.tableRect.mockClear();
  f.table.setAttribute('data-word-spacing-layout', 'uniform');
  wordFillMixedTableRows(f.table);
  expect(f.wrappers[0].style.minHeight).toBe(''); expect(nested.style.minHeight).toBe('77px');
  expect(f.wrappers[0].style.padding).toBe('4px'); expect(f.wrappers[0].style.border).toBe('1px solid black');
  expect(f.tableRect).not.toHaveBeenCalled();
  f.table.setAttribute('data-word-spacing-layout', 'mixed'); measured.mockReturnValue(rect(100, 20));
  wordFillMixedTableRows(f.table);
  expect(f.wrappers[0].style.minHeight).toBe('20px');
  Object.defineProperty(f.table, 'offsetWidth', { configurable: true, value: 0 });
  wordFillMixedTableRows(f.table);
  expect(f.wrappers[0].style.minHeight).toBe(''); expect(nested.style.minHeight).toBe('77px');
});

function observers() {
  const frames = new Map<number, FrameRequestCallback>(); let nextFrame = 0;
  const request = vi.fn((callback: FrameRequestCallback) => { const id = ++nextFrame; frames.set(id, callback); return id; });
  const cancel = vi.fn((id: number) => frames.delete(id));
  class Resize {
    static instances: Resize[] = [];
    targets = new Set<Element>();
    observe = vi.fn((element: Element) => this.targets.add(element));
    unobserve = vi.fn((element: Element) => this.targets.delete(element));
    disconnect = vi.fn(() => this.targets.clear());
    constructor(readonly callback: ResizeObserverCallback) { Resize.instances.push(this); }
    fire() { this.callback([], this as unknown as ResizeObserver); }
  }
  class Mutation {
    static instances: Mutation[] = [];
    observe = vi.fn(); disconnect = vi.fn();
    constructor(readonly callback: MutationCallback) { Mutation.instances.push(this); }
    fire(records: MutationRecord[] = []) { this.callback(records, this as unknown as MutationObserver); }
  }
  for (const [name, value] of Object.entries({ requestAnimationFrame: request, cancelAnimationFrame: cancel, ResizeObserver: Resize, MutationObserver: Mutation })) {
    const descriptor = Object.getOwnPropertyDescriptor(window, name);
    Object.defineProperty(window, name, { configurable: true, writable: true, value });
    cleanups.push(() => { if (descriptor) Object.defineProperty(window, name, descriptor); else Reflect.deleteProperty(window, name); });
  }
  const flush = () => { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(0)); };
  return { frames, request, cancel, Resize, Mutation, flush };
}

it('batches natural resize and DOM events, refreshes direct-child observations, and disconnects and cancels pending frames on cleanup', () => {
  const o = observers(), f = fixture(); let height = 140;
  for (const cell of f.cells) vi.spyOn(cell, 'getBoundingClientRect').mockImplementation(() => rect(100, height));
  const stop = wordObserveMixedTableRows(f.table); cleanups.push(stop);
  const resize = o.Resize.instances[0], mutation = o.Mutation.instances[0];
  expect(mutation.observe).toHaveBeenCalledWith(f.table, {
    childList: true, characterData: true, subtree: true, attributes: true, attributeOldValue: true,
    attributeFilter: ['style', 'class', 'data-word-spacing-layout', 'data-word-row-height-rule', 'data-word-fixed-cell-height', 'data-word-cell-content', 'rowspan'],
  });
  expect(resize.targets.has(f.table)).toBe(true);
  for (const wrapper of f.wrappers) {
    expect(resize.targets.has(wrapper)).toBe(false); expect(resize.targets.has(wrapper.firstElementChild!)).toBe(true);
  }
  mutation.fire(); mutation.fire(); resize.fire();
  expect(o.frames.size).toBe(1); expect(o.request).toHaveBeenCalledOnce();
  o.flush(); expect(f.wrappers[0].style.minHeight).toBe('140px');
  const old = f.wrappers[0].firstElementChild!, image = document.createElement('img');
  f.wrappers[0].replaceChildren(image); height = 180;
  mutation.fire(); resize.fire(); expect(o.frames.size).toBe(1);
  o.flush();
  expect(resize.unobserve).toHaveBeenCalledWith(old); expect(resize.targets.has(image)).toBe(true);
  expect(resize.targets.has(old)).toBe(false); expect(f.wrappers[0].style.minHeight).toBe('180px');
  resize.fire(); expect(o.frames.size).toBe(1);
  stop();
  expect(mutation.disconnect).toHaveBeenCalledOnce(); expect(resize.disconnect).toHaveBeenCalledOnce();
  expect(o.cancel).toHaveBeenCalledOnce(); expect(o.frames.size).toBe(0);
  const requests = o.request.mock.calls.length;
  mutation.fire(); resize.fire(); o.flush();
  expect(o.request).toHaveBeenCalledTimes(requests); expect(f.wrappers[0].style.minHeight).toBe('180px');
  cleanups.pop();
});

function record(target: Node, type: MutationRecord['type'], attributeName: string | null = null, oldValue: string | null = null): MutationRecord {
  const empty = document.createDocumentFragment().childNodes;
  return { type, target, attributeName, oldValue, addedNodes: empty, removedNodes: empty, attributeNamespace: null, nextSibling: null, previousSibling: null };
}
function attribute(target: Element, name: string, oldValue: string | null): MutationRecord {
  return record(target, 'attributes', name, oldValue);
}

it('ignores its own clear-and-refill style records but restores an external min-height reset without requiring a child resize', () => {
  const o = observers(), f = fixture();
  for (const cell of f.cells) vi.spyOn(cell, 'getBoundingClientRect').mockReturnValue(rect(100, 226));
  const stop = wordObserveMixedTableRows(f.table); cleanups.push(stop);
  const mutation = o.Mutation.instances[0]; o.flush();
  expect(f.wrappers[0].style.minHeight).toBe('226px');
  const appliedStyle = f.wrappers[0].getAttribute('style');
  mutation.fire([attribute(f.wrappers[0], 'style', appliedStyle), attribute(f.wrappers[0], 'style', '')]);
  expect(o.frames.size).toBe(0);
  f.wrappers[0].removeAttribute('style');
  mutation.fire([attribute(f.wrappers[0], 'style', appliedStyle)]);
  expect(o.frames.size).toBe(1); o.flush();
  expect(f.wrappers.map(wrapper => wrapper.style.minHeight)).toEqual(['226px', '226px']);
  mutation.fire([attribute(f.wrappers[0], 'style', '')]);
  expect(o.frames.size).toBe(0);
});

it('fills replaced contentDOM nodes and responds to attribute-only table mode and fixed-cell changes', () => {
  const o = observers(), f = fixture();
  for (const cell of f.cells) vi.spyOn(cell, 'getBoundingClientRect').mockReturnValue(rect(100, 196));
  const stop = wordObserveMixedTableRows(f.table); cleanups.push(stop);
  const mutation = o.Mutation.instances[0]; o.flush();
  const old = f.wrappers[0], replacement = document.createElement('div');
  replacement.setAttribute('data-word-cell-content', ''); replacement.innerHTML = '<p>Replacement</p>';
  old.replaceWith(replacement);
  mutation.fire([record(f.cells[0], 'childList')]); o.flush();
  expect(replacement.style.minHeight).toBe('196px'); expect(old.style.minHeight).toBe('196px');
  const oldMode = f.table.getAttribute('data-word-spacing-layout');
  f.table.setAttribute('data-word-spacing-layout', 'uniform');
  mutation.fire([attribute(f.table, 'data-word-spacing-layout', oldMode)]); o.flush();
  expect(replacement.style.minHeight).toBe(''); expect(f.wrappers[1].style.minHeight).toBe('');
  f.table.setAttribute('data-word-spacing-layout', 'mixed');
  mutation.fire([attribute(f.table, 'data-word-spacing-layout', 'uniform')]); o.flush();
  expect(replacement.style.minHeight).toBe('196px');
  f.cells[0].setAttribute('data-word-fixed-cell-height', '48');
  mutation.fire([attribute(f.cells[0], 'data-word-fixed-cell-height', null)]); o.flush();
  expect(replacement.style.minHeight).toBe(''); expect(f.wrappers[1].style.minHeight).toBe('196px');
});

it('recalculates outer padding changed only through an attribute and does not discard other content styles', () => {
  const o = observers(), f = fixture();
  for (const cell of f.cells) vi.spyOn(cell, 'getBoundingClientRect').mockReturnValue(rect(100, 150));
  const stop = wordObserveMixedTableRows(f.table); cleanups.push(stop);
  const mutation = o.Mutation.instances[0]; o.flush();
  const old = f.cells[0].getAttribute('style');
  f.cells[0].style.paddingTop = '10px'; f.cells[0].style.paddingBottom = '14px';
  mutation.fire([attribute(f.cells[0], 'style', old)]); o.flush();
  expect(f.wrappers[0].style.minHeight).toBe('126px');
  const before = f.wrappers[0].getAttribute('style'); f.wrappers[0].style.padding = '3px';
  mutation.fire([attribute(f.wrappers[0], 'style', before)]); o.flush();
  expect(f.wrappers[0].style.padding).toBe('3px'); expect(f.wrappers[0].style.minHeight).toBe('126px');
});

it('never measures or writes disconnected tables, including a frame queued before detachment', () => {
  const o = observers(), f = fixture();
  f.wrappers[0].style.minHeight = '77px';
  const stop = wordObserveMixedTableRows(f.table); cleanups.push(stop);
  const resize = o.Resize.instances[0], mutation = o.Mutation.instances[0];
  f.table.remove(); o.flush();
  wordFillMixedTableRows(f.table); mutation.fire(); resize.fire();
  expect(f.wrappers[0].style.minHeight).toBe('77px'); expect(f.tableRect).not.toHaveBeenCalled();
  expect(o.frames.size).toBe(0); expect(o.request).toHaveBeenCalledOnce();
  const constructors = [o.Resize.instances.length, o.Mutation.instances.length];
  wordObserveMixedTableRows(f.table)();
  expect([o.Resize.instances.length, o.Mutation.instances.length]).toEqual(constructors);
});

it('preserves unowned uniform minima and restores the pre-fill minimum and priority after switching out of mixed layout', () => {
  const f = fixture();
  f.table.setAttribute('data-word-spacing-layout', 'uniform');
  f.wrappers[0].style.setProperty('min-height', '77px', 'important');
  wordFillMixedTableRows(f.table);
  expect(f.wrappers[0].style.minHeight).toBe('77px');
  expect(f.wrappers[0].style.getPropertyPriority('min-height')).toBe('important');
  f.table.setAttribute('data-word-spacing-layout', 'mixed');
  for (const cell of f.cells) vi.spyOn(cell, 'getBoundingClientRect').mockReturnValue(rect(100, 140));
  wordFillMixedTableRows(f.table);
  expect(f.wrappers[0].style.minHeight).toBe('140px');
  f.table.setAttribute('data-word-spacing-layout', 'uniform');
  wordFillMixedTableRows(f.table);
  expect(f.wrappers[0].style.minHeight).toBe('77px');
  expect(f.wrappers[0].style.getPropertyPriority('min-height')).toBe('important');
  expect(f.wrappers[1].style.minHeight).toBe('');
});

it('keeps a foreign minimum installed after an owned fill instead of restoring an obsolete value', () => {
  const f = fixture();
  for (const cell of f.cells) vi.spyOn(cell, 'getBoundingClientRect').mockReturnValue(rect(100, 140));
  wordFillMixedTableRows(f.table);
  f.wrappers[0].style.setProperty('min-height', '93px', 'important');
  f.table.setAttribute('data-word-spacing-layout', 'uniform');
  wordFillMixedTableRows(f.table);
  expect(f.wrappers[0].style.minHeight).toBe('93px');
  expect(f.wrappers[0].style.getPropertyPriority('min-height')).toBe('important');
  expect(f.wrappers[1].style.minHeight).toBe('');
});
