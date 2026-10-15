import {test,expect} from '@playwright/test';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const url=pathToFileURL(resolve(process.env.STANDARDS_SITE_OUTPUT_DIR!,'talk/2026-10-18/index.html')).href;
test('offline resource links and embedded fonts are available',async({page})=>{
 await page.route(/^https?:/,route=>route.abort());await page.goto(url+'?locale=zh-CN#workflows');
 await expect(page.locator('.quiet-resources a')).toHaveCount(3);
 await expect(page.locator('.quiet-resources a').nth(0)).toHaveAttribute('href',/standards\/index.html/);
 await expect(page.locator('.quiet-resources a').nth(2)).toHaveAttribute('href',/repo-maintenance.zip/);
 await page.evaluate(()=>document.fonts.ready);
 expect(await page.evaluate(()=>document.fonts.check('500 24px QuietSerif','开发规范'))).toBe(true);
 expect(await page.evaluate(()=>document.fonts.check('400 16px QuietSans','信息结果'))).toBe(true);
 await page.locator('.quiet-resources a').first().click(); await expect(page).toHaveURL(/standards\/index.html/);
});
test('without JavaScript the diagram and illustration disclosure remain usable',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();await page.goto(url);
 await expect(page.locator('#questions .quiet-scene')).toBeVisible();await expect(page.locator('#questions .talk-story-controls')).toBeHidden();
 await page.locator('#questions summary').click();await expect(page.locator('#questions img:visible')).toBeVisible();await context.close();
});
