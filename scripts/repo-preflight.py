#!/usr/bin/env python3
"""Read-only, local Git evidence. Never fetches, pushes, merges or deletes."""
import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import sys
from urllib.parse import urlsplit


class Unavailable(Exception):
    pass


def git(repo, *args):
    try:
        run = subprocess.run(
            ['git', '-C', str(repo), *args], capture_output=True, text=True,
            env={**os.environ, 'GIT_OPTIONAL_LOCKS': '0', 'GIT_TERMINAL_PROMPT': '0'},
            timeout=20,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise Unavailable('git_command_unavailable') from exc
    if run.returncode:
        # Git stderr may contain credentials from remote configuration.
        raise Unavailable('git_evidence_unavailable')
    return run.stdout.strip('\n')


def revision(repo, ref):
    return git(repo, 'rev-parse', '--verify', '--end-of-options', ref + '^{commit}').strip()


def commits(repo, base, head):
    return git(repo, 'rev-list', '--reverse', f'{base}..{head}').splitlines()


def destination(url):
    """Return a safe GitHub identity; never echo arbitrary URL contents."""
    sensitive = False
    host = None
    path = ''
    if url.startswith('git@github.com:'):
        host = 'github.com'
        path = url.removeprefix('git@github.com:')
    else:
        try:
            parsed = urlsplit(url)
            sensitive = bool(parsed.password or parsed.query or parsed.fragment)
            if parsed.scheme == 'https':
                sensitive = sensitive or bool(parsed.username)
            if parsed.scheme in ('https', 'ssh') and parsed.port in (None, 22, 443):
                host = parsed.hostname
                path = parsed.path.lstrip('/')
        except ValueError:
            sensitive = True
    path = path.removesuffix('.git').rstrip('/')
    identity = path if host == 'github.com' and re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+', path) else None
    return {'repository': identity, 'display': f'github.com/{identity}' if identity else '<unsupported-destination>', 'credential_bearing': sensitive}


def push(args):
    repo = Path(args.repo).resolve()
    blockers = []
    if args.remote not in git(repo, 'remote').splitlines():
        raise Unavailable('remote_not_found')
    git(repo, 'check-ref-format', '--branch', args.target)
    branch = git(repo, 'branch', '--show-current').strip()
    if not branch:
        blockers.append('detached_head')
    elif branch in ('main', 'master', args.target):
        blockers.append('protected_source_branch')
    head = revision(repo, 'HEAD')
    destinations = [destination(url) for url in git(repo, 'remote', 'get-url', '--push', '--all', args.remote).splitlines()]
    if not destinations or any(item['repository'] is None or item['repository'].lower() != args.expected_repository.lower() for item in destinations):
        blockers.append('destination_mismatch')
    sources = [destination(url) for url in git(repo, 'remote', 'get-url', '--all', args.remote).splitlines()]
    tracking_matches = bool(sources) and all(item['repository'] is not None and item['repository'].lower() == args.expected_repository.lower() for item in sources)
    if not tracking_matches:
        blockers.append('tracking_destination_mismatch')
    fetch_specs = git(repo, 'config', '--get-all', f'remote.{args.remote}.fetch').splitlines()
    if fetch_specs != [f'+refs/heads/*:refs/remotes/{args.remote}/*']:
        tracking_matches = False
        blockers.append('custom_fetch_refspec')
    if any(item['credential_bearing'] for item in destinations + sources):
        blockers.append('credential_bearing_url')
    configured = subprocess.run(['git', '-C', str(repo), 'config', '--get-all', f'remote.{args.remote}.push'], capture_output=True, text=True, timeout=20)
    if configured.returncode not in (0, 1):
        blockers.append('push_configuration_unknown')
    if configured.stdout.strip():
        blockers.append('custom_push_refspec')
    configured_mirror = subprocess.run(['git', '-C', str(repo), 'config', '--get', f'remote.{args.remote}.mirror'], capture_output=True, text=True, timeout=20)
    if configured_mirror.returncode not in (0, 1) or configured_mirror.stdout.strip().lower() not in ('', 'false', 'no', 'off', '0'):
        blockers.append('mirror_push_configuration')
    target = None
    outgoing = None
    target_is_ancestor = None
    push_base = None
    try:
        if not tracking_matches:
            raise Unavailable('tracking_destination_unknown')
        target = revision(repo, f'refs/remotes/{args.remote}/{args.target}')
        integration = commits(repo, target, head)
        target_is_ancestor = not commits(repo, head, target)
        if not target_is_ancestor:
            blockers.append('target_not_integrated')
        try:
            push_base = revision(repo, f'refs/remotes/{args.remote}/{branch}') if branch else target
        except Unavailable:
            push_base = target
        outgoing = commits(repo, push_base, head)
        if commits(repo, head, push_base):
            blockers.append("push_not_fast_forward")
    except Unavailable:
        integration = None
        blockers.append('target_revision_unknown')
    status = git(repo, 'status', '--porcelain=v1', '-z', '--untracked-files=all')
    if status:
        blockers.append('dirty_worktree')
    return {
        'schema_version': 1, 'operation': 'push', 'status': 'blocked' if blockers else 'review_required',
        'repository': args.expected_repository, 'remote': args.remote, 'source_branch': branch or None,
        'head_revision': head, 'target_branch': args.target, 'target_revision': target,
        'target_is_ancestor': target_is_ancestor, 'push_destinations': destinations, 'fetch_sources': sources,
        'push_base_revision': push_base, 'outgoing_commits': outgoing, 'integration_commits': integration,
        'explicit_refspec': f'HEAD:refs/heads/{branch}' if branch else None,
        'authorization': 'not_verified', 'remote_freshness': 'not_verified',
        'required_checks': 'not_verified', 'blockers': blockers,
    }, 1 if blockers else 0


def worktrees(repo):
    raw = git(repo, 'worktree', 'list', '--porcelain', '-z')
    trees = []
    for record in raw.split('\0\0'):
        fields = {}
        for field in record.split('\0'):
            if field:
                key, _, value = field.partition(' ')
                fields[key] = value
        if 'worktree' in fields:
            trees.append(fields)
    return trees


def cleanup(args):
    repo = Path(args.repo).resolve()
    candidate = Path(args.candidate).resolve()
    trees = worktrees(repo)
    found = next((item for item in trees if Path(item['worktree']).resolve() == candidate), None)
    blockers = ['ownership_unknown', 'merge_state_unknown', 'runtime_dependencies_unknown']
    result = {'schema_version': 1, 'operation': 'cleanup', 'candidate': str(candidate),
              'decision': 'retain', 'authorization': 'not_verified', 'blockers': blockers,
              'unique_commits': None, 'base_revision': None, 'head_revision': None}
    if not found:
        blockers.append('unregistered_worktree')
        return result, 1
    result['branch'] = found.get('branch')
    result['head_revision'] = found.get('HEAD')
    result['locked'] = 'locked' in found
    if trees and found is trees[0]:
        blockers.append('primary_worktree')
    if found.get('branch') in ('refs/heads/main', 'refs/heads/master'):
        blockers.append('protected_branch')
    if 'locked' in found:
        blockers.append('locked_worktree')
    if 'prunable' in found or not candidate.is_dir():
        blockers.append('worktree_unavailable')
        return result, 1
    if git(candidate, 'status', '--porcelain=v1', '-z', '--untracked-files=all'):
        blockers.append('dirty_worktree')
    try:
        base = revision(repo, args.base)
        result['base_revision'] = base
        result['unique_commits'] = commits(repo, base, found['HEAD'])
        if result['unique_commits']:
            blockers.append('unique_commits')
    except Unavailable:
        blockers.append('base_revision_unknown')
    # Squash merges, external jobs and ownership require evidence outside local Git.
    return result, 1


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='operation', required=True)
    pushing = sub.add_parser('push')
    pushing.add_argument('--repo', required=True)
    pushing.add_argument('--remote', required=True)
    pushing.add_argument('--target', required=True, help='Integration target, e.g. main; not the pushed branch')
    pushing.add_argument('--expected-repository', required=True, help='Expected GitHub owner/repository')
    cleaning = sub.add_parser('cleanup')
    cleaning.add_argument('--repo', required=True)
    cleaning.add_argument('--candidate', required=True)
    cleaning.add_argument('--base', required=True, help='Locally available integration revision')
    args = parser.parse_args()
    if args.operation == 'push' and not re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+', args.expected_repository):
        parser.error('--expected-repository must be owner/repository')
    try:
        result, code = push(args) if args.operation == 'push' else cleanup(args)
    except (Unavailable, OSError, subprocess.TimeoutExpired) as exc:
        result, code = {'schema_version': 1, 'operation': args.operation, 'status': 'unavailable', 'error': str(exc) if isinstance(exc, Unavailable) else 'input_or_command_unavailable'}, 2
    print(json.dumps(result, indent=2, ensure_ascii=True))
    return code


if __name__ == '__main__':
    sys.exit(main())
