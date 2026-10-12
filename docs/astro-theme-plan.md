# Astro migration, themes and complete standards localization

The user approved migrating the existing site to Astro + TypeScript and requested dark mode plus Chinese standards body text.

- Preserve all six page URLs, canonical Markdown and Skill sources, exact copyable prompt text, QR link and both downloads.
- Replace Python HTML generation with shared Astro layout/components and typed content readers. Bun manages the single frozen lockfile; Node runs Astro's CLI. No React dependency is needed.
- Compile browser TypeScript into inline classic scripts and inline styles so file:// navigation remains usable in the offline bundle.
- Provide system/light/dark selection. Default to system, persist explicit selection, apply before paint, react to system changes only in system mode, and tolerate denied storage. Localize labels, brand, accessible names and page titles.
- English AGENTS.md remains canonical. Add equivalent zh-CN content for all sections and render the body selected by locale, preserving machine identifiers.
- Before implementation, reproduce missing theme and missing Chinese body against the previous build. Preserve portability, prompt/archive/link checks and add browser regressions for themes, localization, slides and offline use.
- Run Astro/type checks, build/artifact checks, browser checks and dependency audit. Review, submit PR, merge only after remote gates pass, verify deployment and clean up this task.
