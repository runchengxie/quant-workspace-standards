# Adopting these standards

Keep the general principles, then choose the workflow and permissions that fit your team. The published AGENTS.md includes this workspace's operating policy. In this workspace, its rules remain binding; this guide helps other adopters decide what to change before using their own copy.

## General principles

Inspect the project and preserve existing work before editing. Isolate independent changes, validate the version being delivered, and report only checks actually run. Keep secrets and runtime data out of source repositories. Cleanup requires evidence of ownership, saved work and retirement of runtime dependencies. Reading a document or invoking a Skill does not grant new permissions.

## Choices made by this workspace

| Area | General principle | This workspace's choice | Decide before adopting |
| --- | --- | --- | --- |
| Merge and review | Validate the version being merged and obey repository controls | User-authored PRs or explicitly assigned work may be merged under standing authorization once required checks pass, without extra human review | Which changes need human review, and who may merge? |
| Delivery authorization | Work only within the user's authorized scope | The default assigned-task workflow includes a task branch, push to the user's repository, PR, merge and task-owned cleanup | Does a request authorize a local patch, a draft PR, or the full delivery sequence? State that boundary explicitly |
| Directory layout | Separate source, private configuration and generated data; isolate independent tasks | CODE_ROOT, DATA_ROOT and CONFIG_ROOT; temporary worktrees under CODE_ROOT/.worktrees; project data follows the configured mapping | Which roots, worktree location and data contract apply? Keep actual machine paths private |
| Integration target | Verify the intended repository and current target revision | Use the user's repository or fork and target main by default | Which repository and branch receive changes? Are there protected release branches or a merge queue? |

A general request to fix code does not universally authorize deployment, production-data changes or writes to unrelated repositories. The standing delivery authorization above belongs to this workspace. Repository protection and required approvals remain effective even where separate human review is waived. Automatic merge permission is not permission to bypass a gate.

## Put decisions in the right place

Record personal authorization preferences in the owner's global instructions, shared workflow choices in workspace instructions, and project boundaries and exact validation commands in each repository's AGENTS.md. Use the existing configuration layout for concrete paths. Avoid copying the same rule into several files where it can drift.

Start from the [English standard](../AGENTS.md) and check its [delivery workflow](../AGENTS.md#default-development-workflow) and [safety boundaries](../AGENTS.md#safety-boundaries). Use [local setup](workspace-configuration.md) for paths and [read-only comparison](maintenance/tools.en.md#local-standards-drift) to review future updates without overwriting local additions.
