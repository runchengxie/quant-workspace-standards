import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { marked } from "marked";
import { repoRoot } from "./paths";
import type { Locale } from "./locale";
export const locales: readonly Locale[] = ["en-US", "zh-CN"];
export function text(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}
export function rendered(path: string): string {
  return marked.parse(text(path), { async: false });
}
export function documentPath(name: string, locale: Locale): string {
  if (name === "standards")
    return locale === "en-US" ? "AGENTS.md" : "AGENTS.zh-CN.md";
  return `content/${name}.${locale === "en-US" ? "en" : "zh-CN"}.md`;
}
export function promptPath(name: string, locale: Locale): string {
  return locale === "en-US"
    ? `skills/repo-maintenance/workflows/${name}.md`
    : `content/prompts/${name}.zh-CN.md`;
}
