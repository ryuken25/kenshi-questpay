import { test } from '@playwright/test';
import path from 'node:path';

const routes = ['/', '/services', '/how-it-works', '/faq', '/studio/login', '/verify'];
const viewports = [
  { width: 320, height: 568 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

test('capture readability screenshots', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const route of routes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      const name = `${route === '/' ? 'home' : route.slice(1).replaceAll('/', '-')}-${viewport.width}x${viewport.height}.png`;
      await page.screenshot({ path: path.join(testInfo.project.outputDir, 'readability-shots', name), fullPage: true });
    }
  }
});
