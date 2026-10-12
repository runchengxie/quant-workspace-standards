import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { parse, type DefaultTreeAdapterMap } from "parse5";
import { unzipSync, strFromU8 } from "fflate";
import { marked } from "marked";
import { repoRoot, pagePaths } from "../src/lib/paths";
import { promptPath } from "../src/lib/content";

type HtmlNode = DefaultTreeAdapterMap["node"];
function nodes(node: HtmlNode): HtmlNode[] {
  return [
    node,
    ...("childNodes" in node ? node.childNodes.flatMap(nodes) : []),
  ];
}
function attribute(node: HtmlNode, name: string): string | undefined {
  return "attrs" in node
    ? node.attrs.find((attribute) => attribute.name === name)?.value
    : undefined;
}
function contents(node: HtmlNode): string {
  return "value" in node
    ? node.value
    : "childNodes" in node
      ? node.childNodes.map(contents).join("")
      : "";
}
function linksAndIds(html: string): {
  ids: string[];
  links: string[];
  tree: HtmlNode[];
} {
  const tree = nodes(parse(html));
  const ids = tree.flatMap((node) =>
    attribute(node, "id") ? [attribute(node, "id")!] : [],
  );
  const links = tree.flatMap((node) =>
    attribute(node, "href") ? [attribute(node, "href")!] : [],
  );
  assert.equal(ids.length, new Set(ids).size, "Duplicate HTML ids");
  for (const node of tree) {
    if ("tagName" in node && node.tagName === "script")
      assert.equal(
        attribute(node, "src"),
        undefined,
        "Offline script must be inline",
      );
    if (attribute(node, "rel") === "stylesheet")
      throw new Error("Offline CSS must be inline");
  }
  return { ids, links, tree };
}
const output = process.env.STANDARDS_SITE_OUTPUT_DIR;
if (!output)
  throw new Error("STANDARDS_SITE_OUTPUT_DIR must point to the built site");
const htmlFiles = new Map(
  pagePaths.map((path) => [path, readFileSync(resolve(output, path), "utf8")]),
);
const offline = unzipSync(
  readFileSync(resolve(output, "downloads/engineering-practices-offline.zip")),
);
const skill = unzipSync(
  readFileSync(resolve(output, "downloads/repo-maintenance.zip")),
);
const expectedSkill = [
  "SKILL.md",
  "references/evidence.md",
  "workflows/code.md",
  "workflows/docs.md",
  "workflows/closeout.md",
]
  .map((path) => `repo-maintenance/${path}`)
  .sort();
assert.deepEqual(Object.keys(skill).sort(), expectedSkill);
for (const path of expectedSkill)
  assert.deepEqual(
    skill[path],
    new Uint8Array(readFileSync(resolve(repoRoot, "skills", path))),
  );
for (const [path, source] of htmlFiles) {
  const parsed = linksAndIds(source);
  assert.equal(strFromU8(offline[path]!), source);
  for (const link of parsed.links) {
    if (/^(https?:|mailto:|data:)/.test(link)) continue;
    const url = new URL(link, `https://offline.invalid/${path}`);
    const target = decodeURIComponent(url.pathname).slice(1);
    assert.ok(offline[target], `Missing offline link: ${path} -> ${link}`);
    if (url.hash)
      assert.ok(
        linksAndIds(strFromU8(offline[target]!)).ids.includes(
          decodeURIComponent(url.hash.slice(1)),
        ),
        `Missing fragment ${link}`,
      );
  }
}
const prompts = linksAndIds(htmlFiles.get("playbooks/index.html")!).tree;
const standards = linksAndIds(htmlFiles.get("standards/index.html")!).tree;
for (const locale of ["en-US", "zh-CN"]) {
  const panel = standards.find(node => attribute(node, "data-locale") === locale);
  assert.ok(panel);
  const parts = nodes(panel).filter(node => {
    const classes = attribute(node, "class")?.split(" ") ?? [];
    return classes.includes("standard-intro") || classes.includes("chapter-body") || ("tagName" in node && node.tagName === "h2");
  });
  const expected = marked.parse(readFileSync(resolve(repoRoot, locale === "en-US" ? "AGENTS.md" : "AGENTS.zh-CN.md"), "utf8"), { async: false });
  const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
  assert.equal(normalize(parts.map(contents).join(" ")), normalize(contents(parse(expected))), "Folding must preserve complete standards text and order");
}
for (const workflow of ["code", "docs", "closeout"]) {
  for (const locale of ["en-US", "zh-CN"] as const) {
    const pre = prompts.find(
      (node) => attribute(node, "id") === `prompt-${workflow}-${locale}`,
    );
    assert.ok(pre);
    assert.equal(
      contents(pre),
      readFileSync(resolve(repoRoot, promptPath(workflow, locale)), "utf8"),
      "Copied prompt must preserve full source",
    );
  }
}
const expectedArchive = [
  ...pagePaths,
  "downloads/AGENTS.md",
  "downloads/AGENTS.zh-CN.md",
  "downloads/repo-maintenance.zip",
  ...expectedSkill.map((path) => `downloads/${path}`),
].sort();
assert.deepEqual(Object.keys(offline).sort(), expectedArchive);
for (const name of ["AGENTS.md", "AGENTS.zh-CN.md"]) {
  const source = new Uint8Array(readFileSync(resolve(repoRoot, name)));
  assert.deepEqual(new Uint8Array(readFileSync(resolve(output, "downloads", name))), source);
  assert.deepEqual(offline[`downloads/${name}`], source);
}
for (const path of Object.keys(offline)) {
  assert.ok(!relative("/", resolve("/", path)).startsWith(".."));
  assert.ok(!path.startsWith("/") && !path.split("/").includes(".."));
}
console.log(
  "Artifact checks passed: six routes, all offline links/fragments, exact prompts, complete Skill and restricted archive.",
);
