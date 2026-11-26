import { wordMathMarkup } from '../../../../../packages/ui/src/components/OfficeStudio/studio-word-math';
import {
  wordImageCrop,
  wordImageCropGeometry,
} from '../../../../../packages/ui/src/components/OfficeStudio/studio-word-image-crop';
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
import { wordRowCss } from '../../../../../packages/ui/src/components/OfficeStudio/studio-word-table-rows';
import {
  wordTableHeightBudgets,
  wordTableCellColumns,
} from '../../../../../packages/ui/src/components/OfficeStudio/studio-word-table-layout';
import { wordFillMixedTableRows } from '../../../../../packages/ui/src/components/OfficeStudio/studio-word-table-mixed-layout';
import {
  wordTableCss,
  wordTableRowSpacingCss,
  wordTableSpacingLayout,
  wordTableRenderedColumnWidths,
  wordTableColumnsToGrid,
  wordEffectiveRowSpacing,
  wordTableCellGapCss,
} from '../../../../../packages/ui/src/components/OfficeStudio/studio-word-table-properties';
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
import { sheetLayoutText, type SheetTextLayout } from '../../../../../packages/ui/src/components/OfficeStudio/studio-sheet-text-layout';
import {
  studioSheetCellTextInput,
  studioSheetCenteredTextSegments,
  studioSheetDerivedRowHeights,
  studioSheetTextFontFamily,
  studioSheetTextMeasure,
} from '../../../../../packages/ui/src/components/OfficeStudio/studio-sheet-text-display';
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
  const heights = node.type === 'table' ? wordTableHeightBudgets(node) : null;
  const columns = node.type === 'table' ? wordTableCellColumns(node) : null;
  const children =
    node.type === 'table'
      ? (node.content ?? []).map((row, rowIndex) => ({
          ...row,
          attrs: {
            ...row.attrs,
            printRenderedRowHeight: heights!.rows[rowIndex]?.outerHeight ?? null,
          },
          content: (row.content ?? []).map((cell, cellIndex) => {
            const height = heights!.cells[rowIndex][cellIndex]?.outerHeight ?? null;
            const end = Math.min(
              (node.content ?? []).length - 1,
              rowIndex + Math.max(1, Number(cell.attrs?.rowspan) || 1) - 1
            );
            const endSpacing = wordEffectiveRowSpacing(node.attrs, node.content![end].attrs),
              column = columns!.cells[rowIndex][cellIndex];
            const gaps = wordTableCellGapCss(
              wordEffectiveRowSpacing(node.attrs, row.attrs),
              column.first,
              column.last,
              endSpacing
            );
            return {
              ...cell,
              attrs: {
                ...cell.attrs,
                printFixedCellHeight: height,
                printEndSpacing: endSpacing,
                printCellGaps: gaps,
              },
            };
          }),
        }))
      : (node.content ?? []);
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
  const tableColumns: number[] = [];
  if (node.type === 'table') {
    for (const cell of node.content?.[0]?.content ?? []) {
      const widths = cell.attrs?.colwidth;
      if (
        !Array.isArray(widths) ||
        widths.length !== Number(cell.attrs?.colspan ?? 1) ||
        widths.some(
          (width) =>
            typeof width !== 'number' || !Number.isFinite(width) || width <= 0 || width > 20000
        )
      ) {
        tableColumns.length = 0;
        break;
      }
      tableColumns.push(...widths);
    }
  }
  const spacingLayout =
    node.type === 'table'
      ? wordTableSpacingLayout(
          node.attrs,
          (node.content ?? []).map((row) => row.attrs)
        )
      : null;
  const renderedColumns = tableColumns.length
    ? wordTableRenderedColumnWidths(
        tableColumns,
        node.attrs,
        (node.content ?? []).map((row) => row.attrs)
      )
    : [];
  let text =
    node.type === 'mathEquation'
      ? `<span data-word-math-print="">${wordMathMarkup(node.attrs?.equation)}</span>`
      : node.type === 'text'
        ? escape(node.text).replace(
            /\t/g,
            '<span data-word-tab="" class="zuvi-studio-word-tab">\t</span>'
          )
        : node.type === 'tableFormula'
          ? escape(String(node.attrs?.result ?? '0'))
          : node.type === 'pageNumber'
            ? String(node.attrs?.kind === 'total' ? total : page)
            : node.type === 'table'
              ? `${renderedColumns.length ? `<colgroup>${renderedColumns.map((width) => `<col style="width:${width}px">`).join('')}</colgroup>` : ''}${headerRows ? `<thead>${renderedChildren.slice(0, headerRows).join('')}</thead>` : ''}<tbody>${renderedChildren.slice(headerRows).join('')}</tbody>`
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
      if (metric.verticalAlign)
        styles.push(
          `vertical-align:${metric.verticalAlign};--zuvi-word-baseline-shift:${metric['--zuvi-word-baseline-shift']}`
        );
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
      const baseline = metric.verticalAlign
        ? ` data-word-baselineshift="${metric['--zuvi-word-baseline-shift']}"`
        : '';
      if (styles.length) text = `<span${baseline} style="${styles.join(';')}">${text}</span>`;
    } else if (mark.type === 'link') {
      const href = mark.attrs?.href;
      if (typeof href === 'string' && /^(?:https?:\/\/|mailto:)/i.test(href))
        text = `<a href="${escape(href)}">${text}</a>`;
    }
  }
  const attrs = node.attrs ?? {};
  const number = attrs.printNumbering as WordNumberingLabel | undefined;
  const styles: string[] = [];
  if (node.type === 'table') {
    const rows = (node.content ?? []).map((row) => row.attrs);
    for (const [key, value] of Object.entries(wordTableCss(attrs, rows)))
      styles.push(`${key}:${value}`);
    if (tableColumns.length) {
      const grid = wordTableColumnsToGrid(tableColumns, Number(attrs.cellSpacing) || 0);
      styles.push(`width:${grid.reduce((sum, width) => sum + width, 0)}px`);
    }
  }
  if (node.type === 'tableCell' || node.type === 'tableHeader') {
    styles.push('--zuvi-word-cell-justify:flex-start');
    styles.push(
      `--zuvi-word-cell-background:${color(attrs.backgroundColor) || (node.type === 'tableHeader' ? '#edf3ee' : 'transparent')}`
    );
    if (typeof attrs.printEndSpacing === 'number')
      styles.push(`--zuvi-word-cell-end-spacing:${attrs.printEndSpacing}pt`);
    if (attrs.printCellGaps && typeof attrs.printCellGaps === 'object')
      for (const [key, value] of Object.entries(attrs.printCellGaps))
        if (
          /^--zuvi-word-cell-gap-(top|right|bottom|left)$/.test(key) &&
          typeof value === 'string' &&
          /^\d+(?:\.\d+)?pt$/.test(value)
        )
          styles.push(`${key}:${value}`);
    for (const side of ['top', 'right', 'bottom', 'left'])
      styles.push(
        `--zuvi-word-cell-margin-${side}:var(--zuvi-word-table-margin-${side},${side === 'top' || side === 'bottom' ? '0pt' : '5.4pt'});padding-${side}:var(--zuvi-word-cell-margin-${side})`
      );
    if (['top', 'center', 'bottom'].includes(String(attrs.verticalAlign)))
      styles.push(
        `vertical-align:${attrs.verticalAlign === 'center' ? 'middle' : attrs.verticalAlign};--zuvi-word-cell-justify:${attrs.verticalAlign === 'center' ? 'safe center' : attrs.verticalAlign === 'bottom' ? 'safe flex-end' : 'flex-start'}`
      );
    if (attrs.cellMargins && typeof attrs.cellMargins === 'object')
      for (const [side, value] of Object.entries(attrs.cellMargins))
        if (
          ['top', 'right', 'bottom', 'left'].includes(side) &&
          typeof value === 'number' &&
          value >= 0 &&
          value <= 2000
        )
          styles.push(`padding-${side}:${value}pt;--zuvi-word-cell-margin-${side}:${value}pt`);
  }
  if (alignment(attrs.textAlign)) styles.push(`text-align:${alignment(attrs.textAlign)}`);
  const fixedCellHeight =
    (node.type === 'tableCell' || node.type === 'tableHeader') &&
    attrs.printFixedCellHeight !== null
      ? amount(attrs.printFixedCellHeight, 'pt', 0, 20000000)
      : '';
  if (fixedCellHeight) styles.push(`--zuvi-word-cell-height:${fixedCellHeight}`);
  if (node.type === 'tableRow')
    for (const [key, value] of Object.entries({
      ...wordRowCss(attrs),
      ...wordTableRowSpacingCss(attrs),
    }))
      styles.push(`${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}:${value}`);
  if (node.type === 'tableRow' && typeof attrs.printRenderedRowHeight === 'number')
    styles.push(`--zuvi-word-row-render-height:${attrs.printRenderedRowHeight}pt`);
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
    const crop = wordImageCrop(attrs.crop);
    if (crop) {
      const width = Number(attrs.width) || 320,
        height = Number(attrs.height) || 180;
      const geometry = wordImageCropGeometry(crop, width, height);
      const clipped = `<span data-word-image-crop-frame="" style="display:inline-block;position:relative;overflow:hidden;width:${width}px;height:${height}px;${escape(css)}"><img src="${escape(source)}" alt="${escape(attrs.alt)}" style="position:absolute;max-width:none;width:${geometry.width}px;height:${geometry.height}px;left:${geometry.left}px;top:${geometry.top}px"></span>`;
      return layout && ['front', 'behind'].includes(layout.wrap)
        ? `<span class="studio-print-image-anchor">${clipped}</span>`
        : clipped;
    }
    return layout && ['front', 'behind'].includes(layout.wrap)
      ? `<span class="studio-print-image-anchor">${printed}</span>`
      : printed;
  }

  if (node.type === 'mathEquation' || node.type === 'pageNumber' || node.type === 'tableFormula')
    return text;
  if (node.type === 'wordBookmark') return '';
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
  const content =
    tag === 'td' || tag === 'th'
      ? `<div data-word-cell-content="">${text}</div>`
      : text || (tag === 'p' ? '<br>' : '');
  const rowRule =
    tag === 'tr' && attrs.rowHeight != null
      ? ` data-word-row-height-rule="${escape(attrs.rowHeightRule ?? 'atLeast')}" data-word-row-height="${escape(attrs.rowHeight)}"`
      : '';
  return `<${tag}${spacingLayout ? ` data-word-spacing-layout="${spacingLayout.kind}"` : ''}${numberedStyle}${spans}${start}${lineRule}${tabs}${numbering}${rowRule}${fixedCellHeight ? ` data-word-rendered-cell-height="${escape(attrs.printFixedCellHeight)}"${Number(attrs.rowspan) > 1 ? ' data-word-fixed-cell-height=""' : ''}` : ''}${(tag === 'ol' || tag === 'ul') && attrs.numberingInstanceId ? ' data-word-list-instance="true"' : ''}>${content}</${tag}>`;
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

