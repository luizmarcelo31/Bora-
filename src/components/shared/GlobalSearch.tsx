"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Package, Tag, LayoutDashboard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { tenantNav } from "@/navigation/tenant-nav";
import { formatCurrency } from "@/lib/validators";

type ApiProduct = { id: number; name: string; price: number; active: boolean };
type ApiCategory = { id: number; name: string; kind: string };

const ALL_ROUTES = tenantNav.flatMap((g) =>
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
 * Busca global do header: "Empresa - ( search )".
 * Filtra rotas (local), produtos e categorias (API /api/search) do tenant.
 * "/" foca o campo. Enter abre o primeiro resultado.
 */
export function GlobalSearch({ tenantId }: { tenantId: number }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const q = value.trim();
    if (q.length < 2) {
      setProducts([]);
      setCategories([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&tenantId=${tenantId}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products ?? []);
          setCategories(data.categories ?? []);
        }
      } catch {
        // mantém resultados anteriores
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value, tenantId]);

  const routes = useMemo(() => {
    const q = norm(value.trim());
    if (!q) return ALL_ROUTES.slice(0, 5);
    return ALL_ROUTES.filter((r) => norm(r.title).includes(q)).slice(0, 5);
  }, [value]);

  function go(href: string) {
    setOpen(false);
    setValue("");
    inputRef.current?.blur();
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      const q = value.trim();
      if (routes.length > 0 && q.length > 0) go(routes[0].url);
      else if (products.length > 0) go(`/dashboard/produtos?q=${encodeURIComponent(products[0].name)}`);
      else if (categories.length > 0) {
        const c = categories[0];
        go(c.kind === "PRODUCT" ? `/dashboard/produtos?cat=${encodeURIComponent(c.name)}` : `/dashboard/financeiro?q=${encodeURIComponent(c.name)}`);
      }
    }
  }

  const showResults = open && (value.trim().length > 0 || routes.length > 0);
  const empty =
    value.trim().length >= 2 && !loading && routes.length === 0 && products.length === 0 && categories.length === 0;

  return (
    <Popover open={showResults} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative w-36 sm:w-52 md:w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Buscar..."
            className="h-9 pl-8 pr-10"
            role="combobox"
            aria-expanded={showResults}
            aria-label="Busca global"
          />
          <span className="absolute right-2 top-1/2 hidden -translate-y-1/2 sm:block">
            {loading ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : <Kbd>/</Kbd>}
          </span>
        </div>
      </PopoverAnchor>
      <PopoverContent align="end" className="w-72 p-1.5 md:w-80" onOpenAutoFocus={(e) => e.preventDefault()}>
        {routes.length > 0 ? (
          <div className="flex flex-col">
            <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Rotas</p>
            {routes.map((r) => (
              <button
                key={r.url}
                type="button"
                onClick={() => go(r.url)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
              >
                <r.Icon className="size-4 shrink-0 text-muted-foreground" />
                {r.title}
              </button>
            ))}
          </div>
        ) : null}
        {products.length > 0 ? (
          <div className="flex flex-col">
            <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Produtos</p>
            {products.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => go(`/dashboard/produtos?q=${encodeURIComponent(p.name)}`)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
              >
                <Package className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">
                  {p.name}
                  {!p.active ? <span className="ml-1 text-xs text-muted-foreground">(inativo)</span> : null}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{formatCurrency(p.price)}</span>
              </button>
            ))}
          </div>
        ) : null}
        {categories.length > 0 ? (
          <div className="flex flex-col">
            <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Categorias</p>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() =>
                  go(
                    c.kind === "PRODUCT"
                      ? `/dashboard/produtos?cat=${encodeURIComponent(c.name)}`
                      : `/dashboard/financeiro?q=${encodeURIComponent(c.name)}`
                  )
                }
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
              >
                <Tag className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{c.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {c.kind === "PRODUCT" ? "Produto" : "Financeiro"}
                </span>
              </button>
            ))}
          </div>
        ) : null}
        {loading ? <p className="px-2 py-2 text-sm text-muted-foreground">Buscando…</p> : null}
        {empty ? <p className="px-2 py-2 text-sm text-muted-foreground">Nenhum resultado.</p> : null}
      </PopoverContent>
    </Popover>
  );
}
