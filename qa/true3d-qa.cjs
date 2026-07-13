const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.BASE_URL || 'http://127.0.0.1:3000';
const out = path.resolve('qa/screenshots/true3d/final');
const videoDir = path.resolve('qa/videos/true3d');
fs.mkdirSync(out, { recursive: true }); fs.mkdirSync(videoDir, { recursive: true });

const results = { base, viewports: [], reducedMotion: {}, fallback: {}, tabRestore: {}, cpuThrottle: {}, longRun: {} };
const relevant = (text) => !text.includes('favicon.ico');
function watch(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', message => { if (message.type() === 'error' && relevant(message.text())) errors.push(`console: ${message.text()}`); });
  return errors;
}
async function sceneShot(page, name) {
  await page.locator('.qp-home-hero__visual').screenshot({ path: path.join(out, `${name}.png`) });
}
(async () => {
  const browser = await chromium.launch({ headless: true });
  for (const [name, width, height] of [['desktop-1440',1440,900],['desktop-1366',1366,768],['mobile-390',390,844],['mobile-360',360,800]]) {
    const page = await browser.newPage({ viewport: { width, height } }); const errors = watch(page);
    await page.goto(base, { waitUntil: 'networkidle' }); await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(out, `${name}-page.png`), fullPage: false }); await sceneShot(page, `${name}-scene`);
    results.viewports.push({ name, width, height, canvas: await page.locator('canvas').count(), engine: await page.locator('[data-hero3d-engine]').getAttribute('data-hero3d-engine'), overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), errors });
    await page.close();
  }

  const reduced = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }); const reducedErrors = watch(reduced);
  await reduced.goto(base, { waitUntil: 'networkidle' }); await reduced.waitForTimeout(1200);
  await sceneShot(reduced, 'reduced-before'); await reduced.waitForTimeout(3000); await sceneShot(reduced, 'reduced-after');
  results.reducedMotion = { attribute: await reduced.locator('[data-hero3d-reduced-motion]').getAttribute('data-hero3d-reduced-motion'), active: await reduced.locator('[data-hero3d-active]').getAttribute('data-hero3d-active'), errors: reducedErrors };
  await reduced.close();

  const fallback = await browser.newPage({ viewport: { width: 1440, height: 900 } }); const fallbackErrors = watch(fallback);
  await fallback.goto(`${base}/?hero3dFallback=1`, { waitUntil: 'networkidle' }); await fallback.waitForTimeout(500);
  await sceneShot(fallback, 'fallback');
  results.fallback = { image: await fallback.locator('img[src*="questpay-hero-fallback"]').count(), canvas: await fallback.locator('canvas').count(), errors: fallbackErrors };
  await fallback.close();

  const tab = await browser.newPage({ viewport: { width: 1440, height: 900 } }); const tabErrors = watch(tab);
  await tab.goto(base, { waitUntil: 'networkidle' }); await tab.waitForTimeout(1800); await sceneShot(tab, 'tab-before');
  const cover = await browser.newPage(); await cover.goto('about:blank'); await cover.bringToFront(); await cover.waitForTimeout(10000);
  await tab.bringToFront(); await sceneShot(tab, 'tab-immediate'); await tab.waitForTimeout(250); await sceneShot(tab, 'tab-after-250ms');
  results.tabRestore = { visibility: await tab.evaluate(() => document.visibilityState), active: await tab.locator('[data-hero3d-active]').getAttribute('data-hero3d-active'), errors: tabErrors };
  await cover.close(); await tab.close();

  const cpu = await browser.newPage({ viewport: { width: 1366, height: 768 } }); const cpuErrors = watch(cpu); const cdp = await cpu.context().newCDPSession(cpu);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 }); await cpu.goto(base, { waitUntil: 'networkidle' }); await cpu.waitForTimeout(10000); await sceneShot(cpu, 'cpu-4x');
  results.cpuThrottle = { canvas: await cpu.locator('canvas').count(), errors: cpuErrors };
  await cpu.close();

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: videoDir, size: { width: 1440, height: 900 } } });
  const long = await context.newPage(); const longErrors = watch(long); const video = long.video();
  await long.goto(base, { waitUntil: 'networkidle' }); await long.waitForTimeout(2000);
  const fps = await long.evaluate(() => new Promise(resolve => { let frames = 0; const start = performance.now(); const tick = now => { frames += 1; if (now - start >= 5000) resolve(Math.round(frames * 10000 / (now - start)) / 10); else requestAnimationFrame(tick); }; requestAnimationFrame(tick); }));
  const samples = [];
  for (let second = 10; second <= 60; second += 10) {
    await long.waitForTimeout(second === 10 ? 3000 : 10000);
    await sceneShot(long, `motion-${String(second).padStart(2,'0')}s`);
    samples.push({ second, canvas: await long.locator('canvas').count(), active: await long.locator('[data-hero3d-active]').getAttribute('data-hero3d-active') });
  }
  results.longRun = { fps5s: fps, samples, errors: longErrors };
  await context.close();
  if (video) { const source = await video.path(); fs.copyFileSync(source, path.join(videoDir, 'questpay-true3d-60s.webm')); }
  await browser.close();
  fs.writeFileSync(path.resolve('qa/true3d-qa-results.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
})().catch(error => { console.error(error); process.exit(1); });
