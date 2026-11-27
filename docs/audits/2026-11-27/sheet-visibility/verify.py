"""Read-only verification of the final source, artifacts and original ledger."""
from collections import Counter
import hashlib
import json
from pathlib import Path
import subprocess

HERE = Path(__file__).resolve().parent
ROOT = next(p for p in HERE.parents if (p / 'pnpm-workspace.yaml').exists())
OUT = ROOT / 'docs/audits/2026-11-27/sheet-visibility'

def read(path):
    return json.loads(path.read_text())

def identity(path):
    data = path.read_bytes()
    return {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}

verification = read(OUT / 'verification.json')
assert verification['status'] == 'passed' and not verification['whole159Complete']
source = verification['sourceCommit']
assert subprocess.check_output(['git', 'rev-parse', source], cwd=ROOT, text=True).strip() == source
frozen = read(OUT / 'validation/initial/source-freeze.json')
for group in frozen.values():
    for record in group:
        assert identity(ROOT / record['path']) == {k: record[k] for k in ['bytes', 'sha256']}, record['path']
tracked = set(subprocess.check_output(['git', 'ls-tree', '-r', '--name-only', source], cwd=ROOT, text=True).splitlines())
assert all(record['path'] in tracked for record in frozen['source'])
scopes = ['packages/ui/src', 'docs/src', 'docs/tests', 'e2e', 'registry/registry.json',
          'docs/vite.config.ts', 'scripts', 'packages/ui/package.json']
assert not subprocess.check_output(['git', 'diff', source, '--', *scopes], cwd=ROOT), 'Source differs from its verified commit'
report = read(OUT / 'validation/resumed/full.json')
stats = report['stats']
assert stats == verification['browser'] and not report['errors']
assert {k: stats[k] for k in ['expected', 'unexpected', 'skipped', 'flaky']} == {
    'expected': 317, 'unexpected': 0, 'skipped': 0, 'flaky': 0}
for record in verification['nativeFiles'] + verification['wordNativeFiles']:
    assert identity(ROOT / record['path']) == {k: record[k] for k in ['bytes', 'sha256']}
ledger = read(ROOT / 'docs/office-studio-goal-status-2026-11-23.json')
original = {item['id']: item for item in read(ROOT / ledger['sourceLedger'])['items']}
assert len(ledger['items']) == 159 and not ledger['completionProven']
for item in ledger['items']:
    assert item['acceptance'] == original[item['id']]['acceptance']
    assert item['commonAcceptance'] == original[item['id']]['commonAcceptance']
    if item['id'] in verification['items']:
        assert item['status'] == 'verified-original-acceptance'
        assert item['currentAudit']['sourceCommit'] == source
        assert not item['gaps'] and not item['currentAudit']['functionalGaps']
count = sum(item['status'] == 'verified-original-acceptance' for item in ledger['items'])
assert count == ledger['verifiedOriginalAcceptanceCount'] == 17
assert ledger['remainingOriginalAcceptanceCount'] == 159 - count == 142
assert dict(Counter(item['currentAudit']['implementation'] for item in ledger['items'])) == ledger['currentImplementationCounts']
matrix = read(OUT / 'original-acceptance-matrix.json')
assert matrix['sourceCommit'] == source and len(matrix['items']) == 2
for item in matrix['items']:
    assert item['originalAcceptance'] == original[item['id']]['acceptance']
    assert [c['criterion'] for c in item['commonAcceptance']] == original[item['id']]['commonAcceptance']
    assert all(c['status'] == 'verified' for c in item['commonAcceptance'])
manifest = read(OUT / 'artifact-manifest.json')
actual = {str(path.relative_to(OUT)) for path in OUT.rglob('*') if path.is_file() and path.name != 'artifact-manifest.json'}
assert set(manifest) == actual
for name, expected in manifest.items():
    assert identity(OUT / name) == expected, name
print(json.dumps({'status': 'passed', 'browser': 317, 'verifiedOriginalRequirements': count,
                  'remaining': 159 - count, 'artifactFiles': len(manifest),
                  'frozenGroups': {k: len(v) for k, v in frozen.items()}}, ensure_ascii=False))
