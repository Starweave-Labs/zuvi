import { expect, test, type Locator, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  PDFArray, PDFDict, PDFDocument, PDFHexString, PDFName, PDFNumber, PDFRawStream, PDFRef,
  PDFString, decodePDFRawStream,
} from '../docs/node_modules/pdf-lib/cjs/index.js';

const audit = path.resolve('docs/audits/2026-11-27/pdf-native-ui/browser-native');
const hostEvidence = path.resolve('docs/audits/2026-11-27/pdf-native-annotations/host-migration');
const sha = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const labels = { freeText: '文字', note: '便签', highlight: '高亮', underline: '下划线',
  strikeOut: '删除线', squiggly: '波浪线', square: '矩形', circle: '椭圆', line: '直线',
  arrow: '箭头', polygon: '多边形', polyLine: '折线', ink: '墨迹' } as const;
type Tool = keyof typeof labels;
test.use({ actionTimeout: 20000 });

function decoded(dict: PDFDict, key: string): string {
  const value = dict.lookup(PDFName.of(key));
  return value instanceof PDFString || value instanceof PDFHexString ? value.decodeText()
    : value instanceof PDFName ? value.decodeText() : '';
}
function numbers(dict: PDFDict, key: string): number[] {
  const value = dict.lookup(PDFName.of(key));
  return value instanceof PDFArray ? value.asArray().map(item => {
    const number = dict.context.lookup(item);
    if (!(number instanceof PDFNumber)) throw new Error(`Non-numeric native ${key}`);
    return number.asNumber();
  }) : [];
}
function annots(pdf: PDFDocument) {
  return pdf.getPages().flatMap((paper, page) => (paper.node.Annots()?.asArray() ?? []).map(ref => {
    const dict = pdf.context.lookup(ref);
    if (!(dict instanceof PDFDict)) throw new Error('Annotation dictionary is missing');
    return { ref, dict, page, id: decoded(dict, 'ZuviAnnotationId') || decoded(dict, 'NM'),
      subtype: decoded(dict, 'Subtype'), contents: decoded(dict, 'Contents'), rect: numbers(dict, 'Rect') };
  }));
}
function contentRecords(pdf: PDFDocument) {
  return pdf.getPages().flatMap((paper, page) => {
    const contents = paper.node.Contents();
    const entries = contents instanceof PDFArray ? contents.asArray() : contents ? [contents] : [];
    return entries.map(ref => {
      const stream = pdf.context.lookup(ref);
      if (!(stream instanceof PDFRawStream)) throw new Error('Original Contents stream is missing');
      return { page, sha256: sha(stream.getContents()), decodedSha256: sha(decodePDFRawStream(stream).decode()) };
    });
  });
}
async function inspect(bytes: Uint8Array) {
  const pdf = await PDFDocument.load(bytes), annotations = annots(pdf);
  return {
    sha256: sha(bytes), pages: pdf.getPageCount(), contents: contentRecords(pdf),
    annotations: annotations.map(item => {
      const ap = item.dict.lookup(PDFName.of('AP'));
      const normal = ap instanceof PDFDict ? ap.lookup(PDFName.of('N')) : undefined;
      const border = item.dict.lookup(PDFName.of('BS'));
      const alpha = item.dict.lookup(PDFName.of('CA'));
      const reply = item.dict.get(PDFName.of('IRT'));
      const ends = item.dict.lookup(PDFName.of('LE'));
      const ink = item.dict.lookup(PDFName.of('InkList'));
      return {
        id: item.id, subtype: item.subtype, contents: item.contents, rect: item.rect, page: item.page,
        author: decoded(item.dict, 'T'), created: decoded(item.dict, 'CreationDate'), modified: decoded(item.dict, 'M'),
        color: numbers(item.dict, 'C'), fill: numbers(item.dict, 'IC'), quads: numbers(item.dict, 'QuadPoints'),
        line: numbers(item.dict, 'L'), vertices: numbers(item.dict, 'Vertices'),
        lineEnds: ends instanceof PDFArray ? ends.asArray().map(value => pdf.context.lookup(value)?.toString()) : [],
        ink: ink instanceof PDFArray ? ink.asArray().map(value => {
          const points = pdf.context.lookup(value);
          return points instanceof PDFArray ? points.asArray().map(number => (pdf.context.lookup(number) as PDFNumber).asNumber()) : [];
        }) : [],
        opacity: alpha instanceof PDFNumber ? alpha.asNumber() : 1,
        border: border instanceof PDFDict ? { width: numbersAsScalar(border, 'W'), style: decoded(border, 'S') } : undefined,
        appearanceSha256: normal instanceof PDFRawStream ? sha(normal.getContents()) : undefined,
        replyTo: reply instanceof PDFRef ? annotations.find(parent => parent.ref.toString() === reply.toString())?.id : undefined,
        replyType: decoded(item.dict, 'RT'), state: decoded(item.dict, 'State'), stateModel: decoded(item.dict, 'StateModel'),
      };
    }),
    fields: pdf.getForm().getFields().map(field => ({ name: field.getName(), readOnly: field.isReadOnly(), widgets: field.acroField.getWidgets().length })),
  };
}
function numbersAsScalar(dict: PDFDict, key: string): number | undefined {
  const value = dict.lookup(PDFName.of(key));
  return value instanceof PDFNumber ? value.asNumber() : undefined;
}

