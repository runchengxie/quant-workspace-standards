[Download repo-maintenance.zip](../downloads/repo-maintenance.zip)

Extract the complete `repo-maintenance` folder into your agent's Skill directory. Keep the workflow files and shared evidence instructions together.

## Call the same workflow

```text
Use $repo-maintenance in full mode for this repository and its submodules.
Base changes on implementation evidence, preserve public contracts,
and follow the repository's authorized delivery process.
```

`full` runs code → documentation and tests → closeout. It loads each workflow as needed, shares a fact ledger and returns to an affected phase when validation finds a defect.

## Choose a smaller scope

- `audit`: read-only findings from relevant workflows.
- `code`: implementation audit and bounded fixes.
- `docs`: documentation, test scripts and existing i18n synchronization.
- `full`: all three phases in order.

For closeout alone, ask explicitly for the closeout workflow. There is no separate public closeout mode.

## Installation details

For Codex, use `$CODEX_HOME/skills`, or `~/.codex/skills` when unset. Other tools use their own Skill directories. Restart or reload discovery when your tool requires it. Downloading the archive does not install it or modify production.

[Skill source](https://github.com/runchengxie/quant-workspace-standards/tree/main/skills/repo-maintenance) · [Routing instructions](../downloads/repo-maintenance/SKILL.md)

Existing user authorization and repository controls govern delivery. `audit` stays read-only. Reports distinguish implemented, merged, deployed and consumer-adopted states.

## Reference

[Khazix's neat-freak](https://github.com/KKKKhazix/khazix-skills/tree/main/neat-freak) informed the closeout idea. This Skill independently organizes the workflows and does not vendor or require neat-freak.
