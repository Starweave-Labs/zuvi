from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile
import hashlib
import json
import re
import pdfplumber

BASE = Path(__file__).resolve().parent
W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
R = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'


def properties(element):
    result = {}
    if element is None:
        return result
    for name, key in [('b', 'bold'), ('i', 'italic'), ('u', 'underline'), ('strike', 'strike')]:
        value = element.find(W + name)
        if value is not None:
            result[key] = value.get(W + 'val', 'true') not in ['0', 'false', 'off', 'none']
    for name, key in [('sz', 'size'), ('position', 'baselineShift'), ('spacing', 'letterSpacing')]:
        value = element.find(W + name)
        if value is None:
            continue
        raw = value.get(W + 'val')
        assert re.fullmatch(r'[+-]?\d+', raw), (name, raw)
        result[key] = int(raw) / (20 if name == 'spacing' else 2)
    fonts = element.find(W + 'rFonts')
    if fonts is not None:
        family = fonts.get(W + 'ascii') or fonts.get(W + 'hAnsi')
        if family:
            result['family'] = family
    color = element.find(W + 'color')
    if color is not None and color.get(W + 'val') not in [None, 'auto']:
        result['color'] = color.get(W + 'val').upper()
    return result


def inspect(path):
    with ZipFile(path) as package:
        assert package.testzip() is None
        body = ET.fromstring(package.read('word/document.xml'))
        header = ET.fromstring(package.read('word/header1.xml'))
        styles = ET.fromstring(package.read('word/styles.xml'))
        relationships = ET.fromstring(package.read('word/_rels/document.xml.rels'))
        for name in package.namelist():
            if name.startswith('word/') and name.endswith('.xml'):
                root = ET.fromstring(package.read(name))
                for value in root.iter(W + 'position'):
                    assert re.fullmatch(r'[+-]?\d+', value.get(W + 'val')), (name, value.attrib)
    defaults = {'bold': False, 'italic': False, 'underline': False, 'strike': False,
                'size': 12, 'color': '000000', 'letterSpacing': 0, 'baselineShift': 0}
    defaults.update(properties(styles.find(f'{W}docDefaults/{W}rPrDefault/{W}rPr')))
    catalog = {style.get(W + 'styleId'): style for style in styles.findall(W + 'style')}

    def inherited(style_id, path=()):
        if not style_id or style_id not in catalog:
            return defaults.copy()
        assert style_id not in path
        style = catalog[style_id]
        parent = style.find(W + 'basedOn')
        result = inherited(parent.get(W + 'val') if parent is not None else None, (*path, style_id))
        result.update(properties(style.find(W + 'rPr')))
        return result

    def rows(root, prefix):
        result = []
        for paragraph in root.findall(prefix + W + 'p'):
            reference = paragraph.find(f'{W}pPr/{W}pStyle')
            style_id = reference.get(W + 'val') if reference is not None else 'Normal'
            base = inherited(style_id)
            runs = []
            for run in paragraph.iter(W + 'r'):
                text = ''.join(value.text or '' for value in run.iter(W + 't'))
                if not text:
                    continue
                item = base.copy()
                item.update(properties(run.find(W + 'rPr')))
                item['text'] = text
                runs.append(item)
            result.append({'text': ''.join(run['text'] for run in runs), 'runs': runs,
                           'styleSize': base['size']})
        return result

    destinations = {value.get('Id'): value.get('Target') for value in relationships}
    links = [{'text': ''.join(value.text or '' for value in link.iter(W + 't')),
              'target': destinations[link.get(R + 'id')]} for link in body.iter(W + 'hyperlink')]
    return {'path': path.name, 'bytes': path.stat().st_size, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
            'rows': rows(body, W + 'body/'), 'header': rows(header, ''), 'links': links}


def main():
    source = inspect(BASE / 'source.docx')
    assert len(source['rows']) == 9
    assert source['header'][0]['text'] == '' and source['header'][0]['styleSize'] == 14
    results = [inspect(BASE / f'roundtrip-{index}.docx') for index in [1, 2]]
    expected = ['Word character guard sample', 'SOURCE', 'target', 'lower ος', 'Title Ος',
                'Sentence. Ος', 'toggle ος', 'UPPER ΟΣ', 'length i\u0307σος ß']
    for result in results:
        assert [row['text'] for row in result['rows']] == expected
        assert result['rows'][0]['runs'] == source['rows'][0]['runs']
        assert result['rows'][1]['runs'] == source['rows'][1]['runs']
        target = result['rows'][2]['runs'][0]
        assert target['bold'] and not target['italic'] and target['size'] == 18
        assert target['letterSpacing'] == 0.3 and target['baselineShift'] == -1.5
        assert target['color'] == '0055AA'
        for index, label in enumerate(['lower', 'title', 'sentence', 'toggle', 'upper']):
            runs = result['rows'][index + 3]['runs']
            assert len(runs) == 2 and runs[0]['bold'] and runs[1]['italic']
            assert runs[0]['size'] == (14 if label == 'lower' else 12)
            assert runs[1]['size'] == (18 if label == 'lower' else 16)
        assert result['rows'][-1]['runs'][0]['bold']
        assert result['header'][0]['text'] == 'H'
        assert result['header'][0]['runs'][0]['size'] == 16
        assert [link['target'] for link in result['links']] == [link['target'] for link in source['links']]
        assert [link['text'] for link in result['links']] == ['ς', 'ς', 'ς', 'ς', 'Σ']
    assert results[0]['rows'] == results[1]['rows'] and results[0]['header'] == results[1]['header']
    rendered = []
    for name in ['source', 'roundtrip-1', 'roundtrip-2']:
        folder = BASE / (name + '-render')
        with pdfplumber.open(folder / (name + '.pdf')) as document:
            assert len(document.pages) == 1
            words = document.pages[0].extract_words(extra_attrs=['fontname', 'size'])
            rendered.append({'document': name + '.docx', 'pages': 1,
                             'text': document.pages[0].extract_text(),
                             'targetWords': [word for word in words if word['text'] == 'target']})
    canonical = json.loads((BASE / 'position-diagnosis/native-position-comparison.json').read_text())['pdfCoordinates'][1]['targetWords']
    for result in rendered[1:]:
        assert len(result['targetWords']) == 1
        for key in ['x0', 'x1', 'top', 'bottom', 'size']:
            assert abs(result['targetWords'][0][key] - canonical[0][key]) < 1e-6, key
    output = {'scope': 'Current actual ZUVI browser source and two native DOCX downloads after W010 repair',
              'source': source, 'rounds': results, 'rendered': rendered,
              'checks': 'Mixed ladder, five Unicode modes, source marks and links, shared header 14→16, signed integer position, twips spacing, two saves and native glyph-coordinate equivalence passed.'}
    (BASE / 'native-inspection.json').write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n')
    print('Native inspection passed: 3 DOCX files, two repeated reopens, 9 body paragraphs, five links, 14→16 header, signed half-points and canonical native glyph coordinates.')


if __name__ == '__main__':
    main()
