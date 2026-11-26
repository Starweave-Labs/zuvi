import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDecoder } from 'node:util';
import {
  PDFHexString,
  PDFRef,
  PDFStream,
} from 'pdf-lib';
import { copyCatalog } from './studio-pdf-compose-test-loader.mjs';
import { hash, name, text } from './studio-pdf-compose-test-loader.mjs';
import {
  allPageObjectCount,
  catalogNames,
  composeCatalog,
  lookup,
  prepareCatalog,
  readActionSequence,
  readLabelEntries,
  readOutlineTree,
  reopenTwice,
  setLabels,
  setNames,
  setOutlines,
  sourcePdf,
  targetPageIndex,
} from './studio-pdf-compose-catalog-fixtures.mjs';

const uri = (pdf, value, next) => {
  const dict = pdf.context.obj({ S: 'URI', URI: PDFHexString.fromText(value) });
  if (next) dict.set(name('Next'), next);
  return pdf.context.register(dict);
};
const errorCode = (code) => (error) => error.code === code && typeof error.path === 'string';
const labelsWithoutRefs = (tree) =>
  tree.map(({ title, count, pageIndex, children }) => ({
    title,
    count,
    pageIndex,
    children: labelsWithoutRefs(children),
  }));

test('namespaced legacy and name-tree destinations retain selected pages and prune unselected targets through two native saves', async () => {
  const a = await sourcePdf('A', 3, (pdf, pages) => {
    setNames(
      pdf,
      [
        ['start', pdf.context.obj([pages[2].ref, 'Fit'])],
        ['removed', pdf.context.obj([pages[0].ref, 'Fit'])],
      ],
      true
    );
  });
  const b = await sourcePdf('B', 2, (pdf, pages) => {
    setNames(pdf, [
      ['start', pdf.context.obj({ D: [pages[1].ref, 'XYZ', null, 30, 1] })],
      ['alias', PDFHexString.fromText('start')],
    ]);
  });
  const result = await composeCatalog(
    [a, b],
    [
      ['B', 1],
      ['A', 2],
    ]
  );
  for (const pdf of await reopenTwice(result.bytes)) {
    const names = catalogNames(pdf);
    assert.deepEqual([...names.keys()], ['A:start', 'B:alias', 'B:start']);
    assert.equal(targetPageIndex(pdf, names.get('A:start')), 1);
    assert.equal(targetPageIndex(pdf, names.get('B:start')), 0);
    assert.equal(targetPageIndex(pdf, names.get('B:alias')), 0);
    assert.equal(allPageObjectCount(pdf), 2);
  }
  assert.ok(
    result.report.prunedNavigation.some(
      (entry) => entry.sourceId === 'A' && entry.path.includes('removed')
    )
  );
  assert.deepEqual(result.report.destinationNames.map((entry) => entry.targetName).sort(), [
    'A:start',
    'B:alias',
    'B:start',
  ]);
  assert.equal(hash(a.bytes), a.originalHash);
  assert.equal(hash(b.bytes), b.originalHash);
});

test('retained outlines rebuild canonical parents, sibling refs and open/closed counts without unselected page objects', async () => {
  const a = await sourcePdf('A', 3, (pdf) =>
    setOutlines(pdf, [
      {
        title: 'Group with removed own destination',
        destination: 0,
        open: true,
        flags: 3,
        color: [0.1, 0.2, 0.3],
        children: [
          { title: 'Kept child', destination: 2 },
          { title: 'Removed child', destination: 1 },
          {
            title: 'Closed subgroup',
            open: false,
            children: [{ title: 'Kept nested child', destination: 2 }],
          },
        ],
      },
      { title: 'Removed sibling', destination: 0 },
      { title: 'Inert title' },
    ])
  );
  const b = await sourcePdf('B', 1, (pdf) =>
    setOutlines(pdf, [{ title: 'Second source', destination: 0 }])
  );
  const result = await composeCatalog(
    [a, b],
    [
      ['A', 2],
      ['B', 0],
    ]
  );
  for (const pdf of await reopenTwice(result.bytes)) {
    const tree = readOutlineTree(pdf);
    assert.equal(tree.count, 5);
    assert.deepEqual(labelsWithoutRefs(tree.items), [
      {
        title: 'Group with removed own destination',
        count: 2,
        pageIndex: undefined,
        children: [
          { title: 'Kept child', count: undefined, pageIndex: 0, children: [] },
          {
            title: 'Closed subgroup',
            count: -1,
            pageIndex: undefined,
            children: [
              { title: 'Kept nested child', count: undefined, pageIndex: 0, children: [] },
            ],
          },
        ],
      },
      { title: 'Inert title', count: undefined, pageIndex: undefined, children: [] },
      { title: 'Second source', count: undefined, pageIndex: 1, children: [] },
    ]);
    assert.equal(allPageObjectCount(pdf), 2);
    const root = lookup(pdf, pdf.catalog.get(name('Outlines'))),
      first = lookup(pdf, root.get(name('First')));
    assert.equal(lookup(pdf, first.get(name('F'))).asNumber(), 3);
    assert.deepEqual(
      lookup(pdf, first.get(name('C')))
        .asArray()
        .map((value) => value.asNumber()),
      [0.1, 0.2, 0.3]
    );
  }
});

