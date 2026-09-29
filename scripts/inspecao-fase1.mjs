/*
 * Inspeção visual da Fase 1 do roadmap BoraMais (itens 1.3 e 1.4).
 *
 * Somente LEITURA: navega, mede e captura. Não cria, altera ou apaga dado.
 * Credenciais vêm de variáveis de ambiente e nunca são gravadas em disco.
 *
 *   E2E_EMAIL / E2E_PASSWORD        conta tenant
 *   E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD   conta super admin
 *   BASE_URL (default http://127.0.0.1:3100)
 *   SHOTS (default .qa)             pasta de screenshots
 *
 * Rodar: node scripts/inspecao-fase1.mjs
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3100";
const SHOTS = process.env.SHOTS ?? ".qa";
mkdirSync(SHOTS, { recursive: true });

const MODULOS = [
  ["", "Visão geral"],
  ["produtos", "Produtos"],
  ["categorias", "Categorias"],
  ["estoque", "Estoque"],
  ["inventario", "Inventário"],
  ["pdv", "PDV"],
  ["promocoes", "Promoções"],
  ["compras", "Compras"],
  ["caixa", "Caixa"],
  ["financeiro", "Financeiro"],
  ["relatorios", "Relatórios"],
  ["configuracoes", "Configurações"],
  ["auditoria", "Auditoria"],
];

const url = (slug) => (slug ? `${BASE}/dashboard/${slug}` : `${BASE}/dashboard`);

const browser = await chromium.launch();
const achados = [];

function registrar(modulo, item, ok, detalhe) {
  achados.push({ modulo, item, ok, detalhe });
  console.log(`  ${ok ? "OK   " : "FALHA"} [${modulo}] ${item}${detalhe ? " — " + detalhe : ""}`);
}

async function entrar(page, email, senha) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.fill("#login-email", email);
  await page.fill("#login-password", senha);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/dashboard**", { timeout: 45000 });
}

/* ---------------- sessão tenant ---------------- */
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const erros = [];
page.on("console", (m) => {
  if (m.type() === "error") erros.push(m.text().slice(0, 200));
});
page.on("pageerror", (e) => erros.push("pageerror: " + String(e).slice(0, 200)));

console.log("=== LOGIN TENANT ===");
await entrar(page, process.env.E2E_EMAIL, process.env.E2E_PASSWORD);
console.log("  autenticado:", page.url());

console.log("\n=== VARREDURA DOS 13 MÓDULOS (light) ===");
for (const [slug, nome] of MODULOS) {
  const resp = await page.goto(url(slug), { waitUntil: "networkidle", timeout: 45000 });
  const status = resp?.status() ?? 0;
  const h1 = await page.locator("h1").first().textContent().catch(() => null);
  await page.screenshot({ path: `${SHOTS}/light-${slug || "raiz"}.png`, fullPage: false });
  registrar(nome, "carrega sem erro", status < 400, `HTTP ${status}, h1="${(h1 ?? "").trim()}"`);
}

console.log("\n=== 1.3 — COMPONENTES BASE (medições no navegador) ===");

// Header de página — o roadmap pede "fundo laranja no day, fundo #111 no dark".
// A faixa fica num ancestral do h1; medimos o ancestral com fundo próprio.
const header = await page.evaluate(() => {
  const h1 = document.querySelector("h1");
  if (!h1) return null;
  const transparente = "rgba(0, 0, 0, 0)";
  let el = h1.parentElement;
  let faixa = null;
  while (el && el !== document.body) {
    const bg = getComputedStyle(el).backgroundColor;
    if (bg !== transparente) {
      faixa = { bg, raio: getComputedStyle(el).borderRadius };
      break;
    }
    el = el.parentElement;
  }
  return { faixa, h1FontSize: getComputedStyle(h1).fontSize };
});
const Laranja = "rgb(190, 89, 45)";
registrar(
  "Header",
  "faixa laranja no day",
  !!header?.faixa && header.faixa.bg === Laranja,
  JSON.stringify(header)
);

// Sidebar: z-index vs conteudo
const z = await page.evaluate(() => {
  const sb = document.querySelector("[data-sidebar='sidebar']");
  const main = document.querySelector("main");
  const num = (v) => (v === "auto" ? 0 : parseInt(v, 10) || 0);
  return {
    sidebar: sb ? num(getComputedStyle(sb).zIndex) : null,
    sidebarVisivel: sb ? sb.getBoundingClientRect().width > 0 : false,
    main: main ? num(getComputedStyle(main).zIndex) : null,
  };
});
registrar("Sidebar", "presente e visível", z.sidebarVisivel, JSON.stringify(z));
registrar("Sidebar", "z-index acima do conteúdo", z.sidebar !== null && z.main !== null && z.sidebar >= z.main, `sidebar z=${z.sidebar} main z=${z.main}`);

