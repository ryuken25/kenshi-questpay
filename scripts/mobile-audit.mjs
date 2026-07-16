// Mobile audit screenshot script — captures 4 viewports x 5 pages = 20 screenshots
// Usage: node scripts/mobile-audit.mjs
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const BASE = 'https://kenshi-questpay.vercel.app';
const OUT = '/Users/admin/mobile-audit';
mkdirSync(OUT, { recursive: true });

const viewports = [
  { name: 'iphone14', width: 390, height: 844 },
  { name: 'galaxy-s20', width: 360, height: 800 },
  { name: 'iphone-se', width: 320, height: 568 },
  { name: 'ipad-portrait', width: 768, height: 1024 },
];

const pages = [
  { name: 'home', path: '/' },
  { name: 'services', path: '/services' },
  { name: 'checkout-ux-quick-look', path: '/checkout/ux-quick-look' },
  { name: 'verify', path: '/verify' },
  { name: 'sign-in', path: '/sign-in' },
];

const browser = await chromium.launch({ headless: true });

for (const vp of viewports) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();

  for (const p of pages) {
    const url = BASE + p.path;
    const fname = `${vp.name}__${p.name}.png`;
    const fpath = join(OUT, fname);
    console.log(`[${vp.name}] ${p.path} -> ${fname}`);

    try {
      // Navigate with a generous timeout; ignore network idle flakiness from 3D assets
      await page.goto(url, { waitUntil: 'load', timeout: 45000 });
      // Give 3D hero / fonts a moment to settle
      await page.waitForTimeout(2500);

      // Capture full page screenshot for layout analysis
      await page.screenshot({ path: fpath, fullPage: true });

      // Also capture a viewport-only screenshot (what user sees first)
      const vpFname = `${vp.name}__${p.name}__viewport.png`;
      await page.screenshot({ path: join(OUT, vpFname), fullPage: false });

      // Probe horizontal scroll
      const scrollInfo = await page.evaluate(() => {
        const doc = document.documentElement;
        const body = document.body;
        const docWidth = doc.scrollWidth;
        const clientWidth = doc.clientWidth;
        const overflow = docWidth - clientWidth;
        return {
          scrollWidth: docWidth,
          clientWidth,
          overflowX: overflow,
          bodyScrollWidth: body.scrollWidth,
        };
      });
      console.log(`   overflowX=${scrollInfo.overflowX} (scrollWidth=${scrollInfo.scrollWidth}, clientWidth=${scrollInfo.clientWidth})`);
    } catch (err) {
      console.error(`   ERROR on ${url}: ${err.message}`);
      // Still try to capture whatever is on screen
      try {
        await page.screenshot({ path: fpath, fullPage: true });
      } catch (_) {}
    }
  }

  await context.close();
}

await browser.close();
console.log('Done.');
