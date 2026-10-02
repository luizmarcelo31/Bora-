import type { Funcao } from "@prisma/client";
import { redirect } from "next/navigation";

import { requireSessionTenant } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { PageHeader } from "@/components/shared/PageHeader";
import { OfflinePdvClient } from "./_components/OfflinePdvClient";

/**
 * PDV sem conexão (Fase 3.1 — modo offline, ADR-006 §2).
 *
 * ## Por que este page é um Server Component mínimo
 *
 * Ele faz o mínimo que só o servidor sabe: confirmar a sessão e a permissão.
 * Não lê catálogo do banco — com a rede caída essa leitura não acontece, e é
 * exatamente por isso que o catálogo vem do `localStorage` do aparelho.
 *
 * ## Por que ainda há um servidor aqui
 *
 * A tela inteira ser client não desligaria a checagem de permissão: `client`
 * não é fronteira de segurança. Manter `requirePermission` aqui preserva
 * `AI_RULES` ("autorização no servidor"), e o custo é uma renderização que só
 * acontece com rede — o que é aceitável porque a sessão já existe no momento
 * em que o operador precisa do modo offline.
 */
export default async function PdvOfflinePage() {
  const { tenant, dbUser } = await requireSessionTenant("/dashboard/pdv/offline");
  try {
    requirePermission(dbUser.role as Funcao, "sales.create");
  } catch {
    redirect("/unauthorized");
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-5 md:gap-6 md:px-6 md:py-8">
      <PageHeader
        title="PDV sem conexão"
        badge={tenant.name}
        description="Venda garantida no aparelho; sincroniza quando a internet voltar."
      />
      <OfflinePdvClient tenantId={tenant.id} userId={dbUser.id} />
    </main>
  );
}
