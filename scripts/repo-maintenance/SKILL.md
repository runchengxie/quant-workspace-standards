---
name: repo-maintenance
description: Use for repository audits, code and documentation consistency checks, or task closeout and residue cleanup, including requests such as "audit this project", "check whether docs and tests match the code", or "wrap up this change". Not for conceptual questions or routine edits without a maintenance request.
---

# Repository maintenance

First read the target repository's AGENTS.md and inspect git status, branch, remotes and worktrees. Read [shared evidence](references/evidence.md) before any mutation; record scope, baseline and existing authorization, then select the workflow.

Choose the mode from the user's request. For an unspecified maintenance request, infer the narrowest useful workflow; clarify only if intent materially changes scope.

- `audit`: inspect and report without modifying files or external state. Read only the workflows relevant to the requested audit; for a comprehensive audit read all three.
- `code`: read [code](workflows/code.md), fix evidenced implementation and architecture issues, validate behavior.
- `docs`: read [docs](workflows/docs.md), synchronize documentation, test scripts and existing i18n without unrelated refactoring.
- `full`: execute [code](workflows/code.md) → [docs](workflows/docs.md) → [closeout](workflows/closeout.md), loading each at its phase.
- For a closeout-only request, read [closeout](workflows/closeout.md) directly; it is independently usable without inventing a fifth public mode.

Read [shared evidence](references/evidence.md) to establish the fact ledger, phase handoff and completion conditions. Honor target repository instructions and existing user authorization, including authorized worktree/PR delivery. Do not assume permission to mutate other repositories, deploy, change submodule pointers or clean unrelated work.

Reuse the baseline across phases. Rank actual problems by correctness, contract risk and maintenance value. Changes must have evidence and useful validation; do not chase metric improvements or fabricate work. Return only the affected scope to its owning phase when a later phase reveals a defect. Keep original failures distinct from regressions, and unavailable checks distinct from passes.

In the final report state scope, evidence-backed findings/fixes, actual checks, delivery state and unresolved work. Audit mode never commits or creates a PR. Other modes use the already-authorized delivery process rather than imposing a second approval ritual.
