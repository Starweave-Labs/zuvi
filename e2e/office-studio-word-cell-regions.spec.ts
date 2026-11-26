import { expect, test, type Locator, type Page } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import JSZip from '../docs/node_modules/jszip/lib/index.js';

const requireUi = createRequire(path.resolve('packages/ui/package.json'));
const { JSDOM } = requireUi('jsdom');
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const audit = path.resolve('docs/audits/2026-11-26/word-cell-regions');
const mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const sides = ['top', 'right', 'bottom', 'left'] as const;
type Margins = Partial<Record<(typeof sides)[number], number>>;
type Region = 'body' | 'header' | 'footer';
type CellState = {
  paragraphs: string[];
  vertical: string;
  horizontal: string;
  directMargins: Margins | null;
  bold: boolean;
};
type TableState = { defaults: Margins | null; spacing: number | null; cells: CellState[] };
type RegionState = Record<Region, TableState>;
const regionLabels: Record<Region, string> = { body: '文档正文', header: '页眉', footer: '页脚' };

function children(element: Element | undefined, name: string): Element[] {
  return element
    ? Array.from(element.children).filter(
        (child) => child.namespaceURI === W && child.localName === name
      )
    : [];
}
function child(element: Element | undefined, name: string): Element | undefined {
  return children(element, name)[0];
}
function nativeMargins(element: Element | undefined): Margins | null {
  if (!element) return null;
  const result: Margins = {};
  for (const side of sides) {
    const value = child(element, side)?.getAttributeNS(W, 'w');
    if (value !== null && value !== undefined) result[side] = Number(value) / 20;
  }
  return Object.keys(result).length ? result : null;
}
function nativeTable(xml: string): TableState {
  const document: Document = new JSDOM(xml, { contentType: 'application/xml' }).window.document;
  const table = document.getElementsByTagNameNS(W, 'tbl')[0];
  if (!table) throw new Error('Expected a native region table.');
  const properties = child(table, 'tblPr');
  const spacing = child(properties, 'tblCellSpacing')?.getAttributeNS(W, 'w');
  return {
    defaults: nativeMargins(child(properties, 'tblCellMar')),
    // OOXML tblCellSpacing is the half-gap; the editor presents the physical gap.
    spacing: spacing === null || spacing === undefined ? null : Number(spacing) / 10,
    cells: children(table, 'tr')
      .flatMap((row) => children(row, 'tc'))
      .map((cell) => {
        const props = child(cell, 'tcPr'),
          paragraphs = children(cell, 'p');
        const first = paragraphs[0];
        const firstRun = children(first, 'r').find(
          (run) => run.getElementsByTagNameNS(W, 't').length > 0
        );
        const bold = child(child(firstRun, 'rPr'), 'b');
        return {
          paragraphs: paragraphs.map((paragraph) =>
            Array.from(paragraph.getElementsByTagNameNS(W, 't'))
              .map((text) => text.textContent || '')
              .join('')
          ),
          vertical: child(props, 'vAlign')?.getAttributeNS(W, 'val') || 'top',
          horizontal: child(child(first, 'pPr'), 'jc')?.getAttributeNS(W, 'val') || 'left',
          directMargins: nativeMargins(child(props, 'tcMar')),
          bold: !!bold && !['0', 'false', 'off'].includes(bold.getAttributeNS(W, 'val') || ''),
        };
      }),
  };
}
async function nativeRegions(
  buffer: Buffer
): Promise<{ state: RegionState; parts: Record<Region, string> }> {
  const zip = await JSZip.loadAsync(buffer);
  const main = await zip.file('word/document.xml')!.async('string');
  const document: Document = new JSDOM(main, { contentType: 'application/xml' }).window.document;
  const rels: Document = new JSDOM(
    await zip.file('word/_rels/document.xml.rels')!.async('string'),
    { contentType: 'application/xml' }
  ).window.document;
  const part = async (region: 'header' | 'footer') => {
    const reference = Array.from(document.getElementsByTagNameNS(W, `${region}Reference`)).find(
      (element) => element.getAttributeNS(W, 'type') === 'default'
    );
    const id = reference?.getAttributeNS(R, 'id');
    const relation = Array.from(rels.getElementsByTagName('Relationship')).find(
      (element) => element.getAttribute('Id') === id
    );
    const target = relation?.getAttribute('Target');
    if (!target) throw new Error(`Missing native ${region} relationship.`);
    const filename = target.startsWith('/')
      ? target.slice(1)
      : path.posix.normalize(path.posix.join('word', target));
    const file = zip.file(filename);
    if (!file) throw new Error(`Missing native ${region} part.`);
    return file.async('string');
  };
  const parts = { body: main, header: await part('header'), footer: await part('footer') };
  for (const [region, marker] of [
    ['body', 'Body before table'],
    ['header', 'Header before table'],
    ['footer', 'Footer before table'],
  ] as const)
    if (!parts[region].includes(marker)) throw new Error(`Missing independent ${region} marker.`);
  return {
    state: {
      body: nativeTable(parts.body),
      header: nativeTable(parts.header),
      footer: nativeTable(parts.footer),
    },
    parts,
  };
}
function regionBox(page: Page, region: Region): Locator {
  return page.getByRole('textbox', {
    name: `Word ${regionLabels[region]}`,
    exact: true,
    includeHidden: true,
  });
}
function regionTable(page: Page, region: Region): Locator {
  return regionBox(page, region).locator('table').first();
}
async function readRegion(page: Page, region: Region): Promise<TableState> {
  return regionTable(page, region).evaluate((element) => {
    const defaults = element.getAttribute('data-word-table-margins'),
      spacing = element.getAttribute('data-word-cell-spacing');
    return {
      defaults: defaults ? JSON.parse(defaults) : null,
      spacing: spacing === null ? null : Number(spacing),
      cells: Array.from(
        element.querySelectorAll<HTMLTableCellElement>(':scope > tbody > tr > td')
      ).map((cell) => {
        const paragraphs = Array.from(
          cell.querySelectorAll<HTMLParagraphElement>(':scope > [data-word-cell-content] > p')
        );
        const vertical = getComputedStyle(cell).verticalAlign,
          margins = cell.getAttribute('data-word-cell-margins');
        return {
          paragraphs: paragraphs.map((paragraph) => paragraph.textContent || ''),
          vertical: vertical === 'middle' ? 'center' : vertical,
          horizontal: getComputedStyle(paragraphs[0]).textAlign,
          directMargins: margins ? JSON.parse(margins) : null,
          bold: !!paragraphs[0].querySelector('strong,b'),
        };
      }),
    };
  });
}
async function assertRegions(page: Page, expected: RegionState) {
  await expect(async () => {
    for (const region of ['body', 'header', 'footer'] as const)
      expect(await readRegion(page, region)).toEqual(expected[region]);
    await expect(regionBox(page, 'body')).toContainText('Body before table');
    await expect(regionBox(page, 'header')).toContainText('Header before table');
    await expect(regionBox(page, 'footer')).toContainText('Footer before table');
  }).toPass({ timeout: 5000 });
}
async function upload(page: Page, buffer: Buffer, name: string) {
  await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({ name, mimeType, buffer });
  await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(name);
  await expect(regionTable(page, 'body')).toContainText('Body A');
  await expect(regionTable(page, 'header')).toContainText('Header A');
  await expect(regionTable(page, 'footer')).toContainText('Footer A');
}
async function activate(page: Page, region: Region) {
  if (region === 'body') {
    await regionBox(page, 'body').locator('td p').first().dblclick();
  } else {
    await page.getByLabel(`${regionLabels[region]}区域`, { exact: true }).dblclick();
  }
  await expect(regionBox(page, region)).toHaveAttribute('contenteditable', 'true');
}
async function openCellDialog(page: Page, region: Region) {
  await regionTable(page, region).locator('td p').first().click();
  await page.getByRole('tab', { name: '插入', exact: true }).click();
  await page.getByRole('button', { name: '单元格对齐与边距', exact: true }).click();
  return page.getByRole('dialog', { name: '单元格对齐与边距', exact: true });
}
async function download(page: Page, filename: string): Promise<Buffer> {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出文件', exact: true }).click();
  const bytes = await readFile((await (await pending).path())!);
  await writeFile(path.join(audit, filename), bytes);
  return bytes;
}

