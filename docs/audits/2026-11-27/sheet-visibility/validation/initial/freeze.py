"""Record and verify source/build bytes for this integration run."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys

HERE = Path(__file__).resolve().parent
ROOT = next(p for p in HERE.parents if (p / 'pnpm-workspace.yaml').is_file())
TARGET = HERE / 'source-freeze.json'

def identity(path):
    data = path.read_bytes()
    return {'path': path.relative_to(ROOT).as_posix(), 'bytes': len(data),
            'sha256': hashlib.sha256(data).hexdigest()}

if sys.argv[1:] == ['snapshot']:
    names = subprocess.check_output([
        'git', 'ls-files', '--cached', '--others', '--exclude-standard', '--',
        'packages/ui/src', 'docs/src', 'docs/tests', 'e2e', 'registry/registry.json',
        'docs/vite.config.ts', 'scripts', 'packages/ui/package.json'
    ], cwd=ROOT, text=True).splitlines()
    groups = {
        'source': [ROOT / name for name in sorted(set(names))],
        'uiDist': sorted(p for p in (ROOT / 'packages/ui/dist').rglob('*') if p.is_file()),
        'docsJs': sorted((ROOT / 'docs/dist').rglob('*.js'))
    }
    records = {key: [identity(p) for p in paths] for key, paths in groups.items()}
    with TARGET.open('x') as stream:
        json.dump(records, stream, indent=2)
        stream.write(chr(10))
else:
    records = json.loads(TARGET.read_text())
    for group in records.values():
        for record in group:
            assert identity(ROOT / record['path']) == record, record['path']
print(json.dumps({'verified': {key: len(group) for key, group in records.items()}}))
