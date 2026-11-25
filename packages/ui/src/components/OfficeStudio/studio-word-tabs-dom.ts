import { wordNextTab, wordTabStops, wordDecimalSymbol } from './studio-word-tabs';

const typography = [
  'font-family', 'font-size', 'font-weight', 'font-style', 'font-variant',
  'letter-spacing', 'word-spacing', 'text-transform',
];

/** Measure in a hidden, unwrapped clone outside the editor, retaining each run's typography. */
export function wordLayoutTabElements(root: HTMLElement) {
  const doc = root.ownerDocument, win = doc.defaultView;
  if (!win) return;
  for (const paragraph of root.querySelectorAll<HTMLElement>('p[data-word-tabs],h1[data-word-tabs],h2[data-word-tabs],h3[data-word-tabs],h4[data-word-tabs],h5[data-word-tabs],h6[data-word-tabs]')) {
    const tabs = [...paragraph.querySelectorAll<HTMLElement>('[data-word-tab]')];
    if (!tabs.length || !paragraph.offsetWidth) continue;
    let stops;
    try { stops = wordTabStops(JSON.parse(paragraph.dataset.wordTabs || '[]')); }
    catch { continue; }
    const clone = paragraph.cloneNode(true) as HTMLElement;
    clone.removeAttribute('id'); clone.setAttribute('aria-hidden', 'true');
    clone.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;left:0;top:0;width:max-content;max-width:none;white-space:pre;margin:0;padding:0;border:0;text-indent:0;transform:none';
    const sourceRuns = [paragraph, ...paragraph.querySelectorAll<HTMLElement>('*')];
    const clonedRuns = [clone, ...clone.querySelectorAll<HTMLElement>('*')];
    sourceRuns.forEach((source, index) => {
      const style = win.getComputedStyle(source);
      for (const key of typography) clonedRuns[index].style.setProperty(key, style.getPropertyValue(key));
    });
    const clonedTabs = [...clone.querySelectorAll<HTMLElement>('[data-word-tab]')];
    for (const tab of clonedTabs) { tab.style.width = '0px'; tab.dataset.wordLeader = 'none'; }
    doc.body.append(clone);
    try {
      const scale = paragraph.getBoundingClientRect().width / paragraph.offsetWidth;
      const indent = parseFloat(win.getComputedStyle(paragraph).marginLeft) || 0;
      for (let index = 0; index < tabs.length; index++) {
        const measured = clonedTabs[index];
        const range = doc.createRange();
        range.setStartAfter(measured); range.setEnd(clone, clone.childNodes.length);
        // A manual line break or another tab ends the segment governed by this stop.
        for (const boundary of clone.querySelectorAll('[data-word-tab],br')) {
          if (boundary === measured || !(measured.compareDocumentPosition(boundary) & 4)) continue;
          range.setEndBefore(boundary); break;
        }
        const following = range.getBoundingClientRect().width * 0.75;
        let decimal = following;
        const symbol = wordDecimalSymbol(paragraph.dataset.wordDecimalSymbol);
        const walker = doc.createTreeWalker(clone, 4);
        while (walker.nextNode()) {
          const text = walker.currentNode as Text;
          if (!range.intersectsNode(text) || text.parentElement?.closest('[data-word-tab]')) continue;
          const index = text.data.indexOf(symbol);
          if (index < 0 || range.comparePoint(text, index) !== 0) continue;
          const prefix = range.cloneRange(); prefix.setEnd(text, index);
          decimal = prefix.getBoundingClientRect().width * 0.75; break;
        }
        const current = ((tabs[index].getBoundingClientRect().left - paragraph.getBoundingClientRect().left) / scale + indent) * 0.75;
        const layout = wordNextTab(stops, current, following, decimal, Number(paragraph.dataset.wordDefaultTab || 36));
        const width = `${Math.max(0, layout.width) / 0.75}px`;
        if (tabs[index].style.width !== width) tabs[index].style.width = width;
        if (tabs[index].dataset.wordLeader !== (layout.leader ?? 'none')) tabs[index].dataset.wordLeader = layout.leader ?? 'none';
      }
    } finally { clone.remove(); }
  }
}
