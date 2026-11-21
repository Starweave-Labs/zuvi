import type { ChartGeometry, ChartGeometryOptions, ChartSize, ChartRect } from './chart-geometry';
import { getChartDatums, type ChartModel } from './chart-model';
import {
  ascending,
  chartCoordinate as n,
  chartPoint,
  chartSectorPath,
  numericTicks,
  resolveChartDomain,
  scaleChartValue,
} from './chart-scale';

const tau = Math.PI * 2;
const path = (points: readonly (readonly [number, number])[], closed = true) =>
  points.map((point, index) => `${index ? 'L' : 'M'} ${n(point[0])} ${n(point[1])}`).join(' ') +
  (closed ? ' Z' : '');

interface Tile {
  datum: ReturnType<typeof getChartDatums>[number];
  area: number;
}
/** Squarify preserves areas; layout order alone may be sorted, never the source data table. */
function squarify(tiles: Tile[], rect: ChartRect): { tile: Tile; rect: ChartRect }[] {
  const output: { tile: Tile; rect: ChartRect }[] = [];
  const remaining = { ...rect };
  const worst = (row: Tile[], side: number) => {
    const sum = row.reduce((value, tile) => value + tile.area, 0);
    let minimum = Infinity;
    let maximum = 0;
    for (const tile of row) {
      minimum = Math.min(minimum, tile.area);
      maximum = Math.max(maximum, tile.area);
    }
    return Math.max((side * side * maximum) / (sum * sum), (sum * sum) / (side * side * minimum));
  };
  const layout = (row: Tile[]) => {
    const total = row.reduce((value, tile) => value + tile.area, 0);
    if (remaining.width <= remaining.height) {
      const height = Math.min(remaining.height, total / Math.max(1e-12, remaining.width));
      let x = remaining.x;
      row.forEach((tile, index) => {
        const width =
          index === row.length - 1
            ? remaining.x + remaining.width - x
            : tile.area / Math.max(height, 1e-12);
        output.push({ tile, rect: { x, y: remaining.y, width: Math.max(0, width), height } });
        x += width;
      });
      remaining.y += height;
      remaining.height -= height;
    } else {
      const width = Math.min(remaining.width, total / Math.max(1e-12, remaining.height));
      let y = remaining.y;
      row.forEach((tile, index) => {
        const height =
          index === row.length - 1
            ? remaining.y + remaining.height - y
            : tile.area / Math.max(width, 1e-12);
        output.push({ tile, rect: { x: remaining.x, y, width, height: Math.max(0, height) } });
        y += height;
      });
      remaining.x += width;
      remaining.width -= width;
    }
  };
  let row: Tile[] = [];
  for (const tile of tiles) {
    const side = Math.max(1e-12, Math.min(remaining.width, remaining.height));
    if (row.length && worst([...row, tile], side) > worst(row, side)) {
      layout(row);
      row = [];
    }
    row.push(tile);
  }
  if (row.length) layout(row);
  return output;
}

