import { requireSuperAdmin } from "@/lib/admin";
import { PageHeader } from "@/components/shared/PageHeader";
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { LinhaLista } from "@/components/shared/LinhaLista";
import { FUNCAO_PERMISSOES, PERMISSAO_LABEL, type Permissao } from "@/lib/permissions";
import { funcaoLabel } from "@/lib/labels";
import { Check, Minus } from "lucide-react";
import type { Funcao } from "@prisma/client";

/** Funcoes de empresa: SUPER_ADMIN fica de fora, e controlado na plataforma. */
const FUNCOES: Funcao[] = [
  "PROPRIETARIO",
  "GERENTE",
  "FINANCEIRO",
  "ESTOQUISTA",
  "CAIXA",
  "FUNCIONARIO",
];

const TODAS_PERMISSOES = Array.from(
  new Set<Permissao>(Object.values(FUNCAO_PERMISSOES).flat())
).sort();

export default async function PermissoesPage() {
  await requireSuperAdmin();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-5 md:gap-6 md:px-6 md:py-8">
      <AdminBreadcrumb items={[{ label: "Início", href: "/admin" }, { label: "Visão geral" }]} />
        <PageHeader
        title="Permissões"
        description="O que cada função pode fazer em uma empresa. Definida em src/lib/permissions.ts."
      />
      {/* Mobile: uma linha por permissão, com as 6 funções dentro do card.
          A tabela de 7 colunas exigiria scroll horizontal a 390px, e scroll
          lateral é aceito aqui só como último recurso — não como padrão. */}
      <ul className="flex flex-col gap-2 md:hidden">
        {TODAS_PERMISSOES.map((perm) => (
          <li key={perm}>
            <LinhaLista
              titulo={PERMISSAO_LABEL[perm]}
              badges={FUNCOES.map((f) => {
                const permitido = FUNCAO_PERMISSOES[f].includes(perm);
                return (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                  >
                    {permitido ? (
                      <Check
                        aria-hidden="true"
                        className="size-3.5 shrink-0 text-[var(--status-success-fg)]"
                      />
                    ) : (
                      <Minus aria-hidden="true" className="size-3.5 shrink-0" />
                    )}
                    {funcaoLabel[f]}
                    <span className="sr-only">
                      {permitido ? ": permitido" : ": não permitido"}
                    </span>
                  </span>
                );
              })}
            />
          </li>
        ))}
      </ul>

      {/* Desktop: a matriz alinhada continua sendo a melhor leitura. */}
      <div className="hidden overflow-x-auto rounded-xl border border-border/50 md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-56">Permissão</TableHead>
              {FUNCOES.map((f) => (
                <TableHead key={f} className="whitespace-nowrap">
                  {funcaoLabel[f]}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {TODAS_PERMISSOES.map((perm) => (
              <TableRow key={perm}>
                <TableCell className="font-semibold">{PERMISSAO_LABEL[perm]}</TableCell>
                {FUNCOES.map((f) => (
                  <TableCell key={f}>
                    <span aria-hidden="true">
                      {FUNCAO_PERMISSOES[f].includes(perm) ? (
                        <Check className="size-4 text-[var(--status-success-fg)]" />
                      ) : (
                        <Minus className="size-4 text-muted-foreground" />
                      )}
                    </span>
                    <span className="sr-only">
                      {FUNCAO_PERMISSOES[f].includes(perm) ? "permitido" : "não permitido"}
                    </span>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}



