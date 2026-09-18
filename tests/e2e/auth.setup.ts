import { test as setup, expect } from "@playwright/test";

/**
 * Setup de auth: login via UI com credenciais de ENV e salva storageState.
 * Requer E2E_EMAIL e E2E_PASSWORD (conta de teste com vínculo ativo).
 */
const AUTH_FILE = "tests/e2e/.auth.json";

setup("authenticate", async ({ page }) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  setup.skip(!email || !password, "E2E_EMAIL/E2E_PASSWORD não definidos");

  await page.goto("/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Senha").fill(password!);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/dashboard**", { timeout: 30000 });
  await expect(page.getByLabel("Busca global")).toBeVisible();

  await page.context().storageState({ path: AUTH_FILE });
});
