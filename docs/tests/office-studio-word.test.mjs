import assert from 'node:assert/strict';
import { Blob, Buffer } from 'node:buffer';
import { webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import { URL } from 'node:url';
import { runInNewContext } from 'node:vm';

const require = createRequire(new URL('../package.json', import.meta.url));
const uiRequire = createRequire(new URL('../../packages/ui/package.json', import.meta.url));
const { JSDOM } = uiRequire('jsdom');
const JSZip = require('jszip');
const ts = require('typescript');
const xml = new JSDOM().window;
const exports = {};
const styleExports = {};
const fontExports = {};
const metricExports = {};
const paragraphExports = {};
const tabExports = {};
const numberExports = {};
const numberCodecExports = {};
const imageExports = {};
for (const [file, target] of [
  ['studio-font-input.ts', fontExports],
  ['studio-word-metrics.ts', metricExports],
  ['studio-word-paragraph-format.ts', paragraphExports],
  ['studio-word-tabs.ts', tabExports],
  ['studio-word-numbering.ts', numberExports],
  ['studio-word-styles.ts', styleExports],
  ['studio-word-images.ts', imageExports],
  ['studio-word-image-preview.ts', imageExports],
]) {
  runInNewContext(
    ts.transpileModule(
      readFileSync(
        new URL(`../../packages/ui/src/components/OfficeStudio/${file}`, import.meta.url),
        'utf8'
      ),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
          esModuleInterop: true,
        },
      }
    ).outputText,
    {
      exports: target,
      require: (id) =>
        id === './studio-word-tabs' ? tabExports : id === './studio-word-paragraph-format'
          ? paragraphExports
          : id === './studio-word-metrics'
            ? metricExports
            : id === './studio-font-input'
              ? fontExports
              : uiRequire(id),
    }
  );
}
runInNewContext(ts.transpileModule(readFileSync(new URL('../src/pages/collaboration/office-studio/studio-word-numbering-codec.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{
  exports:numberCodecExports, require:(id)=>id.endsWith('/studio-word-numbering')?numberExports:id.endsWith('/studio-word-tabs')?tabExports:require(id), DOMParser:xml.DOMParser, XMLSerializer:xml.XMLSerializer,
});
runInNewContext(
  ts.transpileModule(
    readFileSync(
      new URL('../src/pages/collaboration/office-studio/studio-word-codec.ts', import.meta.url),
      'utf8'
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }
  ).outputText,
  {
    exports,
    require: (id) =>
      id.endsWith('/studio-word-numbering') ? numberExports : id === './studio-word-numbering-codec' ? numberCodecExports : id.endsWith('/studio-word-tabs') ? tabExports : id.endsWith('/studio-word-paragraph-format')
        ? paragraphExports
        : id.endsWith('/studio-word-metrics')
          ? metricExports
          : id.endsWith('/studio-word-styles')
            ? styleExports
            : id.endsWith('/studio-word-images')
              ? imageExports
              : require(id),
    Blob,
    crypto: webcrypto,
    DOMParser: xml.DOMParser,
    URL,
    Uint8Array,
    ArrayBuffer,
  }
);
const { importStudioWord, exportStudioWord } = exports;
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

test('full native numbering templates, interrupted sequences and independent starts survive edits and repeated DOCX reopenings',async()=>{
  const numbered=(level,id,label)=>`<w:p><w:pPr><w:numPr><w:ilvl w:val="${level}"/><w:numId w:val="${id}"/></w:numPr></w:pPr><w:r><w:t>${label}</w:t></w:r></w:p>`;
  let document=await importStudioWord(await fixture(numbered(0,4,'Chapter')+numbered(1,4,'Child')+'<w:p><w:r><w:t>Gap</w:t></w:r></w:p>'+numbered(1,4,'Next child')+numbered(0,7,'Restart'),{
    'word/numbering.xml':`<w:numbering xmlns:w="${W}"><w:abstractNum w:abstractNumId="1"><w:lvl w:ilvl="0"><w:start w:val="3"/><w:numFmt w:val="upperRoman"/><w:lvlText w:val="%1."/></w:lvl><w:lvl w:ilvl="1"><w:start w:val="1"/><w:numFmt w:val="lowerLetter"/><w:lvlText w:val="%1.%2."/></w:lvl></w:abstractNum><w:num w:numId="4"><w:abstractNumId w:val="1"/></w:num><w:num w:numId="7"><w:abstractNumId w:val="1"/><w:lvlOverride w:ilvl="0"><w:startOverride w:val="9"/></w:lvlOverride></w:num></w:numbering>`,
  }),'Numbered.docx');
  const labels=()=>Array.from(numberExports.wordNumberingLabels(document.content,numberExports.wordNumberingCatalog(document.content.attrs.numberingDefinitions,document.content.attrs.numberingInstances)),(entry)=>entry.text);
  assert.deepEqual(labels(),['III.','III.a.','III.b.','IX.']);
  document.content.attrs.numberingDefinitions[0].levels[0].format='decimal';
  document.content.attrs.numberingDefinitions[0].levels[1].text='%1.%2)';
  for(let pass=0;pass<2;pass++){
    const saved=await exportStudioWord(document);document=await importStudioWord(saved,'Reopened.docx');
    assert.deepEqual(labels(),['3.','3.a)','3.b)','9.']);
    assert.equal(document.content.attrs.numberingInstances.find((entry)=>entry.id==='native-instance-7').startOverrides['0'],9);
    assert.equal(find(document.content,'text').map((node)=>node.text).join(''),'ChapterChildGapNext childRestart');
  }
});

test('native period and comma decimal symbols persist independently of text grouping separators', async () => {
  for (const [symbol,text] of [['.','1,234.50'],[',','1.234,50']]) {
    let document=await importStudioWord(await fixture(`<w:p><w:pPr><w:tabs><w:tab w:val="decimal" w:pos="3600"/></w:tabs></w:pPr><w:r><w:t>Group</w:t><w:tab/><w:t>${text}</w:t></w:r></w:p>`,{
      'word/settings.xml':`<w:settings xmlns:w="${W}"><w:decimalSymbol w:val="${symbol}"/></w:settings>`,
    }),'Symbol.docx');
    for(let pass=0;pass<2;pass++){
      assert.equal(document.decimalSymbol,symbol);
      const file=await exportStudioWord(document),zip=await JSZip.loadAsync(await file.arrayBuffer());
      const settings=parse(await zip.file('word/settings.xml').async('string'));
      assert.equal(settings.getElementsByTagNameNS(W,'decimalSymbol')[0].getAttributeNS(W,'val'),symbol);
      document=await importStudioWord(file,'Reopened.docx');
      assert.equal(find(document.content,'text').map((node)=>node.text).join(''),`Group\t${text}`);
    }
  }
});

test('native tab stops, leaders, inherited clear directives and the default interval survive edits and repeated DOCX saves', async () => {
  const source = await fixture('<w:p><w:pPr><w:pStyle w:val="Tabs"/><w:tabs><w:tab w:val="clear" w:pos="720"/><w:tab w:val="decimal" w:pos="2880" w:leader="dot"/></w:tabs></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>Label</w:t><w:tab/><w:t>12.34</w:t></w:r></w:p><w:p><w:pPr><w:tabs><w:tab w:val="left" w:pos="720"/><w:tab w:val="center" w:pos="1440" w:leader="hyphen"/><w:tab w:val="right" w:pos="2160" w:leader="underscore"/></w:tabs></w:pPr><w:r><w:t>A</w:t><w:tab/><w:t>B</w:t><w:tab/><w:t>C</w:t></w:r></w:p>', {
    'word/styles.xml': `<w:styles xmlns:w="${W}"><w:style w:type="paragraph" w:styleId="Tabs"><w:name w:val="Tabs"/><w:pPr><w:tabs><w:tab w:val="left" w:pos="720"/><w:tab w:val="right" w:pos="2160" w:leader="dot"/></w:tabs></w:pPr></w:style></w:styles>`,
    'word/settings.xml': `<w:settings xmlns:w="${W}"><w:defaultTabStop w:val="600"/></w:settings>`,
  });
  let document = await importStudioWord(source, 'Tabs.docx');
  assert.equal(document.defaultTabStop, 30);
  assert.equal(document.content.content[0].attrs.tabStops[0].alignment, 'clear');
  assert.equal(document.content.attrs.paragraphStyles[0].tabStops[1].alignment, 'right');
  document.content.content[0].attrs.tabStops[1] = { position: 170.25, alignment: 'decimal', leader: 'dot' };
  for (let pass = 0; pass < 2; pass++) {
    const file = await exportStudioWord(document), zip = await JSZip.loadAsync(await file.arrayBuffer());
    const native = parse(await zip.file('word/document.xml').async('string'));
    const tab = [...native.getElementsByTagNameNS(W, 'tab')].find((item) => item.getAttributeNS(W, 'val') === 'decimal');
    assert.equal(tab.getAttributeNS(W, 'pos'), '3405');
    assert.equal(tab.getAttributeNS(W, 'leader'), 'dot');
    assert.ok([...native.getElementsByTagNameNS(W, 'tab')].some((item) => item.getAttributeNS(W, 'val') === 'clear'));
    assert.equal(parse(await zip.file('word/settings.xml').async('string')).getElementsByTagNameNS(W, 'defaultTabStop')[0].getAttributeNS(W,'val'),'600');
    document = await importStudioWord(file, 'Reopened.docx');
    assert.equal(document.defaultTabStop, 30);
    assert.deepEqual(JSON.parse(JSON.stringify(document.content.content[0].attrs.tabStops)), [{ position: 36, alignment: 'clear' }, { position: 170.25, alignment: 'decimal', leader: 'dot' }]);
    assert.equal(find(document.content,'text').map((node) => node.text).join(''), 'Label\t12.34A\tB\tC');
    assert.ok(find(document.content,'text')[0].marks.some((mark) => mark.type === 'bold'));
  }
});

test('unsupported, duplicate and malformed native tab definitions reject the whole document', async () => {
  for (const tabs of [
    '<w:tab w:val="bar" w:pos="720"/>', '<w:tab w:val="left" w:pos="-1"/>',
    '<w:tab w:val="left" w:pos="720" w:leader="heavy"/>',
    '<w:tab w:val="left" w:pos="720"/><w:tab w:val="right" w:pos="720"/>',
  ]) await assert.rejects(importStudioWord(await fixture(`<w:p><w:pPr><w:tabs>${tabs}</w:tabs></w:pPr><w:r><w:t>Original</w:t></w:r></w:p>`),'Invalid.docx'));
  await assert.rejects(importStudioWord(await fixture('<w:p><w:r><w:t>Original</w:t></w:r></w:p>',{
    'word/settings.xml':`<w:settings xmlns:w="${W}"><w:defaultTabStop w:val="600.5"/></w:settings>`,
  }),'Invalid.docx'));
});

test('paragraph indentation and three native line-spacing rules preserve point values and text over repeated DOCX saves', async () => {
  const source = await fixture(
    '<w:p><w:pPr><w:jc w:val="both"/><w:ind w:left="240" w:right="120" w:hanging="180"/><w:spacing w:before="120" w:after="180" w:line="440" w:lineRule="exact"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>Exact</w:t></w:r></w:p><w:p><w:pPr><w:ind w:start="480" w:end="240" w:firstLine="180"/><w:spacing w:line="600" w:lineRule="atLeast"/></w:pPr><w:r><w:t>Minimum</w:t></w:r></w:p><w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto"/></w:pPr><w:r><w:t>Multiple</w:t></w:r></w:p>'
  );
  let document = await importStudioWord(source, 'Paragraph.docx');
  assert.equal(document.content.content[0].attrs.lineHeight, 22);
  assert.equal(document.content.content[0].attrs.indentFirstLine, -9);
  assert.equal(document.content.content[1].attrs.lineHeight, 30);
  assert.equal(document.content.content[1].attrs.indentLeft, 24);
  assert.equal(document.content.content[1].attrs.indentRight, 12);
  assert.equal(document.content.content[2].attrs.lineHeight, 1.5);
  document.content.content[0].attrs = {
    ...document.content.content[0].attrs,
    indentLeft: 18,
    indentFirstLine: -12,
    lineHeight: 24,
  };
  for (let pass = 0; pass < 2; pass++) {
    const file = await exportStudioWord(document);
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const xml = parse(await zip.file('word/document.xml').async('string'));
    const spacing = [...xml.getElementsByTagNameNS(W, 'spacing')].filter(
      (e) => e.parentElement.localName === 'pPr'
    );
    assert.equal(spacing[0].getAttributeNS(W, 'line'), '480');
    assert.equal(spacing[0].getAttributeNS(W, 'lineRule'), 'exact');
    assert.equal(spacing[1].getAttributeNS(W, 'lineRule'), 'atLeast');
    assert.equal(spacing[2].getAttributeNS(W, 'line'), '360');
    assert.equal(spacing[2].getAttributeNS(W, 'lineRule'), 'auto');
    const ind = xml.getElementsByTagNameNS(W, 'ind')[0];
    assert.equal(ind.getAttributeNS(W, 'left'), '360');
    assert.equal(ind.getAttributeNS(W, 'hanging'), '240');
    document = await importStudioWord(file, 'Reopened.docx');
    assert.equal(document.content.content[0].attrs.lineHeight, 24);
    assert.equal(document.content.content[0].attrs.indentFirstLine, -12);
    assert.equal(find(document.content, 'text')[0].text, 'Exact');
    assert.ok(find(document.content, 'text')[0].marks.some((mark) => mark.type === 'bold'));
  }
});

test('partial native line properties preserve style raw-unit inheritance and direct paragraph zero overrides', async () => {
  const source = await fixture(
    '<w:p><w:pPr><w:pStyle w:val="Base"/><w:ind w:firstLine="0"/><w:spacing w:before="0"/></w:pPr><w:r><w:t>Direct zero</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="OwnRule"/></w:pPr><w:r><w:t>Rule</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="OwnValue"/></w:pPr><w:r><w:t>Value</w:t></w:r></w:p>',
    {
      'word/styles.xml': `<w:styles xmlns:w="${W}"><w:style w:type="paragraph" w:styleId="Base"><w:name w:val="Base"/><w:pPr><w:spacing w:line="480" w:lineRule="auto" w:before="120"/><w:ind w:firstLine="240"/></w:pPr></w:style><w:style w:type="paragraph" w:styleId="OwnRule"><w:name w:val="Own rule"/><w:basedOn w:val="Base"/><w:pPr><w:spacing w:lineRule="exact"/></w:pPr></w:style><w:style w:type="paragraph" w:styleId="OwnValue"><w:name w:val="Own value"/><w:basedOn w:val="Base"/><w:pPr><w:spacing w:line="360"/></w:pPr></w:style></w:styles>`,
    }
  );
  let document = await importStudioWord(source, 'Inheritance.docx');
  const old = document.content.attrs.paragraphStyles;
  const changed = old.map((style) =>
    style.name === 'Base'
      ? {
          ...style,
          paragraph: {
            ...style.paragraph,
            lineHeightRule: 'exact',
            lineHeight: 18,
            lineHeightBasis: 'points',
            indentFirstLine: 24,
            spaceBefore: 12,
          },
        }
      : style
  );
  document.content = styleExports.reconcileStudioWordStyles(document.content, old, changed);
  document.content.attrs.paragraphStyles = changed;
  assert.deepEqual(
    Array.from(document.content.content, (p) => p.attrs.lineHeight),
    [18, 18, 18]
  );
  assert.equal(document.content.content[0].attrs.indentFirstLine, 0);
  assert.equal(document.content.content[0].attrs.spaceBefore, 0);
  for (let pass = 0; pass < 2; pass++) {
    const file = await exportStudioWord(document);
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const xml = parse(await zip.file('word/styles.xml').async('string'));
    const value = [...xml.getElementsByTagNameNS(W, 'style')].find(
      (e) => e.getElementsByTagNameNS(W, 'name')[0]?.getAttributeNS(W, 'val') === 'Own value'
    );
    const spacing = value.getElementsByTagNameNS(W, 'spacing')[0];
    assert.equal(spacing.getAttributeNS(W, 'line'), '360');
    assert.equal(spacing.getAttributeNS(W, 'lineRule'), null);
    document = await importStudioWord(file, 'Reopened.docx');
    assert.deepEqual(
      Array.from(document.content.content, (p) => p.attrs.lineHeight),
      [18, 18, 18]
    );
    assert.equal(document.content.content[0].attrs.indentFirstLine, 0);
    assert.equal(document.content.content[0].attrs.spaceBefore, 0);
  }
});

test('signed native run spacing and position preserve fonts, scripts, header/footer and repeated DOCX edits', async () => {
  const source = await fixture(
    '<w:p><w:r><w:rPr><w:b/><w:sz w:val="28"/><w:spacing w:val="24"/><w:position w:val="4"/><w:vertAlign w:val="superscript"/></w:rPr><w:t>A</w:t></w:r><w:r><w:rPr><w:i/><w:sz w:val="60"/><w:spacing w:val="-10"/><w:position w:val="-5"/></w:rPr><w:t>B</w:t></w:r></w:p>'
  );
  let document = await importStudioWord(source, 'metrics.docx');
  const style = (node) => node.marks?.find((mark) => mark.type === 'textStyle')?.attrs;
  const runs = () => find(document.content, 'text');
  assert.equal(style(runs()[0]).letterSpacing, '1.2pt');
  assert.equal(style(runs()[0]).baselineShift, '2pt');
  assert.equal(style(runs()[1]).letterSpacing, '-0.5pt');
  assert.equal(style(runs()[1]).baselineShift, '-2.5pt');
  document.content.content[0].content[0].text = 'edited A';
  document.header = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          text('Header', [
            { type: 'textStyle', attrs: { letterSpacing: '0.3pt', baselineShift: '1.5pt' } },
          ]),
        ],
      },
    ],
  };
  document.footer = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          text('Footer', [
            { type: 'textStyle', attrs: { letterSpacing: '0pt', baselineShift: '-1.5pt' } },
          ]),
        ],
      },
    ],
  };
  for (let pass = 0; pass < 2; pass++) {
    const saved = await exportStudioWord(document);
    const zip = await JSZip.loadAsync(await saved.arrayBuffer());
    const native = parse(await zip.file('word/document.xml').async('string'));
    assert.equal(
      [...native.getElementsByTagNameNS(W, 'spacing')]
        .find((p) => p.parentElement.localName === 'rPr')
        .getAttributeNS(W, 'val'),
      '24'
    );
    assert.equal(native.getElementsByTagNameNS(W, 'position')[0].getAttributeNS(W, 'val'), '2pt');
    document = await importStudioWord(saved, 'Reopened.docx');
    assert.equal(runs()[0].text, 'edited A');
    assert.equal(style(runs()[0]).fontSize, '14pt');
    assert.ok(runs()[0].marks.some((mark) => mark.type === 'superscript'));
    assert.equal(style(runs()[1]).fontSize, '30pt');
    assert.equal(style(runs()[0]).letterSpacing, '1.2pt');
    assert.equal(style(runs()[1]).baselineShift, '-2.5pt');
    assert.equal(style(find(document.header, 'text')[0]).baselineShift, '1.5pt');
    assert.equal(style(find(document.footer, 'text')[0]).baselineShift, '-1.5pt');
  }
});

