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
} from "node:fs";
import { tmpdir } from "node:os";
import { validateOutput } from "../src/lib/artifacts";
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
