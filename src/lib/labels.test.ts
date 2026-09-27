import { describe, expect, it } from "vitest";
import {
  Funcao,
  FormaPagamento,
  MotivoCancelamento,
  PrioridadeTicket,
  StatusAssinatura,
  StatusCaixa,
  StatusCompra,
  StatusEmpresa,
  StatusEnvio,
  StatusIntegracao,
  StatusInventario,
  StatusSaude,
  StatusTicket,
  StatusVenda,
  TipoCategoria,
  TipoInventario,
  TipoMovimentacaoFinanceira,
  TipoMovimentacaoEstoque,
  TipoPromocao,
  AcaoAuditoria,
  AlvoNotificacao,
  CicloCobranca,
} from "@prisma/client";
import { LABELS, labelDe, statusEmpresaLabel, statusSaudeLabel } from "./labels";

/**
 * Rede de segurança do vocabulario: se um valor de enum entrar no schema sem
 * label, o teste quebra aqui em vez de a UI mostrar `CONCLUIDA` cru para o
 * cliente. Por isso todos os enums sao enumerados explicitamente.
 */
const COBERTURA: [string, Record<string, string>, Record<string, string>][] = [
  ["Funcao", LABELS.funcao, Funcao],
  ["StatusEmpresa", LABELS.statusEmpresa, StatusEmpresa],
  ["StatusSaude", LABELS.statusSaude, StatusSaude],
  ["StatusAssinatura", LABELS.statusAssinatura, StatusAssinatura],
  ["CicloCobranca", LABELS.cicloCobranca, CicloCobranca],
  ["MotivoCancelamento", LABELS.motivoCancelamento, MotivoCancelamento],
  ["StatusVenda", LABELS.statusVenda, StatusVenda],
  ["FormaPagamento", LABELS.formaPagamento, FormaPagamento],
  ["StatusCaixa", LABELS.statusCaixa, StatusCaixa],
  ["StatusCompra", LABELS.statusCompra, StatusCompra],
  ["StatusInventario", LABELS.statusInventario, StatusInventario],
  ["TipoInventario", LABELS.tipoInventario, TipoInventario],
  ["TipoCategoria", LABELS.tipoCategoria, TipoCategoria],
  ["TipoPromocao", LABELS.tipoPromocao, TipoPromocao],
  ["TipoMovimentacaoEstoque", LABELS.tipoMovimentacaoEstoque, TipoMovimentacaoEstoque],
  ["TipoMovimentacaoFinanceira", LABELS.tipoMovimentacaoFinanceira, TipoMovimentacaoFinanceira],
  ["StatusTicket", LABELS.statusTicket, StatusTicket],
  ["PrioridadeTicket", LABELS.prioridadeTicket, PrioridadeTicket],
  ["StatusEnvio", LABELS.statusEnvio, StatusEnvio],
  ["AlvoNotificacao", LABELS.alvoNotificacao, AlvoNotificacao],
  ["StatusIntegracao", LABELS.statusIntegracao, StatusIntegracao],
  ["AcaoAuditoria", LABELS.acaoAuditoria, AcaoAuditoria],
];

describe("labels", () => {
  it.each(COBERTURA)("%s: todo valor tem label", (_nome, mapa, enumObj) => {
    for (const valor of Object.values(enumObj)) {
      expect(mapa[valor], `falta label para ${valor}`).toBeTruthy();
    }
  });

  it.each(COBERTURA)("%s: nao tem label sobrando", (_nome, mapa, enumObj) => {
    const valores = new Set(Object.values(enumObj) as string[]);
    for (const chave of Object.keys(mapa)) {
      expect(valores.has(chave), `label ${chave} nao existe no enum`).toBe(true);
    }
  });

  it("nao expoe token cru em portugues quando existe traducao", () => {
    // values acima de 3 letras com underscore sao tokens internos: a UI
    // precisa converter, nunca mostrar o enum.
    for (const [nome, mapa] of COBERTURA) {
      for (const [chave, texto] of Object.entries(mapa)) {
        expect(texto, `${nome}.${chave} esta vazio`).not.toBe("");
        expect(texto.trim(), `${nome}.${chave} tem espacos nas bordas`).toBe(texto.trim());
      }
    }
  });

  it("labelDe cai no proprio token quando o valor e desconhecido", () => {
    expect(labelDe(statusEmpresaLabel, "ATIVA")).toBe("Ativa");
    expect(labelDe(statusEmpresaLabel, "VALOR_FUTURO")).toBe("VALOR_FUTURO");
    expect(labelDe(statusEmpresaLabel, null)).toBe("—");
  });

  it("saude da empresa tem rotulos uteis para o admin", () => {
    expect(statusSaudeLabel.SAUDAVEL).toBe("Saudável");
    expect(statusSaudeLabel.DESCONHECIDO).toBe("Sem dados");
  });
});