test('style inheritance and explicit zero spacing/position overrides survive native DOCX serialization', async () => {
  const source = await fixture(
    '<w:p><w:pPr><w:pStyle w:val="wide"/></w:pPr><w:r><w:t>inherit</w:t></w:r><w:r><w:rPr><w:spacing w:val="0"/><w:position w:val="0"/></w:rPr><w:t>direct zero</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="reset"/></w:pPr><w:r><w:t>child zero</w:t></w:r></w:p>',
    {
      'word/styles.xml': `<w:styles xmlns:w="${W}"><w:style w:type="paragraph" w:styleId="wide"><w:name w:val="Wide"/><w:rPr><w:spacing w:val="40"/><w:position w:val="6"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="reset"><w:name w:val="Reset"/><w:basedOn w:val="wide"/><w:rPr><w:spacing w:val="0"/><w:position w:val="0"/></w:rPr></w:style></w:styles>`,
    }
  );
  let document = await importStudioWord(source, 'Inherited.docx');
  for (let pass = 0; pass < 2; pass++) {
    const saved = await exportStudioWord(document);
    const zip = await JSZip.loadAsync(await saved.arrayBuffer());
    const native = parse(await zip.file('word/document.xml').async('string'));
    assert.ok(
      [...native.getElementsByTagNameNS(W, 'spacing')].some(
        (p) => p.getAttributeNS(W, 'val') === '0'
      )
    );
    const styles = parse(await zip.file('word/styles.xml').async('string'));
    const zero = [...styles.getElementsByTagNameNS(W, 'style')].find(
      (s) => s.getElementsByTagNameNS(W, 'name')[0]?.getAttributeNS(W, 'val') === 'Reset'
    );
    assert.equal(
      [...zero.getElementsByTagNameNS(W, 'spacing')]
        .find((p) => p.parentElement.localName === 'rPr')
        .getAttributeNS(W, 'val'),
      '0'
    );
    document = await importStudioWord(saved, 'Inherited.docx');
    const runs = find(document.content, 'text');
    const attrs = runs.map((n) => n.marks.find((m) => m.type === 'textStyle').attrs);
    assert.deepEqual(
      attrs.map((a) => [a.letterSpacing, a.baselineShift]),
      [
        ['2pt', '3pt'],
        ['0pt', '0pt'],
        ['0pt', '0pt'],
      ]
    );
  }
});

