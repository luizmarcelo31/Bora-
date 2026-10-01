"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ONBOARDING_EVENT, hasSeenWelcome, markWelcomeSeen } from "@/lib/onboarding-seen";

/**
 * Boas-vindas do primeiro acesso (Fase 2 — Onboarding).
 *
 * Aparece uma vez e usa o nome do operador, porque o roadmap pede o nome e
 * porque "Bem-vindo, Luiz" responde a pergunta que a pessoa já está fazendo —
 * "isto é meu?".
 *
 * Não abre sozinha de forma assíncrona no mount: renderizamos o `Dialog` só
 * depois de ler o storage, senão o servidor entrega `false` e o dialog fecha
 * antes de piscar na tela. `useSyncExternalStore` com snapshot de servidor
 * resolve — o servidor assume "não viu", e o cliente corrige na hidratação.
 */

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener(ONBOARDING_EVENT, onStoreChange);

  return () => {
    window.removeEventListener(ONBOARDING_EVENT, onStoreChange);
  };
}

function getSnapshot(): boolean {
  return hasSeenWelcome();
}

/** No servidor tratamos como "não viu", para aparecer na primeira render. */
function getServerSnapshot(): boolean {
  return false;
}

/** Primeiro nome do operador; cai para um tratamento neutro se não houver. */
function primeiroNome(nome: string | null | undefined): string {
  const trimmed = (nome ?? "").trim();

  if (!trimmed) {
    return "";
  }

  return trimmed.split(/\s+/)[0] ?? trimmed;
}

export function OnboardingWelcome({ operatorName }: { operatorName: string | null }) {
  const seen = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const nome = primeiroNome(operatorName);

  if (seen) {
    return null;
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        // Fechar por qualquer via (botão, Esc, clique fora) conta como visto:
        // mais honesto do que reexibir para quem já leu uma vez.
        if (!open) {
          markWelcomeSeen();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-semibold">
            {nome ? `Bem-vindo, ${nome}` : "Bem-vindo ao BoraMais"}
          </DialogTitle>
          <DialogDescription>
            Três passos curtos deixam a loja pronta para vender: cadastrar produto, fazer
            uma venda e abrir o relatório.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button asChild onClick={markWelcomeSeen}>
            <Link href="/dashboard/produtos">Cadastrar produto</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}