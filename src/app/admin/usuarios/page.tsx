import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { createUserAction } from "@/app/admin/actions";

const ROLES = ["OWNER", "MANAGER", "FINANCIAL", "STOCK", "CASHIER", "STAFF", "SUPER_ADMIN"];

const ERROR_MSG: Record<string, string> = {
  invalid: "Dados inválidos. Verifique email, nome e role.",
  tenant: "Empresa inválida.",
  duplicate: "Este email já existe nesta empresa.",
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
    <main className="flex flex-col gap-6">
      <PageHeader title="Usuários" description="Todos os usuários da plataforma." />

      <Card>
        <CardHeader>
          <CardTitle>Novo usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createUserAction} className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              Empresa*
              <select
                name="tenantId"
                required
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                defaultValue=""
              >
                <option value="" disabled>
                  Selecione...
                </option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Role*
              <select
                name="role"
                required
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                defaultValue="STAFF"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
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
        <Table>
          <THead>
            <TR>
              <TH>Nome</TH>
              <TH>Email</TH>
              <TH>Empresa</TH>
              <TH>Role</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {users.map((u) => (
              <TR key={u.id}>
                <TD>{u.name}</TD>
                <TD>{u.email}</TD>
                <TD>{u.tenant.name}</TD>
                <TD>{u.role}</TD>
                <TD>{u.active ? "Ativo" : "Inativo"}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </main>
  );
}
