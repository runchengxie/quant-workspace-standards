# Documentation guide

The root README explains what the standards are for and how to adopt them. Implementation and reproduction details live here.

| Topic | English | 简体中文 |
| --- | --- | --- |
| General principles and workspace choices | [Adoption guide](adopting.md) | [采用说明](adopting.zh-CN.md) |
| Local paths and configuration | [Setup](workspace-configuration.md) | [本地配置](workspace-configuration.zh-CN.md) |
| Read-only maintenance tools | [Commands and limits](maintenance/tools.en.md) | [命令与边界](maintenance/tools.zh-CN.md) |
| Website build and publication | [Contributor guide](site-development.md) | [构建与发布](site-development.zh-CN.md) |
| Complete simulated example | [Walkthrough](content/maintenance-example.en.md) | [完整演练](content/maintenance-example.zh-CN.md) |

[Behavioral evaluation procedure](maintenance/evaluation.md) · [Initial observations and correction](maintenance/evaluation-2026-10-21.md)

[Agent interface contracts](agent-interface-contracts.md) — discovery, preflight, errors, handoffs and behavioral acceptance.

## Repository layout

- Root AGENTS.md and AGENTS.zh-CN.md contain the shared standard and translation.
- docs/content contains bilingual website prose and Chinese standalone prompts. Paths inside rendered content target the built site; the artifact checker validates them after building.
- docs/maintenance contains tool instructions, the evaluation procedure and reviewed observations. Raw evaluation artifacts belong under the project's DATA_ROOT.
- scripts contains read-only CLI tools, tests, the fixture generator and the independently installable [repo-maintenance Skill](../scripts/repo-maintenance/SKILL.md).
- evals/repo-maintenance/cases.json contains the machine-readable case definitions and rubric identifiers.
- site contains the website implementation and its checks. GitHub Actions runs validation and publishes Pages after changes reach main.

The source reorganization does not change website routes, download names, or the repo-maintenance directory inside the Skill archive. Copy that complete directory when installing.
