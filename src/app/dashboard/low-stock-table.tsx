import { EmptyState } from "@/components/shared/EmptyState";
import { LinhaLista } from "@/components/shared/LinhaLista";
import { StatusBadge, getStockStatus, getStockStatusLabel } from "@/components/shared/StatusBadge";
import { Valor } from "@/components/shared/Valor";

/**
 * Estoque baixo do dashboard.
 *
 * A tabela desktop alinhava três colunas, mas a lista mobile precisa de uma
 * decisão a mais: o saldo em vermelho quando está no ou abaixo do mínimo, e o
 * badge dizendo por quê. Sem o badge, "3" em vermelho não diz se é 3 de 20
 * (crítico) ou 3 de 3 (ok).
 */
export function LowStockTable({
  items,
}: {
  items: { id: number; quantity: number; minimumStock: number; product: { name: string } }[];
}) {
  if (items.length === 0) return <EmptyState title="Estoque ok" description="Nenhum item crítico." />;

  return (
    <>
      {/* Mobile: lista compacta */}
      <ul className="flex flex-col gap-1.5 md:hidden">
        {items.map((i) => {
          const status = getStockStatus(i.quantity, i.minimumStock);
          return (
            <li key={i.id}>
              <LinhaLista
                titulo={i.product.name}
                apoio={`mín ${i.minimumStock}`}
                badge={<StatusBadge status={status} label={getStockStatusLabel(i.quantity, i.minimumStock)} />}
                valor={<Valor tom={status === "ok" ? "neutro" : "negativo"}>{i.quantity}</Valor>}
              />
            </li>
          );
        })}
      </ul>

      {/* Desktop: tabela */}
      <div className="hidden md:block">
        <ul className="flex flex-col gap-1">
          {items.map((i) => {
            const critico = i.quantity <= i.minimumStock;
            return (
              <li
                key={i.id}
                className="flex items-center justify-between gap-3 border-b border-border/50 py-2 last:border-0"
              >
                <span className="min-w-0 flex-1 truncate text-sm">{i.product.name}</span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  mín {i.minimumStock}
                </span>
                <Valor
                  tom={critico ? "negativo" : "neutro"}
                  className="shrink-0 text-sm font-semibold"
                >
                  {i.quantity}
                </Valor>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
