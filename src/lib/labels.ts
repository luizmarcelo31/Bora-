import type {
  AcaoAuditoria,
  AlvoNotificacao,
  CicloCobranca,
  Funcao,
  FormaPagamento,
  MotivoCancelamento,
  PrioridadeTicket,
  StatusAssinatura,
  StatusEmpresa,
  StatusEnvio,
  StatusIntegracao,
  StatusSaude,
  StatusTicket,
  StatusVenda,
  StatusCaixa,
  StatusCompra,
  StatusInventario,
  TipoInventario,
  TipoCategoria,
  TipoMovimentacaoFinanceira,
  TipoMovimentacaoEstoque,
  TipoPromocao,
} from "@prisma/client";

/**
 * Linguagem humana dos enums.
 *
 * O banco e o codigo falam em portugues (valores do enum). A interface fala
 * em portugues tambem, mas por extenso: `CONCLUIDA` vira "Concluida" na UI,
 * nunca aparece o token cru. Este arquivo e a fonte unica — nenhum outro
 * lugar do app escreve label de enum na mao.
 *
 * `labels.test.ts` garante que todo valor do enum tem label, para nao
 * aparecer texto faltando quando um enum novo entra no schema.
 */

/** Todos os rotulos, para busca global e testes de cobertura. */
export const LABELS = {
  funcao: {
    SUPER_ADMIN: "Administrador da plataforma",
    PROPRIETARIO: "Proprietário",
    GERENTE: "Gerente",
    FINANCEIRO: "Financeiro",
    ESTOQUISTA: "Estoquista",
    CAIXA: "Operador de caixa",
    FUNCIONARIO: "Funcionário",
  },
  statusEmpresa: {
    TRIAL: "Em experimentação",
    ATIVA: "Ativa",
    SUSPENSA: "Suspensa",
    CANCELADA: "Cancelada",
    ARQUIVADA: "Arquivada",
  },
  statusSaude: {
    SAUDAVEL: "Saudável",
    ATENCAO: "Atenção",
    CRITICA: "Crítica",
    DESCONHECIDO: "Sem dados",
  },
  statusAssinatura: {
    EXPERIMENTACAO: "Em experimentação",
    ATIVA: "Ativa",
    PENDENTE_PAGAMENTO: "Pagamento pendente",
    SUSPENSA: "Suspensa",
    CANCELADA: "Cancelada",
    ARQUIVADA: "Arquivada",
  },
  cicloCobranca: {
    MENSAL: "Mensal",
    ANUAL: "Anual",
  },
  motivoCancelamento: {
    SOLICITACAO_CLIENTE: "Solicitado pela empresa",
    FALHA_PAGAMENTO: "Falha no pagamento",
    INADIMPLENCIA: "Inadimplência",
    VIOLACAO_TERMO: "Violação dos termos",
    INICIADA_PLATAFORMA: "Cancelado pela plataforma",
  },
  statusVenda: {
    PENDENTE: "Pendente",
    CONCLUIDA: "Concluída",
    CANCELADA: "Cancelada",
  },
  formaPagamento: {
    DINHEIRO: "Dinheiro",
    CARTAO: "Cartão",
    TRANSFERENCIA: "Transferência",
    PIX: "Pix",
    CHEQUE: "Cheque",
    OUTRO: "Outro",
    CREDITO: "Crédito",
    DEBITO: "Débito",
  },
  statusCaixa: {
    FECHADO: "Fechado",
    ABERTO: "Aberto",
  },
  statusCompra: {
    PENDENTE: "Pendente",
    RECEBIDA: "Recebida",
    CANCELADA: "Cancelada",
  },
  statusInventario: {
    ABERTO: "Aberto",
    CONCLUIDO: "Concluído",
    CANCELADO: "Cancelado",
  },
  tipoInventario: {
    TOTAL: "Contagem total",
    PARCIAL: "Contagem parcial",
  },
  tipoCategoria: {
    PRODUTO: "Produto",
    FINANCEIRO: "Financeiro",
  },
  tipoPromocao: {
    PERCENTUAL: "Percentual",
    VALOR_FIXO: "Valor fixo",
    COMBO: "Combo",
  },
  tipoMovimentacaoEstoque: {
    ENTRADA: "Entrada",
    SAIDA: "Saída",
    AJUSTE: "Ajuste",
    VENDA: "Venda",
    DEVOLUCAO: "Devolução",
    TRANSFERENCIA: "Transferência",
    PERDA: "Perda",
    AVARIA: "Avaria",
  },
  tipoMovimentacaoFinanceira: {
    RECEITA: "Receita",
    DESPESA: "Despesa",
    TRANSFERENCIA: "Transferência",
  },
  statusTicket: {
    ABERTO: "Aberto",
    EM_ANALISE: "Em análise",
    AGUARDANDO_CLIENTE: "Aguardando a empresa",
    RESOLVIDO: "Resolvido",
    FECHADO: "Fechado",
  },
  prioridadeTicket: {
    BAIXA: "Baixa",
    MEDIA: "Média",
    ALTA: "Alta",
    CRITICA: "Crítica",
  },
  statusEnvio: {
    RASCUNHO: "Rascunho",
    AGENDADO: "Agendado",
    ENVIANDO: "Enviando",
    ENVIADO: "Enviado",
    FALHOU: "Falhou",
  },
  alvoNotificacao: {
    TODAS_EMPRESAS: "Todas as empresas",
    POR_PLANO: "Por plano",
    POR_EMPRESA: "Por empresa",
    POR_FUNCAO: "Por função",
  },
  statusIntegracao: {
    CONECTADA: "Conectada",
    DESCONECTADA: "Desconectada",
    ERRO: "Com erro",
    PENDENTE: "Pendente",
  },
  acaoAuditoria: {
    EMPRESA_CRIADA: "Empresa criada",
    EMPRESA_STATUS_ALTERADO: "Status da empresa alterado",
    EMPRESA_ARQUIVADA: "Empresa arquivada",
    ASSINATURA_ALTERADA: "Assinatura alterada",
    PLANO_ALTERADO: "Plano alterado",
    USUARIO_CRIADO: "Usuário criado",
    USUARIO_ALTERADO: "Usuário alterado",
    USUARIO_DESATIVADO: "Usuário desativado",
    FUNCAO_ALTERADA: "Função alterada",
    TICKET_ALTERADO: "Ticket alterado",
    COMUNICACAO_ENVIADA: "Comunicação enviada",
    CONFIGURACAO_ALTERADA: "Configuração alterada",
  },
} as const;

