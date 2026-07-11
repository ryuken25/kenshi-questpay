import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const routes = ['/', '/services', '/how-it-works', '/faq', '/studio/login', '/verify'];

for (const route of routes) {
  test(`${route} has no serious contrast issue`, async ({ page }) => {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    const serious = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
    expect(serious.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }))).toEqual([]);
  });
}

test('visible text is not rendered with extreme opacity', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const failures = await page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>('body *'))
    .filter((element) => {
      const text = element.innerText?.trim();
      if (!text) return false;
      if (element.children.length > 0) return false;
      const style = getComputedStyle(element);
      const opacity = Number(style.opacity);
      return style.visibility !== 'hidden' && style.display !== 'none' && opacity < 0.7;
    })
    .map((element) => ({ text: element.innerText.slice(0, 80), className: String(element.className) })));
  expect(failures).toEqual([]);
});
