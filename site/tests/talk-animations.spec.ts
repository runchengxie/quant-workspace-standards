import {test, expect,type Page} from '@playwright/test';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const output=process.env.STANDARDS_SITE_OUTPUT_DIR;
if(!output) throw new Error('Built site required');
const url=pathToFileURL(resolve(output,'talk/2026-10-18/index.html')).href;
async function open(page:Page,target:string){await page.goto(target);await page.locator('[data-story-stop]').evaluateAll(buttons=>buttons.forEach(button=>button.dispatchEvent(new Event('click'))));}

test.beforeEach(async({page})=>{
 await page.clock.install({time:new Date('2026-10-14T12:00:00Z')});
 await page.clock.pauseAt(new Date('2026-10-14T12:00:01Z'));
});

test('all four stories loop after play and preserve offline navigation', async({page})=>{
 await page.route(/^https?:/, route=>route.abort());
 await open(page,url);
 await page.selectOption('.locale','zh-CN');
 for(const [id,last] of [['questions',5],['customers',4],['ownership',7],['workflows',7]] as const){
  await page.evaluate(id=>{location.hash=id;},id);
  const story=page.locator(`#${id} [data-talk-story]`);
  await expect(story).toHaveAttribute('data-story-step','0');
  await expect(story.locator('[data-story-toggle]')).toHaveAccessibleName('播放');
  await story.locator('[data-story-toggle]').click();
  for(let step=1;step<=last;step++){
   if(step>1)await page.clock.runFor(4000);
   await expect(story).toHaveAttribute('data-story-step',String(step));
  }
  await page.clock.runFor(4000);
  await expect(story.locator('[data-story-toggle]')).toHaveAccessibleName('暂停');
  await expect(story).toHaveAttribute('data-story-step','1');
  await story.locator('[data-story-stop]').click();
  await expect(story).toHaveAttribute('data-story-step','0');
 }
 await page.waitForTimeout(1500);
 await expect(page.locator('#workflows [data-talk-story]')).toHaveAttribute('data-story-step','0');
 await page.locator('main').click({position:{x:2,y:2}});
 await page.keyboard.press('Home');
 await expect(page.locator('#page-count')).toHaveText('1 / 4');
});

test('pipeline failure stops downstream and branches merge after their checks',async({page})=>{
 await open(page,url+'#ownership');
 const story=page.locator('#ownership [data-talk-story]');
 await story.locator('[data-story-toggle]').click();
 await page.clock.runFor(4000);
 await expect(story.locator('[data-story-unit="clean"]')).toHaveClass(/story-error/);
 await expect(story.locator('[data-story-unit="send"]')).toHaveClass(/story-muted/);
 await expect(story.locator('[data-story-status]')).toContainText('stops');
 await page.evaluate(()=>{location.hash='workflows';});
 const branches=page.locator('#workflows [data-talk-story]');
 await branches.locator('[data-story-toggle]').click();
 await page.clock.runFor(12000);
 await expect(branches.locator('g[data-story-unit="branchB"]')).toHaveClass(/story-merged/);
 await expect(branches.locator('g[data-story-unit="branchA"]')).not.toHaveClass(/story-merged/);
 await page.clock.runFor(4000);
 await expect(branches.locator('[data-story-status]')).toContainText('sync');
});

test('reduced-motion steps localize and printing restores the current phase',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await open(page,url+'#customers');
 const story=page.locator('#customers [data-talk-story]');
 await expect(story).toHaveAttribute('data-story-step','0');
 await story.locator('[data-story-toggle]').click();
 await expect(story).toHaveAttribute('data-story-reduced-motion','true');
 await page.selectOption('.locale','zh-CN');
 await expect(story.locator('[data-story-status]')).toContainText('企业信息');
 await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
 await expect(story).toHaveAttribute('data-story-step','0');
 await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
 await expect(story).toHaveAttribute('data-story-step','1');
 expect(await story.evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a.playState==='running').length)).toBe(0);
});

test('without JavaScript visual stories and original image disclosure remain usable',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});
 const page=await context.newPage();await open(page,url);
 await expect(page.locator('#questions .talk-paths')).toBeVisible();
 await expect(page.locator('#questions .talk-story-controls')).toBeHidden();
 await page.locator('#questions .talk-image-disclosure summary').click();
 await expect(page.locator('#questions .talk-illustration img:visible')).toBeVisible();
 await context.close();
});

test('navigation cancels moving markers and every animated phase remains within the viewport',async({page})=>{
 await open(page,url);
 await page.locator('#questions [data-story-toggle]').click();
 await expect(page.locator('#questions .talk-flow-packet')).toHaveCount(1);
 await page.locator('#next').click();
 await expect(page.locator('#questions .talk-flow-packet')).toHaveCount(0);
 expect(await page.locator('#questions').evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a.playState==='running').length)).toBe(0);
 for(const width of [1280,320]){
  await page.setViewportSize({width,height:width===1280?720:900});
  for(const locale of ['en-US','zh-CN']){
   await page.selectOption('.locale',locale);
   for(const [id,last] of [['questions',5],['customers',4],['ownership',7],['workflows',7]] as const){
    await page.evaluate(id=>{location.hash=id;},id);
    const story=page.locator(`#${id} [data-talk-story]`);
    await story.locator('[data-story-stop]').evaluate((el:HTMLButtonElement)=>el.click());
    await story.locator('[data-story-toggle]').click();
    for(let step=1;step<=last;step++){
     if(step>1)await page.clock.runFor(4000);
     await page.evaluate(()=>window.scrollTo(0,0));
     expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
     if(width===1280)expect(await page.locator('.deck-controls').evaluate(el=>el.getBoundingClientRect().bottom),`${id}/${locale}/phase ${step}`).toBeLessThanOrEqual(720);
    }
   }
  }
 }
});

test('background story labels retain readable contrast in both themes',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await open(page,url);
 await page.locator('#questions [data-story-toggle]').click();
 for(const theme of ['light','dark']){
  await page.selectOption('.theme',theme);
  const contrast=await page.locator('#questions .talk-path-emphasis li').first().evaluate(el=>{
   const rgb=(value:string)=>value.match(/[\d.]+/g)!.slice(0,3).map(Number);
   const luminance=(values:number[])=>values.map(v=>{const s=v/255;return s<=.04045?s/12.92:((s+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i]!,0);
   const bg=rgb(getComputedStyle(document.body).backgroundColor);
   const fg=rgb(getComputedStyle(el).color);
   let opacity=1;
   for(let p:Element|null=el;p;p=p.parentElement)opacity*=Number(getComputedStyle(p).opacity);
   const composited=fg.map((v,i)=>v*opacity+bg[i]!*(1-opacity));
   const lights=[luminance(bg),luminance(composited)].sort((a,b)=>b-a);
   return (lights[0]!+.05)/(lights[1]!+.05);
  });
  expect(contrast).toBeGreaterThanOrEqual(4.5);
 }
});


