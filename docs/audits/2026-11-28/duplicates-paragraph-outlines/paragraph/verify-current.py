"""Read-only verification of the recorded paragraph source/evidence snapshot."""
from pathlib import Path
import hashlib
import json

HERE = Path(__file__).resolve().parent
ROOT = next(parent for parent in HERE.parents if (parent / 'pnpm-workspace.yaml').exists())

def read(path):
    return json.loads(path.read_text())

def check(record):
    path = ROOT / record['path']
    data = path.read_bytes()
    assert len(data) == record['bytes'], record['path']
    assert hashlib.sha256(data).hexdigest() == record['sha256'], record['path']

record = read(HERE / 'source-and-evidence.json')
for group in ['sourceFiles','historicalArtifacts','logs']:
    for item in record[group]:
        check(item)
matrix = read(HERE / 'candidate-matrix.json')
assert matrix['status'] == 'candidate-awaiting-final-integration'
assert matrix['finalSourceCommit'] is None and matrix['whole159Complete'] is False
assert matrix['currentBrowserRun']['status'] == 'not-run-by-this-agent'
original = {item['id']:item for item in read(ROOT / matrix['originalLedger'])['items']}
assert {item['id'] for item in matrix['items']} == {'W011','W012','W013','W016'}
for item in matrix['items']:
    assert item['originalAcceptance'] == original[item['id']]['acceptance']
    assert [x['criterion'] for x in item['commonAcceptance']] == original[item['id']]['commonAcceptance']
    assert item['status'] == 'candidate-awaiting-final-integration'
    assert all(x['status'] == 'focused-verified-awaiting-final-integration' for x in item['commonAcceptance'])
    assert item['pending']
    for evidence in item['originalAcceptanceEvidence'] + [e for c in item['commonAcceptance'] for e in c['currentEvidence']]:
        path = ROOT / evidence['path']
        assert path.is_file() and 1 <= evidence['line'] <= len(path.read_text().splitlines())
print(json.dumps({'status':'verified-current-snapshot-and-pending-matrix',
                  'sourceFiles':len(record['sourceFiles']),
                  'historicalArtifactHashes':len(record['historicalArtifacts']),
                  'logs':len(record['logs']),'candidateItems':len(matrix['items']),
                  'finalBrowserVerified':False},ensure_ascii=False))