test('named destinations in outlines become real retained-page references and URI Next survives a pruned GoTo', async () => {
  const a = await sourcePdf('A', 2, (pdf, pages) => {
    setNames(pdf, [['kept', pdf.context.obj([pages[1].ref, 'FitH', 250])]]);
    const action = pdf.context.register(
      pdf.context.obj({
        S: 'GoTo',
        D: [pages[0].ref, 'Fit'],
        Next: uri(pdf, 'https://example.test/after-removed'),
      })
    );
    setOutlines(pdf, [
      { title: 'Named page', destination: PDFHexString.fromText('kept') },
      { title: 'Action chain', action },
    ]);
  });
  const result = await composeCatalog([a], [['A', 1]]);
  for (const pdf of await reopenTwice(result.bytes)) {
    const tree = readOutlineTree(pdf);
    assert.equal(tree.items[0].pageIndex, 0);
    const root = lookup(pdf, pdf.catalog.get(name('Outlines'))),
      first = lookup(pdf, root.get(name('First'))),
      second = lookup(pdf, first.get(name('Next')));
    assert.deepEqual(
      readActionSequence(pdf, second.get(name('A'))).map((entry) => entry.uri),
      ['https://example.test/after-removed']
    );
    assert.equal(allPageObjectCount(pdf), 1);
  }
});

test('nested PageLabels ranges preserve original numbering after reorder, copies and merge through two saves', async () => {
  const a = await sourcePdf('A', 4, (pdf) =>
    setLabels(
      pdf,
      [
        [0, { Type: 'PageLabel', S: 'r', P: 'Sec-', St: 1 }],
        [2, { S: 'D', P: 'Main-', St: 5 }],
      ],
      true
    )
  );
  const b = await sourcePdf('B', 2);
  const result = await composeCatalog(
    [a, b],
    [
      ['A', 3],
      ['A', 0],
      ['B', 1],
      ['A', 2],
      ['A', 3],
    ]
  );
  const expected = [
    { page: 0, style: 'D', prefix: 'Main-', first: 6 },
    { page: 1, style: 'r', prefix: 'Sec-', first: 1 },
    { page: 2, style: 'D', prefix: undefined, first: 2 },
    { page: 3, style: 'D', prefix: 'Main-', first: 5 },
    { page: 4, style: 'D', prefix: 'Main-', first: 6 },
  ];
  for (const pdf of await reopenTwice(result.bytes)) {
    assert.deepEqual(readLabelEntries(pdf), expected);
    assert.equal(allPageObjectCount(pdf), 5);
  }
});

test('prefix-only page labels retain constant text and do not gain a numbering style', async () => {
  const a = await sourcePdf('A', 3, (pdf) =>
    setLabels(pdf, [
      [0, { P: 'cover' }],
      [1, { S: 'A', P: 'Appendix-', St: 3 }],
    ])
  );
  const result = await composeCatalog(
    [a],
    [
      ['A', 0],
      ['A', 2],
    ]
  );
  for (const pdf of await reopenTwice(result.bytes))
    assert.deepEqual(readLabelEntries(pdf), [
      { page: 0, style: undefined, prefix: 'cover', first: 1 },
      { page: 1, style: 'A', prefix: 'Appendix-', first: 4 },
    ]);
});

