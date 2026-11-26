# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-sheet-text.spec.ts >> advanced text editing, native default font, automatic rows, print and two XLSX reopens use the actual editor
- Location: e2e/office-studio-sheet-text.spec.ts:127:1

# Error details

```
Error: expect(locator).toHaveCSS(expected) failed

Locator:  getByRole('gridcell', { name: 'A2', exact: true })
Expected: "59.328125px"
Received: "59.3281px"
Timeout:  5000ms

Call log:
  - Expect "toHaveCSS" getByRole('gridcell', { name: 'A2', exact: true }) with timeout 5000ms
  - waiting for getByRole('gridcell', { name: 'A2', exact: true })
    14 × locator resolved to <div id="_r_o_-A2" role="gridcell" aria-label="A2" data-wrap="true" aria-colindex="2" data-active="true" aria-selected="true" data-selected="true" class="zuvi-studio-sheet-cell" title="自动换行随列宽变化并保留原始文字与工作簿默认字体。">…</div>
       - unexpected value "59.3281px"

```

```yaml
- gridcell "A2" [selected]: 自动换行随列宽变 化并保留原始文字 与工作簿默认字体 。
```

# Test source

```ts
  82  | }
  83  | async function choose(page: Page, dialog: Locator, label: string, option: string) {
  84  |   const trigger = dialog.getByRole('button', { name: new RegExp('^' + label) });
  85  |   await trigger.click();
  86  |   const id = await trigger.getAttribute('aria-controls');
  87  |   await page.locator(`[id="${id}"]`).getByRole('option', { name: option, exact: true }).click();
  88  | }
  89  | async function apply(dialog: Locator) {
  90  |   await dialog.getByRole('button', { name: '应用排版', exact: true }).click();
  91  |   await expect(dialog).toBeHidden();
  92  | }
  93  | async function exportFile(page: Page) {
  94  |   const pending = page.waitForEvent('download');
  95  |   await page.getByRole('button', { name: '导出文件', exact: true }).click();
  96  |   return readFile((await (await pending).path())!);
  97  | }
  98  | async function geometry(locator: Locator) {
  99  |   return locator.evaluate((element) => {
  100 |     const box = element.getBoundingClientRect();
  101 |     const text = element.querySelector<HTMLElement>(
  102 |       '.zuvi-studio-sheet-text,.studio-print-text-clip'
  103 |     )!;
  104 |     return {
  105 |       width: box.width,
  106 |       height: box.height,
  107 |       textWidth: text.getBoundingClientRect().width,
  108 |       lines: Array.from(
  109 |         element.querySelectorAll<HTMLElement>(
  110 |           '.zuvi-studio-sheet-text-transform>span,.studio-print-text-transform>span'
  111 |         ),
  112 |         (line) => {
  113 |           const bounds = line.getBoundingClientRect();
  114 |           return {
  115 |             text: line.textContent,
  116 |             x: bounds.left - box.left,
  117 |             y: bounds.top - box.top,
  118 |             width: bounds.width,
  119 |             height: bounds.height,
  120 |           };
  121 |         }
  122 |       ),
  123 |     };
  124 |   });
  125 | }
  126 |
  127 | test('advanced text editing, native default font, automatic rows, print and two XLSX reopens use the actual editor', async ({
  128 |   page,
  129 |   context,
  130 | }) => {
  131 |   test.setTimeout(150000);
  132 |   await mkdir(audit, { recursive: true });
  133 |   const { source, font0 } = await fixture();
  134 |   await writeFile(path.join(audit, 'text-source.xlsx'), source);
  135 |   await page.addInitScript(() => {
  136 |     window.print = () => {
  137 |       window.parent.postMessage(
  138 |         { type: 'sheet-text-print', html: document.documentElement.outerHTML },
  139 |         '*'
  140 |       );
  141 |       window.dispatchEvent(new Event('afterprint'));
  142 |     };
  143 |   });
  144 |   await page.goto('/#/components/office-studio');
  145 |   await importFile(page, source, 'Text.xlsx');
  146 |   const cell = (address: string) => page.getByRole('gridcell', { name: address, exact: true });
  147 |   await expect(page.getByRole('combobox', { name: '表格字体', exact: true })).toHaveValue('Arial');
  148 |   await expect(page.getByRole('combobox', { name: '表格字号', exact: true })).toHaveValue('9.5');
  149 |   await expect(page.getByRole('button', { name: '表格加粗', exact: true })).toHaveAttribute(
  150 |     'aria-pressed',
  151 |     'true'
  152 |   );
  153 |   await expect(cell('A1')).toHaveText('CENTER_TITLE');
  154 |   const nativeWidth = await cell('A1').evaluate((element) => element.getBoundingClientRect().width);
  155 |   let dialog = await open(page, 'A1:C1');
  156 |   await choose(page, dialog, '文字水平对齐', '跨选区居中');
  157 |   await apply(dialog);
  158 |   await expect(cell('A1')).toHaveAttribute('data-center-continuous-span', '1:3');
  159 |   await expect(cell('A1').locator('.zuvi-studio-sheet-text')).toHaveCSS(
  160 |     'width',
  161 |     `${nativeWidth * 3}px`
  162 |   );
  163 |   await expect(cell('B1')).not.toHaveAttribute('aria-colspan');
  164 |   await page.getByRole('button', { name: '撤销表格修改', exact: true }).click();
  165 |   await expect(cell('A1')).not.toHaveAttribute('data-center-continuous-span');
  166 |   await page.getByRole('button', { name: '重做表格修改', exact: true }).click();
  167 |   await expect(cell('A1')).toHaveAttribute('data-center-continuous-span', '1:3');
  168 |
  169 |   const beforeWrap = await cell('A2').evaluate((element) => element.getBoundingClientRect().height);
  170 |   dialog = await open(page, 'A2');
  171 |   await dialog.getByRole('checkbox', { name: '自动换行', exact: true }).check();
  172 |   await dialog.getByRole('checkbox', { name: '缩小字体填充', exact: true }).check();
  173 |   await apply(dialog);
  174 |   const wrappedHeight = await cell('A2').evaluate(
  175 |     (element) => element.getBoundingClientRect().height
  176 |   );
  177 |   expect(wrappedHeight).toBeGreaterThan(beforeWrap);
  178 |   await expect(cell('A2').locator('[data-shrink-applied]')).toHaveCount(0);
  179 |   await page.getByRole('button', { name: '撤销表格修改', exact: true }).click();
  180 |   await expect(cell('A2')).toHaveCSS('height', `${beforeWrap}px`);
  181 |   await page.getByRole('button', { name: '重做表格修改', exact: true }).click();
> 182 |   await expect(cell('A2')).toHaveCSS('height', `${wrappedHeight}px`);
      |                            ^ Error: expect(locator).toHaveCSS(expected) failed
  183 |
  184 |   dialog = await open(page, 'A3');
  185 |   await dialog.getByRole('checkbox', { name: '缩小字体填充', exact: true }).check();
  186 |   await apply(dialog);
  187 |   expect(
  188 |     Number(
  189 |       await cell('A3').locator('.zuvi-studio-sheet-text').getAttribute('data-effective-font-size')
  190 |     )
  191 |   ).toBeLessThan(22);
  192 |   dialog = await open(page, 'A4');
  193 |   await dialog.getByLabel('文字旋转角度', { exact: true }).fill('-45');
  194 |   await choose(page, dialog, '文字垂直对齐', '顶端');
  195 |   await apply(dialog);
  196 |   expect(
  197 |     await cell('A4')
  198 |       .locator('.zuvi-studio-sheet-text-transform')
  199 |       .evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).b)
  200 |   ).toBeCloseTo(Math.SQRT1_2, 5);
  201 |   dialog = await open(page, 'C4');
  202 |   await choose(page, dialog, '文字水平对齐', '右对齐');
  203 |   await dialog.getByLabel('文字缩进', { exact: true }).fill('2');
  204 |   await apply(dialog);
  205 |   dialog = await open(page, 'A5');
  206 |   await choose(page, dialog, '文字方向', '竖排文字');
  207 |   await choose(page, dialog, '文字垂直对齐', '顶端');
  208 |   await apply(dialog);
  209 |   await expect(cell('A5').locator('[data-text-rotation="vertical"]')).toBeVisible();
  210 |   await expect(cell('A5').locator('.zuvi-studio-sheet-text-transform>span')).toHaveCount(5);
  211 |   dialog = await open(page, 'A7');
  212 |   await choose(page, dialog, '文字水平对齐', '填充');
  213 |   await apply(dialog);
  214 |   expect((await cell('A7').textContent())!.length).toBeGreaterThan(2);
  215 |   dialog = await open(page, 'A8');
  216 |   await choose(page, dialog, '文字水平对齐', '两端对齐');
  217 |   await choose(page, dialog, '文字垂直对齐', '分散对齐');
  218 |   await apply(dialog);
  219 |   const verticalLines = await geometry(cell('A8'));
  220 |   expect(verticalLines.lines).toHaveLength(3);
  221 |   expect(verticalLines.lines[1].y - verticalLines.lines[0].y).toBeGreaterThan(
  222 |     verticalLines.lines[0].height
  223 |   );
  224 |   dialog = await open(page, 'B8');
  225 |   await choose(page, dialog, '文字水平对齐', '分散对齐');
  226 |   await apply(dialog);
  227 |   expect(
  228 |     await cell('B8')
  229 |       .locator('.zuvi-studio-sheet-text-transform>span')
  230 |       .evaluate((element) => parseFloat(getComputedStyle(element).letterSpacing))
  231 |   ).toBeGreaterThan(0);
  232 |   await range(page, 'B11');
  233 |   await expect(cell('B11')).toHaveText('4');
  234 |   expect((await geometry(cell('B11'))).height).toBeGreaterThan(beforeWrap);
  235 |
  236 |   const rounds: Array<{ file: string; sha256: string }> = [];
  237 |   for (let round = 1; round <= 2; round++) {
  238 |     const bytes = await exportFile(page);
  239 |     const filename = `text-roundtrip-${round}.xlsx`;
  240 |     await writeFile(path.join(audit, filename), bytes);
  241 |     const zip = await JSZip.loadAsync(bytes);
  242 |     const styles = await zip.file('xl/styles.xml')!.async('string');
  243 |     expect(styles).toContain(font0);
  244 |     const xml = await zip.file('xl/worksheets/sheet1.xml')!.async('string');
  245 |     expect(xml.match(/<row\b[^>]*\br="2"[^>]*>/)![0]).not.toContain('customHeight="1"');
  246 |     expect(xml.match(/<row\b[^>]*\br="5"[^>]*>/)![0]).toContain('customHeight="1"');
  247 |     expect(xml).toMatch(/<f[^>]*t="array"[^>]*ref="A10:B11"/);
  248 |     const native = new ExcelJS.Workbook();
  249 |     await native.xlsx.load(bytes);
  250 |     const data = native.getWorksheet('Text')!;
  251 |     for (const address of ['A1', 'B1', 'C1'])
  252 |       expect(data.getCell(address).alignment.horizontal).toBe('centerContinuous');
  253 |     expect(data.getCell('A2').value).toBe(wrapped);
  254 |     expect(data.getCell('A2').alignment).toMatchObject({ wrapText: true, shrinkToFit: true });
  255 |     expect(data.getCell('A3').font.size).toBe(22);
  256 |     expect(data.getCell('A3').alignment.shrinkToFit).toBe(true);
  257 |     expect(data.getCell('A4').alignment).toMatchObject({
  258 |       textRotation: -45,
  259 |       indent: 0,
  260 |       vertical: 'top',
  261 |     });
  262 |     expect(data.getCell('C4').alignment).toMatchObject({
  263 |       horizontal: 'right',
  264 |       indent: 2,
  265 |       textRotation: 0,
  266 |     });
  267 |     expect(data.getCell('A5').alignment.textRotation).toBe('vertical');
  268 |     expect(data.getRow(5).height).toBe(90);
  269 |     expect(data.getCell('A7').value).toBe('**');
  270 |     expect(data.getCell('A7').alignment.horizontal).toBe('fill');
  271 |     expect(data.getCell('A8').alignment).toMatchObject({
  272 |       horizontal: 'justify',
  273 |       vertical: 'distributed',
  274 |     });
  275 |     expect(data.getCell('B8').alignment.horizontal).toBe('distributed');
  276 |     expect(data.getCell('B9').value).toMatchObject({ formula: "'Other'!A1" });
  277 |     expect(data.getCell('D1').value).toMatchObject({
  278 |       hyperlink: 'https://example.com/native-text',
  279 |     });
  280 |     expect(data.getCell('B6').value).toEqual({ error: '#N/A' });
  281 |     expect(data.getCell('C6').value).toBe(false);
  282 |     expect(data.getCell('D6').value).toBe('#N/A');
```