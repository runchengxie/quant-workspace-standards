# Code Workspace Standards

This directory contains multiple independent repositories. Identify the target repository and read its own `AGENTS.md` before making changes. Do not treat neighboring repositories as one project.

## Language and Internationalization

- English is the authoritative language for workspace standards, technical requirements, and repository development documentation. Chinese translations are secondary references; use the English version if the two differ.
- Keep the root `AGENTS.md` as the canonical English standard and `docs/standards.zh-CN.md` as its Simplified Chinese reference. Update both in the same change when changing a rule, and do not add requirements only to the translation. Keep the translation clearly labeled as reference material rather than a separate agent instruction file.
- For user-facing software that supports multiple languages, keep translatable text in locale catalogs rather than embedding it in UI components. Use stable semantic keys, interpolation for dynamic values, plural-aware messages, and locale-aware formatting.
- Default to English and provide an explicit language switch when multiple locales are supported. Preserve the user's selection when practical, and fall back to English when a translation is missing.
- Keep locale selection separate from business logic. Store timestamps and other values according to the data contract; format them for display using the selected locale and an explicit time zone.
- Keep machine logs, APIs, persisted data, and internal identifiers stable and language-neutral. Translate human-facing UI text and documentation instead of changing data or protocol values by locale.

## Default Development Workflow

1. Begin with read-only inspection of the target repository's worktree, branch, remotes, and existing worktrees. Preserve changes made by other agents.
2. Fetch remote state. By default, use the user's own repository or fork, create a task branch from its `main`, and work in an isolated worktree. Give each task and agent its own worktree and branch.
3. Put temporary worktrees under `$CODE_ROOT/.worktrees/<repo>-<topic>`. Make code, test, and documentation changes in the task worktree rather than the shared main checkout.
4. Complete required validation and commit in the task worktree. By default, push the task branch to the user's repository or fork and open a PR targeting that repository's `main`. Do not open a PR against the original author or upstream unless the user explicitly asks. Verify repository ownership and the actual remote name; do not assume `origin` is the destination.
5. Merge only after all required checks pass and conflicts are resolved. No separate human review is required for a PR authored by the user or for work the user explicitly assigned to the agent; this is standing authorization and does not need to be repeated for each PR. This exception does not waive approvals enforced by GitHub branch protection or repository rulesets. Never bypass those controls. Do not bypass hooks, push directly to `main`, or force-push to win a race.
6. After confirming the PR is merged and the task worktree contains no unique unsaved work, delete only this task's remote branch, remove its worktree, and delete its local branch. Do not delete a branch while it is still checked out.
7. Fast-forward the primary checkout only when it is clean. Report the PR, merge commit, actual validation results, and any remaining work.

## Safety Boundaries

- Clean up only branches and worktrees created for the current task. Do not remove other work that merely looks stale.
- Do not use `--force`, `reset --hard`, or file replacement to discard unsaved changes. If ownership is unclear, a conflict occurs, or a required check fails, report it and preserve a recoverable state.
- For cross-repository changes, open a PR in each repository and merge the provider before its consumers. Do not leave production depending on an unmerged development branch.
- Repository hooks are shared configuration. Do not reinstall or rewrite them from a task worktree.
- Keep raw data, runtime results, and credentials outside repositories. Scheduled jobs must use stable production release paths, never temporary worktrees.
- Use the GitHub CLI's configured credentials first and verify authentication before remote writes. Follow the repository's credential instructions if authentication fails. Never print, commit, or persist access tokens in shell configuration or repositories.
- User-level and local workspace files are not part of a Git repository and cannot be submitted through a PR. Modify them in place when requested; do not initialize or restructure the entire workspace to make them versionable.

## Project Configuration and Credentials

- Store personal project configuration, production settings, credentials, and machine-specific paths for projects under `~/code/` in a private owner namespace such as `~/.config/<owner>/`, outside source repositories and temporary worktrees.
- Before creating a configuration file, inspect and follow existing grouping under `~/.config/<owner>/projects/`, `deployments/`, and `shared/`. Avoid keeping duplicate copies of the same credentials in both the top level of `~/.config/` and the owner namespace.
- Use `projects/` for personal project settings, `deployments/<repo>/` for deployment-specific settings, and `shared/` only for configuration genuinely shared by multiple projects. Prefer paths derived from `XDG_CONFIG_HOME` or `$HOME`; do not hard-code a person's absolute path in shareable code.
- Set credential files to mode `0600` and directories containing only credentials to mode `0700`. Keep logs, runtime results, and raw data in their designated locations outside the configuration directory.
- Keep workspace development standards in a valid Git repository with an access level appropriate for the content. Include only general standards in a public repository; remove personal hostnames, absolute paths, and machine-specific credential file paths. Tool-specific settings belong in the locations required by those tools.

## Data and Generated Files

- Store project data, retained runtime state, reports, models, charts, and other generated files under `~/data/` by default. Do not put them in source repositories, temporary worktrees, or the private owner configuration namespace.
- Map project groupings under `~/code/` to `~/data/`. For example, data for `~/code/quant/<repo>/...` belongs under `~/data/quant/<repo>/...`. Preserve relative directory structure within each project when practical so source and generated files are easy to associate.
- Store data shared across repositories under the authoritative owner's project directory. Consumers should access it through an explicit path or a published asset contract; do not copy data just to mirror source layout.
- A repository's own `AGENTS.md`, data contract, or production configuration may specify a stable data root, external storage, release directory, or other layout. Follow the more specific requirement.
- Before changing an existing data directory, inventory symlinks, manifests, `current`/`latest` aliases, running jobs, and downstream references. This mapping convention does not authorize moving or deleting existing data.

Repository-specific `AGENTS.md` files retain their more specific quality gates, permissions, and production boundaries.
