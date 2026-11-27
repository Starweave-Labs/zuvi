import { expect, test } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import JSZip from '../docs/node_modules/jszip/lib/index.js';
test('keeps native exact row height with explicit cell padding while editing and reopening twice', async ({
  page,
  context,
}) => {
  const audit = path.resolve('docs/audits/2026-11-26/word-cell-properties');
  await mkdir(audit, { recursive: true });
  const zip = await JSZip.loadAsync(
    await readFile('docs/audits/2026-11-26/word-math-groups/math-source.docx')
  );
  const xml = await zip.file('word/document.xml')!.async('string');
  const table =
    '<w:tbl><w:tblGrid><w:gridCol w:w="6000"/></w:tblGrid><w:tr><w:trPr><w:trHeight w:val="480" w:hRule="exact"/></w:trPr><w:tc><w:tcPr><w:vAlign w:val="bottom"/><w:tcMar><w:top w:w="0" w:type="dxa"/><w:bottom w:w="100" w:type="dxa"/></w:tcMar></w:tcPr><w:p><w:r><w:t>Cell content</w:t></w:r></w:p></w:tc></w:tr></w:tbl>';
  zip.file(
    'word/document.xml',
    xml.replace(
      /<w:body>[\s\S]*?(<w:sectPr[\s\S]*?<\/w:sectPr>)<\/w:body>/,
      `<w:body>${table}$1</w:body>`
    )
  );
  const source = await zip.generateAsync({ type: 'nodebuffer' });
  await writeFile(path.join(audit, 'cell-source.docx'), source);
  await page.goto('/#/components/office-studio');
  const importFile = async (buffer: Buffer, name: string) => {
    await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
      name,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer,
    });
    await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(name);
    await expect(
      page.getByRole('textbox', { name: 'Word 文档正文', exact: true }).locator('tr').first()
    ).toHaveAttribute('data-word-row-height-rule', 'exact');
  };
  await importFile(source, 'Cell.docx');
  const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  const cell = body.locator('td').first();
  const check = async () => {
    await expect(async () => {
      await expect(cell).toBeVisible();
      const metrics = await cell.evaluate((element) => {
        if (!element.isConnected) return null;
        const wrapper = element.querySelector<HTMLElement>('[data-word-cell-content]')!;
        const table = element.closest('table')!,
          scale = table.getBoundingClientRect().width / table.offsetWidth;
        return {
          height: element.getBoundingClientRect().height / scale,
          top: getComputedStyle(wrapper).paddingTop,
          bottom: getComputedStyle(wrapper).paddingBottom,
        };
      });
      expect(metrics).not.toBeNull();
      expect(metrics!.height).toBeCloseTo(((24 + 5 + 0.75) * 4) / 3, 1);
      expect(metrics!.top).toBe('0px');
      expect(parseFloat(metrics!.bottom)).toBeCloseTo(20 / 3, 1);
    }).toPass({ timeout: 5000 });
  };
  await check();
  await cell.locator('p').click();
  await page.getByRole('tab', { name: '插入', exact: true }).click();
  await page.getByRole('button', { name: '单元格对齐与边距', exact: true }).click();
  await page.getByRole('button', { name: '下右对齐', exact: true }).click();
  await page.getByRole('textbox', { name: '单元格left内边距', exact: true }).fill('5.25');
  await page.getByRole('button', { name: '应用单元格属性', exact: true }).click();
  await check();
  for (let round = 1; round <= 2; round++) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await pending).path())!);
    await writeFile(path.join(audit, `cell-round-${round}.docx`), bytes);
    await importFile(bytes, `Cell-round-${round}.docx`);
    await check();
    await expect(cell).toHaveCSS('padding-left', '7px');
  }
  await page.evaluate(() =>
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'cell-print')
        (window as Window & { cellPrint?: string }).cellPrint = event.data.html;
    })
  );
  await page.addInitScript(() => {
    window.print = () => {
      window.parent.postMessage(
        { type: 'cell-print', html: document.documentElement.outerHTML },
        '*'
      );
      window.dispatchEvent(new Event('afterprint'));
    };
  });
  await page.getByRole('button', { name: '打印', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => (window as Window & { cellPrint?: string }).cellPrint))
    .toBeTruthy();
  const html = await page.evaluate(() => (window as Window & { cellPrint?: string }).cellPrint!);
  const preview = await context.newPage();
  await preview.setContent(html);
  await preview.evaluate(() => document.fonts.ready);
  const printed = await preview
    .locator('td')
    .first()
    .evaluate((element) => {
      const wrapper = element.querySelector<HTMLElement>('[data-word-cell-content]')!;
      return {
        height: element.getBoundingClientRect().height,
        top: getComputedStyle(wrapper).paddingTop,
        bottom: getComputedStyle(wrapper).paddingBottom,
      };
    });
  expect(printed.height).toBeCloseTo(((24 + 5 + 0.75) * 4) / 3, 1);
  expect(printed.top).toBe('0px');
  expect(parseFloat(printed.bottom)).toBeCloseTo(20 / 3, 1);
  await preview.pdf({
    path: path.join(audit, 'cell-fixed-print.pdf'),
    preferCSSPageSize: true,
    printBackground: true,
  });
  await writeFile(
    path.join(audit, 'cell-fixed-print-metrics.json'),
    JSON.stringify(printed, null, 2) + '\n'
  );
  await preview.close();
  await page.screenshot({ path: path.join(audit, 'cell-fixed-light.png'), fullPage: true });
  await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  await page.screenshot({ path: path.join(audit, 'cell-fixed-dark.png'), fullPage: true });
  await page.setViewportSize({ width: 320, height: 720 });
  await page.screenshot({ path: path.join(audit, 'cell-fixed-320.png'), fullPage: true });
});

