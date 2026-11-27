#!/usr/bin/env python3
"""Rebuild an exact accepted snapshot from verified restored live originals."""

from __future__ import annotations

import argparse
import importlib.util
import json
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cue", required=True)
    args = parser.parse_args()
    if not args.cue.strip():
        parser.error("--cue must name the explicit persistent-backup authorization")
    here = Path(__file__).resolve().parent
    spec = importlib.util.spec_from_file_location("preservation", here / "preserve-audits.py")
    if spec is None or spec.loader is None:
        raise ValueError("Cannot load preservation helpers")
    preservation = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(preservation)
    repo = preservation.repository(None)
    _, _, evidence = preservation.roots(repo)
    snapshot = repo / ".release/audit-backups/word-sheet-pdf-20261127"
    if snapshot.exists():
        raise ValueError("Persistent baseline already exists; do not overwrite it")
    receipt_path = evidence / "persistent-backup-receipt.json"
    if receipt_path.exists():
        raise ValueError("Persistent backup receipt already exists")
    before = preservation.verify(repo, None, False)
    baseline, baseline_path = preservation.load_baseline(repo, None)
    snapshot.mkdir(parents=True, exist_ok=False)
    for entry in baseline["files"]:
        preservation.copy_verified(repo / "docs/audits" / entry["path"],
                                   snapshot / "files" / entry["path"], entry)
    preservation.copy_verified(baseline_path, snapshot / "manifest.json",
                               preservation.metadata(baseline_path))
    verified = preservation.verify(repo, snapshot, False)
    if before != verified:
        raise ValueError("Persistent snapshot verification differs from the restored baseline")
    receipt = {
        "schemaVersion": 1,
        "status": "verified-persistent-copy-of-accepted-original-baseline",
        "createdAt": preservation.now(), "cue": args.cue,
        "snapshotPath": snapshot.relative_to(repo).as_posix(),
        "baselineManifest": preservation.metadata(baseline_path),
        "source": "Restored live originals, each matching the accepted original baseline; the missing temporary backup was not used.",
        "verification": verified,
        "note": "The original baseline and snapshot receipt remain unchanged. This persistent directory is ignored by Git and is only a local restore source.",
    }
    preservation.write_json(receipt_path, receipt)
    print(json.dumps(receipt, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
