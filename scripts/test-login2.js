const { chromium } = require("playwright");

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const errors = [];
  page.on("pageerror", (e) => errors.push("PAGE-ERROR: " + e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push("CONSOLE-ERROR: " + msg.text());
  });

  // 1. Acessar a tela de login
  console.log("=== 1. Acessar tela de login ===");
  try {
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    const title = await page.locator("text=Entrar").first().isVisible().catch(() => false);
    console.log("Título 'Entrar' visível:", title);
    if (!title) errors.push("LOGIN-PAGE-NOT-FOUND");
  } catch (e) {
    console.log("ERRO na tela de login:", e.message);
    errors.push("LOGIN-PAGE-ERROR: " + e.message);
  }

  // 2. Preencher formulário
  console.log("\n=== 2. Preencher formulário ===");
  try {
    await page.fill('#login-email', "admin@bora.com");
    await page.fill('#login-password', "admin12345");
    await page.click('button[type="submit"]');
    console.log("Formulário preenchido e submetido");
  } catch (e) {
    console.log("ERRO no preenchimento:", e.message);
    errors.push("FORM-ERROR: " + e.message);
  }

  // 3. Aguardar redirecionamento
  console.log("\n=== 3. Aguardar redirecionamento ===");
  try {
    // Esperar até 15 segundos por mudança de URL
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/login") && r.request().method() === "GET" && r.url().includes("error"), { timeout: 15000 }).catch(() => null),
      page.waitForURL("**/admin**", { timeout: 15000 }).catch(() => null),
    ]);

    const url = page.url();
    console.log("URL final:", url);

    if (url.includes("/admin")) {
      console.log("✅ Login OK -> Redirecionado para /admin");
      const title = await page.locator("text=Visão geral").first().isVisible().catch(() => false);
      console.log("Título 'Visão geral' visível:", title);
      if (!title) errors.push("ADMIN-PAGE-NOT-FOUND");
    } else if (url.includes("/login")) {
      const errorText = await page.locator('text[role="alert"]').first().textContent().catch(() => null);
      console.log("❌ Login falhou -> Redirect para /login");
      console.log("   Mensagem de erro:", errorText || "não informada");
      errors.push("LOGIN-FALHOU");
    } else {
      console.log("⚠️  URL inesperada:", url);
      errors.push("UNEXPECTED-URL: " + url);
    }
  } catch (e) {
    console.log("ERRO no aguardo:", e.message);
    errors.push("WAIT-ERROR: " + e.message);
  }

  // 4. Teste das outras telas
  console.log("\n=== 4. Testando outras telas ===");
  const adminPages = [
    { path: "/admin", title: "Visão geral" },
    { path: "/admin/features", title: "Feature Flags" },
    { path: "/admin/planos", title: "Planos" },
    { path: "/admin/empresas", title: "Empresas" },
    { path: "/admin/usuarios", title: "Usuários" },
  ];

  for (const { path, title } of adminPages) {
    try {
      await page.goto("http://localhost:3000" + path, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      const isVisible = await page.locator("text=" + title).first().isVisible().catch(() => false);
      console.log(`${path}: ${isVisible ? "✅ OK" : "❌ FAIL"}`);
      if (!isVisible) errors.push(`ADMIN-PAGE-NOT-FOUND: ${path}`);
    } catch (e) {
      console.log(`${path}: ❌ ERRO - ${e.message}`);
      errors.push(`ADMIN-PAGE-ERROR: ${path} - ${e.message}`);
    }
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
