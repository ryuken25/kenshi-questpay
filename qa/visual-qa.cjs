const { chromium } = require('@playwright/test');
const fs = require('fs');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors=[];
  page.on('console', m => { if (m.type()==='error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));
  const matrix=[[320,568],[360,800],[375,812],[390,844],[412,915],[430,932],[768,1024],[820,1180],[1024,768],[1280,720],[1366,768],[1440,900],[1536,864],[1920,1080]];
  const matrixResults=[];
  for (const [width,height] of matrix) {
    await page.setViewportSize({width,height});
    await page.goto('http://127.0.0.1:3000/', {waitUntil:'networkidle'});
    await page.waitForTimeout(700);
    matrixResults.push(await page.evaluate(({width,height}) => ({
      viewport:`${width}x${height}`,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      titleLines: [...document.querySelectorAll('.qp-hero-title__line')].map(n => ({text:n.textContent, width:n.getBoundingClientRect().width})),
      sceneNodes: document.querySelectorAll('.qp-orbit-token').length,
      sceneBeforeContentOnMobile: width >= 768 || (document.querySelector('.qp-home-hero__content')?.compareDocumentPosition(document.querySelector('.qp-home-hero__visual')) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
    }),{width,height}));
  }
  fs.mkdirSync('qa/screenshots/after',{recursive:true});
  for (const [path,name,width,height] of [
    ['/','home-1440x900',1440,900],['/','home-390x844',390,844],['/services','services',1440,900],['/checkout/ux-quick-look','checkout',1440,900],['/sign-in','sign-in',1440,900],['/verify','verify',1440,900]
  ]) {
    await page.setViewportSize({width,height});
    await page.goto(`http://127.0.0.1:3000${path}`,{waitUntil:'networkidle'});
    await page.waitForTimeout(900);
    await page.screenshot({path:`qa/screenshots/after/${name}.png`,fullPage:false});
  }
  await page.setViewportSize({width:1440,height:900});
  await page.goto('http://127.0.0.1:3000/',{waitUntil:'networkidle'});
  await page.getByRole('button',{name:'Sign In'}).first().click();
  await page.waitForTimeout(300);
  await page.screenshot({path:'qa/screenshots/after/auth-modal.png',fullPage:false});
  await page.keyboard.press('Escape');

  await page.evaluate(() => {
    window.__qpMutations={childList:0};
    const scene=document.querySelector('[data-testid="hero-orbital-scene"]');
    window.__qpObserver=new MutationObserver(ms => { for(const m of ms) if(m.type==='childList') window.__qpMutations.childList++; });
    if(scene) window.__qpObserver.observe(scene,{subtree:true,childList:true});
  });
  const samples=[];
  for(let i=0;i<90;i++) {
    await page.waitForTimeout(1000);
    samples.push(await page.evaluate(() => ({
      count:document.querySelectorAll('.qp-orbit-token').length,
      invalid:[...document.querySelectorAll('.qp-orbit-token')].some(n => /NaN|undefined/.test(n.style.transform+n.style.opacity)),
      minOpacity:Math.min(...[...document.querySelectorAll('.qp-orbit-token')].map(n=>Number(n.style.opacity)||0)),
      maxOpacity:Math.max(...[...document.querySelectorAll('.qp-orbit-token')].map(n=>Number(n.style.opacity)||0)),
    })));
  }
  const mutations=await page.evaluate(()=>window.__qpMutations);

  const reduced=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await reduced.goto('http://127.0.0.1:3000/',{waitUntil:'networkidle'});
  await reduced.waitForTimeout(500);
  const reducedResult=await reduced.evaluate(()=>({count:document.querySelectorAll('.qp-orbit-token').length, visible:[...document.querySelectorAll('.qp-orbit-token')].filter(n=>Number(getComputedStyle(n).opacity)>.1).length, overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth}));
  await reduced.close();

  const result={matrix:matrixResults,errors,mutations,sampleCount:samples.length,stableNodeCount:samples.every(s=>s.count===8),invalidStyles:samples.some(s=>s.invalid),reduced:reducedResult};
  fs.writeFileSync('qa/visual-qa.json',JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));
  await browser.close();
})();
