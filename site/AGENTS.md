# Website implementation

This directory owns the Astro static site, browser TypeScript, build/download packaging and website tests. The repository root AGENTS.md is the canonical shared standard rendered by the site. AGENTS.zh-CN.md localizes it; prose and prompts live in ../docs/content and the distributable Skill lives in ../scripts/repo-maintenance. Keep project-specific website instructions here rather than adding them to the shared standard.

Use Bun 1.4.3 with bun.lock for dependency installation and script orchestration. Astro runs under Node >=22.12.0. Run commands from this directory. Keep one package-manager lockfile.

Validation:

```sh
bun install --frozen-lockfile
bun run check
bun run test:unit
bun run build --output-dir /tmp/standards-site-check
STANDARDS_SITE_OUTPUT_DIR=/tmp/standards-site-check bun run test:artifacts
STANDARDS_SITE_OUTPUT_DIR=/tmp/standards-site-check bun run test:browser
bun audit
```

Use a disposable output directory for tests and the configured project DATA_ROOT for retained previews. HTML must contain inline classic browser scripts and styles so file:// use works without a server. Preserve public route/file URLs, complete prompt text, download names. Offline file links carry presentation preferences when localStorage is unreliable; online pages use localStorage. Theme and locale must not alter source facts, prompt text or archive membership.

Theme choices are system/light/dark. Apply the initial theme before paint, persist explicit changes, and respond to system changes only in system mode. Localize visible UI, page titles and accessible names using locales.json. Keep English default and existing maintenance-locale/maintenance-theme storage keys stable.
