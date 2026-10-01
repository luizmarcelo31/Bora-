import { describe, expect, it } from "vitest";

import {
  ONBOARDING_STEPS,
  nextStep,
  onboardingDone,
  shouldShowChecklist,
  type OnboardingProgress,
} from "./onboarding";

const nenhum: OnboardingProgress = { produto: false, venda: false, relatorio: false };

describe("onboarding", () => {
  it("tem exatamente os 3 passos que o roadmap pede, na ordem", () => {
    // A ordem importa: produto antes de venda, venda antes de relatório.
    expect(ONBOARDING_STEPS.map((step) => step.id)).toEqual(["produto", "venda", "relatorio"]);
    expect(ONBOARDING_STEPS.map((step) => step.href)).toEqual([
      "/dashboard/produtos",
      "/dashboard/pdv/express",
      "/dashboard/relatorios",
    ]);
  });

  it("todo passo tem título, descrição e href", () => {
    for (const step of ONBOARDING_STEPS) {
      expect(step.title.length).toBeGreaterThan(0);
      expect(step.description.length).toBeGreaterThan(0);
      expect(step.href.startsWith("/dashboard")).toBe(true);
    }
  });

  describe("onboardingDone", () => {
    it("conta só os passos cumpridos", () => {
      expect(onboardingDone(nenhum)).toBe(0);
      expect(onboardingDone({ ...nenhum, produto: true })).toBe(1);
      expect(onboardingDone({ produto: true, venda: true, relatorio: false })).toBe(2);
      expect(onboardingDone({ produto: true, venda: true, relatorio: true })).toBe(3);
    });
  });

  describe("shouldShowChecklist", () => {
    it("aparece enquanto falta passo", () => {
      expect(shouldShowChecklist(nenhum)).toBe(true);
      expect(shouldShowChecklist({ produto: true, venda: false, relatorio: false })).toBe(true);
      expect(shouldShowChecklist({ produto: true, venda: true, relatorio: false })).toBe(true);
    });

    it("some com os três cumpridos", () => {
      // Um checklist preso em "100%" todo dia vira decoração.
      expect(shouldShowChecklist({ produto: true, venda: true, relatorio: true })).toBe(false);
    });
  });

  describe("nextStep", () => {
    it("aponta o primeiro pendente, pulando os já feitos", () => {
      expect(nextStep(nenhum)?.id).toBe("produto");
      expect(nextStep({ produto: true, venda: false, relatorio: false })?.id).toBe("venda");
      expect(nextStep({ produto: true, venda: true, relatorio: false })?.id).toBe("relatorio");
    });

    it("devolve null quando terminou", () => {
      expect(nextStep({ produto: true, venda: true, relatorio: true })).toBeNull();
    });

    it("pode pular passos Concluídos fora de ordem (dado real do banco)", () => {
      // Quem já vendia antes de abrir o app tem "venda" e "produto" prontos;
      // o checklist não deve exigir refazer o primeiro passo.
      expect(nextStep({ produto: true, venda: true, relatorio: false })?.id).toBe("relatorio");
    });
  });
});