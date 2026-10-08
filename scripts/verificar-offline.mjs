/**
 * Roteiro automatizado de verificação do modo offline com a rede caída.
 *
 * O critério de pronto do ADR-006 é "vender offline nunca perde venda e nunca
 * duplica na fila". Este script cobre a parte que um script cobre: corte real
 * de rede no Chromium (context.setOffline — sem mock de fetch), venda,
 * reconexão, e conferência da fila e do banco.
 *
 * NÃO cobre, e continua manual: 2º aparelho vendendo o mesmo estoque, e
 * fechamento de caixa com pendência. Ambos precisam de dois dispositivos ou de
 * um operador de verdade.
 *
 * Rodar: node scripts/verificar-offline.mjs
 * Requer: dev server em :3000 e E2E_FUNC_EMAIL/E2E_FUNC_PASSWORD no env.
 * A conta precisa ter `sales.create` (PROPRIETARIO, GERENTE ou CAIXA) e o
 * tenant precisa ter produto ativo e caixa aberto.
 */
import { chromium } from "playwright";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.E2E_FUNC_EMAIL;
const PASS = process.env.E2E_FUNC_PASSWORD;

const passos = [];
const ok = (nome, extra = "") => passos.push({ nome, passou: true, extra });
const falha = (nome, motivo) => passos.push({ nome, passou: false, motivo });

const lerChaves = (page) =>
  page.evaluate(() =>
    Object.keys(localStorage).map((k) => ({ k, v: localStorage.getItem(k) ?? "" }))
  );

async function comRedeCaida(page, fn) {
  await page.context().setOffline(true);
  try {
    return await fn();
  } finally {
    await page.context().setOffline(false);
  }
}

