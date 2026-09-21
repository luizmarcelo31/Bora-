import { describe, expect, it, vi, beforeEach } from "vitest";
import { CategoryService } from "./index";
import { prisma } from "@/lib/db";
import { ValidationError, ValidationErrorType } from "@/lib/validators";

vi.mock("@/lib/db", () => ({
  prisma: {
    category: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    tenant: {
      findUnique: vi.fn(),
    },
    product: {
      count: vi.fn(),
    },
    financialMovement: {
      count: vi.fn(),
    },
  },
}));

const mockPrisma = vi.mocked(prisma);

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
      mockPrisma.category.findMany.mockResolvedValue(mockCategories);

      const result = await CategoryService.listCategories(tenantId);

      expect(result).toEqual(mockCategories);
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        where: { tenantId },
        orderBy: [{ kind: "asc" }, { name: "asc" }],
      });
    });

    it("filtra por kind quando fornecido", async () => {
      mockPrisma.category.findMany.mockResolvedValue([]);

      await CategoryService.listCategories(tenantId, "PRODUCT");

      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        where: { tenantId, kind: "PRODUCT" },
        orderBy: [{ kind: "asc" }, { name: "asc" }],
      });
    });
  });

  describe("getCategory", () => {
    it("retorna categoria existente", async () => {
      const mockCategory = { id: 1, tenantId, name: "Bebidas", kind: "PRODUCT", active: true };
      mockPrisma.category.findFirst.mockResolvedValue(mockCategory);

      const result = await CategoryService.getCategory(tenantId, 1);

      expect(result).toEqual(mockCategory);
    });

    it("lanca erro quando nao encontra", async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null);

      await expect(CategoryService.getCategory(tenantId, 999)).rejects.toThrow(ValidationError);
    });
  });

  describe("createCategory", () => {
    it("cria categoria quando nome nao existe", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({ id: tenantId } as any);
      mockPrisma.category.findFirst.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue({
        id: 1,
        tenantId,
        name: "Bebidas",
        kind: "PRODUCT",
        active: true,
      });

      const result = await CategoryService.createCategory(tenantId, "Bebidas", "PRODUCT");

      expect(result.name).toBe("Bebidas");
      expect(mockPrisma.category.create).toHaveBeenCalled();
    });

    it("lanca erro quando nome ja existe", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({ id: tenantId } as any);
      mockPrisma.category.findFirst.mockResolvedValue({
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
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      await expect(
        CategoryService.createCategory(tenantId, "Bebidas", "PRODUCT")
      ).rejects.toThrow("Tenant nao encontrado");
    });
  });

  describe("updateCategory", () => {
    it("atualiza nome quando nao conflita", async () => {
      mockPrisma.category.findFirst
        .mockResolvedValueOnce({ id: 1, tenantId, name: "Bebidas", kind: "PRODUCT" })
        .mockResolvedValueOnce(null);
      mockPrisma.category.update.mockResolvedValue({
        id: 1,
        tenantId,
        name: "Bebidas Frias",
        kind: "PRODUCT",
      });

      const result = await CategoryService.updateCategory(tenantId, 1, "Bebidas Frias");

      expect(result.name).toBe("Bebidas Frias");
    });

    it("lanca erro quando novo nome ja existe", async () => {
      mockPrisma.category.findFirst
        .mockResolvedValueOnce({ id: 1, tenantId, name: "Bebidas", kind: "PRODUCT" })
        .mockResolvedValueOnce({ id: 2, tenantId, name: "Bebidas Frias", kind: "PRODUCT" });

      await expect(
        CategoryService.updateCategory(tenantId, 1, "Bebidas Frias")
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("toggleCategory", () => {
    it("inverte status active", async () => {
      mockPrisma.category.findFirst.mockResolvedValue({
        id: 1,
        tenantId,
        name: "Bebidas",
        kind: "PRODUCT",
        active: true,
      });
      mockPrisma.category.update.mockResolvedValue({
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
      mockPrisma.category.findFirst.mockResolvedValue({
        id: 1,
        tenantId,
        name: "Bebidas",
        kind: "PRODUCT",
      });
      mockPrisma.product.count.mockResolvedValue(0);
      mockPrisma.financialMovement.count.mockResolvedValue(0);
      mockPrisma.category.delete.mockResolvedValue({} as any);

      await CategoryService.deleteCategory(tenantId, 1);

      expect(mockPrisma.category.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("soft-deleta categoria com dependencias", async () => {
      mockPrisma.category.findFirst.mockResolvedValue({
        id: 1,
        tenantId,
        name: "Bebidas",
        kind: "PRODUCT",
      });
      mockPrisma.product.count.mockResolvedValue(5);
      mockPrisma.financialMovement.count.mockResolvedValue(0);
      mockPrisma.category.update.mockResolvedValue({} as any);

      await CategoryService.deleteCategory(tenantId, 1);

      expect(mockPrisma.category.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { active: false },
      });
    });
  });
});
