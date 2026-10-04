// Captura e mede o painel de criação de empresa, em 390px e 1440px.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { chromium } = require('playwright');
const path = require('path');

const EMAIL = process.env.E2E_ADMIN_EMAIL;
const SENHA = process.env.E2E_ADMIN_PASSWORD;
if (!EMAIL || !SENHA) {
  console.error('Faltam E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD no .env.');
  process.exit(1);
}

const BASE = 'http://localhost:3000';
const OUT = path.join(__dirname, '..', 'docs', 'mobile', 'screens', 'nova-empresa');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();

  // networkidle: o login é Server Action, e clicar antes da hidratação faz o
  // browser submeter nativamente (GET, senha na URL).
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 45000 });
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', SENHA);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 30000 });
  if (await page.evaluate(() => document.body.innerText.includes('Sem acesso'))) {
    console.error('403 — login não entrou');
    process.exit(1);
  }

  for (const vp of [390, 1440]) {
    await page.goto(`${BASE}/admin/empresas/nova`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });
    await page.waitForSelector('main', { timeout: 20000 });
    await page.setViewportSize({ width: vp, height: vp === 390 ? 844 : 900 });
    await page.waitForTimeout(1500);

    const m = await page.evaluate(() => {
      const d = document.documentElement;
      const selects = [...document.querySelectorAll('select')].map((s) => ({
        nome: s.name,
        opcoes: s.options.length,
        primeira: s.options[0]?.text?.slice(0, 60),
      }));
      const rotulosLongos = [...document.querySelectorAll('select option')].map(
        (o) => o.textContent.length
      );
      return {
        overflowX: Math.max(0, d.scrollWidth - d.clientWidth),
        telas: Number((d.scrollHeight / window.innerHeight).toFixed(2)),
        selects,
        rotuloMaisLongo: Math.max(0, ...rotulosLongos),
      };
    });
    await page.screenshot({ path: path.join(OUT, `${vp}.png`), fullPage: true });
    console.log(`\n=== ${vp}px ===`);
    console.log(`overflowX=${m.overflowX}px · ${m.telas} telas`);
    console.log(`selects: ${JSON.stringify(m.selects, null, 1)}`);
    console.log(`rótulo mais longo do seletor: ${m.rotuloMaisLongo} chars`);
  }

  await browser.close();
})();