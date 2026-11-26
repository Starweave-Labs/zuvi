import { expect, test, type BrowserContext, type Locator, type Page } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const requireUi = createRequire(path.resolve('packages/ui/package.json'));
const requireDocs = createRequire(path.resolve('docs/package.json'));
const JSZip = requireDocs('jszip') as typeof import('../docs/node_modules/jszip');
const { JSDOM } = requireUi('jsdom');
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const audit = path.resolve('docs/audits/2026-11-26/word-cell-properties/mapping');
const mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const sides = ['top', 'right', 'bottom', 'left'] as const;
type Margins = Partial<Record<(typeof sides)[number], number>>;
type CellState = {
  row: number;
  column: number;
  colspan: number;
  rowspan: number;
  paragraphs: string[];
  horizontal: string[];
  bold: boolean[];
  italic: boolean[];
  vertical: string;
  margins: Margins | null;
  background: string | null;
};
type TableState = {
  defaults: Margins | null;
  spacing: number | null;
  rowSpacings: (number | null)[];
  cells: CellState[];
};

function children(element: Element | undefined, name: string): Element[] {
  return element ? Array.from(element.children).filter(item => item.namespaceURI === W && item.localName === name) : [];
}
function child(element: Element | undefined, name: string): Element | undefined {
  return children(element, name)[0];
}
function margins(element: Element | undefined): Margins | null {
  if (!element) return null;
  const result: Margins = {};
  for (const side of sides) {
    const item = child(element, side);
    if (!item) continue;
    expect(item.getAttributeNS(W, 'type')).toBe('dxa');
    const value = item.getAttributeNS(W, 'w');
    expect(value).not.toBeNull();
    result[side] = Number(value) / 20;
  }
  return Object.keys(result).length ? result : null;
}
function spacing(element: Element | undefined): number | null {
  const item = child(element, 'tblCellSpacing');
  if (!item) return null;
  if (item.getAttributeNS(W, 'type') === 'nil') return 0;
  expect(item.getAttributeNS(W, 'type')).toBe('dxa');
  const value = item.getAttributeNS(W, 'w');
  expect(value).not.toBeNull();
  // Native Word stores half the physical gap in twips.
  return Number(value) / 10;
}
function enabled(element: Element): boolean {
  return !['0', 'false', 'off'].includes(element.getAttributeNS(W, 'val') || '');
}
async function nativeTable(bytes: Buffer) {
  const zip = await JSZip.loadAsync(bytes);
  const xml = await zip.file('word/document.xml')!.async('string');
  const document: Document = new JSDOM(xml, { contentType: 'application/xml' }).window.document;
  const table = document.getElementsByTagNameNS(W, 'tbl')[0];
  expect(document.getElementsByTagNameNS(W, 'tbl')).toHaveLength(1);
  const grid = children(child(table, 'tblGrid'), 'gridCol').map(item => Number(item.getAttributeNS(W, 'w')));
  const rows = children(table, 'tr');
  const state: TableState = {
    defaults: margins(child(child(table, 'tblPr'), 'tblCellMar')),
    spacing: spacing(child(table, 'tblPr')),
    rowSpacings: rows.map(row => spacing(child(row, 'trPr')) ?? spacing(child(row, 'tblPrEx'))),
    cells: [],
  };
  const continuations: { row: number; column: number; colspan: number; text: string }[] = [];
  let previous = new Map<number, CellState>();
  rows.forEach((row, rowIndex) => {
    const next = new Map<number, CellState>();
    let column = 0;
    for (const cell of children(row, 'tc')) {
      const properties = child(cell, 'tcPr');
      const colspan = Number(child(properties, 'gridSpan')?.getAttributeNS(W, 'val') || 1);
      const paragraphs = children(cell, 'p');
      const text = paragraphs.map(paragraph => Array.from(paragraph.getElementsByTagNameNS(W, 't')).map(item => item.textContent || '').join(''));
      const merge = child(properties, 'vMerge');
      if (merge && merge.getAttributeNS(W, 'val') !== 'restart') {
        const origin = previous.get(column);
        expect(origin, `Native vertical continuation at row ${rowIndex}, column ${column}`).toBeDefined();
        expect(origin!.colspan).toBe(colspan);
        expect(text.join('')).toBe('');
        origin!.rowspan++;
        continuations.push({ row: rowIndex, column, colspan, text: text.join('') });
        for (let offset = 0; offset < colspan; offset++) next.set(column + offset, origin!);
      } else {
        const fill = child(properties, 'shd')?.getAttributeNS(W, 'fill');
        const result: CellState = {
          row: rowIndex, column, colspan, rowspan: 1,
          paragraphs: text,
          horizontal: paragraphs.map(paragraph => child(child(paragraph, 'pPr'), 'jc')?.getAttributeNS(W, 'val') || 'left'),
          bold: paragraphs.map(paragraph => Array.from(paragraph.getElementsByTagNameNS(W, 'b')).some(enabled)),
          italic: paragraphs.map(paragraph => Array.from(paragraph.getElementsByTagNameNS(W, 'i')).some(enabled)),
          vertical: child(properties, 'vAlign')?.getAttributeNS(W, 'val') || 'top',
          margins: margins(child(properties, 'tcMar')),
          background: fill && /^[0-9a-f]{6}$/i.test(fill) ? `#${fill.toLowerCase()}` : null,
        };
        state.cells.push(result);
        if (merge) for (let offset = 0; offset < colspan; offset++) next.set(column + offset, result);
      }
      column += colspan;
    }
    expect(column, `Native grid occupancy in row ${rowIndex}`).toBe(grid.length);
    previous = next;
  });
  return { xml, grid, state, continuations };
}