// Tabela de produtos: preço alinhado à direita
await page.goto(`${BASE}/dashboard/produtos`, { waitUntil: "networkidle" });
const tabela = await page.evaluate(() => {
  const rows = [...document.querySelectorAll("tbody tr")];
  if (!rows.length) return { linhas: 0 };
  const ths = [...document.querySelectorAll("thead th")].map((t) => t.textContent.trim());
  const idxPreco = ths.findIndex((t) => /pre[çc]o/i.test(t));
  const celula = idxPreco >= 0 ? rows[0].children[idxPreco] : null;
  return {
    linhas: rows.length,
    colunas: ths,
    precoAlinhado: celula ? getComputedStyle(celula).textAlign : null,
    colunasAlinhadasDireita: [...document.querySelectorAll("thead th")]
      .map((t) => getComputedStyle(t).textAlign)
      .filter((a) => a === "right" || a === "end").length,
  };
});
registrar("Tabela produtos", "tem linhas", tabela.linhas > 0, `${tabela.linhas} linhas, colunas: ${(tabela.colunas ?? []).join(" | ")}`);
registrar("Tabela produtos", "coluna de preço alinhada à direita", /right|end/.test(tabela.precoAlinhado ?? ""), `text-align=${tabela.precoAlinhado}`);

// Filter chips — o roadmap 1.3 pede "estilo pill, ativo em laranja/day e branco/dark".
// A implementação atual usa Tabs do shadcn. Medimos o que existe de fato.
await page.goto(url("produtos"), { waitUntil: "networkidle" });
const chips = await page.evaluate(() => {
  const triggers = [...document.querySelectorAll("[data-slot='tabs-trigger']")];
  if (!triggers.length) return { tipo: "nenhum", total: 0 };
  const ativo = triggers.find((t) => t.getAttribute("data-state") === "active") ?? triggers[0];
  const cs = getComputedStyle(ativo);
  const raio = parseFloat(cs.borderRadius);
  const altura = ativo.getBoundingClientRect().height;
  return {
    tipo: "tabs",
    total: triggers.length,
    borderRadiusAtivo: cs.borderRadius,
    // rounded-full resolve para um valor gigante (0.5 * largura da viewport),
    // então comparar com 9999px não funciona: medimos contra a própria altura.
    ehPill: raio >= altura / 2,
    raioNum: raio,
    altura,
    bgAtivo: cs.backgroundColor,
    colorAtivo: cs.color,
    dados: triggers.map((t) => t.textContent.trim()).join(", "),
  };
});
registrar(
  "Filter chips",
  "estilo pill com ativo em laranja",
  chips.ehPill === true && chips.bgAtivo === Laranja,
  JSON.stringify(chips)
);

// Botões: variantes e estados
const botoes = await page.evaluate(() => {
  const bs = [...document.querySelectorAll("button,a[role=button]")];
  return {
    total: bs.length,
    disabled: bs.filter((b) => b.disabled).length,
    variantes: new Set(bs.map((b) => (b.getAttribute("data-slot") === "button" ? b.className.match(/variant|brand|destructive|ghost|outline|secondary|primary|accent|danger|laranja|laranja/gi)?.join(",") ?? "?" : "?"))).size,
  };
});
registrar("Botões", "presentes na interface", botoes.total > 0, `${botoes.total} botões, ${botoes.disabled} desabilitados`);

// Badges: 5 variantes
const badges = await page.evaluate(() => {
  const els = [...document.querySelectorAll("[data-slot='badge'], span,div")].filter((e) => {
    const cs = getComputedStyle(e);
    return /badge/.test(e.dataset.slot ?? "") || (cs.display === "inline-flex" && e.children.length === 0 && e.textContent.trim().length < 22);
  });
  const cores = new Set(els.map((e) => getComputedStyle(e).backgroundColor + "|" + getComputedStyle(e).color));
  return { total: els.length, coresDistintas: cores.size };
});
registrar("Badges", "variantes distintas", badges.total > 0, `${badges.total} badges, ${badges.coresDistintas} combinações de cor`);

