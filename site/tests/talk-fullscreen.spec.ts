import { test, expect } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const talk = pathToFileURL(resolve(process.env.STANDARDS_SITE_OUTPUT_DIR!, 'talk/2026-10-18/index.html')).href;

test('fullscreen shows only slides, supports keyboard navigation and restores page chrome', async ({ page }) => {
  await page.setViewportSize({width:1280,height:720});
  await page.goto(talk + '?locale=zh-CN');
  await page.locator('#notes-toggle').click();
  await expect(page.locator('#speaker-notes')).toBeVisible();
  await page.locator('#fullscreen').click();
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
  for (const selector of ['.top', 'footer', '.deck-controls', '.progress', '.help', '.reading-link', '#speaker-notes', '.talk-duration', '.slide-number', '.talk-story-controls']) {
    await expect(page.locator(selector).first()).toBeHidden();
  }
  await expect(page.locator('#questions h1:visible')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#customers')).toBeVisible();
  await page.keyboard.press('End');
  await expect(page.locator('#workflows .talk-contacts')).toBeVisible();
  const bounds = (await page.locator('#workflows .talk-contacts').boundingBox())!;
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(720);
  await page.keyboard.press('f');
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false);
  await expect(page.locator('.top')).toBeVisible();
  await expect(page.locator('.deck-controls')).toBeVisible();
  await expect(page.locator('#speaker-notes')).toBeVisible();
  await expect(page.locator('#workflows')).toBeVisible();
  await page.keyboard.press('f');
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false);
  await expect(page.locator('.top')).toBeVisible();
});
