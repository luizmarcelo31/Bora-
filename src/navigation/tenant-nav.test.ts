import { describe, expect, it } from "vitest";
import type { Funcao } from "@prisma/client";

import { visibleTenantNav } from "./tenant-nav";
import { visibleBottomNavItems, TENANT_BOTTOM_NAV } from "./tenant-bottom-nav";
import { can } from "@/lib/permissions";

/**
 * Regressão: o menu oferecia item que a página rejeitava.
 *
 * A sidebar (desktop) e a BottomNav (mobile) listavam destinos fixos, enquanto
 * cada página chamava `requirePermission` e respondia `/unauthorized`. O
 * usuário via um item, tocava, e caía em "403 — Não autorizado" — no mobile,
 * onde a BottomNav é a única navegação e o FAB (PDV) é o item mais destacado.
 *
 * Estes testes prendem a paridade item ↔ permissão. Eles não provam que a página
 * exige o que o menu declara (isso é do código da página); provam que o menu não
 * oferece nada que o role não pode usar.
 */

const TODAS: Funcao[] = [
  "SUPER_ADMIN",
  "PROPRIETARIO",
  "GERENTE",
  "FINANCEIRO",
  "ESTOQUISTA",
  "CAIXA",
  "FUNCIONARIO",
];

const titulos = (grupos: ReturnType<typeof visibleTenantNav>) =>
  grupos.flatMap((g) => g.items.map((i) => i.title));

describe("visibleTenantNav", () => {
  it("PROPRIETARIO vê a navegação inteira", () => {
    expect(visibleTenantNav("PROPRIETARIO")).toHaveLength(4);
    expect(titulos(visibleTenantNav("PROPRIETARIO"))).toContain("Configurações");
  });

  it("SUPER_ADMIN vê a navegação inteira", () => {
    expect(visibleTenantNav("SUPER_ADMIN")).toHaveLength(4);
  });

  it("FUNCIONARIO não recebe item que não pode usar", () => {
    const visiveis = titulos(visibleTenantNav("FUNCIONARIO"));
    // pages: /pdV exige sales.create, /caixa cashbox.view,
    // /financeiro financial.view, /relatorios reports.view,
    // /configuracoes tenants.manage
    expect(visiveis).not.toContain("PDV");
    expect(visiveis).not.toContain("Caixa");
    expect(visiveis).not.toContain("Financeiro");
    expect(visiveis).not.toContain("Relatórios");
    expect(visiveis).not.toContain("Configurações");
  });

  it("FUNCIONARIO ainda vê o que pode usar", () => {
    const visiveis = titulos(visibleTenantNav("FUNCIONARIO"));
    expect(visiveis).toContain("Visão geral");
    expect(visiveis).toContain("Estoque");
    expect(visiveis).toContain("Produtos");
  });

  it("nenhum role recebe item cuja permissão não tem", () => {
    for (const funcao of TODAS) {
      for (const grupo of visibleTenantNav(funcao)) {
        for (const item of grupo.items) {
          const permissao = item.permission ?? null;
          if (permissao === null) continue;
          expect(
            can(funcao, permissao),
            `${funcao} recebeu "${item.title}" mas não tem ${permissao}`
          ).toBe(true);
        }
      }
    }
  });

  it("nunca deixa grupo com lista vazia", () => {
    for (const funcao of TODAS) {
      for (const grupo of visibleTenantNav(funcao)) {
        expect(grupo.items.length, `grupo "${grupo.label}" vazio para ${funcao}`).toBeGreaterThan(0);
      }
    }
  });

  it("grupo inteiro some quando não sobra item (nada de título morto)", () => {
    const funcao: Funcao = "FINANCEIRO";
    const grupos = visibleTenantNav(funcao);
    const labels = grupos.map((g) => g.label);
    // Financeiro não tem products/inventory/sales.create: o grupo "Operação"
    // perde PDV e Divergências, mas mantém itens; "Gestão" perde Relatórios e
    // Configurações e mantém Auditoria/Novidades.
    expect(labels).not.toContain(undefined);
    expect(grupos.every((g) => g.items.length > 0)).toBe(true);
  });

  it("nunca some a Visão geral (destino válido de todo role)", () => {
    for (const funcao of [...TODAS, null, undefined]) {
      expect(titulos(visibleTenantNav(funcao))).toContain("Visão geral");
    }
  });
});

describe("visibleBottomNavItems", () => {
  it("PROPRIETARIO recebe os cinco destinos, FAB no PDV", () => {
    const items = visibleBottomNavItems("PROPRIETARIO");
    expect(items).toHaveLength(5);
    expect(items.find((i) => i.fab)?.url).toBe("/dashboard/pdv/express");
  });

  it("CAIXA mantém o FAB: tem sales.create e cashbox.view, perde Estoque", () => {
    // CAIXA não tem inventory.view, e /dashboard/estoque exige essa permissão —
    // item sai, e o FAB continua no PDV porque a marca viaja com o item.
    const items = visibleBottomNavItems("CAIXA");
    expect(items.map((i) => i.title)).toEqual(["Início", "PDV", "Caixa"]);
    expect(items.find((i) => i.fab)?.title).toBe("PDV");
  });

  it("FUNCIONARIO perde PDV, Caixa e Financeiro — os três que davam 403", () => {
    const items = visibleBottomNavItems("FUNCIONARIO");
    expect(items.map((i) => i.title)).toEqual(["Início", "Estoque"]);
  });

  it("FUNCIONARIO não fica com o FAB pendurado em item sem permissão", () => {
    // O FAB era posicionado por índice fixo (i === 2). Filtrando a lista, o
    // índice do PDV muda — a marca `fab` precisa traveling com o item, senão a
    // logo cai em cima de "Estoque".
    const items = visibleBottomNavItems("FUNCIONARIO");
    expect(items.some((i) => i.fab)).toBe(false);
  });

  it("nunca devolve lista vazia (mobile sem navegação)", () => {
    for (const funcao of [...TODAS, null, undefined] as (Funcao | null | undefined)[]) {
      expect(visibleBottomNavItems(funcao).length).toBeGreaterThan(0);
    }
  });

  it("todo item visível tem a permissão que o role tem", () => {
    for (const funcao of TODAS) {
      for (const item of visibleBottomNavItems(funcao)) {
        const declarado = TENANT_BOTTOM_NAV.find((i) => i.url === item.url)!;
        if (declarado.permission === null) continue;
        expect(can(funcao, declarado.permission)).toBe(true);
      }
    }
  });
});

describe("páginas sem guarda declaradas como null", () => {
  it("produtos, categorias, inventário, promoções e compras não exigem permissão", () => {
    // Paridade: item com `permission: null` = página sem requirePermission.
    // Se um dia a página ganhar guarda, o menu passa a esconder e o teste
    // abaixo quebra — que é o aviso.
    const semGuarda = [
      "Produtos",
      "Categorias",
      "Inventário",
      "Promoções",
      "Compras",
      "Auditoria",
      "Novidades",
      "Visão geral",
    ];
    for (const titulo of semGuarda) {
      expect(titulos(visibleTenantNav("FUNCIONARIO"))).toContain(titulo);
    }
  });
});