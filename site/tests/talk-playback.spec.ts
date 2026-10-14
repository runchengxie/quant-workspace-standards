import {test,expect,type Page} from '@playwright/test';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const output=process.env.STANDARDS_SITE_OUTPUT_DIR;
if(!output)throw Error('Built site required');
const url=pathToFileURL(resolve(output,'talk/2026-10-18/index.html')).href;
async function open(page:Page,target:string){await page.goto(target);await page.locator('[data-story-stop]').evaluateAll(buttons=>buttons.forEach(button=>button.dispatchEvent(new Event('click'))));}

test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-10-14T12:00:00Z')});
 await page.clock.pauseAt(new Date('2026-10-14T12:00:01Z'));
});

test('play automatically advances; pause freezes timing; resume continues and stop resets',async({page})=>{
 await open(page,url);
 await page.selectOption('.locale','zh-CN');
 const story=page.locator('#questions [data-talk-story]');
 await expect(story.locator('[data-story-toggle]')).toHaveAccessibleName('播放');
 await story.locator('[data-story-toggle]').click();
 await expect(story).toHaveAttribute('data-story-playback','playing');
 await expect(story).toHaveAttribute('data-story-step','1');
 await page.clock.runFor(1500);
 await story.locator('[data-story-toggle]').click();
 await expect(story).toHaveAttribute('data-story-playback','paused');
  const packet=story.locator('.talk-flow-packet');
  await expect.poll(()=>packet.evaluate(el=>el.getAnimations()[0]?.pending)).toBe(false);
  const frozenTimes=await packet.evaluate(el=>el.getAnimations().map(animation=>animation.currentTime));
  await page.waitForTimeout(150);
  expect(await packet.evaluate(el=>el.getAnimations().map(animation=>animation.currentTime))).toEqual(frozenTimes);
 await page.clock.runFor(12000);
 await expect(story).toHaveAttribute('data-story-step','1');
 await story.locator('[data-story-toggle]').click();
 await page.clock.runFor(2499);
 await expect(story).toHaveAttribute('data-story-step','1');
 await page.clock.runFor(1);
 await expect(story).toHaveAttribute('data-story-step','2');
 await story.locator('[data-story-stop]').click();
 await expect(story).toHaveAttribute('data-story-step','0');
 await expect(story).toHaveAttribute('data-story-playback','idle');
 await page.clock.runFor(12000);
 await expect(story).toHaveAttribute('data-story-step','0');
});

test('all stories wrap continuously and retain icon controls',async({page})=>{
 await open(page,url);
 for(const [id,last]of[['questions',5],['customers',4],['ownership',7],['workflows',7]]as const){
  await page.evaluate(id=>{location.hash=id;},id);
  const story=page.locator(`#${id} [data-talk-story]`);
  await expect(story.locator('[data-story-toggle] svg')).toBeVisible();
  await expect(story.locator('[data-story-stop] svg')).toBeVisible();
  expect(await story.locator('[data-story-toggle]').innerText()).toBe('');
  await story.locator('[data-story-toggle]').click();
  await page.clock.runFor(last*4000);
  await expect(story).toHaveAttribute('data-story-step','1');
  await expect(story).toHaveAttribute('data-story-playback','playing');
  await expect(story).toHaveAttribute('data-story-step','1');
  await story.locator('[data-story-stop]').click();
  expect(await story.locator('[data-story-status]').evaluate(el=>getComputedStyle(el).position)).toBe('absolute');
 }
});

test('page navigation and hidden tabs pause playback; print restores a paused phase',async({page})=>{
 await open(page,url);
 const first=page.locator('#questions [data-talk-story]');
 await first.locator('[data-story-toggle]').click();
 await page.locator('#next').click();
 await expect(first).toHaveAttribute('data-story-playback','paused');
 await page.clock.runFor(12000);
 await expect(first).toHaveAttribute('data-story-step','1');
 const second=page.locator('#customers [data-talk-story]');
 await second.locator('[data-story-toggle]').click();
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
 await expect(second).toHaveAttribute('data-story-playback','paused');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
 await page.clock.runFor(12000);
 await expect(second).toHaveAttribute('data-story-step','1');
 await second.locator('[data-story-toggle]').click();
 await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
 await expect(second).toHaveAttribute('data-story-step','0');
 await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
 await expect(second).toHaveAttribute('data-story-step','1');
 await expect(second).toHaveAttribute('data-story-playback','paused');
});

test('mobile graphics distinguish checking, merging and synchronizing without captions',async({page})=>{
 await page.setViewportSize({width:390,height:844});await open(page,url+'#workflows');
 const story=page.locator('#workflows [data-talk-story]');
 await story.locator('[data-story-toggle]').click();await page.clock.runFor(8000);
 const taskB=story.locator('.talk-branches-mobile [data-story-unit="branchB"]');
 await expect(taskB.locator('.talk-check-mark')).toHaveCSS('opacity','1');
 await expect(taskB.locator('.talk-mobile-merge')).toHaveCSS('opacity','0');
 await page.clock.runFor(4000);
 await expect(taskB.locator('.talk-mobile-merge')).toHaveCSS('opacity','1');
 await page.clock.runFor(4000);
 await expect(story.locator('.talk-mobile-sync[data-story-unit="syncA"]')).toHaveCSS('opacity','1');
 expect(await story.locator('[data-story-status]').evaluate(el=>getComputedStyle(el).position)).toBe('absolute');
});
