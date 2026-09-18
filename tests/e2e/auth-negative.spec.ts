import { test, expect } from "@playwright/test";

// Sessão limpa: este spec testa o fluxo deslogado.
test.use({ storageState: { cookies: [], origins: [] } });

test("login com senha errada mostra erro (sem criar nada)", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("nao-existe@empresa.com");
  await page.getByLabel("Senha").fill("senha-errada-123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Não foi possível entrar.")).toBeVisible({ timeout: 30000 });
  expect(page.url()).toContain("/login");
});
