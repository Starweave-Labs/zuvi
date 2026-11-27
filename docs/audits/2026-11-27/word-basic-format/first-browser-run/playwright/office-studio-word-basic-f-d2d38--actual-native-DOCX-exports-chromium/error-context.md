# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-word-basic-format.spec.ts >> applies mixed and caret character formats, restores transactions and reopens two actual native DOCX exports
- Location: e2e/office-studio-word-basic-format.spec.ts:103:1

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  getByRole('textbox', { name: 'Word 文档正文', exact: true }).locator('p').filter({ hasText: /^Caret / })
Expected: "Caret _Typed_base"
Received: "Caret Typedbase"
Timeout:  5000ms

Call log:
  - Expect "toHaveText" getByRole('textbox', { name: 'Word 文档正文', exact: true }).locator('p').filter({ hasText: /^Caret / }) with timeout 5000ms
  - waiting for getByRole('textbox', { name: 'Word 文档正文', exact: true }).locator('p').filter({ hasText: /^Caret / })
    14 × locator resolved to <p data-word-tabs="[]" data-word-surface="{}" data-word-line-rule="auto" data-word-default-tab="36" data-word-decimal-symbol="." data-word-paragraph-direct="[]">…</p>
       - unexpected value "Caret Typedbase"

```

```yaml
- paragraph:
  - text: Caret
  - emphasis: Typed
  - text: base
