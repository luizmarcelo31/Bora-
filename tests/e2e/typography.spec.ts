import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/login-page";

/**
 * Confere a tipografia computada no navegador: peso e tamanho.
 *
 * Ler a classe no JSX não prova nada. O bug que a Fase 1 consertou foi de
 * CASCATA — `* { font-weight: 400 }` fora de `@layer` anulava as utilitárias e
 * a UI inteira caía para 400 sem erro nenhum. O mesmo vale para tamanho: os
 * tokens `--text-*` encolheram a escala inteira 1-2px e nenhuma mudança de peso
 * explicava o ar de "reduzida". Por isso aqui mede-se getComputedStyle.
 *
 * Padrão de referência: corpo 400, rótulos 500, título/número em destaque 700,
 * escala no tamanho padrão do Tailwind.
 */
test.use({ storageState: { cookies: [], origins: [] } });

const EMAIL = process.env.E2E_FUNC_EMAIL;
const PASS = process.env.E2E_FUNC_PASSWORD;

test("pesos tipográficos computados estão no padrão antigo", async ({ page }) => {
  test.skip(!EMAIL || !PASS, "E2E_FUNC_EMAIL/E2E_FUNC_PASSWORD não definidos");

  const login = new LoginPage(page);
  await login.goto();
  await login.loginAndWaitHome(EMAIL!, PASS!, "/dashboard");
  await page.waitForLoadState("networkidle");

  const pesos = await page.evaluate(() => {
    const w = (sel: string) => {
      const el = document.querySelector(sel);
      return el ? getComputedStyle(el).fontWeight : null;
    };
    return {
      corpo: w("p"),
      h1: w("h1"),
      itemAtivoSidebar: w('[data-sidebar="menu-button"][data-active="true"]'),
      grupoSidebar: w('[data-sidebar="group-label"]'),
      grupoUppercase: (() => {
        const el = document.querySelector('[data-sidebar="group-label"]');
        return el ? getComputedStyle(el).textTransform : null;
      })(),
      grupoSize: (() => {
        const el = document.querySelector('[data-sidebar="group-label"]');
        return el ? getComputedStyle(el).fontSize : null;
      })(),
      // A faixa, quando existe, é o wrapper do h1 (o PageHeader em si).
      headerFundo: (() => {
        const el = document.querySelector("h1")?.closest("div");
        return el ? getComputedStyle(el).backgroundColor : null;
      })(),
      // A descrição é irmão da linha do título, dentro do mesmo wrapper.
      descricaoHeader: (() => {
        const linha = document.querySelector("h1")?.parentElement;
        const p = linha?.nextElementSibling;
        return p && p.tagName === "P" ? getComputedStyle(p).fontSize : null;
      })(),
    };
  });

  console.log("=== PESOS COMPUTADOS ===\n" + JSON.stringify(pesos, null, 1));

  // Padrão antigo: corpo 400, rótulos 500, título/número em destaque 700.
  expect(pesos.corpo).toBe("400");
  expect(pesos.itemAtivoSidebar).toBe("500");
  expect(pesos.h1).toBe("700");

  // O group label voltou de uppercase/10px para text-xs/500 sem uppercase.
  expect(pesos.grupoUppercase).toBe("none");
  expect(pesos.grupoSize).toBe("12px");

  // O header de página voltou a ser transparente (borda inferior, sem faixa).
  expect(pesos.headerFundo).toBe("rgba(0, 0, 0, 0)");

  // A descrição do header é text-sm: precisa voltar a 14px, não os 12px que o
  // token --text-sm impunha antes da reversão da escala.
  expect(pesos.descricaoHeader).toBe("14px");
});