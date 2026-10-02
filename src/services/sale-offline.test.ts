import { beforeEach, describe, expect, it, vi } from "vitest";

import { SaleService } from "./index";

// Mesma razão de category.test.ts: a factory de vi.mock roda hoisted acima dos
// imports, então os mocks precisam nascer em vi.hoisted().
const {
  mockSaleCount,
  mockSaleFindFirst,
  mockSaleFindMany,
  mockSaleCreate,
  mockSaleUpdate,
  mockProductFindMany,
  mockTenantFindUnique,
  mockCashBoxFindFirst,
  mockUserFindFirst,
  mockTenantSettingsFindUnique,
  mockTransaction,
} = vi.hoisted(() => ({
  mockSaleCount: vi.fn(),
  mockSaleFindFirst: vi.fn(),
  mockSaleFindMany: vi.fn(),
  mockSaleCreate: vi.fn(),
  mockSaleUpdate: vi.fn(),
  mockProductFindMany: vi.fn(),
  mockTenantFindUnique: vi.fn(),
  mockCashBoxFindFirst: vi.fn(),
  mockUserFindFirst: vi.fn(),
  mockTenantSettingsFindUnique: vi.fn(),
  mockTransaction: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    sale: {
      count: mockSaleCount,
      findFirst: mockSaleFindFirst,
      findMany: mockSaleFindMany,
      create: mockSaleCreate,
      update: mockSaleUpdate,
    },
    product: { findMany: mockProductFindMany },
    tenant: { findUnique: mockTenantFindUnique },
    cashBox: { findFirst: mockCashBoxFindFirst },
    user: { findFirst: mockUserFindFirst },
    tenantSettings: { findUnique: mockTenantSettingsFindUnique },
    $transaction: mockTransaction,
  },
}));

/** Inventário com saldo controlado, para exercitar a borda de estoque. */
function inventario(quantity: number) {
  return { id: 1, tenantId: 1, productId: 10, quantity, minimumStock: 0 };
}

/** Monta a transação com doubles por entidade e devolve para ajuste por teste. */
function armarTx() {
  const tx = {
    sale: { create: mockSaleCreate, update: mockSaleUpdate },
    inventory: {
      findFirst: vi.fn().mockResolvedValue(inventario(2)),
      update: vi.fn().mockResolvedValue({}),
    },
    stockMovement: { create: vi.fn().mockResolvedValue({}) },
    cashBox: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    financialMovement: { create: vi.fn().mockResolvedValue({}) },
  };
  mockTransaction.mockImplementation(async (fn: (t: unknown) => unknown) => fn(tx));
  return tx;
}

const TENANT = 1;

function input(over: Record<string, unknown> = {}) {
  return {
    userId: 1,
    items: [{ productId: 10, quantity: 2, unitPrice: 500, discount: 0 }],
    discount: 0,
    paymentMethod: "DINHEIRO" as const,
    ...over,
  };
}

/** Prepara produto com preço do banco e settings sem estoque negativo. */
function preparoBase() {
  mockTenantFindUnique.mockResolvedValue({ id: TENANT, name: "Loja" });
  mockUserFindFirst.mockResolvedValue({ id: 1, tenantId: TENANT });
  mockCashBoxFindFirst.mockResolvedValue({ id: 5, tenantId: TENANT, status: "ABERTO" });
  mockSaleFindFirst.mockResolvedValue(null);
  mockSaleCount.mockResolvedValue(0);
  mockProductFindMany.mockResolvedValue([
    { id: 10, name: "Coca", price: 500, active: true, inventory: inventario(2), wholesalePrice: null, wholesaleMinQuantity: null },
  ]);
  mockTenantSettingsFindUnique.mockResolvedValue({
    enableDiscount: true,
    maxDiscount: null,
    enableStockControl: true,
    allowNegativeStock: false,
    feeCredit: 0,
    feeDebit: 0,
  });
  // Ecoa o que foi gravado, como o banco faz. O service relê `occurredAt` e
  // `cashBoxId` da venda criada — um mock de retorno fixo esconderia a própria
  // política que o teste quer verificar.
  mockSaleCreate.mockImplementation(async (args: { data: Record<string, unknown> }) => {
    const d = args.data;
    return {
      id: 501,
      ...d,
      items: [],
      createdAt: new Date("2026-10-02T12:00:00Z"),
      updatedAt: new Date("2026-10-02T12:00:00Z"),
    };
  });
}

