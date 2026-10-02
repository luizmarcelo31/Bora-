import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  FILA_EVENT,
  MAX_ENTRADAS,
  contarPendentes,
  ehVendaPendenteValida,
  enfileirar,
  gravarCatalogo,
  gravarFila,
  lerCatalogo,
  lerFila,
  reenfileirar,
  remover,
  type CatalogoProduto,
} from "./queue";
import type { VendaPendente } from "./types";

const TENANT = 7;
const USER = 42;
const OUTRO_TENANT = 8;
const OUTRO_USER = 99;

function venda(over: Partial<VendaPendente> = {}): VendaPendente {
  return {
    idempotencyKey: "key-1",
    occurredAt: 1_757_000_000_000,
    items: [{ productId: 10, quantity: 2 }],
    paymentMethod: "DINHEIRO",
    discount: 0,
    customerName: "",
    tentativas: 0,
    ...over,
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
});

describe("fila offline — isolamento por tenant e operador", () => {
  it("nao vaza venda entre operadores do mesmo tenant", () => {
    // O PDV e compartilhado: PIN de troca sem logout. A fila de um operador
    // sincronizada no login do outro gravaria Sale.userId errado.
    enfileirar(TENANT, USER, venda({ idempotencyKey: "a" }));

    expect(contarPendentes(TENANT, USER)).toBe(1);
    expect(contarPendentes(TENANT, OUTRO_USER)).toBe(0);
  });

  it("nao vaza venda entre tenants", () => {
    enfileirar(TENANT, USER, venda({ idempotencyKey: "a" }));

    expect(contarPendentes(OUTRO_TENANT, USER)).toBe(0);
  });

  it("remover so afeta o dono da venda", () => {
    enfileirar(TENANT, USER, venda({ idempotencyKey: "a" }));
    enfileirar(TENANT, OUTRO_USER, venda({ idempotencyKey: "b" }));

    remover(TENANT, USER, "a");

    expect(contarPendentes(TENANT, USER)).toBe(0);
    expect(contarPendentes(TENANT, OUTRO_USER)).toBe(1);
  });
});

describe("fila offline — ordem e deduplicacao", () => {
  it("preserva ordem FIFO de atendimento", () => {
    // A ordem define quem ganha o estoque restante quando duas disputam o
    // mesmo saldo. Reordenar muda o resultado da reconciliacao.
    enfileirar(TENANT, USER, venda({ idempotencyKey: "a" }));
    enfileirar(TENANT, USER, venda({ idempotencyKey: "b" }));
    enfileirar(TENANT, USER, venda({ idempotencyKey: "c" }));

    expect(lerFila(TENANT, USER).map((v) => v.idempotencyKey)).toEqual(["a", "b", "c"]);
  });

  it("duplo toque em confirmar com a rede caida nao cria duas entradas", () => {
    // A chave do banco protege o retry, nao a fila local: sem este dedupe, o
    // servidor gravaria duas vendas para o mesmo toque.
    expect(enfileirar(TENANT, USER, venda({ idempotencyKey: "a" })).ok).toBe(true);
    expect(enfileirar(TENANT, USER, venda({ idempotencyKey: "a" })).ok).toBe(true);

    expect(contarPendentes(TENANT, USER)).toBe(1);
  });

  it("reenfileira no fim, com tentativa contada e erro registrado", () => {
    enfileirar(TENANT, USER, venda({ idempotencyKey: "a" }));
    enfileirar(TENANT, USER, venda({ idempotencyKey: "b" }));

    reenfileirar(TENANT, USER, venda({ idempotencyKey: "a" }), "Failed to fetch");

    const fila = lerFila(TENANT, USER);
    expect(fila.map((v) => v.idempotencyKey)).toEqual(["b", "a"]);
    const a = fila.find((v) => v.idempotencyKey === "a");
    expect(a?.tentativas).toBe(1);
    expect(a?.ultimoErro).toBe("Failed to fetch");
  });
});

