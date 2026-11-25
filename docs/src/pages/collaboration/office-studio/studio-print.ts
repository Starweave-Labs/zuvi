import {
  isOfficeStudioDocument,
  type OfficeStudioDocument,
  type StudioExcelDocument,
  type StudioRichNode,
  type StudioSheetChart,
  type StudioWordDocument,
} from '@zuvi/react';
import {
  studioCalculate,
  studioCellAddress,
  studioColumnLabel,
  studioChartData,
  studioDisplayCell,
  studioHiddenColumns,
  studioHiddenRows,
  studioInputValue,
  studioMergedRange,
  studioParseAddress,
  studioParseRange,
  type SheetCalculation,
} from '../../../../../packages/ui/src/components/OfficeStudio/studio-sheet-model';
import { studioConditionalCellStyle } from '../../../../../packages/ui/src/components/OfficeStudio/studio-sheet-rules';
import { studioNumberFormatColor } from '../../../../../packages/ui/src/components/OfficeStudio/studio-number-format';
import { wordMetricCss } from '../../../../../packages/ui/src/components/OfficeStudio/studio-word-metrics';
import {
  wordParagraphLineCss,
  wordParagraphKeepCss,
} from '../../../../../packages/ui/src/components/OfficeStudio/studio-word-paragraph-format';
import {
  wordMergeSurface,
  wordSurfaceCss,
  type StudioWordParagraphSurface,
} from '../../../../../packages/ui/src/components/OfficeStudio/studio-word-surface';
import {
  wordMergeTabStops,
  wordDecimalSymbol,
  wordDefaultTabStop,
} from '../../../../../packages/ui/src/components/OfficeStudio/studio-word-tabs';
import { wordLayoutTabElements } from '../../../../../packages/ui/src/components/OfficeStudio/studio-word-tabs-dom';
import {
  materializeWordNumbering,
  wordNumberingCatalog,
  wordNumberingLabels,
  type WordNumberingCatalog,
  type WordNumberingLabel,
} from '../../../../../packages/ui/src/components/OfficeStudio/studio-word-numbering';
import {
  wordNumberingStyle,
  wordLayoutPrintedNumbering,
} from '../../../../../packages/ui/src/components/OfficeStudio/studio-word-numbering-layout';
import { wordImageLayout } from '../../../../../packages/ui/src/components/OfficeStudio/studio-word-images';
import { wordImageCss } from '../../../../../packages/ui/src/components/OfficeStudio/studio-word-image-preview';
import {
  getStudioWordParagraphStyles,
  materializeStudioWordStyles,
} from '../../../../../packages/ui/src/components/OfficeStudio/studio-word-styles';
import {
  studioBorderCss,
  studioBorderSides,
} from '../../../../../packages/ui/src/components/OfficeStudio/studio-cell-style';
import {
  studioCellHyperlink,
  studioResolveSheetHyperlink,
} from '../../../../../packages/ui/src/components/OfficeStudio/studio-sheet-hyperlinks';
import type { StudioSheet } from '../../../../../packages/ui/src/components/OfficeStudio/studio-types';
import { exportStudioFile } from './studio-files';

const escape = (value: unknown) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!
  );
const color = (value: unknown) =>
  typeof value === 'string' && /^#[a-f\d]{3}(?:[a-f\d]{3})?$/i.test(value) ? value : '';
const amount = (value: unknown, unit: string, min = -500, max = 1000) =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
    ? `${value}${unit}`
    : '';
const alignment = (value: unknown) =>
  ['left', 'center', 'right', 'justify'].includes(String(value)) ? String(value) : '';
// A font is one name, including punctuation and XML whitespace, rather than a CSS list.
const fontFamily = (value: string) =>
  `"${value.replace(/["\\\t\n\r]/g, (character) => `\\${character.charCodeAt(0).toString(16)} `)}"`;

type PrintedFloatingImage = { node: StudioRichNode; axes: ('horizontal' | 'vertical')[] };

