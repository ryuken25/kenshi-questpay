import { expect, test } from "@playwright/test";

const navLinks = [
  ["Products", "/services"],
  ["How It Works", "/how-it-works#overview"],
  ["For Creators", "/#for-creators"],
  ["Pricing", "/services#pricing"],
  ["About", "/#about"],
] as const;

const deepAnchors = ["overview", "service", "profile", "brief", "quote", "payment", "verification", "tracking", "delivery", "receipt", "creator", "buyer", "failures", "security", "faq", "about"];

test("public navigation destinations are real", async ({ page }) => {
  await page.goto("/");
  for (const [label, destination] of navLinks) {
    const link = page.getByRole("link", { name: label, exact: true }).first();
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", destination);
  }
});

test("signed-out selling CTAs open creator auth", async ({ page }) => {
  await page.route("**/api/auth/session", (route) => route.fulfill({ json: { authenticated: false, roles: [] } }));
  await page.goto("/");
  await page.getByRole("button", { name: "Start Selling", exact: true }).first().click();
  await expect(page.getByRole("dialog", { name: /questpay sign in/i })).toBeVisible();
});

test("signed-in navbar exposes account destination", async ({ page }) => {
  await page.route("**/api/auth/session", (route) => route.fulfill({ json: { authenticated: true, roles: ["buyer"] } }));
  await page.goto("/");
  await expect(page.getByRole("link", { name: /account/i }).first()).toHaveAttribute("href", "/account");
});

test("deep how-it-works anchors and actions exist", async ({ page }) => {
  await page.goto("/how-it-works#payment");
  for (const anchor of deepAnchors) await expect(page.locator(`#${anchor}`)).toHaveCount(1);
  await expect(page.locator("#payment")).toBeVisible();
  await expect(page.getByRole("link", { name: /open receipt verifier/i })).toHaveAttribute("href", "/verify");
  await page.getByRole("button", { name: "Start Selling", exact: true }).last().click();
  await expect(page.getByRole("dialog", { name: /questpay sign in/i })).toBeVisible();
});

test("services and homepage package CTAs reach package details", async ({ page }) => {
  for (const route of ["/", "/services"]) {
    await page.goto(route);
    const packageLinks = page.locator('a[href^="/services/"]');
    expect(await packageLinks.count()).toBeGreaterThan(0);
    const hrefs = await packageLinks.evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    expect(hrefs.every((href) => /^\/services\/[a-z0-9-]+$/.test(href || ""))).toBe(true);
  }
});

test("public pages contain no placeholder link", async ({ page }) => {
  for (const route of ["/", "/services", "/how-it-works", "/faq", "/privacy", "/terms", "/verify", "/sign-in"]) {
    await page.goto(route);
    await expect(page.locator('a[href="#"], a:not([href])'), `${route} placeholder links`).toHaveCount(0);
  }
});

test("R3F scene exposes four tokens and ignores pointer input", async ({ page }) => {
  await page.goto("/");
  const scene = page.getByTestId("hero-orbital-scene");
  await expect(scene).toHaveAttribute("data-hero3d-engine", "react-three-fiber");
  await expect(scene).toHaveAttribute("data-hero3d-token-count", "4");
  await expect(scene.locator("canvas")).toBeVisible();
  await expect(scene.locator("canvas")).toHaveCSS("pointer-events", "none");
});

test("mobile headline and CTA precede a non-blocking scene with no overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const dimensions = await page.evaluate(() => ({
    html: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    width: window.innerWidth,
  }));
  expect(dimensions.html).toBeLessThanOrEqual(dimensions.width + 1);
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.width + 1);
  const heading = page.getByRole("heading", { level: 1 });
  const explore = page.getByRole("link", { name: /explore services/i });
  const scene = page.getByTestId("hero-orbital-scene");
  await expect(heading).toBeVisible();
  await expect(explore).toBeVisible();
  const [ctaBox, sceneBox] = await Promise.all([explore.boundingBox(), scene.boundingBox()]);
  expect(ctaBox?.y ?? Infinity).toBeLessThan(sceneBox?.y ?? -Infinity);
});
