import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'https://kenshi-questpay.vercel.app';
const outDir = path.resolve('qa/ui-form-audit-evidence');
await fs.mkdir(outDir, { recursive: true });

const routes = ['/', '/services', '/checkout/ux-quick-look', '/sign-in', '/onboarding'];
const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
];
const browser = await chromium.launch({ headless: true });
const results = [];

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  for (const route of routes) {
    const page = await context.newPage();
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto(`${baseURL}${route}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(700);
    const slug = route === '/' ? 'home' : route.slice(1).replaceAll('/', '-');
    const screenshot = path.join(outDir, `${slug}-${viewport.name}.png`);
    await page.screenshot({ path: screenshot, fullPage: true });
    const metrics = await page.evaluate(() => {
      const rect = el => { const r = el.getBoundingClientRect(); return { x:r.x, y:r.y, width:r.width, height:r.height, right:r.right, bottom:r.bottom }; };
      const interactive = [...document.querySelectorAll('button,a,input,select,textarea,[role="button"]')]
        .filter(el => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0; });
      const fields = [...document.querySelectorAll('input:not([type="hidden"]),select,textarea')].map(el => ({
        tag: el.tagName.toLowerCase(), type: el.getAttribute('type') || '', id: el.id, name: el.getAttribute('name') || '',
        label: el.labels?.[0]?.textContent?.trim() || '', placeholder: el.getAttribute('placeholder') || '', rect: rect(el)
      }));
      return {
        url: location.href,
        title: document.title,
        htmlScrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        viewportWidth: innerWidth,
        tooSmall: interactive.filter(el => { const r=el.getBoundingClientRect(); return r.width < 44 || r.height < 44; }).slice(0,30).map(el => ({ tag:el.tagName, text:(el.textContent||el.getAttribute('aria-label')||'').trim().slice(0,60), rect:rect(el) })),
        unlabeled: fields.filter(f => !f.label && !f.id),
        fields,
        forms: document.querySelectorAll('form').length,
        h1: [...document.querySelectorAll('h1')].map(el => el.textContent?.trim()),
      };
    });
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    results.push({ route, viewport, status: response?.status(), errors, metrics, violations: axe.violations.map(v => ({ id:v.id, impact:v.impact, nodes:v.nodes.length, targets:v.nodes.slice(0,5).map(n => n.target) })), screenshot });
    await page.close();
  }
  await context.close();
}
await browser.close();
await fs.writeFile(path.join(outDir, 'results.json'), JSON.stringify({ baseURL, results }, null, 2));
for (const r of results) console.log(`${r.viewport.name.padEnd(7)} ${r.route.padEnd(28)} status=${r.status} overflow=${Math.max(r.metrics.htmlScrollWidth,r.metrics.bodyScrollWidth)-r.metrics.viewportWidth} small=${r.metrics.tooSmall.length} axe=${r.violations.length} errors=${r.errors.length} final=${r.metrics.url}`);