function rich(
  node: StudioRichNode,
  page: number,
  total: number,
  floating?: PrintedFloatingImage[],
  defaultTab = 36,
  decimalSymbol: '.' | ',' = '.'
): string {
  if (node.type === 'image' && floating) {
    const layout = wordImageLayout(node.attrs?.layout);
    if (layout && ['front', 'behind'].includes(layout.wrap)) {
      const axes = (['horizontal', 'vertical'] as const).filter(
        (axis) => !['character', 'line', 'paragraph'].includes(layout[axis].relative)
      );
      if (axes.length) {
        floating.push({ node, axes: [...axes] });
        return '';
      }
    }
  }
  const children = node.content ?? [];
  const renderedChildren = children.map((child) =>
    rich(child, page, total, floating, defaultTab, decimalSymbol)
  );
  let headerRows = 0;
  if (node.type === 'table')
    while (
      headerRows < children.length &&
      children[headerRows].type === 'tableRow' &&
      children[headerRows].content?.length &&
      children[headerRows].content!.every((cell) => cell.type === 'tableHeader')
    )
      headerRows++;
  let text =
    node.type === 'text'
      ? escape(node.text).replace(
          /\t/g,
          '<span data-word-tab="" class="zuvi-studio-word-tab">\t</span>'
        )
      : node.type === 'pageNumber'
        ? String(node.attrs?.kind === 'total' ? total : page)
        : node.type === 'table'
          ? `${headerRows ? `<thead>${renderedChildren.slice(0, headerRows).join('')}</thead>` : ''}<tbody>${renderedChildren.slice(headerRows).join('')}</tbody>`
          : renderedChildren.join('');
  for (const mark of node.marks ?? []) {
    const tag = (
      {
        bold: 'strong',
        italic: 'em',
        underline: 'u',
        strike: 's',
        superscript: 'sup',
        subscript: 'sub',
      } as Record<string, string>
    )[mark.type];
    if (tag) text = `<${tag}>${text}</${tag}>`;
    else if (mark.type === 'textStyle') {
      const attrs = mark.attrs ?? {};
      const styles: string[] = [];
      const metric = wordMetricCss(attrs);
      if (metric.letterSpacing) styles.push(`letter-spacing:${metric.letterSpacing}`);
      if (metric.top) styles.push(`position:relative;top:${metric.top}`);
      if (color(attrs.color)) styles.push(`color:${color(attrs.color)}`);
      if (color(attrs.backgroundColor))
        styles.push(`background-color:${color(attrs.backgroundColor)}`);
      if (
        typeof attrs.fontFamily === 'string' &&
        attrs.fontFamily.length <= 255 &&
        !/[^\u0020-\ud7ff\ue000-\ufffd\u{10000}-\u{10ffff}]/u.test(attrs.fontFamily)
      )
        styles.push(`font-family:${escape(fontFamily(attrs.fontFamily))}`);
      if (
        typeof attrs.fontSize === 'string' &&
        /^\d+(?:\.\d+)?(?:px|pt)$/.test(attrs.fontSize) &&
        parseFloat(attrs.fontSize) <= 480
      )
        styles.push(`font-size:${attrs.fontSize}`);
      if (styles.length) text = `<span style="${styles.join(';')}">${text}</span>`;
    } else if (mark.type === 'link') {
      const href = mark.attrs?.href;
      if (typeof href === 'string' && /^(?:https?:\/\/|mailto:)/i.test(href))
        text = `<a href="${escape(href)}">${text}</a>`;
    }
  }
  const attrs = node.attrs ?? {};
  const number = attrs.printNumbering as WordNumberingLabel | undefined;
  const styles: string[] = [];
  if (alignment(attrs.textAlign)) styles.push(`text-align:${alignment(attrs.textAlign)}`);
  for (const [attribute, property] of [
    ['spaceBefore', 'margin-top'],
    ['spaceAfter', 'margin-bottom'],
    ['indentLeft', 'margin-left'],
    ['indentRight', 'margin-right'],
    ['indentFirstLine', 'text-indent'],
  ])
    if (amount(attrs[attribute], 'pt'))
      styles.push(`${property}:${amount(attrs[attribute], 'pt')}`);
  for (const [key, value] of Object.entries(wordParagraphLineCss(attrs)))
    styles.push(`${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}:${value}`);
  if (['paragraph', 'heading'].includes(node.type))
    for (const [key, value] of Object.entries(
      wordParagraphKeepCss({ ...attrs, keepNext: attrs.keepNext ?? node.type === 'heading' })
    ))
      styles.push(`${key.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}:${value}`);
  const surface = wordMergeSurface(
    (attrs.paragraphStyleSnapshot as { surface?: StudioWordParagraphSurface } | null)?.surface,
    attrs.paragraphSurface
  );
  for (const [key, value] of Object.entries(wordSurfaceCss(surface)))
    styles.push(`${key.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}:${value}`);
  if (color(attrs.backgroundColor)) styles.push(`background-color:${color(attrs.backgroundColor)}`);
  const style = styles.length ? ` style="${styles.join(';')}"` : '';
  if (node.type === 'image') {
    const source =
      typeof attrs.src === 'string' &&
      /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(attrs.src)
        ? attrs.src
        : '';
    if (!source) throw new Error('打印仅支持已嵌入文档的 PNG/JPEG 图片。');
    const layout = wordImageLayout(attrs.layout);
    const css = Object.entries(
      wordImageCss(layout, Number(attrs.width) || 320, Number(attrs.height) || 180)
    )
      .map(
        ([key, value]) =>
          `${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}:${value}`
      )
      .join(';');
    const printed = `<img src="${escape(source)}" alt="${escape(attrs.alt)}"${amount(attrs.width, '', 1, 10000) ? ` width="${attrs.width}"` : ''}${amount(attrs.height, '', 1, 10000) ? ` height="${attrs.height}"` : ''}${css ? ` style="${escape(css)}"` : ''}>`;
    return layout && ['front', 'behind'].includes(layout.wrap)
      ? `<span class="studio-print-image-anchor">${printed}</span>`
      : printed;
  }
  if (node.type === 'pageNumber') return text;
  if (node.type === 'hardBreak') return '<br>';
  if (node.type === 'horizontalRule') return '<hr>';
  if (node.type === 'pageBreak') return '<div class="studio-print-break"></div>';
  const tag =
    node.type === 'heading'
      ? `h${Number.isInteger(attrs.level) && Number(attrs.level) >= 1 && Number(attrs.level) <= 6 ? attrs.level : 2}`
      : (
          {
            paragraph: 'p',
            bulletList: 'ul',
            orderedList: 'ol',
            listItem: 'li',
            blockquote: 'blockquote',
            table: 'table',
            tableRow: 'tr',
            tableCell: 'td',
            tableHeader: 'th',
          } as Record<string, string>
        )[node.type];
  if (!tag) return text;
  const spans =
    tag === 'td' || tag === 'th'
      ? ['colspan', 'rowspan']
          .map((key) =>
            Number.isInteger(attrs[key]) && Number(attrs[key]) > 1 && Number(attrs[key]) <= 10000
              ? ` ${key}="${attrs[key]}"`
              : ''
          )
          .join('')
      : '';
  const start =
    tag === 'ol' && Number.isInteger(attrs.start) && Number(attrs.start) > 0
      ? ` start="${attrs.start}"`
      : '';
  const lineRule = ['auto', 'exact', 'atLeast'].includes(String(attrs.lineHeightRule))
    ? ` data-word-line-rule="${attrs.lineHeightRule}"`
    : '';
  const tabs =
    node.type === 'paragraph' || node.type === 'heading'
      ? ` data-word-tabs="${escape(JSON.stringify(wordMergeTabStops((attrs.paragraphStyleSnapshot as { tabStops?: unknown } | null)?.tabStops, attrs.tabStops)))}" data-word-default-tab="${defaultTab}" data-word-decimal-symbol="${decimalSymbol}"`
      : '';
  const numbering = number
    ? ` data-word-numbering-label="${escape(number.text)}" data-word-numbering-layout="${escape(JSON.stringify(number.level))}" data-word-numbering-position="${number.position}"`
    : '';
  const numberedStyle = number
    ? ` style="${escape([...styles, ...Object.entries(wordNumberingStyle(attrs, number.level, number.ref.level)).map(([key, value]) => `${key}:${value}`)].join(';'))}"`
    : style;
  return `<${tag}${numberedStyle}${spans}${start}${lineRule}${tabs}${numbering}${(tag === 'ol' || tag === 'ul') && attrs.numberingInstanceId ? ' data-word-list-instance="true"' : ''}>${text || (tag === 'p' ? '<br>' : '')}</${tag}>`;
}

