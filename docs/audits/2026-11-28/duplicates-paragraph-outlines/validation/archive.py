"""Bind the completed frozen run to its native evidence without altering history."""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess
import zipfile
from xml.etree import ElementTree as ET

HERE = Path(__file__).resolve().parent
ROOT = next(p for p in HERE.parents if (p / 'pnpm-workspace.yaml').exists())
OUT = ROOT / 'docs/audits/2026-11-28/duplicates-paragraph-outlines'
WORK = ROOT / '.release/office-continuation'
S = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
Z = '{urn:zuvi:office-studio}'
def read(path):
    return json.loads(path.read_text())
def ident(path):
    data = path.read_bytes()
    return {'path': str(path.relative_to(ROOT)), 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
def copy(source, destination):
    destination.parent.mkdir(parents=True, exist_ok=True)
    assert not destination.exists(), destination
    shutil.copy2(source, destination)
    assert ident(source)['sha256'] == ident(destination)['sha256']
def tree(source, destination):
    for path in sorted(source.rglob('*')):
        if path.is_file():
            copy(path, destination / path.relative_to(source))
def walk(suite):
    yield from suite.get('specs', [])
    for child in suite.get('suites', []):
        yield from walk(child)

status = read(HERE / 'full-status.json')
assert status['status'] == 'completed' and status['exitCode'] == 0
assert status['workers'] == 1 and status['retries'] == 0
report = read(HERE / 'full.json')
assert not report['errors'] and report['stats'] == status['stats']
assert {k: report['stats'][k] for k in ['expected', 'unexpected', 'skipped', 'flaky']} == {
    'expected': 319, 'unexpected': 0, 'skipped': 0, 'flaky': 0}
specs = [s for suite in report['suites'] for s in walk(suite)]
for spec in specs:
    assert spec['ok']
    for test in spec['tests']:
        assert test['status'] == 'expected' and len(test['results']) == 1
        assert test['results'][0]['status'] == 'passed' and test['results'][0]['retry'] == 0
for name, count in {
    'office-studio-sheet-duplicates.spec.ts': 1, 'office-studio-word-paragraph-acceptance.spec.ts': 1,
    'office-studio-word-paragraph.spec.ts': 1, 'office-studio-word-tabs.spec.ts': 2,
    'office-studio-word-surface.spec.ts': 1,
}.items():
    assert sum(spec['file'] == name for spec in specs) == count, name
gates = read(HERE / 'gates.json')
assert len(gates) == 12 and all(step['exitCode'] == 0 for step in gates)
assert '2936 passed (2936)' in (HERE / 'ui.txt').read_text()
for token in ['# pass 680', '# fail 0', '# skipped 0']:
    assert token in (HERE / 'docs.txt').read_text()
assert not OUT.exists()
subprocess.run(['python3', '-B', str(HERE / 'run-full.py'), 'verify'], cwd=ROOT, check=True)
subprocess.run(['python3', '-B', str(WORK / 'paragraph-acceptance/verify-browser-native.py'),
                '--input-dir', str(WORK / 'paragraph-acceptance/browser'),
                '--output', str(HERE / 'word-native-final.json'),
                '--browser-report', str(HERE / 'full.json')], cwd=ROOT, check=True)
OUT.mkdir(parents=True)
for path in sorted(HERE.iterdir()):
    if path.is_file():
        copy(path, OUT / 'validation' / path.name)
tree(WORK / 'duplicates', OUT / 'duplicates')
tree(WORK / 'x046/native', OUT / 'duplicates/model-native')
tree(WORK / 'paragraph-acceptance', OUT / 'paragraph')
tree(WORK / 'pdf-outlines', OUT / 'pdf-outlines')
tree(HERE / 'focused-before-full', OUT / 'focused-before-full')

native = []
for path in sorted((OUT / 'duplicates/browser').glob('*.xlsx')):
    with zipfile.ZipFile(path) as package:
        xml = ET.fromstring(package.read('xl/worksheets/sheet1.xml'))
        cells = {cell.attrib['r']: cell for cell in xml.iter(S + 'c')}
        strings = []
        if 'xl/sharedStrings.xml' in package.namelist():
            shared = ET.fromstring(package.read('xl/sharedStrings.xml'))
            strings = [''.join(t.text or '' for t in item.iter(S + 't')) for item in shared]
        def value(address):
            cell = cells.get(address)
            if cell is None:
                return None
            formula = cell.find(S + 'f')
            if formula is not None:
                return {'formula': formula.text, 'cache': cell.findtext(S + 'v')}
            text = cell.findtext(S + 'v')
            if cell.attrib.get('t') == 's':
                return {'text': strings[int(text)]}
            if cell.attrib.get('t') == 'b':
                return {'boolean': text == '1'}
            return None if text is None else {'number': float(text)}
        if path.name != 'source.xlsx':
            assert value('A2') == {'number': 1.0}
            assert value('A3') == {'text': '1'}
            assert value('A4') == {'boolean': True}
            assert value('A5') is None
            assert value('A6') == {'text': ''}
            assert value('A7') == {'number': 2.0}
            assert value('C7') == {'formula': 'A7*10', 'cache': '20'}
            for row in [8, 9, 10]:
                for column in ['A', 'B', 'C']:
                    assert value(column + str(row)) is None
            for row in range(2, 11):
                assert value('D' + str(row)) == {'text': 'Keep ' + str(row)}
            links = list(xml.iter(S + 'hyperlink'))
            assert any(link.attrib['ref'] == 'B7' for link in links)
            assert not any(link.attrib['ref'] in ['B8', 'B9', 'B10'] for link in links)
        native.append({**ident(path), 'nativeValues': {address: value(address) for address in ['A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'C7']}})
assert len(native) == 3
pdf = read(OUT / 'pdf-outlines/final-2026-11-28/verification.json')
assert pdf['P003Complete'] is False and pdf['tests']['passed'] == 9
verification = {
    'date': '2026-11-28', 'status': 'passed', 'sourceCommit': None,
    'originalAcceptanceCandidates': ['X046', 'W011', 'W012', 'W013', 'W016'],
    'P003Complete': False, 'whole159Complete': False,
    'browser': report['stats'], 'units': {'ui': 2936, 'docs': 680, 'nativeDuplicates': 5, 'nativeOutlines': 9},
    'sourceFreeze': ident(OUT / 'validation/source-freeze.json'),
    'nativeXlsx': native, 'nativeWordVerification': ident(OUT / 'validation/word-native-final.json'),
    'historicalFilesRestored': read(HERE / 'restoration.json')['verifiedHistoricalFiles'],
    'regeneratedRetainedAt': str(HERE.relative_to(ROOT) / 'regenerated'),
    'pdfOutlineMilestone': ident(OUT / 'pdf-outlines/final-2026-11-28/verification.json'),
}
(OUT / 'verification.json').write_text(json.dumps(verification, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'status': 'passed', 'browserPassed': 319, 'candidates': verification['originalAcceptanceCandidates'], 'archive': str(OUT)}))
