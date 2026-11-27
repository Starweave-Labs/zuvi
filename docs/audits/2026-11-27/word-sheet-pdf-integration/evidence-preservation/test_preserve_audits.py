"""Temporary-fixture checks; no real repository audits are snapshotted."""

from pathlib import Path
import gzip
import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch


SCRIPT = Path(__file__).with_name("preserve-audits.py")
SPEC = importlib.util.spec_from_file_location("zuvi_audit_preservation", SCRIPT)
PRESERVE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(PRESERVE)


class PreservationProtocolTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="zuvi-audit-protocol-")
        self.temp = Path(self.temporary.name)
        self.repo = self.temp / "repository"
        self.audits = self.repo / "docs/audits"
        self.audits.mkdir(parents=True)
        subprocess.run(["git", "init", "-q", str(self.repo)], check=True)
        (self.repo / ".gitignore").write_text("*.log\n")
        self.originals = {
            "2026-11-26/pdf-pages/original.pdf": b"%PDF synthetic\n\x00original-bytes\n",
            "2026-11-27/sheet-view/runner/run.log": b"first pass \t \n\n",
            "2026-11-27/word-basic-format/README.md": b"# Original trial  \n\n",
        }
        for relative, original in self.originals.items():
            self.write(relative, original)
        self.excluded_relative = "2026-11-27/word-sheet-pdf-integration/validation/native-active.txt"
        self.write(self.excluded_relative, b"root active log before\n")
        self.snapshot_dir = self.temp / "snapshot"
        self.integration = self.audits / str(PRESERVE.INTEGRATION)
        self.evidence = self.integration / "evidence-preservation"

    def tearDown(self):
        self.temporary.cleanup()

    def write(self, relative, data):
        path = self.audits / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        return path

    def snapshot(self):
        return PRESERVE.snapshot(self.repo, self.snapshot_dir, "synthetic-pre-e2e", [])

    def test_inventory_is_advisory_and_does_not_freeze_any_bytes(self):
        result = PRESERVE.inventory(self.repo, None)
        self.assertEqual(result["status"], "advisory-inventory-not-a-snapshot")
        self.assertEqual(result["ignoredTopicFiles"], 1)
        self.assertFalse(self.snapshot_dir.exists())
        self.assertFalse((self.evidence / "baseline-manifest.json").exists())

    def test_snapshot_retains_raw_whitespace_and_excludes_root_validation(self):
        result = self.snapshot()
        self.assertEqual(result["fileCount"], 3)
        self.assertEqual(result["ignoredFilesArchived"], 1)
        baseline = json.loads((self.evidence / "baseline-manifest.json").read_text())
        self.assertNotIn(self.excluded_relative, [entry["path"] for entry in baseline["files"]])
        for relative, original in self.originals.items():
            self.assertEqual((self.snapshot_dir / "files" / relative).read_bytes(), original)
        ignored = json.loads((self.evidence / "ignored-evidence-manifest.json").read_text())
        archive = self.evidence / ignored["files"][0]["path"]
        self.assertEqual(gzip.decompress(archive.read_bytes()), self.originals["2026-11-27/sheet-view/runner/run.log"])
        self.assertEqual(PRESERVE.verify(self.repo, self.snapshot_dir, False)["verifiedBaselineFiles"], 3)

    def test_changes_additions_and_missing_files_survive_archive_and_restore(self):
        self.snapshot()
        changed_pdf = self.write("2026-11-26/pdf-pages/original.pdf", b"new PDF bytes\n")
        self.write("2026-11-27/sheet-view/runner/run.log", b"second failure \t \n\n")
        (self.audits / "2026-11-27/word-basic-format/README.md").unlink()
        self.write("2026-11-27/word-basic-format/new.json", b'{"new":true}\n')
        self.write(self.excluded_relative, b"root active log after\n")
        result = PRESERVE.restore(self.repo, self.snapshot_dir, "synthetic-post-e2e")
        self.assertEqual((result["changedFiles"], result["addedFiles"], result["missingFilesRestored"]), (2, 1, 1))
        self.assertEqual(changed_pdf.read_bytes(), self.originals["2026-11-26/pdf-pages/original.pdf"])
        for relative, original in self.originals.items():
            self.assertEqual((self.audits / relative).read_bytes(), original)
        self.assertFalse((self.audits / "2026-11-27/word-basic-format/new.json").exists())
        self.assertEqual((self.audits / self.excluded_relative).read_bytes(), b"root active log after\n")
        manifest = json.loads((self.evidence / "restoration-manifest.json").read_text())
        self.assertEqual(len(manifest["regenerated"]), 3)
        retained = next(entry for entry in manifest["regenerated"] if entry["originalPath"].endswith("run.log"))
        self.assertEqual(retained["encoding"], "gzip")
        self.assertEqual(gzip.decompress((self.integration / retained["archivePath"]).read_bytes()), b"second failure \t \n\n")
        self.assertEqual(PRESERVE.verify(self.repo, None, False)["verifiedBaselineFiles"], 3)

    def test_corrupt_temporary_backup_stops_before_archive_or_live_restoration(self):
        self.snapshot()
        self.write("2026-11-26/pdf-pages/original.pdf", b"actual current artifact\n")
        (self.snapshot_dir / "files/2026-11-27/sheet-view/runner/run.log").write_bytes(b"damaged snapshot")
        with self.assertRaises(ValueError):
            PRESERVE.restore(self.repo, self.snapshot_dir, "synthetic-post-e2e")
        self.assertEqual((self.audits / "2026-11-26/pdf-pages/original.pdf").read_bytes(), b"actual current artifact\n")
        self.assertFalse((self.integration / "regenerated-history").exists())

    def test_snapshot_detects_new_artifact_writer_before_accepting_baseline(self):
        copy = PRESERVE.copy_verified
        def writer(source, destination, expected):
            copy(source, destination, expected)
            self.write("2026-11-27/word-basic-format/concurrent.json", b"concurrent\n")
        with patch.object(PRESERVE, "copy_verified", side_effect=writer):
            with self.assertRaises(ValueError):
                self.snapshot()
        self.assertFalse((self.evidence / "baseline-manifest.json").exists())

    def test_existing_snapshot_is_never_overwritten(self):
        self.snapshot_dir.mkdir()
        sentinel = self.snapshot_dir / "sentinel"
        sentinel.write_bytes(b"previous evidence")
        with self.assertRaises(FileExistsError):
            self.snapshot()
        self.assertEqual(sentinel.read_bytes(), b"previous evidence")
        self.assertFalse((self.evidence / "baseline-manifest.json").exists())

    def test_cli_cannot_snapshot_or_restore_without_cue(self):
        common = [sys.executable, "-B", str(SCRIPT), "--repo", str(self.repo)]
        result = subprocess.run(common + ["snapshot", "--snapshot-dir", str(self.snapshot_dir)], capture_output=True)
        self.assertEqual(result.returncode, 2)
        self.assertFalse(self.snapshot_dir.exists())
        self.snapshot()
        result = subprocess.run(common + ["restore", "--snapshot-dir", str(self.snapshot_dir)], capture_output=True)
        self.assertEqual(result.returncode, 2)
        self.assertFalse((self.integration / "regenerated-history").exists())

    def test_symlink_source_is_retained_without_following_external_bytes(self):
        external = self.temp / "external.txt"
        external.write_bytes(b"outside audits")
        link = self.audits / "external-link.txt"
        link.symlink_to(external)
        self.snapshot()
        baseline = json.loads((self.evidence / "baseline-manifest.json").read_text())
        entry = next(entry for entry in baseline["files"] if entry["path"] == "external-link.txt")
        self.assertEqual(entry["kind"], "symlink")
        self.assertEqual(entry["symlinkTarget"], str(external))
        self.assertEqual(entry["bytes"], len(str(external).encode()))
        self.assertTrue((self.snapshot_dir / "files/external-link.txt").is_symlink())
        external.write_bytes(b"outside cache can change without changing link object")
        PRESERVE.verify(self.repo, self.snapshot_dir, False)
        link.unlink()
        link.symlink_to("../another-outside-cache")
        PRESERVE.restore(self.repo, self.snapshot_dir, "synthetic-post-e2e")
        self.assertEqual(str(link.readlink()), str(external))
        self.assertEqual(external.read_bytes(), b"outside cache can change without changing link object")

    def test_directory_link_is_restored_after_generated_contents_are_retained(self):
        external = self.temp / "external-cache"
        external.mkdir()
        (external / "not-audit-evidence").write_bytes(b"external original")
        link = self.audits / "2026-11-27/pdf-native-annotations/font-cache"
        link.parent.mkdir(parents=True, exist_ok=True)
        link.symlink_to(external, target_is_directory=True)
        self.snapshot()
        baseline = json.loads((self.evidence / "baseline-manifest.json").read_text())
        entry = next(entry for entry in baseline["files"] if entry["path"].endswith("font-cache"))
        self.assertEqual(entry["evidenceClass"], "runtime-font-cache")
        self.assertFalse(any("not-audit-evidence" in entry["path"] for entry in baseline["files"]))
        link.unlink()
        self.write("2026-11-27/pdf-native-annotations/font-cache/new/trace.log", b"new generated cache state\n")
        result = PRESERVE.restore(self.repo, self.snapshot_dir, "synthetic-post-e2e")
        self.assertEqual(result["addedFiles"], 1)
        self.assertEqual(result["missingFilesRestored"], 1)
        self.assertTrue(link.is_symlink())
        self.assertEqual(str(link.readlink()), str(external))
        self.assertEqual((external / "not-audit-evidence").read_bytes(), b"external original")

    def test_checkout_can_verify_missing_ignored_original_from_committed_gzip(self):
        self.snapshot()
        PRESERVE.restore(self.repo, self.snapshot_dir, "synthetic-post-e2e")
        relative = "2026-11-27/sheet-view/runner/run.log"
        (self.audits / relative).unlink()
        result = PRESERVE.verify(self.repo, None, True)
        self.assertEqual(result["missingLiveIgnoredFilesVerifiedFromArchive"], [relative])
        with self.assertRaises(ValueError):
            PRESERVE.verify(self.repo, None, False)

    def test_regenerated_index_requires_complete_unmodified_archive(self):
        self.snapshot()
        self.write("2026-11-26/pdf-pages/original.pdf", b"regenerated current PDF\n")
        PRESERVE.restore(self.repo, self.snapshot_dir, "synthetic-post-e2e")
        path = self.integration / "regenerated-history/unindexed.txt"
        path.write_bytes(b"unindexed")
        with self.assertRaises(ValueError):
            PRESERVE.verify(self.repo, None, False)
        path.unlink()
        manifest = json.loads((self.evidence / "restoration-manifest.json").read_text())
        archive = self.integration / manifest["regenerated"][0]["archivePath"]
        archive.write_bytes(b"changed current archive")
        with self.assertRaises(ValueError):
            PRESERVE.verify(self.repo, None, False)
        self.assertEqual((self.audits / "2026-11-26/pdf-pages/original.pdf").read_bytes(), self.originals["2026-11-26/pdf-pages/original.pdf"])


if __name__ == "__main__":
    unittest.main()
