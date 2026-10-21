# Code audit, refactoring and architecture

Inspect the current project and its submodules against actual code, configuration, CLI, tests, dependencies and cross-repository interfaces. Fix demonstrated correctness or maintainability problems with bounded, compatible changes. Do not refactor simply to produce a diff.

## Establish facts

Identify responsibilities, entry points, public API/CLI, configuration defaults, artifact schemas and versions, data lineage and producer/consumer dependencies. Record the quality baseline before modification.

## Inspect implementation

- Find dead code, one-off scripts, redundant implementations, obsolete compatibility layers and unused dependencies. Check static callers, dynamic discovery and external compatibility before removing anything.
- Review oversized modules/classes/functions, repeated conversions, excessive abstraction, cycles, deep or reversed dependencies and misplaced cross-repository responsibilities.
- Assess types, errors, exception propagation, resource ownership, concurrency, I/O, configuration loading and boundary validation using the language's engineering conventions. Use SOLID and PEP 8 where useful, rather than forcing abstractions.
- Investigate performance and security issues when evidence supports them.
- Use LOC, cyclomatic/cognitive complexity, AST/static analysis, dependency/call graphs and artifact/version lineage only to locate and explain problems. Lower metrics are not an acceptance goal.

## Inspect gates and tests

For Python consider the project's ruff, ty, pytest, coverage and pip-audit setup; use corresponding tools for other languages. Check configuration scope, CI/local parity, dependency checks and each lint/type ignore, coverage exclusion and skipped test. Fix underlying problems where practical; retain justified exceptions with their reason.

Check behavior, boundaries, error paths, regressions and API/CLI/schema/configuration/artifact contracts. Prefer observable behavior over private implementation details or fragile mocks. Verify producer/consumer compatibility at the actual pinned versions. Add meaningful regression tests before changing behavior where practical; do not add low-value tests to chase coverage. If i18n exists, locale must not change structured results, calculations or machine contracts.

## Implement and verify

Rank findings by correctness, security, contract risk and maintenance benefit. Reproduce material defects, make focused changes, run affected checks and verify compatibility. Explain unresolved cross-repository dependencies and migrations. Preserve public contracts; stop a risky change when its required authorization or consumer migration is unavailable.

## Report

List inspected repositories and submodules, prioritized findings with evidence, fixes, test additions/changes/removals, commands and results, baseline failures, regressions, unavailable checks and remaining cross-repository work.

## Evidence and execution contract

Inspect the target repository's instructions, status, branch, remotes and worktrees before editing. Treat submodules as independent repositories: record paths, pinned SHA, checked-out SHA, dirty state and producer/consumer contracts. Do not initialize missing submodules or upgrade gitlinks merely to complete an audit; report unavailable scope.

Record the applicable lint, type, test, coverage, security and dependency baseline. Choose tools from the project and language, not a universal checklist. Distinguish pre-existing failures, introduced regressions and unavailable checks. Attach code/configuration locations or command results to material findings.

Preserve existing user work. Follow existing session authorization and repository delivery rules for worktrees, commits, PRs, merge, deployment and task-owned cleanup. This prompt grants no permission to change external repositories, user data, unrelated branches or production state. Explain compatibility risks and migration steps before a breaking change; request missing authorization only when actually needed. Never bypass repository controls.

Do not manufacture passing checks by removing valid tests, widening ignores, lowering thresholds or hiding errors. Report only checks actually run. A justified obsolete test may be removed after confirming its behavior is retired.