test('explicit zero run metrics also cancel inherited values on images and page fields', async () => {
  const source = model([
    {
      type: 'paragraph',
      attrs: { paragraphStyle: 'wide', paragraphStyleMaterialized: true },
      content: [
        {
          type: 'image',
          attrs: {
            src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y3nRmwAAAAASUVORK5CYII=',
            width: 10,
            height: 10,
            alt: 'zero',
          },
          marks: [{ type: 'textStyle', attrs: { letterSpacing: '0pt', baselineShift: '0pt' } }],
        },
        {
          type: 'pageNumber',
          attrs: { kind: 'current' },
          marks: [{ type: 'textStyle', attrs: { letterSpacing: '0pt', baselineShift: '0pt' } }],
        },
      ],
    },
  ]);
  source.content.attrs = {
    paragraphStyles: [{ id: 'wide', name: 'Wide', run: { letterSpacing: 2, baselineShift: 3 } }],
  };
  const file = await exportStudioWord(source);
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const native = parse(await zip.file('word/document.xml').async('string'));
  const resets = [...native.getElementsByTagNameNS(W, 'spacing')].filter(
    (p) => p.parentElement.localName === 'rPr' && p.getAttributeNS(W, 'val') === '0'
  );
  assert.equal(resets.length, 2);
  const reopened = await importStudioWord(file, 'Reset.docx');
  for (const node of [
    ...find(reopened.content, 'image'),
    ...find(reopened.content, 'pageNumber'),
  ]) {
    const attrs = node.marks.find((mark) => mark.type === 'textStyle').attrs;
    assert.equal(attrs.letterSpacing, '0pt', node.type);
    assert.equal(attrs.baselineShift, '0pt', node.type);
  }
});

test('invalid character metrics are refused without changing the original model', async () => {
  await assert.rejects(
    importStudioWord(
      await fixture('<w:p><w:r><w:rPr><w:spacing w:val="1.5"/></w:rPr><w:t>A</w:t></w:r></w:p>'),
      'Invalid.docx'
    ),
    /字符间距/
  );
  const doc = model([
    {
      type: 'paragraph',
      content: [text('safe', [{ type: 'textStyle', attrs: { letterSpacing: '0.01pt' } }])],
    },
  ]);
  const before = JSON.stringify(doc);
  await assert.rejects(exportStudioWord(doc), /字符间距/);
  assert.equal(JSON.stringify(doc), before);
});

test('native tabs, repeated spaces, nonbreaking spaces and line breaks retain their original characters and formatting across DOCX edits and repeated saves', async () => {
  const source = await fixture(
    '<w:p><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">  😀 A </w:t><w:tab/><w:tab/><w:t xml:space="preserve"> B\u00a0Z  </w:t><w:br/><w:t>Next line</w:t></w:r></w:p><w:p/>'
  );
  let document = await importStudioWord(source, 'nonprinting.docx');
  const text = (node) =>
    node.type === 'hardBreak'
      ? '\n'
      : node.type === 'text'
        ? node.text
        : (node.content || []).map(text).join('');
  assert.equal(text(document.content), '  😀 A \t\t B\u00a0Z  \nNext line');
  document.content.content[0].content[0].text = '  😀 A edited ';
  for (let pass = 0; pass < 2; pass++) {
    const saved = await exportStudioWord(document);
    const zip = await JSZip.loadAsync(await saved.arrayBuffer());
    const sourceXml = await zip.file('word/document.xml').async('string');
    const native = parse(sourceXml);
    assert.equal(native.getElementsByTagNameNS(W, 'tab').length, 2);
    assert.equal(native.getElementsByTagNameNS(W, 'br').length, 1);
    assert.ok(!sourceXml.includes('data-word-nonprinting') && !sourceXml.includes('¶'));
    document = await importStudioWord(saved, document.name);
    assert.equal(text(document.content), '  😀 A edited \t\t B\u00a0Z  \nNext line');
    assert.equal(document.content.content.length, 2);
    for (const run of find(document.content, 'text').filter(
      (node) => node.text.includes('😀') || node.text.includes('\t')
    ))
      assert.ok(run.marks.some((mark) => mark.type === 'bold'));
  }
});
const PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y3nRmwAAAAASUVORK5CYII=';
const JPEG =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAQACADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDn6KKK++PngooooA//2Q==';
const image = (attrs = {}) => ({
  type: 'image',
  attrs: {
    src: `data:image/png;base64,${PNG}`,
    width: 300,
    height: 150,
    alt: '项目示意图',
    ...attrs,
  },
});
const text = (value, marks) => ({ type: 'text', text: value, ...(marks ? { marks } : {}) });
const p = (...content) => ({ type: 'paragraph', content });
const cell = (value, attrs = {}, type = 'tableCell') => ({
  type,
  attrs: { colspan: 1, rowspan: 1, colwidth: null, ...attrs },
  content: [p(text(value))],
});
const model = (content) => ({
  version: 1,
  id: 'word-test',
  kind: 'word',
  name: '往返验证.docx',
  page: { size: 'A4', orientation: 'landscape', margin: 20 },
  content: { type: 'doc', content },
});
const flatten = (node) => (node.text || '') + (node.content || []).map(flatten).join('');
const find = (node, type) => [
  ...(node.type === type ? [node] : []),
  ...(node.content || []).flatMap((child) => find(child, type)),
];
const findText = (node, value) => find(node, 'text').find((item) => item.text === value);
const attrs = (node, mark) => node.marks?.find((item) => item.type === mark)?.attrs;
const parse = (value) => new xml.DOMParser().parseFromString(value, 'application/xml');