function wordPages(document: StudioWordDocument) {
  const styles = getStudioWordParagraphStyles(document.content);
  document = {
    ...document,
    content: materializeStudioWordStyles(document.content, styles),
    ...(document.header ? { header: materializeStudioWordStyles(document.header, styles) } : {}),
    ...(document.footer ? { footer: materializeStudioWordStyles(document.footer, styles) } : {}),
  };
  document = { ...document, content: materializeWordNumbering(document.content) };
  let numbering = wordNumberingCatalog(
    document.content.attrs?.numberingDefinitions,
    document.content.attrs?.numberingInstances
  );
  const present = (root: StudioRichNode, catalog: WordNumberingCatalog) => {
    const labels = new Map(wordNumberingLabels(root, catalog).map((label) => [label.node, label]));
    const walk = (node: StudioRichNode): StudioRichNode => ({
      ...node,
      attrs: { ...node.attrs, ...(labels.has(node) ? { printNumbering: labels.get(node) } : {}) },
      ...(node.content ? { content: node.content.map(walk) } : {}),
    });
    return walk(root);
  };
  for (const region of ['header', 'footer'] as const)
    if (document[region]) {
      const ready = materializeWordNumbering(document[region]!, numbering);
      numbering = wordNumberingCatalog(
        ready.attrs?.numberingDefinitions,
        ready.attrs?.numberingInstances
      );
      document = { ...document, [region]: present(ready, numbering) };
    }
  document = { ...document, content: present(document.content, numbering) };
  const pages: StudioRichNode[][] = [[]];
  for (const node of document.content.content ?? []) {
    if (node.type === 'pageBreak') pages.push([]);
    else pages.at(-1)!.push(node);
  }
  return pages
    .map((nodes, index) => {
      const total = pages.length;
      const floating: PrintedFloatingImage[] = [];
      const render = (node?: StudioRichNode) =>
        node
          ? rich(
              node,
              index + 1,
              total,
              floating,
              wordDefaultTabStop(document.defaultTabStop),
              wordDecimalSymbol(document.decimalSymbol)
            )
          : '';
      const footer = render(document.footer);
      const containsPage = (node?: StudioRichNode): boolean =>
        !!node && (node.type === 'pageNumber' || (node.content ?? []).some(containsPage));
      const header = render(document.header);
      const body = nodes.map(render).join('');
      const pageMm = document.page.size === 'Letter' ? [215.9, 279.4] : [210, 297];
      if (document.page.orientation === 'landscape') pageMm.reverse();
      const margin = (document.page.margin * 96) / 25.4;
      const width = (pageMm[0] * 96) / 25.4;
      const height = (pageMm[1] * 96) / 25.4;
      const extra = floating
        .map(({ node, axes }) => {
          const layout = wordImageLayout(node.attrs?.layout)!;
          const horizontal = {
            page: { start: -margin, size: width },
            margin: { start: 0, size: width - margin * 2 },
            column: { start: 0, size: width - margin * 2 },
            leftMargin: { start: -margin, size: margin },
            insideMargin: { start: -margin, size: margin },
            rightMargin: { start: width - margin * 2, size: margin },
            outsideMargin: { start: width - margin * 2, size: margin },
            character: { start: 0, size: 0 },
          };
          const vertical = {
            page: { start: -margin, size: height },
            margin: { start: 0, size: height - margin * 2 },
            paragraph: { start: 0, size: 0 },
            line: { start: 0, size: 0 },
            topMargin: { start: -margin, size: margin },
            insideMargin: { start: -margin, size: margin },
            bottomMargin: { start: height - margin * 2, size: margin },
            outsideMargin: { start: height - margin * 2, size: margin },
          };
          const css = wordImageCss(
            layout,
            Number(node.attrs?.width) || 320,
            Number(node.attrs?.height) || 180,
            { horizontal, vertical }
          );
          let html = rich(node, index + 1, total);
          for (const axis of axes) {
            const property = axis === 'horizontal' ? 'left' : 'top';
            html = html.replace(new RegExp(`${property}:[^;"&]+`), `${property}:${css[property]}`);
          }
          return `<div class="studio-print-page-picture">${html}</div>`;
        })
        .join('');
      return `<section class="studio-print-page"><header>${header}</header><article>${body}</article><footer>${footer}${document.pageNumbers && !containsPage(document.footer) ? `<p class="studio-print-number">${index + 1}</p>` : ''}</footer>${extra}</section>`;
    })
    .join('');
}

