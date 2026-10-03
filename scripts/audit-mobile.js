// Script de auditoria mobile - Playwright
// Tira screenshots de todas as telas em 390x844, 360x844 e 430x844

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Lê .env via dotenv
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const env = process.env;

const EMAIL = env.E2E_BYPASS_EMAIL || 'luizmarcelo31@gmail.com';
const PASSWORD = env.E2E_BYPASS_PASSWORD;

if (!PASSWORD) {
  console.error('E2E_BYPASS_PASSWORD não encontrado no .env');
  process.exit(1);
}

const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'docs', 'mobile', 'screens', 'before');

// Telas para auditar
const SCREENS = [
  { name: '01-login', url: '/login', skipIfLoggedIn: true },
  { name: '02-dashboard', url: '/dashboard' },
  { name: '03-produtos', url: '/dashboard/produtos' },
  { name: '04-categorias', url: '/dashboard/categorias' },
  { name: '05-estoque', url: '/dashboard/estoque' },
  { name: '06-inventario', url: '/dashboard/inventario' },
  { name: '07-pdv', url: '/dashboard/pdv' },
  { name: '08-pdv-express', url: '/dashboard/pdv/express' },
  { name: '09-pdv-offline', url: '/dashboard/pdv/offline' },
  { name: '10-caixa', url: '/dashboard/caixa' },
  { name: '11-financeiro', url: '/dashboard/financeiro' },
  { name: '12-compras', url: '/dashboard/compras' },
  { name: '13-promocoes', url: '/dashboard/promocoes' },
  { name: '14-relatorios', url: '/dashboard/relatorios' },
  { name: '15-configuracoes', url: '/dashboard/configuracoes' },
  { name: '16-auditoria', url: '/dashboard/auditoria' },
  { name: '17-divergencias', url: '/dashboard/divergencias' },
  { name: '18-novidades', url: '/dashboard/novidades' },
];

const VIEWPORTS = [
  { name: '390', width: 390, height: 844 },
  { name: '360', width: 360, height: 844 },
  { name: '430', width: 430, height: 844 },
];

(async () => {
  // Cria diretórios
  for (const vp of VIEWPORTS) {
    fs.mkdirSync(path.join(SCREENSHOTS_DIR, vp.name), { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  // Login
  console.log('Fazendo login...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 60000 });
  
  // Preenche formulário
  await page.fill('input[type="email"], input[name="email"]', EMAIL);
  await page.fill('input[type="password"], input[name="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  
  // Espera redirecionamento
  await page.waitForURL('**/dashboard', { timeout: 30000 }).catch(() => {
    console.log('Timeout esperando dashboard, tentando continuar...');
  });
  
  await page.waitForTimeout(2000);
  console.log('Login concluído:', page.url());

  // Audita cada tela
  for (const screen of SCREENS) {
    console.log(`\nAuditing: ${screen.name} (${screen.url})`);
    
    // Pula login se já está logado
    if (screen.skipIfLoggedIn && page.url().includes('/dashboard')) {
      console.log('  -> Pulando (já logado)');
      continue;
    }

    try {
      await page.goto(`${BASE_URL}${screen.url}`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1500);

      // Mede scroll
      const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
      const viewportHeight = await page.evaluate(() => window.innerHeight);
      const scrollRatio = (scrollHeight / viewportHeight).toFixed(2);
      console.log(`  Scroll: ${scrollHeight}px / ${viewportHeight}px = ${scrollRatio} telas`);

      // Screenshots em cada viewport
      for (const vp of VIEWPORTS) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.waitForTimeout(500);
        
        const screenshotPath = path.join(SCREENSHOTS_DIR, vp.name, `${screen.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        console.log(`  -> Screenshot: ${vp.name}/${screen.name}.png`);
      }

      // Volta para 390
      await page.setViewportSize({ width: 390, height: 844 });

    } catch (err) {
      console.error(`  -> Erro: ${err.message}`);
    }
  }

  await browser.close();
  console.log('\nAuditoria concluída!');
  console.log(`Screenshots salvos em: ${SCREENSHOTS_DIR}`);
})();
