# AI-Assisted Development Standards

Practical rules for working with AI coding agents. They cover how to inspect a project, keep parallel changes separate, verify behavior, and finish delivery without losing other people's work.

[中文说明](README.zh-CN.md) · [Read the website](https://runchengxie.github.io/quant-workspace-standards/)

## What this covers

- Read the project's instructions and current state before making changes.
- Give independent tasks separate branches and worktrees.
- Keep code, tests and documentation consistent; report checks actually run.
- Use the authorized PR process and verify changes against the current target branch.
- Preserve unrelated work and active runtime resources during cleanup.
- Keep private configuration, data and generated output outside source repositories.

## How to use it

Start with [the standards](AGENTS.md), or [the Chinese translation](AGENTS.zh-CN.md). Adapt the general rules to your workspace and keep project-specific boundaries and validation commands in each project's AGENTS.md. Review the delivery policy before adopting it; this workspace's authorization to merge assigned work is not a universal team policy.

For recurring repository maintenance, use [repo-maintenance](scripts/repo-maintenance/SKILL.md). It supports read-only audits, code maintenance, documentation checks and closeout. The [Prompts & Skill page](https://runchengxie.github.io/quant-workspace-standards/playbooks/index.html) provides the standalone prompts, installation instructions and a complete simulated example.

## Further reading

- [Local setup](docs/workspace-configuration.md)
- [Read-only push, cleanup and standards checks](docs/maintenance/tools.en.md)
- [Behavioral evaluation and observed results](docs/maintenance/evaluation-2026-10-21.md)
- [Repository and documentation guide](docs/README.md)

The English AGENTS.md is the source standard. This repository keeps general rules and reusable tools; personal settings, credentials and runtime data belong elsewhere.