export const funcaoLabel: Record<Funcao, string> = LABELS.funcao;
export const statusEmpresaLabel: Record<StatusEmpresa, string> = LABELS.statusEmpresa;
export const statusSaudeLabel: Record<StatusSaude, string> = LABELS.statusSaude;
export const statusAssinaturaLabel: Record<StatusAssinatura, string> = LABELS.statusAssinatura;
export const cicloCobrancaLabel: Record<CicloCobranca, string> = LABELS.cicloCobranca;
export const motivoCancelamentoLabel: Record<MotivoCancelamento, string> = LABELS.motivoCancelamento;
export const statusVendaLabel: Record<StatusVenda, string> = LABELS.statusVenda;
export const formaPagamentoLabel: Record<FormaPagamento, string> = LABELS.formaPagamento;
export const statusCaixaLabel: Record<StatusCaixa, string> = LABELS.statusCaixa;
export const statusCompraLabel: Record<StatusCompra, string> = LABELS.statusCompra;
export const statusInventarioLabel: Record<StatusInventario, string> = LABELS.statusInventario;
export const tipoInventarioLabel: Record<TipoInventario, string> = LABELS.tipoInventario;
export const tipoCategoriaLabel: Record<TipoCategoria, string> = LABELS.tipoCategoria;
export const tipoPromocaoLabel: Record<TipoPromocao, string> = LABELS.tipoPromocao;
export const tipoMovimentacaoEstoqueLabel: Record<TipoMovimentacaoEstoque, string> =
  LABELS.tipoMovimentacaoEstoque;
export const tipoMovimentacaoFinanceiraLabel: Record<TipoMovimentacaoFinanceira, string> =
  LABELS.tipoMovimentacaoFinanceira;
export const statusTicketLabel: Record<StatusTicket, string> = LABELS.statusTicket;
export const prioridadeTicketLabel: Record<PrioridadeTicket, string> = LABELS.prioridadeTicket;
export const statusEnvioLabel: Record<StatusEnvio, string> = LABELS.statusEnvio;
export const alvoNotificacaoLabel: Record<AlvoNotificacao, string> = LABELS.alvoNotificacao;
export const statusIntegracaoLabel: Record<StatusIntegracao, string> = LABELS.statusIntegracao;
export const acaoAuditoriaLabel: Record<AcaoAuditoria, string> = LABELS.acaoAuditoria;

/** Tonalidade do badge, por status. Usada pelos componentes de status. */
export type Tom = "neutro" | "positivo" | "atencao" | "critico" | "informativo";

export const statusEmpresaTom: Record<StatusEmpresa, Tom> = {
  TRIAL: "informativo",
  ATIVA: "positivo",
  SUSPENSA: "atencao",
  CANCELADA: "critico",
  ARQUIVADA: "neutro",
};

export const statusSaudeTom: Record<StatusSaude, Tom> = {
  SAUDAVEL: "positivo",
  ATENCAO: "atencao",
  CRITICA: "critico",
  DESCONHECIDO: "neutro",
};

export const statusAssinaturaTom: Record<StatusAssinatura, Tom> = {
  EXPERIMENTACAO: "informativo",
  ATIVA: "positivo",
  PENDENTE_PAGAMENTO: "atencao",
  SUSPENSA: "atencao",
  CANCELADA: "critico",
  ARQUIVADA: "neutro",
};

export const statusTicketTom: Record<StatusTicket, Tom> = {
  ABERTO: "informativo",
  EM_ANALISE: "informativo",
  AGUARDANDO_CLIENTE: "atencao",
  RESOLVIDO: "positivo",
  FECHADO: "neutro",
};

export const prioridadeTicketTom: Record<PrioridadeTicket, Tom> = {
  BAIXA: "neutro",
  MEDIA: "informativo",
  ALTA: "atencao",
  CRITICA: "critico",
};

export const statusIntegracaoTom: Record<StatusIntegracao, Tom> = {
  CONECTADA: "positivo",
  DESCONECTADA: "neutro",
  ERRO: "critico",
  PENDENTE: "atencao",
};

/**
 * Rotulo com fallback: valor desconhecido (dado legado, enum novo em rollout)
 * mostra o proprio token em vez de quebrar a tela.
 */
export function labelDe<T extends string>(
  mapa: Record<T, string>,
  valor: T | string | null | undefined
): string {
  if (!valor) return "—";
  return (mapa as Record<string, string>)[valor] ?? valor;
}
