import playwright from '/workspace/kenshi-shipos/node_modules/playwright/index.js';
const { chromium } = playwright;
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] || 'http://127.0.0.1:3012';
const app = process.argv[3] || 'questpay';
const outDir = path.join(process.cwd(), 'qa', 'shots');
fs.mkdirSync(outDir, { recursive: true });
const viewports = [[320,700],[360,800],[390,844],[430,932],[768,1024],[1024,768],[1280,800],[1440,900],[1920,1080]];
const routes = [
  { name: 'home', path: '/' },
  { name: 'checkout-manual', path: '/#checkout', action: async (page) => { await page.getByRole('button', { name: /Manual Pay/i }).click().catch(()=>{}); } },
  { name: 'checkout-wallet', path: '/#checkout', action: async (page) => { await page.getByRole('button', { name: /Wallet Mode/i }).click(); } },
  { name: 'demo-mode', path: '/#checkout', action: async (page) => { await page.getByRole('button', { name: /Testnet Demo/i }).click(); } },
  { name: 'verify-bad', path: '/verify?tx=0x0000000000000000000000000000000000000000000000000000000000000000&package=1&token=USDT' },
];
const results = [];
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage'] });
for (const [width,height] of viewports) {
  for (const route of routes) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') { const txt = msg.text(); if (!txt.includes('analytics.vgdh.io')) errors.push(txt); } });
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${base}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(1200);
    if (route.action) await route.action(page);
    await page.waitForTimeout(400);
    const overflow = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, bodyScrollWidth: document.body.scrollWidth, innerWidth: window.innerWidth, title: document.title }));
    const passOverflow = overflow.scrollWidth <= overflow.innerWidth && overflow.bodyScrollWidth <= overflow.innerWidth;
    const shotName = `${app}-${route.name}-${width}.png`;
    await page.screenshot({ path: path.join(outDir, shotName), fullPage: true });
    const result = { app, base, route: route.name, width, height, passOverflow, errors, screenshot: `qa/shots/${shotName}`, ...overflow };
    results.push(result);
    console.log(`${passOverflow && errors.length===0 ? 'PASS' : 'FAIL'} ${route.name} ${width} overflow=${overflow.scrollWidth}/${overflow.innerWidth} body=${overflow.bodyScrollWidth} errors=${errors.length}`);
    await context.close();
  }
}
await browser.close();
fs.writeFileSync(path.join(process.cwd(), 'qa', `${app}-qa-results.json`), JSON.stringify(results, null, 2));
const failed = results.filter(r => !r.passOverflow || r.errors.length);
if (failed.length) { console.error(`QA_FAILED ${failed.length}`); console.error(JSON.stringify(failed.slice(0,5), null, 2)); process.exit(1); }
console.log(`QA_PASS ${results.length}`);
