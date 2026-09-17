import { prisma } from "@/lib/db";

/**
 * Grava trilha de auditoria. Chamador já validou tenant e usuário.
 * Falha de auditoria não deve quebrar a operação principal.
 */
export async function logAudit(params: {
  tenantId: number;
  action: string;
  entity: string;
  entityId: number;
  userId?: number;
  userEmail?: string;
  changes?: unknown;
  details?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: params.tenantId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        userId: params.userId,
        userEmail: params.userEmail,
        changes: params.changes ? JSON.stringify(params.changes) : null,
        details: params.details ?? null,
      },
    });
  } catch {
    // best-effort
  }
}