function bodyTable(page: Page): Locator {
  return page.getByRole('textbox', { name: 'Word 文档正文', exact: true }).locator('table').first();
}
async function readTable(table: Locator): Promise<TableState> {
  return table.evaluate(element => {
    const defaults = element.getAttribute('data-word-table-margins');
    const gap = element.getAttribute('data-word-cell-spacing');
    const rows = Array.from(element.querySelectorAll(':scope > tbody > tr:not([data-word-auto-page-row])'));
    const cells: CellState[] = [];
    const occupied: number[] = [];
    rows.forEach((row, rowIndex) => {
      let column = 0;
      for (const cell of row.querySelectorAll<HTMLTableCellElement>(':scope > td')) {
        while ((occupied[column] || 0) > rowIndex) column++;
        const paragraphs = Array.from(cell.querySelectorAll<HTMLElement>(':scope > [data-word-cell-content] > p'));
        const rawMargins = cell.getAttribute('data-word-cell-margins');
        const vertical = cell.style.verticalAlign;
        cells.push({
          row: rowIndex, column, colspan: cell.colSpan, rowspan: cell.rowSpan,
          paragraphs: paragraphs.map(paragraph => paragraph.textContent || ''),
          horizontal: paragraphs.map(paragraph => {
            const style = getComputedStyle(paragraph);
            if (style.textAlign === 'start') return style.direction === 'rtl' ? 'right' : 'left';
            if (style.textAlign === 'end') return style.direction === 'rtl' ? 'left' : 'right';
            return style.textAlign;
          }),
          bold: paragraphs.map(paragraph => !!paragraph.querySelector('strong,b')),
          italic: paragraphs.map(paragraph => !!paragraph.querySelector('em,i')),
          vertical: vertical === 'middle' ? 'center' : vertical || 'top',
          margins: rawMargins ? JSON.parse(rawMargins) : null,
          background: cell.getAttribute('data-word-cell-background')?.toLowerCase() || null,
        });
        for (let offset = 0; offset < cell.colSpan; offset++) occupied[column + offset] = rowIndex + cell.rowSpan;
        column += cell.colSpan;
      }
    });
    return {
      defaults: defaults ? JSON.parse(defaults) : null,
      spacing: gap === null ? null : Number(gap),
      rowSpacings: rows.map(row => {
        const value = row.getAttribute('data-word-row-cell-spacing');
        return value === null ? null : Number(value);
      }),
      cells,
    };
  });
}

