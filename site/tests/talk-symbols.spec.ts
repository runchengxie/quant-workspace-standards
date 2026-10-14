import {test,expect} from '@playwright/test';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const url=pathToFileURL(resolve(process.env.STANDARDS_SITE_OUTPUT_DIR!,'talk/2026-10-18/index.html')).href;
test('visible story starts and loops, stop remains stopped; hidden stories stay idle',async({page})=>{
 await page.clock.install({time:new Date('2026-10-15T00:00:00Z')});
 await page.clock.pauseAt(new Date('2026-10-15T00:00:01Z'));
 await page.goto(url);
 const story=page.locator('#questions [data-talk-story]');
 await expect(story).toHaveAttribute('data-story-playback','playing');
 await expect(page.locator('#customers [data-talk-story]')).toHaveAttribute('data-story-step','0');
 await page.clock.runFor(20000);
 await expect(story).toHaveAttribute('data-story-step','1');
 await expect(story).toHaveAttribute('data-story-playback','playing');
 await page.clock.runFor(400000);
 await expect(story).toHaveAttribute('data-story-step','1');
 expect(await story.locator('.talk-flow-packet').count()).toBeLessThanOrEqual(1);
 await story.locator('[data-story-stop]').click();
 await page.clock.runFor(40000);
 await expect(story).toHaveAttribute('data-story-step','0');
 await page.locator('#next').click();
 await expect(page.locator('#customers [data-talk-story]')).toHaveAttribute('data-story-playback','playing');
 await page.locator('#previous').click();
 await expect(story).toHaveAttribute('data-story-playback','idle');
});
test('animation graphics contain no visible words or digits; all three images are folded',async({page})=>{
 await page.goto(url+'?locale=zh-CN');
 for(const id of ['questions','customers','ownership','workflows']){
  await page.evaluate(id=>location.hash=id,id);
  const story=page.locator(`#${id} [data-talk-story]`);
  const text=await story.evaluate(root=>{
   const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;let visible='';
   while((n=walker.nextNode())){
    const el=n.parentElement;if(!el||el.closest('.sr-only, title, [hidden], button'))continue;
    if(getComputedStyle(el).visibility==='hidden'||!el.getClientRects().length)continue;
    visible+=n.textContent;
   }return visible;
  });
  expect(text).not.toMatch(/[A-Za-z0-9\u3400-\u9fff]/);
 }
 const disclosures=page.locator('.talk-image-disclosure');
 await expect(disclosures).toHaveCount(3);
 for(const d of await disclosures.all()) {await expect(d).toHaveJSProperty('open',false);await expect(d.locator('summary')).toHaveText('配图');}
 const qr=page.locator('#workflows .talk-image-disclosure');
 await qr.locator('summary').click();await expect(qr.locator('.qr svg')).toBeVisible();
 await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
 for(const d of await disclosures.all())await expect(d).toHaveJSProperty('open',true);
 await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
 await expect(qr).toHaveJSProperty('open',true);
});
