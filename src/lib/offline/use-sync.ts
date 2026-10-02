"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { reconciliar } from "./reconcile";
import { FILA_EVENT, lerFila, remover, reenfileirar } from "./queue";
import { createSaleAction } from "@/app/dashboard/pdv/actions";
import type { ResultadoEnvio, VendaPendente } from "./types";

/**
 * Sincronização da fila offline (Fase 3.1 — ADR-006 §9).
 *
 * ## Sequencial, não paralelo
 *
 * Cada venda decrementa estoque e consome um número de cupom. Disparar várias
 * ao mesmo tempo transforma a reconciliação numa corrida pela sequência sem
 * ganho nenhum: a fila é de vendas de um operador, não milhares por segundo.
 *
 * ## Ordem dos gatilhos
 *
 * `online` e `visibilitychange` são o caminho comum (a rede volta, o operador
 * volta para a aba). O intervalo de 60s cobre o caso em que o navegador não
 * dispara `online` — `navigator.onLine` erra em rede captive, e o evento nem
 * sempre chega. O botão manual existe para não esperar.
 */

/** Intervalo de varredura enquanto houver pendência. */
const INTERVALO_MS = 60_000;

export type EstadoSync = "ocioso" | "sincronizando" | "pausado" | "erro";

export interface ResumoSync {
  estado: EstadoSync;
  pendentes: number;
  mensagem?: string;
  ultimaVenda?: number;
}

/** Converte a resposta da action no vocabulário do reconciliador. */
function paraResultado(res: { ok: number } | { error: string }): ResultadoEnvio {
  return "ok" in res ? { tipo: "aceita", saleId: res.ok } : { tipo: "rejeitada", erro: res.error };
}

/**
 * Envia uma venda da fila.
 *
 * Reenvia pela action com `offline=1` e o `occurredAt` original — é o que faz
 * o servidor aceitar estoque negativo e lançar a receita no dia certo.
 */
async function enviarPendente(venda: VendaPendente): Promise<ResultadoEnvio> {
  const fd = new FormData();
  fd.set("items", JSON.stringify(venda.items));
  fd.set("paymentMethod", venda.paymentMethod);
  if (venda.payments) fd.set("payments", JSON.stringify(venda.payments));
  if (venda.cashBoxId) fd.set("cashBoxId", String(venda.cashBoxId));
  fd.set("discount", String(venda.discount));
  if (venda.receivedAmount !== undefined) fd.set("received", String(venda.receivedAmount / 100));
  fd.set("customerName", venda.customerName);
  fd.set("idempotencyKey", venda.idempotencyKey);
  fd.set("offline", "1");
  fd.set("occurredAt", new Date(venda.occurredAt).toISOString());

  try {
    return paraResultado(await createSaleAction(fd));
  } catch (e) {
    // Rede caiu de novo no meio do sync. Reenfileira com backoff em vez de
    // tratar como recusa do servidor — são coisas bem diferentes.
    return { tipo: "erro_de_rede", causa: e instanceof Error ? e.message : "erro de rede" };
  }
}

export function useSync(tenantId: number, userId: number): ResumoSync & { sincronizar: () => Promise<void> } {
  const [pendentes, setPendentes] = useState(0);
  const [estado, setEstado] = useState<EstadoSync>("ocioso");
  const [mensagem, setMensagem] = useState<string | undefined>(undefined);
  const [ultimaVenda, setUltimaVenda] = useState<number | undefined>(undefined);

  // Trava de reentrância: `online` e o intervalo podem disparar juntos, e duas
  // varreduras simultâneas enviariam a mesma venda duas vezes. O
  // `idempotencyKey` tornaria isso inofensivo no banco, mas gastaria chamada e
  // esconderia bugs.
  const rodando = useRef(false);
  // Backoff por venda: o índice da fila não serve como contador porque remover
  // uma entrada desloca todas as outras.
  const esperas = useRef(new Map<string, number>());

  const sincronizar = useCallback(async () => {
    if (rodando.current || tenantId <= 0 || userId <= 0) {
      return;
    }

    const fila = lerFila(tenantId, userId);
    setPendentes(fila.length);

    if (fila.length === 0) {
      setEstado("ocioso");
      return;
    }

    rodando.current = true;
    setEstado("sincronizando");

    for (const venda of fila) {
      const espera = esperas.current.get(venda.idempotencyKey) ?? 0;
      if (Date.now() < espera) {
        continue; // ainda esperando o backoff desta venda
      }

      const resultado = await enviarPendente(venda);
      const decisao = reconciliar(venda, resultado, venda.tentativas);

      if (decisao.tipo === "remover") {
        remover(tenantId, userId, venda.idempotencyKey);
        esperas.current.delete(venda.idempotencyKey);
        if (decisao.saleId > 0) setUltimaVenda(decisao.saleId);
        continue;
      }

      if (decisao.tipo === "reenfileirar") {
        reenfileirar(tenantId, userId, venda, decisao.erro);
        esperas.current.set(venda.idempotencyKey, Date.now() + decisao.esperaMs);
        continue;
      }

      if (decisao.tipo === "pausar") {
        // Sessão expirada: preserva a fila inteira e para. Um login resolve,
        // e descartar venda por JWT vencido seria perder dinheiro.
        setEstado("pausado");
        setMensagem(decisao.motivo);
        break;
      }

      // Bloqueada: exige conferences manual. Fica na fila e o operador é
      // avisado — é o estado em que uma venda pode parar, e é preferível a
      // descartar.
      setEstado("erro");
      setMensagem(decisao.motivo);
      break;
    }

    rodando.current = false;
    const restante = lerFila(tenantId, userId).length;
    setPendentes(restante);
    if (restante === 0) {
      setEstado("ocioso");
      setMensagem(undefined);
    }
  }, [tenantId, userId]);

  // Lê a fila ao montar e a cada evento: enfileirar no PDV precisa aparecer no
  // indicador sem polling.
  useEffect(() => {
    const atualizar = () => setPendentes(lerFila(tenantId, userId).length);
    atualizar();
    window.addEventListener(FILA_EVENT, atualizar);
    return () => window.removeEventListener(FILA_EVENT, atualizar);
  }, [tenantId, userId]);

  // `online`: o caminho comum de reconexão.
  useEffect(() => {
    const aoVoltar = () => void sincronizar();
    window.addEventListener("online", aoVoltar);
    return () => window.removeEventListener("online", aoVoltar);
  }, [sincronizar]);

  // `visibilitychange`: o operador volta para a aba com vendas na fila. Sem
  // isto, a venda fica pendente até o próximo intervalo.
  useEffect(() => {
    const aoVoltar = () => {
      if (document.visibilityState === "visible") void sincronizar();
    };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => document.removeEventListener("visibilitychange", aoVoltar);
  }, [sincronizar]);

  // Varredura periódica: cobre o `online` que não chega (rede captive).
  useEffect(() => {
    if (pendentes === 0) return;
    const t = setInterval(() => void sincronizar(), INTERVALO_MS);
    return () => clearInterval(t);
  }, [pendentes, sincronizar]);

  return { estado, pendentes, mensagem, ultimaVenda, sincronizar };
}