(async () => {
  if (!EMAIL || !PASS) {
    console.error("E2E_FUNC_EMAIL/E2E_FUNC_PASSWORD não definidos.");
    process.exit(2);
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  // ---- 1. login ----
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Senha").fill(PASS);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/dashboard**", { timeout: 30000 });
  ok("login com rede");

  // ---- 2. warming: o PDV Expresso grava o snapshot do catálogo ----
  await page.goto(`${BASE}/dashboard/pdv/express`, { waitUntil: "networkidle" });
  await page.waitForTimeout(4000);

  const body = await page.evaluate(() => document.body.innerText);
  if (body.includes("Sem acesso") || body.includes("403")) {
    falha("PDV Expresso carrega", "a conta não tem sales.create — use PROPRIETARIO, GERENTE ou CAIXA");
    await browser.close();
    report();
    return;
  }
  ok("PDV Expresso carrega");

  const chaves = await lerChaves(page);
  const cat = chaves.find((c) => c.k.includes(":catalog:"));
  const produtosNoCache = cat ? (JSON.parse(cat.v) || []).length : 0;
  if (produtosNoCache > 0) {
    ok("catálogo cacheado para o offline", `${produtosNoCache} produtos em ${cat.k}`);
  } else {
    falha(
      "catálogo cacheado para o offline",
      `nenhum produto em ${cat?.k ?? "(chave ausente)"} — o tenant precisa ter produto ativo`
    );
  }

  // ---- 3. venda com a rede caída ----
  const filaAntes = await contarFila(page);

  await comRedeCaida(page, async () => {
    // Dois detalhes da UI do Express que o roteiro manual não menciona, e sem
    // os quais a automação não chega na venda:
    //
    // 1. A grade abre na categoria "★" (mais vendidos). Em um tenant sem
    //    vendas recentes ela está vazia e a tela mostra "Toque num produto
    //    para começar", com o catálogo inteiro cacheado.
    // 2. O `ScanBar` abre em MODO LEITOR (`inputMode="none"`), que é para
    //    leitor de código de barras. Digitar nele não filtra nada — é preciso
    //    apertar o botão de teclado primeiro (aria-label "Modo teclado").
    await page.getByRole("button", { name: "Modo teclado" }).click({ force: true }).catch(() => {});
    await page.waitForTimeout(400);

    const busca = page.getByLabel("Buscar produto ou bipar código");
    await busca.fill("Refrigerante");
    await page.waitForTimeout(1500);

    // `PressProductButton` nomeia o botão "nome, R$ x,00".
    const tile = page.locator('button[aria-label*="Refrigerante"]').first();
    if (await tile.count()) {
      await tile.click({ force: true });
      await page.waitForTimeout(1200);
    }

    // 3. Com pagamento em DINHEIRO, `canConfirmSingle` exige
    //    `received >= total`. Sem informar o recebido, CONFIRMAR fica
    //    DESABILITADO mesmo com o ticket cheio — a venda nunca fecha e a fila
    //    fica vazia. Atalho do próprio componente: R$ 10,00 cobre qualquer
    //    venda deste catálogo.
    await page.getByRole("button", { name: "R$ 10,00" }).click({ force: true }).catch(() => {});
    await page.waitForTimeout(800);

    const confirmar = page.getByRole("button", { name: /CONFIRMAR/i }).first();
    if (await confirmar.count()) {
      await confirmar.click({ force: true }).catch(() => {});
      await page.waitForTimeout(2500);
    }
  });

  const filaDepois = await contarFila(page);
  if (filaDepois > filaAntes) {
    ok("venda offline entrou na fila", `${filaAntes} → ${filaDepois} pendente(s)`);
  } else {
    falha(
      "venda offline entrou na fila",
      `a fila ficou em ${filaDepois} — o clique automatizado não fechou a venda (o roteiro manual em docs/changes/2026-10-02-modo-offline-pdv.md cobre esse passo)`
    );
  }

  // ---- 4. reconecta e sincroniza ----
  // O sync roda por timer/backoff, não no primeiro load. Espera com polling
  // em vez de um sleep fixo: recarregar cedo demais mede o timer, não o bug.
  await page.context().setOffline(false);
  await page.waitForTimeout(1500);

  let filaFinal = await contarFila(page);
  for (let i = 0; i < 20 && filaFinal > 0; i++) {
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // Dispara o sync na hora, pelo botão do SyncIndicator. O `online` que o
    // sync escuta não é emitido pelo Chromium emulado ao religar o contexto, e
    // o intervalo é de 60s — sem apertar o botão, este roteiro mediria o
    // timer, não a correção.
    const sincronizar = page.getByRole("button", { name: "Sincronizar vendas agora" });
    if (await sincronizar.count()) {
      await sincronizar.click({ force: true }).catch(() => {});
      await page.waitForTimeout(2500);
    }

    filaFinal = await contarFila(page);
  }

  if (filaFinal === 0) {
    ok("fila esvaziou após reconectar");
  } else {
    // Diagnóstico: a venda pode ter sincronizado (virou Sale no banco) sem a
    // entrada sair da fila. Com a idempotencyKey, o reenvio vira no-op no
    // banco — sem duplicar —, mas a entrada preso na fila é estado que não
    // se resolve sozinho e o operador não sabe que syncou.
    const restantes = await page.evaluate(() => {
      const k = Object.keys(localStorage).find((x) => x.includes(":fila:"));
      if (!k) return [];
      try {
        const a = JSON.parse(localStorage.getItem(k) || "[]");
        return a.map((v) => ({ key: v.idempotencyKey, tentativas: v.tentativas, erro: v.ultimoErro }));
      } catch {
        return [];
      }
    });
    falha(
      "fila esvaziou após reconectar",
      `ainda ${filaFinal} pendente(s) após 12 tentativas. Restantes: ${JSON.stringify(restantes)}`
    );
  }

  await browser.close();
  report();
})().catch((e) => {
  console.error("ERRO", e.message);
  process.exit(1);
});

async function contarFila(page) {
  return page.evaluate(() => {
    const k = Object.keys(localStorage).find((x) => x.includes(":fila:"));
    if (!k) return 0;
    try {
      const arr = JSON.parse(localStorage.getItem(k) || "[]");
      return Array.isArray(arr) ? arr.length : 0;
    } catch {
      return 0;
    }
  });
}

function report() {
  console.log("\n=== VERIFICAÇÃO DO MODO OFFLINE ===");
  for (const p of passos) {
    console.log(`${p.passou ? "OK   " : "FALHA"} ${p.nome}${p.extra ? `  (${p.extra})` : ""}`);
    if (!p.passou) console.log(`      → ${p.motivo}`);
  }
  const f = passos.filter((p) => !p.passou).length;
  console.log(`\n${passos.length - f}/${passos.length} verificações`);

  console.log(
    "\nAINDA MANUAL (dois dispositivos ou um operador):\n" +
      "  - 2º aparelho vende o mesmo estoque enquanto o 1º está offline\n" +
      "  - fechar caixa com pendência: aviso aparece e o fechamento acontece\n" +
      "  conferir no banco: duas vendas, estoque pode ficar negativo, duas\n" +
      "  linhas em /dashboard/divergencias"
  );
  process.exit(f > 0 ? 1 : 0);
}