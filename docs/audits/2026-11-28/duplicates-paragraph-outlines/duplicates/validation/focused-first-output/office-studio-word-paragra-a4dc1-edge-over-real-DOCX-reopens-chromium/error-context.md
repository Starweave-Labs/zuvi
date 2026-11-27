# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-word-paragraph-acceptance.spec.ts >> original paragraph requirements retain four alignments, indent and line units, tab stops and every border edge over real DOCX reopens
- Location: e2e/office-studio-word-paragraph-acceptance.spec.ts:71:1

# Error details

```
Error: expect(locator).toHaveCSS(expected) failed

Locator:  getByRole('textbox', { name: 'Word 文档正文', exact: true }).locator('p').filter({ hasText: /^Alignment center/ })
Expected: "left"
Received: "start"
Timeout:  5000ms

Call log:
  - Expect "toHaveCSS" getByRole('textbox', { name: 'Word 文档正文', exact: true }).locator('p').filter({ hasText: /^Alignment center/ }) with timeout 5000ms
  - waiting for getByRole('textbox', { name: 'Word 文档正文', exact: true }).locator('p').filter({ hasText: /^Alignment center/ })
    14 × locator resolved to <p data-word-tabs="[]" data-word-surface="{}" data-word-default-tab="36" data-word-decimal-symbol="." data-word-paragraph-direct="[]">…</p>
       - unexpected value "start"

```

```yaml
- paragraph:
  - strong: Alignment center
```

# Test source

