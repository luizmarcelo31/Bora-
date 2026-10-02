import Link from "next/link";
import type { Funcao } from "@prisma/client";
import { redirect } from "next/navigation";

import { requireSessionTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/PageHeader";
import { TableCard } from "@/components/shared/TableCard";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/validators";
import { listarDivergencias, resumirDivergencias } from "@/lib/offline/divergencias";
import { prisma } from "@/lib/db";
import { TriangleAlert, ClipboardCheck } from "lucide-react";

/**
 * Divergências do modo offline (Fase 3.1 — ADR-006 §5, §7).
 *
 * ## Para quem é esta tela
 *
 * Para o gerente, no fechamento do mês. A política do ADR-006 §5 aceita a
 * venda mesmo quando o estoque não cobre — o dinheiro foi entregue —, e o
 * preço é sempre o do servidor, então uma venda feita com preço antigo vira
 * diferença de caixa visível aqui.
 *
 * ## Por que nada é corrigido automaticamente
 *
 * A correção é contagem de inventário, com diferença explicada por quem
 * confere. Ajustar estoque daqui seria inventar um saldo que ninguém contou.
 * O atalho para o inventário existe porque é lá que a divergência se resolve.
 */
export default async function DivergenciasPage() {
  const { tenant, dbUser } = await requireSessionTenant("/dashboard/divergencias");
  try {
    requirePermission(dbUser.role as Funcao, "inventory.view");
  } catch {
    redirect("/unauthorized");
  }

  const vendas = await listarDivergencias(tenant.id);
  const resumo = resumirDivergencias(vendas);

  // Nome dos produtos citados: a divergência guarda o id (o saldo disponível na
  // época), e o gerente precisa do nome para conferir a prateleira.
  const productIds = [...new Set(vendas.flatMap((v) => v.estoque.map((i) => i.productId)))];
  const produtos = productIds.length
    ? await prisma.product.findMany({
        where: { tenantId: tenant.id, id: { in: productIds } },
        select: { id: true, name: true },
      })
    : [];
  const nomePorId = new Map(produtos.map((p) => [p.id, p.name]));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-5 md:gap-6 md:px-6 md:py-8">
      <PageHeader
        title="Divergências do modo offline"
        badge={tenant.name}
        description="Vendas sincronizadas sem rede que conflitaram com estoque ou caixa."
      />

      {vendas.length === 0 ? (
        <EmptyState
          title="Nenhuma divergência"
          description="Nenhuma venda do modo offline precisou de conciliação. Isso é o estado esperado."
          action={
            <Button asChild variant="outline">
              <Link href="/dashboard/inventario">
                <ClipboardCheck aria-hidden="true" />
                Ver inventário
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Kpi titulo="Vendas com divergência" valor={String(resumo.vendas)} />
            <Kpi titulo="Produtos afetados" valor={String(resumo.itensDeEstoque)} />
            <Kpi titulo="Vendas sem caixa vinculado" valor={String(resumo.vendasSemCaixa)} />
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
            <TriangleAlert aria-hidden="true" className="size-4 shrink-0 text-destructive" />
            <span>
              Estas vendas foram aceitas porque o dinheiro já havia sido entregue. O saldo de estoque
              pode estar negativo e o caixa pode não incluir o valor — a contagem de inventário é quem
              corrige.
            </span>
          </div>

          <TableCard
            title="Divergências recentes"
            description="Últimas 200 vendas com divergência, da mais recente para a mais antiga."
            footer={`${vendas.length} venda(s)`}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Venda</TableHead>
                  <TableHead>Quando</TableHead>
                  <TableHead>Operador</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Caixa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendas.map((v) => (
                  <TableRow key={v.saleId}>
                    <TableCell>
                      <Link
                        href={`/dashboard/pdv/recibo/${v.saleId}`}
                        className="font-semibold tabular-nums hover:underline"
                      >
                        #{v.saleId}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {v.occurredAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {v.userEmail ?? "—"}
                    </TableCell>
                    <TableCell>
                      {v.estoque.length === 0 ? (
                        <span className="text-sm text-muted-foreground">—</span>
                      ) : (
                        <ul className="flex flex-col gap-1">
                          {v.estoque.map((item) => (
                            <li key={item.productId} className="text-sm">
                              <span className="font-semibold">
                                {nomePorId.get(item.productId) ?? `Produto ${item.productId}`}
                              </span>
                              <span className="text-muted-foreground">
                                {" "}
                                — tinha {formatCurrency(item.disponivel)}, vendeu{" "}
                                {formatCurrency(item.vendido)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </TableCell>
                    <TableCell>
                      {v.caixa ? (
                        <Badge variant="destructive">Sem vínculo</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>

          <div>
            <Button asChild variant="outline">
              <Link href="/dashboard/inventario">
                <ClipboardCheck aria-hidden="true" />
                Abrir inventário para conferir
              </Link>
            </Button>
          </div>
        </>
      )}
    </main>
  );
}

function Kpi({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-card px-4 py-3">
      <span className="text-xs font-semibold uppercase tracking-[0.7px] text-muted-foreground">
        {titulo}
      </span>
      <span className="text-3xl font-bold tabular-nums">{valor}</span>
    </div>
  );
}
