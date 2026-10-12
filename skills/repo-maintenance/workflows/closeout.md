# Repository hygiene, rule consistency and closeout

Inspect the project and submodules after the current work. Remove confirmed obsolete residue, reconcile project rules and references, verify delivery state and report remaining work. Do not restart a comprehensive function-by-function audit or erase useful history for cosmetic tidiness.

## Establish ownership and state

Record branch/worktree changes, submodule pinned and checked-out versions, baseline issues, gates and incomplete migrations. Distinguish implemented, committed, merged, released, deployed and consumer-adopted states. Local code alone proves none of the later states.

## Inspect residue and rules

Check stale paths/imports/configuration/commands, links, moved modules, retired keys/flags/artifacts, one-off scripts, fixtures, dependencies, CI, TODO/FIXME notes, compatibility layers and accidental tracked caches/logs/generated output. Confirm callers, dynamic references, external consumers and historical rationale before deletion.

Check AGENTS.md and existing project agent/developer guidance for current responsibilities, working commands, duplicated/conflicting instructions, scope violations and temporary experiences presented as permanent rules. Repair stable project guidance in its original location. Do not rewrite personal memory, global tool configuration or unrelated repository-external state.

Review ignore patterns, lint/type exceptions, coverage exclusions and skips for actual justification. Retain useful design records, valid tests and required compatibility layers. Never hide unresolved defects with exclusions.

## Check cross-repository closeout

Verify ownership, dependency direction, producer/consumer API/CLI/schema/configuration/artifact compatibility and interfaces available at pinned submodule SHA. Separate locally validated changes, provider changes not yet adopted, consumer follow-up and unavailable checks. A single repository's passing test is not proof of end-to-end compatibility.

## Clean up within authorization

Clean only content proven obsolete and within the task's authority. For branch/worktree cleanup, identify owner, unique commits and uncommitted/untracked work, verify the PR was merged and preserve recoverable work. Never infer authorization to merge or delete unrelated branches. Follow existing authorized delivery rules; do not rewrite history, bypass hooks or branch protection, or change production/data/global state without authorization. Report unknown ownership or destructive migrations rather than proceeding.

## Final validation and handoff

Inspect the diff, status and submodules for unintended changes. Run affected tests/lint/types and applicable gates; validate references and contracts. Record actual merge/deployment/adoption evidence when available, without conflating states. Report inspected scope, residue/rule fixes, cross-repository version state, commands/results, pre-existing failures, new regressions, unavailable checks, remaining risks and required follow-up. If no cleanup is warranted, say so.

## Evidence and execution contract

Inspect the target repository's instructions, status, branch, remotes and worktrees before editing. Treat submodules as independent repositories: record paths, pinned SHA, checked-out SHA, dirty state and producer/consumer contracts. Do not initialize missing submodules or upgrade gitlinks merely to complete an audit; report unavailable scope.

Record the applicable lint, type, test, coverage, security and dependency baseline. Choose tools from the project and language, not a universal checklist. Distinguish pre-existing failures, introduced regressions and unavailable checks. Attach code/configuration locations or command results to material findings.

Preserve existing user work. Follow existing session authorization and repository delivery rules for worktrees, commits, PRs, merge, deployment and task-owned cleanup. This prompt grants no permission to change external repositories, user data, unrelated branches or production state. Explain compatibility risks and migration steps before a breaking change; request missing authorization only when actually needed. Never bypass repository controls.

Do not manufacture passing checks by removing valid tests, widening ignores, lowering thresholds or hiding errors. Report only checks actually run. A justified obsolete test may be removed after confirming its behavior is retired.
