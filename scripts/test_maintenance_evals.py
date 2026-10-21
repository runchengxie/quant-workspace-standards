import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('fixture_builder', ROOT / 'scripts/prepare-maintenance-evals.py')
fixtures = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fixtures)


class FixtureTest(unittest.TestCase):
    def test_suite_is_isolated_reproducible_and_preserves_existing_output(self):
        with tempfile.TemporaryDirectory() as temp:
            output = fixtures.prepare(Path(temp) / 'suite')
            baseline = json.loads((output / 'baseline.json').read_text())
            requests = json.loads((output / 'requests.json').read_text())
            self.assertEqual(len(requests), 6)
            self.assertEqual(len(baseline['git_state']), 8)
            self.assertIn('refs/heads/task/delivered', baseline['git_state']['closeout']['refs'])
            self.assertEqual(len({row['id'] for row in requests}), 6)
            self.assertTrue((output / 'skill/references/evidence.md').is_file())
            self.assertIn('default count is 3', (output / 'docs-sync/README.md').read_text())
            self.assertIn('default=2', (output / 'docs-sync/app.py').read_text())
            self.assertTrue((output / 'docs-sync/scratch.txt').is_file())
            self.assertIn('locked', fixtures.git(output / 'closeout', 'worktree', 'list', '--porcelain'))
            self.assertEqual(fixtures.git(output / 'closeout', 'branch', '--list', 'task/delivered'), 'task/delivered')
            check = subprocess.run([sys.executable, '-B', '-m', 'unittest', 'discover'], cwd=output / 'no-change', capture_output=True, text=True)
            self.assertEqual(check.returncode, 0, check.stderr)
            for case in baseline['cases']:
                if case['id'] != 'consumer-adoption':
                    self.assertEqual(fixtures.git(output / case['id'], 'remote'), '')
            self.assertTrue((output / 'closeout-long-running/notes.txt').exists())
            before = fixtures.snapshot(output)
            with self.assertRaises(FileExistsError):
                fixtures.prepare(output)
            self.assertEqual(before, fixtures.snapshot(output))

    def test_preparation_rejects_source_tree_output_before_creating_it(self):
        output = ROOT / 'eval-fixtures-must-not-exist'
        self.assertFalse(output.exists())
        with self.assertRaises(ValueError):
            fixtures.prepare(output)
        self.assertFalse(output.exists())


if __name__ == '__main__':
    unittest.main()
