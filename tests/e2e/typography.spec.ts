import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/login-page";

/**
 * Regressão: a escala de texto foi encolhida no corpo da interface.
 *
 * O 63ab5f2 pôs `font-size: var(--text-body)` (14px) no `body`. Como quase
 * todo elemento da interface não tem utilitária de texto explícita, isso
 * encolheu tudo: texto corrido, parágrafos, rótulos de tabela, texto de
 * célula. E pior, `text-sm` (14px no Tailwind) passava a ter exatamente o
 * mesmo tamanho do corpo, então a hierarquia entre "texto" e "texto pequeno"
 * sumia.
 *
 * Este teste mede o computado, não a classe. Ler a classe no JSX não prova
 * nada: o bug do `63ab5f2` era de CASCATA, e o mesmo arquivo do
 * `tokens.css` já teve a regra `* { font-weight: 400 }` fora de `@layer`
 * anulando todas as utilitárias do Tailwind.
 *
 * A réplica de `.text-xs` que o 63ab5f2 colocou em `@layer components` era
 * código morto — `utilities` vem depois de `components` na cascata e sempre
 * vence. Este teste existe para travar que a hierarquia do Tailwind está
 * intacta, e que ninguém reintroduz a ilusão de que ela é consumível de
 * dentro de `components`.
 */

test.use({ storageState: { cookies: [], origins: [] } });

const EMAIL = process.env.E2E_FUNC_EMAIL;
const PASS = process.env.E2E_FUNC_PASSWORD;

/** Escala padrão do Tailwind v4 — a referência que a interface deve seguir. */
const ESCALA_PADRAO: Record<string, string> = {
  "text-xs": "12px",
  "text-sm": "14px",
  "text-base": "16px",
  "text-lg": "18px",
  "text-xl": "20px",
  "text-2xl": "24px",
  "text-3xl": "30px",
};

test("a escala de texto é a do Tailwind, e o corpo não a encolhe", async ({ page }) => {
  test.skip(!EMAIL || !PASS, "E2E_FUNC_EMAIL/E2E_FUNC_PASSWORD não definidos");

  const login = new LoginPage(page);
  await login.goto();
  await login.loginAndWaitHome(EMAIL!, PASS!, "/dashboard");

  const medido = await page.evaluate(() => {
    const probe = document.createElement("div");
    document.body.appendChild(probe);
    const util: Record<string, string> = {};
    for (const c of ["text-xs", "text-sm", "text-base", "text-lg", "text-xl", "text-2xl", "text-3xl"]) {
      probe.className = c;
      util[c] = getComputedStyle(probe).fontSize;
    }
    probe.className = "";
    // Um <p> sem utilitária nenhuma é o caso que o bug do 63ab5f2 encolhia.
    const p = document.createElement("p");
    probe.appendChild(p);
    const semUtilitaria = getComputedStyle(p).fontSize;
    probe.remove();
    return { util, body: getComputedStyle(document.body).fontSize, semUtilitaria };
  });

  console.log("=== ESCALA MEDIDA ===");
  console.log("body:                ", medido.body);
  console.log("p sem utilitaria:    ", medido.semUtilitaria);
  console.log(JSON.stringify(medido.util, null, 1));

  // A hierarquia do Tailwind está inteira — a réplica em @layer components
  // nunca venceu, e agora não existe mais para dar essa impressão.
  for (const [classe, esperado] of Object.entries(ESCALA_PADRAO)) {
    expect(medido.util[classe], `${classe} computado`).toBe(esperado);
  }

  // O corpo não encolhe: 16px, herdado do navegador, e não de um token.
  expect(medido.body).toBe("16px");
  expect(medido.semUtilitaria).toBe("16px");

  // E a distinção entre corpo e `text-sm` existe de novo — era o que sumia.
  expect(medido.semUtilitaria).not.toBe(medido.util["text-sm"]);
});