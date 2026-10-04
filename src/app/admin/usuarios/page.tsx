import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LinhaLista } from "@/components/shared/LinhaLista";
import { TableCard } from "@/components/shared/TableCard";
import { Badge } from "@/components/ui/badge";
import { SelectField } from "@/components/ui/select-field";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { createUserAction } from "@/app/admin/actions";
import { funcaoLabel } from "@/lib/labels";
import type { Funcao } from "@prisma/client";

const FUNCOES: Funcao[] = [
  "PROPRIETARIO",
  "GERENTE",
  "FINANCEIRO",
  "ESTOQUISTA",
  "CAIXA",
  "FUNCIONARIO",
  "SUPER_ADMIN",
];

const ERROR_MSG: Record<string, string> = {
  invalid: "Dados inválidos. Verifique email, nome e função.",
  tenant: "Empresa inválida.",
  duplicate: "Este email já existe nesta empresa.",
  root: "A conta raiz não pode ser duplicada nem alterada.",
  limite: "Limite de usuários do plano atingido nesta empresa.",
};

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  await requireSuperAdmin();
  const params = await searchParams;

  const [users, tenants] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { tenant: { select: { id: true, name: true } } },
    }),
    prisma.tenant.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-5 md:gap-6 md:px-6 md:py-8">
      <PageHeader title="Usuários" description="Todos os usuários da plataforma." />

      <Card>
        <CardHeader>
          <CardTitle>Novo usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createUserAction} className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              Empresa*
              <SelectField
                name="tenantId"
                required
                placeholder="Selecione..."
                options={tenants.map((t) => ({ value: String(t.id), label: t.name }))}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Função*
              <SelectField
                name="role"
                required
                defaultValue="FUNCIONARIO"
                options={FUNCOES.map((f) => ({ value: f, label: funcaoLabel[f] }))}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Nome*
              <Input name="name" required placeholder="Nome completo" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Email*
              <Input name="email" type="email" required placeholder="voce@empresa.com" />
            </label>
            {params.error ? (
              <p className="text-sm text-destructive sm:col-span-2">
                {ERROR_MSG[params.error] ?? "Não foi possível criar."}
              </p>
            ) : null}
            {params.ok ? (
              <p className="text-sm text-muted-foreground sm:col-span-2">
                Usuário criado. Ele deve se cadastrar no /signup com o mesmo email para ativar o acesso.
              </p>
            ) : null}
            <div className="sm:col-span-2">
              <Button type="submit">Criar usuário</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {users.length === 0 ? (
        <EmptyState title="Nenhum usuário" description="Crie o primeiro acima." />
      ) : (
        <TableCard
          title="Usuários da plataforma"
          description="Função e vínculo por empresa."
          footer={`${users.length} usuário(s)`}
        >
        {/* Mobile: lista compacta — tabela só no desktop */}
        <ul className="flex flex-col gap-2 p-3 md:hidden">
          {users.map((u) => (
            <li key={u.id}>
              <LinhaLista
                titulo={u.name}
                apoio={`${u.email} · ${u.tenant.name}`}
                badges={
                  <>
                    <Badge variant="outline">{funcaoLabel[u.role]}</Badge>
                    {/* "Ativo" em toda linha é ruído: numa lista de usuários
                        quase todos estão ativos, e o selo que se repete para
                        sempre deixa de ser lido. Só o inativo é informação. */}
                    {!u.active ? <StatusBadge status="inactive" /> : null}
                  </>
                }
              />
            </li>
          ))}
        </ul>
        <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.tenant.name}</TableCell>
                <TableCell>{funcaoLabel[u.role]}</TableCell>
                <TableCell>
                  <StatusBadge status={u.active ? "active" : "inactive"} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
        </TableCard>
      )}
    </main>
  );
}
