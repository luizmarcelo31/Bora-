import { describe, expect, it, vi, beforeEach } from "vitest";
import { CategoryService } from "./index";
import { ValidationError, ValidationErrorType } from "@/lib/validators";

const mockCategoryFindMany = vi.fn();
const mockCategoryFindFirst = vi.fn();
const mockCategoryCreate = vi.fn();
const mockCategoryUpdate = vi.fn();
const mockCategoryDelete = vi.fn();
const mockTenantFindUnique = vi.fn();
const mockProductCount = vi.fn();
const mockFinancialMovementCount = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    category: {
      findMany: mockCategoryFindMany,
      findFirst: mockCategoryFindFirst,
      create: mockCategoryCreate,
      update: mockCategoryUpdate,
      delete: mockCategoryDelete,
    },
    tenant: {
      findUnique: mockTenantFindUnique,
    },
    product: {
      count: mockProductCount,
    },
    financialMovement: {
      count: mockFinancialMovementCount,
    },
  },
}));

describe("CategoryService", () => {
  const tenantId = 1;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listCategories", () => {
    it("retorna categorias do tenant", async () => {
      const mockCategories = [
        { id: 1, tenantId, name: "Bebidas", kind: "PRODUCT", active: true },
        { id: 2, tenantId, name: "Aluguel", kind: "FINANCIAL", active: true },
      ];
      mockCategoryFindMany.mockResolvedValue(mockCategories);

      const result = await CategoryService.listCategories(tenantId);

      expect(result).toEqual(mockCategories);
      expect(mockCategoryFindMany).toHaveBeenCalledWith({
        where: { tenantId },
        orderBy: [{ kind: "asc" }, { name: "asc" }],
      });
    });

    it("filtra por kind quando fornecido", async () => {
      mockCategoryFindMany.mockResolvedValue([]);

      await CategoryService.listCategories(tenantId, "PRODUCT");

      expect(mockCategoryFindMany).toHaveBeenCalledWith({
        where: { tenantId, kind: "PRODUCT" },
        orderBy: [{ kind: "asc" }, { name: "asc" }],
      });
    });
  });

  describe("getCategory", () => {
    it("retorna categoria existente", async () => {
      const mockCategory = { id: 1, tenantId, name: "Bebidas", kind: "PRODUCT", active: true };
      mockCategoryFindFirst.mockResolvedValue(mockCategory);

      const result = await CategoryService.getCategory(tenantId, 1);

      expect(result).toEqual(mockCategory);
    });

    it("lanca erro quando nao encontra", async () => {
      mockCategoryFindFirst.mockResolvedValue(null);

      await expect(CategoryService.getCategory(tenantId, 999)).rejects.toThrow(ValidationError);
    });
  });

  describe("createCategory", () => {
    it("cria categoria quando nome nao existe", async () => {
      mockTenantFindUnique.mockResolvedValue({ id: tenantId });
      mockCategoryFindFirst.mockResolvedValue(null);
      mockCategoryCreate.mockResolvedValue({
        id: 1,
        tenantId,
        name: "Bebidas",
        kind: "PRODUCT",
        active: true,
      });

      const result = await CategoryService.createCategory(tenantId, "Bebidas", "PRODUCT");

      expect(result.name).toBe("Bebidas");
      expect(mockCategoryCreate).toHaveBeenCalled();
    });

    it("lanca erro quando nome ja existe", async () => {
      mockTenantFindUnique.mockResolvedValue({ id: tenantId });
      mockCategoryFindFirst.mockResolvedValue({
        id: 1,
        tenantId,
        name: "Bebidas",
        kind: "PRODUCT",
      });

      await expect(
        CategoryService.createCategory(tenantId, "Bebidas", "PRODUCT")
      ).rejects.toThrow(ValidationError);
    });

    it("lanca erro quando tenant nao existe", async () => {
      mockTenantFindUnique.mockResolvedValue(null);

      await expect(
        CategoryService.createCategory(tenantId, "Bebidas", "PRODUCT")
      ).rejects.toThrow("Tenant nao encontrado");
    });
  });

  describe("updateCategory", () => {
    it("atualiza nome quando nao conflita", async () => {
      mockCategoryFindFirst
        .mockResolvedValueOnce({ id: 1, tenantId, name: "Bebidas", kind: "PRODUCT" })
        .mockResolvedValueOnce(null);
      mockCategoryUpdate.mockResolvedValue({
        id: 1,
        tenantId,
        name: "Bebidas Frias",
        kind: "PRODUCT",
      });

      const result = await CategoryService.updateCategory(tenantId, 1, "Bebidas Frias");

      expect(result.name).toBe("Bebidas Frias");
    });

    it("lanca erro quando novo nome ja existe", async () => {
      mockCategoryFindFirst
        .mockResolvedValueOnce({ id: 1, tenantId, name: "Bebidas", kind: "PRODUCT" })
        .mockResolvedValueOnce({ id: 2, tenantId, name: "Bebidas Frias", kind: "PRODUCT" });

      await expect(
        CategoryService.updateCategory(tenantId, 1, "Bebidas Frias")
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("toggleCategory", () => {
    it("inverte status active", async () => {
      mockCategoryFindFirst.mockResolvedValue({
        id: 1,
        tenantId,
        name: "Bebidas",
        kind: "PRODUCT",
        active: true,
      });
      mockCategoryUpdate.mockResolvedValue({
        id: 1,
        tenantId,
        name: "Bebidas",
        kind: "PRODUCT",
        active: false,
      });

      const result = await CategoryService.toggleCategory(tenantId, 1);

      expect(result.active).toBe(false);
    });
  });

  describe("deleteCategory", () => {
    it("deleta categoria sem dependencias", async () => {
      mockCategoryFindFirst.mockResolvedValue({
        id: 1,
        tenantId,
        name: "Bebidas",
        kind: "PRODUCT",
      });
      mockProductCount.mockResolvedValue(0);
      mockFinancialMovementCount.mockResolvedValue(0);
      mockCategoryDelete.mockResolvedValue({});

      await CategoryService.deleteCategory(tenantId, 1);

      expect(mockCategoryDelete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("soft-deleta categoria com dependencias", async () => {
      mockCategoryFindFirst.mockResolvedValue({
        id: 1,
        tenantId,
        name: "Bebidas",
        kind: "PRODUCT",
      });
      mockProductCount.mockResolvedValue(5);
      mockFinancialMovementCount.mockResolvedValue(0);
      mockCategoryUpdate.mockResolvedValue({});

      await CategoryService.deleteCategory(tenantId, 1);

      expect(mockCategoryUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { active: false },
      });
    });
  });
});
