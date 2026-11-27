"""Read-only check of final source, artifacts, native receipts and original scope."""
from collections import Counter
from pathlib import Path
import hashlib
import json
import os
import subprocess

HERE = Path(__file__).resolve().parent
ROOT = next(p for p in HERE.parents if (p / 'pnpm-workspace.yaml').exists())
OUT = ROOT / 'docs/audits/2026-11-28/duplicates-paragraph-outlines'
def read(path):
    return json.loads(path.read_text())
def ident(path):
    data = os.fsencode(os.readlink(path)) if path.is_symlink() else path.read_bytes()
    return {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
def compare(path, record):
    assert ident(path) == {key: record[key] for key in ['bytes','sha256']}, path
verification = read(OUT / 'verification.json')
assert verification['status'] == 'passed' and not verification['whole159Complete']
assert verification['P003Complete'] is False
source = verification['sourceCommit']
assert subprocess.check_output(['git', 'rev-parse', source], cwd=ROOT, text=True).strip() == source
scopes = ['packages/ui/src','docs/src','docs/tests','e2e','registry/registry.json',
          'docs/vite.config.ts','scripts','packages/ui/package.json']
assert not subprocess.check_output(['git','diff',source,'--',*scopes],cwd=ROOT), 'Source differs from verified commit'
tracked = set(subprocess.check_output(['git','ls-tree','-r','--name-only',source],cwd=ROOT,text=True).splitlines())
frozen = read(OUT / 'validation/source-freeze.json')
for records in frozen.values():
    for record in records:
        compare(ROOT / record['path'], record)
assert all(record['path'] in tracked for record in frozen['source'])
gates = read(OUT / 'validation/gates.json')
assert len(gates) == 12 and all(record['exitCode'] == 0 for record in gates)
report = read(OUT / 'validation/full.json')
assert not report['errors'] and report['stats'] == verification['browser']
assert {key: report['stats'][key] for key in ['expected','unexpected','skipped','flaky']} == {
    'expected':319,'unexpected':0,'skipped':0,'flaky':0}
for record in verification['nativeXlsx']:
    compare(ROOT / record['path'], record)
word = read(OUT / 'validation/word-native-final.json')
assert word['status'] == 'passed'
for item in word['inputs']:
    original = Path(item['file']['path'])
    compare(OUT / 'paragraph/browser' / original.name, item['file'])
pdf = read(OUT / 'pdf-outlines/final-2026-11-28/verification.json')
assert pdf['P003Complete'] is False and pdf['tests'] == {
    'passed':9,'failed':0,'skipped':0,
    'log':'.release/office-continuation/pdf-outlines/final-2026-11-28/native-tests-verified.txt'}
for item in pdf['nativeSamples']:
    compare(OUT / 'pdf-outlines/final-2026-11-28/native-verified' / Path(item['path']).name, item)
for item in read(OUT / 'pdf-outlines/final-2026-11-28/source-identities.json')['files']:
    if item['path'].startswith(('docs/src/','docs/tests/')):
        compare(ROOT / item['path'], item)
status = read(ROOT / 'docs/office-studio-goal-status-2026-11-23.json')
original = {item['id']:item for item in read(ROOT / status['sourceLedger'])['items']}
assert len(status['items']) == 159 and status['completionProven'] is False
for item in status['items']:
    assert item['acceptance'] == original[item['id']]['acceptance']
    assert item['commonAcceptance'] == original[item['id']]['commonAcceptance']
    if item['id'] in verification['originalAcceptanceCandidates']:
        assert item['status'] == 'verified-original-acceptance'
        assert item['currentAudit']['sourceCommit'] == source
        assert not item['gaps'] and not item['currentAudit']['functionalGaps']
    if item['id'] == 'P003':
        assert item['status'] != 'verified-original-acceptance' and item['gaps']
        assert item['currentAudit']['implementation'] == '部分实现'
count = sum(item['status'] == 'verified-original-acceptance' for item in status['items'])
assert count == status['verifiedOriginalAcceptanceCount'] == 22
assert 159-count == status['remainingOriginalAcceptanceCount'] == 137
assert dict(Counter(item['currentAudit']['implementation'] for item in status['items'])) == status['currentImplementationCounts']
matrix = read(OUT / 'original-acceptance-matrix.json')
assert matrix['sourceCommit'] == source and len(matrix['items']) == 5
for item in matrix['items']:
    assert item['originalAcceptance'] == original[item['id']]['acceptance']
    assert [row['criterion'] for row in item['commonAcceptance']] == original[item['id']]['commonAcceptance']
    assert all(row['status'] == 'verified' for row in item['commonAcceptance'])
manifest = read(OUT / 'artifact-manifest.json')
actual = {str(path.relative_to(OUT)) for path in OUT.rglob('*') if path.is_file() and path != OUT / 'artifact-manifest.json'}
assert set(manifest) == actual
for name, record in manifest.items():
    compare(OUT / name, record)
print(json.dumps({'status':'passed','sourceCommit':source,'browser':319,'verifiedRequirements':count,
                  'remaining':159-count,'P003Complete':False,'artifactFiles':len(manifest),
                  'frozenGroups':{key:len(value) for key,value in frozen.items()}},ensure_ascii=False))