```ts
  94  |         sections: [
  95  |           {
  96  |             children: labels.map(
  97  |               (label) =>
  98  |                 new Paragraph({
  99  |                   ...(label === 'Cleared surface'
  100 |                     ? {
  101 |                         border: {
  102 |                           top: { style: BorderStyle.SINGLE, size: 8, space: 2, color: '112233' },
  103 |                           bottom: { style: BorderStyle.DOUBLE, size: 8 },
  104 |                           left: { style: BorderStyle.DOTTED, size: 8 },
  105 |                           right: { style: BorderStyle.DASHED, size: 8 },
  106 |                         },
  107 |                         shading: { type: ShadingType.CLEAR, fill: 'FFEECC' },
  108 |                       }
  109 |                     : {}),
  110 |                   children: [
  111 |                     new TextRun({ text: label, bold: true }),
  112 |                     ...(label === 'Tabs'
  113 |                       ? [
  114 |                           new TextRun({ children: [new Tab(), 'A'] }),
  115 |                           new TextRun({ children: [new Tab(), 'B'] }),
  116 |                           new TextRun({ children: [new Tab(), 'C'] }),
  117 |                           new TextRun({ children: [new Tab(), '12.34'] }),
  118 |                         ]
  119 |                       : []),
  120 |                   ],
  121 |                 })
  122 |             ),
  123 |           },
  124 |         ],
  125 |       })
  126 |     )
  127 |   );
  128 |   await writeFile(path.join(output, 'source.docx'), source);
  129 |   const load = async (bytes: Buffer, name: string) => {
  130 |     await page
  131 |       .getByLabel('导入文档文件', { exact: true })
  132 |       .setInputFiles({ name, mimeType, buffer: bytes });
  133 |     await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(name);
  134 |   };
  135 |   await page.goto('/#/components/office-studio');
  136 |   await load(source, 'Paragraph acceptance.docx');
  137 |   const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  138 |   const paragraph = (label: string) =>
  139 |     body.locator('p').filter({ hasText: new RegExp(`^${label}`) });
  140 |   const open = async (label: string, entry: string) => {
  141 |     await select(paragraph(label));
  142 |     await page.getByRole('button', { name: entry, exact: true }).click();
  143 |     return page.getByRole('dialog', { name: entry, exact: true });
  144 |   };
  145 |   const apply = async (dialog: Locator, name: string) => {
  146 |     await dialog.getByRole('button', { name, exact: true }).click();
  147 |     await expect(dialog).toBeHidden();
  148 |   };
  149 | 
  150 |   // IME confirmation is isolated from applying the three numeric drafts. Cancel
  151 |   // each dialog while its draft is pending, then verify unchanged paragraph data.
  152 |   for (const config of [
  153 |     { entry: '段落设置', field: '左缩进（pt）', value: '24', submit: '应用段落设置' },
  154 |     { entry: '制表位', field: '制表位位置（pt）', value: '72', submit: '应用制表位' },
  155 |     {
  156 |       entry: '段落边框与底纹',
  157 |       field: '段落边框距文字（pt）',
  158 |       value: '4',
  159 |       submit: '应用段落边框底纹',
  160 |     },
  161 |   ]) {
  162 |     const target = paragraph('First indent');
  163 |     const before = await target.getAttribute('style');
  164 |     const dialog = await open('First indent', config.entry),
  165 |       input = dialog.getByLabel(config.field, { exact: true });
  166 |     await input.dispatchEvent('compositionstart', { data: '' });
  167 |     await input.fill(config.value);
  168 |     await expect(dialog.getByRole('button', { name: config.submit, exact: true })).toBeDisabled();
  169 |     await input.dispatchEvent('keydown', {
  170 |       key: 'Enter',
  171 |       code: 'Enter',
  172 |       keyCode: 229,
  173 |       isComposing: true,
  174 |     });
  175 |     await expect(dialog).toBeVisible();
  176 |     expect(await target.getAttribute('style')).toBe(before);
  177 |     await dialog.getByRole('button', { name: '取消', exact: true }).click();
  178 |     await expect(dialog).toBeHidden();
  179 |     expect(await target.getAttribute('style')).toBe(before);
  180 |   }
  181 | 
  182 |   for (const [key, label] of [
  183 |     ['left', '左对齐'],
  184 |     ['center', '居中'],
  185 |     ['right', '右对齐'],
  186 |     ['justify', '两端对齐'],
  187 |   ] as const) {
  188 |     const target = paragraph(`Alignment ${key}`);
  189 |     await select(target);
  190 |     await page.getByRole('button', { name: label, exact: true }).click();
  191 |     await expect(target).toHaveCSS('text-align', key);
  192 |     if (key === 'center') {
  193 |       await page.getByRole('button', { name: '撤销', exact: true }).click();
> 194 |       await expect(target).toHaveCSS('text-align', 'left');
      |                            ^ Error: expect(locator).toHaveCSS(expected) failed
  195 |       await page.getByRole('button', { name: '重做', exact: true }).click();
  196 |       await expect(target).toHaveCSS('text-align', 'center');
  197 |     }
  198 |   }
  199 |   for (const [label, kind, amount] of [
  200 |     ['First indent', '首行', '9'],
  201 |     ['Hanging indent', '悬挂', '11'],
  202 |   ]) {
  203 |     const dialog = await open(label, '段落设置');
  204 |     await dialog.getByLabel('左缩进（pt）', { exact: true }).fill('18');
  205 |     await dialog.getByLabel('右缩进（pt）', { exact: true }).fill('6');
  206 |     await choose(page, dialog, '特殊缩进', kind);
  207 |     await dialog.getByLabel('特殊缩进量（pt）', { exact: true }).fill(amount);
  208 |     await apply(dialog, '应用段落设置');
  209 |     await expect
  210 |       .poll(() =>
  211 |         paragraph(label).evaluate((element) => parseFloat(getComputedStyle(element).textIndent))
  212 |       )
  213 |       .toBeCloseTo(kind === '首行' ? 12 : (-11 * 4) / 3, 3);
  214 |   }
  215 |   for (const [label, rule, amount] of [
  216 |     ['Single spacing', '倍数', '1'],
  217 |     ['Multiple spacing', '倍数', '1.5'],
  218 |     ['Fixed spacing', '固定值', '18'],
  219 |     ['Minimum spacing', '最小值', '24'],
  220 |   ]) {
  221 |     const dialog = await open(label, '段落设置');
  222 |     await choose(page, dialog, '行距类型', rule);
  223 |     await dialog.getByLabel('行距量', { exact: true }).fill(amount);
  224 |     await dialog.getByLabel('段前（pt）', { exact: true }).fill('6');
  225 |     await dialog.getByLabel('段后（pt）', { exact: true }).fill('9');
  226 |     await apply(dialog, '应用段落设置');
  227 |     if (label === 'Single spacing') {
  228 |       await expect
  229 |         .poll(() =>
  230 |           paragraph(label).evaluate((element) => {
  231 |             const style = getComputedStyle(element);
  232 |             return parseFloat(style.lineHeight) / parseFloat(style.fontSize);
  233 |           })
  234 |         )
  235 |         .toBeCloseTo(1, 3);
  236 |     }
  237 |   }
  238 |   let dialog = await open('Tabs', '制表位');
  239 |   for (const [amount, alignment] of [
  240 |     ['72', '左对齐'],
  241 |     ['144', '居中'],
  242 |     ['216', '右对齐'],
  243 |     ['288', '小数点对齐'],
  244 |   ]) {
  245 |     await dialog.getByLabel('制表位位置（pt）', { exact: true }).fill(amount);
  246 |     await choose(page, dialog, '制表位对齐', alignment);
  247 |     await choose(page, dialog, '制表位前导符', '点线 ……');
  248 |     await dialog.getByRole('button', { name: '设置制表位', exact: true }).click();
  249 |     await dialog.getByRole('button', { name: '清空草稿', exact: true }).click();
  250 |   }
  251 |   await apply(dialog, '应用制表位');
  252 |   dialog = await open('Surface', '段落边框与底纹');
  253 |   for (const [side, line] of [
  254 |     ['上边', '单线'],
  255 |     ['右边', '双线'],
  256 |     ['下边', '点线'],
  257 |     ['左边', '虚线'],
  258 |   ]) {
  259 |     await choose(page, dialog, '段落边框边位', side);
  260 |     await choose(page, dialog, '段落边框线型', line);
  261 |     await dialog.getByLabel('段落边框宽度（pt）', { exact: true }).fill('1');
  262 |     await dialog.getByLabel('段落边框距文字（pt）', { exact: true }).fill('4');
  263 |     await dialog.getByLabel('段落边框颜色', { exact: true }).fill('#445566');
  264 |   }
  265 |   await dialog.getByLabel('段落底纹底色', { exact: true }).fill('#ccffee');
  266 |   await choose(page, dialog, '段落底纹图案', '纯底色');
  267 |   await apply(dialog, '应用段落边框底纹');
  268 |   const surface = paragraph('Surface');
  269 |   await expect(surface).toHaveCSS('border-left-style', 'dashed');
  270 |   await page.getByRole('button', { name: '撤销', exact: true }).click();
  271 |   await expect(surface).toHaveCSS('border-left-style', 'none');
  272 |   await page.getByRole('button', { name: '重做', exact: true }).click();
  273 |   await expect(surface).toHaveCSS('border-left-style', 'dashed');
  274 |   dialog = await open('Cleared surface', '段落边框与底纹');
  275 |   await dialog.getByRole('button', { name: '清除所有边框', exact: true }).click();
  276 |   await choose(page, dialog, '段落底纹图案', '无底纹');
  277 |   await apply(dialog, '应用段落边框底纹');
  278 |   for (const side of ['top', 'right', 'bottom', 'left'])
  279 |     await expect(paragraph('Cleared surface')).toHaveCSS(`border-${side}-style`, 'none');
  280 | 
  281 |   const nativeRecords = [];
  282 |   for (let round = 1; round <= 2; round++) {
  283 |     const download = page.waitForEvent('download');
  284 |     await page.getByRole('button', { name: '导出文件', exact: true }).click();
  285 |     const bytes = await readFile((await (await download).path())!);
  286 |     await writeFile(path.join(output, `roundtrip-${round}.docx`), bytes);
  287 |     const rows = await native(page, bytes),
  288 |       byText = (label: string) => rows.find((row) => row.text.startsWith(label))!;
  289 |     for (const align of ['left', 'center', 'right', 'justify'])
  290 |       expect(byText(`Alignment ${align}`).align).toBe(align === 'justify' ? 'both' : align);
  291 |     expect(byText('First indent').indent).toMatchObject({
  292 |       left: '360',
  293 |       right: '120',
  294 |       firstLine: '180',
```