function sheetChart(sheet: StudioSheet, chart: StudioSheetChart, calculation: SheetCalculation) {
  const data = studioChartData(sheet, chart, calculation);
  const values = data.series.flatMap((series) =>
    series.values.filter((value): value is number => value !== null)
  );
  const min = Math.min(0, ...values);
  const max = Math.max(1, ...values);
  const y = (value: number) => 210 - ((value - min) / (max - min)) * 170;
  const step = 550 / Math.max(1, data.categories.length);
  const palette = [
    '#34765a',
    '#447cb3',
    '#d6a142',
    '#955c91',
    '#cc7863',
    '#52a6a2',
    '#777f48',
    '#74818f',
  ];
  const seriesSvg = data.series
    .map((series, seriesIndex) => {
      const ink = palette[seriesIndex % palette.length];
      if (chart.type === 'bar')
        return series.values
          .map((value, index) => {
            if (value === null) return '';
            const width = Math.max(0.5, (step * 0.8) / Math.max(1, data.series.length));
            return `<rect x="${45 + step * index + step * 0.1 + seriesIndex * width}" y="${Math.min(y(value), y(0))}" width="${width}" height="${Math.max(0.5, Math.abs(y(value) - y(0)))}" fill="${ink}"/>`;
          })
          .join('');
      const segments: string[] = [];
      let points: string[] = [];
      const flush = () => {
        if (points.length)
          segments.push(
            `<polyline points="${points.join(' ')}" fill="none" stroke="${ink}" stroke-width="2"/>`
          );
        points = [];
      };
      series.values.forEach((value, index) => {
        if (value === null) flush();
        else points.push(`${45 + step * (index + 0.5)},${y(value)}`);
      });
      flush();
      return segments.join('');
    })
    .join('');
  const labels = data.categories
    .map((category, index) =>
      index % Math.max(1, Math.ceil(data.categories.length / 12)) === 0
        ? `<text x="${45 + step * (index + 0.5)}" y="233" text-anchor="middle" font-size="10">${escape(category.slice(0, 12))}</text>`
        : ''
    )
    .join('');
  return `<figure class="studio-print-chart"><figcaption>${escape(chart.title)}</figcaption><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 255" role="img" aria-label="${escape(chart.title)}"><line x1="45" x2="595" y1="${y(0)}" y2="${y(0)}" stroke="#aeb6b0"/>${seriesSvg}${labels}</svg><p>${data.series.map((series, index) => `<span style="color:${palette[index % palette.length]}">● ${escape(series.name)}</span>`).join('　')}</p></figure>`;
}

