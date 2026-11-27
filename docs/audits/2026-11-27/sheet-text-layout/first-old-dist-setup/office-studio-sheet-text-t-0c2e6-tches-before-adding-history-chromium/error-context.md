# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-sheet-text.spec.ts >> text formatting holds invalid drafts, cancels cleanly and rejects protected batches before adding history
- Location: e2e/office-studio-sheet-text.spec.ts:384:1

# Error details

```
Error: locator.click: Test ended.
Call log:
  - waiting for getByRole('button', { name: '文字排版', exact: true })

```

# Test source

```ts
  294 |       page.evaluate(() => (window as Window & { sheetTextPrint?: string }).sheetTextPrint)
  295 |     )
  296 |     .toBeTruthy();
  297 |   const printed = await page.evaluate(
  298 |     () => (window as Window & { sheetTextPrint?: string }).sheetTextPrint!
  299 |   );
  300 |   await writeFile(path.join(audit, 'text-print.html'), printed);
  301 |   const preview = await context.newPage();
  302 |   await preview.setContent(printed);
  303 |   await preview.evaluate(() => document.fonts.ready);
  304 |   const printTable = preview.locator('.studio-print-sheet').first().locator('table');
  305 |   const printedGeometry: Record<string, Awaited<ReturnType<typeof geometry>>> = {};
  306 |   for (const address of Object.keys(measured)) {
  307 |     const row = Number(address.slice(1));
  308 |     const column = address.charCodeAt(0) - 65;
  309 |     const actual = await geometry(
  310 |       printTable
  311 |         .locator('tr')
  312 |         .nth(row - 1)
  313 |         .locator('td')
  314 |         .nth(column)
  315 |     );
  316 |     printedGeometry[address] = actual;
  317 |     expect(actual.width).toBeCloseTo(measured[address].width, 1);
  318 |     expect(actual.height).toBeCloseTo(measured[address].height, 1);
  319 |     expect(actual.textWidth).toBeCloseTo(measured[address].textWidth, 1);
  320 |     expect(actual.lines).toHaveLength(measured[address].lines.length);
  321 |     for (let index = 0; index < actual.lines.length; index++) {
  322 |       expect(actual.lines[index].x).toBeCloseTo(measured[address].lines[index].x, 1);
  323 |       expect(actual.lines[index].y).toBeCloseTo(measured[address].lines[index].y, 1);
  324 |     }
  325 |   }
  326 |   await preview.screenshot({
  327 |     path: path.join(audit, 'text-print.png'),
  328 |     fullPage: true,
  329 |     animations: 'disabled',
  330 |   });
  331 |   await preview.pdf({
  332 |     path: path.join(audit, 'text-print.pdf'),
  333 |     preferCSSPageSize: true,
  334 |     printBackground: true,
  335 |   });
  336 |   await preview.close();
  337 |   await range(page, 'A1');
  338 |   await page.screenshot({
  339 |     path: path.join(audit, 'text-results-light.png'),
  340 |     fullPage: true,
  341 |     animations: 'disabled',
  342 |   });
  343 |   for (const small of [false, true]) {
  344 |     if (small) await page.setViewportSize({ width: 320, height: 720 });
  345 |     for (const theme of ['light', 'dark']) {
  346 |       if (theme === 'dark')
  347 |         await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  348 |       dialog = await open(page, 'A4');
  349 |       const bounds = await dialog.boundingBox();
  350 |       expect(bounds!.x).toBeGreaterThanOrEqual(0);
  351 |       expect(bounds!.width).toBeLessThanOrEqual(small ? 320 : 1280);
  352 |       await expect(dialog.getByRole('button', { name: '应用排版', exact: true })).toBeVisible();
  353 |       await page.screenshot({
  354 |         path: path.join(audit, `text-dialog-${theme}${small ? '-320' : ''}.png`),
  355 |         fullPage: true,
  356 |         animations: 'disabled',
  357 |       });
  358 |       await dialog.getByRole('button', { name: '取消', exact: true }).click();
  359 |       await expect(dialog).toBeHidden();
  360 |       if (theme === 'dark')
  361 |         await page.getByRole('button', { name: '切换浅色', exact: true }).click();
  362 |     }
  363 |   }
  364 |   await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  365 |   await expect(page.getByRole('button', { name: '文字排版', exact: true })).toBeDisabled();
  366 |   await expect(page.getByRole('button', { name: '自动换行', exact: true })).toBeDisabled();
  367 |   await writeFile(
  368 |     path.join(audit, 'browser-roundtrip-evidence.json'),
  369 |     JSON.stringify(
  370 |       {
  371 |         source: { file: 'text-source.xlsx', sha256: hash(source) },
  372 |         rounds,
  373 |         grid: measured,
  374 |         print: printedGeometry,
  375 |         viewport: { width: 320, height: 720 },
  376 |         readOnly: true,
  377 |       },
  378 |       null,
  379 |       2
  380 |     ) + '\n'
  381 |   );
  382 | });
  383 |
  384 | test('text formatting holds invalid drafts, cancels cleanly and rejects protected batches before adding history', async ({
  385 |   page,
  386 | }) => {
  387 |   test.setTimeout(90000);
  388 |   await mkdir(audit, { recursive: true });
  389 |   const { source } = await fixture();
  390 |   await page.goto('/#/components/office-studio');
  391 |   await importFile(page, source, 'Text-guards.xlsx');
  392 |   const formula = page.getByLabel('表格公式栏', { exact: true });
  393 |   await formula.fill('x'.repeat(32768));
> 394 |   await page.getByRole('button', { name: '文字排版', exact: true }).click();
      |                                                                 ^ Error: locator.click: Test ended.
  395 |   await expect(page.getByRole('dialog', { name: '单元格文字排版', exact: true })).toHaveCount(0);
  396 |   await expect(page.locator('.zuvi-studio-sheet')).toHaveAttribute('data-studio-input-error');
  397 |   await formula.press('Escape');
  398 |   let dialog = await open(page, 'A1');
  399 |   await dialog.getByLabel('文字缩进', { exact: true }).fill('251');
  400 |   await expect(dialog.getByRole('alert')).toHaveText('缩进须为 0 至 250 之间的整数。');
  401 |   await expect(dialog.getByRole('button', { name: '应用排版', exact: true })).toBeDisabled();
  402 |   await expect(page.locator('.zuvi-studio-sheet')).toHaveAttribute('data-studio-input-error');
  403 |   await dialog.getByRole('button', { name: '取消', exact: true }).click();
  404 |   await expect(dialog).toBeHidden();
  405 |   await expect(page.locator('.zuvi-studio-sheet')).not.toHaveAttribute('data-studio-input-error');
  406 |   await expect(page.getByRole('button', { name: '撤销表格修改', exact: true })).toBeDisabled();
  407 |   await range(page, 'B1');
  408 |   await page.getByRole('tab', { name: '数据', exact: true }).click();
  409 |   await page.getByRole('button', { name: '保护所选区域', exact: true }).click();
  410 |   await page.getByRole('tab', { name: '开始', exact: true }).click();
  411 |   dialog = await open(page, 'A1:C1');
  412 |   await choose(page, dialog, '文字水平对齐', '跨选区居中');
  413 |   await dialog.getByRole('button', { name: '应用排版', exact: true }).click();
  414 |   await expect(dialog.getByRole('alert')).toHaveText('选区包含受保护区域，整次格式应用已取消。');
  415 |   await page.screenshot({
  416 |     path: path.join(audit, 'text-protected-rejection.png'),
  417 |     fullPage: true,
  418 |     animations: 'disabled',
  419 |   });
  420 |   await dialog.getByRole('button', { name: '取消', exact: true }).click();
  421 |   await expect(dialog).toBeHidden();
  422 |   const protectedBytes = await exportFile(page);
  423 |   await writeFile(path.join(audit, 'text-protected-after-rejection.xlsx'), protectedBytes);
  424 |   const saved = new ExcelJS.Workbook();
  425 |   await saved.xlsx.load(protectedBytes);
  426 |   expect(saved.getWorksheet('Text')!.getCell('A1').alignment.horizontal).not.toBe(
  427 |     'centerContinuous'
  428 |   );
  429 |   await page.getByRole('button', { name: '撤销表格修改', exact: true }).click();
  430 |   await expect(page.getByRole('button', { name: '撤销表格修改', exact: true })).toBeDisabled();
  431 |   await page.getByRole('tab', { name: '数据', exact: true }).click();
  432 |   await expect(page.getByRole('button', { name: '取消区域保护', exact: true })).toBeDisabled();
  433 |   await page.getByRole('tab', { name: '开始', exact: true }).click();
  434 |   await page.getByRole('button', { name: '重做表格修改', exact: true }).click();
  435 |   await page.getByRole('tab', { name: '数据', exact: true }).click();
  436 |   await expect(page.getByRole('button', { name: '取消区域保护', exact: true })).toBeEnabled();
  437 |   await writeFile(
  438 |     path.join(audit, 'browser-guard-evidence.json'),
  439 |     JSON.stringify(
  440 |       {
  441 |         sourceHash: hash(source),
  442 |         outputHash: hash(protectedBytes),
  443 |         invalidDraftRejected: true,
  444 |         cancelClearedGuard: true,
  445 |         protectedBatchRejected: true,
  446 |         undoStepsForProtection: 1,
  447 |         redoRestoredProtection: true,
  448 |       },
  449 |       null,
  450 |       2
  451 |     ) + '\n'
  452 |   );
  453 | });
  454 |
```