"""Archive the completed X030/W018 run and independently inspect native files."""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess
import zipfile
from xml.etree import ElementTree as ET

HERE = Path(__file__).resolve().parent
ROOT = next(p for p in HERE.parents if (p / 'pnpm-workspace.yaml').exists())
BATCH = HERE.parent.parent
OUT = ROOT / 'docs/audits/2026-11-27/sheet-visibility'
S = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
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

def walk(suite):
    yield from suite.get('specs', [])
    for child in suite.get('suites', []):
        yield from walk(child)

subprocess.run(['python3', '-B', str(HERE.parent / 'freeze.py'), 'verify'], cwd=ROOT, check=True)
status = read(HERE / 'full-status.json')
assert status['status'] == 'completed' and status['exitCode'] == 0
report = read(HERE / 'full.json')
assert report['stats'] == status['stats'] and not report['errors']
assert {k: report['stats'][k] for k in ['expected', 'unexpected', 'skipped', 'flaky']} == {
    'expected': 317, 'unexpected': 0, 'skipped': 0, 'flaky': 0}
specs = [s for suite in report['suites'] for s in walk(suite)]
for spec in specs:
    assert spec['ok'] and len(spec['tests']) == 1
    test = spec['tests'][0]
    assert test['status'] == 'expected' and test['expectedStatus'] == 'passed'
    assert len(test['results']) == 1 and test['results'][0]['status'] == 'passed'
    assert test['results'][0]['retry'] == 0
for name in ['office-studio-sheet-visibility.spec.ts', 'office-studio-sheet-navigation.spec.ts',
             'office-studio-word-nonprinting.spec.ts']:
    assert sum(s['file'] == name for s in specs) == 1, name
for name, tokens in {
    'ui-full.txt': ['2900 passed (2900)', '177 passed (177)'],
    'docs-tests.txt': ['# pass 666', '# fail 0', '# skipped 0'],
    'native-final.txt': ['# pass 4', '# fail 0', '# skipped 0'],
}.items():
    text = (HERE.parent / name).read_text()
    assert all(token in text for token in tokens), name
assert 'warning' not in (HERE.parent / 'lint.txt').read_text().lower()
assert read(HERE / 'failures-repeat.json')['stats']['expected'] == 6
assert read(HERE.parent / 'full-317.json')['stats']['unexpected'] == 2
restoration = read(HERE / 'full-restoration.json')
baseline = read(HERE / 'historical-baseline.json')
assert restoration['historicalFilesVerified'] == len(baseline)
for name, record in baseline.items():
    current = ident(ROOT / 'docs/audits' / name)
    assert all(current[k] == record[k] for k in ['bytes', 'sha256']), name

assert not OUT.exists()
OUT.mkdir(parents=True)
for path in sorted(HERE.parent.iterdir()):
    if path.is_file():
        copy(path, OUT / 'validation/initial' / path.name)
for name in ['full-status.json', 'full.json', 'full.txt', 'failures-repeat.json',
             'failures-repeat.txt', 'first-run-restoration.json', 'full-restoration.json',
             'historical-baseline.json', 'run.py', 'launcher.txt']:
    copy(HERE / name, OUT / 'validation/resumed' / name)
for path in sorted((HERE.parent / 'full-317-output').rglob('trace.zip')):
    copy(path, OUT / 'validation/initial/failure-traces' / path.relative_to(HERE.parent / 'full-317-output'))
for path in sorted((HERE.parent / 'full-317-output').rglob('error-context.md')):
    copy(path, OUT / 'validation/initial/failure-traces' / path.relative_to(HERE.parent / 'full-317-output'))
for path in sorted((BATCH / 'browser').iterdir()):
    if path.is_file():
        copy(path, OUT / 'browser' / path.name)
