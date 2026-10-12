import { resolve } from "node:path";
export const repoRoot = resolve(process.cwd(), "..");
export const siteRoot = process.cwd();
export const siteUrl =
  "https://runchengxie.github.io/quant-workspace-standards/";
export const routes = {
  home: "index.html",
  standards: "standards/index.html",
  cases: "cases/index.html",
  playbooks: "playbooks/index.html",
  talk: "talk/2026-10-18/index.html",
} as const;
export const pagePaths = [
  ...Object.values(routes),
  "talk/2026-10-18/reading.html",
];
export type PageKey = keyof typeof routes | "readingTitle";
