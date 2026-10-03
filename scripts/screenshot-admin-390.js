// Admin em 390px — estado atual, para medir antes de mudar.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { chromium } = require('playwright');
const path = require('path');

const BASE = 'http://localhost:3000';
const OUT = path.join(__dirname, '..', 'docs', 'mobile', 'screens', 'admin');

const ROTAS = [
  { url: '/admin', nome: '00-visao-geral' },
  { url: '/admin/empresas', nome: '01-empresas' },
  { url: '/admin/empresas/1', nome: '02-empresa-360' },
  { url: '/admin/usuarios', nome: '03-usuarios' },
  { url: '/admin/planos', nome: '04-planos' },
  { url: '/admin/assinaturas', nome: '05-assinaturas' },
  { url: '/admin/suporte', nome: '06-suporte' },
  { url: '/admin/notificacoes', nome: '07-notificacoes' },
  { url: '/admin/permissoes', nome: '08-permissoes' },
  { url: '/admin/auditoria', nome: '09-auditoria' },
  { url: '/admin/saude', nome: '10-saude' },
  { url: '/admin/configuracoes', nome: '11-configuracoes' },
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
  await page.waitForURL('**/**', { timeout: 30000 });

  for (const r of ROTAS) {
    await page.goto(BASE + r.url, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
    await page.waitForTimeout(900);
    const m = await page.evaluate(() => {
      const d = document.documentElement;
      // overflow horizontal = quebrar em 390px
      const over = Math.max(0, d.scrollWidth - d.clientWidth);
      // altura em telas
      const telas = d.scrollHeight / window.innerHeight;
      const temListaMobile = [...document.querySelectorAll('ul')].some(
        (u) => u.className.includes('md:hidden')
      );
      const temTabela = !!document.querySelector('table');
      const tabelaVisivel = (() => {
        const t = document.querySelector('table');
        if (!t) return false;
        return t.getBoundingClientRect().width > 0;
      })();
      return {
        overflowX: over,
        telas: Number(telas.toFixed(2)),
        temListaMobile,
        tabelaVisivel,
        alturaTabela: (() => {
          const t = document.querySelector('table');
          return t ? Math.round(t.getBoundingClientRect().width) : 0;
        })(),
      };
    });
    await page.screenshot({ path: path.join(OUT, '390', `${r.nome}.png`) });
    console.log(
      `${r.nome}: overflowX=${m.overflowX}px · ${m.telas} telas · ` +
        `listaMobile=${m.temListaMobile} · tabelaVisivel=${m.tabelaVisivel}` +
        (m.tabelaVisivel ? ` (${m.alturaTabela}px)` : '')
    );
  }

  await browser.close();
})();