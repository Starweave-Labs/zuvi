from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile
import hashlib
import json


W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
R = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'
BASE = Path(__file__).resolve().parent
FLAGS = ('bold', 'italic', 'underline', 'strike')


def properties(element):
    result = {}
    if element is None:
        return result
    for name, key in [('b', 'bold'), ('i', 'italic'), ('u', 'underline'), ('strike', 'strike')]:
        value = element.find(W + name)
        if value is not None:
            result[key] = value.get(W + 'val', 'true') not in ['0', 'false', 'off', 'none']
    value = element.find(W + 'rFonts')
    if value is not None:
        family = value.get(W + 'ascii') or value.get(W + 'hAnsi')
        if family:
            result['family'] = family
    value = element.find(W + 'sz')
    if value is not None:
        result['size'] = int(value.get(W + 'val')) / 2
    value = element.find(W + 'color')
    if value is not None and value.get(W + 'val') not in [None, 'auto']:
        result['color'] = value.get(W + 'val').upper()
    value = element.find(W + 'vertAlign')
    if value is not None:
        result['script'] = value.get(W + 'val')
    value = element.find(W + 'shd')
    if value is not None:
        fill = value.get(W + 'fill')
        result['background'] = fill.upper() if fill and fill != 'auto' and value.get(W + 'val') != 'nil' else None
    return result


def inspect(path):
    data = path.read_bytes()
    with ZipFile(path) as archive:
        assert archive.testzip() is None
        document = ET.fromstring(archive.read('word/document.xml'))
        styles = ET.fromstring(archive.read('word/styles.xml'))
        relationships = ET.fromstring(archive.read('word/_rels/document.xml.rels'))
    defaults = {'bold': False, 'italic': False, 'underline': False, 'strike': False,
                'size': 12, 'color': '000000', 'background': None, 'script': 'baseline'}
    defaults.update(properties(styles.find(f'{W}docDefaults/{W}rPrDefault/{W}rPr')))
    catalog = {style.get(W + 'styleId'): style for style in styles.findall(W + 'style')}

    def inherited(style_id, path=()):
        if not style_id or style_id not in catalog:
            return defaults.copy()
        assert style_id not in path
        style = catalog[style_id]
        base = style.find(W + 'basedOn')
        result = inherited(base.get(W + 'val') if base is not None else None, (*path, style_id))
        result.update(properties(style.find(W + 'rPr')))
        return result

    rows = []
    for paragraph in document.findall(f'{W}body/{W}p'):
        style = paragraph.find(f'{W}pPr/{W}pStyle')
        base = inherited(style.get(W + 'val') if style is not None else 'Normal')
        runs = []
        for run in paragraph.iter(W + 'r'):
            text = ''.join(part.text or '' for part in run.iter(W + 't'))
            if not text:
                continue
            item = base.copy()
            run_properties = run.find(W + 'rPr')
            character_style = run_properties.find(W + 'rStyle') if run_properties is not None else None
            if character_style is not None:
                item.update(inherited(character_style.get(W + 'val')))
            item.update(properties(run_properties))
            item['text'] = text
            runs.append(item)
        rows.append({'text': ''.join(run['text'] for run in runs), 'runs': runs})
    destinations = {item.get('Id'): item.get('Target') for item in relationships}
    links = [{'text': ''.join(part.text or '' for part in link.iter(W + 't')),
              'target': destinations[link.get(R + 'id')]} for link in document.iter(W + 'hyperlink')]
    assert len(rows) == 9
    assert links == [{'text': 'Untouched link', 'target': 'https://example.com/kept-link'}]
    assert document.find(f'{W}body/{W}p/{W}pPr/{W}pBdr') is None
    return {'path': path.name, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(), 'rows': rows, 'links': links}


def by_text(report, text):
    return next(row for row in report['rows'] if row['text'] == text)['runs']


def main():
    source = inspect(BASE / 'source.docx')
    mixed = by_text(source, 'Mixed plain Mixed rich')
    assert len(mixed) == 2
    assert mixed[0]['family'] == 'Arial' and mixed[0]['size'] == 12
    assert mixed[1]['family'] == 'Times New Roman' and mixed[1]['size'] == 14.5
    assert not any(mixed[0][flag] for flag in FLAGS)
    assert all(mixed[1][flag] for flag in FLAGS) and mixed[1]['background'] == 'FFFF00'
    results = [inspect(BASE / f'roundtrip-{round}.docx') for round in [1, 2]]
    for report in results:
        for run in by_text(report, 'Mixed plain Mixed rich'):
            assert run['family'] == 'Arial' and run['size'] == 12
            assert all(run[flag] for flag in FLAGS) and run['background'] is None
        for run in by_text(report, 'Clear styles'):
            assert run['family'] == 'Arial' and run['size'] == 12
            assert not any(run[flag] for flag in FLAGS)
        caret = by_text(report, 'Caret Typedbase')
        typed = next(run for run in caret if run['text'] == 'Typed')
        assert typed['family'] == 'Times New Roman' and typed['size'] == 17.5
        for run in caret:
            if run['text'] != 'Typed':
                assert run['family'] == 'Arial' and run['size'] == 12
        script = by_text(report, 'Script 23')
        assert next(run for run in script if run['text'] == '2')['script'] == 'superscript'
        assert next(run for run in script if run['text'] == '3')['script'] == 'subscript'
        assert all(run['size'] == 12 for run in script)
        assert all(run['background'] == 'FFFF00' for run in by_text(report, 'Highlight target'))
        highlight = by_text(report, 'Highlight HCcaret')
        assert all(run['family'] == 'Arial' and run['size'] == 12 for run in highlight)
        assert next(run for run in highlight if run['text'] == 'H')['background'] == 'FFFF00'
        assert all(run['background'] is None for run in highlight if run['text'] != 'H')
        for run in by_text(report, '中文小数字号样本'):
            assert run['family'] == 'Noto Sans SC' and run['size'] == 12.5
        assert by_text(report, 'Untouched link') == by_text(source, 'Untouched link')
    assert results[0]['rows'] == results[1]['rows']
    recovery = inspect(BASE / 'after-cancel.docx')
    assert recovery['rows'] == source['rows']
    output = {'scope': 'W001/W003/W004/W006 actual native DOCX source and two browser exports',
              'source': source, 'rounds': results, 'afterCancel': recovery,
              'checks': 'canonical run values, original body and link, UTF-8 Chinese, half-points, repeated reopening and cancelled-draft export recovery passed'}
    (BASE / 'native-inspection.json').write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n')
    print('Native DOCX inspection passed: source, two actual browser exports and recovered export, inherited and direct run properties, links and Chinese text')


if __name__ == '__main__':
    main()
