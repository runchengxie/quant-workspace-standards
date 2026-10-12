# Three prompts, one maintenance Skill

Copy a prompt for a one-off task, or download the Skill to reuse its shared baseline and phase handoff. The three workflows are independently usable.

| Workflow | Changes | Boundary |
| --- | --- | --- |
| Code and architecture | Implementation, behavior tests and quality configuration | Evidence-backed changes that preserve contracts |
| Documentation and tests | Canonical facts, zh-CN, examples and test scripts | No unrelated architecture refactoring |
| Closeout | Confirmed residue, project guidance and final verification | No cleanup of unrelated branches or user work |

## Skill modes

- `audit`: read-only findings. Select only the relevant workflows.
- `code`: implementation audit and bounded fixes.
- `docs`: documentation, test scripts and existing i18n synchronization.
- `full`: code → docs → closeout, returning to an affected phase if validation reveals a defect.

For closeout alone, ask explicitly for the closeout workflow. Git worktree/PR management is the shared delivery protocol, rather than a fourth maintenance Skill.

## Install and use

[Download repo-maintenance.zip](../downloads/repo-maintenance.zip) and extract the complete `repo-maintenance` folder into your agent's skill directory. For Codex, use `$CODEX_HOME/skills` or `~/.codex/skills` when unset. Installation locations differ between tools. Restart or reload skill discovery as required by your tool. No installation or production mutation is performed by downloading the archive.

```text
Use $repo-maintenance in full mode for this repository and its submodules.
Base changes on implementation evidence, preserve public contracts,
and follow the repository's authorized delivery process.
```

[Skill source](https://github.com/runchengxie/quant-workspace-standards/tree/main/skills/repo-maintenance) · [Routing instructions](../downloads/repo-maintenance/SKILL.md)

The Skill reads only relevant workflow files, shares a fact ledger and distinguishes implemented, merged, deployed and adopted states. Existing user authorization takes precedence over generic confirmation wording. Audit mode stays read-only.

## Complete prompts

The English prompt text below is built directly from the canonical Skill workflows. Chinese versions express the same requirements. Copy buttons copy the selected complete prompt. If clipboard access is unavailable, select and copy the visible text.

## Design reference

[Khazix's neat-freak](https://github.com/KKKKhazix/khazix-skills/tree/main/neat-freak) informed the closeout idea. This repository's Skill is an independent workflow design; it does not vendor or require neat-freak.
