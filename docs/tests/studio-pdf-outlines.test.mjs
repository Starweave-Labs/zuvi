import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { URL } from 'node:url';
import { pdfTestRuntime } from './studio-pdf-test-runtime.mjs';

const require = createRequire(new URL('../package.json', import.meta.url));
const {
  PDFDocument,
  PDFArray,
  PDFName,
  PDFHexString,
  PDFNumber,
  StandardFonts,
} = require('pdf-lib');
const { readPdfOutlines, writePdfOutlines, editPdfOutlineTree, validatePdfOutlines } =
  pdfTestRuntime().load('../src/pages/collaboration/office-studio/studio-pdf-outlines.ts');
const key = (value) => PDFName.of(value);
const pageIds = ['page-alpha', 'page-beta', 'page-gamma'];
const target = (pageId, kind = 'Fit', parameters = []) => ({ pageId, view: { kind, parameters } });
const node = (id, title, children = [], destination) => ({
  id,
  title,
  expanded: true,
  children,
  ...(destination ? { target: destination } : {}),
});
const contextBytes = (pdf) =>
  pdf.context
    .enumerateIndirectObjects()
    .map(([ref, object]) => ref.toString() + '=' + object.toString())
    .join('\n') + pdf.catalog.toString();
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const streamHashes = (pdf) =>
  pdf.getPages().map((page) => {
    const raw = page.node.Contents(),
      list = raw instanceof PDFArray ? raw.asArray() : raw ? [raw] : [];
    return list.map((ref) => digest(pdf.context.lookup(ref).getContents()));
  });
async function fixture() {
  const pdf = await PDFDocument.create({ updateMetadata: false });
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  for (let index = 0; index < 3; index++)
    pdf.addPage([300, 400]).drawText('PAGE_' + (index + 1), { x: 20, y: 350, font });
  const field = pdf.getForm().createTextField('Original field');
  field.setText('Preserved value');
  field.addToPage(pdf.getPages()[0], { x: 10, y: 20, width: 100, height: 20, font });
  const first = node('group', '章节组', [
    node('first', 'First target', [], target(pageIds[1], 'XYZ', [null, 120, 1.5])),
  ]);
  first.expanded = false;
  assert.equal(
    writePdfOutlines(pdf, pageIds, [first, node('last', 'Last target', [], target(pageIds[2]))]),
    true
  );
  return pdf;
}
const save = (pdf) => pdf.save({ useObjectStreams: false, updateFieldAppearances: false });
const reload = (bytes) => PDFDocument.load(bytes, { updateMetadata: false });
const titleAndTargets = (items) =>
  items.map(({ title, expanded, target: value, passiveNavigation, children }) => ({
    title,
    expanded,
    target: value,
    passiveNavigation,
    children: titleAndTargets(children),
  }));

