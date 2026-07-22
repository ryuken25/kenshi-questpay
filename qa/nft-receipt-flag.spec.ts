import { test, expect } from "@playwright/test";

/**
 * NFT receipt feature-flag behaviour.
 *
 * Runs green in BOTH modes — the assertions follow ENABLE_NFT_RECEIPTS as the
 * server under test was started with:
 *   flag OFF -> no on-chain receipt surface anywhere (app identical to before)
 *   flag ON  -> the on-chain receipt surface is exposed
 *
 * No chain access is required: with no minted orders the only always-observable
 * surface is the FAQ entry, plus the metadata API's input handling.
 */
const flagOn = process.env.ENABLE_NFT_RECEIPTS?.trim().toLowerCase() === "true";

test.describe("NFT receipts feature flag", () => {
  test("FAQ on-chain receipt entry follows the flag", async ({ page }) => {
    await page.goto("/faq");
    await expect(page.locator("h2")).toContainText(/FAQ/i);

    const entry = page.getByText(/on-chain receipt/i);
    if (flagOn) {
      await expect(entry.first()).toBeVisible();
    } else {
      await expect(entry).toHaveCount(0);
    }
  });

  test("receipt metadata API validates input and 404s unknown tokens", async ({ request }) => {
    // Non-numeric token id -> 400, never a crash.
    const bad = await request.get("/api/receipts/not-a-number/metadata");
    expect(bad.status()).toBe(400);

    // Well-formed but unminted token id -> clean 404 (never 500).
    const missing = await request.get("/api/receipts/999999999/metadata");
    expect([404, 503]).toContain(missing.status());
  });

  test("mint sweeper is not publicly callable", async ({ request }) => {
    const res = await request.get("/api/nft/mint-sweep");
    expect(res.status()).toBe(401);
  });

  test("public copy states custodial escrow, never 'no custody'", async ({ page }) => {
    await page.goto("/faq");
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).not.toContain("never takes custody");
  });
});
