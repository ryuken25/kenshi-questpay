import { chromium } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';
const viewports = [[320,700],[360,800],[390,844],[430,932],[768,1024],[1024,768],[1280,800],[1440,900],[1920,1080]];
const routes = ['/', '/services', '/checkout/ux-quick-look', '/sign-in'];
const browser = await chromium.launch({ headless: true });
let failed = 0;

for (const [width, height] of viewports) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
  for (const route of routes) {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    const response = await page.goto(`${baseURL}${route}`, { waitUntil: 'domcontentloaded' });
    const metrics = await page.evaluate(() => ({
      html: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
      inner: innerWidth,
      mainWidth: document.querySelector('.qp-app-shell__main')?.getBoundingClientRect().width || 0,
    }));
    const pass = response?.ok() && metrics.html <= metrics.inner && metrics.body <= metrics.inner && metrics.mainWidth > metrics.inner * .65 && errors.length === 0;
    if (!pass) failed++;
    console.log(`${pass ? 'PASS' : 'FAIL'} ${width}x${height} ${route.padEnd(28)} overflow=${Math.max(metrics.html,metrics.body)-metrics.inner} main=${Math.round(metrics.mainWidth)} errors=${errors.length}`);
    await page.close();
  }
  await context.close();
}
await browser.close();
if (failed) process.exit(1);
