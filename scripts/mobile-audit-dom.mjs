// Mobile audit DOM inspection — programmatically measures layout issues
// Usage: node scripts/mobile-audit-dom.mjs
import { chromium } from '@playwright/test';

const BASE = 'https://kenshi-questpay.vercel.app';

const viewports = [
  { name: 'iphone14', width: 390, height: 844 },
  { name: 'galaxy-s20', width: 360, height: 800 },
  { name: 'iphone-se', width: 320, height: 568 },
  { name: 'ipad-portrait', width: 768, height: 1024 },
];

const pages = [
  { name: 'home', path: '/' },
  { name: 'services', path: '/services' },
  { name: 'checkout-ux-quick-look', path: '/checkout/ux-quick-look' },
  { name: 'verify', path: '/verify' },
  { name: 'sign-in', path: '/sign-in' },
];

const browser = await chromium.launch({ headless: true });

const findings = [];

function log(vp, page, msg, severity = 'info') {
  const entry = { vp, page, severity, msg };
  findings.push(entry);
  const tag = severity.toUpperCase().padEnd(8);
  console.log(`[${vp}|${page}] ${tag} ${msg}`);
}

for (const vp of viewports) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();

  for (const p of pages) {
    const url = BASE + p.path;
    console.log(`\n=== [${vp.name}] ${p.path} ===`);

    try {
      await page.goto(url, { waitUntil: 'load', timeout: 45000 });
      await page.waitForTimeout(2500);

      // Collect console errors
      const consoleErrors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      page.on('pageerror', (err) => consoleErrors.push(err.message));

      // Run comprehensive DOM audit
      const audit = await page.evaluate((vpInfo) => {
        const result = {};
        const vw = vpInfo.width;
        const vh = vpInfo.height;

        // --- Document metrics ---
        result.doc = {
          scrollWidth: document.documentElement.scrollWidth,
          scrollHeight: document.documentElement.scrollHeight,
          clientWidth: document.documentElement.clientWidth,
          clientHeight: document.documentElement.clientHeight,
          bodyScrollWidth: document.body.scrollWidth,
          bodyScrollHeight: document.body.scrollHeight,
          overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          overflowY: document.documentElement.scrollHeight - document.documentElement.clientHeight,
        };

        // --- Fixed/sticky elements (top bar, bottom nav) ---
        result.fixedElements = [];
        const all = document.querySelectorAll('*');
        for (const el of all) {
          const cs = getComputedStyle(el);
          if (cs.position === 'fixed' || cs.position === 'sticky') {
            const rect = el.getBoundingClientRect();
            result.fixedElements.push({
              tag: el.tagName.toLowerCase(),
              id: el.id || null,
              cls: el.className && typeof el.className === 'string' ? el.className.slice(0, 80) : null,
              role: el.getAttribute('role'),
              ariaLabel: el.getAttribute('aria-label'),
              position: cs.position,
              top: cs.top,
              bottom: cs.bottom,
              left: cs.left,
              right: cs.right,
              rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height, bottom: rect.bottom, right: rect.right },
              visible: rect.width > 0 && rect.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none',
            });
          }
        }

        // --- Sidebar detection ---
        // Look for elements with "sidebar" in class/id, or nav elements on the left side
        result.sidebar = { found: false, elements: [] };
        for (const el of all) {
          const cls = (typeof el.className === 'string' ? el.className : '') + ' ' + (el.id || '');
          const dataAttr = el.getAttribute('data-shell') || '';
          if (/sidebar|side-bar|app-sidebar|desktop-nav/i.test(cls + ' ' + dataAttr)) {
            const rect = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            result.sidebar.found = true;
            result.sidebar.elements.push({
              tag: el.tagName.toLowerCase(),
              cls: typeof el.className === 'string' ? el.className.slice(0, 80) : null,
              rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
              display: cs.display,
              visibility: cs.visibility,
              position: cs.position,
              transform: cs.transform !== 'none' ? cs.transform : null,
              offscreen: rect.x + rect.width <= 0 || rect.x >= vw || cs.display === 'none' || cs.visibility === 'hidden',
            });
          }
        }

        // --- Bottom nav detection ---
        result.bottomNav = { found: false, element: null };
        for (const el of result.fixedElements) {
          const ident = (el.cls || '') + ' ' + (el.id || '') + ' ' + (el.ariaLabel || '');
          if (/bottom.?nav|mobile.?nav|tab.?bar|bottom.?bar|nav.?bar/i.test(ident) ||
              (el.position === 'fixed' && el.bottom !== 'auto' && el.rect.h > 30 && el.rect.h < 120 && el.rect.w > vw * 0.5)) {
            result.bottomNav.found = true;
            result.bottomNav.element = el;
            break;
          }
        }

        // --- Top bar detection ---
        result.topBar = { found: false, element: null };
        for (const el of result.fixedElements) {
          const ident = (el.cls || '') + ' ' + (el.id || '') + ' ' + (el.ariaLabel || '');
          if (/top.?bar|header|app.?bar|mobile.?header/i.test(ident) ||
              (el.position === 'fixed' && el.top !== 'auto' && el.rect.h > 30 && el.rect.h < 120)) {
            result.topBar.found = true;
            result.topBar.element = el;
            break;
          }
        }

        // --- 3D scene / canvas detection ---
        result.canvas = { found: false, elements: [] };
        for (const el of document.querySelectorAll('canvas')) {
          const rect = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          const parent = el.parentElement;
          const parentRect = parent ? parent.getBoundingClientRect() : null;
          result.canvas.found = true;
          result.canvas.elements.push({
            rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height, right: rect.right, bottom: rect.bottom },
            parentRect: parentRect ? { x: parentRect.x, y: parentRect.y, w: parentRect.width, h: parentRect.height, right: parentRect.right, bottom: parentRect.bottom } : null,
            visible: rect.width > 0 && rect.height > 0,
            overflow: cs.overflow,
            parentOverflow: parent ? getComputedStyle(parent).overflow : null,
            // Check if canvas is wider than viewport
            widerThanViewport: rect.width > vw,
            // Check if canvas is clipped by parent
            clippedByParent: parentRect ? (rect.right > parentRect.right || rect.bottom > parentRect.bottom) : false,
          });
        }

        // --- Button/CTA detection — check if any are hidden behind bottom nav ---
        result.buttons = { total: 0, hiddenBehindBottomNav: [], belowViewport: 0 };
        if (result.bottomNav.found) {
          const navBottom = result.bottomNav.element.rect;
          for (const el of document.querySelectorAll('button, a[role="button"], a[href], input[type="submit"], input[type="button"]')) {
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) continue;
            result.buttons.total++;
            // Check if button is positioned behind the bottom nav (overlapping y-range and in viewport)
            if (rect.bottom > navBottom.y && rect.y < navBottom.bottom && rect.x < vw) {
              const cls = typeof el.className === 'string' ? el.className.slice(0, 60) : '';
              const text = (el.textContent || '').trim().slice(0, 40);
              result.buttons.hiddenBehindBottomNav.push({
                tag: el.tagName.toLowerCase(),
                text,
                cls,
                rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height, bottom: rect.bottom },
              });
            }
          }
        }

        // --- Main content padding-bottom (should account for bottom nav) ---
        result.contentPadding = null;
        const main = document.querySelector('main, [role="main"], #__next main, .main-content');
        if (main) {
          const cs = getComputedStyle(main);
          result.contentPadding = {
            paddingBottom: cs.paddingBottom,
            marginBottom: cs.marginBottom,
            rect: main.getBoundingClientRect(),
          };
        }

        // --- Horizontal overflow source detection ---
        result.overflowSources = [];
        if (result.doc.overflowX > 0) {
          for (const el of all) {
            const rect = el.getBoundingClientRect();
            if (rect.right > vw + 2) {
              const cs = getComputedStyle(el);
              const cls = typeof el.className === 'string' ? el.className.slice(0, 60) : '';
              const text = (el.textContent || '').trim().slice(0, 30);
              result.overflowSources.push({
                tag: el.tagName.toLowerCase(),
                cls,
                text,
                rect: { x: rect.x, w: rect.width, right: rect.right },
                position: cs.position,
                overflow: cs.overflow,
              });
              if (result.overflowSources.length >= 10) break;
            }
          }
        }

        // --- Text overflow detection (check for text wider than container) ---
        result.textOverflow = [];
        const textEls = document.querySelectorAll('h1, h2, h3, p, span, a, button, label');
        let checked = 0;
        for (const el of textEls) {
          if (checked > 200) break;
          checked++;
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;
          const parent = el.parentElement;
          if (!parent) continue;
          const parentRect = parent.getBoundingClientRect();
          // Check if text element overflows its parent
          if (rect.right > parentRect.right + 2 && rect.width > 50) {
            const cs = getComputedStyle(el);
            if (cs.whiteSpace === 'nowrap' || cs.whiteSpace === 'pre') {
              result.textOverflow.push({
                tag: el.tagName.toLowerCase(),
                text: (el.textContent || '').trim().slice(0, 50),
                rect: { w: rect.width, right: rect.right },
                parentRect: { right: parentRect.right, w: parentRect.width },
                whiteSpace: cs.whiteSpace,
                overflow: cs.overflow,
              });
              if (result.textOverflow.length >= 10) break;
            }
          }
        }

        return result;
      }, { width: vp.width, height: vp.height });

      // --- Report findings ---
      // 1. Horizontal scroll
      if (audit.doc.overflowX > 0) {
        log(vp.name, p.name, `HORIZONTAL SCROLL: overflowX=${audit.doc.overflowX}px (scrollWidth=${audit.doc.scrollWidth} > clientWidth=${audit.doc.clientWidth})`, 'CRITICAL');
        if (audit.overflowSources.length > 0) {
          for (const src of audit.overflowSources.slice(0, 5)) {
            log(vp.name, p.name, `  overflow source: <${src.tag}> .${src.cls} text="${src.text}" right=${src.rect.right} position=${src.position}`, 'WARN');
          }
        }
      } else {
        log(vp.name, p.name, `No horizontal scroll (scrollWidth=${audit.doc.scrollWidth} = clientWidth=${audit.doc.clientWidth})`, 'ok');
      }

      // 2. Sidebar
      if (audit.sidebar.found) {
        const visibleSidebars = audit.sidebar.elements.filter(s => !s.offscreen);
        if (visibleSidebars.length > 0) {
          log(vp.name, p.name, `SIDEBAR VISIBLE ON MOBILE: ${visibleSidebars.length} element(s) visible`, 'CRITICAL');
          for (const s of visibleSidebars) {
            log(vp.name, p.name, `  sidebar: <${s.tag}> .${s.cls} rect=${JSON.stringify(s.rect)} display=${s.display} position=${s.position}`, 'WARN');
          }
        } else {
          log(vp.name, p.name, `Sidebar present but hidden/offscreen (${audit.sidebar.elements.length} element(s))`, 'ok');
        }
      } else {
        log(vp.name, p.name, 'No sidebar element detected on page', 'info');
      }

      // 3. Bottom nav
      if (audit.bottomNav.found) {
        const bn = audit.bottomNav.element;
        if (bn.visible) {
          log(vp.name, p.name, `Bottom nav visible: rect=${JSON.stringify(bn.rect)} bottom=${bn.bottom}`, 'ok');
          // Check if bottom nav extends beyond viewport
          if (bn.rect.bottom > vp.height + 2) {
            log(vp.name, p.name, `Bottom nav extends beyond viewport bottom (bottom=${bn.rect.bottom} > viewport=${vp.height})`, 'CRITICAL');
          }
          if (bn.rect.x < 0 || bn.rect.right > vp.width + 2) {
            log(vp.name, p.name, `Bottom nav extends beyond viewport horizontally (x=${bn.rect.x}, right=${bn.rect.right}, vw=${vp.width})`, 'WARN');
          }
        } else {
          log(vp.name, p.name, `Bottom nav found but NOT VISIBLE`, 'CRITICAL');
        }
      } else {
        log(vp.name, p.name, `No bottom nav detected`, 'WARN');
      }

      // 4. Top bar
      if (audit.topBar.found) {
        const tb = audit.topBar.element;
        if (tb.visible) {
          log(vp.name, p.name, `Top bar visible: rect=${JSON.stringify(tb.rect)}`, 'ok');
        } else {
          log(vp.name, p.name, `Top bar found but NOT VISIBLE`, 'CRITICAL');
        }
      } else {
        log(vp.name, p.name, `No top bar detected`, 'info');
      }

      // 5. 3D canvas
      if (audit.canvas.found) {
        for (const c of audit.canvas.elements) {
          if (!c.visible) {
            log(vp.name, p.name, `Canvas not visible: rect=${JSON.stringify(c.rect)}`, 'WARN');
          } else {
            if (c.widerThanViewport) {
              log(vp.name, p.name, `CANVAS WIDER THAN VIEWPORT: w=${c.rect.w} > vw=${vp.width} right=${c.rect.right}`, 'CRITICAL');
            }
            if (c.clippedByParent) {
              log(vp.name, p.name, `Canvas clipped by parent: canvas right=${c.rect.right} > parent right=${c.parentRect.right}`, 'WARN');
            }
            log(vp.name, p.name, `Canvas OK: rect=${JSON.stringify(c.rect)} visible=${c.visible}`, 'ok');
          }
        }
      } else {
        log(vp.name, p.name, `No canvas/3D scene on this page`, 'info');
      }

      // 6. Buttons behind bottom nav
      if (audit.buttons.hiddenBehindBottomNav.length > 0) {
        log(vp.name, p.name, `BUTTONS HIDDEN BEHIND BOTTOM NAV: ${audit.buttons.hiddenBehindBottomNav.length} button(s)`, 'CRITICAL');
        for (const b of audit.buttons.hiddenBehindBottomNav.slice(0, 5)) {
          log(vp.name, p.name, `  hidden button: <${b.tag}> text="${b.text}" .${b.cls} rect=${JSON.stringify(b.rect)}`, 'WARN');
        }
      } else if (audit.bottomNav.found) {
        log(vp.name, p.name, `No buttons hidden behind bottom nav (${audit.buttons.total} buttons checked)`, 'ok');
      }

      // 7. Content padding
      if (audit.contentPadding) {
        log(vp.name, p.name, `Main content padding-bottom=${audit.contentPadding.paddingBottom} margin-bottom=${audit.contentPadding.marginBottom} rect=${JSON.stringify(audit.contentPadding.rect)}`, 'info');
      }

      // 8. Text overflow
      if (audit.textOverflow.length > 0) {
        log(vp.name, p.name, `TEXT OVERFLOW: ${audit.textOverflow.length} element(s) overflow their container`, 'WARN');
        for (const t of audit.textOverflow.slice(0, 5)) {
          log(vp.name, p.name, `  text overflow: <${t.tag}> "${t.text}" w=${t.rect.w} parentW=${t.parentRect.w} whiteSpace=${t.whiteSpace}`, 'WARN');
        }
      }

      // Console errors
      if (consoleErrors.length > 0) {
        log(vp.name, p.name, `Console errors: ${consoleErrors.length}`, 'WARN');
        for (const e of consoleErrors.slice(0, 3)) {
          log(vp.name, p.name, `  console error: ${e.slice(0, 120)}`, 'WARN');
        }
      }

      // Page height summary
      log(vp.name, p.name, `Page height=${audit.doc.scrollHeight}px (${Math.round(audit.doc.scrollHeight / vp.height)} viewport heights)`, 'info');

    } catch (err) {
      log(vp.name, p.name, `NAVIGATION ERROR: ${err.message}`, 'CRITICAL');
    }
  }

  await context.close();
}

await browser.close();

// Summary
console.log('\n\n========== SUMMARY ==========');
const criticals = findings.filter(f => f.severity === 'CRITICAL');
const warns = findings.filter(f => f.severity === 'WARN');
const oks = findings.filter(f => f.severity === 'ok');
console.log(`Total findings: ${findings.length}`);
console.log(`CRITICAL: ${criticals.length}, WARN: ${warns.length}, OK: ${oks.length}`);

if (criticals.length > 0) {
  console.log('\n--- CRITICAL ISSUES ---');
  for (const f of criticals) {
    console.log(`  [${f.vp}/${f.page}] ${f.msg}`);
  }
}
if (warns.length > 0) {
  console.log('\n--- WARNINGS ---');
  for (const f of warns) {
    console.log(`  [${f.vp}/${f.page}] ${f.msg}`);
  }
}
console.log('\nDone.');
