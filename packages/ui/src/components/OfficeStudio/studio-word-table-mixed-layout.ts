function contents(table: HTMLTableElement) {
  return Array.from(table.rows).flatMap(row => Array.from(row.cells)).flatMap(cell => {
    const content = cell.querySelector<HTMLElement>(':scope > [data-word-cell-content]');
    return content ? [{ cell, content }] : [];
  });
}

type FilledHeight = { value: string; previousValue: string; previousPriority: string };
const filledHeights = new WeakMap<HTMLElement, FilledHeight>();

/** Fill the visible automatic cell box without changing document attributes or content. */
export function wordFillMixedTableRows(table: HTMLTableElement): void {
  const win = table.ownerDocument.defaultView;
  if (!win || !table.isConnected) return;
  const entries = contents(table);
  const natural = new Map<HTMLElement, { value: string; priority: string }>();
  for (const { content } of entries) {
    const owned = filledHeights.get(content);
    // A different value or priority belongs to another view update.
    if (owned && content.style.minHeight === owned.value &&
      content.style.getPropertyPriority('min-height') === '') {
      if (owned.previousValue)
        content.style.setProperty('min-height', owned.previousValue, owned.previousPriority);
      else content.style.removeProperty('min-height');
    }
    filledHeights.delete(content);
    natural.set(content, {
      value: content.style.minHeight, priority: content.style.getPropertyPriority('min-height'),
    });
  }
  if (table.getAttribute('data-word-spacing-layout') !== 'mixed') return;
  const scale = table.offsetWidth > 0 ? table.getBoundingClientRect().width / table.offsetWidth : 0;
  if (!Number.isFinite(scale) || scale <= 0) return;
  const sizes = entries.flatMap(({ cell, content }) => {
    if (cell.hasAttribute('data-word-fixed-cell-height') ||
      cell.parentElement?.getAttribute('data-word-row-height-rule') === 'exact') return [];
    const style = win.getComputedStyle(cell);
    const top = parseFloat(style.paddingTop) || 0, bottom = parseFloat(style.paddingBottom) || 0;
    const height = cell.getBoundingClientRect().height / scale - top - bottom;
    return Number.isFinite(height) ? [{ content, height: Math.floor(Math.max(0, height) * 64) / 64 }] : [];
  });
  for (const { content, height } of sizes) {
    if (!table.isConnected) return;
    if (!content.isConnected || content.closest('table') !== table) continue;
    content.style.setProperty('min-height', `${height}px`, '');
    const previous = natural.get(content)!;
    filledHeights.set(content, {
      value: content.style.minHeight, previousValue: previous.value, previousPriority: previous.priority,
    });
  }
}

/** Observe natural sizes and DOM replacement without feeding back our own fill writes. */
export function wordObserveMixedTableRows(table: HTMLTableElement): () => void {
  const win = table.ownerDocument.defaultView;
  if (!win || !table.isConnected) return () => undefined;
  let active = true, frame: number | null = null;
  const observed = new Set<Element>();
  const schedule = () => {
    if (!active || !table.isConnected || frame !== null) return;
    frame = win.requestAnimationFrame(() => {
      frame = null;
      if (!active || !table.isConnected) return;
      refresh();
      wordFillMixedTableRows(table);
    });
  };
  const resize = typeof win.ResizeObserver === 'function' ? new win.ResizeObserver(schedule) : undefined;
  const refresh = () => {
    if (!resize) return;
    const next = new Set<Element>([table]);
    for (const { content } of contents(table))
      for (const element of Array.from(content.children)) next.add(element);
    for (const element of observed) if (!next.has(element)) {
      resize.unobserve(element); observed.delete(element);
    }
    for (const element of next) if (!observed.has(element)) {
      resize.observe(element); observed.add(element);
    }
  };
  const scratch = table.ownerDocument.createElement('div');
  const withoutFill = (style: string | null) => {
    scratch.style.cssText = style || '';
    scratch.style.removeProperty('min-height');
    return scratch.style.cssText;
  };
  const needsFill = (record: MutationRecord) => {
    if (record.type !== 'attributes') return true;
    const element = record.target as HTMLElement, name = record.attributeName!;
    const current = element.getAttribute(name);
    if (record.oldValue === current) return false;
    if (name === 'style' && element.matches('[data-word-cell-content]') && filledHeights.has(element)) {
      const expected = filledHeights.get(element)!;
      if (element.style.minHeight === expected.value && element.style.getPropertyPriority('min-height') === '' &&
        withoutFill(record.oldValue) === withoutFill(current)) return false;
    }
    return true;
  };
  const mutation = new win.MutationObserver(records => {
    if (!active || !table.isConnected) return;
    if (!records.length || records.some(needsFill)) schedule();
  });
  mutation.observe(table, {
    childList: true, characterData: true, subtree: true, attributes: true, attributeOldValue: true,
    attributeFilter: ['style', 'class', 'data-word-spacing-layout', 'data-word-row-height-rule', 'data-word-fixed-cell-height', 'data-word-cell-content', 'rowspan'],
  });
  refresh();
  schedule();
  return () => {
    if (!active) return;
    active = false;
    mutation.disconnect();
    resize?.disconnect();
    observed.clear();
    if (frame !== null) win.cancelAnimationFrame(frame);
    frame = null;
  };
}
