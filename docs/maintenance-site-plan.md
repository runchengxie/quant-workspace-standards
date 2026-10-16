# Historical notes: maintenance site implementation

This file preserves the original implementation plan. Its steps describe intended work at the time and are not a current task list or source of current behavior. See the [README](../README.md) and [site instructions](../site/AGENTS.md) for the current site structure and validation commands.

Implement the user-supplied design: a lightweight Markdown-built engineering site, three reusable maintenance prompts, one distributable Skill with three workflows, and an offline October 18 talk.

1. Keep AGENTS.md as the canonical standard. Store interpretation, cases and talk separately.
2. Maintain English workflow instructions and zh-CN prompts with equivalent scope. Make Git delivery follow existing authorization and repository rules.
3. Build portable relative-link pages, downloadable Skill archive and a self-contained slide deck from maintained sources.
4. Verify build output, internal links, archive completeness, localization equivalence and slide interactions. Run these checks in PR CI.
5. Verify public case sources, commit, open a PR, merge after checks, confirm Pages deployment and clean up this task only.

Case provenance must distinguish PR evidence, the speaker's recollection and interpretation. Do not publish local credentials, client details or machine paths. Chinese talk prose is original content; shared UI defaults to English with an explicit persistent language switch.
