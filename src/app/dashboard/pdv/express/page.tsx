import { redirect } from "next/navigation";
import type { Funcao } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireSessionTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchParamToast } from "@/components/shared/SearchParamToast";
import { getPdvPageData } from "../actions";
import { ExpressPdvClient } from "./express-client";

const ERROR_MSG: Record<string, string> = {
  invalid: "Venda inválida. Confira os itens e pagamentos.",
  empty: "Adicione ao menos um item.",
  stock: "Estoque insuficiente para um ou mais itens.",
  discount: "Desconto acima do permitido ou maior que o subtotal.",
  cashbox: "Caixa selecionado está fechado ou inexistente.",
  forbidden: "Seu role não tem permissão para esta ação.",
  sale: "Não foi possível concluir a venda. Tente novamente.",
};

/**
 * PDV Expresso (caixa registradora): teclado numérico, busca rápida,
 * split dinheiro+pix, troco automático e taxa de maquineta.
 * Backend 100% reusado do PDV tradicional (actions + SaleService).
 */
export default async function PdvExpressPage() {
  const { tenant, dbUser } = await requireSessionTenant("/dashboard/pdv/express");
  try {
    requirePermission(dbUser.role as Funcao, "sales.create");
  } catch {
    redirect("/unauthorized");
  }
  const { products, cashboxes, settings } = await getPdvPageData(tenant.id);

  // Mais vendidos dos últimos 30 dias (top 24 por quantidade — leitura só p/ atalhos)
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const topGroups = await prisma.saleItem.groupBy({
    by: ["productId"],
    where: {
      tenantId: tenant.id,
      sale: { tenantId: tenant.id, status: "CONCLUIDA", createdAt: { gte: monthAgo } },
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 24,
  });
  const topSellerIds = topGroups.map((g) => g.productId);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-5 md:gap-6 md:px-6 md:py-8">
      <PageHeader title="PDV Expresso" badge={tenant.name} description="Caixa rápida: buscar, teclar, pagar." />
      <SearchParamToast
        okText="Venda #{v} registrada com sucesso."
        errorMap={ERROR_MSG}
      />
      <ExpressPdvClient
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          stock: p.inventory?.quantity ?? 0,
          barcode: p.barcode ?? null,
          category: p.category ?? null,
          imageUrl: p.imageUrl ?? null,
        }))}
        cashboxes={cashboxes.map((c) => ({ id: c.id, name: c.name }))}
        feeCredit={settings.feeCredit}
        feeDebit={settings.feeDebit}
        topSellerIds={topSellerIds}
      />
    </main>
  );
}
