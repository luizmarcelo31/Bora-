import { requireSuperAdmin } from "@/lib/admin";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { FUNCAO_PERMISSOES, PERMISSAO_LABEL, type Permissao } from "@/lib/permissions";
import { funcaoLabel } from "@/lib/labels";
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
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <PageHeader
        title="Permissões"
        description="O que cada função pode fazer em uma empresa. Definida em src/lib/permissions.ts."
      />
      <div className="overflow-x-auto rounded-xl border border-border/50">
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
                <TableCell className="font-medium">{PERMISSAO_LABEL[perm]}</TableCell>
                {FUNCOES.map((f) => (
                  <TableCell key={f}>
                    <span aria-hidden="true">
                      {FUNCAO_PERMISSOES[f].includes(perm) ? "✅" : "—"}
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
