"""Verify frozen source, single browser run and the two acceptance records."""
from collections import Counter
import hashlib
import json
from pathlib import Path
import subprocess

HERE = Path(__file__).resolve().parent
ROOT = next(p for p in HERE.parents if (p / 'pnpm-workspace.yaml').is_file())

def read(path):
    return json.loads(path.read_text())

def identity(path):
    data = path.read_bytes()
    return {'path': str(path.relative_to(ROOT)), 'bytes': len(data),
            'sha256': hashlib.sha256(data).hexdigest()}

def walk(suite):
    yield from suite.get('specs', [])
    for child in suite.get('suites', []):
        yield from walk(child)

subprocess.run(['python3', '-B', str(HERE / 'freeze.py'), 'verify'], check=True, cwd=ROOT)
status = read(HERE / 'full-317-status.json')
assert status['status'] == 'completed' and status['exitCode'] == 0
assert status['workers'] == 1 and status['retries'] == 0
report = read(HERE / 'full-317.json')
assert not report.get('errors')
stats = report['stats']
assert {key: stats[key] for key in ['expected', 'unexpected', 'skipped', 'flaky']} == {
    'expected': 317, 'unexpected': 0, 'skipped': 0, 'flaky': 0
}
assert status['stats'] == stats
counts = Counter()
for spec in [s for suite in report['suites'] for s in walk(suite)]:
    for test in spec['tests']:
        assert test['status'] == 'expected' and test['expectedStatus'] == 'passed'
        assert len(test['results']) == 1 and test['results'][0]['status'] == 'passed'
        assert test['results'][0]['retry'] == 0
        counts[Path(spec['file']).name] += 1
assert sum(counts.values()) == 317
for name in ['office-studio-sheet-visibility.spec.ts', 'office-studio-sheet-navigation.spec.ts',
             'office-studio-word-nonprinting.spec.ts']:
    assert counts[name] == 1, name
for name, tokens in {
    'ui-full.txt': ['2900 passed (2900)', '177 passed (177)'],
    'docs-tests.txt': ['# pass 666', '# fail 0', '# skipped 0'],
    'native-final.txt': ['# pass 4', '# fail 0'],
}.items():
    text = (HERE / name).read_text()
    assert all(token in text for token in tokens), name
logs = [identity(HERE / name) for name in [
    'ui-full.txt', 'docs-tests.txt', 'native-final.txt', 'other-tests.txt',
    'types.txt', 'lint.txt', 'registry.txt', 'consumer.txt', 'distribution.txt',
    'bundle-size.txt', 'build.txt', 'browser-build.txt'
]]
assert 'warning' not in (HERE / 'lint.txt').read_text()
matrix = read(HERE.parent / 'acceptance-matrix.json')
ledger = read(ROOT / 'docs/onlyoffice-feature-ledger-2026-11-13.json')
assert matrix['originalAcceptance'] == next(x['acceptance'] for x in ledger['items'] if x['id'] == 'X030')
assert len(matrix['commonAcceptance']) == 6
output = {'status': 'passed', 'whole159Complete': False, 'browser': stats,
          'sourceFreeze': identity(HERE / 'source-freeze.json'), 'logs': logs,
          'requiredSpecs': dict(counts), 'unitCounts': {'ui': 2900, 'docs': 666, 'nativeVisibility': 4},
          'nativeFiles': [identity(p) for p in sorted((HERE.parent / 'browser').glob('*.xlsx'))]}
with (HERE / 'verification.json').open('x') as stream:
    stream.write(json.dumps(output, ensure_ascii=False, indent=2) + chr(10))
print(json.dumps({'status': 'passed', 'browserPassed': 317, 'unitCounts': output['unitCounts']}))