// Read-only geometry from the actual editor DOM or the actual print document.
function tableGeometry(element: Element) {
  const tableRect = element.getBoundingClientRect();
  const scale = tableRect.width / (element as HTMLElement).offsetWidth;
  const box = (rect: DOMRect) => ({
    left: (rect.left - tableRect.left) / scale,
    right: (rect.right - tableRect.left) / scale,
    top: (rect.top - tableRect.top) / scale,
    bottom: (rect.bottom - tableRect.top) / scale,
    width: rect.width / scale,
    height: rect.height / scale,
  });
  const cells = Array.from(element.querySelectorAll<HTMLTableCellElement>(':scope > tbody > tr:not([data-word-auto-page-row]) > td'));
  return {
    width: tableRect.width / scale,
    columns: Array.from(element.querySelectorAll<HTMLElement>(':scope > colgroup > col')).map(column => parseFloat(column.style.width)),
    cells: cells.map(cell => {
      const content = cell.querySelector<HTMLElement>(':scope > [data-word-cell-content]')!;
      const paragraphs = Array.from(content.querySelectorAll<HTMLElement>(':scope > p'));
      const first = paragraphs[0], last = paragraphs[paragraphs.length - 1];
      const outer = getComputedStyle(cell), inner = getComputedStyle(content);
      const firstStyle = getComputedStyle(first), lastStyle = getComputedStyle(last);
      const range = cell.ownerDocument.createRange();
      range.selectNodeContents(last);
      const tdRect = cell.getBoundingClientRect(), rect = content.getBoundingClientRect();
      return {
        name: first.textContent || '',
        box: box(rect), outerBox: box(tdRect),
        fillError: (tdRect.height - rect.height) / scale - parseFloat(outer.paddingTop) - parseFloat(outer.paddingBottom),
        topGap: (first.getBoundingClientRect().top - rect.top) / scale,
        bottomGap: (rect.bottom - last.getBoundingClientRect().bottom) / scale,
        expectedTop: parseFloat(inner.paddingTop) + parseFloat(inner.borderTopWidth) + parseFloat(firstStyle.marginTop),
        expectedBottom: parseFloat(inner.paddingBottom) + parseFloat(inner.borderBottomWidth) + parseFloat(lastStyle.marginBottom),
        rangeRightGap: (last.getBoundingClientRect().right - range.getBoundingClientRect().right) / scale,
        padding: {
          top: parseFloat(inner.paddingTop), right: parseFloat(inner.paddingRight),
          bottom: parseFloat(inner.paddingBottom), left: parseFloat(inner.paddingLeft),
        },
        outerPadding: {
          top: parseFloat(outer.paddingTop), right: parseFloat(outer.paddingRight),
          bottom: parseFloat(outer.paddingBottom), left: parseFloat(outer.paddingLeft),
        },
        inlineMinHeight: content.style.minHeight,
      };
    }),
  };
}
type Geometry = ReturnType<typeof tableGeometry>;
function near(actual: number, expected: number) {
  expect(Math.abs(actual - expected)).toBeLessThan(0.1);
}
function assertMergedGeometry(actual: Geometry, aligned: boolean) {
  near(actual.width, 440);
  expect(actual.columns).toEqual([140, 150, 150]);
  expect(actual.cells.map(cell => cell.name)).toEqual(['Span A', 'Wide B', 'Cell C', 'D first', 'Unselected E', 'Unselected F']);
  const [a, b, c, d, e, f] = actual.cells;
  const horizontal = [[8, 136], [144, 432], [148, 282], [298, 424], [0, 290], [290, 440]];
  actual.cells.forEach((cell, index) => {
    near(cell.box.left, horizontal[index][0]); near(cell.box.right, horizontal[index][1]);
    near(cell.fillError, 0);
  });
  // The rowspan ends in the second row, whose physical half-gap is 8px.
  near(a.box.top, b.box.top); near(a.box.bottom, c.box.bottom); near(c.box.bottom, d.box.bottom);
  near(c.box.top - b.box.bottom, 12); near(e.box.top - c.box.bottom, 8); near(e.box.top, f.box.top);
  if (aligned) {
    for (const cell of [a, b, c, d]) {
      near(cell.padding.left, 4.25 * 4 / 3);
      near(cell.padding.bottom, 5.5 * 4 / 3);
      near(cell.bottomGap, cell.expectedBottom);
      near(cell.rangeRightGap, 0);
    }
    near(a.padding.top, 0); near(a.padding.right, 3.25 * 4 / 3);
    near(e.padding.top, 12); near(e.padding.left, 2);
  }
}
function assertClearedGeometry(actual: Geometry) {
  expect(actual.cells).toHaveLength(4);
  expect(actual.columns).toEqual([208, 208]);
  const [direct, inherited, other] = actual.cells;
  near(inherited.outerBox.left - direct.outerBox.right, 0);
  near(direct.outerPadding.top, 0); near(inherited.outerPadding.top, 8);
  near(direct.outerPadding.left, 7.2); near(inherited.outerPadding.left, 7.2);
  near(other.outerPadding.left, 2); near(other.outerPadding.bottom, 3);
  for (const cell of actual.cells) expect(cell.inlineMinHeight).toBe('');
}