test('catalog can be re-composed twice with canonical outlines and labels remaining native', async () => {
  const a = await sourcePdf('A', 3, (pdf, pages) => {
    setNames(pdf, [['keep', pdf.context.obj([pages[2].ref, 'Fit'])]]);
    setOutlines(pdf, [{ title: 'Keep', destination: 2 }]);
    setLabels(pdf, [[0, { S: 'D', P: 'Page-', St: 10 }]]);
  });
  const first = await composeCatalog(
    [a],
    [
      ['A', 2],
      ['A', 1],
    ]
  );
  const second = await composeCatalog(
    [{ id: 'Round1', bytes: first.bytes }],
    [
      ['Round1', 1],
      ['Round1', 0],
    ]
  );
  const third = await composeCatalog(
    [{ id: 'Round2', bytes: second.bytes }],
    [
      ['Round2', 0],
      ['Round2', 1],
    ]
  );
  for (const pdf of await reopenTwice(third.bytes)) {
    assert.equal(allPageObjectCount(pdf), 2);
    assert.equal(readOutlineTree(pdf).items[0].pageIndex, 1);
    assert.deepEqual(readLabelEntries(pdf), [
      { page: 0, style: 'D', prefix: 'Page-', first: 11 },
      { page: 1, style: 'D', prefix: 'Page-', first: 12 },
    ]);
    assert.equal(targetPageIndex(pdf, [...catalogNames(pdf).values()][0]), 1);
  }
});

test('primary Info, XML metadata, language, extension and viewer settings are retained with explicit secondary decisions', async () => {
  const a = await sourcePdf('A', 3, (pdf) => {
    pdf.context.trailerInfo.Info = pdf.context.register(
      pdf.context.obj({
        Title: PDFHexString.fromText('Primary 中文标题'),
        Author: PDFHexString.fromText('Author A'),
        PrivateNumber: 42,
        Trapped: 'False',
      })
    );
    pdf.catalog.set(
      name('Metadata'),
      pdf.context.register(
        pdf.context.stream('<x:xmpmeta>primary</x:xmpmeta>', { Type: 'Metadata', Subtype: 'XML' })
      )
    );
    pdf.catalog.set(name('Lang'), PDFHexString.fromText('zh-CN'));
    pdf.catalog.set(name('Version'), name('1.7'));
    pdf.catalog.set(name('PageLayout'), name('TwoColumnLeft'));
    pdf.catalog.set(name('PageMode'), name('UseOutlines'));
    pdf.catalog.set(
      name('Extensions'),
      pdf.context.obj({ ADBE: { BaseVersion: '1.7', ExtensionLevel: 3 } })
    );
    pdf.catalog.set(
      name('ViewerPreferences'),
      pdf.context.obj({
        HideToolbar: true,
        Direction: 'R2L',
        PrintScaling: 'None',
        PrintPageRange: [0, 1],
        NumCopies: 2,
        Enforce: ['PrintScaling'],
      })
    );
  });
  const b = await sourcePdf('B', 1, (pdf) => {
    pdf.setTitle('Secondary');
    pdf.catalog.set(name('Lang'), PDFHexString.fromText('en-US'));
    pdf.catalog.set(name('PageLayout'), name('SinglePage'));
  });
  const result = await composeCatalog(
    [a, b],
    [
      ['A', 2],
      ['B', 0],
      ['A', 0],
      ['A', 1],
    ]
  );
  for (const pdf of await reopenTwice(result.bytes)) {
    const info = lookup(pdf, pdf.context.trailerInfo.Info);
    assert.equal(text(lookup(pdf, info.get(name('Title')))), 'Primary 中文标题');
    assert.equal(lookup(pdf, info.get(name('PrivateNumber'))).asNumber(), 42);
    const metadata = lookup(pdf, pdf.catalog.get(name('Metadata')));
    assert.ok(metadata instanceof PDFStream);
    assert.equal(
      new TextDecoder().decode(metadata.getContents()),
      '<x:xmpmeta>primary</x:xmpmeta>'
    );
    assert.equal(text(lookup(pdf, pdf.catalog.get(name('Lang')))), 'zh-CN');
    assert.equal(text(lookup(pdf, pdf.catalog.get(name('PageLayout')))), 'TwoColumnLeft');
    assert.equal(text(lookup(pdf, pdf.catalog.get(name('Version')))), '1.7');
    const prefs = lookup(pdf, pdf.catalog.get(name('ViewerPreferences')));
    assert.deepEqual(
      lookup(pdf, prefs.get(name('PrintPageRange')))
        .asArray()
        .map((value) => value.asNumber()),
      [2, 3]
    );
    assert.equal(lookup(pdf, prefs.get(name('NumCopies'))).asNumber(), 2);
    assert.equal(allPageObjectCount(pdf), 4);
  }
  assert.deepEqual(result.report.catalogPolicy, { strategy: 'primary', primarySourceId: 'A' });
  assert.ok(
    result.report.warnings.some(
      (entry) =>
        entry.sourceId === 'B' && entry.path === '/Info' && entry.code === 'CATALOG_PRIMARY'
    )
  );
  assert.ok(
    result.report.catalogDecisions.some(
      (entry) => entry.path === '/ViewerPreferences/PrintPageRange' && entry.policy === 'map'
    )
  );
});

