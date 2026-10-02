import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuditLogFindMany } = vi.hoisted(() => ({
  mockAuditLogFindMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    auditLog: { findMany: mockAuditLogFindMany },
  },
}));

import { listarDivergencias, resumirDivergencias, type DivergenciaVenda } from "./divergencias";

const TENANT = 5;

function log(over: Record<string, unknown> = {}) {
  return {
    entityId: 101,
    changes: JSON.stringify({
      offline: true,
      divergenciaEstoque: [{ productId: 10, disponivel: 1, vendido: 3 }],
      divergenciaCaixa: false,
    }),
    details: "Venda #101 sincronizada do modo offline com divergência",
    createdAt: new Date("2026-10-02T15:00:00Z"),
    userEmail: "op@loja.com",
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listarDivergencias", () => {
  it("lê a divergência gravada na auditoria", async () => {
    mockAuditLogFindMany.mockResolvedValue([log()]);

    const r = await listarDivergencias(TENANT);

    expect(r).toHaveLength(1);
    expect(r[0].saleId).toBe(101);
    expect(r[0].estoque).toEqual([{ productId: 10, disponivel: 1, vendido: 3 }]);
    expect(r[0].caixa).toBe(false);
  });

  it("ignora venda online, que não tem a marca offline", async () => {
    // Venda normal grava `changes` com total e itens — não é divergência.
    mockAuditLogFindMany.mockResolvedValue([
      log({ changes: JSON.stringify({ total: 1000, items: 2 }) }),
    ]);

    expect(await listarDivergencias(TENANT)).toEqual([]);
  });

  it("ignora venda offline que não divergiu", async () => {
    // Offline sem conflito também passa pela auditoria; contá-la aqui
    // transformaria o relatório em lista de vendas offline, que é outra tela.
    mockAuditLogFindMany.mockResolvedValue([
      log({ changes: JSON.stringify({ offline: true, divergenciaEstoque: [], divergenciaCaixa: false }) }),
    ]);

    expect(await listarDivergencias(TENANT)).toEqual([]);
  });

  it("inclui divergência só de caixa", async () => {
    mockAuditLogFindMany.mockResolvedValue([
      log({
        changes: JSON.stringify({ offline: true, divergenciaEstoque: [], divergenciaCaixa: true }),
      }),
    ]);

    const r = await listarDivergencias(TENANT);
    expect(r).toHaveLength(1);
    expect(r[0].caixa).toBe(true);
    expect(r[0].estoque).toEqual([]);
  });

  it("não quebra com changes em JSON inválido", async () => {
    // `changes` é string livre; formato desconhecido é ignorado, não erro.
    mockAuditLogFindMany.mockResolvedValue([log({ changes: "{quebrado" }), log()]);

    const r = await listarDivergencias(TENANT);
    expect(r).toHaveLength(1);
    expect(r[0].saleId).toBe(101);
  });

  it("não quebra com changes nulo", async () => {
    mockAuditLogFindMany.mockResolvedValue([log({ changes: null })]);
    expect(await listarDivergencias(TENANT)).toEqual([]);
  });

  it("tolera divergenciaEstoque fora de formato", async () => {
    // Campo corrompido e sem caixa: não há divergência a relatar, então a
    // entrada some. O que não pode acontecer é o relatório quebrar.
    mockAuditLogFindMany.mockResolvedValue([
      log({ changes: JSON.stringify({ offline: true, divergenciaEstoque: "nao-e-array" }) }),
    ]);

    expect(await listarDivergencias(TENANT)).toEqual([]);
  });

  it("mantém a venda quando só o caixa diverge, mesmo com estoque corrompido", async () => {
    mockAuditLogFindMany.mockResolvedValue([
      log({
        changes: JSON.stringify({ offline: true, divergenciaEstoque: 42, divergenciaCaixa: true }),
      }),
    ]);

    const r = await listarDivergencias(TENANT);
    expect(r).toHaveLength(1);
    expect(r[0].caixa).toBe(true);
    expect(r[0].estoque).toEqual([]);
  });

  it("ordena da mais recente para a mais antiga", async () => {
    mockAuditLogFindMany.mockResolvedValue([
      log({ entityId: 2, createdAt: new Date("2026-10-02T18:00:00Z") }),
      log({ entityId: 1, createdAt: new Date("2026-10-02T15:00:00Z") }),
    ]);

    const r = await listarDivergencias(TENANT);
    expect(r.map((v) => v.saleId)).toEqual([2, 1]);
  });

  it("respeita o limite pedido", async () => {
    mockAuditLogFindMany.mockResolvedValue([]);

    await listarDivergencias(TENANT, 50);

    expect(mockAuditLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50 })
    );
  });
});

describe("resumirDivergencias", () => {
  const base: DivergenciaVenda = {
    saleId: 1,
    occurredAt: new Date(),
    userEmail: null,
    estoque: [],
    caixa: false,
    detalhes: "",
  };

  it("zera em lista vazia", () => {
    expect(resumirDivergencias([])).toEqual({ vendas: 0, itensDeEstoque: 0, vendasSemCaixa: 0 });
  });

  it("soma itens de estoque e vendas sem caixa", () => {
    const r = resumirDivergencias([
      { ...base, estoque: [{ productId: 1, disponivel: 0, vendido: 2 }, { productId: 2, disponivel: 0, vendido: 1 }] },
      { ...base, saleId: 2, caixa: true },
    ]);

    expect(r).toEqual({ vendas: 2, itensDeEstoque: 2, vendasSemCaixa: 1 });
  });
});
