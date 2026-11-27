"""Independently verify the browser's three DOCX files with ZIP/XML only.

Usage (each run writes a new receipt and refuses to replace an old one):
  python3 -B verify-browser-native.py --output native-focused-third.json \
    --browser-report ../duplicates/validation/word-focused-third.json

The default input is this script's browser/ folder. Use --input-dir for retained
files from another run and --output for that run's new receipt. No application
codec, third-party library, build, browser or source mutation is used.
"""
import argparse
from datetime import datetime, timezone
import hashlib
from io import BytesIO
import json
from pathlib import Path
import zipfile
from xml.etree import ElementTree as ET

HERE = Path(__file__).resolve().parent
ROOT = next(parent for parent in HERE.parents if (parent / 'pnpm-workspace.yaml').exists())
W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
LABELS = [
    'Alignment left', 'Alignment center', 'Alignment right', 'Alignment justify',
    'First indent', 'Hanging indent', 'Single spacing', 'Multiple spacing',
    'Fixed spacing', 'Minimum spacing', 'Tabs', 'Surface', 'Cleared surface',
]
SIDES = ['top', 'right', 'bottom', 'left']
ALIGNS = {'Alignment left': 'left', 'Alignment center': 'center',
          'Alignment right': 'right', 'Alignment justify': 'both'}
LINES = {'Single spacing': ('auto', 240, 1, 'multiple'),
         'Multiple spacing': ('auto', 360, 1.5, 'multiple'),
         'Fixed spacing': ('exact', 360, 18, 'pt'),
         'Minimum spacing': ('atLeast', 480, 24, 'pt')}
TABS = [{'val': align, 'pos': str(position), 'leader': 'dot'}
        for align, position in [('left', 1440), ('center', 2880),
                                ('right', 4320), ('decimal', 5760)]]


