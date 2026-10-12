import { defineConfig } from "astro/config";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
const cacheId = createHash("sha256")
  .update(import.meta.dirname)
  .digest("hex")
  .slice(0, 12);
export default defineConfig({
  site: "https://runchengxie.github.io",
  base: "/quant-workspace-standards",
  output: "static",
  trailingSlash: "always",
  outDir:
    process.env.STANDARDS_SITE_OUTPUT_DIR ??
    join(tmpdir(), "standards-astro-preview"),
  cacheDir: join(tmpdir(), `standards-astro-cache-${cacheId}`),
  vite: { build: { assetsInlineLimit: Infinity } },
});
