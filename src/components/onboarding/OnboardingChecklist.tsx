"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Check } from "lucide-react";

import { ONBOARDING_EVENT, hasSeenReports } from "@/lib/onboarding-seen";
import {
  ONBOARDING_STEPS,
  onboardingDone,
  shouldShowChecklist,
  type OnboardingProgress,
} from "@/lib/onboarding";
import { cn } from "@/lib/utils";

/**
 * Checklist de 3 passos do primeiro acesso (Fase 2 — Onboarding).
 *
 * `temProduto` e `fezVenda` chegam prontos do servidor: são contagens reais do
 * banco, e consultá-las aqui dentro tornaria o componente assíncrono sem
 * ganho. Só o passo de relatório vem do dispositivo, via `hasSeenReports`.
 *
 * some quando os três passos acabam — ver `shouldShowChecklist`.
 */

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener(ONBOARDING_EVENT, onStoreChange);

  return () => {
    window.removeEventListener(ONBOARDING_EVENT, onStoreChange);
  };
}

function getSnapshot(): boolean {
  return hasSeenReports();
}

/** No servidor ainda não marcou o relatório como visto. */
function getServerSnapshot(): boolean {
  return false;
}

export function OnboardingChecklist({
  temProduto,
  fezVenda,
}: {
  temProduto: boolean;
  fezVenda: boolean;
}) {
  const viuRelatorio = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const progress: OnboardingProgress = {
    produto: temProduto,
    venda: fezVenda,
    relatorio: viuRelatorio,
  };

  if (!shouldShowChecklist(progress)) {
    return null;
  }

  const done = onboardingDone(progress);
  const total = ONBOARDING_STEPS.length;

  return (
    <section
      aria-labelledby="onboarding-titulo"
      className="rounded-xl border border-border/50 bg-card p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="onboarding-titulo"
          className="font-heading text-base font-semibold text-foreground"
        >
          Primeiros passos
        </h2>
        <span className="text-xs text-muted-foreground">
          {done} de {total}
        </span>
      </div>

      <p className="mt-1 text-[13px] text-muted-foreground">
        Três passos para a loja rodar de ponta a ponta.
      </p>

      <div
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="Progresso dos primeiros passos"
        className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-[var(--brand)] transition-[width] duration-300"
          style={{ width: `${(done / total) * 100}%` }}
        />
      </div>

      <ol className="mt-4 flex flex-col gap-2">
        {ONBOARDING_STEPS.map((step) => {
          const isDone = progress[step.id];

          return (
            <li key={step.id}>
              <Link
                href={step.href}
                aria-current={isDone ? undefined : "step"}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3 transition-colors",
                  "hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  isDone ? "border-transparent" : "border-border/50"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
                    isDone
                      ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                      : "border-border text-muted-foreground"
                  )}
                >
                  {isDone ? <Check className="size-3.5" strokeWidth={2.5} /> : null}
                </span>

                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block text-sm font-semibold",
                      isDone ? "text-muted-foreground line-through" : "text-foreground"
                    )}
                  >
                    {step.title}
                  </span>
                  {!isDone ? (
                    <span className="mt-0.5 block text-[13px] text-muted-foreground">
                      {step.description}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}