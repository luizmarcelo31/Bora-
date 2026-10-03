"use client";

import { useState } from "react";
import { Moon, Sun, Package, ShoppingCart, Users } from "lucide-react";
import { MobileCard } from "@/components/mobile/MobileCard";
import { MobileList } from "@/components/mobile/MobileList";
import { MobileChips } from "@/components/mobile/MobileChips";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileActionBar } from "@/components/mobile/MobileActionBar";
import { MobileSkeleton } from "@/components/mobile/MobileSkeleton";
import { MobileEmptyState } from "@/components/mobile/MobileEmptyState";
import { MobileStepper } from "@/components/mobile/MobileStepper";
import { Button } from "@/components/ui/button";

/**
 * Showcase de componentes mobile.
 * Para visualização em 390px, dia e escuro.
 */
export default function MobileKitPage() {
  const [dark, setDark] = useState(false);
  const [chip, setChip] = useState("all");

  const listItems = [
    { id: "1", title: "Coca-Cola 2L", subtitle: "12 un · mín 5", value: "R$ 12,99" },
    { id: "2", title: "Heineken", subtitle: "8 un · mín 5", value: "R$ 12,93" },
    { id: "3", title: "Água Mineral 500ml", subtitle: "20 un · mín 10", value: "R$ 6,00" },
  ];

  const chipOptions = [
    { value: "all", label: "Todos" },
    { value: "low", label: "Baixo" },
    { value: "ok", label: "Ok" },
  ];

  const stepperSteps = [
    { label: "Produtos", status: "completed" as const },
    { label: "Pagamento", status: "active" as const },
    { label: "Confirmar", status: "pending" as const },
  ];

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-50 flex h-12 items-center justify-between border-b border-border bg-background px-4">
          <h1 className="text-base font-semibold text-foreground">Mobile Kit</h1>
          <button
            onClick={() => setDark(!dark)}
            className="flex size-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
            aria-label="Alternar tema"
          >
            {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>
        </div>

        <div className="flex flex-col gap-6 p-4 pb-24">
          {/* Card compacto */}
          <section>
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
              Card compacto
            </h2>
            <div className="flex flex-col gap-2">
              <MobileCard
                title="Produtos"
                subtitle="3 itens cadastrados"
                value="3"
                icon={Package}
              />
              <MobileCard
                title="Vendas hoje"
                subtitle="R$ 1.234,56"
                value="12"
                icon={ShoppingCart}
              />
              <MobileCard
                title="Clientes"
                subtitle="Total ativos"
                value="322"
                icon={Users}
              />
            </div>
          </section>

          {/* Lista-em-card */}
          <section>
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
              Lista-em-card
            </h2>
            <MobileList items={listItems} />
          </section>

          {/* Chips */}
          <section>
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
              Chips
            </h2>
            <MobileChips
              options={chipOptions}
              value={chip}
              onChange={setChip}
            />
          </section>

          {/* Header */}
          <section>
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
              Header
            </h2>
            <MobileHeader
              title="Título da página"
              subtitle="Subtítulo opcional"
              onBack={() => {}}
              actions={
                <button className="flex size-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted">
                  <Sun className="size-5" />
                </button>
              }
            />
          </section>

          {/* ActionBar */}
          <section>
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
              ActionBar
            </h2>
            <div className="flex flex-col gap-2">
              <MobileActionBar label="Confirmar venda" onClick={() => {}} />
              <MobileActionBar label="Cancelar" variant="secondary" onClick={() => {}} />
              <MobileActionBar label="Excluir" variant="destructive" onClick={() => {}} />
            </div>
          </section>

          {/* Skeleton */}
          <section>
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
              Skeleton
            </h2>
            <div className="flex flex-col gap-2">
              <MobileSkeleton height="20px" width="60%" />
              <MobileSkeleton height="14px" width="100%" />
              <MobileSkeleton height="14px" width="80%" />
            </div>
          </section>

          {/* EmptyState */}
          <section>
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
              EmptyState
            </h2>
            <MobileEmptyState
              icon={Package}
              title="Nenhum produto"
              description="Cadastre o primeiro produto para começar."
              action={
                <Button size="sm">Cadastrar produto</Button>
              }
            />
          </section>

          {/* Stepper */}
          <section>
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
              Stepper
            </h2>
            <div className="rounded-xl border border-border bg-card p-3">
              <MobileStepper
                steps={stepperSteps}
                currentStep={1}
              />
            </div>
          </section>
        </div>

        {/* Barra de ação fixa (demo) */}
        <MobileActionBar label="Cobrar R$ 38,91" onClick={() => {}} />
      </div>
    </div>
  );
}
