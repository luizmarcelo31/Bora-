"use client";

import { useEffect } from "react";

import { markReportsSeen } from "@/lib/onboarding-seen";

/**
 * Marca "abriu relatórios" ao entrar na página (Fase 2 — Onboarding).
 *
 * É o único passo do checklist que não vem do banco: abrir o relatório é
 * descoberta, não operação. Sem este efeito, a pessoa completaria o passo e
 * o checklist nunca marcaria.
 *
 * Não renderiza nada — só efeito colateral no mount.
 */
export function OnboardingReportVisit() {
  useEffect(() => {
    markReportsSeen();
  }, []);

  return null;
}