import { prisma } from '@/lib/db';
import { paymentLabel } from '@/lib/payments';
import { Prisma, Sale, SaleStatus, StockMovement } from '@prisma/client';
import {
  CreateProductInput,
  CreateSaleInput,
  CreateStockMovementInput,
  CreateFinancialMovementInput,
  ValidationError,
  ValidationErrorType,
  calculateMargin,
  centsToReais,
} from '@/lib/validators';

// Defaults iguais aos da tela de Configurações quando ainda não há linha salva.
async function getSettingsWithDefaults(tenantId: number) {
  return (
    (await prisma.tenantSettings.findUnique({ where: { tenantId } })) ?? {
      enableDiscount: true,
      maxDiscount: null as number | null,
      enableStockControl: true,
      allowNegativeStock: false,
    }
  );
}

// ============================================================
// PRODUCT SERVICE
// ============================================================

export class ProductService {
  static async listProducts(tenantId: number, filters?: {
    active?: boolean | "all";
    category?: string;
  }) {
    return prisma.product.findMany({
      where: {
        tenantId,
        active: filters?.active === "all" ? undefined : (filters?.active ?? true),
        category: filters?.category,
      },
      include: {
        inventory: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  static async getProduct(tenantId: number, productId: number) {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        tenantId,
      },
      include: {
        inventory: true,
      },
    });

    if (!product) {
      throw new ValidationError(
        ValidationErrorType.INVALID_SKU,
        'Produto nao encontrado'
      );
    }

    return product;
  }

  static async createProduct(
    tenantId: number,
    data: CreateProductInput
  ) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) throw new Error('Tenant nao encontrado');

    if (data.sku) {
      const existing = await prisma.product.findFirst({
        where: {
          tenantId,
          sku: data.sku,
        },
      });
      if (existing) {
        throw new ValidationError(
          ValidationErrorType.DUPLICATE_SKU,
          `SKU ${data.sku} ja existe`,
          'sku'
        );
      }
    }

    if (data.barcode) {
      const existing = await prisma.product.findFirst({
        where: {
          tenantId,
          barcode: data.barcode,
        },
      });
      if (existing) {
        throw new ValidationError(
          ValidationErrorType.DUPLICATE_BARCODE,
          `Codigo de barras ${data.barcode} ja existe`,
          'barcode'
        );
      }
    }

    let margin: number | undefined;
    if (data.cost) {
      margin = calculateMargin(data.cost, data.price);
    }

    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          tenantId,
          name: data.name,
          sku: data.sku || null,
          barcode: data.barcode || null,
          description: data.description || null,
          price: data.price,
          cost: data.cost || null,
          margin,
          category: data.category || null,
          imageUrl: data.imageUrl || null,
        },
      });

      await tx.inventory.create({
        data: {
          tenantId,
          productId: p.id,
          quantity: 0,
          minimumStock: 0,
        },
      });

      return p;
    });

    return product;
  }

  static async updateProduct(
    tenantId: number,
    productId: number,
    data: Partial<CreateProductInput>
  ) {
    const product = await this.getProduct(tenantId, productId);

    if (data.sku && data.sku !== product.sku) {
      const existing = await prisma.product.findFirst({
        where: {
          tenantId,
          sku: data.sku,
        },
      });
      if (existing) {
        throw new ValidationError(
          ValidationErrorType.DUPLICATE_SKU,
          `SKU ${data.sku} ja existe`,
          'sku'
        );
      }
    }

    if (data.barcode && data.barcode !== product.barcode) {
      const existing = await prisma.product.findFirst({
        where: {
          tenantId,
          barcode: data.barcode,
        },
      });
      if (existing) {
        throw new ValidationError(
          ValidationErrorType.DUPLICATE_BARCODE,
          `Codigo de barras ${data.barcode} ja existe`,
          'barcode'
        );
      }
    }

    let margin: number | undefined;
    if (data.cost || data.price) {
      const cost = data.cost || product.cost;
      const price = data.price || product.price;
      if (cost && price) {
        margin = calculateMargin(cost, price);
      }
    }

    return prisma.product.update({
      where: { id: productId },
      data: {
        ...data,
        sku: data.sku || null,
        barcode: data.barcode || null,
        description: data.description || null,
        category: data.category || null,
        imageUrl: data.imageUrl || null,
        margin,
      },
      include: {
        inventory: true,
      },
    });
  }

  static async toggleProduct(tenantId: number, productId: number) {
    const product = await this.getProduct(tenantId, productId);

    return prisma.product.update({
      where: { id: productId },
      data: {
        active: !product.active,
      },
    });
  }

  static async deleteProduct(tenantId: number, productId: number) {
    const product = await this.getProduct(tenantId, productId);

    return prisma.product.update({
      where: { id: productId },
      data: { active: false },
    });
  }
}

