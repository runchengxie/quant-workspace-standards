# Read-only maintenance checks

Use these commands to collect local evidence before a push, cleanup or standards update. They require Python 3.11+ and Git, make no network requests, and never push, delete, install hooks or overwrite instructions. JSON keys and status values are stable and language-neutral. Treat their output as private working evidence, especially worktree paths and commit identifiers.

## Push destination and revision

From the standards repository, replace the placeholders with the target checkout and intended GitHub repository:

```sh
python3 -B scripts/repo-preflight.py push \
  --repo /path/to/task-worktree \
  --remote origin --target main \
  --expected-repository owner/repository
```

`--target` is the integration target, not the branch being pushed. The current task branch is the push source; the report provides its explicit `HEAD:refs/heads/<branch>` refspec. Inspect every expanded push destination, current HEAD, locally recorded target revision, integration commits and outgoing commits. A missing remote task branch uses the integration target as the comparison baseline; this is local evidence, not proof that the remote branch is absent. Custom push refspecs, mirror pushes, dirty worktrees, destination mismatches and direct pushes from main/master block the report. Credential-bearing HTTPS URLs are rejected and redacted; unsupported destinations are not treated as matching.

Exit 0 means the supported local checks completed without a known blocker; the status remains `review_required`. Authorization, remote freshness and GitHub required checks remain `not_verified`. Fetch and verify current remote state through your normal authorized workflow, and check that neither source nor target changed after validation. Exit 1 means a known blocker. Exit 2 means the requested evidence is unavailable or input is invalid. These commands do not replace branch protection or prove permission to push.

When a remote fetches upstream but pushes to a fork, its tracking refs do not establish the fork state. The report blocks destination-relative revision claims in that case. Configure and explicitly select a remote whose fetch and push identities both match the intended repository. Only the standard all-branches tracking refspec is supported; custom mappings report unavailable evidence.

## Cleanup inventory

```sh
python3 -B scripts/repo-preflight.py cleanup \
  --repo /path/to/repository \
  --candidate /path/to/task-worktree --base main
```

The command inspects only the exact registered candidate. It reports dirty state, locks, protected/primary worktrees, HEAD, base revision and commits not reachable from the base. Unregistered or unavailable candidates are retained. It does not scan directories for apparently stale projects or inspect other worktrees' file contents.

The decision always remains `retain`: local Git cannot prove task ownership, PR merge state or that external jobs no longer depend on a directory. A squash merge may leave commits absent from the target's ancestry despite equivalent delivered content. Verify the PR, task ownership, saved work, runtime register and retirement conditions independently before carrying out separately authorized cleanup. A clean worktree or an empty unique-commit list is insufficient. Exit 1 means this review is required; exit 2 means evidence could not be collected.

## Local standards drift

```sh
python3 -B scripts/check-workspace-sync.py \
  --canonical AGENTS.md --local "$CODE_ROOT/AGENTS.md"
```

Resolve `CODE_ROOT` first; TOML does not export it. The canonical file must be the trusted English source, and the local copy must use the same section language. This is exact Markdown block comparison, not semantic or translation comparison. It compares the introduction and level-two sections, ignores top-level titles, block order and line endings, and preserves multiline list items and fenced examples. A reworded shared rule is reported as missing, even when its meaning may be equivalent.

Exit 0 means every canonical block is present in its matching section; local additions are allowed. Exit 1 means shared rules or sections are missing/changed. Exit 2 means input or structure is unavailable. The JSON shows missing canonical blocks, counts of local additions, and names of local-only sections; it omits local-only prose, including the machine-specific introduction. Section names themselves may be private. Review the result locally. Apply any chosen correction manually and preserve the owner's additions; the tool never writes either file.

Run deterministic tests with:

```sh
python3 -B -m unittest discover -s scripts -p 'test_*.py'
```

See the [behavioral evaluation](evaluation.md) and [walkthrough](../content/maintenance-example.en.md) for the distinction between script checks and agent decisions.
