# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-word-cell-properties.spec.ts >> uses each native row gap with one shared column grid and preserves fixed-cell budgets through printing and reopening
- Location: e2e/office-studio-word-cell-properties.spec.ts:536:1

# Error details

```
Error: expect(locator).toHaveCSS(expected) failed

Locator:  getByRole('textbox', { name: 'Word 文档正文', exact: true }).locator('table').first().locator('td').nth(2).locator('[data-word-cell-content]')
Expected: "safe flex-end"
Received: "safe flow-end"
Timeout:  5000ms

Call log:
  - Expect "toHaveCSS" getByRole('textbox', { name: 'Word 文档正文', exact: true }).locator('table').first().locator('td').nth(2).locator('[data-word-cell-content]') with timeout 5000ms
  - waiting for getByRole('textbox', { name: 'Word 文档正文', exact: true }).locator('table').first().locator('td').nth(2).locator('[data-word-cell-content]')
    14 × locator resolved to <div data-word-cell-content="">…</div>
       - unexpected value "safe flow-end"

```

```yaml
- paragraph: Override0
```

# Test source

```ts
  517 |       };
  518 |     });
  519 |   expect(printed.height).toBeCloseTo(97, 1);
  520 |   expect(printed.top).toBe('0px');
  521 |   expect(printed.bottom).toBe('0px');
  522 |   expect(['flex-start', 'flow-start']).toContain(printed.justify);
  523 |   await preview.pdf({
  524 |     path: path.join(audit, 'cell-nested-print.pdf'),
  525 |     preferCSSPageSize: true,
  526 |     printBackground: true,
  527 |   });
  528 |   await preview.close();
  529 |   await page.screenshot({ path: path.join(audit, 'cell-nested-light.png'), fullPage: true });
  530 |   await writeFile(
  531 |     path.join(audit, 'cell-nested-metrics.json'),
  532 |     JSON.stringify({ initial, printed }, null, 2) + '\n'
  533 |   );
  534 | });
  535 | 
  536 | test('uses each native row gap with one shared column grid and preserves fixed-cell budgets through printing and reopening', async ({
  537 |   page,
  538 |   context,
  539 | }) => {
  540 |   const audit = path.resolve('docs/audits/2026-11-26/word-cell-properties');
  541 |   const row = (label: string, spacing = '') =>
  542 |     `<w:tr><w:trPr><w:trHeight w:val="1440" w:hRule="exact"/>${spacing}</w:trPr>${[0, 1].map((index) => `<w:tc><w:p><w:r><w:t>${label}${index}</w:t></w:r></w:p></w:tc>`).join('')}</w:tr>`;
  543 |   const source = await tableFile(
  544 |     `<w:tbl><w:tblPr><w:tblCellSpacing w:w="60" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:bottom w:w="100" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid><w:gridCol w:w="4500"/><w:gridCol w:w="4500"/></w:tblGrid>${row('Default')}${row('Override', '<w:tblCellSpacing w:w="120" w:type="dxa"/>')}${row('Zero', '<w:tblCellSpacing w:type="nil"/>')}</w:tbl>`
  545 |   );
  546 |   await writeFile(path.join(audit, 'cell-row-spacing-source.docx'), source);
  547 |   await page.goto('/#/components/office-studio');
  548 |   const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true }),
  549 |     table = body.locator('table').first();
  550 |   const upload = async (bytes: Buffer, name: string) => {
  551 |     await page
  552 |       .getByLabel('导入文档文件', { exact: true })
  553 |       .setInputFiles({
  554 |         name,
  555 |         mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  556 |         buffer: bytes,
  557 |       });
  558 |     await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(name);
  559 |     await expect(table).toHaveAttribute('data-word-spacing-layout', 'mixed');
  560 |     await expect(table.locator('td').last()).toContainText('Zero1');
  561 |   };
  562 |   const measure = (element: Element) => {
  563 |     const rowElements = element.querySelectorAll(
  564 |       ':scope > tbody > tr:not([data-word-auto-page-row])'
  565 |     );
  566 |     const tableRect = element.getBoundingClientRect();
  567 |     const scale = tableRect.width / (element as HTMLElement).offsetWidth;
  568 |     const boxes = Array.from(rowElements, (row) =>
  569 |       Array.from(row.querySelectorAll(':scope > td > [data-word-cell-content]'), (cell) => {
  570 |         const rect = cell.getBoundingClientRect();
  571 |         return {
  572 |           left: (rect.left - tableRect.left) / scale,
  573 |           top: (rect.top - tableRect.top) / scale,
  574 |           right: (rect.right - tableRect.left) / scale,
  575 |           bottom: (rect.bottom - tableRect.top) / scale,
  576 |           width: rect.width / scale,
  577 |           height: rect.height / scale,
  578 |         };
  579 |       })
  580 |     );
  581 |     return {
  582 |       width: tableRect.width / scale,
  583 |       columns: Array.from(element.querySelectorAll('col'), (col) =>
  584 |         parseFloat((col as HTMLElement).style.width)
  585 |       ),
  586 |       boxes,
  587 |     };
  588 |   };
  589 |   const assertGeometry = (actual: ReturnType<typeof measure>) => {
  590 |     expect(actual.width).toBeCloseTo(600, 1);
  591 |     expect(actual.columns).toEqual([300, 300]);
  592 |     const gaps = [8, 16, 0],
  593 |       heights = [
  594 |         ((72 + 5 - 6 + 0.75) * 4) / 3,
  595 |         ((72 + 5 - 12 + 0.75) * 4) / 3,
  596 |         ((72 + 5 + 0.75) * 4) / 3,
  597 |       ];
  598 |     actual.boxes.forEach((row, index) => {
  599 |       expect(row[1].left - row[0].right).toBeCloseTo(gaps[index], 1);
  600 |       expect(row[0].left).toBeCloseTo(gaps[index], 1);
  601 |       expect(row[0].height).toBeCloseTo(heights[index], 1);
  602 |       expect(row[1].height).toBeCloseTo(heights[index], 1);
  603 |     });
  604 |     expect(actual.boxes[1][0].top - actual.boxes[0][0].bottom).toBeCloseTo(12, 1);
  605 |     expect(actual.boxes[2][0].top - actual.boxes[1][0].bottom).toBeCloseTo(8, 1);
  606 |   };
  607 |   await upload(source, 'Row spacing.docx');
  608 |   const initial = await table.evaluate(measure);
  609 |   assertGeometry(initial);
  610 |   const target = table.locator('td').nth(2);
  611 |   await target.locator('p').click();
  612 |   await page.getByRole('tab', { name: '插入', exact: true }).click();
  613 |   await page.getByRole('button', { name: '单元格对齐与边距', exact: true }).click();
  614 |   await page.getByRole('button', { name: '下右对齐', exact: true }).click();
  615 |   await page.getByRole('button', { name: '应用单元格属性', exact: true }).click();
  616 |   assertGeometry(await table.evaluate(measure));
> 617 |   await expect(target.locator('[data-word-cell-content]')).toHaveCSS(
      |                                                            ^ Error: expect(locator).toHaveCSS(expected) failed
  618 |     'justify-content',
  619 |     'safe flex-end'
  620 |   );
  621 |   for (let round = 1; round <= 2; round++) {
  622 |     const pending = page.waitForEvent('download');
  623 |     await page.getByRole('button', { name: '导出文件', exact: true }).click();
  624 |     const bytes = await readFile((await (await pending).path())!);
  625 |     await writeFile(path.join(audit, `cell-row-spacing-round-${round}.docx`), bytes);
  626 |     const xml = await (await JSZip.loadAsync(bytes)).file('word/document.xml')!.async('string');
  627 |     expect(xml).toMatch(/<w:gridCol[^>]*w:w="4500"/);
  628 |     expect(xml).toMatch(/<w:tblCellSpacing[^>]*w:w="120"/);
  629 |     await upload(bytes, `Row spacing-${round}.docx`);
  630 |     assertGeometry(await table.evaluate(measure));
  631 |   }
  632 |   await page.evaluate(() =>
  633 |     window.addEventListener('message', (event) => {
  634 |       if (event.data?.type === 'cell-row-spacing-print')
  635 |         (window as Window & { spacingPrint?: string }).spacingPrint = event.data.html;
  636 |     })
  637 |   );
  638 |   await page.addInitScript(() => {
  639 |     window.print = () => {
  640 |       window.parent.postMessage(
  641 |         { type: 'cell-row-spacing-print', html: document.documentElement.outerHTML },
  642 |         '*'
  643 |       );
  644 |       window.dispatchEvent(new Event('afterprint'));
  645 |     };
  646 |   });
  647 |   await page.getByRole('button', { name: '打印', exact: true }).click();
  648 |   await expect
  649 |     .poll(() => page.evaluate(() => (window as Window & { spacingPrint?: string }).spacingPrint))
  650 |     .toBeTruthy();
  651 |   const preview = await context.newPage();
  652 |   await preview.setContent(
  653 |     await page.evaluate(() => (window as Window & { spacingPrint?: string }).spacingPrint!)
  654 |   );
  655 |   await preview.evaluate(() => document.fonts.ready);
  656 |   const printed = await preview.locator('table').first().evaluate(measure);
  657 |   assertGeometry(printed);
  658 |   await preview.pdf({
  659 |     path: path.join(audit, 'cell-row-spacing-print.pdf'),
  660 |     preferCSSPageSize: true,
  661 |     printBackground: true,
  662 |   });
  663 |   await preview.close();
  664 |   await page.screenshot({ path: path.join(audit, 'cell-row-spacing-light.png'), fullPage: true });
  665 |   await writeFile(
  666 |     path.join(audit, 'cell-row-spacing-metrics.json'),
  667 |     JSON.stringify({ initial, printed }, null, 2) + '\n'
  668 |   );
  669 | });
  670 | 
  671 | test('previews column resizing without jumping between native and model grids, cancels cleanly and saves one history action', async ({
  672 |   page,
  673 | }) => {
  674 |   const audit = path.resolve('docs/audits/2026-11-26/word-cell-properties');
  675 |   const row = (label: string, spacing = '') =>
  676 |     `<w:tr><w:trPr>${spacing}</w:trPr>${[0, 1].map((index) => `<w:tc><w:p><w:r><w:t>${label}${index}</w:t></w:r></w:p></w:tc>`).join('')}</w:tr>`;
  677 |   const source = await tableFile(
  678 |     `<w:tbl><w:tblPr><w:tblCellSpacing w:w="60" w:type="dxa"/></w:tblPr><w:tblGrid><w:gridCol w:w="4500"/><w:gridCol w:w="4500"/></w:tblGrid>${row('Default')}${row('Zero', '<w:tblCellSpacing w:type="nil"/>')}</w:tbl>`
  679 |   );
  680 |   await page.goto('/#/components/office-studio');
  681 |   await page
  682 |     .getByLabel('导入文档文件', { exact: true })
  683 |     .setInputFiles({
  684 |       name: 'Column gaps.docx',
  685 |       mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  686 |       buffer: source,
  687 |     });
  688 |   await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(
  689 |     'Column gaps.docx'
  690 |   );
  691 |   const table = page
  692 |       .getByRole('textbox', { name: 'Word 文档正文', exact: true })
  693 |       .locator('table')
  694 |       .first(),
  695 |     target = table.locator('td').first();
  696 |   await expect(table).toHaveAttribute('data-word-spacing-layout', 'mixed');
  697 |   const width = () => table.evaluate((element) => (element as HTMLElement).offsetWidth);
  698 |   const initialColumns = await table
  699 |     .locator('td')
  700 |     .evaluateAll((cells) =>
  701 |       cells.map((cell) => cell.getAttribute('data-colwidth') ?? cell.getAttribute('colwidth'))
  702 |     );
  703 |   expect(await width()).toBe(600);
  704 |   const handle = async () => {
  705 |     await expect(target).toHaveAttribute('colwidth', /\d/);
  706 |     await expect(async () => {
  707 |       await target.scrollIntoViewIfNeeded();
  708 |       await expect(target).toBeVisible();
  709 |     }).toPass({ timeout: 5000 });
  710 |     const box = await target.boundingBox();
  711 |     const scale = await table.evaluate(
  712 |       (element) => element.getBoundingClientRect().width / (element as HTMLElement).offsetWidth
  713 |     );
  714 |     return { x: box!.x + box!.width - 2 * scale, y: box!.y + box!.height / 2, scale };
  715 |   };
  716 |   let point = await handle();
  717 |   await page.mouse.move(point.x, point.y);
```