test('named paragraph styles preserve inheritance, native links, automatic update and direct overrides over repeated saves', async () => {
  let current = model([
    {
      type: 'paragraph',
      attrs: { paragraphStyle: 'summary', paragraphStyleMaterialized: true, lineHeight: 1.5 },
      content: [
        text('继承格式', [
          { type: 'bold' },
          { type: 'italic' },
          {
            type: 'textStyle',
            attrs: { fontFamily: 'Noto Sans SC', fontSize: '14pt', color: '#185adb' },
          },
        ]),
        text('单独取消粗体', [
          { type: 'italic' },
          {
            type: 'textStyle',
            attrs: { fontFamily: 'Noto Sans SC', fontSize: '14pt', color: '#185adb' },
          },
        ]),
      ],
    },
  ]);
  current.content.attrs = {
    paragraphStyles: [
      {
        id: 'review',
        name: '评审正文',
        run: { fontSize: 14, bold: true, color: '#185adb', backgroundColor: '#ffff00' },
        paragraph: { lineHeight: 1.5 },
        autoUpdate: true,
      },
      {
        id: 'summary',
        name: '评审摘要',
        basedOn: 'review',
        next: 'review',
        run: { italic: true, backgroundColor: null },
      },
      { id: 'unused', name: '尚未应用', basedOn: 'summary', run: { underline: true } },
    ],
  };
  for (let round = 0; round < 3; round++) {
    const blob = await exportStudioWord(current);
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const nativeStyles = parse(await zip.file('word/styles.xml').async('string'));
    const nativeSummary = [...nativeStyles.getElementsByTagNameNS(W, 'style')].find(
      (style) => style.getAttributeNS(W, 'styleId') === 'ZuviStyle_summary'
    );
    assert.equal(
      nativeSummary.getElementsByTagNameNS(W, 'basedOn')[0].getAttributeNS(W, 'val'),
      'ZuviStyle_review'
    );
    assert.equal(
      nativeSummary.getElementsByTagNameNS(W, 'next')[0].getAttributeNS(W, 'val'),
      'ZuviStyle_review'
    );
    assert.equal(nativeStyles.getElementsByTagNameNS(W, 'autoRedefine').length, 1);
    const native = parse(await zip.file('word/document.xml').async('string'));
    assert.equal(
      native.getElementsByTagNameNS(W, 'pStyle')[0].getAttributeNS(W, 'val'),
      'ZuviStyle_summary'
    );
    current = await importStudioWord(blob, current.name);
    const definitions = current.content.attrs.paragraphStyles;
    assert.deepEqual(
      JSON.parse(JSON.stringify(definitions.map((style) => [style.id, style.name]))),
      [
        ['review', '评审正文'],
        ['summary', '评审摘要'],
        ['unused', '尚未应用'],
      ]
    );
    assert.equal(definitions[0].autoUpdate, true);
    assert.equal(definitions[1].basedOn, 'review');
    assert.equal(definitions[1].run.backgroundColor, null);
    assert.equal(find(current.content, 'paragraph')[0].attrs.paragraphStyle, 'summary');
    assert.ok(findText(current.content, '继承格式').marks.some((mark) => mark.type === 'bold'));
    assert.ok(
      !findText(current.content, '单独取消粗体').marks.some((mark) => mark.type === 'bold')
    );
    assert.equal(attrs(findText(current.content, '继承格式'), 'textStyle').fontSize, '14pt');
    assert.equal(
      attrs(findText(current.content, '继承格式'), 'textStyle').backgroundColor,
      undefined
    );
  }
});

test('native custom styles remain editable definitions with parent and next-style links', async () => {
  const blob = await fixture(
    '<w:p><w:pPr><w:pStyle w:val="ReviewChild"/></w:pPr><w:r><w:t>导入内容</w:t></w:r></w:p>',
    {
      'word/styles.xml': `<w:styles xmlns:w="${W}">
      <w:style w:type="paragraph" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Calibri"/><w:sz w:val="22"/></w:rPr><w:pPr><w:spacing w:after="0"/></w:pPr></w:style>
      <w:style w:type="paragraph" w:styleId="ReviewBase"><w:name w:val="Review Base"/><w:basedOn w:val="Normal"/><w:rPr><w:i/><w:sz w:val="28"/></w:rPr><w:pPr><w:spacing w:line="360"/></w:pPr></w:style>
      <w:style w:type="paragraph" w:styleId="ReviewChild"><w:name w:val="Review Child"/><w:basedOn w:val="ReviewBase"/><w:next w:val="ReviewBase"/><w:rPr><w:b w:val="0"/></w:rPr></w:style>
    </w:styles>`,
    }
  );
  const imported = await importStudioWord(blob, '原生样式.docx');
  const definitions = imported.content.attrs.paragraphStyles;
  const parent = definitions.find((style) => style.name === 'Review Base');
  const child = definitions.find((style) => style.name === 'Review Child');
  assert.equal(child.basedOn, parent.id);
  assert.equal(child.next, parent.id);
  const resolved = styleExports.resolveStudioWordParagraphStyle(definitions, child.id);
  assert.equal(resolved.run.fontFamily, 'Calibri');
  assert.equal(resolved.run.fontSize, 14);
  assert.equal(resolved.run.italic, true);
  assert.equal(resolved.run.bold, false);
  assert.equal(resolved.paragraph.lineHeight, 1.5);
  assert.equal(resolved.paragraph.spaceAfter, 0);
  const reopened = await importStudioWord(await exportStudioWord(imported), imported.name);
  assert.equal(
    reopened.content.attrs.paragraphStyles.find((style) => style.name === 'Review Child').basedOn,
    parent.id
  );
  assert.equal(flatten(reopened.content), '导入内容');
});

test('a named body style can explicitly remove an inherited heading outline level', async () => {
  const source = model([
    { type: 'paragraph', attrs: { paragraphStyle: 'plain' }, content: [text('正文提示')] },
  ]);
  source.content.attrs = {
    paragraphStyles: [{ id: 'plain', name: '普通提示', basedOn: 'heading-1', headingLevel: 0 }],
  };
  const restored = await importStudioWord(await exportStudioWord(source), source.name);
  assert.equal(restored.content.content[0].type, 'paragraph');
  assert.equal(restored.content.attrs.paragraphStyles[0].headingLevel, 0);
  assert.equal(attrs(findText(restored.content, '正文提示'), 'textStyle').fontSize, '24pt');
  assert.ok(findText(restored.content, '正文提示').marks.some((mark) => mark.type === 'bold'));
});

test('invalid style graphs cannot be exported or partially change the source document', async () => {
  const source = model([p(text('保留正文'))]);
  source.content.attrs = {
    paragraphStyles: [
      { id: 'a', name: '甲', basedOn: 'b' },
      { id: 'b', name: '乙', basedOn: 'a' },
    ],
  };
  const before = JSON.stringify(source);
  await assert.rejects(exportStudioWord(source), /循环/);
  assert.equal(JSON.stringify(source), before);
});

test('derived styles retain inherited heading levels instead of freezing the parent level on import', async () => {
  const source = model([
    { type: 'paragraph', attrs: { paragraphStyle: 'child' }, content: [text('继承标题')] },
  ]);
  source.content.attrs = {
    paragraphStyles: [
      { id: 'parent', name: '基础标题', basedOn: 'heading-2' },
      { id: 'child', name: '继承标题', basedOn: 'parent' },
    ],
  };
  const restored = await importStudioWord(await exportStudioWord(source), source.name);
  const definitions = restored.content.attrs.paragraphStyles;
  assert.equal(definitions.find((style) => style.id === 'child').headingLevel, undefined);
  assert.equal(styleExports.resolveStudioWordParagraphStyle(definitions, 'child').headingLevel, 2);
  const changed = definitions.map((style) =>
    style.id === 'parent' ? { ...style, headingLevel: 0 } : style
  );
  assert.equal(styleExports.resolveStudioWordParagraphStyle(changed, 'child').headingLevel, 0);
});

