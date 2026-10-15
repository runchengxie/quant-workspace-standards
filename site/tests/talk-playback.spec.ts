import {test,expect} from '@playwright/test';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const url=pathToFileURL(resolve(process.env.STANDARDS_SITE_OUTPUT_DIR!,'talk/2026-10-18/index.html')).href;

test('all diagrams start static, play once, stay finished and stop reliably',async({page})=>{
 await page.goto(url);
 for(const id of ['questions','customers','ownership']) {
  await page.evaluate(id=>location.hash=id,id);
  const root=page.locator(`#${id} [data-talk-story]`);
  await expect(root).toHaveAttribute('data-story-playback','idle');
  expect(await root.evaluate(el=>el.getAnimations({subtree:true}).length)).toBe(0);
  await root.locator('[data-story-toggle]').click();
  await expect(root).toHaveAttribute('data-story-playback','playing');
  await expect(root).toHaveAttribute('data-story-playback','finished',{timeout:5000});
  await page.waitForTimeout(100);
  expect(await root.evaluate(el=>el.getAnimations({subtree:true}).every(a=>a.playState==='finished'))).toBe(true);
  await root.locator('[data-story-stop]').click();
  await expect(root).toHaveAttribute('data-story-playback','idle');
  expect(await root.evaluate(el=>el.getAnimations({subtree:true}).length)).toBe(0);
 }
});

test('pause freezes motion, resume continues, and navigation never autoplays',async({page})=>{
 await page.goto(url+'#customers'); const root=page.locator('#customers [data-talk-story]');
 await root.locator('[data-story-toggle]').click();
 await page.waitForTimeout(300); await root.locator('[data-story-toggle]').click();
 await expect(root).toHaveAttribute('data-story-playback','paused');
 await expect.poll(()=>root.evaluate(el=>el.getAnimations({subtree:true}).every(a=>!a.pending))).toBe(true);
 const time=await root.evaluate(el=>el.getAnimations({subtree:true}).map(a=>a.currentTime));
 await page.waitForTimeout(300);
 expect(await root.evaluate(el=>el.getAnimations({subtree:true}).map(a=>a.currentTime))).toEqual(time);
 await root.locator('[data-story-toggle]').click(); await page.locator('#next').click();
 await expect(root).toHaveAttribute('data-story-playback','paused');
 await expect(page.locator('#ownership [data-talk-story]')).toHaveAttribute('data-story-playback','idle');
});

test('printing presents full overview and restores a paused animation; reduced motion stays static',async({page})=>{
 await page.goto(url+'#ownership');const root=page.locator('#ownership [data-talk-story]');
 await root.locator('[data-story-toggle]').click();
 await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
 await expect(root).toHaveClass(/quiet-print/);
 await expect(root).toHaveAttribute('data-story-playback','paused');
 await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
 await expect(root).not.toHaveClass(/quiet-print/);
 await expect(root).toHaveAttribute('data-story-playback','paused');
 await page.emulateMedia({reducedMotion:'reduce'});
 await root.locator('[data-story-toggle]').click();
 expect(await root.evaluate(el=>el.getAnimations({subtree:true}).length)).toBe(0);
});