// ============================================================
// INVENTORY SERVICE
// ============================================================

export class InventoryService {
  static async getInventory(tenantId: number, productId: number) {
    const inventory = await prisma.inventory.findFirst({
      where: {
        tenantId,
        productId,
      },
      include: {
        product: true,
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!inventory) {
      throw new ValidationError(
        ValidationErrorType.INVALID_SKU,
        'Estoque nao encontrado'
      );
    }

    return inventory;
  }

  static async registerMovement(
    tenantId: number,
    data: CreateStockMovementInput
  ) {
    const inventory = await prisma.inventory.findFirst({
      where: {
        id: data.inventoryId,
        tenantId,
      },
      include: { product: true },
    });

    if (!inventory) {
      throw new ValidationError(
        ValidationErrorType.INVALID_SKU,
        'Inventario nao encontrado'
      );
    }

    const settings = await getSettingsWithDefaults(tenantId);

    const currentQuantity = inventory.quantity;
    let newQuantity: number;

    if (['ENTRADA', 'DEVOLUCAO'].includes(data.type)) {
      newQuantity = currentQuantity + data.quantity;
    } else if (['SAIDA', 'VENDA', 'AJUSTE'].includes(data.type)) {
      newQuantity = currentQuantity - data.quantity;
    } else {
      newQuantity = currentQuantity;
    }

    if (newQuantity < 0 && !settings?.allowNegativeStock) {
      throw new ValidationError(
        ValidationErrorType.INSUFFICIENT_STOCK,
        `Estoque insuficiente. Disponivel: ${currentQuantity}`,
        'quantity'
      );
    }

    const movement = await prisma.$transaction(async (tx) => {
      const m = await tx.stockMovement.create({
        data: {
          tenantId,
          inventoryId: data.inventoryId,
          type: data.type,
          quantity: data.quantity,
          reason: data.reason || null,
          referenceId: data.referenceId || null,
          referenceType: data.referenceType || null,
        },
      });

      await tx.inventory.update({
        where: { id: data.inventoryId },
        data: {
          quantity: newQuantity,
          updatedAt: new Date(),
        },
      });

      return m;
    });

    return movement;
  }

  static async getMovementHistory(
    tenantId: number,
    inventoryId: number,
    limit: number = 50
  ) {
    return prisma.stockMovement.findMany({
      where: {
        tenantId,
        inventoryId,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

// ============================================================
// SALE SERVICE (PDV)
// ============================================================

export class SaleService {
  static async createSale(tenantId: number, data: CreateSaleInput) {
    // Independentes em paralelo (eram 4 round-trips sequenciais).
    const [tenant, cashBox, user, settings] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: tenantId } }),
      data.cashBoxId
        ? prisma.cashBox.findFirst({ where: { id: data.cashBoxId, tenantId } })
        : Promise.resolve(null),
      prisma.user.findFirst({ where: { id: data.userId, tenantId } }),
      getSettingsWithDefaults(tenantId),
    ]);
    if (!tenant) throw new Error('Tenant nao encontrado');

    if (data.cashBoxId) {
      if (!cashBox) throw new Error('Caixa nao encontrada');
      if (cashBox.status === 'CLOSED') {
        throw new ValidationError(
          ValidationErrorType.CLOSED_CASHBOX,
          'Caixa esta fechada'
        );
      }
    }

    if (!user) throw new Error('Usuario nao encontrado');

    // 1 query batch com estoque (era N findFirst no loop).
    const ids = [...new Set(data.items.map((i) => i.productId))];
    const dbProducts = await prisma.product.findMany({
      where: { tenantId, id: { in: ids } },
      include: { inventory: true },
    });
    const byId = new Map(dbProducts.map((p) => [p.id, p]));

    const processedItems: {
      productId: number;
      quantity: number;
      unitPrice: number;
      discount: number;
      total: number;
    }[] = [];
    let subtotal = 0;

    for (const item of data.items) {
      const product = byId.get(item.productId);

      if (!product) {
        throw new ValidationError(
          ValidationErrorType.INVALID_SKU,
          `Produto ID ${item.productId} nao encontrado`
        );
      }

      if (settings?.enableStockControl && product.inventory) {
        if (
          product.inventory.quantity < item.quantity &&
          !settings?.allowNegativeStock
        ) {
          throw new ValidationError(
            ValidationErrorType.INSUFFICIENT_STOCK,
            `Estoque insuficiente para ${product.name}. Disponivel: ${product.inventory.quantity}`
          );
        }
      }

      // Preço autoritativo do banco (ignora o que veio no input).
      const unitPrice = product.price;
      const itemTotal = item.quantity * unitPrice - item.discount;
      subtotal += itemTotal;

      processedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        discount: item.discount,
        total: itemTotal,
      });
    }

    if (data.discount > subtotal) {
      throw new ValidationError(
        ValidationErrorType.INVALID_DISCOUNT,
        'Desconto nao pode ser maior que o subtotal'
      );
    }

    if (settings?.enableDiscount && settings?.maxDiscount) {
      const discountPercent = (data.discount / subtotal) * 100;
      if (discountPercent > settings.maxDiscount) {
        throw new ValidationError(
          ValidationErrorType.INVALID_DISCOUNT,
          `Desconto maximo permitido e ${settings.maxDiscount}%`
        );
      }
    }

    const total = subtotal - data.discount;

    // Idempotência: se já existe venda com mesma chave para este tenant, retorna existente (evita duplicação por F5/duplo clique)
    if (data.idempotencyKey) {
      const existing = await prisma.sale.findFirst({
        where: { tenantId, idempotencyKey: data.idempotencyKey },
        include: { items: true },
      });
      if (existing) return existing;
    }

    let sale: Sale & { items: import("@prisma/client").SaleItem[] };
    try {
      sale = await prisma.$transaction(async (tx) => {
        const s = await tx.sale.create({
          data: {
            tenantId,
            userId: data.userId,
            cashBoxId: data.cashBoxId || null,
            status: 'COMPLETED' as SaleStatus,
            subtotal,
            discount: data.discount,
            total,
            paymentMethod: data.paymentMethod,
            customerName: data.customerName || null,
            customerPhone: data.customerPhone || null,
            idempotencyKey: data.idempotencyKey || null,
            items: {
              create: processedItems.map((item) => ({
                tenantId,
                ...item,
              })),
            },
          },
          include: { items: true },
        });

        for (const item of processedItems) {
          const inventory = await tx.inventory.findFirst({
            where: {
              tenantId,
              productId: item.productId,
            },
          });

          if (inventory) {
            await tx.stockMovement.create({
              data: {
                tenantId,
                inventoryId: inventory.id,
                type: 'VENDA',
                quantity: item.quantity,
                referenceId: s.id,
                referenceType: 'SALE',
              },
            });

            await tx.inventory.update({
              where: { id: inventory.id },
              data: {
                quantity: {
                  decrement: item.quantity,
                },
              },
            });
          }
        }

        if (data.cashBoxId) {
          await tx.cashBox.update({
            where: { id: data.cashBoxId },
            data: {
              currentBalance: { increment: total },
            },
          });
        }

        // Financeiro atômico com a venda: RECEITA automaticamente (idempotente via venda)
        await tx.financialMovement.create({
          data: {
            tenantId,
            type: "RECEITA",
            category: "Vendas PDV",
            description: `Venda #${s.id} — ${paymentLabel(s.paymentMethod)}`,
            amount: s.total,
            movementDate: s.createdAt,
            cashBoxId: s.cashBoxId ?? null,
          },
        });

        return s;
      });
    } catch (e) {
      // Corrida: outra requisição criou com mesma idempotencyKey entre o findFirst inicial e o create
      if (data.idempotencyKey && e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        const existing = await prisma.sale.findFirst({
          where: { tenantId, idempotencyKey: data.idempotencyKey },
          include: { items: true },
        });
        if (existing) return existing;
      }
      throw e;
    }

    return sale;
  }