test('paragraph-level outline overrides survive saving without changing the linked style definition', async () => {
  const blob = await fixture(
    '<w:p><w:pPr><w:pStyle w:val="CustomHead"/><w:outlineLvl w:val="9"/></w:pPr><w:r><w:t>正文中的标题格式</w:t></w:r></w:p>',
    {
      'word/styles.xml': `<w:styles xmlns:w="${W}"><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:pPr><w:outlineLvl w:val="0"/></w:pPr></w:style><w:style w:type="paragraph" w:styleId="CustomHead"><w:name w:val="Custom Head"/><w:basedOn w:val="Heading1"/></w:style></w:styles>`,
    }
  );
  const imported = await importStudioWord(blob, '大纲覆盖.docx');
  assert.equal(imported.content.content[0].type, 'paragraph');
  assert.equal(
    styleExports.resolveStudioWordParagraphStyle(
      imported.content.attrs.paragraphStyles,
      imported.content.content[0].attrs.paragraphStyle
    ).headingLevel,
    1
  );
  const restored = await importStudioWord(await exportStudioWord(imported), imported.name);
  assert.equal(restored.content.content[0].type, 'paragraph');
  assert.equal(
    styleExports.resolveStudioWordParagraphStyle(
      restored.content.attrs.paragraphStyles,
      restored.content.content[0].attrs.paragraphStyle
    ).headingLevel,
    1
  );
});

test('named styles inside a quote retain the existing quote border and structure after saving', async () => {
  const blob = await fixture(
    '<w:p><w:pPr><w:pStyle w:val="DerivedQuote"/></w:pPr><w:r><w:t>保留引用样式</w:t></w:r></w:p>',
    {
      'word/styles.xml': `<w:styles xmlns:w="${W}"><w:style w:type="paragraph" w:styleId="ZuviQuote"><w:name w:val="ZUVI Quote"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="360"/><w:pBdr><w:left w:val="single" w:sz="18" w:color="1F2937"/></w:pBdr></w:pPr></w:style><w:style w:type="paragraph" w:styleId="DerivedQuote"><w:name w:val="Derived Quote"/><w:basedOn w:val="ZuviQuote"/></w:style></w:styles>`,
    }
  );
  const imported = await importStudioWord(blob, '引用样式.docx');
  assert.equal(find(imported.content, 'blockquote').length, 1);
  const saved = await exportStudioWord(imported);
  const zip = await JSZip.loadAsync(await saved.arrayBuffer());
  const native = parse(await zip.file('word/document.xml').async('string'));
  assert.equal(native.getElementsByTagNameNS(W, 'pBdr').length, 1);
  const restored = await importStudioWord(saved, imported.name);
  assert.equal(find(restored.content, 'blockquote').length, 1);
  assert.equal(flatten(restored.content), '保留引用样式');
});

async function fixture(body, parts = {}) {
  const zip = new JSZip();
  zip.file(
    'word/document.xml',
    `<w:document xmlns:w="${W}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:bottom="1134" w:left="1134" w:right="1134"/></w:sectPr></w:body></w:document>`
  );
  for (const [name, value] of Object.entries(parts)) zip.file(name, value);
  return new Blob([await zip.generateAsync({ type: 'uint8array' })]);
}

test('DOCX roundtrip keeps headings, rich text, link, hard/page breaks and page configuration', async () => {
  const source = model([
    { type: 'heading', attrs: { level: 2, textAlign: 'center' }, content: [text('项目评审')] },
    {
      type: 'paragraph',
      attrs: {
        indentLeft: 18,
        indentFirstLine: 12,
        spaceBefore: 6,
        spaceAfter: 12,
        lineHeight: 1.5,
      },
      content: [
        text('重点说明', [
          { type: 'bold' },
          { type: 'italic' },
          { type: 'underline' },
          { type: 'strike' },
          {
            type: 'textStyle',
            attrs: {
              fontFamily: 'SimSun',
              fontSize: '14pt',
              color: '#185adb',
              backgroundColor: '#ffff00',
            },
          },
        ]),
        { type: 'hardBreak' },
        text('下一行'),
        text('官网', [
          { type: 'link', attrs: { href: 'https://zuvi.test/docs?lang=zh&view=word' } },
        ]),
      ],
    },
    { type: 'pageBreak' },
    p(text('第二页')),
    { type: 'horizontalRule' },
    { type: 'blockquote', content: [p(text('评审备注'))] },
  ]);
  const blob = await exportStudioWord(source);
  assert.match(blob.type, /wordprocessingml/);
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  assert.ok(zip.file('[Content_Types].xml'));
  const doc = parse(await zip.file('word/document.xml').async('string'));
  const size = doc.getElementsByTagNameNS(W, 'pgSz')[0];
  assert.equal(size.getAttributeNS(W, 'orient'), 'landscape');
  assert.equal(size.getAttributeNS(W, 'w'), '16838');
  assert.equal(doc.getElementsByTagNameNS(W, 'br').length, 2);
  const restored = await importStudioWord(blob, source.name);
  assert.deepEqual(JSON.parse(JSON.stringify(restored.page)), source.page);
  assert.equal(flatten(restored.content), '项目评审重点说明下一行官网第二页评审备注');
  const heading = find(restored.content, 'heading')[0];
  assert.equal(heading.attrs.level, 2);
  assert.equal(heading.attrs.textAlign, 'center');
  const marked = findText(restored.content, '重点说明');
  for (const kind of ['bold', 'italic', 'underline', 'strike'])
    assert.ok(marked.marks.some((mark) => mark.type === kind));
  assert.equal(attrs(marked, 'textStyle').fontFamily, 'SimSun');
  assert.equal(attrs(marked, 'textStyle').fontSize, '14pt');
  assert.equal(attrs(marked, 'textStyle').color, '#185adb');
  assert.equal(attrs(marked, 'textStyle').backgroundColor, '#ffff00');
  assert.equal(
    attrs(findText(restored.content, '官网'), 'link').href,
    'https://zuvi.test/docs?lang=zh&view=word'
  );
  const paragraph = find(restored.content, 'paragraph').find((item) =>
    flatten(item).includes('重点说明')
  );
  assert.equal(paragraph.attrs.indentLeft, 18);
  assert.equal(paragraph.attrs.indentFirstLine, 12);
  assert.equal(paragraph.attrs.lineHeight, 1.5);
  assert.equal(find(restored.content, 'pageBreak').length, 1);
  assert.equal(find(restored.content, 'horizontalRule').length, 1);
  assert.equal(find(restored.content, 'blockquote').length, 1);
});

test('DOCX list import preserves nested mixed lists, sequence and non-default starts', async () => {
  const source = model([
    {
      type: 'orderedList',
      attrs: { start: 3 },
      content: [
        {
          type: 'listItem',
          content: [
            p(text('第三项')),
            { type: 'bulletList', content: [{ type: 'listItem', content: [p(text('子项'))] }] },
          ],
        },
        { type: 'listItem', content: [p(text('第四项'))] },
      ],
    },
    p(text('分隔段落')),
    {
      type: 'orderedList',
      attrs: { start: 7 },
      content: [{ type: 'listItem', content: [p(text('第七项'))] }],
    },
  ]);
  const restored = await importStudioWord(await exportStudioWord(source), source.name);
  const lists = find(restored.content, 'orderedList');
  assert.equal(lists.length, 2);
  assert.equal(lists[0].attrs.start, 3);
  assert.equal(lists[1].attrs.start, 7);
  assert.equal(lists[0].content.length, 2);
  assert.equal(lists[0].content[0].content[1].type, 'bulletList');
  assert.equal(flatten(restored.content), '第三项子项第四项分隔段落第七项');
});

test('DOCX table roundtrip retains row/column merges, headings and cell background', async () => {
  const source = model([
    {
      type: 'table',
      content: [
        {
          type: 'tableRow',
          content: [
            cell(
              '标题',
              { colspan: 2, colwidth: [160, 180], backgroundColor: '#dbeafe' },
              'tableHeader'
            ),
          ],
        },
        {
          type: 'tableRow',
          content: [
            cell('合并内容', { rowspan: 2, colwidth: [160] }),
            cell('上部', { colwidth: [180] }),
          ],
        },
        { type: 'tableRow', content: [cell('下部', { colwidth: [180] })] },
      ],
    },
  ]);
  const blob = await exportStudioWord(source);
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  const doc = parse(await zip.file('word/document.xml').async('string'));
  assert.equal(doc.getElementsByTagNameNS(W, 'vMerge').length, 2);
  const restored = await importStudioWord(blob, source.name);
  const table = find(restored.content, 'table')[0];
  assert.equal(table.content.length, 3);
  assert.equal(table.content[0].content[0].type, 'tableHeader');
  assert.equal(table.content[0].content[0].attrs.colspan, 2);
  assert.equal(table.content[0].content[0].attrs.backgroundColor, '#dbeafe');
  assert.equal(table.content[1].content[0].attrs.rowspan, 2);
  assert.equal(table.content[2].content.length, 1);
  assert.equal(flatten(table), '标题合并内容上部下部');
  const repeated = await importStudioWord(await exportStudioWord(restored), source.name);
  assert.equal(flatten(repeated.content), flatten(restored.content));
  assert.equal(find(repeated.content, 'table')[0].content[1].content[0].attrs.rowspan, 2);
});