test('reads a serializable native hierarchy and atomically edits, reorders, inserts and removes through two PDF saves', async () => {
  let pdf = await fixture();
  const source = await save(pdf),
    streams = streamHashes(pdf),
    sourceHash = digest(source);
  let tree = readPdfOutlines(pdf, pageIds);
  assert.equal(tree[0].title, '章节组');
  assert.equal(tree[0].expanded, false);
  assert.deepEqual(tree[0].children[0].target, target(pageIds[1], 'XYZ', [null, 120, 1.5]));
  assert.doesNotThrow(() => JSON.parse(JSON.stringify(tree)));
  const unchanged = contextBytes(pdf);
  assert.equal(writePdfOutlines(pdf, pageIds, tree), false);
  assert.equal(contextBytes(pdf), unchanged);
  const group = tree[0].id,
    child = tree[0].children[0].id,
    last = tree[1].id;
  tree = editPdfOutlineTree(tree, pageIds, {
    type: 'update',
    id: group,
    title: 'Edited 章节',
    expanded: true,
  });
  tree = editPdfOutlineTree(tree, pageIds, { type: 'move', id: last, parentId: group, index: 0 });
  tree = editPdfOutlineTree(tree, pageIds, {
    type: 'insert',
    parentId: group,
    index: 1,
    node: node('new-entry', 'New entry', [], target(pageIds[0], 'FitH', [260])),
  });
  tree = editPdfOutlineTree(tree, pageIds, { type: 'remove', id: child });
  const expected = titleAndTargets(tree);
  for (let pass = 0; pass < 2; pass++) {
    assert.equal(writePdfOutlines(pdf, pageIds, tree), true);
    const root = pdf.catalog.lookup(key('Outlines'));
    assert.equal(root.lookup(key('Count')).asNumber(), pass === 0 ? 3 : 1);
    assert.equal(root.lookup(key('First')).lookup(key('Count')).asNumber(), pass === 0 ? 2 : -2);
    pdf = await reload(await save(pdf));
    tree = readPdfOutlines(pdf, pageIds);
    assert.deepEqual(titleAndTargets(tree), expected);
    assert.deepEqual(streamHashes(pdf), streams);
    assert.equal(pdf.getForm().getTextField('Original field').getText(), 'Preserved value');
    if (pass === 0) {
      tree = editPdfOutlineTree(tree, pageIds, { type: 'update', id: tree[0].id, expanded: false });
      expected[0].expanded = false;
    }
  }
  assert.equal(digest(source), sourceHash);
});

test('resolves named and legacy destinations with all view kinds while retaining unchanged native destination identities', async () => {
  let pdf = await fixture();
  const root = pdf.catalog.lookup(key('Outlines')),
    first = root.lookup(key('First'));
  const child = first.lookup(key('First')),
    last = root.lookup(key('Last'));
  const named = pdf.context.obj([pdf.getPages()[1].ref, key('FitR'), 10, 20, 150, 350]);
  pdf.catalog.set(
    key('Names'),
    pdf.context.obj({ Dests: { Names: [PDFHexString.fromText('chapter'), { D: named }] } })
  );
  child.set(key('Dest'), PDFHexString.fromText('chapter'));
  pdf.catalog.set(
    key('Dests'),
    pdf.context.obj({ old: [pdf.getPages()[2].ref, key('FitBH'), null] })
  );
  last.set(key('Dest'), key('old'));
  let tree = readPdfOutlines(pdf, pageIds);
  assert.deepEqual(tree[0].children[0].target, target(pageIds[1], 'FitR', [10, 20, 150, 350]));
  assert.deepEqual(tree[1].target, target(pageIds[2], 'FitBH', [null]));
  tree = editPdfOutlineTree(tree, pageIds, {
    type: 'update',
    id: tree[0].id,
    title: 'Rename only',
  });
  assert.equal(writePdfOutlines(pdf, pageIds, tree), true);
  pdf = await reload(await save(pdf));
  const reread = readPdfOutlines(pdf, pageIds);
  assert.equal(reread[0].title, 'Rename only');
  const nextRoot = pdf.catalog.lookup(key('Outlines'));
  assert.equal(
    nextRoot.lookup(key('First')).lookup(key('First')).get(key('Dest')).decodeText(),
    'chapter'
  );
  assert.equal(nextRoot.lookup(key('Last')).get(key('Dest')), key('old'));
  for (const [kind, parameters] of [
    ['XYZ', [null, null, null]],
    ['Fit', []],
    ['FitH', [null]],
    ['FitV', [20]],
    ['FitR', [1, 2, 3, 4]],
    ['FitB', []],
    ['FitBH', [30]],
    ['FitBV', [null]],
  ]) {
    const current = readPdfOutlines(pdf, pageIds);
    const edited = editPdfOutlineTree(current, pageIds, {
      type: 'update',
      id: current[1].id,
      target: target(pageIds[0], kind, parameters),
    });
    writePdfOutlines(pdf, pageIds, edited);
    pdf = await reload(await save(pdf));
    assert.deepEqual(readPdfOutlines(pdf, pageIds)[1].target, target(pageIds[0], kind, parameters));
  }
});

