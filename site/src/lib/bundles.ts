import { buildSync } from "esbuild";
import { resolve } from "node:path";
import { siteRoot } from "./paths";
function bundle(name: string): string {
  const result = buildSync({
    entryPoints: [resolve(siteRoot, `src/client/${name}.ts`)],
    bundle: true,
    write: false,
    format: "iife",
    target: "es2022",
    platform: "browser",
    minify: true,
  });
  const output = result.outputFiles?.[0];
  if (!output) throw new Error(`No browser output for ${name}`);
  return output.text.replaceAll("</script", "<\\/script");
}
export const themeScript = bundle("theme-init");
export const mainScript = bundle("main");
