import { test } from "node:test";
import assert from "node:assert/strict";
import { join, dirname } from "node:path";
import {
  mkdtempSync,
  mkdirSync,
  symlinkSync,
  rmSync,
  writeFileSync,
  readFileSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { validateOutput, publishOutput, generatedFiles } from "../src/lib/artifacts";
import { repoRoot } from "../src/lib/paths";
test("output validation protects source and its parents, including symlinks", () => {
  for (const path of [
    repoRoot,
    dirname(repoRoot),
    join(repoRoot, "content/output"),
    join(repoRoot, "site/src/output"),
    join(repoRoot, "..generated"),
  ]) {
    assert.throws(() => validateOutput(path), /dedicated generated-site/);
  }
  const temp = mkdtempSync(join(tmpdir(), "standards-output-"));
  try {
    symlinkSync(join(repoRoot, "content"), join(temp, "source"), "dir");
    assert.throws(
      () => validateOutput(join(temp, "source/site")),
      /dedicated generated-site/,
    );
    mkdirSync(join(temp, "site"));
    assert.equal(validateOutput(join(temp, "site")), join(temp, "site"));
  } finally {
    rmSync(temp, { recursive: true });
  }
});

test("existing unrelated output is preserved instead of being emptied by Astro", () => {
  const temp = mkdtempSync(join(tmpdir(), "standards-unowned-"));
  try {
    writeFileSync(join(temp, "user-data.txt"), "keep");
    assert.throws(() => validateOutput(temp), /unowned/);
    assert.equal(readFileSync(join(temp, "user-data.txt"), "utf8"), "keep");
  } finally {
    rmSync(temp, { recursive: true });
  }
});


test("publishing removes a retired generated cases page only when the prior manifest owns it", () => {
  const temp = mkdtempSync(join(tmpdir(), "standards-retired-"));
  try {
    const staging = join(temp, "staging");
    const output = join(temp, "output");
    for (const path of generatedFiles) {
      mkdirSync(dirname(join(staging, path)), { recursive: true });
      writeFileSync(join(staging, path), "new");
    }
    mkdirSync(join(output, "cases"), { recursive: true });
    writeFileSync(join(output, "cases/index.html"), "old case page");
    writeFileSync(join(output, ".standards-site.json"), JSON.stringify({ owner: "quant-workspace-standards", files: [...generatedFiles, "cases/index.html"] }));
    publishOutput(staging, output);
    assert.equal(existsSync(join(output, "cases/index.html")), false);
    assert.equal(readFileSync(join(output, "index.html"), "utf8"), "new");
    mkdirSync(join(output, "cases"));
    writeFileSync(join(output, "cases/index.html"), "user-owned content");
    assert.throws(() => publishOutput(staging, output), /unowned/);
    assert.equal(readFileSync(join(output, "cases/index.html"), "utf8"), "user-owned content");
  } finally { rmSync(temp, { recursive: true }); }
});

test("failed publication leaves the previously published site intact", () => {
  const temp = mkdtempSync(join(tmpdir(), "standards-publish-failure-"));
  try {
    const staging = join(temp, "staging");
    const output = join(temp, "output");
    for (const path of generatedFiles) {
      mkdirSync(dirname(join(staging, path)), { recursive: true });
      writeFileSync(join(staging, path), "new site");
      mkdirSync(dirname(join(output, path)), { recursive: true });
      writeFileSync(join(output, path), "previous site");
    }
    writeFileSync(
      join(output, ".standards-site.json"),
      JSON.stringify({ owner: "quant-workspace-standards", files: generatedFiles }),
    );
    const missing = generatedFiles.at(-1)!;
    rmSync(join(staging, missing));

    assert.throws(() => publishOutput(staging, output));
    assert.equal(readFileSync(join(output, generatedFiles[0]!), "utf8"), "previous site");
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});