test('retains unknown item/root attributes and passive external actions until their target is explicitly replaced', async () => {
  let pdf = await fixture();
  const root = pdf.catalog.lookup(key('Outlines')),
    original = root.lookup(key('Last'));
  const action = pdf.context.obj({
    S: 'VendorAction',
    Payload: PDFHexString.fromText('do not execute'),
    Next: { S: 'URI', URI: PDFHexString.fromText('https://example.invalid/keep') },
  });
  original.delete(key('Dest'));
  original.set(key('A'), pdf.context.register(action));
  original.set(key('VendorData'), pdf.context.obj({ Kind: 'Private', Payload: [1, 2, 3] }));
  original.set(key('C'), pdf.context.obj([0.1, 0.2, 0.3]));
  original.set(key('F'), PDFNumber.of(3));
  root.set(key('VendorRoot'), PDFHexString.fromText('root-private'));
  const retainedAction = action.toString(),
    retainedPrivate = original.lookup(key('VendorData')).toString();
  let tree = readPdfOutlines(pdf, pageIds);
  assert.equal(tree[1].passiveNavigation, 'VendorAction');
  for (let pass = 0; pass < 2; pass++) {
    tree = editPdfOutlineTree(tree, pageIds, {
      type: 'update',
      id: tree[1].id,
      title: 'Renamed passive ' + pass,
    });
    writePdfOutlines(pdf, pageIds, tree);
    pdf = await reload(await save(pdf));
    tree = readPdfOutlines(pdf, pageIds);
    const rereadRoot = pdf.catalog.lookup(key('Outlines')),
      reread = rereadRoot.lookup(key('Last'));
    assert.equal(reread.lookup(key('A')).toString(), retainedAction);
    assert.equal(reread.lookup(key('VendorData')).toString(), retainedPrivate);
    assert.equal(rereadRoot.lookup(key('VendorRoot')).decodeText(), 'root-private');
    assert.equal(reread.lookup(key('F')).asNumber(), 3);
    assert.equal(tree[1].passiveNavigation, 'VendorAction');
  }
  tree = editPdfOutlineTree(tree, pageIds, {
    type: 'update',
    id: tree[1].id,
    target: target(pageIds[0]),
  });
  assert.equal(tree[1].passiveNavigation, undefined);
  writePdfOutlines(pdf, pageIds, tree);
  pdf = await reload(await save(pdf));
  assert.deepEqual(readPdfOutlines(pdf, pageIds)[1].target, target(pageIds[0]));
  assert.equal(pdf.catalog.lookup(key('Outlines')).lookup(key('Last')).has(key('A')), false);
  assert.equal(
    pdf.catalog.lookup(key('Outlines')).lookup(key('Last')).lookup(key('VendorData')).toString(),
    retainedPrivate
  );
});

test('preserves GoTo Next/private keys when its target changes and follows stable IDs after native page reorder', async () => {
  let pdf = await fixture();
  const last = pdf.catalog.lookup(key('Outlines')).lookup(key('Last'));
  const next = pdf.context.register(
    pdf.context.obj({ S: 'URI', URI: PDFHexString.fromText('https://example.invalid') })
  );
  last.delete(key('Dest'));
  last.set(
    key('A'),
    pdf.context.obj({
      S: 'GoTo',
      D: [pdf.getPages()[2].ref, key('Fit')],
      Next: next,
      VendorFlag: 7,
    })
  );
  let tree = readPdfOutlines(pdf, pageIds);
  tree = editPdfOutlineTree(tree, pageIds, {
    type: 'update',
    id: tree[1].id,
    target: target(pageIds[1], 'FitV', [45]),
  });
  writePdfOutlines(pdf, pageIds, tree);
  const page = pdf.getPages()[2];
  pdf.removePage(2);
  pdf.insertPage(0, page);
  const movedIds = [pageIds[2], pageIds[0], pageIds[1]];
  assert.deepEqual(readPdfOutlines(pdf, movedIds)[1].target, target(pageIds[1], 'FitV', [45]));
  pdf = await reload(await save(pdf));
  const a = pdf.catalog.lookup(key('Outlines')).lookup(key('Last')).lookup(key('A'));
  assert.equal(a.lookup(key('VendorFlag')).asNumber(), 7);
  assert.equal(a.get(key('Next')).toString(), next.toString());
  assert.deepEqual(readPdfOutlines(pdf, movedIds)[1].target, target(pageIds[1], 'FitV', [45]));
});

