# Quant Workspace Standards

Workspace-wide development standards for repositories under the quant code workspace.

The root [`AGENTS.md`](AGENTS.md) is the canonical, versioned standard. Keep local workspace instructions aligned with it, record resolved `CODE_ROOT`, `DATA_ROOT`, and `CONFIG_ROOT` in local instructions or settings, and preserve each project's own `AGENTS.md`.

This repository contains general standards. Keep credentials, personal settings, machine-specific paths, raw data, and runtime artifacts outside the repository.

## Read the standards

- [Source standard](AGENTS.md)
- [GitHub Pages site](https://runchengxie.github.io/quant-workspace-standards/)
- [English standard download](https://runchengxie.github.io/quant-workspace-standards/downloads/AGENTS.md) and [Chinese translation](https://runchengxie.github.io/quant-workspace-standards/downloads/AGENTS.zh-CN.md)
- [Parallel worktree workflow](https://runchengxie.github.io/quant-workspace-standards/standards/index.html#parallel-development)

## Site content

The standards page presents the default worktree workflow and seven source-backed chapters. The playbooks page provides three complete prompts and the downloadable `repo-maintenance` Skill.

The site defaults to English and offers a persistent Simplified Chinese switch and system, light, and dark themes. Unknown locales fall back to English; missing Chinese UI translations fall back to English and then the stable key. Locale and theme affect presentation, not the source standards, prompts, or downloads.

The generated site works offline when opened from `index.html`; pages embed their styles, locale catalogs, and browser scripts. Online source links and downloads require connectivity. To install the Skill, copy the complete `skills/repo-maintenance` folder so its workflow files are included.

Machine-local path settings belong in `CONFIG_ROOT/shared/workspace.toml`. Tools must read the file or receive resolved paths through their environment; TOML does not export shell variables. Honor an existing private configuration layout or use `~/.config/<owner>/`, including an explicitly configured `XDG_CONFIG_HOME`. Tool-specific settings belong where the tool requires them.

## Build and validate

From the repository root, run `node scripts/check-doc-links.mjs` to validate local file links and Markdown heading fragments in `docs/`. CI runs this check for documentation and checker changes without building or deploying the site.

The site uses Astro 7, TypeScript, and Bun 1.4.3. Bun manages the frozen `site/bun.lock`; Astro requires Node.js 22.12.0 or newer. See [site instructions](site/AGENTS.md) for implementation boundaries.

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

Resolve `DATA_ROOT` from machine-local settings before building. The output directory must be empty or marked with this builder's `.standards-site.json`; unrelated files are rejected. The builder stages its output before publishing known files. Retained output belongs under `DATA_ROOT`; CI and tests use temporary directories. Browser tests need Chromium. Install it locally with `bunx playwright install chromium`; CI installs the browser and system dependencies.

Use `bun run dev` for local development. The builder preserves the download names `repo-maintenance.zip` and `engineering-practices-offline.zip`. The retired Python builder and its tests have been replaced by the TypeScript build and browser/artifact checks; Python is not a site build dependency.

Changes to the standards, site, content, Skill, or Pages workflow trigger checks. Pull requests build and validate without deploying. Pushes to `main` and manual workflow dispatches also deploy the Pages site.