test('DOCX import resolves inherited paragraph and character styles', async () => {
  const blob = await fixture(
    '<w:p><w:pPr><w:pStyle w:val="Custom"/></w:pPr><w:r><w:rPr><w:rStyle w:val="Emphasis"/><w:b w:val="0"/></w:rPr><w:t>继承样式</w:t></w:r></w:p>',
    {
      'word/styles.xml': `<w:styles xmlns:w="${W}"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial"/><w:sz w:val="24"/></w:rPr></w:rPrDefault></w:docDefaults><w:style w:styleId="Base"><w:rPr><w:b/><w:color w:val="125ABC"/></w:rPr><w:pPr><w:jc w:val="right"/></w:pPr></w:style><w:style w:styleId="Custom"><w:basedOn w:val="Base"/><w:rPr><w:sz w:val="32"/></w:rPr></w:style><w:style w:type="character" w:styleId="Emphasis"><w:rPr><w:i/></w:rPr></w:style></w:styles>`,
    }
  );
  const restored = await importStudioWord(blob, '样式.docx');
  const paragraph = restored.content.content[0];
  const run = findText(paragraph, '继承样式');
  assert.equal(paragraph.attrs.textAlign, 'right');
  assert.ok(run.marks.some((mark) => mark.type === 'italic'));
  assert.ok(!run.marks.some((mark) => mark.type === 'bold'));
  assert.equal(attrs(run, 'textStyle').color, '#125abc');
  assert.equal(attrs(run, 'textStyle').fontSize, '16pt');
});

test('DOCX import resolves theme fonts and colors instead of dropping them', async () => {
  const blob = await fixture(
    '<w:p><w:r><w:rPr><w:rFonts w:asciiTheme="minorHAnsi"/><w:color w:themeColor="accent1"/></w:rPr><w:t>主题内容</w:t></w:r></w:p>',
    {
      'word/theme/theme1.xml':
        '<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:themeElements><a:fontScheme name="Test"><a:majorFont><a:latin typeface="Arial"/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/></a:minorFont></a:fontScheme><a:clrScheme name="Test"><a:accent1><a:srgbClr val="4472C4"/></a:accent1></a:clrScheme></a:themeElements></a:theme>',
    }
  );
  const restored = await importStudioWord(blob, '主题.docx');
  const style = attrs(findText(restored.content, '主题内容'), 'textStyle');
  assert.equal(style.fontFamily, 'Calibri');
  assert.equal(style.color, '#4472c4');
  await assert.rejects(
    importStudioWord(
      await fixture(
        '<w:p><w:r><w:rPr><w:rFonts w:asciiTheme="minorHAnsi"/></w:rPr><w:t>缺少主题</w:t></w:r></w:p>'
      ),
      '不完整.docx'
    ),
    /主题字体/
  );
});

test('the published studio Word sample can export, reopen and export again', async () => {
  const sourceModules = new Map();
  function sourceModule(url) {
    if (sourceModules.has(url.href)) return sourceModules.get(url.href).exports;
    const module = { exports: {} };
    // Cache the live exports before loading dependencies, including circular imports.
    sourceModules.set(url.href, module);
    runInNewContext(
      ts.transpileModule(readFileSync(url, 'utf8'), {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
          esModuleInterop: true,
        },
      }).outputText,
      {
        exports: module.exports,
        module,
        require: (id) =>
          id.startsWith('.') ? sourceModule(new URL(`${id}.ts`, url)) : uiRequire(id),
        crypto: webcrypto,
        Date,
        Error,
        URL,
      }
    );
    return module.exports;
  }
  const sampleExports = sourceModule(
    new URL('../../packages/ui/src/components/OfficeStudio/studio-model.ts', import.meta.url)
  );
  const source = sampleExports.createOfficeStudioDocument('word');
  assert.equal(sampleExports.isOfficeStudioDocument(source), true);
  const reopened = await importStudioWord(await exportStudioWord(source), source.name);
  assert.equal(flatten(reopened.content), flatten(source.content));
  assert.equal(find(reopened.content, 'table').length, 1);
  assert.equal(find(reopened.content, 'heading').length, 3);
  const second = await importStudioWord(await exportStudioWord(reopened), source.name);
  assert.equal(flatten(second.content), flatten(source.content));
});

test('DOCX import refuses unsupported drawings, tracked changes, broken header references and embedded objects', async () => {
  for (const body of [
    '<w:p><w:r><w:drawing/></w:r></w:p>',
    '<w:p><w:ins><w:r><w:t>修订</w:t></w:r></w:ins></w:p>',
    '<w:p><w:r><w:fldChar/></w:r></w:p>',
    '<w:sectPr><w:headerReference/></w:sectPr>',
  ]) {
    await assert.rejects(importStudioWord(await fixture(body), '未支持.docx'), /避免内容丢失/);
  }
  await assert.rejects(
    importStudioWord(
      await fixture('<w:p/>', { 'word/embeddings/document.xlsx': 'embedded' }),
      '嵌入.docx'
    ),
    /嵌入文件/
  );
});

test('DOCX import refuses unsafe hyperlinks and merged cells containing hidden text', async () => {
  const link = await fixture(
    '<w:p><w:hyperlink r:id="link"><w:r><w:t>脚本</w:t></w:r></w:hyperlink></w:p>',
    {
      'word/_rels/document.xml.rels':
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="link" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="javascript:alert(1)" TargetMode="External"/></Relationships>',
    }
  );
  await assert.rejects(importStudioWord(link, '链接.docx'), /链接协议/);
  const merged = await fixture(
    '<w:tbl><w:tr><w:tc><w:tcPr><w:vMerge w:val="restart"/></w:tcPr><w:p/></w:tc></w:tr><w:tr><w:tc><w:tcPr><w:vMerge/></w:tcPr><w:p><w:r><w:t>隐藏</w:t></w:r></w:p></w:tc></w:tr></w:tbl>'
  );
  await assert.rejects(importStudioWord(merged, '合并.docx'), /隐藏文字/);
});

test('DOCX export fails explicitly for unsupported nodes, marks and inline layout', async () => {
  await assert.rejects(
    exportStudioWord(model([{ type: 'image', attrs: { src: 'photo.png' } }])),
    /image/
  );
  await assert.rejects(
    exportStudioWord(model([p(text('未知', [{ type: 'unknownMark' }]))])),
    /unknownMark/
  );
  await assert.rejects(
    exportStudioWord(model([p(text('行距', [{ type: 'textStyle', attrs: { lineHeight: '3' } }]))])),
    /lineHeight/
  );
  const continued = await exportStudioWord(model([{type:'orderedList',content:[{type:'listItem',content:[p(text('首段')),p(text('第二段'))]}]}]));
  const native = parse(await(await JSZip.loadAsync(await continued.arrayBuffer())).file('word/document.xml').async('string'));
  assert.equal(native.getElementsByTagNameNS(W,'numPr').length,1);
  assert.equal(native.getElementsByTagNameNS(W,'t')[1].textContent,'第二段');
});

