import { resolve } from "node:path";
export const repoRoot = resolve(process.cwd(), "..");
export const siteRoot = process.cwd();
export const siteUrl =
  "https://runchengxie.github.io/quant-workspace-standards/";
export const routes = {
  home: "index.html",
  standards: "standards/index.html",
  playbooks: "playbooks/index.html",
} as const;
export const pagePaths: string[] = [
  ...Object.values(routes),
];
export type PageKey = keyof typeof routes;
