# Documentation, test scripts and i18n synchronization

Inspect the current project and submodules using actual implementation, configuration, CLI, tests and interfaces. Correct missing, inaccurate and obsolete documentation and test scripts. Keep this workflow focused on factual synchronization; report product defects without hiding them in changed test expectations.

## Confirm facts and coverage

Review README.md, AGENTS.md, docs/, corresponding zh-CN documents, architecture, installation, configuration, API/CLI, usage, operations, examples and test instructions. Verify responsibilities, supported and unsupported behavior, defaults, artifact names/structures/versions, producer/consumer boundaries and removed/moved/renamed features. Do not present plans or local unmerged work as shipped behavior.

## Maintain languages

English is the canonical source of truth for project facts; zh-CN localizes the same facts with natural phrasing. Resolve conflicts from implementation, correct English first and synchronize Chinese. Chinese may reorganize prose but must not add unsupported features, restrictions, guarantees or promises. Prioritize README, architecture, configuration, usage and operations; internal notes need not all be translated.

Keep schemas, APIs, CLI flags, configuration keys, artifacts, modules, paths and machine identifiers unchanged. Explain version/platform/environment limits in English before localizing them.

Use concise technical English and natural Chinese. Remove repetition, obscure wording, translationese, unnecessary language mixing, promotional commentary and indirect “not X but Y” constructions. Use the punctuation appropriate to each language. Avoid unnecessary quotation marks, Markdown emphasis, semicolons and dashes; preserve meaningful inline code and copyable examples. Repair existing authoritative pages instead of accumulating patch notes that contradict them.

## Verify test scripts

Test code, comments and diagnostic output default to English except localized fixtures/output under test. Check retired behavior, fixtures, sample data, helpers, duplicate or permanently skipped tests, current contracts and boundaries, documented commands and CI parity. Fix obsolete tests with evidence and add missing high-value contract/boundary/regression tests. A failing product behavior remains a defect, not a new passing expectation. Avoid unrelated architecture work.

## Verify existing i18n

If supported, check en-US, zh-CN, the default and fallback locale, missing translations, unknown locales and human-facing output. Verify that locale only changes presentation, not structured facts, calculations, schemas, keys, artifact semantics, stable identifiers or cross-repository contracts. Add equivalent-result tests when material. Do not introduce a full i18n system into a project that lacks one solely for this audit.

## Verify and report

Confirm facts, correct English, synchronize Chinese, repair affected scripts, then validate examples, links, commands and outputs. Report the inspected scope, factual corrections, localization status, test changes, actual validation results and unresolved implementation/documentation or cross-repository inconsistencies. If an environment cannot verify a command, say so instead of inventing output.

## Evidence and execution contract

Inspect the target repository's instructions, status, branch, remotes and worktrees before editing. Treat submodules as independent repositories: record paths, pinned SHA, checked-out SHA, dirty state and producer/consumer contracts. Do not initialize missing submodules or upgrade gitlinks merely to complete an audit; report unavailable scope.

Record the applicable lint, type, test, coverage, security and dependency baseline. Choose tools from the project and language, not a universal checklist. Distinguish pre-existing failures, introduced regressions and unavailable checks. Attach code/configuration locations or command results to material findings.

Preserve existing user work. Follow existing session authorization and repository delivery rules for worktrees, commits, PRs, merge, deployment and task-owned cleanup. This prompt grants no permission to change external repositories, user data, unrelated branches or production state. Explain compatibility risks and migration steps before a breaking change; request missing authorization only when actually needed. Never bypass repository controls.

Do not manufacture passing checks by removing valid tests, widening ignores, lowering thresholds or hiding errors. Report only checks actually run. A justified obsolete test may be removed after confirming its behavior is retired.
