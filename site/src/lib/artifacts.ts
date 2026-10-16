import { dirname, join, relative, resolve, sep, isAbsolute } from "node:path";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  readdirSync,
  copyFileSync,
  mkdtempSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { zipSync } from "fflate";
import { pagePaths, repoRoot } from "./paths";
function within(parent: string, child: string): boolean {
  const path = relative(parent, child);
  return (
    path === "" ||
    (!path.startsWith(`..${sep}`) && path !== ".." && !isAbsolute(path))
  );
}
export const talkAssetPaths = [
  "assets/talk/2026-10-18/tuning-reaction.jpg",
  "assets/talk/2026-10-18/safeguard-reaction.png",
];
export const generatedFiles = [
  ...talkAssetPaths,
  ...pagePaths,
  ".nojekyll",
  "downloads/AGENTS.md",
  "downloads/AGENTS.zh-CN.md",
  "downloads/repo-maintenance.zip",
  "downloads/engineering-practices-offline.zip",
  ...[
    "SKILL.md",
    "references/evidence.md",
    "workflows/code.md",
    "workflows/docs.md",
    "workflows/closeout.md",
  ].map((path) => `downloads/repo-maintenance/${path}`),
];
const marker = ".standards-site.json";
const retiredFiles = ["cases/index.html"];
type Manifest = { owner?: string; files?: unknown };
function ownedRetiredFiles(manifest: Manifest): string[] {
  return Array.isArray(manifest.files)
    ? retiredFiles.filter(path => (manifest.files as unknown[]).includes(path))
    : [];
}
function filesWithin(path: string): string[] {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isSymbolicLink())
      throw new Error("Generated output cannot contain symlinks");
    return entry.isDirectory()
      ? filesWithin(join(path, entry.name)).map(
          (child) => `${entry.name}/${child}`,
        )
      : [entry.name];
  });
}
export function validateOutput(path: string): string {
  let ancestor = resolve(path);
  const suffix: string[] = [];
  while (!existsSync(ancestor)) {
    suffix.unshift(relative(dirname(ancestor), ancestor));
    ancestor = dirname(ancestor);
  }
  const output = resolve(realpathSync(ancestor), ...suffix);
  const root = realpathSync(repoRoot);
  if (
    within(output, root) ||
    (within(root, output) && output !== join(root, "_site"))
  ) {
    throw new Error(
      "Output must be a dedicated generated-site directory outside source",
    );
  }
  if (existsSync(output) && readdirSync(output).length) {
    const manifestPath = join(output, marker);
    if (!existsSync(manifestPath))
      throw new Error("Refusing to overwrite an unowned output directory");
    const manifest: Manifest = JSON.parse(
      readFileSync(manifestPath, "utf8"),
    );
    if (manifest.owner !== "quant-workspace-standards")
      throw new Error("Unrecognized output owner");
    const known = new Set([...generatedFiles, ...ownedRetiredFiles(manifest), marker]);
    if (filesWithin(output).some((path) => !known.has(path)))
      throw new Error("Output contains unowned files");
  }
  return output;
}
export function publishOutput(staging: string, outputPath: string): void {
  const output = validateOutput(outputPath);
  const parent = dirname(output);
  mkdirSync(parent, { recursive: true });
  const transaction = mkdtempSync(join(parent, ".standards-site-publish-"));
  const next = join(transaction, "next");
  const previous = join(transaction, "previous");

  try {
    for (const path of generatedFiles) {
      const destination = join(next, path);
      mkdirSync(dirname(destination), { recursive: true });
      copyFileSync(join(staging, path), destination);
    }
    writeFileSync(
      join(next, marker),
      JSON.stringify({
        owner: "quant-workspace-standards",
        files: generatedFiles,
      }) + "\n",
    );

    const hadOutput = existsSync(output);
    if (hadOutput) renameSync(output, previous);
    try {
      renameSync(next, output);
    } catch (error) {
      if (hadOutput) renameSync(previous, output);
      throw error;
    }
  } finally {
    rmSync(transaction, { recursive: true, force: true });
  }
}
export function packageDownloads(output: string): void {
  const skillPaths = [
    "SKILL.md",
    "references/evidence.md",
    "workflows/code.md",
    "workflows/docs.md",
    "workflows/closeout.md",
  ];
  const skill: Record<string, Uint8Array> = {};
  for (const path of skillPaths) {
    const name = `repo-maintenance/${path}`;
    const source = readFileSync(join(repoRoot, "skills", name));
    skill[name] = source;
    const destination = join(output, "downloads", name);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, source);
  }
  const archive = zipSync(skill, { level: 9 });
  writeFileSync(join(output, "downloads/repo-maintenance.zip"), archive);
  const offline: Record<string, Uint8Array> = {
    "downloads/repo-maintenance.zip": archive,
  };
  for (const name of ["AGENTS.md", "AGENTS.zh-CN.md"]) {
    const source = readFileSync(join(repoRoot, name));
    writeFileSync(join(output, "downloads", name), source);
    offline[`downloads/${name}`] = source;
  }
  for (const path of [...pagePaths, ...talkAssetPaths])
    offline[path] = readFileSync(join(output, path));
  for (const [name, source] of Object.entries(skill))
    offline[`downloads/${name}`] = source;
  writeFileSync(
    join(output, "downloads/engineering-practices-offline.zip"),
    zipSync(offline, { level: 9 }),
  );
  writeFileSync(join(output, ".nojekyll"), "");
}
