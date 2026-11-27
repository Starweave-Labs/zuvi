"""Run a second frozen integration without overwriting historical evidence."""
from pathlib import Path
import datetime
import hashlib
import json
import os
import shutil
import subprocess

HERE = Path(__file__).resolve().parent
ROOT = next(p for p in HERE.parents if (p / 'pnpm-workspace.yaml').exists())
os.chdir(ROOT)

def identity(data):
    return {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}

def save(path, value):
    with path.open('x') as stream:
        json.dump(value, stream, ensure_ascii=False, indent=2)
        stream.write('\n')

def archive(path, destination):
    destination.parent.mkdir(parents=True, exist_ok=True)
    assert not destination.exists()
    shutil.copy2(path, destination)
    assert identity(path.read_bytes()) == identity(destination.read_bytes())

assert not (HERE / 'full-status.json').exists()
subprocess.run(['python3', '-B', str(HERE.parent / 'freeze.py'), 'verify'], check=True)
# The interrupted chat left first-run generated files at historical tracked paths.
# Retain those exact bytes before restoring the committed historical originals.
changed = subprocess.check_output(['git', 'diff', '--name-only', '-z', '--', 'docs/audits'], text=True).split('\0')
restored = []
for name in filter(None, changed):
    path = ROOT / name
    before = subprocess.check_output(['git', 'show', 'HEAD:' + name])
    generated = path.read_bytes()
    assert path.is_file() and not path.is_symlink()
    archive(path, HERE / 'first-run-generated' / name)
    path.write_bytes(before)
    restored.append({'path': name, 'historical': identity(before), 'generated': identity(generated)})
save(HERE / 'first-run-restoration.json', restored)
audits = ROOT / 'docs/audits'
baseline = {}
for path in sorted(audits.rglob('*')):
    if path.is_symlink() or not path.is_file():
        continue
    name = str(path.relative_to(audits))
    baseline[name] = identity(path.read_bytes())
    archive(path, HERE / 'historical-backup' / name)
save(HERE / 'historical-baseline.json', baseline)
browser = ROOT / '.release/office-continuation/x030/browser'
shutil.copytree(browser, HERE / 'first-run-browser')
status = {'startedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'status': 'running', 'sourceFreeze': '../source-freeze.json', 'workers': 1, 'retries': 0, 'port': 5292}
(HERE / 'full-status.json').write_text(json.dumps(status, indent=2) + '\n')
env = os.environ.copy()
env.update(ZUVI_E2E_PORT='5292', PLAYWRIGHT_JSON_OUTPUT_FILE=str(HERE / 'full.json'))
with (HERE / 'full.txt').open('x') as log:
    result = subprocess.run(['pnpm', 'exec', 'playwright', 'test', '--config', 'e2e/playwright.config.ts',
                             '--workers=1', '--retries=0', '--output=' + str(HERE / 'full-output'),
                             '--reporter=list,json'], env=env, stdout=log, stderr=subprocess.STDOUT)
status.update(status='completed', exitCode=result.returncode,
              finishedAt=datetime.datetime.now(datetime.timezone.utc).isoformat())
if (HERE / 'full.json').exists():
    status['stats'] = json.loads((HERE / 'full.json').read_text())['stats']
(HERE / 'full-status.json').write_text(json.dumps(status, indent=2) + '\n')
retained = []
for path in sorted(audits.rglob('*')):
    if path.is_symlink() or not path.is_file():
        continue
    name = str(path.relative_to(audits))
    current = identity(path.read_bytes())
    if current == baseline.get(name):
        continue
    archive(path, HERE / 'regenerated' / name)
    retained.append({'path': name, 'before': baseline.get(name), 'after': current})
    if name in baseline:
        shutil.copy2(HERE / 'historical-backup' / name, path)
    else:
        path.unlink()
for name, expected in baseline.items():
    path = audits / name
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(HERE / 'historical-backup' / name, path)
    assert identity(path.read_bytes()) == expected, name
save(HERE / 'full-restoration.json', {'historicalFilesVerified': len(baseline), 'retained': retained})
subprocess.run(['python3', '-B', str(HERE.parent / 'freeze.py'), 'verify'], check=True)
print(json.dumps(status))
raise SystemExit(result.returncode)
