"use client";

import dynamic from "next/dynamic";

import type { ReportActionsProps } from "./ReportActions";

/**
 * `ReportActions` carregado sob demanda (Fase 2 — Performance percebida).
 *
 * ## Por que este wrapper existe
 *
 * `ReportActions` importa `jspdf` + `jspdf-autotable`, que somam ~400 kB de
 * JS — e entram no bundle de cinco páginas (Relatórios, Financeiro, Estoque,
 * Auditoria, recibo do PDV) só para que o operador clique em "Exportar PDF".
 * Quem nunca exportou pagava esse download em toda visita.
 *
 * ## Por que um Client Component
 *
 * O guia local de lazy loading (`node_modules/next/dist/docs/01-app/02-guides/
 * lazy-loading.md`) é explícito: lazy loading se aplica a Client Components, e
 * Server Component importando Client Component **não** é code-split. Como as
 * páginas que consomem isto são Server Components, o `dynamic()` precisa morar
 * aqui — um Client Component serving de fronteira.
 *
 * ## Por que `ssr: false`
 *
 * O componente abre o menu de impressão e usa `createPortal` no `document.body`.
 * Sem `ssr: false` ele tentaria renderizar isso no servidor. O custo é o
 * placeholder abaixo, que reserva a largura dos botões para o layout não
 * pular quando o chunk chega.
 */

const ReportActions = dynamic(
  () => import("./ReportActions").then((mod) => mod.ReportActions),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center gap-2" aria-hidden="true">
        <div className="h-7 w-28 rounded-md bg-muted" />
      </div>
    ),
  },
);

export function LazyReportActions(props: ReportActionsProps) {
  return <ReportActions {...props} />;
}