test('rejects invalid pure edits, duplicate identities and descendant moves without changing the input tree', async () => {
  const pdf = await fixture(),
    tree = readPdfOutlines(pdf, pageIds),
    before = JSON.stringify(tree);
  const invalid = [
    { type: 'move', id: tree[0].id, parentId: tree[0].children[0].id, index: 0 },
    { type: 'move', id: tree[1].id, parentId: 'missing', index: 0 },
    { type: 'insert', index: 0, node: node(tree[0].id, 'Duplicate') },
    { type: 'insert', index: -1, node: node('valid-new', 'New') },
    { type: 'insert', index: 0, node: node('empty-new', '') },
    { type: 'insert', index: 0, node: tree[0] },
    { type: 'update', id: tree[1].id, target: target('outside') },
    { type: 'update', id: tree[1].id, target: target(pageIds[0], 'FitR', [0, 0, null, 100]) },
    { type: 'update', id: 'missing', title: 'Lost' },
    { type: 'update', id: tree[1].id, title: '  ' },
    { type: 'update', id: tree[1].id, unexpected: true },
    { type: 'unknown', id: tree[1].id },
  ];
  for (const edit of invalid) {
    assert.throws(() => editPdfOutlineTree(tree, pageIds, edit));
    assert.equal(JSON.stringify(tree), before);
  }
  assert.equal(
    editPdfOutlineTree(tree, pageIds, { type: 'update', id: tree[0].id, title: tree[0].title }),
    tree
  );
  const cyclic = node('cycle', 'Cycle');
  cyclic.children.push(cyclic);
  assert.throws(() => validatePdfOutlines([cyclic], pageIds));
  assert.throws(() => validatePdfOutlines([tree[0], tree[0]], pageIds));
});

test('rejects stale native identities, malformed targets and forged passive data before any loaded PDF mutation', async () => {
  const pdf = await fixture(),
    tree = readPdfOutlines(pdf, pageIds),
    before = contextBytes(pdf);
  const invalid = [
    [{ ...tree[0], nativeId: '9999 0 R', id: 'pdf-outline:9999:0' }],
    [{ ...tree[0], title: 'x'.repeat(4097) }],
    [{ ...tree[0], target: target('outside') }],
    [{ ...tree[0], target: target(pageIds[0], 'XYZ', [0, Infinity, 1]) }],
    [{ ...tree[0], passiveNavigation: 'URI' }],
    [{ ...tree[0], unexpected: 'silently ignored' }],
    [{ ...tree[0], target: target(pageIds[0], 'FitR', [3, 2, 1, 4]) }],
    [{ ...tree[0], target: target(pageIds[0], 'XYZ', [0, 0, -1]) }],
    [tree[0], tree[0]],
  ];
  for (const value of invalid) {
    assert.throws(() => writePdfOutlines(pdf, pageIds, value));
    assert.equal(contextBytes(pdf), before);
  }
  assert.throws(() => writePdfOutlines(pdf, [pageIds[0], pageIds[0], pageIds[2]], tree));
  assert.equal(contextBytes(pdf), before);
});

