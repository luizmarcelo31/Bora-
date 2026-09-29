"use client";

import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type FilterTabOption = {
  value: string;
  label: string;
  href: string;
};

/**
 * Tabs de filtro baseadas em URL (navegação server-side via router.push).
 * Substitui pills manuais de <a> mantendo o estado no searchParams.
 *
 * Roadmap Fase 1.3 — "Filter chips: estilo pill, ativo em laranja/day e
 * branco/dark". O estilo fica aqui, e não no `ui/tabs`, porque Tabs é
 * genérico e mudar lá afetaria todos os tabs da aplicação.
 */
export function FilterTabs({
  value,
  options,
}: {
  value: string;
  options: FilterTabOption[];
}) {
  const router = useRouter();

  return (
    <Tabs
      value={value}
      onValueChange={(v) => {
        const opt = options.find((o) => o.value === v);
        if (opt && opt.value !== value) router.push(opt.href);
      }}
    >
      <TabsList
        className="h-auto w-fit flex-wrap justify-start gap-1.5 rounded-full bg-transparent p-0"
      >
        {options.map((o) => (
          <TabsTrigger
            key={o.value}
            value={o.value}
            className={
              "rounded-full border border-border px-3.5 py-1 text-sm whitespace-nowrap " +
              "data-[state=active]:border-primary data-[state=active]:bg-primary " +
              "data-[state=active]:text-primary-foreground " +
              "dark:data-[state=active]:border-sidebar-primary dark:data-[state=active]:bg-sidebar-primary " +
              "dark:data-[state=active]:text-sidebar-primary-foreground"
            }
          >
            {o.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
