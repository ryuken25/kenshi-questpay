import { expect, test } from '@playwright/test';

/**
 * Verify-UX coverage. Runs against PLAYWRIGHT_BASE_URL when set, else the
 * local production server (see playwright.config.ts).
 *
 * The real PAID order tx (qp-mrwrbroz-akkn2e) drives the green path; the verify
 * endpoint returns ok:true for it. No verification logic is exercised or changed
 * here — these tests only assert the UI around GET /api/verify/[txHash].
 */
const REAL_TX = '0xb8789977d58898d6e0c2027e4786287415d9b62aed1b77eaa0841f0795d1c2d8';
// Well-formed but not a QuestPay payment → endpoint answers 404 (clean fail, no 500).
const BOGUS_TX = '0x' + '0'.repeat(64);

const hashField = /transaction hash/i;
const verifyButton = /^verify$/i;

test('manual inline verify renders a green result in place for the real paid tx', async ({ page }) => {
  await page.goto('/verify', { waitUntil: 'domcontentloaded' });

  await page.getByLabel(hashField).fill(REAL_TX);
  await page.getByRole('button', { name: verifyButton }).click();

  await expect(page.getByText(/payment verified/i)).toBeVisible({ timeout: 20_000 });
  // Verified in place — no navigation away from /verify.
  expect(new URL(page.url()).pathname).toBe('/verify');
});

test('bogus hash fails cleanly with no 500 and no navigation', async ({ page }) => {
  const verifyStatuses: number[] = [];
  page.on('response', (res) => {
    if (res.url().includes('/api/verify/')) verifyStatuses.push(res.status());
  });

  await page.goto('/verify', { waitUntil: 'domcontentloaded' });
  await page.getByLabel(hashField).fill(BOGUS_TX);
  await page.getByRole('button', { name: verifyButton }).click();

  await expect(page.getByText(/verification failed/i)).toBeVisible({ timeout: 20_000 });
  expect(verifyStatuses.length).toBeGreaterThan(0);
  for (const status of verifyStatuses) expect(status).toBeLessThan(500);
  expect(new URL(page.url()).pathname).toBe('/verify');
});

test('/verify?tx=<real> prefills the field and auto-runs to a green result', async ({ page }) => {
  await page.goto(`/verify?tx=${REAL_TX}`, { waitUntil: 'domcontentloaded' });

  // No interaction: the deep link auto-runs verification once on load.
  await expect(page.getByText(/payment verified/i)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByLabel(hashField)).toHaveValue(REAL_TX);
});

test('verify result panel fits 360px with no horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto(`/verify?tx=${REAL_TX}`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText(/payment verified/i)).toBeVisible({ timeout: 20_000 });

  const box = await page.evaluate(() => ({
    width: window.innerWidth,
    doc: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(box.doc, 'document overflow at 360px').toBeLessThanOrEqual(box.width + 1);
  expect(box.body, 'body overflow at 360px').toBeLessThanOrEqual(box.width + 1);
});

test('receipts inline verify widget verifies in place (skips without a buyer session)', async ({ page }) => {
  await page.goto('/receipts', { waitUntil: 'domcontentloaded' });
  test.skip(
    new URL(page.url()).pathname.startsWith('/sign-in'),
    'no authenticated buyer session in this environment',
  );

  const button = page.getByTestId('inline-verify-button').first();
  test.skip((await button.count()) === 0, 'no paid receipts to verify for this account');

  await button.click();
  await expect(
    page.getByText(/payment verified|verification failed/i).first(),
  ).toBeVisible({ timeout: 20_000 });
});
