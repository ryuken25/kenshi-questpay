import { expect, test } from '@playwright/test';

test('anonymous checkout uses a compact auth popup instead of an inline auth panel', async ({ page }) => {
  await page.goto('/checkout/ux-quick-look');

  await expect(page.getByRole('heading', { name: /ux quick look/i })).toBeVisible();
  const trigger = page.getByRole('button', { name: /sign in to continue/i });
  await expect(trigger).toBeVisible();
  await expect(page.getByRole('button', { name: /connect wallet/i })).not.toBeVisible();
  await expect(page.getByLabel(/email magic link/i)).not.toBeVisible();

  await trigger.click();
  const dialog = page.getByRole('dialog', { name: /questpay sign in/i });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: /connect wallet/i })).toBeVisible();
  await expect(dialog.getByRole('button', { name: /google/i })).toBeVisible();
  await expect(dialog.getByLabel(/email magic link/i)).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test('anonymous order creation remains blocked server-side', async ({ request }) => {
  const response = await request.post('/api/orders', {
    data: { slug: 'ux-quick-look', chainKey: 'polygon', tokenSymbol: 'USDT', brief: {} },
  });
  expect(response.status()).toBe(401);
});
