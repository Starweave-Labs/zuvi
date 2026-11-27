import { URL } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { lineEndingGeometry, geometryPaintBounds } from './studio-pdf-native-runtime.mjs';
import { importNativeMarks, addMark, updateMark, exportNativeMarks } from './studio-pdf-native-runtime.mjs';

const fixture = () => readFile(new URL('./fixtures/studio-pdf-native/native-marks-source.pdf', import.meta.url));
const byId = (model, id) => model.annotations.find((annotation) => annotation.id === id);
const cases = [
  { id: 'geometry-circle', kind: 'circle', rect: [300, 640, 550, 710], rectDifferences: [3, 4, 5, 6] },
  { id: 'geometry-line', kind: 'line', rect: [300, 470, 555, 555], line: [320, 485, 525, 535], lineEnds: ['Circle', 'ClosedArrow'] },
  { id: 'geometry-polygon', kind: 'polygon', rect: [300, 110, 565, 230], vertices: [320, 130, 420, 210, 545, 145] },
  { id: 'geometry-polyline', kind: 'polyLine', rect: [300, 235, 570, 330], vertices: [315, 255, 400, 310, 470, 255, 550, 300], lineEnds: ['Diamond', 'ROpenArrow'] },
];

test('Circle, Line, Polygon and PolyLine write native geometry, fill, opacity, dashed border and AP', async () => {
  const bytes = await fixture();
  let model = await importNativeMarks(bytes);
  for (const definition of cases) model = addMark(model, {
    ...definition, pageId: model.pages[0].id, color: [0.1, 0.3, 0.5], fill: [0.85, 0.95, 1], opacity: 0.6,
    border: { width: 2, style: 'D', dash: [4, 2] },
  });
  const first = await exportNativeMarks(bytes, model), reopened = await importNativeMarks(first);
  for (const definition of cases) {
    const mark = byId(reopened, definition.id);
    assert.equal(mark.kind, definition.kind);
    assert.deepEqual(mark.rect, definition.rect);
    assert.deepEqual(mark.border, { width: 2, style: 'D', dash: [4, 2] });
    assert.deepEqual(mark.fill, [0.85, 0.95, 1]);
    assert.equal(mark.opacity, 0.6);
    assert.ok(mark._native.appearanceHash);
    if (definition.line) assert.deepEqual(mark.line, definition.line);
    if (definition.vertices) assert.deepEqual(mark.vertices, definition.vertices);
    if (definition.lineEnds) assert.deepEqual(mark.lineEnds, definition.lineEnds);
  }
  let edited = reopened;
  for (const definition of cases) edited = updateMark(edited, definition.id, { color: [0.5, 0.2, 0.1], fill: null, opacity: 0, border: { width: 1, style: 'S' } });
  const second = await importNativeMarks(await exportNativeMarks(first, edited));
  for (const definition of cases) {
    assert.equal(byId(second, definition.id).opacity, 0);
    assert.equal(byId(second, definition.id).fill, null);
    assert.deepEqual(byId(second, definition.id).color, [0.5, 0.2, 0.1]);
    assert.equal(byId(second, definition.id).id, definition.id);
  }
});

test('translation preserves AP and resizing transforms Line L and Polygon Vertices once', async () => {
  const bytes = await fixture();
  let model = await importNativeMarks(bytes);
  for (const definition of cases) model = addMark(model, { ...definition, pageId: model.pages[0].id, color: [0.3, 0.2, 0.1], fill: null });
  const first = await exportNativeMarks(bytes, model), reopened = await importNativeMarks(first);
  let translated = reopened;
  for (const definition of cases) translated = updateMark(translated, definition.id, { rect: definition.rect.map((value, index) => value + (index % 2 ? 7 : 9)) });
  const moved = await importNativeMarks(await exportNativeMarks(first, translated));
  for (const definition of cases) assert.equal(byId(moved, definition.id)._native.appearanceHash, byId(reopened, definition.id)._native.appearanceHash);
  const line = byId(moved, 'geometry-line');
  const resize = updateMark(moved, line.id, { rect: [line.rect[0], line.rect[1], line.rect[0] + 510, line.rect[1] + 170] });
  const resizedBytes = await exportNativeMarks(await exportNativeMarks(first, translated), resize);
  const after = byId(await importNativeMarks(resizedBytes), line.id);
  assert.deepEqual(after.line, line.line.map((value, index) => (value - line.rect[index % 2]) * 2 + line.rect[index % 2]));
  assert.notEqual(after._native.appearanceHash, line._native.appearanceHash);
  assert.deepEqual(after.lineEnds, line.lineEnds);
});

for (const ending of ['None', 'Square', 'Circle', 'Diamond', 'OpenArrow', 'ClosedArrow', 'Butt', 'ROpenArrow', 'RClosedArrow', 'Slash']) {
  test('native line ending ' + ending + ' preserves both endpoint names and appearance through two saves', async () => {
    const bytes = await fixture(), base = await importNativeMarks(bytes);
    const added = addMark(base, { id: 'line-ending-' + ending, kind: 'line', pageId: base.pages[0].id, rect: [300, 100, 575, 160], line: [325, 125, 545, 140], lineEnds: [ending, ending], color: [0.2, 0.3, 0.6], fill: [0.9, 0.75, 0.3], border: { width: 1.5, style: 'D', dash: [5, 2] } });
    const first = await exportNativeMarks(bytes, added), reopened = await importNativeMarks(first);
    assert.deepEqual(byId(reopened, 'line-ending-' + ending).lineEnds, [ending, ending]);
    const changed = updateMark(reopened, 'line-ending-' + ending, { opacity: 0.4 });
    const twice = await importNativeMarks(await exportNativeMarks(first, changed));
    assert.deepEqual(byId(twice, 'line-ending-' + ending).lineEnds, [ending, ending]);
    assert.equal(byId(twice, 'line-ending-' + ending).opacity, 0.4);
    const geometry = lineEndingGeometry([100, 50], [1, 0], ending, 1.5);
    assert.ok(geometry.bounds.every(Number.isFinite));
  });
}

test('regular/reverse arrow direction is defined relative to the inside tangent at each endpoint', () => {
  const open = lineEndingGeometry([100, 50], [1, 0], 'OpenArrow', 2);
  const reverse = lineEndingGeometry([100, 50], [1, 0], 'ROpenArrow', 2);
  assert.ok(open.points[0][0] > 100);
  assert.ok(reverse.points[0][0] < 100);
  assert.deepEqual(open.points[1], [100, 50]);
  assert.deepEqual(reverse.points[1], [100, 50]);
  const end = lineEndingGeometry([200, 50], [-1, 0], 'ClosedArrow', 2);
  assert.ok(end.points[0][0] < 200);
  assert.equal(end.filled, true);
  const bounds = geometryPaintBounds({ kind: 'line', line: [100, 50, 200, 50], lineEnds: ['ROpenArrow', 'RClosedArrow'], border: { width: 2 }, lineJoin: 0, miterLimit: 2 });
  assert.ok(bounds[0] < 100 && bounds[2] > 200);
});
