import { prisma } from '@/lib/db';
import { paymentLabel } from '@/lib/payments';
import { marcarAtividade } from '@/lib/atividade';
import { Prisma, Sale, StatusVenda, TipoCategoria } from '@prisma/client';
import {
  CreateProductInput,
  CreateSaleInput,
  CreateStockMovementInput,
  CreateFinancialMovementInput,
  ValidationError,
  ValidationErrorType,
  calculateMargin,
} from '@/lib/validators';

// Defaults iguais aos da tela de Configurações quando ainda não há linha salva.
async function getSettingsWithDefaults(tenantId: number) {
  return (
    (await prisma.tenantSettings.findUnique({ where: { tenantId } })) ?? {
      enableDiscount: true,
      maxDiscount: null as number | null,
      enableStockControl: true,
      allowNegativeStock: false,
      feeCredit: 0,
      feeDebit: 0,
    }
  );
}

/**
 * Divergência de estoque de uma venda offline (ADR-006 §5).
 *
 * Existe porque a política escolhida é "a venda vence o estoque": a venda
 * entra, o saldo pode ficar negativo, e quem corrige o número depois é a
 * contagem de inventário. Isso só é seguro com registro — uma venda que
 * vendeu 5 com 2 disponíveis e passou sem deixar rastro vira estoque fantasma
 * que ninguém sabe explicar.
 */
export interface DivergenciaEstoque {
  productId: number;
  disponivel: number;
  vendido: number;
}

/** Venda + o que divergiu ao ser gravada. Vendas online voltam vazio. */
export type SaleComDivergencias = Sale & {
  items: import("@prisma/client").SaleItem[];
  divergencias: {
    estoque: DivergenciaEstoque[];
    caixa: boolean;
  };
};

