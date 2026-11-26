# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-word-rows.spec.ts >> multi-cell row fragments keep independent text and aligned page gaps through native reopen
- Location: e2e/office-studio-word-rows.spec.ts:1330:1

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  getByRole('textbox', { name: 'Word 文档正文', exact: true })
Expected: "false"
Received: ""
Timeout:  5000ms

Call log:
  - Expect "toHaveAttribute" getByRole('textbox', { name: 'Word 文档正文', exact: true }) with timeout 5000ms
  - waiting for getByRole('textbox', { name: 'Word 文档正文', exact: true })
    14 × locator resolved to <div tabindex="0" role="textbox" translate="no" spellcheck="false" aria-multiline="true" aria-readonly="false" contenteditable="true" aria-label="Word 文档正文" class="tiptap ProseMirror">…</div>
       - unexpected value "null"

```

```yaml
- textbox "Word 文档正文":
  - table
```

# Test source

```ts
  1300 |   const scale = await body.evaluate(
  1301 |     (element) => element.getBoundingClientRect().width / (element as HTMLElement).offsetWidth
  1302 |   );
  1303 |   await page.mouse.move(right.x + right.width / 2, rect.y + rect.height - 1);
  1304 |   await page.mouse.down();
  1305 |   await page.mouse.move(right.x + right.width / 2, rect.y + rect.height - 1 + 32 * scale, {
  1306 |     steps: 5,
  1307 |   });
  1308 |   await page.mouse.up();
  1309 |   await expect(upper).toHaveAttribute('data-word-row-height', '48');
  1310 |   await expect(lower).toHaveAttribute('data-word-row-height', '36');
  1311 |   await expect(merged).toHaveAttribute('data-word-fixed-cell-height', '84');
  1312 |   await page.getByRole('tab', { name: '开始', exact: true }).click();
  1313 |   await page.getByRole('button', { name: '撤销', exact: true }).click();
  1314 |   await expect(merged).toHaveAttribute('data-word-fixed-cell-height', '60');
  1315 |   await page.getByRole('button', { name: '重做', exact: true }).click();
  1316 |   await expect(merged).toHaveAttribute('data-word-fixed-cell-height', '84');
  1317 |   for (let pass = 1; pass <= 2; pass++) {
  1318 |     const pending = page.waitForEvent('download');
  1319 |     await page.getByRole('button', { name: '导出文件', exact: true }).click();
  1320 |     const bytes = await readFile((await (await pending).path())!);
  1321 |     await writeFile(path.join(directory, `merged-drag-roundtrip-${pass}.docx`), bytes);
  1322 |     await load(bytes, `Merged-drag-reopened-${pass}.docx`);
  1323 |     await expect(merged).toHaveAttribute('data-word-fixed-cell-height', '84');
  1324 |     await expect(upper).toHaveAttribute('data-word-row-height', '48');
  1325 |     await expect(lower).toHaveAttribute('data-word-row-height', '36');
  1326 |     await expect(body).toContainText('Lower row');
  1327 |   }
  1328 | });
  1329 | 
  1330 | test('multi-cell row fragments keep independent text and aligned page gaps through native reopen', async ({
  1331 |   page,
  1332 |   context,
  1333 | }) => {
  1334 |   const directory = path.resolve('docs/audits/2026-11-26/word-cell-fragments');
  1335 |   await mkdir(directory, { recursive: true });
  1336 |   const paragraph = (name: string, count: number, size: number) =>
  1337 |     new Paragraph({
  1338 |       spacing: { before: 0, after: 0, line: 240 },
  1339 |       children: Array.from(
  1340 |         { length: count },
  1341 |         (_, i) =>
  1342 |           new TextRun({
  1343 |             text: `Cell ${name} ${i + 1}`,
  1344 |             break: i ? 1 : 0,
  1345 |             size,
  1346 |             font: 'Arial',
  1347 |             position: name === 'A' && i === 0 ? 24 : undefined,
  1348 |           })
  1349 |       ),
  1350 |     });
  1351 |   const source = Buffer.from(
  1352 |     await Packer.toArrayBuffer(
  1353 |       new Document({
  1354 |         sections: [
  1355 |           {
  1356 |             children: [
  1357 |               new Table({
  1358 |                 columnWidths: [4500, 4500],
  1359 |                 rows: [
  1360 |                   new TableRow({
  1361 |                     cantSplit: false,
  1362 |                     children: [
  1363 |                       new TableCell({ children: [paragraph('A', 80, 24)] }),
  1364 |                       new TableCell({ children: [paragraph('B', 50, 28)] }),
  1365 |                     ],
  1366 |                   }),
  1367 |                 ],
  1368 |               }),
  1369 |             ],
  1370 |           },
  1371 |         ],
  1372 |       })
  1373 |     )
  1374 |   );
  1375 |   await writeFile(path.join(directory, 'multi-cell-source.docx'), source);
  1376 |   await page.addInitScript(() => {
  1377 |     window.print = () => {
  1378 |       window.parent.postMessage(
  1379 |         { type: 'multi-cell-print', html: document.documentElement.outerHTML },
  1380 |         '*'
  1381 |       );
  1382 |       window.dispatchEvent(new Event('afterprint'));
  1383 |     };
  1384 |   });
  1385 |   await page.goto('/#/components/office-studio');
  1386 |   const importFile = (name: string, buffer: Buffer) =>
  1387 |     page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
  1388 |       name,
  1389 |       mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  1390 |       buffer,
  1391 |     });
  1392 |   await importFile('Multi-cell.docx', source);
  1393 |   const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  1394 |   await expect(body).toContainText('Cell A 80');
  1395 |   await expect(body).toContainText('Cell B 50');
  1396 |   const enablePagination = async () => {
  1397 |     await page.getByRole('tab', { name: '视图', exact: true }).click();
  1398 |     const toggle = page.getByRole('checkbox', { name: '分页布局', exact: true });
  1399 |     if (!(await toggle.isChecked())) await toggle.click();
> 1400 |     await expect(body).toHaveAttribute('data-word-pagination-overflow', 'false');
       |                        ^ Error: expect(locator).toHaveAttribute(expected) failed
  1401 |     await expect(body.locator('td').nth(0).locator('[data-word-cell-page-gap]')).not.toHaveCount(0);
  1402 |     await expect(body.locator('td').nth(1).locator('[data-word-cell-page-gap]')).not.toHaveCount(0);
  1403 |   };
  1404 |   await enablePagination();
  1405 |   const naturalHeight = Number(
  1406 |     await body.locator('tr').getAttribute('data-word-natural-row-height')
  1407 |   );
  1408 |   expect(naturalHeight).toBeGreaterThan(0);
  1409 |   expect((await body.locator('tr').boundingBox())!.height).toBeGreaterThan(naturalHeight);
  1410 |   const gaps = await body.evaluate((element) => {
  1411 |     const scale = element.getBoundingClientRect().width / (element as HTMLElement).offsetWidth;
  1412 |     return Array.from(element.querySelectorAll('td')).map((cell) => {
  1413 |       const gap = cell.querySelector('[data-word-cell-page-gap]')!;
  1414 |       const rect = gap.getBoundingClientRect();
  1415 |       return {
  1416 |         top: rect.top,
  1417 |         end:
  1418 |           rect.top + parseFloat(getComputedStyle(gap).getPropertyValue('--word-gap-start')) * scale,
  1419 |       };
  1420 |     });
  1421 |   });
  1422 |   expect(Math.abs(gaps[0].end - gaps[1].end)).toBeLessThan(2);
  1423 |   const row = body.locator('tr');
  1424 |   await row.evaluate((element) => element.scrollIntoView({ block: 'end' }));
  1425 |   const boundary = (await row.boundingBox())!;
  1426 |   const dragScale = await body.evaluate(
  1427 |     (element) => element.getBoundingClientRect().width / (element as HTMLElement).offsetWidth
  1428 |   );
  1429 |   const pointerStart = Math.round(boundary.y + boundary.height - 1);
  1430 |   const pointerEnd = pointerStart + Math.round(16 * dragScale);
  1431 |   await page.mouse.move(boundary.x + 20, pointerStart);
  1432 |   await page.mouse.down();
  1433 |   await page.mouse.move(boundary.x + 20, pointerEnd, { steps: 4 });
  1434 |   const guide = page.locator('[data-word-row-resize-guide]');
  1435 |   await expect(guide).toBeVisible();
  1436 |   expect(parseFloat((await guide.textContent())!)).toBe(
  1437 |     Math.round((naturalHeight * 0.75 + ((pointerEnd - pointerStart) / dragScale) * 0.75) * 2) / 2
  1438 |   );
  1439 |   await page.keyboard.press('Escape');
  1440 |   await page.mouse.up();
  1441 |   await expect(guide).toHaveCount(0);
  1442 |   await expect(row).not.toHaveAttribute('data-word-row-height');
  1443 |   const target = body.locator('td').nth(1).locator('p').first();
  1444 |   await target.evaluate((element) => {
  1445 |     (element.closest('[contenteditable]') as HTMLElement).focus();
  1446 |     const range = document.createRange();
  1447 |     range.selectNodeContents(element);
  1448 |     range.collapse(false);
  1449 |     window.getSelection()!.removeAllRanges();
  1450 |     window.getSelection()!.addRange(range);
  1451 |     document.dispatchEvent(new Event('selectionchange'));
  1452 |   });
  1453 |   await expect
  1454 |     .poll(() =>
  1455 |       body.evaluate((element) => {
  1456 |         const editor = (
  1457 |           element as HTMLElement & { editor: { state: { selection: { empty: boolean } } } }
  1458 |         ).editor;
  1459 |         return editor.state.selection.empty;
  1460 |       })
  1461 |     )
  1462 |     .toBe(true);
  1463 |   await body.pressSequentially(' edited');
  1464 |   await expect(target).toContainText('Cell B 50 edited');
  1465 |   await expect(body).toContainText('Cell A 80');
  1466 |   await page.getByRole('tab', { name: '开始', exact: true }).click();
  1467 |   await page.getByRole('button', { name: '撤销', exact: true }).click();
  1468 |   await expect(target).not.toContainText(' edited');
  1469 |   await expect(body).toContainText('Cell B 50');
  1470 |   await page.getByRole('button', { name: '重做', exact: true }).click();
  1471 |   await expect(target).toContainText('Cell B 50 edited');
  1472 |   await body.locator('[data-word-cell-page-gap]').first().scrollIntoViewIfNeeded();
  1473 |   await page.screenshot({ path: path.join(directory, 'multi-cell-light.png'), fullPage: true });
  1474 |   await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  1475 |   await page.setViewportSize({ width: 320, height: 720 });
  1476 |   await body.locator('[data-word-cell-page-gap]').first().scrollIntoViewIfNeeded();
  1477 |   await page.screenshot({ path: path.join(directory, 'multi-cell-dark-320.png'), fullPage: true });
  1478 |   await page.setViewportSize({ width: 1280, height: 900 });
  1479 |   await body.locator('[data-word-cell-page-gap]').first().scrollIntoViewIfNeeded();
  1480 |   await page.screenshot({ path: path.join(directory, 'multi-cell-dark.png'), fullPage: true });
  1481 |   await page.getByRole('button', { name: '切换浅色', exact: true }).click();
  1482 |   await page.setViewportSize({ width: 320, height: 720 });
  1483 |   await body.locator('[data-word-cell-page-gap]').first().scrollIntoViewIfNeeded();
  1484 |   await page.screenshot({ path: path.join(directory, 'multi-cell-light-320.png'), fullPage: true });
  1485 |   expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(321);
  1486 |   await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  1487 |   for (let pass = 1; pass <= 2; pass++) {
  1488 |     const download = page.waitForEvent('download');
  1489 |     await page.getByRole('button', { name: '导出文件', exact: true }).click();
  1490 |     const bytes = await readFile((await (await download).path())!);
  1491 |     await writeFile(path.join(directory, `multi-cell-roundtrip-${pass}.docx`), bytes);
  1492 |     const xml = await (await JSZip.loadAsync(bytes)).file('word/document.xml')!.async('string');
  1493 |     expect(xml).toContain('Cell A 80');
  1494 |     expect(xml).toContain('<w:position w:val="12pt"');
  1495 |     expect(xml).toContain('Cell B 50 edited');
  1496 |     expect(xml).not.toContain('data-word-cell-page-gap');
  1497 |     expect(xml).not.toContain('data-word-natural-row-height');
  1498 |     await importFile(`Multi-cell-${pass}.docx`, bytes);
  1499 |     await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(
  1500 |       `Multi-cell-${pass}.docx`
```