async function upload(page: Page, bytes: Buffer, name: string) {
  await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({ name, mimeType, buffer: bytes });
  await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(name);
  await expect(bodyTable(page)).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}
async function assertState(table: Locator, expected: TableState) {
  await expect(async () => expect(await readTable(table)).toEqual(expected)).toPass({ timeout: 5000 });
}
async function openDialog(page: Page, cell?: Locator) {
  if (cell) await cell.locator(':scope > [data-word-cell-content] > p').first().click();
  await page.getByRole('tab', { name: '插入', exact: true }).click();
  await page.getByRole('button', { name: '单元格对齐与边距', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '单元格对齐与边距', exact: true });
  await expect(dialog).toBeVisible();
  return dialog;
}
async function selectMergedBlock(page: Page, table: Locator) {
  const startCell = table.locator('td[rowspan="2"]');
  const endCell = table.locator('tr').first().locator('td[colspan="2"]');
  await startCell.scrollIntoViewIfNeeded();
  const start = (await startCell.boundingBox())!, end = (await endCell.boundingBox())!;
  await page.mouse.move(start.x + 4, start.y + Math.min(18, start.height / 2));
  await page.mouse.down();
  await page.mouse.move(end.x + end.width - 4, end.y + end.height / 2, { steps: 12 });
  await page.mouse.up();
  await expect(table.locator('td.selectedCell')).toHaveCount(4);
  expect(await table.locator('td.selectedCell').evaluateAll(cells => cells.map(cell => cell.querySelector('p')?.textContent))).toEqual(['Span A', 'Wide B', 'Cell C', 'D first']);
}
async function undoRedo(page: Page, table: Locator, before: TableState, after: TableState) {
  await page.getByRole('tab', { name: '开始', exact: true }).click();
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  await assertState(table, before);
  await page.getByRole('button', { name: '重做', exact: true }).click();
  await assertState(table, after);
}
async function reopenTwice(page: Page, table: Locator, stem: string, expected: TableState, grid: number[], verify: (actual: Geometry) => void) {
  const rounds: Geometry[] = [];
  for (let round = 1; round <= 2; round++) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await pending).path())!);
    await writeFile(path.join(audit, `${stem}-round-${round}.docx`), bytes);
    const native = await nativeTable(bytes);
    expect(native.state).toEqual(expected); expect(native.grid).toEqual(grid);
    expect(native.continuations).toEqual(stem === 'merged' ? [{ row: 1, column: 0, colspan: 1, text: '' }] : []);
    await writeFile(path.join(audit, `${stem}-round-${round}.xml`), native.xml);
    await upload(page, bytes, `${stem}-round-${round}.docx`);
    await assertState(table, expected);
    await expect(async () => verify(await table.evaluate(tableGeometry))).toPass({ timeout: 5000 });
    rounds.push(await table.evaluate(tableGeometry));
  }
  return rounds;
}
async function printDocument(page: Page, context: BrowserContext, stem: string, verify: (actual: Geometry) => void) {
  await page.evaluate(() => {
    window.addEventListener('message', event => {
      if (event.data?.type === 'word-cell-mapping-print')
        (window as Window & { wordCellMappingPrint?: string }).wordCellMappingPrint = event.data.html;
    });
  });
  await page.addInitScript(() => {
    window.print = () => {
      window.parent.postMessage({ type: 'word-cell-mapping-print', html: document.documentElement.outerHTML }, '*');
      window.dispatchEvent(new Event('afterprint'));
    };
  });
  await page.getByRole('button', { name: '打印', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as Window & { wordCellMappingPrint?: string }).wordCellMappingPrint)).toBeTruthy();
  const html = await page.evaluate(() => (window as Window & { wordCellMappingPrint?: string }).wordCellMappingPrint!);
  await writeFile(path.join(audit, `${stem}-print.html`), html);
  const preview = await context.newPage();
  try {
    await preview.setContent(html);
    await preview.evaluate(() => document.fonts.ready);
    const table = preview.locator('table').first();
    await expect(async () => verify(await table.evaluate(tableGeometry))).toPass({ timeout: 5000 });
    const geometry = await table.evaluate(tableGeometry);
    await preview.pdf({ path: path.join(audit, `${stem}-print.pdf`), preferCSSPageSize: true, printBackground: true });
    await preview.screenshot({ path: path.join(audit, `${stem}-print.png`), fullPage: true, animations: 'disabled' });
    return geometry;
  } finally {
    await preview.close();
  }
}