function sheetTextMarkup(layout: SheetTextLayout): string {
  const { effectiveFont: font, transform: matrix } = layout;
  const styles = `font-family:${studioSheetTextFontFamily(font.family)};font-size:${font.sizePt}pt;font-weight:${font.bold ? 700 : 400};font-style:${font.italic ? 'italic' : 'normal'}`;
  const lines = layout.lines.flatMap((line) => layout.verticalGlyphs
    ? line.runs.map((run) => `<span style="left:${run.x}px;top:${run.y}px;line-height:${run.height}px">${escape(run.text)}</span>`)
    : [`<span dir="${layout.direction}" style="left:${line.x}px;top:${line.y}px;line-height:${line.height}px;${line.gapKind === 'characters' ? `letter-spacing:${line.gap}px;` : line.gapKind === 'words' ? `word-spacing:${line.gap}px;` : ''}">${escape(line.text)}</span>`]
  ).join('');
  return `<div class="studio-print-text" data-text-align="${layout.align}" data-effective-font-size="${font.sizePt}" style="${escape(styles)}"><div class="studio-print-text-transform" style="transform:matrix(${matrix.a},${matrix.b},${matrix.c},${matrix.d},${matrix.e},${matrix.f})">${lines}</div></div>`;
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
    if (!cell.input && !cell.background && !Object.keys(cell.borders ?? {}).length && cell.align !== 'centerContinuous') continue;
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
  const offsets = [0];
  for (let col = 1; col <= columns; col++) offsets.push(offsets[col - 1] + (hiddenCols.has(studioColumnLabel(col)) ? 0 : sheet.columnWidths?.[studioColumnLabel(col)] ?? 112));
  const measure = studioSheetTextMeasure();
  const heights = studioSheetDerivedRowHeights(document, sheet, calculation, Array.from({ length: rows }, (_, index) => index + 1).filter((row) => !hidden.has(row)), offsets, measure);
  const body: string[] = [];
  for (let row = 1; row <= rows; row++) {
    if (hidden.has(row)) continue;
    const rowPoints = heights[String(row)] ?? sheet.defaultRowHeight ?? 18;
    const centered = studioSheetCenteredTextSegments(document, sheet, calculation, row, offsets);
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
      const mergeColumns = merge
        ? Array.from(
            { length: merge.lastCol - merge.firstCol + 1 },
            (_, offset) => merge.firstCol + offset
          ).filter((index) => !hiddenCols.has(studioColumnLabel(index)))
        : [col];
      if (merge && (mergeRows[0] !== row || mergeColumns[0] !== col)) continue;
      // The visible first cell can differ from the logical native merge master.
      const address = studioCellAddress(merge?.firstRow ?? row, merge?.firstCol ?? col);
      const points = mergeRows.reduce(
        (total, index) =>
          total + (heights[String(index)] ?? sheet.defaultRowHeight ?? 18),
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
        ? ` colspan="${mergeColumns.length}" rowspan="${mergeRows.length}"`
        : '';
      const link = studioCellHyperlink(document, sheet.id, address, calculation);
      const center = centered.find((segment) => segment.ownerCol === col);
      const width = center?.width ?? offsets[merge?.lastCol ?? col] - offsets[(merge?.firstCol ?? col) - 1];
      const height = points * 4 / 3;
      const textInput = studioSheetCellTextInput(document, sheet, calculation, address, { width, height }, measure, center?.lastCol);
      const text = sheetTextMarkup(sheetLayoutText(textInput));
      const tooltip = link?.tooltip ? ` title="${escape(link.tooltip)}"` : '';
      const target = link ? studioResolveSheetHyperlink(document, sheet.id, link) : undefined;
      const content =
        target?.kind === 'external'
          ? `<a href="${escape(target.href)}" target="_blank" rel="noopener noreferrer"${tooltip}>${text}</a>`
          : tooltip
            ? `<span${tooltip}>${text}</span>`
            : text;
      if (center) styles.push('position:relative;z-index:2');
      const topBorder = textInput.box.padding?.top ?? 0;
      const leftBorder = (textInput.box.padding?.left ?? 5) - 5;
      const bottomBorder = textInput.box.padding?.bottom ?? 1;
      cells.push(
        `<td${spans} style="${escape(styles.join(';'))}"><div class="studio-print-cell" style="height:${Math.max(0, height - topBorder - bottomBorder)}px;max-height:${Math.max(0, height - topBorder - bottomBorder)}px;overflow:${center ? 'visible' : 'hidden'}"><div class="studio-print-text-clip" style="left:${-leftBorder}px;top:${-topBorder}px;width:${width}px;height:${height}px">${content}</div></div></td>`
      );
    }
    body.push(`<tr style="height:${rowPoints}pt">${cells.join('')}</tr>`);
  }
  const cols = Array.from({ length: columns }, (_, index) =>
    hiddenCols.has(studioColumnLabel(index + 1))
      ? ''
      : `<col style="width:${sheet.columnWidths?.[studioColumnLabel(index + 1)] ?? 112}px">`
  ).join('');
  return `<section class="studio-print-sheet"><h1>${escape(sheet.name)}</h1><table style="width:${offsets[columns]}px"><colgroup>${cols}</colgroup>${body.join('')}</table>${(sheet.charts ?? []).map((chart) => sheetChart(sheet, chart, calculation)).join('')}</section>`;
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
.studio-print-sheet table{border-collapse:separate;border-spacing:0}
.studio-print-sheet td{padding:0;border:0;border-right:1px solid #b8c2bc;border-bottom:1px solid #b8c2bc;overflow:visible}
.studio-print-cell{position:relative;overflow:hidden;text-decoration:inherit}
.studio-print-text-clip{position:absolute;overflow:hidden;text-decoration:inherit}
.studio-print-text-clip>a{position:absolute;inset:0;display:block}
.studio-print-text,.studio-print-text-transform{position:absolute;left:0;top:0;transform-origin:0 0;text-decoration:inherit}
.studio-print-text-transform{width:0;height:0}
.studio-print-text-transform>span{position:absolute;display:block;white-space:pre;padding:0;max-width:none;overflow:visible;text-decoration:inherit}
${document.kind === 'excel' ? '.studio-print-sheet table{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.15}' : ''}
[data-word-line-rule="exact"] [data-word-baselineshift]{vertical-align:top!important;position:relative;top:calc(-1 * var(--zuvi-word-baseline-shift,0pt))}
header:empty,footer:empty{display:none}thead{display:table-header-group}
tr[data-word-row-height-rule="exact"][data-word-row-height]{height:var(--zuvi-word-row-render-height,var(--zuvi-word-row-height))!important}
tr[data-word-row-height-rule="exact"][data-word-row-height]>:is(td,th):not([rowspan]:not([rowspan="1"])),:is(td,th)[data-word-fixed-cell-height]{padding-block:0!important}tr[data-word-row-height-rule="exact"][data-word-row-height]>:is(td,th):not([rowspan]:not([rowspan="1"]))>[data-word-cell-content],:is(td,th)[data-word-fixed-cell-height]>[data-word-cell-content]{display:flex;flex-direction:column;justify-content:var(--zuvi-word-cell-justify,flex-start);box-sizing:border-box;height:max(0px,calc(var(--zuvi-word-cell-height,var(--zuvi-word-row-height)) - var(--zuvi-word-cell-border-y,1px)));padding-top:max(0px,min(var(--zuvi-word-cell-margin-top,0pt),calc(var(--zuvi-word-cell-height,var(--zuvi-word-row-height)) - var(--zuvi-word-cell-border-y,1px))));padding-bottom:max(0px,min(var(--zuvi-word-cell-margin-bottom,0pt),calc(var(--zuvi-word-cell-height,var(--zuvi-word-row-height)) - var(--zuvi-word-cell-border-y,1px) - var(--zuvi-word-cell-margin-top,0pt))));overflow:hidden}
[data-word-cell-content]>*{flex-shrink:0}
/* Row-specific native gaps occupy space outside the visible cell box. */
.studio-print-page table[data-word-spacing-layout='mixed'] > tbody > tr:not([data-word-auto-page-row]) > :is(td, th) {
  padding-top: calc(var(--zuvi-word-row-spacing, 0pt) / 2) !important;
  padding-bottom: calc(var(--zuvi-word-cell-end-spacing, var(--zuvi-word-row-spacing, 0pt)) / 2) !important;
  padding-left: var(--zuvi-word-cell-gap-left, calc(var(--zuvi-word-row-spacing, 0pt) / 2)) !important;
  padding-right: var(--zuvi-word-cell-gap-right, calc(var(--zuvi-word-row-spacing, 0pt) / 2)) !important;
  border: 0 !important;
  background: transparent !important;
  vertical-align: top !important;
}
.studio-print-page table[data-word-spacing-layout='mixed'] > tbody > tr:not([data-word-auto-page-row]) > :is(td, th):first-child {
  padding-left: var(--zuvi-word-cell-gap-left, var(--zuvi-word-row-spacing, 0pt)) !important;
}
.studio-print-page table[data-word-spacing-layout='mixed'] > tbody > tr:not([data-word-auto-page-row]) > :is(td, th):last-child {
  padding-right: var(--zuvi-word-cell-gap-right, var(--zuvi-word-row-spacing, 0pt)) !important;
}
.studio-print-page table[data-word-spacing-layout='mixed'] > tbody > tr:not([data-word-auto-page-row]) > :is(td, th) > [data-word-cell-content] {
  display: flex;
  flex-direction: column;
  justify-content: var(--zuvi-word-cell-justify, flex-start);
  border: 1px solid #b8c2bc;
  background: var(--zuvi-word-cell-background, transparent);
  padding: var(--zuvi-word-cell-margin-top, 0pt) var(--zuvi-word-cell-margin-right, 5.4pt) var(--zuvi-word-cell-margin-bottom, 0pt) var(--zuvi-word-cell-margin-left, 5.4pt);
  box-sizing: border-box;
}
.studio-print-page table[data-word-spacing-layout='mixed'] > tbody > tr[data-word-row-height-rule='exact'][data-word-row-height] > :is(td, th):not([rowspan]:not([rowspan='1'])),
.studio-print-page table[data-word-spacing-layout='mixed'] > tbody > tr > :is(td, th)[data-word-fixed-cell-height] {
  padding-top: calc(var(--zuvi-word-row-spacing, 0pt) / 2) !important;
  padding-bottom: calc(var(--zuvi-word-cell-end-spacing, var(--zuvi-word-row-spacing, 0pt)) / 2) !important;
}
.studio-print-page table[data-word-spacing-layout='mixed'] > tbody > tr[data-word-row-height-rule='exact'][data-word-row-height] > :is(td, th):not([rowspan]:not([rowspan='1'])) > [data-word-cell-content],
.studio-print-page table[data-word-spacing-layout='mixed'] > tbody > tr > :is(td, th)[data-word-fixed-cell-height] > [data-word-cell-content] {
  height: var(--zuvi-word-cell-height);
  overflow: hidden;
}

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
          view.document
            .querySelectorAll<HTMLTableElement>('table[data-word-spacing-layout="mixed"]')
            .forEach(wordFillMixedTableRows);
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
