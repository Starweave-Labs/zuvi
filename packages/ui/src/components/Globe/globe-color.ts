import type { GlobePalette } from './globe-renderer-types';

const paletteVariables: Record<keyof GlobePalette, string> = {
  ocean: '--zuvi-globe-ocean-color',
  land: '--zuvi-globe-land-color',
  coast: '--zuvi-globe-coast-color',
  grid: '--zuvi-globe-grid-color',
  atmosphere: '--zuvi-globe-atmosphere-color',
  point: '--zuvi-globe-point-color',
  arc: '--zuvi-globe-arc-color',
};

/** Canvas resolves modern CSS colors (including oklch and nested vars) into sRGB. */
export function createGlobeColorResolver(root: HTMLElement) {
  const document = root.ownerDocument;
  const probe = document.createElement('span');
  probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;width:0;height:0';
  root.append(probe);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  let context: CanvasRenderingContext2D | null = null;
  try {
    context = canvas.getContext('2d', { willReadFrequently: true });
  } catch {
    /* Text-only hosts can still render the fallback. */
  }
  const cache = new Map<string, string>();
  const resolve = (color: string, fallback = 'white') => {
    const key = `${color}\n${fallback}`;
    const previous = cache.get(key);
    if (previous) return previous;
    probe.style.color = '';
    probe.style.color = color;
    const computed = probe.style.color ? document.defaultView?.getComputedStyle(probe).color : null;
    let resolved = computed && computed !== 'transparent' ? computed : fallback;
    if (context) {
      try {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = fallback;
        context.fillStyle = resolved;
        context.fillRect(0, 0, 1, 1);
        const channels = context.getImageData(0, 0, 1, 1).data;
        resolved = `rgb(${channels[0]}, ${channels[1]}, ${channels[2]})`;
      } catch {
        /* The computed CSS color remains usable by the SVG fallback. */
      }
    }
    cache.set(key, resolved);
    return resolved;
  };
  return {
    resolve,
    palette() {
      cache.clear();
      return Object.fromEntries(
        Object.entries(paletteVariables).map(([key, variable]) => [
          key,
          resolve(`var(${variable})`, key === 'ocean' ? 'black' : 'white'),
        ])
      ) as unknown as GlobePalette;
    },
    dispose() {
      probe.remove();
      cache.clear();
    },
  };
}