async function waitReady(page: Page) {
  await expect(page.locator('.zuvi-studio-pdf-paper > canvas').first()).toBeVisible();
  await expect(page.getByLabel('PDF 批注署名', { exact: true })).toBeEnabled();
}
async function waitSaved(page: Page) {
  await expect(page.locator('[data-save-state="saved"]')).toBeVisible();
}
async function activeRecord(page: Page) {
  await waitSaved(page);
  return page.evaluate(async () => {
    const modulePath = '/src/pages/collaboration/office-studio/studio-storage.ts';
    const module = await import(modulePath) as typeof import('../docs/src/pages/collaboration/office-studio/studio-storage');
    const storage = module.createStudioStorage(), id = await storage.activeId();
    const file = id ? await storage.load(id) : undefined;
    if (!file || !file.source || file.document.kind !== 'pdf') throw new Error('Active persisted PDF pair is missing');
    const hash = await crypto.subtle.digest('SHA-256', await file.source.arrayBuffer());
    return { revision: file.revision, document: file.document,
      sourceHash: [...new Uint8Array(hash)].map(value => value.toString(16).padStart(2, '0')).join('') };
  });
}
async function open(page: Page, name = 'original.pdf', fullscreen = true, input?: Uint8Array) {
  await mkdir(audit, { recursive: true });
  const bytes = input ? Buffer.from(input) : await readFile(path.join(hostEvidence, name));
  await writeFile(path.join(audit, 'fixture-' + name), bytes);
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto('/#/components/office-studio');
  await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({ name: 'Native-' + name, mimeType: 'application/pdf', buffer: bytes });
  await waitReady(page);
  if (fullscreen) await page.getByRole('button', { name: '全屏编辑', exact: true }).click();
  await waitReady(page);
  return bytes;
}
async function lockedAndNoApFixture() {
  const pdf = await PDFDocument.load(await readFile(path.join(hostEvidence, 'native-twelve-types.pdf')));
  const paper = pdf.getPages()[0], square = annots(pdf).find(item => item.subtype === 'Square')!;
  const locked = pdf.context.register(pdf.context.obj({ Type: 'Annot', Subtype: 'Square', P: paper.ref,
    Rect: [315, 425, 445, 465], F: 4 | 64, C: [0.1, 0.2, 0.3],
    AP: square.dict.get(PDFName.of('AP')), Contents: PDFHexString.fromText('Source locked square'),
    ZuviAnnotationId: PDFHexString.fromText('native-ui-locked-square'), NM: PDFHexString.fromText('native-ui-locked-square') }));
  paper.node.addAnnot(locked);
  const note = pdf.context.register(pdf.context.obj({ Type: 'Annot', Subtype: 'Text', P: paper.ref,
    Rect: [430, 520, 430, 520], F: 4, Name: 'Note', Contents: PDFHexString.fromText('Source zero-rect no-AP note'),
    ZuviAnnotationId: PDFHexString.fromText('native-ui-noap-note'), NM: PDFHexString.fromText('native-ui-noap-note') }));
  paper.node.addAnnot(note);
  return new Uint8Array(await pdf.save({ updateFieldAppearances: false, useObjectStreams: false }));
}
async function nativeIds(page: Page) {
  return page.locator('.zuvi-studio-pdf-native-hit').evaluateAll(elements => elements.map(element => element.getAttribute('data-native-id')!));
}
function hit(page: Page, id: string): Locator {
  return page.locator(`.zuvi-studio-pdf-native-hit[data-native-id="${id}"]`);
}
async function choose(page: Page, tool: Tool) {
  await waitReady(page);
  if (tool === 'freeText') {
    await page.getByRole('button', { name: '文字', exact: true }).click();
    return;
  }
  const select = page.getByRole('button', { name: /^PDF 新增批注类型/ });
  if (!(await select.count())) await page.getByRole('button', { name: '新增批注', exact: true }).click();
  await select.click();
  await page.getByRole('option', { name: new RegExp('^' + labels[tool] + '(?: ✓)?$') }).click();
}
async function point(page: Page, x: number, y: number) {
  const paper = page.locator('.zuvi-studio-pdf-paper');
  const box = await paper.boundingBox();
  if (!box) throw new Error('Native paper has no rendered bounds');
  return { x: box.x + x * box.width / 500, y: box.y + (700 - y) * box.height / 700 };
}
async function create(page: Page, tool: Tool, points: readonly (readonly [number, number])[], contents = '') {
  const previous = await nativeIds(page);
  await choose(page, tool);
  await page.getByLabel('PDF 新增文字', { exact: true }).fill(contents);
  const first = await point(page, points[0][0], points[0][1]);
  await page.mouse.move(first.x, first.y); await page.mouse.down();
  for (const [x, y] of points.slice(1)) {
    const target = await point(page, x, y); await page.mouse.move(target.x, target.y, { steps: 4 });
  }
  await page.mouse.up();
  await expect.poll(async () => (await nativeIds(page)).length).toBe(previous.length + 1);
  await waitReady(page);
  const added = (await nativeIds(page)).find(id => !previous.includes(id));
  if (!added) throw new Error('No accepted native annotation identity');
  return added;
}
async function properties(page: Page, id: string) {
  await hit(page, id).click();
  await page.getByRole('button', { name: '编辑批注属性', exact: true }).click();
  const dialog = page.getByRole('dialog').filter({ has: page.getByLabel('PDF 批注横坐标', { exact: true }) });
  await expect(dialog).toBeVisible();
  return dialog;
}
async function selectValue(page: Page, scope: Locator, label: string, option: string) {
  const trigger = scope.getByRole('button', { name: new RegExp('^' + label) });
  if ((await trigger.innerText()).trim() === option) return;
  await trigger.click();
  await page.getByRole('option', { name: new RegExp('^' + option + '(?: ✓)?$') }).click();
}
async function color(page: Page, scope: Locator, label: string, value: string) {
  await scope.getByRole('button', { name: label, exact: true }).click();
  const input = page.locator('.zuvi-color-picker-panel input[data-part="hex"]');
  await input.fill(value); await input.press('Enter'); await input.press('Escape');
}
async function saveProperties(page: Page, dialog: Locator) {
  await dialog.getByRole('button', { name: '应用批注属性', exact: true }).click();
  await expect(dialog).toHaveCount(0); await waitReady(page);
}
async function exported(page: Page, name: string) {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出文件', exact: true }).click();
  const download = await pending, file = await download.path();
  if (!file) throw new Error('Native PDF download has no bytes');
  const bytes = await readFile(file); await writeFile(path.join(audit, name), bytes);
  await writeFile(path.join(audit, name.replace(/\.pdf$/, '.json')), JSON.stringify(await inspect(bytes), null, 2));
  return bytes;
}
async function reopenTwice(page: Page, prefix: string, original: Uint8Array, verify: (pdf: PDFDocument, round: number) => Promise<void> | void) {
  const originalHashes = contentRecords(await PDFDocument.load(original)).map(item => item.sha256);
  let bytes: Uint8Array = original;
  for (let round = 1; round <= 2; round++) {
    bytes = await exported(page, `${prefix}-round-${round}.pdf`);
    const pdf = await PDFDocument.load(bytes), hashes = contentRecords(pdf).map(item => item.sha256);
    for (const hash of originalHashes) expect(hashes).toContain(hash);
    for (const hash of hashes) expect(originalHashes).toContain(hash);
    await verify(pdf, round);
    await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({ name: `${prefix}-round-${round}.pdf`, mimeType: 'application/pdf', buffer: Buffer.from(bytes) });
    await waitReady(page);
  }
  return bytes;
}
async function persistFixture(page: Page, kind: 'legacy' | 'recipe') {
  await mkdir(audit, { recursive: true });
  const bytes = await readFile(path.join(hostEvidence, 'original.pdf'));
  await page.goto('/');
  const document = await page.evaluate(async ({ bytes, kind }) => {
    const codecPath = '/src/pages/collaboration/office-studio/studio-pdf-codec.ts';
    const storagePath = '/src/pages/collaboration/office-studio/studio-storage.ts';
    const codec = await import(codecPath) as typeof import('../docs/src/pages/collaboration/office-studio/studio-pdf-codec');
    const storageModule = await import(storagePath) as typeof import('../docs/src/pages/collaboration/office-studio/studio-storage');
    const source = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
    let document = await codec.importStudioPdf(source, `Persisted-${kind}.pdf`, { native: false });
    if (kind === 'legacy') {
      document = { ...document, marks: [
        { id: 'legacy-ui-text', type: 'text', page: 0, x: 45, y: 570, size: 14, color: '#253044', text: '旧中文批注继续编辑', replies: [{ id: 'legacy-ui-reply', text: '旧回复保留一次' }] },
        { id: 'legacy-ui-highlight', type: 'highlight', page: 0, x: 45, y: 520, width: 250, height: 18, size: 12, text: 'Old highlight', color: '#f5c542' },
        { id: 'legacy-ui-square', type: 'rectangle', page: 0, x: 45, y: 430, width: 180, height: 45, size: 12, text: 'Old square', color: '#253044', lineWidth: 2 },
        { id: 'legacy-ui-ink', type: 'ink', page: 0, x: 270, y: 420, width: 140, height: 50, size: 12, text: 'Old ink', color: '#253044', lineWidth: 2, points: [[270, 430], [315, 465], [360, 420], [410, 460]] },
      ] };
    } else {
      const workspacePath = '/src/pages/collaboration/office-studio/studio-pdf-native/workspace.ts';
      const documentPath = '/src/pages/collaboration/office-studio/studio-pdf-native-document.ts';
      const native = await import(workspacePath) as typeof import('../docs/src/pages/collaboration/office-studio/studio-pdf-native/workspace');
      const helpers = await import(documentPath) as typeof import('../docs/src/pages/collaboration/office-studio/studio-pdf-native-document');
      let workspace = await native.NativePdfWorkspace.read(new Uint8Array(bytes), document.pages!.map(page => page.id));
      const now = new Date().toISOString();
      workspace = workspace.accept({ type: 'create', now, annotation: {
        id: 'recipe-ui-main', pageId: document.pages![0].id, kind: 'freeText', rect: [45, 430, 330, 480],
        contents: '未保存记录原生中文', font: { family: 'Noto Sans SC', size: 16, color: [0.1, 0.2, 0.3] },
      } });
      const targets = [
        { id: document.pages![1].id, fromPageId: document.pages![1].id },
        { id: 'recipe-ui-copy', fromPageId: document.pages![0].id, copyGroup: 'recipe-ui-copy-group' },
        { id: document.pages![0].id, fromPageId: document.pages![0].id },
      ];
      workspace = workspace.layout(targets);
      const copied = workspace.snapshot().annotations.find(item => item.originId === 'recipe-ui-main' && item.pageId === 'recipe-ui-copy');
      if (!copied) throw new Error('Recipe copy is missing');
      workspace = workspace.accept({ type: 'update', id: copied.id, patch: { kind: 'freeText', contents: '复制记录有独立中文' }, now });
      const mapped = helpers.remapNativePdfFields(document, targets);
      document = helpers.withNativePdfState({ ...document, ...mapped, rotations: { '1': 90 },
        fields: mapped.fields.map(field => field.name === 'reviewer' ? { ...field, value: 'Recipe current field' } : field) }, workspace);
    }
    const storage = storageModule.createStudioStorage();
    await storage.commit({ id: document.id, document, source, revision: 1, savedAt: Date.now() }, 0);
    await storage.select(document.id);
    return document;
  }, { bytes: [...bytes], kind });
  await writeFile(path.join(audit, `fixture-${kind}-source.pdf`), bytes);
  await writeFile(path.join(audit, `fixture-${kind}-model.json`), JSON.stringify(document, null, 2));
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto('/#/components/office-studio'); await waitReady(page);
  await page.getByRole('button', { name: '全屏编辑', exact: true }).click();
  return { bytes, document };
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.exposeFunction('nativeBrowserErrors', () => errors);
});
test.afterEach(async ({ page }, info) => {
  if (info.status !== info.expectedStatus) {
    const saved = await page.evaluate(async () => {
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('zuvi-office-studio', 2);
        request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
      });
      const read = (store: string, key: IDBValidKey) => new Promise<unknown>((resolve, reject) => {
        const request = database.transaction(store).objectStore(store).get(key);
        request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
      });
      try {
        const id = await read('preferences', 'active');
        if (typeof id !== 'string') return null;
        const file = await read('files', id) as import('../docs/src/pages/collaboration/office-studio/studio-storage').StudioStoredFile | undefined;
        if (!file?.source || file.document.kind !== 'pdf') return null;
        return { document: file.document, revision: file.revision, bytes: [...new Uint8Array(await file.source.arrayBuffer())] };
      } finally { database.close(); }
    }).catch(() => null);
    if (saved) {
      const directory = path.join(audit, 'failed-active-pairs', new Date().toISOString().replace(/[:.]/g, '-') + '-' + info.title.slice(0, 40).replace(/[^a-z\d]/gi, '-'));
      await mkdir(directory, { recursive: true });
      await writeFile(path.join(directory, 'active.pdf'), new Uint8Array(saved.bytes));
      await writeFile(path.join(directory, 'active.json'), JSON.stringify({ document: saved.document, revision: saved.revision, sourceHash: sha(new Uint8Array(saved.bytes)) }, null, 2));
      await page.screenshot({ path: path.join(directory, 'page.png'), fullPage: true, animations: 'disabled' }).catch(() => undefined);
    }
  }
  const errors = await page.evaluate(async () => {
    const reader = (window as unknown as { nativeBrowserErrors?: () => Promise<string[]> }).nativeBrowserErrors;
    return reader ? reader() : [];
  }).catch(() => [] as string[]);
  await info.attach('native-page-errors', { body: JSON.stringify(errors), contentType: 'application/json' });
  expect(errors).toEqual([]);
});

