import { expect, test } from '@playwright/test';

const routes = ['/', '/services', '/how-it-works', '/faq', '/verify', '/studio/login'];

test('all routes share the same production shell', async ({ page }) => {
  const builds = new Set<string>();
  for (const route of routes) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
    const sha = await page.locator('body').getAttribute('data-build-sha');
    expect(sha).toBeTruthy();
    expect(sha).not.toBe('local');
    expect(sha).not.toBe('unknown');
    builds.add(sha!);
    await expect(page.locator('body')).not.toContainText('Base Sepolia');
    await expect(page.locator('body')).not.toContainText('⚔');
    await expect(page.locator('body')).not.toContainText('Start Quest');
    await expect(page.locator('body')).not.toContainText('build local');
  }
  expect(builds.size).toBe(1);
});

test('premium hero is on root homepage', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/creator services/i);
  await expect(page.getByTestId('hero-orbital-scene')).toBeVisible();
});

test('sign-in prioritizes auth methods', async ({ page }) => {
  await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: /connect wallet/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /auth flow/i })).toHaveCount(0);
});

test('mobile routes have no horizontal overflow', async ({ page }) => {
  for (const width of [320, 360, 390, 430, 768]) {
    await page.setViewportSize({ width, height: width === 768 ? 1024 : 844 });
    for (const route of ['/', '/sign-in', '/services', '/how-it-works', '/faq', '/studio/login']) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      const overflow = await page.evaluate(() => ({
        width: window.innerWidth,
        doc: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
      }));
      expect(overflow.doc, `${route} doc overflow at ${width}`).toBeLessThanOrEqual(overflow.width + 1);
      expect(overflow.body, `${route} body overflow at ${width}`).toBeLessThanOrEqual(overflow.width + 1);
    }
  }
});

test('mobile sign-in exposes auth early', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
  const button = page.getByRole('button', { name: /connect wallet/i });
  await expect(button).toBeVisible();
  const box = await button.boundingBox();
  expect(box?.y ?? 9999).toBeLessThan(844);
});
