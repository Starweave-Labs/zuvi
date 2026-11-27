"""Named-run preservation checks use only a temporary synthetic repository."""

import importlib.util
from pathlib import Path
import json
import subprocess
import tempfile
import unittest
from unittest.mock import patch


HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("named_audit_run", HERE / "restore-audit-run.py")
RUN = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(RUN)


class NamedRunTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="zuvi-named-audit-")
        self.root = Path(self.temp.name)
        self.repo = self.root / "repo"
        self.audits = self.repo / "docs/audits"
        self.audits.mkdir(parents=True)
        subprocess.run(["git", "init", "-q", str(self.repo)], check=True)
        (self.repo / ".gitignore").write_text("*.log\n")
        self.original = self.write("historical/source.pdf", b"original PDF\n")
        self.log = self.write("historical/pass.log", b"first pass \t \n\n")
        self.helpers = RUN.load_helpers()
        self.snapshot = self.root / "snapshot"
        self.helpers.snapshot(self.repo, self.snapshot, "test-pre-run", [])
        self.repo_patch = patch.object(self.helpers, "repository", return_value=self.repo)
        self.repo_patch.start()
        self.integration = self.audits / str(self.helpers.INTEGRATION)
        self.evidence = self.integration / "evidence-preservation"

    def tearDown(self):
        self.repo_patch.stop()
        self.temp.cleanup()

    def write(self, relative, data):
        target = self.audits / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        return target

    def restore(self, name):
        return RUN.restore_run(self.helpers, name, self.snapshot, "test-post-run")

    def test_two_runs_keep_independent_archives_and_restore_same_baseline(self):
        self.original.write_bytes(b"run one PDF\n")
        self.log.write_bytes(b"run one failure \t \n\n")
        self.write("historical/new-one.json", b'{"run":1}\n')
        first = self.restore("run-one")
        self.assertEqual(first["archivedChangedFiles"], 2)
        self.assertEqual(first["archivedAddedFiles"], 1)
        before = {p: p.read_bytes() for p in (self.integration / "regenerated-history/run-one").rglob("*") if p.is_file()}
        receipt = (self.evidence / "run-one-restoration.json").read_bytes()
        self.original.write_bytes(b"run two PDF\n")
        self.log.unlink()
        second = self.restore("run-two")
        self.assertEqual(second["archivedChangedFiles"], 1)
        self.assertEqual(second["missingFilesRestored"], 1)
        self.assertEqual(self.original.read_bytes(), b"original PDF\n")
        self.assertEqual(self.log.read_bytes(), b"first pass \t \n\n")
        self.assertEqual((self.evidence / "run-one-restoration.json").read_bytes(), receipt)
        for path, data in before.items():
            self.assertEqual(path.read_bytes(), data)
        RUN.verify_run(self.helpers, "run-one", self.snapshot)
        RUN.verify_run(self.helpers, "run-two", self.snapshot)
        with self.assertRaises(ValueError):
            self.restore("run-one")

    def test_corrupt_backup_or_invalid_label_cannot_touch_live_bytes(self):
        self.original.write_bytes(b"current PDF\n")
        (self.snapshot / "files/historical/source.pdf").write_bytes(b"damaged original")
        with self.assertRaises(ValueError):
            self.restore("run-corrupt")
        self.assertEqual(self.original.read_bytes(), b"current PDF\n")
        self.assertFalse((self.integration / "regenerated-history/run-corrupt").exists())
        with self.assertRaises(ValueError):
            self.restore("../escape")

    def test_unindexed_or_corrupt_archive_is_detected(self):
        self.original.write_bytes(b"regenerated PDF\n")
        self.restore("run-one")
        archive = self.integration / "regenerated-history/run-one"
        extra = archive / "extra"
        extra.write_bytes(b"unindexed")
        with self.assertRaises(ValueError):
            RUN.verify_run(self.helpers, "run-one", None)
        extra.unlink()
        manifest = json.loads((self.evidence / "run-one-restoration.json").read_text())
        target = self.integration / manifest["regenerated"][0]["archivePath"]
        target.write_bytes(b"corrupt archive")
        with self.assertRaises(ValueError):
            RUN.verify_run(self.helpers, "run-one", None)

    def test_links_are_archived_as_link_objects_without_following_targets(self):
        external = self.root / "external"
        external.write_bytes(b"outside file")
        self.original.unlink()
        self.original.symlink_to(external)
        self.restore("run-link")
        self.assertEqual(external.read_bytes(), b"outside file")
        self.assertFalse(self.original.is_symlink())
        RUN.verify_run(self.helpers, "run-link", self.snapshot)


if __name__ == "__main__":
    unittest.main(verbosity=2)
