import type { Funcao } from "@prisma/client";

/**
 * Hierarquia de funcoes (maior numero = mais poder).
 * SUPER_ADMIN esta fora da empresa (nivel plataforma).
 */
export const FUNCAO_RANK: Record<Funcao, number> = {
  FUNCIONARIO: 10,
  CAIXA: 20,
  ESTOQUISTA: 30,
  FINANCEIRO: 40,
  GERENTE: 60,
  PROPRIETARIO: 80,
  SUPER_ADMIN: 100,
};

export function hasMinFuncao(userFuncao: Funcao, minFuncao: Funcao): boolean {
  return FUNCAO_RANK[userFuncao] >= FUNCAO_RANK[minFuncao];
}

export function isSuperAdmin(funcao: Funcao | null | undefined): boolean {
  return funcao === "SUPER_ADMIN";
}
