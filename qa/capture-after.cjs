const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const base = process.env.BASE_URL || 'http://127.0.0.1:3000';
  for (const [name, width, height] of [['home-1440x900',1440,900],['home-390x844',390,844]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors=[];
    page.on('console', msg => { if (msg.type()==='error') errors.push(msg.text()); });
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${base}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1800);
    const dir = process.env.OUTPUT_DIR || 'qa/screenshots/after';
    require('fs').mkdirSync(dir, { recursive: true });
    await page.screenshot({ path:`${dir}/${name}.png`, fullPage:false });
    console.log(name, JSON.stringify(errors));
    await page.close();
  }
  await browser.close();
})();