describe("SaleService.createSale — política offline (ADR-006 §5, §6, §7, §8)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("venda online (comportamento anterior, não pode regredir)", () => {
    it("continua recusando estoque insuficiente", async () => {
      preparoBase();
      const tx = armarTx();
      // Estoque 2, venda 2: passa. Forçamos 1 para estourar a validação.
      tx.inventory.findFirst.mockResolvedValue(inventario(1));

      await expect(SaleService.createSale(TENANT, input())).rejects.toMatchObject({
        type: "INSUFFICIENT_STOCK",
      });
      // A venda é criada dentro da transação e o erro desfaz tudo — o que
      // garante a atomicidade é o rollback, não a ordem das escritas.
      expect(mockTransaction).toHaveBeenCalled();
      expect(tx.inventory.update).not.toHaveBeenCalled();
    });

    it("não marca offline e não recebe occurredAt", async () => {
      preparoBase();
      armarTx();

      await SaleService.createSale(TENANT, input());

      expect(mockSaleCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ offline: false, occurredAt: null }),
        })
      );
    });

    it("não solta o vínculo do caixa quando ele está aberto", async () => {
      preparoBase();
      const tx = armarTx();
      tx.cashBox.updateMany.mockResolvedValue({ count: 1 });

      await SaleService.createSale(TENANT, input({ cashBoxId: 5 }));

      expect(tx.cashBox.updateMany).toHaveBeenCalled();
      expect(mockSaleUpdate).not.toHaveBeenCalled();
    });
  });

  describe("venda offline: estoque", () => {
    it("NÃO recusa por estoque insuficiente e registra divergência", async () => {
      // O dinheiro foi entregue e a mercadoria saiu. Recusar é perda direta.
      preparoBase();
      const tx = armarTx();
      tx.inventory.findFirst.mockResolvedValue(inventario(0));

      const sale = await SaleService.createSale(
        TENANT,
        input({ offline: true, occurredAt: new Date("2026-10-02T12:00:00Z").toISOString() })
      );

      expect(mockSaleCreate).toHaveBeenCalled();
      const div = (sale as unknown as { divergencias: { estoque: unknown[] } }).divergencias;
      expect(div.estoque).toEqual([{ productId: 10, disponivel: 0, vendido: 2 }]);
    });

    it("decrementa o estoque mesmo ficando negativo", async () => {
      preparoBase();
      const tx = armarTx();
      tx.inventory.findFirst.mockResolvedValue(inventario(0));

      await SaleService.createSale(TENANT, input({ offline: true }));

      expect(tx.inventory.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { quantity: { decrement: 2 } },
      });
    });

    it("não registra divergência quando o estoque cobre a venda", async () => {
      preparoBase();
      armarTx();

      const sale = await SaleService.createSale(TENANT, input({ offline: true }));

      const div = (sale as unknown as { divergencias: { estoque: unknown[] } }).divergencias;
      expect(div.estoque).toEqual([]);
    });

    it("registra o estoque disponível real na divergência", async () => {
      // O relatório de divergências precisa dizer quanto havia, senão o
      // gerente não consegue saber se faltou 1 ou 50.
      preparoBase();
      const tx = armarTx();
      tx.inventory.findFirst.mockResolvedValue(inventario(1));

      const sale = await SaleService.createSale(TENANT, input({ offline: true }));

      const div = (sale as unknown as { divergencias: { estoque: { disponivel: number; vendido: number }[] } })
        .divergencias;
      expect(div.estoque[0]).toEqual({ productId: 10, disponivel: 1, vendido: 2 });
    });
  });

  describe("venda offline: preço", () => {
    it("usa o preço do banco, ignorando o que o dispositivo mandou", async () => {
      // ADR-006 §6: preço autoritativo é do servidor. Aceitar o do cliente
      // permitiria vender a R$ 0,01 com o app adulterado.
      preparoBase();
      armarTx();

      await SaleService.createSale(
        TENANT,
        input({ offline: true, items: [{ productId: 10, quantity: 2, unitPrice: 1, discount: 0 }] })
      );

      expect(mockSaleCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            total: 1000,
            items: {
              create: [
                expect.objectContaining({ productId: 10, unitPrice: 500, total: 1000 }),
              ],
            },
          }),
        })
      );
    });
  });

  describe("venda offline: caixa", () => {
    it("grava a venda e solta o caixa quando ele fechou no sync", async () => {
      preparoBase();
      const tx = armarTx();
      tx.cashBox.updateMany.mockResolvedValue({ count: 0 });

      const sale = await SaleService.createSale(TENANT, input({ offline: true, cashBoxId: 5 }));

      expect(mockSaleCreate).toHaveBeenCalled();
      const div = (sale as unknown as { divergencias: { caixa: boolean } }).divergencias;
      expect(div.caixa).toBe(true);
      expect(mockSaleUpdate).toHaveBeenCalledWith({
        where: { id: 501 },
        data: { cashBoxId: null },
      });
    });

    it("contabiliza a receita sem vincular a caixa fechado", async () => {
      preparoBase();
      const tx = armarTx();
      tx.cashBox.updateMany.mockResolvedValue({ count: 0 });

      await SaleService.createSale(TENANT, input({ offline: true, cashBoxId: 5 }));

      expect(tx.financialMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: "RECEITA", amount: 1000, cashBoxId: null }),
        })
      );
    });

    it("online ainda recusa quando o caixa está fechado", async () => {
      preparoBase();
      const tx = armarTx();
      tx.cashBox.updateMany.mockResolvedValue({ count: 0 });

      await expect(SaleService.createSale(TENANT, input({ cashBoxId: 5 }))).rejects.toMatchObject({
        type: "CLOSED_CASHBOX",
      });
    });
  });

  describe("venda offline: data real (cupom e DRE)", () => {
    it("usa occurredAt para o cupom diário, não a hora do sync", async () => {
      // Venda de 02/10 sincronizada em 05/10 precisa receber o cupom do dia 02.
      preparoBase();
      armarTx();

      await SaleService.createSale(
        TENANT,
        input({ offline: true, occurredAt: "2026-10-02T14:00:00.000Z" })
      );

      const criado = mockSaleCreate.mock.calls[0][0].data;
      const cupomDia = criado.couponDate as Date;
      // Dia local de SP da venda (02/10), não o do sync.
      expect(cupomDia.getUTCDate()).toBe(2);
    });

    it("grava occurredAt na venda", async () => {
      preparoBase();
      armarTx();

      await SaleService.createSale(
        TENANT,
        input({ offline: true, occurredAt: "2026-10-02T14:00:00.000Z" })
      );

      expect(mockSaleCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ offline: true, occurredAt: new Date("2026-10-02T14:00:00.000Z") }),
        })
      );
    });

    it("lança a receita na data da venda, não na do sync", async () => {
      // Sem isso o DRE do dia em que o cliente pagou fica vazio.
      preparoBase();
      const tx = armarTx();

      await SaleService.createSale(
        TENANT,
        input({ offline: true, occurredAt: "2026-10-02T14:00:00.000Z" })
      );

      const receita = tx.financialMovement.create.mock.calls[0][0].data;
      expect((receita.movementDate as Date).toISOString()).toBe("2026-10-02T14:00:00.000Z");
    });

    it("ignora occurredAt em venda online", async () => {
      // Não basta o campo existir: online, a data é a do servidor.
      preparoBase();
      armarTx();

      await SaleService.createSale(TENANT, input({ occurredAt: "2020-01-01T00:00:00.000Z" }));

      expect(mockSaleCreate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ occurredAt: null }) })
      );
    });

    it("não usa occurredAt malformado", async () => {
      preparoBase();
      armarTx();

      // O Zod filtra string inválida antes do service; se chegar assim mesmo,
      // o service não deve fabricar uma data.
      await SaleService.createSale(TENANT, input({ offline: true, occurredAt: "ontem" }));

      expect(mockSaleCreate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ occurredAt: null }) })
      );
    });
  });

  describe("idempotência", () => {
    it("devolve a venda existente sem criar outra", async () => {
      preparoBase();
      const existente = { id: 777, tenantId: TENANT, items: [], offline: true };
      mockSaleFindFirst.mockResolvedValue(existente);

      const sale = await SaleService.createSale(TENANT, input({ offline: true, idempotencyKey: "abc" }));

      expect(sale.id).toBe(777);
      expect(mockTransaction).not.toHaveBeenCalled();
    });

    it("replay de venda offline não duplica movimentação de estoque", async () => {
      // O @@unique([tenantId, idempotencyKey]) é o que torna o retry seguro.
      preparoBase();
      const existente = { id: 777, tenantId: TENANT, items: [] };
      mockSaleFindFirst.mockResolvedValue(existente);

      await SaleService.createSale(TENANT, input({ offline: true, idempotencyKey: "abc" }));

      expect(mockSaleCreate).not.toHaveBeenCalled();
    });
});
});
