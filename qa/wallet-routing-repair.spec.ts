import { expect, test } from "@playwright/test";

test("deep how-it-works exposes creator and buyer workflows", async ({ page }) => {
  await page.goto("/how-it-works");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/brief|delivery/i);
  await expect(page.locator("#creator-workflow")).toBeVisible();
  await expect(page.locator("#buyer-workflow")).toBeVisible();
});

test("deep workflow detail actions disclose real content", async ({ page }) => {
  await page.goto("/how-it-works");
  const button = page.getByRole("button", { name: "View service details" });
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await button.click();
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#detail-service")).toBeVisible();
});

test("homepage audience detail actions reach authoritative routes", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Learn about becoming a QuestPay creator" })).toHaveAttribute("href", "/for-creators");
  await expect(page.getByRole("link", { name: "View buyer details" })).toHaveAttribute("href", "/how-it-works#buyer-workflow");
});

test("desktop story mounts exactly one active panel", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.locator("#inside-questpay").scrollIntoViewIfNeeded();
  await expect(page.locator("#inside-questpay [role=tabpanel]")).toHaveCount(1);
  await expect(page.locator("#inside-questpay [role=tabpanel]:visible")).toHaveCount(1);
});

test("logout redirects home and prevents sign-in bounce", async ({ request }) => {
  const response = await request.post("/api/auth/logout", { maxRedirects: 0 });
  expect(response.status()).toBe(303);
  expect(response.headers().location).toMatch(/\/$/);
  expect(response.headers().location).not.toContain("/sign-in");
  expect(response.headers()["cache-control"]).toContain("no-store");
});

test("wallet chooser cancel returns to auth without closing the dialog", async ({ page }) => {
  await page.route("**/api/auth/session", (route) => route.fulfill({ json: { authenticated: false, roles: [] } }));
  await page.goto("/");
  await page.getByRole("button", { name: "Sign In" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Connect Wallet" }).click();
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Connect Wallet" })).toBeVisible();
});

test("cancel invalidates a wallet request that never resolves", async ({ browser }) => {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    Object.defineProperty(window, "ethereum", {
      configurable: true,
      value: {
        request: ({ method }: { method: string }) => {
          if (method === "eth_chainId") return Promise.resolve("0x89");
          if (method === "eth_accounts") return Promise.resolve([]);
          if (method === "eth_requestAccounts") return new Promise(() => {});
          return Promise.resolve(null);
        },
        on: () => {},
        removeListener: () => {},
      },
    });
  });
  const page = await context.newPage();
  let authWrites = 0;
  await page.route("**/api/auth/session", (route) => route.fulfill({ json: { authenticated: false, roles: [] } }));
  await page.route("**/api/auth/wallet/**", (route) => { authWrites += 1; return route.abort(); });
  await page.goto("/");
  await page.getByRole("button", { name: "Sign In" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Connect Wallet" }).click();
  await dialog.getByRole("button", { name: /Injected.*Sign in/ }).click();
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeEnabled();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog.getByRole("button", { name: "Connect Wallet" })).toBeVisible();
  await page.waitForTimeout(250);
  expect(authWrites).toBe(0);
  await context.close();
});

test("mobile repair routes do not overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["/", "/how-it-works", "/services"]) {
    await page.goto(route);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  }
});
