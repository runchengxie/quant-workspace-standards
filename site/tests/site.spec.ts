import { test, expect } from "@playwright/test";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { pagePaths } from "../src/lib/paths";
const output = process.env.STANDARDS_SITE_OUTPUT_DIR;
if (!output)
  throw new Error("STANDARDS_SITE_OUTPUT_DIR must point to a built site");
const url = (path: string) => pathToFileURL(resolve(output, path)).href;

let server: Server;
let origin: string;
test.beforeAll(async () => {
  server = createServer((request, response) => {
    const pathname = new URL(request.url ?? "/", "http://local").pathname;
    const path = pathname
      .replace(/^\/quant-workspace-standards\//, "")
      .replace(/\/$/, "/index.html");
    const isStandard = ["downloads/AGENTS.md", "downloads/AGENTS.zh-CN.md"].includes(path);
    if (!pagePaths.includes(path) && !isStandard) {
      response.writeHead(404);
      response.end();
      return;
    }
    response.setHeader("Content-Type", isStandard ? "text/plain; charset=utf-8" : "text/html; charset=utf-8");
    response.end(readFileSync(resolve(output!, path)));
  });
  await new Promise<void>((ready, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", ready);
  });
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("No HTTP test address");
  origin = `http://127.0.0.1:${address.port}/quant-workspace-standards`;
});
test.afterAll(async () => {
  await new Promise<void>((done, reject) =>
    server.close((error) => (error ? reject(error) : done())),
  );
});

test("standards downloads preserve both source files and the diagram localizes", async ({ page }) => {
  await page.goto(`${origin}/standards/`);
  for (const name of ["AGENTS.md", "AGENTS.zh-CN.md"]) {
    const downloading = page.waitForEvent("download");
    await page.locator(`a[download="${name}"]`).click();
    const download = await downloading;
    expect(download.suggestedFilename()).toBe(name);
    const path = await download.path();
    expect(path).toBeTruthy();
    expect(readFileSync(path!)).toEqual(readFileSync(new URL(`../../${name}`, import.meta.url)));
  }
  await page.selectOption(".locale", "zh-CN");
  await expect(page.locator("#flow-title")).toHaveText("开发流程示意图");
  await expect(page.locator(".flow-lane")).toHaveCount(3);
  await page.locator(".worktree-flow .flow-notes > summary").click();
  await page.locator(".flow-coordination > summary").click();
  await expect(page.locator(".coordination-table")).toContainText("更新需要协调");
  await page.setViewportSize({ width: 320, height: 900 });
  for (const locale of ["en-US", "zh-CN"]) {
    await page.selectOption(".locale", locale);
    for (const theme of ["light", "dark"]) {
      await page.selectOption(".theme", theme);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
});

test("online preferences persist across routes without changing content or URLs", async ({
  page,
}) => {
  await page.goto(`${origin}/standards/`);
  await page.selectOption(".theme", "dark");
  await page.selectOption(".locale", "zh-CN");
  await page.locator('nav [data-i18n="playbooks"]').click();
  await expect(page.locator(".theme")).toHaveValue("dark");
  await expect(page.locator(".locale")).toHaveValue("zh-CN");
  expect(new URL(page.url()).search).toBe("");
  const source = readFileSync(
    new URL("../../content/prompts/code.zh-CN.md", import.meta.url),
    "utf8",
  );
  expect(await page.locator(".prompt:visible pre").first().textContent()).toBe(
    source,
  );
  await page.selectOption(".theme", "light");
  expect(await page.locator(".prompt:visible pre").first().textContent()).toBe(
    source,
  );
  await page.reload();
  await expect(page.locator(".theme")).toHaveValue("light");
  await expect(page.locator(".locale")).toHaveValue("zh-CN");
});

test("Chinese selection changes standards body, brand and page title", async ({
  page,
}) => {
  await page.goto(url("standards/index.html"));
  await page.locator(".flow-notes > summary").click();
  await page.locator(".flow-standard > summary").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.selectOption(".locale", "zh-CN");
  await expect(page.locator(".standard-intro h1:visible")).toHaveText("代码工作区规范");
  await expect(page.locator(".brand")).toHaveText("项目开发 · 工程实践");
  await expect(page).toHaveTitle(/开发规范/);
  await expect(page.locator("main")).toContainText("固定的目录名称");
  await expect(page.locator('[data-locale="en-US"]')).toBeHidden();
  await page.locator('nav [data-i18n="playbooks"]').click();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
});
test("system changes are live, while explicit themes persist across routes and reload", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto(url("index.html"));
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".theme")).toHaveValue("system");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.selectOption(".theme", "dark");
  await page.locator('nav [data-i18n="standards"]').click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator(".theme")).toHaveValue("dark");
  await page.selectOption(".theme", "light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.selectOption(".theme", "system");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
test("denied storage still permits theme and locale changes", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("denied", "SecurityError");
      },
    }),
  );
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto(url("standards/index.html"));
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.selectOption(".theme", "light");
  await page.selectOption(".locale", "zh-CN");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.locator(".flow-notes > summary").click();
  await page.locator(".flow-standard > summary").click();
  await expect(page.locator(".standard-intro h1:visible")).toHaveText("代码工作区规范");
});
test("invalid stored preferences fall back without breaking the page", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("maintenance-locale", "unknown");
    localStorage.setItem("maintenance-theme", "invalid");
  });
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto(url("index.html"));
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator(".theme")).toHaveValue("system");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
test("clipboard denial selects the complete prompt, independent of theme", async ({
  page,
}) => {
  await page.goto(url("playbooks/index.html"));
  await page.selectOption(".locale", "zh-CN");
  await page.selectOption(".theme", "dark");
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.reject(new Error("denied")) },
      configurable: true,
    }),
  );
  await page.locator(".prompt:visible button").first().click();
  await expect(page.locator("#copy-status")).toContainText("Ctrl+C");
  const source = readFileSync(
    new URL("../../content/prompts/code.zh-CN.md", import.meta.url),
    "utf8",
  );
  expect(await page.locator(".prompt:visible pre").first().textContent()).toBe(
    source,
  );
  expect(await page.evaluate(() => window.getSelection()?.toString())).toBe(
    source.trimEnd(),
  );
});
test("offline slides preserve navigation, notes, QR and eight-minute label", async ({
  page,
}) => {
  const failures: string[] = [];
  page.on("pageerror", (error) => failures.push(error.message));
  await page.route(/^https?:/, (route) => route.abort());
  await page.goto(url("talk/2026-10-18/index.html"));
  await page.selectOption(".locale", "zh-CN");
  await expect(page.locator(".slide:visible")).toContainText("约 8 分钟");
  await page.locator("main").click({ position: { x: 2, y: 2 } });
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#page-count")).toHaveText("2 / 4");
  expect(page.url()).toContain("#customers");
  await page.keyboard.press("End");
  await expect(page.locator("#page-count")).toHaveText("4 / 4");
  await expect(page.locator(".qr svg")).toBeVisible();
  await page.keyboard.press("n");
  await expect(page.locator("#speaker-notes")).toBeVisible();
  expect(failures).toEqual([]);
});
test("all slides fit the projector in both themes and languages", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(url("talk/2026-10-18/index.html"));
  const ids = await page
    .locator(".slide")
    .evaluateAll((slides) => slides.map((slide) => slide.id));
  for (const theme of ["light", "dark"]) {
    await page.selectOption(".theme", theme);
    for (const locale of ["en-US", "zh-CN"]) {
      await page.selectOption(".locale", locale);
      for (const id of ids) {
        await page.evaluate((id) => {
          location.hash = id;
        }, id);
        await expect(page.locator(".slide:visible")).toHaveAttribute("id", id);
        expect(
          await page
            .locator(".deck-controls")
            .evaluate((el) => el.getBoundingClientRect().bottom),
          `${theme}/${locale}/${id}`,
        ).toBeLessThanOrEqual(720);
      }
    }
  }
});
test("mobile pages stay within the viewport in either theme", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    "index.html",
    "standards/index.html",
    "playbooks/index.html",
    "talk/2026-10-18/index.html",
  ]) {
    await page.goto(url(route));
    await page.selectOption(".locale", "zh-CN");
    for (const theme of ["light", "dark"]) {
      await page.selectOption(".theme", theme);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  }
});