test('maps real merged multi-cell edits through mixed row gaps, one history action, two native reopens and print', async ({ page, context }) => {
  test.setTimeout(120000);
  await mkdir(audit, { recursive: true });
  const source = await readFile(path.join(audit, 'merged-source.docx'));
  const native = await nativeTable(source), before = native.state;
  expect(native.grid).toEqual([2100, 2250, 2250]);
  expect(native.continuations).toEqual([{ row: 1, column: 0, colspan: 1, text: '' }]);
  expect(before.defaults).toEqual({ top: 4, right: 5, bottom: 6, left: 7 });
  expect(before.rowSpacings).toEqual([null, 12, 0]);
  expect(before.cells.map(cell => [cell.row, cell.column, cell.colspan, cell.rowspan])).toEqual([[0, 0, 1, 2], [0, 1, 2, 1], [1, 1, 1, 1], [1, 2, 1, 1], [2, 0, 2, 1], [2, 2, 1, 1]]);
  await page.goto('/#/components/office-studio');
  await upload(page, source, 'Merged mapping.docx');
  const table = bodyTable(page);
  await expect(table).toHaveAttribute('data-word-spacing-layout', 'mixed');
  await assertState(table, before);
  await expect(async () => assertMergedGeometry(await table.evaluate(tableGeometry), false)).toPass({ timeout: 5000 });
  const initial = await table.evaluate(tableGeometry);
  await selectMergedBlock(page, table);
  let dialog = await openDialog(page);
  await expect(dialog).toContainText('所选 4 个单元格');
  await dialog.getByRole('button', { name: '下右对齐', exact: true }).click();
  await dialog.getByRole('textbox', { name: '单元格left内边距', exact: true }).fill('4.25');
  await dialog.getByRole('textbox', { name: '单元格bottom内边距', exact: true }).fill('5.5');
  await dialog.getByRole('textbox', { name: '表格默认top内边距', exact: true }).fill('9');
  await dialog.getByRole('button', { name: '取消', exact: true }).click();
  await assertState(table, before);
  await selectMergedBlock(page, table);
  dialog = await openDialog(page);
  await dialog.getByRole('button', { name: '下右对齐', exact: true }).click();
  await dialog.getByRole('textbox', { name: '单元格left内边距', exact: true }).fill('4.25');
  await dialog.getByRole('textbox', { name: '单元格bottom内边距', exact: true }).fill('5.5');
  await dialog.getByRole('textbox', { name: '表格默认top内边距', exact: true }).fill('9');
  await dialog.getByRole('button', { name: '应用单元格属性', exact: true }).click();
  const after = structuredClone(before);
  after.defaults = { ...after.defaults, top: 9 };
  after.cells.slice(0, 4).forEach(cell => {
    cell.margins = { ...cell.margins, left: 4.25, bottom: 5.5 };
    cell.vertical = 'bottom'; cell.horizontal = cell.horizontal.map(() => 'right');
  });
  await assertState(table, after);
  await expect(async () => assertMergedGeometry(await table.evaluate(tableGeometry), true)).toPass({ timeout: 5000 });
  const changed = await table.evaluate(tableGeometry);
  expect(changed.cells[1].topGap - initial.cells[1].topGap).toBeGreaterThan(20);
  await undoRedo(page, table, before, after);
  await expect(async () => assertMergedGeometry(await table.evaluate(tableGeometry), true)).toPass({ timeout: 5000 });

  const screens = [
    { name: 'merged-dialog-light.png', dark: false, width: 1280, height: 800 },
    { name: 'merged-dialog-dark.png', dark: true, width: 1280, height: 800 },
    { name: 'merged-dialog-dark-320.png', dark: true, width: 320, height: 720 },
    { name: 'merged-dialog-light-320.png', dark: false, width: 320, height: 720 },
  ];
  const dialogGeometry: unknown[] = [];
  for (const screen of screens) {
    await page.setViewportSize({ width: 1280, height: 800 });
    const theme = page.getByRole('button', { name: screen.dark ? '切换暗色' : '切换浅色', exact: true });
    if (await theme.isVisible()) await theme.click();
    await selectMergedBlock(page, table);
    dialog = await openDialog(page);
    await page.setViewportSize({ width: screen.width, height: screen.height });
    const selected = dialog.getByRole('button', { name: '中中对齐', exact: true });
    await selected.click();
    await expect(selected).toHaveAttribute('aria-pressed', 'true');
    await expect(selected).toHaveAttribute('data-variant', 'primary');
    await expect(dialog.getByLabel('九宫格对齐').locator('button[aria-pressed="false"]')).toHaveCount(8);
    for (const button of await dialog.getByLabel('九宫格对齐').locator('button[aria-pressed="false"]').all())
      await expect(button).toHaveAttribute('data-variant', 'outline');
    await dialog.getByRole('textbox', { name: '单元格left内边距', exact: true }).fill('7.5');
    await dialog.getByRole('textbox', { name: '表格默认left内边距', exact: true }).fill('31');
    await dialog.getByRole('textbox', { name: '单元格间距', exact: true }).fill('17.5');
    await expect(dialog.getByRole('textbox', { name: '单元格间距', exact: true })).toHaveValue('17.5');
    await expect(dialog.getByRole('button', { name: '应用单元格属性', exact: true })).toBeEnabled();
    await expect(dialog.getByRole('button', { name: '取消', exact: true })).toBeInViewport();
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull(); expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(screen.width + 1);
    const size = await dialog.evaluate(element => ({ clientWidth: element.clientWidth, scrollWidth: element.scrollWidth }));
    expect(size.scrollWidth).toBeLessThanOrEqual(size.clientWidth + 1);
    await page.screenshot({ path: path.join(audit, screen.name), fullPage: true, animations: 'disabled' });
    dialogGeometry.push({ ...screen, box, ...size });
    await dialog.getByRole('button', { name: '取消', exact: true }).click();
    await assertState(table, after);
  }
  await page.setViewportSize({ width: 1280, height: 800 });
  const rounds = await reopenTwice(page, table, 'merged', after, native.grid, actual => assertMergedGeometry(actual, true));
  const printed = await printDocument(page, context, 'merged', actual => assertMergedGeometry(actual, true));
  for (let index = 0; index < printed.cells.length; index++) {
    near(printed.cells[index].box.width, rounds[1].cells[index].box.width);
    near(printed.cells[index].box.height, rounds[1].cells[index].box.height);
  }
  await writeFile(path.join(audit, 'merged-evidence.json'), JSON.stringify({ before, after, initial, changed, rounds, printed, dialogGeometry, selection: 'mouse CellSelection, four-cell merged closure', historyActions: 1 }, null, 2) + '\n');
});

