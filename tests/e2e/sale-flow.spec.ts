import { test, expect } from "@playwright/test";

/**
 * Fluxo com ESCRITA real (venda + cancelamento = estoque net-zero).
 * Roda só com E2E_WRITE=1. Requer produto com estoque no tenant de teste.
 */
const WRITE = process.env.E2E_WRITE === "1";

test.describe("sale flow", () => {
  test.skip(!WRITE, "requer E2E_WRITE=1");

  test("venda pelo drawer + cancelamento com estorno", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 150)));

    await page.goto("/dashboard/pdv", { waitUntil: "networkidle" });
    const rowsBefore = await page.locator("table tbody tr").count();

    // Adiciona o primeiro item com estoque (pula cards "Sem estoque" desabilitados)
    const addButtons = page.getByRole("button", { name: "Adicionar" });
    const n = await addButtons.count();
    let added = false;
    for (let i = 0; i < n; i++) {
      if (await addButtons.nth(i).isEnabled()) {
        await addButtons.nth(i).click();
        added = true;
        break;
      }
    }
    expect(added, "item adicionado").toBe(true);

    await page.getByRole("button", { name: /Revisar e finalizar/ }).click();
    await page.getByRole("button", { name: "Confirmar venda" }).click();
    await expect(page.getByText(/registrada com sucesso/).first()).toBeVisible({ timeout: 20000 });
    await page.waitForFunction((c) => document.querySelectorAll("table tbody tr").length > c, rowsBefore, {
      timeout: 20000,
    });

    // Cancela (cleanup: estoque volta)
    await page.getByRole("button", { name: "Cancelar" }).first().click();
    await page.getByPlaceholder("Ex.: cliente desistiu").fill("[TESTE] e2e repo");
    await page.getByRole("button", { name: "Confirmar cancelamento" }).click();
    await expect(page.getByText(/Venda cancelada/).first()).toBeVisible({ timeout: 20000 });
    await page.waitForFunction(() => !location.href.includes("ok="), null, { timeout: 15000 });

    expect(errors, "pageerrors").toEqual([]);
  });
});
