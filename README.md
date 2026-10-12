# Quant Workspace Standards

Workspace-wide development standards for repositories under the quant code workspace.

The root [`AGENTS.md`](AGENTS.md) is the canonical, versioned copy. Keep local workspace instructions aligned with these standards and record the machine's resolved `CODE_ROOT`, `DATA_ROOT`, and `CONFIG_ROOT` there or in an explicitly referenced local settings file. Preserve repository-specific instructions in each project's own `AGENTS.md`.

This repository contains general development guidance. Keep credentials, personal settings, machine-specific paths, raw data, and runtime artifacts outside the repository.

## Read the standards

- [Source standard](AGENTS.md)
- [GitHub Pages site](https://runchengxie.github.io/quant-workspace-standards/)

Machine-local shared path settings belong in `CONFIG_ROOT/shared/workspace.toml`. Use the existing private configuration layout when available; otherwise, use `~/.config/<owner>/` on both Windows and Linux, honoring an explicitly configured `XDG_CONFIG_HOME` when present. Tools must explicitly read these settings or receive the resolved paths through environment variables. Keep tool-specific settings in the locations required by the tool.


## Maintenance playbooks and talk

The Pages site includes [case studies](https://runchengxie.github.io/quant-workspace-standards/cases/), [three prompts and a downloadable Skill](https://runchengxie.github.io/quant-workspace-standards/playbooks/), and the [October 18, 2026 talk](https://runchengxie.github.io/quant-workspace-standards/talk/2026-10-18/). The talk includes keyboard navigation, fullscreen, deep links, Chinese speaker notes, a complete Chinese reading page and a downloadable offline site.

[`skills/repo-maintenance/SKILL.md`](skills/repo-maintenance/SKILL.md) routes `audit`, `code`, `docs` and `full` modes to three workflows. English workflow files are canonical and are also the English copyable prompts. [`content/prompts/`](content/prompts/) contains the corresponding zh-CN prompts. Copy the complete Skill folder into your tool's skill directory to install; copying SKILL.md alone omits the workflows.

The site defaults to English and offers a persistent Chinese switch. Unknown stored or selected locales use English; missing Chinese UI keys fall back to English, then to the key itself. `AGENTS.md` remains the English canonical standard. The Chinese talk is original commentary; case source notes distinguish repository evidence from recollection and unverified counts. The worktree/PR protocol follows existing authorization and repository controls.

## Build and validate

```sh
python -m pip install -r requirements-pages.txt
python -m unittest discover -s tests -v
python scripts/build_pages.py --output-dir "${DATA_ROOT}/quant/quant-workspace-standards/site"
```

Resolve `DATA_ROOT` from your machine's configured roots before running the build; the TOML settings file does not export it. Generated pages and retained previews belong under the configured data root. CI uses its temporary `_site` artifact directory. Tests use disposable temporary directories.

Open the generated `index.html` directly, or serve the generated directory with a static HTTP server. Pages contain their styles, scripts and UI catalogs inline; the talk does not require an API or a network connection. The QR code points to the online playbooks page. Offline navigation and prompts remain available in the downloaded archive; online downloads and source PR links require connectivity.

Edit `content/`, `site/locales.json`, `site/assets/` or the canonical Skill workflows, then rebuild. The deployment workflow validates and builds on content/Skill/site changes. Main pushes and manual workflow dispatches deploy; pull requests only build. The builder creates `downloads/repo-maintenance.zip` and `downloads/engineering-practices-offline.zip`; it never scans arbitrary directories into the archives.
