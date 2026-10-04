// Admin em 390px — estado atual, para medir antes de mudar.
//
// Credenciais do Super Admin vêm de E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD.
// O .env do repo tem só a do proprietário do tenant (E2E_BYPASS_*), que toma
// 403 em /admin — por isso o script não pode cair no fallback.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { chromium } = require('playwright');
const path = require('path');

const EMAIL = process.env.E2E_ADMIN_EMAIL;
const SENHA = process.env.E2E_ADMIN_PASSWORD;
if (!EMAIL || !SENHA) {
  console.error('Faltam E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD no .env do projeto.');
  process.exit(1);
}

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

  // `networkidle` é obrigatório aqui, não por performance mas pela hidratação: o
  // login é uma Server Action, e clicar antes do React hidratar faz o browser
  // submeter o formulário nativamente — como GET, com a senha na URL.
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 45000 });
  await page.fill('input[type="email"], input[name="email"]', EMAIL);
  await page.fill('input[type="password"], input[name="password"]', SENHA);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 30000 });
  // Guarda: sem esta checagem, uma sessão falha silenciosamente e o script
  // fotografa 12 telas de "Sem acesso" e chama isso de verificação.
  const entrou = await page.evaluate(() => !document.body.innerText.includes('Sem acesso'));
  if (!entrou) {
    console.error('Login não entrou em /admin — verifique E2E_ADMIN_EMAIL/PASSWORD.');
    process.exit(1);
  }
  console.log('login ok →', page.url());

  for (const r of ROTAS) {
    await page.goto(BASE + r.url, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
    await page.waitForSelector("main", { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(1500);
    const m = await page.evaluate(() => {
      // 403 é o resultado que hace o script não servir para nada.
      if (document.body.innerText.includes('Sem acesso')) {
        return { semAcesso: true };
      }
      const d = document.documentElement;
      // overflow horizontal = quebrar em 390px
      const over = Math.max(0, d.scrollWidth - d.clientWidth);
      // altura em telas
      const telas = d.scrollHeight / window.innerHeight;
      const temListaMobile = [...document.querySelectorAll('ul')].some(
        (u) => u.className.includes('md:hidden')
      );
      const tabelaVisivel = (() => {
        const t = document.querySelector('table');
        if (!t) return false;
        return t.getBoundingClientRect().width > 0;
      })();
      return {
        semAcesso: false,
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
    if (m.semAcesso) {
      console.log(`${r.nome}: SEM ACESSO (403)`);
      continue;
    }
    await page.screenshot({ path: path.join(OUT, '390', `${r.nome}.png`) });
    console.log(
      `${r.nome}: overflowX=${m.overflowX}px · ${m.telas} telas · ` +
        `listaMobile=${m.temListaMobile} · tabelaVisivel=${m.tabelaVisivel}` +
        (m.tabelaVisivel ? ` (${m.alturaTabela}px)` : '')
    );
  }

  await browser.close();
})();