test('missing primary metadata remains absent and secondary metadata omission is explicit', async () => {
  const a = await sourcePdf('A', 1),
    b = await sourcePdf('B', 1, (pdf) => {
      pdf.setTitle('Secondary');
      pdf.catalog.set(
        name('Metadata'),
        pdf.context.register(pdf.context.stream('secondary', { Type: 'Metadata', Subtype: 'XML' }))
      );
    });
  const result = await composeCatalog(
    [a, b],
    [
      ['A', 0],
      ['B', 0],
    ]
  );
  for (const pdf of await reopenTwice(result.bytes)) {
    assert.equal(pdf.context.trailerInfo.Info, undefined);
    assert.equal(pdf.catalog.get(name('Metadata')), undefined);
  }
  assert.ok(
    result.report.warnings.some((entry) => entry.sourceId === 'B' && entry.path === '/Metadata')
  );
});

test('compatible OpenAction and AA sequences preserve all sources and do not mutate shared cached actions', async () => {
  const a = await sourcePdf('A', 1, (pdf) => {
    const shared = uri(pdf, 'https://example.test/a', uri(pdf, 'https://example.test/a-next'));
    pdf.catalog.set(name('OpenAction'), shared);
    pdf.catalog.set(name('AA'), pdf.context.obj({ WP: shared }));
  });
  const b = await sourcePdf('B', 1, (pdf) => {
    pdf.catalog.set(name('OpenAction'), uri(pdf, 'https://example.test/b-open'));
    pdf.catalog.set(
      name('AA'),
      pdf.context.obj({
        WP: uri(pdf, 'https://example.test/b-print'),
        DP: uri(pdf, 'https://example.test/b-printed'),
      })
    );
  });
  const result = await composeCatalog(
    [a, b],
    [
      ['A', 0],
      ['B', 0],
    ]
  );
  for (const pdf of await reopenTwice(result.bytes)) {
    assert.deepEqual(
      readActionSequence(pdf, pdf.catalog.get(name('OpenAction'))).map((entry) => entry.uri),
      ['https://example.test/a', 'https://example.test/a-next', 'https://example.test/b-open']
    );
    const aa = lookup(pdf, pdf.catalog.get(name('AA')));
    assert.deepEqual(
      readActionSequence(pdf, aa.get(name('WP'))).map((entry) => entry.uri),
      ['https://example.test/a', 'https://example.test/a-next', 'https://example.test/b-print']
    );
    assert.deepEqual(
      readActionSequence(pdf, aa.get(name('DP'))).map((entry) => entry.uri),
      ['https://example.test/b-printed']
    );
  }
  assert.ok(
    result.report.catalogDecisions.some(
      (entry) => entry.path === '/OpenAction' && entry.policy === 'chain'
    )
  );
});

test('two incompatible local OpenAction views reject the whole operation with a locatable conflict and unchanged sources', async () => {
  const a = await sourcePdf('A', 1, (pdf, pages) =>
      pdf.catalog.set(name('OpenAction'), pdf.context.obj([pages[0].ref, 'Fit']))
    ),
    b = await sourcePdf('B', 1, (pdf, pages) =>
      pdf.catalog.set(name('OpenAction'), pdf.context.obj([pages[0].ref, 'Fit']))
    );
  await assert.rejects(
    composeCatalog(
      [a, b],
      [
        ['A', 0],
        ['B', 0],
      ]
    ),
    (error) =>
      errorCode('OPEN_ACTION_CONFLICT')(error) &&
      error.source === 'B' &&
      error.path === '/OpenAction'
  );
  assert.equal(hash(a.bytes), a.originalHash);
  assert.equal(hash(b.bytes), b.originalHash);
});

