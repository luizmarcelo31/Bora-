import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TableCard } from "@/components/shared/TableCard";
import { SelectField } from "@/components/ui/select-field";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { createUserAction } from "@/app/admin/actions";

const ROLES = ["OWNER", "MANAGER", "FINANCIAL", "STOCK", "CASHIER", "STAFF", "SUPER_ADMIN"];

const ERROR_MSG: Record<string, string> = {
  invalid: "Dados inválidos. Verifique email, nome e role.",
  tenant: "Empresa inválida.",
  duplicate: "Este email já existe nesta empresa.",
  root: "A conta raiz não pode ser duplicada nem alterada.",
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
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
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
              Role*
              <SelectField
                name="role"
                required
                defaultValue="STAFF"
                options={ROLES.map((r) => ({ value: r, label: r }))}
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
          description="Role e vínculo por empresa."
          footer={`${users.length} usuário(s)`}
        >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.tenant.name}</TableCell>
                <TableCell>{u.role}</TableCell>
                <TableCell>
                  <StatusBadge status={u.active ? "active" : "inactive"} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </TableCard>
      )}
    </main>
  );
}
