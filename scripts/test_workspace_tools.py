import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


def git(repo, *args):
    return subprocess.check_output(['git', '-C', str(repo), *args], text=True).strip()


class ToolsTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.repo = self.root / 'repo'
        self.repo.mkdir()
        git(self.repo, 'init', '-b', 'main')
        git(self.repo, 'config', 'user.name', 'Fixture')
        git(self.repo, 'config', 'user.email', 'fixture@example.invalid')
        (self.repo / 'tracked').write_text('baseline\n')
        git(self.repo, 'add', '.')
        git(self.repo, 'commit', '-m', 'baseline')
        git(self.repo, 'remote', 'add', 'origin', 'https://github.com/example/project.git')
        git(self.repo, 'update-ref', 'refs/remotes/origin/main', 'HEAD')
        git(self.repo, 'switch', '-c', 'task/example')

    def run_tool(self, tool, *args):
        proc = subprocess.run([sys.executable, '-B', str(ROOT / 'scripts' / tool), *map(str, args)], text=True, capture_output=True)
        self.assertNotIn('Traceback', proc.stderr)
        return proc, json.loads(proc.stdout)

    def push(self):
        return self.run_tool('repo-preflight.py', 'push', '--repo', self.repo, '--remote', 'origin', '--target', 'main', '--expected-repository', 'example/project')

    def test_push_reads_explicit_destination_and_outgoing_commits_without_mutation(self):
        (self.repo / 'tracked').write_text('task\n')
        git(self.repo, 'commit', '-am', 'task change')
        before = git(self.repo, 'status', '--porcelain=v1')
        proc, result = self.push()
        self.assertEqual(proc.returncode, 0)
        self.assertEqual(result['repository'], 'example/project')
        self.assertEqual(len(result['outgoing_commits']), 1)
        self.assertEqual(result['authorization'], 'not_verified')
        self.assertEqual(before, git(self.repo, 'status', '--porcelain=v1'))

    def test_push_override_and_multiple_urls_are_not_mistaken_for_fetch_destination(self):
        git(self.repo, 'config', '--add', 'remote.origin.pushurl', 'https://github.com/other/project.git')
        git(self.repo, 'config', '--add', 'remote.origin.pushurl', 'git@github.com:example/project.git')
        proc, result = self.push()
        self.assertEqual(proc.returncode, 1)
        self.assertIn('destination_mismatch', result['blockers'])
        self.assertEqual(len(result['push_destinations']), 2)

    def test_remote_credentials_are_not_printed(self):
        git(self.repo, 'config', 'remote.origin.pushurl', 'https://secret-user:secret-token@github.com/example/project.git?token=secret-query')
        proc, result = self.push()
        self.assertNotIn('secret-', proc.stdout + proc.stderr)
        self.assertEqual(proc.returncode, 1)
        self.assertIn('credential_bearing_url', result['blockers'])

    def test_main_detached_missing_target_and_custom_push_config_block(self):
        git(self.repo, 'switch', 'main')
        self.assertIn('protected_source_branch', self.push()[1]['blockers'])
        git(self.repo, 'checkout', '--detach')
        self.assertIn('detached_head', self.push()[1]['blockers'])
        git(self.repo, 'switch', 'task/example')
        git(self.repo, 'update-ref', '-d', 'refs/remotes/origin/main')
        self.assertEqual(self.push()[0].returncode, 1)
        git(self.repo, 'update-ref', 'refs/remotes/origin/main', 'HEAD')
        git(self.repo, 'config', 'remote.origin.push', 'HEAD:main')
        self.assertIn('custom_push_refspec', self.push()[1]['blockers'])

    def test_cleanup_retains_dirty_locked_and_unique_work(self):
        candidate = self.root / 'candidate'
        git(self.repo, 'worktree', 'add', '-b', 'task/candidate', str(candidate), 'main')
        git(self.repo, 'worktree', 'lock', '--reason', 'nightly research', str(candidate))
        (candidate / 'private-notes').write_text('keep\n')
        (candidate / 'tracked').write_text('unique\n')
        git(candidate, 'commit', '-am', 'unique work')
        before = git(candidate, 'status', '--porcelain=v1')
        proc, result = self.run_tool('repo-preflight.py', 'cleanup', '--repo', self.repo, '--candidate', candidate, '--base', 'main')
        self.assertEqual(proc.returncode, 1)
        self.assertEqual(result['decision'], 'retain')
        for reason in ['dirty_worktree', 'locked_worktree', 'unique_commits', 'ownership_unknown', 'merge_state_unknown', 'runtime_dependencies_unknown']:
            self.assertIn(reason, result['blockers'])
        self.assertEqual(before, git(candidate, 'status', '--porcelain=v1'))
        self.assertTrue(candidate.exists())

    def test_clean_candidate_is_still_not_authorized_for_deletion(self):
        candidate = self.root / 'candidate'
        git(self.repo, 'worktree', 'add', '-b', 'task/candidate', str(candidate), 'main')
        proc, result = self.run_tool('repo-preflight.py', 'cleanup', '--repo', self.repo, '--candidate', candidate, '--base', 'main')
        self.assertEqual(proc.returncode, 1)
        self.assertEqual(result['decision'], 'retain')
        self.assertEqual(result['unique_commits'], [])
        self.assertIn('ownership_unknown', result['blockers'])

    def test_cleanup_cannot_treat_an_unregistered_directory_as_a_worktree(self):
        folder = self.root / 'unregistered'; folder.mkdir()
        proc, result = self.run_tool('repo-preflight.py', 'cleanup', '--repo', self.repo, '--candidate', folder, '--base', 'main')
        self.assertEqual(proc.returncode, 1)
        self.assertIn('unregistered_worktree', result['blockers'])

    def test_sync_separates_private_sections_and_changed_shared_rules_without_overwrite(self):
        canonical = self.root / 'canonical.md'; local = self.root / 'local.md'
        canonical.write_text('# Standard\n\n## Rules\n\n- Keep work.\n- Run checks.\n')
        private = '# Local\n\nMachine path: private-machine-value\n\n## Rules\n\n- Keep work.\n\n## Private settings\n\nsecret-local-value\n'
        local.write_text(private)
        proc, result = self.run_tool('check-workspace-sync.py', '--canonical', canonical, '--local', local)
        self.assertEqual(proc.returncode, 1)
        self.assertEqual(result['sections'][0]['status'], 'changed')
        self.assertEqual(result['sections'][0]['missing_rules'], ['- Run checks.'])
        self.assertEqual(result['local_only_sections'], ['Private settings'])
        self.assertNotIn('private-machine-value', proc.stdout)
        self.assertNotIn('secret-local-value', proc.stdout)
        self.assertEqual(local.read_text(), private)

    def test_sync_ignores_rule_order_and_distinguishes_local_rule_additions(self):
        canonical = self.root / 'canonical.md'; local = self.root / 'local.md'
        canonical.write_text('# Standard\n\n## Rules\n\n- Keep work.\n- Run checks.\n')
        local.write_text('# Local\n\n## Rules\n\n- Run checks.\n- Keep work.\n- machine-specific-secret\n')
        proc, result = self.run_tool('check-workspace-sync.py', '--canonical', canonical, '--local', local)
        self.assertEqual(proc.returncode, 0)
        self.assertEqual(result['sections'][0]['status'], 'aligned_with_local_additions')
        self.assertEqual(result['sections'][0]['local_addition_count'], 1)
        self.assertNotIn('machine-specific-secret', proc.stdout)

    def test_sync_detects_missing_intro_and_duplicate_sections(self):
        canonical = self.root / 'canonical.md'; local = self.root / 'local.md'
        canonical.write_text('# Standard\n\nRead repository instructions first.\n\n## Rules\n\n- Keep work.\n')
        local.write_text('# Local\n\n## Rules\n\n- Keep work.\n')
        proc, result = self.run_tool('check-workspace-sync.py', '--canonical', canonical, '--local', local)
        self.assertEqual(proc.returncode, 1)
        self.assertEqual(result['sections'][0]['heading'], '__preamble__')
        local.write_text('# Local\n\n## Rules\n\n- Keep work.\n\n## Rules\n\n- Extra.\n')
        self.assertEqual(self.run_tool('check-workspace-sync.py', '--canonical', canonical, '--local', local)[0].returncode, 2)

    def test_divergent_push_branch_blocks_without_changing_refs(self):
        base = git(self.repo, 'rev-parse', 'HEAD')
        git(self.repo, 'switch', '-c', 'remote-only')
        (self.repo / 'remote-file').write_text('remote work\n')
        git(self.repo, 'add', '.'); git(self.repo, 'commit', '-m', 'remote-only work')
        git(self.repo, 'update-ref', 'refs/remotes/origin/task/example', 'HEAD')
        git(self.repo, 'switch', 'task/example')
        before = git(self.repo, 'show-ref')
        proc, result = self.push()
        self.assertEqual(proc.returncode, 1)
        self.assertIn('push_not_fast_forward', result['blockers'])
        self.assertEqual(git(self.repo, 'show-ref'), before)

    def test_fetch_upstream_push_fork_does_not_attribute_upstream_refs_to_fork(self):
        git(self.repo, 'remote', 'set-url', 'origin', 'https://github.com/upstream/project.git')
        git(self.repo, 'config', 'remote.origin.pushurl', 'https://github.com/example/project.git')
        git(self.repo, 'update-ref', 'refs/remotes/origin/task/example', 'HEAD')
        proc, result = self.push()
        self.assertEqual(proc.returncode, 1)
        self.assertIn('tracking_destination_mismatch', result['blockers'])
        self.assertIsNone(result['outgoing_commits'])
        self.assertIsNone(result['target_revision'])

    def test_url_rewrites_and_mirror_configuration_are_inspected(self):
        git(self.repo, 'config', 'url.https://github.com/other/.pushInsteadOf', 'https://github.com/example/')
        self.assertIn('destination_mismatch', self.push()[1]['blockers'])
        git(self.repo, 'config', '--unset-all', 'url.https://github.com/other/.pushInsteadOf')
        git(self.repo, 'config', 'remote.origin.mirror', 'true')
        self.assertIn('mirror_push_configuration', self.push()[1]['blockers'])

    def test_sync_fenced_heading_does_not_create_fake_sections(self):
        content = '# Standard\n\n## Rules\n\n```md\n## Example heading\n```\n\n- Keep work.\n'
        canonical = self.root / 'canonical.md'; local = self.root / 'local.md'
        canonical.write_text(content); local.write_text(content.replace('\n','\r\n'))
        proc, result = self.run_tool('check-workspace-sync.py', '--canonical', canonical, '--local', local)
        self.assertEqual(proc.returncode, 0)
        self.assertEqual(len(result['sections']), 1)

    def test_missing_input_returns_structured_unknown(self):
        proc, result = self.run_tool('check-workspace-sync.py', '--canonical', ROOT / 'AGENTS.md', '--local', self.root / 'missing')
        self.assertEqual(proc.returncode, 2)
        self.assertEqual(result['status'], 'unavailable')


if __name__ == '__main__':
    unittest.main()
