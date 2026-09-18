import { describe, expect, it } from "vitest";
import {
  auditActionLabel,
  auditActionVariant,
  auditEntityLabel,
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_LABELS,
} from "./audit-labels";

describe("audit-labels", () => {
  it("traduz todas as ações gravadas", () => {
    expect(auditActionLabel("create")).toBe("Criado");
    expect(auditActionLabel("pay")).toBe("Baixa dada");
    expect(auditActionLabel("unpay")).toBe("Baixa removida");
    expect(auditActionLabel("soft_delete")).toBe("Desativado");
    expect(auditActionLabel("cancel")).toBe("Venda cancelada");
    expect(auditActionLabel("move")).toBe("Movimentação de estoque");
    expect(auditActionLabel("open")).toBe("Caixa aberto");
    expect(auditActionLabel("close")).toBe("Caixa fechado");
  });

  it("traduz todas as entidades gravadas", () => {
    expect(auditEntityLabel("cashbox")).toBe("Caixa");
    expect(auditEntityLabel("stock")).toBe("Estoque");
    expect(auditEntityLabel("inventory")).toBe("Limites de estoque");
    expect(auditEntityLabel("settings")).toBe("Configurações");
  });

  it("variante por semântica", () => {
    expect(auditActionVariant("delete")).toBe("destructive");
    expect(auditActionVariant("cancel")).toBe("destructive");
    expect(auditActionVariant("create")).toBe("default");
    expect(auditActionVariant("update")).toBe("secondary");
  });

  it("desconhecido retorna o próprio código", () => {
    expect(auditActionLabel("zzz")).toBe("zzz");
    expect(auditEntityLabel("zzz")).toBe("zzz");
  });

  it("mapas sem chaves vazias", () => {
    for (const [k, v] of Object.entries({ ...AUDIT_ACTION_LABELS, ...AUDIT_ENTITY_LABELS })) {
      expect(k.length).toBeGreaterThan(0);
      expect(v.length).toBeGreaterThan(0);
    }
  });
});