test('P012 creates and formats CJK FreeText with transactional history, IME drafts, native AP and two reopens', async ({ page }) => {
  test.setTimeout(180000);
  const original = await open(page), id = await create(page, 'freeText', [[45, 590]], '中文原生批注');
  let dialog = await properties(page, id);
  await expect(dialog.getByRole('checkbox', { name: '无颜色', exact: true })).toBeChecked();
  await dialog.getByLabel('PDF 批注内容', { exact: true }).fill('中文原生批注\n第二行可编辑');
  await dialog.getByLabel('PDF 批注横坐标').fill('55'); await dialog.getByLabel('PDF 批注纵坐标').fill('500');
  await dialog.getByLabel('PDF 批注宽度').fill('290'); await dialog.getByLabel('PDF 批注高度').fill('80');
  await dialog.getByLabel('PDF 批注字号', { exact: true }).fill('18');
  await selectValue(page, dialog, 'PDF 批注对齐', '居中');
  await color(page, dialog, 'PDF 批注文字颜色', '#234567');
  await dialog.getByLabel('PDF 批注不透明度百分比').fill('65');
  await saveProperties(page, dialog);
  dialog = await properties(page, id);
  await expect(dialog.getByLabel('PDF 批注宽度')).toHaveValue('290');
  await dialog.getByRole('button', { name: '取消', exact: true }).click();
  await page.getByRole('button', { name: '撤销', exact: true }).click(); await waitReady(page);
  dialog = await properties(page, id);
  await expect(dialog.getByLabel('PDF 批注内容', { exact: true })).toHaveValue('中文原生批注');
  await expect(dialog.getByLabel('PDF 批注字号', { exact: true })).toHaveValue('16');
  await dialog.getByRole('button', { name: '取消', exact: true }).click();
  await page.getByRole('button', { name: '重做', exact: true }).click(); await waitReady(page);
  const prior = await activeRecord(page);
  dialog = await properties(page, id);
  const input = dialog.getByLabel('PDF 批注内容', { exact: true });
  await input.dispatchEvent('compositionstart'); await input.fill('正在输入中文草稿');
  await dialog.getByRole('button', { name: '应用批注属性', exact: true }).click();
  await expect(dialog).toBeVisible();
  await input.dispatchEvent('compositionend');
  await dialog.getByLabel('PDF 批注宽度').fill('bad');
  await dialog.getByRole('button', { name: '应用批注属性', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('有效的数值');
  await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
  const cancelled = await activeRecord(page); expect(cancelled.sourceHash).toBe(prior.sourceHash);
  expect(cancelled.document).toEqual(prior.document);
  await reopenTwice(page, 'p012-freetext', original, pdf => {
    const record = annots(pdf).find(item => item.id === id)!;
    expect(record.subtype).toBe('FreeText'); expect(record.contents).toBe('中文原生批注\n第二行可编辑');
    expect(record.rect).toEqual([55, 500, 345, 580]); expect(numbersAsScalar(record.dict, 'CA')).toBe(0.65);
    expect(numbersAsScalar(record.dict, 'Q')).toBe(1); expect(record.dict.lookup(PDFName.of('AP'))).toBeInstanceOf(PDFDict);
    expect(pdf.getForm().getTextField('reviewer').getText()).toBe('Initial');
  });
  await page.screenshot({ path: path.join(audit, 'p012-light.png'), fullPage: true, animations: 'disabled' });
  await page.getByRole('button', { name: '退出全屏', exact: true }).click();
  await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  await page.getByRole('button', { name: '全屏编辑', exact: true }).click();
  await page.screenshot({ path: path.join(audit, 'p012-dark.png'), fullPage: true, animations: 'disabled' });
  dialog = await properties(page, id); await page.setViewportSize({ width: 320, height: 800 });
  expect((await dialog.boundingBox())!.width).toBeLessThanOrEqual(320);
  const dimensions = await dialog.evaluate(element => ({ width: element.clientWidth, scroll: element.scrollWidth }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width + 1);
  await page.screenshot({ path: path.join(audit, 'p012-dark-dialog-320.png'), fullPage: true, animations: 'disabled' });
  await dialog.getByRole('button', { name: '取消', exact: true }).click();
});

test('P014 saves four text markers from actual original-text selections with exact native quads, alpha, removal and undo', async ({ page }) => {
  test.setTimeout(180000);
  const original = await open(page), ids: string[] = [], selections: { id: string; text: string }[] = [];
  const tools = ['highlight', 'underline', 'strikeOut', 'squiggly'] as const;
  for (const [index, tool] of tools.entries()) {
    const previous = await nativeIds(page);
    await page.getByRole('button', { name: '选择文字', exact: true }).click();
    const span = page.locator('.zuvi-studio-pdf-text-layer span').filter({ hasText: index < 2 ? 'Native PDF host migration' : 'Original Contents remain independent' }).first();
    const box = await span.boundingBox(); if (!box) throw new Error('Original text selection span is missing');
    const start = index % 2 ? 0.55 : 0.05, end = index % 2 ? 0.9 : 0.4;
    await page.mouse.move(box.x + box.width * start, box.y + box.height / 2); await page.mouse.down();
    await page.mouse.move(box.x + box.width * end, box.y + box.height / 2, { steps: 12 }); await page.mouse.up();
    const selected = await page.evaluate(() => document.getSelection()?.toString() ?? '');
    expect(selected.trim().length).toBeGreaterThan(2);
    await choose(page, tool);
    const applySelection = page.getByRole('button', { name: '应用到所选文字', exact: true });
    await expect(applySelection).toBeEnabled(); await applySelection.click();
    await expect.poll(async () => (await nativeIds(page)).length).toBe(previous.length + 1); await waitReady(page);
    const id = (await nativeIds(page)).find(id => !previous.includes(id))!; ids.push(id); selections.push({ id, text: selected });
    const dialog = await properties(page, id);
    await dialog.getByLabel('PDF 批注内容', { exact: true }).fill(selected);
    await dialog.getByLabel('PDF 批注不透明度百分比').fill('45');
    await color(page, dialog, 'PDF 批注线条或背景颜色', '#e08020');
    await saveProperties(page, dialog);
  }
  // Selecting text already covered by a native marker must remain a real mouse interaction.
  await page.getByRole('button', { name: '选择文字', exact: true }).click();
  const covered = page.locator('.zuvi-studio-pdf-text-layer span').filter({ hasText: 'Native PDF host migration' }).first();
  const coveredBox = await covered.boundingBox(); if (!coveredBox) throw new Error('Covered original text span is missing');
  await page.mouse.move(coveredBox.x + coveredBox.width * 0.05, coveredBox.y + coveredBox.height / 2); await page.mouse.down();
  await page.mouse.move(coveredBox.x + coveredBox.width * 0.4, coveredBox.y + coveredBox.height / 2, { steps: 12 }); await page.mouse.up();
  expect(await page.evaluate(() => document.getSelection()?.toString() ?? '')).toBe(selections[0].text);
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.keyboard.press('ControlOrMeta+C');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(selections[0].text);
  await choose(page, 'underline');
  await page.getByRole('button', { name: '应用到所选文字', exact: true }).click();
  await expect.poll(async () => (await nativeIds(page)).length).toBe(5); await waitReady(page);
  const repeated = (await nativeIds(page)).find(id => !ids.includes(id))!;
  await hit(page, ids[3]).click();
  await page.getByRole('button', { name: '删除选中标注', exact: true }).click();
  await expect(hit(page, ids[3])).toHaveCount(0);
  await page.getByRole('button', { name: '撤销', exact: true }).click(); await expect(hit(page, ids[3])).toBeVisible(); await waitReady(page);
  await writeFile(path.join(audit, 'p014-source-selections.json'), JSON.stringify(selections, null, 2));
  await reopenTwice(page, 'p014-markers', original, pdf => {
    for (const [index, id] of ids.entries()) {
      const item = annots(pdf).find(item => item.id === id)!;
      expect(item.subtype).toBe(['Highlight', 'Underline', 'StrikeOut', 'Squiggly'][index]);
      expect(item.contents).toBe(selections[index].text); expect(numbers(item.dict, 'QuadPoints')).toHaveLength(8);
      expect(numbers(item.dict, 'QuadPoints').every(Number.isFinite)).toBe(true);
      expect(numbers(item.dict, 'C')).toEqual([224 / 255, 128 / 255, 32 / 255]);
      expect(numbersAsScalar(item.dict, 'CA')).toBe(0.45);
    }
    expect(annots(pdf).find(item => item.id === repeated)?.subtype).toBe('Underline');
  });
  await page.screenshot({ path: path.join(audit, 'p014-four-markers.png'), fullPage: true, animations: 'disabled' });
});

test('P016 creates native shapes, arrow, polyline and ink through real pointers and edits fill, dash, ends and vertices', async ({ page }) => {
  test.setTimeout(240000);
  const original = await open(page), ids = new Map<Tool, string>();
  const drawings: [Tool, readonly (readonly [number, number])[]][] = [
    ['square', [[40, 570], [180, 520]]], ['circle', [[240, 570], [410, 510]]],
    ['line', [[40, 470], [180, 430]]], ['arrow', [[240, 470], [410, 430]]],
    ['polygon', [[45, 340], [110, 405], [190, 345], [125, 320]]],
    ['polyLine', [[250, 325], [285, 400], [330, 340], [405, 385]]],
    ['ink', [[50, 250], [90, 290], [140, 245], [190, 285]]],
  ];
  for (const [tool, points] of drawings) ids.set(tool, await create(page, tool, points, 'UI ' + tool));
  let dialog = await properties(page, ids.get('square')!);
  await dialog.getByRole('checkbox', { name: '无填充', exact: true }).uncheck();
  await color(page, dialog, 'PDF 批注填充颜色', '#aaddff');
  await color(page, dialog, 'PDF 批注线条或背景颜色', '#334455');
  await dialog.getByLabel('PDF 批注不透明度百分比').fill('60');
  await dialog.getByLabel('PDF 批注线宽', { exact: true }).fill('3');
  await selectValue(page, dialog, 'PDF 批注线型', '虚线'); await saveProperties(page, dialog);
  dialog = await properties(page, ids.get('circle')!);
  await dialog.getByLabel('PDF 批注宽度').fill('160'); await dialog.getByLabel('PDF 批注高度').fill('70'); await saveProperties(page, dialog);
  for (const tool of ['line', 'arrow'] as const) {
    dialog = await properties(page, ids.get(tool)!);
    await selectValue(page, dialog, 'PDF 批注起点形状', '圆形');
    await selectValue(page, dialog, 'PDF 批注终点形状', '实心箭头'); await saveProperties(page, dialog);
  }
  dialog = await properties(page, ids.get('polygon')!);
  await dialog.getByLabel('PDF 批注顶点坐标').fill('not a vertex');
  await dialog.getByRole('button', { name: '应用批注属性', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('每行请填写一组');
  await dialog.getByLabel('PDF 批注顶点坐标').fill('55, 340\n110, 390\n175, 345'); await saveProperties(page, dialog);
  dialog = await properties(page, ids.get('polyLine')!);
  await dialog.getByLabel('PDF 批注顶点坐标').fill('270, 340\n290, 380\n330, 345\n385, 375');
  await selectValue(page, dialog, 'PDF 批注终点形状', '空心箭头'); await saveProperties(page, dialog);
  dialog = await properties(page, ids.get('ink')!);
  const inkWidth = Number(await dialog.getByLabel('PDF 批注宽度').inputValue());
  await dialog.getByLabel('PDF 批注宽度').fill(String(inkWidth + 20)); await saveProperties(page, dialog);
  await reopenTwice(page, 'p016-geometry', original, pdf => {
    const records = annots(pdf);
    expect([...new Set(records.filter(item => item.subtype !== 'Widget').map(item => item.subtype))].sort()).toEqual(['Circle', 'Ink', 'Line', 'PolyLine', 'Polygon', 'Square']);
    for (const id of ids.values()) expect(records.find(item => item.id === id)?.dict.lookup(PDFName.of('AP'))).toBeInstanceOf(PDFDict);
    const square = records.find(item => item.id === ids.get('square'))!;
    expect(numbers(square.dict, 'IC')).toEqual([170 / 255, 221 / 255, 1]); expect(numbersAsScalar(square.dict, 'CA')).toBe(0.6);
    expect(decoded(square.dict.lookup(PDFName.of('BS')) as PDFDict, 'S')).toBe('D');
    for (const tool of ['line', 'arrow'] as const) {
      const ends = records.find(item => item.id === ids.get(tool))!.dict.lookup(PDFName.of('LE')) as PDFArray;
      expect(ends.asArray().map(value => value.toString())).toEqual(['/Circle', '/ClosedArrow']);
    }
    expect(numbers(records.find(item => item.id === ids.get('polygon'))!.dict, 'Vertices')).toEqual([55, 340, 110, 390, 175, 345]);
    const ink = records.find(item => item.id === ids.get('ink'))!.dict.lookup(PDFName.of('InkList')) as PDFArray;
    expect((pdf.context.lookup(ink.asArray()[0]) as PDFArray).size()).toBeGreaterThanOrEqual(8);
  });
  await writeFile(path.join(audit, 'p016-created-ids.json'), JSON.stringify(Object.fromEntries(ids), null, 2));
  await page.screenshot({ path: path.join(audit, 'p016-geometry.png'), fullPage: true, animations: 'disabled' });
});

test('P012/P016 moving and resizing show ghosts, cancel without history and accept one undoable pointer transaction', async ({ page }) => {
  test.setTimeout(180000);
  const original = await open(page, 'native-twelve-types.pdf');
  const id = await page.locator('.zuvi-studio-pdf-native-hit[data-native-kind="square"]').first().getAttribute('data-native-id');
  if (!id) throw new Error('Native source square is missing');
  await expect(page.getByRole('button', { name: '撤销', exact: true })).toBeDisabled();
  const before = await activeRecord(page), box = await hit(page, id).boundingBox(); if (!box) throw new Error('Native source hit bounds are missing');
  await hit(page, id).focus(); await page.mouse.move(box.x + 15, box.y + 15); await page.mouse.down();
  await page.mouse.move(box.x + 5, box.y + 25, { steps: 8 });
  await expect(page.locator('.zuvi-studio-pdf-native-preview rect[stroke-dasharray]')).toBeVisible();
  await expect(page.getByRole('button', { name: '撤销', exact: true })).toBeDisabled();
  await page.keyboard.press('Escape'); await page.mouse.up();
  await expect(page.locator('.zuvi-studio-pdf-native-preview rect[stroke-dasharray]')).toHaveCount(0);
  expect((await activeRecord(page)).sourceHash).toBe(before.sourceHash);
  await page.mouse.move(box.x + 15, box.y + 15); await page.mouse.down();
  await page.mouse.move(box.x + 5, box.y + 25, { steps: 8 }); await page.mouse.up(); await waitReady(page);
  let dialog = await properties(page, id);
  const movedX = Number(await dialog.getByLabel('PDF 批注横坐标').inputValue()), movedY = Number(await dialog.getByLabel('PDF 批注纵坐标').inputValue());
  const old = before.document.marks.find(item => item.nativeId === id)!;
  expect(movedX).toBeCloseTo(old.x - 10, 1); expect(movedY).toBeCloseTo(old.y - 10, 1);
  await dialog.getByRole('button', { name: '取消', exact: true }).click();
  await page.getByRole('button', { name: '撤销', exact: true }).click(); await waitReady(page);
  expect((await activeRecord(page)).sourceHash).toBe(before.sourceHash);
  await expect(page.getByRole('button', { name: '撤销', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: '重做', exact: true }).click(); await waitReady(page);
  await hit(page, id).focus(); await hit(page, id).press('Shift+ArrowRight'); await waitReady(page);
  dialog = await properties(page, id); await expect(dialog.getByLabel('PDF 批注横坐标')).toHaveValue(String(movedX + 10));
  await dialog.getByRole('button', { name: '取消', exact: true }).click();
  await hit(page, id).click();
  const resize = hit(page, id).locator('.zuvi-studio-pdf-native-resize'), handle = await resize.boundingBox(); if (!handle) throw new Error('Resize handle is missing');
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2); await page.mouse.down();
  await page.mouse.move(handle.x + handle.width / 2 + 20, handle.y + handle.height / 2 + 10, { steps: 6 }); await page.mouse.up(); await waitReady(page);
  dialog = await properties(page, id); await expect(dialog.getByLabel('PDF 批注宽度')).toHaveValue(String(old.width! + 20));
  await expect(dialog.getByLabel('PDF 批注高度')).toHaveValue(String(old.height! + 10));
  await dialog.getByRole('button', { name: '取消', exact: true }).click();
  await reopenTwice(page, 'gesture-history', original, pdf => expect(annots(pdf).find(item => item.id === id)?.rect).toEqual([movedX + 10, movedY - 10, movedX + 10 + old.width! + 20, movedY + old.height!]));
});

test('P015 reads native notes, writes authored IRT replies and resolve/reopen state, and deletes replies/parents transactionally', async ({ page }) => {
  test.setTimeout(180000);
  const original = await open(page, 'native-twelve-types.pdf'), id = 'native-note';
  const originalAnnotations = annots(await PDFDocument.load(original));
  const originalParent = originalAnnotations.find(item => item.id === id)!;
  const originalReplyCount = originalAnnotations.filter(item => item.dict.get(PDFName.of('IRT'))?.toString() === originalParent.ref.toString() && decoded(item.dict, 'RT') === 'R').length;
  await page.getByLabel('PDF 批注署名', { exact: true }).fill('原生浏览器审阅者');
  const createdNote = await create(page, 'note', [[435, 650]], '浏览器新增便签');
  const noteProperties = await properties(page, createdNote);
  await noteProperties.getByLabel('PDF 批注横坐标').fill('425');
  await noteProperties.getByLabel('PDF 批注纵坐标').fill('605');
  await noteProperties.getByLabel('PDF 批注不透明度百分比').fill('80');
  await saveProperties(page, noteProperties);
  await hit(page, id).click(); await expect(page.getByText('Native note with IRT discussion', { exact: true }).first()).toBeVisible();
  const firstReply = page.getByLabel('PDF 回复内容', { exact: true });
  const beforeReplyComposition = await activeRecord(page);
  await firstReply.dispatchEvent('compositionstart');
  await firstReply.fill('第一条原生回复');
  await firstReply.dispatchEvent('keydown', { key: 'Enter', code: 'Enter', isComposing: true, bubbles: true });
  expect((await activeRecord(page)).sourceHash).toBe(beforeReplyComposition.sourceHash);
  await firstReply.dispatchEvent('compositionend');
  await firstReply.press('Enter'); await waitReady(page);
  await page.getByLabel('PDF 回复内容', { exact: true }).fill('第二条原生回复'); await page.getByRole('button', { name: '回复', exact: true }).click(); await waitReady(page);
  await page.getByRole('button', { name: '解决讨论', exact: true }).click(); await waitReady(page);
  await expect(page.getByText(`回复（${originalReplyCount + 2}） · 已解决`, { exact: true })).toBeVisible();
  const resolved = await exported(page, 'p015-resolved.pdf');
  const resolvedInfo = await inspect(resolved);
  expect(resolvedInfo.annotations.some(item => item.replyTo === id && item.state === 'Completed' && item.stateModel === 'Review')).toBe(true);
  for (const text of ['第一条原生回复', '第二条原生回复']) {
    const reply = resolvedInfo.annotations.find(item => item.contents === text)!;
    expect(reply.replyTo).toBe(id); expect(reply.replyType).toBe('R'); expect(reply.author).toBe('原生浏览器审阅者'); expect(reply.created).toMatch(/^D:\d{14}Z$/);
  }
  await page.getByRole('button', { name: '重新打开讨论', exact: true }).click(); await waitReady(page);
  const beforeReplyRemoval = await activeRecord(page);
  await page.getByRole('button', { name: '删除回复 第二条原生回复', exact: true }).click(); await waitReady(page);
  await expect(page.getByText('第二条原生回复', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '撤销', exact: true }).click(); await waitReady(page);
  const restoredReply = await activeRecord(page);
  expect(restoredReply.sourceHash).toBe(beforeReplyRemoval.sourceHash);
  expect(restoredReply.document).toEqual(beforeReplyRemoval.document);
  // History clears object selection; reselecting the preserved parent is a view-only action.
  await hit(page, id).click();
  await expect(page.getByText('第二条原生回复', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '删除选中标注', exact: true }).click(); await expect(hit(page, id)).toHaveCount(0); await waitReady(page);
  const deleted = await exported(page, 'p015-parent-deleted.pdf');
  expect((await inspect(deleted)).annotations.some(item => item.id === id || item.replyTo === id)).toBe(false);
  await page.getByRole('button', { name: '撤销', exact: true }).click(); await waitReady(page);
  await reopenTwice(page, 'p015-discussion', original, pdf => {
    const records = annots(pdf), parent = records.find(item => item.id === id)!;
    expect(parent.subtype).toBe('Text');
    const created = records.find(item => item.id === createdNote)!;
    expect(created.subtype).toBe('Text'); expect(created.contents).toBe('浏览器新增便签');
    expect(decoded(created.dict, 'T')).toBe('原生浏览器审阅者');
    expect(created.rect).toEqual([425, 605, 447, 627]); expect(numbersAsScalar(created.dict, 'CA')).toBe(0.8);
    for (const text of ['第一条原生回复', '第二条原生回复']) {
      const reply = records.find(item => item.contents === text)!; expect(reply.dict.get(PDFName.of('IRT'))?.toString()).toBe(parent.ref.toString());
      expect(decoded(reply.dict, 'T')).toBe('原生浏览器审阅者');
    }
  });
});

test('legacy four-kind persisted documents migrate through the actual entry once and undo restores the original pair', async ({ page }) => {
  test.setTimeout(180000);
  const { bytes, document } = await persistFixture(page, 'legacy');
  await expect(page.getByRole('button', { name: '保留旧批注编辑能力', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: '保留旧批注编辑能力', exact: true }).click(); await waitReady(page);
  await expect(page.getByRole('button', { name: '保留旧批注编辑能力', exact: true })).toHaveCount(0);
  let current = await activeRecord(page);
  expect(current.document.marks.filter(mark => mark.nativeId)).toHaveLength(4); expect(current.document.nativeAnnotations?.commands).toEqual([]);
  await page.getByRole('button', { name: '撤销', exact: true }).click(); await waitReady(page);
  current = await activeRecord(page); expect(current.sourceHash).toBe(sha(bytes)); expect(current.document.marks).toEqual(document.marks);
  await page.getByRole('button', { name: '重做', exact: true }).click(); await waitReady(page);
  let identities: string[] | undefined, creation: string[] | undefined;
  await reopenTwice(page, 'legacy-migration', bytes, pdf => {
    const records = annots(pdf).filter(item => item.subtype !== 'Widget');
    const ids = records.map(item => item.id).sort(), dates = records.map(item => decoded(item.dict, 'CreationDate')).sort();
    identities ??= ids; creation ??= dates; expect(ids).toEqual(identities); expect(dates).toEqual(creation);
    expect(records.filter(item => item.subtype === 'FreeText')).toHaveLength(1);
    expect(records.filter(item => decoded(item.dict, 'RT') === 'R')).toHaveLength(1);
    expect(records.find(item => item.contents === '旧中文批注继续编辑')?.subtype).toBe('FreeText');
  });
});

test('nonempty persisted native recipe renders current copied AP/text/paint/thumbnail order without accepting or double-transforming the source', async ({ page }) => {
  test.setTimeout(180000);
  const { bytes, document } = await persistFixture(page, 'recipe');
  expect(document.nativeAnnotations?.commands).toHaveLength(3);
  let record = await activeRecord(page); expect(record.sourceHash).toBe(sha(bytes)); expect(record.revision).toBe(1);
  const firstText = page.locator('.zuvi-studio-pdf-text-layer');
  await expect(firstText).toContainText('page 2');
  await page.getByRole('button', { name: 'PDF 页面缩略图侧栏', exact: true }).click();
  await expect(page.getByRole('button', { name: /PDF 第 \d+ 页缩略图/ })).toHaveCount(3);
  await page.getByRole('button', { name: 'PDF 第 2 页缩略图', exact: true }).click();
  await expect(firstText).toContainText('page 1');
  await expect(page.locator('.zuvi-studio-pdf-paper')).toHaveCSS('width', '700px');
  await expect(page.locator('.zuvi-studio-pdf-paper')).toHaveCSS('height', '500px');
  const id = document.marks.find(mark => mark.nativeId && mark.text === '复制记录有独立中文')?.nativeId;
  if (!id) throw new Error('Persisted copied native projection is missing');
  await expect(hit(page, id)).toBeVisible();
  const bodyPixels = await hit(page, id).evaluate(element => {
    const paper = element.closest('.zuvi-studio-pdf-paper')!, canvas = paper.querySelector('canvas')!;
    const box = element.getBoundingClientRect(), parent = paper.getBoundingClientRect();
    const image = canvas.getContext('2d')!.getImageData(Math.max(0, Math.round((box.x - parent.x) * canvas.width / parent.width)),
      Math.max(0, Math.round((box.y - parent.y) * canvas.height / parent.height)),
      Math.max(1, Math.floor(box.width * canvas.width / parent.width)), Math.max(1, Math.floor(box.height * canvas.height / parent.height)));
    let dark = 0; for (let offset = 0; offset < image.data.length; offset += 4) if (Math.max(image.data[offset], image.data[offset + 1], image.data[offset + 2]) < 230) dark++;
    return dark;
  });
  expect(bodyPixels).toBeGreaterThan(100);
  await page.screenshot({ path: path.join(audit, 'nonempty-recipe-copy-preview.png'), fullPage: true, animations: 'disabled' });
  record = await activeRecord(page); expect(record.revision).toBe(1); expect(record.sourceHash).toBe(sha(bytes));
  await reopenTwice(page, 'nonempty-recipe', bytes, pdf => {
    expect(pdf.getPageCount()).toBe(3); expect(pdf.getPages().map(page => page.getRotation().angle)).toEqual([0, 90, 0]);
    expect(annots(pdf).find(item => item.id === id)?.contents).toBe('复制记录有独立中文');
    expect(pdf.getForm().getTextField('reviewer').getText()).toBe('Recipe current field');
  });
});

test('native read-only/locked commands and cancelling a pending CJK font preparation preserve source and history', async ({ page }) => {
  test.setTimeout(180000);
  const original = await open(page, 'native-locked-noap.pdf', false, await lockedAndNoApFixture());
  const first = await activeRecord(page);
  await expect.poll(async () => (await hit(page, 'native-ui-noap-note').boundingBox())?.width ?? 0).toBeGreaterThan(10);
  const icon = page.locator('.zuvi-studio-pdf-annotation-paint-layer [data-studio-annotation-id="native-ui-noap-note"]');
  await expect(icon).toBeVisible();
  const hitBox = await hit(page, 'native-ui-noap-note').boundingBox(), iconBox = await icon.boundingBox();
  expect(hitBox!.x).toBeCloseTo(iconBox!.x, 1); expect(hitBox!.y).toBeCloseTo(iconBox!.y, 1);
  expect(hitBox!.width).toBeCloseTo(iconBox!.width, 1); expect(hitBox!.height).toBeCloseTo(iconBox!.height, 1);
  await hit(page, 'native-ui-locked-square').click();
  await expect(page.getByRole('button', { name: '删除选中标注', exact: true })).toBeDisabled();
  await hit(page, 'native-ui-locked-square').press('ArrowRight');
  expect((await activeRecord(page)).sourceHash).toBe(first.sourceHash);
  const lockedProperties = await properties(page, 'native-ui-locked-square');
  await expect(lockedProperties.getByLabel('PDF 批注横坐标')).toBeDisabled();
  await expect(lockedProperties.getByLabel('PDF 批注内容', { exact: true })).toBeDisabled();
  await lockedProperties.getByRole('button', { name: '取消', exact: true }).click();
  await page.getByRole('switch', { name: '只读预览', exact: true }).check();
  await expect(page.getByLabel('PDF 批注署名', { exact: true })).toBeDisabled();
  await hit(page, 'native-note').click();
  await expect(page.getByRole('button', { name: '删除选中标注', exact: true })).toBeDisabled();
  await expect(page.getByLabel('PDF 回复内容', { exact: true })).toBeDisabled();
  const dialog = await properties(page, 'native-note');
  await expect(dialog.getByLabel('PDF 批注内容', { exact: true })).toBeDisabled();
  await expect(dialog.getByRole('button', { name: '应用批注属性', exact: true })).toBeDisabled();
  await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
  expect((await activeRecord(page)).sourceHash).toBe(first.sourceHash);
  expect(sha(await exported(page, 'permissions-readonly.pdf'))).toBe(sha(original));
  await page.getByRole('switch', { name: '只读预览', exact: true }).uncheck(); await waitReady(page);
  await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({ name: 'Font-cancellation.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await readFile(path.join(hostEvidence, 'original.pdf'))) });
  await waitReady(page); const before = await activeRecord(page);
  let release!: () => void, requested = false;
  const hold = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/office-pdf-assets/NotoSansSC.ttf', async route => { requested = true; await hold; await route.continue(); });
  await choose(page, 'freeText');
  await page.getByLabel('PDF 新增文字', { exact: true }).fill('准备时取消中文批注');
  await page.getByRole('button', { name: '放在当前页中央', exact: true }).click();
  await expect.poll(() => requested).toBe(true);
  await expect(page.getByLabel('PDF 新增文字', { exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: '放在当前页中央', exact: true })).toBeDisabled();
  await page.getByRole('switch', { name: '只读预览', exact: true }).check(); release();
  await expect(page.getByRole('button', { name: '撤销', exact: true })).toBeDisabled();
  const after = await activeRecord(page); expect(after.sourceHash).toBe(before.sourceHash); expect(after.document).toEqual(before.document);
  await page.getByRole('switch', { name: '只读预览', exact: true }).uncheck(); await waitReady(page);
});

test('all native families retain readable light/dark panes and 320px marker, discussion, line-end and polygon property layouts', async ({ page }) => {
  test.setTimeout(180000);
  await open(page, 'native-twelve-types.pdf');
  const before = await activeRecord(page);
  await page.screenshot({ path: path.join(audit, 'all-native-types-light.png'), fullPage: true, animations: 'disabled' });
  await hit(page, 'native-note').click();
  await page.screenshot({ path: path.join(audit, 'discussion-light.png'), fullPage: true, animations: 'disabled' });
  await page.getByRole('button', { name: '退出全屏', exact: true }).click();
  await page.getByRole('button', { name: '切换暗色', exact: true }).click();
  await page.getByRole('button', { name: '全屏编辑', exact: true }).click();
  await page.screenshot({ path: path.join(audit, 'all-native-types-dark.png'), fullPage: true, animations: 'disabled' });
  await page.setViewportSize({ width: 320, height: 800 });
  const inspector = page.locator('.zuvi-studio-pdf-native-inspector');
  await expect(inspector).toBeVisible();
  const pane = await inspector.evaluate(element => ({ width: element.clientWidth, scroll: element.scrollWidth }));
  expect(pane.scroll).toBeLessThanOrEqual(pane.width + 1);
  await page.screenshot({ path: path.join(audit, 'discussion-dark-320.png'), fullPage: true, animations: 'disabled' });
  for (const [label, name] of [['高亮', 'marker'], ['直线', 'line-end'], ['多边形', 'polygon']] as const) {
    await page.getByRole('button', { name: new RegExp('^第 1 页 · ' + label) }).click();
    await page.getByRole('button', { name: '编辑批注属性', exact: true }).click();
    const dialog = page.getByRole('dialog').filter({ has: page.getByLabel('PDF 批注横坐标', { exact: true }) });
    expect((await dialog.boundingBox())!.width).toBeLessThanOrEqual(320);
    const layout = await dialog.evaluate(element => ({ width: element.clientWidth, scroll: element.scrollWidth }));
    expect(layout.scroll).toBeLessThanOrEqual(layout.width + 1);
    await page.screenshot({ path: path.join(audit, `${name}-dark-properties-320.png`), fullPage: true, animations: 'disabled' });
    await dialog.getByRole('button', { name: '取消', exact: true }).click();
  }
  const after = await activeRecord(page);
  expect(after.sourceHash).toBe(before.sourceHash); expect(after.document).toEqual(before.document);
});

test('explicit native none colors and border colors survive two PDF reopens and later opacity or line-width edits', async ({ page }) => {
  test.setTimeout(180000);
  const original = await open(page), ids = {
    square: await create(page, 'square', [[40, 570], [170, 520]], 'Explicit none square'),
    highlight: await create(page, 'highlight', [[230, 550], [420, 530]], 'Explicit none highlight'),
    freeText: await create(page, 'freeText', [[40, 470]], 'Visible text with no border'),
  };
  for (const kind of ['square', 'highlight', 'freeText'] as const) {
    const dialog = await properties(page, ids[kind]);
    const none = dialog.getByRole('checkbox', { name: kind === 'freeText' ? '无边框颜色' : '无颜色', exact: true });
    await expect(none).not.toBeChecked();
    if (kind === 'freeText') await dialog.getByLabel('PDF 批注线宽', { exact: true }).fill('2');
    await none.check(); await saveProperties(page, dialog);
  }
  for (let round = 1; round <= 2; round++) {
    const bytes = await exported(page, `explicit-none-round-${round}.pdf`), pdf = await PDFDocument.load(bytes);
    for (const [kind, id] of Object.entries(ids)) {
      const record = annots(pdf).find(item => item.id === id)!;
      expect(numbers(record.dict, kind === 'freeText' ? 'IC' : 'C')).toEqual([]);
      expect(record.dict.lookup(PDFName.of(kind === 'freeText' ? 'IC' : 'C'))).toBeInstanceOf(PDFArray);
      const normal = (record.dict.lookup(PDFName.of('AP')) as PDFDict).lookup(PDFName.of('N')) as PDFRawStream;
      const operators = new TextDecoder().decode(decodePDFRawStream(normal).decode());
      expect(operators).not.toMatch(/(?:^|\s)(?:S|s|B|B\*|b|b\*|f|f\*|F)(?:\s|$)/);
      if (kind === 'freeText') expect(operators).toContain('Tj');
    }
    expect(contentRecords(pdf).map(item => item.sha256)).toEqual(contentRecords(await PDFDocument.load(original)).map(item => item.sha256));
    await page.getByLabel('导入文档文件', { exact: true }).setInputFiles({ name: `Explicit-none-${round}.pdf`, mimeType: 'application/pdf', buffer: bytes });
    await waitReady(page);
    if (round === 1) for (const kind of ['square', 'highlight', 'freeText'] as const) {
      const dialog = await properties(page, ids[kind]);
      await expect(dialog.getByRole('checkbox', { name: kind === 'freeText' ? '无边框颜色' : '无颜色', exact: true })).toBeChecked();
      await dialog.getByLabel(kind === 'freeText' ? 'PDF 批注线宽' : 'PDF 批注不透明度百分比', { exact: true }).fill(kind === 'freeText' ? '3' : '50');
      await saveProperties(page, dialog);
    }
  }
});
