import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { verificarLimite, limiteVendasNoMes } from "./limites";

/**
 * O plano só vale alguma coisa se o limite barrar de verdade.
 *
 * Este teste usa o banco, não mock: o risco que ele cobre é o mais fácil
 * de passar — a função compila, retorna `{ ok: true }` para o caminho fácil, e
 * ninguém nota que o `where` do count estava errado. Ver contra o banco real é
 * a única forma de pegar isso.
 *
 * Requer `DATABASE_URL` apontando para um banco descartável.
 */
const prisma = new PrismaClient();

let planoId: number;
let tenantId: number;
let assinaturaId: number;

beforeAll(async () => {
  planoId = (
    await prisma.plan.create({
      data: {
        name: `Teste limites ${Date.now()}`,
        slug: `teste-limites-${Date.now()}`,
        monthlyPrice: 1000,
        maxUsers: 2,
        maxProducts: 3,
        maxSalesPerMonth: 5,
        trialDays: 0,
      },
    })
  ).id;

  tenantId = (
    await prisma.tenant.create({
      data: { name: `Teste limites ${Date.now()}`, type: "CONVENIENCE", status: "ATIVA" },
    })
  ).id;

  assinaturaId = (
    await prisma.subscription.create({
      data: {
        tenantId,
        planId: planoId,
        status: "ATIVA",
        startedAt: new Date(),
        renewsAt: new Date(Date.now() + 30 * 86_400_000),
      },
    })
  ).id;
});

afterAll(async () => {
  await prisma.subscription.delete({ where: { id: assinaturaId } });
  await prisma.tenant.delete({ where: { id: tenantId } });
  await prisma.plan.delete({ where: { id: planoId } });
  await prisma.$disconnect();
});

describe("verificarLimite", () => {
  it("liberava quando o tenant ainda não tem assinatura — não trava o PDV por furo administrativo", async () => {
    const solto = (
      await prisma.tenant.create({
        data: { name: `Sem assinatura ${Date.now()}`, type: "CONVENIENCE" },
      })
    ).id;

    try {
      const r = await verificarLimite(solto, "usuarios");
      expect(r.ok).toBe(true);
    } finally {
      await prisma.tenant.delete({ where: { id: solto } });
    }
  });

  it("libera enquanto estiver abaixo do teto", async () => {
    const r = await verificarLimite(tenantId, "produtos");
    // 0 produtos, teto 3.
    expect(r.ok).toBe(true);
  });

  it("BLOQUEIA quando o uso chega no teto", async () => {
    // O plano permite 2 usuários; criamos 2.
    const r1 = await verificarLimite(tenantId, "usuarios");
    expect(r1.ok).toBe(true); // 0 < 2

    const u1 = await prisma.user.create({
      data: {
        email: `l1-${Date.now()}@teste.com`,
        name: "Um",
        role: "FUNCIONARIO",
        tenantId,
      },
    });
    expect((await verificarLimite(tenantId, "usuarios")).ok).toBe(true); // 1 < 2

    const u2 = await prisma.user.create({
      data: {
        email: `l2-${Date.now()}@teste.com`,
        name: "Dois",
        role: "FUNCIONARIO",
        tenantId,
      },
    });

    // 2 == 2: agora barra.
    const r2 = await verificarLimite(tenantId, "usuarios");
    expect(r2.ok).toBe(false);
    if (r2.ok === false) {
      expect(r2.limite).toBe(2);
      expect(r2.atual).toBe(2);
      expect(r2.mensagem).toContain("2");
    }

    await prisma.user.delete({ where: { id: u1.id } });
    await prisma.user.delete({ where: { id: u2.id } });
  });

  it("trata null como ilimitado, não como zero", async () => {
    const planoSemTeto = (
      await prisma.plan.create({
        data: {
          name: `Sem teto ${Date.now()}`,
          slug: `sem-teto-${Date.now()}`,
          monthlyPrice: 1000,
          maxUsers: null,
          maxProducts: null,
          trialDays: 0,
        },
      })
    ).id;

    const t2 = (
      await prisma.tenant.create({
        data: { name: `Sem teto ${Date.now()}`, type: "CONVENIENCE" },
      })
    ).id;
    const sub2 = (
      await prisma.subscription.create({
        data: {
          tenantId: t2,
          planId: planoSemTeto,
          status: "ATIVA",
          startedAt: new Date(),
          renewsAt: new Date(Date.now() + 30 * 86_400_000),
        },
      })
    ).id;

    // 50 usuários e continua liberado: teto null não vira limite zero.
    for (let i = 0; i < 5; i++) {
      await prisma.user.create({
        data: {
          email: `st-${i}-${Date.now()}@teste.com`,
          name: `U${i}`,
          role: "FUNCIONARIO",
          tenantId: t2,
        },
      });
    }
    expect((await verificarLimite(t2, "usuarios")).ok).toBe(true);

    await prisma.subscription.delete({ where: { id: sub2 } });
    await prisma.tenant.delete({ where: { id: t2 } });
    await prisma.plan.delete({ where: { id: planoSemTeto } });
  });
});

describe("limiteVendasNoMes", () => {
  it("conta só o mês corrente", async () => {
    const r = await limiteVendasNoMes(tenantId);
    expect(r).not.toBeNull();
    if (r) {
      expect(r.max).toBe(5);
      expect(r.usadas).toBe(0);
      expect(r.atingiu).toBe(false);
      expect(r.fracao).toBe(0);
    }
  });
});