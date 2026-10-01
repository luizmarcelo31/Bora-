import { PageHeader } from "@/components/shared/PageHeader";
import { ChangelogSeenMarker } from "@/components/shared/ChangelogSeenMarker";
import { EmptyState } from "@/components/shared/EmptyState";
import { CHANGELOG } from "@/lib/changelog";
import { requireSessionTenant } from "@/lib/tenant";
import { Sparkles } from "lucide-react";

/**
 * "O que há de novo" (Fase 2 — Retenção).
 *
 * Rota em vez de sheet: o roadmap pede um painel com badge no menu, e uma
 * página tem URL própria — dá para linkar, marcar com o navegador e voltar
 * depois sem perder o lugar. Um sheet aninhado dentro do item de menu
 * esconderia o conteúdo atrás de um estado que morre com o clique.
 *
 * Server component: a lista é dado estático (`CHANGELOG`), não precisa de
 * JS para render. Só a marcação de "visto" é client, e ela mora num island.
 */
export default async function NovidadesPage() {
  const { tenant } = await requireSessionTenant("/dashboard/novidades");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-5 md:gap-6 md:px-6 md:py-8">
      <ChangelogSeenMarker />

      <PageHeader
        title="O que há de novo"
        badge={tenant.name}
        description="As entregas mais recentes do BoraMais, da mais nova para a mais antiga."
      />

      {CHANGELOG.length === 0 ? (
        <EmptyState
          title="Nada novo por enquanto"
          description="Quando lançarmos algo, aparece aqui."
          icon={Sparkles}
        />
      ) : (
        <ol className="flex flex-col gap-4">
          {CHANGELOG.map((release) => (
            <li
              key={release.version}
              className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-baseline gap-2">
                <h2 className="font-heading text-base font-semibold text-foreground">
                  {release.label}
                </h2>
              </div>
              <ul className="flex flex-col gap-2">
                {release.entries.map((entry) => (
                  <li key={entry.text} className="flex gap-2.5 text-sm text-foreground">
                    <span
                      aria-hidden="true"
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--brand)]"
                    />
                    <span>{entry.text}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}