  static async cancelSale(tenantId: number, saleId: number) {
    const sale = await prisma.sale.findFirst({
      where: {
        id: saleId,
        tenantId,
      },
      include: { items: true },
    });

    if (!sale) throw new Error('Venda nao encontrada');
    if (sale.status !== 'COMPLETED') {
      throw new Error('Apenas vendas completadas podem ser canceladas');
    }

    await prisma.$transaction(async (tx) => {
      await tx.sale.update({
        where: { id: saleId },
        data: { status: 'CANCELLED' },
      });

      for (const item of sale.items) {
        const inventory = await tx.inventory.findFirst({
          where: {
            tenantId,
            productId: item.productId,
          },
        });

        if (inventory) {
          await tx.stockMovement.create({
            data: {
              tenantId,
              inventoryId: inventory.id,
              type: 'DEVOLUCAO',
              quantity: item.quantity,
              referenceId: sale.id,
              referenceType: 'SALE_CANCELLATION',
            },
          });

          await tx.inventory.update({
            where: { id: inventory.id },
            data: {
              quantity: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      if (sale.cashBoxId) {
        await tx.cashBox.update({
          where: { id: sale.cashBoxId },
          data: {
            currentBalance: {
              decrement: sale.total,
            },
          },
        });
      }
    });

    return { success: true, message: 'Venda cancelada com sucesso' };
  }

  static async getTodaysSales(tenantId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Select enxuto: as tabelas usam id/data/itens/pagamento/total (antes: product + user inteiros).
    return prisma.sale.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        status: 'COMPLETED',
      },
      select: {
        id: true,
        createdAt: true,
        paymentMethod: true,
        total: true,
        items: { select: { quantity: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getSalesResume(tenantId: number, startDate: Date, endDate: Date) {
    // Agregação no SQL (antes: findMany de tudo + reduce em JS).
    const where = {
      tenantId,
      createdAt: { gte: startDate, lte: endDate },
      status: 'COMPLETED' as const,
    };
    const [agg, byPayment] = await Promise.all([
      prisma.sale.aggregate({
        where,
        _count: true,
        _sum: { total: true, discount: true },
      }),
      prisma.sale.groupBy({ by: ['paymentMethod'], where, _count: true }),
    ]);

    const totalSales = agg._count;
    const totalReceived = agg._sum.total ?? 0;
    const totalDiscount = agg._sum.discount ?? 0;
    const paymentMethods: Record<string, number> = {};
    for (const g of byPayment) paymentMethods[g.paymentMethod] = g._count;

    return {
      period: { startDate, endDate },
      totalSales,
      totalReceived,
      totalDiscount,
      averageSale: totalSales > 0 ? totalReceived / totalSales : 0,
      paymentMethods,
    };
  }
}

// ============================================================
// CASHBOX SERVICE
// ============================================================

export class CashBoxService {
  static async openCashBox(
    tenantId: number,
    name: string,
    openingBalance: number
  ) {
    return prisma.cashBox.create({
      data: {
        tenantId,
        name,
        status: 'OPEN',
        openingBalance,
        currentBalance: openingBalance,
      },
    });
  }

  static async closeCashBox(
    tenantId: number,
    cashBoxId: number,
    closingBalance: number
  ) {
    const cashBox = await prisma.cashBox.findFirst({
      where: {
        id: cashBoxId,
        tenantId,
      },
    });

    if (!cashBox) throw new Error('Caixa nao encontrada');
    if (cashBox.status === 'CLOSED') throw new Error('Caixa ja esta fechada');

    const difference = closingBalance - cashBox.currentBalance;

    return prisma.cashBox.update({
      where: { id: cashBoxId },
      data: {
        status: 'CLOSED',
        closingBalance,
        closedAt: new Date(),
      },
    });
  }
}

// ============================================================
// FINANCIAL SERVICE
// ============================================================

export class FinancialService {
  static async registerMovement(
    tenantId: number,
    data: CreateFinancialMovementInput
  ) {
    return prisma.financialMovement.create({
      data: {
        tenantId,
        type: data.type,
        category: data.category,
        description: data.description,
        amount: data.amount,
        movementDate: data.movementDate,
        cashBoxId: data.cashBoxId || null,
      },
    });
  }

  static async getFinancialResume(
    tenantId: number,
    startDate: Date,
    endDate: Date
  ) {
    // Agregação no SQL (antes: findMany de tudo + reduce em JS).
    const where = {
      tenantId,
      movementDate: { gte: startDate, lte: endDate },
    };
    const [byType, byCategory] = await Promise.all([
      prisma.financialMovement.groupBy({
        by: ['type'],
        where,
        _sum: { amount: true },
        _count: true,
      }),
      prisma.financialMovement.groupBy({
        by: ['category', 'type'],
        where,
        _sum: { amount: true },
      }),
    ]);

    const sumOf = (t: string) =>
      byType.find((g) => g.type === t)?._sum.amount ?? 0;
    const receitas = sumOf('RECEITA');
    const despesas = sumOf('DESPESA');
    const totalMovimentos = byType.reduce((s, g) => s + g._count, 0);

    const movementsByCategory: Record<string, { receita: number; despesa: number }> = {};
    for (const g of byCategory) {
      movementsByCategory[g.category] ??= { receita: 0, despesa: 0 };
      if (g.type === 'RECEITA') movementsByCategory[g.category].receita += g._sum.amount ?? 0;
      else if (g.type === 'DESPESA') movementsByCategory[g.category].despesa += g._sum.amount ?? 0;
    }

    return {
      period: { startDate, endDate },
      receitas,
      despesas,
      saldo: receitas - despesas,
      totalMovimentos,
      movementsByCategory,
    };
  }
}

// ============================================================
// EXPORT
// ============================================================

export const services = {
  product: ProductService,
  inventory: InventoryService,
  sale: SaleService,
  cashBox: CashBoxService,
  financial: FinancialService,
};
