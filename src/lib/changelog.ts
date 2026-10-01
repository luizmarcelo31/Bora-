/**
 * Changelog in-app (Fase 2 — Retenção).
 *
 * Fonte de verdade é ESTE arquivo: é dado estático versionado no código,
 * sem tabela no banco. O AI_RULES proíbe migration nova sem necessidade, e
 * "o que há de novo" é conteúdo de produto, não dado do tenant — misturar os
 * dois tornaria o painel dependente de estado de banco para ler texto fixo.
 *
 * O que o usuário já leu é controlado por `lastSeenVersion` em localStorage
 * (ver `changelog-seen.ts`), porque "visto" é estado de dispositivo: não faz
 * sentido uma coluna no banco que diga que a pessoa leu um texto.
 *
 * Regra de escrita: sentence case, pt-BR, pesos 400/600 (regra da Fase 1).
 */

export interface ChangelogEntry {
  /** Frase curta do que mudou, no passado, voltada para o operador. */
  readonly text: string;
}

export interface ChangelogVersion {
  /** Identificador estável. É o que o localStorage guarda como "visto". */
  readonly version: string;
  /** Rótulo exibido. */
  readonly label: string;
  readonly entries: readonly ChangelogEntry[];
}

/**
 * Versão mais recente. Badge de "novo" some assim que o usuário abrir o painel
 * com esta versão — por isso o marcador deve ser bumping explícito a cada
 * entrega, e não derivado de data.
 */
export const CURRENT_CHANGELOG_VERSION = "2026-10-fase-2";

/**
 * Id do item de menu do changelog.
 *
 * Vive aqui, e não em `tenant-nav.ts`, porque a regra do badge precisa
 * reconhecê-lo pelo id em dois arquivos: onde o item é declarado e onde o
 * `nav-main` decide se o "novo" ainda vale. Duplicar a string nos dois seria
 * um bug silencioso esperando o dia de alguém renomear um lado só.
 */
export const CHANGELOG_NAV_ID = "novidades";

export const CHANGELOG: readonly ChangelogVersion[] = [
  {
    version: "2026-10-fase-2",
    label: "Outubro de 2026",
    entries: [
      { text: "Boas-vindas na primeira vez que você entra, com um checklist de 3 passos para sair do zero." },
      { text: "Nenhum estado vazio ficou sem saída: toda tela sem dados agora oferece o botão do próximo passo." },
      { text: "Resumo do dia no topo da visão geral: o que você vendeu e quanto faturou hoje." },
    ],
  },
  {
    version: "2026-09-fase-1",
    label: "Setembro de 2026",
    entries: [
      { text: "Identidade visual refeita: contraste corrigido para WCAG AA nos dois temas, claro e escuro." },
      { text: "Leitura de números mais clara — o painel de indicadores usa peso forte de verdade agora." },
      { text: "Alertas com 4 tipos: informação, sucesso, atenção e erro." },
      { text: "Cabeçalho de página em faixa, para você saber em que módulo está sem ler." },
    ],
  },
  {
    version: "2026-09-pdv",
    label: "PDV expresso",
    entries: [
      { text: "PDV com modo expresso, leitura de código de barras e favoritos." },
      { text: "Venda dividida entre dinheiro, cartão e Pix, com taxa de maquineta." },
      { text: "Cupom com recibo e timezone de São Paulo." },
    ],
  },
];

/**
 * Versões que o usuário ainda não viu, da mais nova para a mais antiga.
 *
 * `CHANGELOG` está ordenado da mais nova para a mais antiga, então o que falta
 * ver é o prefixo até a versão vista. Um filtro por desigualdade estaria
 * errado: devolveria também as versões mais antigas já lidas.
 *
 * Se `lastSeen` não existir na lista (primeiro acesso, ou versão removida por
 * rollback), tratamos como "nada visto" e devolvemos tudo — o pior caso é
 * mostrar uma versão antiga a mais, não esconder novidade.
 */
export function unseenVersions(lastSeen: string | null | undefined): readonly ChangelogVersion[] {
  if (!lastSeen) {
    return CHANGELOG;
  }

  const seenIndex = CHANGELOG.findIndex((release) => release.version === lastSeen);

  if (seenIndex === -1) {
    return CHANGELOG;
  }

  return CHANGELOG.slice(0, seenIndex);
}

/**
 * Há novidade não vista?
 *
 * Regra: a partir do momento que o usuário viu a versão atual, nada é novo.
 * `lastSeen` precisa bater com `CURRENT_CHANGELOG_VERSION`; qualquer outro valor
 * (inclusive uma versão que não existe mais, de um rollback) conta como não visto.
 */
export function hasUnseenChanges(lastSeen: string | null | undefined): boolean {
  return lastSeen !== CURRENT_CHANGELOG_VERSION;
}