test('malformed native targets, cycles, canonical links and chained local targets reject the complete read without edits', async () => {
  for (const mutate of [
    (pdf, root, first) => first.set(key('Next'), root.get(key('First'))),
    (pdf, root, first) => first.set(key('Parent'), root.get(key('First'))),
    (pdf, root, first) => first.set(key('Dest'), pdf.context.obj([PDFNumber.of(99), key('Fit')])),
    (pdf, root, first) => {
      const action = pdf.context.obj({ S: 'URI', URI: PDFHexString.fromText('keep') });
      const ref = pdf.context.register(action);
      action.set(key('Next'), ref);
      first.set(key('A'), ref);
    },
    (pdf, root, first) =>
      first.set(
        key('A'),
        pdf.context.obj({
          S: 'URI',
          URI: PDFHexString.fromText('keep'),
          Next: { S: 'GoTo', D: [99, key('Fit')] },
        })
      ),
    (pdf, root, first) => {
      pdf.catalog.set(
        key('Names'),
        pdf.context.obj({
          Dests: { Names: [PDFHexString.fromText('cycle'), PDFHexString.fromText('cycle')] },
        })
      );
      first.set(key('Dest'), PDFHexString.fromText('cycle'));
    },
  ]) {
    const pdf = await fixture(),
      root = pdf.catalog.lookup(key('Outlines')),
      first = root.lookup(key('First'));
    mutate(pdf, root, first);
    const before = contextBytes(pdf);
    assert.throws(() => readPdfOutlines(pdf, pageIds));
    assert.equal(contextBytes(pdf), before);
    assert.throws(() => writePdfOutlines(pdf, pageIds, []));
    assert.equal(contextBytes(pdf), before);
  }
});

test('empty and direct-root directories preserve private metadata until explicitly removed', async () => {
  const pdf = await PDFDocument.create();
  pdf.addPage();
  assert.deepEqual(readPdfOutlines(pdf, ['one']), []);
  assert.equal(writePdfOutlines(pdf, ['one'], []), false);
  const directRoot = pdf.context.obj({
    Type: 'Outlines',
    VendorRoot: PDFHexString.fromText('preserve'),
  });
  pdf.catalog.set(key('Outlines'), directRoot);
  const tree = [node('one-node', 'Single', [], target('one'))];
  writePdfOutlines(pdf, ['one'], tree);
  assert.equal(
    pdf.catalog.lookup(key('Outlines')).lookup(key('VendorRoot')).decodeText(),
    'preserve'
  );
  assert.equal(readPdfOutlines(pdf, ['one']).length, 1);
  assert.equal(writePdfOutlines(pdf, ['one'], []), true);
  assert.equal(pdf.catalog.has(key('Outlines')), false);
});

test('removing the final child normalizes meaningless leaf expansion and keeps original empty native titles until explicitly edited', async () => {
  const pdf = await fixture();
  const first = pdf.catalog.lookup(key('Outlines')).lookup(key('First'));
  first.set(key('Title'), PDFHexString.fromText(''));
  let tree = readPdfOutlines(pdf, pageIds);
  assert.equal(tree[0].title, '');
  assert.equal(tree[0].expanded, false);
  const untouched = contextBytes(pdf);
  assert.equal(writePdfOutlines(pdf, pageIds, tree), false);
  assert.equal(contextBytes(pdf), untouched);
  tree = editPdfOutlineTree(tree, pageIds, { type: 'remove', id: tree[0].children[0].id });
  assert.equal(tree[0].expanded, true);
  assert.equal(tree[0].children.length, 0);
  writePdfOutlines(pdf, pageIds, tree);
  assert.deepEqual(titleAndTargets(readPdfOutlines(pdf, pageIds)), titleAndTargets(tree));
  assert.throws(() =>
    editPdfOutlineTree(tree, pageIds, { type: 'update', id: tree[0].id, title: '' })
  );
});
