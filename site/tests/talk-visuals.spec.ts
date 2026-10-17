import { test, expect } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const output = process.env.STANDARDS_SITE_OUTPUT_DIR;
if (!output) throw new Error('STANDARDS_SITE_OUTPUT_DIR must point to a built site');
const talk = pathToFileURL(resolve(output, 'talk/2026-10-18/index.html')).href;

test('illustrations fold with native keyboard controls and expand to readable size offline', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.route(/^https?:/, route => route.abort());
  await page.goto(talk);
  await page.selectOption('.locale', 'zh-CN');
  for (const [id, count] of [['questions', '1 / 4'], ['customers', '2 / 4'], ['ownership', '3 / 4']]) {
    await page.goto(talk + `#${id}`);
    const disclosure = page.locator('.slide:visible .talk-image-disclosure');
    await expect(disclosure).toHaveJSProperty('open', false);
    const summary = disclosure.locator('summary');
    await expect(summary).toHaveText('配图');
    await summary.focus();
    await page.keyboard.press('Space');
    await expect(disclosure).toHaveJSProperty('open', true);
    await expect(page.locator('#page-count')).toHaveText(count!);
    const img = disclosure.locator('img:visible');
    await expect(img).toBeVisible();
    const bounds = await img.boundingBox();
    expect(bounds!.width).toBeGreaterThan(650);
    expect(bounds!.height).toBeGreaterThan(500);
    await expect(disclosure.locator('a[data-i18n="imageFullSize"]')).toHaveAttribute('href', /\.png$|\.jpg$/);
    await expect(disclosure.locator('a[data-i18n="imageFullSize"]')).toHaveAttribute('target', '_blank');
    await page.keyboard.press('Space');
    await expect(disclosure).toHaveJSProperty('open', false);
  }
});

test('four visual stories localize and fit a projector and narrow mobile screen', async ({ page }) => {
  await page.goto(talk);
  await expect(page.locator('.talk-visual')).toHaveCount(4);
  for (const width of [1280, 320]) {
    await page.setViewportSize({ width, height: width === 1280 ? 720 : 900 });
    for (const locale of ['en-US', 'zh-CN']) {
      await page.selectOption('.locale', locale);
      for (const theme of ['light', 'dark']) {
        await page.selectOption('.theme', theme);
        for (const id of ['questions', 'customers', 'ownership', 'workflows']) {
          await page.evaluate(id => { location.hash = id; }, id);
          await expect(page.locator('.slide:visible')).toHaveAttribute('id', id);
          await expect(page.locator('.slide:visible .talk-visual')).toBeVisible();
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
          if (width === 1280) expect(await page.locator('.deck-controls').evaluate(el => el.getBoundingClientRect().bottom)).toBeLessThanOrEqual(720);
        }
      }
    }
  }
  await page.evaluate(() => { location.hash = 'customers'; });
  await expect(page.locator('.slide:visible .talk-visual')).toContainText('选股清单');
  await expect(page.locator('.slide:visible')).toContainText('半年以上');
});

test('printing reveals both illustrations and restores their disclosure state', async ({ page }) => {
  await page.goto(talk);
  const disclosures = page.locator('.talk-image-disclosure');
  await expect(disclosures).toHaveCount(4);
  await page.locator('.slide:visible .talk-image-disclosure summary').click();
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  for (const disclosure of await disclosures.all()) await expect(disclosure).toHaveJSProperty('open', true);
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  await expect(disclosures.nth(0)).toHaveJSProperty('open', true);
  await expect(disclosures.nth(1)).toHaveJSProperty('open', false);
});
