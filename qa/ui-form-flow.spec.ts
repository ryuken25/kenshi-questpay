import { expect, test } from '@playwright/test';

const checkoutPath = '/checkout/ux-quick-look';

test.describe('checkout brief UX', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('explains validation, advances steps, validates contact and has no mobile bottom nav', async ({ page }) => {
    await page.goto(checkoutPath, { waitUntil: 'domcontentloaded' });

    const goal = page.getByLabel('What should this service help you achieve? *');
    const continueButton = page.getByRole('button', { name: 'Continue to contact details' });
    await expect(continueButton).toBeDisabled();
    await expect(page.getByText('Add at least 10 characters')).toBeVisible();

    await goal.fill('Improve the checkout conversion flow');
    await expect(continueButton).toBeEnabled();
    await continueButton.click();

    const contact = page.getByLabel('Contact value *');
    const reviewButton = page.getByRole('button', { name: /Save & Sign In|Review/ });
    await contact.fill('invalid');
    await expect(reviewButton).toBeDisabled();
    await expect(page.getByText(/Use your public username/)).toBeVisible();

    await contact.fill('@questpay_user');
    await expect(reviewButton).toBeEnabled();

    await expect(page.locator('.qp-mobile-bottomnav')).toHaveCount(0);
    const actionPosition = await page.evaluate(() => {
      const actions = document.querySelector('.qp-checkout-actions')?.getBoundingClientRect();
      if (!actions) return null;
      return { bottom: actions.bottom, viewport: window.innerHeight };
    });
    expect(actionPosition).not.toBeNull();
    expect(actionPosition!.bottom).toBeLessThanOrEqual(actionPosition!.viewport);
  });
});

test.describe('service catalog mobile controls', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('search, sort and category controls meet touch target minimums', async ({ page }) => {
    await page.goto('/services', { waitUntil: 'domcontentloaded' });
    const controls = [
      page.getByRole('searchbox', { name: 'Search services' }),
      page.getByLabel('Sort services'),
      page.getByRole('button', { name: /^All/ }),
      page.getByRole('button', { name: /^Review/ }),
      page.getByRole('button', { name: /^Build/ }),
      page.getByRole('button', { name: /^Integration/ }),
    ];
    for (const control of controls) {
      const box = await control.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }

    await page.getByRole('button', { name: 'More menu' }).click();
    const drawer = page.getByRole('dialog', { name: 'More navigation' });
    await expect(drawer.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(drawer.getByRole('link', { name: 'Services' })).toBeVisible();
    await expect(drawer.getByRole('link', { name: 'How It Works' })).toBeVisible();
  });
});