test("stale online preference parameters do not override a newer explicit choice", async ({
  page,
}) => {
  await page.goto(`${origin}/standards/?theme=dark&locale=zh-CN`);
  await page.selectOption(".theme", "light");
  await page.selectOption(".locale", "en-US");
  await page.reload();
  await expect(page.locator(".theme")).toHaveValue("light");
  await expect(page.locator(".locale")).toHaveValue("en-US");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});


test("standards chapters support defaults, bulk controls, deep links and printing", async ({ page }) => {
  await page.goto(url("standards/index.html"));
  await expect(page.locator('.standard-intro:visible')).toHaveCount(0);
  await page.locator('.flow-notes > summary').click();
  await page.locator('.flow-standard > summary').click();
  const chapters = page.locator('.document:visible details.standard-chapter');
  await expect(chapters).toHaveCount(7);
  await expect(chapters.filter({ has: page.locator('[data-chapter="workflow"]') })).toHaveJSProperty('open', false);
  await page.locator('.chapter-controls:visible [data-collapse-all]').click();
  await expect(page.locator('.document:visible details[open]')).toHaveCount(0);
  await page.locator('.chapter-controls:visible [data-expand-all]').click();
  await expect(page.locator('.document:visible details[open]')).toHaveCount(7);
  await page.locator('.chapter-controls:visible [data-collapse-all]').click();
  await page.goto(url("standards/index.html") + '#standard-data');
  await expect(page.locator('.flow-notes')).toHaveJSProperty('open', true);
  await expect(page.locator('#standard-data')).toHaveAttribute('open', '');
  await page.selectOption('.locale', 'zh-CN');
  await expect(page.locator('#standard-data-zh-CN')).toHaveAttribute('open', '');
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  await expect(page.locator('.document:visible details[open]')).toHaveCount(7);
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  await expect(page.locator('.document:visible details[open]')).toHaveCount(1);
});

