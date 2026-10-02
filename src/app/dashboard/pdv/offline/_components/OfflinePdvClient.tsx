"use client";

import { useEffect, useMemo, useState } from "react";
import { CloudOff, Search, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { formatCurrency } from "@/lib/validators";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SyncIndicator } from "@/components/offline/SyncIndicator";
import { enviarOuEnfileirar } from "@/lib/offline/enviar";
import { lerCatalogo, type CatalogoProduto } from "@/lib/offline/queue";

/**
 * PDV sem rede (Fase 3.1 — ADR-006 §2).
 *
 * ## Por que esta rota existe separada
 *
 * `/dashboard/pdv/express` é Server Component: com a rede caída, a leitura de
 * Prisma não acontece e a tela não renderiza. Um service worker que servisse o
 * app shell teria que cachear payload RSC, cuja chave depende de headers e
 * versão de build — entrada velha devolve tela com estado de servidor
 * obsoleto. Uma rota client-side que lê o catálogo do `localStorage` não tem
 * nenhum dos dois problemas.
 *
 * ## O que esta tela NÃO faz
 *
 * Cadastrar produto, mexer em caixa, ver relatório. ADR-006 §1: só a venda é
 * offline. Cadastrar produto sem rede cria estoque fantasma sem forma de
 * auditar; mexer em caixa cria saldo sem conferência.
 *
 * ## O preço
 *
 * O número mostrado vem do snapshot e serve para cobrar no balcão. Quem
 * decide o preço gravado é o servidor, no sync (ADR-006 §6) — por isso o aviso
 * no rodapé, e por isso uma divergência de preço aparece como problema de
 * caixa para o gerente, nunca como venda registrada por menos.
 */

function gerarChave(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `k-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function OfflinePdvClient({ tenantId, userId }: { tenantId: number; userId: number }) {
  const [catalogo, setCatalogo] = useState<CatalogoProduto[]>([]);
  const [carregado, setCarregado] = useState(false);
  const [busca, setBusca] = useState("");
  const [carrinho, setCarrinho] = useState<Record<number, number>>({});
  const [pagamento, setPagamento] = useState("DINHEIRO");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    setCatalogo(lerCatalogo(tenantId));
    setCarregado(true);
  }, [tenantId]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return catalogo;
    return catalogo.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.barcode ?? "").includes(q)
    );
  }, [busca, catalogo]);

  const linhas = useMemo(
    () =>
      Object.entries(carrinho)
        .map(([id, qty]) => {
          const p = catalogo.find((x) => x.id === Number(id));
          return p && qty > 0 ? { ...p, qty, total: p.price * qty } : null;
        })
        .filter((l): l is NonNullable<typeof l> => l !== null),
    [carrinho, catalogo]
  );

  const total = linhas.reduce((s, l) => s + l.total, 0);

  function adicionar(id: number) {
    setCarrinho((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  }

  function limpar() {
    setCarrinho({});
  }

  async function confirmar() {
    if (enviando || linhas.length === 0) return;
    setEnviando(true);
    try {
      const res = await enviarOuEnfileirar(
        {
          items: linhas.map((l) => ({ productId: l.id, quantity: l.qty })),
          paymentMethod: pagamento,
          discount: 0,
          customerName: "",
          tenantId,
          userId,
        },
        gerarChave()
      );

      if (res.tipo === "venda") {
        // A rede voltou entre a tela abrir e o clique: gravou no banco.
        toast.success(`Venda #${res.saleId} registrada.`);
        limpar();
        return;
      }

      if (res.tipo === "rejeitada") {
        toast.error("O servidor recusou a venda. Confira os itens e tente de novo.");
        return;
      }

      if (res.motivo) {
        toast.error(
          res.motivo === "cheia"
            ? "A fila de vendas está cheia. Esta venda NÃO foi salva — anote o total e sincronize antes de continuar."
            : "O aparelho está sem espaço. Esta venda NÃO foi registrada — anote o total."
        );
        return;
      }

      toast.warning("Venda salva no aparelho. Sincroniza quando a rede voltar.", { duration: 6000 });
      limpar();
    } finally {
      setEnviando(false);
    }
  }

  if (carregado && catalogo.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sem catálogo neste aparelho</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Abra o PDV com a internet uma vez para guardar os produtos neste aparelho. A partir daí
            dá para vender sem conexão.
          </p>
          <Button asChild>
            <a href="/dashboard/pdv/express">Abrir PDV Expresso</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <SyncIndicator tenantId={tenantId} userId={userId} />

      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
        <CloudOff aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        <span>
          <span className="font-semibold">Vendendo sem conexão.</span> As vendas ficam salvas neste
          aparelho e sincronizam sozinhas quando a rede voltar.
        </span>
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Produtos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar produto"
                aria-label="Buscar produto"
              />
            </div>
            <ul className="grid max-h-[50vh] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
              {filtrados.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => adicionar(p.id)}
                    className="flex h-full w-full flex-col gap-1 rounded-lg border border-border bg-card p-2 text-left hover:bg-accent"
                  >
                    <span className="text-sm font-semibold leading-tight">{p.name}</span>
                    <span className="text-sm tabular-nums">{formatCurrency(p.price)}</span>
                    {carrinho[p.id] ? (
                      <Badge variant="default" className="mt-1 self-start">
                        {carrinho[p.id]} no carrinho
                      </Badge>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
            {filtrados.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum produto encontrado para &quot;{busca}&quot;.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart aria-hidden="true" className="size-4" />
              Venda
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {linhas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Toque nos produtos para montar a venda.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {linhas.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 flex-1 truncate">
                      {l.qty}× {l.name}
                    </span>
                    <span className="tabular-nums">{formatCurrency(l.total)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCarrinho((c) => ({ ...c, [l.id]: l.qty - 1 }))}
                      aria-label={`Remover ${l.name}`}
                    >
                      −
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center justify-between border-t border-border pt-2 text-base font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(total)}</span>
            </div>

            <label className="flex flex-col gap-1 text-sm">
              Pagamento
              <select
                value={pagamento}
                onChange={(e) => setPagamento(e.target.value)}
                className="h-9 rounded-md border border-border bg-card px-2 text-sm"
              >
                <option value="DINHEIRO">Dinheiro</option>
                <option value="PIX">Pix</option>
                <option value="CREDITO">Cartão de crédito</option>
                <option value="DEBITO">Cartão de débito</option>
              </select>
            </label>

            <div className="flex gap-2">
              <Button variant="outline" onClick={limpar} disabled={linhas.length === 0}>
                Limpar
              </Button>
              <Button className="flex-1" onClick={() => void confirmar()} disabled={enviando || linhas.length === 0}>
                {enviando ? "Salvando" : "Confirmar venda"}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              O preço cobrado aqui é o do último acesso com internet. O servidor confirma o valor
              final ao sincronizar.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
