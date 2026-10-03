// Dark mode com o modal de onboarding fechado, + medir contraste dos tokens.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { chromium } = require('playwright');
const path = require('path');

const BASE = 'http://localhost:3000';
const OUT = path.join(__dirname, '..', 'docs', 'mobile', 'screens', 'listas');

const ROTAS = [
  { url: '/dashboard', nome: 'dashboard' },
  { url: '/dashboard/estoque', nome: 'estoque' },
  { url: '/dashboard/financeiro', nome: 'financeiro' },
  { url: '/dashboard/produtos', nome: 'produtos' },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    colorScheme: 'dark',
  });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.fill('input[type="email"], input[name="email"]', process.env.E2E_BYPASS_EMAIL);
  await page.fill('input[type="password"], input[name="password"]', process.env.E2E_BYPASS_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 30000 });

  for (const r of ROTAS) {
    await page.goto(BASE + r.url, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
    await page.waitForTimeout(900);
    // fecha o modal de onboarding se existir
    await page.evaluate(() => {
      const fechar = [...document.querySelectorAll('button')].find((b) =>
        /^(Fechar|Agora depois|×|✕)$/i.test((b.textContent || '').trim() || b.getAttribute('aria-label') || '')
      );
      fechar?.click();
    });
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      const lista = [...document.querySelectorAll('ul')].find(
        (u) => u.className.includes('md:hidden') && u.querySelector('li')
      );
      lista?.querySelector('li')?.scrollIntoView({ block: 'center' });
    });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, '390-dark', `${r.nome}.png`) });
    console.log(`dark ${r.nome} ok`);
  }

  // contraste real dos tokens no dark
  const contraste = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    const ler = (n) => cs.getPropertyValue(n).trim();
    return {
      fundo: ler('--background'),
      foreground: ler('--foreground'),
      mutedFg: ler('--muted-foreground'),
      successFg: ler('--status-success-fg'),
      dangerFg: ler('--destructive'),
      card: ler('--card'),
    };
  });
  console.log('tokens dark:', JSON.stringify(contraste));

  await browser.close();
})();