describe("fila offline — limites e falha de storage", () => {
  it("recusa entrada acima do teto em vez de estourar o storage", () => {
    for (let i = 0; i < MAX_ENTRADAS; i++) {
      expect(enfileirar(TENANT, USER, venda({ idempotencyKey: `k${i}` })).ok).toBe(true);
    }

    const excedente = enfileirar(TENANT, USER, venda({ idempotencyKey: "excedente" }));
    expect(excedente.ok).toBe(false);
    expect(excedente.motivo).toBe("cheia");
    expect(contarPendentes(TENANT, USER)).toBe(MAX_ENTRADAS);
  });

  it("dedupe funciona mesmo com a fila cheia", () => {
    for (let i = 0; i < MAX_ENTRADAS; i++) {
      enfileirar(TENANT, USER, venda({ idempotencyKey: `k${i}` }));
    }

    // Reenvio de uma venda ja enfileirada nao deve falhar por falta de espaco:
    // ela ja esta la.
    const r = enfileirar(TENANT, USER, venda({ idempotencyKey: "k0" }));
    expect(r.ok).toBe(true);
  });

  it("JSON corrompido devolve fila vazia em vez de derrubar a tela", () => {
    window.localStorage.setItem(`boramais:pdv:fila:${TENANT}:${USER}`, "{quebrado");

    expect(lerFila(TENANT, USER)).toEqual([]);
  });

  it("payload que nao e array devolve fila vazia", () => {
    window.localStorage.setItem(`boramais:pdv:fila:${TENANT}:${USER}`, '{"a":1}');
    expect(lerFila(TENANT, USER)).toEqual([]);
  });

  it("storage bloqueado nao lanca — enfileirar reporta falha", () => {
    // Modo privado / cota estourada. O chamador mostra "sem espaco no aparelho";
    // falhar em silencio seria perder venda sem o operador perceber.
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error("QuotaExceededError");
    };

    try {
      const r = enfileirar(TENANT, USER, venda());
      expect(r.ok).toBe(false);
      expect(r.motivo).toBe("sem-espaco");
    } finally {
      Storage.prototype.setItem = original;
    }
  });
});

describe("fila offline — evento e integridade", () => {
  it("dispara evento ao gravar, para o indicador reagir sem polling", () => {
    let disparou = false;
    const listener = () => {
      disparou = true;
    };
    window.addEventListener(FILA_EVENT, listener);

    try {
      enfileirar(TENANT, USER, venda());
      expect(disparou).toBe(true);
    } finally {
      window.removeEventListener(FILA_EVENT, listener);
    }
  });

  it("descarta entrada invalida sem derrubar as vizinhas", () => {
    const boa = venda({ idempotencyKey: "boa" });
    gravarFila(TENANT, USER, [boa, { lixo: true } as unknown as VendaPendente]);

    expect(lerFila(TENANT, USER).map((v) => v.idempotencyKey)).toEqual(["boa"]);
  });
});

describe("ehVendaPendenteValida", () => {
  it("aceita uma venda completa", () => {
    expect(ehVendaPendenteValida(venda())).toBe(true);
  });

  it("aceita venda sem pagamentos de split (pagamento unico cobre)", () => {
    // Versao anterior do app nao gravou `payments`; a entrada continua valida.
    expect(ehVendaPendenteValida(venda({ payments: undefined }))).toBe(true);
  });

  it.each([
    ["sem idempotencyKey", { idempotencyKey: "" }],
    ["sem occurredAt", { occurredAt: Number.NaN }],
    ["sem items", { items: [] }],
    ["tentativas nao numerica", { tentativas: "x" as unknown as number }],
  ])("rejeita %s", (_rotulo, over) => {
    expect(ehVendaPendenteValida(venda(over as Partial<VendaPendente>))).toBe(false);
  });

  it.each([
    ["productId nao inteiro", [{ productId: 1.5, quantity: 1 }]],
    ["quantity zero", [{ productId: 1, quantity: 0 }]],
    ["quantity negativa", [{ productId: 1, quantity: -3 }]],
  ])("rejeita item com %s", (_rotulo, items) => {
    expect(
      ehVendaPendenteValida(venda({ items: items as VendaPendente["items"] }))
    ).toBe(false);
  });

  it("rejeita valores que nao sao objeto", () => {
    expect(ehVendaPendenteValida(null)).toBe(false);
    expect(ehVendaPendenteValida("venda")).toBe(false);
    expect(ehVendaPendenteValida(undefined)).toBe(false);
  });
});

describe("catalogo em cache", () => {
  const produtos: CatalogoProduto[] = [
    { id: 1, name: "Coca 2L", price: 700, stock: 12, barcode: "7891000100103", category: "Bebidas", imageUrl: null },
    { id: 2, name: "Pao", price: 500, stock: 3, barcode: null, category: "Padaria", imageUrl: null },
  ];

  it("round-trip por tenant", () => {
    expect(gravarCatalogo(TENANT, produtos)).toBe(true);
    expect(lerCatalogo(TENANT)).toEqual(produtos);
  });

  it("nao vaza catalogo entre tenants", () => {
    gravarCatalogo(TENANT, produtos);

    expect(lerCatalogo(OUTRO_TENANT)).toEqual([]);
  });

  it("descarta produto corrompido do catalogo", () => {
    gravarCatalogo(TENANT, [
      ...produtos,
      { name: "sem id" } as unknown as CatalogoProduto,
    ]);

    const lido = lerCatalogo(TENANT);
    expect(lido).toHaveLength(2);
    expect(lido.every((p) => typeof p.id === "number")).toBe(true);
  });

  it("catalogo corrompido devolve lista vazia", () => {
    window.localStorage.setItem(`boramais:pdv:catalog:${TENANT}`, "[[[");
    expect(lerCatalogo(TENANT)).toEqual([]);
  });
});
