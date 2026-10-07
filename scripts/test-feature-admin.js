const { chromium } = require("playwright");

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const errors = [];
  page.on("pageerror", (e) => errors.push("PAGE-ERROR: " + e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push("CONSOLE-ERROR: " + msg.text());
  });

  // Verificar login
  console.log("=== 1. Tentando login ===");
  try {
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle", timeout: 30000 });
    console.log("Login carregado: OK");

    // Preencha com as credenciais do .env
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitBtn = page.locator('button[type="submit"]');

    await emailInput.fill(process.env.E2E_ADMIN_EMAIL || "admin@bora.com");
    await passwordInput.fill(process.env.E2E_ADMIN_PASSWORD || "admin123");
    await submitBtn.click();

    // Aguardar redirect para /admin
    await page.waitForURL("**/admin", { timeout: 30000 });
    console.log("Redirecionado para /admin: OK");
  } catch (e) {
    console.log("ERRO no login:", e.message);
    errors.push("LOGIN-ERROR: " + e.message);
  }

  await page.waitForTimeout(1000);

  // Teste 1: Tela de recursos
  console.log("\n=== 2. Tela /admin/features ===");
  try {
    await page.goto("http://localhost:3000/admin/features", { waitUntil: "networkidle", timeout: 30000 });
    const title = await page.locator("text=Recursos").first().isVisible();
    console.log("Título 'Recursos' visível:", title);
    if (!title) errors.push("PAGE-NOT-FOUND: /admin/features");

    const flagCount = await page.locator('[data-key]').count();
    console.log("Botões de toggle de flags:", flagCount);

    // Teste verdadeiro: formulário "Ativar/Desativar" (que faz POST para salvarFeatureFlagAction)
    // Use o selector correto: o botão de submit dentro do card "Atual (plataforma)"
    const formLocator = page.locator('form:has-text("Ativar")');
    const formDetails = await formLocator.evaluate((el) => {
      const f = el;
      return {
        action: f.action,
        method: f.method,
        children: f.children.length,
      };
    }).catch(() => null);
    console.log("Form details:", formDetails);

    const ativarButton = page.locator('form:has-text("Ativar") button[type="submit"]').first();
    const ativarVisible = await ativarButton.isVisible().catch(() => false);
    console.log("Botão 'Ativar' visível:", ativarVisible, ativarVisible === true ? "(é type=submit)" : "");

    if (ativarVisible) {
      const tagName = await ativarButton.evaluate((el) => el.tagName);
      const btnType = await ativarButton.evaluate((el) => el.type);
      console.log("Elemento:", tagName, "type:", btnType);

      // Tentar submeter o form programaticamente para ver se o Server Action é chamado
      const submitResult = await formLocator.evaluate((el) => {
        const form = el;
        return new Promise((resolve) => {
          // Submeter o form via fetch (evitar o comportamento nativo do navegador)
          const fd = new FormData(form);
          fetch(form.action, {
            method: form.method || "POST",
            body: fd,
          }).then(() => resolve("submitted")).catch((e) => resolve("error: " + e));
        });
      }).catch((e) => "error: " + e);
      console.log("Submit programático:", submitResult);

      // Aguardar a resposta do form
      try {
        await page.waitForResponse((response) => response.url().includes("/admin/features") && response.status() >= 200 && response.status() < 400, { timeout: 5000 }).catch(() => {});
      } catch (e) {
        console.log("Nenhuma resposta de redirecionamento recebida");
      }

      await ativarButton.click();
      await page.waitForTimeout(1500);

      const okParam = page.url().includes("?ok=1");
      console.log("?ok=1 presente (POST bem-sucedido):", okParam);
    } else {
      console.log("Botão 'Ativar' NÃO encontrado");
    }
  } catch (e) {
    console.log("ERRO na tela /admin/features:", e.message);
    errors.push("FEATURES-ERROR: " + e.message);
  }

  // Teste 2: Tela de planos
  console.log("\n=== 3. /admin/planos ===");
  try {
    await page.goto("http://localhost:3000/admin/planos", { waitUntil: "networkidle", timeout: 30000 });
    const title = await page.locator("text=Planos").first().isVisible();
    console.log("Título 'Planos':", title);
    if (!title) errors.push("PAGE-NOT-FOUND: /admin/planos");

    // Verificar se a seção de feature flags está presente
    const hasFeatureSection = await page.locator("text=Feature Flags").first().isVisible().catch(() => false);
    console.log("Seção Feature Flags:", hasFeatureSection);

    // Verificar se a seção de limites está presente
    const hasLimitsSection = await page.locator("text=Limite de usuários").first().isVisible().catch(() => false);
    console.log("Seção de limites:", hasLimitsSection);

    // Verificar se o form de novo plano existe
    const formVisible = await page.locator('form[action*="salvarPlanoAction"]').first().isVisible().catch(() => false);
    console.log("Formulário de novo plano:", formVisible);
  } catch (e) {
    console.log("ERRO /admin/planos:", e.message);
    errors.push("PLANOS-ERROR: " + e.message);
  }

  // Verificar acesso ao /admin
  console.log("\n=== 4. /admin ===");
  try {
    await page.goto("http://localhost:3000/admin", { waitUntil: "networkidle", timeout: 30000 });
    const title = await page.locator("text=Visão geral").first().isVisible().catch(() => false);
    console.log("Título /admin (Visão geral):", title);
    if (!title) errors.push("PAGE-NOT-FOUND: /admin");
  } catch (e) {
    console.log("ERRO /admin:", e.message);
    errors.push("ADMIN-ERROR: " + e.message);
  }

  // Teste 4: Tela de empresass
  console.log("\n=== 5. Tela /admin/empresas ===");
  try {
    await page.goto("http://localhost:3000/admin/empresas", { waitUntil: "networkidle", timeout: 30000 });
    const title = await page.locator("text=Empresas").first().isVisible().catch(() => false);
    console.log("Título de empresas:", title);
  } catch (e) {
    console.log("ERRO na tela /admin/empresas:", e.message);
    errors.push("EMPRESAS-ERROR: " + e.message);
  }

  // Teste 5: Tela de planos (detalhe de um plano)
  console.log("\n=== 6. Detalhe de plano /admin/planos/1 ===");
  try {
    await page.goto("http://localhost:3000/admin/planos/1", { waitUntil: "networkidle", timeout: 30000 });
    const title = await page.locator("text=Editar").first().isVisible().catch(() => false);
    console.log("Título de edição de plano:", title);
  } catch (e) {
    console.log("ERRO no detalhe de plano:", e.message);
    errors.push("PLANO-DETAIL-ERROR: " + e.message);
  }

  // Relatório final
  console.log("\n=== RELATÓRIO FINAL ===");
  if (errors.length > 0) {
    console.log("ERRO(S) encontrado(s):");
    errors.forEach((e) => console.log("  -", e));
  } else {
    console.log("Nenhum erro encontrado. Tudo funcionando:");
  }

  await browser.close();
}

main().catch((e) => {
  console.log("Erro fatal:", e);
  process.exit(1);
});
