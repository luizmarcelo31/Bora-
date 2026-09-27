import { test, expect, type Page } from "@playwright/test";
import { LoginPage } from "./pages/login-page";

/**
 * Admin plataforma (fases 1-7 + paginação 27/09). Só leitura: nenhum teste
 * escreve no banco, então não precisa de E2E_WRITE=1.
 *
 * Credenciais via env (nunca hardcoded):
 * - E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD → conta SUPER_ADMIN
 * Sem credencial os testes fazem skip; guards deslogados rodam sempre.
 */

// Sessão limpa: este spec controla o próprio login via POM.
test.use({ storageState: { cookies: [], origins: [] } });

function adminCreds() {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  return email && password ? { email, password } : null;
}

async function loginAdmin(page: Page, email: string, password: string) {
  const login = new LoginPage(page);
  await login.goto();
  await login.loginAndWaitHome(email, password, "/admin");
}

test.describe("guards deslogado (sem credencial)", () => {
  test("/admin/auditoria redireciona para login", async ({ page }) => {
    await page.goto("/admin/auditoria");
    await page.waitForURL("**/login**", { timeout: 30000 });
    expect(page.url()).toContain("redirect=");
  });

  test("/admin/suporte redireciona para login", async ({ page }) => {
    await page.goto("/admin/suporte");
    await page.waitForURL("**/login**", { timeout: 30000 });
    expect(page.url()).toContain("redirect=");
  });
});

test.describe("admin plataforma (só leitura)", () => {
  test.beforeEach(async () => {
    test.skip(!adminCreds(), "E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD não definidos");
  });

  test("command center carrega sem pageerrors", async ({ page }) => {
    const c = adminCreds()!;
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 150)));
    await loginAdmin(page, c.email, c.password);
    await expect(page.getByText("Administração da plataforma")).toBeVisible();
    expect(errors, "pageerrors").toEqual([]);
  });

  test("empresas, assinaturas, suporte e auditoria respondem 200 sem pageerrors", async ({ page }) => {
    const c = adminCreds()!;
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 150)));
    await loginAdmin(page, c.email, c.password);

    const paginas = [
      { rota: "/admin/empresas", titulo: "Empresas" },
      { rota: "/admin/assinaturas", titulo: "Assinaturas" },
      { rota: "/admin/suporte", titulo: "Suporte" },
      { rota: "/admin/auditoria", titulo: "Auditoria da plataforma" },
      { rota: "/admin/planos", titulo: "Planos" },
      { rota: "/admin/saude", titulo: "Saúde da plataforma" },
    ];
    for (const p of paginas) {
      const res = await page.goto(p.rota, { waitUntil: "networkidle" });
      expect(res?.status(), p.rota).toBe(200);
      await expect(page.getByRole("heading", { name: p.titulo }).first()).toBeVisible({ timeout: 15000 });
    }
    expect(errors, "pageerrors").toEqual([]);
  });

  test("busca de empresas filtra por URL", async ({ page }) => {
    const c = adminCreds()!;
    await loginAdmin(page, c.email, c.password);
    await page.goto("/admin/empresas", { waitUntil: "networkidle" });
    await page.getByPlaceholder("Buscar por nome ou email").fill("zzz-inexistente");
    await page.waitForURL("**q=zzz-inexistente**", { timeout: 15000 });
    await expect(page.getByText("Nenhuma empresa encontrada")).toBeVisible({ timeout: 15000 });
  });

  test("página fora do alcance mostra estado vazio", async ({ page }) => {
    const c = adminCreds()!;
    await loginAdmin(page, c.email, c.password);
    const res = await page.goto("/admin/empresas?pagina=99999", { waitUntil: "networkidle" });
    expect(res?.status()).toBe(200);
    await expect(page.getByText("Nenhuma empresa encontrada")).toBeVisible({ timeout: 15000 });
  });

  test("empresa 360 abre pelo link da listagem", async ({ page }) => {
    const c = adminCreds()!;
    await loginAdmin(page, c.email, c.password);
    await page.goto("/admin/empresas", { waitUntil: "networkidle" });
    const primeiro = page.locator('table a[href^="/admin/empresas/"]').first();
    await expect(primeiro).toBeVisible({ timeout: 15000 });
    await primeiro.click();
    await page.waitForURL("**/admin/empresas/*", { timeout: 15000 });
    expect(page.url()).toMatch(/\/admin\/empresas\/\d+/);
  });
});
