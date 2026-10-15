import {test,expect} from '@playwright/test';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const url=pathToFileURL(resolve(process.env.STANDARDS_SITE_OUTPUT_DIR!,'talk/2026-10-18/index.html')).href;
test('visible diagrams loop seamlessly and a single button freezes playback',async({page})=>{
 await page.goto(url);
 for(const id of ['questions','customers','ownership']) {
  await page.evaluate(id=>location.hash=id,id);const root=page.locator(`#${id} [data-talk-story]`);
  await expect(root).toHaveAttribute('data-story-playback','playing');await expect(root.locator('button')).toHaveCount(1);
  expect(await root.evaluate(el=>el.querySelector('.quiet-scene')!.getAnimations({subtree:true}).every(a=>{
   const effect=a.effect as KeyframeEffect;const frames=effect.getKeyframes();
   const {offset,computedOffset,...start}=frames[0]!;const {offset:e,computedOffset:c,...end}=frames.at(-1)!;
   return effect.getTiming().iterations===Infinity && JSON.stringify(start)===JSON.stringify(end);
  }))).toBe(true);
  await root.locator('button').click();await expect(root).toHaveAttribute('data-story-playback','paused');
  await expect.poll(()=>root.evaluate(el=>el.querySelector('.quiet-scene')!.getAnimations({subtree:true}).every(a=>!a.pending))).toBe(true);
  const times=await root.evaluate(el=>el.querySelector('.quiet-scene')!.getAnimations({subtree:true}).map(a=>a.currentTime));await page.waitForTimeout(200);
  expect(await root.evaluate(el=>el.querySelector('.quiet-scene')!.getAnimations({subtree:true}).map(a=>a.currentTime))).toEqual(times);
 }
});
test('navigation resumes automatic playback but preserves explicit pause',async({page})=>{
 await page.goto(url+'#customers');const root=page.locator('#customers [data-talk-story]');
 await expect(root).toHaveAttribute('data-story-playback','playing');
 await page.locator('#next').click();await expect(root).toHaveAttribute('data-story-playback','paused');
 await page.locator('#previous').click();await expect(root).toHaveAttribute('data-story-playback','playing');
 await root.locator('button').click();await page.locator('#next').click();await page.locator('#previous').click();
 await expect(root).toHaveAttribute('data-story-playback','paused');
 await page.selectOption('.locale','zh-CN');await expect(root.locator('button')).toHaveText('播放');
 await root.locator('button').click();await expect(root.locator('button')).toHaveText('暂停');
});
test('visibility and print suspend loops; reduced motion cancels them',async({page})=>{
 await page.goto(url+'#ownership');const root=page.locator('#ownership [data-talk-story]');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
 await expect(root).toHaveAttribute('data-story-playback','paused');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
 await expect(root).toHaveAttribute('data-story-playback','playing');
 await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await expect(root).toHaveAttribute('data-story-playback','paused');
 await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));await expect(root).toHaveAttribute('data-story-playback','playing');
 await page.emulateMedia({reducedMotion:'reduce'});await expect(root.locator('button')).toBeDisabled();
 expect(await root.evaluate(el=>el.querySelector('.quiet-scene')!.getAnimations({subtree:true}).length)).toBe(0);
 await page.emulateMedia({reducedMotion:'no-preference'});await expect(root).toHaveAttribute('data-story-playback','playing');
});