def identity(path, data=None):
    path = path.resolve()
    if data is None:
        data = path.read_bytes()
    try:
        name = str(path.relative_to(ROOT))
    except ValueError:
        name = str(path)
    return {'path': name, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


def attrs(element):
    if element is None:
        return {}
    assert all(name.startswith(W) for name in element.attrib), element.tag
    return {name[len(W):]: value for name, value in element.attrib.items()}


def on_off(element):
    if element is None:
        return False
    value = element.get(W + 'val')
    assert value in (None, 'true', '1', 'on', 'false', '0', 'off'), value
    return value not in ('false', '0', 'off')


def segments(characters):
    result = []
    for char, bold in characters:
        if result and result[-1]['bold'] == bold:
            result[-1]['text'] += char
        else:
            result.append({'text': char, 'bold': bold})
    return result


def parse_docx(path):
    data = path.read_bytes()
    record = identity(path, data)
    with zipfile.ZipFile(BytesIO(data)) as package:
        assert package.testzip() is None, 'Corrupt ZIP entry: ' + str(path)
        assert len(package.namelist()) == len(set(package.namelist())), 'Duplicate ZIP entries'
        xml = package.read('word/document.xml')
        styles_xml = package.read('word/styles.xml')
        document = ET.fromstring(xml)
        styles = ET.fromstring(styles_xml)
        body = document.find(W + 'body')
        assert body is not None
        assert all(child.tag in {W+'p', W+'sectPr'} for child in body), 'Unexpected fixture block'
        paragraphs = body.findall(W + 'p')
        assert len(paragraphs) == len(LABELS), 'Paragraph count/order changed'
        # This fixture has no selected named paragraph/character styles. Verify
        # the default run/Normal style is not bold so direct run flags are the
        # actual effective bold state, rather than ignoring style inheritance.
        assert document.find('.//' + W + 'pStyle') is None
        assert document.find('.//' + W + 'rStyle') is None
        assert not on_off(styles.find('./' + W+'docDefaults/'+W+'rPrDefault/'+W+'rPr/'+W+'b'))
        defaults = [style for style in styles.findall(W+'style')
                    if style.get(W+'type') == 'paragraph' and style.get(W+'default') in {'1','true','on'}]
        assert len(defaults) == 1
        style_map = {style.get(W+'styleId'): style for style in styles.findall(W+'style')}
        style = defaults[0]
        seen = set()
        while style is not None:
            name = style.get(W+'styleId')
            assert name not in seen, 'Cyclic default style inheritance'
            seen.add(name)
            assert not on_off(style.find('./'+W+'rPr/'+W+'b')), 'Fixture default style became bold'
            parent = style.find(W+'basedOn')
            style = style_map.get(parent.get(W+'val')) if parent is not None else None
        records = []
        for label, paragraph in zip(LABELS, paragraphs):
            assert all(child.tag in {W+'pPr', W+'r'} for child in paragraph), 'Unexpected inline wrapper'
            chars = []
            for run in paragraph.findall(W+'r'):
                bold = on_off(run.find('./'+W+'rPr/'+W+'b'))
                for child in run:
                    if child.tag == W+'rPr':
                        continue
                    assert child.tag in {W+'t', W+'tab'}, 'Unexpected fixture run content: ' + child.tag
                    text = '\t' if child.tag == W+'tab' else child.text or ''
                    chars.extend((char,bold) for char in text)
            text = ''.join(char for char,bold in chars)
            expected = label if label != 'Tabs' else 'Tabs\tA\tB\tC\t12.34'
            assert text == expected, (path.name,label,text)
            assert all(bold for char,bold in chars[:len(label)]), 'Original label lost bold: ' + label
            assert all(not bold for char,bold in chars[len(label):]), 'Plain tab suffix acquired bold'
            properties = paragraph.find(W+'pPr')
            child = lambda name: properties.find(W+name) if properties is not None else None
            borders = child('pBdr')
            tabs = child('tabs')
            records.append({'label':label, 'text':text, 'boldSegments':segments(chars),
                            'align':attrs(child('jc')).get('val'),
                            'indent':attrs(child('ind')), 'spacing':attrs(child('spacing')),
                            'tabs':[attrs(tab) for tab in tabs] if tabs is not None else [],
                            'borders':{edge.tag[len(W):]:attrs(edge) for edge in borders} if borders is not None else {},
                            'shading':attrs(child('shd'))})
        # The browser fixture creates only a main story. Verify no hidden
        # header/footer story was introduced to hold changed original text.
        stories = [name for name in package.namelist() if name.startswith('word/')
                   and name.split('/')[-1].startswith(('header','footer')) and name.endswith('.xml')]
        assert not stories, 'Unexpected fixture header/footer story'
    assert identity(path) == record, 'Input changed while being verified: ' + str(path)
    return {'file':record, 'documentXml':{'bytes':len(xml),'sha256':hashlib.sha256(xml).hexdigest()},
            'stylesXml':{'bytes':len(styles_xml),'sha256':hashlib.sha256(styles_xml).hexdigest()},
            'paragraphs':records}


def validate_source(source):
    rows = {row['label']:row for row in source['paragraphs']}
    for label,row in rows.items():
        assert row['align'] is None and not row['indent'] and not row['spacing'] and not row['tabs'], label
        if label != 'Cleared surface':
            assert not row['borders'] and not row['shading'], label
    surface = rows['Cleared surface']
    for side,line in [('top','single'),('right','dashed'),('bottom','double'),('left','dotted')]:
        assert surface['borders'][side]['val'] == line
        assert surface['borders'][side]['sz'] == '8'
    assert surface['borders']['top']['space'] == '2'
    assert surface['borders']['top']['color'].lower() == '112233'
    assert surface['shading']['val'] == 'clear' and surface['shading']['fill'].lower() == 'ffeecc'


def validate_roundtrip(result, source):
    assert [row['text'] for row in result['paragraphs']] == [row['text'] for row in source['paragraphs']]
    assert [row['boldSegments'] for row in result['paragraphs']] == [row['boldSegments'] for row in source['paragraphs']]
    rows = {row['label']:row for row in result['paragraphs']}
    for label,alignment in ALIGNS.items():
        assert rows[label]['align'] == alignment, (label,rows[label]['align'])
    assert rows['First indent']['indent'] == {'left':'360','right':'120','firstLine':'180'}
    assert rows['Hanging indent']['indent'] == {'left':'360','right':'120','hanging':'220'}
    units = []
    for label,(rule,line,value,unit) in LINES.items():
        assert rows[label]['spacing'] == {'before':'120','after':'180','line':str(line),'lineRule':rule}, label
        native_units = 240 if rule == 'auto' else 20
        assert line / native_units == value
        units.append({'label':label,'rule':rule,'nativeLine':line,'divisor':native_units,
                      'convertedValue':value,'unit':unit,'beforePt':6,'afterPt':9})
    assert rows['Tabs']['tabs'] == TABS
    surface = rows['Surface']
    assert set(surface['borders']) == set(SIDES)
    for side,line in [('top','single'),('right','double'),('bottom','dotted'),('left','dashed')]:
        border = surface['borders'][side]
        assert border == {'val':line,'sz':'8','space':'4','color':'445566'}, (side,border)
    assert surface['shading']['val'] == 'clear' and surface['shading']['fill'].lower() == 'ccffee'
    cleared = rows['Cleared surface']
    assert set(SIDES).issubset(cleared['borders'])
    assert all(edge['val'] == 'nil' for edge in cleared['borders'].values())
    for side in SIDES:
        before = source['paragraphs'][-1]['borders'][side]
        assert {key:value for key,value in cleared['borders'][side].items() if key!='val'} == {
            key:value for key,value in before.items() if key!='val'}, 'Nil clear changed original stored edge data'
    assert cleared['shading']['val'] == 'nil'
    assert cleared['shading']['fill'].lower() == 'ffeecc', 'Nil clear changed original stored fill'
    result['lineConversions'] = units


def walk(suite):
    yield from suite.get('specs', [])
    for child in suite.get('suites', []):
        yield from walk(child)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input-dir',type=Path,default=HERE/'browser')
    parser.add_argument('--output',type=Path,required=True,help='New receipt file; existing evidence is never overwritten')
    parser.add_argument('--browser-report',type=Path,help='Optional Playwright JSON containing this spec once, passed without retry')
    args = parser.parse_args()
    output = args.output.resolve()
    assert not output.exists(), 'Choose a new --output; receipt already exists'
    root = args.input_dir.resolve()
    docs = [parse_docx(root/name) for name in ['source.docx','roundtrip-1.docx','roundtrip-2.docx']]
    validate_source(docs[0])
    for document in docs[1:]:
        validate_roundtrip(document,docs[0])
    browser = None
    if args.browser_report:
        data = args.browser_report.read_bytes()
        report = json.loads(data)
        selected = [spec for suite in report['suites'] for spec in walk(suite)
                    if Path(spec['file']).name == 'office-studio-word-paragraph-acceptance.spec.ts']
        assert len(selected) == 1 and selected[0]['ok']
        assert len(selected[0]['tests']) == 1
        test = selected[0]['tests'][0]
        assert test['status']=='expected' and test['expectedStatus']=='passed'
        assert len(test['results'])==1 and test['results'][0]['status']=='passed'
        assert test['results'][0]['retry']==0 and not test['results'][0].get('errors')
        browser = {'report':identity(args.browser_report,data),'spec':selected[0],
                   'note':'Report linkage records identity and one passed result; matching these files to a run requires the caller to retain that run directory.'}
    source_paths = [Path(__file__),ROOT/'e2e/office-studio-word-paragraph-acceptance.spec.ts']
    source_paths += [ROOT/'packages/ui/src/components/OfficeStudio'/name for name in [
        'StudioWordParagraphDialog.tsx','StudioWordTabsDialog.tsx','StudioWordSurfaceDialog.tsx']]
    record = {'status':'passed','independent':'Python standard-library ZIP/XML; no application codec or browser calls',
              'createdAt':datetime.now(timezone.utc).isoformat(),'items':['W011','W012','W013','W016'],
              'whole159Complete':False,'inputs':docs,'sourceIdentities':[identity(path) for path in source_paths],
              'browser':browser,'checks':{'files':3,'paragraphsPerFile':13,'originalTextAndBoldPerCharacter':True,
              'fourAlignments':True,'firstAndHangingTwips':True,'fourLineRulesAndUnitConversions':True,
              'fourNativeTabStopsAndDotLeaders':True,'independentOuterEdgesAndNilClear':True,
              'shadingAndNilPreservation':True}}
    for document in docs:
        assert identity(ROOT/document['file']['path']) == document['file'], 'Input changed before receipt'
    output.parent.mkdir(parents=True,exist_ok=True)
    with output.open('x') as stream:
        json.dump(record,stream,ensure_ascii=False,indent=2)
        stream.write('\n')
    print(json.dumps({'status':'passed','receipt':str(output),'sourceDocxSha256':docs[0]['file']['sha256'],
                      'roundtripSha256':[d['file']['sha256'] for d in docs[1:]],'paragraphsPerFile':13},ensure_ascii=False))


if __name__ == '__main__':
    main()