```

# Test source

```ts
  51  |
  52  | async function font(page: Page, label: string, value: string) {
  53  |   const input = page.getByRole('combobox', { name: label, exact: true });
  54  |   await input.fill(value);
  55  |   await input.press('Enter');
  56  | }
  57  |
  58  | async function highlight(page: Page, label: string) {
  59  |   await page.getByRole('button', { name: '文字高亮', exact: true }).click();
  60  |   await page.getByRole('menuitem', { name: label, exact: true }).click();
  61  | }
  62  |
  63  | async function nativeRows(page: Page, bytes: Uint8Array) {
  64  |   const zip = await JSZip.loadAsync(bytes);
  65  |   const content = await zip.file('word/document.xml')!.async('string');
  66  |   const relationships = await zip.file('word/_rels/document.xml.rels')!.async('string');
  67  |   const rows = await page.evaluate(xml => {
  68  |     const ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  69  |     const document = new DOMParser().parseFromString(xml, 'application/xml');
  70  |     const child = (element: Element | undefined, name: string) =>
  71  |       element ? Array.from(element.children).find(value => value.namespaceURI === ns && value.localName === name) : undefined;
  72  |     const flag = (properties: Element | undefined, name: string) => {
  73  |       const value = child(properties, name);
  74  |       return !!value && !['0', 'false', 'off', 'none'].includes(value.getAttributeNS(ns, 'val') ?? 'true');
  75  |     };
  76  |     return Array.from(document.getElementsByTagNameNS(ns, 'p')).map(paragraph => {
  77  |       const runs = Array.from(paragraph.getElementsByTagNameNS(ns, 'r')).map(run => {
  78  |         const properties = child(run, 'rPr');
  79  |         return {
  80  |           text: Array.from(run.getElementsByTagNameNS(ns, 't')).map(text => text.textContent).join(''),
  81  |           family: child(properties, 'rFonts')?.getAttributeNS(ns, 'ascii'),
  82  |           halfPoints: child(properties, 'sz')?.getAttributeNS(ns, 'val'),
  83  |           bold: flag(properties, 'b'), italic: flag(properties, 'i'),
  84  |           underline: flag(properties, 'u'), strike: flag(properties, 'strike'),
  85  |           script: child(properties, 'vertAlign')?.getAttributeNS(ns, 'val'),
  86  |           background: child(properties, 'shd')?.getAttributeNS(ns, 'fill'),
  87  |         };
  88  |       }).filter(run => run.text);
  89  |       return { text: runs.map(run => run.text).join(''), runs };
  90  |     });
  91  |   }, content);
  92  |   return { content, relationships, rows };
  93  | }
  94  |
  95  | async function exportFile(page: Page, filename: string) {
  96  |   const pending = page.waitForEvent('download');
  97  |   await page.getByRole('button', { name: '导出文件', exact: true }).click();
  98  |   const bytes = await readFile((await (await pending).path())!);
  99  |   await writeFile(path.join(audit, filename), bytes);
  100 |   return bytes;
  101 | }
  102 |
  103 | test('applies mixed and caret character formats, restores transactions and reopens two actual native DOCX exports', async ({ page }) => {
  104 |   test.setTimeout(180000);
  105 |   await mkdir(audit, { recursive: true });
  106 |   const source = await readFile(sourcePath), originalHash = hash(source), errors: string[] = [];
  107 |   page.on('pageerror', error => errors.push(error.message));
  108 |   await page.goto('/#/components/office-studio');
  109 |   await importSource(page, source);
  110 |   const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  111 |   const mixed = body.locator('p').filter({ hasText: 'Mixed plain Mixed rich' });
  112 |   await selectRange(mixed);
  113 |   await expect(page.getByRole('combobox', { name: '字体', exact: true })).toHaveValue('');
  114 |   await expect(page.getByRole('combobox', { name: '字号', exact: true })).toHaveValue('');
  115 |   for (const label of ['粗体', '斜体', '下划线', '删除线'])
  116 |     await expect(page.getByRole('button', { name: label, exact: true })).toHaveAttribute('aria-pressed', 'mixed');
  117 |   const beforeFonts = await model(body);
  118 |   await font(page, '字体', 'Arial');
  119 |   await expect(mixed.locator('span').last()).toHaveCSS('font-family', 'Arial');
  120 |   await page.getByRole('button', { name: '撤销', exact: true }).click();
  121 |   expect(await model(body)).toEqual(beforeFonts);
  122 |   await page.getByRole('button', { name: '重做', exact: true }).click();
  123 |   await font(page, '字号', '12');
  124 |   await expect(mixed.locator('span').last()).toHaveCSS('font-size', '16px');
  125 |   await expect.poll(() => page.evaluate(() => window.getSelection()?.toString())).toBe('Mixed plain Mixed rich');
  126 |   for (const label of ['粗体', '斜体', '下划线', '删除线']) {
  127 |     const button = page.getByRole('button', { name: label, exact: true });
  128 |     await expect(button).toHaveAttribute('aria-pressed', 'mixed');
  129 |     await button.click();
  130 |     await expect(button).toHaveAttribute('aria-pressed', 'true');
  131 |   }
  132 |   await highlight(page, '无颜色');
  133 |   await expect(mixed.locator('[style*="background-color"]')).toHaveCount(0);
  134 |   const clear = body.locator('p').filter({ hasText: 'Clear styles' });
  135 |   await selectRange(clear);
  136 |   for (const label of ['粗体', '斜体', '下划线', '删除线']) {
  137 |     const button = page.getByRole('button', { name: label, exact: true });
  138 |     await expect(button).toHaveAttribute('aria-pressed', 'true');
  139 |     await button.click();
  140 |     await expect(button).toHaveAttribute('aria-pressed', 'false');
  141 |     await page.getByRole('button', { name: '撤销', exact: true }).click();
  142 |     await expect(button).toHaveAttribute('aria-pressed', 'true');
  143 |     await page.getByRole('button', { name: '重做', exact: true }).click();
  144 |     await expect(button).toHaveAttribute('aria-pressed', 'false');
  145 |   }
  146 |   const caret = body.locator('p').filter({ hasText: /^Caret / });
  147 |   await selectRange(caret, 6, 6);
  148 |   await font(page, '字体', 'Times New Roman');
  149 |   await font(page, '字号', '17.3pt');
  150 |   await body.pressSequentially('_Typed_');
> 151 |   await expect(caret).toHaveText('Caret _Typed_base');
      |                       ^ Error: expect(locator).toHaveText(expected) failed
  152 |   await expect(caret.getByText('_Typed_', { exact: true })).toHaveCSS('font-size', '23.3333px');
  153 |   const typed = await model(body);
  154 |   await page.getByRole('button', { name: '撤销', exact: true }).click();
  155 |   await expect(caret).toHaveText('Caret base');
  156 |   await page.getByRole('button', { name: '重做', exact: true }).click();
  157 |   expect(await model(body)).toEqual(typed);
  158 |   const script = body.locator('p').filter({ hasText: 'Script 23' });
  159 |   await selectRange(script, 7, 8);
  160 |   await page.getByRole('button', { name: '上标', exact: true }).click();
  161 |   await expect(script.locator('sup')).toHaveText('2');
  162 |   await page.getByRole('button', { name: '下标', exact: true }).click();
  163 |   await expect(script.locator('sup')).toHaveCount(0);
  164 |   await expect(script.locator('sub')).toHaveText('2');
  165 |   await page.getByRole('button', { name: '下标', exact: true }).click();
  166 |   await expect(script.locator('sub')).toHaveCount(0);
  167 |   await page.getByRole('button', { name: '撤销', exact: true }).click();
  168 |   await expect(script.locator('sub')).toHaveText('2');
  169 |   await page.getByRole('button', { name: '重做', exact: true }).click();
  170 |   await expect(script.locator('sub')).toHaveCount(0);
  171 |   await page.getByRole('button', { name: '上标', exact: true }).click();
  172 |   await selectRange(script, 8, 9);
  173 |   await page.getByRole('button', { name: '下标', exact: true }).click();
  174 |   await expect(script.locator('sup')).toHaveText('2');
  175 |   await expect(script.locator('sub')).toHaveText('3');
  176 |   const target = body.locator('p').filter({ hasText: 'Highlight target' });
  177 |   await selectRange(target);
  178 |   await highlight(page, '青色');
  179 |   await expect(target.locator('span')).toHaveCSS('background-color', 'rgb(0, 255, 255)');
  180 |   await highlight(page, '无颜色');
  181 |   await expect(target.locator('span')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  182 |   await page.getByRole('button', { name: '撤销', exact: true }).click();
  183 |   await expect(target.locator('span')).toHaveCSS('background-color', 'rgb(0, 255, 255)');
  184 |   await page.getByRole('button', { name: '重做', exact: true }).click();
  185 |   await expect(target.locator('span')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  186 |   await highlight(page, '黄色');
  187 |   const highlightCaret = body.locator('p').filter({ hasText: /^Highlight .*caret$/ });
  188 |   await selectRange(highlightCaret, 10, 10);
  189 |   await highlight(page, '黄色');
  190 |   await body.pressSequentially('H');
  191 |   await highlight(page, '无颜色');
  192 |   await body.pressSequentially('C');
  193 |   await expect(highlightCaret).toHaveText('Highlight HCcaret');
  194 |   await expect(highlightCaret.getByText('H', { exact: true })).toHaveCSS('background-color', 'rgb(255, 255, 0)');
  195 |   await page.getByRole('button', { name: '撤销', exact: true }).click();
  196 |   await expect(highlightCaret).toHaveText('Highlight Hcaret');
  197 |   await page.getByRole('button', { name: '撤销', exact: true }).click();
  198 |   await expect(highlightCaret).toHaveText('Highlight caret');
  199 |   for (let round = 0; round < 2; round++) await page.getByRole('button', { name: '重做', exact: true }).click();
  200 |   await expect(highlightCaret).toHaveText('Highlight HCcaret');
  201 |   const expected = await model(body), rounds = [];
  202 |   for (let round = 1; round <= 2; round++) {
  203 |     const bytes = await exportFile(page, `roundtrip-${round}.docx`);
  204 |     const native = await nativeRows(page, bytes);
  205 |     const mixedRuns = native.rows.find(row => row.text === 'Mixed plain Mixed rich')!.runs;
  206 |     for (const run of mixedRuns) expect(run).toMatchObject({ family: 'Arial', bold: true, italic: true, underline: true, strike: true });
  207 |     for (const run of native.rows.find(row => row.text === 'Clear styles')!.runs)
  208 |       expect(run).toMatchObject({ bold: false, italic: false, underline: false, strike: false });
  209 |     expect(native.rows.find(row => row.text === 'Caret _Typed_base')!.runs.find(run => run.text === '_Typed_')).toMatchObject({ family: 'Times New Roman', halfPoints: '35' });
  210 |     expect(native.rows.find(row => row.text === 'Script 23')!.runs.find(run => run.text === '2')?.script).toBe('superscript');
  211 |     expect(native.rows.find(row => row.text === 'Script 23')!.runs.find(run => run.text === '3')?.script).toBe('subscript');
  212 |     expect(native.rows.find(row => row.text === 'Highlight target')!.runs[0].background).toBe('FFFF00');
  213 |     expect(native.relationships).toContain('https://example.com/kept-link');
  214 |     await importSource(page, bytes, `Reopened-${round}.docx`);
  215 |     await expect(mixed.locator('strong')).toHaveText('Mixed plain Mixed rich');
  216 |     await expect(mixed.locator('span')).toHaveCSS('font-size', '16px');
  217 |     await expect(caret.getByText('_Typed_', { exact: true })).toHaveCSS('font-size', '23.3333px');
  218 |     await expect(script.locator('sup')).toHaveText('2');
  219 |     await expect(script.locator('sub')).toHaveText('3');
  220 |     await expect(target.locator('span')).toHaveCSS('background-color', 'rgb(255, 255, 0)');
  221 |     await expect(highlightCaret.getByText('H', { exact: true })).toHaveCSS('background-color', 'rgb(255, 255, 0)');
  222 |     await expect(body.locator('a')).toHaveAttribute('href', 'https://example.com/kept-link');
  223 |     rounds.push({ round, bytes: bytes.length, sha256: hash(bytes), native: native.rows });
  224 |   }
  225 |   await page.screenshot({ path: path.join(audit, 'formats-light.png'), fullPage: true, animations: 'disabled' });
  226 |   expect(hash(await readFile(sourcePath))).toBe(originalHash);
  227 |   expect(errors).toEqual([]);
  228 |   await writeFile(path.join(audit, 'native-roundtrips.json'), JSON.stringify({ originalHash, expected, rounds, errors }, null, 2) + '\n');
  229 | });
  230 |
  231 | test('keeps invalid and composing drafts unchanged, cancels them and verifies light dark 320px and readonly controls', async ({ page }) => {
  232 |   test.setTimeout(120000);
  233 |   const source = await readFile(sourcePath), downloads: string[] = [];
  234 |   page.on('download', value => downloads.push(value.suggestedFilename()));
  235 |   await page.goto('/#/components/office-studio');
  236 |   await importSource(page, source);
  237 |   const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  238 |   const mixed = body.locator('p').filter({ hasText: 'Mixed plain Mixed rich' });
  239 |   await selectRange(mixed);
  240 |   const before = await model(body), size = page.getByRole('combobox', { name: '字号', exact: true });
  241 |   await size.fill('410');
  242 |   await size.press('Enter');
  243 |   await expect(size).toHaveAttribute('aria-invalid', 'true');
  244 |   await page.getByRole('button', { name: '粗体', exact: true }).click();
  245 |   expect(await model(body)).toEqual(before);
  246 |   await page.getByRole('button', { name: '导出文件', exact: true }).click();
  247 |   await expect(size).toHaveAttribute('aria-invalid', 'true');
  248 |   expect(downloads).toEqual([]);
  249 |   await size.press('Escape');
  250 |   await expect(size).not.toHaveAttribute('aria-invalid', 'true');
  251 |   expect(await model(body)).toEqual(before);
```
