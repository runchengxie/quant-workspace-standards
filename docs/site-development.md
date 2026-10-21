# Build and publish the standards website

The website renders the standards and maintenance resources. These are contributor instructions, not requirements for projects adopting the standards. Commands below run from the repository root unless stated otherwise.


From the repository root, run `node scripts/check-doc-links.mjs` to validate local file links and Markdown heading fragments in source `docs/` and the root READMEs; rendered `docs/content/` links are validated against built artifacts. CI runs this check for documentation and checker changes without building or deploying the site.

The site uses Astro 7, TypeScript, and Bun 1.4.3. Bun manages the frozen `site/bun.lock`; Astro requires Node.js 22.12.0 or newer. See [site instructions](../site/AGENTS.md) for implementation boundaries.

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


Maintenance CLI checks are documented in [maintenance tools](maintenance/tools.en.md). Their separate workflow runs deterministic tests on Linux and Windows, without model calls.
