import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Funcao } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireSessionTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/PageHeader";
import { ReportActions } from "@/components/shared/ReportActions";
import { paymentLabel } from "@/lib/payments";
import { formatCurrency } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type SplitPart = { method: string; amount: number };

function parseParts(raw: unknown): SplitPart[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((p) => p && typeof p === "object" && typeof (p as SplitPart).amount === "number")
    .map((p) => ({ method: String((p as SplitPart).method), amount: (p as SplitPart).amount }));
}

/**
 * Recibo não-fiscal da venda (cupom de mercado).
 * Sem valor fiscal — conferência e reimpressão do operador.
 */
export default async function ReciboPage({ params }: { params: Promise<{ id: string }> }) {
  const { tenant } = await requireSessionTenant("/dashboard/pdv");
  try {
    const { dbUser } = await requireSessionTenant("/dashboard/pdv");
    requirePermission(dbUser.role as Funcao, "sales.view");
  } catch {
    redirect("/unauthorized");
  }
  const { id } = await params;
  const saleId = parseInt(id, 10);
  if (!saleId) notFound();

  const sale = await prisma.sale.findFirst({
    where: { id: saleId, tenantId: tenant.id },
    include: { items: { include: { product: { select: { name: true } } } } },
  });
  if (!sale) notFound();

  const parts = parseParts(sale.payments);
  const coupon = sale.couponSeq !== null ? String(sale.couponSeq).padStart(6, "0") : `#${sale.id}`;
  const when = sale.createdAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  const rows = sale.items.map((i) => [
    `${i.quantity}x ${i.product.name}`,
    formatCurrency(i.unitPrice),
    formatCurrency(i.total),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-5 md:gap-6 md:px-6 md:py-8">
      <PageHeader title={`Cupom ${coupon}`} badge={tenant.name} description="Recibo não-fiscal." />
      <Button variant="outline" size="sm" asChild className="w-fit">
        <Link href="/dashboard/pdv">
          <ArrowLeft className="size-4" /> Voltar ao PDV
        </Link>
      </Button>

      <div className="rounded-xl border bg-card p-5 font-mono text-sm shadow-sm">
        <p className="text-center text-base font-bold">{tenant.name}</p>
        <p className="text-center text-xs text-muted-foreground">
          {when} · Venda #{sale.id}
        </p>
        <hr className="my-3 border-dashed" />
        {sale.items.map((i) => (
          <div key={i.id} className="flex justify-between gap-2 py-0.5">
            <span className="min-w-0 flex-1 truncate">
              {i.quantity}x {i.product.name}
            </span>
            <span className="shrink-0 tabular-nums">{formatCurrency(i.total)}</span>
          </div>
        ))}
        <hr className="my-3 border-dashed" />
        <div className="flex justify-between tabular-nums">
          <span>Subtotal</span>
          <span>{formatCurrency(sale.subtotal)}</span>
        </div>
        {sale.discount > 0 && (
          <div className="flex justify-between tabular-nums">
            <span>Desconto</span>
            <span>- {formatCurrency(sale.discount)}</span>
          </div>
        )}
        {sale.feeAmount > 0 && (
          <div className="flex justify-between tabular-nums text-muted-foreground">
            <span>Taxa maquineta</span>
            <span>+ {formatCurrency(sale.feeAmount)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold tabular-nums">
          <span>TOTAL</span>
          <span>{formatCurrency(sale.total + sale.feeAmount)}</span>
        </div>
        <hr className="my-3 border-dashed" />
        {parts.length > 0 ? (
          parts.map((p, ix) => (
            <div key={ix} className="flex justify-between tabular-nums">
              <span>{paymentLabel(p.method)}</span>
              <span>{formatCurrency(p.amount)}</span>
            </div>
          ))
        ) : (
          <div className="flex justify-between tabular-nums">
            <span>{paymentLabel(sale.paymentMethod)}</span>
            <span>{formatCurrency(sale.total + sale.feeAmount)}</span>
          </div>
        )}
        {sale.receivedAmount !== null && sale.receivedAmount !== undefined && (
          <>
            <div className="flex justify-between tabular-nums">
              <span>Recebido</span>
              <span>{formatCurrency(sale.receivedAmount)}</span>
            </div>
            <div className="flex justify-between font-bold tabular-nums">
              <span>Troco</span>
              <span>{formatCurrency(sale.changeAmount ?? 0)}</span>
            </div>
          </>
        )}
        <hr className="my-3 border-dashed" />
        <p className="text-center text-xs text-muted-foreground">
          DOCUMENTO SEM VALOR FISCAL
        </p>
      </div>

      <ReportActions
        title={`Cupom ${coupon} — ${tenant.name}`}
        subtitle={`${when} · Venda #${sale.id} · ${paymentLabel(sale.paymentMethod)}`}
        columns={["Item", "Unitário", "Total"]}
        rows={rows}
        footer={["", "TOTAL", formatCurrency(sale.total + sale.feeAmount)]}
        fileName={`cupom-${coupon}`}
      />
    </main>
  );
}
