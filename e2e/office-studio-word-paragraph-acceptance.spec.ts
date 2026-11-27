import { expect, test, type Locator, type Page } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  Document,
  Paragraph,
  TextRun,
  Packer,
  BorderStyle,
  ShadingType,
  Tab,
} from '../docs/node_modules/docx/dist/index.mjs';
import JSZip from '../docs/node_modules/jszip/lib/index.js';

const output = path.resolve('.release/office-continuation/paragraph-acceptance/browser');
const mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
async function select(node: Locator) {
  await node.evaluate((element) => {
    (element.closest('[contenteditable="true"]') as HTMLElement).focus();
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  });
}
async function choose(page: Page, dialog: Locator, label: string, value: string) {
  await dialog.getByRole('button', { name: new RegExp(`^${label}`) }).click();
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  await page.getByRole('option', { name: new RegExp('^' + escaped + '(?:\\s+✓)?$') }).click();
}
async function native(page: Page, bytes: Buffer) {
  const zip = await JSZip.loadAsync(bytes);
  const xml = await zip.file('word/document.xml')!.async('string');
  return page.evaluate(
    ({ xml, ns }) => {
      const document = new DOMParser().parseFromString(xml, 'application/xml');
      if (document.getElementsByTagName('parsererror').length)
        throw new Error('Invalid native DOCX XML');
      const attrs = (element: Element | undefined) =>
        Object.fromEntries(
          Array.from(element?.attributes ?? []).map((attribute) => [
            attribute.localName,
            attribute.value,
          ])
        );
      return Array.from(document.getElementsByTagNameNS(ns, 'p')).map((p) => {
        const first = (name: string) => p.getElementsByTagNameNS(ns, name)[0];
        const borders = first('pBdr');
        return {
          text: Array.from(p.getElementsByTagNameNS(ns, 't'))
            .map((t) => t.textContent)
            .join(''),
          align: first('jc')?.getAttributeNS(ns, 'val'),
          indent: attrs(first('ind')),
          spacing: attrs(first('spacing')),
          shading: attrs(first('shd')),
          borders: Object.fromEntries(
            Array.from(borders?.children ?? []).map((edge) => [edge.localName, attrs(edge)])
          ),
          tabs: Array.from(first('tabs')?.children ?? []).map(attrs),
          bold: Boolean(first('b')),
        };
      });
    },
    { xml, ns: W }
  );
}

