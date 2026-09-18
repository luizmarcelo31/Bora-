import { test, expect } from "@playwright/test";

const ROUTES = ["", "pdv", "produtos", "estoque", "caixa", "categorias", "financeiro", "auditoria", "relatorios"];

test("tabelas têm scroll interno e a página não estoura", async ({ page }) => {
  for (const r of ROUTES) {
    await page.goto(`/dashboard${r ? `/${r}` : ""}`, { waitUntil: "networkidle" });
    const res = await page.evaluate(() => {
      const tables = Array.from(document.querySelectorAll("table"));
      const wrapped = tables.filter(
        (t) => t.parentElement && getComputedStyle(t.parentElement).overflowX === "auto"
      );
      const pageHScroll =
        document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
      return { tables: tables.length, wrapped: wrapped.length, pageHScroll };
    });
    expect(res.tables, `${r || "home"}: tabelas`).toBeGreaterThan(0);
    expect(res.wrapped, `${r || "home"}: wrapped`).toBe(res.tables);
    expect(res.pageHScroll, `${r || "home"}: page-hscroll`).toBe(false);
  }
});
