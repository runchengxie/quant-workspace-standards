# Quant Workspace Standards

Workspace-wide development standards for repositories under the quant code workspace.

The root [`AGENTS.md`](AGENTS.md) is the canonical, versioned copy. Keep local workspace instructions aligned with these standards and record the machine's resolved `CODE_ROOT`, `DATA_ROOT`, and `CONFIG_ROOT` there or in an explicitly referenced local settings file. Preserve repository-specific instructions in each project's own `AGENTS.md`.

This repository contains general development guidance. Keep credentials, personal settings, machine-specific paths, raw data, and runtime artifacts outside the repository.

## Read the standards

- [Source standard](AGENTS.md)
- [GitHub Pages site](https://runchengxie.github.io/quant-workspace-standards/)
- [Download AGENTS.md](https://runchengxie.github.io/quant-workspace-standards/downloads/AGENTS.md) · [Chinese translation](https://runchengxie.github.io/quant-workspace-standards/downloads/AGENTS.zh-CN.md)
- [Parallel worktree workflow](https://runchengxie.github.io/quant-workspace-standards/standards/index.html#parallel-development)

The standards page shows an optional step-by-step branch demonstration with play, pause, next-step and replay controls. Seven source-backed chapters support expand/collapse controls and direct links; all chapters are collapsed by default while the worktree diagram is directly visible at the top. Printing expands the full standard and restores the reading state afterwards. The full Markdown downloads remain unchanged.

The site uses an editorial handbook layout with neutral surfaces, display headings, restrained rules and readable body widths. The home page keeps a topic title and three resource entries; the playbooks page places complete prompts and the reusable Skill side by side, with shared phase descriptions above and a stacked layout on smaller screens.

Machine-local shared path settings belong in `CONFIG_ROOT/shared/workspace.toml`. Use the existing private configuration layout when available; otherwise, use `~/.config/<owner>/` on both Windows and Linux, honoring an explicitly configured `XDG_CONFIG_HOME` when present. Tools must explicitly read these settings or receive the resolved paths through environment variables. Keep tool-specific settings in the locations required by the tool.


## Maintenance playbooks and talk

The Pages site includes [three prompts and a downloadable Skill](https://runchengxie.github.io/quant-workspace-standards/playbooks/), and the [October 18, 2026 talk](https://runchengxie.github.io/quant-workspace-standards/talk/2026-10-18/). The talk includes keyboard navigation, fullscreen, deep links, Chinese speaker notes, a complete Chinese reading page and a downloadable offline site.

[`skills/repo-maintenance/SKILL.md`](skills/repo-maintenance/SKILL.md) routes `audit`, `code`, `docs` and `full` modes to three workflows. English workflow files are canonical and are also the English copyable prompts. [`content/prompts/`](content/prompts/) contains the corresponding zh-CN prompts. Copy the complete Skill folder into your tool's skill directory to install; copying SKILL.md alone omits the workflows.

The site defaults to English and offers a persistent Chinese switch, including the full standards body. Unknown stored or selected locales use English; missing Chinese UI keys fall back to English, then to the key itself. System/light/dark themes apply across every page. `AGENTS.md` remains the English canonical standard. The Chinese talk is original commentary. The worktree/PR protocol follows existing authorization and repository controls.

## Build and validate

The website uses Astro 7, TypeScript and Bun 1.4.3. Bun manages the frozen `site/bun.lock` and runs scripts; Astro's CLI runs on Node >=22.12.0. No React runtime is required. [Site instructions](site/AGENTS.md) describe its implementation boundaries.

```sh
cd site
bun install --frozen-lockfile
bun run check
bun run test:unit
bun run build --output-dir "${DATA_ROOT}/quant/quant-workspace-standards/site"
STANDARDS_SITE_OUTPUT_DIR="${DATA_ROOT}/quant/quant-workspace-standards/site" bun run test:artifacts
STANDARDS_SITE_OUTPUT_DIR="${DATA_ROOT}/quant/quant-workspace-standards/site" bun run test:browser
bun audit
```

Resolve `DATA_ROOT` from your machine's configured roots before building. The TOML settings file does not export it. Use an empty output directory or one owned by this builder (identified by `.standards-site.json`); unrelated files are rejected. Astro builds in disposable staging before publishing known files. Retained output belongs under the configured data root; CI and tests use disposable temporary output. Browser tests require Chromium installed with `bunx playwright install chromium` (CI also installs system dependencies).

Use `bun run dev` for local development. Open the generated `index.html` directly or serve the generated directory. HTML embeds styles, locale catalogs and compiled classic browser scripts, so the offline site needs no server or network. File links carry language/theme choices as presentation query parameters to work around inconsistent file:// storage. Online pages persist preferences in localStorage. Storage denial still permits in-memory changes. The QR points to online playbooks; online downloads and source links require connectivity.

Themes default to the system preference, react to system changes in system mode and save explicit light/dark choices. Initial theme selection runs in the head before styles to reduce flashing. Content, slides, prompt sources and downloads are identical across themes. English [AGENTS.md](AGENTS.md) remains canonical; [AGENTS.zh-CN.md](AGENTS.zh-CN.md) is its localization. The talk is prepared for approximately ten minutes.

Edit `content/`, `AGENTS.zh-CN.md`, `site/locales.json`, `site/src/` or the canonical Skill workflows, then rebuild. Astro components share navigation, document rendering, prompt cards and slides. `site/scripts/build.ts` preserves the legacy reading.html URL and packages only explicit pages and Skill resources. It generates the existing `downloads/repo-maintenance.zip` and `downloads/engineering-practices-offline.zip` names. Content, Skill and site changes trigger checks. Main pushes and manual workflow dispatches deploy; pull requests only build.

The Python HTML builder and its tests were retired after their prompt/archive/link/output-boundary contracts moved to the TypeScript and browser tests. Python is no longer a website build dependency.

The playbooks page selects one phase at a time, copies complete prompts without expanding their source, and folds installation and mode details. The standards page shows the worktree graph first, with download links alongside the introduction.

The homepage lists standards, prompts and Skill, then the talk. Standards downloads are the primary action; graph nodes offer concise hover descriptions and supporting prose lives in one closed text disclosure.

The standards introduction and chapters are inside the single Text explanation disclosure. Chapter links expand it automatically; printing expands the full content and restores the disclosure state afterwards.
