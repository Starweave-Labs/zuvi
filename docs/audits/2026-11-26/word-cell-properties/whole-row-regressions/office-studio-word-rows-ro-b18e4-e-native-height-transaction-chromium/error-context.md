# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: office-studio-word-rows.spec.ts >> row boundary drag previews without document edits and commits one native height transaction
- Location: e2e/office-studio-word-rows.spec.ts:1098:1

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  getByRole('textbox', { name: 'Word 文档正文', exact: true }).locator('tr')
Expected: "48"
Received: "49"
Timeout:  5000ms

Call log:
  - Expect "toHaveAttribute" getByRole('textbox', { name: 'Word 文档正文', exact: true }).locator('tr') with timeout 5000ms
  - waiting for getByRole('textbox', { name: 'Word 文档正文', exact: true }).locator('tr')
    14 × locator resolved to <tr data-word-row-height="49" data-word-row-height-rule="exact" data-word-row-allow-split="false" data-word-rendered-row-height="49.75">…</tr>
       - unexpected value "49"

```

```yaml
- row "Drag row content":
  - cell "Drag row content"
```

# Test source

```ts
  1075 |   await assertRows();
  1076 |   await page.getByRole('tab', { name: '开始', exact: true }).click();
  1077 |   await page.getByRole('button', { name: '撤销', exact: true }).click();
  1078 |   await expect(body.locator('tr').first()).not.toHaveAttribute('data-word-row-height');
  1079 |   await page.getByRole('button', { name: '重做', exact: true }).click();
  1080 |   for (let pass = 1; pass <= 2; pass++) {
  1081 |     const pending = page.waitForEvent('download');
  1082 |     await page.getByRole('button', { name: '导出文件', exact: true }).click();
  1083 |     const bytes = await readFile((await (await pending).path())!);
  1084 |     await writeFile(path.join(directory, `natural-rows-roundtrip-${pass}.docx`), bytes);
  1085 |     await load(bytes, `Natural-reopened-${pass}.docx`);
  1086 |     await assertRows();
  1087 |   }
  1088 |   await writeFile(
  1089 |     path.join(directory, 'natural-rows-evidence.json'),
  1090 |     JSON.stringify(
  1091 |       { heights: await assertRows(), lastLineRetained: true, reopenCycles: 2 },
  1092 |       null,
  1093 |       2
  1094 |     )
  1095 |   );
  1096 | });
  1097 |
  1098 | test('row boundary drag previews without document edits and commits one native height transaction', async ({
  1099 |   page,
  1100 | }) => {
  1101 |   const source = Buffer.from(
  1102 |     await Packer.toArrayBuffer(
  1103 |       new Document({
  1104 |         sections: [
  1105 |           {
  1106 |             children: [
  1107 |               new Table({
  1108 |                 rows: [
  1109 |                   new TableRow({
  1110 |                     height: { value: 480, rule: HeightRule.EXACT },
  1111 |                     cantSplit: true,
  1112 |                     children: [new TableCell({ children: [new Paragraph('Drag row content')] })],
  1113 |                   }),
  1114 |                 ],
  1115 |               }),
  1116 |             ],
  1117 |           },
  1118 |         ],
  1119 |       })
  1120 |     )
  1121 |   );
  1122 |   await page.goto('/#/components/office-studio');
  1123 |   await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
  1124 |     name: 'Drag.docx',
  1125 |     mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  1126 |     buffer: source,
  1127 |   });
  1128 |   const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  1129 |   await expect(body).toContainText('Drag row content');
  1130 |   const row = body.locator('tr');
  1131 |   await row.scrollIntoViewIfNeeded();
  1132 |   const boundary = async () => {
  1133 |     const rect = (await row.boundingBox())!;
  1134 |     return { x: rect.x + 20, y: rect.y + rect.height - 1 };
  1135 |   };
  1136 |   let point = await boundary();
  1137 |   await page.mouse.move(point.x, point.y);
  1138 |   await page.mouse.down();
  1139 |   await page.mouse.move(point.x, point.y + 32, { steps: 5 });
  1140 |   await expect(page.locator('[data-word-row-resize-guide]')).toBeVisible();
  1141 |   await expect(row).toHaveAttribute('data-word-row-height', '24');
  1142 |   await page.keyboard.press('Escape');
  1143 |   await page.mouse.up();
  1144 |   await expect(page.locator('[data-word-row-resize-guide]')).toHaveCount(0);
  1145 |   await expect(row).toHaveAttribute('data-word-row-height', '24');
  1146 |   point = await boundary();
  1147 |   await page.mouse.move(point.x, point.y);
  1148 |   await page.mouse.down();
  1149 |   await page.mouse.move(point.x, point.y + 16, { steps: 3 });
  1150 |   await expect(page.locator('[data-word-row-resize-guide]')).toBeVisible();
  1151 |   await body.evaluate((element) =>
  1152 |     element.ownerDocument.dispatchEvent(
  1153 |       new PointerEvent('pointercancel', { pointerId: 1, bubbles: true })
  1154 |     )
  1155 |   );
  1156 |   await page.mouse.up();
  1157 |   await expect(page.locator('[data-word-row-resize-guide]')).toHaveCount(0);
  1158 |   await expect(row).toHaveAttribute('data-word-row-height', '24');
  1159 |   point = await boundary();
  1160 |   await page.mouse.move(point.x, point.y);
  1161 |   await page.mouse.down();
  1162 |   await page.mouse.move(point.x, point.y + 16, { steps: 3 });
  1163 |   await expect(page.locator('[data-word-row-resize-guide]')).toBeVisible();
  1164 |   await body.dispatchEvent('compositionstart', { data: '行' });
  1165 |   await expect(page.locator('[data-word-row-resize-guide]')).toHaveCount(0);
  1166 |   await page.mouse.up();
  1167 |   await expect(row).toHaveAttribute('data-word-row-height', '24');
  1168 |   await body.dispatchEvent('compositionend', { data: '' });
  1169 |   await expect(body).toContainText('Drag row content');
  1170 |   point = await boundary();
  1171 |   await page.mouse.move(point.x, point.y);
  1172 |   await page.mouse.down();
  1173 |   await page.mouse.move(point.x, point.y + 32, { steps: 5 });
  1174 |   await page.mouse.up();