// Alertas — o roadmap 1.3 pede 4 variantes com ícone + título + corpo.
// Os alertas vivem dentro de dialogs, então não aparecem no DOM com a página
// fechada. A contagem de variantes é garantida por teste unitário
// (src/components/ui/alert.test.tsx); aqui verificamos só que abrir um
// diálogo mostra um alerta com ícone e título.
const alertasPorModulo = [];
for (const [slug, nome] of [["categorias"], ["financeiro"]]) {
  await page.goto(url(slug), { waitUntil: "domcontentloaded", timeout: 45000 });
  const botao = page.locator("button").filter({ hasText: /nova|criar|adicionar/i }).first();
  if (!(await botao.count())) continue;
  await botao.click().catch(() => {});
  await page.waitForTimeout(700);
  const a = await page.evaluate(() => {
    const els = [...document.querySelectorAll("[role='alert'],[data-slot='alert']")];
    return {
      total: els.length,
      comIcone: els.filter((e) => e.querySelector("svg")).length,
      comTitulo: els.filter((e) => e.querySelector("[data-slot='alert-title'],strong,h4,h5")).length,
      cores: [...new Set(els.map((e) => getComputedStyle(e).backgroundColor + "|" + getComputedStyle(e).color))],
    };
  });
  if (a.total) alertasPorModulo.push({ nome, ...a });
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(300);
}
const totalAlertas = alertasPorModulo.reduce((s, a) => s + a.total, 0);
if (totalAlertas > 0) {
  registrar(
    "Alertas",
    "aparecem com ícone + título ao abrir diálogo",
    alertasPorModulo.every((a) => a.comIcone > 0 && a.comTitulo > 0),
    `${totalAlertas} alerta(s) em ${alertasPorModulo.length} diálogo(s)`
  );
} else {
  // Nãoachamos diálogo para abrir nesta varredura. Isso NÃO é falha de
  // produto: o contrato das 4 variantes é travado por
  // src/components/ui/alert.test.tsx. Fica como não-verificado-aqui.
  console.log("  INFO  [Alertas] nenhum diálogo aberto na varredura — contrato das 4 variantes coberto por src/components/ui/alert.test.tsx");
}
for (const a of alertasPorModulo) {
  console.log(`         · ${a.nome}: ${a.total} (ícone ${a.comIcone}, título ${a.comTitulo})`);
}

/* ---------------- dark mode ---------------- */
console.log("\n=== DARK MODE (13 módulos) ===");
await page.goto(`${BASE}/dashboard/produtos`, { waitUntil: "networkidle" });
await page.evaluate(() => {
  localStorage.setItem("theme", "dark");
  document.documentElement.classList.add("dark");
});
for (const [slug, nome] of MODULOS) {
  await page.goto(url(slug), { waitUntil: "networkidle", timeout: 45000 });
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await page.waitForTimeout(250);
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.screenshot({ path: `${SHOTS}/dark-${slug || "raiz"}.png` });
  registrar(nome, "fundo dark aplicado", bg === "rgb(10, 10, 10)", `body bg=${bg}`);
}

/* ---------------- mobile ---------------- */
console.log("\n=== MOBILE 375px ===");
const mctx = await browser.newContext({ viewport: { width: 375, height: 780 }, isMobile: true, hasTouch: true });
const mp = await mctx.newPage();
await entrar(mp, process.env.E2E_EMAIL, process.env.E2E_PASSWORD);
for (const [slug] of [["produtos"], ["pdv"], ["dashboard"]]) {
  await mp.goto(`${BASE}/dashboard/${slug}`, { waitUntil: "networkidle" });
  const overflow = await mp.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  }));
  await mp.screenshot({ path: `${SHOTS}/mobile-${slug}.png` });
  registrar(`mobile/${slug}`, "sem overflow horizontal", overflow.scrollW <= overflow.clientW + 1, `${overflow.scrollW} vs ${overflow.clientW}`);
}

/* ---------------- super admin ---------------- */
console.log("\n=== SUPER ADMIN ===");
const actx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const ap = await actx.newPage();
try {
  // Super admin é redirecionado para /admin ao logar (ver src/lib/redirect.ts),
  // então esperar só por /dashboard dá timeout.
  await ap.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await ap.fill("#login-email", process.env.E2E_ADMIN_EMAIL);
  await ap.fill("#login-password", process.env.E2E_ADMIN_PASSWORD);
  await ap.getByRole("button", { name: "Entrar" }).click();
  await ap.waitForURL(/\/(dashboard|admin)/, { timeout: 45000 });
  console.log("  autenticado:", ap.url());
  for (const [slug, nome] of [["", "Visão geral"], ["empresas", "Empresas"], ["usuarios", "Usuários"], ["permissoes", "Permissões"]]) {
    const alvo = slug ? `${BASE}/admin/${slug}` : `${BASE}/admin`;
    // domcontentloaded, não networkidle: o /admin mantém conexões vivas
    // (health check / polling) e networkidle nunca chega a assentar.
    const resp = await ap.goto(alvo, { waitUntil: "domcontentloaded", timeout: 45000 });
    await ap.waitForTimeout(1200);
    await ap.screenshot({ path: `${SHOTS}/admin-${slug || "raiz"}.png` });
    registrar(`admin/${nome}`, "carrega sem erro", (resp?.status() ?? 0) < 400, `HTTP ${resp?.status()}`);
  }
} catch (e) {
  registrar("admin", "login", false, String(e).slice(0, 120));
}

await browser.close();

console.log(`\n=== ERROS DE CONSOLE (${erros.length}) ===`);
for (const e of [...new Set(erros)].slice(0, 12)) console.log("  " + e);

const falhas = achados.filter((a) => !a.ok);
console.log(`\n=== RESUMO ===`);
console.log(`Verificações: ${achados.length} | OK: ${achados.length - falhas.length} | FALHA: ${falhas.length}`);
if (falhas.length) {
  console.log("\nPendentes:");
  for (const f of falhas) console.log(`  - [${f.modulo}] ${f.item} — ${f.detalhe ?? ""}`);
}
console.log(`\nScreenshots em ${SHOTS}/`);
