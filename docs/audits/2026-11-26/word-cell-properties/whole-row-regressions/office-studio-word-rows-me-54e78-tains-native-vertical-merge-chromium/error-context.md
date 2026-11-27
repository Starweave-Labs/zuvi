# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-word-rows.spec.ts >> merged row resizing updates combined cell height and retains native vertical merge
- Location: e2e/office-studio-word-rows.spec.ts:1250:1

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  getByRole('textbox', { name: 'Word 文档正文', exact: true }).locator('tr').first()
Expected: "48"
Received: "49"
Timeout:  5000ms

Call log:
  - Expect "toHaveAttribute" getByRole('textbox', { name: 'Word 文档正文', exact: true }).locator('tr').first() with timeout 5000ms
  - waiting for getByRole('textbox', { name: 'Word 文档正文', exact: true }).locator('tr').first()
    14 × locator resolved to <tr data-word-row-height="49" data-word-row-height-rule="exact" data-word-rendered-row-height="49.75">…</tr>
       - unexpected value "49"

```

```yaml
- row "Merged drag Upper row":
  - cell "Merged drag"
  - cell "Upper row"
```

# Test source

```ts
  1209 |   await row.scrollIntoViewIfNeeded();
  1210 |   const scale = await body.evaluate(
  1211 |     (element) => element.getBoundingClientRect().width / (element as HTMLElement).offsetWidth
  1212 |   );
  1213 |   expect(scale).toBeLessThan(1);
  1214 |   point = await boundary();
  1215 |   await page.mouse.move(point.x, point.y);
  1216 |   await page.mouse.down();
  1217 |   await page.mouse.move(point.x, point.y + 16 * scale, { steps: 5 });
  1218 |   await expect(page.locator('[data-word-row-resize-guide]')).toBeVisible();
  1219 |   await page.screenshot({
  1220 |     path: path.join(directory, 'drag-preview-light-320.png'),
  1221 |     fullPage: true,
  1222 |   });
  1223 |   await page.mouse.up();
  1224 |   await expect(row).toHaveAttribute('data-word-row-height', '60');
  1225 |   await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  1226 |   await row.scrollIntoViewIfNeeded();
  1227 |   point = await boundary();
  1228 |   await page.mouse.move(point.x, point.y);
  1229 |   await page.mouse.down();
  1230 |   await page.mouse.move(point.x, point.y + 12 * scale, { steps: 4 });
  1231 |   await expect(page.locator('[data-word-row-resize-guide]')).toBeVisible();
  1232 |   await page.screenshot({
  1233 |     path: path.join(directory, 'drag-preview-dark-320.png'),
  1234 |     fullPage: true,
  1235 |   });
  1236 |   await page.keyboard.press('Escape');
  1237 |   await page.mouse.up();
  1238 |   await expect(row).toHaveAttribute('data-word-row-height', '60');
  1239 |   await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  1240 |   await row.scrollIntoViewIfNeeded();
  1241 |   point = await boundary();
  1242 |   await page.mouse.move(point.x, point.y);
  1243 |   await page.mouse.down();
  1244 |   await page.mouse.move(point.x, point.y + 24, { steps: 4 });
  1245 |   await page.mouse.up();
  1246 |   await expect(page.locator('[data-word-row-resize-guide]')).toHaveCount(0);
  1247 |   await expect(row).toHaveAttribute('data-word-row-height', '60');
  1248 | });
  1249 |
  1250 | test('merged row resizing updates combined cell height and retains native vertical merge', async ({
  1251 |   page,
  1252 | }) => {
  1253 |   const source = Buffer.from(
  1254 |     await Packer.toArrayBuffer(
  1255 |       new Document({
  1256 |         sections: [
  1257 |           {
  1258 |             children: [
  1259 |               new Table({
  1260 |                 rows: [
  1261 |                   new TableRow({
  1262 |                     height: { value: 480, rule: HeightRule.EXACT },
  1263 |                     children: [
  1264 |                       new TableCell({ rowSpan: 2, children: [new Paragraph('Merged drag')] }),
  1265 |                       new TableCell({ children: [new Paragraph('Upper row')] }),
  1266 |                     ],
  1267 |                   }),
  1268 |                   new TableRow({
  1269 |                     height: { value: 720, rule: HeightRule.EXACT },
  1270 |                     children: [new TableCell({ children: [new Paragraph('Lower row')] })],
  1271 |                   }),
  1272 |                 ],
  1273 |               }),
  1274 |             ],
  1275 |           },
  1276 |         ],
  1277 |       })
  1278 |     )
  1279 |   );
  1280 |   const directory = path.resolve('docs/audits/2026-11-26/word-row-properties');
  1281 |   await writeFile(path.join(directory, 'merged-drag-source.docx'), source);
  1282 |   await page.goto('/#/components/office-studio');
  1283 |   const load = async (bytes: Buffer, name: string) => {
  1284 |     await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
  1285 |       name,
  1286 |       mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  1287 |       buffer: bytes,
  1288 |     });
  1289 |     await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(name);
  1290 |   };
  1291 |   await load(source, 'Merged-drag.docx');
  1292 |   const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  1293 |   const upper = body.locator('tr').first(),
  1294 |     lower = body.locator('tr').last();
  1295 |   const merged = body.locator('td[rowspan="2"]');
  1296 |   await expect(merged).toHaveAttribute('data-word-fixed-cell-height', '60');
  1297 |   await upper.locator('td').last().scrollIntoViewIfNeeded();
  1298 |   const rect = (await upper.boundingBox())!;
  1299 |   const right = (await upper.locator('td').last().boundingBox())!;
  1300 |   const scale = await body.evaluate(
  1301 |     (element) => element.getBoundingClientRect().width / (element as HTMLElement).offsetWidth
  1302 |   );
  1303 |   await page.mouse.move(right.x + right.width / 2, rect.y + rect.height - 1);
  1304 |   await page.mouse.down();
  1305 |   await page.mouse.move(right.x + right.width / 2, rect.y + rect.height - 1 + 32 * scale, {
  1306 |     steps: 5,
  1307 |   });
  1308 |   await page.mouse.up();
> 1309 |   await expect(upper).toHaveAttribute('data-word-row-height', '48');
       |                       ^ Error: expect(locator).toHaveAttribute(expected) failed
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
  1400 |     await expect(body).toHaveAttribute('data-word-pagination-overflow', 'false');
  1401 |     await expect(body.locator('td').nth(0).locator('[data-word-cell-page-gap]')).not.toHaveCount(0);
  1402 |     await expect(body.locator('td').nth(1).locator('[data-word-cell-page-gap]')).not.toHaveCount(0);
  1403 |   };
  1404 |   await enablePagination();
  1405 |   const naturalHeight = Number(
  1406 |     await body.locator('tr').getAttribute('data-word-natural-row-height')
  1407 |   );
  1408 |   expect(naturalHeight).toBeGreaterThan(0);
  1409 |   expect((await body.locator('tr').boundingBox())!.height).toBeGreaterThan(naturalHeight);
```
