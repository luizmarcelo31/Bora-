"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CreditCard, LifeBuoy, Megaphone, Plus, Search, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminRoutes } from "@/navigation/admin-nav";
import { cn } from "@/lib/utils";

/** Remove acentos e caixa: "Empresas" casa com "empresas" e "empresa". */
function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

type Acao = {
  id: string;
  titulo: string;
  descricao: string;
  url: string;
  Icon: typeof Search;
  termos: string;
};

const ACOES: Acao[] = [
  {
    id: "nova-empresa",
    titulo: "Nova empresa",
    descricao: "Cadastrar uma empresa na plataforma",
    url: "/admin/empresas?novo=1",
    Icon: Plus,
    termos: "criar empresa adicionar cliente novo tenant",
  },
  {
    id: "novo-usuario",
    titulo: "Novo usuário",
    descricao: "Vincular um usuário a uma empresa",
    url: "/admin/usuarios?novo=1",
    Icon: Plus,
    termos: "criar usuario adicionar pessoa equipe",
  },
  {
    id: "novo-plano",
    titulo: "Novo plano",
    descricao: "Criar um plano comercial",
    url: "/admin/planos?novo=1",
    Icon: CreditCard,
    termos: "criar plano preco produto comercial",
  },
  {
    id: "assinaturas",
    titulo: "Assinaturas",
    descricao: "Mudar plano, suspender ou reativar",
    url: "/admin/assinaturas",
    Icon: CreditCard,
    termos: "assinatura mensal anual renovar cancelar mrf",
  },
  {
    id: "suporte",
    titulo: "Tickets de suporte",
    descricao: "Abrir e acompanhar chamados",
    url: "/admin/suporte",
    Icon: LifeBuoy,
    termos: "ticket chamado suporte problema ajuda",
  },
  {
    id: "comunicacao",
    titulo: "Enviar comunicação",
    descricao: "Avisar empresas por segmento",
    url: "/admin/notificacoes",
    Icon: Megaphone,
    termos: "notificacao aviso email comunicado broadcast",
  },
  {
    id: "auditoria",
    titulo: "Auditoria da plataforma",
    descricao: "Ver o que o admin fez",
    url: "/admin/auditoria",
    Icon: Settings,
    termos: "auditoria log historico acoes rastreio",
  },
  {
    id: "empresas",
    titulo: "Empresas",
    descricao: "Lista e situação de cada empresa",
    url: "/admin/empresas",
    Icon: Building2,
    termos: "empresa cliente tenant listar",
  },
];

/**
 * Busca global da área do admin: rotas e ações de plataforma, em um
 * único atalho (Ctrl/Cmd+K). Sem isso, operar a plataforma vira caçar
 * link no menu.
 */
export function AdminCommandPalette() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setAberto((v) => !v);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const resultados = useMemo(() => {
    const q = norm(busca.trim());
    const rotas = adminRoutes.map((r) => ({
      id: `rota:${r.url}`,
      titulo: r.title,
      descricao: r.group,
      url: r.url,
      Icon: r.icon ?? Search,
      termos: norm(`${r.title} ${r.group}`),
    }));
    const acoes = ACOES.map((a) => ({
      id: `acao:${a.id}`,
      titulo: a.titulo,
      descricao: a.descricao,
      url: a.url,
      Icon: a.Icon,
      termos: norm(`${a.titulo} ${a.termos}`),
    }));
    const tudo = [...acoes, ...rotas];
    if (q.length < 2) return tudo.slice(0, 8);
    return tudo.filter((r) => norm(r.termos).includes(q)).slice(0, 10);
  }, [busca]);

  const abrir = useCallback(() => {
    setBusca("");
    setSelecionado(0);
  }, []);

  function ir(url: string) {
    setAberto(false);
    abrir();
    router.push(url);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelecionado((i) => (resultados.length === 0 ? 0 : (i + 1) % resultados.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelecionado((i) => (resultados.length === 0 ? 0 : (i - 1 + resultados.length) % resultados.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const alvo = resultados[selecionado];
      if (alvo) ir(alvo.url);
    }
  }

  return (
    <Dialog
      open={aberto}
      onOpenChange={(v) => {
        setAberto(v);
        if (v) abrir();
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="hidden h-8 gap-2 px-2.5 text-muted-foreground sm:inline-flex"
        >
          <Search aria-hidden="true" className="size-3.5" />
          <span className="text-xs">Buscar…</span>
          <kbd className="pointer-events-none rounded border bg-muted px-1 font-mono text-[10px]">
            Ctrl K
          </kbd>
        </Button>
      </DialogTrigger>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Buscar na plataforma"
          className="size-8 sm:hidden"
        >
          <Search aria-hidden="true" className="size-3.5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader className="sr-only">
          <DialogTitle>Buscar na plataforma</DialogTitle>
          <DialogDescription>
            Navegue por páginas e ações do painel de administração.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            ref={inputRef}
            autoFocus
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setSelecionado(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Buscar páginas e ações…"
            aria-label="Buscar páginas e ações"
            className="h-10 pl-8"
          />
        </div>

        <ul className="max-h-80 overflow-y-auto" role="listbox" aria-label="Resultados">
          {resultados.length === 0 ? (
            <li className="px-2 py-6 text-center text-sm text-muted-foreground">
              Nada encontrado para “{busca}”.
            </li>
          ) : (
            resultados.map((r, i) => (
              <li key={r.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={i === selecionado}
                  onMouseEnter={() => setSelecionado(i)}
                  onClick={() => ir(r.url)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors",
                    i === selecionado ? "bg-accent text-accent-foreground" : "hover:bg-accent/60"
                  )}
                >
                  <r.Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{r.titulo}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {r.descricao}
                    </span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>

        <p className="text-xs text-muted-foreground">
          <kbd className="rounded border bg-muted px-1 font-mono">↑</kbd>{" "}
          <kbd className="rounded border bg-muted px-1 font-mono">↓</kbd> navegar ·{" "}
          <kbd className="rounded border bg-muted px-1 font-mono">Enter</kbd> abrir ·{" "}
          <kbd className="rounded border bg-muted px-1 font-mono">Esc</kbd> fechar
        </p>
      </DialogContent>
    </Dialog>
  );
}
