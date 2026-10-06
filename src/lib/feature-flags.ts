/**
 * Controle de features via banco de dados.
 *
 * Sem ligação com a interface: são regras de produto que mudam sem deployment.
 * Quem lê esse arquivo decide se uma funcionalidade está ativa.
 *
 * ## Princípio de leitura (prevalece sempre)
 *
 * 1. Linha vinculada ao tenant — o mais específica. Se `tenantId` for passado,
 *    a query olha só nas linhas que vinculam esse tenant e ignora a global.
 * 2. Linha global (`tenantId: null`) — vale para toda a plataforma.
 * 3. Flag desligada — se não existir a linha, o padrão é false.
 */

import { prisma } from '@/lib/db';

// Chaves conhecidas. O banco é um repositório de rótulos, não um dicionário
// aberto — não quero que outra equipe grave uma 'chave' sem sentido.
export const FEATURE_KEYS = [
  'pdv-expresso-temporizador',
  'suporte-velocidad',
  'saude-expresso',
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

export interface FeatureFlag {
  id: number;
  key: string;
  descricao: string;
  enabled: boolean;
  tenantId: number | null;
}

export interface FlagAtivo {
  id: number;
  key: string;
  descricao: string;
  tenantId: number;
}

/**
 * Retorna true se `key` estiver ativa para `tenantId`.
 *
 * @param tenantId id da empresa. Nulo significa 'plataforma toda'.
 *     Nada passado: `enabled` no banco não importa — o app é fechado.
 */
export async function ehFeatureAtiva(
  key: FeatureKey,
  tenantId: number | null
): Promise<boolean> {
  if (!tenantId) return false;

  const flag = await prisma.featureFlag.findFirst({
    where: { tenantId, key, enabled: true },
  });
  return !!flag;
}

/**
 * Todo o conteúdo ativo de uma empresa.
 *
 * Usado em /admin/features/page.tsx para listar o que o consumo altera.
 */
export async function todosOsNovesAtivos(
  tenantId: number
): Promise<FlagAtivo[]> {
  const flags = await prisma.featureFlag.findMany({
    where: { tenantId, enabled: true },
  });

  return flags.map((f) => ({
    id: f.id,
    key: f.key as FlagAtivo['key'],
    descricao: f.descricao,
    tenantId: f.tenantId ?? 0,
  }));
}


export function ehChaveValida(key: string): key is FeatureKey {
  return FEATURE_KEYS.includes(key as FeatureKey);
}

export async function salvarFeatureFlag(
  key: string,
  tenantId: number,
  enabled: boolean
): Promise<void> {
  // So chaves conhecidas. O banco é um repositório de rótulos, não um
  // dicionário aberto — não quero que outra equipe grave um 'chave' sem
  // sentido e enriqueça a métrica.
  if (!FEATURE_KEYS.includes(key as FeatureKey)) return;

  const exists = await prisma.featureFlag.findFirst({
    where: { tenantId, key },
  });

  if (exists) {
    await prisma.featureFlag.update({
      where: { id: exists.id },
      data: { enabled },
    });
  } else {
    await prisma.featureFlag.create({
      data: { key, descricao: descOf(key as FeatureKey), tenantId, enabled },
    });
  }
}

function descOf(key: FeatureKey): string {
  const m: Record<string, string> = {
    'pdv-expresso-temporizador':
      'Temporizador do PDV Expresso — avisa quando o cliente selecionar um produto pelo usuário.',
    'suporte-velocidad':
      'Suporte mais rápido — atrasa o SLA da prioridade CRÍTICA.',
    'saude-expresso':
      'Métrica de saúde do PDV na tela do cluster. Exibe o status de saúde do cluster.',
  };
  return m[key];
}
