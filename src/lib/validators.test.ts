import { describe, expect, it } from "vitest";
import {
  cancelSaleSchema,
  createCategorySchema,
  createFinancialMovementSchema,
  createStockMovementSchema,
  formatCurrency,
  reaisToCents,
  saleItemSchema,
  updateTenantSettingsSchema,
  ValidationError,
  ValidationErrorType,
} from "./validators";

describe("category schema", () => {
  it("aceita PRODUCT e FINANCIAL", () => {
    expect(createCategorySchema.safeParse({ name: "Bebidas", kind: "PRODUCT" }).success).toBe(true);
    expect(createCategorySchema.safeParse({ name: "Aluguel", kind: "FINANCIAL" }).success).toBe(true);
  });

  it("rejeita nome vazio e kind inválido", () => {
    expect(createCategorySchema.safeParse({ name: "", kind: "PRODUCT" }).success).toBe(false);
    expect(createCategorySchema.safeParse({ name: "X", kind: "NOPE" }).success).toBe(false);
  });
});

describe("sale schemas", () => {
  it("item exige inteiros positivos", () => {
    expect(saleItemSchema.safeParse({ productId: 1, quantity: 2, unitPrice: 1293, discount: 0 }).success).toBe(true);
    expect(saleItemSchema.safeParse({ productId: 1, quantity: 0, unitPrice: 1293, discount: 0 }).success).toBe(false);
    expect(saleItemSchema.safeParse({ productId: 1, quantity: 1, unitPrice: 0, discount: 0 }).success).toBe(false);
  });

  it("cancel exige motivo", () => {
    expect(cancelSaleSchema.safeParse({ reason: "" }).success).toBe(false);
    expect(cancelSaleSchema.safeParse({ reason: "cliente desistiu" }).success).toBe(true);
  });
});

describe("financial schema", () => {
  it("aceita movimento válido e rejeita valor zerado", () => {
    const base = { type: "DESPESA", category: "Aluguel", description: "Loja", amount: 25000 };
    expect(createFinancialMovementSchema.safeParse(base).success).toBe(true);
    expect(createFinancialMovementSchema.safeParse({ ...base, amount: 0 }).success).toBe(false);
    expect(createFinancialMovementSchema.safeParse({ ...base, type: "NOPE" }).success).toBe(false);
  });
});

describe("stock + settings schemas", () => {
  it("movimento exige inventoryId e quantidade positiva", () => {
    expect(
      createStockMovementSchema.safeParse({ inventoryId: 1, type: "ENTRADA", quantity: 5, reason: "" }).success
    ).toBe(true);
    expect(
      createStockMovementSchema.safeParse({ inventoryId: 1, type: "NOPE", quantity: 5 }).success
    ).toBe(false);
  });

  it("settings rejeita maxDiscount fora de 0–100", () => {
    expect(updateTenantSettingsSchema.safeParse({ maxDiscount: 10 }).success).toBe(true);
    expect(updateTenantSettingsSchema.safeParse({ maxDiscount: 101 }).success).toBe(false);
  });
});

describe("money helpers", () => {
  it("reaisToCents e formatCurrency", () => {
    expect(reaisToCents(12.99)).toBe(1299);
    expect(formatCurrency(1299)).toContain("12,99");
  });
});

describe("ValidationError", () => {
  it("carrega type e field", () => {
    const e = new ValidationError(ValidationErrorType.DUPLICATE_SKU, "msg", "sku");
    expect(e.type).toBe("DUPLICATE_SKU");
    expect(e.field).toBe("sku");
    expect(e).toBeInstanceOf(Error);
  });
});