test('original paragraph requirements retain four alignments, indent and line units, tab stops and every border edge over real DOCX reopens', async ({
  page,
}) => {
  test.setTimeout(90000);
  await mkdir(output, { recursive: true });
  const labels = [
    'Alignment left',
    'Alignment center',
    'Alignment right',
    'Alignment justify',
    'First indent',
    'Hanging indent',
    'Single spacing',
    'Multiple spacing',
    'Fixed spacing',
    'Minimum spacing',
    'Tabs',
    'Surface',
    'Cleared surface',
  ];
  const source = Buffer.from(
    await Packer.toArrayBuffer(
      new Document({
        sections: [
          {
            children: labels.map(
              (label) =>
                new Paragraph({
                  ...(label === 'Cleared surface'
                    ? {
                        border: {
                          top: { style: BorderStyle.SINGLE, size: 8, space: 2, color: '112233' },
                          bottom: { style: BorderStyle.DOUBLE, size: 8 },
                          left: { style: BorderStyle.DOTTED, size: 8 },
                          right: { style: BorderStyle.DASHED, size: 8 },
                        },
                        shading: { type: ShadingType.CLEAR, fill: 'FFEECC' },
                      }
                    : {}),
                  children: [
                    new TextRun({ text: label, bold: true }),
                    ...(label === 'Tabs'
                      ? [
                          new TextRun({ children: [new Tab(), 'A'] }),
                          new TextRun({ children: [new Tab(), 'B'] }),
                          new TextRun({ children: [new Tab(), 'C'] }),
                          new TextRun({ children: [new Tab(), '12.34'] }),
                        ]
                      : []),
                  ],
                })
            ),
          },
        ],
      })
    )
  );
  await writeFile(path.join(output, 'source.docx'), source);
  const load = async (bytes: Buffer, name: string) => {
    await page
      .getByLabel('导入文档文件', { exact: true })
      .setInputFiles({ name, mimeType, buffer: bytes });
    await expect(page.getByRole('textbox', { name: '文档名称', exact: true })).toHaveValue(name);
  };
  await page.goto('/#/components/office-studio');
  await load(source, 'Paragraph acceptance.docx');
  const body = page.getByRole('textbox', { name: 'Word 文档正文', exact: true });
  const paragraph = (label: string) =>
    body.locator('p').filter({ hasText: new RegExp(`^${label}`) });
  const open = async (label: string, entry: string) => {
    await select(paragraph(label));
    await page.getByRole('button', { name: entry, exact: true }).click();
    return page.getByRole('dialog', { name: entry, exact: true });
  };
  const apply = async (dialog: Locator, name: string) => {
    await dialog.getByRole('button', { name, exact: true }).click();
    await expect(dialog).toBeHidden();
  };

  // IME confirmation is isolated from applying the three numeric drafts. Cancel
  // each dialog while its draft is pending, then verify unchanged paragraph data.
  for (const config of [
    { entry: '段落设置', field: '左缩进（pt）', value: '24', submit: '应用段落设置' },
    { entry: '制表位', field: '制表位位置（pt）', value: '72', submit: '应用制表位' },
    {
      entry: '段落边框与底纹',
      field: '段落边框距文字（pt）',
      value: '4',
      submit: '应用段落边框底纹',
    },
  ]) {
    const target = paragraph('First indent');
    const before = await target.getAttribute('style');
    const dialog = await open('First indent', config.entry),
      input = dialog.getByLabel(config.field, { exact: true });
    await input.dispatchEvent('compositionstart', { data: '' });
    await input.fill(config.value);
    await expect(dialog.getByRole('button', { name: config.submit, exact: true })).toBeDisabled();
    await input.dispatchEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 229,
      isComposing: true,
    });
    await expect(dialog).toBeVisible();
    expect(await target.getAttribute('style')).toBe(before);
    await dialog.getByRole('button', { name: '取消', exact: true }).click();
    await expect(dialog).toBeHidden();
    expect(await target.getAttribute('style')).toBe(before);
  }

  for (const [key, label] of [
    ['left', '左对齐'],
    ['center', '居中'],
    ['right', '右对齐'],
    ['justify', '两端对齐'],
  ] as const) {
    const target = paragraph(`Alignment ${key}`);
    const initialAlignment = await target.evaluate(
      (element) => getComputedStyle(element).textAlign
    );
    await select(target);
    await page.getByRole('button', { name: label, exact: true }).click();
    await expect(target).toHaveCSS('text-align', key);
    if (key === 'center') {
      await page.getByRole('button', { name: '撤销', exact: true }).click();
      await expect(target).toHaveCSS('text-align', initialAlignment);
      await page.getByRole('button', { name: '重做', exact: true }).click();
      await expect(target).toHaveCSS('text-align', 'center');
    }
  }
  for (const [label, kind, amount] of [
    ['First indent', '首行', '9'],
    ['Hanging indent', '悬挂', '11'],
  ]) {
    const dialog = await open(label, '段落设置');
    await dialog.getByLabel('左缩进（pt）', { exact: true }).fill('18');
    await dialog.getByLabel('右缩进（pt）', { exact: true }).fill('6');
    await choose(page, dialog, '特殊缩进', kind);
    await dialog.getByLabel('特殊缩进量（pt）', { exact: true }).fill(amount);
    await apply(dialog, '应用段落设置');
    await expect
      .poll(() =>
        paragraph(label).evaluate((element) => parseFloat(getComputedStyle(element).textIndent))
      )
      .toBeCloseTo(kind === '首行' ? 12 : (-11 * 4) / 3, 3);
  }
  for (const [label, rule, amount] of [
    ['Single spacing', '倍数', '1'],
    ['Multiple spacing', '倍数', '1.5'],
    ['Fixed spacing', '固定值', '18'],
    ['Minimum spacing', '最小值', '24'],
  ]) {
    const dialog = await open(label, '段落设置');
    await choose(page, dialog, '行距类型', rule);
    await dialog.getByLabel('行距量', { exact: true }).fill(amount);
    await dialog.getByLabel('段前（pt）', { exact: true }).fill('6');
    await dialog.getByLabel('段后（pt）', { exact: true }).fill('9');
    await apply(dialog, '应用段落设置');
    if (label === 'Single spacing') {
      await expect
        .poll(() =>
          paragraph(label).evaluate((element) => {
            const style = getComputedStyle(element);
            return parseFloat(style.lineHeight) / parseFloat(style.fontSize);
          })
        )
        .toBeCloseTo(1, 3);
    }
  }
  let dialog = await open('Tabs', '制表位');
  for (const [amount, alignment] of [
    ['72', '左对齐'],
    ['144', '居中'],
    ['216', '右对齐'],
    ['288', '小数点对齐'],
  ]) {
    await dialog.getByLabel('制表位位置（pt）', { exact: true }).fill(amount);
    await choose(page, dialog, '制表位对齐', alignment);
    await choose(page, dialog, '制表位前导符', '点线 ……');
    await dialog.getByRole('button', { name: '设置制表位', exact: true }).click();
    await dialog.getByRole('button', { name: '清空草稿', exact: true }).click();
  }
  await apply(dialog, '应用制表位');
  dialog = await open('Surface', '段落边框与底纹');
  for (const [side, line] of [
    ['上边', '单线'],
    ['右边', '双线'],
    ['下边', '点线'],
    ['左边', '虚线'],
  ]) {
    await choose(page, dialog, '段落边框边位', side);
    await choose(page, dialog, '段落边框线型', line);
    await dialog.getByLabel('段落边框宽度（pt）', { exact: true }).fill('1');
    await dialog.getByLabel('段落边框距文字（pt）', { exact: true }).fill('4');
    await dialog.getByLabel('段落边框颜色', { exact: true }).fill('#445566');
  }
  await dialog.getByLabel('段落底纹底色', { exact: true }).fill('#ccffee');
  await choose(page, dialog, '段落底纹图案', '纯底色');
  await apply(dialog, '应用段落边框底纹');
  const surface = paragraph('Surface');
  await expect(surface).toHaveCSS('border-left-style', 'dashed');
  await page.getByRole('button', { name: '撤销', exact: true }).click();
  await expect(surface).toHaveCSS('border-left-style', 'none');
  await page.getByRole('button', { name: '重做', exact: true }).click();
  await expect(surface).toHaveCSS('border-left-style', 'dashed');
  dialog = await open('Cleared surface', '段落边框与底纹');
  await dialog.getByRole('button', { name: '清除所有边框', exact: true }).click();
  await choose(page, dialog, '段落底纹图案', '无底纹');
  await apply(dialog, '应用段落边框底纹');
  for (const side of ['top', 'right', 'bottom', 'left'])
    await expect(paragraph('Cleared surface')).toHaveCSS(`border-${side}-style`, 'none');

  const nativeRecords = [];
  for (let round = 1; round <= 2; round++) {
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出文件', exact: true }).click();
    const bytes = await readFile((await (await download).path())!);
    await writeFile(path.join(output, `roundtrip-${round}.docx`), bytes);
    const rows = await native(page, bytes),
      byText = (label: string) => rows.find((row) => row.text.startsWith(label))!;
    for (const align of ['left', 'center', 'right', 'justify'])
      expect(byText(`Alignment ${align}`).align).toBe(align === 'justify' ? 'both' : align);
    expect(byText('First indent').indent).toMatchObject({
      left: '360',
      right: '120',
      firstLine: '180',
    });
    expect(byText('Hanging indent').indent).toMatchObject({
      left: '360',
      right: '120',
      hanging: '220',
    });
    for (const [label, rule, line] of [
      ['Single spacing', 'auto', '240'],
      ['Multiple spacing', 'auto', '360'],
      ['Fixed spacing', 'exact', '360'],
      ['Minimum spacing', 'atLeast', '480'],
    ])
      expect(byText(label).spacing).toMatchObject({
        before: '120',
        after: '180',
        lineRule: rule,
        line,
      });
    expect(byText('Tabs').tabs).toEqual([
      { val: 'left', pos: '1440', leader: 'dot' },
      { val: 'center', pos: '2880', leader: 'dot' },
      { val: 'right', pos: '4320', leader: 'dot' },
      { val: 'decimal', pos: '5760', leader: 'dot' },
    ]);
    for (const [side, line] of [
      ['top', 'single'],
      ['right', 'double'],
      ['bottom', 'dotted'],
      ['left', 'dashed'],
    ])
      expect(byText('Surface').borders[side]).toMatchObject({
        val: line,
        sz: '8',
        space: '4',
        color: '445566',
      });
    expect(byText('Surface').shading).toMatchObject({ fill: 'ccffee' });
    for (const side of ['top', 'right', 'bottom', 'left'])
      expect(byText('Cleared surface').borders[side]?.val).toBe('nil');
    expect(byText('Cleared surface').shading.val).toBe('nil');
    expect(rows.every((row) => row.bold)).toBe(true);
    nativeRecords.push({ round, rows });
    await load(bytes, `Reopened paragraph ${round}.docx`);
    await expect(paragraph('Alignment center')).toHaveCSS('text-align', 'center');
    await expect(paragraph('Surface')).toHaveCSS('border-right-style', 'double');
  }
  await writeFile(path.join(output, 'native-matrix.json'), JSON.stringify(nativeRecords, null, 2));
  await body.evaluate((element) =>
    element.closest('.zuvi-office-studio')?.scrollIntoView({ block: 'start' })
  );
  await page.screenshot({
    path: path.join(output, 'paragraph-results-light.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('switch', { name: '只读预览', exact: true }).click();
  for (const entry of ['段落设置', '制表位', '段落边框与底纹'])
    await expect(page.getByRole('button', { name: entry, exact: true })).toBeDisabled();
});
