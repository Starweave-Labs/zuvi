import type { StudioWordImageLayout } from './studio-types';

export function wordDefaultImageLayout(
  wrap: StudioWordImageLayout['wrap'] = 'square'
): StudioWordImageLayout {
  return {
    wrap,
    horizontal: { relative: 'column', align: 'right' },
    vertical: { relative: 'paragraph', offset: 0 },
    wrapSide: 'bothSides',
    distance: { top: 8, right: 8, bottom: 8, left: 8 },
    allowOverlap: true,
    lockAnchor: false,
    layoutInCell: true,
    zIndex: 1,
  };
}

export function wordImageCss(
  layout: StudioWordImageLayout | undefined,
  width: number,
  height: number,
  context?: {
    horizontal: Record<string, { start: number; size: number }>;
    vertical: Record<string, { start: number; size: number }>;
  }
): Record<string, string> {
  if (!layout) return {};
  const distance = layout.distance || {};
  const overlay = layout.wrap === 'front' || layout.wrap === 'behind';
  const right =
    layout.horizontal.align === 'right' ||
    layout.horizontal.align === 'outside' ||
    layout.wrapSide === 'left';
  const x = layout.horizontal.offset || 0;
  const y = layout.vertical.offset || 0;
  const result: Record<string, string> = {
    width: `${width}px`,
    height: `${height}px`,
    zIndex: layout.wrap === 'behind' ? '-1' : String((layout.zIndex ?? 1) + 1),
    ...(overlay
      ? { position: 'absolute', left: `${x}px`, top: `${y}px`, maxWidth: 'none' }
      : {
          float: right ? 'right' : 'left',
          marginTop: `${Math.max(0, y) + (distance.top || 0)}px`,
          marginBottom: `${distance.bottom || 0}px`,
          marginLeft: `${Math.max(0, x) + (distance.left || 0)}px`,
          marginRight: `${distance.right || 0}px`,
        }),
  };
  if (!overlay && layout.wrap === 'topBottom') {
    result.float = 'none';
    result.display = 'block';
    result.clear = 'both';
    result.marginLeft = right ? 'auto' : `${Math.max(0, x) + (distance.left || 0)}px`;
    result.marginRight =
      layout.horizontal.align === 'center' ? 'auto' : right ? `${distance.right || 0}px` : 'auto';
  }
  if (!overlay && ['tight', 'through'].includes(layout.wrap) && layout.polygon)
    result.shapeOutside = `polygon(${layout.polygon.map(([a, b]) => `${a / 216}% ${b / 216}%`).join(',')})`;
  if (overlay && context) {
    const coordinate = (axis: 'horizontal' | 'vertical', extent: number) => {
      const position = layout[axis];
      const base = context[axis][position.relative];
      if (!base) return position.offset || 0;
      const fraction =
        position.align === 'center'
          ? 0.5
          : ['right', 'bottom', 'outside'].includes(position.align || '')
            ? 1
            : 0;
      return (
        base.start +
        (position.align ? Math.max(0, base.size - extent) * fraction : position.offset || 0)
      );
    };
    result.left = `${coordinate('horizontal', width)}px`;
    result.top = `${coordinate('vertical', height)}px`;
  }
  return result;
}