test('DOCX embeds raster images and retains body, default header/footer, fields and distances over repeated exports', async () => {
  const source = model([
    p(
      text('插图前'),
      { ...image(), marks: [{ type: 'link', attrs: { href: 'https://zuvi.test/picture' } }] },
      text('插图后')
    ),
  ]);
  source.header = {
    type: 'doc',
    content: [
      p(text('项目机密', [{ type: 'bold' }])),
      p(image({ width: 80, height: 40, alt: '页眉徽标' })),
    ],
  };
  source.footer = {
    type: 'doc',
    content: [
      p(
        text('第 '),
        { type: 'pageNumber', attrs: { kind: 'current' } },
        text(' 页，共 '),
        { type: 'pageNumber', attrs: { kind: 'total' } },
        text(' 页')
      ),
    ],
  };
  source.pageNumbers = true;
  source.page.headerDistance = 10;
  source.page.footerDistance = 11.5;
  const blob = await exportStudioWord(source);
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  assert.ok(Object.keys(zip.files).some((path) => /^word\/media\/.*\.png$/.test(path)));
  assert.ok(Object.keys(zip.files).some((path) => /^word\/header\d+\.xml$/.test(path)));
  assert.ok(Object.keys(zip.files).some((path) => /^word\/footer\d+\.xml$/.test(path)));
  const xmlText = await zip.file('word/document.xml').async('string');
  assert.match(xmlText, /headerReference/);
  assert.match(xmlText, /footerReference/);
  const restored = await importStudioWord(blob, source.name);
  assert.equal(flatten(restored.content), '插图前插图后');
  const picture = find(restored.content, 'image')[0];
  assert.equal(picture.attrs.src, `data:image/png;base64,${PNG}`);
  assert.equal(picture.attrs.width, 300);
  assert.equal(picture.attrs.height, 150);
  assert.equal(picture.attrs.alt, '项目示意图');
  assert.equal(attrs(picture, 'link').href, 'https://zuvi.test/picture');
  assert.equal(flatten(restored.header), '项目机密');
  assert.equal(find(restored.header, 'image')[0].attrs.alt, '页眉徽标');
  assert.equal(
    findText(restored.header, '项目机密').marks.some((mark) => mark.type === 'bold'),
    true
  );
  assert.equal(flatten(restored.footer), '第  页，共  页');
  assert.equal(find(restored.footer, 'pageNumber').length, 2);
  assert.equal(find(restored.footer, 'pageNumber')[0].attrs.kind, 'current');
  assert.equal(find(restored.footer, 'pageNumber')[1].attrs.kind, 'total');
  assert.equal(restored.pageNumbers, true);
  assert.equal(restored.page.headerDistance, 10);
  assert.equal(restored.page.footerDistance, 11.5);
  const second = await importStudioWord(await exportStudioWord(restored), source.name);
  assert.equal(find(second.footer, 'pageNumber').length, 2);
  assert.equal(find(second.content, 'image')[0].attrs.src, picture.attrs.src);
  assert.equal(flatten(second.header), flatten(restored.header));
});

test('DOCX imports simple PAGE and NUMPAGES fields without their cached values becoming editable text', async () => {
  const blob = await fixture(
    '<w:p><w:r><w:t>第</w:t></w:r><w:fldSimple w:instr=" PAGE \\* MERGEFORMAT "><w:r><w:rPr><w:b/></w:rPr><w:t>3</w:t></w:r></w:fldSimple><w:r><w:t>页，共</w:t></w:r><w:fldSimple w:instr=" NUMPAGES "><w:r><w:t>8</w:t></w:r></w:fldSimple><w:r><w:t>页</w:t></w:r></w:p>'
  );
  const restored = await importStudioWord(blob, '域.docx');
  assert.equal(flatten(restored.content), '第页，共页');
  const fields = find(restored.content, 'pageNumber');
  assert.equal(fields.length, 2);
  assert.equal(fields[0].attrs.kind, 'current');
  assert.ok(fields[0].marks.some((mark) => mark.type === 'bold'));
  assert.equal(fields[1].attrs.kind, 'total');
  const second = await importStudioWord(await exportStudioWord(restored), '域.docx');
  assert.equal(find(second.content, 'pageNumber').length, 2);
  assert.ok(find(second.content, 'pageNumber')[0].marks.some((mark) => mark.type === 'bold'));
  await assert.rejects(
    importStudioWord(
      await fixture(
        '<w:p><w:fldSimple w:instr=" PAGE "><w:r><w:t>XV</w:t></w:r></w:fldSimple></w:p>'
      ),
      '罗马缓存.docx'
    ),
    /非阿拉伯页码缓存/
  );
  await assert.rejects(
    importStudioWord(
      await fixture(
        '<w:p><w:fldSimple w:instr=" PAGE "><w:r><w:t>1</w:t><w:drawing/></w:r></w:fldSimple></w:p>'
      ),
      '缓存图片.docx'
    ),
    /页码域缓存中的对象/
  );
  await assert.rejects(
    importStudioWord(
      await fixture(
        '<w:p><w:fldSimple w:instr=" DATE "><w:r><w:t>2026</w:t></w:r></w:fldSimple></w:p>'
      ),
      '日期域.docx'
    ),
    /页码以外的域/
  );
});

test('DOCX adds a native page field to a populated footer without duplicating it on reopening', async () => {
  const source = model([p(text('正文'))]);
  source.footer = { type: 'doc', content: [p(text('版权说明'))] };
  source.pageNumbers = true;
  const restored = await importStudioWord(await exportStudioWord(source), source.name);
  assert.equal(flatten(restored.footer), '版权说明');
  assert.equal(find(restored.footer, 'pageNumber').length, 1);
  const second = await importStudioWord(await exportStudioWord(restored), source.name);
  assert.equal(find(second.footer, 'pageNumber').length, 1);
  assert.equal(flatten(second.footer), '版权说明');
});

test('DOCX retains text after a complex field in the same run and refuses nested fields', async () => {
  const body =
    '<w:p><w:r><w:rPr><w:b/></w:rPr><w:fldChar w:fldCharType="begin"/><w:instrText> PAGE </w:instrText><w:fldChar w:fldCharType="separate"/><w:t>3</w:t><w:fldChar w:fldCharType="end"/><w:t> 页尾文本</w:t></w:r></w:p>';
  const restored = await importStudioWord(await fixture(body), '复杂域.docx');
  assert.equal(flatten(restored.content), ' 页尾文本');
  assert.equal(find(restored.content, 'pageNumber').length, 1);
  assert.ok(find(restored.content, 'pageNumber')[0].marks.some((mark) => mark.type === 'bold'));
  assert.ok(findText(restored.content, ' 页尾文本').marks.some((mark) => mark.type === 'bold'));
  const second = await importStudioWord(await exportStudioWord(restored), '复杂域.docx');
  assert.equal(flatten(second.content), ' 页尾文本');
  assert.ok(find(second.content, 'pageNumber')[0].marks.some((mark) => mark.type === 'bold'));
  await assert.rejects(
    importStudioWord(
      await fixture(
        body.replace('<w:instrText>', '<w:fldChar w:fldCharType="begin"/><w:instrText>')
      ),
      '嵌套域.docx'
    ),
    /嵌套域/
  );
});

test('DOCX embeds JPEG bytes unchanged and retains configured header/footer distances before regions are created', async () => {
  const source = model([
    p(image({ src: `data:image/jpeg;base64,${JPEG}`, width: 32, height: 16, alt: '实图' })),
  ]);
  source.page.headerDistance = 8.5;
  source.page.footerDistance = 6;
  const blob = await exportStudioWord(source);
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  const media = Object.keys(zip.files).find((name) => /^word\/media\/.*\.jpg$/.test(name));
  assert.ok(media);
  assert.equal(Buffer.from(await zip.file(media).async('uint8array')).toString('base64'), JPEG);
  const restored = await importStudioWord(blob, source.name);
  assert.equal(find(restored.content, 'image')[0].attrs.src, `data:image/jpeg;base64,${JPEG}`);
  assert.equal(find(restored.content, 'image')[0].attrs.width, 32);
  assert.equal(find(restored.content, 'image')[0].attrs.height, 16);
  assert.equal(restored.header, undefined);
  assert.equal(restored.footer, undefined);
  assert.equal(restored.page.headerDistance, 8.5);
  assert.equal(restored.page.footerDistance, 6);
});