test('moves actual text through all nine fixed-cell alignments and restores the transaction', async ({
  page,
}) => {
  const audit = path.resolve('docs/audits/2026-11-26/word-cell-properties');
  const zip = await JSZip.loadAsync(await readFile(path.join(audit, 'cell-source.docx')));
  zip.file(
    'word/document.xml',
    (await zip.file('word/document.xml')!.async('string')).replace(
      'w:val="480" w:hRule="exact"',
      'w:val="1440" w:hRule="exact"'
    )
  );
  await page.goto('/#/components/office-studio');
  await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
    name: 'Alignment.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: await zip.generateAsync({ type: 'nodebuffer' }),
  });
  await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(
    'Alignment.docx'
  );
  const cell = page
    .getByRole('textbox', { name: 'Word 文档正文', exact: true })
    .locator('td')
    .first();
  await expect(cell.locator('..')).toHaveAttribute('data-word-row-height', '72');
  await expect(cell).toBeVisible();
  const metrics = () =>
    cell.evaluate((element) => {
      const wrapper = element.querySelector<HTMLElement>('[data-word-cell-content]')!;
      const paragraph = wrapper.querySelector('p')!;
      const text = paragraph.firstChild!;
      const range = document.createRange();
      range.selectNodeContents(text);
      const r = range.getBoundingClientRect(),
        w = wrapper.getBoundingClientRect();
      const table = element.closest('table')!,
        scale = table.getBoundingClientRect().width / table.offsetWidth;
      return {
        top: (r.top - w.top) / scale,
        left: (r.left - w.left) / scale,
        height: element.getBoundingClientRect().height / scale,
        align: getComputedStyle(paragraph).textAlign,
      };
    });
  const samples: Record<string, Awaited<ReturnType<typeof metrics>>> = {};
  for (const vertical of ['上', '中', '下']) {
    for (const horizontal of ['左', '中', '右']) {
      await cell.locator('p').click();
      await page.getByRole('tab', { name: '插入', exact: true }).click();
      await page.getByRole('button', { name: '单元格对齐与边距', exact: true }).click();
      await page.getByRole('button', { name: `${vertical}${horizontal}对齐`, exact: true }).click();
      await expect(
        page.getByRole('button', { name: `${vertical}${horizontal}对齐`, exact: true })
      ).toHaveAttribute('data-variant', 'primary');
      await expect(
        page.getByLabel('九宫格对齐').locator('button[aria-pressed="false"]').first()
      ).toHaveAttribute('data-variant', 'outline');
      await page.getByRole('button', { name: '应用单元格属性', exact: true }).click();
      const sample = await metrics();
      samples[`${vertical}${horizontal}`] = sample;
      expect(sample.height).toBeCloseTo(((72 + 5 + 0.75) * 4) / 3, 1);
      expect(sample.align).toBe(
        horizontal === '左' ? 'left' : horizontal === '中' ? 'center' : 'right'
      );
    }
  }
  for (const horizontal of ['左', '中', '右']) {
    expect(samples[`中${horizontal}`].top - samples[`上${horizontal}`].top).toBeGreaterThan(20);
    expect(samples[`下${horizontal}`].top - samples[`中${horizontal}`].top).toBeGreaterThan(20);
  }
  for (const vertical of ['上', '中', '下']) {
    expect(samples[`${vertical}中`].left - samples[`${vertical}左`].left).toBeGreaterThan(50);
    expect(samples[`${vertical}右`].left - samples[`${vertical}中`].left).toBeGreaterThan(50);
  }
  await page.getByRole('tab', { name: '开始', exact: true }).click();
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  expect((await metrics()).align).toBe('center');
  await page.getByRole('button', { name: '重做', exact: true }).click();
  expect((await metrics()).align).toBe('right');
  await writeFile(
    path.join(audit, 'cell-nine-alignments.json'),
    JSON.stringify(samples, null, 2) + '\n'
  );
  await page.screenshot({
    path: path.join(audit, 'cell-nine-alignments-light.png'),
    fullPage: true,
  });
});

async function tableFile(xml: string): Promise<Buffer> {
  const zip = await JSZip.loadAsync(
    await readFile('docs/audits/2026-11-26/word-cell-properties/cell-source.docx')
  );
  const document = await zip.file('word/document.xml')!.async('string');
  zip.file(
    'word/document.xml',
    document.replace(
      /<w:body>[\s\S]*?(<w:sectPr[\s\S]*?<\/w:sectPr>)<\/w:body>/,
      `<w:body>${xml}$1</w:body>`
    )
  );
  return zip.generateAsync({ type: 'nodebuffer' });
}

