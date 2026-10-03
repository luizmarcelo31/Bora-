// Screenshot do mobile kit
const { chromium } = require('playwright');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const EMAIL = process.env.E2E_BYPASS_EMAIL || 'luizmarcelo31@gmail.com';
const PASSWORD = process.env.E2E_BYPASS_PASSWORD;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  // Login
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 60000 });
  await page.fill('input[type="email"], input[name="email"]', EMAIL);
  await page.fill('input[type="password"], input[name="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);

  // Mobile kit
  await page.goto('http://localhost:3000/dev/mobile-kit', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Screenshot
  await page.screenshot({ path: path.join(__dirname, '..', 'docs', 'mobile', 'mobile-kit.png'), fullPage: true });
  console.log('Screenshot salvo em docs/mobile/mobile-kit.png');

  // Dark mode
  await page.click('button[aria-label="Alternar tema"]');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(__dirname, '..', 'docs', 'mobile', 'mobile-kit-dark.png'), fullPage: true });
  console.log('Screenshot dark salvo em docs/mobile/mobile-kit-dark.png');

  await browser.close();
})();