function sheetTable(
  document: StudioExcelDocument,
  sheet: StudioSheet,
  calculation: SheetCalculation
) {
  let rows = 1;
  let columns = 1;
  for (const [owner, array] of calculation.arrays) {
    if (!owner.startsWith(`${sheet.id}:`)) continue;
    rows = Math.max(rows, array.range.lastRow);
    columns = Math.max(columns, array.range.lastCol);
  }
  for (const [address, cell] of Object.entries(sheet.cells)) {
    if (!cell.input && !cell.background && !Object.keys(cell.borders ?? {}).length) continue;
    const position = studioParseAddress(address)!;
    rows = Math.max(rows, position.row);
    columns = Math.max(columns, position.col);
  }
  for (const merge of sheet.merges ?? []) {
    const range = studioParseRange(merge)!;
    rows = Math.max(rows, range.lastRow);
    columns = Math.max(columns, range.lastCol);
  }
  for (const rule of sheet.conditionalFormats ?? []) {
    const range = studioParseRange(rule.range)!;
    rows = Math.max(rows, range.lastRow);
    columns = Math.max(columns, range.lastCol);
  }
  for (const link of sheet.hyperlinks ?? []) {
    const range = studioParseRange(link.ref)!;
    rows = Math.max(rows, range.lastRow);
    columns = Math.max(columns, range.lastCol);
  }
  if (rows * columns > 50000)
    throw new Error(`“${sheet.name}”的打印区域过大，请导出 XLSX 并在 Excel 中设置打印区域。`);
  const hidden = studioHiddenRows(sheet, calculation);
  const hiddenCols = studioHiddenColumns(sheet);
  const body: string[] = [];
  for (let row = 1; row <= rows; row++) {
    if (hidden.has(row)) continue;
    const rowPoints = sheet.rowHeights?.[String(row)] ?? sheet.defaultRowHeight ?? 18;
    const cells: string[] = [];
    for (let col = 1; col <= columns; col++) {
      if (hiddenCols.has(studioColumnLabel(col))) continue;
      const merge = studioMergedRange(sheet, { row, col });
      const mergeRows = merge
        ? Array.from(
            { length: merge.lastRow - merge.firstRow + 1 },
            (_, offset) => merge.firstRow + offset
          ).filter((index) => !hidden.has(index))
        : [row];
      if (merge && (mergeRows[0] !== row || merge.firstCol !== col)) continue;
      const address = studioCellAddress(merge?.firstRow ?? row, col);
      const points = mergeRows.reduce(
        (total, index) =>
          total + (sheet.rowHeights?.[String(index)] ?? sheet.defaultRowHeight ?? 18),
        0
      );
      const conditionalStyle = studioConditionalCellStyle(sheet, address, calculation);
      const cell = {
        ...(sheet.cells[address] ?? { input: '' }),
        ...conditionalStyle,
        color:
          conditionalStyle.color ??
          studioNumberFormatColor(
            conditionalStyle.numberFormat ?? sheet.cells[address]?.numberFormat,
            calculation.values.get(`${sheet.id}:${address}`) ??
              studioInputValue(
                sheet.cells[address]?.input ?? '',
                sheet.cells[address]?.numberFormat,
                sheet.cells[address]?.valueType
              ),
            calculation.errors.get(`${sheet.id}:${address}`)
          ) ??
          sheet.cells[address]?.color,
      };
      const styles: string[] = [];
      if (cell.fontFamily) styles.push(`font-family:${fontFamily(cell.fontFamily)}`);
      if (amount(cell.fontSize, 'pt', 1, 409))
        styles.push(`font-size:${amount(cell.fontSize, 'pt', 1, 409)}`);
      if (cell?.bold) styles.push('font-weight:700');
      if (cell?.italic) styles.push('font-style:italic');
      if (cell?.underline) styles.push('text-decoration:underline');
      if (color(cell?.color)) styles.push(`color:${color(cell?.color)}`);
      if (color(cell?.background)) styles.push(`background-color:${color(cell?.background)}`);
      if (alignment(cell?.align)) styles.push(`text-align:${cell?.align}`);
      styles.push(
        `vertical-align:${cell.verticalAlign === 'middle' ? 'middle' : cell.verticalAlign === 'top' ? 'top' : 'bottom'}`
      );
      const borders = merge
        ? {
            ...cell.borders,
            right:
              sheet.cells[studioCellAddress(merge.firstRow, merge.lastCol)]?.borders?.right ??
              cell.borders?.right,
            bottom:
              sheet.cells[studioCellAddress(merge.lastRow, merge.firstCol)]?.borders?.bottom ??
              cell.borders?.bottom,
          }
        : cell.borders;
      for (const side of studioBorderSides) {
        const border = borders?.[side];
        if (border) styles.push(`border-${side}:${studioBorderCss(border, '#000000')}`);
      }
      if (cell?.wrap) styles.push('white-space:pre-wrap');
      const spans = merge
        ? ` colspan="${merge.lastCol - col + 1}" rowspan="${Array.from({ length: merge.lastRow - row + 1 }, (_, offset) => row + offset).filter((index) => !hidden.has(index)).length}"`
        : '';
      const link = studioCellHyperlink(document, sheet.id, address, calculation);
      const displayed = studioDisplayCell(
        cell,
        calculation.values.get(`${sheet.id}:${address}`),
        calculation.errors.get(`${sheet.id}:${address}`)
      );
      // A native label can fill a blank cell without replacing a number, formula or text value.
      const text = escape(
        !cell.input && link ? link.display || link.target || link.location || displayed : displayed
      );
      const tooltip = link?.tooltip ? ` title="${escape(link.tooltip)}"` : '';
      const target = link ? studioResolveSheetHyperlink(document, sheet.id, link) : undefined;
      const content =
        target?.kind === 'external'
          ? `<a href="${escape(target.href)}" target="_blank" rel="noopener noreferrer"${tooltip}>${text}</a>`
          : tooltip
            ? `<span${tooltip}>${text}</span>`
            : text;
      cells.push(
        `<td${spans} style="${escape(styles.join(';'))}"><div class="studio-print-cell" style="max-height:${Math.max(0, (points * 4) / 3 - 4)}px">${content}</div></td>`
      );
    }
    body.push(`<tr style="height:${rowPoints}pt">${cells.join('')}</tr>`);
  }
  const cols = Array.from({ length: columns }, (_, index) =>
    hiddenCols.has(studioColumnLabel(index + 1))
      ? ''
      : `<col style="width:${sheet.columnWidths?.[studioColumnLabel(index + 1)] ?? 112}px">`
  ).join('');
  return `<section class="studio-print-sheet"><h1>${escape(sheet.name)}</h1><table><colgroup>${cols}</colgroup>${body.join('')}</table>${(sheet.charts ?? []).map((chart) => sheetChart(sheet, chart, calculation)).join('')}</section>`;
}

