import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreateSaleAction } = vi.hoisted(() => ({
  mockCreateSaleAction: vi.fn(),
}));

vi.mock("@/app/dashboard/pdv/actions", () => ({
  createSaleAction: mockCreateSaleAction,
}));

import { enviarOuEnfileirar, montarVendaPendente, type EnvioVenda } from "./enviar";
import { lerFila } from "./queue";

const TENANT = 3;
const USER = 11;

function envio(over: Partial<EnvioVenda> = {}): EnvioVenda {
  return {
    items: [{ productId: 10, quantity: 2 }],
    paymentMethod: "DINHEIRO",
    discount: 0,
    customerName: "",
    tenantId: TENANT,
    userId: USER,
    ...over,
  };
}

/** Erro de rede real: o que o fetch lança sem conexão. */
function erroDeRede() {
  return new TypeError("Failed to fetch");
}

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
});

describe("enviarOuEnfileirar — o que enfileira e o que não", () => {
  it("grava a venda no banco quando online", async () => {
    mockCreateSaleAction.mockResolvedValue({ ok: 512 });

    const r = await enviarOuEnfileirar(envio(), "key-1");

    expect(r).toEqual({ tipo: "venda", saleId: 512 });
    expect(contar()).toBe(0);
  });

  it("enfileira em erro de rede e devolve confirmação", async () => {
    mockCreateSaleAction.mockRejectedValue(erroDeRede());

    const r = await enviarOuEnfileirar(envio(), "key-1");

    expect(r).toEqual({ tipo: "enfileirada" });
    expect(contar()).toBe(1);
  });

  it("enfileira também em AbortError (Safari em timeout)", async () => {
    const abort = new Error("The operation was aborted");
    abort.name = "AbortError";
    mockCreateSaleAction.mockRejectedValue(abort);

    expect(await enviarOuEnfileirar(envio(), "key-1")).toEqual({ tipo: "enfileirada" });
    expect(contar()).toBe(1);
  });

  it("NÃO enfileira em erro HTTP do servidor", async () => {
    // Recusa do servidor não é falta de internet. Enfileirar aqui seria pedir
    // de novo uma resposta que já veio.
    mockCreateSaleAction.mockResolvedValue({ error: "stock" });

    const r = await enviarOuEnfileirar(envio(), "key-1");

    expect(r).toEqual({ tipo: "rejeitada", erro: "stock" });
    expect(contar()).toBe(0);
  });

  it("NÃO enfileira em 'forbidden' (permissão, não rede)", async () => {
    // Reenfileirar estoura o rate-limit de 60/min do proxy sem resolver nada.
    mockCreateSaleAction.mockResolvedValue({ error: "forbidden" });

    expect(await enviarOuEnfileirar(envio(), "key-1")).toEqual({
      tipo: "rejeitada",
      erro: "forbidden",
    });
    expect(contar()).toBe(0);
  });

  it("relança erro de programação em vez de enfileirar", async () => {
    // Bug nosso não pode virar venda pendente: a fila fingiria estar saudável
    // enquanto o defeito continua.
    mockCreateSaleAction.mockRejectedValue(new Error("não sou erro de rede"));

    await expect(enviarOuEnfileirar(envio(), "key-1")).rejects.toThrow("não sou erro de rede");
    expect(contar()).toBe(0);
  });

  it("avisa quando a fila está cheia, sem perder a indicação", async () => {
    // O operador precisa saber que a venda NÃO ficou garantida.
    for (let i = 0; i < 200; i++) {
      window.localStorage.setItem(
        `boramais:pdv:fila:${TENANT}:${USER}`,
        JSON.stringify(
          Array.from({ length: i + 1 }, (_, k) => ({
            idempotencyKey: `k${k}`,
            occurredAt: Date.now(),
            items: [{ productId: 1, quantity: 1 }],
            paymentMethod: "DINHEIRO",
            discount: 0,
            customerName: "",
            tentativas: 0,
          }))
        )
      );
    }
    mockCreateSaleAction.mockRejectedValue(erroDeRede());

    const r = await enviarOuEnfileirar(envio(), "key-nova");

    expect(r).toEqual({ tipo: "enfileirada", motivo: "cheia" });
  });
});

describe("enviarOuEnfileirar — o que vai dentro da fila", () => {
  it("mantém a idempotencyKey que o chamador gerou", async () => {
    // A chave é gerada na confirmação, não no retry: é ela que torna o
    // reenvio um no-op pelo unique do banco.
    mockCreateSaleAction.mockRejectedValue(erroDeRede());

    await enviarOuEnfileirar(envio(), "chave-fixa");

    expect(lerFila(TENANT, USER)[0].idempotencyKey).toBe("chave-fixa");
  });

  it("guarda o instante da venda, não o do sync", async () => {
    mockCreateSaleAction.mockRejectedValue(erroDeRede());
    const antes = Date.now();

    await enviarOuEnfileirar(envio(), "key-1");

    const t = lerFila(TENANT, USER)[0].occurredAt;
    expect(t).toBeGreaterThanOrEqual(antes);
    expect(t).toBeLessThanOrEqual(Date.now());
  });

  it("preserva split de pagamento", async () => {
    mockCreateSaleAction.mockRejectedValue(erroDeRede());

    await enviarOuEnfileirar(
      envio({
        paymentMethod: "DINHEIRO",
        payments: [
          { method: "DINHEIRO", amount: 500 },
          { method: "PIX", amount: 500 },
        ],
      }),
      "key-1"
    );

    expect(lerFila(TENANT, USER)[0].payments).toEqual([
      { method: "DINHEIRO", amount: 500 },
      { method: "PIX", amount: 500 },
    ]);
  });

  it("converte o recebido em centavos, para o servidor calcular o troco", async () => {
    mockCreateSaleAction.mockRejectedValue(erroDeRede());

    await enviarOuEnfileirar(envio({ received: "50,00" }), "key-1");

    expect(lerFila(TENANT, USER)[0].receivedAmount).toBe(5000);
  });

  it("omite o recebido quando não houve troco", async () => {
    mockCreateSaleAction.mockRejectedValue(erroDeRede());

    await enviarOuEnfileirar(envio(), "key-1");

    expect(lerFila(TENANT, USER)[0].receivedAmount).toBeUndefined();
  });

  it("não deixa a venda de um operador vazar para a fila de outro", async () => {
    mockCreateSaleAction.mockRejectedValue(erroDeRede());

    await enviarOuEnfileirar(envio({ userId: 11 }), "key-1");

    expect(contar()).toBe(1);
    expect(lerFila(TENANT, 99)).toEqual([]);
  });
});

describe("montarVendaPendente", () => {
  it("não usa preço do dispositivo — só o que o caixa precisa cobrar", () => {
    // O preço autoritativo é do servidor (ADR-006 §6). Guardar um preço aqui
    // criaria a tentação de usá-lo no sync, que é o caminho para vender por
    // valor adulterado.
    const v = montarVendaPendente(envio(), "k");

    expect(v).not.toHaveProperty("unitPrice");
    expect(v).not.toHaveProperty("total");
  });

  it("começa sem tentativas, para o primeiro backoff ser o base", () => {
    expect(montarVendaPendente(envio(), "k").tentativas).toBe(0);
  });

  it("mantém o cashier info para o recibo sair igual ao online", () => {
    const v = montarVendaPendente(envio({ cashBoxId: 4, customerName: "Joana" }), "k");

    expect(v.cashBoxId).toBe(4);
    expect(v.customerName).toBe("Joana");
  });
});

function contar(): number {
  return lerFila(TENANT, USER).length;
}
