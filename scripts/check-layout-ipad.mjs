import { chromium } from '@playwright/test';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.goto('https://kenshi-questpay.vercel.app/', { waitUntil: 'load', timeout: 45000 });
await page.waitForTimeout(2500);

const info = await page.evaluate(() => {
  const shell = document.querySelector('.qp-app-shell');
  const main = document.querySelector('.qp-app-shell__main');
  const topbar = document.querySelector('.qp-app-shell__mobile-topbar');
  const botnav = document.querySelector('.qp-app-shell__mobile-bottomnav');
  function info(el, name) {
    if (!el) return { name, exists: false };
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return { name, exists: true, display: cs.display, flexDirection: cs.flexDirection, position: cs.position, width: cs.width, rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height } };
  }
  return { shell: info(shell,'shell'), main: info(main,'main'), topbar: info(topbar,'topbar'), botnav: info(botnav,'botnav') };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