/** Divergências vazias — o que uma venda sem conflito (ou online) devolve. */
const SEM_DIVERGENCIAS = { estoque: [] as DivergenciaEstoque[], caixa: false };

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

    // Parcial de verdade: só toca nos campos enviados (antes, omitidos viravam NULL).
    return prisma.product.update({
      where: { id: productId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.sku !== undefined ? { sku: data.sku || null } : {}),
        ...(data.barcode !== undefined ? { barcode: data.barcode || null } : {}),
        ...(data.description !== undefined ? { description: data.description || null } : {}),
        ...(data.price !== undefined ? { price: data.price } : {}),
        ...(data.cost !== undefined ? { cost: data.cost || null } : {}),
        ...(data.category !== undefined ? { category: data.category || null } : {}),
        ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl || null } : {}),
        ...(margin !== undefined ? { margin } : {}),
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
    await this.getProduct(tenantId, productId);

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
  static async createSale(tenantId: number, data: CreateSaleInput): Promise<SaleComDivergencias> {
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
      if (cashBox.status === 'FECHADO') {
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

    // Split dinheiro+pix (PDV Expresso). Omitido = pagamento único.
    const payments = data.payments?.length
      ? data.payments
      : [{ method: data.paymentMethod, amount: total }];
    // Taxa maquineta sobre o TOTAL (não sobre a parcela: evita circularidade).
    // Só quando pagamento único no cartão; split dinheiro+pix não tem taxa.
    // Omitido = legado: taxa registrada como perda real, sem cobrança extra.
    const cardMethod =
      payments.length === 1 && (payments[0].method === 'CREDITO' || payments[0].method === 'DEBITO')
        ? payments[0].method
        : null;
    const feeRate = cardMethod === 'CREDITO' ? (settings?.feeCredit ?? 0) : cardMethod === 'DEBITO' ? (settings?.feeDebit ?? 0) : 0;
    const feeAmount = Math.round((total * feeRate) / 100);
    const customerTotal = total + feeAmount;
    if (data.payments?.length) {
      if (payments.reduce((s, p) => s + p.amount, 0) !== customerTotal) {
        throw new ValidationError(
          ValidationErrorType.INVALID_AMOUNT,
          'Soma dos pagamentos difere do total + taxa'
        );
      }
    }
    // Método primário = maior parcela (relatórios seguem compatíveis).
    const primaryMethod = [...payments].sort((a, b) => b.amount - a.amount)[0].method;

    // Venda offline (Fase 3.1): o dispositivo mandou quando a venda aconteceu.
    // `occurredAt` é a data real — sem ela, uma venda sincronizada 3 horas
    // depois receberia o cupom e o DRE do dia do sync, e o relatório do dia em
    // que o cliente pagou ficaria errado.
    //
    // O preço NÃO vem do dispositivo: permanece o do banco (ADR-006 §6). O
    // troco já foi dado com o preço antigo, e essa diferença aparece como
    // problema de caixa, não como motivo para o servidor aceitar preço do
    // cliente.
    const offline = data.offline === true;
    // `Number.isNaN` antes de aceitar: `new Date("ontem")` é Invalid Date, e o
    // Prisma lancaria na hora de gravar — devolvendo erro genérico para uma
    // venda que o cliente já pagou. Data inválida cai no createdAt do servidor.
    const occurredAtBruto = offline && data.occurredAt ? new Date(data.occurredAt) : null;
    const occurredAt =
      occurredAtBruto && !Number.isNaN(occurredAtBruto.getTime()) ? occurredAtBruto : null;

    // Cupom diário (SP): sequência por tenant+dia com retry em corrida.
    // A data de referência é a da venda, não a de hoje — o countdown tem que
    // olhar para o mesmo dia que vai receber o cupom.
    const couponBase = occurredAt ?? new Date();
    const spDay = new Date(couponBase.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    spDay.setHours(0, 0, 0, 0);
    let couponSeq =
      (await prisma.sale.count({ where: { tenantId, couponDate: spDay } })) + 1;

    // Recebido/troco: servidor calcula o troco; recebido menor que o total é inválido.
    let receivedAmount: number | null = null;
    let changeAmount = 0;
    if (data.receivedAmount !== undefined) {
      if (data.receivedAmount < customerTotal) {
        throw new ValidationError(
          ValidationErrorType.INVALID_AMOUNT,
          'Valor recebido menor que o total'
        );
      }
      receivedAmount = data.receivedAmount;
      changeAmount = data.receivedAmount - customerTotal;
    }

    // Idempotência: se já existe venda com mesma chave para este tenant, retorna existente (evita duplicação por F5/duplo clique)
    if (data.idempotencyKey) {
      const existing = await prisma.sale.findFirst({
        where: { tenantId, idempotencyKey: data.idempotencyKey },
        include: { items: true },
      });
      // Replay: a venda já existe, então nada divergiu agora. Devolve com as
      // listas vazias para que o chamador não precise tratar dois formatos.
      if (existing) return Object.assign(existing, { divergencias: SEM_DIVERGENCIAS });
    }

    let sale: (Sale & { items: import("@prisma/client").SaleItem[] }) | undefined;
    // Divergências acumuladas na última tentativa que criou a venda. Vivem
    // aqui porque a transação não devolve nada além da venda, e a action
    // precisa delas para escrever o log de auditoria.
    let divergenciasEstoque: DivergenciaEstoque[] = [];
    // ADR-006 §7: venda offline cujo caixa fechou no sync entra sem tocar em
    // saldo nenhum. O dinheiro está na gaveta; recusar seria perder venda.
    let divergenciaCaixa = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
      sale = await prisma.$transaction(async (tx) => {
        const s = await tx.sale.create({
          data: {
            tenantId,
            userId: data.userId,
            cashBoxId: data.cashBoxId || null,
            status: 'CONCLUIDA' as StatusVenda,
            subtotal,
            discount: data.discount,
            total,
            paymentMethod: primaryMethod,
            payments: payments as unknown as Prisma.InputJsonValue,
            feeAmount,
            couponSeq,
            couponDate: spDay,
            receivedAmount,
            changeAmount,
            customerName: data.customerName || null,
            customerPhone: data.customerPhone || null,
            idempotencyKey: data.idempotencyKey || null,
            offline,
            occurredAt,
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
            // Revalida dentro da tx: fecha a corrida entre o check pré-tx e o decremento.
            const insuficiente =
              settings?.enableStockControl &&
              inventory.quantity < item.quantity &&
              !settings?.allowNegativeStock;

            // ADR-006 §5: venda offline NÃO é recusada por estoque. O dinheiro
            // foi entregue e a mercadoria saiu da prateleira — recusar aqui é
            // perda direta. O estoque pode ficar negativo e a contagem de
            // inventário corrige o número depois. A divergência é registrada
            // no log de auditoria pela action, que conhece o resultado.
            if (insuficiente && !offline) {
              throw new ValidationError(
                ValidationErrorType.INSUFFICIENT_STOCK,
                `Estoque insuficiente para o produto ID ${item.productId}. Disponivel: ${inventory.quantity}`
              );
            }

            if (insuficiente) {
              divergenciasEstoque.push({
                productId: item.productId,
                disponivel: inventory.quantity,
                vendido: item.quantity,
              });
            }

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

        // ADR-006 §7: caixa fechado não recusa venda offline. O dinheiro está na
        // gaveta; a venda entra sem `cashBoxId` e sem mexer em saldo, e a
        // conciliação manual do caixa recoloca o valor. Para venda online o
        // comportamento é o de sempre: recusar, porque ali ainda dá para
        // corrigir antes de o cliente receber o troco.
        let caixaRegistrado = data.cashBoxId ?? null;

        if (data.cashBoxId) {
          // Condicional: se o caixa fechou entre o check e a escrita, ninguém vence em silêncio.
          const updated = await tx.cashBox.updateMany({
            where: { id: data.cashBoxId, tenantId, status: 'ABERTO' },
            data: {
              currentBalance: { increment: total },
            },
          });
          if (updated.count === 0) {
            if (!offline) {
              throw new ValidationError(
                ValidationErrorType.CLOSED_CASHBOX,
                'Caixa esta fechada'
              );
            }
            divergenciaCaixa = true;
            caixaRegistrado = null;
          }
        }

        if (divergenciaCaixa && s.cashBoxId) {
          // A venda foi criada apontando para o caixa que já estava fechado.
          // Solta o vínculo para que nenhum relatório some a venda no caixa
          // errado — o valor fica na conciliação manual.
          await tx.sale.update({ where: { id: s.id }, data: { cashBoxId: null } });
          s.cashBoxId = null;
        }

        // Financeiro atômico com a venda: RECEITA automaticamente (idempotente via venda).
        // movementDate = occurredAt ?? createdAt: venda offline de ontem
        // sincronizada hoje tem que entrar no DRE de ontem (ADR-006 §8).
        const vendaDate = s.occurredAt ?? s.createdAt;

        await tx.financialMovement.create({
          data: {
            tenantId,
            type: "RECEITA",
            category: "Vendas PDV",
            description: `Venda #${s.id} — ${paymentLabel(s.paymentMethod)}`,
            amount: s.total,
            movementDate: vendaDate,
            cashBoxId: caixaRegistrado,
          },
        });

        // Taxa maquineta fora do total da venda: DESPESA separada (métrica de perda).
        if (feeAmount > 0) {
          await tx.financialMovement.create({
            data: {
              tenantId,
              type: "DESPESA",
              category: "Taxa maquineta",
              description: `Taxa maquineta venda #${s.id}`,
              amount: feeAmount,
              movementDate: vendaDate,
              cashBoxId: caixaRegistrado,
            },
          });
        }

        return s;
      });
      break;
    } catch (e) {
      // Corrida no cupom diário: outra venda levou a sequência, tenta a próxima
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002" &&
        JSON.stringify((e as { meta?: unknown }).meta ?? "").includes("couponSeq")
      ) {
        couponSeq += 1;
        continue;
      }
      // Corrida: outra requisição criou com mesma idempotencyKey entre o findFirst inicial e o create
      if (data.idempotencyKey && e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        const existing = await prisma.sale.findFirst({
          where: { tenantId, idempotencyKey: data.idempotencyKey },
          include: { items: true },
        });
        if (existing) return Object.assign(existing, { divergencias: SEM_DIVERGENCIAS });
      }
      throw e;
    }
    }

    if (!sale) {
      throw new Error('Não foi possível numerar o cupom, tente novamente');
    }

    // Fora da transação, de propósito. A venda precisa estar confirmada antes
    // de contar como atividade: se a transação falhasse depois, a empresa
    // ficaria marcada como ativa sem ter vendido. E fica fora para não
    // segurar o lock do cupom com uma segunda escrita. A janela de 5 min em
    // `marcarAtividade` faz o custo ser uma consulta barata na maior parte
    // das vezes. Ver `src/lib/atividade.ts`.
    await marcarAtividade(tenantId);

    // As divergências viajam junto da venda para a action escrever a auditoria.
    // Uma venda online sempre volta com a lista vazia — o comportamento antigo
    // é `divergencias` ausente, então quem lê não precisa tratar caso novo.
    return Object.assign(sale, { divergencias: { estoque: divergenciasEstoque, caixa: divergenciaCaixa } });
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
    if (sale.status !== 'CONCLUIDA') {
      throw new Error('Apenas vendas concluidas podem ser canceladas');
    }

    let cashboxAdjusted = false;
    await prisma.$transaction(async (tx) => {
      await tx.sale.update({
        where: { id: saleId },
        data: { status: 'CANCELADA' },
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

      // Caixa fechada não tem o saldo alterado (fechamento é registro imutável);
      // o estorno segue no financeiro via DESPESA "Estorno PDV".
      if (sale.cashBoxId) {
        const res = await tx.cashBox.updateMany({
          where: { id: sale.cashBoxId, tenantId, status: 'ABERTO' },
          data: {
            currentBalance: {
              decrement: sale.total,
            },
          },
        });
        cashboxAdjusted = res.count > 0;
      }
    });

    return { success: true, message: 'Venda cancelada com sucesso', cashboxAdjusted };
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
        status: 'CONCLUIDA',
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
      status: 'CONCLUIDA' as const,
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
        status: 'ABERTO',
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
    if (cashBox.status === 'FECHADO') throw new Error('Caixa ja esta fechada');

    const difference = closingBalance - cashBox.currentBalance;

    // Condicional: só um fechamento concorrente vence (evita duplo lançamento de diferença).
    const updated = await prisma.cashBox.updateMany({
      where: { id: cashBoxId, tenantId, status: 'ABERTO' },
      data: {
        status: 'FECHADO',
        closingBalance,
        closedAt: new Date(),
      },
    });
    if (updated.count === 0) throw new Error('Caixa ja esta fechada');

    return { ...cashBox, status: 'FECHADO' as const, closingBalance, closedAt: new Date(), difference };
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
// CATEGORY SERVICE
// ============================================================

export class CategoryService {
  static async listCategories(tenantId: number, kind?: TipoCategoria) {
    return prisma.category.findMany({
      where: {
        tenantId,
        ...(kind ? { kind } : {}),
      },
      orderBy: [{ kind: 'asc' }, { name: 'asc' }],
    });
  }

  static async getCategory(tenantId: number, categoryId: number) {
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        tenantId,
      },
    });

    if (!category) {
      throw new ValidationError(
        ValidationErrorType.INVALID_SKU,
        'Categoria nao encontrada'
      );
    }

    return category;
  }

  static async createCategory(tenantId: number, name: string, kind: TipoCategoria) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new Error('Tenant nao encontrado');

    const existing = await prisma.category.findFirst({
      where: {
        tenantId,
        kind,
        name: { equals: name, mode: 'insensitive' },
      },
    });

    if (existing) {
      throw new ValidationError(
        ValidationErrorType.DUPLICATE_SKU,
        `Categoria "${name}" ja existe para este tipo`,
        'name'
      );
    }

    return prisma.category.create({
      data: {
        tenantId,
        name,
        kind,
      },
    });
  }

  static async updateCategory(tenantId: number, categoryId: number, name: string) {
    const category = await this.getCategory(tenantId, categoryId);

    if (name !== category.name) {
      const existing = await prisma.category.findFirst({
        where: {
          tenantId,
          kind: category.kind,
          name: { equals: name, mode: 'insensitive' },
          id: { not: categoryId },
        },
      });

      if (existing) {
        throw new ValidationError(
          ValidationErrorType.DUPLICATE_SKU,
          `Categoria "${name}" ja existe para este tipo`,
          'name'
        );
      }
    }

    return prisma.category.update({
      where: { id: categoryId },
      data: { name },
    });
  }

  static async toggleCategory(tenantId: number, categoryId: number) {
    const category = await this.getCategory(tenantId, categoryId);

    return prisma.category.update({
      where: { id: categoryId },
      data: { active: !category.active },
    });
  }

  static async deleteCategory(tenantId: number, categoryId: number) {
    const category = await this.getCategory(tenantId, categoryId);

    const [productCount, financialCount] = await Promise.all([
      prisma.product.count({
        where: { tenantId, category: category.name },
      }),
      prisma.financialMovement.count({
        where: { tenantId, category: category.name },
      }),
    ]);

    if (productCount > 0 || financialCount > 0) {
      return prisma.category.update({
        where: { id: categoryId },
        data: { active: false },
      });
    }

    return prisma.category.delete({
      where: { id: categoryId },
    });
  }
}

// ============================================================
// SETTINGS SERVICE
// ============================================================

export class SettingsService {
  static async getSettings(tenantId: number) {
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
    });

    return settings ?? {
      enableDiscount: true,
      maxDiscount: null as number | null,
      enableStockControl: true,
      allowNegativeStock: false,
      autoGenerateDailyReport: true,
      companyLogoUrl: null as string | null,
    };
  }

  static async updateSettings(
    tenantId: number,
    data: {
      enableDiscount?: boolean;
      maxDiscount?: number | null;
      enableStockControl?: boolean;
      allowNegativeStock?: boolean;
      autoGenerateDailyReport?: boolean;
      companyLogoUrl?: string | null;
      feeCredit?: number;
      feeDebit?: number;
    }
  ) {
    return prisma.tenantSettings.upsert({
      where: { tenantId },
      create: {
        tenantId,
        enableDiscount: data.enableDiscount ?? true,
        maxDiscount: data.maxDiscount ?? null,
        enableStockControl: data.enableStockControl ?? true,
        allowNegativeStock: data.allowNegativeStock ?? false,
        autoGenerateDailyReport: data.autoGenerateDailyReport ?? true,
        companyLogoUrl: data.companyLogoUrl ?? null,
        feeCredit: data.feeCredit ?? 0,
        feeDebit: data.feeDebit ?? 0,
      },
      update: {
        ...(data.enableDiscount !== undefined && { enableDiscount: data.enableDiscount }),
        ...(data.maxDiscount !== undefined && { maxDiscount: data.maxDiscount }),
        ...(data.enableStockControl !== undefined && { enableStockControl: data.enableStockControl }),
        ...(data.allowNegativeStock !== undefined && { allowNegativeStock: data.allowNegativeStock }),
        ...(data.autoGenerateDailyReport !== undefined && { autoGenerateDailyReport: data.autoGenerateDailyReport }),
        ...(data.companyLogoUrl !== undefined && { companyLogoUrl: data.companyLogoUrl }),
        ...(data.feeCredit !== undefined && { feeCredit: data.feeCredit }),
        ...(data.feeDebit !== undefined && { feeDebit: data.feeDebit }),
      },
    });
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
  category: CategoryService,
  settings: SettingsService,
};