> 1175 |   await expect(row).toHaveAttribute('data-word-row-height', '48');
       |                     ^ Error: expect(locator).toHaveAttribute(expected) failed
  1176 |   await expect(row).toHaveAttribute('data-word-row-allow-split', 'false');
  1177 |   await page.getByRole('tab', { name: '开始', exact: true }).click();
  1178 |   await page.getByRole('button', { name: '撤销', exact: true }).click();
  1179 |   await expect(row).toHaveAttribute('data-word-row-height', '24');
  1180 |   await page.getByRole('button', { name: '重做', exact: true }).click();
  1181 |   await expect(row).toHaveAttribute('data-word-row-height', '48');
  1182 |   const pending = page.waitForEvent('download');
  1183 |   await page.getByRole('button', { name: '导出文件', exact: true }).click();
  1184 |   const bytes = await readFile((await (await pending).path())!);
  1185 |   const directory = path.resolve('docs/audits/2026-11-26/word-row-properties');
  1186 |   await writeFile(path.join(directory, 'drag-source.docx'), source);
  1187 |   await writeFile(path.join(directory, 'drag-roundtrip.docx'), bytes);
  1188 |   await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
  1189 |     name: 'Drag-reopened.docx',
  1190 |     mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  1191 |     buffer: bytes,
  1192 |   });
  1193 |   await expect(row).toHaveAttribute('data-word-row-height', '48');
  1194 |   await expect(body).toContainText('Drag row content');
  1195 |   const secondDownload = page.waitForEvent('download');
  1196 |   await page.getByRole('button', { name: '导出文件', exact: true }).click();
  1197 |   const secondBytes = await readFile((await (await secondDownload).path())!);
  1198 |   await writeFile(path.join(directory, 'drag-roundtrip-2.docx'), secondBytes);
  1199 |   await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({
  1200 |     name: 'Drag-reopened-2.docx',
  1201 |     mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  1202 |     buffer: secondBytes,
  1203 |   });
  1204 |   await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(
  1205 |     'Drag-reopened-2.docx'
  1206 |   );
  1207 |   await expect(row).toHaveAttribute('data-word-row-height', '48');
  1208 |   await page.setViewportSize({ width: 320, height: 720 });
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
```
