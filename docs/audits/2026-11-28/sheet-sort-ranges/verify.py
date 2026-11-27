"""Verify current Excel fix and the preceding whole-site record at its own commit."""
from pathlib import Path
import hashlib
import io
import json
import os
import subprocess
import tarfile

HERE=Path(__file__).resolve().parent
ROOT=next(p for p in HERE.parents if (p/'pnpm-workspace.yaml').exists())
OUT=ROOT/'docs/audits/2026-11-28/sheet-sort-ranges'
PREVIOUS=ROOT/'docs/audits/2026-11-28/duplicates-paragraph-outlines'
def read(path):
    return json.loads(path.read_text())
def ident(path):
    data=os.fsencode(os.readlink(path)) if path.is_symlink() else path.read_bytes()
    return {'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
def compare(path,record):
    assert ident(path)=={key:record[key] for key in ['bytes','sha256']},path
record=read(OUT/'verification.json')
assert record['status']=='passed' and record['X043Complete'] is False
assert record['wholeSiteRerunAfterPatch'] is False
source=record['sourceCommit']
scopes=['packages/ui/src','docs/src','docs/tests','e2e','registry/registry.json',
        'docs/vite.config.ts','scripts','packages/ui/package.json']
assert subprocess.check_output(['git','rev-parse',source],cwd=ROOT,text=True).strip()==source
assert not subprocess.check_output(['git','diff',source,'--',*scopes],cwd=ROOT)
frozen=read(OUT/'validation/source-freeze.json')
for group in frozen.values():
    for item in group:
        compare(ROOT/item['path'],item)
for item in record['nativeFiles']:
    compare(ROOT/item['path'],item)
gates=read(OUT/'validation/gates.json')
assert len(gates)==11 and all(item['exitCode']==0 for item in gates)
stats=read(OUT/'validation/full.json')['stats']
assert stats==record['browser'] and stats['expected']==16
assert all(stats[key]==0 for key in ['unexpected','skipped','flaky'])
assert '2941 passed (2941)' in (OUT/'validation/ui.txt').read_text()
for token in ['# pass 682','# fail 0','# skipped 0']:
    assert token in (OUT/'validation/docs.txt').read_text()
previous=read(PREVIOUS/'verification.json')
assert previous['sourceCommit']==record['previousWholeSite']['sourceCommit']
assert previous['browser']['expected']==319
assert all(previous['browser'][key]==0 for key in ['unexpected','skipped','flaky'])
archive=subprocess.check_output(['git','archive',previous['sourceCommit'],*scopes],cwd=ROOT)
with tarfile.open(fileobj=io.BytesIO(archive)) as package:
    for item in read(PREVIOUS/'validation/source-freeze.json')['source']:
        data=package.extractfile(item['path']).read()
        assert len(data)==item['bytes'] and hashlib.sha256(data).hexdigest()==item['sha256'],item['path']
for root in [PREVIOUS,OUT]:
    manifest=read(root/'artifact-manifest.json')
    actual={str(path.relative_to(root)) for path in root.rglob('*') if path.is_file() and path!=root/'artifact-manifest.json'}
    assert set(manifest)==actual
    for name,item in manifest.items():
        compare(root/name,item)
status=read(ROOT/'docs/office-studio-goal-status-2026-11-23.json')
assert not status['completionProven']
assert status['verifiedOriginalAcceptanceCount']==22 and status['remainingOriginalAcceptanceCount']==137
assert sum(item['status']=='verified-original-acceptance' for item in status['items'])==22
sorting=next(item for item in status['items'] if item['id']=='X043')
assert sorting['status']!='verified-original-acceptance' and sorting['currentAudit']['sourceCommit']==source
assert sorting['gaps']
print(json.dumps({'status':'passed','sourceCommit':source,'excelBrowser':16,'ui':2941,'docs':682,
                  'previousWholeSite':319,'verifiedRequirements':22,'remaining':137,
                  'X043Complete':False,'frozenGroups':{key:len(value) for key,value in frozen.items()}}))
