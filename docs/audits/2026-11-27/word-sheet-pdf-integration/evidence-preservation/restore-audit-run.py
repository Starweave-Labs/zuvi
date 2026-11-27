#!/usr/bin/env python3
"""Archive one named browser run and restore the immutable accepted baseline.

Unlike the original one-run protocol, each explicitly cued run owns a separate
archive and receipt. Existing run archives, receipts, the accepted baseline and
snapshot receipts are never replaced. No live restore occurs during preparation.
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import os
from pathlib import Path
import re


def load_helpers():
    here = Path(__file__).resolve().parent
    spec = importlib.util.spec_from_file_location("preservation", here / "preserve-audits.py")
    if spec is None or spec.loader is None:
        raise ValueError("Cannot load preservation helpers")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def run_identity(preservation, run_label: str):
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", run_label):
        raise ValueError("Use a lowercase alphanumeric run label with optional hyphens")
    repo = preservation.repository(None)
    audits, integration, evidence = preservation.roots(repo)
    archive = integration / "regenerated-history" / run_label
    receipt = evidence / (run_label + "-restoration.json")
    return repo, audits, integration, evidence, archive, receipt


def verify_run(preservation, run_label: str, snapshot_dir: Path | None):
    repo, audits, integration, _, archive, receipt_path = run_identity(preservation, run_label)
    baseline, baseline_path = preservation.load_baseline(repo, snapshot_dir)
    records = {entry["path"]: entry for entry in baseline["files"]}
    receipt = json.loads(receipt_path.read_text())
    if (receipt["runLabel"] != run_label
            or receipt["status"] != "restored-baseline-with-run-bytes-retained"
            or receipt["baselineManifest"] != preservation.metadata(baseline_path)):
        raise ValueError("Run receipt does not identify this accepted baseline")
    baseline_verification = preservation.verify(repo, snapshot_dir, False)
    actual_archives = preservation.audit_files(archive, ())
    indexed_archives = set()
    originals = set()
    changed = added = 0
    for entry in receipt["regenerated"]:
        original = entry["originalPath"].removeprefix("docs/audits/")
        preservation.safe_relative(original)
        archived = preservation.safe_relative(entry["archivePath"])
        expected_prefix = archive.relative_to(integration).as_posix() + "/"
        if not str(archived).startswith(expected_prefix):
            raise ValueError("Archived object is outside its named run")
        archive_relative = str(archived).removeprefix(expected_prefix)
        if original in originals or archive_relative in indexed_archives:
            raise ValueError("Duplicate original or archive identity")
        originals.add(original)
        indexed_archives.add(archive_relative)
        if original in records and entry["change"] == "changed":
            if entry["before"] != preservation.source_identity(records[original]):
                raise ValueError("Changed object's original identity differs from baseline")
            changed += 1
        elif original not in records and entry["change"] == "added" and entry["before"] is None:
            added += 1
        else:
            raise ValueError("Invalid changed/added original identity")
        target = integration / str(archived)
        preservation.assert_metadata(target, entry["archive"])
        if entry["encoding"] == "gzip":
            if preservation.gzip_original(target) != preservation.byte_identity(entry["after"]):
                raise ValueError("Archived gzip does not retain the generated original bytes")
        elif (entry["encoding"] != "original-bytes"
              or preservation.path_kind(target) != entry["after"]["kind"]
              or preservation.metadata(target) != preservation.byte_identity(entry["after"])):
            raise ValueError("Archived generated object differs from original bytes")
    if indexed_archives != set(actual_archives):
        raise ValueError("Run archive and receipt are not one-to-one")
    missing = set()
    for entry in receipt["missingFilesRestored"]:
        original = entry["originalPath"].removeprefix("docs/audits/")
        if (original in missing or original in originals or original not in records
                or entry["before"] != preservation.source_identity(records[original])):
            raise ValueError("Invalid missing-original restore identity")
        missing.add(original)
    if (changed != receipt["changedFiles"] or added != receipt["addedFiles"]
            or receipt["restoredBaselineFiles"] != len(records)
            or receipt["restoredBaselineBytes"] != baseline["bytes"]
            or receipt["unchangedFiles"] + changed + len(missing) != len(records)):
        raise ValueError("Run receipt counts differ from verified object records")
    return {**baseline_verification, "runLabel": run_label,
            "archivedChangedFiles": changed, "archivedAddedFiles": added,
            "missingFilesRestored": len(missing)}


def restore_run(preservation, run_label: str, snapshot_dir: Path, cue: str):
    repo, audits, integration, _, archive, receipt_path = run_identity(preservation, run_label)
    baseline, baseline_path = preservation.load_baseline(repo, snapshot_dir)
    if archive.exists() or receipt_path.exists():
        raise ValueError("This run already has retained evidence; do not overwrite it")
    records = {entry["path"]: entry for entry in baseline["files"]}
    current = preservation.audit_files(audits, tuple(baseline["excludes"]))
    live = {relative: {"kind": preservation.path_kind(source),
                       **preservation.metadata(source)}
            for relative, source in current.items()}
    changed = sorted(relative for relative in live
                     if relative not in records
                     or live[relative] != preservation.source_identity(records[relative]))
    missing = sorted(set(records) - set(current))
    ignored = preservation.ignored_paths(repo, list(current.values()))
    archive.mkdir(parents=True, exist_ok=False)
    retained = []
    for relative in changed:
        source = current[relative]
        compress = (source.is_symlink()
                    or source.suffix.lower() in preservation.TEXT_ARCHIVE_SUFFIXES
                    or source.relative_to(repo).as_posix() in ignored)
        if compress:
            target = archive / "gzip" / (relative + ".gz")
            archived = preservation.archive_gzip(source, target, live[relative])
        else:
            target = archive / "files" / relative
            preservation.copy_verified(source, target, live[relative])
            archived = preservation.metadata(target)
        retained.append({
            "originalPath": "docs/audits/" + relative,
            "change": "changed" if relative in records else "added",
            "before": preservation.source_identity(records[relative]) if relative in records else None,
            "after": live[relative],
            "archivePath": target.relative_to(integration).as_posix(),
            "encoding": "gzip" if compress else "original-bytes",
            "archive": archived,
        })
    pre_restore = preservation.audit_files(audits, tuple(baseline["excludes"]))
    if set(pre_restore) != set(current):
        raise ValueError("Live object set changed while archiving; no original was restored")
    for relative, source in pre_restore.items():
        preservation.assert_metadata(source, live[relative])
    # Every snapshot and generated object has been verified before any live
    # object is removed. New objects remain retained in the named run archive.
    for relative in changed:
        if relative not in records:
            current[relative].unlink()
    for relative in sorted((set(changed) | set(missing)) & set(records)):
        destination = audits / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        if destination.is_file() or destination.is_symlink():
            destination.unlink()
        elif destination.is_dir():
            for directory, subdirs, files in os.walk(destination, topdown=False, followlinks=False):
                if files or any((Path(directory) / name).is_symlink() for name in subdirs):
                    raise ValueError("Unarchived content prevents directory-link restoration")
                Path(directory).rmdir()
        preservation.copy_verified(snapshot_dir / "files" / relative, destination, records[relative])
    receipt = {
        "schemaVersion": 1,
        "status": "restored-baseline-with-run-bytes-retained",
        "createdAt": preservation.now(), "cue": cue, "runLabel": run_label,
        "baselineManifest": preservation.metadata(baseline_path),
        "snapshotPath": str(snapshot_dir),
        "restoredBaselineFiles": len(records),
        "restoredBaselineBytes": baseline["bytes"],
        "unchangedFiles": len(records) - sum(entry["change"] == "changed" for entry in retained) - len(missing),
        "changedFiles": sum(entry["change"] == "changed" for entry in retained),
        "addedFiles": sum(entry["change"] == "added" for entry in retained),
        "missingFilesRestored": [{"originalPath": "docs/audits/" + relative,
                                  "before": preservation.source_identity(records[relative])}
                                 for relative in missing],
        "regenerated": retained,
        "otherRunArchivesUntouched": True,
    }
    preservation.write_json(receipt_path, receipt)
    return verify_run(preservation, run_label, snapshot_dir)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, help=argparse.SUPPRESS)
    commands = parser.add_subparsers(dest="command", required=True)
    restore = commands.add_parser("restore")
    restore.add_argument("--run-label", required=True)
    restore.add_argument("--snapshot-dir", type=Path, required=True)
    restore.add_argument("--cue", required=True)
    verify = commands.add_parser("verify")
    verify.add_argument("--run-label", required=True)
    verify.add_argument("--snapshot-dir", type=Path)
    args = parser.parse_args()
    preservation = load_helpers()
    if args.repo:
        explicit = args.repo.resolve()
        preservation.repository = lambda _=None: explicit
    if args.command == "restore":
        if not args.cue.strip():
            parser.error("--cue must name the explicit post-run restoration authorization")
        result = restore_run(preservation, args.run_label, args.snapshot_dir.resolve(), args.cue)
    else:
        result = verify_run(preservation, args.run_label, args.snapshot_dir.resolve() if args.snapshot_dir else None)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
