import {test,expect} from '@playwright/test';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const url=pathToFileURL(resolve(process.env.STANDARDS_SITE_OUTPUT_DIR!,'talk/2026-10-18/index.html')).href;
test('quiet diagrams use only essential labels and no particles',async({page})=>{
 await page.goto(url+'?locale=zh-CN');
 await expect(page.locator('.quiet-loop-label')).toHaveText('调参数');
 await expect(page.locator('.quiet-turn-label')).toHaveText('换问题');
 await page.locator('#next').click();
 await expect(page.locator('.quiet-label')).toHaveText(['信息','结果']);
 await page.locator('#next').click();
 await expect(page.locator('.quiet-time-axis')).toContainText('07:00');
 await expect(page.locator('.quiet-time-axis')).toContainText('09:00');
 await expect(page.locator('.quiet-time-axis')).toContainText('09:30');
 await expect(page.locator('.talk-flow-packet')).toHaveCount(0);
 await page.locator('#next').click();
 const disclosures=page.locator('.talk-image-disclosure');await expect(disclosures).toHaveCount(4);
 for(const disclosure of await disclosures.all()){await expect(disclosure).toHaveJSProperty('open',false);await expect(disclosure.locator('summary')).toHaveText('配图');}
 await page.locator('#workflows summary').click();await expect(page.locator('.qr svg')).toBeVisible();
});
