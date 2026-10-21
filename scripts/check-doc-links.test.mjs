import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, test } from "node:test";
import { checkMarkdownLinks, extractMarkdownLinks, documentationFiles } from "./check-doc-links.mjs";

const temporaryRoots = [];

afterEach(() => {
  for (const root of temporaryRoots.splice(0))
    rmSync(root, { recursive: true, force: true });
});

test("extracts inline, image, and reference links while ignoring code spans and fences", () => {
  const source = [
    "[valid](guide.md#setup) ![diagram](images/flow.svg)",
    "[reference][guide]",
    "[guide]: <../README.md> \"project guide\"",
    "`[inline code](missing.md)`",
    "```md",
    "[fenced code](missing-too.md)",
    "```",
    "[web](https://example.com)",
  ].join("\n");

  assert.deepEqual(
    extractMarkdownLinks(source).map(({ destination }) => destination),
    ["guide.md#setup", "images/flow.svg", "../README.md", "https://example.com"],
  );
});

test("checks local files and Markdown heading fragments, including duplicate slugs", () => {
  const root = mkdtempSync(join(tmpdir(), "doc-link-check-"));
  temporaryRoots.push(root);
  mkdirSync(join(root, "docs"), { recursive: true });
  writeFileSync(join(root, "README.md"), "# Workspace\n");
  writeFileSync(
    join(root, "docs", "guide.md"),
    "# Setup\n\n# Setup\n\n# Install `bun`\n",
  );
  writeFileSync(
    join(root, "docs", "index.md"),
    "[readme](../README.md#workspace) [second heading](guide.md#setup-1) [code heading](guide.md#install-bun) [external](https://example.com)",
  );

  assert.deepEqual(checkMarkdownLinks(root, ["docs/index.md"]), []);
});

test("reports missing files and missing heading fragments with source locations", () => {
  const root = mkdtempSync(join(tmpdir(), "doc-link-check-"));
  temporaryRoots.push(root);
  mkdirSync(join(root, "docs"), { recursive: true });
  writeFileSync(join(root, "docs", "guide.md"), "# Existing heading\n");
  writeFileSync(
    join(root, "docs", "index.md"),
    "[missing](absent.md)\n\n[missing heading](guide.md#not-there)",
  );

  assert.deepEqual(checkMarkdownLinks(root, ["docs/index.md"]), [
    "docs/index.md:1: missing local target 'absent.md'",
    "docs/index.md:3: missing heading '#not-there' in 'docs/guide.md'",
  ]);
});

test("rejects local links that escape the repository", () => {
  const root = mkdtempSync(join(tmpdir(), "doc-link-check-"));
  temporaryRoots.push(root);
  mkdirSync(join(root, "docs"), { recursive: true });
  writeFileSync(join(root, "docs", "index.md"), "[outside](../../outside.md)");

  assert.deepEqual(checkMarkdownLinks(root, ["docs/index.md"]), [
    "docs/index.md:1: local target escapes the repository: '../../outside.md'",
  ]);
});

test("rejects symlinks that resolve outside the repository", () => {
  const root = mkdtempSync(join(tmpdir(), "doc-link-check-"));
  const outside = mkdtempSync(join(tmpdir(), "doc-link-outside-"));
  temporaryRoots.push(root, outside);
  mkdirSync(join(root, "docs"), { recursive: true });
  writeFileSync(join(outside, "outside.md"), "# Outside\n");
  symlinkSync(join(outside, "outside.md"), join(root, "docs", "linked.md"));
  writeFileSync(join(root, "docs", "index.md"), "[outside](linked.md)");

  assert.deepEqual(checkMarkdownLinks(root, ["docs/index.md"]), [
    "docs/index.md:1: local target resolves outside the repository: 'linked.md'",
  ]);
});


test("source docs include root readmes while rendered content is checked by site artifacts", () => {
  const root = mkdtempSync(join(tmpdir(), "standards-doc-selection-"));
  temporaryRoots.push(root);
  mkdirSync(join(root, "docs/content"), { recursive: true });
  writeFileSync(join(root, "README.md"), "# Readme\n");
  writeFileSync(join(root, "docs/guide.md"), "# Guide\n");
  writeFileSync(join(root, "docs/content/page.md"), "[Download](../downloads/file.zip)\n");
  assert.deepEqual(documentationFiles(root).sort(), ["README.md", "docs/guide.md"]);
});
