import { test, expect } from "@playwright/test";

test("busca global navega para rota", async ({ page }) => {
  await page.goto("/dashboard");
  await page.keyboard.press("/");
  await page.getByLabel("Busca global").fill("estoque");
  await page.getByRole("button", { name: "Estoque" }).click();
  await page.waitForURL("**/dashboard/estoque", { timeout: 15000 });
});

test("tabs de filtro navegam por URL", async ({ page }) => {
  await page.goto("/dashboard/produtos");
  await page.getByRole("tab", { name: "Inativos" }).click();
  await page.waitForURL("**status=inactive*", { timeout: 15000 });
});

test("toast de params some com a URL", async ({ page }) => {
  // Redireciona com ?ok=cancel direto: o SearchParamToast deve exibir e limpar.
  await page.goto("/dashboard/pdv?ok=cancel");
  await expect(page.getByText(/Venda cancelada/).first()).toBeVisible({ timeout: 20000 });
  await page.waitForFunction(() => !location.href.includes("ok="), null, { timeout: 15000 });
});