test('edits independent native header and footer table cells, cancels drafts, undoes once and reopens both regions twice', async ({
  page,
}) => {
  await mkdir(audit, { recursive: true });
  const source = await readFile(path.join(audit, 'regions-source.docx'));
  const original = (await nativeRegions(source)).state;
  const expected = structuredClone(original);
  await page.goto('/#/components/office-studio');
  await upload(page, source, 'Cell-regions.docx');
  await assertRegions(page, expected);
  for (const region of ['header', 'footer'] as const) {
    await activate(page, region);
    let dialog = await openCellDialog(page, region);
    await dialog.getByRole('button', { name: '上中对齐', exact: true }).click();
    await dialog.getByRole('textbox', { name: '单元格left内边距', exact: true }).fill('99');
    await dialog.getByRole('textbox', { name: '表格默认top内边距', exact: true }).fill('99');
    await dialog.getByRole('textbox', { name: '单元格间距', exact: true }).fill('9');
    await dialog.getByRole('button', { name: '取消', exact: true }).click();
    await assertRegions(page, expected);
    dialog = await openCellDialog(page, region);
    const before = structuredClone(expected);
    if (region === 'header') {
      await dialog.getByRole('button', { name: '下右对齐', exact: true }).click();
      await dialog.getByRole('textbox', { name: '单元格left内边距', exact: true }).fill('5.5');
      await dialog.getByRole('textbox', { name: '表格默认top内边距', exact: true }).fill('10');
      await dialog.getByRole('textbox', { name: '表格默认left内边距', exact: true }).fill('12');
      await dialog.getByRole('textbox', { name: '单元格间距', exact: true }).fill('6');
      expected.header.defaults = { ...expected.header.defaults, top: 10, left: 12 };
      expected.header.spacing = 6;
      expected.header.cells[0] = {
        ...expected.header.cells[0],
        directMargins: { top: 0, left: 5.5 },
        vertical: 'bottom',
        horizontal: 'right',
      };
    } else {
      await dialog.getByRole('button', { name: '中中对齐', exact: true }).click();
      await dialog.getByRole('textbox', { name: '单元格bottom内边距', exact: true }).fill('7');
      await dialog.getByRole('textbox', { name: '表格默认right内边距', exact: true }).fill('9');
      await dialog.getByRole('textbox', { name: '表格默认bottom内边距', exact: true }).fill('6');
      await dialog.getByRole('textbox', { name: '单元格间距', exact: true }).fill('5');
      expected.footer.defaults = { ...expected.footer.defaults, right: 9, bottom: 6 };
      expected.footer.spacing = 5;
      expected.footer.cells[0] = {
        ...expected.footer.cells[0],
        directMargins: { top: 1, left: 2, bottom: 7 },
        vertical: 'center',
        horizontal: 'center',
      };
    }
    await dialog.getByRole('button', { name: '应用单元格属性', exact: true }).click();
    await assertRegions(page, expected);
    await page.getByRole('tab', { name: '开始', exact: true }).click();
    await page.getByRole('button', { name: '撤销', exact: true }).click();
    await assertRegions(page, before);
    await page.getByRole('button', { name: '重做', exact: true }).click();
    await assertRegions(page, expected);
  }
  await expect(regionTable(page, 'header').locator('td').first()).toHaveCSS(
    'vertical-align',
    'bottom'
  );
  await expect(regionTable(page, 'footer').locator('td').first()).toHaveCSS(
    'vertical-align',
    'middle'
  );
  const margins = await regionTable(page, 'header')
    .locator('td')
    .first()
    .evaluate((cell) => ({
      left: parseFloat(getComputedStyle(cell).paddingLeft),
      top: parseFloat(getComputedStyle(cell).paddingTop),
    }));
  expect(margins.left).toBeCloseTo((5.5 * 4) / 3, 2);
  expect(margins.top).toBe(0);
  for (let round = 1; round <= 2; round++) {
    const bytes = await download(page, `regions-round-${round}.docx`);
    const native = await nativeRegions(bytes);
    expect(native.state).toEqual(expected);
    for (const region of ['body', 'header', 'footer'] as const)
      await writeFile(
        path.join(audit, `regions-round-${round}-${region}.xml`),
        native.parts[region]
      );
    await upload(page, bytes, `Cell-regions-round-${round}.docx`);
    await assertRegions(page, expected);
  }
  await regionBox(page, 'footer').scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.join(audit, 'regions-light.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await writeFile(
    path.join(audit, 'regions-roundtrip.json'),
    JSON.stringify(
      {
        initial: original,
        edited: expected,
        rounds: 2,
        history: ['header', 'footer'],
        cancelled: ['header', 'footer'],
      },
      null,
      2
    ) + '\n'
  );
});