test("worktree demonstration is opt-in, pausable, localized and respects reduced motion", async ({ page }) => {
  await page.goto(url("standards/index.html"));
  await expect(page.locator('.graph-wide')).toBeVisible();
  await expect(page.locator('.standard-intro:visible')).toHaveCount(0);
  await expect(page.locator('.flow-notes')).toHaveJSProperty('open', false);
  await expect(page.locator('#flow-demo')).toHaveAttribute('data-step', '7');
  await page.locator('#flow-play').click();
  await expect(page.locator('#flow-play')).toHaveAccessibleName('Pause');
  await expect(page.locator('#flow-play .flow-pause-icon')).toBeVisible();
  await expect(page.locator('#flow-play .flow-play-icon')).toBeHidden();
  await expect(page.locator('#flow-demo')).toHaveAttribute('data-step', '0');
  await page.locator('#flow-play').click();
  await page.waitForTimeout(2300);
  await expect(page.locator('#flow-demo')).toHaveAttribute('data-step', '0');
  for (let i = 0; i < 4; i++) await page.locator('#flow-next').click();
  await expect(page.locator('#flow-status')).toContainText('B');
  await page.selectOption('.locale', 'zh-CN');
  await expect(page.locator('#flow-status')).toContainText('先合入');
  await page.locator('#flow-next').click();
  await expect(page.locator('#flow-status')).toContainText('重新验证');
  await page.locator('#flow-replay').click();
  await expect(page.locator('#flow-demo')).toHaveAttribute('data-step', '0');
  await page.locator('#flow-play').click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('#flow-demo')).toHaveAttribute('data-reduced-motion', 'true');
  expect(await page.locator('.graph-wide .task-track').first().evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0s');
  await page.setViewportSize({ width: 320, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.clock.install();
  await page.locator('#flow-play').click();
  await page.clock.runFor(15400);
  await expect(page.locator('#flow-demo')).toHaveAttribute('data-step', '7');
  await expect(page.locator('#flow-play')).toHaveAccessibleName('播放演示');
  await expect(page.locator('#flow-play .flow-play-icon')).toBeVisible();
  await expect(page.locator('#flow-next')).toHaveAccessibleName('下一步');
  await expect(page.locator('#flow-replay')).toHaveAccessibleName('重播');
  await expect(page.locator('#flow-next')).toBeDisabled();
});

test("without JavaScript the full diagram and native chapters remain usable", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(url('standards/index.html'));
  await expect(page.locator('.graph-wide')).toBeVisible();
  await expect(page.locator('.flow-controls')).toBeHidden();
  await expect(page.locator('.chapter-controls:visible')).toHaveCount(0);
  await page.locator('.flow-notes > summary').click();
  await page.locator('.flow-standard > summary').click();
  await page.locator('#standard-data summary').click();
  await expect(page.locator('#standard-data')).toHaveAttribute('open', '');
  await expect(page.locator('#standard-data .chapter-body')).toContainText('DATA_ROOT');
  await context.close();
});


test("missing UI translations fall back to English and then the stable key", async ({ page }) => {
  const html = readFileSync(resolve(output!, "index.html"), "utf8");
  const pattern = /(<script[^>]*id="locale-catalog"[^>]*>)([\s\S]*?)(<\/script>)/;
  const match = pattern.exec(html);
  if (!match) throw new Error("Built locale catalog missing");
  const catalog = JSON.parse(match[2]!) as Record<string, Record<string, string>>;
  const englishBrand = catalog["en-US"]!["brand"]!;
  delete catalog["zh-CN"]!["brand"];
  const fixture = html.replace(pattern, (_, start, _body, end) => start + JSON.stringify(catalog) + end)
    .replace("</body>", '<span id="missing-ui-key" data-i18n="testMissingKey"></span></body>');
  await page.route(`${origin}/index.html`, route => route.fulfill({ contentType: "text/html", body: fixture }));
  await page.goto(`${origin}/index.html`);
  await page.selectOption(".locale", "zh-CN");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(page.locator(".brand")).toHaveText(englishBrand);
  await expect(page.locator("#missing-ui-key")).toHaveText("testMissingKey");
});

test("home presents three entries and playbooks presents two ways to do the same work", async ({ page }) => {
  await page.goto(url('index.html'));
  await expect(page.locator('main h1:visible')).toHaveText('AI can write code. Who maintains the system?');
  await expect(page.locator('.locale-panel:visible .handbook-index li')).toHaveCount(3);
  await page.selectOption('.locale', 'zh-CN');
  await expect(page.locator('main h1:visible')).toHaveText('AI 能写代码，谁来维护系统？');
  await expect(page.locator('[data-locale="zh-CN"] .handbook-index a')).toHaveText(['开发规范', '提示词与 Skill', '10 月 18 日分享']);
  await expect(page.locator('main')).not.toContainText('适用范围');
  await page.selectOption('.locale', 'en-US');
  await page.locator('nav [data-i18n="playbooks"]').click();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.locator('.prompt-version')).toBeVisible();
  await expect(page.locator('.skill-version')).toBeVisible();
  const left = await page.locator('.prompt-version').boundingBox();
  const right = await page.locator('.skill-version').boundingBox();
  expect(right!.x).toBeGreaterThan(left!.x + left!.width);
  await expect(page.locator('.skill-version')).toContainText('full');
  await expect(page.locator('.prompt-switch button')).toHaveCount(3);
  await expect(page.locator('.prompt-stage:visible')).toHaveAttribute('data-stage', 'code');
  await expect(page.locator('.prompt:visible details')).toHaveJSProperty('open', false);
  await expect(page.locator('.skill-version .locale-panel:visible details[open]')).toHaveCount(0);
  await page.locator('[data-phase="docs"]').click();
  await expect(page.locator('.prompt-stage:visible')).toHaveAttribute('data-stage', 'docs');
  await page.locator('[data-phase="closeout"]').click();
  await expect(page.locator('.prompt-stage:visible')).toHaveAttribute('data-stage', 'closeout');
  await page.selectOption('.locale', 'zh-CN');
  await expect(page.locator('main h1')).toHaveText('仓库维护');
  await page.setViewportSize({ width: 320, height: 900 });
  const narrowLeft = await page.locator('.prompt-version').boundingBox();
  const narrowRight = await page.locator('.skill-version').boundingBox();
  expect(narrowRight!.y).toBeGreaterThan(narrowLeft!.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('#skill-version-title').scrollIntoViewIfNeeded();
  await expect(page.locator('#skill-version-title')).toBeInViewport();
});

test("phase selection copies complete folded source and survives locale changes", async ({ page }) => {
 await page.goto(url("playbooks/index.html"));
 await page.evaluate(() => Object.defineProperty(navigator, "clipboard", {value: {writeText: async (value: string) => {document.body.dataset["copiedText"] = value;}}, configurable:true}));
 for (const phase of ["code", "docs", "closeout"]) {
  await page.locator(`[data-phase="${phase}"]`).click();
  for (const locale of ["en-US", "zh-CN"]) {
   await page.selectOption(".locale", locale);
   await expect(page.locator(".prompt-stage:visible")).toHaveAttribute("data-stage", phase);
   await expect(page.locator(".prompt:visible details")).toHaveJSProperty("open", false);
   await page.locator(".prompt:visible button").click();
   const sourcePath = locale === "en-US" ? `../../skills/repo-maintenance/workflows/${phase}.md` : `../../content/prompts/${phase}.zh-CN.md`;
   expect(await page.locator("body").getAttribute("data-copied-text")).toBe(readFileSync(new URL(sourcePath, import.meta.url), "utf8"));
  }
 }
});

test("standards prioritizes downloads and keeps explanations in one disclosure", async ({ page }) => {
 await page.goto(url("standards/index.html"));
 await expect(page.locator(".primary-download")).toHaveAttribute("download", "AGENTS.md");
 await expect(page.locator(".worktree-flow > details")).toHaveCount(1);
 await expect(page.locator(".flow-notes")).toHaveJSProperty("open", false);
 await expect(page.locator(".graph-wide g[tabindex]").first()).toHaveAttribute("aria-label", /independent task/);
 await page.selectOption(".locale", "zh-CN");
 await expect(page.locator(".flow-notes > summary")).toHaveText("文字说明");
 await expect(page.locator(".graph-wide g[tabindex]").first()).toHaveAttribute("aria-label", /独立任务/);
 await page.locator(".graph-wide g[tabindex]").first().focus();
 await expect(page.locator(".graph-wide g[tabindex]").first()).toBeFocused();
});

test("full standards disclosure restores after print", async ({page}) => {
 await page.goto(url("standards/index.html"));
 await expect(page.locator(".flow-notes")).toHaveJSProperty("open", false);
 await expect(page.locator(".standard-intro:visible")).toHaveCount(0);
 await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
 await expect(page.locator(".flow-notes")).toHaveJSProperty("open", true);
 await expect(page.locator(".document:visible details[open]")).toHaveCount(7);
 await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
 await expect(page.locator(".flow-notes")).toHaveJSProperty("open", false);
});

test("graph tooltip appears on hover, focus and tap and closes with Escape", async ({page}) => {
 await page.goto(url("standards/index.html"));
 const node = page.locator(".graph-wide g[data-i18n-aria=flowHoverDevelop]").first();
 const tip = page.locator("#flow-tooltip");
 await node.hover();
 await expect(tip).toBeVisible();
 await expect(tip).toContainText("working files");
 await page.keyboard.press("Escape");
 await expect(tip).toBeHidden();
 await node.focus();
 await expect(tip).toBeVisible();
 await page.selectOption(".locale", "zh-CN");
 await node.focus();
 await expect(tip).toContainText("运行资源");
 await page.setViewportSize({width:320,height:900});
 await page.locator(".graph-narrow g[data-i18n-aria=flowHoverDevelop]").first().click();
 await expect(tip).toBeVisible();
 const box=await tip.boundingBox(); expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x+box!.width).toBeLessThanOrEqual(320);
 await page.locator("#flow-title").click();
 await expect(tip).toBeHidden();
});

test("standards connects the download to its workflow and talk is anonymized", async ({page}) => {
 await page.goto(url("standards/index.html"));
 await page.selectOption(".locale","zh-CN");
 await expect(page.locator(".standards-heading")).toHaveText("开发规范");
 await expect(page.locator(".standards-relation")).toContainText("这份规范中的默认开发流程");
 await page.goto(url("talk/2026-10-18/reading.html"));
 await expect(page.locator("main")).toContainText("重复发送检查");
 await expect(page.locator("main")).not.toContainText("PR #");
 await expect(page.locator("main")).not.toContainText("稿件备注");
 await expect(page.locator("main")).not.toContainText("674");
});