test('incompatible local additional actions reject instead of silently keeping the primary event', async () => {
  const a = await sourcePdf('A', 1, (pdf, pages) =>
      pdf.catalog.set(name('AA'), pdf.context.obj({ WP: { S: 'GoTo', D: [pages[0].ref, 'Fit'] } }))
    ),
    b = await sourcePdf('B', 1, (pdf, pages) =>
      pdf.catalog.set(name('AA'), pdf.context.obj({ WP: { S: 'GoTo', D: [pages[0].ref, 'Fit'] } }))
    );
  await assert.rejects(
    composeCatalog(
      [a, b],
      [
        ['A', 0],
        ['B', 0],
      ]
    ),
    (error) =>
      errorCode('CATALOG_ACTION_CONFLICT')(error) && error.source === 'B' && error.path === '/AA/WP'
  );
});

test('unselected OpenAction destination is pruned while the other source action survives', async () => {
  const a = await sourcePdf('A', 2, (pdf, pages) =>
      pdf.catalog.set(name('OpenAction'), pdf.context.obj([pages[0].ref, 'Fit']))
    ),
    b = await sourcePdf('B', 1, (pdf) =>
      pdf.catalog.set(name('OpenAction'), uri(pdf, 'https://example.test/survives'))
    );
  const result = await composeCatalog(
    [a, b],
    [
      ['A', 1],
      ['B', 0],
    ]
  );
  for (const pdf of await reopenTwice(result.bytes)) {
    assert.deepEqual(
      readActionSequence(pdf, pdf.catalog.get(name('OpenAction'))).map((entry) => entry.uri),
      ['https://example.test/survives']
    );
    assert.equal(allPageObjectCount(pdf), 2);
  }
  assert.ok(
    result.report.prunedNavigation.some(
      (entry) => entry.sourceId === 'A' && entry.path === '/OpenAction'
    )
  );
});

test('primary print preference with no retained target is explicitly pruned', async () => {
  const a = await sourcePdf('A', 2, (pdf) =>
    pdf.catalog.set(name('ViewerPreferences'), pdf.context.obj({ PrintPageRange: [0, 0] }))
  );
  const result = await composeCatalog([a], [['A', 1]]),
    reopened = (await reopenTwice(result.bytes))[1],
    prefs = lookup(reopened, reopened.catalog.get(name('ViewerPreferences')));
  assert.equal(prefs.get(name('PrintPageRange')), undefined);
  assert.ok(
    result.report.prunedNavigation.some(
      (entry) => entry.path === '/ViewerPreferences/PrintPageRange'
    )
  );
});

for (const [variant, code, mutate] of [
  ['cycle', 'OUTLINE_CYCLE', ({ items }) => items[0].dict.set(name('Next'), items[0].ref)],
  [
    'bad parent',
    'OUTLINE_PARENT',
    ({ items }, pdf) => items[0].dict.set(name('Parent'), pdf.getPages()[0].ref),
  ],
  ['bad last', 'OUTLINE_LAST', ({ root }, pdf) => root.set(name('Last'), pdf.getPages()[0].ref)],
  [
    'bad prev',
    'OUTLINE_PREV',
    ({ items }, pdf) => items[1].dict.set(name('Prev'), pdf.getPages()[0].ref),
  ],
  [
    'opaque structure element',
    'OPAQUE_OUTLINE',
    ({ items }, pdf) => items[0].dict.set(name('SE'), pdf.getPages()[0].ref),
  ],
  ['dangling first', 'OUTLINE_LINKS', ({ root }) => root.set(name('First'), PDFRef.of(9999))],
])
  test(`invalid outline ${variant} fails without copying source page trees`, async () => {
    const a = await sourcePdf('A', 2, (pdf) => {
      const tree = setOutlines(pdf, [
        { title: 'One', destination: 0 },
        { title: 'Two', destination: 1 },
      ]);
      mutate(tree, pdf);
    });
    await assert.rejects(composeCatalog([a], [['A', 1]]), errorCode(code));
    assert.equal(hash(a.bytes), a.originalHash);
  });

