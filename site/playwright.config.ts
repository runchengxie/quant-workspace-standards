import { defineConfig } from "@playwright/test";
import { tmpdir } from "node:os";
import { join } from "node:path";
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  outputDir:
    process.env.STANDARDS_BROWSER_OUTPUT_DIR ??
    join(tmpdir(), "standards-browser-results"),
  workers: 1,
  reporter: "list",
  use: { browserName: "chromium", headless: true },
});
