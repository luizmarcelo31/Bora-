// Admin: rola até a primeira linha de cada lista mobile e mede se algum dado some.
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
const OUT = path.join(__dirname, '..', 'docs', 'mobile', 'screens', 'admin');

const ROTAS = [
  { url: '/admin/empresas', nome: '01-empresas' },
  { url: '/admin/usuarios', nome: '03-usuarios' },
  { url: '/admin/assinaturas', nome: '05-assinaturas' },
  { url: '/admin/suporte', nome: '06-suporte' },
  { url: '/admin/auditoria', nome: '09-auditoria' },
  { url: '/admin/saude', nome: '10-saude' },
  { url: '/admin/permissoes', nome: '08-permissoes' },
  { url: '/admin/notificacoes', nome: '07-notificacoes' },
  { url: '/admin/planos', nome: '04-planos' },
  { url: '/admin/empresas/1', nome: '02-empresa-360' },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 45000 });
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', SENHA);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 30000 });
  if (await page.evaluate(() => document.body.innerText.includes('Sem acesso'))) {
    console.error('403 — login não entrou');
    process.exit(1);
  }

  for (const r of ROTAS) {
    await page.goto(BASE + r.url, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
    await page.waitForSelector('main', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(1200);

    const info = await page.evaluate(() => {
      // A variante mobile existe se houver um `<ul>` marcado `md:hidden` —
      // com ou sem `li`. Procurar só por `li` confunde "lista vazia" com
      // "falta a variante", que é o erro que este script acabou de dar.
      const lista = [...document.querySelectorAll('ul')].find((u) =>
        u.className.includes('md:hidden')
      );
      const linha = lista?.querySelector('li');
      if (!lista) return { achou: false };
      if (!linha) return { achou: true, vazia: true, linhas: 0 };
      linha.scrollIntoView({ block: 'center' });
      const lr = linha.getBoundingClientRect();
      const pai = lista.getBoundingClientRect();
      return {
        achou: true,
        vazia: false,
        linhas: lista.querySelectorAll('li').length,
        alturaLinha: Math.round(lr.height),
        estoura: lr.right > pai.right + 1,
      };
    });
    await page.waitForTimeout(400);
    if (info.vazia) {
      console.log(`${r.nome}: variante presente, lista vazia (0 itens no banco)`);
      await page.screenshot({ path: path.join(OUT, '390-lista', `${r.nome}.png`) });
      continue;
    }
    if (!info.achou) {
      // Sem `<ul md:hidden>` no DOM: ou a rota não tem lista mobile, ou a
      // lista está vazia e o bloco nem renderiza (mostra EmptyState). O DOM
      // não distingue os dois casos — quem distingue é o grep no fonte.
      const temTabela = await page.evaluate(() => {
        const t = document.querySelector('table');
        return t ? t.getBoundingClientRect().width > 0 : false;
      });
      console.log(
        `${r.nome}: 0 itens no banco (${temTabela ? 'tabela desktop visível' : 'empty state'})`
      );
      await page.screenshot({ path: path.join(OUT, '390-lista', `${r.nome}.png`) });
      continue;
    }
    await page.screenshot({ path: path.join(OUT, '390-lista', `${r.nome}.png`) });
    console.log(
      `${r.nome}: ${info.linhas} linhas · ${info.alturaLinha}px/linha · estoura=${info.estoura}`
    );
  }

  await browser.close();
})();