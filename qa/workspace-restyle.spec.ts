import { expect, test, type Page } from "@playwright/test";

/**
 * Workspace restyle coverage (Agent S — VISUAL LAYER).
 *
 * Verifies the restyled buyer workspace (My Receipts / My Orders), the order
 * detail workspace, and the public order-success page render the new
 * receipt-card family with NO horizontal overflow and NO uncaught page errors
 * at both 360px (mobile-first) and 1280px (desktop). Also proves the sidebar
 * logo is now a crisp inline <svg> rather than a raster <img>.
 *
 * Auth-gated surfaces (/receipts, /my-orders, /orders/<id>) redirect anonymous
 * visitors to /sign-in; those cases are asserted as a clean gate (mirrors
 * qa/order-workspace.spec.ts + qa/verify-ux.spec.ts). The success page is
 * public and runs deterministically.
 */

const REAL_ORDER = "qp-mrwrbroz-akkn2e";
const WIDTHS = [360, 1280] as const;

// Demo rows from the reference that must NEVER be rendered by the real app.
const DEMO_LITERALS = ["QP-2026-0163", "Integration Sprint 90", "90.0142"];

function onSignIn(page: Page): boolean {
  return new URL(page.url()).pathname.startsWith("/sign-in");
}

async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

/**
 * Collect uncaught exceptions. Ignores the dev-server-only CSP artifact: Next's
 * HMR evaluates strings as JS, which the app's strict `script-src` (no
 * 'unsafe-eval') rejects with an EvalError. That never happens under
 * `next start` (production), so filtering it keeps this guard meaningful in
 * both environments while still catching real app exceptions.
 */
function trackPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => {
    const msg = String(e);
    if (/unsafe-eval|content security policy|evalerror/i.test(msg)) return;
    errors.push(msg);
  });
  return errors;
}

/**
 * Navigate to an auth-gated workspace route and wait for its terminal state.
 * Anonymous → the server `redirect()` lands on /sign-in (a settled 307 in
 * production; a client-side RSC navigation moments after domcontentloaded in
 * dev). Authenticated → the page renders its own <h1>. Waiting for either keeps
 * the assertions from racing the redirect across both environments.
 */
async function gotoWorkspace(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page
    .waitForFunction(
      () =>
        location.pathname.startsWith("/sign-in") ||
        Boolean(document.querySelector("h1")?.textContent?.trim()),
      undefined,
      { timeout: 15000 },
    )
    .catch(() => {});
}

for (const width of WIDTHS) {
  test(`/receipts restyle renders or gates cleanly @${width}px`, async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.setViewportSize({ width, height: 900 });
    await gotoWorkspace(page, "/receipts");

    if (onSignIn(page)) {
      expect(new URL(page.url()).searchParams.get("next")).toBe("/receipts");
    } else {
      await expect(page.getByRole("heading", { name: /my receipts/i })).toBeVisible();
      // Restyled surface = the receipt-card family OR the designed empty state.
      const cards = page.locator(".qp-receipt-card");
      const empty = page.getByText(/no receipts yet/i);
      await expect(cards.first().or(empty)).toBeVisible();
    }

    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(2);
    expect(errors).toEqual([]);
  });

  test(`/my-orders restyle renders or gates cleanly @${width}px`, async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.setViewportSize({ width, height: 900 });
    await gotoWorkspace(page, "/my-orders");

    if (onSignIn(page)) {
      expect(new URL(page.url()).searchParams.get("next")).toBe("/my-orders");
    } else {
      await expect(page.getByRole("heading", { name: /my orders/i })).toBeVisible();
      const rows = page.getByTestId("order-row");
      const empty = page.getByText(/no orders yet/i);
      await expect(rows.first().or(empty)).toBeVisible();
    }

    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(2);
    expect(errors).toEqual([]);
  });

  test(`order detail restyle renders or gates cleanly @${width}px`, async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.setViewportSize({ width, height: 900 });
    await gotoWorkspace(page, `/orders/${REAL_ORDER}`);

    if (onSignIn(page)) {
      expect(new URL(page.url()).searchParams.get("next")).toBe(`/orders/${REAL_ORDER}`);
    } else {
      const stepper = page.getByTestId("lifecycle-stepper");
      const gate = page.getByTestId("access-gate");
      const notFound = page.getByText(/order not found/i);
      await expect(stepper.or(gate).or(notFound).first()).toBeVisible();
    }

    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(2);
    expect(errors).toEqual([]);
  });

  test(`order success page renders the restyled proof @${width}px (public)`, async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/orders/${REAL_ORDER}/success`, { waitUntil: "domcontentloaded" });

    await expect(page.getByText(/payment confirmed/i)).toBeVisible();
    await expect(page.getByText(/what happens next/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /view order progress/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /view receipt/i })).toBeVisible();
    // Restyled to the receipt-card family.
    await expect(page.locator(".qp-receipt-card").first()).toBeVisible();

    // Reference DEMO data must never appear on a real surface.
    const body = (await page.locator("body").innerText()).toLowerCase();
    for (const literal of DEMO_LITERALS) expect(body).not.toContain(literal.toLowerCase());

    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(2);
    expect(errors).toEqual([]);
  });
}

test("sidebar brand is a crisp inline SVG, not a raster logo (desktop)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  // Any shell page works; the public success page renders the sidebar at ≥1180px.
  await page.goto(`/orders/${REAL_ORDER}/success`, { waitUntil: "domcontentloaded" });

  const logo = page.locator(".qp-sidebar__logo");
  await expect(logo).toBeVisible();
  await expect(logo.locator("svg")).toHaveCount(1);
  await expect(logo.locator("img")).toHaveCount(0);
});
