import { prisma } from "@/lib/db";
import type { AcaoAuditoria, StatusEmpresa } from "@prisma/client";

/**
 * Trilha de auditoria das ações do super admin.
 *
 * `PlatformAuditLog` é separado do `AuditLog` do tenant de propósito: uma
 * ação de plataforma (criar empresa, mudar plano) não pertence a nenhuma
 * empresa, e o `AuditLog` exige `tenantId`. Registrar o "antes" e o
 * "depois" em JSON torna a mudança reconstituível depois do fato.
 */
export async function registrarAuditoriaPlataforma(dados: {
  atorEmail: string;
  acao: AcaoAuditoria;
  entidade: string;
  entidadeId?: number | null;
  tenantId?: number | null;
  antes?: unknown;
  depois?: unknown;
  metadata?: Record<string, unknown>;
  request?: Request;
}): Promise<void> {
  const serializa = (v: unknown) => (v === undefined ? null : JSON.stringify(v));

  await prisma.platformAuditLog.create({
    data: {
      actorEmail: dados.atorEmail,
      action: dados.acao,
      entity: dados.entidade,
      entityId: dados.entidadeId ?? null,
      tenantId: dados.tenantId ?? null,
      before: serializa(dados.antes),
      after: serializa(dados.depois),
      metadata: dados.metadata ? JSON.stringify(dados.metadata) : null,
      ip: dados.request
        ? (dados.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null)
        : null,
      userAgent: dados.request?.headers.get("user-agent") ?? null,
    },
  });
}

/** Campos que descrevem o estado relevante de uma empresa na trilha. */
export function resumoEmpresa(t: {
  id: number;
  name: string;
  status: StatusEmpresa;
  suspended: boolean;
  active: boolean;
  trialEndsAt: Date | null;
}) {
  return {
    id: t.id,
    nome: t.name,
    status: t.status,
    suspended: t.suspended,
    active: t.active,
    trialEndsAt: t.trialEndsAt,
  };
}
