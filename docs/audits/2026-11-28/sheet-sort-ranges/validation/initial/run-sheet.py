"""Freeze source and build bytes, preserve audits, then execute one whole-site run."""
from pathlib import Path
import datetime
import hashlib
import json
import os
import shutil
import subprocess
import sys

HERE = Path(__file__).resolve().parent
ROOT = next(p for p in HERE.parents if (p / 'pnpm-workspace.yaml').exists())
os.chdir(ROOT)
def identity(path):
    data = os.fsencode(os.readlink(path)) if path.is_symlink() else path.read_bytes()
    return {'kind': 'link' if path.is_symlink() else 'file',
            'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
def save(path, value):
    with path.open('x') as stream:
        json.dump(value, stream, ensure_ascii=False, indent=2)
        stream.write('\n')
def copy(source, destination):
    destination.parent.mkdir(parents=True, exist_ok=True)
    assert not destination.exists() and not destination.is_symlink(), destination
    shutil.copy2(source, destination, follow_symlinks=False)
    assert identity(source) == identity(destination)
def audit_files():
    root = ROOT / 'docs/audits'
    result = {}
    for folder, dirs, names in os.walk(root, followlinks=False):
        for name in list(dirs):
            path = Path(folder) / name
            if path.is_symlink():
                result[str(path.relative_to(root))] = path
                dirs.remove(name)
        for name in names:
            path = Path(folder) / name
            if path.is_file() or path.is_symlink():
                result[str(path.relative_to(root))] = path
    return result
def freeze():
    names = subprocess.check_output(['git', 'ls-files', '--cached', '--others', '--exclude-standard', '--',
        'packages/ui/src', 'docs/src', 'docs/tests', 'e2e', 'registry/registry.json',
        'docs/vite.config.ts', 'scripts', 'packages/ui/package.json'], text=True).splitlines()
    groups = {'source': [ROOT / name for name in sorted(set(names))],
              'uiDist': sorted(p for p in (ROOT / 'packages/ui/dist').rglob('*') if p.is_file()),
              'docsJs': sorted((ROOT / 'docs/dist').rglob('*.js'))}
    record = {group: [{ 'path': str(path.relative_to(ROOT)), **identity(path) } for path in paths]
              for group, paths in groups.items()}
    save(HERE / 'source-freeze.json', record)
    return record
def verify_frozen(record):
    for group in record.values():
        for item in group:
            assert identity(ROOT / item['path']) == {k: item[k] for k in ['kind', 'bytes', 'sha256']}, item['path']
if sys.argv[1:] == ['verify']:
    record = json.loads((HERE / 'source-freeze.json').read_text())
    verify_frozen(record)
    print(json.dumps({'verifiedGroups': {k: len(v) for k, v in record.items()}}))
    raise SystemExit(0)

assert not (HERE / 'full-status.json').exists()
gates = json.loads((HERE / 'gates.json').read_text())
assert len(gates) == 11 and all(r['exitCode'] == 0 for r in gates), 'Final gates incomplete'
frozen = freeze()
before = audit_files()
baseline = {name: identity(path) for name, path in sorted(before.items())}
for name, path in before.items():
    copy(path, HERE / 'historical-backup' / name)
save(HERE / 'historical-baseline.json', baseline)
for topic in ['sort-range-fix']:
    folder = ROOT / '.release/office-continuation' / topic / 'browser'
    if folder.exists():
        shutil.copytree(folder, HERE / 'focused-before-full' / topic)
status = {'status': 'running', 'startedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'port': 5300, 'workers': 1, 'retries': 0, 'sourceFreeze': 'source-freeze.json'}
(HERE / 'full-status.json').write_text(json.dumps(status, indent=2) + '\n')
environment = os.environ.copy()
environment.update(ZUVI_E2E_PORT='5300', PLAYWRIGHT_JSON_OUTPUT_FILE=str(HERE / 'full.json'))
command = ['pnpm', 'exec', 'playwright', 'test', '--config', 'e2e/playwright.config.ts',
           'e2e/office-studio-sheet', '--workers=1', '--retries=0', '--output=' + str(HERE / 'full-output'), '--reporter=list,json']
with (HERE / 'full.txt').open('x') as log:
    result = subprocess.run(command, env=environment, stdout=log, stderr=subprocess.STDOUT)
status.update(status='completed', exitCode=result.returncode,
              finishedAt=datetime.datetime.now(datetime.timezone.utc).isoformat())
if (HERE / 'full.json').exists():
    status['stats'] = json.loads((HERE / 'full.json').read_text())['stats']
(HERE / 'full-status.json').write_text(json.dumps(status, indent=2) + '\n')
retained = []
after = audit_files()
for name, path in sorted(after.items()):
    current = identity(path)
    if current == baseline.get(name):
        continue
    copy(path, HERE / 'regenerated' / name)
    retained.append({'path': name, 'before': baseline.get(name), 'after': current})
for name, path in sorted(after.items()):
    if name not in baseline or identity(path) != baseline[name]:
        path.unlink()
for name, expected in baseline.items():
    path = ROOT / 'docs/audits' / name
    if not path.exists() and not path.is_symlink():
        copy(HERE / 'historical-backup' / name, path)
    assert identity(path) == expected, name
save(HERE / 'restoration.json', {'verifiedHistoricalFiles': len(baseline), 'retained': retained})
verify_frozen(frozen)
print(json.dumps(status))
raise SystemExit(result.returncode)