for (const [variant, code, entries] of [
  ['unknown style', 'PAGE_LABEL_STYLE', [[0, { S: 'Unknown' }]]],
  [
    'duplicate indexes',
    'PAGE_LABEL_INDEX',
    [
      [0, { S: 'D' }],
      [0, { S: 'D' }],
    ],
  ],
  ['missing first page', 'PAGE_LABEL_FIRST', [[1, { S: 'D' }]]],
  ['zero first number', 'PAGE_LABEL_START', [[0, { S: 'D', St: 0 }]]],
  ['opaque label key', 'OPAQUE_PAGE_LABEL', [[0, { S: 'D', Unknown: 'value' }]]],
])
  test(`invalid page label ${variant} rejects`, async () => {
    const a = await sourcePdf('A', 2, (pdf) => setLabels(pdf, entries));
    await assert.rejects(composeCatalog([a], [['A', 0]]), errorCode(code));
  });

test('cyclic PageLabels Kids and mismatching Limits reject instead of generic copying the number tree', async () => {
  const cyclic = await sourcePdf('Cycle', 1, (pdf) => {
    const root = pdf.context.obj({}),
      ref = pdf.context.register(root);
    root.set(name('Kids'), pdf.context.obj([ref]));
    pdf.catalog.set(name('PageLabels'), ref);
  });
  await assert.rejects(composeCatalog([cyclic], [['Cycle', 0]]), errorCode('PAGE_LABEL_CYCLE'));
  const badLimits = await sourcePdf('Limits', 3, (pdf) => {
    setLabels(
      pdf,
      [
        [0, { S: 'D' }],
        [2, { S: 'r' }],
      ],
      true
    );
    const root = pdf.context.lookup(pdf.catalog.get(name('PageLabels'))),
      child = pdf.context.lookup(root.lookup(name('Kids')).get(0));
    child.set(name('Limits'), pdf.context.obj([0, 1]));
  });
  await assert.rejects(
    composeCatalog([badLimits], [['Limits', 2]]),
    errorCode('PAGE_LABEL_LIMITS')
  );
});

test('named destination cycles and namespace collisions reject with source locations', async () => {
  const cyclic = await sourcePdf('Cycle', 1, (pdf) =>
    setNames(pdf, [
      ['one', PDFHexString.fromText('two')],
      ['two', PDFHexString.fromText('one')],
    ])
  );
  await assert.rejects(composeCatalog([cyclic], [['Cycle', 0]]), errorCode('DESTINATION_CYCLE'));
  const a = await sourcePdf('A', 1, (pdf, pages) =>
      setNames(pdf, [['same', pdf.context.obj([pages[0].ref, 'Fit'])]])
    ),
    b = await sourcePdf('B', 1, (pdf, pages) =>
      setNames(pdf, [['same', pdf.context.obj([pages[0].ref, 'Fit'])]])
    );
  await assert.rejects(
    composeCatalog(
      [a, b],
      [
        ['A', 0],
        ['B', 0],
      ],
      { A: { namePrefix: '' }, B: { namePrefix: '' } }
    ),
    errorCode('DESTINATION_NAMESPACE')
  );
});

test('opaque catalog events, JavaScript and malformed action values reject without dropping source semantics', async () => {
  const event = await sourcePdf('Event', 1, (pdf) =>
    pdf.catalog.set(
      name('AA'),
      pdf.context.obj({ Unknown: { S: 'URI', URI: PDFHexString.fromText('https://example.test') } })
    )
  );
  await assert.rejects(composeCatalog([event], [['Event', 0]]), errorCode('OPAQUE_CATALOG_EVENT'));
  const script = await sourcePdf('Script', 1, (pdf) =>
    pdf.catalog.set(
      name('OpenAction'),
      pdf.context.obj({
        S: 'JavaScript',
        JS: PDFHexString.fromText('this.getField("Name").value = "x"'),
      })
    )
  );
  await assert.rejects(composeCatalog([script], [['Script', 0]]), errorCode('OPAQUE_ACTION'));
  const malformed = await sourcePdf('Malformed', 1, (pdf) =>
    pdf.catalog.set(
      name('AA'),
      pdf.context.obj({
        WP: [pdf.context.obj({ S: 'URI', URI: PDFHexString.fromText('https://example.test') })],
      })
    )
  );
  await assert.rejects(
    composeCatalog([malformed], [['Malformed', 0]]),
    errorCode('CATALOG_ADDITIONAL_ACTION')
  );
});