copy(BATCH / 'README.md', OUT / 'implementation-notes.md')
copy(BATCH / 'acceptance-matrix.json', OUT / 'acceptance-matrix-initial.json')
w018 = BATCH.parent / 'w018'
for path in sorted(w018.iterdir()):
    if path.is_file():
        copy(path, OUT / 'w018/review' / path.name)
for path in sorted((HERE / 'regenerated/2026-11-25/word-nonprinting').iterdir()):
    if path.is_file():
        copy(path, OUT / 'w018/browser' / path.name)
copy(Path(__file__), OUT / 'archive-original.py')

native = []
for path in sorted((OUT / 'browser').glob('*.xlsx')):
    with zipfile.ZipFile(path) as package:
        xml = ET.fromstring(package.read('xl/worksheets/sheet1.xml'))
        rows = {int(row.attrib['r']): row for row in xml.iter(S + 'row')}
        cols = list(xml.iter(S + 'col'))
        cells = {cell.attrib['r']: cell for cell in xml.iter(S + 'c')}
        assert cells['E4'].find(S + 'f').text == 'SUM(A2:A4)'
        assert cells['E4'].find(S + 'v').text == '9'
        assert rows[2].attrib['ht'] == '32' and rows[6].attrib['ht'] == '26'
        column = lambda index: next(c for c in cols if int(c.attrib['min']) <= index <= int(c.attrib['max']))
        assert column(2).attrib['width'] == '20' and column(3).attrib['width'] == '24'
        if path.name != 'source.xlsx':
            hidden = path.name.startswith('hidden-')
            assert xml.attrib[Z + 'manualHiddenRows'] == ('2 3 6' if hidden else '')
            for row in [2, 3, 6]:
                assert (rows[row].attrib.get('hidden') == '1') == hidden
            for col in [2, 3]:
                assert (column(col).attrib.get('hidden') == '1') == hidden
            assert rows[3].attrib.get('customHeight') == '0'
        native.append({**ident(path), 'formula': 'SUM(A2:A4)', 'cachedValue': 9,
                       'manualRows': xml.attrib.get(Z + 'manualHiddenRows')})
word = []
for path in sorted((OUT / 'w018/browser').glob('*.docx')):
    with zipfile.ZipFile(path) as package:
        parts = {}
        for name in package.namelist():
            if name != 'word/document.xml' and not (name.startswith('word/') and name.split('/')[-1].startswith(('header', 'footer')) and name.endswith('.xml')):
                continue
            xml = ET.fromstring(package.read(name))
            text = ''.join(node.text or '' for node in xml.iter(W + 't'))
            assert not any(symbol in text for symbol in ['·', '→', '°', '¶', '↵'])
            parts[name] = {'text': text, 'tabs': len(list(xml.iter(W + 'tab'))), 'breaks': len(list(xml.iter(W + 'br')))}
        body = parts['word/document.xml']
        assert body['tabs'] == 2 and body['breaks'] == 1
        assert '  😀 A ' in body['text'] and ' B Z  ' in body['text']
        assert ('edited' in body['text']) == ('roundtrip' in path.name)
    word.append({**ident(path), 'parts': parts})
assert len(native) == 4 and len(word) == 3
summary = {'status': 'passed', 'items': ['X030', 'W018'], 'whole159Complete': False,
           'browser': report['stats'], 'units': {'ui': 2900, 'docs': 666, 'nativeVisibility': 4},
           'previousRun': {'passed': 315, 'failed': 2}, 'unchangedFailureRepeatsPassed': 6,
           'nativeFiles': native, 'wordNativeFiles': word,
           'historicalRegularFilesRestored': len(baseline),
           'firstRunHistoricalPathsRestored': len(read(HERE / 'first-run-restoration.json')),
           'sourceFreeze': ident(OUT / 'validation/initial/source-freeze.json'),
           'retainedRegeneratedRoot': str(HERE.relative_to(ROOT) / 'regenerated')}
(OUT / 'verification.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'status': 'passed', 'browserPassed': 317, 'nativeFiles': len(native) + len(word), 'archive': str(OUT)}))
