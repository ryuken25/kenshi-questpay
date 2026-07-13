const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:3000';
const out = path.resolve('qa/upgrade-kit-evidence');
const shots = path.join(out, 'screenshots');
const videos = path.join(out, 'videos');
fs.mkdirSync(shots, { recursive: true });
fs.mkdirSync(videos, { recursive: true });

const viewports = [
  [320,568],[360,800],[375,812],[390,844],[412,915],[430,932],[768,1024],
  [1280,720],[1366,768],[1440,900],[1536,864],[1920,1080],
];

const clone = (value) => JSON.parse(JSON.stringify(value));
const tokenDistance = (a,b) => Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z);
const stats = (values) => {
  const mean = values.reduce((a,b)=>a+b,0)/values.length;
  const sd = Math.sqrt(values.reduce((a,b)=>a+(b-mean)**2,0)/values.length);
  return { min: Math.min(...values), max: Math.max(...values), mean, cv: mean ? sd/mean : 0 };
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = { base, viewports: [], motion: {}, longRun: {}, reducedMotion: {}, visibility: {}, fallback: {}, throttle: {}, performance: {} };

  for (const [width,height] of viewports) {
    for (const route of ['/', '/how-it-works']) {
      const page = await browser.newPage({ viewport: { width, height } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      await page.goto(base + route, { waitUntil: 'domcontentloaded' });
      if (route === '/') await page.locator('[data-testid="hero-orbital-scene"] canvas').waitFor({ state: 'visible', timeout: 15000 });
      await page.waitForTimeout(500);
      const measurement = await page.evaluate(() => ({
        htmlWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        viewportWidth: innerWidth,
        minTap: Math.min(...Array.from(document.querySelectorAll('a,button')).filter(el => {
          const r=el.getBoundingClientRect(); return r.width>0 && r.height>0;
        }).map(el => el.getBoundingClientRect().height)),
        canvas: document.querySelectorAll('canvas').length,
      }));
      results.viewports.push({ route, width, height, ...measurement, errors });
      if ((width===390&&height===844)||(width===1440&&height===900)) {
        await page.screenshot({ path: path.join(shots, `${route==='/'?'home':'how'}-${width}x${height}.png`), fullPage: true });
      }
      await page.close();
    }
  }

  const motionPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const motionErrors = [];
  motionPage.on('pageerror', error => motionErrors.push(error.message));
  motionPage.on('console', message => { if(message.type()==='error') motionErrors.push(message.text()); });
  await motionPage.goto(base, { waitUntil: 'domcontentloaded' });
  await motionPage.waitForFunction(() => window.__QUESTPAY_HERO3D_DEBUG__?.frame > 3, null, { timeout: 15000 });
  const samples = [];
  for (let second=0; second<=20; second++) {
    samples.push({ second, state: clone(await motionPage.evaluate(() => window.__QUESTPAY_HERO3D_DEBUG__)) });
    if (second < 20) await motionPage.waitForTimeout(1000);
  }
  const tokenStats = {};
  for (let tokenIndex=0; tokenIndex<4; tokenIndex++) {
    const id = samples[0].state.tokens[tokenIndex].id;
    const distances = samples.slice(1).map((sample,index)=>tokenDistance(samples[index].state.tokens[tokenIndex],sample.state.tokens[tokenIndex]));
    const progressSteps = samples.slice(1).map((sample,index) => {
      const a=samples[index].state.tokens[tokenIndex].progress,b=sample.state.tokens[tokenIndex].progress;
      return (b-a+1)%1;
    });
    tokenStats[id] = { distance: stats(distances), progress: stats(progressSteps) };
  }
  results.motion = { seconds: 20, tokenStats, errors: motionErrors, samples };

  const longErrors = [];
  motionPage.on('pageerror', error => longErrors.push(error.message));
  const longFrames = [];
  for(let elapsed=0; elapsed<=60; elapsed+=5) {
    longFrames.push({ elapsed, frame: await motionPage.evaluate(()=>window.__QUESTPAY_HERO3D_DEBUG__?.frame||0), canvas: await motionPage.locator('canvas').count() });
    if(elapsed<60) await motionPage.waitForTimeout(5000);
  }
  results.longRun = { seconds: 60, frames: longFrames, errors: [...motionErrors, ...longErrors] };
  await motionPage.close();

  const reducedContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const reduced = await reducedContext.newPage();
  await reduced.goto(base, { waitUntil: 'domcontentloaded' });
  await reduced.locator('[data-testid="hero-orbital-scene"] canvas').waitFor({ state:'visible' });
  await reduced.waitForTimeout(500);
  const reducedBefore = clone(await reduced.evaluate(()=>window.__QUESTPAY_HERO3D_DEBUG__));
  await reduced.screenshot({ path:path.join(shots,'reduced-before.png') });
  await reduced.waitForTimeout(3000);
  const reducedAfter = clone(await reduced.evaluate(()=>window.__QUESTPAY_HERO3D_DEBUG__));
  await reduced.screenshot({ path:path.join(shots,'reduced-after.png') });
  results.reducedMotion = { before:reducedBefore, after:reducedAfter, active:await reduced.locator('[data-testid="hero-orbital-scene"]').getAttribute('data-hero3d-active') };
  await reducedContext.close();

  const visibility = await browser.newPage({ viewport:{width:1440,height:900} });
  await visibility.goto(base,{waitUntil:'domcontentloaded'});
  await visibility.waitForFunction(()=>window.__QUESTPAY_HERO3D_DEBUG__?.frame>3);
  const visibleBefore=clone(await visibility.evaluate(()=>window.__QUESTPAY_HERO3D_DEBUG__));
  await visibility.evaluate(()=>{Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true});Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
  await visibility.waitForTimeout(10000);
  const hiddenAfter=clone(await visibility.evaluate(()=>window.__QUESTPAY_HERO3D_DEBUG__));
  await visibility.evaluate(()=>{Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true});Object.defineProperty(document,'hidden',{value:false,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
  await visibility.waitForTimeout(250);
  const restored=clone(await visibility.evaluate(()=>window.__QUESTPAY_HERO3D_DEBUG__));
  results.visibility={visibleBefore,hiddenAfter,restored};
  await visibility.close();

  const fallback = await browser.newPage({viewport:{width:390,height:844}});
  const fallbackErrors=[]; fallback.on('pageerror',e=>fallbackErrors.push(e.message));
  await fallback.goto(base+'/?hero3dFallback=1',{waitUntil:'domcontentloaded'});
  const fallbackImage=fallback.locator('[data-hero3d-fallback="true"] img'); await fallbackImage.waitFor({state:'visible'});
  results.fallback={canvas:await fallback.locator('canvas').count(),naturalWidth:await fallbackImage.evaluate(img=>img.naturalWidth),errors:fallbackErrors};
  await fallback.screenshot({path:path.join(shots,'fallback-390x844.png'),fullPage:true}); await fallback.close();

  const throttle = await browser.newPage({viewport:{width:390,height:844}}); const throttleErrors=[];
  throttle.on('pageerror',e=>throttleErrors.push(e.message)); throttle.on('console',m=>{if(m.type()==='error')throttleErrors.push(m.text())});
  const cdp=await throttle.context().newCDPSession(throttle); await cdp.send('Emulation.setCPUThrottlingRate',{rate:6});
  await throttle.goto(base,{waitUntil:'domcontentloaded'}); await throttle.locator('canvas').waitFor({state:'visible'}); await throttle.waitForTimeout(10000);
  results.throttle={canvas:await throttle.locator('canvas').count(),quality:await throttle.locator('[data-testid="hero-orbital-scene"]').getAttribute('data-hero3d-quality'),errors:throttleErrors};
  await throttle.close();

  const perf=await browser.newPage({viewport:{width:1440,height:900}}); await perf.goto(base,{waitUntil:'domcontentloaded'}); await perf.locator('canvas').waitFor({state:'visible'});
  results.performance=await perf.evaluate(()=>new Promise(resolve=>{let frames=0,last=performance.now(),max=0,start=last;function tick(now){const d=now-last;last=now;max=Math.max(max,d);frames++;if(now-start>=5000)resolve({fps:frames/((now-start)/1000),maxFrameMs:max,quality:document.querySelector('[data-hero3d-quality]')?.getAttribute('data-hero3d-quality')});else requestAnimationFrame(tick)}requestAnimationFrame(tick)})); await perf.close();

  const videoContext=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:videos,size:{width:1440,height:900}}});
  const videoPage=await videoContext.newPage(); await videoPage.goto(base,{waitUntil:'domcontentloaded'}); await videoPage.locator('canvas').waitFor({state:'visible'}); await videoPage.waitForTimeout(20000); const video=videoPage.video(); await videoPage.close(); await videoContext.close();
  results.videoPath=video ? await video.path() : null;

  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));
  console.log(JSON.stringify({viewports:results.viewports.length,motion:tokenStats,longRun:results.longRun,reducedActive:results.reducedMotion.active,fallback:results.fallback,throttle:results.throttle,performance:results.performance,video:results.videoPath},null,2));
  await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
