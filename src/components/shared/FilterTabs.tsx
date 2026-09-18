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
      <TabsList>
        {options.map((o) => (
          <TabsTrigger key={o.value} value={o.value}>
            {o.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
