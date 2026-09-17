// src/services/index.ts
// Centralized services with business rules

import { prisma } from '@/lib/db';
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

// ============================================================
// PRODUCT SERVICE
// ============================================================

export class ProductService {
  /**
   * Listar produtos do tenant
   */
  static async listProducts(tenantId: number, filters?: {
    active?: boolean;
    category?: string;
  }) {
    return prisma.product.findMany({
      where: {
        tenantId,
        active: filters?.active !== undefined ? filters.active : true,
        category: filters?.category,
      },
      include: {
        inventory: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Obter produto por ID com validação de tenant
   */
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
        'Produto não encontrado'
      );
    }

    return product;
  }

  /**
   * Criar novo produto
   * Validações:
   * - SKU único por tenant
   * - Código de barras único por tenant
   * - Preço válido
   * - Criar estoque automaticamente
   */
  static async createProduct(
    tenantId: number,
    data: CreateProductInput
  ) {
    // 1. Validar tenant existe
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) throw new Error('Tenant não encontrado');

    // 2. Validar SKU duplicado
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
          `SKU ${data.sku} já existe`,
          'sku'
        );
      }
    }

    // 3. Validar código de barras duplicado
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
          `Código de barras ${data.barcode} já existe`,
          'barcode'
        );
      }
    }

    // 4. Calcular margem se tiver custo
    let margin: number | undefined;
    if (data.cost) {
      margin = calculateMargin(data.cost, data.price);
    }

    // 5. Criar produto e estoque na mesma transação
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

      // Criar registro de estoque
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

  /**
   * Atualizar produto
   */
  static async updateProduct(
    tenantId: number,
    productId: number,
    data: Partial<CreateProductInput>
  ) {
    // Verificar ownership
    const product = await this.getProduct(tenantId, productId);

    // Se está mudando SKU, validar duplicação
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
          `SKU ${data.sku} já existe`,
          'sku'
        );
      }
    }

    // Se está mudando barcode, validar duplicação
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
          `Código de barras ${data.barcode} já existe`,
          'barcode'
        );
      }
    }

    // Calcular margem se tiver custo
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

  /**
   * Ativar/desativar produto
   */
  static async toggleProduct(tenantId: number, productId: number) {
    const product = await this.getProduct(tenantId, productId);

    return prisma.product.update({
      where: { id: productId },
      data: {
        active: !product.active,
      },
    });
  }

  /**
   * Deletar produto (soft delete)
   */
  static async deleteProduct(tenantId: number, productId: number) {
    const product = await this.getProduct(tenantId, productId);

    // Deletar soft delete (apenas desativar)
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
  /**
   * Obter estoque de um produto
   */
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
        'Estoque não encontrado'
      );
    }

    return inventory;
  }

  /**
   * Registrar movimento de estoque
   * Validações:
   * - Produto e tenant válidos
   * - Quantidade válida
   * - Não permitir negativo se configurado
   */
  static async registerMovement(
    tenantId: number,
    data: CreateStockMovementInput
  ) {
    // 1. Validar inventário existe
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
        'Inventário não encontrado'
      );
    }

    // 2. Obter settings do tenant
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
    });

    // 3. Calcular nova quantidade
    const currentQuantity = inventory.quantity;
    let newQuantity: number;

    if (['ENTRADA', 'DEVOLUCAO'].includes(data.type)) {
      newQuantity = currentQuantity + data.quantity;
    } else if (['SAIDA', 'VENDA', 'AJUSTE'].includes(data.type)) {
      newQuantity = currentQuantity - data.quantity;
    } else {
      newQuantity = currentQuantity;
    }

    // 4. Validar estoque negativo se não permitido
    if (newQuantity < 0 && !settings?.allowNegativeStock) {
      throw new ValidationError(
        ValidationErrorType.INSUFFICIENT_STOCK,
        `Estoque insuficiente. Disponível: ${currentQuantity}`,
        'quantity'
      );
    }

    // 5. Registrar movimento e atualizar quantidade
    const movement = await prisma.$transaction(async (tx) => {
      // Registrar movimento
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

      // Atualizar quantidade do estoque
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

  /**
   * Obter histórico de movimentações
   */
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
  /**
   * Criar venda
   * Validações complexas:
   * - Todos os itens existem e pertencem ao tenant
   * - Estoque disponível (se controle ativado)
   * - Valores válidos
   * - Transação completa (venda + estoque + caixa)
   */
  static async createSale(tenantId: number, data: CreateSaleInput) {
    // 1. Validar tenant e caixa
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) throw new Error('Tenant não encontrado');

    let cashBox = null;
    if (data.cashBoxId) {
      cashBox = await prisma.cashBox.findFirst({
        where: {
          id: data.cashBoxId,
          tenantId,
        },
      });
      if (!cashBox) throw new Error('Caixa não encontrada');
      if (cashBox.status === 'CLOSED') {
        throw new ValidationError(
          ValidationErrorType.CLOSED_CASHBOX,
          'Caixa está fechada'
        );
      }
    }

    // 2. Validar usuário
    const user = await prisma.user.findFirst({
      where: {
        id: data.userId,
        tenantId,
      },
    });
    if (!user) throw new Error('Usuário não encontrado');

    // 3. Validar e processar itens
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
    });

    const processedItems = [];
    let subtotal = 0;

    for (const item of data.items) {
      const product = await prisma.product.findFirst({
        where: {
          id: item.productId,
          tenantId,
        },
        include: { inventory: true },
      });

      if (!product) {
        throw new ValidationError(
          ValidationErrorType.INVALID_SKU,
          `Produto ID ${item.productId} não encontrado`
        );
      }

      // Verificar estoque se controle ativado
      if (settings?.enableStockControl && product.inventory) {
        if (
          product.inventory.quantity < item.quantity &&
          !settings?.allowNegativeStock
        ) {
          throw new ValidationError(
            ValidationErrorType.INSUFFICIENT_STOCK,
            `Estoque insuficiente para ${product.name}. Disponível: ${product.inventory.quantity}`
          );
        }
      }

      const itemTotal = item.quantity * item.unitPrice - item.discount;
      subtotal += itemTotal;

      processedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        total: itemTotal,
      });
    }

    // 4. Validar desconto
    if (data.discount > subtotal) {
      throw new ValidationError(
        ValidationErrorType.INVALID_DISCOUNT,
        'Desconto não pode ser maior que o subtotal'
      );
    }

    if (settings?.enableDiscount && settings?.maxDiscount) {
      const discountPercent = (data.discount / subtotal) * 100;
      if (discountPercent > settings.maxDiscount) {
        throw new ValidationError(
          ValidationErrorType.INVALID_DISCOUNT,
          `Desconto máximo permitido é ${settings.maxDiscount}%`
        );
      }
    }

    // 5. Calcular total
    const total = subtotal - data.discount;

    // 6. Criar venda com transação
    const sale = await prisma.$transaction(async (tx) => {
      // Criar venda
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
          items: {
            create: processedItems.map((item) => ({
              tenantId,
              ...item,
            })),
          },
        },
        include: { items: true },
      });

      // Atualizar estoque para cada item
      for (const item of processedItems) {
        const inventory = await tx.inventory.findFirst({
          where: {
            tenantId,
            productId: item.productId,
          },
        });

        if (inventory) {
          // Registrar movimento de saída
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

          // Atualizar quantidade
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

      // Se tem caixa, atualizar saldo
      if (cashBox) {
        await tx.cashBox.update({
          where: { id: data.cashBoxId! },
          data: {
            currentBalance: cashBox.currentBalance + total,
          },
        });
      }

      return s;
    });

    return sale;
  }

  /**
   * Cancelar venda (reverter estoque e caixa)
   */
  static async cancelSale(tenantId: number, saleId: number) {
    // 1. Obter venda
    const sale = await prisma.sale.findFirst({
      where: {
        id: saleId,
        tenantId,
      },
      include: { items: true },
    });

    if (!sale) throw new Error('Venda não encontrada');
    if (sale.status !== 'COMPLETED') {
      throw new Error('Apenas vendas completadas podem ser canceladas');
    }

    // 2. Cancelar em transação
    await prisma.$transaction(async (tx) => {
      // Marcar venda como cancelada
      await tx.sale.update({
        where: { id: saleId },
        data: { status: 'CANCELLED' },
      });

      // Reverter estoque para cada item
      for (const item of sale.items) {
        const inventory = await tx.inventory.findFirst({
          where: {
            tenantId,
            productId: item.productId,
          },
        });

        if (inventory) {
          // Registrar movimento de devolução
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

          // Reverter quantidade
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

      // Se tem caixa, reverter saldo
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

  /**
   * Listar vendas do dia
   */
  static async getTodaysSales(tenantId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return prisma.sale.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        status: 'COMPLETED',
      },
      include: {
        items: {
          include: { product: true },
        },
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Obter resumo de vendas
   */
  static async getSalesResume(tenantId: number, startDate: Date, endDate: Date) {
    const sales = await prisma.sale.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'COMPLETED',
      },
    });

    const totalSales = sales.length;
    const totalReceived = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalDiscount = sales.reduce((sum, sale) => sum + sale.discount, 0);
    const paymentMethods = sales.reduce(
      (acc, sale) => {
        acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

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
  /**
   * Abrir caixa
   */
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

  /**
   * Fechar caixa
   */
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

    if (!cashBox) throw new Error('Caixa não encontrada');
    if (cashBox.status === 'CLOSED') throw new Error('Caixa já está fechada');

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
  /**
   * Registrar movimentação financeira
   */
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

  /**
   * Obter resumo financeiro
   */
  static async getFinancialResume(
    tenantId: number,
    startDate: Date,
    endDate: Date
  ) {
    const movements = await prisma.financialMovement.findMany({
      where: {
        tenantId,
        movementDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const receitas = movements
      .filter((m) => m.type === 'RECEITA')
      .reduce((sum, m) => sum + m.amount, 0);

    const despesas = movements
      .filter((m) => m.type === 'DESPESA')
      .reduce((sum, m) => sum + m.amount, 0);

    const transferencias = movements
      .filter((m) => m.type === 'TRANSFERENCIA')
      .reduce((sum, m) => sum + m.amount, 0);

    return {
      period: { startDate, endDate },
      receitas,
      despesas,
      saldo: receitas - despesas,
      totalMovimentos: movements.length,
      movementsByCategory: movements.reduce(
        (acc, m) => {
          if (!acc[m.category]) acc[m.category] = { receita: 0, despesa: 0 };
          if (m.type === 'RECEITA') acc[m.category].receita += m.amount;
          else if (m.type === 'DESPESA') acc[m.category].despesa += m.amount;
          return acc;
        },
        {} as Record<string, { receita: number; despesa: number }>
      ),
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