test('edits table defaults and spacing without materializing direct margins, restores inheritance and reopens twice', async ({
  page,
  context,
}) => {
  const audit = path.resolve('docs/audits/2026-11-26/word-cell-properties');
  const cellXml = (text: string, direct = '') =>
    `<w:tc><w:tcPr>${direct}</w:tcPr><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:tc>`;
  const source = await tableFile(
    `<w:tbl><w:tblPr><w:tblCellSpacing w:w="60" w:type="dxa"/><w:tblCellMar><w:top w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/><w:left w:w="90" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid><w:gridCol w:w="4500"/><w:gridCol w:w="4500"/></w:tblGrid><w:tr>${cellXml('Direct', '<w:tcMar><w:top w:w="0" w:type="dxa"/><w:right w:w="165" w:type="dxa"/></w:tcMar>')}${cellXml('Inherited')}</w:tr><w:tr>${cellXml('Second row')}${cellXml('Last')}</w:tr></w:tbl>`
  );
  await writeFile(path.join(audit, 'cell-defaults-source.docx'), source);
  await page.goto('/#/components/office-studio');
  const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  const table = body.locator('table').first(),
    cells = table.locator(':scope > tbody > tr > td');
  const upload = async (bytes: Buffer, name: string) => {
    await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
      name,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: bytes,
    });
    await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(name);
    await expect(cells.first()).toContainText('Direct');
    await expect(table).toHaveAttribute('data-word-cell-spacing', '6');
  };
  await upload(source, 'Defaults.docx');
  const measure = () =>
    table.evaluate((element) => {
      const cells = element.querySelectorAll<HTMLTableCellElement>(':scope > tbody > tr > td');
      const rect = element.getBoundingClientRect(),
        scale = rect.width / (element as HTMLElement).offsetWidth;
      return {
        width: (element as HTMLElement).offsetWidth,
        gap:
          (cells[1].getBoundingClientRect().left - cells[0].getBoundingClientRect().right) / scale,
        top0: getComputedStyle(cells[0]).paddingTop,
        top1: getComputedStyle(cells[1]).paddingTop,
        left1: getComputedStyle(cells[1]).paddingLeft,
        right0: getComputedStyle(cells[0]).paddingRight,
      };
    });
  const initial = await measure();
  expect(initial.width).toBe(600);
  expect(initial.gap).toBeCloseTo(8, 1);
  expect(initial.top0).toBe('0px');
  expect(initial.top1).toBe('8px');
  const open = async () => {
    await cells.first().locator('p').click();
    await page.getByRole('tab', { name: '插入', exact: true }).click();
    await page.getByRole('button', { name: '单元格对齐与边距', exact: true }).click();
  };
  await open();
  await page.getByRole('textbox', { name: '单元格间距', exact: true }).fill('1.01');
  await page.getByRole('button', { name: '应用单元格属性', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('精度');
  expect(await measure()).toEqual(initial);
  await page.getByRole('button', { name: '取消', exact: true }).click();
  await open();
  await page.getByRole('textbox', { name: '表格默认top内边距', exact: true }).fill('20');
  await page.getByRole('button', { name: '取消', exact: true }).click();
  expect(await measure()).toEqual(initial);
  await open();
  await page.getByRole('button', { name: '中中对齐', exact: true }).click();
  await page.getByRole('textbox', { name: '表格默认top内边距', exact: true }).fill('12');
  await page.getByRole('textbox', { name: '表格默认left内边距', exact: true }).fill('10');
  await page.getByRole('textbox', { name: '单元格间距', exact: true }).fill('12');
  await page.getByRole('button', { name: '应用单元格属性', exact: true }).click();
  const changed = await measure();
  expect(changed.width).toBe(624);
  expect(changed.gap).toBeCloseTo(16, 1);
  expect(changed.top0).toBe('0px');
  expect(changed.top1).toBe('16px');
  expect(parseFloat(changed.left1)).toBeCloseTo(40 / 3, 1);
  expect(changed.right0).toBe('11px');
  await page.getByRole('tab', { name: '开始', exact: true }).click();
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  expect(await measure()).toEqual(initial);
  await page.getByRole('button', { name: '重做', exact: true }).click();
  expect(await measure()).toEqual(changed);
  for (let round = 1; round <= 2; round++) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await pending).path())!);
    await writeFile(path.join(audit, `cell-defaults-round-${round}.docx`), bytes);
    const xml = await (await JSZip.loadAsync(bytes)).file('word/document.xml')!.async('string');
    expect(xml).toMatch(/<w:tblCellSpacing[^>]*w:w="120"/);
    expect(xml.match(/<w:tcMar>/g)).toHaveLength(1);
    expect(xml).toMatch(/<w:gridCol[^>]*w:w="4680"/);
    await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
      name: `Defaults-${round}.docx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: bytes,
    });
    await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(
      `Defaults-${round}.docx`
    );
    await expect(table).toHaveAttribute('data-word-cell-spacing', '12');
    expect(await measure()).toEqual(changed);
  }
  await open();
  await page.getByRole('button', { name: '恢复表格默认边距', exact: true }).click();
  await page.getByRole('button', { name: '取消', exact: true }).click();
  expect(await measure()).toEqual(changed);
  await open();
  await page.getByRole('button', { name: '恢复表格默认边距', exact: true }).click();
  await page.getByRole('button', { name: '应用单元格属性', exact: true }).click();
  await expect(cells.first()).not.toHaveAttribute('data-word-cell-margins');
  expect((await measure()).top0).toBe('16px');
  await page.getByRole('tab', { name: '开始', exact: true }).click();
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  expect(await measure()).toEqual(changed);
  await page.getByRole('button', { name: '重做', exact: true }).click();
  await page.screenshot({ path: path.join(audit, 'cell-defaults-light.png'), fullPage: true });
  await open();
  await page.screenshot({ path: path.join(audit, 'cell-dialog-light.png'), fullPage: true });
  await page.getByRole('button', { name: '取消', exact: true }).click();
  await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  await open();
  await page.screenshot({ path: path.join(audit, 'cell-dialog-dark.png'), fullPage: true });
  await page.setViewportSize({ width: 320, height: 720 });
  const dialog = page.getByRole('dialog');
  const box = await dialog.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  await page.screenshot({ path: path.join(audit, 'cell-dialog-320.png'), fullPage: true });
  await page.getByRole('button', { name: '取消', exact: true }).click();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.evaluate(() =>
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'cell-default-print')
        (window as Window & { cellDefaultPrint?: string }).cellDefaultPrint = event.data.html;
    })
  );
  await page.addInitScript(() => {
    window.print = () => {
      window.parent.postMessage(
        { type: 'cell-default-print', html: document.documentElement.outerHTML },
        '*'
      );
      window.dispatchEvent(new Event('afterprint'));
    };
  });
  await page.getByRole('button', { name: '打印', exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() => (window as Window & { cellDefaultPrint?: string }).cellDefaultPrint)
    )
    .toBeTruthy();
  const preview = await context.newPage();
  await preview.setContent(
    await page.evaluate(() => (window as Window & { cellDefaultPrint?: string }).cellDefaultPrint!)
  );
  await preview.evaluate(() => document.fonts.ready);
  const printed = await preview
    .locator('table')
    .first()
    .evaluate((element) => ({
      width: (element as HTMLElement).offsetWidth,
      gap: parseFloat(getComputedStyle(element).borderSpacing),
      top: getComputedStyle(element.querySelector('td')!).paddingTop,
    }));
  expect(printed.width).toBe(624);
  expect(printed.gap).toBe(16);
  expect(printed.top).toBe('16px');
  await preview.pdf({
    path: path.join(audit, 'cell-defaults-print.pdf'),
    preferCSSPageSize: true,
    printBackground: true,
  });
  await preview.close();
  await writeFile(
    path.join(audit, 'cell-defaults-metrics.json'),
    JSON.stringify({ initial, changed, printed }, null, 2) + '\n'
  );
});

test('keeps nested fixed-cell alignment and margins local while preserving native layout on reopening and printing', async ({
  page,
  context,
}) => {
  const audit = path.resolve('docs/audits/2026-11-26/word-cell-properties');
  const source = await tableFile(
    '<w:tbl><w:tblGrid><w:gridCol w:w="6000"/></w:tblGrid><w:tr><w:tc><w:tcPr><w:vAlign w:val="bottom"/><w:tcMar><w:top w:w="400" w:type="dxa"/><w:bottom w:w="600" w:type="dxa"/></w:tcMar></w:tcPr><w:p><w:r><w:t>Outer content</w:t></w:r></w:p><w:tbl><w:tblGrid><w:gridCol w:w="3000"/></w:tblGrid><w:tr><w:trPr><w:trHeight w:val="1440" w:hRule="exact"/></w:trPr><w:tc><w:p><w:r><w:t>Inner content</w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:p/></w:tc></w:tr></w:tbl>'
  );
  await writeFile(path.join(audit, 'cell-nested-source.docx'), source);
  await page.goto('/#/components/office-studio');
  const upload = async (bytes: Buffer, name: string) => {
    await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
      name,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: bytes,
    });
    await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(name);
  };
  const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  const inner = body.locator('table table td').first();
  const check = async () => {
    await expect(inner).toContainText('Inner content');
    const actual = await inner.evaluate((cell) => {
      const wrapper = cell.querySelector<HTMLElement>(':scope > [data-word-cell-content]')!,
        rect = wrapper.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(wrapper.querySelector('p')!);
      const table = cell.closest('table')!,
        scale = table.getBoundingClientRect().width / table.offsetWidth;
      return {
        height: cell.getBoundingClientRect().height / scale,
        justify: getComputedStyle(wrapper).justifyContent,
        top: getComputedStyle(wrapper).paddingTop,
        bottom: getComputedStyle(wrapper).paddingBottom,
        textTop: (range.getBoundingClientRect().top - rect.top) / scale,
      };
    });
    expect(actual.height).toBeCloseTo(97, 1);
    expect(['flex-start', 'flow-start']).toContain(actual.justify);
    expect(actual.top).toBe('0px');
    expect(actual.bottom).toBe('0px');
    expect(actual.textTop).toBeLessThan(8);
    return actual;
  };
  await upload(source, 'Nested.docx');
  const initial = await check();
  for (let round = 1; round <= 2; round++) {
    await inner.locator('p').click();
    await page.getByRole('tab', { name: '插入', exact: true }).click();
    await page.getByRole('button', { name: '单元格对齐与边距', exact: true }).click();
    await page.getByRole('button', { name: '上左对齐', exact: true }).click();
    await page.getByRole('button', { name: '应用单元格属性', exact: true }).click();
    await check();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await download).path())!);
    await writeFile(path.join(audit, `cell-nested-round-${round}.docx`), bytes);
    await upload(bytes, `Nested-${round}.docx`);
    await check();
  }
  await page.evaluate(() =>
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'cell-nested-print')
        (window as Window & { nestedPrint?: string }).nestedPrint = event.data.html;
    })
  );
  await page.addInitScript(() => {
    window.print = () => {
      window.parent.postMessage(
        { type: 'cell-nested-print', html: document.documentElement.outerHTML },
        '*'
      );
      window.dispatchEvent(new Event('afterprint'));
    };
  });
  await page.getByRole('button', { name: '打印', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => (window as Window & { nestedPrint?: string }).nestedPrint))
    .toBeTruthy();
  const preview = await context.newPage();
  await preview.setContent(
    await page.evaluate(() => (window as Window & { nestedPrint?: string }).nestedPrint!)
  );
  await preview.evaluate(() => document.fonts.ready);
  const printed = await preview
    .locator('table table td')
    .first()
    .evaluate((cell) => {
      const wrapper = cell.querySelector<HTMLElement>(':scope > [data-word-cell-content]')!;
      return {
        height: cell.getBoundingClientRect().height,
        top: getComputedStyle(wrapper).paddingTop,
        bottom: getComputedStyle(wrapper).paddingBottom,
        justify: getComputedStyle(wrapper).justifyContent,
      };
    });
  expect(printed.height).toBeCloseTo(97, 1);
  expect(printed.top).toBe('0px');
  expect(printed.bottom).toBe('0px');
  expect(['flex-start', 'flow-start']).toContain(printed.justify);
  await preview.pdf({
    path: path.join(audit, 'cell-nested-print.pdf'),
    preferCSSPageSize: true,
    printBackground: true,
  });
  await preview.close();
  await page.screenshot({ path: path.join(audit, 'cell-nested-light.png'), fullPage: true });
  await writeFile(
    path.join(audit, 'cell-nested-metrics.json'),
    JSON.stringify({ initial, printed }, null, 2) + '\n'
  );
});

test('uses each native row gap with one shared column grid and preserves fixed-cell budgets through printing and reopening', async ({
  page,
  context,
}) => {
  const audit = path.resolve('docs/audits/2026-11-26/word-cell-properties');
  const row = (label: string, spacing = '') =>
    `<w:tr><w:trPr><w:trHeight w:val="1440" w:hRule="exact"/>${spacing}</w:trPr>${[0, 1].map((index) => `<w:tc><w:p><w:r><w:t>${label}${index}</w:t></w:r></w:p></w:tc>`).join('')}</w:tr>`;
  const source = await tableFile(
    `<w:tbl><w:tblPr><w:tblCellSpacing w:w="60" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:bottom w:w="100" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid><w:gridCol w:w="4500"/><w:gridCol w:w="4500"/></w:tblGrid>${row('Default')}${row('Override', '<w:tblCellSpacing w:w="120" w:type="dxa"/>')}${row('Zero', '<w:tblCellSpacing w:type="nil"/>')}</w:tbl>`
  );
  await writeFile(path.join(audit, 'cell-row-spacing-source.docx'), source);
  await page.goto('/#/components/office-studio');
  const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true }),
    table = body.locator('table').first();
  const upload = async (bytes: Buffer, name: string) => {
    await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
      name,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: bytes,
    });
    await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(name);
    await expect(table).toHaveAttribute('data-word-spacing-layout', 'mixed');
    await expect(table.locator('td').last()).toContainText('Zero1');
  };
  const measure = (element: Element) => {
    const rowElements = element.querySelectorAll(
      ':scope > tbody > tr:not([data-word-auto-page-row])'
    );
    const tableRect = element.getBoundingClientRect();
    const scale = tableRect.width / (element as HTMLElement).offsetWidth;
    const boxes = Array.from(rowElements, (row) =>
      Array.from(row.querySelectorAll(':scope > td > [data-word-cell-content]'), (cell) => {
        const rect = cell.getBoundingClientRect();
        return {
          left: (rect.left - tableRect.left) / scale,
          top: (rect.top - tableRect.top) / scale,
          right: (rect.right - tableRect.left) / scale,
          bottom: (rect.bottom - tableRect.top) / scale,
          width: rect.width / scale,
          height: rect.height / scale,
        };
      })
    );
    return {
      width: tableRect.width / scale,
      columns: Array.from(element.querySelectorAll('col'), (col) =>
        parseFloat((col as HTMLElement).style.width)
      ),
      boxes,
    };
  };
  const assertGeometry = (actual: ReturnType<typeof measure>) => {
    expect(actual.width).toBeCloseTo(600, 1);
    expect(actual.columns).toEqual([300, 300]);
    const gaps = [8, 16, 0],
      heights = [
        ((72 + 5 - 6 + 0.75) * 4) / 3,
        ((72 + 5 - 12 + 0.75) * 4) / 3,
        ((72 + 5 + 0.75) * 4) / 3,
      ];
    actual.boxes.forEach((row, index) => {
      expect(row[1].left - row[0].right).toBeCloseTo(gaps[index], 1);
      expect(row[0].left).toBeCloseTo(gaps[index], 1);
      expect(row[0].height).toBeCloseTo(heights[index], 1);
      expect(row[1].height).toBeCloseTo(heights[index], 1);
    });
    expect(actual.boxes[1][0].top - actual.boxes[0][0].bottom).toBeCloseTo(12, 1);
    expect(actual.boxes[2][0].top - actual.boxes[1][0].bottom).toBeCloseTo(8, 1);
  };
  await upload(source, 'Row spacing.docx');
  const initial = await table.evaluate(measure);
  assertGeometry(initial);
  const target = table.locator('td').nth(2);
  const textAlignment = (element: Element) => {
    const paragraph = element.querySelector('p')!;
    const rect = element.getBoundingClientRect(),
      text = paragraph.getBoundingClientRect();
    const parentTable = element.closest('table')!;
    const scale = parentTable.getBoundingClientRect().width / parentTable.offsetWidth;
    const style = getComputedStyle(element),
      paragraphStyle = getComputedStyle(paragraph);
    const expected =
      parseFloat(style.paddingBottom) +
      parseFloat(style.borderBottomWidth) +
      parseFloat(paragraphStyle.marginBottom);
    return { actual: (rect.bottom - text.bottom) / scale, expected };
  };
  const textPositions: ReturnType<typeof textAlignment>[] = [];
  const checkTextAlignment = async () => {
    const position = await target.locator('[data-word-cell-content]').evaluate(textAlignment);
    expect(Math.abs(position.actual - position.expected)).toBeLessThan(0.1);
    textPositions.push(position);
  };
  await target.locator('p').click();
  await page.getByRole('tab', { name: '插入', exact: true }).click();
  await page.getByRole('button', { name: '单元格对齐与边距', exact: true }).click();
  await page.getByRole('button', { name: '下右对齐', exact: true }).click();
  await page.getByRole('button', { name: '应用单元格属性', exact: true }).click();
  assertGeometry(await table.evaluate(measure));
  await expect(target.locator('[data-word-cell-content]')).toHaveCSS(
    'justify-content',
    /^safe (?:flex|flow)-end$/
  );
  await checkTextAlignment();
  for (let round = 1; round <= 2; round++) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await pending).path())!);
    await writeFile(path.join(audit, `cell-row-spacing-round-${round}.docx`), bytes);
    const xml = await (await JSZip.loadAsync(bytes)).file('word/document.xml')!.async('string');
    expect(xml).toMatch(/<w:gridCol[^>]*w:w="4500"/);
    expect(xml).toMatch(/<w:tblCellSpacing[^>]*w:w="120"/);
    await upload(bytes, `Row spacing-${round}.docx`);
    assertGeometry(await table.evaluate(measure));
    await checkTextAlignment();
  }
  await page.evaluate(() =>
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'cell-row-spacing-print')
        (window as Window & { spacingPrint?: string }).spacingPrint = event.data.html;
    })
  );
  await page.addInitScript(() => {
    window.print = () => {
      window.parent.postMessage(
        { type: 'cell-row-spacing-print', html: document.documentElement.outerHTML },
        '*'
      );
      window.dispatchEvent(new Event('afterprint'));
    };
  });
  await page.getByRole('button', { name: '打印', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => (window as Window & { spacingPrint?: string }).spacingPrint))
    .toBeTruthy();
  const preview = await context.newPage();
  await preview.setContent(
    await page.evaluate(() => (window as Window & { spacingPrint?: string }).spacingPrint!)
  );
  await preview.evaluate(() => document.fonts.ready);
  const printed = await preview.locator('table').first().evaluate(measure);
  assertGeometry(printed);
  const printedText = await preview
    .locator('table')
    .first()
    .locator('td')
    .nth(2)
    .locator('[data-word-cell-content]')
    .evaluate(textAlignment);
  expect(Math.abs(printedText.actual - printedText.expected)).toBeLessThan(0.1);
  await preview.pdf({
    path: path.join(audit, 'cell-row-spacing-print.pdf'),
    preferCSSPageSize: true,
    printBackground: true,
  });
  await preview.close();
  await page.screenshot({ path: path.join(audit, 'cell-row-spacing-light.png'), fullPage: true });
  await writeFile(
    path.join(audit, 'cell-row-spacing-metrics.json'),
    JSON.stringify({ initial, printed, textPositions, printedText }, null, 2) + '\n'
  );
});

test('previews column resizing without jumping between native and model grids, cancels cleanly and saves one history action', async ({
  page,
}) => {
  const audit = path.resolve('docs/audits/2026-11-26/word-cell-properties');
  const row = (label: string, spacing = '') =>
    `<w:tr><w:trPr>${spacing}</w:trPr>${[0, 1].map((index) => `<w:tc><w:p><w:r><w:t>${label}${index}</w:t></w:r></w:p></w:tc>`).join('')}</w:tr>`;
  const source = await tableFile(
    `<w:tbl><w:tblPr><w:tblCellSpacing w:w="60" w:type="dxa"/></w:tblPr><w:tblGrid><w:gridCol w:w="4500"/><w:gridCol w:w="4500"/></w:tblGrid>${row('Default')}${row('Zero', '<w:tblCellSpacing w:type="nil"/>')}</w:tbl>`
  );
  await page.goto('/#/components/office-studio');
  await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
    name: 'Column gaps.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: source,
  });
  await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(
    'Column gaps.docx'
  );
  const table = page
      .getByRole('textbox', { name: 'Word 文档正文', exact: true })
      .locator('table')
      .first(),
    target = table.locator('td').first();
  await expect(table).toHaveAttribute('data-word-spacing-layout', 'mixed');
  const width = () => table.evaluate((element) => (element as HTMLElement).offsetWidth);
  const initialColumns = await table
    .locator('td')
    .evaluateAll((cells) =>
      cells.map((cell) => cell.getAttribute('data-colwidth') ?? cell.getAttribute('colwidth'))
    );
  expect(await width()).toBe(600);
  const handle = async () => {
    await expect(target).toHaveAttribute('colwidth', /\d/);
    await expect(async () => {
      await target.scrollIntoViewIfNeeded();
      await expect(target).toBeVisible();
    }).toPass({ timeout: 5000 });
    const box = await target.boundingBox();
    const scale = await table.evaluate(
      (element) => element.getBoundingClientRect().width / (element as HTMLElement).offsetWidth
    );
    return { x: box!.x + box!.width - 2 * scale, y: box!.y + box!.height / 2, scale };
  };
  let point = await handle();
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  expect(await width()).toBe(600);
  await page.mouse.move(point.x + 35 * point.scale, point.y, { steps: 4 });
  await expect(table).toHaveAttribute('data-word-column-resize-preview', '');
  expect(await width()).toBeGreaterThan(630);
  expect(
    await table
      .locator('td')
      .evaluateAll((cells) =>
        cells.map((cell) => cell.getAttribute('data-colwidth') ?? cell.getAttribute('colwidth'))
      )
  ).toEqual(initialColumns);
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await expect(table).not.toHaveAttribute('data-word-column-resize-preview');
  expect(await width()).toBe(600);
  expect(
    await table
      .locator('td')
      .evaluateAll((cells) =>
        cells.map((cell) => cell.getAttribute('data-colwidth') ?? cell.getAttribute('colwidth'))
      )
  ).toEqual(initialColumns);
  point = await handle();
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  expect(await width()).toBe(600);
  await page.mouse.move(point.x + 40 * point.scale, point.y, { steps: 5 });
  const previewWidth = await width();
  expect(previewWidth).toBeGreaterThanOrEqual(639);
  expect(previewWidth).toBeLessThanOrEqual(641);
  await page.screenshot({ path: path.join(audit, 'cell-column-preview.png'), fullPage: true });
  await page.mouse.up();
  await expect(table).not.toHaveAttribute('data-word-column-resize-preview');
  expect(await width()).toBe(previewWidth);
  const resized = Number(
    ((await target.getAttribute('data-colwidth')) ??
      (await target.getAttribute('colwidth')))!.split(',')[0]
  );
  expect(resized).toBeGreaterThanOrEqual(327);
  expect(resized).toBeLessThanOrEqual(329);
  await page.getByRole('tab', { name: '开始', exact: true }).click();
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  expect(await width()).toBe(600);
  expect(
    await table
      .locator('td')
      .evaluateAll((cells) =>
        cells.map((cell) => cell.getAttribute('data-colwidth') ?? cell.getAttribute('colwidth'))
      )
  ).toEqual(initialColumns);
  await page.getByRole('button', { name: '重做', exact: true }).click();
  expect(await width()).toBe(previewWidth);
  let expectedGrid = Math.round((resized + 12) * 15);
  for (let round = 1; round <= 2; round++) {
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await download).path())!);
    await writeFile(path.join(audit, `cell-column-round-${round}.docx`), bytes);
    const xml = await (await JSZip.loadAsync(bytes)).file('word/document.xml')!.async('string');
    const grids = Array.from(xml.matchAll(/<w:gridCol[^>]*w:w="(\d+)"/g), (match) =>
      Number(match[1])
    );
    expect(grids).toEqual([expectedGrid, 4500]);
    await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
      name: `Columns-${round}.docx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: bytes,
    });
    await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(
      `Columns-${round}.docx`
    );
    await expect(table).toHaveAttribute('data-word-spacing-layout', 'mixed');
    expect(
      Number(
        ((await target.getAttribute('data-colwidth')) ??
          (await target.getAttribute('colwidth')))!.split(',')[0]
      )
    ).toBeCloseTo(expectedGrid / 15 - 12, 1);
    expectedGrid = grids[0];
  }
  await writeFile(
    path.join(audit, 'cell-column-metrics.json'),
    JSON.stringify({ initialColumns, previewWidth, resized, expectedGrid }, null, 2) + '\n'
  );
});

