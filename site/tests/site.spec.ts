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
    if (!pagePaths.includes(path)) {
      response.writeHead(404);
      response.end();
      return;
    }
    response.setHeader("Content-Type", "text/html; charset=utf-8");
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
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.selectOption(".locale", "zh-CN");
  await expect(page.locator("main h1:visible")).toHaveText("代码工作区规范");
  await expect(page.locator(".brand")).toHaveText("量化工作区 · 工程实践");
  await expect(page).toHaveTitle(/工程规范/);
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
  await expect(page.locator("main h1:visible")).toHaveText("代码工作区规范");
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
test("offline slides preserve navigation, notes, QR and ten-minute label", async ({
  page,
}) => {
  const failures: string[] = [];
  page.on("pageerror", (error) => failures.push(error.message));
  await page.route(/^https?:/, (route) => route.abort());
  await page.goto(url("talk/2026-10-18/index.html"));
  await page.selectOption(".locale", "zh-CN");
  await expect(page.locator(".slide:visible")).toContainText("约 10 分钟");
  await page.locator("main").click({ position: { x: 2, y: 2 } });
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#page-count")).toHaveText("2 / 12");
  expect(page.url()).toContain("#prototype");
  await page.keyboard.press("End");
  await expect(page.locator("#page-count")).toHaveText("12 / 12");
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