test('restores null margins through two native reopens, then clears a default side and all spacing while retaining explicit zero', async ({ page, context }) => {
  test.setTimeout(120000);
  await mkdir(audit, { recursive: true });
  const source = await readFile(path.join(audit, 'inheritance-source.docx'));
  const native = await nativeTable(source), before = native.state;
  expect(native.grid).toEqual([3300, 3300]);
  expect(before.defaults).toEqual({ top: 6, right: 7, bottom: 8, left: 9 });
  expect(before.spacing).toBe(6); expect(before.rowSpacings).toEqual([null, 12]);
  expect(before.cells[0].margins).toEqual({ top: 0, right: 3.5 });
  expect(before.cells[1].margins).toBeNull();
  expect(before.cells[2].margins).toEqual({ bottom: 2.25, left: 1.5 });
  await page.goto('/#/components/office-studio');
  await upload(page, source, 'Inheritance mapping.docx');
  const table = bodyTable(page), first = table.locator('td').first();
  await expect(table).toHaveAttribute('data-word-spacing-layout', 'mixed');
  await assertState(table, before);
  let dialog = await openDialog(page, first);
  await dialog.getByRole('button', { name: '恢复表格默认边距', exact: true }).click();
  for (const side of sides)
    await expect(dialog.getByRole('textbox', { name: `单元格${side}内边距`, exact: true })).toBeDisabled();
  await dialog.getByRole('button', { name: '取消', exact: true }).click();
  await assertState(table, before);
  dialog = await openDialog(page, first);
  await dialog.getByRole('button', { name: '恢复表格默认边距', exact: true }).click();
  await dialog.getByRole('button', { name: '应用单元格属性', exact: true }).click();
  const restored = structuredClone(before); restored.cells[0].margins = null;
  await assertState(table, restored);
  await expect(first).not.toHaveAttribute('data-word-cell-margins');
  await undoRedo(page, table, before, restored);
  const restoredGeometry = (actual: Geometry) => {
    expect(actual.columns).toEqual([220, 220]);
    near(actual.cells[0].padding.top, 8); near(actual.cells[0].padding.left, 12);
    near(actual.cells[0].padding.right, 28 / 3);
    actual.cells.forEach(cell => near(cell.fillError, 0));
  };
  const restoredRounds = await reopenTwice(page, table, 'restored', restored, native.grid, restoredGeometry);
  dialog = await openDialog(page, first);
  await expect(dialog.getByRole('textbox', { name: '单元格top内边距', exact: true })).toHaveValue('');
  await dialog.getByRole('textbox', { name: '单元格top内边距', exact: true }).fill('0');
  await dialog.getByRole('textbox', { name: '表格默认left内边距', exact: true }).fill('');
  await dialog.getByRole('textbox', { name: '单元格间距', exact: true }).fill('');
  await dialog.getByRole('button', { name: '取消', exact: true }).click();
  await assertState(table, restored);
  dialog = await openDialog(page, first);
  await dialog.getByRole('textbox', { name: '单元格top内边距', exact: true }).fill('0');
  await dialog.getByRole('textbox', { name: '表格默认left内边距', exact: true }).fill('');
  await dialog.getByRole('textbox', { name: '单元格间距', exact: true }).fill('');
  await dialog.getByRole('button', { name: '应用单元格属性', exact: true }).click();
  const cleared = structuredClone(restored);
  delete cleared.defaults!.left;
  cleared.spacing = null; cleared.rowSpacings = [null, null]; cleared.cells[0].margins = { top: 0 };
  await assertState(table, cleared);
  await expect(table).toHaveAttribute('data-word-spacing-layout', 'uniform');
  await expect(table).not.toHaveAttribute('data-word-cell-spacing');
  await expect(table.locator('tr[data-word-row-cell-spacing]')).toHaveCount(0);
  await expect(async () => assertClearedGeometry(await table.evaluate(tableGeometry))).toPass({ timeout: 5000 });
  await undoRedo(page, table, restored, cleared);
  const clearedRounds = await reopenTwice(page, table, 'cleared', cleared, [3120, 3120], assertClearedGeometry);
  dialog = await openDialog(page, first);
  await expect(dialog.getByRole('textbox', { name: '单元格top内边距', exact: true })).toHaveValue('0');
  await expect(dialog.getByRole('textbox', { name: '单元格left内边距', exact: true })).toHaveValue('');
  await expect(dialog.getByRole('textbox', { name: '表格默认left内边距', exact: true })).toHaveValue('');
  await expect(dialog.getByRole('textbox', { name: '单元格间距', exact: true })).toHaveValue('');
  await dialog.getByRole('button', { name: '取消', exact: true }).click();
  const printed = await printDocument(page, context, 'cleared', assertClearedGeometry);
  near(printed.width, clearedRounds[1].width);
  await writeFile(path.join(audit, 'inheritance-evidence.json'), JSON.stringify({ before, restored, restoredRounds, cleared, clearedRounds, printed, reopenCyclesPerStage: 2, historyActionsPerStage: 1, cancelledDrafts: ['restore null', 'clear side and spacing plus explicit zero'] }, null, 2) + '\n');
});
