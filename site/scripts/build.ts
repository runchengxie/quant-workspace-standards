import { parseArgs } from "node:util";
import { dirname, join, resolve } from "node:path";
import {
  readFileSync,
  readdirSync,
  renameSync,
  rmdirSync,
  mkdtempSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { siteRoot } from "../src/lib/paths";
import {
  validateOutput,
  packageDownloads,
  publishOutput,
} from "../src/lib/artifacts";
const { values } = parseArgs({ options: { "output-dir": { type: "string" } } });
if (!values["output-dir"])
  throw new Error(
    "--output-dir is required; resolve DATA_ROOT or use a temporary CI directory",
  );
const output = validateOutput(values["output-dir"]);
const stagingOutput = mkdtempSync(join(tmpdir(), "standards-astro-build-"));
try {
  const astroPackage = join(siteRoot, "node_modules/astro/package.json");
  const astroBin: { bin: { astro: string } } = JSON.parse(
    readFileSync(astroPackage, "utf8"),
  );
  const build = spawnSync(
    "node",
    [resolve(dirname(astroPackage), astroBin.bin.astro), "build"],
    {
      cwd: siteRoot,
      stdio: "inherit",
      env: { ...process.env, STANDARDS_SITE_OUTPUT_DIR: stagingOutput },
    },
  );
  if (build.status !== 0)
    throw new Error(
      `Astro build failed: ${build.status ?? build.error?.message}`,
    );
  // Astro emits a directory for the legacy .html route. Preserve its public file URL.
  const reading = join(stagingOutput, "talk/2026-10-18/reading.html");
  if (JSON.stringify(readdirSync(reading)) !== '["index.html"]')
    throw new Error("Unexpected reading route output");
  const staging = `${reading}.staging`;
  renameSync(join(reading, "index.html"), staging);
  rmdirSync(reading);
  renameSync(staging, reading);
  packageDownloads(stagingOutput);
  publishOutput(stagingOutput, output);
} finally {
  rmSync(stagingOutput, { recursive: true });
}