export function buildChartShapes(
  model: ChartModel,
  size: ChartSize,
  geometry: ChartGeometry,
  options: ChartGeometryOptions
): ChartGeometry {
  const datums = getChartDatums(model);
  if (['treemap', 'funnel', 'gauge'].includes(model.type))
    geometry.plot = {
      left: 8,
      top: 8,
      width: Math.max(1, size.width - 16),
      height: Math.max(1, size.height - 16),
    };
  const plot = geometry.plot;
  const centerX = plot.left + plot.width / 2;
  const centerY = plot.top + plot.height / 2;
  const rectangle = (
    datum: (typeof datums)[number],
    kind: 'bar' | 'cell' | 'tile',
    rect: ChartRect
  ) => ({ datum, kind, rect, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });
  if (model.type === 'radar') {
    const r = Math.max(1, Math.min(plot.width, plot.height) / 2 - 30);
    const domain =
      ascending(options.yDomain) && options.yDomain[0] >= 0
        ? options.yDomain
        : resolveChartDomain(
            datums.map((datum) => datum.value),
            true
          );
    geometry.yDomain = domain;
    const axes = model.categories.map((label, index) => ({
      label,
      angle: -Math.PI / 2 + (index / model.categories.length) * tau,
    }));
    geometry.radar = { cx: centerX, cy: centerY, r, axes, rings: [0.25, 0.5, 0.75, 1] };
    const grouped = new Map<string, typeof datums>();
    for (const datum of datums) {
      const group = grouped.get(datum.seriesId) ?? [];
      group.push(datum);
      grouped.set(datum.seriesId, group);
    }
    for (const [seriesId, group] of grouped) {
      const coordinates = group.map((datum) =>
        chartPoint(
          centerX,
          centerY,
          scaleChartValue(datum.value, domain, [0, r]),
          axes[datum.index].angle
        )
      );
      geometry.seriesPaths.push({
        id: seriesId,
        color: group[0].color,
        linePath: path(coordinates),
        areaPath: path(coordinates),
      });
      group.forEach((datum, index) =>
        geometry.marks.push({
          datum,
          kind: 'point',
          x: coordinates[index][0],
          y: coordinates[index][1],
        })
      );
    }
    return geometry;
  }
  if (model.type === 'heatmap') {
    const rows = model.rows ?? [];
    const columns = model.columns ?? [];
    const rowIndex = new Map(rows.map((row, index) => [row, index]));
    const colIndex = new Map(columns.map((col, index) => [col, index]));
    const cells = model.cells ?? [];
    const domain = resolveChartDomain(cells.map((cell) => cell.value));
    const width = plot.width / Math.max(1, columns.length);
    const height = plot.height / Math.max(1, rows.length);
    geometry.heatLegend = { min: domain[0], max: domain[1] };
    const insetX = Math.min(1, width / 4);
    const insetY = Math.min(1, height / 4);
    const cellRect = (row: number, col: number): ChartRect => ({
      x: plot.left + col * width + insetX,
      y: plot.top + row * height + insetY,
      width: width - insetX * 2,
      height: height - insetY * 2,
    });
    geometry.backgrounds = [];
    // Backgrounds are decorative, not datums. Never expand a sparse input to rows × cols.
    // Small grids retain distinct missing-cell tiles; large grids share a neutral underlay.
    if (rows.length && columns.length) {
      if (rows.length <= 4096 / columns.length) {
        for (let row = 0; row < rows.length; row++)
          for (let col = 0; col < columns.length; col++)
            geometry.backgrounds.push(cellRect(row, col));
      } else
        geometry.backgrounds.push({
          x: plot.left,
          y: plot.top,
          width: plot.width,
          height: plot.height,
        });
    }
    for (let index = 0; index < cells.length; index++) {
      const cell = cells[index];
      const datum = datums[index];
      const heat = scaleChartValue(cell.value, domain, [0, 1]);
      const color = cell.explicitColor
        ? cell.color
        : `color-mix(in srgb, var(--zuvi-chart-series-1) ${Math.round(18 + heat * 82)}%, var(--zuvi-chart-bg))`;
      geometry.marks.push({
        ...rectangle(
          { ...datum, color },
          'cell',
          cellRect(rowIndex.get(cell.row)!, colIndex.get(cell.col)!)
        ),
        heat,
        ...(width >= 40 && height >= 26 ? { label: String(cell.value) } : {}),
      });
    }
    geometry.xTicks = columns.flatMap((label, index) =>
      index % Math.max(1, Math.ceil(columns.length / Math.max(1, Math.floor(plot.width / 55))))
        ? []
        : [{ value: index, label, position: plot.left + (index + 0.5) * width }]
    );
    geometry.yTicks = rows.flatMap((label, index) =>
      index % Math.max(1, Math.ceil(rows.length / Math.max(1, Math.floor(plot.height / 25))))
        ? []
        : [{ value: index, label, position: plot.top + (index + 0.5) * height }]
    );
    return geometry;
  }
  if (model.type === 'treemap') {
    const available = {
      x: 6,
      y: 6,
      width: Math.max(1, size.width - 12),
      height: Math.max(1, size.height - 12),
    };
    const tiles = datums
      .filter((datum) => datum.value > 0 && datum.percent! > 0)
      .map((datum) => ({ datum, area: datum.percent! * available.width * available.height }))
      .sort((a, b) => b.area - a.area || a.datum.index - b.datum.index);
    for (const item of squarify(tiles, available)) {
      const rect = {
        x: item.rect.x + 1,
        y: item.rect.y + 1,
        width: Math.max(0, item.rect.width - 2),
        height: Math.max(0, item.rect.height - 2),
      };
      geometry.marks.push({
        ...rectangle(item.tile.datum, 'tile', rect),
        ...(rect.width >= 65 && rect.height >= 32 ? { label: item.tile.datum.label } : {}),
      });
    }
    return geometry;
  }
  if (model.type === 'funnel') {
    let maximum = 0;
    datums.forEach((datum) => {
      maximum = Math.max(maximum, datum.value);
    });
    const band = plot.height / Math.max(1, datums.length);
    datums.forEach((datum, index) => {
      const topWidth = maximum ? (datum.value / maximum) * plot.width : 0;
      const next = index === datums.length - 1 ? datum.value * 0.8 : datums[index + 1].value;
      const bottomWidth = maximum ? (next / maximum) * plot.width : 0;
      const top = plot.top + index * band + 2;
      const bottom = plot.top + (index + 1) * band - 2;
      geometry.marks.push({
        datum,
        kind: 'slice',
        x: centerX,
        y: (top + bottom) / 2,
        path: path([
          [centerX - topWidth / 2, top],
          [centerX + topWidth / 2, top],
          [centerX + bottomWidth / 2, bottom],
          [centerX - bottomWidth / 2, bottom],
        ]),
        label: `${datum.label} · ${datum.value}`,
      });
    });
    return geometry;
  }
  if (model.type === 'gauge') {
    const datum = datums[0];
    const minimum = model.gauge?.min ?? 0;
    const maximum = model.gauge?.max ?? 100;
    const r = Math.min(plot.width, plot.height) / 2 - 8;
    const start = Math.PI * 0.75;
    const sweep = Math.PI * 1.5;
    const value = datum?.value ?? minimum;
    const progress = scaleChartValue(value, [minimum, maximum], [0, 1]);
    geometry.gauge = {
      cx: centerX,
      cy: centerY,
      r,
      min: minimum,
      max: maximum,
      value,
      backgroundPath: chartSectorPath(centerX, centerY, r, r * 0.76, start, start + sweep),
    };
    if (datum) {
      const endpoint = chartPoint(centerX, centerY, r * 0.88, start + sweep * progress);
      geometry.marks.push({
        datum,
        kind: 'slice',
        x: endpoint[0],
        y: endpoint[1],
        path:
          progress > 0
            ? chartSectorPath(centerX, centerY, r, r * 0.76, start, start + sweep * progress)
            : '',
      });
    }
    return geometry;
  }
  if (model.type === 'waterfall') {
    const slots = model.waterfall?.slots ?? model.categories.length;
    geometry.xDomain = [-0.5, Math.max(0.5, slots - 0.5)];
    geometry.yDomain = ascending(options.yDomain)
      ? options.yDomain
      : (model.waterfall?.domain ?? [0, 1]);
    const y = (value: number) =>
      scaleChartValue(value, geometry.yDomain, [plot.top + plot.height, plot.top]);
    const band = plot.width / Math.max(1, slots);
    geometry.baseline = y(0);
    geometry.yTicks = numericTicks(geometry.yDomain, 5, y);
    const stride = Math.max(1, Math.ceil(slots / Math.max(1, Math.floor(plot.width / 65))));
    geometry.xTicks = model.categories.flatMap((label, index) =>
      index % stride ? [] : [{ value: index, label, position: plot.left + (index + 0.5) * band }]
    );
    const connectors: [number, number][] = [];
    for (let index = 0; index < datums.length; index++) {
      const datum = datums[index];
      const step = model.slices[index];
      if (step.startValue === undefined || step.endValue === undefined) continue;
      const start = y(step.startValue);
      const end = y(step.endValue);
      const rect = {
        x: plot.left + datum.index * band + band * 0.15,
        y: Math.min(start, end),
        width: band * 0.7,
        height: Math.abs(end - start),
      };
      geometry.marks.push({
        ...rectangle(datum, 'bar', rect),
        startValue: step.startValue,
        endValue: step.endValue,
      });
      // A hidden delta is not a zero delta: do not bridge its gap with a false connector.
      if (datums[index + 1]?.index === datum.index + 1)
        connectors.push(
          [rect.x + rect.width, end],
          [plot.left + (datum.index + 1) * band + band * 0.15, end]
        );
    }
    if (connectors.length)
      geometry.seriesPaths.push({
        id: 'waterfall-steps',
        color: 'var(--zuvi-chart-axis-color)',
        linePath: connectors
          .map((p, index) => `${index % 2 ? 'L' : 'M'} ${n(p[0])} ${n(p[1])}`)
          .join(' '),
        dashed: true,
      });
    return geometry;
  }
  return geometry;
}
