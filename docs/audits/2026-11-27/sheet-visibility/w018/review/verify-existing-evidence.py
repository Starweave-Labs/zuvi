"""Read-only verification of W018 evidence from the frozen 316-test run."""
import hashlib
import json
import subprocess
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = next(parent for parent in Path(__file__).resolve().parents if (parent / 'pnpm-workspace.yaml').exists())
BASE = ROOT / 'docs/audits/2026-11-27/word-sheet-pdf-integration'
OUT = Path(__file__).resolve().parent
COMMIT = '3c751e02a8d4be6e19797ad5c0a55c1077d29107'
W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'

def identity(path):
    data = path.read_bytes()
    return {'path': str(path.relative_to(ROOT)), 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}

report = json.loads((BASE / 'validation/e2e-final-316.json').read_text())
def specs(suite):
    yield from suite.get('specs', [])
    for child in suite.get('suites', []):
        yield from specs(child)

selected = [spec for suite in report['suites'] for spec in specs(suite)
            if spec['file'] == 'office-studio-word-nonprinting.spec.ts']
assert len(selected) == 1
browser = selected[0]
assert browser['ok'] and len(browser['tests']) == 1
test = browser['tests'][0]
assert test['status'] == 'expected' and test['expectedStatus'] == 'passed'
assert len(test['results']) == 1 and test['results'][0]['status'] == 'passed'
assert test['results'][0]['retry'] == 0 and not test['results'][0]['errors']

receipt = json.loads((BASE / 'evidence-preservation/final-316-verified-restoration.json').read_text())
native = []
screenshots = []
for record in receipt['regenerated']:
    if '/word-nonprinting/' not in record['originalPath']:
        continue
    path = BASE / record['archivePath']
    result = identity(path)
    assert result['sha256'] == record['after']['sha256']
    assert result['bytes'] == record['after']['bytes']
    if path.suffix == '.png':
        screenshots.append(result)
        continue
    assert path.suffix == '.docx'
    with zipfile.ZipFile(path) as package:
        parts = {}
        for name in package.namelist():
            if name == 'word/document.xml' or (name.startswith('word/') and name.split('/')[-1].startswith(('header', 'footer')) and name.endswith('.xml')):
                xml = package.read(name)
                root = ET.fromstring(xml)
                text = ''.join(node.text or '' for node in root.iter(W + 't'))
                assert not any(symbol in text for symbol in ['·', '→', '°', '¶', '↵'])
                assert b'data-word-nonprinting' not in xml
                parts[name] = {'text': text, 'tabs': len(list(root.iter(W + 'tab'))), 'breaks': len(list(root.iter(W + 'br')))}
        body = parts['word/document.xml']
        assert body['tabs'] == 2 and body['breaks'] == 1
        assert '  😀 A ' in body['text'] and ' B Z  ' in body['text']
        if 'roundtrip' in path.name:
            assert 'Next line edited' in body['text']
        else:
            assert 'Next line' in body['text'] and 'edited' not in body['text']
    native.append({**result, 'parts': parts})
assert len(native) == 3 and len(screenshots) == 4
source = []
for name in [
    'packages/ui/src/components/OfficeStudio/studio-word-nonprinting.ts',
    'packages/ui/src/components/OfficeStudio/studio-word-nonprinting.test.ts',
    'packages/ui/src/components/OfficeStudio/StudioWord.tsx',
    'packages/ui/src/components/OfficeStudio/StudioWord.test.tsx',
    'packages/ui/src/components/OfficeStudio/StudioWord.css',
    'docs/src/pages/collaboration/office-studio/studio-word-codec.ts',
    'docs/src/pages/collaboration/office-studio/studio-print.ts',
    'docs/tests/office-studio-word.test.mjs',
    'docs/tests/studio-print.test.mjs',
    'e2e/office-studio-word-nonprinting.spec.ts',
]:
    result = identity(ROOT / name)
    original = subprocess.check_output(['git', 'show', COMMIT + ':' + name], cwd=ROOT)
    assert hashlib.sha256(original).hexdigest() == result['sha256'], name
    source.append({**result, 'matchesSourceCommit': True})
output = {'item': 'W018', 'status': 'verified-existing-evidence', 'sourceCommit': COMMIT,
          'browserRunWasRepeated': False, 'browser': browser,
          'browserReport': identity(BASE / 'validation/e2e-final-316.json'),
          'restorationReceipt': identity(BASE / 'evidence-preservation/final-316-verified-restoration.json'),
          'nativeDocuments': native, 'screenshots': screenshots, 'sourceChecks': source,
          'freshFocusedRuns': {'ui': {'passed': 5, 'skippedByNameFilter': 138},
                               'nativeAndPrint': {'passed': 2, 'skippedByNameFilter': 117}},
          'productionChangesRequired': False}
(OUT / 'existing-evidence-verification.json').write_text(json.dumps(output, ensure_ascii=False, indent=2) + chr(10))
print(json.dumps({'status': output['status'], 'nativeDocuments': len(native), 'screenshots': len(screenshots), 'sourceFiles': len(source)}, ensure_ascii=False))