test('aligns actual short content within a taller automatic row with mixed gaps and reproduces it in the native print document', async ({
  page,
  context,
}) => {
  const audit = path.resolve('docs/audits/2026-11-26/word-cell-properties');
  const long = Array.from(
    { length: 8 },
    (_, index) => `<w:r><w:t>Long line ${index}</w:t>${index < 7 ? '<w:br/>' : ''}</w:r>`
  ).join('');
  const source = await tableFile(
    `<w:tbl><w:tblPr><w:tblCellSpacing w:w="60" w:type="dxa"/></w:tblPr><w:tblGrid><w:gridCol w:w="4500"/><w:gridCol w:w="4500"/></w:tblGrid><w:tr><w:tc><w:p>${long}</w:p></w:tc><w:tc><w:p><w:r><w:t>Short</w:t></w:r></w:p></w:tc></w:tr><w:tr><w:trPr><w:tblCellSpacing w:type="nil"/></w:trPr><w:tc><w:p><w:r><w:t>Zero</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>End</w:t></w:r></w:p></w:tc></w:tr></w:tbl>`
  );
  await writeFile(path.join(audit, 'cell-auto-source.docx'), source);
  await page.goto('/#/components/office-studio');
  await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
    name: 'Auto gaps.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: source,
  });
  await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(
    'Auto gaps.docx'
  );
  const table = page
      .getByRole('textbox', { name: 'Word 文档正文', exact: true })
      .locator('table')
      .first(),
    target = table.locator('td').nth(1);
  await expect(table).toHaveAttribute('data-word-spacing-layout', 'mixed');
  const measure = (element: Element) => {
    const cells = element.querySelectorAll<HTMLElement>(':scope > tbody > tr > td'),
      first = cells[0].querySelector<HTMLElement>(':scope > [data-word-cell-content]')!,
      short = cells[1].querySelector<HTMLElement>(':scope > [data-word-cell-content]')!;
    const range = document.createRange();
    range.selectNodeContents(short.querySelector('p')!);
    const scale = element.getBoundingClientRect().width / (element as HTMLElement).offsetWidth;
    return {
      longHeight: first.getBoundingClientRect().height / scale,
      shortHeight: short.getBoundingClientRect().height / scale,
      top: (range.getBoundingClientRect().top - short.getBoundingClientRect().top) / scale,
      minHeight: getComputedStyle(short).minHeight,
    };
  };
  await expect
    .poll(async () => parseFloat((await table.evaluate(measure)).minHeight))
    .toBeGreaterThan(100);
  const positions: Record<string, ReturnType<typeof measure>> = {};
  for (const [label, key] of [
    ['上左对齐', 'top'],
    ['中左对齐', 'center'],
    ['下左对齐', 'bottom'],
  ]) {
    await target.locator('p').click();
    await page.getByRole('tab', { name: '插入', exact: true }).click();
    await page.getByRole('button', { name: '单元格对齐与边距', exact: true }).click();
    await page.getByRole('button', { name: label, exact: true }).click();
    await page.getByRole('button', { name: '应用单元格属性', exact: true }).click();
    await expect
      .poll(async () =>
        Math.abs(
          (await table.evaluate(measure)).longHeight - (await table.evaluate(measure)).shortHeight
        )
      )
      .toBeLessThan(0.1);
    positions[key] = await table.evaluate(measure);
  }
  expect(positions.center.top - positions.top.top).toBeGreaterThan(50);
  expect(positions.bottom.top - positions.center.top).toBeGreaterThan(50);
  for (let round = 1; round <= 2; round++) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await pending).path())!);
    await writeFile(path.join(audit, `cell-auto-round-${round}.docx`), bytes);
    await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
      name: `Auto-${round}.docx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: bytes,
    });
    await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(
      `Auto-${round}.docx`
    );
    await expect
      .poll(async () => (await table.evaluate(measure)).top)
      .toBeGreaterThan(positions.center.top + 50);
  }
  await page.evaluate(() =>
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'cell-auto-print')
        (window as Window & { autoPrint?: string }).autoPrint = event.data.html;
    })
  );
  await page.addInitScript(() => {
    window.print = () => {
      window.parent.postMessage(
        { type: 'cell-auto-print', html: document.documentElement.outerHTML },
        '*'
      );
      window.dispatchEvent(new Event('afterprint'));
    };
  });
  await page.getByRole('button', { name: '打印', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => (window as Window & { autoPrint?: string }).autoPrint))
    .toBeTruthy();
  const preview = await context.newPage();
  await preview.setContent(
    await page.evaluate(() => (window as Window & { autoPrint?: string }).autoPrint!)
  );
  await preview.evaluate(() => document.fonts.ready);
  const printed = await preview.locator('table').first().evaluate(measure);
  expect(Math.abs(printed.longHeight - printed.shortHeight)).toBeLessThan(0.1);
  expect(printed.top).toBeGreaterThan(100);
  await preview.pdf({
    path: path.join(audit, 'cell-auto-print.pdf'),
    preferCSSPageSize: true,
    printBackground: true,
  });
  await preview.close();
  await page.screenshot({ path: path.join(audit, 'cell-auto-light.png'), fullPage: true });
  await writeFile(
    path.join(audit, 'cell-auto-metrics.json'),
    JSON.stringify({ positions, printed }, null, 2) + '\n'
  );
});
