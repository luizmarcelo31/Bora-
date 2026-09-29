"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppSheet } from "@/components/ui/app-sheet";
import { FormSheet } from "@/components/ui/form-sheet";
import { ConfirmSheet } from "@/components/ui/confirm-sheet";
import { PageHeader } from "@/components/shared/PageHeader";

/**
 * REMOVÍVEL — página de teste dos sheets T2 (spec MOBILE-UX 3.2-3.4).
 * Apagar antes de entregar. Não linkar em nenhuma navegação.
 */
export default function SheetsTestPage() {
  const [app, setApp] = useState(false);
  const [form, setForm] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [name, setName] = useState("");
  const [log, setLog] = useState<string[]>([]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-5">
      <PageHeader title="Teste de sheets (remover)" description="T2: AppSheet, FormSheet, ConfirmSheet." />
      <div className="flex flex-col gap-2">
        <Button onClick={() => setApp(true)}>Abrir AppSheet</Button>
        <Button onClick={() => setForm(true)}>Abrir FormSheet</Button>
        <Button onClick={() => setConfirm(true)}>Abrir ConfirmSheet</Button>
      </div>
      <ul className="text-sm text-muted-foreground">
        {log.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>

      <AppSheet
        open={app}
        onOpenChange={setApp}
        title="AppSheet demo"
        description="Cabeçalho fixo, corpo com scroll, rodapé fixo."
        footer={
          <Button className="h-12 w-full text-base font-semibold" onClick={() => setApp(false)}>
            Fechar
          </Button>
        }
      >
        <p className="text-sm">Corpo rolável. Arraste pela alça para fechar.</p>
        {Array.from({ length: 30 }, (_, i) => (
          <p key={i} className="text-sm text-muted-foreground">
            Linha {i + 1} para forçar scroll.
          </p>
        ))}
      </AppSheet>

      <FormSheet
        open={form}
        onOpenChange={setForm}
        title="FormSheet demo"
        description="Guarda de alterações ativa."
        submitLabel="Salvar teste"
        pending={false}
        dirty={name.trim().length > 0}
        onSubmit={() => setLog((l) => [...l, `salvo: ${name}`])}
      >
        <label className="flex flex-col gap-1 text-sm">
          Nome
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Digite algo" />
        </label>
      </FormSheet>

      <ConfirmSheet
        open={confirm}
        onOpenChange={setConfirm}
        title="Excluir teste?"
        consequence="Isso devolveria 3 itens ao estoque."
        destructiveLabel="Excluir"
        options={["Motivo A", "Motivo B"]}
        onConfirm={(c) => {
          setLog((l) => [...l, `confirmado: ${c}`]);
          setConfirm(false);
        }}
      />
    </main>
  );
}
