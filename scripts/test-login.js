const { chromium } = require("playwright");

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const errors = [];
  page.on("pageerror", (e) => errors.push("PAGE-ERROR: " + e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push("CONSOLE-ERROR: " + msg.text());
  });

  // 1. Teste de login
  console.log("=== 1. Teste de login ===");
  try {
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    // Preencher formulário
    await page.fill('input#login-email', "admin@bora.com");
    await page.fill('input#login-password', "admin12345");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Verificar redirecionamento para /admin
    const url = page.url();
    console.log("URL após login:", url);

    // Verificar se estamos em /admin
    if (url.includes("/admin")) {
      console.log("✅ Login OK -> Redirecionado para /admin");
    } else if (url.includes("/login")) {
      const errorText = await page.textContent("text[role='alert']").catch(() => null);
      console.log("❌ Login falhou -> Redirect para /login");
      console.log("   Mensagem de erro:", errorText || "não informada");
      errors.push("LOGIN-FALHOU");
    } else {
      console.log("⚠️  URL inesperada:", url);
    }
  } catch (e) {
    console.log("ERRO no login:", e.message);
    errors.push("LOGIN-ERROR: " + e.message);
  }

  await page.waitForTimeout(1000);

  // 2. Teste da tela /admin
  console.log("\n=== 2. Teste da tela /admin ===");
  try {
    await page.goto("http://localhost:3000/admin", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    const title = await page.locator("text=Visão geral").first().isVisible().catch(() => false);
    console.log("Título 'Visão geral' visível:", title);
    if (!title) errors.push("ADMIN-PAGE-NOT-FOUND");
  } catch (e) {
    console.log("ERRO na tela /admin:", e.message);
    errors.push("ADMIN-ERROR: " + e.message);
  }

  // 3. Teste da tela /admin/features
  console.log("\n=== 3. Teste da tela /admin/features ===");
  try {
    await page.goto("http://localhost:3000/admin/features", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Verificar se os toggles existem
    const toggleCount = await page.locator('[data-key]').count();
    console.log("Toggles de flags:", toggleCount);
    if (toggleCount < 3) errors.push("FEATURES-TOGGLE-COUNT: " + toggleCount);

    // Tentar alternar a primeira flag
    const firstToggle = page.locator('[data-key]').first();
    await firstToggle.click();
    await page.waitForTimeout(1500);
    const urlAfterClick = page.url();
    console.log("URL após click no toggle:", urlAfterClick);

    // Verificar se o ?ok=1 está presente (sinal de POST bem-sucedido)
    const okPresent = urlAfterClick.includes("?ok=1");
    console.log("?ok=1 presente:", okPresent);
    if (!okPresent) errors.push("FEATURES-TOGGLE-NO-OK: toggle não salvou");
  } catch (e) {
    console.log("ERRO na tela /admin/features:", e.message);
    errors.push("FEATURES-ERROR: " + e.message);
  }

  // 4. Teste da tela /admin/planos
  console.log("\n=== 4. Teste da tela /admin/planos ===");
  try {
    await page.goto("http://localhost:3000/admin/planos", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const title = await page.locator("text=Planos").first().isVisible().catch(() => false);
    console.log("Título 'Planos' visível:", title);
    if (!title) errors.push("PLANOS-NOT-FOUND");

    // Verificar se o formulário de novo plano está visível
    const formVisible = await page.locator('form[action*="salvarPlanoAction"]').first().isVisible().catch(() => false);
    console.log("Formulário de novo plano visível:", formVisible);
  } catch (e) {
    console.log("ERRO na tela /admin/planos:", e.message);
    errors.push("PLANOS-ERROR: " + e.message);
  }

  // 5. Teste da tela /admin/empresas
  console.log("\n=== 5. Teste da tela /admin/empresas ===");
  try {
    await page.goto("http://localhost:3000/admin/empresas", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const title = await page.locator("text=Empresas").first().isVisible().catch(() => false);
    console.log("Título 'Empresas' visível:", title);
    if (!title) errors.push("EMPRESAS-NOT-FOUND");
  } catch (e) {
    console.log("ERRO na tela /admin/empresas:", e.message);
    errors.push("EMPRESAS-ERROR: " + e.message);
  }

  // 6. Teste da tela /admin/usuarios
  console.log("\n=== 6. Teste da tela /admin/usuarios ===");
  try {
    await page.goto("http://localhost:3000/admin/usuarios", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const title = await page.locator("text=Usuários").first().isVisible().catch(() => false);
    console.log("Título 'Usuários' visível:", title);
    if (!title) errors.push("USUARIOS-NOT-FOUND");
  } catch (e) {
    console.log("ERRO na tela /admin/usuarios:", e.message);
    errors.push("USUARIOS-ERROR: " + e.message);
  }

  // Relatório final
  console.log("\n=== RELATÓRIO FINAL ===");
  if (errors.length > 0) {
    console.log("ERRO(S) encontrado(s):");
    errors.forEach((e) => console.log("  -", e));
  } else {
    console.log("Nenhum erro encontrado. Tudo funcionando.");
  }

  await browser.close();
}

main().catch((e) => {
  console.log("Erro fatal:", e);
  process.exit(1);
});
