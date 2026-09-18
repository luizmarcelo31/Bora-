/** Rótulos PT-BR para os logs de auditoria (action/entity gravados em inglês). */

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  create: "Criado",
  update: "Atualizado",
  delete: "Excluído",
  soft_delete: "Desativado",
  toggle: "Ativado/Desativado",
  cancel: "Venda cancelada",
  move: "Movimentação de estoque",
  pay: "Baixa dada",
  unpay: "Baixa removida",
  open: "Caixa aberto",
  close: "Caixa fechado",
};

export const AUDIT_ENTITY_LABELS: Record<string, string> = {
  product: "Produto",
  category: "Categoria",
  sale: "Venda",
  stock: "Estoque",
  inventory: "Limites de estoque",
  financial: "Financeiro",
  cashbox: "Caixa",
  settings: "Configurações",
};

export type AuditBadgeVariant = "default" | "secondary" | "destructive" | "outline";

/** Cor da ação por semântica: criação/abertura verde-azulada, destruição vermelha, resto neutra. */
export function auditActionVariant(action: string): AuditBadgeVariant {
  if (["delete", "soft_delete", "cancel"].includes(action)) return "destructive";
  if (["create", "open", "pay"].includes(action)) return "default";
  return "secondary";
}

export function auditActionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action;
}

export function auditEntityLabel(entity: string): string {
  return AUDIT_ENTITY_LABELS[entity] ?? entity;
}
