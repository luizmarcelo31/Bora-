"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  Building2,
  CreditCard,
  Landmark,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * O ícone vai por CHAVE, nunca por referência.
 *
 * `BottomNav` é Client Component, mas é montado pelos layouts de
 * `/dashboard` e `/admin`, que são Server Components. Repassar
 * `icon: LayoutDashboard` cruza a fronteira RSC e o serializador recusa:
 * ícone do lucide é `forwardRef` (objeto com método), então React lança
 * "Only plain objects can be passed to Client Components" e "Functions
 * cannot be passed directly to Client Components" — e a página inteira
 * respondia 500 com React #441. String serializa; o mapa fica aqui,
 * dentro do bundle do cliente.
 */
export type BottomNavIconKey =
  | "inicio"
  | "estoque"
  | "pdv"
  | "caixa"
  | "financeiro"
  | "empresas"
  | "usuarios"
  | "assinaturas"
  | "planos";

const BOTTOM_NAV_ICONS: Record<BottomNavIconKey, LucideIcon> = {
  inicio: LayoutDashboard,
  estoque: Boxes,
  pdv: ShoppingCart,
  caixa: Wallet,
  financeiro: Landmark,
  empresas: Building2,
  usuarios: Users,
  assinaturas: CreditCard,
  planos: Package,
};

export interface BottomNavItem {
  title: string;
  url: string;
  icon: BottomNavIconKey;
  /**
   * Recebe o FAB elevado (ícone da logo), em vez do ícone da chave.
   *
   * O FAB é marcado por flag e NÃO por índice: a lista é filtrada por permissão
   * antes de chegar aqui, então a posição do PDV muda conforme o role. Fixar
   * `i === 2` colocaria a logo em cima de "Estoque" para quem não pode vender.
   */
  fab?: boolean;
}

/**
 * Bottom bar estilo Android nativo (Material M3 navigation bar).
 * Com `fabImage`, o item marcado `fab` vira FAB elevado com a logo.
 * Labels sempre visíveis, alvos 44px+, safe-area respeitada.
 * `md:hidden` — desktop usa a sidebar.
 *
 * A grade acompanha o número de itens, não um `grid-cols-5` fixo: a lista já
 * chega filtrada por permissão e uma coluna vazia sobrando distorceria o
 * alinhamento do FAB.
 */
export function BottomNav({ items, fabImage }: { items: readonly BottomNavItem[]; fabImage?: string }) {
  const pathname = usePathname();

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur md:hidden"
    >
      <div
        className="grid items-end px-1 pt-1 pb-[calc(0.25rem+env(safe-area-inset-bottom))]"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const active = pathname === item.url;
          if (fabImage && item.fab) {
            return (
              <Link
                key={item.url}
                href={item.url}
                prefetch={false}
                aria-current={active ? "page" : undefined}
                aria-label={item.title}
                className="flex flex-col items-center gap-0.5 text-[11px]"
              >
                <span
                  className={cn(
                    "-mt-5 size-14 overflow-hidden rounded-full shadow-lg ring-4",
                    active ? "ring-primary" : "ring-background"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- logo local public/, sem remotePatterns */}
                  <img src={fabImage} alt="" className="size-full object-cover" />
                </span>
                <span className={cn(active ? "font-semibold text-primary" : "text-muted-foreground")}>
                  {item.title}
                </span>
              </Link>
            );
          }
          const Icon = BOTTOM_NAV_ICONS[item.icon];
          return (
            <Link
              key={item.url}
              href={item.url}
              prefetch={false}
              aria-current={active ? "page" : undefined}
              className="flex min-h-14 flex-col items-center justify-center gap-1 py-0.5 text-[11px]"
            >
              <span className={cn("flex h-7 items-center rounded-full px-4", active && "bg-primary/15")}>
                <Icon className={cn("size-5", active ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
              </span>
              <span className={cn(active ? "font-semibold text-primary" : "text-muted-foreground")}>
                {item.title}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
