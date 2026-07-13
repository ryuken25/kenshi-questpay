const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const base = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const root = path.join(process.cwd(), "qa", "wallet-routing-repair-evidence");
const shots = path.join(root, "screenshots");
const videos = path.join(root, "videos");
fs.rmSync(root, { recursive: true, force: true });
fs.mkdirSync(shots, { recursive: true });
fs.mkdirSync(videos, { recursive: true });

const viewports = [
  { width: 320, height: 568 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
];

(async () => {
  let browser = await chromium.launch({ headless: true });
  const results = { base, generatedAt: new Date().toISOString(), matrix: [], lifecycle: {}, reducedMotion: {}, video: null };

  for (const viewport of viewports) {
    for (const route of ["/", "/how-it-works"]) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      const errors = [];
      const failedAssets = [];
      page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("response", (response) => {
        if (/\/assets\/how-it-works\//.test(response.url()) && response.status() >= 400) failedAssets.push({ url: response.url(), status: response.status() });
      });
      await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
      const metrics = await page.evaluate(() => {
        const interactive = Array.from(document.querySelectorAll("a,button")).filter((node) => {
          const rect = node.getBoundingClientRect();
          const style = getComputedStyle(node);
          return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden";
        });
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          minInteractiveHeight: Math.min(...interactive.map((node) => node.getBoundingClientRect().height)),
          undersizedMobileControls: innerWidth <= 768 ? interactive.filter((node) => node.getBoundingClientRect().height < 44).map((node) => (node.getAttribute("aria-label") || node.textContent || "").trim().replace(/\s+/g, " ").slice(0, 80)) : [],
        };
      });
      const record = { viewport, route, ...metrics, errors, failedAssets };
      if (route === "/") {
        record.hero = await page.locator('[data-testid="hero-orbital-scene"]').evaluate((node) => ({
          engine: node.getAttribute("data-hero3d-engine"),
          tokenCount: node.getAttribute("data-hero3d-token-count"),
          quality: node.getAttribute("data-hero3d-quality"),
          canvasCount: node.querySelectorAll("canvas").length,
        }));
      } else {
        record.deepAnchors = await page.locator("#creator-workflow, #buyer-workflow, #verification, #failures, #security, #faq").count();
      }
      results.matrix.push(record);

      const suffix = `${viewport.width}x${viewport.height}`;
      if (viewport.width === 390 || viewport.width === 1440) {
        await page.screenshot({ path: path.join(shots, `${route === "/" ? "home" : "how"}-${suffix}.png`) });
        if (route === "/") {
          await page.locator("#inside-questpay").scrollIntoViewIfNeeded();
          await page.waitForTimeout(700);
          await page.screenshot({ path: path.join(shots, `home-story-${suffix}.png`) });
        } else {
          await page.locator("#creator-workflow").scrollIntoViewIfNeeded();
          await page.waitForTimeout(350);
          await page.screenshot({ path: path.join(shots, `how-audiences-${suffix}.png`) });
        }
      }
      await context.close();
    }
  }

  // R3F/WebGL can retain GPU-process memory after context.close() on software
  // renderers. Restart Chromium between probe phases for deterministic CI QA.
  await browser.close();
  browser = await chromium.launch({ headless: true });

  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(base, { waitUntil: "networkidle" });
    await page.locator("#inside-questpay").scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);
    const firstPins = await page.locator(".pin-spacer").count();
    await page.goto(`${base}/how-it-works`, { waitUntil: "networkidle" });
    await page.goto(base, { waitUntil: "networkidle" });
    await page.locator("#inside-questpay").scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);
    results.lifecycle = {
      firstPins,
      secondPins: await page.locator(".pin-spacer").count(),
      activePanels: await page.locator("#inside-questpay [role=tabpanel]").count(),
    };
    await context.close();
  }

  await browser.close();
  browser = await chromium.launch({ headless: true });

  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto(base, { waitUntil: "networkidle" });
    await page.locator("#inside-questpay").scrollIntoViewIfNeeded();
    await page.waitForTimeout(350);
    results.reducedMotion = {
      pinSpacers: await page.locator(".pin-spacer").count(),
      activePanels: await page.locator("#inside-questpay [role=tabpanel]").count(),
      heroReduced: await page.locator('[data-testid="hero-orbital-scene"]').getAttribute("data-hero3d-reduced-motion"),
    };
    await context.close();
  }

  await browser.close();
  browser = await chromium.launch({ headless: true });

  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: videos, size: { width: 1280, height: 800 } } });
    const page = await context.newPage();
    await page.goto(base, { waitUntil: "networkidle" });
    await page.waitForTimeout(3500);
    await page.locator("#inside-questpay").scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 1800);
    await page.waitForTimeout(4000);
    await page.goto(`${base}/how-it-works`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    await page.locator("#creator-workflow").scrollIntoViewIfNeeded();
    await page.waitForTimeout(1800);
    const video = page.video();
    await context.close();
    const source = await video.path();
    const target = path.join(videos, "questpay-how-wallet-routing-repair.webm");
    fs.renameSync(source, target);
    results.video = path.relative(process.cwd(), target);
  }

  await browser.close();
  fs.writeFileSync(path.join(root, "results.json"), JSON.stringify(results, null, 2));
  const failures = results.matrix.filter((entry) => entry.overflow > 1 || entry.errors.length || entry.failedAssets.length || entry.undersizedMobileControls.length || (entry.route === "/" && (entry.hero.engine !== "react-three-fiber" || entry.hero.tokenCount !== "4")) || (entry.route === "/how-it-works" && entry.deepAnchors !== 6));
  if (failures.length || results.lifecycle.firstPins > 1 || results.lifecycle.secondPins > 1 || results.lifecycle.activePanels !== 1 || results.reducedMotion.pinSpacers !== 0 || results.reducedMotion.activePanels !== 1 || results.reducedMotion.heroReduced !== "true") {
    console.error(JSON.stringify({ failures, lifecycle: results.lifecycle, reducedMotion: results.reducedMotion }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({ cases: results.matrix.length, lifecycle: results.lifecycle, reducedMotion: results.reducedMotion, video: results.video }));
})().catch((error) => { console.error(error); process.exit(1); });
