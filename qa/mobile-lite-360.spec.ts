import { test, expect } from "@playwright/test";

/**
 * Mobile-lite animation tier — verified on a 360px viewport.
 * Confirms: the 3D hero is desktop-only (static fallback on phones), service
 * cards reveal (GSAP tier), checkout steps carry the tiered entrance class, and
 * nothing overflows horizontally.
 */
test.use({ viewport: { width: 360, height: 780 } });

test("360px home: 3D hero is desktop-only + service cards reveal + no overflow", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // 3D hero desktop-only: no WebGL scene at 360px (the mobile hero is the
  // lighter static/text treatment — the responsive design masks the 3D column).
  await expect(page.locator('[data-hero3d-engine="react-three-fiber"]')).toHaveCount(0);
  await expect(page.locator('[data-hero3d-fallback]')).toHaveCount(1);
  // The hero heading is present and animated in.
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // Service cards animate in via the GSAP lite tier and end fully visible.
  const card = page.locator("[data-reveal]").first();
  await card.scrollIntoViewIfNeeded();
  await expect(card).toBeVisible();
  await expect
    .poll(async () => Number(await card.evaluate((el) => getComputedStyle(el).opacity)), { timeout: 4000 })
    .toBeGreaterThan(0.95);

  // No horizontal overflow on a phone.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(2);

  await page.screenshot({ path: "qa-shots/mobile-lite-home-360.png", fullPage: false });
});

test("360px checkout: step carries the tiered entrance animation", async ({ page }) => {
  await page.goto("/checkout/ux-quick-look");
  await page.waitForLoadState("networkidle");

  const step = page.locator(".qp-step-enter").first();
  await expect(step).toBeVisible();
  await expect(step).toHaveClass(/qp-step-enter/);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(2);

  await page.screenshot({ path: "qa-shots/mobile-lite-checkout-360.png", fullPage: false });
});