test('Info object references, opaque metadata streams and unknown viewer settings fail locatably', async () => {
  const info = await sourcePdf('Info', 2, (pdf, pages) => {
    pdf.context.trailerInfo.Info = pdf.context.register(
      pdf.context.obj({ PrivatePage: pages[0].ref })
    );
  });
  await assert.rejects(
    composeCatalog([info], [['Info', 1]]),
    (error) => errorCode('OPAQUE_INFO_VALUE')(error) && error.path === '/Info/PrivatePage'
  );
  const external = await sourcePdf('External', 1, (pdf) =>
    pdf.catalog.set(
      name('Metadata'),
      pdf.context.register(
        pdf.context.stream('metadata', {
          Type: 'Metadata',
          Subtype: 'XML',
          F: PDFHexString.fromText('/outside/metadata.xml'),
        })
      )
    )
  );
  await assert.rejects(
    composeCatalog([external], [['External', 0]]),
    errorCode('OPAQUE_METADATA_STREAM')
  );
  const viewer = await sourcePdf('Viewer', 1, (pdf) =>
    pdf.catalog.set(name('ViewerPreferences'), pdf.context.obj({ UnknownView: 'Private' }))
  );
  await assert.rejects(
    composeCatalog([viewer], [['Viewer', 0]]),
    errorCode('OPAQUE_VIEWER_PREFERENCE')
  );
});

test('target page instance coverage and metadata policy are validated before catalog mutation', async () => {
  const a = await sourcePdf('A', 1),
    prepared = await prepareCatalog([a], [['A', 0]]);
  assert.throws(
    () => copyCatalog({ ...prepared, catalogPolicy: 'drop' }),
    errorCode('CATALOG_POLICY')
  );
  prepared.sources[0].instances[0].index = 4;
  assert.throws(() => copyCatalog(prepared), errorCode('CATALOG_INSTANCES'));
});

test('multiple relative Named initial page actions reject even when their action names match', async () => {
  const a = await sourcePdf('A', 1, (pdf) =>
      pdf.catalog.set(name('OpenAction'), pdf.context.obj({ S: 'Named', N: 'NextPage' }))
    ),
    b = await sourcePdf('B', 1, (pdf) =>
      pdf.catalog.set(name('OpenAction'), pdf.context.obj({ S: 'Named', N: 'NextPage' }))
    );
  await assert.rejects(
    composeCatalog(
      [a, b],
      [
        ['A', 0],
        ['B', 0],
      ]
    ),
    errorCode('OPEN_ACTION_CONFLICT')
  );
});

test('page label arithmetic outside safe integer range rejects instead of rounding a native St', async () => {
  const a = await sourcePdf('A', 2, (pdf) =>
    setLabels(pdf, [[0, { S: 'D', St: Number.MAX_SAFE_INTEGER }]])
  );
  await assert.rejects(composeCatalog([a], [['A', 1]]), errorCode('PAGE_LABEL_START'));
});

test('Metadata filters and DecodeParms cannot retain disguised page references', async () => {
  const filter = await sourcePdf('Filter', 1, (pdf, pages) =>
    pdf.catalog.set(
      name('Metadata'),
      pdf.context.register(
        pdf.context.stream('metadata', { Type: 'Metadata', Subtype: 'XML', Filter: pages[0].ref })
      )
    )
  );
  await assert.rejects(
    composeCatalog([filter], [['Filter', 0]]),
    (error) => errorCode('CATALOG_METADATA')(error) && error.path === '/Metadata/Filter'
  );
  const params = await sourcePdf('Params', 1, (pdf, pages) =>
    pdf.catalog.set(
      name('Metadata'),
      pdf.context.register(
        pdf.context.stream('metadata', {
          Type: 'Metadata',
          Subtype: 'XML',
          DecodeParms: pages[0].ref,
        })
      )
    )
  );
  await assert.rejects(
    composeCatalog([params], [['Params', 0]]),
    errorCode('CATALOG_METADATA_PARAMS')
  );
});
