#!/usr/bin/env python3
"""Restore the interrupted run using only byte-matching Git/archive sources.

The original temporary snapshot disappeared with the interrupted executor. This
recovery does not recreate that snapshot or claim it still exists. Every changed
live object is retained before restoration; all candidate original bytes must
match the accepted baseline before any original is replaced.
"""

from __future__ import annotations

import argparse
import gzip
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cue", required=True)
    args = parser.parse_args()
    if not args.cue.strip():
        parser.error("--cue must name the explicit recovery authorization")
    here = Path(__file__).resolve().parent
    spec = importlib.util.spec_from_file_location("preservation", here / "preserve-audits.py")
    if spec is None or spec.loader is None:
        raise ValueError("Cannot load the saved preservation helpers")
    preservation = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(preservation)
    repo = preservation.repository(None)
    audits, integration, evidence = preservation.roots(repo)
    baseline, baseline_path = preservation.load_baseline(repo, None)
    records = {entry["path"]: entry for entry in baseline["files"]}
    current = preservation.audit_files(audits, tuple(baseline["excludes"]))
    live = {relative: {"kind": preservation.path_kind(source),
                       **preservation.metadata(source)}
            for relative, source in current.items()}
    changed = sorted(relative for relative in live
                     if relative not in records
                     or live[relative] != preservation.source_identity(records[relative]))
    missing = sorted(set(records) - set(current))
    archive = integration / "regenerated-history/interrupted-316"
    receipt_path = evidence / "interrupted-316-recovery.json"
    if archive.exists() or receipt_path.exists():
        raise ValueError("Interrupted-run preservation already exists; do not overwrite it")
    ignored_manifest = json.loads((evidence / "ignored-evidence-manifest.json").read_text())
    if ignored_manifest["baselineManifest"] != preservation.metadata(baseline_path):
        raise ValueError("Ignored archives belong to a different baseline")
    preservation.verify_archive(repo, evidence, ignored_manifest)
    ignored = {entry["originalPath"].removeprefix("docs/audits/"): entry
               for entry in ignored_manifest["files"]}
    candidates = {}
    for relative in sorted(set(changed) | set(missing)):
        if relative not in records:
            continue
        entry = records[relative]
        result = subprocess.run(
            ["git", "show", "HEAD:docs/audits/" + relative], cwd=repo,
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False,
        )
        data = result.stdout
        origin = "git HEAD:docs/audits/" + relative
        if result.returncode != 0 or len(data) != entry["bytes"] or hashlib.sha256(data).hexdigest() != entry["sha256"]:
            original = ignored.get(relative)
            if original is None:
                raise ValueError(f"No exact original recovery source: {relative}")
            source = evidence / original["path"]
            data = gzip.decompress(source.read_bytes())
            origin = source.relative_to(repo).as_posix()
        if len(data) != entry["bytes"] or hashlib.sha256(data).hexdigest() != entry["sha256"]:
            raise ValueError(f"Recovery original does not match baseline: {relative}")
        candidates[relative] = (data, origin)
    archive.mkdir(parents=True, exist_ok=False)
    retained = []
    for relative in changed:
        source = current[relative]
        target = archive / "files" / relative
        preservation.copy_verified(source, target, live[relative])
        retained.append({
            "originalPath": "docs/audits/" + relative,
            "change": "changed" if relative in records else "added",
            "before": preservation.source_identity(records[relative]) if relative in records else None,
            "after": live[relative],
            "archivePath": target.relative_to(integration).as_posix(),
            "archive": preservation.metadata(target),
        })
    validation = integration / "validation/e2e-final.txt"
    validation_copy = archive / "validation/e2e-final.txt"
    validation_record = None
    if validation.is_file():
        metadata = preservation.metadata(validation)
        preservation.copy_verified(validation, validation_copy, metadata)
        validation_record = {
            "originalPath": validation.relative_to(repo).as_posix(),
            "archivePath": validation_copy.relative_to(integration).as_posix(),
            **metadata,
        }
    final_live = preservation.audit_files(audits, tuple(baseline["excludes"]))
    if set(final_live) != set(current):
        raise ValueError("Live file set changed during recovery; no original was restored")
    for relative, source in final_live.items():
        preservation.assert_metadata(source, live[relative])
    restored = []
    for relative in changed:
        if relative not in records:
            current[relative].unlink()
    for relative, (data, origin) in candidates.items():
        destination = audits / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        if destination.is_file() or destination.is_symlink():
            destination.unlink()
        entry = records[relative]
        if entry["kind"] == "symlink":
            destination.symlink_to(os.fsdecode(data))
        else:
            with destination.open("xb") as stream:
                stream.write(data)
        preservation.assert_metadata(destination, entry)
        restored.append({"originalPath": "docs/audits/" + relative,
                         "source": origin,
                         "verifiedBaselineIdentity": preservation.source_identity(entry)})
    verified = preservation.verify(repo, None, False)
    receipt = {
        "schemaVersion": 1,
        "status": "all-baseline-originals-restored-exactly-after-interrupted-run",
        "createdAt": preservation.now(), "cue": args.cue,
        "baselineManifest": preservation.metadata(baseline_path),
        "temporarySnapshotAvailable": False,
        "recoverySources": "Only Git HEAD or ignored-originals gzip with exact baseline SHA were accepted; unchanged live originals were independently rechecked.",
        "unchangedBaselineObjects": len(records) - len(candidates),
        "changedBaselineObjectsRestored": sum(relative in records for relative in changed),
        "missingBaselineObjectsRestored": len(missing),
        "newObjectsArchived": sum(relative not in records for relative in changed),
        "unrecoverableBaselineObjects": [],
        "restored": restored, "regenerated": retained,
        "interruptedRunLog": validation_record,
        "runnerOutputLimitation": "The interrupted process handle, temporary JSON report, traces and full temporary snapshot were unavailable at recovery time. No final suite result is claimed.",
        "verification": verified,
    }
    preservation.write_json(receipt_path, receipt)
    print(json.dumps({"receipt": receipt_path.relative_to(repo).as_posix(),
                      "unchanged": receipt["unchangedBaselineObjects"],
                      "restored": len(restored), "addedArchived": receipt["newObjectsArchived"],
                      "verification": verified}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
