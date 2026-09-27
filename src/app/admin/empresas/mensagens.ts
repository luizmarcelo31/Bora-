/**
 * Textos das páginas de empresas (erros e confirmações).
 *
 * Ficam fora de `actions.ts` de propósito: módulo `"use server"` só
 * exporta função assíncrona, e essas mensagens são lidas pelas páginas.
 */
export const MENSAGEM_EMPRESA = {
  naoEncontrada: "Empresa não encontrada.",
  transicaoInvalida: "Essa mudança de situação não é permitida a partir do estado atual.",
  motivoObrigatorio: "Informe o motivo da mudança.",
  empresaArquivada: "Empresa arquivada não pode mais ser alterada.",
} as const;

/** Mensagens do formulário de nova empresa, em português claro. */
export const VOLTAR_EMPRESAS = {
  error: {
    invalid: "Não foi possível criar a empresa. Verifique nome, email e telefone.",
  },
  ok: { created: "Empresa criada. Agora vincule o primeiro usuário a ela." },
} as const;
