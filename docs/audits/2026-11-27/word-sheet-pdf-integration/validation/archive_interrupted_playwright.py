"""Retain the interrupted Playwright cache losslessly without duplicate blobs."""
from pathlib import Path
import hashlib
import gzip
import json
import os
import shutil
import zipfile

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / 'e2e-complete-rerun-output/.playwright-artifacts-0'
REPO = next(parent for parent in ROOT.parents if (parent / 'pnpm-workspace.yaml').is_file())
ARCHIVE = REPO / '.release/audit-backups/paused-267-transient-evidence.zip'
RECEIPT = ROOT / 'paused-267-transient-evidence.json'
BACKUP = REPO / '.release/audit-backups/paused-267-playwright-transient'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def identity(path):
    kind = 'symlink' if path.is_symlink() else 'file'
    data = os.fsencode(os.readlink(path)) if kind == 'symlink' else path.read_bytes()
    return data, {'kind': kind, 'bytes': len(data), 'sha256': digest(data)}


assert SOURCE.is_dir() and not BACKUP.exists()
assert not ARCHIVE.exists() and not RECEIPT.exists()
ARCHIVE.parent.mkdir(parents=True, exist_ok=True)
paths = sorted(path for path in SOURCE.rglob('*') if path.is_file() or path.is_symlink())
records = []
blobs = set()
with zipfile.ZipFile(ARCHIVE, 'x', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for path in paths:
        data, record = identity(path)
        record['path'] = path.relative_to(SOURCE).as_posix()
        record['blob'] = 'blobs/' + record['sha256']
        if record['blob'] not in blobs:
            archive.writestr(record['blob'], data)
            blobs.add(record['blob'])
        records.append(record)
    manifest = {'schemaVersion': 1, 'source': SOURCE.relative_to(REPO).as_posix(),
                'runStatus': 'interrupted-without-final-report', 'objects': records}
    archive.writestr('manifest.json', json.dumps(manifest, ensure_ascii=False, indent=2) + chr(10))
with zipfile.ZipFile(ARCHIVE) as archive:
    assert archive.testzip() is None
    assert json.loads(archive.read('manifest.json')) == manifest
    for name in blobs:
        assert digest(archive.read(name)) == name.removeprefix('blobs/')
    assert set(archive.namelist()) == blobs | {'manifest.json'}
    assert paths == sorted(path for path in SOURCE.rglob('*') if path.is_file() or path.is_symlink())
    for record in records:
        _, current = identity(SOURCE / record['path'])
        assert current == {key: record[key] for key in ['kind', 'bytes', 'sha256']}
        assert len(archive.read(record['blob'])) == record['bytes']
with zipfile.ZipFile(ARCHIVE) as archive:
    with (ROOT / 'paused-267-transient-manifest.json.gz').open('xb') as stream:
        with gzip.GzipFile(fileobj=stream, mode='wb', mtime=0, filename='') as compressed:
            compressed.write(archive.read('manifest.json'))
BACKUP.parent.mkdir(parents=True, exist_ok=True)
shutil.move(str(SOURCE), str(BACKUP))
receipt = {'schemaVersion': 1, 'status': 'all-original-bytes-verified-in-content-addressed-archive',
           'source': manifest['source'], 'retainedOriginals': BACKUP.relative_to(REPO).as_posix(),
           'archive': ARCHIVE.relative_to(REPO).as_posix(), 'archiveBytes': ARCHIVE.stat().st_size,
           'portableObjectInventory': 'paused-267-transient-manifest.json.gz',
           'archiveAvailability': 'Local ignored diagnostic cache; not portable acceptance evidence.',
           'archiveSha256': digest(ARCHIVE.read_bytes()), 'objects': len(records),
           'originalBytes': sum(record['bytes'] for record in records), 'uniqueBlobs': len(blobs),
           'runStatus': manifest['runStatus'],
           'recovery': 'Read manifest.json; each original relative path maps to its exact blobs/<sha256> member. Symlink members store link-target bytes, not external file contents.'}
with RECEIPT.open('x') as stream:
    stream.write(json.dumps(receipt, ensure_ascii=False, indent=2) + chr(10))
print(json.dumps(receipt, ensure_ascii=False, indent=2))
