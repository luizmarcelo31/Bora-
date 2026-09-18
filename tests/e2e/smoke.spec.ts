import { test, expect } from "@playwright/test";

const ROUTES = [
  "pdv",
  "produtos",
  "estoque",
  "caixa",
  "categorias",
  "financeiro",
  "auditoria",
  "relatorios",
  "configuracoes",
];

test("login landou no dashboard com busca global", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByLabel("Busca global")).toBeVisible();
});

test("9 rotas respondem 200 sem pageerrors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 150)));
  for (const r of ROUTES) {
    const res = await page.goto(`/dashboard/${r}`, { waitUntil: "networkidle" });
    expect(res?.status(), r).toBe(200);
  }
  expect(errors, "pageerrors").toEqual([]);
});
