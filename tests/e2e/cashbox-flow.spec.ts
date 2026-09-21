import { test, expect } from "@playwright/test";

test.describe("CashBox Flow", () => {
  test("abrir e fechar caixa", async ({ page }) => {
    await page.goto("/dashboard/caixa", { waitUntil: "networkidle" });

    const openButton = page.getByRole("button", { name: /abrir caixa/i });
    if (await openButton.isVisible()) {
      await openButton.click();

      const nameInput = page.getByPlaceholder(/nome do caixa/i);
      if (await nameInput.isVisible()) {
        await nameInput.fill("Caixa Teste E2E");
      }

      const balanceInput = page.getByPlaceholder(/saldo inicial/i);
      if (await balanceInput.isVisible()) {
        await balanceInput.fill("100");
      }

      const confirmButton = page.getByRole("button", { name: /confirmar/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
        await page.waitForTimeout(2000);
      }
    }

    const closeButton = page.getByRole("button", { name: /fechar caixa/i });
    if (await closeButton.isVisible()) {
      await closeButton.click();

      const confirmClose = page.getByRole("button", {
        name: /confirmar fechamento/i,
      });
      if (await confirmClose.isVisible()) {
        await confirmClose.click();
        await page.waitForTimeout(2000);
      }
    }
  });
});

test.describe("Financial Flow", () => {
  test("criar movimentacao financeira", async ({ page }) => {
    await page.goto("/dashboard/financeiro", { waitUntil: "networkidle" });

    const addButton = page.getByRole("button", { name: /adicionar/i });
    if (await addButton.isVisible()) {
      await addButton.click();

      const typeSelect = page.getByRole("combobox", { name: /tipo/i });
      if (await typeSelect.isVisible()) {
        await typeSelect.click();
        await page.getByRole("option", { name: /despesa/i }).click();
      }

      const categoryInput = page.getByPlaceholder(/categoria/i);
      if (await categoryInput.isVisible()) {
        await categoryInput.fill("Teste E2E");
      }

      const descriptionInput = page.getByPlaceholder(/descricao/i);
      if (await descriptionInput.isVisible()) {
        await descriptionInput.fill("Movimentacao teste E2E");
      }

      const amountInput = page.getByPlaceholder(/valor/i);
      if (await amountInput.isVisible()) {
        await amountInput.fill("50");
      }

      const saveButton = page.getByRole("button", { name: /salvar/i });
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(2000);
      }
    }
  });
});

test.describe("Stock Movement Flow", () => {
  test("registrar entrada de estoque", async ({ page }) => {
    await page.goto("/dashboard/estoque", { waitUntil: "networkidle" });

    const addButton = page.getByRole("button", { name: /movimentar/i });
    if (await addButton.isVisible()) {
      await addButton.click();

      const typeSelect = page.getByRole("combobox", { name: /tipo/i });
      if (await typeSelect.isVisible()) {
        await typeSelect.click();
        await page.getByRole("option", { name: /entrada/i }).click();
      }

      const quantityInput = page.getByPlaceholder(/quantidade/i);
      if (await quantityInput.isVisible()) {
        await quantityInput.fill("10");
      }

      const reasonInput = page.getByPlaceholder(/motivo/i);
      if (await reasonInput.isVisible()) {
        await reasonInput.fill("Entrada teste E2E");
      }

      const confirmButton = page.getByRole("button", { name: /confirmar/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
        await page.waitForTimeout(2000);
      }
    }
  });
});

test.describe("Category Flow", () => {
  test("criar categoria", async ({ page }) => {
    await page.goto("/dashboard/categorias", { waitUntil: "networkidle" });

    const addButton = page.getByRole("button", { name: /adicionar/i });
    if (await addButton.isVisible()) {
      await addButton.click();

      const nameInput = page.getByPlaceholder(/nome/i);
      if (await nameInput.isVisible()) {
        await nameInput.fill("Categoria Teste E2E");
      }

      const saveButton = page.getByRole("button", { name: /salvar/i });
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(2000);
      }
    }
  });
});

test.describe("Reports Page", () => {
  test("pagina de relatorios carrega", async ({ page }) => {
    const response = await page.goto("/dashboard/relatorios", {
      waitUntil: "networkidle",
    });
    expect(response?.status()).toBe(200);
    await expect(page.getByText(/relatorios/i).first()).toBeVisible();
  });
});

test.describe("Audit Page", () => {
  test("pagina de auditoria carrega", async ({ page }) => {
    const response = await page.goto("/dashboard/auditoria", {
      waitUntil: "networkidle",
    });
    expect(response?.status()).toBe(200);
  });
});

test.describe("Settings Page", () => {
  test("pagina de configuracoes carrega", async ({ page }) => {
    const response = await page.goto("/dashboard/configuracoes", {
      waitUntil: "networkidle",
    });
    expect(response?.status()).toBe(200);
  });
});
