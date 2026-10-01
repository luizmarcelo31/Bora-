/**
 * Onboarding de primeiro acesso (Fase 2 — Onboarding).
 *
 * Três passos, na ordem em que a loja realmente trava sem eles:
 * cadastrar produto → fazer uma venda → abrir um relatório.
 *
 * ## Onde mora o estado de cada passo (e por quê)
 *
 * Dois passos são derivados de dado real no banco: ter produto e ter venda são
 * fatos, não preferências. O servidor já conta os dois, então o checklist
 * reflete a operação em vez de confiar num "marquei quando fiz" que mente se o
 * usuário fechar o navegador no meio.
 *
 * Só "abriu relatórios" fica no dispositivo — é descoberta, não dado: a pessoa
 * pode ter lido o relatório e não criado nada. Guardar isso em coluna seria
 * modelar o histórico de navegação de um site, não a operação de uma loja.
 *
 * Consequência de propósito: um operador que já vendia antes do BoraMais abre o
 * checklist com o primeiro passo já cumprido, e não com três tarefas inúteis
 * para quem não está começando.
 */

export const ONBOARDING_STEPS = [
  {
    id: "produto",
    title: "Cadastre seu primeiro produto",
    description: "É o que aparece no PDV. Sem produto ativo não há venda.",
    href: "/dashboard/produtos",
  },
  {
    id: "venda",
    title: "Faça sua primeira venda",
    description: "Registre no PDV para o caixa e os relatórios começarem a preencher.",
    href: "/dashboard/pdv/express",
  },
  {
    id: "relatorio",
    title: "Abra seu primeiro relatório",
    description: "Veja como as vendas do dia estão se comportando.",
    href: "/dashboard/relatorios",
  },
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number]["id"];

/**
 * Passos concluídos.
 *
 * `produto` e `venda` são contagens vindas do servidor; `relatorio` vem do
 * localStorage. Ver `onboarding-seen.ts`.
 */
export interface OnboardingProgress {
  readonly produto: boolean;
  readonly venda: boolean;
  readonly relatorio: boolean;
}

/** Quantos passos já foram cumpridos. */
export function onboardingDone(progress: OnboardingProgress): number {
  return ONBOARDING_STEPS.filter((step) => progress[step.id]).length;
}

/**
 * O checklist só faz sentido enquanto falta algo a fazer.
 *
 * Com os três cumpridos ele some em vez de ficar parado em "100%" ocupando a
 * tela todo dia — o mesmo motivo pelo qual um onboarding que nunca acaba vira
 * decoração.
 */
export function shouldShowChecklist(progress: OnboardingProgress): boolean {
  return onboardingDone(progress) < ONBOARDING_STEPS.length;
}

/** Primeiro passo ainda pendente, ou `null` se o onboarding terminou. */
export function nextStep(progress: OnboardingProgress) {
  const pending = ONBOARDING_STEPS.find((step) => !progress[step.id]);

  return pending ?? null;
}