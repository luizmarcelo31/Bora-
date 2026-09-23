import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/login-page";

/**
 * Matriz role × rota (skill e2e-testing).
 *
 * Sessão sempre limpa neste spec: cada teste faz login via UI.
 * Credenciais via env (nunca hardcoded):
 * - E2E_EMAIL / E2E_PASSWORD → conta tenant comum (OWNER ou inferior)
 * - E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD → conta SUPER_ADMIN
 * Testes sem credencial fazem skip; guards deslogados rodam sempre.
 */

// Sessão limpa: este spec controla o próprio login via POM.
test.use({ storageState: { cookies: [], origins: [] } });

function tenantCreds() {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  return email && password ? { email, password } : null;
}

function adminCreds() {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  return email && password ? { email, password } : null;
}

test.describe("guards deslogado (sem credencial)", () => {
  test("/admin redireciona para login preservando destino", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL("**/login**", { timeout: 30000 });
    expect(page.url()).toContain("redirect=%2Fadmin");
  });

  test("/dashboard redireciona para login preservando destino", async ({ page }) => {
    await page.goto("/dashboard/pdv");
    await page.waitForURL("**/login**", { timeout: 30000 });
    expect(page.url()).toContain("redirect=");
    expect(page.url()).toContain("dashboard");
  });

  test("/ raiz deslogada cai no login", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL("**/login**", { timeout: 30000 });
  });
});

test.describe("role tenant (rota comum)", () => {
  test.beforeEach(async () => {
    test.skip(!tenantCreds(), "E2E_EMAIL/E2E_PASSWORD não definidos");
  });

  test("login padrão landou em /dashboard", async ({ page }) => {
    const c = tenantCreds()!;
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAndWaitHome(c.email, c.password, "/dashboard");
    await expect(page.getByLabel("Busca global")).toBeVisible();
  });

  test("login com ?redirect=/admin cai em /dashboard (nunca /admin)", async ({ page }) => {
    const c = tenantCreds()!;
    const login = new LoginPage(page);
    await login.goto("/admin");
    await login.loginAs(c.email, c.password);
    await page.waitForURL("**/dashboard**", { timeout: 30000 });
    expect(page.url()).not.toContain("/admin");
  });

  test("tenant logado que abre /admin vê /unauthorized", async ({ page }) => {
    const c = tenantCreds()!;
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAndWaitHome(c.email, c.password, "/dashboard");
    await page.goto("/admin");
    await page.waitForURL("**/unauthorized**", { timeout: 30000 });
    await expect(page.getByText("Sem acesso")).toBeVisible();
  });

  test("tenant logado que abre / cai em /dashboard", async ({ page }) => {
    const c = tenantCreds()!;
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAndWaitHome(c.email, c.password, "/dashboard");
    await page.goto("/");
    await page.waitForURL("**/dashboard**", { timeout: 30000 });
  });

  test("open-redirect não sai do app após login", async ({ page }) => {
    const c = tenantCreds()!;
    await page.goto("/login?redirect=https://evil.example.com");
    const login = new LoginPage(page);
    await login.loginAs(c.email, c.password);
    await page.waitForURL("**/dashboard**", { timeout: 30000 });
    expect(new URL(page.url()).hostname).not.toBe("evil.example.com");
  });
});

test.describe("role super admin (rota /admin)", () => {
  test.beforeEach(async () => {
    test.skip(!adminCreds(), "E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD não definidos");
  });

  test("login padrão landou em /admin", async ({ page }) => {
    const c = adminCreds()!;
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAndWaitHome(c.email, c.password, "/admin");
    await expect(page.getByText("Administração da plataforma")).toBeVisible();
  });

  test("login com ?redirect=/dashboard/pdv cai em /admin (nunca rota comum)", async ({ page }) => {
    const c = adminCreds()!;
    const login = new LoginPage(page);
    await login.goto("/dashboard/pdv");
    await login.loginAs(c.email, c.password);
    await page.waitForURL("**/admin**", { timeout: 30000 });
    expect(page.url()).not.toContain("/dashboard");
  });

  test("super admin logado que abre / cai em /admin", async ({ page }) => {
    const c = adminCreds()!;
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAndWaitHome(c.email, c.password, "/admin");
    await page.goto("/");
    await page.waitForURL("**/admin**", { timeout: 30000 });
  });

  test("super admin logado que abre /login é levado a /admin", async ({ page }) => {
    const c = adminCreds()!;
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAndWaitHome(c.email, c.password, "/admin");
    await page.goto("/login");
    await page.waitForURL("**/admin**", { timeout: 30000 });
  });
});
