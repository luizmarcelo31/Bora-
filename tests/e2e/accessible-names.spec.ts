import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/login-page";

/**
 * Nenhum controle de formulário fica sem nome acessível.
 *
 * Cobre as duas vanguardas do WCAG: 4.1.2 (nome, papel, valor) e 3.3.2
 * (rótulo ou instrução). Um campo que o leitor de tela anuncia só como
 * "caixa de combinação" ou "campo de texto" é inútil para quem usa teclado e
 * leitor de tela — e o teclado puro depende da ordem e do rótulo para saber
 * onde está.
 *
 * Mede pela árvore de acessibilidade real do Chromium (CDP
 * `Accessibility.getFullAXTree`), não por `aria-label` no JSX: o nome
 * acessível pode vir de `<label for>`, `<label>` envolvente ou
 * `aria-labelledby`, e o que vale é o que o leitor de tela anuncia.
 */

test.use({ storageState: { cookies: [], origins: [] } });

const EMAIL = process.env.E2E_FUNC_EMAIL;
const PASS = process.env.E2E_FUNC_PASSWORD;

const ROTAS_TENANT = [
  "/dashboard",
  "/dashboard/produtos",
  "/dashboard/estoque",
  "/dashboard/financeiro",
  "/dashboard/categorias",
  "/dashboard/compras",
  "/dashboard/inventario",
  "/dashboard/promocoes",
  "/dashboard/caixa",
  "/dashboard/auditoria",
  "/dashboard/relatorios",
  "/dashboard/configuracoes",
  "/dashboard/divergencias",
  "/dashboard/novidades",
  "/dashboard/pdv",
  "/dashboard/pdv/express",
];

const ROTAS_ADMIN = [
  "/admin",
  "/admin/empresas",
  "/admin/usuarios",
  "/admin/planos",
  "/admin/assinaturas",
  "/admin/suporte",
  "/admin/notificacoes",
  "/admin/permissoes",
  "/admin/saude",
  "/admin/auditoria",
  "/admin/configuracoes",
  "/admin/features",
];

/** Papéis que o usuário precisa identificar para operar a tela. */
const PAPELIS = ["combobox", "textbox", "searchbox", "spinbutton", "checkbox", "radio"];

// 28 rotas em dev, cada uma compilando por rota (5-15s na primeira vez).
// O timeout default de 240s do projeto não cabe; não é um gate lento por
// acaso — é volume.
test.setTimeout(900_000);

test("todo campo de formulário tem nome acessível", async ({ page }) => {
  test.skip(!EMAIL || !PASS, "E2E_FUNC_EMAIL/E2E_FUNC_PASSWORD não definidos");

  const login = new LoginPage(page);
  await login.goto();
  await login.loginAndWaitHome(EMAIL!, PASS!, "/dashboard");

  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Accessibility.enable");

  const semNome: string[] = [];
  const contagem: Record<string, number> = {};

  for (const rota of [...ROTAS_TENANT, ...ROTAS_ADMIN]) {
    await page.goto(`http://localhost:3000${rota}`, { waitUntil: "domcontentloaded" });
    // Os formulários de cadastro ficam em <details> fechado; abrir para o
    // gate ver o mesmo que o usuário vê ao expandir.
    await page.evaluate(() => document.querySelectorAll("details").forEach((d) => d.setAttribute("open", "")));

    let nodes: Array<{ role?: { value?: string }; name?: { value?: string } }> = [];
    try {
      // `getFullAXTree` sem `nodeId` devolve a árvore inteira — é o que o CDP
      // aceita (o parâmetro `nodeId` não existe nesse método).
      ({ nodes } = await cdp.send("Accessibility.getFullAXTree"));
    } catch {
      continue; // rota sem documento (redirecionou)
    }

    for (const n of nodes) {
      const papel = n.role?.value;
      if (!papel || !PAPELIS.includes(papel)) continue;
      contagem[papel] = (contagem[papel] ?? 0) + 1;
      if (!n.name?.value?.trim()) semNome.push(`${rota} → ${papel} sem nome`);
    }
  }

  console.log("\n=== CAMPOS POR PAPEL ===");
  console.log(JSON.stringify(contagem, null, 1));
  if (semNome.length) console.log("\nSEM NOME:\n" + semNome.join("\n"));

  expect(semNome, "campos de formulário sem nome acessível").toEqual([]);
});