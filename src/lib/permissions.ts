import type { Funcao } from "@prisma/client";
import { funcaoLabel, LABELS } from "@/lib/labels";

/**
 * Matriz de permissoes por funcao (nivel empresa).
 * Mantem o conceito da fundacao: EMPRESA → TIPO → FUNCAO → PERMISSAO.
 *
 * Convecao: recurso.acao (ex: "products.create").
 */
export type Permissao =
  | "products.view"
  | "products.create"
  | "products.update"
  | "products.delete"
  | "inventory.view"
  | "inventory.move"
  | "sales.view"
  | "sales.create"
  | "sales.cancel"
  | "cashbox.view"
  | "cashbox.open"
  | "cashbox.close"
  | "financial.view"
  | "financial.create"
  | "users.view"
  | "users.manage"
  | "tenants.manage"
  | "reports.view";

const PERMISSOES_PROPRIETARIO: Permissao[] = [
  "products.view",
  "products.create",
  "products.update",
  "products.delete",
  "inventory.view",
  "inventory.move",
  "sales.view",
  "sales.create",
  "sales.cancel",
  "cashbox.view",
  "cashbox.open",
  "cashbox.close",
  "financial.view",
  "financial.create",
  "users.view",
  "users.manage",
  "tenants.manage",
  "reports.view",
];

export const FUNCAO_PERMISSOES: Record<Funcao, Permissao[]> = {
  SUPER_ADMIN: [...PERMISSOES_PROPRIETARIO],
  PROPRIETARIO: [...PERMISSOES_PROPRIETARIO],
  GERENTE: [
    "products.view",
    "products.create",
    "products.update",
    "inventory.view",
    "inventory.move",
    "sales.view",
    "sales.create",
    "sales.cancel",
    "cashbox.view",
    "cashbox.open",
    "cashbox.close",
    "financial.view",
    "reports.view",
    "users.view",
  ],
  FINANCEIRO: ["financial.view", "financial.create", "reports.view", "sales.view"],
  ESTOQUISTA: [
    "products.view",
    "products.create",
    "products.update",
    "inventory.view",
    "inventory.move",
    "reports.view",
  ],
  CAIXA: [
    "products.view",
    "sales.view",
    "sales.create",
    "cashbox.view",
    "cashbox.open",
    "cashbox.close",
  ],
  FUNCIONARIO: ["products.view", "inventory.view", "sales.view"],
};

/** Rotulo humano da permissao (usado na matriz /admin/permissoes). */
export const PERMISSAO_LABEL: Record<Permissao, string> = {
  "products.view": "Ver produtos",
  "products.create": "Criar produtos",
  "products.update": "Editar produtos",
  "products.delete": "Excluir produtos",
  "inventory.view": "Ver estoque",
  "inventory.move": "Movimentar estoque",
  "sales.view": "Ver vendas",
  "sales.create": "Registrar vendas",
  "sales.cancel": "Cancelar vendas",
  "cashbox.view": "Ver caixa",
  "cashbox.open": "Abrir caixa",
  "cashbox.close": "Fechar caixa",
  "financial.view": "Ver financeiro",
  "financial.create": "Lancar financeiro",
  "users.view": "Ver usuarios",
  "users.manage": "Gerenciar usuarios",
  "tenants.manage": "Gerenciar empresas",
  "reports.view": "Ver relatorios",
};

/**
 * `funcao` aceita null/undefined porque dado legado ou enum novo em rollout não
 * pode virar `true`: o `?? false` já tratava a chave ausente, e filtrar menu
 * por role precisa do mesmo "nega na dúvida" sem cast no call site.
 */
export function can(funcao: Funcao | null | undefined, permissao: Permissao): boolean {
  return FUNCAO_PERMISSOES[funcao as Funcao]?.includes(permissao) ?? false;
}

export function requirePermission(funcao: Funcao, permissao: Permissao): void {
  if (!can(funcao, permissao)) {
    throw new Error(
      `Acesso negado: ${funcaoLabel[funcao]} nao pode ${PERMISSAO_LABEL[permissao].toLowerCase()}`
    );
  }
}

export { funcaoLabel, LABELS };
