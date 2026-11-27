import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../../..');
const require = createRequire(path.join(root, 'docs/package.json'));
const { PDFDocument, PDFDict, PDFArray, PDFNumber, PDFName, PDFRef, PDFString, PDFHexString } = require('pdf-lib');
const name = key => PDFName.of(key);
const hash = data => createHash('sha256').update(data).digest('hex');
const files = ['source.pdf', 'roundtrip-1.pdf', 'roundtrip-2.pdf'];
const records = [];
let originalStreams, originalAction;
for (const filename of files) {
  const location = path.join(here, 'native-verified', filename);
  const bytes = await readFile(location);
  const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
  const pages = pdf.getPages(), pageRefs = new Map(pages.map((p, index) => [p.ref.toString(), index]));
  const streams = pages.map(page => {
    const source = page.node.Contents();
    const list = source instanceof PDFArray ? source.asArray() : source ? [source] : [];
    return list.map(ref => hash(pdf.context.lookup(ref).getContents()));
  });
  assert.equal(pages.length, 3);
  assert.equal(pdf.getForm().getTextField('Original field').getText(), 'original');
  const rootRef = pdf.catalog.get(name('Outlines'));
  assert.ok(rootRef instanceof PDFRef);
  const directory = pdf.context.lookup(rootRef);
  assert.ok(directory instanceof PDFDict);
  assert.equal(directory.lookup(name('VendorRoot')).decodeText(), 'root-private');
  const seen = new Set();
  const walk = (parent, parentRef) => {
    let current = parent.get(name('First')), previous, final;
    const items = [];
    while (current) {
      assert.ok(current instanceof PDFRef); assert.ok(!seen.has(current.toString()));
      seen.add(current.toString());
      const item = pdf.context.lookup(current);
      assert.ok(item instanceof PDFDict);
      assert.equal(item.get(name('Parent')).toString(), parentRef.toString());
      assert.equal(item.get(name('Prev'))?.toString(), previous?.toString());
      const title = item.lookup(name('Title'));
      assert.ok(title instanceof PDFString || title instanceof PDFHexString);
      const destination = item.lookup(name('Dest'));
      let pageIndex;
      if (destination) {
        assert.ok(destination instanceof PDFArray);
        assert.equal(destination.lookup(1), name('Fit'));
        pageIndex = pageRefs.get(destination.get(0).toString());
        assert.ok(Number.isInteger(pageIndex));
      }
      const child = item.get(name('First')) ? walk(item, current) : [];
      const count = item.lookup(name('Count'));
      if (child.length) assert.ok(count instanceof PDFNumber);
      const action = item.lookup(name('A'));
      items.push({ title: title.decodeText(), pageIndex, count: count?.asNumber(), children: child, passiveAction: action?.toString() });
      previous = current; final = current; current = item.get(name('Next'));
    }
    assert.equal(final?.toString(), parent.get(name('Last'))?.toString());
    return items;
  };
  const tree = walk(directory, rootRef);
  assert.equal(tree.length, 2);
  assert.equal(tree[0].title, filename === 'source.pdf' ? '章节' : '修改后的章节');
  assert.equal(tree[0].children.length, filename === 'source.pdf' ? 1 : 2);
  assert.equal(tree[0].children[0].pageIndex, 1);
  if (filename !== 'source.pdf') assert.equal(tree[0].children[1].pageIndex, 2);
  assert.equal(directory.lookup(name('Count')).asNumber(), filename === 'source.pdf' ? 3 : 4);
  const passive = directory.lookup(name('Last'));
  assert.equal(passive.lookup(name('VendorData')).lookup(name('Mode')), name('Preserve'));
  assert.equal(passive.lookup(name('VendorData')).lookup(name('Source')).asNumber(), 7);
  if (!originalStreams) { originalStreams = streams; originalAction = tree[1].passiveAction; }
  assert.deepEqual(streams, originalStreams); assert.equal(tree[1].passiveAction, originalAction);
  records.push({ path: path.relative(root, location), bytes: bytes.length, sha256: hash(bytes), pageCount: pages.length, streams, tree });
}
const report = { checkedBy: 'Direct PDFDict/PDFArray inspection, without the outline module', requirementComplete: false, samples: records };
await writeFile(path.join(here, 'native-independent-verification.json'), JSON.stringify(report, null, 2) + String.fromCharCode(10));
process.stdout.write(JSON.stringify({ nativeSamples: records.length, independentDictionaryChecks: 'passed', requirementComplete: false }) + String.fromCharCode(10));
