// Screenshot das LISTAS (rolando até elas) em 390px, dia e escuro.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { chromium } = require('playwright');
const path = require('path');

const BASE = 'http://localhost:3000';
const OUT = path.join(__dirname, '..', 'docs', 'mobile', 'screens', 'listas');

const ROTAS = [
  { url: '/dashboard/estoque', nome: 'estoque' },
  { url: '/dashboard/financeiro', nome: 'financeiro' },
  { url: '/dashboard/produtos', nome: 'produtos' },
  { url: '/dashboard/caixa', nome: 'caixa' },
  { url: '/dashboard/categorias', nome: 'categorias' },
  { url: '/dashboard/inventario', nome: 'inventario' },
  { url: '/dashboard/compras', nome: 'compras' },
  { url: '/dashboard/promocoes', nome: 'promocoes' },
  { url: '/dashboard/relatorios', nome: 'relatorios' },
  { url: '/dashboard/auditoria', nome: 'auditoria' },
  { url: '/dashboard/divergencias', nome: 'divergencias' },
  { url: '/dashboard', nome: 'dashboard' },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
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
    const info = await page.evaluate(() => {
      const lista = [...document.querySelectorAll('ul')].find(
        (u) => u.className.includes('md:hidden') && u.querySelector('li')
      );
      const linha = lista?.querySelector('li');
      if (linha) linha.scrollIntoView({ block: 'center' });
      return { achou: !!linha, linhas: lista ? lista.querySelectorAll('li').length : 0 };
    });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, '390-lista', `${r.nome}.png`) });
    console.log(`${r.nome}: ${info.achou ? 'rolou' : 'sem lista'} · ${info.linhas} linhas`);
  }

  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(OUT, '390-lista', 'dashboard-dark.png') });
  console.log('dashboard-dark ok');

  await browser.close();
})();