/** Pure and escaped document HTML; no toolbar, scripts, remote images or arbitrary styles. */
export function createStudioPrintHtml(document: OfficeStudioDocument): string {
  if (!isOfficeStudioDocument(document)) throw new Error('文档模型无效，无法打印。');
  if (document.kind === 'pdf') throw new Error('PDF 使用原生 PDF 打印预览。');
  const paper =
    document.kind === 'word'
      ? `${document.page.size} ${document.page.orientation}`
      : 'A4 landscape';
  const margin = document.kind === 'word' ? document.page.margin : 12;
  const calculation = document.kind === 'excel' ? studioCalculate(document) : undefined;
  const content =
    document.kind === 'word'
      ? wordPages(document)
      : document.sheets.map((sheet) => sheetTable(document, sheet, calculation!)).join('');
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'"><title>${escape(document.name)}</title><style>
@page{size:${paper};margin:${margin}mm}*{box-sizing:border-box}body{margin:0;color:#253044;background:white;font:12pt/1.6 "Microsoft YaHei","Noto Sans SC",Arial,sans-serif}h1,h2,h3,h4,h5,h6{line-height:1.3;break-after:avoid}h1{font-size:25pt}h2{font-size:19pt}p{margin:0 0 8pt}table{border-collapse:collapse;width:100%;font-size:10pt;table-layout:fixed}td,th{border:1px solid #b8c2bc;padding:5pt;overflow-wrap:anywhere;vertical-align:top}th{background:#edf3ee;text-align:left}tr{break-inside:avoid}img{max-width:100%;height:auto;vertical-align:middle}blockquote{margin:10pt 0;padding-left:12pt;border-left:3px solid #90a59a}a{color:inherit}header,footer{font-size:9pt;color:#5a6c61}header{margin-bottom:12pt}footer{margin-top:14pt}.studio-print-page,.studio-print-sheet{break-after:page}.studio-print-page:last-child,.studio-print-sheet:last-child{break-after:auto}.studio-print-break{break-before:page}.studio-print-number{text-align:center}.studio-print-chart{margin:18pt 0;break-inside:avoid}.studio-print-chart svg{width:100%;max-height:240pt}.studio-print-chart figcaption{font-weight:700}.studio-print-chart p{font-size:9pt}[data-word-line-rule="exact"] :is(span,strong,em,u,s,a){line-height:inherit;vertical-align:top}[data-word-line-rule="atLeast"] :is(span,strong,em,u,s,a){line-height:max(var(--zuvi-word-min-line),1.2em)}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
${document.kind === 'excel' ? '.studio-print-sheet table{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.15}.studio-print-sheet td{padding:2px 5px;vertical-align:middle}.studio-print-cell{overflow:hidden}' : ''}
header:empty,footer:empty{display:none}thead{display:table-header-group}
${document.kind === 'word' ? '.studio-print-page{position:relative;isolation:isolate;min-height:50mm}.studio-print-page p,.studio-print-page h1,.studio-print-page h2,.studio-print-page h3,.studio-print-page h4,.studio-print-page h5,.studio-print-page h6{position:relative;white-space:pre-wrap}.studio-print-image-anchor{display:inline-block;position:relative;width:0;height:0}.studio-print-page-picture{position:absolute;inset:0;pointer-events:none}' : ''}
.zuvi-studio-word-tab {
  display: inline-block;
  position: relative;
  white-space: pre;
  tab-size: 0;
  text-indent: 0;
  width: 36pt;
  vertical-align: baseline;
  overflow: hidden;
}
.zuvi-studio-word-tab::after {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  white-space: nowrap;
  pointer-events: none;
}
.zuvi-studio-word-tab[data-word-leader='dot']::after { content: '................................................................................................................................................................................................'; }
.zuvi-studio-word-tab[data-word-leader='middleDot']::after { content: '··········································································································································································'; }
.zuvi-studio-word-tab[data-word-leader='hyphen']::after { content: '------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------'; }
.zuvi-studio-word-tab[data-word-leader='underscore']::after,
.zuvi-studio-word-tab[data-word-leader='heavy']::after { content: ''; bottom: 0.2em; border-bottom: 1px solid currentColor; }
.zuvi-studio-word-tab[data-word-leader='heavy']::after { border-bottom-width: 2px; }

[data-word-numbering-label]{position:relative}[data-word-numbering-label]::before{content:attr(data-word-numbering-label);position:absolute;left:var(--zuvi-numbering-hang,-18pt);transform:translateX(var(--zuvi-numbering-shift,0%));text-indent:0;top:0;white-space:pre;font-family:var(--zuvi-numbering-family,inherit);font-size:var(--zuvi-numbering-size,inherit);color:var(--zuvi-numbering-color,inherit);font-weight:var(--zuvi-numbering-weight,inherit);font-style:var(--zuvi-numbering-style,inherit)}[data-word-list-instance]{padding-left:0;list-style:none}
</style></head><body>${content}</body></html>`;
}

/** Launch the browser's document print dialog; the user chooses printer or Save as PDF. */
export async function printStudioFile(
  document: OfficeStudioDocument,
  source?: Blob
): Promise<void> {
  const html = document.kind === 'pdf' ? undefined : createStudioPrintHtml(document);
  const pdf = document.kind === 'pdf' ? await exportStudioFile(document, source) : undefined;
  const frame = globalThis.document.createElement('iframe');
  frame.title = `${document.name} 打印预览`;
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;inset:0;width:0;height:0;border:0;';
  if (document.kind === 'word') {
    const paper = document.page.size === 'Letter' ? [215.9, 279.4] : [210, 297];
    if (document.page.orientation === 'landscape') paper.reverse();
    frame.style.width = `${(Math.max(1, paper[0] - document.page.margin * 2) * 96) / 25.4}px`;
    frame.style.height = `${(paper[1] * 96) / 25.4}px`;
    frame.style.visibility = 'hidden';
    frame.style.pointerEvents = 'none';
  }
  const url = pdf ? URL.createObjectURL(pdf) : undefined;
  let cleaned = false;
  let loadingHandled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    if (timer) clearTimeout(timer);
    frame.remove();
    if (url) URL.revokeObjectURL(url);
  };
  await new Promise<void>((resolve, reject) => {
    timer = setTimeout(() => {
      cleanup();
      reject(new Error('打印预览加载超时，请导出文件后打印。'));
    }, 15000);
    frame.onerror = () => {
      cleanup();
      reject(new Error('打印预览无法加载，请导出文件后打印。'));
    };
    frame.onload = () => {
      if (loadingHandled || cleaned) return;
      loadingHandled = true;
      void (async () => {
        const view = frame.contentWindow;
        if (!view) throw new Error('浏览器没有可用的打印窗口。');
        if (html) {
          await view.document.fonts?.ready;
          await Promise.all(
            Array.from(view.document.images).map((image) =>
              image.complete
                ? Promise.resolve()
                : new Promise<void>((done) => {
                    image.onload = () => done();
                    image.onerror = () => done();
                  })
            )
          );
        }
        if (cleaned) return;
        if (html && document.kind === 'word') {
          wordLayoutPrintedNumbering(view.document.body);
          wordLayoutTabElements(view.document.body);
        }
        view.addEventListener('afterprint', cleanup, { once: true });
        if (timer) clearTimeout(timer);
        timer = setTimeout(cleanup, 60000);
        view.focus();
        view.print();
        resolve();
      })().catch((error) => {
        cleanup();
        reject(
          error instanceof Error ? error : new Error('浏览器无法启动打印，请导出文件后打印。')
        );
      });
    };
    if (url) frame.src = url;
    else frame.srcdoc = html!;
    globalThis.document.body.append(frame);
  });
}
