"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, LayoutDashboard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { adminNav } from "@/navigation/admin-nav";

const ALL_ROUTES = adminNav.flatMap((g) =>
  g.items.flatMap((item) =>
    "url" in item && item.url
      ? [{ title: item.title, url: item.url, Icon: item.icon ?? LayoutDashboard }]
      : []
  )
);

function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Busca do header /admin: filtra rotas da plataforma (local) e,
 * com texto livre, leva para Empresas filtradas (?q=).
 */
export function AdminSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");

  const matches = useMemo(() => {
    const q = norm(value.trim());
    if (q.length < 2) return [];
    return ALL_ROUTES.filter((r) => norm(r.title).includes(q)).slice(0, 5);
  }, [value]);

  function go(url: string) {
    setValue("");
    router.push(url);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (matches.length > 0 && norm(matches[0].title) === norm(q)) {
      go(matches[0].url);
      return;
    }
    if (q) go(`/admin/empresas?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={onSubmit} className="relative hidden md:block" role="search">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar na plataforma..."
        aria-label="Busca da plataforma"
        className="h-9 w-44 pl-8 lg:w-56"
      />
      {matches.length > 0 ? (
        <div className="absolute top-10 right-0 z-50 w-64 overflow-hidden rounded-lg border bg-popover shadow-lg">
          {matches.map((m) => (
            <button
              key={m.url}
              type="button"
              onClick={() => go(m.url)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
            >
              <m.Icon className="size-4 text-muted-foreground" />
              {m.title}
            </button>
          ))}
        </div>
      ) : null}
    </form>
  );
}
