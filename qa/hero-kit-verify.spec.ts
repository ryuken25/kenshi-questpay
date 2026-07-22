import { test, expect } from "@playwright/test";

/**
 * Verifies the ported kit HeroCube: VERSE mark + local assets on desktop,
 * cursor-follow actually responds to the pointer, and mobile falls back with no
 * 3D rig (desktop-only).
 */

test.describe("desktop hero (1280px)", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("kit cube renders with VERSE mark + cursor-follow responds", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

    await page.goto("/");
    const cube = page.locator(".kit-hero-cube");
    await expect(cube).toBeVisible();

    // VERSE neon mark on the cube, served locally (no external hotlink).
    const verseMark = cube.locator('img[src*="verse-mark-neon"]').first();
    await expect(verseMark).toHaveAttribute("src", /^\/brand\/verse\/verse-mark-neon\.svg/);

    // Cursor-follow: the rig transform is purely pointer-driven (no idle sine).
    // At rest it is identity/translate(0,0); moving the pointer into the hero
    // must push it to a non-zero translate, and leaving must ease it back.
    const rig = page.locator("[data-hero-rig]");
    await expect(rig).toBeVisible();

    const box = await cube.boundingBox();
    if (!box) throw new Error("no cube box");

    // Move the pointer to the right side of the hero and let the lerp settle.
    for (let i = 0; i < 8; i++) {
      await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.5);
      await page.waitForTimeout(60);
    }
    const moved = await rig.evaluate((el) => getComputedStyle(el).transform);
    // A non-identity matrix means the rig shifted toward the pointer.
    expect(moved === "none" || moved === "matrix(1, 0, 0, 1, 0, 0)").toBeFalsy();

    expect(errors, `console errors: ${errors.join(" | ")}`).toHaveLength(0);
    await page.screenshot({ path: "qa-shots/hero-desktop-1280.png" });
  });
});

test.describe("mobile hero (360px)", () => {
  test.use({ viewport: { width: 360, height: 780 } });

  test("no 3D rig on mobile (fallback), no horizontal overflow", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Desktop-only cube must NOT mount below 1024px.
    await expect(page.locator(".kit-hero-cube")).toHaveCount(0);
    await expect(page.locator("[data-hero-rig]")).toHaveCount(0);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(2);
    await page.screenshot({ path: "qa-shots/hero-mobile-360.png" });
  });
});
