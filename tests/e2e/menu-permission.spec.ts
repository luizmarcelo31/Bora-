import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/login-page";

/**
 * Regressão: o menu oferecia item que a página rejeitava.
 *
 * A sidebar (desktop) e a BottomNav (mobile) listavam destinos fixos, enquanto
 * cada página chamava `requirePermission` e respondia `/unauthorized`. No
 * celular, onde a BottomNav é a única navegação e o FAB (PDV) é o item mais
 * destacado da tela, 3 de 5 destinos morriam no toque.
 *
 * O teste clica em TODO item das DUAS listas e falha se algum cair em
 * /unauthorized. Cobre também o FAB: ele é marcado por flag, não por índice,
 * então a lista poder ser filtrada não pode deslocar a logo de lugar.
 *
 * Credenciais por env: E2E_FUNC_EMAIL / E2E_FUNC_PASSWORD (conta tenant).
 * Sem elas o teste faz skip.
 */

const EMAIL = process.env.E2E_FUNC_EMAIL;
const PASS = process.env.E2E_FUNC_PASSWORD;

/** Sessão limpa: este spec controla o próprio login via POM. */
test.use({ storageState: { cookies: [], origins: [] } });

/**
 * Fecha o que estiver em cima da página.
 *
 * O dashboard abre o diálogo de boas-vindas na primeira visita e a sidebar
 * mobile é um Sheet (Radix Dialog). Os dois montam um `dialog-overlay` que
 * intercepta o clique no item do menu.
 */
async function fecharDialogos(page: import("@playwright/test").Page) {
  for (let i = 0; i < 4; i++) {
    const aberto = page.locator('[data-slot="dialog-overlay"][data-state="open"]');
    if ((await aberto.count()) === 0) return;

    await page.keyboard.press("Escape");
    await page
      .waitForFunction(
        () => document.querySelectorAll('[data-slot="dialog-overlay"][data-state="open"]').length === 0,
        null,
        { timeout: 3000 }
      )
      .catch(async () => {
        await page.locator('[data-slot="dialog-close"]').first().click({ timeout: 2000 }).catch(() => {});
      });
  }
}

async function clicarCadaItem(page: import("@playwright/test").Page, seletor: string) {
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  await page.locator(seletor).first().waitFor({ state: "visible", timeout: 30000 });
  await fecharDialogos(page);

  const itens = await page.$$eval(seletor, (els) =>
    els
      .map((e) => ({
        text: (e.textContent || "").trim(),
        href: e.getAttribute("href"),
        disabled: e.getAttribute("aria-disabled") === "true",
      }))
      .filter((i) => i.href && !i.disabled)
  );

  const linhas: string[] = [];
  for (const item of itens) {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await fecharDialogos(page);
    const el = page.locator(seletor, { hasText: item.text }).first();
    // `force`: o badge do dev overlay do Next monta um nextjs-portal que
    // intercepta o ponteiro no viewport estreito. É artefato de dev, não do menu.
    await el.click({ timeout: 10000, force: true });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(350);
    const caiu = new URL(page.url()).pathname;
    linhas.push(
      `${caiu.includes("unauthorized") ? "FALHA" : "ok   "} | ${item.text.padEnd(22)} | ${item.href!.padEnd(26)} | ${caiu}`
    );
  }
  return { itens, linhas };
}

test("sidebar: nenhum item do menu leva a /unauthorized", async ({ page }) => {
  test.skip(!EMAIL || !PASS, "E2E_FUNC_EMAIL/E2E_FUNC_PASSWORD não definidos");
  const login = new LoginPage(page);
  await login.goto();
  await login.loginAndWaitHome(EMAIL!, PASS!, "/dashboard");

  const { itens, linhas } = await clicarCadaItem(page, '[data-sidebar="menu-button"]');
  console.log(`\n=== SIDEBAR (${itens.length} itens) ===\n` + linhas.join("\n"));
  expect(linhas.filter((l) => l.startsWith("FALHA"))).toEqual([]);
});

test("bottom nav: nenhum item do menu leva a /unauthorized", async ({ page }) => {
  test.skip(!EMAIL || !PASS, "E2E_FUNC_EMAIL/E2E_FUNC_PASSWORD não definidos");

  await page.setViewportSize({ width: 390, height: 844 });
  const login = new LoginPage(page);
  await login.goto();
  await login.loginAndWaitHome(EMAIL!, PASS!, "/dashboard");

  const { itens, linhas } = await clicarCadaItem(page, 'nav[aria-label="Navegação principal"] a');
  console.log(`\n=== BOTTOM NAV (${itens.length} itens) ===\n` + linhas.join("\n"));
  expect(linhas.filter((l) => l.startsWith("FALHA"))).toEqual([]);
});