test('blocks a real Word cell draft on readonly changes and keeps light, dark and 320px dialogs interactive without writes', async ({
  page,
}) => {
  await mkdir(audit, { recursive: true });
  const source = await readFile(path.join(audit, 'regions-source.docx'));
  const expected = (await nativeRegions(source)).state;
  await page.goto('/#/components/office-studio');
  await upload(page, source, 'Cell-dialog-regions.docx');
  const readonly = page.getByRole('switch', { name: '只读预览', exact: true, includeHidden: true });
  await regionTable(page, 'body').locator('td p').first().click();
  await page.getByRole('tab', { name: '插入', exact: true }).click();
  await readonly.click();
  await expect(readonly).toHaveAttribute('aria-checked', 'true');
  await expect(regionBox(page, 'body')).toHaveAttribute('contenteditable', 'false');
  await expect(page.getByRole('button', { name: '单元格对齐与边距', exact: true })).toBeDisabled();
  await assertRegions(page, expected);
  await readonly.click();
  await expect(regionBox(page, 'body')).toHaveAttribute('contenteditable', 'true');
  let dialog = await openCellDialog(page, 'body');
  await dialog.getByRole('textbox', { name: '单元格left内边距', exact: true }).fill('18');
  await dialog.getByRole('textbox', { name: '表格默认top内边距', exact: true }).fill('20');
  await dialog.getByRole('textbox', { name: '单元格间距', exact: true }).fill('6');
  // Exercise the demo host's actual ZUVI switch while its child modal is open.
  // A host can change readOnly independently of the modal's pointer focus trap.
  await readonly.dispatchEvent('click');
  await expect(readonly).toHaveAttribute('aria-checked', 'true');
  for (const name of ['单元格left内边距', '表格默认top内边距', '单元格间距'])
    await expect(dialog.getByRole('textbox', { name, exact: true })).toBeDisabled();
  const apply = dialog.getByRole('button', { name: '应用单元格属性', exact: true });
  await expect(apply).toBeDisabled();
  await expect(dialog.getByRole('button', { name: '下右对齐', exact: true })).toBeDisabled();
  await apply.dispatchEvent('click');
  await assertRegions(page, expected);
  await dialog.getByRole('button', { name: '取消', exact: true }).click();
  await readonly.click();
  await expect(readonly).toHaveAttribute('aria-checked', 'false');
  const screens: { name: string; width: number; height: number; dark: boolean }[] = [
    { name: 'cell-dialog-light.png', width: 1280, height: 800, dark: false },
    { name: 'cell-dialog-dark.png', width: 1280, height: 800, dark: true },
    { name: 'cell-dialog-dark-320.png', width: 320, height: 720, dark: true },
    { name: 'cell-dialog-light-320.png', width: 320, height: 720, dark: false },
  ];
  const geometry: unknown[] = [];
  for (const screen of screens) {
    await page.setViewportSize({ width: screen.width, height: screen.height });
    const theme = page.getByRole('button', {
      name: screen.dark ? '切换暗色' : '切换浅色',
      exact: true,
    });
    if (await theme.isVisible()) await theme.click();
    dialog = await openCellDialog(page, 'body');
    await dialog.getByRole('button', { name: '中中对齐', exact: true }).click();
    await expect(dialog.getByRole('button', { name: '中中对齐', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await dialog.getByRole('textbox', { name: '单元格left内边距', exact: true }).fill('8');
    await dialog.getByRole('textbox', { name: '表格默认left内边距', exact: true }).fill('19.5');
    await dialog.getByRole('textbox', { name: '单元格间距', exact: true }).fill('7.5');
    await expect(dialog.getByRole('textbox', { name: '单元格间距', exact: true })).toHaveValue(
      '7.5'
    );
    await expect(dialog.getByRole('button', { name: '应用单元格属性', exact: true })).toBeEnabled();
    await expect(dialog.getByRole('button', { name: '取消', exact: true })).toBeInViewport();
    if (screen.width === 320) {
      await dialog.getByRole('button', { name: '上左对齐', exact: true }).scrollIntoViewIfNeeded();
      await expect(dialog.getByRole('button', { name: '上左对齐', exact: true })).toBeInViewport({
        ratio: 1,
      });
    }
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(screen.width + 1);
    const dimensions = await dialog.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
    await page.screenshot({
      path: path.join(audit, screen.name),
      fullPage: true,
      animations: 'disabled',
    });
    geometry.push({ ...screen, box, ...dimensions });
    await dialog.getByRole('button', { name: '取消', exact: true }).click();
    await assertRegions(page, expected);
  }
  await page.setViewportSize({ width: 1280, height: 800 });
  const after = await download(page, 'regions-cancel-readonly.docx');
  expect((await nativeRegions(after)).state).toEqual(expected);
  await writeFile(
    path.join(audit, 'cell-dialog-geometry.json'),
    JSON.stringify(geometry, null, 2) + '\n'
  );
});
