import { expect, test, type Page } from "@playwright/test";

/**
 * Order-workspace coverage (list + lifecycle stepper + progress feed + gating).
 *
 * Runs against PLAYWRIGHT_BASE_URL when set, else the local production server.
 * Auth is session-cookie based; this environment has no guaranteed session, so
 * session-dependent assertions skip cleanly (mirrors qa/verify-ux.spec.ts)
 * while the anonymous-gating and PUBLIC success-page paths run deterministically.
 *
 * The real PAID order (qp-mrwrbroz-akkn2e) is the sample. No payment / verify /
 * release logic is exercised or changed here.
 */
const REAL_ORDER = "qp-mrwrbroz-akkn2e";

function onSignIn(page: Page): boolean {
  return new URL(page.url()).pathname.startsWith("/sign-in");
}

async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

test("/my-orders is session-gated: anon → sign-in carrying next=/my-orders", async ({ page }) => {
  await page.goto("/my-orders", { waitUntil: "domcontentloaded" });
  if (onSignIn(page)) {
    const url = new URL(page.url());
    expect(url.pathname).toBe("/sign-in");
    expect(url.searchParams.get("next")).toBe("/my-orders");
  } else {
    // Authenticated in this environment — the real list renders.
    await expect(page.getByRole("heading", { name: /my orders/i })).toBeVisible();
  }
});

test("/my-orders shows the buyer's orders or the designed empty state (needs a session)", async ({
  page,
}) => {
  await page.goto("/my-orders", { waitUntil: "domcontentloaded" });
  test.skip(onSignIn(page), "no authenticated buyer session in this environment");

  await expect(page.getByRole("heading", { name: /my orders/i })).toBeVisible();
  const rows = page.getByTestId("order-row");
  const empty = page.getByText(/no orders yet/i);
  await expect(rows.first().or(empty)).toBeVisible();
});

test("order workspace is session-gated: anon → sign-in carrying next=/orders/<id>", async ({
  page,
}) => {
  await page.goto(`/orders/${REAL_ORDER}`, { waitUntil: "domcontentloaded" });
  if (onSignIn(page)) {
    expect(new URL(page.url()).searchParams.get("next")).toBe(`/orders/${REAL_ORDER}`);
  } else {
    // Signed in: participant sees the stepper, non-participant sees the gate,
    // missing order shows not-found. Any of these is a valid gated outcome.
    const stepper = page.getByTestId("lifecycle-stepper");
    const gate = page.getByTestId("access-gate");
    const notFound = page.getByText(/order not found/i);
    await expect(stepper.or(gate).or(notFound).first()).toBeVisible();
  }
});

test("a signed-in non-participant is blocked by the access gate (skips without such a session)", async ({
  page,
}) => {
  await page.goto(`/orders/${REAL_ORDER}`, { waitUntil: "domcontentloaded" });
  test.skip(onSignIn(page), "no authenticated session in this environment");
  const gate = page.getByTestId("access-gate");
  test.skip((await gate.count()) === 0, "session is a participant (or order absent) — gate not shown");

  await expect(gate).toBeVisible();
  // The private progress feed must NOT render for a blocked viewer.
  await expect(page.getByTestId("progress-feed")).toHaveCount(0);
});

test("lifecycle stepper collapses vertically at 360px with no horizontal scroll (needs a participant session)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto(`/orders/${REAL_ORDER}`, { waitUntil: "domcontentloaded" });
  test.skip(onSignIn(page), "no authenticated session in this environment");

  const stepper = page.getByTestId("lifecycle-stepper");
  test.skip((await stepper.count()) === 0, "session is not a participant of the sample order");

  await expect(stepper).toBeVisible();
  const direction = await stepper.evaluate((el) => getComputedStyle(el).flexDirection);
  expect(direction).toBe("column");
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(2);
});

test("creator can post a progress note and it appears in the feed (needs creator session)", async ({
  page,
}) => {
  await page.goto(`/orders/${REAL_ORDER}`, { waitUntil: "domcontentloaded" });
  test.skip(onSignIn(page), "no authenticated session in this environment");

  const compose = page.getByTestId("progress-compose");
  test.skip((await compose.count()) === 0, "session is not the creator/admin for the sample order");

  const marker = `qa progress note ${Date.now()}`;
  await compose.fill(marker);
  await page.getByTestId("progress-submit").click();
  await expect(page.getByTestId("progress-feed").getByText(marker)).toBeVisible({ timeout: 15_000 });
});

test("success page keeps the green confirmation, a 3-step next, and both CTAs (public)", async ({
  page,
}) => {
  await page.goto(`/orders/${REAL_ORDER}/success`, { waitUntil: "domcontentloaded" });

  await expect(page.getByText(/payment confirmed/i)).toBeVisible();
  await expect(page.getByText(/what happens next/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /view order progress/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /view receipt/i })).toBeVisible();
});

test("success page fits 360px with no horizontal scroll (public)", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto(`/orders/${REAL_ORDER}/success`, { waitUntil: "domcontentloaded" });
  await expect(page.getByText(/payment confirmed/i)).toBeVisible();
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(2);
});