test('floating images preserve wrapping, position, anchor flags, distances and custom contours across native DOCX saves', async () => {
  const layouts = [
    {
      ...imageExports.wordDefaultImageLayout('square'),
      horizontal: { relative: 'margin', align: 'right' },
      vertical: { relative: 'paragraph', offset: 12.5 },
      lockAnchor: true,
      allowOverlap: false,
    },
    {
      ...imageExports.wordDefaultImageLayout('tight'),
      polygon: [
        [0, 0],
        [0, 21600],
        [10000, 21600],
        [21600, 10000],
        [21600, 0],
        [0, 0],
      ],
      wrapSide: 'left',
    },
    {
      ...imageExports.wordDefaultImageLayout('through'),
      horizontal: { relative: 'column', offset: -12.5 },
      wrapSide: 'largest',
    },
    {
      ...imageExports.wordDefaultImageLayout('topBottom'),
      horizontal: { relative: 'page', align: 'center' },
      vertical: { relative: 'page', align: 'bottom' },
      layoutInCell: false,
    },
    {
      ...imageExports.wordDefaultImageLayout('front'),
      horizontal: { relative: 'character', offset: 25 },
      vertical: { relative: 'line', offset: -5 },
      zIndex: 0,
    },
    {
      ...imageExports.wordDefaultImageLayout('behind'),
      horizontal: { relative: 'page', offset: 100 },
      vertical: { relative: 'page', offset: 80 },
      zIndex: 72,
    },
  ];
  let current = model(layouts.map((layout) => p(image({ layout }), text('保留锚点后的正文'))));
  current.header = { type: 'doc', content: [p(image({ layout: layouts[1] }))] };
  current.footer = { type: 'doc', content: [p(image({ layout: layouts[4] }))] };
  for (let pass = 0; pass < 3; pass++) {
    const saved = await exportStudioWord(current);
    const zip = await JSZip.loadAsync(await saved.arrayBuffer());
    const native = parse(await zip.file('word/document.xml').async('string'));
    assert.equal(native.getElementsByTagName('wp:anchor').length, 6);
    assert.equal(native.getElementsByTagName('wp:inline').length, 0);
    const anchors = native.getElementsByTagName('wp:anchor');
    assert.equal(anchors[0].getAttribute('locked'), '1');
    assert.equal(anchors[0].getAttribute('allowOverlap'), '0');
    assert.equal(anchors[4].getAttribute('relativeHeight'), '0');
    assert.equal(anchors[5].getAttribute('behindDoc'), '1');
    current = await importStudioWord(saved, current.name);
    const restored = find(current.content, 'image');
    for (let index = 0; index < layouts.length; index++) {
      const actual = restored[index].attrs.layout;
      const expected = layouts[index];
      assert.equal(actual.wrap, expected.wrap);
      for (const axis of ['horizontal', 'vertical']) {
        assert.equal(actual[axis].relative, expected[axis].relative);
        assert.equal(actual[axis].align, expected[axis].align);
        if (expected[axis].offset !== undefined)
          assert.ok(
            Math.abs(actual[axis].offset - expected[axis].offset) <= 1 / 9525,
            'Native EMU rounding stays below one EMU.'
          );
      }
      assert.deepEqual(
        JSON.parse(JSON.stringify(actual.distance)),
        JSON.parse(JSON.stringify(expected.distance))
      );
      assert.equal(actual.lockAnchor, expected.lockAnchor);
      assert.equal(actual.allowOverlap, expected.allowOverlap);
      assert.equal(actual.layoutInCell, expected.layoutInCell);
      assert.equal(actual.zIndex, expected.zIndex);
      if (expected.polygon)
        assert.deepEqual(JSON.parse(JSON.stringify(actual.polygon)), expected.polygon);
    }
    assert.deepEqual(
      JSON.parse(JSON.stringify(find(current.header, 'image')[0].attrs.layout.polygon)),
      layouts[1].polygon
    );
    assert.equal(find(current.footer, 'image')[0].attrs.layout.zIndex, 0);
    assert.match(flatten(current.content), /保留锚点后的正文/);
  }
});

test('invalid floating images are rejected before changing the source model', async () => {
  for (const patch of [
    { horizontal: { relative: 'unknown', offset: 0 } },
    { vertical: { relative: 'page', offset: Infinity } },
    { zIndex: -1 },
    { wrap: 'unsupported' },
    { distance: { left: -5 } },
    {
      wrap: 'tight',
      polygon: [
        [0, 0],
        [0, 21600],
        [21600, 0],
        [500, 500],
      ],
    },
  ]) {
    const source = model([
      p(image({ layout: { ...imageExports.wordDefaultImageLayout(), ...patch } })),
    ]);
    const before = JSON.stringify(source);
    await assert.rejects(exportStudioWord(source), /图片|环绕/);
    assert.equal(JSON.stringify(source), before);
  }
});

test('DOCX refuses image layout that cannot be preserved and external image links', async () => {
  const exported = await exportStudioWord(model([p(image())]));
  const variants = [
    [(value) => value.replace(/wp:inline/g, 'wp:anchor'), /浮动/],
    [(value) => value.replace('<a:xfrm>', '<a:xfrm rot="5400000">'), /旋转/],
    [(value) => value.replace('<a:stretch>', '<a:srcRect l="5000"/><a:stretch>'), /裁剪/],
    [(value) => value.replace('prst="rect"', 'prst="roundRect"'), /非矩形图片/],
    [(value) => value.replace('<a:fillRect/>', '<a:fillRect r="1000"/>'), /裁剪/],
    [
      (value) =>
        value.replace(
          /<a:blip ([^>]*)\/>/,
          '<a:blip $1><a:extLst><a:ext uri="svg"><asvg:svgBlip xmlns:asvg="http://schemas.microsoft.com/office/drawing/2016/SVG/main"/></a:ext></a:extLst></a:blip>'
        ),
      /SVG/,
    ],
    [(value) => value.replace('r:embed=', 'r:link='), /外部链接图片/],
  ];
  for (const [modify, message] of variants) {
    const zip = await JSZip.loadAsync(await exported.arrayBuffer());
    const original = await zip.file('word/document.xml').async('string');
    const modified = modify(original);
    assert.notEqual(modified, original);
    zip.file('word/document.xml', modified);
    await assert.rejects(
      importStudioWord(
        new Blob([await zip.generateAsync({ type: 'uint8array' })]),
        '复杂图片.docx'
      ),
      message
    );
  }
  await assert.rejects(
    exportStudioWord(model([p(image({ src: 'https://zuvi.test/photo.png' }))])),
    /外部图片地址/
  );
  await assert.rejects(
    exportStudioWord(model([p(image({ src: `data:image/jpeg;base64,${PNG}` }))])),
    /类型与内容不一致/
  );
  const headerSource = model([p(text('正文'))]);
  headerSource.header = { type: 'doc', content: [p(text('页眉'))] };
  const zip = await JSZip.loadAsync(await (await exportStudioWord(headerSource)).arrayBuffer());
  zip.file(
    'word/document.xml',
    (await zip.file('word/document.xml').async('string')).replace(
      'w:type="default"',
      'w:type="first"'
    )
  );
  await assert.rejects(
    importStudioWord(new Blob([await zip.generateAsync({ type: 'uint8array' })]), '不同首页.docx'),
    /不同首页/
  );
});

test('DOCX roundtrip retains superscript and subscript independently', async () => {
  const source = model([
    p(
      text('x'),
      text('2', [{ type: 'superscript' }]),
      text(' H'),
      text('2', [{ type: 'subscript' }]),
      text('O')
    ),
  ]);
  const restored = await importStudioWord(await exportStudioWord(source), source.name);
  assert.equal(flatten(restored.content), 'x2 H2O');
  const scripts = find(restored.content, 'text').filter((node) => node.text === '2');
  assert.ok(scripts[0].marks.some((mark) => mark.type === 'superscript'));
  assert.ok(scripts[1].marks.some((mark) => mark.type === 'subscript'));
});

test('DOCX import rejects old DOC, corrupt XML and unequal margins instead of flattening', async () => {
  await assert.rejects(importStudioWord(new Blob(['binary']), '旧版.doc'), /\.docx/);
  await assert.rejects(importStudioWord(new Blob(['broken']), '损坏.docx'), /无法打开/);
  const bad = await fixture('<w:p><w:r><w:t>bad</w:p>');
  await assert.rejects(importStudioWord(bad, '格式.docx'), /XML 无法解析/);
  const zip = await JSZip.loadAsync(await (await fixture('<w:p/>')).arrayBuffer());
  zip.file(
    'word/document.xml',
    (await zip.file('word/document.xml').async('string')).replace('w:left="1134"', 'w:left="1440"')
  );
  await assert.rejects(
    importStudioWord(new Blob([await zip.generateAsync({ type: 'uint8array' })]), '页边距.docx'),
    /不等宽页边距/
  );
});

test('typed Word font names and 1pt to 300pt half-point sizes survive repeated DOCX saves', async () => {
  const font = 'Custom "Font"; & \\Family';
  const source = model([
    p(
      ...[1, 17.5, 300].map((size) =>
        text(`字号${size}`, [
          { type: 'textStyle', attrs: { fontFamily: font, fontSize: `${size}pt` } },
        ])
      )
    ),
  ]);
  let current = source;
  for (let round = 0; round < 2; round++) {
    const output = await exportStudioWord(current);
    current = await importStudioWord(output, '字体.docx');
    for (const size of [1, 17.5, 300]) {
      const marked = findText(current.content, `字号${size}`);
      assert.equal(attrs(marked, 'textStyle').fontFamily, font);
      assert.equal(attrs(marked, 'textStyle').fontSize, `${size}pt`);
    }
  }
});

test('a cleared heading keeps its level and hyperlink without reintroducing default heading bold on reopen', async () => {
  let document = model([
    {
      type: 'heading',
      attrs: { level: 2, paragraphStyle: 'paragraph', paragraphStyleMaterialized: true },
      content: [
        text('Cleared heading', [{ type: 'link', attrs: { href: 'https://example.com/linked' } }]),
      ],
    },
  ]);
  for (let pass = 0; pass < 2; pass++) {
    const source = await exportStudioWord(document);
    document = await importStudioWord(source, 'Cleared.docx');
    const heading = document.content.content[0];
    assert.equal(heading.type, 'heading');
    assert.equal(heading.attrs.level, 2);
    assert.equal(
      heading.content[0].marks.some((mark) => mark.type === 'bold'),
      false
    );
    assert.equal(
      heading.content[0].marks.find((mark) => mark.type === 'link').attrs.href,
      'https://example.com/linked'
    );
  }
});
